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

import { type ActionState, saveAccount, transferBetweenAccounts } from "./actions";

/**
 * A kassa is a float held by a named person. That is the whole reason the form
 * asks who is responsible: a desk without a name on it is a number nobody has
 * to explain at the end of the day.
 */
export function DeskForm({
  desk,
  staff,
  currency,
  branches = [],
  defaultBranchId,
}: {
  desk?: {
    id: string;
    name: string;
    ownerId: string | null;
    branchId: string | null;
    kind: string;
    active: boolean;
  };
  staff: { id: string; name: string }[];
  currency: string;
  /** Only rendered for a center that has branches. */
  branches?: { id: string; name: string }[];
  /** The branch tab you were on, so a new desk lands where you are looking. */
  defaultBranchId?: string | null;
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await saveAccount(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      {desk?.id ? <input type="hidden" name="id" value={desk.id} /> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Desk name">
          <input
            name="name"
            required
            defaultValue={desk?.name}
            placeholder="Front desk"
            style={fieldStyle}
          />
        </Field>
        <Field label="Responsible person" hint="who answers for what is in it">
          <select name="owner_id" defaultValue={desk?.ownerId ?? ""} style={fieldStyle}>
            <option value="">Nobody in particular</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        {branches.length > 0 ? (
          <Field label="Branch" hint="every payment taken here counts as that branch's">
            <select
              name="branch_id"
              defaultValue={desk?.branchId ?? defaultBranchId ?? ""}
              style={fieldStyle}
            >
              <option value="">No branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <FieldGrid>
          <Field label="Holds mostly">
            <select name="kind" defaultValue={desk?.kind ?? "cash"} style={fieldStyle}>
              <option value="cash">Cash</option>
              <option value="bank">Bank account</option>
              <option value="card">Card</option>
              <option value="terminal">Terminal</option>
              <option value="qr">QR</option>
              <option value="other">Other</option>
            </select>
          </Field>
          {desk ? (
            <Field label="Status">
              <select name="active" defaultValue={desk.active ? "on" : "off"} style={fieldStyle}>
                <option value="on">Active</option>
                <option value="off">Closed</option>
              </select>
            </Field>
          ) : (
            <Field label={`Opening float (${currency})`} hint="what is in it today">
              <input name="opening" inputMode="numeric" placeholder="0" style={fieldStyle} />
            </Field>
          )}
        </FieldGrid>
      </div>
      <div style={{ marginTop: 18 }}>
        <SubmitButton pending={pending}>{desk ? "Save desk" : "Add desk"}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/** Ko'chirish: move a float from one desk to another. */
export function TransferForm({
  accounts,
  fromId,
  currency,
}: {
  accounts: { id: string; name: string; balanceLabel: string }[];
  fromId?: string;
  currency: string;
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await transferBetweenAccounts(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );

  if (accounts.length < 2) {
    return (
      <p style={{ fontSize: 13, color: "#6E6C87", margin: 0, lineHeight: 1.55 }}>
        A transfer needs two desks and there is only one. Add another first.
      </p>
    );
  }

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label={`Amount (${currency})`}>
          <input
            name="amount"
            required
            inputMode="numeric"
            autoFocus
            placeholder="1 000 000"
            style={{ ...fieldStyle, fontSize: 17, fontWeight: 600 }}
          />
        </Field>
        <FieldGrid>
          <Field label="From">
            <select
              name="from_account_id"
              required
              defaultValue={fromId ?? accounts[0]?.id}
              style={fieldStyle}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.balanceLabel}
                </option>
              ))}
            </select>
          </Field>
          <Field label="To">
            <select
              name="to_account_id"
              required
              defaultValue={accounts.find((a) => a.id !== (fromId ?? accounts[0]?.id))?.id}
              style={fieldStyle}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.balanceLabel}
                </option>
              ))}
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
        <Field label="Note" hint="optional">
          <input name="note" placeholder="Bank deposit" style={fieldStyle} />
        </Field>
      </div>
      <p style={{ fontSize: 12, color: "#93919F", margin: "12px 0 0", lineHeight: 1.55 }}>
        Recorded as two entries — out of one desk, into the other — so the center&apos;s net
        position is unchanged and both balances move.
      </p>
      <div style={{ marginTop: 16 }}>
        <SubmitButton pending={pending}>Move the money</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
