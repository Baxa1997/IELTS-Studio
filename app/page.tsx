import type { Metadata } from "next";
import Link from "next/link";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { getSession, roleHome } from "@/lib/auth";
import { PLAN_ORDER, planTier, type OrgPlan } from "@/lib/billing/plans";

import { LiveGradingPanel } from "./_landing/live-grading-panel";

// Marketing fonts — scoped to this page via CSS variables, so the rest of the
// app keeps Geist. Newsreader (serif display) + Hanken Grotesk (UI sans).
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A1C33";
const MUTED = "#565a72";

export const metadata: Metadata = {
  title: "Know your real IELTS band — then close the gap | Writing & Reading coach",
  description:
    "Watch a calibrated, conservative AI examiner grade your IELTS essay criterion by criterion, " +
    "show the one fix that moves you up, and track every band as you improve. Original content, no past papers.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  // Marketing front door for everyone; signed-in visitors get a shortcut, not a redirect.
  const session = await getSession();
  const home = session ? roleHome(session.role) : null;

  return (
    <div
      className={`${hanken.variable} ${newsreader.variable} lp-root`}
      style={{
        background: "linear-gradient(180deg,#FBFAF3 0%,#F1EFE2 60%,#F3F1E5 100%)",
        fontFamily: SANS,
        color: INK,
        minHeight: "100%",
      }}
    >
      <SiteNav home={home} />
      <Hero />
      <TrustStrip />
      <RevisionLoop />
      <Guidance />
      <Skills />
      <Testimonials />
      <ContentMoat />
      <Pricing />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

// ---- shared bits -----------------------------------------------------------

const SHELL: React.CSSProperties = { maxWidth: 1340, margin: "0 auto", padding: "0 clamp(20px,5vw,64px)" };

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  background: INDIGO,
  color: "#fff",
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 16,
  padding: "15px 24px",
  borderRadius: 11,
  textDecoration: "none",
  boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)",
};

const BTN_GHOST: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "#fff",
  border: "1px solid #DAD8C9",
  color: INK,
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 16,
  padding: "15px 24px",
  borderRadius: 11,
  textDecoration: "none",
};

/** Full-width section band. The top border + distinct background give the page a
 *  clear, solid rhythm so each section reads as its own surface. */
function Band({ id, bg = "transparent", pad = "clamp(48px,8vw,72px)", children }: { id?: string; bg?: string; pad?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ background: bg, borderTop: "1px solid #EAE7D8" }}>
      <div style={{ ...SHELL, paddingTop: pad, paddingBottom: pad }}>{children}</div>
    </section>
  );
}

function SectionHead({ title, sub, maxSub = 660 }: { title: string; sub: string; maxSub?: number }) {
  return (
    <>
      <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(30px,4.5vw,42px)", lineHeight: 1.1, color: INK, letterSpacing: "-.015em", margin: 0 }}>{title}</h2>
      <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 18, lineHeight: 1.6, color: "#6b6e84", margin: "14px 0 0", maxWidth: maxSub }}>{sub}</p>
    </>
  );
}

function Check({ color = INDIGO, size = 16, sw = 2.4 }: { color?: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: INDIGO, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 14 }}>
        IS
      </span>
      <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, color: light ? "#fff" : INK }}>
        IELTS <span style={{ color: light ? "#aeb2f0" : INDIGO }}>Studio</span>
      </span>
    </span>
  );
}

// ---- nav -------------------------------------------------------------------

function SiteNav({ home }: { home: string | null }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px clamp(20px,5vw,64px)",
        borderBottom: "1px solid #EAE7D8",
        background: "rgba(251,250,243,.86)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <Logo />
      </Link>
      <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: 34, fontFamily: SANS, fontWeight: 500, fontSize: 15, color: "#4b4e63" }}>
        <a href="#how" style={{ color: "inherit", textDecoration: "none" }}>How it works</a>
        <a href="#skills" style={{ color: "inherit", textDecoration: "none" }}>Skills</a>
        <a href="#reviews" style={{ color: "inherit", textDecoration: "none" }}>Reviews</a>
        <a href="#pricing" style={{ color: "inherit", textDecoration: "none" }}>Pricing</a>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {home ? (
          <Link href={home} style={{ ...BTN_PRIMARY, padding: "10px 20px", fontSize: 15 }}>
            Open dashboard
          </Link>
        ) : (
          <>
            <Link href="/sign-in" className="lp-nav-cta-secondary" style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: INK, textDecoration: "none" }}>
              Sign in
            </Link>
            <Link href="/grade" style={{ ...BTN_PRIMARY, padding: "10px 20px", fontSize: 15 }}>
              Try it free
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ---- hero ------------------------------------------------------------------

function Hero() {
  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 73px)", display: "flex", alignItems: "center", overflow: "hidden" }}>
      {/* soft brand glow behind the panel for depth */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", right: "-4%", top: "6%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,67,181,.13), transparent 62%)" }} />
        <div style={{ position: "absolute", left: "-8%", bottom: "-6%", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(216,169,58,.10), transparent 64%)" }} />
      </div>
      <div
        className="lp-hero-grid"
        style={{ ...SHELL, position: "relative", padding: "36px clamp(20px,5vw,64px)", display: "grid", gridTemplateColumns: "0.86fr 1.14fr", gap: "clamp(36px,5vw,54px)", alignItems: "center", width: "100%" }}
      >
        {/* left copy */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#EBECFA", border: "1px solid #D4D6F4", color: INDIGO, fontFamily: SANS, fontWeight: 600, fontSize: 13, padding: "7px 14px", borderRadius: 999 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            AI-graded · Writing &amp; Reading
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(34px,5.2vw,56px)", lineHeight: 1.04, color: INK, letterSpacing: "-.02em", margin: "20px 0 0", textWrap: "balance" }}>
            Know your <span style={{ color: INDIGO, fontStyle: "italic" }}>real</span> band. Then close the gap.
          </h1>
          <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 18, lineHeight: 1.6, color: MUTED, margin: "20px 0 0", maxWidth: 480 }}>
            Watch the AI grade your essay the way an examiner does — criterion by criterion, mistake by mistake — then show the one fix that moves you up, and track every band as you improve.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 30, flexWrap: "wrap" }}>
            <Link href="/grade" style={BTN_PRIMARY}>
              Grade an essay free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 5 7 7-7 7" />
              </svg>
            </Link>
            <a href="#how" style={BTN_GHOST}>See how it works</a>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 30, flexWrap: "wrap" }}>
            <SkillChip label="Writing" />
            <SkillChip label="Reading" />
            <SkillChip label="Speaking" soon />
            <SkillChip label="Listening" soon />
          </div>
          <p style={{ fontFamily: SANS, fontWeight: 500, fontSize: 12.5, color: "#8a897c", margin: "20px 0 0" }}>
            No login for your first grade · conservative by design · not affiliated with IELTS®
          </p>
        </div>

        {/* right: live AI grading panel */}
        <LiveGradingPanel />
      </div>
    </div>
  );
}

function SkillChip({ label, soon = false }: { label: string; soon?: boolean }) {
  if (soon) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: "1px dashed #C8C6B6", borderRadius: 999, padding: "8px 14px", fontFamily: SANS, fontWeight: 600, fontSize: 13, color: "#8a897c" }}>
        {label}
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 11, color: INDIGO, background: "#EBECFA", padding: "2px 7px", borderRadius: 5 }}>Soon</span>
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E1DFD0", borderRadius: 999, padding: "8px 14px", fontFamily: SANS, fontWeight: 600, fontSize: 13, color: INK }}>
      {label}
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: INDIGO }} />
    </div>
  );
}

// ---- trust strip -----------------------------------------------------------

function TrustStrip() {
  const items = [
    {
      head: "±0.5 of human examiners",
      sub: "Calibrated against a human-judged set, tracked over time.",
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </>
      ),
    },
    {
      head: "Never rounds up",
      sub: "Between two bands we round down and tell you what’s missing.",
      icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    },
    {
      head: "Every score is evidenced",
      sub: "Quoted from your work, criterion by criterion — no black box.",
      icon: <path d="M20 6 9 17l-5-5" />,
    },
  ];
  return (
    <Band bg="#fff" pad="clamp(28px,4vw,40px)">
      <div className="lp-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40 }}>
        {items.map((it) => (
          <div key={it.head} style={{ display: "flex", gap: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}>
              {it.icon}
            </svg>
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK }}>{it.head}</div>
              <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, lineHeight: 1.5, color: "#6b6e84", marginTop: 2 }}>{it.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Band>
  );
}

// ---- revision loop ---------------------------------------------------------

function RevisionLoop() {
  const steps = [
    {
      n: "Step 1",
      head: "Write or paste",
      body: "Pick a Task 1/2 prompt or paste your essay. The AI reads it like an examiner and grades each criterion in seconds.",
      icon: (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
      ),
    },
    {
      n: "Step 2",
      head: "See exactly what caps you",
      body: "Not just a number — the precise gap holding each criterion back, quoted from your text, with the single highest-value fix.",
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </>
      ),
    },
    {
      n: "Step 3",
      head: "Revise & re-grade",
      body: "Rewrite, resubmit, and watch the band move. The AI tracks every version and your progress over time.",
      icon: (
        <>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M3 21v-5h5" />
        </>
      ),
    },
  ];
  return (
    <Band id="how" bg="#FBFAF4">
      <SectionHead title="The revision loop, not score-and-forget" sub="Every other app grades you and dumps you at the next test. We do the opposite — the AI walks a single essay from 6 to 7 with you, and remembers every version." maxSub={640} />
      <div className="lp-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginTop: 42 }}>
        {steps.map((s) => (
          <div key={s.n} className="lp-hover" style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
              </div>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", color: "#9a998c" }}>{s.n}</span>
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, color: INK, marginTop: 16 }}>{s.head}</div>
            <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, lineHeight: 1.6, color: "#6b6e84", margin: "7px 0 0" }}>{s.body}</p>
          </div>
        ))}
      </div>
    </Band>
  );
}

// ---- guidance: practice every writing task ---------------------------------

function Guidance() {
  const tasks = [
    {
      words: "150+ words",
      title: "Task 1 Academic",
      body: "Describe charts, graphs, maps and processes with accurate data selection and academic phrasing.",
      icon: (
        <>
          <path d="M3 3v18h18" />
          <path d="M7 15l3-3 3 2 4-5" />
        </>
      ),
    },
    {
      words: "150+ words",
      title: "Task 1 General",
      body: "Write formal, semi-formal or informal letters in the right register, tone and format for the situation.",
      icon: (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      ),
    },
    {
      words: "250+ words",
      title: "Task 2 Essay",
      body: "Build a structured argument or discussion that shows clear thinking, cohesion and a defended position.",
      icon: (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
      ),
    },
  ];
  return (
    <Band id="practice" bg="#fff">
      <SectionHead title="Guided practice for every writing task" sub="Original, exam-faithful prompts for each task type — graded the moment you submit, with a fix you can act on right away." />
      <div className="lp-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginTop: 42 }}>
        {tasks.map((t) => (
          <div key={t.title} className="lp-hover" style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, padding: 26, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
              </div>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: INDIGO, background: "#EBECFA", padding: "4px 9px", borderRadius: 6 }}>{t.words}</span>
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 21, color: INK, marginTop: 16 }}>{t.title}</div>
            <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, lineHeight: 1.6, color: "#6b6e84", margin: "7px 0 18px", flex: 1 }}>{t.body}</p>
            <Link href="/grade" className="lp-link" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 600, fontSize: 15, color: INDIGO, textDecoration: "none" }}>
              Try a demo
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </Band>
  );
}

// ---- skills ----------------------------------------------------------------

function Skills() {
  return (
    <Band id="skills" bg="#F4F4FB">
      <SectionHead title="Deep on the skills that decide Band 8" sub="We go deepest on Writing and Reading — where most scores are won or lost — with Speaking and Listening on the way." />
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 42 }}>
        <SkillCard
          title="Writing"
          icon={
            <>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </>
          }
          points={[
            "Per-criterion bands with quoted evidence (TR · CC · LR · GRA)",
            "The revision loop: rewrite, resubmit, re-grade the same essay",
            "Band 8 sample comparison and a current → target tracker",
          ]}
        />
        <SkillCard
          title="Reading"
          icon={
            <>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </>
          }
          points={[
            "Original passages and every real question type, auto-graded",
            "For each wrong answer: why the trap worked + the proving sentence",
            "Question-type analytics and a timed full-section exam mode",
          ]}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, background: "#fff", border: "1px solid #E0E1F4", borderRadius: 14, padding: "16px 22px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F4F4FB", border: "1px solid #E0E1F4", color: "#7a7c92", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M19 10a7 7 0 0 1-14 0" />
              <path d="M12 19v3" />
            </svg>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F4F4FB", border: "1px solid #E0E1F4", color: "#7a7c92", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 14a9 9 0 0 1 18 0" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z" />
              <path d="M3 19a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z" />
            </svg>
          </div>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, lineHeight: 1.5, color: "#3a3d52", flex: 1, minWidth: 240 }}>
          <b style={{ color: INK }}>Speaking &amp; Listening are in development</b> — AI mock interviews and section-timed practice, included free for members when they launch.
        </div>
      </div>
    </Band>
  );
}

function SkillCard({ title, icon, points }: { title: string; icon: React.ReactNode; points: string[] }) {
  return (
    <div className="lp-hover" style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 18, padding: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: INK }}>{title}</div>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, color: INDIGO, background: "#EBECFA", padding: "3px 9px", borderRadius: 6 }}>Live</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 20 }}>
        {points.map((p) => (
          <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ marginTop: 2 }}>
              <Check size={18} sw={2.4} />
            </span>
            <span style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, lineHeight: 1.5, color: "#3a3d52" }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- student feedback ------------------------------------------------------

// NOTE: illustrative placeholder testimonials — replace with real, consented
// student feedback before launch (PII stripped, per the content/consent policy).
const TESTIMONIALS = [
  { initials: "AT", name: "Aigerim T.", meta: "24 · Kazakhstan", lift: "6.5 → 7.5 · 5 weeks", quote: "I kept getting 6.5 and never knew why. The per-criterion breakdown showed Lexical Resource was my ceiling — three rewrites later it finally moved." },
  { initials: "DM", name: "Diego M.", meta: "27 · Colombia", lift: "6.0 → 7.0 · 4 weeks", quote: "The fixes were specific, not generic “use better vocabulary”. It quoted my own sentences back and showed the exact swap. That’s what changed my band." },
  { initials: "LP", name: "Linh P.", meta: "22 · Vietnam", lift: "6.5 → 8.0 · 8 weeks", quote: "Reading traps used to catch me every time. Seeing why each wrong answer was wrong, with the proving sentence, fixed my accuracy fast." },
  { initials: "SK", name: "Sara K.", meta: "30 · Morocco", lift: "6.0 → 7.0 · 6 weeks", quote: "It never inflated my score — and I’m grateful. The band I practised with is the band I got on exam day." },
];

function Stars() {
  return (
    <div style={{ display: "flex", gap: 3 }} aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#F5B544">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

function Testimonials() {
  return (
    <Band id="reviews" bg="#fff">
      <SectionHead title="What IELTS students say" sub="Practice that actually moves the band. Real movement looks like this." />
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 42 }}>
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="lp-hover" style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 18, padding: 28, boxShadow: "0 18px 44px -36px rgba(26,28,51,.4)" }}>
            <Stars />
            <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15.5, lineHeight: 1.7, color: "#3a3d52", margin: "16px 0 22px" }}>“{t.quote}”</p>
            <div style={{ display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: INDIGO, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: 15, flex: "none" }}>
                {t.initials}
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK }}>{t.name}</div>
                <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, color: "#9a998c" }}>{t.meta}</div>
              </div>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12.5, color: INDIGO, background: "#EBECFA", padding: "6px 12px", borderRadius: 999, tabSize: 4 }}>{t.lift}</span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 12.5, color: "#9a998c", margin: "20px 0 0" }}>
        Illustrative results — individual band gains vary with effort and starting level.
      </p>
    </Band>
  );
}

// ---- content moat ----------------------------------------------------------

function ContentMoat() {
  return (
    <Band bg="#FBFAF4">
      <div style={{ background: "linear-gradient(135deg,#F4F4FB,#FBFAF4)", border: "1px solid #E0E1F4", borderRadius: 20, padding: "clamp(28px,5vw,48px)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #D4D6F4", color: INDIGO, fontFamily: SANS, fontWeight: 600, fontSize: 13, padding: "6px 13px", borderRadius: 999 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          100% original content
        </div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,4vw,38px)", lineHeight: 1.15, color: INK, letterSpacing: "-.01em", margin: "18px 0 0", maxWidth: 760 }}>
          No past papers. Unlimited fresh, exam-faithful practice.
        </h2>
        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 17, lineHeight: 1.6, color: MUTED, margin: "14px 0 0", maxWidth: 720 }}>
          We never copy Cambridge or official test books — every passage and prompt is AI-generated to the exam spec and expert-verified. Your practice never runs out, never goes stale, and stays on the right side of copyright.
        </p>
      </div>
    </Band>
  );
}

// ---- pricing (B2C: framed by real grading/generation limits) ---------------

const PLAN_CTA: Record<OrgPlan, { label: string; href: string }> = {
  trial: { label: "Start free", href: "/sign-up" },
  starter: { label: "Choose plan", href: "/sign-up" },
  pro: { label: "Choose plan", href: "/sign-up" },
  enterprise: { label: "Contact us", href: "mailto:sales@example.com" },
};

function planFeatures(id: OrgPlan): string[] {
  const t = planTier(id);
  const grad = t.gradeLimit == null ? "Unlimited essay gradings" : `${t.gradeLimit.toLocaleString()} essay gradings / mo`;
  const gen = t.generateLimit == null ? "Unlimited practice sets" : `${t.generateLimit.toLocaleString()} practice sets / mo`;
  const third =
    id === "trial"
      ? "Writing + Reading practice"
      : id === "starter"
        ? "Full revision loop + progress tracking"
        : id === "pro"
          ? "Priority grading queue"
          : "Priority support";
  return [grad, gen, third];
}

function Pricing() {
  return (
    <Band id="pricing" bg="#fff">
      <SectionHead title="Simple, local-friendly pricing" sub="Start free with the public grader — no card. Pay in UZS via Payme or Click, or by card." />
      <div className="lp-cols-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 42, alignItems: "start" }}>
        {PLAN_ORDER.map((id) => {
          const t = planTier(id);
          const popular = id === "starter";
          const cta = PLAN_CTA[id];
          const priceLabel = t.price == null ? "Custom" : t.price === 0 ? "Free" : `$${t.price}`;
          return (
            <div
              key={id}
              className="lp-hover"
              style={{
                background: "#fff",
                border: popular ? `2px solid ${INDIGO}` : "1px solid #E7E4D6",
                borderRadius: 18,
                padding: 26,
                boxShadow: popular ? "0 28px 56px -36px rgba(59,67,181,.6)" : "none",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK }}>{t.name}</div>
                {popular ? (
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, color: INDIGO, background: "#EBECFA", padding: "3px 10px", borderRadius: 999 }}>Popular</span>
                ) : null}
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, color: INK }}>{priceLabel}</span>
                {t.price != null && t.price > 0 ? (
                  <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: "#8a897c" }}>/mo</span>
                ) : null}
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: "#9a998c", marginTop: 2, minHeight: 18 }}>
                {t.priceUzs != null ? `≈ ${t.priceUzs.toLocaleString()} UZS/mo` : " "}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                {planFeatures(id).map((f) => (
                  <div key={f} style={{ display: "flex", gap: 9, fontFamily: SANS, fontWeight: 400, fontSize: 14, color: "#3a3d52" }}>
                    <Check />
                    {f}
                  </div>
                ))}
              </div>
              {cta.href.startsWith("mailto:") ? (
                <a href={cta.href} style={priceCtaStyle(popular)}>{cta.label}</a>
              ) : (
                <Link href={cta.href} style={priceCtaStyle(popular)}>{cta.label}</Link>
              )}
            </div>
          );
        })}
      </div>
    </Band>
  );
}

function priceCtaStyle(popular: boolean): React.CSSProperties {
  return {
    display: "block",
    marginTop: 24,
    textAlign: "center",
    background: popular ? INDIGO : "#fff",
    border: popular ? "none" : "1px solid #DAD8C9",
    color: popular ? "#fff" : INK,
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 15,
    padding: 12,
    borderRadius: 11,
    textDecoration: "none",
  };
}

// ---- final CTA + footer ----------------------------------------------------

function FinalCta() {
  return (
    <Band bg="transparent">
      <div style={{ background: INDIGO, color: "#fff", borderRadius: 20, padding: "clamp(36px,6vw,56px)", textAlign: "center", boxShadow: "0 40px 80px -50px rgba(59,67,181,.8)" }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,4vw,40px)", lineHeight: 1.1, letterSpacing: "-.015em", margin: 0, textWrap: "balance" }}>
          Find out your real band in 60 seconds
        </h2>
        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 17, lineHeight: 1.6, color: "rgba(255,255,255,.82)", margin: "14px auto 0", maxWidth: 520 }}>
          Paste an essay, get a calibrated band and the one fix that moves you up — no account needed.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 28 }}>
          <Link href="/grade" style={{ ...BTN_GHOST, background: "#fff", border: "none", color: INDIGO }}>
            Grade an essay free
          </Link>
          <Link href="/sign-up" style={{ ...BTN_GHOST, background: "transparent", border: "1px solid rgba(255,255,255,.4)", color: "#fff" }}>
            Create an account
          </Link>
        </div>
      </div>
    </Band>
  );
}

const FOOTER_COLS: { head: string; links: { label: string; href: string }[] }[] = [
  {
    head: "Practice",
    links: [
      { label: "Writing studio", href: "/write" },
      { label: "Reading practice", href: "/read" },
      { label: "Level diagnostic", href: "/diagnostic" },
      { label: "Your activity", href: "/activities" },
    ],
  },
  {
    head: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "The two skills", href: "/#skills" },
      { label: "Reviews", href: "/#reviews" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    head: "Get started",
    links: [
      { label: "Grade an essay free", href: "/grade" },
      { label: "Create an account", href: "/sign-up" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", color: "#aeb2f0" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </a>
  );
}

function SiteFooter() {
  return (
    <footer style={{ background: "#15162E", color: "#c7c9e6" }}>
      <div style={{ ...SHELL, paddingTop: "clamp(48px,7vw,72px)", paddingBottom: 28 }}>
        <div className="lp-cols-4" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}>
          {/* brand */}
          <div>
            <Logo light />
            <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, lineHeight: 1.6, color: "#9698c0", margin: "16px 0 0", maxWidth: 280 }}>
              A calibrated, conservative AI coach for IELTS Writing &amp; Reading. Know your real band — then close the gap.
            </p>
            <a href="mailto:hello@ieltsstudio.app" className="lp-foot-link" style={{ display: "inline-block", fontFamily: SANS, fontWeight: 500, fontSize: 14, color: "#aeb2f0", textDecoration: "none", marginTop: 16 }}>
              hello@ieltsstudio.app
            </a>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <SocialIcon label="Instagram">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <path d="M17.5 6.5h.01" />
              </SocialIcon>
              <SocialIcon label="YouTube">
                <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 1.7 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22.3 12 31 31 0 0 0 22 8.2Z" />
                <path d="m10 15 5-3-5-3z" />
              </SocialIcon>
              <SocialIcon label="Telegram">
                <path d="M21.5 4.5 2.5 11.8l5.4 1.7 1.6 5.3 2.8-3.2 4.7 3.4z" />
                <path d="m7.9 13.5 8.6-6.3" />
              </SocialIcon>
              <SocialIcon label="LinkedIn">
                <path d="M16 8a6 6 0 0 1 6 6v6h-4v-6a2 2 0 0 0-4 0v6h-4v-10h4v1.5" />
                <rect x="2" y="9" width="4" height="11" />
                <circle cx="4" cy="4" r="2" />
              </SocialIcon>
            </div>
          </div>
          {/* link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.head}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#7d80ad" }}>{col.head}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} className="lp-foot-link" style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14.5, color: "#b7b9da", textDecoration: "none" }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "40px 0 24px" }} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, color: "#7d80ad" }}>© 2026 IELTS Studio. All rights reserved.</div>
          <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 12.5, lineHeight: 1.5, color: "#7d80ad", maxWidth: 620, margin: 0, textAlign: "right" }}>
            Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English. All practice content is original and AI-generated.
          </p>
        </div>
      </div>
    </footer>
  );
}
