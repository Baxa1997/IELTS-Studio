"use client";

import { useActionState } from "react";

import { useActionFeedback } from "@/components/console/toast";

import { moveMember, removeMember, setStudentStatus, type GroupFormState } from "../actions";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#16203a";
const BODY = "#545c70";
const FAINT = "#6f7788";
const RED = "#a13a2c";
const RULE = "#e2e0d6";

/**
 * The three ways a student leaves a group, each as the body of its own modal.
 *
 * THE POINT IS THAT REMOVE USED TO BE THE ONLY OPTION. A student stops coming,
 * and the one button on the row deletes their membership — so they vanish from
 * the group, from the teacher's view and from every roster, while their unpaid
 * invoices sit in the debtors report attached to nobody the centre can now
 * find. Marking them `left` is almost always what was meant: it keeps them on
 * the roster, greyed, with their history and their balance intact, and it stops
 * the invoicing. So the destructive option exists, but it is last, it is worded
 * plainly, and it says what is owed before anyone presses it.
 *
 * These were one inline panel that opened INSIDE the table row, which pushed
 * the row to 260px tall and shoved every column out of line. They are modals
 * now, reached from the row's Manage menu.
 */

export function MoveBody({
  groupId,
  student,
  otherGroups,
  owedLabel,
  onDone,
}: {
  groupId: string;
  student: { id: string; name: string };
  otherGroups: { id: string; name: string }[];
  owedLabel?: string | null;
  onDone: () => void;
}) {
  if (otherGroups.length === 0) {
    return (
      <p style={note}>
        There is no other group to move {student.name} to — you manage only this one.
      </p>
    );
  }
  return (
    <Action
      action={moveMember}
      hidden={{ group_id: groupId, student_id: student.id }}
      note="They keep every mark, register and invoice. Only which class they sit in changes."
      submit="Move student"
      onDone={onDone}
      owedLabel={owedLabel}
    >
      <label style={label}>
        Move to
        <select name="to_group_id" required style={field}>
          {otherGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
    </Action>
  );
}

export function MarkLeftBody({
  student,
  owedLabel,
  onDone,
}: {
  student: { id: string; name: string };
  owedLabel?: string | null;
  onDone: () => void;
}) {
  return (
    <Action
      action={setStudentStatus}
      hidden={{ student_id: student.id, status: "left" }}
      note="Stays on the roster, greyed out, with their history and balance intact. Stops invoicing and chasing. Nothing is deleted — this is almost always what is meant by “they stopped coming”."
      submit="Mark as left"
      onDone={onDone}
      owedLabel={owedLabel}
    >
      <label style={label}>
        Why, for whoever asks later (optional)
        <input name="note" placeholder="Moved city, exam finished, …" style={field} />
      </label>
    </Action>
  );
}

export function RemoveBody({
  groupId,
  student,
  owedLabel,
  onDone,
}: {
  groupId: string;
  student: { id: string; name: string };
  owedLabel?: string | null;
  onDone: () => void;
}) {
  return (
    <Action
      action={removeMember}
      hidden={{ group_id: groupId, student_id: student.id }}
      note={`${student.name} keeps their account, their work and any balance — they are just no longer in this group, and will not appear on its reports or registers.`}
      submit="Remove from this group"
      onDone={onDone}
      owedLabel={owedLabel}
      danger
    />
  );
}

function Action({
  action,
  hidden,
  note: text,
  submit,
  danger,
  owedLabel,
  onDone,
  children,
}: {
  action: (prev: GroupFormState, data: FormData) => Promise<GroupFormState>;
  hidden: Record<string, string>;
  note: string;
  submit: string;
  danger?: boolean;
  owedLabel?: string | null;
  onDone: () => void;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<GroupFormState, FormData>(action, {});
  // Closes only once the server has actually done it — the toast carries the
  // result, and a modal that vanished on submit would take an error with it.
  useActionFeedback(state, { keepOpen: true, onSuccess: onDone });

  return (
    <form action={formAction} style={{ display: "grid", gap: 14 }}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      {/* Said before anyone presses anything, because it changes which of the
          three options is the right one. */}
      {owedLabel ? (
        <div
          style={{
            fontFamily: SANS,
            fontSize: 13,
            lineHeight: 1.5,
            color: "#9a5b16",
            background: "#fdf1e3",
            border: "1px solid #f0e2c0",
            borderRadius: 10,
            padding: "10px 12px",
          }}
        >
          {owedLabel}. Taking them out of the group does not cancel it — marking them as left
          keeps them findable.
        </div>
      ) : null}

      <p style={note}>{text}</p>
      {children}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            border: `1px solid ${danger ? RED : INK}`,
            background: danger ? "#fff" : INK,
            color: danger ? RED : "#fff",
            borderRadius: 999,
            padding: "10px 18px",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Working…" : submit}
        </button>
        {state.error ? (
          <span style={{ fontFamily: SANS, fontSize: 13, color: RED }}>{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}

const note: React.CSSProperties = {
  margin: 0,
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.6,
  color: BODY,
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  color: FAINT,
};

const field: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${RULE}`,
  borderRadius: 12,
  background: "#fdfdfb",
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 400,
  color: INK,
};
