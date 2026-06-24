import { CardsSkeleton } from "@/components/app-shell/page-skeleton";

/**
 * Suspense fallback for the hub pages. The shell (sidebar + header) is owned by
 * the layout and STAYS mounted across navigation — only this content area shows a
 * skeleton while the hub streams in. (Previously the hubs rendered their own shell,
 * so the whole frame, sidebar included, flashed to a skeleton on every click.)
 */
export default function HubLoading() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "26px clamp(16px,4vw,32px) 64px" }}>
      <CardsSkeleton tabs cards={4} />
    </div>
  );
}
