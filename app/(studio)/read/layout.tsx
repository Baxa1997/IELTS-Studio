import { Hanken_Grotesk, Newsreader } from "next/font/google";

// Option A brand fonts for the reading experience, scoped here via CSS variables.
// Chrome-free: the PICKER page adds the app shell (sidebar); the [id] RUNNER
// renders full-screen with no sidebar.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${hanken.variable} ${newsreader.variable} lp-root`}>{children}</div>;
}
