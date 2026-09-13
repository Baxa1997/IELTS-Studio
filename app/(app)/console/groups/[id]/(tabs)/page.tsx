import { notFound, redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { loadGroupAssignments } from "@/lib/console/assignments";
import { loadGroupDetail, loadGroups } from "@/lib/console/groups";
import { ENROLLED, STUDENT_STATUS_LABEL } from "@/lib/console/status";
import { loadGroupActivity } from "@/lib/console/student-report";
import { loadClassMoney } from "@/lib/finance/class-money";
import { formatMoney } from "@/lib/finance/money";
import { monthStart, today } from "@/lib/finance/period";
import { createClient } from "@/lib/supabase/server";

import { AddStudentPanel } from "../add-student-panel";
import { BulkAddPanel } from "../bulk-add-panel";
import { RosterToolbar, StudentsManager } from "../students-manager";
import { V2, card as v2card, serifHead } from "../ui";
import {
  Card,
  CardHead,
  Kpi,
  KpiRow,
  ListRow,
  SANS,
  Stack,
  Tag,
} from "@/components/console/crm-ui";

export const dynamic = "force-dynamic";

/**
 * The group's overview: who is in it, and the five numbers that say how it is
 * doing. The index route, so this is what `/console/groups/{id}` opens on.
 *
 * THE KPI STRIP LIVES HERE RATHER THAN IN THE LAYOUT, and that is the single
 * decision that makes this split worth doing. Three of the five numbers —
 * completion, measured, at target — are cross-tab aggregates over the
 * assignment board, the skill estimates and 30-day activity. Drawn above every
 * tab, they made every tab pay for all three; drawn here, they are free,
 * because the roster table underneath needs the same three datasets anyway.
 */
export default async function GroupOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;

  /* Old links still exist — the checklist, the practice page, a teacher's
     bookmark, a message in a Telegram group — and they all carry `?tab=`.
     Forward them to the segment that replaced them rather than silently
     showing the roster to somebody who asked for the money. */
  const { tab } = await searchParams;
  const MOVED: Record<string, string> = {
    practice: "homework",
    attendance: "attendance",
    money: "money",
    settings: "settings",
  };
  if (tab && MOVED[tab]) redirect(`/console/groups/${id}/${MOVED[tab]}`);

  const group = await loadGroupDetail(id);
  if (!group) notFound();

  const isAdmin = profile.role === "center_admin";
  if (!isAdmin && group.teacherId !== profile.id) notFound();

  // DENOMINATORS ARE THE ENROLLED ROSTER. A student who left keeps their marks,
  // their registers and their invoices — but counting them as a member makes
  // every completion percentage and every "measured out of" look worse than the
  // group is doing, for as long as the center exists.
  const roster = group.members.filter((m) => ENROLLED.includes(m.status));
  const alumni = group.members.filter((m) => m.status === "left");
  const memberIds = roster.map((m) => m.id);

  const supabase = await createClient();
  const [{ groups: manageable }, assignments, activity, estimatesRes, moneyData] =
    await Promise.all([
      // A teacher needs the list of their OWN groups to move a student between
      // them. RLS scopes it to what this person may touch.
      loadGroups(profile),
      loadGroupAssignments(group.id),
      loadGroupActivity(memberIds),
      memberIds.length > 0
        ? supabase
            .from("skill_estimates")
            .select("student_id, skill, current_band, target_band")
            .in("student_id", memberIds)
        : Promise.resolve({ data: null }),
      // Owner only, and only for the "owed" line on the move-or-remove sheet —
      // a teacher must not read what the center charges, and RLS on
      // finance_settings would refuse anyway.
      isAdmin ? loadClassMoney(group.id, monthStart(today())) : Promise.resolve(null),
    ]);

  // Per-student bands. The weakest measured skill, never a cross-skill mean —
  // an averaged "overall band" would be a number we invented.
  const bands = new Map<string, { skill: string; band: number }[]>();
  const targets = new Map<string, number>();
  for (const e of (estimatesRes.data ?? []) as {
    student_id: string;
    skill: string;
    current_band: number | null;
    target_band: number | null;
  }[]) {
    if (e.target_band != null) {
      targets.set(e.student_id, Math.max(targets.get(e.student_id) ?? 0, Number(e.target_band)));
    }
    if (e.current_band == null) continue;
    bands.set(e.student_id, [
      ...(bands.get(e.student_id) ?? []),
      { skill: e.skill, band: Number(e.current_band) },
    ]);
  }
  const weakestOf = (studentId: string) => {
    const measured = bands.get(studentId) ?? [];
    return measured.length ? measured.reduce((lo, m) => (m.band < lo.band ? m : lo)) : null;
  };

  const measuredMembers = roster
    .map((m) => ({ ...m, weakest: weakestOf(m.id), target: targets.get(m.id) ?? null }))
    .filter((m) => m.weakest != null);
  const atTarget = measuredMembers.filter(
    (m) => m.target != null && (m.weakest as { band: number }).band >= m.target,
  ).length;
  const activeCount = roster.filter((m) => (activity.get(m.id)?.count30d ?? 0) > 0).length;
  const totalCompleted = assignments.reduce((n, a) => n + a.completed, 0);
  const completionPct =
    assignments.length > 0 && roster.length > 0
      ? Math.round((totalCompleted / (assignments.length * roster.length)) * 100)
      : null;
  const openCount = assignments.filter(
    (a) => !(roster.length > 0 && a.completed >= roster.length),
  ).length;

  // An address given twice in one roster is a shared parent inbox, which the
  // enrolment form deliberately allows. Counted once so the row can say so.
  const emailUses = new Map<string, number>();
  for (const m of roster) {
    const key = (m.contactEmail ?? "").toLowerCase();
    if (key) emailUses.set(key, (emailUses.get(key) ?? 0) + 1);
  }

  // The other groups this person manages — the destinations a student can be
  // moved to. RLS already scopes `loadGroups` to what they may touch, so an
  // empty list genuinely means there is nowhere to move anybody.
  const siblingGroups = manageable
    .filter((g) => g.id !== group.id)
    .map((g) => ({ id: g.id, name: g.name }));

  // What each student still owes for this month, for the Move-or-remove sheet.
  // Only the owner sees money on this page, so a teacher's sheet simply omits
  // the line rather than showing them a figure they are not shown anywhere else.
  const owedByStudent = new Map<string, string>();
  if (moneyData) {
    for (const [studentId, row] of moneyData.rows) {
      const owed = (row.invoicedMinor ?? 0) - row.paidMinor;
      if (owed > 0) {
        owedByStudent.set(studentId, `${formatMoney(owed, moneyData.currency)} owed`);
      }
    }
  }

  const studentRows = roster.map((m) => {
    const weakest = weakestOf(m.id);
    const act = activity.get(m.id);
    return {
      id: m.id,
      name: m.name,
      login: m.login,
      contactEmail: m.contactEmail,
      sharesEmail: (emailUses.get((m.contactEmail ?? "").toLowerCase()) ?? 0) > 1,
      joinedAt: m.joinedAt,
      photoUrl: m.photoUrl,
      weakestSkill: weakest?.skill ?? null,
      weakestBand: weakest?.band ?? null,
      targetBand: targets.get(m.id) ?? null,
      practice30d: act?.count30d ?? 0,
      lastActive: act?.lastActive ?? null,
      status: m.status ?? "active",
      owedLabel: owedByStudent.get(m.id) ?? null,
    };
  });

  return (
    <>
      <KpiRow>
        <Kpi label="Students" value={roster.length} sub={`${activeCount} active in 30 days`} />
        <Kpi
          label="Homework"
          value={assignments.length}
          sub={openCount > 0 ? `${openCount} still open` : "nothing outstanding"}
        />
        <Kpi
          label="Homework completion"
          value={completionPct == null ? "\u2014" : `${completionPct}%`}
          sub={
            assignments.length === 0
              ? "nothing set yet"
              : `${totalCompleted} of ${assignments.length * roster.length} finished`
          }
        />
        <Kpi
          label="Students measured"
          value={`${measuredMembers.length}/${roster.length}`}
          sub="have a graded band"
        />
        <Kpi
          label="Students at target"
          value={atTarget}
          sub="on their weakest skill"
          deltaTone={atTarget > 0 ? "good" : "flat"}
        />
      </KpiRow>

      <Stack>
        {/* The roster on the same surface as the practice board: same card,
            same column rule, same row rhythm. They are the two boards a
            teacher moves between all day. */}
        <div style={{ ...v2card, overflow: "hidden" }}>
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
            <h3 style={serifHead}>
              {group.capacity
                ? `Students (${roster.length}/${group.capacity})`
                : `Students (${roster.length})`}
            </h3>
            <span style={{ fontFamily: SANS, fontSize: 13, color: V2.faint, flex: "1 1 240px" }}>
              {group.capacity && roster.length >= group.capacity
                ? `This group is full — ${roster.length} of ${group.capacity} seats. You can still add, it just won't fit the room.`
                : "Everyone here signs in with their own login — that is how homework is handed in and graded."}
            </span>
            <div style={{ marginLeft: "auto" }}>
              <RosterToolbar
                students={studentRows}
                groupName={group.name}
                addForm={<AddStudentPanel groupId={group.id} />}
                importForm={<BulkAddPanel groupId={group.id} />}
              />
            </div>
          </div>
          <StudentsManager groupId={group.id} students={studentRows} otherGroups={siblingGroups} />
        </div>

        {/* Students who left. Kept on the page and out of every count above
            it — someone asks about last term's student, and "we deleted
            them" is not an answer a center can give a parent. */}
        {alumni.length > 0 ? (
          <Card flush>
            <CardHead
              title={`Left this group (${alumni.length})`}
              divided
              note="their marks, registers and invoices are untouched"
            />
            {alumni.map((m) => (
              <ListRow
                key={m.id}
                href={`/console/students/${m.id}`}
                title={m.name}
                meta={m.login ?? "no login"}
                trail={<Tag tone="neutral">{STUDENT_STATUS_LABEL[m.status]}</Tag>}
              />
            ))}
          </Card>
        ) : null}

        {group.pendingInvites.length > 0 ? (
          <Card flush>
            <CardHead
              title="Pending invites"
              divided
              note={`${group.pendingInvites.length} awaiting acceptance`}
            />
            {group.pendingInvites.map((inv) => (
              <ListRow
                key={inv.email}
                title={inv.email}
                trail={
                  <Tag tone="neutral">expires {new Date(inv.expiresAt).toLocaleDateString()}</Tag>
                }
              />
            ))}
          </Card>
        ) : null}
      </Stack>
    </>
  );
}
