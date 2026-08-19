"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { gradeClosed, type Answers } from "@/lib/lessons/grade";
import {
  EMBER,
  FAINT,
  GHOST,
  GOOD_BG,
  GOOD_INK,
  HAIRLINE,
  INK,
  LIFT_SHEET,
  MUTED,
  NOTE_BG,
  NOTE_INK,
  PAPER,
  READING,
  RULE,
  SANS,

  SOFT,
  STAGE_META,
  TROUGH,
  TROUGH_DEEP,
  WARN_BG,
  WARN_INK,
  WASH,
} from "@/lib/lessons/theme";
import {
  isOpen,
  isOpenResult,
  type ClosedExercise,
  type ClosedResult,
  type Exercise,
  type ExerciseResult,
  type LessonContent,
  type OpenExercise,
  type OpenResult,
} from "@/lib/lessons/types";

/**
 * Doing a lesson: read it, answer it, hand it in, see what you got wrong.
 *
 * ONE ITEM AT A TIME, with a navigator — not a scroll of every question. The
 * whole worksheet on one page is the teacher's view (see `PracticeReview`),
 * because their question is "is this any good?". A learner's question is "can
 * you do this?", and twelve visible questions answer it badly: the eye reads
 * ahead, the hard one gets skipped in favour of the easy one below it, and
 * nothing is ever finished. The navigator is what makes that safe — it is the
 * only way to reach item 9 from item 3, so it is never dropped, only moved
 * above the item on a narrow window.
 *
 * TEST MODE stays the default. Nothing is marked until they hand in, and the
 * key only appears afterwards — a page that tells you the answer as you type is
 * a worksheet, not practice. `instantFeedback` opens the other door for the
 * surfaces where no score is being recorded, and defaults to exactly that case.
 *
 * The browser marks the closed half with the SAME function the server uses, so
 * the score appears instantly instead of after a round trip. The server marks
 * it again on submit and stores that — a client that posts its own score is a
 * client that can post 10/10.
 */

export interface RunnerResult {
  attemptId: string;
  score: number;
  maxScore: number;
  results: Record<string, ExerciseResult>;
  gradingStatus: string;
  notice?: string;
}

const KIND_LABEL: Record<string, string> = {
  mcq_single: "Choose one",
  mcq_multi: "Choose all that apply",
  gap_fill: "Fill the gap",
  transform: "Rewrite it",
  error_correction: "Correct the mistake",
  matching: "Match them up",
  ordering: "Put them in order",
  short_answer: "Write it",
  write_sentence: "Write it",
  write_short_text: "Write it",
};

export function LessonRunner({
  lessonId,
  content,
  /** Off for the public page: nothing is stored and nothing is model-marked. */
  canSubmit = true,
  /**
   * Check each answer as you go, rather than only on hand-in.
   *
   * Defaults to "wherever nothing is being scored". Turning it on for assigned
   * homework would make the recorded score meaningless — a learner can retry
   * every item until it goes green — so that is a product decision, not a
   * default.
   */
  instantFeedback,
  /** The teaching half, server-rendered — the runner's first tab. */
  explanation,
  title,
}: {
  lessonId: string;
  content: LessonContent;
  canSubmit?: boolean;
  instantFeedback?: boolean;
  explanation?: React.ReactNode;
  title: string;
}) {
  const items = content.exercises;
  const total = items.length;
  const checkable = instantFeedback ?? !canSubmit;

  const [tab, setTab] = useState<"explain" | "practice">(explanation ? "explain" : "practice");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set in an effect, not during render: reading the clock while rendering is
  // an impure call, and a re-render would move the start time anyway.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // The clock runs on the practice, not on the reading. A learner who spends
  // ten minutes on the explanation has not spent ten minutes on the test.
  useEffect(() => {
    if (tab !== "practice" || result) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [tab, result]);

  const done = result != null;
  const current = items[Math.min(idx, Math.max(0, total - 1))];

  const answered = useCallback(
    (e: Exercise) => {
      const v = answers[e.id];
      return Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "";
    },
    [answers],
  );
  const answeredCount = useMemo(() => items.filter(answered).length, [items, answered]);

  const go = useCallback(
    (i: number) => setIdx(Math.max(0, Math.min(total - 1, i))),
    [total],
  );
  const set = (id: string, value: string | string[]) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  const check = useCallback(() => {
    if (!current || !checkable || !answered(current)) return;
    setChecked((c) => ({ ...c, [current.id]: true }));
  }, [current, checkable, answered]);

  const submit = useCallback(async () => {
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
      setIdx(0);
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
      setIdx(0);
    } catch {
      setError("Couldn't reach the server. Your answers are still here — try again.");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, done, content, answers, canSubmit, lessonId]);

  // Arrows move between items. Deliberately inert while the caret is in a field
  // — ← and → belong to the text being typed there, and stealing them makes the
  // longer written answers unusable.
  useEffect(() => {
    if (tab !== "practice") return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;
      if (typing) return;
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
      if (e.key === "Enter" && checkable && !done) {
        e.preventDefault();
        check();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, idx, go, check, checkable, done]);

  const stageOf = (e: Exercise) => STAGE_META.find((s) => s.key === e.stage) ?? STAGE_META[0];
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div
      style={{
        // A DOCUMENT, not an app frame. It used to be a 100dvh flex column
        // with two independently scrolling panes, which meant the page never
        // scrolled — the browser's own scrollbar, momentum and find-in-page all
        // stopped working, and on a phone the address bar never retracted.
        //
        // 100% rather than 100dvh: this now sits inside the app shell, whose
        // surface is the scroll container. Against the viewport it would stand
        // taller than the box holding it and scroll a few pixels for no reason.
        minHeight: "100%",
        background: WASH,
        fontFamily: SANS,
        color: INK,
      }}
      className="pa-rise"
    >
      {/* ── the bar ──────────────────────────────────────────────────────── */}
      <div
        className="pa-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "12px 22px",
          background: "rgba(253,251,247,0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: `1px solid ${HAIRLINE}`,
          flexWrap: "wrap",
        }}
      >
        <a
          href="/assignments"
          aria-label="Leave this lesson"
          className="pa-lift"
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: "#fff",
            display: "grid",
            placeItems: "center",
            color: MUTED,
            textDecoration: "none",
            boxShadow: "0 1px 2px rgba(20,35,46,.08)",
            flex: "none",
          }}
        >
          ✕
        </a>

        <span
          className="pa-bar-hide"
          style={{
            fontSize: 15,
            fontWeight: 600,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>

        {explanation ? (
          <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 999, background: TROUGH_DEEP, flex: "none" }}>
            <button type="button" onClick={() => setTab("explain")} style={tabStyle(tab === "explain")}>
              Explanation
            </button>
            <button type="button" onClick={() => setTab("practice")} style={tabStyle(tab === "practice")}>
              Practice
            </button>
          </div>
        ) : null}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {tab === "practice" && current ? (
            <span
              className="pa-bar-hide"
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: NOTE_BG,
                color: NOTE_INK,
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {stageOf(current).label}
            </span>
          ) : null}

          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums" }}>
            {tab === "practice"
              ? `${String(idx + 1).padStart(2, "0")} / ${total}`
              : `${total} item${total === 1 ? "" : "s"}`}
          </span>

          <div
            className="pa-bar-hide"
            style={{ width: 200, height: 8, borderRadius: 999, background: RULE, overflow: "hidden" }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                width: total > 0 ? `${((tab === "practice" ? idx + 1 : 0) / total) * 100}%` : "0%",
                background: EMBER,
                transition: "width .35s cubic-bezier(.2,.7,.3,1)",
              }}
            />
          </div>

          {tab === "practice" ? (
            <span
              className="pa-bar-hide"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                color: READING,
                fontVariantNumeric: "tabular-nums",
                boxShadow: "0 1px 2px rgba(20,35,46,.06)",
              }}
            >
              {clock}
            </span>
          ) : null}

          {tab === "practice" && current && !done ? (
            <button
              type="button"
              onClick={() => setFlags((f) => ({ ...f, [current.id]: !f[current.id] }))}
              aria-pressed={Boolean(flags[current.id])}
              className="pa-lift"
              style={{
                padding: "9px 16px",
                borderRadius: 999,
                border: 0,
                background: flags[current.id] ? WARN_BG : "#fff",
                color: flags[current.id] ? WARN_INK : MUTED,
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(20,35,46,.06)",
              }}
            >
              Flag
            </button>
          ) : null}
        </div>
      </div>

      {/* ── the explanation ──────────────────────────────────────────────── */}
      {tab === "explain" && explanation ? (
        <div>
          {/* FULL WIDTH, like the practice beside it. A centred 880px column
              left two grey gutters on a laptop and squeezed the form tables —
              which are the densest, most-read thing on a grammar page — into
              half the room they need. */}
          <div className="pa-pop pa-runner-main">
            <div
              style={{
                borderRadius: 28,
                background: "#fff",
                padding: "32px 34px",
                boxShadow: LIFT_SHEET,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 16px",
                  borderRadius: 999,
                  background: GOOD_BG,
                  color: GOOD_INK,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Read this first
              </div>

              <div style={{ marginTop: 18 }}>{explanation}</div>

              <button
                type="button"
                onClick={() => setTab("practice")}
                className="pa-ember"
                style={{
                  width: "100%",
                  marginTop: 32,
                  padding: 18,
                  borderRadius: 999,
                  border: 0,
                  background: EMBER,
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 14px 30px -12px rgba(236,106,69,.9)",
                }}
              >
                Start the practice → {total} item{total === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── the practice ─────────────────────────────────────────────────── */}
      {tab === "practice" ? (
        <div className="pa-runner">
          <div style={{ minWidth: 0 }}>
            <div className="pa-runner-main">
              {done ? (
                <ScoreCard
                  result={result}
                  canSubmit={canSubmit}
                  questionCount={items.length}
                />
              ) : null}

              {current ? (
                <Item
                  key={current.id}
                  exercise={current}
                  n={idx + 1}
                  value={answers[current.id]}
                  onChange={(v) => set(current.id, v)}
                  checked={Boolean(checked[current.id])}
                  checkable={checkable && !done}
                  onCheck={check}
                  result={result?.results[current.id]}
                  locked={done}
                  atStart={idx === 0}
                  atEnd={idx === total - 1}
                  onPrev={() => go(idx - 1)}
                  onNext={() => go(idx + 1)}
                />
              ) : (
                <p style={{ color: SOFT }}>This lesson has no exercises.</p>
              )}
            </div>
          </div>

          {/* ── the navigator ────────────────────────────────────────────── */}
          <div className="pa-runner-rail">
            <div style={{ padding: "24px 22px 18px" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: FAINT,
                }}
              >
                Navigator
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginTop: 6 }}>
                {done ? `${result.score} of ${result.maxScore}` : `${answeredCount} of ${total} answered`}
              </div>
            </div>

            <div
              style={{
                padding: "0 22px",
                display: "grid",
                gap: 22,
                alignContent: "start",
              }}
            >
              {STAGE_META.map((stage) => {
                const group = items.filter((e) => e.stage === stage.key);
                if (group.length === 0) return null;
                return (
                  <div key={stage.key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        fontWeight: 600,
                        color: SOFT,
                        marginBottom: 10,
                      }}
                    >
                      <span>{stage.label}</span>
                      <span>
                        {group.filter(answered).length}/{group.length}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                      {group.map((e) => {
                        const at = items.indexOf(e);
                        const r = result?.results[e.id];
                        const kind =
                          at === idx
                            ? "current"
                            : r && !isOpenResult(r)
                              ? r.correct
                                ? "done"
                                : "wrong"
                              : flags[e.id]
                                ? "flag"
                                : answered(e)
                                  ? "done"
                                  : "todo";
                        return (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => go(at)}
                            aria-current={at === idx ? "true" : undefined}
                            aria-label={`Item ${at + 1}`}
                            className="pa-tap"
                            style={cellStyle(kind)}
                          >
                            {at + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div style={{ display: "grid", gap: 9, fontSize: 13, color: SOFT, paddingTop: 4 }}>
                {[
                  { label: done ? "Right" : "Answered", swatch: GOOD_BG, ring: null },
                  { label: "Current", swatch: EMBER, ring: null },
                  { label: "Flagged", swatch: "#fff", ring: "#f6c3b1" },
                ].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      aria-hidden
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 6,
                        background: l.swatch,
                        boxShadow: l.ring ? `inset 0 0 0 2px ${l.ring}` : "none",
                      }}
                    />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "20px 22px 24px" }}>
              {done ? (
                <a
                  href="/assignments"
                  className="pa-dark"
                  style={{ ...railButton, display: "block", textAlign: "center", textDecoration: "none" }}
                >
                  Back to assignments
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting}
                  className="pa-dark"
                  style={{ ...railButton, cursor: submitting ? "default" : "pointer" }}
                >
                  {submitting ? "Checking…" : "Finish & submit"}
                </button>
              )}
              <div style={{ fontSize: 13, color: FAINT, marginTop: 10, lineHeight: 1.5 }}>
                {error ? (
                  <span style={{ color: WARN_INK }} role="alert">
                    {error}
                  </span>
                ) : done ? (
                  canSubmit
                    ? "Handed in. Every item now shows what was right and why."
                    : "Nothing was saved, because you're not signed in."
                ) : answeredCount === total ? (
                  `All ${total} answered — ready to submit.`
                ) : (
                  `${total - answeredCount} item${total - answeredCount === 1 ? "" : "s"} still empty. You can hand in anyway.`
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── one item ──────────────────────────────────────────────────────────────── */

function Item({
  exercise,
  n,
  value,
  onChange,
  checked,
  checkable,
  onCheck,
  result,
  locked,
  atStart,
  atEnd,
  onPrev,
  onNext,
}: {
  exercise: Exercise;
  n: number;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  checked: boolean;
  checkable: boolean;
  onCheck: () => void;
  result: ExerciseResult | undefined;
  locked: boolean;
  atStart: boolean;
  atEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Narrow the union ONCE, here. Reaching for `exercise.criteria` further down
  // without this is what the compiler rightly refuses — half the fields only
  // exist on one arm.
  const openEx = isOpen(exercise) ? exercise : null;
  const closedEx = isOpen(exercise) ? null : exercise;
  const closedResult = result && !isOpenResult(result) ? result : null;
  const openResult = result && isOpenResult(result) ? result : null;

  // A gap-fill whose prompt carries the blank is shown AS the sentence rather
  // than as an instruction with a box underneath — the blank is the question,
  // and splitting them makes a learner read the same words twice.
  const gap = closedEx && !closedEx.options && exercise.prompt.includes("___");
  const [before, ...rest] = gap ? exercise.prompt.split("___") : [];
  const after = rest.join("___");

  const typed = String(value ?? "");
  const words = typed.trim() ? typed.trim().split(/\s+/).length : 0;

  return (
    <div
      className="pa-pop pa-item"
      style={{ borderRadius: 26, background: "#fff", boxShadow: LIFT_SHEET }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          aria-hidden
          style={{
            flex: "none",
            width: 38,
            height: 38,
            borderRadius: 999,
            background: INK,
            color: PAPER,
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(n).padStart(2, "0")}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: READING }}>
            {KIND_LABEL[exercise.type] ?? "Answer"}
          </div>
          <div style={{ fontSize: 13, color: FAINT }}>{exercise.tag.replaceAll("-", " ")}</div>
        </div>
      </div>

      {gap ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
            fontSize: 19,
            lineHeight: 1.6,
            padding: "20px 22px",
            borderRadius: 20,
            background: WASH,
            margin: "26px 0 0",
          }}
        >
          <span>{before}</span>
          <input
            value={typed}
            onChange={(e) => onChange(e.target.value)}
            disabled={locked}
            placeholder="type here"
            aria-label="Your answer"
            className="pa-field"
            style={{
              border: 0,
              borderRadius: 999,
              background: "#fff",
              outline: "none",
              fontFamily: "inherit",
              fontSize: 18,
              width: 210,
              maxWidth: "100%",
              padding: "8px 18px",
              color: INK,
              boxShadow: "inset 0 0 0 2px #dbd6cb",
            }}
          />
          <span>{after}</span>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.45,
              letterSpacing: "-.015em",
              margin: "22px 0 22px",
              textWrap: "pretty",
            }}
          >
            {exercise.prompt}
          </div>

          {closedEx && isSequence(closedEx) && closedEx.options ? (
            <SequenceAnswer
              exercise={closedEx}
              value={value}
              onChange={onChange}
              locked={locked}
              matching={closedEx.type === "matching"}
            />
          ) : closedEx?.options ? (
            <div style={{ display: "grid", gap: 12 }}>
              {closedEx.options.map((opt, i) => {
                const multi = closedEx.type === "mcq_multi";
                const chosen = multi
                  ? Array.isArray(value) && value.includes(String(i))
                  : value === String(i);
                const isKey = locked && closedEx.answers.includes(String(i));
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      if (locked) return;
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
                    className="pa-tap"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      textAlign: "left",
                      padding: "15px 18px",
                      borderRadius: 18,
                      border: 0,
                      fontFamily: "inherit",
                      fontSize: 17,
                      cursor: locked ? "default" : "pointer",
                      background: isKey ? GOOD_BG : chosen ? INK : WASH,
                      color: isKey ? GOOD_INK : chosen ? PAPER : INK,
                      transform: chosen && !isKey ? "translateX(4px)" : "none",
                      transition: "all .2s cubic-bezier(.2,.7,.3,1)",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        flex: "none",
                        width: 29,
                        height: 29,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 13.5,
                        fontWeight: 700,
                        background: chosen && !isKey ? EMBER : "#fff",
                        color: chosen && !isKey ? "#fff" : SOFT,
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : openEx ? (
            <div style={{ borderRadius: 24, background: WASH, padding: "20px 22px" }}>
              <textarea
                value={typed}
                onChange={(e) => onChange(e.target.value)}
                disabled={locked}
                placeholder="Write your answer — an examiner-style comment comes back on submit."
                style={{
                  width: "100%",
                  minHeight: 132,
                  border: 0,
                  background: "transparent",
                  outline: "none",
                  resize: "none",
                  fontFamily: "inherit",
                  fontSize: 16.5,
                  lineHeight: 1.65,
                  color: INK,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 12,
                  fontSize: 13,
                  color: SOFT,
                }}
              >
                <span
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    background: NOTE_BG,
                    color: NOTE_INK,
                    fontWeight: 700,
                  }}
                >
                  AI-marked
                </span>
                <span>
                  {words} word{words === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ) : (
            <input
              value={typed}
              onChange={(e) => onChange(e.target.value)}
              disabled={locked}
              placeholder="Your answer…"
              className="pa-field"
              style={{
                width: "100%",
                border: 0,
                borderRadius: 18,
                background: WASH,
                padding: "16px 20px",
                fontFamily: "inherit",
                fontSize: 17,
                color: INK,
                outline: "none",
                boxShadow: "inset 0 0 0 2px transparent",
              }}
            />
          )}
        </>
      )}

      <Feedback
        exercise={exercise}
        openEx={openEx}
        closedEx={closedEx}
        closedResult={closedResult}
        openResult={openResult}
        checked={checked}
        locked={locked}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onPrev}
          disabled={atStart}
          className="pa-ghost"
          style={{
            padding: "14px 20px",
            borderRadius: 999,
            border: 0,
            background: TROUGH,
            color: MUTED,
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 500,
            cursor: atStart ? "default" : "pointer",
            opacity: atStart ? 0.45 : 1,
          }}
        >
          ← Back
        </button>

        {checkable && !checked ? (
          <button
            type="button"
            onClick={onCheck}
            className="pa-ember"
            style={{
              padding: "14px 30px",
              borderRadius: 999,
              border: 0,
              background: EMBER,
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 24px -12px rgba(236,106,69,.9)",
            }}
          >
            Check answer
          </button>
        ) : null}

        <button
          type="button"
          onClick={onNext}
          disabled={atEnd}
          className="pa-dark"
          style={{
            padding: "14px 24px",
            borderRadius: 999,
            border: 0,
            background: checked || locked ? INK : TROUGH,
            color: checked || locked ? PAPER : MUTED,
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 600,
            cursor: atEnd ? "default" : "pointer",
            opacity: atEnd ? 0.45 : 1,
          }}
        >
          Next →
        </button>

        <span className="pa-bar-hide" style={{ marginLeft: "auto", fontSize: 13, color: GHOST }}>
          ← → to move{checkable ? " · ⏎ check" : ""}
        </span>
      </div>
    </div>
  );
}

/**
 * What came back — after hand-in, or after checking this one item.
 *
 * Both routes land here so a learner never meets two different shapes of
 * feedback for the same mistake.
 */
function Feedback({
  exercise,
  openEx,
  closedEx,
  closedResult,
  openResult,
  checked,
  locked,
}: {
  exercise: Exercise;
  openEx: OpenExercise | null;
  closedEx: ClosedExercise | null;
  closedResult: ClosedResult | null;
  openResult: OpenResult | null;
  checked: boolean;
  locked: boolean;
}) {
  const show = checked || locked;
  if (!show) return null;

  const good = closedResult ? closedResult.correct : null;

  return (
    <div
      className="pa-slide"
      style={{
        marginTop: 22,
        padding: "20px 22px",
        borderRadius: 22,
        background: good === false ? WARN_BG : GOOD_BG,
        color: good === false ? "#8f3a1e" : "#155442",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 700 }}>
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: good === false ? EMBER : GOOD_INK,
          }}
        />
        <span>
          {closedResult
            ? closedResult.correct
              ? "Correct"
              : "Not quite"
            : openResult
              ? `${openResult.score} of ${openResult.max} checks passed`
              : openEx
                ? "Sent for marking"
                : "Checked"}
        </span>
      </div>

      {closedResult && !closedResult.correct ? (
        <div style={{ marginTop: 8, fontSize: 17, lineHeight: 1.55 }}>
          Model answer: {closedResult.expected}
        </div>
      ) : null}

      {/* Checked in place, before hand-in: the key comes from the exercise
          rather than from a server result that does not exist yet. */}
      {!closedResult && closedEx && checked && !locked ? (
        <div style={{ marginTop: 8, fontSize: 17, lineHeight: 1.55 }}>
          Model answer: {closedEx.answers.join("  /  ")}
        </div>
      ) : null}

      {openResult ? (
        <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none" }}>
          {openEx?.criteria.map((c: string, i: number) => {
            const verdict = openResult.criteria[i];
            return (
              <li key={c} style={{ display: "flex", gap: 8, fontSize: 16, marginBottom: 4 }}>
                <span style={{ flex: "none" }}>{verdict?.met ? "✓" : "✕"}</span>
                <span>
                  {c}
                  {verdict?.evidence ? <span style={{ opacity: 0.75 }}> — {verdict.evidence}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {openResult?.corrected ? (
        <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.55 }}>
          <strong style={{ fontWeight: 700 }}>Better:</strong> {openResult.corrected}
        </div>
      ) : null}
      {openResult?.note ? (
        <div style={{ marginTop: 5, fontSize: 15, opacity: 0.85 }}>{openResult.note}</div>
      ) : null}

      {/* Nothing model-marked here, so the checklist and a model answer are
          shown to check yourself against instead. */}
      {openEx && !openResult ? (
        <div style={{ marginTop: 10, fontSize: 16 }}>
          <div style={{ opacity: 0.8, marginBottom: 5 }}>Check yourself:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {openEx.criteria.map((c: string) => (
              <li key={c} style={{ marginBottom: 3 }}>
                {c}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8 }}>
            <strong style={{ fontWeight: 700 }}>One good answer:</strong> {openEx.model_answer}
          </div>
        </div>
      ) : null}

      {exercise.why ? (
        <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55, opacity: 0.85 }}>
          {exercise.why}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The score, said in a way that cannot be misread as a question count.
 *
 * IT NEVER WAS ONE. A closed item is worth one point; a written item is worth
 * one point PER CRITERION, because "used the target form" and "answered the
 * question asked" are separate things to get right. So an eleven-question
 * lesson with three written items scores out of seventeen — and "13 / 17" on
 * its own reads as thirteen questions out of seventeen, which is what a teacher
 * reported it as. The number was right and the page was lying about what it
 * counted.
 */
function ScoreCard({
  result,
  canSubmit,
  questionCount,
}: {
  result: RunnerResult;
  canSubmit: boolean;
  questionCount: number;
}) {
  const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
  return (
    <div
      className="pa-slide"
      style={{
        borderRadius: 28,
        background: INK,
        color: "#f3f1ec",
        padding: "24px 28px",
        marginBottom: 22,
        display: "flex",
        alignItems: "center",
        gap: 22,
        flexWrap: "wrap",
        boxShadow: "0 20px 44px -28px rgba(20,35,46,.7)",
      }}
    >
      <div>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1 }}>
          {result.score}
          <span style={{ fontSize: 22, opacity: 0.6, fontWeight: 500 }}> / {result.maxScore}</span>
        </div>
        <div style={{ fontSize: 14, color: "#a9b8c0", marginTop: 4 }}>
          {pct}% — {result.maxScore} point{result.maxScore === 1 ? "" : "s"} across{" "}
          {questionCount} question{questionCount === 1 ? "" : "s"}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 15, color: "#a9b8c0", flex: 1, minWidth: 220, lineHeight: 1.6 }}>
        {result.notice
          ? result.notice
          : canSubmit
            ? "Step through the items — each one now shows what was right and why."
            : "Answers are shown on each item. Nothing was saved, because you're not signed in."}
      </p>
    </div>
  );
}

/** Ordering and matching answer with a SEQUENCE, not a choice. */
function isSequence(exercise: { type: string }): boolean {
  return exercise.type === "ordering" || exercise.type === "matching";
}

/**
 * Putting things in order.
 *
 * These questions were unanswerable before this existed. `ordering` fell
 * through to the multiple-choice branch, which renders RADIO buttons — one
 * pick, when the answer is a whole permutation — so every ordering question a
 * student met was marked wrong no matter what they did.
 *
 * Click to place, click again to take back. Numbered rather than dragged
 * because drag-and-drop is the one interaction that fails on a phone, fails
 * with a keyboard, and needs a library; tapping in order does neither and is
 * what a paper worksheet asks for anyway ("number these 1–5").
 */
function SequenceAnswer({
  exercise,
  value,
  onChange,
  locked,
  matching = false,
}: {
  exercise: { id: string; options?: string[] | null };
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  locked: boolean;
  /** Matching pairs against a list in the prompt; ordering sorts into a
   *  sequence. Same interaction, and the instruction has to say which — "tap
   *  them in the right order" is meaningless when the order is someone else's
   *  list. */
  matching?: boolean;
}) {
  const options = exercise.options ?? [];
  const picked = Array.isArray(value) ? value : [];

  const place = (i: string) => {
    if (locked) return;
    onChange(picked.includes(i) ? picked.filter((p) => p !== i) : [...picked, i]);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 14, color: SOFT }}>
        {picked.length === 0
          ? matching
            ? "Tap them in the order they pair with the list above."
            : "Tap them in the right order."
          : picked.length < options.length
            ? `${picked.length} of ${options.length} placed — tap one again to take it back.`
            : "All placed. Tap one to change it."}
      </div>
      {options.map((opt, i) => {
        const at = picked.indexOf(String(i));
        const on = at >= 0;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => place(String(i))}
            disabled={locked}
            className="pa-tap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              textAlign: "left",
              padding: "16px 22px",
              borderRadius: 22,
              border: 0,
              background: on ? INK : WASH,
              color: on ? PAPER : INK,
              fontFamily: "inherit",
              fontSize: 18,
              cursor: locked ? "default" : "pointer",
              width: "100%",
            }}
          >
            <span
              aria-hidden
              style={{
                flex: "none",
                width: 30,
                height: 30,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                fontSize: 14,
                fontWeight: 700,
                background: on ? EMBER : "#fff",
                color: on ? "#fff" : SOFT,
              }}
            >
              {on ? at + 1 : ""}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── small styles ──────────────────────────────────────────────────────────── */

const tabStyle = (on: boolean): React.CSSProperties => ({
  padding: "9px 18px",
  borderRadius: 999,
  border: 0,
  background: on ? INK : "transparent",
  color: on ? PAPER : SOFT,
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

function cellStyle(kind: "current" | "done" | "wrong" | "flag" | "todo"): React.CSSProperties {
  const base: React.CSSProperties = {
    height: 40,
    borderRadius: 14,
    border: 0,
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontVariantNumeric: "tabular-nums",
  };
  if (kind === "current")
    return {
      ...base,
      background: EMBER,
      color: "#fff",
      boxShadow: "0 8px 18px -8px rgba(236,106,69,.9)",
      transform: "scale(1.04)",
    };
  if (kind === "done") return { ...base, background: GOOD_BG, color: GOOD_INK };
  if (kind === "wrong") return { ...base, background: WARN_BG, color: WARN_INK };
  if (kind === "flag")
    return { ...base, background: "#fff", color: WARN_INK, boxShadow: "inset 0 0 0 2px #f6c3b1" };
  return { ...base, background: "#fff", color: GHOST, boxShadow: "inset 0 0 0 1px #e4e0d6" };
}

const railButton: React.CSSProperties = {
  width: "100%",
  padding: 15,
  borderRadius: 999,
  border: 0,
  background: INK,
  color: PAPER,
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 700,
};
