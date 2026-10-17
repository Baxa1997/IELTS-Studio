"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UpgradeNotice } from "@/shared/components/billing/upgrade-notice";
import type { FreeTrialCopy } from "@/lib/free-practice/copy";
import { FreeTrialCard, FreeTrialStrip } from "@/shared/components/practice/free-trial-nudge";
import {
  AudioStrip,
  ExamClock,
  ReplayList,
  segSecs,
  splitAudioByPart,
  useSegmentPlayer,
} from "./player";
import { PART_GENRE, RUN } from "./theme";
import type { Grade, QCtx, QResult, RenderView, Source } from "./types";
import { PANEL, withAlpha } from "@/lib/theme/tokens";

import { callEngine } from "./api";
import { PartPanels } from "./group-panels";
import { partQuestionNums } from "./part-questions";
import { ReviewPanel } from "./review-panel";
import { Chevron, JumpChip, PartTab, RunnerFooter } from "./runner-nav";

// ---- Runner --------------------------------------------------------------------


/** How many separate audio streams a practice has — 4 for a full test, 1 for a
 *  single recording. Needed before `splitAudioByPart` has run, to clamp a resumed
 *  section index in a state initialiser. */
function audioPartCount(view: RenderView): number {
  const parts = new Set<number>();
  for (const seg of view.audio ?? []) parts.add(seg.part ?? 1);
  return Math.max(1, parts.size);
}

/** What a `public` run needs that a signed-in one gets from the engine:
 *  someone to mark it, and somewhere to send the visitor next. */
type PublicRun = {
  grade: (answers: Record<string, string>) => Promise<Grade>;
  copy: FreeTrialCopy;
};

export function Runner({
  view,
  source,
  onExit,
  publicRun,
}: {
  view: RenderView;
  source: Source;
  onExit: () => void;
  publicRun?: PublicRun;
}) {
  /* ⭐ RESUMING. `view.resume` is present only when the engine found an
     in_progress attempt for this practice (render_library attaches it). The
     answers come back keyed by question number as strings on the wire, so they
     are re-keyed to numbers here — the panels index by number. */
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const saved = view.resume?.answers;
    if (!saved) return {};
    const out: Record<number, string> = {};
    for (const [k, v] of Object.entries(saved)) {
      const n = Number(k);
      if (Number.isInteger(n) && typeof v === "string") out[n] = v;
    }
    return out;
  });
  const [flags, setFlags] = useState<Set<number>>(() => new Set());
  const [grade, setGrade] = useState<Grade | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedQ, setFocusedQ] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isTest = view.kind === "test";
  const partViews = useMemo(() => (isTest ? (view.parts ?? []) : [view]), [view, isTest]);

  // Each part is its own audio stream: switching tabs loads that part's
  // segments and plays them from the top (its intro announces the questions),
  // exactly like the separate per-part recordings of a real test.
  const audioParts = useMemo(() => splitAudioByPart(view.audio), [view.audio]);
  /* A resumed run reopens on the SECTION the learner was in, and that section's
     audio plays from its top — which is exactly what switching tabs already does,
     because each part's intro announces its own questions. Deliberately not a
     seek to the saved offset mid-clip: the exam rule is that a recording plays
     once, and dropping the learner into the middle of a sentence would be worse
     practice than re-hearing the part they were on. */
  const [apIdx, setApIdx] = useState(() => {
    const at = view.resume?.part_index;
    return at != null ? Math.min(Math.max(at, 0), Math.max(0, audioPartCount(view) - 1)) : 0;
  });
  const pendingAutoStart = useRef(false);

  // A finished part flows straight into the next one (pre-grade). The player
  // fires this from the stream's `ended` event.
  const onPartEnd = useCallback(() => {
    if (!isTest || grade || apIdx >= audioParts.length - 1) return;
    const next = audioParts[apIdx + 1];
    pendingAutoStart.current = true;
    setApIdx(apIdx + 1);
    setCurrentQ(
      partQuestionNums(partViews.find((p) => p.part === next.part) ?? partViews[0])[0] ?? 0,
    );
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [isTest, grade, apIdx, audioParts, partViews]);

  const player = useSegmentPlayer(audioParts[apIdx]?.segments ?? view.audio, onPartEnd);

  // The visible part is the part whose stream is loaded — questions and audio
  // can never disagree.
  const currentPart = audioParts[apIdx]?.part ?? partViews[0]?.part ?? 1;

  // Start a freshly loaded part when the switch asked for it (tab click while
  // the audio was rolling, or the end-of-part auto-advance). The hook resets
  // to idle on a segment swap, so this fires once the new stream is in place.
  const playerPhase = player.phase;
  const playerStart = player.start;
  useEffect(() => {
    if (pendingAutoStart.current && playerPhase === "idle") {
      pendingAutoStart.current = false;
      playerStart();
    }
  }, [playerPhase, playerStart]);

  const questionNums = useMemo(
    () => partViews.flatMap(partQuestionNums).sort((a, b) => a - b),
    [partViews],
  );
  const answered = questionNums.filter((n) => (answers[n] ?? "").trim()).length;

  const visiblePart = useMemo(
    () => partViews.find((p) => p.part === currentPart) ?? partViews[0],
    [partViews, currentPart],
  );
  const partNums = useMemo(() => (visiblePart ? partQuestionNums(visiblePart) : []), [visiblePart]);
  // A valid highlighted question for the visible part (derived, not stored).
  const currentQChip = partNums.includes(currentQ) ? currentQ : (partNums[0] ?? 0);

  const toggleFlag = useCallback((n: number) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  const setFocus = useCallback((n: number) => {
    setFocusedQ(n);
    setCurrentQ(n);
  }, []);

  const goTo = useCallback((n: number) => {
    setCurrentQ(n);
    const el = document.getElementById(`q-${n}`);
    const c = scrollRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
  }, []);

  /* ⭐ AUTOSAVE, so closing the tab no longer loses the run.
     Reads the playback position from the player's TICK STORE, which is a ref and
     not React state — that is the whole reason the position lives outside state
     (see useSegmentPlayer), and reading it here costs no re-render of the exam
     surface. Saving stops for good once the practice is graded: the engine clears
     the in_progress row as part of storing the attempt, and a late save would
     resurrect it and leave a marked practice showing "Paused". */
  // Set in an effect, not during render: Date.now() in a render body is impure
  // (react-hooks/purity), and it is how both reading runners do it too.
  const startedAtRef = useRef(0);
  useEffect(() => void (startedAtRef.current = Date.now()), []);
  const savingOffRef = useRef(false);
  const answersRef = useRef(answers);
  useEffect(() => void (answersRef.current = answers), [answers]);
  const apIdxRef = useRef(apIdx);
  useEffect(() => void (apIdxRef.current = apIdx), [apIdx]);

  const saveProgress = useCallback(() => {
    if (savingOffRef.current || source !== "library") return;
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(answersRef.current)) body[k] = v;
    void callEngine("library/progress", {
      library_id: view.id,
      answers: body,
      part_index: apIdxRef.current,
      elapsed_seconds: startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : 0,
    }).catch(() => {
      // Best-effort by design — the engine swallows its own failures too, and an
      // autosave must never interrupt a practice in progress.
    });
  }, [source, view.id]);

  useEffect(() => {
    if (grade) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") saveProgress();
    }, 15_000);
    const onHide = () => {
      if (document.visibilityState === "hidden") saveProgress();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", saveProgress);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", saveProgress);
      // Leaving the runner is still leaving mid-practice.
      saveProgress();
    };
  }, [grade, saveProgress]);

  const submit = useCallback(async () => {
    setGrading(true);
    setError(null);
    // The engine deletes the in_progress row while storing the attempt; anything
    // saved after that would recreate it.
    savingOffRef.current = true;
    try {
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(answers)) body[k] = v;
      const durationSeconds = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : 0;
      const graded =
        source === "public" && publicRun
          ? await publicRun.grade(body)
          : source === "library"
          ? await callEngine<Grade>("library/grade", {
              library_id: view.id,
              answers: body,
              duration_seconds: durationSeconds,
            })
          : await callEngine<Grade>("grade", { item_id: view.id, answers: body });
      setGrade(graded);
      if (graded.attempt_id) {
        void fetch("/api/estimates/recompute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skill: "listening" }),
        }).catch(() => undefined);
      }
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed — please try again.");
    } finally {
      setGrading(false);
    }
  }, [answers, view.id, source, publicRun]);

  const practiceAgain = useCallback(() => {
    // A fresh run: the clock restarts and autosave is armed again.
    startedAtRef.current = Date.now();
    savingOffRef.current = false;
    setAnswers({});
    setFlags(new Set());
    setGrade(null);
    setError(null);
    pendingAutoStart.current = false;
    setApIdx(0);
    setCurrentQ(0);
    player.reset();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [player]);

  const resultByQ = useMemo(() => {
    const map = new Map<number, QResult>();
    for (const r of grade?.results ?? []) map.set(r.q, r);
    return map;
  }, [grade]);

  const qctx: QCtx = {
    answers,
    setAnswers,
    results: grade ? resultByQ : null,
    flags,
    toggleFlag,
    focusedQ,
    setFocus,
  };

  // Exam clock spans the whole recording: manifest totals for the parts not
  // loaded plus the live player for the one that is.
  const partTotals = useMemo(
    () => audioParts.map((p) => p.segments.reduce((a, s) => a + segSecs(s), 0)),
    [audioParts],
  );
  const beforeSecs = partTotals.slice(0, apIdx).reduce((a, b) => a + b, 0);
  const grandTotal = partTotals.reduce((a, b) => a + b, 0);
  const total = isTest
    ? grandTotal > 0
      ? grandTotal
      : 1800
    : player.duration > 0
      ? player.duration
      : 480;

  const partIdx = partViews.findIndex((p) => p.part === currentPart);
  // Parts are freely navigable: a tab click mid-test loads that part's own
  // stream and restarts it from the beginning (its "look at the questions"
  // intro included); in review it just swaps the visible questions.
  const goPart = (n: number) => {
    if (n !== currentPart) {
      const i = audioParts.findIndex((p) => p.part === n);
      if (i >= 0 && i !== apIdx) {
        pendingAutoStart.current = !grade && player.phase !== "idle";
        setApIdx(i);
      }
    }
    setCurrentQ(partQuestionNums(partViews.find((p) => p.part === n) ?? partViews[0])[0] ?? 0);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: RUN.desk,
        display: "flex",
        fontFamily: RUN.sans,
        color: RUN.t1,
      }}
    >
      <style>{`
        @keyframes lp-pulse-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.45); opacity: 0; } }
        .lp-qscroll::-webkit-scrollbar { width: 12px; }
        .lp-qscroll::-webkit-scrollbar-thumb { background:${RUN.bIdle}; border-radius:9999px; border:4px solid transparent; background-clip:content-box; }
        .lp-run-input::placeholder { color:${RUN.t4}; }
        .lp-run-input:focus { border-color:${RUN.focusBorder} !important; box-shadow:0 0 0 3px ${withAlpha(RUN.v, 10)}; }
        .lp-form2 { display:grid; grid-template-columns:1fr 1fr; grid-auto-flow:column; column-gap:56px; }
        @media (max-width: 760px) { .lp-form2 { display:block; } }
        .lp-map-panel { grid-template-columns:minmax(360px,600px) minmax(260px,1fr); }
        @media (max-width: 900px) { .lp-map-panel { grid-template-columns:1fr !important; } }
      `}</style>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: RUN.frame,
          overflow: "hidden",
        }}
      >
        {publicRun ? <FreeTrialStrip copy={publicRun.copy} /> : null}
        {/* ===== TOP BAR ===== */}
        <header
          style={{
            flexShrink: 0,
            minHeight: 52,
            background: PANEL,
            borderBottom: `1px solid ${RUN.bBar}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 20px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onExit}
            className="lp-run-exit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: RUN.t2,
              fontFamily: RUN.sans,
              fontSize: 14,
              fontWeight: 600,
              padding: "8px 10px",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            <Chevron dir="left" />
            Exit
          </button>
          <div style={{ width: 1, height: 26, background: RUN.bBar }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: RUN.t1, letterSpacing: "-0.005em" }}>
            {isTest ? "Listening · Practice test" : "Listening · Quick practice"}
          </div>

          <div style={{ flex: 1, minWidth: 8 }} />

          {isTest ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: RUN.desk,
                borderRadius: 9,
                padding: 3,
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <PartTab
                  key={n}
                  n={n}
                  active={currentPart === n}
                  unlocked
                  onClick={() => goPart(n)}
                />
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: RUN.vBg,
              color: RUN.vDeep,
              fontFamily: RUN.mono,
              fontSize: 14,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              padding: "5px 11px",
              borderRadius: 9,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <ExamClock player={player} isTest={isTest} beforeSecs={beforeSecs} total={total} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 5,
              background: PANEL,
              border: `1px solid ${RUN.bPill}`,
              padding: "5px 11px",
              borderRadius: 9,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: RUN.t1 }}>{answered}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t3 }}>
              / {questionNums.length}
            </span>
          </div>
        </header>

        {/* ===== AUDIO STRIP ===== */}
        <AudioStrip player={player} />

        {/* ===== MAIN ===== */}
        <main
          id="lp-qscroll"
          ref={scrollRef}
          className="lp-qscroll"
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflowY: "auto",
            background: PANEL,
            padding: "18px clamp(20px,4vw,40px) 32px",
          }}
        >
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {/* part label + jump chips */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: RUN.vDeep,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Part {visiblePart?.part ?? 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t2 }}>
                  {PART_GENRE[visiblePart?.part ?? 1] ?? ""}
                </span>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {partNums.map((n) => (
                  <JumpChip
                    key={n}
                    n={n}
                    current={currentQChip === n}
                    flagged={flags.has(n)}
                    answered={(answers[n] ?? "").trim() !== ""}
                    onClick={() => goTo(n)}
                  />
                ))}
              </div>
            </div>

            {/* the announcer's scenario line, kept on screen so the setting and
                purpose of the recording survive the one-shot audio intro */}
            {visiblePart?.narrator_intro ? (
              <p
                style={{
                  margin: "-4px 0 18px",
                  fontFamily: RUN.sans,
                  fontSize: 13.5,
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  color: RUN.t2,
                }}
              >
                {visiblePart.narrator_intro}
              </p>
            ) : null}

            {/* questions — flat, full-bleed, no card chrome (matches handoff) */}
            <section>{visiblePart ? <PartPanels p={visiblePart} ctx={qctx} /> : null}</section>

            {grade && publicRun ? <FreeTrialCard copy={publicRun.copy} /> : null}
            {grade ? <ReviewPanel grade={grade} /> : null}
            {grade ? <ReplayList segments={view.audio} /> : null}
            {error ? (
              <div style={{ marginTop: 16 }}>
                <UpgradeNotice message={error} />
              </div>
            ) : null}
          </div>
        </main>

        {/* ===== FOOTER ===== */}
        <RunnerFooter
          isTest={isTest}
          grade={grade}
          grading={grading}
          answered={answered}
          totalQ={questionNums.length}
          flagCount={flags.size}
          canBack={partIdx > 0}
          isLastPart={partIdx >= partViews.length - 1}
          source={source}
          onBack={() => partIdx > 0 && goPart(partViews[partIdx - 1].part)}
          onNext={() => partIdx < partViews.length - 1 && goPart(partViews[partIdx + 1].part)}
          onSubmit={submit}
          onPracticeAgain={practiceAgain}
          onExit={onExit}
        />
      </div>
    </div>
  );
}
