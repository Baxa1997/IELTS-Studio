import { BandCountUp } from "@/components/landing/band-countup";

import {
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  GREEN,
  INK,
  LINE,
  MUTED,
  RADIUS,
  SANS,
  WHITE,
} from "./design";

/**
 * The hero's Band-9 examiner card — OURS, kept, recoloured.
 *
 * The design canvas draws its own version of this card: same idea, simpler, with
 * a flat "9" and a four-cell criteria grid. The owner's instruction was explicit
 * — take the rest of the page from the canvas, but keep THIS element as we built
 * it and change only its colour. So what survives from the original is
 * everything that made it ours:
 *
 *   · the animated `BandCountUp` climbing the real half-bands to a 9,
 *   · the mortarboard, drawn rather than emoji'd,
 *   · the "Recognised for admission at" university strip.
 *
 * and what changes is the palette (indigo → burgundy) plus the card shell, which
 * now matches the canvas: 24px radius, #e6e8ec hairline, the canvas's shadow.
 * The cream/parchment tones the old card used (#EFEDE3, #9e9b90, #57564d) came
 * from the previous brand and have gone with it.
 */
export function Band9Card() {
  return (
    <div style={{ position: "relative" }}>
      {/* the floating accent, anchored to the card's top edge */}
      <div
        style={{
          position: "absolute",
          top: -16,
          right: 18,
          zIndex: 2,
          background: WHITE,
          border: `1px solid ${LINE}`,
          boxShadow: "0 8px 24px rgba(18,19,23,0.07)",
          borderRadius: RADIUS.pill,
          padding: "10px 18px",
          fontSize: 13,
          fontWeight: 700,
          color: GREEN,
          display: "flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
        }}
      >
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN }} />
        Band 9 achievable
      </div>

      <div
        style={{
          background: WHITE,
          border: `1px solid ${LINE}`,
          borderRadius: RADIUS.card,
          boxShadow: "0 24px 60px rgba(18,19,23,0.08)",
          padding: 30,
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            aria-hidden
            style={{
              width: 38,
              height: 38,
              borderRadius: RADIUS.icon,
              background: BRAND,
              color: WHITE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: INK }}>
              Examiner Result
            </div>
            <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>Verified · calibrated</div>
          </div>
          <span
            style={{
              marginLeft: "auto",
              border: `1px solid ${BRAND_TINT_LINE}`,
              background: BRAND_TINT,
              color: BRAND,
              borderRadius: RADIUS.badge,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            AI
          </span>
        </div>

        {/* the band — the mortarboard, then the live number */}
        <div style={{ textAlign: "center", padding: "22px 0 6px" }}>
          <Mortarboard />
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.24em",
              color: MUTED,
              marginTop: 10,
            }}
          >
            OVERALL BAND
          </div>
          <BandCountUp />
          <div
            style={{
              fontSize: 15,
              color: "#4a505c",
              maxWidth: 330,
              margin: "14px auto 0",
              lineHeight: 1.55,
              textWrap: "pretty",
            }}
          >
            The band a Cambridge-trained examiner would award — and the exact path to reach it.
          </div>
        </div>

        {/* per-skill chips */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 14,
          }}
        >
          {["Writing 9", "Reading 9", "CEFR C2"].map((t) => (
            <span
              key={t}
              style={{
                background: BRAND_TINT,
                color: BRAND,
                borderRadius: RADIUS.pill,
                padding: "9px 18px",
                fontSize: 14,
                fontWeight: 700,
                whiteSpace: "nowrap",
                fontFamily: SANS,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* The university strip, commented out by the owner. To bring it back,
            restore `HAIR` to the token import above — it is the only binding in
            here that nothing else uses. */}
        {/* <div style={{ borderTop: `1px solid ${HAIR}`, marginTop: 26, paddingTop: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: MUTED,
              textAlign: "center",
            }}
          >
            RECOGNISED FOR ADMISSION AT
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              columnGap: 18,
              rowGap: 10,
              marginTop: 14,
            }}
          >
            {[
              { src: "/logos/mit.webp", alt: "MIT", w: 122 },
              { src: "/logos/harvard.webp", alt: "Harvard", w: 161 },
              { src: "/logos/stanford.webp", alt: "Stanford", w: 164 },
              { src: "/logos/columbia.webp", alt: "Columbia", w: 194 },
            ].map((u) => (
              <img
                key={u.alt}
                src={u.src}
                alt={u.alt}
                width={u.w}
                height={80}
                decoding="async"
                style={{ height: 40, width: "auto", objectFit: "contain", display: "block" }}
              />
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}

/**
 * The drawn mortarboard. Recoloured from the old navy/indigo board to the
 * burgundy; the gold tassel stays, because gold is what a tassel is and it reads
 * against burgundy as well as it did against navy.
 */
function Mortarboard() {
  return (
    <div style={{ width: 98, margin: "0 auto" }} className="lp-cap">
      <svg
        aria-hidden
        width="118"
        height="96"
        viewBox="0 0 128 104"
        fill="none"
        style={{
          display: "block",
          margin: "0 auto",
          filter: "drop-shadow(0 12px 18px rgba(60,6,26,.24))",
        }}
      >
        <defs>
          <linearGradient
            id="cap-board"
            x1="20"
            y1="28"
            x2="112"
            y2="74"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#9C1442" />
            <stop offset="1" stopColor="#42011D" />
          </linearGradient>
          <linearGradient
            id="cap-crown"
            x1="44"
            y1="48"
            x2="86"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7D0132" />
            <stop offset="1" stopColor="#360117" />
          </linearGradient>
          <linearGradient
            id="cap-tassel"
            x1="110"
            y1="50"
            x2="120"
            y2="90"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F2CB60" />
            <stop offset="1" stopColor="#C68F2A" />
          </linearGradient>
        </defs>
        <ellipse cx="62" cy="96" rx="30" ry="5" fill="rgba(60,6,26,.10)" />
        <path d="M40 48 L40 64 Q40 78 64 78 Q88 78 88 64 L88 48 Z" fill="url(#cap-crown)" />
        <polygon points="64,26 120,50 64,72 8,50" fill="url(#cap-board)" />
        <polygon points="64,26 8,50 64,50" fill="rgba(255,255,255,.15)" />
        <polygon points="64,26 120,50 64,50" fill="rgba(255,255,255,.06)" />
        <circle cx="64" cy="50" r="4" fill="url(#cap-tassel)" />
        <circle cx="64" cy="50" r="1.7" fill="#9A6E1E" />
        <path
          d="M64 50 Q104 49 117 53 L117 66"
          stroke="url(#cap-tassel)"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="117" cy="67" r="3.4" fill="url(#cap-tassel)" />
        <path
          d="M113 68 L112 87 M116 70 L115 89 M118 69 L120 88 M120 67 L122 85"
          stroke="url(#cap-tassel)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
