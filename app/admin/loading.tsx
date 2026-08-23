import { PageSkeleton } from "@/components/app-shell/page-skeleton";

/**
 * Suspense fallback for the platform console.
 *
 * `(app)`, `(shell)` and `(studio)` each had one of these; `/admin` was the one
 * authenticated group without a loading boundary, so a click on any admin nav
 * item sat on a blank screen until the whole server render came back. Worse, a
 * dynamic route can only be prefetched as far as its nearest loading boundary —
 * with none, hovering an admin link prefetched nothing at all.
 */
export default function Loading() {
  return <PageSkeleton />;
}
