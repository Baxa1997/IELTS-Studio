/**
 * The "EngProgress — English, AI" wordmark.
 *
 * Anatomy:
 *  - a plain bold, rounded geometric wordmark "EngProgress" in deep navy
 *    (no block behind any letter — the boxed-letter treatment lives only in
 *    the square logomark/favicon below),
 *  - a letter-spaced "ENGLISH, AI" tagline flanked by thin rule lines.
 *
 * Scales off one number (`fontSize`, the wordmark height in px); everything else
 * is derived in `em` so the lockup stays proportional at any size. No "use
 * client": pure render, safe in both server and client components.
 *
 * Poppins (700/600) is loaded via next/font as the closest match to the rounded
 * geometric letterforms, with rounded fallbacks if it hasn't loaded yet.
 */
import { Poppins } from "next/font/google";

const engprogress = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-engprogress",
  display: "swap",
});

const NAVY = "#182B49"; // wordmark + tagline ink
const TAN = "#D89A5C"; // the "P" block
const WHITE = "#FFFFFF"; // the reversed-out "P"
const CREAM = "#F4EEE1"; // on-dark ink variant

export function EngProgressLogo({
  fontSize = 48,
  tone = "light",
  showTagline = true,
  className,
}: {
  /** Wordmark cap height in px; the rest scales from it. */
  fontSize?: number;
  /** "light" = on a light surface (navy ink); "dark" = on a dark surface (cream ink). */
  tone?: "light" | "dark";
  /** Hide the "— ENGLISH, AI —" rule for tight/favicon-style uses. */
  showTagline?: boolean;
  className?: string;
}) {
  const onDark = tone === "dark";
  const ink = onDark ? CREAM : NAVY;
  const tagSize = Math.max(12, Math.round(fontSize * 0.2));

  return (
    <span
      className={`${engprogress.variable} ${className ?? ""}`}
      role="img"
      aria-label="EngProgress — English, AI"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        lineHeight: 1,
        fontFamily: "var(--font-engprogress), 'Baloo 2', 'Nunito', system-ui, sans-serif",
      }}
    >
      {/* Wordmark — plain text, one ink */}
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          fontSize,
          fontWeight: 700,
          letterSpacing: "-.005em",
          color: ink,
        }}
      >
        EngProgress
      </span>

      {/* Tagline rule:  ────────  ENGLISH, AI  ──────── (symmetric, centered) */}
      {showTagline ? (
        <span
          aria-hidden
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".7em",
            marginTop: Math.round(fontSize * 0.16),
            fontSize: tagSize,
          }}
        >
          <span style={{ flex: 1, height: 1, background: ink, opacity: 0.9 }} />
          <span
            style={{
              fontWeight: 600,
              letterSpacing: ".34em",
              paddingLeft: ".34em",
              whiteSpace: "nowrap",
              color: ink,
            }}
          >
            ENGLISH, AI
          </span>
          <span style={{ flex: 1, height: 1, background: ink, opacity: 0.9 }} />
        </span>
      ) : null}
    </span>
  );
}

/**
 * The logomark on its own — the white "P" on the tan square, the most distinctive
 * fragment of the wordmark. Used where the full lockup doesn't fit (the collapsed
 * sidebar rail, favicons). Square; `size` is its side in px. The tile is tan on any
 * background, so there's no `tone`.
 */
export function EngProgressMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={`${engprogress.variable} ${className ?? ""}`}
      role="img"
      aria-label="EngProgress"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        background: TAN,
        borderRadius: Math.round(size * 0.16),
        fontFamily: "var(--font-engprogress), 'Baloo 2', 'Nunito', system-ui, sans-serif",
      }}
    >
      <span
        style={{ fontWeight: 700, fontSize: Math.round(size * 0.6), lineHeight: 1, color: WHITE }}
      >
        P
      </span>
    </span>
  );
}

/* ── a centre's own name ────────────────────────────────────────────────────── */

/**
 * The wordmark a CENTRE wears in its own console.
 *
 * A teacher opening this product works for their school, not for us. Putting
 * our wordmark at the top of their rail every day is the one place the
 * white-label question actually bites — so an approved centre gets its own name
 * there instead, in the same lockup, at the same weight.
 *
 * Two things it deliberately does NOT do. It does not carry the "English, AI"
 * tagline: that is our claim, not theirs. And it does not fall back to our
 * wordmark on a missing name — the caller decides that, because "which brand is
 * this" should be one decision in one place (see `Logo` in app-shell/shell.tsx).
 */
export function CentreWordmark({
  name,
  fontSize = 19,
  tone = "dark",
  className,
}: {
  name: string;
  /** Cap height in px; the rest scales from it. */
  fontSize?: number;
  tone?: "light" | "dark";
  className?: string;
}) {
  const onDark = tone === "dark";
  return (
    <span
      className={`${engprogress.variable} ${className ?? ""}`}
      title={name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        minWidth: 0,
        fontFamily: "var(--font-engprogress), 'Baloo 2', 'Nunito', system-ui, sans-serif",
        fontWeight: 700,
        fontSize,
        lineHeight: 1.15,
        letterSpacing: "-.01em",
        color: onDark ? CREAM : NAVY,
        // A centre name is arbitrary length — "Cambridge Academy of Tashkent"
        // is a real shape. The rail is 272px wide, so it truncates rather than
        // wrapping the row to two lines and shoving the collapse toggle down.
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {name}
    </span>
  );
}

/** Initials of a centre, for the collapsed rail. Two letters at most — the
 *  square is 36px and three initials in it are a smudge. */
export function centreInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** The collapsed-rail square, wearing a centre's initials instead of our "P". */
export function CentreMark({
  name,
  size = 36,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const text = centreInitials(name);
  return (
    <span
      className={`${engprogress.variable} ${className ?? ""}`}
      role="img"
      aria-label={name}
      title={name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        background: TAN,
        borderRadius: Math.round(size * 0.16),
        fontFamily: "var(--font-engprogress), 'Baloo 2', 'Nunito', system-ui, sans-serif",
      }}
    >
      <span
        style={{
          fontWeight: 700,
          // Two letters need to be smaller than one to fit the same square.
          fontSize: Math.round(size * (text.length > 1 ? 0.42 : 0.6)),
          lineHeight: 1,
          color: WHITE,
          letterSpacing: text.length > 1 ? "-.02em" : undefined,
        }}
      >
        {text}
      </span>
    </span>
  );
}
