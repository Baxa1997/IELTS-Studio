"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, FileText, GraduationCap, Loader2, Mail, PenLine, Upload, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BODY,
  BRAND,
  BRAND_FILL,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  FAINT,
  FIELD,
  INK,
  LINE,
  MUTED,
  PANEL,
  RADIUS,
  SANS,
  STRONG,
  WELL,
  WHITE,
  ghostButton,
  solidButton,
} from "@/app/_landing/_lib/design";
import { useT } from "@/shared/components/i18n/locale-provider";
import { FigureView } from "@/shared/components/writing/figure";
import type { EssayTaskType } from "@/lib/ai/schema";
import type { MessageKey } from "@/lib/i18n";
import {
  CEFR_MAX_WORDS,
  CEFR_MIN_WORDS,
  CEFR_SAMPLES,
  CEFR_TASKS,
  cefrSamplesFor,
  cefrTask,
  type CefrTaskId,
  type CefrWritingGrade,
} from "@/lib/public-grader/cefr";
import { countWords, getPublicPrompt, MAX_WORDS, MIN_WORDS, promptsFor } from "@/lib/public-grader/prompts";
import type { PublicTeaser } from "@/lib/public-grader/teaser";
import { BAR_BG, RED, TINT } from "@/lib/theme/tokens";
import { WRITING_TASK } from "@/lib/writing/exam-tasks";

import { gradeErrorMessage, transcribeErrorMessage } from "../_lib/messages";
import { CefrResult } from "./cefr-result";
import { IeltsResult } from "./ielts-result";
import { SignupWall } from "./signup-wall";

/** The serif the question and the answer are set in — loaded by ../layout. */
const SERIF = "var(--font-newsreader), Georgia, serif";

const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

// Free anonymous gradings before the sign-up wall. Mirrors the server's per-IP cap
// (PUBLIC_GRADER_PER_IP, default 3) so the UI blocks at the same point the API does.
// ONE count across the three tabs, because the server's is one count too.
const FREE_LIMIT = 3;
const USED_KEY = "eng_public_grade_used";

type Tab = "task1" | "task2" | "cefr";
type Task1Module = "task1_academic" | "task1_general";

/**
 * The three tabs, in the order the owner named them (2026-10-14): Writing
 * Task 1, Writing Task 2, CEFR Writing.
 */
const TABS: { id: Tab; labelKey: MessageKey; icon: React.ReactNode }[] = [
  { id: "task1", labelKey: "grade.tabTask1", icon: <BarChart3 size={18} strokeWidth={2} /> },
  { id: "task2", labelKey: "grade.tabTask2", icon: <PenLine size={18} strokeWidth={2} /> },
  { id: "cefr", labelKey: "grade.tabCefr", icon: <GraduationCap size={18} strokeWidth={2} /> },
];

/**
 * What a visit opens on. TASK 2, although it is the middle tab: every link to
 * /grade was written when the checker graded Task 2 alone, and "paste your
 * essay" is what most visitors arrive to do. Change this one constant to open on
 * the first tab instead.
 */
const DEFAULT_TAB: Tab = "task2";

const MODULES: { id: Task1Module; labelKey: MessageKey; icon: React.ReactNode }[] = [
  { id: "task1_academic", labelKey: "grade.academic", icon: <BarChart3 size={15} strokeWidth={2} /> },
  { id: "task1_general", labelKey: "grade.general", icon: <Mail size={15} strokeWidth={2} /> },
];

const PLACEHOLDER: Record<EssayTaskType | "cefr", MessageKey> = {
  task1_academic: "grade.phTask1Academic",
  task1_general: "grade.phTask1General",
  task2: "grade.phTask2",
  cefr: "grade.phCefr",
};

/** One tab's work in progress. Each tab keeps its own, so trying another tab
 *  never throws away what was written in this one. */
interface Draft {
  question: string;
  /** A sample question chosen instead of the visitor's own. */
  sampleId: string | null;
  answer: string;
}

const EMPTY: Draft = { question: "", sampleId: null, answer: "" };

type Result =
  | { kind: "ielts"; teaser: PublicTeaser }
  | { kind: "cefr"; grade: CefrWritingGrade; task: CefrTaskId };

export function PublicGrader() {
  const t = useT();
  const [tab, setTab] = useState<Tab>(DEFAULT_TAB);
  const [module, setModule] = useState<Task1Module>("task1_academic");
  const [cefrId, setCefrId] = useState<CefrTaskId>("1.1");
  const [drafts, setDrafts] = useState<Record<Tab, Draft>>({ task1: EMPTY, task2: EMPTY, cefr: EMPTY });
  const [grading, setGrading] = useState(false);
  const [reading, setReading] = useState(false); // photo/PDF → text in flight
  /* ⚠️ PER TAB, LIKE THE DRAFTS. A grade takes up to a minute and the reader
     can change tab meanwhile; one shared `result` put a Task 2 band under the
     CEFR tab when it landed. Each answer comes back to the tab it was asked on. */
  const [results, setResults] = useState<Partial<Record<Tab, Result>>>({});
  const [errors, setErrors] = useState<Partial<Record<Tab, string>>>({});
  const [used, setUsed] = useState(0); // successful free gradings so far
  const [showWall, setShowWall] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  /** The tab whose new result should be scrolled to once it is on screen. */
  const scrollTo = useRef<Tab | null>(null);

  // Restore the free-grading count so a refresh doesn't reset the limit.
  useEffect(() => {
    try {
      const n = Number(localStorage.getItem(USED_KEY) || "0");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate of the free-grading count from localStorage (unavailable during SSR)
      if (Number.isFinite(n) && n > 0) setUsed(n);
    } catch {
      /* localStorage unavailable — fall back to in-session counting */
    }
  }, []);

  const result = results[tab] ?? null;
  const error = errors[tab] ?? null;

  // When a result appears, bring it to the top of the viewport — the input card
  // it replaced was where the reader was looking. Only for a result that has
  // just arrived on the tab being looked at, never on a tab switch.
  useEffect(() => {
    if (scrollTo.current === tab && result) {
      scrollTo.current = null;
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result, tab]);

  const draft = drafts[tab];
  const isCefr = tab === "cefr";
  const ieltsType: EssayTaskType = tab === "task2" ? "task2" : module;
  const bounds = isCefr ? { min: CEFR_MIN_WORDS, max: CEFR_MAX_WORDS } : { min: MIN_WORDS, max: MAX_WORDS };
  const words = useMemo(() => countWords(draft.answer), [draft.answer]);
  const tooShort = words > 0 && words < bounds.min;
  const tooLong = words > bounds.max;
  const canGrade = !grading && !reading && words >= bounds.min && !tooLong;
  const atLimit = used >= FREE_LIMIT;
  const gradesLeft = Math.max(0, FREE_LIMIT - used);

  const samples = isCefr ? cefrSamplesFor(cefrId) : promptsFor(ieltsType);
  const ieltsSample = !isCefr && draft.sampleId ? getPublicPrompt(draft.sampleId) : undefined;
  const cefrSample = isCefr && draft.sampleId ? CEFR_SAMPLES.find((s) => s.id === draft.sampleId) : undefined;
  const sampleText = ieltsSample?.prompt ?? cefrSample?.prompt ?? null;
  const sampleTitle = ieltsSample?.title ?? cefrSample?.title ?? "";

  const patch = useCallback(
    (p: Partial<Draft>, which: Tab = tab) => setDrafts((d) => ({ ...d, [which]: { ...d[which], ...p } })),
    [tab],
  );
  const setError = (which: Tab, message: string | null) =>
    setErrors((e) => ({ ...e, [which]: message ?? undefined }));

  function selectTab(next: Tab) {
    setTab(next);
  }

  /* ⚠️ A SAMPLE BELONGS TO ONE MODULE / ONE CEFR TASK. Switching drops it, or
     an Academic sample's chart would sit above a General Training letter — the
     server would still grade it as Academic (a sample's own type wins, see
     lib/public-grader/prompts), so the page and the grade would disagree. */
  function selectModule(next: Task1Module) {
    setModule(next);
    patch({ sampleId: null }, "task1");
  }
  function selectCefrTask(next: CefrTaskId) {
    setCefrId(next);
    patch({ sampleId: null }, "cefr");
  }

  /** Arrow keys move between the tabs, as a tablist should. */
  function onTabKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = TABS.findIndex((x) => x.id === tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].id;
    selectTab(next);
    tabRefs.current[next]?.focus();
  }

  const bumpUsed = useCallback(() => {
    setUsed((u) => {
      const next = u + 1;
      try {
        localStorage.setItem(USED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  async function grade() {
    if (atLimit) {
      setShowWall(true);
      return;
    }
    // The tab and the CEFR task this grade is for, fixed now: the reader can
    // switch either while the request is out, and the result must land on the
    // tab it was asked on and name what was graded.
    const into = tab;
    const task = cefrId;
    const own = draft.question.trim() || undefined;
    setGrading(true);
    setError(into, null);
    try {
      const res = isCefr
        ? await postJson("/api/public/grade/cefr", {
            task,
            ...(draft.sampleId ? { sampleId: draft.sampleId } : { customTask: own }),
            answer: draft.answer,
          })
        : await postJson("/api/public/grade", {
            taskType: ieltsType,
            ...(draft.sampleId ? { promptId: draft.sampleId } : { customPrompt: own }),
            essay: draft.answer,
          });
      const body = (await res.json().catch(() => ({}))) as {
        teaser?: PublicTeaser;
        grade?: CefrWritingGrade;
        error?: string;
      };
      if (res.ok && (isCefr ? body.grade : body.teaser)) {
        const next: Result = isCefr
          ? { kind: "cefr", grade: body.grade as CefrWritingGrade, task }
          : { kind: "ielts", teaser: body.teaser as PublicTeaser };
        scrollTo.current = into;
        setResults((r) => ({ ...r, [into]: next }));
        bumpUsed();
        return;
      }
      // The server enforces the cap too — a rate limit means the free grades are spent.
      if (body.error === "rate_limited") {
        setUsed(FREE_LIMIT);
        setShowWall(true);
        return;
      }
      setError(into, gradeErrorMessage(t, res.status, body.error, bounds));
    } catch {
      setError(into, t("grade.errNetwork"));
    } finally {
      setGrading(false);
    }
  }

  // Back to a blank answer on the same tab and question — unless the free
  // grades are spent, in which case the sign-up wall opens instead.
  function gradeAnother() {
    if (atLimit) {
      setShowWall(true);
      return;
    }
    patch({ answer: "" });
    setResults((r) => ({ ...r, [tab]: undefined }));
    setError(tab, null);
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function transcribe(file: File) {
    // The tab the file was picked on, so the text lands there even if the
    // reader moves on while it is being read.
    const into = tab;
    if (file.size > MAX_FILE_BYTES) {
      setError(into, t("grade.errFileSize"));
      return;
    }
    setReading(true);
    setError(into, null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/public/transcribe", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (res.ok && body.text) patch({ answer: body.text }, into);
      else setError(into, transcribeErrorMessage(t, body.error));
    } catch {
      setError(into, t("grade.errNetwork"));
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = ""; // allow re-picking the same file
    }
  }

  const aim = isCefr
    ? t("grade.aimCefr", { lo: cefrTask(cefrId).words[0], hi: cefrTask(cefrId).words[1], level: cefrTask(cefrId).level })
    : t("grade.aim", { n: WRITING_TASK[ieltsType].minWords, m: WRITING_TASK[ieltsType].minutes });

  return (
    <div ref={rootRef} style={{ fontFamily: SANS, scrollMarginTop: 96 }}>
      {/* ---- the three tabs ---- */}
      <div
        role="tablist"
        aria-label={t("grade.tabsLabel")}
        onKeyDown={onTabKey}
        style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}
      >
        {TABS.map((tb) => {
          const on = tab === tb.id;
          const sub =
            tb.id === "task1"
              ? t("grade.tabTask1Sub", { n: WRITING_TASK.task1_academic.minWords })
              : tb.id === "task2"
                ? t("grade.tabTask2Sub", { n: WRITING_TASK.task2.minWords })
                : t("grade.tabCefrSub");
          return (
            <button
              key={tb.id}
              ref={(el) => {
                tabRefs.current[tb.id] = el;
              }}
              type="button"
              role="tab"
              id={`gr-tab-${tb.id}`}
              aria-selected={on}
              aria-controls="gr-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => selectTab(tb.id)}
              className="gr-tab"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                textAlign: "left",
                cursor: "pointer",
                background: PANEL,
                color: INK,
                border: `1px solid ${on ? BRAND : LINE}`,
                borderRadius: 18,
                boxShadow: on ? `0 0 0 3px ${BRAND_TINT}` : "none",
                fontFamily: SANS,
                minWidth: 0,
              }}
            >
              <span
                aria-hidden
                className="gr-tab-icon"
                style={{
                  width: 38,
                  height: 38,
                  flex: "none",
                  borderRadius: RADIUS.icon,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: on ? BRAND_FILL : BRAND_TINT,
                  color: on ? WHITE : BRAND,
                }}
              >
                {tb.icon}
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span
                  className="gr-tab-label"
                  style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16.5, letterSpacing: "-0.01em", color: on ? BRAND : INK }}
                >
                  {t(tb.labelKey)}
                </span>
                <span className="gr-tab-sub" style={{ fontSize: 13, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {sub}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div id="gr-panel" role="tabpanel" aria-labelledby={`gr-tab-${tab}`} style={{ marginTop: 16 }}>
        {result ? (
          <ResultView result={result} onAgain={gradeAnother} atLimit={atLimit} gradesLeft={gradesLeft} />
        ) : (
          <>
            <section
              style={{
                background: PANEL,
                border: `1px solid ${LINE}`,
                borderRadius: RADIUS.card,
                boxShadow: "0 30px 60px -44px rgba(18,19,23,.35)",
              }}
            >
              {/* ---- toolbar: which Task 1 / which CEFR task, and the target ---- */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: `1px solid ${LINE}`,
                  background: WELL,
                  borderRadius: `${RADIUS.card}px ${RADIUS.card}px 0 0`,
                }}
              >
                {tab === "task1" ? (
                  <Segmented
                    label={t("grade.module")}
                    value={module}
                    onChange={selectModule}
                    options={MODULES.map((m) => ({ id: m.id, label: t(m.labelKey), icon: m.icon }))}
                  />
                ) : tab === "cefr" ? (
                  <Segmented
                    label={t("grade.cefrTaskLabel")}
                    value={cefrId}
                    onChange={selectCefrTask}
                    options={CEFR_TASKS.map((c) => ({ id: c.id, label: `${c.id} · ${c.title}` }))}
                  />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 600, color: BODY }}>{t("grade.task2Both")}</span>
                )}
                <span style={{ fontSize: 13.5, fontWeight: 600, color: MUTED }}>{aim}</span>
              </div>

              <div className="gr-cols">
                {/* ---- the question ---- */}
                <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <PanelHead icon={<FileText size={17} strokeWidth={2} />} title={t("grade.question")} badge={t("grade.optional")} />

                  {sampleText ? (
                    <div style={{ background: WELL, border: `1px solid ${LINE}`, borderRadius: 16, padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BRAND }}>
                          {t("grade.sampleLabel")} · {sampleTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() => patch({ sampleId: null })}
                          className="gr-pill"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            height: 30,
                            padding: "0 11px",
                            borderRadius: RADIUS.pill,
                            border: `1px solid ${FIELD}`,
                            background: PANEL,
                            color: STRONG,
                            fontFamily: SANS,
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <X size={13} strokeWidth={2.4} aria-hidden />
                          {t("grade.useOwn")}
                        </button>
                      </div>
                      <p style={{ margin: "10px 0 0", fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.6, color: INK, whiteSpace: "pre-wrap" }}>
                        {sampleText}
                      </p>
                      {ieltsSample?.figure ? (
                        <div style={{ marginTop: 12, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 12 }}>
                          <FigureView figure={ieltsSample.figure} />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={draft.question}
                        onChange={(e) => patch({ question: e.target.value })}
                        rows={6}
                        placeholder={t(PLACEHOLDER[isCefr ? "cefr" : ieltsType])}
                        aria-label={t("grade.question")}
                        className="gr-field"
                        style={{
                          display: "block",
                          width: "100%",
                          minHeight: 150,
                          resize: "vertical",
                          borderRadius: RADIUS.field,
                          border: `1px solid ${FIELD}`,
                          background: PANEL,
                          padding: "12px 14px",
                          fontFamily: SERIF,
                          fontSize: 15.5,
                          lineHeight: 1.6,
                          color: INK,
                        }}
                      />
                      {ieltsType === "task1_academic" && !isCefr ? (
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: MUTED }}>{t("grade.noChart")}</p>
                      ) : null}
                    </>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13, color: MUTED, marginRight: 2 }}>{t("grade.trySample")}</span>
                    {samples.map((s) => {
                      const on = s.id === draft.sampleId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => patch({ sampleId: s.id })}
                          className="gr-chip"
                          style={{
                            height: 32,
                            padding: "0 13px",
                            borderRadius: RADIUS.pill,
                            border: `1px solid ${on ? BRAND : FIELD}`,
                            background: on ? BRAND_TINT : PANEL,
                            color: on ? BRAND : STRONG,
                            fontFamily: SANS,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {s.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ---- the answer ---- */}
                <div className="gr-answer-wrap" style={{ padding: "18px 20px 6px", display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <PanelHead
                    icon={<PenLine size={17} strokeWidth={2} />}
                    title={t("grade.yourAnswer")}
                    right={
                      <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: tooLong ? RED : tooShort ? TINT.amber.fg : MUTED }}>
                        {words === 1 ? t("grade.oneWord") : t("grade.words", { n: words })}
                        {tooShort ? ` · ${t("grade.minHint", { n: bounds.min })}` : tooLong ? ` · ${t("grade.maxHint", { n: bounds.max })}` : ""}
                      </span>
                    }
                  />
                  <textarea
                    value={draft.answer}
                    onChange={(e) => patch({ answer: e.target.value })}
                    rows={14}
                    placeholder={t("grade.phAnswer")}
                    aria-label={t("grade.yourAnswer")}
                    className="gr-answer"
                    style={{
                      display: "block",
                      width: "100%",
                      flex: 1,
                      minHeight: 320,
                      resize: "vertical",
                      border: "none",
                      background: "transparent",
                      padding: "12px 0",
                      fontFamily: SERIF,
                      fontSize: 17,
                      lineHeight: 1.85,
                      color: INK,
                    }}
                  />
                </div>
              </div>

              {/* ---- the action bar, sticky so it stays in reach on a long answer ---- */}
              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 5,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderTop: `1px solid ${LINE}`,
                  background: BAR_BG,
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  borderRadius: `0 0 ${RADIUS.card}px ${RADIUS.card}px`,
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void transcribe(f);
                  }}
                />
                <button
                  type="button"
                  disabled={reading || grading}
                  onClick={() => fileRef.current?.click()}
                  className="lp-ghost"
                  style={{
                    ...ghostButton(),
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "11px 18px",
                    fontSize: 14,
                    opacity: reading ? 0.65 : 1,
                    cursor: reading || grading ? "default" : "pointer",
                  }}
                >
                  {reading ? (
                    <Loader2 size={16} strokeWidth={2.4} className="animate-spin" aria-hidden />
                  ) : (
                    <Upload size={16} strokeWidth={2.2} aria-hidden />
                  )}
                  {reading ? t("grade.readingFile") : t("grade.upload")}
                </button>
                {grading ? (
                  <span style={{ fontSize: 13, color: MUTED, flex: "1 1 200px", minWidth: 0 }}>{t("grade.gradingNote")}</span>
                ) : (
                  <span style={{ flex: "1 1 0", minWidth: 0 }} />
                )}
                <button
                  type="button"
                  disabled={!canGrade}
                  onClick={grade}
                  className={canGrade ? "lp-solid" : undefined}
                  style={{
                    ...solidButton("md"),
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "13px 28px",
                    cursor: canGrade ? "pointer" : "default",
                    opacity: canGrade || grading ? 1 : 0.45,
                  }}
                >
                  {grading ? <Loader2 size={17} strokeWidth={2.4} className="animate-spin" aria-hidden /> : null}
                  {grading ? t("grade.grading") : t("grade.submit")}
                </button>
              </div>
            </section>

            {error ? (
              <p role="alert" style={{ margin: "12px 2px 0", fontSize: 14, fontWeight: 600, color: RED }}>
                {error}
              </p>
            ) : null}

            <p style={{ margin: "12px 2px 0", fontSize: 13, color: MUTED }}>
              {gradesLeft > 0 ? t("grade.freeLeft", { n: gradesLeft, total: FREE_LIMIT }) : t("grade.freeNone")}
              {gradesLeft > 0 ? null : (
                <>
                  {" "}
                  <Link href="/sign-in" className="gr-link" style={{ color: BRAND, fontWeight: 700, textDecoration: "none" }}>
                    {t("free.moreCta")} →
                  </Link>
                </>
              )}
            </p>
          </>
        )}
      </div>

      {showWall ? <SignupWall onClose={() => setShowWall(false)} /> : null}
    </div>
  );
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

/** A small radio group — the Task 1 module, or the CEFR task. */
function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className="gr-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 34,
              padding: "0 14px",
              borderRadius: RADIUS.pill,
              border: `1px solid ${on ? BRAND : FIELD}`,
              background: on ? BRAND_TINT : PANEL,
              color: on ? BRAND : STRONG,
              fontFamily: SANS,
              fontSize: 13.5,
              fontWeight: on ? 700 : 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {o.icon ? (
              <span aria-hidden style={{ display: "inline-flex" }}>
                {o.icon}
              </span>
            ) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PanelHead({ icon, title, badge, right }: { icon: React.ReactNode; title: string; badge?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: BRAND_TINT,
            color: BRAND,
            flex: "none",
          }}
        >
          {icon}
        </span>
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em", color: INK }}>{title}</span>
        {badge ? (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: FAINT,
              border: `1px solid ${LINE}`,
              padding: "1px 8px",
              borderRadius: RADIUS.pill,
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function ResultView({
  result,
  onAgain,
  atLimit,
  gradesLeft,
}: {
  result: Result;
  onAgain: () => void;
  atLimit: boolean;
  gradesLeft: number;
}) {
  const t = useT();
  const left = atLimit ? t("grade.leftNone") : gradesLeft === 1 ? t("grade.leftOne") : t("grade.leftN", { n: gradesLeft });
  // What the IELTS grade was marked AS — the server's word, not the tab's: a
  // sample's own task type wins over the tab it was sent from.
  const gradedAs = result.kind === "ielts" ? (WRITING_TASK[result.teaser.taskType] as (typeof WRITING_TASK)[string] | undefined) : undefined;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={onAgain}
            className="lp-ghost"
            style={{ ...ghostButton(), display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", fontSize: 14 }}
          >
            <ArrowLeft size={16} strokeWidth={2.2} aria-hidden />
            {t("grade.again")}
          </button>
          {gradedAs ? (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: BRAND,
                background: BRAND_TINT,
                border: `1px solid ${BRAND_TINT_LINE}`,
                padding: "5px 12px",
                borderRadius: RADIUS.pill,
              }}
            >
              {t("grade.gradedAs", { task: gradedAs.kind })}
            </span>
          ) : null}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: atLimit ? RED : MUTED }}>{left}</span>
      </div>

      {result.kind === "ielts" ? <IeltsResult teaser={result.teaser} /> : <CefrResult grade={result.grade} task={result.task} />}

      {/* ---- the deeper coaching loop stays behind an account ---- */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "18px 20px",
          borderRadius: 20,
          background: BRAND_TINT,
          border: `1px solid ${BRAND_TINT_LINE}`,
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: 17, color: INK }}>{t("grade.deeperTitle")}</p>
          <p style={{ margin: "5px 0 0", fontSize: 14.5, lineHeight: 1.55, color: BODY }}>{t("grade.deeperBody")}</p>
        </div>
        <Link href="/sign-in" className="lp-solid" style={{ ...solidButton("md"), textDecoration: "none", whiteSpace: "nowrap" }}>
          {t("free.moreCta")}
        </Link>
      </section>
    </div>
  );
}
