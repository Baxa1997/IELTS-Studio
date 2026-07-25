"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { checkMicAccess, startMic, VoicePlayer } from "./audio";
import { ConfirmQuit } from "./confirm-quit";
import { LucidaScope, PERSONAS, PersonaAvatar, personaById, WaveBars } from "./lucida";

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

/** Small head start before a turn plays. The engine sends each reply as one
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

interface CueCard {
  title: string;
  bullets: string[];
  closing: string;
}

// Which language the tutor EXPLAINS in when it teaches. English stays the
// practice language either way; this only controls the scaffolding. "auto" lets
// the tutor follow whatever the learner speaks — fine for a confident learner,
// but a beginner who needs Uzbek had no way to say so before this control.
type SupportLanguage = "auto" | "en" | "uz" | "ru";
const SUPPORT_LANGUAGES: { id: SupportLanguage; label: string; short: string }[] = [
  { id: "auto", label: "Follow me", short: "Auto" },
  { id: "en", label: "English only", short: "EN" },
  { id: "uz", label: "O'zbekcha", short: "UZ" },
  { id: "ru", label: "Русский", short: "RU" },
];

function wsUrl(
  mode: Mode, token: string, voice: string, context: string,
  supportLanguage: SupportLanguage,
): string {
  const base = clientEnv.aiBackendUrl ?? "";
  const q = new URLSearchParams({
    token, mode, voice, support_language: supportLanguage,
    ...(context ? { context } : {}),
  });
  return `${base.replace(/^http/, "ws")}/speaking/tutor/live?${q.toString()}`;
}

// ONE choice of what to practise, not two overlapping ones. Each kind carries
// the engine's question-spine `mode` and its context slug (speaking/tutor.py
// CONTEXT_GOALS). IELTS is a single option here — no Part 1/2/3 split, the owner
// didn't want it — and Free conversation leads and is the default, so IELTS is
// chosen, never imposed ("IELTS must be choosable", owner 2026-07-24).
type Kind = { id: string; label: string; detail: string; mode: Mode; context: string; accent: string };
const KINDS: Kind[] = [
  { id: "free", label: "Free conversation", detail: "Just talk — the tutor keeps it going and gently improves your English.", mode: "free", context: "", accent: "var(--color-success)" },
  { id: "ielts", label: "The IELTS exam", detail: "Exam-style questions with band-raising coaching.", mode: "part1", context: "ielts", accent: "var(--color-primary-600)" },
  { id: "friends", label: "Talking with friends", detail: "Relaxed everyday chat and natural reactions.", mode: "free", context: "friends", accent: "var(--color-info)" },
  { id: "presentation", label: "A presentation", detail: "Signposting and confident, structured delivery.", mode: "free", context: "presentation", accent: "var(--color-amber-600)" },
  { id: "interview", label: "A job interview", detail: "Classic questions and clear STAR-style answers.", mode: "free", context: "interview", accent: "var(--color-primary-600)" },
  { id: "everyday", label: "Everyday English", detail: "Shops, travel, appointments — practical language.", mode: "free", context: "everyday", accent: "var(--color-success)" },
];

// ---- room -------------------------------------------------------------------

export function TutorRoom({ onExit }: { onExit?: () => void }) {
  const [state, setState] = useState<"idle" | "connecting" | "live" | "ended">("idle");
  // One choice drives both the engine's question-spine `mode` and its context
  // slug. Defaults to free conversation so IELTS is chosen, never imposed.
  const [kindId, setKindId] = useState("free");
  const selectedKind = KINDS.find((k) => k.id === kindId) ?? KINDS[0];
  const [voice, setVoice] = useState("daniel");
  const [supportLanguage, setSupportLanguage] = useState<SupportLanguage>(
    () =>
      (typeof window === "undefined"
        ? "auto"
        : ((localStorage.getItem("tutorSupportLanguage") as SupportLanguage) ?? "auto")),
  );
  const [lines, setLines] = useState<Line[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<LessonCard | null>(null);
  const [cueCard, setCueCard] = useState<CueCard | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showConversation, setShowConversation] = useState(false);
  // The lesson card is written by an LLM after the last turn; say so instead of
  // leaving the room looking frozen.
  const [wrappingUp, setWrappingUp] = useState(false);

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
  const endingRef = useRef(false);

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
    setCueCard(null);
    setElapsed(0);
    setShowConversation(false);
    endingRef.current = false;
    try {
      await checkMicAccess();
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session expired — please sign in again.");

      const player = new VoicePlayer({ leadS: JITTER_LEAD_S, gapS: 0.02 });
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

      const ws = new WebSocket(
        wsUrl(selectedKind.mode, token, voice, selectedKind.context, supportLanguage),
      );
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
            // The engine's field is `cue_card` (speaking/tutor.py run()); reading
            // `card` here meant the cue card never rendered.
            setCueCard((ev.cue_card as CueCard) ?? null);
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
          case "interrupt":
            // The engine heard the learner talking over the tutor and has
            // handed them the floor. Stop mid-sentence, like a person would,
            // and never report the rest of the turn as played.
            pendingSeqRef.current = null;
            player.stop();
            break;
          case "settings":
            if (typeof ev.support_language === "string") {
              setSupportLanguage(ev.support_language as SupportLanguage);
            }
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

      const mic = await startMic((pcm) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(pcm);
      }, setLevel);
      stopMicRef.current = mic.stop;
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

  // The moment a beginner realises they need Uzbek is MID-lesson, so this is
  // changeable live, not only on the setup screen. The engine acknowledges with
  // a `settings` event.
  useEffect(() => {
    localStorage.setItem("tutorSupportLanguage", supportLanguage);
    if (state !== "live") return;
    send({ type: "support_language", language: supportLanguage });
  }, [supportLanguage, state]);

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
    if (endingRef.current) return;
    endingRef.current = true;
    setWrappingUp(true);
    send({ type: "stop" });
    // The engine writes the lesson card with an LLM call AFTER the socket's
    // last turn, which routinely outruns a few seconds. Bailing out at 8s tore
    // the room down mid-write and left the learner staring at "Lesson complete"
    // and nothing else, after twenty minutes of work.
    setTimeout(() => {
      if (state !== "ended") {
        teardown();
        setState("ended");
      }
    }, 25000);
  };

  // The backend also enforces the cap, but ending locally keeps the UI honest
  // if the socket is quiet or the last turn never arrives.
  useEffect(() => {
    if (state === "live" && elapsed >= 20 * 60) end();
    // `end` intentionally closes over the current socket/state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, state]);

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  // The most recent teach card stays up until a NEWER one replaces it — a turn
  // without a card (a "didn't catch that", a nudge) must not blank the sentence
  // the learner is trying to read ("make sure it always show up", owner).
  const lastCarded = [...lines].reverse().find((l) => l.who === "tutor" && (l.correction || l.upgrade));
  const lastCorrection = lastCarded?.correction ?? null;
  const lastUpgrade = lastCarded?.upgrade ?? null;
  // The transcript shows ENGLISH ONLY. Uzbek/Russian turns are still spoken
  // aloud, but their text is not displayed — the learner reads only the
  // recommended English sentence (the card below). Seeing their own Uzbek or the
  // tutor's Uzbek scaffolding on screen was noise ("do not show it, only show
  // the recommended english sentence", owner). English text (undefined = en)
  // still shows normally.
  const isEnglish = (lang?: string) => !lang || lang === "en";
  const lastTutorAny = [...lines].reverse().find((l) => l.who === "tutor" && l.text.trim());
  const lastTutorLine = lastTutorAny && isEnglish(lastTutorAny.language) ? lastTutorAny : undefined;
  const englishLines = lines.filter((l) => l.text.trim() && isEnglish(l.language));

  // ---- setup screen (Lucida tutor pick) ----
  if (state === "idle" || state === "connecting") {
    const selected = personaById(voice);
    return (
      <LucidaScope style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
        <div style={{ width: "100%", padding: "44px clamp(24px, 5vw, 72px) 72px" }}>
          <Link href="/speak" className="lc-tab" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-neutral-500)", textDecoration: "none", marginBottom: 24 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
            Speaking
          </Link>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-4xl)", color: "var(--color-neutral-1000)", letterSpacing: "var(--ls-snug)", marginBottom: 10 }}>
            Practise with your tutor
          </div>
          <p style={{ fontSize: "var(--text-md)", color: "var(--color-neutral-600)", maxWidth: 680, lineHeight: "var(--lh-relaxed)", margin: "0 0 32px" }}>
            Choose the kind of conversation you need, then speak normally. Your tutor keeps the lesson moving,
            corrects the most useful mistake, and gives you a stronger sentence to use straight away.
          </p>

          {/* One list, not two overlapping ones: what you want to practise —
              free chat, the IELTS exam, or a real-life situation. */}
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 12 }}>
            What do you want to practise?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 36 }}>
            {KINDS.map((item) => {
              const on = kindId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setKindId(item.id)}
                  className="lc-card-tap"
                  style={{
                    textAlign: "left", cursor: "pointer", fontFamily: "inherit", padding: "16px 18px",
                    borderRadius: "var(--radius-lg)", border: `1.5px solid ${on ? item.accent : "var(--color-neutral-200)"}`,
                    background: on ? "var(--color-neutral-0)" : "rgba(251,248,246,0.55)",
                    boxShadow: on ? "var(--shadow-1)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: on ? item.accent : "var(--color-neutral-800)" }}>{item.label}</span>
                    <span aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: on ? item.accent : "var(--color-neutral-300)", flexShrink: 0 }} />
                  </div>
                  <span style={{ display: "block", marginTop: 5, fontSize: "var(--text-xs)", lineHeight: "var(--lh-normal)", color: "var(--color-neutral-500)" }}>{item.detail}</span>
                </button>
              );
            })}
          </div>

          {/* English stays the practice language; this is the language the
              tutor EXPLAINS in when it teaches. Without it a beginner had no
              way to ask for Uzbek — the tutor could only guess from what they
              happened to say. */}
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 12 }}>
            Explain things to me in
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {SUPPORT_LANGUAGES.map((item) => {
              const on = supportLanguage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSupportLanguage(item.id)}
                  className="lc-btn lc-ghost"
                  style={{
                    padding: "10px 18px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: "var(--text-sm)", fontWeight: 600,
                    border: `1.5px solid ${on ? "var(--color-primary-600)" : "var(--color-neutral-200)"}`,
                    background: on ? "var(--color-neutral-0)" : "rgba(251,248,246,0.55)",
                    color: on ? "var(--color-primary-600)" : "var(--color-neutral-600)",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-500)", margin: "0 0 36px" }}>
            You always practise in English — this only changes the language your tutor explains in.
          </p>

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
            {state === "connecting" ? "Connecting…" : `Start ${selectedKind.label.toLowerCase()} with ${selected.name}`}
          </button>
          <p style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-neutral-500)", marginTop: 12 }}>
            Uses your microphone · up to 20 minutes · not scored · you can change the conversation mode next time
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

          {/* The write-up is an LLM call and can fail. The practice still
              counted and the session is stored — say so, rather than showing
              "Lesson complete" above an empty page. */}
          {!card?.headline && !card?.focus?.length && !card?.better_sentences?.length && !card?.practise_next ? (
            <div style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-xl)", padding: "18px 20px", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-700)" }}>
                Your practice is saved, but the written summary didn&rsquo;t come through this
                time. The minutes still counted, and the lesson is in your Speaking history.
              </p>
            </div>
          ) : null}

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

  // ---- live lesson (Lucida) — the full-viewport takeover, same skeleton as the
  //      exam room: top bar / centre stage / bottom dock, with all animations ----
  const persona = personaById(voice);
  const micGlow = Math.min(1, level * 9);
  return (
    <LucidaScope
      style={{
        position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column",
        background: `radial-gradient(ellipse 900px 500px at 50% 0%, ${persona.glow}, transparent 70%), var(--color-neutral-0)`,
      }}
    >
      {/* top bar */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 24px", borderBottom: "1px solid var(--color-neutral-200)" }}>
        <button onClick={() => setConfirmEnd(true)} className="lc-btn lc-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-neutral-200)", background: "var(--color-neutral-0)", color: "var(--color-neutral-600)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          Exit
        </button>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--color-success-bg)", color: "var(--color-success)", borderRadius: "var(--radius-pill)", padding: "8px 18px", fontSize: "var(--text-sm)", fontWeight: 600, whiteSpace: "nowrap" }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-success)", animation: "lcDotPulse 1.4s ease-in-out infinite" }} />
          Lesson · not scored
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: "var(--text-md)", color: "var(--color-neutral-1000)", fontVariantNumeric: "tabular-nums", fontWeight: 500, whiteSpace: "nowrap" }}>
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
          {mmss} <span style={{ color: "var(--color-neutral-400)" }}>/ 20:00</span>
        </span>
      </div>

      {/* centre stage — `margin:auto` on the inner column (not justify-content)
          so a short lesson centres but a tall one (many cards) top-aligns and
          scrolls instead of clipping the avatar off the top. */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "min(620px, 100%)", margin: "auto", padding: "26px 24px 30px", textAlign: "center" }}>
          {/* Avatar sits ON TOP, the category label centred BELOW it — they were
              inline siblings before, so they rendered side by side and overlapped. */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ display: "inline-block", borderRadius: "50%", boxShadow: listening && !speaking ? `0 0 0 ${8 + micGlow * 16}px ${persona.tint}` : "none", transition: "box-shadow .12s ease-out" }}>
              <PersonaAvatar initial={persona.initial} accent={persona.accent} glow={persona.glow} size={128} ring={speaking} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 11px", borderRadius: "var(--radius-pill)", background: "var(--color-success-bg)", color: "var(--color-success)", fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase" }}>
              {selectedKind.label}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18, marginBottom: 4 }}>
            <WaveBars color={persona.accent} active={speaking || listening} />
          </div>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-neutral-1000)" }}>
            {wrappingUp
              ? "Writing up your lesson…"
              : speaking
              ? `${persona.name} is speaking`
              : thinking
                ? "Thinking…"
                : holding
                  ? "Listening — release when you're done"
                  : listening
                    ? handsFree ? "Your turn — just talk" : "Your turn — hold to talk"
                    : "One moment…"}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--color-neutral-500)", minHeight: 20 }}>
            {wrappingUp
              ? "This takes a few seconds — please don't close the tab"
              : listening
              ? handsFree
                ? "Pause when you're done and I'll pick it up"
                : "Hold the button (or the spacebar) while you speak"
              : speaking
                ? "You can cut in any time"
                : " "}
          </p>

          {cueCard ? (
            <div style={{ margin: "20px auto 0", maxWidth: 560, width: "100%", textAlign: "left", background: "rgba(218,119,86,0.08)", border: "1px solid rgba(218,119,86,0.25)", borderRadius: "var(--radius-xl)", padding: "16px 18px" }}>
              <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-amber-600)", marginBottom: 7 }}>Cue card · use these notes</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-neutral-1000)" }}>{cueCard.title}</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--color-neutral-700)", fontSize: "var(--text-sm)", lineHeight: "var(--lh-relaxed)" }}>
                {cueCard.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
              <div style={{ marginTop: 6, fontSize: "var(--text-sm)", color: "var(--color-neutral-700)" }}>{cueCard.closing}</div>
            </div>
          ) : null}

          {/* Only the tutor's latest ENGLISH line is shown — no "you said" (it
              went stale showing an old English turn while the current one was
              Uzbek, and the learner does not need to read back their own words). */}
          {lastTutorLine ? (
            <div style={{ margin: "22px auto 0", maxWidth: 560, width: "100%", textAlign: "left" }}>
              <div style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "14px 14px 14px 5px", padding: "11px 14px", boxShadow: "var(--shadow-1)" }}>
                <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: persona.accent, marginBottom: 4 }}>{persona.name} said</div>
                <div style={{ fontSize: "var(--text-sm)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-800)" }}>{lastTutorLine.text}</div>
              </div>
            </div>
          ) : null}

          {/* No running transcript (a SPOKEN lesson) — only the latest teach
              card, right under the exchange so it is the thing you read; it
              stays up until the next card replaces it. */}
          {lastCorrection || lastUpgrade ? (
            <div style={{ margin: "26px auto 0", maxWidth: 560, width: "100%", display: "grid", gap: 10, textAlign: "left" }}>
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

          {/* The full back-scroll lives last — least-used, so it never pushes
              the teach card down the page. */}
          {englishLines.length > 2 ? (
            <div style={{ margin: "18px auto 0", maxWidth: 560, width: "100%", display: "grid", gap: 8 }}>
              <button type="button" onClick={() => setShowConversation((v) => !v)} className="lc-btn lc-ghost" style={{ justifySelf: "center", border: "none", background: "transparent", color: "var(--color-neutral-500)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: "3px 8px" }}>
                {showConversation ? "Hide conversation" : `See conversation · ${englishLines.length} turns`}
              </button>
              {showConversation ? (
                <div style={{ maxHeight: 180, overflowY: "auto", display: "grid", gap: 6, padding: "8px 10px", background: "rgba(243,237,233,0.55)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-lg)", textAlign: "left" }}>
                  {englishLines.slice(-8).map((line, index) => (
                    <div key={`${line.who}-${index}`} style={{ fontSize: "var(--text-xs)", lineHeight: "var(--lh-normal)", color: line.who === "tutor" ? "var(--color-neutral-700)" : "var(--color-success)" }}>
                      <strong>{line.who === "tutor" ? persona.name : "You"}:</strong> {line.text}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: "16px 0 0" }}>{error}</p>
          ) : null}
        </div>
      </div>

      {/* bottom dock: talk affordance + controls */}
      <div style={{ flex: "none", borderTop: "1px solid var(--color-neutral-200)", background: "rgba(251,248,246,0.85)", backdropFilter: "blur(16px)", padding: "18px 24px calc(20px + env(safe-area-inset-bottom))" }}>
        <div style={{ width: "min(620px, 100%)", margin: "0 auto" }}>
          {!handsFree ? (
            <div style={{ display: "grid", placeItems: "center", marginBottom: 16 }}>
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
                  width: "min(420px, 100%)", padding: "18px 26px", borderRadius: "var(--radius-pill)",
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

          {/* Live support-language switch: the moment a learner gets stuck is
              exactly when they need to ask for their own language, and leaving
              the lesson to change it is not an option. */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--color-neutral-400)", marginRight: 2 }}>
              Explain in
            </span>
            {SUPPORT_LANGUAGES.map((item) => {
              const on = supportLanguage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSupportLanguage(item.id)}
                  className="lc-btn lc-ghost"
                  title={item.label}
                  style={{
                    padding: "6px 12px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: "var(--text-2xs)", fontWeight: 700,
                    border: `1px solid ${on ? "var(--color-primary-600)" : "var(--color-neutral-200)"}`,
                    background: on ? "var(--color-neutral-0)" : "transparent",
                    color: on ? "var(--color-primary-600)" : "var(--color-neutral-500)",
                  }}
                >
                  {item.short}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setHandsFree((v) => !v)} className="lc-btn lc-ghost" style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-pill)", padding: "10px 18px", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--color-neutral-600)" }}>
              {handsFree ? "Switch to hold-to-talk" : "Switch to hands-free"}
            </button>
            <button onClick={() => send({ type: "skip" })} className="lc-btn lc-ghost" style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-pill)", padding: "10px 18px", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--color-neutral-600)" }}>
              Move on
            </button>
            <button onClick={() => setConfirmEnd(true)} className="lc-btn lc-danger" style={{ background: "var(--color-neutral-0)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-pill)", padding: "10px 18px", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--color-error)" }}>
              End lesson
            </button>
          </div>
          <p style={{ margin: "14px 0 0", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-neutral-400)" }}>
            Original AI tutor · not affiliated with IELTS®
          </p>
        </div>
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
    </LucidaScope>
  );
}
