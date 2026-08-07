import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgUser } from "@/lib/auth";
import { loadAssignmentReport } from "@/lib/console/assignments";

const STATUS_LABEL = {
  not_started: "Not started",
  in_progress: "In progress",
  graded: "Graded",
} as const;

/** The teacher's results table for one assignment: who did it, what band they
 *  got, and what cost them marks. */
export default async function AssignmentReportPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id, assignmentId } = await params;
  const report = await loadAssignmentReport(assignmentId);
  if (!report || report.groupId !== id) notFound();

  const completed = report.rows.filter((r) => r.status === "graded").length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/console/groups/${report.groupId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> {report.groupName}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{report.title}</h1>
        <p className="text-muted-foreground capitalize">
          {report.kind} · {completed}/{report.rows.length} completed
          {report.dueAt ? ` · due ${new Date(report.dueAt).toLocaleDateString()}` : ""}
        </p>
        {report.instructions ? <p className="text-sm">{report.instructions}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-2xl font-semibold tabular-nums">
            {report.averageBand?.toFixed(1) ?? "—"}
          </p>
          <p className="text-muted-foreground text-xs">Average band (graded only)</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-2xl font-semibold tabular-nums">
            {completed}/{report.rows.length}
          </p>
          <p className="text-muted-foreground text-xs">Completed</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription>Lowest band first — who needs attention.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {report.rows.map((r) => (
              <li key={r.studentId} className="flex items-start justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {STATUS_LABEL[r.status]}
                    {r.score ? ` · ${r.score}` : ""}
                    {r.weakness ? ` · weakest: ${r.weakness}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-lg font-semibold tabular-nums">
                  {r.band != null ? r.band.toFixed(1) : "—"}
                </span>
              </li>
            ))}
            {report.rows.length === 0 ? (
              <li className="text-muted-foreground py-2">
                This group has no students yet.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      {report.commonMistakes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What the group struggled with</CardTitle>
            <CardDescription>
              {report.kind === "writing"
                ? "The criterion capping each student's band."
                : "The question types most often missed."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {report.commonMistakes.map((m) => (
                <li key={m.label} className="flex items-center justify-between py-2">
                  <span className="truncate capitalize">{m.label}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {m.count} student{m.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
