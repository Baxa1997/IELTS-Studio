/**
 * The report a centre hands to a parent.
 *
 * NOT the teacher's screen printed. A teacher reads a diagnostic; a parent
 * reads a claim, usually with an invoice nearby, and often the only IELTS
 * number they have ever seen. Three things follow from that, and they are the
 * whole design of this file.
 *
 * 1. NO SINGLE OVERALL BAND. R2 says never average across skills, and a parent
 *    report is exactly where someone would want one number. It would also be
 *    the most misleading number the product could print: a student on Writing
 *    4.9 and Speaking 2.8 does not have "a 3.9", and the average moves when a
 *    skill is merely *measured* for the first time. Four skills, four rows.
 *
 * 2. EVERY FIGURE CARRIES ITS SAMPLE SIZE (R3). "Writing 6.0" from one essay
 *    and from fourteen are different statements. Under three, the report says
 *    `provisional` in the row itself rather than in a footnote, because
 *    footnotes are not read and this one changes the meaning.
 *
 * 3. PROGRESS NAMES ITS STARTING POINT. "+1.0 since placement" is a claim the
 *    centre can defend. "+1.0 since their first attempt" is a comparison
 *    against whatever the student happened to open first. Both appear; they are
 *    not worded the same, because they are not worth the same.
 *
 * What is deliberately absent: AI-vs-final band mechanics, override history,
 * grader provenance. That is internal marking process — a parent needs the
 * band the centre stands behind, and the audit trail lives in the console.
 */

/*
 * Not `server-only`, deliberately. Everything here is a pure transform from a
 * loaded report into a document — no database, no headers, no secrets — and the
 * rules above are exactly the ones that need a test. The last time a rule like
 * this hid behind `server-only` it shipped a false claim to every teacher, so
 * the type import from `student-report.ts` is `import type` (erased at compile
 * time) and this module stays reachable from vitest.
 */

import { buildPdf, type PdfDocument, type PdfStat, type PdfTable } from "@/lib/finance/pdf";
import { progressSince } from "@/lib/console/progress";
import type { PracticeSkill, StudentReport } from "@/lib/console/student-report";

const SKILL_LABEL: Record<PracticeSkill, string> = {
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
};

/** Below this, a band is one or two pieces of work and says so. */
const PROVISIONAL_UNDER = 3;

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export interface ParentReportOptions {
  organizationName: string;
  /** Rendered into the footer so a parent knows who to ask. */
  contact?: string | null;
  now?: Date;
}

export function parentReportDocument(
  report: StudentReport,
  { organizationName, contact, now = new Date() }: ParentReportOptions,
): PdfDocument {
  const measured = report.bands.filter((b) => b.current != null);

  return {
    organization: organizationName,
    title: report.name,
    subtitle: subtitleFor(report),
    meta: [
      `Progress report`,
      date(now.toISOString()),
      report.groups.length > 0 ? report.groups.join(", ") : "No group",
    ],
    stats: statsFor(report, measured.length),
    tables: [bandTable(report), ...weaknessTables(report), practiceTable(report)],
    footer: footerFor(organizationName, contact),
  };
}

/**
 * The one sentence at the top. It has to be true when the student has done
 * nothing, which is the case a template would get wrong and the case a parent
 * most deserves to be told about plainly.
 */
function subtitleFor(report: StudentReport): string {
  if (report.practices.length === 0) {
    return "No practice recorded yet. Bands appear here once work has been marked.";
  }
  const first = report.practices[report.practices.length - 1];
  const last = report.practices[0];
  const span =
    first.when.slice(0, 10) === last.when.slice(0, 10)
      ? date(last.when)
      : `${date(first.when)} - ${date(last.when)}`;
  const n = report.practices.length;
  return `${n} piece${n === 1 ? "" : "s"} of work marked, ${span}`;
}

function statsFor(report: StudentReport, measuredCount: number): PdfStat[] {
  const stats: PdfStat[] = [
    { label: "Skills measured", value: `${measuredCount} of 4` },
    {
      label: "Practice, last 30 days",
      value: String(report.recentCount),
      // A month with nothing in it is the single most useful thing this report
      // can tell a parent, so it is the one figure allowed to shout.
      tone: report.recentCount === 0 ? "bad" : report.recentCount >= 8 ? "good" : "flat",
    },
    {
      label: "Homework done",
      value:
        report.homework.assigned > 0
          ? `${report.homework.done} of ${report.homework.assigned}`
          : "None set",
      tone:
        report.homework.assigned === 0
          ? "flat"
          : report.homework.done >= report.homework.assigned
            ? "good"
            : report.homework.done === 0
              ? "bad"
              : "flat",
    },
  ];

  if (report.attendance) {
    stats.push({
      label: "Attendance",
      value: `${report.attendance.ratePct}%`,
      tone:
        report.attendance.ratePct >= 85 ? "good" : report.attendance.ratePct < 60 ? "bad" : "flat",
    });
  }

  return stats;
}

/**
 * Four rows, one per skill, each carrying what it is worth.
 *
 * A skill with no marked work says "Not measured yet" rather than being
 * omitted — a parent seeing three skills would assume the fourth was fine.
 */
function bandTable(report: StudentReport): PdfTable {
  const rows = report.bands.map((b) => {
    const label = SKILL_LABEL[b.skill];
    if (b.current == null) {
      // "Not measured" rather than "Not measured yet": the column is narrow and
      // an ellipsized "Not me..." is worse than the shorter true sentence. The
      // note under the table carries the "yet".
      return [label, "Not measured", "-", "-", targetOf(b), "-"];
    }

    const moved = progressSince(b.current, b.baseline, b.baselineSource, b.sampleCount);
    const evidence =
      b.sampleCount < PROVISIONAL_UNDER
        ? `${b.sampleCount} - provisional`
        : `${b.sampleCount} marked`;

    return [
      label,
      b.current.toFixed(1),
      b.baseline != null ? b.baseline.toFixed(1) : "-",
      moved.label ?? "-",
      targetOf(b),
      evidence,
    ];
  });

  return {
    title: "Band by skill",
    note: notesOnBands(report),
    // Widths sized to the LONGEST string each column can hold, not to the
    // typical one: "Not measured" and "+1.0 since their first attempt" are the
    // strings that decide this, and both were being cut before.
    columns: [
      { header: "Skill", width: 0.9 },
      { header: "Now", width: 0.95 },
      { header: "Started at", width: 0.75 },
      { header: "Change", width: 1.85 },
      { header: "Target", width: 0.6 },
      { header: "Based on", width: 0.95 },
    ],
    rows,
  };
}

/**
 * A target only prints when somebody chose it.
 *
 * `skill_estimates.target_band` defaults to 7.0 for every student in every
 * skill, so the first render of this report showed a student with no measured
 * Reading, Listening or Speaking at all as "Target 7.0" three times over. On a
 * teacher's screen that is a harmless default. On a document going home it is
 * the centre appearing to promise a band nobody discussed — in every skill,
 * including ones the student has never attempted.
 */
const targetOf = (band: { target: number | null; targetAgreed: boolean }) =>
  band.targetAgreed && band.target != null ? band.target.toFixed(1) : "-";

/**
 * The note under the band table carries the two caveats that would otherwise
 * be silently assumed away.
 */
function notesOnBands(report: StudentReport): string {
  const parts: string[] = [
    "Each skill is reported separately - IELTS bands are not averaged across skills here.",
  ];

  const anyProvisional = report.bands.some(
    (b) => b.current != null && b.sampleCount < PROVISIONAL_UNDER,
  );
  if (anyProvisional) {
    parts.push("A provisional band rests on one or two pieces of work and will move.");
  }

  const anyFirstAttempt = report.bands.some(
    (b) => b.current != null && b.baseline != null && b.baselineSource === "first_attempt",
  );
  if (anyFirstAttempt) {
    parts.push(
      'Where the change reads "since their first attempt", the starting point was ordinary practice, not a placement test.',
    );
  }

  return parts.join(" ");
}

/**
 * What keeps coming up. Only printed when there is something to print — an
 * empty "Recurring weaknesses" heading reads as a withheld verdict.
 */
function weaknessTables(report: StudentReport): PdfTable[] {
  const tables: PdfTable[] = [];

  if (report.writingWeaknesses.length > 0) {
    tables.push({
      title: "What is holding the writing back",
      note: "The criterion that capped the band, counted across every marked essay.",
      columns: [
        { header: "Criterion", width: 3 },
        { header: "Essays", width: 1, align: "right" },
      ],
      rows: report.writingWeaknesses.map((w) => [w.label, String(w.count)]),
    });
  }

  if (report.readingWeaknesses.length > 0) {
    tables.push({
      title: "Reading question types to work on",
      note: "Marks lost by question type, across every reading test taken.",
      columns: [
        { header: "Question type", width: 3 },
        { header: "Marks lost", width: 1, align: "right" },
      ],
      rows: report.readingWeaknesses.map((w) => [w.label, String(w.count)]),
    });
  }

  return tables;
}

/**
 * The evidence behind everything above.
 *
 * Homework and self-directed practice are labelled rather than merged, because
 * the difference is the single most useful thing on the page: a student doing
 * work nobody set is a student who will improve, and a parent can act on that
 * where they cannot act on a band.
 */
function practiceTable(report: StudentReport): PdfTable {
  const rows = report.practices
    .slice(0, 30)
    .map((p) => [
      date(p.when),
      SKILL_LABEL[p.skill],
      p.assigned ? "Homework" : "Own practice",
      p.title ?? "-",
      p.band != null ? p.band.toFixed(1) : (p.score ?? "Not marked"),
    ]);

  return {
    title: "Work marked",
    note:
      report.practices.length > 30
        ? `The 30 most recent of ${report.practices.length}.`
        : undefined,
    columns: [
      { header: "Date", width: 1 },
      { header: "Skill", width: 0.9 },
      { header: "Set by", width: 1 },
      { header: "Task", width: 2.4 },
      { header: "Result", width: 0.8, align: "right" },
    ],
    rows,
  };
}

/**
 * The disclaimer is not optional and not a lawyer's decoration: a band on
 * centre letterhead is exactly the thing a reader would mistake for an official
 * result, so the footer says what it is in the same breath as who produced it.
 */
function footerFor(organizationName: string, contact?: string | null): string {
  const who = contact ? `${organizationName} - ${contact}` : organizationName;
  return `${who}. Bands are this centre's assessment of practice work, not an official IELTS result. Not affiliated with or endorsed by IELTS.`;
}

/** `progress-aziza-karimova-2026-08-16.pdf` */
export function parentReportFilename(report: StudentReport, now = new Date()): string {
  const slug =
    report.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "student";
  return `progress-${slug}-${now.toISOString().slice(0, 10)}.pdf`;
}

export function buildParentReport(
  report: StudentReport,
  options: ParentReportOptions,
): Buffer {
  return buildPdf(parentReportDocument(report, options));
}
