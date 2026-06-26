import { CardsSkeleton } from "@/components/app-shell/page-skeleton";

/**
 * Suspense fallback for the hub pages. The shell (sidebar + header) is owned by
 * the layout and STAYS mounted across navigation — only this content area shows a
 * skeleton while the hub streams in. (Previously the hubs rendered their own shell,
 * so the whole frame, sidebar included, flashed to a skeleton on every click.)
 */
export default function HubLoading() {
  // Full-bleed with 24px side padding to match the real hubs (the (shell) layout
  // passes contentClassName="" so the pages paint edge-to-edge and supply their own
  // padding). A centered max-width here made content jump wider when it streamed in.
  return (
    <div style={{ width: "100%", padding: "32px 24px 64px" }}>
      <CardsSkeleton tabs cards={4} />
    </div>
  );
}
