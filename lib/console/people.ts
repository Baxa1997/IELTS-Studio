import "server-only";

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
  practiceCount: number;
  /** Most recent practice of any kind, ISO, or null if they never have. */
  lastActive: string | null;
}

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
 */
export async function loadStudents(opts: {
  role: string;
  profileId: string;
}): Promise<StudentRow[]> {
  const supabase = await createClient();
  const isAdmin = opts.role === "center_admin";

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
  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, username, avatar_path")
    .eq("role", "student");
  if (!isAdmin) {
    const ids = [...groupsByStudent.keys()];
    if (ids.length === 0) return [];
    profileQuery = profileQuery.in("id", ids);
  }
  const { data: profiles } = await profileQuery;

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const [essays, reading, listening, speaking] = await Promise.all([
    supabase.from("essays").select("student_id, created_at").in("student_id", ids),
    supabase.from("reading_attempts").select("student_id, created_at").in("student_id", ids),
    supabase.from("listening_attempts").select("student_id, created_at").in("student_id", ids),
    supabase.from("speaking_sessions").select("student_id, started_at").in("student_id", ids),
  ]);

  const count = new Map<string, number>();
  const latest = new Map<string, string>();
  const note = (studentId: string, at: string | null) => {
    count.set(studentId, (count.get(studentId) ?? 0) + 1);
    if (at && (!latest.has(studentId) || at > latest.get(studentId)!)) latest.set(studentId, at);
  };
  for (const r of essays.data ?? []) note(r.student_id, r.created_at);
  for (const r of reading.data ?? []) note(r.student_id, r.created_at);
  for (const r of listening.data ?? []) note(r.student_id, r.created_at);
  for (const r of speaking.data ?? []) note(r.student_id, r.started_at);

  return (profiles ?? [])
    .map((p) => ({
      id: p.id,
      name: p.full_name ?? "Unnamed",
      username: p.username,
      avatarPath: p.avatar_path,
      groups: groupsByStudent.get(p.id) ?? [],
      practiceCount: count.get(p.id) ?? 0,
      lastActive: latest.get(p.id) ?? null,
    }))
    .sort((a, b) => b.practiceCount - a.practiceCount || a.name.localeCompare(b.name));
}
