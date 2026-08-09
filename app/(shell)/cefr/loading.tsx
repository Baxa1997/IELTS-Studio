import { Block, Card } from "@/components/app-shell/page-skeleton";

/**
 * CEFR hub fallback. Deliberately mirrors the hub's exact shape — heading, the
 * two-tab switch, the AI-generate banner, then the five single-part cards — so
 * the swap to real content doesn't jump (the group-wide hub skeleton showed a
 * different card count and read as "cards changing"). Padding matches the hub
 * (`lp-hub-pad`, 26px 24px).
 */
export default function CefrLoading() {
  return (
    <div
      className="lp-hub-pad"
      style={{ width: "100%", padding: "26px 24px 64px", animation: "lp-fadeup .25s ease both" }}
      role="status"
      aria-label="Loading"
    >
      {/* Heading + level pill */}
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}
      >
        <div>
          <Block w={240} h={34} r={10} />
          <Block w={420} h={14} r={7} mt={12} />
        </div>
        <Block w={110} h={36} r={999} />
      </div>

      {/* Tab switch (two wide tabs) */}
      <div style={{ display: "flex", gap: 6, marginTop: 22, maxWidth: 520 }}>
        <Block w="50%" h={58} r={12} />
        <Block w="50%" h={58} r={12} />
      </div>

      {/* AI-generate banner */}
      <div style={{ marginTop: 18, marginBottom: 28 }}>
        <Block w="100%" h={104} r={16} />
      </div>

      {/* Section label + the five part cards */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
        <Block w={170} h={14} r={7} />
        <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.08)" }} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: 14,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Block w="55%" h={18} r={8} />
              <Block w={48} h={20} r={7} />
            </div>
            <Block w="90%" h={12} r={6} mt={14} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Block w={90} h={12} r={6} />
              <Block w={56} h={13} r={7} />
            </div>
          </Card>
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
