import "server-only";

import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { notify } from "@/lib/notifications/notify";
import { getUsageSummary, type Quota, type UsageSummary } from "@/lib/quota";
import { createAdminClient } from "@/lib/supabase/admin";

import { planOwners } from "./notify-expiry";
import { quotaLevel, type QuotaLevel } from "./quota-levels";

/**
 * Tell a learner they are close to, or out of, this month's allowance.
 *
 * THE WALL USED TO BE THE FIRST THEY HEARD OF IT. `quota_warning` and
 * `quota_exhausted` were in the notification enum from the first migration and
 * nothing ever raised them, so a free learner found the limit by pressing
 * "grade" on an essay they had just written. A day's notice at 80% is the
 * difference between "I should upgrade" and "this stopped working".
 *
 * A NIGHTLY SWEEP, NOT A HOOK ON EACH USE. Practice is counted in two repos —
 * the engine records its own listening and reading use — so a hook in the app
 * would only ever see half of it. Reading the totals once a night through
 * `getUsageSummary`, the same function the sidebar and the admin dialog read,
 * means a warning can never disagree with the number the learner sees.
 *
 * ONCE PER METRIC, LEVEL AND MONTH, PER PERSON. The in-app row is the claim: its
 * dedupe key is unique per recipient, so a retried or overlapping run finds the
 * row already there and sends nothing. Only notices this run actually inserted
 * go into the email, and they go as ONE email — a learner who crossed two limits
 * overnight gets one message, not two.
 */

const METRICS = [
  { key: "grade", noun: "AI gradings" },
  { key: "generate", noun: "practice sets" },
  { key: "speaking", noun: "live speaking mocks" },
] as const satisfies readonly { key: keyof Pick<UsageSummary, "grade" | "generate" | "speaking">; noun: string }[];

type Hit = { key: (typeof METRICS)[number]["key"]; noun: string; quota: Quota; level: QuotaLevel };

/** Orgs checked at once. Each check is four small queries. */
const CONCURRENCY = 6;

export async function sendQuotaWarnings(now = new Date()): Promise<{
  checked: number;
  emailed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let emailed = 0;

  let candidates: string[];
  try {
    candidates = await orgsActiveThisMonth(now);
  } catch (err) {
    return { checked: 0, emailed: 0, errors: [`quota candidates: ${err instanceof Error ? err.message : String(err)}`] };
  }

  let next = 0;
  const worker = async () => {
    while (next < candidates.length) {
      const organizationId = candidates[next++];
      try {
        if (await warnOrg(organizationId)) emailed += 1;
      } catch (err) {
        errors.push(`${organizationId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return { checked: candidates.length, emailed, errors };
}

async function warnOrg(organizationId: string): Promise<boolean> {
  const usage = await getUsageSummary(organizationId);
  const hits: Hit[] = [];
  for (const m of METRICS) {
    const level = quotaLevel(usage[m.key]);
    if (level) hits.push({ key: m.key, noun: m.noun, quota: usage[m.key], level });
  }
  if (hits.length === 0) return false;

  const people = await planOwners(organizationId);
  let sent = false;

  for (const person of people) {
    const fresh: Hit[] = [];
    for (const hit of hits) {
      const inserted = await notify({
        organizationId,
        recipientIds: [person.id],
        type: hit.level === "warning" ? "quota_warning" : "quota_exhausted",
        title: headline(hit),
        body: `Resets on ${resetDay(hit.quota)}.`,
        href: "/plan",
        // ⚠️ Keyed to the window's END, from the same Quota the count came from,
        // so the key and the month it describes cannot drift apart.
        dedupeKey: `quota:${hit.key}:${hit.level}:${hit.quota.resetAt.slice(0, 10)}`,
      });
      if (inserted) fresh.push(hit);
    }
    if (fresh.length === 0 || !person.email) continue;

    const out = fresh.some((h) => h.level === "exhausted");
    const lines = fresh.map(line);
    const planUrl = `${serverEnv.outboundSiteUrl}/plan`;
    const reset = resetDay(fresh[0].quota);
    const result = await sendEmail({
      to: person.email,
      subject: out
        ? "You've used this month's EngProgress allowance"
        : "You're close to this month's EngProgress allowance",
      text:
        `Hi ${person.firstName},\n\n` +
        `Here's where your ${usage.planName} plan stands this month:\n\n` +
        lines.map((l) => `• ${l}`).join("\n") +
        `\n\nEverything resets on ${reset}. Need more before then? See the plans: ${planUrl}\n\n` +
        `— The EngProgress team`,
      html:
        `<p>Hi ${escapeHtml(person.firstName)},</p>` +
        `<p>Here's where your ${escapeHtml(usage.planName)} plan stands this month:</p>` +
        `<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>` +
        `<p>Everything resets on ${escapeHtml(reset)}. <a href="${planUrl}">Need more before then? See the plans.</a></p>` +
        `<p>— The EngProgress team</p>`,
    });
    if (result.sent) sent = true;
    else console.error(`[quota] warning email to ${organizationId} failed:`, result.detail);
  }
  return sent;
}

function headline(hit: Hit): string {
  return hit.level === "exhausted"
    ? `No ${hit.noun} left this month`
    : `${hit.quota.used} of ${hit.quota.limit} ${hit.noun} used this month`;
}

function line(hit: Hit): string {
  return hit.level === "exhausted"
    ? `${cap(hit.noun)}: all ${hit.quota.limit} used — none left until the reset`
    : `${cap(hit.noun)}: ${hit.quota.used} of ${hit.quota.limit} used`;
}

/** The first day of the next window, as the learner reads a date — Tashkent. */
function resetDay(q: Quota): string {
  return new Date(q.resetAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Tashkent",
  });
}

/**
 * Every org that used anything counted this month.
 *
 * A SUPERSET IS FINE, a missing org is not: `getUsageSummary` decides who is
 * actually near a limit, so this only has to avoid reading the thousands of
 * accounts that did nothing. The three sources mirror what the three quotas
 * count; an org found through any of them is checked on all three.
 */
async function orgsActiveThisMonth(now: Date): Promise<string[]> {
  const admin = createAdminClient();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const found = new Set<string>();

  const sources = [
    () => admin.from("gradings").select("organization_id").is("graded_by", null).gte("created_at", start),
    () => admin.from("ai_usage").select("organization_id").eq("task", "practice").gte("created_at", start),
    () => admin.from("speaking_sessions").select("organization_id").eq("mode", "full").gte("started_at", start),
  ];

  for (const source of sources) {
    // PostgREST caps a response at 1000 rows, so a busy month is read in pages —
    // bounded, so a runaway source cannot eat the job's whole minute.
    for (let from = 0; from < 50_000; from += 1000) {
      const { data, error } = await source().range(from, from + 999);
      if (error) throw new Error(error.message);
      for (const row of data ?? []) if (row.organization_id) found.add(String(row.organization_id));
      if (!data || data.length < 1000) break;
    }
  }
  return [...found];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
