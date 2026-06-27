"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Loader2, PenLine, Sparkles } from "lucide-react";

import { AiGenerateSection, AiGenerateButton } from "@/components/ai-generate-section";
// These live with the full-screen runner in the (studio) group; the hub library
// only needs the prompt type and the save-draft action from them.
import type { LibraryPrompt } from "@/app/(studio)/write/writing-studio";
import { saveDraft } from "@/app/(studio)/write/actions";

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
  { key: "check_own", label: "Check own writing" },
  { key: "task1_academic", label: "Academic · Task 1" },
  { key: "task2", label: "Academic · Task 2" },
  { key: "task1_general", label: "General Training" },
  // { key: "custom", label: "Your own topic" },
];

/** Task-type options shared by the "Check own writing" and custom-prompt panels. */
const TASK_OPTIONS: { k: string; l: string }[] = [
  { k: "task2", l: "Academic · Task 2" },
  { k: "task1_general", l: "General Training" },
  { k: "task1_academic", l: "Academic · Task 1" },
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
  const [tab, setTab] = useState<string>("check_own");
  // Remember the active tab across navigation. Generating a topic sends you to the
  // (studio) runner and back, which remounts AppShell (it lives in a different route
  // group) and would otherwise reset this to the first tab. sessionStorage survives
  // that remount; restored after mount to avoid a hydration mismatch.
  useEffect(() => {
    const saved = sessionStorage.getItem("write_tab");
    // Restore after mount (not a lazy initializer) so the client's first render
    // matches the server's, avoiding a hydration mismatch on the tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from sessionStorage on mount
    if (saved && TABS.some((t) => t.key === saved)) setTab(saved);
  }, []);
  function selectTab(key: string) {
    setTab(key);
    try {
      sessionStorage.setItem("write_tab", key);
    } catch {
      // sessionStorage can throw in private mode — remembering the tab is best-effort.
    }
  }
  const [busy, setBusy] = useState(false);
  const [generatingKind, setGeneratingKind] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // custom
  const [customText, setCustomText] = useState("");
  const [customTask, setCustomTask] = useState<string>("task2");

  // check own writing (paste a question + an already-written essay → grade it)
  const [checkQuestion, setCheckQuestion] = useState("");
  const [checkEssay, setCheckEssay] = useState("");
  const [checkTask, setCheckTask] = useState<string>("task2");
  const [gradingModal, setGradingModal] = useState(false);
  const checkWords = useMemo(
    () => (checkEssay.trim() ? checkEssay.trim().split(/\s+/).filter(Boolean).length : 0),
    [checkEssay],
  );

  // library search + filters
  const [query, setQuery] = useState("");
  const [pracFilter, setPracFilter] = useState<"all" | "not" | "done">("all");
  const [bandFilter, setBandFilter] = useState<number | null>(null);

  const done = useMemo(() => new Set(practised), [practised]);
  // Cards for the active tab: the learner's freshly-generated prompts first (newest
  // first — the query already orders by created_at desc), then the curated set sorted
  // by band, lowest → highest.
  const cards = useMemo(() => {
    const inTab = library.filter((p) => p.task_type === tab);
    const generated = inTab.filter((p) => p.generated);
    const curated = inTab
      .filter((p) => !p.generated)
      .sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
    return [...generated, ...curated];
  }, [library, tab]);
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
        // fresh: the explicit "Generate a topic" button always makes a brand-new AI
        // prompt (so it appears, AI-badged and first, in the library afterward).
        body: JSON.stringify({ taskType: kind, fresh: true }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        prompt?: { id: string };
        message?: string;
      };
      if (!res.ok || !body.prompt?.id) {
        setMessage(body.message ?? "Couldn't generate a topic. Please try again.");
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

  // Grade an essay the learner already wrote: create a custom prompt for the pasted
  // question, save the essay as a draft, then run the SAME grade route as everywhere
  // else, and open its stored feedback. A modal covers the wait.
  async function gradeOwn() {
    if (busy) return;
    const q = checkQuestion.trim();
    const essay = checkEssay.trim();
    if (q.length < 10) {
      setMessage("Paste the question or task — at least a sentence.");
      return;
    }
    if (checkWords < 20) {
      setMessage("Paste or write your full essay first (at least 20 words).");
      return;
    }
    setBusy(true);
    setGradingModal(true);
    setMessage(null);
    try {
      // 1) register the question as a custom prompt
      const pr = await fetch("/api/prompts/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: q, taskType: checkTask }),
      });
      const pb = (await pr.json().catch(() => ({}))) as {
        prompt?: { id: string };
        message?: string;
      };
      if (!pr.ok || !pb.prompt?.id) {
        setMessage(pb.message ?? "Couldn't start grading. Please try again.");
        setBusy(false);
        setGradingModal(false);
        return;
      }
      // 2) save the pasted essay as this prompt's draft
      const saved = await saveDraft({ promptId: pb.prompt.id, essayId: null, content: essay });
      if (!saved.essayId) {
        setMessage("Couldn't save your essay. Please try again.");
        setBusy(false);
        setGradingModal(false);
        return;
      }
      // 3) grade it exactly like any other essay, then open the stored feedback
      const gr = await fetch(`/api/essays/${saved.essayId}/grade`, { method: "POST" });
      if (gr.status === 200) {
        router.push(`/activities/essay/${saved.essayId}`); // keep the modal up until navigation
        return;
      }
      const gb = (await gr.json().catch(() => ({}))) as { message?: string };
      if (gr.status === 202)
        setMessage(
          gb.message ?? "Grading is busy — your essay is saved; try again from Activities shortly.",
        );
      else if (gr.status === 429) setMessage("You’ve reached your monthly grading limit.");
      else setMessage(gb.message ?? "Grading failed. Please try again.");
      setBusy(false);
      setGradingModal(false);
    } catch {
      setMessage("Network error — please try again.");
      setBusy(false);
      setGradingModal(false);
    }
  }

  async function submitCustom() {
    if (busy) return;
    if (customText.trim().length < 10) {
      setMessage("Paste the full question — at least a sentence.");
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
        setMessage(body.message ?? "Couldn't use that question. Please try again.");
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
        width: "100%",
        padding: "32px 24px 64px",
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
          {tab === "check_own" ? (
            <p
              style={{
                fontFamily: SANS,
                fontSize: 16.5,
                lineHeight: 1.55,
                color: MUTED,
                margin: "14px 0 0",
                maxWidth: 760,
              }}
            >
              Check an essay you&rsquo;ve already written, pick a topic, or generate a fresh one.
              You&rsquo;ll get an examiner-strict band per criterion — then revise the same response
              until it&rsquo;s where you want it.
            </p>
          ) : null}
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
              onClick={() => selectTab(t.key)}
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

      {tab === "check_own" ? (
        <div
          className="lp-check-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.2fr)",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          {/* LEFT — the question / task you answered */}
          <section
            style={{
              ...cardStyle,
              padding: "clamp(20px,2.4vw,26px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={iconChip}>
                <ClipboardCheck size={18} strokeWidth={2} />
              </span>
              <div>
                <p
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 600,
                    fontSize: 20,
                    color: INK,
                    margin: 0,
                  }}
                >
                  The question
                </p>
                <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "1px 0 0" }}>
                  Paste the task exactly as you answered it
                </p>
              </div>
            </div>

            {/* task type */}
            <div style={{ display: "flex", gap: 8, margin: "18px 0 14px", flexWrap: "wrap" }}>
              {TASK_OPTIONS.map((o) => (
                <button
                  key={o.k}
                  type="button"
                  onClick={() => setCheckTask(o.k)}
                  style={ownPill(checkTask === o.k)}
                >
                  {o.l}
                </button>
              ))}
            </div>

            <label style={fieldLabel}>The question / task</label>
            <textarea
              value={checkQuestion}
              onChange={(e) => setCheckQuestion(e.target.value)}
              placeholder="Paste the exact IELTS question or task…"
              className="lp-input"
              style={{ ...fieldArea, flex: 1, minHeight: 190, resize: "none" }}
            />
          </section>

          {/* RIGHT — your essay + grade */}
          <section
            style={{
              ...cardStyle,
              padding: "clamp(20px,2.4vw,26px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={iconChip}>
                  <PenLine size={18} strokeWidth={2} />
                </span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <p
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 600,
                        fontSize: 20,
                        color: INK,
                        margin: 0,
                      }}
                    >
                      Your essay
                    </p>
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        fontWeight: 700,
                        color: INDIGO,
                        background: "#ECEBFB",
                        border: "1px solid #E1DFF7",
                        borderRadius: 999,
                        padding: "3px 10px",
                      }}
                    >
                      Graded like the real thing
                    </span>
                  </div>
                  <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "1px 0 0" }}>
                    Examiner-strict band per criterion, with fixes
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 700,
                  color: checkWords >= 20 ? EMERALD : "#9097A8",
                  whiteSpace: "nowrap",
                }}
              >
                {checkWords} words
              </span>
            </div>

            <textarea
              value={checkEssay}
              onChange={(e) => setCheckEssay(e.target.value)}
              placeholder="Paste or write your full answer here…"
              className="lp-input"
              style={{
                ...fieldArea,
                flex: 1,
                minHeight: 300,
                marginTop: 16,
                fontFamily: SERIF,
                fontSize: 16,
                lineHeight: 1.8,
                resize: "none",
              }}
            />

            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => void gradeOwn()}
                disabled={busy}
                style={genButton(busy, true)}
              >
                {busy ? "Grading…" : "Grade my essay"}
                {busy ? null : ARROW}
              </button>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  color: "#9097A8",
                  flex: "1 1 180px",
                  minWidth: 0,
                }}
              >
                Conservative and examiner-strict — your band here is your band on exam day.
              </span>
            </div>
          </section>
        </div>
      ) : tab === "custom" ? (
        <div style={{ ...cardStyle, padding: 24, maxWidth: 720 }}>
          <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK, margin: 0 }}>
            Paste your own question
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
            placeholder="Paste the full IELTS writing question here…"
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
              {busy ? "Loading…" : "Use this question"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* AI banner — the shared aurora "AI generate" section */}
          <div style={{ marginBottom: 38 }}>
            <AiGenerateSection
              title="Let AI choose a fresh topic"
              badge={`Tuned to band ${pitchBand.toFixed(1)}`}
              description="A brand-new, exam-style prompt pitched at your level — closest to the real test."
              cta={
                <AiGenerateButton
                  label="Generate a topic"
                  busyLabel="Generating… ~15s"
                  busy={busy}
                  generating={generatingKind === tab}
                  onClick={() => void generate(tab)}
                  minWidth={200}
                />
              }
            />
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

      {gradingModal ? <GradingModal /> : null}
    </div>
  );
}

const iconChip: React.CSSProperties = {
  flex: "none",
  width: 38,
  height: 38,
  borderRadius: 11,
  background: "#ECEBFB",
  color: INDIGO,
  border: "1px solid #E1DFF7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontFamily: SANS,
  fontWeight: 700,
  fontSize: 13.5,
  color: "#41496A",
  marginBottom: 8,
};

const fieldArea: React.CSSProperties = {
  width: "100%",
  resize: "vertical",
  padding: "14px 16px",
  border: "1px solid #E2DED0",
  borderRadius: 12,
  background: "#fff",
  fontFamily: SANS,
  fontSize: 14.5,
  lineHeight: 1.6,
  color: INK,
};

function ownPill(on: boolean): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 13,
    padding: "7px 13px",
    borderRadius: 999,
    cursor: "pointer",
    border: on ? `1px solid ${INDIGO}` : "1px solid #E2DED0",
    background: on ? "#ECEBFB" : "#fff",
    color: on ? INDIGO : INK,
  };
}

/** Full-screen "AI is grading your essay" overlay shown while the grade call runs. */
function GradingModal() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Grading your essay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(20,20,40,.5)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "34px 34px 30px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 40px 90px -40px rgba(20,20,48,.6)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            width: 60,
            height: 60,
            borderRadius: 17,
            background: "linear-gradient(135deg,#5B55D6,#3B43B5)",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 28px -12px rgba(59,67,181,.7)",
          }}
        >
          <Loader2 size={28} color="#fff" className="animate-spin" />
        </span>
        <h3
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 21,
            color: INK,
            margin: "18px 0 0",
          }}
        >
          AI is grading your essay…
        </h3>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: MUTED,
            margin: "9px 0 0",
          }}
        >
          Reading every criterion the way an examiner would — Task, Coherence, Vocabulary, Grammar.
          This takes about 15–30 seconds; please keep this tab open.
        </p>
        <div style={{ display: "inline-flex", gap: 6, marginTop: 18 }} aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: INDIGO,
                animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out`,
              }}
            />
          ))}
        </div>
      </div>
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

/** Top-right corner marker for prompts this learner generated with AI. */
function AiCorner() {
  return (
    <span
      title="AI-generated"
      aria-label="AI-generated"
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 2,
        width: 26,
        height: 26,
        borderRadius: 8,
        background: "linear-gradient(135deg,#5B55D6,#3B43B5)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 16px -6px rgba(59,67,181,.7)",
      }}
    >
      <Sparkles size={14} strokeWidth={2.4} />
    </span>
  );
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
        position: "relative",
        height: "100%",
        padding: "18px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: busy ? "default" : "pointer",
      }}
    >
      {p.generated ? <AiCorner /> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", paddingRight: p.generated ? 40 : 0 }}>
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
        {!p.generated && p.difficulty ? (
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
