/**
 * The brand logo used across the landing, app shell, onboarding and auth pages —
 * one source of truth so it never drifts.
 *
 * It now renders the "Engaide — English, AI" wordmark (see `engaide-logo.tsx`).
 * This thin wrapper keeps the long-standing `BrandLogo` API (`tone`/`size`/
 * `fontSize`) so every call site stays unchanged; in these compact header/nav
 * lockups we show the wordmark only (no tagline rule).
 *
 * Note the `tone` convention is inverted vs. `EngaideLogo`: here `tone="dark"` is
 * the on-light-background variant (dark ink) and `tone="light"` is the on-dark
 * variant — matching how every existing caller passes it.
 *
 * No "use client": pure render, safe in both server and client components.
 */
import { EngaideLogo } from "./engaide-logo";

export function BrandLogo({
  tone = "dark",
  fontSize = 20,
  wordmarkClassName,
}: {
  /** "dark" = dark ink for light backgrounds; "light" = light ink for dark backgrounds. */
  tone?: "dark" | "light";
  /** Glyph height in px — kept for API compatibility; no longer used. */
  size?: number;
  /** Wordmark size in px. */
  fontSize?: number;
  /** Extra class on the lockup. */
  wordmarkClassName?: string;
}) {
  // BrandLogo's tone is the inverse of EngaideLogo's (see the file header).
  const engTone = tone === "light" ? "dark" : "light";
  return (
    <EngaideLogo tone={engTone} fontSize={fontSize} showTagline={false} className={wordmarkClassName} />
  );
}
