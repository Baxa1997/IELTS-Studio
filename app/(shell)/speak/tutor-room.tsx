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

type Mode = "part1" | "part3" | "cue_card" | "free" | "chat";

type Swap = { they_said: string; better: string };

interface Line {
  who: "you" | "tutor";
  text: string;
  language?: string;
  correction?: Swap | null;   // a mistake, fixed
  upgrade?: Swap | null;      // correct English, made better — the main lesson
  explanation?: string | null;  // WHY, in the support language
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
  mode: Mode, token: string, voice: string, purpose: string,
  supportLanguage: SupportLanguage, role: string,
): string {
  const base = clientEnv.aiBackendUrl ?? "";
  const q = new URLSearchParams({
    token, mode, voice, support_language: supportLanguage, purpose,
    ...(role ? { role } : {}),
    // `context` is the engine's older name for the same thing. Sent as well so
    // an app deployed ahead of the engine still lands on the right purpose
    // instead of silently falling back to general.
    ...(purpose !== "general" ? { context: purpose } : {}),
  });
  return `${base.replace(/^http/, "ws")}/speaking/tutor/live?${q.toString()}`;
}

// PURPOSE — what the learner's English is FOR. The engine's registry
// (speaking/prompts.py PURPOSES) is the source of truth and ships the live
// catalogue on `ready`; this table exists only so the setup screen can render
// before a socket exists, and the engine's copy always wins.
//
// Purpose is a separate axis from `mode` (the SHAPE of the session), and it can
// be changed WHILE talking — that is the answer to "where do I show it during
// practice": in the room, any time, without dropping the conversation.
//
// `defaultMode` is a per-purpose starting point, not a lock. Everything is the
// ChatGPT-shaped free talk except IELTS, which genuinely is better served by
// the guided lesson — an exam rewards drilled question types, and a learner
// preparing for one wants to be asked, not to lead.
type RoomTheme = "flow" | "stage" | "interview";
interface Purpose {
  id: string;
  label: string;
  mark: string;
  room: string;
  length: string;
  focus: string;
  tags: string[];
  theme: RoomTheme;
  accent: string;
  defaultMode: Mode;
}
const PURPOSES: Purpose[] = [
  { id: "general", label: "General English", mark: "G", room: "Open conversation", length: "10–20 min", theme: "flow", accent: "#8456EF", defaultMode: "chat",
    focus: "Range and accuracy in ordinary conversation — fewer basic words, cleaner tenses.",
    tags: ["Vocabulary range", "Tense accuracy", "Natural replies"] },
  { id: "everyday", label: "Everyday situations", mark: "E", room: "Role-play", length: "10 min", theme: "flow", accent: "#DA7756", defaultMode: "chat",
    focus: "Fixed phrases that get things done, said at normal speed without translating first.",
    tags: ["Useful phrases", "Politeness", "Speed"] },
  { id: "presWork", label: "Presentation for work", mark: "P", room: "Stage", length: "15–20 min", theme: "stage", accent: "#7144D8", defaultMode: "chat",
    focus: "Structure an audience can follow, steady pace, and language that sounds senior.",
    tags: ["Signposting", "Pacing", "Executive tone"] },
  { id: "presGeneral", label: "Presentation practice", mark: "S", room: "Stage", length: "15 min", theme: "stage", accent: "#5E34BF", defaultMode: "chat",
    focus: "Speaking from three points instead of a script, and recovering when you lose your place.",
    tags: ["Three-point structure", "Recovery", "Delivery"] },
  { id: "interview", label: "Work interview", mark: "I", room: "Interview room", length: "20 min", theme: "interview", accent: "#3B82F6", defaultMode: "chat",
    focus: "Real interview questions for your actual job, answered in clear English and in STAR order.",
    tags: ["STAR answers", "Questions for your job", "Follow-ups"] },
  { id: "ielts", label: "IELTS coaching", mark: "B", room: "Coached exam", length: "20 min", theme: "flow", accent: "#22C55E", defaultMode: "part1",
    focus: "Answers long enough for Part 1, a full two minutes in Part 2, and reasons in Part 3.",
    tags: ["Part 2 timing", "Reasons", "Band-7 phrasing"] },
  { id: "friends", label: "Talking with friends", mark: "F", room: "Café", length: "10 min", theme: "flow", accent: "#F09070", defaultMode: "chat",
    focus: "Sounding relaxed: contractions, short reactions, and following a fast topic change.",
    tags: ["Contractions", "Reactions", "Small talk"] },
];
const DEFAULT_PURPOSE = "general";
// Slugs that used to mean something. Mirrors the engine's own alias table so a
// bookmarked link lands where the learner expected instead of on general.
const PURPOSE_ALIASES: Record<string, string> = { presentation: "presWork", talk: "general" };
function purposeById(id: string): Purpose {
  const key = PURPOSE_ALIASES[id] ?? id;
  return PURPOSES.find((p) => p.id === key) ?? PURPOSES[0];
}

/** The room's palette for one purpose.
 *
 *  Three rooms, not one recoloured room: presenting happens on a DARK stage
 *  under a spotlight, an interview across a cool formal desk, and everything
 *  else in a warm conversational space. The design's point is that the room
 *  should tell you what you are practising before you read a word of it. */
function roomTheme(p: Purpose) {
  const dark = p.theme === "stage";
  return {
    dark,
    accent: dark ? "#C8AAFF" : p.accent,
    bg: dark
      ? "radial-gradient(900px 600px at 50% -10%, #2C2535 0%, #19151E 55%, #110E14 100%)"
      : p.theme === "interview"
        ? "radial-gradient(900px 560px at 78% -12%, #EEF4FF 0%, #F6F3F1 60%, #EFEAE7 100%)"
        : "radial-gradient(820px 520px at 18% -10%, #FFF6F0 0%, #FBF8F7 55%, #F1ECE9 100%)",
    ink: dark ? "#F5F0EE" : "#1A1520",
    ink2: dark ? "#A89AA4" : "#8C7F8A",
    line: dark ? "rgba(245,240,238,0.16)" : "#E6DCD7",
    card: dark ? "rgba(245,240,238,0.06)" : "rgba(255,253,252,0.86)",
    chipBg: dark ? "rgba(148,104,245,0.20)" : `${p.accent}1F`,
    tint: dark ? "rgba(245,240,238,0.05)" : "#F7F2EF",
    track: dark ? "rgba(245,240,238,0.14)" : "#EAE1DC",
    shadow: dark ? "rgba(0,0,0,0.55)" : "rgba(26,21,32,0.18)",
    glow: `${p.accent}55`,
    blobA: `${dark ? "#5E34BF" : p.accent}4D`,
    blobB: "#DA775633",
  };
}

// ---- room -------------------------------------------------------------------

export function TutorRoom({ onExit, initialKind }: { onExit?: () => void; initialKind?: string }) {
  const [state, setState] = useState<"idle" | "connecting" | "live" | "ended">("idle");
  // What they are practising FOR. Defaults to general English, so a lesson is
  // chosen and never imposed; the hub deep-links a tapped chip in as
  // `initialKind`, and otherwise we reopen on whatever they used last.
  const [purposeId, setPurposeId] = useState(() => {
    if (PURPOSES.some((p) => p.id === initialKind)) return initialKind!;
    if (typeof window === "undefined") return DEFAULT_PURPOSE;
    const saved = localStorage.getItem("tutorPurpose");
    return PURPOSES.some((p) => p.id === saved) ? saved! : DEFAULT_PURPOSE;
  });
  const selectedPurpose = purposeById(purposeId);
  // The catalogue the ENGINE reports on `ready`. It owns the real list; ours is
  // only what we can show before a socket exists.
  const [serverPurposes, setServerPurposes] = useState<{ id: string; label: string }[] | null>(null);
  // The job being prepared for. Free text — "backend engineer at a fintech",
  // "ICU nurse" — because any list we invented would be wrong for somebody.
  // Remembered: people interview for the same role over several sessions.
  const [role, setRole] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("tutorRole") ?? "",
  );
  // The tutor is MATCHED, not picked from a line-up. Choosing between four
  // strangers is a decision nobody has the information to make on their first
  // visit, so one is assigned and "Match another" reshuffles. The match sticks
  // for the session (state, not a render-time random) and across visits, so
  // "my tutor" means something.
  const [voice, setVoice] = useState(() => {
    if (typeof window === "undefined") return "daniel";
    const saved = localStorage.getItem("tutorVoice");
    if (saved && PERSONAS.some((p) => p.id === saved)) return saved;
    return PERSONAS[Math.floor(Math.random() * PERSONAS.length)].id;
  });
  const rematchTutor = () => {
    const others = PERSONAS.filter((p) => p.id !== voice);
    const next = others[Math.floor(Math.random() * others.length)];
    if (next) setVoice(next.id);
  };
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
  // Live counters for the room's rail, straight from the engine's `stats`
  // event. Everything here is MEASURED — see tutor.py `_live_stats`.
  const [stats, setStats] = useState<{ corrections: number; phrases: number; spoke_pct: number; wpm: number | null } | null>(null);

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
        wsUrl(selectedPurpose.defaultMode, token, voice, selectedPurpose.id, supportLanguage, role),
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
            // The engine owns the purpose catalogue; take its list and its idea
            // of which one is active rather than trusting our own copy.
            if (Array.isArray(ev.purposes)) {
              setServerPurposes(ev.purposes as { id: string; label: string }[]);
            }
            if (typeof ev.purpose === "string") setPurposeId(ev.purpose);
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
                explanation: typeof ev.explanation === "string" ? ev.explanation : null,
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
            // Echo of a live change — the engine confirming what it APPLIED,
            // which is what the UI should reflect, not what we asked for.
            if (typeof ev.support_language === "string") {
              setSupportLanguage(ev.support_language as SupportLanguage);
            }
            if (typeof ev.purpose === "string") setPurposeId(ev.purpose);
            break;
          case "stats":
            setStats({
              corrections: Number(ev.corrections ?? 0),
              phrases: Number(ev.phrases ?? 0),
              spoke_pct: Number(ev.spoke_pct ?? 0),
              wpm: typeof ev.wpm === "number" ? ev.wpm : null,
            });
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

  // Purpose is changeable MID-conversation. A learner works out what they need
  // by talking ("actually, can we do interview questions?"), and making them
  // hang up and reconnect to say so would throw away the history that makes the
  // tutor worth talking to. The engine picks it up on its next turn.
  useEffect(() => {
    localStorage.setItem("tutorPurpose", purposeId);
    if (state !== "live") return;
    send({ type: "purpose", purpose: purposeId });
  }, [purposeId, state]);

  // Told mid-lesson ("actually it's a data role"), the tutor should use it from
  // its next question — same live path as a purpose switch.
  useEffect(() => {
    localStorage.setItem("tutorRole", role);
    if (state !== "live") return;
    send({ type: "role", role });
  }, [role, state]);

  // Remember who they were matched with, so "my tutor" survives a reload
  // instead of reshuffling into a stranger every visit.
  useEffect(() => {
    localStorage.setItem("tutorVoice", voice);
  }, [voice]);

  // What the switcher offers: the engine's catalogue once connected, ours
  // before that. Labelled from our copy where we have one, so a purpose we
  // know about reads the same on both screens.
  const purposeChoices = (serverPurposes ?? PURPOSES).map((p) => ({
    id: p.id,
    label: PURPOSES.find((local) => local.id === p.id)?.label ?? p.label,
  }));

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
  // The WHY behind the card, in the learner's support language. It belongs to
  // the same turn as the card, so it moves and clears with it.
  const lastExplanation = lastCarded?.explanation ?? null;
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

  // ---- setup screen (Lucida) ----
  // The purpose is the HEADLINE here, not a field: you arrive having already
  // said what you are practising for (a chip on the hub), so this screen's job
  // is to introduce the tutor who will do it and get out of the way.
  //
  // The tutor is MATCHED rather than picked, with a reroll — the same move the
  // design makes for the exam. Choosing between four strangers is a decision
  // nobody has the information to make on their first visit.
  if (state === "idle" || state === "connecting") {
    const selected = personaById(voice);
    // Deliberately NOT themed by purpose. Only the practice itself changes
    // room — a setup screen that goes dark the moment you tap "Presentation"
    // reads as a bug, and it made its own title unreadable (dark ink on the
    // dark stage gradient). The purpose shows up here only in the accent.
    return (
      <LucidaScope className="lucida-fill" style={{ background: "#FFFFFF", color: "#1A1520" }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "clamp(20px, 3vh, 32px) clamp(24px, 5vw, 64px) 48px" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <Link href="/speak" className="lc-tab" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-neutral-600)", textDecoration: "none" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 18l-6-6 6-6" /></svg>
            Speaking
          </Link>

          <h1 style={{ margin: "18px 0 0", fontFamily: "var(--font-display)", fontSize: "var(--text-5xl)", fontWeight: 700, letterSpacing: "var(--ls-tight)", lineHeight: "var(--lh-tight)", color: "var(--color-neutral-1000)" }}>
            {selectedPurpose.label}
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "var(--text-md)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-600)", maxWidth: 560 }}>
            {selectedPurpose.focus}
          </p>

          <div className="lc-setup-grid" style={{ marginTop: 26 }}>
            {/* matched tutor */}
            <div style={{ background: "rgba(255,253,252,0.9)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-2xl)", padding: 26 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-caps)", color: "var(--color-amber-600)" }}>YOUR TUTOR TODAY</span>
                <button type="button" onClick={rematchTutor} className="lc-btn lc-ghost" style={{ border: "none", background: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-neutral-500)", cursor: "pointer" }}>
                  Match another
                </button>
              </div>
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16 }}>
                <PersonaAvatar initial={selected.initial} accent={selected.accent} glow={selected.glow} size={58} />
                <div>
                  <div style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-neutral-1000)" }}>{selected.name}</div>
                  <div style={{ marginTop: 3, fontSize: "var(--text-sm)", fontWeight: 600, color: selected.accent }}>{selected.tutorTrait}</div>
                </div>
              </div>
              <p style={{ margin: "14px 0 0", fontSize: "var(--text-base)", lineHeight: "var(--lh-normal)", color: "var(--color-neutral-600)" }}>{selected.tutorDesc}</p>
              <button
                type="button"
                onClick={() => void playSample(selected.id)}
                className="lc-btn lc-ghost"
                style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 15px", borderRadius: "var(--radius-pill)", border: "1px solid var(--color-neutral-200)", background: "transparent", fontFamily: "inherit", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-neutral-600)", cursor: "pointer" }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                {sampling === selected.id ? "Playing…" : "Hear this voice"}
              </button>
            </div>

            {/* support language + what this session is */}
            <div style={{ background: "rgba(255,253,252,0.9)", border: "1px solid var(--color-neutral-200)", borderRadius: "var(--radius-2xl)", padding: 26 }}>
              <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-caps)", color: "var(--color-neutral-500)" }}>EXPLAIN THINGS TO ME IN</div>
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SUPPORT_LANGUAGES.map((item) => {
                  const on = supportLanguage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSupportLanguage(item.id)}
                      className="lc-btn lc-ghost"
                      style={{
                        padding: "11px 18px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                        fontFamily: "inherit", fontSize: "var(--text-sm)", fontWeight: 600,
                        border: `1px solid ${on ? "var(--color-primary-500)" : "var(--color-neutral-200)"}`,
                        background: on ? "var(--color-primary-50)" : "var(--color-neutral-0)",
                        color: on ? "var(--color-primary-700)" : "var(--color-neutral-600)",
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "var(--text-xs)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-500)" }}>
                You always speak English. This only changes the language of corrections.
              </p>
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--color-neutral-100)", display: "flex", flexDirection: "column", gap: 8 }}>
                {([
                  ["Room", selectedPurpose.room],
                  ["Length", selectedPurpose.length],
                  ["Scoring", "Never scored"],
                ] as const).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                    <span style={{ color: "var(--color-neutral-500)" }}>{k}</span>
                    <span style={{ fontWeight: 600, color: "var(--color-neutral-800)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* The job being prepared for. Only for the interview: elsewhere a
              field is colour, here it decides which questions get asked. Free
              text, because any list of roles we wrote would be wrong for
              somebody. Blank is fine; the tutor opens by asking rather than
              running a generic interview. */}
          {selectedPurpose.id === "interview" ? (
            <div style={{ marginTop: 24 }}>
              <label
                htmlFor="tutor-role"
                style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-caps)", color: "var(--color-neutral-500)" }}
              >
                WHAT ROLE ARE YOU INTERVIEWING FOR?
              </label>
              <input
                id="tutor-role"
                value={role}
                onChange={(e) => setRole(e.target.value.slice(0, 120))}
                placeholder="e.g. backend engineer at a fintech, ICU nurse, maths teacher"
                style={{
                  marginTop: 10, width: "100%", maxWidth: 520, padding: "12px 14px",
                  borderRadius: "var(--radius-lg)", border: "1px solid var(--color-neutral-200)",
                  background: "var(--color-neutral-0)", color: "var(--color-neutral-1000)",
                  fontFamily: "inherit", fontSize: "var(--text-base)",
                }}
              />
              <p style={{ margin: "8px 0 0", fontSize: "var(--text-xs)", color: "var(--color-neutral-500)", maxWidth: 520, lineHeight: "var(--lh-normal)" }}>
                Your tutor asks the questions that interview really asks, in the words your job
                uses. It is English practice, not a technical test — you talk about your own work,
                and it coaches how clearly you said it.
              </p>
            </div>
          ) : null}

          {/* Changing your mind about the goal, without going back a screen.
              The same control lives inside the room, live. */}
          <div style={{ marginTop: 22, fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-caps)", color: "var(--color-neutral-500)" }}>
            PRACTISING FOR
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PURPOSES.map((item) => {
              const on = purposeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPurposeId(item.id)}
                  aria-pressed={on}
                  className="lc-btn lc-ghost"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 9,
                    padding: "10px 15px", borderRadius: "var(--radius-lg)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: "var(--text-sm)", fontWeight: 600,
                    border: `1px solid ${on ? item.accent : "var(--color-neutral-200)"}`,
                    background: on ? "var(--color-neutral-0)" : "rgba(255,253,252,0.6)",
                    color: on ? "var(--color-neutral-1000)" : "var(--color-neutral-600)",
                    boxShadow: on ? "0 0 0 3px rgba(26,21,32,0.05)" : "none",
                  }}
                >
                  <span aria-hidden style={{ width: 24, height: 24, borderRadius: "var(--radius-md)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: "var(--text-xs)", fontWeight: 700, background: on ? `${item.accent}1F` : "var(--color-neutral-50)", color: on ? item.accent : "var(--color-neutral-500)" }}>
                    {item.mark}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-neutral-500)" }}>
              Uses your microphone · you can change the goal at any time during the lesson.
            </p>
            <button
              onClick={() => void start()}
              disabled={state === "connecting"}
              className="lc-btn"
              style={{ padding: "15px 28px", borderRadius: "var(--radius-lg)", border: "none", color: "#FFFFFF", fontSize: "var(--text-md)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", background: selectedPurpose.accent, boxShadow: `0 8px 22px ${selectedPurpose.accent}55`, opacity: state === "connecting" ? 0.6 : 1 }}
            >
              {state === "connecting" ? "Connecting…" : `Start lesson with ${selected.name}  →`}
            </button>
          </div>

          {error ? <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: "16px 0 0" }}>{error}</p> : null}
          </div>
        </div>
      </LucidaScope>
    );
  }

  // ---- lesson card (Lucida) ----
  if (state === "ended") {
    return (
      <LucidaScope className="lucida-fill" style={{ background: "#FFFFFF" }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "clamp(20px, 3vh, 40px) clamp(24px, 5vw, 64px) 56px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
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
        </div>
      </LucidaScope>
    );
  }

  // ---- the room (Lucida) — a full-viewport takeover, THEMED BY PURPOSE ----
  // Three rooms, not one recoloured room. Presenting happens on a dark stage
  // under a spotlight; an interview across a cool, formal desk; everything else
  // in a warm conversational space. You should be able to tell what you are
  // practising before reading a word.
  const persona = personaById(voice);
  const micGlow = Math.min(1, level * 9);
  const th = roomTheme(selectedPurpose);
  const statusLine = wrappingUp
    ? "Writing up your lesson…"
    : speaking
      ? `${persona.name} is speaking`
      : thinking
        ? "Thinking…"
        : holding
          ? "Listening — release when you're done"
          : listening
            ? handsFree ? "Your turn — just talk" : "Your turn — hold to talk"
            : "One moment…";
  const statusHint = wrappingUp
    ? "This takes a few seconds — please don't close the tab"
    : listening
      ? handsFree
        ? "Pause when you're done and I'll pick it up"
        : "Hold the button (or the spacebar) while you speak"
      : speaking
        ? "Cut in whenever you like — this is a conversation, not a test."
        : " ";

  /** The tutor, breathing, at whatever size the room wants. */
  const avatar = (size: number) => (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center",
        color: "#FFFFFF", fontFamily: "var(--font-display)", fontWeight: 700,
        fontSize: size * 0.29, background: persona.accent,
        boxShadow: `0 18px 40px ${th.glow}`,
        animation: "lcBreathe 4s ease-in-out infinite",
        animationPlayState: speaking ? "running" : "paused",
      }}
    >
      {persona.initial}
    </div>
  );

  return (
    <LucidaScope
      style={{
        position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column",
        overflow: "hidden", background: th.bg, color: th.ink,
      }}
    >
      {/* Drifting light behind everything. Purely atmosphere — it carries no
          state, so it is aria-hidden and stops for reduced-motion. */}
      <div aria-hidden style={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", filter: "blur(70px)", top: -220, left: -140, opacity: 0.5, background: th.blobA, animation: "lcDrift 16s ease-in-out infinite", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", filter: "blur(80px)", bottom: -200, right: -120, opacity: 0.42, background: th.blobB, animation: "lcDrift 21s ease-in-out infinite", pointerEvents: "none" }} />

      {/* top bar */}
      <div style={{ position: "relative", flex: "none", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, padding: "18px 26px" }}>
        <div>
          <button onClick={() => setConfirmEnd(true)} className="lc-btn lc-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: "var(--radius-pill)", border: `1px solid ${th.line}`, background: "transparent", color: th.ink2, fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 6L6 18M6 6l12 12" /></svg>
            Leave
          </button>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 18px", borderRadius: "var(--radius-pill)", background: th.chipBg, color: th.accent, fontSize: "var(--text-sm)", fontWeight: 600, whiteSpace: "nowrap" }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: th.accent, animation: "lcDotPulse 1.4s ease-in-out infinite" }} />
          {selectedPurpose.label}
        </span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
          <span style={{ fontSize: "var(--text-xs)", color: th.ink2 }}>not scored</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-md)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{mmss}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: th.ink2 }}>/ 20:00</span>
        </div>
      </div>

      {/* stage + rail */}
      <div style={{ position: "relative", flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "10px 26px 0" }}>
        <div className="lc-room-grid" style={{ maxWidth: 1180, margin: "0 auto", minHeight: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, paddingBottom: 16, minHeight: 380 }}>

            {/* ── STAGE (presenting): a spotlight and a room to fill ── */}
            {selectedPurpose.theme === "stage" ? (
              <>
                <div style={{ position: "relative", width: "100%", maxWidth: 620, height: 250, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div aria-hidden style={{ position: "absolute", top: 0, width: 300, height: 225, clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0 100%)", background: "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))", animation: "lcSweep 6s ease-in-out infinite" }} />
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    {avatar(112)}
                    <div aria-hidden style={{ width: 230, height: 8, borderRadius: "50%", filter: "blur(6px)", background: th.shadow }} />
                  </div>
                </div>
                <div style={{ width: "100%", maxWidth: 620 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--ls-caps)", color: th.ink2 }}>DELIVERY STRUCTURE</div>
                  {/* Resting state, on purpose: the tutor does not yet report
                      which part of a talk you are in, and a bar that filled on
                      a guess would be worse than one that waits. */}
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {["Hook", "Point", "Evidence", "Close"].map((label) => (
                      <div key={label} style={{ padding: "12px 10px", borderRadius: "var(--radius-lg)", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: 600, background: th.card, color: th.ink2, border: `1px solid ${th.line}` }}>
                        {label}
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: "12px 0 0", fontSize: "var(--text-sm)", color: th.ink2, textAlign: "center" }}>
                    Take it in four beats — your tutor will tell you when one is missing.
                  </p>
                </div>
              </>
            ) : null}

            {/* ── INTERVIEW: a question across the desk ── */}
            {selectedPurpose.theme === "interview" ? (
              <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderRadius: "var(--radius-xl)", width: "100%", background: th.card, border: `1px solid ${th.line}` }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, display: "grid", placeItems: "center", color: "#FFFFFF", fontWeight: 700, fontSize: "var(--text-lg)", background: persona.accent, flexShrink: 0 }}>
                    {persona.initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--ls-caps)", color: th.ink2 }}>INTERVIEWER</div>
                    <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 600, lineHeight: "var(--lh-snug)" }}>
                      {lastTutorLine?.text ?? "Let's begin when you're ready."}
                    </div>
                  </div>
                </div>
                <WaveBars color={th.accent} active={speaking || listening} />
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: th.ink2, textAlign: "center" }}>
                  Answer in STAR order — situation, task, action, and the result.
                </p>
                <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {["Situation", "Task", "Action", "Result"].map((label) => (
                    <div key={label} style={{ padding: "14px 12px", borderRadius: "var(--radius-xl)", background: th.card, border: `1px solid ${th.line}` }}>
                      <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: th.ink2 }}>{label}</div>
                      <div aria-hidden style={{ marginTop: 8, height: 4, borderRadius: "var(--radius-pill)", background: th.track }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ── FLOW: a conversation, and nothing between you and it ── */}
            {selectedPurpose.theme === "flow" ? (
              <>
                <div style={{ position: "relative", width: 240, height: 240, display: "grid", placeItems: "center" }}>
                  {[0, 1.1, 2.2].map((delay) => (
                    <div key={delay} aria-hidden style={{ position: "absolute", inset: 24, borderRadius: "50%", border: `1px solid ${th.accent}`, animation: `lcRing 3.4s ease-out ${delay}s infinite`, animationPlayState: speaking || listening ? "running" : "paused", opacity: speaking || listening ? undefined : 0 }} />
                  ))}
                  <div aria-hidden style={{ position: "absolute", inset: 4, borderRadius: "50%", opacity: 0.35, background: `conic-gradient(from 0deg, transparent 0%, ${th.accent} 40%, transparent 70%)`, animation: "lcSpin 24s linear infinite" }} />
                  {avatar(126)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, maxWidth: 600 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 600, textAlign: "center", lineHeight: "var(--lh-snug)" }}>
                    {statusLine}
                  </div>
                  <div style={{ fontSize: "var(--text-base)", textAlign: "center", color: th.ink2, minHeight: 22 }}>{statusHint}</div>
                  {lastTutorLine ? (
                    <div style={{ marginTop: 6, padding: "18px 22px", borderRadius: "var(--radius-xl)", maxWidth: 540, background: th.card, border: `1px solid ${th.line}` }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--ls-caps)", color: th.accent, textTransform: "uppercase" }}>{persona.name} said</div>
                      <div style={{ marginTop: 8, fontSize: "var(--text-md)", lineHeight: "var(--lh-relaxed)" }}>{lastTutorLine.text}</div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {/* Status for the two themes that do not spell it out above — they
                have their own centrepiece, so it sits quietly underneath. */}
            {selectedPurpose.theme !== "flow" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600 }}>{statusLine}</div>
                <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: th.ink2, minHeight: 20 }}>{statusHint}</div>
              </div>
            ) : null}

            {cueCard ? (
              <div style={{ width: "100%", maxWidth: 560, textAlign: "left", background: th.card, border: `1px solid ${th.line}`, borderRadius: "var(--radius-xl)", padding: "16px 18px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-caps)", color: th.accent }}>CUE CARD · USE THESE NOTES</div>
                <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700 }}>{cueCard.title}</div>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: "var(--text-sm)", lineHeight: "var(--lh-relaxed)", color: th.ink2 }}>
                  {cueCard.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
                <div style={{ marginTop: 6, fontSize: "var(--text-sm)", color: th.ink2 }}>{cueCard.closing}</div>
              </div>
            ) : null}

            {error ? <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0 }}>{error}</p> : null}
          </div>

          {/* ── the coaching rail ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
            <div style={{ padding: "18px 20px", borderRadius: "var(--radius-xl)", background: th.card, border: `1px solid ${th.line}` }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--ls-caps)", color: th.ink2 }}>LESSON FOCUS</div>
              <p style={{ margin: "8px 0 0", fontSize: "var(--text-sm)", lineHeight: "var(--lh-normal)", color: th.ink2 }}>{selectedPurpose.focus}</p>
              <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selectedPurpose.tags.map((tag) => (
                  <span key={tag} style={{ padding: "6px 11px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-2xs)", fontWeight: 600, whiteSpace: "nowrap", background: th.chipBg, color: th.accent }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* LIVE COACHING — the one card the design puts at eye level, and
                the reason a learner leaves with something. Only rendered when
                the tutor has actually just taught something. */}
            {lastCorrection || lastUpgrade ? (
              <div style={{ padding: 20, borderRadius: "var(--radius-xl)", background: th.card, border: `1px solid ${th.line}`, animation: "lcFadeInUp 320ms ease-out" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--ls-caps)", color: th.ink2 }}>LIVE COACHING</div>
                <div style={{ marginTop: 14, padding: 14, borderRadius: "var(--radius-lg)", background: th.tint }}>
                  {(lastCorrection ?? lastUpgrade)?.they_said ? (
                    <>
                      <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wider)", color: "var(--color-amber-600)" }}>YOU SAID</div>
                      <div style={{ marginTop: 6, fontSize: "var(--text-base)", lineHeight: "var(--lh-normal)", textDecoration: lastCorrection ? "line-through" : "none", opacity: 0.65 }}>
                        {(lastCorrection ?? lastUpgrade)?.they_said}
                      </div>
                    </>
                  ) : null}
                  <div style={{ marginTop: 12, fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wider)", color: th.accent }}>STRONGER</div>
                  <div style={{ marginTop: 6, fontSize: "var(--text-md)", lineHeight: "var(--lh-normal)", fontWeight: 500 }}>
                    {(lastCorrection ?? lastUpgrade)?.better}
                  </div>
                </div>
                {lastExplanation ? (
                  <p style={{ margin: "12px 0 0", fontSize: "var(--text-xs)", lineHeight: "var(--lh-normal)", color: th.ink2 }}>{lastExplanation}</p>
                ) : null}
              </div>
            ) : null}

            <div style={{ padding: "18px 20px", borderRadius: "var(--radius-xl)", background: th.card, border: `1px solid ${th.line}` }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--ls-caps)", color: th.ink2 }}>THIS LESSON</div>
              {([
                ["Corrections", stats ? String(stats.corrections) : "—"],
                ["New phrases", stats ? String(stats.phrases) : "—"],
                ["You spoke", stats ? `${stats.spoke_pct}%` : "—"],
                // Absent until there is enough speech to mean anything — a
                // confident number off two words is just noise.
                ["Pace", stats?.wpm ? `${stats.wpm} wpm` : "—"],
              ] as const).map(([label, value]) => (
                <div key={label} style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <span style={{ opacity: 0.7 }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
                </div>
              ))}
            </div>

            {englishLines.length > 2 ? (
              <div style={{ padding: "14px 20px", borderRadius: "var(--radius-xl)", background: th.card, border: `1px solid ${th.line}` }}>
                <button type="button" onClick={() => setShowConversation((v) => !v)} className="lc-btn lc-ghost" style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: 0, fontFamily: "inherit", fontSize: "var(--text-xs)", fontWeight: 600, color: th.ink2, cursor: "pointer" }}>
                  {showConversation ? "Hide conversation" : `See conversation · ${englishLines.length} turns`}
                </button>
                {showConversation ? (
                  <div style={{ marginTop: 10, maxHeight: 220, overflowY: "auto", display: "grid", gap: 8 }}>
                    {englishLines.slice(-8).map((line, index) => (
                      <div key={`${line.who}-${index}`} style={{ fontSize: "var(--text-xs)", lineHeight: "var(--lh-normal)", color: line.who === "tutor" ? th.ink : th.accent }}>
                        <strong>{line.who === "tutor" ? persona.name : "You"}:</strong> {line.text}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* bottom dock */}
      <div style={{ position: "relative", flex: "none", padding: "14px 26px calc(24px + env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {!handsFree ? (
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
                border: `2px solid ${holding ? th.accent : th.line}`,
                background: holding ? th.accent : "transparent",
                color: holding ? (th.dark ? "#17131C" : "#FFFFFF") : speaking || thinking ? th.ink2 : th.ink,
                fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "inherit",
                cursor: speaking || thinking ? "default" : "pointer",
                touchAction: "none", userSelect: "none",
                transform: holding ? "scale(0.99)" : "none",
              }}
            >
              {holding ? "Release to send" : "Hold to talk"}
            </button>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", letterSpacing: "var(--ls-wider)", whiteSpace: "nowrap", color: th.ink2 }}>EXPLAIN IN</span>
            {SUPPORT_LANGUAGES.map((item) => {
              const on = supportLanguage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSupportLanguage(item.id)}
                  title={item.label}
                  className="lc-btn lc-ghost"
                  style={{
                    padding: "8px 14px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: "var(--text-xs)", fontWeight: 600, whiteSpace: "nowrap",
                    border: `1px solid ${on ? th.accent : th.line}`,
                    background: on ? th.chipBg : "transparent",
                    color: on ? th.accent : th.ink2,
                  }}
                >
                  {item.short}
                </button>
              );
            })}

            <span aria-hidden style={{ width: 1, height: 22, margin: "0 6px", background: th.line }} />

            <button
              type="button"
              onClick={() => setHandsFree((v) => !v)}
              title={handsFree ? "Switch to hold-to-talk" : "Switch to hands-free"}
              className="lc-btn"
              style={{
                width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center",
                border: "none", cursor: "pointer", color: th.dark ? "#17131C" : "#FFFFFF",
                background: th.accent, fontFamily: "inherit",
                boxShadow: listening && !speaking ? `0 0 0 ${4 + micGlow * 12}px ${th.chipBg}` : "none",
                transition: "box-shadow .12s ease-out",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
              </svg>
            </button>

            <button onClick={() => send({ type: "skip" })} className="lc-btn lc-ghost" style={{ padding: "13px 20px", borderRadius: "var(--radius-pill)", border: `1px solid ${th.line}`, background: "transparent", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: th.ink, whiteSpace: "nowrap" }}>
              Move on
            </button>
            <button onClick={() => setConfirmEnd(true)} className="lc-btn lc-danger" style={{ padding: "13px 20px", borderRadius: "var(--radius-pill)", border: `1px solid ${th.line}`, background: "transparent", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#EF4444", whiteSpace: "nowrap" }}>
              End lesson
            </button>
          </div>

          {/* Changing the goal WHILE talking — the conversation carries on and
              the tutor picks the new purpose up on its next turn. */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {purposeChoices.map((item) => {
              const on = purposeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPurposeId(item.id)}
                  aria-pressed={on}
                  className="lc-btn lc-ghost"
                  style={{
                    padding: "5px 10px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: "var(--text-2xs)", fontWeight: 600, whiteSpace: "nowrap",
                    border: `1px solid ${on ? th.accent : "transparent"}`,
                    background: "transparent",
                    color: on ? th.accent : th.ink2,
                    opacity: on ? 1 : 0.75,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: th.ink2, opacity: 0.7 }}>
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
