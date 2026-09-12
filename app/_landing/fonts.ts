import { Manrope, Sora } from "next/font/google";

/** Shared public marketing font instances. */
//
// 500 IS NOT OPTIONAL, and it is not a stylistic nicety either. The display
// scale in `design.ts` sets the hero and every section heading at weight 500;
// with only 600/700 loaded the browser has no 500 to use and silently rounds up
// to 600, so the whole editorial look — large, light, tightly tracked — collapses
// back into the heavy headings it was meant to replace, with nothing in the build
// or the tests to say so.
export const landingSora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

export const landingManrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});
