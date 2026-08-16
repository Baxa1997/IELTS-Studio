import { notFound, redirect } from "next/navigation";

import { StudentReportView } from "@/components/console/student-report-view";
import { requireOrgUser } from "@/lib/auth";
import { loadGroupDetail } from "@/lib/console/groups";
import { loadStudentReport } from "@/lib/console/student-report";

/** One student's practice picture, reached from their group — so "back" returns
 *  to the group. The same report hangs off the roster at /console/students/[id]. */
export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id, studentId } = await params;

  // Reading the group first proves the caller manages it (RLS), and that this
  // student is actually in it.
  const group = await loadGroupDetail(id);
  if (!group || !group.members.some((m) => m.id === studentId)) notFound();

  const report = await loadStudentReport(studentId);
  if (!report) notFound();

  return (
    <StudentReportView
      report={report}
      back={{ href: `/console/groups/${id}`, label: group.name }}
    />
  );
}
