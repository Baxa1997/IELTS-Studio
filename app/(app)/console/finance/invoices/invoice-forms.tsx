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

import { type ActionState, generateInvoices, setGroupPricing } from "../actions";
import { useActionFeedback } from "@/components/console/toast";

/** Charge a whole group for a month, from the fee already on the group. */
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
  // These already close themselves on success; the hook is here for the
  // banner at the top of the page, so `keepOpen` avoids a double close.
  useActionFeedback(state, { keepOpen: true });

  if (groups.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "#6E6C87", margin: 0, lineHeight: 1.55 }}>
        There are no groups yet. An invoice is for a seat in a group, so create one first.
      </p>
    );
  }

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Group">
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
          <Field label={`Amount (${currency})`} hint="blank uses the group fee">
            <input
              name="amount"
              inputMode="numeric"
              placeholder="from the group"
              style={fieldStyle}
            />
          </Field>
        </FieldGrid>
      </div>
      <p style={{ fontSize: 12, color: "#93919F", margin: "12px 0 0", lineHeight: 1.55 }}>
        Anyone already invoiced for that month is skipped, so running this again after two students
        join tops up the group rather than charging the rest twice.
      </p>
      <div style={{ marginTop: 16 }}>
        <SubmitButton pending={pending}>Raise invoices</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/** Both prices of a seat — what the student pays, what the teacher earns. */
export function GroupFeeForm({
  groups,
  currency,
}: {
  groups: { id: string; name: string; feeMajor: string; rateMajor: string }[];
  currency: string;
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await setGroupPricing(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );
  // These already close themselves on success; the hook is here for the
  // banner at the top of the page, so `keepOpen` avoids a double close.
  useActionFeedback(state, { keepOpen: true });

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Group">
          <select name="group_id" required style={fieldStyle}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.feeMajor ? ` — student ${g.feeMajor}` : " — no fee set"}
                {g.rateMajor ? ` · teacher ${g.rateMajor}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <FieldGrid>
          <Field label={`Student pays (${currency})`} hint="per month">
            <input name="fee" inputMode="numeric" placeholder="550 000" style={fieldStyle} />
          </Field>
          <Field label={`Teacher earns (${currency})`} hint="per student, per month">
            <input
              name="teacher_rate"
              inputMode="numeric"
              placeholder="200 000"
              style={fieldStyle}
            />
          </Field>
        </FieldGrid>
      </div>
      <p style={{ fontSize: 12, color: "#93919F", margin: "12px 0 0", lineHeight: 1.55 }}>
        Both are for a full month. A student who joins part-way through is charged for the lessons
        left, and the teacher is paid for the same ones — leave either blank to clear it.
      </p>
      <div style={{ marginTop: 16 }}>
        <SubmitButton pending={pending}>Save pricing</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
