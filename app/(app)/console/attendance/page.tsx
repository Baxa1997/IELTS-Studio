import Link from "next/link";
import { redirect } from "next/navigation";
import { FiBell, FiCheckCircle, FiChevronRight, FiClock, FiUsers } from "react-icons/fi";

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
import { requireOrgUser } from "@/lib/auth";
import { loadAttendanceClasses } from "@/lib/console/attendance";
import { loadAlertSettings } from "@/lib/console/alerts";

import { AlertSettingsForm } from "./alert-settings-form";
import { DateStrip } from "./date-strip";

export const dynamic = "force-dynamic";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Attendance, step one: which class?
 *
 * WHAT THIS REPLACED. A 300px column of class names beside a register, with the
 * first class auto-opened. On a teacher with one class that was fine; on a
 * center with fifteen it was a scrollable list of near-identical rows, and the
 * register on the right belonged to whichever class happened to sort first —
 * so the first thing you did was find your class and click it anyway.
 *
 * Now the classes ARE the page, and picking one goes to its register. That is
 * one more click for a teacher with a single class and several fewer for
 * everyone else, and it makes room for the thing the list never showed: which
 * classes actually meet today, and which of those still need marking.
 */
export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const today = iso(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? (sp.date as string) : today;

  const isAdmin = profile.role === "center_admin";
  const [classes, alerts] = await Promise.all([
    loadAttendanceClasses(profile, date),
    isAdmin ? loadAlertSettings() : Promise.resolve(null),
  ]);

  const due = classes.filter((c) => c.meetsToday);
  const outstanding = due.filter((c) => c.state === "open");
  const marked = classes.filter((c) => c.state === "marked").length;

  return (
    <div>
      <PageHead
        title="Attendance"
        subtitle={
          due.length > 0
            ? `${outstanding.length} of ${due.length} register${due.length === 1 ? "" : "s"} still to mark.`
            : "Nothing is timetabled for this day — you can still mark any class."
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

      <KpiRow>
        <Kpi label="Timetabled today" value={due.length} sub={`of ${classes.length} classes`} />
        <Kpi
          label="Still to mark"
          value={outstanding.length}
          deltaTone={outstanding.length > 0 ? "bad" : "good"}
        />
        <Kpi label="Marked" value={marked} deltaTone="good" sub="on this day" />
        <Kpi
          label="Students covered"
          value={classes.filter((c) => c.state === "marked").reduce((a, c) => a + c.students, 0)}
          sub="in the saved registers"
        />
      </KpiRow>

      {classes.length === 0 ? (
        <Card>
          <Empty>
            No classes yet — a register belongs to one, so create a class and it appears here.
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
          {classes.map((c) => (
            <ClassCard key={c.id} cls={c} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassCard({
  cls,
  date,
}: {
  cls: Awaited<ReturnType<typeof loadAttendanceClasses>>[number];
  date: string;
}) {
  const done = cls.state === "marked";
  // Scheduled-and-unmarked is the only state that needs chasing, so it is the
  // only one that gets a coloured edge. Everything else stays quiet.
  const accent = done ? GREEN : cls.meetsToday ? AMBER : "#E4E2DC";

  return (
    <Link
      href={`/console/attendance/${cls.id}?date=${date}`}
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
            }}
          >
            {cls.name}
          </span>
          <span
            style={{ display: "block", fontFamily: SANS, fontSize: 12, color: FAINT, marginTop: 2 }}
          >
            {cls.teacherName ?? "No teacher"}
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
          {cls.students}
        </span>
        {cls.timeLabel ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <FiClock size={13} aria-hidden />
            {cls.timeLabel}
          </span>
        ) : null}
        {cls.ratePct != null ? <span>{cls.ratePct}% overall</span> : null}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid #F2F0EB",
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontFamily: SANS,
          fontSize: 12.5,
          fontWeight: 600,
          color: done ? GREEN : cls.meetsToday ? AMBER : FAINT,
        }}
      >
        {done ? (
          <>
            <FiCheckCircle size={14} aria-hidden />
            Marked
            {cls.presentToday != null ? (
              <span style={{ fontWeight: 400, color: MUTED }}>
                — {cls.presentToday} of {cls.students} in
              </span>
            ) : null}
          </>
        ) : cls.meetsToday ? (
          <>
            <FiClock size={14} aria-hidden />
            Register open
          </>
        ) : (
          <span style={{ fontWeight: 400 }}>Not timetabled today — mark anyway</span>
        )}
        <span style={{ marginLeft: "auto", color: INDIGO, fontWeight: 600 }}>
          {done ? "Review" : "Mark"}
        </span>
      </div>
    </Link>
  );
}
