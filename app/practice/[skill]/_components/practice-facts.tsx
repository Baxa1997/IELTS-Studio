import { CheckCircle2, Clock, LayoutList } from "lucide-react";

import { BRAND, BRAND_TINT, INK, LINE, MUTED, PANEL, SANS } from "@/app/_landing/_lib/design";

import type { FactKind } from "../_lib/facts";

/** Coloured by the chip's `color` through `currentColor` — never the SVG's own
 *  attribute, where a token's var() renders black (svg-vars.test.ts). */
const ICON: Record<FactKind, React.ReactNode> = {
  format: <LayoutList size={18} strokeWidth={2} aria-hidden />,
  time: <Clock size={18} strokeWidth={2} aria-hidden />,
  marking: <CheckCircle2 size={18} strokeWidth={2} aria-hidden />,
};

/**
 * What a practice is, as three facts — a definition list, so a reader scans it
 * and an answer engine can lift each fact with its label.
 */
export function PracticeFacts({
  facts,
  label,
}: {
  facts: { kind: FactKind; label: string; value: string }[];
  label: string;
}) {
  return (
    <dl
      aria-label={label}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(230px,100%),1fr))",
        gap: 12,
        maxWidth: 960,
        margin: "clamp(22px,3vw,30px) 0 0",
      }}
    >
      {facts.map((f) => (
        <div
          key={f.kind}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "14px 16px",
            borderRadius: 14,
            border: `1px solid ${LINE}`,
            background: PANEL,
          }}
        >
          <span
            aria-hidden
            style={{
              flex: "none",
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: BRAND_TINT,
              color: BRAND,
            }}
          >
            {ICON[f.kind]}
          </span>
          <div style={{ minWidth: 0 }}>
            <dt
              style={{
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              {f.label}
            </dt>
            <dd
              style={{
                margin: "3px 0 0",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.4,
                color: INK,
              }}
            >
              {f.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
