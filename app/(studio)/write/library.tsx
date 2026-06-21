"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";

import type { LibraryPrompt } from "./writing-studio";

export type { LibraryPrompt };

// ---- Brand tokens (Option A; indigo kept at #3B43B5 for app-wide consistency) ----

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const EMERALD = "#1F8A53";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E7E3D5",
  borderRadius: 16,
};

const TABS: { key: string; label: string; soon?: boolean }[] = [
  { key: "task1_academic", label: "Academic · Task 1" },
  { key: "task2", label: "Academic · Task 2" },
  { key: "task1_general", label: "General Training" },
  { key: "custom", label: "Your own topic" },
];

const ARROW = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Estimated time + word target shown on every topic card. */
function estMeta(taskType: string): string {
  return taskType === "task2" ? "~40 min · 250 words" : "~20 min · 150 words";
}

export function WritingLibrary({
  library,
  practised,
  pitchBand,
}: {
  library: LibraryPrompt[];
  /** Prompt ids the learner has already attempted — badged + filterable, but every
   *  card still starts a fresh attempt. Past grades are reviewed under Activities. */
  practised: string[];
  /** The band generated tasks are tuned to (computed from the learner's level). */
  pitchBand: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("task2");
  const [busy, setBusy] = useState(false);
  const [generatingKind, setGeneratingKind] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // custom
  const [customText, setCustomText] = useState("");
  const [customTask, setCustomTask] = useState<string>("task2");

  // library search + filters
  const [query, setQuery] = useState("");
  const [pracFilter, setPracFilter] = useState<"all" | "not" | "done">("all");
  const [bandFilter, setBandFilter] = useState<number | null>(null);

  const done = useMemo(() => new Set(practised), [practised]);
  const cards = useMemo(() => library.filter((p) => p.task_type === tab), [library, tab]);
  const visible = cards.filter((p) => {
    if (
      query.trim() &&
      !`${p.topic_family ?? ""} ${p.prompt_text}`.toLowerCase().includes(query.trim().toLowerCase())
    )
      return false;
    const isDone = done.has(p.id);
    if (pracFilter === "not" && isDone) return false;
    if (pracFilter === "done" && !isDone) return false;
    if (bandFilter != null && p.difficulty !== bandFilter) return false;
    return true;
  });

  function open(id: string) {
    setBusy(true);
    router.push(`/write/${id}`);
  }

  async function generate(kind: string) {
    if (busy) return;
    setBusy(true);
    setGeneratingKind(kind);
    setMessage(null);
    try {
      const res = await fetch("/api/prompts/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType: kind }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        prompt?: { id: string };
        message?: string;
      };
      if (!res.ok || !body.prompt?.id) {
        setMessage(body.message ?? "Couldn't generate a prompt. Please try again.");
        setBusy(false);
        setGeneratingKind(null);
        return;
      }
      router.push(`/write/${body.prompt.id}`); // keep busy until navigation
    } catch {
      setMessage("Network error — please try again.");
      setBusy(false);
      setGeneratingKind(null);
    }
  }

  async function submitCustom() {
    if (busy) return;
    if (customText.trim().length < 10) {
      setMessage("Paste the full prompt — at least a sentence.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/prompts/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: customText.trim(), taskType: customTask }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        prompt?: { id: string };
        message?: string;
      };
      if (!res.ok || !body.prompt?.id) {
        setMessage(body.message ?? "Couldn't use that prompt. Please try again.");
        setBusy(false);
        return;
      }
      router.push(`/write/${body.prompt.id}`);
    } catch {
      setMessage("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "36px clamp(16px,4vw,40px) 64px",
        fontFamily: SANS,
      }}
    >
      {/* hero */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 740 }}>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(30px,3.6vw,44px)",
              lineHeight: 1.04,
              letterSpacing: "-.01em",
              margin: 0,
              color: INK,
            }}
          >
            Writing practice
          </h1>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 16.5,
              lineHeight: 1.55,
              color: MUTED,
              margin: "14px 0 0",
              maxWidth: 650,
            }}
          >
            Pick a topic, generate a fresh one, or paste your own. You&rsquo;ll get an
            examiner-strict band per criterion — then revise the same response until it&rsquo;s
            where you want it.
          </p>
        </div>
        <Link
          href="/dashboard"
          style={{
            flex: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 42,
            padding: "0 16px",
            border: "1px solid #E2DED0",
            background: "#fff",
            borderRadius: 11,
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            color: "#41496A",
            textDecoration: "none",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#41496A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* task tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: "1px solid #E0DBCB",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              disabled={t.soon}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 46,
                padding: "0 16px",
                marginBottom: -1,
                border: "none",
                background: "transparent",
                borderBottom: active ? `2.5px solid ${INDIGO}` : "2.5px solid transparent",
                color: active ? INDIGO : t.soon ? "#A7ABBA" : "#6E7388",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: active ? 700 : 600,
                cursor: t.soon ? "default" : "pointer",
              }}
            >
              {t.label}
              {t.soon ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    color: "#9A8F77",
                    background: "#ECE8DA",
                    padding: "2px 7px",
                    borderRadius: 6,
                  }}
                >
                  SOON
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {message ? (
        <p
          role="alert"
          style={{
            fontFamily: SANS,
            fontSize: 13.5,
            color: "#c2410c",
            background: "#FEF2E8",
            border: "1px solid #F6D7BE",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 20,
          }}
        >
          {message}
        </p>
      ) : null}

      {tab === "custom" ? (
        <div style={{ ...cardStyle, padding: 24, maxWidth: 720 }}>
          <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK, margin: 0 }}>
            Paste your own prompt
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 14,
              lineHeight: 1.6,
              color: MUTED,
              margin: "6px 0 16px",
            }}
          >
            Got a specific question from class or a book? Paste it and we&rsquo;ll grade your answer
            against it.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {[
              { k: "task2", l: "Academic · Task 2" },
              { k: "task1_general", l: "General Training" },
              { k: "task1_academic", l: "Academic · Task 1" },
            ].map((o) => (
              <button
                key={o.k}
                type="button"
                onClick={() => setCustomTask(o.k)}
                style={{
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "7px 12px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: customTask === o.k ? `1px solid ${INDIGO}` : "1px solid #E2DED0",
                  background: customTask === o.k ? "#ECEBFB" : "#fff",
                  color: customTask === o.k ? INDIGO : INK,
                }}
              >
                {o.l}
              </button>
            ))}
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Paste the full IELTS writing prompt here…"
            className="lp-input"
            style={{
              width: "100%",
              minHeight: 130,
              resize: "vertical",
              padding: "12px 14px",
              border: "1px solid #E2DED0",
              borderRadius: 12,
              background: "#fff",
              fontFamily: SANS,
              fontSize: 14.5,
              lineHeight: 1.6,
              color: INK,
            }}
          />
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => void submitCustom()}
              disabled={busy}
              style={genButton(busy)}
            >
              {busy ? "Loading…" : "Use this prompt"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* AI banner */}
          <div
            style={{
              background: "linear-gradient(110deg,#EEEDFB,#F3F2FC)",
              border: "1px solid #DEDCF5",
              borderRadius: 18,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              marginBottom: 38,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span
                style={{
                  flex: "none",
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid #E4E2F4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px -6px rgba(59,67,181,.4)",
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={INDIGO}
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
                  <path d="M19 14l.7 1.9L21.5 17l-1.8.7L19 19.5l-.7-1.8L16.5 17l1.8-.6L19 14z" />
                </svg>
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 18, color: INK }}>
                    Let AI choose a fresh topic
                  </div>
                  <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: INDIGO, background: "#fff", border: "1px solid #DEDCF5", borderRadius: 999, padding: "3px 10px" }}>
                    Tuned to band {pitchBand.toFixed(1)}
                  </span>
                </div>
                <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 14.5, color: MUTED }}>
                  A brand-new, exam-style prompt pitched at your level — closest to the real test.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void generate(tab)}
              disabled={busy}
              style={genButton(busy, true)}
            >
              {generatingKind === tab ? "Generating… ~15s" : "Generate a topic"}
              {generatingKind === tab ? null : ARROW}
            </button>
          </div>

          {/* ready topics header */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontFamily: SANS, fontSize: 18, fontWeight: 700, color: INK }}>
              Or choose a ready topic
            </h2>
            <span style={{ fontFamily: SANS, fontSize: 14, color: "#9097A8" }}>
              Showing <strong style={{ color: INK }}>{visible.length}</strong> of {cards.length}
            </span>
          </div>

          {/* toolbar */}
          {cards.length > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <div
                className="lp-field"
                style={{
                  flex: "1 1 240px",
                  minWidth: 200,
                  maxWidth: 360,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  height: 44,
                  padding: "0 14px",
                  background: "#fff",
                  border: "1px solid #E2DED0",
                  borderRadius: 11,
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9097A8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search topics…"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 0,
                    outline: 0,
                    background: "transparent",
                    fontFamily: SANS,
                    fontSize: 14.5,
                    color: INK,
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                {(
                  [
                    ["all", "All topics"],
                    ["not", "Not practised"],
                    ["done", "Practised"],
                  ] as [typeof pracFilter, string][]
                ).map(([key, label]) => {
                  const on = pracFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPracFilter(key)}
                      style={{
                        height: 44,
                        padding: "0 16px",
                        borderRadius: 11,
                        fontFamily: SANS,
                        fontSize: 14,
                        fontWeight: on ? 700 : 600,
                        cursor: "pointer",
                        color: on ? INDIGO : "#5A6076",
                        background: on ? "#ECEBFB" : "#fff",
                        border: on ? "1px solid #D6D3EF" : "1px solid #E2DED0",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                <select
                  value={bandFilter ?? ""}
                  onChange={(e) => setBandFilter(e.target.value ? Number(e.target.value) : null)}
                  aria-label="Filter by target band"
                  style={{
                    height: 44,
                    padding: "0 12px",
                    borderRadius: 11,
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: bandFilter != null ? INDIGO : "#5A6076",
                    background: bandFilter != null ? "#ECEBFB" : "#fff",
                    border: bandFilter != null ? "1px solid #D6D3EF" : "1px solid #E2DED0",
                  }}
                >
                  <option value="">Any band</option>
                  {[5, 6, 7, 8, 9].map((b) => (
                    <option key={b} value={b}>
                      Band {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {/* cards grid */}
          {cards.length === 0 ? (
            <div style={{ ...cardStyle, padding: 28, textAlign: "center", borderStyle: "dashed" }}>
              <p style={{ fontFamily: SANS, fontSize: 14.5, color: MUTED, margin: 0 }}>
                No ready topics here yet — use &ldquo;Let AI choose a fresh topic&rdquo; above to
                create your first.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div style={{ ...cardStyle, padding: 28, textAlign: "center", borderStyle: "dashed" }}>
              <p style={{ fontFamily: SANS, fontSize: 14.5, color: MUTED, margin: 0 }}>
                No topics match your filters.
              </p>
            </div>
          ) : (
            <div
              className="lp-write-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gridAutoRows: "1fr",
                gap: 18,
              }}
            >
              {visible.map((p) => (
                <PromptCard
                  key={p.id}
                  p={p}
                  done={done.has(p.id)}
                  busy={busy}
                  onOpen={() => open(p.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function genButton(disabled: boolean, big = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    height: big ? 50 : 44,
    padding: big ? "0 24px" : "0 18px",
    border: "none",
    borderRadius: 12,
    background: INDIGO,
    color: "#fff",
    fontFamily: SANS,
    fontSize: big ? 15.5 : 15,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
    boxShadow: "0 10px 24px -10px rgba(59,67,181,.8)",
    flex: "none",
  };
}

function PromptCard({
  p,
  done,
  busy,
  onOpen,
}: {
  p: LibraryPrompt;
  done: boolean;
  busy: boolean;
  onOpen: () => void;
}) {
  const status = done
    ? { label: "✓ Practised", color: EMERALD, bg: "#E9F5EE", bd: "#CDE9D8" }
    : { label: "Not practised", color: "#9A8F77", bg: "#F1EEE3", bd: "#E4E0D1" };
  const meta = estMeta(p.task_type);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={busy}
      onClick={() => {
        if (!busy) onOpen();
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !busy) {
          e.preventDefault();
          onOpen();
        }
      }}
      className="lp-hover"
      style={{
        ...cardStyle,
        height: "100%",
        padding: "18px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: busy ? "default" : "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        {p.topic_family && p.topic_family !== "custom" ? (
          <span
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 600,
              color: "#6E7388",
              background: "#F1EFE5",
              border: "1px solid #E7E3D5",
              padding: "3px 10px",
              borderRadius: 7,
            }}
          >
            {p.topic_family}
          </span>
        ) : null}
        {p.difficulty ? (
          <span
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 700,
              color: INDIGO,
              background: "#ECEBFB",
              border: "1px solid #E1DFF7",
              padding: "3px 10px",
              borderRadius: 7,
            }}
          >
            band {p.difficulty}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 600,
            color: status.color,
            background: status.bg,
            border: `1px solid ${status.bd}`,
            padding: "3px 10px",
            borderRadius: 7,
          }}
        >
          {status.label}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          height: 78,
          fontFamily: SERIF,
          fontSize: 17,
          lineHeight: 1.5,
          color: "#2B3145",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {p.prompt_text}
      </p>

      <div style={{ height: 1, background: "#F0EDE1", marginTop: "auto" }} />

      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
      >
        <span style={{ fontFamily: SANS, fontSize: 13, color: "#9097A8" }}>{meta}</span>
        <span
          className="lp-card-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 38,
            padding: "0 16px",
            borderRadius: 10,
            background: "#1A2138",
            color: "#fff",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 700,
            pointerEvents: "none",
          }}
        >
          Start writing
          {ARROW}
        </span>
      </div>
    </div>
  );
}
