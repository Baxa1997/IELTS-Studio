"use client";

import { useState } from "react";

import { Card } from "@/components/console/crm-ui";
import { type Slot } from "@/lib/console/timetable";
import { toMinutes } from "@/lib/console/timetable-days";

import { type GroupOption, type RoomOption } from "./calendar-forms";
import { type GridRoom, TimetableGrid } from "./timetable-grid";

/**
 * The day tabs and the grid, as one client-side view.
 *
 * WHY THIS IS NOT A LINK. Every other control on this page changes what the
 * server has to fetch — a different week loads different lessons, a different
 * branch loads different rooms. The DAY does not: the whole week is already in
 * the browser, and picking Wednesday is a filter over data we are holding.
 * Navigating for it meant a server round trip, a scroll to the top and a blank
 * flash to show a subset of what was already on screen.
 *
 * The URL still says which day, via `history.replaceState` — so a reload, a
 * bookmark or a shared link all land on the right tab — but it is written
 * rather than navigated to, which is what stops the page reloading. replaceState
 * rather than pushState on purpose: Back should leave the timetable, not walk
 * you through seven tabs you clicked on the way.
 */

const SANS = "var(--font-sans3), ui-sans-serif, system-ui, sans-serif";
const INDIGO = "#4340CB";
const FAINT = "#777581";
const INK = "#16162E";

export interface DayTab {
  index: number;
  short: string;
  /** ISO date of this weekday in the week being shown. */
  date: string;
  long: string;
}

export function WeekBoard({
  days,
  today,
  initialDay,
  rooms,
  slots,
  dayStartMin,
  dayEndMin,
  groups,
  roomOptions,
  canEdit,
  filter,
}: {
  days: DayTab[];
  today: string;
  initialDay: number;
  /** The branch's open rooms — the grid's columns before the day is known. */
  rooms: GridRoom[];
  /** Every lesson in the week being shown, all days. */
  slots: Slot[];
  dayStartMin: number;
  dayEndMin: number;
  groups: GroupOption[];
  roomOptions: RoomOption[];
  canEdit: boolean;
  /** The teacher's "my groups / whole center" toggle, rendered on the server. */
  filter?: React.ReactNode;
}) {
  const [day, setDay] = useState(initialDay);

  const pick = (next: number) => {
    setDay(next);
    const params = new URLSearchParams(window.location.search);
    params.set("day", String(next));
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const daySlots = slots.filter((s) => s.weekday === day);
  const hours =
    daySlots.reduce((a, s) => a + (toMinutes(s.endsAt) - toMinutes(s.startsAt)), 0) / 60;

  // A lesson with no room still needs a column, or it is invisible. Computed
  // here rather than on the server because it depends on the day.
  const unroomed = daySlots.filter((s) => s.roomId == null);
  const gridRooms: GridRoom[] =
    unroomed.length > 0 || rooms.length === 0
      ? [...rooms, { id: null, name: "No room", meta: "unassigned", color: "#8B8999" }]
      : rooms;

  const label = days.find((d) => d.index === day);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        {days.map((d) => {
          const on = d.index === day;
          const count = slots.filter((s) => s.weekday === d.index).length;
          const isToday = d.date === today;
          return (
            <button
              key={d.index}
              type="button"
              onClick={() => pick(d.index)}
              aria-pressed={on}
              title={d.long}
              className="cn-chip"
              style={{
                borderRadius: 10,
                padding: "7px 14px",
                fontFamily: SANS,
                fontSize: 13.5,
                fontWeight: on ? 600 : 500,
                border: `1px solid ${on ? INDIGO : isToday ? "#B9B7E8" : "#C5C4BE"}`,
                background: on ? INDIGO : "#fff",
                color: on ? "#fff" : "#4C4A63",
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <span>{d.short}</span>
              <span
                style={{
                  fontSize: 11.5,
                  fontVariantNumeric: "tabular-nums",
                  color: on ? "rgba(255,255,255,.8)" : isToday ? INDIGO : FAINT,
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {d.date.slice(8)}
              </span>
              {count > 0 ? (
                <span style={{ fontSize: 11, color: on ? "rgba(255,255,255,.75)" : FAINT }}>
                  · {count}
                </span>
              ) : null}
            </button>
          );
        })}
        {filter ? <div style={{ marginLeft: "auto" }}>{filter}</div> : null}
      </div>

      <div
        style={{
          fontFamily: SANS,
          fontSize: 12.5,
          color: FAINT,
          marginBottom: 10,
        }}
      >
        <strong style={{ color: INK, fontWeight: 600 }}>{label?.long}</strong>{" "}
        {daySlots.length === 0
          ? "— nothing scheduled. Click any empty cell to book something."
          : `— ${daySlots.length} lesson${daySlots.length === 1 ? "" : "s"}, ${hours.toFixed(hours % 1 === 0 ? 0 : 1)} hours.`}
      </div>

      <Card flush style={{ overflow: "hidden" }}>
        <TimetableGrid
          rooms={gridRooms}
          slots={daySlots}
          weekday={day}
          weekdayLabel={label?.long ?? ""}
          dayStartMin={dayStartMin}
          dayEndMin={dayEndMin}
          groups={groups}
          roomOptions={roomOptions}
          canEdit={canEdit}
        />
      </Card>
    </>
  );
}
