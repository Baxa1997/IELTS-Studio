import "server-only";

import { loadFinanceSettings } from "@/lib/finance/load";
import { loadLessonDatesFor } from "@/lib/finance/schedule";
import { monthStart, today } from "@/lib/finance/period";
import { prorate } from "@/lib/finance/tuition";
import { createAdminClient } from "@/lib/supabase/admin";

export interface JoinInvoice {
  /** Null when nothing was raised — see `why`. */
  amountMinor: number | null;
  currency: string;
  billed: number;
  planned: number;
  /** Said in the teacher's success message, so it has to read as a sentence. */
  why: string | null;
}

/**
 * Bill one student for the rest of the month they joined in.
 *
 * WHY AT THE MOMENT OF JOINING. Invoices are otherwise raised in a batch from
 * the Finance page, which means a student added on the 5th is uninvoiced until
 * somebody remembers — and the person who added them, who is the one holding
 * the conversation with the parent about money, never sees a figure at all.
 * Raising it here means the teacher can say "that's 240 000 for August, three
 * of twelve lessons" while the parent is still standing there.
 *
 * PRORATED BY LESSON, NOT BY DAY, using the same `prorate` the batch uses — a
 * Tue/Thu class loses nothing by starting on a Wednesday, and two functions
 * that price the same student differently is the bug nobody spots until an
 * invoice is disputed.
 *
 * BEST EFFORT, ALWAYS. A centre that has not set a fee, has no timetable, or
 * simply has finance switched off must still be able to add a student. Every
 * failure here returns a reason and no invoice; none of them fails the join.
 */
export async function invoiceOnJoin(args: {
  organizationId: string;
  studentId: string;
  groupId: string;
  /** Defaults to the month they were added in. */
  month?: string;
}): Promise<JoinInvoice> {
  const empty = (why: string | null): JoinInvoice => ({
    amountMinor: null,
    currency: "UZS",
    billed: 0,
    planned: 0,
    why,
  });

  try {
    const admin = createAdminClient();
    const month = monthStart(args.month ?? today());

    const { data: group } = await admin
      .from("groups")
      .select("monthly_fee_minor")
      .eq("id", args.groupId)
      .maybeSingle();
    const fee = (group?.monthly_fee_minor as number | null) ?? null;
    if (!fee || fee <= 0) return empty(null); // no fee set: silence is right

    // Never a second invoice for the same student, class and month. Adding
    // somebody who was already invoiced — a re-join, a mistake being undone —
    // must not double-bill them.
    const { data: existing } = await admin
      .from("student_invoices")
      .select("id")
      .eq("student_id", args.studentId)
      .eq("group_id", args.groupId)
      .eq("period_month", month)
      .maybeSingle();
    if (existing) return empty("Already invoiced for this month.");

    const settings = await loadFinanceSettings();
    const lessonDates = await loadLessonDatesFor(args.groupId, month);
    const p = prorate({
      fullMinor: fee,
      lessonDates,
      joinedOn: today(),
      leftOn: null,
      month,
      fallbackLessons: settings.lessonsPerMonth,
    });

    // No invoice at all rather than one for zero: a zero still appears on a
    // statement, still gets chased by the debtors report, and still has to be
    // explained to whoever asks why it is there.
    if (p.billed <= 0 || p.amountMinor <= 0) {
      return empty("No lessons left this month — they will be invoiced from next month.");
    }

    const dueOn = `${month.slice(0, 7)}-${String(settings.invoiceDueDay).padStart(2, "0")}`;
    const { error } = await admin.from("student_invoices").insert({
      organization_id: args.organizationId,
      student_id: args.studentId,
      group_id: args.groupId,
      period_month: month,
      amount_minor: p.amountMinor,
      lessons_billed: p.billed,
      lessons_planned: p.planned,
      due_on: dueOn,
    });
    if (error) return empty(null);

    return {
      amountMinor: p.amountMinor,
      currency: settings.currency,
      billed: p.billed,
      planned: p.planned,
      why: null,
    };
  } catch {
    return empty(null);
  }
}
