/**
 * The "Engaide — English, AI" wordmark, rebuilt in code from the brand card.
 *
 * Anatomy (matches the source art):
 *  - bold, rounded geometric wordmark "Engaide" in deep navy,
 *  - the single "a" reversed out in cream on a tan square block,
 *  - a letter-spaced "ENGLISH, AI" tagline flanked by thin rule lines,
 *    closed by a small solid navy square on the right.
 *
 * Scales off one number (`fontSize`, the wordmark height in px); everything else
 * is derived in `em` so the lockup stays proportional at any size. No "use
 * client": pure render, safe in both server and client components.
 *
 * Poppins (700/600) is loaded via next/font as the closest match to the rounded
 * geometric letterforms, with rounded fallbacks if it hasn't loaded yet.
 */
import { Poppins } from "next/font/google";

const engaide = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-engaide",
  display: "swap",
});

const NAVY = "#182B49"; // wordmark + tagline ink
const TAN = "#D89A5C"; // the "a" block
const WHITE = "#FFFFFF"; // the reversed-out "a"
const CREAM = "#F4EEE1"; // on-dark ink variant

export function EngaideLogo({
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
      className={`${engaide.variable} ${className ?? ""}`}
      role="img"
      aria-label="Engaide — English, AI"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        lineHeight: 1,
        fontFamily: "var(--font-engaide), 'Baloo 2', 'Nunito', system-ui, sans-serif",
      }}
    >
      {/* Wordmark: Eng + [a] + ide */}
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
        <span>Eng</span>
        <span
          style={{
            position: "relative",
            display: "inline-block",
            margin: "0 .04em",
            padding: "0 .08em",
            color: WHITE,
          }}
        >
          {/* the tan block sitting behind the "a", squared up past the baseline */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "-.1em",
              right: 0,
              bottom: "-.16em",
              left: 0,
              background: TAN,
              borderRadius: ".1em",
            }}
          />
          <span style={{ position: "relative" }}>a</span>
        </span>
        <span>ide</span>
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
 * The logomark on its own — the cream "a" on the tan square, the most distinctive
 * fragment of the wordmark. Used where the full lockup doesn't fit (the collapsed
 * sidebar rail, favicons). Square; `size` is its side in px. The tile is tan on any
 * background, so there's no `tone`.
 */
export function EngaideMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={`${engaide.variable} ${className ?? ""}`}
      role="img"
      aria-label="Engaide"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        background: TAN,
        borderRadius: Math.round(size * 0.16),
        fontFamily: "var(--font-engaide), 'Baloo 2', 'Nunito', system-ui, sans-serif",
      }}
    >
      <span
        style={{ fontWeight: 700, fontSize: Math.round(size * 0.66), lineHeight: 1, color: WHITE }}
      >
        a
      </span>
    </span>
  );
}
