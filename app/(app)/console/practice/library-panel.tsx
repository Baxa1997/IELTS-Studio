"use client";

import { useActionState, useState } from "react";

import type { LibraryItem } from "@/lib/console/practice-library";

import { archiveLibraryItem, type LibraryState } from "./library-actions";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#16162E";
const FAINT = "#6E6C87";
const INDIGO = "#3B43B5";
const GREEN = "#166C4C";
const RED = "#C24539";
const RULE = "#E7E5DF";

/**
 * §9's practice library, on the Practice page where it belongs.
 *
 * WHAT THE LIST IS SORTED AND LABELLED AROUND is "used n times", because that
 * is the only number that says whether the shelf is working. A library nobody
 * assigns from has saved the centre nothing — it is a folder of good
 * intentions — and putting the usage count in front of the person stocking it
 * is the cheapest way to find that out.
 *
 * Filtering is client-side: a centre's shelf is tens of items, and a round trip
 * per keystroke to filter twenty rows is worse than no filter at all.
 */
export function LibraryPanel({
  items,
  facets,
  canEdit,
}: {
  items: LibraryItem[];
  facets: { skills: string[]; taskTypes: string[]; levels: string[] };
  canEdit: boolean;
}) {
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [level, setLevel] = useState("");

  const needle = q.trim().toLowerCase();
  const shown = items.filter(
    (item) =>
      (!skill || item.skill === skill) &&
      (!level || item.level === level) &&
      (!needle ||
        [item.title, item.notes, item.taskType, item.preview]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(needle))),
  );

  const neverUsed = items.filter((i) => i.timesAssigned === 0).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the shelf…"
          style={{
            flex: 1,
            minWidth: 180,
            padding: "7px 10px",
            border: `1px solid ${RULE}`,
            borderRadius: 8,
            fontFamily: SANS,
            fontSize: 13,
            color: INK,
          }}
        />
        <Select value={skill} onChange={setSkill} options={facets.skills} all="Any skill" />
        <Select value={level} onChange={setLevel} options={facets.levels} all="Any level" />
        <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>
          {shown.length} of {items.length}
          {neverUsed > 0 ? ` · ${neverUsed} never used` : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, lineHeight: 1.6, margin: 0 }}>
          Nothing saved yet. When a teacher generates a prompt worth keeping, saving it here means
          the next class can sit <em>the same</em> paper — which is what makes two groups
          comparable, and what stops the centre paying to regenerate work it already has.
        </p>
      ) : shown.length === 0 ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
          Nothing on the shelf matches that.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.map((item) => (
            <LibraryRow key={item.id} item={item} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryRow({ item, canEdit }: { item: LibraryItem; canEdit: boolean }) {
  const [state, action, pending] = useActionState<LibraryState, FormData>(archiveLibraryItem, {});

  return (
    <div
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 10,
        padding: "10px 12px",
        background: "#FFF",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: INK }}>
          {item.title}
        </div>
        {item.preview ? (
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12,
              color: FAINT,
              marginTop: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.preview}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 6,
            fontFamily: SANS,
            fontSize: 11,
          }}
        >
          {[item.skill, item.taskType, item.level].filter(Boolean).map((tag) => (
            <span
              key={tag}
              style={{
                border: `1px solid ${RULE}`,
                borderRadius: 5,
                padding: "2px 7px",
                color: FAINT,
                textTransform: "capitalize",
              }}
            >
              {tag}
            </span>
          ))}
          {item.savedByName ? (
            <span style={{ color: FAINT, alignSelf: "center" }}>saved by {item.savedByName}</span>
          ) : null}
        </div>
      </div>

      <div style={{ textAlign: "right", flex: "none" }}>
        {/* The number that says whether the shelf earns its keep. */}
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 600,
            color: item.timesAssigned > 0 ? GREEN : FAINT,
          }}
        >
          {item.timesAssigned > 0
            ? `set ${item.timesAssigned}×`
            : "never set"}
        </div>
        {canEdit ? (
          <form action={action} style={{ marginTop: 6 }}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              disabled={pending}
              style={{
                border: "none",
                background: "none",
                color: FAINT,
                fontFamily: SANS,
                fontSize: 11.5,
                cursor: pending ? "default" : "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              {pending ? "…" : "Archive"}
            </button>
            {state.error ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: RED, marginTop: 3 }}>
                {state.error}
              </div>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  all,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  all: string;
}) {
  // Only tags actually in use are offered — a filter that can return nothing is
  // a filter that wastes a click.
  if (options.length === 0) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 9px",
        border: `1px solid ${RULE}`,
        borderRadius: 8,
        fontFamily: SANS,
        fontSize: 12.5,
        color: value ? INDIGO : INK,
        background: "#FFF",
        textTransform: "capitalize",
      }}
    >
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
