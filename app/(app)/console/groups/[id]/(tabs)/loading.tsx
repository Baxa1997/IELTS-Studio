import { TabSkeleton } from "./skeleton";

/** The overview's fallback — and the default for any tab without its own. */
export default function GroupOverviewLoading() {
  return <TabSkeleton kpis rows={8} />;
}
