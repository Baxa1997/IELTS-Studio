"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { addStudentsBulk, type BulkStudentState } from "../actions";

const initial: BulkStudentState = {};

const PLACEHOLDER = `Aziza Karimova
Bekzod Toshmatov, bekzod.t
Dilnoza Rashidova, dilnoza@example.com`;

/**
 * Create a whole class from a pasted register.
 *
 * The credentials are shown once and nowhere else — the passwords are generated
 * server-side and never stored in readable form — so the download and copy
 * actions are the point of this panel, not decoration.
 */
export function BulkAddPanel({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(addStudentsBulk, initial);
  const [copied, setCopied] = useState(false);
  const created = state.created ?? [];

  function credentialsCsv(): string {
    const rows = [
      ["Name", "Login", "Password", "Email"],
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

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="group_id" value={groupId} />
        <div className="space-y-2">
          <Label htmlFor="bulk-roster">One student per line</Label>
          <textarea
            id="bulk-roster"
            name="roster"
            rows={6}
            required
            placeholder={PLACEHOLDER}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none transition-colors focus-visible:ring-3"
          />
          <p className="text-muted-foreground text-xs">
            Name only is enough — the login is built from it (<code>dilnoza.r</code>) and passwords
            are generated. Add a login or an email after a comma to set them yourself. Up to 30 at a
            time. No email is sent: download the sheet below and hand the details out.
          </p>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating accounts…" : "Create accounts"}
        </Button>
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
                  <th className="py-1 font-medium">Email</th>
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
