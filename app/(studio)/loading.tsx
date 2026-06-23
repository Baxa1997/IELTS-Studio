import { StudioShellSkeleton } from "@/components/app-shell/studio-skeleton";

/**
 * Suspense fallback for the (studio) group. The library/hub pages render their own
 * app shell, so this reproduces that frame as a skeleton (the full-screen runners
 * have their own editor-shaped skeletons in their segments).
 */
export default function StudioLoading() {
  return <StudioShellSkeleton />;
}
