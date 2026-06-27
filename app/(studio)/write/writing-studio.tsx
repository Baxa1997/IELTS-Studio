"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Typewriter } from "@/components/typewriter";
import { cleanAnnotations, type Annotation } from "@/components/writing/annotations";
import { EssayFeedback } from "@/components/writing/essay-feedback";
import { FigureView } from "@/components/writing/figure";
import type { Figure } from "@/lib/writing/figure";
import { CefrFeedback } from "@/app/(app)/cefr/writing/cefr-feedback";
import { CEFR, type CefrLevel } from "@/lib/cefr/levels";
import { cefrTheme, IELTS_STUDIO_THEME, accentStrong, type StudioTheme } from "@/lib/cefr/theme";
import type { CefrGradeResult } from "@/lib/cefr/schema";

import { saveDraft } from "./actions";

// ---- Types -----------------------------------------------------------------

export type EssayTaskKind = "task2" | "task1_general" | "task1_academic";

export interface ServedPrompt {
  id: string;
  task_type: EssayTaskKind;
  prompt_text: string;
  /** Academic Task 1 only: the chart/table the candidate must describe. */
  figure: Figure | null;
  category: string | null;
  topic_family: string | null;
  difficulty: number | null;
  /** True for prompts this learner generated on demand (source = 'ai') vs. the
   *  curated starter set (source = 'seed') — used by the library to surface fresh
   *  ones first, without a band. Absent on the studio's served prompt. */
  generated?: boolean;
}

export type LibraryPrompt = ServedPrompt;

/** The studio runs in two modes: the default IELTS flow, and a CEFR flow that reuses
 *  the exact same UI but grades on the CEFR scale (A1–C2) via /api/cefr/grade. */
export type StudioMode = "ielts" | "cefr";

export interface CefrStudioTask {
  id: string;
  level: CefrLevel;
  genre: string;
  title: string;
  promptText: string;
  points: string[];
  /** [min, max] word target for the level. */
  words: [number, number];
}

interface CriterionScore {
  band: number;
  evidence: string;
  what_caps_it: string;
  fix: string;
}

interface Grading {
  overall_band: number;
  band_with_fixes: number;
  criteria: Record<string, CriterionScore>;
  score_blocker: { criterion: string; why: string };
  model: string;
  version_no?: number;
  annotations?: Annotation[];
}

interface TutorMsg {
  role: "user" | "assistant";
  content: string;
  /** A freshly-arrived coach reply types in live; replayed history shows at once. */
  animate?: boolean;
}

type Phase = "writing" | "results";

// ---- Brand tokens ----------------------------------------------------------

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const EMERALD = "#2f8f5b";

const AUTOSAVE_MS = 1500;

function secondsForTask(kind: string): number {
  return kind === "task2" ? 40 * 60 : 20 * 60;
}
function minWordsForTask(kind: string): number {
  return kind === "task2" ? 250 : 150;
}
function minutesForTask(kind: string): number {
  return kind === "task2" ? 40 : 20;
}
/** CEFR practice time, scaled to the level (higher levels write longer texts). */
function cefrSecondsForLevel(level: CefrLevel): number {
  const mins: Record<CefrLevel, number> = { A1: 15, A2: 15, B1: 20, B2: 30, C1: 40, C2: 40 };
  return (mins[level] ?? 30) * 60;
}
function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function requirementChips(kind: string): string[] {
  if (kind === "task1_general") return ["Cover all three points", `At least ${minWordsForTask(kind)} words`, `~${minutesForTask(kind)} minutes`];
  if (kind === "task1_academic") return ["Describe the key data", `At least ${minWordsForTask(kind)} words`, `~${minutesForTask(kind)} minutes`];
  return ["Give reasons & examples", `At least ${minWordsForTask(kind)} words`, `~${minutesForTask(kind)} minutes`];
}
const CATEGORY_LABEL: Record<string, string> = {
  opinion: "Agree / Disagree",
  discussion: "Discuss both views",
  problem_solution: "Problem / Solution",
  two_part: "Two-part question",
};

// IELTS prompts ship with boilerplate ("spend 40 minutes…", "write at least 250
// words") wrapped around the real topic statement. Split them so the editor can
// give the topic the most weight and shrink the instructions.
type PromptPart = { kind: "meta" | "topic" | "question"; text: string };
const PROMPT_META_RE = /^(you should spend|write about the following|give reasons for your answer|write at least \d+\s*words|you should write at least)/i;
const PROMPT_Q_RE = /(to what extent do you (agree|think)|do you agree or disagree|agree or disagree\??$|discuss both (these )?views|what are the (causes|advantages|disadvantages|problems|reasons|benefits|drawbacks)|why (do|is|are|has)|how (can|could|do)|what (problems|measures|solutions|steps))/i;

function parsePromptParts(text: string): PromptPart[] {
  let blocks = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (blocks.length <= 1) blocks = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const parts: PromptPart[] = blocks.map((b) => {
    if (PROMPT_META_RE.test(b)) return { kind: "meta" as const, text: b };
    if (/\?\s*$/.test(b) && PROMPT_Q_RE.test(b) && b.length < 140) return { kind: "question" as const, text: b };
    return { kind: "topic" as const, text: b };
  });
  // Never let parsing hide the whole prompt — if nothing read as the topic, show it all big.
  if (!parts.some((p) => p.kind === "topic")) return blocks.map((b) => ({ kind: "topic" as const, text: b }));
  return parts;
}

const TUTOR_CHIPS = ["Plan an outline", "Useful vocabulary", "Check my idea"];

// ---- Studio ----------------------------------------------------------------

export function WritingStudio({
  prompt: providedPrompt,
  essayId: initialEssayId = null,
  initialContent = "",
  resumed = false,
  mode = "ielts",
  cefrTask,
  onExit,
}: {
  prompt?: ServedPrompt;
  essayId?: string | null;
  initialContent?: string;
  resumed?: boolean;
  mode?: StudioMode;
  cefrTask?: CefrStudioTask;
  /** CEFR mode: called when the learner leaves the studio (back to the chooser). */
  onExit?: () => void;
}) {
  const router = useRouter();
  const isCefr = mode === "cefr" && !!cefrTask;
  // CEFR tasks reuse the IELTS studio shell via a synthetic prompt, so every existing
  // `prompt.*` reference keeps working; CEFR-specific behaviour branches on `isCefr`.
  const prompt: ServedPrompt =
    providedPrompt ?? {
      id: cefrTask!.id,
      task_type: "task2",
      prompt_text: cefrTask!.promptText,
      figure: null,
      category: null,
      topic_family: null,
      difficulty: null,
    };
  const taskKind = prompt.task_type;

  // CEFR theming: the studio chrome is driven by a theme so the CEFR track reads as
  // its own product (cool canvas + the level's colour), while IELTS keeps today's look
  // exactly (IELTS_STUDIO_THEME). Shadowing INDIGO/INK here reskins every accent/ink
  // reference in this component at once; helper components below keep the module tokens.
  const theme = isCefr ? cefrTheme(cefrTask!.level) : IELTS_STUDIO_THEME;
  const INDIGO = theme.accent;
  const INK = theme.ink;

  const [phase, setPhase] = useState<Phase>("writing");
  const [essayId, setEssayId] = useState<string | null>(initialEssayId);
  const [content, setContent] = useState(initialContent);
  const [timed, setTimed] = useState(!resumed);
  const [grading, setGrading] = useState<Grading | null>(null);
  const [cefrGrade, setCefrGrade] = useState<CefrGradeResult | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(initialContent ? "saved" : "idle");
  const [submitting, setSubmitting] = useState(false);
  const [lastGraded, setLastGraded] = useState("");

  const [tutorOpen, setTutorOpen] = useState(true);
  const [spellOn, setSpellOn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tutorMsgs, setTutorMsgs] = useState<TutorMsg[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorPending, setTutorPending] = useState(false);

  const contentRef = useRef(content);
  const essayIdRef = useRef(essayId);
  const lastSavedRef = useRef(initialContent);
  const submittingRef = useRef(false);
  const tutorMsgsRef = useRef(tutorMsgs);
  const tutorScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => void (contentRef.current = content), [content]);
  useEffect(() => void (essayIdRef.current = essayId), [essayId]);
  useEffect(() => void (tutorMsgsRef.current = tutorMsgs), [tutorMsgs]);
  useEffect(() => {
    tutorScrollRef.current?.scrollTo({ top: tutorScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [tutorMsgs, tutorPending]);

  const words = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);

  const persist = useCallback(async (): Promise<string | null> => {
    // CEFR grading is stateless (text posted directly to /api/cefr/grade) — no draft row.
    if (isCefr) return essayIdRef.current;
    const c = contentRef.current;
    if (!c.trim()) return essayIdRef.current;
    setSaveState("saving");
    const res = await saveDraft({ promptId: prompt.id, essayId: essayIdRef.current, content: c });
    if (res.essayId) {
      essayIdRef.current = res.essayId;
      setEssayId(res.essayId);
      lastSavedRef.current = c;
      setSaveState("saved");
      return res.essayId;
    }
    setSaveState("error");
    return null;
  }, [prompt.id]);

  useEffect(() => {
    if (isCefr) return;
    if (phase !== "writing") return;
    if (content.trim() === lastSavedRef.current.trim()) return;
    const t = setTimeout(() => void persist(), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [content, phase, persist, isCefr]);

  useEffect(() => {
    if (isCefr) return;
    const onHide = () => {
      if (document.visibilityState === "hidden" && contentRef.current.trim() !== lastSavedRef.current.trim()) void persist();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [persist, isCefr]);

  // Full-page exit (refresh / close / non-SPA navigation) also resets the studio:
  // beacon the discard so the unsubmitted draft doesn't linger. Graded essays are
  // kept by the route's guard (status='draft' + zero gradings).
  useEffect(() => {
    if (isCefr) return;
    const onPageHide = () => {
      navigator.sendBeacon?.(`/api/essays/discard?promptId=${prompt.id}`);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [prompt.id, isCefr]);

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    if (!contentRef.current.trim()) {
      setMessage("Write something before submitting.");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setMessage(null);

    // CEFR mode: grade statelessly through the CEFR examiner (4 subscales + level).
    if (isCefr) {
      try {
        const res = await fetch("/api/cefr/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: cefrTask!.id,
            level: cefrTask!.level,
            genre: cefrTask!.genre,
            prompt: cefrTask!.promptText,
            taskTitle: cefrTask!.title,
            text: contentRef.current,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as { grade?: CefrGradeResult; message?: string };
        if (res.ok && body.grade) {
          setCefrGrade(body.grade);
          setLastGraded(contentRef.current);
          setTimed(false);
          setPhase("results");
          window.scrollTo({ top: 0 });
        } else if (res.status === 429) {
          setMessage("You’ve reached your monthly grading limit.");
        } else {
          setMessage(body.message ?? "Couldn’t grade your writing. Please try again.");
        }
      } catch {
        setMessage("Network error while grading — please try again.");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
      return;
    }

    const id = await persist();
    if (!id) {
      setMessage("Couldn't save your essay. Please try again.");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/essays/${id}/grade`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        grading?: Grading;
        disclaimer?: string;
        message?: string;
        error?: string;
      };
      if (res.status === 200 && body.grading) {
        setGrading(body.grading);
        setDisclaimer(body.disclaimer ?? null);
        setLastGraded(contentRef.current);
        setTimed(false);
        setPhase("results");
        window.scrollTo({ top: 0 });
      } else if (res.status === 202) {
        setMessage(body.message ?? "Grading is busy right now — your essay is queued. Try again shortly.");
      } else if (res.status === 429) {
        setMessage("You’ve reached your monthly grading limit.");
      } else {
        setMessage(body.message ?? body.error ?? "Grading failed. Please try again.");
      }
    } catch {
      setMessage("Network error while grading — please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [persist, isCefr, cefrTask]);

  const submitRef = useRef(submit);
  useEffect(() => void (submitRef.current = submit), [submit]);
  const onExpire = useCallback(() => void submitRef.current(), []);

  function revise() {
    setGrading(null);
    setCefrGrade(null);
    setDisclaimer(null);
    setMessage(null);
    setTimed(false);
    setPhase("writing");
    window.scrollTo({ top: 0 });
  }

  // Leaving the studio resets it: discard the unsubmitted draft so the next visit
  // starts blank and abandoned attempts never count as "practised". We persist
  // first so the discard (keyed by prompt) is sure to find and remove the row;
  // graded work has gradings and is kept by the route's guard. Best-effort.
  const goLibrary = useCallback(async () => {
    if (isCefr) {
      onExit?.();
      return;
    }
    await persist();
    try {
      await fetch(`/api/essays/discard?promptId=${prompt.id}`, { method: "POST", keepalive: true });
    } catch {
      /* best-effort cleanup — navigation proceeds regardless */
    }
    router.push("/write");
    router.refresh(); // re-fetch the library so a freshly generated prompt shows
  }, [persist, prompt.id, router, isCefr, onExit]);

  // Upload/paste a photo or PDF of a written answer → transcribe to editable text.
  // Faithful transcription server-side; we append it (non-destructive) so a typed
  // draft is never silently wiped. The student then edits and grades as normal.
  const transcribeFile = useCallback(
    async (file: File) => {
      if (uploading || submitting) return;
      setUploading(true);
      setMessage(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/writing/transcribe", { method: "POST", body: fd });
        const body = (await res.json().catch(() => ({}))) as { text?: string; message?: string };
        if (!res.ok || !body.text) {
          setMessage(body.message ?? "Couldn't read that file — try a clearer photo or PDF.");
          return;
        }
        const add = body.text.trim();
        setContent((prev) => (prev.trim() ? `${prev.replace(/\s+$/, "")}\n\n${add}` : add));
      } catch {
        setMessage("Network error while reading the file — please try again.");
      } finally {
        setUploading(false);
      }
    },
    [uploading, submitting],
  );

  const onPasteFile = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((it) => it.type.startsWith("image/"));
      const f = item?.getAsFile();
      if (f) {
        e.preventDefault(); // image paste → transcribe; text paste falls through normally
        void transcribeFile(f);
      }
    },
    [transcribeFile],
  );

  const sendTutor = useCallback(
    async (raw?: string) => {
      const q = (raw ?? tutorInput).trim();
      if (!q || tutorPending) return;
      const prior = tutorMsgsRef.current;
      setTutorMsgs([...prior, { role: "user", content: q }]);
      setTutorInput("");
      setTutorPending(true);
      try {
        const res = await fetch("/api/writing/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q,
            taskType: taskKind,
            promptText: isCefr ? `This is a CEFR ${cefrTask!.level} ${cefrTask!.genre} writing task.\n${prompt.prompt_text}` : prompt.prompt_text,
            draft: contentRef.current,
            phase: lastGraded.trim() ? "results" : "writing",
            history: prior.slice(-6),
          }),
        });
        const body = (await res.json().catch(() => ({}))) as { reply?: string; message?: string };
        setTutorMsgs((m) => [...m, { role: "assistant", content: res.ok && body.reply ? body.reply : body.message ?? "I couldn’t respond just now — try again.", animate: true }]);
      } catch {
        setTutorMsgs((m) => [...m, { role: "assistant", content: "Network error — please try again.", animate: true }]);
      } finally {
        setTutorPending(false);
      }
    },
    [tutorInput, tutorPending, taskKind, prompt.prompt_text, lastGraded, isCefr, cefrTask],
  );

  // Once a coach reply has finished typing, clear its animate flag so reopening the
  // coach (which remounts the panel) replays it instantly instead of re-typing every
  // old reply at once — the "jumping / rewriting loop" bug.
  const markTutorAnimated = useCallback((idx: number) => {
    setTutorMsgs((m) => (m[idx]?.animate ? m.map((msg, j) => (j === idx ? { ...msg, animate: false } : msg)) : m));
  }, []);

  // ---- Results -------------------------------------------------------------

  // CEFR results: the four-subscale CEFR feedback (level estimate), wrapped in a
  // scrollable page with its own back/revise actions.
  if (phase === "results" && isCefr && cefrGrade) {
    return (
      <div style={{ height: "100dvh", overflowY: "auto", background: theme.canvas }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "26px clamp(16px,4vw,28px) 64px" }}>
          <button
            type="button"
            onClick={() => onExit?.()}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px 0 11px", border: `1px solid ${theme.line}`, background: "#fff", borderRadius: 9, fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "#41496A", cursor: "pointer" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#41496A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            CEFR tasks
          </button>
          <div style={{ marginTop: 16 }}>
            <CefrFeedback
              grade={cefrGrade}
              taskTitle={cefrTask!.title}
              footer={
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={revise} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", border: "none", borderRadius: 11, background: INDIGO, color: "#fff", fontFamily: SANS, fontSize: 14.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 22px -10px rgba(59,67,181,.7)" }}>
                    Revise this task
                  </button>
                  <button type="button" onClick={() => onExit?.()} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", border: `1px solid ${theme.line}`, borderRadius: 11, background: "#fff", color: INK, fontFamily: SANS, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
                    Try another task
                  </button>
                </div>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results" && grading) {
    return (
      <EssayFeedback
        taskType={taskKind}
        topicFamily={prompt.topic_family}
        figure={prompt.figure}
        overallBand={grading.overall_band}
        bandWithFixes={grading.band_with_fixes}
        criteria={grading.criteria}
        blocker={grading.score_blocker}
        essayText={lastGraded}
        annotations={cleanAnnotations(grading.annotations)}
        promptText={prompt.prompt_text}
        backHref="/write"
        backLabel="Library"
        onRevise={revise}
        disclaimer={disclaimer ?? undefined}
      />
    );
  }

  // ---- Editor --------------------------------------------------------------

  const hasGraded = lastGraded.trim() !== "";
  const unchangedSinceGrade = hasGraded && content.trim() === lastGraded.trim();
  const minWords = isCefr ? cefrTask!.words[0] : minWordsForTask(taskKind);
  const taskSeconds = isCefr ? cefrSecondsForLevel(cefrTask!.level) : secondsForTask(taskKind);
  const requirementList = isCefr ? cefrTask!.points : requirementChips(taskKind).filter((c) => !/\bwords\b/i.test(c));
  const wordPct = Math.min(100, minWords ? Math.round((words / minWords) * 100) : 0);
  const lengthMet = words >= minWords;
  const wordsToTarget = Math.max(0, minWords - words);
  const chars = content.length;
  const paragraphs = content.trim() ? content.trim().split(/\n{2,}/).map((s) => s.trim()).filter(Boolean).length : 0;
  const RING_C = 2 * Math.PI * 19; // ≈ 119.38
  const ringOffset = RING_C * (1 - Math.min(1, minWords ? words / minWords : 0));
  const taskNo = isCefr ? cefrTask!.level : taskKind === "task2" ? "TASK 2" : "TASK 1";
  const taskKindLabel = isCefr
    ? `${cap(cefrTask!.genre)} · ${CEFR[cefrTask!.level].name}`
    : taskKind === "task2" ? "Academic · Essay" : taskKind === "task1_general" ? "General · Letter" : "Academic · Report";
  const promptParts = parsePromptParts(prompt.prompt_text);

  const submitDisabled = submitting || !content.trim() || unchangedSinceGrade;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: theme.canvas }}>
      {/* grading modal — a calm, on-brand cover every time we mark a submission */}
      {submitting ? <GradingOverlay mode={mode} theme={theme} /> : null}

      {/* header */}
      <header style={{ flexShrink: 0, height: 62, background: "#fff", borderBottom: `1px solid ${theme.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <button type="button" onClick={() => void goLibrary()} style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 13px 0 11px", border: `1px solid ${theme.line}`, background: theme.soft, borderRadius: 9, fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "#41496A", cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#41496A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            {isCefr ? "CEFR tasks" : "Library"}
          </button>
          <div style={{ width: 1, height: 24, background: theme.line }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: SANS, minWidth: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 9px", borderRadius: 6, background: INK, color: "#fff", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", flexShrink: 0 }}>{taskNo}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#41496A" }}>{taskKindLabel}</span>
            {prompt.topic_family && prompt.topic_family !== "custom" ? (<><span style={{ color: "#C7C3B4" }}>·</span><span style={{ fontSize: 14, color: "#767C90", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prompt.topic_family}</span></>) : null}
            {prompt.difficulty ? (<><span style={{ color: "#C7C3B4" }}>·</span><span style={{ fontSize: 14, color: "#767C90", flexShrink: 0 }}>Band {prompt.difficulty}</span></>) : null}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {timed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 12px", border: `1px solid ${theme.line}`, borderRadius: 9, background: theme.soft }}><Timer seconds={taskSeconds} onExpire={onExpire} /></div>
          ) : null}
          {!isCefr ? <SaveBadge state={saveState} /> : null}
          <div style={{ width: 1, height: 24, background: theme.line }} />
          <button type="button" onClick={() => void submit()} disabled={submitDisabled} style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", border: "none", borderRadius: 10, background: INDIGO, color: "#fff", fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: submitDisabled ? "default" : "pointer", opacity: submitDisabled ? 0.55 : 1, boxShadow: theme.accentShadow }}>
            {submitting ? "Grading…" : hasGraded ? "Resubmit for grading" : "Submit for grading"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </header>

      {/* body: prompt | answer | coach */}
      <div className="lp-write-main" style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", gap: 16, padding: 16 }}>
        {/* prompt */}
        <aside className="lp-write-topic" style={{ width: 356, flexShrink: 0, background: "#fff", border: `1px solid ${theme.line}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${theme.softLine}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 13 }}>
                <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 800, letterSpacing: ".13em", color: "#9A9684" }}>THE TASK</span>
                {prompt.category && CATEGORY_LABEL[prompt.category] ? (
                  <span style={{ display: "inline-flex", alignItems: "center", height: 26, padding: "0 11px", borderRadius: 7, background: theme.accentSoft, color: INDIGO, fontFamily: SANS, fontSize: 12.5, fontWeight: 700 }}>{CATEGORY_LABEL[prompt.category]}</span>
                ) : null}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {promptParts.map((p, i) =>
                  p.kind === "meta" ? (
                    <p key={i} style={{ margin: 0, fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, fontWeight: 600, color: "#9A9684" }}>{p.text}</p>
                  ) : p.kind === "question" ? (
                    <p key={i} style={{ margin: 0, fontFamily: SERIF, fontSize: 14.5, fontStyle: "italic", lineHeight: 1.4, color: "#5A6076" }}>{p.text}</p>
                  ) : (
                    <p key={i} style={{ margin: 0, fontFamily: SERIF, fontSize: 19.5, lineHeight: 1.4, fontWeight: 600, color: INK, whiteSpace: "pre-wrap" }}>{p.text}</p>
                  ),
                )}
              </div>
            </div>
            {prompt.figure ? (
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.softLine}` }}>
                <FigureView figure={prompt.figure} />
              </div>
            ) : null}
            <div style={{ padding: "16px 20px" }}>
              <p style={{ margin: "0 0 12px", fontFamily: SANS, fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", color: "#767C90" }}>REQUIREMENTS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {requirementList
                  .map((c) => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", background: theme.soft, border: `1px solid ${theme.softLine}`, borderRadius: 10 }}>
                      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: "#E5F3EA", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
                      <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "#2C3247" }}>{c}</span>
                    </div>
                  ))}
                {/* live word-count requirement */}
                <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", background: theme.accentSoft, border: `1px solid ${theme.accentLine}`, borderRadius: 10 }}>
                  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: lengthMet ? "#E5F3EA" : "#fff", border: lengthMet ? "none" : `2px solid ${theme.accentLine}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {lengthMet ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : null}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "#2C3247" }}>{isCefr ? `About ${cefrTask!.words[0]}–${cefrTask!.words[1]} words` : `At least ${minWords} words`}</span>
                      <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>{words}</span>
                    </div>
                    <div style={{ marginTop: 7, height: 5, borderRadius: 3, background: theme.accentSoft, overflow: "hidden" }}><div style={{ width: `${wordPct}%`, height: "100%", borderRadius: 3, background: INDIGO, transition: "width .3s ease" }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, padding: "14px 20px", borderTop: `1px solid ${theme.softLine}`, display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9684" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16v-4M12 8h.01" /><circle cx="12" cy="12" r="9" /></svg>
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: "#8A8FA0", lineHeight: 1.4 }}>{isCefr ? "Graded on the CEFR scale (A1–C2) — Content, Communication, Organisation, Language." : hasGraded ? "A model answer for this task is in your feedback." : "A model answer for this task unlocks after you submit."}</span>
          </div>
        </aside>

        {/* answer */}
        <main className="lp-write-answer" style={{ flex: 1, minWidth: 0, background: "#fff", border: `1px solid ${theme.line}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ height: 60, flexShrink: 0, padding: "0 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${theme.softLine}`, gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <h2 style={{ margin: 0, fontFamily: SANS, fontSize: 16, fontWeight: 700, color: INK }}>Your answer</h2>
              {!isCefr ? <AutosavePill state={saveState} /> : null}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: SANS, fontSize: 13, color: "#8A8FA0", fontWeight: 500 }}>{lengthMet ? "Target reached" : `${wordsToTarget} words to target`}</div>
              <div style={{ position: "relative", width: 46, height: 46 }}>
                <svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="19" fill="none" stroke={theme.accentSoft} strokeWidth="4.5" /><circle cx="23" cy="23" r="19" fill="none" stroke={INDIGO} strokeWidth="4.5" strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={ringOffset} transform="rotate(-90 23 23)" style={{ transition: "stroke-dashoffset .35s ease" }} /></svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 13, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>{words}</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: "26px 30px", overflow: "auto", display: "flex", flexDirection: "column" }}>
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={() => {
                if (contentRef.current.trim() !== lastSavedRef.current.trim()) void persist();
              }}
              onPaste={onPasteFile}
              disabled={submitting || uploading}
              placeholder="Start writing your response here — or paste a photo / upload a PDF of your written answer."
              spellCheck={spellOn}
              style={{ flex: 1, width: "100%", maxWidth: 680, minHeight: 240, resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: SERIF, fontSize: 16.5, lineHeight: 1.85, color: "#272C3E" }}
            />
          </div>
          <div style={{ flexShrink: 0, minHeight: 48, padding: "0 22px", borderTop: `1px solid ${theme.softLine}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: theme.soft, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: SANS }}>
              <span style={{ fontSize: 13, color: "#767C90", fontVariantNumeric: "tabular-nums" }}><strong style={{ color: INK, fontWeight: 700 }}>{words}</strong> words</span>
              <span style={{ fontSize: 13, color: "#767C90", fontVariantNumeric: "tabular-nums" }}>{chars.toLocaleString()} characters</span>
              <span style={{ fontSize: 13, color: "#767C90" }}>{paragraphs} paragraph{paragraphs === 1 ? "" : "s"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void transcribeFile(f);
                  e.target.value = ""; // let the same file be re-picked
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || submitting}
                title="Upload a photo or PDF of your written answer — we'll transcribe it for you to review"
                style={{ display: "flex", alignItems: "center", gap: 7, height: 32, padding: "0 12px", border: `1px solid ${theme.line}`, background: "#fff", borderRadius: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#41496A", cursor: uploading || submitting ? "default" : "pointer", opacity: uploading || submitting ? 0.6 : 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E7388" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                {uploading ? "Reading…" : "Upload answer"}
              </button>
              <button type="button" onClick={() => setSpellOn((s) => !s)} aria-pressed={spellOn} style={{ display: "flex", alignItems: "center", gap: 7, height: 32, padding: "0 12px", border: `1px solid ${spellOn ? theme.accentLine : theme.line}`, background: spellOn ? theme.accentSoft : "#fff", borderRadius: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: spellOn ? INDIGO : "#41496A", cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={spellOn ? INDIGO : "#6E7388"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                Spelling check{spellOn ? " · on" : ""}
              </button>
            </div>
          </div>
        </main>

        {/* coach */}
        {tutorOpen ? (
          <aside className="lp-write-coach" style={{ width: 316, flexShrink: 0, background: "#fff", border: `1px solid ${theme.line}`, borderRadius: 14, display: "flex", overflow: "hidden" }}>
            <TutorPanel msgs={tutorMsgs} input={tutorInput} setInput={setTutorInput} pending={tutorPending} onSend={sendTutor} scrollRef={tutorScrollRef} unlockedSamples={hasGraded} onClose={() => setTutorOpen(false)} onAnimated={markTutorAnimated} theme={theme} />
          </aside>
        ) : null}

        {/* floating "ask coach" button — only when the coach is collapsed */}
        {!tutorOpen ? (
          <button
            type="button"
            onClick={() => setTutorOpen(true)}
            className="lp-fab lp-fab-ring"
            aria-label="Open writing coach"
            style={{ position: "absolute", right: 28, bottom: 28, zIndex: 7, display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 20px 12px 14px", borderRadius: 999, border: "none", background: INDIGO, color: "#fff", cursor: "pointer", fontFamily: SANS, fontWeight: 700, fontSize: 15, boxShadow: "0 14px 30px -12px rgba(59,67,181,.55)" }}
          >
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg>
            </span>
            Ask coach
          </button>
        ) : null}
      </div>

      {/* status footer */}
      <footer style={{ flexShrink: 0, minHeight: 46, background: "#fff", borderTop: `1px solid ${theme.line}`, display: "flex", alignItems: "center", gap: 10, padding: "8px 18px" }}>
        <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: message ? "#FBE9DD" : "#E5F3EA", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {message ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4M12 16h.01" /></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          )}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 13, color: "#5A6076" }}>
          {message ? <span style={{ color: "#c2410c" }}>{message}</span> : unchangedSinceGrade ? "Edit your response, then resubmit to see if it worked." : isCefr ? <><strong style={{ color: INK, fontWeight: 700 }}>Ready to grade.</strong> The AI estimates your CEFR level with feedback on Content, Communicative Achievement, Organisation and Language.</> : <><strong style={{ color: INK, fontWeight: 700 }}>Ready to grade.</strong> The AI marks every mistake and gives a band per criterion — Task, Coherence, Vocabulary, Grammar.</>}
        </span>
      </footer>
    </div>
  );
}

// ---- Tutor -----------------------------------------------------------------

function TutorPanel({
  msgs,
  input,
  setInput,
  pending,
  onSend,
  scrollRef,
  unlockedSamples,
  onClose,
  onAnimated,
  theme,
}: {
  msgs: TutorMsg[];
  input: string;
  setInput: (s: string) => void;
  pending: boolean;
  onSend: (raw?: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  unlockedSamples: boolean;
  onClose: () => void;
  onAnimated: (idx: number) => void;
  theme: StudioTheme;
}) {
  const INDIGO = theme.accent;
  const INK = theme.ink;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 16px", borderBottom: `1px solid ${theme.softLine}` }}>
        <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg>
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK }}>Writing coach</div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: "#8A8FA0" }}>{unlockedSamples ? "Samples unlocked · ask anything" : "Ideas & vocabulary · not answers"}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Collapse coach" title="Collapse coach" style={{ flexShrink: 0, width: 30, height: 30, border: "none", background: "transparent", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9A9EAE" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.length === 0 ? (
          <div style={{ background: theme.accentSoft, border: `1px solid ${theme.accentLine}`, borderRadius: 13, borderTopLeftRadius: 4, padding: "13px 14px", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, color: "#3A3F58" }}>
            Hey! I can help you understand the task, plan ideas, and find sharper vocabulary — but <strong style={{ color: INK }}>you</strong> write the answer.
          </div>
        ) : (
          msgs.map((m, i) => (
            <Bubble key={i} msg={m} onReveal={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })} onDone={() => onAnimated(i)} accent={theme.accent} />
          ))
        )}
        {pending ? (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <span style={{ display: "inline-flex", gap: 5, padding: "13px 14px", borderRadius: 12, borderTopLeftRadius: 3, background: "#F6F6FC", border: "1px solid #E6E7FB" }} aria-label="Coach is writing">
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: "#9A9EAE", animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out` }} />
              ))}
            </span>
          </div>
        ) : null}
      </div>
      <div style={{ flexShrink: 0, padding: "0 14px 8px", display: "flex", flexWrap: "wrap", gap: 7 }}>
        {TUTOR_CHIPS.map((c) => (
          <button key={c} type="button" onClick={() => onSend(c)} disabled={pending} style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: INDIGO, background: theme.accentSoft, border: `1px solid ${theme.accentLine}`, borderRadius: 999, padding: "6px 12px", cursor: pending ? "default" : "pointer" }}>{c}</button>
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: "12px 14px", borderTop: `1px solid ${theme.softLine}` }}>
        <form onSubmit={(e) => { e.preventDefault(); onSend(); }} style={{ display: "flex", alignItems: "center", gap: 8, background: theme.soft, border: `1px solid ${theme.line}`, borderRadius: 11, padding: "5px 6px 5px 13px" }} className="lp-field">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask in any language…" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: SANS, fontSize: 13.5, color: INK }} />
          <button type="submit" disabled={pending || !input.trim()} aria-label="Send" style={{ flexShrink: 0, width: 34, height: 34, border: "none", borderRadius: 9, background: INDIGO, cursor: pending || !input.trim() ? "default" : "pointer", opacity: pending || !input.trim() ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

/** Small "Autosaving / Saving… / Saved" pill in the answer card header. */
function AutosavePill({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "error") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 24, padding: "0 9px", borderRadius: 7, background: "#FBE9DD" }}>
        <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "#c2410c" }}>Save failed</span>
      </span>
    );
  }
  const label = state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Autosaving";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 24, padding: "0 9px", borderRadius: 7, background: "#E5F3EA" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: EMERALD }} />
      <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "#1F8A53" }}>{label}</span>
    </span>
  );
}

function Bubble({ msg, onReveal, onDone, accent }: { msg: TutorMsg; onReveal?: () => void; onDone?: () => void; accent: string }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "85%", padding: "11px 14px", borderRadius: 12, fontFamily: SANS, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", background: isUser ? accent : "#F6F6FC", color: isUser ? "#fff" : "#3a3d52", border: isUser ? "none" : "1px solid #E6E7FB", borderTopRightRadius: isUser ? 3 : 12, borderTopLeftRadius: isUser ? 12 : 3 }}>
        {isUser ? msg.content : <Typewriter text={msg.content} animate={!!msg.animate} onReveal={onReveal} onDone={onDone} caretColor="#9A9EAE" />}
      </div>
    </div>
  );
}

// ---- Timer + save badge ----------------------------------------------------

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds);
  const firedRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!firedRef.current) {
            firedRef.current = true;
            onExpire();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);
  const mm = Math.floor(left / 60);
  const ss = left % 60;
  const urgent = left <= 300;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontWeight: 600, color: urgent ? "#c2410c" : "#4b4e63" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a897c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{mm}:{String(ss).padStart(2, "0")}</span> left
    </span>
  );
}

// ---- Grading overlay -------------------------------------------------------

const GRADING_STEPS_IELTS = [
  "Reading your response, line by line…",
  "Checking grammar, vocabulary & cohesion…",
  "Weighing it against the official band descriptors…",
  "Comparing with calibrated band examples…",
  "Calibrating a fair, exam-accurate band…",
];
const GRADING_STEPS_CEFR = [
  "Reading your response, line by line…",
  "Checking range, accuracy & organisation…",
  "Mapping it to the CEFR can-do levels…",
  "Calibrating a fair, conservative level…",
];

/**
 * Full-screen modal shown every time the learner submits for grading. A calm,
 * on-brand "give us a moment to do this properly" cover — a spinning emblem, a
 * rotating line of what's happening, and an indeterminate bar — so the wait reads
 * as care (accuracy) rather than lag. Covers the editor so nothing can be edited
 * mid-grade. Mounts only while submitting, so its interval cleans up on its own.
 */
function GradingOverlay({ mode, theme }: { mode: StudioMode; theme: StudioTheme }) {
  const isCefr = mode === "cefr";
  const steps = isCefr ? GRADING_STEPS_CEFR : GRADING_STEPS_IELTS;
  const INDIGO = theme.accent;
  const INK = theme.ink;
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % steps.length), 2200);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <div
      role="alertdialog"
      aria-label={isCefr ? "Estimating your level" : "Grading your essay"}
      aria-live="polite"
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(20,22,40,.46)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      <div style={{ width: "min(424px, 94vw)", background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 40px 90px -30px rgba(20,22,40,.7)", animation: "lp-grade-in .4s cubic-bezier(.33,1,.68,1) both", "--grade-accent": theme.accent, "--ai-soft": theme.accentSoft, "--ai-strong": accentStrong(theme.accent) } as React.CSSProperties}>
        {/* animated brand header with the spinning emblem (accent-tinted for CEFR) */}
        <div className={isCefr ? "lp-ai-surface-accent" : "lp-ai-surface"} style={{ padding: "30px 26px 26px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: `1px solid ${theme.accentLine}` }}>
          <span style={{ position: "relative", width: 66, height: 66, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <span className="lp-grade-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%" }} aria-hidden />
            <span style={{ position: "absolute", inset: 7, borderRadius: "50%", background: "#fff", boxShadow: "inset 0 0 0 1px rgba(59,67,181,.12)" }} aria-hidden />
            <svg className="lp-ai-spark" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative" }}><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg>
          </span>
          <h2 style={{ margin: "18px 0 0", fontFamily: SANS, fontSize: 19, fontWeight: 800, color: INK, letterSpacing: "-.01em" }}>
            {isCefr ? "Estimating your level" : "Grading your essay"}
          </h2>
          <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, color: "#46496A", maxWidth: 320 }}>
            Hang tight — we read every line and weigh it against the {isCefr ? "CEFR can-do descriptors" : "official band descriptors"} so your result is as accurate as possible.
          </p>
        </div>

        {/* rotating status line + indeterminate progress */}
        <div style={{ padding: "20px 26px 24px" }}>
          <div style={{ minHeight: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span key={step} style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: INDIGO, textAlign: "center", animation: "lp-grade-cap .5s ease both" }}>
              {steps[step]}
            </span>
          </div>
          <div style={{ marginTop: 16, height: 6, borderRadius: 999, background: theme.accentSoft, overflow: "hidden" }}>
            <div className="lp-grade-bar" style={{ height: "100%", width: "100%", borderRadius: 999 }} />
          </div>
          <p style={{ margin: "14px 0 0", fontFamily: SANS, fontSize: 12, color: "#9094A8", textAlign: "center" }}>
            This usually takes about 20–30 seconds. Please don&rsquo;t close this tab.
          </p>
        </div>
      </div>
    </div>
  );
}

function SaveBadge({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const text = state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Save failed" : "";
  if (!text) return null;
  const ok = state === "saved";
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontWeight: 600, fontSize: 14, color: state === "error" ? "#c2410c" : ok ? EMERALD : "#9a998c" }}>
      {ok ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : null}
      {text}
    </span>
  );
}
