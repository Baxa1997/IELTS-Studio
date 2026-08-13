import "server-only";

import { type Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { DEFAULT_CURRENCY } from "./money";
import { peopleMap } from "./names";
import { type Period } from "./period";

/**
 * Reading the money. Every query here is scoped by RLS to the caller's
 * organization AND (for everything but a teacher's own payslip) to the
 * center_admin role — see migration 20260810120000.
 *
 * NO POSTGREST EMBEDS. Names are fetched separately and joined in memory; the
 * reason is in `lib/finance/names.ts` and it is not a preference — embeds
 * through this schema's composite FKs return an error that supabase-js hands
 * back as an empty result, which renders as a blank page rather than a crash.
 */

/* ── shapes ───────────────────────────────────────────────────────────────── */

export interface FinanceSettings {
  currency: string;
  invoiceDueDay: number;
  payrollNote: string | null;
  /** Lessons assumed in a month for a class with nothing on the timetable. */
  lessonsPerMonth: number;
}

/** A cash desk (kassa): a float held by a named person, standing at a branch. */
export interface AccountBalance {
  id: string;
  name: string;
  kind: string;
  active: boolean;
  ownerId: string | null;
  ownerName: string | null;
  /** The site this desk stands at. Required since 20260810170000. */
  branchId: string;
  branchName: string | null;
  balanceMinor: number;
  totalInMinor: number;
  totalOutMinor: number;
}

/** A site, for the finance branch tabs. */
export interface BranchLite {
  id: string;
  name: string;
  active: boolean;
}

/** Income, expenses and net for one site over the window. */
export interface BranchTotal {
  branchId: string | null;
  name: string;
  inMinor: number;
  outMinor: number;
  netMinor: number;
}

/** Which branch the page is looking at: a branch id, or `"all"`/undefined. */
export type BranchScope = string | undefined;

/**
 * The desks a scope covers, or null for "every desk, don't filter".
 *
 * A branch owns desks and a transaction inherits its branch from the desk it
 * passed through (migrations 20260810150000 and 20260810170000), so every
 * branch filter in this file is really a filter on `account_id`.
 */
export function accountsInScope(accounts: AccountBalance[], scope: BranchScope): string[] | null {
  if (!scope || scope === "all") return null;
  return accounts.filter((a) => a.branchId === scope).map((a) => a.id);
}

/** Cash / card / terminal / QR, summed across every desk for the window. */
export interface MethodTotal {
  method: string;
  inMinor: number;
  outMinor: number;
  netMinor: number;
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
  /** When it was actually keyed in — the table shows date AND time. */
  recordedAt: string;
  direction: "in" | "out";
  amountMinor: number;
  method: string;
  status: string;
  accountId: string;
  accountName: string;
  /** Derived from the desk — a transaction has no branch of its own. */
  branchName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  personId: string | null;
  personName: string | null;
  groupName: string | null;
  note: string | null;
  createdByName: string | null;
  /** Set on both legs of a desk-to-desk transfer. */
  transferId: string | null;
}

export interface LedgerFilters {
  period: Period;
  /** A branch id, or undefined/"all" for every site. */
  branch?: BranchScope;
  accountId?: string;
  categoryId?: string;
  direction?: "in" | "out";
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  method?: string;
  /** Free text over the note. Names are filtered by picking a person instead. */
  q?: string;
  /**
   * Amount bounds, INCLUSIVE, in minor units — the same integers the column
   * stores, so the caller does the parsing once against the center's currency
   * and nothing here has to know what a decimal looks like.
   */
  minMinor?: number;
  maxMinor?: number;
  page?: number;
  pageSize?: number;
}

export interface FinanceOverview {
  settings: FinanceSettings;
  /** Every desk in the center, whatever the branch scope — the tabs need them all. */
  accounts: AccountBalance[];
  branches: BranchLite[];
  categories: CategoryRow[];
  methodTotals: MethodTotal[];
  rows: LedgerRow[];
  /** How many rows match the filters in total, for the pager. */
  matched: number;
  page: number;
  pageSize: number;
  /** Totals for the window, before the list filters narrow it. */
  periodInMinor: number;
  periodOutMinor: number;
  /** Same window, previous period of equal length — the delta on the KPI. */
  prevInMinor: number;
  prevOutMinor: number;
  /** Totals of everything matching the current filters, not just this page. */
  filteredInMinor: number;
  filteredOutMinor: number;
}

/* ── settings ─────────────────────────────────────────────────────────────── */

export async function loadFinanceSettings(): Promise<FinanceSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("finance_settings")
    .select("currency, invoice_due_day, payroll_note, lessons_per_month")
    .maybeSingle();
  return {
    currency: (data?.currency as string) ?? DEFAULT_CURRENCY,
    invoiceDueDay: (data?.invoice_due_day as number) ?? 5,
    payrollNote: (data?.payroll_note as string | null) ?? null,
    lessonsPerMonth: (data?.lessons_per_month as number | null) ?? 12,
  };
}

/* ── cash desks ───────────────────────────────────────────────────────────── */

export async function loadAccounts(): Promise<AccountBalance[]> {
  const supabase = await createClient();
  const [balancesRes, accountsRes, branchesRes] = await Promise.all([
    supabase
      .from("v_finance_account_balances")
      .select(
        "account_id, name, kind, active, balance_minor, total_in_minor, total_out_minor, sort",
      )
      .order("sort", { ascending: true }),
    supabase.from("finance_accounts").select("id, owner_id, branch_id"),
    supabase.from("branches").select("id, name"),
  ]);

  const desks = new Map(
    ((accountsRes.data ?? []) as Record<string, unknown>[]).map((a) => [
      a.id as string,
      {
        ownerId: (a.owner_id as string | null) ?? null,
        branchId: (a.branch_id as string | null) ?? null,
      },
    ]),
  );
  const branchName = new Map(
    ((branchesRes.data ?? []) as Record<string, unknown>[]).map((b) => [
      b.id as string,
      b.name as string,
    ]),
  );
  const ownerName = await peopleMap(
    supabase,
    [...desks.values()].map((d) => d.ownerId),
  );

  return ((balancesRes.data ?? []) as Record<string, unknown>[]).map((a) => {
    const id = a.account_id as string;
    const desk = desks.get(id);
    const ownerId = desk?.ownerId ?? null;
    const branchId = desk?.branchId ?? null;
    return {
      id,
      name: a.name as string,
      kind: a.kind as string,
      active: Boolean(a.active),
      ownerId,
      ownerName: ownerId ? (ownerName.get(ownerId) ?? null) : null,
      branchId: branchId ?? "",
      branchName: branchId ? (branchName.get(branchId) ?? null) : null,
      balanceMinor: Number(a.balance_minor ?? 0),
      totalInMinor: Number(a.total_in_minor ?? 0),
      totalOutMinor: Number(a.total_out_minor ?? 0),
    };
  });
}

/** The site list, for the finance branch tabs. */
export async function loadBranches(): Promise<BranchLite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, name, active")
    .order("sort", { ascending: true })
    .order("name", { ascending: true });
  return ((data ?? []) as Record<string, unknown>[]).map((b) => ({
    id: b.id as string,
    name: b.name as string,
    active: Boolean(b.active),
  }));
}

/**
 * Income and expenses per site for the window — the per-branch P&L.
 *
 * Grouped in memory from (account_id, direction, amount) because the branch is
 * a property of the desk, not of the row; the alternative is a view that has to
 * be kept in step with every filter the page grows.
 */
export async function loadBranchTotals(
  period: Period,
  accounts: AccountBalance[],
  branches: BranchLite[],
): Promise<BranchTotal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("finance_transactions")
    .select("account_id, direction, amount_minor")
    .gte("occurred_on", period.from)
    .lte("occurred_on", period.to);

  const branchOf = new Map(accounts.map((a) => [a.id, a.branchId || null]));
  const buckets = new Map<string, BranchTotal>();
  const bucket = (branchId: string | null, name: string) => {
    const key = branchId ?? "none";
    const existing = buckets.get(key);
    if (existing) return existing;
    const created: BranchTotal = { branchId, name, inMinor: 0, outMinor: 0, netMinor: 0 };
    buckets.set(key, created);
    return created;
  };
  // Every open branch appears even at zero — "Yunusobod took nothing this week"
  // is the answer the owner is looking for, and a missing row doesn't say it.
  for (const b of branches.filter((b) => b.active)) bucket(b.id, b.name);

  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const branchId = branchOf.get(r.account_id as string) ?? null;
    const name = branchId ? (branches.find((b) => b.id === branchId)?.name ?? "—") : "No branch";
    const row = bucket(branchId, name);
    const amount = Number(r.amount_minor ?? 0);
    if (r.direction === "in") row.inMinor += amount;
    else row.outMinor += amount;
    row.netMinor = row.inMinor - row.outMinor;
  }

  return [...buckets.values()].sort((a, b) => b.netMinor - a.netMinor);
}

/* ── the ledger ───────────────────────────────────────────────────────────── */

const LEDGER_COLUMNS =
  "id, occurred_on, created_at, direction, amount_minor, method, status, note, " +
  "account_id, category_id, student_id, teacher_id, group_id, created_by, transfer_id";

/**
 * The finance home: desk balances, the window's totals, and one page of the
 * filtered ledger.
 *
 * The period totals come from their own unfiltered query so the KPI strip keeps
 * meaning "this window" while the table below is narrowed to one category — a
 * KPI that moves when you filter the table under it is a KPI you cannot read.
 */
export async function loadFinanceOverview(
  _profile: Profile,
  filters: LedgerFilters,
): Promise<FinanceOverview> {
  const supabase = await createClient();
  const { period } = filters;
  const pageSize = Math.min(500, Math.max(10, filters.pageSize ?? 50));
  const page = Math.max(1, filters.page ?? 1);

  // The desks come first because the branch filter is expressed in terms of
  // them: money belongs to the site whose till it passed through.
  const [accounts, branches] = await Promise.all([loadAccounts(), loadBranches()]);
  const scopedAccountIds = accountsInScope(accounts, filters.branch);

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

  // The list, its count and its totals must agree, so the same narrowing is
  // applied to both queries. Written as an array of [column, value] pairs
  // rather than a generic helper because the builder's type is recursive and
  // threading it through a generic makes the compiler give up.
  const conditions: [string, string][] = [
    ["account_id", filters.accountId ?? ""],
    ["category_id", filters.categoryId ?? ""],
    ["direction", filters.direction ?? ""],
    ["group_id", filters.groupId ?? ""],
    ["student_id", filters.studentId ?? ""],
    ["teacher_id", filters.teacherId ?? ""],
    ["method", filters.method ?? ""],
  ].filter(([, value]) => value !== "") as [string, string][];

  let listQuery = supabase
    .from("finance_transactions")
    .select(LEDGER_COLUMNS, { count: "exact" })
    .gte("occurred_on", period.from)
    .lte("occurred_on", period.to);
  let filteredTotalsQuery = supabase
    .from("finance_transactions")
    .select("direction, amount_minor")
    .gte("occurred_on", period.from)
    .lte("occurred_on", period.to);
  // The window totals and the previous-window comparison are branch-scoped too,
  // or the KPI strip would answer a different question from the table below it.
  let windowTotalsQuery = supabase
    .from("finance_transactions")
    .select("direction, amount_minor, method")
    .gte("occurred_on", period.from)
    .lte("occurred_on", period.to);
  let prevTotalsQuery = supabase
    .from("finance_transactions")
    .select("direction, amount_minor")
    .gte("occurred_on", prevFrom.toISOString().slice(0, 10))
    .lte("occurred_on", prevTo.toISOString().slice(0, 10));

  if (scopedAccountIds) {
    listQuery = listQuery.in("account_id", scopedAccountIds);
    filteredTotalsQuery = filteredTotalsQuery.in("account_id", scopedAccountIds);
    windowTotalsQuery = windowTotalsQuery.in("account_id", scopedAccountIds);
    prevTotalsQuery = prevTotalsQuery.in("account_id", scopedAccountIds);
  }
  for (const [column, value] of conditions) {
    listQuery = listQuery.eq(column, value);
    filteredTotalsQuery = filteredTotalsQuery.eq(column, value);
  }
  if (filters.q) {
    listQuery = listQuery.ilike("note", `%${filters.q}%`);
    filteredTotalsQuery = filteredTotalsQuery.ilike("note", `%${filters.q}%`);
  }
  // Amount bounds go on the list AND its totals, like every other narrowing
  // here — the strip under the filter row has to add up to the rows above it.
  // `!= null` rather than truthiness: 0 is a legitimate bound.
  if (filters.minMinor != null) {
    listQuery = listQuery.gte("amount_minor", filters.minMinor);
    filteredTotalsQuery = filteredTotalsQuery.gte("amount_minor", filters.minMinor);
  }
  if (filters.maxMinor != null) {
    listQuery = listQuery.lte("amount_minor", filters.maxMinor);
    filteredTotalsQuery = filteredTotalsQuery.lte("amount_minor", filters.maxMinor);
  }

  const [settings, categoriesRes, listRes, filteredTotalsRes, totalsRes, prevRes] =
    await Promise.all([
      loadFinanceSettings(),
      supabase
        .from("finance_categories")
        .select("id, name, direction, slug")
        .eq("active", true)
        .order("direction", { ascending: true })
        .order("name", { ascending: true }),
      listQuery
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1),
      filteredTotalsQuery,
      windowTotalsQuery,
      prevTotalsQuery,
    ]);

  const sum = (rows: { direction: string; amount_minor: number }[] | null, dir: "in" | "out") =>
    (rows ?? [])
      .filter((r) => r.direction === dir)
      .reduce((a, r) => a + Number(r.amount_minor ?? 0), 0);

  const raw = (listRes.data ?? []) as unknown as Record<string, unknown>[];

  // One lookup per referenced table, for this page only.
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const accountBranch = new Map(accounts.map((a) => [a.id, a.branchName]));
  const categoryRows = ((categoriesRes.data ?? []) as Record<string, unknown>[]).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    direction: c.direction as "in" | "out",
    slug: (c.slug as string | null) ?? null,
  }));
  const categoryName = new Map(categoryRows.map((c) => [c.id, c.name]));

  const [people, groupsRes] = await Promise.all([
    peopleMap(supabase, [
      ...raw.map((r) => r.student_id as string | null),
      ...raw.map((r) => r.teacher_id as string | null),
      ...raw.map((r) => r.created_by as string | null),
    ]),
    supabase.from("groups").select("id, name"),
  ]);
  const groupName = new Map(
    ((groupsRes.data ?? []) as Record<string, unknown>[]).map((g) => [
      g.id as string,
      g.name as string,
    ]),
  );

  const rows: LedgerRow[] = raw.map((r) => {
    const studentId = (r.student_id as string | null) ?? null;
    const teacherId = (r.teacher_id as string | null) ?? null;
    const personId = studentId ?? teacherId;
    const createdBy = (r.created_by as string | null) ?? null;
    const categoryId = (r.category_id as string | null) ?? null;
    const groupId = (r.group_id as string | null) ?? null;
    return {
      id: r.id as string,
      occurredOn: r.occurred_on as string,
      recordedAt: (r.created_at as string) ?? "",
      direction: r.direction as "in" | "out",
      amountMinor: Number(r.amount_minor ?? 0),
      method: (r.method as string) ?? "cash",
      status: (r.status as string) ?? "confirmed",
      accountId: r.account_id as string,
      accountName: accountName.get(r.account_id as string) ?? "—",
      branchName: accountBranch.get(r.account_id as string) ?? null,
      categoryId,
      categoryName: categoryId ? (categoryName.get(categoryId) ?? null) : null,
      personId,
      personName: personId ? (people.get(personId) ?? null) : null,
      groupName: groupId ? (groupName.get(groupId) ?? null) : null,
      note: (r.note as string | null) ?? null,
      createdByName: createdBy ? (people.get(createdBy) ?? null) : null,
      transferId: (r.transfer_id as string | null) ?? null,
    };
  });

  // Method cards: cash / card / terminal / QR across the whole window.
  const byMethod = new Map<string, MethodTotal>();
  for (const r of (totalsRes.data ?? []) as Record<string, unknown>[]) {
    const method = (r.method as string) ?? "cash";
    const current = byMethod.get(method) ?? { method, inMinor: 0, outMinor: 0, netMinor: 0 };
    const amount = Number(r.amount_minor ?? 0);
    if (r.direction === "in") current.inMinor += amount;
    else current.outMinor += amount;
    current.netMinor = current.inMinor - current.outMinor;
    byMethod.set(method, current);
  }

  return {
    settings,
    accounts,
    branches,
    categories: categoryRows,
    methodTotals: [...byMethod.values()],
    rows,
    matched: listRes.count ?? rows.length,
    page,
    pageSize,
    periodInMinor: sum(totalsRes.data as never, "in"),
    periodOutMinor: sum(totalsRes.data as never, "out"),
    prevInMinor: sum(prevRes.data as never, "in"),
    prevOutMinor: sum(prevRes.data as never, "out"),
    filteredInMinor: sum(filteredTotalsRes.data as never, "in"),
    filteredOutMinor: sum(filteredTotalsRes.data as never, "out"),
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
  /** Desks to count, from `accountsInScope`. Null means the whole center. */
  accountIds?: string[] | null,
): Promise<CategoryTotal[]> {
  const supabase = await createClient();
  let txQuery = supabase
    .from("finance_transactions")
    .select("amount_minor, category_id")
    .eq("direction", direction)
    .gte("occurred_on", period.from)
    .lte("occurred_on", period.to);
  if (accountIds) txQuery = txQuery.in("account_id", accountIds);

  const [txRes, categoriesRes] = await Promise.all([
    txQuery,
    supabase.from("finance_categories").select("id, name"),
  ]);

  const categoryName = new Map(
    ((categoriesRes.data ?? []) as Record<string, unknown>[]).map((c) => [
      c.id as string,
      c.name as string,
    ]),
  );

  const buckets = new Map<string, CategoryTotal>();
  for (const r of (txRes.data ?? []) as Record<string, unknown>[]) {
    const categoryId = (r.category_id as string | null) ?? null;
    const key = categoryId ?? "none";
    const current = buckets.get(key) ?? {
      categoryId,
      name: categoryId ? (categoryName.get(categoryId) ?? "Uncategorised") : "Uncategorised",
      amountMinor: 0,
      share: 0,
      count: 0,
    };
    current.amountMinor += Number(r.amount_minor ?? 0);
    current.count += 1;
    buckets.set(key, current);
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
    .select("id, student_id, group_id, period_month, amount_minor, discount_minor, due_on")
    .eq("period_month", opts.periodMonth)
    .eq("voided", false);
  if (opts.groupId) query = query.eq("group_id", opts.groupId);

  const { data } = await query;
  const invoices = (data ?? []) as Record<string, unknown>[];
  const ids = invoices.map((i) => i.id as string);

  const [settleRes, students, groupsRes] = await Promise.all([
    ids.length > 0
      ? supabase.from("v_invoice_settlement").select("invoice_id, paid_minor").in("invoice_id", ids)
      : Promise.resolve({ data: null }),
    peopleMap(
      supabase,
      invoices.map((i) => i.student_id as string),
    ),
    supabase.from("groups").select("id, name"),
  ]);

  const paid = new Map(
    ((settleRes.data ?? []) as Record<string, unknown>[]).map((s) => [
      s.invoice_id as string,
      Number(s.paid_minor ?? 0),
    ]),
  );
  const groupName = new Map(
    ((groupsRes.data ?? []) as Record<string, unknown>[]).map((g) => [
      g.id as string,
      g.name as string,
    ]),
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const rows: InvoiceRow[] = invoices.map((i) => {
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
      studentName: students.get(i.student_id as string) ?? "—",
      groupId: i.group_id as string,
      groupName: groupName.get(i.group_id as string) ?? "—",
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

  const names = await peopleMap(
    supabase,
    rows.map((r) => r.student_id as string),
  );

  return rows.map((r) => ({
    studentId: r.student_id as string,
    studentName: names.get(r.student_id as string) ?? "—",
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
