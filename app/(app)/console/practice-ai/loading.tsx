import { HERO_SKY, PAPER, SANS } from "@/lib/lessons/theme";

/**
 * What Practice AI looks like before the server has answered.
 *
 * The (app) group already has a `loading.tsx`, but its skeleton is drawn for a
 * PADDED console page — a card, a table, a row of filters. Practice AI drops
 * the console's padding and owns the surface, so that fallback flashed a shape
 * this route never takes and the swap read as two navigations rather than one.
 *
 * What it draws is only the furniture that is identical on every visit: the
 * sky, the composer's silhouette, and three card outlines. Nothing here
 * pretends to know the lesson titles — a skeleton that guesses at content is
 * worse than one that admits it is waiting.
 *
 * This is also the whole answer to "navigation feels heavy". These pages are
 * `force-dynamic`, so without a boundary the browser sits on the PREVIOUS page,
 * doing nothing visible, until the queries finish. The click had already
 * happened and the app looked broken. With it, the click commits immediately.
 */
export default function Loading() {
  return (
    <div style={{ background: PAPER, minHeight: "100%", fontFamily: SANS }}>
      <div className="pa-hero-pad" style={{ background: HERO_SKY, padding: "58px 28px 76px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", textAlign: "center" }}>
          <Bar w={260} h={33} radius={999} center />
          <Bar w="min(620px, 90%)" h={54} style={{ margin: "26px auto 12px" }} />
          <Bar w="min(430px, 70%)" h={54} style={{ margin: "0 auto 22px" }} />
          <Bar w="min(360px, 60%)" h={22} center />
        </div>

        <div
          style={{
            maxWidth: 880,
            margin: "42px auto 0",
            height: 210,
            borderRadius: 30,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 1px 2px rgba(20,35,46,.05), 0 30px 60px -28px rgba(20,35,46,.28)",
          }}
        />
      </div>

      <div className="pa-hero-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 28px 90px" }}>
        <Bar w={190} h={34} />
        <div className="pa-grid" style={{ marginTop: 30 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                borderRadius: 26,
                background: "#fff",
                overflow: "hidden",
                boxShadow: "0 1px 2px rgba(20,35,46,.05), 0 16px 34px -24px rgba(20,35,46,.35)",
              }}
            >
              <div style={{ height: 108, background: "#eeeeeb" }} />
              <div style={{ padding: "20px 22px 22px" }}>
                <Bar w="45%" h={12} />
                <Bar w="90%" h={22} style={{ marginTop: 12 }} />
                <Bar w="65%" h={22} style={{ marginTop: 7 }} />
                <Bar w="40%" h={13} style={{ marginTop: 18 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One grey block. `pa-shimmer` carries the only motion, and it is a background
 *  animation rather than a transform — nothing here should reflow. */
function Bar({
  w,
  h,
  radius = 10,
  center,
  style,
}: {
  w: number | string;
  h: number;
  radius?: number;
  center?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="pa-shimmer"
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        ...(center ? { marginLeft: "auto", marginRight: "auto" } : null),
        ...style,
      }}
    />
  );
}
