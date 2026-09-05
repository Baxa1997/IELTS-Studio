import Link from "next/link";
import { SiFacebook, SiInstagram, SiTelegram, SiX } from "react-icons/si";

import { BRAND, DISPLAY, SANS } from "./design";

/**
 * The dark site footer.
 *
 * Pattern only, from the reference the owner supplied: a dark ground, a brand
 * block with a tagline and social discs on the left, link columns on the right,
 * a hairline, then a centred uppercase strip / copyright / fine print.
 *
 * EVERY PUBLIC PAGE IS LINKED HERE — the four skill pages, CEFR, the hub, the
 * grader, the demo, both comparisons, Cambridge, centres, contact, the docs,
 * sign-in, sign-up, privacy and terms. `PUBLIC_PATHS` in
 * `lib/supabase/middleware.ts` is the list this was built against; if a public
 * route is added there it belongs in a column below too, or it ships with no
 * route into it.
 *
 * Two slots are deliberately EMPTY rather than filled with something invented —
 * see SOCIALS and LEGAL_ENTITY.
 */

/* ── the two things only the owner can supply ──────────────────────────────── */

/**
 * Social accounts. `href: null` renders nothing at all.
 *
 * Nothing in this repo records an Instagram, Facebook or X account, so making
 * one up would put three dead links in the footer of every page. Telegram is the
 * exception: `@engprogress_bot` genuinely exists (it carries parent notifications
 * and the staff assistant), so it is the one that is wired.
 *
 * Fill the other three in and they appear — nothing else needs changing.
 */
const SOCIALS: { name: string; href: string | null; Icon: React.ComponentType<{ size?: number }> }[] =
  [
    { name: "Instagram", href: null, Icon: SiInstagram },
    { name: "Facebook", href: null, Icon: SiFacebook },
    { name: "X", href: null, Icon: SiX },
    { name: "Telegram", href: "https://t.me/engprogress_bot", Icon: SiTelegram },
  ];

/**
 * The registered-entity line — the reference footer's last row (`IE: … INN: …`).
 *
 * Left null because this codebase does not record EngProgress's legal entity,
 * address or INN, and those are not details to guess at. Worth filling in: the
 * app takes money through Payme and Click, and Uzbek payment providers generally
 * expect the merchant's registered details to be displayed on the site.
 */
const LEGAL_ENTITY: string | null = null;

/* ── the columns ───────────────────────────────────────────────────────────── */

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Practice",
    links: [
      { label: "IELTS Writing", href: "/ielts-writing-practice" },
      { label: "IELTS Reading", href: "/ielts-reading-practice" },
      { label: "IELTS Listening", href: "/ielts-listening-practice" },
      { label: "IELTS Speaking", href: "/ielts-speaking-practice" },
      { label: "CEFR / Multilevel", href: "/cefr-multilevel-practice" },
      { label: "All IELTS practice", href: "/ielts-practice" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "How to use", href: "/how-to-use" },
      { label: "Guide for centers", href: "/how-to-use/education-centers" },
      { label: "Free essay grader", href: "/grade" },
      { label: "Live demo", href: "/demo" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "For education centers", href: "/for-education-centers" },
      { label: "Cambridge-style practice", href: "/cambridge-ielts-practice" },
      { label: "Compared with ielts.gg", href: "/vs/ielts-gg" },
      { label: "Compared with Engnovate", href: "/vs/engnovate" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Account & legal",
    links: [
      { label: "Sign in", href: "/sign-in" },
      // Account creation is a dialog on /sign-in now — there is no /sign-up
      // page. (/start is dead too: it redirects unconditionally to /sign-in.)
      { label: "Create an account", href: "/sign-in" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of use", href: "/terms" },
    ],
  },
];

/* ── palette, on dark ──────────────────────────────────────────────────────── */

const GROUND = "#121317"; // the design's ink, used here as a ground
const HEADING = "#8b919d";
const LINK = "rgba(255,255,255,0.78)";
const QUIET = "rgba(255,255,255,0.62)";
const HAIRLINE = "rgba(255,255,255,0.10)";
const DISC = "rgba(255,255,255,0.16)";

export function SiteFooter() {
  const socials = SOCIALS.filter((s) => s.href);

  return (
    <footer style={{ background: GROUND, color: LINK }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "72px 28px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px,1.4fr) repeat(auto-fit,minmax(170px,1fr))",
            gap: 40,
          }}
        >
          {/* brand block */}
          <div>
            <Link
              href="/"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}
            >
              <span
                aria-hidden
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: BRAND,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
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
                  fontSize: 22,
                  letterSpacing: "-0.02em",
                  color: "#fff",
                }}
              >
                EngProgress
              </span>
            </Link>

            <p
              style={{
                fontFamily: SANS,
                fontSize: 15,
                lineHeight: 1.6,
                color: QUIET,
                margin: "18px 0 0",
                maxWidth: 330,
              }}
            >
              AI-graded IELTS and CEFR practice for learners and education centers.
            </p>

            {socials.length > 0 ? (
              <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href!}
                    aria-label={s.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ft-disc"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: `1px solid ${DISC}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: LINK,
                    }}
                  >
                    <s.Icon size={17} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: HEADING,
                }}
              >
                {col.heading}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "20px 0 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="ft-link"
                      style={{
                        fontFamily: SANS,
                        fontSize: 15,
                        color: LINK,
                        textDecoration: "none",
                      }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* hairline + the centred strip */}
        <div style={{ borderTop: `1px solid ${HAIRLINE}`, marginTop: 56, padding: "30px 0 44px" }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: HEADING,
              textAlign: "center",
            }}
          >
            Built in Tashkent · engprogress.com
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 15,
              color: QUIET,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            © 2026 EngProgress. All rights reserved.
          </div>
          {LEGAL_ENTITY ? (
            <div
              style={{
                fontFamily: SANS,
                fontSize: 13,
                color: HEADING,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              {LEGAL_ENTITY}
            </div>
          ) : null}
          <div
            style={{
              fontFamily: SANS,
              fontSize: 13,
              lineHeight: 1.6,
              color: HEADING,
              textAlign: "center",
              margin: "10px auto 0",
              maxWidth: 720,
            }}
          >
            Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge
            Assessment English. All practice content is original and AI-generated.
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Hover states an inline style cannot express. Injected by whoever renders the
 *  footer, so a page that uses it outside the design chrome still gets them. */
export const FOOTER_CSS = `
  .ft-link{transition:color .15s}
  .ft-link:hover{color:#fff}
  .ft-disc{transition:border-color .15s,color .15s}
  .ft-disc:hover{border-color:${BRAND};color:#fff}
`;
