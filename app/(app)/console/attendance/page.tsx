import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FiBell,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiLock,
  FiSlash,
  FiUsers,
} from "react-icons/fi";

import {
  AMBER,
  Card,
  Empty,
  FAINT,
  GREEN,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  PageHead,
  SANS,
} from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { ScheduleTabs } from "@/components/console/schedule-tabs";
import { requireOrgUser } from "@/lib/auth";
import { loadDay } from "@/lib/console/attendance";
import { loadAlertSettings } from "@/lib/console/alerts";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { centerNow, registersToMark, type DayLesson } from "@/lib/console/schedule";

import { AlertSettingsForm } from "./alert-settings-form";
import { DateStrip } from "./date-strip";

export const dynamic = "force-dynamic";

/**
 * Attendance, step one: which group?
 *
 * WHAT THIS REPLACED. A 300px column of group names beside a register, with the
 * first one auto-opened. On a teacher with one group that was fine; on a center
 * with fifteen it was a scrollable list of near-identical rows, and the register
 * on the right belonged to whichever group happened to sort first — so the first
 * thing you did was find yours and click it anyway.
 *
 * Now the groups ARE the page, and picking one goes to its register. The day's
 * shape comes from `loadDay`, the same function the Overview reads, so the two
 * pages can no longer disagree about what is on today.
 *
 * This page is OPERATIONAL ONLY — mark today, jump to a date. Attendance
 * analysis belongs on the group page and in Results, where there is room to
 * qualify it.
 */
export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const settings = await loadCenterSettings();
  // The center's day, not the server's. A UTC "today" shows yesterday's
  // register until 05:00 in the market this is sold into.
  const today = centerNow(settings.timezone).date;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? (sp.date as string) : today;

  const isAdmin = profile.role === "center_admin";
  const [day, alerts] = await Promise.all([
    loadDay(profile, date),
    isAdmin ? loadAlertSettings() : Promise.resolve(null),
  ]);

  const lessons = day.lessons;
  const scheduled = lessons.filter((l) => l.scheduled && !l.cancelledReason);
  const outstanding = scheduled.filter((l) => l.state === "open");
  const overdue = registersToMark(day, day.timezone);
  const marked = lessons.filter((l) => l.state === "marked").length;

  return (
    <div>
      <ScheduleTabs active="attendance" />
      <PageHead
        title="Attendance"
        subtitle={
          day.holiday
            ? `${day.holiday.name} — the center is closed, so no registers are expected.`
            : scheduled.length > 0
              ? `${outstanding.length} of ${scheduled.length} register${scheduled.length === 1 ? "" : "s"} still to mark.`
              : "Nothing is timetabled for this day — you can still mark any group."
        }
        actions={
          isAdmin && alerts ? (
            <Drawer
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <FiBell size={14} aria-hidden />
                  Absence alerts
                </span>
              }
              variant="ghost"
              eyebrow="Attendance"
              title="Absence alerts"
              note="Who gets told when a student misses a lesson."
              width={520}
            >
              <AlertSettingsForm settings={alerts} />
            </Drawer>
          ) : undefined
        }
      />

      <DateStrip date={date} today={today} />

      {day.holiday ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            marginBottom: 14,
            background: "#FDF2E3",
            border: "1px solid #F0DCBB",
            borderRadius: 10,
            fontFamily: SANS,
            fontSize: 13,
            color: "#8A5A12",
          }}
        >
          <FiSlash size={15} aria-hidden />
          <span>
            <strong style={{ fontWeight: 600 }}>{day.holiday.name}</strong> — the center is closed.
            No lessons run and no registers are expected.
          </span>
        </div>
      ) : null}

      <KpiRow>
        <Kpi
          label="Timetabled"
          value={scheduled.length}
          sub={`of ${lessons.length} group${lessons.length === 1 ? "" : "s"}`}
        />
        <Kpi
          label="Still to mark"
          value={outstanding.length}
          deltaTone={outstanding.length > 0 ? "bad" : "good"}
          delta={overdue.length > 0 ? `${overdue.length} already finished` : undefined}
        />
        <Kpi label="Marked" value={marked} deltaTone="good" sub="on this day" />
        <Kpi
          label="Students covered"
          value={lessons.filter((l) => l.state === "marked").reduce((a, l) => a + l.students, 0)}
          sub="in the saved registers"
        />
      </KpiRow>

      {lessons.length === 0 ? (
        <Card>
          <Empty action={{ href: "/console/groups", label: "Create a group →" }}>
            No groups yet — a register belongs to one.
          </Empty>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {lessons.map((l) => (
            <LessonCard key={l.groupId} lesson={l} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonCard({ lesson, date }: { lesson: DayLesson; date: string }) {
  const done = lesson.state === "marked";
  const cancelled = lesson.cancelledReason != null;
  // Scheduled-and-unmarked is the only state that needs chasing, so it is the
  // only one that gets a coloured edge. Everything else stays quiet.
  const accent = cancelled ? "#C5C4BE" : done ? GREEN : lesson.scheduled ? AMBER : "#C5C4BE";

  return (
    <Link
      href={`/console/attendance/${lesson.groupId}?date=${date}`}
      className="cn-row"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        background: "#fff",
        border: "1px solid #E9E7E1",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        padding: "14px 16px",
        boxShadow: "0 1px 2px rgba(22,22,46,.04)",
        opacity: cancelled ? 0.72 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontFamily: SANS,
              fontSize: 14.5,
              fontWeight: 600,
              color: INK,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: cancelled ? "line-through" : "none",
            }}
          >
            {lesson.groupName}
          </span>
          <span
            style={{ display: "block", fontFamily: SANS, fontSize: 12, color: FAINT, marginTop: 2 }}
          >
            {lesson.teacherName ?? "No teacher"}
            {lesson.roomName ? ` · ${lesson.roomName}` : ""}
          </span>
        </span>
        <FiChevronRight size={16} color={FAINT} aria-hidden style={{ marginTop: 3 }} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 12,
          fontFamily: SANS,
          fontSize: 12.5,
          color: MUTED,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <FiUsers size={13} aria-hidden />
          {lesson.students}
        </span>
        {lesson.timeLabel ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <FiClock size={13} aria-hidden />
            {lesson.timeLabel}
          </span>
        ) : null}
        {lesson.ratePct != null ? <span>{lesson.ratePct}% overall</span> : null}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid #D4D3CE",
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontFamily: SANS,
          fontSize: 12.5,
          fontWeight: 600,
          color: cancelled ? FAINT : done ? GREEN : lesson.scheduled ? AMBER : FAINT,
        }}
      >
        {cancelled ? (
          <>
            <FiSlash size={14} aria-hidden />
            Cancelled
            <span style={{ fontWeight: 400, color: MUTED }}>— {lesson.cancelledReason}</span>
          </>
        ) : done ? (
          <>
            <FiCheckCircle size={14} aria-hidden />
            Marked
            {lesson.presentToday != null ? (
              <span style={{ fontWeight: 400, color: MUTED }}>
                — {lesson.presentToday} of {lesson.students} in
              </span>
            ) : null}
          </>
        ) : lesson.locked ? (
          <>
            <FiLock size={14} aria-hidden />
            <span style={{ fontWeight: 400 }}>Closed — never marked</span>
          </>
        ) : lesson.scheduled ? (
          <>
            <FiClock size={14} aria-hidden />
            Register open
          </>
        ) : (
          <span style={{ fontWeight: 400 }}>Not timetabled today — mark anyway</span>
        )}
        <span style={{ marginLeft: "auto", color: INDIGO, fontWeight: 600 }}>
          {done ? "Review" : cancelled ? "Open" : "Mark"}
        </span>
      </div>
    </Link>
  );
}
