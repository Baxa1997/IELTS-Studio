import { redirect } from "next/navigation";

import {
  AMBER,
  Card,
  CardHead,
  Chip,
  Empty,
  FAINT,
  GREEN,
  HAIR,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  PageHead,
  RED,
  SANS,
  SOFT,
  Stack,
  Tag,
} from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import {
  loadTimetable,
  PATTERN_LABEL,
  type Slot,
  toHHMM,
  toMinutes,
  WEEKDAYS,
} from "@/lib/console/timetable";

import { RoomForm, SlotForm } from "./calendar-forms";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Vertical scale. 0.8px per minute puts a 12-hour teaching day on one screen. */
const PX_PER_MIN = 0.8;
const AXIS_W = 62;

const BLOCK_TINTS = ["#4340CB", "#16794C", "#B8791F", "#C2453A", "#6B44A2", "#2F5D8C"];

function tintFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return BLOCK_TINTS[Math.abs(h) % BLOCK_TINTS.length];
}

/**
 * Side-by-side placement for slots that share a column.
 *
 * Greedy lanes: a slot takes the first lane whose last booking has already
 * finished. Two classes at the same hour in the same room end up half-width
 * beside each other rather than one hidden under the other — which is the whole
 * reason to draw a timetable instead of listing it.
 */
function laneOut(slots: Slot[]): { slot: Slot; lane: number; lanes: number }[] {
  const sorted = [...slots].sort((a, b) => toMinutes(a.startsAt) - toMinutes(b.startsAt));
  const laneEnds: number[] = [];
  const placed = sorted.map((slot) => {
    const start = toMinutes(slot.startsAt);
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = toMinutes(slot.endsAt);
    return { slot, lane };
  });
  const lanes = Math.max(1, laneEnds.length);
  return placed.map((p) => ({ ...p, lanes }));
}

/**
 * The timetable.
 *
 * Two views, because the reference CRM's single view answers only one of the
 * two questions a center asks. Its day-tabs-and-room-columns grid is the right
 * shape for "is this room free at four?" — that is the DAY view here. But the
 * question asked far more often is "when does this class meet, and is my
 * teacher double-booked?", which needs the whole week at once — the WEEK view,
 * and the default.
 *
 * The thing neither a whiteboard nor the reference can do: clashes. Every slot
 * is checked against every other for a shared room or a shared teacher at an
 * overlapping hour on a colliding day pattern, and both blocks turn red. That
 * check runs across the whole center even when the grid is filtered to one
 * teacher, because the room you just booked can be taken by someone else's
 * class.
 */
export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const view = first(sp.view) === "day" ? "day" : "week";
  const dayParam = Number(first(sp.day));
  const day =
    Number.isInteger(dayParam) && dayParam >= 0 && dayParam <= 6 ? dayParam : new Date().getDay();
  const mine = first(sp.who) !== "all" && profile.role === "teacher";

  const [timetable, { groups }] = await Promise.all([
    loadTimetable(profile, { mine }),
    loadGroups(profile),
  ]);

  const { rooms, slots, unscheduled, clashCount, dayStartMin, dayEndMin } = timetable;
  const activeRooms = rooms.filter((r) => r.active);
  const gridHeight = Math.max(240, (dayEndMin - dayStartMin) * PX_PER_MIN);

  const hourLines: number[] = [];
  for (let m = Math.ceil(dayStartMin / 60) * 60; m <= dayEndMin; m += 60) hourLines.push(m);

  const totalHours =
    slots.reduce((a, s) => a + (toMinutes(s.endsAt) - toMinutes(s.startsAt)), 0) / 60;

  const groupOptions = groups.map((g) => ({
    id: g.id,
    name: g.name,
    teacherName: g.teacherName,
  }));
  const roomOptions = activeRooms.map((r) => ({ id: r.id, name: r.name }));

  const link = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      view,
      day: String(day),
      who: mine ? undefined : "all",
      ...patch,
    };
    for (const [key, value] of Object.entries(base)) if (value) params.set(key, value);
    return `?${params.toString()}`;
  };

  /* ── one block ────────────────────────────────────────────────────────── */
  const Block = ({ slot, lane, lanes }: { slot: Slot; lane: number; lanes: number }) => {
    const start = toMinutes(slot.startsAt);
    const end = toMinutes(slot.endsAt);
    const top = (start - dayStartMin) * PX_PER_MIN;
    const height = Math.max(26, (end - start) * PX_PER_MIN - 3);
    const tint = slot.roomId
      ? (rooms.find((r) => r.id === slot.roomId)?.color ?? tintFor(slot.groupName))
      : tintFor(slot.groupName);
    const clashed = slot.clashesWith.length > 0;
    const roomy = height > 62;

    return (
      <Drawer
        key={slot.id}
        eyebrow="Timetable"
        title={slot.groupName}
        note={`${WEEKDAYS[slot.weekday].long} ${slot.startsAt}–${slot.endsAt}${slot.roomName ? ` · ${slot.roomName}` : ""}`}
        label={
          <span style={{ display: "block", textAlign: "left", width: "100%" }}>
            <span
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                opacity: 0.92,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {slot.startsAt}–{slot.endsAt}
            </span>
            <span
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 2,
              }}
            >
              {slot.groupName}
            </span>
            {roomy ? (
              <>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "rgba(255,255,255,.82)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: 3,
                  }}
                >
                  {slot.teacherName ?? "No teacher"}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    color: "rgba(255,255,255,.7)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: 1,
                  }}
                >
                  {view === "day" ? `${slot.studentCount} students` : (slot.roomName ?? "no room")}
                  {slot.pattern === "weekly" ? "" : slot.pattern === "odd" ? " · toq" : " · juft"}
                </span>
              </>
            ) : null}
          </span>
        }
        triggerStyle={{
          position: "absolute",
          top,
          height,
          left: `${(lane * 100) / lanes}%`,
          width: `calc(${100 / lanes}% - 3px)`,
          background: tint,
          color: "#fff",
          border: clashed ? "2px solid #C2453A" : "none",
          boxShadow: clashed ? "0 0 0 2px rgba(194,69,58,.18)" : undefined,
          borderRadius: 8,
          padding: "6px 8px",
          overflow: "hidden",
          whiteSpace: "normal",
          fontFamily: SANS,
        }}
      >
        <>
          {clashed ? (
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
              This clashes with {slot.clashesWith.length} other slot
              {slot.clashesWith.length === 1 ? "" : "s"} — same{" "}
              {slot.clashReason === "both"
                ? "room and teacher"
                : slot.clashReason === "room"
                  ? "room"
                  : "teacher"}
              , overlapping time. Move one of them, or leave it if the double-booking is deliberate.
            </p>
          ) : null}
          <SlotForm
            slot={{
              id: slot.id,
              groupId: slot.groupId,
              roomId: slot.roomId,
              weekday: slot.weekday,
              startsAt: slot.startsAt,
              endsAt: slot.endsAt,
              pattern: slot.pattern,
            }}
            groups={groupOptions}
            rooms={roomOptions}
          />
        </>
      </Drawer>
    );
  };

  /* ── the columns of the grid ──────────────────────────────────────────── */
  const columns =
    view === "week"
      ? WEEKDAYS.map((d) => ({
          key: String(d.index),
          label: d.long,
          sub: d.uz,
          slots: slots.filter((s) => s.weekday === d.index),
        }))
      : [
          ...activeRooms.map((room) => ({
            key: room.id,
            label: room.name,
            sub: room.capacity ? `${room.capacity} seats` : "—",
            slots: slots.filter((s) => s.weekday === day && s.roomId === room.id),
          })),
          {
            key: "none",
            label: "No room",
            sub: "unassigned",
            slots: slots.filter((s) => s.weekday === day && s.roomId == null),
          },
        ].filter((c) => c.key !== "none" || c.slots.length > 0);

  const todayIndex = new Date().getDay();

  return (
    <div>
      <PageHead
        eyebrow="Time"
        title="Timetable"
        subtitle={`${slots.length} weekly slot${slots.length === 1 ? "" : "s"} · ${totalHours.toFixed(totalHours % 1 === 0 ? 0 : 1)} teaching hours a week${clashCount > 0 ? ` · ${clashCount} clash${clashCount === 1 ? "" : "es"}` : ""}.`}
        actions={
          <>
            <Drawer
              label="Add slot"
              eyebrow="Timetable"
              title="Schedule a class"
              note="A weekly repeat — the same class, the same hour, every week."
            >
              <SlotForm groups={groupOptions} rooms={roomOptions} />
            </Drawer>
            {profile.role === "center_admin" ? (
              <Drawer
                label="Rooms"
                variant="ghost"
                eyebrow="Timetable"
                title="Rooms"
                note="The columns of the day view, and the thing two classes can't share."
              >
                <RoomForm
                  rooms={rooms.map((r) => ({
                    id: r.id,
                    name: r.name,
                    capacity: r.capacity,
                    color: r.color,
                  }))}
                />
              </Drawer>
            ) : null}
          </>
        }
      />

      <KpiRow>
        <Kpi
          label="Classes scheduled"
          value={new Set(slots.map((s) => s.groupId)).size}
          sub={`${slots.length} slots`}
        />
        <Kpi
          label="Teaching hours"
          value={totalHours.toFixed(totalHours % 1 === 0 ? 0 : 1)}
          sub="per week"
        />
        <Kpi
          label="Rooms in use"
          value={new Set(slots.map((s) => s.roomId).filter(Boolean)).size}
          sub={`${activeRooms.length} available`}
        />
        <Kpi
          label="Clashes"
          value={clashCount}
          deltaTone={clashCount > 0 ? "bad" : "good"}
          sub={clashCount > 0 ? "same room or teacher, same hour" : "nothing double-booked"}
        />
      </KpiRow>

      {/* ── view switch ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <Chip href={link({ view: "week" })} active={view === "week"}>
          Week
        </Chip>
        <Chip href={link({ view: "day" })} active={view === "day"}>
          By room
        </Chip>

        {view === "day" ? (
          <div style={{ display: "flex", gap: 5, marginLeft: 8, flexWrap: "wrap" }}>
            {WEEKDAYS.map((d) => (
              <a
                key={d.index}
                href={link({ view: "day", day: String(d.index) })}
                className="cn-chip"
                style={{
                  borderRadius: 8,
                  padding: "6px 11px",
                  fontFamily: SANS,
                  fontSize: 12.5,
                  textDecoration: "none",
                  border: `1px solid ${d.index === day ? INDIGO : "#E4E2DC"}`,
                  background: d.index === day ? INDIGO : "#fff",
                  color: d.index === day ? "#fff" : "#4C4A63",
                }}
              >
                {d.uz}
              </a>
            ))}
          </div>
        ) : null}

        {profile.role === "teacher" ? (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <Chip href={link({ who: undefined })} active={mine}>
              My classes
            </Chip>
            <Chip href={link({ who: "all" })} active={!mine}>
              Whole center
            </Chip>
          </div>
        ) : null}
      </div>

      {clashCount > 0 ? (
        <div
          style={{
            padding: "11px 14px",
            marginBottom: 14,
            background: "#FBEAE8",
            border: "1px solid #F0D5D1",
            borderRadius: 11,
            fontFamily: SANS,
            fontSize: 12.5,
            color: "#A63A30",
            lineHeight: 1.55,
          }}
        >
          {clashCount} slot{clashCount === 1 ? " is" : "s are"} double-booked — the same room or the
          same teacher at an overlapping hour. They are outlined in red below; click one to move it.
        </div>
      ) : null}

      {/* ── the grid ───────────────────────────────────────────────────────── */}
      <Card flush style={{ overflow: "hidden" }}>
        {slots.length === 0 ? (
          <Empty>
            Nothing on the timetable yet. &ldquo;Add slot&rdquo; puts a class on it — one weekly
            repeat per row, so a Mon/Wed/Fri course is one entry on Monday with the odd-days
            pattern, not three.
          </Empty>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: Math.max(720, AXIS_W + columns.length * 132) }}>
              {/* header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `${AXIS_W}px repeat(${columns.length}, 1fr)`,
                  borderBottom: `1px solid ${HAIR}`,
                  background: "#FAFAF8",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                <div />
                {columns.map((col) => {
                  const isToday = view === "week" && Number(col.key) === todayIndex;
                  return (
                    <div
                      key={col.key}
                      style={{
                        padding: "10px 10px 9px",
                        borderLeft: `1px solid ${HAIR}`,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: isToday ? INDIGO : INK,
                        }}
                      >
                        {col.label}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 11, color: FAINT, marginTop: 2 }}>
                        {col.slots.length === 0
                          ? col.sub
                          : `${col.slots.length} lesson${col.slots.length === 1 ? "" : "s"}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* body */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `${AXIS_W}px repeat(${columns.length}, 1fr)`,
                  position: "relative",
                }}
              >
                {/* time axis */}
                <div style={{ position: "relative", height: gridHeight }}>
                  {hourLines.map((minute) => (
                    <div
                      key={minute}
                      style={{
                        position: "absolute",
                        top: (minute - dayStartMin) * PX_PER_MIN - 7,
                        right: 9,
                        fontFamily: SANS,
                        fontSize: 11,
                        color: FAINT,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {toHHMM(minute)}
                    </div>
                  ))}
                </div>

                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{
                      position: "relative",
                      height: gridHeight,
                      borderLeft: `1px solid ${HAIR}`,
                      padding: "0 3px",
                    }}
                  >
                    {hourLines.map((minute) => (
                      <div
                        key={minute}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: (minute - dayStartMin) * PX_PER_MIN,
                          borderTop: `1px solid #F7F6F2`,
                        }}
                      />
                    ))}
                    {laneOut(col.slots).map(({ slot, lane, lanes }) => (
                      <Block key={slot.id} slot={slot} lane={lane} lanes={lanes} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Stack>
          {unscheduled.length > 0 ? (
            <Card>
              <CardHead
                title="Not on the timetable"
                note={`${unscheduled.length} class${unscheduled.length === 1 ? "" : "es"} with no slot`}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {unscheduled.map((group) => (
                  <Drawer
                    key={group.id}
                    label={
                      <span>
                        {group.name}
                        <span style={{ color: "#93919F", marginLeft: 6, fontWeight: 400 }}>
                          {group.teacherName ?? "no teacher"}
                        </span>
                      </span>
                    }
                    variant="ghost"
                    eyebrow="Timetable"
                    title={group.name}
                    note="Put this class on the timetable."
                    triggerStyle={{
                      borderRadius: 20,
                      padding: "7px 13px",
                      fontSize: 12.5,
                      fontWeight: 500,
                      whiteSpace: "normal",
                    }}
                  >
                    <SlotForm
                      slot={{ groupId: group.id }}
                      groups={groupOptions}
                      rooms={roomOptions}
                    />
                  </Drawer>
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHead title="Reading the grid" />
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
              <Legend tint={GREEN} label="Block colour = the room it is in" />
              <Legend tint={RED} label="Red outline = clashes with another slot" />
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED }}>
                <Tag tone="neutral">toq</Tag> / <Tag tone="neutral">juft</Tag> mark odd- and
                even-day courses
              </span>
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 12.5,
                color: SOFT,
                margin: "14px 0 0",
                lineHeight: 1.65,
              }}
            >
              A slot is a weekly repeat, so {PATTERN_LABEL.odd.toLowerCase()} is one entry rather
              than three. Two classes at the same hour in the same column sit side by side rather
              than hiding each other. Clashes are flagged, never blocked —{" "}
              <span style={{ color: AMBER }}>a deliberate double-booking is still a plan</span>.
            </p>
          </Card>
        </Stack>
      </div>
    </div>
  );
}

function Legend({ tint, label }: { tint: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span
        style={{
          width: 13,
          height: 13,
          borderRadius: 4,
          background: tint,
          display: "inline-block",
        }}
      />
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED }}>{label}</span>
    </span>
  );
}
