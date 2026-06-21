"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import type { GradedItem } from "@/lib/reading/grade";
import { READING_QUESTION_LABELS, READING_TEST_DURATION_SECONDS } from "@/lib/reading/types";

import { CoachPanel } from "../../_shared/coach-panel";
import { QuestionInput, Timer, type DeliveredQuestion } from "../../_shared/question-inputs";
import { perfColor, ReviewItem, statusOf, WeakTypes, type TypeBreakdown } from "../../_shared/review";
import { AMBER, INDIGO, INK, MUTED, RED, SANS, SERIF } from "../../_shared/tokens";
import { WordLookup } from "../../_shared/word-lookup";

// ---- Types -----------------------------------------------------------------

export interface TestPassage {
  id: string;
  order: number;
  title: string;
  body: string;
  topic: string | null;
  questions: DeliveredQuestion[];
}

interface TestResult {
  total: number;
  correctCount: number;
  percent: number;
  band: number;
  passages: { order: number; title: string; total: number; correctCount: number }[];
  typeBreakdown: TypeBreakdown;
  items: GradedItem[];
}

type Phase = "reading" | "results";

const MIN_FONT = 0.85;
const MAX_FONT = 1.4;
const OPTION_LETTERS = "ABCDEFGH".split("");

// ---- Runner ----------------------------------------------------------------

export function ReadingTestRunner({ testId, passages }: { testId: string; passages: TestPassage[] }) {
  const [phase, setPhase] = useState<Phase>("reading");
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [fontScale, setFontScale] = useState(1);
  const [cur, setCur] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [usedSeconds, setUsedSeconds] = useState<number | null>(null);

  const startRef = useRef(0);
  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const scrollTargetRef = useRef<string | null>(null);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const passageRef = useRef<HTMLElement | null>(null);
  useEffect(() => void (startRef.current = Date.now()), []);
  useEffect(() => void (answersRef.current = answers), [answers]);

  // Global question numbering 1..N across the 3 passages, in passage order.
  const flat = useMemo(() => {
    const out: { passageIndex: number; q: DeliveredQuestion; n: number }[] = [];
    let n = 1;
    passages.forEach((p, pi) => p.questions.forEach((q) => out.push({ passageIndex: pi, q, n: n++ })));
    return out;
  }, [passages]);
  const total = flat.length;
  const numberById = useMemo(() => new Map(flat.map((f) => [f.q.id, f.n])), [flat]);

  const answeredCount = useMemo(() => flat.reduce((a, f) => a + (answers[f.q.id]?.trim() ? 1 : 0), 0), [flat, answers]);

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

  // Jump to a question — switch passage if needed, then scroll it into view.
  const doScroll = useCallback(() => {
    const qid = scrollTargetRef.current;
    if (!qid) return;
    scrollTargetRef.current = null;
    requestAnimationFrame(() => {
      const el = document.getElementById(`q-${qid}`);
      const pane = paneRef.current;
      if (el && pane) pane.scrollTo({ top: Math.max(0, el.offsetTop - 16), behavior: "smooth" });
    });
  }, []);
  const jumpTo = useCallback(
    (passageIndex: number, qid: string) => {
      scrollTargetRef.current = qid;
      const n = numberById.get(qid);
      if (n) setCur(n);
      if (passageIndex !== active) setActive(passageIndex);
      else doScroll();
    },
    [active, doScroll, numberById],
  );
  // On passage switch, reset BOTH columns to the top — unless a specific question
  // jump is pending (then scroll the question pane to it). Without this, the reused
  // scroll containers carry the previous passage's scroll position into the new one.
  useEffect(() => {
    passageRef.current?.scrollTo({ top: 0 });
    if (scrollTargetRef.current) doScroll();
    else paneRef.current?.scrollTo({ top: 0 });
  }, [active, doScroll]);

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setMessage(null);
    const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
    setUsedSeconds(durationSeconds);
    try {
      const res = await fetch(`/api/reading/test/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current, durationSeconds }),
      });
      const body = (await res.json().catch(() => ({}))) as { result?: TestResult; disclaimer?: string; error?: string };
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
  }, [testId]);

  const submitRef = useRef(submit);
  useEffect(() => void (submitRef.current = submit), [submit]);
  const onExpire = useCallback(() => void submitRef.current(), []);

  const finish = useCallback(() => {
    if (submittingRef.current) return;
    if (total - answeredCount > 0) setConfirmOpen(true); // confirm via the in-app modal
    else void submit();
  }, [answeredCount, submit, total]);

  // ---- Results phase -------------------------------------------------------
  if (phase === "results" && result) {
    const joinedBodies = passages.map((p) => `${p.title}\n${p.body}`).join("\n\n").slice(0, 7500);
    return (
      <>
        <TestResultsView result={result} disclaimer={disclaimer} passages={passages} flags={flags} usedSeconds={usedSeconds} testId={testId} />
        <CoachPanel passageTitle="Full test review" passageBody={joinedBodies} phase="results" />
      </>
    );
  }

  // ---- Reading phase -------------------------------------------------------
  const passage = passages[active];
  const partFlat = flat.filter((f) => f.passageIndex === active);
  const startN = partFlat[0]?.n ?? 1;
  const endN = partFlat[partFlat.length - 1]?.n ?? total;
  const partCount = passage.questions.length;
  const partAnswered = passage.questions.reduce((a, q) => a + (answers[q.id]?.trim() ? 1 : 0), 0);
  const fontPx = Math.round(16 * fontScale);
  const pct = total ? Math.round((answeredCount / total) * 100) : 0;

  // Context for the coach: the answer-free questions the student is looking at (so
  // "the first question" / "Q5" resolve), plus the one currently in focus. No keys
  // exist client-side; the prompt still withholds answers until submit.
  const coachQuestions = passage.questions
    .map((q) => {
      const n = numberById.get(q.id);
      const opts = q.options?.length ? `\n   Options: ${q.options.map((o, i) => `${OPTION_LETTERS[i] ?? i + 1}. ${o}`).join("; ")}` : "";
      return `Q${n} [${READING_QUESTION_LABELS[q.question_type]}]: ${q.prompt}${opts}`;
    })
    .join("\n");
  const focused = partFlat.find((f) => f.n === cur);
  const coachCurrent = focused ? `Q${focused.n} [${READING_QUESTION_LABELS[focused.q.question_type]}]: ${focused.q.prompt}` : "";

  return (
    <>
      {/* Pinned to the viewport so only the passage/question panes scroll — the page
          itself never does (the results phase below is a normal scrolling view). */}
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#fff", fontFamily: SANS, color: INK, overflow: "hidden" }}>
        {/* Top bar: exit · timer · finish */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "12px 24px", flex: "none", borderBottom: "1px solid #F0EFF5" }}>
          <div style={{ justifySelf: "start" }}>
            <Link href="/read" aria-label="Exit test" style={{ width: 42, height: 42, borderRadius: 999, border: "1.5px solid #EAE8F2", background: "#fff", color: MUTED, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, textDecoration: "none" }}>
              ←
            </Link>
          </div>
          <div style={{ justifySelf: "center" }}>
            <Timer seconds={READING_TEST_DURATION_SECONDS} onExpire={onExpire}>
              {(text, left) => {
                const warn = left <= 300;
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
            <button type="button" onClick={finish} disabled={submitting} style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: submitting ? "#9a96d6" : INDIGO, color: "#fff", fontWeight: 600, fontSize: 15, cursor: submitting ? "default" : "pointer", fontFamily: SANS, boxShadow: "0 4px 14px rgba(79,70,229,.28)" }}>
              {submitting ? "Marking…" : "Finish Test"}
            </button>
          </div>
        </div>

        {/* Part strip + text size + progress */}
        <div style={{ flex: "none", background: "#FAFAFD", borderBottom: "1px solid #F0EFF5" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 28px", flexWrap: "wrap" }}>
            <div style={{ fontSize: 15, color: "#4A4660" }}>
              <span style={{ fontWeight: 700, color: INK }}>Part {active + 1}</span> — Read the text and answer questions {startN}–{endN}
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
            <div style={{ height: "100%", width: `${pct}%`, background: INDIGO, transition: "width .3s ease" }} />
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
                Passage {active + 1} of {passages.length} · Academic Reading{passage.topic ? ` · ${passage.topic}` : ""}
              </p>
              <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 29, letterSpacing: "-.01em", color: INK, margin: "8px 0 20px" }}>{passage.title}</h1>
              <div style={{ lineHeight: 1.75, color: "#3A3650", fontSize: fontPx, whiteSpace: "pre-wrap" }}>{passage.body}</div>
            </div>
          </article>

          <div ref={paneRef} style={{ width: "46%", maxWidth: 760, flex: "none", overflow: "auto", padding: "30px clamp(20px,3vw,44px) 90px", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: INDIGO, margin: 0 }}>Questions {startN}–{endN}</h2>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#A6A2B8", fontVariantNumeric: "tabular-nums" }}>{partAnswered} of {partCount}</span>
            </div>

            {passage.questions.map((q) => {
              const n = numberById.get(q.id);
              const flagged = !!flags[q.id];
              return (
                <fieldset key={q.id} id={`q-${q.id}`} style={{ border: "none", margin: "0 0 28px", padding: 0, scrollMarginTop: 16 }}>
                  <legend style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: 0, width: "100%" }}>
                    <span style={{ fontWeight: 700, color: INK, fontSize: 17, lineHeight: 1.45, fontVariantNumeric: "tabular-nums" }}>{n}.</span>
                    <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "#A6A2B8" }}>{READING_QUESTION_LABELS[q.question_type]}</span>
                      <span style={{ fontSize: 16.5, lineHeight: 1.45, color: INK }}>{q.prompt}</span>
                    </span>
                    <button type="button" onClick={() => toggleFlag(q.id)} aria-pressed={flagged} title="Flag for review" style={flagStyle(flagged)}>⚑</button>
                  </legend>
                  <div style={{ paddingLeft: 26, marginTop: 12 }}>
                    <QuestionInput question={q} value={answers[q.id] ?? ""} onChange={(v) => setAnswer(q.id, v)} />
                  </div>
                </fieldset>
              );
            })}
          </div>
        </div>

        {/* Bottom nav: parts + per-part question circles */}
        <div style={{ flex: "none", borderTop: "1px solid #F0EFF5", background: "#fff", padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          {passages.map((p, pi) => {
            const ans = p.questions.reduce((a, q) => a + (answers[q.id]?.trim() ? 1 : 0), 0);
            const on = pi === active;
            return (
              <Fragment key={p.id}>
                <button
                  type="button"
                  onClick={() => setActive(pi)}
                  aria-current={on ? "true" : undefined}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 18px",
                    borderRadius: 999,
                    cursor: "pointer",
                    flex: "none",
                    background: "#fff",
                    fontFamily: SANS,
                    border: `1.5px solid ${on ? INDIGO : "#EAE8F2"}`,
                  }}
                >
                  <span style={{ fontWeight: on ? 700 : 600, fontSize: 14.5, color: on ? INDIGO : "#4A4660" }}>Part {pi + 1}</span>
                  {!on ? <span style={{ fontSize: 13, color: "#A6A2B8", fontVariantNumeric: "tabular-nums" }}>{ans} of {p.questions.length}</span> : null}
                </button>
                {on ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    {partFlat.map((f) => {
                      const answered = !!answers[f.q.id]?.trim();
                      const isCur = cur === f.n;
                      const flg = !!flags[f.q.id];
                      return (
                        <button key={f.q.id} type="button" onClick={() => jumpTo(active, f.q.id)} aria-label={`Question ${f.n}${answered ? " (answered)" : ""}`} style={navCircle(answered, isCur)}>
                          {f.n}
                          {flg ? <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: AMBER, border: "1.5px solid #fff" }} /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </Fragment>
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

function flagStyle(on: boolean): React.CSSProperties {
  return {
    flex: "none",
    width: 30,
    height: 30,
    borderRadius: 9,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: SANS,
    transition: "all .14s ease",
    background: on ? "#FEF6E7" : "#fff",
    border: `1.5px solid ${on ? "#F6D58A" : "#EAE8F2"}`,
    color: on ? "#C77C09" : "#B6B2C8",
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

// ---- Confirm finish (in-app modal, replaces window.confirm) ----------------

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
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(30,27,46,.45)", backdropFilter: "blur(2px)", animation: "lp-fadeup .16s ease both" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(440px, 100%)", background: "#fff", borderRadius: 18, padding: "26px 26px 22px", boxShadow: "0 30px 70px -24px rgba(30,27,46,.6)", fontFamily: SANS, color: INK }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "#FEF3E2", color: "#C77C09", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <AlertTriangle size={22} />
        </div>
        <h2 id="finish-title" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 21, margin: 0, color: INK }}>Finish the test?</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: MUTED, margin: "8px 0 0" }}>
          You have <strong style={{ color: INK, fontWeight: 700 }}>{unanswered}</strong> unanswered question{unanswered === 1 ? "" : "s"}. {unanswered === 1 ? "It" : "They"}&apos;ll be marked wrong, and you can&apos;t change your answers after finishing.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onCancel} style={{ padding: "10px 18px", borderRadius: 11, border: "1.5px solid #EAE8F2", background: "#fff", color: "#46435C", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}>Keep working</button>
          <button type="button" onClick={onConfirm} style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, cursor: "pointer", boxShadow: "0 8px 20px -10px rgba(79,70,229,.7)" }}>Finish anyway</button>
        </div>
      </div>
    </div>
  );
}

// ---- Results ---------------------------------------------------------------

type ReviewFilter = "all" | "incorrect" | "skipped" | "flagged";

function fmtClock(total: number | null): string {
  if (total == null || total < 0) return "—";
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TestResultsView({
  result,
  disclaimer,
  passages,
  flags,
  usedSeconds,
  testId,
}: {
  result: TestResult;
  disclaimer: string | null;
  passages: TestPassage[];
  flags: Record<string, boolean>;
  usedSeconds: number | null;
  testId: string;
}) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const bodyByOrder = useMemo(() => new Map(passages.map((p) => [p.order, p.body])), [passages]);
  const titleByOrder = useMemo(() => new Map(passages.map((p) => [p.order, p.title])), [passages]);

  const isFlagged = useCallback((it: GradedItem) => !!flags[it.id], [flags]);
  const counts: Record<ReviewFilter, number> = {
    all: result.items.length,
    incorrect: result.items.filter((it) => statusOf(it) === "incorrect").length,
    skipped: result.items.filter((it) => statusOf(it) === "skipped").length,
    flagged: result.items.filter(isFlagged).length,
  };
  const matches = (it: GradedItem) =>
    filter === "all" ? true : filter === "flagged" ? isFlagged(it) : statusOf(it) === filter;
  const visible = result.items.filter(matches);
  const toReview = result.total - result.correctCount;

  const filterDefs: { key: ReviewFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "incorrect", label: "Incorrect" },
    { key: "skipped", label: "Skipped" },
    { key: "flagged", label: "Flagged" },
  ];
  const showingLabel: Record<ReviewFilter, string> = {
    all: `Showing all ${counts.all} reviewed questions`,
    incorrect: "Showing incorrect answers",
    skipped: "Showing skipped questions",
    flagged: "Showing flagged questions",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#FBFBFD", fontFamily: SANS, color: INK }}>
      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(251,251,253,.88)", backdropFilter: "blur(10px)", borderBottom: "1px solid #EFEEF5" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 28px" }}>
          <Link href="/read" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 15, fontWeight: 600, color: "#5A5670", textDecoration: "none", padding: "6px 10px", borderRadius: 9, marginLeft: -10 }}>
            <span style={{ fontSize: 17 }}>←</span> Exit
          </Link>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: ".02em", color: "#8C88A0" }}>Test review · Academic Reading</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={() => window.print()} style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #EAE8F2", background: "#fff", color: "#46435C", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: SANS }}>Export PDF</button>
            <button type="button" onClick={() => window.location.assign(`/read/test/${testId}`)} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: INDIGO, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: SANS, boxShadow: "0 3px 10px rgba(79,70,229,.26)" }}>Retake test</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px 90px" }}>
        {/* Hero */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 34, flexWrap: "wrap", marginBottom: 30 }}>
          <div style={{ flex: "none" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 72, fontWeight: 700, lineHeight: 0.9, color: INDIGO, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>{result.band.toFixed(1)}</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: "#8C88A0" }}>indicative<br />band</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 15, color: "#46435C", fontWeight: 500 }}>
              <span style={{ color: INK, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{result.correctCount} / {result.total}</span> correct · {result.percent.toFixed(0)}%
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 340, display: "flex", flexDirection: "column", gap: 14, paddingTop: 6 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#8C88A0", marginBottom: 7 }}><span>Accuracy</span><span style={{ color: INDIGO }}>{result.percent.toFixed(0)}%</span></div>
              <div style={{ height: 10, borderRadius: 999, background: "#EEEDF6", overflow: "hidden" }}><div style={{ height: "100%", width: `${result.percent}%`, background: "linear-gradient(90deg,#6D63F0,#4F46E5)", borderRadius: 999 }} /></div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <StatCard label="Time used" value={fmtClock(usedSeconds)} />
              <StatCard label="To review" value={String(toReview)} color="#DC2626" />
              <StatCard label="Flagged" value={String(counts.flagged)} color="#C77C09" />
            </div>
          </div>
        </div>

        {/* Passage summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 18 }}>
          {result.passages.map((p) => {
            const pct = p.total ? Math.round((p.correctCount / p.total) * 100) : 0;
            const c = perfColor(pct);
            const title = titleByOrder.get(p.order) ?? p.title;
            return (
              <div key={p.order} style={{ border: "1px solid #EFEEF5", borderRadius: 16, padding: "18px 20px", background: "#fff" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#A6A2B8" }}>Passage {p.order}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "6px 0 12px" }}><span style={{ fontSize: 28, fontWeight: 700 }}>{p.correctCount}</span><span style={{ fontSize: 16, color: "#A6A2B8", fontWeight: 600 }}>/{p.total}</span></div>
                <div style={{ height: 7, borderRadius: 999, background: "#EEEDF6", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 999 }} /></div>
                {title ? <div style={{ fontSize: 12.5, color: "#8C88A0", marginTop: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div> : null}
              </div>
            );
          })}
        </div>

        {/* By question type */}
        <div style={{ marginBottom: 36 }}>
          <WeakTypes breakdown={result.typeBreakdown} />
        </div>

        {/* Filter toolbar */}
        <div style={{ position: "sticky", top: 62, zIndex: 10, background: "rgba(251,251,253,.92)", backdropFilter: "blur(8px)", padding: "12px 0", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            {filterDefs.map((f) => {
              const on = filter === f.key;
              return (
                <button key={f.key} type="button" onClick={() => setFilter(f.key)} style={{ padding: "8px 16px", borderRadius: 999, fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${on ? INDIGO : "#EAE8F2"}`, background: on ? INDIGO : "#fff", color: on ? "#fff" : "#46435C" }}>
                  {f.label} <span style={{ opacity: 0.6, fontWeight: 600 }}>{counts[f.key]}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13.5, color: "#8C88A0", fontWeight: 500 }}>{showingLabel[filter]}</div>
        </div>

        {/* Grouped review */}
        {result.passages.map((p) => {
          const items = visible.filter((it) => (it.passage_order ?? 1) === p.order);
          if (items.length === 0) return null;
          const body = bodyByOrder.get(p.order) ?? "";
          const title = titleByOrder.get(p.order) ?? p.title;
          return (
            <section key={p.order} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h2 style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: INK, margin: "24px 0 0" }}>Passage {p.order}{title ? ` — ${title}` : ""}</h2>
              {items.map((it) => (
                <ReviewItem key={it.id} item={it} passageBody={body} flagged={isFlagged(it)} />
              ))}
            </section>
          );
        })}

        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#9B98AD", fontSize: 15 }}>No questions match this filter.</div>
        ) : null}

        {disclaimer ? <p style={{ fontSize: 12, color: "#9B98AD", margin: "28px 0 0" }}>{disclaimer}</p> : null}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120, border: "1px solid #EFEEF5", borderRadius: 13, padding: "13px 16px", background: "#fff" }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#A6A2B8" }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, marginTop: 3, color: color ?? INK, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

// ---- Helpers ---------------------------------------------------------------

function messageFor(status: number, error?: string): string {
  if (status === 404) return "This test isn't available anymore.";
  if (status === 422) return error === "no_questions" ? "This test has no questions yet." : "Nothing to mark.";
  if (status === 401) return "Your session expired — please sign in again.";
  if (status === 403) return "Only students can practice reading.";
  return "Couldn't mark your answers. Please try again.";
}
