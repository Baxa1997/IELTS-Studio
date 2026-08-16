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
 * WHAT IT CANNOT TELL YOU. It runs with the service-role key, which bypasses
 * both RLS and column grants. A column can exist here and still refuse every
 * write from a real user — `profiles.member_status` did exactly that, because
 * 20260807180000 revoked UPDATE on that table and re-grants it column by
 * column. Green here means "the schema is applied", not "the feature works".
 * For that, sign in as a real user and try it.
 *
 * Run it before deploying, and again straight after applying a migration:
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
  // Phase 2 — 20260816130000
  ["AI band vs final band", "attempt_reviews", "id, kind, ref_id, ai_band, final_band, reason"],
  ["every graded attempt", "v_gradable_attempts", "kind, ref_id, student_id, submitted_at, ai_band"],
  ["the marking queue", "v_marking_queue", "kind, ref_id, student_id, submitted_at, ai_band"],
  // Phase 4 — 20260816170000 (placement baselines)
  // One probe per MIGRATION, not per table: `assignments` gains a column in
  // 20260816170000 and another in 20260816190000, and a single combined probe
  // reported both as missing when only the second one was — which is how you
  // end up re-applying a migration that was already live.
  ["placement practice", "assignments", "id, is_placement"],
  ["assigning from the library", "assignments", "id, library_id"],
  ["baseline provenance", "skill_estimates", "student_id, baseline_band, baseline_source, target_set_by"],
  // Phase 4 — 20260816180000 (automatic messages)
  ["the six automatic messages", "auto_messages", "organization_id, key, enabled, template"],
  ["never sending a nudge twice", "auto_message_sends", "id, key, recipient_id, subject_key"],
  // Phase 4 — 20260816190000 (practice library)
  ["the practice library", "practice_library", "id, kind, ref_id, title, skill, level, archived_at"],
];

let missing = 0;
console.log("\nCenter restructure schema — is it applied?\n");

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

// `announcement` was missing from notification_type for the whole life of the
// announcements feature, so every announcement was recorded as sent and never
// delivered — `notify` is best-effort and swallowed the enum error. Nothing in
// the typecheck could see it: the TS union had the value, Postgres did not.
const { error: announcementEnum } = await db
  .from("notifications")
  .select("id")
  .eq("type", "announcement")
  .limit(1);
if (announcementEnum) {
  missing += 1;
  console.log(`  ✗  notification_type      'announcement' is not a valid value`);
  console.log("     └─ breaks: EVERY announcement, and 3 of the 6 automatic messages");
} else {
  console.log("  ✓  notification_type      'announcement' exists");
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
    : `\n${missing} MISSING — a migration has not been applied.\n` +
        "  Phase 1 → 20260816120000_center_correctness.sql\n" +
        "  Phase 2 → 20260816130000_attempt_reviews.sql\n" +
        "  Phase 4 → 20260816170000_placement_baselines.sql\n" +
        "            20260816180000_auto_messages.sql\n" +
        "            20260816190000_practice_library.sql\n" +
        "            20260816200000_notification_announcement_type.sql\n\n" +
        "HOW EACH ONE FAILS, which is not the same for all of them:\n\n" +
        "  Phase 1 is load-bearing. Its loaders return null and the console\n" +
        "  renders BLANK rather than erroring.\n\n" +
        "  20260816170000 is the other unsafe one: skill_estimates gains two\n" +
        "  columns the estimate service WRITES, so without it every upsert\n" +
        "  fails and no band is ever recorded.\n\n" +
        "  20260816200000 fixes a bug that PREDATES this branch: 'announcement'\n" +
        "  was never in the notification_type enum, so every announcement a\n" +
        "  centre has sent was recorded as sent and silently never delivered.\n" +
        "  It also unblocks 3 of the 6 automatic messages.\n\n" +
        "  Phase 2, the auto-messages and the library degrade safely: the\n" +
        "  marking queue reads empty, the automatic tab shows code defaults\n" +
        "  and saves nothing, and the library shows as empty.\n",
);

process.exit(missing === 0 ? 0 : 1);
