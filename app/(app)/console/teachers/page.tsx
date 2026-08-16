import { redirect } from "next/navigation";

import {
  AMBER,
  Bar,
  Card,
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
import { loadSubjects, loadTeacherSubjects } from "@/lib/console/subjects";
import { requireOrgUser } from "@/lib/auth";
import { loadTeachers } from "@/lib/console/people";
import { loadCenterReport } from "@/lib/console/reports";
import { createClient } from "@/lib/supabase/server";

import { TeacherSubjectsCell } from "./teacher-subjects-cell";

export const dynamic = "force-dynamic";

/** The design's "Sort: load ▾". Load is what an admin scans this table for. */
const SORTS = {
  load: { label: "load", cmp: (a: Row, b: Row) => b.students - a.students },
  practices: { label: "practice set", cmp: (a: Row, b: Row) => b.practices - a.practices },
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
  role: "teacher" | "administrator";
  groups: number;
  students: number;
  practices: number;
  attendance: number | null;
}

const COLS = "2fr 1.3fr .7fr .7fr .8fr 1.1fr .9fr 40px";

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
  const [teachers, report, groupsRes, membersRes, ratesRes, subjects, teacherSubjects] =
    await Promise.all([
      loadTeachers(),
      loadCenterReport({ role: profile.role, profileId: profile.id }),
      supabase.from("groups").select("id, teacher_id"),
      supabase.from("group_members").select("group_id, student_id"),
      supabase.from("v_student_attendance").select("student_id, rate_pct"),
      loadSubjects(),
      loadTeacherSubjects(),
    ]);

  // Retired subjects still SHOW on a teacher who has one (the fact is true), but
  // are not offered when picking — the same rule the group form follows.
  const subjectChoices = subjects
    .filter((s) => s.active)
    .map((s) => ({ id: s.id, name: s.name, color: s.color }));
  const isOwner = profile.role === "center_admin";

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
  //
  // NO BAND COLUMN. It used to average whatever skills a teacher's students
  // happened to practise, across as few as one essay, and print it beside their
  // name — a number that reads as a performance rating and is not one. What a
  // teacher is actually accountable for is how much practice they set and
  // whether it gets done; both are counted here. (Marking turnaround, the
  // fairest of the three, arrives with the final-band field in Phase 2.)
  const stats = new Map<string, { practices: number; completions: number[] }>();
  for (const g of report.groups) {
    if (!g.teacherId) continue;
    const s = stats.get(g.teacherId) ?? { practices: 0, completions: [] };
    s.practices += g.assignments;
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
    role: t.role,
    groups: t.groups,
    students: t.students,
    practices: stats.get(t.id)?.practices ?? 0,
    attendance: attendanceOf(t.id),
  }));

  const rows = resolved
    .filter((t) =>
      query
        ? t.name.toLowerCase().includes(query) || (t.username ?? "").toLowerCase().includes(query)
        : true,
    )
    .sort(SORTS[sort].cmp);

  // The KPI strip is about TEACHING capacity, so it counts teachers only. An
  // administrator owns no classes by design; letting them into these figures
  // would deflate "avg groups each" and, worse, put them in the amber
  // "Without a group" tile as though something needed fixing.
  const teaching = teachers.filter((t) => t.role === "teacher");
  const withoutGroups = teaching.filter((t) => t.groups === 0).length;
  const totalGroups = teaching.reduce((n, t) => n + t.groups, 0);
  const totalStudents = teaching.reduce((n, t) => n + t.students, 0);
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
        actions={
          <>
            {/* Inviting by link used to be a button in the topbar of every
                console page. It belongs here: this is the page about staff, so
                "create the account yourself" and "send them a link" sit side by
                side, which is the actual choice being made. */}
            <PanelButton panel="invite" variant="ghost">
              Invite people
            </PanelButton>
            <PanelButton panel="teacher">+ Add teacher</PanelButton>
          </>
        }
      />

      <KpiRow>
        <Kpi
          label="Teachers"
          value={teaching.length}
          sub={
            withoutGroups > 0
              ? `${withoutGroups} without a group`
              : teaching.length > 0
                ? "all running a group"
                : "none yet"
          }
        />
        <Kpi
          label="Groups they run"
          value={totalGroups}
          sub={teaching.length ? `avg ${(totalGroups / teaching.length).toFixed(1)} each` : "—"}
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
              ? (teaching.find((t) => t.groups === 0)?.name ?? "")
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

        <Table cols={COLS}>
          <THead
            cols={COLS}
            labels={["Teacher", "Subjects", "Groups", "Students", "Practice set", "Attendance", "Status", ""]}
          />
          {rows.map((t) => {
            const { practices, attendance } = t;
            return (
              <TRow key={t.id} cols={COLS}>
                <PersonCell name={t.name} meta={t.username ?? "no login"} />
                <TD>
                  {t.role === "administrator" ? (
                    <span style={{ color: "#93919F" }}>—</span>
                  ) : (
                    <TeacherSubjectsCell
                      teacherId={t.id}
                      subjects={subjectChoices}
                      selectedIds={teacherSubjects.get(t.id) ?? []}
                      canEdit={isOwner}
                    />
                  )}
                </TD>
                <TD>{t.groups || "—"}</TD>
                <TD tone={t.students === 0 ? "faint" : "body"}>{t.students || "—"}</TD>
                <TD tone={practices === 0 ? "faint" : "ink"} weight={600}>
                  {practices || "—"}
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
                  {/* An administrator has no classes BY DESIGN, so "No class
                      yet" would read as a problem to fix rather than the role
                      working correctly. */}
                  {t.role === "administrator" ? (
                    <Tag tone="neutral">Administrator</Tag>
                  ) : t.groups === 0 ? (
                    <Tag tone="amber">No group yet</Tag>
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
                ? "No teachers yet. Use + Add teacher above and they can start building groups."
                : "Nobody matches that search."}
            </Empty>
          ) : null}
        </Table>
      </Card>
    </div>
  );
}
