"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

/**
 * Type what you need; get a lesson page.
 *
 * Calls the ENGINE directly with the user's Supabase token, the same way
 * reading and listening do — a full build runs well past the 60s a Vercel
 * function gets, so it must not ride one.
 *
 * Three steps, shown as three states, because they fail and cost differently.
 * The "Plan" toggle decides whether the teacher sees the middle one: on, they
 * answer a couple of questions and can correct the outline while correcting is
 * still cheap; off, it goes straight through. Either way the questions are
 * skippable — "just build it" has to stay possible at every step.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#E0DED8";
const INDIGO = "#4340CB";

/** What a teacher might plausibly type, rotated so the box never looks empty. */
const PLACEHOLDERS = [
  "Explain the present perfect, with practice",
  "Collocations for the education topic",
  "Task 2 introductions — how to paraphrase the question",
  "Articles: a, an, the — my B1 group keeps dropping them",
  "True / False / Not Given, and why students fall for it",
];

const STARTERS = [
  "Present simple vs present continuous",
  "Linking words for Task 2",
  "Countable and uncountable nouns",
  "Describing trends for Task 1",
];

type Question = { id: string; label: string; options: string[]; default: string };
type Plan = Record<string, unknown> & { title?: string; level?: string; objective?: string };

type Phase =
  | { step: "idle" }
  | { step: "thinking"; label: string }
  | { step: "asking"; questions: Question[]; blueprint: string | null }
  | { step: "planned"; plan: Plan }
  | { step: "error"; message: string };

async function callEngine<T>(path: string, body: unknown): Promise<T> {
  const backend = clientEnv.aiBackendUrl;
  if (!backend) throw new Error("The AI engine isn't configured for this environment.");

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Your session expired — please sign in again.");

  let res: Response;
  try {
    res = await fetch(`${backend}/lessons/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // A rejected fetch is a network fact, not an HTTP status — say so plainly
    // rather than showing the browser's bare "Failed to fetch".
    throw new Error("Couldn't reach the AI engine. It may be restarting — try again shortly.");
  }

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    detail?: string | { message?: string };
    message?: string;
  };
  if (!res.ok) {
    const detail = typeof json.detail === "string" ? json.detail : json.detail?.message;
    throw new Error(detail ?? json.message ?? `That didn't work (${res.status}).`);
  }
  return json as T;
}

export function Composer() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [planFirst, setPlanFirst] = useState(true);
  const [language, setLanguage] = useState("en");
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [placeholder] = useState(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
  );

  const busy = phase.step === "thinking";

  async function start(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setAnswers({});
    try {
      if (planFirst) {
        setPhase({ step: "thinking", label: "Reading your brief…" });
        const intake = await callEngine<{
          status: string;
          questions?: Question[];
          blueprint?: string | null;
        }>("intake", { brief: value, language });

        if (intake.status === "ask" && (intake.questions?.length ?? 0) > 0) {
          setPhase({
            step: "asking",
            questions: intake.questions ?? [],
            blueprint: intake.blueprint ?? null,
          });
          return;
        }
        await makePlan(value, {}, intake.blueprint ?? null);
        return;
      }
      // Plan off: straight to the build, using a plan we never show.
      setPhase({ step: "thinking", label: "Planning the lesson…" });
      const plan = await callEngine<Plan>("plan", { brief: value, language });
      await build(value, plan);
    } catch (err) {
      setPhase({ step: "error", message: (err as Error).message });
    }
  }

  async function makePlan(value: string, given: Record<string, string>, blueprint: string | null) {
    setPhase({ step: "thinking", label: "Planning the lesson…" });
    const plan = await callEngine<Plan>("plan", {
      brief: value,
      answers: given,
      blueprint,
      language,
    });
    setPhase({ step: "planned", plan });
  }

  async function build(value: string, plan: Plan) {
    setPhase({ step: "thinking", label: "Writing it — about a minute…" });
    const made = await callEngine<{ id: string }>("build", { plan, brief: value });
    router.push(`/console/practice-ai/${made.id}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── the box ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${LINE}`,
          borderRadius: 18,
          boxShadow: "0 8px 30px rgba(20,25,50,.06)",
          overflow: "hidden",
        }}
      >
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter is a new line. A teacher types one line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void start(brief);
            }
          }}
          placeholder={placeholder}
          rows={3}
          disabled={busy}
          style={{
            width: "100%",
            border: 0,
            outline: "none",
            resize: "none",
            padding: "20px 22px 8px",
            fontFamily: "inherit",
            fontSize: 17,
            lineHeight: 1.5,
            color: INK,
            background: "transparent",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px 12px 18px",
            borderTop: `1px solid #F1EFEA`,
            flexWrap: "wrap",
          }}
        >
          {/* The Plan toggle is a real behaviour switch, not decoration: it is
              what decides whether the clarifying step happens at all. */}
          <button
            type="button"
            onClick={() => setPlanFirst((v) => !v)}
            title={
              planFirst
                ? "You'll answer a couple of questions and see the outline first"
                : "Skip straight to writing the lesson"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: planFirst ? "#EEEDF8" : "#fff",
              border: `1px solid ${planFirst ? "#C7C5F0" : LINE}`,
              borderRadius: 999,
              padding: "6px 12px 6px 7px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              color: planFirst ? INDIGO : MUTED,
            }}
          >
            <span
              style={{
                width: 30,
                height: 17,
                borderRadius: 999,
                background: planFirst ? INDIGO : "#D8D5CE",
                position: "relative",
                transition: "background .15s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: planFirst ? 15 : 2,
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left .15s",
                }}
              />
            </span>
            Plan
          </button>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            title="Which language the explanations are written in"
            style={{
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: "7px 11px",
              fontFamily: "inherit",
              fontSize: 13,
              color: MUTED,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="en">Explain in English</option>
            <option value="uz">Tushuntirish o&apos;zbekcha</option>
            <option value="ru">Объяснение по-русски</option>
          </select>

          <button
            type="button"
            onClick={() => void start(brief)}
            disabled={busy || brief.trim() === ""}
            aria-label="Make this lesson"
            style={{
              marginLeft: "auto",
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: 0,
              background: brief.trim() === "" ? "#D8D5CE" : INDIGO,
              color: "#fff",
              fontSize: 19,
              cursor: busy || brief.trim() === "" ? "default" : "pointer",
              display: "grid",
              placeItems: "center",
              transition: "background .15s",
            }}
          >
            {busy ? "…" : "↑"}
          </button>
        </div>
      </div>

      {/* ── what's happening ────────────────────────────────────────────── */}
      {phase.step === "thinking" ? (
        <p style={{ fontSize: 13.5, color: MUTED, margin: 0 }} role="status">
          {phase.label}
        </p>
      ) : null}

      {phase.step === "error" ? (
        <p style={{ fontSize: 13.5, color: "#A63A30", margin: 0 }} role="alert">
          {phase.message}
        </p>
      ) : null}

      {/* ── clarifying questions ────────────────────────────────────────── */}
      {phase.step === "asking" ? (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
            A couple of things would change what I make. Skip any of them and I&apos;ll decide.
          </p>
          {phase.questions.map((q) => (
            <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{q.label}</span>
              <span style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {q.options.map((opt) => {
                  const on = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      style={{
                        border: `1px solid ${on ? INDIGO : LINE}`,
                        background: on ? "#EEEDF8" : "#fff",
                        color: on ? INDIGO : INK,
                        borderRadius: 999,
                        padding: "7px 14px",
                        fontFamily: "inherit",
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: on ? 600 : 400,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={() =>
                void makePlan(brief, answers, phase.blueprint).catch((e) =>
                  setPhase({ step: "error", message: (e as Error).message }),
                )
              }
              style={primaryButton}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() =>
                void makePlan(brief, {}, phase.blueprint).catch((e) =>
                  setPhase({ step: "error", message: (e as Error).message }),
                )
              }
              style={ghostButton}
            >
              Skip — you decide
            </button>
          </div>
        </div>
      ) : null}

      {/* ── the outline, before the expensive call ──────────────────────── */}
      {phase.step === "planned" ? (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: FAINT }}>
              Here&apos;s the plan
            </div>
            <div style={{ fontSize: 18, fontWeight: 650, color: INK, marginTop: 4 }}>
              {String(phase.plan.title ?? "Lesson")}
            </div>
            {phase.plan.objective ? (
              <div style={{ fontSize: 13.5, color: MUTED, marginTop: 4 }}>
                {String(phase.plan.objective)}
              </div>
            ) : null}
            {phase.plan.level ? (
              <div style={{ fontSize: 12.5, color: FAINT, marginTop: 6 }}>
                Level {String(phase.plan.level)}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() =>
                void build(brief, phase.plan).catch((e) =>
                  setPhase({ step: "error", message: (e as Error).message }),
                )
              }
              style={primaryButton}
            >
              Build it
            </button>
            <button type="button" onClick={() => setPhase({ step: "idle" })} style={ghostButton}>
              Start again
            </button>
          </div>
        </div>
      ) : null}

      {/* ── starters ────────────────────────────────────────────────────── */}
      {phase.step === "idle" && brief.trim() === "" ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: FAINT,
              marginRight: 2,
            }}
          >
            Try one of these
          </span>
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setBrief(s)}
              style={{
                border: `1px solid ${LINE}`,
                background: "#fff",
                borderRadius: 999,
                padding: "6px 13px",
                fontFamily: "inherit",
                fontSize: 12.5,
                color: MUTED,
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const primaryButton: React.CSSProperties = {
  border: 0,
  borderRadius: 9,
  background: INDIGO,
  color: "#fff",
  padding: "9px 16px",
  fontFamily: "inherit",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const ghostButton: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  background: "#fff",
  color: MUTED,
  padding: "9px 14px",
  fontFamily: "inherit",
  fontSize: 13.5,
  cursor: "pointer",
};
