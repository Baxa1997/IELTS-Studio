"use client";

import { useState } from "react";

import { type Slot } from "@/lib/console/timetable";

import { type RoomOption, SlotForm } from "./calendar-forms";

/**
 * The timetable grid: rooms across, half-hour bands down.
 *
 * Three things this had to get right, all of which the first attempt got wrong:
 *
 *  1. THE GRID IS ALWAYS THERE. An empty timetable renders as empty half-hour
 *     cells, not as an empty-state message. You cannot book a lesson on a
 *     paragraph of text.
 *  2. EVERY EMPTY CELL IS A BUTTON. Clicking 15:30 under "Toshkent" opens the
 *     form with that room, that day and that time already filled in — which is
 *     the only reason to draw a grid rather than list the slots.
 *  3. ONE dialog for the whole grid. A hundred cells cannot each own a modal;
 *     this component holds a single one and swaps what it is editing.
 *
 * Rows are real CSS-grid rows and a lesson spans them, so a 90-minute class is
 * one block three bands tall — the same shape as the paper timetable it
 * replaces.
 */

const INK = "#16162E";
const FAINT = "#93919F";
const HAIR = "#EFEDE8";
const BAND_H = 34;

export interface GridRoom {
  id: string | null;
  name: string;
  meta: string;
  color: string | null;
}

const TINTS = ["#4340CB", "#16794C", "#B8791F", "#C2453A", "#6B44A2", "#2F5D8C"];
function tintFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (m: number): string =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * Side-by-side lanes for lessons sharing a room and an hour.
 *
 * Widths are decided per CLUSTER of touching lessons, not per room: one
 * double-booking at 08:00 used to squeeze every lesson in that room to half
 * width for the rest of the day, which read as though the whole column were
 * double-booked.
 */
function laneOf(slots: Slot[]): Map<string, { lane: number; lanes: number }> {
  const sorted = [...slots].sort((a, b) => toMinutes(a.startsAt) - toMinutes(b.startsAt));
  const out = new Map<string, { lane: number; lanes: number }>();

  let cluster: Slot[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const lane = new Map<string, number>();
    for (const slot of cluster) {
      const start = toMinutes(slot.startsAt);
      let index = laneEnds.findIndex((end) => end <= start);
      if (index === -1) {
        index = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[index] = toMinutes(slot.endsAt);
      lane.set(slot.id, index);
    }
    const lanes = Math.max(1, laneEnds.length);
    for (const [id, index] of lane) out.set(id, { lane: index, lanes });
    cluster = [];
    clusterEnd = -1;
  };

  for (const slot of sorted) {
    // A gap means the previous pile-up is over and widths can reset.
    if (cluster.length > 0 && toMinutes(slot.startsAt) >= clusterEnd) flush();
    cluster.push(slot);
    clusterEnd = Math.max(clusterEnd, toMinutes(slot.endsAt));
  }
  flush();

  return out;
}

type Editing =
  | { kind: "slot"; slot: Slot }
  | { kind: "new"; roomId: string | null; startsAt: string; endsAt: string };

export function TimetableGrid({
  rooms,
  slots,
  weekday,
  weekdayLabel,
  dayStartMin,
  dayEndMin,
  groups,
  roomOptions,
  canEdit,
}: {
  rooms: GridRoom[];
  /** Already narrowed to this weekday by the page. */
  slots: Slot[];
  weekday: number;
  weekdayLabel: string;
  dayStartMin: number;
  dayEndMin: number;
  groups: { id: string; name: string; teacherName: string | null }[];
  roomOptions: RoomOption[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<Editing | null>(null);

  const bands: number[] = [];
  for (let m = dayStartMin; m < dayEndMin; m += 30) bands.push(m);

  const columns = `112px repeat(${rooms.length}, minmax(150px, 1fr))`;

  // Which (room, band) pairs a lesson already covers, so an empty cell is only
  // drawn where there is genuinely nothing.
  const covered = new Set<string>();
  for (const slot of slots) {
    const start = toMinutes(slot.startsAt);
    const end = toMinutes(slot.endsAt);
    for (let m = Math.max(start, dayStartMin); m < Math.min(end, dayEndMin); m += 30) {
      covered.add(`${slot.roomId ?? "none"}:${Math.floor(m / 30) * 30}`);
    }
  }

  const lanes = new Map<string, { lane: number; lanes: number }>();
  for (const room of rooms) {
    const inRoom = slots.filter((s) => (s.roomId ?? null) === room.id);
    for (const [id, value] of laneOf(inRoom)) lanes.set(id, value);
  }

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 120 + rooms.length * 160 }}>
          {/* room headings */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: columns,
              background: "#FAFAF8",
              borderBottom: `1px solid ${HAIR}`,
            }}
          >
            <div />
            {rooms.map((room) => (
              <div
                key={room.id ?? "none"}
                style={{
                  padding: "11px 10px 10px",
                  borderLeft: `1px solid ${HAIR}`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: INK,
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      background: room.color ?? "#C9C7E4",
                      display: "inline-block",
                    }}
                  />
                  {room.name}
                </div>
                <div style={{ fontSize: 11, color: FAINT, marginTop: 2 }}>{room.meta}</div>
              </div>
            ))}
          </div>

          {/* the bands */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: columns,
              gridAutoRows: `${BAND_H}px`,
            }}
          >
            {bands.map((minute, row) => (
              <div
                key={`t-${minute}`}
                style={{
                  gridColumn: 1,
                  gridRow: row + 1,
                  borderBottom: `1px solid ${HAIR}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 10,
                  fontSize: 11.5,
                  color: FAINT,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {toHHMM(minute)} – {toHHMM(minute + 30)}
              </div>
            ))}

            {/* empty, clickable cells */}
            {rooms.map((room, col) =>
              bands.map((minute, row) => {
                if (covered.has(`${room.id ?? "none"}:${minute}`)) return null;
                const label = `Add a lesson at ${toHHMM(minute)} in ${room.name}`;
                return (
                  <button
                    key={`c-${room.id ?? "none"}-${minute}`}
                    type="button"
                    disabled={!canEdit}
                    aria-label={label}
                    title={canEdit ? label : undefined}
                    onClick={() =>
                      setEditing({
                        kind: "new",
                        roomId: room.id,
                        startsAt: toHHMM(minute),
                        endsAt: toHHMM(Math.min(dayEndMin, minute + 90)),
                      })
                    }
                    className="cn-cell"
                    style={{
                      gridColumn: col + 2,
                      gridRow: row + 1,
                      border: 0,
                      borderLeft: `1px solid ${HAIR}`,
                      borderBottom: `1px solid ${HAIR}`,
                      background: "transparent",
                      color: "#D8D5CD",
                      fontSize: 12,
                      cursor: canEdit ? "pointer" : "default",
                      padding: 0,
                    }}
                  >
                    —
                  </button>
                );
              }),
            )}

            {/* the lessons */}
            {rooms.map((room, col) =>
              slots
                .filter((s) => (s.roomId ?? null) === room.id)
                .map((slot) => {
                  const start = Math.max(toMinutes(slot.startsAt), dayStartMin);
                  const end = Math.min(toMinutes(slot.endsAt), dayEndMin);
                  const rowStart = Math.floor((start - dayStartMin) / 30) + 1;
                  const rowSpan = Math.max(1, Math.ceil((end - start) / 30));
                  const { lane, lanes: total } = lanes.get(slot.id) ?? { lane: 0, lanes: 1 };
                  const tint = room.color ?? tintFor(slot.groupName);
                  const clashed = slot.clashesWith.length > 0;
                  const tall = rowSpan >= 3;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setEditing({ kind: "slot", slot })}
                      style={{
                        gridColumn: col + 2,
                        gridRow: `${rowStart} / span ${rowSpan}`,
                        width: `calc(${100 / total}% - 6px)`,
                        marginLeft: `calc(${(lane * 100) / total}% + 3px)`,
                        alignSelf: "stretch",
                        background: tint,
                        color: "#fff",
                        border: clashed ? "2px solid #FFD2CD" : "none",
                        outline: clashed ? "2px solid #C2453A" : "none",
                        borderRadius: 10,
                        padding: "6px 9px",
                        margin: "2px 0",
                        textAlign: "left",
                        overflow: "hidden",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "block",
                      }}
                    >
                      <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.95 }}>
                        {slot.startsAt} - {slot.endsAt}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {slot.groupName}
                      </div>
                      {tall ? (
                        <>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "rgba(255,255,255,.85)",
                              marginTop: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {slot.teacherName ?? "No teacher"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,.75)",
                              marginTop: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Xona: {slot.roomName ?? "—"}
                          </div>
                          <div
                            style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 1 }}
                          >
                            {slot.pattern === "odd"
                              ? "Toq kunlar"
                              : slot.pattern === "even"
                                ? "Juft kunlar"
                                : "Har hafta"}
                          </div>
                        </>
                      ) : null}
                    </button>
                  );
                }),
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            aria-label="Close"
            onClick={() => setEditing(null)}
            style={{ position: "absolute", inset: 0, background: "rgba(20,19,58,.36)", border: 0 }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="cn-slideover"
            style={{
              position: "relative",
              width: 460,
              maxWidth: "100vw",
              background: "#fff",
              height: "100dvh",
              overflowY: "auto",
              boxShadow: "-20px 0 50px rgba(20,19,58,.2)",
              padding: "24px 26px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    letterSpacing: ".1em",
                    fontWeight: 600,
                    color: "#4340CB",
                    textTransform: "uppercase",
                  }}
                >
                  Timetable
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif4), Georgia, serif",
                    fontSize: 24,
                    fontWeight: 700,
                    margin: "6px 0 4px",
                    color: INK,
                  }}
                >
                  {editing.kind === "slot" ? editing.slot.groupName : "Schedule a class"}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#6E6C87", lineHeight: 1.5 }}>
                  {editing.kind === "slot"
                    ? `${weekdayLabel} ${editing.slot.startsAt}–${editing.slot.endsAt}${
                        editing.slot.roomName ? ` · ${editing.slot.roomName}` : ""
                      }`
                    : `${weekdayLabel} ${editing.startsAt}, ${
                        rooms.find((r) => r.id === editing.roomId)?.name ?? "no room"
                      }.`}
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close"
                style={{
                  marginLeft: "auto",
                  background: "#F4F3EF",
                  border: "1px solid #E4E2DC",
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  flex: "none",
                  cursor: "pointer",
                  color: "#6E6C87",
                  fontSize: 15,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {editing.kind === "slot" && editing.slot.clashesWith.length > 0 ? (
              <p
                style={{
                  margin: "0 0 14px",
                  padding: "9px 11px",
                  background: "#FBEAE8",
                  borderRadius: 9,
                  fontSize: 12.5,
                  color: "#A63A30",
                  lineHeight: 1.5,
                }}
              >
                Clashes with {editing.slot.clashesWith.length} other slot
                {editing.slot.clashesWith.length === 1 ? "" : "s"} — same{" "}
                {editing.slot.clashReason === "both"
                  ? "room and teacher"
                  : editing.slot.clashReason === "room"
                    ? "room"
                    : "teacher"}
                , overlapping time.
              </p>
            ) : null}

            <SlotForm
              key={
                editing.kind === "slot" ? editing.slot.id : `${editing.roomId}-${editing.startsAt}`
              }
              slot={
                editing.kind === "slot"
                  ? {
                      id: editing.slot.id,
                      groupId: editing.slot.groupId,
                      roomId: editing.slot.roomId,
                      weekday: editing.slot.weekday,
                      startsAt: editing.slot.startsAt,
                      endsAt: editing.slot.endsAt,
                      pattern: editing.slot.pattern,
                    }
                  : {
                      roomId: editing.roomId,
                      weekday,
                      startsAt: editing.startsAt,
                      endsAt: editing.endsAt,
                    }
              }
              groups={groups}
              rooms={roomOptions}
              onDone={() => setEditing(null)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
