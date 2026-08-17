"use client";

import { useState } from "react";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#16162E";
const FAINT = "#6E6C87";
const INDIGO = "#3B43B5";

/**
 * §12's two tabs: Broadcast (what you write) and Automatic (what sends itself).
 *
 * The split is the point of the section — "manual announcements are rare;
 * automatic messages are what actually change behaviour" — so the automatic set
 * needs to be somewhere an owner will find it, not buried in Settings.
 *
 * Both panels are rendered by the server and swapped here rather than fetched
 * on click: the whole page is already loaded, and a tab that spins is a tab
 * people stop pressing.
 */
export function AnnouncementTabs({
  broadcast,
  automatic,
  automaticCount,
}: {
  broadcast: React.ReactNode;
  automatic: React.ReactNode;
  /** How many of the six are switched on — the one number worth a badge. */
  automaticCount: number;
}) {
  const [tab, setTab] = useState<"broadcast" | "automatic">("broadcast");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid #C5C4BE",
          marginBottom: 14,
          flex: "none",
        }}
      >
        <Tab active={tab === "broadcast"} onClick={() => setTab("broadcast")}>
          Broadcast
        </Tab>
        <Tab active={tab === "automatic"} onClick={() => setTab("automatic")}>
          Automatic
          <span
            style={{
              marginLeft: 7,
              fontSize: 11,
              fontWeight: 600,
              color: automaticCount > 0 ? INDIGO : FAINT,
            }}
          >
            {automaticCount} on
          </span>
        </Tab>
      </div>

      {/* Kept mounted rather than unmounted, so half-typed wording in the
          Automatic tab survives a glance at what was sent last week. */}
      <div style={{ flex: 1, minHeight: 0, display: tab === "broadcast" ? "flex" : "none" }}>
        {broadcast}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: tab === "automatic" ? "block" : "none",
        }}
      >
        {automatic}
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        border: "none",
        background: "none",
        padding: "9px 14px",
        fontFamily: SANS,
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        color: active ? INK : FAINT,
        borderBottom: `2px solid ${active ? INDIGO : "transparent"}`,
        marginBottom: -1,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
