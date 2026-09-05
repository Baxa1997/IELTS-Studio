/**
 * The EngProgress marketing design — tokens.
 *
 * Extracted from the `EngProgress Platform` Claude Design canvas, which is the
 * source of truth for these three surfaces: the front door (`app/page.tsx`),
 * `/how-to-use`, and sign-in. Values are copied from the canvas, not eyeballed.
 *
 * SCOPED TO MARKETING + AUTH ON PURPOSE. The signed-in product — dashboard,
 * skill hubs, the staff console — still wears the indigo in
 * `lib/theme/tokens.ts`, and repainting it is a separate decision with a much
 * bigger blast radius. So this module deliberately does NOT export anything
 * called `INDIGO*`; the ESLint rule added alongside `scripts/codemod-tokens.ts`
 * would (correctly) refuse it, because that name means the product's colour.
 * These are `BRAND*`, and they mean the marketing colour.
 */

/* ── brand ─────────────────────────────────────────────────────────────────── */

/** The burgundy. Buttons, links, accents, the logo mark. */
export const BRAND = "#7d0132";
/** Pressed / hover. */
export const BRAND_DEEP = "#5c0125";
/** The darkest stop in the sign-in panel's gradient. */
export const BRAND_DARKEST = "#2c0013";
/** Panel ground under that gradient. */
export const BRAND_PANEL = "#43001d";
/** Tinted fill — chips, icon squares, the eyebrow pill. */
export const BRAND_TINT = "#fdf4f7";
/** The border that pairs with `BRAND_TINT`. */
export const BRAND_TINT_LINE = "#f0d3de";

/* ── ink ───────────────────────────────────────────────────────────────────── */

/** Headings and the big numerals. */
export const INK = "#121317";
/** Body copy. */
export const BODY = "#4a505c";
/** Slightly stronger than body — list items, nav. */
export const STRONG = "#3b4150";
/** Eyebrows, captions, stat labels. */
export const MUTED = "#8b919d";
/** The quietest text — the IELTS disclaimer, disabled nav. */
export const FAINT = "#9aa0ac";
/** Stat sublines. */
export const GREY = "#6b7280";

/* ── lines and grounds ─────────────────────────────────────────────────────── */

/** Card and control borders. */
export const LINE = "#e6e8ec";
/** Section rules — header underline, footer top. */
export const RULE = "#ebedf1";
/** The lightest divider, inside a card. */
export const HAIR = "#eceef2";
/** Form field borders. */
export const FIELD = "#dfe2e8";

export const WHITE = "#ffffff";
/** The centres band and the "are you a centre?" card. */
export const WELL = "#fbfbfc";
/** Sign-in page ground. */
export const CANVAS = "#f6f7f9";

/* ── status ────────────────────────────────────────────────────────────────── */

/** "Verified · calibrated", the stat delta, the Band-9 float. */
export const GREEN = "#1c7a4f";
export const GREEN_TINT = "#eaf6f0";

/* ── type ──────────────────────────────────────────────────────────────────── */
/*
 * Sora for headings, Manrope for everything else. Both are loaded with
 * `next/font/google` in the pages that use them, which is how the rest of this
 * codebase declares a typeface — the CSS variables below are what those
 * declarations bind to.
 */
export const DISPLAY = "var(--font-sora), system-ui, sans-serif";
export const SANS = "var(--font-manrope), system-ui, sans-serif";

/* ── shape ─────────────────────────────────────────────────────────────────── */

export const RADIUS = {
  pill: 999,
  card: 24,
  panel: 26,
  field: 14,
  chip: 12,
  icon: 11,
  badge: 8,
} as const;

/** The page gutter every section shares. */
export const SHELL = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" } as const;

/* ── recurring pieces ──────────────────────────────────────────────────────── */

/**
 * The uppercase micro-label above a heading ("DOCUMENTATION", "SECTIONS").
 * `letterSpacing` varies by 0.02em across the canvas; the two values it actually
 * uses are here rather than being re-typed at each call site.
 */
export function eyebrow(wide = false): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: wide ? "0.18em" : "0.16em",
    textTransform: "uppercase",
    color: MUTED,
  };
}

/** Solid burgundy pill — the primary action on every surface. */
export function solidButton(size: "md" | "lg" = "lg"): React.CSSProperties {
  return {
    border: 0,
    cursor: "pointer",
    background: BRAND,
    color: WHITE,
    fontFamily: SANS,
    fontWeight: 700,
    fontSize: size === "lg" ? 16 : 15,
    padding: size === "lg" ? "17px 34px" : "12px 26px",
    borderRadius: RADIUS.pill,
  };
}

/** Outlined pill — the secondary action beside it. */
export function ghostButton(): React.CSSProperties {
  return {
    cursor: "pointer",
    background: WHITE,
    color: INK,
    border: `1px solid ${FIELD}`,
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 16,
    padding: "17px 30px",
    borderRadius: RADIUS.pill,
    whiteSpace: "nowrap",
  };
}

/** The bordered white card used for docs sections and the steps row. */
export function cardStyle(pad = 28): React.CSSProperties {
  return {
    border: `1px solid ${LINE}`,
    borderRadius: 20,
    padding: pad,
    background: WHITE,
  };
}
