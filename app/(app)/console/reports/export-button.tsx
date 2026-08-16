"use client";

import type { GroupReportRow } from "@/lib/console/reports";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INDIGO = "#3B43B5";

/** Downloads the group table as CSV — the shape a center owner pastes into a
 *  board report or a parent update. Built client-side; no round trip. */
export function ExportReportButton({
  rows,
  centerName,
}: {
  rows: GroupReportRow[];
  centerName: string;
}) {
  function download() {
    // ONE COLUMN PER SKILL, each with its count. A single "average band" column
    // was the export's version of the same mistake the console made on screen:
    // four measurements collapsed into one number that nobody could act on, and
    // — worse in a spreadsheet — one that gets pasted into a report to a parent.
    const table = [
      [
        "Group",
        "Teacher",
        "Students",
        "Practice set",
        "Completion %",
        ...rows[0]?.bySkill.flatMap((s) => [`${s.skill} band`, `${s.skill} marked`]) ?? [],
      ],
      ...rows.map((r) => [
        r.name,
        r.teacherName ?? "",
        String(r.students),
        String(r.assignments),
        r.completionPct != null ? String(r.completionPct) : "",
        ...r.bySkill.flatMap((s) => [
          s.band != null ? `${s.band.toFixed(1)}${s.provisional ? " (provisional)" : ""}` : "",
          String(s.attempts),
        ]),
      ]),
    ];
    const csv = table
      .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    // BOM so Excel reads Cyrillic group names as UTF-8.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${centerName.replace(/[^\w-]+/g, "-").toLowerCase()}-groups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={rows.length === 0}
      style={{
        border: `1px solid ${INDIGO}`,
        background: "transparent",
        color: INDIGO,
        borderRadius: 10,
        padding: "7px 14px",
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 13.5,
        cursor: rows.length === 0 ? "default" : "pointer",
        opacity: rows.length === 0 ? 0.5 : 1,
      }}
    >
      Export CSV
    </button>
  );
}
