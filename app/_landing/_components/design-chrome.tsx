import Link from "next/link";

import {
  BODY,
  BRAND,
  BRAND_FILL,
  BRAND_FILL_DEEP,
  BRAND_TINT,
  DISPLAY,
  FIELD,
  INK,
  ISLAND,
  LINE,
  PANEL,
  SANS,
  WHITE,
} from "../_lib/design";
import { SiteNav } from "./site-nav";

// The dark footer lives in its own module and is re-exported here so every
// existing importer of `SiteFooter` keeps working unchanged. The centres band
// moved out for a different reason — it had to become a client component to
// read the locale — and is re-exported on the same principle.
export { SiteFooter } from "./site-footer";
export { CentersBand } from "./centers-band";
import { FOOTER_CSS } from "../_lib/footer-css";

/**
 * Header, centres band and footer from the EngProgress design canvas.
 *
 * Kept apart from the existing `chrome.tsx` rather than replacing it: that file
 * dresses eleven marketing pages that are still on the indigo look, and swapping
 * their header alone would leave each of them wearing two brands at once. The
 * three pages the canvas actually specifies use these; converting the rest is a
 * follow-up, and until it happens `chrome.tsx` is still the right import there.
 */

// The nav destinations moved to `site-nav.tsx`, which is where they are rendered
// now — both in the island and in the mobile drawer. Keeping a second copy here
// is how the two lists drift apart.

export function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        color: onDark ? WHITE : INK,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: onDark ? "rgba(255,255,255,0.16)" : BRAND,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: WHITE,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        E
      </span>
      <span
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: "-0.02em",
        }}
      >
        EngProgress
      </span>
    </Link>
  );
}

/**
 * The floating header island.
 *
 * STICKY WITH A TRANSPARENT WRAPPER, not `position: fixed`. The reference fixes
 * its header and then pays for it by adding ~104px of top padding to the hero —
 * which works when one page owns the header. Ours dresses six, and a fixed
 * header would have slid under the first heading of all six until each was given
 * padding to match. A sticky wrapper with its own top padding occupies the space
 * it needs, floats at the same offset once stuck, and no page below has to know
 * it changed.
 *
 * The wrapper is deliberately transparent: the gap above the pill is what makes
 * it read as an island, and painting it would just reinstate the bar this
 * replaces.
 */
export function SiteHeader() {
  return (
    <header className="lp-island-wrap">
      <div className="lp-island">
        <Wordmark />
        <SiteNav />
      </div>
    </header>
  );
}

/** Hover states an inline style cannot express, plus the nav's mobile collapse. */
export const DESIGN_CSS = `
  ${FOOTER_CSS}
  @keyframes lp-demo-shimmer{to{background-position:-200% 0}}
  .lp-below-fold{content-visibility:auto;contain-intrinsic-size:760px}

  /* ── the header island ──────────────────────────────────────────────────────
     The wrapper holds the sticky offset and stays transparent; the pill inside
     it is the object. Both live here rather than inline because the pill needs
     a hover and the whole thing needs breakpoints, and an inline style can
     express neither. */
  .lp-island-wrap{position:sticky;top:0;z-index:50;padding:14px 16px 0;pointer-events:none}
  .lp-island{
    pointer-events:auto;
    max-width:${ISLAND.maxWidth}px;margin:0 auto;
    display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;
    /* A TOKEN, NOT A WHITE. The island stays translucent in both themes — the
       blur behind it is the effect — but the tint it carries has to follow the
       page, or the header is a white pill floating on a near-black site with
       the wordmark's near-white ink invisible on top of it. */
    background:var(--mk-island);
    -webkit-backdrop-filter:blur(16px) saturate(150%);backdrop-filter:blur(16px) saturate(150%);
    border:1px solid ${ISLAND.line};border-radius:999px;
    padding:9px 10px 9px 18px;
    box-shadow:${ISLAND.shadow};
    transition:box-shadow .2s ease,background .2s ease;
  }
  .lp-island:hover{background:var(--mk-island-hover)}

  .lp-nav{display:inline-flex;align-items:center;justify-content:center;gap:2px}
  .lp-navlink{
    display:inline-flex;align-items:center;white-space:nowrap;
    padding:8px 12px;border-radius:10px;
    font-family:${SANS};font-size:15px;font-weight:500;letter-spacing:-.005em;
    color:${BODY};text-decoration:none;
    transition:color .15s,background .15s;
  }
  .lp-navlink:hover{color:${INK};background:var(--mk-island-wash)}

  .lp-nav-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px}
  .lp-island-cta{
    display:inline-flex;align-items:center;white-space:nowrap;justify-content:center;
    /* Holds its width through the signed-out → signed-in swap, so the row does
       not jump when the session resolves after paint. */
    min-width:124px;
    /* BRAND_FILL, not BRAND: the two are the same burgundy in light, and in
       dark BRAND lightens to stay legible as TEXT, which leaves white on it at
       3.8:1. A filled button needs the fill that still carries white. */
    background:${BRAND_FILL};color:${WHITE};
    border-radius:999px;padding:10px 20px;
    font-family:${SANS};font-size:14.5px;font-weight:700;letter-spacing:-.005em;
    text-decoration:none;
    box-shadow:0 1px 0 rgba(255,255,255,.16) inset,0 6px 16px -8px rgba(125,1,50,.65);
    transition:background .15s,transform .15s;
  }
  .lp-island-cta:hover{background:${BRAND_FILL_DEEP}}
  .lp-island-cta:active{transform:translateY(1px)}

  .lp-burger{
    display:none;width:38px;height:38px;align-items:center;justify-content:center;
    border:1px solid ${FIELD};border-radius:999px;background:${PANEL};
    color:${INK};cursor:pointer;
  }
  .lp-mobile-menu{
    position:absolute;left:16px;right:16px;top:calc(100% + 10px);
    background:${PANEL};border:1px solid ${LINE};border-radius:22px;
    box-shadow:0 24px 60px -24px rgba(18,19,23,.35);
    padding:14px;pointer-events:auto;
  }

  /* The nav and the language picker are the first things to go: below this the
     four links and the picker stop fitting beside the wordmark, and the pill
     starts wrapping to two rows. The action button never goes — it is the one
     control the header exists for. */
  @media(max-width:980px){
    .lp-nav{display:none}
    .lp-nav-lang{display:none}
    .lp-burger{display:inline-flex}
    .lp-island{grid-template-columns:1fr auto;padding-right:9px}
  }
  @media(max-width:420px){
    .lp-island{padding-left:12px}
    .lp-island-cta{min-width:0;padding:10px 15px;font-size:13.5px}
  }
  .lp-solid{transition:background .15s}
  /* solidButton() fills with BRAND_FILL and writes in WHITE, so its hover has to
     stay on the fill ramp too — see BRAND_FILL_DEEP. (No backticks in here: this
     is inside a template literal and one would end the string.) */
  .lp-solid:hover{background:${BRAND_FILL_DEEP}}
  .lp-ghost{transition:border-color .15s,color .15s}
  .lp-ghost:hover{border-color:${BRAND};color:${BRAND}}
  .lp-card{transition:border-color .15s}
  .lp-card:hover{border-color:${BRAND}}
  .lp-doclink{transition:color .15s}
  .lp-doclink:hover{color:${BRAND}}
  /* the documentation sidebar IS the tab list — these are buttons, not links */
  .lp-doctab{transition:color .15s,background .15s,border-color .15s}
  .lp-doctab:hover{color:${BRAND}}
  .lp-doctab[aria-selected="false"]:hover{background:${BRAND_TINT}}
  .lp-doctab:focus-visible{outline:2px solid ${BRAND};outline-offset:-2px}
  .lp-field:focus-visible{outline:2px solid ${BRAND};outline-offset:2px;border-color:${BRAND}}
  .lp-field{border:1px solid ${FIELD};font-family:${SANS}}

  /* ── sign-in, below the two-panel width ────────────────────────────────────
     THE PAGE CLIPPED THE FORM AND OFFERED NO WAY TO REACH IT. The desktop
     layout is deliberately height:100dvh with overflow:hidden — the owner asked
     for a login that never scrolls, because on a laptop the card and the
     disclaimer used to fall off the bottom. That works while the two panels sit
     side by side. Once they stack, the burgundy panel takes a screen of its own
     and the form lands below the fold of a container that clips and does not
     scroll: on a phone the sign-in button simply did not exist.

     So the no-scroll rule is kept where it was written for — the two-panel
     layout — and released the moment the panels stack. The proposition panel
     also sheds its proof rows here: they are supporting copy, and making
     somebody scroll past a full screen of them to reach a password field is
     the wrong order. The wordmark and the headline stay, so the page still
     says whose login this is. */
  @media(max-width:900px){
    .lp-auth{height:auto!important;min-height:100dvh;overflow:visible!important}
    /* The panel clips too, so releasing only the page would still cut the
       headline off on a short screen. */
    .lp-auth-panel{min-height:auto!important;padding:26px 24px!important;overflow:visible!important}
    .lp-auth-points{display:none!important}
    .lp-auth-form{overflow:visible!important;justify-content:flex-start!important;padding:0!important}
    /* The language picker is pushed to the top by margin-bottom:auto while the
       column is centred and full-height. Stacked, that auto resolves against a
       content-height box and drags a gap behind it. */
    .lp-auth-form > div:first-child{margin-bottom:14px!important}
  }
`;
