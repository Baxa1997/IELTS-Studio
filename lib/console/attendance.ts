import "server-only";

import { type Profile } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

/**
 * The attendance overview: every class a person can mark, and whether today's
 * register is done.
 *
 * WHY THIS IS A LIST OF CLASSES AND NOT A LIST OF SESSIONS. Now that classes
 * carry a timetable, "which classes meet today" is answerable — and it is what
 * a teacher wants first. But a register must stay markable for a class that is
 * NOT scheduled today (a make-up lesson, a class nobody timetabled yet), so the
 * scheduled ones are sorted to the top rather than being the only ones shown.
 * Hiding the rest would make the feature unusable for exactly the centers who
 * have not filled in their timetable.
 */

export interface AttendanceClass {
  id: string;
  name: string;
  teacherName: string | null;
  students: number;
  /** True when the timetable says this class meets on the date being shown. */
  meetsToday: boolean;
  /** `18:00–19:30` when it meets, else null. */
  timeLabel: string | null;
  /** The register's state for this date. */
  state: "marked" | "open";
  /** Present-or-late out of everyone marked, for this date only. */
  presentToday: number | null;
  /** The class's running attendance rate across all its registers. */
  ratePct: number | null;
}

export async function loadAttendanceClasses(
  profile: Profile,
  date: string,
): Promise<AttendanceClass[]> {
  const supabase = await createClient();
  const { groups } = await loadGroups(profile);
  if (groups.length === 0) return [];

  const ids = groups.map((g) => g.id);
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

  const [sessionsRes, slotsRes, ratesRes, membersRes] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("id, group_id, state")
      .eq("held_on", date)
      .in("group_id", ids),
    supabase
      .from("lesson_slots")
      .select("group_id, starts_at, ends_at, effective_from, effective_to")
      .eq("weekday", weekday)
      .in("group_id", ids),
    supabase.from("v_student_attendance").select("student_id, rate_pct"),
    supabase.from("group_members").select("group_id, student_id").in("group_id", ids),
  ]);

  const sessions = (sessionsRes.data ?? []) as { id: string; group_id: string; state: string }[];
  const sessionOf = new Map(sessions.map((s) => [s.group_id, s]));

  // Present-or-late per class, for the date being shown.
  const presentOf = new Map<string, number>();
  if (sessions.length > 0) {
    const { data: marks } = await supabase
      .from("attendance_marks")
      .select("session_id, status")
      .in(
        "session_id",
        sessions.map((s) => s.id),
      );
    const groupOfSession = new Map(sessions.map((s) => [s.id, s.group_id]));
    for (const m of (marks ?? []) as { session_id: string; status: string }[]) {
      if (m.status === "absent") continue;
      const gid = groupOfSession.get(m.session_id);
      if (gid) presentOf.set(gid, (presentOf.get(gid) ?? 0) + 1);
    }
  }

  // Does the timetable put this class on today? The same effective-date window
  // the grid draws with, so a finished course stops appearing here too.
  const slotOf = new Map<string, { startsAt: string; endsAt: string }>();
  for (const r of (slotsRes.data ?? []) as Record<string, unknown>[]) {
    const from = String(r.effective_from ?? "").slice(0, 10);
    const to = r.effective_to ? String(r.effective_to).slice(0, 10) : null;
    if (from && from > date) continue;
    if (to && to < date) continue;
    const gid = r.group_id as string;
    if (!slotOf.has(gid)) {
      slotOf.set(gid, {
        startsAt: String(r.starts_at).slice(0, 5),
        endsAt: String(r.ends_at).slice(0, 5),
      });
    }
  }

  const rateOf = new Map(
    ((ratesRes.data ?? []) as { student_id: string; rate_pct: number | null }[]).map((r) => [
      r.student_id,
      r.rate_pct,
    ]),
  );
  const byGroup = new Map<string, number[]>();
  for (const m of (membersRes.data ?? []) as { group_id: string; student_id: string }[]) {
    const rate = rateOf.get(m.student_id);
    if (rate == null) continue;
    byGroup.set(m.group_id, [...(byGroup.get(m.group_id) ?? []), rate]);
  }

  const rows: AttendanceClass[] = groups.map((g) => {
    const slot = slotOf.get(g.id);
    const rates = byGroup.get(g.id) ?? [];
    return {
      id: g.id,
      name: g.name,
      teacherName: g.teacherName,
      students: g.memberCount,
      meetsToday: slot != null,
      timeLabel: slot ? `${slot.startsAt}–${slot.endsAt}` : null,
      state: sessionOf.get(g.id)?.state === "marked" ? "marked" : "open",
      presentToday: sessionOf.has(g.id) ? (presentOf.get(g.id) ?? 0) : null,
      ratePct: rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null,
    };
  });

  // Scheduled and unmarked first — that is the teacher's queue for the day —
  // then scheduled and done, then everything else by name.
  return rows.sort((a, b) => {
    const rank = (r: AttendanceClass) =>
      r.meetsToday && r.state === "open" ? 0 : r.meetsToday ? 1 : 2;
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
}
