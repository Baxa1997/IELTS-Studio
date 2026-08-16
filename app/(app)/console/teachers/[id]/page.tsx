import { notFound, redirect } from "next/navigation";

import {
  Card,
  CardHead,
  ChipLink,
  Empty,
  FAINT,
  Kpi,
  KpiRow,
  PageHead,
  RED,
  SANS,
  Split,
  Stack,
  Table,
  Tag,
  TD,
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { KIND_LABEL, reportHref } from "@/lib/console/attempts";
import { loadMarkingQueue, OVERDUE_HOURS } from "@/lib/console/marking";
import { loadTurnaround } from "@/lib/console/people";
import { loadDay } from "@/lib/console/attendance";
import { describeTurnaround, NO_TURNAROUND } from "@/lib/console/turnaround";
import { loadSalaryRules } from "@/lib/finance/payroll";
import { resolveRule } from "@/lib/finance/salary";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const GROUP_COLS = "2fr 1fr .8fr .9fr";
const QUEUE_COLS = "1.6fr 1fr 1fr .8fr";

/**
 * One teacher, in the four terms §7 asks for: their groups, their timetable,
 * their unmarked queue, and their salary rule.
 *
 * WHY THIS PAGE EXISTS AT ALL. The teachers table answers "how is the staff
 * doing"; it cannot answer "what is going on with Madina", which is the
 * question an owner actually has — usually because a parent rang, or because a
 * row on that table looked wrong. Until now the only way to answer it was to
 * open every group and check whose name was on it.
 *
 * DELIBERATELY NOT A PERFORMANCE REVIEW. There is no band here. §7 removed AVG
 * BAND for the reason R2 gives, and a detail page is exactly where it would
 * creep back in as "their students' average". What a teacher is accountable for
 * is what they set, how fast they mark it, and whether they take the register.
 */
export default async function TeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  // Teachers manage classes, not colleagues — the same rule as the list page.
  if (profile.role !== "center_admin") redirect("/console");

  const { id } = await params;
  const supabase = await createClient();

  // RLS scopes profiles to the org, so a miss here is "not in this centre" and
  // "does not exist" at once — which is the correct answer to both.
  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, contact_email, phone, member_status")
    .eq("id", id)
    .maybeSingle();
  if (!teacher || (teacher.role !== "teacher" && teacher.role !== "administrator")) notFound();

  const [{ data: groups }, queue, turnaroundOf, rules, today] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name, status, capacity")
      .eq("teacher_id", id)
      .order("name"),
    loadMarkingQueue(profile),
    loadTurnaround(),
    loadSalaryRules(),
    loadDay(profile, new Date().toISOString().slice(0, 10)),
  ]);

  const groupIds = (groups ?? []).map((g) => g.id as string);
  const { data: members } = groupIds.length
    ? await supabase.from("group_members").select("group_id, student_id").in("group_id", groupIds)
    : { data: [] as { group_id: string; student_id: string }[] };

  const rosterOf = new Map<string, number>();
  for (const m of (members ?? []) as { group_id: string; student_id: string }[]) {
    rosterOf.set(m.group_id, (rosterOf.get(m.group_id) ?? 0) + 1);
  }
  const studentIds = new Set(
    ((members ?? []) as { student_id: string }[]).map((m) => m.student_id),
  );

  // The queue is centre-wide; this page wants only the work sitting in THIS
  // teacher's classes — which is the work they are the one who has to do.
  const theirs = queue.filter((q) => studentIds.has(q.studentId));
  const overdue = theirs.filter((q) => q.waitingHours >= OVERDUE_HOURS);

  const turnaround = turnaroundOf.get(id) ?? NO_TURNAROUND;
  const rule = resolveRule(rules, id, null);
  const lessonsToday = today.lessons.filter((l) => l.teacherId === id);

  const name = (teacher.full_name as string | null) ?? "Unnamed";
  const status = (teacher.member_status as string | null) ?? "active";

  return (
    <div>
      <PageHead
        back={{ href: "/console/teachers", label: "Teachers" }}
        eyebrow={teacher.role === "administrator" ? "Administrator" : "Teacher"}
        title={name}
        subtitle={
          <>
            {(teacher.username as string | null) ?? "no login"}
            {teacher.contact_email ? ` · ${teacher.contact_email as string}` : ""}
            {status !== "active" ? ` · ${status}` : ""}
          </>
        }
      />

      <KpiRow>
        <Kpi label="Groups" value={groupIds.length} sub={`${studentIds.size} students`} />
        <Kpi
          label="Marking waiting"
          value={theirs.length}
          sub={overdue.length > 0 ? `${overdue.length} over ${OVERDUE_HOURS}h` : "nothing overdue"}
          deltaTone={overdue.length > 0 ? "bad" : "good"}
        />
        <Kpi
          label="Marking turnaround"
          value={describeTurnaround(turnaround)}
          sub={
            turnaround.reviews === 0
              ? "nothing marked yet"
              : `${turnaround.reviews} marked${turnaround.provisional ? " · provisional" : ""}`
          }
        />
        <Kpi label="Lessons today" value={lessonsToday.length} sub="on the timetable" />
      </KpiRow>

      <Split ratio="1.3fr .7fr">
        <Stack>
          <Card flush>
            <CardHead title="Their groups" divided />
            {groupIds.length === 0 ? (
              <Empty action={{ href: "/console/groups", label: "Assign a group →" }}>
                No groups yet — nothing here will have anything to show until they have one.
              </Empty>
            ) : (
              <Table cols={GROUP_COLS}>
                <THead cols={GROUP_COLS} labels={["Group", "Students", "Status", ""]} />
                {(groups ?? []).map((g) => (
                  <TRow key={g.id as string} cols={GROUP_COLS}>
                    <TD tone="ink" weight={500}>
                      {g.name as string}
                    </TD>
                    <TD tone="soft">
                      {rosterOf.get(g.id as string) ?? 0}
                      {g.capacity ? ` of ${g.capacity as number}` : ""}
                    </TD>
                    <TD>
                      <Tag tone={g.status === "closed" ? "neutral" : "green"}>
                        {(g.status as string) ?? "active"}
                      </Tag>
                    </TD>
                    <TD>
                      <ChipLink href={`/console/groups/${g.id as string}`}>Open</ChipLink>
                    </TD>
                  </TRow>
                ))}
              </Table>
            )}
          </Card>

          <Card flush>
            <CardHead
              title="Waiting to be marked"
              note="their own classes only — oldest first"
              divided
            />
            {theirs.length === 0 ? (
              <Empty>Nothing waiting. Everything handed in has a signed band.</Empty>
            ) : (
              <Table cols={QUEUE_COLS}>
                <THead cols={QUEUE_COLS} labels={["Student", "Skill", "Waiting", ""]} />
                {theirs.slice(0, 25).map((q) => (
                  <TRow key={`${q.kind}:${q.refId}`} cols={QUEUE_COLS}>
                    <TD tone="ink" weight={500}>
                      {q.studentName}
                    </TD>
                    <TD tone="soft">{KIND_LABEL[q.kind]}</TD>
                    <TD tone={q.waitingHours >= OVERDUE_HOURS ? "ink" : "soft"}>
                      <span style={{ color: q.waitingHours >= OVERDUE_HOURS ? RED : undefined }}>
                        {q.waitingHours < 48
                          ? `${Math.round(q.waitingHours)}h`
                          : `${Math.round(q.waitingHours / 24)} days`}
                      </span>
                    </TD>
                    <TD>
                      <ChipLink href={reportHref(q.kind, q.refId)}>Mark</ChipLink>
                    </TD>
                  </TRow>
                ))}
              </Table>
            )}
          </Card>
        </Stack>

        <Stack>
          <Card>
            <CardHead title="Today" />
            {lessonsToday.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
                Nothing on the timetable today.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lessonsToday.map((l) => (
                  <div
                    key={`${l.groupId}-${l.startsAt}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      fontFamily: SANS,
                      fontSize: 13,
                    }}
                  >
                    <span>{l.groupName}</span>
                    <span style={{ color: FAINT }}>
                      {l.startsAt}
                      {l.roomName ? ` · ${l.roomName}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHead title="How they are paid" />
            {/* Named, not computed. What they earned this month is the payroll
                page's job and depends on a period; what an owner wants here is
                "which rule is this person on", which is a fact about them. */}
            <p style={{ fontFamily: SANS, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {rule ? (
                <>
                  <strong>{rule.name}</strong>
                  <span style={{ color: FAINT }}> — the rule set for this teacher.</span>
                </>
              ) : (
                <span style={{ color: FAINT }}>
                  No rule of their own — they fall back to the centre default, and to each
                  class&apos;s own teacher rate where one is set.
                </span>
              )}
            </p>
            <div style={{ marginTop: 10 }}>
              <ChipLink href="/console/finance/salary">Salary rules</ChipLink>
            </div>
          </Card>
        </Stack>
      </Split>
    </div>
  );
}
