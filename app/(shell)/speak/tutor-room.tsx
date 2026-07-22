"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { ConfirmQuit } from "./confirm-quit";

/**
 * The speaking TUTOR room — a lesson, not an exam.
 *
 * You talk, it reacts to what you actually said, corrects one thing quoting
 * your own words, and answers you in Uzbek when you switch. Deliberately
 * SPOKEN, not written: no running transcript, only the single correction just
 * made, which fades with the next turn.
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
/** Small head start before a turn plays. The engine now sends each reply as one
 *  complete clip (Cloud TTS), so this only absorbs network jitter, not the
 *  generation starvation that used to break sentences apart. */
const JITTER_LEAD_S = 0.15;

type Mode = "part1" | "part3" | "cue_card" | "free";

const VOICES = [
  { id: "daniel", name: "Daniel", manner: "Calm and clear" },
  { id: "james", name: "James", manner: "Brisk and direct" },
  { id: "emily", name: "Emily", manner: "Warm and patient" },
  { id: "sofia", name: "Sofia", manner: "Easy-going" },
];

type Swap = { they_said: string; better: string };

interface Line {
  who: "you" | "tutor";
  text: string;
  language?: string;
  correction?: Swap | null;   // a mistake, fixed
  upgrade?: Swap | null;      // correct English, made better — the main lesson
}

interface LessonCard {
  headline?: string;
  focus?: string[];
  better_sentences?: { you_said: string; say_instead: string }[];
  practise_next?: string;
}

// ---- audio ------------------------------------------------------------------

/**
 * Plays the tutor's 24 kHz PCM and reports when playback has REALLY finished.
 * Without that report the engine would open the mic while the tutor's voice was
 * still coming out of the speakers, and it would hear and answer itself.
 */
class VoicePlayer {
  private ctx: AudioContext;
  private next = 0;
  private live = 0;
  onPlaying: ((on: boolean) => void) | null = null;
  onDrained: (() => void) | null = null;
  constructor(private rate = OUT_RATE) {
    this.ctx = new AudioContext();
  }
  resume() {
    void this.ctx.resume();
  }
  get busy(): boolean {
    return this.live > 0;
  }
  /** Start of a new tutor turn: re-arm the jitter buffer. */
  beginTurn() {
    this.next = 0;
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
      if (this.live === 0) {
        this.onPlaying?.(false);
        this.onDrained?.();
      }
    };
    // A small head start on the first chunk of a turn absorbs network jitter.
    const lead = this.next === 0 ? JITTER_LEAD_S : 0.02;
    const t = Math.max(this.ctx.currentTime + lead, this.next);
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
  // The learner picks nothing: the lesson opens conversationally and the
  // tutor steers. `mode` stays as the engine's question-spine hint.
  const mode: Mode = "part1";
  const [voice, setVoice] = useState("daniel");
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
  const pendingSeqRef = useRef<number | null>(null);   // turn awaiting a `played` report
  const [sampling, setSampling] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const sampleRef = useRef<HTMLAudioElement | null>(null);

  /** Play a few seconds of a voice so the accent can be judged by ear. */
  const playSample = useCallback(async (id: string) => {
    const backend = clientEnv.aiBackendUrl;
    if (!backend) return;
    try {
      setSampling(id);
      sampleRef.current?.pause();
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("signed out");
      const res = await fetch(`${backend}/speaking/tutor/voice-sample?voice=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      sampleRef.current = audio;
      audio.onended = () => {
        setSampling(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setSampling(null);
      setError("Couldn't play that voice sample.");
    }
  }, []);

  useEffect(() => {
    if (state !== "live") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  const teardown = useCallback(() => {
    stopMicRef.current?.();
    stopMicRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  // Same for a lesson in progress: leaving the page ends it and spends the
  // minutes, so the browser warns before the tab goes.
  useEffect(() => {
    if (state !== "live") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);

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
      // The engine holds the mic shut until we confirm the turn was HEARD.
      player.onDrained = () => {
        const seq = pendingSeqRef.current;
        if (seq != null) {
          pendingSeqRef.current = null;
          send({ type: "played", seq });
        }
      };

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
            player.beginTurn();   // re-arm the jitter buffer for this reply
            setLines((l) => [
              ...l,
              {
                who: "tutor",
                text: String(ev.say ?? ""),
                language: ev.language as string,
                correction: (ev.correction as Swap) ?? null,
                upgrade: (ev.upgrade as Swap) ?? null,
              },
            ]);
            break;
          case "turn_end": {
            // Generation finished; playback may not have. Report `played` when
            // the queue actually drains — or immediately if nothing is queued.
            const seq = Number(ev.seq);
            if (player.busy) {
              pendingSeqRef.current = seq;
            } else {
              send({ type: "played", seq });
            }
            break;
          }
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
  // Only the most recent correction is shown, and only until the next turn.
  const lastTutor = [...lines].reverse().find((l) => l.who === "tutor");
  const lastCorrection = lastTutor?.correction ?? null;
  const lastUpgrade = lastTutor?.upgrade ?? null;

  // ---- setup screen ----
  if (state === "idle" || state === "connecting") {
    return (
      <div style={{ fontFamily: SANS, maxWidth: 720, margin: "0 auto", padding: "26px 18px 60px" }}>
        <h2 style={{ margin: "0 0 6px", fontFamily: SERIF, fontSize: 25, fontWeight: 600, color: INK }}>
          Practise with your tutor
        </h2>
        <p style={{ margin: "0 0 22px", fontSize: 15.5, color: "#3A3950", lineHeight: 1.65, maxWidth: 620 }}>
          Just start talking. Your tutor says hello and the conversation becomes the
          lesson — nothing to set up, nothing scored.
        </p>

        <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
          {([
            ["Reacts to every answer", "It listens to what you actually said, not a script."],
            ["Shows you a better way", "\u201cYou said \u2018it is good\u2019 \u2014 a stronger word is \u2018fulfilling\u2019.\u201d"],
            ["Helps in o\u2018zbekcha", "Stuck? Ask in Uzbek and it explains, then gives you the English to say."],
          ] as const).map(([title, blurb]) => (
            <div key={title} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span
                style={{
                  flex: "0 0 auto", width: 20, height: 20, borderRadius: "50%",
                  background: TEAL_SOFT, color: TEAL, fontSize: 12, fontWeight: 800,
                  display: "grid", placeItems: "center", marginTop: 2,
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: 14.5, lineHeight: 1.55 }}>
                <strong style={{ color: INK }}>{title}.</strong>{" "}
                <span style={{ color: MUTED }}>{blurb}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Pick by ear, not by name — accents are the whole point of choosing. */}
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", color: MUTED, marginBottom: 9 }}>
          YOUR TUTOR
        </div>
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 9, marginBottom: 24,
          }}
        >
          {VOICES.map((v) => {
            const on = voice === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setVoice(v.id)}
                style={{
                  cursor: "pointer", borderRadius: 14, padding: "13px 14px",
                  background: on ? TEAL_SOFT : "#fff",
                  border: `1.5px solid ${on ? TEAL : LINE}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{
                      width: 32, height: 32, borderRadius: "50%", background: on ? TEAL : "#E7E6EF",
                      color: on ? "#fff" : MUTED, display: "grid", placeItems: "center",
                      fontFamily: SERIF, fontSize: 15,
                    }}
                  >
                    {v.name[0]}
                  </span>
                  <span>
                    <span style={{ display: "block", fontWeight: 700, fontSize: 14.5, color: on ? TEAL : INK }}>
                      {v.name}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: MUTED }}>{v.manner}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void playSample(v.id);
                  }}
                  style={{
                    marginTop: 10, width: "100%", cursor: "pointer", borderRadius: 999,
                    border: `1px solid ${on ? TEAL : LINE}`, background: "#fff",
                    color: on ? TEAL : MUTED, fontSize: 12.5, fontWeight: 700,
                    padding: "6px 0", fontFamily: SANS,
                  }}
                >
                  {sampling === v.id ? "Playing…" : "▶ Hear this voice"}
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => void start()}
          disabled={state === "connecting"}
          style={{
            display: "block", width: "100%", background: TEAL, color: "#fff",
            border: "none", borderRadius: 16, padding: "18px 26px", fontSize: 17,
            fontWeight: 700, cursor: "pointer", fontFamily: SANS,
            opacity: state === "connecting" ? 0.6 : 1,
          }}
        >
          {state === "connecting" ? "Connecting…" : `Start speaking with ${VOICES.find((v) => v.id === voice)?.name}`}
        </button>
        <p style={{ margin: "11px 0 0", fontSize: 12.5, color: MUTED, textAlign: "center" }}>
          Uses your microphone · up to 20 minutes · not scored
        </p>

        {error ? <p style={{ color: RED, fontSize: 13.5, margin: "16px 0 0" }}>{error}</p> : null}
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
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 4px 14px", borderBottom: `1px solid ${LINE}`, marginBottom: 26,
        }}
      >
        <span style={{
          background: TEAL_SOFT, color: TEAL, borderRadius: 999, padding: "6px 13px",
          fontSize: 12, fontWeight: 800, letterSpacing: ".05em",
        }}>
          LESSON · not scored
        </span>
        <span style={{ fontSize: 13.5, color: MUTED, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {mmss} <span style={{ color: "#A9A7BC" }}>/ 20:00</span>
        </span>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 132, height: 132, margin: "0 auto" }}>
          {/* the ring breathes with the mic when it is your turn, and glows
              steadily while the tutor talks — so the state is readable at a
              glance, without reading anything */}
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: TEAL_SOFT,
              transform: `scale(${listening ? 1 + ring * 0.35 : speaking ? 1.12 : 1})`,
              opacity: listening || speaking ? 1 : 0.55,
              transition: "transform .12s ease-out, opacity .3s",
            }}
          />
          <div
            style={{
              position: "absolute", inset: 23, borderRadius: "50%", background: TEAL,
              display: "grid", placeItems: "center", color: "#fff",
              fontFamily: SERIF, fontSize: 34,
              boxShadow: speaking ? "0 8px 26px rgba(15,118,110,.34)" : "0 4px 14px rgba(15,118,110,.18)",
              transition: "box-shadow .3s",
            }}
          >
            {VOICES.find((v) => v.id === voice)?.name[0] ?? "T"}
          </div>
        </div>
        <p style={{ margin: "18px 0 0", fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: INK }}>
          {speaking
            ? `${VOICES.find((v) => v.id === voice)?.name} is speaking`
            : thinking
              ? "Thinking…"
              : listening
                ? "Your turn — just talk"
                : "One moment…"}
        </p>
        <p style={{ margin: "5px 0 0", fontSize: 13.5, color: MUTED }}>
          {listening
            ? "Pause when you're done and I'll pick it up"
            : speaking
              ? "You can cut in any time"
              : "\u00a0"}
        </p>
      </div>

      {/* Deliberately no running transcript: this is a SPOKEN lesson, and the
          owner was explicit — "I dont need text written, just speak is enough".
          The only thing worth reading mid-lesson is the one correction just
          made, because a fix you can see is a fix you remember; it fades with
          the next turn. Everything else waits for the lesson card. */}
      {lastCorrection || lastUpgrade ? (
        <div style={{ margin: "22px auto 0", maxWidth: 520, display: "grid", gap: 8 }}>
          {lastCorrection ? (
            <div
              style={{
                background: "#FFF7ED", border: "1px solid #FDE6C8", borderRadius: 12,
                padding: "11px 16px", fontSize: 15, textAlign: "center",
              }}
            >
              <span style={{ color: MUTED, textDecoration: "line-through" }}>
                {lastCorrection.they_said}
              </span>
              <span style={{ margin: "0 9px", color: AMBER }}>→</span>
              <span style={{ color: INK, fontWeight: 700 }}>{lastCorrection.better}</span>
            </div>
          ) : null}
          {lastUpgrade ? (
            <div
              style={{
                background: TEAL_SOFT, border: `1px solid #CDE9E3`, borderRadius: 12,
                padding: "11px 16px", fontSize: 15, textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", color: TEAL, marginBottom: 4 }}>
                SAY IT BETTER
              </div>
              {lastUpgrade.they_said ? (
                <>
                  <span style={{ color: MUTED }}>{lastUpgrade.they_said}</span>
                  <span style={{ margin: "0 9px", color: TEAL }}>→</span>
                </>
              ) : null}
              <span style={{ color: INK, fontWeight: 700 }}>{lastUpgrade.better}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p style={{ color: RED, fontSize: 12.5, margin: "16px 0 0", textAlign: "center" }}>{error}</p>
      ) : null}

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 30 }}>
        <button
          onClick={() => send({ type: "skip" })}
          style={{
            background: "#fff", border: `1.5px solid ${LINE}`, borderRadius: 999,
            padding: "10px 20px", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            fontFamily: SANS, color: MUTED,
          }}
        >
          Skip this question
        </button>
        <button
          onClick={() => setConfirmEnd(true)}
          style={{
            background: "#fff", border: `1.5px solid ${LINE}`, borderRadius: 999,
            padding: "10px 20px", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            fontFamily: SANS, color: INK,
          }}
        >
          End lesson
        </button>
      </div>

      <ConfirmQuit
        open={confirmEnd}
        title="End the lesson?"
        body={
          "This finishes your speaking lesson and writes up what you practised. " +
          "The minutes you have used still count towards this month's tutor time."
        }
        confirmLabel="End the lesson"
        cancelLabel="Keep practising"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          end();
        }}
      />
      <p style={{ margin: "22px 0 0", textAlign: "center", fontSize: 11.5, color: MUTED }}>
        Original AI tutor · not affiliated with IELTS®
      </p>
    </div>
  );
}
