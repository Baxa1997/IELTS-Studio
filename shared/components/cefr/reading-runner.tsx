"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Maximize2,
  MessageCircle,
  Minimize2,
  PanelRightClose,
} from "lucide-react";
import Link from "next/link";
import { FreeTrialCard, FreeTrialStrip } from "@/shared/components/practice/free-trial-nudge";
import { Timer } from "@/shared/components/exam/timer";
import { WordLookup } from "@/shared/components/reading/word-lookup";
import {
  BRAND as D_ACCENT,
  BRAND_FILL as D_ACCENT_FILL,
  BRAND_SOFT as D_ATINT2,
  BRAND_WASH as D_ATINT,
  LINE as D_LINE,
  PANEL,
  WHITE,
} from "@/lib/theme/tokens";

import { callEngine, postPublic } from "./api";
import { D_HEAD, D_INK, D_PAGE, D_SLATE, D_SLATE2, D_SLATE3, JAKARTA } from "./design";
import { MarkerToolbar, useHighlighter } from "./highlighter";
import { CefrCoach, coachContext, dsSubmitBtn, questionNumbers } from "./reading-coach";
import { PartPassage, PartQuestions } from "./reading-parts";
import type { CefrPublicMode, QResult, ReadingGrade, ReadingMode, ReadingPaper } from "./types";
import { Alert, ScoreBanner } from "./ui";
import { useFullscreen } from "./use-fullscreen";

// ---- Reading ---------------------------------------------------------------

export function ReadingRunner({
  paper,
  mode,
  regenBusy,
  onNew,
  onExit,
  publicMode,
}: {
  paper: ReadingPaper;
  mode: ReadingMode;
  regenBusy: boolean;
  onNew: () => void;
  onExit: () => void;
  publicMode?: CefrPublicMode;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<ReadingGrade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // No coach for a visitor: it is a signed-in feature behind a signed-in API.
  const [coachOpen, setCoachOpen] = useState(!publicMode);
  const [active, setActive] = useState(0); // index into paper.parts — which part is showing
  const [cur, setCur] = useState<number | null>(null); // currently focused question number
  const passageRef = useRef<HTMLDivElement | null>(null);
  const hl = useHighlighter(passageRef);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fs = useFullscreen(rootRef);

  const set = useCallback((n: number | string, v: string) => {
    setAnswers((a) => ({ ...a, [String(n)]: v }));
    const num = typeof n === "number" ? n : Number(n);
    if (!Number.isNaN(num)) setCur(num);
  }, []);

  // Jump to any question's rendered element, wherever it lives (passage pane for
  // Part 1's inline gaps, questions pane for everything else) — scrollIntoView
  // works across either ancestor scroll container without pane-specific math.
  const jumpTo = useCallback((n: number) => {
    setCur(n);
    requestAnimationFrame(() => {
      document
        .getElementById(`cefr-q-${n}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = publicMode
        ? await postPublic<ReadingGrade>(publicMode, { answers })
        : await callEngine<ReadingGrade>("reading/grade", { item_id: paper.id, answers });
      setGrade(res);
      passageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed.");
    } finally {
      setBusy(false);
    }
  };

  // Keep a stable onExpire so the timer interval is set once (mirrors the IELTS runner).
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  const onExpire = useCallback(() => void submitRef.current(), []);

  // Switching parts resets the passage pane's scroll (mirrors the main IELTS
  // multi-passage test runner switching passages).
  useEffect(() => {
    passageRef.current?.scrollTo?.({ top: 0 });
  }, [active]);

  const graded = !!grade;
  const nums = useMemo(() => questionNumbers(paper.parts), [paper.parts]);
  const coach = useMemo(() => coachContext(paper.parts), [paper.parts]);
  const total = nums.length;
  const answeredCount = nums.filter((n) => (answers[String(n)] ?? "").trim()).length;
  // Full paper = 60 min (the real DTM reading allowance); a single part = a
  // 20-minute focused session (matches "spend about 20 minutes" pacing).
  const allowance = mode === "part" ? 20 * 60 : 60 * 60;
  const pct = total ? Math.round((answeredCount / total) * 100) : 0;

  const correctByNum = new Map<number, QResult>();
  grade?.parts.forEach((p) => p.results.forEach((r) => correctByNum.set(r.number, r)));
  const partsLabel =
    paper.parts.length > 1 ? `${paper.parts.length} parts` : `Part ${paper.parts[0]?.part}`;
  const statusText = graded
    ? "Marked — review each answer below; the coach can explain any of them."
    : hl.tool === "eraser"
      ? "Drag across a highlight to erase it."
      : hl.tool
        ? "Drag across words to highlight them."
        : `Answer all ${total} questions, then submit.`;

  const activePart = paper.parts[active] ?? paper.parts[0];
  const activeNums = useMemo(() => (activePart ? questionNumbers([activePart]) : []), [activePart]);
  const activeAnswered = activeNums.filter((n) => (answers[String(n)] ?? "").trim()).length;
  const rangeLabel = activeNums.length
    ? activeNums.length === 1
      ? `Question ${activeNums[0]}`
      : `Questions ${Math.min(...activeNums)}–${Math.max(...activeNums)}`
    : "";

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: D_PAGE,
        fontFamily: JAKARTA,
        color: D_INK,
        overflow: "hidden",
      }}
    >
      {/* The design's fonts, loaded only for this exam surface (not app-wide, so a
          global next/font would be heavier than needed); falls back to the app fonts. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&display=swap"
      />
      {/* Highlighter pens — transparent fills painted by the CSS Custom Highlight API. */}
      {/* Lighter washes in dark, where the passage text is near-white — see the note on
          HIGHLIGHT_CSS in app/(studio)/read/_components/highlighter.tsx. */}
      {publicMode ? <FreeTrialStrip copy={publicMode.copy} /> : null}
      <style>{`::highlight(cefr-hl-yellow){background-color:rgba(253,224,71,.5)}::highlight(cefr-hl-green){background-color:rgba(134,239,172,.55)}::highlight(cefr-hl-pink){background-color:rgba(249,168,212,.55)}::highlight(cefr-hl-blue){background-color:rgba(147,197,253,.6)}.dark ::highlight(cefr-hl-yellow){background-color:rgba(253,224,71,.3)}.dark ::highlight(cefr-hl-green){background-color:rgba(134,239,172,.3)}.dark ::highlight(cefr-hl-pink){background-color:rgba(249,168,212,.3)}.dark ::highlight(cefr-hl-blue){background-color:rgba(147,197,253,.32)}`}</style>

      {/* Header (dark, in both themes) */}
      <div
        style={{
          background: D_HEAD,
          padding: "0 clamp(16px,3vw,32px)",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit practice"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(255,255,255,.06)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "rgba(255,255,255,.75)",
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={fs.toggle}
            aria-label={fs.isFull ? "Exit full screen" : "Full screen"}
            title={fs.isFull ? "Exit full screen" : "Full screen"}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(255,255,255,.06)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "rgba(255,255,255,.75)",
            }}
          >
            {fs.isFull ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
            <span style={{ fontFamily: JAKARTA, fontWeight: 600, fontSize: 16, color: WHITE }}>
              Reading
            </span>
            <span
              style={{
                fontFamily: JAKARTA,
                fontWeight: 400,
                fontSize: 14,
                color: "rgba(255,255,255,.38)",
                whiteSpace: "nowrap",
              }}
            >
              · {partsLabel}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {!graded ? (
            <Timer seconds={allowance} onExpire={onExpire}>
              {(text, left) => {
                const warn = left <= 120;
                return (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 22px",
                      borderRadius: 100,
                      background: warn ? "rgba(185,28,28,.3)" : "var(--ex-cf-chip)",
                      border: `1px solid ${warn ? "rgba(248,113,113,.5)" : "var(--ex-cf-chip-line)"}`,
                    }}
                    aria-label="time remaining"
                  >
                    <Clock size={14} style={{ color: warn ? "#fecaca" : "var(--ex-cf-chip-icon)" }} />
                    <span
                      style={{
                        fontFamily: JAKARTA,
                        fontWeight: 700,
                        fontSize: 17,
                        letterSpacing: ".02em",
                        color: warn ? "#fecaca" : "var(--ex-cf-head-ink)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {text}
                    </span>
                  </span>
                );
              }}
            </Timer>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                padding: "9px 20px",
                borderRadius: 100,
                background: "var(--ex-cf-chip)",
                border: "1px solid var(--ex-cf-chip-line)",
              }}
            >
              <span
                style={{
                  fontFamily: JAKARTA,
                  fontWeight: 700,
                  fontSize: 17,
                  // Not BRAND_LINE: that goes DARK in dark mode, and this sits on the
                  // header, which is dark in both. It was a brown score on black.
                  color: "var(--ex-cf-head-ink)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {grade.score} / {grade.max_score}
              </span>
              <span
                style={{ fontFamily: JAKARTA, fontWeight: 600, fontSize: 13, color: "var(--ex-cf-chip-icon)" }}
              >
                {grade.max_score ? Math.round((grade.score / grade.max_score) * 100) : 0}%
              </span>
            </span>
          )}
        </div>

        {!graded ? (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            style={dsSubmitBtn(busy)}
          >
            {busy ? "Marking…" : "Submit answers"}
          </button>
        ) : publicMode ? (
          <Link href={publicMode.exitHref} style={{ ...dsSubmitBtn(false), textDecoration: "none" }}>
            All free practice
          </Link>
        ) : (
          <button type="button" onClick={onNew} disabled={regenBusy} style={dsSubmitBtn(regenBusy)}>
            {regenBusy ? "Generating…" : "New paper"}
          </button>
        )}
      </div>

      {/* Info + progress bar */}
      <div
        style={{
          background: PANEL,
          padding: "10px clamp(16px,3vw,32px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${D_LINE}`,
          flexShrink: 0,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span
            style={{
              fontFamily: JAKARTA,
              fontWeight: 400,
              fontSize: 13,
              color: D_SLATE,
              whiteSpace: "nowrap",
            }}
          >
            {statusText}
          </span>
          <MarkerToolbar
            tool={hl.tool}
            setTool={hl.setTool}
            onClear={hl.clearAll}
            marks={hl.marks}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div
            style={{
              width: 100,
              height: 4,
              borderRadius: 2,
              background: D_LINE,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: D_ACCENT,
                borderRadius: 2,
                transition: "width .3s ease",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: JAKARTA,
              fontWeight: 600,
              fontSize: 13,
              color: D_ACCENT,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {answeredCount} / {total}
          </span>
          {publicMode ? null : (
          <button
            type="button"
            onClick={() => setCoachOpen((o) => !o)}
            title={coachOpen ? "Hide the coach" : "Show the coach"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${D_LINE}`,
              background: coachOpen ? PANEL : D_ATINT2,
              color: D_ACCENT,
              fontFamily: JAKARTA,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            {coachOpen ? (
              <>
                <PanelRightClose size={14} /> Hide coach
              </>
            ) : (
              <>
                <MessageCircle size={14} /> Coach
              </>
            )}
          </button>
          )}
        </div>
      </div>

      {graded ? (
        <div style={{ padding: "14px clamp(16px,3vw,32px) 0", flexShrink: 0 }}>
          {publicMode ? <FreeTrialCard copy={publicMode.copy} /> : null}
          <ScoreBanner score={grade.score} max={grade.max_score} level={grade.indicative_cefr} />
        </div>
      ) : null}

      {/* Content row: passage/reference pane (left) · questions pane (right).
          The coach is a floating overlay (below), not a column here. */}
      <div
        className="ml-rd-row"
        style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, position: "relative" }}
      >
        <div
          ref={passageRef}
          onMouseUp={hl.onMouseUp}
          className="ml-rd-passage"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px clamp(14px,2.4vw,36px) 48px",
            minHeight: 0,
            borderRight: `1px solid ${D_LINE}`,
            cursor:
              hl.tool && hl.tool !== "eraser"
                ? "text"
                : hl.tool === "eraser"
                  ? "pointer"
                  : undefined,
          }}
        >
          <div style={{ maxWidth: 680 }}>
            {activePart ? (
              <PartPassage
                part={activePart}
                answers={answers}
                set={set}
                results={correctByNum}
                graded={graded}
              />
            ) : null}
          </div>
        </div>

        <div
          className="ml-rd-questions"
          style={{
            width: "42%",
            maxWidth: 600,
            flex: "none",
            overflowY: "auto",
            padding: "20px clamp(14px,2.2vw,28px) 90px",
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <h2
              style={{
                fontFamily: JAKARTA,
                fontSize: 18,
                fontWeight: 700,
                color: D_ACCENT,
                margin: 0,
              }}
            >
              {rangeLabel}
            </h2>
            <span
              style={{
                fontFamily: JAKARTA,
                fontSize: 13,
                fontWeight: 600,
                color: D_SLATE2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {activeAnswered} of {activeNums.length}
            </span>
          </div>
          {activePart ? (
            <PartQuestions
              part={activePart}
              answers={answers}
              set={set}
              results={correctByNum}
              graded={graded}
              onJump={jumpTo}
            />
          ) : null}
          {error ? <Alert>{error}</Alert> : null}
        </div>
      </div>

      {/* Reading coach — a floating chat menu that OVERLAYS the content (it no longer
          takes a column of the main area), opened/closed from the info-bar toggle.
          position:absolute is relative to the fixed runner root, so it survives OS
          fullscreen and floats above the passage/questions + the bottom nav. */}
      {coachOpen ? (
        <div
          className="ml-rd-coach-float"
          style={{
            position: "absolute",
            right: 20,
            bottom: 72,
            zIndex: 30,
            width: 380,
            maxWidth: "calc(100vw - 40px)",
            height: "min(72vh, 600px)",
            background: PANEL,
            border: `1px solid ${D_LINE}`,
            borderRadius: 16,
            boxShadow: "0 24px 60px -20px rgba(15,23,42,.45)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <CefrCoach
            passageBody={coach.body}
            questions={coach.questions}
            phase={graded ? "results" : "reading"}
            onClose={() => setCoachOpen(false)}
          />
        </div>
      ) : null}

      {/* Bottom nav: part switcher + the ACTIVE part's question circles rendered
          right after that part's pill (not all at the end) — mirrors the main IELTS
          multi-passage runner. */}
      <div
        className="ml-rd-qnav"
        style={{
          flex: "none",
          borderTop: `1px solid ${D_LINE}`,
          background: PANEL,
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {paper.parts.length > 1 ? (
          paper.parts.map((p, pi) => {
            const pNums = questionNumbers([p]);
            const ans = pNums.filter((n) => (answers[String(n)] ?? "").trim()).length;
            const on = pi === active;
            return (
              <Fragment key={p.part}>
                <button
                  type="button"
                  onClick={() => setActive(pi)}
                  aria-current={on ? "true" : undefined}
                  style={cefrPartPill(on)}
                >
                  <span
                    style={{
                      fontWeight: on ? 700 : 600,
                      fontSize: 13.5,
                      color: on ? D_ACCENT : D_SLATE3,
                    }}
                  >
                    Part {p.part}
                  </span>
                  {!on ? (
                    <span
                      style={{ fontSize: 12, color: D_SLATE2, fontVariantNumeric: "tabular-nums" }}
                    >
                      {ans} of {pNums.length}
                    </span>
                  ) : null}
                </button>
                {on ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {activeNums.map((n) => {
                      const answered = !!(answers[String(n)] ?? "").trim();
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => jumpTo(n)}
                          aria-label={`Question ${n}${answered ? " (answered)" : ""}`}
                          style={cefrNavCircle(answered, cur === n)}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </Fragment>
            );
          })
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {activeNums.map((n) => {
              const answered = !!(answers[String(n)] ?? "").trim();
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => jumpTo(n)}
                  aria-label={`Question ${n}${answered ? " (answered)" : ""}`}
                  style={cefrNavCircle(answered, cur === n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* In-passage word lookup + translate. Mounted inside the runner root so it
          survives OS fullscreen; suppressed while a highlighter pen is active so a
          drag marks text instead of popping the dictionary. */}
      {hl.tool === null && !publicMode ? (
        <WordLookup getContainer={() => passageRef.current} contextText={coach.body} />
      ) : null}
    </div>
  );
}

function cefrPartPill(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 14px",
    borderRadius: 999,
    cursor: "pointer",
    flex: "none",
    background: PANEL,
    fontFamily: JAKARTA,
    border: `1.5px solid ${active ? D_ACCENT : D_LINE}`,
  };
}

function cefrNavCircle(answered: boolean, current: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 27,
    height: 27,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "1.5px solid",
    fontFamily: JAKARTA,
    fontVariantNumeric: "tabular-nums",
  };
  if (current)
    return {
      ...base,
      borderColor: D_ACCENT,
      background: PANEL,
      color: D_ACCENT,
      boxShadow: `0 0 0 3px ${D_ATINT}`,
    };
  if (answered)
    return { ...base, borderColor: D_ACCENT_FILL, background: D_ACCENT_FILL, color: WHITE };
  return { ...base, borderColor: D_LINE, background: PANEL, color: D_SLATE2 };
}
