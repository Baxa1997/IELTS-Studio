import { Hanken_Grotesk, Newsreader } from "next/font/google";

// The public grader wears the same Option A brand as the internal writing
// studio/feedback pages (serif display + Hanken UI), scoped via CSS variables so
// the rest of the app keeps Geist.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap" });

export default function GradeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${hanken.variable} ${newsreader.variable}`}>{children}</div>;
}
