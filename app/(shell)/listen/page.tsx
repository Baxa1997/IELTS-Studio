import { AssignToClass } from "@/components/console/assign-to-class";
import { AssignedHub } from "@/components/assignments/assigned-hub";
import { loadStudentAssignments } from "@/lib/assignments/student";
import { isHomeworkOnlyStudent, requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { ListeningClient } from "./listening-client";

export const dynamic = "force-dynamic";

/**
 * Listening practice hub — Parts 1 & 4 live (original scripts + exam-style TTS
 * audio, generated and graded on the AI engine; Parts 2 & 3 shown as coming
 * soon). Browser-direct engine calls like the CEFR hub, so the ~2 min
 * generate+synthesize runs off Vercel's serverless cap. Students only.
 */
export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  // Staff browse and play the same practices their class does.
  const { profile } = await requireOrgUser();
  // Only a teacher gets the bench — a center_admin doesn't set practice, which
  // is the same rule assignPractice enforces server-side.
  const isTeacher = profile.role === "teacher";
  let groups: { id: string; name: string }[] = [];
  if (isTeacher) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("groups")
      .select("id, name")
      .eq("teacher_id", profile.id)
      .order("name");
    groups = (data ?? []) as { id: string; name: string }[];
  }
  // ?item=<library id> opens that practice directly — set by the client when a
  // practice is opened, and by the assignment link a student follows.
  const { item } = await searchParams;
  // This route is both the hub and the player: ?item=<id> opens one practice,
  // which is exactly what an assignment link does. So a center student is sent
  // away from the browsable hub but can still open what they were set.
  // ?item=<id> is the player — an assignment link lands there and must open.
  // Without one this is the browsable hub, which a center student swaps for
  // their own listening homework.
  if (!item && isHomeworkOnlyStudent(profile)) {
    const assignments = await loadStudentAssignments(profile.id);
    return (
      <AssignedHub
        skill="listening"
        assignments={assignments.filter((a) => a.kind === "listening")}
      />
    );
  }

  return (
    <>
      <ListeningClient initialLibraryId={item} isTeacher={isTeacher} groups={groups} />
      {item ? <AssignToClass kind="listening" contentId={item} /> : null}
    </>
  );
}
