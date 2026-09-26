import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";

import { resolveSection, sectionsFor } from "./_lib/section-list";
import { AccountSection } from "./_components/account";
import { AppearanceSection } from "@/shared/components/account/appearance";
import { BillingSection } from "./_components/billing";
import { CenterSection } from "./_components/center";
import { SettingsFrame } from "./_components/frame";
import { RolesSection } from "./_components/roles";
import { SubjectsSection } from "./_components/subjects";
import { TelegramSection } from "./_components/telegram";

export const dynamic = "force-dynamic";

/**
 * One settings section, inside the settings frame.
 *
 * A section this role may not open — or one that does not exist — sends them to
 * the first section they do have, rather than to an error. Somebody who followed
 * an old link or a colleague's bookmark has done nothing wrong.
 */
export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { profile } = await requireStaff();
  const { section: raw } = await params;

  const section = resolveSection(profile.role, raw);
  if (!section) {
    const first = sectionsFor(profile.role)[0];
    redirect(first ? `/console/settings/${first.key}` : "/console");
  }

  return (
    <SettingsFrame role={profile.role} active={section}>
      {section === "account" ? (
        <AccountSection profile={profile} />
      ) : section === "appearance" ? (
        /* The learner section, reused verbatim. Theme and language are personal
           settings with no org, role or plan in them, so a second copy would be
           two things to keep in step for no difference on screen. */
        <AppearanceSection />
      ) : section === "center" ? (
        <CenterSection profile={profile} />
      ) : section === "telegram" ? (
        <TelegramSection profile={profile} />
      ) : section === "billing" ? (
        <BillingSection profile={profile} />
      ) : section === "subjects" ? (
        <SubjectsSection />
      ) : (
        <RolesSection />
      )}
    </SettingsFrame>
  );
}
