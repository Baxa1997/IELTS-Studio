"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import {
  BODY,
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  eyebrow,
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
 * The guide's navigation AND its body — THE LEFT SIDEBAR IS THE TAB LIST.
 *
 * Owner's call, and it took three goes to get right, so the history is worth
 * keeping. The first version made every sidebar row a link to a marketing page,
 * so a reader asking "what can this do?" was bounced elsewhere to find out. The
 * second turned the rows into dead text and put a horizontal pill strip inside
 * the page. Both were wrong: the sidebar rows ARE the tabs, they are clickable,
 * and clicking one swaps the panel beside it. There is no second tab strip.
 *
 * Sidebar and panels therefore live in ONE client component, because they share
 * the active-tab state. Everything else on the page — the heading, the panels'
 * contents, the bands underneath — is server-rendered and passed in as props,
 * so this file is all that ships to the browser.
 *
 * EVERY PANEL IS IN THE HTML; the inactive ones carry `hidden`. Rendering only
 * the active panel would have shipped Writing to crawlers and left Reading,
 * Listening, Speaking and CEFR out of it — exactly the "ChatGPT only sees
 * Writing" problem the marketing pages were rebuilt to fix. `hidden` is also
 * the correct ARIA tab pattern, so it costs nothing.
 */

export interface DocsTabsProps {
  tabs: InfoTab[];
  /** Accessible name for the tab list, e.g. "How to use EngProgress". */
  label: string;
  /** The one real link in the sidebar: the route across to the other guide. */
  elsewhere: { label: string; href: string };
  /** Server-rendered page heading, above the panel. */
  head: React.ReactNode;
  /** Server-rendered bands below the panel (register CTA, cross-link). */
  footer?: React.ReactNode;
}

export function DocsTabs({ tabs, label, elsewhere, head, footer }: DocsTabsProps) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  /** Arrow keys move between tabs, as a vertical tablist is expected to. */
  function onKeyDown(e: React.KeyboardEvent) {
    const last = tabs.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  }

  return (
    <>
      <aside
        style={{
          flex: "0 1 250px",
          minWidth: 220,
          padding: "52px 0 80px",
          alignSelf: "flex-start",
          position: "sticky",
          top: 0,
        }}
      >
        <div style={eyebrow()}>On this page</div>
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label={label}
          onKeyDown={onKeyDown}
          style={{
            borderLeft: `1px solid ${LINE}`,
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {tabs.map((t, i) => {
            const on = i === active;
            return (
              <button
                key={t.title}
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                id={`tab-${slug(t.title)}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`panel-${slug(t.title)}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                className="lp-doctab"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  background: on ? BRAND_TINT : "transparent",
                  border: 0,
                  borderLeft: `2px solid ${on ? BRAND : "transparent"}`,
                  marginLeft: -1,
                  padding: "10px 16px",
                  fontFamily: SANS,
                  fontSize: 15,
                  fontWeight: on ? 700 : 500,
                  color: on ? BRAND : BODY,
                  cursor: "pointer",
                }}
              >
                <span aria-hidden style={{ fontSize: 14, opacity: on ? 1 : 0.75 }}>
                  {t.icon}
                </span>
                {t.title}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 34 }}>
          <div style={eyebrow()}>Elsewhere</div>
          <div style={{ borderLeft: `1px solid ${LINE}`, marginTop: 14 }}>
            <Link
              href={elsewhere.href}
              className="lp-doclink"
              style={{
                display: "block",
                padding: "10px 16px",
                fontSize: 15,
                color: BODY,
                textDecoration: "none",
              }}
            >
              {elsewhere.label}
            </Link>
          </div>
        </div>
      </aside>

      <div style={{ flex: "1 1 460px", minWidth: 0, padding: "52px 0 96px" }}>
        {head}

        {tabs.map((tab, i) => (
          <div
            key={tab.title}
            id={`panel-${slug(tab.title)}`}
            role="tabpanel"
            aria-labelledby={`tab-${slug(tab.title)}`}
            hidden={i !== active}
            style={{ marginTop: 44 }}
          >
            <h2
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: "-0.025em",
                margin: 0,
                color: INK,
              }}
            >
              {tab.title}
            </h2>
            <p
              style={{
                fontSize: 17.5,
                lineHeight: 1.6,
                color: BODY,
                margin: "12px 0 0",
                maxWidth: 720,
                textWrap: "pretty",
              }}
            >
              {tab.lede}
            </p>

            {tab.how ? (
              <div
                style={{
                  marginTop: 26,
                  background: BRAND_TINT,
                  border: `1px solid ${BRAND_TINT_LINE}`,
                  borderRadius: 16,
                  padding: "22px 24px",
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
                            background: WHITE,
                            border: `1px solid ${LINE}`,
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

        {footer}
      </div>
    </>
  );
}

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
