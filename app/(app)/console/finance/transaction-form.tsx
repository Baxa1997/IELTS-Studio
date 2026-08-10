"use client";

import { useActionState, useState } from "react";

import {
  Field,
  FieldGrid,
  fieldStyle,
  FormMessage,
  SubmitButton,
  useDrawerClose,
} from "@/components/console/finance-ui";

import { type ActionState, recordTransaction } from "./actions";

/**
 * Record money in, or money out.
 *
 * One form for both directions, because a center's front desk does both at the
 * same counter and the fields barely differ — what changes is which categories
 * are offered and who the "who" is. Splitting it into two would double the
 * markup to change one select.
 *
 * The date defaults to today and the category to the most likely one, so the
 * common case (a student pays their monthly fee, in cash, now) is: amount,
 * student, save.
 */

export interface Option {
  id: string;
  name: string;
  meta?: string;
}

export function TransactionForm({
  direction,
  accounts,
  categories,
  students,
  teachers,
  groups,
  currency,
  defaultCategoryId,
  presetStudentId,
  presetGroupId,
  presetInvoiceId,
  presetAmount,
}: {
  direction: "in" | "out";
  accounts: Option[];
  categories: Option[];
  students: Option[];
  teachers: Option[];
  groups: Option[];
  currency: string;
  defaultCategoryId?: string;
  presetStudentId?: string;
  presetGroupId?: string;
  presetInvoiceId?: string;
  /** Pre-filled amount, e.g. the balance of the invoice being settled. */
  presetAmount?: string;
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await recordTransaction(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );

  const [studentId, setStudentId] = useState(presetStudentId ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const income = direction === "in";

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <input type="hidden" name="direction" value={direction} />
      {presetInvoiceId ? <input type="hidden" name="invoice_id" value={presetInvoiceId} /> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label={`Amount (${currency})`} hint="digits only — spaces are fine">
          <input
            name="amount"
            required
            inputMode="numeric"
            autoFocus
            defaultValue={presetAmount}
            placeholder="550 000"
            style={{ ...fieldStyle, fontSize: 17, fontWeight: 600, letterSpacing: "-.01em" }}
          />
        </Field>

        <FieldGrid>
          <Field label="Cash desk">
            <select name="account_id" required style={fieldStyle}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Paid by">
            <select name="method" defaultValue="cash" style={fieldStyle}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="terminal">Terminal</option>
              <option value="qr">QR</option>
              <option value="bank">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </FieldGrid>

        <FieldGrid>
          <Field label="Category">
            <select name="category_id" defaultValue={defaultCategoryId} style={fieldStyle}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              name="occurred_on"
              defaultValue={today}
              required
              style={fieldStyle}
            />
          </Field>
        </FieldGrid>

        {income ? (
          <>
            <Field label="Student" hint="optional, but it is how a balance gets cleared">
              <select
                name="student_id"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={Boolean(presetInvoiceId)}
                style={fieldStyle}
              >
                <option value="">Nobody in particular</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="For which class"
              hint="drives the teacher's share of what this class collected"
            >
              <select
                name="group_id"
                defaultValue={presetGroupId ?? ""}
                disabled={Boolean(presetInvoiceId)}
                style={fieldStyle}
              >
                <option value="">Not class-specific</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <Field label="Staff member" hint="only for a payment to a person">
            <select name="teacher_id" defaultValue="" style={fieldStyle}>
              <option value="">Not about a person</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Note" hint="optional">
          <input
            name="note"
            placeholder={income ? "August tuition" : "Rent — August"}
            style={fieldStyle}
          />
        </Field>
      </div>

      <div style={{ marginTop: 18 }}>
        <SubmitButton pending={pending} variant={income ? "green" : "primary"}>
          {income ? "Record payment" : "Record expense"}
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
