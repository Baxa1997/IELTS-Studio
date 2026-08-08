import { redirect } from "next/navigation";

import {
  List,
  PageHead,
  Panel,
  PrimaryLink,
  Row,
  RowText,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
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

  const [membersRes, invitesRes, groupsRes, orgRes] = await Promise.all([
    supabase.from("profiles").select("id, role"),
    supabase
      .from("v_pending_invites")
      .select("id, email, role, expires_at")
      .order("created_at", { ascending: false }),
    groupsQuery,
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
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
