"use client";

import { useEffect, useRef, useState } from "react";

import { gradeClosed, type Answers } from "@/lib/lessons/grade";
import { isOpen, type Exercise, type ExerciseResult, type LessonContent } from "@/lib/lessons/types";
import { isOpenResult } from "@/lib/lessons/types";

/**
 * Doing a lesson: read it, answer it, hand it in, see what you got wrong.
 *
 * TEST MODE, deliberately. Answers go in on the page itself, nothing is marked
 * until they submit, and the key only appears afterwards — a page that told you
 * the answer as you typed would be a worksheet, not practice.
 *
 * The browser marks the closed half with the SAME function the server uses, so
 * the score appears instantly instead of after a round trip. The server marks
 * it again on submit and stores that — a client that posts its own score is a
 * client that can post 10/10.
 */

const INK = "#15171C";
const BODY = "#2A2D34";
const MUTED = "#5C616C";
const FAINT = "#8B909B";
const LINE = "#E7E5DF";
const GREEN = "#16794C";
const RED = "#A63A30";
const EMBER = "#E85A2C";

const STAGE_LABEL: Record<string, string> = {
  controlled: "Warm up",
  semi_controlled: "Now change it",
  freer: "Now write your own",
};

export interface RunnerResult {
  attemptId: string;
  score: number;
  maxScore: number;
  results: Record<string, ExerciseResult>;
  gradingStatus: string;
  notice?: string;
}

export function LessonRunner({
  lessonId,
  content,
  /** Off for the public page: nothing is stored and nothing is model-marked. */
  canSubmit = true,
}: {
  lessonId: string;
  content: LessonContent;
  canSubmit?: boolean;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Set in an effect, not during render: reading the clock while rendering is
  // an impure call, and a re-render would move the start time anyway.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const resultsRef = useRef<HTMLDivElement>(null);

  const done = result != null;
  const set = (id: string, value: string | string[]) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  const answeredCount = content.exercises.filter((e) => {
    const v = answers[e.id];
    return Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "";
  }).length;

  async function submit() {
    if (submitting || done) return;
    setSubmitting(true);
    setError(null);

    // Mark locally first so the page can respond immediately even on a slow
    // connection; the server's marking is what actually counts and replaces it.
    const local = gradeClosed(content, answers, { includeOpenInMax: canSubmit });

    if (!canSubmit) {
      setResult({
        attemptId: "",
        score: local.score,
        maxScore: local.maxScore,
        results: local.results,
        gradingStatus: "complete",
      });
      setSubmitting(false);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    try {
      const res = await fetch(`/api/lessons/${lessonId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          durationSeconds: startedAt.current
            ? Math.round((Date.now() - startedAt.current) / 1000)
            : null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as RunnerResult & { error?: string };
      if (!res.ok) {
        setError(
          body.error === "not_found"
            ? "This lesson isn't available to you."
            : "Couldn't hand that in. Your answers are still here — try again.",
        );
        setSubmitting(false);
        return;
      }
      setResult(body);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError("Couldn't reach the server. Your answers are still here — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const stages = ["controlled", "semi_controlled", "freer"] as const;

  return (
    <div>
      <div ref={resultsRef} />

      {done ? (
        <ScoreCard result={result} canSubmit={canSubmit} />
      ) : null}

      {stages.map((stage) => {
        const items = content.exercises.filter((e) => e.stage === stage);
        if (items.length === 0) return null;
        return (
          <section key={stage} style={{ marginBottom: 34 }}>
            <h3
              style={{
                fontSize: 12,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: FAINT,
                fontWeight: 600,
                margin: "0 0 14px",
              }}
            >
              {STAGE_LABEL[stage]}
            </h3>
            {items.map((exercise, i) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                n={content.exercises.indexOf(exercise) + 1}
                value={answers[exercise.id]}
                onChange={(v) => set(exercise.id, v)}
                result={result?.results[exercise.id]}
                locked={done}
                first={i === 0}
              />
            ))}
          </section>
        );
      })}

      {!done ? (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "linear-gradient(180deg, rgba(253,253,253,0) 0%, #FDFDFD 42%)",
            padding: "22px 0 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            style={{
              border: 0,
              borderRadius: 11,
              background: EMBER,
              color: "#fff",
              padding: "13px 26px",
              fontFamily: "inherit",
              fontSize: 15.5,
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              boxShadow: "0 10px 22px -8px rgba(232,90,44,.6)",
            }}
          >
            {submitting ? "Checking…" : "Hand it in"}
          </button>
          <span style={{ fontSize: 13.5, color: MUTED }}>
            {answeredCount} of {content.exercises.length} answered
            {answeredCount < content.exercises.length ? " — you can hand in anyway" : ""}
          </span>
          {error ? (
            <span style={{ flexBasis: "100%", fontSize: 13.5, color: RED }} role="alert">
              {error}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ScoreCard({ result, canSubmit }: { result: RunnerResult; canSubmit: boolean }) {
  const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        padding: "22px 24px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: 34, fontWeight: 700, color: INK, letterSpacing: "-.02em" }}>
          {result.score}
          <span style={{ fontSize: 20, color: FAINT, fontWeight: 500 }}> / {result.maxScore}</span>
        </div>
        <div style={{ fontSize: 13.5, color: MUTED }}>{pct}% correct</div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: BODY, flex: 1, minWidth: 220, lineHeight: 1.55 }}>
        {result.notice
          ? result.notice
          : canSubmit
            ? "Scroll down — every answer now shows what was right and why."
            : "Answers are shown below. Nothing was saved, because you're not signed in."}
      </p>
    </div>
  );
}

function ExerciseCard({
  exercise,
  n,
  value,
  onChange,
  result,
  locked,
  first,
}: {
  exercise: Exercise;
  n: number;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  result: ExerciseResult | undefined;
  locked: boolean;
  first: boolean;
}) {
  // Narrow the union ONCE, here. Reaching for `exercise.criteria` further down
  // without this is what the compiler rightly refuses — half the fields only
  // exist on one arm.
  const openEx = isOpen(exercise) ? exercise : null;
  const closedEx = isOpen(exercise) ? null : exercise;
  const closedResult = result && !isOpenResult(result) ? result : null;
  const openResult = result && isOpenResult(result) ? result : null;

  const tone = closedResult ? (closedResult.correct ? GREEN : RED) : null;

  return (
    <div
      style={{
        borderTop: first ? 0 : `1px solid #F2F0EB`,
        padding: "18px 0",
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <span
          style={{
            flex: "none",
            width: 24,
            fontSize: 13,
            color: tone ?? FAINT,
            fontWeight: tone ? 700 : 400,
            fontVariantNumeric: "tabular-nums",
            paddingTop: 2,
          }}
        >
          {closedResult ? (closedResult.correct ? "✓" : "✕") : n}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, color: BODY, lineHeight: 1.6, marginBottom: 10 }}>
            {exercise.prompt}
          </div>

          {/* ---- the answer control ---- */}
          {closedEx?.options ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {closedEx.options.map((opt, i) => {
                const multi = closedEx.type === "mcq_multi";
                const chosen = multi
                  ? Array.isArray(value) && value.includes(String(i))
                  : value === String(i);
                const isKey = locked && closedEx.answers.includes(String(i));
                return (
                  <label
                    key={opt}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: `1px solid ${isKey ? "#B6D9C4" : chosen ? EMBER : LINE}`,
                      background: isKey ? "#EAF4EE" : chosen ? "rgba(232,90,44,.06)" : "#fff",
                      borderRadius: 10,
                      padding: "10px 13px",
                      cursor: locked ? "default" : "pointer",
                      fontSize: 15,
                      color: BODY,
                    }}
                  >
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name={exercise.id}
                      checked={chosen}
                      disabled={locked}
                      onChange={() => {
                        if (multi) {
                          const cur = Array.isArray(value) ? value : [];
                          onChange(
                            cur.includes(String(i))
                              ? cur.filter((v) => v !== String(i))
                              : [...cur, String(i)],
                          );
                        } else {
                          onChange(String(i));
                        }
                      }}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          ) : openEx ? (
            <textarea
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              disabled={locked}
              rows={3}
              placeholder="Write your answer…"
              style={inputStyle}
            />
          ) : (
            <input
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              disabled={locked}
              placeholder="Your answer…"
              style={{ ...inputStyle, maxWidth: 420 }}
            />
          )}

          {/* ---- feedback, only after handing in ---- */}
          {closedResult && !closedResult.correct ? (
            <div style={{ marginTop: 9, fontSize: 14, color: GREEN }}>
              <strong style={{ fontWeight: 600 }}>Answer:</strong> {closedResult.expected}
            </div>
          ) : null}

          {openResult ? (
            <div style={{ marginTop: 11 }}>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>
                {openResult.score} of {openResult.max} checks passed
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {openEx?.criteria.map((c: string, i: number) => {
                  const verdict = openResult.criteria[i];
                  return (
                    <li
                      key={c}
                      style={{
                        display: "flex",
                        gap: 8,
                        fontSize: 14,
                        color: verdict?.met ? GREEN : RED,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ flex: "none" }}>{verdict?.met ? "✓" : "✕"}</span>
                      <span>
                        {c}
                        {verdict?.evidence ? (
                          <span style={{ color: MUTED }}> — {verdict.evidence}</span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {openResult.corrected ? (
                <div style={{ marginTop: 8, fontSize: 14, color: BODY }}>
                  <strong style={{ fontWeight: 600, color: GREEN }}>Better:</strong>{" "}
                  {openResult.corrected}
                </div>
              ) : null}
              {openResult.note ? (
                <div style={{ marginTop: 5, fontSize: 13.5, color: MUTED }}>{openResult.note}</div>
              ) : null}
            </div>
          ) : null}

          {/* On the public page nothing is model-marked, so the checklist and a
              model answer are shown to check yourself against instead. */}
          {locked && openEx && !openResult ? (
            <div style={{ marginTop: 11, fontSize: 14, color: BODY }}>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 5 }}>Check yourself:</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: MUTED }}>
                {openEx.criteria.map((c: string) => (
                  <li key={c} style={{ marginBottom: 3 }}>
                    {c}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 7, color: GREEN }}>
                <strong style={{ fontWeight: 600 }}>One good answer:</strong>{" "}
                {openEx.model_answer}
              </div>
            </div>
          ) : null}

          {locked && exercise.why ? (
            <div style={{ marginTop: 8, fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
              {exercise.why}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${LINE}`,
  borderRadius: 10,
  padding: "11px 13px",
  fontFamily: "inherit",
  fontSize: 15,
  lineHeight: 1.5,
  color: INK,
  background: "#fff",
  outline: "none",
  resize: "vertical",
};
