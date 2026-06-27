"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Loader2, PenLine, Sparkles } from "lucide-react";

import { CEFR, CEFR_LEVELS, isCefrLevel, type CefrLevel } from "@/lib/cefr/levels";
import { cefrTheme, accentStrong } from "@/lib/cefr/theme";
import { cefrTasksForLevel, type CefrWritingTask } from "@/lib/cefr/writing-tasks";
import type { CefrAttemptSummary } from "@/lib/cefr/store";
import { WritingStudio } from "@/app/(studio)/write/writing-studio";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1B2030";
const MUTED = "#5C6473";
const LINE = "#E6E8F0";
const RED = "#C5503C";

type Skill = "writing" | "reading";

/**
 * The CEFR hub — the CEFR track's OWN home, deliberately unlike the IELTS modules.
 * The identity is the **ladder you climb**: a six-rung A1→C2 rail in the level
 * spectrum, and the whole surface is tinted by the active level's colour (never the
 * IELTS indigo). One level-first journey: pick a rung, see what it means, then take
 * its two challenges (Writing + Reading) side by side. Writing opens the shared
 * studio (themed to the level); Reading generates a short level-graded passage.
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

  const [task, setTask] = useState<CefrWritingTask | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [readLoading, setReadLoading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const tasks = useMemo(() => cefrTasksForLevel(level), [level]);
  const info = CEFR[level];
  const theme = cefrTheme(level);
  const accent = theme.accent;

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
      const body = (await res.json().catch(() => ({}))) as { task?: CefrWritingTask; message?: string };
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

  // A selected task (curated OR generated) opens the full writing studio as a fixed
  // overlay that escapes the app shell and fills the viewport — themed to the level.
  if (task) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, background: theme.canvas }}>
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
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 1040 }}>
      {/* ===== Header ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 26,
            padding: "0 11px",
            borderRadius: 999,
            background: theme.accentSoft,
            color: accent,
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 11.5,
            letterSpacing: ".09em",
            textTransform: "uppercase",
          }}
        >
          CEFR track
        </span>
      </div>
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "clamp(27px,3vw,38px)",
          lineHeight: 1.05,
          letterSpacing: "-.01em",
          margin: "12px 0 0",
        }}
      >
        Climb the framework, level by level
      </h1>
      <p style={{ margin: "10px 0 0", fontSize: 15.5, lineHeight: 1.55, color: MUTED, maxWidth: 600 }}>
        Short, level-graded practice across the A1–C2 ladder — scored as a{" "}
        <strong style={{ color: INK }}>CEFR level</strong>, not an IELTS band.
      </p>

      {/* ===== The ladder ===== */}
      <div
        role="tablist"
        aria-label="CEFR level"
        style={{
          marginTop: 22,
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: 8,
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
              className="lp-hover"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "13px 6px 11px",
                borderRadius: 14,
                cursor: "pointer",
                background: on ? c.bg : "#fff",
                border: `1.5px solid ${on ? c.color : LINE}`,
                boxShadow: on ? `0 10px 22px -14px ${c.color}` : "none",
                transition: "background .15s ease, border-color .15s ease",
              }}
            >
              {/* rung marker */}
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: on ? c.color : c.bg,
                  color: on ? "#fff" : c.color,
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: 13.5,
                }}
              >
                {code}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 600,
                  color: on ? c.color : "#9AA0AE",
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

      {/* ===== Level identity ===== */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 20px",
          background: theme.accentSoft,
          border: `1px solid ${theme.accentLine}`,
          borderRadius: 16,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            flex: "none",
            width: 54,
            height: 54,
            borderRadius: 14,
            background: accent,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: 22,
            boxShadow: `0 10px 22px -10px ${accent}`,
          }}
        >
          {info.code}
        </span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: INK }}>{info.name}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{info.ieltsApprox}</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.5, color: "#41485C" }}>{info.blurb}</p>
        </div>
      </div>

      {/* ===== The two challenges ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "26px 0 13px" }}>
        <span style={eyebrow}>Practise this level</span>
        <span style={{ height: 1, flex: 1, background: LINE }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        <ChallengeCard
          theme={theme}
          featured={initialSkill === "writing"}
          icon={<PenLine size={18} />}
          kicker="Writing"
          can={info.writingCan ?? `Practise a short ${info.writingTask.toLowerCase()} at ${info.code}.`}
          facts={[info.writingTask, `~${info.writingWords} words`]}
          busy={genLoading}
          busyLabel="Creating…"
          label={`Generate a ${info.code} task`}
          onGenerate={() => void generateWriting()}
          error={genError}
        />
        <ChallengeCard
          theme={theme}
          featured={initialSkill === "reading"}
          icon={<BookOpen size={18} />}
          kicker="Reading"
          can={info.readingCan}
          facts={[`~${info.readingWords} words`, "6 questions · marked instantly"]}
          busy={readLoading}
          busyLabel="Generating… ~40s"
          label={`Generate a ${info.code} reading`}
          onGenerate={() => void generateReading()}
          error={readError}
          note={readLoading ? `Writing an original ${info.code} passage — hang tight, don't close this tab.` : null}
        />
      </div>

      {/* ===== Ready writing tasks ===== */}
      {tasks.length > 0 ? (
        <div style={{ marginTop: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
            <span style={eyebrow}>Or start a ready {info.code} task</span>
            <span style={{ height: 1, flex: 1, background: LINE }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
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
                  borderRadius: 14,
                  padding: "16px 16px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  fontFamily: SANS,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: INK }}>{t.title}</span>
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
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {t.prompt}
                </p>
                <span style={{ marginTop: 2, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: accent }}>
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
        CEFR levels and their IELTS overlap follow the public Council of Europe framework. A CEFR result is an
        indicative level, not an official IELTS® score, and this product is not affiliated with or endorsed by IELTS®.
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

/** A small style object carrying the accent CSS vars for the animated generate surface. */
function aiVars(theme: ReturnType<typeof cefrTheme>): React.CSSProperties {
  return { ["--ai-soft"]: theme.accentSoft, ["--ai-strong"]: accentStrong(theme.accent) } as React.CSSProperties;
}

/** One practice challenge (Writing or Reading) for the active level. */
function ChallengeCard({
  theme,
  featured,
  icon,
  kicker,
  can,
  facts,
  busy,
  busyLabel,
  label,
  onGenerate,
  error,
  note = null,
}: {
  theme: ReturnType<typeof cefrTheme>;
  featured: boolean;
  icon: React.ReactNode;
  kicker: string;
  can: string;
  facts: string[];
  busy: boolean;
  busyLabel: string;
  label: string;
  onGenerate: () => void;
  error: string | null;
  note?: string | null;
}) {
  const accent = theme.accent;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: `1.5px solid ${featured ? theme.accentLine : LINE}`,
        borderRadius: 16,
        padding: "18px 18px 18px",
        boxShadow: featured ? `0 12px 26px -18px ${accent}` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: theme.accentSoft,
            color: accent,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </span>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 15.5, color: INK }}>{kicker}</span>
      </div>

      <p style={{ margin: "13px 0 0", fontSize: 14, lineHeight: 1.55, color: "#41485C", flex: 1 }}>{can}</p>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 13 }}>
        {facts.map((f) => (
          <span
            key={f}
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              color: MUTED,
              background: "#F4F5F9",
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: "5px 10px",
              whiteSpace: "nowrap",
            }}
          >
            {f}
          </span>
        ))}
      </div>

      <div
        className="lp-ai-surface-accent"
        style={{ ...aiVars(theme), marginTop: 14, padding: 12, borderRadius: 13, border: `1px solid ${theme.accentLine}` }}
      >
        <button
          type="button"
          onClick={onGenerate}
          disabled={busy}
          className={busy ? undefined : "lp-ai-pulse"}
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: 46,
            border: "none",
            borderRadius: 11,
            background: accent,
            color: "#fff",
            fontFamily: SANS,
            fontSize: 14.5,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.75 : 1,
            boxShadow: `0 10px 22px -10px ${accent}`,
          }}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {busyLabel}
            </>
          ) : (
            <>
              <Sparkles size={16} className="lp-ai-spark" /> {label}
            </>
          )}
        </button>
      </div>

      {error ? (
        <p role="alert" style={{ margin: "11px 0 0", fontSize: 13.5, color: RED, fontWeight: 600 }}>
          {error}
        </p>
      ) : note ? (
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: MUTED }}>{note}</p>
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
          background: c?.bg ?? "#EEF1F7",
        }}
      >
        {a.estimated_level}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {a.task_title ?? "CEFR writing"}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: MUTED, textTransform: "capitalize" }}>
          {a.genre} · target {a.target_level} · {a.on_target ? "met" : "below"}
          {when ? ` · ${when}` : ""}
        </p>
      </div>
      <span style={{ flex: "none", color: c?.color ?? INK }} aria-hidden>
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
