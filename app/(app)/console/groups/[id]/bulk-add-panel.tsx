"use client";

import { useActionState, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  COLUMN_ROLE_LABEL,
  type ColumnRole,
  type Grid,
  guessRoles,
  readSpreadsheet,
  SpreadsheetError,
  toRosterLines,
} from "@/lib/spreadsheet-read";

import { addStudentsBulk, type BulkStudentState } from "../actions";
import { useActionFeedback } from "@/components/console/toast";

const initial: BulkStudentState = {};

/** Mirrors MAX_BULK_STUDENTS in ../actions — a bigger batch risks the request
 *  dying half-way with passwords that were never shown to anyone. */
const BATCH = 30;

const PLACEHOLDER = `Aziza Karimova
Bekzod Toshmatov, bekzod.t
Dilnoza Rashidova, dilnoza@example.com`;

/**
 * Create a whole group from a pasted register.
 *
 * The credentials are shown once and nowhere else — the passwords are generated
 * server-side and never stored in readable form — so the download and copy
 * actions are the point of this panel, not decoration.
 */
export function BulkAddPanel({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(addStudentsBulk, initial);
  // Stays open: the credentials sheet below is the only copy of these passwords.
  useActionFeedback(state, { keepOpen: true });
  const [copied, setCopied] = useState(false);
  const created = state.created ?? [];

  // The textarea is controlled so the importer can write into it. It stays the
  // only thing that gets submitted — the import is a way of filling it in, not
  // a second path into account creation.
  const [roster, setRoster] = useState("");
  const [queued, setQueued] = useState<string[]>([]);

  function credentialsCsv(): string {
    const rows = [
      ["Name", "Login", "Password", "Contact email"],
      ...created.map((s) => [s.name, s.login, s.password, s.email ?? ""]),
    ];
    return rows.map((r) => r.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  }

  function download() {
    // A BOM so Excel opens Cyrillic names as UTF-8 instead of mojibake.
    const blob = new Blob(["﻿" + credentialsCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-logins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(
      created.map((s) => `${s.name} — login: ${s.login} — password: ${s.password}`).join("\n"),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  /** Load lines into the box, keeping anything over one batch for later. */
  function loadLines(lines: string[]) {
    setRoster(lines.slice(0, BATCH).join("\n"));
    setQueued(lines.slice(BATCH));
  }

  return (
    <div className="space-y-3">
      <SpreadsheetImport onLines={loadLines} />

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="group_id" value={groupId} />
        <div className="space-y-2">
          <Label htmlFor="bulk-roster">One student per line</Label>
          <textarea
            id="bulk-roster"
            name="roster"
            rows={6}
            required
            value={roster}
            onChange={(e) => setRoster(e.target.value)}
            placeholder={PLACEHOLDER}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm transition-colors outline-none focus-visible:ring-3"
          />
          <p className="text-muted-foreground text-xs">
            Name only is enough — the login is built from it (<code>dilnoza.r</code>) and passwords
            are generated. Add a login or a contact email after a comma to set them yourself. Up to
            30 at a time. Students sign in by login, so a contact address that already has a
            personal account here is fine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating accounts…" : "Create accounts"}
          </Button>
          {queued.length > 0 ? (
            <span className="text-muted-foreground text-xs">
              {queued.length} more from your file.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => loadLines(queued)}
                disabled={pending}
              >
                Load the next {Math.min(BATCH, queued.length)}
              </button>{" "}
              once this batch is done — save the passwords below first.
            </span>
          ) : null}
        </div>
      </form>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      {created.length > 0 ? (
        <div className="space-y-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {created.length} account{created.length === 1 ? "" : "s"} created. Save these now —
              the passwords are not shown again.
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={download}>
                Download CSV
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={copyAll}>
                {copied ? "Copied" : "Copy all"}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr>
                  <th className="py-1 pr-3 font-medium">Name</th>
                  <th className="py-1 pr-3 font-medium">Login</th>
                  <th className="py-1 pr-3 font-medium">Password</th>
                  <th className="py-1 font-medium">Contact email</th>
                </tr>
              </thead>
              <tbody>
                {created.map((s) => (
                  <tr key={s.login} className="border-t">
                    <td className="py-1 pr-3">{s.name}</td>
                    <td className="py-1 pr-3 font-mono text-xs">{s.login}</td>
                    <td className="py-1 pr-3 font-mono text-xs">{s.password}</td>
                    <td className="text-muted-foreground py-1 text-xs">{s.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Rendered after the credentials so a fresh import can't push them off
          the screen before they have been saved. */}
      {state.skipped && state.skipped.length > 0 ? (
        <div className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
          <p className="text-sm font-medium">
            {state.skipped.length} line{state.skipped.length === 1 ? "" : "s"} skipped
          </p>
          <ul className="space-y-1 text-xs">
            {state.skipped.map((s, i) => (
              <li key={`${s.line}-${i}`}>
                <code className="font-mono">{s.line}</code>{" "}
                <span className="text-muted-foreground">— {s.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Turn the center's own Excel file into roster lines.
 *
 * The whole flow is REVIEW-THEN-CREATE. The file is read in the browser, the
 * columns are guessed, the guess is shown as a table with a dropdown over each
 * column, and only when the teacher presses "Use these" does anything reach the
 * textarea — which they can still edit before a single account exists. Forty
 * auth users are not something to create from an unseen guess about which
 * column held the names.
 */
function SpreadsheetImport({ onLines }: { onLines: (lines: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [roles, setRoles] = useState<ColumnRole[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File) {
    setBusy(true);
    setError(null);
    try {
      const parsed = await readSpreadsheet(file);
      if (parsed.length === 0) {
        setError("That file has no rows in it.");
        setGrid(null);
        return;
      }
      const guess = guessRoles(parsed);
      setGrid(parsed);
      setRoles(guess.roles);
      setHasHeader(guess.hasHeader);
      setFileName(file.name);
    } catch (e) {
      setGrid(null);
      setError(
        e instanceof SpreadsheetError
          ? e.message
          : "That file couldn't be read. Save it as .xlsx or CSV and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setGrid(null);
    setError(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const result = grid ? toRosterLines(grid, roles, hasHeader) : null;
  const preview = grid ? (hasHeader ? grid.slice(1, 6) : grid.slice(0, 5)) : [];

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="text-muted-foreground max-w-full text-xs file:mr-2 file:cursor-pointer file:rounded-md file:border file:bg-transparent file:px-2 file:py-1 file:text-xs"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pick(file);
          }}
        />
        {busy ? <span className="text-muted-foreground text-xs">Reading…</span> : null}
        {grid ? (
          <button type="button" className="text-muted-foreground text-xs underline" onClick={reset}>
            Clear
          </button>
        ) : null}
      </div>

      {!grid && !error ? (
        <p className="text-muted-foreground text-xs">
          Already have the group list in Excel? Drop the .xlsx or CSV here and we&apos;ll read the
          names out of it. Nothing is uploaded — the file is read in your browser and you check the
          columns before any account is created.
        </p>
      ) : null}

      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}

      {grid ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium">{fileName}</span>
            <span className="text-muted-foreground">
              {grid.length} row{grid.length === 1 ? "" : "s"}
            </span>
            <label className="text-muted-foreground flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
              />
              First row is a header
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  {roles.map((role, i) => (
                    <th key={i} className="p-1 align-bottom">
                      <select
                        value={role}
                        aria-label={`Column ${i + 1}`}
                        onChange={(e) =>
                          setRoles((list) =>
                            list.map((r, j) => (j === i ? (e.target.value as ColumnRole) : r)),
                          )
                        }
                        className="border-input w-full rounded-md border bg-transparent px-1.5 py-1 text-xs"
                      >
                        {(Object.keys(COLUMN_ROLE_LABEL) as ColumnRole[]).map((key) => (
                          <option key={key} value={key}>
                            {COLUMN_ROLE_LABEL[key]}
                          </option>
                        ))}
                      </select>
                      {hasHeader ? (
                        <span className="text-muted-foreground mt-1 block truncate">
                          {grid[0][i] || "—"}
                        </span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {preview.map((row, i) => (
                  <tr key={i} className="border-t">
                    {roles.map((role, j) => (
                      <td
                        key={j}
                        className={`max-w-[14ch] truncate p-1 ${role === "ignore" ? "opacity-40" : ""}`}
                      >
                        {row[j]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result && result.lines.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onLines(result.lines)}
              >
                Use these {result.lines.length} student{result.lines.length === 1 ? "" : "s"}
              </Button>
              <span className="text-muted-foreground text-xs">
                {result.lines.length > BATCH
                  ? `The first ${BATCH} go in the box; the rest wait their turn.`
                  : "They go in the box below — edit anything before you create the accounts."}
                {result.skipped > 0
                  ? ` ${result.skipped} row${result.skipped === 1 ? "" : "s"} had no name and were left out.`
                  : ""}
              </span>
            </div>
          ) : (
            <p className="text-destructive text-xs">
              No names found. Pick which column holds them above.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
