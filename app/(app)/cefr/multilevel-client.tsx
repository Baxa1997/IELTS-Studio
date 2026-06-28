"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlignLeft, ArrowLeft, ArrowRight, BookOpen, Clock, FileText, Layers, ListChecks, ListOrdered, Loader2, MessageCircle, PenLine, Send, SquarePen, X } from "lucide-react";

import { Typewriter } from "@/components/typewriter";
import { AiGenerateSection, AiGenerateButton } from "@/components/ai-generate-section";
import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

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
const LINE = "#ECEAF2";
const TINT = "#F4F4FE";
const TINT_BORDER = "#D8DAF3";
const GOOD = "#15803d";
const BAD = "#b91c1c";

// ---- Engine call -----------------------------------------------------------

async function callEngine<T>(path: string, body: unknown): Promise<T> {
  const backend = clientEnv.aiBackendUrl;
  if (!backend) {
    throw new Error("AI backend isn’t configured. Set NEXT_PUBLIC_AI_BACKEND_URL to the engine URL.");
  }
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Your session expired — please sign in again.");

  const res = await fetch(`${backend}/multilevel/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    detail?: string | { message?: string };
    message?: string;
  };
  if (!res.ok) {
    const detail = typeof json.detail === "string" ? json.detail : json.detail?.message;
    throw new Error(detail ?? json.message ?? `Request failed (${res.status}).`);
  }
  return json as T;
}

// ---- Types (mirror the engine render views) --------------------------------

type Options = Record<string, string>;
type P1 = { part: 1; cefr: string; instruction: string; title: string; text_with_gaps: string };
type P2 = {
  part: 2; cefr: string; instruction: string; theme: string;
  texts: { letter: string; title: string; body: string }[];
  statements: { number: number; text: string }[];
};
type P3 = {
  part: 3; cefr: string; instruction: string; headings: Options;
  paragraphs: { number: number; question: number; text: string }[];
};
type P4 = {
  part: 4; cefr: string; title: string; text: string; instruction_mcq: string; instruction_tfn: string;
  mcq: { number: number; stem: string; options: Options }[];
  tfn: { number: number; statement: string }[];
};
type P5 = {
  part: 5; cefr: string; title: string; text: string; instruction_gap: string; instruction_mcq: string;
  gaps: { number: number; sentence: string }[];
  mcq: { number: number; stem: string; options: Options }[];
};
type ReadingPart = P1 | P2 | P3 | P4 | P5;
type ReadingPaper = { id: string; paper: "reading"; parts: ReadingPart[] };

type QResult = { number: number; user_answer: string; correct_answer: string; is_correct: boolean; evidence: string };
type ReadingGrade = { score: number; max_score: number; parts: { part: number; results: QResult[] }[] };

type WritingTask = {
  task: string; cefr: string; register: string; target_words: number; word_range: [number, number];
  prompt: string; required_content_points: string[];
  situation?: string; problem?: string; question?: string; forum_context?: string;
};
type WritingPaper = { id: string; paper: "writing"; tasks: WritingTask[] };
type WritingGrade = {
  task_id: string; gradable: boolean; message?: string; cefr?: string;
  model_answer?: string; word_count?: number; in_range?: boolean;
  scores?: { task_achievement: number; coherence: number; lexical: number; grammar: number; register: number };
  overall_0_100?: number; estimated_cefr?: string;
  strengths?: string[]; improvements?: string[];
  corrected_sentences?: { original: string; improved: string }[]; examiner_comment?: string;
};

// ---- Top-level -------------------------------------------------------------

type Tab = "reading" | "writing";
type ReadingReq = { scope: "full" } | { scope: "part"; part: number };
type WritingReq = { scope: "full" } | { scope: "task"; task: string };
type View =
  | { kind: "reading"; paper: ReadingPaper; req: ReadingReq }
  | { kind: "writing"; paper: WritingPaper; req: WritingReq };

export function MultilevelClient() {
  const [tab, setTab] = useState<Tab>("reading");
  const [view, setView] = useState<View | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // the card key currently generating
  const [error, setError] = useState<string | null>(null);

  async function startReading(req: ReadingReq, key: string) {
    if (busy) return;
    setBusy(key); setError(null);
    try {
      const paper = await callEngine<ReadingPaper>("reading/generate", req);
      setView({ kind: "reading", paper, req });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(null);
    }
  }

  async function startWriting(req: WritingReq, key: string) {
    if (busy) return;
    setBusy(key); setError(null);
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

  if (view?.kind === "reading") {
    return (
      <ReadingRunner
        key={view.paper.id}
        paper={view.paper}
        regenBusy={!!busy}
        onNew={() => void startReading(view.req, "new")}
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
      onReading={(req, key) => void startReading(req, key)}
      onWriting={(req, key) => void startWriting(req, key)}
    />
  );
}

// ---- Hub (tabbed, full-width landing) --------------------------------------

const READING_PARTS = [
  { part: 1, title: "Sentence gap-fill", desc: "Type the missing words to complete a short text.", level: "B1", count: 6, Icon: AlignLeft },
  { part: 2, title: "Text matching", desc: "Match eight statements to ten short notices.", level: "B1–B2", count: 8, Icon: Layers },
  { part: 3, title: "Heading matching", desc: "Choose the best heading for each paragraph.", level: "B2", count: 6, Icon: ListOrdered },
  { part: 4, title: "Multiple choice + T/F/NI", desc: "An academic passage with MCQ and True / False / Not Given.", level: "B2–C1", count: 9, Icon: ListChecks },
  { part: 5, title: "Summary + multiple choice", desc: "Fill the summary gaps, then answer multiple choice.", level: "C1", count: 6, Icon: FileText },
];

const WRITING_TASKS_META = [
  { task: "1.1", title: "Informal message", desc: "A short note to a friend.", level: "B1", Icon: SquarePen },
  { task: "1.2", title: "Formal letter", desc: "A letter to a manager or an official.", level: "B2", Icon: PenLine },
  { task: "2", title: "Forum opinion post", desc: "An argued response to an online discussion.", level: "C1", Icon: FileText },
];

function Hub({ tab, onTab, busy, error, onReading, onWriting }: {
  tab: Tab; onTab: (t: Tab) => void; busy: string | null; error: string | null;
  onReading: (req: ReadingReq, key: string) => void;
  onWriting: (req: WritingReq, key: string) => void;
}) {
  return (
    <div style={{ width: "100%", padding: "26px clamp(16px,3vw,28px) 64px", fontFamily: SANS, color: INK }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,3.6vw,38px)", lineHeight: 1.05, letterSpacing: "-.4px", margin: 0, color: INK }}>CEFR practice</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0", maxWidth: 660 }}>
            The Uzbekistan Multilevel (DTM) exam — a 5-part / 35-question Reading paper and a
            3-task Writing paper, generated fresh and graded instantly.
          </p>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, background: TINT, border: `1px solid ${TINT_BORDER}`, color: INDIGO, padding: "8px 14px", borderRadius: 999, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
          <Layers size={15} /> B1 → C1
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, background: "#F1F1F8", border: "1px solid #ECEAF2", borderRadius: 14, padding: 5, marginTop: 22, maxWidth: 520 }}>
        <TabButton active={tab === "reading"} onClick={() => onTab("reading")} icon={<BookOpen size={17} />} label="Reading paper" sub="5 parts · 35 questions" />
        <TabButton active={tab === "writing"} onClick={() => onTab("writing")} icon={<PenLine size={17} />} label="Writing paper" sub="3 tasks · B1 → C1" />
      </div>

      {tab === "reading" ? (
        <>
          <div style={{ marginTop: 18, marginBottom: 28 }}>
            <AiGenerateSection
              title="Full reading paper"
              description="Five original passages in the exact DTM format — 35 questions, rising B1 → C1, auto-graded with the evidence behind every answer."
              cta={<AiGenerateButton label="Generate full paper" busyLabel="Writing your paper…" generating={busy === "r-full"} busy={!!busy} minWidth={200} onClick={() => onReading({ scope: "full" }, "r-full")} />}
            />
          </div>
          <SectionLabel>Or practise a single part</SectionLabel>
          <Grid>
            {READING_PARTS.map((p) => (
              <PracticeCard key={p.part} Icon={p.Icon} eyebrow={`Part ${p.part}`} title={p.title} desc={p.desc} level={p.level} meta={`${p.count} questions`} loading={busy === `r-${p.part}`} disabled={!!busy} onClick={() => onReading({ scope: "part", part: p.part }, `r-${p.part}`)} />
            ))}
          </Grid>
        </>
      ) : (
        <>
          <div style={{ marginTop: 18, marginBottom: 28 }}>
            <AiGenerateSection
              title="Full writing paper"
              description="Three prompts at rising levels — an informal note (B1), a formal letter (B2) and a forum post (C1), graded on a calibrated CEFR rubric."
              cta={<AiGenerateButton label="Generate full paper" busyLabel="Writing your prompts…" generating={busy === "w-full"} busy={!!busy} minWidth={200} onClick={() => onWriting({ scope: "full" }, "w-full")} />}
            />
          </div>
          <SectionLabel>Or practise a single task</SectionLabel>
          <Grid>
            {WRITING_TASKS_META.map((t) => (
              <PracticeCard key={t.task} Icon={t.Icon} eyebrow={`Task ${t.task}`} title={t.title} desc={t.desc} level={t.level} meta="Graded · model answer" loading={busy === `w-${t.task}`} disabled={!!busy} onClick={() => onWriting({ scope: "task", task: t.task }, `w-${t.task}`)} />
            ))}
          </Grid>
        </>
      )}

      {error ? <Alert>{error}</Alert> : null}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: "#9A99A8" }}>
        Original content in the Uzbekistan Multilevel (DTM) format. Not affiliated with or endorsed by the State Testing Centre.
      </p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} style={{ flex: 1, display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", background: active ? "#fff" : "transparent", color: active ? INDIGO : MUTED, boxShadow: active ? "0 2px 8px -3px rgba(28,27,46,.28)" : "none", transition: "background .15s ease" }}>
      <span style={{ display: "flex", flex: "none", color: active ? INDIGO : "#8A899A" }}>{icon}</span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontFamily: SANS, fontWeight: active ? 700 : 600, fontSize: 14.5 }}>{label}</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: active ? "#7C78C9" : "#9A99A8", marginTop: 2 }}>{sub}</span>
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>{children}</span>
      <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.1)" }} />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>{children}</div>;
}

function PracticeCard({ Icon, eyebrow, title, desc, level, meta, loading, disabled, onClick }: {
  Icon: typeof BookOpen; eyebrow: string; title: string; desc: string; level: string; meta: string;
  loading: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="lp-hover" style={{ position: "relative", background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12, textAlign: "left", fontFamily: SANS, cursor: disabled ? "default" : "pointer", opacity: disabled && !loading ? 0.55 : 1, boxShadow: "0 1px 3px rgba(28,27,46,.04)", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: "#EFEEFC", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon size={19} /></span>
        <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: TINT, color: INDIGO }}>{level}</span>
      </div>
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11.5, color: FAINT, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 3 }}>{eyebrow}</div>
        <h4 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, lineHeight: 1.25, margin: "0 0 4px", color: INK }}>{title}</h4>
        <span style={{ fontSize: 13.5, color: "#7A7989", fontWeight: 500, lineHeight: 1.5 }}>{desc}</span>
      </div>
      <div style={{ height: 1, background: "rgba(28,27,46,.07)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#8A899A" }}>{meta}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: INDIGO, fontSize: 14.5, fontWeight: 600 }}>
          {loading ? (<><Loader2 className="animate-spin" size={15} /> Generating…</>) : (<>Start <ArrowRight size={15} strokeWidth={2.2} /></>)}
        </span>
      </div>
    </button>
  );
}

// ---- Reading ---------------------------------------------------------------

function ReadingRunner({ paper, regenBusy, onNew, onExit }: { paper: ReadingPaper; regenBusy: boolean; onNew: () => void; onExit: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<ReadingGrade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const set = (n: number | string, v: string) => setAnswers((a) => ({ ...a, [String(n)]: v }));

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await callEngine<ReadingGrade>("reading/grade", { item_id: paper.id, answers });
      setGrade(res);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed.");
    } finally {
      setBusy(false);
    }
  };

  // Keep a stable onExpire so the timer interval is set once (mirrors the IELTS runner).
  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; });
  const onExpire = useCallback(() => void submitRef.current(), []);

  const graded = !!grade;
  const nums = useMemo(() => questionNumbers(paper.parts), [paper.parts]);
  const coach = useMemo(() => coachContext(paper.parts), [paper.parts]);
  const total = nums.length;
  const answeredCount = nums.filter((n) => (answers[String(n)] ?? "").trim()).length;
  const allowance = Math.max(600, total * 90);
  const pct = total ? Math.round((answeredCount / total) * 100) : 0;
  const label = paper.parts.length > 1 ? `Reading · ${paper.parts.length} parts` : `Reading · Part ${paper.parts[0]?.part}`;

  const correctByNum = new Map<number, QResult>();
  grade?.parts.forEach((p) => p.results.forEach((r) => correctByNum.set(r.number, r)));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "#fff", fontFamily: SANS, color: INK, overflow: "hidden" }}>
      {/* Top bar: exit · timer · submit (mirrors the IELTS reading runner) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "12px 24px", flex: "none", borderBottom: `1px solid ${LINE}` }}>
        <div style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
          <button type="button" onClick={onExit} aria-label="Exit practice" style={{ width: 42, height: 42, borderRadius: 999, border: "1.5px solid #EAE8F2", background: "#fff", color: MUTED, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" }}>
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INDIGO, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        </div>
        <div style={{ justifySelf: "center" }}>
          {!graded ? (
            <ReadingTimer seconds={allowance} onExpire={onExpire}>
              {(text, left) => {
                const warn = left <= 120;
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 20px", borderRadius: 999, background: warn ? "#FDECEC" : "#F4F3FC", border: `1.5px solid ${warn ? "#F3B4B4" : "#E4E2F4"}` }} aria-label="time remaining">
                    <Clock size={15} style={{ color: warn ? "#B91C1C" : INDIGO }} />
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 18, letterSpacing: ".02em", color: warn ? "#B91C1C" : INDIGO }}>{text}</span>
                  </span>
                );
              }}
            </ReadingTimer>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 999, background: "#ECEBFB", border: `1.5px solid ${TINT_BORDER}` }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>{grade.score} / {grade.max_score}</span>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INDIGO }}>{grade.max_score ? Math.round((grade.score / grade.max_score) * 100) : 0}%</span>
            </span>
          )}
        </div>
        <div style={{ justifySelf: "end" }}>
          {!graded ? (
            <button type="button" onClick={() => void submit()} disabled={busy} style={topActionBtn(busy)}>{busy ? "Marking…" : "Submit answers"}</button>
          ) : (
            <button type="button" onClick={onNew} disabled={regenBusy} style={topActionBtn(regenBusy)}>{regenBusy ? "Generating…" : "New paper"}</button>
          )}
        </div>
      </div>

      {/* Strip: status + progress + coach toggle */}
      <div style={{ flex: "none", background: "#FAFAFD", borderBottom: `1px solid ${LINE}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "11px 28px", flexWrap: "wrap" }}>
          <div style={{ fontSize: 14.5, color: "#4A4660" }}>
            {graded ? (<><b style={{ color: INK }}>Marked.</b> Review each answer below — the coach can explain any of them.</>) : (<>Answer all {total} questions, then submit.</>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>{answeredCount} of {total} answered</div>
            {!coachOpen ? (
              <button type="button" onClick={() => setCoachOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 9, border: `1.5px solid ${TINT_BORDER}`, background: "#fff", color: INDIGO, fontFamily: SANS, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <MessageCircle size={15} /> Coach
              </button>
            ) : null}
          </div>
        </div>
        <div style={{ height: 3, background: "#EEEDF6" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: INDIGO, transition: "width .3s ease" }} />
        </div>
      </div>

      {/* Split: reading (70%) | coach (30%) */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "clamp(20px,3vw,30px) clamp(16px,3vw,30px) 90px", minHeight: 0, borderRight: coachOpen ? `1px solid ${LINE}` : "none" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {graded ? <ScoreBanner score={grade.score} max={grade.max_score} /> : null}
            {paper.parts.map((part) => (
              <PartBlock key={part.part} part={part} answers={answers} set={set} results={correctByNum} graded={graded} />
            ))}
            {error ? <Alert>{error}</Alert> : null}
          </div>
        </div>

        {coachOpen ? (
          <aside style={{ width: "30%", minWidth: 300, maxWidth: 460, flex: "none", minHeight: 0, display: "flex" }}>
            <CefrCoach passageBody={coach.body} questions={coach.questions} phase={graded ? "results" : "reading"} onClose={() => setCoachOpen(false)} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/** Countdown that fires `onExpire` once at zero; render-prop exposes raw seconds left. */
function ReadingTimer({ seconds, onExpire, children }: { seconds: number; onExpire: () => void; children: (text: string, left: number) => React.ReactNode }) {
  const [left, setLeft] = useState(seconds);
  const firedRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!firedRef.current) { firedRef.current = true; onExpire(); }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);
  const mm = Math.floor(left / 60);
  const ss = left % 60;
  return <>{children(`${mm}:${String(ss).padStart(2, "0")}`, left)}</>;
}

// ---- Reading coach (inline 30% column, collapsible) ------------------------

type CoachMsg = { role: "student" | "assistant"; content: string; animate?: boolean };

/** The in-test reading coach as a side column. Reuses the same-origin /api/reading/tutor
 *  route (strategy-only while phase==="reading"; explanations after submit), fed the
 *  CEFR paper's assembled text + answer-free questions. Closeable; reopened from the strip. */
function CefrCoach({ passageBody, questions, phase, onClose }: { passageBody: string; questions: string; phase: "reading" | "results"; onClose: () => void }) {
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef({ passageBody, questions, phase });
  useEffect(() => { ctxRef.current = { passageBody, questions, phase }; }, [passageBody, questions, phase]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages, sending]);

  function markAnimated(idx: number) {
    setMessages((m) => (m[idx]?.animate ? m.map((msg, j) => (j === idx ? { ...msg, animate: false } : msg)) : m));
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
        body: JSON.stringify({ question: q, passageTitle: "CEFR Multilevel Reading", passageBody: ctx.passageBody, currentQuestion: "", questions: ctx.questions, phase: ctx.phase, history: prior.slice(-6) }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string; message?: string };
      const reply = res.ok && body.reply ? body.reply : body.message ?? "The coach is busy — try again in a moment.";
      setMessages((m) => [...m, { role: "assistant", content: reply, animate: true }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error — please try again.", animate: true }]);
    } finally {
      setSending(false);
    }
  }

  const hint = phase === "reading" ? "Strategy help only — answers unlock after you submit." : "Ask about any question, trap, or how to improve.";
  const empty = phase === "reading"
    ? "Stuck on a question type or a word? Ask how to approach it — e.g. how to tell False from Not Given. I won’t give answers while the test is live."
    : "Marked. Ask me to explain any question, why a trap worked, or how to get better at a question type.";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FBFBFE", minWidth: 0 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "13px 16px", borderBottom: `1px solid ${LINE}`, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#5B55D6,#3B43B5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={16} />
          </span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK }}>Reading coach</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close coach" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}>
          <X size={18} />
        </button>
      </header>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {messages.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.6, color: MUTED, margin: 0 }}>{empty}</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "student" ? "flex-end" : "flex-start", maxWidth: "88%", padding: "9px 12px", borderRadius: 12, fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap", background: m.role === "student" ? INDIGO : "#fff", color: m.role === "student" ? "#fff" : INK, border: m.role === "student" ? "none" : `1px solid ${LINE}` }}>
              {m.role === "assistant" ? (
                <Typewriter text={m.content} animate={!!m.animate} onReveal={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })} onDone={() => markAnimated(i)} caretColor={MUTED} />
              ) : (
                m.content
              )}
            </div>
          ))
        )}
        {sending ? (
          <span style={{ alignSelf: "flex-start", display: "inline-flex", gap: 5, padding: "9px 12px" }} aria-label="Coach is writing">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: MUTED, animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out` }} />
            ))}
          </span>
        ) : null}
      </div>

      <div style={{ borderTop: `1px solid ${LINE}`, padding: 10, background: "#fff" }}>
        <p style={{ fontFamily: SANS, fontSize: 11, color: "#9a998c", margin: "0 0 8px" }}>{hint}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder="Ask the coach…"
            style={{ flex: 1, minWidth: 0, padding: "9px 11px", border: `1px solid ${TINT_BORDER}`, borderRadius: 10, background: "#fff", fontFamily: SANS, fontSize: 13.5, color: INK }}
          />
          <button type="button" onClick={() => void send()} disabled={sending || !input.trim()} aria-label="Send" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, flex: "none", borderRadius: 10, border: "none", cursor: sending || !input.trim() ? "default" : "pointer", background: INDIGO, color: "#fff", opacity: sending || !input.trim() ? 0.5 : 1 }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function topActionBtn(busy: boolean): React.CSSProperties {
  return { padding: "11px 22px", borderRadius: 12, border: "none", background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 15, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: "0 4px 14px rgba(59,67,181,.28)" };
}

/** All answerable question numbers across the paper's parts (for progress + timing). */
function questionNumbers(parts: ReadingPart[]): number[] {
  const out: number[] = [];
  for (const p of parts) {
    if (p.part === 1) out.push(...splitGaps(p.text_with_gaps).filter((s) => s.type === "gap").map((s) => (s as { number: number }).number));
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
    if (p.part === 1) { body.push(`Part 1 — ${p.title}\n${p.text_with_gaps}`); }
    else if (p.part === 2) {
      body.push(`Part 2 — ${p.theme}\n` + p.texts.map((t) => `${t.letter}. ${t.title}: ${t.body}`).join("\n"));
      qs.push(...p.statements.map((s) => `Q${s.number}: ${s.text}`));
    } else if (p.part === 3) {
      body.push("Part 3 — Headings\n" + p.paragraphs.map((x) => x.text).join("\n\n"));
      qs.push(...p.paragraphs.map((x) => `Q${x.question}: choose the best heading for this paragraph`));
    } else if (p.part === 4) {
      body.push(`Part 4 — ${p.title}\n${p.text}`);
      qs.push(...p.mcq.map((q) => `Q${q.number}: ${q.stem}`), ...p.tfn.map((q) => `Q${q.number}: ${q.statement}`));
    } else if (p.part === 5) {
      body.push(`Part 5 — ${p.title}\n${p.text}`);
      qs.push(...p.gaps.map((g) => `Q${g.number}: ${g.sentence}`), ...p.mcq.map((q) => `Q${q.number}: ${q.stem}`));
    }
  }
  return { body: body.join("\n\n"), questions: qs.join("\n") };
}

function PartBlock({ part, answers, set, results, graded }: {
  part: ReadingPart; answers: Record<string, string>; set: (n: number | string, v: string) => void;
  results: Map<number, QResult>; graded: boolean;
}) {
  return (
    <section style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "clamp(18px,2.2vw,26px)", marginBottom: 18 }}>
      <PartHeading n={part.part} cefr={part.cefr} />
      {part.part === 1 ? <Part1 p={part} answers={answers} set={set} results={results} graded={graded} /> : null}
      {part.part === 2 ? <Part2 p={part} answers={answers} set={set} results={results} graded={graded} /> : null}
      {part.part === 3 ? <Part3 p={part} answers={answers} set={set} results={results} graded={graded} /> : null}
      {part.part === 4 ? <Part4 p={part} answers={answers} set={set} results={results} graded={graded} /> : null}
      {part.part === 5 ? <Part5 p={part} answers={answers} set={set} results={results} graded={graded} /> : null}
    </section>
  );
}

function Part1({ p, answers, set, results, graded }: { p: P1; answers: Record<string, string>; set: (n: number | string, v: string) => void; results: Map<number, QResult>; graded: boolean }) {
  const segments = useMemo(() => splitGaps(p.text_with_gaps), [p.text_with_gaps]);
  return (
    <>
      <Instruction>{p.instruction}</Instruction>
      <h3 style={{ fontFamily: SERIF, fontSize: 19, color: INK, margin: "0 0 10px" }}>{p.title}</h3>
      <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 2.1, color: "#2b3147", margin: 0 }}>
        {segments.map((s, i) =>
          s.type === "text" ? (
            <span key={i}>{s.value}</span>
          ) : (
            <GapInput key={i} n={s.number} answers={answers} set={set} results={results} graded={graded} width={120} />
          ),
        )}
      </p>
      {graded ? <Feedback nums={[1, 2, 3, 4, 5, 6]} results={results} /> : null}
    </>
  );
}

function Part2({ p, answers, set, results, graded }: { p: P2; answers: Record<string, string>; set: (n: number | string, v: string) => void; results: Map<number, QResult>; graded: boolean }) {
  const letters = p.texts.map((t) => t.letter);
  return (
    <>
      <Instruction>{p.instruction}</Instruction>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 18 }}>
        {p.texts.map((t) => (
          <div key={t.letter} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 12px", background: "#FBFBFE" }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: INK }}>{t.letter}. {t.title}</div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, lineHeight: 1.55, marginTop: 3 }}>{t.body}</div>
          </div>
        ))}
      </div>
      {p.statements.map((s) => (
        <Row key={s.number} n={s.number} text={s.text} results={results} graded={graded}>
          <LetterSelect n={s.number} letters={letters} answers={answers} set={set} disabled={graded} />
        </Row>
      ))}
    </>
  );
}

function Part3({ p, answers, set, results, graded }: { p: P3; answers: Record<string, string>; set: (n: number | string, v: string) => void; results: Map<number, QResult>; graded: boolean }) {
  const letters = Object.keys(p.headings);
  return (
    <>
      <Instruction>{p.instruction}</Instruction>
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", background: "#FBFBFE", marginBottom: 16 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: FAINT, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>List of headings</div>
        {letters.map((l) => (
          <div key={l} style={{ fontFamily: SANS, fontSize: 13.5, color: INK, lineHeight: 1.7 }}><b>{l}.</b> {p.headings[l]}</div>
        ))}
      </div>
      {p.paragraphs.map((para, i) => (
        <div key={para.question} style={{ marginBottom: 16 }}>
          <Row n={para.question} text={`Paragraph ${roman(i + 1)}`} results={results} graded={graded}>
            <LetterSelect n={para.question} letters={letters} answers={answers} set={set} disabled={graded} />
          </Row>
          <p style={{ fontFamily: SERIF, fontSize: 15, lineHeight: 1.75, color: "#2b3147", margin: "8px 0 0" }}>{para.text}</p>
        </div>
      ))}
    </>
  );
}

function Part4({ p, answers, set, results, graded }: { p: P4; answers: Record<string, string>; set: (n: number | string, v: string) => void; results: Map<number, QResult>; graded: boolean }) {
  return (
    <>
      <Passage title={p.title} text={p.text} />
      <Instruction>{p.instruction_mcq}</Instruction>
      {p.mcq.map((q) => (
        <McqRow key={q.number} number={q.number} stem={q.stem} options={q.options} answers={answers} set={set} results={results} graded={graded} />
      ))}
      <Instruction>{p.instruction_tfn}</Instruction>
      {p.tfn.map((q) => (
        <McqRow key={q.number} number={q.number} stem={q.statement}
          options={{ A: "True", B: "False", C: "No Information" }}
          answers={answers} set={set} results={results} graded={graded} />
      ))}
    </>
  );
}

function Part5({ p, answers, set, results, graded }: { p: P5; answers: Record<string, string>; set: (n: number | string, v: string) => void; results: Map<number, QResult>; graded: boolean }) {
  return (
    <>
      <Passage title={p.title} text={p.text} />
      <Instruction>{p.instruction_gap}</Instruction>
      {p.gaps.map((g) => {
        const segs = splitGaps(g.sentence.includes("_") ? g.sentence.replace(/_+/, `(${g.number}) ______`) : `${g.sentence} (${g.number}) ______`);
        return (
          <p key={g.number} style={{ fontFamily: SERIF, fontSize: 15.5, lineHeight: 2, color: "#2b3147", margin: "0 0 8px" }}>
            {segs.map((s, i) => s.type === "text" ? <span key={i}>{s.value}</span> : <GapInput key={i} n={g.number} answers={answers} set={set} results={results} graded={graded} width={120} />)}
          </p>
        );
      })}
      {graded ? <Feedback nums={p.gaps.map((g) => g.number)} results={results} /> : null}
      <div style={{ height: 10 }} />
      <Instruction>{p.instruction_mcq}</Instruction>
      {p.mcq.map((q) => (
        <McqRow key={q.number} number={q.number} stem={q.stem} options={q.options} answers={answers} set={set} results={results} graded={graded} />
      ))}
    </>
  );
}

// ---- Writing ---------------------------------------------------------------

function WritingRunner({ paper, regenBusy, onNew, onExit }: { paper: WritingPaper; regenBusy: boolean; onNew: () => void; onExit: () => void }) {
  const label = paper.tasks.length > 1 ? `Writing · ${paper.tasks.length} tasks` : `Writing · Task ${paper.tasks[0]?.task}`;
  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "clamp(20px,3vw,32px) clamp(16px,3vw,24px) 80px" }}>
      <RunnerHeader onExit={onExit} label={label} />
      {paper.tasks.map((t) => (
        <WritingTaskCard key={t.task} itemId={paper.id} task={t} />
      ))}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <PrimaryButton onClick={onNew} disabled={regenBusy}>{regenBusy ? "Generating…" : "New paper"}</PrimaryButton>
        <GhostButton onClick={onExit}>Back to CEFR</GhostButton>
      </div>
    </div>
  );
}

function WritingTaskCard({ itemId, task }: { itemId: string; task: WritingTask }) {
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<WritingGrade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  async function gradeIt() {
    setBusy(true); setError(null);
    try {
      setGrade(await callEngine<WritingGrade>("writing/grade", { item_id: itemId, task_id: task.task, answer }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "clamp(18px,2.2vw,26px)", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 13, color: "#fff", background: INDIGO, borderRadius: 8, padding: "3px 10px" }}>Task {task.task}</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: INDIGO }}>{task.cefr}</span>
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT }}>{task.word_range[0]}–{task.word_range[1]} words · {task.register}</span>
      </div>
      <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.7, color: INK, margin: "0 0 12px" }}>{task.prompt}</p>
      {task.required_content_points.length ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, marginBottom: 12 }}>
          <b style={{ color: FAINT }}>Cover:</b> {task.required_content_points.join(" · ")}
        </div>
      ) : null}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={busy}
        placeholder="Write your response here…"
        rows={8}
        style={{ width: "100%", fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: INK, padding: 14, borderRadius: 12, border: `1px solid ${TINT_BORDER}`, resize: "vertical", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: wordCountColor(words, task.word_range) }}>{words} words</span>
        <PrimaryButton onClick={gradeIt} disabled={busy || words < 5}>{busy ? "Grading…" : grade ? "Re-grade" : "Grade this task"}</PrimaryButton>
      </div>
      {error ? <Alert>{error}</Alert> : null}
      {grade ? <WritingResult g={grade} /> : null}
    </section>
  );
}

function WritingResult({ g }: { g: WritingGrade }) {
  if (!g.gradable) return <Alert>{g.message ?? "Not gradable yet."}</Alert>;
  const s = g.scores;
  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: INDIGO }}>{g.estimated_cefr}</span>
        <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>overall {g.overall_0_100}/100 · {g.word_count} words {g.in_range ? "(in range)" : "(out of range)"}</span>
      </div>
      {s ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginBottom: 14 }}>
          {([["Task", s.task_achievement], ["Coherence", s.coherence], ["Lexis", s.lexical], ["Grammar", s.grammar], ["Register", s.register]] as const).map(([k, v]) => (
            <div key={k} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: INK }}>{v}<span style={{ fontSize: 12, color: FAINT }}>/5</span></div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED }}>{k}</div>
            </div>
          ))}
        </div>
      ) : null}
      {g.examiner_comment ? <p style={{ fontFamily: SANS, fontSize: 13.5, color: INK, lineHeight: 1.6, margin: "0 0 12px" }}>{g.examiner_comment}</p> : null}
      <BulletList title="Strengths" items={g.strengths} color={GOOD} />
      <BulletList title="Improve" items={g.improvements} color="#b45309" />
      {g.corrected_sentences?.length ? (
        <div style={{ marginTop: 10 }}>
          <SmallTitle>Suggested fixes</SmallTitle>
          {g.corrected_sentences.map((c, i) => (
            <div key={i} style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.55, marginBottom: 6 }}>
              <div style={{ color: BAD, textDecoration: "line-through" }}>{c.original}</div>
              <div style={{ color: GOOD }}>{c.improved}</div>
            </div>
          ))}
        </div>
      ) : null}
      {g.model_answer ? (
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INDIGO, cursor: "pointer" }}>Show a model answer</summary>
          <p style={{ fontFamily: SERIF, fontSize: 14.5, lineHeight: 1.7, color: "#2b3147", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{g.model_answer}</p>
        </details>
      ) : null}
    </div>
  );
}

// ---- Shared UI -------------------------------------------------------------

function RunnerHeader({ onExit, label }: { onExit: () => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: INDIGO }}>{label}</span>
      <button onClick={onExit} style={{ fontFamily: SANS, fontSize: 13, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>← CEFR</button>
    </div>
  );
}

function ScoreBanner({ score, max }: { score: number; max: number }) {
  const pct = max ? Math.round((score / max) * 100) : 0;
  return (
    <div style={{ background: INDIGO, color: "#fff", borderRadius: 16, padding: "18px 22px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontFamily: SANS, fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}>Your score</div>
        <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700 }}>{score}<span style={{ opacity: 0.7, fontSize: 20 }}> / {max}</span></div>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700 }}>{pct}%</div>
    </div>
  );
}

function PartHeading({ n, cefr }: { n: number; cefr: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 13, color: "#fff", background: INK, borderRadius: 8, padding: "3px 10px" }}>Part {n}</span>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, color: INDIGO }}>{cefr}</span>
    </div>
  );
}

function Passage({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: SERIF, fontSize: 19, color: INK, margin: "0 0 8px" }}>{title}</h3>
      {text.split(/\n+/).filter(Boolean).map((para, i) => (
        <p key={i} style={{ fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.8, color: "#2b3147", margin: "0 0 10px" }}>{para}</p>
      ))}
    </div>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: SANS, fontSize: 13, fontStyle: "italic", color: MUTED, lineHeight: 1.55, margin: "14px 0 12px", paddingLeft: 12, borderLeft: `3px solid ${TINT_BORDER}` }}>{children}</p>;
}

function Row({ n, text, results, graded, children }: { n: number; text: string; results: Map<number, QResult>; graded: boolean; children: React.ReactNode }) {
  const r = graded ? results.get(n) : undefined;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderTop: `1px solid ${LINE}` }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: INK, minWidth: 22 }}>{n}.</span>
      <div style={{ flex: 1, fontFamily: SANS, fontSize: 14, color: INK, lineHeight: 1.5 }}>
        {text}
        {r ? <Verdict r={r} /> : null}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function McqRow({ number, stem, options, answers, set, results, graded }: {
  number: number; stem: string; options: Options; answers: Record<string, string>; set: (n: number | string, v: string) => void; results: Map<number, QResult>; graded: boolean;
}) {
  const r = graded ? results.get(number) : undefined;
  const chosen = answers[String(number)] ?? "";
  return (
    <div style={{ padding: "10px 0", borderTop: `1px solid ${LINE}` }}>
      <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: INK, marginBottom: 8 }}>{number}. {stem}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.entries(options).map(([letter, label]) => {
          const isChosen = chosen === letter;
          const isAnswer = r?.correct_answer === letter;
          const border = graded && isAnswer ? GOOD : graded && isChosen ? BAD : isChosen ? INDIGO : LINE;
          return (
            <label key={letter} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: SANS, fontSize: 13.5, color: INK, padding: "7px 11px", borderRadius: 9, border: `1px solid ${border}`, background: isChosen ? TINT : "#fff", cursor: graded ? "default" : "pointer" }}>
              <input type="radio" name={`q${number}`} value={letter} checked={isChosen} disabled={graded} onChange={() => set(number, letter)} />
              <b>{letter})</b> {label}
            </label>
          );
        })}
      </div>
      {r ? <Verdict r={r} /> : null}
    </div>
  );
}

function GapInput({ n, answers, set, results, graded, width }: { n: number; answers: Record<string, string>; set: (n: number | string, v: string) => void; results: Map<number, QResult>; graded: boolean; width: number }) {
  const r = graded ? results.get(n) : undefined;
  const border = r ? (r.is_correct ? GOOD : BAD) : TINT_BORDER;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", verticalAlign: "middle", margin: "0 3px" }}>
      <input
        value={answers[String(n)] ?? ""}
        onChange={(e) => set(n, e.target.value)}
        disabled={graded}
        aria-label={`Gap ${n}`}
        style={{ width, fontFamily: SANS, fontSize: 14, color: INK, textAlign: "center", border: "none", borderBottom: `2px solid ${border}`, background: "transparent", padding: "1px 4px" }}
      />
      <span style={{ fontFamily: SANS, fontSize: 10, color: FAINT, textAlign: "center" }}>{n}</span>
      {r && !r.is_correct ? <span style={{ fontFamily: SANS, fontSize: 11, color: GOOD, textAlign: "center" }}>{r.correct_answer}</span> : null}
    </span>
  );
}

function LetterSelect({ n, letters, answers, set, disabled }: { n: number; letters: string[]; answers: Record<string, string>; set: (n: number | string, v: string) => void; disabled: boolean }) {
  return (
    <select
      value={answers[String(n)] ?? ""}
      onChange={(e) => set(n, e.target.value)}
      disabled={disabled}
      aria-label={`Answer ${n}`}
      style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: INK, background: "#F4F4FB", border: `1px solid ${TINT_BORDER}`, padding: "6px 10px", borderRadius: 8, cursor: disabled ? "default" : "pointer" }}
    >
      <option value="">—</option>
      {letters.map((l) => <option key={l} value={l}>{l}</option>)}
    </select>
  );
}

function Verdict({ r }: { r: QResult }) {
  return (
    <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 12.5, color: r.is_correct ? GOOD : BAD }}>
      {r.is_correct ? "✓ Correct" : `✗ Your answer: ${r.user_answer || "—"} · Correct: ${r.correct_answer}`}
      {!r.is_correct && r.evidence ? <span style={{ color: FAINT }}> — {r.evidence}</span> : null}
    </div>
  );
}

function Feedback({ nums, results }: { nums: number[]; results: Map<number, QResult> }) {
  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>
      {nums.map((n) => {
        const r = results.get(n);
        if (!r) return null;
        return (
          <div key={n} style={{ fontFamily: SANS, fontSize: 12.5, color: r.is_correct ? GOOD : BAD, lineHeight: 1.7 }}>
            <b>{n}.</b> {r.is_correct ? `✓ ${r.correct_answer}` : `✗ ${r.user_answer || "—"} → ${r.correct_answer}`}
          </div>
        );
      })}
    </div>
  );
}

function BulletList({ title, items, color }: { title: string; items?: string[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <SmallTitle>{title}</SmallTitle>
      <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
        {items.map((it, i) => <li key={i} style={{ fontFamily: SANS, fontSize: 13, color: INK, lineHeight: 1.6 }}><span style={{ color }}>•</span> {it}</li>)}
      </ul>
    </div>
  );
}

function SmallTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, color: FAINT, textTransform: "uppercase", letterSpacing: ".06em" }}>{children}</div>;
}

function Alert({ children }: { children: React.ReactNode }) {
  return <p role="alert" style={{ fontFamily: SANS, fontSize: 13, color: BAD, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px", margin: "14px 0 0" }}>{children}</p>;
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: "#fff", background: disabled ? "#A7ABBA" : INDIGO, border: "none", borderRadius: 11, padding: "11px 20px", cursor: disabled ? "default" : "pointer", boxShadow: disabled ? "none" : "0 8px 18px -8px rgba(59,67,181,.55)" }}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: MUTED, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 11, padding: "11px 18px", cursor: "pointer" }}>
      {children}
    </button>
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

function wordCountColor(n: number, [lo, hi]: [number, number]): string {
  return n === 0 ? FAINT : n < lo || n > hi ? "#b45309" : GOOD;
}
