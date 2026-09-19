"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { useT } from "@/components/i18n/locale-provider";

import type { DemoTab } from "./demo-content";
import {
  BRAND as INDIGO,
  BRAND_SOFT,
  PANEL,
  SLATE_BODY,
  SLATE_INK as INK,
  WARM_RULE,
  WELL,
} from "@/lib/theme/tokens";

const DeferredDemoScreen = dynamic(() => import("./demo-screens").then((mod) => mod.DemoScreen), {
  ssr: false,
  loading: () => <DemoScreenPlaceholder />,
});

// Interactive product showcase: a pill tab bar over a browser-frame card that
// renders a LIVE coded replica of the real product screen (see demo-screens.tsx)
// — not a screenshot. Pure client state, no router dependency, so it drops into
// any page. Styling matches the landing tokens (inline styles, Hanken/Newsreader
// vars provided by the page's `.lp-root` font wrapper).

const SANS = "var(--font-manrope), system-ui, sans-serif";
const SERIF = "var(--font-sora), system-ui, sans-serif";

export function DemoTabs({
  tabs,
  hashSync = false,
}: {
  tabs: DemoTab[];
  /** On /demo the active tab mirrors the URL hash (deep-linkable, e.g. /demo#reading). */
  hashSync?: boolean;
}) {
  const t = useT();
  const [active, setActive] = useState(0);
  const demoRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = demoRef.current;
    if (!node || !("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
          aria-label={t("demo.screens")}
          style={{
            display: "flex",
            gap: 4,
            maxWidth: "100%",
            overflowX: "auto",
            padding: 6,
            borderRadius: 16,
            background: PANEL,
            border: `1px solid ${WARM_RULE}`,
            boxShadow: "var(--mk-island-shadow)",
          }}
        >
          {tabs.map((d, i) => (
            <button
              key={d.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => select(i)}
              style={{
                flex: "none",
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 14.5,
                color: i === active ? INDIGO : SLATE_BODY,
                background: i === active ? BRAND_SOFT : "transparent",
                border: "none",
                borderRadius: 11,
                padding: "9px 16px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background .15s, color .15s",
              }}
            >
              {t(d.label)}
            </button>
          ))}
        </div>
      </div>

      {/* active screen — a live coded replica of the real UI */}
      <div ref={demoRef} style={{ marginTop: 26 }}>
        {ready ? <DeferredDemoScreen slug={tab.slug} /> : <DemoScreenPlaceholder />}
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
          {t(tab.title)}
        </h3>
        <p
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 16,
            lineHeight: 1.6,
            color: SLATE_BODY,
            margin: "10px 0 0",
          }}
        >
          {t(tab.blurb)}
        </p>
      </div>
    </div>
  );
}

function DemoScreenPlaceholder() {
  const t = useT();

  return (
    <div
      aria-busy="true"
      aria-label={t("demo.loading")}
      style={{
        minHeight: 420,
        borderRadius: 18,
        border: `1px solid ${WARM_RULE}`,
        background: `linear-gradient(110deg,${WELL} 8%,${PANEL} 18%,${WELL} 33%)`,
        backgroundSize: "200% 100%",
        animation: "lp-demo-shimmer 1.6s linear infinite",
      }}
    />
  );
}
