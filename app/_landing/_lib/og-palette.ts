import type { BlogCategory } from "@/lib/blog";

/* Shared by the two share cards the public site draws: an article's
   (app/blog/[slug]/opengraph-image.tsx) and a free-practice page's
   (app/practice/[skill]/opengraph-image.tsx), which wears its skill's cover —
   see SKILL_COVER_CATEGORY in ./design. */

/**
 * The share card's colours — hex, not tokens, and deliberately so.
 *
 * ⚠️ THE ONE PLACE IN THE BLOG WHERE A COLOUR LITERAL IS RIGHT. The card is a
 * PNG drawn on the server by `next/og`: there is no stylesheet, no `.dark`
 * class and no `var()` to resolve, and a picture shared into Telegram has no
 * theme anyway. So the card wears the LIGHT column of the cover and hero
 * tokens, and `og-palette.test.ts` reads `app/globals.css` and fails the day
 * either side changes without the other.
 */
export const OG_COVER: Record<BlogCategory, { a: string; b: string }> = {
  ielts: { a: "#0e5f5b", b: "#062f2d" }, // --mk-cover-ielts-a / -b
  multilevel: { a: "#1b6a45", b: "#0a2a1a" }, // --mk-cover-multilevel-a / -b
  english: { a: "#2f3a8f", b: "#151a47" }, // --mk-cover-english-a / -b
  stories: { a: "#8a4a0c", b: "#3b1e04" }, // --mk-cover-stories-a / -b
  engprogress: { a: "#7d0132", b: "#2c0013" }, // --mk-hero-b / --mk-hero-a
};

/** Everything drawn ON a card: white at a few strengths. Every ground above is
 *  dark, so these are legible on all of them (the covers' AA check in
 *  lib/theme/palette.test.ts covers the same grounds against white). */
export const OG_INK = {
  text: "#ffffff",
  soft: "rgba(255,255,255,0.78)",
  line: "rgba(255,255,255,0.38)",
  ring: "rgba(255,255,255,0.16)",
  mark: "rgba(255,255,255,0.16)",
} as const;
