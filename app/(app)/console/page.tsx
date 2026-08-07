import { redirect } from "next/navigation";

import {
  EmptyRow,
  FAINT,
  List,
  PageHead,
  Panel,
  PrimaryLink,
  Row,
  RowText,
  SANS,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { GeneratePromptPanel } from "./prompt-studio";

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
  let groupCountQuery = supabase.from("groups").select("id", { count: "exact", head: true });
  if (!isAdmin) groupCountQuery = groupCountQuery.eq("teacher_id", profile.id);

  const [membersRes, invitesRes, groupCountRes, orgRes, promptCountRes, passageCountRes] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, role").order("role", { ascending: true }),
      isAdmin
        ? supabase
            .from("invites")
            .select("email, created_at, expires_at")
            .is("accepted_at", null)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: null }),
      groupCountQuery,
      supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
      supabase
        .from("writing_prompts")
        .select("id", { count: "exact", head: true })
        .eq("task_type", "task2")
        .eq("status", "pending"),
      supabase
        .from("reading_passages")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const members = membersRes.data ?? [];
  const pendingInvites = invitesRes.data ?? [];
  const groupCount = groupCountRes.count ?? 0;
  const students = members.filter((m) => m.role === "student").length;
  const pendingContent = (promptCountRes.count ?? 0) + (passageCountRes.count ?? 0);

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
        actions={<PrimaryLink href="/console/groups">Manage groups →</PrimaryLink>}
      />

      <StatRow>
        <StatTile value={groupCount} label={isAdmin ? "Groups" : "Your groups"} tone="indigo" />
        <StatTile value={students} label="Students" />
        <StatTile value={members.length} label="People in the center" />
        <StatTile value={pendingContent} label="Awaiting approval" />
        {isAdmin ? <StatTile value={pendingInvites.length} label="Pending invites" /> : null}
      </StatRow>

      <Panel
        title="Review queue"
        description="Audit AI gradings, approve library content, and adjust bands — your overrides train the grader."
        actions={<PrimaryLink href="/console/review">Open queue →</PrimaryLink>}
      >
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: FAINT, margin: 0 }}>
          {pendingContent} item{pendingContent === 1 ? "" : "s"} awaiting approval, plus gradings to
          review. Practice you assign to a group is approved automatically and never queues here.
        </p>
      </Panel>

      <Panel
        title="Groups"
        description={
          isAdmin
            ? "Classes, their teachers and their students. Assignments and reports live inside a group."
            : "The classes assigned to you. Assignments and reports live inside a group."
        }
      >
        <List>
          <Row first>
            <RowText
              title={`${groupCount} group${groupCount === 1 ? "" : "s"}`}
              meta="Add students, assign practice, read the results"
            />
            <PrimaryLink href="/console/groups">Open →</PrimaryLink>
          </Row>
        </List>
      </Panel>

      <Panel
        title="Generate a Task 2 prompt"
        description="An original prompt via AI, for your own library. To set one as homework, use Assign practice inside a group instead."
      >
        <GeneratePromptPanel />
      </Panel>

      <Panel title="Members" description={`${members.length} in your center`}>
        <List>
          {members.map((m, i) => (
            <Row key={m.id as string} first={i === 0}>
              <RowText title={(m.full_name as string | null) ?? "—"} />
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, flex: "none" }}>
                {ROLE_LABEL[m.role as string] ?? (m.role as string)}
              </span>
            </Row>
          ))}
          {members.length === 0 ? <EmptyRow>No members yet.</EmptyRow> : null}
        </List>
      </Panel>

      {isAdmin && pendingInvites.length > 0 ? (
        <Panel title="Pending invites" description={`${pendingInvites.length} awaiting acceptance`}>
          <List>
            {pendingInvites.map((inv, i) => (
              <Row key={inv.email as string} first={i === 0}>
                <RowText title={inv.email as string} />
                <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, flex: "none" }}>
                  expires {new Date(inv.expires_at as string).toLocaleDateString()}
                </span>
              </Row>
            ))}
          </List>
        </Panel>
      ) : null}
    </div>
  );
}
