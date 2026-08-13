import "server-only";

import { canManagePeople, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The center's people, for the Teachers and Students pages.
 *
 * Everything runs on the RLS client, so a center_admin sees their whole
 * organization and a teacher sees only what the policies allow. The one place
 * that needs narrowing in code is the student list: `profiles` is readable
 * org-wide by any staff member, but a teacher should be looking at their own
 * classes, so their query goes through group membership instead.
 */

export interface TeacherRow {
  id: string;
  name: string;
  username: string | null;
  groups: number;
  students: number;
}

export interface StudentRow {
  id: string;
  name: string;
  username: string | null;
  avatarPath: string | null;
  groups: { id: string; name: string }[];
  /** GRADED practices, any skill — see v_practice_activity. Drafts don't count. */
  practiceCount: number;
  /** Most recent graded practice of any kind, ISO, or null if they never have. */
  lastActive: string | null;
  /**
   * The lowest measured skill and its band — deliberately NOT a mean across
   * skills. An "overall band" averaged over whichever skills a learner happened
   * to practise is a number we invented, and this roster has to survive a center
   * owner checking it against a real result. The weakest skill is both real and
   * the one thing worth acting on.
   */
  weakest: { skill: string; band: number } | null;
  /** Their target band. The same across skills in practice, so the max is it. */
  targetBand: number | null;
  /** How many of the four skills have ever been measured. */
  measuredSkills: number;
  /** Attendance rate 0–100, or null when no register has ever included them. */
  attendancePct: number | null;
  /**
   * Graded practices per week over the last six weeks, oldest first — the
   * roster's trend sparkline. Deliberately activity, not band: a six-point band
   * series would need a grading history per student per week, and a flat line
   * drawn from one measurement would imply a trend that isn't there.
   */
  spark: number[];
}

const SPARK_WEEKS = 6;

export async function loadTeachers(): Promise<TeacherRow[]> {
  const supabase = await createClient();

  const [{ data: profiles }, { data: groups }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, username, role").eq("role", "teacher"),
    supabase.from("groups").select("id, teacher_id"),
    supabase.from("group_members").select("group_id, student_id"),
  ]);

  const ownedBy = new Map<string, string[]>();
  for (const g of groups ?? []) {
    if (!g.teacher_id) continue;
    ownedBy.set(g.teacher_id, [...(ownedBy.get(g.teacher_id) ?? []), g.id]);
  }

  const studentsInGroup = new Map<string, Set<string>>();
  for (const m of members ?? []) {
    const set = studentsInGroup.get(m.group_id) ?? new Set<string>();
    set.add(m.student_id);
    studentsInGroup.set(m.group_id, set);
  }

  return (profiles ?? [])
    .map((p) => {
      const owned = ownedBy.get(p.id) ?? [];
      const reach = new Set<string>();
      for (const gid of owned) for (const s of studentsInGroup.get(gid) ?? []) reach.add(s);
      return {
        id: p.id,
        name: p.full_name ?? "Unnamed",
        username: p.username,
        groups: owned.length,
        students: reach.size,
      };
    })
    .sort((a, b) => b.students - a.students || a.name.localeCompare(b.name));
}

/**
 * Students, with their groups and how much they've done. A teacher sees the
 * students in the groups they own; a center_admin sees everyone.
 *
 * Practice counts come from `v_center_student_stats`, which is the single
 * definition of what a practice is (graded work, all four skills). Counting the
 * raw attempt tables here is what used to make "Have practised" wrong — an
 * abandoned draft counted the same as a graded essay.
 */
export async function loadStudents(opts: {
  role: string;
  profileId: string;
}): Promise<StudentRow[]> {
  const supabase = await createClient();
  // Whole-center view for the owner AND the administrator. Comparing to
  // "center_admin" alone would have quietly narrowed an administrator to
  // "groups you teach", which is none of them — an empty Students page.
  const isAdmin = canManagePeople(opts.role as AppRole);

  const [{ data: groups }, { data: members }] = await Promise.all([
    supabase.from("groups").select("id, name, teacher_id"),
    supabase.from("group_members").select("group_id, student_id"),
  ]);

  const visibleGroups = (groups ?? []).filter((g) => isAdmin || g.teacher_id === opts.profileId);
  const visibleGroupIds = new Set(visibleGroups.map((g) => g.id));
  const groupName = new Map(visibleGroups.map((g) => [g.id, g.name]));

  const groupsByStudent = new Map<string, { id: string; name: string }[]>();
  for (const m of members ?? []) {
    if (!visibleGroupIds.has(m.group_id)) continue;
    const name = groupName.get(m.group_id);
    if (!name) continue;
    groupsByStudent.set(m.student_id, [
      ...(groupsByStudent.get(m.student_id) ?? []),
      { id: m.group_id, name },
    ]);
  }

  // An admin also sees students who are in no group at all; a teacher, by
  // definition, cannot — a student outside their classes isn't theirs to see.
  let statsQuery = supabase
    .from("v_center_student_stats")
    .select("student_id, full_name, username, avatar_path, practice_count, last_active");
  if (!isAdmin) {
    const ids = [...groupsByStudent.keys()];
    if (ids.length === 0) return [];
    statsQuery = statsQuery.in("student_id", ids);
  }
  const { data: stats } = await statsQuery;

  // Bands, in one round trip for the whole roster. RLS lets staff read the org's
  // estimates (see 20260617121100), so no per-student query is needed.
  const rosterIds = (stats ?? []).map((s) => s.student_id as string);
  const bands = new Map<string, { skill: string; band: number }[]>();
  const targets = new Map<string, number>();
  const attendance = new Map<string, number>();
  const sparks = new Map<string, number[]>();
  if (rosterIds.length > 0) {
    const [{ data: estimates }, { data: rates }] = await Promise.all([
      supabase
        .from("skill_estimates")
        .select("student_id, skill, current_band, target_band")
        .in("student_id", rosterIds),
      // The one definition of an attendance rate — late still counts as in the
      // room (see the view's comment).
      supabase.from("v_student_attendance").select("student_id, rate_pct").in("student_id", rosterIds),
    ]);

    // Weekly practice counts for the sparkline, from the same view every other
    // console statistic uses, so the trend and the total can't disagree.
    const sparkSince = new Date(Date.now() - SPARK_WEEKS * 7 * 86400_000);
    const { data: activity } = await supabase
      .from("v_practice_activity")
      .select("student_id, at")
      .in("student_id", rosterIds)
      .gte("at", sparkSince.toISOString());
    for (const a of (activity ?? []) as { student_id: string; at: string }[]) {
      const week = Math.min(
        SPARK_WEEKS - 1,
        Math.floor((Date.parse(a.at) - sparkSince.getTime()) / (7 * 86400_000)),
      );
      if (week < 0) continue;
      const row = sparks.get(a.student_id) ?? new Array(SPARK_WEEKS).fill(0);
      row[week] += 1;
      sparks.set(a.student_id, row);
    }
    for (const r of (rates ?? []) as { student_id: string; rate_pct: number | null }[]) {
      if (r.rate_pct != null) attendance.set(r.student_id, r.rate_pct);
    }
    for (const e of (estimates ?? []) as {
      student_id: string;
      skill: string;
      current_band: number | null;
      target_band: number | null;
    }[]) {
      if (e.target_band != null) {
        targets.set(e.student_id, Math.max(targets.get(e.student_id) ?? 0, Number(e.target_band)));
      }
      if (e.current_band == null) continue; // null until first measured
      bands.set(e.student_id, [
        ...(bands.get(e.student_id) ?? []),
        { skill: e.skill, band: Number(e.current_band) },
      ]);
    }
  }

  return (stats ?? [])
    .map((s) => {
      const id = s.student_id as string;
      const measured = bands.get(id) ?? [];
      const weakest = measured.length
        ? measured.reduce((lo, m) => (m.band < lo.band ? m : lo))
        : null;
      return {
        id,
        name: (s.full_name as string | null) ?? "Unnamed",
        username: (s.username as string | null) ?? null,
        avatarPath: (s.avatar_path as string | null) ?? null,
        groups: groupsByStudent.get(id) ?? [],
        practiceCount: (s.practice_count as number | null) ?? 0,
        lastActive: (s.last_active as string | null) ?? null,
        weakest,
        targetBand: targets.get(id) ?? null,
        measuredSkills: measured.length,
        attendancePct: attendance.get(id) ?? null,
        spark: sparks.get(id) ?? new Array(SPARK_WEEKS).fill(0),
      };
    })
    .sort((a, b) => b.practiceCount - a.practiceCount || a.name.localeCompare(b.name));
}
