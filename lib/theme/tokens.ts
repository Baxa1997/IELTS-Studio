/**
 * The one palette.
 *
 * Before this module the app had four token sources — `globals.css` (oklch
 * semantic tokens), `components/console/crm-ui.tsx`, `(studio)/read/_shared/
 * tokens.ts` and `(studio)/write/studio-theme.ts` — plus 95 files that opened
 * with their own private `const INK = "…"` block. They had drifted measurably:
 * eight different inks, nine muteds, eight reds, four indigos. Nobody chose
 * eight inks; they accumulated one screen at a time.
 *
 * So: one module, three surfaces.
 *
 *   NEUTRAL   the greys, shared by every surface. Contrast-solved, not eyeballed
 *             (the ratios below are carried over from crm-ui's measured set, and
 *             the comment beside each one says what a change would cost).
 *   BRAND     the accents. Indigo is the product's action colour everywhere; the
 *             surfaces differ only in which tint of it they sit on.
 *   SURFACES  the three grounds a screen can be dressed in — `learner`,
 *             `console`, `studio` — as typed `Surface` objects.
 *
 * Plain constants rather than CSS custom properties, deliberately: the codebase
 * styles inline (5,330 `style={{}}` against 918 `className`), and a token that
 * can't be read from a `style` object would just be ignored. `globals.css` keeps
 * its own copy of the hairlines for the handful of `:hover` rules an inline style
 * can't express — those are mirrored, and the comment there says so.
 *
 * Adding a colour here is fine. Adding one in a component file is not: the ESLint
 * `no-restricted-syntax` rule in eslint.config.mjs will refuse a raw hex literal
 * under app/ and components/.
 */

import type { CSSProperties } from "react";

/* ── type stacks ───────────────────────────────────────────────────────────── */

/** Learner + marketing surfaces. */
export const SANS = "var(--font-hanken), system-ui, sans-serif";
/** Long-form reading: passages, essays, lesson prose. */
export const SERIF = "var(--font-newsreader), Georgia, serif";
/** The staff console's body type. Declared in `console/layout.tsx`. */
export const SANS_CONSOLE = "var(--font-work), system-ui, sans-serif";
/** The staff console's headings. */
export const SERIF_CONSOLE = "var(--font-serif4), Georgia, serif";
/** Figures, timers, band scores — anything that has to line up in a column. */
export const MONO = "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";

/* ── neutrals ──────────────────────────────────────────────────────────────── */
/*
 * MEASURED, NOT EYEBALLED. Each value was solved for a contrast target rather
 * than nudged until it looked right, keeping its hue by scaling the channels
 * together — these are warm greys and they stay warm. Ratios are against white.
 *
 * The text ladder is compressed on purpose: SOFT and FAINT sit close to MUTED
 * because AA does not care about our tonal hierarchy. Size and weight carry that
 * hierarchy instead, which is most of what they were doing anyway.
 */
export const INK = "#16162E"; // primary text              17.7:1
export const BODY = "#4C4A63"; // long-form body text        8.5:1
export const MUTED = "#6E6C87"; // secondary text             5.1:1
export const SOFT = "#737189"; // tertiary text              4.7:1
export const FAINT = "#777581"; // captions                   4.5:1 (AA floor)

export const LINE = "#C5C4BE"; // card border                1.75:1
export const RULE = "#D4D3CE"; // divider inside a card      1.50:1
export const HAIR = "#DEDEDA"; // row / column divider       1.35:1

/** Form-control border. Deliberately darker than the card hairline: a card edge
 *  only separates two surfaces, but a field edge has to say "you can type here",
 *  and at the card's weight it disappears on white. */
export const FIELD_LINE = "#CFCABC";

export const WHITE = "#FFFFFF";

/* ── brand ─────────────────────────────────────────────────────────────────── */
/*
 * THE LEARNER APP IS BURGUNDY, THE STAFF CONSOLE IS STILL INDIGO.
 *
 * The marketing site was rebuilt on the `EngProgress Platform` design canvas and
 * came out burgundy (`app/_landing/design.ts`). A learner who signed up from that
 * page then walked into an indigo product, so the learner surfaces — dashboard,
 * the four skill hubs, the exam studios — were repainted to the canvas's colour.
 * The values below are COPIED from `app/_landing/design.ts`, not eyeballed, so
 * the two halves of the funnel are the same burgundy rather than two burgundies.
 *
 * The ramp is wider than marketing needs because a product has states marketing
 * doesn't: a pressed button, a progress track, a disabled fill, a gradient stop.
 * MID/LIGHT/PALE were interpolated along the canvas's own hue (~337°) so an
 * accent that has to sit lighter than BRAND still reads as the same colour.
 *
 * The indigos below did NOT move. The staff console and /admin still wear them,
 * and `TINT.indigo` is a `Tone` used by ~30 console and admin call sites. Two
 * brands is the deliberate state, not drift: staff are a different audience on a
 * different surface, and repainting them was explicitly out of scope.
 */
export const BRAND = "#7D0132"; // primary action           10.9:1
export const BRAND_DEEP = "#5C0125"; // pressed / hover
export const BRAND_DARK = "#43001D"; // panel ground
export const BRAND_DARKEST = "#2C0013"; // darkest gradient stop
export const BRAND_MID = "#9B1044"; // lighter gradient stop
export const BRAND_LIGHT = "#B32A5B"; // lighter still — meters, chart fills
export const BRAND_PALE = "#E3A7BD"; // disabled / empty-track fill
export const BRAND_SOFT = "#FDF4F7"; // tinted fill
export const BRAND_LINE = "#F0D3DE"; // tinted border
export const BRAND_WASH = "#F8E8EE"; // between SOFT and LINE — hover on a tint

/** Staff only. See the note above before reaching for these on a learner screen. */
export const INDIGO = "#3B43B5"; // primary action            7.9:1
export const INDIGO_DEEP = "#2F3699"; // pressed / hover
export const INDIGO_SOFT = "#ECEBFB"; // tinted fill
export const INDIGO_LINE = "#E1DFF7"; // tinted border

/* ── status ────────────────────────────────────────────────────────────────── */

export const GREEN = "#16794C"; // correct / paid / on track  4.9:1
export const AMBER = "#B8791F"; // needs attention            3.5:1 (large text only)
export const RED = "#C2453A"; // wrong / overdue            4.6:1
export const RED_DEEP = "#A63A30"; // the same red as body text  5.9:1

/** Tinted backgrounds paired with the ink that reads on them. Never pair a tint
 *  with anything but its own `fg` — the pairs are what carry the contrast. */
export const TINT = {
  brand: { bg: BRAND_SOFT, fg: BRAND },
  indigo: { bg: INDIGO_SOFT, fg: INDIGO },
  green: { bg: "#EAF4EE", fg: GREEN },
  amber: { bg: "#FBEEE0", fg: "#A9721F" },
  red: { bg: "#FBEAE8", fg: RED_DEEP },
  neutral: { bg: "#F1F0EB", fg: MUTED },
} as const;

export type Tone = keyof typeof TINT;

/* ── surfaces ──────────────────────────────────────────────────────────────── */

/**
 * A ground a screen can be dressed in. Three exist, and they differ only in the
 * ground, the panel and the type — every neutral and every status colour above
 * is shared, which is the point.
 */
export interface Surface {
  /** Full-bleed page ground. */
  canvas: string;
  /** Card / panel fill sitting on the canvas. */
  panel: string;
  /** A softer inner fill, for wells and read-only blocks. */
  well: string;
  /** Border for `well`. */
  wellLine: string;
  /** Primary action colour. */
  accent: string;
  /** Tinted fill of the accent. */
  accentSoft: string;
  /** Accent-tinted hairline. */
  accentLine: string;
  /** Drop shadow for a primary button, in the accent's hue. */
  accentShadow: string;
  /** Heading type stack. */
  heading: string;
  /** Body type stack. */
  body: string;
}

/**
 * The learner app: practice hubs, dashboard, activities.
 *
 * The ground moved with the accent. It used to be the cream `#F4F1E7`, which was
 * chosen to sit under indigo; under burgundy it read as a sepia photograph, and
 * it was also the loudest reason a learner arriving from the marketing site felt
 * they had changed product. `canvas`/`well` are now the canvas's own papers
 * (`CANVAS` and `WELL` in `app/_landing/design.ts`) — cool, near-white, the same
 * ground the front door and sign-in already stand on.
 */
export const LEARNER: Surface = {
  canvas: "#F6F7F9",
  panel: WHITE,
  well: "#FBFBFC",
  wellLine: "#ECEEF2",
  accent: BRAND,
  accentSoft: BRAND_SOFT,
  accentLine: BRAND_LINE,
  accentShadow: "0 6px 16px -6px rgba(125,1,50,.55)",
  heading: SANS,
  body: SANS,
};

/** The staff console. Cream ground, serif headings. */
export const CONSOLE: Surface = {
  canvas: "#F4F3EF",
  panel: WHITE,
  well: "#FAFAF8",
  wellLine: HAIR,
  accent: INDIGO,
  accentSoft: INDIGO_SOFT,
  accentLine: INDIGO_LINE,
  accentShadow: "0 6px 16px -6px rgba(59,67,181,.7)",
  heading: SERIF_CONSOLE,
  body: SANS_CONSOLE,
};

/** The exam studios: writing, reading, listening, CEFR. Deliberately identical to
 *  the learner ground — a student should not feel they changed product when a
 *  test starts. It exists as its own name so the studios can diverge later
 *  without another 95-file hunt. The serif is applied per-block (passages,
 *  prompts), not as the studio's body face. */
export const STUDIO: Surface = { ...LEARNER };

/* ── shared style fragments ────────────────────────────────────────────────── */
/*
 * The three things every screen re-declares. Spread them and override what you
 * need — `{ ...cardStyle, padding: 24 }` — rather than retyping the border.
 */

export const cardStyle: CSSProperties = {
  background: WHITE,
  border: `1px solid ${LINE}`,
  borderRadius: 14,
};

export const fieldStyle: CSSProperties = {
  width: "100%",
  border: `1px solid ${FIELD_LINE}`,
  borderRadius: 9,
  padding: "9px 11px",
  fontFamily: "inherit",
  fontSize: 14,
  color: INK,
  background: WHITE,
};

export const btnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderRadius: 11,
  padding: "11px 18px",
  fontWeight: 600,
  fontSize: 15,
  border: "none",
  textDecoration: "none",
  cursor: "pointer",
};

/** A primary button fill in `accent` (defaults to the learner burgundy — pass
 *  `INDIGO` explicitly on a staff screen). */
export function primaryBtn(disabled = false, accent: string = BRAND): CSSProperties {
  return {
    ...btnBase,
    background: accent,
    color: WHITE,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "default" : "pointer",
    boxShadow: disabled ? "none" : `0 12px 24px -12px ${accent}b3`,
  };
}

/** The quiet counterpart: same metrics, outlined instead of filled. */
export function secondaryBtn(disabled = false): CSSProperties {
  return {
    ...btnBase,
    background: WHITE,
    color: INK,
    border: `1px solid ${LINE}`,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "default" : "pointer",
  };
}

/** A slightly stronger tint of an accent, for the AI-generate gradients. */
export function accentStrong(hex: string): string {
  return `${hex}33`;
}
