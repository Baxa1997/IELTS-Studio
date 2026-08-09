import { redirect } from "next/navigation";

import {
  Bar,
  Card,
  CardHead,
  CardNote,
  Empty,
  fieldStyle,
  GREEN,
  Kpi,
  KpiRow,
  PageHead,
  PersonCell,
  SANS,
  Stack,
  Table,
  Tag,
  TD,
  THead,
  Toolbar,
  TRow,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadTeachers } from "@/lib/console/people";
import { loadCenterReport } from "@/lib/console/reports";

import { AddTeacherPanel } from "./add-teacher-panel";

export const dynamic = "force-dynamic";

const COLS = "2.2fr .8fr .9fr .9fr 1.3fr 1.1fr";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { profile } = await requireOrgUser();
  // Teachers manage classes, not colleagues.
  if (profile.role !== "center_admin") redirect("/console");

  const sp = await searchParams;
  const query = sp.q?.trim().toLowerCase() || undefined;

  const [teachers, report] = await Promise.all([
    loadTeachers(),
    loadCenterReport({ role: profile.role, profileId: profile.id }),
  ]);

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

  const rows = teachers.filter((t) =>
    query
      ? t.name.toLowerCase().includes(query) || (t.username ?? "").toLowerCase().includes(query)
      : true,
  );

  const withoutGroups = teachers.filter((t) => t.groups === 0).length;
  const totalGroups = teachers.reduce((n, t) => n + t.groups, 0);
  const totalStudents = teachers.reduce((n, t) => n + t.students, 0);
  const allBands = teachers
    .map((t) => mean(stats.get(t.id)?.bands ?? []))
    .filter((b): b is number => b != null);

  return (
    <div>
      <PageHead
        eyebrow="Staff"
        title="Teachers"
        subtitle={`${teachers.length} on staff · each teacher sees only the groups assigned to them.`}
      />

      <KpiRow>
        <Kpi label="Teachers" value={teachers.length} sub={`${withoutGroups} without a class`} />
        <Kpi label="Classes they run" value={totalGroups} />
        <Kpi label="Students taught" value={totalStudents} sub="counted once per teacher" />
        <Kpi
          label="Average band"
          value={mean(allBands)?.toFixed(1) ?? "—"}
          sub={allBands.length ? `across ${allBands.length} teachers` : "nothing graded yet"}
        />
      </KpiRow>

      <Stack>
        <Card flush>
          <CardHead
            title="Your teachers"
            divided
            note="students counted here are the ones each teacher can actually see"
          />
          <Toolbar>
            {/* Plain GET form — no client bundle for a one-field filter. */}
            <form method="GET" style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Search teacher…"
                aria-label="Search teacher"
                style={{ ...fieldStyle, flex: 1, maxWidth: 260 }}
              />
              <button type="submit" className="cn-btn cn-btn--ghost" style={{ ...fieldStyle, background: "#fff", cursor: "pointer", fontWeight: 500 }}>
                Search
              </button>
            </form>
            <span style={{ fontFamily: SANS, fontSize: 12, color: "#93919F" }}>
              {rows.length} shown{rows.length !== teachers.length ? ` of ${teachers.length}` : ""}
            </span>
          </Toolbar>

          <Table cols={COLS} minWidth={760}>
            <THead
              cols={COLS}
              labels={["Teacher", "Classes", "Students", "Avg band", "Completion", "Status"]}
            />
            {rows.map((t) => {
              const s = stats.get(t.id);
              const band = mean(s?.bands ?? []);
              const completion = mean(s?.completions ?? []);
              return (
                <TRow key={t.id} cols={COLS}>
                  <PersonCell name={t.name} meta={t.username ?? "no login"} />
                  <TD>{t.groups}</TD>
                  <TD tone={t.students === 0 ? "faint" : "body"}>{t.students}</TD>
                  <TD tone="ink" weight={600}>
                    {band?.toFixed(1) ?? "—"}
                  </TD>
                  <TD>
                    {completion == null ? (
                      <span style={{ color: "#93919F" }}>—</span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Bar pct={completion} width={54} fill={completion >= 60 ? GREEN : undefined} />
                        <span style={{ fontSize: 12 }}>{Math.round(completion)}%</span>
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
                </TRow>
              );
            })}
            {rows.length === 0 ? (
              <Empty>
                {teachers.length === 0
                  ? "No teachers yet. Add one below and they can start building classes."
                  : "Nobody matches that search."}
              </Empty>
            ) : null}
          </Table>
        </Card>

        <Card>
          <CardHead title="Add a teacher" />
          <CardNote>
            Creates the account immediately. Give an email and the sign-in details are sent; leave
            it out and you hand them over yourself.
          </CardNote>
          <AddTeacherPanel />
        </Card>
      </Stack>
    </div>
  );
}
