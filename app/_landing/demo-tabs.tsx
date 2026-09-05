"use client";

import { useState } from "react";

import type { DemoTab } from "./demo-content";
import { DemoScreen } from "./demo-screens";

// Interactive product showcase: a pill tab bar over a browser-frame card that
// renders a LIVE coded replica of the real product screen (see demo-screens.tsx)
// — not a screenshot. Pure client state, no router dependency, so it drops into
// any page. Styling matches the landing tokens (inline styles, Hanken/Newsreader
// vars provided by the page's `.lp-root` font wrapper).

const SANS = "var(--font-manrope), system-ui, sans-serif";
const SERIF = "var(--font-sora), system-ui, sans-serif";
const INDIGO = "#7d0132";
const INK = "#121317";

export function DemoTabs({
  tabs,
  hashSync = false,
}: {
  tabs: DemoTab[];
  /** On /demo the active tab mirrors the URL hash (deep-linkable, e.g. /demo#reading). */
  hashSync?: boolean;
}) {
  const [active, setActive] = useState(0);

  // THE HASH READ DURING RENDER, not written in from an effect.
  //
  // It was an effect that setState on mount, so the page painted tab one and
  // then jumped to the linked tab — visible on a slow phone, and an extra
  // render every time. Reading it during the first client render and adjusting
  // there means the linked tab is the first thing drawn. Guarded by a ref so it
  // happens once: after that the hash follows the tabs rather than leading
  // them, and re-reading it would fight the user's own clicks. State rather
  // than a ref because refs may not be read during render.
  const [readHash, setReadHash] = useState(false);
  if (hashSync && !readHash && typeof window !== "undefined") {
    setReadHash(true);
    const i = tabs.findIndex((t) => t.slug === window.location.hash.slice(1));
    if (i >= 0 && i !== active) setActive(i);
  }

  const select = (i: number) => {
    setActive(i);
    if (hashSync) history.replaceState(null, "", `#${tabs[i].slug}`);
  };

  const tab = tabs[active];

  return (
    <div>
      {/* pill tab bar */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          role="tablist"
          aria-label="Product demo screens"
          style={{
            display: "flex",
            gap: 4,
            maxWidth: "100%",
            overflowX: "auto",
            padding: 6,
            borderRadius: 16,
            background: "#fff",
            border: "1px solid #E5E2D2",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 8px 24px -16px rgba(18,19,23,.3)",
          }}
        >
          {tabs.map((t, i) => (
            <button
              key={t.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => select(i)}
              style={{
                flex: "none",
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 14.5,
                color: i === active ? INDIGO : "#5a5e78",
                background: i === active ? "#EEF0FF" : "transparent",
                border: "none",
                borderRadius: 11,
                padding: "9px 16px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background .15s, color .15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* active screen — a live coded replica of the real UI */}
      <div style={{ marginTop: 26 }}>
        <DemoScreen slug={tab.slug} />
      </div>
      <div style={{ textAlign: "center", maxWidth: 640, margin: "24px auto 0" }}>
        <h3
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(21px,2.6vw,26px)",
            lineHeight: 1.2,
            letterSpacing: "-.01em",
            color: INK,
            margin: 0,
          }}
        >
          {tab.title}
        </h3>
        <p
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 16,
            lineHeight: 1.6,
            color: "#6b6e84",
            margin: "10px 0 0",
          }}
        >
          {tab.blurb}
        </p>
      </div>
    </div>
  );
}
