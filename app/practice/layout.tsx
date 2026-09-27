import { SiteFrame } from "@/app/_landing/_components/site-frame";

/**
 * The free daily practice's pages of dated cards, in the public site's
 * full-width frame. The runners themselves are NOT under here — each lives in
 * its own skill's area (`/grade/today`, `/read/free`, `/listen/free`) so it can
 * reuse that skill's runner, full screen.
 */
export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
