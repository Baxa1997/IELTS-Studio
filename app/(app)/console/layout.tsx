import { ConsoleChrome } from "@/components/console/console-chrome";
import { EnrolStudentPanel } from "@/components/console/enrol-student-panel";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";

import { InviteMemberPanel } from "./groups/invite-member-panel";
import { AddTeacherPanel } from "./teachers/add-teacher-panel";

/**
 * The console's own layer, inside the app's shell.
 *
 * `.cn-root` scopes the CRM brand (cream ground, indigo action, Source Serif
 * headings) to this subtree — the learner app and the platform super-admin
 * console stay on the emerald Option A brand. The sidebar is deliberately NOT
 * here: it belongs to the app shell above, unchanged, collapsible, shared by
 * every role.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireOrgUser();
  const isAdmin = profile.role === "center_admin";

  // Groups feed both slide-overs: enrolling picks one, inviting targets one.
  const { groups } = await loadGroups(profile);

  return (
    <div className="cn-root">
      <ConsoleChrome
        userName={profile.full_name ?? user.email ?? "Account"}
        windowLabel="Last 90 days"
        enrolPanel={
          <EnrolStudentPanel
            groups={groups.map((g) => ({
              id: g.id,
              name: g.name,
              meta: g.teacherName ?? "No teacher assigned",
              students: g.memberCount,
            }))}
          />
        }
        teacherPanel={isAdmin ? <AddTeacherPanel /> : undefined}
        invitePanel={<InviteMemberPanel groups={groups} canInviteTeachers={isAdmin} />}
      >
        {children}
      </ConsoleChrome>
    </div>
  );
}
