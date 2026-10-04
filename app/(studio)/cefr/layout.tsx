import { Hanken_Grotesk, Newsreader } from "next/font/google";

// The CEFR runner's own faces (its SANS / SERIF), for the free runner under
// here. The signed-in hub gets them from the (shell) layout; this frame has
// none, so the runner would fall back to system type without these.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap" });

export default function CefrStudioLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${hanken.variable} ${newsreader.variable}`}>{children}</div>;
}
