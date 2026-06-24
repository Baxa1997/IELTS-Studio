import type { Metadata } from "next";
import Link from "next/link";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";

import { getSession, roleHome } from "@/lib/auth";
import { PLAN_ORDER, planTier, type OrgPlan } from "@/lib/billing/plans";

// Marketing fonts — scoped to this page via CSS variables, so the rest of the
// app keeps Geist. Newsreader (serif display) + Hanken Grotesk (UI sans) +
// JetBrains Mono (the small calibrated/telemetry labels in the hero banner).
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jetbrains", display: "swap" });

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const MONO = "var(--font-jetbrains), ui-monospace, SFMono-Regular, Menlo, monospace";
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
      className={`${hanken.variable} ${newsreader.variable} ${jetbrains.variable} lp-root`}
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
      <AdaptiveEngine />
      <CoachSection />
      <Guidance />
      <Skills />
      <Grounding />
      <Testimonials />
      <ContentMoat />
      <Faq />
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
    // Sticky outer rail — transparent, just provides the top/side gap so the
    // island floats off the page edges.
    <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "16px clamp(14px,4vw,40px) 0", pointerEvents: "none" }}>
      <nav
        className="lp-nav-island"
        style={{
          pointerEvents: "auto",
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "11px 14px 11px 22px",
          borderRadius: 18,
          background: "#fff",
          border: "1px solid #E5E2D2",
          // Solid, lifted "island" — a crisp top highlight, a tight contact
          // shadow, and a broad ambient one so it reads as a real floating object.
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(26,28,51,.06), 0 14px 34px -14px rgba(26,28,51,.28), 0 4px 12px -6px rgba(26,28,51,.12)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
        <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: 30, fontFamily: SANS, fontWeight: 500, fontSize: 15, color: "#4b4e63" }}>
          <a href="#how" style={{ color: "inherit", textDecoration: "none" }}>How it works</a>
          <a href="#skills" style={{ color: "inherit", textDecoration: "none" }}>Skills</a>
          <a href="#reviews" style={{ color: "inherit", textDecoration: "none" }}>Reviews</a>
          <a href="#pricing" style={{ color: "inherit", textDecoration: "none" }}>Pricing</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {home ? (
            <Link href={home} style={{ ...BTN_PRIMARY, padding: "10px 20px", fontSize: 15 }}>
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="lp-nav-cta-secondary" style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: INK, textDecoration: "none", padding: "0 6px" }}>
                Sign in
              </Link>
              <Link href="/write" style={{ ...BTN_PRIMARY, padding: "10px 20px", fontSize: 15 }}>
                Try it free
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

// ---- hero ------------------------------------------------------------------

function Hero() {
  return (
    <div style={{ position: "relative", background: "#fff", overflow: "hidden" }}>
      {/* scoped animations + responsive rules for the banner */}
      <style>{HERO_STYLES}</style>

      {/* dot grid + soft indigo glow — purely decorative, so they must never
          intercept clicks meant for the hero CTAs beneath them */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(59,67,181,.045) 1px,transparent 1.4px)", backgroundSize: "26px 26px" }} />
      <div aria-hidden style={{ position: "absolute", left: "50%", top: 90, width: 760, height: 380, transform: "translateX(-50%)", background: "radial-gradient(ellipse,rgba(59,67,181,.09),transparent 64%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1160, margin: "0 auto", padding: "40px clamp(20px,5vw,40px) 60px" }}>
        {/* live status row */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: MONO, fontSize: 11.5, letterSpacing: ".1em", color: "#908d80" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1F8A5B", animation: "hb-pulse 1.8s infinite" }} />
            AI EXAMINER · CALIBRATED ±0.5
          </div>
        </div>

        {/* centered hero */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <div className="hb-rise hb-d1" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".22em", color: INDIGO, textTransform: "uppercase" }}>Calibrated ±0.5 to human raters</div>

          {/* today → gap → projected */}
          <div className="lp-hero-gap hb-rise hb-d2" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(20px,4vw,36px)", marginTop: 18 }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: "clamp(64px,9vw,108px)",
                  lineHeight: 0.9,
                  // warm low-band gradient (yellow → orange → red) vs. the indigo target
                  background: "linear-gradient(135deg,#F5B53C 0%,#EC7A33 48%,#D6402F 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                6.0
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".18em", color: "#C2792F", marginTop: 8 }}>TODAY</div>
            </div>
            <div style={{ width: "clamp(150px,22vw,236px)", marginBottom: 30 }}>
              <div style={{ position: "relative", height: 4, background: "#ECEAE2", borderRadius: 3 }}>
                <div className="hb-bar-fill" style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "100%", borderRadius: 3, background: `linear-gradient(90deg,#EC7A33,#D6402F 14%,#9A78D0 60%,${INDIGO})` }}>
                  <span style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, borderRadius: "50%", background: INDIGO, boxShadow: "0 0 0 4px rgba(59,67,181,.16),0 0 18px rgba(59,67,181,.5)" }} />
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: 14, fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", color: "#b4b1a3" }}>THE GAP</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(64px,9vw,108px)", lineHeight: 0.9, color: INDIGO, animation: "hb-glow 3.6s ease-in-out infinite" }}>9.0</div>
              <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".18em", color: INDIGO, marginTop: 8 }}>TARGET BAND</div>
            </div>
          </div>

          <h1 className="hb-rise hb-d3" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(30px,4.6vw,46px)", lineHeight: 1.16, color: INK, maxWidth: 780, margin: "28px auto 0", letterSpacing: "-.01em", textWrap: "balance" }}>
            See the band you&rsquo;d <span style={{ fontStyle: "italic", color: INDIGO }}>actually</span> get &mdash; then close the gap.
          </h1>
          <p className="hb-rise hb-d3" style={{ fontSize: 17, lineHeight: 1.6, color: "#57564d", maxWidth: 610, margin: "16px auto 0" }}>
            Most tools round you up to keep you happy. Our examiner reasons through every criterion &mdash; calibrated to within half a band of human raters &mdash; then shows the one fix that moves you up.
          </p>

          <div className="hb-rise hb-d4" style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
            {/* Straight into the Writing studio (the "Writing" menu item). Linking
                directly avoids bouncing the click through /sign-in: signed-in users
                land in the studio, signed-out users get a clean middleware redirect. */}
            <Link href="/write" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 16, padding: "15px 26px", borderRadius: 14, textDecoration: "none", boxShadow: "0 12px 26px rgba(59,67,181,.26)" }}>
              Grade an essay free <span aria-hidden>→</span>
            </Link>
            <Link href="/cefr" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ECEBFB", color: INDIGO, border: "1.5px solid #DEDCF5", fontFamily: SANS, fontWeight: 600, fontSize: 16, padding: "15px 22px", borderRadius: 14, textDecoration: "none" }}>Practice CEFR</Link>
            <a href="#how" style={{ display: "inline-flex", alignItems: "center", background: "#fff", color: INK, border: "1.5px solid #E4E0D0", fontFamily: SANS, fontWeight: 600, fontSize: 16, padding: "15px 24px", borderRadius: 14, textDecoration: "none" }}>See how it works</a>
          </div>

          {/* adaptive-practice proof — practice is generated for YOUR level, not a fixed test */}
          <div className="hb-rise hb-d5" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 9, marginTop: 22 }}>
            {["Generated for your level", "Fresh topic every session", "CEFR A1–C2 + IELTS bands"].map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 600, fontSize: 13, color: "#4b4e63", background: "#fff", border: "1px solid #E7E3D5", borderRadius: 999, padding: "7px 14px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: INDIGO, flex: "none" }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* AI examiner reasoning card */}
        <div className="hb-rise hb-d6" style={{ maxWidth: 1000, margin: "46px auto 0", background: "#fff", border: "1px solid #EAE7DE", borderRadius: 22, boxShadow: "0 18px 46px rgba(20,20,48,.08)", padding: "22px clamp(18px,3vw,26px)" }}>
          <div className="lp-hero-cardhead" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 0 C8 4.4 4.4 8 0 8 C4.4 8 8 11.6 8 16 C8 11.6 11.6 8 16 8 C11.6 8 8 4.4 8 0 Z" fill="#fff" /></svg>
              </span>
              <span style={{ fontWeight: 700, fontSize: 15, color: INK }}>AI Examiner</span>
              <span style={{ fontSize: 14, color: "#908d80" }}>reasoning through your essay</span>
              <span style={{ display: "inline-flex", gap: 4, marginLeft: 2, alignItems: "center" }}>
                {[0, 0.2, 0.4].map((d) => (
                  <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: INDIGO, animation: `hb-dots 1.2s infinite ${d}s` }} />
                ))}
              </span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", color: "#a8a596", whiteSpace: "nowrap" }}>14,000+ RATED ESSAYS · ±0.5 OF HUMAN RATERS</span>
          </div>

          <div style={{ marginTop: 16, fontSize: 16, lineHeight: 1.75, color: "#3f3e37" }}>
            Read <strong style={{ color: INK, fontWeight: 600 }}>248 words</strong> across 18 sentences and weighed all four criteria. Found <Chip tone="amber">subject–verb agreement ×2</Chip>, <Chip tone="amber">repetitive lexical range</Chip>, and <Chip tone="indigo">under-developed ideas</Chip>. <strong style={{ color: INK, fontWeight: 600 }}>The single fix that moves you most:</strong> correct the agreement and add two complex sentences with subordinate clauses
            <span aria-hidden style={{ display: "inline-block", width: 2, height: 17, background: INDIGO, verticalAlign: -2, marginLeft: 3, animation: "hb-blink 1.1s steps(1) infinite" }} />
          </div>

          <div className="lp-hero-bars" style={{ display: "flex", gap: 18, marginTop: 20 }}>
            <CritBar label="LEXICAL" band="5.5" pct={61} color="#E0A82E" />
            <CritBar label="GRAMMAR" band="6.0" pct={66} color={INDIGO} />
            <CritBar label="COHERENCE" band="6.0" pct={66} color={INDIGO} />
            <CritBar label="TASK RESPONSE" band="6.5" pct={72} color={INDIGO} />
          </div>

          <div className="lp-hero-cardfoot" style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderTop: "1px dashed #EAE7DE", paddingTop: 15 }}>
            <span style={{ fontSize: 15, color: "#57564d" }}>
              <strong style={{ color: INK, fontWeight: 600 }}>Overall 6.0 today.</strong> Apply the highlighted fixes and your next draft is projected at <strong style={{ color: INDIGO, fontWeight: 700 }}>7.0</strong> &mdash; on the way to your target.
            </span>
            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#1F8A5B", background: "#e9f5ef", border: "1px solid #cfe7da", borderRadius: 999, padding: "5px 13px", whiteSpace: "nowrap" }}>+1.0 next draft</span>
          </div>
        </div>

        <p style={{ textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 12.5, color: "#8a897c", margin: "22px 0 0" }}>
          Calibrated and conservative by design · not affiliated with or endorsed by IELTS®
        </p>
      </div>
    </div>
  );
}

const HERO_STYLES = `
@keyframes hb-blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes hb-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes hb-glow{0%,100%{text-shadow:0 0 0 rgba(59,67,181,0)}50%{text-shadow:0 0 34px rgba(59,67,181,.35)}}
@keyframes hb-dots{0%{opacity:.3}25%{opacity:1}100%{opacity:.3}}
/* Entrance: each hero block rises + fades in, staggered, so the banner assembles
   itself on load instead of snapping in. */
@keyframes hb-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.hb-rise{animation:hb-rise .68s cubic-bezier(.22,.68,.18,1) both}
.hb-d1{animation-delay:.04s}
.hb-d2{animation-delay:.12s}
.hb-d3{animation-delay:.22s}
.hb-d4{animation-delay:.34s}
.hb-d5{animation-delay:.46s}
.hb-d6{animation-delay:.56s}
/* The 6.0→9.0 gap line draws itself left-to-right (the indigo marker rides the
   growing fill), reinforcing "close the gap". */
@keyframes hb-bar{from{width:0}to{width:100%}}
.hb-bar-fill{animation:hb-bar 1.25s cubic-bezier(.4,.7,.2,1) .42s both}
@media (max-width:760px){
  .lp-hero-bars{flex-wrap:wrap}
  .lp-hero-bars>div{flex:1 1 42%}
  .lp-hero-cardhead{flex-direction:column;align-items:flex-start;gap:9px}
  .lp-hero-cardfoot{flex-direction:column;align-items:flex-start;gap:10px}
}
@media (prefers-reduced-motion:reduce){
  .lp-root [style*="animation"]{animation:none!important}
  .hb-rise,.hb-bar-fill{animation:none!important}
  .hb-bar-fill{width:100%!important}
}
`;

/** An inline highlight chip in the examiner's reasoning (a flagged fault). */
function Chip({ tone, children }: { tone: "amber" | "indigo"; children: React.ReactNode }) {
  const s =
    tone === "amber"
      ? { background: "#FBF1DA", color: "#9a6a10", border: "1px solid #F0E1BB" }
      : { background: "#ECEDFB", color: INDIGO, border: "1px solid #DADCF4" };
  return <span style={{ ...s, borderRadius: 7, padding: "1px 7px", fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>;
}

/** One criterion meter in the reasoning card. */
function CritBar({ label, band, pct, color }: { label: string; band: string; pct: number; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", color: "#908d80", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>{band}</span>
      </div>
      <div style={{ height: 4, borderRadius: 3, background: "#ECEAE2", marginTop: 7, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
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
      body: "Pick a Task 1 or Task 2 topic, or paste your own essay. The AI reads it like an examiner and grades each criterion in seconds.",
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

// ---- personalised practice: text + a "tuned to you" mockup -----------------

function FeaturePoint({ head, body }: { head: string; body: string }) {
  return (
    <div style={{ display: "flex", gap: 13 }}>
      <span style={{ marginTop: 3, flex: "none" }}>
        <Check size={20} sw={2.6} />
      </span>
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16.5, color: INK }}>{head}</div>
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: "#6b6e84", margin: "3px 0 0" }}>{body}</p>
      </div>
    </div>
  );
}

function AdaptiveEngine() {
  return (
    <Band id="adaptive" bg="#F4F4FB">
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(28px,5vw,64px)", alignItems: "center" }}>
        {/* left: the personalisation story */}
        <div>
          <SectionHead
            title="Built around you — not a recycled test"
            sub="Nothing here is a one-size-fits-all paper. Every question is created for your level, so the learner next to you is working on something completely different."
            maxSub={560}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 30 }}>
            <FeaturePoint head="It follows your level" body="We read your current band (or your CEFR level, A1–C2) and set every task right at your edge — hard enough to grow you, never so hard it just discourages." />
            <FeaturePoint head="No two learners get the same set" body="Each question is built for you the moment you start, so what you practise is genuinely yours — not a fixed test everyone shares or can memorise." />
            <FeaturePoint head="It gets harder as you improve" body="As your scores rise, so does the difficulty and the vocabulary expected — the practice keeps pulling you toward your target instead of leaving you where you are." />
          </div>
        </div>

        {/* right: a "tuned to you" topic mockup */}
        <div style={{ background: "#fff", border: "1px solid #E0E1F4", borderRadius: 20, boxShadow: "0 26px 54px -36px rgba(20,20,48,.45)", padding: "22px 22px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", color: "#908d80" }}>TODAY&rsquo;S TOPIC · FOR YOU</span>
            <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: INDIGO, background: "#ECEDFB", border: "1px solid #DADCF4", borderRadius: 999, padding: "3px 11px" }}>Tuned to Band 6.0</span>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 19, lineHeight: 1.45, color: INK, margin: "14px 0 0" }}>
            Some people think children should begin learning a foreign language at primary school rather than secondary school. Do you agree or disagree?
          </p>
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", color: "#b4b1a3" }}>
              <span>EASIER</span>
              <span style={{ color: INDIGO }}>YOUR LEVEL</span>
              <span>HARDER</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "#ECEAF6", marginTop: 7, position: "relative" }}>
              <span style={{ position: "absolute", left: "52%", top: "50%", transform: "translate(-50%,-50%)", width: 15, height: 15, borderRadius: "50%", background: INDIGO, boxShadow: "0 0 0 4px rgba(59,67,181,.16)" }} />
            </div>
          </div>
          <div style={{ marginTop: 18, borderTop: "1px dashed #E6E4F2", paddingTop: 14, display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ flex: "none", width: 30, height: 30, borderRadius: 8, background: "#F3F2FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
              </svg>
            </span>
            <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: "#8a897c", margin: 0 }}>
              A learner aiming for <strong style={{ color: INK }}>Band 7.5</strong> sees a harder, more abstract version of this topic — same skill, different question.
            </p>
          </div>
        </div>
      </div>
    </Band>
  );
}

// ---- coach: text + a chat mockup -------------------------------------------

function CoachBubble({ side, children }: { side: "you" | "coach"; children: React.ReactNode }) {
  const you = side === "you";
  return (
    <div style={{ display: "flex", justifyContent: you ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "86%",
          padding: "11px 14px",
          borderRadius: 13,
          borderTopRightRadius: you ? 4 : 13,
          borderTopLeftRadius: you ? 13 : 4,
          fontFamily: SANS,
          fontSize: 14,
          lineHeight: 1.55,
          background: you ? INDIGO : "#F4F4FB",
          color: you ? "#fff" : "#3a3d52",
          border: you ? "none" : "1px solid #E6E7FB",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CoachSection() {
  return (
    <Band id="coach" bg="#fff">
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(28px,5vw,64px)", alignItems: "center" }}>
        {/* left: a coach chat mockup */}
        <div style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 20, boxShadow: "0 26px 54px -36px rgba(20,20,48,.45)", padding: "18px 18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, paddingBottom: 14, borderBottom: "1px solid #F0EDE1" }}>
            <span style={{ flex: "none", width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#5B55D6,#3B43B5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg>
            </span>
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK }}>Your coach</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: "#8A8FA0" }}>Ideas &amp; sharper words — not answers</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "16px 2px 6px" }}>
            <CoachBubble side="you">I don&rsquo;t know how to start my introduction.</CoachBubble>
            <CoachBubble side="coach">Don&rsquo;t repeat the question back. Say your opinion in one clear sentence, then name your two reasons. Try opening with &ldquo;I strongly believe that…&rdquo;.</CoachBubble>
            <CoachBubble side="you">What&rsquo;s a stronger word than &ldquo;good&rdquo;?</CoachBubble>
            <CoachBubble side="coach">For an argument, &ldquo;compelling&rdquo;, &ldquo;convincing&rdquo;, or &ldquo;well-founded&rdquo; — pick by what you actually mean.</CoachBubble>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", paddingTop: 8 }}>
            {["Plan an outline", "Sharper words", "Check my idea"].map((c) => (
              <span key={c} style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: INDIGO, background: "#ECEBFB", border: "1px solid #E1DFF7", borderRadius: 999, padding: "6px 12px" }}>{c}</span>
            ))}
          </div>
        </div>

        {/* right: what the coach does */}
        <div>
          <SectionHead
            title="A coach beside you in every practice"
            sub="Every writing and reading session has a coach you can ask anything — so you&rsquo;re never stuck staring at a blank page."
            maxSub={560}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 30 }}>
            <FeaturePoint head="It helps you think, not cheat" body="Ask for ideas, a structure, or a sharper word while you write — but it never writes the answer for you, so the band you earn is really yours." />
            <FeaturePoint head="Ask in your own language" body="Stuck on a word or the task itself? Ask in any language. The coach replies in plain terms and shows you the move on a different example." />
            <FeaturePoint head="It explains every mistake after grading" body="Once you submit, the coach walks through why each fix matters and how to get it right next time — the same for a wrong reading answer." />
          </div>
        </div>
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
      <SectionHead title="Guided practice for every writing task" sub="Original, exam-style questions for each task type — graded the moment you submit, with a fix you can act on right away." />
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
          We never copy Cambridge or official test books — every passage and question is AI-generated to the exam spec and expert-verified. Your practice never runs out, never goes stale, and stays on the right side of copyright.
        </p>
      </div>
    </Band>
  );
}

// ---- grounding: the resources the examiner reasons from --------------------

function Grounding() {
  const sources = [
    {
      name: "Official IELTS public band descriptors",
      body: "The published Task Response, Coherence & Cohesion, Lexical Resource and Grammatical Range & Accuracy criteria real examiners apply. We score against these — not the model's gut.",
      icon: (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </>
      ),
    },
    {
      name: "CEFR descriptors · A1–C2",
      body: "The Council of Europe's Common European Framework — our distinct CEFR track and a corroboration layer for level and vocabulary that must agree with the IELTS descriptors.",
      icon: (
        <>
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <path d="M7 12h10" />
          <path d="M12 7v10" />
        </>
      ),
    },
    {
      name: "Calibrated exemplar corpus",
      body: "Our own anchor essays at each band, retrieved on every grade to pin both the floor and the ceiling — the core lever that keeps the AI from inflating your score.",
      icon: (
        <>
          <path d="M12 2 4 5v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V5l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      ),
    },
    {
      name: "Documented error taxonomy",
      body: "A catalogue of the recurring faults that cap each band, so the one thing holding you back is named precisely — not hidden behind a vague 'use better vocabulary'.",
      icon: (
        <>
          <path d="M10 2h4" />
          <path d="M12 14v-4" />
          <circle cx="12" cy="14" r="8" />
        </>
      ),
    },
  ];
  return (
    <Band id="grounding" bg="#FBFAF4">
      <SectionHead
        title="Grounded in the real standards — not a black box"
        sub="Every band is anchored to published, authoritative frameworks and our own calibrated corpus, so the score is explainable criterion by criterion."
        maxSub={680}
      />
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 42 }}>
        {sources.map((s) => (
          <div key={s.name} className="lp-hover" style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, padding: 26, display: "flex", gap: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
            </div>
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK }}>{s.name}</div>
              <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14.5, lineHeight: 1.6, color: "#6b6e84", margin: "6px 0 0" }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13.5, lineHeight: 1.6, color: "#8a897c", margin: "20px 0 0", maxWidth: 760 }}>
        We never ingest copyrighted Cambridge/Oxford test books or official past papers — only the public descriptors above and original, expert-verified content of our own.
      </p>
    </Band>
  );
}

// ---- faq --------------------------------------------------------------------

function Faq() {
  const qs = [
    {
      q: "Is this affiliated with IELTS?",
      a: "No. We're an independent practice tool — not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English. We ground our scoring in the public band descriptors anyone can read.",
    },
    {
      q: "Do you use real past papers?",
      a: "Never. Every passage and question is original and AI-generated to the exam spec, so you're never practising on leaked material — and we stay firmly on the right side of copyright.",
    },
    {
      q: "How accurate is the grading?",
      a: "It's calibrated to within about half a band of human raters and deliberately conservative. When you sit between two bands we round down and tell you exactly what's missing for the higher one.",
    },
    {
      q: "Will it inflate my score to keep me happy?",
      a: "No — that's the whole point. A false 7.0 is the one thing that breaks trust on exam day, so we'd rather show you the work that's left than hand you a number you won't repeat.",
    },
    {
      q: "What about Speaking and Listening?",
      a: "In development. Writing and Reading are live today and where most scores are won or lost; Speaking and Listening are on the roadmap and will be included free for members when they launch.",
    },
  ];
  return (
    <Band id="faq" bg="#F4F4FB">
      <SectionHead title="Questions, answered straight" sub="The same honesty we put into your band — applied to how this works." maxSub={560} />
      <div style={{ marginTop: 34, maxWidth: 860, background: "#fff", border: "1px solid #E7E4D6", borderRadius: 18, overflow: "hidden" }}>
        {qs.map((item, i) => (
          <div key={item.q} style={{ padding: "22px 26px", borderTop: i === 0 ? "none" : "1px solid #EEEBDD" }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK }}>{item.q}</div>
            <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, lineHeight: 1.65, color: "#6b6e84", margin: "8px 0 0" }}>{item.a}</p>
          </div>
        ))}
      </div>
    </Band>
  );
}

// ---- pricing (B2C: framed by real grading/generation limits) ---------------

const PLAN_CTA: Record<OrgPlan, { label: string; href: string }> = {
  trial: { label: "Start free", href: "/sign-up" },
  starter: { label: "Choose plan", href: "/sign-up" },
  pro: { label: "Choose plan", href: "/sign-up" },
  enterprise: { label: "Choose plan", href: "/sign-up" },
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
          Paste an essay, get a calibrated band and the one fix that moves you up — free to start.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 28 }}>
          <Link href="/write" style={{ ...BTN_GHOST, background: "#fff", border: "none", color: INDIGO }}>
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
      { label: "Grade an essay free", href: "/write" },
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
