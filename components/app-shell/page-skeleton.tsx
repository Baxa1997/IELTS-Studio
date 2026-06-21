/**
 * The instant content skeleton shown inside the app shell while a dynamic page
 * renders on the server. It deliberately mirrors the common page shape (a title,
 * a wide hero card, then a 2-up card row) so the swap to real content doesn't
 * jump. Pure markup + a CSS shimmer (`.lp-skel`) — no client JS.
 */
function Block({ w, h, r = 8, mt = 0 }: { w: number | string; h: number; r?: number; mt?: number }) {
  return <div className="lp-skel" style={{ width: w, height: h, borderRadius: r, marginTop: mt }} aria-hidden />;
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E7E4D6",
        borderLeft: accent ? "3px solid #DCE0F5" : "1px solid #E7E4D6",
        borderRadius: 16,
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div style={{ animation: "lp-fadeup .25s ease both" }} role="status" aria-label="Loading">
      {/* page heading */}
      <Block w={240} h={26} r={9} />
      <Block w={320} h={14} r={7} mt={10} />

      {/* hero / countdown band */}
      <div style={{ marginTop: 18, background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, padding: "22px 24px" }}>
        <Block w={120} h={12} r={6} />
        <Block w={180} h={40} r={10} mt={12} />
        <Block w={260} h={13} r={7} mt={12} />
      </div>

      {/* 2-up cards */}
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {[0, 1].map((i) => (
          <Card key={i} accent={i === 1}>
            <Block w={100} h={12} r={6} />
            <Block w="55%" h={30} r={9} mt={14} />
            <Block w="100%" h={8} r={999} mt={16} />
            <Block w="80%" h={13} r={7} mt={14} />
          </Card>
        ))}
      </div>

      {/* a list/row block */}
      <div style={{ marginTop: 14 }}>
        <Card>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid #F0EEE2" }}>
              <Block w={40} h={40} r={10} />
              <div style={{ flex: 1 }}>
                <Block w={`${60 - i * 8}%`} h={13} r={7} />
                <Block w={`${40 - i * 5}%`} h={11} r={6} mt={8} />
              </div>
              <Block w={56} h={24} r={999} />
            </div>
          ))}
        </Card>
      </div>

      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Loading…</span>
    </div>
  );
}
