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
  | "idle" | "connecting" | "greeting" | "part1"
  | "part2_card" | "part2_prep" | "part2_speak" | "part2_round"
  | "part3" | "closing" | "ended" | "error";

interface PhaseEvent {
  type: "part" | "cue_card" | "prep" | "long_turn";
  part: number;
  label?: string;
  card?: CueCard;
  seconds?: number;
}

// ---- examiner voice playback (24 kHz PCM16 → scheduled AudioBuffers) ---------

class VoicePlayer {
  private ctx: AudioContext;
  private next = 0;
  constructor(private rate = 24000) {
    this.ctx = new AudioContext();
  }
  resume() {
    void this.ctx.resume();
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
    const t = Math.max(this.ctx.currentTime + 0.05, this.next);
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

function wsUrl(session_id: string, token: string): string {
  const base = clientEnv.aiBackendUrl ?? "";
  const ws = base.replace(/^http/, "ws"); // https→wss, http→ws
  const q = new URLSearchParams({ session_id, token });
  return `${ws}/speaking/live?${q.toString()}`;
}

const PART_LABEL: Record<number, string> = {
  1: "Part 1 — Introduction & interview",
  2: "Part 2 — The long turn",
  3: "Part 3 — Discussion",
};

export function LiveMock({ onExit }: { onExit: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [part, setPart] = useState(1);
  const [card, setCard] = useState<CueCard | null>(null);
  const [notes, setNotes] = useState("");
  const [clock, setClock] = useState<number | null>(null); // prep / long-turn countdown
  const [examinerSpeaking, setExaminerSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [endedBand, setEndedBand] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const micRef = useRef<Mic | null>(null);
  const playerRef = useRef<VoicePlayer | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    try {
      wsRef.current?.close();
    } catch {}
    micRef.current?.stop();
    playerRef.current?.close();
    wsRef.current = null;
    micRef.current = null;
    playerRef.current = null;
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const onEvent = useCallback(
    (m: Record<string, unknown>) => {
      switch (m.type) {
        case "ready":
          setSessionId(String(m.session_id ?? ""));
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
          setExaminerSpeaking(Boolean(m.speaking));
          break;
        case "listening":
          setListening(Boolean(m.on));
          break;
        case "your_turn":
          setListening(true);
          break;
        case "ended":
          setEndedBand(typeof m.overall_band === "number" ? m.overall_band : null);
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
    [runClock, teardown],
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
      playerRef.current = player;

      const ws = new WebSocket(wsUrl(sid, token));
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
        mic.onLevel((rms) => setLevel(rms));
        micRef.current = mic;
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the mock.");
      setPhase("error");
      teardown();
    }
  }, [onEvent, teardown]);

  const endEarly = useCallback(() => {
    try {
      wsRef.current?.send(JSON.stringify({ type: "stop" }));
    } catch {}
  }, []);

  // ---- render ----------------------------------------------------------------

  const quotaHit = error ? /quota|upgrade|plan|Standard|Pro/i.test(error) : false;

  if (phase === "idle") {
    return (
      <div style={{ ...card_, marginTop: 18, textAlign: "center", padding: "34px 22px" }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600 }}>Full mock — Parts 1 to 3</div>
        <p style={{ margin: "8px auto 18px", maxWidth: 520, fontSize: 14, lineHeight: 1.6, color: MUTED }}>
          A complete 11–14 minute test with a live AI examiner: the interview, the cue-card long
          turn, then the discussion. Speak naturally — the examiner leads. Use headphones so the
          examiner&rsquo;s voice doesn&rsquo;t echo into your mic.
        </p>
        <button type="button" onClick={begin} style={primaryBtn}>
          Start the mock test
        </button>
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
          <p style={{ color: MUTED, fontSize: 14, marginTop: 12 }}>Your report is being prepared.</p>
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

  // live view
  const inPrep = phase === "part2_prep";
  const inSpeak = phase === "part2_speak";
  return (
    <div style={{ marginTop: 18 }}>
      {/* part progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[1, 2, 3].map((p) => (
          <div
            key={p}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              background: p < part ? INDIGO : p === part ? INDIGO : LINE,
              opacity: p === part ? 1 : p < part ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      <div style={{ ...card_, padding: "22px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: INDIGO }}>
            {PART_LABEL[part] ?? "Speaking test"}
          </span>
          {clock != null ? (
            <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: inPrep ? "#B45309" : INK, fontVariantNumeric: "tabular-nums" }}>
              {Math.floor(clock / 60)}:{String(clock % 60).padStart(2, "0")}
            </span>
          ) : null}
        </div>

        {/* examiner state */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
          <ExaminerOrb speaking={examinerSpeaking} />
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600 }}>
              {examinerSpeaking ? "The examiner is speaking…" : listening ? "Your turn — speak now" : "…"}
            </div>
            <div style={{ fontSize: 13, color: MUTED }}>
              {inPrep
                ? "Prepare quietly. You can make notes below."
                : inSpeak
                  ? "Speak for one to two minutes. Don't stop for pauses."
                  : listening
                    ? "The examiner is listening."
                    : "Listen to the examiner."}
            </div>
          </div>
          {listening ? <MicLevel level={level} /> : null}
        </div>

        {/* cue card (Part 2) */}
        {card && (part === 2) ? (
          <div style={{ marginTop: 18, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, background: "#FCFCFE" }}>
            <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600 }}>{card.title}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, margin: "10px 0 4px" }}>You should say:</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: INK }}>
              {card.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div style={{ fontSize: 14, marginTop: 6, color: INK }}>{card.closing}</div>
            {(inPrep || inSpeak) ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your notes (only you can see these)…"
                style={{ width: "100%", marginTop: 12, minHeight: 72, resize: "vertical", border: `1px solid ${LINE}`, borderRadius: 8, padding: 10, fontFamily: SANS, fontSize: 13.5, color: INK }}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        <span style={{ fontSize: 12, color: MUTED }}>
          Original AI examiner · not affiliated with or endorsed by IELTS®
        </span>
        <button type="button" onClick={endEarly} style={ghostBtn_}>
          End test
        </button>
      </div>
    </div>
  );
}

// ---- bits ------------------------------------------------------------------

function ExaminerOrb({ speaking }: { speaking: boolean }) {
  return (
    <span
      style={{
        flex: "none",
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, #5A50E0, ${INDIGO})`,
        boxShadow: speaking ? "0 0 0 6px rgba(67,56,202,.16)" : "none",
        transition: "box-shadow .2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3" />
      </svg>
    </span>
  );
}

function MicLevel({ level }: { level: number }) {
  const n = Math.min(5, Math.floor(level * 40));
  return (
    <span style={{ display: "inline-flex", gap: 3, marginLeft: "auto", alignItems: "flex-end", height: 22 }} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} style={{ width: 4, height: 6 + i * 4, borderRadius: 2, background: i < n ? INDIGO : LINE }} />
      ))}
    </span>
  );
}

const card_: React.CSSProperties = { border: `1px solid ${LINE}`, borderRadius: 16, background: "#fff", padding: 18 };
const primaryBtn: React.CSSProperties = { height: 44, padding: "0 22px", border: "none", borderRadius: 12, background: INDIGO, color: "#fff", fontFamily: SANS, fontSize: 15, fontWeight: 700, cursor: "pointer" };
const ghostBtn_: React.CSSProperties = { height: 40, padding: "0 16px", border: `1px solid ${LINE}`, borderRadius: 10, background: "#fff", color: INK, fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: "pointer" };
