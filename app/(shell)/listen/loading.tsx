import { Block } from "@/components/app-shell/page-skeleton";

/**
 * Listening hub fallback — mirrors the library hub's exact shape (heading +
 * usage pill, then two part sections of practice rows) so the swap to real
 * content doesn't jump. Padding matches the hub (`lp-hub-pad`, 26px 24px).
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
        <Block w={150} h={36} r={999} />
      </div>

      {/* Two part sections of practice rows */}
      {[0, 1].map((s) => (
        <div key={s} style={{ marginTop: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 10px" }}>
            <Block w={230} h={14} r={7} />
            <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.08)" }} />
          </div>
          <Block w="70%" h={12} r={6} />
          <div style={{ marginTop: 12, background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 14, overflow: "hidden" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: i === 0 ? "none" : "1px solid rgba(28,27,46,.07)" }}>
                <Block w={64} h={24} r={7} />
                <div style={{ flex: 1 }}>
                  <Block w="55%" h={14} r={7} />
                  <Block w={150} h={11} r={6} mt={6} />
                </div>
                <Block w={54} h={13} r={7} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Loading…</span>
    </div>
  );
}
