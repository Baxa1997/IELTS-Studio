import { Newsreader } from "next/font/google";

/**
 * Newsreader is the one face the checker adds on top of the site frame's Sora
 * and Manrope: the question and the answer are set in it, as in the writing
 * studio, so the writing surface reads as paper rather than as a form.
 *
 * Its own module because two routes load it: `/grade` (app/grade/layout.tsx)
 * and its localised twins (app/[locale]/grade/page.tsx).
 */
export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
  display: "swap",
});
