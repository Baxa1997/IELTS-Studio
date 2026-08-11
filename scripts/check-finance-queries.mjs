/**
 * check-finance-queries.mjs — read-only smoke test for the finance and
 * timetable loaders.  Run from the project root:
 *
 *     node scripts/check-finance-queries.mjs
 *
 * WHY THIS EXISTS. supabase-js returns a failed query as `{ data: null, error }`
 * rather than throwing, and every loader in this module treats a null result as
 * "nothing to show". So a broken query renders as an EMPTY PAGE, not an error —
 * a build passes, types pass, and the screen is blank. That is exactly how a
 * whole finance module shipped reading nothing at all: the queries used
 * PostgREST embeds, and embeds cannot resolve this schema's composite
 * (id, organization_id) foreign keys.
 *
 * This file runs the real query shapes against the real database with the
 * service-role key and says plainly which ones come back. Run it after any
 * migration, and after touching a loader.
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

const probes = [
  ["timetable · slots", "lesson_slots", "id, series_id, group_id, room_id, weekday, starts_at, ends_at"],
  ["timetable · rooms", "rooms", "id, name, capacity, color, active, branch_id"],
  ["timetable · branches", "branches", "id, name, address, phone, active, sort"],
  ["timetable · groups", "groups", "id, name, teacher_id"],
  ["timetable · staff", "profiles", "id, full_name"],
  [
    "ledger",
    "finance_transactions",
    "id, occurred_on, created_at, direction, amount_minor, method, status, note, account_id, category_id, student_id, teacher_id, group_id, created_by, transfer_id",
  ],
  ["desks", "finance_accounts", "id, owner_id, branch_id, name, kind, active"],
  ["desk balances view", "v_finance_account_balances", "account_id, name, kind, active, balance_minor, sort"],
  ["categories", "finance_categories", "id, name, direction, slug"],
  ["invoices", "student_invoices", "id, student_id, group_id, period_month, amount_minor, discount_minor, due_on"],
  ["payroll items", "payroll_items", "id, teacher_id, rule_id, gross_minor, net_minor, breakdown"],
  ["salary rules", "salary_rules", "id, name, scope, group_id, teacher_id, components, floor_minor, cap_minor, active"],
  ["student balances view", "v_student_finance", "student_id, owed_minor"],
];

let failures = 0;
for (const [label, table, select] of probes) {
  const { error, data } = await db.from(table).select(select).limit(3);
  if (error) failures++;
  console.log(
    `${error ? "FAIL" : "ok  "}  ${label.padEnd(24)} ${
      error ? error.message.replace(/\s+/g, " ").slice(0, 100) : `${data.length} row(s)`
    }`,
  );
}

console.log(
  failures === 0
    ? "\nEvery loader query works."
    : `\n${failures} query/queries still failing — apply the pending migration.`,
);
