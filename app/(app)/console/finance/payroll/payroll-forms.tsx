"use client";

import { useActionState } from "react";

import {
  Field,
  FieldGrid,
  fieldStyle,
  FormMessage,
  SubmitButton,
  useDrawerClose,
} from "@/components/console/finance-ui";

import {
  type ActionState,
  adjustPayrollItem,
  payTeacher,
  runPayroll,
  setPayrollStatus,
} from "../actions";

/** Compute (or recompute) the month. */
export function RunPayrollForm({
  periodMonth,
  label,
  recompute,
}: {
  periodMonth: string;
  label: string;
  recompute: boolean;
}) {
  const [state, formAction, pending] = useActionState(runPayroll, {} as ActionState);
  return (
    <form action={formAction} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <input type="hidden" name="period_month" value={periodMonth} />
      <SubmitButton pending={pending} variant={recompute ? "primary" : "green"}>
        {recompute ? "Recompute" : `Run payroll for ${label}`}
      </SubmitButton>
      {state.error || state.ok ? (
        <span style={{ fontSize: 12.5, color: state.error ? "#A63A30" : "#16794C", maxWidth: 380 }}>
          {state.error ?? state.ok}
        </span>
      ) : null}
    </form>
  );
}

/** Approve / reopen / mark paid. */
export function PayrollStatusForm({
  runId,
  status,
}: {
  runId: string;
  status: "draft" | "approved" | "paid";
}) {
  const [state, formAction, pending] = useActionState(setPayrollStatus, {} as ActionState);
  const next = status === "draft" ? "approved" : status === "approved" ? "paid" : "draft";
  const label =
    status === "draft" ? "Approve run" : status === "approved" ? "Mark as paid" : "Reopen as draft";

  return (
    <form action={formAction} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <input type="hidden" name="id" value={runId} />
      <input type="hidden" name="status" value={next} />
      <button
        type="submit"
        disabled={pending}
        className="cn-btn cn-btn--ghost"
        style={{
          background: "#fff",
          border: "1px solid #E0DED8",
          borderRadius: 9,
          padding: "8px 15px",
          fontFamily: "inherit",
          fontSize: 13.5,
          color: "#16162E",
          cursor: pending ? "default" : "pointer",
        }}
      >
        {pending ? "Working…" : label}
      </button>
      {state.error ? <span style={{ fontSize: 12, color: "#A63A30" }}>{state.error}</span> : null}
    </form>
  );
}

/** Pay a teacher — an expense against a real desk, tagged to the payslip. */
export function PayTeacherForm({
  itemId,
  teacherName,
  outstandingMajor,
  currency,
  accounts,
}: {
  itemId: string;
  teacherName: string;
  outstandingMajor: string;
  currency: string;
  accounts: { id: string; name: string }[];
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await payTeacher(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <input type="hidden" name="item_id" value={itemId} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label={`Amount (${currency})`} hint="blank pays the whole balance">
          <input
            name="amount"
            inputMode="numeric"
            defaultValue={outstandingMajor}
            style={{ ...fieldStyle, fontSize: 17, fontWeight: 600 }}
          />
        </Field>
        <FieldGrid>
          <Field label="From which desk">
            <select name="account_id" required style={fieldStyle}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Method">
            <select name="method" defaultValue="cash" style={fieldStyle}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </FieldGrid>
        <Field label="Date">
          <input
            type="date"
            name="occurred_on"
            defaultValue={new Date().toISOString().slice(0, 10)}
            style={fieldStyle}
          />
        </Field>
      </div>
      <p style={{ fontSize: 12, color: "#93919F", margin: "12px 0 0", lineHeight: 1.55 }}>
        This writes one expense in the ledger under Teacher salaries, so {teacherName}&apos;s pay
        shows up in the month&apos;s expenses without being typed twice.
      </p>
      <div style={{ marginTop: 16 }}>
        <SubmitButton pending={pending}>Pay and record</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/** A manual correction the engine can't know about — a bonus, a deduction. */
export function AdjustPayslipForm({
  itemId,
  currency,
  currentMajor,
  currentNote,
}: {
  itemId: string;
  currency: string;
  currentMajor: string;
  currentNote: string;
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await adjustPayrollItem(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <input type="hidden" name="id" value={itemId} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label={`Adjustment (${currency})`} hint="negative to deduct, e.g. -200 000">
          <input
            name="adjustment"
            inputMode="text"
            defaultValue={currentMajor}
            placeholder="0"
            style={{ ...fieldStyle, fontSize: 17, fontWeight: 600 }}
          />
        </Field>
        <Field label="Why" hint="appears on the payslip and in the export">
          <input
            name="note"
            defaultValue={currentNote}
            placeholder="Cover lessons for the Saturday group"
            style={fieldStyle}
          />
        </Field>
      </div>
      <p style={{ fontSize: 12, color: "#93919F", margin: "12px 0 0", lineHeight: 1.55 }}>
        Adjustments survive a recompute — they are your decision, not the rule&apos;s output.
      </p>
      <div style={{ marginTop: 16 }}>
        <SubmitButton pending={pending}>Save adjustment</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
