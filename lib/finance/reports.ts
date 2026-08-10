import "server-only";

import { type Profile } from "@/lib/auth";

import {
  type CategoryTotal,
  type DebtorRow,
  loadCategoryTotals,
  loadDebtors,
  loadFinanceOverview,
  loadInvoices,
  type LedgerRow,
} from "./load";
import { formatMoney, minorDigits, toMajor } from "./money";
import { loadPayrollRun, type PayrollRunRow } from "./payroll";
import { monthLabel, monthStart, type Period, prettyDate, today } from "./period";
import { type PdfDocument, type PdfTable } from "./pdf";
import { basisSuffix, type PayrollLine } from "./salary";
import { type Sheet } from "./xlsx";

/**
 * One report, two renderings.
 *
 * The numbers are gathered once and shaped into a neutral model, then handed to
 * the XLSX writer or the PDF writer. That is the whole reason this file exists:
 * an accountant's spreadsheet and an owner's printable summary must never
 * disagree about what the month was, and the only way to guarantee that is for
 * them to be the same query.
 *
 * The split in emphasis is deliberate, though. The XLSX carries RAW NUMBERS —
 * unformatted, sortable, one row per fact, so it can be pivoted. The PDF
 * carries FORMATTED TEXT and a narrative order — summary first, detail after —
 * because it is read, not calculated on.
 */

export type ReportKind = "summary" | "ledger" | "expenses" | "payroll" | "debtors";

export const REPORT_LABEL: Record<ReportKind, string> = {
  summary: "Financial summary",
  ledger: "Full ledger",
  expenses: "Expenses",
  payroll: "Payroll",
  debtors: "Outstanding balances",
};

export interface ReportData {
  kind: ReportKind;
  organization: string;
  currency: string;
  period: Period;
  generatedBy: string;
  generatedOn: string;
  rows: LedgerRow[];
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
  debtors: DebtorRow[];
  payroll: PayrollRunRow | null;
  totalInMinor: number;
  totalOutMinor: number;
  openingNote: string | null;
}

/** Everything the requested report needs, and nothing it doesn't. */
export async function gatherReport(opts: {
  kind: ReportKind;
  profile: Profile;
  organizationName: string;
  period: Period;
  filters?: { accountId?: string; categoryId?: string; groupId?: string; direction?: "in" | "out" };
}): Promise<ReportData> {
  const { kind, period, filters = {} } = opts;

  const needsLedger = kind === "summary" || kind === "ledger" || kind === "expenses";
  const overview = await loadFinanceOverview(opts.profile, {
    period,
    ...filters,
    ...(kind === "expenses" ? { direction: "out" as const } : {}),
    limit: needsLedger ? 5000 : 1,
  });

  const [expenseByCategory, incomeByCategory, debtors, payroll] = await Promise.all([
    kind === "summary" || kind === "expenses"
      ? loadCategoryTotals(period, "out")
      : Promise.resolve([]),
    kind === "summary" ? loadCategoryTotals(period, "in") : Promise.resolve([]),
    kind === "summary" || kind === "debtors" ? loadDebtors(200) : Promise.resolve([]),
    kind === "summary" || kind === "payroll"
      ? loadPayrollRun(monthStart(period.from))
      : Promise.resolve(null),
  ]);

  return {
    kind,
    organization: opts.organizationName,
    currency: overview.settings.currency,
    period,
    generatedBy: opts.profile.full_name ?? "Center admin",
    generatedOn: today(),
    rows: needsLedger ? overview.rows : [],
    incomeByCategory,
    expenseByCategory,
    debtors,
    payroll,
    totalInMinor: overview.periodInMinor,
    totalOutMinor: overview.periodOutMinor,
    openingNote: overview.truncated
      ? "Truncated at 5000 rows — narrow the period to export the rest."
      : null,
  };
}

/* ── shared bits ──────────────────────────────────────────────────────────── */

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  terminal: "Terminal",
  qr: "QR",
  bank: "Bank transfer",
  other: "Other",
};

function payslipLineText(line: PayrollLine, money: (m: number) => string): string {
  const basis =
    line.basisUnit === "money"
      ? money(line.basisValue)
      : line.basisUnit === "none"
        ? ""
        : basisSuffix(line.basisUnit, line.basisValue);
  const rate =
    line.ratePercent != null
      ? `${line.ratePercent}%`
      : line.rateMinor != null
        ? `${money(line.rateMinor)} each`
        : "";
  return [basis, rate].filter(Boolean).join(" @ ");
}

/* ── XLSX ─────────────────────────────────────────────────────────────────── */

/**
 * Sheets, in the order an accountant opens them. Money is written in MAJOR
 * units as a real number — a spreadsheet column you can't sum is a screenshot
 * with extra steps.
 */
export function reportToSheets(data: ReportData): Sheet[] {
  const digits = minorDigits(data.currency);
  const major = (minor: number) => Number(toMajor(minor, data.currency).toFixed(digits));

  const notes = [
    `${data.organization} — ${REPORT_LABEL[data.kind]}`,
    `Period: ${data.period.label} (${data.period.from} to ${data.period.to})`,
    `Currency: ${data.currency}. Exported ${data.generatedOn} by ${data.generatedBy}.`,
    ...(data.openingNote ? [data.openingNote] : []),
  ];

  const sheets: Sheet[] = [];

  if (data.kind === "summary") {
    const net = data.totalInMinor - data.totalOutMinor;
    sheets.push({
      name: "Summary",
      notes,
      columns: [
        { header: "Measure", width: 34 },
        { header: `Amount (${data.currency})`, width: 20, type: "money" },
      ],
      rows: [
        ["Income", major(data.totalInMinor)],
        ["Expenses", major(data.totalOutMinor)],
        ["Net", major(net)],
        ["Payroll (this month, net)", major(data.payroll?.netMinor ?? 0)],
        ["Outstanding student balances", major(data.debtors.reduce((a, d) => a + d.owedMinor, 0))],
        ["Transactions", data.rows.length],
      ],
    });
  }

  if (data.incomeByCategory.length > 0 || data.expenseByCategory.length > 0) {
    sheets.push({
      name: "By category",
      columns: [
        { header: "Direction", width: 12 },
        { header: "Category", width: 28 },
        { header: "Transactions", width: 14, type: "number" },
        { header: `Amount (${data.currency})`, width: 20, type: "money" },
        { header: "Share %", width: 10, type: "number" },
      ],
      rows: [
        ...data.incomeByCategory.map((c) => [
          "Income",
          c.name,
          c.count,
          major(c.amountMinor),
          c.share,
        ]),
        ...data.expenseByCategory.map((c) => [
          "Expense",
          c.name,
          c.count,
          major(c.amountMinor),
          c.share,
        ]),
      ],
      totals: [
        "Total",
        "",
        data.incomeByCategory.reduce((a, c) => a + c.count, 0) +
          data.expenseByCategory.reduce((a, c) => a + c.count, 0),
        major(
          data.incomeByCategory.reduce((a, c) => a + c.amountMinor, 0) -
            data.expenseByCategory.reduce((a, c) => a + c.amountMinor, 0),
        ),
        "",
      ],
    });
  }

  if (data.rows.length > 0 || data.kind === "ledger" || data.kind === "expenses") {
    const isExpenses = data.kind === "expenses";
    sheets.push({
      name: isExpenses ? "Expenses" : "Ledger",
      notes: data.kind === "summary" ? undefined : notes,
      columns: [
        { header: "Date", width: 12, type: "date" },
        { header: "Direction", width: 10 },
        { header: "Category", width: 22 },
        { header: "Who", width: 24 },
        { header: "Class", width: 20 },
        { header: "Account", width: 14 },
        { header: "Method", width: 13 },
        { header: `Amount (${data.currency})`, width: 18, type: "money" },
        { header: "Note", width: 40 },
        { header: "Recorded by", width: 20 },
      ],
      rows: data.rows.map((r) => [
        r.occurredOn,
        r.direction === "in" ? "Income" : "Expense",
        r.categoryName ?? "Uncategorised",
        r.personName ?? "",
        r.groupName ?? "",
        r.accountName,
        METHOD_LABEL[r.method] ?? r.method,
        // Expenses are written negative so a single column sums to the net.
        major(r.direction === "in" ? r.amountMinor : -r.amountMinor),
        r.note ?? "",
        r.createdByName ?? "",
      ]),
      totals: [
        "Total",
        "",
        "",
        "",
        "",
        "",
        "",
        major(
          data.rows.reduce(
            (a, r) => a + (r.direction === "in" ? r.amountMinor : -r.amountMinor),
            0,
          ),
        ),
        "",
        "",
      ],
    });
  }

  if (data.payroll) {
    sheets.push({
      name: "Payroll",
      notes: data.kind === "payroll" ? notes : undefined,
      columns: [
        { header: "Teacher", width: 26 },
        { header: "Rule", width: 28 },
        { header: `Gross (${data.currency})`, width: 18, type: "money" },
        { header: "Adjustment", width: 16, type: "money" },
        { header: `Net (${data.currency})`, width: 18, type: "money" },
        { header: "Paid so far", width: 16, type: "money" },
        { header: "Still owed", width: 16, type: "money" },
        { header: "Adjustment note", width: 30 },
      ],
      rows: data.payroll.items.map((i) => [
        i.teacherName,
        i.ruleName ?? "",
        major(i.grossMinor),
        major(i.adjustmentMinor),
        major(i.netMinor),
        major(i.paidMinor),
        major(i.netMinor - i.paidMinor),
        i.adjustmentNote ?? "",
      ]),
      totals: [
        "Total",
        "",
        major(data.payroll.items.reduce((a, i) => a + i.grossMinor, 0)),
        major(data.payroll.items.reduce((a, i) => a + i.adjustmentMinor, 0)),
        major(data.payroll.items.reduce((a, i) => a + i.netMinor, 0)),
        major(data.payroll.items.reduce((a, i) => a + i.paidMinor, 0)),
        major(data.payroll.items.reduce((a, i) => a + (i.netMinor - i.paidMinor), 0)),
        "",
      ],
    });

    // Every line of every payslip: the sheet that answers "why is this number
    // this number" without anyone having to re-run the engine.
    const money = (m: number) => formatMoney(m, data.currency);
    sheets.push({
      name: "Payroll detail",
      columns: [
        { header: "Teacher", width: 24 },
        { header: "Class", width: 22 },
        { header: "Component", width: 26 },
        { header: "Measured", width: 24 },
        { header: `Amount (${data.currency})`, width: 18, type: "money" },
        { header: "Rule", width: 24 },
      ],
      rows: data.payroll.items.flatMap((item) =>
        item.breakdown.map((line) => [
          item.teacherName,
          line.groupName ?? "—",
          line.label,
          payslipLineText(line, money),
          major(line.amountMinor),
          line.ruleName ?? "",
        ]),
      ),
    });
  }

  if (data.debtors.length > 0) {
    sheets.push({
      name: "Balances",
      notes: data.kind === "debtors" ? notes : undefined,
      columns: [
        { header: "Student", width: 28 },
        { header: `Charged (${data.currency})`, width: 18, type: "money" },
        { header: `Paid (${data.currency})`, width: 18, type: "money" },
        { header: `Owed (${data.currency})`, width: 18, type: "money" },
      ],
      rows: data.debtors.map((d) => [
        d.studentName,
        major(d.chargedMinor),
        major(d.paidMinor),
        major(d.owedMinor),
      ]),
      totals: [
        "Total",
        major(data.debtors.reduce((a, d) => a + d.chargedMinor, 0)),
        major(data.debtors.reduce((a, d) => a + d.paidMinor, 0)),
        major(data.debtors.reduce((a, d) => a + d.owedMinor, 0)),
      ],
    });
  }

  return sheets;
}

/* ── PDF ──────────────────────────────────────────────────────────────────── */

export function reportToPdf(data: ReportData): PdfDocument {
  const money = (m: number) => formatMoney(m, data.currency);
  const net = data.totalInMinor - data.totalOutMinor;
  const tables: PdfTable[] = [];

  if (data.incomeByCategory.length > 0) {
    tables.push({
      title: "Income by category",
      columns: [
        { header: "Category", width: 5 },
        { header: "Count", width: 1.4, align: "right" },
        { header: "Share", width: 1.4, align: "right" },
        { header: `Amount (${data.currency})`, width: 2.6, align: "right" },
      ],
      rows: data.incomeByCategory.map((c) => [
        c.name,
        String(c.count),
        `${c.share}%`,
        money(c.amountMinor),
      ]),
      totals: ["Total income", "", "", money(data.totalInMinor)],
    });
  }

  if (data.expenseByCategory.length > 0) {
    tables.push({
      title: "Expenses by category",
      note:
        data.kind === "expenses"
          ? "Every expense recorded in the period, grouped by what it was for."
          : undefined,
      columns: [
        { header: "Category", width: 5 },
        { header: "Count", width: 1.4, align: "right" },
        { header: "Share", width: 1.4, align: "right" },
        { header: `Amount (${data.currency})`, width: 2.6, align: "right" },
      ],
      rows: data.expenseByCategory.map((c) => [
        c.name,
        String(c.count),
        `${c.share}%`,
        money(c.amountMinor),
      ]),
      totals: ["Total expenses", "", "", money(data.totalOutMinor)],
    });
  }

  if (data.payroll) {
    tables.push({
      title: `Payroll — ${monthLabel(data.payroll.periodMonth)}`,
      note: `Run status: ${data.payroll.status}. Gross ${money(data.payroll.grossMinor)}, net ${money(data.payroll.netMinor)}.`,
      columns: [
        { header: "Teacher", width: 3.4 },
        { header: "Rule", width: 3.2 },
        { header: "Gross", width: 1.8, align: "right" },
        { header: "Adj.", width: 1.4, align: "right" },
        { header: "Net", width: 1.8, align: "right" },
        { header: "Owed", width: 1.6, align: "right" },
      ],
      rows: data.payroll.items.map((i) => [
        i.teacherName,
        i.ruleName ?? "—",
        money(i.grossMinor),
        i.adjustmentMinor === 0 ? "—" : money(i.adjustmentMinor),
        money(i.netMinor),
        money(i.netMinor - i.paidMinor),
      ]),
      totals: [
        "Total",
        "",
        money(data.payroll.items.reduce((a, i) => a + i.grossMinor, 0)),
        "",
        money(data.payroll.netMinor),
        money(data.payroll.items.reduce((a, i) => a + (i.netMinor - i.paidMinor), 0)),
      ],
    });

    if (data.kind === "payroll") {
      for (const item of data.payroll.items) {
        tables.push({
          title: `${item.teacherName} — how ${money(item.netMinor)} was reached`,
          note: item.ruleName ? `Pay rule: ${item.ruleName}` : undefined,
          columns: [
            { header: "Class", width: 3 },
            { header: "Component", width: 3.4 },
            { header: "Measured", width: 3.6, align: "right" },
            { header: "Amount", width: 2, align: "right" },
          ],
          rows: [
            ...item.breakdown.map((line) => [
              line.groupName ?? "—",
              line.label,
              payslipLineText(line, money),
              money(line.amountMinor),
            ]),
            ...(item.adjustmentMinor !== 0
              ? [["—", "Manual adjustment", item.adjustmentNote ?? "", money(item.adjustmentMinor)]]
              : []),
          ],
          totals: ["", "Net pay", "", money(item.netMinor)],
        });
      }
    }
  }

  if (data.kind === "ledger" || data.kind === "expenses") {
    tables.push({
      title: data.kind === "expenses" ? "Expense detail" : "Transactions",
      columns: [
        { header: "Date", width: 1.7 },
        { header: "Category", width: 2.6 },
        { header: "Who / class", width: 3.2 },
        { header: "Account", width: 1.8 },
        { header: "Note", width: 3.2 },
        { header: `Amount`, width: 2, align: "right" },
      ],
      rows: data.rows.map((r) => [
        prettyDate(r.occurredOn),
        r.categoryName ?? "Uncategorised",
        [r.personName, r.groupName].filter(Boolean).join(" · ") || "—",
        r.accountName,
        r.note ?? "",
        `${r.direction === "in" ? "+" : "−"}${money(r.amountMinor)}`,
      ]),
      tone: data.rows.map((r) => r.direction),
      totals: ["", "", "", "", "Net", money(net)],
    });
  }

  if (data.debtors.length > 0) {
    tables.push({
      title: "Outstanding student balances",
      note: "Charged less paid, all time. Chase list for the front desk.",
      columns: [
        { header: "Student", width: 5 },
        { header: "Charged", width: 2, align: "right" },
        { header: "Paid", width: 2, align: "right" },
        { header: "Owed", width: 2, align: "right" },
      ],
      rows: data.debtors
        .slice(0, 60)
        .map((d) => [d.studentName, money(d.chargedMinor), money(d.paidMinor), money(d.owedMinor)]),
      totals: ["Total", "", "", money(data.debtors.reduce((a, d) => a + d.owedMinor, 0))],
    });
  }

  return {
    organization: data.organization,
    title: REPORT_LABEL[data.kind],
    subtitle: data.period.label,
    meta: [
      `Generated ${prettyDate(data.generatedOn)}`,
      `By ${data.generatedBy}`,
      `Amounts in ${data.currency}`,
    ],
    stats:
      data.kind === "payroll"
        ? [
            { label: "Payroll gross", value: money(data.payroll?.grossMinor ?? 0) },
            { label: "Payroll net", value: money(data.payroll?.netMinor ?? 0), tone: "bad" },
            { label: "Teachers", value: String(data.payroll?.items.length ?? 0) },
            {
              label: "Still to pay",
              value: money(
                (data.payroll?.items ?? []).reduce((a, i) => a + (i.netMinor - i.paidMinor), 0),
              ),
              tone: "bad",
            },
          ]
        : [
            { label: "Income", value: money(data.totalInMinor), tone: "good" },
            { label: "Expenses", value: money(data.totalOutMinor), tone: "bad" },
            { label: "Net", value: money(net), tone: net >= 0 ? "good" : "bad" },
            { label: "Transactions", value: String(data.rows.length || "—") },
          ],
    tables,
    footer: `${data.organization} · ${REPORT_LABEL[data.kind]} · ${data.period.from} to ${data.period.to} · generated by ${data.generatedBy}. Internal management report — not a tax filing.`,
  };
}

/** `ideal-education-expenses-2026-08.xlsx` */
export function reportFilename(data: ReportData, extension: string): string {
  const slug = data.organization
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "center"}-${data.kind}-${data.period.from}_${data.period.to}.${extension}`;
}

/** A CSV of any sheet, for the people who just want the raw rows. */
export function invoicesSheet(
  invoices: Awaited<ReturnType<typeof loadInvoices>>,
  currency: string,
): Sheet {
  const digits = minorDigits(currency);
  const major = (minor: number) => Number(toMajor(minor, currency).toFixed(digits));
  return {
    name: "Invoices",
    columns: [
      { header: "Student", width: 26 },
      { header: "Class", width: 22 },
      { header: "Month", width: 12, type: "date" },
      { header: `Due (${currency})`, width: 16, type: "money" },
      { header: `Paid (${currency})`, width: 16, type: "money" },
      { header: `Balance (${currency})`, width: 16, type: "money" },
      { header: "Status", width: 12 },
    ],
    rows: invoices.map((i) => [
      i.studentName,
      i.groupName,
      i.periodMonth,
      major(i.dueMinor),
      major(i.paidMinor),
      major(i.balanceMinor),
      i.status,
    ]),
    totals: [
      "Total",
      "",
      "",
      major(invoices.reduce((a, i) => a + i.dueMinor, 0)),
      major(invoices.reduce((a, i) => a + i.paidMinor, 0)),
      major(invoices.reduce((a, i) => a + i.balanceMinor, 0)),
      "",
    ],
  };
}
