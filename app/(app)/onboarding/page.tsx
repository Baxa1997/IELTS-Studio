import { redirect } from "next/navigation";

import { requireOrgUser, roleHome } from "@/lib/auth";
import { loadStudyPlan } from "@/lib/plan/service";

import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1A2138";
const MUTED = "#5A6076";

/**
 * Onboarding — the self-report step. New learners land here (the dashboard/library
 * gate sends anyone without a plan), set their level/target/test date, then go to
 * the diagnostic. Revisiting with a plan already set is "edit" mode.
 */
export default async function OnboardingPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));

  const plan = await loadStudyPlan(profile.id);
  const mode = plan ? "edit" : "create";

  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 760 }}>
      <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(26px,3vw,36px)", lineHeight: 1.08, letterSpacing: "-.015em", margin: 0, color: INK }}>
        {mode === "create" ? "Let's set up your plan" : "Update your plan"}
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.55, color: MUTED, margin: "12px 0 24px", maxWidth: 560 }}>
        {mode === "create"
          ? "Three quick questions so we can match every task to your level and pace you toward your goal."
          : "Adjust your level, target, or test date — your tasks and plan update to match."}
      </p>
      <OnboardingForm
        mode={mode}
        initial={{
          selfReportedBand: plan?.selfReportedBand ?? null,
          targetBand: plan?.targetBand ?? 7,
          examDate: plan?.examDate ?? null,
        }}
      />
    </div>
  );
}
