import { redirect } from "next/navigation";

import { BarList } from "@/components/admin/charts";
import { EmptyTableRow, ScrollTable, TD, TH, THead, TR } from "@/components/admin/table";
import {
  EmptyRow,
  FAINT,
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
import { loadCenterReport } from "@/lib/console/reports";
import { createClient } from "@/lib/supabase/server";

import { ExportReportButton } from "./export-button";

export const dynamic = "force-dynamic";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * The report a center owner actually pays for: which classes are working, where
 * the marks go, and who has stopped.
 *
 * Everything is graded work from the last 90 days. Listening is scored, not
 * banded, so it never enters the band figures — and no "overall band" is
 * averaged across skills, because a number like that would be ours, not IELTS's.
 */
export default async function ReportsPage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const [report, orgRes] = await Promise.all([
    loadCenterReport({ role: profile.role, profileId: profile.id }),
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
  ]);
  const centerName = (orgRes.data?.name as string | null) ?? "Your center";

  const measured = report.skillAverages.filter((s) => s.samples > 0);

  return (
    <div>
      <PageHead
        eyebrow="Reports"
        title={report.scope === "center" ? centerName : "Your classes"}
        subtitle="Graded practice from the last 90 days. Listening is scored out of 40, so it sits outside the band figures."
      />

      <StatRow>
        <StatTile value={report.totals.students} label="Students" tone="indigo" />
        <StatTile value={report.totals.groups} label={report.scope === "center" ? "Classes" : "Your classes"} />
        <StatTile value={report.totals.gradedPractices} label="Graded practices" />
        <StatTile value={report.atRisk.length} label="Gone quiet (14 days)" />
      </StatRow>

      <Panel
        title="Classes"
        description="Completion is the share of set practice that has been finished and graded."
        actions={<ExportReportButton rows={report.groups} centerName={centerName} />}
      >
        <ScrollTable maxHeight={420} caption="Scroll for more.">
          <THead>
            <TH>Class</TH>
            {report.scope === "center" ? <TH>Teacher</TH> : null}
            <TH align="right">Students</TH>
            <TH align="right">Set</TH>
            <TH align="right">Completion</TH>
            <TH align="right">Avg band</TH>
            <TH />
          </THead>
          <tbody>
            {report.groups.map((g, i) => (
              <TR key={g.id} first={i === 0}>
                <TD>{g.name}</TD>
                {report.scope === "center" ? <TD muted>{g.teacherName ?? "—"}</TD> : null}
                <TD align="right" numeric>
                  {g.students}
                </TD>
                <TD align="right" numeric muted={g.assignments === 0}>
                  {g.assignments}
                </TD>
                <TD align="right" numeric muted={g.completionPct == null}>
                  {g.completionPct == null ? "—" : `${g.completionPct}%`}
                </TD>
                <TD align="right" numeric muted={g.averageBand == null}>
                  {g.averageBand == null ? "—" : g.averageBand.toFixed(1)}
                </TD>
                <TD align="right">
                  <RowLink href={`/console/groups/${g.id}`}>Open</RowLink>
                </TD>
              </TR>
            ))}
            {report.groups.length === 0 ? (
              <EmptyTableRow colSpan={report.scope === "center" ? 7 : 6}>
                No classes yet. Create one and set it some practice.
              </EmptyTableRow>
            ) : null}
          </tbody>
        </ScrollTable>
      </Panel>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        <Panel title="Bands awarded" description="Every graded writing, reading and speaking practice.">
          {report.bandBuckets.length > 0 ? (
            <BarList rows={report.bandBuckets} />
          ) : (
            <List>
              <EmptyRow>Nothing graded in this window yet.</EmptyRow>
            </List>
          )}
        </Panel>

        <Panel title="Average by skill" description="Rests only on what has actually been graded.">
          <List>
            {measured.map((s, i) => (
              <Row key={s.skill} first={i === 0}>
                <RowText
                  title={s.skill}
                  meta={`${s.samples} graded practice${s.samples === 1 ? "" : "s"}`}
                />
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, flex: "none" }}>
                  {s.band?.toFixed(1) ?? "—"}
                </span>
              </Row>
            ))}
            {measured.length === 0 ? <EmptyRow>No graded practice yet.</EmptyRow> : null}
          </List>
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        <Panel
          title="What caps their writing"
          description="The lowest criterion on each graded essay — the one thing holding the band down."
        >
          {report.writingCaps.length > 0 ? (
            <BarList rows={report.writingCaps} />
          ) : (
            <List>
              <EmptyRow>No graded essays yet.</EmptyRow>
            </List>
          )}
        </Panel>

        <Panel
          title="Reading questions most often wrong"
          description="Total wrong answers by question type, across the classes in scope."
        >
          {report.readingMisses.length > 0 ? (
            <BarList rows={report.readingMisses} color="#B9791A" />
          ) : (
            <List>
              <EmptyRow>No graded reading tests yet.</EmptyRow>
            </List>
          )}
        </Panel>
      </div>

      <Panel
        title="Gone quiet"
        description="No graded practice in the last 14 days. The earliest to stop is first."
      >
        <List>
          {report.atRisk.slice(0, 25).map((s, i) => (
            <Row key={s.id} first={i === 0}>
              <RowText
                title={s.name}
                meta={s.lastActive ? `last practised ${dateFmt(s.lastActive)}` : "has never practised"}
              />
              <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
                {s.lastActive ? null : <Pill tone="warn">never started</Pill>}
                <RowLink href={`/console/students/${s.id}`}>Report</RowLink>
              </span>
            </Row>
          ))}
          {report.atRisk.length === 0 ? (
            <EmptyRow>Everyone has practised in the last two weeks.</EmptyRow>
          ) : null}
        </List>
        {report.atRisk.length > 25 ? (
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, marginTop: 10 }}>
            Showing 25 of {report.atRisk.length}.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
