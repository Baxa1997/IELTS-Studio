import Link from "next/link";
import { SiInstagram, SiTelegram, SiWhatsapp } from "react-icons/si";

import { BRAND, BRAND_FILL, DISPLAY, FOOTER_GROUND as GROUND, SANS, WHITE } from "./design";

/**
 * The dark site footer.
 *
 * Pattern only, from the reference the owner supplied: a dark ground, a brand
 * block with a tagline and social discs on the left, link columns on the right,
 * a hairline, then a centred uppercase strip / copyright / fine print.
 *
 * The link columns were TRIMMED on the owner's instruction: the four per-skill
 * marketing pages collapsed into one "IELTS practice" entry, CEFR now points at
 * its tab in the guide, and the two competitor comparisons plus the Cambridge
 * page were deleted outright (the Cambridge content moved into the guide as a
 * tab). `PUBLIC_PATHS` in `lib/supabase/middleware.ts` is still the list to
 * check against — a public route with no link here ships with no route into it.
 *
 * ONE slot is still deliberately empty rather than invented — see LEGAL_ENTITY.
 */

/* ── contact, as supplied by the owner ─────────────────────────────────────── */

/** The same address the privacy policy already publishes, so there is one
 *  inbox rather than two. */
const CONTACT_EMAIL = "bahridnurullav@gmail.com";
/** One number for both calls and WhatsApp. */
const PHONE = "+998 97 711 68 12";

/* ── the one thing only the owner can supply ───────────────────────────────── */

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
const SOCIALS: {
  name: string;
  href: string | null;
  Icon: React.ComponentType<{ size?: number }>;
}[] = [
  { name: "Instagram", href: "https://instagram.com/engprogress", Icon: SiInstagram },
  { name: "WhatsApp", href: `https://wa.me/${PHONE.replace(/[^0-9]/g, "")}`, Icon: SiWhatsapp },
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
      // Trimmed to two on the owner's instruction: the four per-skill pages all
      // sit behind /ielts-practice, and CEFR now points at its tab in the guide
      // rather than at a second marketing page. The tab hash is read by
      // `DocsTabs`, so this link opens CEFR directly instead of Overview.
      { label: "IELTS practice", href: "/ielts-practice" },
      { label: "CEFR practice", href: "/how-to-use#cefr-multilevel" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "How to use", href: "/how-to-use" },
      { label: "Guide for centers", href: "/how-to-use/education-centers" },
      { label: "Cambridge-style practice", href: "/how-to-use#cambridge-style" },
      { label: "Free essay grader", href: "/grade" },
      { label: "Live demo", href: "/demo" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      // The two competitor comparisons and the Cambridge marketing page were
      // deleted, not just unlinked — the Cambridge content moved into the guide.
      { label: "For education centers", href: "/for-education-centers" },
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
/*
 * ⚠️ EVERY COLOUR HERE IS WHITE AT SOME ALPHA, AND THAT IS DELIBERATE. The
 * ground is `FOOTER_GROUND`, which is dark in BOTH themes, so white-on-it is
 * correct in both and needs no dark variant. Reaching for an ink token instead
 * is what broke this footer: `HEADING` was `MUTED`, which inverts, so in dark
 * the column headings went light — on a band that had also gone light, because
 * the ground was `INK`. Two tokens doing the opposite of their job.
 */

const LINK = "rgba(255,255,255,0.78)";
const QUIET = "rgba(255,255,255,0.62)";
const HAIRLINE = "rgba(255,255,255,0.10)";
const DISC = "rgba(255,255,255,0.16)";
/** Column headings and the fine print — the old `MUTED` (#8b919d) expressed as
 *  white-on-this-ground, which is the same colour and cannot invert. */
const HEADING = "rgba(255,255,255,0.55)";

export function SiteFooter() {
  const socials = SOCIALS.filter((s) => s.href);

  return (
    <footer style={{ background: GROUND, color: LINK }}>
      <div className="ft-inner" style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* THE COLUMNS ARE A CLASS, NOT AN INLINE STYLE, and they had to be: a
            grid track's MINIMUM is a floor, not a hint, so
            `minmax(260px,1.4fr) repeat(auto-fit,minmax(170px,1fr))` demands
            260 + 4x170 = 940px however narrow the screen gets, and the footer
            simply ran off the side of a phone. `auto-fit` collapses EMPTY
            tracks; it does not reduce a count that does not fit. Only a media
            query can, so the breakpoints live in FOOTER_CSS below. */}
        <div className="ft-grid">
          {/* brand block */}
          <div className="ft-brand">
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: BRAND_FILL,
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
                  fontSize: 22,
                  letterSpacing: "-0.02em",
                  color: WHITE,
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

            {/* Contact, in the brand column rather than buried in a link list —
                it is the thing a centre looks for before it applies. */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
                marginTop: 22,
                fontFamily: SANS,
                fontSize: 15,
              }}
            >
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="ft-link"
                style={{ color: LINK, textDecoration: "none" }}
              >
                {CONTACT_EMAIL}
              </a>
              <a
                href={`tel:${PHONE.replace(/[^+0-9]/g, "")}`}
                className="ft-link"
                style={{ color: LINK, textDecoration: "none" }}
              >
                {PHONE}
              </a>
              <a
                href={`https://wa.me/${PHONE.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ft-link"
                style={{ color: QUIET, textDecoration: "none" }}
              >
                WhatsApp · {PHONE}
              </a>
            </div>

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
        <div className="ft-strip" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
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
