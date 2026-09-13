import { redirect } from "next/navigation";

import { isHomeworkOnlyStudent, requireOrgUser } from "@/lib/auth";

import { resolveLearnerSection } from "../learner-sections";
import { LearnerAccountSection } from "../sections/account";
import { LearnerBillingSection } from "../sections/billing";
import { DeleteAccountSection } from "../sections/delete";
import { LearnerSettingsFrame } from "../sections/frame";
import { StudyGoalSection } from "../sections/goal";

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
      ) : section === "billing" ? (
        <LearnerBillingSection organizationId={profile.organization_id} />
      ) : (
        <DeleteAccountSection organizationId={profile.organization_id} />
      )}
    </LearnerSettingsFrame>
  );
}
