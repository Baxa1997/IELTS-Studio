import { redirect } from "next/navigation";

import {
  FAINT,
  INDIGO,
  LINE,
  List,
  MUTED,
  PageHead,
  Panel,
  PrimaryLink,
  Row,
  RowLink,
  RowText,
  SANS,
  StatRow,
  StatTile,
  TINT,
} from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
import { getUsageSummary, type Quota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

import { PendingInvites, type PendingInvite } from "./pending-invites";

const ROLE_LABEL: Record<string, string> = {
  center_admin: "Center admin",
  teacher: "Teacher",
  student: "Student",
};

export default async function ConsolePage() {
  const { profile } = await requireOrgUser();
  // Students don't belong here — send them to their dashboard.
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const isAdmin = profile.role === "center_admin";

  // RLS scopes every query to this admin/teacher's own organization — and, for
  // groups, to the ones a teacher actually owns.
  let groupsQuery = supabase.from("groups").select("id");
  if (!isAdmin) groupsQuery = groupsQuery.eq("teacher_id", profile.id);

  const [membersRes, invitesRes, groupsRes, orgRes, assignmentsRes] = await Promise.all([
    supabase.from("profiles").select("id, role"),
    supabase
      .from("v_pending_invites")
      .select("id, email, role, expires_at")
      .order("created_at", { ascending: false }),
    groupsQuery,
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
    // Only ever used as "has any" — RLS already narrows a teacher to their own.
    supabase.from("assignments").select("id", { count: "exact", head: true }),
  ]);

  const groupIds = (groupsRes.data ?? []).map((g) => g.id as string);
  const groupCount = groupIds.length;
  const teachers = (membersRes.data ?? []).filter((m) => m.role === "teacher").length;

  // An admin counts every learner in the center. A teacher counts the learners
  // in their own classes — `profiles` is readable org-wide by any staff member,
  // so counting it here would have shown a teacher the whole center's total on
  // this page while /console/students showed them only their own.
  let students: number;
  if (isAdmin) {
    students = (membersRes.data ?? []).filter((m) => m.role === "student").length;
  } else if (groupIds.length === 0) {
    students = 0;
  } else {
    const { data: roster } = await supabase
      .from("group_members")
      .select("student_id")
      .in("group_id", groupIds);
    students = new Set((roster ?? []).map((r) => r.student_id as string)).size;
  }

  // A pending invite is unaccepted AND unexpired — the view is the definition
  // (this card used to count expired invites, the group page did not).
  const pendingInvites: PendingInvite[] = (invitesRes.data ?? []).map((i) => ({
    id: i.id as string,
    email: i.email as string,
    role: i.role as string,
    expiresAt: i.expires_at as string,
  }));

  // The four things that have to exist before a center is actually running. The
  // panel disappears for good once they all do, so an established center never
  // sees it — it exists to cure the first-day empty console.
  const steps = [
    ...(isAdmin
      ? [
          {
            label: "Add a teacher",
            meta: "They create their own classes and see their own students.",
            href: "/console/teachers",
            done: teachers > 0,
          },
        ]
      : []),
    {
      label: "Create a group",
      meta: "A class is how practice gets set and results get compared.",
      href: "/console/groups",
      done: groupCount > 0,
    },
    {
      label: "Add students",
      meta: "One at a time, or paste the whole register at once.",
      href: "/console/groups",
      done: students > 0,
    },
    {
      label: "Set the first practice",
      meta: "Everyone in the group gets the same prompt, so the bands compare.",
      href: "/console/groups",
      done: (assignmentsRes.count ?? 0) > 0,
    },
  ];
  const setupDone = steps.every((s) => s.done);

  // Usage is the billing owner's business, so only an admin sees it.
  const usage = isAdmin ? await getUsageSummary(profile.organization_id) : null;

  return (
    <div>
      <PageHead
        eyebrow={ROLE_LABEL[profile.role] ?? profile.role}
        title={(orgRes.data?.name as string | null) ?? "Your center"}
        subtitle={
          isAdmin
            ? "Your classes, your teachers, and the practice you set them."
            : "Your classes and the practice you set them."
        }
      />

      <StatRow>
        <StatTile value={groupCount} label={isAdmin ? "Groups" : "Your groups"} tone="indigo" />
        <StatTile value={students} label="Students" />
        {isAdmin ? <StatTile value={teachers} label="Teachers" /> : null}
        <StatTile value={pendingInvites.length} label="Pending invites" />
      </StatRow>

      {!setupDone ? (
        <Panel
          title="Set your center up"
          description={`${steps.filter((s) => s.done).length} of ${steps.length} done. This panel goes away once they all are.`}
        >
          <List>
            {steps.map((step, i) => (
              <Row key={step.label} first={i === 0}>
                <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                  <Tick done={step.done} />
                  <RowText
                    title={
                      <span style={{ color: step.done ? MUTED : undefined }}>{step.label}</span>
                    }
                    meta={step.meta}
                  />
                </span>
                {step.done ? (
                  <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, flex: "none" }}>
                    Done
                  </span>
                ) : (
                  <RowLink href={step.href}>Do it →</RowLink>
                )}
              </Row>
            ))}
          </List>
        </Panel>
      ) : null}

      {usage ? (
        <Panel
          title="This month"
          description={`Resets ${new Date(usage.grade.resetAt).toLocaleDateString()}. Your plan: ${usage.planName}.`}
        >
          <List>
            <UsageRow label="Essays graded" quota={usage.grade} first />
            <UsageRow label="Practice generated" quota={usage.generate} />
          </List>
        </Panel>
      ) : null}

      <Panel
        title="Where to go"
        description="Everything in a center happens in one of these three places."
      >
        <List>
          {isAdmin ? (
            <Row first>
              <RowText
                title="Teachers"
                meta={`${teachers} on staff · create accounts, see who runs what`}
              />
              <PrimaryLink href="/console/teachers">Open →</PrimaryLink>
            </Row>
          ) : null}
          <Row first={!isAdmin}>
            <RowText
              title="Groups"
              meta={`${groupCount} class${groupCount === 1 ? "" : "es"} · add students, set practice, read the results`}
            />
            <PrimaryLink href="/console/groups">Open →</PrimaryLink>
          </Row>
          <Row>
            <RowText
              title="Students"
              meta={`${students} learner${students === 1 ? "" : "s"} · progress and reports across every class`}
            />
            <PrimaryLink href="/console/students">Open →</PrimaryLink>
          </Row>
        </List>
      </Panel>

      {pendingInvites.length > 0 ? (
        <Panel
          title="Pending invites"
          description={`${pendingInvites.length} awaiting acceptance. Expired invites are not listed — they stop working on their own.`}
        >
          <PendingInvites invites={pendingInvites} />
        </Panel>
      ) : null}
    </div>
  );
}

/** Checklist marker: a filled indigo dot when done, a hollow ring when not. */
function Tick({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        flex: "none",
        width: 18,
        height: 18,
        borderRadius: 999,
        border: `1.5px solid ${done ? INDIGO : LINE}`,
        background: done ? INDIGO : "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {done ? "✓" : ""}
    </span>
  );
}

/**
 * One usage line. An unmetered center (billing_enforced = false, which is every
 * center for now) has no limit to draw a bar against — so it gets the count and
 * an honest sentence, never a progress bar against an invented ceiling.
 */
function UsageRow({ label, quota, first }: { label: string; quota: Quota; first?: boolean }) {
  const pct = quota.limit ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : null;
  return (
    <Row first={first}>
      <RowText
        title={label}
        meta={
          quota.limit == null
            ? "Unlimited while your center is in early access."
            : `${quota.remaining} of ${quota.limit} left`
        }
      />
      <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        {pct != null ? (
          <span
            style={{
              width: 96,
              height: 6,
              borderRadius: 999,
              background: TINT,
              overflow: "hidden",
              display: "inline-block",
            }}
          >
            <span
              style={{
                display: "block",
                width: `${pct}%`,
                height: "100%",
                background: pct >= 100 ? "#b91c1c" : INDIGO,
              }}
            />
          </span>
        ) : null}
        <span
          style={{
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {quota.used}
        </span>
      </span>
    </Row>
  );
}
