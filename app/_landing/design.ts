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
export const BRAND = "var(--mk-brand)";
/** Pressed / hover. */
export const BRAND_DEEP = "var(--mk-brand-deep)";
/** The darkest stop in the sign-in panel's gradient. */
export const BRAND_DARKEST = "var(--mk-brand-darkest)";
/** Panel ground under that gradient. */
export const BRAND_PANEL = "var(--mk-brand-panel)";
/** Tinted fill — chips, icon squares, the eyebrow pill. */
export const BRAND_TINT = "var(--mk-brand-tint)";
/** The border that pairs with `BRAND_TINT`. */
export const BRAND_TINT_LINE = "var(--mk-brand-tint-line)";

/* ── ink ───────────────────────────────────────────────────────────────────── */

/** Headings and the big numerals. */
export const INK = "var(--mk-ink)";
/** Body copy. */
export const BODY = "var(--mk-body)";
/** Slightly stronger than body — list items, nav. */
export const STRONG = "var(--mk-strong)";
/** Eyebrows, captions, stat labels. */
export const MUTED = "var(--mk-muted)";
/** The quietest text — the IELTS disclaimer, disabled nav. */
export const FAINT = "var(--mk-faint)";
/** Stat sublines. */
export const GREY = "var(--mk-grey)";

/* ── lines and grounds ─────────────────────────────────────────────────────── */

/** Card and control borders. */
export const LINE = "var(--mk-line)";
/** Section rules — header underline, footer top. */
export const RULE = "var(--mk-rule)";
/** The lightest divider, inside a card. */
export const HAIR = "var(--mk-hair)";
/** Form field borders. */
export const FIELD = "var(--mk-field)";

/**
 * Literal white — and it STAYS white in dark mode.
 *
 * ⚠️ SPLIT FROM `PANEL`, same as in `lib/theme/tokens.ts`. This constant was
 * doing two jobs that are indistinguishable on a white page and opposite in
 * dark mode: the ink on a filled burgundy button (`color: WHITE`) and the fill
 * of a card or the page ground (`background: PANEL`). The card has to invert;
 * the ink on the button must not, because the button is still burgundy.
 *
 * `background: PANEL` is almost always wrong now — reach for `PANEL`.
 */
export const WHITE = "#ffffff";

/** Card, panel and page fill. White in light mode, near-black in dark. */
export const PANEL = "var(--mk-panel)";
/** The centres band and the "are you a centre?" card. */
export const WELL = "var(--mk-well)";
/** Sign-in page ground. */
export const CANVAS = "var(--mk-canvas)";
/** The legal pages' ground — a cooler, bluer paper than CANVAS, with a hairline
 *  frame ruled down each side. Follows the reference the owner supplied. */
export const PAPER = "var(--mk-paper)";
export const PAPER_RULE = "var(--mk-paper-rule)";

/* ── status ────────────────────────────────────────────────────────────────── */

/** "Verified · calibrated", the stat delta, the Band-9 float. */
export const GREEN = "var(--mk-green)";
export const GREEN_TINT = "var(--mk-green-tint)";

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

/** The page gutter every section shares.
 *
 *  WIDENED 1240 → 1400. The reference this page was re-cut against runs its
 *  content to 1400 with a 1320 header island inside it, and at 1240 our hero
 *  columns were being squeezed narrow enough that the right-hand card and the
 *  headline fought for the same measure. Everything spreading from `SHELL` moves
 *  together, which is the point of it being one constant. */
export const SHELL = { maxWidth: 1400, margin: "0 auto", padding: "0 28px" } as const;

/**
 * The floating header island.
 *
 * DELIBERATELY NARROWER THAN `SHELL`. The island has to read as an object lying
 * on the page rather than as the page's own top edge, and it only does that if
 * the content beneath it is visibly wider than it is. Matching the two makes it
 * look like a header that failed to reach the corners.
 */
export const ISLAND = {
  maxWidth: 1320,
  /** Warm white rather than a grey hairline — the border is catching light, not
   *  drawing a box. */
  line: "rgba(255,255,255,0.72)",
  /** An inset highlight along the top plus a soft drop — what makes it read as
   *  raised instead of merely outlined. */
  shadow:
    "0 1px 0 rgba(255,255,255,0.65) inset, 0 10px 30px -18px rgba(18,19,23,0.45), 0 2px 8px -4px rgba(18,19,23,0.08)",
} as const;

/* ── display scale ─────────────────────────────────────────────────────────── */
/*
 * Big, light, tightly tracked — but sized for OUR headline, which is not the
 * reference's. Theirs is four short words ("Where ideas come to life") and can
 * afford 64px on one line. Ours is a fifty-character sentence that always wraps,
 * and a display size that wraps three times is not a display size, it is a
 * paragraph set in headline type.
 *
 * Three things were decided by our typeface and our copy rather than copied:
 *
 *  - WEIGHT 500, NOT 400. The reference sets its headlines in Geist at 400.
 *    Sora's 400 is meaningfully lighter than Geist's at the same number, so a
 *    literal copy came out spindly. 500 is the optical match, and it is why
 *    `fonts.ts` loads that weight.
 *  - LEADING 1.1, NOT 1.03. A near-solid 1.03 is right for the single line the
 *    reference sets; on our three-line headline the descenders of one line ran
 *    into the caps of the next, which read as cramped rather than tight.
 *  - THE CEILING IS 48px. At 62 the headline dominated everything beside it and
 *    left the lede looking like a footnote. The point of the big-light-tracked
 *    treatment is the PROPORTION between headline, lede and action, and at 48
 *    that proportion is legible instead of merely large.
 */

/** Hero headline. */
export const DISPLAY_XL: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontWeight: 500,
  fontSize: "clamp(32px,4.2vw,48px)",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  textWrap: "balance",
};

/**
 * Section headings — the one place every `<h2>` on the page gets its size.
 *
 * KEPT A CLEAR STEP UNDER `DISPLAY_XL`. These were 52px against a 62px hero: a
 * 10px gap, which at a glance is no gap at all, so every section heading read as
 * loud as the page's one headline. 40 against 48 is a step the eye can see.
 */
export const DISPLAY_LG: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontWeight: 500,
  fontSize: "clamp(27px,3.3vw,40px)",
  lineHeight: 1.14,
  letterSpacing: "-0.03em",
  textWrap: "pretty",
};

/** The lede under a headline. */
export const LEDE: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.55,
  letterSpacing: "-0.01em",
  color: BODY,
  textWrap: "pretty",
};

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
    background: PANEL,
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
    background: PANEL,
  };
}
