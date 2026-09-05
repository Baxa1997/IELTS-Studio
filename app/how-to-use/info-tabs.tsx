"use client";

import { useState } from "react";

import {
  BODY,
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  INK,
  LINE,
  MUTED,
  RADIUS,
  SANS,
  WELL,
  WHITE,
} from "@/app/_landing/design";

import type { InfoTab } from "./docs-ui";

/**
 * The documentation's tabs.
 *
 * They EXPLAIN rather than navigate. The first version of these pages made every
 * row a link to a marketing page or to /sign-up, so a reader asking "what can
 * this do?" was bounced somewhere else to find out — and the deepest questions
 * had no page to point at anyway. Now the answer is on the page: pick a tab,
 * read what the platform does.
 *
 * Client-side because the tab is local UI state. It renders the first tab's
 * content on the server, so the page is complete without JavaScript and useful
 * to a crawler.
 */
export function InfoTabs({ tabs }: { tabs: InfoTab[] }) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div style={{ marginTop: 20 }}>
      {/* tab strip */}
      <div
        role="tablist"
        aria-label="What the platform does"
        style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
      >
        {tabs.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.title}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => setActive(i)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: on ? 700 : 600,
                color: on ? BRAND : BODY,
                background: on ? BRAND_TINT : WHITE,
                border: `1px solid ${on ? BRAND_TINT_LINE : LINE}`,
                borderRadius: RADIUS.pill,
                padding: "11px 20px",
                whiteSpace: "nowrap",
              }}
            >
              <span aria-hidden style={{ fontSize: 15 }}>
                {t.icon}
              </span>
              {t.title}
            </button>
          );
        })}
      </div>

      {/* panel */}
      <div
        role="tabpanel"
        style={{
          border: `1px solid ${LINE}`,
          borderRadius: 20,
          background: WHITE,
          padding: "clamp(24px,3vw,32px)",
          marginTop: 18,
        }}
      >
        <h3
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 22,
            margin: 0,
            color: INK,
            letterSpacing: "-0.01em",
          }}
        >
          {tab.title}
        </h3>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: BODY, margin: "10px 0 0", maxWidth: 700 }}>
          {tab.lede}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 18,
            marginTop: 26,
          }}
        >
          {tab.points.map((p) => (
            <div
              key={p.title}
              style={{
                background: WELL,
                border: `1px solid ${LINE}`,
                borderRadius: 14,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 16,
                  color: INK,
                }}
              >
                {p.title}
                {p.soon ? (
                  <span
                    style={{
                      background: "#f4f5f7",
                      color: MUTED,
                      borderRadius: RADIUS.pill,
                      padding: "3px 9px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}
                  >
                    SOON
                  </span>
                ) : null}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: BODY, margin: "8px 0 0" }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
