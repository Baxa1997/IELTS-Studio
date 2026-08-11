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
import { loadBranchTotals, loadFinanceOverview, loadFinancePeople } from "@/lib/finance/load";
import { formatMoney } from "@/lib/finance/money";
import { prettyDate, resolvePeriod } from "@/lib/finance/period";

import { DeskForm, TransferForm } from "./desk-forms";
import { TransactionForm } from "./transaction-form";

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
 *   • Down the left, the KASSAS: a float held by a named person, each with its
 *     own Kirim / Chiqim / Ko'chirish, because money is taken at a desk by
 *     somebody who answers for it.
 *   • On the right, the entries, with the filters a director actually asks by —
 *     which dates, whose payment, which method, which staff member — and a
 *     pager, because fifty rows is a normal week.
 *
 * What is not copied: every filter lives in the URL, so the Excel and PDF
 * buttons export precisely what is on screen rather than a fixed report.
 */

const METHOD_LABEL: Record<string, string> = {
  cash: "Naqd · Cash",
  card: "Karta · Card",
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
  const page = Math.max(1, Number(first(sp.page) ?? 1) || 1);
  const pageSize = Math.min(200, Math.max(10, Number(first(sp.size) ?? 50) || 50));

  // A branch id, "none" for desks belonging to no site, "all" for the center.
  // Validated below against what actually exists, so a stale link can't hide
  // every desk.
  const branchParam = first(sp.branch);

  const [overview, people, { groups }] = await Promise.all([
    loadFinanceOverview(profile, {
      period,
      branch: branchParam,
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
   * The branch tabs, built from what exists.
   *
   * "No branch" appears whenever a desk has not been assigned to a site — the
   * same rule as the timetable, and for the same reason: a desk that belongs
   * to no tab is money that has vanished from the screen. Every center starts
   * there, since desks predate branches.
   */
  const openBranches = branches.filter((b) => b.active);
  const strayDesks = accounts.filter((a) => a.active && a.branchId == null);
  const tabs: { key: string; label: string; count: number }[] = [
    ...openBranches.map((b) => ({
      key: b.id,
      label: b.name,
      count: accounts.filter((a) => a.active && a.branchId === b.id).length,
    })),
    ...(strayDesks.length > 0 && openBranches.length > 0
      ? [{ key: "none", label: "No branch", count: strayDesks.length }]
      : []),
  ];
  const showBranchTabs = tabs.length > 0;
  const scope =
    branchParam && (branchParam === "all" || tabs.some((t) => t.key === branchParam))
      ? branchParam
      : tabs.length === 1
        ? tabs[0].key
        : "all";
  const inScope = (accountBranchId: string | null) =>
    scope === "all" || (scope === "none" ? accountBranchId == null : accountBranchId === scope);

  const activeDesks = accounts.filter((a) => a.active && inScope(a.branchId));
  const closedDesks = accounts.filter((a) => !a.active && inScope(a.branchId));
  const scopeLabel =
    scope === "all"
      ? null
      : scope === "none"
        ? "desks with no branch"
        : (tabs.find((t) => t.key === scope)?.label ?? null);

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
    return `/api/console/finance/export?${params.toString()}`;
  };

  const incomeCategories = categories.filter((c) => c.direction === "in");
  const expenseCategories = categories.filter((c) => c.direction === "out");
  const deskOptions = activeDesks.map((a) => ({ id: a.id, name: a.name }));
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));
  const transferOptions = activeDesks.map((a) => ({
    id: a.id,
    name: a.name,
    balanceLabel: money(a.balanceMinor),
  }));

  const lastPage = Math.max(1, Math.ceil(overview.matched / pageSize));
  const filterInput: React.CSSProperties = { ...fieldStyle, padding: "7px 9px", width: "auto" };

  return (
    <div>
      <PageHead
        eyebrow="Money"
        title="Finance"
        subtitle={`${period.label} · ${overview.matched} entr${overview.matched === 1 ? "y" : "ies"}${scopeLabel ? ` · ${scopeLabel}` : ""} · amounts in ${currency}.`}
        actions={
          <>
            <a href={exportHref("xlsx", "ledger")} style={chip} download>
              Excel
            </a>
            <a href={exportHref("pdf", "summary")} style={chip} download>
              PDF
            </a>
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
            // "No branch" is a to-do, not a place: these desks have not been
            // put at a site yet, so their money cannot be counted against one.
            // Tinted amber, and gone the moment none are left.
            const todo = tab.key === "none";
            const accent = todo ? "#8A6420" : INDIGO;
            return (
              <a
                key={tab.key}
                href={query({ branch: tab.key, page: undefined })}
                className="cn-tab"
                title={
                  todo
                    ? `${tab.count} desk${tab.count === 1 ? "" : "s"} not yet at a branch, so their takings count towards no site. Open a desk and pick one — this tab goes away when none are left.`
                    : undefined
                }
                style={{
                  padding: "8px 15px",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: on ? 600 : 500,
                  textDecoration: "none",
                  borderRadius: "9px 9px 0 0",
                  borderBottom: `2px solid ${on ? accent : "transparent"}`,
                  color: on ? accent : todo ? "#8A6420" : MUTED,
                  background: on ? (todo ? "#FDF9F1" : "#F2F1FB") : "transparent",
                }}
              >
                {tab.label}
                {tab.count >= 0 ? (
                  <span
                    style={{
                      marginLeft: 7,
                      fontSize: 11,
                      color: on ? accent : FAINT,
                      opacity: 0.75,
                    }}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </a>
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
              <a
                key={b.branchId ?? "none"}
                href={query({ branch: b.branchId ?? "none", page: undefined })}
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
              </a>
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
            <a
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
            </a>
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
            eyebrow="Kassa"
            title="Add a cash desk"
            note="A float held by a named person, who answers for what is in it."
            triggerStyle={{ width: "100%", padding: "10px 15px" }}
          >
            <DeskForm
              staff={people.teachers}
              currency={currency}
              branches={openBranches.map((b) => ({ id: b.id, name: b.name }))}
              defaultBranchId={scope === "all" || scope === "none" ? null : scope}
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
                      label="+ Kirim"
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
                      label="− Chiqim"
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
                      label="Ko'chirish"
                      eyebrow="Kassa"
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
                    eyebrow="Kassa"
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
                  <a
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
                  </a>
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
            <a
              href={showBranchTabs ? `/console/finance?branch=${scope}` : "/console/finance"}
              style={{ ...chip, padding: "7px 12px" }}
            >
              Reset
            </a>
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

          {rows.length === 0 ? (
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
              <a href={query({ page: "1" })} style={{ ...chip, opacity: page === 1 ? 0.4 : 1 }}>
                ⏮
              </a>
              <a
                href={query({ page: String(Math.max(1, page - 1)) })}
                style={{ ...chip, opacity: page === 1 ? 0.4 : 1 }}
              >
                ‹
              </a>
              <a
                href={query({ page: String(Math.min(lastPage, page + 1)) })}
                style={{ ...chip, opacity: page === lastPage ? 0.4 : 1 }}
              >
                ›
              </a>
              <a
                href={query({ page: String(lastPage) })}
                style={{ ...chip, opacity: page === lastPage ? 0.4 : 1 }}
              >
                ⏭
              </a>
            </div>
          </div>
        </Card>
      </div>

      <p
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
      </p>
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
