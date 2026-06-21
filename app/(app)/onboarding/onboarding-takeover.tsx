import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { SignOutButton } from "@/app/(auth)/sign-out-button";

import { OnboardingForm } from "./onboarding-form";

// Self-contained fonts so the takeover renders correctly from EITHER layout
// (the app shell or the chrome-free studio shell).
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1A2138";

/**
 * The mandatory first-run onboarding takeover — full-screen, no app nav, no skip.
 * A learner without a study plan sees ONLY this until they complete it; the only
 * way out is to sign out. Once saved, the answers drive the level-matched tasks
 * and the paced plan, so we collect them up front.
 */
export function OnboardingTakeover() {
  return (
    <div
      className={`${hanken.variable} ${newsreader.variable}`}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#F4F1E7", fontFamily: SANS, display: "flex", flexDirection: "column", overflow: "auto" }}
    >
      {/* minimal top bar — brand + sign out (the only escape) */}
      <header style={{ flexShrink: 0, height: 62, borderBottom: "1px solid #E7E3D5", background: "#FBFAF3", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(16px,4vw,40px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: "#3B43B5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 14 }}>IS</span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK }}>
            IELTS <span style={{ color: "#3B43B5" }}>Studio</span>
          </span>
        </div>
        <SignOutButton />
      </header>

      {/* split body */}
      <div className="lp-onb-grid" style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)" }}>
        {/* left — why / what you'll get */}
        <div style={{ background: "linear-gradient(150deg,#3B43B5 0%,#2A2F86 100%)", color: "#fff", padding: "clamp(28px,5vw,64px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#C7F25B" }}>Step 1 of 2 · takes a minute</div>
            <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.06, letterSpacing: "-.015em", margin: "14px 0 0" }}>
              Let&rsquo;s build your IELTS plan
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 16.5, lineHeight: 1.55, color: "#D7D9F8", margin: "16px 0 28px" }}>
              Three quick answers and the rest of the app shapes itself around you — no two learners get the same plan.
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["Tasks at your level", "Every writing prompt is pitched at your band and nudged toward your goal — never too easy, never out of reach."],
                ["A roadmap to your target", "A week-by-week pace built from your target band and test date, so you always know what to do next."],
                ["Focus where it counts", "We track your weakest criterion and point each session at the fix that lifts your band fastest."],
                ["Honest level checks", "Conservative band estimates that re-check themselves as your exam nears — your 7 is a real 7."],
              ].map(([title, body]) => (
                <li key={title} style={{ display: "flex", gap: 13 }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C7F25B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <div>
                    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15.5 }}>{title}</div>
                    <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: "#CDCFF6", marginTop: 2 }}>{body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* right — the form */}
        <div style={{ padding: "clamp(28px,5vw,56px)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
          <div style={{ width: "100%", maxWidth: 460 }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: INK, margin: "0 0 4px" }}>About you</h2>
            <p style={{ fontFamily: SANS, fontSize: 14.5, color: "#5A6076", margin: "0 0 22px" }}>You can change any of this later from your plan.</p>
            <OnboardingForm mode="create" initial={{ selfReportedBand: null, targetBand: 7, examDate: null }} />
          </div>
        </div>
      </div>
    </div>
  );
}
