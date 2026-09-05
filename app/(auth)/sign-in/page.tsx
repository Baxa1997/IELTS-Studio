import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Manrope, Sora } from "next/font/google";

import { DESIGN_CSS, Wordmark } from "@/app/_landing/design-chrome";
import { BRAND, CANVAS, DISPLAY, INK, RADIUS, SANS, WHITE } from "@/app/_landing/design";
import { LangPicker } from "@/app/_landing/lang-picker";
import { getSession, roleHome, safeNextPath } from "@/lib/auth";

import { DesignSignInForm } from "./design-form";

/**
 * Sign-in, rebuilt to the design canvas.
 *
 * The canvas drops the site header on this page (`chromeOn: p !== 'login'`) and
 * replaces it with a two-panel layout: a burgundy gradient panel carrying the
 * proposition, and the form beside it. Auth behaviour is untouched — see
 * `design-form.tsx`.
 */

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sign in | EngProgress",
  description:
    "Sign in to EngProgress — AI-graded IELTS and CEFR practice for learners and education centers.",
};

export const dynamic = "force-dynamic";

/** The three proof rows down the left panel. */
const POINTS = [
  {
    title: "AI examiner for IELTS & CEFR",
    body: "Band scores within ±0.5 of human examiners.",
  },
  {
    title: "Practice generated at your level",
    body: "Writing, Reading, Listening and Speaking, on demand.",
  },
  {
    title: "Built for education centers",
    body: "Student logins, groups and band reporting in one place.",
  },
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);

  // Already signed in? Skip the form and go to `next` or the role's home.
  const session = await getSession();
  if (session) redirect(next ?? roleHome(session.role));

  return (
    <div
      className={`${sora.variable} ${manrope.variable}`}
      style={{
        minHeight: "100dvh",
        background: CANVAS,
        padding: 22,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))",
        gap: 22,
        fontFamily: SANS,
        color: INK,
      }}
    >
      <style>{DESIGN_CSS}</style>

      {/* left — the burgundy proposition panel */}
      <div
        style={{
          background: "#43001d",
          backgroundImage: `linear-gradient(155deg,${BRAND} 0%,#5c0125 52%,#2c0013 100%)`,
          color: WHITE,
          borderRadius: RADIUS.panel,
          padding: "54px 52px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Wordmark onDark />
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: "clamp(30px,4vw,42px)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: "52px 0 0",
            maxWidth: 460,
            textWrap: "pretty",
          }}
        >
          Know your real band — then close the gap.
        </h2>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.82)",
            maxWidth: 440,
            margin: "20px 0 0",
          }}
        >
          Pick up where you left off: graded essays, reading attempts and your CEFR level are all
          here.
        </p>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
          {POINTS.map((p, i) => (
            <div key={p.title}>
              {i > 0 ? <div style={{ height: 1, background: "rgba(255,255,255,0.16)" }} /> : null}
              <div style={{ padding: i === POINTS.length - 1 ? "22px 0 0" : "22px 0" }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{p.title}</div>
                <div
                  style={{ fontSize: 15, color: "rgba(255,255,255,0.68)", marginTop: 5 }}
                >
                  {p.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* right — the form */}
      <div
        style={{
          padding: "44px 52px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440, display: "flex", justifyContent: "flex-end" }}>
          <LangPicker compact />
        </div>
        <div style={{ width: "100%", maxWidth: 440, margin: "auto 0" }}>
          <DesignSignInForm next={next} />
        </div>
      </div>
    </div>
  );
}
