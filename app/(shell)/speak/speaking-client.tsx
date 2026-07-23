"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { LucidaScope } from "./lucida";
import { type SpeakProgressItem } from "./progress";
import { SpeakingReport, type SpeakMetrics, type SpeakResult } from "./report";

/**
 * The Speaking hub — two ways to practise and one place to review.
 *
 *   Mock test   the full 3-part live examiner. Exam-true: it never teaches.
 *   Tutor       a live lesson. Only teaches; never scores.
 *   My progress the band trajectory and past mock reports.
 *
 * Part-2 quick practice was retired from the hub, but its flow is kept below
 * and still runs when arriving via ?card= — that is the "practise this card
 * again" button on older reports, which would otherwise dead-end.
 *
 * Audio is captured as 16k mono WAV in the browser (AudioWorklet) and uploaded
 * raw to the engine; no model is ever called from the client.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const INDIGO = "#4338CA";
const TINT = "#EFEEFC";
const LINE = "#E8E6F0";
const RED = "#b91c1c";

type Tab = "mock" | "tutor" | "progress";

const PREP_S = 60;
const SPEAK_S = 120;

interface CueCard {
  title: string;
  bullets: string[];
  closing: string;
}
interface StartPayload {
  library_id: string;
  difficulty: number;
  cue_card: CueCard;
  prep_seconds: number;
  speak_seconds: number;
}
interface SubmitPayload {
  attempt_id: string;
  cue_card: CueCard;
  transcript: string;
  metrics: SpeakMetrics;
  result: SpeakResult;
  audio_url?: string | null;
}
interface RecentAttempt {
  id: string;
  created_at: string;
  result: { overall_band?: number; cue_card?: { title?: string } };
}

type Phase = "idle" | "starting" | "prep" | "recording" | "grading" | "report";

// ---- engine ------------------------------------------------------------------

async function engineToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session expired — please sign in again.");
  return token;
}

async function engineJson<T>(path: string, init: RequestInit): Promise<T> {
  const backend = clientEnv.aiBackendUrl;
  if (!backend) throw new Error("AI backend isn't configured.");
  const res = await fetch(`${backend}/speaking/${path}`, init);
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    detail?: string | { message?: string };
  };
  if (!res.ok) {
    const detail = typeof json.detail === "string" ? json.detail : json.detail?.message;
    throw new Error(detail ?? `Request failed (${res.status}).`);
  }
  return json as T;
}

// ---- 16k WAV recorder (AudioWorklet → Float32 → downsample → PCM16) ----------

const WORKLET_SRC = `
class Tap extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("speak-tap", Tap);
`;

interface Recorder {
  stop: () => Promise<{ wav: Blob; durationS: number }>;
  onLevel: (cb: (rms: number) => void) => void;
}

async function startRecorder(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(
    URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" })),
  );
  const src = ctx.createMediaStreamSource(stream);
  const tap = new AudioWorkletNode(ctx, "speak-tap");
  src.connect(tap);

  const chunks: Float32Array[] = [];
  let levelCb: ((rms: number) => void) | null = null;
  tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
    chunks.push(e.data);
    if (levelCb) {
      let s = 0;
      for (let i = 0; i < e.data.length; i++) s += e.data[i] * e.data[i];
      levelCb(Math.sqrt(s / e.data.length));
    }
  };
  const startedAt = Date.now();

  return {
    onLevel: (cb) => {
      levelCb = cb;
    },
    stop: async () => {
      const durationS = (Date.now() - startedAt) / 1000;
      tap.port.onmessage = null;
      src.disconnect();
      tap.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      const inRate = ctx.sampleRate;
      await ctx.close();

      let total = 0;
      for (const c of chunks) total += c.length;
      const all = new Float32Array(total);
      let off = 0;
      for (const c of chunks) {
        all.set(c, off);
        off += c.length;
      }
      // linear-interpolation resample to 16k mono
      const outRate = 16000;
      const outLen = Math.floor((all.length * outRate) / inRate);
      const pcm = new Int16Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const pos = (i * inRate) / outRate;
        const i0 = Math.floor(pos);
        const frac = pos - i0;
        const v = all[i0] * (1 - frac) + (all[Math.min(i0 + 1, all.length - 1)] ?? 0) * frac;
        pcm[i] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
      }
      // WAV header (44 bytes) + data
      const buf = new ArrayBuffer(44 + pcm.length * 2);
      const dv = new DataView(buf);
      const wstr = (o: number, s: string) => {
        for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
      };
      wstr(0, "RIFF");
      dv.setUint32(4, 36 + pcm.length * 2, true);
      wstr(8, "WAVE");
      wstr(12, "fmt ");
      dv.setUint32(16, 16, true);
      dv.setUint16(20, 1, true);
      dv.setUint16(22, 1, true);
      dv.setUint32(24, outRate, true);
      dv.setUint32(28, outRate * 2, true);
      dv.setUint16(32, 2, true);
      dv.setUint16(34, 16, true);
      wstr(36, "data");
      dv.setUint32(40, pcm.length * 2, true);
      new Int16Array(buf, 44).set(pcm);
      return { wav: new Blob([buf], { type: "audio/wav" }), durationS };
    },
  };
}

// ---- UI atoms -----------------------------------------------------------------

/** The legacy Part-2 flow keeps its media-query rule for the (now-unused-in-hub)
 *  two-column layout; the redesigned hub uses the Lucida `.lc-two-col` class. */
const RESPONSIVE_CSS = `
.speak-two-col { grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.85fr); }
@media (max-width: 900px) { .speak-two-col { grid-template-columns: 1fr; } }
`;

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 16,
  padding: "20px 22px",
};
const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  height: 42,
  padding: "0 20px",
  border: "none",
  borderRadius: 12,
  background: INDIGO,
  color: "#fff",
  fontFamily: "inherit",
  fontSize: 14.5,
  fontWeight: 700,
  cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  ...primaryBtn,
  background: "#fff",
  color: INK,
  border: `1px solid ${LINE}`,
};

function MicGlyph({ size = 22, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// ---- the client ---------------------------------------------------------------

interface Lesson {
  id: string;
  t: string;
  minutes: number;
  corrections: number;
  headline: string;
}

export function SpeakingClient({
  initialCardId = null,
  progress = [],
  recentMocks = [],
  recentLessons = [],
}: {
  initialCardId?: string | null;
  progress?: SpeakProgressItem[];
  recentMocks?: { id: string; t: string; band: number }[];
  recentLessons?: Lesson[];
}) {
  // Two things to do here — sit the exam, or have a lesson — plus somewhere to
  // see how it is going. Part-2 quick practice was retired from the hub; it
  // stays reachable ONLY via ?card= so the "practise this card again" buttons
  // on older reports do not dead-end.
  const legacyPart2 = Boolean(initialCardId);
  const [tab, setTab] = useState<Tab>("mock");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [session, setSession] = useState<StartPayload | null>(null);
  const [clock, setClock] = useState(0);
  const [level, setLevel] = useState(0);
  const [report, setReport] = useState<SubmitPayload | null>(null);
  const [recents, setRecents] = useState<RecentAttempt[]>([]);

  const recorderRef = useRef<Recorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guards double-entry into record() (prep auto-start racing the button).
  // Written only from event handlers/timers, never during render.
  const armedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // recent attempts (RLS-scoped direct select)
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("speaking_attempts")
      .select("id, created_at, result")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecents((data as RecentAttempt[] | null) ?? []));
  }, [phase]);

  useEffect(() => () => clearTimer(), []);

  const finish = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec || !session) return;
    recorderRef.current = null;
    clearTimer();
    setPhase("grading");
    try {
      const { wav, durationS } = await rec.stop();
      const token = await engineToken();
      const backend = clientEnv.aiBackendUrl;
      const qs = new URLSearchParams({
        library_id: session.library_id,
        duration_s: durationS.toFixed(1),
      });
      const res = await fetch(`${backend}/speaking/part2/submit?${qs}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "audio/wav" },
        body: wav,
      });
      const json = (await res.json().catch(() => ({}))) as SubmitPayload & {
        detail?: string | { message?: string };
      };
      if (!res.ok) {
        const detail = typeof json.detail === "string" ? json.detail : json.detail?.message;
        throw new Error(detail ?? `Grading failed (${res.status}).`);
      }
      setReport(json);
      setPhase("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed — your quota was not used.");
      setPhase("idle");
    } finally {
      armedRef.current = false;
    }
  }, [session]);

  const record = useCallback(async () => {
    if (armedRef.current) return;
    armedRef.current = true;
    clearTimer();
    setError(null);
    try {
      const rec = await startRecorder();
      recorderRef.current = rec;
      rec.onLevel((rms) => setLevel(rms));
      setPhase("recording");
      setClock(0);
      timerRef.current = setInterval(() => {
        setClock((c) => {
          if (c + 1 >= SPEAK_S) {
            clearTimer();
            void finish();
            return SPEAK_S;
          }
          return c + 1;
        });
      }, 1000);
    } catch (e) {
      armedRef.current = false;
      setError(e instanceof Error ? e.message : "Microphone unavailable.");
      setPhase("idle");
    }
  }, [finish]);

  const begin = useCallback(async () => {
    setError(null);
    setPhase("starting");
    try {
      // ask for the mic FIRST so permission issues surface before the card
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());
      const token = await engineToken();
      const s = await engineJson<StartPayload>("part2/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(difficulty ? { difficulty } : {}),
          ...(initialCardId ? { library_id: initialCardId } : {}),
        }),
      });
      setSession(s);
      setPhase("prep");
      setClock(s.prep_seconds ?? PREP_S);
      clearTimer();
      timerRef.current = setInterval(() => {
        setClock((c) => {
          if (c <= 1) {
            clearTimer();
            void record();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start — check mic permission.");
      setPhase("idle");
    }
  }, [difficulty, record]);

  const reset = () => {
    clearTimer();
    recorderRef.current = null;
    armedRef.current = false;
    setSession(null);
    setReport(null);
    setError(null);
    setPhase("idle");
  };

  const quotaHit = error ? /quota|upgrade/i.test(error) : false;

  // ---- Progress-tab stats (real, RLS-scoped data from page.tsx) --------------
  const graded = progress.filter((p) => typeof p.band === "number");
  const avgBand = graded.length ? graded.reduce((a, b) => a + b.band, 0) / graded.length : null;
  const bestBand = graded.length ? Math.max(...graded.map((g) => g.band)) : null;
  const critAvg = (k: "FC" | "LR" | "GRA" | "P"): number | null => {
    const vals = graded.map((g) => g.crit?.[k]).filter((v): v is number => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const skillRows: { label: string; v: number | null }[] = [
    { label: "Fluency & Coherence", v: critAvg("FC") },
    { label: "Lexical Resource", v: critAvg("LR") },
    { label: "Grammatical Range", v: critAvg("GRA") },
    { label: "Pronunciation", v: critAvg("P") },
  ];

  // ---- The redesigned "Lucida" hub ------------------------------------------
  // The legacy Part-2 flow (reached only via ?card= from old report links) keeps
  // its original look below; only the hub gets the new design.
  if (!legacyPart2) {
    const bandHue = (b: number) =>
      b >= 6 ? "var(--color-success)" : b >= 4.5 ? "var(--color-amber-500)" : "var(--color-error)";
    const TAB: Record<Tab, { label: string; color: string; border: string }> = {
      mock: { label: "Mock test", color: "var(--color-primary-600)", border: "var(--color-primary-500)" },
      tutor: { label: "Tutor", color: "var(--color-success)", border: "var(--color-success)" },
      progress: { label: "My progress", color: "var(--color-neutral-1000)", border: "var(--color-neutral-500)" },
    };
    const kicker: React.CSSProperties = {
      fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)",
      textTransform: "uppercase",
    };
    const lcCard: React.CSSProperties = {
      background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)",
      borderRadius: "var(--radius-xl)",
    };
    const railCard: React.CSSProperties = {
      ...lcCard, borderRadius: "var(--radius-2xl)", padding: 28, boxShadow: "var(--shadow-1)",
      alignSelf: "start",
    };

    return (
      <LucidaScope style={{ background: "var(--color-neutral-50)", minHeight: "100%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 48px 80px" }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-5xl)", color: "var(--color-neutral-1000)", letterSpacing: "var(--ls-snug)" }}>
              Speaking
            </div>
            <span style={{ ...kicker, color: "var(--color-primary-600)", background: "rgba(132,86,239,0.1)", border: "1px solid rgba(132,86,239,0.25)", padding: "4px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-2xs)", letterSpacing: "var(--ls-caps)" }}>
              Beta
            </span>
          </div>

          {/* tabs — the exam and the lesson never blur (violet vs. green) */}
          <div style={{ display: "flex", gap: 32, borderBottom: "1px solid var(--color-neutral-200)", marginBottom: 40 }}>
            {(Object.keys(TAB) as Tab[]).map((id) => {
              const on = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className="lc-tab"
                  style={{
                    appearance: "none", background: "none", cursor: "pointer", border: "none",
                    padding: "0 0 14px", fontSize: "var(--text-lg)", fontWeight: 600,
                    fontFamily: "inherit", whiteSpace: "nowrap", marginBottom: -1,
                    color: on ? TAB[id].color : "var(--color-neutral-500)",
                    borderBottom: `2px solid ${on ? TAB[id].border : "transparent"}`,
                  }}
                >
                  {TAB[id].label}
                </button>
              );
            })}
          </div>

          {/* MOCK TAB */}
          {tab === "mock" ? (
            <div className="lc-two-col" style={{ animation: "lcFadeInUp 400ms cubic-bezier(0.16,1,0.3,1)" }}>
              <div>
                <p style={{ fontSize: "var(--text-lg)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-600)", maxWidth: 640, margin: "0 0 28px" }}>
                  A complete IELTS speaking test with a live examiner. It asks, listens and
                  moves on — it never helps, hints or teaches, exactly like exam day — then
                  grades you conservatively against the official band descriptors.
                </p>
                {([
                  ["1", "Interview", "Familiar questions about you, your home, your work or studies.", "4–5 min"],
                  ["2", "Long turn", "A cue card, one minute to prepare, then you speak for two.", "3–4 min"],
                  ["3", "Discussion", "Abstract questions that push your ideas and your language.", "4–5 min"],
                ] as const).map(([n, name, blurb, mins]) => (
                  <div key={n} style={{ ...lcCard, display: "flex", alignItems: "center", gap: 20, padding: "22px 24px", marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "var(--radius-md)", background: "rgba(132,86,239,0.1)", color: "var(--color-primary-600)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)" }}>
                      {n}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-neutral-1000)" }}>{name}</div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", marginTop: 2 }}>{blurb}</div>
                    </div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-600)", whiteSpace: "nowrap" }}>{mins}</div>
                  </div>
                ))}
              </div>

              <aside style={railCard}>
                <div style={{ ...kicker, color: "var(--color-primary-600)", marginBottom: 12 }}>Full mock · Parts 1–3</div>
                <p style={{ fontSize: "var(--text-md)", color: "var(--color-neutral-600)", lineHeight: "var(--lh-relaxed)", margin: "0 0 22px" }}>
                  You won’t see the questions in advance. Choose your examiner on the next screen, then it begins.
                </p>
                <Link href="/speak/exam" className="lc-btn lc-primary" style={{ display: "block", textAlign: "center", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", fontSize: "var(--text-md)", fontWeight: 600, padding: 16, borderRadius: "var(--radius-lg)", textDecoration: "none", boxShadow: "var(--shadow-glow-sm)" }}>
                  Take the mock test →
                </Link>
                <div style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-neutral-500)", marginTop: 14, lineHeight: "var(--lh-relaxed)" }}>
                  Microphone · 11–14 minutes<br />Counts as one of your monthly mocks
                </div>
                {recentMocks.length ? (
                  <>
                    <div style={{ borderTop: "1px dashed var(--color-neutral-200)", margin: "22px 0" }} />
                    <div style={{ ...kicker, color: "var(--color-neutral-500)", marginBottom: 8 }}>Your last mocks</div>
                    {recentMocks.slice(0, 3).map((m) => (
                      <Link key={m.id} href={`/speak/mock/${m.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-neutral-100)", textDecoration: "none" }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-600)" }}>
                          {new Date(m.t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: bandHue(m.band), whiteSpace: "nowrap" }}>
                          Band {m.band.toFixed(1)} →
                        </span>
                      </Link>
                    ))}
                  </>
                ) : null}
              </aside>
            </div>
          ) : null}

          {/* TUTOR TAB */}
          {tab === "tutor" ? (
            <div className="lc-two-col" style={{ animation: "lcFadeInUp 400ms cubic-bezier(0.16,1,0.3,1)" }}>
              <div>
                <p style={{ fontSize: "var(--text-lg)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-600)", maxWidth: 640, margin: "0 0 28px" }}>
                  A live lesson, not a test. Tell it what you’re preparing for — the IELTS
                  exam, a presentation, a job interview, or just talking with friends — and
                  it teaches for that: correcting what you said, showing a stronger way to
                  say it, and handing you the English whenever you get stuck.
                </p>
                {([
                  ["Reacts to every answer", "It listens to what you actually said, not a script — and never reads your answer back to you."],
                  ["Shows you a better way", "“You said ‘it is good’ — a stronger word is ‘fulfilling’.” On almost every turn."],
                  ["Helps in o‘zbekcha", "Say it in Uzbek and it gives you the English sentence back, then asks you to repeat it."],
                ] as const).map(([title, blurb]) => (
                  <div key={title} style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: "1px solid var(--color-neutral-100)" }}>
                    <div style={{ width: 26, height: 26, flexShrink: 0, borderRadius: "50%", background: "var(--color-success-bg)", color: "var(--color-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>✓</div>
                    <div>
                      <div style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-neutral-1000)", marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", lineHeight: "var(--lh-relaxed)" }}>{blurb}</div>
                    </div>
                  </div>
                ))}
              </div>
              <aside style={railCard}>
                <div style={{ ...kicker, color: "var(--color-success)", marginBottom: 12 }}>Live lesson</div>
                <p style={{ fontSize: "var(--text-md)", color: "var(--color-neutral-600)", lineHeight: "var(--lh-relaxed)", margin: "0 0 22px" }}>
                  Pick a tutor and hear them speak on the next screen, then just start talking — nothing to set up.
                </p>
                <Link href="/speak/tutor" className="lc-btn lc-success" style={{ display: "block", textAlign: "center", background: "var(--color-success)", color: "#FFFFFF", fontSize: "var(--text-md)", fontWeight: 600, padding: 16, borderRadius: "var(--radius-lg)", textDecoration: "none" }}>
                  Start a lesson →
                </Link>
                <div style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-neutral-500)", marginTop: 14, lineHeight: "var(--lh-relaxed)" }}>
                  Microphone · up to 20 minutes<br />Not scored, never counts as a mock
                </div>
              </aside>
            </div>
          ) : null}

          {/* PROGRESS TAB */}
          {tab === "progress" ? (
            <div style={{ animation: "lcFadeInUp 400ms cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="lc-stat-grid" style={{ marginBottom: 28 }}>
                {([
                  ["Average band", avgBand == null ? "—" : avgBand.toFixed(1)],
                  ["Best band", bestBand == null ? "—" : bestBand.toFixed(1)],
                  ["Tutor lessons", String(recentLessons.length)],
                ] as const).map(([label, value]) => (
                  <div key={label} style={{ ...lcCard, padding: "22px 24px" }}>
                    <div style={{ ...kicker, color: "var(--color-neutral-500)" }}>{label}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", fontWeight: 700, color: "var(--color-neutral-1000)", marginTop: 8 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...lcCard, padding: 28 }}>
                <div style={{ ...kicker, color: "var(--color-neutral-500)", marginBottom: 20, fontSize: "var(--text-sm)" }}>Skill breakdown</div>
                {graded.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "var(--text-md)", color: "var(--color-neutral-500)" }}>
                    Take a mock and your per-criterion bands will appear here.
                  </p>
                ) : (
                  skillRows.map((sk) => (
                    <div key={sk.label} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", color: "var(--color-neutral-600)", marginBottom: 6 }}>
                        <span>{sk.label}</span>
                        <span style={{ fontWeight: 600, color: "var(--color-neutral-1000)" }}>{sk.v == null ? "—" : sk.v.toFixed(1)}</span>
                      </div>
                      <div style={{ height: 8, background: "var(--color-neutral-100)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${((sk.v ?? 0) / 9) * 100}%`, background: sk.v == null ? "var(--color-neutral-300)" : bandHue(sk.v), borderRadius: "var(--radius-pill)", transition: "width 700ms cubic-bezier(0.16,1,0.3,1)" }} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* history: reopen a past mock report, or see a past lesson */}
              {recentMocks.length ? (
                <div style={{ ...lcCard, padding: 24, marginTop: 20 }}>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 600, marginBottom: 12 }}>My full mocks</div>
                  {recentMocks.map((m) => (
                    <Link key={m.id} href={`/speak/mock/${m.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: "var(--text-sm)", color: "var(--color-neutral-700)", textDecoration: "none", padding: "10px 0", borderBottom: "1px solid var(--color-neutral-100)" }}>
                      <span>Full mock · {new Date(m.t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      <span style={{ color: bandHue(m.band), fontWeight: 600, whiteSpace: "nowrap" }}>Band {m.band.toFixed(1)} · report →</span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {recentLessons.length ? (
                <div style={{ ...lcCard, padding: 24, marginTop: 20 }}>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 600, marginBottom: 12 }}>My tutor lessons</div>
                  {recentLessons.map((l) => (
                    <div key={l.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--color-neutral-100)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: "var(--text-sm)" }}>
                        <span style={{ color: "var(--color-neutral-700)" }}>
                          {new Date(l.t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          <span style={{ color: "var(--color-neutral-500)" }}>
                            {" · "}{l.minutes.toFixed(1)} min
                            {l.corrections ? ` · ${l.corrections} correction${l.corrections === 1 ? "" : "s"}` : ""}
                          </span>
                        </span>
                        <span style={{ color: "var(--color-success)", fontWeight: 600, whiteSpace: "nowrap" }}>lesson</span>
                      </div>
                      {l.headline ? (
                        <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", lineHeight: "var(--lh-relaxed)" }}>{l.headline}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </LucidaScope>
    );
  }

  // ---- Legacy Part-2 flow (only via ?card=) — original styling --------------
  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 1280, margin: "0 auto", padding: "26px 26px 60px" }}>
      <style>{RESPONSIVE_CSS}</style>

      {/* header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 30, fontWeight: 600 }}>
          Speaking{" "}
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: INDIGO, background: TINT, borderRadius: 999, padding: "4px 10px", verticalAlign: "middle" }}>
            BETA
          </span>
        </h1>
        {phase !== "idle" ? (
          <button type="button" onClick={reset} style={{ ...ghostBtn, height: 34, fontSize: 13 }}>
            Exit practice
          </button>
        ) : null}
      </div>

      {/* the legacy Part-2 flow surfaces its own errors (quota, mic) */}
      {error ? (
        <div style={{ ...card, borderColor: "#F3C6C6", background: "#FDF3F3", color: RED, marginTop: 16, fontSize: 14 }}>
          {error}
          {quotaHit ? (
            <>
              {" "}
              <Link href="/pricing" style={{ color: INDIGO, fontWeight: 700 }}>
                See plans →
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      {/* idle hub (Part 2) */}
      {(phase === "idle" || phase === "starting") ? (
        <>
          <div style={{ ...card, marginTop: 18, textAlign: "center", padding: "34px 22px" }}>
            <button
              type="button"
              onClick={begin}
              disabled={phase === "starting"}
              aria-label="Start Part 2 practice"
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: `radial-gradient(circle at 35% 30%, #5A50E0, ${INDIGO})`,
                boxShadow: "0 18px 40px -14px rgba(67,56,202,.55)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: phase === "starting" ? 0.6 : 1,
              }}
            >
              <MicGlyph size={34} />
            </button>
            <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, marginTop: 16 }}>
              {phase === "starting" ? "Preparing your cue card…" : "Part 2 — the long turn"}
            </div>
            <p style={{ margin: "8px auto 0", maxWidth: 460, fontSize: 14, lineHeight: 1.6, color: MUTED }}>
              A cue card, exactly 1 minute to prepare (notes allowed), then speak for up to 2 minutes.
              Strict, examiner-calibrated feedback in about a minute. Use headphones in a quiet room.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
              {[null, 1, 2, 3, 4, 5].map((d) => (
                <button
                  key={String(d)}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  style={{
                    ...ghostBtn,
                    height: 32,
                    padding: "0 13px",
                    fontSize: 12.5,
                    borderRadius: 999,
                    background: difficulty === d ? INDIGO : "#fff",
                    color: difficulty === d ? "#fff" : INK,
                  }}
                >
                  {d === null ? "Any level" : `Level ${d}`}
                </button>
              ))}
            </div>
          </div>

          {recents.length ? (
            <div style={{ ...card, marginTop: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>My recent practices</div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {recents.map((r) => (
                  <Link
                    key={r.id}
                    href={`/speak/results/${r.id}`}
                    style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13.5, color: INK, textDecoration: "none", borderBottom: `1px dashed ${LINE}`, paddingBottom: 8 }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.result?.cue_card?.title ?? "Speaking practice"}
                    </span>
                    <span style={{ color: INDIGO, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {r.result?.overall_band != null ? `Band ${r.result.overall_band}` : "…"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <p style={{ margin: "14px 0 0", fontSize: 12, color: "#9A9EAE" }}>
            Want the full 3-part exam with a live examiner? Switch to <strong>Full mock</strong> above.
            AI-estimated bands — not affiliated with or endorsed by IELTS®.
          </p>
        </>
      ) : null}

      {/* prep + recording share the cue card */}
      {(phase === "prep" || phase === "recording") && session ? (
        <>
          <div style={{ ...card, marginTop: 18, background: TINT, borderColor: "#DDDAF6" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".1em", color: MUTED, textTransform: "uppercase" }}>
              Cue card · level {session.difficulty}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, marginTop: 6 }}>{session.cue_card.title}</div>
            <div style={{ fontSize: 14, color: MUTED, marginTop: 8 }}>You should say:</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
              {session.cue_card.bullets.map((b) => (
                <li key={b} style={{ fontSize: 14.5, lineHeight: 1.7 }}>{b}</li>
              ))}
            </ul>
            <div style={{ fontSize: 14.5, marginTop: 8, fontWeight: 600 }}>{session.cue_card.closing}</div>
          </div>

          {phase === "prep" ? (
            <div style={{ ...card, marginTop: 14, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", color: MUTED, textTransform: "uppercase" }}>
                Preparation time
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 600, color: clock <= 10 ? RED : INK }}>{mmss(clock)}</div>
              <textarea
                placeholder="Your notes (like the paper you'd get in the exam)…"
                style={{ width: "100%", minHeight: 90, marginTop: 10, border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 12px", fontFamily: "inherit", fontSize: 14, resize: "vertical" }}
              />
              <button type="button" onClick={record} style={{ ...primaryBtn, marginTop: 12 }}>
                <MicGlyph size={16} /> Start speaking now
              </button>
            </div>
          ) : (
            <div style={{ ...card, marginTop: 14, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", color: RED, textTransform: "uppercase" }}>
                ● Recording
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 600 }}>{mmss(clock)}</div>
              <div aria-hidden style={{ height: 8, borderRadius: 999, background: "#EFEDE3", overflow: "hidden", maxWidth: 340, margin: "10px auto 0" }}>
                <div style={{ height: "100%", width: `${Math.min(100, level * 700)}%`, background: INDIGO, borderRadius: 999, transition: "width .12s linear" }} />
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: MUTED }}>
                Aim for 1–2 minutes and cover every bullet. The examiner stops you at 2:00.
              </p>
              <button type="button" onClick={finish} style={{ ...primaryBtn, marginTop: 12, background: RED }}>
                I&apos;m finished
              </button>
            </div>
          )}
        </>
      ) : null}

      {/* grading */}
      {phase === "grading" ? (
        <div style={{ ...card, marginTop: 18, textAlign: "center", padding: "38px 22px" }}>
          <div className="speak-spin" aria-hidden style={{ width: 34, height: 34, margin: "0 auto", border: `3px solid ${TINT}`, borderTopColor: INDIGO, borderRadius: "50%" }} />
          <style>{`.speak-spin{animation:speakspin 1s linear infinite}@keyframes speakspin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, marginTop: 14 }}>The examiner is grading your answer…</div>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: MUTED }}>
            Transcribing, measuring your delivery, and scoring each criterion with evidence.
            Usually under a minute — please keep this tab open.
          </p>
        </div>
      ) : null}

      {/* report */}
      {phase === "report" && report ? (
        <div style={{ marginTop: 18 }}>
          <SpeakingReport
            result={{ ...report.result, cue_card: report.result.cue_card ?? report.cue_card }}
            metrics={report.metrics}
            transcript={report.transcript}
            audioUrl={report.audio_url}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button type="button" onClick={reset} style={primaryBtn}>
              Practice again
            </button>
            <Link href={`/speak/results/${report.attempt_id}`} style={{ ...ghostBtn, textDecoration: "none" }}>
              Full report page
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
