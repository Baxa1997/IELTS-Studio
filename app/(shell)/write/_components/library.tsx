"use client";

import { useT } from "@/shared/components/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ClipboardCheck, Loader2, PenLine, Sparkles } from "lucide-react";

import { AiGenerateSection, AiGenerateButton } from "@/shared/components/ai-generate-section";
import { AttachForm, PracticeModal } from "@/shared/components/console/teacher-practice";
import {
  CardAction,
  CardFoot,
  CardHead,
  CardQuote,
  LevelLabel,
  PracticeCard,
  shortDate,
  StatusPill,
} from "@/shared/components/practice/card";
import {
  bandToLevel,
  groupByLevel,
  levelChipForBand,
  levelSectionTitle,
} from "@/lib/practice/levels";
import { TASK2_CATEGORIES } from "@/lib/prompts/constants";
import { UpgradeNotice } from "@/shared/components/billing/upgrade-notice";
import { LegalFooter } from "@/shared/components/legal-footer";
// These live with the full-screen runner in the (studio) group; the hub library
// only needs the prompt type and the save-draft action from them.
import type { LibraryPrompt } from "@/app/(studio)/write/[id]/_components/writing-studio";
import { saveDraft } from "@/app/(studio)/write/actions";
import {
  BRAND,
  BRAND_FILL,
  BRAND_LINE,
  BRAND_PALE,
  BRAND_SOFT,
  HERO_B,
  HERO_C,
  PANEL,
  SLATE_BODY,
  SLATE_BODY as MUTED,
  SLATE_FIELD,
  SLATE_GREEN as EMERALD,
  SLATE_INK as INK,
  SLATE_LINE,
  SLATE_MUTED,
  SLATE_STRONG,
  WARM_LINE_SOFT,
  WARM_RED,
  WHITE,
} from "@/lib/theme/tokens";
import { PRACTICE_GRID_COLUMNS } from "@/lib/practice/grid";

export type { LibraryPrompt };

// ---- Brand tokens (Option A; indigo kept at #7D0132 for app-wide consistency) ----

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";

const cardStyle: React.CSSProperties = {
  position: "relative",
  background: PANEL,
  border: "1px solid var(--pc-border)",
  borderRadius: 14,
  color: INK,
  boxShadow: "var(--pc-shadow)",
};

/* ⚠️ THESE HOLD KEYS, NOT LABELS. A module constant is evaluated once at import
   — outside React, before any locale is known — so it cannot call `t()`. The
   render translates it instead. */
const TABS: { key: string; labelKey: MessageKey; soon?: boolean }[] = [
  { key: "check_own", labelKey: "write.checkOwn" },
  { key: "task1_academic", labelKey: "write.acadT1" },
  { key: "task2", labelKey: "write.acadT2" },
  { key: "task1_general", labelKey: "write.gt" },
];

/** Task-type options shared by the "check own writing" and custom-prompt panels. */
const TASK_OPTIONS: { k: string; lKey: MessageKey }[] = [
  { k: "task2", lKey: "write.acadT2" },
  { k: "task1_general", lKey: "write.gt" },
  { k: "task1_academic", lKey: "write.acadT1" },
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

/** An essay the learner started on this prompt and never submitted. */
export interface PromptDraft {
  essayId: string;
  words: number;
  at: string | null;
}

/** The learner's marked essay on this prompt — the card's graded state. */
export interface PromptMark {
  essayId: string;
  band: number | null;
  words: number;
  at: string | null;
}

export function WritingLibrary({
  library,
  practised,
  drafts = {},
  marked = {},
  pitchBand,
  isTeacher = false,
  groups = [],
}: {
  library: LibraryPrompt[];
  /** Prompt ids the learner has already attempted — badged + filterable, but every
   *  card still starts a fresh attempt. Past grades are reviewed under Activities. */
  practised: string[];
  /** Unfinished drafts and finished marks, keyed by prompt id. Plain objects
   *  rather than Maps because this is a client component. */
  drafts?: Record<string, PromptDraft>;
  marked?: Record<string, PromptMark>;
  /** The band generated tasks are tuned to (computed from the learner's level). */
  pitchBand: number;
  /** Teachers get Attach on every card, not only on what they just generated. */
  isTeacher?: boolean;
  groups?: { id: string; name: string }[];
}) {
  const t = useT();
  const router = useRouter();
  // The prompt a teacher is setting to a class. assignPractice approves a
  // still-pending prompt as part of assigning, so a library id goes straight in.
  const [attachId, setAttachId] = useState<string | null>(null);
  // A teacher has no band of their own, so "Generate a topic" asks for the
  // class's level first instead of silently using the learner default.
  const [setupOpen, setSetupOpen] = useState(false);
  const [level, setLevel] = useState(7);
  const [genCategory, setGenCategory] = useState("");
  const [preference, setPreference] = useState("");
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
  // Stable "Practice test N" number per card — indexed off the full tab list (not the
  // filtered view) so a card keeps its number when searches/filters are applied.
  const numById = useMemo(() => new Map(cards.map((p, i) => [p.id, i + 1])), [cards]);
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

  /* The learner's own generated prompts stay a flat, newest-first block; only the
     curated library is split into levels. Both come from `visible`, so a search or
     a band filter narrows the sections exactly as it narrowed the single grid. */
  const visibleGenerated = visible.filter((p) => p.generated);
  const visibleCurated = visible.filter((p) => !p.generated);

  /** One card. Extracted so the flat block and every level block draw the same
   *  thing — they diverge the moment this is written out twice. */
  const card = (p: (typeof cards)[number]) => (
    <PromptCard
      key={p.id}
      p={p}
      num={numById.get(p.id) ?? 0}
      done={done.has(p.id)}
      draft={drafts[p.id]}
      mark={marked[p.id]}
      busy={busy}
      onOpen={() => open(p.id, numById.get(p.id))}
      attach={
        isTeacher ? { onAttach: () => setAttachId(p.id), disabled: groups.length === 0 } : undefined
      }
    />
  );

  function open(id: string, num?: number) {
    setBusy(true);
    // Carry the card's "Practice test N" number into the studio header.
    router.push(num != null ? `/write/${id}?n=${num}` : `/write/${id}`);
  }

  async function generate(kind: string) {
    if (busy) return;
    // Teachers answer the level question first; the modal calls back in here.
    if (isTeacher && !setupOpen) {
      setSetupOpen(true);
      return;
    }
    setBusy(true);
    setGeneratingKind(kind);
    setMessage(null);
    try {
      const res = await fetch("/api/prompts/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // fresh: the explicit "Generate a topic" button always makes a brand-new AI
        // prompt (so it appears, AI-badged and first, in the library afterward).
        body: JSON.stringify({
          taskType: kind,
          fresh: true,
          ...(isTeacher
            ? {
                difficulty: level,
                ...(genCategory ? { category: genCategory } : {}),
                // The composer writes about this, so a teacher's note is a real
                // instruction rather than a label.
                ...(preference.trim().length >= 2
                  ? { topicFamily: preference.trim().slice(0, 50) }
                  : {}),
              }
            : {}),
        }),
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
      // A learner generated this to write it, so open it. A teacher generated
      // it to look at and set, so it lands as a card in the library instead —
      // refreshed rather than pushed, which is the whole point of the change.
      if (isTeacher) {
        setSetupOpen(false);
        setBusy(false);
        setGeneratingKind(null);
        router.refresh();
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
      else if (gr.status === 429)
        setMessage("You’ve used this month’s free gradings (your monthly grading limit).");
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
      className="lp-hub-pad"
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
            {t("write.hub")}
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
            border: `1px solid ${WARM_LINE_SOFT}`,
            background: PANEL,
            borderRadius: 11,
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            color: SLATE_STRONG,
            textDecoration: "none",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: SLATE_STRONG }}
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
          borderBottom: "1px solid var(--hb-cream-line)",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              type="button"
              onClick={() => selectTab(tb.key)}
              disabled={tb.soon}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 46,
                padding: "0 16px",
                marginBottom: -1,
                border: "none",
                background: "transparent",
                borderBottom: active ? `2.5px solid ${BRAND}` : "2.5px solid transparent",
                color: active ? BRAND : tb.soon ? "var(--hb-dim-line)" : SLATE_BODY,
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: active ? 700 : 600,
                cursor: tb.soon ? "default" : "pointer",
              }}
            >
              {t(tb.labelKey)}
              {tb.soon ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    color: "var(--hb-soon-ink)",
                    background: "var(--hb-soon-bg)",
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
        <div style={{ marginBottom: 20 }}>
          <UpgradeNotice message={message} />
        </div>
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
                  {t("write.question")}
                </p>
                <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "1px 0 0" }}>
                  {t("write.pasteExact")}
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
                  {t(o.lKey)}
                </button>
              ))}
            </div>

            <label style={fieldLabel}>{t("write.questionTask")}</label>
            <textarea
              value={checkQuestion}
              onChange={(e) => setCheckQuestion(e.target.value)}
              placeholder={t("write.phQuestion")}
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
                      {t("write.yourEssay")}
                    </p>
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        fontWeight: 700,
                        color: BRAND,
                        background: BRAND_SOFT,
                        border: `1px solid ${BRAND_LINE}`,
                        borderRadius: 999,
                        padding: "3px 10px",
                      }}
                    >
                      {t("write.gradedReal")}
                    </span>
                  </div>
                  <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "1px 0 0" }}>
                    {t("write.perCriterion")}
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 700,
                  color: checkWords >= 20 ? EMERALD : SLATE_MUTED,
                  whiteSpace: "nowrap",
                }}
              >
                {checkWords} words
              </span>
            </div>

            <textarea
              value={checkEssay}
              onChange={(e) => setCheckEssay(e.target.value)}
              placeholder={t("write.phEssay")}
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
                  color: SLATE_MUTED,
                  flex: "1 1 180px",
                  minWidth: 0,
                }}
              >
                {t("write.conservative")}
              </span>
            </div>
          </section>
        </div>
      ) : tab === "custom" ? (
        <div style={{ ...cardStyle, padding: 24, maxWidth: 720 }}>
          <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK, margin: 0 }}>
            {t("write.pasteOwn")}
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
              { k: "task2", l: t("write.acadT2") },
              { k: "task1_general", l: t("write.gt") },
              { k: "task1_academic", l: t("write.acadT1") },
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
                  border: customTask === o.k ? `1px solid ${BRAND}` : `1px solid ${WARM_LINE_SOFT}`,
                  background: customTask === o.k ? BRAND_SOFT : PANEL,
                  color: customTask === o.k ? BRAND : INK,
                }}
              >
                {o.l}
              </button>
            ))}
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={t("write.phFull")}
            className="lp-input"
            style={{
              width: "100%",
              minHeight: 130,
              resize: "vertical",
              padding: "12px 14px",
              border: `1px solid ${WARM_LINE_SOFT}`,
              borderRadius: 12,
              background: PANEL,
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
          <div style={{ marginBottom: 28 }}>
            <AiGenerateSection
              title={t("write.letAI")}
              badge={`Tuned to band ${pitchBand.toFixed(0)}`}
              description="A brand-new, exam-style prompt pitched at your level — closest to the real test."
              cta={
                <AiGenerateButton
                  label={t("write.generate")}
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
          {/* <div
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
            <span style={{ fontFamily: SANS, fontSize: 14, color: SLATE_MUTED }}>
              Showing <strong style={{ color: INK }}>{visible.length}</strong> of {cards.length}
            </span>
          </div> */}

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
                  background: PANEL,
                  border: `1px solid ${WARM_LINE_SOFT}`,
                  borderRadius: 11,
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ stroke: SLATE_MUTED }}
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("write.searchTopics")}
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
                    ["done", t("write.practised")],
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
                        color: on ? BRAND : SLATE_BODY,
                        background: on ? BRAND_SOFT : PANEL,
                        border: on ? `1px solid ${BRAND_PALE}` : `1px solid ${WARM_LINE_SOFT}`,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                <select
                  value={bandFilter ?? ""}
                  onChange={(e) => setBandFilter(e.target.value ? Number(e.target.value) : null)}
                  aria-label={t("write.filterBand")}
                  style={{
                    height: 44,
                    padding: "0 12px",
                    borderRadius: 11,
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: bandFilter != null ? BRAND : SLATE_BODY,
                    background: bandFilter != null ? BRAND_SOFT : PANEL,
                    border:
                      bandFilter != null
                        ? `1px solid ${BRAND_PALE}`
                        : `1px solid ${WARM_LINE_SOFT}`,
                  }}
                >
                  <option value="">{t("write.anyBand")}</option>
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
                {t("write.noMatch")}
              </p>
            </div>
          ) : (
            <>
              {/* The learner's own prompts: one flat block, newest first, exactly
                  as before. A level heading over a list of two or three would
                  fragment it rather than organise it. */}
              {visibleGenerated.length > 0 ? (
                <CardGrid>{visibleGenerated.map(card)}</CardGrid>
              ) : null}
              {groupByLevel(visibleCurated, (p) => bandToLevel(p.difficulty)).map(
                ({ level, items }) => (
                  <Fragment key={level ?? "mixed"}>
                    <LevelLabel>{levelSectionTitle(t, level)}</LevelLabel>
                    <CardGrid>{items.map(card)}</CardGrid>
                  </Fragment>
                ),
              )}
            </>
          )}
        </>
      )}

      {gradingModal ? <GradingModal /> : null}

      {setupOpen ? (
        <PracticeModal title={t("write.newPractice")} onClose={() => setSetupOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="wl-level" style={genLabel}>
                {t("write.classLevel")}
              </label>
              <select
                id="wl-level"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                style={genField}
              >
                {[4, 5, 6, 7, 8, 9].map((b) => (
                  <option key={b} value={b}>
                    Band {b}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: SLATE_MUTED, margin: "6px 0 0", lineHeight: 1.5 }}>
                How demanding the wording and ideas are. A student practising alone gets this
                pitched from their own measured band — a class has no single band, so you say.
              </p>
            </div>

            {tab === "task2" ? (
              <div>
                <label htmlFor="wl-cat" style={genLabel}>
                  {t("write.questionType")}{" "}
                  <span style={{ color: SLATE_MUTED }}>{t("write.optional")}</span>
                </label>
                <select
                  id="wl-cat"
                  value={genCategory}
                  onChange={(e) => setGenCategory(e.target.value)}
                  style={genField}
                >
                  <option value="">{t("write.anySurprise")}</option>
                  {TASK2_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label htmlFor="wl-pref" style={genLabel}>
                {t("write.topicPref")}{" "}
                <span style={{ color: SLATE_MUTED }}>{t("write.optional")}</span>
              </label>
              <input
                id="wl-pref"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                maxLength={50}
                placeholder={t("write.egTopics")}
                style={genField}
              />
            </div>

            {message ? <p style={{ fontSize: 13, color: WARM_RED, margin: 0 }}>{message}</p> : null}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => void generate(tab)}
                disabled={busy}
                style={{
                  flex: 1,
                  background: BRAND_FILL,
                  color: WHITE,
                  border: 0,
                  borderRadius: 10,
                  padding: 11,
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: busy ? "wait" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "Generating…" : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => setSetupOpen(false)}
                style={{
                  background: PANEL,
                  border: `1px solid ${SLATE_LINE}`,
                  borderRadius: 10,
                  padding: "11px 16px",
                  fontFamily: SANS,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </PracticeModal>
      ) : null}

      {attachId ? (
        <PracticeModal title={t("card.attachClass")} onClose={() => setAttachId(null)}>
          <AttachForm
            kind="writing"
            contentId={attachId}
            groups={groups}
            onDone={() => setAttachId(null)}
          />
        </PracticeModal>
      ) : null}

      <LegalFooter note={t("write.disclaimer")} />
    </div>
  );
}

const iconChip: React.CSSProperties = {
  flex: "none",
  width: 38,
  height: 38,
  borderRadius: 11,
  background: BRAND_SOFT,
  color: BRAND,
  border: `1px solid ${BRAND_LINE}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontFamily: SANS,
  fontWeight: 700,
  fontSize: 13.5,
  color: SLATE_STRONG,
  marginBottom: 8,
};

const fieldArea: React.CSSProperties = {
  width: "100%",
  resize: "vertical",
  padding: "14px 16px",
  border: `1px solid ${WARM_LINE_SOFT}`,
  borderRadius: 12,
  background: PANEL,
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
    border: on ? `1px solid ${BRAND}` : `1px solid ${WARM_LINE_SOFT}`,
    background: on ? BRAND_SOFT : PANEL,
    color: on ? BRAND : INK,
  };
}

/** Full-screen "AI is grading your essay" overlay shown while the grade call runs. */
function GradingModal() {
  const t = useT();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("write.gradingTitle")}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "var(--ex-scrim)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: PANEL,
          borderRadius: 20,
          padding: "34px 34px 30px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 40px 90px -40px rgba(20,20,48,.6), 0 0 0 1px var(--ex-ring)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            width: 60,
            height: 60,
            borderRadius: 17,
            // The hero stops, not BRAND_MID/BRAND: identical in light, and deep
            // enough in dark to keep the white spinner on them legible.
            background: `linear-gradient(135deg,${HERO_C},${HERO_B})`,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 28px -12px rgba(125,1,50,.7)",
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
          {t("write.grading")}
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
                background: BRAND_FILL,
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
    background: BRAND_FILL,
    color: WHITE,
    fontFamily: SANS,
    fontSize: big ? 15.5 : 15,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
    boxShadow: "0 10px 24px -10px rgba(125,1,50,.8)",
    flex: "none",
  };
}

/**
 * A writing card, built from the shared kit in shared/components/practice/card.tsx.
 *
 * The canvas gives Writing a body of its own: the essay question itself, set in
 * the serif and clamped to two lines, instead of Reading's title + subtitle. Its
 * sequence tile is the dark "ink" variant, which is the one place the three hubs
 * deliberately differ.
 *
 * ⚠️ AN AI-GENERATED PROMPT STAYS SEALED, AND THAT IS THE CANVAS'S OWN RULE.
 * The owner's call was "reveal the question" — and the canvas does reveal it, for
 * a library prompt. But its "New" card shows a MUTED teaser instead ("Fresh
 * exam-style prompt on city transport, revealed the moment you start"), because a
 * freshly generated prompt's wording is not settled until the learner starts it.
 * So `generated` keeps the teaser and everything else shows `prompt_text`, which
 * is both 1:1 with the design and the behaviour the hub already had.
 */
function PromptCard({
  p,
  num,
  done,
  draft,
  mark,
  busy,
  onOpen,
  attach,
}: {
  p: LibraryPrompt;
  num: number;
  done: boolean;
  draft?: PromptDraft;
  mark?: PromptMark;
  busy: boolean;
  onOpen: () => void;
  attach?: { onAttach: () => void; disabled: boolean };
}) {
  const t = useT();
  const topic = p.topic_family && p.topic_family !== "custom" ? p.topic_family : null;
  const target = wordTarget(p.task_type);
  // An unfinished draft outranks a past mark: it is the thing left open.
  const state = draft ? "draft" : mark ? "marked" : p.generated ? "fresh" : "target";

  const finished = state === "marked";
  return (
    <PracticeCard
      // "done" rather than "ink": Reading and Listening already tint a finished
      // card green, and the same state wearing two looks across the hubs was an
      // accident of them being built apart.
      tone={busy ? null : finished ? "done" : "brand"}
      surface={finished ? "done" : "open"}
      style={{ opacity: busy ? 0.7 : 1 }}
    >
      <CardHead
        seq={num}
        seqTone="ink"
        icon={<PenLine size={12} strokeWidth={2} />}
        label="WRITING"
        // The task type is the tab above and the topic is the prompt below, so
        // neither earned its place up here. The level is what varies.
        level={levelChipForBand(p.difficulty)}
        dim={finished}
        pill={<PromptPill state={state} mark={mark} done={done} />}
      />

      {/* `full` only where there is something to reveal: a fresh prompt's own
          text is deliberately sealed until the learner starts it. */}
      <CardQuote muted={state === "fresh"} full={state === "fresh" ? undefined : p.prompt_text}>
        {state === "fresh"
          ? `Fresh exam-style ${taskLabel(p.task_type).toLowerCase()} prompt${
              topic ? ` on ${topic}` : ""
            }, revealed the moment you start.`
          : `“${p.prompt_text}”`}
      </CardQuote>

      <CardFoot meta={promptMeta({ state, draft, mark, target, taskType: p.task_type })}>
        {attach ? (
          <CardAction
            kind="attach"
            onClick={attach.onAttach}
            disabled={attach.disabled}
            title={attach.disabled ? "Create a class first" : undefined}
          >
            {t("card.attach")}
          </CardAction>
        ) : null}
        {/* ⚠️ ON A MARKED PROMPT, FEEDBACK IS THE PRIMARY AND REWRITE IS NOT —
            and the revision loop is the point of this product, so reading the
            marking before rewriting is the order we want anyway. The primary is
            also last, so the order swaps with the emphasis. */}
        {mark && !draft ? (
          <>
            <CardAction kind="secondary" onClick={onOpen} disabled={busy}>
              {t("write.rewrite")}
            </CardAction>
            <CardAction href={`/activities/essay/${mark.essayId}`}>
              {t("write.feedback")}
            </CardAction>
          </>
        ) : (
          <CardAction
            onClick={onOpen}
            disabled={busy}
            icon={<ArrowRight size={14} strokeWidth={2.4} />}
          >
            {draft ? "Continue" : done ? "Retake" : "Start"}
          </CardAction>
        )}
      </CardFoot>
    </PracticeCard>
  );
}

/** Which status pill a writing card wears. */
function PromptPill({
  state,
  mark,
  done,
}: {
  state: "draft" | "marked" | "fresh" | "target";
  mark?: PromptMark;
  /** Attempted at some point, per the `practised` list. */
  done?: boolean;
}) {
  const t = useT();
  if (state === "draft") return <StatusPill tone="progress">{t("write.draft")}</StatusPill>;
  if (state === "marked" && mark) {
    return (
      <StatusPill tone="band" icon={<Check size={9} strokeWidth={3} />}>
        {mark.band != null ? `Band ${mark.band.toFixed(1)}` : "Marked"}
      </StatusPill>
    );
  }
  if (state === "fresh") {
    return (
      <StatusPill tone="new" icon={<Sparkles size={9} strokeWidth={2.2} />}>
        {t("card.new")}
      </StatusPill>
    );
  }
  /* ⚠️ ATTEMPTED, BUT WITH NO MARK AND NO DRAFT BEHIND IT. It happens when the
     grading failed or the essay was deleted, and the card used to render
     identically to one never touched — only the button label changed. The
     "Practised" filter could therefore list cards that looked unpractised. */
  if (done) {
    return (
      <StatusPill tone="target" icon={<Check size={9} strokeWidth={3} />}>
        {t("write.practised")}
      </StatusPill>
    );
  }
  /* Nothing. The pitch used to sit here as "Band 5", which collided with the
     "Band 7.0" this same pill shows once the essay is marked — one word, one
     scale, two unrelated meanings. It is the level chip in the head now, on the
     scale Reading and Listening already share. */
  return null;
}

/** The footer's left-hand line, which says something different in every state. */
function promptMeta({
  state,
  draft,
  mark,
  target,
  taskType,
}: {
  state: "draft" | "marked" | "fresh" | "target";
  draft?: PromptDraft;
  mark?: PromptMark;
  target: number;
  taskType: string;
}): string {
  if (state === "draft" && draft) {
    return `${draft.words} of ${target} words · saved ${shortDate(draft.at)}`;
  }
  if (state === "marked" && mark) {
    return [`${mark.words} words`, mark.at ? `marked ${shortDate(mark.at)}` : ""]
      .filter(Boolean)
      .join(" · ");
  }
  return `${target} words · ${estMinutes(taskType)} min`;
}

/** "Task 2" / "Task 1" — the eyebrow's middle segment. */
function taskLabel(taskType: string): string {
  if (taskType === "task2") return "Task 2";
  if (taskType === "task1_general") return "Task 1 GT";
  return "Task 1";
}

/** The word count the exam asks for, which the draft state counts against. */
function wordTarget(taskType: string): number {
  return taskType === "task2" ? 250 : 150;
}

function estMinutes(taskType: string): number {
  return taskType === "task2" ? 40 : 20;
}

const genLabel: React.CSSProperties = {
  display: "block",
  fontFamily: SANS,
  fontSize: 12.5,
  color: SLATE_BODY,
  marginBottom: 5,
};
const genField: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${SLATE_FIELD}`,
  borderRadius: 9,
  padding: "10px 11px",
  fontFamily: SANS,
  fontSize: 13.5,
  background: PANEL,
};

/**
 * Three cards to a row, matching the Reading hub. The cap lives in the TRACK SIZE
 * rather than in breakpoints: each track is at least a third of the row, so a
 * fourth can never fit, and once a third would be under 280px the floor wins and
 * auto-fit drops to two, then one.
 *
 * ⚠️ INLINE, not a class. A `.lp-write-grid` rule in globals.css did not reach the
 * running dev server while every other rule in that file was live, and the grid
 * silently fell back to block-stacked full-width cards. Expressing the cap here
 * leaves no media query an inline style could outrank. 28px is the two 14px gaps
 * and must match `gap`; the class name is kept only as a hook with no rule behind it.
 */
function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="lp-write-grid"
      style={{
        display: "grid",
        gridTemplateColumns: PRACTICE_GRID_COLUMNS,
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}
