"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Headphones,
  Loader2,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";

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
type MatchingView = { heading: string; items: { q: number; label: string }[]; options: Record<string, string> };
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
  q: number; user_answer: string; correct_answer: string;
  is_correct: boolean; kind: string; trap: string | null;
};
type Grade = {
  part: number; score: number; max_score: number;
  results: QResult[]; transcript: { speaker: string; text: string }[];
  kind?: "test";
  band?: number;
  parts?: { part: number; score: number; max_score: number }[];
};

type LibraryItem = {
  id: string; part: number; topic: string; difficulty: number;
  unlocked: boolean; locked: boolean; best_score: number | null;
};
type Catalogue = { items: LibraryItem[]; plan_paid: boolean; free_used: number; free_limit: number };

type MineItem = { id: string; part: number; topic: string; difficulty: number; created_at: string | null };

/** Which grade endpoint an open practice belongs to. */
type Source = "library" | "mine";

/** Why each trap works, in the learner's language (ids from the engine's
 *  listening spec — P1 audio traps + P4 note-paraphrase mechanisms). */
const TRAP_EXPLAIN: Record<string, string> = {
  "wrong-spelling-offer": "A plausible spelling was offered first — the correct one was then spelled out letter by letter.",
  "habitual-vs-today": "The speaker first described what usually happens; the answer is what applies this time.",
  "condition-before-answer": "A vague general statement came first — the specific value followed it.",
  "self-correction": "A value was given, then corrected. Only the amended one counts.",
  "implied-positive-actual-negative": "The question implied agreement, but the speaker disagreed — the answer sat in the contrast.",
  "enough-of-x-want-y": "A near-alternative was rejected just before the real answer.",
  "impressive-x-favourite-y": "Several options were mentioned — a superlative singled out the right one.",
  "negation-compression": "The notes compress a negative statement from the lecture into a short positive phrase.",
  comparative: "The notes shorten a comparison the lecturer made — the wording differs, the gap word doesn't.",
  nominalisation: "The notes turn the lecturer's verb phrase into a noun phrase around the same gap word.",
  "plausible-not-stated": "The wrong option sounded likely from the context — but it was never actually said.",
  "different-subject": "The wrong option's words WERE heard — attached to a different subject.",
  "refute-then-state": "The first suggestion was knocked down; the real point came straight after it.",
  "return-to-first": "Other options were rejected and the speakers came back to the first one.",
  "counter-then-agree": "A late counter-proposal was confirmed by the other speaker — agreement seals the answer.",
};

const PART_LABEL: Record<number, string> = {
  1: "Part 1 · Conversation",
  2: "Part 2 · Monologue",
  3: "Part 3 · Discussion",
  4: "Part 4 · Lecture",
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
      .then((c) => { if (alive) setCatalogue(c); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : "Could not load the library."); });
    callEngine<{ items: MineItem[] }>("list", {})
      .then((r) => { if (alive) setMine(r.items ?? []); })
      .catch(() => { if (alive) setMine([]); });
    return () => { alive = false; };
  }, [view]); // refresh progress after exiting a practice

  const open = useCallback(async (item: LibraryItem) => {
    if (item.locked) {
      setError("You’ve used all 5 free practice unlocks for Listening — upgrade to Pro to open the full library.");
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
    <Hub tab={tab} setTab={setTab} catalogue={catalogue} mine={mine} busy={busy} error={error}
      onOpen={open} onOpenMine={openMine} onGenerate={generate} />
  );
}

// ---- Hub (mirrors the Reading hub: two tabs, numbered cards) -------------------

function Hub({ tab, setTab, catalogue, mine, busy, error, onOpen, onOpenMine, onGenerate }: {
  tab: HubTab; setTab: (t: HubTab) => void;
  catalogue: Catalogue | null; mine: MineItem[] | null; busy: string | null; error: string | null;
  onOpen: (item: LibraryItem) => void; onOpenMine: (id: string) => void;
  onGenerate: (difficulty: number) => void;
}) {
  // Tab 1: FULL tests only (part 0). Tab 2: single-recording quick practices.
  const tests = useMemo(
    () => (catalogue?.items ?? [])
      .filter((it) => it.part === 0)
      .sort((a, b) => a.difficulty - b.difficulty)
      .map((it, i) => ({ ...it, seq: i + 1 })),
    [catalogue],
  );
  const quick = useMemo(
    () => (catalogue?.items ?? [])
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
    <div className="lp-hub-pad" style={{ width: "100%", padding: "26px 24px 64px", fontFamily: SANS, color: INK }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,3.6vw,38px)", lineHeight: 1.05, letterSpacing: "-.4px", margin: 0, color: INK }}>Listening</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0", maxWidth: 660 }}>
            Full 4-part practice tests with the real exam&rsquo;s framing — the announcer introduces
            each part, the audio plays once, and every answer is explained after grading.
          </p>
        </div>
        {catalogue ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 9, background: TINT, border: "1px solid rgba(67,56,202,.16)", color: INDIGO, padding: "8px 14px", borderRadius: 999, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
            <Headphones size={15} />
            {catalogue.plan_paid ? "Full library" : `Free: ${Math.min(catalogue.free_used, catalogue.free_limit)}/${catalogue.free_limit} used`}
          </span>
        ) : null}
      </div>

      {/* Tabs — the same chooser as the Reading hub */}
      <div style={{ display: "flex", gap: 6, background: "#F1F1F8", border: "1px solid #ECEAF2", borderRadius: 14, padding: 5, marginTop: 22, maxWidth: 520 }}>
        <TabButton active={tab === "tests"} onClick={() => setTab("tests")} icon={<Headphones size={17} />} label="Practice tests" sub="4 parts · 40 questions" />
        <TabButton active={tab === "parts"} onClick={() => setTab("parts")} icon={<Sparkles size={17} />} label="Quick practice" sub="1 recording · ~8 min" />
      </div>

      {error ? <div style={{ marginTop: 18 }}><UpgradeNotice message={error} /></div> : null}

      {tab === "tests" ? (
        !catalogue ? (
          <p style={{ marginTop: 30, fontSize: 14.5, color: MUTED, display: "flex", alignItems: "center", gap: 9 }}>
            <Loader2 className="animate-spin" size={16} /> Loading the practice tests…
          </p>
        ) : tests.length === 0 ? (
          <EmptyHint>
            The full practice tests are being recorded right now — each one is four parts and
            forty questions. Check back shortly, or try a quick practice meanwhile.
          </EmptyHint>
        ) : (
          <div style={{ marginTop: 20 }}>
            <Grid>
              {tests.map((it) => (
                <TestCard key={it.id} it={it} loading={busy === it.id} disabled={!!busy} onOpen={() => onOpen(it)} />
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
                <GenerateCta
                  generating={busy === "generate"}
                  disabled={!!busy}
                  onGo={onGenerate}
                />
              }
            />
          </div>

          {mineSeq.length > 0 ? (
            <>
              <SectionLabel>Your practices</SectionLabel>
              <Grid>
                {mineSeq.map((it) => (
                  <MineCard key={it.id} it={it} loading={busy === `mine:${it.id}`} disabled={!!busy} onOpen={() => onOpenMine(it.id)} />
                ))}
              </Grid>
            </>
          ) : mine != null ? (
            <EmptyHint>Nothing here yet — generate your first practice above. Every one you make is saved to your account and stays reopenable.</EmptyHint>
          ) : null}

          {quick.length > 0 ? (
            <>
              <SectionLabel>Ready-made quick practices</SectionLabel>
              <Grid>
                {quick.map((it) => (
                  <QuickCard key={it.id} it={it} loading={busy === it.id} disabled={!!busy} onOpen={() => onOpen(it)} />
                ))}
              </Grid>
            </>
          ) : null}
        </>
      )}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: "#9A99A8" }}>
        Original audio and questions in the IELTS Listening format — not affiliated with or
        endorsed by IELTS®.
      </p>
    </div>
  );
}

/** Level picker + shimmer CTA for the aurora banner. The part is never chosen —
 *  the generator picks one at random, like walking into the real exam. */
function GenerateCta({ generating, disabled, onGo }: {
  generating: boolean; disabled: boolean; onGo: (difficulty: number) => void;
}) {
  const [difficulty, setDifficulty] = useState(3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[1, 2, 3, 4, 5].map((lv) => {
          const on = lv === difficulty;
          return (
            <button key={lv} type="button" onClick={() => setDifficulty(lv)} disabled={generating} aria-pressed={on}
              style={{ padding: "5px 10px", borderRadius: 8, border: on ? "1px solid rgba(255,255,255,.9)" : "1px solid rgba(255,255,255,.28)", background: on ? "#fff" : "rgba(255,255,255,.12)", color: on ? INDIGO : "rgba(255,255,255,.85)", fontFamily: SANS, fontSize: 12, fontWeight: 700, cursor: generating ? "default" : "pointer" }}>
              L{lv}
            </button>
          );
        })}
      </div>
      <AiGenerateButton label="Generate practice" busyLabel="Recording audio… ~2 min" busy={disabled} generating={generating} onClick={() => onGo(difficulty)} minWidth={230} />
    </div>
  );
}

function LevelChip({ level, mr }: { level: number; mr?: number }) {
  const lvl = LEVEL_STYLE[level] ?? LEVEL_STYLE[3];
  return (
    <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: lvl.bg, color: lvl.fg, whiteSpace: "nowrap", marginRight: mr }}>
      Level {level}
    </span>
  );
}

function BestChip({ score, max }: { score: number; max: number }) {
  const good = score / max >= 0.7;
  return (
    <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: good ? "#E9F5EE" : "#FFF7E8", color: good ? GOOD : "#B45309", whiteSpace: "nowrap" }}>
      Best {score}/{max}
    </span>
  );
}

function StartAction({ loading, locked, done }: { loading: boolean; locked: boolean; done: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: locked ? "#8A899A" : INDIGO, fontSize: 14, fontWeight: 600 }}>
      {loading ? (<><Loader2 className="animate-spin" size={14} /> Opening…</>)
        : locked ? (<><Lock size={13} /> Pro</>)
        : done ? (<>Retake <RotateCcw size={13} /></>)
        : (<>Start <ArrowRight size={14} /></>)}
    </span>
  );
}

function TypeTags({ part }: { part: number }) {
  const tags = QTYPE_TAGS[part] ?? [];
  if (tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span key={t} style={{ background: "#F4F4FB", border: "1px solid #ECEAF2", color: "#5A596B", fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 7 }}>{t}</span>
      ))}
    </div>
  );
}

/** A FULL 4-part test card ("Practice test N" — 40 questions). */
function TestCard({ it, loading, disabled, onOpen }: {
  it: LibraryItem & { seq: number }; loading: boolean; disabled: boolean; onOpen: () => void;
}) {
  const done = it.best_score != null;
  return (
    <button type="button" onClick={onOpen} disabled={disabled} className="lp-hover"
      style={{ ...cardStyle, width: "100%", textAlign: "left", fontFamily: SANS, cursor: disabled ? "default" : "pointer", opacity: it.locked ? 0.66 : disabled && !loading ? 0.7 : 1 }}>
      <div style={rowBetween}>
        <span style={iconTile}><Headphones size={19} /></span>
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
        <span style={metaText}>≈ 35 min · plays once</span>
        <StartAction loading={loading} locked={it.locked} done={done} />
      </div>
    </button>
  );
}

/** A ready-made single-recording practice ("Quick practice N"). */
function QuickCard({ it, loading, disabled, onOpen }: {
  it: LibraryItem & { seq: number }; loading: boolean; disabled: boolean; onOpen: () => void;
}) {
  const done = it.best_score != null;
  return (
    <button type="button" onClick={onOpen} disabled={disabled} className="lp-hover"
      style={{ ...cardStyle, width: "100%", textAlign: "left", fontFamily: SANS, cursor: disabled ? "default" : "pointer", opacity: it.locked ? 0.66 : disabled && !loading ? 0.7 : 1 }}>
      <div style={rowBetween}>
        <span style={iconTile}><Headphones size={19} /></span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {done ? <BestChip score={it.best_score ?? 0} max={10} /> : null}
          <LevelChip level={it.difficulty} />
        </span>
      </div>
      <div>
        <h4 style={cardTitle}>Quick practice {it.seq}</h4>
        <span style={{ ...cardSub, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.topic || "Listening practice"}</span>
      </div>
      <TypeTags part={it.part} />
      <Divider />
      <div style={rowBetween}>
        <span style={metaText}>10 questions · plays once</span>
        <StartAction loading={loading} locked={it.locked} done={done} />
      </div>
    </button>
  );
}

/** One of the learner's own AI-generated practices ("My practice N"). */
function MineCard({ it, loading, disabled, onOpen }: {
  it: MineItem & { seq: number }; loading: boolean; disabled: boolean; onOpen: () => void;
}) {
  const when = it.created_at
    ? new Date(it.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  return (
    <button type="button" onClick={onOpen} disabled={disabled} className="lp-hover"
      style={{ ...cardStyle, width: "100%", textAlign: "left", fontFamily: SANS, cursor: disabled ? "default" : "pointer", opacity: disabled && !loading ? 0.7 : 1 }}>
      <AiCorner />
      <div style={rowBetween}>
        <span style={iconTile}><Sparkles size={19} /></span>
        <LevelChip level={it.difficulty} mr={34} />
      </div>
      <div>
        <h4 style={cardTitle}>My practice {it.seq}</h4>
        <span style={{ ...cardSub, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {it.topic || "Listening practice"}
        </span>
      </div>
      <TypeTags part={it.part} />
      <Divider />
      <div style={rowBetween}>
        <span style={metaText}>{when ? `Generated ${when}` : "Saved to your account"}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: INDIGO, fontSize: 14, fontWeight: 600 }}>
          {loading ? (<><Loader2 className="animate-spin" size={14} /> Opening…</>) : (<>Open <ArrowRight size={14} /></>)}
        </span>
      </div>
    </button>
  );
}

// ---- Hub pieces (visual language shared with the Reading hub) ------------------

function TabButton({ active, onClick, icon, label, sub }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      style={{ flex: 1, display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", background: active ? "#fff" : "transparent", color: active ? INDIGO : MUTED, boxShadow: active ? "0 2px 8px -3px rgba(28,27,46,.28)" : "none", transition: "background .15s ease" }}>
      <span style={{ display: "flex", flex: "none", color: active ? INDIGO : "#8A899A" }}>{icon}</span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontFamily: SANS, fontWeight: active ? 700 : 600, fontSize: 14.5 }}>{label}</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: active ? "#7C78C9" : "#9A99A8", marginTop: 2 }}>{sub}</span>
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 14px" }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>{children}</span>
      <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.1)" }} />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p style={{ marginTop: 18, fontSize: 13.5, color: "#8A899A", fontFamily: SANS }}>{children}</p>;
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(28,27,46,.07)" }} />;
}

/** Top-right corner marker for the learner's own AI-generated cards. */
function AiCorner() {
  return (
    <span title="AI-generated" aria-label="AI-generated"
      style={{ position: "absolute", top: 14, right: 14, zIndex: 2, width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#5B55D6,#3B43B5)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px -6px rgba(59,67,181,.7)" }}>
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
const rowBetween: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const cardTitle: React.CSSProperties = { fontFamily: SANS, fontWeight: 700, fontSize: 15.5, lineHeight: 1.3, margin: "0 0 3px", color: INK };
const cardSub: React.CSSProperties = { fontSize: 13.5, color: "#7A7989", fontWeight: 500 };
const metaText: React.CSSProperties = { fontSize: 13, color: "#8A899A" };
const iconTile: React.CSSProperties = { width: 40, height: 40, borderRadius: 11, background: "#EFEEFC", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" };


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

function Runner({ view, source, onExit }: { view: RenderView; source: Source; onExit: () => void }) {
  const [attempt, setAttempt] = useState(1); // bump to reset player + answers
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [grade, setGrade] = useState<Grade | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>("idle");

  const isTest = view.kind === "test";
  const partViews = useMemo(() => (isTest ? view.parts ?? [] : [view]), [view, isTest]);
  const questionNums = useMemo(
    () => partViews.flatMap(partQuestionNums).sort((a, b) => a - b),
    [partViews],
  );
  const answered = questionNums.filter((n) => (answers[n] ?? "").trim()).length;

  const submit = useCallback(async () => {
    setGrading(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(answers)) body[k] = v;
      const graded = source === "library"
        ? await callEngine<Grade>("library/grade", { library_id: view.id, answers: body })
        : await callEngine<Grade>("grade", { item_id: view.id, answers: body });
      setGrade(graded);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed — please try again.");
    } finally {
      setGrading(false);
    }
  }, [answers, view.id, source]);

  const practiceAgain = useCallback(() => {
    setAnswers({});
    setGrade(null);
    setPhase("idle");
    setError(null);
    setAttempt((a) => a + 1);
    window.scrollTo({ top: 0 });
  }, []);

  const resultByQ = useMemo(() => {
    const map = new Map<number, QResult>();
    for (const r of grade?.results ?? []) map.set(r.q, r);
    return map;
  }, [grade]);

  const lvl = LEVEL_STYLE[view.difficulty ?? 3] ?? LEVEL_STYLE[3];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#F7F7FB", overflowY: "auto", fontFamily: SANS, color: INK }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "#1C1B2E", color: "#fff", padding: "12px clamp(16px,3vw,28px)", display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" onClick={onExit} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.1)", color: "#fff", border: "none", borderRadius: 9, padding: "8px 12px", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <ArrowLeft size={15} /> Exit
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {isTest ? "Listening · Practice test" : "Listening · Quick practice"}
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {isTest ? "4 parts · 40 questions" : view.topic}
          </div>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: 7, fontSize: 12.5, fontWeight: 700, background: lvl.bg, color: lvl.fg, flex: "none" }}>
          Level {view.difficulty ?? 3}
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "14px clamp(14px,3vw,24px) 120px" }}>
        {/* The player sticks below the header — scrolling the questions never
            hides the countdowns or the pause control. */}
        <div style={{ position: "sticky", top: 62, zIndex: 4 }}>
          <Player key={attempt} segments={view.audio} phase={phase} setPhase={setPhase} />
        </div>

        {/* Questions — one panel per part (a quick practice is a single part) */}
        {partViews.map((p) => (
          <div key={p.part}>
            {isTest ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 0" }}>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>
                  {PART_LABEL[p.part] ?? `Part ${p.part}`}
                </span>
                <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.1)" }} />
              </div>
            ) : null}
            <div style={{ background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: "22px clamp(16px,3vw,26px)", marginTop: isTest ? 10 : 16, boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
              <PartPanels p={p} answers={answers} setAnswers={setAnswers} results={grade ? resultByQ : null} />
            </div>
          </div>
        ))}

        {grade ? <ReviewPanel grade={grade} /> : null}
        {grade ? <ReplayList segments={view.audio} /> : null}
        {error ? <UpgradeNotice message={error} /> : null}
      </div>

      {/* Sticky action bar — submit is always reachable, no scrolling hunt */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 6, background: "#fff", borderTop: "1px solid rgba(28,27,46,.1)", boxShadow: "0 -4px 16px rgba(28,27,46,.06)", padding: "12px clamp(16px,3vw,28px)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          {!grade ? (
            <>
              <span style={{ fontSize: 13.5, color: MUTED, flex: 1 }}>
                <strong style={{ color: INK }}>{answered}/{questionNums.length}</strong> answered
                {phase === "finished" ? " — the recording has ended." : ""}
              </span>
              <button type="button" onClick={submit} disabled={grading} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: INDIGO, color: "#fff", border: "none", borderRadius: 11, padding: "11px 22px", fontFamily: SANS, fontSize: 14.5, fontWeight: 700, cursor: grading ? "default" : "pointer", opacity: grading ? 0.7 : 1 }}>
                {grading ? (<><Loader2 className="animate-spin" size={16} /> Checking…</>) : (<>Submit answers <ArrowRight size={15} /></>)}
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 15, fontWeight: 700, color: grade.score / grade.max_score >= 0.7 ? GOOD : INK, flex: 1 }}>
                {grade.score}/{grade.max_score} correct
                {grade.band != null ? (
                  <span style={{ marginLeft: 10, padding: "3px 10px", borderRadius: 8, background: TINT, color: INDIGO, fontSize: 13.5 }}>
                    Band {grade.band.toFixed(1)}
                  </span>
                ) : null}
              </span>
              <button type="button" onClick={practiceAgain} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: INK, border: "1px solid rgba(28,27,46,.14)", borderRadius: 11, padding: "10px 18px", fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                <RotateCcw size={15} /> Practice again
              </button>
              <button type="button" onClick={onExit} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: INDIGO, color: "#fff", border: "none", borderRadius: 11, padding: "10px 18px", fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {source === "library" ? "Back to library" : "Back to Listening"} <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Player ---------------------------------------------------------------------

/** Sequential exam player: audio segments play once, in order, with the timed
 *  reading pauses rendered as countdowns. Pause/resume is allowed (practice
 *  convenience — the real exam has no pause), but there is no seeking and no
 *  replay until the attempt is graded. */
function Player({ segments, phase, setPhase }: {
  segments: Segment[]; phase: PlayerPhase; setPhase: (p: PlayerPhase) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(-1);
  const [paused, setPaused] = useState(false);
  // Remaining seconds of the CURRENT pause segment, keyed by segment index so a
  // new pause never briefly shows the previous one's clock.
  const [remain, setRemain] = useState<{ idx: number; seconds: number }>({ idx: -1, seconds: 0 });
  const [audioError, setAudioError] = useState<string | null>(null);
  const seg: Segment | null = idx >= 0 && idx < segments.length ? segments[idx] : null;

  const advance = useCallback(() => {
    setPaused(false);
    setIdx((cur) => {
      const next = cur + 1;
      if (next >= segments.length) {
        setPhase("finished");
        return cur;
      }
      return next;
    });
  }, [segments.length, setPhase]);

  // Load + play the current audio segment (same unlocked element every time).
  useEffect(() => {
    if (!seg || phase !== "running" || seg.kind !== "audio") return;
    const el = audioRef.current;
    if (!el) return;
    setAudioError(null);
    el.src = seg.url;
    el.play().catch(() => setAudioError("Playback was blocked — press play to continue."));
  }, [seg, phase]);

  // Pause/resume toggling for the audio element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || seg?.kind !== "audio" || phase !== "running") return;
    if (paused) el.pause();
    else if (el.paused && el.src) el.play().catch(() => {});
  }, [paused, seg, phase]);

  // Countdown ticking for pause segments (freezes while paused; advances at 0).
  const remainRef = useRef<{ idx: number; seconds: number }>({ idx: -1, seconds: 0 });
  useEffect(() => {
    if (!seg || phase !== "running" || seg.kind !== "pause" || paused) return;
    const at = idx;
    const t = setInterval(() => {
      const cur = remainRef.current.idx === at ? remainRef.current.seconds : seg.seconds;
      const next = Math.max(cur - 1, 0);
      remainRef.current = { idx: at, seconds: next };
      setRemain(remainRef.current);
      if (next === 0) {
        clearInterval(t);
        advance();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [seg, idx, phase, paused, advance]);

  const countdown = seg?.kind === "pause"
    ? (remain.idx === idx ? remain.seconds : seg.seconds)
    : 0;

  const start = () => {
    setPhase("running");
    setIdx(0);
  };

  const finished = phase === "finished";
  const total = segments.length;

  return (
    <div style={{ background: "#1C1B2E", color: "#fff", borderRadius: 16, padding: "18px 20px" }}>
      <audio ref={audioRef} onEnded={advance} style={{ display: "none" }} />

      {phase === "idle" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button type="button" onClick={start} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: INDIGO, color: "#fff", border: "none", borderRadius: 11, padding: "12px 20px", fontFamily: SANS, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
            <Volume2 size={17} /> Start the recording
          </button>
          <span style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", lineHeight: 1.5, flex: 1, minWidth: 220 }}>
            The audio plays <strong>once</strong> — no going back. You can pause if you need to
            (the real exam doesn’t allow it). The announcer gives you timed reading pauses.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            {finished ? <Check size={19} color="#4ade80" /> : seg?.kind === "pause" ? <Clock size={19} /> : <Volume2 size={19} className={paused ? undefined : "animate-pulse"} />}
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>
              {finished ? "That is the end of the recording" : seg?.label}
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
              {finished
                ? "Review your answers, then submit."
                : paused
                  ? "Paused — the real exam doesn’t allow this."
                  : seg?.kind === "pause"
                    ? `Reading time — ${countdown}s`
                    : audioError ?? "Playing — answer as you listen."}
            </div>
          </div>
          {!finished ? (
            <button type="button" onClick={() => setPaused((p) => !p)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 9, padding: "8px 14px", fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {paused ? (<><Play size={13} /> Resume</>) : (<><Pause size={13} /> Pause</>)}
            </button>
          ) : null}
          {!finished && seg?.kind === "pause" ? (
            <button type="button" onClick={advance} style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 9, padding: "8px 14px", fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Skip wait
            </button>
          ) : null}
          {audioError && seg?.kind === "audio" ? (
            <button type="button" onClick={() => audioRef.current?.play().then(() => setAudioError(null)).catch(() => {})} style={{ background: INDIGO, color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontFamily: SANS, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Play
            </button>
          ) : null}
          {!finished ? (
            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.5)", flex: "none" }}>{Math.min(idx + 1, total)}/{total}</span>
          ) : null}
        </div>
      )}

    </div>
  );
}

/** Post-grade free replay (practice review, no exam rules anymore) — rendered
 *  below the review so the sticky player stays compact. */
function ReplayList({ segments }: { segments: Segment[] }) {
  return (
    <div style={{ marginTop: 16, background: "#1C1B2E", color: "#fff", borderRadius: 16, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: ".04em", textTransform: "uppercase" }}>Listen again</span>
      {segments.filter((s): s is AudioSeg => s.kind === "audio").map((s) => (
        <div key={s.path} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)", width: 200, flex: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
          <audio src={s.url} controls preload="none" style={{ flex: 1, height: 32 }} />
        </div>
      ))}
    </div>
  );
}

// ---- Question panels ---------------------------------------------------------

function GapInput({ n, value, onChange, result }: {
  n: number; value: string; onChange: (v: string) => void; result: QResult | null;
}) {
  const graded = result != null;
  const border = graded ? (result.is_correct ? GOOD : BAD) : "#C9C7E2";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, verticalAlign: "baseline" }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: INDIGO, background: TINT, borderRadius: 6, padding: "1px 6px" }}>{n}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={graded}
        aria-label={`Answer ${n}`}
        style={{ width: 130, border: "none", borderBottom: `2px solid ${border}`, background: graded ? (result.is_correct ? "#f0fdf4" : "#fef2f2") : "#FBFBFE", fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: INK, padding: "3px 6px", outline: "none" }}
      />
      {graded && !result.is_correct ? (
        <span style={{ fontSize: 13, fontWeight: 700, color: GOOD, whiteSpace: "nowrap" }}>→ {result.correct_answer}</span>
      ) : null}
      {graded ? (result.is_correct ? <Check size={15} color={GOOD} /> : <X size={15} color={BAD} />) : null}
    </span>
  );
}

/** Render a template string, replacing {n} placeholders with gap inputs. */
function Gapped({ template, answers, setAnswers, results }: {
  template: string; answers: Record<number, string>;
  setAnswers: (u: (a: Record<number, string>) => Record<number, string>) => void;
  results: Map<number, QResult> | null;
}) {
  const parts = template.split(/\{(\d+)\}/g);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return <span key={i}>{p}</span>;
        const n = Number(p);
        return (
          <GapInput
            key={i}
            n={n}
            value={answers[n] ?? ""}
            onChange={(v) => setAnswers((a) => ({ ...a, [n]: v }))}
            result={results?.get(n) ?? null}
          />
        );
      })}
    </>
  );
}

function PanelHeading({ title, wordLimit, range }: { title: string; wordLimit: string; range: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8A8FA0", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 4 }}>Questions {range}</div>
      <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 21, margin: 0, color: INK }}>{title}</h2>
      <div style={{ display: "inline-flex", marginTop: 8, background: TINT, color: INDIGO, border: "1px solid rgba(67,56,202,.14)", borderRadius: 8, padding: "4px 10px", fontSize: 12.5, fontWeight: 700 }}>
        Write {wordLimit} for each answer
      </div>
    </div>
  );
}

function FormPanel({ form, answers, setAnswers, results }: {
  form: NonNullable<RenderView["form"]>; answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  results: Map<number, QResult> | null;
}) {
  // Show a section heading only when it changes from row to row (pure derivation:
  // compare with the last non-null section among the preceding rows).
  const rows = useMemo(
    () =>
      form.rows.map((r, i) => {
        const prev = form.rows.slice(0, i).map((x) => x.section).filter(Boolean).pop() ?? null;
        return { ...r, header: r.section && r.section !== prev ? r.section : null };
      }),
    [form],
  );
  return (
    <div>
      <PanelHeading title={form.title} wordLimit={form.word_limit} range="1–10" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((r, i) => (
          <div key={i}>
            {r.header ? (
              <div style={{ fontWeight: 700, fontSize: 14, color: INK, margin: "16px 0 6px" }}>{r.header}</div>
            ) : null}
            <div style={{ display: "flex", gap: 14, padding: "9px 0", borderBottom: "1px solid rgba(28,27,46,.06)", fontSize: 14.5, lineHeight: 2 }}>
              <span style={{ width: 150, flex: "none", fontWeight: 600, color: MUTED, lineHeight: 2 }}>{r.label}</span>
              <span style={{ flex: 1, color: INK }}>
                <Gapped template={r.template} answers={answers} setAnswers={setAnswers} results={results} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesPanel({ notes, answers, setAnswers, results }: {
  notes: NonNullable<RenderView["notes"]>; answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  results: Map<number, QResult> | null;
}) {
  return (
    <div>
      <PanelHeading title={notes.title} wordLimit={notes.word_limit} range="31–40" />
      {notes.sections.map((s, si) => (
        <div key={si} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: INK, margin: "10px 0 6px" }}>{s.heading}</div>
          {s.lines.map((l, li) => (
            <div key={li} style={{ padding: "5px 0", paddingLeft: l.sub ? 34 : 14, fontSize: 14.5, lineHeight: 2, color: INK, display: "flex", gap: 8 }}>
              <span style={{ color: "#B4B2C9", flex: "none", lineHeight: 2 }}>•</span>
              <span><Gapped template={l.template} answers={answers} setAnswers={setAnswers} results={results} /></span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---- Letter-answer panels (Parts 2 & 3) -----------------------------------------

function QuestionsHeading({ text, instruction }: { text: string; instruction: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8A8FA0", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 6 }}>{text}</div>
      <div style={{ display: "inline-flex", background: TINT, color: INDIGO, border: "1px solid rgba(67,56,202,.14)", borderRadius: 8, padding: "4px 10px", fontSize: 12.5, fontWeight: 700 }}>{instruction}</div>
    </div>
  );
}

/** Renders whichever question material a part carries. */
function PartPanels({ p, answers, setAnswers, results }: {
  p: PartView;
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  results: Map<number, QResult> | null;
}) {
  if (p.form) return <FormPanel form={p.form} answers={answers} setAnswers={setAnswers} results={results} />;
  if (p.notes) return <NotesPanel notes={p.notes} answers={answers} setAnswers={setAnswers} results={results} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {(p.clusters ?? []).map((c) => (
        <ChooseTwoPanel key={c.questions[0]} cluster={c} answers={answers} setAnswers={setAnswers} results={results} />
      ))}
      {(p.mcqs ?? []).length > 0 ? (
        <McqPanel mcqs={p.mcqs ?? []} context={p.context} answers={answers} setAnswers={setAnswers} results={results} />
      ) : null}
      {p.matching && (p.matching.items ?? []).length > 0 ? (
        <MatchingPanel matching={p.matching} answers={answers} setAnswers={setAnswers} results={results} />
      ) : null}
    </div>
  );
}

/** "Choose TWO letters" — a pair of questions answered by one 5-option set. */
function ChooseTwoPanel({ cluster, answers, setAnswers, results }: {
  cluster: ClusterView;
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  results: Map<number, QResult> | null;
}) {
  const [qa, qb] = cluster.questions;
  const graded = results != null;
  const selected = [answers[qa], answers[qb]].filter(Boolean) as string[];
  const correctLetters = graded
    ? (results.get(qa)?.correct_answer ?? "").split(" or ").filter(Boolean)
    : [];

  const toggle = (letter: string) => {
    if (graded) return;
    setAnswers((prev) => {
      const cur = [prev[qa], prev[qb]].filter(Boolean) as string[];
      let next: string[];
      if (cur.includes(letter)) next = cur.filter((l) => l !== letter);
      else if (cur.length >= 2) return prev; // already two picked — deselect one first
      else next = [...cur, letter];
      next.sort();
      return { ...prev, [qa]: next[0] ?? "", [qb]: next[1] ?? "" };
    });
  };

  return (
    <div>
      <QuestionsHeading text={`Questions ${qa} and ${qb}`} instruction="Choose TWO letters." />
      <div style={{ fontWeight: 600, fontSize: 15, color: INK, margin: "4px 0 10px" }}>{cluster.stem}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {Object.entries(cluster.options).sort(([a], [b]) => a.localeCompare(b)).map(([letter, text]) => {
          const on = selected.includes(letter);
          const isCorrect = correctLetters.includes(letter);
          const border = graded ? (isCorrect ? GOOD : on ? BAD : "rgba(28,27,46,.12)") : on ? INDIGO : "rgba(28,27,46,.12)";
          const bg = graded ? (isCorrect ? "#f0fdf4" : on ? "#fef2f2" : "#fff") : on ? TINT : "#fff";
          return (
            <button key={letter} type="button" onClick={() => toggle(letter)} disabled={graded} aria-pressed={on}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${border}`, background: bg, fontFamily: SANS, fontSize: 14, color: INK, cursor: graded ? "default" : "pointer", textAlign: "left" }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${on || (graded && isCorrect) ? border : "#C9C7E2"}`, background: on && !graded ? INDIGO : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                {on && !graded ? <Check size={14} /> : graded && isCorrect ? <Check size={14} color={GOOD} /> : graded && on ? <X size={14} color={BAD} /> : null}
              </span>
              <strong style={{ width: 16, flex: "none" }}>{letter}</strong>
              <span style={{ flex: 1 }}>{text}</span>
            </button>
          );
        })}
      </div>
      {graded && selected.length < 2 ? (
        <div style={{ marginTop: 8, fontSize: 13, color: BAD }}>You needed to choose two letters.</div>
      ) : null}
    </div>
  );
}

/** Single-answer multiple choice (Part 3, Q21–23). */
function McqPanel({ mcqs, context, answers, setAnswers, results }: {
  mcqs: McqView[]; context?: string;
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  results: Map<number, QResult> | null;
}) {
  const graded = results != null;
  return (
    <div>
      <QuestionsHeading
        text={`Questions ${mcqs[0].q}–${mcqs[mcqs.length - 1].q}`}
        instruction="Choose the correct letter, A, B or C."
      />
      {context ? <div style={{ fontStyle: "italic", fontWeight: 600, fontSize: 14.5, color: INK, margin: "4px 0 6px" }}>{context}</div> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {mcqs.map((m) => {
          const r = results?.get(m.q) ?? null;
          return (
            <div key={m.q}>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: INK, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: INDIGO, background: TINT, borderRadius: 6, padding: "1px 6px", marginRight: 8 }}>{m.q}</span>
                {m.stem}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(m.options).sort(([a], [b]) => a.localeCompare(b)).map(([letter, text]) => {
                  const on = answers[m.q] === letter;
                  const isCorrect = graded && r?.correct_answer === letter;
                  const border = graded ? (isCorrect ? GOOD : on ? BAD : "rgba(28,27,46,.12)") : on ? INDIGO : "rgba(28,27,46,.12)";
                  const bg = graded ? (isCorrect ? "#f0fdf4" : on ? "#fef2f2" : "#fff") : on ? TINT : "#fff";
                  return (
                    <button key={letter} type="button" disabled={graded} aria-pressed={on}
                      onClick={() => setAnswers((prev) => ({ ...prev, [m.q]: prev[m.q] === letter ? "" : letter }))}
                      style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 13px", borderRadius: 10, border: `1.5px solid ${border}`, background: bg, fontFamily: SANS, fontSize: 14, color: INK, cursor: graded ? "default" : "pointer", textAlign: "left" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${on || isCorrect ? border : "#C9C7E2"}`, background: on && !graded ? INDIGO : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        {on && !graded ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} /> : isCorrect ? <Check size={12} color={GOOD} /> : graded && on ? <X size={12} color={BAD} /> : null}
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
function MatchingPanel({ matching, answers, setAnswers, results }: {
  matching: MatchingView;
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  results: Map<number, QResult> | null;
}) {
  const graded = results != null;
  const qs = matching.items.map((it) => it.q);
  const letters = Object.keys(matching.options).sort();
  return (
    <div>
      <QuestionsHeading
        text={`Questions ${qs[0]}–${qs[qs.length - 1]}`}
        instruction={`Choose your answers from the box — write the correct letter, ${letters[0]}–${letters[letters.length - 1]}.`}
      />
      {matching.heading ? <div style={{ fontWeight: 600, fontSize: 15, color: INK, margin: "4px 0 10px" }}>{matching.heading}</div> : null}

      {/* The option box */}
      <div style={{ border: "1.5px solid rgba(28,27,46,.16)", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 5, background: "#FBFBFE" }}>
        {letters.map((letter) => (
          <div key={letter} style={{ fontSize: 14, color: INK, display: "flex", gap: 10 }}>
            <strong style={{ width: 16, flex: "none" }}>{letter}</strong>
            <span>{matching.options[letter]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {matching.items.map((it) => {
          const r = results?.get(it.q) ?? null;
          const border = r ? (r.is_correct ? GOOD : BAD) : "#C9C7E2";
          return (
            <div key={it.q} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid rgba(28,27,46,.06)", fontSize: 14.5 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: INDIGO, background: TINT, borderRadius: 6, padding: "1px 6px", flex: "none" }}>{it.q}</span>
              <span style={{ flex: 1, color: INK, fontWeight: 500 }}>{it.label}</span>
              <select
                value={answers[it.q] ?? ""}
                disabled={graded}
                aria-label={`Answer ${it.q}`}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [it.q]: e.target.value }))}
                style={{ width: 64, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${border}`, background: r ? (r.is_correct ? "#f0fdf4" : "#fef2f2") : "#fff", fontFamily: SANS, fontSize: 14, fontWeight: 700, color: INK }}
              >
                <option value="">–</option>
                {letters.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {r ? (r.is_correct
                ? <Check size={15} color={GOOD} />
                : (<span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><X size={15} color={BAD} /><span style={{ fontSize: 13, fontWeight: 700, color: GOOD }}>→ {r.correct_answer}</span></span>)
              ) : null}
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
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Score summary */}
      <div style={{ background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
        <span style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: grade.score / grade.max_score >= 0.7 ? GOOD : grade.score / grade.max_score >= 0.4 ? INK : BAD, lineHeight: 1 }}>
          {grade.score}<span style={{ fontSize: 20, color: "#9A99A8" }}>/{grade.max_score}</span>
        </span>
        {grade.band != null ? (
          <span style={{ padding: "8px 16px", borderRadius: 12, background: TINT, border: "1px solid rgba(67,56,202,.16)", color: INDIGO, fontWeight: 700, fontSize: 17, whiteSpace: "nowrap" }}>
            Band {grade.band.toFixed(1)}
          </span>
        ) : null}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, color: INK }}>
            {grade.score === grade.max_score ? "Perfect — every answer caught." : wrong.length <= 3 ? "Strong listening — review the ones that got away." : "Good practice — the traps below are where the marks went."}
          </div>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 3 }}>
            Corrections are marked next to each question above. The transcript below shows exactly where each answer was said.
          </div>
        </div>
        {(grade.parts ?? []).length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
            {(grade.parts ?? []).map((p) => (
              <span key={p.part} style={{ padding: "5px 12px", borderRadius: 8, background: "#F4F4FB", border: "1px solid #ECEAF2", fontSize: 13, fontWeight: 700, color: p.score / p.max_score >= 0.7 ? GOOD : "#5A596B" }}>
                Part {p.part}: {p.score}/{p.max_score}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Trap explanations */}
      {trapped.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
          <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, margin: "0 0 12px", color: INK }}>Why the traps worked</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trapped.map((r) => (
              <div key={r.q} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ flex: "none", width: 30, height: 24, borderRadius: 7, background: r.is_correct ? "#f0fdf4" : "#fef2f2", color: r.is_correct ? GOOD : BAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700 }}>{r.q}</span>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: MUTED }}>
                  <strong style={{ color: INK }}>{r.correct_answer}</strong> — {TRAP_EXPLAIN[r.trap as string]}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Transcript */}
      <div style={{ background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
        <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, margin: "0 0 12px", color: INK }}>Transcript</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {grade.transcript.map((l, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.6, color: INK }}>
              <span style={{ fontWeight: 700, color: INDIGO }}>{l.speaker}: </span>
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
