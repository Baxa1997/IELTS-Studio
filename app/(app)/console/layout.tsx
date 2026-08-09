import { Source_Serif_4, Work_Sans } from "next/font/google";

/**
 * The center console's own typography and canvas.
 *
 * The console is the only part of the app on the CRM brand (cream ground,
 * indigo action, Source Serif headings) — the learner app and the platform
 * super-admin console stay on the emerald Option A brand. Scoping it to a
 * layout means the two can't bleed into each other: everything that reskins
 * hangs off `.cn-root` (see globals.css) and off `components/console/crm-ui`.
 *
 * Nested inside `(app)/layout.tsx`, so it inherits `.lp-root` and the shell.
 */

const work = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work",
  display: "swap",
});
const serif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-serif4",
  display: "swap",
});

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${work.variable} ${serif4.variable} cn-root`}>{children}</div>;
}
