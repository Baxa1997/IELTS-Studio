"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GradedItem } from "@/lib/reading/grade";
import { READING_QUESTION_LABELS, type ReadingModule } from "@/lib/reading/types";

import { QuestionInput, Timer, type DeliveredQuestion } from "../_shared/question-inputs";
import { ReviewItem, WeakTypes, type TypeBreakdown } from "../_shared/review";
import { btnBase, INK, MUTED, primaryBtn, RED, SANS, SERIF, INDIGO } from "../_shared/tokens";
import { WordLookup } from "../_shared/word-lookup";

// ---- Types -----------------------------------------------------------------

export interface RunnerPassage {
  id: string;
  title: string;
  body: string;
  module: ReadingModule;
  topic: string | null;
  difficulty: number | null;
}

export type { DeliveredQuestion };

interface ReadingResult {
  passageTitle: string;
  total: number;
  correctCount: number;
  percent: number;
  band: number;
  typeBreakdown: TypeBreakdown;
  items: GradedItem[];
}

type Phase = "reading" | "results";

// ---- Runner ----------------------------------------------------------------

export function ReadingRunner({ passage, questions }: { passage: RunnerPassage; questions: DeliveredQuestion[] }) {
  const [phase, setPhase] = useState<Phase>("reading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  const startRef = useRef(0);
  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const passageRef = useRef<HTMLElement | null>(null);
  useEffect(() => void (startRef.current = Date.now()), []);
  useEffect(() => void (answersRef.current = answers), [answers]);

  const allowance = useMemo(() => Math.max(600, questions.length * 90), [questions.length]);
  const answeredCount = useMemo(() => questions.reduce((n, q) => n + (answers[q.id]?.trim() ? 1 : 0), 0), [questions, answers]);

  const setAnswer = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setMessage(null);

    const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
    try {
      const res = await fetch(`/api/reading/${passage.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current, durationSeconds }),
      });
      const body = (await res.json().catch(() => ({}))) as { result?: ReadingResult; disclaimer?: string; error?: string };
      if (res.ok && body.result) {
        setResult(body.result);
        setDisclaimer(body.disclaimer ?? null);
        setPhase("results");
        window.scrollTo({ top: 0 });
      } else {
        setMessage(messageFor(res.status, body.error));
      }
    } catch {
      setMessage("Network error while submitting — please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [passage.id]);

  const submitRef = useRef(submit);
  useEffect(() => void (submitRef.current = submit), [submit]);
  const onExpire = useCallback(() => void submitRef.current(), []);

  if (phase === "results" && result) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px clamp(16px,4vw,32px) 64px" }}>
        <ResultsView result={result} disclaimer={disclaimer} passageBody={passage.body} />
      </div>
    );
  }

  // phase === "reading"
  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "0 clamp(14px,3vw,28px)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid #EAE7D8", background: "rgba(251,250,243,.9)", backdropFilter: "blur(8px)" }}>
        <Link href="/read" style={{ fontFamily: SANS, fontSize: 14, color: MUTED, textDecoration: "none" }}>← Exit</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: SANS, fontSize: 14 }}>
          <Timer seconds={allowance} onExpire={onExpire} />
          <span style={{ color: MUTED, fontVariantNumeric: "tabular-nums" }}>{answeredCount}/{questions.length} answered</span>
        </div>
      </header>

      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, flex: 1, padding: "18px 0" }}>
        {/* Passage — sticky on desktop so questions stay beside the text. */}
        <article ref={passageRef} className="lp-read-passage">
          <p style={{ fontFamily: SANS, fontWeight: 600, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a998c", margin: 0 }}>
            {passage.module === "general" ? "General Training" : "Academic"} Reading
            {passage.topic ? ` · ${passage.topic}` : ""}
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 23, letterSpacing: "-.01em", color: INK, margin: "6px 0 0" }}>{passage.title}</h1>
          <div style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.75, color: "#3a3d52", marginTop: 12, whiteSpace: "pre-wrap" }}>{passage.body}</div>
        </article>

        {/* Questions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {questions.map((q) => (
            <fieldset key={q.id} style={{ border: "none", borderBottom: "1px solid #EAE7D8", margin: 0, padding: "0 0 16px" }}>
              <legend style={{ display: "flex", alignItems: "baseline", gap: 8, padding: 0 }}>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: INK, fontVariantNumeric: "tabular-nums" }}>Q{q.order_index}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: "#9a998c" }}>{READING_QUESTION_LABELS[q.question_type]}</span>
              </legend>
              <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: INK, margin: "6px 0 10px", whiteSpace: "pre-wrap" }}>{q.prompt}</p>
              <QuestionInput question={q} value={answers[q.id] ?? ""} onChange={(v) => setAnswer(q.id, v)} />
            </fieldset>
          ))}
        </div>
      </div>

      <footer style={{ position: "sticky", bottom: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid #EAE7D8", background: "rgba(251,250,243,.9)", backdropFilter: "blur(8px)", flexWrap: "wrap" }}>
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, margin: 0 }}>
          {answeredCount < questions.length ? `${questions.length - answeredCount} unanswered — they'll be marked wrong.` : "All questions answered."}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {message ? <span style={{ fontFamily: SANS, fontSize: 12.5, color: RED }} role="alert">{message}</span> : null}
          <button type="button" onClick={() => void submit()} disabled={submitting} style={primaryBtn(submitting)}>
            {submitting ? "Marking…" : "Submit answers"}
          </button>
        </div>
      </footer>

      <WordLookup getContainer={() => passageRef.current} contextText={passage.body} />
    </div>
  );
}

// ---- Results ---------------------------------------------------------------

function ResultsView({ result, disclaimer, passageBody }: { result: ReadingResult; disclaimer: string | null; passageBody: string }) {
  const wrong = result.items.filter((it) => !it.is_correct);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <section style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "8px 24px" }}>
        <div>
          <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 40, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>{result.band.toFixed(1)}</span>
          <span style={{ fontFamily: SANS, fontSize: 14, color: MUTED, marginLeft: 8 }}>indicative band</span>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: 0 }}>
          <span style={{ color: INK, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{result.correctCount}/{result.total}</span> correct · {result.percent.toFixed(0)}%
        </p>
      </section>

      <WeakTypes breakdown={result.typeBreakdown} />

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: INK, margin: 0 }}>
          {wrong.length === 0 ? "Every answer correct — review the proof below." : `Review — ${wrong.length} to learn from`}
        </h2>
        {result.items.map((it) => (
          <ReviewItem key={it.id} item={it} passageBody={passageBody} />
        ))}
      </section>

      {disclaimer ? <p style={{ fontFamily: SANS, fontSize: 12, color: "#9a998c", margin: 0 }}>{disclaimer}</p> : null}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <Link href="/read" style={primaryBtn()}>Try another passage</Link>
        <Link href="/dashboard" style={{ ...btnBase, background: "transparent", color: MUTED }}>Back to dashboard</Link>
      </div>
    </div>
  );
}

// ---- Helpers ---------------------------------------------------------------

function messageFor(status: number, error?: string): string {
  if (status === 404) return "This passage isn't available anymore.";
  if (status === 422) return error === "no_questions" ? "This passage has no questions yet." : "Nothing to mark.";
  if (status === 401) return "Your session expired — please sign in again.";
  if (status === 403) return "Only students can practice reading.";
  return "Couldn't mark your answers. Please try again.";
}
