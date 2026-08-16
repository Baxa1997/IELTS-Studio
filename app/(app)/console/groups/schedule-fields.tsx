"use client";

import { useState } from "react";

import { DAY_PRESETS, describeDays, orderedWeekdays } from "@/lib/console/timetable-days";

/**
 * When the class meets — the same control on the create form and on an
 * existing class.
 *
 * WHY THIS IS ON THE CLASS AND NOT ONLY ON THE TIMETABLE. "Mon/Wed/Fri at
 * 18:00" is how a center describes a class when it sells it; it is not
 * something you go to a calendar page to look up afterwards. Making it part of
 * creating the class also closes the gap that made every prorated figure
 * approximate: the lesson count is the denominator for a mid-month student's
 * fee and for their teacher's pay, and a class nobody timetabled falls back to
 * the center's assumed twelve.
 *
 * The presets are shortcuts for the human, never a stored second truth — the
 * rows written are ordinary per-day rows (migration 20260810160000). Picking
 * "Odd days" just ticks Mon, Wed and Fri.
 */

const MUTED = "#6E6C87";
const FAINT = "#93919F";
const INDIGO = "#4340CB";

export interface RoomChoice {
  id: string;
  name: string;
  branchId: string;
}

export function ScheduleFields({
  rooms,
  branchId,
  initial,
  /** Shown when a class currently has no schedule at all. */
  optional = true,
}: {
  rooms: RoomChoice[];
  /** The class's branch — a lesson may only be booked into a room there. */
  branchId: string;
  initial?: { weekdays: number[]; startsAt: string; endsAt: string; roomId: string | null };
  optional?: boolean;
}) {
  const [days, setDays] = useState<number[]>(initial?.weekdays ?? []);
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");

  const toggle = (index: number) =>
    setDays((list) =>
      list.includes(index) ? list.filter((d) => d !== index) : [...list, index].sort(),
    );

  const applyPreset = (preset: readonly number[]) => {
    const same = preset.length === days.length && preset.every((d) => days.includes(d));
    setDays(same ? [] : [...preset]);
    // A center booking Mon/Wed/Fri almost always means the evening slot it
    // already runs; leaving the times blank after one click is a dead end.
    if (!same && !startsAt) {
      setStartsAt("18:00");
      setEndsAt("19:30");
    }
  };

  // Only rooms at this class's branch: the DB trigger `lesson_slot_branch_guard`
  // rejects the rest, so offering them would be offering a guaranteed error.
  const available = rooms.filter((r) => r.branchId === branchId);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* The days go into the POST as repeated `weekdays` fields, which is what
          the action reads with getAll(). Hidden inputs rather than checkboxes so
          the chips can carry the preset behaviour. */}
      {days.map((d) => (
        <input key={d} type="hidden" name="weekdays" value={d} />
      ))}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {DAY_PRESETS.map((p) => {
          const on = p.days.length === days.length && p.days.every((d) => days.includes(d));
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.days)}
              title={p.note}
              style={{
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11.5,
                fontFamily: "inherit",
                border: `1px solid ${on ? INDIGO : "#E4E2DC"}`,
                background: on ? INDIGO : "#fff",
                color: on ? "#fff" : MUTED,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {orderedWeekdays().map((d) => {
          const on = days.includes(d.index);
          return (
            <button
              key={d.index}
              type="button"
              onClick={() => toggle(d.index)}
              aria-pressed={on}
              title={d.long}
              style={{
                width: 42,
                borderRadius: 8,
                padding: "6px 0",
                fontSize: 12,
                fontWeight: on ? 600 : 500,
                fontFamily: "inherit",
                border: `1px solid ${on ? INDIGO : "#E4E2DC"}`,
                background: on ? INDIGO : "#fff",
                color: on ? "#fff" : MUTED,
                cursor: "pointer",
              }}
            >
              {d.short}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12, color: MUTED }}>Starts</span>
          <input
            type="time"
            name="starts_at"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            style={timeField}
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12, color: MUTED }}>Ends</span>
          <input
            type="time"
            name="ends_at"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            style={timeField}
          />
        </label>
      </div>

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, color: MUTED }}>Room</span>
        <select name="room_id" defaultValue={initial?.roomId ?? ""} style={timeField}>
          <option value="">No room yet</option>
          {available.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {available.length === 0 ? (
          <span style={{ fontSize: 11.5, color: FAINT }}>
            No rooms at this branch yet — add them under Timetable. The schedule still saves.
          </span>
        ) : null}
      </label>

      <p style={{ margin: 0, fontSize: 11.5, color: FAINT, lineHeight: 1.5 }}>
        {days.length > 0
          ? `${describeDays(days)}${startsAt && endsAt ? ` · ${startsAt}–${endsAt}` : ""} — this is what the timetable shows, what the register offers to mark, and the lesson count a part-month fee is divided by.`
          : optional
            ? "Leave this blank to decide later. Until a group is timetabled, part-month fees are worked out from the center's assumed lesson count instead of its real one."
            : "Untick every day to take this group off the timetable."}
      </p>
    </div>
  );
}

const timeField: React.CSSProperties = {
  height: 34,
  borderRadius: 8,
  border: "1px solid #E4E2DC",
  background: "#fff",
  padding: "0 9px",
  fontSize: 13.5,
  fontFamily: "inherit",
  color: "#16162E",
  outline: "none",
  width: "100%",
};
