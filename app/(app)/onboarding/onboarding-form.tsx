"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { SELF_REPORT_BANDS, TARGET_BANDS, type StudyPlanInput } from "@/lib/plan/types";

import { saveOnboarding } from "./actions";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";

interface Props {
  mode: "create" | "edit";
  initial: {
    selfReportedBand: number | null;
    targetBand: number;
    examDate: string | null;
  };
}

/**
 * Self-report step: a quick "where are you / where are you headed" so tasks can be
 * level-matched immediately and the paced plan has a date to work from. On first
 * setup we then route into the diagnostic to confirm the real baseline.
 */
export function OnboardingForm({ mode, initial }: Props) {
  // "" = "not sure yet" → null self-report (difficulty falls back to default).
  const [self, setSelf] = useState<string>(initial.selfReportedBand != null ? String(initial.selfReportedBand) : "");
  const [target, setTarget] = useState<string>(String(initial.targetBand));
  const [examDate, setExamDate] = useState<string>(initial.examDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Compute "today" on the client only — avoids an SSR/CSR hydration mismatch from
  // the date boundary differing between server and browser.
  const [minDate, setMinDate] = useState<string>("");
  useEffect(() => setMinDate(new Date().toISOString().slice(0, 10)), []);

  function submit() {
    setError(null);
    const input: StudyPlanInput = {
      selfReportedBand: self ? Number(self) : null,
      targetBand: Number(target),
      examDate: examDate || null,
    };
    const todayIso = new Date().toISOString().slice(0, 10);
    if (input.examDate && input.examDate < todayIso) {
      setError("Your test date is in the past — pick a future date or leave it blank.");
      return;
    }
    startTransition(async () => {
      try {
        await saveOnboarding(input, mode === "create" ? "/diagnostic" : "/plan");
      } catch (e) {
        // redirect() throws a control-flow signal we must not swallow as an error.
        if (e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setError("Couldn't save your plan — please try again.");
      }
    });
  }

  return (
    <div style={{ maxWidth: 540, fontFamily: SANS }}>
      <div style={{ background: "#fff", border: "1px solid #E7E3D5", borderRadius: 16, padding: "26px 28px" }}>
        <Field label="Your current level" hint="Roughly where are you now? Pick your last IELTS band, or your best guess — the diagnostic will sharpen it.">
          <select value={self} onChange={(e) => setSelf(e.target.value)} style={selectStyle}>
            <option value="">Not sure yet</option>
            {SELF_REPORT_BANDS.map((b) => (
              <option key={b} value={b}>
                Band {b.toFixed(1)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Your target band" hint="The score you're aiming for. We pace your plan to close the gap.">
          <select value={target} onChange={(e) => setTarget(e.target.value)} style={selectStyle}>
            {TARGET_BANDS.map((b) => (
              <option key={b} value={b}>
                Band {b.toFixed(1)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Test date (optional)" hint="Have a real exam booked? Add it for a countdown and a week-by-week plan.">
          <input type="date" value={examDate} min={minDate || undefined} onChange={(e) => setExamDate(e.target.value)} style={selectStyle} />
        </Field>

        {error ? (
          <p role="alert" style={{ margin: "4px 0 14px", fontSize: 13.5, color: "#c2410c", background: "#FEF2E8", border: "1px solid #F6D7BE", borderRadius: 10, padding: "10px 12px" }}>
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          style={{ width: "100%", height: 48, border: "none", borderRadius: 12, background: INDIGO, color: "#fff", fontFamily: SANS, fontSize: 15.5, fontWeight: 700, cursor: pending ? "default" : "pointer", opacity: pending ? 0.6 : 1, boxShadow: "0 12px 26px -12px rgba(59,67,181,.8)" }}
        >
          {pending ? "Saving…" : mode === "create" ? "Save & start diagnostic" : "Save changes"}
        </button>
        {mode === "create" ? (
          <p style={{ margin: "12px 0 0", fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 1.5 }}>
            Next: a 1 reading set + 1 Task 2 essay diagnostic to set your real starting bands.
          </p>
        ) : (
          <Link href="/plan" style={{ display: "block", margin: "12px 0 0", fontSize: 14, color: MUTED, textAlign: "center", fontWeight: 600, textDecoration: "none" }}>
            Cancel
          </Link>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: INK, marginBottom: 4 }}>{label}</label>
      <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.5, color: MUTED }}>{hint}</p>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  border: "1px solid #E2DED0",
  borderRadius: 11,
  background: "#fff",
  fontFamily: SANS,
  fontSize: 15,
  color: INK,
  cursor: "pointer",
};
