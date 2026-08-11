import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AMBER,
  BtnLink,
  Card,
  CardHead,
  Empty,
  FAINT,
  GREEN,
  INDIGO,
  initials,
  INK,
  Kpi,
  KpiRow,
  PageHead,
  SANS,
  SOFT,
  Stack,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroupDetail, loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

import { RegisterForm, type RegisterStudent } from "./register-form";

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
 * Attendance: pick a class on the left, mark the register on the right.
 *
 * There is no timetable in this product — no rooms, no recurring schedule — so
 * the left column lists the classes that exist rather than the sessions due
 * today, and the date is chosen explicitly. That is the honest version of the
 * design's session list: it does the same job (get me to the right register in
 * one click) without pretending to know when a class meets.
 */
export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; date?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const today = iso(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? (sp.date as string) : today;

  const supabase = await createClient();
  const { groups } = await loadGroups(profile);
  const activeId = sp.group && groups.some((g) => g.id === sp.group) ? sp.group : groups[0]?.id;

  // Which classes already have a register for this date — the left column's
  // state, and the only thing that separates "done" from "still open".
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("id, group_id, state, marked_at")
    .eq("held_on", date);
  const sessionOf = new Map(
    (sessions ?? []).map((s) => [s.group_id as string, s as { id: string; state: string }]),
  );

  const group = activeId ? await loadGroupDetail(activeId) : null;

  // Marks already recorded for the open class, so re-opening a saved register
  // shows what was actually put down rather than resetting to all-present.
  let saved: Record<string, "present" | "late" | "absent"> = {};
  let attendanceRate = new Map<string, number>();
  if (group) {
    const session = sessionOf.get(group.id);
    const [marksRes, rateRes] = await Promise.all([
      session
        ? supabase
            .from("attendance_marks")
            .select("student_id, status")
            .eq("session_id", session.id)
        : Promise.resolve({ data: null }),
      group.members.length > 0
        ? supabase
            .from("v_student_attendance")
            .select("student_id, rate_pct")
            .in(
              "student_id",
              group.members.map((m) => m.id),
            )
        : Promise.resolve({ data: null }),
    ]);
    saved = Object.fromEntries(
      ((marksRes.data ?? []) as { student_id: string; status: string }[]).map((m) => [
        m.student_id,
        m.status as "present" | "late" | "absent",
      ]),
    );
    attendanceRate = new Map(
      ((rateRes.data ?? []) as { student_id: string; rate_pct: number | null }[]).map((r) => [
        r.student_id,
        r.rate_pct ?? 0,
      ]),
    );
  }

  const students: RegisterStudent[] = (group?.members ?? []).map((m) => {
    const [tint, ink] = tintFor(m.name);
    const rate = attendanceRate.get(m.id);
    return {
      id: m.id,
      name: m.name,
      meta: rate != null ? `${rate}% attendance so far` : "no attendance recorded yet",
      initials: initials(m.name),
      tint,
      ink,
    };
  });

  const marked = groups.filter((g) => sessionOf.get(g.id)?.state === "marked").length;
  const open = groups.length - marked;

  const shift = (days: number) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return iso(d);
  };
  const href = (params: { group?: string; date?: string }) =>
    `/console/attendance?group=${params.group ?? activeId ?? ""}&date=${params.date ?? date}`;

  return (
    <div>
      <PageHead
        eyebrow="Daily"
        title="Attendance"
        subtitle={`${prettyDate(date)} · ${groups.length} class${groups.length === 1 ? "" : "es"} · ${open} register${open === 1 ? "" : "s"} still open.`}
        actions={
          <>
            <BtnLink href={href({ date: shift(-1) })} variant="ghost">
              ◀ Prev
            </BtnLink>
            <BtnLink href={href({ date: today })} variant="ghost">
              Today
            </BtnLink>
            <BtnLink href={href({ date: shift(1) })} variant="ghost">
              Next ▶
            </BtnLink>
          </>
        }
      />

      <KpiRow>
        <Kpi label="Classes" value={groups.length} sub="you can mark" />
        <Kpi label="Marked" value={marked} deltaTone="good" sub={`on ${prettyDate(date)}`} />
        <Kpi label="Still open" value={open} deltaTone={open > 0 ? "bad" : "good"} />
        <Kpi
          label="In this register"
          value={students.length}
          sub={group ? group.name : "no class selected"}
        />
      </KpiRow>

      <div
        className="cn-split"
        style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}
      >
        {/* ── the classes ─────────────────────────────────────────────────── */}
        <Card flush style={{ alignSelf: "start" }}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #F0EEE9",
              fontFamily: SANS,
              fontSize: 12,
              letterSpacing: ".07em",
              color: "#8B8999",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Classes
          </div>
          {groups.map((g) => {
            const session = sessionOf.get(g.id);
            const on = g.id === activeId;
            const mark = session?.state === "marked" ? GREEN : AMBER;
            return (
              <Link
                key={g.id}
                href={href({ group: g.id })}
                className="cn-row"
                style={{
                  display: "block",
                  padding: "12px 16px",
                  borderBottom: "1px solid #F5F4F0",
                  borderLeft: `3px solid ${on ? INDIGO : mark}`,
                  background: on ? "#F7F7FC" : "#fff",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 500,
                      color: INK,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.name}
                  </span>
                  <span style={{ fontFamily: SANS, fontSize: 12, color: SOFT, flex: "none" }}>
                    {g.memberCount}
                  </span>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, color: "#93919F", marginTop: 3 }}>
                  {g.teacherName ?? "No teacher"} ·{" "}
                  {session?.state === "marked" ? "Marked" : "Register open"}
                </div>
              </Link>
            );
          })}
          {groups.length === 0 ? <Empty>No classes yet.</Empty> : null}
        </Card>

        {/* ── the register ────────────────────────────────────────────────── */}
        <Stack>
          <Card flush>
            {group ? (
              <>
                <CardHead
                  title={group.name}
                  divided
                  note={`${prettyDate(date)} · ${group.teacherName ?? "no teacher"}`}
                  badge={
                    sessionOf.get(group.id)?.state === "marked" ? (
                      <span
                        style={{ fontFamily: SANS, fontSize: 11.5, color: GREEN, fontWeight: 600 }}
                      >
                        Saved
                      </span>
                    ) : null
                  }
                />
                <RegisterForm
                  key={`${group.id}-${date}`}
                  groupId={group.id}
                  heldOn={date}
                  students={students}
                  initial={saved}
                />
              </>
            ) : (
              <Empty>
                Create a class first — a register belongs to one, and there are none to mark yet.
              </Empty>
            )}
          </Card>

          <p style={{ fontFamily: SANS, fontSize: 12, color: FAINT, margin: 0, lineHeight: 1.6 }}>
            One register per class per day. Saving again corrects the same one rather than adding a
            second, and a late arrival still counts as attended in the rate.
          </p>
        </Stack>
      </div>
    </div>
  );
}
