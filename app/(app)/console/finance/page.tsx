import { redirect } from "next/navigation";

import {
  AMBER,
  Bar,
  BtnLink,
  Card,
  CardHead,
  Chip,
  Empty,
  FAINT,
  fieldStyle,
  GREEN,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  PageHead,
  RED,
  SANS,
  SOFT,
  Stack,
  Table,
  TD,
  TextLink,
  THead,
  Toolbar,
  TRow,
} from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import {
  loadCategoryTotals,
  loadDebtors,
  loadFinanceOverview,
  loadFinancePeople,
} from "@/lib/finance/load";
import { formatMoney, formatMoneyShort } from "@/lib/finance/money";
import { loadPayrollRun } from "@/lib/finance/payroll";
import { monthLabel, monthStart, prettyDate, resolvePeriod, today } from "@/lib/finance/period";

import { TransactionForm } from "./transaction-form";

export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  terminal: "Terminal",
  qr: "QR",
  bank: "Bank",
  other: "Other",
};

const DESK_TINT: Record<string, string> = {
  cash: "#16794C",
  card: "#4340CB",
  terminal: "#B8791F",
  qr: "#6B44A2",
  bank: "#2F5D8C",
  other: "#6E6C87",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/**
 * Finance: the center's money on one page.
 *
 * The reference CRM this replaces put four desk totals across the top and a
 * flat transaction table underneath, and left the owner to work out the rest in
 * their head. Three changes earn their place here:
 *
 *  1. The KPI strip answers "how did the month go", not "what is in the till" —
 *     income, expenses, net, each against the same window last period. The desk
 *     balances are still there, but as a second row, because they are a fact
 *     about now rather than a measure of the month.
 *  2. Every filter is a URL. The state of this page is shareable, bookmarkable,
 *     and — the point — exportable: the Excel and PDF buttons carry the exact
 *     filters you are looking at, so the file matches the screen.
 *  3. The right-hand column carries the three questions that make the ledger
 *     actionable: where the money went, who still owes, and what payroll is
 *     about to cost.
 */
export default async function FinancePage({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") redirect("/console");

  const sp = await searchParams;
  const period = resolvePeriod({
    from: first(sp.from),
    to: first(sp.to),
    month: first(sp.month),
  });

  const direction =
    first(sp.direction) === "in" || first(sp.direction) === "out"
      ? (first(sp.direction) as "in" | "out")
      : undefined;
  const accountId = first(sp.account);
  const categoryId = first(sp.category);
  const groupId = first(sp.group);
  const q = first(sp.q);

  const [overview, expenseTotals, debtors, payroll, { groups }, people] = await Promise.all([
    loadFinanceOverview(profile, { period, direction, accountId, categoryId, groupId, q }),
    loadCategoryTotals(period, "out"),
    loadDebtors(6),
    loadPayrollRun(monthStart(period.from)),
    loadGroups(profile),
    loadFinancePeople(),
  ]);

  const { settings, accounts, categories, rows } = overview;
  const currency = settings.currency;
  const money = (m: number) => formatMoney(m, currency);
  const net = overview.periodInMinor - overview.periodOutMinor;
  const prevNet = overview.prevInMinor - overview.prevOutMinor;
  const cashOnHand = accounts.reduce((a, acc) => a + acc.balanceMinor, 0);
  const owedTotal = debtors.reduce((a, d) => a + d.owedMinor, 0);

  // Every link keeps the window and drops only what it changes, so filtering
  // never silently resets the period you were looking at.
  const query = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      from: period.from,
      to: period.to,
      direction,
      account: accountId,
      category: categoryId,
      group: groupId,
      q,
      ...patch,
    };
    for (const [key, value] of Object.entries(base)) if (value) params.set(key, value);
    return `?${params.toString()}`;
  };

  const exportHref = (format: "xlsx" | "pdf", report: string) => {
    const params = new URLSearchParams({ report, format, from: period.from, to: period.to });
    if (accountId) params.set("account", accountId);
    if (categoryId) params.set("category", categoryId);
    if (groupId) params.set("group", groupId);
    if (direction) params.set("direction", direction);
    return `/api/console/finance/export?${params.toString()}`;
  };

  const thisMonth = monthStart(today());
  const lastMonth = monthStart(
    new Date(
      new Date(`${thisMonth}T00:00:00Z`).setUTCMonth(
        new Date(`${thisMonth}T00:00:00Z`).getUTCMonth() - 1,
      ),
    )
      .toISOString()
      .slice(0, 10),
  );

  const incomeCategories = categories.filter((c) => c.direction === "in");
  const expenseCategories = categories.filter((c) => c.direction === "out");
  const accountOptions = accounts.filter((a) => a.active).map((a) => ({ id: a.id, name: a.name }));
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));

  const delta = (now: number, before: number): { text: string; tone: "good" | "bad" | "flat" } => {
    if (before === 0) return { text: now === 0 ? "—" : "new", tone: "flat" };
    const pct = Math.round(((now - before) / Math.abs(before)) * 100);
    return { text: `${pct > 0 ? "+" : ""}${pct}%`, tone: pct >= 0 ? "good" : "bad" };
  };
  const incomeDelta = delta(overview.periodInMinor, overview.prevInMinor);
  const expenseDelta = delta(overview.periodOutMinor, overview.prevOutMinor);

  return (
    <div>
      <PageHead
        eyebrow="Money"
        title="Finance"
        subtitle={`${period.label} · ${rows.length} entr${rows.length === 1 ? "y" : "ies"} · amounts in ${currency}.`}
        actions={
          <>
            <Drawer
              label="Record payment"
              variant="green"
              eyebrow="Money in"
              title="Record a payment"
              note="Tuition, a registration fee, anything that arrives at a desk."
            >
              <TransactionForm
                direction="in"
                currency={currency}
                accounts={accountOptions}
                categories={incomeCategories}
                students={people.students}
                teachers={people.teachers}
                groups={groupOptions}
                defaultCategoryId={incomeCategories.find((c) => c.slug === "tuition")?.id}
              />
            </Drawer>
            <Drawer
              label="Record expense"
              eyebrow="Money out"
              title="Record an expense"
              note="Rent, salaries, marketing — anything that leaves a desk."
            >
              <TransactionForm
                direction="out"
                currency={currency}
                accounts={accountOptions}
                categories={expenseCategories}
                students={people.students}
                teachers={people.teachers}
                groups={groupOptions}
              />
            </Drawer>
          </>
        }
      />

      {/* ── period ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <Chip
          href={query({ from: thisMonth, to: undefined, month: thisMonth })}
          active={period.label === monthLabel(thisMonth)}
        >
          {monthLabel(thisMonth)}
        </Chip>
        <Chip href={`?month=${lastMonth}`} active={period.label === monthLabel(lastMonth)}>
          {monthLabel(lastMonth)}
        </Chip>
        <form
          method="get"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
            flexWrap: "wrap",
          }}
        >
          {direction ? <input type="hidden" name="direction" value={direction} /> : null}
          {accountId ? <input type="hidden" name="account" value={accountId} /> : null}
          <input
            type="date"
            name="from"
            defaultValue={period.from}
            style={{ ...fieldStyle, padding: "7px 9px" }}
          />
          <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>to</span>
          <input
            type="date"
            name="to"
            defaultValue={period.to}
            style={{ ...fieldStyle, padding: "7px 9px" }}
          />
          <button
            type="submit"
            className="cn-btn cn-btn--ghost"
            style={{
              background: "#fff",
              border: "1px solid #E0DED8",
              borderRadius: 8,
              padding: "7px 13px",
              fontFamily: SANS,
              fontSize: 13,
              color: INK,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </form>
      </div>

      <KpiRow>
        <Kpi
          label="Income"
          value={money(overview.periodInMinor)}
          delta={incomeDelta.text}
          deltaTone={incomeDelta.tone}
          sub={`vs ${money(overview.prevInMinor)} the period before`}
          href={query({ direction: direction === "in" ? undefined : "in" })}
          active={direction === "in"}
        />
        <Kpi
          label="Expenses"
          value={money(overview.periodOutMinor)}
          delta={expenseDelta.text}
          deltaTone={expenseDelta.tone === "good" ? "bad" : "good"}
          sub={`vs ${money(overview.prevOutMinor)} the period before`}
          href={query({ direction: direction === "out" ? undefined : "out" })}
          active={direction === "out"}
        />
        <Kpi
          label="Net"
          value={money(net)}
          deltaTone={net >= 0 ? "good" : "bad"}
          sub={prevNet === net ? "flat on last period" : `${money(prevNet)} last period`}
        />
        <Kpi label="Cash on hand" value={money(cashOnHand)} sub="across every desk, right now" />
      </KpiRow>

      {/* ── desks ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {accounts
          .filter((a) => a.active)
          .map((account) => {
            const on = accountId === account.id;
            const tint = DESK_TINT[account.kind] ?? INDIGO;
            return (
              <a
                key={account.id}
                href={query({ account: on ? undefined : account.id })}
                className="cn-tile"
                style={{
                  display: "block",
                  background: "#fff",
                  border: `1px solid ${on ? tint : "#E7E5DF"}`,
                  boxShadow: on ? `0 0 0 1px ${tint}` : undefined,
                  borderRadius: 12,
                  padding: "13px 15px",
                  textDecoration: "none",
                  borderLeft: `3px solid ${tint}`,
                }}
              >
                <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginBottom: 6 }}>
                  {account.name}
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 19,
                    fontWeight: 600,
                    color: INK,
                    letterSpacing: "-.02em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {money(account.balanceMinor)}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: FAINT, marginTop: 5 }}>
                  {METHOD_LABEL[account.kind] ?? account.kind} · in{" "}
                  {formatMoneyShort(account.totalInMinor, currency)} · out{" "}
                  {formatMoneyShort(account.totalOutMinor, currency)}
                </div>
              </a>
            );
          })}
      </div>

      <div
        className="cn-split"
        style={{ display: "grid", gridTemplateColumns: "1.5fr .85fr", gap: 16 }}
      >
        {/* ── ledger ───────────────────────────────────────────────────────── */}
        <Card flush>
          <CardHead
            title="Ledger"
            divided
            note={`${money(overview.filteredInMinor)} in · ${money(overview.filteredOutMinor)} out`}
            actions={
              <>
                <a
                  href={exportHref("xlsx", "ledger")}
                  className="cn-chip"
                  style={chipStyle}
                  download
                >
                  Excel
                </a>
                <a
                  href={exportHref("pdf", "ledger")}
                  className="cn-chip"
                  style={chipStyle}
                  download
                >
                  PDF
                </a>
              </>
            }
          />

          <Toolbar>
            <Chip href={query({ direction: undefined })} active={!direction}>
              All
            </Chip>
            <Chip href={query({ direction: "in" })} active={direction === "in"}>
              Income
            </Chip>
            <Chip href={query({ direction: "out" })} active={direction === "out"}>
              Expenses
            </Chip>
            <form
              method="get"
              style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}
            >
              <input type="hidden" name="from" value={period.from} />
              <input type="hidden" name="to" value={period.to} />
              {direction ? <input type="hidden" name="direction" value={direction} /> : null}
              <select
                name="category"
                defaultValue={categoryId ?? ""}
                style={{ ...fieldStyle, padding: "7px 9px" }}
              >
                <option value="">Every category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.direction === "in" ? "↓" : "↑"} {c.name}
                  </option>
                ))}
              </select>
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search name or note"
                style={{ ...fieldStyle, padding: "7px 9px", minWidth: 170 }}
              />
              <button
                type="submit"
                className="cn-btn cn-btn--ghost"
                style={{
                  background: "#fff",
                  border: "1px solid #E0DED8",
                  borderRadius: 8,
                  padding: "7px 13px",
                  fontFamily: SANS,
                  fontSize: 13,
                  cursor: "pointer",
                  color: INK,
                }}
              >
                Filter
              </button>
            </form>
          </Toolbar>

          {rows.length === 0 ? (
            <Empty>
              Nothing recorded in this window. Change the dates, or record the first payment with
              the button above.
            </Empty>
          ) : (
            <Table cols={LEDGER_COLS} minWidth={720}>
              <THead cols={LEDGER_COLS} labels={["Date", "What", "Who", "Desk", "Amount"]} />
              {rows.map((row) => (
                <TRow key={row.id} cols={LEDGER_COLS}>
                  <TD tone="soft">{prettyDate(row.occurredOn)}</TD>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: INK }}>
                      {row.categoryName ?? "Uncategorised"}
                    </div>
                    {row.note ? (
                      <div
                        style={{
                          fontSize: 11.5,
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
                      <div style={{ fontSize: 11.5, color: FAINT }}>{row.groupName}</div>
                    ) : null}
                  </div>
                  <TD tone="faint">
                    {row.accountName}
                    <div style={{ fontSize: 11 }}>{METHOD_LABEL[row.method] ?? row.method}</div>
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
                </TRow>
              ))}
            </Table>
          )}

          {overview.truncated ? (
            <div style={{ padding: "12px 18px", fontFamily: SANS, fontSize: 12, color: FAINT }}>
              Showing the most recent 200 entries. Narrow the window, or export to see everything.
            </div>
          ) : null}
        </Card>

        {/* ── the three questions ──────────────────────────────────────────── */}
        <Stack>
          <Card>
            <CardHead
              title="Where it went"
              note={period.label}
              actions={<TextLink href={exportHref("pdf", "expenses")}>PDF</TextLink>}
            />
            {expenseTotals.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, margin: 0 }}>
                No expenses recorded in this window.
              </p>
            ) : (
              <div>
                {expenseTotals.slice(0, 6).map((cat) => (
                  <div key={cat.categoryId ?? cat.name} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        fontFamily: SANS,
                        fontSize: 12.5,
                        marginBottom: 5,
                      }}
                    >
                      <a
                        href={query({ category: cat.categoryId ?? undefined, direction: "out" })}
                        className="cn-link"
                        style={{ color: INK, textDecoration: "none" }}
                      >
                        {cat.name}
                      </a>
                      <span style={{ color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                        {money(cat.amountMinor)}
                      </span>
                    </div>
                    <Bar pct={cat.share} fill={cat.share > 40 ? AMBER : INDIGO} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card flush>
            <CardHead
              title="Owed by students"
              divided
              note={owedTotal > 0 ? money(owedTotal) : "nothing outstanding"}
              actions={<TextLink href="/console/finance/invoices">Invoices →</TextLink>}
            />
            {debtors.length === 0 ? (
              <Empty>
                Everyone is square. Raise this month&apos;s invoices to keep it that way.
              </Empty>
            ) : (
              debtors.map((debtor) => (
                <div
                  key={debtor.studentId}
                  className="cn-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 18px",
                    borderBottom: "1px solid #F5F4F0",
                    fontFamily: SANS,
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      color: INK,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {debtor.studentName}
                  </span>
                  <span style={{ color: RED, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {money(debtor.owedMinor)}
                  </span>
                </div>
              ))
            )}
          </Card>

          <Card>
            <CardHead
              title="Payroll"
              note={monthLabel(monthStart(period.from))}
              actions={<TextLink href="/console/finance/payroll">Open →</TextLink>}
            />
            {payroll ? (
              <>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 24,
                    fontWeight: 600,
                    color: INK,
                    letterSpacing: "-.02em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {money(payroll.netMinor)}
                </div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 12.5,
                    color: SOFT,
                    margin: "6px 0 0",
                    lineHeight: 1.5,
                  }}
                >
                  {payroll.items.length} teacher{payroll.items.length === 1 ? "" : "s"} · run is{" "}
                  <strong style={{ color: payroll.status === "draft" ? AMBER : GREEN }}>
                    {payroll.status}
                  </strong>
                  . Still to pay{" "}
                  {money(payroll.items.reduce((a, i) => a + (i.netMinor - i.paidMinor), 0))}.
                </p>
              </>
            ) : (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: SOFT,
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                No run for this month yet. Payroll reads the rosters, the registers and the payments
                you have already recorded — nothing to type in twice.
              </p>
            )}
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <BtnLink href="/console/finance/payroll" variant="ghost">
                Run payroll
              </BtnLink>
              <BtnLink href="/console/finance/rules" variant="ghost">
                Salary rules
              </BtnLink>
            </div>
          </Card>
        </Stack>
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
        Exports carry whatever is on screen — the window, the direction, the category — so the file
        and the page always agree. Excel keeps raw numbers you can pivot; PDF is the printable
        version.
      </p>
    </div>
  );
}

const LEDGER_COLS = "96px 1.5fr 1.3fr 110px 130px";

const chipStyle: React.CSSProperties = {
  background: "#F4F3EF",
  border: "1px solid #E4E2DC",
  borderRadius: 7,
  padding: "5px 11px",
  fontFamily: SANS,
  fontSize: 12,
  color: INK,
  textDecoration: "none",
};
