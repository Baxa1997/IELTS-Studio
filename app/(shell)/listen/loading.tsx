import { Block } from "@/components/app-shell/page-skeleton";

/**
 * Listening hub fallback — mirrors the tabbed hub's exact shape (heading + usage
 * pill, tab chooser, filter chips, then a card grid) so the swap to real content
 * doesn't jump. Padding matches the hub (`lp-hub-pad`, 26px 24px).
 */
export default function ListenLoading() {
  return (
    <div
      className="lp-hub-pad"
      style={{ width: "100%", padding: "26px 24px 64px", animation: "lp-fadeup .25s ease both" }}
      role="status"
      aria-label="Loading"
    >
      {/* Heading + pill */}
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}
      >
        <div>
          <Block w={220} h={34} r={10} />
          <Block w={440} h={14} r={7} mt={12} />
        </div>
        <Block w={150} h={36} r={999} />
      </div>

      {/* Tab chooser */}
      <div style={{ marginTop: 22 }}>
        <Block w={520} h={62} r={14} />
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <Block w={86} h={32} r={999} />
        <Block w={150} h={32} r={999} />
        <Block w={130} h={32} r={999} />
      </div>

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: 14,
          marginTop: 18,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1px solid rgba(28,27,46,.09)",
              borderRadius: 14,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 11,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Block w={40} h={40} r={11} />
              <Block w={70} h={24} r={8} />
            </div>
            <div>
              <Block w={140} h={16} r={8} />
              <Block w={180} h={12} r={6} mt={8} />
            </div>
            <span style={{ height: 1, background: "rgba(28,27,46,.07)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Block w={140} h={12} r={6} />
              <Block w={54} h={13} r={7} />
            </div>
          </div>
        ))}
      </div>
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        Loading…
      </span>
    </div>
  );
}
