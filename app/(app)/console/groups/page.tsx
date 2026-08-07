import { redirect } from "next/navigation";

import {
  EmptyRow,
  List,
  PageHead,
  Panel,
  Row,
  RowLink,
  RowText,
} from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";

import { CreateGroupForm } from "./group-forms";
import { InviteMemberPanel } from "./invite-member-panel";

/** Groups list. Center admins manage every group and the teaching staff;
 *  teachers see only the groups assigned to them. */
export default async function GroupsPage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const isAdmin = profile.role === "center_admin";
  const { groups, teachers } = await loadGroups(profile);

  return (
    <div>
      <PageHead
        eyebrow="Your center"
        title="Groups"
        subtitle={
          isAdmin
            ? "Organize students into classes and assign a teacher to each."
            : "The classes assigned to you."
        }
      />

      <Panel
        title="Create a group"
        description={
          !isAdmin
            ? "Your own class — you'll be its teacher, and you add the students."
            : teachers.length === 0
              ? "No teachers yet — invite one below, then assign them here."
              : "Assign a teacher now or later."
        }
      >
        <CreateGroupForm teachers={teachers} canAssignTeacher={isAdmin} />
      </Panel>

      <Panel title={`${isAdmin ? "All groups" : "Your groups"} (${groups.length})`}>
        <List>
          {groups.map((g, i) => (
            <Row key={g.id} first={i === 0}>
              <RowText
                title={g.name}
                meta={
                  <>
                    {g.teacherName ? `Teacher: ${g.teacherName}` : "No teacher assigned"} ·{" "}
                    {g.memberCount} student{g.memberCount === 1 ? "" : "s"}
                  </>
                }
              />
              <RowLink href={`/console/groups/${g.id}`}>Open →</RowLink>
            </Row>
          ))}
          {groups.length === 0 ? (
            <EmptyRow>
              {isAdmin ? "No groups yet — create one above." : "No groups assigned to you yet."}
            </EmptyRow>
          ) : null}
        </List>
      </Panel>

      <Panel
        title="Invite people"
        description={
          isAdmin
            ? "Invite a teacher, or a student straight into a group. They join your center only."
            : "Invite a student into one of your groups."
        }
      >
        <InviteMemberPanel groups={groups} canInviteTeachers={isAdmin} />
      </Panel>
    </div>
  );
}
