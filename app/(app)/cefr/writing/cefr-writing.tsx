"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";

import { CEFR, CEFR_LEVELS, type CefrLevel } from "@/lib/cefr/levels";
import { cefrTasksForLevel, getCefrTask, type CefrWritingTask } from "@/lib/cefr/writing-tasks";
import { WritingStudio } from "@/app/(studio)/write/writing-studio";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const RED = "#C5503C";

export function CefrWriting({ initialLevel, initialTaskId }: { initialLevel: CefrLevel; initialTaskId: string | null }) {
  const [level, setLevel] = useState<CefrLevel>(initialLevel);
  const [task, setTask] = useState<CefrWritingTask | null>(() => (initialTaskId ? getCefrTask(initialTaskId) ?? null : null));
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const tasks = useMemo(() => cefrTasksForLevel(level), [level]);

  // Generate a fresh, level-pitched task on demand (the dynamic counterpart to the
  // authored cards). Selecting it opens the studio, which grades it via /api/cefr/grade.
  async function generateTask() {
    if (genLoading) return;
    setGenLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/cefr/writing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const body = (await res.json().catch(() => ({}))) as { task?: CefrWritingTask; message?: string };
      if (res.ok && body.task) {
        setTask(body.task);
      } else {
        setGenError(body.message ?? "Couldn't create a task. Please try again.");
      }
    } catch {
      setGenError("Network error — please try again.");
    } finally {
      setGenLoading(false);
    }
  }

  // ---- Studio phase --------------------------------------------------------
  // A selected task (curated OR generated) opens the full writing studio — same UI
  // as IELTS (prompt panel, timed editor, coach), graded on the CEFR scale. Rendered
  // as a fixed overlay so it escapes the app shell and fills the viewport.
  if (task) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#F4F1E7" }}>
        <WritingStudio
          mode="cefr"
          cefrTask={{
            id: task.id,
            level: task.level,
            genre: task.genre,
            title: task.title,
            promptText: task.prompt,
            points: task.points,
            words: task.words,
          }}
          onExit={() => setTask(null)}
        />
      </div>
    );
  }

  // ---- Choose phase --------------------------------------------------------
  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 980 }}>
      <Link href="/cefr" style={backBtn}>
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

      {/* Dynamic task generator — an original {level} task created for the learner,
          not a fixed prompt. Sits above the curated cards. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginTop: 18,
          padding: "16px 18px",
          borderRadius: 16,
          background: "linear-gradient(135deg,#F4F4FB,#FBFAF4)",
          border: "1px solid #E0E1F4",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Sparkles size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: INK }}>Generate a fresh {level} task</div>
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
            An original topic created for your level — never a fixed test. {genError ? <span style={{ color: RED, fontWeight: 600 }} role="alert">{genError}</span> : null}
          </div>
        </div>
        <button type="button" onClick={() => void generateTask()} disabled={genLoading} style={primaryBtn(genLoading)}>
          {genLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating…
            </>
          ) : (
            <>
              <Sparkles size={16} /> New task
            </>
          )}
        </button>
      </div>

      {/* Task cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14, marginTop: 14 }}>
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTask(t)}
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

const backBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  textDecoration: "none",
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
