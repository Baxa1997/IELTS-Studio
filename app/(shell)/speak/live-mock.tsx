"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { checkMicAccess, type Mic, startMic, VoicePlayer } from "./audio";
import { ConfirmQuit } from "./confirm-quit";
// No PersonaAvatar here on purpose: the exam room shows an ORB, not a face.
// The tutor gets a person; an examiner should feel impersonal.
import { LucidaScope, PERSONAS, personaById, WaveBars, mmss, type Persona } from "./lucida";

/**
 * Full mock (Parts 1–3) — the LIVE examiner. A bidirectional WebSocket to the
 * engine: the browser streams 16 kHz mic PCM up, the engine streams the examiner's
 * 24 kHz voice + phase events back. The ENGINE owns the exam (part order, the prep
 * minute, the 2:00 cut, the 16-min cap) — this client just captures audio, plays
 * the examiner, and renders the room. No model is ever called from here.
 */


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
// The access token is NOT a query parameter: a URL ends up in the engine host's
// nginx access log, which would leave live bearer tokens sitting on disk for
// their whole ~1h lifetime. It travels in the handshake's subprotocol instead
// (see the engine's speaking/ws_auth.py), which nginx does not log.
function wsUrl(session_id: string, examiner: string): string {
  const base = clientEnv.aiBackendUrl ?? "";
  const ws = base.replace(/^http/, "ws"); // https→wss, http→ws
  const q = new URLSearchParams({ session_id, examiner });
  return `${ws}/speaking/live?${q.toString()}`;
}

/** `["bearer", <jwt>]` — the engine selects "bearer" back and reads the token. */
function wsProtocols(token: string): string[] {
  return ["bearer", token];
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
  // ASSIGNED, not chosen — on exam day you do not pick who marks you. Random
  // on mount so it is a real assignment rather than a hidden default.
  const [examiner, setExaminer] = useState<Persona["id"]>(
    () => PERSONAS[Math.floor(Math.random() * PERSONAS.length)].id,
  );
  const reassign = () => {
    const others = PERSONAS.filter((p) => p.id !== examiner);
    const next = others[Math.floor(Math.random() * others.length)];
    if (next) setExaminer(next.id);
  };
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
  // The socket handler is a stable callback, so reading `sessionId` from its
  // closure would give the value at mount (null) — and the end-of-exam redirect
  // would silently never fire. The ref is the one the handler reads.
  const sessionIdRef = useRef<string | null>(null);
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
          sessionIdRef.current = String(m.session_id ?? "") || null;
          setSessionId(sessionIdRef.current);
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
          // Straight to the REPORT. The band-reveal screen made the learner ask
          // for their own feedback — a number, then a button, then the thing
          // they actually finished the exam for. The report page shows the
          // marking state itself while grading finishes.
          if (sessionIdRef.current) router.replace(`/speak/mock/${sessionIdRef.current}`);
          break;
        case "ended":
          setEndedBand(typeof m.overall_band === "number" ? m.overall_band : null);
          setGrading(false);
          setPhase("ended");
          teardown();
          if (sessionIdRef.current) router.replace(`/speak/mock/${sessionIdRef.current}`);
          break;
        case "error":
          setError(String(m.message ?? m.error ?? "The session failed."));
          setPhase("error");
          teardown();
          break;
      }
    },
    [runClock, teardown, startElapsed, router],
  );

  const begin = useCallback(async () => {
    setError(null);
    setPhase("connecting");
    try {
      // 1. check the mic before reserving the session (plan-gated) over plain
      // HTTP. Permission errors should be fixable without spending a mock.
      await checkMicAccess();
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
      sessionIdRef.current = sid;
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

      const ws = new WebSocket(wsUrl(sid, examiner), wsProtocols(token));
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
        try {
          const mic = await startMic((pcm) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(pcm);
          });
          mic.onLevel((rms) => setMicLevel(rms));
          micRef.current = mic;
        } catch (e) {
          setError(e instanceof Error ? e.message : "Microphone unavailable.");
          setPhase("error");
          teardown();
        }
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
        teardown();
        return "ended";
      });
    }, 6000);
  }, [teardown]);

  // ---- render (Speaking.dc.html) ---------------------------------------------
  // The exam's palette is the INK, not the violet: violet is the tutor's, and
  // the two must never be mistaken for each other mid-session.
  const A = "#1A1520";
  const INK = "#1A1520";
  const MUTED2 = "#5C5460";
  const FAINT = "#8C7F8A";
  const LINE2 = "#E7E3E0";
  const DIV = "#EFEBE9";
  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF", border: `1px solid ${LINE2}`, borderRadius: 18,
  };
  const RING = "rgba(26,21,32,0.22)";
  const ORB = "radial-gradient(circle at 32% 28%, rgba(60,52,72,0.85) 0%, #2C2535 46%, #1A1520 100%)";

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

  // SETUP — the examiner is ASSIGNED, not chosen.
  // The design's point, and it is the right one: on exam day you do not pick
  // who marks you. A reroll exists because a voice you cannot follow is a
  // practice problem, not an exam-realism one.
  if (phase === "idle" || phase === "instructions") {
    const levelLabel =
      LEVELS.find((l) => l.v === level)?.label ?? "Mixed";
    return (
      <LucidaScope className="lucida-fill" style={{ background: "#FFFFFF", color: INK }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "clamp(20px, 3vh, 32px) clamp(24px, 5vw, 64px) 48px" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto" }}>
            {backLink}
            <div className="lc-setup-wide" style={{ marginTop: 18 }}>
              <div>
                <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  Ready for your mock?
                </h1>
                <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: MUTED2, maxWidth: 520 }}>
                  Like exam day, you do not choose the examiner — one is assigned to you now.
                </p>

                <div style={{ marginTop: 24, ...cardStyle, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: A }}>ASSIGNED EXAMINER</span>
                    <button type="button" onClick={reassign} style={{ appearance: "none", border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: FAINT }}>
                      Assign another
                    </button>
                  </div>
                  <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "64px minmax(0,1fr)", gap: 18, alignItems: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", background: persona.accent }}>
                      {persona.initial}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 20, fontWeight: 600 }}>{persona.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#F5F2F0", color: MUTED2 }}>{persona.mockTrait}</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 14, color: FAINT, lineHeight: 1.5 }}>{persona.mockDesc}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: FAINT }}>QUESTION DIFFICULTY</div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {LEVELS.map((l) => {
                    const on = level === l.v;
                    return (
                      <button
                        key={l.label}
                        type="button"
                        onClick={() => setLevel(l.v)}
                        aria-pressed={on}
                        style={{
                          padding: "11px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                          cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                          border: `1px solid ${on ? A : LINE2}`,
                          background: on ? "rgba(26,21,32,0.06)" : "#FFFFFF",
                          color: on ? A : MUTED2,
                        }}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 12, color: FAINT }}>
                  Difficulty changes the questions, never the marking.
                </p>
              </div>

              <div style={{ ...cardStyle, padding: 24, borderRadius: 20, position: "sticky", top: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: A }}>YOUR MOCK</div>
                <div style={{ marginTop: 14 }}>
                  {([
                    ["Examiner", persona.name],
                    ["Difficulty", levelLabel],
                    ["Parts", "1, 2 and 3"],
                    ["Length", "11–14 min"],
                  ] as const).map(([k, v], i) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: i < 3 ? `1px solid ${DIV}` : "none", fontSize: 14 }}>
                      <span style={{ color: FAINT }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "#F7F5F4", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#FFFFFF", border: `1px solid ${LINE2}`, display: "grid", placeItems: "center", color: MUTED2, flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Microphone</div>
                    <div aria-hidden style={{ marginTop: 6, display: "flex", gap: 3, alignItems: "flex-end", height: 14 }}>
                      {[0, 120, 240, 360, 480].map((d) => (
                        <span key={d} style={{ width: 3, height: "100%", background: "#22C55E", borderRadius: 2, transformOrigin: "bottom", animation: `lcWaveBar 900ms ease-in-out ${d}ms infinite` }} />
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>Ready</span>
                </div>

                <button
                  type="button"
                  onClick={() => setPhase("instructions")}
                  className="lc-btn"
                  style={{ marginTop: 16, width: "100%", padding: 16, borderRadius: 12, border: "none", background: A, color: "#fff", textAlign: "center", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 18px rgba(26,21,32,0.28)" }}
                >
                  Begin mock test
                </button>
                <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.6, color: FAINT, textAlign: "center" }}>
                  Once it starts you cannot pause. Leaving early ends the mock without a band.
                </p>
                {error ? <p style={{ margin: "12px 0 0", fontSize: 13, color: "#DC2626", textAlign: "center" }}>{error}</p> : null}
              </div>
            </div>
          </div>
        </div>

        {/* EXAM-DAY INSTRUCTIONS.
            A real IELTS speaking test does not begin with a button — it begins
            with an examiner telling you how it will run: three parts, how long
            each takes, that it is recorded, that you cannot pause, and that
            they will move you on when your time is up. Starting cold skipped
            all of it, and the first thing a candidate met was a voice asking
            their name. */}
        {phase === "instructions" ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Before you begin"
            onClick={() => setPhase("idle")}
            style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(26,21,32,.55)", backdropFilter: "blur(3px)" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "min(600px, 100%)", maxHeight: "min(92dvh, 760px)", display: "flex", flexDirection: "column", background: "#FFFFFF", borderRadius: 20, boxShadow: "0 24px 60px rgba(26,21,32,0.3)", color: INK, overflow: "hidden" }}
            >
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "26px 26px 4px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: A }}>BEFORE YOU BEGIN</div>
              <h2 style={{ margin: "10px 0 0", fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                The IELTS Speaking test, in three parts
              </h2>
              <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: MUTED2 }}>
                {persona.name} will lead. Answer naturally, in full sentences — the test is
                recorded and marked on four criteria: fluency and coherence, vocabulary,
                grammar, and pronunciation.
              </p>

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {([
                  ["1", "Interview", "4–5 min", `${persona.name} checks your name, then asks about familiar topics — your home, work or studies, and everyday habits. Two to four sentences per answer.`],
                  ["2", "Long turn", "3–4 min", "You get a task card. You have one minute to prepare and may make notes, then you speak on your own for one to two minutes. You will be stopped at two."],
                  ["3", "Discussion", "4–5 min", "Abstract questions linked to your Part 2 topic. Give an opinion and support it — this is where the higher bands are decided."],
                ] as const).map(([n, title, dur, body]) => (
                  <div key={n} style={{ display: "flex", gap: 14, border: `1px solid ${LINE2}`, borderRadius: 12, padding: "13px 15px" }}>
                    <span style={{ flex: "none", width: 28, height: 28, borderRadius: 8, background: "rgba(26,21,32,0.06)", color: A, display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>{n}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {title} <span style={{ fontWeight: 400, color: FAINT }}>· {dur}</span>
                      </div>
                      <div style={{ marginTop: 3, fontSize: 13, lineHeight: 1.55, color: FAINT }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 12, background: "#FDF4F4", border: "1px solid #F0D2D2" }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#8A2C2C" }}>
                  Exam conditions
                </div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    "You cannot pause, restart, or hear a question twice.",
                    "Leaving early is scored as an unfinished test — and still spends the mock.",
                    `Use headphones in a quiet room, or ${persona.name}'s voice reaches your microphone.`,
                  ].map((line) => (
                    <div key={line} style={{ display: "flex", gap: 8, fontSize: 13.5, lineHeight: 1.55, color: "#8A2C2C" }}>
                      <span aria-hidden style={{ flex: "none", marginTop: 7, width: 4, height: 4, borderRadius: "50%", background: "currentColor", opacity: 0.7 }} />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              </div>

              {/* pinned: the actions never scroll out of reach */}
              <div style={{ flex: "none", display: "flex", gap: 10, padding: "16px 26px 22px", borderTop: `1px solid ${DIV}`, background: "#FFFFFF" }}>
                <button
                  type="button"
                  onClick={begin}
                  className="lc-btn"
                  style={{ flex: "1 1 220px", padding: "15px 22px", borderRadius: 12, border: "none", background: A, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  I understand — start the test
                </button>
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  className="lc-btn lc-ghost"
                  style={{ flex: "0 1 auto", padding: "15px 22px", borderRadius: 12, border: `1px solid ${LINE2}`, background: "#fff", color: MUTED2, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Not yet
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

  // RESULT — the band, and what capped it. The per-criterion detail and the
  // examiner's note live on the full report; this is the reveal.
  if (phase === "ended") {
    return (
      <LucidaScope className="lucida-fill" style={{ background: "#FFFFFF", color: INK }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "clamp(20px, 3vh, 32px) clamp(24px, 5vw, 64px) 48px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {backLink}
            <div style={{ marginTop: 20, ...cardStyle, borderRadius: 22, padding: 32, animation: "lcFadeInUp 500ms cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="lc-result-grid">
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 180, height: 180, borderRadius: "50%", border: `1px solid ${LINE2}`, background: "#FFFFFF", display: "grid", placeItems: "center", margin: "0 auto" }}>
                    {endedBand != null ? (
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 54, fontWeight: 700, lineHeight: 1 }}>{endedBand.toFixed(1)}</div>
                        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: FAINT }}>OVERALL BAND</div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <div aria-hidden style={{ width: 30, height: 30, margin: "0 auto", border: `3px solid ${DIV}`, borderTopColor: A, borderRadius: "50%", animation: "lcSpin .9s linear infinite" }} />
                        <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: FAINT }}>GRADING</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", color: A, textTransform: "uppercase" }}>
                    MOCK COMPLETE · {persona.name} · {mmss(elapsed)}
                  </div>
                  <h1 style={{ margin: "10px 0 0", fontFamily: "var(--font-display)", fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {endedBand != null
                      ? "Your mock is graded"
                      : grading
                        ? "The examiner is writing your report"
                        : "Your report is being prepared"}
                  </h1>
                  <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: MUTED2 }}>
                    {endedBand != null
                      ? "The full report has the per-criterion breakdown, what capped the band, and the examiner’s note on each part."
                      : "This takes under a minute. Your band appears here as soon as it lands — you can leave this page open."}
                  </p>

                  <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {sessionId ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/speak/mock/${sessionId}`)}
                        className="lc-btn"
                        style={{ padding: "15px 24px", borderRadius: 12, border: "none", background: A, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        See the full report&nbsp; →
                      </button>
                    ) : null}
                    <Link href="/speak/tutor?kind=ielts" className="lc-btn" style={{ padding: "15px 24px", borderRadius: 12, background: "#DA7756", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                      Fix this with the tutor&nbsp; →
                    </Link>
                    <button type="button" onClick={onExit} className="lc-btn lc-ghost" style={{ padding: "15px 24px", borderRadius: 12, border: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: MUTED2, cursor: "pointer", fontFamily: "inherit" }}>
                      Back to speaking
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
        background: "#FCFBFA",
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

        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "#F4F1EF", color: "#1A1520", fontSize: "var(--text-sm)", fontWeight: 600, whiteSpace: "nowrap" }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: "#1A1520", animation: "lcDotPulse 1.4s ease-in-out infinite" }} />
          Part {part} · {PART_LABEL_SHORT[part] ?? ""}
        </span>

        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: "var(--text-md)", fontWeight: 500, color: "var(--color-neutral-1000)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
          {mmss(elapsed)}
        </span>
      </div>
      {/* whole-test progress line (16-min cap) */}
      <div aria-hidden style={{ flex: "none", height: 3, background: "#EFEBE8" }}>
        <div style={{ height: "100%", width: `${Math.min(100, Math.max(1.5, (elapsed / 960) * 100))}%`, background: "#1A1520", transition: "width 1s linear" }} />
      </div>
      {/* Keep the test structure visible. A timer alone creates pressure; this
          gives the learner a calm answer to “how much is left?” */}
      <div style={{ flex: "none", display: "flex", justifyContent: "center", gap: 8, padding: "10px 18px 0" }} aria-label={`Part ${part} of 3`}>
        {[1, 2, 3].map((step) => {
          const active = step === part;
          const done = step < part;
          return (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 7, color: active ? "var(--color-primary-600)" : done ? "var(--color-success)" : "var(--color-neutral-400)", fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase" }}>
              <span style={{ width: 21, height: 21, borderRadius: "50%", display: "grid", placeItems: "center", background: active ? "var(--color-primary-500)" : done ? "var(--color-success-bg)" : "var(--color-neutral-100)", color: active ? "#fff" : done ? "var(--color-success)" : "var(--color-neutral-500)", fontSize: "var(--text-2xs)" }}>{done ? "✓" : step}</span>
              <span>{PART_LABEL_SHORT[step]}</span>
            </div>
          );
        })}
      </div>

      {/* ── centre stage ── */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "min(660px, 100%)", margin: "0 auto", padding: "26px 24px 30px", textAlign: "center" }}>
          {/* The examiner is an ORB, not a face. An exam room should feel
              impersonal — the tutor gets the avatar, the examiner does not. */}
          <div aria-hidden style={{ position: "relative", width: 190, height: 190, margin: "0 auto", display: "grid", placeItems: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${RING}`, animation: "lcRing 2.8s ease-out infinite", animationPlayState: examinerSpeaking ? "running" : "paused" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${RING}`, animation: "lcRing 2.8s ease-out 1.4s infinite", animationPlayState: examinerSpeaking ? "running" : "paused" }} />
            <div style={{ width: 150, height: 150, borderRadius: "50%", background: ORB, boxShadow: "0 18px 40px rgba(26,21,32,0.28)", animation: "lcBreathe 4s ease-in-out infinite" }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: FAINT, marginTop: 26, textTransform: "uppercase" }}>
            {connecting ? "Connecting" : examinerSpeaking ? "Examiner is asking" : inPrep ? "Preparation" : listening ? "You are speaking" : "One moment"}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, color: INK, marginTop: 16, minHeight: 40, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{status}</div>
          <div style={{ fontSize: 14, color: FAINT, marginTop: 10, minHeight: 20, lineHeight: 1.6 }}>
            {connecting ? "This takes a few seconds." : partHint[part]}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <WaveBars color={A} active={examinerSpeaking} />
          </div>

          {clock != null ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "8px 18px", borderRadius: "var(--radius-pill)", background: inPrep ? "var(--color-warning-bg)" : "#F4F1EF", border: `1px solid ${inPrep ? "rgba(217,119,6,0.3)" : "#E7E3E0"}` }}>
              <span style={{ ...kicker, fontSize: "var(--text-2xs)", color: inPrep ? "var(--color-warning)" : "#1A1520" }}>
                {inPrep ? "Prep time" : "Speaking"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xl)", fontWeight: 600, color: inPrep ? "var(--color-warning)" : "#1A1520", fontVariantNumeric: "tabular-nums" }}>
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
              {/* listStyle is explicit: Tailwind's preflight resets ul markers, so
                  without it the cue card's points render as bare indented lines —
                  not what a candidate sees on the real card. */}
              <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", fontSize: "var(--text-base)", lineHeight: "var(--lh-relaxed)", color: "var(--color-neutral-800)" }}>
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
      <div style={{ flex: "none", borderTop: "1px solid var(--color-neutral-200)", background: "rgba(252,251,250,0.9)", backdropFilter: "blur(16px)", padding: "20px 24px calc(24px + env(safe-area-inset-bottom))" }}>
        <div style={{ width: "min(660px, 100%)", margin: "0 auto", textAlign: "center" }}>
          <div style={{ ...kicker, color: "var(--color-neutral-500)", marginBottom: 12 }}>You</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 10 }}>
            <span
              aria-hidden
              style={{
                position: "relative", display: "inline-flex", width: 48, height: 48, borderRadius: "50%",
                alignItems: "center", justifyContent: "center",
                background: userActive ? "#1A1520" : "#EFEBE8",
                color: userActive ? "#FFFFFF" : "var(--color-neutral-600)",
                // ring always tracks the mic so a too-quiet voice still shows life
                boxShadow:
                  micLevel > 0.004 && !examinerSpeaking
                    ? `0 0 0 ${3 + Math.min(1, micLevel * 26) * 9}px ${userActive ? "rgba(26,21,32,0.14)" : "rgba(26,21,32,0.07)"}`
                    : "none",
                transition: "background .2s, box-shadow .1s",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" /></svg>
            </span>
            <WaveBars color="#8C7F8A" active={userActive} height={24} />
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
