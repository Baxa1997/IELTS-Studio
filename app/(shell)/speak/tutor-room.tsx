"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { ConfirmQuit } from "./confirm-quit";
import { LucidaScope, PERSONAS, PersonaAvatar, personaById, TOPICS, WaveBars } from "./lucida";

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

const IN_RATE = 16000;
const OUT_RATE = 24000;
/** Small head start before a turn plays. The engine now sends each reply as one
 *  complete clip (Cloud TTS), so this only absorbs network jitter, not the
 *  generation starvation that used to break sentences apart. */
const JITTER_LEAD_S = 0.15;

type Mode = "part1" | "part3" | "cue_card" | "free";

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
  // Hold-to-talk removes the guessing entirely: the button says when you
  // started and stopped, so nothing can cut you off or wait through a pause.
  const [handsFree, setHandsFree] = useState(
    () => typeof window === "undefined" || localStorage.getItem("tutorHandsFree") !== "0",
  );
  const [pressed, setPressed] = useState(false);
  // Holding only means anything in hold-to-talk, so derive it rather than
  // clearing the flag from an effect whenever the mode changes.
  const holding = !handsFree && pressed;
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

  // Tell the engine which way turn-taking works whenever it changes or the
  // lesson starts; without this a switch back to hands-free would leave the
  // engine waiting for a press that never comes.
  useEffect(() => {
    if (state !== "live") return;
    send({ type: "mode", hands_free: handsFree });
    localStorage.setItem("tutorHandsFree", handsFree ? "1" : "0");
  }, [handsFree, state]);

  const press = () => {
    if (handsFree || pressed) return;
    setPressed(true);
    send({ type: "ptt", on: true });
  };
  const release = () => {
    if (handsFree || !pressed) return;
    setPressed(false);
    send({ type: "ptt", on: false });
  };

  // Spacebar is the natural key for push-to-talk, and it keeps the room usable
  // without a mouse. Ignored while typing anywhere.
  useEffect(() => {
    if (state !== "live" || handsFree) return;
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(t.tagName);
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !isTyping(e.target)) {
        e.preventDefault();
        press();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTyping(e.target)) {
        e.preventDefault();
        release();
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });   // no dep array: press/release close over current state

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

  // ---- setup screen (Lucida tutor pick) ----
  if (state === "idle" || state === "connecting") {
    const selected = personaById(voice);
    return (
      <LucidaScope style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 40px 64px" }}>
          <Link href="/speak" className="lc-tab" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-neutral-500)", textDecoration: "none", marginBottom: 24 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
            Speaking
          </Link>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-4xl)", color: "var(--color-neutral-1000)", letterSpacing: "var(--ls-snug)", marginBottom: 10 }}>
            Practise with your tutor
          </div>
          <p style={{ fontSize: "var(--text-md)", color: "var(--color-neutral-600)", maxWidth: 680, lineHeight: "var(--lh-relaxed)", margin: "0 0 32px" }}>
            Your tutor asks what you want to work on, then the conversation becomes the lesson. Nothing to set up, nothing scored.
          </p>

          {/* English is not one skill — the tutor adapts the lesson to any of these. */}
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 12 }}>
            You can practise for
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
            {TOPICS.map((c) => (
              <span key={c} style={{ padding: "10px 18px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-sm)", fontWeight: 600, border: "1px solid var(--color-neutral-200)", background: "var(--color-neutral-0)", color: "var(--color-neutral-600)" }}>
                {c}
              </span>
            ))}
          </div>

          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 12 }}>
            Choose your tutor
          </div>
          <div className="lc-persona-grid" style={{ marginBottom: 32 }}>
            {PERSONAS.map((p) => {
              const on = voice === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setVoice(p.id)}
                  className="lc-card-tap"
                  style={{ cursor: "pointer", padding: 22, borderRadius: "var(--radius-xl)", border: `1.5px solid ${on ? p.accent : "var(--color-neutral-200)"}`, background: on ? p.tint : "var(--color-neutral-0)" }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: p.accent, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: 14 }}>
                    {p.initial}
                  </div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-neutral-1000)", marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: p.accent, marginBottom: 8 }}>{p.tutorTrait}</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", lineHeight: "var(--lh-snug)", marginBottom: 12 }}>{p.tutorDesc}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void playSample(p.id);
                    }}
                    className="lc-btn"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${on ? p.accent : "var(--color-neutral-200)"}`, background: "var(--color-neutral-0)", color: on ? p.accent : "var(--color-neutral-600)", fontSize: "var(--text-xs)", fontWeight: 600, padding: "8px 12px", borderRadius: "var(--radius-pill)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    {sampling === p.id ? "Playing…" : "Hear this voice"}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => void start()}
            disabled={state === "connecting"}
            className="lc-btn lc-success"
            style={{ width: "100%", border: "none", background: "var(--color-success)", color: "#FFFFFF", fontSize: "var(--text-md)", fontWeight: 600, padding: 18, borderRadius: "var(--radius-lg)", cursor: "pointer", fontFamily: "inherit", opacity: state === "connecting" ? 0.6 : 1 }}
          >
            {state === "connecting" ? "Connecting…" : `Start speaking with ${selected.name}`}
          </button>
          <p style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-neutral-500)", marginTop: 12 }}>
            Uses your microphone · up to 20 minutes · not scored
          </p>

          {error ? <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: "16px 0 0" }}>{error}</p> : null}
        </div>
      </LucidaScope>
    );
  }

  // ---- lesson card (Lucida) ----
  if (state === "ended") {
    return (
      <LucidaScope style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 40px 64px" }}>
          <Link href="/speak" className="lc-tab" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-neutral-500)", textDecoration: "none", marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
            Speaking
          </Link>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-3xl)", color: "var(--color-neutral-1000)", marginBottom: 4 }}>
            Lesson complete
          </div>
          <p style={{ margin: "0 0 22px", fontSize: "var(--text-sm)", color: "var(--color-neutral-500)" }}>{mmss} of practice</p>

          {card?.headline ? (
            <div style={{ background: "var(--color-success-bg)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "var(--radius-xl)", padding: "16px 20px", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: "var(--text-md)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-1000)" }}>{card.headline}</p>
            </div>
          ) : null}

          {card?.focus?.length ? (
            <div style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-xl)", padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-success)", marginBottom: 10 }}>What to work on</div>
              {card.focus.map((f, i) => (
                <p key={i} style={{ margin: "0 0 8px", fontSize: "var(--text-base)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-700)" }}>• {f}</p>
              ))}
            </div>
          ) : null}

          {card?.better_sentences?.length ? (
            <div style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-xl)", padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-success)", marginBottom: 12 }}>Say it better</div>
              {card.better_sentences.map((b, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", textDecoration: "line-through" }}>{b.you_said}</div>
                  <div style={{ fontSize: "var(--text-base)", color: "var(--color-neutral-1000)", fontWeight: 600 }}>{b.say_instead}</div>
                </div>
              ))}
            </div>
          ) : null}

          {card?.practise_next ? (
            <div style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-xl)", padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-amber-600)", marginBottom: 6 }}>Before next time</div>
              <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-700)" }}>{card.practise_next}</p>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setState("idle")} className="lc-btn lc-success" style={{ background: "var(--color-success)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius-lg)", padding: "14px 24px", fontSize: "var(--text-md)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Another lesson
            </button>
            <Link href="/speak" onClick={onExit} className="lc-btn lc-ghost" style={{ background: "var(--color-neutral-0)", color: "var(--color-neutral-700)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-lg)", padding: "14px 24px", fontSize: "var(--text-md)", fontWeight: 600, textDecoration: "none", fontFamily: "inherit" }}>
              Back to Speaking
            </Link>
          </div>
        </div>
      </LucidaScope>
    );
  }

  // ---- live lesson (Lucida) ----
  const persona = personaById(voice);
  const micGlow = Math.min(1, level * 9);
  return (
    <LucidaScope
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        background: `radial-gradient(ellipse 900px 500px at 50% 0%, ${persona.glow}, transparent 70%), var(--color-neutral-0)`,
      }}
    >
      <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", padding: "20px 26px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 16px", borderBottom: "1px solid var(--color-neutral-200)", marginBottom: 26 }}>
          <button onClick={() => setConfirmEnd(true)} className="lc-tab" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-neutral-500)", padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
            Speaking
          </button>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--color-success-bg)", color: "var(--color-success)", borderRadius: "var(--radius-pill)", padding: "8px 16px", fontSize: "var(--text-sm)", fontWeight: 600 }}>
            <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-success)", animation: "lcDotPulse 1.4s ease-in-out infinite" }} />
            Lesson · not scored
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-neutral-600)", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
            {mmss} <span style={{ color: "var(--color-neutral-400)" }}>/ 20:00</span>
          </span>
        </div>

        <div style={{ textAlign: "center", marginTop: "min(6vh, 48px)" }}>
          <div style={{ display: "inline-block", borderRadius: "50%", boxShadow: listening && !speaking ? `0 0 0 ${8 + micGlow * 16}px ${persona.tint}` : "none", transition: "box-shadow .12s ease-out" }}>
            <PersonaAvatar initial={persona.initial} accent={persona.accent} glow={persona.glow} size={128} ring={speaking} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 4 }}>
            <WaveBars color={persona.accent} active={speaking || listening} />
          </div>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-neutral-1000)" }}>
            {speaking
              ? `${persona.name} is speaking`
              : thinking
                ? "Thinking…"
                : holding
                  ? "Listening — release when you're done"
                  : listening
                    ? handsFree ? "Your turn — just talk" : "Your turn — hold to talk"
                    : "One moment…"}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--color-neutral-500)" }}>
            {listening
              ? handsFree
                ? "Pause when you're done and I'll pick it up"
                : "Hold the button (or the spacebar) while you speak"
              : speaking
                ? "You can cut in any time"
                : " "}
          </p>
        </div>

        {/* Deliberately no running transcript: this is a SPOKEN lesson. The only
            thing worth reading mid-lesson is the one correction just made; it
            fades with the next turn. Everything else waits for the lesson card. */}
        {lastCorrection || lastUpgrade ? (
          <div style={{ margin: "26px auto 0", maxWidth: 560, width: "100%", display: "grid", gap: 10 }}>
            {lastCorrection ? (
              <div style={{ background: "var(--color-neutral-0)", border: "1px solid rgba(218,119,86,0.28)", borderRadius: "var(--radius-xl)", padding: "16px 20px", fontSize: "var(--text-md)", lineHeight: "var(--lh-relaxed)", boxShadow: "var(--shadow-1)" }}>
                <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-amber-600)", marginBottom: 8 }}>A small fix</div>
                <div style={{ color: "var(--color-neutral-500)", textDecoration: "line-through", marginBottom: 4 }}>{lastCorrection.they_said}</div>
                <div style={{ color: "var(--color-neutral-1000)", fontWeight: 600 }}>{lastCorrection.better}</div>
              </div>
            ) : null}
            {lastUpgrade ? (
              <div style={{ background: "var(--color-neutral-0)", border: "1px solid rgba(22,163,74,0.28)", borderRadius: "var(--radius-xl)", padding: "16px 20px", fontSize: "var(--text-md)", lineHeight: "var(--lh-relaxed)", boxShadow: "var(--shadow-1)" }}>
                <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-success)", marginBottom: 8 }}>Say it better</div>
                {lastUpgrade.they_said ? (
                  <div style={{ color: "var(--color-neutral-500)", marginBottom: 4 }}>{lastUpgrade.they_said}</div>
                ) : null}
                <div style={{ color: "var(--color-neutral-1000)", fontWeight: 600 }}>{lastUpgrade.better}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: "16px 0 0", textAlign: "center" }}>{error}</p>
        ) : null}

        {!handsFree ? (
          <div style={{ display: "grid", placeItems: "center", marginTop: 26 }}>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                press();
              }}
              onPointerUp={release}
              onPointerLeave={release}
              onPointerCancel={release}
              disabled={speaking || thinking}
              className="lc-btn"
              style={{
                width: "min(420px, 100%)", padding: "20px 26px", borderRadius: "var(--radius-pill)",
                border: `2px solid ${holding ? "var(--color-success)" : "var(--color-neutral-200)"}`,
                background: holding ? "var(--color-success)" : "var(--color-neutral-0)",
                color: holding ? "#FFFFFF" : speaking || thinking ? "var(--color-neutral-400)" : "var(--color-neutral-1000)",
                fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "inherit",
                cursor: speaking || thinking ? "default" : "pointer",
                touchAction: "none", userSelect: "none",
                boxShadow: holding ? "0 8px 26px rgba(22,163,74,.30)" : "none",
                transform: holding ? "scale(0.99)" : "none",
              }}
            >
              {holding ? "Release to send" : "Hold to talk"}
            </button>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}>
          <button onClick={() => setHandsFree((v) => !v)} className="lc-btn lc-ghost" style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-pill)", padding: "12px 20px", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--color-neutral-600)" }}>
            {handsFree ? "Switch to hold-to-talk" : "Switch to hands-free"}
          </button>
          <button onClick={() => send({ type: "skip" })} className="lc-btn lc-ghost" style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-pill)", padding: "12px 20px", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--color-neutral-600)" }}>
            Skip this question
          </button>
          <button onClick={() => setConfirmEnd(true)} className="lc-btn lc-danger" style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-pill)", padding: "12px 20px", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--color-error)" }}>
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
        <p style={{ margin: "auto 0 0", paddingTop: 26, textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-neutral-400)" }}>
          Original AI tutor · not affiliated with IELTS®
        </p>
      </div>
    </LucidaScope>
  );
}
