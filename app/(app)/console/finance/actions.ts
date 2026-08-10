"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { loadFinanceSettings } from "@/lib/finance/load";
import { parseMoney } from "@/lib/finance/money";
import { gatherPayrollFacts, loadSalaryRules } from "@/lib/finance/payroll";
import { isDate, monthStart, today } from "@/lib/finance/period";
import { computePayroll, salaryComponentsSchema } from "@/lib/finance/salary";
import { createClient } from "@/lib/supabase/server";

/**
 * Everything that writes money.
 *
 * Two rules hold across this whole file:
 *
 *  1. Only a center_admin gets through. RLS enforces it too (migration
 *     20260810120000) — these checks exist so a teacher who reaches a URL sees
 *     a sentence instead of a policy error.
 *
 *  2. Amounts arrive as text and become integers exactly once, here, through
 *     `parseMoney` against the center's own currency. Nothing downstream ever
 *     sees a decimal string.
 */

export interface ActionState {
  error?: string;
  ok?: string;
}

async function requireOwner(): Promise<
  { error: ActionState } | { profile: Awaited<ReturnType<typeof requireOrgUser>>["profile"] }
> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: { error: "Only the center owner can change finance records." } };
  }
  return { profile };
}

const str = (fd: FormData, key: string): string => String(fd.get(key) ?? "").trim();
const orNull = (value: string): string | null => (value === "" ? null : value);

function refreshFinance(): void {
  revalidatePath("/console/finance");
  revalidatePath("/console/finance/invoices");
  revalidatePath("/console/finance/payroll");
  revalidatePath("/console");
}

/* ── the ledger ───────────────────────────────────────────────────────────── */

/**
 * Record one movement of money.
 *
 * A payment against an invoice carries the student, the class and the invoice,
 * so three different questions ("who paid?", "is this class collecting?", "is
 * this invoice settled?") are all answered by the same row. That linkage is
 * also what feeds the salary engine's `collected` basis — a payment recorded
 * without its class pays no teacher.
 */
export async function recordTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const direction = str(formData, "direction") === "out" ? "out" : "in";
  const settings = await loadFinanceSettings();
  const amount = parseMoney(str(formData, "amount"), settings.currency);
  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };

  const accountId = str(formData, "account_id");
  if (!accountId) return { error: "Pick which cash desk this went through." };

  const occurredOn = str(formData, "occurred_on");
  if (!isDate(occurredOn)) return { error: "Pick a valid date." };

  const invoiceId = orNull(str(formData, "invoice_id"));
  let studentId = orNull(str(formData, "student_id"));
  let groupId = orNull(str(formData, "group_id"));

  const supabase = await createClient();

  // Paying an invoice fills in who and which class from the invoice itself, so
  // the two can never disagree.
  if (invoiceId) {
    const { data: invoice } = await supabase
      .from("student_invoices")
      .select("student_id, group_id")
      .eq("id", invoiceId)
      .maybeSingle();
    if (!invoice) return { error: "That invoice no longer exists." };
    studentId = invoice.student_id as string;
    groupId = invoice.group_id as string;
  }

  const { error } = await supabase.from("finance_transactions").insert({
    organization_id: profile.organization_id,
    account_id: accountId,
    direction,
    amount_minor: amount,
    method: str(formData, "method") || "cash",
    category_id: orNull(str(formData, "category_id")),
    occurred_on: occurredOn,
    student_id: studentId,
    group_id: groupId,
    teacher_id: orNull(str(formData, "teacher_id")),
    invoice_id: invoiceId,
    note: orNull(str(formData, "note")),
    created_by: profile.id,
  });
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: direction === "in" ? "Payment recorded." : "Expense recorded." };
}

export async function deleteTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to delete." };

  const supabase = await createClient();
  const { error } = await supabase.from("finance_transactions").delete().eq("id", id);
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: "Entry removed." };
}

/* ── cash desks ───────────────────────────────────────────────────────────── */

export async function saveAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const name = str(formData, "name");
  if (!name) return { error: "Give the desk a name." };

  const settings = await loadFinanceSettings();
  const opening = parseMoney(str(formData, "opening") || "0", settings.currency) ?? 0;
  const id = orNull(str(formData, "id"));

  const supabase = await createClient();
  const payload = {
    organization_id: profile.organization_id,
    name,
    kind: str(formData, "kind") || "cash",
    owner_id: orNull(str(formData, "owner_id")),
    opening_balance_minor: opening,
    active: str(formData, "active") !== "off",
  };

  const { error } = id
    ? await supabase.from("finance_accounts").update(payload).eq("id", id)
    : await supabase.from("finance_accounts").insert(payload);
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: id ? "Desk updated." : `${name} added.` };
}

/**
 * Ko'chirish — move money from one desk to another.
 *
 * Two ledger rows sharing a `transfer_id`, never one "transfer" row. The
 * center's net position is unchanged by definition (an out and an in of the
 * same size), the desks' balances both move, and every balance on the page
 * still comes from the one view. A single signed row would have needed every
 * balance query to special-case it.
 */
export async function transferBetweenAccounts(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const fromId = str(formData, "from_account_id");
  const toId = str(formData, "to_account_id");
  if (!fromId || !toId) return { error: "Pick both desks." };
  if (fromId === toId) return { error: "Those are the same desk." };

  const settings = await loadFinanceSettings();
  const amount = parseMoney(str(formData, "amount"), settings.currency);
  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };

  const occurredOn = isDate(str(formData, "occurred_on")) ? str(formData, "occurred_on") : today();
  const supabase = await createClient();

  const { data: desks } = await supabase
    .from("v_finance_account_balances")
    .select("account_id, name, balance_minor")
    .in("account_id", [fromId, toId]);
  const from = ((desks ?? []) as Record<string, unknown>[]).find((d) => d.account_id === fromId);
  const to = ((desks ?? []) as Record<string, unknown>[]).find((d) => d.account_id === toId);
  if (!from || !to) return { error: "One of those desks no longer exists." };
  if (Number(from.balance_minor ?? 0) < amount) {
    return { error: `${from.name as string} only holds ${Number(from.balance_minor ?? 0)}.` };
  }

  const transferId = crypto.randomUUID();
  const note = str(formData, "note") || `Transfer ${from.name as string} → ${to.name as string}`;
  const base = {
    organization_id: profile.organization_id,
    amount_minor: amount,
    method: "other" as const,
    occurred_on: occurredOn,
    transfer_id: transferId,
    note,
    created_by: profile.id,
  };

  const { error } = await supabase.from("finance_transactions").insert([
    { ...base, account_id: fromId, direction: "out" },
    { ...base, account_id: toId, direction: "in" },
  ]);
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: `Moved to ${to.name as string}.` };
}

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const name = str(formData, "name");
  if (!name) return { error: "Give the category a name." };

  const supabase = await createClient();
  const { error } = await supabase.from("finance_categories").insert({
    organization_id: profile.organization_id,
    name,
    direction: str(formData, "direction") === "in" ? "in" : "out",
  });
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: `${name} added.` };
}

/* ── tuition ──────────────────────────────────────────────────────────────── */

/** The price of a seat in this class, remembered so invoicing is one click. */
export async function setGroupFee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const groupId = str(formData, "group_id");
  if (!groupId) return { error: "Pick a class." };

  const settings = await loadFinanceSettings();
  const raw = str(formData, "fee");
  const fee = raw === "" ? null : parseMoney(raw, settings.currency);
  if (raw !== "" && (fee == null || fee < 0)) return { error: "That isn't a valid monthly fee." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ monthly_fee_minor: fee })
    .eq("id", groupId);
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: fee == null ? "Fee cleared." : "Monthly fee saved." };
}

/**
 * Charge a whole class for a month.
 *
 * Idempotent by design: the table's unique (student, group, month) means
 * running this twice tops up the roster rather than double-charging anyone who
 * was already invoiced, which is exactly what happens when two students join
 * mid-month and the owner re-runs it.
 */
export async function generateInvoices(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const groupId = str(formData, "group_id");
  const month = monthStart(str(formData, "period_month") || today());
  if (!groupId) return { error: "Pick a class to invoice." };

  const settings = await loadFinanceSettings();
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, monthly_fee_minor")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Class not found." };

  const override = str(formData, "amount");
  const amount =
    override === ""
      ? ((group.monthly_fee_minor as number | null) ?? null)
      : parseMoney(override, settings.currency);
  if (amount == null || amount <= 0) {
    return { error: "This class has no monthly fee yet — set one, or type an amount." };
  }

  const { data: members } = await supabase
    .from("group_members")
    .select("student_id")
    .eq("group_id", groupId);
  const studentIds = ((members ?? []) as Record<string, unknown>[]).map(
    (m) => m.student_id as string,
  );
  if (studentIds.length === 0) return { error: "Nobody is enrolled in that class yet." };

  const { data: existing } = await supabase
    .from("student_invoices")
    .select("student_id")
    .eq("group_id", groupId)
    .eq("period_month", month);
  const already = new Set(
    ((existing ?? []) as Record<string, unknown>[]).map((r) => r.student_id as string),
  );

  const toCreate = studentIds.filter((id) => !already.has(id));
  if (toCreate.length === 0) {
    return { ok: "Everyone in that class is already invoiced for this month." };
  }

  const dueOn = `${month.slice(0, 7)}-${String(settings.invoiceDueDay).padStart(2, "0")}`;
  const { error } = await supabase.from("student_invoices").insert(
    toCreate.map((studentId) => ({
      organization_id: profile.organization_id,
      student_id: studentId,
      group_id: groupId,
      period_month: month,
      amount_minor: amount,
      due_on: dueOn,
      created_by: profile.id,
    })),
  );
  if (error) return { error: error.message };

  refreshFinance();
  return {
    ok: `${toCreate.length} invoice${toCreate.length === 1 ? "" : "s"} raised for ${group.name as string}.`,
  };
}

export async function voidInvoice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to void." };

  const supabase = await createClient();
  const { error } = await supabase.from("student_invoices").update({ voided: true }).eq("id", id);
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: "Invoice voided — it no longer counts towards what the student owes." };
}

/* ── payroll ──────────────────────────────────────────────────────────────── */

/**
 * Compute the month and save it as a DRAFT.
 *
 * Re-runnable while the run is a draft: the owner fixes a rule, a late payment
 * lands, they run it again. Once approved it is frozen, because a payslip that
 * changes after the teacher has seen it is worse than no payslip.
 */
export async function runPayroll(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const month = monthStart(str(formData, "period_month") || today());
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("payroll_runs")
    .select("id, status")
    .eq("period_month", month)
    .maybeSingle();
  if (existing && existing.status !== "draft") {
    return { error: "That month is already approved. Reopen it first if it really needs redoing." };
  }

  const [facts, rules] = await Promise.all([gatherPayrollFacts(month), loadSalaryRules()]);
  if (facts.length === 0)
    return { error: "No class has a teacher assigned, so there is nothing to pay." };
  if (rules.length === 0) {
    return { error: "No pay rule exists yet — set one up under Salary rules first." };
  }

  const computed = computePayroll(facts, rules);
  const gross = computed.reduce((a, c) => a + c.grossMinor, 0);

  const { data: run, error: runError } = await supabase
    .from("payroll_runs")
    .upsert(
      {
        organization_id: profile.organization_id,
        period_month: month,
        status: "draft",
        gross_minor: gross,
        net_minor: gross,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,period_month" },
    )
    .select("id")
    .single();
  if (runError || !run) return { error: runError?.message ?? "Could not start the run." };

  // Manual adjustments already typed against this draft survive a recompute —
  // they are the owner's decision, not the engine's output.
  const { data: previous } = await supabase
    .from("payroll_items")
    .select("teacher_id, adjustment_minor, adjustment_note")
    .eq("run_id", run.id as string);
  const adjustments = new Map(
    ((previous ?? []) as Record<string, unknown>[]).map((p) => [
      p.teacher_id as string,
      {
        amount: Number(p.adjustment_minor ?? 0),
        note: (p.adjustment_note as string | null) ?? null,
      },
    ]),
  );

  const { error: itemsError } = await supabase.from("payroll_items").upsert(
    computed.map((c) => {
      const adjustment = adjustments.get(c.teacherId);
      const adjust = adjustment?.amount ?? 0;
      return {
        organization_id: profile.organization_id,
        run_id: run.id as string,
        teacher_id: c.teacherId,
        gross_minor: c.grossMinor,
        adjustment_minor: adjust,
        adjustment_note: adjustment?.note ?? null,
        net_minor: c.grossMinor + adjust,
        breakdown: c.lines,
        rule_id: c.ruleId ?? null,
      };
    }),
    { onConflict: "run_id,teacher_id" },
  );
  if (itemsError) return { error: itemsError.message };

  const net = computed.reduce(
    (a, c) => a + c.grossMinor + (adjustments.get(c.teacherId)?.amount ?? 0),
    0,
  );
  await supabase
    .from("payroll_runs")
    .update({ net_minor: net })
    .eq("id", run.id as string);

  const unruled = computed.filter((c) => c.lines.length === 0).length;
  refreshFinance();
  return {
    ok:
      `Payroll computed for ${computed.length} teacher${computed.length === 1 ? "" : "s"}.` +
      (unruled > 0 ? ` ${unruled} has no rule that produced a line — check the rules.` : ""),
  };
}

export async function adjustPayrollItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to adjust." };

  const settings = await loadFinanceSettings();
  const raw = str(formData, "adjustment");
  const adjustment = raw === "" ? 0 : parseMoney(raw, settings.currency);
  if (adjustment == null) return { error: "That isn't a valid adjustment." };

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("payroll_items")
    .select("gross_minor, run_id")
    .eq("id", id)
    .maybeSingle();
  if (!item) return { error: "That payslip no longer exists." };

  const { error } = await supabase
    .from("payroll_items")
    .update({
      adjustment_minor: adjustment,
      adjustment_note: orNull(str(formData, "note")),
      net_minor: Number(item.gross_minor ?? 0) + adjustment,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await recomputeRunTotal(item.run_id as string);
  refreshFinance();
  return { ok: "Adjustment saved." };
}

async function recomputeRunTotal(runId: string): Promise<void> {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("payroll_items")
    .select("gross_minor, net_minor")
    .eq("run_id", runId);
  const rows = (items ?? []) as Record<string, unknown>[];
  await supabase
    .from("payroll_runs")
    .update({
      gross_minor: rows.reduce((a, r) => a + Number(r.gross_minor ?? 0), 0),
      net_minor: rows.reduce((a, r) => a + Number(r.net_minor ?? 0), 0),
    })
    .eq("id", runId);
}

export async function setPayrollStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !["draft", "approved", "paid"].includes(status)) return { error: "Unknown status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payroll_runs")
    .update({
      status,
      approved_at: status === "draft" ? null : new Date().toISOString(),
      approved_by: status === "draft" ? null : profile.id,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  refreshFinance();
  return {
    ok:
      status === "approved"
        ? "Run approved — the numbers are now frozen."
        : status === "paid"
          ? "Run marked as paid."
          : "Run reopened as a draft.",
  };
}

/**
 * Pay a teacher: one expense in the ledger, tagged to the payslip it settles.
 *
 * Paying through the ledger rather than a "paid" flag is the whole point — the
 * money leaves a real cash desk, lands in the salary expense category, and
 * shows up in the month's expenses without anyone typing it twice.
 */
export async function payTeacher(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const itemId = str(formData, "item_id");
  const accountId = str(formData, "account_id");
  if (!itemId) return { error: "Nothing to pay." };
  if (!accountId) return { error: "Pick which cash desk it comes out of." };

  const settings = await loadFinanceSettings();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("payroll_items")
    .select("id, teacher_id, net_minor, run_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { error: "That payslip no longer exists." };

  const { data: run } = await supabase
    .from("payroll_runs")
    .select("period_month")
    .eq("id", item.run_id as string)
    .maybeSingle();

  const { data: alreadyPaid } = await supabase
    .from("finance_transactions")
    .select("amount_minor")
    .eq("payroll_item_id", itemId);
  const paid = ((alreadyPaid ?? []) as Record<string, unknown>[]).reduce(
    (a, r) => a + Number(r.amount_minor ?? 0),
    0,
  );
  const outstanding = Number(item.net_minor ?? 0) - paid;

  const raw = str(formData, "amount");
  const amount = raw === "" ? outstanding : parseMoney(raw, settings.currency);
  if (amount == null || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (amount > outstanding) {
    return { error: "That is more than this payslip still owes. Adjust the payslip instead." };
  }

  const { data: category } = await supabase
    .from("finance_categories")
    .select("id")
    .eq("slug", "salary")
    .maybeSingle();

  const { error } = await supabase.from("finance_transactions").insert({
    organization_id: profile.organization_id,
    account_id: accountId,
    direction: "out",
    amount_minor: amount,
    method: str(formData, "method") || "cash",
    category_id: (category?.id as string | undefined) ?? null,
    occurred_on: isDate(str(formData, "occurred_on")) ? str(formData, "occurred_on") : today(),
    teacher_id: item.teacher_id as string,
    payroll_item_id: itemId,
    note: `Salary${run?.period_month ? ` for ${run.period_month.slice(0, 7)}` : ""}`,
    created_by: profile.id,
  });
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: "Salary paid and recorded as an expense." };
}

/* ── salary rules ─────────────────────────────────────────────────────────── */

/**
 * Save a pay rule.
 *
 * The components arrive as a JSON string built by the rule editor, and are
 * validated here with the same schema the engine reads them back through — a
 * rule that can't be evaluated must never reach the database, because the place
 * it would fail is a payslip.
 */
export async function saveSalaryRule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const name = str(formData, "name");
  if (!name) return { error: "Give the rule a name — it appears on every payslip it produces." };

  const scope = str(formData, "scope");
  if (!["org", "group", "teacher"].includes(scope))
    return { error: "Pick who the rule applies to." };

  const groupId = orNull(str(formData, "group_id"));
  const teacherId = orNull(str(formData, "teacher_id"));
  if (scope === "group" && !groupId) return { error: "Pick the class this rule is for." };
  if (scope === "teacher" && !teacherId) return { error: "Pick the teacher this rule is for." };

  let components: unknown;
  try {
    components = JSON.parse(str(formData, "components") || "[]");
  } catch {
    return { error: "The rule could not be read. Try rebuilding it." };
  }
  const parsed = salaryComponentsSchema.safeParse(components);
  if (!parsed.success) return { error: "One of the rule's parts is incomplete." };
  if (parsed.data.length === 0)
    return { error: "A rule needs at least one part, or it pays nothing." };

  const settings = await loadFinanceSettings();
  const floorRaw = str(formData, "floor");
  const capRaw = str(formData, "cap");
  const floor = floorRaw === "" ? null : parseMoney(floorRaw, settings.currency);
  const cap = capRaw === "" ? null : parseMoney(capRaw, settings.currency);
  if (floorRaw !== "" && floor == null) return { error: "That isn't a valid minimum." };
  if (capRaw !== "" && cap == null) return { error: "That isn't a valid ceiling." };
  if (floor != null && cap != null && cap < floor) {
    return { error: "The ceiling can't be below the guaranteed minimum." };
  }

  const payload = {
    organization_id: profile.organization_id,
    name,
    scope,
    group_id: scope === "org" ? null : groupId,
    teacher_id: scope === "teacher" ? teacherId : null,
    components: parsed.data,
    floor_minor: floor,
    cap_minor: cap,
    active: true,
  };

  const supabase = await createClient();
  const id = orNull(str(formData, "id"));
  const { error } = id
    ? await supabase.from("salary_rules").update(payload).eq("id", id)
    : await supabase.from("salary_rules").insert(payload);
  if (error) {
    // The partial unique indexes are the guard against two active rules
    // fighting over the same teacher or class.
    if (error.code === "23505") {
      return { error: "There is already an active rule for that target. Edit it instead." };
    }
    return { error: error.message };
  }

  revalidatePath("/console/finance/rules");
  refreshFinance();
  return { ok: id ? "Rule updated." : "Rule saved. Re-run payroll to apply it." };
}

export async function setSalaryRuleActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to change." };
  const active = str(formData, "active") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("salary_rules").update({ active }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/console/finance/rules");
  return { ok: active ? "Rule switched on." : "Rule switched off." };
}

export async function deleteSalaryRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to delete." };

  const supabase = await createClient();
  const { error } = await supabase.from("salary_rules").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/console/finance/rules");
  return { ok: "Rule deleted. Payslips already computed keep their numbers." };
}

/* ── settings ─────────────────────────────────────────────────────────────── */

export async function saveFinanceSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;
  const { profile } = guard;

  const currency = str(formData, "currency").toUpperCase() || "UZS";
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Use a three-letter currency code." };
  const dueDay = Number(str(formData, "invoice_due_day") || "5");
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    return { error: "The due day has to be between 1 and 28." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("finance_settings").upsert(
    {
      organization_id: profile.organization_id,
      currency,
      invoice_due_day: dueDay,
      payroll_note: orNull(str(formData, "payroll_note")),
    },
    { onConflict: "organization_id" },
  );
  if (error) return { error: error.message };

  refreshFinance();
  return { ok: "Finance settings saved." };
}
