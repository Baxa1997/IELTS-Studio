import "server-only";

import {
  type PayrollMonthColumn,
  type PayrollMonthsData,
  type PayrollMonthsRow,
  stateOf,
} from "./payroll-grid";
import { monthLabel, monthStart } from "./period";
import { gatherPayrollFacts, loadPayrollRun, loadSalaryRules } from "./payroll";
import { computePayroll } from "./salary";

/**
 * Several months of payroll side by side — the sheet a center owner actually
 * keeps.
 *
 * The one they showed us is a grid: teachers down the left, a column per month
 * across, and beside each amount a word saying whether it was handed over, part
 * handed over as an advance, or still owed. The running question it answers is
 * not "what is this month's payroll" — the payroll page answers that — it is
 * "who am I still behind with, and since when". That question is unanswerable
 * one month at a time, which is why this exists as its own report.
 *
 * MONTHS WITH NO RUN ARE COMPUTED, NOT BLANK. An owner comparing May to July
 * has usually not clicked "run payroll" for July yet, and a blank column would
 * read as "nothing owed" — the opposite of the truth. Those columns are marked
 * `provisional` so the sheet can say so.
 */

/** Newest month last, so the sheet reads left to right in time. */
export async function loadPayrollMonths(monthsInput: string[]): Promise<PayrollMonthsData> {
  const months = [...new Set(monthsInput.map(monthStart))].sort().slice(-12);

  const rules = await loadSalaryRules();
  const columns: PayrollMonthColumn[] = [];
  const rows = new Map<string, PayrollMonthsRow>();
  const studentsByMonth = new Map<string, Map<string, number>>();

  for (const month of months) {
    const run = await loadPayrollRun(month);

    let cells: { teacherId: string; teacherName: string; net: number; paid: number }[];
    let saved: boolean;
    let status: PayrollMonthColumn["status"];

    if (run) {
      saved = true;
      status = run.status;
      cells = run.items.map((i) => ({
        teacherId: i.teacherId,
        teacherName: i.teacherName,
        net: i.netMinor,
        paid: i.paidMinor,
      }));
    } else {
      // Nothing saved for this month: work out what it would be. Nobody has
      // been paid against a run that does not exist, so `paid` is zero by
      // definition rather than by measurement.
      saved = false;
      status = "provisional";
      const facts = await gatherPayrollFacts(month);
      cells = computePayroll(facts, rules).map((c) => ({
        teacherId: c.teacherId,
        teacherName: c.teacherName,
        net: c.grossMinor,
        paid: 0,
      }));
    }

    // Headcount for the "N students" column, from the same month's facts. Only
    // fetched when the run is saved, because the provisional path already has
    // them in hand.
    const heads = new Map<string, number>();
    const facts = saved ? await gatherPayrollFacts(month) : null;
    for (const f of facts ?? []) {
      heads.set(
        f.teacherId,
        f.groups.reduce((a, g) => a + g.studentsEnrolled, 0),
      );
    }
    studentsByMonth.set(month, heads);

    let netMinor = 0;
    let paidMinor = 0;
    let unpaidMinor = 0;
    let advanceOutstandingMinor = 0;

    for (const c of cells) {
      const state = stateOf(c.net, c.paid);
      netMinor += c.net;
      paidMinor += c.paid;
      if (state === "unpaid") unpaidMinor += c.net;
      if (state === "advance") advanceOutstandingMinor += c.net - c.paid;

      if (!rows.has(c.teacherId)) {
        rows.set(c.teacherId, {
          teacherId: c.teacherId,
          teacherName: c.teacherName,
          students: 0,
          cells: new Map(),
          totalNetMinor: 0,
          totalPaidMinor: 0,
        });
      }
      const row = rows.get(c.teacherId)!;
      row.cells.set(month, { netMinor: c.net, paidMinor: c.paid, state });
      row.totalNetMinor += c.net;
      row.totalPaidMinor += c.paid;
    }

    columns.push({
      month,
      label: monthLabel(month),
      saved,
      status,
      netMinor,
      paidMinor,
      unpaidMinor,
      advanceOutstandingMinor,
    });
  }

  // Headcount is shown once per teacher, from the latest month they appear in —
  // a single "students" column across three months can only mean the most
  // recent one, and saying so beats averaging three different rosters.
  for (const row of rows.values()) {
    for (let i = months.length - 1; i >= 0; i--) {
      const n = studentsByMonth.get(months[i])?.get(row.teacherId);
      if (n != null && n > 0) {
        row.students = n;
        break;
      }
    }
  }

  const ordered = [...rows.values()].sort(
    (a, b) => b.totalNetMinor - a.totalNetMinor || a.teacherName.localeCompare(b.teacherName),
  );

  return {
    columns,
    rows: ordered,
    totalNetMinor: columns.reduce((a, c) => a + c.netMinor, 0),
    totalPaidMinor: columns.reduce((a, c) => a + c.paidMinor, 0),
    totalOutstandingMinor: columns.reduce((a, c) => a + (c.netMinor - c.paidMinor), 0),
  };
}
