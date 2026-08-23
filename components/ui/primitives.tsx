/**
 * The shared primitive kit.
 *
 * Every component here replaces something the codebase had already written
 * several times over: five local `Card`s, seven pill/chip/tag variants, three
 * `Avatar`s, two `Modal`s, two `StatCard`s, a scattering of section labels and
 * dividers and empty states. They are the same idea each time, drawn slightly
 * differently, because there was nowhere to put the shared one.
 *
 * Two rules kept these usable as drop-in replacements for the inline-styled
 * screens they're replacing:
 *
 *   1. Colour comes from `lib/theme/tokens` — never a literal here either.
 *   2. Everything takes a `style` prop that is spread LAST, so a screen with a
 *      genuine reason to differ can still differ, visibly, in one line, instead
 *      of forking the whole component.
 *
 * These are server components: presentation only, no hooks, no client bundle.
 * The interactive ones — `Modal`, `Spinner`'s host — live in `./interactive`.
 * `:hover` and `:focus` states live in globals.css against the `.ui-*` classes,
 * because an inline style cannot express them.
 *
 * The console has its own richer kit in `components/console/crm-ui.tsx` (tables,
 * KPI rows, meters). It now reads its palette from the same tokens; use it for
 * staff screens and this one for learner screens.
 */

import type { CSSProperties, ReactNode } from "react";

import {
  cardStyle,
  FAINT,
  HAIR,
  INK,
  LINE,
  MUTED,
  SANS,
  TINT,
  type Tone,
} from "@/lib/theme/tokens";

/* ── surfaces ──────────────────────────────────────────────────────────────── */

export function Card({
  children,
  pad = 18,
  style,
  className,
}: {
  children: ReactNode;
  /** Inner padding. `0` for a card that hosts its own header/table rows. */
  pad?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={className} style={{ ...cardStyle, padding: pad, ...style }}>
      {children}
    </div>
  );
}

/** A card's header strip: title on the left, whatever you pass on the right. */
export function CardHead({
  title,
  note,
  right,
  style,
}: {
  title: ReactNode;
  note?: ReactNode;
  right?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
        padding: "14px 18px",
        borderBottom: `1px solid ${HAIR}`,
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 650, color: INK }}>{title}</div>
        {note ? (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, marginTop: 2 }}>{note}</div>
        ) : null}
      </div>
      {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

/* ── labels & structure ────────────────────────────────────────────────────── */

/**
 * The small uppercase caption above a group of cards. Written independently in
 * the listening hub, the CEFR hub and four console pages, at four different
 * sizes and two different letter-spacings.
 */
export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: FAINT,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Divider({ style }: { style?: CSSProperties }) {
  return <hr style={{ border: 0, borderTop: `1px solid ${HAIR}`, margin: 0, ...style }} />;
}

/** Vertical rhythm without per-element margins — the gap does the spacing. */
export function Stack({
  children,
  gap = 16,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: CSSProperties;
}) {
  return <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>;
}

/** The responsive card grid every hub re-declares. `min` is the point a column
 *  is allowed to stop shrinking, so this collapses on a phone without a media
 *  query — which matters, because inline styles cannot carry one. */
export function Grid({
  children,
  min = 260,
  gap = 14,
  style,
}: {
  children: ReactNode;
  min?: number;
  gap?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── status ────────────────────────────────────────────────────────────────── */

/**
 * The tinted pill. This replaces `Pill` (4 files), `Chip` (3), `Tag`, `KindBadge`
 * and `LevelChip` — all the same rounded tinted label, none of them agreeing on
 * radius or padding.
 *
 * `tone` picks a background/foreground PAIR from the token set; the pairs are
 * what carry the contrast, so there is deliberately no way to set one without
 * the other.
 */
export function Badge({
  children,
  tone = "neutral",
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: CSSProperties;
}) {
  const { bg, fg } = TINT[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: bg,
        color: fg,
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 650,
        lineHeight: 1.35,
        padding: "3px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** A single figure with its label. Replaces the two local `StatCard`s and the
 *  half-dozen ad-hoc "big number over a caption" blocks. `tabular-nums` so a row
 *  of these lines up. */
export function Stat({
  value,
  label,
  note,
  tone,
  style,
}: {
  value: ReactNode;
  label: ReactNode;
  note?: ReactNode;
  /** Colours the figure only — the label stays neutral. */
  tone?: Tone;
  style?: CSSProperties;
}) {
  return (
    <div style={{ fontFamily: SANS, ...style }}>
      <div
        style={{
          fontSize: 26,
          fontWeight: 680,
          letterSpacing: "-.02em",
          fontVariantNumeric: "tabular-nums",
          color: tone ? TINT[tone].fg : INK,
          lineHeight: 1.15,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>{label}</div>
      {note ? <div style={{ fontSize: 11.5, color: FAINT, marginTop: 2 }}>{note}</div> : null}
    </div>
  );
}

/** The dashed "nothing here yet" block. */
export function Empty({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 13.5,
        color: MUTED,
        textAlign: "center",
        border: `1px dashed ${LINE}`,
        borderRadius: 12,
        padding: "28px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── people ────────────────────────────────────────────────────────────────── */

/** Initials from a display name, ASCII-safe and never more than two letters. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** The initials bubble. Three files drew this; none agreed on the font size
 *  relative to the circle, so it is derived here instead of passed in. */
export function Avatar({
  name,
  size = 32,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        background: TINT.indigo.bg,
        color: TINT.indigo.fg,
        fontFamily: SANS,
        fontSize: Math.round(size * 0.4),
        fontWeight: 700,
        letterSpacing: ".01em",
        ...style,
      }}
    >
      {initials(name)}
    </span>
  );
}
