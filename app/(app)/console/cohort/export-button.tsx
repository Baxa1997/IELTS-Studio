"use client";

import { Button } from "@/components/ui/button";
import type { StudentRow } from "@/lib/console/compute";

/**
 * Download the cohort table as CSV, generated client-side from the already-loaded
 * rows — no extra endpoint, nothing new to authorize. This is the "exportable
 * summary" a center hands to whoever signs off on the subscription.
 */
export function ExportCohortButton({ rows, orgName }: { rows: StudentRow[]; orgName: string }) {
  function download() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(orgName)}-cohort-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={download} disabled={rows.length === 0}>
      Export CSV
    </Button>
  );
}

const HEADERS = [
  "Student",
  "Reading baseline",
  "Reading current",
  "Reading lift",
  "Reading target",
  "Writing baseline",
  "Writing current",
  "Writing lift",
  "Writing target",
  "Avg lift",
  "Submissions",
  "Last active",
  "Status",
  "Note",
];

function toCsv(rows: StudentRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.name,
        num(r.reading?.baseline),
        num(r.reading?.current),
        signed(r.reading?.lift),
        num(r.reading?.target),
        num(r.writing?.baseline),
        num(r.writing?.current),
        signed(r.writing?.lift),
        num(r.writing?.target),
        signed(r.avgLift),
        String(r.submissions),
        r.lastActiveISO ? r.lastActiveISO.slice(0, 10) : "—",
        STATUS_TEXT[r.status],
        r.statusReason,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\r\n");
}

const STATUS_TEXT: Record<StudentRow["status"], string> = {
  improving: "Improving",
  steady: "Steady",
  stuck: "Needs attention",
  not_started: "Not started",
};

function num(n: number | null | undefined): string {
  return n == null ? "" : n.toFixed(1);
}
function signed(n: number | null | undefined): string {
  if (n == null) return "";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "center";
}
