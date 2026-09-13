import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { attendanceRateFrom } from "@/lib/console/attendance-marks";
import { loadGroupDetail } from "@/lib/console/groups";
import { ENROLLED } from "@/lib/console/status";
import { createClient } from "@/lib/supabase/server";
import { SANS } from "@/components/console/crm-ui";
import { Board, V2, serifHead } from "../../ui";

export const dynamic = "force-dynamic";

/** The register's columns: a name, one square per session, a rate. */
const REGISTER_COLS = (sessions: number) =>
  `minmax(0, 1.4fr) repeat(${sessions}, minmax(0, 46px)) minmax(0, 72px)`;

/** A mark says its letter as well as its colour — colour alone is not a label,
 *  and on a touch screen the tooltip that carried the meaning never opens. */
const MARK: Record<string, { letter: string; bg: string; fg: string }> = {
  present: { letter: "P", bg: "#eaf5ee", fg: "#1f6b45" },
  late: { letter: "L", bg: "#fdf1e3", fg: "#9a5b16" },
  absent: { letter: "A", bg: "#fdeceb", fg: "#a13a2c" },
  excused: { letter: "E", bg: "#eceaf4", fg: "#413a63" },
  none: { letter: "·", bg: "#f4f3ee", fg: "#8b91a0" },
};

/**
 * The attendance register: the last dozen sessions, one square per student per
 * session. Two queries, and neither one runs unless somebody opens this tab —
 * which is the point of the split, because the marks table is the widest read
 * on the whole group screen and it was being fetched to render the roster.
 */
export default async function GroupAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const group = await loadGroupDetail(id);
  if (!group) notFound();
  const isAdmin = profile.role === "center_admin";
  if (!isAdmin && group.teacherId !== profile.id) notFound();

  const roster = group.members.filter((m) => ENROLLED.includes(m.status));
  const supabase = await createClient();

  // The last dozen registers for this group, oldest-to-newest across the row so
  // the strip reads left to right like a calendar.
  const { data: sessionRows } = await supabase
    .from("attendance_sessions")
    .select("id, held_on")
    .eq("group_id", group.id)
    .order("held_on", { ascending: false })
    .limit(12);
  const sessions = ((sessionRows ?? []) as { id: string; held_on: string }[]).reverse();

  const marks = new Map<string, Map<string, string>>();
  if (sessions.length > 0) {
    const { data: markRows } = await supabase
      .from("attendance_marks")
      .select("session_id, student_id, status")
      .in(
        "session_id",
        sessions.map((s) => s.id),
      );
    for (const m of (markRows ?? []) as {
      session_id: string;
      student_id: string;
      status: string;
    }[]) {
      const row = marks.get(m.student_id) ?? new Map<string, string>();
      row.set(m.session_id, m.status);
      marks.set(m.student_id, row);
    }
  }

  // The shared definition, not a fourth one. This used to be
  // `s !== "absent"`, which counted an excused lesson as attended and left it
  // in the denominator — so this page and the payroll page reported different
  // rates for the same group.
  const attendanceRate = (studentId: string) => {
    const row = marks.get(studentId);
    if (!row || row.size === 0) return null;
    return attendanceRateFrom(row.values());
  };

  return (
    <div style={{ marginTop: 18 }}>
      {/* THE REGISTER NOW SAYS WHAT IT MEANS. It was a row of coloured
          squares with no dates on them and no letters in them, so which
          lesson a mark belonged to, and what the colour stood for, were
          both only available on hover — and on a touch screen, not at all. */}
      <Board min={Math.max(640, 260 + sessions.length * 50 + 90)}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 20px",
            borderBottom: `1px solid ${V2.rule}`,
            flexWrap: "wrap",
          }}
        >
          <h3 style={serifHead}>Register</h3>
          <span style={{ fontFamily: SANS, fontSize: 13, color: V2.faint }}>
            P present · L late · A absent · E excused. A late arrival still counts as attended; an
            excused lesson counts as neither.
          </span>
          <Link
            href={`/console/attendance?group=${group.id}`}
            style={{
              marginLeft: "auto",
              padding: "11px 18px",
              borderRadius: 12,
              background: V2.indigo,
              color: "#fff",
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Mark today
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div
            style={{
              padding: "44px 20px",
              textAlign: "center",
              fontFamily: SANS,
              fontSize: 14,
              color: V2.faint,
            }}
          >
            No registers taken for this group yet — mark one and it fills in from there.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: REGISTER_COLS(sessions.length),
                alignItems: "center",
                gap: 8,
                padding: "13px 20px",
                borderBottom: `1px solid ${V2.rule}`,
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: ".07em",
                textTransform: "uppercase",
                color: V2.faint,
              }}
            >
              <span>Student</span>
              {sessions.map((sn) => (
                <span key={sn.id} title={sn.held_on}>
                  {sn.held_on.slice(8, 10)}
                </span>
              ))}
              <span style={{ textAlign: "right" }}>Rate</span>
            </div>
            {roster.map((m) => {
              const row = marks.get(m.id);
              const rate = attendanceRate(m.id);
              return (
                <div
                  key={m.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: REGISTER_COLS(sessions.length),
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 20px",
                    borderBottom: `1px solid ${V2.hair}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 15,
                      fontWeight: 600,
                      color: V2.ink,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.name}
                  </span>
                  {sessions.map((sn) => {
                    const status = row?.get(sn.id);
                    const mk = MARK[status ?? "none"] ?? MARK.none;
                    return (
                      <span
                        key={sn.id}
                        title={`${new Date(`${sn.held_on}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} · ${status ?? "not marked"}`}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 10,
                          display: "grid",
                          placeItems: "center",
                          fontFamily: SANS,
                          fontSize: 12,
                          fontWeight: 700,
                          background: mk.bg,
                          color: mk.fg,
                        }}
                      >
                        {mk.letter}
                      </span>
                    );
                  })}
                  <span
                    style={{
                      textAlign: "right",
                      fontFamily: SANS,
                      fontSize: 15,
                      fontWeight: 700,
                      color: rate == null ? V2.faint : V2.ink,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {rate == null ? "—" : `${rate}%`}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </Board>
    </div>
  );
}
