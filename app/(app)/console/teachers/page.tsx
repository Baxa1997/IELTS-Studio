import { redirect } from "next/navigation";

import {
  AMBER,
  Bar,
  Card,
  CardHead,
  Empty,
  fieldStyle,
  GREEN,
  Kpi,
  KpiRow,
  PageHead,
  PersonCell,
  SANS,
  Table,
  Tag,
  TD,
  THead,
  Toolbar,
  TRow,
} from "@/components/console/crm-ui";
import { PanelButton } from "@/components/console/console-chrome";
import { requireOrgUser } from "@/lib/auth";
import { loadTeachers } from "@/lib/console/people";
import { loadCenterReport } from "@/lib/console/reports";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** The design's "Sort: load ▾". Load is what an admin scans this table for. */
const SORTS = {
  load: { label: "load", cmp: (a: Row, b: Row) => b.students - a.students },
  band: { label: "band", cmp: (a: Row, b: Row) => (b.band ?? -1) - (a.band ?? -1) },
  attendance: {
    label: "attendance",
    cmp: (a: Row, b: Row) => (b.attendance ?? -1) - (a.attendance ?? -1),
  },
  name: { label: "name", cmp: (a: Row, b: Row) => a.name.localeCompare(b.name) },
} as const;
type SortKey = keyof typeof SORTS;

/** A teacher row with its roll-ups already resolved, so sorting is a plain compare. */
interface Row {
  id: string;
  name: string;
  username: string | null;
  groups: number;
  students: number;
  band: number | null;
  attendance: number | null;
}

const COLS = "2.2fr 1fr .8fr .9fr 1.2fr 1fr 40px";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { profile } = await requireOrgUser();
  // Teachers manage classes, not colleagues.
  if (profile.role !== "center_admin") redirect("/console");

  const sp = await searchParams;
  const query = sp.q?.trim().toLowerCase() || undefined;
  const sort: SortKey = (sp.sort && sp.sort in SORTS ? sp.sort : "load") as SortKey;

  const supabase = await createClient();
  const [teachers, report, groupsRes, membersRes, ratesRes] = await Promise.all([
    loadTeachers(),
    loadCenterReport({ role: profile.role, profileId: profile.id }),
    supabase.from("groups").select("id, teacher_id"),
    supabase.from("group_members").select("group_id, student_id"),
    supabase.from("v_student_attendance").select("student_id, rate_pct"),
  ]);

  // Attendance rolled up to the teacher: the mean rate of the students in the
  // classes they own. A student in two of their classes counts once.
  const teacherOfGroup = new Map(
    ((groupsRes.data ?? []) as { id: string; teacher_id: string | null }[]).map((g) => [
      g.id,
      g.teacher_id,
    ]),
  );
  const rateOf = new Map(
    ((ratesRes.data ?? []) as { student_id: string; rate_pct: number | null }[]).map((r) => [
      r.student_id,
      r.rate_pct,
    ]),
  );
  const studentsOfTeacher = new Map<string, Set<string>>();
  for (const m of (membersRes.data ?? []) as { group_id: string; student_id: string }[]) {
    const teacherId = teacherOfGroup.get(m.group_id);
    if (!teacherId) continue;
    const set = studentsOfTeacher.get(teacherId) ?? new Set<string>();
    set.add(m.student_id);
    studentsOfTeacher.set(teacherId, set);
  }

  // Roll the class report up to the person who runs the classes. Joined on
  // teacher id, not name — two teachers can share a name.
  const stats = new Map<string, { bands: number[]; completions: number[] }>();
  for (const g of report.groups) {
    if (!g.teacherId) continue;
    const s = stats.get(g.teacherId) ?? { bands: [], completions: [] };
    if (g.averageBand != null) s.bands.push(g.averageBand);
    if (g.completionPct != null) s.completions.push(g.completionPct);
    stats.set(g.teacherId, s);
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const attendanceOf = (teacherId: string) =>
    mean(
      [...(studentsOfTeacher.get(teacherId) ?? [])]
        .map((id) => rateOf.get(id))
        .filter((r): r is number => r != null),
    );

  const resolved: Row[] = teachers.map((t) => ({
    id: t.id,
    name: t.name,
    username: t.username,
    groups: t.groups,
    students: t.students,
    band: mean(stats.get(t.id)?.bands ?? []),
    attendance: attendanceOf(t.id),
  }));

  const rows = resolved
    .filter((t) =>
      query
        ? t.name.toLowerCase().includes(query) || (t.username ?? "").toLowerCase().includes(query)
        : true,
    )
    .sort(SORTS[sort].cmp);

  const withoutGroups = teachers.filter((t) => t.groups === 0).length;
  const totalGroups = teachers.reduce((n, t) => n + t.groups, 0);
  const totalStudents = teachers.reduce((n, t) => n + t.students, 0);
  const allBands = resolved.map((t) => t.band).filter((b): b is number => b != null);
  // The design's "100% of the center" line: every learner is in somebody's class
  // only when this matches the roll.
  const centerStudents = new Set(
    ((membersRes.data ?? []) as { student_id: string }[]).map((m) => m.student_id),
  ).size;

  return (
    <div>
      <PageHead
        eyebrow="Staff"
        title="Teachers"
        // subtitle={`${teachers.length} on staff · each teacher sees only the groups assigned to them.`}
        actions={<PanelButton panel="teacher">+ Add teacher</PanelButton>}
      />

      <KpiRow>
        <Kpi
          label="Teachers"
          value={teachers.length}
          sub={
            mean(allBands) != null ? `avg band ${mean(allBands)?.toFixed(1)}` : "nothing graded yet"
          }
        />
        <Kpi
          label="Groups they run"
          value={totalGroups}
          sub={teachers.length ? `avg ${(totalGroups / teachers.length).toFixed(1)} each` : "—"}
        />
        <Kpi
          label="Students covered"
          value={totalStudents}
          sub={
            centerStudents > 0
              ? `${Math.round((totalStudents / centerStudents) * 100)}% of the center`
              : "no students yet"
          }
        />
        <Kpi
          label="Without a group"
          value={withoutGroups}
          deltaTone="bad"
          sub={
            withoutGroups > 0
              ? (teachers.find((t) => t.groups === 0)?.name ?? "")
              : "everyone teaching"
          }
        />
      </KpiRow>

      <Card flush>
        {/* <CardHead
          title="Your teachers"
          divided
          note="students counted here are the ones each teacher can actually see"
        /> */}
        <Toolbar>
          {/* Plain GET form — no client bundle for a filter this small. */}
          <form
            method="GET"
            style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}
          >
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search teacher…"
              aria-label="Search teacher"
              style={{ ...fieldStyle, flex: 1, minWidth: 170, maxWidth: 260 }}
            />
            <select name="sort" defaultValue={sort} aria-label="Sort" style={fieldStyle}>
              {Object.entries(SORTS).map(([value, o]) => (
                <option key={value} value={value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="cn-btn cn-btn--ghost"
              style={{ ...fieldStyle, background: "#fff", cursor: "pointer", fontWeight: 500 }}
            >
              Apply
            </button>
          </form>
          <span style={{ fontFamily: SANS, fontSize: 12, color: "#93919F" }}>
            {rows.length} shown{rows.length !== teachers.length ? ` of ${teachers.length}` : ""}
          </span>
        </Toolbar>

        <Table cols={COLS} minWidth={760}>
          <THead
            cols={COLS}
            labels={["Teacher", "Groups", "Students", "Avg band", "Attendance", "Status", ""]}
          />
          {rows.map((t) => {
            const { band, attendance } = t;
            return (
              <TRow key={t.id} cols={COLS}>
                <PersonCell name={t.name} meta={t.username ?? "no login"} />
                <TD>{t.groups || "—"}</TD>
                <TD tone={t.students === 0 ? "faint" : "body"}>{t.students || "—"}</TD>
                <TD tone="ink" weight={600}>
                  {band?.toFixed(1) ?? "—"}
                </TD>
                <TD>
                  {attendance == null ? (
                    <span style={{ color: "#93919F" }}>—</span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Bar
                        pct={attendance}
                        width={54}
                        fill={attendance >= 90 ? GREEN : attendance >= 80 ? AMBER : "#E0A9A3"}
                      />
                      <span style={{ fontSize: 12 }}>{Math.round(attendance)}%</span>
                    </span>
                  )}
                </TD>
                <TD>
                  {t.groups === 0 ? (
                    <Tag tone="amber">No class yet</Tag>
                  ) : t.students === 0 ? (
                    <Tag tone="neutral">No students</Tag>
                  ) : (
                    <Tag tone="green">Active</Tag>
                  )}
                </TD>
                <TD align="right" tone="faint">
                  ⋯
                </TD>
              </TRow>
            );
          })}
          {rows.length === 0 ? (
            <Empty>
              {teachers.length === 0
                ? "No teachers yet. Use + Add teacher above and they can start building classes."
                : "Nobody matches that search."}
            </Empty>
          ) : null}
        </Table>
      </Card>
    </div>
  );
}
