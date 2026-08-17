import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * The center console's design kit ("Center Admin CRM").
 *
 * Deliberately NOT `page-ui.tsx`. That kit is shared with the platform
 * super-admin pages (`app/admin/*`) and two learner pages, which stay on the
 * emerald Option A brand — retuning it in place would have dragged this
 * cream/indigo look into screens nobody asked to change. Two kits, one per
 * audience, is the honest split.
 *
 * Everything here is a server component: presentation only, no hooks, no client
 * bundle. Hover/focus states live in `.cn-*` rules in globals.css, because an
 * inline style can't express `:hover`.
 */

/* ── type ─────────────────────────────────────────────────────────────────── */
export const SANS = "var(--font-work), system-ui, sans-serif";
export const SERIF = "var(--font-serif4), Georgia, serif";

/* ── palette ──────────────────────────────────────────────────────────────── */
/*
 * MEASURED, NOT EYEBALLED — and the old values were measurably wrong.
 *
 * They were picked for calm and went past it. The row divider was #F5F4F0:
 * 1.10:1 against white and 1.01:1 against the page ground — a line nobody can
 * see, drawn under every row of every table in the product. The card edge sat
 * at 1.26:1. The caption colour failed WCAG AA outright at 3.09:1, where text
 * below 18pt needs 4.5:1.
 *
 * Each replacement was solved for a contrast target rather than nudged until it
 * looked right, keeping its hue by scaling the channels together — these are
 * warm greys and they should stay warm. The comments carry the ratio so the
 * next person can see what a change costs.
 *
 * The text ladder is now compressed, which is the deliberate trade: SOFT and
 * FAINT sit close to MUTED because AA does not care about our tonal hierarchy.
 * Size and weight carry that hierarchy instead, which is most of what they were
 * doing anyway.
 *
 * 39 files declare their own copies of these constants, so the values here are
 * the canonical ones but not the only ones — a change has to be applied across
 * the console, not just here.
 */
export const CANVAS = "#F4F3EF"; // page ground
export const INK = "#16162E"; // primary text             17.7:1
export const MUTED = "#6E6C87"; // secondary text           5.1:1
export const SOFT = "#737189"; // tertiary text             4.7:1  (was 4.15)
export const FAINT = "#777581"; // captions                 4.5:1  (was 3.09 — failed AA)
export const BODY = "#4C4A63"; // table body text           8.5:1
export const LINE = "#C5C4BE"; // card border              1.75:1 (was 1.26)
export const RULE = "#D4D3CE"; // header divider in a card  1.50:1 (was 1.16)
export const HAIR = "#DEDEDA"; // row divider              1.35:1 (was 1.10 — invisible)
export const HEADBG = "#FAFAF8"; // table header / input fill
/* Form-control border. Deliberately darker than the card hairline (#C5C4BE):
   a card edge only has to separate two surfaces, but a field edge has to say
   "you can type here", and at the card's weight it disappeared on white. */
export const FIELD_LINE = "#CFCABC";

export const INDIGO = "#4340CB";
export const GREEN = "#16794C";
export const AMBER = "#B8791F";
export const RED = "#C2453A";
export const RED_DEEP = "#A63A30";

/** Rail (the dark sidebar). */
export const RAIL = {
  bg: "#14133A",
  panel: "#1D1C4C",
  border: "#2A2963",
  rule: "#24234F",
  text: "#C9C7E4",
  muted: "#7C7AA8",
  faint: "#55538A",
  light: "#A8A6D0",
  gold: "#E5A85C",
  mint: "#7FD8A8",
};

/** Tinted backgrounds, paired with the ink that reads on them. */
export const TINT = {
  indigo: { bg: "#EEEDF8", fg: INDIGO },
  green: { bg: "#EAF4EE", fg: GREEN },
  amber: { bg: "#FBEEE0", fg: "#A9721F" },
  red: { bg: "#FBEAE8", fg: RED_DEEP },
  neutral: { bg: "#F1F0EB", fg: MUTED },
};

export type Tone = keyof typeof TINT;

/** Avatar tints, cycled by name so a person keeps the same colour everywhere. */
const AVATARS: [string, string][] = [
  ["#DEDDF6", "#3B38B0"],
  ["#E7F1EA", "#16794C"],
  ["#FBEEE0", "#A9721F"],
  ["#F7E4E2", "#A63A30"],
  ["#E4EDF7", "#2F5D8C"],
  ["#EFE7F5", "#6B44A2"],
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── shared shapes ────────────────────────────────────────────────────────── */
export const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 14,
};

const headingStyle: React.CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 700,
  letterSpacing: "-.01em",
  color: INK,
  margin: 0,
};

/* ── page head ────────────────────────────────────────────────────────────── */

/**
 * Eyebrow + serif title + one explanatory line, actions opposite. The eyebrow is
 * the design's way of saying which part of the console you're in, so it reads as
 * a section label rather than a repeat of the nav.
 */
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
    <div className="cn-pagehead" style={{ marginBottom: 20 }}>
      {back ? (
        <Link
          href={back.href}
          className="cn-back"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: SANS,
            fontSize: 13,
            color: MUTED,
            textDecoration: "none",
            marginBottom: 10,
          }}
        >
          <ArrowLeft size={14} /> {back.label}
        </Link>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          {media}
          <div style={{ minWidth: 0 }}>
            {eyebrow ? (
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11.5,
                  letterSpacing: ".1em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: INDIGO,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <h1
              style={{
                ...headingStyle,
                fontSize: "clamp(24px,2.7vw,31px)",
                lineHeight: 1.1,
                margin: eyebrow ? "6px 0 4px" : "0 0 4px",
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: MUTED, margin: 0 }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: "none" }}>{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ── KPI strip ────────────────────────────────────────────────────────────── */

/** The strip of small stat tiles under a page head. */
export function KpiRow({ children, min = 168 }: { children: React.ReactNode; min?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Label, big number, optional delta beside it and a caption under it.
 *
 * `href` turns the tile into the filter for the list below — a number you can
 * click is a number you can check — and `active` rings the one now filtering.
 */
export function Kpi({
  label,
  value,
  delta,
  deltaTone = "good",
  sub,
  href,
  active = false,
}: {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: "good" | "bad" | "flat";
  sub?: React.ReactNode;
  href?: string;
  active?: boolean;
}) {
  const deltaColor = deltaTone === "good" ? GREEN : deltaTone === "bad" ? RED : FAINT;
  const body = (
    <>
      <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-.02em",
            lineHeight: 1.05,
            fontVariantNumeric: "tabular-nums",
            color: INK,
          }}
        >
          {value}
        </div>
        {delta ? (
          <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: deltaColor }}>
            {delta}
          </div>
        ) : null}
      </div>
      {sub ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT, marginTop: 6 }}>{sub}</div>
      ) : null}
    </>
  );

  const style: React.CSSProperties = {
    ...cardStyle,
    borderRadius: 12,
    padding: "14px 16px",
    ...(active ? { borderColor: INDIGO, boxShadow: `0 0 0 1px ${INDIGO}` } : null),
  };

  if (!href) return <div style={style}>{body}</div>;
  return (
    <Link
      href={href}
      className="cn-kpi"
      style={{ ...style, display: "block", textDecoration: "none" }}
    >
      {body}
    </Link>
  );
}

/* ── cards ────────────────────────────────────────────────────────────────── */

/**
 * The console's only container. `flush` drops the padding for cards whose body
 * is a table or a divided list — those run edge to edge.
 */
export function Card({
  children,
  flush = false,
  tone = "plain",
  style,
  id,
}: {
  children: React.ReactNode;
  flush?: boolean;
  tone?: "plain" | "dark";
  style?: React.CSSProperties;
  /** Anchor target, so a page-head action can jump to the card it opens. */
  id?: string;
}) {
  return (
    <section
      id={id}
      style={{
        ...cardStyle,
        ...(tone === "dark" ? { background: RAIL.bg, border: "none", color: "#fff" } : null),
        ...(flush ? { overflow: "hidden" } : { padding: 18 }),
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/** Card header: serif title, optional muted note beside it, actions on the right. */
export function CardHead({
  title,
  note,
  badge,
  actions,
  /** Set on a `flush` Card so the header keeps its own padding and rule. */
  divided = false,
}: {
  title: string;
  note?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  divided?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        flexWrap: "wrap",
        ...(divided
          ? { padding: "16px 18px 13px", borderBottom: `1px solid ${RULE}` }
          : { marginBottom: 14 }),
      }}
    >
      <h2 style={{ ...headingStyle, fontSize: 17 }}>{title}</h2>
      {badge}
      {note ? <span style={{ fontFamily: SANS, fontSize: 12.5, color: SOFT }}>{note}</span> : null}
      {actions ? (
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>{actions}</div>
      ) : null}
    </div>
  );
}

/** Explanatory line under a CardHead. */
export function CardNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5, color: SOFT, margin: "0 0 16px" }}
    >
      {children}
    </p>
  );
}

/** Vertical stack, the spacing between cards on a page. */
export function Stack({ children, gap = 16 }: { children: React.ReactNode; gap?: number }) {
  return <div style={{ display: "flex", flexDirection: "column", gap }}>{children}</div>;
}

/** Two-column layout that collapses on narrow screens (CSS in globals). */
export function Split({
  children,
  ratio = "1.15fr .85fr",
}: {
  children: React.ReactNode;
  ratio?: string;
}) {
  return (
    <div className="cn-split" style={{ display: "grid", gridTemplateColumns: ratio, gap: 16 }}>
      {children}
    </div>
  );
}

/* ── tables ───────────────────────────────────────────────────────────────── */

/**
 * The design's tables are CSS grids, not <table>s, so every row shares one
 * column template and cells can hold bars and avatars without table-layout
 * fighting them. `cols` is that template; head and rows must be given the same
 * one. Wrapped in an overflow container with a min-width so narrow screens
 * scroll the table instead of crushing it.
 */
/**
 * `minWidth` defaults to 0 — no artificial floor.
 *
 * It used to default to 720 and most callers passed 760–900, which meant the
 * table refused to shrink below that and the wrapper grew a horizontal
 * scrollbar on screens where the columns would have fitted perfectly well. The
 * wrapper still scrolls when content genuinely cannot fit (fixed-width columns
 * on a narrow phone), so nothing is ever clipped — the bar just stops appearing
 * when there is nothing to scroll.
 */
export function Table({
  cols,
  minWidth = 0,
  gridded = false,
  children,
}: {
  cols: string;
  minWidth?: number;
  /**
   * Rule every column as well as every row — the ledger treatment.
   *
   * OFF EVERYWHERE ELSE, ON PURPOSE. A roster or a marking queue is a list of
   * people you scan down; column rules chop it into boxes and make the scan
   * harder. A transaction table is the opposite: you read ACROSS a row to check
   * that a date, a category, an account and an amount belong together, and then
   * down a single column to add it up. Ruling the columns is what makes both
   * readings possible, which is why every accounting package ever written does
   * it and no CRM contact list does.
   */
  gridded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="cn-noscrollbar" style={{ overflowX: "auto" }}>
      <div
        className={gridded ? "cn-table cn-table--grid" : "cn-table"}
        style={{ minWidth: minWidth || undefined }}
        data-cols={cols}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * `align` mirrors the `align` you give the body cells, per column.
 *
 * Without it a right-aligned amount sat under a left-aligned heading, so the
 * word "AMOUNT" floated at the far left of a column whose numbers hugged the
 * right — the two looked like different columns. A heading has to sit over its
 * own values.
 */
export function THead({
  cols,
  labels,
  align,
}: {
  cols: string;
  labels: React.ReactNode[];
  align?: (("right" | "left") | undefined)[];
}) {
  return (
    <div
      className="cn-thead"
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: 12,
        padding: "11px 18px",
        background: HEADBG,
        borderBottom: `1px solid ${RULE}`,
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: ".07em",
        color: "#8B8999",
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {labels.map((l, i) => (
        <div key={i} style={{ textAlign: align?.[i], minWidth: 0 }}>
          {l}
        </div>
      ))}
    </div>
  );
}

/** One row. Pass `href` to make the whole row a link (the design's row-click). */
export function TRow({
  cols,
  href,
  children,
}: {
  cols: string;
  href?: string;
  children: React.ReactNode;
}) {
  const style: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: cols,
    gap: 12,
    alignItems: "center",
    padding: "12px 18px",
    borderBottom: `1px solid ${HAIR}`,
    fontFamily: SANS,
    fontSize: 13,
    color: INK,
    textDecoration: "none",
  };
  if (!href)
    return (
      <div className="cn-row" style={style}>
        {children}
      </div>
    );
  return (
    <Link href={href} className="cn-row" style={style}>
      {children}
    </Link>
  );
}

/** Muted body cell. */
export function TD({
  children,
  tone = "body",
  weight,
  align,
}: {
  children: React.ReactNode;
  tone?: "ink" | "body" | "soft" | "faint";
  weight?: 500 | 600;
  align?: "right";
}) {
  const color = { ink: INK, body: BODY, soft: SOFT, faint: FAINT }[tone];
  return (
    <div
      style={{
        color,
        fontWeight: weight,
        textAlign: align,
        fontVariantNumeric: "tabular-nums",
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

/** Name + secondary line with an avatar, the first cell of most tables. */
export function PersonCell({
  name,
  meta,
  photoUrl,
  size = 30,
}: {
  name: string;
  meta?: React.ReactNode;
  photoUrl?: string | null;
  size?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Avatar name={name} url={photoUrl} size={size} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 500,
            color: INK,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        {meta ? (
          <div
            style={{
              fontSize: 11.5,
              color: FAINT,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Empty state inside a flush Card. */
/**
 * Nothing here yet — and the one thing that would change that.
 *
 * The `action` is not decoration. "Nothing graded yet" is a dead end that leaves
 * the reader to work out whose job it is and where they'd go; "Nothing graded
 * yet — set the first practice →" is the same sentence with the way out
 * attached. Every empty state in the console takes one, and the few that
 * genuinely have no action (a filter that matched nothing) say so instead.
 */
export function Empty({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 13, color: FAINT, padding: "18px" }}>
      {children}
      {action ? (
        <>
          {" "}
          <Link
            href={action.href}
            style={{ color: INDIGO, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            {action.label}
          </Link>
        </>
      ) : null}
    </div>
  );
}

/**
 * A band, and what it rests on. Never one without the other.
 *
 * R3 of the restructure: `1.0` printed alone in a table cell is noise dressed
 * as a measurement, and a center owner who quotes it to a parent finds out the
 * hard way that it came from one essay. Under three attempts the number greys
 * and says `provisional` — still visible, because hiding it is its own kind of
 * lie, but impossible to mistake for a finding.
 *
 * Structurally typed on purpose: `SkillFigure` lives in a server-only module,
 * and this has to render in both worlds.
 */
export function BandCell({
  figure,
  unit = "attempts",
}: {
  figure: { band: number | null; attempts: number; provisional: boolean };
  unit?: string;
}) {
  if (figure.band == null) {
    return <span style={{ color: FAINT, fontWeight: 400 }}>not measured</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ color: figure.provisional ? MUTED : INK }}>{figure.band.toFixed(1)}</span>
      <span style={{ fontSize: 11, fontWeight: 400, color: FAINT, whiteSpace: "nowrap" }}>
        {figure.attempts} {figure.attempts === 1 ? unit.replace(/s$/, "") : unit}
        {figure.provisional ? " · provisional" : ""}
      </span>
    </span>
  );
}

/* ── list rows (the non-tabular card body) ────────────────────────────────── */

/** Divided row inside a flush Card — icon/badge, text, trailing element. */
export function ListRow({
  lead,
  title,
  meta,
  trail,
  href,
}: {
  lead?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trail?: React.ReactNode;
  href?: string;
}) {
  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: "13px 18px",
    borderBottom: `1px solid ${HAIR}`,
    fontFamily: SANS,
    textDecoration: "none",
    color: "inherit",
  };
  const body = (
    <>
      {lead}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>{title}</div>
        {meta ? <div style={{ fontSize: 12, color: SOFT, marginTop: 2 }}>{meta}</div> : null}
      </div>
      {trail ? <div style={{ flex: "none" }}>{trail}</div> : null}
    </>
  );
  if (!href)
    return (
      <div className="cn-row" style={style}>
        {body}
      </div>
    );
  return (
    <Link href={href} className="cn-row" style={style}>
      {body}
    </Link>
  );
}

/** Square badge used as a ListRow `lead` — the design's "W"/"R"/"L" kind chip. */
export function KindBadge({
  children,
  tone = "indigo",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const { bg, fg } = TINT[tone];
  return (
    <div
      style={{
        width: 32,
        height: 32,
        flex: "0 0 32px",
        borderRadius: 8,
        background: bg,
        color: fg,
        fontFamily: SANS,
        fontSize: 10.5,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

/* ── small parts ──────────────────────────────────────────────────────────── */

/** Status pill. */
export function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const { bg, fg } = TINT[tone];
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color: fg,
        borderRadius: 20,
        padding: "3px 9px",
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** Horizontal progress bar. */
export function Bar({
  pct,
  fill = INDIGO,
  width,
  height = 6,
}: {
  /** 0–100. Clamped, so a bad input can't overflow the track. */
  pct: number;
  fill?: string;
  width?: number;
  height?: number;
}) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <span
      style={{
        display: "inline-block",
        width: width ?? "100%",
        flex: width ? "none" : 1,
        height,
        background: "#F1F0EB",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <span style={{ display: "block", width: `${w}%`, height: "100%", background: fill }} />
    </span>
  );
}

/** Label · bar · value line — "Average by skill", "Band by skill". */
export function MeterRow({
  label,
  pct,
  value,
  trail,
  fill = INDIGO,
  labelWidth = 74,
}: {
  label: React.ReactNode;
  pct: number;
  value?: React.ReactNode;
  trail?: React.ReactNode;
  fill?: string;
  labelWidth?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
      <div
        style={{
          width: labelWidth,
          flex: `0 0 ${labelWidth}px`,
          fontFamily: SANS,
          fontSize: 12.5,
          color: BODY,
        }}
      >
        {label}
      </div>
      <Bar pct={pct} fill={fill} height={8} />
      {value != null ? (
        <div
          style={{
            width: 34,
            textAlign: "right",
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 600,
            color: INK,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
      ) : null}
      {trail ? <div style={{ flex: "none", fontFamily: SANS, fontSize: 11.5 }}>{trail}</div> : null}
    </div>
  );
}

/** Column chart — the "Bands awarded" / "Average band" block. */
export function Columns({
  bars,
  height = 170,
}: {
  bars: { label: string; cap?: React.ReactNode; pct: number; fill?: string }[];
  height?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        height,
        marginTop: 18,
        paddingBottom: 4,
      }}
    >
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 7,
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          {b.cap != null ? (
            <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: INK }}>
              {b.cap}
            </div>
          ) : null}
          <div
            style={{
              width: "100%",
              borderRadius: "6px 6px 3px 3px",
              background: b.fill ?? INDIGO,
              // A real zero still needs to be visible as a zero, hence the 2px floor.
              height: `${Math.max(2, Math.min(100, b.pct))}%`,
            }}
          />
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11.5,
              color: FAINT,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Avatar: the person's photo if they have one, otherwise tinted initials. */
export function Avatar({
  name,
  url,
  size = 32,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  const [bg, fg] = AVATARS[hash(name) % AVATARS.length];
  const base: React.CSSProperties = {
    width: size,
    height: size,
    flex: `0 0 ${size}px`,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };
  if (url) {
    return (
      // Signed, short-lived Supabase URL — next/image would try to optimize a URL
      // that has expired by the time it's fetched, so this stays a plain <img>.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" style={{ ...base, objectFit: "cover" }} />
    );
  }
  return (
    <span
      aria-hidden
      style={{
        ...base,
        background: bg,
        color: fg,
        fontFamily: SANS,
        fontSize: Math.round(size * 0.36),
        fontWeight: 600,
      }}
    >
      {initials(name)}
    </span>
  );
}

/* ── buttons and links ────────────────────────────────────────────────────── */

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  borderRadius: 8,
  padding: "9px 14px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: "nowrap",
  textDecoration: "none",
  cursor: "pointer",
  flex: "none",
};

export function buttonStyle(
  variant: "primary" | "green" | "ghost" = "primary",
): React.CSSProperties {
  if (variant === "primary") return { ...btnBase, background: INDIGO, color: "#fff", border: 0 };
  if (variant === "green") return { ...btnBase, background: GREEN, color: "#fff", border: 0 };
  return {
    ...btnBase,
    background: "#fff",
    color: INK,
    border: `1px solid #C5C4BE`,
    fontWeight: 500,
  };
}

export function BtnLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: "primary" | "green" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`cn-btn cn-btn--${variant}`} style={buttonStyle(variant)}>
      {children}
    </Link>
  );
}

/** Small bordered action at the end of a row — the design's alert CTA. */
export function ChipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="cn-chip"
      style={{
        display: "inline-block",
        background: CANVAS,
        border: `1px solid #C5C4BE`,
        borderRadius: 7,
        padding: "6px 11px",
        fontFamily: SANS,
        fontSize: 12,
        color: INK,
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}

/** Quiet indigo text link — row actions, "Export CSV", "Attendance →". */
export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="cn-link"
      style={{
        fontFamily: SANS,
        fontSize: 12.5,
        color: INDIGO,
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}

/* ── tabs ─────────────────────────────────────────────────────────────────── */

/** Underlined tab strip (group detail). Tabs are links, so each is a real URL. */
export function Tabs({ tabs }: { tabs: { href: string; label: string; active: boolean }[] }) {
  return (
    <div
      className="cn-noscrollbar"
      style={{
        display: "flex",
        gap: 4,
        borderBottom: `1px solid #C5C4BE`,
        marginBottom: 16,
        overflowX: "auto",
      }}
    >
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="cn-tab"
          style={{
            borderBottom: `2px solid ${t.active ? INDIGO : "transparent"}`,
            color: t.active ? INDIGO : MUTED,
            padding: "10px 14px",
            fontFamily: SANS,
            fontSize: 13.5,
            fontWeight: 500,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

/** Pill-shaped filter chips (the groups page). */
export function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="cn-chip"
      style={{
        borderRadius: 20,
        padding: "7px 14px",
        fontFamily: SANS,
        fontSize: 12.5,
        textDecoration: "none",
        whiteSpace: "nowrap",
        border: `1px solid ${active ? INDIGO : "#C5C4BE"}`,
        background: active ? INDIGO : "#fff",
        color: active ? "#fff" : BODY,
      }}
    >
      {children}
    </Link>
  );
}

/** Toolbar strip at the top of a flush Card — search, filters, export. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "14px 18px",
        borderBottom: `1px solid ${RULE}`,
      }}
    >
      {children}
    </div>
  );
}

/** Input/select styling shared by the toolbars and slide-over forms. */
export const fieldStyle: React.CSSProperties = {
  border: `1px solid ${FIELD_LINE}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontFamily: SANS,
  fontSize: 13,
  color: INK,
  background: HEADBG,
};
