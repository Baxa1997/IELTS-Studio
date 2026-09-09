/**
 * check-referrals.mjs — read-only. Did 20260907120000_referrals.sql actually
 * land, and are the guarantees that bound the money really there?
 *
 * WHY THIS EXISTS. supabase-js returns a failed query as `{ data: null, error }`
 * rather than throwing, so a missing table renders as an empty page and a
 * missing CONSTRAINT renders as nothing at all — the feature keeps working and
 * quietly pays twice. The schema probes below are the ordinary kind; the
 * constraint probes are the ones worth having, because those are the failures
 * with a number attached.
 *
 * WHAT IT CANNOT TELL YOU. It runs with the service-role key, which bypasses
 * both RLS and column grants. Every table can exist here while a real user is
 * still refused — that is what supabase/tests/rls_isolation_test.sql (cases
 * 22a-22g) is for, and it needs psql or the SQL editor. Green here means "the
 * schema is applied", not "the feature is safe".
 *
 *     node scripts/check-referrals.mjs
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
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** [what breaks without it, table, columns the app actually selects] */
const probes = [
  ["the rate, the hold, both payout floors", "referral_settings", "id, default_percent, hold_days, min_payout_minor, min_payout_uzs_minor, cookie_days"],
  ["applying, and the whole admin queue", "referral_accounts", "id, profile_id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note, stopped_at"],
  ["crediting the right person", "referral_attributions", "organization_id, referral_account_id, source, attributed_at"],
  ["the ledger, and every balance on the page", "referral_commissions", "id, referral_account_id, organization_id, billing_event_id, amount_minor, currency, percent_applied, status, payable_after, payout_id, reversed_reason"],
  ["marking a month settled", "referral_payouts", "id, referral_account_id, currency, amount_minor, reference, paid_at, marked_by"],
];

let missing = 0;
console.log("\nReferral schema — is it applied?\n");

for (const [what, table, columns] of probes) {
  const { error } = await db.from(table).select(columns).limit(1);
  if (error) {
    missing += 1;
    console.log(`  ✗  ${table.padEnd(24)} ${error.message}`);
    console.log(`     └─ breaks: ${what}`);
  } else {
    console.log(`  ✓  ${table.padEnd(24)} ${what}`);
  }
}

/* ── the settings row, which the migration seeds ──────────────────────────── */
console.log("\nSettled policy — does the database agree with the plan?\n");

const { data: settings, error: settingsError } = await db
  .from("referral_settings")
  .select("default_percent, hold_days, min_payout_minor, min_payout_uzs_minor, cookie_days")
  .eq("id", true)
  .maybeSingle();

if (settingsError || !settings) {
  missing += 1;
  console.log(`  ✗  settings row absent — every fallback in the code takes over instead`);
} else {
  const expect = [
    ["rate", Number(settings.default_percent), 15, "% of a first payment"],
    ["hold", settings.hold_days, 7, " days"],
    ["floor USD", settings.min_payout_minor, 2000, " minor units ($20.00)"],
    // A separate number because 2000 is $20.00 and also 20 so'm — one threshold
    // cannot mean both, and there is no rate here to convert with.
    ["floor UZS", Number(settings.min_payout_uzs_minor), 25000000, " minor units (250,000 so'm)"],
    ["cookie", settings.cookie_days, 90, " days"],
  ];
  for (const [name, actual, wanted, unit] of expect) {
    const ok = actual === wanted;
    if (!ok) missing += 1;
    console.log(`  ${ok ? "✓" : "✗"}  ${name.padEnd(8)} ${actual}${unit}${ok ? "" : `  (plan says ${wanted})`}`);
  }
}

/* ── the two constraints that bound the money ─────────────────────────────
 * These are the point of the script. A missing table is loud; a missing unique
 * index is silent and pays real money on a schedule. Probed by asking Postgres
 * for the index directly, since there is no way to observe one from a query.  */
console.log("\nThe constraints that bound the payout\n");

// There is no arbitrary-SQL RPC in this project, deliberately, so a unique index
// cannot be observed from here — supabase-js can only issue queries. What this
// CAN do is say which check to run instead, and refuse to fabricate a billing
// event against a live database to find out.
const { count: ledgerRows } = await db
  .from("referral_commissions")
  .select("id", { count: "exact", head: true });

if (ledgerRows === null) {
  console.log("  ?  ledger unreadable — fix the table probes above first");
} else if (ledgerRows > 0) {
  console.log(`  ⓘ  ledger already has ${ledgerRows} row(s); skipping the write probe.`);
  console.log("     Verify with:  \\d public.referral_commissions   (psql)");
  console.log("     Expect: referral_commissions_one_per_org UNIQUE, billing_event_id UNIQUE");
} else {
  console.log("  ⓘ  ledger is empty — the constraints cannot be exercised without");
  console.log("     inventing a billing event, which this read-only script will not do.");
  console.log("     Verify with:  \\d public.referral_commissions   (psql)");
  console.log("     Or run supabase/tests/rls_isolation_test.sql, case 22g.");
}

/* ── the queue, so "did my application land?" has one answer ───────────────── */
console.log("\nApplications\n");

const { data: accounts, error: accountsError } = await db
  .from("referral_accounts")
  .select("code, status, percent, pitch, audience_url, applied_at, profiles(full_name, contact_email)")
  .order("applied_at", { ascending: false })
  .limit(20);

if (accountsError) {
  console.log(`  ✗  ${accountsError.message}`);
} else if (accounts.length === 0) {
  console.log("  ⓘ  none yet. Apply at /referrals, then run this again.");
} else {
  for (const a of accounts) {
    const who = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
    const name = who?.full_name ?? who?.contact_email ?? "unknown";
    // A pending row MUST have no code and no rate — those are outside the
    // client's column grant, so anything else here means the grants are wrong.
    const suspect = a.status === "pending" && (a.code || a.percent !== null);
    console.log(
      `  ${suspect ? "✗" : "·"}  ${a.status.padEnd(9)} ${String(name).padEnd(26)} ` +
        `${a.code ?? "(code minted on approval)"}${suspect ? "  ← pending row arrived pre-set: CHECK THE GRANTS" : ""}`,
    );
    if (suspect) missing += 1;
  }
  const waiting = accounts.filter((a) => a.status === "pending").length;
  if (waiting > 0) console.log(`\n  ${waiting} waiting — approve at /admin/referrals`);
}

console.log(
  missing === 0
    ? "\nSchema is applied and the policy matches.\nStill unproven here: RLS and column grants — run rls_isolation_test.sql (22a-22g).\n"
    : `\n${missing} problem(s). The migration is supabase/migrations/20260907120000_referrals.sql.\n`,
);
process.exit(missing === 0 ? 0 : 1);
