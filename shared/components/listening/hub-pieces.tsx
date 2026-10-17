"use client";

import { PRACTICE_GRID_COLUMNS } from "@/lib/practice/grid";
import { BRAND, INK, MUTED, SANS } from "./theme";
import { BRAND_LIGHT, PANEL, SLATE_MUTED } from "@/lib/theme/tokens";

// ---- Hub pieces (visual language shared with the Reading hub) ------------------

export function TabButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: active ? PANEL : "transparent",
        color: active ? BRAND : MUTED,
        boxShadow: active ? "0 2px 8px -3px rgba(28,27,46,.28)" : "none",
        transition: "background .15s ease",
      }}
    >
      <span style={{ display: "flex", flex: "none", color: active ? BRAND : SLATE_MUTED }}>
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontFamily: SANS, fontWeight: active ? 700 : 600, fontSize: 14.5 }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: active ? BRAND_LIGHT : SLATE_MUTED,
            marginTop: 2,
          }}
        >
          {sub}
        </span>
      </span>
    </button>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 14px" }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>
        {children}
      </span>
      <span style={{ height: 1, flex: 1, background: "var(--ex-hub-rule)" }} />
    </div>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: PRACTICE_GRID_COLUMNS,
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ marginTop: 18, fontSize: 13.5, color: SLATE_MUTED, fontFamily: SANS }}>
      {children}
    </p>
  );
}
