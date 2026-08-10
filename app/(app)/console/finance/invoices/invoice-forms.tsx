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

import { type ActionState, generateInvoices, setGroupFee } from "../actions";

/** Charge a whole class for a month, from the fee already on the class. */
export function GenerateInvoicesForm({
  groups,
  months,
  currency,
}: {
  groups: { id: string; name: string; feeLabel: string; students: number }[];
  months: { value: string; label: string }[];
  currency: string;
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await generateInvoices(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );

  if (groups.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "#6E6C87", margin: 0, lineHeight: 1.55 }}>
        There are no classes yet. An invoice is for a seat in a class, so create one first.
      </p>
    );
  }

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Class">
          <select name="group_id" required style={fieldStyle}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.students} student{g.students === 1 ? "" : "s"} · {g.feeLabel}
              </option>
            ))}
          </select>
        </Field>
        <FieldGrid>
          <Field label="Month">
            <select name="period_month" style={fieldStyle}>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Amount (${currency})`} hint="blank uses the class fee">
            <input
              name="amount"
              inputMode="numeric"
              placeholder="from the class"
              style={fieldStyle}
            />
          </Field>
        </FieldGrid>
      </div>
      <p style={{ fontSize: 12, color: "#93919F", margin: "12px 0 0", lineHeight: 1.55 }}>
        Anyone already invoiced for that month is skipped, so running this again after two students
        join tops up the class rather than charging the rest twice.
      </p>
      <div style={{ marginTop: 16 }}>
        <SubmitButton pending={pending}>Raise invoices</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/** The monthly price of a seat, stored on the class. */
export function GroupFeeForm({
  groups,
  currency,
}: {
  groups: { id: string; name: string; feeMajor: string }[];
  currency: string;
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await setGroupFee(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Class">
          <select name="group_id" required style={fieldStyle}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.feeMajor ? ` — currently ${g.feeMajor}` : " — no fee set"}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Monthly fee (${currency})`} hint="leave blank to clear it">
          <input name="fee" inputMode="numeric" placeholder="550 000" style={fieldStyle} />
        </Field>
      </div>
      <div style={{ marginTop: 16 }}>
        <SubmitButton pending={pending}>Save fee</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
