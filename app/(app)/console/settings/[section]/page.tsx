import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth";

import { resolveSection, sectionsFor } from "../section-list";
import { AccountSection } from "../sections/account";
import { BillingSection } from "../sections/billing";
import { CenterSection } from "../sections/center";
import { SettingsFrame } from "../sections/frame";
import { RolesSection } from "../sections/roles";
import { SubjectsSection } from "../sections/subjects";
import { TelegramSection } from "../sections/telegram";

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
