import Link from "next/link";

import {
  BODY,
  BRAND,
  BRAND_TINT,
  cardStyle,
  DISPLAY,
  eyebrow,
  FAINT,
  ghostButton,
  INK,
  LINE,
  MUTED,
  RADIUS,
  SANS,
  solidButton,
  STRONG,
  WELL,
} from "@/app/_landing/design";

/**
 * The pieces both documentation pages are built from — `/how-to-use` (learners)
 * and `/how-to-use/education-centers` (centres).
 *
 * Split because the two audiences want opposite things. A learner needs "how do
 * I get a band and act on it"; a centre needs "how do I run teachers, groups,
 * money and Telegram". One page trying to serve both buried each half.
 */

/** A destination whose article has not been written. Rendered as marked text
 *  rather than a link that goes nowhere. */
export const PENDING = null;

export interface DocLink {
  label: string;
  href: string | null;
  /** Renders a SOON pill — the capability itself does not exist yet. */
  soon?: boolean;
}

export interface DocGroup {
  group: string;
  items: DocLink[];
}

export interface DocSection {
  icon: string;
  title: string;
  links: DocLink[];
}

export interface DocStep {
  n: string;
  title: string;
  body: string;
}

/* ── sidebar ───────────────────────────────────────────────────────────────── */

export function Sidebar({ groups, current }: { groups: DocGroup[]; current: string }) {
  return (
    <aside style={{ flex: "0 1 250px", minWidth: 220, padding: "52px 0 80px" }}>
      {groups.map((g, gi) => (
        <div key={g.group} style={{ marginTop: gi === 0 ? 0 : 34 }}>
          <div style={eyebrow()}>{g.group}</div>
          <div
            style={{
              borderLeft: `1px solid ${LINE}`,
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {g.items.map((it) => {
              const base: React.CSSProperties = {
                padding: "9px 18px",
                fontSize: 15,
                textDecoration: "none",
              };
              if (it.label === current) {
                return (
                  <span
                    key={it.label}
                    aria-current="page"
                    style={{
                      ...base,
                      fontWeight: 700,
                      color: BRAND,
                      borderLeft: `2px solid ${BRAND}`,
                      marginLeft: -1,
                    }}
                  >
                    {it.label}
                  </span>
                );
              }
              if (!it.href) {
                return (
                  <span
                    key={it.label}
                    style={{ ...base, color: FAINT, display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {it.label}
                    <Pill>{it.soon ? "SOON" : "WRITING"}</Pill>
                  </span>
                );
              }
              return (
                <Link key={it.label} href={it.href} className="lp-doclink" style={{ ...base, color: BODY }}>
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: "#f4f5f7",
        color: MUTED,
        borderRadius: RADIUS.pill,
        padding: "3px 9px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* ── page head ─────────────────────────────────────────────────────────────── */

export function DocsHead({ kicker, title, lede }: { kicker: string; title: string; lede: string }) {
  return (
    <>
      <div style={eyebrow(true)}>{kicker}</div>
      <h1
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: "clamp(34px,5vw,52px)",
          letterSpacing: "-0.035em",
          margin: "16px 0 0",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 19,
          lineHeight: 1.6,
          color: BODY,
          maxWidth: 660,
          margin: "20px 0 0",
          textWrap: "pretty",
        }}
      >
        {lede}
      </p>
    </>
  );
}

/* ── section cards ─────────────────────────────────────────────────────────── */

export function SectionCards({ sections }: { sections: DocSection[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
        gap: 22,
        marginTop: 20,
      }}
    >
      {sections.map((s) => (
        <div key={s.title} className="lp-card" style={cardStyle()}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              aria-hidden
              style={{
                width: 38,
                height: 38,
                borderRadius: RADIUS.icon,
                background: BRAND_TINT,
                color: BRAND,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              {s.icon}
            </span>
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, margin: 0 }}>
              {s.title}
            </h2>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 20,
              fontSize: 16,
              color: STRONG,
            }}
          >
            {s.links.map((l) =>
              l.href ? (
                <Link
                  key={l.label}
                  href={l.href}
                  className="lp-doclink"
                  style={{ color: STRONG, display: "flex", gap: 10, textDecoration: "none" }}
                >
                  <span aria-hidden style={{ color: BRAND }}>
                    →
                  </span>
                  {l.label}
                </Link>
              ) : (
                <span
                  key={l.label}
                  style={{ color: FAINT, display: "flex", gap: 10, alignItems: "center" }}
                >
                  <span aria-hidden style={{ color: FAINT }}>
                    →
                  </span>
                  {l.label}
                  {l.soon ? <Pill>SOON</Pill> : null}
                </span>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── numbered steps ────────────────────────────────────────────────────────── */

export function Steps({ steps }: { steps: DocStep[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
        gap: 22,
        marginTop: 20,
      }}
    >
      {steps.map((s) => (
        <div key={s.n} style={cardStyle(26)}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: BRAND }}>
            {s.n}
          </div>
          <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, margin: "10px 0 8px" }}>
            {s.title}
          </h3>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: BODY, margin: 0 }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ── the band that sends a reader to the other guide ───────────────────────── */

export function CrossLink({
  kicker,
  title,
  body,
  cta,
  href,
}: {
  kicker: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div
      style={{
        ...cardStyle(30),
        background: WELL,
        marginTop: 54,
        display: "flex",
        flexWrap: "wrap",
        gap: 22,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ maxWidth: 620 }}>
        <div style={{ ...eyebrow(true), color: BRAND }}>{kicker}</div>
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "-0.02em",
            margin: "10px 0 0",
            color: INK,
            textWrap: "pretty",
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: BODY, margin: "10px 0 0" }}>{body}</p>
      </div>
      <Link
        href={href}
        className="lp-solid"
        style={{ ...solidButton(), display: "inline-block", whiteSpace: "nowrap" }}
      >
        {cta}
      </Link>
    </div>
  );
}

/** Outlined variant, for the secondary route out of a page. */
export function GhostLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="lp-ghost" style={{ ...ghostButton(), display: "inline-block" }}>
      {label}
    </Link>
  );
}

export const DOCS_SANS = SANS;
