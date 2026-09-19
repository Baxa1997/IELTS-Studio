import { progressSince } from "@/lib/console/progress";
import type {
  PracticeRow as ReportPracticeRow,
  StudentReport,
  WeaknessRow,
} from "@/lib/console/student-report";

import { PracticeGallery, type GalleryItem } from "@/components/practice/gallery";

import {
  AMBER,
  Avatar,
  Card,
  CardHead,
  CardNote,
  FAINT,
  GREEN,
  INDIGO,
  INK,
  MeterRow,
  PageHead,
  RED,
  SANS,
  SOFT,
  Split,
  Stack,
  Tag,
} from "./crm-ui";
import { PANEL } from "@/lib/theme/tokens";

const SKILL_LABEL = {
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
} as const;

/** The chip row for both practice grids. Skills in the order the product
 *  teaches them; the gallery drops any that this student has never done. */
const PRACTICE_CATEGORIES = ["Writing", "Reading", "Listening", "Speaking", "Lesson"];

/** A report row → the shared gallery's flat shape. */
function toGalleryItem(p: ReportPracticeRow): GalleryItem {
  const label = SKILL_LABEL[p.skill] ?? "Practice";
  return {
    id: `${p.skill}-${p.id}`,
    // Null while a piece of work has no report — the card still renders,
    // because "they did this and it was not marked" is a fact the teacher
    // needs, but it must not pretend to be a door.
    href: p.reportHref,
    title: p.title ?? label,
    byline: longDate(p.when),
    tone: (["writing", "reading", "listening", "speaking"].includes(p.skill)
      ? p.skill
      : "lesson") as GalleryItem["tone"],
    category: label,
    // A listening quick practice may only have a raw score, never a band.
    headline: p.band != null ? p.band.toFixed(1) : (p.score ?? "—"),
    headnote: p.band != null ? "overall band" : p.score ? "score" : "not graded",
    badge: p.reportHref ? undefined : "Not graded",
    // The one thing that held THIS piece back. On the card rather than only in
    // the roll-up because "Band 6.0" alone tells a teacher nothing they can
    // teach from, and making them open every report to find out is how a report
    // page goes unread.
    stats: p.weakness ? [p.weakness] : [],
    date: p.when,
    value: p.band,
  };
}

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

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

  // Split rather than tag inside one table. "Did they do what I set?" and "are
  // they practising on their own?" are different questions, and a Homework tag
  // buried in a mixed list makes the first one a counting exercise.
  const homework = report.practices.filter((p) => p.assigned);
  const ownPractice = report.practices.filter((p) => !p.assigned);

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
        actions={<ExportPdfLink studentId={report.studentId} />}
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
            <CardHead
              title="Band by skill"
              note="where they are now, and how far that is from where they started"
            />
            {report.bands.map((b) => {
              // Only a target somebody chose counts. `target_band` defaults to
              // 7.0 for everyone, so measuring "behind" against an unagreed
              // default tells a teacher a student is 4.1 short of a goal that
              // was never set.
              const target = b.targetAgreed ? b.target : null;
              const behind = b.current != null && target != null ? b.current - target : null;
              const moved = progressSince(b.current, b.baseline, b.baselineSource, b.sampleCount);
              return (
                <MeterRow
                  key={b.skill}
                  label={SKILL_LABEL[b.skill]}
                  // Bands run 0–9, so the bar is the band as a share of 9.
                  pct={((b.current ?? 0) / 9) * 100}
                  value={
                    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                      {b.current != null ? b.current.toFixed(1) : "—"}
                      {/* §6's "baseline vs now". Shown only where it means
                          something: an indicative baseline is greyed, so a
                          parent reading the page can tell a diagnostic from a
                          number we happened to have. */}
                      {moved.label ? (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 500,
                            color:
                              moved.confidence === "measured"
                                ? (moved.moved ?? 0) >= 0
                                  ? GREEN
                                  : RED
                                : FAINT,
                          }}
                        >
                          {moved.label}
                        </span>
                      ) : null}
                    </span>
                  }
                  fill={
                    b.current == null
                      ? "#C5C4BE"
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
                        : target == null
                          ? "no target set"
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
                borderTop: "1px solid #D4D3CE",
                paddingTop: 10,
                lineHeight: 1.55,
              }}
            >
              Each skill stands on its own. No overall band is averaged across them — a number built
              from whichever skills they happened to practise would be ours, not IELTS&apos;s.
            </div>
          </Card>

          {/* ── homework: what you set, and how it went ───────────────────── */}
          <Card flush id="homework">
            <CardHead
              title="Homework"
              divided
              badge={
                homeworkPct != null ? (
                  <Tag tone={homeworkPct >= 60 ? "green" : "amber"}>{homeworkPct}%</Tag>
                ) : null
              }
              note={
                report.homework.assigned > 0
                  ? `${report.homework.done} of ${report.homework.assigned} done — newest first`
                  : "nothing set to this student's group yet"
              }
            />
            <div style={{ padding: "16px 18px 18px" }}>
              {/* The same grid the learner's Activities and the teacher's
                  library use, so one piece of practice looks the same wherever
                  it is seen. Two columns, not four: this sits in the report's
                  narrow left column and the stylesheet cannot see that. */}
              <PracticeGallery
                items={homework.map(toGalleryItem)}
                categories={PRACTICE_CATEGORIES}
                columns={2}
                emptyTitle={
                  report.homework.assigned > 0
                    ? "Nothing handed in yet"
                    : "No homework set to this student's group"
                }
                emptyNote={
                  report.homework.assigned > 0
                    ? "It has been set, but nothing has come back."
                    : "Set some from the group page."
                }
              />
            </div>
          </Card>

          {/* ── their own practice ────────────────────────────────────────── */}
          <Card flush>
            <CardHead
              title="Their own practice"
              divided
              note="anything they did that nobody set them"
            />
            <div style={{ padding: "16px 18px 18px" }}>
              <PracticeGallery
                items={ownPractice.map(toGalleryItem)}
                categories={PRACTICE_CATEGORIES}
                columns={2}
                emptyTitle="Nothing beyond what was set"
                emptyNote="They have not practised anything on their own yet."
              />
            </div>
          </Card>
        </Stack>

        <Stack>
          {/* ── homework ──────────────────────────────────────────────────── */}
          {/* The homework completion meter used to live here. It said the same
              thing as the badge on the Homework table and the "Homework done"
              line below — three copies of one number, in a column meant for
              things the table cannot show. */}
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
                  borderBottom: "1px solid #DEDEDA",
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
        <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
          Nothing graded yet.
        </p>
      ) : null}
    </Card>
  );
}

/**
 * Download the parent-facing PDF (§6).
 *
 * A plain anchor, not a Link and not a client component: the route replies with
 * a file, so there is nothing for the router to navigate to and nothing to hold
 * in state. `download` keeps the browser from opening it in a tab and losing
 * the filename the route chose.
 */
function ExportPdfLink({ studentId }: { studentId: string }) {
  return (
    <a
      href={`/api/console/students/${studentId}/report`}
      download
      className="cn-btn cn-btn--ghost"
      style={{
        display: "inline-block",
        borderRadius: 10,
        padding: "8px 15px",
        fontFamily: SANS,
        fontSize: 13.5,
        fontWeight: 500,
        textDecoration: "none",
        background: PANEL,
        color: INK,
        border: "1px solid #C5C4BE",
      }}
    >
      Export report (PDF)
    </a>
  );
}
