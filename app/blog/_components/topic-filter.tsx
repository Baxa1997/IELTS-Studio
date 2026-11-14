"use client";

import { useState } from "react";

import { ctaPill, outlinePill } from "@/app/_landing/_lib/design";

/**
 * The blog front page's topic chips: "All", then one per category that has a
 * story, each with its count. Choosing one hides the cards of the others.
 *
 * ⚠️ IT HIDES, IT DOES NOT RE-RENDER. The cards are server components (the
 * cover goes through next/image, the dates are formatted on the server) and
 * arrive here as `children`, already rendered. Each sits in a
 * `data-topic="<category>"` wrapper (`TopicItem` below), and choosing a topic
 * writes one CSS rule that hides every wrapper of another topic. So the page
 * stays static, every story stays in the HTML for a crawler, and with no
 * JavaScript at all the reader simply sees them all.
 *
 * The labels are passed in as strings: /blog renders its chrome from the
 * English dictionary on the server (see page.tsx) and has no locale provider
 * for a client component to read.
 */
export interface Topic {
  id: string;
  label: string;
  count: number;
}

export function TopicFilter({
  topics,
  allLabel,
  groupLabel,
  children,
}: {
  topics: Topic[];
  allLabel: string;
  /** The chip row's accessible name. */
  groupLabel: string;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const chip = (on: boolean): React.CSSProperties => ({
    ...(on ? ctaPill() : outlinePill()),
    // `ctaPill` has no border and `outlinePill` a 1.5px one; give the filled
    // chip a transparent one so a chip does not change size when chosen.
    ...(on ? { border: "1.5px solid transparent", padding: "7.5px 16.5px" } : {}),
    cursor: "pointer",
  });
  return (
    <>
      {/* `topics` are our own category ids, never reader input. */}
      {active ? <style>{`[data-topic]:not([data-topic="${active}"]){display:none!important}`}</style> : null}
      <div role="group" aria-label={groupLabel} style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "0 0 28px" }}>
        <button type="button" aria-pressed={active === null} onClick={() => setActive(null)} style={chip(active === null)}>
          {allLabel}
        </button>
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={active === t.id}
            onClick={() => setActive(active === t.id ? null : t.id)}
            style={chip(active === t.id)}
          >
            {t.label} · {t.count}
          </button>
        ))}
      </div>
      {children}
    </>
  );
}

/** One card's wrapper. `display: contents` keeps the card itself the grid's
 *  item, so the grid and its phone layout are exactly as without the filter. */
export function TopicItem({ topic, children }: { topic: string; children: React.ReactNode }) {
  return (
    <div data-topic={topic} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
