"use client";

import { useActionState, useId, useState } from "react";

import {
  Field,
  FieldGrid,
  fieldStyle,
  FormMessage,
  SubmitButton,
  useDrawerClose,
} from "@/components/console/finance-ui";

import { type ActionState, deleteSlot, saveSlot } from "./actions";

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

/** Common lesson lengths, so the end time fills itself in. */
const DURATIONS = [60, 90, 120, 180];

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export interface SlotDraft {
  id?: string;
  groupId?: string;
  roomId?: string | null;
  weekday?: number;
  startsAt?: string;
  endsAt?: string;
  pattern?: "weekly" | "odd" | "even";
}

/** A bookable room. `branchName` is only set for centers that have branches. */
export interface RoomOption {
  id: string;
  name: string;
  branchName?: string | null;
}

/**
 * Add or move one weekly slot.
 *
 * The end time follows the start by whatever duration was last picked, because
 * a center's lessons are all the same length and typing 17:00 after typing
 * 15:30 twenty times is the kind of friction that sends people back to paper.
 *
 * The Remove button posts a SECOND action, so it is a second form — and a form
 * cannot live inside a form. It sits outside this one and the save button
 * reaches back in by id; nesting them made every Remove click fire the save
 * action too, with an empty payload.
 */
export function SlotForm({
  slot,
  groups,
  rooms,
  onDone,
}: {
  slot?: SlotDraft;
  groups: { id: string; name: string; teacherName: string | null }[];
  rooms: RoomOption[];
  /** Set when the form sits in the grid's own dialog rather than a Drawer. */
  onDone?: () => void;
}) {
  const formId = useId();
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await saveSlot(prev, formData);
      if (next.ok) {
        closeDrawer();
        onDone?.();
      }
      return next;
    },
    {} as ActionState,
  );

  const [startsAt, setStartsAt] = useState(slot?.startsAt ?? "15:30");
  const [endsAt, setEndsAt] = useState(slot?.endsAt ?? "17:00");

  if (groups.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "#6E6C87", margin: 0, lineHeight: 1.55 }}>
        There are no classes to schedule yet. Create one first — a slot is a class meeting, not a
        free-standing event.
      </p>
    );
  }

  return (
    <>
      <form
        id={formId}
        action={formAction}
        key={state.ok ?? "new"}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {slot?.id ? <input type="hidden" name="id" value={slot.id} /> : null}
        <Field label="Class">
          <select name="group_id" required defaultValue={slot?.groupId ?? ""} style={fieldStyle}>
            <option value="">Pick a class…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.teacherName ? ` — ${g.teacherName}` : ""}
              </option>
            ))}
          </select>
        </Field>

        <FieldGrid>
          <Field label="Day">
            <select name="weekday" defaultValue={String(slot?.weekday ?? 1)} style={fieldStyle}>
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Room">
            {/* Every room in the center, not just the branch being viewed — a
                class can be moved to the other site, and a room missing from
                this list would silently save as "no room". */}
            <select name="room_id" defaultValue={slot?.roomId ?? ""} style={fieldStyle}>
              <option value="">No room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.branchName ? ` — ${r.branchName}` : ""}
                </option>
              ))}
            </select>
          </Field>
        </FieldGrid>

        <FieldGrid>
          <Field label="Starts">
            <input
              type="time"
              name="starts_at"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              style={fieldStyle}
            />
          </Field>
          <Field label="Ends">
            <input
              type="time"
              name="ends_at"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              style={fieldStyle}
            />
          </Field>
        </FieldGrid>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setEndsAt(addMinutes(startsAt, minutes))}
              className="cn-chip"
              style={{
                border: "1px solid #E4E2DC",
                background: "#F4F3EF",
                borderRadius: 20,
                padding: "5px 12px",
                fontFamily: "inherit",
                fontSize: 12,
                color: "#4C4A63",
                cursor: "pointer",
              }}
            >
              {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
            </button>
          ))}
        </div>

        <Field label="Repeats" hint="odd = Mon/Wed/Fri, even = Tue/Thu/Sat">
          <select name="pattern" defaultValue={slot?.pattern ?? "weekly"} style={fieldStyle}>
            <option value="weekly">Every week, this day only</option>
            <option value="odd">Odd days (toq kunlar)</option>
            <option value="even">Even days (juft kunlar)</option>
          </select>
        </Field>
      </form>

      <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
        <SubmitButton pending={pending} form={formId}>
          {slot?.id ? "Save slot" : "Add to timetable"}
        </SubmitButton>
        {slot?.id ? <DeleteSlotButton id={slot.id} onDone={onDone} /> : null}
      </div>
      <FormMessage state={state} />
    </>
  );
}

function DeleteSlotButton({ id, onDone }: { id: string; onDone?: () => void }) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await deleteSlot(prev, formData);
      if (next.ok) {
        closeDrawer();
        onDone?.();
      }
      return next;
    },
    {} as ActionState,
  );
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("Remove this slot from the timetable?")) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        style={{
          background: "none",
          border: 0,
          color: "#A63A30",
          fontFamily: "inherit",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
        }}
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.error ? <span style={{ fontSize: 12, color: "#A63A30" }}> {state.error}</span> : null}
    </form>
  );
}
