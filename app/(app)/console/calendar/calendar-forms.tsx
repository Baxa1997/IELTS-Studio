"use client";

import { useRouter } from "next/navigation";
import { useActionState, useId, useState } from "react";

import {
  Field,
  FieldGrid,
  fieldStyle,
  FormMessage,
  SubmitButton,
  useDrawerClose,
} from "@/components/console/finance-ui";
// From `timetable-days`, not `timetable`: the loader is server-only and
// importing it from a client component drags `server-only` into the browser
// bundle. The day list and the presets live apart precisely so both can use them.
import { DAY_PRESETS, orderedWeekdays } from "@/lib/console/timetable-days";

import { type ActionState, deleteSlot, saveSlot } from "./actions";

/** Common lesson lengths, so the end time fills itself in. */
const DURATIONS = [45, 60, 90, 120];

const MUTED = "#6E6C87";
const INDIGO = "#4340CB";

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const sameDays = (a: number[], b: readonly number[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** A bookable room. Every room is at exactly one branch. */
export interface RoomOption {
  id: string;
  name: string;
  branchId: string;
  branchName?: string | null;
}

/** A class, and the site it is taught at. */
export interface GroupOption {
  id: string;
  name: string;
  teacherName: string | null;
  branchId: string;
  branchName?: string | null;
}

export interface SlotDraft {
  /** One row. Present when editing a single day of an existing lesson. */
  id?: string;
  /** The lesson all those rows belong to. */
  seriesId?: string;
  groupId?: string;
  roomId?: string | null;
  /** Every day this lesson meets. A new lesson starts with the cell you clicked. */
  weekdays?: number[];
  startsAt?: string;
  endsAt?: string;
  /** The term it runs for. No end date means "until further notice". */
  effectiveFrom?: string;
  effectiveTo?: string | null;
}

/**
 * Add or change one lesson.
 *
 * THE DAYS ARE THE POINT. A center sells "odd days, 15:30" — Mon, Wed and Fri
 * as one purchase — so the form takes a SET of days and writes one row per day,
 * tied by a series id. The old form took a single weekday plus a "repeats"
 * dropdown, which stored the same fact twice and let it contradict itself; a
 * Mon/Wed/Fri class showed up on Wednesday only and staff re-entered the other
 * two days by hand.
 *
 * The end time follows the start by whatever duration was last picked, because
 * a center's lessons are all the same length and typing 17:00 after typing
 * 15:30 twenty times is the kind of friction that sends people back to paper.
 */
export function SlotForm({
  slot,
  groups,
  rooms,
  onDone,
}: {
  slot?: SlotDraft;
  groups: GroupOption[];
  rooms: RoomOption[];
  /** Set when the form sits in the grid's own dialog rather than a Drawer. */
  onDone?: () => void;
}) {
  const formId = useId();
  const router = useRouter();
  const closeDrawer = useDrawerClose();

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await saveSlot(prev, formData);
      if (next.ok) {
        // revalidatePath refreshes the server tree, but this component may be
        // torn down by the close below before that lands. Asking the router
        // explicitly is what makes the grid redraw the moment you hit save.
        router.refresh();
        closeDrawer();
        onDone?.();
      }
      return next;
    },
    {} as ActionState,
  );

  const [days, setDays] = useState<number[]>(slot?.weekdays?.length ? slot.weekdays : [1]);
  const [startsAt, setStartsAt] = useState(slot?.startsAt ?? "15:30");
  const [endsAt, setEndsAt] = useState(slot?.endsAt ?? "17:00");
  const [groupId, setGroupId] = useState(slot?.groupId ?? "");
  const [runsTo, setRunsTo] = useState(slot?.effectiveTo ?? "");

  // A class is taught at one branch and can only be booked into rooms there —
  // the database enforces it, so the picker must not offer anything else. Room
  // choice therefore follows the class, and clearing the class clears it.
  const branchId = groups.find((g) => g.id === groupId)?.branchId ?? null;
  const roomsHere = branchId ? rooms.filter((r) => r.branchId === branchId) : [];
  const [roomId, setRoomId] = useState(slot?.roomId ?? "");
  const roomValue = roomsHere.some((r) => r.id === roomId) ? roomId : "";

  const toggleDay = (day: number) =>
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort(),
    );

  if (groups.length === 0) {
    return (
      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.55 }}>
        There are no classes to schedule yet. Create one first — a lesson is a class meeting, not a
        free-standing event.
      </p>
    );
  }

  const perWeek = days.length;
  const minutes =
    Number(endsAt.slice(0, 2)) * 60 +
    Number(endsAt.slice(3)) -
    (Number(startsAt.slice(0, 2)) * 60 + Number(startsAt.slice(3)));

  return (
    <>
      <form
        id={formId}
        action={formAction}
        key={state.ok ?? "new"}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {slot?.seriesId ? <input type="hidden" name="series_id" value={slot.seriesId} /> : null}
        {days.map((day) => (
          <input key={day} type="hidden" name="weekdays" value={day} />
        ))}

        <Field label="Class">
          <select
            name="group_id"
            required
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            style={fieldStyle}
          >
            <option value="">Pick a class…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.teacherName ? ` — ${g.teacherName}` : ""}
              </option>
            ))}
          </select>
        </Field>

        {/* ── which days ─────────────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Days it meets</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {DAY_PRESETS.map((preset) => {
              const on = sameDays(days, preset.days);
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setDays([...preset.days])}
                  title={preset.note}
                  className="cn-chip"
                  style={{
                    border: `1px solid ${on ? INDIGO : "#E4E2DC"}`,
                    background: on ? "#F2F1FB" : "#F4F3EF",
                    color: on ? INDIGO : "#4C4A63",
                    borderRadius: 20,
                    padding: "5px 12px",
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: on ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {orderedWeekdays().map((d) => {
              const on = days.includes(d.index);
              return (
                <button
                  key={d.index}
                  type="button"
                  onClick={() => toggleDay(d.index)}
                  aria-pressed={on}
                  title={d.long}
                  style={{
                    width: 42,
                    height: 34,
                    borderRadius: 9,
                    border: `1px solid ${on ? INDIGO : "#E4E2DC"}`,
                    background: on ? INDIGO : "#fff",
                    color: on ? "#fff" : "#4C4A63",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    fontWeight: on ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11.5, color: "#93919F", margin: "7px 0 0", lineHeight: 1.5 }}>
            {perWeek === 0
              ? "Pick at least one day."
              : `${perWeek} lesson${perWeek === 1 ? "" : "s"} a week${
                  minutes > 0
                    ? ` · ${((perWeek * minutes) / 60).toFixed(((perWeek * minutes) / 60) % 1 ? 1 : 0)} hours`
                    : ""
                }. One row per day, edited together.`}
          </p>
        </div>

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
          {DURATIONS.map((length) => (
            <button
              key={length}
              type="button"
              onClick={() => setEndsAt(addMinutes(startsAt, length))}
              className="cn-chip"
              style={{
                border: `1px solid ${minutes === length ? INDIGO : "#E4E2DC"}`,
                background: minutes === length ? "#F2F1FB" : "#F4F3EF",
                color: minutes === length ? INDIGO : "#4C4A63",
                borderRadius: 20,
                padding: "5px 12px",
                fontFamily: "inherit",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {length >= 60
                ? `${length / 60}h${length % 60 ? ` ${length % 60}m` : ""}`
                : `${length}m`}
            </button>
          ))}
        </div>

        {/* The term. This is what the week picker reads: a course that ends in
            October stops appearing in November instead of having to be deleted,
            so last term's timetable is still there to look at. */}
        <FieldGrid>
          <Field label="Runs from">
            <input
              type="date"
              name="effective_from"
              defaultValue={slot?.effectiveFrom || todayISO()}
              style={fieldStyle}
            />
          </Field>
          <Field label="Until" hint={runsTo ? "last week it runs" : "no end date"}>
            <input
              type="date"
              name="effective_to"
              value={runsTo}
              min={slot?.effectiveFrom || undefined}
              onChange={(e) => setRunsTo(e.target.value)}
              style={fieldStyle}
            />
          </Field>
        </FieldGrid>

        <Field
          label="Room"
          hint={
            !groupId
              ? "pick the class first — rooms depend on its branch"
              : roomsHere.length === 0
                ? `no rooms at ${groups.find((g) => g.id === groupId)?.branchName ?? "that branch"} yet`
                : "every day of the lesson goes in this room"
          }
        >
          <select
            name="room_id"
            value={roomValue}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={!groupId}
            style={{ ...fieldStyle, opacity: groupId ? 1 : 0.6 }}
          >
            <option value="">No room</option>
            {roomsHere.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
      </form>

      <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
        <SubmitButton pending={pending} form={formId}>
          {slot?.seriesId ? "Save lesson" : "Add to timetable"}
        </SubmitButton>
        {slot?.seriesId ? (
          <RemoveLesson
            id={slot.id}
            seriesId={slot.seriesId}
            days={slot.weekdays?.length ?? 1}
            onDone={onDone}
          />
        ) : null}
      </div>
      <FormMessage state={state} />
    </>
  );
}

/**
 * Removing: this day, or the whole lesson.
 *
 * Both are offered because both happen — a class that stopped meeting on
 * Saturdays has not stopped. A single-day lesson shows only one button, since
 * "this day" and "all days" would be the same thing.
 */
function RemoveLesson({
  id,
  seriesId,
  days,
  onDone,
}: {
  id?: string;
  seriesId: string;
  days: number;
  onDone?: () => void;
}) {
  const router = useRouter();
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await deleteSlot(prev, formData);
      if (next.ok) {
        router.refresh();
        closeDrawer();
        onDone?.();
      }
      return next;
    },
    {} as ActionState,
  );

  const linkStyle: React.CSSProperties = {
    background: "none",
    border: 0,
    color: "#A63A30",
    fontFamily: "inherit",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  };

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const wholeSeries =
          (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "series";
        const message =
          wholeSeries && days > 1
            ? `Remove this lesson from all ${days} days?`
            : "Remove this lesson from the timetable?";
        if (!window.confirm(message)) e.preventDefault();
      }}
      style={{ display: "inline-flex", gap: 12, alignItems: "center" }}
    >
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <input type="hidden" name="series_id" value={seriesId} />

      {id && days > 1 ? (
        <button type="submit" name="scope" value="day" disabled={pending} style={linkStyle}>
          {pending ? "…" : "Remove this day"}
        </button>
      ) : null}
      <button type="submit" name="scope" value="series" disabled={pending} style={linkStyle}>
        {pending ? "Removing…" : days > 1 ? `Remove all ${days} days` : "Remove"}
      </button>
      {state.error ? (
        <span style={{ fontSize: 12, color: "#A63A30", fontWeight: 500 }}>{state.error}</span>
      ) : null}
    </form>
  );
}
