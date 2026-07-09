/**
 * Shared typographic primitives for the legal pages (privacy / terms) — numbered
 * sections, paragraphs and lists in the brand look, so both documents read
 * identically. Server-safe (no "use client").
 */

const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1A2138";
const BODY = "#3A3F58";
const MUTED = "#5A6076";

export function LegalTitle({ title, updated }: { title: string; updated: string }) {
  return (
    <header style={{ marginBottom: 34 }}>
      <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: "clamp(30px,4.5vw,40px)", fontWeight: 600, letterSpacing: "-.015em", lineHeight: 1.15, color: INK }}>
        {title}
      </h1>
      <p style={{ margin: "12px 0 0", fontSize: 14, fontWeight: 600, color: MUTED }}>Last updated: {updated}</p>
    </header>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 22, fontWeight: 600, letterSpacing: "-.01em", color: INK }}>
        {n}. {title}
      </h2>
      <div style={{ marginTop: 10 }}>{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.7, color: BODY }}>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ margin: "0 0 12px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 7 }}>
      {children}
    </ul>
  );
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li style={{ fontSize: 15, lineHeight: 1.65, color: BODY }}>{children}</li>;
}

export function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK, fontWeight: 700 }}>{children}</strong>;
}
