import { Block, Card } from "@/components/app-shell/page-skeleton";

/**
 * Listening hub fallback — mirrors the hub's exact shape (heading + pill,
 * section line, four part cards) so the swap to real content doesn't jump.
 * Padding matches the hub (`lp-hub-pad`, 26px 24px).
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
        <div>
          <Block w={220} h={34} r={10} />
          <Block w={440} h={14} r={7} mt={12} />
        </div>
        <Block w={140} h={36} r={999} />
      </div>

      {/* Section label + the four part cards */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 16px" }}>
        <Block w={140} h={14} r={7} />
        <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.08)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Block w="55%" h={18} r={8} />
              <Block w={56} h={20} r={7} />
            </div>
            <Block w="90%" h={12} r={6} mt={14} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <Block w={110} h={12} r={6} />
              <Block w={56} h={13} r={7} />
            </div>
          </Card>
        ))}
      </div>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Loading…</span>
    </div>
  );
}
