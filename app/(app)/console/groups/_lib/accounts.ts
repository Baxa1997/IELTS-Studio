import "server-only";

import { phoneKey } from "@/lib/phone";
import { transliterate } from "@/lib/names";
import { PLAN_SEAT_LIMITS, type OrgPlan } from "@/lib/quota";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Logins are typed by hand, often from a whiteboard: letters, digits and a few
 *  separators only, and case-insensitive (stored lowercase). */
export const LOGIN_RE = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])$/;

/** Students created without a real address get an address on a domain we own
 *  that has no mail exchanger — valid to Supabase, undeliverable in practice,
 *  and impossible to collide with someone's real inbox. */
const NO_MAIL_DOMAIN = "students.engprogress.com";

/**
 * The auth address for a center-created account. ALWAYS synthetic, never the
 * person's real one.
 *
 * `auth.users.email` is globally unique, so using a real address here would let
 * a center account claim it forever — which is exactly what stopped a learner
 * who already practises solo from also being added as a teacher. A center
 * account signs in by login (resolved to this address server-side in `signIn`),
 * and the real inbox is kept on `profiles.contact_email` for delivery only.
 *
 * The domain has no MX record, so nothing is ever sent here and the account has
 * no email password reset. The center resets it.
 */
export function centerAuthEmail(login: string): string {
  return `${login}@${NO_MAIL_DOMAIN}`;
}

/** `Name`, `Name, login`, `Name, email`, `Name, login, email` — in any order
 *  after the name, comma- or tab-separated (a paste from a spreadsheet). */
export function parseRosterLine(
  line: string,
): { name: string; login: string | null; email: string; phone: string | null } | null {
  const parts = line
    .split(/[\t,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const name = parts.shift();
  if (!name) return null;

  let login: string | null = null;
  let email = "";
  let phone: string | null = null;
  for (const part of parts) {
    if (part.includes("@")) {
      email = part.toLowerCase();
      continue;
    }
    // A PHONE, TOLD APART BY SHAPE rather than by column. The fields here are
    // deliberately order-free — a centre's spreadsheet puts them in whatever
    // order it already had — so each one has to identify itself. A phone is the
    // only field that is mostly digits: `phoneKey` returns null for anything
    // with fewer than nine of them, which rules out a login like `aziza2` and
    // a name like `10B` without a second rule.
    if (phoneKey(part)) {
      phone = part;
      continue;
    }
    login = part.toLowerCase();
  }
  return { name, login, email, phone };
}

/** Build a login from a name the way a teacher would: `dilnoza.r`. Cyrillic is
 *  transliterated rather than dropped — a class list pasted from a Russian
 *  register must not produce thirty identical empty logins. */
export function loginFromName(name: string): string {
  const tokens = transliterate(name)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  let base = tokens[0] ?? "";
  if (tokens.length > 1) base = `${tokens[0]}.${tokens[tokens.length - 1][0]}`;
  base = base.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  // LOGIN_RE needs at least three characters, first and last alphanumeric.
  while (base.length > 0 && base.length < 3) base += "1";
  return base || "student";
}

/** First free login in the `base, base2, base3…` series — free both on the
 *  platform (logins are global) and within this paste. */
export async function resolveLogin(
  admin: ReturnType<typeof createAdminClient>,
  base: string,
  usedInBatch: Set<string>,
): Promise<string | null> {
  for (let n = 1; n <= 50; n += 1) {
    const candidate = n === 1 ? base : `${base}${n}`;
    if (!LOGIN_RE.test(candidate) || usedInBatch.has(candidate)) continue;
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();
    if (!taken) return candidate;
  }
  return null;
}

export type RlsClient = Awaited<ReturnType<typeof createClient>>;

/** Student seats are a plan limit; pending invites count so a center can't
 *  oversubscribe by issuing links it hasn't spent yet. Skipped entirely while
 *  the org is unmetered (`billing_enforced = false` — centers, for now; see
 *  migration 20260807150000). */
export async function seatLimitError(supabase: RlsClient, organizationId: string): Promise<string | null> {
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, billing_enforced")
    .eq("id", organizationId)
    .maybeSingle();
  if (org?.billing_enforced === false) return null;

  const limit = PLAN_SEAT_LIMITS[(org?.plan ?? "trial") as OrgPlan];
  if (limit == null) return null;

  const [{ count: students }, { count: pending }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
  ]);

  const used = (students ?? 0) + (pending ?? 0);
  if (used < limit) return null;
  return `Your plan includes ${limit} student seat${limit === 1 ? "" : "s"} and ${used} are used or pending. Upgrade your plan to invite more.`;
}
