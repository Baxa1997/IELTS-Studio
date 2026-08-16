import { notFound, redirect } from "next/navigation";

import { StudentReportView } from "@/components/console/student-report-view";
import { requireOrgUser } from "@/lib/auth";
import { loadStudentReport } from "@/lib/console/student-report";
import { createClient } from "@/lib/supabase/server";

/**
 * The same student report, reached from the center roster instead of a group —
 * which is the only way to open a student who is in no group at all, and the
 * reason the "In no group" card could point nowhere until now.
 *
 * Authorization is explicit rather than inherited from a group: `profiles` is
 * readable org-wide by any staff member, so without this check a teacher could
 * open a name and photo belonging to another teacher's group (the practice data
 * itself is already scoped by can_view_student). A center_admin sees the whole
 * org; a teacher must share a group with the student, and `group_members` under
 * RLS only returns groups they manage — so a non-empty result IS the proof.
 */
export default async function RosterStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;

  if (profile.role === "teacher") {
    const supabase = await createClient();
    const { data: shared } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("student_id", id)
      .limit(1);
    if (!shared || shared.length === 0) notFound();
  }

  const report = await loadStudentReport(id);
  if (!report) notFound();

  return (
    <StudentReportView report={report} back={{ href: "/console/students", label: "Students" }} />
  );
}
