"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  GraduationCap,
  Headphones,
  Loader2,
  Lock,
  MessagesSquare,
  Users,
  Volume2,
  X,
} from "lucide-react";

import { UpgradeNotice } from "@/components/billing/upgrade-notice";
import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

/**
 * Listening hub + runner. Generation (script + exam-style TTS audio) and
 * grading live on the AI engine; the browser calls them directly (with the
 * user's Supabase token) so the ~2 min generate+synthesize runs off Vercel's
 * serverless cap. Generate returns an answer-STRIPPED view — questions plus a
 * segment playlist of signed audio URLs and timed reading pauses (the player
 * renders pauses as countdowns, exactly like the real exam's narrator flow).
 * Audio plays ONCE until submitted; grading is by id server-side; the review
 * reveals the transcript + which trap mechanism each question used.
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
type RecentItem = { id: string; part: number | null; topic: string; created_at: string };

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

const PART_META = [
  { part: 1, live: true, Icon: MessagesSquare, title: "Everyday conversation", desc: "Two speakers in a transactional call — a booking, an enquiry, a registration.", type: "Form completion · 10 questions" },
  { part: 2, live: false, Icon: Volume2, title: "Everyday monologue", desc: "One speaker giving public information — a talk, a tour, an announcement.", type: "Multiple choice · matching" },
  { part: 3, live: false, Icon: Users, title: "Academic conversation", desc: "Students discussing coursework — fast turns, opinions, agreement and pushback.", type: "Multiple choice · matching" },
  { part: 4, live: true, Icon: GraduationCap, title: "Academic lecture", desc: "A university-style lecture with completion notes that paraphrase what you hear.", type: "Note completion · 10 questions" },
];

// ---- Top-level ---------------------------------------------------------------

export function ListeningClient() {
  const [view, setView] = useState<RenderView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    let alive = true;
    callEngine<{ items: RecentItem[] }>("list", {})
      .then((r) => { if (alive) setRecent(r.items ?? []); })
      .catch(() => { /* history is non-essential — the hub still generates fresh */ });
    return () => { alive = false; };
  }, [view]); // reload after exiting a paper

  const generate = useCallback(async (part: number) => {
    setBusy(`p${part}`);
    setError(null);
    try {
      setView(await callEngine<RenderView>("generate", { part }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed — please try again.");
    } finally {
      setBusy(null);
    }
  }, []);

  const openItem = useCallback(async (id: string) => {
    setBusy(`item-${id}`);
    setError(null);
    try {
      setView(await callEngine<RenderView>("render", { item_id: id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this practice.");
    } finally {
      setBusy(null);
    }
  }, []);

  if (view) return <Runner view={view} onExit={() => setView(null)} />;
  return (
    <Hub busy={busy} error={error} recent={recent} onGenerate={generate} onOpen={openItem} />
  );
}

// ---- Hub ---------------------------------------------------------------------

function Hub({ busy, error, recent, onGenerate, onOpen }: {
  busy: string | null; error: string | null; recent: RecentItem[];
  onGenerate: (part: number) => void; onOpen: (id: string) => void;
}) {
  return (
    <div className="lp-hub-pad" style={{ width: "100%", padding: "26px 24px 64px", fontFamily: SANS, color: INK }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,3.6vw,38px)", lineHeight: 1.05, letterSpacing: "-.4px", margin: 0, color: INK }}>Listening</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0", maxWidth: 660 }}>
            Real exam flow: the announcer introduces the recording, you get timed reading
            pauses, the audio plays once — then instant grading with the transcript and
            every trap explained.
          </p>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, background: TINT, border: "1px solid rgba(67,56,202,.16)", color: INDIGO, padding: "8px 14px", borderRadius: 999, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
          <Headphones size={15} /> Parts 1 &amp; 4 live
        </span>
      </div>

      <div style={{ marginTop: 24 }}>
        <SectionLabel>Practise a part</SectionLabel>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {PART_META.map((p) => (
          <PartCard key={p.part} meta={p} loading={busy === `p${p.part}`} disabled={!!busy} onClick={() => onGenerate(p.part)} />
        ))}
      </div>
      {busy && busy.startsWith("p") ? (
        <p style={{ margin: "14px 2px 0", fontSize: 13.5, color: MUTED, display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 className="animate-spin" size={14} />
          Writing an original script and recording the studio audio — this takes about two minutes.
        </p>
      ) : null}

      {recent.length > 0 ? (
        <div style={{ marginTop: 28 }}>
          <SectionLabel>Your recent practices</SectionLabel>
          <div style={{ background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
            {recent.map((it, i) => (
              <button key={it.id} type="button" onClick={() => onOpen(it.id)} disabled={!!busy} className="lp-row" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "transparent", border: "none", borderTop: i === 0 ? "none" : "1px solid rgba(28,27,46,.07)", cursor: busy ? "default" : "pointer", textAlign: "left", fontFamily: SANS, opacity: busy && busy !== `item-${it.id}` ? 0.6 : 1 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: TINT, color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Headphones size={16} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Part {it.part ?? "?"} · {it.topic || "Listening practice"}
                  </span>
                  <span style={{ display: "block", fontSize: 12.5, color: "#8A899A", marginTop: 1 }}>
                    10 questions · {fmtWhen(it.created_at)}
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: INDIGO, fontSize: 13.5, fontWeight: 600, flex: "none" }}>
                  {busy === `item-${it.id}` ? (<><Loader2 className="animate-spin" size={14} /> Opening…</>) : (<>Open <ArrowRight size={14} /></>)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <UpgradeNotice message={error} /> : null}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: "#9A99A8" }}>
        Original audio and questions in the IELTS Listening format. Not affiliated with or endorsed by IELTS®.
      </p>
    </div>
  );
}

function PartCard({ meta, loading, disabled, onClick }: {
  meta: (typeof PART_META)[number]; loading: boolean; disabled: boolean; onClick: () => void;
}) {
  const { live, Icon } = meta;
  return (
    <button type="button" onClick={live ? onClick : undefined} disabled={disabled || !live} className={live ? "lp-hover" : undefined} style={{ position: "relative", background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10, textAlign: "left", fontFamily: SANS, cursor: live && !disabled ? "pointer" : "default", opacity: live ? (disabled && !loading ? 0.55 : 1) : 0.65, boxShadow: "0 1px 3px rgba(28,27,46,.04)", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: live ? TINT : "#F1F1F8", color: live ? INDIGO : "#8A899A", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon size={17} /></span>
          <span style={{ fontWeight: 700, fontSize: 15, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.title}</span>
        </span>
        {live ? (
          <span style={{ padding: "3px 9px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: TINT, color: INDIGO, flex: "none" }}>Part {meta.part}</span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "#F1F1F8", color: "#8A899A", flex: "none" }}><Lock size={11} /> Soon</span>
        )}
      </div>
      <span style={{ fontSize: 13, color: "#7A7989", lineHeight: 1.45 }}>{meta.desc}</span>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, borderTop: "1px solid rgba(28,27,46,.07)", paddingTop: 10 }}>
        <span style={{ fontSize: 12.5, color: "#8A899A" }}>{meta.type}</span>
        {live ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: INDIGO, fontSize: 14, fontWeight: 600 }}>
            {loading ? (<><Loader2 className="animate-spin" size={15} /> Recording…</>) : (<>Start <ArrowRight size={15} strokeWidth={2.2} /></>)}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>{children}</span>
      <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.1)" }} />
    </div>
  );
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ---- Runner --------------------------------------------------------------------

type PlayerPhase = "idle" | "running" | "finished";

function Runner({ view, onExit }: { view: RenderView; onExit: () => void }) {
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
      setGrade(await callEngine<Grade>("grade", { item_id: view.id, answers: body }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed — please try again.");
    } finally {
      setGrading(false);
    }
  }, [answers, view.id]);

  const resultByQ = useMemo(() => {
    const map = new Map<number, QResult>();
    for (const r of grade?.results ?? []) map.set(r.q, r);
    return map;
  }, [grade]);

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
        {grade ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: grade.score >= 7 ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 999, padding: "7px 14px", fontSize: 14, fontWeight: 700 }}>
            {grade.score} / {grade.max_score}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.65)", whiteSpace: "nowrap" }}>{answered}/{questionNums.length} answered</span>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px clamp(14px,3vw,24px) 80px" }}>
        <Player segments={view.audio} phase={phase} setPhase={setPhase} replayUnlocked={!!grade} />

        {/* Questions */}
        <div style={{ background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: "22px clamp(16px,3vw,26px)", marginTop: 16, boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
          {view.form ? (
            <FormPanel form={view.form} answers={answers} setAnswers={setAnswers} results={grade ? resultByQ : null} />
          ) : view.notes ? (
            <NotesPanel notes={view.notes} answers={answers} setAnswers={setAnswers} results={grade ? resultByQ : null} />
          ) : null}
        </div>

        {/* Submit / results */}
        {!grade ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
            <button type="button" onClick={submit} disabled={grading} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: INDIGO, color: "#fff", border: "none", borderRadius: 11, padding: "12px 22px", fontFamily: SANS, fontSize: 14.5, fontWeight: 700, cursor: grading ? "default" : "pointer", opacity: grading ? 0.7 : 1 }}>
              {grading ? (<><Loader2 className="animate-spin" size={16} /> Checking…</>) : (<>Submit answers <ArrowRight size={15} /></>)}
            </button>
            <span style={{ fontSize: 13, color: MUTED }}>
              {phase === "finished" ? "The recording has ended — check your answers, then submit." : "You can submit any time; unanswered gaps count as wrong."}
            </span>
          </div>
        ) : (
          <ReviewPanel grade={grade} />
        )}

        {error ? <UpgradeNotice message={error} /> : null}
      </div>
    </div>
  );
}

// ---- Player ---------------------------------------------------------------------

/** Sequential exam player: audio segments play once, in order, with the timed
 *  reading pauses rendered as countdowns (the narrator flow of the real test).
 *  No seeking or replay until the attempt is graded. */
function Player({ segments, phase, setPhase, replayUnlocked }: {
  segments: Segment[]; phase: PlayerPhase; setPhase: (p: PlayerPhase) => void;
  replayUnlocked: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(-1);
  // Elapsed seconds within the CURRENT pause, keyed by segment index so a new
  // pause never briefly shows the previous one's clock.
  const [tick, setTick] = useState<{ idx: number; gone: number }>({ idx: -1, gone: 0 });
  const [audioError, setAudioError] = useState<string | null>(null);
  const seg: Segment | null = idx >= 0 && idx < segments.length ? segments[idx] : null;

  const advance = useCallback(() => {
    setIdx((cur) => {
      const next = cur + 1;
      if (next >= segments.length) {
        setPhase("finished");
        return cur;
      }
      return next;
    });
  }, [segments.length, setPhase]);

  // Drive the current segment: play audio (same unlocked element every time)
  // or run a countdown for a pause marker.
  useEffect(() => {
    if (!seg || phase !== "running") return;
    if (seg.kind === "audio") {
      const el = audioRef.current;
      if (!el) return;
      setAudioError(null);
      el.src = seg.url;
      el.play().catch(() => setAudioError("Playback was blocked — press play to continue."));
      return;
    }
    const started = Date.now();
    const at = idx;
    const t = setInterval(() => {
      const gone = Math.floor((Date.now() - started) / 1000);
      setTick({ idx: at, gone });
      if (gone >= seg.seconds) {
        clearInterval(t);
        advance();
      }
    }, 250);
    return () => clearInterval(t);
  }, [seg, idx, phase, advance]);

  const countdown = seg?.kind === "pause"
    ? Math.max(seg.seconds - (tick.idx === idx ? tick.gone : 0), 0)
    : 0;

  const start = () => {
    setPhase("running");
    setIdx(0);
  };

  const finished = phase === "finished";
  const total = segments.length;

  return (
    <div style={{ background: "#1C1B2E", color: "#fff", borderRadius: 16, padding: "18px 20px" }}>
      {/* Hidden element — one instance so the user's first gesture unlocks all segments */}
      <audio ref={audioRef} onEnded={advance} style={{ display: "none" }} />

      {phase === "idle" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button type="button" onClick={start} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: INDIGO, color: "#fff", border: "none", borderRadius: 11, padding: "12px 20px", fontFamily: SANS, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
            <Volume2 size={17} /> Start the recording
          </button>
          <span style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", lineHeight: 1.5, flex: 1, minWidth: 220 }}>
            Exam conditions: the audio plays <strong>once</strong> — no pausing, no going back.
            The announcer gives you timed pauses to read the questions.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            {finished ? <Check size={19} color="#4ade80" /> : seg?.kind === "pause" ? <Clock size={19} /> : <Volume2 size={19} className="animate-pulse" />}
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>
              {finished ? "That is the end of the recording" : seg?.label}
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
              {finished
                ? "Review your answers, then submit."
                : seg?.kind === "pause"
                  ? `Reading time — ${countdown}s`
                  : audioError ?? "Playing — answer as you listen."}
            </div>
          </div>
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

      {/* Trap explanations for missed questions */}
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
