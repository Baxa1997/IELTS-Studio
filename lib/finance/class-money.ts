import "server-only";

import { createClient } from "@/lib/supabase/server";

import { loadFinanceSettings } from "./load";
import { monthStart } from "./period";
import { loadLessonDatesFor } from "./schedule";
import { chargeClass, type Proration, teacherBillForClass } from "./tuition";

/**
 * One class's month of money, per student.
 *
 * The screen this feeds answers the only pricing question a center actually
 * asks: "why is this one paying less than that one". A total cannot answer it,
 * so everything here is per head — what they owe, what has landed against it,
 * and how many of the month's lessons they were here for.
 *
 * What is CHARGED and what is OWED are two different facts and are both
 * reported. The proration is what the class's current price WOULD bill; the
 * invoice is what was actually billed, possibly weeks ago at a price that has
 * since changed. Showing only the first would quietly rewrite history; showing
 * only the second leaves a class that has never been invoiced looking free.
 */

export interface StudentMoneyRow {
  studentId: string;
  /** What this month would cost them at the class's current price. */
  tuition: Proration | null;
  /** What the teacher earns for having them this month. */
  teacherPay: Proration | null;
  /** The invoice actually raised for this month, if there is one. */
  invoicedMinor: number | null;
  /** Paid against that invoice. */
  paidMinor: number;
}

export interface ClassMoney {
  currency: string;
  monthlyFeeMinor: number | null;
  teacherRateMinor: number | null;
  /** Lessons this class is timetabled to hold this month. 0 = nothing booked. */
  lessonsThisMonth: number;
  /** The house figure used when the class has no timetable. */
  fallbackLessons: number;
  rows: Map<string, StudentMoneyRow>;
  /** Tuition the class would bill this month, at the current price. */
  expectedMinor: number;
  /** What the teacher earns across the class this month. */
  teacherTotalMinor: number;
  /** Weighted headcount behind that figure. */
  studentsProrated: number;
  /** Raised and settled so far, from the invoice book. */
  invoicedMinor: number;
  paidMinor: number;
}

export async function loadClassMoney(groupId: string, month: string): Promise<ClassMoney | null> {
  const period = monthStart(month);
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, monthly_fee_minor, teacher_rate_minor")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return null;

  const [settings, lessonDates, membersRes, invoicesRes] = await Promise.all([
    loadFinanceSettings(),
    loadLessonDatesFor(groupId, period),
    supabase.from("group_members").select("student_id, joined_at").eq("group_id", groupId),
    supabase
      .from("student_invoices")
      .select("id, student_id, amount_minor, discount_minor")
      .eq("group_id", groupId)
      .eq("period_month", period)
      .eq("voided", false),
  ]);

  const members = ((membersRes.data ?? []) as Record<string, unknown>[]).map((m) => ({
    studentId: m.student_id as string,
    joinedOn: m.joined_at ? String(m.joined_at).slice(0, 10) : null,
  }));

  const invoices = (invoicesRes.data ?? []) as Record<string, unknown>[];
  const invoiceOf = new Map(
    invoices.map((i) => [
      i.student_id as string,
      { id: i.id as string, due: Number(i.amount_minor ?? 0) - Number(i.discount_minor ?? 0) },
    ]),
  );

  // What has been paid against those invoices. A separate query rather than an
  // embed: every join in this schema is a composite FK, which PostgREST cannot
  // resolve, and it fails by returning nothing rather than by erroring.
  const paidByInvoice = new Map<string, number>();
  if (invoices.length > 0) {
    const { data: payments } = await supabase
      .from("finance_transactions")
      .select("invoice_id, amount_minor")
      .eq("direction", "in")
      .in(
        "invoice_id",
        invoices.map((i) => i.id as string),
      );
    for (const p of (payments ?? []) as Record<string, unknown>[]) {
      const key = p.invoice_id as string;
      paidByInvoice.set(key, (paidByInvoice.get(key) ?? 0) + Number(p.amount_minor ?? 0));
    }
  }

  const monthlyFeeMinor = group.monthly_fee_minor == null ? null : Number(group.monthly_fee_minor);
  const teacherRateMinor =
    group.teacher_rate_minor == null ? null : Number(group.teacher_rate_minor);

  const charges = chargeClass({
    members,
    monthlyFeeMinor,
    teacherRateMinor,
    lessonDates,
    month: period,
    fallbackLessons: settings.lessonsPerMonth,
  });

  const rows = new Map<string, StudentMoneyRow>();
  let expectedMinor = 0;
  let invoicedMinor = 0;
  let paidMinor = 0;
  for (const c of charges) {
    const invoice = invoiceOf.get(c.studentId);
    const paid = invoice ? (paidByInvoice.get(invoice.id) ?? 0) : 0;
    expectedMinor += c.tuition?.amountMinor ?? 0;
    invoicedMinor += invoice?.due ?? 0;
    paidMinor += paid;
    rows.set(c.studentId, {
      studentId: c.studentId,
      tuition: c.tuition,
      teacherPay: c.teacherPay,
      invoicedMinor: invoice?.due ?? null,
      paidMinor: paid,
    });
  }

  const bill = teacherBillForClass(charges);

  return {
    currency: settings.currency,
    monthlyFeeMinor,
    teacherRateMinor,
    lessonsThisMonth: lessonDates.length,
    fallbackLessons: settings.lessonsPerMonth,
    rows,
    expectedMinor,
    teacherTotalMinor: bill.amountMinor,
    studentsProrated: bill.studentsProrated,
    invoicedMinor,
    paidMinor,
  };
}
