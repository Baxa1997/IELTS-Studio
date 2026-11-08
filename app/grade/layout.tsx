import { SiteFrame } from "@/app/_landing/_components/site-frame";

import { newsreader } from "./_lib/fonts";

/**
 * The free checker in the public site's own frame — the header island, the
 * centres band and the footer the landing page, the blog and the free practice
 * wear — so arriving here from the front door's "Start free assessment" does
 * not feel like leaving the site. It used to draw its own plain header bar.
 *
 * Newsreader (./_lib/fonts) is the one face added on top of the frame's.
 */
export default function GradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={newsreader.variable}>
      <SiteFrame>{children}</SiteFrame>
    </div>
  );
}
