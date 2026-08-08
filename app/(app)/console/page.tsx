import { redirect } from "next/navigation";

import {
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

  const [membersRes, invitesRes, groupCountRes, orgRes] = await Promise.all([
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
  ]);

  const members = membersRes.data ?? [];
  const pendingInvites = invitesRes.data ?? [];
  const groupCount = groupCountRes.count ?? 0;
  const students = members.filter((m) => m.role === "student").length;
  const teachers = members.filter((m) => m.role === "teacher").length;

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
        {isAdmin ? <StatTile value={pendingInvites.length} label="Pending invites" /> : null}
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
