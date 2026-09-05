import Link from "next/link";

import {
  BODY,
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
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
  /**
   * A contents entry that is deliberately NOT clickable: it names a section of
   * the page you are already on. Owner's call for the learner guide — Overview
   * is the only thing in the sidebar you can click; everything else below it is
   * a label telling you what is further down.
   */
  plain?: boolean;
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
                // The current entry keeps its marker but STAYS CLICKABLE — it
                // is the one thing in this sidebar you can click, and clicking
                // it returns you to the top of the page.
                const marked: React.CSSProperties = {
                  ...base,
                  fontWeight: 700,
                  color: BRAND,
                  borderLeft: `2px solid ${BRAND}`,
                  marginLeft: -1,
                };
                return it.href ? (
                  <Link key={it.label} href={it.href} aria-current="page" style={marked}>
                    {it.label}
                  </Link>
                ) : (
                  <span key={it.label} aria-current="page" style={marked}>
                    {it.label}
                  </span>
                );
              }
              if (it.plain) {
                return (
                  <span key={it.label} style={{ ...base, color: MUTED }}>
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

/* ── informational tabs ────────────────────────────────────────────────────── */

export interface InfoTab {
  icon: string;
  title: string;
  /** One line under the heading, describing the capability as a whole. */
  lede: string;
  /**
   * HOW A TASK IN THIS SKILL IS GENERATED — rendered as a tinted block at the
   * top of the panel. Written against the generator itself, not the pitch: the
   * reading paragraph describes `_resolve_target_band` in the engine, the
   * listening one describes the level-to-speaking-rate mapping in
   * `listening/tts.py`, and so on. If a generator changes, this is the copy
   * that goes stale first.
   */
  how?: string;
  /** What the platform actually does. Statements, not links. */
  points?: { title: string; body: string; soon?: boolean }[];
  /**
   * A fully custom panel body, used by the Overview tab (prose + the feature
   * list + the callout + the steps). Server-rendered and passed down as a
   * prop, so the tab strip stays the only client component on the page.
   */
  content?: React.ReactNode;
}

/* ── overview prose ────────────────────────────────────────────────────────── */

/**
 * The opening explanation. Diátaxis calls this quadrant *explanation* — writing
 * that gives a reader understanding rather than a set of steps — so it is prose
 * with room to breathe, not another grid of cards.
 */
export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div style={{ marginTop: 20, maxWidth: 720 }}>
      {paragraphs.map((t, i) => (
        <p
          key={t.slice(0, 32)}
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: BODY,
            margin: i === 0 ? 0 : "16px 0 0",
            textWrap: "pretty",
          }}
        >
          {t}
        </p>
      ))}
    </div>
  );
}

/* ── key features ──────────────────────────────────────────────────────────── */

export interface Feature {
  title: string;
  body: string;
  /** The capability does not exist yet. Say so rather than imply it. */
  soon?: boolean;
}

/** The scannable list a reader checks before reading a word of prose. */
export function FeatureList({ features }: { features: Feature[] }) {
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: "20px 0 0",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))",
        gap: "18px 34px",
      }}
    >
      {features.map((f) => (
        <li key={f.title} style={{ display: "flex", gap: 13 }}>
          <span
            aria-hidden
            style={{
              flex: "none",
              width: 22,
              height: 22,
              marginTop: 2,
              borderRadius: "50%",
              background: BRAND_TINT,
              color: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✓
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 16.5,
                color: INK,
              }}
            >
              {f.title}
              {f.soon ? <Pill>SOON</Pill> : null}
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: BODY, margin: "5px 0 0" }}>{f.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── the one idea the whole product rests on ───────────────────────────────── */

/** A single emphasised statement, used for the "nothing here is a fixed
 *  question bank" note that the rest of the page keeps referring back to. */
export function Callout({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 26,
        background: BRAND_TINT,
        border: `1px solid ${BRAND_TINT_LINE}`,
        borderRadius: 18,
        padding: "22px 26px",
      }}
    >
      <div style={{ ...eyebrow(true), color: BRAND }}>{kicker}</div>
      <p
        style={{
          fontSize: 16.5,
          lineHeight: 1.65,
          color: STRONG,
          margin: "10px 0 0",
          maxWidth: 700,
          textWrap: "pretty",
        }}
      >
        {children}
      </p>
    </div>
  );
}
