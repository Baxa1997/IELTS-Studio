import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { StartWizard } from "@/app/start/start-wizard";

// Self-contained fonts so the takeover renders correctly from EITHER layout
// (the app shell or the chrome-free studio shell).
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

/**
 * The mandatory first-run onboarding takeover. A learner without a study plan sees
 * ONLY this until they complete it — it's the same wizard + live coach as the
 * pre-auth /start flow, but in "authed" mode: the final step saves the plan and
 * starts the diagnostic instead of creating an account. The only escape is sign
 * out (rendered inside the wizard in authed mode).
 */
export function OnboardingTakeover() {
  return (
    <div className={`${hanken.variable} ${newsreader.variable}`}>
      <StartWizard mode="authed" />
    </div>
  );
}
