import {
  BODY,
  BRAND,
  COVER_RING,
  COVER_RING_SOFT,
  DISPLAY,
  INK,
  LINE,
  MUTED,
  SANS,
  STRONG,
  WHITE,
} from "./design";

/**
 * The blog's stylesheet — the landing section and every /blog page.
 *
 * A PLAIN MODULE, NOT A COMPONENT FILE, for the reason `footer-css.ts` gives:
 * server modules interpolate this string, and a string exported from a
 * `"use client"` file reaches them as a client reference, not as CSS.
 *
 * Classes, not inline styles, wherever a rule needs a breakpoint, a hover or a
 * pseudo-element — the three things an inline style cannot say. Every grid
 * track minimum is wrapped in `min(…,100%)`; `app/_landing/responsive.test.ts`
 * reads this file and fails on one that is not.
 */
export const BLOG_CSS = `
  /* ── story cards ─────────────────────────────────────────────────────────
     The headline is the ONE link in a card, and its ::after stretches over the
     whole card so the cover and the summary are clickable too. One link per
     story, not three: a screen reader tabbing through the section hears each
     headline once, rather than cover, headline and "read more" for the same
     place. */
  .bl-story{position:relative}
  .bl-hl{color:${INK};text-decoration:none}
  .bl-hl::after{content:"";position:absolute;inset:0;border-radius:14px}
  .bl-hl:focus-visible{outline:none}
  .bl-hl:focus-visible::after{outline:2px solid ${BRAND};outline-offset:4px}
  .bl-story:hover .bl-hl{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
  .bl-story:hover .bl-cover-art{transform:scale(1.03)}
  @media(prefers-reduced-motion:reduce){
    .bl-cover-art{transition:none}
    .bl-story:hover .bl-cover-art{transform:none}
  }

  /* ── the generated cover ───────────────────────────────────────────────── */
  .bl-cover{position:relative;overflow:hidden;aspect-ratio:16/9;container-type:inline-size;isolation:isolate}
  .bl-cover-art{position:absolute;inset:0;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
  .bl-kicker{
    position:absolute;left:7cqi;bottom:7cqi;right:7cqi;
    font-family:${DISPLAY};font-weight:600;letter-spacing:-.03em;line-height:1;
    font-size:14px;font-size:clamp(14px,11cqi,88px);
    color:${WHITE};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .bl-ring{position:absolute;width:68cqi;aspect-ratio:1;border-radius:50%;border:1px solid ${COVER_RING}}
  .bl-ring::after{content:"";position:absolute;inset:14%;border-radius:50%;border:1px solid ${COVER_RING_SOFT}}

  /* ── the landing section: lead on the left, three rows on the right ───── */
  .bl-top{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:32px;align-items:start}
  .bl-rows{display:flex;flex-direction:column}
  .bl-row{display:grid;grid-template-columns:minmax(0,40%) minmax(0,1fr);gap:16px;align-items:start;padding:18px 0;border-top:1px solid ${LINE}}
  .bl-rows > .bl-row:first-child{padding-top:0;border-top:0}
  @media(max-width:900px){
    .bl-top{grid-template-columns:minmax(0,1fr);gap:24px}
    .bl-rows > .bl-row:first-child{padding-top:18px;border-top:1px solid ${LINE}}
  }

  /* ── the front page ────────────────────────────────────────────────────── */
  .bl-lead{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:36px;align-items:center}
  .bl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:40px 28px}
  .bl-card{display:flex;flex-direction:column;gap:14px}
  @media(max-width:900px){
    .bl-lead{grid-template-columns:minmax(0,1fr);gap:18px}
  }
  /* On a phone a column of full-width covers is a lot of scrolling for very
     little reading, so every card below the lead turns into a row — thumbnail
     beside headline — and drops its summary. The lead keeps both. */
  @media(max-width:560px){
    .bl-grid{gap:0}
    .bl-card{display:grid;grid-template-columns:minmax(0,38%) minmax(0,1fr);gap:14px;align-items:start;padding:16px 0;border-top:1px solid ${LINE}}
    .bl-card .bl-dek{display:none}
  }

  /* ── the article ───────────────────────────────────────────────────────── */
  .bl-col{max-width:720px;margin:0 auto}
  .bl-prose{font-family:${SANS};color:${STRONG}}
  .bl-prose p{font-size:18.5px;line-height:1.75;margin:0 0 24px;text-wrap:pretty}
  .bl-prose h2{font-family:${DISPLAY};font-weight:600;font-size:25px;line-height:1.25;letter-spacing:-.02em;color:${INK};margin:44px 0 14px;text-wrap:balance}
  .bl-prose strong{color:${INK};font-weight:700}
  .bl-prose a{color:${BRAND};font-weight:600;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
  .bl-prose a:hover{text-decoration-thickness:2px}
  .bl-prose ul,.bl-prose ol{margin:0 0 26px;padding:0;display:flex;flex-direction:column;gap:12px}
  .bl-prose li{font-size:18.5px;line-height:1.7;position:relative}
  .bl-prose ul{list-style:none}
  .bl-prose ul > li{padding-left:24px}
  .bl-prose ul > li::before{content:"";position:absolute;left:4px;top:.72em;width:7px;height:7px;border-radius:50%;background:${BRAND}}
  .bl-prose ol{list-style:none;counter-reset:bl}
  .bl-prose ol > li{padding-left:40px;counter-increment:bl}
  .bl-prose ol > li::before{
    content:counter(bl);position:absolute;left:0;top:.12em;
    width:26px;height:26px;border-radius:50%;border:1.5px solid ${BRAND};
    display:flex;align-items:center;justify-content:center;
    font-family:${DISPLAY};font-weight:600;font-size:13px;color:${BRAND};
  }
  .bl-ex{display:grid;grid-template-columns:minmax(min(96px,30%),max-content) minmax(0,1fr);gap:10px 20px;margin:0}
  .bl-ex dt{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};padding-top:4px}
  .bl-ex dd{margin:0;font-size:17px;line-height:1.55;color:${INK}}
  @media(max-width:560px){
    .bl-prose p,.bl-prose li{font-size:17.5px;line-height:1.7}
    .bl-prose h2{font-size:22px;margin-top:36px}
    .bl-ex{grid-template-columns:minmax(0,1fr);gap:2px}
    .bl-ex dd{margin-bottom:10px}
  }
  .bl-share{transition:border-color .15s,color .15s}
  .bl-share:hover{border-color:${BRAND};color:${BRAND}}
  .bl-crumb{color:${BODY};text-decoration:none}
  .bl-crumb:hover{color:${BRAND}}
`;
