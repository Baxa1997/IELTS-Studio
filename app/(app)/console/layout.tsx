import { cache } from "react";
import { Suspense } from "react";
import { Work_Sans } from "next/font/google";

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

/* The console's body type. It lived in `(app)/layout.tsx` until this subtree
   claimed it — which meant every student route preloaded the staff console's
   typeface before first paint. `.cn-root` below is where `--font-work` is
   consumed (globals.css), so this is the level that should declare it. */
const work = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work",
  display: "swap",
});

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

  return (
    <div className={`${work.variable} cn-root`}>
      <ToastHost>
        <ConsoleChrome
          userName={profile.full_name ?? user.email ?? "Account"}
          windowLabel="Last 90 days"
          enrolPanel={
            <Suspense fallback={null}>
              <EnrolPanel profileId={profile.id} />
            </Suspense>
          }
          teacherPanel={
            isOrgOwner(profile.role) ? (
              <Suspense fallback={null}>
                <TeacherPanel />
              </Suspense>
            ) : undefined
          }
          invitePanel={
            <Suspense fallback={null}>
              <InvitePanel profileId={profile.id} />
            </Suspense>
          }
          groupPanel={
            <Suspense fallback={null}>
              <GroupPanel profileId={profile.id} />
            </Suspense>
          }
        >
          {children}
        </ConsoleChrome>
      </ToastHost>
    </div>
  );
}

/**
 * Panel data is request-cached and streamed behind the chrome. The previous
 * layout awaited all of this before the console page could render, even when
 * the visitor never opened a panel.
 */
const loadPanelData = cache(async (profileId: string) => {
  const { profile } = await requireOrgUser();
  if (profile.id !== profileId) throw new Error("Panel identity changed during render");

  const isOwner = isOrgOwner(profile.role);
  const [groups, settings, subjects, teacherSubjects] = await Promise.all([
    loadGroups(profile),
    isOwner ? loadFinanceSettings() : Promise.resolve(null),
    loadSubjects(),
    loadTeacherSubjects(),
  ]);
  return { groups, settings, subjects, teacherSubjects, isOwner, canStaff: canManagePeople(profile.role) };
});

async function EnrolPanel({ profileId }: { profileId: string }) {
  const { groups: groupData } = await loadPanelData(profileId);
  return (
    <EnrolStudentPanel
      groups={groupData.groups.map((g) => ({
        id: g.id,
        name: g.name,
        meta: g.teacherName ?? "No teacher assigned",
        students: g.memberCount,
      }))}
    />
  );
}

async function TeacherPanel() {
  return <AddTeacherPanel />;
}

async function InvitePanel({ profileId }: { profileId: string }) {
  const { groups: groupData, isOwner } = await loadPanelData(profileId);
  return <InviteMemberPanel groups={groupData.groups} canInviteTeachers={isOwner} />;
}

async function GroupPanel({ profileId }: { profileId: string }) {
  const { groups: groupData, settings, subjects, teacherSubjects, canStaff } = await loadPanelData(profileId);
  const { teachers, branches, rooms } = groupData;
  return (
    <CreateGroupForm
      teachers={teachers.map((t) => ({ ...t, subjectIds: teacherSubjects.get(t.id) ?? [] }))}
      subjects={subjects.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
      branches={branches}
      rooms={rooms}
      canAssignTeacher={canStaff}
      pricing={settings ? { currency: settings.currency, lessonsPerMonth: settings.lessonsPerMonth } : null}
    />
  );
}
