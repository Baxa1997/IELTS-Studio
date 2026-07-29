"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { WORKLET_SRC } from "./audio";
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
// Mock test leads, per the design: the exam is the promise, the tutor is one
// tap away. Order here is the order on screen.
const TAB: Record<Tab, { label: string }> = {
  mock: { label: "Mock test" },
  tutor: { label: "Tutor" },
  progress: { label: "Progress" },
};

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

interface Allowance {
  used: number;
  limit: number;
  resetsAt: string;
}

// The tutor purposes, as the hub's picker shows them. Mirrors the engine's
// registry (speaking/prompts.py PURPOSES) — the room reads the live catalogue
// from the socket, but this screen has no socket, so it carries labels only.
const HUB_PURPOSES = [
  { id: "general", label: "General English", mark: "G", room: "Open conversation", length: "10–20 min", accent: "#8456EF" },
  { id: "everyday", label: "Everyday situations", mark: "E", room: "Role-play", length: "10 min", accent: "#DA7756" },
  { id: "presWork", label: "Presentation for work", mark: "P", room: "Stage", length: "15–20 min", accent: "#7144D8" },
  { id: "presGeneral", label: "Presentation practice", mark: "S", room: "Stage", length: "15 min", accent: "#5E34BF" },
  { id: "interview", label: "Work interview", mark: "I", room: "Interview room", length: "20 min", accent: "#3B82F6" },
  { id: "ielts", label: "IELTS coaching", mark: "B", room: "Coached exam", length: "20 min", accent: "#22C55E" },
  { id: "friends", label: "Talking with friends", mark: "F", room: "Café", length: "10 min", accent: "#F09070" },
];

export function SpeakingClient({
  initialCardId = null,
  progress = [],
  recentMocks = [],
  allowance,
}: {
  initialCardId?: string | null;
  progress?: SpeakProgressItem[];
  recentMocks?: { id: string; t: string; band: number; who?: string | null }[];
  // The hub has no lessons section in the design, so this is accepted and
  // ignored rather than dropped from the page's query — the tutor's own
  // history screen still wants it.
  recentLessons?: Lesson[];
  allowance?: Allowance;
}) {
  // Two things to do here — sit the exam, or have a lesson — plus somewhere to
  // see how it is going. Part-2 quick practice was retired from the hub; it
  // stays reachable ONLY via ?card= so the "practise this card again" buttons
  // on older reports do not dead-end.
  const legacyPart2 = Boolean(initialCardId);
  // Mock test leads, per the design. An earlier build made the tutor the front
  // door; the design puts the exam first and the tutor one tap away, which is
  // the right order for a product whose promise is a calibrated band.
  const [tab, setTab] = useState<Tab>("mock");
  // Which purpose the tutor tab's picker has selected. Carried to the room in
  // the URL; the room remembers it and it stays changeable mid-lesson.
  const [purpose, setPurpose] = useState("general");
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
  }, [difficulty, initialCardId, record]);

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

  // ---- the hub (Speaking.dc.html, 1:1) --------------------------------------
  // The legacy Part-2 flow (reached only via ?card= from old report links) keeps
  // its original look below; only the hub gets the design.
  if (!legacyPart2) {
    // The design's mock accent is the ink, not the violet — the violet is
    // reserved for the BETA badge and links, so the exam reads as serious.
    const A = "#1A1520";
    const aTint = "rgba(26,21,32,0.08)";
    const bandChip = (b: number) =>
      b >= 6
        ? { bg: "#EAF7EE", fg: "#15803D" }
        : b >= 5
          ? { bg: "#FEF6E7", fg: "#B45309" }
          : { bg: "#F5F2F0", fg: "#5C5460" };
    const kicker: React.CSSProperties = {
      fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.1em", color: "#8C7F8A",
    };
    // On a WHITE page a cream card is invisible, so the surfaces are white and
    // the separation comes from the border; only recessed things (table rows,
    // the tab track) carry a tint.
    const card: React.CSSProperties = {
      background: "#FFFFFF", border: "1px solid #E7E3E0", borderRadius: 18, padding: 22,
    };
    const chip: React.CSSProperties = {
      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
      background: "#FFFFFF", border: "1px solid #E7E3E0", borderRadius: 999,
      whiteSpace: "nowrap",
    };
    // A comped org (engine quota.py UNLIMITED_FULL_MOCK_ORGS) is invisible from
    // here — but the gate FAILS CLOSED, so having sat more mocks than the plan
    // allows proves it was never applied. That is the only way `used > limit`
    // can happen, and it used to render as the nonsense "0 / 8 left · 32 of 8
    // used" (owner screenshot, 2026-07-29).
    const unlimited = Boolean(allowance && allowance.used > allowance.limit);
    const mocksLeft = allowance ? Math.max(0, allowance.limit - allowance.used) : null;
    // en-GB explicitly: the interface is in English, and the browser locale was
    // rendering "29 июля" next to "Best band so far".
    const resetLabel = allowance
      ? new Date(allowance.resetsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
      : null;
    const dayMonth = (t: string) =>
      new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "long" });

    return (
      <LucidaScope className="lucida-fill" style={{ background: "#FFFFFF", color: "#1A1520" }}>
        {/* Fills the window instead of growing past it: the header and tabs are
            fixed, and only the active panel scrolls — and then only when it
            genuinely does not fit. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "clamp(20px, 3vh, 36px) clamp(24px, 5vw, 64px) 32px" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto" }}>

            {/* header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>Speaking</h1>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", padding: "5px 10px", borderRadius: 999, background: "#F4EEFF", color: "#7144D8", border: "1px solid #E4D5FF" }}>BETA</span>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: "#5C5460", maxWidth: 600 }}>
                  A strict exam simulation that scores you, or a tutor who teaches while you talk.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {allowance ? (
                  <div style={chip}>
                    {unlimited ? (
                      <span style={{ fontSize: 12, color: "#5C5460" }}>Unlimited mocks</span>
                    ) : (
                      <>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "#1A1520", fontVariantNumeric: "tabular-nums" }}>
                          {mocksLeft} / {allowance.limit}
                        </span>
                        <span style={{ fontSize: 12, color: "#8C7F8A" }}>mocks left this month</span>
                      </>
                    )}
                  </div>
                ) : null}
                <div style={chip}>
                  <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
                  <span style={{ fontSize: 12, color: "#5C5460" }}>Microphone ready</span>
                </div>
              </div>
            </div>

            {/* tabs */}
            <div style={{ marginTop: 26, display: "inline-flex", padding: 4, gap: 4, background: "#F2EEEC", borderRadius: 999 }}>
              {(Object.keys(TAB) as Tab[]).map((id) => {
                const on = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    style={{
                      appearance: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                      padding: "10px 22px", borderRadius: 999, fontSize: 14, fontWeight: 600,
                      whiteSpace: "nowrap",
                      background: on ? "#FBF8F7" : "transparent",
                      color: on ? "#1A1520" : "#5C5460",
                      boxShadow: on ? "0 1px 3px rgba(26,21,32,0.12)" : "none",
                    }}
                  >
                    {TAB[id].label}
                  </button>
                );
              })}
            </div>

            {/* ── MOCK ── */}
            {tab === "mock" ? (
              <div className="lc-hub-grid" style={{ marginTop: 22 }}>
                <div style={{ ...card, borderRadius: 20, padding: 30, boxShadow: "0 1px 2px rgba(26,21,32,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <span style={{ ...kicker, color: A }}>FULL MOCK · PARTS 1–3</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "5px 10px", borderRadius: 999, background: "#F5F2F0", border: "1px solid #E7E3E0", color: "#5C5460", whiteSpace: "nowrap" }}>11–14 MIN</span>
                  </div>
                  <h2 style={{ margin: "12px 0 0", fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                    Exam-day conditions, start to finish
                  </h2>
                  <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: "#5C5460", maxWidth: 560 }}>
                    The examiner asks, listens and moves on. No hints, no questions in advance, and your
                    examiner is assigned at random — then a conservative band against the official descriptors.
                  </p>

                  <div style={{ marginTop: 22, border: "1px solid #E7E3E0", borderRadius: 14, overflow: "hidden" }}>
                    {([
                      ["1", "Interview", "Familiar questions about you, your home, your work or studies.", "4–5 min"],
                      ["2", "Long turn", "A cue card, one minute to prepare, then you speak for two.", "3–4 min"],
                      ["3", "Discussion", "Abstract questions that push your ideas and your language.", "4–5 min"],
                    ] as const).map(([n, title, desc, time], i) => (
                      <div key={n} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: 16, alignItems: "center", padding: "15px 18px", background: "#FAF9F8", borderTop: i ? "1px solid #E7E3E0" : "none" }}>
                        <span style={{ width: 30, height: 30, borderRadius: 9, background: aTint, color: A, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>{n}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
                          <div style={{ marginTop: 2, fontSize: 13, color: "#8C7F8A" }}>{desc}</div>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#5C5460", whiteSpace: "nowrap" }}>{time}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {["Random examiner", "No hints or teaching", "All four criteria"].map((t) => (
                        <span key={t} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5C5460" }}>
                          <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: "#DA7756" }} />
                          {t}
                        </span>
                      ))}
                    </div>
                    <Link href="/speak/exam" className="lc-btn" style={{ padding: "14px 26px", borderRadius: 12, background: A, color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(26,21,32,0.28)" }}>
                      Start mock test&nbsp; →
                    </Link>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {allowance ? (
                    <div style={card}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#8C7F8A" }}>THIS MONTH</div>
                      <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{allowance.used}</span>
                        <span style={{ fontSize: 14, color: "#8C7F8A" }}>
                          {unlimited ? "mocks this month" : `of ${allowance.limit} mocks used`}
                        </span>
                      </div>
                      {unlimited ? null : (
                        <div style={{ marginTop: 14, height: 6, borderRadius: 999, background: "#EFEAE7", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, allowance.limit ? (allowance.used / allowance.limit) * 100 : 0)}%`, height: "100%", background: A, borderRadius: 999 }} />
                        </div>
                      )}
                      <div style={{ marginTop: unlimited ? 12 : 10, fontSize: 12, color: "#8C7F8A" }}>
                        {unlimited
                          ? "Your account has no mock limit. Tutor lessons are unlimited too."
                          : `Allowance resets ${resetLabel}. Tutor lessons are unlimited.`}
                      </div>
                    </div>
                  ) : null}

                  <div style={card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#8C7F8A" }}>RECENT MOCKS</span>
                      <button type="button" onClick={() => setTab("progress")} style={{ appearance: "none", border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: "#8456EF" }}>
                        All results
                      </button>
                    </div>
                    {recentMocks.length ? (
                      <>
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column" }}>
                          {recentMocks.map((m) => {
                            const hue = bandChip(m.band);
                            return (
                              <Link key={m.id} href={`/speak/results/${m.id}`} className="lc-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center", padding: "13px 8px", borderBottom: "1px solid #EFEBE9", borderRadius: 8, textDecoration: "none", color: "inherit" }}>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 600 }}>{dayMonth(m.t)}</div>
                                  {m.who ? <div style={{ marginTop: 2, fontSize: 12, color: "#8C7F8A" }}>with {m.who}</div> : null}
                                </div>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, padding: "5px 10px", borderRadius: 8, background: hue.bg, color: hue.fg }}>
                                  {m.band.toFixed(1)}
                                </span>
                                <span aria-hidden style={{ color: "#A89AA4", fontSize: 14 }}>→</span>
                              </Link>
                            );
                          })}
                        </div>
                        {bestBand != null ? (
                          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: "#8C7F8A" }}>Best band so far</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{bestBand.toFixed(1)}</span>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.6, color: "#8C7F8A" }}>
                        No mocks yet. Your first band appears here the moment one is graded.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── TUTOR ── */}
            {tab === "tutor" ? (
              <div style={{ marginTop: 22, ...card, borderRadius: 20, padding: 30, boxShadow: "0 1px 2px rgba(26,21,32,0.04)" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 28, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ ...kicker, color: "#C0603E" }}>LIVE LESSON · NEVER SCORED</span>
                    <h2 style={{ margin: "10px 0 0", fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                      Pick what you are practising for
                    </h2>
                    <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.6, color: "#5C5460", maxWidth: 560 }}>
                      The room, the questions and the coaching change with your goal. Your tutor is matched for you.
                    </p>
                  </div>
                  <Link href={`/speak/tutor?kind=${purpose}`} className="lc-btn" style={{ padding: "14px 26px", borderRadius: 12, background: "#DA7756", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(218,119,86,0.28)" }}>
                    Continue&nbsp; →
                  </Link>
                </div>

                <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))", gap: 10 }}>
                  {HUB_PURPOSES.map((p) => {
                    const on = purpose === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPurpose(p.id)}
                        aria-pressed={on}
                        className="lc-card-tap"
                        style={{
                          textAlign: "left", appearance: "none", cursor: "pointer", fontFamily: "inherit",
                          border: `1px solid ${on ? p.accent : "#E7E3E0"}`, background: "#FAF9F8",
                          borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                          boxShadow: on ? "0 0 0 3px rgba(26,21,32,0.05)" : "none",
                        }}
                      >
                        <span aria-hidden style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", flex: "0 0 28px", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, background: on ? `${p.accent}1F` : "#F5F2F0", color: on ? p.accent : "#8C7F8A" }}>
                          {p.mark}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</span>
                          <span style={{ display: "block", marginTop: 2, fontSize: 11, color: "#A89AA4" }}>{p.room} · {p.length}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid #EFEBE9", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
                  {([
                    ["Corrects the mistake that matters", "One fix per turn, not a list."],
                    ["Hands you a stronger sentence", "Then asks you to use it straight away."],
                    ["Explains in your language", "O‘zbekcha or ruscha — you still answer in English."],
                  ] as const).map(([title, blurb]) => (
                    <div key={title}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "#8C7F8A", lineHeight: 1.5 }}>{blurb}</div>
                    </div>
                  ))}
                </div>

              </div>
            ) : null}

            {/* ── PROGRESS ── */}
            {tab === "progress" ? (
              <div className="lc-hub-grid" style={{ marginTop: 22 }}>
                <div style={{ ...card, borderRadius: 20, padding: 28 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#8C7F8A" }}>
                    BAND TREND · LAST SIX MOCKS
                  </div>
                  {graded.length ? (
                    <div style={{ marginTop: 24, display: "flex", alignItems: "flex-end", gap: 18, height: 180 }}>
                      {graded.slice(-6).map((g, i) => (
                        <div key={`${g.t}-${i}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 10, height: "100%" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "#5C5460" }}>{g.band.toFixed(1)}</span>
                          <div style={{ width: "100%", borderRadius: "8px 8px 0 0", height: `${Math.max(8, (g.band / 9) * 100)}%`, background: g.band >= 6.5 ? "#8456EF" : g.band >= 5.5 ? "#C8AAFF" : "#DDD2F9" }} />
                          <span style={{ fontSize: 11, color: "#A89AA4", whiteSpace: "nowrap" }}>{dayMonth(g.t)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.6, color: "#8C7F8A" }}>
                      Nothing graded yet. Sit a mock and your band trend starts here.
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={card}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#8C7F8A" }}>BY CRITERION</div>
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                      {skillRows.map((r) => (
                        <div key={r.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ fontWeight: 600 }}>{r.label}</span>
                            <span style={{ fontFamily: "var(--font-mono)", color: "#5C5460" }}>{r.v == null ? "—" : r.v.toFixed(1)}</span>
                          </div>
                          <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: "#EFEAE7", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 999, background: A, width: `${r.v == null ? 0 : (r.v / 9) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={card}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#8C7F8A" }}>RECURRING FIXES</div>
                    {/* Honest placeholder: naming the patterns that repeat ACROSS
                        mocks needs cross-session aggregation of the grader's
                        error log, which does not exist yet. Inventing three
                        plausible lines here would be the one thing a learner
                        cannot check and must not be lied to about. */}
                    <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.6, color: "#8C7F8A" }}>
                      Coming soon — the patterns that keep costing you marks across mocks, counted.
                      For now, each mock report lists what capped that band.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
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
