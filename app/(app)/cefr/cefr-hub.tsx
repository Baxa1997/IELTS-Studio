"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Loader2, PenLine, Sparkles } from "lucide-react";

import { CEFR, CEFR_LEVELS, isCefrLevel, type CefrLevel } from "@/lib/cefr/levels";
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
 * The CEFR hub — ONE surface for the whole CEFR track, framed as SEPARATE from the
 * IELTS-band modules: short, level-graded practice reported as a CEFR level (A1→C2),
 * not a band. Structure is deliberately flat: a single level bar, then one practice
 * panel that switches between Writing and Reading. Writing opens the shared studio
 * (graded on the CEFR scale); Reading generates a short level-graded passage.
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

  const [task, setTask] = useState<CefrWritingTask | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [readLoading, setReadLoading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const tasks = useMemo(() => cefrTasksForLevel(level), [level]);
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
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 1080 }}>
      {/* ===== Header ===== */}
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "clamp(27px,3vw,38px)",
          lineHeight: 1.05,
          letterSpacing: "-.01em",
          margin: 0,
        }}
      >
        CEFR practice
      </h1>
      <p style={{ margin: "10px 0 0", fontSize: 15.5, lineHeight: 1.55, color: MUTED, maxWidth: 620 }}>
        Short, level-graded practice across the A1–C2 framework — scored as a{" "}
        <strong style={{ color: INK }}>CEFR level</strong>, not an IELTS band.
      </p>

      {/* ===== Level bar ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          margin: "26px 0 10px",
        }}
      >
        <span style={eyebrow}>Your level</span>
        <span style={{ height: 1, flex: 1, background: LINE }} />
      </div>
      <div
        role="tablist"
        aria-label="CEFR level"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: 6,
          padding: 6,
          background: "#F4F4F8",
          border: `1px solid ${LINE}`,
          borderRadius: 16,
        }}
      >
        {CEFR_LEVELS.map((code) => {
          const c = CEFR[code];
          const on = code === level;
          return (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setLevel(code)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "11px 4px 9px",
                borderRadius: 11,
                border: "none",
                cursor: "pointer",
                background: on ? "#fff" : "transparent",
                boxShadow: on ? "0 3px 10px -5px rgba(20,20,48,.4)" : "none",
                transition: "background .15s ease",
              }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: 17,
                  color: on ? c.color : "#8A8FA0",
                }}
              >
                {code}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 600,
                  color: on ? c.color : "#A6A9B6",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===== Practice panel (one card; switches skill) ===== */}
      <div
        style={{
          marginTop: 16,
          background: "#fff",
          border: `1px solid ${LINE}`,
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        {/* header: level identity + skill toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 18px",
            background: info.bg,
            borderBottom: `1px solid ${info.color}22`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
            <span
              style={{
                flex: "none",
                width: 50,
                height: 50,
                borderRadius: 13,
                background: "#fff",
                border: `1.5px solid ${info.color}40`,
                color: info.color,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SERIF,
                fontWeight: 800,
                fontSize: 21,
              }}
            >
              {info.code}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: INK }}>{info.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: MUTED }}>{info.ieltsApprox}</p>
            </div>
          </div>
          <div
            role="tablist"
            aria-label="Skill"
            style={{
              display: "inline-flex",
              gap: 4,
              padding: 4,
              background: "#fff",
              border: `1px solid ${info.color}2E`,
              borderRadius: 12,
            }}
          >
            <SkillPill active={skill === "writing"} onClick={() => setSkill("writing")} icon={<PenLine size={16} />} label="Writing" />
            <SkillPill active={skill === "reading"} onClick={() => setSkill("reading")} icon={<BookOpen size={16} />} label="Reading" />
          </div>
        </div>

        {/* body: can-do + the single primary action */}
        <div style={{ padding: "20px 18px" }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#41496A" }}>
            {skill === "writing"
              ? info.writingCan ?? `Practise a short ${info.writingTask.toLowerCase()} at ${info.code}.`
              : info.readingCan}
          </p>

          <div
            className="lp-ai-surface"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 16,
              flexWrap: "wrap",
              padding: "16px 16px",
              border: "1px solid #DEDCF5",
              borderRadius: 14,
            }}
          >
            {skill === "writing" ? (
              <button
                type="button"
                onClick={() => void generateWriting()}
                disabled={genLoading}
                className={genLoading ? undefined : "lp-ai-pulse"}
                style={primaryBtn(genLoading)}
              >
                {genLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="lp-ai-spark" /> Generate a {info.code} task
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void generateReading()}
                disabled={readLoading}
                className={readLoading ? undefined : "lp-ai-pulse"}
                style={primaryBtn(readLoading)}
              >
                {readLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Generating… ~40s
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="lp-ai-spark" /> Generate a {info.code} reading
                  </>
                )}
              </button>
            )}

            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {(skill === "writing"
                ? [info.writingTask, `~${info.writingWords} words`]
                : [`~${info.readingWords} words`, "6 questions · marked instantly"]
              ).map((f) => (
                <span key={f} style={factPill}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {(skill === "writing" ? genError : readError) ? (
            <p role="alert" style={{ margin: "12px 0 0", fontSize: 13.5, color: RED, fontWeight: 600 }}>
              {skill === "writing" ? genError : readError}
            </p>
          ) : null}
          {skill === "reading" && readLoading ? (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: MUTED }}>
              Writing an original {info.code} passage — hang tight, don&rsquo;t close this tab.
            </p>
          ) : null}
        </div>
      </div>

      {/* ===== Ready writing tasks (writing only) ===== */}
      {skill === "writing" && tasks.length > 0 ? (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
            <span style={eyebrow}>Or pick a ready task</span>
            <span style={{ height: 1, flex: 1, background: LINE }} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
              gap: 14,
            }}
          >
            {tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTask(t)}
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
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
      ) : null}

      {/* ===== History ===== */}
      {recent.length > 0 ? (
        <div style={{ marginTop: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <span style={eyebrow}>Recent CEFR writing</span>
            <span style={{ height: 1, flex: 1, background: LINE }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.map((a) => (
              <RecentRow key={a.id} a={a} />
            ))}
          </div>
        </div>
      ) : null}

      <p style={{ margin: "30px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "#9A99A8", maxWidth: 720 }}>
        CEFR levels and their IELTS overlap follow the public Council of Europe framework. A CEFR
        result is an indicative level, not an official IELTS® score, and this product is not
        affiliated with or endorsed by IELTS®.
      </p>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontFamily: SANS,
  fontWeight: 700,
  fontSize: 11.5,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "#8A8FA0",
};

const factPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: SANS,
  fontSize: 12.5,
  fontWeight: 600,
  color: "#5A6076",
  background: "#F4F4F8",
  border: `1px solid ${LINE}`,
  borderRadius: 999,
  padding: "6px 11px",
  whiteSpace: "nowrap",
};

/** A skill toggle pill inside the panel header. */
function SkillPill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        height: 36,
        padding: "0 15px",
        borderRadius: 9,
        border: "none",
        cursor: "pointer",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 14,
        background: active ? INDIGO : "transparent",
        color: active ? "#fff" : MUTED,
        transition: "background .15s ease, color .15s ease",
      }}
    >
      {icon}
      {label}
    </button>
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
    height: 46,
    padding: "0 20px",
    border: "none",
    borderRadius: 12,
    background: INDIGO,
    color: "#fff",
    fontFamily: SANS,
    fontSize: 14.5,
    fontWeight: 700,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
    boxShadow: "0 10px 22px -10px rgba(59,67,181,.7)",
    flex: "none",
  };
}
