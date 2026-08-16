import { notFound, redirect } from "next/navigation";

import {
  Card,
  CardHead,
  Empty,
  GREEN,
  initials,
  Kpi,
  KpiRow,
  PageHead,
  SANS,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { loadGroupDetail } from "@/lib/console/groups";
import { centerNow, lockDateFor, registerIsLocked } from "@/lib/console/schedule";
import { ENROLLED } from "@/lib/console/status";
import { createClient } from "@/lib/supabase/server";

import { DateStrip } from "../date-strip";
import { RegisterForm, type RegisterStudent } from "../register-form";
import { CancelLesson, CancelledBanner, LockedBanner } from "./lesson-state";

export const dynamic = "force-dynamic";

/** Same tint cycle the rest of the console uses, so a person keeps their colour. */
const AVATARS: [string, string][] = [
  ["#DEDDF6", "#3B38B0"],
  ["#E7F1EA", "#16794C"],
  ["#FBEEE0", "#A9721F"],
  ["#F7E4E2", "#A63A30"],
  ["#E4EDF7", "#2F5D8C"],
  ["#EFE7F5", "#6B44A2"],
];
function tintFor(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATARS[Math.abs(h) % AVATARS.length];
}

const prettyDate = (s: string) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

/**
 * Attendance, step two: the register for one class on one day.
 *
 * Its own route rather than a panel beside the class list, so the URL names
 * what you are marking. A teacher who bookmarks the Wednesday register, or
 * sends it to a colleague, gets the register — not the list with something else
 * pre-opened.
 */
export default async function ClassRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { groupId } = await params;
  const sp = await searchParams;
  const settings = await loadCenterSettings();
  // The center's day. `new Date()` is UTC on Vercel, which lands a Tashkent
  // teacher on yesterday's register for the first five hours of every day.
  const today = centerNow(settings.timezone).date;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? (sp.date as string) : today;

  // RLS hides other teachers' classes, so a miss here is a 404 rather than a
  // permission message — the same rule the group page follows.
  const group = await loadGroupDetail(groupId);
  if (!group) notFound();

  const supabase = await createClient();
  const [{ data: session }, { data: cancelled }] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("id, state, unlocked_until")
      .eq("group_id", groupId)
      .eq("held_on", date)
      .maybeSingle(),
    supabase
      .from("lesson_cancellations")
      .select("reason")
      .eq("group_id", groupId)
      .eq("held_on", date)
      .maybeSingle(),
  ]);

  const locked = registerIsLocked(
    date,
    (session?.unlocked_until as string | null) ?? null,
    new Date(),
  );

  // Students who have LEFT are not on the register. Their past marks stay
  // exactly where they are; what they must not do is sit in tomorrow's
  // register as a permanent absence.
  const roster = group.members.filter((m) => ENROLLED.includes(m.status));
  const memberIds = roster.map((m) => m.id);
  const [marksRes, rateRes] = await Promise.all([
    session
      ? supabase
          .from("attendance_marks")
          .select("student_id, status")
          .eq("session_id", session.id as string)
      : Promise.resolve({ data: null }),
    memberIds.length > 0
      ? supabase
          .from("v_student_attendance")
          .select("student_id, rate_pct")
          .in("student_id", memberIds)
      : Promise.resolve({ data: null }),
  ]);

  // Re-opening a saved register shows what was actually put down, not a fresh
  // all-present sheet — otherwise correcting one mark silently rewrites the rest.
  const saved: Record<string, "present" | "late" | "absent" | "excused"> = Object.fromEntries(
    ((marksRes.data ?? []) as { student_id: string; status: string }[]).map((m) => [
      m.student_id,
      m.status as "present" | "late" | "absent" | "excused",
    ]),
  );
  const rateOf = new Map(
    ((rateRes.data ?? []) as { student_id: string; rate_pct: number | null }[]).map((r) => [
      r.student_id,
      r.rate_pct,
    ]),
  );

  const students: RegisterStudent[] = roster.map((m) => {
    const [tint, ink] = tintFor(m.name);
    const rate = rateOf.get(m.id);
    return {
      id: m.id,
      name: m.name,
      meta: rate != null ? `${rate}% attendance so far` : "no attendance recorded yet",
      initials: initials(m.name),
      tint,
      ink,
    };
  });

  const marked = Object.keys(saved).length;
  // "In" is present-or-late only. An excused student was not in the room; they
  // simply do not count against this lesson either way.
  const present = Object.values(saved).filter((s) => s === "present" || s === "late").length;
  const absent = Object.values(saved).filter((s) => s === "absent").length;

  return (
    <div>
      <PageHead
        back={{ href: `/console/attendance?date=${date}`, label: "All groups" }}
        title={group.name}
        subtitle={`${prettyDate(date)} · ${group.teacherName ?? "no teacher"} · ${roster.length} student${roster.length === 1 ? "" : "s"}`}
        actions={
          session?.state === "marked" ? (
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: GREEN, fontWeight: 600 }}>
              Saved — editing corrects it
            </span>
          ) : undefined
        }
      />

      <DateStrip date={date} today={today} groupId={groupId} />

      {cancelled ? (
        <CancelledBanner
          groupId={groupId}
          heldOn={date}
          reason={cancelled.reason as string}
        />
      ) : locked ? (
        <LockedBanner
          sessionId={(session?.id as string | null) ?? null}
          lockedOn={prettyDate(lockDateFor(date))}
          canUnlock={profile.role === "center_admin"}
        />
      ) : null}

      <KpiRow>
        <Kpi
          label="On the roster"
          value={roster.length}
          sub={
            group.members.length > roster.length
              ? `${group.members.length - roster.length} left`
              : undefined
          }
        />
        <Kpi label="In" value={marked ? present : "—"} deltaTone="good" sub="present or late" />
        <Kpi label="Absent" value={marked ? absent : "—"} deltaTone={absent > 0 ? "bad" : "flat"} />
        <Kpi
          label="Register"
          value={cancelled ? "Cancelled" : locked ? "Closed" : session?.state === "marked" ? "Marked" : "Open"}
          sub={prettyDate(date)}
        />
      </KpiRow>

      <Card flush>
        <CardHead
          title="Mark the register"
          divided
          note={
            cancelled
              ? "This lesson was cancelled — nothing here counts."
              : locked
                ? "Closed. This is the record as it was left."
                : "Everyone starts present — change only the ones who weren't."
          }
          actions={
            !cancelled && !locked ? <CancelLesson groupId={groupId} heldOn={date} /> : undefined
          }
        />
        {students.length > 0 ? (
          <RegisterForm
            key={`${groupId}-${date}`}
            groupId={groupId}
            heldOn={date}
            students={students}
            initial={saved}
            locked={locked || cancelled != null}
          />
        ) : (
          <Empty action={{ href: `/console/groups/${groupId}`, label: "Add students →" }}>
            Nobody is enrolled in this group yet, so there is nothing to mark.
          </Empty>
        )}
      </Card>
    </div>
  );
}
