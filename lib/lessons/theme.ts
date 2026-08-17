/**
 * The Practice AI palette.
 *
 * One module because the three surfaces it dresses live in three different
 * route groups — the library and the lesson page under `(app)/console`, the
 * runner under `(studio)` — and a colour that drifts between them is exactly
 * the seam the redesign set out to remove. Plain constants rather than CSS
 * variables: every one of these pages already styles inline, and a token that
 * only resolves once a stylesheet has loaded is a token that renders wrong on a
 * stale dev-server cache.
 *
 * Isomorphic on purpose (no `server-only`): the server components that draw the
 * lesson page and the client components that draw the runner both import it.
 */

/* ── ground ────────────────────────────────────────────────────────────────── */

/** The paper everything sits on. Warmer than the console's #FDFDFD, which is
 *  the point — Practice AI is the making surface, not the ledger. */
export const PAPER = "#fdfbf7";
export const SURFACE = "#ffffff";
/** Sunken wells: the inside of an input, a spec panel, a quiet card. */
export const WASH = "#f6f4ef";
export const WASH_WARM = "#f8f6f1";
/** Tab troughs and ghost buttons. */
export const TROUGH = "#f1efe9";
export const TROUGH_DEEP = "#eeece6";

/* ── ink ───────────────────────────────────────────────────────────────────── */

export const INK = "#14232e";
export const BODY = "#3f5057";
export const READING = "#4d5f68";
export const MUTED = "#5c6b73";
export const SOFT = "#6f8087";
export const FAINT = "#8b969d";
export const GHOST = "#9aa5ab";

/* ── accents ───────────────────────────────────────────────────────────────── */

/** The one button that costs money or ends a step. Used sparingly by design. */
export const EMBER = "#ec6a45";
export const EMBER_DEEP = "#d95936";
export const EMBER_OFF = "#dbd6cb";
export const TEAL = "#1f6f6b";

/* ── tinted lozenges ───────────────────────────────────────────────────────── */

/** Right, published, met. */
export const GOOD_BG = "#e4f1ea";
export const GOOD_INK = "#1c6b52";
/** Wrong, a trap, the thing students get wrong. */
export const WARN_BG = "#fdefe9";
export const WARN_INK = "#c1502f";
/** Neutral-but-notable: a stage name, an "AI-marked" flag. */
export const NOTE_BG = "#e9eefb";
export const NOTE_INK = "#3c4fa0";
export const NOTE_ALT_BG = "#f0eefb";
export const NOTE_ALT_INK = "#4b46a8";

/* ── edges ─────────────────────────────────────────────────────────────────── */

export const HAIRLINE = "rgba(20,35,46,.07)";
export const RULE = "#e8e5de";

/* ── gradients ─────────────────────────────────────────────────────────────── */

/** The library hero. Ends on PAPER exactly, so the lesson grid below continues
 *  the same sheet instead of reading as a panel bolted underneath. */
export const HERO_SKY =
  "linear-gradient(180deg, #a9cfcf 0%, #bcd9d6 38%, #e8ebe2 72%, #fdfbf7 100%)";
/** The lesson page's band — the same sky, quieter, because that page is for
 *  reading and a second full-strength gradient competes with the prose. */
export const LESSON_SKY = "linear-gradient(180deg, #dfeae4 0%, #fdfbf7 100%)";

/* ── shadows ───────────────────────────────────────────────────────────────── */

export const LIFT_CARD =
  "0 1px 2px rgba(20,35,46,.05), 0 16px 34px -24px rgba(20,35,46,.35)";
export const LIFT_PANEL =
  "0 1px 2px rgba(20,35,46,.05), 0 18px 40px -30px rgba(20,35,46,.4)";
export const LIFT_SHEET =
  "0 1px 2px rgba(20,35,46,.05), 0 26px 60px -40px rgba(20,35,46,.5)";
export const LIFT_EMBER = "0 10px 24px -12px rgba(236,106,69,.9)";

/* ── type ──────────────────────────────────────────────────────────────────── */

/** Headings that want to read as a page rather than as an interface. */
export const SERIF = "var(--font-newsreader), Georgia, serif";
/** Everything else. Manrope carries a 300 weight, which the hero's split
 *  "Where lessons / come to life" is built on — a fallback stack without one
 *  renders it at 400 and the contrast the headline depends on disappears. */
export const SANS = "var(--font-manrope), system-ui, sans-serif";

/* ── the arc of a practice ─────────────────────────────────────────────────── */

/**
 * The three stages, named for learners rather than for the blueprint.
 *
 * Declared here rather than in each surface because the runner's navigator, the
 * lesson page's rail and the teacher's answer key all group by stage, and a
 * label that says "Warm up" in one place and "Controlled" in another makes a
 * teacher wonder whether they are looking at the same thing.
 */
export const STAGE_META = [
  {
    key: "controlled",
    label: "Warm up",
    note: "Spot and produce the form with support.",
    ink: NOTE_ALT_INK,
    bg: NOTE_ALT_BG,
  },
  {
    key: "semi_controlled",
    label: "Now change it",
    note: "Transform and correct — where understanding shows.",
    ink: GOOD_INK,
    bg: GOOD_BG,
  },
  {
    key: "freer",
    label: "Write it",
    note: "Free production, checked by AI.",
    ink: WARN_INK,
    bg: WARN_BG,
  },
] as const;

export type StageKey = (typeof STAGE_META)[number]["key"];

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGE_META.map((s) => [s.key, s.label]),
);
