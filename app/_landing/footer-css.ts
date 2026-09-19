import { BRAND } from "./design";

/**
 * The footer's own stylesheet: hover states an inline style cannot express,
 * plus the column breakpoints. Injected by whoever renders the footer, so a
 * page that uses it outside the design chrome still gets them.
 *
 * ⚠️ IT LIVES IN A PLAIN MODULE BECAUSE A SERVER MODULE READS IT. `DESIGN_CSS`
 * in `design-chrome.tsx` interpolates this string, and `design-chrome` renders
 * on the server. When this constant still lived in `site-footer.tsx` — which
 * became a client component so it could be translated — that import stopped
 * being a string: everything a `"use client"` module exports reaches a server
 * module as a client REFERENCE, and interpolating one produces junk rather than
 * an error. The junk ate the first rules of the stylesheet, `.ft-grid` among
 * them, and the footer's columns collapsed into a single stack with no warning
 * anywhere. Values that cross into server code do not belong in a client file.
 */
export const FOOTER_CSS = `
  .ft-link{transition:color .15s}
  .ft-link:hover{color:#fff}
  .ft-disc{transition:border-color .15s,color .15s}
  .ft-disc:hover{border-color:${BRAND};color:#fff}

  /* ── the columns, and the three widths they have to survive ───────────────
     Every track minimum is wrapped in min(...,100%) so it can never be wider
     than its container (the rule responsive.test.ts enforces), and the counts
     step down at the two widths where they stop fitting: four link columns
     beside the brand block, then two, then one. The brand block spans the row
     once there are only two, because it carries the address and the socials
     and reads as a header for them rather than as a fifth column. */
  .ft-inner{padding:72px 28px 0}
  .ft-grid{
    display:grid;
    grid-template-columns:minmax(min(260px,100%),1.4fr) repeat(auto-fit,minmax(min(170px,100%),1fr));
    gap:40px;
  }
  .ft-strip{margin-top:56px;padding:30px 0 44px}
  @media(max-width:900px){
    .ft-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:32px}
    .ft-brand{grid-column:1/-1}
  }
  @media(max-width:560px){
    .ft-inner{padding:48px 20px 0}
    .ft-grid{grid-template-columns:minmax(0,1fr);gap:28px}
    .ft-strip{margin-top:36px;padding:24px 0 32px}
  }
`;
