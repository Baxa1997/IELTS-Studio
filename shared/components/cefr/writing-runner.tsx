"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { FreeTrialCard, FreeTrialStrip } from "@/shared/components/practice/free-trial-nudge";
import { Timer } from "@/shared/components/exam/timer";
import {
  BRAND_SOFT as W_SOFT,
  FIELD_LINE,
  ON_INK,
  PANEL,
  SCREEN_VH,
  SLATE_RED,
  SLATE_STRONG,
  WARM_GREEN as GOOD,
  WHITE,
  withAlpha,
} from "@/lib/theme/tokens";

import { callEngine, postPublic } from "./api";
import { JAKARTA, PLEX } from "./design";
import type { CefrPublicMode, WritingGrade, WritingPaper, WritingTask } from "./types";
import { useFullscreen } from "./use-fullscreen";
import { WritingCoach } from "./writing-coach";
import {
  WRITING_KIND,
  W_ACCENT,
  W_BODY,
  W_CANVAS,
  W_FAINT,
  W_FILL,
  W_INK,
  W_LINE,
  W_MUTED,
  W_SOFTLINE,
  secondsForWritingTask,
  tutorTypeForTask,
  wGhostBtn,
  wPrimaryBtn,
} from "./writing-design";
import { WritingPromptPanel } from "./writing-prompt-panel";
import { CefrGradingOverlay, WritingResult } from "./writing-result";

// ---- Writing (full studio: prompt · answer · coach — mirrors the IELTS writing design) ----

// The CEFR writing studio is the IELTS writing studio's twin (same three-column
// layout + coach), tinted with the CEFR violet so it sits beside the "Reading B"
// runner as one product. It talks to the engine (callEngine) instead of the
// IELTS essays API, and handles a multi-task paper with an in-header switcher.
export function WritingRunner({
  paper,
  regenBusy,
  onNew,
  onExit,
  publicMode,
}: {
  paper: WritingPaper;
  regenBusy: boolean;
  onNew: () => void;
  onExit: () => void;
  publicMode?: CefrPublicMode;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, WritingGrade>>({});
  const task = paper.tasks[activeIdx];
  const gradedIds = useMemo(
    () => new Set(Object.keys(grades).filter((k) => grades[k]?.gradable)),
    [grades],
  );

  // One studio for the active task, remounted on switch (key) so the coach/timer
  // reset cleanly; answers + grades are lifted here so switching never loses work.
  return (
    <TaskStudio
      key={task.task}
      itemId={paper.id}
      tasks={paper.tasks}
      activeIdx={activeIdx}
      gradedIds={gradedIds}
      onSwitch={setActiveIdx}
      answer={answers[task.task] ?? ""}
      onAnswer={(v) => setAnswers((a) => ({ ...a, [task.task]: v }))}
      grade={grades[task.task] ?? null}
      onGraded={(g) => setGrades((m) => ({ ...m, [task.task]: g }))}
      regenBusy={regenBusy}
      onNew={onNew}
      onExit={onExit}
      publicMode={publicMode}
    />
  );
}

function TaskStudio({
  itemId,
  tasks,
  activeIdx,
  gradedIds,
  onSwitch,
  answer,
  onAnswer,
  grade,
  onGraded,
  regenBusy,
  onNew,
  onExit,
  publicMode,
}: {
  itemId: string;
  tasks: WritingTask[];
  activeIdx: number;
  gradedIds: Set<string>;
  onSwitch: (i: number) => void;
  answer: string;
  onAnswer: (v: string) => void;
  grade: WritingGrade | null;
  onGraded: (g: WritingGrade) => void;
  regenBusy: boolean;
  onNew: () => void;
  onExit: () => void;
  publicMode?: CefrPublicMode;
}) {
  const task = tasks[activeIdx];
  const [view, setView] = useState<"write" | "result">(grade?.gradable ? "result" : "write");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // No coach for a visitor: it is a signed-in feature behind a signed-in API.
  const [coachOpen, setCoachOpen] = useState(!publicMode);
  const draftRef = useRef(answer);
  useEffect(() => {
    draftRef.current = answer;
  });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fs = useFullscreen(rootRef);

  const range = task.word_range;
  const minWords = range[0];
  const words = answer.trim() ? answer.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = answer.length;
  const paragraphs = answer.trim()
    ? answer
        .trim()
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean).length
    : 0;
  const wordPct = Math.min(100, minWords ? Math.round((words / minWords) * 100) : 0);
  const RING_C = 2 * Math.PI * 19;
  const ringOffset = RING_C * (1 - Math.min(1, minWords ? words / minWords : 0));
  const lengthMet = words >= minWords;
  const wordsToTarget = Math.max(0, minWords - words);
  const kind = WRITING_KIND[task.task] ?? task.register;
  const seconds = secondsForWritingTask(task.task);

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const g = publicMode
        ? await postPublic<WritingGrade>(publicMode, { taskId: task.task, answer: draftRef.current })
        : await callEngine<WritingGrade>("writing/grade", {
            item_id: itemId,
            task_id: task.task,
            answer: draftRef.current,
          });
      onGraded(g);
      if (g.gradable) setView("result");
      else
        setMessage(
          g.message ??
            "That answer couldn’t be graded — make sure it addresses the task, then try again.",
        );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Grading failed.");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, itemId, task.task, onGraded, publicMode]);

  // Stable onExpire so the timer interval is set once (mirrors the reading runner).
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  const onExpire = useCallback(() => {
    if (!grade?.gradable) void submitRef.current();
  }, [grade]);

  const showResult = view === "result" && !!grade?.gradable;

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        height: SCREEN_VH,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: W_CANVAS,
        fontFamily: JAKARTA,
        color: W_BODY,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&display=swap"
      />
      {submitting ? <CefrGradingOverlay /> : null}
      {publicMode ? <FreeTrialStrip copy={publicMode.copy} /> : null}

      {/* header */}
      <header
        style={{
          flexShrink: 0,
          height: 62,
          background: PANEL,
          borderBottom: `1px solid ${W_LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(14px,2.5vw,22px)",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 13px 0 10px",
              border: `1px solid ${W_LINE}`,
              background: PANEL,
              borderRadius: 9,
              fontFamily: JAKARTA,
              fontSize: 14,
              fontWeight: 600,
              color: W_MUTED,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={15} /> CEFR
          </button>
          <div style={{ width: 1, height: 24, background: W_LINE, flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                padding: "0 9px",
                borderRadius: 6,
                background: W_INK,
                // ON_INK, not WHITE: W_INK is an ink and inverts to near-white in dark.
                color: ON_INK,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: ".05em",
                flexShrink: 0,
              }}
            >
              TASK {task.task}
            </span>
            <span
              style={{
                fontFamily: JAKARTA,
                fontSize: 14,
                fontWeight: 500,
                color: W_MUTED,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {kind}
            </span>
            <span style={{ color: FIELD_LINE }}>·</span>
            <span
              style={{
                fontFamily: JAKARTA,
                fontSize: 13,
                fontWeight: 700,
                color: W_ACCENT,
                flexShrink: 0,
              }}
            >
              {task.cefr}
            </span>
          </div>
          {tasks.length > 1 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                paddingLeft: 12,
                borderLeft: `1px solid ${W_LINE}`,
                flexShrink: 0,
              }}
            >
              {tasks.map((t, i) => {
                const on = i === activeIdx;
                const done = gradedIds.has(t.task);
                return (
                  <button
                    key={t.task}
                    type="button"
                    onClick={() => onSwitch(i)}
                    title={`Task ${t.task}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: `1px solid ${on ? W_FILL : W_LINE}`,
                      background: on ? W_FILL : PANEL,
                      color: on ? WHITE : W_MUTED,
                      fontFamily: JAKARTA,
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                    }}
                  >
                    {done ? <Check size={12} /> : null}
                    {t.task}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button
            type="button"
            onClick={fs.toggle}
            aria-label={fs.isFull ? "Exit full screen" : "Full screen"}
            title={fs.isFull ? "Exit full screen" : "Full screen"}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: `1px solid ${W_LINE}`,
              background: PANEL,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: W_MUTED,
              flexShrink: 0,
            }}
          >
            {fs.isFull ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          {!showResult ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 36,
                padding: "0 12px",
                border: `1px solid ${W_LINE}`,
                borderRadius: 9,
                background: W_SOFT,
              }}
            >
              <Timer seconds={seconds} onExpire={onExpire}>
                {(text, left) => {
                  const urgent = left <= 300;
                  return (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontFamily: JAKARTA,
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: urgent ? "var(--ex-err)" : SLATE_STRONG,
                      }}
                    >
                      <Clock size={14} style={{ color: urgent ? "var(--ex-err)" : W_FAINT }} />
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{text}</span> left
                    </span>
                  );
                }}
              </Timer>
            </div>
          ) : null}
          <div style={{ width: 1, height: 24, background: W_LINE }} />
          {showResult && publicMode ? (
            /* A free grade is a model call: one per task, no re-grade. The
               paper's other tasks stay open from the switcher. */
            <Link href={publicMode.exitHref} style={{ ...wPrimaryBtn(false), textDecoration: "none" }}>
              All free practice
            </Link>
          ) : showResult ? (
            <>
              <button type="button" onClick={() => setView("write")} style={wGhostBtn}>
                Revise answer
              </button>
              <button
                type="button"
                onClick={onNew}
                disabled={regenBusy}
                style={wPrimaryBtn(regenBusy)}
              >
                {regenBusy ? "Generating…" : "New paper"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting || words < 5}
              style={wPrimaryBtn(submitting || words < 5)}
            >
              {submitting ? "Grading…" : grade ? "Re-grade" : "Grade task"}
              <ArrowRight size={16} strokeWidth={2.3} />
            </button>
          )}
        </div>
      </header>

      {/* body: prompt | answer/result | coach */}
      <div
        className="ml-wr-body"
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          display: "flex",
          gap: 14,
          padding: 14,
          overflow: "hidden",
        }}
      >
        <WritingPromptPanel
          task={task}
          words={words}
          wordPct={wordPct}
          lengthMet={lengthMet}
          graded={showResult}
        />

        {showResult && grade ? (
          <main
            className="ml-wr-answer"
            style={{
              flex: 1,
              minWidth: 0,
              background: PANEL,
              border: `1px solid ${W_LINE}`,
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 58,
                flexShrink: 0,
                padding: "0 22px",
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${W_SOFTLINE}`,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: JAKARTA,
                  fontSize: 16,
                  fontWeight: 700,
                  color: W_INK,
                }}
              >
                Your result
              </h2>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "clamp(20px,2.6vw,30px)",
              }}
            >
              {publicMode ? <FreeTrialCard copy={publicMode.copy} /> : null}
              <WritingResult g={grade} />
            </div>
          </main>
        ) : (
          <main
            className="ml-wr-answer"
            style={{
              flex: 1,
              minWidth: 0,
              background: PANEL,
              border: `1px solid ${W_LINE}`,
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 58,
                flexShrink: 0,
                padding: "0 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${W_SOFTLINE}`,
                gap: 12,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: JAKARTA,
                  fontSize: 16,
                  fontWeight: 700,
                  color: W_INK,
                }}
              >
                Your answer
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  style={{ fontFamily: JAKARTA, fontSize: 13, color: W_FAINT, fontWeight: 500 }}
                >
                  {lengthMet ? "Target reached" : `${wordsToTarget} words to target`}
                </span>
                <div style={{ position: "relative", width: 44, height: 44 }}>
                  <svg width="44" height="44" viewBox="0 0 46 46">
                    <circle
                      style={{ stroke: W_SOFT }}
                      cx="23"
                      cy="23"
                      r="19"
                      fill="none"
                      strokeWidth="4.5"
                    />
                    <circle
                      cx="23"
                      cy="23"
                      r="19"
                      fill="none"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray={RING_C}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 23 23)"
                      // The arc's colour is in `style` (W_ACCENT is a var()); 8cffac2 dropped
                      // the `stroke=` attribute without moving it and the ring went empty.
                      style={{ transition: "stroke-dashoffset .35s ease", stroke: W_ACCENT }}
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: JAKARTA,
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: W_INK,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {words}
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                padding: "24px clamp(20px,3vw,40px)",
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <textarea
                autoFocus
                value={answer}
                onChange={(e) => onAnswer(e.target.value)}
                disabled={submitting}
                placeholder="Start writing your response here…"
                style={{
                  flex: 1,
                  width: "100%",
                  maxWidth: 720,
                  minHeight: 240,
                  resize: "none",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: PLEX,
                  fontSize: 16.5,
                  lineHeight: 1.85,
                  color: SLATE_STRONG,
                }}
              />
            </div>
            <div
              style={{
                flexShrink: 0,
                minHeight: 46,
                padding: "0 22px",
                borderTop: `1px solid ${W_SOFTLINE}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: W_CANVAS,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: JAKARTA }}>
                <span style={{ fontSize: 13, color: W_MUTED, fontVariantNumeric: "tabular-nums" }}>
                  <strong style={{ color: W_INK, fontWeight: 700 }}>{words}</strong> words
                </span>
                <span style={{ fontSize: 13, color: W_MUTED, fontVariantNumeric: "tabular-nums" }}>
                  {chars.toLocaleString("en-GB")} characters
                </span>
                <span style={{ fontSize: 13, color: W_MUTED }}>
                  {paragraphs} paragraph{paragraphs === 1 ? "" : "s"}
                </span>
              </div>
              <span
                style={{
                  fontFamily: JAKARTA,
                  fontSize: 13,
                  fontWeight: 600,
                  color: lengthMet ? GOOD : W_FAINT,
                }}
              >
                Target {range[0]}–{range[1]} words
              </span>
            </div>
          </main>
        )}

        {coachOpen ? (
          <aside
            className="ml-wr-coach"
            style={{
              width: 320,
              flexShrink: 0,
              background: PANEL,
              border: `1px solid ${W_LINE}`,
              borderRadius: 14,
              display: "flex",
              overflow: "hidden",
            }}
          >
            <WritingCoach
              promptText={`${task.prompt}\n\nCover: ${task.required_content_points.join("; ")}`}
              tutorType={tutorTypeForTask(task.task)}
              phase={showResult ? "results" : "writing"}
              draftRef={draftRef}
              onClose={() => setCoachOpen(false)}
            />
          </aside>
        ) : publicMode ? null : (
          <button
            type="button"
            onClick={() => setCoachOpen(true)}
            aria-label="Open writing coach"
            style={{
              position: "absolute",
              right: 26,
              bottom: 26,
              zIndex: 7,
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "12px 18px 12px 13px",
              borderRadius: 999,
              border: "none",
              background: W_FILL,
              color: WHITE,
              cursor: "pointer",
              fontFamily: JAKARTA,
              fontWeight: 700,
              fontSize: 14.5,
              boxShadow: `0 14px 30px -12px ${withAlpha(W_FILL, 60)}`,
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: "rgba(255,255,255,.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={15} />
            </span>
            Ask coach
          </button>
        )}
      </div>

      {/* footer status */}
      <footer
        style={{
          flexShrink: 0,
          minHeight: 44,
          background: PANEL,
          borderTop: `1px solid ${W_LINE}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 18px",
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: message ? "var(--ex-warn-soft)" : "var(--ex-ok-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {message ? (
            <X size={12} style={{ color: SLATE_RED }} />
          ) : (
            <Check size={12} style={{ color: GOOD }} />
          )}
        </span>
        <span style={{ fontFamily: JAKARTA, fontSize: 13, color: W_MUTED }}>
          {message ? (
            <span style={{ color: SLATE_RED }}>{message}</span>
          ) : showResult ? (
            "Marked. Revise your answer and re-grade, or ask the coach to explain the feedback."
          ) : (
            <>
              <strong style={{ color: W_INK, fontWeight: 700 }}>Ready to grade.</strong> The AI
              marks your task on a calibrated CEFR rubric — task, coherence, vocabulary, grammar,
              register.
            </>
          )}
        </span>
      </footer>
    </div>
  );
}
