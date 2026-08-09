import type { StudentReport, WeaknessRow } from "@/lib/console/student-report";

import {
  AMBER,
  Avatar,
  Card,
  CardHead,
  CardNote,
  Empty,
  FAINT,
  GREEN,
  INDIGO,
  INK,
  KindBadge,
  MeterRow,
  PageHead,
  RED,
  SANS,
  SOFT,
  Split,
  Stack,
  Table,
  Tag,
  TD,
  TextLink,
  THead,
  TRow,
  type Tone,
} from "./crm-ui";

const SKILL_LABEL = {
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
} as const;

const SKILL_BADGE: Record<string, { text: string; tone: Tone }> = {
  writing: { text: "WR", tone: "indigo" },
  reading: { text: "RD", tone: "green" },
  speaking: { text: "SP", tone: "amber" },
  listening: { text: "LS", tone: "neutral" },
};

const COLS = "1.1fr 1.6fr 1fr .7fr .8fr";

/**
 * One student's whole picture, on the CRM design's profile layout: band by
 * skill and recent graded work on the left, what keeps capping them and the
 * facts at a glance on the right, then the full practice history.
 *
 * Presentation only — the caller does the authorization and decides where
 * "back" goes, because the same report hangs off a group
 * (…/groups/[id]/students/[id]) and off the center roster
 * (/console/students/[id]), including for a student in no group at all.
 *
 * The design puts a tuition panel in the right column. There is no ledger in
 * this product, so that space carries the two weakness breakdowns — which is
 * what a teacher opening this page is actually here to read.
 */
export function StudentReportView({
  report,
  back,
}: {
  report: StudentReport;
  back: { href: string; label: string };
}) {
  const measured = report.bands.filter((b) => b.current != null);
  const weakest = measured.length
    ? measured.reduce((lo, b) => ((b.current ?? 9) < (lo.current ?? 9) ? b : lo))
    : null;
  const homeworkPct =
    report.homework.assigned > 0
      ? Math.round((report.homework.done / report.homework.assigned) * 100)
      : null;

  const glance: { k: string; v: string }[] = [
    { k: "Practices in 30 days", v: String(report.recentCount) },
    {
      k: "Last active",
      v: report.lastActive ? new Date(report.lastActive).toLocaleDateString("en-GB") : "never",
    },
    {
      k: "Homework done",
      v:
        report.homework.assigned > 0
          ? `${report.homework.done} of ${report.homework.assigned}`
          : "none set",
    },
    { k: "Skills measured", v: `${measured.length} of 4` },
    {
      k: "Weakest skill",
      v: weakest ? `${SKILL_LABEL[weakest.skill]} ${weakest.current?.toFixed(1)}` : "not measured",
    },
  ];

  return (
    <div>
      <PageHead
        back={back}
        eyebrow="Student"
        title={report.name}
        media={<Avatar name={report.name} url={report.photoUrl} size={58} />}
        subtitle={
          <>
            {report.recentCount} practice{report.recentCount === 1 ? "" : "s"} in the last 30 days
            {report.lastActive
              ? ` · last active ${new Date(report.lastActive).toLocaleDateString()}`
              : " · has never practised"}
          </>
        }
      />

      <Split ratio="1.2fr .8fr">
        <Stack>
          {/* ── band by skill ─────────────────────────────────────────────── */}
          <Card>
            <CardHead title="Band by skill" note="latest measured estimate" />
            {report.bands.map((b) => {
              const behind = b.current != null && b.target != null ? b.current - b.target : null;
              return (
                <MeterRow
                  key={b.skill}
                  label={SKILL_LABEL[b.skill]}
                  // Bands run 0–9, so the bar is the band as a share of 9.
                  pct={((b.current ?? 0) / 9) * 100}
                  value={b.current != null ? b.current.toFixed(1) : "—"}
                  fill={
                    b.current == null
                      ? "#E4E2DC"
                      : behind == null || behind >= 0
                        ? GREEN
                        : behind >= -1
                          ? AMBER
                          : RED
                  }
                  trail={
                    <span
                      style={{
                        width: 74,
                        display: "inline-block",
                        textAlign: "right",
                        color: behind == null ? FAINT : behind >= 0 ? GREEN : RED,
                        fontWeight: 600,
                      }}
                    >
                      {b.current == null
                        ? "not measured"
                        : b.target == null
                          ? ""
                          : behind != null && behind >= 0
                            ? "at target"
                            : `${behind?.toFixed(1)} to go`}
                    </span>
                  }
                />
              );
            })}
            <div
              style={{
                fontFamily: SANS,
                fontSize: 11.5,
                color: FAINT,
                marginTop: 12,
                borderTop: "1px solid #F0EEE9",
                paddingTop: 10,
                lineHeight: 1.55,
              }}
            >
              Each skill stands on its own. No overall band is averaged across them — a number built
              from whichever skills they happened to practise would be ours, not IELTS&apos;s.
            </div>
          </Card>

          {/* ── practice history ──────────────────────────────────────────── */}
          <Card flush>
            <CardHead
              title="Practice history"
              divided
              note={
                report.homework.assigned > 0
                  ? `${report.homework.done} of ${report.homework.assigned} homework ${report.homework.assigned === 1 ? "task" : "tasks"} done`
                  : "no homework set"
              }
            />
            <Table cols={COLS} minWidth={620}>
              <THead cols={COLS} labels={["Date", "Practice", "Score", "Band", ""]} />
              {report.practices.map((p) => {
                const badge = SKILL_BADGE[p.skill];
                return (
                  <TRow key={`${p.skill}-${p.id}`} cols={COLS}>
                    <TD tone="soft">
                      {new Date(p.when).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TD>
                    <TD>
                      <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                        <KindBadge tone={badge.tone}>{badge.text}</KindBadge>
                        <span style={{ color: INK, minWidth: 0 }}>{SKILL_LABEL[p.skill]}</span>
                        {p.assigned ? <Tag tone="indigo">Homework</Tag> : null}
                      </span>
                    </TD>
                    <TD tone="soft">{p.score ?? "—"}</TD>
                    <TD tone="ink" weight={600}>
                      {p.band != null ? p.band.toFixed(1) : "—"}
                    </TD>
                    <TD align="right">
                      {p.reportHref ? (
                        <TextLink href={p.reportHref}>Report →</TextLink>
                      ) : (
                        <span style={{ fontSize: 12, color: FAINT }}>Not graded</span>
                      )}
                    </TD>
                  </TRow>
                );
              })}
              {report.practices.length === 0 ? (
                <Empty>This student hasn&apos;t practised yet.</Empty>
              ) : null}
            </Table>
          </Card>
        </Stack>

        <Stack>
          {/* ── homework ──────────────────────────────────────────────────── */}
          <Card>
            <CardHead title="Homework" />
            {homeworkPct == null ? (
              <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
                Nothing has been assigned to this student&apos;s class yet.
              </p>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 26,
                      fontWeight: 600,
                      color: INK,
                      letterSpacing: "-.02em",
                    }}
                  >
                    {homeworkPct}%
                  </span>
                  <span style={{ fontFamily: SANS, fontSize: 12.5, color: SOFT }}>
                    {report.homework.done} of {report.homework.assigned} finished
                  </span>
                </div>
                <MeterRow
                  label=""
                  labelWidth={0}
                  pct={homeworkPct}
                  fill={homeworkPct >= 60 ? GREEN : homeworkPct >= 30 ? AMBER : RED}
                />
              </>
            )}
          </Card>

          <WeaknessCard
            title="Writing — what caps their band"
            note="The lowest criterion, counted across their graded essays."
            rows={report.writingWeaknesses}
            unit="essay"
            fill={INDIGO}
          />

          <WeaknessCard
            title="Reading — most-missed types"
            note="Total wrong answers by question type."
            rows={report.readingWeaknesses}
            unit="wrong"
            fill={AMBER}
          />

          {/* ── at a glance ───────────────────────────────────────────────── */}
          <Card>
            <CardHead title="At a glance" />
            {glance.map((g) => (
              <div
                key={g.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "9px 0",
                  borderBottom: "1px solid #F5F4F0",
                  fontFamily: SANS,
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: SOFT }}>{g.k}</span>
                <span style={{ fontWeight: 500, color: INK, textAlign: "right" }}>{g.v}</span>
              </div>
            ))}
          </Card>
        </Stack>
      </Split>
    </div>
  );
}

function WeaknessCard({
  title,
  note,
  rows,
  unit,
  fill,
}: {
  title: string;
  note: string;
  rows: WeaknessRow[];
  unit: string;
  fill: string;
}) {
  const top = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card>
      <CardHead title={title} />
      <CardNote>{note}</CardNote>
      {rows.map((r) => (
        <MeterRow
          key={r.label}
          label={<span style={{ textTransform: "capitalize" }}>{r.label}</span>}
          labelWidth={118}
          pct={(r.count / top) * 100}
          fill={fill}
          trail={
            <span style={{ color: FAINT, width: 62, display: "inline-block", textAlign: "right" }}>
              {r.count} {unit}
              {r.count === 1 ? "" : "s"}
            </span>
          }
        />
      ))}
      {rows.length === 0 ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>Nothing graded yet.</p>
      ) : null}
    </Card>
  );
}
