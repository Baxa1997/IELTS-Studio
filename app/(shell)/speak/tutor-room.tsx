"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

/**
 * The speaking TUTOR room — a lesson, not an exam.
 *
 * You talk, it reacts to what you actually said, corrects one thing quoting
 * your own words, and answers you in YOUR language when you switch. The
 * transcript pane matters as much as the audio: seeing the fix written down
 * ("you said X → say Y") is half the teaching.
 *
 * Audio plumbing mirrors the exam room (16 kHz PCM16 up, 24 kHz down) — that
 * path is proven — but the exam's turn machinery is deliberately absent: here
 * you may interrupt, and the tutor simply listens again.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const TEAL = "#0F766E";          // the tutor's colour — never the examiner's indigo
const TEAL_SOFT = "#E6F4F1";
const LINE = "#E8E6F0";
const AMBER = "#B45309";
const RED = "#b91c1c";

const IN_RATE = 16000;
const OUT_RATE = 24000;

type Mode = "part1" | "part3" | "cue_card" | "free";

const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "part1", label: "Part 1 practice", blurb: "Short personal questions, corrected as you go" },
  { id: "part3", label: "Part 3 discussion", blurb: "Opinion questions with follow-ups" },
  { id: "free", label: "Free talk", blurb: "Practise whatever you choose" },
];

const VOICES = [
  { id: "emily", name: "Emily" },
  { id: "daniel", name: "Daniel" },
  { id: "sofia", name: "Sofia" },
  { id: "james", name: "James" },
];

interface Line {
  who: "you" | "tutor";
  text: string;
  language?: string;
  correction?: { they_said: string; better: string } | null;
  upgraded?: string | null;
}

interface LessonCard {
  headline?: string;
  focus?: string[];
  better_sentences?: { you_said: string; say_instead: string }[];
  practise_next?: string;
}

// ---- audio ------------------------------------------------------------------

class VoicePlayer {
  private ctx: AudioContext;
  private next = 0;
  private live = 0;
  onPlaying: ((on: boolean) => void) | null = null;
  constructor(private rate = OUT_RATE) {
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
    if (this.live === 0) this.onPlaying?.(true);
    this.live += 1;
    src.onended = () => {
      this.live -= 1;
      if (this.live === 0) this.onPlaying?.(false);
    };
    const t = Math.max(this.ctx.currentTime + 0.06, this.next);
    src.start(t);
    this.next = t + buf.duration;
  }
  close() {
    void this.ctx.close();
  }
}

const WORKLET_SRC = `
class Tap extends AudioWorkletProcessor {
  process(inputs){ const ch = inputs[0]?.[0]; if (ch) this.port.postMessage(ch.slice(0)); return true; }
}
registerProcessor("tutor-tap", Tap);`;

async function startMic(
  sink: (pcm16: ArrayBuffer) => void,
  level: (rms: number) => void,
): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(
    URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" })),
  );
  const src = ctx.createMediaStreamSource(stream);
  const tap = new AudioWorkletNode(ctx, "tutor-tap");
  src.connect(tap);
  const ratio = ctx.sampleRate / IN_RATE;
  let frac = 0;
  tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
    const input = e.data;
    let s = 0;
    for (let i = 0; i < input.length; i++) s += input[i] * input[i];
    level(Math.sqrt(s / input.length));
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
  return () => {
    tap.port.onmessage = null;
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };
}

function wsUrl(mode: Mode, token: string, voice: string): string {
  const base = clientEnv.aiBackendUrl ?? "";
  const q = new URLSearchParams({ token, mode, voice });
  return `${base.replace(/^http/, "ws")}/speaking/tutor/live?${q.toString()}`;
}

// ---- room -------------------------------------------------------------------

export function TutorRoom({ onExit }: { onExit?: () => void }) {
  const [state, setState] = useState<"idle" | "connecting" | "live" | "ended">("idle");
  const [mode, setMode] = useState<Mode>("part1");
  const [voice, setVoice] = useState("emily");
  const [lines, setLines] = useState<Line[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<LessonCard | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<VoicePlayer | null>(null);
  const stopMicRef = useRef<(() => void) | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== "live") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: 1e6, behavior: "smooth" });
  }, [lines, thinking]);

  const teardown = useCallback(() => {
    stopMicRef.current?.();
    stopMicRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const start = async () => {
    setError(null);
    setState("connecting");
    setLines([]);
    setCard(null);
    setElapsed(0);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session expired — please sign in again.");

      const player = new VoicePlayer();
      player.onPlaying = setSpeaking;
      player.resume();
      playerRef.current = player;

      const ws = new WebSocket(wsUrl(mode, token, voice));
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onmessage = (e) => {
        if (e.data instanceof ArrayBuffer) {
          player.push(e.data);
          return;
        }
        const ev = JSON.parse(e.data as string) as Record<string, unknown>;
        switch (ev.type) {
          case "ready":
            setState("live");
            break;
          case "listening":
            setListening(Boolean(ev.on));
            if (ev.on) setThinking(false);
            break;
          case "thinking":
            setThinking(true);
            break;
          case "you":
            if (String(ev.text ?? "").trim()) {
              setLines((l) => [
                ...l,
                { who: "you", text: String(ev.text), language: ev.language as string },
              ]);
            }
            break;
          case "tutor":
            setThinking(false);
            setLines((l) => [
              ...l,
              {
                who: "tutor",
                text: String(ev.say ?? ""),
                language: ev.language as string,
                correction: (ev.correction as Line["correction"]) ?? null,
                upgraded: (ev.upgraded_sentence as string) ?? null,
              },
            ]);
            break;
          case "lesson":
            setCard((ev.card as LessonCard) ?? {});
            setState("ended");
            teardown();
            break;
          case "tts_failed":
            setError("The tutor's voice dropped out — the lesson continues in text.");
            break;
          case "error":
            setError(String(ev.message || "The tutor couldn't start."));
            setState("idle");
            teardown();
            break;
        }
      };
      ws.onerror = () => {
        setError("Connection to the tutor failed.");
        setState("idle");
      };
      ws.onclose = () => {
        setListening(false);
        setThinking(false);
      };

      stopMicRef.current = await startMic(
        (pcm) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(pcm);
        },
        setLevel,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the lesson.");
      setState("idle");
      teardown();
    }
  };

  const send = (obj: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj));
    }
  };

  const end = () => {
    send({ type: "stop" });
    setTimeout(() => {
      if (state !== "ended") {
        teardown();
        setState("ended");
      }
    }, 8000);
  };

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  // ---- setup screen ----
  if (state === "idle" || state === "connecting") {
    return (
      <div style={{ fontFamily: SANS, maxWidth: 720, margin: "0 auto", padding: "26px 18px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 27, fontWeight: 600, color: INK }}>
            Practise with your tutor
          </h1>
          <Link href="/speak" style={{ fontSize: 13.5, fontWeight: 700, color: TEAL, textDecoration: "none" }}>
            ← Speaking
          </Link>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 14.5, color: MUTED, lineHeight: 1.6 }}>
          Speak, and the tutor answers — correcting what you said, explaining why, and
          showing a better version. Stuck? Ask anything, in English or in your own
          language (o‘zbekcha, по-русски). This is a lesson, not the exam: nothing here
          is scored.
        </p>

        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                textAlign: "left", cursor: "pointer", borderRadius: 14, padding: "13px 16px",
                background: mode === m.id ? TEAL_SOFT : "#fff",
                border: `1.5px solid ${mode === m.id ? TEAL : LINE}`, fontFamily: SANS,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14.5, color: mode === m.id ? TEAL : INK }}>
                {m.label}
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{m.blurb}</div>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".07em", color: MUTED, marginBottom: 8 }}>
            TUTOR VOICE
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVoice(v.id)}
                style={{
                  cursor: "pointer", borderRadius: 999, padding: "7px 15px", fontSize: 13.5,
                  fontWeight: 700, fontFamily: SANS,
                  background: voice === v.id ? TEAL : "#fff",
                  color: voice === v.id ? "#fff" : INK,
                  border: `1.5px solid ${voice === v.id ? TEAL : LINE}`,
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {error ? <p style={{ color: RED, fontSize: 13.5, margin: "0 0 12px" }}>{error}</p> : null}

        <button
          onClick={() => void start()}
          disabled={state === "connecting"}
          style={{
            background: TEAL, color: "#fff", border: "none", borderRadius: 12,
            padding: "14px 26px", fontSize: 15.5, fontWeight: 700, cursor: "pointer",
            fontFamily: SANS, opacity: state === "connecting" ? 0.6 : 1,
          }}
        >
          {state === "connecting" ? "Connecting…" : "Start the lesson"}
        </button>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: MUTED }}>
          Uses your microphone · up to 20 minutes · counts against your monthly tutor time
        </p>
      </div>
    );
  }

  // ---- lesson card ----
  if (state === "ended") {
    return (
      <div style={{ fontFamily: SANS, maxWidth: 720, margin: "0 auto", padding: "26px 18px 60px" }}>
        <h1 style={{ margin: "0 0 4px", fontFamily: SERIF, fontSize: 25, fontWeight: 600, color: INK }}>
          Lesson complete
        </h1>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: MUTED }}>{mmss} of practice</p>

        {card?.headline ? (
          <div style={{ background: TEAL_SOFT, borderRadius: 14, padding: "15px 18px", marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: INK }}>{card.headline}</p>
          </div>
        ) : null}

        {card?.focus?.length ? (
          <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "15px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", color: TEAL, marginBottom: 8 }}>
              WHAT TO WORK ON
            </div>
            {card.focus.map((f, i) => (
              <p key={i} style={{ margin: "0 0 8px", fontSize: 13.8, lineHeight: 1.6, color: "#3A3950" }}>• {f}</p>
            ))}
          </div>
        ) : null}

        {card?.better_sentences?.length ? (
          <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "15px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", color: TEAL, marginBottom: 10 }}>
              SAY IT BETTER
            </div>
            {card.better_sentences.map((b, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13.5, color: MUTED, textDecoration: "line-through" }}>{b.you_said}</div>
                <div style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{b.say_instead}</div>
              </div>
            ))}
          </div>
        ) : null}

        {card?.practise_next ? (
          <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "15px 18px", marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", color: AMBER, marginBottom: 6 }}>
              BEFORE NEXT TIME
            </div>
            <p style={{ margin: 0, fontSize: 13.8, lineHeight: 1.6, color: "#3A3950" }}>{card.practise_next}</p>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setState("idle")}
            style={{
              background: TEAL, color: "#fff", border: "none", borderRadius: 12,
              padding: "12px 22px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: SANS,
            }}
          >
            Another lesson
          </button>
          <Link
            href="/speak"
            onClick={onExit}
            style={{
              background: "#fff", color: INK, border: `1.5px solid ${LINE}`, borderRadius: 12,
              padding: "12px 22px", fontSize: 14.5, fontWeight: 700, textDecoration: "none", fontFamily: SANS,
            }}
          >
            Back to Speaking
          </Link>
        </div>
      </div>
    );
  }

  // ---- live lesson ----
  const ring = Math.min(1, level * 9);
  return (
    <div style={{ fontFamily: SANS, maxWidth: 760, margin: "0 auto", padding: "18px 18px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button
          onClick={end}
          style={{
            background: "#fff", border: `1.5px solid ${LINE}`, borderRadius: 999,
            padding: "7px 15px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS, color: INK,
          }}
        >
          End lesson
        </button>
        <span style={{
          background: TEAL_SOFT, color: TEAL, borderRadius: 999, padding: "6px 14px",
          fontSize: 12.5, fontWeight: 800, letterSpacing: ".04em",
        }}>
          LESSON · not scored
        </span>
        <span style={{ fontSize: 13, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{mmss}</span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          style={{
            width: 86, height: 86, borderRadius: "50%", margin: "0 auto",
            background: TEAL, display: "grid", placeItems: "center",
            color: "#fff", fontFamily: SERIF, fontSize: 32,
            boxShadow: speaking
              ? `0 0 0 ${8 + ring * 6}px ${TEAL_SOFT}`
              : listening
                ? `0 0 0 ${6 + ring * 14}px ${TEAL_SOFT}`
                : "none",
            transition: "box-shadow .12s ease-out",
          }}
        >
          {VOICES.find((v) => v.id === voice)?.name[0] ?? "T"}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 14.5, fontWeight: 700, color: INK }}>
          {speaking ? "Tutor is speaking" : thinking ? "Thinking…" : listening ? "Your turn — speak" : "…"}
        </p>
      </div>

      <div
        ref={feedRef}
        style={{
          maxHeight: "46vh", overflowY: "auto", margin: "14px 0", display: "grid", gap: 10,
          background: "#FBFAFE", border: `1px solid ${LINE}`, borderRadius: 14, padding: 14,
        }}
      >
        {lines.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: MUTED, textAlign: "center" }}>
            Your conversation appears here, with every correction written down.
          </p>
        ) : null}
        {lines.map((l, i) => (
          <div key={i} style={{ justifySelf: l.who === "you" ? "end" : "start", maxWidth: "90%" }}>
            <div
              style={{
                background: l.who === "you" ? "#EEF2F7" : "#fff",
                border: `1px solid ${LINE}`, borderRadius: 12, padding: "9px 13px",
                fontSize: 13.8, lineHeight: 1.6, color: INK,
              }}
            >
              {l.text}
              {l.language && l.language !== "en" ? (
                <span style={{ marginLeft: 6, fontSize: 11, color: TEAL, fontWeight: 700 }}>
                  {l.language.toUpperCase()}
                </span>
              ) : null}
            </div>
            {l.correction ? (
              <div style={{
                marginTop: 5, background: "#FFF7ED", border: "1px solid #FDE6C8",
                borderRadius: 10, padding: "7px 11px", fontSize: 13,
              }}>
                <span style={{ color: MUTED, textDecoration: "line-through" }}>{l.correction.they_said}</span>
                <span style={{ margin: "0 7px", color: AMBER }}>→</span>
                <span style={{ color: INK, fontWeight: 700 }}>{l.correction.better}</span>
              </div>
            ) : null}
            {l.upgraded ? (
              <div style={{
                marginTop: 5, background: TEAL_SOFT, borderRadius: 10, padding: "7px 11px",
                fontSize: 13, color: "#0B5B55",
              }}>
                Even better: <strong>{l.upgraded}</strong>
              </div>
            ) : null}
          </div>
        ))}
        {thinking ? (
          <div style={{ justifySelf: "start", fontSize: 13, color: MUTED }}>Tutor is thinking…</div>
        ) : null}
      </div>

      {error ? <p style={{ color: RED, fontSize: 12.5, margin: "0 0 8px" }}>{error}</p> : null}

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button
          onClick={() => send({ type: "skip" })}
          style={{
            background: "#fff", border: `1.5px solid ${LINE}`, borderRadius: 999,
            padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: SANS, color: MUTED,
          }}
        >
          Skip this question
        </button>
      </div>
      <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 11.5, color: MUTED }}>
        Original AI tutor · not affiliated with IELTS®
      </p>
    </div>
  );
}
