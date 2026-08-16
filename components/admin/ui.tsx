import type React from "react";

/**
 * The platform console's visual kit.
 *
 * A port of the Super Admin design: cream ground, white cards with a hairline,
 * serif headings, indigo accent. It stops at the page area on purpose — the
 * app's own rail stays, the way the center console redesign was scoped, so a
 * super admin moves between surfaces without the furniture moving under them.
 *
 * These primitives exist because the design repeats about eight shapes across
 * seven screens (a KPI, a card, a table row, a status pill, a bar). Writing
 * those inline seven times is how the fourth screen quietly drifts two pixels
 * and one grey away from the first.
 *
 * Server components — no state, no handlers. Anything interactive composes
 * these from its own client component.
 */

export const INK = "#16162E";
export const BODY = "#2A2D34";
export const MUTED = "#6E6C87";
export const SOFT = "#7C7A93";
export const FAINT = "#93919F";
export const LINE = "#E7E5DF";
/** The two lighter rules: card-internal divider, then row divider. */
export const RULE = "#F0EEE9";
export const ROW_RULE = "#F5F4F0";
export const INDIGO = "#4340CB";
export const NAVY = "#14133A";
export const CREAM = "#F4F3EF";
export const HEAD_BG = "#FAFAF8";

/** The design's own two faces, loaded for this route group in the admin layout.
 *  Newsreader/Hanken were tried first and were visibly not the same page. */
export const SERIF = "var(--font-source-serif), Georgia, serif";
export const SANS = "var(--font-work-sans), system-ui, sans-serif";

export type Tone = "indigo" | "green" | "amber" | "red" | "neutral";

/** tint / ink pairs, straight from the design. */
export const TONE: Record<Tone, { tint: string; ink: string; border: string }> = {
  indigo: { tint: "#EEEDF8", ink: INDIGO, border: "#C9C7E4" },
  green: { tint: "#EAF4EE", ink: "#16794C", border: "#C4E0CF" },
  amber: { tint: "#FDF4E7", ink: "#B8791F", border: "#EBD3A8" },
  red: { tint: "#FBEDEB", ink: "#C2453A", border: "#EABCB6" },
  neutral: { tint: "#F1F0EB", ink: MUTED, border: LINE },
};

/**
 * Badge tints, which are NOT the pill tints above.
 *
 * A pill is a word on a wash and reads fine at 11px; an avatar badge is two
 * letters that have to carry across a table, and the pill wash left them barely
 * visible — the owner spotted it on the Centers list. These are the design's
 * own badge pairs, a step darker on both sides.
 */
export const BADGE: Record<Tone, { tint: string; ink: string }> = {
  indigo: { tint: "#DEDDF6", ink: "#3B38B0" },
  green: { tint: "#E7F1EA", ink: "#16794C" },
  amber: { tint: "#FBEEE0", ink: "#A9721F" },
  red: { tint: "#F7E4E2", ink: "#A63A30" },
  neutral: { tint: "#E4EDF7", ink: "#2F5D8C" },
};

/* ─────────────────────────── page frame ─────────────────────────── */

/**
 * The cream page area. The shell supplies the ground; this owns the inset.
 *
 * Also where the design's body face is applied, so it reaches every admin page
 * without touching the rail — which keeps the app's own type, by the owner's
 * decision.
 */
export function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px 28px 70px", fontFamily: SANS, color: INK }}>{children}</div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 11.5,
            letterSpacing: ".1em",
            fontWeight: 600,
            color: INDIGO,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 32,
            fontWeight: 700,
            margin: "6px 0 4px",
            letterSpacing: "-.01em",
            color: INK,
            textWrap: "balance",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p style={{ margin: 0, fontSize: 13.5, color: MUTED, maxWidth: "78ch" }}>{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────── cards ─────────────────────────── */

export function Card({
  children,
  pad = false,
  style,
}: {
  children: React.ReactNode;
  /** Cards holding rows keep padding at the row; cards holding prose take it here. */
  pad?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        overflow: "hidden",
        ...(pad ? { padding: 18 } : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  note,
  right,
  badge,
}: {
  title: string;
  note?: React.ReactNode;
  right?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: note ? "flex-start" : "center",
        gap: 10,
        padding: "15px 18px",
        borderBottom: `1px solid ${RULE}`,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, margin: 0, color: INK }}>
            {title}
          </h2>
          {badge}
        </div>
        {note ? (
          <div style={{ fontSize: 12, color: FAINT, marginTop: 3, maxWidth: "72ch" }}>{note}</div>
        ) : null}
      </div>
      {right ? <div style={{ marginLeft: "auto" }}>{right}</div> : null}
    </div>
  );
}

/* ─────────────────────────── KPIs ─────────────────────────── */

export function KpiRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <div
      className="ad-kpis"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 12,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  delta,
  deltaTone = "neutral",
  accent,
  dot,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: string;
  deltaTone?: Tone;
  /** The left rule the Centers and Moderation screens use. */
  accent?: string;
  /** A status dot before the label, as System health does. */
  dot?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: "14px 15px",
        ...(accent ? { borderLeft: `3px solid ${accent}` } : null),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {dot ? (
          <span
            style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flex: "none" }}
          />
        ) : null}
        <span style={{ fontSize: 11.5, color: MUTED, minWidth: 0 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.02em", color: INK }}>
        {value}
      </div>
      {delta || sub ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {delta ? (
            <span style={{ fontSize: 11.5, fontWeight: 600, color: TONE[deltaTone].ink }}>
              {delta}
            </span>
          ) : null}
          {sub ? <span style={{ fontSize: 11.5, color: FAINT }}>{sub}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────── bits ─────────────────────────── */

export function Pill({
  children,
  tone = "neutral",
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  title?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      title={title}
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        borderRadius: 20,
        padding: "3px 9px",
        background: t.tint,
        color: t.ink,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** The square glyph tile that opens a row in the design. */
export function Glyph({
  children,
  tone = "indigo",
  size = 32,
  round = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: number;
  round?: boolean;
}) {
  const t = BADGE[tone];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: round ? "50%" : 9,
        flex: "none",
        display: "grid",
        placeItems: "center",
        fontSize: size < 32 ? 11.5 : 12,
        fontWeight: 700,
        background: t.tint,
        color: t.ink,
      }}
    >
      {children}
    </span>
  );
}

export function Bar({
  width,
  fill,
  height = 8,
  track = "#F1F0EB",
}: {
  /** Already a percentage string — the caller owns the maths. */
  width: string;
  fill: string;
  height?: number;
  track?: string;
}) {
  return (
    <div style={{ height, background: track, borderRadius: 6, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", borderRadius: 6, background: fill, width }} />
    </div>
  );
}

/* ─────────────────────────── tables ─────────────────────────── */

/**
 * The design's tables are CSS grids, not <table> — every screen states its own
 * column template and the header and rows share it. Passing that template
 * through one prop is what keeps a header from drifting out of line with the
 * body it labels, which is the classic way these break.
 */
export function TableHead({ cols, children }: { cols: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        columnGap: 12,
        padding: "10px 18px",
        background: HEAD_BG,
        borderBottom: `1px solid ${RULE}`,
        fontSize: 11,
        letterSpacing: ".07em",
        color: "#8B8999",
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

export function TableRow({
  cols,
  children,
  href,
}: {
  cols: string;
  children: React.ReactNode;
  href?: string;
}) {
  const style: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: cols,
    columnGap: 12,
    alignItems: "center",
    padding: "13px 18px",
    borderBottom: `1px solid ${ROW_RULE}`,
    fontSize: 13,
    color: INK,
    textDecoration: "none",
  };
  if (href) {
    return (
      <a className="ad-row" href={href} style={style}>
        {children}
      </a>
    );
  }
  return (
    <div className="ad-row" style={style}>
      {children}
    </div>
  );
}

/** Name over a quieter second line — the first cell of almost every table. */
export function Identity({
  glyph,
  name,
  meta,
  tone = "indigo",
  round = false,
}: {
  glyph: string;
  name: React.ReactNode;
  meta?: React.ReactNode;
  tone?: Tone;
  round?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
      <Glyph tone={tone} round={round}>
        {glyph}
      </Glyph>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, ...clip }}>{name}</div>
        {meta ? <div style={{ fontSize: 11.5, color: FAINT, ...clip }}>{meta}</div> : null}
      </div>
    </div>
  );
}

export const clip: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/* ─────────────────────────── empty / honest states ─────────────────────────── */

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "30px 18px", textAlign: "center", fontSize: 13.5, color: MUTED }}>
      {children}
    </div>
  );
}

/**
 * For a panel whose data genuinely is not collected yet.
 *
 * Deliberately not a chart of zeroes and not a plausible-looking placeholder.
 * On a console the owner uses to make decisions, an invented number is worse
 * than a blank: it gets believed. This says what is missing and what would have
 * to happen for it to appear.
 */
export function NotTracked({ what, how }: { what: string; how: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "16px 18px",
        background: HEAD_BG,
        borderRadius: 10,
        margin: 18,
      }}
    >
      <Glyph tone="neutral" size={28}>
        ?
      </Glyph>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{what}</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>{how}</div>
      </div>
    </div>
  );
}

/** A callout band — the Center detail screen's idle warning. */
export function Notice({
  tone,
  title,
  detail,
  action,
}: {
  tone: Tone;
  title: string;
  detail: React.ReactNode;
  action?: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: t.tint,
        border: `1px solid ${t.border}`,
        borderRadius: 14,
        padding: "15px 18px",
        marginBottom: 16,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "rgba(255,255,255,.6)",
          color: t.ink,
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          flex: "none",
        }}
      >
        !
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: t.ink }}>{title}</div>
        <div style={{ fontSize: 12.5, color: t.ink, opacity: 0.85, marginTop: 3, lineHeight: 1.5 }}>
          {detail}
        </div>
      </div>
      {action}
    </div>
  );
}

/** Two-column split, the proportions the design uses. */
export function Split({
  ratio = "1fr 1fr",
  children,
}: {
  ratio?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="ad-split"
      style={{ display: "grid", gridTemplateColumns: ratio, gap: 16, marginBottom: 16 }}
    >
      {children}
    </div>
  );
}
