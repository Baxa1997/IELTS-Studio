"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { CEFR, CEFR_LEVELS, type CefrLevel } from "@/lib/cefr/levels";
import { CEFR_SUBSCALES } from "@/lib/cefr/descriptors";
import { CEFR_SUBSCALE_KEYS, type CefrGradeResult } from "@/lib/cefr/schema";
import { cefrTasksForLevel, getCefrTask, type CefrWritingTask } from "@/lib/cefr/writing-tasks";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const GREEN = "#15803D";
const AMBER = "#B5852A";
const RED = "#C5503C";

const SUBSCALE_NAME: Record<string, string> = Object.fromEntries(
  CEFR_SUBSCALES.map((s) => [s.key, s.name]),
);

/** 0–5 subscale mark → colour (5/4 strong, 3 borderline, ≤2 weak). */
function markColor(mark: number): string {
  if (mark >= 4) return GREEN;
  if (mark === 3) return AMBER;
  return RED;
}

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function CefrWriting({ initialLevel, initialTaskId }: { initialLevel: CefrLevel; initialTaskId: string | null }) {
  const [level, setLevel] = useState<CefrLevel>(initialLevel);
  const [task, setTask] = useState<CefrWritingTask | null>(() => (initialTaskId ? getCefrTask(initialTaskId) ?? null : null));
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [grade, setGrade] = useState<CefrGradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tasks = useMemo(() => cefrTasksForLevel(level), [level]);
  const words = countWords(text);

  async function submit() {
    if (!task || submitting) return;
    if (words < 1) {
      setError("Write something before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/cefr/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, text }),
      });
      const body = (await res.json().catch(() => ({}))) as { grade?: CefrGradeResult; message?: string; error?: string };
      if (res.ok && body.grade) {
        setGrade(body.grade);
        window.scrollTo({ top: 0 });
      } else {
        setError(body.message ?? "Couldn't grade your writing. Please try again.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Result phase --------------------------------------------------------
  if (grade && task) {
    return (
      <ResultView
        grade={grade}
        task={task}
        onRevise={() => setGrade(null)}
        onNew={() => {
          setGrade(null);
          setTask(null);
          setText("");
        }}
      />
    );
  }

  // ---- Write phase ---------------------------------------------------------
  if (task) {
    const [min, max] = task.words;
    const inRange = words >= min && words <= max;
    return (
      <div style={{ fontFamily: SANS, color: INK, maxWidth: 860 }}>
        <button type="button" onClick={() => setTask(null)} style={backBtn}>
          <ArrowLeft size={15} /> Choose another task
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 12px" }}>
          <LevelChip level={task.level} />
          <span style={{ fontSize: 13, fontWeight: 600, color: MUTED, textTransform: "capitalize" }}>{task.genre}</span>
        </div>

        {/* Task card */}
        <div style={{ background: "#fff", border: "1px solid #E7E3D5", borderRadius: 14, padding: "18px 20px" }}>
          <p style={{ margin: 0, fontFamily: SERIF, fontSize: 18, lineHeight: 1.5, color: "#2B3145" }}>{task.prompt}</p>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
            {task.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        {/* Editor */}
        <div style={{ marginTop: 16 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your answer here…"
            className="lp-input"
            style={{ width: "100%", minHeight: 320, resize: "vertical", padding: "16px 18px", border: "1px solid #E2DED0", borderRadius: 14, background: "#fff", fontFamily: SANS, fontSize: 15.5, lineHeight: 1.7, color: INK }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: inRange ? GREEN : MUTED }}>
              {words} words <span style={{ color: "#9097A8", fontWeight: 500 }}>· target {min}–{max}</span>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {error ? <span style={{ fontSize: 13, color: RED, fontWeight: 600 }} role="alert">{error}</span> : null}
              <button type="button" onClick={() => void submit()} disabled={submitting} style={primaryBtn(submitting)}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Grading…
                  </>
                ) : (
                  <>
                    Get my CEFR level <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Choose phase --------------------------------------------------------
  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 980 }}>
      <Link href="/cefr" style={{ ...backBtn, display: "inline-flex", textDecoration: "none" }}>
        <ArrowLeft size={15} /> CEFR practice
      </Link>

      <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(24px,2.6vw,32px)", margin: "14px 0 0", letterSpacing: "-.01em" }}>CEFR Writing</h1>
      <p style={{ fontSize: 15, color: MUTED, margin: "6px 0 0", maxWidth: 620, lineHeight: 1.55 }}>
        Pick your level, then choose a task. You&rsquo;ll get an estimated CEFR level with feedback on Content, Communicative Achievement, Organisation and Language.
      </p>

      {/* Level tabs */}
      <div style={{ display: "flex", gap: 7, marginTop: 22, flexWrap: "wrap" }}>
        {CEFR_LEVELS.map((l) => {
          const on = l === level;
          const info = CEFR[l];
          return (
            <button key={l} type="button" onClick={() => setLevel(l)} aria-pressed={on} style={{ padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontFamily: SANS, fontWeight: 700, fontSize: 14.5, background: on ? info.bg : "#fff", color: on ? info.color : "#6E7388", border: `1.5px solid ${on ? info.color : "#E7E3D5"}` }}>
              {l}
            </button>
          );
        })}
      </div>

      {/* Task cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14, marginTop: 18 }}>
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTask(t);
              setText("");
              setError(null);
            }}
            className="lp-hover"
            style={{ textAlign: "left", cursor: "pointer", background: "#fff", border: "1px solid #E7E3D5", borderRadius: 16, padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 10, fontFamily: SANS }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15.5, color: INK }}>{t.title}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>{t.words[0]}–{t.words[1]} w</span>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: MUTED, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.prompt}</p>
            <span style={{ marginTop: 2, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: INDIGO }}>
              Start writing <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Result --------------------------------------------------------------

function ResultView({ grade, task, onRevise, onNew }: { grade: CefrGradeResult; task: CefrWritingTask; onRevise: () => void; onNew: () => void }) {
  const est = CEFR[grade.estimated_level];
  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 880 }}>
      <Link href="/cefr" style={{ ...backBtn, display: "inline-flex", textDecoration: "none" }}>
        <ArrowLeft size={15} /> CEFR practice
      </Link>

      {/* Hero */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16, padding: "20px 24px", background: est.bg, border: `1px solid ${est.color}33`, borderRadius: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 60, lineHeight: 0.85, color: est.color, letterSpacing: "-.02em" }}>{grade.estimated_level}</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: MUTED }}>Estimated CEFR level</p>
          <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 700, color: INK }}>{est.name}</p>
          <span style={{ display: "inline-block", marginTop: 8, fontSize: 12.5, fontWeight: 700, color: grade.on_target ? GREEN : AMBER, background: grade.on_target ? "#E9F7EE" : "#F6EAD0", padding: "3px 10px", borderRadius: 999 }}>
            {grade.on_target ? `Meets the ${grade.target_level} target` : `Below the ${grade.target_level} target`}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.6, color: "#3A3F58", margin: "18px 0 0" }}>{grade.summary}</p>

      {/* Subscales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: 14, marginTop: 18 }}>
        {CEFR_SUBSCALE_KEYS.map((key) => {
          const s = grade.subscales[key];
          const c = markColor(s.mark);
          return (
            <div key={key} style={{ background: "#fff", border: "1px solid #E7E3D5", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: INK }}>{SUBSCALE_NAME[key]}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: c, fontVariantNumeric: "tabular-nums" }}>{s.mark}<span style={{ fontSize: 13, color: "#9097A8", fontWeight: 600 }}>/5</span></span>
              </div>
              <div style={{ marginTop: 9, height: 6, borderRadius: 3, background: "#EFECE0", overflow: "hidden" }}>
                <div style={{ width: `${(s.mark / 5) * 100}%`, height: "100%", borderRadius: 3, background: c }} />
              </div>
              <p style={{ margin: "11px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#41496A" }}>{s.comment}</p>
              <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#2C3247" }}>
                <strong style={{ color: INDIGO }}>Improve:</strong> {s.improve}
              </p>
            </div>
          );
        })}
      </div>

      {/* Strengths + improvements */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, marginTop: 14 }}>
        <ListCard title="Strengths" color={GREEN} items={grade.strengths} icon={<Check size={14} />} />
        <ListCard title="Work on next" color={AMBER} items={grade.improvements} icon={<ArrowRight size={14} />} />
      </div>

      {/* Next level */}
      <div style={{ marginTop: 14, padding: "16px 18px", background: "#EFEEFC", border: "1px solid #DEDCF5", borderRadius: 14 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", color: INDIGO }}>To reach {grade.next_level.level}</p>
        <p style={{ margin: "5px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#2C3247" }}>{grade.next_level.focus}</p>
      </div>

      <p style={{ margin: "18px 0 0", fontSize: 12, lineHeight: 1.5, color: "#9A99A8" }}>{grade.disclaimer}</p>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <button type="button" onClick={onRevise} style={primaryBtn(false)}>Revise this task</button>
        <button type="button" onClick={onNew} style={{ ...primaryBtn(false), background: "#fff", color: INK, border: "1px solid #E2DED0", boxShadow: "none" }}>Try another task</button>
      </div>

      <p style={{ marginTop: 14, fontSize: 12.5, color: "#9097A8" }}>Task: {task.title}</p>
    </div>
  );
}

function ListCard({ title, color, items, icon }: { title: string; color: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E3D5", borderRadius: 14, padding: "16px 18px" }}>
      <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14.5, color: INK }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <span style={{ flex: "none", width: 20, height: 20, borderRadius: 6, background: `${color}1A`, color, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{icon}</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "#41496A" }}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LevelChip({ level }: { level: CefrLevel }) {
  const info = CEFR[level];
  return (
    <span style={{ fontSize: 13, fontWeight: 800, color: info.color, background: info.bg, padding: "4px 11px", borderRadius: 999 }}>{level} · {info.name}</span>
  );
}

const backBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 600,
  color: MUTED,
};

function primaryBtn(busy: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 44,
    padding: "0 20px",
    border: "none",
    borderRadius: 11,
    background: INDIGO,
    color: "#fff",
    fontFamily: SANS,
    fontSize: 14.5,
    fontWeight: 700,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
    boxShadow: "0 10px 22px -10px rgba(59,67,181,.7)",
  };
}
