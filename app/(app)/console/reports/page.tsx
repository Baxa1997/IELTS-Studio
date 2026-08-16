import { redirect } from "next/navigation";

import {
  AMBER,
  Avatar,
  Bar,
  BandCell,
  Card,
  CardHead,
  CardNote,
  Columns,
  Empty,
  FAINT,
  GREEN,
  INDIGO,
  INK,
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
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { buildFindings } from "@/lib/console/report-findings";
import { loadWorkOverview } from "@/lib/console/recent-work";
import { loadCenterReport, SKILL_UNIT, type SkillName } from "@/lib/console/reports";
import { ALWAYS_CURRENT, type RangeKey } from "@/lib/console/window";
import { createClient } from "@/lib/supabase/server";

import { ReportAlerts } from "./alerts-button";
import { RangePicker } from "./range-picker";
import { ExportReportButton } from "./export-button";

export const dynamic = "force-dynamic";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Days since, for the "gone quiet" tag. */
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Two weeks with nothing marked is the point at which a teacher should ring. */
const QUIET_DAYS = 14;

/**
 * The affordance at the end of a clickable row.
 *
 * Deliberately NOT a TextLink: `TRow href` already wraps the whole row in an
 * anchor, and an anchor inside an anchor is invalid HTML — React warns on
 * hydration and the inner link stops working in some browsers. The row is the
 * link; this is just the arrow that says so.
 */
function OpenArrow() {
  return <span style={{ fontFamily: SANS, fontSize: 12.5, color: INDIGO }}>Open →</span>;
}

/**
 * Step one of three: WHO.
 *
 * WHAT THIS PAGE IS FOR. A teacher sets homework, the students do it, and the
 * grader writes a full report on each piece. The only question this page has to
 * answer is "who has handed in, and who hasn't" — everything else is one click
 * away:
 *
 *   Reports (who) → a student (their homework, newest first, with dates)
 *                 → one piece (band, what capped it, the marked-up work)
 *
 * WHY IT IS TWO LISTS AND A DRAWER. It used to be nine analytics panels — a
 * band histogram, a monthly trend, per-skill means, capping criteria, missed
 * question types, a class table, an at-risk list, a KPI row and a stack of
 * finding cards. Every panel was accurate; the page as a whole answered
 * nothing, because a teacher opening it on a Tuesday evening wants a list of
 * names, not a dashboard. The charts are still here, under "Show the working",
 * for the once-a-term conversation they are actually good for.
 *
 * EVERY STUDENT APPEARS EXACTLY ONCE. "Has stopped" is a tag on a row, not a
 * third list — a name in two places makes a roster impossible to count.
 *
 * ONE RANGE GOVERNS THIS PAGE (R1). The picker in the header sets it, every
 * band, count and completion below is measured over it, and the two figures
 * that deliberately ignore it — gone quiet, work nobody has opened — say
 * "always current" beside themselves rather than leaving the reader to wonder
 * why they did not move.
 *
 * Listening is banded from its own result, no "overall band" is ever averaged
 * across skills, and every band carries the count behind it.
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const supabase = await createClient();
  const [report, orgRes, overview] = await Promise.all([
    loadCenterReport({ role: profile.role, profileId: profile.id, range: sp.range as RangeKey }),
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
    loadWorkOverview(profile),
  ]);
  const { students, unopenedCount } = overview;
  const centerName = (orgRes.data?.name as string | null) ?? "Your center";
  const isCenter = report.scope === "center";

  const measured = report.skillAverages.filter((s) => s.attempts > 0);
  // Writing leads: it is graded most, it is the moat, and a distribution has to
  // belong to ONE skill or it is a picture of nothing.
  const headline: SkillName =
    measured.length > 0
      ? ([...measured].sort((a, b) => b.attempts - a.attempts)[0].skill as SkillName)
      : "Writing";
  const buckets = report.bandBuckets[headline];
  const topBucket = Math.max(1, ...buckets.map((b) => b.value));
  const topCap = Math.max(1, ...report.writingCaps.map((c) => c.value));
  const topMiss = Math.max(1, ...report.readingMisses.map((m) => m.value));

  const findings = buildFindings(report);

  // Newest hand-in first: this list is read top-down as "what came in".
  const handedIn = students
    .filter((s) => s.done > 0)
    .sort((a, b) => (b.lastGraded ?? "").localeCompare(a.lastGraded ?? ""));

  // The same people, filtered to those with work nobody has opened — this is
  // what the Alerts menu names, so a teacher gets "who did their homework"
  // without reading the page behind it.
  const newByStudent = handedIn
    .filter((s) => s.unopened > 0)
    .map((s) => ({
      studentId: s.studentId,
      name: s.name,
      groupName: s.groupName,
      count: s.unopened,
      when: s.lastGraded,
      href: s.reportHref,
    }));

  // Longest silence first: this one is read as "who to chase".
  const waiting = students
    .filter((s) => s.done === 0)
    .sort((a, b) => (a.lastActive ?? "").localeCompare(b.lastActive ?? ""));

  const IN_COLS = "1.7fr 1.1fr 1.1fr .8fr 1fr .8fr";
  const WAIT_COLS = "1.8fr 1.2fr 1.2fr 1fr .8fr";
  const COLS = isCenter ? "2fr 1.4fr .8fr .9fr 1.3fr .8fr" : "2fr .8fr .9fr 1.3fr .8fr";

  return (
    <div>
      <PageHead
        eyebrow="Reports"
        title={isCenter ? centerName : "Your students"}
        subtitle={`${report.totals.students} student${report.totals.students === 1 ? "" : "s"} · ${report.totals.groups} group${report.totals.groups === 1 ? "" : "s"} · ${report.totals.gradedPractices} marked ${report.window.label.toLowerCase()}.`}
        actions={
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RangePicker value={report.window.key} />
            {/* THE WARNINGS, one control wide. These used to be a stack of cards
                that pushed the students below the fold on every visit. */}
            <ReportAlerts
              findings={findings}
              newByStudent={newByStudent}
              newWorkHref="#handed-in"
            />
            <ExportReportButton rows={report.groups} centerName={centerName} />
          </span>
        }
      />

      <Stack>
        {/* ── 1. who has handed in ─────────────────────────────────────────── */}
        <Card flush id="handed-in">
          <CardHead
            title="Handed in"
            divided
            badge={unopenedCount > 0 ? <Tag tone="red">{unopenedCount} new</Tag> : null}
            note={`newest first — open a student to see every piece they did, with the marking · ${ALWAYS_CURRENT}`}
          />
          {handedIn.length > 0 ? (
            <Table cols={IN_COLS}>
              <THead
                cols={IN_COLS}
                labels={["Student", "Class", "Handed in", "Band", "Last", ""]}
              />
              {handedIn.map((s) => {
                const quiet = s.lastGraded ? daysSince(s.lastGraded) : null;
                const gone = quiet != null && quiet >= QUIET_DAYS;
                return (
                  <TRow key={s.studentId} cols={IN_COLS} href={s.reportHref}>
                    <TD tone="ink" weight={500}>
                      <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                        <Avatar name={s.name} size={26} />
                        <span style={{ minWidth: 0 }}>{s.name}</span>
                        {s.unopened > 0 ? <Tag tone="red">{s.unopened} new</Tag> : null}
                      </span>
                    </TD>
                    <TD tone="soft">{s.groupName ?? "—"}</TD>
                    <TD tone="body">
                      <strong style={{ color: INK }}>{s.done}</strong>
                      {s.homeworkDone > 0 ? (
                        <span style={{ color: FAINT, fontSize: 12 }}>
                          {" "}
                          · {s.homeworkDone} homework
                        </span>
                      ) : (
                        <span style={{ color: FAINT, fontSize: 12 }}> · none set</span>
                      )}
                    </TD>
                    <TD tone="ink" weight={600}>
                      {s.latestBand?.toFixed(1) ?? <span style={{ color: FAINT }}>—</span>}
                    </TD>
                    <TD tone="soft">
                      {s.lastGraded ? dateFmt(s.lastGraded) : "—"}
                      {gone ? (
                        <span style={{ marginLeft: 7 }}>
                          <Tag tone="amber">quiet {quiet}d</Tag>
                        </span>
                      ) : null}
                    </TD>
                    <TD align="right">
                      <OpenArrow />
                    </TD>
                  </TRow>
                );
              })}
            </Table>
          ) : (
            <Empty action={{ href: "/console/groups", label: "Set the first practice →" }}>
              Nothing has been handed in yet. Work lands here as soon as it is marked.
            </Empty>
          )}
        </Card>

        {/* ── 2. who hasn't ────────────────────────────────────────────────── */}
        <Card flush id="waiting">
          <CardHead
            title="Nothing back yet"
            divided
            badge={waiting.length > 0 ? <Tag tone="amber">{waiting.length}</Tag> : null}
            note="students in your classes with no marked work — longest silence first"
          />
          {waiting.length > 0 ? (
            <Table cols={WAIT_COLS}>
              <THead
                cols={WAIT_COLS}
                labels={["Student", "Class", "Started but unfinished", "Last seen", ""]}
              />
              {waiting.map((s) => (
                <TRow key={s.studentId} cols={WAIT_COLS} href={s.reportHref}>
                  <TD tone="ink" weight={500}>
                    <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                      <Avatar name={s.name} size={26} />
                      <span style={{ minWidth: 0 }}>{s.name}</span>
                    </span>
                  </TD>
                  <TD tone="soft">{s.groupName ?? "—"}</TD>
                  <TD tone="body">
                    {s.unfinished > 0 ? (
                      <span style={{ color: AMBER }}>
                        {s.unfinished} {s.unfinished === 1 ? "attempt" : "attempts"}
                      </span>
                    ) : (
                      <span style={{ color: FAINT }}>nothing started</span>
                    )}
                  </TD>
                  <TD tone="soft">
                    {s.lastActive ? (
                      dateFmt(s.lastActive)
                    ) : (
                      <span style={{ color: RED }}>never signed in to practise</span>
                    )}
                  </TD>
                  <TD align="right">
                    <OpenArrow />
                  </TD>
                </TRow>
              ))}
            </Table>
          ) : (
            <Empty>Everyone in your groups has work back. Nothing to chase.</Empty>
          )}
        </Card>

        {/* ── the evidence, folded away ────────────────────────────────────── */}
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
            Show the working — classes, band spread, and what keeps capping them
          </summary>

          <Stack>
            <Card flush>
              <CardHead
                title="Classes"
                divided
                note="completion is the share of set practice finished and marked"
              />
              <Table cols={COLS}>
                <THead
                  cols={COLS}
                  labels={
                    isCenter
                      ? ["Group", "Teacher", "Students", "Writing", "Completion", "Set"]
                      : ["Group", "Students", "Writing", "Completion", "Set"]
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
                      <BandCell figure={g.writing} unit="essays" />
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
                  <Empty action={{ href: "/console/groups", label: "Create a group →" }}>
                    No groups yet.
                  </Empty>
                ) : null}
              </Table>
            </Card>

            <Split>
              <Card>
                <CardHead
                  title={`${headline} bands awarded`}
                  note={`${measured.find((m) => m.skill === headline)?.attempts ?? 0} marked ${report.window.label.toLowerCase()} · skills are never mixed`}
                />
                {buckets.length > 0 ? (
                  <Columns
                    bars={buckets.map((b) => ({
                      label: b.label,
                      cap: b.value,
                      pct: (b.value / topBucket) * 100,
                      fill: INDIGO,
                    }))}
                    height={150}
                  />
                ) : (
                  <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
                    Nothing marked in this window yet.
                  </p>
                )}
              </Card>

              <Card>
                <CardHead title="Average by skill" />
                <CardNote>
                  Rests only on what has actually been marked — never averaged into one overall
                  band.
                </CardNote>
                {measured.map((s) => (
                  <MeterRow
                    key={s.skill}
                    label={<span style={{ textTransform: "capitalize" }}>{s.skill}</span>}
                    pct={((s.band ?? 0) / 9) * 100}
                    value={s.band?.toFixed(1) ?? "—"}
                    fill={
                      s.provisional
                        ? "#C9C7C1"
                        : (s.band ?? 0) >= 6.5
                          ? GREEN
                          : (s.band ?? 0) >= 5.5
                            ? AMBER
                            : RED
                    }
                    trail={
                      <span
                        style={{
                          color: FAINT,
                          width: 74,
                          display: "inline-block",
                          textAlign: "right",
                        }}
                      >
                        {s.attempts} {SKILL_UNIT[s.skill]}
                        {s.provisional ? " · provisional" : ""}
                      </span>
                    }
                  />
                ))}
                {measured.length === 0 ? (
                  <Empty action={{ href: "/console/groups", label: "Set the first practice →" }}>
                    Nothing marked yet.
                  </Empty>
                ) : null}
              </Card>
            </Split>

            <Split ratio="1fr 1fr">
              <Card>
                <CardHead title="What caps their writing" />
                <CardNote>
                  The lowest criterion on each marked essay — the one thing holding the band down.
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
                    No marked essays yet.
                  </p>
                ) : null}
              </Card>

              <Card>
                <CardHead title="Reading questions most often wrong" />
                <CardNote>
                  Total wrong answers by question type, across the classes in scope.
                </CardNote>
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
                    No marked reading tests yet.
                  </p>
                ) : null}
              </Card>
            </Split>
          </Stack>
        </details>
      </Stack>
    </div>
  );
}
