import Image from "next/image";
import Link from "next/link";

import { SignUpButton } from "@/app/_landing/_components/sign-up-dialog";
import {
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  DISPLAY_LG,
  DISPLAY_XL,
  FAINT,
  HERO_A,
  HERO_B,
  HERO_MID,
  INK,
  LEDE,
  MUTED,
  PANEL,
  RADIUS,
  SANS,
  WHITE,
  eyebrow,
  solidButton,
} from "@/app/_landing/_lib/design";
import { localePath, type Locale } from "@/lib/i18n/locales";

import { fill, type FaqItem, type HeroCopy, type ToolChrome } from "../_lib/copy";
import type { Photo } from "../_lib/page-meta";

export function ToolHero({
  hero,
  chrome,
  locale,
  photo,
}: {
  hero: HeroCopy;
  chrome: ToolChrome;
  locale: Locale;
  photo: Photo;
}) {
  return (
    <section className="tl-shell">
      <div className="tl-hero">
        <div>
          <nav aria-label={chrome.breadcrumb} className="tl-crumbs">
            <Link href={localePath("/", locale)}>{chrome.home}</Link>
            <span aria-hidden>›</span>
            <span style={{ color: INK }}>{hero.title}</span>
          </nav>
          <div
            style={{
              display: "inline-flex",
              marginTop: 22,
              padding: "7px 14px",
              borderRadius: RADIUS.pill,
              background: BRAND_TINT,
              border: `1px solid ${BRAND_TINT_LINE}`,
              color: BRAND,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {hero.eyebrow}
          </div>
          <h1 style={{ ...DISPLAY_XL, color: INK, margin: "16px 0 0" }}>{hero.title}</h1>
          <p style={{ ...LEDE, margin: "18px 0 0", maxWidth: 620 }}>{hero.lede}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
            {hero.chips.map((c) => (
              <span key={c} className="tl-chip">
                {c}
              </span>
            ))}
          </div>
        </div>

        <figure style={{ margin: 0 }}>
          <div className="tl-photo">
            <Image
              src={photo.src}
              alt={hero.photoAlt}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 560px"
            />
            {/* A sample result over the photo: what the tool hands back, shown
                before anyone has typed a number. Decorative — the real result
                is the calculator's, below. */}
            <div className="tl-badge" aria-hidden>
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundImage: `linear-gradient(140deg,${HERO_B},${HERO_MID} 55%,${HERO_A})`,
                  color: WHITE,
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 22,
                }}
              >
                {hero.badgeValue}
              </div>
              <div style={{ fontFamily: SANS }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
                  {hero.badgeLabel}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginTop: 2 }}>{hero.badgeNote}</div>
              </div>
            </div>
          </div>
          <figcaption style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, marginTop: 10 }}>
            {fill(chrome.photoCredit, { name: photo.credit })}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function SectionHead({ kicker, title, hint, id }: { kicker: string; title: string; hint?: string; id?: string }) {
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={eyebrow(true)}>{kicker}</div>
      <h2 id={id} style={{ ...DISPLAY_LG, color: INK, margin: "14px 0 0" }}>
        {title}
      </h2>
      {hint ? <p style={{ ...LEDE, fontSize: 17, margin: "12px 0 0" }}>{hint}</p> : null}
    </div>
  );
}

/** The questions, visible — and the same list feeds the FAQPage JSON-LD, so
 *  the structured data can never say something the page does not. */
export function ToolFaq({ chrome, faq }: { chrome: ToolChrome; faq: FaqItem[] }) {
  return (
    <section className="tl-shell tl-section">
      <SectionHead kicker={chrome.faqEyebrow} title={chrome.faqTitle} />
      <div className="tl-faq" style={{ marginTop: 26 }}>
        {faq.map((f, i) => (
          <details key={f.q} open={i === 0}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Where a calculator's visitor goes next: the free checker, today's free
 *  practice, or an account. */
export function ToolCta({
  chrome,
  practice,
}: {
  chrome: ToolChrome;
  practice: { label: string; href: string }[];
}) {
  return (
    <section className="tl-shell tl-section">
      <div style={eyebrow(true)}>{chrome.ctaEyebrow}</div>
      <div className="tl-cta" style={{ marginTop: 16 }}>
        <div
          className="tl-on-dark"
          style={{
            borderRadius: 26,
            padding: "clamp(24px,3.4vw,34px)",
            backgroundImage: `linear-gradient(155deg,${HERO_B} 0%,${HERO_MID} 52%,${HERO_A} 100%)`,
          }}
        >
          <div className="tl-card-title">{chrome.ctaWritingTitle}</div>
          <p className="tl-body">{chrome.ctaWritingBody}</p>
          <Link
            href="/grade"
            style={{
              display: "inline-block",
              marginTop: 20,
              background: PANEL,
              color: BRAND,
              borderRadius: RADIUS.pill,
              padding: "13px 24px",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            {chrome.ctaWritingButton} →
          </Link>
        </div>

        <div className="tl-card">
          <div className="tl-card-title">{chrome.ctaPracticeTitle}</div>
          <p className="tl-body">{chrome.ctaPracticeBody}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
            {practice.map((p) => (
              <Link key={p.href} href={p.href} className="tl-use" style={{ textDecoration: "none" }}>
                {p.label} →
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 14px", marginTop: 22 }}>
            <SignUpButton label={chrome.ctaAccount} className="tl-solid" style={solidButton("md")} />
            <span style={{ fontFamily: SANS, fontSize: 14, color: MUTED }}>{chrome.ctaAccountNote}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ToolCross({
  chrome,
  cross,
  href,
  photo,
  photoAlt,
}: {
  chrome: ToolChrome;
  cross: { title: string; body: string; cta: string };
  href: string;
  photo: Photo;
  photoAlt: string;
}) {
  return (
    <section className="tl-shell tl-section">
      <div className="tl-card tl-cross">
        <div className="tl-thumb">
          <Image src={photo.src} alt={photoAlt} fill sizes="180px" />
        </div>
        <div>
          <div style={eyebrow(true)}>{chrome.crossEyebrow}</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 22, color: INK, marginTop: 8 }}>{cross.title}</div>
          <p className="tl-body" style={{ marginTop: 8 }}>
            {cross.body}
          </p>
          <Link href={href} className="tl-link" style={{ display: "inline-block", marginTop: 12, fontFamily: SANS, fontSize: 16 }}>
            {cross.cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ToolDisclaimer({ chrome }: { chrome: ToolChrome }) {
  return (
    <div className="tl-shell" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.6, color: FAINT, margin: 0, maxWidth: 860 }}>{chrome.disclaimer}</p>
    </div>
  );
}
