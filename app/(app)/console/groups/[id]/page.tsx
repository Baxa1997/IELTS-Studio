import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  EmptyRow,
  FAINT,
  INDIGO,
  LINE,
  List,
  PageHead,
  Panel,
  Row,
  RowLink,
  SANS,
} from "@/components/console/page-ui";
import { StudentPhoto } from "@/components/console/student-photo";
import { requireOrgUser } from "@/lib/auth";
import { loadGroupAssignments } from "@/lib/console/assignments";
import { loadGroupDetail, loadGroups } from "@/lib/console/groups";
import { loadGroupActivity } from "@/lib/console/student-report";
import { READING_LIBRARY_ORG_ID } from "@/lib/reading/service";
import { createAdminClient } from "@/lib/supabase/admin";

import { AssignTeacherForm, DeleteGroupButton, RemoveMemberButton } from "../group-forms";
import { InviteMemberPanel } from "../invite-member-panel";
import { AddStudentPanel } from "./add-student-panel";
import { AssignPanel } from "./assign-panel";
import { BulkAddPanel } from "./bulk-add-panel";

/** One group: its roster, assignments and invites. RLS decides visibility — a
 *  teacher who doesn't own this group can't read its membership, so it 404s. */
export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const group = await loadGroupDetail(id);
  if (!group) notFound();

  const isAdmin = profile.role === "center_admin";
  const isOwner = isAdmin || group.teacherId === profile.id;
  if (!isOwner) notFound();

  // The shared reading library lives in its own org, so it's read with the
  // service-role client (exactly as the student read hub does).
  const admin = createAdminClient();
  const [{ teachers }, assignments, activity, libTestsRes] = await Promise.all([
    isAdmin
      ? loadGroups(profile)
      : Promise.resolve({ teachers: [] as { id: string; name: string }[] }),
    loadGroupAssignments(group.id),
    loadGroupActivity(group.members.map((m) => m.id)),
    admin
      .from("reading_tests")
      .select("id, target_band")
      .eq("organization_id", READING_LIBRARY_ORG_ID)
      .eq("is_library", true)
      .order("target_band", { ascending: true })
      .limit(12),
  ]);

  const libraryTests = (libTestsRes.data ?? []).map((t, i) => ({
    id: t.id as string,
    label: t.target_band ? `Test ${i + 1} — band ${t.target_band} level` : `Test ${i + 1}`,
  }));

  return (
    <div>
      <PageHead
        back={{ href: "/console/groups", label: "All groups" }}
        title={group.name}
        subtitle={
          <>
            {group.teacherName ? `Teacher: ${group.teacherName}` : "No teacher assigned"} ·{" "}
            {group.members.length} student{group.members.length === 1 ? "" : "s"}
          </>
        }
      />

      <Panel
        title="Students"
        description="Open a student to see everything they've practised and where they keep losing marks."
      >
        <List>
          {group.members.map((m, i) => {
            const act = activity.get(m.id);
            return (
              <Row key={m.id} first={i === 0}>
                <Link
                  href={`/console/groups/${group.id}/students/${m.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    minWidth: 0,
                    flex: 1,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <StudentPhoto name={m.name} url={m.photoUrl} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600, color: INDIGO }}>
                      {m.name}
                    </span>
                    <span style={{ display: "block", fontSize: 12.5, color: FAINT, marginTop: 2 }}>
                      {act?.count30d ?? 0} practice{(act?.count30d ?? 0) === 1 ? "" : "s"} in 30 days
                      {act?.lastActive
                        ? ` · last active ${new Date(act.lastActive).toLocaleDateString()}`
                        : " · never practised"}
                    </span>
                  </span>
                </Link>
                <RemoveMemberButton groupId={group.id} studentId={m.id} />
              </Row>
            );
          })}
          {group.members.length === 0 ? (
            <EmptyRow>No students yet — add them below.</EmptyRow>
          ) : null}
        </List>
      </Panel>

      <Panel
        title="Add a student"
        description="Creates the account outright. Give an email and their login is sent there; leave it blank and hand the details over in class."
      >
        <AddStudentPanel groupId={group.id} />
      </Panel>

      <Panel
        title="Add a whole class"
        description="Paste the register, one student per line. Logins and passwords are generated, and you get a sheet to hand out."
      >
        <BulkAddPanel groupId={group.id} />
      </Panel>

      <Panel
        title="Assign practice"
        description="Everyone in the group gets the same prompt or test, so their results are comparable."
      >
        <AssignPanel groupId={group.id} libraryTests={libraryTests} />
      </Panel>

      <Panel
        title={`Assignments (${assignments.length})`}
        description="Open one to see each student's band and mistakes."
      >
        <List>
          {assignments.map((a, i) => (
            <Row key={a.id} first={i === 0}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 500 }}>{a.title}</span>
                <span
                  style={{
                    display: "block",
                    fontSize: 12.5,
                    color: FAINT,
                    marginTop: 2,
                    textTransform: "capitalize",
                  }}
                >
                  {a.kind} · {a.completed}/{group.members.length} completed
                  {a.dueAt ? ` · due ${new Date(a.dueAt).toLocaleDateString()}` : ""}
                </span>
              </span>
              <RowLink href={`/console/groups/${group.id}/assignments/${a.id}`}>Report</RowLink>
            </Row>
          ))}
          {assignments.length === 0 ? (
            <EmptyRow>Nothing assigned yet — use the panel above.</EmptyRow>
          ) : null}
        </List>
      </Panel>

      <Panel
        title="Invite a student to this group"
        description={`They join ${group.name} automatically when they accept the link.`}
      >
        <InviteMemberPanel fixedGroupId={group.id} canInviteTeachers={false} />
      </Panel>

      {group.pendingInvites.length > 0 ? (
        <Panel
          title="Pending invites"
          description={`${group.pendingInvites.length} awaiting acceptance`}
        >
          <List>
            {group.pendingInvites.map((inv, i) => (
              <Row key={inv.email} first={i === 0}>
                <span style={{ minWidth: 0 }}>{inv.email}</span>
                <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT }}>
                  expires {new Date(inv.expiresAt).toLocaleDateString()}
                </span>
              </Row>
            ))}
          </List>
        </Panel>
      ) : null}

      {isAdmin ? (
        <Panel title="Group settings">
          <AssignTeacherForm groupId={group.id} teacherId={group.teacherId} teachers={teachers} />
          <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 18, paddingTop: 16 }}>
            <DeleteGroupButton groupId={group.id} />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
