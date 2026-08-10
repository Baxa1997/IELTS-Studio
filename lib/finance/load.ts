import "server-only";

import { type Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { DEFAULT_CURRENCY } from "./money";
import { type Period } from "./period";

/**
 * Reading the money. Every query here is scoped by RLS to the caller's
 * organization AND (for everything but a teacher's own payslip) to the
 * center_admin role — see migration 20260810120000. These loaders re-state the
 * role check only where an empty result would be misread as "no money moved".
 */

/* ── shapes ───────────────────────────────────────────────────────────────── */

export interface FinanceSettings {
  currency: string;
  invoiceDueDay: number;
  payrollNote: string | null;
}

export interface AccountBalance {
  id: string;
  name: string;
  kind: string;
  active: boolean;
  balanceMinor: number;
  totalInMinor: number;
  totalOutMinor: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  direction: "in" | "out";
  slug: string | null;
}

export interface LedgerRow {
  id: string;
  occurredOn: string;
  direction: "in" | "out";
  amountMinor: number;
  method: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  personName: string | null;
  groupName: string | null;
  note: string | null;
  createdByName: string | null;
}

export interface LedgerFilters {
  period: Period;
  accountId?: string;
  categoryId?: string;
  direction?: "in" | "out";
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  method?: string;
  /** Free-text over the note and the person's name. */
  q?: string;
  limit?: number;
}

export interface FinanceOverview {
  settings: FinanceSettings;
  accounts: AccountBalance[];
  categories: CategoryRow[];
  rows: LedgerRow[];
  /** Totals for the window, before any of the list filters narrow it. */
  periodInMinor: number;
  periodOutMinor: number;
  /** Same window, previous period of equal length — the delta on the KPI. */
  prevInMinor: number;
  prevOutMinor: number;
  /** Sum of what the filtered list itself shows. */
  filteredInMinor: number;
  filteredOutMinor: number;
  truncated: boolean;
}

/* ── settings ─────────────────────────────────────────────────────────────── */

export async function loadFinanceSettings(): Promise<FinanceSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("finance_settings")
    .select("currency, invoice_due_day, payroll_note")
    .maybeSingle();
  return {
    currency: (data?.currency as string) ?? DEFAULT_CURRENCY,
    invoiceDueDay: (data?.invoice_due_day as number) ?? 5,
    payrollNote: (data?.payroll_note as string | null) ?? null,
  };
}

/* ── the ledger ───────────────────────────────────────────────────────────── */

const LEDGER_SELECT = `
  id, occurred_on, direction, amount_minor, method, note,
  account_id, category_id, student_id, teacher_id, group_id,
  finance_accounts:account_id ( name ),
  finance_categories:category_id ( name ),
  student:student_id ( full_name ),
  teacher:teacher_id ( full_name ),
  author:created_by ( full_name ),
  groups:group_id ( name )
`;

type Joined = { full_name?: string | null; name?: string | null } | null;
const one = (v: unknown): Joined => (Array.isArray(v) ? ((v[0] ?? null) as Joined) : (v as Joined));

function toLedgerRow(r: Record<string, unknown>): LedgerRow {
  const account = one(r.finance_accounts);
  const category = one(r.finance_categories);
  const student = one(r.student);
  const teacher = one(r.teacher);
  const author = one(r.author);
  const group = one(r.groups);
  return {
    id: r.id as string,
    occurredOn: r.occurred_on as string,
    direction: r.direction as "in" | "out",
    amountMinor: Number(r.amount_minor ?? 0),
    method: (r.method as string) ?? "cash",
    accountId: r.account_id as string,
    accountName: account?.name ?? "—",
    categoryId: (r.category_id as string | null) ?? null,
    categoryName: category?.name ?? null,
    personName: student?.full_name ?? teacher?.full_name ?? null,
    groupName: group?.name ?? null,
    note: (r.note as string | null) ?? null,
    createdByName: author?.full_name ?? null,
  };
}

/**
 * The finance home: desk balances, the window's totals, and the filtered
 * ledger.
 *
 * The period totals are computed from a separate, unfiltered-by-list query so
 * the KPI strip keeps meaning "this month" while the table below it is narrowed
 * to one category — a KPI that moves when you filter a table underneath it is a
 * KPI you can't read.
 */
export async function loadFinanceOverview(
  profile: Profile,
  filters: LedgerFilters,
): Promise<FinanceOverview> {
  const supabase = await createClient();
  const limit = filters.limit ?? 200;
  const { period } = filters;

  // Same length, immediately before — so a 7-day window compares to the 7 days
  // before it, not to "last month".
  const spanDays =
    Math.round(
      (Date.parse(`${period.to}T00:00:00Z`) - Date.parse(`${period.from}T00:00:00Z`)) / 86_400_000,
    ) + 1;
  const prevTo = new Date(`${period.from}T00:00:00Z`);
  prevTo.setUTCDate(prevTo.getUTCDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (spanDays - 1));

  let list = supabase
    .from("finance_transactions")
    .select(LEDGER_SELECT)
    .gte("occurred_on", period.from)
    .lte("occurred_on", period.to)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (filters.accountId) list = list.eq("account_id", filters.accountId);
  if (filters.categoryId) list = list.eq("category_id", filters.categoryId);
  if (filters.direction) list = list.eq("direction", filters.direction);
  if (filters.groupId) list = list.eq("group_id", filters.groupId);
  if (filters.studentId) list = list.eq("student_id", filters.studentId);
  if (filters.teacherId) list = list.eq("teacher_id", filters.teacherId);
  if (filters.method) list = list.eq("method", filters.method);

  const [settings, accountsRes, categoriesRes, listRes, totalsRes, prevRes] = await Promise.all([
    loadFinanceSettings(),
    supabase
      .from("v_finance_account_balances")
      .select("account_id, name, kind, active, balance_minor, total_in_minor, total_out_minor")
      .order("sort", { ascending: true }),
    supabase
      .from("finance_categories")
      .select("id, name, direction, slug")
      .eq("active", true)
      .order("direction", { ascending: true })
      .order("name", { ascending: true }),
    list,
    supabase
      .from("finance_transactions")
      .select("direction, amount_minor")
      .gte("occurred_on", period.from)
      .lte("occurred_on", period.to),
    supabase
      .from("finance_transactions")
      .select("direction, amount_minor")
      .gte("occurred_on", prevFrom.toISOString().slice(0, 10))
      .lte("occurred_on", prevTo.toISOString().slice(0, 10)),
  ]);

  const sum = (rows: { direction: string; amount_minor: number }[] | null, dir: "in" | "out") =>
    (rows ?? [])
      .filter((r) => r.direction === dir)
      .reduce((a, r) => a + Number(r.amount_minor ?? 0), 0);

  let rows = ((listRes.data ?? []) as unknown as Record<string, unknown>[]).map(toLedgerRow);
  const truncated = rows.length > limit;
  if (truncated) rows = rows.slice(0, limit);

  // Free text is applied in memory: it spans a joined name and a note, which
  // PostgREST can't `or` across in one filter, and the window is already bounded.
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    rows = rows.filter((r) =>
      [r.personName, r.note, r.categoryName, r.groupName, r.accountName]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle)),
    );
  }

  return {
    settings,
    accounts: ((accountsRes.data ?? []) as Record<string, unknown>[]).map((a) => ({
      id: a.account_id as string,
      name: a.name as string,
      kind: a.kind as string,
      active: Boolean(a.active),
      balanceMinor: Number(a.balance_minor ?? 0),
      totalInMinor: Number(a.total_in_minor ?? 0),
      totalOutMinor: Number(a.total_out_minor ?? 0),
    })),
    categories: ((categoriesRes.data ?? []) as Record<string, unknown>[]).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      direction: c.direction as "in" | "out",
      slug: (c.slug as string | null) ?? null,
    })),
    rows,
    periodInMinor: sum(totalsRes.data as never, "in"),
    periodOutMinor: sum(totalsRes.data as never, "out"),
    prevInMinor: sum(prevRes.data as never, "in"),
    prevOutMinor: sum(prevRes.data as never, "out"),
    filteredInMinor: rows
      .filter((r) => r.direction === "in")
      .reduce((a, r) => a + r.amountMinor, 0),
    filteredOutMinor: rows
      .filter((r) => r.direction === "out")
      .reduce((a, r) => a + r.amountMinor, 0),
    truncated,
  };
}

/* ── expenses, broken down ────────────────────────────────────────────────── */

export interface CategoryTotal {
  categoryId: string | null;
  name: string;
  amountMinor: number;
  share: number;
  count: number;
}

/** Spend by category for the window — the "where did it go" card and the PDF. */
export async function loadCategoryTotals(
  period: Period,
  direction: "in" | "out",
): Promise<CategoryTotal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("finance_transactions")
    .select("amount_minor, category_id, finance_categories:category_id ( name )")
    .eq("direction", direction)
    .gte("occurred_on", period.from)
    .lte("occurred_on", period.to);

  const buckets = new Map<string, CategoryTotal>();
  for (const r of (data ?? []) as unknown as Record<string, unknown>[]) {
    const id = (r.category_id as string | null) ?? "none";
    const name = one(r.finance_categories)?.name ?? "Uncategorised";
    const current = buckets.get(id) ?? {
      categoryId: (r.category_id as string | null) ?? null,
      name,
      amountMinor: 0,
      share: 0,
      count: 0,
    };
    current.amountMinor += Number(r.amount_minor ?? 0);
    current.count += 1;
    buckets.set(id, current);
  }
  const rows = [...buckets.values()].sort((a, b) => b.amountMinor - a.amountMinor);
  const total = rows.reduce((a, r) => a + r.amountMinor, 0);
  for (const r of rows) r.share = total > 0 ? Math.round((100 * r.amountMinor) / total) : 0;
  return rows;
}

/* ── invoices and debtors ─────────────────────────────────────────────────── */

export interface InvoiceRow {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  periodMonth: string;
  dueMinor: number;
  paidMinor: number;
  balanceMinor: number;
  dueOn: string | null;
  status: "paid" | "part" | "open" | "overdue";
}

export async function loadInvoices(opts: {
  periodMonth: string;
  groupId?: string;
  onlyUnpaid?: boolean;
}): Promise<InvoiceRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("student_invoices")
    .select(
      "id, student_id, group_id, period_month, amount_minor, discount_minor, due_on, student:student_id ( full_name ), groups:group_id ( name )",
    )
    .eq("period_month", opts.periodMonth)
    .eq("voided", false);
  if (opts.groupId) query = query.eq("group_id", opts.groupId);

  const { data: invoices } = await query;
  const ids = ((invoices ?? []) as Record<string, unknown>[]).map((i) => i.id as string);

  // Settlement per invoice in one pass, rather than the view per row.
  const paid = new Map<string, number>();
  if (ids.length > 0) {
    const { data: settle } = await supabase
      .from("v_invoice_settlement")
      .select("invoice_id, paid_minor")
      .in("invoice_id", ids);
    for (const s of (settle ?? []) as Record<string, unknown>[]) {
      paid.set(s.invoice_id as string, Number(s.paid_minor ?? 0));
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const rows: InvoiceRow[] = ((invoices ?? []) as unknown as Record<string, unknown>[]).map((i) => {
    const due = Number(i.amount_minor ?? 0) - Number(i.discount_minor ?? 0);
    const paidMinor = paid.get(i.id as string) ?? 0;
    const balance = due - paidMinor;
    const dueOn = (i.due_on as string | null) ?? null;
    const status: InvoiceRow["status"] =
      balance <= 0
        ? "paid"
        : paidMinor > 0
          ? "part"
          : dueOn && dueOn < todayStr
            ? "overdue"
            : "open";
    return {
      id: i.id as string,
      studentId: i.student_id as string,
      studentName: one(i.student)?.full_name ?? "—",
      groupId: i.group_id as string,
      groupName: one(i.groups)?.name ?? "—",
      periodMonth: i.period_month as string,
      dueMinor: due,
      paidMinor,
      balanceMinor: balance,
      dueOn,
      status,
    };
  });

  const filtered = opts.onlyUnpaid ? rows.filter((r) => r.balanceMinor > 0) : rows;
  return filtered.sort(
    (a, b) => b.balanceMinor - a.balanceMinor || a.studentName.localeCompare(b.studentName),
  );
}

export interface DebtorRow {
  studentId: string;
  studentName: string;
  chargedMinor: number;
  paidMinor: number;
  owedMinor: number;
}

/** Everyone carrying a balance, worst first. The front desk's call list. */
export async function loadDebtors(limit = 50): Promise<DebtorRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_student_finance")
    .select("student_id, charged_minor, paid_minor, owed_minor")
    .gt("owed_minor", 0)
    .order("owed_minor", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return [];

  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in(
      "id",
      rows.map((r) => r.student_id as string),
    );
  const name = new Map(
    ((people ?? []) as Record<string, unknown>[]).map((p) => [
      p.id as string,
      (p.full_name as string | null) ?? "—",
    ]),
  );

  return rows.map((r) => ({
    studentId: r.student_id as string,
    studentName: name.get(r.student_id as string) ?? "—",
    chargedMinor: Number(r.charged_minor ?? 0),
    paidMinor: Number(r.paid_minor ?? 0),
    owedMinor: Number(r.owed_minor ?? 0),
  }));
}

/* ── pickers ──────────────────────────────────────────────────────────────── */

export interface PersonOption {
  id: string;
  name: string;
  meta?: string;
}

/** Students and staff for the transaction form's "who" field. */
export async function loadFinancePeople(): Promise<{
  students: PersonOption[];
  teachers: PersonOption[];
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name", { ascending: true });

  const rows = (data ?? []) as Record<string, unknown>[];
  const pick = (roles: string[]) =>
    rows
      .filter((p) => roles.includes(p.role as string))
      .map((p) => ({ id: p.id as string, name: (p.full_name as string | null) ?? "—" }));

  return { students: pick(["student"]), teachers: pick(["teacher", "center_admin"]) };
}
