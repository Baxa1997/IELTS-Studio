import { toMajor } from "./money";
import { PAYMENT_STATE_LABEL, type PayrollMonthsData } from "./payroll-grid";
import type { Sheet } from "./xlsx";

/**
 * The multi-month payroll workbook, laid out the way the center's own
 * spreadsheet already is.
 *
 * One row per teacher, one PAIR of columns per month — the amount, and the word
 * beside it. The word is the whole point of their sheet: an amount alone does
 * not say whether the teacher has the money, and the running argument in a
 * center is never about the arithmetic, it is about who has been paid.
 *
 * Two sheets, not one. The grid is for reading; "By month" is for adding up,
 * and separating them means the grid does not need a totals block wedged under
 * it that breaks every filter and sort Excel would otherwise offer.
 */
export function payrollMonthsSheets(
  data: PayrollMonthsData,
  opts: { organizationName: string; currency: string; generatedAt: string },
): Sheet[] {
  const major = (minor: number) => toMajor(minor, opts.currency);

  const provisional = data.columns.filter((c) => !c.saved);

  const notes = [
    `${opts.organizationName} — teacher pay`,
    data.columns.length > 0
      ? `${data.columns[0].label} to ${data.columns[data.columns.length - 1].label}`
      : "No months selected",
    `Amounts in ${opts.currency}. Generated ${opts.generatedAt}.`,
  ];
  if (provisional.length > 0) {
    notes.push(
      `Not yet run, so these are what the current rates come to rather than a saved payslip: ${provisional
        .map((c) => c.label)
        .join(", ")}.`,
    );
  }

  const grid: Sheet = {
    name: "Teachers",
    notes,
    columns: [
      { header: "Teacher", width: 26 },
      { header: "Students", width: 10, type: "number" },
      ...data.columns.flatMap((c) => [
        { header: c.label, width: 15, type: "money" as const },
        { header: " ", width: 12 },
      ]),
      { header: "Total", width: 16, type: "money" },
      { header: "Paid", width: 16, type: "money" },
      { header: "Outstanding", width: 16, type: "money" },
    ],
    rows: data.rows.map((row) => [
      row.teacherName,
      row.students || null,
      ...data.columns.flatMap((c) => {
        const cell = row.cells.get(c.month);
        if (!cell || cell.netMinor === 0) return [null, null];
        return [major(cell.netMinor), PAYMENT_STATE_LABEL[cell.state]];
      }),
      major(row.totalNetMinor),
      major(row.totalPaidMinor),
      major(row.totalNetMinor - row.totalPaidMinor),
    ]),
    totals: [
      "Total",
      null,
      ...data.columns.flatMap((c) => [major(c.netMinor), null]),
      major(data.totalNetMinor),
      major(data.totalPaidMinor),
      major(data.totalOutstandingMinor),
    ],
  };

  const byMonth: Sheet = {
    name: "By month",
    notes: [
      "What each month came to, and how much of it has actually left the building.",
      "Still owed = not paid at all. Part-paid = an advance was given and the rest is outstanding.",
    ],
    columns: [
      { header: "Month", width: 16 },
      { header: "Status", width: 14 },
      { header: "Teachers", width: 10, type: "number" },
      { header: "Payroll", width: 16, type: "money" },
      { header: "Paid out", width: 16, type: "money" },
      { header: "Still owed", width: 16, type: "money" },
      { header: "Part-paid, remaining", width: 20, type: "money" },
    ],
    rows: data.columns.map((c) => [
      c.label,
      c.saved ? c.status : "not run yet",
      data.rows.filter((r) => (r.cells.get(c.month)?.netMinor ?? 0) > 0).length,
      major(c.netMinor),
      major(c.paidMinor),
      major(c.unpaidMinor),
      major(c.advanceOutstandingMinor),
    ]),
    totals: [
      "Total",
      null,
      null,
      major(data.totalNetMinor),
      major(data.totalPaidMinor),
      major(data.columns.reduce((a, c) => a + c.unpaidMinor, 0)),
      major(data.columns.reduce((a, c) => a + c.advanceOutstandingMinor, 0)),
    ],
  };

  return [grid, byMonth];
}
