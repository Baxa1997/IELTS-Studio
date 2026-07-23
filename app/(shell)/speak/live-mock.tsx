"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { ConfirmQuit } from "./confirm-quit";
import { LucidaScope, PERSONAS, PersonaAvatar, personaById, WaveBars, mmss, type Persona } from "./lucida";

/**
 * Full mock (Parts 1–3) — the LIVE examiner. A bidirectional WebSocket to the
 * engine: the browser streams 16 kHz mic PCM up, the engine streams the examiner's
 * 24 kHz voice + phase events back. The ENGINE owns the exam (part order, the prep
 * minute, the 2:00 cut, the 16-min cap) — this client just captures audio, plays
 * the examiner, and renders the room. No model is ever called from here.
 */

const IN_RATE = 16000;

interface CueCard {
  title: string;
  bullets: string[];
  closing: string;
}
type Phase =
  | "idle" | "instructions" | "connecting" | "greeting" | "part1"
  | "part2_card" | "part2_prep" | "part2_speak" | "part2_round"
  | "part3" | "closing" | "ended" | "error";

// The four examiners are the shared Lucida PERSONAS (which mirror the engine's
// speaking/live.py PERSONAS — id must match). Their mock trait/desc come from
// persona.mockTrait / persona.mockDesc.

const LEVELS = [
  { v: null, label: "Any" },
  { v: 1, label: "1" },
  { v: 2, label: "2" },
  { v: 3, label: "3" },
  { v: 4, label: "4" },
  { v: 5, label: "5" },
] as const;

interface PhaseEvent {
  type: "part" | "cue_card" | "prep" | "long_turn";
  part: number;
  label?: string;
  card?: CueCard;
  seconds?: number;
}

// ---- examiner voice playback (24 kHz PCM16 → scheduled AudioBuffers) ---------
// Tracks REAL playback: the engine must not open the mic until the candidate has
// actually heard the examiner finish (generation runs far ahead of playback), so
// we report `onDrained` when the scheduled queue empties and the engine waits for
// our {type:"played"} before treating the turn as over.

class VoicePlayer {
  private ctx: AudioContext;
  private next = 0;
  private liveSources = 0;
  onPlaying: ((on: boolean) => void) | null = null;
  onDrained: (() => void) | null = null;
  constructor(private rate = 24000) {
    this.ctx = new AudioContext();
  }
  resume() {
    void this.ctx.resume();
  }
  get busy(): boolean {
    return this.liveSources > 0;
  }
  push(pcm: ArrayBuffer) {
    const i16 = new Int16Array(pcm);
    if (!i16.length) return;
    const buf = this.ctx.createBuffer(1, i16.length, this.rate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < i16.length; i++) ch[i] = i16[i] / 32768;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    if (this.liveSources === 0) this.onPlaying?.(true);
    this.liveSources += 1;
    src.onended = () => {
      this.liveSources -= 1;
      if (this.liveSources === 0) {
        this.onPlaying?.(false);
        this.onDrained?.();
      }
    };
    const t = Math.max(this.ctx.currentTime + 0.06, this.next);
    src.start(t);
    this.next = t + buf.duration;
  }
  close() {
    void this.ctx.close();
  }
}

// ---- mic capture → 16 kHz PCM16 chunks --------------------------------------

const WORKLET_SRC = `
class Tap extends AudioWorkletProcessor {
  process(inputs){ const ch = inputs[0]?.[0]; if (ch) this.port.postMessage(ch.slice(0)); return true; }
}
registerProcessor("mock-tap", Tap);`;

interface Mic {
  stop: () => void;
  onLevel: (cb: (rms: number) => void) => void;
}

async function startMic(sink: (pcm16: ArrayBuffer) => void): Promise<Mic> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(
    URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" })),
  );
  const src = ctx.createMediaStreamSource(stream);
  const tap = new AudioWorkletNode(ctx, "mock-tap");
  src.connect(tap);

  const ratio = ctx.sampleRate / IN_RATE; // e.g. 48000/16000 = 3
  let frac = 0; // fractional read cursor carried across chunks
  let levelCb: ((rms: number) => void) | null = null;

  tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
    const input = e.data;
    if (levelCb) {
      let s = 0;
      for (let i = 0; i < input.length; i++) s += input[i] * input[i];
      levelCb(Math.sqrt(s / input.length));
    }
    // linear-resample to 16 kHz
    const out: number[] = [];
    for (; frac < input.length; frac += ratio) {
      const i = Math.floor(frac);
      const a = input[i] ?? 0;
      const b = input[i + 1] ?? a;
      out.push(a + (b - a) * (frac - i));
    }
    frac -= input.length;
    const pcm = new Int16Array(out.length);
    for (let i = 0; i < out.length; i++) {
      const v = Math.max(-1, Math.min(1, out[i]));
      pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    if (pcm.length) sink(pcm.buffer);
  };

  return {
    onLevel: (cb) => {
      levelCb = cb;
    },
    stop: () => {
      tap.port.onmessage = null;
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}

function wsUrl(session_id: string, token: string, examiner: string): string {
  const base = clientEnv.aiBackendUrl ?? "";
  const ws = base.replace(/^http/, "ws"); // https→wss, http→ws
  const q = new URLSearchParams({ session_id, token, examiner });
  return `${ws}/speaking/live?${q.toString()}`;
}

export function LiveMock({
  onExit,
  onRunning,
}: {
  onExit: () => void;
  /** True while a test is in progress (the hub hides its chrome). */
  onRunning?: (running: boolean) => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [examiner, setExaminer] = useState<Persona["id"]>("emily");
  const [level, setLevel] = useState<number | null>(null);
  const [part, setPart] = useState(1);
  const [card, setCard] = useState<CueCard | null>(null);
  const [notes, setNotes] = useState("");
  const [clock, setClock] = useState<number | null>(null); // prep / long-turn countdown
  const [examinerSpeaking, setExaminerSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [endedBand, setEndedBand] = useState<number | null>(null);
  const [grading, setGrading] = useState(false); // exam over, report being written
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0); // whole-test clock (top bar)
  const [confirmExit, setConfirmExit] = useState(false); // quit needs a real confirmation

  const wsRef = useRef<WebSocket | null>(null);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micRef = useRef<Mic | null>(null);
  const playerRef = useRef<VoicePlayer | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // playback sync: turn_end arrived but audio is still playing → report when drained
  const pendingPlayedRef = useRef<{ seq: number | null } | null>(null);

  const stopClock = () => {
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = null;
  };
  const runClock = useCallback((seconds: number) => {
    stopClock();
    setClock(seconds);
    clockRef.current = setInterval(() => {
      setClock((c) => {
        if (c == null || c <= 1) {
          stopClock();
          return c == null ? null : 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const teardown = useCallback(() => {
    stopClock();
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    elapsedRef.current = null;
    try {
      wsRef.current?.close();
    } catch {}
    micRef.current?.stop();
    playerRef.current?.close();
    wsRef.current = null;
    micRef.current = null;
    playerRef.current = null;
  }, []);

  const startElapsed = useCallback(() => {
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    const t0 = Date.now();
    setElapsed(0);
    elapsedRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - t0) / 1000)),
      1000,
    );
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  useEffect(() => {
    onRunning?.(phase !== "idle" && phase !== "instructions");
  }, [phase, onRunning]);

  // Closing the tab or hitting back mid-test spends the mock just as surely as
  // the Exit button does, so the browser gets to warn about it too.
  const testLive = phase !== "idle" && phase !== "instructions" && phase !== "ended";
  useEffect(() => {
    if (!testLive) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [testLive]);

  // The exam room takes over the whole viewport; freeze the page behind it.
  const roomOpen =
    phase !== "idle" && phase !== "instructions" && phase !== "ended" && phase !== "error";
  useEffect(() => {
    if (!roomOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [roomOpen]);

  // Band fallback: grading takes ~30–60s and the `ended` event rides a socket
  // that may die in that window — a lost event once left a graded 6.0 sitting
  // in the DB behind an eternal spinner. Poll the session row (RLS: own rows)
  // until the band lands, then stop.
  useEffect(() => {
    if (phase !== "ended" || endedBand != null || !sessionId) return;
    const supabase = createClient();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const t0 = Date.now();
    const tick = async () => {
      if (stopped) return;
      const { data } = await supabase
        .from("speaking_sessions")
        .select("state,result")
        .eq("id", sessionId)
        .maybeSingle();
      if (stopped) return;
      const band = (data?.result as { overall_band?: number } | null)?.overall_band;
      if (typeof band === "number") {
        setEndedBand(band);
        setGrading(false);
        return;
      }
      if (data?.state && data.state !== "pending" && data.state !== "live" && data.state !== "grading"
          && Date.now() - t0 > 30_000) {
        setGrading(false); // terminal state without a band — stop spinning
        return;
      }
      if (Date.now() - t0 < 4 * 60_000) timer = setTimeout(tick, 5000);
      else setGrading(false);
    };
    timer = setTimeout(tick, 4000);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [phase, endedBand, sessionId]);

  const onEvent = useCallback(
    (m: Record<string, unknown>) => {
      switch (m.type) {
        case "ready":
          setSessionId(String(m.session_id ?? ""));
          startElapsed();
          break;
        case "phase": {
          setPhase(String(m.phase) as Phase);
          if (typeof m.part === "number") setPart(m.part);
          const ev = m.event as PhaseEvent | null;
          if (ev?.type === "cue_card" && ev.card) setCard(ev.card);
          if (ev?.type === "prep" && ev.seconds) runClock(ev.seconds);
          else if (ev?.type === "long_turn" && ev.seconds) runClock(ev.seconds);
          else if (String(m.phase) !== "part2_prep" && String(m.phase) !== "part2_speak") {
            stopClock();
            setClock(null);
          }
          break;
        }
        case "examiner":
          // generation state only — the speaking ANIMATION follows real playback
          // (player.onPlaying); nothing to do here.
          break;
        case "turn_end": {
          // The engine finished generating this turn; tell it when the candidate
          // has actually HEARD it (queue drained), so the floor opens in sync.
          const seq = typeof m.seq === "number" ? m.seq : null;
          if (playerRef.current?.busy) {
            pendingPlayedRef.current = { seq };
          } else {
            wsRef.current?.send(JSON.stringify({ type: "played", seq }));
          }
          break;
        }
        case "listening":
          setListening(Boolean(m.on));
          break;
        case "your_turn":
          setListening(true);
          break;
        case "grading":
          // The exam is over; the engine is grading (~30–40s). Leave the exam
          // room immediately — sitting in a silent room with a dead mic is
          // exactly the "cannot finish" experience. Keep the socket: the
          // `ended` event (with the band) still arrives on it.
          setGrading(true);
          setPhase("ended");
          stopClock();
          if (elapsedRef.current) clearInterval(elapsedRef.current);
          elapsedRef.current = null;
          micRef.current?.stop();
          micRef.current = null;
          playerRef.current?.close();
          playerRef.current = null;
          break;
        case "ended":
          setEndedBand(typeof m.overall_band === "number" ? m.overall_band : null);
          setGrading(false);
          setPhase("ended");
          teardown();
          break;
        case "error":
          setError(String(m.message ?? m.error ?? "The session failed."));
          setPhase("error");
          teardown();
          break;
      }
    },
    [runClock, teardown, startElapsed],
  );

  const begin = useCallback(async () => {
    setError(null);
    setPhase("connecting");
    try {
      // 1. reserve the session (plan-gated) over plain HTTP → clean 402/429
      const supabase = createClient();
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Your session expired — please sign in again.");
      const backend = clientEnv.aiBackendUrl;
      if (!backend) throw new Error("AI backend isn't configured.");

      const res = await fetch(`${backend}/speaking/full/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(level ? { difficulty: level } : {}),
      });
      const body = (await res.json().catch(() => ({}))) as {
        session_id?: string;
        detail?: { message?: string } | string;
      };
      if (!res.ok) {
        const d = typeof body.detail === "string" ? body.detail : body.detail?.message;
        throw new Error(d ?? `Couldn't start (${res.status}).`);
      }
      const sid = body.session_id!;
      setSessionId(sid);

      // 2. audio in/out, then the socket
      const player = new VoicePlayer();
      player.resume();
      player.onPlaying = (on) => setExaminerSpeaking(on);
      player.onDrained = () => {
        const pending = pendingPlayedRef.current;
        if (pending) {
          pendingPlayedRef.current = null;
          wsRef.current?.send(JSON.stringify({ type: "played", seq: pending.seq }));
        }
      };
      playerRef.current = player;

      const ws = new WebSocket(wsUrl(sid, token, examiner));
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onmessage = (e) => {
        if (typeof e.data === "string") {
          try {
            onEvent(JSON.parse(e.data));
          } catch {}
        } else {
          playerRef.current?.push(e.data as ArrayBuffer);
        }
      };
      ws.onerror = () => {
        setError("Connection to the examiner dropped.");
        setPhase("error");
        teardown();
      };
      ws.onclose = () => {
        setPhase((p) => (p === "ended" || p === "error" ? p : "ended"));
      };
      ws.onopen = async () => {
        const mic = await startMic((pcm) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(pcm);
        });
        mic.onLevel((rms) => setMicLevel(rms));
        micRef.current = mic;
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the mock.");
      setPhase("error");
      teardown();
    }
  }, [onEvent, teardown, level, examiner]);

  const endEarly = useCallback(() => {
    try {
      wsRef.current?.send(JSON.stringify({ type: "stop" }));
    } catch {}
    // Failsafe: if no ended/grading event lands (dead socket, engine hiccup),
    // leave the room anyway — a stuck exam room is worse than a report that
    // needs one refresh. The report link keeps working either way.
    window.setTimeout(() => {
      setPhase((p) => {
        if (p === "ended" || p === "error" || p === "idle" || p === "instructions") return p;
        setGrading(true);
        return "ended";
      });
    }, 6000);
  }, []);

  // ---- render (Lucida) -------------------------------------------------------

  const quotaHit = error ? /quota|upgrade|plan|Standard|Pro/i.test(error) : false;
  const persona = personaById(examiner);
  const kicker: React.CSSProperties = {
    fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase",
  };
  const backLink = (
    <button
      type="button"
      onClick={onExit}
      className="lc-tab"
      style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--color-neutral-500)", fontFamily: "inherit", fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: 24, padding: 0 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
      Speaking
    </button>
  );

  // PICK — choose your examiner + question level, then a short instructions modal.
  if (phase === "idle" || phase === "instructions") {
    return (
      <LucidaScope style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 40px 64px" }}>
          {backLink}
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-4xl)", color: "var(--color-neutral-1000)", letterSpacing: "var(--ls-snug)", marginBottom: 10 }}>
            Full mock — Parts 1 to 3
          </div>
          <p style={{ fontSize: "var(--text-md)", color: "var(--color-neutral-600)", maxWidth: 680, lineHeight: "var(--lh-relaxed)", margin: "0 0 36px" }}>
            A complete 11–14 minute speaking test with a live examiner. You won’t see the questions in advance — exactly like exam day.
          </p>

          <div style={{ ...kicker, color: "var(--color-neutral-500)", marginBottom: 12 }}>Choose your examiner</div>
          <div className="lc-persona-grid" style={{ marginBottom: 32 }}>
            {PERSONAS.map((p) => {
              const on = p.id === examiner;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setExaminer(p.id)}
                  className="lc-card-tap"
                  style={{
                    textAlign: "left", padding: 22, borderRadius: "var(--radius-xl)", cursor: "pointer",
                    fontFamily: "inherit",
                    border: `1.5px solid ${on ? p.accent : "var(--color-neutral-200)"}`,
                    background: on ? p.tint : "var(--color-neutral-0)",
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: p.accent, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: 14 }}>
                    {p.initial}
                  </div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-neutral-1000)", marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: p.accent, marginBottom: 8 }}>{p.mockTrait}</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", lineHeight: "var(--lh-snug)" }}>{p.mockDesc}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24, borderTop: "1px solid var(--color-neutral-200)", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ ...kicker, color: "var(--color-neutral-500)" }}>Question level</div>
              <div style={{ display: "flex", gap: 8 }}>
                {LEVELS.map((l) => {
                  const on = level === l.v;
                  return (
                    <button
                      key={l.label}
                      type="button"
                      onClick={() => setLevel(l.v)}
                      className="lc-btn"
                      style={{
                        width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit",
                        border: `1.5px solid ${on ? "var(--color-primary-500)" : "var(--color-neutral-200)"}`,
                        color: on ? "var(--color-primary-600)" : "var(--color-neutral-600)",
                        background: on ? "rgba(132,86,239,0.08)" : "var(--color-neutral-0)",
                      }}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhase("instructions")}
              className="lc-btn lc-primary"
              style={{ border: "none", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", fontSize: "var(--text-md)", fontWeight: 600, padding: "16px 28px", borderRadius: "var(--radius-lg)", cursor: "pointer", boxShadow: "var(--shadow-glow-sm)" }}
            >
              Take the mock test →
            </button>
          </div>
        </div>

        {/* instructions modal */}
        {phase === "instructions" ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setPhase("idle")}
            style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, background: "rgba(23,19,28,.55)", backdropFilter: "blur(3px)" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "min(540px, 100%)", maxHeight: "92dvh", overflowY: "auto", background: "var(--color-neutral-0)", borderRadius: "var(--radius-2xl)", padding: "26px 26px 22px", boxShadow: "var(--shadow-3)", color: "var(--color-neutral-1000)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: persona.accent, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)" }}>{persona.initial}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700 }}>Your examiner today is {persona.name}</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)" }}>{persona.mockTrait} · IELTS Speaking format</div>
                </div>
              </div>

              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["1", "Introduction & interview", "4–5 min", `${persona.name} greets you, checks your name, and asks short questions about familiar topics. Answer in 2–4 sentences.`],
                  ["2", "The long turn", "3–4 min", "You get a topic card on screen, one minute to prepare (make notes!), then speak for 1–2 minutes without interruption."],
                  ["3", "Discussion", "4–5 min", "Deeper, more abstract questions linked to your Part 2 topic. This is where higher bands are decided."],
                ].map(([n, t, d, s]) => (
                  <div key={n} style={{ display: "flex", gap: 14, border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-lg)", padding: "12px 14px" }}>
                    <span style={{ flex: "none", width: 28, height: 28, borderRadius: "var(--radius-md)", background: "rgba(132,86,239,0.1)", color: "var(--color-primary-600)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-sm)" }}>{n}</span>
                    <div>
                      <div style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>{t} <span style={{ fontWeight: 400, color: "var(--color-neutral-500)", fontSize: "var(--text-sm)" }}>· {d}</span></div>
                      <div style={{ fontSize: "var(--text-sm)", lineHeight: "var(--lh-normal)", color: "var(--color-neutral-500)", marginTop: 2 }}>{s}</div>
                    </div>
                  </div>
                ))}
              </div>

              <ul style={{ margin: "16px 0 0", paddingLeft: 18, fontSize: "var(--text-sm)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-500)" }}>
                <li><strong style={{ color: "var(--color-neutral-1000)" }}>Wear headphones</strong> in a quiet room — otherwise {persona.name}’s voice echoes into your mic.</li>
                <li>{persona.name} leads the test — just listen and answer naturally. If you talk over the examiner, you’ll be asked to wait, like the real thing.</li>
                <li>The test can’t be paused. It runs about 11–14 minutes and counts as one of your monthly mock tests.</li>
                <li>Your band report (graded conservatively) appears right after the test ends.</li>
              </ul>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setPhase("idle")} className="lc-btn lc-ghost" style={{ padding: "12px 18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-neutral-200)", background: "var(--color-neutral-0)", color: "var(--color-neutral-700)", fontSize: "var(--text-base)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Back
                </button>
                <button type="button" onClick={begin} className="lc-btn lc-primary" style={{ padding: "12px 22px", borderRadius: "var(--radius-lg)", border: "none", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", fontSize: "var(--text-base)", fontWeight: 600, cursor: "pointer", boxShadow: "var(--shadow-glow-sm)", fontFamily: "inherit" }}>
                  I’m ready — begin
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </LucidaScope>
    );
  }

  // ERROR
  if (phase === "error") {
    return (
      <LucidaScope style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 40px" }}>
          {backLink}
          <div style={{ background: "var(--color-error-bg)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "var(--radius-xl)", padding: "20px 22px", color: "var(--color-error)", fontSize: "var(--text-md)", lineHeight: "var(--lh-relaxed)" }}>
            {error}
            {quotaHit ? (
              <>
                {" "}
                <Link href="/pricing" style={{ color: "var(--color-primary-600)", fontWeight: 700 }}>See plans →</Link>
              </>
            ) : null}
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={onExit} className="lc-btn lc-ghost" style={{ padding: "12px 18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-neutral-200)", background: "var(--color-neutral-0)", color: "var(--color-neutral-700)", fontSize: "var(--text-base)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Back to speaking
            </button>
          </div>
        </div>
      </LucidaScope>
    );
  }

  // ENDED — the band reveal (full breakdown lives on the report page).
  if (phase === "ended") {
    return (
      <LucidaScope style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "56px 40px 72px" }}>
          {backLink}
          <div style={{ textAlign: "center", animation: "lcFadeInUp 500ms cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-neutral-500)", marginBottom: 12 }}>
              Your mock with {persona.name} is complete
            </div>
            <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(132,86,239,0.16), transparent 70%)" }} />
              <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: "1px solid var(--color-neutral-200)", background: "var(--color-neutral-0)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                {endedBand != null ? (
                  <>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 60, fontWeight: 700, color: "var(--color-neutral-1000)" }}>{endedBand.toFixed(1)}</div>
                    <div style={{ ...kicker, color: "var(--color-neutral-500)", fontSize: "var(--text-2xs)" }}>Overall band</div>
                  </>
                ) : (
                  <>
                    <div aria-hidden style={{ width: 30, height: 30, border: "3px solid var(--color-neutral-200)", borderTopColor: "var(--color-primary-500)", borderRadius: "50%", animation: "lcSpin .9s linear infinite" }} />
                    <div style={{ ...kicker, color: "var(--color-neutral-500)", fontSize: "var(--text-2xs)", marginTop: 10 }}>Grading</div>
                  </>
                )}
              </div>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", lineHeight: "var(--lh-relaxed)", maxWidth: 420, margin: "20px auto 0" }}>
              {endedBand != null
                ? "Open the full report for the per-criterion breakdown and the examiner’s note."
                : grading
                  ? "The examiner is writing your report — your band appears here in under a minute."
                  : "Your report is being prepared."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            {sessionId ? (
              <button type="button" onClick={() => router.push(`/speak/mock/${sessionId}`)} className="lc-btn lc-primary" style={{ padding: "14px 24px", borderRadius: "var(--radius-lg)", border: "none", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", fontSize: "var(--text-md)", fontWeight: 600, cursor: "pointer", boxShadow: "var(--shadow-glow-sm)", fontFamily: "inherit" }}>
                See full report →
              </button>
            ) : null}
            <button type="button" onClick={onExit} className="lc-btn lc-ghost" style={{ padding: "14px 24px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-neutral-200)", background: "var(--color-neutral-0)", color: "var(--color-neutral-700)", fontSize: "var(--text-md)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Back to speaking
            </button>
          </div>
        </div>
      </LucidaScope>
    );
  }

  // LIVE — the exam room: a full-viewport takeover.
  const inPrep = phase === "part2_prep";
  const inSpeak = phase === "part2_speak";
  const connecting = phase === "connecting";
  const userActive = listening && !examinerSpeaking;
  const status = connecting
    ? `Connecting you with ${persona.name}…`
    : examinerSpeaking
      ? `${persona.name} is speaking`
      : inPrep
        ? "Prepare your answer"
        : listening
          ? `${persona.name} is listening`
          : `${persona.name} is thinking…`;
  const dockText = connecting
    ? "Checking your microphone…"
    : examinerSpeaking
      ? "Listen carefully…"
      : inPrep
        ? "Make notes — your minute is running"
        : listening
          ? inSpeak
            ? "Speak for 1–2 minutes — short thinking pauses are fine"
            : "Your turn — speak naturally"
          : "One moment…";
  const partHint: Record<number, string> = {
    1: "Short questions about you and familiar topics. Answer in 2–4 sentences.",
    2: "Your long turn: one minute to prepare, then speak for 1–2 minutes.",
    3: "A deeper discussion linked to your topic. Develop and justify your opinions.",
  };
  return (
    <LucidaScope
      style={{
        position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column",
        background: `radial-gradient(ellipse 900px 500px at 50% 0%, ${persona.glow}, transparent 70%), var(--color-neutral-0)`,
      }}
    >
      {/* ── top bar ── */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 24px", borderBottom: "1px solid var(--color-neutral-200)" }}>
        <button
          type="button"
          onClick={() => setConfirmExit(true)}
          className="lc-btn lc-ghost"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-neutral-200)", background: "var(--color-neutral-0)", color: "var(--color-neutral-600)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          Exit
        </button>

        <ConfirmQuit
          open={confirmExit}
          title="End the test now?"
          body={
            "This ends your speaking test. Everything you have said so far will be " +
            "graded as a partial test, and the attempt still counts against your " +
            "monthly mocks — you cannot come back to it."
          }
          confirmLabel="End the test"
          cancelLabel="Carry on with the test"
          onCancel={() => setConfirmExit(false)}
          onConfirm={() => {
            setConfirmExit(false);
            endEarly();
          }}
        />

        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "rgba(132,86,239,0.1)", color: "var(--color-primary-600)", fontSize: "var(--text-sm)", fontWeight: 600, whiteSpace: "nowrap" }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-primary-600)", animation: "lcDotPulse 1.4s ease-in-out infinite" }} />
          Part {part} · {PART_LABEL_SHORT[part] ?? ""}
        </span>

        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: "var(--text-md)", fontWeight: 500, color: "var(--color-neutral-1000)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
          {mmss(elapsed)}
        </span>
      </div>
      {/* whole-test progress line (16-min cap) */}
      <div aria-hidden style={{ flex: "none", height: 3, background: "var(--color-neutral-100)" }}>
        <div style={{ height: "100%", width: `${Math.min(100, Math.max(1.5, (elapsed / 960) * 100))}%`, background: "var(--color-primary-500)", transition: "width 1s linear" }} />
      </div>

      {/* ── centre stage ── */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "min(660px, 100%)", margin: "0 auto", padding: "26px 24px 30px", textAlign: "center" }}>
          <div style={{ ...kicker, color: "var(--color-neutral-500)", marginBottom: 20 }}>Examiner</div>
          <PersonaAvatar initial={persona.initial} accent={persona.accent} glow={persona.glow} size={128} ring={examinerSpeaking} />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 4 }}>
            <WaveBars color={persona.accent} active={examinerSpeaking} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-neutral-1000)", marginTop: 8, minHeight: 40 }}>{status}</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", marginTop: 6, minHeight: 20, lineHeight: "var(--lh-relaxed)" }}>
            {connecting ? "This takes a few seconds." : partHint[part]}
          </div>

          {clock != null ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "8px 18px", borderRadius: "var(--radius-pill)", background: inPrep ? "var(--color-warning-bg)" : "rgba(132,86,239,0.08)", border: `1px solid ${inPrep ? "rgba(217,119,6,0.3)" : "rgba(132,86,239,0.25)"}` }}>
              <span style={{ ...kicker, fontSize: "var(--text-2xs)", color: inPrep ? "var(--color-warning)" : "var(--color-primary-600)" }}>
                {inPrep ? "Prep time" : "Speaking"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xl)", fontWeight: 500, color: inPrep ? "var(--color-warning)" : "var(--color-primary-600)", fontVariantNumeric: "tabular-nums" }}>
                {mmss(clock)}
              </span>
            </div>
          ) : null}

          {/* cue card (Part 2) — the paper slip on exam day */}
          {card && part === 2 ? (
            <div style={{ marginTop: 24, textAlign: "left", background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-xl)", padding: "18px 20px 20px", boxShadow: "var(--shadow-2)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(218,119,86,0.12)", color: "var(--color-amber-600)", fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase" }}>
                <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
                Cue card
              </span>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, marginTop: 12, lineHeight: "var(--lh-snug)", color: "var(--color-neutral-1000)" }}>{card.title}</div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-neutral-500)", margin: "12px 0 4px" }}>You should say:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-base)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-800)" }}>
                {card.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div style={{ fontSize: "var(--text-base)", marginTop: 6, color: "var(--color-neutral-800)" }}>{card.closing}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", marginTop: 10, fontStyle: "italic" }}>
                You will have 1–2 minutes to talk about this.
              </div>
              {inPrep || inSpeak ? (
                <textarea
                  value={notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNotes(v);
                    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
                    notesTimerRef.current = setTimeout(() => {
                      try {
                        wsRef.current?.send(JSON.stringify({ type: "notes", text: v.slice(0, 2000) }));
                      } catch {}
                    }, 800);
                  }}
                  placeholder="Your notes (saved into your report — only you can see them)…"
                  style={{ width: "100%", marginTop: 12, minHeight: 76, resize: "vertical", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-md)", padding: 10, fontFamily: "inherit", fontSize: "var(--text-sm)", color: "var(--color-neutral-1000)", background: "var(--color-neutral-50)" }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── YOU dock ── */}
      <div style={{ flex: "none", borderTop: "1px solid var(--color-neutral-200)", background: "rgba(251,248,246,0.85)", backdropFilter: "blur(16px)", padding: "20px 24px calc(24px + env(safe-area-inset-bottom))" }}>
        <div style={{ width: "min(660px, 100%)", margin: "0 auto", textAlign: "center" }}>
          <div style={{ ...kicker, color: "var(--color-neutral-500)", marginBottom: 12 }}>You</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 10 }}>
            <span
              aria-hidden
              style={{
                position: "relative", display: "inline-flex", width: 48, height: 48, borderRadius: "50%",
                alignItems: "center", justifyContent: "center",
                background: userActive ? "var(--color-primary-500)" : "var(--color-neutral-200)",
                color: userActive ? "#FFFFFF" : "var(--color-neutral-600)",
                // ring always tracks the mic so a too-quiet voice still shows life
                boxShadow:
                  micLevel > 0.004 && !examinerSpeaking
                    ? `0 0 0 ${3 + Math.min(1, micLevel * 26) * 9}px ${userActive ? "rgba(132,86,239,0.16)" : "rgba(132,86,239,0.08)"}`
                    : "none",
                transition: "background .2s, box-shadow .1s",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" /></svg>
            </span>
            <WaveBars color="var(--color-primary-400)" active={userActive} height={24} />
          </div>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-neutral-1000)" }}>{dockText}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-400)", marginTop: 6 }}>
            Original AI examiner · not affiliated with IELTS®
          </div>
        </div>
      </div>
    </LucidaScope>
  );
}

const PART_LABEL_SHORT: Record<number, string> = {
  1: "Interview",
  2: "Long turn",
  3: "Discussion",
};
