"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import type { GradedItem } from "@/lib/reading/grade";
import type { ReadingModule } from "@/lib/reading/types";
import { CEFR, isCefrLevel, type CefrLevel } from "@/lib/cefr/levels";
import { bandColor } from "@/lib/ui/band";

import { CoachPanel } from "../_shared/coach-panel";
import { QuestionGroups } from "../_shared/question-groups";
import { Timer, type DeliveredQuestion } from "../_shared/question-inputs";
import { ReviewItem, WeakTypes, type TypeBreakdown } from "../_shared/review";
import { btnBase, AMBER, INDIGO, INK, MUTED, primaryBtn, RED, SANS, SERIF } from "../_shared/tokens";
import { WordLookup } from "../_shared/word-lookup";

// ---- Types -----------------------------------------------------------------

export interface RunnerPassage {
  id: string;
  title: string;
  body: string;
  module: ReadingModule;
  topic: string | null;
  difficulty: number | null;
  /** CEFR track only (A1..C2): report the result as a CEFR level, not a band. */
  cefrLevel?: string | null;
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

const MIN_FONT = 0.85;
const MAX_FONT = 1.4;

// ---- Runner ----------------------------------------------------------------

/**
 * Single-passage practice. Uses the SAME split-pane exam interface as the full
 * reading test (top bar with timer, text-size controls, passage | questions split,
 * a bottom question-nav, the reading coach) — only the content is one passage and
 * the submit/results path is the single-passage one. The shared QuestionGroups
 * gives it the Cambridge instruction headers + inline gap-fills too.
 */
export function ReadingRunner({ passage, questions }: { passage: RunnerPassage; questions: DeliveredQuestion[] }) {
  // CEFR passages carry their level's colour as the accent (and return to the CEFR
  // hub on exit); IELTS passages keep the indigo accent and return to /read.
  const accent = isCefrLevel(passage.cefrLevel ?? "") ? CEFR[passage.cefrLevel as CefrLevel].color : INDIGO;
  const exitHref = passage.cefrLevel ? "/cefr" : "/read";
  const [phase, setPhase] = useState<Phase>("reading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [fontScale, setFontScale] = useState(1);
  const [cur, setCur] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  const startRef = useRef(0);
  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const passageRef = useRef<HTMLElement | null>(null);
  useEffect(() => void (startRef.current = Date.now()), []);
  useEffect(() => void (answersRef.current = answers), [answers]);

  const allowance = useMemo(() => Math.max(600, questions.length * 90), [questions.length]);
  const numberById = useMemo(() => new Map(questions.map((q, i) => [q.id, q.order_index || i + 1])), [questions]);
  const total = questions.length;
  const answeredCount = useMemo(() => questions.reduce((n, q) => n + (answers[q.id]?.trim() ? 1 : 0), 0), [questions, answers]);

  const setAnswer = useCallback(
    (id: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [id]: value }));
      const n = numberById.get(id);
      if (n) setCur(n);
    },
    [numberById],
  );

  const toggleFlag = useCallback((id: string) => {
    setFlags((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }, []);

  const stepFont = useCallback((d: number) => {
    setFontScale((s) => Math.min(MAX_FONT, Math.max(MIN_FONT, +(s + d).toFixed(2))));
  }, []);

  const jumpTo = useCallback((qid: string) => {
    const n = numberById.get(qid);
    if (n) setCur(n);
    requestAnimationFrame(() => {
      const el = document.getElementById(`q-${qid}`);
      const pane = paneRef.current;
      if (el && pane) pane.scrollTo({ top: Math.max(0, el.offsetTop - 16), behavior: "smooth" });
    });
  }, [numberById]);

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

  const finish = useCallback(() => {
    if (submittingRef.current) return;
    if (total - answeredCount > 0) setConfirmOpen(true);
    else void submit();
  }, [answeredCount, submit, total]);

  if (phase === "results" && result) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px clamp(16px,4vw,32px) 64px" }}>
        <ResultsView result={result} disclaimer={disclaimer} passageBody={passage.body} cefrLevel={passage.cefrLevel ?? null} />
      </div>
    );
  }

  // ---- Reading phase (mirrors the full-test split-pane) --------------------
  const fontPx = Math.round(16 * fontScale);
  const pct = total ? Math.round((answeredCount / total) * 100) : 0;
  const kindLabel = passage.module === "general" ? "General Training" : "Academic";

  const coachQuestions = questions
    .map((q) => `Q${numberById.get(q.id)} [${q.question_type}]: ${q.prompt}`)
    .join("\n");
  const coachCurrent = (() => {
    const q = questions.find((x) => numberById.get(x.id) === cur);
    return q ? `Q${numberById.get(q.id)} [${q.question_type}]: ${q.prompt}` : "";
  })();

  return (
    <>
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#fff", fontFamily: SANS, color: INK, overflow: "hidden" }}>
        {/* Top bar: exit · timer · finish */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "12px 24px", flex: "none", borderBottom: "1px solid #F0EFF5" }}>
          <div style={{ justifySelf: "start" }}>
            <Link href={exitHref} aria-label="Exit practice" style={{ width: 42, height: 42, borderRadius: 999, border: "1.5px solid #EAE8F2", background: "#fff", color: MUTED, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, textDecoration: "none" }}>
              ←
            </Link>
          </div>
          <div style={{ justifySelf: "center" }}>
            <Timer seconds={allowance} onExpire={onExpire}>
              {(text, left) => {
                const warn = left <= 120;
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 20px", borderRadius: 999, background: warn ? "#FDECEC" : "#F4F3FC", border: `1.5px solid ${warn ? "#F3B4B4" : "#E4E2F4"}` }} aria-label="time remaining">
                    <span aria-hidden style={{ fontSize: 15, color: warn ? "#B91C1C" : INDIGO }}>◷</span>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 19, letterSpacing: ".02em", color: warn ? "#B91C1C" : INDIGO }}>{text}</span>
                  </span>
                );
              }}
            </Timer>
          </div>
          <div style={{ justifySelf: "end" }}>
            <button type="button" onClick={finish} disabled={submitting} style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: accent, color: "#fff", fontWeight: 600, fontSize: 15, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: SANS, boxShadow: `0 4px 14px ${accent}47` }}>
              {submitting ? "Marking…" : "Submit answers"}
            </button>
          </div>
        </div>

        {/* Strip: instruction + text size + progress */}
        <div style={{ flex: "none", background: "#FAFAFD", borderBottom: "1px solid #F0EFF5" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 28px", flexWrap: "wrap" }}>
            <div style={{ fontSize: 15, color: "#4A4660" }}>
              <span style={{ fontWeight: 700, color: INK }}>Passage practice</span> — Read the text and answer questions 1–{total}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#8C88A0", fontWeight: 500 }}>Text size</span>
                <button type="button" onClick={() => stepFont(-0.1)} disabled={fontScale <= MIN_FONT} aria-label="Decrease text size" style={fontBtn(fontScale <= MIN_FONT)}>A−</button>
                <button type="button" onClick={() => stepFont(0.1)} disabled={fontScale >= MAX_FONT} aria-label="Increase text size" style={{ ...fontBtn(fontScale >= MAX_FONT), fontSize: 15 }}>A+</button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>{answeredCount} of {total} answered</div>
            </div>
          </div>
          <div style={{ height: 3, background: "#EEEDF6" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: accent, transition: "width .3s ease" }} />
          </div>
          {message ? (
            <div style={{ padding: "8px 28px", background: "#FDECEC", borderTop: "1px solid #F3B4B4" }}>
              <span style={{ fontSize: 13, color: RED, fontWeight: 600 }} role="alert">{message}</span>
            </div>
          ) : null}
        </div>

        {/* Split: passage | questions */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <article ref={passageRef} style={{ flex: 1, overflow: "auto", padding: "32px clamp(20px,4vw,52px) 60px", minHeight: 0, borderRight: "1px solid #F0EFF5" }}>
            <div style={{ maxWidth: 680 }}>
              <p style={{ fontWeight: 600, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a96a8", margin: 0 }}>
                {kindLabel} Reading{passage.topic ? ` · ${passage.topic}` : ""}
              </p>
              <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 29, letterSpacing: "-.01em", color: INK, margin: "8px 0 20px" }}>{passage.title}</h1>
              <div style={{ lineHeight: 1.75, color: "#3A3650", fontSize: fontPx, whiteSpace: "pre-wrap" }}>{passage.body}</div>
            </div>
          </article>

          <div ref={paneRef} style={{ width: "46%", maxWidth: 760, flex: "none", overflow: "auto", padding: "30px clamp(20px,3vw,44px) 90px", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: INDIGO, margin: 0 }}>Questions 1–{total}</h2>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#A6A2B8", fontVariantNumeric: "tabular-nums" }}>{answeredCount} of {total}</span>
            </div>

            <QuestionGroups
              questions={questions}
              number={(q) => numberById.get(q.id) ?? q.order_index}
              answers={answers}
              onAnswer={setAnswer}
              flags={flags}
              onToggleFlag={toggleFlag}
            />
          </div>
        </div>

        {/* Bottom nav: question circles */}
        <div style={{ flex: "none", borderTop: "1px solid #F0EFF5", background: "#fff", padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
          {questions.map((q) => {
            const n = numberById.get(q.id) ?? q.order_index;
            const answered = !!answers[q.id]?.trim();
            const isCur = cur === n;
            const flg = !!flags[q.id];
            return (
              <button key={q.id} type="button" onClick={() => jumpTo(q.id)} aria-label={`Question ${n}${answered ? " (answered)" : ""}`} style={navCircle(answered, isCur)}>
                {n}
                {flg ? <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: AMBER, border: "1.5px solid #fff" }} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {confirmOpen ? (
        <ConfirmFinishModal
          unanswered={total - answeredCount}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            void submit();
          }}
        />
      ) : null}

      <CoachPanel passageTitle={passage.title} passageBody={passage.body} questions={coachQuestions} currentQuestion={coachCurrent} phase="reading" />
      <WordLookup getContainer={() => passageRef.current} contextText={passage.body} />
    </>
  );
}

// ---- Reading-phase styles --------------------------------------------------

function fontBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1.5px solid #EAE8F2",
    background: "#fff",
    color: disabled ? "#C7C4D4" : "#5A5670",
    fontWeight: 700,
    fontSize: 13,
    cursor: disabled ? "default" : "pointer",
    fontFamily: SANS,
  };
}

function navCircle(answered: boolean, current: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "relative",
    width: 30,
    height: 30,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "1.5px solid",
    fontFamily: SANS,
    fontVariantNumeric: "tabular-nums",
    transition: "all .12s ease",
  };
  if (current) return { ...base, borderColor: INDIGO, background: "#fff", color: INDIGO, boxShadow: "0 0 0 3px rgba(79,70,229,.16)" };
  if (answered) return { ...base, borderColor: INDIGO, background: INDIGO, color: "#fff" };
  return { ...base, borderColor: "#E5E3EF", background: "#fff", color: "#9B98AD" };
}

// ---- Confirm finish (in-app modal) -----------------------------------------

function ConfirmFinishModal({ unanswered, onCancel, onConfirm }: { unanswered: number; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-title"
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(30,27,46,.45)", backdropFilter: "blur(2px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(440px, 100%)", background: "#fff", borderRadius: 18, padding: "26px 26px 22px", boxShadow: "0 30px 70px -24px rgba(30,27,46,.6)", fontFamily: SANS, color: INK }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "#FEF3E2", color: "#C77C09", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <AlertTriangle size={22} />
        </div>
        <h2 id="finish-title" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 21, margin: 0, color: INK }}>Submit your answers?</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: MUTED, margin: "8px 0 0" }}>
          You have <strong style={{ color: INK, fontWeight: 700 }}>{unanswered}</strong> unanswered question{unanswered === 1 ? "" : "s"}. {unanswered === 1 ? "It" : "They"}&apos;ll be marked wrong, and you can&apos;t change your answers after submitting.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onCancel} style={{ padding: "10px 18px", borderRadius: 11, border: "1.5px solid #EAE8F2", background: "#fff", color: "#46435C", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}>Keep working</button>
          <button type="button" onClick={onConfirm} style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, cursor: "pointer", boxShadow: "0 8px 20px -10px rgba(79,70,229,.7)" }}>Submit anyway</button>
        </div>
      </div>
    </div>
  );
}

// ---- Results ---------------------------------------------------------------

function ResultsView({ result, disclaimer, passageBody, cefrLevel }: { result: ReadingResult; disclaimer: string | null; passageBody: string; cefrLevel?: string | null }) {
  const wrong = result.items.filter((it) => !it.is_correct);
  const cefr = cefrLevel && isCefrLevel(cefrLevel) ? cefrLevel : null;
  const bc = bandColor(result.band);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <section style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "8px 24px" }}>
        {cefr ? (
          (() => {
            const info = CEFR[cefr];
            const pct = result.percent;
            const note = pct >= 80 ? `Comfortable at ${cefr}` : pct >= 50 ? `Working at ${cefr}` : `Below ${cefr} — try a lower level`;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 64, lineHeight: 0.9, color: info.color, letterSpacing: "-.02em" }}>{cefr}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: MUTED }}>CEFR {info.name} reading</span>
                  <span style={{ alignSelf: "flex-start", fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: info.color, background: info.bg, padding: "3px 10px", borderRadius: 999 }}>{note}</span>
                </div>
              </div>
            );
          })()
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 64, lineHeight: 0.9, color: bc.fg, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>{result.band.toFixed(1)}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: MUTED }}>Indicative band</span>
              <span style={{ alignSelf: "flex-start", fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: bc.fg, background: bc.bg, padding: "3px 10px", borderRadius: 999 }}>{bc.label}</span>
            </div>
          </div>
        )}
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
        <Link href={cefr ? "/cefr" : "/read"} style={primaryBtn(false, cefr ? CEFR[cefr].color : undefined)}>Try another passage</Link>
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
