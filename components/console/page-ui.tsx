import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Branded page furniture for the organization console.
 *
 * The console used to be plain Tailwind while the learner app used the Option A
 * brand — same product, two looks. These are the dashboard's own tokens
 * (Newsreader headings, #ECEAF2 hairlines, 16px cards) as a handful of shared
 * pieces, so a console page differs from a learner page in its MENU and its
 * content, not in its typography.
 *
 * Server components: presentation only, no hooks, no client bundle.
 */

export const SANS = "var(--font-hanken), system-ui, sans-serif";
export const SERIF = "var(--font-newsreader), Georgia, serif";
export const INDIGO = "#3B43B5";
export const INK = "#1A2138";
export const MUTED = "#5A6076";
export const FAINT = "#8A8FA0";
export const LINE = "#ECEAF2";
export const TINT = "#F4F4FE";

export const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 16,
  padding: 18,
};

/** Page title block, with an optional back link and right-hand actions. */
export function PageHead({
  back,
  eyebrow,
  title,
  subtitle,
  actions,
  media,
}: {
  back?: { href: string; label: string };
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Optional leading element, e.g. a student photo. */
  media?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      {back ? (
        <Link
          href={back.href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: SANS,
            fontSize: 13.5,
            fontWeight: 600,
            color: MUTED,
            textDecoration: "none",
            marginBottom: 10,
          }}
        >
          <ArrowLeft size={15} /> {back.label}
        </Link>
      ) : null}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
          {media}
          <div style={{ minWidth: 0 }}>
            {eyebrow ? (
              <div
                style={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 11.5,
                  letterSpacing: ".07em",
                  textTransform: "uppercase",
                  color: INDIGO,
                  marginBottom: 5,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: "clamp(24px,2.6vw,31px)",
                lineHeight: 1.12,
                letterSpacing: "-.015em",
                color: INK,
                margin: 0,
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55, color: MUTED, margin: "7px 0 0" }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div style={{ flex: "none" }}>{actions}</div> : null}
      </div>
    </div>
  );
}

/** A titled card. The console's only container. */
export function Panel({
  title,
  description,
  actions,
  tone = "plain",
  children,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** "flag" tints the panel for something needing attention. */
  tone?: "plain" | "flag";
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        ...cardStyle,
        ...(tone === "flag" ? { borderColor: "#E4C98A", background: "#FFFCF4" } : null),
        marginBottom: 16,
      }}
    >
      {title ? (
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: description ? 4 : 14,
          }}
        >
          <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, color: INK, margin: 0 }}>
            {title}
          </h2>
          {actions ? <div style={{ flex: "none" }}>{actions}</div> : null}
        </header>
      ) : null}
      {description ? (
        <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, color: MUTED, margin: "0 0 14px" }}>
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Big number + caption, for the stat strips.
 *
 * Pass `href` and the tile becomes the filter for the list below it — the fix
 * for a number nobody trusts is letting them click it and count the rows.
 * `active` rings the tile that is currently filtering.
 */
export function StatTile({
  value,
  label,
  tone = "ink",
  href,
  active = false,
}: {
  value: React.ReactNode;
  label: string;
  tone?: "ink" | "indigo";
  href?: string;
  active?: boolean;
}) {
  const body = (
    <>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 27,
          lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums",
          color: tone === "indigo" ? INDIGO : INK,
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, marginTop: 5 }}>{label}</div>
    </>
  );

  const style: React.CSSProperties = {
    ...cardStyle,
    ...(active ? { borderColor: INDIGO, boxShadow: `0 0 0 1px ${INDIGO}` } : null),
  };

  if (!href) return <div style={style}>{body}</div>;
  return (
    <Link href={href} style={{ ...style, display: "block", textDecoration: "none" }}>
      {body}
    </Link>
  );
}

/** Responsive strip of stat tiles. */
export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

/** Hairline-divided list, the console's main content shape. */
export function List({ children }: { children: React.ReactNode }) {
  return <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>{children}</ul>;
}

export function Row({
  children,
  first = false,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        padding: "11px 0",
        borderTop: first ? "none" : `1px solid ${LINE}`,
        fontFamily: SANS,
        fontSize: 14.5,
        color: INK,
      }}
    >
      {children}
    </li>
  );
}

/** Primary line of a row, with an optional muted second line. */
export function RowText({ title, meta }: { title: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <span style={{ minWidth: 0 }}>
      <span style={{ display: "block", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </span>
      {meta ? (
        <span style={{ display: "block", fontSize: 12.5, color: FAINT, marginTop: 2 }}>{meta}</span>
      ) : null}
    </span>
  );
}

/** Empty-state line inside a List. */
export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ fontFamily: SANS, fontSize: 14, color: FAINT, padding: "11px 0" }}>{children}</li>
  );
}

/** Small status pill. */
export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "indigo";
}) {
  const palette = {
    neutral: { bg: "#F2F1F7", fg: MUTED },
    good: { bg: "#E7F7EE", fg: "#15803d" },
    warn: { bg: "#FDF3E3", fg: "#B9791A" },
    bad: { bg: "#FDECEC", fg: "#b91c1c" },
    indigo: { bg: TINT, fg: INDIGO },
  }[tone];
  return (
    <span
      style={{
        display: "inline-block",
        background: palette.bg,
        color: palette.fg,
        borderRadius: 999,
        padding: "2px 9px",
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** Indigo text link used for row actions ("Report", "Open"). */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        flex: "none",
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 13.5,
        color: INDIGO,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

/** Filled indigo action, matching the learner app's primary button. */
export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        background: INDIGO,
        color: "#fff",
        borderRadius: 11,
        padding: "9px 15px",
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 14,
        textDecoration: "none",
        boxShadow: "0 10px 20px -12px rgba(59,67,181,.75)",
      }}
    >
      {children}
    </Link>
  );
}
