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
export const INK = "var(--tk-ink)"; // primary text              17.7:1
export const BODY = "var(--tk-body)"; // long-form body text        8.5:1
export const MUTED = "var(--tk-muted)"; // secondary text             5.1:1
export const SOFT = "var(--tk-soft)"; // tertiary text              4.7:1
export const FAINT = "var(--tk-faint)"; // captions                   4.5:1 (AA floor)

/* ── edges ─────────────────────────────────────────────────────────────────
 * COOLER AND LIGHTER, matching the reference kit's border ramp (its `--border`
 * is hsl(214.3 31.8% 91.4%) — slate-200). The warm greys these replace were
 * solved for a cream console ground; the console is a white panel now and they
 * read as dun lines on it.
 *
 * ⚠️ THIS KNOWINGLY REVERSES A LEGIBILITY FIX, so the mitigation is not
 * optional. These values were once ~1.10–1.26:1 against white, were raised to
 * 1.75:1 precisely "because nobody could see them", and #E2E8F0 is back around
 * 1.2:1. What makes it work this time is that cards no longer rely on the
 * border alone — `cardStyle` carries a soft drop shadow, which is how the
 * reference gets away with the same weight. A card that takes this border and
 * drops the shadow will be invisible again.
 */
export const LINE = "var(--tk-line)"; // card border
export const RULE = "var(--tk-rule)"; // divider inside a card
export const HAIR = "var(--tk-hair)"; // row / column divider

/** Form-control border. Deliberately darker than the card hairline: a card edge
 *  only separates two surfaces, but a field edge has to say "you can type here",
 *  and at the card's weight it disappears on white. Moved onto the same cool
 *  ramp as `LINE`, one step down it, so the distinction survives the change —
 *  a field cannot borrow the card's shadow to stay visible. */
export const FIELD_LINE = "var(--tk-field-line)";

/**
 * Literal white, and it STAYS literal white in dark mode.
 *
 * ⚠️ `WHITE` AND `PANEL` WERE ONE TOKEN AND HAD TO BE SEPARATED. The old
 * `WHITE` was doing two unrelated jobs: the ink on a filled burgundy button
 * (`color: WHITE`) and the fill of a card (`background: WHITE`). They look
 * identical on a white page, so nothing forced them apart — but they invert in
 * opposite directions. A card has to go dark; the ink on a burgundy button has
 * to stay white, because the button underneath it is still burgundy.
 *
 * So: `WHITE` is the ink-on-an-accent one and never changes. Use `PANEL` for
 * any surface. If you write `background: WHITE` you are almost certainly
 * reaching for `PANEL`.
 */
export const WHITE = "#FFFFFF";

/* ── the drifted neutrals ──────────────────────────────────────────────────
 *
 * ⚠️ NOT A PALETTE TO DESIGN IN — a record of one. These are the marketing
 * site's cooler slate greys, written as literals into learner and console
 * screens years before `lib/theme/tokens.ts` existed, 275 times. They are named
 * here so those screens can take a token (and therefore work in dark mode)
 * WITHOUT anyone having to re-approve 200 screens' worth of light-mode colour
 * in the same change — the light value of each is byte-identical to the literal
 * it replaced. In dark mode they resolve onto the real ladder, so the drift
 * simply ends.
 *
 * On a NEW screen use INK / BODY / MUTED / LINE. Reaching for these is how a
 * temporary record becomes a permanent second palette — which is exactly what
 * happened to INDIGO_CONSOLE and friends below.
 */
export const SLATE_INK = "var(--tk-slate-ink)";
export const SLATE_STRONG = "var(--tk-slate-strong)";
export const SLATE_BODY = "var(--tk-slate-body)";
export const SLATE_MUTED = "var(--tk-slate-muted)";
export const SLATE_LINE = "var(--tk-slate-line)";

/** A softer inner fill — wells, read-only blocks. Matches `LEARNER.well`. */
export const WELL = "var(--tk-well)";

/** The fill of a card, a panel, a menu — anything that sits ON the canvas.
 *  White in light mode, near-black in dark. See the note on `WHITE`. */
export const PANEL = "var(--tk-panel)";

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
export const BRAND = "var(--tk-brand)"; // primary action           10.9:1
export const BRAND_DEEP = "var(--tk-brand-deep)"; // pressed / hover
export const BRAND_DARK = "var(--tk-brand-dark)"; // panel ground
export const BRAND_DARKEST = "var(--tk-brand-darkest)"; // darkest gradient stop
export const BRAND_MID = "var(--tk-brand-mid)"; // lighter gradient stop
export const BRAND_LIGHT = "var(--tk-brand-light)"; // lighter still — meters, chart fills
export const BRAND_PALE = "var(--tk-brand-pale)"; // disabled / empty-track fill
export const BRAND_SOFT = "var(--tk-brand-soft)"; // tinted fill
export const BRAND_LINE = "var(--tk-brand-line)"; // tinted border
export const BRAND_WASH = "var(--tk-brand-wash)"; // between SOFT and LINE — hover on a tint

/** Staff only. See the note above before reaching for these on a learner screen. */
export const INDIGO = "var(--tk-indigo)"; // primary action            7.9:1
export const INDIGO_DEEP = "var(--tk-indigo-deep)"; // pressed / hover
export const INDIGO_SOFT = "var(--tk-indigo-soft)"; // tinted fill
export const INDIGO_LINE = "var(--tk-indigo-line)"; // tinted border

/*
 * The other three indigos, named rather than unified.
 *
 * The block above says #3B43B5 won, and it did — but the losing three were still
 * live in 32 files when `scripts/codemod-tokens.ts` came to fold the private
 * `const INDIGO = "…"` blocks into this module. Repainting those screens is a
 * VISUAL change and wants a human eye; centralising where the colour comes from
 * is not. Doing both in one pass would have meant nobody could review either.
 *
 * So the codemod preserved each file's colour exactly and pointed it here. That
 * is the whole point of these three: they record the drift instead of hiding it,
 * and they make finishing the job a four-line edit in ONE file rather than a
 * 32-file hunt across three near-identical hexes.
 *
 * To finish it: set these three to `INDIGO`, run the app, look at the console,
 * the skill hubs and the reading runner, then delete them and let the codemod's
 * imports fall back to `INDIGO`. Until someone has actually looked, they stay.
 */
export const INDIGO_CONSOLE = "var(--tk-indigo-console)"; // staff console + admin   (19 files)
export const INDIGO_SHELL = "var(--tk-indigo-shell)"; // listen / speak / read hubs (12 files)
export const INDIGO_STUDIO = "var(--tk-indigo-studio)"; // reading studio + assistant  (3 files)
/* A fifth, found by the lint rule rather than by the survey that preceded it —
 * the grep looked for `INDIGO =` and this one is `INDIGO_INK =`. One file (the
 * console assistant) uses it as a deep ink. It is NOT `INDIGO_DEEP` above
 * (#2F3699); close, but not equal, and folding it in would move a rendered
 * colour, which is the one thing the codemod promises not to do. */
export const INDIGO_INK = "var(--tk-indigo-ink)"; // assistant chat ink          (1 file)

/* ── status ────────────────────────────────────────────────────────────────── */

export const GREEN = "var(--tk-green)"; // correct / paid / on track  4.9:1
export const AMBER = "var(--tk-amber)"; // needs attention            3.5:1 (large text only)
export const RED = "var(--tk-red)"; // wrong / overdue            4.6:1
export const RED_DEEP = "var(--tk-red-deep)"; // the same red as body text  5.9:1

/** Tinted backgrounds paired with the ink that reads on them. Never pair a tint
 *  with anything but its own `fg` — the pairs are what carry the contrast. */
export const TINT = {
  brand: { bg: BRAND_SOFT, fg: BRAND },
  indigo: { bg: INDIGO_SOFT, fg: INDIGO },
  green: { bg: "var(--tk-tint-green-bg)", fg: GREEN },
  amber: { bg: "var(--tk-tint-amber-bg)", fg: "var(--tk-tint-amber-fg)" },
  red: { bg: "var(--tk-tint-red-bg)", fg: RED_DEEP },
  neutral: { bg: "var(--tk-tint-neutral-bg)", fg: MUTED },
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
  canvas: "var(--tk-learner-canvas)",
  panel: PANEL,
  well: "var(--tk-learner-well)",
  wellLine: "var(--tk-learner-well-line)",
  accent: BRAND,
  accentSoft: BRAND_SOFT,
  accentLine: BRAND_LINE,
  accentShadow: "0 6px 16px -6px rgba(125,1,50,.55)",
  heading: SANS,
  body: SANS,
};

/** The staff console. Cream ground, serif headings. */
export const CONSOLE: Surface = {
  canvas: "var(--tk-console-canvas)",
  panel: PANEL,
  well: "var(--tk-console-well)",
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

/** ⚠️ THE SHADOW IS LOAD-BEARING, not decoration — see the note on `LINE`. At
 *  the new lighter border weight it is what separates a card from the surface
 *  under it; remove it and the card edge goes back to being invisible. */
export const cardStyle: CSSProperties = {
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 12,
  boxShadow: "var(--tk-card-shadow)",
};

export const fieldStyle: CSSProperties = {
  width: "100%",
  border: `1px solid ${FIELD_LINE}`,
  borderRadius: 9,
  padding: "9px 11px",
  fontFamily: "inherit",
  fontSize: 14,
  color: INK,
  background: PANEL,
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
    boxShadow: disabled ? "none" : `0 12px 24px -12px ${withAlpha(accent, 70)}`,
  };
}

/** The quiet counterpart: same metrics, outlined instead of filled. */
export function secondaryBtn(disabled = false): CSSProperties {
  return {
    ...btnBase,
    background: PANEL,
    color: INK,
    border: `1px solid ${LINE}`,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "default" : "pointer",
  };
}

/**
 * Fade a colour to `pct`% opacity — the ONE safe way to do it now.
 *
 * ⚠️ `${colour}33` IS NOW A SILENT NO-OP. Appending two hex digits was a valid
 * way to add alpha for as long as every token was a hex literal. The tokens are
 * `var(--tk-…)` strings today, so that same expression produces
 * `"var(--tk-brand)33"` — not a colour, not a parse error either. The browser
 * drops the declaration and you get an element with no background and nothing
 * in the console to explain it.
 *
 * `color-mix` resolves the var first and then mixes, so it works on a token, a
 * hex, or a caller's arbitrary string. In oklab rather than sRGB because a
 * burgundy faded through sRGB greys out through mud on the way.
 */
export function withAlpha(colour: string, pct: number): string {
  return `color-mix(in oklab, ${colour} ${pct}%, transparent)`;
}

/** A slightly stronger tint of an accent, for the AI-generate gradients.
 *  (0x33 / 0xFF ≈ 20%, the alpha this appended before the var switch.) */
export function accentStrong(colour: string): string {
  return withAlpha(colour, 20);
}
