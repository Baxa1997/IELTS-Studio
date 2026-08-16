"use client";

import { useActionState, useState } from "react";

import { moveMember, removeMember, setStudentStatus, type GroupFormState } from "../actions";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#16162E";
const FAINT = "#6E6C87";
const RED = "#C24539";
const AMBER = "#9A6B1F";
const RULE = "#E7E5DF";

/**
 * §5: "Rename `Remove` → `Move or remove`, opening a small sheet with: move to
 * another group / mark as left / remove from center. Straight deletion of a
 * student who owes money is a support ticket waiting to happen."
 *
 * THE POINT IS THAT REMOVE WAS THE ONLY OPTION. A student stops coming, and the
 * one button on the row deletes their membership — so they vanish from the
 * class, from the teacher's view and from every roster, while their unpaid
 * invoices sit in the debtors report attached to nobody the centre can now
 * find. Marking them `left` is almost always what was meant: it keeps them on
 * the roster, greyed, with their history and their balance intact, and it stops
 * the invoicing (which it now genuinely does).
 *
 * So the destructive option is here, but it is third, it is worded plainly, and
 * it says what is owed before anyone presses it.
 */
export function MoveOrRemove({
  groupId,
  student,
  otherGroups,
  owedLabel,
}: {
  groupId: string;
  student: { id: string; name: string };
  otherGroups: { id: string; name: string }[];
  /** "120 000 owed", or null when they are square. */
  owedLabel?: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          border: "none",
          background: "none",
          fontFamily: SANS,
          fontSize: 12,
          color: FAINT,
          cursor: "pointer",
          padding: 0,
        }}
      >
        Move or remove
      </button>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 10,
        padding: 12,
        background: "#FFF",
        minWidth: 260,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: INK }}>
        {student.name}
      </div>

      {/* Said once, at the top, because it changes which option is right. */}
      {owedLabel ? (
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: AMBER,
            background: "#FDF6E7",
            border: "1px solid #F0E2C0",
            borderRadius: 7,
            padding: "6px 9px",
          }}
        >
          {owedLabel}. Removing them from the class does not cancel it — mark them as left
          instead, so somebody can still find them.
        </div>
      ) : null}

      <Option
        action={moveMember}
        hidden={{ group_id: groupId, student_id: student.id }}
        label="Move to another class"
        disabled={otherGroups.length === 0}
        disabledNote="There is no other class to move them to."
        submit="Move"
      >
        <select name="to_group_id" required style={field}>
          {otherGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </Option>

      <Option
        action={setStudentStatus}
        hidden={{ student_id: student.id, status: "left" }}
        label="Mark as left"
        note="Stays on the roster, greyed. Stops invoicing and chasing. Nothing is deleted."
        submit="Mark as left"
      >
        <input name="note" placeholder="Why, for whoever asks later (optional)" style={field} />
      </Option>

      <Option
        action={removeMember}
        hidden={{ group_id: groupId, student_id: student.id }}
        label="Remove from this class"
        note="They keep their account, their work and any balance — they are just no longer in this class."
        submit="Remove"
        danger
      />

      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{
          border: "none",
          background: "none",
          color: FAINT,
          fontFamily: SANS,
          fontSize: 12,
          cursor: "pointer",
          alignSelf: "flex-start",
          padding: 0,
        }}
      >
        Cancel
      </button>
    </div>
  );
}

function Option({
  action,
  hidden,
  label,
  note,
  submit,
  danger,
  disabled,
  disabledNote,
  children,
}: {
  action: (prev: GroupFormState, data: FormData) => Promise<GroupFormState>;
  hidden: Record<string, string>;
  label: string;
  note?: string;
  submit: string;
  danger?: boolean;
  disabled?: boolean;
  disabledNote?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<GroupFormState, FormData>(action, {});

  return (
    <form
      action={formAction}
      style={{ borderTop: `1px solid #F2F0EB`, paddingTop: 9, display: "grid", gap: 6 }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: INK }}>{label}</div>
      {note ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT, lineHeight: 1.5 }}>{note}</div>
      ) : null}
      {disabled ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT }}>{disabledNote}</div>
      ) : (
        <>
          {children}
          <button
            type="submit"
            disabled={pending}
            style={{
              justifySelf: "start",
              border: `1px solid ${danger ? RED : RULE}`,
              background: "#FFF",
              color: danger ? RED : INK,
              borderRadius: 7,
              padding: "5px 11px",
              fontFamily: SANS,
              fontSize: 12,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? "Working…" : submit}
          </button>
        </>
      )}
      {state.error ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: RED }}>{state.error}</div>
      ) : null}
      {state.notice ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: "#166C4C" }}>{state.notice}</div>
      ) : null}
    </form>
  );
}

const field: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: `1px solid ${RULE}`,
  borderRadius: 7,
  fontFamily: SANS,
  fontSize: 12.5,
  color: INK,
};
