import Link from "next/link";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiCornerUpLeft,
  FiMapPin,
} from "react-icons/fi";
import { redirect } from "next/navigation";

import {
  Card,
  CardHead,
  FAINT,
  GREEN,
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
  addDays,
  bySeries,
  datesOfWeek,
  describeSeries,
  isoDate,
  loadTimetable,
  orderedWeekdays,
  startOfWeek,
  WEEKDAYS,
  weekLabel,
} from "@/lib/console/timetable";

import { BranchesManager } from "./branches-manager";
import { SlotForm } from "./calendar-forms";
import { RoomsManager } from "./rooms-manager";
import { type GridRoom } from "./timetable-grid";
import { WeekBoard } from "./week-board";

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
 * a group you are not looking at.
 */
export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;

  // Which week, and which day of it. A slot is a weekly repeat, so the week
  // only changes WHICH lessons are running (a course that ended in October is
  // not on November's grid) — but that is exactly the question staff ask when
  // they look at a date, and answering it is why the picker is here.
  const today = isoDate(new Date());
  const weekParam = first(sp.week);
  const week = startOfWeek(/^\d{4}-\d{2}-\d{2}$/.test(weekParam ?? "") ? weekParam! : today);
  const thisWeek = startOfWeek(today);
  const dates = datesOfWeek(week);

  const dayParam = Number(first(sp.day));
  const day =
    Number.isInteger(dayParam) && dayParam >= 0 && dayParam <= 6
      ? dayParam
      : week === thisWeek
        ? new Date().getDay()
        : 1; // another week opens on its Monday, not on "the same weekday as today"
  const mine = first(sp.who) !== "all" && profile.role === "teacher";

  const [timetable, { groups }] = await Promise.all([
    loadTimetable(profile, { mine, week }),
    loadGroups(profile),
  ]);

  const { branches, rooms, slots, unscheduled, conflicts, dayStartMin, dayEndMin, issues } =
    timetable;
  const openBranches = branches.filter((b) => b.active);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  const openRooms = rooms.filter((r) => r.active);

  /**
   * Which site are we looking at?
   *
   * Every room and every group belongs to a branch (migration 20260810170000),
   * so the tabs are simply the branches — there is no "No branch" case left to
   * carry. The row is shown even for a single branch: it is the label that says
   * WHICH site the grid below belongs to, and a timetable that does not name
   * its building is the thing a second branch quietly breaks.
   */
  const tabs = openBranches.map((b) => ({ key: b.id, label: b.name, count: b.roomCount }));
  const showBranchTabs = tabs.length > 0;
  const requested = first(sp.branch);
  const scope: string =
    requested && (requested === "all" || tabs.some((t) => t.key === requested))
      ? requested
      : (tabs[0]?.key ?? "all");

  // Rooms are the columns, so the branch filter is a filter on rooms.
  const activeRooms = openRooms.filter((r) => scope === "all" || r.branchId === scope);

  // Everything on this page counts within the chosen branch — the day tabs, the
  // hours, the week list. The one deliberate exception is `conflicts`, which
  // stays center-wide: the room you are booking can be taken by a group at a
  // branch you are not looking at.
  // Scoped by the CLASS's branch, so a lesson whose room was deleted still
  // appears under the site that teaches it instead of in all of them.
  const branchSlots = slots.filter((s) => scope === "all" || s.branchId === scope);
  const weekLessons = bySeries(branchSlots);
  const canEdit = profile.role === "center_admin" || profile.role === "teacher";
  const overFull = branchSlots.filter((s) => s.overCapacityBy > 0).length;

  // The grid's columns. The "No room" column is NOT added here: whether one is
  // needed depends on the day, which the client board owns.
  const gridRooms: GridRoom[] = [
    ...activeRooms.map((room) => ({
      id: room.id,
      name: room.name,
      // Viewing every branch at once, the room name alone is ambiguous.
      meta:
        scope === "all"
          ? (branchName.get(room.branchId) ?? "—")
          : room.capacity
            ? `${room.capacity} seats`
            : "—",
      color: room.color,
    })),
  ];

  // Groups carry their branch, so the form can offer only the rooms that group
  // is allowed into. The database enforces the same rule (lesson_slots_branch_
  // guard); this is what stops the user meeting it.
  const groupOptions = groups.map((g) => ({
    id: g.id,
    name: g.name,
    teacherName: g.teacherName,
    branchId: g.branchId,
    branchName: g.branchName,
  }));
  const roomOptions = openRooms.map((r) => ({
    id: r.id,
    name: r.name,
    branchId: r.branchId,
    branchName: branchName.get(r.branchId) ?? null,
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
      week: week === thisWeek ? undefined : week,
      who: mine ? undefined : "all",
      branch: showBranchTabs ? scope : undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(base)) if (value) params.set(key, value);
    return `?${params.toString()}`;
  };

  // The teacher's own filter DOES need the server — it changes which lessons
  // are loaded — so it stays a link, handed to the client board to place.
  const teacherFilter =
    profile.role === "teacher" ? (
      <div style={{ display: "flex", gap: 6 }}>
        <Link href={link({ who: undefined })} className="cn-chip" style={toggle(mine)}>
          My groups
        </Link>
        <Link href={link({ who: "all" })} className="cn-chip" style={toggle(!mine)}>
          Whole center
        </Link>
      </div>
    ) : null;

  return (
    <div>
      <PageHead
        title="Timetable"
        subtitle={`${weekLabel(week)}${week === thisWeek ? " · this week" : ""} · ${branchSlots.length} lesson${branchSlots.length === 1 ? "" : "s"}${conflicts.length > 0 ? ` · ${conflicts.length} clash${conflicts.length === 1 ? "" : "es"}` : ""}${overFull > 0 ? ` · ${overFull} over capacity` : ""}.`}
        actions={
          <>
            <Drawer
              label="Add a lesson"
              eyebrow="Timetable"
              title="Schedule a lesson"
              note="Pick the days it meets — Mon/Wed/Fri is one lesson, not three. Or just click an empty cell in the grid."
            >
              <SlotForm groups={groupOptions} rooms={roomOptions} slot={{ weekdays: [day] }} />
            </Drawer>
            {profile.role === "center_admin" ? (
              <Drawer
                label={`Rooms (${openRooms.length})`}
                variant="ghost"
                eyebrow="Timetable"
                title="Rooms"
                note="The columns of the grid, and the thing two groups cannot share."
                width={520}
              >
                <RoomsManager
                  branches={openBranches.map((b) => ({ id: b.id, name: b.name }))}
                  defaultBranchId={scope === "all" ? (openBranches[0]?.id ?? null) : scope}
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

      {/* ── nothing can exist before a branch does ─────────────────────────── */}
      {openBranches.length === 0 ? (
        <Card>
          <CardHead
            title="Create a branch first"
            note="Rooms, groups and cash desks all belong to one"
          />
          <p
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: SOFT,
              margin: "0 0 16px",
              lineHeight: 1.6,
              maxWidth: 560,
            }}
          >
            A branch is the address you teach at. Every room is in one, every group is taught at
            one, and every payment is taken at one — so there is nothing to put on a timetable until
            the first one exists. Most centers have exactly one and never think about it again.
          </p>
          {profile.role === "center_admin" ? (
            <Drawer
              label="Create the first branch"
              eyebrow="Timetable"
              title="Branches"
              note="The sites you teach at. Each owns its own rooms."
              width={520}
            >
              <BranchesManager branches={[]} />
            </Drawer>
          ) : (
            <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: 0 }}>
              Ask the center owner to add one.
            </p>
          )}
        </Card>
      ) : (
        <>
          {/* ── the branch tabs ────────────────────────────────────────────────── */}
          {showBranchTabs ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                marginBottom: 14,
                padding: 3,
                borderRadius: 11,
                background: "#EFEDE7",
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              {[
                ...tabs,
                ...(tabs.length > 1 ? [{ key: "all", label: "Every branch", count: -1 }] : []),
              ].map((tab) => {
                const on = tab.key === scope;
                return (
                  <Link
                    key={tab.key}
                    href={link({ branch: tab.key })}
                    className="cn-tab"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "7px 14px",
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: on ? 600 : 500,
                      textDecoration: "none",
                      borderRadius: 8,
                      color: on ? INK : MUTED,
                      background: on ? "#fff" : "transparent",
                      boxShadow: on ? "0 1px 3px rgba(22,22,46,.10)" : "none",
                    }}
                  >
                    <FiMapPin size={13} color={on ? INDIGO : FAINT} aria-hidden />
                    {tab.label}
                    {tab.count >= 0 ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: on ? INDIGO : FAINT,
                          background: on ? "#EDEBFB" : "#E4E2DC",
                          borderRadius: 20,
                          padding: "1px 7px",
                        }}
                      >
                        {tab.count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "stretch",
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 10,
                background: "#fff",
                overflow: "hidden",
                boxShadow: "0 1px 2px rgba(22,22,46,.04)",
              }}
            >
              <Link
                href={link({ week: addDays(week, -7) })}
                aria-label="Previous week"
                className="cn-chip"
                style={stepBtn}
              >
                <FiChevronLeft size={16} aria-hidden />
              </Link>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 14px",
                  borderLeft: `1px solid ${HAIRLINE}`,
                  borderRight: `1px solid ${HAIRLINE}`,
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: INK,
                  minWidth: 150,
                  justifyContent: "center",
                }}
              >
                <FiCalendar size={14} color={INDIGO} aria-hidden />
                {weekLabel(week)}
              </span>
              <Link
                href={link({ week: addDays(week, 7) })}
                aria-label="Next week"
                className="cn-chip"
                style={stepBtn}
              >
                <FiChevronRight size={16} aria-hidden />
              </Link>
            </div>

            {week === thisWeek ? (
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 600,
                  color: GREEN,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }}
                />
                This week
              </span>
            ) : (
              <Link
                href={link({ week: undefined, day: undefined })}
                className="cn-chip"
                style={weekBtn}
              >
                <FiCornerUpLeft size={13} aria-hidden style={{ marginRight: 5 }} />
                Back to today
              </Link>
            )}

            {/* Jump straight to a date. A GET form rather than a date-picker
                component: the whole page is already URL-driven, so the browser's
                own control is the smallest thing that works. */}
            <form
              method="get"
              style={{
                display: "inline-flex",
                alignItems: "stretch",
                marginLeft: "auto",
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 10,
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <input
                type="date"
                name="week"
                defaultValue={dates.get(day) ?? week}
                aria-label="Jump to a week"
                style={{
                  fontFamily: SANS,
                  fontSize: 12.5,
                  padding: "7px 10px",
                  border: 0,
                  outline: "none",
                  background: "transparent",
                  color: INK,
                }}
              />
              {showBranchTabs ? <input type="hidden" name="branch" value={scope} /> : null}
              {mine ? null : <input type="hidden" name="who" value="all" />}
              <button
                type="submit"
                className="cn-chip"
                style={{
                  border: 0,
                  borderLeft: `1px solid ${HAIRLINE}`,
                  background: "#FAF9F6",
                  padding: "0 13px",
                  fontFamily: SANS,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: INDIGO,
                  cursor: "pointer",
                }}
              >
                Go
              </button>
            </form>
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

          {/* One line per collision, each naming the groups and linking to the
          day it is on. A count on its own ("2 lessons are double-booked") sends
          the reader hunting through seven tabs for a problem it will not
          describe. */}
          {conflicts.length > 0 ? (
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
              <strong>
                {conflicts.length} clash{conflicts.length === 1 ? "" : "es"} this week
              </strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {conflicts.map((c) => (
                  <li key={`${c.slotIds.join("-")}`} style={{ marginTop: 2 }}>
                    {c.label}{" "}
                    {c.weekday === day ? (
                      <span style={{ opacity: 0.75 }}>Outlined in red below.</span>
                    ) : (
                      <Link href={link({ day: String(c.weekday) })} style={{ color: "#A63A30" }}>
                        Show {WEEKDAYS[c.weekday].long} →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              {conflicts.some((c) => c.reason === "self") ? (
                <p style={{ margin: "8px 0 0" }}>
                  A group booked twice at once is always a mistake — open either block and remove
                  it. Two <em>different</em> groups sharing a room or a teacher is only a warning;
                  leave it if it is deliberate.
                </p>
              ) : null}
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
                  This branch has no open rooms, so there is nothing to book into. Assign a room to
                  it with the <strong>Rooms</strong> button, or pick another branch tab.
                </>
              )}
            </div>
          ) : null}

          <WeekBoard
            key={`${week}-${scope}-${mine}`}
            days={orderedWeekdays().map((d) => ({
              index: d.index,
              short: d.short,
              long: d.long,
              date: dates.get(d.index) ?? "",
            }))}
            today={today}
            initialDay={day}
            rooms={gridRooms}
            slots={branchSlots}
            dayStartMin={dayStartMin}
            dayEndMin={dayEndMin}
            groups={groupOptions}
            roomOptions={roomOptions}
            canEdit={canEdit}
            filter={teacherFilter}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            {unscheduled.length > 0 ? (
              <Card>
                <CardHead
                  title="Not on the timetable"
                  note={`${unscheduled.length} group${unscheduled.length === 1 ? "" : "s"} with no slot at all`}
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
                      note="Put this group on the timetable."
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
                  scope === "all" ? "" : ` at ${branchName.get(scope) ?? "this branch"}`
                }`}
              />
              {weekLessons.length === 0 ? (
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: SOFT,
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Nothing scheduled yet. Click any empty cell in the grid above — it opens the form
                  with that room, day and time already filled in.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {/* One chip per LESSON, not per day: a Mon/Wed/Fri group listed
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
                      <strong style={{ color: INK }}>{slot.groupName}</strong> ·{" "}
                      {describeSeries(slot)}
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
                A lesson is its <strong>set of days</strong>: a Mon/Wed/Fri course is one entry you
                edit once, stored as the three meetings you can see on the grid. Clashes and
                over-full rooms are flagged, never blocked — a deliberate double-booking is still a
                plan.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

const HAIRLINE = "#E4E2DC";

const weekBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 9,
  padding: "7px 12px",
  fontFamily: SANS,
  fontSize: 12.5,
  textDecoration: "none",
  border: `1px solid ${HAIRLINE}`,
  background: "#fff",
  color: "#4C4A63",
  lineHeight: 1.4,
};

/** A segment of the prev/next group: no border of its own, the group owns it. */
const stepBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 11px",
  border: 0,
  background: "transparent",
  color: "#4C4A63",
  textDecoration: "none",
};

/** The teacher's two-state filter chip. */
function toggle(on: boolean): React.CSSProperties {
  return {
    borderRadius: 20,
    padding: "7px 14px",
    fontFamily: SANS,
    fontSize: 12.5,
    textDecoration: "none",
    border: `1px solid ${on ? INDIGO : "#E4E2DC"}`,
    background: on ? INDIGO : "#fff",
    color: on ? "#fff" : "#4C4A63",
  };
}
