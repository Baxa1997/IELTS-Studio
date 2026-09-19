/**
 * THE PRACTICE CARD — one card shared by the Reading, Writing and Listening hubs.
 *
 * Built 1:1 from the "Practice Cards" design canvas: its geometry (14px radius,
 * 15/16 padding, 12px gaps, the 28px sequence tile, 21px status pills, 34px pill
 * actions), its anatomy (head / body / footer) and its full set of states
 * (fresh · graded · in progress · target-only). The canvas's warm paper palette
 * is NOT carried over — the owner's call was "cards only, app palette", so every
 * colour here is the brand #7D0132 and the cool greys the rest of the hub
 * already paints with.
 *
 * ⚠️ THE CARD IS A CONTAINER, NOT ONE BIG BUTTON.
 * The three hubs used to make the whole surface a single <button> (or <Link>),
 * which is why each of them carried a `CardBox` that degraded to a plain <div>
 * the moment a teacher's Attach needed a second control — a button inside a
 * button is invalid markup. The canvas draws the actions as distinct pills in
 * the footer, and a graded card has TWO of them, so the card is a plain
 * container here and every action is a real control. That deletes all three
 * `CardBox` special cases, and a teacher's Attach becomes simply a third pill.
 *
 * ⚠️ THE SURFACE IS IN globals.css (`.pc-card`, `.pc-act`), NOT INLINE.
 * An inline `background` or `border` beats a stylesheet `:hover` whatever the
 * specificity, so a card would look perfect at rest and never light up under
 * the pointer. That trap is recorded in components/app-shell/nav-groups.test.ts
 * and re-guarded for this file in ./card.test.ts. Only genuinely dynamic values
 * (a locked card's opacity, a progress bar's width) are inline.
 */

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* Conditional class names are joined by code, never by string content: a
 * template literal like `${on ? " pc-x" : ""}` loses its leading space to
 * `prettier --write`, and the class silently welds onto its neighbour. It has
 * happened five times in this repo — see the note in
 * components/app-shell/sidebar-nav.tsx and the guard in nav-groups.test.ts. */
function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
/** Small-caps labels and running numbers. Loaded by app/(shell)/layout.tsx. */
const MONO = "var(--font-mono-data), ui-monospace, SFMono-Regular, monospace";

const BRAND = "#7D0132";
const INK = "#121317";
const MUTED = "#4A505C";
const DIM = "#8B919D";
const EMERALD = "#1C7A4F";
const AMBER = "#9A5B12";
const RULE = "rgba(28,27,46,.07)";

// ---- Shell -----------------------------------------------------------------

/** Which hover tint the card lifts with. `null` = it does not lift (locked, or
 *  a clone already in flight), which is how the card says "not right now". */
export type CardTone = "brand" | "done" | "ink" | null;

/**
 * The card surface. Everything visual comes from `.pc-card` in globals.css;
 * `tone` only chooses the hover, and `style` is for the dynamic leftovers.
 */
export function PracticeCard({
  tone = "brand",
  style,
  children,
}: {
  tone?: CardTone;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="pc-card" data-tone={tone ?? undefined} style={{ fontFamily: SANS, ...style }}>
      {children}
    </div>
  );
}

// ---- Head ------------------------------------------------------------------

/**
 * The top row: the sequence tile and the skill on the left, the status pill
 * hard right.
 *
 * Whichever way the skill arrives, it comes out as the same raised SkillPill —
 * `label` is the eyebrow form ("READING · ACADEMIC", pill + tail), `chips` is
 * Listening's ("LISTENING" + "BRITISH", pill + flat chip). Pass one or the
 * other, not both.
 */
export function CardHead({
  seq,
  seqTone = "brand",
  icon,
  label,
  chips,
  pill,
}: {
  /** 1-based; rendered zero-padded, as the canvas does ("01"). */
  seq: number;
  /** "ink" is Writing's dark tile; Reading and Listening use the brand tint. */
  seqTone?: "brand" | "ink";
  /** Goes inside the skill pill, so it is drawn white on the brand. */
  icon?: ReactNode;
  label?: string;
  /** The chip carrying an icon is the skill and becomes the raised pill. */
  chips?: { icon?: ReactNode; label: string }[];
  pill?: ReactNode;
}) {
  return (
    <div style={rowBetween}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <SeqTile seq={seq} tone={seqTone} />
        {label ? <CardEyebrow icon={icon} label={label} /> : null}
        {chips?.map((c) =>
          /* The skill chip is the one carrying an icon; it takes the raised
             pill. Whatever follows it — Listening's accent — stays flat, so the
             pair reads as heading and detail rather than two of a kind. */
          c.icon ? (
            <SkillPill key={c.label} icon={c.icon}>
              {c.label}
            </SkillPill>
          ) : (
            <MonoChip key={c.label}>{c.label}</MonoChip>
          ),
        )}
      </div>
      {pill ?? null}
    </div>
  );
}

/**
 * THE SKILL PILL — the raised brand chip that says READING / WRITING /
 * LISTENING, icon included.
 *
 * ⚠️ THIS IS THE ONE LINE THAT SAYS WHICH SKILL THE CARD IS, and on white it
 * kept disappearing. It was the canvas's 10px eyebrow in #8B919D — about 3:1
 * against white, under the 4.5:1 AA floor for text this small — then 11px in
 * #4A505C, which passes but still reads as small print. Set on the brand it is
 * white on #7D0132, roughly 12:1, and the fill does the work the type was being
 * asked to do on its own.
 *
 * The raise is three declarations and every one is load-bearing:
 *   · the gradient gives the top a lit edge and the bottom a shaded one, which
 *     is the whole of the effect — a flat fill reads as a tag, not a button;
 *   · the INSET highlight is the gloss along the top edge;
 *   · the outer shadow lifts it off the card.
 * No border — the reference has a pale ring and the owner's instruction was
 * explicitly to drop it, and on a card that already has a 1px edge of its own a
 * second ring 9px inside it reads as a mistake.
 */
export function SkillPill({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        flex: "0 0 auto",
        height: 23,
        padding: icon ? "0 11px 0 9px" : "0 11px",
        borderRadius: 9999,
        background: `linear-gradient(180deg, #A32552 0%, ${BRAND} 55%, #6C0128 100%)`,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.32), inset 0 -1px 1px rgba(0,0,0,.22), 0 2px 5px rgba(125,1,50,.30)",
        color: "#fff",
        textShadow: "0 1px 1px rgba(0,0,0,.25)",
        fontFamily: MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".08em",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * The skill pill plus whatever qualifies it — "WRITING" + "TASK 1 GT · HOUSING".
 *
 * Callers all build the label as `[SKILL, …qualifiers].join(" · ")`, so the
 * split is on the first separator. The separator itself goes with it: the pill
 * is its own boundary, and a middot floating beside it just looks orphaned.
 *
 * The tail keeps the canvas's idiom — mono, caps, tracking — at the size and
 * colour that pass on white (#4A505C is 7.7:1), because it is still plain text
 * on the card.
 */
function CardEyebrow({ icon, label }: { icon?: ReactNode; label: string }) {
  const cut = label.indexOf(" · ");
  const lead = cut === -1 ? label : label.slice(0, cut);
  const tail = cut === -1 ? "" : label.slice(cut + 3);
  return (
    <>
      <SkillPill icon={icon}>{lead}</SkillPill>
      {tail ? (
        <span
          // The qualifiers are the first thing an ellipsis eats on a narrow
          // card, so the full label stays reachable on hover.
          title={label}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".07em",
            color: MUTED,
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tail}
        </span>
      ) : null}
    </>
  );
}

/** The canvas's numbered tile — serif, because a number is the one place a
 *  display face earns its keep on a card this small. */
export function SeqTile({ seq, tone = "brand" }: { seq: number; tone?: "brand" | "ink" }) {
  const ink = tone === "ink";
  return (
    <span
      aria-hidden
      style={{
        flex: "0 0 auto",
        width: 28,
        height: 28,
        borderRadius: 8,
        background: ink ? INK : "#FDF4F7",
        border: `1px solid ${ink ? INK : "rgba(125,1,50,.12)"}`,
        color: ink ? "#fff" : BRAND,
        fontFamily: SERIF,
        fontSize: 15,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {String(seq).padStart(2, "0")}
    </span>
  );
}

/**
 * The flat detail chip beside the skill pill — Listening's accent ("BRITISH").
 *
 * Deliberately quiet: it sits next to a raised brand pill, and a second chip
 * competing with it would say the accent matters as much as the skill does.
 */
export function MonoChip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 21,
        padding: "0 9px",
        borderRadius: 7,
        background: "#F4F4F7",
        border: "1px solid #E7E7EC",
        color: MUTED,
        fontFamily: MONO,
        // Sized and weighted with the eyebrow's tail — both are the detail beside
        // the skill, and a card can show one or the other depending on the hub.
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".07em",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
      }}
    >
      {children}
    </span>
  );
}

// ---- Status pill -----------------------------------------------------------

/** The four states the canvas draws, in its own order of loudness. */
export type PillTone = "new" | "band" | "progress" | "target";

const PILL: Record<PillTone, { bg: string; border: string; fg: string }> = {
  // Brand — "we just made this for you".
  new: { bg: "linear-gradient(180deg,#FDF4F7 0%,#F8DFE8 100%)", border: "#EFC7D5", fg: BRAND },
  // Green — a real, earned band.
  band: { bg: "linear-gradient(180deg,#F2FBF6 0%,#DCF0E6 100%)", border: "#C3E0CD", fg: EMERALD },
  // Amber — started, not finished.
  progress: { bg: "linear-gradient(180deg,#FDF9EF 0%,#F6EAD2 100%)", border: "#E8D6AE", fg: AMBER },
  // Neutral — what the content is PITCHED at, not what anyone scored.
  target: { bg: "linear-gradient(180deg,#FAFAFB 0%,#F1F1F5 100%)", border: "#E2E0EE", fg: DIM },
};

/**
 * The pill top-right. The canvas's inset highlight is what keeps these reading
 * as physical chips rather than flat tags, so it is not optional.
 */
export function StatusPill({
  tone,
  icon,
  children,
}: {
  tone: PillTone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const p = PILL[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flex: "0 0 auto",
        height: 21,
        padding: "0 9px",
        borderRadius: 9999,
        background: p.bg,
        border: `1px solid ${p.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(20,17,15,.12)",
        color: p.fg,
        fontSize: 10,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </span>
  );
}

// ---- Body ------------------------------------------------------------------

/**
 * Title + one line of what is inside.
 *
 * ⚠️ `titleLines` EXISTS BECAUSE READING'S TITLE IS A LIST, NOT A NAME.
 * The canvas draws a short editorial gist here and clamps it to one line, which
 * is right when the title is "Cities, oceans and memory". Nothing stores such a
 * gist (see lib/reading/titles.ts), so a reading test is titled by its three
 * passages' topics — and at three cards to a row that list is cut after the
 * first topic every single time, which hides the exact thing the owner asked to
 * reveal. Two lines fit it; the height is RESERVED at both settings so a row of
 * cards still lines up, which is the reason the canvas clamped in the first
 * place.
 */
export function CardBody({
  title,
  subtitle,
  titleLines = 1,
  progress,
}: {
  title: string;
  subtitle?: string | null;
  /** How many lines the title may use. Reading passes 2; see above. */
  titleLines?: 1 | 2;
  /** An unfinished attempt. Replaces the subtitle with the canvas's progress row. */
  progress?: { pct: number; label: string };
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        title={title}
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: INK,
          letterSpacing: "-.01em",
          marginBottom: progress ? 7 : 4,
          ...clampLines(titleLines, 1.3),
        }}
      >
        {title}
      </div>
      {progress ? (
        <ProgressRow pct={progress.pct} label={progress.label} />
      ) : subtitle ? (
        <div
          title={subtitle}
          style={{
            fontSize: 12,
            color: "#6F6E7A",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Clamp to `lines`, and hold that height whether or not the text reaches it.
 *
 * One line stays on `white-space: nowrap` + `text-overflow`, which is the plain
 * path and is what every card but Reading's still takes. Past one line the only
 * thing that truncates is `-webkit-line-clamp`, which needs the legacy box.
 *
 * ⚠️ NEVER PUT PADDING ON WHAT THIS STYLES. `overflow: hidden` clips at the
 * PADDING box while the clamp stops at the content box, so padding-bottom
 * renders a slice of the line the clamp just dropped — see CardQuote, where
 * that bug was live.
 */
function clampLines(lines: 1 | 2, lineHeight: number): CSSProperties {
  if (lines === 1) {
    return { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  }
  return {
    lineHeight,
    // Reserving the full height is what keeps a row of cards level: a one-line
    // title next to a two-line one would otherwise shorten its whole card.
    minHeight: `${lines * lineHeight}em`,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lines,
    overflow: "hidden",
  };
}

/** The 4px track + its "where you are" label. */
export function ProgressRow({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        style={{
          flex: 1,
          height: 4,
          borderRadius: 9999,
          background: "#EDEEF2",
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${clamped}%`, height: "100%", background: BRAND }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: BRAND, whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

/**
 * Writing's body: the essay question itself, set in the serif and clamped to
 * two lines. `muted` is the not-yet-revealed variant — a fresh AI prompt whose
 * wording is only settled when the learner starts.
 *
 * ⚠️ TWO ELEMENTS, AND THE PADDING IS THE ENTIRE REASON.
 * This was one padded `-webkit-box`, and it rendered a HALF-HEIGHT THIRD LINE
 * under the clamped two: `-webkit-line-clamp` stops laying out lines at the
 * clamp, but `overflow: hidden` clips at the PADDING box, so the 9px of
 * padding-bottom is 9px of window onto the line that was just dropped. The
 * card looked torn rather than truncated — a prompt ending in a clean "…" on
 * line 2 with a sliced line beneath it.
 *
 * Padding outside, clamp inside: there is then no padding below the clipped
 * edge for a dropped line to show through. Guarded in ./card.test.ts, because
 * folding these back into one element is an obvious-looking simplification and
 * the bug it brings back is purely visual.
 */
export function CardQuote({
  muted = false,
  full,
  children,
}: {
  muted?: boolean;
  /** The untruncated text, for the hover tooltip — two lines of a Task 1 letter
   *  is a teaser, and the learner should be able to read the rest without
   *  starting it. */
  full?: string;
  children: ReactNode;
}) {
  return (
    <div
      title={full}
      style={{
        background: "#F8F9FB",
        borderLeft: `2px solid ${muted ? "#E3C9D1" : BRAND}`,
        borderRadius: "0 8px 8px 0",
        padding: "9px 11px",
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 16,
          lineHeight: 1.4,
          color: muted ? "#6F6E7A" : INK,
          // Held at two lines either way, so a one-line prompt does not shorten
          // its card out of step with the row.
          minHeight: "2.8em",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The question types inside. Not on the canvas — it has no slot for them — but
 * all three hubs showed them before this redesign and dropping them would lose
 * real information, so they keep a row of their own in the canvas's chip idiom.
 */
export function CardTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span
          key={t}
          style={{
            background: "#F8F9FB",
            border: "1px solid #E7E7EC",
            color: MUTED,
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 7,
            whiteSpace: "nowrap",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// ---- Footer ----------------------------------------------------------------

/** The rule + the meta line + the actions. Always last in the card. */
export function CardFoot({
  meta,
  lead,
  children,
}: {
  meta: ReactNode;
  /** Sits before the meta line — Listening's waveform. */
  lead?: ReactNode;
  /** The action pills, hard right. */
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingTop: 12,
        borderTop: `1px solid ${RULE}`,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        {lead}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: MUTED,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {meta}
        </span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        {children}
      </span>
    </div>
  );
}

/** Which of the three pill looks an action wears. */
type ActionKind = "primary" | "secondary" | "attach";

type ActionProps = {
  kind?: ActionKind;
  children: ReactNode;
  /** Trailing glyph — the canvas puts an arrow on every primary. */
  icon?: ReactNode;
  title?: string;
} & ({ href: string } | { onClick: () => void; disabled?: boolean });

/**
 * A footer action. Renders as a <Link> when given an href and a <button>
 * otherwise, so a card that opens directly and one that has to clone first look
 * identical. Its fill comes from `.pc-act*` in globals.css.
 */
export function CardAction(props: ActionProps) {
  const { kind = "primary", children, icon, title } = props;
  const className = cx("pc-act", `pc-act--${kind}`);
  const body = (
    <>
      {children}
      {icon}
    </>
  );
  if ("href" in props) {
    return (
      <Link href={props.href} className={className} title={title}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={props.onClick}
      disabled={props.disabled}
      title={title}
    >
      {body}
    </button>
  );
}

/** Listening's 44×16 bars. Fixed heights, not random — a card that re-renders
 *  should not reshuffle its own artwork. */
export function Waveform() {
  const bars = [4, 10, 16, 6, 12, 4, 14, 6, 8];
  return (
    <svg width="44" height="16" viewBox="0 0 44 16" aria-hidden style={{ flex: "0 0 auto" }}>
      {bars.map((h, i) => (
        <rect key={i} x={i * 5} y={(16 - h) / 2} width="2" height={h} rx="1" fill="#C79AAE" />
      ))}
    </svg>
  );
}

// ---- Shared bits -----------------------------------------------------------

const rowBetween: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

/** "3 Sep" — the canvas's date form, used in every graded footer. */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/** Seconds → "52 min", or "4:05" when the canvas wants a running clock. */
export function minutes(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

/** Seconds → "30:12". Used for audio length, where the canvas shows m:ss. */
export function clock(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
