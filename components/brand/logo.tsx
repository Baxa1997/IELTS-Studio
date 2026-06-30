/**
 * The EnglAI logo — a custom "ascend" glyph (two stacked, rounded chevrons that
 * read as levelling up to your target band) + a bold, two-tone sans wordmark.
 * One source of truth so the landing, app shell, onboarding and auth pages never
 * drift.
 *
 * No "use client": pure render, no hooks or server-only imports, so it works in
 * both server components (auth pages) and client components (shell, landing).
 *
 * The wordmark uses the brand sans (`--font-hanken`, loaded by the brand routes)
 * with a system fallback. `tone="light"` is the on-dark variant (dark panels).
 */

const GRAD_FROM = "#6E61E8"; // indigo, top
const GRAD_TO = "#312C8F"; // deep indigo, bottom
const HILITE_FROM = "#A89BFF"; // lighter facet for the upper chevron
const HILITE_TO = "#6E61E8";
const INK = "#1A1C33";
const INDIGO = "#3B43B5";
const ON_DARK_ACCENT = "#aeb2f0";

export function BrandLogo({
  tone = "dark",
  size = 30,
  fontSize = 20,
  wordmarkClassName,
}: {
  /** "dark" = colored glyph for light backgrounds; "light" = white glyph for dark. */
  tone?: "dark" | "light";
  /** Glyph height in px (it's square). */
  size?: number;
  /** Wordmark size in px. */
  fontSize?: number;
  /** Extra class on the wordmark span (e.g. `lp-sb-wordmark` to hide on collapse). */
  wordmarkClassName?: string;
}) {
  const onDark = tone === "light";
  const lowerStroke = onDark ? "#FFFFFF" : "url(#engl-g)";
  const upperStroke = onDark ? "rgba(255,255,255,.82)" : "url(#engl-h)";
  const primary = onDark ? "#FFFFFF" : INK;
  const accent = onDark ? ON_DARK_ACCENT : INDIGO;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.36) }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        style={{ flex: "none" }}
      >
        {!onDark ? (
          <defs>
            <linearGradient id="engl-g" x1="6" y1="13" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor={GRAD_FROM} />
              <stop offset="1" stopColor={GRAD_TO} />
            </linearGradient>
            <linearGradient id="engl-h" x1="6" y1="6" x2="26" y2="18" gradientUnits="userSpaceOnUse">
              <stop stopColor={HILITE_FROM} />
              <stop offset="1" stopColor={HILITE_TO} />
            </linearGradient>
          </defs>
        ) : null}
        {/* Two stacked rounded chevrons — an "ascend / level up" mark. */}
        <path d="M6 16.5 L16 7.5 L26 16.5" stroke={upperStroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 24.5 L16 15.5 L26 24.5" stroke={lowerStroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span
        className={wordmarkClassName}
        style={{
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
          fontWeight: 800,
          fontSize,
          letterSpacing: "-.02em",
          lineHeight: 1,
          color: primary,
        }}
      >
        Engl<span style={{ color: accent }}>AI</span>
      </span>
    </span>
  );
}
