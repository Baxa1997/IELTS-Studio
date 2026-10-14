import { Newsreader } from "next/font/google";

import { SiteFrame } from "@/app/_landing/_components/site-frame";

/**
 * The free checker in the public site's own frame — the header island, the
 * centres band and the footer the landing page, the blog and the free practice
 * wear — so arriving here from the front door's "Start free assessment" does
 * not feel like leaving the site. It used to draw its own plain header bar.
 *
 * Newsreader is the one face added on top of the frame's Sora and Manrope: the
 * question and the answer are set in it, as in the writing studio, so the
 * writing surface reads as paper rather than as a form.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
  display: "swap",
});

export default function GradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={newsreader.variable}>
      <SiteFrame>{children}</SiteFrame>
    </div>
  );
}
