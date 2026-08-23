import { ConsoleSkeleton } from "@/components/app-shell/page-skeleton";

/**
 * Suspense fallback for the staff console.
 *
 * Without this, all 25 console pages fell through to `(app)/loading.tsx`, whose
 * skeleton is dashboard-shaped — a learner hero over band cards. Opening
 * /console/students flashed a student dashboard and then jumped to a table,
 * which reads as a glitch rather than as loading. This one is table-shaped,
 * so the swap to real content barely moves.
 */
export default function Loading() {
  return <ConsoleSkeleton />;
}
