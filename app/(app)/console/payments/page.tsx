import { redirect } from "next/navigation";

import { Card, Empty, FAINT, INK, MUTED, SANS, Table, TD, THead, TRow } from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { PageHead } from "@/components/console/page-ui";
import { canManagePeople, requireOrgUser, roleHome } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { loadFinancePeople, loadFinanceSettings } from "@/lib/finance/load";
import { formatMoney } from "@/lib/finance/money";
import { monthStart, today } from "@/lib/finance/period";
import { createClient } from "@/lib/supabase/server";

import { TransactionForm } from "../finance/transaction-form";

export const dynamic = "force-dynamic";

const COLS = "88px 1.4fr 1.2fr 100px 140px";

/** Same wording the owner's Finance page uses, so one payment reads the same
 *  however you reached it. */
const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  terminal: "Terminal",
  qr: "QR",
  bank: "Bank",
  other: "Other",
};

/**
 * The front desk: take tuition, and see what has been taken.
 *
 * A SEPARATE PAGE, not /console/finance with parts hidden. An administrator may
 * not know what the center is worth or what staff are paid, and a redacted copy
 * of the owner's page is the wrong tool for that job twice over: it still shows
 * its own shape (desk cards with balances, expense buttons, a P&L strip), and
 * one mistaken condition leaks a number that cannot be un-seen. This page has no
 * balance on it at all, so there is nothing to leak.
 *
 * The owner keeps the full Finance page and is redirected there — they have no
 * use for a smaller version of something they already have.
 */
export default async function PaymentsPage() {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role)) redirect(roleHome(profile.role));
  if (profile.role === "center_admin") redirect("/console/finance");

  const supabase = await createClient();
  const from = monthStart(today());

  const [settings, people, { groups }, desksRes, categoriesRes, paymentsRes] = await Promise.all([
    loadFinanceSettings(),
    loadFinancePeople(),
    // Arrears get paid after a course ends; refusing to record that is worse
    // than offering a finished group in the picker.
    loadGroups(profile, { include: "all" }),
    supabase.from("finance_accounts").select("id, name").eq("active", true).order("name"),
    supabase.from("finance_categories").select("id, name, slug").eq("direction", "in").order("name"),
    // RLS narrows this to direction='in' for an administrator (migration
    // 20260813140000), so there is no `.eq("direction", …)` here pretending to
    // be the gate. The filter that matters is in the database.
    supabase
      .from("finance_transactions")
      .select("id, amount_minor, method, occurred_on, student_id, group_id, note")
      .gte("occurred_on", from)
      .order("occurred_on", { ascending: false })
      .limit(100),
  ]);

  const currency = settings.currency;
  const desks = (desksRes.data ?? []).map((d) => ({ id: d.id as string, name: d.name as string }));
  const categories = (categoriesRes.data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
  }));
  const payments = paymentsRes.data ?? [];

  const studentName = new Map(people.students.map((s) => [s.id, s.name]));
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const takenThisMonth = payments.reduce((sum, p) => sum + Number(p.amount_minor ?? 0), 0);

  return (
    <div>
      <PageHead
        eyebrow="Front desk"
        title="Take payment"
        subtitle="Tuition and fees arriving at the counter. This month so far."
      />

      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED }}>
              Taken this month · {payments.length} payment{payments.length === 1 ? "" : "s"}
            </div>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 26,
                fontWeight: 700,
                color: INK,
                letterSpacing: "-.02em",
                fontVariantNumeric: "tabular-nums",
                marginTop: 2,
              }}
            >
              {formatMoney(takenThisMonth, currency)}
            </div>
          </div>

          {desks.length > 0 ? (
            <Drawer
              label="+ Take a payment"
              eyebrow="Money in"
              title="Take a payment"
              note="Tuition, a registration fee — anything a student is paying today."
              triggerStyle={{
                background: "#1B8A5A",
                border: 0,
                color: "#fff",
                padding: "10px 16px",
                fontSize: 13.5,
                fontWeight: 600,
                borderRadius: 8,
              }}
            >
              <TransactionForm
                direction="in"
                currency={currency}
                accounts={desks}
                categories={categories}
                students={people.students}
                teachers={[]}
                groups={groups.map((g) => ({ id: g.id, name: g.name }))}
                defaultAccountId={desks[0]?.id}
                defaultCategoryId={categories.find((c) => c.slug === "tuition")?.id}
              />
            </Drawer>
          ) : (
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT }}>
              No cash desk is open — ask the owner to open one before taking money.
            </span>
          )}
        </div>
      </Card>

      <Card>
        {payments.length === 0 ? (
          <Empty>Nothing taken yet this month.</Empty>
        ) : (
          <Table cols={COLS}>
            <THead cols={COLS} labels={["Date", "Student", "Group", "Method", "Amount"]} />
            <tbody>
              {payments.map((p) => (
                <TRow key={p.id as string} cols={COLS}>
                  <TD tone="soft">
                    {new Date(p.occurred_on as string).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </TD>
                  <TD weight={500}>{studentName.get(p.student_id as string) ?? "—"}</TD>
                  <TD tone="soft">{groupName.get(p.group_id as string) ?? "—"}</TD>
                  <TD tone="soft">{METHOD_LABEL[String(p.method ?? "cash")] ?? "Cash"}</TD>
                  <TD align="right" weight={600}>
                    {formatMoney(Number(p.amount_minor ?? 0), currency)}
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
