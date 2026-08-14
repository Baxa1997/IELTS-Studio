import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface StudentAssignment {
  id: string;
  kind: "writing" | "reading" | "listening" | "lesson";
  title: string;
  instructions: string | null;
  groupName: string;
  dueAt: string | null;
  /** Deep link into the normal runner — the attempt it creates carries the
   *  assignment's prompt/test id, which is how the teacher's report finds it. */
  href: string;
  done: boolean;
  overdue: boolean;
}

/**
 * Assignments for the signed-in student, across every group they're in.
 * Everything reads under RLS: `assignments_member_select` returns only the rows
 * for groups they belong to.
 */
export async function loadStudentAssignments(
  studentId: string,
  now: Date = new Date(),
): Promise<StudentAssignment[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("assignments")
    .select(
      "id, kind, title, instructions, due_at, group_id, prompt_id, reading_test_id, listening_library_id, lesson_id",
    )
    .order("created_at", { ascending: false });
  if (!rows || rows.length === 0) return [];

  const groupIds = [...new Set(rows.map((r) => r.group_id as string))];
  const promptIds = rows.filter((r) => r.prompt_id).map((r) => r.prompt_id as string);
  const testIds = rows.filter((r) => r.reading_test_id).map((r) => r.reading_test_id as string);
  const listeningIds = rows
    .filter((r) => r.listening_library_id)
    .map((r) => r.listening_library_id as string);

  const [groupsRes, essaysRes, attemptsRes, listeningRes] = await Promise.all([
    supabase.from("groups").select("id, name").in("id", groupIds),
    promptIds.length > 0
      ? supabase
          .from("essays")
          .select("prompt_id, status")
          .eq("student_id", studentId)
          .in("prompt_id", promptIds)
      : Promise.resolve({ data: [] }),
    testIds.length > 0
      ? supabase
          .from("reading_attempts")
          .select("test_id, status")
          .eq("student_id", studentId)
          .in("test_id", testIds)
      : Promise.resolve({ data: [] }),
    // Listening has no status column: a score IS the grade (see
    // v_practice_activity), so a scored attempt is a finished one.
    listeningIds.length > 0
      ? supabase
          .from("listening_attempts")
          .select("library_id, score")
          .eq("student_id", studentId)
          .in("library_id", listeningIds)
      : Promise.resolve({ data: [] }),
  ]);

  const lessonIds = rows.filter((r) => r.lesson_id).map((r) => r.lesson_id as string);
  const { data: lessonAttempts } = lessonIds.length > 0
    ? await supabase
        .from("lesson_attempts")
        .select("lesson_id, grading_status")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds)
    : { data: [] as { lesson_id: string; grading_status: string }[] };

  const groupName = new Map(
    (groupsRes.data ?? []).map((g) => [g.id as string, g.name as string]),
  );
  const finished = new Set<string>();
  for (const e of (essaysRes.data ?? []) as { prompt_id: string; status: string }[]) {
    if (e.status === "graded") finished.add(e.prompt_id);
  }
  for (const a of (attemptsRes.data ?? []) as { test_id: string; status: string }[]) {
    if (a.status === "graded") finished.add(a.test_id);
  }
  for (const l of (listeningRes.data ?? []) as { library_id: string; score: number | null }[]) {
    if (l.score != null) finished.add(l.library_id);
  }
  // A lesson is finished the moment it is handed in. Written answers may still
  // be with the marker, but the student has done their part — leaving it on the
  // to-do list would ask them to sit it again.
  for (const a of (lessonAttempts ?? []) as { lesson_id: string }[]) {
    finished.add(a.lesson_id);
  }

  return rows.map((r) => {
    const contentId = (r.prompt_id ??
      r.reading_test_id ??
      r.listening_library_id ??
      r.lesson_id) as string;
    const dueAt = (r.due_at as string | null) ?? null;
    const done = finished.has(contentId);
    return {
      id: r.id as string,
      kind: r.kind as StudentAssignment["kind"],
      title: r.title as string,
      instructions: (r.instructions as string | null) ?? null,
      groupName: groupName.get(r.group_id as string) ?? "Your group",
      dueAt,
      href:
        r.kind === "writing"
          ? `/write/${r.prompt_id}`
          : r.kind === "reading"
            ? `/read/test/${r.reading_test_id}`
            : r.kind === "lesson"
              ? `/learn/${r.lesson_id}`
              : `/listen?item=${r.listening_library_id}`,
      done,
      overdue: !done && dueAt != null && new Date(dueAt) < now,
    };
  });
}
