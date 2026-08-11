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
import {
  bySeries,
  describeSeries,
  loadTimetable,
  toMinutes,
  WEEKDAYS,
} from "@/lib/console/timetable";

import { BranchesManager } from "./branches-manager";
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

  const { branches, rooms, slots, unscheduled, clashCount, dayStartMin, dayEndMin, issues } =
    timetable;
  const openBranches = branches.filter((b) => b.active);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  const openRooms = rooms.filter((r) => r.active);
  const strayRooms = openRooms.filter((r) => r.branchId == null);

  /**
   * Which site are we looking at?
   *
   * The tabs are built from what actually exists, and one of them is "No
   * branch" whenever a room has not been assigned to a site yet. That tab is
   * the whole point: adding a first branch used to hide every existing room
   * (they all still had `branch_id` null) and the timetable looked wiped. A
   * room can now never fall out of every tab.
   */
  const tabs: { key: string; label: string; count: number }[] = [
    ...openBranches.map((b) => ({ key: b.id, label: b.name, count: b.roomCount })),
    ...(strayRooms.length > 0 && openBranches.length > 0
      ? [{ key: "none", label: "No branch", count: strayRooms.length }]
      : []),
  ];
  const showBranchTabs = tabs.length > 0;
  const requested = first(sp.branch);
  const scope: string =
    requested && (requested === "all" || tabs.some((t) => t.key === requested))
      ? requested
      : tabs.length === 1
        ? tabs[0].key
        : "all";

  // Rooms are the columns, so the branch filter is a filter on rooms.
  const activeRooms = openRooms.filter(
    (r) => scope === "all" || (scope === "none" ? r.branchId == null : r.branchId === scope),
  );
  const roomIdsHere = new Set(activeRooms.map((r) => r.id));

  // Everything on this page counts within the chosen branch — the day tabs, the
  // hours, the week list. The one deliberate exception is `clashCount`, which
  // stays center-wide: the room you are booking can be taken by a class at a
  // branch you are not looking at.
  const branchSlots = slots.filter(
    (s) => scope === "all" || s.roomId == null || roomIdsHere.has(s.roomId),
  );
  const daySlots = branchSlots.filter((s) => s.weekday === day);
  const weekLessons = bySeries(branchSlots);
  const canEdit = profile.role === "center_admin" || profile.role === "teacher";
  const overFull = daySlots.filter((s) => s.overCapacityBy > 0).length;

  // Lessons with no room still need a column, or they are invisible.
  const unroomed = daySlots.filter((s) => s.roomId == null);
  const gridRooms: GridRoom[] = [
    ...activeRooms.map((room) => ({
      id: room.id,
      name: room.name,
      // Viewing every branch at once, the room name alone is ambiguous.
      meta:
        scope === "all" && room.branchId
          ? (branchName.get(room.branchId) ?? "—")
          : room.capacity
            ? `${room.capacity} seats`
            : "—",
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
  // Every open room in the center, whichever branch is on screen: a class can
  // be moved to the other site, and a room missing from the picker would save
  // silently as "no room".
  const roomOptions = openRooms.map((r) => ({
    id: r.id,
    name: r.name,
    branchName: r.branchId ? (branchName.get(r.branchId) ?? null) : null,
  }));

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
      branch: showBranchTabs ? scope : undefined,
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
        subtitle={`${WEEKDAYS[day].long} · ${daySlots.length} lesson${daySlots.length === 1 ? "" : "s"} · ${dayHours.toFixed(dayHours % 1 === 0 ? 0 : 1)} hours${clashCount > 0 ? ` · ${clashCount} clash${clashCount === 1 ? "" : "es"} this week` : ""}${overFull > 0 ? ` · ${overFull} over capacity` : ""}.`}
        actions={
          <>
            <Drawer
              label="Add a lesson"
              eyebrow="Timetable"
              title="Schedule a class"
              note="Pick the days it meets — toq kunlar is one lesson, not three. Or just click an empty cell in the grid."
            >
              <SlotForm groups={groupOptions} rooms={roomOptions} slot={{ weekdays: [day] }} />
            </Drawer>
            {profile.role === "center_admin" ? (
              <Drawer
                label={`Rooms (${openRooms.length})`}
                variant="ghost"
                eyebrow="Timetable"
                title="Rooms"
                note="The columns of the grid, and the thing two classes cannot share."
                width={520}
              >
                <RoomsManager
                  branches={openBranches.map((b) => ({ id: b.id, name: b.name }))}
                  defaultBranchId={scope === "all" || scope === "none" ? null : scope}
                  rooms={rooms.map((r) => ({
                    id: r.id,
                    name: r.name,
                    capacity: r.capacity,
                    color: r.color,
                    active: r.active,
                    branchId: r.branchId,
                    lessons: lessonsPerRoom.get(r.id) ?? 0,
                  }))}
                />
              </Drawer>
            ) : null}
            {profile.role === "center_admin" ? (
              <Drawer
                label={
                  openBranches.length > 0 ? `Branches (${openBranches.length})` : "Add a branch"
                }
                variant="ghost"
                eyebrow="Timetable"
                title="Branches"
                note="The sites you teach at. Each owns its own rooms."
                width={520}
              >
                <BranchesManager
                  branches={branches.map((b) => ({
                    id: b.id,
                    name: b.name,
                    address: b.address,
                    phone: b.phone,
                    active: b.active,
                    roomCount: b.roomCount,
                  }))}
                />
              </Drawer>
            ) : null}
          </>
        }
      />

      {/* ── the branch tabs ────────────────────────────────────────────────── */}
      {showBranchTabs ? (
        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: "1px solid #E4E2DC",
          }}
        >
          {[
            ...tabs,
            ...(tabs.length > 1 ? [{ key: "all", label: "Every branch", count: -1 }] : []),
          ].map((tab) => {
            const on = tab.key === scope;
            return (
              <a
                key={tab.key}
                href={link({ branch: tab.key })}
                className="cn-tab"
                style={{
                  padding: "8px 15px",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: on ? 600 : 500,
                  textDecoration: "none",
                  borderRadius: "9px 9px 0 0",
                  borderBottom: `2px solid ${on ? INDIGO : "transparent"}`,
                  color: on ? INDIGO : MUTED,
                  background: on ? "#F2F1FB" : "transparent",
                }}
              >
                {tab.label}
                {tab.count >= 0 ? (
                  <span
                    style={{
                      marginLeft: 7,
                      fontSize: 11,
                      color: on ? INDIGO : FAINT,
                      opacity: 0.75,
                    }}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </a>
            );
          })}
        </div>
      ) : null}

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
          const count = branchSlots.filter((s) => s.weekday === d.index).length;
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

      {/* A failed read must never pass for an empty timetable. */}
      {issues.length > 0 ? (
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
          <strong>Some of this page could not be loaded</strong>, so what you see below is
          incomplete — nothing has been lost. {issues.join(" · ")}
        </div>
      ) : null}

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
          {openRooms.length === 0 ? (
            <>
              No rooms yet, so the grid has one unassigned column. Add your rooms with the{" "}
              <strong>Rooms</strong> button above and each becomes a column you can book into.
            </>
          ) : (
            <>
              This branch has no open rooms, so there is nothing to book into. Assign a room to it
              with the <strong>Rooms</strong> button, or pick another branch tab.
            </>
          )}
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
                    slot={{ groupId: group.id, weekdays: [day] }}
                    groups={groupOptions}
                    rooms={roomOptions}
                  />
                </Drawer>
              ))}
            </div>
          </Card>
        ) : null}

        <Card>
          <CardHead
            title="Every lesson this week"
            note={`${weekLessons.length} lesson${weekLessons.length === 1 ? "" : "s"}, ${branchSlots.length} meeting${branchSlots.length === 1 ? "" : "s"}${
              scope === "all"
                ? ""
                : scope === "none"
                  ? " in rooms with no branch"
                  : ` at ${branchName.get(scope) ?? "this branch"}`
            }`}
          />
          {weekLessons.length === 0 ? (
            <p style={{ fontFamily: SANS, fontSize: 13, color: SOFT, margin: 0, lineHeight: 1.6 }}>
              Nothing scheduled yet. Click any empty cell in the grid above — it opens the form with
              that room, day and time already filled in.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {/* One chip per LESSON, not per day: a toq kunlar class listed
                  three times reads as three classes. */}
              {weekLessons.map((slot) => (
                <span
                  key={slot.seriesId}
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
                  <strong style={{ color: INK }}>{slot.groupName}</strong> · {describeSeries(slot)}
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
            A lesson is its <strong>set of days</strong>: a Mon/Wed/Fri course is one entry you edit
            once, stored as the three meetings you can see on the grid. Clashes and over-full rooms
            are flagged, never blocked — a deliberate double-booking is still a plan.
          </p>
        </Card>
      </div>
    </div>
  );
}
