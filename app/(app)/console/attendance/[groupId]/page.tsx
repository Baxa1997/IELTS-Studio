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
import { loadGroupDetail } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

import { DateStrip } from "../date-strip";
import { RegisterForm, type RegisterStudent } from "../register-form";

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

const iso = (d: Date) => d.toISOString().slice(0, 10);
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
  const today = iso(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? (sp.date as string) : today;

  // RLS hides other teachers' classes, so a miss here is a 404 rather than a
  // permission message — the same rule the group page follows.
  const group = await loadGroupDetail(groupId);
  if (!group) notFound();

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("id, state")
    .eq("group_id", groupId)
    .eq("held_on", date)
    .maybeSingle();

  const memberIds = group.members.map((m) => m.id);
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
  const saved: Record<string, "present" | "late" | "absent"> = Object.fromEntries(
    ((marksRes.data ?? []) as { student_id: string; status: string }[]).map((m) => [
      m.student_id,
      m.status as "present" | "late" | "absent",
    ]),
  );
  const rateOf = new Map(
    ((rateRes.data ?? []) as { student_id: string; rate_pct: number | null }[]).map((r) => [
      r.student_id,
      r.rate_pct,
    ]),
  );

  const students: RegisterStudent[] = group.members.map((m) => {
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
  const present = Object.values(saved).filter((s) => s !== "absent").length;
  const absent = Object.values(saved).filter((s) => s === "absent").length;

  return (
    <div>
      <PageHead
        back={{ href: `/console/attendance?date=${date}`, label: "All classes" }}
        title={group.name}
        subtitle={`${prettyDate(date)} · ${group.teacherName ?? "no teacher"} · ${group.members.length} student${group.members.length === 1 ? "" : "s"}`}
        actions={
          session?.state === "marked" ? (
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: GREEN, fontWeight: 600 }}>
              Saved — editing corrects it
            </span>
          ) : undefined
        }
      />

      <DateStrip date={date} today={today} groupId={groupId} />

      <KpiRow>
        <Kpi label="On the roster" value={group.members.length} />
        <Kpi label="In" value={marked ? present : "—"} deltaTone="good" sub="present or late" />
        <Kpi label="Absent" value={marked ? absent : "—"} deltaTone={absent > 0 ? "bad" : "flat"} />
        <Kpi
          label="Register"
          value={session?.state === "marked" ? "Marked" : "Open"}
          sub={prettyDate(date)}
        />
      </KpiRow>

      <Card flush>
        <CardHead
          title="Mark the register"
          divided
          note="Everyone starts present — change only the ones who weren't."
        />
        {students.length > 0 ? (
          <RegisterForm
            key={`${groupId}-${date}`}
            groupId={groupId}
            heldOn={date}
            students={students}
            initial={saved}
          />
        ) : (
          <Empty>Nobody is enrolled in this class yet, so there is nothing to mark.</Empty>
        )}
      </Card>
    </div>
  );
}
