/**
 * backfill-period-end.mjs — give the already-paid subscriptions an end date.
 *
 * WHY THIS IS NEEDED. Expiry now works (lib/billing/expiry.ts), and it decides
 * who has lapsed from `subscriptions.current_period_end`. That column was NULL
 * on every Stripe row, because `checkout.session.completed` never set one and
 * the subscription events that would have bail when their metadata carries no
 * plan. The checkout fix supplies a date from now on — but it cannot reach back,
 * and `hasLapsed` treats NULL as "not lapsed" ON PURPOSE, so anybody who paid
 * before the fix keeps their plan permanently.
 *
 * That NULL-is-not-lapsed rule is load-bearing and is NOT what this script
 * changes: several paid orgs have no subscription row at all — comped accounts,
 * the shared library orgs, hand-granted plans — and they must stay untouched.
 * This only fills in rows that DO have a Stripe subscription id, using the date
 * Stripe itself holds. No guessing.
 *
 * YOU MAY NOT NEED IT. Once deployed, the nightly job (lib/billing/expiry.ts)
 * asks Stripe about every paid-looking Stripe row with no date and fills it in
 * itself. This is for filling them in NOW, without waiting for a deploy.
 *
 * READ-ONLY BY DEFAULT. It prints what it would write and changes nothing.
 * Pass --apply to actually write.
 *
 *     node scripts/backfill-period-end.mjs            # report
 *     node scripts/backfill-period-end.mjs --apply    # write
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const APPLY = process.argv.includes("--apply");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

if (!env.STRIPE_SECRET_KEY) {
  console.error("No STRIPE_SECRET_KEY in .env.local — cannot ask Stripe for the real dates.");
  process.exit(1);
}

console.log(APPLY ? "APPLYING changes.\n" : "Read-only. Nothing will be written. Pass --apply to write.\n");

const { data: rows, error } = await db
  .from("subscriptions")
  .select("organization_id, provider, plan, status, external_subscription_id, current_period_end")
  .eq("provider", "stripe")
  .is("current_period_end", null)
  .neq("status", "canceled");

if (error) {
  console.error("Could not read subscriptions:", error.message);
  process.exit(1);
}

let filled = 0;
let skipped = 0;

for (const row of rows ?? []) {
  const id = row.external_subscription_id ?? "";
  const org = String(row.organization_id).slice(0, 8);

  /* A CHECKOUT SESSION IS NOT A SUBSCRIPTION. Most of these rows carry a
     `cs_…` id, which is the session the person opened and never completed —
     there is no subscription behind it and nothing to expire. They are left
     exactly as they are; their status already says `incomplete`. */
  if (!id.startsWith("sub_")) {
    console.log(`  ·  ${org}  ${row.plan}/${row.status}  no subscription behind it (${id.slice(0, 12) || "no id"}…) — left alone`);
    skipped += 1;
    continue;
  }

  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) {
    console.log(`  ✗  ${org}  ${id} — Stripe says ${res.status}; left alone`);
    skipped += 1;
    continue;
  }

  const sub = await res.json();
  /* The period is on the ITEMS in Stripe API 2026-01-28.clover — this account's
     version. The top-level field this first read no longer exists, which is the
     same reason every row was NULL in the first place. */
  const itemEnds = (sub.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter((n) => typeof n === "number" && n > 0);
  const unix = itemEnds.length > 0 ? Math.max(...itemEnds) : sub.current_period_end;
  if (typeof unix !== "number") {
    console.log(`  ✗  ${org}  ${id} — Stripe has no current_period_end either; left alone`);
    skipped += 1;
    continue;
  }

  const iso = new Date(unix * 1000).toISOString();
  const past = new Date(iso) < new Date();
  console.log(
    `  ${APPLY ? "→" : "?"}  ${org}  ${row.plan}/${row.status}  ${id}  ends ${iso.slice(0, 10)}` +
      (past ? "  ← ALREADY PAST: the next cron run will downgrade this org" : ""),
  );

  if (APPLY) {
    const { error: writeError } = await db
      .from("subscriptions")
      .update({ current_period_end: iso })
      .eq("organization_id", row.organization_id)
      .is("current_period_end", null); // never overwrite a date already there
    if (writeError) {
      console.log(`     write failed: ${writeError.message}`);
      continue;
    }
  }
  filled += 1;
}

console.log(
  `\n${filled} subscription(s) ${APPLY ? "updated" : "would be updated"}, ${skipped} left alone.`,
);
if (!APPLY && filled > 0) console.log("Re-run with --apply to write them.");
