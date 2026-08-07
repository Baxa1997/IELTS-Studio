import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Organize students into classes and assign a teacher to each."
            : "The classes assigned to you."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a group</CardTitle>
          <CardDescription>
            {!isAdmin
              ? "Your own class — you'll be its teacher, and you add the students."
              : teachers.length === 0
                ? "No teachers yet — invite one below, then assign them here."
                : "Assign a teacher now or later."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGroupForm teachers={teachers} canAssignTeacher={isAdmin} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isAdmin ? "All groups" : "Your groups"} ({groups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{g.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {g.teacherName ? `Teacher: ${g.teacherName}` : "No teacher assigned"} ·{" "}
                    {g.memberCount} student{g.memberCount === 1 ? "" : "s"}
                  </span>
                </span>
                <Link
                  href={`/console/groups/${g.id}`}
                  className="text-primary flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                >
                  Open <ArrowRight className="size-4" />
                </Link>
              </li>
            ))}
            {groups.length === 0 ? (
              <li className="text-muted-foreground flex items-center gap-2 py-3">
                <Users className="size-4" />
                {isAdmin ? "No groups yet — create one above." : "No groups assigned to you yet."}
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite people</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Invite a teacher, or a student straight into a group. They join your center only."
              : "Invite a student into one of your groups."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberPanel groups={groups} canInviteTeachers={isAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}
