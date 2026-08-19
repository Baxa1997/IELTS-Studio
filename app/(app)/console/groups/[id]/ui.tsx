import Link from "next/link";

import { SANS, SERIF } from "@/components/console/crm-ui";

/* ── the group page's own surface ───────────────────────────────────────────
 *
 * These are the "Group Page CRM v2" tokens, kept HERE rather than pushed into
 * `crm-ui` on purpose: that kit is shared by every console screen, and moving
 * its radii and greys would restyle a dozen pages nobody has looked at. When v2
 * is rolled out console-wide this file is what moves up.
 *
 * TWO GREYS ARE DARKER THAN THE DESIGN FILE. Its caption grey (#8b91a0) is
 * 3.15:1 on white — below AA for the 13px it is used at, and this codebase has
 * already been through one contrast pass (see the ratios recorded in crm-ui).
 * So the design's own #6f7788 becomes the caption tier at 4.5:1, and a darker
 * #5f6878 (5.6:1) takes over the secondary tier above it. Same hue family, same
 * two-step hierarchy, both legible.
 */
export const V2 = {
  ink: "#16203a",
  body: "#545c70",
  muted: "#5f6878",
  faint: "#6f7788",
  line: "#e6e4da",
  hair: "#f2f0e6",
  rule: "#edebe1",
  field: "#e2e0d6",
  fill: "#fdfdfb",
  wash: "#faf9f5",
  indigo: "#4f46e5",
  indigoInk: "#3730a3",
  indigoWash: "#f4f3ff",
  indigoTint: "#eeecff",
  green: "#1f6b45",
  greenWash: "#eaf5ee",
  amber: "#9a5b16",
  amberWash: "#fdf1e3",
  red: "#a13a2c",
  redWash: "#fdeceb",
  dark: "#1b2340",
} as const;

export const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${V2.line}`,
  borderRadius: 18,
};

export const serifHead: React.CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 700,
  fontSize: 22,
  lineHeight: 1.2,
  color: V2.ink,
  margin: 0,
};

const noteStyle: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.55,
  color: V2.faint,
  margin: 0,
};

/** A white card with a serif heading, one line of explanation and an optional
 *  control opposite the title. */
export function SectionCard({
  title,
  note,
  aside,
  children,
  pad = 22,
}: {
  title: string;
  note?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
  pad?: number;
}) {
  return (
    <section style={{ ...card, padding: `20px ${pad}px ${pad}px` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h3 style={serifHead}>{title}</h3>
        {aside ? <div style={{ marginLeft: "auto" }}>{aside}</div> : null}
      </div>
      {note ? <p style={{ ...noteStyle, marginTop: 6 }}>{note}</p> : null}
      {children ? <div style={{ marginTop: note || aside ? 16 : 14 }}>{children}</div> : null}
    </section>
  );
}

/** One of the pipeline tiles over the practice board. A link, not a button:
 *  the filter it applies lives in the URL, so a teacher can bookmark "what is
 *  overdue in this class" and send it to somebody. */
export function PipeTile({
  href,
  label,
  value,
  note,
  active = false,
}: {
  href: string;
  label: string;
  value: React.ReactNode;
  note: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className="cn-pipe"
      style={{
        ...card,
        borderColor: active ? "#b9b4f0" : V2.line,
        background: active ? "#fbfbfd" : "#fff",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        textDecoration: "none",
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: 13, color: V2.muted }}>{label}</span>
      <span
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 28,
          lineHeight: 1.1,
          color: V2.ink,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span style={{ fontFamily: SANS, fontSize: 12, color: V2.faint }}>{note}</span>
    </Link>
  );
}

/** A round filter chip. Same reasoning as PipeTile — it is a link. */
export function FilterPill({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className="cn-pill"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "9px 15px",
        borderRadius: 999,
        border: `1px solid ${active ? "#b9b4f0" : V2.field}`,
        background: active ? V2.indigoWash : "#fff",
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 600,
        color: active ? V2.indigoInk : V2.muted,
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {active ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: V2.indigo,
            display: "inline-block",
            marginRight: 7,
          }}
        />
      ) : null}
      {label}
    </Link>
  );
}

const TONE = {
  open: { bg: V2.indigoWash, fg: V2.indigoInk },
  overdue: { bg: V2.redWash, fg: V2.red },
  done: { bg: V2.greenWash, fg: V2.green },
  idle: { bg: "#f4f3ee", fg: V2.muted },
} as const;
export type Tone = keyof typeof TONE;

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 11px",
        borderRadius: 999,
        fontFamily: SANS,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: t.bg,
        color: t.fg,
      }}
    >
      {children}
    </span>
  );
}

const SKILL = {
  writing: { bg: V2.indigoTint, fg: V2.indigoInk, label: "W" },
  reading: { bg: "#e7f1fb", fg: "#215d8f", label: "R" },
  listening: { bg: V2.greenWash, fg: V2.green, label: "L" },
  lesson: { bg: V2.amberWash, fg: V2.amber, label: "Le" },
} as const;

export function SkillChip({ kind }: { kind: keyof typeof SKILL }) {
  const s = SKILL[kind];
  return (
    <span
      style={{
        width: 30,
        height: 30,
        flex: "none",
        borderRadius: 10,
        background: s.bg,
        color: s.fg,
        display: "grid",
        placeItems: "center",
        fontFamily: SANS,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {s.label}
    </span>
  );
}

/** The thin progress rail under a submitted count. */
export function MiniBar({ pct }: { pct: number }) {
  return (
    <div
      style={{
        height: 5,
        borderRadius: 999,
        background: "#eeece2",
        marginTop: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 5,
          borderRadius: 999,
          background: pct >= 100 ? V2.green : V2.indigo,
          width: `${Math.max(0, Math.min(100, pct))}%`,
        }}
      />
    </div>
  );
}

/** Column headings for a board. `cols` is a grid-template-columns string. */
export function BoardHead({ cols, labels }: { cols: string; labels: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        alignItems: "center",
        gap: 12,
        padding: "13px 20px",
        borderBottom: `1px solid ${V2.rule}`,
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: ".07em",
        textTransform: "uppercase",
        color: V2.faint,
      }}
    >
      {labels.map((l, i) => (
        <span key={l} style={i === labels.length - 1 ? { textAlign: "right" } : undefined}>
          {l}
        </span>
      ))}
    </div>
  );
}

/** A board scrolls sideways rather than squashing its columns — six columns of
 *  numbers below about 900px is unreadable either way, and a squashed grid
 *  drags the whole page into a horizontal scroll instead of just the table. */
export function Board({ children, min = 880 }: { children: React.ReactNode; min?: number }) {
  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: min }}>{children}</div>
      </div>
    </div>
  );
}

/** One line of a readiness checklist: a tick or a warning, what it is, and the
 *  way to fix it when it is not done. */
export function CheckRow({
  ok,
  label,
  note,
  action,
}: {
  ok: boolean;
  label: string;
  note: string;
  action?: { href: string; label: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "12px 0",
        borderTop: `1px solid ${V2.hair}`,
      }}
    >
      <span style={{ flex: "none", color: ok ? "#1f8a4c" : "#c9862f", display: "block" }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          {ok ? <path d="m8.5 12.5 2.5 2.5 4.5-5" /> : <path d="M12 7.5v5.5M12 16.2v.3" />}
        </svg>
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: V2.ink }}>
          {label}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: V2.faint }}>{note}</div>
      </div>
      {action ? (
        <Link
          href={action.href}
          style={{
            marginLeft: "auto",
            flex: "none",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            color: V2.indigo,
            whiteSpace: "nowrap",
          }}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
