import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StudentPhoto } from "@/components/console/student-photo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

/** One group: its roster, outstanding invites, and (for the admin) the teacher
 *  assignment. RLS decides visibility — a teacher who doesn't own this group
 *  can't read its membership, so the page 404s for them. */
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
          <CardDescription>
            Open a student to see everything they&apos;ve practised and where they keep losing
            marks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {group.members.map((m) => {
              const act = activity.get(m.id);
              return (
                <li key={m.id} className="flex items-center justify-between gap-4 py-2">
                  <Link
                    href={`/console/groups/${group.id}/students/${m.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 hover:underline"
                  >
                    <StudentPhoto name={m.name} url={m.photoUrl} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {act?.count30d ?? 0} practice{(act?.count30d ?? 0) === 1 ? "" : "s"} in 30
                        days
                        {act?.lastActive
                          ? ` · last active ${new Date(act.lastActive).toLocaleDateString()}`
                          : " · never practised"}
                      </span>
                    </span>
                  </Link>
                  <RemoveMemberButton groupId={group.id} studentId={m.id} />
                </li>
              );
            })}
            {group.members.length === 0 ? (
              <li className="text-muted-foreground py-2">No students yet — add them below.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a student</CardTitle>
          <CardDescription>
            Creates the account outright — hand them the email and password in class. Nothing is
            emailed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddStudentPanel groupId={group.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign practice</CardTitle>
          <CardDescription>
            Everyone in the group gets the same prompt or test, so their results are comparable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignPanel groupId={group.id} libraryTests={libraryTests} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignments ({assignments.length})</CardTitle>
          <CardDescription>Open one to see each student&apos;s band and mistakes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{a.title}</span>
                  <span className="text-muted-foreground block text-xs capitalize">
                    {a.kind} · {a.completed}/{group.members.length} completed
                    {a.dueAt ? ` · due ${new Date(a.dueAt).toLocaleDateString()}` : ""}
                  </span>
                </span>
                <Link
                  href={`/console/groups/${group.id}/assignments/${a.id}`}
                  className="text-primary shrink-0 text-sm font-medium hover:underline"
                >
                  Report
                </Link>
              </li>
            ))}
            {assignments.length === 0 ? (
              <li className="text-muted-foreground py-2">
                Nothing assigned yet — use the panel above.
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
            <AssignTeacherForm groupId={group.id} teacherId={group.teacherId} teachers={teachers} />
            <div className="border-t pt-4">
              <DeleteGroupButton groupId={group.id} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
