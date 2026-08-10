import { redirect } from "next/navigation";

import {
  Card,
  CardHead,
  FAINT,
  INDIGO,
  INK,
  MUTED,
  PageHead,
  SANS,
  SOFT,
} from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { describeSlot, loadTimetable, toMinutes, WEEKDAYS } from "@/lib/console/timetable";

import { SlotForm } from "./calendar-forms";
import { RoomsManager } from "./rooms-manager";
import { type GridRoom, TimetableGrid } from "./timetable-grid";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The timetable, in the shape the staff already read: pick a day along the top,
 * rooms across, half-hours down.
 *
 * The earlier version defaulted to a week overview and hid the grid entirely
 * when nothing was scheduled, which made a brand-new center's timetable look
 * broken — there was nowhere to click. Both are fixed here: the day-by-room
 * grid is the view, and it is always drawn, empty or not.
 *
 * Clashes are still computed across the WHOLE week and the whole center, not
 * just the visible day, because the room you are about to book can be taken by
 * a class you are not looking at.
 */
export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
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
  const daySlots = slots.filter((s) => s.weekday === day);
  const canEdit = profile.role === "center_admin" || profile.role === "teacher";

  // Lessons with no room still need a column, or they are invisible.
  const unroomed = daySlots.filter((s) => s.roomId == null);
  const gridRooms: GridRoom[] = [
    ...activeRooms.map((room) => ({
      id: room.id,
      name: room.name,
      meta: room.capacity ? `${room.capacity} seats` : "—",
      color: room.color,
    })),
    ...(unroomed.length > 0 || activeRooms.length === 0
      ? [{ id: null, name: "No room", meta: "unassigned", color: "#8B8999" }]
      : []),
  ];

  const groupOptions = groups.map((g) => ({
    id: g.id,
    name: g.name,
    teacherName: g.teacherName,
  }));
  const roomOptions = activeRooms.map((r) => ({ id: r.id, name: r.name }));

  const lessonsPerRoom = new Map<string, number>();
  for (const slot of slots) {
    if (!slot.roomId) continue;
    lessonsPerRoom.set(slot.roomId, (lessonsPerRoom.get(slot.roomId) ?? 0) + 1);
  }

  const link = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      day: String(day),
      who: mine ? undefined : "all",
      ...patch,
    };
    for (const [key, value] of Object.entries(base)) if (value) params.set(key, value);
    return `?${params.toString()}`;
  };

  const dayHours =
    daySlots.reduce((a, s) => a + (toMinutes(s.endsAt) - toMinutes(s.startsAt)), 0) / 60;

  return (
    <div>
      <PageHead
        eyebrow="Time"
        title="Timetable"
        subtitle={`${WEEKDAYS[day].long} · ${daySlots.length} lesson${daySlots.length === 1 ? "" : "s"} · ${dayHours.toFixed(dayHours % 1 === 0 ? 0 : 1)} hours${clashCount > 0 ? ` · ${clashCount} clash${clashCount === 1 ? "" : "es"} this week` : ""}.`}
        actions={
          <>
            <Drawer
              label="Add a lesson"
              eyebrow="Timetable"
              title="Schedule a class"
              note="A weekly repeat — the same class, the same hour, every week. Or just click an empty cell in the grid."
            >
              <SlotForm groups={groupOptions} rooms={roomOptions} slot={{ weekday: day }} />
            </Drawer>
            {profile.role === "center_admin" ? (
              <Drawer
                label={`Rooms (${activeRooms.length})`}
                variant="ghost"
                eyebrow="Timetable"
                title="Rooms"
                note="The columns of the grid, and the thing two classes cannot share."
                width={520}
              >
                <RoomsManager
                  rooms={rooms.map((r) => ({
                    id: r.id,
                    name: r.name,
                    capacity: r.capacity,
                    color: r.color,
                    active: r.active,
                    lessons: lessonsPerRoom.get(r.id) ?? 0,
                  }))}
                />
              </Drawer>
            ) : null}
          </>
        }
      />

      {/* ── the day tabs ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        {WEEKDAYS.map((d) => {
          const on = d.index === day;
          const count = slots.filter((s) => s.weekday === d.index).length;
          return (
            <a
              key={d.index}
              href={link({ day: String(d.index) })}
              className="cn-chip"
              style={{
                borderRadius: 10,
                padding: "9px 16px",
                fontFamily: SANS,
                fontSize: 13.5,
                fontWeight: on ? 600 : 500,
                textDecoration: "none",
                border: `1px solid ${on ? INDIGO : "#E4E2DC"}`,
                background: on ? INDIGO : "#F4F3EF",
                color: on ? "#fff" : "#4C4A63",
              }}
            >
              {d.uz}
              {count > 0 ? (
                <span
                  style={{
                    marginLeft: 7,
                    fontSize: 11,
                    color: on ? "rgba(255,255,255,.75)" : FAINT,
                  }}
                >
                  {count}
                </span>
              ) : null}
            </a>
          );
        })}

        {profile.role === "teacher" ? (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <a
              href={link({ who: undefined })}
              className="cn-chip"
              style={{
                borderRadius: 20,
                padding: "7px 14px",
                fontFamily: SANS,
                fontSize: 12.5,
                textDecoration: "none",
                border: `1px solid ${mine ? INDIGO : "#E4E2DC"}`,
                background: mine ? INDIGO : "#fff",
                color: mine ? "#fff" : "#4C4A63",
              }}
            >
              My classes
            </a>
            <a
              href={link({ who: "all" })}
              className="cn-chip"
              style={{
                borderRadius: 20,
                padding: "7px 14px",
                fontFamily: SANS,
                fontSize: 12.5,
                textDecoration: "none",
                border: `1px solid ${!mine ? INDIGO : "#E4E2DC"}`,
                background: !mine ? INDIGO : "#fff",
                color: !mine ? "#fff" : "#4C4A63",
              }}
            >
              Whole center
            </a>
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
          {clashCount} lesson{clashCount === 1 ? " is" : "s are"} double-booked this week — the same
          room or the same teacher at an overlapping hour. They are outlined in red; click one to
          move it.
        </div>
      ) : null}

      {activeRooms.length === 0 ? (
        <div
          style={{
            padding: "11px 14px",
            marginBottom: 14,
            background: "#FDF9F1",
            border: "1px solid #E8D9BE",
            borderRadius: 11,
            fontFamily: SANS,
            fontSize: 12.5,
            color: "#8A6420",
            lineHeight: 1.55,
          }}
        >
          No rooms yet, so the grid has one unassigned column. Add your rooms with the{" "}
          <strong>Rooms</strong> button above and each becomes a column you can book into.
        </div>
      ) : null}

      <Card flush style={{ overflow: "hidden" }}>
        <TimetableGrid
          rooms={gridRooms}
          slots={daySlots}
          weekday={day}
          weekdayLabel={WEEKDAYS[day].long}
          dayStartMin={dayStartMin}
          dayEndMin={dayEndMin}
          groups={groupOptions}
          roomOptions={roomOptions}
          canEdit={canEdit}
        />
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {unscheduled.length > 0 ? (
          <Card>
            <CardHead
              title="Not on the timetable"
              note={`${unscheduled.length} class${unscheduled.length === 1 ? "" : "es"} with no slot at all`}
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
                    slot={{ groupId: group.id, weekday: day }}
                    groups={groupOptions}
                    rooms={roomOptions}
                  />
                </Drawer>
              ))}
            </div>
          </Card>
        ) : null}

        <Card>
          <CardHead title={`Every slot this week`} note={`${slots.length} in total`} />
          {slots.length === 0 ? (
            <p style={{ fontFamily: SANS, fontSize: 13, color: SOFT, margin: 0, lineHeight: 1.6 }}>
              Nothing scheduled yet. Click any empty cell in the grid above — it opens the form with
              that room, day and time already filled in.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {slots.map((slot) => (
                <span
                  key={slot.id}
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    color: slot.clashesWith.length > 0 ? "#A63A30" : MUTED,
                    background: "#F4F3EF",
                    border: "1px solid #E4E2DC",
                    borderRadius: 8,
                    padding: "5px 10px",
                  }}
                >
                  <strong style={{ color: INK }}>{slot.groupName}</strong> · {describeSlot(slot)}
                </span>
              ))}
            </div>
          )}
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12,
              color: FAINT,
              margin: "14px 0 0",
              lineHeight: 1.6,
            }}
          >
            One row per weekly repeat: a Mon/Wed/Fri course is a single Monday slot with the{" "}
            <strong>toq kunlar</strong> pattern, not three entries. Clashes are flagged, never
            blocked — a deliberate double-booking is still a plan.
          </p>
        </Card>
      </div>
    </div>
  );
}
