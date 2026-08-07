import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  EmptyRow,
  FAINT,
  INDIGO,
  INK,
  LINE,
  List,
  MUTED,
  PageHead,
  Panel,
  Pill,
  Row,
  RowText,
  SANS,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { StudentPhoto } from "@/components/console/student-photo";
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
    <div>
      <PageHead
        back={{ href: `/console/groups/${id}`, label: group.name }}
        title={report.name}
        media={<StudentPhoto name={report.name} url={report.photoUrl} size={46} />}
        subtitle={
          <>
            {report.recentCount} practice{report.recentCount === 1 ? "" : "s"} in the last 30 days
            {report.lastActive
              ? ` · last active ${new Date(report.lastActive).toLocaleDateString()}`
              : " · no practice yet"}
          </>
        }
      />

      <StatRow>
        {report.bands.map((b) => (
          <StatTile
            key={b.skill}
            value={b.current != null ? b.current.toFixed(1) : "—"}
            label={`${SKILL_LABEL[b.skill]}${b.target != null ? ` · target ${b.target.toFixed(1)}` : ""}`}
            tone={b.current != null ? "indigo" : "ink"}
          />
        ))}
      </StatRow>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        <WeaknessPanel
          title="Writing — what caps their band"
          description="The lowest criterion, counted across their graded essays."
          rows={report.writingWeaknesses}
          unit="essay"
        />
        <WeaknessPanel
          title="Reading — most-missed question types"
          description="Total wrong answers by question type."
          rows={report.readingWeaknesses}
          unit="wrong"
        />
      </div>

      <Panel
        title="Practice history"
        description={`Every practice with its date and band — open any one for the full marked-up report. ${report.homework.done} of ${report.homework.assigned} assigned ${report.homework.assigned === 1 ? "task" : "tasks"} completed.`}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", color: FAINT, fontSize: 12 }}>
                <th style={{ padding: "0 12px 9px 0", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "0 12px 9px 0", fontWeight: 600 }}>Practice</th>
                <th style={{ padding: "0 12px 9px 0", fontWeight: 600 }}>Score</th>
                <th style={{ padding: "0 12px 9px 0", fontWeight: 600, textAlign: "right" }}>Band</th>
                <th style={{ padding: "0 0 9px", fontWeight: 600, textAlign: "right" }}>Report</th>
              </tr>
            </thead>
            <tbody>
              {report.practices.map((p) => (
                <tr key={`${p.skill}-${p.id}`} style={{ borderTop: `1px solid ${LINE}` }}>
                  <td style={{ padding: "11px 12px 11px 0", color: MUTED, whiteSpace: "nowrap" }}>
                    {new Date(p.when).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "11px 12px 11px 0", color: INK }}>
                    {SKILL_LABEL[p.skill]}
                    {p.assigned ? (
                      <span style={{ marginLeft: 8 }}>
                        <Pill tone="indigo">Homework</Pill>
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: "11px 12px 11px 0", color: MUTED, whiteSpace: "nowrap" }}>
                    {p.score ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px 11px 0",
                      textAlign: "right",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      color: INK,
                    }}
                  >
                    {p.band != null ? p.band.toFixed(1) : "—"}
                  </td>
                  <td style={{ padding: "11px 0", textAlign: "right" }}>
                    {p.reportHref ? (
                      <Link
                        href={p.reportHref}
                        style={{
                          display: "inline-block",
                          border: `1px solid ${LINE}`,
                          borderRadius: 9,
                          padding: "5px 12px",
                          fontWeight: 600,
                          fontSize: 13,
                          color: INDIGO,
                          textDecoration: "none",
                          background: "#fff",
                        }}
                      >
                        Report
                      </Link>
                    ) : (
                      <span style={{ fontSize: 12.5, color: FAINT }}>Not graded</span>
                    )}
                  </td>
                </tr>
              ))}
              {report.practices.length === 0 ? (
                <tr style={{ borderTop: `1px solid ${LINE}` }}>
                  <td colSpan={5} style={{ padding: "12px 0", color: FAINT }}>
                    This student hasn&apos;t practised yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function WeaknessPanel({
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
    <Panel title={title} description={description}>
      <List>
        {rows.map((r, i) => (
          <Row key={r.label} first={i === 0}>
            <RowText title={<span style={{ textTransform: "capitalize" }}>{r.label}</span>} />
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, flex: "none" }}>
              {r.count} {unit}
              {r.count === 1 ? "" : "s"}
            </span>
          </Row>
        ))}
        {rows.length === 0 ? <EmptyRow>Nothing graded yet.</EmptyRow> : null}
      </List>
    </Panel>
  );
}
