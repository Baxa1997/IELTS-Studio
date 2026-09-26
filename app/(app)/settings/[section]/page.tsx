import { redirect } from "next/navigation";

import { isHomeworkOnlyStudent, requireOrgUser } from "@/lib/auth";

import { resolveLearnerSection } from "./_lib/learner-sections";
import { LearnerAccountSection } from "./_components/account";
import { AppearanceSection } from "@/shared/components/account/appearance";
import { LearnerBillingSection } from "./_components/billing";
import { DeleteAccountSection } from "./_components/delete";
import { LearnerSettingsFrame } from "./_components/frame";
import { StudyGoalSection } from "./_components/goal";

export const dynamic = "force-dynamic";

/**
 * A solo learner's settings.
 *
 * Staff are sent to the console's own settings. A center student has none: their
 * center creates, renames and resets their account, and they practise what is set.
 */
export default async function LearnerSettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console/settings");
  if (isHomeworkOnlyStudent(profile)) redirect("/assignments");

  const { section: raw } = await params;
  const section = resolveLearnerSection(raw);
  if (!section) redirect("/settings/account");

  return (
    <LearnerSettingsFrame active={section}>
      {section === "account" ? (
        <LearnerAccountSection profileId={profile.id} />
      ) : section === "goal" ? (
        <StudyGoalSection studentId={profile.id} />
      ) : section === "appearance" ? (
        <AppearanceSection />
      ) : section === "billing" ? (
        <LearnerBillingSection organizationId={profile.organization_id} />
      ) : (
        <DeleteAccountSection organizationId={profile.organization_id} />
      )}
    </LearnerSettingsFrame>
  );
}
