"use client";

import { Building2, CheckCheck, ListChecks, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BRAND, BRAND_TINT, BRAND_TINT_LINE, DISPLAY, INK, LINE, MUTED, RADIUS } from "./design";

type IconName = "users" | "centers" | "tasks" | "checks";

const ICONS = {
  users: Users,
  centers: Building2,
  tasks: ListChecks,
  checks: CheckCheck,
} as const;

export function LiveStat({
  label,
  value,
  suffix = "",
  note,
  icon,
  brand = false,
  delta,
  isLast = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  note: string;
  icon: IconName;
  brand?: boolean;
  delta?: string;
  isLast?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(value);
  const Icon = ICONS[icon];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    let started = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (started) return;
      started = true;
      if (reduceMotion) return;

      const start = performance.now();
      const duration = 1100;
      setCount(0);

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      run();
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <div
      ref={ref}
      className="lp-live-stat"
      style={{
        padding: "30px 28px",
        borderRight: !isLast ? `1px solid ${LINE}` : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, ...statLabel() }}>
          {label}
        </span>
        <span
          className="lp-live-icon"
          aria-hidden
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            flex: "none",
            border: `1px solid ${BRAND_TINT_LINE}`,
            borderRadius: RADIUS.icon,
            background: BRAND_TINT,
            color: BRAND,
          }}
        >
          <span className="lp-live-pulse" />
          <Icon size={16} strokeWidth={2.2} />
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 12,
        }}
      >
        <div
          aria-label={`${value}${suffix}`}
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: "-0.03em",
            color: brand ? BRAND : INK,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count.toLocaleString()}{suffix}
        </div>
        {delta ? (
          <span
            style={{
              background: "#eaf6f0",
              color: "#1c7a4f",
              borderRadius: RADIUS.pill,
              padding: "5px 11px",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            ▲ {delta}
          </span>
        ) : null}
      </div>
      <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>{note}</div>

    </div>
  );
}

export function LiveStatsStyles() {
  return <style>{LIVE_STAT_CSS}</style>;
}

function statLabel(): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: MUTED,
  };
}

const LIVE_STAT_CSS = `
.lp-live-icon{animation:lp-stat-float 2.8s ease-in-out infinite}
.lp-live-pulse{position:absolute;right:-3px;top:-3px;width:8px;height:8px;border-radius:50%;background:${BRAND};box-shadow:0 0 0 0 rgba(125,1,50,.35);animation:lp-stat-pulse 2s ease-out infinite}
@keyframes lp-stat-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes lp-stat-pulse{0%{box-shadow:0 0 0 0 rgba(125,1,50,.35)}70%{box-shadow:0 0 0 7px rgba(125,1,50,0)}100%{box-shadow:0 0 0 0 rgba(125,1,50,0)}}
@media (max-width: 760px){.lp-live-stat{border-right:0!important;border-bottom:1px solid ${LINE}}.lp-live-stat:last-child{border-bottom:0!important}}
@media (prefers-reduced-motion:reduce){.lp-live-icon,.lp-live-pulse{animation:none}}
`;
