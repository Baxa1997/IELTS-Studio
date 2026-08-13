import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * What the center teaches, and who can take it.
 *
 * Read through the RLS client: subjects are readable by everyone in the org
 * (a student's timetable names the subject too) and writable only by the owner,
 * so this same loader serves the settings page, the group form and the teacher
 * list without a role branch.
 */

export interface SubjectRow {
  id: string;
  name: string;
  color: string | null;
  active: boolean;
  /** Teachers linked to it, and classes currently teaching it. */
  teacherCount: number;
  groupCount: number;
}

export interface TeacherSubjects {
  teacherId: string;
  subjectIds: string[];
}

export async function loadSubjects(): Promise<SubjectRow[]> {
  const supabase = await createClient();

  const [subjectsRes, linksRes, groupsRes] = await Promise.all([
    supabase.from("subjects").select("id, name, color, active").order("name"),
    supabase.from("teacher_subjects").select("subject_id"),
    supabase.from("groups").select("subject_id"),
  ]);

  const teachers = new Map<string, number>();
  for (const l of linksRes.data ?? []) {
    const id = l.subject_id as string;
    teachers.set(id, (teachers.get(id) ?? 0) + 1);
  }
  const groups = new Map<string, number>();
  for (const g of groupsRes.data ?? []) {
    const id = g.subject_id as string | null;
    if (id) groups.set(id, (groups.get(id) ?? 0) + 1);
  }

  return (subjectsRes.data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    color: (s.color as string | null) ?? null,
    active: Boolean(s.active),
    teacherCount: teachers.get(s.id as string) ?? 0,
    groupCount: groups.get(s.id as string) ?? 0,
  }));
}

/** Which subjects each teacher can take, keyed by teacher id. */
export async function loadTeacherSubjects(): Promise<Map<string, string[]>> {
  const supabase = await createClient();
  const { data } = await supabase.from("teacher_subjects").select("teacher_id, subject_id");

  const byTeacher = new Map<string, string[]>();
  for (const row of data ?? []) {
    const teacher = row.teacher_id as string;
    byTeacher.set(teacher, [...(byTeacher.get(teacher) ?? []), row.subject_id as string]);
  }
  return byTeacher;
}
