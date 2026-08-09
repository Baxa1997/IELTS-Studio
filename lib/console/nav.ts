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

  const [groupsRes, peopleRes] = await Promise.all([
    groupsQuery,
    isAdmin
      ? supabase.from("profiles").select("id, role")
      : Promise.resolve({ data: null as { id: string; role: string }[] | null }),
  ]);

  const groupIds = (groupsRes.data ?? []).map((g) => g.id as string);
  const counts: Record<string, number> = { groups: groupIds.length };

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
