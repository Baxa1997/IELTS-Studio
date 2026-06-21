import { Hanken_Grotesk, Newsreader } from "next/font/google";

// Option A brand fonts for the full-page essay feedback, scoped via CSS variables —
// the same chrome-free treatment as the writing studio. The Activities LIST keeps
// the app shell (sidebar) under (app); this detail page renders full-screen here.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

export default function ActivitiesDetailLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${hanken.variable} ${newsreader.variable} lp-root`}>{children}</div>;
}
