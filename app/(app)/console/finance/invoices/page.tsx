import { redirect } from "next/navigation";

import {
  AMBER,
  Card,
  Chip,
  Empty,
  FAINT,
  GREEN,
  INK,
  Kpi,
  KpiRow,
  PageHead,
  PersonCell,
  RED,
  SANS,
  SOFT,
  Table,
  TD,
  Tag,
  THead,
  Toolbar,
  TRow,
} from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { loadFinanceSettings, loadInvoices } from "@/lib/finance/load";
import { formatMoney, toMajor } from "@/lib/finance/money";
import { monthLabel, monthStart, prettyDate, recentMonths, today } from "@/lib/finance/period";
import { createClient } from "@/lib/supabase/server";

import { TransactionForm } from "../transaction-form";
import { GenerateInvoicesForm, GroupFeeForm } from "./invoice-forms";
import { DownloadLink } from "@/components/console/file-links";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Invoices: what each student was charged this month, and who has paid.
 *
 * The reference CRM tracks only receipts, which answers "what came in" and not
 * "what should have". Charging the group explicitly is what turns a till into a
 * ledger: it gives the front desk a chase list, it gives payroll an `invoiced`
 * basis to pay a share of, and it makes a part payment visible as a part
 * payment rather than as an absence.
 *
 * Settling one is one click from the row — the payment lands with the student,
 * the group and the invoice already attached, which is exactly the tagging the
 * salary engine needs and the exactly the tagging nobody does by hand.
 */
export default async function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") redirect("/console");

  const sp = await searchParams;
  const month = monthStart(first(sp.month) ?? today());
  const groupId = first(sp.group);
  const status = first(sp.status);

  const supabase = await createClient();
  const [settings, invoices, { groups }, accountsRes, categoriesRes, feesRes] = await Promise.all([
    loadFinanceSettings(),
    loadInvoices({ periodMonth: month, groupId }),
    // Money outlives the course: a closed group's March invoice is still owed.
    loadGroups(profile, { include: "all" }),
    supabase.from("finance_accounts").select("id, name").eq("active", true).order("sort"),
    supabase.from("finance_categories").select("id, name, slug").eq("direction", "in"),
    supabase.from("groups").select("id, monthly_fee_minor, teacher_rate_minor"),
  ]);

  const currency = settings.currency;
  const money = (m: number) => formatMoney(m, currency);

  // Both prices of a group, so the pricing drawer can show what is already set
  // on each side rather than only the student's half.
  const priceOf = new Map(
    ((feesRes.data ?? []) as Record<string, unknown>[]).map((g) => [
      g.id as string,
      {
        fee: g.monthly_fee_minor == null ? null : Number(g.monthly_fee_minor),
        rate: g.teacher_rate_minor == null ? null : Number(g.teacher_rate_minor),
      },
    ]),
  );

  const shown = status ? invoices.filter((i) => i.status === status) : invoices;

  const totals = invoices.reduce(
    (a, i) => ({
      due: a.due + i.dueMinor,
      paid: a.paid + i.paidMinor,
      balance: a.balance + Math.max(0, i.balanceMinor),
      unpaid: a.unpaid + (i.balanceMinor > 0 ? 1 : 0),
      overdue: a.overdue + (i.status === "overdue" ? 1 : 0),
    }),
    { due: 0, paid: 0, balance: 0, unpaid: 0, overdue: 0 },
  );
  const collectedPct = totals.due > 0 ? Math.round((100 * totals.paid) / totals.due) : 0;

  const months = recentMonths(12).map((m) => ({ value: m, label: monthLabel(m) }));
  const accounts = ((accountsRes.data ?? []) as Record<string, unknown>[]).map((a) => ({
    id: a.id as string,
    name: a.name as string,
  }));
  const categories = ((categoriesRes.data ?? []) as Record<string, unknown>[]).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: (c.slug as string | null) ?? null,
  }));
  const tuitionCategory = categories.find((c) => c.slug === "tuition")?.id;

  const groupsForForms = groups.map((g) => {
    const price = priceOf.get(g.id);
    const fee = price?.fee ?? null;
    const rate = price?.rate ?? null;
    return {
      id: g.id,
      name: g.name,
      students: g.memberCount,
      feeLabel: fee == null ? "no fee set" : `${money(fee)}/month`,
      feeMajor: fee == null ? "" : money(fee),
      rateMajor: rate == null ? "" : money(rate),
    };
  });

  const query = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = { month, group: groupId, status, ...patch };
    for (const [key, value] of Object.entries(base)) if (value) params.set(key, value);
    return `?${params.toString()}`;
  };

  return (
    <div>
      <PageHead
        back={{ href: "/console/finance", label: "Finance" }}
        title="Invoices"
        subtitle={`${monthLabel(month)} · ${invoices.length} charge${invoices.length === 1 ? "" : "s"} · ${collectedPct}% collected.`}
        actions={
          <>
            <Drawer
              label="Raise invoices"
              eyebrow="Tuition"
              title="Charge a group"
              note="One invoice per student on the roster, for the month you pick."
            >
              <GenerateInvoicesForm groups={groupsForForms} months={months} currency={currency} />
            </Drawer>
            <Drawer
              label="Group fees"
              variant="ghost"
              eyebrow="Tuition"
              title="Set a monthly fee"
              note="The price of a seat, remembered so invoicing is one click."
            >
              <GroupFeeForm groups={groupsForForms} currency={currency} />
            </Drawer>
            <DownloadLink
              href={`/api/console/finance/export?report=debtors&format=xlsx&month=${month}`}
              format="xlsx"
              label="Debtors"
              title="Who still owes, as a spreadsheet"
            />
          </>
        }
      />

      <KpiRow>
        <Kpi label="Charged" value={money(totals.due)} sub={monthLabel(month)} />
        <Kpi
          label="Collected"
          value={money(totals.paid)}
          delta={`${collectedPct}%`}
          deltaTone={collectedPct >= 80 ? "good" : "bad"}
        />
        <Kpi
          label="Outstanding"
          value={money(totals.balance)}
          deltaTone="bad"
          sub={`${totals.unpaid} invoice${totals.unpaid === 1 ? "" : "s"} unpaid`}
        />
        <Kpi
          label="Overdue"
          value={totals.overdue}
          deltaTone={totals.overdue > 0 ? "bad" : "good"}
          sub={`due by day ${settings.invoiceDueDay}`}
          href={query({ status: status === "overdue" ? undefined : "overdue" })}
          active={status === "overdue"}
        />
      </KpiRow>

      <Card flush>
        <Toolbar>
          <form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              name="month"
              defaultValue={month}
              style={{
                border: "1px solid #CFCABC",
                borderRadius: 8,
                padding: "7px 9px",
                fontFamily: SANS,
                fontSize: 13,
                background: "#FAFAF8",
                color: INK,
              }}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              name="group"
              defaultValue={groupId ?? ""}
              style={{
                border: "1px solid #CFCABC",
                borderRadius: 8,
                padding: "7px 9px",
                fontFamily: SANS,
                fontSize: 13,
                background: "#FAFAF8",
                color: INK,
              }}
            >
              <option value="">Every group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="cn-btn cn-btn--ghost"
              style={{
                background: "#fff",
                border: "1px solid #C5C4BE",
                borderRadius: 8,
                padding: "7px 13px",
                fontFamily: SANS,
                fontSize: 13,
                cursor: "pointer",
                color: INK,
              }}
            >
              Show
            </button>
          </form>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
            <Chip href={query({ status: undefined })} active={!status}>
              All
            </Chip>
            <Chip href={query({ status: "open" })} active={status === "open"}>
              Unpaid
            </Chip>
            <Chip href={query({ status: "part" })} active={status === "part"}>
              Part paid
            </Chip>
            <Chip href={query({ status: "paid" })} active={status === "paid"}>
              Settled
            </Chip>
          </div>
        </Toolbar>

        {shown.length === 0 ? (
          <Empty>
            Nothing charged for {monthLabel(month)}
            {groupId ? " in this group" : ""} yet. &ldquo;Raise invoices&rdquo; charges a whole
            group in one go.
          </Empty>
        ) : (
          <Table cols={COLS} gridded>
            <THead
              cols={COLS}
              labels={["Student", "Group", "Due", "Paid", "Balance", "Status", ""]}
            />
            {shown.map((invoice) => (
              <TRow key={invoice.id} cols={COLS}>
                <PersonCell
                  name={invoice.studentName}
                  meta={invoice.dueOn ? `due ${prettyDate(invoice.dueOn)}` : undefined}
                />
                <TD tone="soft">{invoice.groupName}</TD>
                <TD align="right">{money(invoice.dueMinor)}</TD>
                <TD align="right" tone="soft">
                  {money(invoice.paidMinor)}
                </TD>
                <div
                  style={{
                    textAlign: "right",
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: invoice.balanceMinor > 0 ? RED : GREEN,
                  }}
                >
                  {invoice.balanceMinor > 0 ? money(invoice.balanceMinor) : "—"}
                </div>
                <div>
                  <Tag
                    tone={
                      invoice.status === "paid"
                        ? "green"
                        : invoice.status === "overdue"
                          ? "red"
                          : invoice.status === "part"
                            ? "amber"
                            : "neutral"
                    }
                  >
                    {invoice.status === "part" ? "part paid" : invoice.status}
                  </Tag>
                </div>
                <div style={{ textAlign: "right" }}>
                  {invoice.balanceMinor > 0 ? (
                    <Drawer
                      label="Take payment"
                      variant="ghost"
                      eyebrow="Money in"
                      title={invoice.studentName}
                      note={`${invoice.groupName} · ${monthLabel(invoice.periodMonth)} · ${money(invoice.balanceMinor)} outstanding.`}
                    >
                      <TransactionForm
                        direction="in"
                        currency={currency}
                        accounts={accounts}
                        categories={categories}
                        students={[{ id: invoice.studentId, name: invoice.studentName }]}
                        teachers={[]}
                        groups={[{ id: invoice.groupId, name: invoice.groupName }]}
                        defaultCategoryId={tuitionCategory}
                        presetInvoiceId={invoice.id}
                        presetStudentId={invoice.studentId}
                        presetGroupId={invoice.groupId}
                        presetAmount={String(toMajor(invoice.balanceMinor, currency))}
                      />
                    </Drawer>
                  ) : (
                    <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>settled</span>
                  )}
                </div>
              </TRow>
            ))}
          </Table>
        )}
      </Card>

      <p
        style={{ fontFamily: SANS, fontSize: 12, color: SOFT, margin: "14px 0 0", lineHeight: 1.6 }}
      >
        A payment taken from this page is tagged with the student, the group and the invoice — which
        is what lets the same som appear correctly in the group&apos;s collections, the
        student&apos;s balance, and the teacher&apos;s share.{" "}
        <span style={{ color: AMBER }}>Voiding</span> an invoice removes the charge without touching
        any payment already received against it.
      </p>
    </div>
  );
}

const COLS = "1.6fr 1.1fr 110px 110px 120px 100px 120px";
