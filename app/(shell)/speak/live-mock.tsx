"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

/**
 * Full mock (Parts 1–3) — the LIVE examiner. A bidirectional WebSocket to the
 * engine: the browser streams 16 kHz mic PCM up, the engine streams the examiner's
 * 24 kHz voice + phase events back. The ENGINE owns the exam (part order, the prep
 * minute, the 2:00 cut, the 16-min cap) — this client just captures audio, plays
 * the examiner, and renders the room. No model is ever called from here.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const INDIGO = "#4338CA";
const TINT = "#EFEEFC";
const LINE = "#E8E6F0";
const RED = "#b91c1c";

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

// Mirrors the engine's PERSONAS (speaking/live.py) — id must match.
const EXAMINERS = [
  { id: "emily", name: "Emily", tag: "Warm & encouraging", hue: "#B85C8A", desc: "Puts nervous candidates at ease. Clear, friendly pace." },
  { id: "daniel", name: "Daniel", tag: "Calm & formal", hue: "#4338CA", desc: "The classic exam-room examiner. Measured and neutral." },
  { id: "sofia", name: "Sofia", tag: "Friendly & patient", hue: "#0F766E", desc: "Easy-going rhythm with time to think." },
  { id: "james", name: "James", tag: "Brisk & precise", hue: "#B45309", desc: "Keeps the pace up — good exam-day pressure training." },
] as const;

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

const PART_LABEL: Record<number, string> = {
  1: "Part 1 — Introduction & interview",
  2: "Part 2 — The long turn",
  3: "Part 3 — Discussion",
};

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
  const [examiner, setExaminer] = useState<(typeof EXAMINERS)[number]["id"]>("emily");
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
  const [exitArmed, setExitArmed] = useState(false); // two-tap exit guard

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

  // ---- render ----------------------------------------------------------------

  const quotaHit = error ? /quota|upgrade|plan|Standard|Pro/i.test(error) : false;

  if (phase === "idle" || phase === "instructions") {
    const chosen = EXAMINERS.find((e) => e.id === examiner) ?? EXAMINERS[0];
    return (
      <div style={{ marginTop: 18 }}>
        {/* setup: pick your examiner */}
        <div style={{ ...card_, padding: "22px 20px" }}>
          <div style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600 }}>Full mock — Parts 1 to 3</div>
          <p style={{ margin: "6px 0 16px", fontSize: 13.5, lineHeight: 1.55, color: MUTED }}>
            A complete 11–14 minute speaking test with a live examiner. You won&rsquo;t see the
            questions in advance — exactly like exam day.
          </p>

          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".07em", color: MUTED, textTransform: "uppercase", marginBottom: 8 }}>
            Choose your examiner
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 10 }}>
            {EXAMINERS.map((e) => {
              const on = e.id === examiner;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setExaminer(e.id)}
                  style={{
                    textAlign: "left",
                    border: `2px solid ${on ? e.hue : LINE}`,
                    background: on ? `${e.hue}0D` : "#fff",
                    borderRadius: 14,
                    padding: "14px 14px 12px",
                    cursor: "pointer",
                    fontFamily: SANS,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 35% 30%, ${e.hue}CC, ${e.hue})`,
                      color: "#fff",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {e.name[0]}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: INK, marginTop: 8 }}>{e.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: e.hue }}>{e.tag}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.45, color: MUTED, marginTop: 4 }}>{e.desc}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 18 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".07em", color: MUTED, textTransform: "uppercase" }}>
              Question level
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {LEVELS.map((l) => {
                const on = level === l.v;
                return (
                  <button
                    key={l.label}
                    type="button"
                    onClick={() => setLevel(l.v)}
                    style={{
                      minWidth: 38,
                      height: 32,
                      padding: "0 10px",
                      borderRadius: 9,
                      border: `1.5px solid ${on ? INDIGO : LINE}`,
                      background: on ? TINT : "#fff",
                      color: on ? INDIGO : MUTED,
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setPhase("instructions")} style={{ ...primaryBtn, marginLeft: "auto" }}>
              Take the mock test
            </button>
          </div>
        </div>

        {/* instructions modal */}
        {phase === "instructions" ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setPhase("idle")}
            style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, background: "rgba(28,27,46,.5)", backdropFilter: "blur(3px)" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "min(520px, 100%)", maxHeight: "92dvh", overflowY: "auto", background: "#fff", borderRadius: 18, padding: "24px 24px 20px", boxShadow: "0 30px 70px -24px rgba(28,27,46,.6)", fontFamily: SANS, color: INK }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${chosen.hue}CC, ${chosen.hue})`, color: "#fff", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17 }}>{chosen.name[0]}</span>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600 }}>Your examiner today is {chosen.name}</div>
                  <div style={{ fontSize: 12.5, color: MUTED }}>{chosen.tag} · IELTS Speaking format</div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["1", "Introduction & interview", "4–5 min", `${chosen.name} greets you, checks your name, and asks short questions about familiar topics. Answer in 2–4 sentences.`],
                  ["2", "The long turn", "3–4 min", "You get a topic card on screen, one minute to prepare (make notes!), then speak for 1–2 minutes without interruption."],
                  ["3", "Discussion", "4–5 min", "Deeper, more abstract questions linked to your Part 2 topic. This is where higher bands are decided."],
                ].map(([n, t, d, s]) => (
                  <div key={n} style={{ display: "flex", gap: 12, border: `1px solid ${LINE}`, borderRadius: 12, padding: "11px 13px" }}>
                    <span style={{ flex: "none", width: 26, height: 26, borderRadius: 8, background: TINT, color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{n}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{t} <span style={{ fontWeight: 500, color: MUTED, fontSize: 12.5 }}>· {d}</span></div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: MUTED, marginTop: 2 }}>{s}</div>
                    </div>
                  </div>
                ))}
              </div>

              <ul style={{ margin: "14px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: MUTED }}>
                <li><strong style={{ color: INK }}>Wear headphones</strong> in a quiet room — otherwise {chosen.name}&rsquo;s voice echoes into your mic.</li>
                <li>{chosen.name} leads the test — just listen and answer naturally. If you talk over the examiner, you&rsquo;ll be asked to wait, like the real thing.</li>
                <li>The test can&rsquo;t be paused. It runs about 11–14 minutes and counts as one of your monthly mock tests.</li>
                <li>Your band report (graded conservatively) appears right after the test ends.</li>
              </ul>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                <button type="button" onClick={() => setPhase("idle")} style={ghostBtn_}>
                  Back
                </button>
                <button type="button" onClick={begin} style={primaryBtn}>
                  I&rsquo;m ready — begin
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ ...card_, marginTop: 18, borderColor: "#F3C6C6", background: "#FDF3F3", color: RED }}>
        {error}
        {quotaHit ? (
          <>
            {" "}
            <Link href="/pricing" style={{ color: INDIGO, fontWeight: 700 }}>
              See plans →
            </Link>
          </>
        ) : null}
        <div style={{ marginTop: 14 }}>
          <button type="button" onClick={onExit} style={ghostBtn_}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ended") {
    return (
      <div style={{ ...card_, marginTop: 18, textAlign: "center", padding: "34px 22px" }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600 }}>That&rsquo;s the end of the test</div>
        {endedBand != null ? (
          <div style={{ margin: "14px 0", fontFamily: SERIF, fontSize: 46, fontWeight: 700, color: INDIGO }}>
            {endedBand.toFixed(1)}
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: MUTED }}>
              INDICATIVE OVERALL BAND
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <div
              aria-hidden
              style={{
                width: 26, height: 26, margin: "0 auto 10px",
                border: "3px solid #E4E6F2", borderTopColor: INDIGO, borderRadius: "50%",
                animation: "spin .9s linear infinite",
              }}
            />
            <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
              {grading
                ? "The examiner is writing your report — your band appears here in under a minute."
                : "Your report is being prepared."}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {sessionId ? (
            <button type="button" onClick={() => router.push(`/speak/mock/${sessionId}`)} style={primaryBtn}>
              See full report
            </button>
          ) : null}
          <button type="button" onClick={onExit} style={ghostBtn_}>
            Back to speaking
          </button>
        </div>
      </div>
    );
  }

  // live view — the EXAM ROOM: a full-viewport takeover (exit / part pill /
  // whole-test clock on top, the examiner centre-stage, cue card mid-page,
  // and a fixed "YOU" mic dock at the bottom).
  const inPrep = phase === "part2_prep";
  const inSpeak = phase === "part2_speak";
  const connecting = phase === "connecting";
  const ex = EXAMINERS.find((e) => e.id === examiner) ?? EXAMINERS[0];
  const status = connecting
    ? `Connecting you with ${ex.name}…`
    : examinerSpeaking
      ? `${ex.name} is speaking…`
      : inPrep
        ? "Prepare your answer"
        : listening
          ? `${ex.name} is listening`
          : `${ex.name} is thinking…`;
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
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        background: "#F6F6F9",
        fontFamily: SANS,
        color: INK,
      }}
    >
      {/* ── top bar ── */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 14px",
          background: "#fff",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (exitArmed) {
              setExitArmed(false);
              endEarly();
            } else {
              setExitArmed(true);
              setTimeout(() => setExitArmed(false), 3500);
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 34,
            padding: "0 12px",
            borderRadius: 9,
            border: `1px solid ${exitArmed ? "#F3C6C6" : LINE}`,
            background: exitArmed ? "#FDF3F3" : "#fff",
            color: exitArmed ? RED : MUTED,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>×</span>
          {exitArmed ? "End the test?" : "Exit"}
        </button>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 14px",
            borderRadius: 999,
            background: "#DCFCE7",
            color: "#15803D",
            fontSize: 13,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
          Part {part} · {PART_LABEL_SHORT[part] ?? ""}
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: MUTED,
            fontSize: 13.5,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {mm(elapsed)}
        </span>
      </div>
      {/* whole-test progress line (16-min cap) */}
      <div aria-hidden style={{ flex: "none", height: 3, background: LINE }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(1.5, (elapsed / 960) * 100))}%`,
            background: ex.hue,
            transition: "width 1s linear",
          }}
        />
      </div>

      {/* ── centre stage ── */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ width: "min(660px, 100%)", margin: "0 auto", padding: "26px 18px 30px", textAlign: "center" }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".16em", color: MUTED }}>EXAMINER</div>
          <div style={{ marginTop: 14 }}>
            <ExaminerHero
              hue={ex.hue}
              initial={ex.name[0]}
              speaking={examinerSpeaking}
              listening={listening && !examinerSpeaking}
              level={micLevel}
            />
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, marginTop: 14 }}>{status}</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 5, minHeight: 19 }}>
            {connecting ? "This takes a few seconds." : partHint[part]}
          </div>

          {clock != null ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 14,
                padding: "7px 16px",
                borderRadius: 999,
                background: inPrep ? "#FDF3E3" : TINT,
                border: `1px solid ${inPrep ? "#F2D9A8" : "#E4E2F4"}`,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: inPrep ? "#B45309" : INDIGO }}>
                {inPrep ? "PREP TIME" : "SPEAKING"}
              </span>
              <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: inPrep ? "#B45309" : INDIGO, fontVariantNumeric: "tabular-nums" }}>
                {mm(clock)}
              </span>
            </div>
          ) : null}

          {/* cue card (Part 2) — styled like the paper slip on exam day */}
          {card && part === 2 ? (
            <div
              style={{
                marginTop: 22,
                textAlign: "left",
                background: "#fff",
                border: `1px solid ${LINE}`,
                borderRadius: 16,
                padding: "16px 18px 18px",
                boxShadow: "0 14px 34px -22px rgba(28,27,46,.35)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "#FFF4E5",
                  color: "#C2410C",
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: ".06em",
                }}
              >
                <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="3" width="16" height="18" rx="2.5" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
                CUE CARD
              </span>
              <div style={{ fontFamily: SERIF, fontSize: 18.5, fontWeight: 600, marginTop: 10, lineHeight: 1.4 }}>{card.title}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: MUTED, margin: "10px 0 4px" }}>You should say:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.75, color: INK }}>
                {card.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div style={{ fontSize: 14, marginTop: 6, color: INK }}>{card.closing}</div>
              <div style={{ fontSize: 12.5, color: MUTED, marginTop: 10, fontStyle: "italic" }}>
                You will have 1–2 minutes to talk about this.
              </div>
              {inPrep || inSpeak ? (
                <textarea
                  value={notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNotes(v);
                    // debounce → engine persists them into the report
                    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
                    notesTimerRef.current = setTimeout(() => {
                      try {
                        wsRef.current?.send(JSON.stringify({ type: "notes", text: v.slice(0, 2000) }));
                      } catch {}
                    }, 800);
                  }}
                  placeholder="Your notes (saved into your report — only you can see them)…"
                  style={{
                    width: "100%",
                    marginTop: 12,
                    minHeight: 76,
                    resize: "vertical",
                    border: `1px solid ${LINE}`,
                    borderRadius: 10,
                    padding: 10,
                    fontFamily: SANS,
                    fontSize: 13.5,
                    color: INK,
                    background: "#FBFBFD",
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── YOU dock ── */}
      <div
        style={{
          flex: "none",
          background: "#fff",
          borderTop: `1px solid ${LINE}`,
          padding: "12px 18px calc(12px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ width: "min(660px, 100%)", margin: "0 auto" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".16em", color: "#B9BCC9", textAlign: "center" }}>YOU</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 7 }}>
            <span
              aria-hidden
              style={{
                position: "relative",
                display: "inline-flex",
                width: 42,
                height: 42,
                borderRadius: "50%",
                alignItems: "center",
                justifyContent: "center",
                background: listening && !examinerSpeaking ? "#16A34A" : "#EDEDF3",
                color: listening && !examinerSpeaking ? "#fff" : "#9A9DAD",
                // The ring ALWAYS tracks the mic so the candidate can see the
                // exam hears something even before speech is loud enough to
                // open the turn ("my answers aren't processed" was mostly a
                // too-quiet mic with zero visual feedback). Green when the
                // floor is open, soft indigo otherwise.
                boxShadow:
                  micLevel > 0.004 && !examinerSpeaking
                    ? `0 0 0 ${3 + Math.min(1, micLevel * 26) * 9}px ${
                        listening ? "rgba(22,163,74,.14)" : "rgba(67,56,202,.10)"
                      }`
                    : "none",
                transition: "background .2s, box-shadow .1s",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2.5" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
              </svg>
            </span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{dockText}</div>
              <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>
                Original AI examiner · not affiliated with IELTS®
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PART_LABEL_SHORT: Record<number, string> = {
  1: "Interview",
  2: "Long turn",
  3: "Discussion",
};

// ---- bits ------------------------------------------------------------------

const HERO_CSS = `
@keyframes lm-ring { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(1.7); opacity: 0; } }
@keyframes lm-talk { 0%,100% { transform: scale(1); } 50% { transform: scale(1.045); } }
@keyframes lm-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
@keyframes lm-bar { 0%,100% { transform: scaleY(.35); } 50% { transform: scaleY(1); } }
`;

/** The exam-room hero: a big animated examiner avatar. Rings ripple outward
 *  while the examiner speaks; a small equalizer runs while it listens to you. */
function ExaminerHero({
  hue,
  initial,
  speaking,
  listening,
  level,
}: {
  hue: string;
  initial: string;
  speaking: boolean;
  listening: boolean;
  level: number;
}) {
  const loud = Math.min(1, level * 26);
  return (
    <div style={{ position: "relative", width: 168, height: 168, margin: "0 auto" }}>
      <style>{HERO_CSS}</style>
      {speaking ? (
        <>
          <span aria-hidden style={{ position: "absolute", inset: 6, borderRadius: "50%", border: `2.5px solid ${hue}`, animation: "lm-ring 1.5s ease-out infinite" }} />
          <span aria-hidden style={{ position: "absolute", inset: 6, borderRadius: "50%", border: `2.5px solid ${hue}`, animation: "lm-ring 1.5s ease-out .55s infinite" }} />
        </>
      ) : null}
      {listening ? (
        <span aria-hidden style={{ position: "absolute", inset: 2, borderRadius: "50%", border: `2px solid ${hue}55`, boxShadow: `0 0 0 ${4 + loud * 10}px ${hue}14`, transition: "box-shadow .12s" }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 14,
          borderRadius: "50%",
          background: `radial-gradient(circle at 34% 28%, ${hue}D9, ${hue})`,
          boxShadow: `0 22px 46px -18px ${hue}99`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 46,
          animation: speaking ? "lm-talk .9s ease-in-out infinite" : "lm-breathe 3.4s ease-in-out infinite",
        }}
        aria-hidden
      >
        {initial}
      </div>
      {listening ? (
        <span aria-hidden style={{ position: "absolute", left: "50%", bottom: -6, transform: "translateX(-50%)", display: "inline-flex", gap: 3, alignItems: "flex-end", height: 18 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <i
              key={i}
              style={{
                width: 4,
                height: 6 + (i % 3) * 5 + loud * 7,
                borderRadius: 2,
                background: hue,
                transformOrigin: "bottom",
                animation: `lm-bar ${0.7 + i * 0.11}s ease-in-out ${i * 0.08}s infinite`,
              }}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}

const card_: React.CSSProperties = { border: `1px solid ${LINE}`, borderRadius: 16, background: "#fff", padding: 18 };
const primaryBtn: React.CSSProperties = { height: 44, padding: "0 22px", border: "none", borderRadius: 12, background: INDIGO, color: "#fff", fontFamily: SANS, fontSize: 15, fontWeight: 700, cursor: "pointer" };
const ghostBtn_: React.CSSProperties = { height: 40, padding: "0 16px", border: `1px solid ${LINE}`, borderRadius: 10, background: "#fff", color: INK, fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: "pointer" };
