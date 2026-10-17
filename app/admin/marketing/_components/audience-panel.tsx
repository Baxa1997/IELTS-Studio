"use client";

import { useMemo, useState } from "react";

import { EditorSection } from "@/app/admin/_components/editor-chrome";
import { Empty, FAINT, Identity, INK, LINE, MUTED, Pill, RULE, SANS } from "@/app/admin/_components/ui";
import type { Recipient, Segment } from "@/lib/marketing/audience";
import { INDIGO_CONSOLE, INDIGO_FILL, ON_INDIGO, PANEL, SOFT_RULE, SUBTLE_BG, TINT } from "@/lib/theme/tokens";

import { field, ghostBtn } from "./composer-styles";

const SEGMENTS: { id: Segment; label: string; hint: string }[] = [
  {
    id: "learners",
    label: "Solo learners",
    hint: "Personal accounts — the people who choose their own practice",
  },
  { id: "staff", label: "Centre staff", hint: "Centre admins, administrators and teachers" },
  { id: "everyone", label: "Everyone", hint: "Every account with a working address" },
];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";

/**
 * Who the broadcast goes to: the segment, the search, and a box per person.
 *
 * ⚠️ THE SELECTION IS "EVERYONE REACHABLE IN THE SEGMENT, MINUS THE EXCLUDED",
 * held by the composer as the excluded set. Storing the exclusions rather than
 * the inclusions means switching segment keeps the obvious meaning — the
 * default is always everybody — without re-ticking a hundred boxes; the
 * composer clears the set when the segment changes. Only the search is this
 * panel's own.
 */
export function AudiencePanel({
  segment,
  onSegment,
  pool,
  excluded,
  onExcluded,
  selectedCount,
  busy,
}: {
  segment: Segment;
  onSegment: (s: Segment) => void;
  pool: Recipient[];
  excluded: Set<string>;
  onExcluded: (update: (prev: Set<string>) => Set<string>) => void;
  selectedCount: number;
  busy: boolean;
}) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return pool;
    return pool.filter((r) => r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle));
  }, [pool, search]);

  const optedOut = pool.filter((r) => r.optedOut).length;
  const allShown = visible.length > 0 && visible.every((r) => !r.reachable || !excluded.has(r.profileId));

  function toggle(id: string) {
    onExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <EditorSection
      title="Audience"
      note="Anyone who has unsubscribed is listed but cannot be selected — the count is what will actually be mailed."
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SEGMENTS.map((s) => {
          const on = segment === s.id;
          return (
            <button
              key={s.id}
              type="button"
              title={s.hint}
              disabled={busy}
              onClick={() => onSegment(s.id)}
              style={{
                fontFamily: SANS,
                fontSize: 12.5,
                fontWeight: on ? 600 : 500,
                padding: "6px 12px",
                borderRadius: 999,
                cursor: busy ? "default" : "pointer",
                border: `1px solid ${on ? INDIGO_FILL : LINE}`,
                background: on ? INDIGO_FILL : PANEL,
                color: on ? ON_INDIGO : MUTED,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 13, color: MUTED }}>
        <strong style={{ color: INK }}>{selectedCount}</strong> of {pool.length} selected
        {optedOut > 0 ? ` · ${optedOut} unsubscribed` : ""}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a name or address"
          disabled={busy}
          style={{ ...field, flex: 1, minWidth: 0 }}
        />
        <button
          type="button"
          disabled={busy || visible.length === 0}
          onClick={() =>
            onExcluded((prev) => {
              const next = new Set(prev);
              for (const r of visible) {
                if (!r.reachable) continue;
                if (allShown) next.add(r.profileId);
                else next.delete(r.profileId);
              }
              return next;
            })
          }
          style={ghostBtn}
        >
          {allShown ? "Clear" : "Select"}
        </button>
      </div>

      <div style={{ border: `1px solid ${LINE}`, borderRadius: 11, overflow: "hidden", background: PANEL }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: SUBTLE_BG,
            borderBottom: `1px solid ${RULE}`,
            fontSize: 11,
            letterSpacing: ".07em",
            fontWeight: 600,
            color: FAINT,
            textTransform: "uppercase",
          }}
        >
          <span>Recipient</span>
          <span>{visible.length} shown</span>
        </div>

        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {visible.length === 0 ? (
            <Empty>Nobody matches that.</Empty>
          ) : (
            visible.map((r) => {
              const on = r.reachable && !excluded.has(r.profileId);
              return (
                <label
                  key={r.profileId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "22px minmax(0, 1fr) auto",
                    alignItems: "center",
                    columnGap: 10,
                    padding: "8px 12px",
                    borderBottom: `1px solid ${SOFT_RULE}`,
                    cursor: r.optedOut || busy ? "default" : "pointer",
                    opacity: r.optedOut ? 0.55 : 1,
                    background: on ? "transparent" : TINT.neutral.bg,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(r.profileId)}
                    disabled={r.optedOut || busy}
                    style={{ width: 15, height: 15, accentColor: INDIGO_CONSOLE, cursor: "inherit" }}
                  />
                  <Identity glyph={initials(r.name)} name={r.name} meta={r.email} tone={r.optedOut ? "neutral" : "indigo"} round />
                  {r.optedOut ? <Pill tone="neutral">unsubscribed</Pill> : null}
                </label>
              );
            })
          )}
        </div>
      </div>
    </EditorSection>
  );
}
