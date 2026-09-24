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
import {
  BRAND,
  BRAND_FILL,
  BRAND_SOFT,
  PANEL,
  SLATE_BODY as MUTED,
  SLATE_GREEN as EMERALD,
  SLATE_INK as INK,
  SLATE_MUTED as DIM,
  withAlpha,
} from "@/lib/theme/tokens";

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

const AMBER = "var(--pc-amber)";
const RULE = "var(--pc-rule)";

// ---- Shell -----------------------------------------------------------------

/** Which hover tint the card lifts with. `null` = it does not lift (locked, or
 *  a clone already in flight), which is how the card says "not right now". */
export type CardTone = "brand" | "done" | "ink" | null;

/** What the card is, as far as its surface is concerned.
 *  `done` = finished; `locked` = behind the paywall. */
export type CardSurface = "open" | "done" | "locked";

/* ⚠️ background IS THE ONE PAINT ALLOWED INLINE HERE, and only because no
   `.pc-card` hover rule touches it — the three tone hovers change border-color
   and box-shadow ONLY. Setting either of those inline would kill the lift at
   any specificity, which is the trap this file's header warns about and
   ./card.test.ts holds the line on (including an assertion that no hover rule
   ever starts setting background, which would make this exception unsafe). */
const SURFACE: Record<CardSurface, string | undefined> = {
  open: undefined,
  // Finished work steps back so it stops competing with what is still to do.
  done: "var(--pc-surface-done)",
  /* Locked is TINTED, NOT DIMMED. It used to be the whole card at 66% opacity,
     which faded the topic, the level and the question count — precisely the
     material that would make someone want to pay — and made the card read as
     broken rather than gated. The gate is stated by the PRO pill instead. */
  locked: "var(--pc-surface-locked)",
};

/**
 * The card surface. Everything visual comes from `.pc-card` in globals.css;
 * `tone` only chooses the hover, `surface` says what the card is, and `style`
 * is for the dynamic leftovers.
 */
export function PracticeCard({
  tone = "brand",
  surface = "open",
  style,
  children,
}: {
  tone?: CardTone;
  surface?: CardSurface;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className="pc-card"
      data-tone={tone ?? undefined}
      style={{ fontFamily: SANS, background: SURFACE[surface], ...style }}
    >
      {children}
    </div>
  );
}

// ---- Head ------------------------------------------------------------------

/**
 * The top row: the sequence tile, the level, and whatever genuinely varies
 * between one card and the next; the STATE pill hard right.
 *
 * ⚠️ THE PILL SAYS THE LEVEL, NOT THE SKILL, AND THAT IS THE POINT.
 * It used to read "READING" — on the Reading hub, where every card reads
 * READING. Same for the "ACADEMIC" qualifier beside it, which the tab above
 * already says, and for Listening's accent chip, which is British on all 45
 * items. Three of the five things in this row were constant down the whole
 * list, and the one thing a learner actually chooses by — how hard it is — was
 * the smallest, flattest chip of the lot.
 *
 * So the skill keeps its ICON and its COLOUR, which identify it just as well
 * inside a hub, and hands the pill to the level. Five elements become three.
 *
 * ⚠️ THE LEVEL IS NOT THE STATUS PILL, either. It used to be the pill's
 * "target" state, so it showed only while the card had nothing else to report
 * and vanished the moment the learner paused or finished one. A level is a
 * fact about the content and never changes; the pill is about the learner and
 * always does.
 *
 * `label` names the skill ("READING"); `chips` is Listening's equivalent, where
 * the chip carrying an icon is the skill. Pass one or the other, not both.
 */
export function CardHead({
  seq,
  seqTone = "brand",
  icon,
  label,
  level,
  chips,
  pill,
  dim = false,
}: {
  /** 1-based; rendered zero-padded, as the canvas does ("01"). */
  seq: number;
  /** "ink" is Writing's dark tile; Reading and Listening use the brand tint. */
  seqTone?: "brand" | "ink";
  /** Goes inside the pill, drawn in the skill's colour. */
  icon?: ReactNode;
  /** The skill. Chooses the pill's colour; only shown when there is no level. */
  label?: string;
  /** What the content is pitched at — see lib/practice/levels.ts. TAKES OVER
   *  THE PILL, because it is the fact that varies between cards. Its hint
   *  carries the band it maps to, so the scale stays a hover away. */
  level?: { text: string; hint?: string } | null;
  /** The chip carrying an icon is the skill. Anything else must EARN its place
   *  — a chip that says the same thing on every card is noise, so Listening
   *  passes its accent only when the library actually has more than one. */
  chips?: { icon?: ReactNode; label: string }[];
  pill?: ReactNode;
  /** A finished card steps back — see PracticeCard's `surface`. */
  dim?: boolean;
}) {
  const skillChip = chips?.find((c) => c.icon);
  const skill = label ?? skillChip?.label ?? "";
  const details = chips?.filter((c) => !c.icon).map((c) => c.label) ?? [];

  return (
    <div style={rowBetween}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <SeqTile seq={seq} tone={seqTone} dim={dim} />
        {skill ? (
          <SkillPill
            icon={icon ?? skillChip?.icon}
            skill={skill}
            label={level?.text}
            hint={level?.hint}
            dim={dim}
          />
        ) : null}
        {details.map((d) => (
          <MonoChip key={d}>{d}</MonoChip>
        ))}
      </div>
      {pill ?? null}
    </div>
  );
}

/**
 * ONE COLOUR PER SKILL, so a card says what it is before anything is read.
 *
 * All three hubs share this card, and at a glance — in the sidebar's peripheral
 * vision, or switching between Reading and Writing — an identical burgundy pill
 * on every one of them carried no information. The fill is the fastest signal on
 * the card, so it is the skill's.
 *
 * ⚠️ NONE OF THESE MAY BE GREEN OR AMBER. The status pill sits on the same row
 * and uses green for an earned band and amber for an unfinished run; a skill
 * wearing either would read as a result. That rules out the obvious "teal for
 * audio", and is why Listening is blue.
 *
 * Writing's ink is not a new decision — the canvas already singles Writing out
 * with the dark sequence tile (`seqTone="ink"`), which is the one place it drew
 * the three hubs differently. Reading keeps the brand.
 *
 * ⚠️ THE FILLS ARE GONE — THE INK IS NOW THE WHOLE SIGNAL. Each skill used to
 * carry a three-stop tint (top/base/foot) and a glow, drawn as a raised chip.
 * The owner asked for plain text, so colour and weight carry the skill on their
 * own now. That puts the ink straight onto the card, which is a HARDER ground
 * than the tint it used to sit on, so ./card.test.ts checks every ink against
 * all three card surfaces — ordinary, finished and locked — in both themes.
 */
const SKILL_TONE: Record<string, { ink: string }> = {
  READING: { ink: "var(--pc-read-ink)" },
  WRITING: { ink: "var(--pc-write-ink)" },
  LISTENING: { ink: "var(--pc-listen-ink)" },
};

/** An unrecognised skill falls back to the brand — the look this pill had before
 *  it had colours at all. A hub that renames its label therefore goes quietly
 *  back to burgundy rather than breaking, so a test asserts the three hubs'
 *  labels all land in the map. */
const SKILL_FALLBACK = SKILL_TONE.READING;

/**
 * THE LEVEL LABEL — flat text saying LEVEL 3 (or the skill, where there is no
 * level), with the skill's icon and in the skill's own ink.
 *
 * ⚠️ IT IS PLAIN TEXT ON PURPOSE. It was a raised chip: a three-stop gradient,
 * an inset gloss along the top edge, an outer lift and a letterpress
 * text-shadow — and every one of those was load-bearing for that look. The
 * owner's instruction was "simple text, not 3D style", so all four went
 * together. They come back one declaration at a time if nobody is watching,
 * which is why ./card.test.ts now asserts the ABSENCE of each.
 *
 * ⚠️ THE FILL WAS DOING WORK THE TYPE HAD BEEN FAILING TO DO. The canvas's
 * original 10px #8B919D eyebrow sat near 3:1 on white — under the AA floor, and
 * the owner's report was simply that they could not see it. Losing the fill
 * puts that burden back on the ink alone, so the inks are chosen against the
 * CARD (and against the muted finished/locked surfaces, which are tighter), not
 * against a tint. 11px and 700 are part of the same answer and are asserted.
 *
 * The name is historical: it is no longer a pill, but it is exported and has
 * one call site, and renaming it would churn a file the owner is actively
 * redesigning for no behavioural gain.
 */
export function SkillPill({
  icon,
  skill,
  label,
  hint,
  dim = false,
}: {
  icon?: ReactNode;
  /** Chooses the colour and nothing else. */
  skill: string;
  /** What the pill actually SAYS. Defaults to the skill's own name, but on a
   *  hub every card has the same skill, so the hubs pass the level instead —
   *  see the note on CardHead. */
  label?: string;
  /** Tooltip: the band a level maps to, so the scale stays a hover away. */
  hint?: string;
  /** A finished card steps back, and the pill steps back with it — the band is
   *  what should be loudest there. */
  dim?: boolean;
}) {
  const t = SKILL_TONE[skill.trim().toUpperCase()] ?? SKILL_FALLBACK;
  return (
    <span
      title={hint}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        flex: "0 0 auto",
        opacity: dim ? 0.72 : 1,
        // On the outer span so the whole label answers the hover, not the glyphs.
        cursor: hint ? "help" : undefined,
        color: t.ink,
        fontFamily: MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".08em",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label ?? skill}
    </span>
  );
}

/** The canvas's numbered tile — serif, because a number is the one place a
 *  display face earns its keep on a card this small. */
export function SeqTile({
  seq,
  tone = "brand",
  dim = false,
}: {
  seq: number;
  tone?: "brand" | "ink";
  dim?: boolean;
}) {
  const ink = tone === "ink";
  return (
    <span
      aria-hidden
      style={{
        flex: "0 0 auto",
        opacity: dim ? 0.72 : 1,
        width: 28,
        height: 28,
        borderRadius: 8,
        background: ink ? INK : BRAND_SOFT,
        border: `1px solid ${ink ? INK : withAlpha(BRAND, 12)}`,
        /* ⚠️ `PANEL`, NOT WHITE. The `ink` tile is the INVERTED one — a dark
           chip with light type — and `INK` already flips to near-white in dark,
           so the tile inverts correctly on its own. The label did not: it was
           literal white, which on the now-light tile is white on white. PANEL
           is the card's own surface, so it is whatever INK is not. */
        color: ink ? PANEL : BRAND,
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
export function MonoChip({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 21,
        padding: "0 9px",
        borderRadius: 7,
        background: "var(--pc-chip)",
        border: "1px solid var(--pc-well-line)",
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

/** The states the pill reports. `target` is what the canvas drew for content
 *  nobody had opened yet; `locked` is the paywall, which the canvas had no
 *  notion of. Note that NONE of these is the level any more — see CardHead. */
export type PillTone = "new" | "band" | "progress" | "target" | "locked";

const PILL: Record<PillTone, { bg: string; border: string; fg: string }> = {
  // Brand — "we just made this for you".
  new: {
    bg: "linear-gradient(180deg,var(--pc-pill-new-a) 0%,var(--pc-pill-new-b) 100%)",
    border: "var(--pc-pill-new-line)",
    fg: BRAND,
  },
  // Green — a real, earned band.
  band: {
    bg: "linear-gradient(180deg,var(--pc-pill-band-a) 0%,var(--pc-pill-band-b) 100%)",
    border: "var(--pc-pill-band-line)",
    fg: EMERALD,
  },
  // Amber — started, not finished.
  progress: {
    bg: "linear-gradient(180deg,var(--pc-pill-prog-a) 0%,var(--pc-pill-prog-b) 100%)",
    border: "var(--pc-pill-prog-line)",
    fg: AMBER,
  },
  // Neutral — a card with nothing to report yet.
  target: {
    bg: "linear-gradient(180deg,var(--pc-pill-target-a) 0%,var(--pc-pill-target-b) 100%)",
    border: "var(--pc-pill-target-line)",
    fg: DIM,
  },
  /* Brand, and deliberately as loud as an earned band: the gate is the one
     thing about a locked card the learner has to see, and it takes the slot the
     state would have used because that is where the eye already goes. */
  locked: {
    bg: "linear-gradient(180deg,var(--pc-pill-locked-a) 0%,var(--pc-pill-locked-b) 100%)",
    border: "var(--pc-pill-locked-line)",
    fg: BRAND,
  },
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
        boxShadow: "var(--pc-pill-shadow)",
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
  dim = false,
}: {
  title: string;
  subtitle?: string | null;
  /** How many lines the title may use. Reading passes 2; see above. */
  titleLines?: 1 | 2;
  /** An unfinished attempt. Replaces the subtitle with the canvas's progress row. */
  progress?: { pct: number; label: string };
  /** A finished card's title recedes so the band pill is what carries it. */
  dim?: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        title={title}
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: dim ? MUTED : INK,
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
            color: "var(--pc-dim)",
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
          background: "var(--pc-track)",
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${clamped}%`, height: "100%", background: BRAND_FILL }} />
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
        background: "var(--pc-well)",
        borderLeft: `2px solid ${muted ? "var(--pc-quote-muted)" : BRAND}`,
        borderRadius: "0 8px 8px 0",
        padding: "9px 11px",
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 16,
          lineHeight: 1.4,
          color: muted ? "var(--pc-dim)" : INK,
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
/**
 * The heading for one level block inside a hub's ready-made library.
 *
 * ⚠️ DELIBERATELY LIGHTER THAN EACH HUB'S OWN SectionLabel. A section label names
 * a list ("Ready to start"); this names a block within it. Giving them the same
 * weight flattens the hierarchy, and the panel then reads as five unrelated
 * lists instead of one library sorted by difficulty.
 *
 * Shared rather than copied into all three hubs: SectionLabel and Grid are
 * already byte-identical in read-hub.tsx and listening-client.tsx, and a third
 * duplicate of the same idea is how they drift apart.
 */
export function LevelLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 10px" }}>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: DIM,
        }}
      >
        {children}
      </span>
      <span style={{ height: 1, flex: 1, background: "var(--pc-level-rule)" }} />
    </div>
  );
}

export function CardTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span
          key={t}
          style={{
            background: "var(--pc-well)",
            border: "1px solid var(--pc-well-line)",
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
    /* ⚠️ `fill` IS SET IN `style`, NOT AS AN ATTRIBUTE. A CSS custom property is
       not valid in an SVG presentation attribute — `fill="var(--pc-wave)"`
       does not resolve and the bars render BLACK, with no error anywhere. Set
       once on the <svg> and inherited by the rects. */
    <svg
      width="44"
      height="16"
      viewBox="0 0 44 16"
      aria-hidden
      style={{ flex: "0 0 auto", fill: "var(--pc-wave)" }}
    >
      {bars.map((h, i) => (
        <rect key={i} x={i * 5} y={(16 - h) / 2} width="2" height={h} rx="1" />
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
