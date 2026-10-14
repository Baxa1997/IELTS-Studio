import { BRAND, BRAND_TINT, LINE } from "@/app/_landing/_lib/design";

/**
 * What an inline style cannot say on /grade: hover and focus states, the
 * checker's two-column body collapsing on a narrow screen, and the FAQ's
 * disclosure marker.
 *
 * ⚠️ A PLAIN MODULE, NOT THE CLIENT GRADER. The server page injects this
 * string, and a `"use client"` module hands a server module a client
 * REFERENCE rather than the string — the footer's columns collapsed silently
 * that way once (see app/_landing/client-boundary.test.ts).
 */
export const GRADE_CSS = `
  .gr-tab{transition:border-color .15s,box-shadow .15s}
  .gr-tab:hover{border-color:${BRAND}}
  .gr-tab:focus-visible,.gr-pill:focus-visible,.gr-chip:focus-visible,.gr-link:focus-visible{outline:2px solid ${BRAND};outline-offset:2px}
  .gr-pill,.gr-chip{transition:border-color .15s,color .15s}
  .gr-pill:hover,.gr-chip:hover{border-color:${BRAND};color:${BRAND}}
  .gr-link:hover{text-decoration:underline}
  .gr-field{transition:border-color .15s,box-shadow .15s}
  .gr-field:focus{outline:none;border-color:${BRAND};box-shadow:0 0 0 3px ${BRAND_TINT}}
  .gr-answer:focus{outline:none}
  .gr-answer-wrap{transition:box-shadow .15s}
  .gr-answer-wrap:focus-within{box-shadow:inset 0 0 0 2px ${BRAND_TINT}}

  /* The question beside the answer on a desktop; above it on anything
     narrower, where two columns of prose would each be a few words wide. */
  .gr-cols{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.25fr)}
  .gr-cols>*+*{border-left:1px solid ${LINE}}
  @media(max-width:900px){
    .gr-cols{grid-template-columns:minmax(0,1fr)}
    .gr-cols>*+*{border-left:0;border-top:1px solid ${LINE}}
  }

  /* Three tabs stay in one row on a phone — stacked, they would push the
     writing surface a screen down — so each drops to its name alone. */
  @media(max-width:620px){
    .gr-tab{padding:12px 10px!important;gap:0!important;justify-content:center;text-align:center}
    .gr-tab-sub,.gr-tab-icon{display:none!important}
    .gr-tab-label{font-size:14px!important}
  }

  .gr-faq>summary{list-style:none;cursor:pointer}
  .gr-faq>summary::-webkit-details-marker{display:none}
  .gr-faq-plus{transition:transform .2s}
  .gr-faq[open] .gr-faq-plus{transform:rotate(45deg)}
`;
