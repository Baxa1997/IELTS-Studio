import { BODY, DISPLAY, GREY, INK, SANS } from "@/app/_landing/design";

/**
 * Shared typographic primitives for Privacy and Terms, so both documents read
 * identically.
 *
 * Built to the reference the owner supplied: a large, tight display title; a
 * quiet "last updated" line under it; bold numbered section headings with real
 * air above them; and body text at a comfortable 17px on a 1.75 leading, set to
 * a narrow measure. Server-safe (no "use client").
 *
 * These replaced a Newsreader-serif set on a cream ground — the last of the old
 * brand anywhere on a public page.
 */

export function LegalTitle({ title, updated }: { title: string; updated: string }) {
  return (
    <header style={{ marginBottom: 8 }}>
      <h1
        style={{
          margin: 0,
          fontFamily: DISPLAY,
          fontSize: "clamp(34px,5vw,48px)",
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.06,
          color: INK,
        }}
      >
        {title}
      </h1>
      <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 15, color: GREY }}>
        Last updated: {updated}
      </p>
    </header>
  );
}

export function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        style={{
          margin: "clamp(40px,5vw,58px) 0 0",
          fontFamily: DISPLAY,
          fontSize: "clamp(22px,2.6vw,27px)",
          fontWeight: 700,
          letterSpacing: "-0.022em",
          lineHeight: 1.2,
          color: INK,
        }}
      >
        {n}. {title}
      </h2>
      <div style={{ marginTop: 20 }}>{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 18px", fontSize: 17, lineHeight: 1.75, color: BODY }}>{children}</p>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        margin: "0 0 18px",
        paddingLeft: 22,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {children}
    </ul>
  );
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li style={{ fontSize: 17, lineHeight: 1.72, color: BODY }}>{children}</li>;
}

export function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: INK, fontWeight: 700 }}>{children}</strong>;
}
