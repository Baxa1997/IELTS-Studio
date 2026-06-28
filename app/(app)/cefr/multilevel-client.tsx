"use client";

import { useMemo, useState } from "react";
import { BookOpen, Layers, PenLine } from "lucide-react";

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

type Mode = "menu" | "reading" | "writing";

export function MultilevelClient() {
  const [mode, setMode] = useState<Mode>("menu");

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "clamp(20px,3vw,36px) 20px 80px" }}>
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 11px", borderRadius: 999, background: TINT, border: `1px solid ${TINT_BORDER}`, color: INDIGO, fontFamily: SANS, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
          <Layers size={14} /> CEFR · B1→C1
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(26px,3.4vw,34px)", color: INK, margin: 0, fontWeight: 600 }}>
          CEFR practice
        </h1>
        <p style={{ fontFamily: SANS, color: MUTED, fontSize: 15, margin: "8px 0 0", lineHeight: 1.6 }}>
          The Uzbekistan Multilevel (State Testing Centre / DTM) format — a 5-part, 35-question
          Reading paper and a 3-task Writing paper, generated fresh and graded instantly.
        </p>
      </header>

      {mode === "menu" ? <Menu onPick={setMode} /> : null}
      {mode === "reading" ? <ReadingRunner onExit={() => setMode("menu")} /> : null}
      {mode === "writing" ? <WritingRunner onExit={() => setMode("menu")} /> : null}
    </div>
  );
}

function Menu({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
      <MenuCard
        Icon={BookOpen}
        title="Reading paper"
        meta="5 parts · 35 questions · 60 min"
        body="Gap-fill, text matching, headings, multiple choice + True/False/No Information, and an academic summary. Auto-graded."
        cta="Generate reading paper"
        onClick={() => onPick("reading")}
      />
      <MenuCard
        Icon={PenLine}
        title="Writing paper"
        meta="3 tasks · B1 → B2 → C1"
        body="An informal note to a friend, a formal letter to a manager, and a forum opinion post. Graded against a calibrated CEFR rubric."
        cta="Generate writing paper"
        onClick={() => onPick("writing")}
      />
    </div>
  );
}

function MenuCard({ Icon, title, meta, body, cta, onClick }: {
  Icon: typeof BookOpen; title: string; meta: string; body: string; cta: string; onClick: () => void;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 22, display: "flex", flexDirection: "column" }}>
      <span style={{ width: 40, height: 40, borderRadius: 11, background: TINT, border: `1px solid ${TINT_BORDER}`, color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon size={20} />
      </span>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK }}>{title}</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 12.5, color: INDIGO, margin: "3px 0 10px" }}>{meta}</div>
      <p style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 18px", flex: 1 }}>{body}</p>
      <PrimaryButton onClick={onClick}>{cta}</PrimaryButton>
    </div>
  );
}

// ---- Reading ---------------------------------------------------------------

function ReadingRunner({ onExit }: { onExit: () => void }) {
  const [paper, setPaper] = useState<ReadingPaper | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<ReadingGrade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (n: number | string, v: string) => setAnswers((a) => ({ ...a, [String(n)]: v }));

  async function generate() {
    setBusy(true); setError(null); setGrade(null); setAnswers({});
    try {
      setPaper(await callEngine<ReadingPaper>("reading/generate", { scope: "full" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!paper) return;
    setBusy(true); setError(null);
    try {
      const res = await callEngine<ReadingGrade>("reading/grade", { item_id: paper.id, answers });
      setGrade(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!paper) {
    return (
      <Launch
        title="Reading paper"
        blurb="Five original passages in the exact DTM format — 35 questions, difficulty rising B1 → C1."
        busyLabel="Writing your paper… ~40s"
        busy={busy}
        error={error}
        onGenerate={generate}
        onExit={onExit}
      />
    );
  }

  const correctByNum = new Map<number, QResult>();
  grade?.parts.forEach((p) => p.results.forEach((r) => correctByNum.set(r.number, r)));

  return (
    <div>
      <RunnerHeader onExit={onExit} label="Reading · 35 questions" />
      {grade ? <ScoreBanner score={grade.score} max={grade.max_score} /> : null}

      {paper.parts.map((part) => (
        <PartBlock key={part.part} part={part} answers={answers} set={set} results={correctByNum} graded={!!grade} />
      ))}

      {error ? <Alert>{error}</Alert> : null}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        {!grade ? (
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? "Grading…" : "Submit answers"}</PrimaryButton>
        ) : (
          <PrimaryButton onClick={generate} disabled={busy}>{busy ? "Generating…" : "New paper"}</PrimaryButton>
        )}
        <GhostButton onClick={onExit}>Back to menu</GhostButton>
      </div>
    </div>
  );
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

function WritingRunner({ onExit }: { onExit: () => void }) {
  const [paper, setPaper] = useState<WritingPaper | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true); setError(null);
    try {
      setPaper(await callEngine<WritingPaper>("writing/generate", { scope: "full" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!paper) {
    return (
      <Launch
        title="Writing paper"
        blurb="Three prompts at rising levels — an informal note (B1), a formal letter (B2), and a forum post (C1). Section 1's two letters share one situation."
        busyLabel="Writing your prompts… ~15s"
        busy={busy}
        error={error}
        onGenerate={generate}
        onExit={onExit}
      />
    );
  }

  return (
    <div>
      <RunnerHeader onExit={onExit} label="Writing · 3 tasks" />
      {paper.tasks.map((t) => (
        <WritingTaskCard key={t.task} itemId={paper.id} task={t} />
      ))}
      {error ? <Alert>{error}</Alert> : null}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <PrimaryButton onClick={generate} disabled={busy}>{busy ? "Generating…" : "New paper"}</PrimaryButton>
        <GhostButton onClick={onExit}>Back to menu</GhostButton>
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

function Launch({ title, blurb, busyLabel, busy, error, onGenerate, onExit }: {
  title: string; blurb: string; busyLabel: string; busy: boolean; error: string | null;
  onGenerate: () => void; onExit: () => void;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 18, padding: "clamp(24px,4vw,44px)", textAlign: "center" }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: INK, margin: "0 0 8px", fontWeight: 600 }}>{title}</h2>
      <p style={{ fontFamily: SANS, fontSize: 14.5, color: MUTED, lineHeight: 1.65, maxWidth: 480, margin: "0 auto 22px" }}>{blurb}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <PrimaryButton onClick={onGenerate} disabled={busy}>{busy ? busyLabel : "Generate"}</PrimaryButton>
        <GhostButton onClick={onExit}>Back to menu</GhostButton>
      </div>
      {busy ? <p style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, marginTop: 16 }}>Writing original content at exam level — don’t close this tab.</p> : null}
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}

function RunnerHeader({ onExit, label }: { onExit: () => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: INDIGO }}>{label}</span>
      <button onClick={onExit} style={{ fontFamily: SANS, fontSize: 13, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>← Menu</button>
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
