"use client";

/**
 * The two controls every listening question panel draws: the number chip that
 * says whether an item has been answered, and the flag that says "come back to
 * this one".
 *
 * They live here rather than beside any one panel because the map, the form,
 * the notes, the table, the MCQ and the matching panels all need them — and once
 * the map moved into its own lazily-loaded chunk, a shared home stopped being a
 * tidiness question and became a requirement.
 */

import { RUN } from "./theme";

export function NumChip({ n, answered }: { n: number; answered: boolean }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 8,
        background: answered ? RUN.okBg : RUN.vBg,
        color: answered ? RUN.ok : RUN.vHover,
        fontFamily: RUN.sans,
        fontSize: 12.5,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {n}
    </span>
  );
}

/** Flag-for-review toggle (amber when set). */
export function FlagButton({ flagged, onClick }: { flagged: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={flagged ? "Unflag" : "Flag for review"}
      aria-pressed={flagged}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 9,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        color: flagged ? RUN.flag : "#C9C3D2",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={flagged ? RUN.flagFill : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    </button>
  );
}
