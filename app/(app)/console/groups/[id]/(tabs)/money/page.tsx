import { notFound, redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { loadGroupDetail } from "@/lib/console/groups";
import { ENROLLED } from "@/lib/console/status";
import { loadClassMoney } from "@/lib/finance/class-money";
import { formatMoney, toMajor } from "@/lib/finance/money";
import { monthLabel, monthStart, prettyDate, today } from "@/lib/finance/period";
import { describeProration } from "@/lib/finance/tuition";

import { PricingPanel } from "./_components/pricing-panel";
import {
  Card,
  CardHead,
  CardNote,
  Empty,
  FAINT,
  GREEN,
  Kpi,
  KpiRow,
  PersonCell,
  RED,
  Stack,
  TD,
  THead,
  TRow,
  Table,
  TextLink,
} from "@/app/(app)/console/_components/crm-ui";

export const dynamic = "force-dynamic";

const MONEY_COLS = "2fr 1.4fr 1.1fr 1.1fr 1.1fr";

/**
 * What the class is worth this month: the price, and who has paid it.
 *
 * ⚠️ OWNER ONLY, AND THE 404 IS THE POINT. A teacher must not read what the
 * center charges. The tab is hidden from their strip, RLS on `finance_settings`
 * would refuse the read anyway, and this checks a third time — because a hidden
 * tab is a hint, not a gate, and the URL is guessable.
 */
export default async function GroupMoneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");
  if (profile.role !== "center_admin") notFound();

  const { id } = await params;
  const group = await loadGroupDetail(id);
  if (!group) notFound();

  const roster = group.members.filter((m) => ENROLLED.includes(m.status));
  const thisMonth = monthStart(today());
  const moneyData = await loadClassMoney(group.id, thisMonth);
  if (!moneyData) notFound();

  return (
    <Stack>
      <Card>
        <CardHead title={`What this group costs — ${monthLabel(thisMonth)}`} />
        <CardNote>
          {moneyData.lessonsThisMonth > 0
            ? `${moneyData.lessonsThisMonth} lessons this month, from the timetable. A student who joined part-way through pays for the ones that were left, and the teacher is paid for the same ones.`
            : `This group isn't on the timetable yet, so a month is assumed to be ${moneyData.fallbackLessons} lessons. Book it into a room and the real count is used instead.`}
        </CardNote>
        <PricingPanel
          groupId={group.id}
          currency={moneyData.currency}
          lessonsThisMonth={
            moneyData.lessonsThisMonth > 0 ? moneyData.lessonsThisMonth : moneyData.fallbackLessons
          }
          feeMajor={
            moneyData.monthlyFeeMinor == null
              ? ""
              : String(toMajor(moneyData.monthlyFeeMinor, moneyData.currency))
          }
          rateMajor={
            moneyData.teacherRateMinor == null
              ? ""
              : String(toMajor(moneyData.teacherRateMinor, moneyData.currency))
          }
        />
      </Card>

      <KpiRow>
        <Kpi
          label="Tuition this month"
          value={formatMoney(moneyData.expectedMinor, moneyData.currency)}
          sub={`${roster.length} student${roster.length === 1 ? "" : "s"} at the current price`}
        />
        <Kpi
          label="Invoiced"
          value={formatMoney(moneyData.invoicedMinor, moneyData.currency)}
          sub={
            moneyData.invoicedMinor === 0
              ? "nothing raised yet"
              : `${formatMoney(moneyData.paidMinor, moneyData.currency)} collected`
          }
        />
        <Kpi
          label="Teacher earns"
          value={formatMoney(moneyData.teacherTotalMinor, moneyData.currency)}
          sub={
            moneyData.teacherRateMinor == null
              ? "no rate set on this group"
              : `${moneyData.studentsProrated} student${moneyData.studentsProrated === 1 ? "" : "s"} once part-months are counted`
          }
        />
        <Kpi
          label="Center keeps"
          value={formatMoney(
            moneyData.expectedMinor - moneyData.teacherTotalMinor,
            moneyData.currency,
          )}
          sub="before rent, tax and everything else"
          deltaTone={moneyData.expectedMinor - moneyData.teacherTotalMinor >= 0 ? "good" : "bad"}
        />
      </KpiRow>

      <Card flush>
        <Table cols={MONEY_COLS}>
          <THead
            cols={MONEY_COLS}
            labels={["Student", "This month", "Invoiced", "Paid", "Teacher earns"]}
          />
          {roster.map((m) => {
            const row = moneyData.rows.get(m.id);
            const tuition = row?.tuition ?? null;
            const explain = tuition ? describeProration(tuition, prettyDate) : null;
            const outstanding = (row?.invoicedMinor ?? 0) - (row?.paidMinor ?? 0);
            return (
              <TRow key={m.id} cols={MONEY_COLS}>
                <PersonCell
                  name={m.name}
                  photoUrl={m.photoUrl}
                  meta={`joined ${new Date(m.joinedAt).toLocaleDateString()}`}
                />
                <TD>
                  {tuition ? (
                    <span>
                      <span style={{ fontWeight: 600 }}>
                        {formatMoney(tuition.amountMinor, moneyData.currency)}
                      </span>
                      {explain ? (
                        <span style={{ display: "block", fontSize: 11.5, color: FAINT }}>
                          {explain}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span style={{ color: FAINT }}>no fee set</span>
                  )}
                </TD>
                <TD tone="soft">
                  {row?.invoicedMinor == null
                    ? "—"
                    : formatMoney(row.invoicedMinor, moneyData.currency)}
                </TD>
                <TD>
                  {row?.invoicedMinor == null ? (
                    <span style={{ color: FAINT }}>—</span>
                  ) : (
                    <span style={{ color: outstanding > 0 ? RED : GREEN, fontWeight: 600 }}>
                      {formatMoney(row.paidMinor, moneyData.currency)}
                    </span>
                  )}
                </TD>
                <TD tone="soft">
                  {row?.teacherPay
                    ? formatMoney(row.teacherPay.amountMinor, moneyData.currency)
                    : "—"}
                </TD>
              </TRow>
            );
          })}
          {roster.length === 0 ? (
            <Empty action={{ href: `/console/groups/${group.id}`, label: "Add students →" }}>
              Nobody is enrolled, so there is nothing to charge.
            </Empty>
          ) : null}
        </Table>
      </Card>

      <CardNote>
        Invoiced is what was actually raised, which may be at an older price — changing the fee
        above never rewrites an invoice that has already gone out. Raise this month&apos;s invoices
        from <TextLink href="/console/finance/invoices">Invoices</TextLink>.
      </CardNote>
    </Stack>
  );
}
