import { Hanken_Grotesk, Manrope, Newsreader, Sora } from "next/font/google";

import { DESIGN_CSS } from "@/app/_landing/design-chrome";
import { SiteFooter } from "@/app/_landing/site-footer";

// The public grader wears the same Option A brand as the internal writing
// studio/feedback pages (serif display + Hanken UI), scoped via CSS variables so
// the rest of the app keeps Geist.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap" });
// For the shared dark footer, which is set in the canvas type.
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export default function GradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${hanken.variable} ${newsreader.variable} ${sora.variable} ${manrope.variable}`}>
      {children}
      <style>{DESIGN_CSS}</style>
      <SiteFooter />
    </div>
  );
}
