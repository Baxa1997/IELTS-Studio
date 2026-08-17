import {
  AMBER,
  Card,
  CardHead,
  Empty,
  FAINT,
  GREEN,
  HAIR,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  PageHead,
  PersonCell,
  RED,
  SANS,
  SOFT,
  Stack,
  Table,
  TD,
  Tag,
  TextLink,
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadFinanceSettings } from "@/lib/finance/load";
import { formatMoney, toMajor } from "@/lib/finance/money";
import { loadPayrollHistory, loadPayrollRun, type PayrollItemRow } from "@/lib/finance/payroll";
import { monthLabel, monthStart, recentMonths, today } from "@/lib/finance/period";
import { basisSuffix, type PayrollLine } from "@/lib/finance/salary";
import { createClient } from "@/lib/supabase/server";

import { MonthPicker } from "./month-picker";
import { MonthsExport } from "./months-export";
import {
  AdjustPayslipForm,
  PayrollStatusForm,
  PayTeacherForm,
  RunPayrollForm,
} from "./payroll-forms";
import { DownloadLink } from "@/components/console/file-links";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Salary: what each teacher earned, and the arithmetic that says so.
 *
 * The design decision that matters is on the page rather than under it. Every
 * payslip opens to its own working — "40% of 6 000 000 collected in IELTS
 * Evening", "12 lessons × 80 000" — because a salary a teacher cannot check is
 * a salary they will ask about every month, and the owner will be the one
 * re-deriving it in a notebook.
 *
 * A teacher who lands here sees exactly one payslip: their own. RLS enforces
 * that (migration 20260810120000); the page just stops pretending the rest of
 * the screen is for them.
 */
export default async function PayrollPage({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireOrgUser();
  const isOwner = profile.role === "center_admin";

  const sp = await searchParams;
  const month = monthStart(first(sp.month) ?? today());

  const supabase = await createClient();
  const [settings, run, history, accountsRes] = await Promise.all([
    loadFinanceSettings(),
    loadPayrollRun(month),
    loadPayrollHistory(),
    isOwner
      ? supabase.from("finance_accounts").select("id, name").eq("active", true).order("sort")
      : Promise.resolve({ data: null }),
  ]);

  const currency = settings.currency;
  const money = (m: number) => formatMoney(m, currency);
  const accounts = ((accountsRes.data ?? []) as Record<string, unknown>[]).map((a) => ({
    id: a.id as string,
    name: a.name as string,
  }));

  const items = run?.items ?? [];
  const gross = items.reduce((a, i) => a + i.grossMinor, 0);
  const adjustments = items.reduce((a, i) => a + i.adjustmentMinor, 0);
  const net = items.reduce((a, i) => a + i.netMinor, 0);
  const paid = items.reduce((a, i) => a + i.paidMinor, 0);
  const months = recentMonths(12);

  if (!isOwner) {
    const mine = items.find((i) => i.teacherId === profile.id);
    return (
      <div>
        <PageHead
          eyebrow="Money"
          title="My pay"
          subtitle={`${monthLabel(month)} · the working behind the number, not just the number.`}
        />
        <MonthPicker
          active={month}
          basePath="/console/finance/payroll"
          history={history}
          thisMonth={monthStart(today())}
        />
        {mine ? (
          <Card>
            <CardHead
              title={money(mine.netMinor)}
              note={mine.ruleName ? `Pay rule: ${mine.ruleName}` : undefined}
              badge={<Tag tone={run?.status === "paid" ? "green" : "amber"}>{run?.status}</Tag>}
            />
            <Payslip lines={mine.breakdown} money={money} />
            {mine.adjustmentMinor !== 0 ? <AdjustmentLine item={mine} money={money} /> : null}
            <p
              style={{
                fontFamily: SANS,
                fontSize: 12,
                color: FAINT,
                margin: "14px 0 0",
                lineHeight: 1.6,
              }}
            >
              Paid so far {money(mine.paidMinor)} · outstanding{" "}
              {money(mine.netMinor - mine.paidMinor)}. Something look wrong? The figures come from
              the group rosters, the registers you marked and the payments recorded against your
              groups.
            </p>
          </Card>
        ) : (
          <Card>
            <Empty>
              Nothing computed for {monthLabel(month)} yet. Your center runs salary at the end of
              the month.
            </Empty>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHead
        // back={{ href: "/console/finance", label: "Finance" }}
        title="Salary"
        subtitle={
          run
            ? `${monthLabel(month)} · ${items.length} teacher${items.length === 1 ? "" : "s"} · computed from rosters, registers and payments.`
            : `${monthLabel(month)} · nothing computed yet.`
        }
        actions={
          <>
            <RunPayrollForm
              periodMonth={month}
              label={monthLabel(month)}
              recompute={run?.status === "draft"}
            />
            {run ? <PayrollStatusForm runId={run.id} status={run.status} /> : null}
            {run ? (
              <>
                <DownloadLink
                  href={`/api/console/finance/export?report=payroll&format=xlsx&month=${month}`}
                  format="xlsx"
                  title={`${monthLabel(month)} payslips, as a spreadsheet`}
                />
                <DownloadLink
                  href={`/api/console/finance/export?report=payroll&format=pdf&month=${month}`}
                  format="pdf"
                  title={`${monthLabel(month)} payslips, as a PDF`}
                />
              </>
            ) : null}
          </>
        }
      />

      <MonthPicker
        active={month}
        basePath="/console/finance/payroll"
        history={history}
        thisMonth={monthStart(today())}
      />

      <Card>
        <CardHead
          title="Several months at once"
          note="The teachers-by-months sheet, with what is still owed on each."
        />
        <MonthsExport
          months={months.map((m) => ({ value: m, label: monthLabel(m) }))}
          saved={history.map((h) => h.periodMonth)}
        />
      </Card>

      <KpiRow>
        <Kpi label="Gross" value={money(gross)} sub="before your corrections" />
        <Kpi
          label="Adjustments"
          value={adjustments === 0 ? "—" : money(adjustments)}
          deltaTone={adjustments >= 0 ? "good" : "bad"}
          sub="your manual corrections"
        />
        <Kpi label="Net" value={money(net)} sub={run ? `run is ${run.status}` : "not computed"} />
        <Kpi
          label="Still to pay"
          value={money(net - paid)}
          deltaTone={net - paid > 0 ? "bad" : "good"}
          sub={`${money(paid)} already paid out`}
        />
      </KpiRow>

      {!run ? (
        <Card>
          <CardHead title={`No run for ${monthLabel(month)}`} />
          <p
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: SOFT,
              margin: 0,
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            Salary reads what the center already recorded — who is on each roster, when they joined,
            and how many lessons the group holds this month — and pays each teacher the rate written
            on their groups. Nothing here needs to be typed in twice, and a draft can be recomputed
            as often as you like.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: SOFT,
              margin: "12px 0 0",
              lineHeight: 1.6,
            }}
          >
            The rate lives on the group, beside what the student pays — set it under a group&apos;s
            Money tab, or from <TextLink href="/console/finance/invoices">Invoices</TextLink>. A
            student who joined part-way through the month is paid for the lessons they were here
            for.
          </p>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <Empty action={{ href: "/console/groups", label: "Assign teachers →" }}>
            The run produced no payslips — no group has a teacher assigned.
          </Empty>
        </Card>
      ) : (
        <Stack>
          <Card flush>
            <CardHead
              title="Payslips"
              divided
              note={`computed ${new Date(run.computedAt).toLocaleDateString("en-GB")}`}
              badge={
                <Tag
                  tone={
                    run.status === "draft" ? "amber" : run.status === "paid" ? "green" : "indigo"
                  }
                >
                  {run.status}
                </Tag>
              }
            />
            <Table cols={COLS} gridded>
              <THead
                cols={COLS}
                labels={["Teacher", "Rule", "Gross", "Adjust", "Net", "Paid", "Owed", ""]}
              />
              {items.map((item) => (
                <TRow key={item.id} cols={COLS}>
                  <PersonCell
                    name={item.teacherName}
                    meta={`${new Set(item.breakdown.map((l) => l.groupId).filter(Boolean)).size || "no"} group${
                      new Set(item.breakdown.map((l) => l.groupId).filter(Boolean)).size === 1
                        ? ""
                        : "es"
                    }`}
                  />
                  <TD tone="soft">{item.ruleName ?? "—"}</TD>
                  <TD align="right">{money(item.grossMinor)}</TD>
                  <TD align="right" tone={item.adjustmentMinor === 0 ? "faint" : "ink"}>
                    {item.adjustmentMinor === 0 ? "—" : money(item.adjustmentMinor)}
                  </TD>
                  <TD align="right" weight={600}>
                    {money(item.netMinor)}
                  </TD>
                  <TD align="right" tone="soft">
                    {money(item.paidMinor)}
                  </TD>
                  <div
                    style={{
                      textAlign: "right",
                      fontFamily: SANS,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      color: item.netMinor - item.paidMinor > 0 ? RED : GREEN,
                    }}
                  >
                    {item.netMinor - item.paidMinor > 0
                      ? money(item.netMinor - item.paidMinor)
                      : "settled"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    {run.status === "draft" ? (
                      <Drawer
                        label="Adjust"
                        variant="ghost"
                        eyebrow="Salary"
                        title={item.teacherName}
                        note="A correction the rule cannot know about."
                      >
                        <AdjustPayslipForm
                          itemId={item.id}
                          currency={currency}
                          currentMajor={
                            item.adjustmentMinor === 0
                              ? ""
                              : String(toMajor(item.adjustmentMinor, currency))
                          }
                          currentNote={item.adjustmentNote ?? ""}
                        />
                      </Drawer>
                    ) : null}
                    {item.netMinor - item.paidMinor > 0 && run.status !== "draft" ? (
                      <Drawer
                        label="Pay"
                        variant="green"
                        eyebrow="Money out"
                        title={`Pay ${item.teacherName}`}
                        note={`${money(item.netMinor - item.paidMinor)} outstanding for ${monthLabel(month)}.`}
                      >
                        <PayTeacherForm
                          itemId={item.id}
                          teacherName={item.teacherName}
                          currency={currency}
                          outstandingMajor={String(
                            toMajor(item.netMinor - item.paidMinor, currency),
                          )}
                          accounts={accounts}
                        />
                      </Drawer>
                    ) : null}
                  </div>
                </TRow>
              ))}
            </Table>
            {run.status === "draft" ? (
              <div style={{ padding: "12px 18px", fontFamily: SANS, fontSize: 12, color: FAINT }}>
                A draft can be recomputed as often as you like. Approving freezes the numbers — pay
                buttons appear then, so nobody is paid against a figure that is still moving.
              </div>
            ) : null}
          </Card>
        </Stack>
      )}
    </div>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

const COLS = "1.5fr 1.2fr 110px 100px 110px 100px 110px 150px";

/** One payslip's lines: what was measured, at what rate, for how much. */
function Payslip({ lines, money }: { lines: PayrollLine[]; money: (m: number) => string }) {
  if (lines.length === 0) {
    return (
      <p style={{ fontFamily: SANS, fontSize: 12.5, color: AMBER, margin: 0, lineHeight: 1.55 }}>
        No rule produced a line for this teacher — check that a pay rule covers them, then
        recompute.
      </p>
    );
  }

  return (
    <div style={{ border: "1px solid #D4D3CE", borderRadius: 10, overflow: "hidden" }}>
      {lines.map((line, i) => {
        const measured =
          line.basisUnit === "money"
            ? money(line.basisValue)
            : line.basisUnit === "none"
              ? "—"
              : basisSuffix(line.basisUnit, line.basisValue);
        const rate =
          line.ratePercent != null
            ? `${line.ratePercent}%`
            : line.rateMinor != null
              ? `${money(line.rateMinor)} each`
              : "";
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1.5fr 120px",
              gap: 12,
              alignItems: "center",
              padding: "9px 14px",
              borderBottom: i === lines.length - 1 ? undefined : `1px solid ${HAIR}`,
              background: i % 2 === 1 ? "#FCFCFA" : "#fff",
              fontFamily: SANS,
              fontSize: 12.5,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ color: INK, fontWeight: 500 }}>{line.label}</div>
              {line.groupName ? (
                <div style={{ fontSize: 11, color: FAINT }}>{line.groupName}</div>
              ) : null}
            </div>
            <div style={{ color: MUTED, minWidth: 0 }}>
              {measured}
              {rate ? ` @ ${rate}` : ""}
              {line.note ? (
                <div style={{ fontSize: 11, color: FAINT, lineHeight: 1.45 }}>{line.note}</div>
              ) : null}
            </div>
            <div
              style={{
                textAlign: "right",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: line.amountMinor < 0 ? RED : INK,
              }}
            >
              {money(line.amountMinor)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdjustmentLine({ item, money }: { item: PayrollItemRow; money: (m: number) => string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "9px 14px",
        marginTop: 8,
        border: "1px dashed #C5C4BE",
        borderRadius: 10,
        fontFamily: SANS,
        fontSize: 12.5,
        color: MUTED,
      }}
    >
      <span>
        Manual adjustment
        {item.adjustmentNote ? ` — ${item.adjustmentNote}` : ""}
      </span>
      <span
        style={{
          fontWeight: 600,
          color: item.adjustmentMinor < 0 ? RED : GREEN,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {item.adjustmentMinor > 0 ? "+" : ""}
        {money(item.adjustmentMinor)}
      </span>
    </div>
  );
}
