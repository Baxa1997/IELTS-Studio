import { Hanken_Grotesk, Newsreader } from "next/font/google";

// Option A brand fonts for the writing experience, scoped here via CSS variables.
// This layout is intentionally chrome-free: the LIBRARY page adds the app shell
// (sidebar), while the [id] EDITOR renders full-screen with no sidebar.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

export default function WriteLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${hanken.variable} ${newsreader.variable} lp-root`}>{children}</div>;
}
