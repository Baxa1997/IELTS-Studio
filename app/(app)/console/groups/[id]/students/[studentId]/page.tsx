import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgUser } from "@/lib/auth";
import { loadGroupDetail } from "@/lib/console/groups";
import { loadStudentReport, type WeaknessRow } from "@/lib/console/student-report";

const SKILL_LABEL = {
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
} as const;

/** One student's whole practice picture for their teacher: bands, what they've
 *  been doing, and the mistakes that keep coming back. */
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/console/groups/${id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> {group.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{report.name}</h1>
        <p className="text-muted-foreground">
          {report.recentCount} practice{report.recentCount === 1 ? "" : "s"} in the last 30 days
          {report.lastActive
            ? ` · last active ${new Date(report.lastActive).toLocaleDateString()}`
            : " · no practice yet"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {report.bands.map((b) => (
          <div key={b.skill} className="bg-card rounded-xl border p-4">
            <p className="text-2xl font-semibold tabular-nums">
              {b.current != null ? b.current.toFixed(1) : "—"}
            </p>
            <p className="text-muted-foreground text-xs">
              {SKILL_LABEL[b.skill]}
              {b.target != null ? ` · target ${b.target.toFixed(1)}` : ""}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <WeaknessCard
          title="Writing — what caps their band"
          description="The lowest criterion, counted across their graded essays."
          rows={report.writingWeaknesses}
          unit="essay"
        />
        <WeaknessCard
          title="Reading — most-missed question types"
          description="Total wrong answers by question type."
          rows={report.readingWeaknesses}
          unit="wrong"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Practice history</CardTitle>
          <CardDescription>
            Homework and their own practice — {report.homework.done} of {report.homework.assigned}{" "}
            assigned {report.homework.assigned === 1 ? "task" : "tasks"} completed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {report.practices.map((p) => (
              <li key={`${p.skill}-${p.id}`} className="flex items-center justify-between gap-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate">
                    {SKILL_LABEL[p.skill]}
                    {p.assigned ? (
                      <span className="bg-primary/10 text-primary ml-2 rounded-full px-2 py-0.5 text-xs font-medium">
                        Homework
                      </span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {new Date(p.when).toLocaleDateString()}
                    {p.score ? ` · ${p.score}` : ""}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {p.band != null ? p.band.toFixed(1) : "—"}
                </span>
              </li>
            ))}
            {report.practices.length === 0 ? (
              <li className="text-muted-foreground py-2">
                This student hasn&apos;t practised yet.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function WeaknessCard({
  title,
  description,
  rows,
  unit,
}: {
  title: string;
  description: string;
  rows: WeaknessRow[];
  unit: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between py-2">
              <span className="truncate capitalize">{r.label}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {r.count} {unit}
                {r.count === 1 ? "" : "s"}
              </span>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="text-muted-foreground py-2">Nothing graded yet.</li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}
