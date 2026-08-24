/**
 * The blank payroll spreadsheet.
 *
 * Asked about salaries, the console assistant offered the payroll report and
 * the file came back empty. It was not the export: a payroll report is built
 * from a RUN, and a run only exists once the owner has pressed Run for that
 * month. With no run, every block in `reportToSheets` was skipped, the sheet
 * list came out empty, and `buildWorkbook`'s fallback named the one sheet it
 * invented "Empty" — a file that says nothing about why it says nothing.
 *
 * So: no report may ever be silent about being empty.
 */

import { describe, expect, it } from "vitest";

import { type ReportData, reportToPdf, reportToSheets } from "./reports";

const base: ReportData = {
  kind: "payroll",
  organization: "Ideal Education",
  currency: "UZS",
  period: { from: "2026-08-01", to: "2026-08-31", label: "August 2026" },
  generatedBy: "Owner",
  generatedOn: "2026-08-23",
  rows: [],
  incomeByCategory: [],
  expenseByCategory: [],
  debtors: [],
  payroll: null,
  branchLabel: null,
  branchTotals: [],
  totalInMinor: 0,
  totalOutMinor: 0,
  openingNote: null,
};

describe("a month that has not been calculated", () => {
  it("still produces a sheet, and one that explains itself", () => {
    const sheets = reportToSheets(base);
    expect(sheets).toHaveLength(1);
    expect(sheets[0]!.name).toBe("Payroll");
    // The fix is the WORDS, not the sheet: a named-but-blank sheet is the same
    // dead end wearing a better label.
    const sheet = sheets[0]!;
    const text = `${(sheet.notes ?? []).join(" ")} ${sheet.rows.flat().join(" ")}`;
    expect(text).toMatch(/not been calculated/i);
    expect(text).toMatch(/payroll/i);
    expect(text).toMatch(/run/i);
  });

  it("says the same thing in the PDF", () => {
    const pdf = reportToPdf(base);
    const payroll = pdf.tables.find((t) => /payroll/i.test(t.title ?? ""));
    expect(payroll, "the PDF had no payroll section at all").toBeDefined();
    expect(`${payroll!.note ?? ""} ${payroll!.rows.flat().join(" ")}`).toMatch(
      /not been calculated/i,
    );
  });

  it("never falls through to the workbook builder's nameless fallback", () => {
    // `buildWorkbook` invents a sheet called "Empty" when handed none. Reaching
    // that is the bug; every report kind has to stand on its own.
    for (const kind of ["summary", "ledger", "expenses", "payroll", "debtors"] as const) {
      const sheets = reportToSheets({ ...base, kind });
      expect(sheets.length, `${kind} produced no sheets at all`).toBeGreaterThan(0);
      for (const sheet of sheets) {
        expect(sheet.name).not.toBe("Empty");
      }
    }
  });

  it("a quiet ledger month says it is quiet rather than looking broken", () => {
    const sheets = reportToSheets({ ...base, kind: "debtors" });
    const text = sheets.flatMap((s) => [...(s.notes ?? []), ...s.rows.flat()]).join(" ");
    expect(text).toMatch(/no entries|nothing matched/i);
  });
});

describe("a month that has been calculated", () => {
  const withRun: ReportData = {
    ...base,
    payroll: {
      id: "run-1",
      periodMonth: "2026-08-01",
      status: "draft",
      grossMinor: 500_000_000,
      netMinor: 500_000_000,
      computedAt: "2026-08-23T00:00:00Z",
      approvedAt: null,
      paidAt: null,
      note: null,
      items: [
        {
          id: "item-1",
          teacherId: "t1",
          teacherName: "Dilnoza Rashidova",
          grossMinor: 500_000_000,
          adjustmentMinor: 0,
          adjustmentNote: null,
          netMinor: 500_000_000,
          paidMinor: 0,
          breakdown: [],
          ruleName: "Per-lesson",
        },
      ],
    },
  };

  it("reports the teachers, and drops the explanation", () => {
    const sheets = reportToSheets(withRun);
    const payroll = sheets.find((s) => s.name === "Payroll");
    expect(payroll!.rows[0]![0]).toBe("Dilnoza Rashidova");
    expect((payroll!.notes ?? []).join(" ")).not.toMatch(/not been calculated/i);
  });
});
