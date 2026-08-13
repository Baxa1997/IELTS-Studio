import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  EmptyRow,
  FAINT,
  INK,
  List,
  PageHead,
  Panel,
  Pill,
  Row,
  RowLink,
  RowText,
  SANS,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadAssignmentReport } from "@/lib/console/assignments";

const STATUS = {
  not_started: { label: "Not started", tone: "neutral" as const },
  in_progress: { label: "In progress", tone: "warn" as const },
  graded: { label: "Graded", tone: "good" as const },
};

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
    <div>
      <PageHead
        back={{ href: `/console/groups/${report.groupId}`, label: report.groupName }}
        eyebrow={report.kind}
        title={report.title}
        subtitle={
          <>
            {completed}/{report.rows.length} completed
            {report.dueAt ? ` · due ${new Date(report.dueAt).toLocaleDateString()}` : ""}
            {report.instructions ? ` · ${report.instructions}` : ""}
          </>
        }
      />

      <StatRow>
        <StatTile
          value={report.averageBand?.toFixed(1) ?? "—"}
          label="Average band (graded only)"
          tone="indigo"
        />
        <StatTile value={`${completed}/${report.rows.length}`} label="Completed" />
      </StatRow>

      <Panel title="Results" description="Lowest band first — who needs attention.">
        <List>
          {report.rows.map((r, i) => {
            const status = STATUS[r.status];
            return (
              <Row key={r.studentId} first={i === 0}>
                <RowText
                  title={
                    /* The name opens everything this student has ever done;
                       "See their work" opens this one piece. Two different
                       questions a teacher asks from the same row. */
                    <Link
                      href={`/console/groups/${report.groupId}/students/${r.studentId}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {r.name}
                    </Link>
                  }
                  meta={
                    <>
                      <Pill tone={status.tone}>{status.label}</Pill>
                      {r.score ? ` · ${r.score}` : ""}
                      {r.weakness ? ` · weakest: ${r.weakness}` : ""}
                    </>
                  }
                />
                <span style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
                  {/* The band said what they scored; this says what they wrote.
                      It is the learner's own feedback page — the marked-up
                      essay, the per-answer explanations — not a staff copy of
                      it, so the teacher reads exactly what the student read. */}
                  {r.reportHref ? <RowLink href={r.reportHref}>See their work →</RowLink> : null}
                  <span
                    style={{
                      fontFamily: SANS,
                      fontWeight: 700,
                      fontSize: 17,
                      fontVariantNumeric: "tabular-nums",
                      color: INK,
                    }}
                  >
                    {r.band != null ? r.band.toFixed(1) : "—"}
                  </span>
                </span>
              </Row>
            );
          })}
          {report.rows.length === 0 ? <EmptyRow>This group has no students yet.</EmptyRow> : null}
        </List>
      </Panel>

      {report.commonMistakes.length > 0 ? (
        <Panel
          title="What the group struggled with"
          description={
            report.kind === "writing"
              ? "The criterion capping each student's band."
              : "The question types most often missed."
          }
        >
          <List>
            {report.commonMistakes.map((m, i) => (
              <Row key={m.label} first={i === 0}>
                <RowText title={<span style={{ textTransform: "capitalize" }}>{m.label}</span>} />
                <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, flex: "none" }}>
                  {m.count} student{m.count === 1 ? "" : "s"}
                </span>
              </Row>
            ))}
          </List>
        </Panel>
      ) : null}
    </div>
  );
}
