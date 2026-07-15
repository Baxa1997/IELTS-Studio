"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { LiveMock } from "./live-mock";
import { SpeakingReport, type SpeakMetrics, type SpeakResult } from "./report";

/**
 * Speaking practice (BETA) — Part 2 push-to-talk. One calm mic-first flow:
 * cue card → 60s prep (notes allowed) → record up to 2:00 → conservative
 * graded report. Audio is captured as 16k mono WAV in the browser (AudioWorklet)
 * and uploaded raw to the engine; no model is ever called from the client.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const INDIGO = "#4338CA";
const TINT = "#EFEEFC";
const LINE = "#E8E6F0";
const RED = "#b91c1c";

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

export function SpeakingClient() {
  const [mode, setMode] = useState<"part2" | "full">("part2");
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
        body: JSON.stringify(difficulty ? { difficulty } : {}),
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

  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 860, margin: "0 auto", padding: "26px 18px 60px" }}>
      {/* header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 30, fontWeight: 600 }}>
          Speaking{" "}
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: INDIGO, background: TINT, borderRadius: 999, padding: "4px 10px", verticalAlign: "middle" }}>
            BETA
          </span>
        </h1>
        {phase !== "idle" && mode === "part2" ? (
          <button type="button" onClick={reset} style={{ ...ghostBtn, height: 34, fontSize: 13 }}>
            Exit practice
          </button>
        ) : null}
      </div>

      {/* mode selector — Part-2 quick practice vs. the live full mock */}
      {phase === "idle" ? (
        <div style={{ display: "flex", gap: 6, marginTop: 16, padding: 5, background: "#F5F4FB", border: `1px solid ${LINE}`, borderRadius: 12, maxWidth: 460 }}>
          {([
            ["part2", "Quick practice", "Part 2 · ~4 min"],
            ["full", "Full mock", "Parts 1–3 · live examiner"],
          ] as const).map(([m, label, sub]) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setError(null);
                setMode(m);
              }}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                background: mode === m ? "#fff" : "transparent",
                boxShadow: mode === m ? "0 1px 3px rgba(28,27,46,.12)" : "none",
                fontFamily: SANS,
              }}
            >
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: mode === m ? INK : MUTED }}>{label}</span>
              <span style={{ display: "block", fontSize: 11.5, color: MUTED }}>{sub}</span>
            </button>
          ))}
        </div>
      ) : null}

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

      {/* full mock — its own live-examiner flow */}
      {mode === "full" ? <LiveMock onExit={() => setMode("part2")} /> : null}

      {/* idle hub (Part 2) */}
      {mode === "part2" && (phase === "idle" || phase === "starting") ? (
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
            Part 1 &amp; Part 3 with a live AI examiner are coming next. AI-estimated bands — not
            affiliated with or endorsed by IELTS®.
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
