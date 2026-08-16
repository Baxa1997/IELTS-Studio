import { ConsoleChrome } from "@/components/console/console-chrome";
import { EnrolStudentPanel } from "@/components/console/enrol-student-panel";
import { ToastHost } from "@/components/console/toast";
import { canManagePeople, isOrgOwner, requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { loadSubjects, loadTeacherSubjects } from "@/lib/console/subjects";
import { loadFinanceSettings } from "@/lib/finance/load";

import { CreateGroupForm } from "./groups/group-forms";
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
  // Two different questions, and they stopped having the same answer when the
  // administrator role arrived. `isOwner` gates money and hiring; `canStaff`
  // gates putting a teacher on a group, which is scheduling.
  const isAdmin = isOrgOwner(profile.role);
  const canStaff = canManagePeople(profile.role);

  // Groups feed both slide-overs: enrolling picks one, inviting targets one.
  // The currency comes along because a new group is priced as it is created,
  // and only the owner sees those fields.
  const [{ groups, teachers, branches, rooms }, settings, subjects, teacherSubjects] =
    await Promise.all([
      loadGroups(profile),
      isAdmin ? loadFinanceSettings() : Promise.resolve(null),
      loadSubjects(),
      loadTeacherSubjects(),
    ]);

  return (
    <div className="cn-root">
      <ToastHost>
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
          groupPanel={
            <CreateGroupForm
              teachers={teachers.map((t) => ({
                ...t,
                subjectIds: teacherSubjects.get(t.id) ?? [],
              }))}
              subjects={subjects.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
              branches={branches}
              rooms={rooms}
              canAssignTeacher={canStaff}
              pricing={
                settings
                  ? { currency: settings.currency, lessonsPerMonth: settings.lessonsPerMonth }
                  : null
              }
            />
          }
        >
          {children}
        </ConsoleChrome>
      </ToastHost>
    </div>
  );
}
