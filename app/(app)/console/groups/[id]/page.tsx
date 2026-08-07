import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgUser } from "@/lib/auth";
import { loadGroupDetail, loadGroups } from "@/lib/console/groups";

import { AssignTeacherForm, DeleteGroupButton, RemoveMemberButton } from "../group-forms";
import { InviteMemberPanel } from "../invite-member-panel";

/** One group: its roster, outstanding invites, and (for the admin) the teacher
 *  assignment. RLS decides visibility — a teacher who doesn't own this group
 *  can't read its membership, so the page 404s for them. */
export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const group = await loadGroupDetail(id);
  if (!group) notFound();

  const isAdmin = profile.role === "center_admin";
  const isOwner = isAdmin || group.teacherId === profile.id;
  if (!isOwner) notFound();

  const { teachers } = isAdmin
    ? await loadGroups(profile)
    : { teachers: [] as { id: string; name: string }[] };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/console/groups"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> All groups
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
        <p className="text-muted-foreground">
          {group.teacherName ? `Teacher: ${group.teacherName}` : "No teacher assigned"} ·{" "}
          {group.members.length} student{group.members.length === 1 ? "" : "s"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students</CardTitle>
          <CardDescription>Everyone currently in this group.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {group.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate">{m.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    joined {new Date(m.joinedAt).toLocaleDateString()}
                  </span>
                </span>
                <RemoveMemberButton groupId={group.id} studentId={m.id} />
              </li>
            ))}
            {group.members.length === 0 ? (
              <li className="text-muted-foreground py-2">
                No students yet — invite them below.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a student to this group</CardTitle>
          <CardDescription>
            They join {group.name} automatically when they accept the link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberPanel fixedGroupId={group.id} canInviteTeachers={false} />
        </CardContent>
      </Card>

      {group.pendingInvites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invites</CardTitle>
            <CardDescription>{group.pendingInvites.length} awaiting acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {group.pendingInvites.map((i) => (
                <li key={i.email} className="flex items-center justify-between py-2">
                  <span className="truncate">{i.email}</span>
                  <span className="text-muted-foreground text-xs">
                    expires {new Date(i.expiresAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Group settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AssignTeacherForm
              groupId={group.id}
              teacherId={group.teacherId}
              teachers={teachers}
            />
            <div className="border-t pt-4">
              <DeleteGroupButton groupId={group.id} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
