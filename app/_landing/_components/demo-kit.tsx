"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { bandColor as productBandColor } from "@/lib/ui/band";
import {
  BRAND,
  BRAND as INDIGO,
  BRAND_SOFT,
  BRAND_SOFT as V_BG,
  ON_INK,
  PANEL,
  SLATE_GREEN,
  SLATE_INK as INK,
  SLATE_MUTED,
  WARM_RULE,
  WELL,
  WHITE,
} from "@/lib/theme/tokens";

export const SANS = "var(--font-manrope), system-ui, sans-serif";
export const SERIF = "var(--font-sora), system-ui, sans-serif";
export const MONO = "var(--font-jetbrains), ui-monospace, SFMono-Regular, Menlo, monospace";
// The listening runner uses DM Sans; fall back to the marketing sans if the var
// isn't loaded on a given page.
export const LSANS = "var(--font-manrope), system-ui, sans-serif";

/**
 * Band colours for the MARKETING mock screens only.
 *
 * `lib/ui/band.ts` is the product's single source of truth and the real result
 * screens read from it — writing feedback, both reading runners, the speaking
 * report. Its "Competent" tier (band 6–6.9) is indigo `#4338CA` on `#ECEBFB`,
 * which is correct in the app and wrong on this page: it was the one purple the
 * recolour could not reach, because reaching it would have repainted a chip
 * inside the signed-in product to match a marketing page.
 *
 * So the tier is remapped here instead, for these mocks only. Every other tier
 * (green Expert/Good, amber Modest, red Limited and below) is already
 * brand-neutral and passes through untouched. Delete this the day the product
 * itself moves onto the burgundy.
 */
export function bandColor(band: number) {
  const c = productBandColor(band);
  if (c.label !== "Competent") return c;
  return { ...c, fg: INDIGO, bg: BRAND_SOFT };
}
export const EMERALD = SLATE_GREEN;

// cream studio palette

// listening accent palette — the real runner's violet, mapped onto the
// burgundy scale so the mock screens match the page they sit on
export const V = BRAND;
export const V_SOFT = V_BG;

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Scales a fixed design-size screen down to fit the container width, keeping
 *  the app's real pixel metrics so the replica looks exactly like the product. */
export function Stage({
  w = 1200,
  h = 750,
  children,
}: {
  w?: number;
  h?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useIso(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / w);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${w} / ${h}`,
        overflow: "hidden",
        background: PANEL,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: w,
          height: h,
          transformOrigin: "top left",
          transform: `scale(${scale ?? 1})`,
          visibility: scale == null ? "hidden" : "visible",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** macOS-style browser chrome around a screen (matches the old screenshot frame). */
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${WARM_RULE}`,
        background: PANEL,
        overflow: "hidden",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(18,19,23,.06), 0 24px 48px -24px rgba(18,19,23,.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: "1px solid #EEECE0",
          background: WELL,
        }}
      >
        <span style={{ display: "flex", gap: 6, flex: "none" }}>
          <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
          <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E" }} />
          <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840" }} />
        </span>
        <span
          style={{
            flex: 1,
            maxWidth: 340,
            margin: "0 auto",
            textAlign: "center",
            fontFamily: MONO,
            fontSize: 11.5,
            color: SLATE_MUTED,
            background: WELL,
            borderRadius: 8,
            padding: "4px 12px",
          }}
        >
          engprogress.com
        </span>
        <span style={{ width: 51, flex: "none" }} />
      </div>
      {children}
    </div>
  );
}

// ---- tiny inline icons -----------------------------------------------------

/* ⚠️ THE COLOUR GOES IN `style`, NEVER IN THE `stroke`/`fill` ATTRIBUTE. These
   take tokens now, and a token is a `var(--…)` string: a CSS custom property is
   not valid in an SVG presentation attribute, does not resolve, and renders the
   shape BLACK without throwing or logging. `style` resolves it. Guarded by
   shared/components/practice/svg-vars.test.ts. */
export function Arrow({ c = WHITE, s = 16 }: { c?: string; s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{ stroke: c }}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
export function Check({ c = EMERALD, s = 13 }: { c?: string; s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{ stroke: c }}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
export function Spark({ c = WHITE, s = 16 }: { c?: string; s?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{ stroke: c }}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" />
    </svg>
  );
}
/* `filled` used to be inferred by comparing `c` to the literal "#fff" the
   callers passed. A token is a var() string, so that comparison can never be
   true again — it is an explicit prop now rather than a silent always-filled. */
export function Flame({ c = WHITE, s = 14, filled = true }: { c?: string; s?: number; filled?: boolean }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      style={{ fill: filled ? c : "none", stroke: c }}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A4.5 4.5 0 1 0 16 11c-1.5 2-3 2.5-3 2.5s2-4-3-8c0 0 .5 4-2 6.5" />
    </svg>
  );
}

export function TaskPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 9px",
        borderRadius: 6,
        background: INK,
        color: ON_INK,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".06em",
        flex: "none",
      }}
    >
      {children}
    </span>
  );
}
