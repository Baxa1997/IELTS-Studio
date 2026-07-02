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

type RenderView = {
  id: string;
  part: number;
  topic: string;
  narrator_intro: string;
  difficulty?: number;
  audio: Segment[];
  form?: { title: string; word_limit: string; rows: FormRow[] };
  notes?: { title: string; word_limit: string; sections: NoteSection[] };
};

type QResult = {
  q: number; user_answer: string; correct_answer: string;
  is_correct: boolean; kind: string; trap: string | null;
};
type Grade = {
  part: number; score: number; max_score: number;
  results: QResult[]; transcript: { speaker: string; text: string }[];
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
};

const PART_LABEL: Record<number, string> = {
  1: "Part 1 · Conversation",
  2: "Part 2 · Monologue",
  3: "Part 3 · Discussion",
  4: "Part 4 · Lecture",
};

/** Parts the generator can produce today (2 & 3 join when they ship). */
const LIVE_PARTS = [1, 4];

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

  const generate = useCallback(async (part: number, difficulty: number) => {
    setBusy("generate");
    setError(null);
    try {
      setSource("mine");
      setView(await callEngine<RenderView>("generate", { part, difficulty }));
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
  onGenerate: (part: number, difficulty: number) => void;
}) {
  const [partFilter, setPartFilter] = useState<number | null>(null);

  // "Practice test N" — stable global numbering, easiest first (the stable sort
  // keeps the engine's created_at order within a level).
  const numbered = useMemo(
    () => [...(catalogue?.items ?? [])]
      .sort((a, b) => a.difficulty - b.difficulty)
      .map((it, i) => ({ ...it, seq: i + 1 })),
    [catalogue],
  );
  const shown = partFilter == null ? numbered : numbered.filter((it) => it.part === partFilter);

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
            Start a ready-made practice test in one click, or generate a fresh part — the announcer
            frames the recording, the audio plays once, and every trap is explained after grading.
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
        <TabButton active={tab === "tests"} onClick={() => setTab("tests")} icon={<Headphones size={17} />} label="Practice tests" sub="Ready-made library" />
        <TabButton active={tab === "parts"} onClick={() => setTab("parts")} icon={<Sparkles size={17} />} label="Part practice" sub="AI · surprise part" />
      </div>

      {error ? <div style={{ marginTop: 18 }}><UpgradeNotice message={error} /></div> : null}

      {tab === "tests" ? (
        <>
          {/* Viewing filter only — starting a test never asks for a part */}
          <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            {[null, ...LIVE_PARTS].map((p) => {
              const active = partFilter === p;
              return (
                <button key={p ?? 0} type="button" onClick={() => setPartFilter(p)}
                  style={{ padding: "7px 14px", borderRadius: 999, border: active ? "1px solid #1C1B2E" : "1px solid rgba(28,27,46,.14)", background: active ? INK : "#fff", color: active ? "#fff" : MUTED, fontFamily: SANS, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {p == null ? "All parts" : PART_LABEL[p]}
                </button>
              );
            })}
          </div>

          {!catalogue ? (
            <p style={{ marginTop: 30, fontSize: 14.5, color: MUTED, display: "flex", alignItems: "center", gap: 9 }}>
              <Loader2 className="animate-spin" size={16} /> Loading the practice library…
            </p>
          ) : shown.length === 0 ? (
            <EmptyHint>New recordings are being added to the library right now — check back in a little while.</EmptyHint>
          ) : (
            <div style={{ marginTop: 18 }}>
              <Grid>
                {shown.map((it) => (
                  <TestCard key={it.id} it={it} loading={busy === it.id} disabled={!!busy} onOpen={() => onOpen(it)} />
                ))}
              </Grid>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ marginTop: 18 }}>
            <AiGenerateSection
              title="Generate a part practice"
              badge="AI Studio"
              description="A surprise part — conversation or lecture, you won't know until the announcer speaks. An original script recorded as studio audio at your chosen level, ready in about two minutes and saved to your account."
              cta={
                <GenerateCta
                  generating={busy === "generate"}
                  disabled={!!busy}
                  onGo={(difficulty) => onGenerate(LIVE_PARTS[Math.floor(Math.random() * LIVE_PARTS.length)], difficulty)}
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

/** A ready-made library practice as a numbered card ("Practice test N"). */
function TestCard({ it, loading, disabled, onOpen }: {
  it: LibraryItem & { seq: number }; loading: boolean; disabled: boolean; onOpen: () => void;
}) {
  const lvl = LEVEL_STYLE[it.difficulty] ?? LEVEL_STYLE[3];
  const done = it.best_score != null;
  return (
    <button type="button" onClick={onOpen} disabled={disabled} className="lp-hover"
      style={{ ...cardStyle, width: "100%", textAlign: "left", fontFamily: SANS, cursor: disabled ? "default" : "pointer", opacity: it.locked ? 0.66 : disabled && !loading ? 0.7 : 1 }}>
      <div style={rowBetween}>
        <span style={iconTile}><Headphones size={19} /></span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {done ? (
            <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: (it.best_score ?? 0) >= 7 ? "#E9F5EE" : "#FFF7E8", color: (it.best_score ?? 0) >= 7 ? GOOD : "#B45309", whiteSpace: "nowrap" }}>
              Best {it.best_score}/10
            </span>
          ) : null}
          <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: lvl.bg, color: lvl.fg, whiteSpace: "nowrap" }}>Level {it.difficulty}</span>
        </span>
      </div>
      <div>
        <h4 style={cardTitle}>Practice test {it.seq}</h4>
        <span style={{ ...cardSub, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{PART_LABEL[it.part] ?? `Part ${it.part}`}</span>
      </div>
      <Divider />
      <div style={rowBetween}>
        <span style={metaText}>10 questions · plays once</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: it.locked ? "#8A899A" : INDIGO, fontSize: 14, fontWeight: 600 }}>
          {loading ? (<><Loader2 className="animate-spin" size={14} /> Opening…</>)
            : it.locked ? (<><Lock size={13} /> Pro</>)
            : done ? (<>Retake <RotateCcw size={13} /></>)
            : (<>Start <ArrowRight size={14} /></>)}
        </span>
      </div>
    </button>
  );
}

/** One of the learner's own AI-generated practices ("My practice N"). */
function MineCard({ it, loading, disabled, onOpen }: {
  it: MineItem & { seq: number }; loading: boolean; disabled: boolean; onOpen: () => void;
}) {
  const lvl = LEVEL_STYLE[it.difficulty] ?? LEVEL_STYLE[3];
  const when = it.created_at
    ? new Date(it.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  return (
    <button type="button" onClick={onOpen} disabled={disabled} className="lp-hover"
      style={{ ...cardStyle, width: "100%", textAlign: "left", fontFamily: SANS, cursor: disabled ? "default" : "pointer", opacity: disabled && !loading ? 0.7 : 1 }}>
      <AiCorner />
      <div style={rowBetween}>
        <span style={iconTile}><Sparkles size={19} /></span>
        <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: lvl.bg, color: lvl.fg, marginRight: 34, whiteSpace: "nowrap" }}>Level {it.difficulty}</span>
      </div>
      <div>
        <h4 style={cardTitle}>My practice {it.seq}</h4>
        <span style={{ ...cardSub, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {PART_LABEL[it.part] ?? `Part ${it.part}`} · {it.topic || "Listening"}
        </span>
      </div>
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

function Runner({ view, source, onExit }: { view: RenderView; source: Source; onExit: () => void }) {
  const [attempt, setAttempt] = useState(1); // bump to reset player + answers
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [grade, setGrade] = useState<Grade | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>("idle");

  const questionNums = useMemo(() => {
    const templates = view.form
      ? view.form.rows.map((r) => r.template)
      : (view.notes?.sections ?? []).flatMap((s) => s.lines.map((l) => l.template));
    return templates.flatMap((t) => [...t.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]))).sort((a, b) => a - b);
  }, [view]);
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
            Listening · Part {view.part}
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{view.topic}</div>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: 7, fontSize: 12.5, fontWeight: 700, background: lvl.bg, color: lvl.fg, flex: "none" }}>
          Level {view.difficulty ?? 3}
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px clamp(14px,3vw,24px) 120px" }}>
        <Player key={attempt} segments={view.audio} phase={phase} setPhase={setPhase} replayUnlocked={!!grade} />

        {/* Questions */}
        <div style={{ background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: "22px clamp(16px,3vw,26px)", marginTop: 16, boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
          {view.form ? (
            <FormPanel form={view.form} answers={answers} setAnswers={setAnswers} results={grade ? resultByQ : null} />
          ) : view.notes ? (
            <NotesPanel notes={view.notes} answers={answers} setAnswers={setAnswers} results={grade ? resultByQ : null} />
          ) : null}
        </div>

        {grade ? <ReviewPanel grade={grade} /> : null}
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
              <span style={{ fontSize: 15, fontWeight: 700, color: grade.score >= 7 ? GOOD : INK, flex: 1 }}>
                {grade.score}/{grade.max_score} correct
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
function Player({ segments, phase, setPhase, replayUnlocked }: {
  segments: Segment[]; phase: PlayerPhase; setPhase: (p: PlayerPhase) => void;
  replayUnlocked: boolean;
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

      {/* Post-grade free replay (practice review, no exam rules anymore) */}
      {replayUnlocked ? (
        <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: ".04em", textTransform: "uppercase" }}>Listen again</span>
          {segments.filter((s): s is AudioSeg => s.kind === "audio").map((s) => (
            <div key={s.path} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)", width: 200, flex: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
              <audio src={s.url} controls preload="none" style={{ flex: 1, height: 32 }} />
            </div>
          ))}
        </div>
      ) : null}
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

// ---- Review -------------------------------------------------------------------

function ReviewPanel({ grade }: { grade: Grade }) {
  const wrong = grade.results.filter((r) => !r.is_correct);
  const trapped = grade.results.filter((r) => r.trap && TRAP_EXPLAIN[r.trap]);
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Score summary */}
      <div style={{ background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
        <span style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: grade.score >= 7 ? GOOD : grade.score >= 4 ? INK : BAD, lineHeight: 1 }}>
          {grade.score}<span style={{ fontSize: 20, color: "#9A99A8" }}>/{grade.max_score}</span>
        </span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, color: INK }}>
            {grade.score === grade.max_score ? "Perfect — every answer caught." : wrong.length <= 3 ? "Strong listening — review the ones that got away." : "Good practice — the traps below are where the marks went."}
          </div>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 3 }}>
            Corrections are marked next to each gap above. The transcript below shows exactly where each answer was said.
          </div>
        </div>
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
