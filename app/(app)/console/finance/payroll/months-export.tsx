"use client";

import { useState } from "react";

/**
 * Pick the months, download the sheet.
 *
 * The owner's own spreadsheet is a grid of teachers by months — May, June and
 * July side by side with a word beside each amount saying whether it was handed
 * over. Which months belong in it is a decision they make at download time
 * ("show me everything since we started falling behind"), not a filter on the
 * page, so it lives on the button rather than in the URL of the page.
 *
 * A plain `<a download>` and not a `next/link`: this URL returns a file, and a
 * client-side navigation to it would try to render a spreadsheet as a page.
 */

const INDIGO = "#4340CB";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";

export function MonthsExport({
  months,
  /** Months that already have a saved run — the rest are computed on the fly. */
  saved,
}: {
  months: { value: string; label: string }[];
  saved: string[];
}) {
  const savedSet = new Set(saved);
  // Default to the three most recent months, which is the comparison the sheet
  // they showed us was making.
  const [picked, setPicked] = useState<string[]>(() => months.slice(0, 3).map((m) => m.value));

  const toggle = (value: string) =>
    setPicked((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );

  const ordered = [...picked].sort();
  const href = `/api/console/finance/export?months=${ordered.join(",")}`;
  const provisional = ordered.filter((m) => !savedSet.has(m));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {months.map((m) => {
          const on = picked.includes(m.value);
          const hasRun = savedSet.has(m.value);
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => toggle(m.value)}
              aria-pressed={on}
              className="cn-chip"
              style={{
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: on ? 600 : 500,
                border: `1px solid ${on ? INDIGO : "#E4E2DC"}`,
                background: on ? INDIGO : "#fff",
                color: on ? "#fff" : hasRun ? INK : FAINT,
                cursor: "pointer",
              }}
              title={hasRun ? "Payroll has been run for this month" : "Not run yet — estimated"}
            >
              {m.label}
              {hasRun ? null : <span style={{ opacity: 0.7 }}> ·</span>}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {picked.length > 0 ? (
          <a
            href={href}
            download
            className="cn-chip"
            style={{
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              background: INDIGO,
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Download {picked.length} month{picked.length === 1 ? "" : "s"}
          </a>
        ) : (
          <span style={{ fontSize: 12.5, color: FAINT }}>Pick at least one month.</span>
        )}
        <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
          {provisional.length > 0
            ? `${provisional.length} of them haven't been run yet — those columns are what the current rates come to, not a saved payslip.`
            : "Teachers down the side, months across, with what is still owed on each."}
        </span>
      </div>
    </div>
  );
}
