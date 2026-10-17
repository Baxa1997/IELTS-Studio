"use client";

import { useEffect, useId, useRef, useState } from "react";

import { CTA_FILL, FIELD, INK, PANEL, SANS, WHITE } from "@/app/_landing/_lib/design";
import { withAlpha } from "@/lib/theme/tokens";

/**
 * The CEFR list as tabs — Reading | Writing (owner, 2026-10-17: "CEFR
 * practice make tab style").
 *
 * ⚠️ BOTH PANELS ARE RENDERED; the inactive one is only `hidden`. The panels
 * arrive from the server already drawn, so the page's HTML still carries all
 * twenty practices — the list a crawler reads and the structured data names —
 * and switching is instant, with nothing to fetch.
 *
 * A tab is addressable, as on /how-to-use: /practice/cefr#writing opens
 * Writing, and switching rewrites the hash with `replaceState` so the view can
 * be linked without the page jumping. Read in an effect, because the server
 * has no hash and would disagree with the client about the markup.
 */
export function PaperTabs({
  label,
  tabs,
  initial,
}: {
  label: string;
  tabs: { id: string; label: string; count: number; panel: React.ReactNode }[];
  initial: string;
}) {
  const [active, setActive] = useState(initial);
  const base = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const ids = tabs.map((tab) => tab.id).join(" ");

  useEffect(() => {
    const known = ids.split(" ");
    const apply = () => {
      const want = window.location.hash.replace(/^#/, "");
      if (known.includes(want)) setActive(want);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [ids]);

  function select(i: number) {
    setActive(tabs[i].id);
    window.history.replaceState(null, "", `#${tabs[i].id}`);
  }

  /** Arrow keys, Home and End move between the tabs, as a tablist should. */
  function onKeyDown(e: React.KeyboardEvent) {
    const at = tabs.findIndex((tab) => tab.id === active);
    const last = tabs.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = at === last ? 0 : at + 1;
    else if (e.key === "ArrowLeft") next = at === 0 ? last : at - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    select(next);
    buttons.current[next]?.focus();
  }

  return (
    <>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          borderRadius: 999,
          border: `1px solid ${FIELD}`,
          background: PANEL,
          marginBottom: "clamp(24px,3.5vw,34px)",
        }}
      >
        {tabs.map((tab, i) => {
          const on = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(i)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: 0,
                borderRadius: 999,
                padding: "10px 20px",
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 700,
                background: on ? CTA_FILL : "transparent",
                color: on ? WHITE : INK,
              }}
            >
              {tab.label}
              <span
                aria-hidden
                style={{
                  minWidth: 22,
                  padding: "1px 7px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  background: on ? withAlpha(WHITE, 22) : withAlpha(INK, 8),
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.panel}
        </div>
      ))}
    </>
  );
}
