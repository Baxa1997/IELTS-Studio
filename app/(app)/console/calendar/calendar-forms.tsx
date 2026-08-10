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

import { type ActionState, deleteSlot, saveRoom, saveSlot } from "./actions";

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

/**
 * Add or move one weekly slot.
 *
 * The end time follows the start by whatever duration was last picked, because
 * a center's lessons are all the same length and typing 17:00 after typing
 * 15:30 twenty times is the kind of friction that sends people back to paper.
 */
export function SlotForm({
  slot,
  groups,
  rooms,
}: {
  slot?: SlotDraft;
  groups: { id: string; name: string; teacherName: string | null }[];
  rooms: { id: string; name: string }[];
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await saveSlot(prev, formData);
      if (next.ok) closeDrawer();
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
    <form action={formAction} key={state.ok ?? "new"}>
      {slot?.id ? <input type="hidden" name="id" value={slot.id} /> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            <select name="room_id" defaultValue={slot?.roomId ?? ""} style={fieldStyle}>
              <option value="">No room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
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
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
        <SubmitButton pending={pending}>{slot?.id ? "Save slot" : "Add to timetable"}</SubmitButton>
        {slot?.id ? <DeleteSlotButton id={slot.id} /> : null}
      </div>
      <FormMessage state={state} />
    </form>
  );
}

function DeleteSlotButton({ id }: { id: string }) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await deleteSlot(prev, formData);
      if (next.ok) closeDrawer();
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

const ROOM_COLORS = ["#4340CB", "#16794C", "#B8791F", "#C2453A", "#6B44A2", "#2F5D8C"];

export function RoomForm({
  rooms,
}: {
  rooms: { id: string; name: string; capacity: number | null; color: string | null }[];
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await saveRoom(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );
  const [color, setColor] = useState(ROOM_COLORS[rooms.length % ROOM_COLORS.length]);

  return (
    <div>
      <form action={formAction} key={state.ok ?? "new"}>
        <input type="hidden" name="color" value={color} />
        <FieldGrid>
          <Field label="Room name" span>
            <input name="name" required placeholder="Toshkent" style={fieldStyle} />
          </Field>
          <Field label="Seats" hint="optional">
            <input name="capacity" type="number" min={0} placeholder="12" style={fieldStyle} />
          </Field>
          <Field label="Colour">
            <div style={{ display: "flex", gap: 6, paddingTop: 6 }}>
              {ROOM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Colour ${c}`}
                  onClick={() => setColor(c)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: c,
                    border: color === c ? "2px solid #16162E" : "1px solid rgba(0,0,0,.1)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </Field>
        </FieldGrid>
        <div style={{ marginTop: 16 }}>
          <SubmitButton pending={pending}>Add room</SubmitButton>
        </div>
        <FormMessage state={state} />
      </form>

      {rooms.length > 0 ? (
        <div style={{ marginTop: 22, borderTop: "1px solid #F0EEE9", paddingTop: 14 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#8B8999",
              marginBottom: 10,
            }}
          >
            Rooms you have
          </div>
          {rooms.map((room) => (
            <div
              key={room.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid #F5F4F0",
                fontSize: 13,
                color: "#16162E",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: room.color ?? "#C9C7E4",
                  flex: "none",
                }}
              />
              <span>{room.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#93919F" }}>
                {room.capacity ? `${room.capacity} seats` : "—"}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
