/**
 * Shared typographic + structural primitives for the SEO / marketing pages
 * (ielts-practice and the four skill pages) — same brand voice as the
 * legal pages plus comparison tables, FAQ with FAQPage JSON-LD, and CTA bands.
 * Server-safe (no "use client").
 */

import Link from "next/link";

import { postsForSkill, type BlogSkill } from "@/lib/blog";
import { loadPosts } from "@/lib/blog/store";
import { CONTACT_EMAIL } from "@/lib/contact";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";

import {
  BODY,
  BRAND,
  BRAND_TINT_LINE,
  DISPLAY,
  INK,
  LINE,
  MUTED,
  PANEL,
  WHITE,
} from "@/app/_landing/_lib/design";

const SERIF = DISPLAY;
const ACCENT = BRAND;

export function PageTitle({ title, lead }: { title: string; lead: string }) {
  return (
    <header style={{ marginBottom: 34 }}>
      <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: "clamp(30px,4.5vw,40px)", fontWeight: 600, letterSpacing: "-.015em", lineHeight: 1.15, color: INK }}>
        {title}
      </h1>
      <p style={{ margin: "14px 0 0", fontSize: 17, lineHeight: 1.65, color: MUTED }}>{lead}</p>
    </header>
  );
}

export function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: "-.01em", color: INK }}>{title}</h2>
      <div style={{ marginTop: 10 }}>{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 12px", fontSize: 15.5, lineHeight: 1.7, color: BODY }}>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul style={{ margin: "0 0 12px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 7 }}>{children}</ul>;
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li style={{ fontSize: 15.5, lineHeight: 1.65, color: BODY }}>{children}</li>;
}

export function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK, fontWeight: 700 }}>{children}</strong>;
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ color: ACCENT, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${BRAND_TINT_LINE}` }}>
      {children}
    </Link>
  );
}

/** Two-product comparison table; scrolls inside itself on narrow screens. */
export function CompareTable({
  left,
  right,
  rows,
}: {
  left: string;
  right: string;
  rows: { label: string; a: string; b: string }[];
}) {
  const cell: React.CSSProperties = { padding: "12px 14px", fontSize: 14.5, lineHeight: 1.55, color: BODY, verticalAlign: "top", borderTop: `1px solid ${LINE}` };
  return (
    <div style={{ overflowX: "auto", margin: "16px 0 8px", border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
        <thead>
          <tr>
            <th style={{ ...cell, borderTop: "none", width: "26%" }} />
            <th style={{ ...cell, borderTop: "none", fontWeight: 800, color: ACCENT, textAlign: "left" }}>{left}</th>
            <th style={{ ...cell, borderTop: "none", fontWeight: 800, color: INK, textAlign: "left" }}>{right}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td style={{ ...cell, fontWeight: 700, color: INK }}>{r.label}</td>
              <td style={cell}>{r.a}</td>
              <td style={cell}>{r.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** FAQ block that also emits FAQPage JSON-LD (answers must be plain text). */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
  return (
    <section style={{ marginBottom: 32 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: "-.01em", color: INK }}>Frequently asked questions</h2>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((it) => (
          <div key={it.q} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: INK }}>{it.q}</h3>
            <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.65, color: BODY }}>{it.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * The blog's articles on this page's skill — links from the marketing page to
 * the posts, which already link back through their call to action.
 *
 * WHY BOTH DIRECTIONS. These pages are older and already indexed; a new
 * article linked from one is found and ranked faster than one reachable only
 * from /blog, and a skill page that links to a topic's articles reads to a
 * search engine as the hub for that topic. Derived from each post's `skill`,
 * so publishing a reading article adds it here with no edit. Renders nothing
 * for a skill with no posts yet.
 */
export async function FromTheBlog({ skill }: { skill: BlogSkill }) {
  const posts = postsForSkill(await loadPosts(), skill);
  if (!posts.length) return null;
  const t = translator(SOURCE_LOCALE);
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: "-.01em", color: INK }}>{t("blog.eyebrow")}</h2>
      <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {posts.map((p) => (
          <li key={p.slug} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px" }}>
            <Link href={`/blog/${p.slug}`} style={{ fontSize: 16, fontWeight: 700, color: ACCENT, textDecoration: "none" }}>
              {p.title} →
            </Link>
            <p style={{ margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.6, color: BODY }}>{p.standfirst}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Cta({ title, sub }: { title: string; sub: string }) {
  return (
    <section
      style={{
        margin: "36px 0 8px",
        background: "#15162E",
        borderRadius: 16,
        padding: "26px 24px",
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: WHITE, lineHeight: 1.3 }}>{title}</div>
        <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55, color: "#b7b9da" }}>{sub}</div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link href="/sign-in" style={{ background: ACCENT, color: WHITE, fontWeight: 700, fontSize: 15, borderRadius: 999, padding: "12px 20px", textDecoration: "none", whiteSpace: "nowrap" }}>
          Start free
        </Link>
        <Link href="/#pricing" style={{ color: BRAND_TINT_LINE, fontWeight: 600, fontSize: 14.5, textDecoration: "none", whiteSpace: "nowrap" }}>
          See pricing →
        </Link>
      </div>
    </section>
  );
}

const RELATED = [
  { href: "/ielts-practice", label: "IELTS practice online" },
  { href: "/ielts-writing-practice", label: "IELTS Writing practice" },
  { href: "/ielts-reading-practice", label: "IELTS Reading practice" },
  { href: "/ielts-listening-practice", label: "IELTS Listening practice" },
  { href: "/ielts-speaking-practice", label: "IELTS Speaking practice" },
  { href: "/cefr-multilevel-practice", label: "CEFR / Multilevel (DTM)" },
  { href: "/for-education-centers", label: "For education centres" },
  { href: "/grade", label: "Free IELTS writing checker" },
];

/** Cross-links between the marketing pages (skips the page it renders on). */
export function Related({ current }: { current: string }) {
  const links = RELATED.filter((l) => l.href !== current);
  return (
    <nav style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${LINE}`, display: "flex", flexWrap: "wrap", gap: "10px 22px" }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: MUTED }}>More:</span>
      {links.map((l) => (
        <Link key={l.href} href={l.href} style={{ fontSize: 13.5, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Accuracy + trademark note for the comparison pages. */
export function FactsNote({ competitor, site }: { competitor: string; site: string }) {
  return (
    <p style={{ margin: "20px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "#9A9EAE" }}>
      Facts about {competitor} were checked on their public website ({site}) in July 2026 and may have
      changed since — tell us at {CONTACT_EMAIL} if anything is out of date and we will correct
      it. {competitor} is a trademark of its owner; EngProgress is not affiliated with or endorsed by{" "}
      {competitor}.
    </p>
  );
}
