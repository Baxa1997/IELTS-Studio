import { redirect } from "next/navigation";

import {
  AMBER,
  Avatar,
  Bar,
  Card,
  CardHead,
  CardNote,
  Columns,
  Empty,
  FAINT,
  GREEN,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  ListRow,
  MeterRow,
  MUTED,
  PageHead,
  RED,
  SANS,
  Split,
  Stack,
  Table,
  Tag,
  TD,
  TextLink,
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { buildFindings, type Finding } from "@/lib/console/report-findings";
import { loadRecentWork } from "@/lib/console/recent-work";
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
  const [report, orgRes, recentWork] = await Promise.all([
    loadCenterReport({ role: profile.role, profileId: profile.id }),
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
    loadRecentWork(profile),
  ]);
  const centerName = (orgRes.data?.name as string | null) ?? "Your center";
  const isCenter = report.scope === "center";

  const measured = report.skillAverages.filter((s) => s.samples > 0);
  const topBucket = Math.max(1, ...report.bandBuckets.map((b) => b.value));
  const topCap = Math.max(1, ...report.writingCaps.map((c) => c.value));
  const topMiss = Math.max(1, ...report.readingMisses.map((m) => m.value));

  const banded = report.groups.filter((g) => g.averageBand != null);
  const centerBand = banded.length
    ? banded.reduce((n, g) => n + (g.averageBand ?? 0), 0) / banded.length
    : null;

  const findings = buildFindings(report);

  const WORK_COLS = "1.6fr 1.2fr .8fr 1fr .9fr";

  const COLS = isCenter ? "2fr 1.4fr .8fr .9fr 1.3fr .8fr" : "2fr .8fr .9fr 1.3fr .8fr";

  return (
    <div>
      <PageHead
        eyebrow="Reports"
        title={isCenter ? centerName : "Your classes"}
        subtitle="Graded practice from the last 90 days. Listening is scored out of 40, so it sits outside the band figures."
        actions={<ExportReportButton rows={report.groups} centerName={centerName} />}
      />

      <KpiRow>
        <Kpi label="Students" value={report.totals.students} sub="in a class" />
        <Kpi label={isCenter ? "Classes" : "Your classes"} value={report.totals.groups} />
        <Kpi label="Graded practices" value={report.totals.gradedPractices} sub="last 90 days" />
        <Kpi
          label="Average class band"
          value={centerBand?.toFixed(1) ?? "—"}
          sub={banded.length ? `${banded.length} class(es) graded` : "nothing graded yet"}
        />
        <Kpi
          label="Gone quiet"
          value={report.atRisk.length}
          deltaTone="bad"
          sub="no practice in 14 days"
        />
      </KpiRow>

      {/* THE ANSWERS FIRST. Everything below this is evidence; a center owner
          who reads only the top of the page should still learn what to do. */}
      {findings.length > 0 ? (
        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          {findings.map((f, i) => (
            <FindingCard key={i} finding={f} />
          ))}
        </div>
      ) : null}

      <Stack>
        <Card flush>
          <CardHead
            title="What students handed in"
            divided
            note="newest first — open any one to read the same feedback the student got"
          />
          {recentWork.length > 0 ? (
            <Table cols={WORK_COLS} minWidth={720}>
              <THead cols={WORK_COLS} labels={["Student", "Skill", "Result", "When", ""]} />
              {recentWork.map((w) => (
                <TRow key={`${w.skill}-${w.id}`} cols={WORK_COLS}>
                  <TD tone="ink" weight={500}>
                    {w.studentName}
                  </TD>
                  <TD>
                    <span style={{ textTransform: "capitalize" }}>{w.skill}</span>
                    {w.assigned ? (
                      <span style={{ marginLeft: 7 }}>
                        <Tag tone="indigo">homework</Tag>
                      </span>
                    ) : null}
                  </TD>
                  <TD tone="ink" weight={600}>
                    {w.band != null
                      ? w.band.toFixed(1)
                      : (w.score ?? (
                          <span style={{ color: FAINT, fontWeight: 400 }}>grading…</span>
                        ))}
                  </TD>
                  <TD tone="soft">{dateFmt(w.when)}</TD>
                  <TD align="right">
                    {w.reportHref ? (
                      <TextLink href={w.reportHref}>Full feedback →</TextLink>
                    ) : (
                      <span style={{ color: FAINT, fontSize: 12 }}>not finished</span>
                    )}
                  </TD>
                </TRow>
              ))}
            </Table>
          ) : (
            <Empty>
              Nothing handed in yet. Once a student finishes a practice it appears here with its
              feedback.
            </Empty>
          )}
        </Card>

        <details>
          <summary
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: MUTED,
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            Show the working — band spread, trend and skill averages
          </summary>
          <Split>
            <Card>
              <CardHead
                title="Bands awarded"
                note="every graded writing, reading and speaking practice"
              />
              {report.bandBuckets.length > 0 ? (
                <Columns
                  bars={report.bandBuckets.map((b) => ({
                    label: b.label,
                    cap: b.value,
                    pct: (b.value / topBucket) * 100,
                    fill: INDIGO,
                  }))}
                  height={150}
                />
              ) : (
                <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
                  Nothing graded in this window yet.
                </p>
              )}
            </Card>

            <Card>
              <CardHead title="Average by skill" />
              <CardNote>
                Rests only on what has actually been graded — never averaged into one overall band.
              </CardNote>
              {measured.map((s) => (
                <MeterRow
                  key={s.skill}
                  label={<span style={{ textTransform: "capitalize" }}>{s.skill}</span>}
                  pct={((s.band ?? 0) / 9) * 100}
                  value={s.band?.toFixed(1) ?? "—"}
                  fill={(s.band ?? 0) >= 6.5 ? GREEN : (s.band ?? 0) >= 5.5 ? AMBER : RED}
                  trail={
                    <span
                      style={{
                        color: FAINT,
                        width: 74,
                        display: "inline-block",
                        textAlign: "right",
                      }}
                    >
                      {s.samples} graded
                    </span>
                  }
                />
              ))}
              {measured.length === 0 ? (
                <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
                  No graded practice yet.
                </p>
              ) : null}
            </Card>
          </Split>
        </details>

        <Card flush>
          <CardHead
            title="Classes"
            divided
            note="completion is the share of set practice finished and graded"
          />
          <Table cols={COLS} minWidth={isCenter ? 780 : 620}>
            <THead
              cols={COLS}
              labels={
                isCenter
                  ? ["Class", "Teacher", "Students", "Avg band", "Completion", "Set"]
                  : ["Class", "Students", "Avg band", "Completion", "Set"]
              }
            />
            {report.groups.map((g) => (
              <TRow key={g.id} cols={COLS} href={`/console/groups/${g.id}`}>
                <TD tone="ink" weight={500}>
                  {g.name}
                </TD>
                {isCenter ? <TD tone="body">{g.teacherName ?? "—"}</TD> : null}
                <TD>{g.students}</TD>
                <TD tone="ink" weight={600}>
                  {g.averageBand?.toFixed(1) ?? "—"}
                </TD>
                <TD>
                  {g.completionPct == null ? (
                    <span style={{ color: FAINT }}>—</span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Bar
                        pct={g.completionPct}
                        width={60}
                        fill={g.completionPct >= 60 ? GREEN : INDIGO}
                      />
                      <span style={{ fontSize: 12 }}>{g.completionPct}%</span>
                    </span>
                  )}
                </TD>
                <TD tone={g.assignments === 0 ? "faint" : "body"}>{g.assignments}</TD>
              </TRow>
            ))}
            {report.groups.length === 0 ? (
              <Empty>No classes yet. Create one and set it some practice.</Empty>
            ) : null}
          </Table>
        </Card>

        <Split ratio="1fr 1fr">
          <Card>
            <CardHead title="What caps their writing" />
            <CardNote>
              The lowest criterion on each graded essay — the one thing holding the band down.
            </CardNote>
            {report.writingCaps.map((c) => (
              <MeterRow
                key={c.label}
                label={c.label}
                labelWidth={150}
                pct={(c.value / topCap) * 100}
                value={c.value}
                fill={INDIGO}
              />
            ))}
            {report.writingCaps.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
                No graded essays yet.
              </p>
            ) : null}
          </Card>

          <Card>
            <CardHead title="Reading questions most often wrong" />
            <CardNote>Total wrong answers by question type, across the classes in scope.</CardNote>
            {report.readingMisses.map((m) => (
              <MeterRow
                key={m.label}
                label={m.label}
                labelWidth={150}
                pct={(m.value / topMiss) * 100}
                value={m.value}
                fill={AMBER}
              />
            ))}
            {report.readingMisses.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
                No graded reading tests yet.
              </p>
            ) : null}
          </Card>
        </Split>

        <Card flush id="needs-attention">
          <CardHead
            title="Needs attention"
            divided
            badge={report.atRisk.length > 0 ? <Tag tone="red">{report.atRisk.length}</Tag> : null}
            note="no graded practice in the last 14 days — earliest to stop first"
          />
          {report.atRisk.slice(0, 25).map((s) => (
            <ListRow
              key={s.id}
              href={`/console/students/${s.id}`}
              lead={<Avatar name={s.name} size={30} />}
              title={s.name}
              meta={
                s.lastActive ? `last practised ${dateFmt(s.lastActive)}` : "has never practised"
              }
              trail={
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {s.lastActive ? null : <Tag tone="amber">never started</Tag>}
                  <span style={{ fontFamily: SANS, fontSize: 12.5, color: INDIGO }}>Report →</span>
                </span>
              }
            />
          ))}
          {report.atRisk.length === 0 ? (
            <Empty>Everyone has practised in the last two weeks.</Empty>
          ) : null}
          {report.atRisk.length > 25 ? (
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, padding: "12px 18px" }}>
              Showing 25 of {report.atRisk.length}.{" "}
              <TextLink href="/console/students?sort=idle">See the whole roster →</TextLink>
            </div>
          ) : null}
        </Card>
      </Stack>
    </div>
  );
}

/**
 * One answer, stated plainly.
 *
 * Tone is carried by a single left edge and the headline's weight, not by a
 * filled panel: three stacked coloured blocks read as an alert screen, and most
 * findings are neither good nor bad news — they are just the situation.
 */
function FindingCard({ finding }: { finding: Finding }) {
  const accent = finding.tone === "good" ? GREEN : finding.tone === "bad" ? RED : "#C9C6BD";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        background: "#fff",
        border: "1px solid #E9E7E1",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 11,
        padding: "13px 15px",
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.4,
          }}
        >
          {finding.headline}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: SANS,
            fontSize: 12.5,
            color: MUTED,
            marginTop: 3,
            lineHeight: 1.5,
          }}
        >
          {finding.detail}
        </span>
      </span>
      {finding.action ? (
        <TextLink href={finding.action.href}>{finding.action.label} →</TextLink>
      ) : null}
    </div>
  );
}
