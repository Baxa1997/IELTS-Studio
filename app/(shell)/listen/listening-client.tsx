"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Headphones, Loader2, Lock, RotateCcw, Sparkles, X } from "lucide-react";

import { AiGenerateButton, AiGenerateSection } from "@/components/ai-generate-section";
import { UpgradeNotice } from "@/components/billing/upgrade-notice";
import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

/**
 * Listening hub + runner, backed by the SHARED practice library: practices are
 * pre-generated on the engine (script + narrator-framed TTS audio, difficulty
 * 1–5) and open instantly for every learner. Free plan unlocks 5 practices;
 * paid plans get the whole library (enforced server-side — the engine returns
 * 429 with an upgrade message past the limit). The runner plays the audio once
 * with countdown reading pauses (pause allowed for practice, no seeking),
 * grades by id server-side, and reveals the transcript + trap mechanisms.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#4338CA";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const TINT = "#EFEEFC";
const GOOD = "#15803d";
const BAD = "#b91c1c";

/* ---- Runner design tokens (IELTS Listening handoff) -------------------------
 * The in-test screen is a flat, full-bleed light exam surface with a violet
 * accent (#7c5cfc / #6d4aef on #f4f4f7) and DM Sans throughout. Values map to
 * the IELTS Listening.dc.html handoff so the runner recreates it closely. */
const DM = "var(--font-dmsans), -apple-system, system-ui, sans-serif";
const RUN = {
  // fonts — one family across the whole surface
  display: DM,
  sans: DM,
  mono: DM,
  // violet accent
  v: "#7c5cfc",
  vHover: "#6b4be0",
  vDeep: "#6d4aef",
  vBg: "#f3f0ff",
  vSoft: "#f5f2ff",
  vBorder: "#e4defb",
  vTrack: "#e8e4fb",
  field: "#ffffff",
  fieldFocus: "#ffffff",
  focusBorder: "#b3a5f7",
  // surfaces
  desk: "#f4f4f7",
  frame: "#ffffff",
  strip: "#faf9ff",
  rail: "#e8e4fb",
  // borders
  bFrame: "#ececf1",
  bBar: "#ececf1",
  bCard: "#ececf1",
  bHair: "#f2f2f6",
  bRow: "#f2f2f6",
  bField: "#e6e6ed",
  bPill: "#ececf1",
  bTab: "#ececf1",
  // text
  t1: "#1a1a24",
  t2: "#6b6f7e",
  t3: "#9497a4",
  t4: "#b9bcc9",
  t5: "#c7cad6",
  t6: "#9497a4",
  // success (answered)
  ok: "#1b9e54",
  okBg: "#e7f7ee",
  okBorder: "#c4ead3",
  okTint: "#f4fbf7",
  // flag / amber
  flag: "#e0952f",
  flagText: "#b9772a",
  flagBg: "#fdf3e3",
  flagBorder: "#f2d9a8",
  flagFill: "#f0c06a",
  // report
  report: "#dc2626",
  reportBg: "#fef6f6",
  reportBorder: "#f3c4c4",
} as const;

/** Part → its "genre" subtitle, shown next to the Part label in the runner. */
const PART_GENRE: Record<number, string> = {
  1: "Conversation",
  2: "Monologue",
  3: "Discussion",
  4: "Lecture",
};

// ---- Engine call -----------------------------------------------------------

async function callEngine<T>(path: string, body: unknown): Promise<T> {
  const backend = clientEnv.aiBackendUrl;
  if (!backend) {
    throw new Error(
      "AI backend isn’t configured. Set NEXT_PUBLIC_AI_BACKEND_URL to the engine URL.",
    );
  }
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Your session expired — please sign in again.");

  const res = await fetch(`${backend}/listening/${path}`, {
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

type AudioSeg = { kind: "audio"; url: string; path: string; label: string; seconds?: number };
type PauseSeg = { kind: "pause"; seconds: number; label: string };
type Segment = AudioSeg | PauseSeg;

type FormRow = { label: string; template: string; section: string | null };
type NoteLine = { template: string; sub: boolean };
type NoteSection = { heading: string; lines: NoteLine[] };

type ClusterView = { questions: number[]; stem: string; options: Record<string, string> };
type MatchingView = {
  heading: string;
  items: { q: number; label: string }[];
  options: Record<string, string>;
};
type McqView = { q: number; stem: string; options: Record<string, string> };

/** One part's question material (also the shape of a single-part practice). */
type PartView = {
  part: number;
  topic: string;
  narrator_intro: string;
  form?: { title: string; word_limit: string; rows: FormRow[] };
  notes?: { title: string; word_limit: string; sections: NoteSection[] };
  clusters?: ClusterView[];
  matching?: MatchingView;
  mcqs?: McqView[];
  context?: string;
};

type RenderView = PartView & {
  id: string;
  difficulty?: number;
  audio: Segment[];
  kind?: "test";
  parts?: PartView[]; // full test: all four parts' questions
};

type QResult = {
  q: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  kind: string;
  trap: string | null;
};
type Grade = {
  part: number;
  score: number;
  max_score: number;
  results: QResult[];
  transcript: { speaker: string; text: string }[];
  kind?: "test";
  band?: number;
  parts?: { part: number; score: number; max_score: number }[];
};

type LibraryItem = {
  id: string;
  part: number;
  topic: string;
  difficulty: number;
  unlocked: boolean;
  locked: boolean;
  best_score: number | null;
};
type Catalogue = {
  items: LibraryItem[];
  plan_paid: boolean;
  free_used: number;
  free_limit: number;
};

type MineItem = {
  id: string;
  part: number;
  topic: string;
  difficulty: number;
  created_at: string | null;
};

/** Which grade endpoint an open practice belongs to. */
type Source = "library" | "mine";

/** Why each trap works, in the learner's language (ids from the engine's
 *  listening spec — P1 audio traps + P4 note-paraphrase mechanisms). */
const TRAP_EXPLAIN: Record<string, string> = {
  "wrong-spelling-offer":
    "A plausible spelling was offered first — the correct one was then spelled out letter by letter.",
  "habitual-vs-today":
    "The speaker first described what usually happens; the answer is what applies this time.",
  "condition-before-answer":
    "A vague general statement came first — the specific value followed it.",
  "self-correction": "A value was given, then corrected. Only the amended one counts.",
  "implied-positive-actual-negative":
    "The question implied agreement, but the speaker disagreed — the answer sat in the contrast.",
  "enough-of-x-want-y": "A near-alternative was rejected just before the real answer.",
  "impressive-x-favourite-y":
    "Several options were mentioned — a superlative singled out the right one.",
  "negation-compression":
    "The notes compress a negative statement from the lecture into a short positive phrase.",
  comparative:
    "The notes shorten a comparison the lecturer made — the wording differs, the gap word doesn't.",
  nominalisation:
    "The notes turn the lecturer's verb phrase into a noun phrase around the same gap word.",
  "plausible-not-stated":
    "The wrong option sounded likely from the context — but it was never actually said.",
  "different-subject": "The wrong option's words WERE heard — attached to a different subject.",
  "refute-then-state":
    "The first suggestion was knocked down; the real point came straight after it.",
  "return-to-first": "Other options were rejected and the speakers came back to the first one.",
  "counter-then-agree":
    "A late counter-proposal was confirmed by the other speaker — agreement seals the answer.",
  "answer-in-other-mouth":
    "The answer word was suggested by the OTHER speaker and only confirmed — track who says what.",
  "decoy-number": "A competing wrong figure was spoken nearby — the correct one superseded it.",
  "tier-decoy":
    "An attractive feature of the REJECTED alternative was mentioned just before the real answer.",
  contrast:
    "The answer sat inside a correction or contrast — the first half of the sentence pointed the wrong way.",
  "decoy-figure":
    "Other numbers were spoken in the same breath — the notes ask about a different one.",
  "answer-before-cue":
    "The answer was spoken BEFORE the words the notes use as a cue — waiting for the cue means missing it.",
  "false-lead":
    "A plausible alternative was floated first, then corrected — only the correction counts.",
};

/** Question-type tags per part format (the quick-practice cards show these
 *  instead of part numbers — a practice is just "a practice"). */
const QTYPE_TAGS: Record<number, string[]> = {
  1: ["Form completion"],
  2: ["Multiple choice", "Matching"],
  3: ["Multiple choice", "Matching"],
  4: ["Note completion"],
};

type HubTab = "tests" | "parts";

const LEVEL_STYLE: Record<number, { bg: string; fg: string }> = {
  1: { bg: "#f0fdf4", fg: "#15803d" },
  2: { bg: "#ecfeff", fg: "#0e7490" },
  3: { bg: "#efeefc", fg: "#4338CA" },
  4: { bg: "#fffbeb", fg: "#b45309" },
  5: { bg: "#fef2f2", fg: "#b91c1c" },
};

// ---- Top-level ---------------------------------------------------------------

export function ListeningClient() {
  const [tab, setTab] = useState<HubTab>("tests");
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [mine, setMine] = useState<MineItem[] | null>(null);
  const [view, setView] = useState<RenderView | null>(null);
  const [source, setSource] = useState<Source>("library");
  const [busy, setBusy] = useState<string | null>(null); // library id | "mine:<id>" | "generate"
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    callEngine<Catalogue>("library", {})
      .then((c) => {
        if (alive) setCatalogue(c);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the library.");
      });
    callEngine<{ items: MineItem[] }>("list", {})
      .then((r) => {
        if (alive) setMine(r.items ?? []);
      })
      .catch(() => {
        if (alive) setMine([]);
      });
    return () => {
      alive = false;
    };
  }, [view]); // refresh progress after exiting a practice

  const open = useCallback(async (item: LibraryItem) => {
    if (item.locked) {
      setError(
        "You’ve used all 5 free practice unlocks for Listening — upgrade to Pro to open the full library.",
      );
      return;
    }
    setBusy(item.id);
    setError(null);
    try {
      setSource("library");
      setView(await callEngine<RenderView>("library/render", { library_id: item.id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this practice.");
    } finally {
      setBusy(null);
    }
  }, []);

  const openMine = useCallback(async (id: string) => {
    setBusy(`mine:${id}`);
    setError(null);
    try {
      setSource("mine");
      setView(await callEngine<RenderView>("render", { item_id: id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this practice.");
    } finally {
      setBusy(null);
    }
  }, []);

  const generate = useCallback(async (difficulty: number) => {
    setBusy("generate");
    setError(null);
    try {
      setSource("mine");
      // No part is sent — the engine draws a random format, like the real exam.
      setView(await callEngine<RenderView>("generate", { difficulty }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed — please try again.");
    } finally {
      setBusy(null);
    }
  }, []);

  if (view) return <Runner view={view} source={source} onExit={() => setView(null)} />;
  return (
    <Hub
      tab={tab}
      setTab={setTab}
      catalogue={catalogue}
      mine={mine}
      busy={busy}
      error={error}
      onOpen={open}
      onOpenMine={openMine}
      onGenerate={generate}
    />
  );
}

// ---- Hub (mirrors the Reading hub: two tabs, numbered cards) -------------------

function Hub({
  tab,
  setTab,
  catalogue,
  mine,
  busy,
  error,
  onOpen,
  onOpenMine,
  onGenerate,
}: {
  tab: HubTab;
  setTab: (t: HubTab) => void;
  catalogue: Catalogue | null;
  mine: MineItem[] | null;
  busy: string | null;
  error: string | null;
  onOpen: (item: LibraryItem) => void;
  onOpenMine: (id: string) => void;
  onGenerate: (difficulty: number) => void;
}) {
  // Tab 1: FULL tests only (part 0). Tab 2: single-recording quick practices.
  const tests = useMemo(
    () =>
      (catalogue?.items ?? [])
        .filter((it) => it.part === 0)
        .sort((a, b) => a.difficulty - b.difficulty)
        .map((it, i) => ({ ...it, seq: i + 1 })),
    [catalogue],
  );
  const quick = useMemo(
    () =>
      (catalogue?.items ?? [])
        .filter((it) => it.part > 0)
        .sort((a, b) => a.difficulty - b.difficulty)
        .map((it, i) => ({ ...it, seq: i + 1 })),
    [catalogue],
  );

  // "My practice N" — 1 = the first one the learner ever generated.
  const mineSeq = useMemo(() => {
    const list = mine ?? [];
    return list.map((it, i) => ({ ...it, seq: list.length - i }));
  }, [mine]);

  return (
    <div
      className="lp-hub-pad"
      style={{ width: "100%", padding: "26px 24px 64px", fontFamily: SANS, color: INK }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(28px,3.6vw,38px)",
              lineHeight: 1.05,
              letterSpacing: "-.4px",
              margin: 0,
              color: INK,
            }}
          >
            Listening
          </h1>
          {/* <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0", maxWidth: 660 }}>
            Full 4-part practice tests with the real exam&rsquo;s framing — the announcer introduces
            each part, the audio plays once, and every answer is explained after grading.
          </p> */}
        </div>
        {catalogue ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              background: TINT,
              border: "1px solid rgba(67,56,202,.16)",
              color: INDIGO,
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            <Headphones size={15} />
            {catalogue.plan_paid
              ? "Full library"
              : `Free: ${Math.min(catalogue.free_used, catalogue.free_limit)}/${catalogue.free_limit} used`}
          </span>
        ) : null}
      </div>

      {/* Tabs — the same chooser as the Reading hub */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "#F1F1F8",
          border: "1px solid #ECEAF2",
          borderRadius: 14,
          padding: 5,
          marginTop: 22,
          maxWidth: 520,
        }}
      >
        <TabButton
          active={tab === "tests"}
          onClick={() => setTab("tests")}
          icon={<Headphones size={17} />}
          label="Practice tests"
          sub="4 parts · 40 questions"
        />
        <TabButton
          active={tab === "parts"}
          onClick={() => setTab("parts")}
          icon={<Sparkles size={17} />}
          label="Quick practice"
          sub="1 recording · ~8 min"
        />
      </div>

      {error ? (
        <div style={{ marginTop: 18 }}>
          <UpgradeNotice message={error} />
        </div>
      ) : null}

      {tab === "tests" ? (
        !catalogue ? (
          <p
            style={{
              marginTop: 30,
              fontSize: 14.5,
              color: MUTED,
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <Loader2 className="animate-spin" size={16} /> Loading the practice tests…
          </p>
        ) : tests.length === 0 ? (
          <EmptyHint>
            The full practice tests are being recorded right now — each one is four parts and forty
            questions. Check back shortly, or try a quick practice meanwhile.
          </EmptyHint>
        ) : (
          <div style={{ marginTop: 20 }}>
            <Grid>
              {tests.map((it) => (
                <TestCard
                  key={it.id}
                  it={it}
                  loading={busy === it.id}
                  disabled={!!busy}
                  onOpen={() => onOpen(it)}
                />
              ))}
            </Grid>
          </div>
        )
      ) : (
        <>
          <div style={{ marginTop: 18 }}>
            <AiGenerateSection
              title="Generate a quick practice"
              badge="AI Studio"
              description="One recording, ten questions — the format is a surprise until the announcer speaks, so every practice trains a different listening question type. Recorded as studio audio at your chosen level in about two minutes, and saved to your account."
              cta={
                <GenerateCta generating={busy === "generate"} disabled={!!busy} onGo={onGenerate} />
              }
            />
          </div>

          {mineSeq.length > 0 ? (
            <>
              <SectionLabel>Your practices</SectionLabel>
              <Grid>
                {mineSeq.map((it) => (
                  <MineCard
                    key={it.id}
                    it={it}
                    loading={busy === `mine:${it.id}`}
                    disabled={!!busy}
                    onOpen={() => onOpenMine(it.id)}
                  />
                ))}
              </Grid>
            </>
          ) : mine != null ? (
            <EmptyHint>
              Nothing here yet — generate your first practice above. Every one you make is saved to
              your account and stays reopenable.
            </EmptyHint>
          ) : null}

          {quick.length > 0 ? (
            <>
              <SectionLabel>Ready-made quick practices</SectionLabel>
              <Grid>
                {quick.map((it) => (
                  <QuickCard
                    key={it.id}
                    it={it}
                    loading={busy === it.id}
                    disabled={!!busy}
                    onOpen={() => onOpen(it)}
                  />
                ))}
              </Grid>
            </>
          ) : null}
        </>
      )}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: "#9A99A8" }}>
        Original audio and questions in the IELTS Listening format — not affiliated with or endorsed
        by IELTS®.
      </p>
    </div>
  );
}

/** Level picker + shimmer CTA for the aurora banner. The part is never chosen —
 *  the generator picks one at random, like walking into the real exam. */
function GenerateCta({
  generating,
  disabled,
  onGo,
}: {
  generating: boolean;
  disabled: boolean;
  onGo: (difficulty: number) => void;
}) {
  const [difficulty, setDifficulty] = useState(3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[1, 2, 3, 4, 5].map((lv) => {
          const on = lv === difficulty;
          return (
            <button
              key={lv}
              type="button"
              onClick={() => setDifficulty(lv)}
              disabled={generating}
              aria-pressed={on}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: on ? "1px solid rgba(255,255,255,.9)" : "1px solid rgba(255,255,255,.28)",
                background: on ? "#fff" : "rgba(255,255,255,.12)",
                color: on ? INDIGO : "rgba(255,255,255,.85)",
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 700,
                cursor: generating ? "default" : "pointer",
              }}
            >
              L{lv}
            </button>
          );
        })}
      </div>
      <AiGenerateButton
        label="Generate practice"
        busyLabel="Recording audio… ~2 min"
        busy={disabled}
        generating={generating}
        onClick={() => onGo(difficulty)}
        minWidth={230}
      />
    </div>
  );
}

function LevelChip({ level, mr }: { level: number; mr?: number }) {
  const lvl = LEVEL_STYLE[level] ?? LEVEL_STYLE[3];
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 700,
        background: lvl.bg,
        color: lvl.fg,
        whiteSpace: "nowrap",
        marginRight: mr,
      }}
    >
      Level {level}
    </span>
  );
}

function BestChip({ score, max }: { score: number; max: number }) {
  const good = score / max >= 0.7;
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 700,
        background: good ? "#E9F5EE" : "#FFF7E8",
        color: good ? GOOD : "#B45309",
        whiteSpace: "nowrap",
      }}
    >
      Best {score}/{max}
    </span>
  );
}

function StartAction({
  loading,
  locked,
  done,
}: {
  loading: boolean;
  locked: boolean;
  done: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: locked ? "#8A899A" : INDIGO,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={14} /> Opening…
        </>
      ) : locked ? (
        <>
          <Lock size={13} /> Pro
        </>
      ) : done ? (
        <>
          Retake <RotateCcw size={13} />
        </>
      ) : (
        <>
          Start <ArrowRight size={14} />
        </>
      )}
    </span>
  );
}

function TypeTags({ part }: { part: number }) {
  const tags = QTYPE_TAGS[part] ?? [];
  if (tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span
          key={t}
          style={{
            background: "#F4F4FB",
            border: "1px solid #ECEAF2",
            color: "#5A596B",
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 7,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/** A FULL 4-part test card ("Practice test N" — 40 questions). */
function TestCard({
  it,
  loading,
  disabled,
  onOpen,
}: {
  it: LibraryItem & { seq: number };
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const done = it.best_score != null;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="lp-hover"
      style={{
        ...cardStyle,
        width: "100%",
        textAlign: "left",
        fontFamily: SANS,
        cursor: disabled ? "default" : "pointer",
        opacity: it.locked ? 0.66 : disabled && !loading ? 0.7 : 1,
      }}
    >
      <div style={rowBetween}>
        <span style={iconTile}>
          <Headphones size={19} />
        </span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {done ? <BestChip score={it.best_score ?? 0} max={40} /> : null}
          <LevelChip level={it.difficulty} />
        </span>
      </div>
      <div>
        <h4 style={cardTitle}>Practice test {it.seq}</h4>
        <span style={{ ...cardSub, display: "block" }}>4 parts · 40 questions · band score</span>
      </div>
      <Divider />
      <div style={rowBetween}>
        <span style={metaText}>≈ 35 min · replay anytime</span>
        <StartAction loading={loading} locked={it.locked} done={done} />
      </div>
    </button>
  );
}

/** A ready-made single-recording practice ("Quick practice N"). */
function QuickCard({
  it,
  loading,
  disabled,
  onOpen,
}: {
  it: LibraryItem & { seq: number };
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const done = it.best_score != null;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="lp-hover"
      style={{
        ...cardStyle,
        width: "100%",
        textAlign: "left",
        fontFamily: SANS,
        cursor: disabled ? "default" : "pointer",
        opacity: it.locked ? 0.66 : disabled && !loading ? 0.7 : 1,
      }}
    >
      <div style={rowBetween}>
        <span style={iconTile}>
          <Headphones size={19} />
        </span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {done ? <BestChip score={it.best_score ?? 0} max={10} /> : null}
          <LevelChip level={it.difficulty} />
        </span>
      </div>
      <div>
        <h4 style={cardTitle}>Quick practice {it.seq}</h4>
        <span
          style={{
            ...cardSub,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {it.topic || "Listening practice"}
        </span>
      </div>
      <TypeTags part={it.part} />
      <Divider />
      <div style={rowBetween}>
        <span style={metaText}>10 questions · replay anytime</span>
        <StartAction loading={loading} locked={it.locked} done={done} />
      </div>
    </button>
  );
}

/** One of the learner's own AI-generated practices ("My practice N"). */
function MineCard({
  it,
  loading,
  disabled,
  onOpen,
}: {
  it: MineItem & { seq: number };
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const when = it.created_at
    ? new Date(it.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="lp-hover"
      style={{
        ...cardStyle,
        width: "100%",
        textAlign: "left",
        fontFamily: SANS,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !loading ? 0.7 : 1,
      }}
    >
      <AiCorner />
      <div style={rowBetween}>
        <span style={iconTile}>
          <Sparkles size={19} />
        </span>
        <LevelChip level={it.difficulty} mr={34} />
      </div>
      <div>
        <h4 style={cardTitle}>My practice {it.seq}</h4>
        <span
          style={{
            ...cardSub,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {it.topic || "Listening practice"}
        </span>
      </div>
      <TypeTags part={it.part} />
      <Divider />
      <div style={rowBetween}>
        <span style={metaText}>{when ? `Generated ${when}` : "Saved to your account"}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: INDIGO,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={14} /> Opening…
            </>
          ) : (
            <>
              Open <ArrowRight size={14} />
            </>
          )}
        </span>
      </div>
    </button>
  );
}

// ---- Hub pieces (visual language shared with the Reading hub) ------------------

function TabButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: active ? "#fff" : "transparent",
        color: active ? INDIGO : MUTED,
        boxShadow: active ? "0 2px 8px -3px rgba(28,27,46,.28)" : "none",
        transition: "background .15s ease",
      }}
    >
      <span style={{ display: "flex", flex: "none", color: active ? INDIGO : "#8A899A" }}>
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontFamily: SANS, fontWeight: active ? 700 : 600, fontSize: 14.5 }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: active ? "#7C78C9" : "#9A99A8",
            marginTop: 2,
          }}
        >
          {sub}
        </span>
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 14px" }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>
        {children}
      </span>
      <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.1)" }} />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ marginTop: 18, fontSize: 13.5, color: "#8A899A", fontFamily: SANS }}>{children}</p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(28,27,46,.07)" }} />;
}

/** Top-right corner marker for the learner's own AI-generated cards. */
function AiCorner() {
  return (
    <span
      title="AI-generated"
      aria-label="AI-generated"
      style={{
        position: "absolute",
        top: 14,
        right: 14,
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

const cardStyle: React.CSSProperties = {
  position: "relative",
  background: "#fff",
  border: "1px solid rgba(28,27,46,.09)",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 11,
  color: INK,
  boxShadow: "0 1px 3px rgba(28,27,46,.04)",
};
const rowBetween: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};
const cardTitle: React.CSSProperties = {
  fontFamily: SANS,
  fontWeight: 700,
  fontSize: 15.5,
  lineHeight: 1.3,
  margin: "0 0 3px",
  color: INK,
};
const cardSub: React.CSSProperties = { fontSize: 13.5, color: "#7A7989", fontWeight: 500 };
const metaText: React.CSSProperties = { fontSize: 13, color: "#8A899A" };
const iconTile: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 11,
  background: "#EFEEFC",
  color: INDIGO,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
};

// ---- Runner --------------------------------------------------------------------

type PlayerPhase = "idle" | "running" | "finished";

/** Every question number a part view carries (gaps, clusters, MCQs, matching). */
function partQuestionNums(p: PartView): number[] {
  const templates = p.form
    ? p.form.rows.map((r) => r.template)
    : (p.notes?.sections ?? []).flatMap((s) => s.lines.map((l) => l.template));
  const nums = templates.flatMap((t) => [...t.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])));
  for (const c of p.clusters ?? []) nums.push(...c.questions);
  for (const m of p.mcqs ?? []) nums.push(m.q);
  for (const it of p.matching?.items ?? []) nums.push(it.q);
  return nums.sort((a, b) => a - b);
}

/** Everything a question panel needs to render + drive the runner's shared
 *  state (answers, review results, focus highlight, per-question flags). */
type QCtx = {
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  results: Map<number, QResult> | null;
  flags: Set<number>;
  toggleFlag: (n: number) => void;
  focusedQ: number;
  setFocus: (n: number) => void;
};

function Runner({
  view,
  source,
  onExit,
}: {
  view: RenderView;
  source: Source;
  onExit: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<Set<number>>(() => new Set());
  const [grade, setGrade] = useState<Grade | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedQ, setFocusedQ] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isTest = view.kind === "test";
  const partViews = useMemo(() => (isTest ? (view.parts ?? []) : [view]), [view, isTest]);
  const [manualPart, setManualPart] = useState<number | null>(null);

  const player = useSegmentPlayer(view.audio);

  // The visible part follows the audio as it crosses part boundaries (a test's
  // recording plays 1→4); tabbing to a played part overrides that (derived, so
  // there is no effect syncing state back and forth).
  const currentPart = manualPart ?? (isTest ? player.audioPart : (partViews[0]?.part ?? 1));

  const questionNums = useMemo(
    () => partViews.flatMap(partQuestionNums).sort((a, b) => a - b),
    [partViews],
  );
  const answered = questionNums.filter((n) => (answers[n] ?? "").trim()).length;

  const visiblePart = useMemo(
    () => partViews.find((p) => p.part === currentPart) ?? partViews[0],
    [partViews, currentPart],
  );
  const partNums = useMemo(() => (visiblePart ? partQuestionNums(visiblePart) : []), [visiblePart]);
  // A valid highlighted question for the visible part (derived, not stored).
  const currentQChip = partNums.includes(currentQ) ? currentQ : (partNums[0] ?? 0);

  const toggleFlag = useCallback((n: number) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  const setFocus = useCallback((n: number) => {
    setFocusedQ(n);
    setCurrentQ(n);
  }, []);

  const goTo = useCallback((n: number) => {
    setCurrentQ(n);
    const el = document.getElementById(`q-${n}`);
    const c = scrollRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
  }, []);

  const submit = useCallback(async () => {
    setGrading(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(answers)) body[k] = v;
      const graded =
        source === "library"
          ? await callEngine<Grade>("library/grade", { library_id: view.id, answers: body })
          : await callEngine<Grade>("grade", { item_id: view.id, answers: body });
      setGrade(graded);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed — please try again.");
    } finally {
      setGrading(false);
    }
  }, [answers, view.id, source]);

  const practiceAgain = useCallback(() => {
    setAnswers({});
    setFlags(new Set());
    setGrade(null);
    setError(null);
    setManualPart(null);
    setCurrentQ(0);
    player.reset();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [player]);

  const resultByQ = useMemo(() => {
    const map = new Map<number, QResult>();
    for (const r of grade?.results ?? []) map.set(r.q, r);
    return map;
  }, [grade]);

  const qctx: QCtx = {
    answers,
    setAnswers,
    results: grade ? resultByQ : null,
    flags,
    toggleFlag,
    focusedQ,
    setFocus,
  };

  // Tab unlocks progressively as the audio reaches each part; all open in review.
  const partUnlocked = useCallback(
    (n: number) => !!grade || player.finished || player.partReached >= n,
    [grade, player.finished, player.partReached],
  );

  const total = player.duration > 0 ? player.duration : isTest ? 1800 : 480;
  const examLeft = Math.max(0, total - player.elapsed);

  const partIdx = partViews.findIndex((p) => p.part === currentPart);
  const goPart = (n: number) => {
    setManualPart(n);
    setCurrentQ(partQuestionNums(partViews.find((p) => p.part === n) ?? partViews[0])[0] ?? 0);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: RUN.desk,
        display: "flex",
        fontFamily: RUN.sans,
        color: RUN.t1,
      }}
    >
      <style>{`
        @keyframes lp-pulse-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.45); opacity: 0; } }
        .lp-qscroll::-webkit-scrollbar { width: 12px; }
        .lp-qscroll::-webkit-scrollbar-thumb { background:#DAD5E2; border-radius:9999px; border:4px solid transparent; background-clip:content-box; }
        .lp-run-input::placeholder { color:${RUN.t4}; }
        .lp-run-input:focus { border-color:${RUN.focusBorder} !important; box-shadow:0 0 0 3px rgba(124,92,252,0.10); }
        .lp-form2 { display:grid; grid-template-columns:1fr 1fr; grid-auto-flow:column; column-gap:56px; }
        @media (max-width: 760px) { .lp-form2 { display:block; } }
      `}</style>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: RUN.frame,
          overflow: "hidden",
        }}
      >
        {/* ===== TOP BAR ===== */}
        <header
          style={{
            flexShrink: 0,
            minHeight: 52,
            background: "#fff",
            borderBottom: `1px solid ${RUN.bBar}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 20px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onExit}
            className="lp-run-exit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: RUN.t2,
              fontFamily: RUN.sans,
              fontSize: 14,
              fontWeight: 600,
              padding: "8px 10px",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            <Chevron dir="left" />
            Exit
          </button>
          <div style={{ width: 1, height: 26, background: RUN.bBar }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: RUN.t1, letterSpacing: "-0.005em" }}>
            {isTest ? "Listening · Practice test" : "Listening · Quick practice"}
          </div>

          <div style={{ flex: 1, minWidth: 8 }} />

          {isTest ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: RUN.desk,
                borderRadius: 9,
                padding: 3,
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <PartTab
                  key={n}
                  n={n}
                  active={currentPart === n}
                  unlocked={partUnlocked(n)}
                  onClick={() => partUnlocked(n) && goPart(n)}
                />
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: RUN.vBg,
              color: RUN.vDeep,
              fontFamily: RUN.mono,
              fontSize: 14,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              padding: "5px 11px",
              borderRadius: 9,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {fmtClock(examLeft)}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 5,
              background: "#fff",
              border: `1px solid ${RUN.bPill}`,
              padding: "5px 11px",
              borderRadius: 9,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: RUN.t1 }}>{answered}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t3 }}>
              / {questionNums.length}
            </span>
          </div>
        </header>

        {/* ===== AUDIO STRIP ===== */}
        <AudioStrip player={player} />

        {/* ===== MAIN ===== */}
        <main
          id="lp-qscroll"
          ref={scrollRef}
          className="lp-qscroll"
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflowY: "auto",
            background: "#fff",
            padding: "18px clamp(20px,4vw,40px) 32px",
          }}
        >
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {/* part label + jump chips */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: RUN.vDeep,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Part {visiblePart?.part ?? 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t2 }}>
                  {PART_GENRE[visiblePart?.part ?? 1] ?? ""}
                </span>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {partNums.map((n) => (
                  <JumpChip
                    key={n}
                    n={n}
                    current={currentQChip === n}
                    flagged={flags.has(n)}
                    answered={(answers[n] ?? "").trim() !== ""}
                    onClick={() => goTo(n)}
                  />
                ))}
              </div>
            </div>

            {/* questions — flat, full-bleed, no card chrome (matches handoff) */}
            <section>{visiblePart ? <PartPanels p={visiblePart} ctx={qctx} /> : null}</section>

            {grade ? <ReviewPanel grade={grade} /> : null}
            {grade ? <ReplayList segments={view.audio} /> : null}
            {error ? (
              <div style={{ marginTop: 16 }}>
                <UpgradeNotice message={error} />
              </div>
            ) : null}
          </div>
        </main>

        {/* ===== FOOTER ===== */}
        <RunnerFooter
          isTest={isTest}
          grade={grade}
          grading={grading}
          answered={answered}
          totalQ={questionNums.length}
          flagCount={flags.size}
          canBack={partIdx > 0}
          isLastPart={partIdx >= partViews.length - 1}
          source={source}
          onBack={() => partIdx > 0 && goPart(partViews[partIdx - 1].part)}
          onNext={() => partIdx < partViews.length - 1 && goPart(partViews[partIdx + 1].part)}
          onSubmit={submit}
          onPracticeAgain={practiceAgain}
          onExit={onExit}
        />
      </div>
    </div>
  );
}

/** Chevron glyph matching the handoff (2.4 stroke Lucide path). */
function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

/** Segmented part tab (1–4). Active = white pill; locked = greyed, not-allowed. */
function PartTab({
  n,
  active,
  unlocked,
  onClick,
}: {
  n: number;
  active: boolean;
  unlocked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!unlocked}
      title={unlocked ? `Part ${n}` : `Part ${n} — locked until it plays`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 28,
        borderRadius: 7,
        border: "none",
        fontFamily: RUN.sans,
        fontSize: 13,
        fontWeight: 600,
        transition: "all .15s",
        background: active ? "#fff" : "transparent",
        color: active ? RUN.vDeep : unlocked ? RUN.t3 : RUN.t5,
        boxShadow: active ? "0 1px 3px rgba(20,20,40,0.12)" : "none",
        cursor: unlocked ? "pointer" : "not-allowed",
      }}
    >
      {n}
    </button>
  );
}

/** Per-question navigation chip (current / flagged / answered / default). */
function JumpChip({
  n,
  current,
  flagged,
  answered,
  onClick,
}: {
  n: number;
  current: boolean;
  flagged: boolean;
  answered: boolean;
  onClick: () => void;
}) {
  let bg: string = "#fff";
  let color: string = RUN.t3;
  let border: string = RUN.bField;
  let title = `Question ${n}`;
  if (current) {
    bg = RUN.v;
    color = "#fff";
    border = RUN.v;
    title = `Question ${n} (current)`;
  } else if (flagged) {
    bg = RUN.flagBg;
    color = RUN.flagText;
    border = RUN.flagBorder;
    title = `Question ${n} (flagged)`;
  } else if (answered) {
    bg = RUN.okBg;
    color = RUN.ok;
    border = RUN.okBorder;
    title = `Question ${n} (answered)`;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 8,
        fontFamily: RUN.sans,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .12s",
        border: `1.5px solid ${border}`,
        background: bg,
        color,
      }}
    >
      {n}
    </button>
  );
}

/** Footer: hint + Back + Next part / Submit, switching to the score row after
 *  grading (score + Practice again + Exit). */
function RunnerFooter({
  isTest,
  grade,
  grading,
  answered,
  totalQ,
  flagCount,
  canBack,
  isLastPart,
  source,
  onBack,
  onNext,
  onSubmit,
  onPracticeAgain,
  onExit,
}: {
  isTest: boolean;
  grade: Grade | null;
  grading: boolean;
  answered: number;
  totalQ: number;
  flagCount: number;
  canBack: boolean;
  isLastPart: boolean;
  source: Source;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onPracticeAgain: () => void;
  onExit: () => void;
}) {
  const good = grade ? grade.score / grade.max_score >= 0.7 : false;
  const primary: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    background: RUN.v,
    border: "none",
    color: "#fff",
    fontFamily: RUN.sans,
    fontSize: 14,
    fontWeight: 600,
    padding: "0 18px",
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124,92,252,0.3)",
  };
  const ghost: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    background: "#fff",
    border: `1px solid ${RUN.bBar}`,
    color: RUN.t2,
    fontFamily: RUN.sans,
    fontSize: 14,
    fontWeight: 600,
    padding: "0 16px",
    borderRadius: 10,
    cursor: "pointer",
  };
  const showNextPart = isTest && !isLastPart;
  return (
    <footer
      style={{
        flexShrink: 0,
        minHeight: 56,
        background: "#fff",
        borderTop: `1px solid ${RUN.bBar}`,
        padding: "9px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {grade ? (
        <>
          <span style={{ fontSize: 15, fontWeight: 800, color: good ? RUN.ok : RUN.t1 }}>
            {grade.score}
            <span style={{ color: RUN.t4, fontWeight: 600 }}>/{grade.max_score}</span> correct
          </span>
          {grade.band != null ? (
            <span
              style={{
                padding: "5px 12px",
                borderRadius: 9,
                background: RUN.vBg,
                border: `1px solid ${RUN.vBorder}`,
                color: RUN.vDeep,
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              Band {grade.band.toFixed(1)}
            </span>
          ) : null}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onPracticeAgain} style={ghost}>
            <RotateCcw size={15} /> Practice again
          </button>
          <button type="button" onClick={onExit} style={primary}>
            {source === "library" ? "Back to library" : "Back to Listening"}
            <Chevron dir="right" />
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              background: "#2b2b33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#fff",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t3 }}>
            {answered} of {totalQ} answered
            {flagCount ? ` · ${flagCount} flagged for review` : ""}
            {isTest ? " · Switch parts with the tabs above" : ""}
          </span>
          <div style={{ flex: 1 }} />
          {isTest ? (
            <button
              type="button"
              onClick={onBack}
              disabled={!canBack}
              style={{
                ...ghost,
                color: canBack ? RUN.t2 : RUN.t5,
                cursor: canBack ? "pointer" : "not-allowed",
              }}
            >
              <Chevron dir="left" /> Back
            </button>
          ) : null}
          {/* Submit is always reachable — on a test you can grade from any part,
              not only the last one. Next part stays the primary "keep going". */}
          {showNextPart ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={grading}
              style={{
                ...ghost,
                background: RUN.vBg,
                borderColor: "transparent",
                color: RUN.vDeep,
                opacity: grading ? 0.75 : 1,
                cursor: grading ? "default" : "pointer",
              }}
            >
              {grading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Checking…
                </>
              ) : (
                "Submit & finish"
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={showNextPart ? onNext : onSubmit}
            disabled={grading && !showNextPart}
            style={{
              ...primary,
              opacity: grading && !showNextPart ? 0.75 : 1,
              cursor: grading && !showNextPart ? "default" : "pointer",
            }}
          >
            {showNextPart ? (
              <>
                Next part <Chevron dir="right" />
              </>
            ) : grading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Checking…
              </>
            ) : (
              <>
                Submit answers <Chevron dir="right" />
              </>
            )}
          </button>
        </>
      )}
    </footer>
  );
}

// ---- Player (segment engine + audio strip) --------------------------------

const SPEEDS = [1, 1.25, 1.5, 0.75] as const;

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** IELTS part a segment belongs to, parsed from its narrator label
 *  ("Part 3 · Discussion" → 3); falls back to the previous part. */
function segPart(label: string, prev: number): number {
  const m = /part\s*([1-4])/i.exec(label ?? "");
  return m ? Number(m[1]) : prev;
}

type PlayerApi = {
  phase: PlayerPhase;
  paused: boolean;
  finished: boolean;
  playing: boolean;
  seg: Segment | null;
  idx: number;
  title: string;
  status: string;
  isPause: boolean;
  audioPart: number; // part currently sounding
  partReached: number; // highest part the audio has reached
  elapsed: number; // seconds into the whole recording
  duration: number; // total seconds (best estimate)
  progress: number; // 0..1
  countdown: number; // remaining seconds in a pause segment
  speed: number;
  muted: boolean;
  audioError: string | null;
  start: () => void;
  togglePlay: () => void;
  cycleSpeed: () => void;
  toggleMute: () => void;
  advance: () => void;
  retry: () => void;
  reset: () => void;
  seekTo: (fraction: number) => void;
};

/** Segment player: the recording is a sequence of audio clips + timed reading
 *  pauses. Playback runs in order, but the scrubber is freely seekable (click or
 *  drag anywhere) — practice mode, not locked exam rules. Exposed as a hook so
 *  the top bar (part tabs + exam timer) and the audio strip share one source. */
function useSegmentPlayer(segments: Segment[]): PlayerApi {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedIdxRef = useRef(-1); // which segment's src is currently loaded
  const [phase, setPhase] = useState<PlayerPhase>("idle");
  const [idx, setIdx] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [curTime, setCurTime] = useState(0); // position within the current audio seg
  const [pauseLeft, setPauseLeft] = useState(0); // remaining seconds of a pause seg
  const [audioError, setAudioError] = useState<string | null>(null);
  // Declared/measured duration per segment (audio may not carry `seconds`).
  const [durs, setDurs] = useState<number[]>(() =>
    segments.map((s) => (s.kind === "pause" ? s.seconds : (s.seconds ?? 0))),
  );

  const seg: Segment | null = idx >= 0 && idx < segments.length ? segments[idx] : null;
  const speed = SPEEDS[speedIdx];

  // Part boundaries derived once from the narrator labels.
  const partByIdx = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < segments.length; i++) {
      out[i] = segPart(segments[i].label, i === 0 ? 1 : out[i - 1]);
    }
    return out;
  }, [segments]);

  // Best-effort metadata preload so the scrubber/total settle before playback.
  useEffect(() => {
    let alive = true;
    segments.forEach((s, i) => {
      if (s.kind !== "audio" || (s.seconds && s.seconds > 0)) return;
      const probe = new Audio();
      probe.preload = "metadata";
      probe.src = s.url;
      probe.addEventListener("loadedmetadata", () => {
        if (!alive || !Number.isFinite(probe.duration)) return;
        setDurs((d) => {
          if (d[i] && d[i] > 0) return d;
          const next = d.slice();
          next[i] = probe.duration;
          return next;
        });
      });
    });
    return () => {
      alive = false;
    };
  }, [segments]);

  const advance = useCallback(() => {
    setPaused(false);
    setCurTime(0);
    setPauseLeft(0);
    setIdx((cur) => {
      const next = cur + 1;
      if (next >= segments.length) {
        setPhase("finished");
        return cur;
      }
      return next;
    });
  }, [segments.length]);

  // Own a detached <audio> element (created on the client, never rendered) so
  // the hook's public API carries no refs and playback survives re-renders.
  useEffect(() => {
    if (typeof Audio === "undefined") return;
    const el = new Audio();
    el.preload = "auto";
    audioRef.current = el;
    const onTime = () => setCurTime(el.currentTime);
    el.addEventListener("timeupdate", onTime);
    return () => {
      el.pause();
      el.removeEventListener("timeupdate", onTime);
      el.removeAttribute("src");
      audioRef.current = null;
    };
  }, []);

  // Advance to the next segment when the current audio clip finishes.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => advance();
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, [advance]);

  // Load + play the current audio segment. `start()` already primes segment 0
  // inside the click gesture, so the loaded-index guard avoids reloading (which
  // would restart the clip) when this effect fires right after.
  useEffect(() => {
    if (!seg || phase !== "running" || seg.kind !== "audio") return;
    const el = audioRef.current;
    if (!el) return;
    if (loadedIdxRef.current !== idx) {
      el.src = seg.url;
      loadedIdxRef.current = idx;
    }
    el.playbackRate = speed;
    el.muted = muted;
    el.play()
      .then(() => setAudioError(null))
      .catch(() => setAudioError("Playback was blocked — press play to continue."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg, phase]);

  // Keep live playbackRate / muted synced with the controls.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // Pause/resume toggling for the audio element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || seg?.kind !== "audio" || phase !== "running") return;
    if (paused) el.pause();
    else if (el.paused && el.src) el.play().catch(() => {});
  }, [paused, seg, phase]);

  // Countdown ticking for pause segments (freezes while paused; advances at 0).
  // The interval seeds itself from the segment length on its first tick so the
  // effect body never calls setState synchronously.
  useEffect(() => {
    if (!seg || phase !== "running" || seg.kind !== "pause" || paused) return;
    const secs = seg.seconds;
    const t = setInterval(() => {
      setPauseLeft((cur) => {
        const next = Math.max((cur > 0 ? cur : secs) - 1, 0);
        if (next === 0) {
          clearInterval(t);
          advance();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seg, phase, paused, advance]);

  const finished = phase === "finished";
  const playing = phase === "running" && !paused;
  const isPause = seg?.kind === "pause";
  const countdown = isPause ? (pauseLeft > 0 ? pauseLeft : (seg as PauseSeg).seconds) : 0;

  const duration = durs.reduce((a, b) => a + (b || 0), 0);
  const before = idx > 0 ? durs.slice(0, idx).reduce((a, b) => a + (b || 0), 0) : 0;
  const within =
    seg?.kind === "audio"
      ? Math.min(curTime, durs[idx] || curTime)
      : isPause
        ? (seg as PauseSeg).seconds - countdown
        : 0;
  const elapsed = finished ? duration : idx < 0 ? 0 : before + within;
  const progress = duration > 0 ? Math.min(1, elapsed / duration) : 0;

  const audioPart = idx >= 0 ? partByIdx[Math.min(idx, partByIdx.length - 1)] : 1;
  const partReached = idx >= 0 ? Math.max(1, ...partByIdx.slice(0, idx + 1)) : 1;

  const firstLabel = useMemo(
    () => segments.find((s) => s.kind === "audio")?.label ?? "Part 1 · Introduction",
    [segments],
  );
  const title = finished ? "Recording finished" : (seg?.label ?? firstLabel);
  const status = finished
    ? "Review your answers, then submit"
    : phase === "idle"
      ? "Ready — press play or drag the bar"
      : paused
        ? "Paused"
        : isPause
          ? `Reading time — ${countdown}s`
          : (audioError ?? "Now playing...");

  const start = useCallback(() => {
    // Play the first clip synchronously in the click gesture so browsers don't
    // block it as autoplay. The load-and-play effect then no-ops on segment 0.
    const el = audioRef.current;
    const first = segments[0];
    if (el && first && first.kind === "audio") {
      el.src = first.url;
      loadedIdxRef.current = 0;
      el.play()
        .then(() => setAudioError(null))
        .catch(() => setAudioError("Playback was blocked — press play to continue."));
    }
    setPhase("running");
    setIdx(0);
    setCurTime(0);
    setPauseLeft(0);
  }, [segments]);

  const togglePlay = useCallback(() => {
    if (phase === "idle") start();
    else if (!finished) setPaused((p) => !p);
  }, [phase, finished, start]);

  const retry = useCallback(() => {
    audioRef.current
      ?.play()
      .then(() => setAudioError(null))
      .catch(() => {});
  }, []);

  const reset = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
    }
    loadedIdxRef.current = -1;
    setPhase("idle");
    setIdx(-1);
    setPaused(false);
    setCurTime(0);
    setPauseLeft(0);
    setSpeedIdx(0);
    setMuted(false);
    setAudioError(null);
  }, []);

  // Free seek: map a 0..1 scrubber position to a segment + offset and jump
  // there (a reading-pause lands on its remaining countdown). Practice mode —
  // grab the playhead and drop it anywhere.
  const seekTo = useCallback(
    (fraction: number) => {
      if (duration <= 0) return;
      const target = Math.max(0, Math.min(1, fraction)) * duration;
      let acc = 0;
      let ti = 0;
      let off = 0;
      for (let i = 0; i < segments.length; i++) {
        const d = durs[i] || 0;
        ti = i;
        off = Math.max(0, target - acc);
        if (target < acc + d) break;
        acc += d;
      }
      const s = segments[ti];
      if (!s) return;
      setPhase("running");
      setPaused(false);
      setIdx(ti);
      if (s.kind === "pause") {
        setPauseLeft(Math.max(1, Math.round(s.seconds - off)));
        setCurTime(0);
        audioRef.current?.pause();
        return;
      }
      setPauseLeft(0);
      const el = audioRef.current;
      if (!el) return;
      const apply = () => {
        try {
          el.currentTime = off;
        } catch {
          /* seeking before metadata is ready — timeupdate will correct it */
        }
        setCurTime(off);
        el.play()
          .then(() => setAudioError(null))
          .catch(() => {});
      };
      if (loadedIdxRef.current !== ti) {
        el.src = s.url;
        loadedIdxRef.current = ti;
        const onMeta = () => {
          el.removeEventListener("loadedmetadata", onMeta);
          apply();
        };
        el.addEventListener("loadedmetadata", onMeta);
      } else {
        apply();
      }
    },
    [segments, durs, duration],
  );

  return {
    phase,
    paused,
    finished,
    playing,
    seg,
    idx,
    title,
    status,
    isPause,
    audioPart,
    partReached,
    elapsed,
    duration,
    progress,
    countdown,
    speed,
    muted,
    audioError,
    start,
    togglePlay,
    cycleSpeed: () => setSpeedIdx((i) => (i + 1) % SPEEDS.length),
    toggleMute: () => setMuted((m) => !m),
    advance,
    retry,
    reset,
    seekTo,
  };
}

/** The handoff audio bar (62px): play/pause with a live pulse ring · track meta ·
 *  elapsed · a freely seekable scrubber (click or drag anywhere) · total · speed ·
 *  mute. Seeking drives the real segment player; grab the playhead and drop it. */
function AudioStrip({ player }: { player: PlayerApi }) {
  const seek = (clientX: number, rect: DOMRect) => {
    if (rect.width > 0) player.seekTo((clientX - rect.left) / rect.width);
  };
  const onScrubDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(e.clientX, rect);
    const move = (ev: PointerEvent) => seek(ev.clientX, rect);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const onScrubKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") player.seekTo(player.progress - 0.02);
    else if (e.key === "ArrowRight") player.seekTo(player.progress + 0.02);
    else return;
    e.preventDefault();
  };
  const pct = (player.progress * 100).toFixed(2);
  const iconBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    borderRadius: 8,
    border: `1px solid ${RUN.bPill}`,
    background: "#fff",
    color: RUN.t2,
    cursor: "pointer",
    flexShrink: 0,
  };
  const time: React.CSSProperties = {
    fontFamily: RUN.mono,
    fontSize: 13,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
  };
  return (
    <div
      style={{
        flexShrink: 0,
        minHeight: 62,
        background: RUN.strip,
        borderBottom: `1px solid ${RUN.bBar}`,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Play / pause with a pulse ring while sounding */}
      <div style={{ position: "relative", flexShrink: 0, width: 42, height: 42 }}>
        {player.playing && !player.isPause ? (
          <div
            style={{
              position: "absolute",
              inset: -3,
              borderRadius: 9999,
              background: "#c9bcff",
              animation: "lp-pulse-ring 1.2s ease-out infinite",
            }}
          />
        ) : null}
        <button
          type="button"
          onClick={player.togglePlay}
          title={player.playing ? "Pause" : "Play"}
          style={{
            position: "relative",
            width: 42,
            height: 42,
            borderRadius: 9999,
            background: RUN.v,
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(124,92,252,0.35)",
          }}
        >
          {player.playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1.3" />
              <rect x="14" y="5" width="4" height="14" rx="1.3" />
            </svg>
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ marginLeft: 2 }}
            >
              <path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5z" />
            </svg>
          )}
        </button>
      </div>

      {/* Track meta */}
      <div style={{ width: 180, flexShrink: 0, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: RUN.t1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {player.title}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: RUN.t3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {player.status}
        </div>
      </div>

      <span style={{ ...time, color: RUN.t2, width: 42, textAlign: "right" }}>
        {fmtClock(player.elapsed)}
      </span>

      {/* Freely seekable scrubber */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Audio position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(player.progress * 100)}
        onPointerDown={onScrubDown}
        onKeyDown={onScrubKey}
        title="Drag to move the playhead"
        style={{
          position: "relative",
          flex: 1,
          height: 16,
          display: "flex",
          alignItems: "center",
          minWidth: 0,
          cursor: "pointer",
          touchAction: "none",
          outline: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 5,
            borderRadius: 9999,
            background: RUN.rail,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            height: 5,
            borderRadius: 9999,
            background: RUN.v,
            width: `${pct}%`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translate(-50%,-50%)",
            left: `${pct}%`,
            width: 14,
            height: 14,
            borderRadius: 9999,
            background: "#fff",
            border: `3px solid ${RUN.v}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        />
      </div>

      <span style={{ ...time, color: RUN.t3, width: 42 }}>{fmtClock(player.duration)}</span>

      {/* Speed */}
      <button
        type="button"
        onClick={player.cycleSpeed}
        title="Playback speed"
        style={{
          ...iconBtn,
          padding: "0 11px",
          fontFamily: RUN.mono,
          fontSize: 13,
          fontWeight: 600,
          color: RUN.t2,
        }}
      >
        {player.speed}×
      </button>

      {player.audioError && player.seg?.kind === "audio" ? (
        <button
          type="button"
          onClick={player.retry}
          style={{
            ...iconBtn,
            padding: "0 12px",
            background: RUN.v,
            border: "none",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          Play
        </button>
      ) : null}

      {/* Mute */}
      <button
        type="button"
        onClick={player.toggleMute}
        title={player.muted ? "Unmute" : "Mute"}
        style={{ ...iconBtn, width: 34 }}
      >
        {player.muted ? (
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        )}
      </button>
    </div>
  );
}

/** Post-grade free replay (practice review, no exam rules anymore) — rendered
 *  below the review so the exam player stays compact. */
function ReplayList({ segments }: { segments: Segment[] }) {
  return (
    <div
      style={{
        marginTop: 16,
        background: "#fff",
        border: `1px solid ${RUN.bCard}`,
        borderRadius: 16,
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      <span
        style={{
          fontFamily: RUN.sans,
          fontSize: 11.5,
          fontWeight: 700,
          color: RUN.t6,
          letterSpacing: ".09em",
          textTransform: "uppercase",
        }}
      >
        Listen again
      </span>
      {segments
        .filter((s): s is AudioSeg => s.kind === "audio")
        .map((s) => (
          <div key={s.path} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: RUN.sans,
                fontSize: 12.5,
                fontWeight: 600,
                color: RUN.t2,
                width: 210,
                flex: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.label}
            </span>
            <audio src={s.url} controls preload="none" style={{ flex: 1, height: 34 }} />
          </div>
        ))}
    </div>
  );
}

// ---- Question panels ---------------------------------------------------------

/** A template split into literal text and gap placeholders ("For {2} days" →
 *  [{text:"For "},{gap:2},{text:" days"}]). */
type TplPart = { text: string } | { gap: number };
function templateParts(t: string): TplPart[] {
  const out: TplPart[] = [];
  const re = /\{(\d+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push({ text: t.slice(last, m.index) });
    out.push({ gap: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push({ text: t.slice(last) });
  return out;
}
const gapNums = (t: string): number[] => [...t.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
const rangeLabel = (nums: number[]): string =>
  nums.length ? `${Math.min(...nums)}–${Math.max(...nums)}` : "";

/** The 30×30 question-number chip — green once its answer is filled. */
function NumChip({ n, answered }: { n: number; answered: boolean }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 8,
        background: answered ? RUN.okBg : RUN.vBg,
        color: answered ? RUN.ok : RUN.vHover,
        fontFamily: RUN.sans,
        fontSize: 12.5,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {n}
    </span>
  );
}

/** Flag-for-review toggle (amber when set). */
function FlagButton({ flagged, onClick }: { flagged: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={flagged ? "Unflag" : "Flag for review"}
      aria-pressed={flagged}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 9,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        color: flagged ? RUN.flag : "#C9C3D2",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={flagged ? RUN.flagFill : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    </button>
  );
}

function AnswerField({
  n,
  ctx,
  variant,
  grow,
}: {
  n: number;
  ctx: QCtx;
  variant: "block" | "inline";
  grow?: boolean;
}) {
  const result = ctx.results?.get(n) ?? null;
  const graded = result != null;
  const correct = graded && result.is_correct;
  const wrong = graded && !result.is_correct;
  const answered = (ctx.answers[n] ?? "").trim() !== "";
  const focused = ctx.focusedQ === n;
  const inline = variant === "inline";
  const border = correct
    ? RUN.okBorder
    : wrong
      ? "#E6B0B0"
      : focused
        ? RUN.v
        : answered
          ? RUN.okBorder
          : RUN.bField;
  const bg = correct
    ? RUN.okTint
    : wrong
      ? "#FDF2F2"
      : focused
        ? RUN.fieldFocus
        : answered
          ? RUN.okTint
          : RUN.field;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        flex: grow ? 1 : undefined,
        minWidth: grow ? 0 : undefined,
        verticalAlign: inline ? "middle" : undefined,
      }}
    >
      {inline ? (
        <span
          style={{
            width: 25,

            fontFamily: RUN.sans,
            fontSize: 11.5,
            fontWeight: 500,
            color: answered ? RUN.ok : RUN.vHover,
            background: answered ? RUN.okBg : RUN.vBg,
            borderRadius: 6,
            padding: "1px 6px",
          }}
        >
          {n}
        </span>
      ) : null}
      <input
        className="lp-run-input"
        value={ctx.answers[n] ?? ""}
        onChange={(e) => ctx.setAnswers((a) => ({ ...a, [n]: e.target.value }))}
        onFocus={() => ctx.setFocus(n)}
        disabled={graded}
        placeholder={inline ? "answer" : "Type your answer"}
        aria-label={`Answer ${n}`}
        style={{
          flex: grow ? 1 : undefined,
          width: grow ? undefined : inline ? 150 : 150,
          minWidth: 0,
          height: inline ? 28 : 36,
          padding: inline ? "0 11px" : "0 15px",
          fontFamily: RUN.sans,
          fontSize: inline ? 15 : 15.5,
          fontWeight: 400,
          color: RUN.t1,
          background: bg,
          border: `1.5px solid #7777`,
          borderRadius: inline ? 8 : 9,
          outline: "none",
        }}
      />
      {wrong ? (
        <span style={{ fontSize: 13.5, fontWeight: 700, color: RUN.ok, whiteSpace: "nowrap" }}>
          → {result?.correct_answer}
        </span>
      ) : null}
      {graded ? correct ? <Check size={16} color={RUN.ok} /> : <X size={16} color={BAD} /> : null}
    </span>
  );
}

function CardHeader({
  range,
  title,
  instruction,
}: {
  range: string;
  title: string;
  instruction?: string;
}) {
  return (
    <div style={{ padding: "6px 0 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: RUN.sans,
            fontSize: 11.5,
            fontWeight: 600,
            color: RUN.report,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Questions {range}
        </div>
        <ReportButton />
      </div>
      <h2
        style={{
          fontFamily: RUN.display,
          fontSize: "clamp(20px,2.2vw,20px)",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: RUN.t1,
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {instruction ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: RUN.vSoft,
            color: "#5a4ec4",
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 16px",
            borderRadius: 10,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={RUN.vDeep}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
          {instruction}
        </div>
      ) : null}
    </div>
  );
}

function ReportButton() {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setDone(true)}
      disabled={done}
      title="Report a problem with these questions"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        borderRadius: 8,
        border: `1px solid ${done ? RUN.okBorder : RUN.reportBorder}`,
        background: done ? RUN.okBg : RUN.reportBg,
        color: done ? RUN.ok : RUN.report,
        fontFamily: RUN.sans,
        fontSize: 12,
        fontWeight: 600,
        cursor: done ? "default" : "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {done ? (
        <>
          <Check size={12} /> Reported
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2 1 21h22L12 2z" />
            <line x1="12" y1="9" x2="12" y2="14" />
            <circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          Report
        </>
      )}
    </button>
  );
}

function Gapped({ template, ctx }: { template: string; ctx: QCtx }) {
  return (
    <>
      {templateParts(template).map((p, i) =>
        "text" in p ? (
          <span key={i}>{p.text}</span>
        ) : (
          <span
            key={i}
            id={`q-${p.gap}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              verticalAlign: "middle",
            }}
          >
            <AnswerField n={p.gap} ctx={ctx} variant="inline" />
            <FlagButton flagged={ctx.flags.has(p.gap)} onClick={() => ctx.toggleFlag(p.gap)} />
          </span>
        ),
      )}
    </>
  );
}

function FormRowView({ r, ctx }: { r: FormRow; ctx: QCtx }) {
  const parts = templateParts(r.template);
  const gaps = parts.filter((p): p is { gap: number } => "gap" in p).map((p) => p.gap);
  const primary = gaps[0] ?? 0;
  const single = gaps.length === 1;
  const answeredPrimary = (ctx.answers[primary] ?? "").trim() !== "";
  return (
    <div
      id={`q-${primary}`}
      style={{
        display: "grid",
        gridTemplateColumns: "26px minmax(72px,150px) 1fr",
        gap: 14,
        alignItems: "center",
        minHeight: 58,
        padding: "9px 0",
        borderBottom: `1px solid ${RUN.bRow}`,
      }}
    >
      <NumChip n={primary} answered={answeredPrimary} />
      <div style={{ fontFamily: RUN.sans, fontSize: 15, fontWeight: 600, color: RUN.t1 }}>
        {r.label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {parts.map((p, i) =>
          "text" in p ? (
            p.text.trim() ? (
              <span key={i} style={{ fontSize: 14.5, color: RUN.report, whiteSpace: "nowrap" }}>
                {p.text.trim()}
              </span>
            ) : null
          ) : (
            <AnswerField key={i} n={p.gap} ctx={ctx} variant="block" grow={single} />
          ),
        )}
        <FlagButton flagged={ctx.flags.has(primary)} onClick={() => ctx.toggleFlag(primary)} />
      </div>
    </div>
  );
}

function FormPanel({ form, ctx }: { form: NonNullable<RenderView["form"]>; ctx: QCtx }) {
  const rows = useMemo(
    () =>
      form.rows.map((r, i) => {
        const prev =
          form.rows
            .slice(0, i)
            .map((x) => x.section)
            .filter(Boolean)
            .pop() ?? null;
        return { ...r, header: r.section && r.section !== prev ? r.section : null };
      }),
    [form],
  );
  const range = rangeLabel(form.rows.flatMap((r) => gapNums(r.template)));
  const hasSections = rows.some((r) => r.header);
  return (
    <>
      <CardHeader
        range={range}
        title={form.title}
        instruction={`Write ${form.word_limit} for each answer`}
      />
      {hasSections ? (
        <div>
          {rows.map((r, i) => (
            <div key={i}>
              {r.header ? (
                <div
                  style={{
                    fontFamily: RUN.sans,
                    fontSize: 14,
                    fontWeight: 700,
                    color: RUN.t1,
                    padding: "16px 0 4px",
                  }}
                >
                  {r.header}
                </div>
              ) : null}
              <FormRowView r={r} ctx={ctx} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="lp-form2"
          style={{ gridTemplateRows: `repeat(${Math.ceil(rows.length / 2)}, auto)` }}
        >
          {rows.map((r, i) => (
            <FormRowView key={i} r={r} ctx={ctx} />
          ))}
        </div>
      )}
    </>
  );
}

function NotesPanel({ notes, ctx }: { notes: NonNullable<RenderView["notes"]>; ctx: QCtx }) {
  const range = rangeLabel(
    notes.sections.flatMap((s) => s.lines).flatMap((l) => gapNums(l.template)),
  );
  return (
    <>
      <CardHeader
        range={range}
        title={notes.title}
        instruction={`Write ${notes.word_limit} for each answer`}
      />
      <div style={{ padding: "0 0 8px" }}>
        {notes.sections.map((s, si) => (
          <div key={si} style={{ marginBottom: 6 }}>
            <div
              style={{
                fontFamily: RUN.sans,
                fontSize: 14,
                fontWeight: 500,
                color: RUN.t1,
                padding: "18px 0 6px",
              }}
            >
              {s.heading}
            </div>
            {s.lines.map((l, li) => (
              <div
                key={li}
                style={{
                  padding: "6px 0",
                  paddingLeft: l.sub ? 34 : 14,
                  fontFamily: RUN.sans,
                  fontSize: 15,
                  lineHeight: 2,
                  color: RUN.t1,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ color: RUN.t5, flex: "none", lineHeight: 2 }}>•</span>
                <span>
                  <Gapped template={l.template} ctx={ctx} />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ---- Letter-answer panels (Parts 2 & 3) -----------------------------------------

function QuestionsHeading({ text, instruction }: { text: string; instruction: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: RUN.sans,
          fontSize: 11.5,
          fontWeight: 700,
          color: RUN.t6,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          marginBottom: 7,
        }}
      >
        {text}
      </div>
      <div
        style={{
          display: "inline-flex",
          background: RUN.vBg,
          color: RUN.vDeep,
          border: `1px solid ${RUN.vBorder}`,
          borderRadius: 9999,
          padding: "6px 12px",
          fontSize: 12.5,
          fontWeight: 700,
        }}
      >
        {instruction}
      </div>
    </div>
  );
}

/** Renders whichever question material a part carries. Form/notes bring their
 *  own card header; the letter-answer parts (2 & 3) get one here. */
function PartPanels({ p, ctx }: { p: PartView; ctx: QCtx }) {
  if (p.form) return <FormPanel form={p.form} ctx={ctx} />;
  if (p.notes) return <NotesPanel notes={p.notes} ctx={ctx} />;
  return (
    <>
      <CardHeader range={rangeLabel(partQuestionNums(p))} title={p.topic || "Listening"} />
      <div
        style={{
          padding: "8px 0 16px",
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        {(p.clusters ?? []).map((c) => (
          <ChooseTwoPanel key={c.questions[0]} cluster={c} ctx={ctx} />
        ))}
        {(p.mcqs ?? []).length > 0 ? (
          <McqPanel mcqs={p.mcqs ?? []} context={p.context} ctx={ctx} />
        ) : null}
        {p.matching && (p.matching.items ?? []).length > 0 ? (
          <MatchingPanel matching={p.matching} ctx={ctx} />
        ) : null}
      </div>
    </>
  );
}

/** "Choose TWO letters" — a pair of questions answered by one 5-option set. */
function ChooseTwoPanel({ cluster, ctx }: { cluster: ClusterView; ctx: QCtx }) {
  const [qa, qb] = cluster.questions;
  const graded = ctx.results != null;
  const selected = [ctx.answers[qa], ctx.answers[qb]].filter(Boolean) as string[];
  const correctLetters = graded
    ? (ctx.results?.get(qa)?.correct_answer ?? "").split(" or ").filter(Boolean)
    : [];

  const toggle = (letter: string) => {
    if (graded) return;
    ctx.setFocus(qa);
    ctx.setAnswers((prev) => {
      const cur = [prev[qa], prev[qb]].filter(Boolean) as string[];
      let next: string[];
      if (cur.includes(letter)) next = cur.filter((l) => l !== letter);
      else if (cur.length >= 2)
        return prev; // already two picked — deselect one first
      else next = [...cur, letter];
      next.sort();
      return { ...prev, [qa]: next[0] ?? "", [qb]: next[1] ?? "" };
    });
  };

  return (
    <div id={`q-${qa}`}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <QuestionsHeading text={`Questions ${qa} and ${qb}`} instruction="Choose TWO letters." />
        <FlagButton flagged={ctx.flags.has(qa)} onClick={() => ctx.toggleFlag(qa)} />
      </div>
      <div
        style={{
          fontFamily: RUN.sans,
          fontWeight: 400,
          fontSize: 15,
          color: RUN.t1,
          margin: "2px 0 10px",
        }}
      >
        {cluster.stem}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {Object.entries(cluster.options)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, text]) => {
            const on = selected.includes(letter);
            const isCorrect = correctLetters.includes(letter);
            const border = graded
              ? isCorrect
                ? RUN.ok
                : on
                  ? BAD
                  : RUN.bField
              : on
                ? RUN.v
                : RUN.bField;
            const bg = graded
              ? isCorrect
                ? RUN.okTint
                : on
                  ? "#FDF2F2"
                  : "#fff"
              : on
                ? RUN.vBg
                : "#fff";
            return (
              <button
                key={letter}
                type="button"
                onClick={() => toggle(letter)}
                disabled={graded}
                aria-pressed={on}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 13px",
                  borderRadius: 11,
                  border: `1.5px solid ${border}`,
                  background: bg,
                  fontFamily: RUN.sans,
                  fontSize: 14.5,
                  color: RUN.t1,
                  cursor: graded ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `1.5px solid ${on || (graded && isCorrect) ? border : "#C9C3D2"}`,
                    background: on && !graded ? RUN.v : "transparent",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  {on && !graded ? (
                    <Check size={14} />
                  ) : graded && isCorrect ? (
                    <Check size={14} color={RUN.ok} />
                  ) : graded && on ? (
                    <X size={14} color={BAD} />
                  ) : null}
                </span>
                <strong style={{ width: 16, flex: "none" }}>{letter}</strong>
                <span style={{ flex: 1 }}>{text}</span>
              </button>
            );
          })}
      </div>
      {graded && selected.length < 2 ? (
        <div style={{ marginTop: 8, fontSize: 13, color: BAD }}>
          You needed to choose two letters.
        </div>
      ) : null}
    </div>
  );
}

/** Single-answer multiple choice (Part 3, Q21–23). */
function McqPanel({ mcqs, context, ctx }: { mcqs: McqView[]; context?: string; ctx: QCtx }) {
  const graded = ctx.results != null;
  return (
    <div>
      <QuestionsHeading
        text={`Questions ${mcqs[0].q}–${mcqs[mcqs.length - 1].q}`}
        instruction="Choose the correct letter, A, B or C."
      />
      {context ? (
        <div
          style={{
            fontFamily: RUN.sans,
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 14.5,
            color: RUN.t2,
            margin: "4px 0 8px",
          }}
        >
          {context}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {mcqs.map((m) => {
          const r = ctx.results?.get(m.q) ?? null;
          return (
            <div key={m.q} id={`q-${m.q}`}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    fontFamily: RUN.sans,
                    fontSize: 12,
                    fontWeight: 700,
                    color: RUN.vHover,
                    background: RUN.vBg,
                    borderRadius: 6,
                    padding: "2px 7px",
                    flex: "none",
                    marginTop: 1,
                  }}
                >
                  {m.q}
                </span>
                <div
                  style={{
                    flex: 1,
                    fontFamily: RUN.sans,
                    fontWeight: 600,
                    fontSize: 14.5,
                    color: RUN.t1,
                  }}
                >
                  {m.stem}
                </div>
                <FlagButton flagged={ctx.flags.has(m.q)} onClick={() => ctx.toggleFlag(m.q)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(m.options)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([letter, text]) => {
                    const on = ctx.answers[m.q] === letter;
                    const isCorrect = graded && r?.correct_answer === letter;
                    const border = graded
                      ? isCorrect
                        ? RUN.ok
                        : on
                          ? BAD
                          : RUN.bField
                      : on
                        ? RUN.v
                        : RUN.bField;
                    const bg = graded
                      ? isCorrect
                        ? RUN.okTint
                        : on
                          ? "#FDF2F2"
                          : "#fff"
                      : on
                        ? RUN.vBg
                        : "#fff";
                    return (
                      <button
                        key={letter}
                        type="button"
                        disabled={graded}
                        aria-pressed={on}
                        onClick={() => {
                          ctx.setFocus(m.q);
                          ctx.setAnswers((prev) => ({
                            ...prev,
                            [m.q]: prev[m.q] === letter ? "" : letter,
                          }));
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                          padding: "10px 13px",
                          borderRadius: 11,
                          border: `1.5px solid ${border}`,
                          background: bg,
                          fontFamily: RUN.sans,
                          fontSize: 14.5,
                          color: RUN.t1,
                          cursor: graded ? "default" : "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `1.5px solid ${on || isCorrect ? border : "#C9C3D2"}`,
                            background: on && !graded ? RUN.v : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "none",
                          }}
                        >
                          {on && !graded ? (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#fff",
                              }}
                            />
                          ) : isCorrect ? (
                            <Check size={12} color={RUN.ok} />
                          ) : graded && on ? (
                            <X size={12} color={BAD} />
                          ) : null}
                        </span>
                        <strong style={{ width: 16, flex: "none" }}>{letter}</strong>
                        <span style={{ flex: 1 }}>{text}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Matching run — items matched to a boxed option list by letter. */
function MatchingPanel({ matching, ctx }: { matching: MatchingView; ctx: QCtx }) {
  const graded = ctx.results != null;
  const qs = matching.items.map((it) => it.q);
  const letters = Object.keys(matching.options).sort();
  return (
    <div>
      <QuestionsHeading
        text={`Questions ${qs[0]}–${qs[qs.length - 1]}`}
        instruction={`Choose your answers from the box — write the correct letter, ${letters[0]}–${letters[letters.length - 1]}.`}
      />
      {matching.heading ? (
        <div
          style={{
            fontFamily: RUN.sans,
            fontWeight: 600,
            fontSize: 15,
            color: RUN.t1,
            margin: "2px 0 10px",
          }}
        >
          {matching.heading}
        </div>
      ) : null}

      {/* The option box */}
      <div
        style={{
          border: `1.5px solid ${RUN.bField}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: RUN.field,
        }}
      >
        {letters.map((letter) => (
          <div
            key={letter}
            style={{ fontFamily: RUN.sans, fontSize: 14, color: RUN.t1, display: "flex", gap: 10 }}
          >
            <strong style={{ width: 16, flex: "none", color: RUN.vHover }}>{letter}</strong>
            <span>{matching.options[letter]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {matching.items.map((it) => {
          const r = ctx.results?.get(it.q) ?? null;
          const border = r ? (r.is_correct ? RUN.ok : BAD) : RUN.bField;
          return (
            <div
              key={it.q}
              id={`q-${it.q}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 0",
                borderTop: `1px solid ${RUN.bRow}`,
                fontFamily: RUN.sans,
                fontSize: 14.5,
              }}
            >
              <NumChip n={it.q} answered={(ctx.answers[it.q] ?? "").trim() !== ""} />
              <span style={{ flex: 1, color: RUN.t2, fontWeight: 600 }}>{it.label}</span>
              <select
                value={ctx.answers[it.q] ?? ""}
                disabled={graded}
                aria-label={`Answer ${it.q}`}
                onChange={(e) => {
                  ctx.setFocus(it.q);
                  ctx.setAnswers((prev) => ({ ...prev, [it.q]: e.target.value }));
                }}
                style={{
                  width: 70,
                  height: 38,
                  padding: "0 10px",
                  borderRadius: 9,
                  border: `1.5px solid ${border}`,
                  background: r ? (r.is_correct ? RUN.okTint : "#FDF2F2") : "#fff",
                  fontFamily: RUN.sans,
                  fontSize: 14,
                  fontWeight: 700,
                  color: RUN.t1,
                }}
              >
                <option value="">–</option>
                {letters.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {r ? (
                r.is_correct ? (
                  <Check size={16} color={RUN.ok} />
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <X size={16} color={BAD} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: RUN.ok }}>
                      → {r.correct_answer}
                    </span>
                  </span>
                )
              ) : null}
              <FlagButton flagged={ctx.flags.has(it.q)} onClick={() => ctx.toggleFlag(it.q)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Review -------------------------------------------------------------------

function ReviewPanel({ grade }: { grade: Grade }) {
  const wrong = grade.results.filter((r) => !r.is_correct);
  const trapped = grade.results.filter((r) => r.trap && TRAP_EXPLAIN[r.trap]);
  const ratio = grade.score / grade.max_score;
  const card: React.CSSProperties = {
    background: "#fff",
    border: `1px solid ${RUN.bCard}`,
    borderRadius: 16,
    padding: "20px 22px",
  };
  const heading: React.CSSProperties = {
    fontFamily: RUN.display,
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: "-0.01em",
    margin: "0 0 12px",
    color: RUN.t1,
  };
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Score summary */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: RUN.display,
            fontSize: 40,
            fontWeight: 700,
            color: ratio >= 0.7 ? RUN.ok : ratio >= 0.4 ? RUN.t1 : BAD,
            lineHeight: 1,
          }}
        >
          {grade.score}
          <span style={{ fontSize: 20, color: RUN.t4 }}>/{grade.max_score}</span>
        </span>
        {grade.band != null ? (
          <span
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              background: RUN.vBg,
              border: `1px solid ${RUN.vBorder}`,
              color: RUN.vDeep,
              fontWeight: 700,
              fontSize: 17,
              whiteSpace: "nowrap",
            }}
          >
            Band {grade.band.toFixed(1)}
          </span>
        ) : null}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: RUN.sans, fontWeight: 700, fontSize: 15.5, color: RUN.t1 }}>
            {grade.score === grade.max_score
              ? "Perfect — every answer caught."
              : wrong.length <= 3
                ? "Strong listening — review the ones that got away."
                : "Good practice — the traps below are where the marks went."}
          </div>
          <div style={{ fontFamily: RUN.sans, fontSize: 13.5, color: RUN.t3, marginTop: 3 }}>
            Corrections are marked next to each question above. The transcript below shows exactly
            where each answer was said.
          </div>
        </div>
        {(grade.parts ?? []).length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
            {(grade.parts ?? []).map((p) => (
              <span
                key={p.part}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: RUN.bRow,
                  border: `1px solid ${RUN.bTab}`,
                  fontFamily: RUN.sans,
                  fontSize: 13,
                  fontWeight: 700,
                  color: p.score / p.max_score >= 0.7 ? RUN.ok : RUN.t2,
                }}
              >
                Part {p.part}: {p.score}/{p.max_score}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Trap explanations */}
      {trapped.length > 0 ? (
        <div style={card}>
          <h3 style={heading}>Why the traps worked</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trapped.map((r) => (
              <div key={r.q} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    flex: "none",
                    width: 30,
                    height: 24,
                    borderRadius: 7,
                    background: r.is_correct ? RUN.okBg : "#FDECEC",
                    color: r.is_correct ? RUN.ok : BAD,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: RUN.sans,
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  {r.q}
                </span>
                <div
                  style={{ fontFamily: RUN.sans, fontSize: 13.5, lineHeight: 1.55, color: RUN.t2 }}
                >
                  <strong style={{ color: RUN.t1 }}>{r.correct_answer}</strong> —{" "}
                  {TRAP_EXPLAIN[r.trap as string]}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Transcript */}
      <div style={card}>
        <h3 style={heading}>Transcript</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {grade.transcript.map((l, i) => (
            <div
              key={i}
              style={{ fontFamily: RUN.sans, fontSize: 14, lineHeight: 1.6, color: RUN.t1 }}
            >
              <span style={{ fontWeight: 700, color: RUN.v }}>{l.speaker}: </span>
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
