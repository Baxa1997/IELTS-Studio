/**
 * Full-screen skeletons for the (studio) group. Unlike the (app) group — whose
 * layout owns the shell, so its `loading.tsx` only fills the content area — the
 * studio PAGES render their own shell (the library/hub) or a full-screen runner.
 * So these skeletons reproduce the whole frame, replacing the old branded "IS"
 * splash with an instant, page-shaped skeleton.
 */
import { Block } from "./page-skeleton";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const BORDER = "#E7E3D5";
const FADE: React.CSSProperties = { animation: "lp-fadeup .25s ease both" };
const SRONLY: React.CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" };

function Panel({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, ...style }}>{children}</div>
  );
}

/** The library/hub frame: shared top header + left sidebar rail + a content area. */
export function StudioShellSkeleton() {
  return (
    <div style={{ ...FADE, height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#F4F1E7", fontFamily: SANS }} role="status" aria-label="Loading">
      {/* top header */}
      <header style={{ height: 66, flex: "none", display: "flex", background: "#FBFAF3", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ width: 272, flex: "none", display: "flex", alignItems: "center", gap: 11, padding: "0 22px", borderRight: `1px solid ${BORDER}` }}>
          <Block w={34} h={34} r={9} />
          <Block w={120} h={16} r={7} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "0 22px" }}>
          <Block w={120} h={16} r={7} />
          <Block w={40} h={40} r={999} />
          <Block w={96} h={38} r={10} />
        </div>
      </header>

      {/* body: sidebar + main */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <aside className="lp-shell-sidebar" style={{ width: 272, flex: "none", background: "#FBFAF3", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", padding: "20px 16px", gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 6px" }}>
              <Block w={20} h={20} r={6} />
              <Block w={`${70 - i * 6}%`} h={13} r={7} />
            </div>
          ))}
          <div style={{ marginTop: "auto" }}>
            <Block w="100%" h={92} r={14} />
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "36px clamp(16px,4vw,40px)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <Block w={260} h={34} r={10} />
            <Block w={560} h={15} r={7} mt={14} />
            {/* tabs */}
            <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Block key={i} w={120} h={20} r={7} />
              ))}
            </div>
            {/* cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginTop: 32 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Panel key={i} style={{ padding: "18px 18px 16px" }}>
                  <div style={{ display: "flex", gap: 7 }}>
                    <Block w={80} h={20} r={7} />
                    <Block w={56} h={20} r={7} />
                  </div>
                  <Block w="100%" h={13} r={7} mt={16} />
                  <Block w="92%" h={13} r={7} mt={9} />
                  <Block w="60%" h={13} r={7} mt={9} />
                  <Block w="100%" h={1} r={0} mt={18} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                    <Block w={120} h={13} r={7} />
                    <Block w={110} h={38} r={10} />
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        </main>
      </div>
      <span style={SRONLY}>Loading…</span>
    </div>
  );
}

/** The full-screen runner frame: a top bar + the prompt / answer / coach columns. */
export function StudioEditorSkeleton() {
  return (
    <div style={{ ...FADE, height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#F4F1E7", fontFamily: SANS }} role="status" aria-label="Loading">
      {/* header */}
      <header style={{ height: 62, flex: "none", background: "#fff", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Block w={96} h={36} r={9} />
          <Block w={1} h={24} r={0} />
          <Block w={64} h={24} r={6} />
          <Block w={140} h={16} r={7} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Block w={110} h={36} r={9} />
          <Block w={170} h={40} r={10} />
        </div>
      </header>

      {/* body: prompt | answer | coach */}
      <div className="lp-write-main" style={{ flex: 1, minHeight: 0, display: "flex", gap: 16, padding: 16 }}>
        <Panel style={{ width: 356, flex: "none", display: "flex", flexDirection: "column" }}>
          <Block w={90} h={12} r={6} />
          <Block w="100%" h={22} r={9} mt={16} />
          <Block w="85%" h={22} r={9} mt={9} />
          <Block w="100%" h={1} r={0} mt={20} />
          {Array.from({ length: 3 }).map((_, i) => (
            <Block key={i} w="100%" h={44} r={10} mt={i === 0 ? 18 : 10} />
          ))}
        </Panel>

        <Panel style={{ flex: 1, minWidth: 0, padding: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ height: 60, flex: "none", borderBottom: `1px solid #F0EDE1`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px" }}>
            <Block w={120} h={18} r={7} />
            <Block w={46} h={46} r={999} />
          </div>
          <div style={{ flex: 1, padding: "26px 30px" }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Block key={i} w={i % 3 === 2 ? "70%" : "100%"} h={14} r={7} mt={i === 0 ? 0 : 14} />
            ))}
          </div>
        </Panel>

        <Panel style={{ width: 316, flex: "none", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Block w={38} h={38} r={10} />
            <div style={{ flex: 1 }}>
              <Block w="70%" h={14} r={7} />
              <Block w="50%" h={11} r={6} mt={7} />
            </div>
          </div>
          <Block w="100%" h={70} r={12} mt={18} />
          <Block w="80%" h={44} r={12} mt={12} />
        </Panel>
      </div>
      <span style={SRONLY}>Loading…</span>
    </div>
  );
}
