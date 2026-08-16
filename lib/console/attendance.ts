import "server-only";

import { type Profile } from "@/lib/auth";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { loadGroups } from "@/lib/console/groups";
import {
  holidayOn,
  registerIsLocked,
  slotRuns,
  type DayLesson,
  type DaySchedule,
  type HolidayRow,
  type SlotRow,
} from "@/lib/console/schedule";
import { createClient } from "@/lib/supabase/server";

/**
 * One day at the center: which groups meet, whether the lesson happened, and
 * what state its register is in.
 *
 * THE ONLY DEFINITION OF "TODAY'S LESSONS". The Overview used to answer this
 * with "every group in the center", so it counted three open registers on a day
 * the timetable had nothing on. Both pages now call this, which is the point of
 * it — a shared query can be wrong, but it cannot be inconsistent.
 *
 * WHY IT RETURNS UNSCHEDULED GROUPS TOO. A register must stay markable for a
 * lesson that is NOT on the timetable — a make-up class, a group nobody has
 * timetabled yet — so those come back with `scheduled: false` and the caller
 * decides. The Attendance page shows them all; the Overview's Today panel shows
 * what is actually scheduled. Hiding them here would make the feature useless
 * for exactly the centers who have not filled the timetable in.
 */

export async function loadDay(profile: Profile, date: string): Promise<DaySchedule> {
  const supabase = await createClient();
  const [{ groups, rooms }, settings] = await Promise.all([
    loadGroups(profile, { include: "active" }),
    loadCenterSettings(),
  ]);

  if (groups.length === 0) {
    return { date, timezone: settings.timezone, holiday: null, lessons: [] };
  }

  const ids = groups.map((g) => g.id);
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

  const [sessionsRes, slotsRes, ratesRes, membersRes, cancelRes, holidayRes] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("id, group_id, state, held_on, unlocked_until")
      .eq("held_on", date)
      .in("group_id", ids),
    supabase
      .from("lesson_slots")
      .select("group_id, room_id, weekday, starts_at, ends_at, effective_from, effective_to")
      .eq("weekday", weekday)
      .in("group_id", ids),
    supabase.from("v_student_attendance").select("student_id, rate_pct"),
    supabase.from("group_members").select("group_id, student_id").in("group_id", ids),
    supabase
      .from("lesson_cancellations")
      .select("group_id, reason")
      .eq("held_on", date)
      .in("group_id", ids),
    supabase
      .from("center_holidays")
      .select("name, starts_on, ends_on")
      .lte("starts_on", date)
      .gte("ends_on", date),
  ]);

  const sessions = (sessionsRes.data ?? []) as {
    id: string;
    group_id: string;
    state: string;
    held_on: string;
    unlocked_until: string | null;
  }[];
  const sessionOf = new Map(sessions.map((s) => [s.group_id, s]));

  // Present-or-late per group, for this date only.
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
      // Excused is not attendance — the student was not there. It stays out of
      // this count for the same reason it leaves the rate's denominator.
      if (m.status !== "present" && m.status !== "late") continue;
      const gid = groupOfSession.get(m.session_id);
      if (gid) presentOf.set(gid, (presentOf.get(gid) ?? 0) + 1);
    }
  }

  const slots: SlotRow[] = ((slotsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    groupId: r.group_id as string,
    roomId: (r.room_id as string | null) ?? null,
    weekday: r.weekday as number,
    startsAt: String(r.starts_at).slice(0, 5),
    endsAt: String(r.ends_at).slice(0, 5),
    effectiveFrom: String(r.effective_from ?? "").slice(0, 10),
    effectiveTo: r.effective_to ? String(r.effective_to).slice(0, 10) : null,
  }));
  const slotOf = new Map<string, SlotRow>();
  for (const s of slots) {
    if (!slotRuns(s, date)) continue;
    // A group meeting twice in one day is rare and, when it happens, the first
    // sitting is the one the register belongs to.
    const held = slotOf.get(s.groupId);
    if (!held || s.startsAt < held.startsAt) slotOf.set(s.groupId, s);
  }

  const roomName = new Map(rooms.map((r) => [r.id, r.name]));
  const cancelOf = new Map(
    ((cancelRes.data ?? []) as { group_id: string; reason: string }[]).map((c) => [
      c.group_id,
      c.reason,
    ]),
  );
  const holidays: HolidayRow[] = ((holidayRes.data ?? []) as Record<string, unknown>[]).map((h) => ({
    name: h.name as string,
    startsOn: String(h.starts_on).slice(0, 10),
    endsOn: String(h.ends_on).slice(0, 10),
  }));

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

  const now = new Date();
  const lessons: DayLesson[] = groups.map((g) => {
    const slot = slotOf.get(g.id);
    const session = sessionOf.get(g.id);
    const rates = byGroup.get(g.id) ?? [];
    return {
      groupId: g.id,
      groupName: g.name,
      teacherId: g.teacherId,
      teacherName: g.teacherName,
      roomName: slot?.roomId ? (roomName.get(slot.roomId) ?? null) : null,
      startsAt: slot?.startsAt ?? null,
      endsAt: slot?.endsAt ?? null,
      timeLabel: slot ? `${slot.startsAt}–${slot.endsAt}` : null,
      scheduled: slot != null,
      cancelledReason: cancelOf.get(g.id) ?? null,
      sessionId: session?.id ?? null,
      state: session?.state === "marked" ? "marked" : "open",
      locked: registerIsLocked(date, session?.unlocked_until ?? null, now),
      students: g.memberCount,
      ratePct: rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null,
      presentToday: session ? (presentOf.get(g.id) ?? 0) : null,
    };
  });

  // Scheduled and unmarked first — that is the queue for the day — then
  // scheduled and done, then everything else by name.
  lessons.sort((a, b) => {
    const rank = (l: DayLesson) =>
      l.cancelledReason ? 3 : l.scheduled && l.state === "open" ? 0 : l.scheduled ? 1 : 2;
    return (
      rank(a) - rank(b) ||
      (a.startsAt ?? "").localeCompare(b.startsAt ?? "") ||
      a.groupName.localeCompare(b.groupName)
    );
  });

  return {
    date,
    timezone: settings.timezone,
    holiday: holidayOn(holidays, date),
    lessons,
  };
}
