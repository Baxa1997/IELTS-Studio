/**
 * The "Lucida" design layer for the whole Speaking surface (hub, examiner/tutor
 * pick, live session, results). One source of truth so the three screens match.
 *
 * The tokens are ported verbatim from the Claude Design mock (Speaking.dc.html /
 * colors_and_type.css) but SCOPED under `.lucida` so the warm-violet palette and
 * Bricolage/Jakarta type never leak into the rest of the app (which stays on
 * Hanken/Newsreader + teal). The mock's shadows were authored for a dark theme;
 * here they're softened for the light surface so cards read as elevation, not mud.
 *
 * Fonts arrive as CSS vars from the (shell) and (studio) layouts
 * (--font-bricolage / --font-jakarta); this file only maps them to the design's
 * --font-display / --font-body names.
 */

const LUCIDA_CSS = `
.lucida {
  /* --- neutral scale (warm-tinted): 0 = lightest surface, 1000 = ink --- */
  --color-neutral-0:   #FBF8F6;
  --color-neutral-50:  #F3EDE9;
  --color-neutral-100: #E9E1DC;
  --color-neutral-200: #DED4CE;
  --color-neutral-300: #C6B9B2;
  --color-neutral-400: #A2938C;
  --color-neutral-500: #7A6E6B;
  --color-neutral-600: #574E4E;
  --color-neutral-700: #3D3639;
  --color-neutral-800: #2C2630;
  --color-neutral-900: #221D29;
  --color-neutral-1000: #17131C;

  /* --- primary: warm violet --- */
  --color-primary-50:  #F4EEFF;
  --color-primary-100: #E4D5FF;
  --color-primary-200: #C8AAFF;
  --color-primary-300: #AA80F8;
  --color-primary-400: #9468F5;
  --color-primary-500: #8456EF;
  --color-primary-600: #7144D8;
  --color-primary-700: #5E34BF;
  --color-primary-800: #3F2090;
  --color-primary-900: #21104F;

  /* --- secondary: Claude terracotta --- */
  --color-amber-400: #F09070;
  --color-amber-500: #DA7756;
  --color-amber-600: #C0603E;

  /* --- semantic --- */
  --color-success:    #16A34A;
  --color-success-bg: rgba(22,163,74,0.10);
  --color-error:      #DC2626;
  --color-error-bg:   rgba(220,38,38,0.10);
  --color-warning:    #D97706;
  --color-warning-bg: rgba(217,119,6,0.10);
  --color-info:       #3B82F6;
  --color-info-bg:    rgba(59,130,246,0.10);

  /* --- type --- */
  --font-display: var(--font-bricolage), Georgia, serif;
  --font-body:    var(--font-jakarta), system-ui, sans-serif;
  /* Every number and small-caps label: timers, bands, wpm. JetBrains Mono per
     the design — tabular so a running clock does not jitter. */
  --font-mono:    var(--font-mono-data), ui-monospace, monospace;
  --fw-light: 300; --fw-regular: 400; --fw-medium: 500;
  --fw-semibold: 600; --fw-bold: 700; --fw-extrabold: 800;
  --text-2xs: 0.6875rem; --text-xs: 0.75rem; --text-sm: 0.8125rem;
  --text-base: 0.875rem; --text-md: 1rem; --text-lg: 1.125rem;
  --text-xl: 1.25rem; --text-2xl: 1.5rem; --text-3xl: 1.75rem;
  --text-4xl: 2rem; --text-5xl: 2.5rem; --text-6xl: 3rem; --text-7xl: 3.5rem;
  --lh-tight: 1.15; --lh-snug: 1.25; --lh-normal: 1.5; --lh-relaxed: 1.65;
  --ls-tight: -0.03em; --ls-snug: -0.02em; --ls-normal: 0em;
  --ls-wide: 0.04em; --ls-wider: 0.08em; --ls-caps: 0.1em;

  /* --- radius --- */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px;
  --radius-xl: 16px; --radius-2xl: 24px; --radius-pill: 9999px;

  /* --- elevation (softened for a light surface) --- */
  --shadow-1: 0 1px 3px rgba(34,29,41,0.06), 0 1px 2px rgba(34,29,41,0.04);
  --shadow-2: 0 6px 24px rgba(34,29,41,0.08), 0 1px 4px rgba(34,29,41,0.05);
  --shadow-3: 0 24px 64px rgba(34,29,41,0.16);
  --shadow-glow: 0 0 24px rgba(132,86,239,0.28);
  --shadow-glow-sm: 0 8px 22px -10px rgba(132,86,239,0.55);

  /* --- component tokens --- */
  --btn-primary-bg: var(--color-primary-500);
  --btn-primary-hover: var(--color-primary-600);
  --btn-primary-active: var(--color-primary-700);
  --btn-primary-text: #FFFFFF;

  font-family: var(--font-body);
  color: var(--color-neutral-1000);
  -webkit-font-smoothing: antialiased;
}

.lucida ::selection { background: rgba(132,86,239,0.20); }

/* interactive states the mock expressed as style-hover / style-active */
.lc-btn { transition: background 160ms ease, opacity 160ms ease, transform 120ms ease; }
.lc-primary:hover { background: var(--color-primary-600); }
.lc-primary:active { transform: scale(0.97); background: var(--color-primary-700); }
.lc-success:hover { opacity: 0.92; }
.lc-success:active { transform: scale(0.98); }
.lc-ghost { transition: background 160ms ease, border-color 160ms ease; }
.lc-ghost:hover { background: var(--color-neutral-100); }
.lc-danger:hover { background: var(--color-error-bg); }
.lc-card-tap { transition: border-color 160ms ease, background 160ms ease, transform 120ms ease, box-shadow 160ms ease; }
.lc-card-tap:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
.lc-tab { transition: color 160ms ease; }

/* responsive grids (inline styles can't hold a media query) */
.lc-two-col { display: grid; grid-template-columns: minmax(0,1.6fr) minmax(300px,1fr); gap: 32px; align-items: start; }
.lc-persona-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
.lc-stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
/* tutor setup: matched tutor beside the language/summary card */
.lc-setup-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 20px; align-items: start; }
/* tutor room: the stage, and the coaching rail beside it */
.lc-room-grid { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 26px; align-items: start; }
/* hub: the main card beside its summary rail */
.lc-hub-grid { display: grid; grid-template-columns: minmax(0,1.55fr) minmax(0,1fr); gap: 22px; align-items: start; }
/* mock setup: the assignment beside its summary */
.lc-setup-wide { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(0,1fr); gap: 26px; align-items: start; }
/* mock result: the band circle beside the verdict */
.lc-result-grid { display: grid; grid-template-columns: 210px minmax(0,1fr); gap: 32px; align-items: center; }
.lc-row { transition: background 160ms ease; }
.lc-row:hover { background: #F7F4F2; }

/* --- full-bleed pages ---
   The app shell hands every page a scrolling surface of indefinite height, so a
   child asking for height:100% has nothing to measure against. A page that
   should FILL the window rather than grow past it tags itself .lucida-fill,
   and this reaches back up the tree to make that one wrapper definite. Scoped
   by :has() so no other shell page is touched. */
.lp-shell-surface:has(> * > .lucida-fill),
.lp-shell-surface:has(> .lucida-fill) { overflow: hidden; display: flex; flex-direction: column; }
.lp-shell-surface:has(> * > .lucida-fill) > *,
.lp-shell-surface:has(> .lucida-fill) > * { flex: 1; min-height: 0; }
/* Standalone (the chrome-free /speak/exam and /speak/tutor studio routes) there
   is no shell surface to inherit from, so the viewport is the measure. Inside
   the shell the rule above wins and hands it a definite parent instead. */
.lucida-fill { min-height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
.lp-shell-surface .lucida-fill { min-height: 0; height: 100%; }
@media (max-width: 900px) {
  .lc-two-col { grid-template-columns: 1fr; }
  .lc-persona-grid { grid-template-columns: repeat(2,1fr); }
  .lc-stat-grid { grid-template-columns: 1fr; }
  .lc-setup-grid { grid-template-columns: 1fr; }
  .lc-hub-grid { grid-template-columns: 1fr; }
  .lc-setup-wide { grid-template-columns: 1fr; }
  .lc-result-grid { grid-template-columns: 1fr; gap: 24px; }
  /* The rail drops BELOW the stage rather than squeezing beside it — the
     coaching card is the thing worth reading, not a 120px column of it. */
  .lc-room-grid { grid-template-columns: 1fr; }
}

@keyframes lcWaveBar { 0%,100% { transform: scaleY(0.28); } 50% { transform: scaleY(1); } }
@keyframes lcPulseRing { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes lcFadeInUp { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes lcBlink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
@keyframes lcDotPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes lcSpin { to { transform: rotate(360deg); } }

/* --- the tutor room (Speaking.dc.html "om-*" set) ---
   Each purpose gets a different room, and these are what make one feel like a
   stage and another like a conversation. Named lc* to match the rest. */
@keyframes lcBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.045); } }
@keyframes lcRing { 0% { transform: scale(0.85); opacity: 0.55; } 100% { transform: scale(1.75); opacity: 0; } }
@keyframes lcSweep { 0%,100% { opacity: 0.35; transform: translateX(-14px); } 50% { opacity: 0.75; transform: translateX(14px); } }
@keyframes lcDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-22px) scale(1.12); } }

/* Motion is decoration here — the room still reads without it, and for anyone
   who asked their OS to stop moving things, it must. */
@media (prefers-reduced-motion: reduce) {
  .lucida *, .lucida *::before, .lucida *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`;

/** Wrap any Speaking screen in this to get the scoped tokens + keyframes. */
export function LucidaScope({
  children,
  style,
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`lucida ${className}`} style={style}>
      <style>{LUCIDA_CSS}</style>
      {children}
    </div>
  );
}

// ---- personas: the real engine voices, dressed in the mock's persona copy ----
// ids MUST match the engine: live.py PERSONAS (mock) + tutor.py VOICE_MAP (tutor).

export interface Persona {
  id: "emily" | "daniel" | "sofia" | "james";
  initial: string;
  name: string;
  /** a Lucida palette var — the persona's accent hue, for solid fills/rings */
  accent: string;
  /** the same hue as a concrete hex — for gradients/box-shadows that need
   *  string concatenation (e.g. `${hex}D9`), where a CSS var won't resolve */
  hex: string;
  glow: string;
  tint: string;
  mockTrait: string;
  mockDesc: string;
  tutorTrait: string;
  tutorDesc: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "emily", initial: "E", name: "Emily",
    accent: "var(--color-primary-500)", hex: "#8456EF", glow: "rgba(132,86,239,0.35)", tint: "rgba(132,86,239,0.08)",
    mockTrait: "Warm & encouraging", mockDesc: "Puts nervous candidates at ease. Clear, friendly pace.",
    tutorTrait: "Warm and patient", tutorDesc: "Easy pace, plenty of encouragement.",
  },
  {
    id: "daniel", initial: "D", name: "Daniel",
    accent: "var(--color-info)", hex: "#3B82F6", glow: "rgba(59,130,246,0.30)", tint: "rgba(59,130,246,0.08)",
    mockTrait: "Calm & formal", mockDesc: "The classic exam-room examiner. Measured and neutral.",
    tutorTrait: "Calm and clear", tutorDesc: "Precise corrections, steady tone.",
  },
  {
    id: "sofia", initial: "S", name: "Sofia",
    accent: "var(--color-success)", hex: "#16A34A", glow: "rgba(22,163,74,0.30)", tint: "rgba(22,163,74,0.08)",
    mockTrait: "Friendly & patient", mockDesc: "Easy-going rhythm with time to think.",
    tutorTrait: "Easy-going", tutorDesc: "Relaxed, conversational lessons.",
  },
  {
    id: "james", initial: "J", name: "James",
    accent: "var(--color-amber-500)", hex: "#DA7756", glow: "rgba(218,119,86,0.30)", tint: "rgba(218,119,86,0.08)",
    mockTrait: "Brisk & precise", mockDesc: "Keeps the pace up — good exam-day pressure training.",
    tutorTrait: "Brisk and direct", tutorDesc: "Fast pace, straight to the point.",
  },
];

export function personaById(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

/** Tutor practice contexts — the chips on the tutor pick screen. */
export const TOPICS = [
  "The IELTS exam",
  "Talking with friends",
  "A presentation",
  "A job interview",
  "Everyday English",
] as const;

// ---- shared session atoms ----------------------------------------------------

/** The 14-bar equaliser used for both the examiner and the "You" mic. */
export function WaveBars({
  color,
  active,
  count = 14,
  height = 28,
}: {
  color: string;
  active: boolean;
  count?: number;
  height?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height }} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: "100%",
            borderRadius: 2,
            background: color,
            transformOrigin: "bottom",
            animation: "lcWaveBar 0.9s ease-in-out infinite",
            animationDelay: `${i * 0.06}s`,
            animationPlayState: active ? "running" : "paused",
            opacity: active ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

/** The circular persona avatar with optional listening pulse-rings. */
export function PersonaAvatar({
  initial,
  accent,
  glow,
  size = 128,
  ring = false,
}: {
  initial: string;
  accent: string;
  glow: string;
  size?: number;
  ring?: boolean;
}) {
  // Sizing note: NOT `margin: 0 auto`. Inside a flex row an auto margin soaks
  // up all the free space, which centred the avatar and threw the name to the
  // far right — the broken tutor card. Callers wanting it centred wrap it.
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
      {ring ? (
        <>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${accent}`, animation: "lcPulseRing 1.6s ease-out infinite" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${accent}`, animation: "lcPulseRing 1.6s ease-out infinite 0.6s" }} />
        </>
      ) : null}
      <div
        style={{
          width: "100%", height: "100%", borderRadius: "50%", background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 50px ${glow}`, position: "relative", zIndex: 1,
        }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.34, fontWeight: 700, color: "#FFFFFF" }}>
          {initial}
        </span>
      </div>
    </div>
  );
}

export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
