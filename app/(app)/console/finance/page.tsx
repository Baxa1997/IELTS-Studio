import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  Empty,
  FAINT,
  fieldStyle,
  GREEN,
  HAIR,
  INDIGO,
  INK,
  MUTED,
  PageHead,
  RED,
  SANS,
  SOFT,
  Table,
  Tag,
  TD,
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import {
  loadBranchTotals,
  loadFinanceOverview,
  loadFinancePeople,
  loadFinanceSettings,
} from "@/lib/finance/load";
import { formatMoney, parseMoney } from "@/lib/finance/money";
import { prettyDate, resolvePeriod } from "@/lib/finance/period";

import { DeskForm, TransferForm } from "./desk-forms";
import { TransactionForm } from "./transaction-form";
import { DownloadLink } from "@/components/console/file-links";

export const dynamic = "force-dynamic";

/**
 * Finance, laid out the way the staff already work.
 *
 * This follows the reference CRM's structure deliberately, because that
 * structure encodes how a front desk really runs, and a cleverer layout nobody
 * recognises is worse than a familiar one:
 *
 *   • Across the top, totals BY PAYMENT METHOD — naqd, karta, terminal, QR. A
 *     method is a property of the payment, not of a desk, so these sum across
 *     every desk in the window.
 *   • Down the left, the CASH DESKS — kassa, in the CRM this copies: a float
 *     held by a named person, each with its own take / spend / transfer,
 *     because money is taken at a desk by somebody who answers for it.
 *   • On the right, the entries, with the filters a director actually asks by —
 *     which dates, whose payment, which method, which staff member — and a
 *     pager, because fifty rows is a normal week.
 *
 * What is not copied: every filter lives in the URL, so the Excel and PDF
 * buttons export precisely what is on screen rather than a fixed report.
 */

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  terminal: "Terminal",
  qr: "QR",
  bank: "Bank",
  other: "Other",
};

const METHOD_ORDER = ["cash", "card", "terminal", "qr", "bank", "other"];

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "neutral"> = {
  confirmed: "green",
  pending: "amber",
  cancelled: "red",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async function FinancePage({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") redirect("/console");

  const sp = await searchParams;
  const period = resolvePeriod({ from: first(sp.from), to: first(sp.to), month: first(sp.month) });

  const rawDirection = first(sp.direction);
  const direction = rawDirection === "in" || rawDirection === "out" ? rawDirection : undefined;
  const accountId = first(sp.account);
  const categoryId = first(sp.category);
  const studentId = first(sp.student);
  const teacherId = first(sp.teacher);
  const method = first(sp.method);
  const q = first(sp.q);
  const minRaw = first(sp.min);
  const maxRaw = first(sp.max);
  const page = Math.max(1, Number(first(sp.page) ?? 1) || 1);
  const pageSize = Math.min(200, Math.max(10, Number(first(sp.size) ?? 50) || 50));

  // A branch id, or "all" for the whole center. Validated below against the
  // branches that actually exist, so a stale link can't hide every desk.
  const branchParam = first(sp.branch);

  // Amounts are typed in major units ("550 000") and stored in minor ones, so
  // they are parsed against the center's own currency before any query sees
  // them — the same single conversion point every write already goes through.
  const { currency: filterCurrency } = await loadFinanceSettings();
  const minMinor = minRaw ? (parseMoney(minRaw, filterCurrency) ?? undefined) : undefined;
  const maxMinor = maxRaw ? (parseMoney(maxRaw, filterCurrency) ?? undefined) : undefined;

  const [overview, people, { groups }] = await Promise.all([
    loadFinanceOverview(profile, {
      period,
      branch: branchParam,
      minMinor,
      maxMinor,
      direction,
      accountId,
      categoryId,
      studentId,
      teacherId,
      method,
      q,
      page,
      pageSize,
    }),
    loadFinancePeople(),
    loadGroups(profile),
  ]);

  const { settings, accounts, branches, categories, rows, methodTotals } = overview;
  const currency = settings.currency;
  const money = (m: number) => formatMoney(m, currency);

  /**
   * The branch tabs.
   *
   * Every desk is at a branch (migration 20260810170000), so the tabs are the
   * branches and nothing else — there is no "No branch" case left. The row
   * shows even for a single branch, because it names whose money is on screen;
   * "Whole center" only joins it once there is more than one site to total.
   */
  const openBranches = branches.filter((b) => b.active);
  const tabs = openBranches.map((b) => ({
    key: b.id,
    label: b.name,
    count: accounts.filter((a) => a.active && a.branchId === b.id).length,
  }));
  const showBranchTabs = tabs.length > 0;
  /**
   * Which branch the page SAYS it is showing, and it has to agree with what was
   * actually queried.
   *
   * The overview above ran with the raw `branch` param, so no param means every
   * desk. This used to default the highlight to the FIRST branch instead, which
   * made the page open showing the whole center's money under a tab naming one
   * site — and then the filter row carries `branch` as a hidden field, so
   * pressing Apply silently narrowed the ledger to that branch without anyone
   * having chosen a filter. Defaulting to "all" makes the tab tell the truth.
   *
   * A single-site center is the exception: its one branch IS every desk, so
   * highlighting it says the same thing while keeping the tab row meaningful
   * (there is no "Whole center" tab until a second site exists).
   */
  const scope =
    branchParam && (branchParam === "all" || tabs.some((t) => t.key === branchParam))
      ? branchParam
      : tabs.length === 1
        ? tabs[0].key
        : "all";
  /**
   * A desk with NO branch is always in scope.
   *
   * Migration 20260810170000 made a branch mandatory, but a desk created before
   * it still carries none (the loader hands that up as ""). Filtering those out
   * meant the center's original "Main desk" vanished from the page the moment a
   * second branch existed — no card, and worse, missing from the desk selector
   * inside the payment form, so its own "+ Take" posted a different desk or
   * nothing at all. Money that belongs to no site still belongs to the center,
   * so it shows everywhere rather than nowhere.
   */
  const inScope = (accountBranchId: string | null) =>
    scope === "all" || !accountBranchId || accountBranchId === scope;

  const activeDesks = accounts.filter((a) => a.active && inScope(a.branchId));
  const closedDesks = accounts.filter((a) => !a.active && inScope(a.branchId));
  const scopeLabel = scope === "all" ? null : (tabs.find((t) => t.key === scope)?.label ?? null);

  // The per-branch P&L only means anything when you are looking at all of them.
  const branchTotals =
    scope === "all" && openBranches.length > 0
      ? await loadBranchTotals(period, accounts, branches)
      : [];

  const query = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      from: period.from,
      to: period.to,
      branch: showBranchTabs ? scope : undefined,
      direction,
      account: accountId,
      category: categoryId,
      student: studentId,
      teacher: teacherId,
      method,
      q,
      min: minRaw,
      max: maxRaw,
      size: pageSize === 50 ? undefined : String(pageSize),
      page: undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(base)) if (value) params.set(key, value);
    return `?${params.toString()}`;
  };

  const exportHref = (format: "xlsx" | "pdf", report: string) => {
    const params = new URLSearchParams({ report, format, from: period.from, to: period.to });
    if (showBranchTabs && scope !== "all") params.set("branch", scope);
    if (accountId) params.set("account", accountId);
    if (categoryId) params.set("category", categoryId);
    if (direction) params.set("direction", direction);
    if (minRaw) params.set("min", minRaw);
    if (maxRaw) params.set("max", maxRaw);
    return `/api/console/finance/export?${params.toString()}`;
  };

  const incomeCategories = categories.filter((c) => c.direction === "in");
  const expenseCategories = categories.filter((c) => c.direction === "out");
  /**
   * Every open desk, not just the ones in the current tab.
   *
   * The branch tab decides what you are READING, never where you are allowed to
   * put money — a front desk taking a payment for the other site is ordinary.
   * And a filtered list was actively dangerous: the form defaults to the desk
   * whose button you pressed, so when that desk was out of scope the <select>
   * silently fell back to its first option and the payment landed somewhere
   * else entirely.
   */
  const openDesks = accounts.filter((a) => a.active);
  const deskOptions = openDesks.map((a) => ({
    id: a.id,
    name: a.branchName && showBranchTabs ? `${a.name} · ${a.branchName}` : a.name,
  }));
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));
  const transferOptions = openDesks.map((a) => ({
    id: a.id,
    name: a.name,
    balanceLabel: money(a.balanceMinor),
  }));

  const lastPage = Math.max(1, Math.ceil(overview.matched / pageSize));
  const filterInput: React.CSSProperties = { ...fieldStyle, padding: "7px 9px", width: "auto" };

  return (
    <div>
      <PageHead
        title="Finance"
        subtitle={`${period.label} · ${overview.matched} entr${overview.matched === 1 ? "y" : "ies"}${scopeLabel ? ` · ${scopeLabel}` : ""} · amounts in ${currency}.`}
        actions={
          <>
            <DownloadLink
              href={exportHref("xlsx", "ledger")}
              format="xlsx"
              label="Ledger"
              title="Every entry in this period, as a spreadsheet"
            />
            <DownloadLink
              href={exportHref("pdf", "summary")}
              format="pdf"
              label="Summary"
              title="This period on one page, as a PDF"
            />
          </>
        }
      />

      {/* ── the branch tabs ────────────────────────────────────────────────── */}
      {showBranchTabs ? (
        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: `1px solid ${HAIR}`,
          }}
        >
          {[
            ...tabs,
            ...(tabs.length > 1 ? [{ key: "all", label: "Whole center", count: -1 }] : []),
          ].map((tab) => {
            const on = tab.key === scope;
            return (
              <Link
                key={tab.key}
                href={query({ branch: tab.key, page: undefined })}
                className="cn-tab"
                style={{
                  padding: "8px 15px",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: on ? 600 : 500,
                  textDecoration: "none",
                  borderRadius: "9px 9px 0 0",
                  borderBottom: `2px solid ${on ? INDIGO : "transparent"}`,
                  color: on ? INDIGO : MUTED,
                  background: on ? "#F2F1FB" : "transparent",
                }}
              >
                {tab.label}
                {tab.count >= 0 ? (
                  <span
                    style={{
                      marginLeft: 7,
                      fontSize: 11,
                      color: on ? INDIGO : FAINT,
                      opacity: 0.75,
                    }}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}

      {/* ── what each site made ────────────────────────────────────────────── */}
      {branchTotals.length > 1 ? (
        <Card style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#8B8999",
              marginBottom: 11,
            }}
          >
            By branch · {period.label}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {branchTotals.map((b) => (
              <Link
                key={b.branchId ?? "unassigned"}
                href={query({ branch: b.branchId ?? "all", page: undefined })}
                className="cn-tile"
                style={{
                  display: "block",
                  textDecoration: "none",
                  border: `1px solid ${HAIR}`,
                  borderRadius: 11,
                  padding: "11px 13px",
                  background: "#FAFAF8",
                }}
              >
                <div style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED }}>{b.name}</div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 17,
                    fontWeight: 700,
                    color: b.netMinor < 0 ? RED : INK,
                    margin: "4px 0 3px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {money(b.netMinor)}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: FAINT }}>
                  in {money(b.inMinor)} · out {money(b.outMinor)}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      {/* ── totals by payment method ───────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {METHOD_ORDER.filter(
          (m) =>
            methodTotals.some((t) => t.method === m) ||
            ["cash", "card", "terminal", "qr"].includes(m),
        ).map((m) => {
          const total = methodTotals.find((t) => t.method === m);
          const on = method === m;
          return (
            <Link
              key={m}
              href={query({ method: on ? undefined : m })}
              className="cn-tile"
              style={{
                display: "block",
                background: on ? "#1D1C4C" : "#215273",
                border: on ? "2px solid #7FD8A8" : "2px solid transparent",
                borderRadius: 12,
                padding: "13px 15px",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  color: "rgba(255,255,255,.75)",
                  marginBottom: 7,
                }}
              >
                {METHOD_LABEL[m] ?? m}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 19,
                  fontWeight: 600,
                  color: "#fff",
                  letterSpacing: "-.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {money(total?.netMinor ?? 0)} {currency}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: "rgba(255,255,255,.6)",
                  marginTop: 5,
                }}
              >
                in {money(total?.inMinor ?? 0)} · out {money(total?.outMinor ?? 0)}
              </div>
            </Link>
          );
        })}
      </div>

      <div
        className="cn-split"
        style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 16, alignItems: "start" }}
      >
        {/* ── the desks ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Drawer
            label="+ Add a cash desk"
            eyebrow="Cash desk"
            title="Add a cash desk"
            note="A float held by a named person, who answers for what is in it."
            triggerStyle={{ width: "100%", padding: "10px 15px" }}
          >
            <DeskForm
              staff={people.teachers}
              currency={currency}
              branches={openBranches.map((b) => ({ id: b.id, name: b.name }))}
              defaultBranchId={scope === "all" ? (openBranches[0]?.id ?? null) : scope}
            />
          </Drawer>

          {activeDesks.length === 0 ? (
            <Card>
              <Empty>No desks yet. Add one and every payment gets somewhere to land.</Empty>
            </Card>
          ) : null}

          {activeDesks.map((desk) => {
            const on = accountId === desk.id;
            return (
              <div
                key={desk.id}
                style={{
                  background: on ? "#1D1C4C" : "#215273",
                  borderRadius: 14,
                  padding: "15px 16px",
                  border: on ? "2px solid #7FD8A8" : "2px solid transparent",
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: "#fff",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {desk.name}
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#fff",
                        margin: "6px 0 3px",
                        letterSpacing: "-.02em",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {money(desk.balanceMinor)} {currency}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: "rgba(255,255,255,.72)" }}>
                      {desk.ownerName ?? "No one assigned"}
                      {/* Only worth the space when several sites are on screen. */}
                      {scope === "all" && desk.branchName ? ` · ${desk.branchName}` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
                    <Drawer
                      label="+ Take"
                      eyebrow="Money in"
                      title={`Take a payment — ${desk.name}`}
                      note="Tuition, a registration fee, anything arriving at this desk."
                      triggerStyle={{
                        background: "#1B8A5A",
                        border: 0,
                        color: "#fff",
                        padding: "6px 13px",
                        fontSize: 12.5,
                        borderRadius: 8,
                      }}
                    >
                      <TransactionForm
                        direction="in"
                        currency={currency}
                        accounts={deskOptions}
                        categories={incomeCategories}
                        students={people.students}
                        teachers={people.teachers}
                        groups={groupOptions}
                        defaultAccountId={desk.id}
                        defaultCategoryId={incomeCategories.find((c) => c.slug === "tuition")?.id}
                      />
                    </Drawer>

                    <Drawer
                      label="− Spend"
                      eyebrow="Money out"
                      title={`Record an expense — ${desk.name}`}
                      note="Rent, salaries, supplies — anything leaving this desk."
                      triggerStyle={{
                        background: "#C2453A",
                        border: 0,
                        color: "#fff",
                        padding: "6px 13px",
                        fontSize: 12.5,
                        borderRadius: 8,
                      }}
                    >
                      <TransactionForm
                        direction="out"
                        currency={currency}
                        accounts={deskOptions}
                        categories={expenseCategories}
                        students={people.students}
                        teachers={people.teachers}
                        groups={groupOptions}
                        defaultAccountId={desk.id}
                      />
                    </Drawer>

                    <Drawer
                      label="Transfer"
                      eyebrow="Cash desk"
                      title="Move money between desks"
                      note="Two entries — out of one, into the other."
                      triggerStyle={{
                        background: "#5AA9E6",
                        border: 0,
                        color: "#0B2239",
                        padding: "6px 13px",
                        fontSize: 12.5,
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                    >
                      <TransferForm
                        accounts={transferOptions}
                        fromId={desk.id}
                        currency={currency}
                      />
                    </Drawer>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,.14)",
                  }}
                >
                  <Drawer
                    label="Edit"
                    eyebrow="Cash desk"
                    title={desk.name}
                    note="Rename it, hand it to someone else, or close it."
                    triggerStyle={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,.3)",
                      color: "#fff",
                      padding: "4px 11px",
                      fontSize: 12,
                      borderRadius: 7,
                      fontWeight: 500,
                    }}
                  >
                    <DeskForm
                      desk={{
                        id: desk.id,
                        name: desk.name,
                        ownerId: desk.ownerId,
                        branchId: desk.branchId,
                        kind: desk.kind,
                        active: desk.active,
                      }}
                      staff={people.teachers}
                      currency={currency}
                      branches={openBranches.map((b) => ({ id: b.id, name: b.name }))}
                    />
                  </Drawer>
                  <Link
                    href={query({ account: on ? undefined : desk.id })}
                    className="cn-link"
                    style={{
                      fontFamily: SANS,
                      fontSize: 12,
                      color: "rgba(255,255,255,.85)",
                      textDecoration: "none",
                    }}
                  >
                    {on ? "Clear filter" : "Show its entries →"}
                  </Link>
                </div>
              </div>
            );
          })}

          {closedDesks.length > 0 ? (
            <Card>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: ".07em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "#8B8999",
                  marginBottom: 9,
                }}
              >
                Closed
              </div>
              {closedDesks.map((desk) => (
                <div
                  key={desk.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    fontFamily: SANS,
                    fontSize: 12.5,
                    color: MUTED,
                    padding: "5px 0",
                  }}
                >
                  <span>{desk.name}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money(desk.balanceMinor)}
                  </span>
                </div>
              ))}
            </Card>
          ) : null}
        </div>

        {/* ── the entries ──────────────────────────────────────────────────── */}
        <Card flush>
          <form
            method="get"
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              padding: "14px 18px",
              borderBottom: `1px solid ${HAIR}`,
              alignItems: "center",
            }}
          >
            <input type="date" name="from" defaultValue={period.from} style={filterInput} />
            <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>—</span>
            <input type="date" name="to" defaultValue={period.to} style={filterInput} />

            <select name="direction" defaultValue={direction ?? ""} style={filterInput}>
              <option value="">Every entry</option>
              <option value="in">Income only</option>
              <option value="out">Expenses only</option>
            </select>

            <select name="student" defaultValue={studentId ?? ""} style={filterInput}>
              <option value="">Any student</option>
              {people.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select name="method" defaultValue={method ?? ""} style={filterInput}>
              <option value="">Any method</option>
              {METHOD_ORDER.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </select>

            <select name="teacher" defaultValue={teacherId ?? ""} style={filterInput}>
              <option value="">Any staff member</option>
              {people.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <select name="category" defaultValue={categoryId ?? ""} style={filterInput}>
              <option value="">Any category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.direction === "in" ? "↓" : "↑"} {c.name}
                </option>
              ))}
            </select>

            {/* Amount bounds, inclusive. Typed the way the amount box on the
                payment form is typed — "550 000" — and parsed the same way. */}
            <input
              name="min"
              defaultValue={minRaw ?? ""}
              inputMode="numeric"
              placeholder={`From ${currency}`}
              title="Only entries of at least this much"
              style={{ ...filterInput, width: 116 }}
            />
            <input
              name="max"
              defaultValue={maxRaw ?? ""}
              inputMode="numeric"
              placeholder={`To ${currency}`}
              title="Only entries of at most this much"
              style={{ ...filterInput, width: 116 }}
            />

            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search the note"
              style={{ ...filterInput, minWidth: 150 }}
            />
            {accountId ? <input type="hidden" name="account" value={accountId} /> : null}
            {showBranchTabs ? <input type="hidden" name="branch" value={scope} /> : null}

            <button
              type="submit"
              className="cn-btn cn-btn--primary"
              style={{
                background: INDIGO,
                border: 0,
                color: "#fff",
                borderRadius: 8,
                padding: "8px 15px",
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Apply
            </button>
            {/* A branch is context, not a filter, so Reset keeps it. */}
            <Link
              href={showBranchTabs ? `/console/finance?branch=${scope}` : "/console/finance"}
              style={{ ...chip, padding: "7px 12px" }}
            >
              Reset
            </Link>
          </form>

          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
              flexWrap: "wrap",
              padding: "11px 18px",
              borderBottom: `1px solid ${HAIR}`,
              background: "#FAFAF8",
            }}
          >
            <span style={{ fontFamily: SANS, fontSize: 13, color: GREEN, fontWeight: 600 }}>
              ↙ {money(overview.filteredInMinor)}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: RED, fontWeight: 600 }}>
              ↗ {money(overview.filteredOutMinor)}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: INK, fontWeight: 600 }}>
              net {money(overview.filteredInMinor - overview.filteredOutMinor)}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 12, color: SOFT }}>
              Total: {overview.matched}
            </span>
          </div>

          {/* A failed read and an empty result look identical in a table, and
              they need opposite responses — one is "widen your filters", the
              other is "something is broken". Say which. */}
          {overview.loadError ? (
            <div
              style={{
                margin: 18,
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid #E4CE9B",
                background: "#FBF3E2",
                fontFamily: SANS,
                fontSize: 13,
                color: "#7A5410",
                lineHeight: 1.5,
              }}
              role="alert"
            >
              <strong>The entries could not be loaded.</strong> Your desk balances are still
              correct — they come from a different query — so nothing has been lost.
              <div
                style={{
                  marginTop: 6,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12,
                }}
              >
                {overview.loadError}
              </div>
            </div>
          ) : rows.length === 0 ? (
            <Empty>
              Nothing matches. Widen the dates, clear a filter, or take the first payment from a
              desk on the left.
            </Empty>
          ) : (
            <Table cols={COLS} minWidth={880}>
              <THead
                cols={COLS}
                labels={["№", "Date", "Who", "What it was for", "Desk", "Amount", "Status"]}
              />
              {rows.map((row, i) => (
                <TRow key={row.id} cols={COLS}>
                  <TD tone="faint">{(page - 1) * pageSize + i + 1}</TD>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 12.5, color: INK }}>
                      {prettyDate(row.occurredOn)}
                    </div>
                    <div style={{ fontSize: 11, color: FAINT }}>
                      {row.recordedAt
                        ? new Date(row.recordedAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#4C4A63",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.personName ?? "—"}
                    </div>
                    {row.groupName ? (
                      <div style={{ fontSize: 11, color: FAINT }}>{row.groupName}</div>
                    ) : null}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: INK, fontSize: 12.5 }}>
                      {row.categoryName ?? (row.transferId ? "Transfer" : "Uncategorised")}
                    </div>
                    {row.note ? (
                      <div
                        style={{
                          fontSize: 11,
                          color: FAINT,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.note}
                      </div>
                    ) : null}
                  </div>
                  <TD tone="faint">
                    {row.accountName}
                    <div style={{ fontSize: 11 }}>{METHOD_LABEL[row.method]?.split(" · ")[0]}</div>
                  </TD>
                  <div
                    style={{
                      textAlign: "right",
                      fontFamily: SANS,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      color: row.direction === "in" ? GREEN : RED,
                    }}
                  >
                    {row.direction === "in" ? "+" : "−"}
                    {money(row.amountMinor)}
                  </div>
                  <div>
                    <Tag tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Tag>
                  </div>
                </TRow>
              ))}
            </Table>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              padding: "12px 18px",
            }}
          >
            <form method="get" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="hidden" name="from" value={period.from} />
              <input type="hidden" name="to" value={period.to} />
              {direction ? <input type="hidden" name="direction" value={direction} /> : null}
              {accountId ? <input type="hidden" name="account" value={accountId} /> : null}
              {showBranchTabs ? <input type="hidden" name="branch" value={scope} /> : null}
              <select name="size" defaultValue={String(pageSize)} style={filterInput}>
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n} rows
                  </option>
                ))}
              </select>
              <button
                type="submit"
                style={{
                  ...chip,
                  padding: "7px 11px",
                  cursor: "pointer",
                  border: "1px solid #E4E2DC",
                }}
              >
                Set
              </button>
            </form>

            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontFamily: SANS, fontSize: 12, color: SOFT }}>
                Page {page} of {lastPage}
              </span>
              <Link href={query({ page: "1" })} style={{ ...chip, opacity: page === 1 ? 0.4 : 1 }}>
                ⏮
              </Link>
              <Link
                href={query({ page: String(Math.max(1, page - 1)) })}
                style={{ ...chip, opacity: page === 1 ? 0.4 : 1 }}
              >
                ‹
              </Link>
              <Link
                href={query({ page: String(Math.min(lastPage, page + 1)) })}
                style={{ ...chip, opacity: page === lastPage ? 0.4 : 1 }}
              >
                ›
              </Link>
              <Link
                href={query({ page: String(lastPage) })}
                style={{ ...chip, opacity: page === lastPage ? 0.4 : 1 }}
              >
                ⏭
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* <p
        style={{
          fontFamily: SANS,
          fontSize: 12,
          color: FAINT,
          margin: "16px 0 0",
          lineHeight: 1.6,
        }}
      >
        The cards along the top total by how the money arrived, across every desk. The desks on the
        left total by where it now sits. A transfer moves the second without changing the first —
        which is why both exist.
      </p> */}
    </div>
  );
}

const COLS = "44px 100px 1.2fr 1.5fr 110px 130px 92px";

const chip: React.CSSProperties = {
  background: "#F4F3EF",
  border: "1px solid #E4E2DC",
  borderRadius: 7,
  padding: "6px 11px",
  fontFamily: SANS,
  fontSize: 12,
  color: INK,
  textDecoration: "none",
  display: "inline-block",
};
