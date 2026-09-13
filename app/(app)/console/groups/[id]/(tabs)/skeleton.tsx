/**
 * The shapes every group tab falls back to while its own data loads.
 *
 * ⚠️ THE HEADER IS NOT IN HERE, AND THAT IS THE POINT OF THE SPLIT. The group's
 * name and its tab strip are drawn by the layout, which is cheap and stays
 * mounted across tab changes — so a tab's fallback only ever has to stand in for
 * the content area beneath them. A skeleton that redraws the header would make
 * the real header flicker out and back on every tab click.
 */
const shimmer = {
  background: "linear-gradient(90deg, #f1f0ec 25%, #faf9f6 37%, #f1f0ec 63%)",
  backgroundSize: "400% 100%",
  animation: "cn-skeleton-shimmer 1.4s ease infinite",
};

export function Block({ width = "100%", height = 18 }: { width?: string; height?: number }) {
  return <div style={{ ...shimmer, width, height, borderRadius: 8 }} aria-hidden />;
}

/** A bordered card with a title, a note and a body — the shape of nearly every
 *  panel on these tabs. */
export function CardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ border: "1px solid #ebe9e3", borderRadius: 16, padding: 22 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <Block width="220px" height={24} />
        <Block width="min(620px, 80%)" height={15} />
        <div style={{ display: "grid", gap: 10 }}>
          {Array.from({ length: rows }, (_, i) => (
            <Block key={i} height={34} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The five-stat strip. Only the overview tab draws one. */
export function KpiSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 14,
        marginBottom: 16,
      }}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{ border: "1px solid #ebe9e3", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <Block width="80px" height={13} />
            <Block width="55px" height={28} />
            <Block width="110px" height={13} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The default content fallback: one card. */
export function TabSkeleton({ kpis = false, rows = 6 }: { kpis?: boolean; rows?: number }) {
  return (
    <div aria-label="Loading" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {kpis ? <KpiSkeleton /> : null}
      <CardSkeleton rows={rows} />
    </div>
  );
}
