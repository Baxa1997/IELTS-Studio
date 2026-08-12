import "server-only";

import { type Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The tallies shown beside the console's nav items.
 *
 * Counts only — this runs in the app layout on every console navigation, so it
 * must stay far cheaper than the page loaders it shadows. RLS scopes each query
 * to the caller's org; the one thing it can't scope is the student list, since
 * `profiles` is readable org-wide by any staff member. So a teacher counts
 * through group membership instead, which RLS narrows to the groups they own —
 * otherwise the rail would show a teacher the whole center's total while
 * /console/students showed them only their own (the same trap the console
 * dashboard documents).
 */
export async function loadNavCounts(profile: Profile): Promise<Record<string, number>> {
  const supabase = await createClient();
  const isAdmin = profile.role === "center_admin";

  let groupsQuery = supabase.from("groups").select("id");
  if (!isAdmin) groupsQuery = groupsQuery.eq("teacher_id", profile.id);

  const [groupsRes, peopleRes, newWorkRes] = await Promise.all([
    groupsQuery,
    isAdmin
      ? supabase.from("profiles").select("id, role")
      : Promise.resolve({ data: null as { id: string; role: string }[] | null }),
    // Work handed in that this person has not opened — the Reports badge.
    //
    // DISTINCT STUDENTS, NOT ROWS. The badge has to agree with what the page
    // shows when you click it, and Reports lists people: three essays from one
    // student is one name to look at, so a badge reading 3 would send a teacher
    // hunting for two names that aren't there. `payload->>studentId` is written
    // by notifyGradedToTeachers, so the attribution costs no extra join.
    supabase
      .from("notifications")
      .select("payload->>studentId")
      .eq("type", "attempt_graded")
      .is("read_at", null)
      .limit(500),
  ]);

  const groupIds = (groupsRes.data ?? []).map((g) => g.id as string);
  const counts: Record<string, number> = {
    groups: groupIds.length,
    newWork: new Set(
      ((newWorkRes.data ?? []) as { studentId: string | null }[])
        .map((n) => n.studentId)
        .filter(Boolean),
    ).size,
  };

  if (isAdmin) {
    const people = peopleRes.data ?? [];
    counts.teachers = people.filter((p) => p.role === "teacher").length;
    counts.students = people.filter((p) => p.role === "student").length;
    return counts;
  }

  if (groupIds.length === 0) {
    counts.students = 0;
    return counts;
  }
  const { data: roster } = await supabase
    .from("group_members")
    .select("student_id")
    .in("group_id", groupIds);
  // A student in two of this teacher's classes is one student.
  counts.students = new Set((roster ?? []).map((r) => r.student_id as string)).size;
  return counts;
}
