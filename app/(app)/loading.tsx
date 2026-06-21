import { PageSkeleton } from "@/components/app-shell/page-skeleton";

/**
 * Suspense fallback for every page in the (app) group. Because these pages are
 * `force-dynamic`, a navigation otherwise waits on the full server render before
 * anything changes on screen. This boundary makes the click commit instantly: the
 * sidebar + header (owned by the layout) stay, and the content area shows a
 * skeleton while the real page streams in.
 */
export default function Loading() {
  return <PageSkeleton />;
}
