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
  STRONG,
  WELL,
  WHITE,
} from "@/app/_landing/design";

import type { InfoTab } from "./docs-ui";

/**
 * The documentation's tabs — the WHOLE of each guide's body lives in here.
 *
 * Two decisions worth keeping:
 *
 * 1. THEY EXPLAIN RATHER THAN NAVIGATE. The first version made every row a link
 *    to a marketing page or to /sign-up, so a reader asking "what can this do?"
 *    was bounced somewhere else to find out. Now the answer is on the page.
 *
 * 2. EVERY PANEL IS IN THE HTML; the inactive ones are `hidden`. Rendering only
 *    the active panel would have put Writing in the markup and left Reading,
 *    Listening and Speaking out of it — which is exactly the "ChatGPT only sees
 *    Writing" problem the marketing pages were rebuilt to fix. `hidden` is also
 *    the correct ARIA tab pattern, so this costs nothing.
 *
 * Client-side because the active tab is local UI state. The panels themselves
 * are server-rendered and passed in, so nothing else on the page ships to the
 * browser.
 */
export function InfoTabs({ tabs, label = "What the platform does" }: { tabs: InfoTab[]; label?: string }) {
  const [active, setActive] = useState(0);

  return (
    <div style={{ marginTop: 20 }}>
      {/* tab strip */}
      <div role="tablist" aria-label={label} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {tabs.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.title}
              id={`tab-${slug(t.title)}`}
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${slug(t.title)}`}
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

      {/* every panel is rendered; the inactive ones are hidden */}
      {tabs.map((tab, i) => (
        <div
          key={tab.title}
          id={`panel-${slug(tab.title)}`}
          role="tabpanel"
          aria-labelledby={`tab-${slug(tab.title)}`}
          hidden={i !== active}
          style={{
            border: `1px solid ${LINE}`,
            borderRadius: 20,
            background: WHITE,
            padding: "clamp(24px,3vw,32px)",
            marginTop: 18,
          }}
        >
          <h2
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
          </h2>
          <p
            style={{ fontSize: 17, lineHeight: 1.6, color: BODY, margin: "10px 0 0", maxWidth: 720 }}
          >
            {tab.lede}
          </p>

          {tab.how ? (
            <div
              style={{
                marginTop: 22,
                background: BRAND_TINT,
                border: `1px solid ${BRAND_TINT_LINE}`,
                borderRadius: 16,
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: BRAND,
                }}
              >
                How a task is generated
              </div>
              <p
                style={{
                  fontSize: 15.5,
                  lineHeight: 1.7,
                  color: STRONG,
                  margin: "10px 0 0",
                  maxWidth: 720,
                  textWrap: "pretty",
                }}
              >
                {tab.how}
              </p>
            </div>
          ) : null}

          {tab.content ?? null}

          {tab.points?.length ? (
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
          ) : null}
        </div>
      ))}
    </div>
  );
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
