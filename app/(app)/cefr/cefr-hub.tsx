"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Loader2, PenLine, Sparkles } from "lucide-react";

import { CEFR, CEFR_LEVEL_LIST, isCefrLevel, type CefrLevel } from "@/lib/cefr/levels";
import { cefrTasksForLevel, type CefrWritingTask } from "@/lib/cefr/writing-tasks";
import type { CefrAttemptSummary } from "@/lib/cefr/store";
import { WritingStudio } from "@/app/(studio)/write/writing-studio";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const LINE = "#ECEAF2";
const RED = "#C5503C";

type Skill = "writing" | "reading";

/**
 * The CEFR hub — ONE surface for the whole CEFR track. The learner picks a level
 * once (A1→C2), flips between Writing and Reading with a segmented control, and the
 * matching tasks appear inline — no second level prompt on a separate page. Writing
 * tasks open the shared studio (graded on the CEFR scale); Reading generates a short
 * level-graded passage and drops into the reader.
 */
export function CefrHub({
  recent = [],
  initialLevel = "B1",
  initialSkill = "writing",
}: {
  recent?: CefrAttemptSummary[];
  initialLevel?: CefrLevel;
  initialSkill?: Skill;
}) {
  const router = useRouter();
  const [level, setLevel] = useState<CefrLevel>(initialLevel);
  const [skill, setSkill] = useState<Skill>(initialSkill);

  // Writing
  const [task, setTask] = useState<CefrWritingTask | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const tasks = useMemo(() => cefrTasksForLevel(level), [level]);

  // Reading
  const [readLoading, setReadLoading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const info = CEFR[level];

  async function generateWriting() {
    if (genLoading) return;
    setGenLoading(true);
    setGenError(null);
    try {
      const res = await fetch("/api/cefr/writing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        task?: CefrWritingTask;
        message?: string;
      };
      if (res.ok && body.task) setTask(body.task);
      else setGenError(body.message ?? "Couldn't create a task. Please try again.");
    } catch {
      setGenError("Network error — please try again.");
    } finally {
      setGenLoading(false);
    }
  }

  async function generateReading() {
    if (readLoading) return;
    setReadLoading(true);
    setReadError(null);
    try {
      const res = await fetch("/api/cefr/reading/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (res.ok && body.id) {
        router.push(`/read/${body.id}`); // keep the spinner until navigation
        return;
      }
      setReadError(body.message ?? "Couldn't generate a CEFR reading. Please try again.");
      setReadLoading(false);
    } catch {
      setReadError("Network error — please try again.");
      setReadLoading(false);
    }
  }

  // A selected task (curated OR generated) opens the full writing studio as a
  // fixed overlay that escapes the app shell and fills the viewport.
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

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      {/* Header */}
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "clamp(26px,3vw,36px)",
          lineHeight: 1.05,
          letterSpacing: "-.01em",
          margin: 0,
        }}
      >
        CEFR practice
      </h1>

      {/* Step 1 — pick a level (once) */}
      <StepLabel n={1} text="Choose your level" />
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {CEFR_LEVEL_LIST.map((l) => {
          const on = l.code === level;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLevel(l.code)}
              aria-pressed={on}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                padding: "10px 16px",
                borderRadius: 12,
                cursor: "pointer",
                minWidth: 96,
                textAlign: "left",
                background: on ? l.bg : "#fff",
                border: `1.5px solid ${on ? l.color : LINE}`,
                boxShadow: on ? "0 4px 14px -9px rgba(26,33,56,.45)" : "none",
                transition: "border-color .15s ease, background .15s ease",
              }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: 18,
                  color: on ? l.color : INK,
                }}
              >
                {l.code}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 600,
                  color: on ? l.color : "#8A8FA0",
                }}
              >
                {l.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected-level summary */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 18px",
          background: info.bg,
          border: `1px solid ${info.color}33`,
          borderRadius: 14,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 28,
            color: info.color,
            lineHeight: 1,
          }}
        >
          {info.code}
        </span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15.5, color: INK }}>
            {info.name} <span style={{ fontWeight: 600, color: MUTED }}>· {info.ieltsApprox}</span>
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
            {info.blurb}
          </p>
        </div>
      </div>

      {/* Step 2 — pick a skill */}
      <StepLabel n={2} text="Pick a skill" />
      <div
        role="tablist"
        aria-label="CEFR skill"
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          marginTop: 10,
          background: "#F1F1F8",
          border: `1px solid ${LINE}`,
          borderRadius: 13,
        }}
      >
        {(
          [
            ["writing", "Writing", PenLine],
            ["reading", "Reading", BookOpen],
          ] as const
        ).map(([key, label, Icon]) => {
          const on = skill === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSkill(key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 40,
                padding: "0 20px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 14.5,
                background: on ? "#fff" : "transparent",
                color: on ? INDIGO : MUTED,
                boxShadow: on ? "0 2px 8px -4px rgba(20,20,48,.3)" : "none",
                transition: "background .15s ease, color .15s ease",
              }}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Step 3 — the chosen skill's tasks, inline */}
      <div style={{ marginTop: 16 }}>
        {skill === "writing" ? (
          <WritingPanel
            level={level}
            can={info.writingCan}
            tasks={tasks}
            genLoading={genLoading}
            genError={genError}
            onGenerate={() => void generateWriting()}
            onPick={setTask}
          />
        ) : (
          <ReadingPanel
            info={info}
            loading={readLoading}
            error={readError}
            onGenerate={() => void generateReading()}
          />
        )}
      </div>

      {/* History */}
      {recent.length > 0 ? (
        <div style={{ marginTop: 34 }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, margin: "0 0 12px" }}>
            Your recent CEFR writing
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.map((a) => (
              <RecentRow key={a.id} a={a} />
            ))}
          </div>
        </div>
      ) : null}

      <p
        style={{
          margin: "30px 0 0",
          fontSize: 12.5,
          lineHeight: 1.5,
          color: "#9A99A8",
          maxWidth: 720,
        }}
      >
        CEFR levels and their IELTS overlap follow the public Council of Europe framework. A CEFR
        result is an indicative level, not an official IELTS® score, and this product is not
        affiliated with or endorsed by IELTS®.
      </p>
    </div>
  );
}

function StepLabel({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 26 }}>
      <span
        style={{
          flex: "none",
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#EBECFA",
          color: INDIGO,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: ".09em",
          textTransform: "uppercase",
          color: "#8A8FA0",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function WritingPanel({
  level,
  can,
  tasks,
  genLoading,
  genError,
  onGenerate,
  onPick,
}: {
  level: CefrLevel;
  can?: string;
  tasks: CefrWritingTask[];
  genLoading: boolean;
  genError: string | null;
  onGenerate: () => void;
  onPick: (t: CefrWritingTask) => void;
}) {
  return (
    <div>
      {can ? (
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "#41496A",
            maxWidth: 640,
          }}
        >
          {can}
        </p>
      ) : null}

      {/* Generate a fresh, level-pitched task */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          padding: "16px 18px",
          borderRadius: 16,
          background: "linear-gradient(135deg,#F4F4FB,#FAFAFF)",
          border: `1px solid #E0E1F4`,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#EBECFA",
            color: INDIGO,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          <Sparkles size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: INK }}>
            Generate a fresh {level} task
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 13.5,
              color: MUTED,
              marginTop: 2,
              lineHeight: 1.5,
            }}
          >
            An original topic created for your level — never a fixed test.{" "}
            {genError ? (
              <span style={{ color: RED, fontWeight: 600 }} role="alert">
                {genError}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={genLoading}
          style={primaryBtn(genLoading)}
        >
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

      {/* Curated task cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
          gap: 14,
          marginTop: 14,
        }}
      >
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            className="lp-hover"
            style={{
              textAlign: "left",
              cursor: "pointer",
              background: "#fff",
              border: `1px solid ${LINE}`,
              borderRadius: 16,
              padding: "18px 18px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontFamily: SANS,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 15.5, color: INK }}>{t.title}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: MUTED, whiteSpace: "nowrap" }}>
                {t.words[0]}–{t.words[1]} w
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: MUTED,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {t.prompt}
            </p>
            <span
              style={{
                marginTop: 2,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13.5,
                fontWeight: 700,
                color: INDIGO,
              }}
            >
              Start writing <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadingPanel({
  info,
  loading,
  error,
  onGenerate,
}: {
  info: (typeof CEFR)[CefrLevel];
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  return (
    <div>
      <div
        style={{
          padding: "18px 20px",
          background: "#fff",
          border: `1px solid ${LINE}`,
          borderRadius: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#EFEEFC",
              color: INDIGO,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <BookOpen size={20} />
          </span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15.5, color: INK }}>
              One short {info.code} passage
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 13.5, color: MUTED }}>
              ~{info.readingWords}-word passage · 6 questions · marked instantly
            </p>
          </div>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.55, color: "#41496A" }}>
          {info.readingCan}
        </p>
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}
      >
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            height: 48,
            padding: "0 22px",
            border: "none",
            borderRadius: 12,
            background: INDIGO,
            color: "#fff",
            fontFamily: SANS,
            fontSize: 15.5,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.75 : 1,
            boxShadow: "0 12px 24px -12px rgba(59,67,181,.8)",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Generating… ~40s
            </>
          ) : (
            <>
              <Sparkles size={17} /> Generate a CEFR reading
            </>
          )}
        </button>
        {loading ? (
          <span style={{ fontSize: 13, color: MUTED }}>
            Writing an original {info.code} passage — hang tight, don&rsquo;t close this tab.
          </span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" style={{ marginTop: 14, fontSize: 13.5, color: "#c2410c" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function RecentRow({ a }: { a: CefrAttemptSummary }) {
  const c = isCefrLevel(a.estimated_level) ? CEFR[a.estimated_level] : null;
  const when = formatWhen(a.created_at);
  return (
    <Link
      href={`/cefr/writing/${a.id}`}
      className="lp-hover"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        textDecoration: "none",
      }}
    >
      <span
        style={{
          flex: "none",
          width: 44,
          height: 44,
          borderRadius: 11,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SERIF,
          fontWeight: 800,
          fontSize: 18,
          color: c?.color ?? INK,
          background: c?.bg ?? "#F1EFE5",
        }}
      >
        {a.estimated_level}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 14.5,
            color: INK,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {a.task_title ?? "CEFR writing"}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: MUTED, textTransform: "capitalize" }}>
          {a.genre} · target {a.target_level} · {a.on_target ? "met" : "below"}
          {when ? ` · ${when}` : ""}
        </p>
      </div>
      <span style={{ flex: "none", color: INDIGO }} aria-hidden>
        <ArrowRight size={16} />
      </span>
    </Link>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

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
