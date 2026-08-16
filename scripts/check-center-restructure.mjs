/**
 * check-center-restructure.mjs — read-only. Does the database actually know
 * about the Phase 1 restructure yet?
 *
 * WHY THIS EXISTS. supabase-js returns a failed query as `{ data: null, error }`
 * rather than throwing, so a column that does not exist renders as an EMPTY
 * PAGE, not an error. The build passes, the types pass, and the screen is blank.
 * Every loader touched by 20260816120000 selects at least one new column, which
 * means an unapplied migration does not degrade the console — it empties it.
 *
 * Run it before deploying, and again straight after applying the migration:
 *
 *     node scripts/check-center-restructure.mjs
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
  ["groups list + every operational count", "groups", "id, name, status, closed_at"],
  ["students page, rosters, gone-quiet", "profiles", "id, member_status, status_changed_at, status_note"],
  ["register lock", "attendance_sessions", "id, held_on, state, unlocked_until"],
  ["cancelled lessons", "lesson_cancellations", "id, group_id, held_on, reason, cancelled_by"],
  ["center holidays", "center_holidays", "id, name, starts_on, ends_on"],
  ["timezone + week start", "center_settings", "organization_id, timezone, week_starts_on, working_days"],
  ["unlock audit trail", "center_audit_log", "id, action, actor_name, subject, detail"],
  ["attendance % (redefined)", "v_student_attendance", "student_id, sessions, attended, rate_pct"],
];

let missing = 0;
console.log("\nPhase 1 schema — is it applied?\n");

for (const [what, table, columns] of probes) {
  const { error } = await db.from(table).select(columns).limit(1);
  if (error) {
    missing += 1;
    console.log(`  ✗  ${table.padEnd(22)} ${error.message}`);
    console.log(`     └─ breaks: ${what}`);
  } else {
    console.log(`  ✓  ${table.padEnd(22)} ${what}`);
  }
}

// The enum is not a column, so it needs its own probe: ask for a status nobody
// has used yet and see whether Postgres recognises the label at all.
const { error: enumError } = await db
  .from("attendance_marks")
  .select("student_id")
  .eq("status", "excused")
  .limit(1);
if (enumError) {
  missing += 1;
  console.log(`  ✗  attendance_status      'excused' is not a valid value — ${enumError.message}`);
  console.log("     └─ breaks: marking anyone excused; the register saves nothing");
} else {
  console.log("  ✓  attendance_status      'excused' exists");
}

console.log(
  missing === 0
    ? "\nApplied. The restructure is live in the database.\n"
    : `\n${missing} of ${probes.length + 1} MISSING — migration 20260816120000 has not been applied.\n` +
        "Do not deploy the app until it is: these loaders return null, and the\n" +
        "console renders blank rather than erroring.\n",
);
process.exit(missing === 0 ? 0 : 1);
