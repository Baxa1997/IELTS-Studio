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

import { type ActionState, deleteAccount, saveAccount, transferBetweenAccounts } from "./actions";
import { useActionFeedback } from "@/components/console/toast";

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
    branchId: string;
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
  // These already close themselves on success; the hook is here for the
  // banner at the top of the page, so `keepOpen` avoids a double close.
  useActionFeedback(state, { keepOpen: true });

  return (
    <>
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
        {/* A desk always stands at a branch — that is what makes its takings
            count towards one. Nothing to decide with a single site, so the
            field is sent hidden. */}
        {branches.length > 1 ? (
          <Field label="Branch" hint="every payment taken here counts as that branch's">
            <select
              name="branch_id"
              required
              defaultValue={desk?.branchId ?? defaultBranchId ?? branches[0]?.id ?? ""}
              style={fieldStyle}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <input
            type="hidden"
            name="branch_id"
            value={desk?.branchId ?? defaultBranchId ?? branches[0]?.id ?? ""}
          />
        )}
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
    {/* A SIBLING of the form above, never a child: it contains its own <form>
        and posts to a different action, and a nested form is invalid HTML the
        browser silently flattens — the delete would have submitted saveAccount. */}
    {desk ? <DeleteDeskButton id={desk.id} name={desk.name} /> : null}
    </>
  );
}

/**
 * Remove the desk entirely.
 *
 * Deliberately quiet and last: it is the destructive option, and the ordinary
 * one is the Status select above. The server decides whether this can really
 * delete — a desk with entries against it is closed instead — so the copy
 * promises only "remove", and the result says which actually happened.
 */
function DeleteDeskButton({ id, name }: { id: string; name: string }) {
  const [state, formAction, pending] = useActionState(deleteAccount, {} as ActionState);
  const [confirming, setConfirming] = useState(false);
  useActionFeedback(state, { keepOpen: true });

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          marginTop: 14,
          background: "none",
          border: 0,
          padding: 0,
          fontFamily: "inherit",
          fontSize: 12.5,
          color: "#C2453A",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Remove this desk
      </button>
    );
  }

  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 12.5, color: "#5A6076", margin: 0, lineHeight: 1.45 }}>
        Remove <strong>{name}</strong>? If any money has gone through it, it will be closed
        instead of deleted so the ledger keeps its history.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pending}
            style={{
              background: "#C2453A",
              border: 0,
              borderRadius: 8,
              color: "#fff",
              padding: "7px 13px",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Removing…" : "Yes, remove it"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          style={{
            background: "#fff",
            border: "1px solid #C5C4BE",
            borderRadius: 8,
            padding: "7px 13px",
            fontFamily: "inherit",
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Keep it
        </button>
      </div>
      <FormMessage state={state} />
    </div>
  );
}

/** Transfer: move a float from one desk to another. */
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
  // These already close themselves on success; the hook is here for the
  // banner at the top of the page, so `keepOpen` avoids a double close.
  useActionFeedback(state, { keepOpen: true });

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
      <p style={{ fontSize: 12, color: "#777581", margin: "12px 0 0", lineHeight: 1.55 }}>
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
