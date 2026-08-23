"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Eraser,
  FileText,
  Highlighter,
  History,
  Layers,
  ListChecks,
  ListOrdered,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  PanelRightClose,
  PenLine,
  Send,
  Sparkles,
  SquarePen,
  X,
} from "lucide-react";

import { Typewriter } from "@/components/typewriter";
import { AiGenerateSection, AiGenerateButton } from "@/components/ai-generate-section";
import { UpgradeNotice } from "@/components/billing/upgrade-notice";
import { Timer } from "@/components/exam/timer";
import { engineClient } from "@/lib/engine/client";
import { WordLookup } from "@/app/(studio)/read/_shared/word-lookup";

/** Every engine call on this screen goes to the engine's `multilevel` namespace. */
const callEngine = engineClient("multilevel");

/**
 * Multilevel (DTM) runner. Generation + grading live on the AI engine; the browser
 * calls them directly (with the user's Supabase token) so the ~30–60s generation
 * runs off Vercel's serverless cap. Generate returns an answer-STRIPPED render view
 * + an item id; we collect answers and grade by id (answers never leave the server
 * until grading). One client, two papers: Reading (5 parts / 35 Q, deterministic
 * grade) and Writing (3 tasks, LLM rubric).
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const TINT = "#F4F4FE";
const TINT_BORDER = "#D8DAF3";
const GOOD = "#15803d";
const BAD = "#b91c1c";

// ---- "Reading B" design tokens (Claude Design project) ---------------------
const JAKARTA = "'Plus Jakarta Sans', var(--font-hanken), system-ui, sans-serif";
const PLEX = "'IBM Plex Serif', var(--font-newsreader), Georgia, serif";
const D_DARK = "#0f172a"; // header
const D_VIOLET = "#7c3aed"; // accent
const D_VTEXT = "#5b21b6"; // input text
const D_VTINT = "#f3e8ff"; // chips / badges
const D_VTINT2 = "#faf5ff"; // gap + instruction fill
const D_VBORDER = "#c4b5fd"; // gap underline
const D_VBORDER2 = "#ede9ff"; // instruction border
const D_PAGE = "#f8fafc"; // canvas
const D_LINE = "#e2e8f0"; // hairlines
const D_SLATE = "#64748b";
const D_SLATE2 = "#94a3b8";
const D_SLATE3 = "#334155";
const D_INK = "#1e293b"; // body text

// ---- Engine call -----------------------------------------------------------

// ---- Types (mirror the engine render views) --------------------------------

type Options = Record<string, string>;
type P1 = { part: 1; cefr: string; instruction: string; title: string; text_with_gaps: string };
type P2 = {
  part: 2;
  cefr: string;
  instruction: string;
  theme: string;
  texts: { letter: string; title: string; body: string }[];
  statements: { number: number; text: string }[];
};
type P3 = {
  part: 3;
  cefr: string;
  instruction: string;
  headings: Options;
  paragraphs: { number: number; question: number; text: string }[];
};
type P4 = {
  part: 4;
  cefr: string;
  title: string;
  text: string;
  instruction_mcq: string;
  instruction_tfn: string;
  mcq: { number: number; stem: string; options: Options }[];
  tfn: { number: number; statement: string }[];
};
type P5 = {
  part: 5;
  cefr: string;
  title: string;
  text: string;
  instruction_gap: string;
  instruction_mcq: string;
  gaps: { number: number; sentence: string }[];
  mcq: { number: number; stem: string; options: Options }[];
};
type ReadingPart = P1 | P2 | P3 | P4 | P5;
type ReadingPaper = { id: string; paper: "reading"; parts: ReadingPart[] };

type QResult = {
  number: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  evidence: string;
};
type ReadingGrade = {
  score: number;
  max_score: number;
  parts: { part: number; results: QResult[] }[];
  /** Conservative indicative CEFR from the raw score — only sent for a full-length paper. */
  indicative_cefr?: string | null;
};

type WritingTask = {
  task: string;
  cefr: string;
  register: string;
  target_words: number;
  word_range: [number, number];
  prompt: string;
  required_content_points: string[];
  situation?: string;
  problem?: string;
  question?: string;
  forum_context?: string;
};
type WritingPaper = { id: string; paper: "writing"; tasks: WritingTask[] };
type WritingGrade = {
  task_id: string;
  gradable: boolean;
  message?: string;
  cefr?: string;
  model_answer?: string;
  word_count?: number;
  in_range?: boolean;
  scores?: {
    task_achievement: number;
    coherence: number;
    lexical: number;
    grammar: number;
    register: number;
  };
  overall_0_100?: number;
  estimated_cefr?: string;
  strengths?: string[];
  improvements?: string[];
  corrected_sentences?: { original: string; improved: string }[];
  examiner_comment?: string;
};

// ---- Top-level -------------------------------------------------------------

type Tab = "reading" | "writing";
type ReadingReq = { scope: "full" } | { scope: "part"; part: number };
type WritingReq = { scope: "full" } | { scope: "task"; task: string };
type ReadingItem = { id: string; scope: string; created_at: string; parts: number[] };
/** How this reading run was started — drives the timer allowance: "full" = the
 *  whole 5-part paper (60 min, like the real DTM exam), "part" = one part on its
 *  own (a 20-minute focused session). */
type ReadingMode = "full" | "part";
type View =
  | { kind: "reading"; paper: ReadingPaper; req: ReadingReq; mode: ReadingMode }
  | { kind: "writing"; paper: WritingPaper; req: WritingReq };

export function MultilevelClient() {
  const [tab, setTab] = useState<Tab>("reading");
  const [view, setView] = useState<View | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // the card key currently generating
  const [error, setError] = useState<string | null>(null);

  async function startReading(req: ReadingReq, key: string, mode: ReadingMode) {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      const paper = await callEngine<ReadingPaper>("reading/generate", req);
      setView({ kind: "reading", paper, req, mode });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(null);
    }
  }

  async function startWriting(req: WritingReq, key: string) {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      const paper = await callEngine<WritingPaper>("writing/generate", req);
      setView({ kind: "writing", paper, req });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(null);
    }
  }

  // Re-open a previously generated paper (no regeneration) via the render endpoint.
  async function openReadingItem(item: ReadingItem) {
    if (busy) return;
    setBusy(`item-${item.id}`);
    setError(null);
    try {
      const paper = await callEngine<ReadingPaper>("reading/render", { item_id: item.id });
      const req: ReadingReq =
        item.scope === "part" && item.parts[0]
          ? { scope: "part", part: item.parts[0] }
          : { scope: "full" };
      setView({ kind: "reading", paper, req, mode: req.scope === "part" ? "part" : "full" });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t reopen this paper.");
    } finally {
      setBusy(null);
    }
  }

  if (view?.kind === "reading") {
    return (
      <ReadingRunner
        key={view.paper.id}
        paper={view.paper}
        mode={view.mode}
        regenBusy={!!busy}
        onNew={() => void startReading(view.req, "new", view.mode)}
        onExit={() => setView(null)}
      />
    );
  }
  if (view?.kind === "writing") {
    return (
      <WritingRunner
        key={view.paper.id}
        paper={view.paper}
        regenBusy={!!busy}
        onNew={() => void startWriting(view.req, "new")}
        onExit={() => setView(null)}
      />
    );
  }

  return (
    <Hub
      tab={tab}
      onTab={setTab}
      busy={busy}
      error={error}
      onReading={(req, key, mode) => void startReading(req, key, mode)}
      onWriting={(req, key) => void startWriting(req, key)}
      onOpenItem={(item) => void openReadingItem(item)}
    />
  );
}

// ---- Hub (tabbed, full-width landing) --------------------------------------

const READING_PARTS = [
  {
    part: 1,
    title: "Sentence gap-fill",
    desc: "Type the missing words to complete a short text.",
    level: "B1",
    count: 6,
    Icon: AlignLeft,
  },
  {
    part: 2,
    title: "Text matching",
    desc: "Match eight statements to ten short notices.",
    level: "B1–B2",
    count: 8,
    Icon: Layers,
  },
  {
    part: 3,
    title: "Heading matching",
    desc: "Choose the best heading for each paragraph.",
    level: "B2",
    count: 6,
    Icon: ListOrdered,
  },
  {
    part: 4,
    title: "Multiple choice + T/F/NI",
    desc: "An academic passage with MCQ and True / False / Not Given.",
    level: "B2–C1",
    count: 9,
    Icon: ListChecks,
  },
  {
    part: 5,
    title: "Summary + multiple choice",
    desc: "Fill the summary gaps, then answer multiple choice.",
    level: "C1",
    count: 6,
    Icon: FileText,
  },
];

const WRITING_TASKS_META = [
  {
    task: "1.1",
    title: "Informal message",
    desc: "A short note to a friend.",
    level: "B1",
    Icon: SquarePen,
  },
  {
    task: "1.2",
    title: "Formal letter",
    desc: "A letter to a manager or an official.",
    level: "B2",
    Icon: PenLine,
  },
  {
    task: "2",
    title: "Forum opinion post",
    desc: "An argued response to an online discussion.",
    level: "C1",
    Icon: FileText,
  },
];

function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Saved";
  }
}

function Hub({
  tab,
  onTab,
  busy,
  error,
  onReading,
  onWriting,
  onOpenItem,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  busy: string | null;
  error: string | null;
  onReading: (req: ReadingReq, key: string, mode: ReadingMode) => void;
  onWriting: (req: WritingReq, key: string) => void;
  onOpenItem: (item: ReadingItem) => void;
}) {
  const [recent, setRecent] = useState<ReadingItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Load the learner's recent reading papers so they can reopen one instead of
  // regenerating. Reloads whenever the hub remounts (i.e. after exiting a paper).
  useEffect(() => {
    let alive = true;
    callEngine<{ items: ReadingItem[] }>("reading/list", {})
      .then((r) => {
        if (alive) setRecent(r.items ?? []);
      })
      .catch(() => {
        /* history is non-essential — the hub still generates fresh */
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div
      className="lp-hub-pad"
      style={{ width: "100%", padding: "26px 24px 64px", fontFamily: SANS, color: INK }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(28px,3.6vw,38px)",
              lineHeight: 1.05,
              letterSpacing: "-.4px",
              margin: 0,
              color: INK,
            }}
          >
            CEFR practice
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: MUTED,
              margin: "6px 0 0",
              maxWidth: 660,
            }}
          >
            The Uzbekistan Multilevel (DTM) exam — a 5-part / 35-question Reading paper and a 3-task
            Writing paper, generated fresh and graded instantly.
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            background: TINT,
            border: `1px solid ${TINT_BORDER}`,
            color: INDIGO,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <Layers size={15} /> B1 → C1
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "#F1F1F8",
          border: "1px solid #ECEAF2",
          borderRadius: 14,
          padding: 5,
          marginTop: 22,
          maxWidth: 520,
        }}
      >
        <TabButton
          active={tab === "reading"}
          onClick={() => onTab("reading")}
          icon={<BookOpen size={17} />}
          label="Reading paper"
          sub="5 parts · 35 questions"
        />
        <TabButton
          active={tab === "writing"}
          onClick={() => onTab("writing")}
          icon={<PenLine size={17} />}
          label="Writing paper"
          sub="3 tasks · B1 → C1"
        />
      </div>

      {tab === "reading" ? (
        <>
          <div style={{ marginTop: 18, marginBottom: 28 }}>
            <AiGenerateSection
              title="AI Generate Reading"
              description="Generate the full 5-part DTM paper, or a single part on its own — fresh every time."
              cta={
                <AiGenerateButton
                  label="AI Generate Reading"
                  busyLabel="Writing your paper…"
                  generating={busy === "r-full"}
                  busy={!!busy}
                  minWidth={220}
                  onClick={() => setPickerOpen(true)}
                />
              }
            />
          </div>

          {pickerOpen ? (
            <ReadingGenerateModal
              onClose={() => setPickerOpen(false)}
              onFull={() => {
                setPickerOpen(false);
                onReading({ scope: "full" }, "r-full", "full");
              }}
              onPart={(part) => {
                setPickerOpen(false);
                onReading({ scope: "part", part }, `r-${part}`, "part");
              }}
            />
          ) : null}

          <SectionLabel>Practise a single part</SectionLabel>
          <Grid>
            {READING_PARTS.map((p) => (
              <PracticeCard
                key={p.part}
                Icon={p.Icon}
                eyebrow={`Part ${p.part}`}
                title={p.title}
                desc={p.desc}
                level={p.level}
                meta={`${p.count} questions`}
                loading={busy === `r-${p.part}`}
                disabled={!!busy}
                onClick={() => onReading({ scope: "part", part: p.part }, `r-${p.part}`, "part")}
              />
            ))}
          </Grid>

          {/* Recent papers load async from the engine AFTER the hub mounts, so they
              sit BELOW the static content — arriving late they append instead of
              pushing the practice grid down (the "content jump"). Compact rows, not
              cards: every entry says the same thing, so one line each is enough. */}
          {recent.length > 0 ? (
            <div style={{ marginTop: 28 }}>
              <SectionLabel>Your recent papers</SectionLabel>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid rgba(28,27,46,.09)",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(28,27,46,.04)",
                }}
              >
                {recent.map((it, i) => (
                  <RecentRow
                    key={it.id}
                    it={it}
                    first={i === 0}
                    loading={busy === `item-${it.id}`}
                    disabled={!!busy}
                    onOpen={() => onOpenItem(it)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div style={{ marginTop: 18, marginBottom: 28 }}>
            <AiGenerateSection
              title="Full writing paper"
              description="Three prompts at rising levels — an informal note (B1), a formal letter (B2) and a forum post (C1), graded on a calibrated CEFR rubric."
              cta={
                <AiGenerateButton
                  label="Generate full paper"
                  busyLabel="Writing your prompts…"
                  generating={busy === "w-full"}
                  busy={!!busy}
                  minWidth={200}
                  onClick={() => onWriting({ scope: "full" }, "w-full")}
                />
              }
            />
          </div>
          <SectionLabel>Or practise a single task</SectionLabel>
          <Grid>
            {WRITING_TASKS_META.map((t) => (
              <PracticeCard
                key={t.task}
                Icon={t.Icon}
                eyebrow={`Task ${t.task}`}
                title={t.title}
                desc={t.desc}
                level={t.level}
                meta="Graded · model answer"
                loading={busy === `w-${t.task}`}
                disabled={!!busy}
                onClick={() => onWriting({ scope: "task", task: t.task }, `w-${t.task}`)}
              />
            ))}
          </Grid>
        </>
      )}

      {error ? <UpgradeNotice message={error} /> : null}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: "#9A99A8" }}>
        Original content in the Uzbekistan Multilevel (DTM) format. Not affiliated with or endorsed
        by the State Testing Centre.
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: active ? "#fff" : "transparent",
        color: active ? INDIGO : MUTED,
        boxShadow: active ? "0 2px 8px -3px rgba(28,27,46,.28)" : "none",
        transition: "background .15s ease",
      }}
    >
      <span style={{ display: "flex", flex: "none", color: active ? INDIGO : "#8A899A" }}>
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontFamily: SANS, fontWeight: active ? 700 : 600, fontSize: 14.5 }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: active ? "#7C78C9" : "#9A99A8",
            marginTop: 2,
          }}
        >
          {sub}
        </span>
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>
        {children}
      </span>
      <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.1)" }} />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

/** One practice option — kept deliberately plain: icon + title + level up top, a
 *  single line of description, and a meta/Start footer. No eyebrow/serif layers. */
function PracticeCard({
  Icon,
  eyebrow,
  title,
  desc,
  level,
  meta,
  loading,
  disabled,
  onClick,
  cta = "Start",
  busyLabel = "Generating…",
}: {
  Icon: typeof BookOpen;
  eyebrow: string;
  title: string;
  desc: string;
  level: string;
  meta: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  cta?: string;
  busyLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="lp-hover"
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid rgba(28,27,46,.09)",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        textAlign: "left",
        fontFamily: SANS,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !loading ? 0.55 : 1,
        boxShadow: "0 1px 3px rgba(28,27,46,.04)",
        width: "100%",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#EFEEFC",
              color: INDIGO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Icon size={17} />
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: INK,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
        </span>
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 700,
            background: TINT,
            color: INDIGO,
            flex: "none",
          }}
        >
          {level}
        </span>
      </div>
      <span style={{ fontSize: 13, color: "#7A7989", lineHeight: 1.45 }}>{desc}</span>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          borderTop: "1px solid rgba(28,27,46,.07)",
          paddingTop: 10,
        }}
      >
        <span style={{ fontSize: 12.5, color: "#8A899A" }}>
          {eyebrow} · {meta}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: INDIGO,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={15} /> {busyLabel}
            </>
          ) : (
            <>
              {cta} <ArrowRight size={15} strokeWidth={2.2} />
            </>
          )}
        </span>
      </div>
    </button>
  );
}

/** A previously generated paper as a one-line row (reopen, no regeneration). */
function RecentRow({
  it,
  first,
  loading,
  disabled,
  onOpen,
}: {
  it: ReadingItem;
  first: boolean;
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const full = it.scope !== "part";
  const part = it.parts[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="lp-row"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "transparent",
        border: "none",
        borderTop: first ? "none" : "1px solid rgba(28,27,46,.07)",
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        fontFamily: SANS,
        opacity: disabled && !loading ? 0.6 : 1,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "#EFEEFC",
          color: INDIGO,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        {full ? <History size={16} /> : <FileText size={16} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 14.5,
            fontWeight: 600,
            color: INK,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {full ? "Full reading paper" : `Part ${part ?? ""} practice`}
        </span>
        <span style={{ display: "block", fontSize: 12.5, color: "#8A899A", marginTop: 1 }}>
          {full ? "35 questions" : "single part"} · {fmtWhen(it.created_at)}
        </span>
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: INDIGO,
          fontSize: 13.5,
          fontWeight: 600,
          flex: "none",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={14} /> Opening…
          </>
        ) : (
          <>
            Open <ArrowRight size={14} />
          </>
        )}
      </span>
    </button>
  );
}

// ---- Reading generate picker (Full CEFR reading / Single part) -------------

type ModalStep = "choose" | "passage";

/** Opened from the single "AI Generate Reading" CTA. Two choices only: the full
 *  5-part DTM paper, or a single-part practice — the latter drills into a second
 *  step to pick which of the 5 parts (same list as the standalone grid below it). */
function ReadingGenerateModal({
  onClose,
  onFull,
  onPart,
}: {
  onClose: () => void;
  onFull: () => void;
  onPart: (part: number) => void;
}) {
  const [step, setStep] = useState<ModalStep>("choose");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rd-gen-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(20,20,40,.5)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 20,
          padding: "26px 26px 22px",
          boxShadow: "0 40px 90px -40px rgba(20,20,48,.6)",
          fontFamily: SANS,
          color: INK,
        }}
      >
        {step === "choose" ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <h2
                  id="rd-gen-title"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: 22,
                    margin: 0,
                    color: INK,
                  }}
                >
                  AI Generate Reading
                </h2>
                <p style={{ fontSize: 14, color: MUTED, margin: "6px 0 0" }}>
                  Choose how you want to practise.
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" style={modalCloseBtn}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <ModalOption
                Icon={Layers}
                title="Full CEFR reading"
                desc="All 5 parts, 35 questions — the complete DTM paper, timed like the real exam."
                meta="60 min · 35 Qs"
                onClick={onFull}
              />
              <ModalOption
                Icon={FileText}
                title="Single part practice"
                desc="Pick one part on its own — a shorter, focused session with a 20-minute limit."
                meta="1 part · 20 min"
                onClick={() => setStep("passage")}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <button type="button" onClick={() => setStep("choose")} style={modalBackBtn}>
                  <ArrowLeft size={13} /> Back
                </button>
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: 22,
                    margin: "10px 0 0",
                    color: INK,
                  }}
                >
                  Choose a part
                </h2>
                <p style={{ fontSize: 14, color: MUTED, margin: "6px 0 0" }}>
                  Each part is a self-contained passage — pick one to practise.
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" style={modalCloseBtn}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
              {READING_PARTS.map((p) => (
                <ModalOption
                  key={p.part}
                  Icon={p.Icon}
                  title={`Part ${p.part} · ${p.title}`}
                  desc={p.desc}
                  meta={`${p.level} · ${p.count} questions`}
                  onClick={() => onPart(p.part)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModalOption({
  Icon,
  title,
  desc,
  meta,
  onClick,
}: {
  Icon: typeof BookOpen;
  title: string;
  desc: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lp-hover"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: "left",
        width: "100%",
        background: "#fff",
        border: "1px solid rgba(28,27,46,.09)",
        borderRadius: 14,
        padding: 14,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: "#EFEEFC",
          color: INDIGO,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={19} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{ display: "block", fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK }}
        >
          {title}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: SANS,
            fontSize: 13,
            color: "#7A7989",
            marginTop: 2,
            lineHeight: 1.45,
          }}
        >
          {desc}
        </span>
      </span>
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: FAINT, whiteSpace: "nowrap" }}>{meta}</span>
        <ArrowRight size={15} strokeWidth={2.2} color={INDIGO} />
      </span>
    </button>
  );
}

const modalCloseBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 9,
  border: "1px solid rgba(28,27,46,.09)",
  background: "#fff",
  color: MUTED,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};
const modalBackBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  background: "transparent",
  color: INDIGO,
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
};

// ---- Fullscreen ------------------------------------------------------------

// True OS fullscreen (browser Fullscreen API) for the exam surface — fullscreens
// the runner's own root so it fills the screen with no browser chrome, like the
// real test. Tracks state via fullscreenchange; webkit-prefixed fallback for Safari.
function useFullscreen(ref: React.RefObject<HTMLElement | null>) {
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const d = document as Document & { webkitFullscreenElement?: Element };
    const onChange = () => setIsFull(!!(document.fullscreenElement || d.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);
  const toggle = useCallback(() => {
    const el = ref.current as
      | (HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
      | null;
    const d = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const active = document.fullscreenElement || d.webkitFullscreenElement;
    if (!active)
      void (el?.requestFullscreen?.() ?? el?.webkitRequestFullscreen?.())?.catch?.(() => {});
    else void (document.exitFullscreen?.() ?? d.webkitExitFullscreen?.())?.catch?.(() => {});
  }, [ref]);
  return { isFull, toggle };
}

// ---- Text highlighter (marker) ---------------------------------------------

// A real-exam-style highlighter for the reading text: pick a transparent pen,
// drag across words to mark them. Painted with the CSS Custom Highlight API
// (CSS.highlights + ::highlight()) so nothing is written into React's DOM —
// highlights survive scrolling and can't desync the rendered passage. Stored as
// live Ranges; stale ones (after a re-render) are pruned on the next rebuild.
type PenColor = "yellow" | "green" | "pink" | "blue";
type MarkTool = PenColor | "eraser" | null;
const PEN_NAMES: Record<PenColor, string> = {
  yellow: "cefr-hl-yellow",
  green: "cefr-hl-green",
  pink: "cefr-hl-pink",
  blue: "cefr-hl-blue",
};
const PENS: { key: PenColor; label: string; solid: string }[] = [
  { key: "yellow", label: "Yellow", solid: "#fde047" },
  { key: "green", label: "Green", solid: "#86efac" },
  { key: "pink", label: "Pink", solid: "#f9a8d4" },
  { key: "blue", label: "Blue", solid: "#93c5fd" },
];

function rangesOverlap(a: Range, b: Range): boolean {
  try {
    return (
      a.compareBoundaryPoints(Range.START_TO_END, b) > 0 &&
      a.compareBoundaryPoints(Range.END_TO_START, b) < 0
    );
  } catch {
    return false;
  }
}

function useHighlighter(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [tool, setTool] = useState<MarkTool>(null);
  const [marks, setMarks] = useState(0);
  const storeRef = useRef<Map<PenColor, Range[]>>(new Map());

  const rebuild = useCallback(() => {
    const HL =
      typeof CSS !== "undefined"
        ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights
        : undefined;
    const HC =
      typeof window !== "undefined"
        ? (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight
        : undefined;
    if (!HL || !HC) return;
    let count = 0;
    (Object.keys(PEN_NAMES) as PenColor[]).forEach((c) => {
      const ranges = (storeRef.current.get(c) ?? []).filter(
        (r) => r.startContainer.isConnected && r.endContainer.isConnected,
      );
      storeRef.current.set(c, ranges);
      if (ranges.length) {
        HL.set(PEN_NAMES[c], new HC(...ranges));
        count += ranges.length;
      } else HL.delete(PEN_NAMES[c]);
    });
    setMarks(count);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!tool) return;
    const sel = window.getSelection();
    const container = containerRef.current;
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !container) return;
    const range = sel.getRangeAt(0);
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer))
      return;
    if (tool === "eraser") {
      (Object.keys(PEN_NAMES) as PenColor[]).forEach((c) => {
        storeRef.current.set(
          c,
          (storeRef.current.get(c) ?? []).filter((r) => !rangesOverlap(r, range)),
        );
      });
    } else {
      storeRef.current.set(tool, [...(storeRef.current.get(tool) ?? []), range.cloneRange()]);
    }
    sel.removeAllRanges();
    rebuild();
  }, [tool, containerRef, rebuild]);

  const clearAll = useCallback(() => {
    const HL =
      typeof CSS !== "undefined"
        ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights
        : undefined;
    storeRef.current.clear();
    if (HL) Object.values(PEN_NAMES).forEach((n) => HL.delete(n));
    setMarks(0);
  }, []);

  useEffect(() => clearAll, [clearAll]); // drop our highlights when the runner unmounts
  return { tool, setTool, onMouseUp, clearAll, marks };
}

function MarkerToolbar({
  tool,
  setTool,
  onClear,
  marks,
}: {
  tool: MarkTool;
  setTool: (t: MarkTool) => void;
  onClear: () => void;
  marks: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        paddingLeft: 14,
        borderLeft: `1px solid ${D_LINE}`,
      }}
    >
      <Highlighter size={15} style={{ color: D_SLATE2, flexShrink: 0 }} />
      {PENS.map((p) => {
        const on = tool === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => setTool(on ? null : p.key)}
            title={`${p.label} highlighter`}
            aria-pressed={on}
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              cursor: "pointer",
              background: p.solid,
              border: "1px solid rgba(0,0,0,.14)",
              outline: on ? `2px solid ${D_DARK}` : "none",
              outlineOffset: 1,
              flexShrink: 0,
            }}
          />
        );
      })}
      <button
        type="button"
        onClick={() => setTool(tool === "eraser" ? null : "eraser")}
        title="Eraser"
        aria-pressed={tool === "eraser"}
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: tool === "eraser" ? D_VTINT2 : "#fff",
          border: `1px solid ${tool === "eraser" ? D_VIOLET : D_LINE}`,
          color: tool === "eraser" ? D_VIOLET : D_SLATE2,
          flexShrink: 0,
        }}
      >
        <Eraser size={13} />
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={!marks}
        title="Clear all highlights"
        style={{
          height: 26,
          padding: "0 10px",
          borderRadius: 7,
          fontFamily: JAKARTA,
          fontSize: 12,
          fontWeight: 600,
          cursor: marks ? "pointer" : "default",
          background: "#fff",
          border: `1px solid ${D_LINE}`,
          color: marks ? D_SLATE3 : D_SLATE2,
          opacity: marks ? 1 : 0.55,
          flexShrink: 0,
        }}
      >
        Clear
      </button>
    </div>
  );
}

// ---- Reading ---------------------------------------------------------------

function ReadingRunner({
  paper,
  mode,
  regenBusy,
  onNew,
  onExit,
}: {
  paper: ReadingPaper;
  mode: ReadingMode;
  regenBusy: boolean;
  onNew: () => void;
  onExit: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<ReadingGrade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(true);
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
      const res = await callEngine<ReadingGrade>("reading/grade", { item_id: paper.id, answers });
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
      <style>{`::highlight(cefr-hl-yellow){background-color:rgba(253,224,71,.5)}::highlight(cefr-hl-green){background-color:rgba(134,239,172,.55)}::highlight(cefr-hl-pink){background-color:rgba(249,168,212,.55)}::highlight(cefr-hl-blue){background-color:rgba(147,197,253,.6)}`}</style>

      {/* Header (dark) */}
      <div
        style={{
          background: D_DARK,
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
            <span style={{ fontFamily: JAKARTA, fontWeight: 600, fontSize: 16, color: "#fff" }}>
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
                      background: warn ? "rgba(185,28,28,.3)" : "rgba(124,58,237,.28)",
                      border: `1px solid ${warn ? "rgba(248,113,113,.5)" : "rgba(124,58,237,.45)"}`,
                    }}
                    aria-label="time remaining"
                  >
                    <Clock size={14} style={{ color: warn ? "#fecaca" : "#c4b5fd" }} />
                    <span
                      style={{
                        fontFamily: JAKARTA,
                        fontWeight: 700,
                        fontSize: 17,
                        letterSpacing: ".02em",
                        color: warn ? "#fecaca" : "#e9d5ff",
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
                background: "rgba(124,58,237,.28)",
                border: "1px solid rgba(124,58,237,.45)",
              }}
            >
              <span
                style={{
                  fontFamily: JAKARTA,
                  fontWeight: 700,
                  fontSize: 17,
                  color: "#e9d5ff",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {grade.score} / {grade.max_score}
              </span>
              <span
                style={{ fontFamily: JAKARTA, fontWeight: 600, fontSize: 13, color: "#c4b5fd" }}
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
        ) : (
          <button type="button" onClick={onNew} disabled={regenBusy} style={dsSubmitBtn(regenBusy)}>
            {regenBusy ? "Generating…" : "New paper"}
          </button>
        )}
      </div>

      {/* Info + progress bar */}
      <div
        style={{
          background: "#fff",
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
                background: D_VIOLET,
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
              color: D_VIOLET,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {answeredCount} / {total}
          </span>
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
              background: coachOpen ? "#fff" : D_VTINT2,
              color: D_VIOLET,
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
        </div>
      </div>

      {graded ? (
        <div style={{ padding: "14px clamp(16px,3vw,32px) 0", flexShrink: 0 }}>
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
                color: D_VIOLET,
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
            background: "#fff",
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
          background: "#fff",
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
                      color: on ? D_VIOLET : D_SLATE3,
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
      {hl.tool === null ? (
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
    background: "#fff",
    fontFamily: JAKARTA,
    border: `1.5px solid ${active ? D_VIOLET : D_LINE}`,
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
      borderColor: D_VIOLET,
      background: "#fff",
      color: D_VIOLET,
      boxShadow: `0 0 0 3px ${D_VTINT}`,
    };
  if (answered) return { ...base, borderColor: D_VIOLET, background: D_VIOLET, color: "#fff" };
  return { ...base, borderColor: D_LINE, background: "#fff", color: D_SLATE2 };
}

/** Countdown that fires `onExpire` once at zero; render-prop exposes raw seconds left. */
// ---- Reading coach (inline 30% column, collapsible) ------------------------

type CoachMsg = { role: "student" | "assistant"; content: string; animate?: boolean };

/** The in-test reading coach as a side column. Reuses the same-origin /api/reading/tutor
 *  route (strategy-only while phase==="reading"; explanations after submit), fed the
 *  CEFR paper's assembled text + answer-free questions. Closeable; reopened from the strip. */
function CefrCoach({
  passageBody,
  questions,
  phase,
  onClose,
}: {
  passageBody: string;
  questions: string;
  phase: "reading" | "results";
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef({ passageBody, questions, phase });
  useEffect(() => {
    ctxRef.current = { passageBody, questions, phase };
  }, [passageBody, questions, phase]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  function markAnimated(idx: number) {
    setMessages((m) =>
      m[idx]?.animate ? m.map((msg, j) => (j === idx ? { ...msg, animate: false } : msg)) : m,
    );
  }

  async function send() {
    const q = input.trim();
    if (!q || sending) return;
    setInput("");
    const prior = messages;
    setMessages([...prior, { role: "student", content: q }]);
    setSending(true);
    try {
      const ctx = ctxRef.current;
      const res = await fetch("/api/reading/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          passageTitle: "CEFR Multilevel Reading",
          passageBody: ctx.passageBody,
          currentQuestion: "",
          questions: ctx.questions,
          phase: ctx.phase,
          history: prior.slice(-6),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string; message?: string };
      const reply =
        res.ok && body.reply
          ? body.reply
          : (body.message ?? "The coach is busy — try again in a moment.");
      setMessages((m) => [...m, { role: "assistant", content: reply, animate: true }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error — please try again.", animate: true },
      ]);
    } finally {
      setSending(false);
    }
  }

  const hint =
    phase === "reading"
      ? "Strategy help only — answers unlock after you submit."
      : "Ask about any question, trap, or how to improve.";
  const empty =
    phase === "reading"
      ? "Stuck on a question type or a word? Ask how to approach it — e.g. how to tell False from Not Given. I won’t give answers while the test is live."
      : "Marked. Ask me to explain any question, why a trap worked, or how to get better at a question type.";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        minWidth: 0,
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${D_LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MessageCircle size={15} />
          </span>
          <span style={{ fontFamily: JAKARTA, fontWeight: 600, fontSize: 15, color: D_DARK }}>
            Reading coach
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close coach"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: `1px solid ${D_LINE}`,
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: D_SLATE2,
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 0,
        }}
      >
        {messages.length === 0 ? (
          <p
            style={{
              fontFamily: JAKARTA,
              fontWeight: 400,
              fontSize: 14,
              lineHeight: 1.75,
              color: D_SLATE,
              margin: 0,
            }}
          >
            {empty}
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "student" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                padding: "9px 13px",
                borderRadius: 12,
                fontFamily: JAKARTA,
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                background: m.role === "student" ? D_VIOLET : D_PAGE,
                color: m.role === "student" ? "#fff" : D_INK,
                border: m.role === "student" ? "none" : `1px solid ${D_LINE}`,
              }}
            >
              {m.role === "assistant" ? (
                <Typewriter
                  text={m.content}
                  animate={!!m.animate}
                  onReveal={() =>
                    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
                  }
                  onDone={() => markAnimated(i)}
                  caretColor={D_SLATE2}
                />
              ) : (
                m.content
              )}
            </div>
          ))
        )}
        {sending ? (
          <span
            style={{ alignSelf: "flex-start", display: "inline-flex", gap: 5, padding: "9px 13px" }}
            aria-label="Coach is writing"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: D_SLATE2,
                  animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out`,
                }}
              />
            ))}
          </span>
        ) : null}
      </div>

      <div style={{ padding: "16px 20px", borderTop: `1px solid ${D_LINE}`, flexShrink: 0 }}>
        <p
          style={{
            fontFamily: JAKARTA,
            fontWeight: 400,
            fontSize: 12,
            color: D_SLATE2,
            margin: "0 0 12px",
            textAlign: "center",
          }}
        >
          {hint}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1.5px solid ${D_LINE}`,
            borderRadius: 12,
            padding: "10px 10px 10px 14px",
            background: D_PAGE,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask the coach…"
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              background: "transparent",
              outline: "none",
              fontFamily: JAKARTA,
              fontSize: 14,
              color: D_DARK,
            }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            aria-label="Send"
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 8,
              border: "none",
              cursor: sending || !input.trim() ? "default" : "pointer",
              background: D_VIOLET,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: sending || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function dsSubmitBtn(busy: boolean): React.CSSProperties {
  return {
    padding: "11px 22px",
    background: D_VIOLET,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontFamily: JAKARTA,
    fontWeight: 600,
    fontSize: 15,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
    flexShrink: 0,
  };
}

/** All answerable question numbers across the paper's parts (for progress + timing). */
function questionNumbers(parts: ReadingPart[]): number[] {
  const out: number[] = [];
  for (const p of parts) {
    if (p.part === 1)
      out.push(
        ...splitGaps(p.text_with_gaps)
          .filter((s) => s.type === "gap")
          .map((s) => (s as { number: number }).number),
      );
    else if (p.part === 2) out.push(...p.statements.map((s) => s.number));
    else if (p.part === 3) out.push(...p.paragraphs.map((x) => x.question));
    else if (p.part === 4) out.push(...p.mcq.map((q) => q.number), ...p.tfn.map((q) => q.number));
    else if (p.part === 5) out.push(...p.gaps.map((g) => g.number), ...p.mcq.map((q) => q.number));
  }
  return out;
}

/** Assemble answer-free passage text + question list for the coach's context. */
function coachContext(parts: ReadingPart[]): { body: string; questions: string } {
  const body: string[] = [];
  const qs: string[] = [];
  for (const p of parts) {
    if (p.part === 1) {
      body.push(`Part 1 — ${p.title}\n${p.text_with_gaps}`);
    } else if (p.part === 2) {
      body.push(
        `Part 2 — ${p.theme}\n` +
          p.texts.map((t) => `${t.letter}. ${t.title}: ${t.body}`).join("\n"),
      );
      qs.push(...p.statements.map((s) => `Q${s.number}: ${s.text}`));
    } else if (p.part === 3) {
      body.push("Part 3 — Headings\n" + p.paragraphs.map((x) => x.text).join("\n\n"));
      qs.push(
        ...p.paragraphs.map((x) => `Q${x.question}: choose the best heading for this paragraph`),
      );
    } else if (p.part === 4) {
      body.push(`Part 4 — ${p.title}\n${p.text}`);
      qs.push(
        ...p.mcq.map((q) => `Q${q.number}: ${q.stem}`),
        ...p.tfn.map((q) => `Q${q.number}: ${q.statement}`),
      );
    } else if (p.part === 5) {
      body.push(`Part 5 — ${p.title}\n${p.text}`);
      qs.push(
        ...p.gaps.map((g) => `Q${g.number}: ${g.sentence}`),
        ...p.mcq.map((q) => `Q${q.number}: ${q.stem}`),
      );
    }
  }
  return { body: body.join("\n\n"), questions: qs.join("\n") };
}

// ---- Passage/reference pane · Questions pane, dispatched per part shape ----
//
// Each of the 5 DTM part types is split into a read/reference half (passage
// text, notices, or the headings list) and an answer half (the actual inputs
// + their instructions) so the runner can show them side by side — Part 1 is
// the exception: its gaps are inline in the passage, so its "questions" pane
// is a jump-to navigator instead of a separate answer list.

function PartPassage({
  part,
  answers,
  set,
  results,
  graded,
}: {
  part: ReadingPart;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  if (part.part === 1)
    return <Part1Passage p={part} answers={answers} set={set} results={results} graded={graded} />;
  if (part.part === 2) return <Part2Passage p={part} />;
  if (part.part === 3) return <Part3Passage p={part} />;
  if (part.part === 4) return <Part4Passage p={part} />;
  return <Part5Passage p={part} />;
}

function PartQuestions({
  part,
  answers,
  set,
  results,
  graded,
  onJump,
}: {
  part: ReadingPart;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
  onJump: (n: number) => void;
}) {
  if (part.part === 1)
    return (
      <Part1Questions
        p={part}
        answers={answers}
        results={results}
        graded={graded}
        onJump={onJump}
      />
    );
  if (part.part === 2)
    return (
      <Part2Questions p={part} answers={answers} set={set} results={results} graded={graded} />
    );
  if (part.part === 3)
    return (
      <Part3Questions p={part} answers={answers} set={set} results={results} graded={graded} />
    );
  if (part.part === 4)
    return (
      <Part4Questions p={part} answers={answers} set={set} results={results} graded={graded} />
    );
  return <Part5Questions p={part} answers={answers} set={set} results={results} graded={graded} />;
}

// ---- Part 1 — sentence gap-fill (answers are inline in the passage) -------

function Part1Passage({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P1;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  const segments = useMemo(() => splitGaps(p.text_with_gaps), [p.text_with_gaps]);
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Instruction>{p.instruction}</Instruction>
      <h2
        style={{
          fontFamily: PLEX,
          fontWeight: 600,
          fontSize: 26,
          lineHeight: 1.3,
          color: D_DARK,
          margin: "0 0 20px",
        }}
      >
        {p.title}
      </h2>
      <p
        style={
          {
            fontFamily: PLEX,
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 2.4,
            color: D_INK,
            margin: 0,
            textWrap: "pretty",
          } as React.CSSProperties
        }
      >
        {segments.map((s, i) =>
          s.type === "text" ? (
            <span key={i}>{s.value}</span>
          ) : (
            <GapInput
              key={i}
              n={s.number}
              answers={answers}
              set={set}
              results={results}
              graded={graded}
              width={100}
            />
          ),
        )}
      </p>
    </>
  );
}

function Part1Questions({
  p,
  answers,
  results,
  graded,
  onJump,
}: {
  p: P1;
  answers: Record<string, string>;
  results: Map<number, QResult>;
  graded: boolean;
  onJump: (n: number) => void;
}) {
  const nums = useMemo(
    () =>
      splitGaps(p.text_with_gaps)
        .filter((s) => s.type === "gap")
        .map((s) => (s as { number: number }).number),
    [p.text_with_gaps],
  );
  return (
    <>
      <p
        style={{
          fontFamily: JAKARTA,
          fontSize: 13,
          color: D_SLATE,
          margin: "0 0 16px",
          lineHeight: 1.6,
        }}
      >
        {graded
          ? "Tap a gap to jump back to it in the passage."
          : "Fill in the blanks in the passage on the left — tap a gap here to jump to it."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {nums.map((n) => {
          const filled = !!(answers[String(n)] ?? "").trim();
          const r = graded ? results.get(n) : undefined;
          const border = r ? (r.is_correct ? GOOD : BAD) : filled ? D_VIOLET : D_LINE;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onJump(n)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1px solid ${border}`,
                background: r ? (r.is_correct ? "#f0fdf4" : "#fef2f2") : filled ? D_VTINT2 : "#fff",
                cursor: "pointer",
                fontFamily: JAKARTA,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: D_VIOLET }}>Gap {n}</span>
              {r ? (
                <span style={{ fontSize: 12.5, fontWeight: 600, color: r.is_correct ? GOOD : BAD }}>
                  {r.is_correct ? "Correct" : `${r.user_answer || "—"} → ${r.correct_answer}`}
                </span>
              ) : (
                <span style={{ fontSize: 12.5, color: filled ? D_VIOLET : D_SLATE2 }}>
                  {filled ? "Filled" : "Empty"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ---- Part 2 — text matching (notices left, statements right) --------------

function Part2Passage({ p }: { p: P2 }) {
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Instruction>{p.instruction}</Instruction>
      <div
        style={{
          fontFamily: JAKARTA,
          fontWeight: 700,
          fontSize: 15,
          color: D_DARK,
          margin: "0 0 12px",
        }}
      >
        {p.theme}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {p.texts.map((t) => (
          <div
            key={t.letter}
            style={{
              border: `1px solid ${D_LINE}`,
              borderRadius: 10,
              padding: "12px 14px",
              background: D_PAGE,
            }}
          >
            <div style={{ fontFamily: JAKARTA, fontWeight: 700, fontSize: 13.5, color: D_DARK }}>
              <span style={{ color: D_VIOLET }}>{t.letter}.</span> {t.title}
            </div>
            <div
              style={{
                fontFamily: JAKARTA,
                fontSize: 13,
                color: D_SLATE,
                lineHeight: 1.6,
                marginTop: 4,
              }}
            >
              {t.body}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Part2Questions({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P2;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  const letters = p.texts.map((t) => t.letter);
  return (
    <>
      {p.statements.map((s) => (
        <Row key={s.number} n={s.number} text={s.text} results={results} graded={graded}>
          <LetterSelect
            n={s.number}
            letters={letters}
            answers={answers}
            set={set}
            disabled={graded}
          />
        </Row>
      ))}
    </>
  );
}

// ---- Part 3 — heading matching (headings list left, paragraphs right) -----

function Part3Passage({ p }: { p: P3 }) {
  const letters = Object.keys(p.headings);
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Instruction>{p.instruction}</Instruction>
      <div
        style={{
          border: `1px solid ${D_LINE}`,
          borderRadius: 10,
          padding: "14px 16px",
          background: D_PAGE,
        }}
      >
        <div
          style={{
            fontFamily: JAKARTA,
            fontWeight: 700,
            fontSize: 12,
            color: D_SLATE2,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginBottom: 8,
          }}
        >
          List of headings
        </div>
        {letters.map((l) => (
          <div
            key={l}
            style={{ fontFamily: JAKARTA, fontSize: 13.5, color: D_INK, lineHeight: 1.75 }}
          >
            <b style={{ color: D_VIOLET }}>{l}.</b> {p.headings[l]}
          </div>
        ))}
      </div>
    </>
  );
}

function Part3Questions({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P3;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  const letters = Object.keys(p.headings);
  return (
    <>
      {p.paragraphs.map((para, i) => (
        <div key={para.question} style={{ marginBottom: 18 }}>
          <Row
            n={para.question}
            text={`Paragraph ${roman(i + 1)}`}
            results={results}
            graded={graded}
          >
            <LetterSelect
              n={para.question}
              letters={letters}
              answers={answers}
              set={set}
              disabled={graded}
            />
          </Row>
          <p
            style={
              {
                fontFamily: PLEX,
                fontSize: 15,
                lineHeight: 1.85,
                color: D_INK,
                margin: "10px 0 0",
              } as React.CSSProperties
            }
          >
            {para.text}
          </p>
        </div>
      ))}
    </>
  );
}

// ---- Part 4 — passage + MCQ/T-F-NI (passage left, questions right) --------

function Part4Passage({ p }: { p: P4 }) {
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Passage title={p.title} text={p.text} />
    </>
  );
}

function Part4Questions({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P4;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  return (
    <>
      <Instruction>{p.instruction_mcq}</Instruction>
      {p.mcq.map((q) => (
        <McqRow
          key={q.number}
          number={q.number}
          stem={q.stem}
          options={q.options}
          answers={answers}
          set={set}
          results={results}
          graded={graded}
        />
      ))}
      <Instruction>{p.instruction_tfn}</Instruction>
      {p.tfn.map((q) => (
        <McqRow
          key={q.number}
          number={q.number}
          stem={q.statement}
          options={{ A: "True", B: "False", C: "No Information" }}
          answers={answers}
          set={set}
          results={results}
          graded={graded}
        />
      ))}
    </>
  );
}

// ---- Part 5 — summary gap-fill + MCQ (passage left, questions right) ------

function Part5Passage({ p }: { p: P5 }) {
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Passage title={p.title} text={p.text} />
    </>
  );
}

function Part5Questions({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P5;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  return (
    <>
      <Instruction>{p.instruction_gap}</Instruction>
      {p.gaps.map((g) => {
        const segs = splitGaps(
          g.sentence.includes("_")
            ? g.sentence.replace(/_+/, `(${g.number}) ______`)
            : `${g.sentence} (${g.number}) ______`,
        );
        return (
          <p
            key={g.number}
            style={
              {
                fontFamily: PLEX,
                fontSize: 16,
                lineHeight: 2.1,
                color: D_INK,
                margin: "0 0 10px",
              } as React.CSSProperties
            }
          >
            {segs.map((s, i) =>
              s.type === "text" ? (
                <span key={i}>{s.value}</span>
              ) : (
                <GapInput
                  key={i}
                  n={g.number}
                  answers={answers}
                  set={set}
                  results={results}
                  graded={graded}
                  width={100}
                />
              ),
            )}
          </p>
        );
      })}
      {graded ? <Feedback nums={p.gaps.map((g) => g.number)} results={results} /> : null}
      <div style={{ height: 10 }} />
      <Instruction>{p.instruction_mcq}</Instruction>
      {p.mcq.map((q) => (
        <McqRow
          key={q.number}
          number={q.number}
          stem={q.stem}
          options={q.options}
          answers={answers}
          set={set}
          results={results}
          graded={graded}
        />
      ))}
    </>
  );
}

// ---- Writing (full studio: prompt · answer · coach — mirrors the IELTS writing design) ----

// The CEFR writing studio is the IELTS writing studio's twin (same three-column
// layout + coach), tinted with the CEFR violet so it sits beside the "Reading B"
// runner as one product. It talks to the engine (callEngine) instead of the
// IELTS essays API, and handles a multi-task paper with an in-header switcher.
const W_ACCENT = D_VIOLET; // 7c3aed
const W_SOFT = "#f5f3ff"; // violet-50 surface
const W_SOFT2 = D_VTINT2; // faf5ff
const W_LINE = D_LINE; // e2e8f0
const W_SOFTLINE = "#eef1f5"; // faint inner divider
const W_CANVAS = D_PAGE; // f8fafc
const W_INK = D_DARK; // 0f172a
const W_BODY = D_INK; // 1e293b
const W_MUTED = D_SLATE; // 64748b
const W_FAINT = D_SLATE2; // 94a3b8

const WRITING_KIND: Record<string, string> = {
  "1.1": "Informal · Message",
  "1.2": "Formal · Letter",
  "2": "Forum · Opinion",
};
const WRITING_COACH_CHIPS = ["Plan an outline", "Useful vocabulary", "Check my idea"];

// CEFR task → the IELTS tutor's task_type, so the coach tailors letter vs. essay advice.
function tutorTypeForTask(task: string): string {
  return task === "2" ? "task2" : "task1_general";
}
function secondsForWritingTask(task: string): number {
  return task === "2" ? 30 * 60 : 20 * 60;
}
function wPrimaryBtn(disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    padding: "0 18px",
    border: "none",
    borderRadius: 10,
    background: W_ACCENT,
    color: "#fff",
    fontFamily: JAKARTA,
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
    boxShadow: disabled ? "none" : "0 10px 22px -12px rgba(124,58,237,.7)",
  };
}
const wGhostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 40,
  padding: "0 16px",
  border: `1px solid ${W_LINE}`,
  borderRadius: 10,
  background: "#fff",
  color: W_MUTED,
  fontFamily: JAKARTA,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

function WritingRunner({
  paper,
  regenBusy,
  onNew,
  onExit,
}: {
  paper: WritingPaper;
  regenBusy: boolean;
  onNew: () => void;
  onExit: () => void;
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
}) {
  const task = tasks[activeIdx];
  const [view, setView] = useState<"write" | "result">(grade?.gradable ? "result" : "write");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(true);
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
      const g = await callEngine<WritingGrade>("writing/grade", {
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
  }, [submitting, itemId, task.task, onGraded]);

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
        height: "100vh",
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

      {/* header */}
      <header
        style={{
          flexShrink: 0,
          height: 62,
          background: "#fff",
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
              background: "#fff",
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
                color: "#fff",
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
            <span style={{ color: "#cbd5e1" }}>·</span>
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
                      border: `1px solid ${on ? W_ACCENT : W_LINE}`,
                      background: on ? W_ACCENT : "#fff",
                      color: on ? "#fff" : W_MUTED,
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
              background: "#fff",
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
                        color: urgent ? "#c2410c" : "#4b4e63",
                      }}
                    >
                      <Clock size={14} style={{ color: urgent ? "#c2410c" : W_FAINT }} />
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{text}</span> left
                    </span>
                  );
                }}
              </Timer>
            </div>
          ) : null}
          <div style={{ width: 1, height: 24, background: W_LINE }} />
          {showResult ? (
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
              background: "#fff",
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
              <WritingResult g={grade} />
            </div>
          </main>
        ) : (
          <main
            className="ml-wr-answer"
            style={{
              flex: 1,
              minWidth: 0,
              background: "#fff",
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
                    <circle cx="23" cy="23" r="19" fill="none" stroke={W_SOFT} strokeWidth="4.5" />
                    <circle
                      cx="23"
                      cy="23"
                      r="19"
                      fill="none"
                      stroke={W_ACCENT}
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray={RING_C}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 23 23)"
                      style={{ transition: "stroke-dashoffset .35s ease" }}
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
                  color: "#272C3E",
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
                  {chars.toLocaleString()} characters
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
              background: "#fff",
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
        ) : (
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
              background: W_ACCENT,
              color: "#fff",
              cursor: "pointer",
              fontFamily: JAKARTA,
              fontWeight: 700,
              fontSize: 14.5,
              boxShadow: "0 14px 30px -12px rgba(124,58,237,.6)",
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
          background: "#fff",
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
            background: message ? "#FBE9DD" : "#E5F3EA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {message ? (
            <X size={12} style={{ color: "#c2410c" }} />
          ) : (
            <Check size={12} style={{ color: GOOD }} />
          )}
        </span>
        <span style={{ fontFamily: JAKARTA, fontSize: 13, color: W_MUTED }}>
          {message ? (
            <span style={{ color: "#c2410c" }}>{message}</span>
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

function WritingPromptPanel({
  task,
  words,
  wordPct,
  lengthMet,
  graded,
}: {
  task: WritingTask;
  words: number;
  wordPct: number;
  lengthMet: boolean;
  graded: boolean;
}) {
  const context = task.situation || task.forum_context || task.problem;
  return (
    <aside
      className="ml-wr-prompt"
      style={{
        width: 348,
        flexShrink: 0,
        background: "#fff",
        border: `1px solid ${W_LINE}`,
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${W_SOFTLINE}` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 13,
            }}
          >
            <span
              style={{
                fontFamily: JAKARTA,
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: ".13em",
                color: W_FAINT,
              }}
            >
              THE TASK
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 26,
                padding: "0 11px",
                borderRadius: 7,
                background: W_SOFT,
                color: W_ACCENT,
                fontFamily: JAKARTA,
                fontSize: 12.5,
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              {task.register}
            </span>
          </div>
          {context ? (
            <p
              style={{
                margin: "0 0 12px",
                fontFamily: JAKARTA,
                fontSize: 13,
                lineHeight: 1.6,
                color: W_MUTED,
                padding: "10px 12px",
                background: W_CANVAS,
                border: `1px solid ${W_LINE}`,
                borderRadius: 10,
              }}
            >
              {context}
            </p>
          ) : null}
          <p
            style={{
              margin: 0,
              fontFamily: PLEX,
              fontSize: 18.5,
              lineHeight: 1.5,
              fontWeight: 400,
              color: W_INK,
              whiteSpace: "pre-wrap",
            }}
          >
            {task.question || task.prompt}
          </p>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: JAKARTA,
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: ".04em",
              color: W_MUTED,
            }}
          >
            COVER ALL POINTS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {task.required_content_points.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "10px 12px",
                  background: W_CANVAS,
                  border: `1px solid ${W_SOFTLINE}`,
                  borderRadius: 10,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: W_SOFT,
                    color: W_ACCENT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: JAKARTA,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontFamily: JAKARTA,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: W_BODY,
                    lineHeight: 1.5,
                  }}
                >
                  {c}
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 12px",
                background: W_SOFT2,
                border: `1px solid ${D_VBORDER2}`,
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: lengthMet ? "#E5F3EA" : "#fff",
                  border: lengthMet ? "none" : `2px solid ${D_VBORDER2}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {lengthMet ? <Check size={13} strokeWidth={3} style={{ color: GOOD }} /> : null}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ fontFamily: JAKARTA, fontSize: 13.5, fontWeight: 600, color: W_BODY }}
                  >
                    {task.word_range[0]}–{task.word_range[1]} words
                  </span>
                  <span
                    style={{
                      fontFamily: JAKARTA,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: W_ACCENT,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {words}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 7,
                    height: 5,
                    borderRadius: 3,
                    background: W_SOFT,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${wordPct}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: W_ACCENT,
                      transition: "width .3s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          flexShrink: 0,
          padding: "13px 20px",
          borderTop: `1px solid ${W_SOFTLINE}`,
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <Sparkles size={15} style={{ color: W_FAINT, flexShrink: 0 }} />
        <span style={{ fontFamily: JAKARTA, fontSize: 12.5, color: W_FAINT, lineHeight: 1.4 }}>
          {graded ? "A model answer is in your result." : "A model answer unlocks after you grade."}
        </span>
      </div>
    </aside>
  );
}

function WritingCoach({
  promptText,
  tutorType,
  phase,
  draftRef,
  onClose,
}: {
  promptText: string;
  tutorType: string;
  phase: "writing" | "results";
  draftRef: React.MutableRefObject<string>;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef({ promptText, tutorType, phase });
  useEffect(() => {
    ctxRef.current = { promptText, tutorType, phase };
  }, [promptText, tutorType, phase]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  function markAnimated(idx: number) {
    setMessages((m) =>
      m[idx]?.animate ? m.map((msg, j) => (j === idx ? { ...msg, animate: false } : msg)) : m,
    );
  }

  async function send(raw?: string) {
    const q = (raw ?? input).trim();
    if (!q || sending) return;
    setInput("");
    const prior = messages;
    setMessages([...prior, { role: "student", content: q }]);
    setSending(true);
    try {
      const ctx = ctxRef.current;
      const res = await fetch("/api/writing/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          taskType: ctx.tutorType,
          promptText: ctx.promptText,
          draft: draftRef.current,
          phase: ctx.phase === "results" ? "results" : "writing",
          history: prior.slice(-6),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string; message?: string };
      const reply =
        res.ok && body.reply
          ? body.reply
          : (body.message ?? "The coach is busy — try again in a moment.");
      setMessages((m) => [...m, { role: "assistant", content: reply, animate: true }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error — please try again.", animate: true },
      ]);
    } finally {
      setSending(false);
    }
  }

  const empty =
    phase === "results"
      ? "Marked. Ask me to explain any part of the feedback, or how to push this answer to the next level."
      : "I can help you understand the task, plan ideas, and find sharper words — but you write the answer.";
  const subtitle =
    phase === "results" ? "Feedback unlocked · ask anything" : "Ideas & vocabulary · not answers";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#fff",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "15px 16px",
          borderBottom: `1px solid ${W_SOFTLINE}`,
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <Sparkles size={18} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: JAKARTA, fontWeight: 700, fontSize: 14.5, color: W_INK }}>
            Writing coach
          </div>
          <div style={{ fontFamily: JAKARTA, fontSize: 12, color: W_FAINT }}>{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Collapse coach"
          style={{
            flexShrink: 0,
            width: 30,
            height: 30,
            border: "none",
            background: "transparent",
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: W_FAINT,
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              background: W_SOFT2,
              border: `1px solid ${D_VBORDER2}`,
              borderRadius: 13,
              borderTopLeftRadius: 4,
              padding: "13px 14px",
              fontFamily: JAKARTA,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "#3A3F58",
            }}
          >
            {empty}
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "student" ? "flex-end" : "flex-start",
                maxWidth: "86%",
                padding: "10px 13px",
                borderRadius: 12,
                borderTopRightRadius: m.role === "student" ? 3 : 12,
                borderTopLeftRadius: m.role === "student" ? 12 : 3,
                fontFamily: JAKARTA,
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                background: m.role === "student" ? W_ACCENT : W_CANVAS,
                color: m.role === "student" ? "#fff" : W_BODY,
                border: m.role === "student" ? "none" : `1px solid ${W_LINE}`,
              }}
            >
              {m.role === "assistant" ? (
                <Typewriter
                  text={m.content}
                  animate={!!m.animate}
                  onReveal={() =>
                    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
                  }
                  onDone={() => markAnimated(i)}
                  caretColor={W_FAINT}
                />
              ) : (
                m.content
              )}
            </div>
          ))
        )}
        {sending ? (
          <span
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              gap: 5,
              padding: "10px 13px",
            }}
            aria-label="Coach is writing"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: W_FAINT,
                  animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out`,
                }}
              />
            ))}
          </span>
        ) : null}
      </div>
      <div
        style={{ flexShrink: 0, padding: "0 14px 8px", display: "flex", flexWrap: "wrap", gap: 7 }}
      >
        {WRITING_COACH_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => void send(c)}
            disabled={sending}
            style={{
              fontFamily: JAKARTA,
              fontSize: 12.5,
              fontWeight: 600,
              color: W_ACCENT,
              background: W_SOFT,
              border: `1px solid ${D_VBORDER2}`,
              borderRadius: 999,
              padding: "6px 12px",
              cursor: sending ? "default" : "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: "12px 14px", borderTop: `1px solid ${W_SOFTLINE}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: W_CANVAS,
            border: `1px solid ${W_LINE}`,
            borderRadius: 11,
            padding: "5px 6px 5px 13px",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask in any language…"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              background: "transparent",
              outline: "none",
              fontFamily: JAKARTA,
              fontSize: 13.5,
              color: W_INK,
            }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            aria-label="Send"
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              border: "none",
              borderRadius: 9,
              background: W_ACCENT,
              cursor: sending || !input.trim() ? "default" : "pointer",
              opacity: sending || !input.trim() ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

const CEFR_GRADING_STEPS = [
  "Reading your response, line by line…",
  "Checking grammar, vocabulary & cohesion…",
  "Weighing it against the CEFR descriptors…",
  "Calibrating a fair, conservative level…",
];

function CefrGradingOverlay() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % CEFR_GRADING_STEPS.length), 2200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div
      role="alertdialog"
      aria-label="Grading your writing"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(15,23,42,.5)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "min(420px,94vw)",
          background: "#fff",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 40px 90px -30px rgba(15,23,42,.7)",
        }}
      >
        <div
          style={{
            padding: "30px 26px 26px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            borderBottom: `1px solid ${D_VBORDER2}`,
            background: W_SOFT2,
          }}
        >
          <span
            style={{
              width: 60,
              height: 60,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
              color: "#fff",
            }}
          >
            <Loader2 size={26} className="animate-spin" />
          </span>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: JAKARTA,
              fontSize: 19,
              fontWeight: 800,
              color: W_INK,
            }}
          >
            Grading your writing
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: JAKARTA,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: W_MUTED,
              maxWidth: 320,
            }}
          >
            Hang tight — we read every line and weigh it against the CEFR descriptors so your level
            is accurate.
          </p>
        </div>
        <div style={{ padding: "20px 26px 24px" }}>
          <div
            style={{
              minHeight: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              key={step}
              style={{
                fontFamily: JAKARTA,
                fontSize: 13.5,
                fontWeight: 600,
                color: W_ACCENT,
                textAlign: "center",
              }}
            >
              {CEFR_GRADING_STEPS[step]}
            </span>
          </div>
          <div
            style={{
              marginTop: 16,
              height: 6,
              borderRadius: 999,
              background: W_SOFT,
              overflow: "hidden",
            }}
          >
            <div
              className="lp-grade-bar"
              style={{ height: "100%", width: "100%", borderRadius: 999, background: W_ACCENT }}
            />
          </div>
          <p
            style={{
              margin: "14px 0 0",
              fontFamily: JAKARTA,
              fontSize: 12,
              color: W_FAINT,
              textAlign: "center",
            }}
          >
            This usually takes about 20–30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

function WritingResult({ g }: { g: WritingGrade }) {
  if (!g.gradable) return <Alert>{g.message ?? "Not gradable yet."}</Alert>;
  const s = g.scores;
  return (
    <div>
      {/* level hero */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 22px",
          borderRadius: 14,
          background: `linear-gradient(135deg,${D_VIOLET} 0%,#4f46e5 100%)`,
          color: "#fff",
          marginBottom: 18,
        }}
      >
        <div style={{ fontFamily: PLEX, fontSize: 38, fontWeight: 600, lineHeight: 1 }}>
          {g.estimated_cefr}
        </div>
        <div style={{ height: 38, width: 1, background: "rgba(255,255,255,.3)" }} />
        <div>
          <div style={{ fontFamily: JAKARTA, fontSize: 20, fontWeight: 700 }}>
            {g.overall_0_100}
            <span style={{ opacity: 0.7, fontSize: 14 }}>/100</span>
          </div>
          <div style={{ fontFamily: JAKARTA, fontSize: 12.5, opacity: 0.85 }}>
            {g.word_count} words · {g.in_range ? "in range" : "out of range"}
          </div>
        </div>
      </div>
      {s ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {(
            [
              ["Task", s.task_achievement],
              ["Coherence", s.coherence],
              ["Lexis", s.lexical],
              ["Grammar", s.grammar],
              ["Register", s.register],
            ] as const
          ).map(([k, v]) => (
            <div
              key={k}
              style={{
                border: `1px solid ${W_LINE}`,
                borderRadius: 10,
                padding: "10px",
                textAlign: "center",
                background: W_CANVAS,
              }}
            >
              <div style={{ fontFamily: PLEX, fontSize: 22, fontWeight: 700, color: W_ACCENT }}>
                {v}
                <span style={{ fontSize: 12, color: W_FAINT }}>/5</span>
              </div>
              <div style={{ fontFamily: JAKARTA, fontSize: 11, color: W_MUTED, marginTop: 2 }}>
                {k}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {g.examiner_comment ? (
        <p
          style={{
            fontFamily: JAKARTA,
            fontSize: 14,
            color: W_BODY,
            lineHeight: 1.65,
            margin: "0 0 16px",
            padding: "12px 14px",
            background: W_SOFT2,
            border: `1px solid ${D_VBORDER2}`,
            borderRadius: 10,
          }}
        >
          {g.examiner_comment}
        </p>
      ) : null}
      <ResultBullets title="Strengths" items={g.strengths} color={GOOD} />
      <ResultBullets title="Improve" items={g.improvements} color="#b45309" />
      {g.corrected_sentences?.length ? (
        <div style={{ marginTop: 14 }}>
          <ResultLabel>Suggested fixes</ResultLabel>
          {g.corrected_sentences.map((c, i) => (
            <div
              key={i}
              style={{
                fontFamily: JAKARTA,
                fontSize: 13.5,
                lineHeight: 1.55,
                marginBottom: 9,
                padding: "10px 12px",
                border: `1px solid ${W_LINE}`,
                borderRadius: 10,
              }}
            >
              <div style={{ color: BAD, textDecoration: "line-through" }}>{c.original}</div>
              <div style={{ color: GOOD, marginTop: 3 }}>{c.improved}</div>
            </div>
          ))}
        </div>
      ) : null}
      {g.model_answer ? (
        <details style={{ marginTop: 16 }}>
          <summary
            style={{
              fontFamily: JAKARTA,
              fontSize: 13.5,
              fontWeight: 700,
              color: W_ACCENT,
              cursor: "pointer",
            }}
          >
            Show a model answer
          </summary>
          <p
            style={{
              fontFamily: PLEX,
              fontSize: 15,
              lineHeight: 1.8,
              color: "#2b3147",
              margin: "10px 0 0",
              whiteSpace: "pre-wrap",
            }}
          >
            {g.model_answer}
          </p>
        </details>
      ) : null}
    </div>
  );
}

function ResultBullets({
  title,
  items,
  color,
}: {
  title: string;
  items?: string[];
  color: string;
}) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <ResultLabel>{title}</ResultLabel>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
        {items.map((it, i) => (
          <li
            key={i}
            style={{ fontFamily: JAKARTA, fontSize: 13.5, color: W_BODY, lineHeight: 1.65 }}
          >
            <span style={{ color }}>•</span> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: JAKARTA,
        fontWeight: 700,
        fontSize: 11,
        color: W_FAINT,
        textTransform: "uppercase",
        letterSpacing: ".06em",
      }}
    >
      {children}
    </div>
  );
}

// ---- Shared UI -------------------------------------------------------------

function ScoreBanner({ score, max, level }: { score: number; max: number; level?: string | null }) {
  const pct = max ? Math.round((score / max) * 100) : 0;
  return (
    <div
      style={{
        background: `linear-gradient(135deg,${D_VIOLET} 0%,#4f46e5 100%)`,
        color: "#fff",
        borderRadius: 12,
        padding: "18px 24px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      <div>
        <div style={{ fontFamily: JAKARTA, fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}>
          Your score
        </div>
        <div style={{ fontFamily: PLEX, fontSize: 32, fontWeight: 600 }}>
          {score}
          <span style={{ opacity: 0.7, fontSize: 20 }}> / {max}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {level ? (
          <span
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,.14)",
              border: "1px solid rgba(255,255,255,.25)",
            }}
          >
            <span style={{ fontFamily: PLEX, fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
              ≈ {level}
            </span>
            <span
              style={{
                fontFamily: JAKARTA,
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                opacity: 0.8,
              }}
            >
              indicative
            </span>
          </span>
        ) : null}
        <div style={{ fontFamily: PLEX, fontSize: 28, fontWeight: 600 }}>{pct}%</div>
      </div>
    </div>
  );
}

function PartHeading({ n, cefr, count }: { n: number; cefr: string; count: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: JAKARTA,
            fontWeight: 700,
            fontSize: 12,
            color: D_SLATE3,
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          Part {n}
        </span>
        <span
          style={{
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "#cbd5e1",
            display: "inline-block",
          }}
        />
        <span
          style={{
            padding: "4px 11px",
            borderRadius: 100,
            background: D_VTINT,
            color: D_VIOLET,
            fontFamily: JAKARTA,
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {cefr}
        </span>
      </div>
      <span style={{ fontFamily: JAKARTA, fontWeight: 400, fontSize: 12, color: D_SLATE2 }}>
        {count}
      </span>
    </div>
  );
}

/** Short count label for a part's heading ("6 gaps", "9 questions"). */
function partCountLabel(part: ReadingPart): string {
  if (part.part === 1)
    return `${splitGaps(part.text_with_gaps).filter((s) => s.type === "gap").length} gaps`;
  if (part.part === 2) return `${part.statements.length} questions`;
  if (part.part === 3) return `${part.paragraphs.length} questions`;
  if (part.part === 4) return `${part.mcq.length + part.tfn.length} questions`;
  return `${part.gaps.length + part.mcq.length} questions`;
}

function Passage({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2
        style={{
          fontFamily: PLEX,
          fontWeight: 600,
          fontSize: 24,
          lineHeight: 1.3,
          color: D_DARK,
          margin: "0 0 14px",
        }}
      >
        {title}
      </h2>
      {text
        .split(/\n+/)
        .filter(Boolean)
        .map((para, i) => (
          <p
            key={i}
            style={
              {
                fontFamily: PLEX,
                fontWeight: 400,
                fontSize: 17,
                lineHeight: 2,
                color: D_INK,
                margin: "0 0 12px",
                textWrap: "pretty",
              } as React.CSSProperties
            }
          >
            {para}
          </p>
        ))}
    </div>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        background: D_VTINT2,
        borderRadius: 8,
        margin: "0 0 24px",
        border: `1px solid ${D_VBORDER2}`,
      }}
    >
      <p
        style={{
          fontFamily: JAKARTA,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 14,
          lineHeight: 1.6,
          color: "#6d28d9",
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}

function Row({
  n,
  text,
  results,
  graded,
  children,
}: {
  n: number;
  text: string;
  results: Map<number, QResult>;
  graded: boolean;
  children: React.ReactNode;
}) {
  const r = graded ? results.get(n) : undefined;
  return (
    <div
      id={`cefr-q-${n}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 0",
        borderTop: `1px solid ${D_LINE}`,
      }}
    >
      <span
        style={{
          fontFamily: JAKARTA,
          fontWeight: 700,
          fontSize: 13,
          color: D_VIOLET,
          minWidth: 22,
        }}
      >
        {n}.
      </span>
      <div style={{ flex: 1, fontFamily: JAKARTA, fontSize: 14, color: D_INK, lineHeight: 1.5 }}>
        {text}
        {r ? <Verdict r={r} /> : null}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function McqRow({
  number,
  stem,
  options,
  answers,
  set,
  results,
  graded,
}: {
  number: number;
  stem: string;
  options: Options;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  const r = graded ? results.get(number) : undefined;
  const chosen = answers[String(number)] ?? "";
  return (
    <div id={`cefr-q-${number}`} style={{ padding: "14px 0", borderTop: `1px solid ${D_LINE}` }}>
      <div
        style={{
          fontFamily: JAKARTA,
          fontSize: 14,
          fontWeight: 600,
          color: D_DARK,
          marginBottom: 9,
          lineHeight: 1.5,
        }}
      >
        {number}. {stem}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.entries(options).map(([letter, label]) => {
          const isChosen = chosen === letter;
          const isAnswer = r?.correct_answer === letter;
          const border =
            graded && isAnswer ? GOOD : graded && isChosen ? BAD : isChosen ? D_VIOLET : D_LINE;
          return (
            <label
              key={letter}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontFamily: JAKARTA,
                fontSize: 13.5,
                color: D_INK,
                padding: "8px 12px",
                borderRadius: 9,
                border: `1px solid ${border}`,
                background: graded && isAnswer ? "#f0fdf4" : isChosen ? D_VTINT2 : "#fff",
                cursor: graded ? "default" : "pointer",
              }}
            >
              <input
                type="radio"
                name={`q${number}`}
                value={letter}
                checked={isChosen}
                disabled={graded}
                onChange={() => set(number, letter)}
                style={{ accentColor: D_VIOLET }}
              />
              <b style={{ color: D_VIOLET }}>{letter})</b> {label}
            </label>
          );
        })}
      </div>
      {r ? <Verdict r={r} /> : null}
    </div>
  );
}

function GapInput({
  n,
  answers,
  set,
  results,
  graded,
  width,
}: {
  n: number;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
  width: number;
}) {
  const r = graded ? results.get(n) : undefined;
  const underline = r ? (r.is_correct ? GOOD : BAD) : D_VBORDER;
  return (
    <span
      id={`cefr-q-${n}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        gap: 3,
        margin: "0 3px",
      }}
    >
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "stretch" }}>
        <input
          value={answers[String(n)] ?? ""}
          onChange={(e) => set(n, e.target.value)}
          disabled={graded}
          aria-label={`Gap ${n}`}
          style={{
            height: 26,
            width,
            border: 0,
            borderBottom: `2px solid ${underline}`,
            background: D_VTINT2,
            fontFamily: PLEX,
            fontWeight: 400,
            fontSize: 17,
            padding: "0 8px 2px",
            borderRadius: "3px 3px 0 0",
            color: D_VTEXT,
            outline: "none",
          }}
        />
        {r && !r.is_correct ? (
          <span
            style={{
              fontFamily: JAKARTA,
              fontSize: 10.5,
              fontWeight: 600,
              color: GOOD,
              textAlign: "center",
              marginTop: 2,
            }}
          >
            {r.correct_answer}
          </span>
        ) : null}
      </span>
      <span
        style={{
          fontFamily: JAKARTA,
          fontWeight: 700,
          fontSize: 9,
          lineHeight: 1.4,
          color: D_VIOLET,
          padding: "2px 5px",
          background: D_VTINT,
          borderRadius: 100,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {n}
      </span>
    </span>
  );
}

function LetterSelect({
  n,
  letters,
  answers,
  set,
  disabled,
}: {
  n: number;
  letters: string[];
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  disabled: boolean;
}) {
  return (
    <select
      value={answers[String(n)] ?? ""}
      onChange={(e) => set(n, e.target.value)}
      disabled={disabled}
      aria-label={`Answer ${n}`}
      style={{
        fontFamily: JAKARTA,
        fontWeight: 700,
        fontSize: 14,
        color: D_VIOLET,
        background: D_VTINT2,
        border: `1px solid ${D_VBORDER}`,
        padding: "6px 10px",
        borderRadius: 8,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <option value="">—</option>
      {letters.map((l) => (
        <option key={l} value={l}>
          {l}
        </option>
      ))}
    </select>
  );
}

function Verdict({ r }: { r: QResult }) {
  return (
    <div
      style={{
        marginTop: 6,
        fontFamily: JAKARTA,
        fontSize: 12.5,
        color: r.is_correct ? GOOD : BAD,
      }}
    >
      {r.is_correct
        ? "✓ Correct"
        : `✗ Your answer: ${r.user_answer || "—"} · Correct: ${r.correct_answer}`}
      {!r.is_correct && r.evidence ? (
        <span style={{ color: D_SLATE2 }}> — {r.evidence}</span>
      ) : null}
    </div>
  );
}

function Feedback({ nums, results }: { nums: number[]; results: Map<number, QResult> }) {
  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${D_LINE}`, paddingTop: 12 }}>
      {nums.map((n) => {
        const r = results.get(n);
        if (!r) return null;
        return (
          <div
            key={n}
            style={{
              fontFamily: JAKARTA,
              fontSize: 12.5,
              color: r.is_correct ? GOOD : BAD,
              lineHeight: 1.7,
            }}
          >
            <b>{n}.</b>{" "}
            {r.is_correct
              ? `✓ ${r.correct_answer}`
              : `✗ ${r.user_answer || "—"} → ${r.correct_answer}`}
          </div>
        );
      })}
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      style={{
        fontFamily: SANS,
        fontSize: 13,
        color: BAD,
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: 10,
        padding: "10px 12px",
        margin: "14px 0 0",
      }}
    >
      {children}
    </p>
  );
}

// ---- helpers ---------------------------------------------------------------

type Seg = { type: "text"; value: string } | { type: "gap"; number: number };
function splitGaps(text: string): Seg[] {
  const out: Seg[] = [];
  const re = /\((\d+)\)\s*_+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ type: "text", value: text.slice(last, m.index) });
    out.push({ type: "gap", number: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

function roman(n: number): string {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] ?? String(n);
}
