"use client";

import Link from "next/link";
import { SiInstagram, SiTelegram, SiWhatsapp } from "react-icons/si";

import { useT } from "@/shared/components/i18n/locale-provider";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";
import type { MessageKey } from "@/lib/i18n";

import { BRAND_FILL, DISPLAY, FOOTER_GROUND as GROUND, SANS, WHITE } from "../_lib/design";

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
 *
 * ⚠️ A CLIENT COMPONENT, and only so it can be translated. It dresses every
 * marketing route, all of which are STATIC — a server component there cannot
 * read the locale cookie without making the page dynamic, which is the one
 * thing those pages must not become. The locale arrives through the provider
 * instead. Nothing here needs the browser otherwise.
 *
 * The email, the phone number and `engprogress.com` are not translated. They
 * are addresses, and an address in three spellings is three wrong addresses.
 */

/* ── contact, as supplied by the owner ─────────────────────────────────────── */

/** One inbox and one number for the whole site — `lib/contact.ts` holds them,
 *  because the address used to be spelled out here and in five other files. */
const PHONE = CONTACT_PHONE;

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

const COLUMNS: { heading: MessageKey; links: { label: MessageKey; href: string }[] }[] = [
  {
    heading: "mk.footPractice",
    links: [
      // Trimmed to two on the owner's instruction: the four per-skill pages all
      // sit behind /ielts-practice, and CEFR now points at its tab in the guide
      // rather than at a second marketing page. The tab hash is read by
      // `DocsTabs`, so this link opens CEFR directly instead of Overview.
      { label: "mk.footIelts", href: "/ielts-practice" },
      { label: "mk.footCefr", href: "/how-to-use#cefr-multilevel" },
    ],
  },
  {
    heading: "mk.footPlatform",
    links: [
      { label: "mk.footHowTo", href: "/how-to-use" },
      { label: "mk.footCenterGuide", href: "/how-to-use/education-centers" },
      { label: "mk.footCambridge", href: "/how-to-use#cambridge-style" },
      { label: "mk.footGrader", href: "/grade" },
      { label: "mk.footDemo", href: "/demo" },
      { label: "mk.footPricing", href: "/#pricing" },
    ],
  },
  {
    heading: "mk.footCompany",
    links: [
      // The two competitor comparisons and the Cambridge marketing page were
      // deleted, not just unlinked — the Cambridge content moved into the guide.
      { label: "mk.footForCenters", href: "/for-education-centers" },
      { label: "mk.footContact", href: "/contact" },
    ],
  },
  {
    heading: "mk.footLegal",
    links: [
      { label: "mk.footSignIn", href: "/sign-in" },
      // Account creation is a dialog on /sign-in now — there is no /sign-up
      // page. (/start is dead too: it redirects unconditionally to /sign-in.)
      { label: "mk.footCreate", href: "/sign-in" },
      { label: "mk.footPrivacy", href: "/privacy" },
      { label: "mk.footTerms", href: "/terms" },
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
  const t = useT();

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
            query can, so the breakpoints live in FOOTER_CSS — `footer-css.ts`,
            not this file; see the note there for why it cannot live here. */}
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
              {t("mk.footTagline")}
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
            <nav key={col.heading} aria-label={t(col.heading)}>
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
                {t(col.heading)}
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
                      {t(l.label)}
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
            {t("mk.footBuilt")}
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
            {t("mk.footRights")}
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
            {t("mk.footDisclaimer")}
          </div>
        </div>
      </div>
    </footer>
  );
}
