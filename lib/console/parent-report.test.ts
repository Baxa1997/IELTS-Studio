import { describe, expect, it } from "vitest";

import { textWidth, wrapText } from "@/lib/finance/pdf";

import { parentReportDocument, parentReportFilename } from "./parent-report";
import type { PracticeRow, StudentReport } from "./student-report";

/**
 * A parent report is the most consequential document this product emits: it
 * leaves the building, it has the centre's name at the top, and the reader
 * usually has no other IELTS reference point. Every test here is about a claim
 * it must NOT make.
 */

const practice = (over: Partial<PracticeRow> = {}): PracticeRow => ({
  id: "p1",
  skill: "writing",
  when: "2026-08-01T10:00:00Z",
  title: null,
  band: 6,
  score: null,
  weakness: null,
  assigned: false,
  reportHref: null,
  ...over,
});

const report = (over: Partial<StudentReport> = {}): StudentReport => ({
  studentId: "s1",
  name: "Aziza Karimova",
  photoUrl: null,
  bands: [
    {
      skill: "writing",
      current: 6,
      target: 7,
      baseline: 5,
      baselineSource: "placement",
      sampleCount: 6,
      targetAgreed: true,
    },
    {
      skill: "reading",
      current: 5.5,
      target: 7,
      baseline: 5,
      baselineSource: "first_attempt",
      sampleCount: 4,
      targetAgreed: true,
    },
    {
      skill: "listening",
      current: null,
      target: 7,
      baseline: null,
      baselineSource: "first_attempt",
      sampleCount: 0,
      targetAgreed: false,
    },
    {
      skill: "speaking",
      current: null,
      target: 7,
      baseline: null,
      baselineSource: "first_attempt",
      sampleCount: 0,
      targetAgreed: false,
    },
  ],
  practices: [practice()],
  recentCount: 1,
  lastActive: "2026-08-01T10:00:00Z",
  writingWeaknesses: [],
  readingWeaknesses: [],
  homework: { assigned: 2, done: 1 },
  attendance: { sessions: 10, attended: 9, ratePct: 90 },
  groups: ["IELTS Evening"],
  ...over,
});

const opts = { organizationName: "Bright Academy", now: new Date("2026-08-16T09:00:00Z") };
const cellsOf = (doc: ReturnType<typeof parentReportDocument>) =>
  doc.tables.flatMap((t) => t.rows.flat()).join(" | ");

describe("parentReportDocument", () => {
  it("never prints one overall band", () => {
    // R2. This is the number a parent would most like and the one that would
    // mislead them most: a student on Writing 6.0 and Reading 5.5 with two
    // skills unmeasured does not have "a 5.75", and the figure would MOVE when
    // a new skill is merely measured for the first time.
    const doc = parentReportDocument(report(), opts);
    const text = [doc.title, doc.subtitle ?? "", ...(doc.stats ?? []).map((s) => s.label)].join(" ");
    expect(text.toLowerCase()).not.toContain("overall");
    expect((doc.stats ?? []).map((s) => s.label)).not.toContain("Average band");
  });

  it("lists a skill with no work as not measured rather than omitting it", () => {
    // Three skills on the page and a parent assumes the fourth was fine.
    const doc = parentReportDocument(report(), opts);
    const bands = doc.tables[0];
    expect(bands.rows).toHaveLength(4);
    expect(bands.rows.map((r) => r[0])).toEqual(["Writing", "Reading", "Listening", "Speaking"]);
    expect(bands.rows[2][1]).toBe("Not measured");
  });

  it("fits every cell it can produce inside its column", () => {
    // The PDF writer ellipsizes silently, so a column narrower than its own
    // longest possible string cuts text with no error anywhere. This caught
    // "Not me..." and "1 marked - provisio..." in the first render.
    const doc = parentReportDocument(report(), opts);
    const bands = doc.tables[0];
    const scale = bands.columns.reduce((a, c) => a + c.width, 0);
    const contentWidth = 595.28 - 42 * 2;

    bands.rows.forEach((row) => {
      row.forEach((cell, i) => {
        const available = (bands.columns[i].width / scale) * contentWidth - 16;
        expect(
          textWidth(cell, 9),
          `"${cell}" overflows the ${bands.columns[i].header} column`,
        ).toBeLessThanOrEqual(available);
      });
    });
  });

  it("marks a band built on one or two pieces of work as provisional", () => {
    // R3, in the row rather than a footnote — a footnote that changes the
    // meaning of the number above it is not read in time to matter.
    const doc = parentReportDocument(
      report({
        bands: [
          {
            skill: "writing",
            current: 7,
            target: 7,
            baseline: 7,
            baselineSource: "placement",
            sampleCount: 1,
            targetAgreed: true,
          },
        ],
      }),
      opts,
    );
    expect(doc.tables[0].rows[0][5]).toBe("1 - provisional");
    expect(doc.tables[0].note).toContain("provisional band rests on one or two");
  });

  it("prints a target only where somebody actually agreed one", () => {
    // `target_band` defaults to 7.0 for every student in every skill. The first
    // real render showed a student with no measured Reading, Listening or
    // Speaking as "Target 7.0" three times over — the centre appearing to
    // promise a band nobody discussed, in skills never attempted.
    const doc = parentReportDocument(report(), opts);
    const rows = doc.tables[0].rows;
    expect(rows[0][4]).toBe("7.0"); // writing — agreed
    expect(rows[2][4]).toBe("-"); // listening — the column default, not a goal
    expect(rows[3][4]).toBe("-");
  });

  it("says which starting point the progress is measured from", () => {
    const doc = parentReportDocument(report(), opts);
    const rows = doc.tables[0].rows;
    expect(rows[0][3]).toBe("+1.0 since placement");
    expect(rows[1][3]).toBe("+0.5 since their first attempt");
    // ...and warns that the second kind is not a diagnostic.
    expect(doc.tables[0].note).toContain("not a placement test");
  });

  it("drops the first-attempt caveat when every baseline is a real placement", () => {
    const bands = report().bands.map((b) => ({ ...b, baselineSource: "placement" as const }));
    const doc = parentReportDocument(report({ bands }), opts);
    expect(doc.tables[0].note).not.toContain("not a placement test");
  });

  it("carries the disclaimer on every page", () => {
    const doc = parentReportDocument(report(), opts);
    expect(doc.footer).toContain("not an official IELTS result");
    expect(doc.footer).toContain("Not affiliated with or endorsed by IELTS");
    expect(doc.footer).toContain("Bright Academy");
  });

  it("shows the disclaimer in full rather than cutting it off", () => {
    // The first render printed "...not an official IELTS..." and stopped: the
    // footer was drawn as one clipped line. A truncated disclaimer is not a
    // disclaimer, and nothing in the type system objected.
    const doc = parentReportDocument(report(), opts);
    const lines = wrapText(doc.footer!, 595.28 - 42 * 2 - 90, 7.5);
    expect(lines.join(" ")).toBe(doc.footer);
    expect(lines.some((l) => l.endsWith("..."))).toBe(false);
  });

  it("separates homework from work the student chose to do", () => {
    // The most actionable line on the page for a parent: a student practising
    // unprompted is a student who will improve.
    const doc = parentReportDocument(
      report({
        practices: [
          practice({ id: "a", assigned: true, title: "Task 2 - city living" }),
          practice({ id: "b", assigned: false }),
        ],
      }),
      opts,
    );
    expect(cellsOf(doc)).toContain("Homework");
    expect(cellsOf(doc)).toContain("Own practice");
  });

  it("says nothing has been done rather than printing an empty report", () => {
    const doc = parentReportDocument(
      report({
        practices: [],
        recentCount: 0,
        lastActive: null,
        homework: { assigned: 0, done: 0 },
        bands: report().bands.map((b) => ({
          ...b,
          current: null,
          baseline: null,
          sampleCount: 0,
        })),
      }),
      opts,
    );
    expect(doc.subtitle).toContain("No practice recorded yet");
    expect((doc.stats ?? []).find((s) => s.label === "Skills measured")?.value).toBe("0 of 4");
    expect((doc.stats ?? []).find((s) => s.label === "Homework done")?.value).toBe("None set");
  });

  it("omits attendance entirely when no register has been taken", () => {
    // Not 0%. A student nobody has marked has no attendance record, and "0%
    // attendance" on a document going home is an accusation the data does not
    // support.
    const doc = parentReportDocument(report({ attendance: null }), opts);
    expect((doc.stats ?? []).map((s) => s.label)).not.toContain("Attendance");
  });

  it("leaves out a weakness table it has nothing to put in", () => {
    // An empty "What is holding the writing back" heading reads as a withheld
    // verdict rather than an absence of evidence.
    const doc = parentReportDocument(report(), opts);
    const titles = doc.tables.map((t) => t.title);
    expect(titles).not.toContain("What is holding the writing back");

    const withWeakness = parentReportDocument(
      report({ writingWeaknesses: [{ label: "Lexical Resource", count: 3 }] }),
      opts,
    );
    expect(withWeakness.tables.map((t) => t.title)).toContain("What is holding the writing back");
  });

  it("caps the work list and says how much it left out", () => {
    const many = Array.from({ length: 42 }, (_, i) => practice({ id: `p${i}` }));
    const doc = parentReportDocument(report({ practices: many }), opts);
    const work = doc.tables.find((t) => t.title === "Work marked")!;
    expect(work.rows).toHaveLength(30);
    expect(work.note).toBe("The 30 most recent of 42.");
  });
});

describe("parentReportFilename", () => {
  it("is something a parent can find in a downloads folder", () => {
    expect(parentReportFilename(report(), new Date("2026-08-16T09:00:00Z"))).toBe(
      "progress-aziza-karimova-2026-08-16.pdf",
    );
  });

  it("still produces a filename when the name is not Latin", () => {
    // Cyrillic slugifies to nothing; a file called "progress--2026-08-16.pdf"
    // is worse than an honest fallback.
    expect(parentReportFilename(report({ name: "Азиза" }), new Date("2026-08-16T09:00:00Z"))).toBe(
      "progress-student-2026-08-16.pdf",
    );
  });
});
