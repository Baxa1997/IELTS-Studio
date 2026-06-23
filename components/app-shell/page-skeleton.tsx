/**
 * Instant content skeletons shown inside the app shell while a dynamic page renders
 * on the server. Each variant deliberately mirrors the shape of the page it stands
 * in for, so the swap to real content doesn't jump. Pure markup + a CSS shimmer
 * (`.lp-skel`) — no client JS. Each route's `loading.tsx` picks the matching variant;
 * `PageSkeleton` is the group-wide default (dashboard-shaped).
 */
export function Block({ w, h, r = 8, mt = 0 }: { w: number | string; h: number; r?: number; mt?: number }) {
  return <div className="lp-skel" style={{ width: w, height: h, borderRadius: r, marginTop: mt }} aria-hidden />;
}

export function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
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

const FADE: React.CSSProperties = { animation: "lp-fadeup .25s ease both" };
const SRONLY: React.CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" };

function Heading({ titleW = 240, subW = 320 }: { titleW?: number; subW?: number }) {
  return (
    <>
      <Block w={titleW} h={26} r={9} />
      <Block w={subW} h={14} r={7} mt={10} />
    </>
  );
}

/** A vertical run of list rows (icon + two lines + trailing pill) inside one card. */
function Rows({ n = 3 }: { n?: number }) {
  return (
    <Card>
      {Array.from({ length: n }).map((_, i) => (
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
  );
}

/** Default (dashboard-shaped): heading → hero band → 2-up cards → a list. */
export function PageSkeleton() {
  return (
    <div style={FADE} role="status" aria-label="Loading">
      <Heading />
      <div style={{ marginTop: 18, background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, padding: "22px 24px" }}>
        <Block w={120} h={12} r={6} />
        <Block w={180} h={40} r={10} mt={12} />
        <Block w={260} h={13} r={7} mt={12} />
      </div>
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
      <div style={{ marginTop: 14 }}>
        <Rows />
      </div>
      <span style={SRONLY}>Loading…</span>
    </div>
  );
}

/** A history/list page: heading → one or two titled sections, each a card of rows. */
export function ListSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div style={FADE} role="status" aria-label="Loading">
      <Heading titleW={200} subW={360} />
      {Array.from({ length: sections }).map((_, s) => (
        <div key={s} style={{ marginTop: 22 }}>
          <Block w={130} h={15} r={7} />
          <div style={{ marginTop: 12 }}>
            <Rows n={3} />
          </div>
        </div>
      ))}
      <span style={SRONLY}>Loading…</span>
    </div>
  );
}

/** A chooser/hub page: heading → optional tab row → a grid of cards. */
export function CardsSkeleton({ cards = 4, tabs = false }: { cards?: number; tabs?: boolean }) {
  return (
    <div style={FADE} role="status" aria-label="Loading">
      <Heading titleW={220} subW={420} />
      {tabs ? (
        <div style={{ display: "flex", gap: 7, marginTop: 22, flexWrap: "wrap" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Block key={i} w={64} h={38} r={10} />
          ))}
        </div>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14, marginTop: tabs ? 16 : 26 }}>
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Block w="55%" h={16} r={7} />
              <Block w={48} h={18} r={999} />
            </div>
            <Block w="100%" h={12} r={6} mt={16} />
            <Block w="85%" h={12} r={6} mt={9} />
            <Block w={110} h={14} r={7} mt={18} />
          </Card>
        ))}
      </div>
      <span style={SRONLY}>Loading…</span>
    </div>
  );
}

/** A launcher/detail page: heading → one tall hero card → a supporting card. */
export function LauncherSkeleton({ narrow = false }: { narrow?: boolean }) {
  return (
    <div style={{ ...FADE, maxWidth: narrow ? 720 : undefined, margin: narrow ? "0 auto" : undefined }} role="status" aria-label="Loading">
      <Heading titleW={260} subW={narrow ? 520 : 360} />
      <div style={{ marginTop: 20, background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, padding: "26px 26px" }}>
        <Block w={120} h={12} r={6} />
        <Block w="70%" h={22} r={9} mt={14} />
        <Block w="100%" h={13} r={7} mt={16} />
        <Block w="92%" h={13} r={7} mt={9} />
        <Block w={170} h={44} r={12} mt={22} />
      </div>
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {[0, 1].map((i) => (
          <Card key={i}>
            <Block w="50%" h={14} r={7} />
            <Block w="70%" h={24} r={9} mt={12} />
            <Block w="100%" h={8} r={999} mt={16} />
          </Card>
        ))}
      </div>
      <span style={SRONLY}>Loading…</span>
    </div>
  );
}
