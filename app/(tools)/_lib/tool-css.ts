import {
  BLOG_COVER,
  BODY,
  BRAND,
  BRAND_FILL,
  BRAND_FILL_DEEP,
  BRAND_TINT,
  BRAND_TINT_LINE,
  CANVAS,
  COVER_RING,
  COVER_RING_SOFT,
  DISPLAY,
  FIELD,
  HERO_A,
  HERO_B,
  INK,
  LINE,
  MUTED,
  PANEL,
  RULE,
  SANS,
  WELL,
  WHITE,
} from "@/app/_landing/_lib/design";

import type { MultilevelLevel } from "./scores";

/**
 * The level grounds — the blog's cover gradients, reused.
 *
 * ⚠️ BORROWED, NOT INVENTED: every one of these stops is held to AA against
 * white in BOTH themes by `lib/theme/palette.test.ts`, which is the only reason
 * a white "C1" can sit on them. Five new colours would need that test to know
 * about them first. C2 wears the brand's own hero, so the top of the scale looks
 * like EngProgress.
 */
export const LEVEL_GROUND = {
  C2: { a: HERO_B, b: HERO_A },
  C1: BLOG_COVER.ielts,
  B2: BLOG_COVER.multilevel,
  B1: BLOG_COVER.english,
  below: BLOG_COVER.stories,
} as const;

export type LevelGround = keyof typeof LEVEL_GROUND;

/** The Multilevel exam's four results on the same grounds. */
export const MULTILEVEL_GROUND: Record<MultilevelLevel, LevelGround> = { C1: "C1", B2: "B2", B1: "B1", belowB1: "below" };

export const levelBackground = (g: LevelGround) =>
  `linear-gradient(140deg,${LEVEL_GROUND[g].a} 0%,${LEVEL_GROUND[g].b} 100%)`;

/**
 * The calculators' stylesheet: what inline styles cannot do — breakpoints,
 * hover and focus states, the range slider, the result's entrance.
 *
 * Every grid track is capped with `min(…,100%)`, the lesson
 * `app/_landing/responsive.test.ts` was written to hold: an uncapped minimum is
 * wider than a phone.
 */
export const TOOL_CSS = `
.tl-shell{max-width:1240px;margin:0 auto;padding:0 28px}
@media(max-width:560px){.tl-shell{padding:0 16px}}

.tl-hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:48px;align-items:center;padding:28px 0 8px}
@media(max-width:900px){.tl-hero{grid-template-columns:minmax(0,1fr);gap:28px}}
.tl-crumbs{display:flex;flex-wrap:wrap;gap:8px;font-family:${SANS};font-size:14px;font-weight:600;color:${MUTED}}
.tl-crumbs a{color:${MUTED};text-decoration:none}
.tl-crumbs a:hover{color:${BRAND}}
.tl-chip{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:999px;background:${PANEL};border:1px solid ${LINE};font-family:${SANS};font-size:13.5px;font-weight:600;color:${INK}}
.tl-chip::before{content:"";width:7px;height:7px;border-radius:999px;background:${BRAND_FILL}}

.tl-photo{position:relative;border-radius:28px;overflow:hidden;aspect-ratio:4/3;background:${CANVAS};box-shadow:0 40px 80px -48px rgba(18,19,23,.55)}
.tl-photo img{object-fit:cover}
.tl-badge{position:absolute;left:18px;bottom:18px;display:flex;align-items:center;gap:14px;padding:12px 16px 12px 12px;border-radius:18px;background:${PANEL};border:1px solid ${LINE};box-shadow:0 18px 40px -20px rgba(18,19,23,.5);animation:tl-float 6s ease-in-out infinite}
@keyframes tl-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

.tl-section{padding:clamp(40px,6vw,72px) 0 0}
.tl-card{background:${PANEL};border:1px solid ${LINE};border-radius:26px;padding:clamp(20px,3vw,32px)}
.tl-calc{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:22px;align-items:start}
@media(max-width:900px){.tl-calc{grid-template-columns:minmax(0,1fr)}}
.tl-sticky{position:sticky;top:96px}
@media(max-width:900px){.tl-sticky{position:static}}

.tl-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:14px 0;border-top:1px solid ${RULE}}
.tl-row:first-of-type{border-top:0}
.tl-step{display:inline-flex;align-items:center;gap:6px;background:${WELL};border:1px solid ${LINE};border-radius:999px;padding:4px}
.tl-step button{width:38px;height:38px;border-radius:999px;border:0;background:${PANEL};color:${INK};font-family:${SANS};font-size:20px;font-weight:700;line-height:1;cursor:pointer;box-shadow:0 1px 2px rgba(18,19,23,.12);transition:background .15s,color .15s,transform .1s}
.tl-step button:hover:not(:disabled){background:${BRAND_FILL};color:${WHITE}}
.tl-step button:active:not(:disabled){transform:scale(.94)}
.tl-step button:disabled{opacity:.35;cursor:not-allowed}
.tl-step output{min-width:52px;text-align:center;font-family:${DISPLAY};font-size:22px;font-weight:600;color:${INK};font-variant-numeric:tabular-nums}

.tl-num{width:86px;padding:10px 12px;border-radius:14px;border:1px solid ${FIELD};background:${PANEL};color:${INK};font-family:${DISPLAY};font-size:20px;font-weight:600;text-align:center;font-variant-numeric:tabular-nums}
.tl-num:focus-visible,.tl-step button:focus-visible,.tl-tab:focus-visible,.tl-use:focus-visible{outline:3px solid ${BRAND_TINT_LINE};outline-offset:2px}
.tl-range{width:100%;accent-color:${BRAND_FILL};height:28px;cursor:pointer}

.tl-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:5px;border-radius:16px;background:${WELL};border:1px solid ${LINE}}
.tl-tab{flex:1 1 auto;border:0;border-radius:12px;padding:10px 14px;background:transparent;color:${BODY};font-family:${SANS};font-size:14px;font-weight:700;cursor:pointer;transition:background .15s,color .15s}
.tl-tab[aria-checked="true"]{background:${PANEL};color:${BRAND};box-shadow:0 1px 3px rgba(18,19,23,.14)}

.tl-result{position:relative;overflow:hidden;border-radius:26px;padding:clamp(22px,3vw,30px);color:${WHITE}}
.tl-result::after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:999px;border:34px solid ${COVER_RING_SOFT};pointer-events:none}
.tl-big{font-family:${DISPLAY};font-weight:600;font-size:clamp(64px,9vw,96px);line-height:1;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.tl-pop{animation:tl-pop .38s cubic-bezier(.2,.9,.3,1.3)}
@keyframes tl-pop{0%{transform:scale(.86);opacity:.4}100%{transform:scale(1);opacity:1}}
.tl-pill{display:inline-flex;align-items:center;padding:6px 12px;border-radius:999px;background:${COVER_RING};font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:.02em}

/* Text inside the calculators' cards — one rule each instead of the same
   inline object at every use. */
.tl-h3{font-family:${DISPLAY};font-size:22px;font-weight:600;color:${INK};margin:0}
.tl-hint{font-family:${SANS};font-size:15.5px;line-height:1.55;color:${BODY};margin:8px 0 18px}
.tl-note{font-family:${SANS};font-size:13.5px;line-height:1.6;color:${MUTED};margin:18px 0 0}
.tl-kicker{font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}}
.tl-caption{font-family:${SANS};font-size:13px;font-weight:700;color:${MUTED}}
.tl-skill{font-family:${DISPLAY};font-size:19px;font-weight:600;color:${INK}}
.tl-answer{font-family:${DISPLAY};font-size:34px;font-weight:600;color:${BRAND};margin-top:4px}
.tl-field{display:flex;align-items:center;justify-content:space-between;gap:14px}
.tl-field label{font-size:15px;font-weight:700}
/* On a result card's dark ground: the lead line, the softer explanation, and
   the "what next" box. Softened with opacity, not a translucent colour, so the
   ink stays the one token that carries white. */
.tl-lead{font-family:${SANS};font-size:16px;font-weight:700;margin:10px 0 0}
.tl-soft{font-family:${SANS};font-size:14.5px;line-height:1.55;color:${WHITE};opacity:.84;margin:12px 0 0}
.tl-tip{font-family:${SANS};font-size:14.5px;line-height:1.5;font-weight:700;margin:14px 0 0;padding:10px 12px;border-radius:12px;background:${COVER_RING_SOFT};color:${WHITE}}

.tl-use{border:1px solid ${BRAND_TINT_LINE};background:${BRAND_TINT};color:${BRAND};border-radius:999px;padding:10px 16px;font-family:${SANS};font-size:14px;font-weight:700;cursor:pointer;transition:background .15s,color .15s}
.tl-use:hover{background:${BRAND_FILL};color:${WHITE};border-color:${BRAND_FILL}}

.tl-scale{position:relative;height:14px;border-radius:999px;overflow:hidden;display:flex}
.tl-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:12px;font-family:${SANS};font-size:12.5px;color:${BODY}}
.tl-legend span{display:inline-flex;align-items:center;gap:6px}
.tl-legend i{width:10px;height:10px;border-radius:3px}
.tl-marker{position:absolute;top:-7px;width:4px;height:28px;border-radius:4px;background:${INK};box-shadow:0 0 0 3px ${PANEL};transition:left .35s ease}

.tl-tables{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:18px}
.tl-table{width:100%;border-collapse:collapse;font-family:${SANS};font-size:15px}
.tl-table th{text-align:left;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${MUTED};padding:0 12px 10px}
.tl-table td{padding:10px 12px;border-top:1px solid ${RULE};color:${INK};font-variant-numeric:tabular-nums}
.tl-table tr:nth-child(even) td{background:${WELL}}
.tl-table td:last-child{font-weight:700;color:${BRAND}}
.tl-grid-table{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(132px,100%),1fr));gap:8px}
.tl-cell{display:flex;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:12px;background:${WELL};border:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${BODY};font-variant-numeric:tabular-nums}
.tl-cell b{color:${BRAND}}

.tl-ladder{display:grid;gap:10px}
.tl-rung{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:16px;padding:14px 18px;border-radius:18px;color:${WHITE}}

.tl-faq details{border-top:1px solid ${LINE};padding:18px 0}
.tl-faq details:last-child{border-bottom:1px solid ${LINE}}
.tl-faq summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:18px;font-family:${DISPLAY};font-size:18px;font-weight:600;color:${INK}}
.tl-faq summary::-webkit-details-marker{display:none}
.tl-faq summary::after{content:"+";flex:none;font-family:${SANS};font-size:22px;line-height:1;color:${BRAND};transition:transform .2s}
.tl-faq details[open] summary::after{transform:rotate(45deg)}
.tl-faq p{margin:12px 0 0;font-family:${SANS};font-size:16px;line-height:1.65;color:${BODY};max-width:760px}

.tl-card-title{font-family:${DISPLAY};font-weight:600;font-size:clamp(22px,2.6vw,28px);line-height:1.2;letter-spacing:-.02em;color:${INK}}
.tl-body{font-family:${SANS};font-size:16px;line-height:1.6;color:${BODY};margin:10px 0 0}
/* The same two on the burgundy panel: white ink, the body softened by opacity. */
.tl-on-dark .tl-card-title{color:${WHITE}}
.tl-on-dark .tl-body{color:${WHITE};opacity:.84}
.tl-cta{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:18px}
.tl-link{color:${BRAND};font-weight:700;text-decoration:none}
.tl-link:hover{text-decoration:underline}
.tl-solid{transition:background .15s}
.tl-solid:hover{background:${BRAND_FILL_DEEP}!important}

.tl-cross{display:grid;grid-template-columns:minmax(0,180px) minmax(0,1fr);gap:22px;align-items:center}
@media(max-width:560px){.tl-cross{grid-template-columns:minmax(0,1fr)}}
.tl-thumb{position:relative;border-radius:18px;overflow:hidden;aspect-ratio:4/3}
.tl-thumb img{object-fit:cover}

@media(prefers-reduced-motion:reduce){.tl-badge,.tl-pop{animation:none}.tl-marker{transition:none}}
`;
