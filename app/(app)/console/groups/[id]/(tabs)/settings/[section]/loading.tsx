import { CardSkeleton } from "../../_components/skeleton";

export default function Loading() {
  return (
    <div style={{ maxWidth: 900 }}>
      <CardSkeleton rows={4} />
    </div>
  );
}
