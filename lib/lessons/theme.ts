/**
 * The Practice AI palette.
 *
 * One module because the three surfaces it dresses live in three different
 * route groups — the library and the lesson page under `(app)/console`, the
 * runner under `(studio)` — and a colour that drifts between them is exactly
 * the seam the redesign set out to remove.
 *
 * ⚠️ THESE ARE `var(--pa-…)` NOW, NOT HEX. They were constants on purpose (a
 * stale stylesheet could cost the surface nothing), but the same screens also
 * drew from the app palette's PANEL / ON_INK, which follow the theme — so in
 * dark mode the lesson sheet went black under this module's fixed navy ink.
 * The light values in globals.css are the old hex exactly. Two consequences:
 * never hand one to an SVG `fill=`/`stroke=` attribute (a var() does not resolve
 * there — use `style`), and never append alpha to one (`${INK}33` is not a
 * colour — use `withAlpha` from lib/theme/tokens).
 *
 * Isomorphic on purpose (no `server-only`): the server components that draw the
 * lesson page and the client components that draw the runner both import it.
 */

/* ── ground ────────────────────────────────────────────────────────────────── */

/** The paper everything sits on. Warmer than the console's #FDFDFD, which is
 *  the point — Practice AI is the making surface, not the ledger. */
export const PAPER = "var(--pa-paper)";
export const SURFACE = "var(--pa-surface)";
/** Sunken wells: the inside of an input, a spec panel, a quiet card. */
export const WASH = "var(--pa-wash)";
export const WASH_WARM = "var(--pa-wash-warm)";
/** Tab troughs and ghost buttons. */
export const TROUGH = "var(--pa-trough)";
export const TROUGH_DEEP = "var(--pa-trough-deep)";

/* ── ink ───────────────────────────────────────────────────────────────────── */

export const INK = "var(--pa-ink)";
export const BODY = "var(--pa-body)";
export const READING = "var(--pa-reading)";
export const MUTED = "var(--pa-muted)";
export const SOFT = "var(--pa-soft)";
export const FAINT = "var(--pa-faint)";
export const GHOST = "var(--pa-ghost)";

/** A panel that stays DARK in both themes, for the few that carry fixed light
 *  inks (the lesson page's "Practice" rail, the runner's score card). INK used
 *  to do this job and cannot any more: it inverts. Put WHITE on it, not ON_INK. */
export const DEEP = "var(--pa-deep)";

/* ── accents ───────────────────────────────────────────────────────────────── */

/** The one button that costs money or ends a step. Used sparingly by design. */
export const EMBER = "var(--pa-ember)";
export const EMBER_DEEP = "var(--pa-ember-deep)";
export const EMBER_OFF = "var(--pa-ember-off)";
export const TEAL = "var(--pa-teal)";

/* ── tinted lozenges ───────────────────────────────────────────────────────── */

/** Right, published, met. */
export const GOOD_BG = "var(--pa-good-bg)";
export const GOOD_INK = "var(--pa-good-ink)";
/** GOOD as a FILL under white. Same green as GOOD_INK in light; deeper in dark,
 *  where GOOD_INK lightens to stay legible as text and white would not clear it. */
export const GOOD_FILL = "var(--pa-good-fill)";
/** Wrong, a trap, the thing students get wrong. */
export const WARN_BG = "var(--pa-warn-bg)";
export const WARN_INK = "var(--pa-warn-ink)";
/** Neutral-but-notable: a stage name, an "AI-marked" flag. */
export const NOTE_BG = "var(--pa-note-bg)";
export const NOTE_INK = "var(--pa-note-ink)";
export const NOTE_ALT_BG = "var(--pa-note-alt-bg)";
export const NOTE_ALT_INK = "var(--pa-note-alt-ink)";

/* ── edges ─────────────────────────────────────────────────────────────────── */

export const HAIRLINE = "var(--pa-hairline)";
export const RULE = "var(--pa-rule)";

/* ── gradients ─────────────────────────────────────────────────────────────── */

/** The library hero. Ends on PAPER exactly, so the lesson grid below continues
 *  the same sheet instead of reading as a panel bolted underneath. */
export const HERO_SKY =
  "linear-gradient(180deg, var(--pa-sky-1) 0%, var(--pa-sky-2) 38%, var(--pa-sky-3) 72%, var(--pa-paper) 100%)";
/** The lesson page's band — the same sky, quieter, because that page is for
 *  reading and a second full-strength gradient competes with the prose. */
export const LESSON_SKY = "linear-gradient(180deg, var(--pa-sky-soft) 0%, var(--pa-paper) 100%)";

/* ── shadows ───────────────────────────────────────────────────────────────── */

/* The trailing ring is transparent in light (nothing moves) and a hairline in
   dark, where a soft shadow on a near-black page lifts nothing and the card
   would otherwise have no edge. */
export const LIFT_CARD =
  "0 1px 2px rgba(20,35,46,.05), 0 16px 34px -24px rgba(20,35,46,.35), 0 0 0 1px var(--ex-ring)";
export const LIFT_PANEL =
  "0 1px 2px rgba(20,35,46,.05), 0 18px 40px -30px rgba(20,35,46,.4), 0 0 0 1px var(--ex-ring)";
export const LIFT_SHEET =
  "0 1px 2px rgba(20,35,46,.05), 0 26px 60px -40px rgba(20,35,46,.5), 0 0 0 1px var(--ex-ring)";
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
