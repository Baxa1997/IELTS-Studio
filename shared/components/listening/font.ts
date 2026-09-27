import { DM_Sans } from "next/font/google";

/**
 * The Listening runner's typeface (titles, UI, tabular times) — the only
 * surface that asks for DM Sans. One instance, loaded by the two layouts that
 * mount the runner: the signed-in hub `(shell)/listen` and the free daily
 * practice `(studio)/listen`. Declared once so the two cannot drift into two
 * font downloads that look almost the same.
 */
export const listeningFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dmsans",
  display: "swap",
  preload: false,
});
