import Link from "next/link";

import {
  BODY,
  BRAND,
  BRAND_DEEP,
  BRAND_TINT,
  DISPLAY,
  eyebrow,
  FIELD,
  ghostButton,
  INK,
  RULE,
  SANS,
  SHELL,
  solidButton,
  STRONG,
  WELL,
  WHITE,
} from "./design";
import { LangPicker } from "./lang-picker";

// The dark footer lives in its own module and is re-exported here so every
// existing importer of `SiteFooter` keeps working unchanged.
export { SiteFooter } from "./site-footer";
import { FOOTER_CSS } from "./site-footer";

/**
 * Header, centres band and footer from the EngProgress design canvas.
 *
 * Kept apart from the existing `chrome.tsx` rather than replacing it: that file
 * dresses eleven marketing pages that are still on the indigo look, and swapping
 * their header alone would leave each of them wearing two brands at once. The
 * three pages the canvas actually specifies use these; converting the rest is a
 * follow-up, and until it happens `chrome.tsx` is still the right import there.
 */

/** Nav destinations. `/pricing` is behind auth and 307s a logged-out visitor, so
 *  the header points at the anchor on this page — the same fix the SEO pass made. */
const NAV = [
  { label: "Platform", href: "/#platform" },
  { label: "Pricing", href: "/#pricing" },
  { label: "How to use", href: "/how-to-use" },
  // Opens the guide, not the marketing page: a centre clicking this wants to
  // know how to run the console, and /how-to-use is where that lives.
  { label: "For centers", href: "/how-to-use/education-centers" },
];

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

export function SiteHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${RULE}`,
      }}
    >
      <div
        style={{
          ...SHELL,
          height: 74,
          display: "flex",
          alignItems: "center",
          gap: 36,
        }}
      >
        <Wordmark />
        <nav
          className="lp-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            fontSize: 15,
            fontWeight: 500,
            color: BODY,
          }}
        >
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="lp-navlink" style={{ color: BODY }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <LangPicker />
          <Link href="/sign-in" className="lp-solid" style={{ ...solidButton("md"), display: "inline-block" }}>
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

/** The "For education centers" band that sits above the footer on every page
 *  that shows the chrome. */
export function CentersBand() {
  return (
    <section style={{ borderTop: `1px solid ${RULE}`, background: WELL, padding: "52px 28px" }}>
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ ...eyebrow(true), color: BRAND }}>For education centers</div>
          <h3
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "-0.03em",
              margin: "12px 0 0",
              textWrap: "pretty",
              color: INK,
            }}
          >
            Run AI-graded IELTS &amp; CEFR practice for every group you teach
          </h3>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: BODY,
              maxWidth: 620,
              margin: "12px 0 0",
            }}
          >
            Center licences include student logins, teacher accounts, group assignments and band
            reporting. Talk to us about a pilot for your center.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              marginTop: 18,
              fontSize: 15,
              color: STRONG,
            }}
          >
            <span>
              ✉{" "}
              <a href="mailto:centers@engprogress.com" style={{ fontWeight: 700, color: BRAND }}>
                centers@engprogress.com
              </a>
            </span>
            <span>
              ✆{" "}
              <a href="tel:+998712000000" style={{ fontWeight: 700, color: BRAND }}>
                +998 71 200 00 00
              </a>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link
            href="/contact"
            className="lp-solid"
            style={{ ...solidButton(), padding: "17px 32px", textAlign: "center", whiteSpace: "nowrap" }}
          >
            Contact us
          </Link>
          <Link
            href="/how-to-use/education-centers"
            className="lp-ghost"
            style={{ ...ghostButton(), padding: "17px 32px", textAlign: "center", display: "block" }}
          >
            Center guide
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Hover states an inline style cannot express, plus the nav's mobile collapse. */
export const DESIGN_CSS = `
  ${FOOTER_CSS}
  @keyframes lp-demo-shimmer{to{background-position:-200% 0}}
  .lp-below-fold{content-visibility:auto;contain-intrinsic-size:760px}
  .lp-navlink{text-decoration:none;transition:color .15s}
  .lp-navlink:hover{color:${INK}}
  .lp-solid{transition:background .15s}
  .lp-solid:hover{background:${BRAND_DEEP}}
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
  @media(max-width:860px){.lp-nav{display:none!important}}

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
