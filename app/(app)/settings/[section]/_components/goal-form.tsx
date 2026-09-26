"use client";

import { useState, useSyncExternalStore, useTransition } from "react";

import { SELF_REPORT_BANDS, TARGET_BANDS } from "@/lib/plan/constants";

import { saveStudyGoal, type SettingsState } from "../../actions";

import { buttonStyle, fieldStyle, labelStyle, Message } from "./form-ui";

const subscribeNever = () => () => {};

/**
 * The goal fields from onboarding, saved in place. Onboarding's own form sends
 * you on to the diagnostic or the plan page afterwards; here you stay put.
 */
export function GoalForm({
  initial,
}: {
  initial: { selfReportedBand: number | null; targetBand: number; examDate: string | null };
}) {
  const [self, setSelf] = useState(
    initial.selfReportedBand != null ? String(initial.selfReportedBand) : "",
  );
  const [target, setTarget] = useState(String(initial.targetBand));
  const [examDate, setExamDate] = useState(initial.examDate ?? "");
  const [state, setState] = useState<SettingsState>({});
  const [pending, start] = useTransition();

  // "Today" on the client only, so the server and browser never disagree about it.
  const minDate = useSyncExternalStore(
    subscribeNever,
    () => new Date().toISOString().slice(0, 10),
    () => "",
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      setState(
        await saveStudyGoal({
          selfReportedBand: self ? Number(self) : null,
          targetBand: Number(target),
          examDate: examDate || null,
        }),
      );
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14, maxWidth: 440 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={labelStyle}>Your current level</span>
        <select value={self} onChange={(e) => setSelf(e.target.value)} style={fieldStyle}>
          <option value="">Not sure yet</option>
          {SELF_REPORT_BANDS.map((b) => (
            <option key={b} value={b}>
              Band {b.toFixed(1)}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={labelStyle}>Target band</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)} style={fieldStyle}>
          {TARGET_BANDS.map((b) => (
            <option key={b} value={b}>
              Band {b.toFixed(1)}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={labelStyle}>Test date (optional)</span>
        <input
          type="date"
          value={examDate}
          min={minDate || undefined}
          onChange={(e) => setExamDate(e.target.value)}
          style={fieldStyle}
        />
      </label>

      <Message state={state} />

      <div>
        <button type="submit" disabled={pending} style={buttonStyle(pending)}>
          {pending ? "Saving…" : "Save goal"}
        </button>
      </div>
    </form>
  );
}
