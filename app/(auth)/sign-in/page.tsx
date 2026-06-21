import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { getSession, roleHome, safeNextPath } from "@/lib/auth";

import { SignInForm } from "./sign-in-form";

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A1C33";

export const metadata: Metadata = {
  title: "Sign in | IELTS Studio",
  description: "Sign in to your IELTS Studio account — calibrated Writing & Reading practice.",
};

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);

  // Already signed in? Skip the form and go to `next` (e.g. a "Try it free" CTA)
  // or the role's home.
  const session = await getSession();
  if (session) redirect(next ?? roleHome(session.role));

  return (
    <div
      className={`${hanken.variable} ${newsreader.variable} lp-root lp-auth-grid`}
      style={{ minHeight: "100dvh", display: "grid", gridTemplateColumns: "0.92fr 1.08fr", fontFamily: SANS, color: INK }}
    >
      <BrandAside />
      <FormSide next={next} />
    </div>
  );
}

// ---- left brand panel ------------------------------------------------------

function LogoLight() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: "#fff", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 14 }}>
        IS
      </span>
      <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, color: "#fff" }}>
        IELTS <span style={{ color: "#aeb2f0" }}>Studio</span>
      </span>
    </span>
  );
}

function BrandAside() {
  const points = [
    "±0.5 of human examiners — calibrated and tracked",
    "Never rounds up — we name exactly what’s missing",
    "Every score quoted from your own work",
  ];
  return (
    <aside
      className="lp-auth-aside"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg,#3B43B5 0%,#2D3286 55%,#23275F 100%)",
        color: "#fff",
        padding: "44px clamp(36px,4vw,64px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* decorative glows */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", right: "-12%", top: "-8%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.12), transparent 62%)" }} />
        <div style={{ position: "absolute", left: "-14%", bottom: "-10%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(216,169,58,.22), transparent 64%)" }} />
      </div>

      <Link href="/" style={{ position: "relative", textDecoration: "none", width: "fit-content" }}>
        <LogoLight />
      </Link>

      <div style={{ position: "relative" }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(30px,3vw,40px)", lineHeight: 1.08, letterSpacing: "-.02em", margin: 0, textWrap: "balance" }}>
          Know your <span style={{ fontStyle: "italic", color: "#cfd2ff" }}>real</span> band. Then close the gap.
        </h1>
        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,.78)", margin: "18px 0 0", maxWidth: 380 }}>
          Pick up where you left off — your graded essays, reading attempts and band progress are all here.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 28 }}>
          {points.map((p) => (
            <div key={p} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 1 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, lineHeight: 1.45, color: "rgba(255,255,255,.92)" }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* frosted testimonial */}
      <figure style={{ position: "relative", margin: 0, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: 20, backdropFilter: "blur(6px)" }}>
        <blockquote style={{ fontFamily: SERIF, fontWeight: 400, fontStyle: "italic", fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,.95)", margin: 0 }}>
          “The band I practised with is the band I got on exam day.”
        </blockquote>
        <figcaption style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 16 }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: 13, color: "#fff" }}>SK</span>
          <span style={{ fontFamily: SANS, fontSize: 13.5, color: "rgba(255,255,255,.82)" }}>
            <b style={{ color: "#fff" }}>Sara K.</b> · reached Band 7.0
          </span>
        </figcaption>
      </figure>
    </aside>
  );
}

// ---- right form panel ------------------------------------------------------

function FormSide({ next }: { next: string | null }) {
  return (
    <main style={{ background: "linear-gradient(180deg,#FBFAF3,#F3F1E5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "44px clamp(20px,5vw,56px)" }}>
      <div style={{ width: "100%", maxWidth: 408 }}>
        {/* compact logo (mobile, where the brand aside is hidden) */}
        <Link href="/" className="lp-auth-mobile-logo" style={{ textDecoration: "none", alignItems: "center", marginBottom: 28 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: INDIGO, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 13 }}>IS</span>
            <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, color: INK }}>IELTS <span style={{ color: INDIGO }}>Studio</span></span>
          </span>
        </Link>

        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase", color: INDIGO }}>Welcome back</div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,3vw,34px)", lineHeight: 1.1, letterSpacing: "-.015em", color: INK, margin: "8px 0 0" }}>Sign in to your account</h2>
        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, lineHeight: 1.6, color: "#6b6e84", margin: "10px 0 28px" }}>
          Continue your IELTS Writing &amp; Reading practice.
        </p>

        <SignInForm next={next} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
          <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14.5, color: "#6b6e84", margin: 0 }}>
            New here?{" "}
            <Link href="/sign-up" style={{ fontWeight: 600, color: INDIGO, textDecoration: "none" }}>Create an account</Link>
          </p>
          <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14.5, color: "#6b6e84", margin: 0 }}>
            Just looking?{" "}
            <Link href="/grade" style={{ fontWeight: 600, color: INDIGO, textDecoration: "none" }}>Grade an essay free — no account</Link>
          </p>
        </div>

        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 12, lineHeight: 1.5, color: "#9a998c", margin: "32px 0 0" }}>
          Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English.
        </p>
      </div>
    </main>
  );
}
