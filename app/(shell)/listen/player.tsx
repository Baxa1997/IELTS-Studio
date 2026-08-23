"use client";

/**
 * The listening audio engine.
 *
 * An IELTS listening test is not a media file — it is a SEQUENCE: narrator
 * audio, a timed reading pause, more audio, another pause. This module owns that
 * sequence, and it is the only part of the listening screen with real state
 * machinery in it: what is sounding now, which part the audio has reached,
 * whether we are inside a pause and how much of it is left, how a seek maps back
 * onto a segment index.
 *
 * Two things are load-bearing and easy to break:
 *
 *  - THE POSITION STORE IS NOT REACT STATE. Playback position updates several
 *    times a second. Holding it in `useState` would re-render the entire runner
 *    — every question panel, every input — at that rate. It lives in an external
 *    store (`player.tick`) that components opt into with `usePlayerTick`, so a
 *    tick re-renders the audio strip and the clock and nothing else.
 *
 *  - PAUSES ARE PART OF THE DURATION. `duration`, the strip's geometry and the
 *    exam clock all count pause seconds as elapsed time, because to a candidate
 *    they are. Treating the strip as "position within the audio files" makes the
 *    bar jump backwards at every pause boundary.
 *
 * Split out of `listening-client.tsx`, where it sat in the middle of 5,600 lines
 * between the hub cards and the question renderers.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { formatClock } from "@/components/exam/timer";

import { RUN } from "./theme";
import type { AudioSeg, PauseSeg, PlayerPhase, Segment } from "./types";

// ---- Player (segment engine + audio strip) --------------------------------

export const SPEEDS = [1, 1.25, 1.5, 0.75] as const;

/** IELTS part a segment belongs to, parsed from its narrator label
 *  ("Part 3 · Discussion" → 3); falls back to the previous part. */
export function segPart(label: string, prev: number): number {
  const m = /part\s*([1-4])/i.exec(label ?? "");
  return m ? Number(m[1]) : prev;
}

/** Split a manifest into per-part streams — a full test plays each part as its
 *  own recording, so switching parts restarts audio at that part's intro. New
 *  manifests tag segments with `part`; older ones fall back to the narrator
 *  labels. A single-part practice comes back as one stream. */
export function splitAudioByPart(segments: Segment[]): { part: number; segments: Segment[] }[] {
  const by = new Map<number, Segment[]>();
  let prev = 1;
  for (const s of segments) {
    const p = s.part ?? segPart(s.label, prev);
    prev = p;
    const bucket = by.get(p);
    if (bucket) bucket.push(s);
    else by.set(p, [s]);
  }
  return [...by.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([part, segs]) => ({ part, segments: segs }));
}

/** Declared/estimated seconds of one segment (narrator clips may lack it). */
export function segSecs(s: Segment): number {
  return s.kind === "pause" ? s.seconds : (s.seconds ?? 0);
}

export type PlayerTick = { curTime: number; pauseLeft: number };

export type PlayerApi = {
  phase: PlayerPhase;
  paused: boolean;
  finished: boolean;
  playing: boolean;
  seg: Segment | null;
  idx: number;
  title: string;
  isPause: boolean;
  audioPart: number; // part currently sounding
  partReached: number; // highest part the audio has reached
  duration: number; // total seconds (best estimate)
  durs: number[]; // per-segment durations (declared or measured)
  /** Playback position store — subscribe via usePlayerTick; several updates a
   *  second, deliberately outside React state so ticks re-render ONLY the
   *  subscribers (audio strip, exam clock), never the whole runner. */
  tick: { subscribe: (cb: () => void) => () => void; get: () => PlayerTick };
  speed: number;
  muted: boolean;
  audioError: string | null;
  start: () => void;
  togglePlay: () => void;
  cycleSpeed: () => void;
  toggleMute: () => void;
  advance: () => void;
  retry: () => void;
  reset: () => void;
  seekTo: (fraction: number) => void;
};

/** Subscribe this component to the playback position. Only components that call
 *  this re-render on a tick. */
export function usePlayerTick(player: PlayerApi): PlayerTick {
  return useSyncExternalStore(player.tick.subscribe, player.tick.get, player.tick.get);
}

/** Everything the UI derives from the position, computed at the SUBSCRIBER so
 *  the runner itself stays out of the tick path. Mirrors the pre-store math. */
export function derivePlayerPos(p: PlayerApi, t: PlayerTick) {
  const isPause = p.seg?.kind === "pause";
  const countdown = isPause ? (t.pauseLeft > 0 ? t.pauseLeft : (p.seg as PauseSeg).seconds) : 0;
  const before = p.idx > 0 ? p.durs.slice(0, p.idx).reduce((a, b) => a + (b || 0), 0) : 0;
  const within =
    p.seg?.kind === "audio"
      ? Math.min(t.curTime, p.durs[p.idx] || t.curTime)
      : isPause
        ? (p.seg as PauseSeg).seconds - countdown
        : 0;
  const elapsed = p.finished ? p.duration : p.idx < 0 ? 0 : before + within;
  const progress = p.duration > 0 ? Math.min(1, elapsed / p.duration) : 0;
  const status = p.finished
    ? "Review your answers, then submit"
    : p.phase === "idle"
      ? "Ready — press play or drag the bar"
      : p.paused
        ? "Paused"
        : isPause
          ? `Reading time — ${countdown}s`
          : (p.audioError ?? "Now playing...");
  return { countdown, elapsed, progress, status };
}

/** Segment player: the recording is a sequence of audio clips + timed reading
 *  pauses. Playback runs in order, but the scrubber is freely seekable (click or
 *  drag anywhere) — practice mode, not locked exam rules. Exposed as a hook so
 *  the top bar (part tabs + exam timer) and the audio strip share one source.
 *  `onFinished` fires when the last segment ends (from the `ended` event). */
export function useSegmentPlayer(segments: Segment[], onFinished?: () => void): PlayerApi {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedIdxRef = useRef(-1); // which segment's src is currently loaded
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);
  const [phase, setPhase] = useState<PlayerPhase>("idle");
  const [idx, setIdx] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  // Playback POSITION (position in the current clip + a pause's remaining
  // seconds) is deliberately NOT React state. It changes several times a second
  // for the whole recording, and this hook lives in Runner — as state, every
  // `timeupdate` re-rendered the entire exam surface (all 40 question rows, the
  // tabs, the transcript) for 30+ minutes straight, which is what made a
  // full test feel heavy on modest hardware. It lives in a tiny external store
  // instead; the audio strip and the exam clock subscribe via
  // `usePlayerTick`, and nothing else re-renders on a tick.
  const tickRef = useRef<PlayerTick>({ curTime: 0, pauseLeft: 0 });
  const tickSubsRef = useRef<Set<() => void>>(new Set());
  const setTick = useCallback((patch: Partial<PlayerTick>) => {
    const cur = tickRef.current;
    const next: PlayerTick = {
      curTime: patch.curTime ?? cur.curTime,
      pauseLeft: patch.pauseLeft ?? cur.pauseLeft,
    };
    if (next.curTime === cur.curTime && next.pauseLeft === cur.pauseLeft) return;
    tickRef.current = next; // new object every change: useSyncExternalStore compares by identity
    tickSubsRef.current.forEach((fn) => fn());
  }, []);
  const tick = useMemo(
    () => ({
      subscribe: (cb: () => void) => {
        tickSubsRef.current.add(cb);
        return () => {
          tickSubsRef.current.delete(cb);
        };
      },
      get: () => tickRef.current,
    }),
    [],
  );
  // Declared/measured duration per segment (audio may not carry `seconds`).
  const [durs, setDurs] = useState<number[]>(() =>
    segments.map((s) => (s.kind === "pause" ? s.seconds : (s.seconds ?? 0))),
  );

  const seg: Segment | null = idx >= 0 && idx < segments.length ? segments[idx] : null;
  const speed = SPEEDS[speedIdx];

  // A new segment list (the per-part player switching parts) is a new stream:
  // drop the element's src and return to idle so the runner can start it fresh.
  const segsRef = useRef(segments);
  useEffect(() => {
    if (segsRef.current === segments) return;
    segsRef.current = segments;
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
    }
    loadedIdxRef.current = -1;
    setPhase("idle");
    setIdx(-1);
    setPaused(false);
    setTick({ curTime: 0, pauseLeft: 0 });
    setAudioError(null);
    setDurs(segments.map((s) => (s.kind === "pause" ? s.seconds : (s.seconds ?? 0))));
  }, [segments, setTick]);

  // Part boundaries derived once from the narrator labels.
  const partByIdx = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < segments.length; i++) {
      out[i] = segPart(segments[i].label, i === 0 ? 1 : out[i - 1]);
    }
    return out;
  }, [segments]);

  // Best-effort metadata preload so the scrubber/total settle before playback.
  useEffect(() => {
    let alive = true;
    segments.forEach((s, i) => {
      if (s.kind !== "audio" || (s.seconds && s.seconds > 0)) return;
      const probe = new Audio();
      probe.preload = "metadata";
      probe.src = s.url;
      probe.addEventListener("loadedmetadata", () => {
        if (!alive || !Number.isFinite(probe.duration)) return;
        setDurs((d) => {
          if (d[i] && d[i] > 0) return d;
          const next = d.slice();
          next[i] = probe.duration;
          return next;
        });
      });
    });
    return () => {
      alive = false;
    };
  }, [segments]);

  const advance = useCallback(() => {
    setPaused(false);
    setTick({ curTime: 0, pauseLeft: 0 });
    if (idx + 1 >= segments.length) {
      setPhase("finished");
      onFinishedRef.current?.();
    } else {
      setIdx(idx + 1);
    }
  }, [idx, segments.length, setTick]);

  // Own a detached <audio> element (created on the client, never rendered) so
  // the hook's public API carries no refs and playback survives re-renders.
  useEffect(() => {
    if (typeof Audio === "undefined") return;
    const el = new Audio();
    el.preload = "auto";
    audioRef.current = el;
    const onTime = () => setTick({ curTime: el.currentTime });
    el.addEventListener("timeupdate", onTime);
    return () => {
      el.pause();
      el.removeEventListener("timeupdate", onTime);
      el.removeAttribute("src");
      audioRef.current = null;
    };
  }, [setTick]);

  // Advance to the next segment when the current audio clip finishes.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => advance();
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, [advance]);

  // Load + play the current audio segment. `start()` already primes segment 0
  // inside the click gesture, so the loaded-index guard avoids reloading (which
  // would restart the clip) when this effect fires right after.
  useEffect(() => {
    if (!seg || phase !== "running" || seg.kind !== "audio") return;
    const el = audioRef.current;
    if (!el) return;
    if (loadedIdxRef.current !== idx) {
      el.src = seg.url;
      loadedIdxRef.current = idx;
    }
    el.playbackRate = speed;
    el.muted = muted;
    el.play()
      .then(() => setAudioError(null))
      .catch(() => setAudioError("Playback was blocked — press play to continue."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg, phase]);

  // Keep live playbackRate / muted synced with the controls.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // Pause/resume toggling for the audio element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || seg?.kind !== "audio" || phase !== "running") return;
    if (paused) el.pause();
    else if (el.paused && el.src) el.play().catch(() => {});
  }, [paused, seg, phase]);

  // Countdown ticking for pause segments (freezes while paused; advances at 0).
  // The interval seeds itself from the segment length on its first tick so the
  // effect body never calls setState synchronously.
  useEffect(() => {
    if (!seg || phase !== "running" || seg.kind !== "pause" || paused) return;
    const secs = seg.seconds;
    const t = setInterval(() => {
      const cur = tickRef.current.pauseLeft;
      const next = Math.max((cur > 0 ? cur : secs) - 1, 0);
      setTick({ pauseLeft: next });
      if (next === 0) {
        clearInterval(t);
        advance();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [seg, phase, paused, advance, setTick]);

  const finished = phase === "finished";
  const playing = phase === "running" && !paused;
  const isPause = seg?.kind === "pause";

  const duration = durs.reduce((a, b) => a + (b || 0), 0);

  const audioPart = idx >= 0 ? partByIdx[Math.min(idx, partByIdx.length - 1)] : 1;
  const partReached = idx >= 0 ? Math.max(1, ...partByIdx.slice(0, idx + 1)) : 1;

  const firstLabel = useMemo(
    () => segments.find((s) => s.kind === "audio")?.label ?? "Part 1 · Introduction",
    [segments],
  );
  const title = finished ? "Recording finished" : (seg?.label ?? firstLabel);
  // elapsed / progress / countdown / the ticking part of `status` are computed
  // by subscribers from the tick store — see derivePlayerPos + usePlayerTick.

  const start = useCallback(() => {
    // Play the first clip synchronously in the click gesture so browsers don't
    // block it as autoplay. The load-and-play effect then no-ops on segment 0.
    const el = audioRef.current;
    const first = segments[0];
    if (el && first && first.kind === "audio") {
      el.src = first.url;
      loadedIdxRef.current = 0;
      el.play()
        .then(() => setAudioError(null))
        .catch(() => setAudioError("Playback was blocked — press play to continue."));
    }
    setPhase("running");
    setIdx(0);
    setTick({ curTime: 0, pauseLeft: 0 });
  }, [segments, setTick]);

  const togglePlay = useCallback(() => {
    if (phase === "idle") start();
    else if (!finished) setPaused((p) => !p);
  }, [phase, finished, start]);

  const retry = useCallback(() => {
    audioRef.current
      ?.play()
      .then(() => setAudioError(null))
      .catch(() => {});
  }, []);

  const reset = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
    }
    loadedIdxRef.current = -1;
    setPhase("idle");
    setIdx(-1);
    setPaused(false);
    setTick({ curTime: 0, pauseLeft: 0 });
    setSpeedIdx(0);
    setMuted(false);
    setAudioError(null);
  }, [setTick]);

  // Free seek: map a 0..1 scrubber position to a segment + offset and jump
  // there (a reading-pause lands on its remaining countdown). Practice mode —
  // grab the playhead and drop it anywhere.
  const seekTo = useCallback(
    (fraction: number) => {
      if (duration <= 0) return;
      const target = Math.max(0, Math.min(1, fraction)) * duration;
      let acc = 0;
      let ti = 0;
      let off = 0;
      for (let i = 0; i < segments.length; i++) {
        const d = durs[i] || 0;
        ti = i;
        off = Math.max(0, target - acc);
        if (target < acc + d) break;
        acc += d;
      }
      const s = segments[ti];
      if (!s) return;
      setPhase("running");
      setPaused(false);
      setIdx(ti);
      if (s.kind === "pause") {
        setTick({ curTime: 0, pauseLeft: Math.max(1, Math.round(s.seconds - off)) });
        audioRef.current?.pause();
        return;
      }
      setTick({ pauseLeft: 0 });
      const el = audioRef.current;
      if (!el) return;
      const apply = () => {
        try {
          el.currentTime = off;
        } catch {
          /* seeking before metadata is ready — timeupdate will correct it */
        }
        setTick({ curTime: off });
        el.play()
          .then(() => setAudioError(null))
          .catch(() => {});
      };
      if (loadedIdxRef.current !== ti) {
        el.src = s.url;
        loadedIdxRef.current = ti;
        const onMeta = () => {
          el.removeEventListener("loadedmetadata", onMeta);
          apply();
        };
        el.addEventListener("loadedmetadata", onMeta);
      } else {
        apply();
      }
    },
    [segments, durs, duration, setTick],
  );

  return {
    phase,
    paused,
    finished,
    playing,
    seg,
    idx,
    title,
    isPause,
    audioPart,
    partReached,
    duration,
    durs,
    tick,
    speed,
    muted,
    audioError,
    start,
    togglePlay,
    cycleSpeed: () => setSpeedIdx((i) => (i + 1) % SPEEDS.length),
    toggleMute: () => setMuted((m) => !m),
    advance,
    retry,
    reset,
    seekTo,
  };
}

/** The handoff audio bar (62px): play/pause with a live pulse ring · track meta ·
 *  elapsed · a freely seekable scrubber (click or drag anywhere) · total · speed ·
 *  mute. Seeking drives the real segment player; grab the playhead and drop it. */
/** The whole-exam countdown chip. Isolated so ONLY this chip re-renders on a
 *  playback tick — it is the one thing in Runner's chrome that needs the time. */
export function ExamClock({
  player,
  isTest,
  beforeSecs,
  total,
}: {
  player: PlayerApi;
  isTest: boolean;
  beforeSecs: number;
  total: number;
}) {
  const t = usePlayerTick(player);
  const { elapsed } = derivePlayerPos(player, t);
  return <>{formatClock(Math.max(0, total - (isTest ? beforeSecs + elapsed : elapsed)))}</>;
}

export function AudioStrip({ player }: { player: PlayerApi }) {
  const seek = (clientX: number, rect: DOMRect) => {
    if (rect.width > 0) player.seekTo((clientX - rect.left) / rect.width);
  };
  const onScrubDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(e.clientX, rect);
    const move = (ev: PointerEvent) => seek(ev.clientX, rect);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const tick = usePlayerTick(player);
  const pos = derivePlayerPos(player, tick);
  const onScrubKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") player.seekTo(pos.progress - 0.02);
    else if (e.key === "ArrowRight") player.seekTo(pos.progress + 0.02);
    else return;
    e.preventDefault();
  };
  const pct = (pos.progress * 100).toFixed(2);
  const blue = {
    bg: "#102347",
    border: "#1b3766",
    text: "#f8fbff",
    muted: "#b8c8df",
    rail: "#2a4574",
    fill: "#7ea7ff",
    control: "rgba(255,255,255,0.09)",
    controlBorder: "rgba(255,255,255,0.18)",
    play: "#6f82ff",
  };
  const iconBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    borderRadius: 8,
    border: `1px solid ${blue.controlBorder}`,
    background: blue.control,
    color: blue.text,
    cursor: "pointer",
    flexShrink: 0,
  };
  const time: React.CSSProperties = {
    fontFamily: RUN.mono,
    fontSize: 13,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
  };
  return (
    <div
      style={{
        flexShrink: 0,
        minHeight: 62,
        background: blue.bg,
        borderBottom: `1px solid ${blue.border}`,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Play / pause with a pulse ring while sounding */}
      <div style={{ position: "relative", flexShrink: 0, width: 42, height: 42 }}>
        {player.playing && !player.isPause ? (
          <div
            style={{
              position: "absolute",
              inset: -3,
              borderRadius: 9999,
              background: "rgba(126,167,255,0.35)",
              animation: "lp-pulse-ring 1.2s ease-out infinite",
            }}
          />
        ) : null}
        <button
          type="button"
          onClick={player.togglePlay}
          title={player.playing ? "Pause" : "Play"}
          style={{
            position: "relative",
            width: 42,
            height: 42,
            borderRadius: 9999,
            background: blue.play,
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.24)",
          }}
        >
          {player.playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1.3" />
              <rect x="14" y="5" width="4" height="14" rx="1.3" />
            </svg>
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ marginLeft: 2 }}
            >
              <path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5z" />
            </svg>
          )}
        </button>
      </div>

      {/* Track meta */}
      <div style={{ width: 180, flexShrink: 0, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: blue.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {player.title}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: blue.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {pos.status}
        </div>
      </div>

      <span style={{ ...time, color: blue.muted, width: 42, textAlign: "right" }}>
        {formatClock(pos.elapsed)}
      </span>

      {/* Freely seekable scrubber */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Audio position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos.progress * 100)}
        onPointerDown={onScrubDown}
        onKeyDown={onScrubKey}
        title="Drag to move the playhead"
        style={{
          position: "relative",
          flex: 1,
          height: 16,
          display: "flex",
          alignItems: "center",
          minWidth: 0,
          cursor: "pointer",
          touchAction: "none",
          outline: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 5,
            borderRadius: 9999,
            background: blue.rail,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            height: 5,
            borderRadius: 9999,
            background: blue.fill,
            width: `${pct}%`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translate(-50%,-50%)",
            left: `${pct}%`,
            width: 14,
            height: 14,
            borderRadius: 9999,
            background: "#fff",
            border: `3px solid ${blue.fill}`,
            boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
          }}
        />
      </div>

      <span style={{ ...time, color: blue.muted, width: 42 }}>{formatClock(player.duration)}</span>

      {/* Speed */}
      <button
        type="button"
        onClick={player.cycleSpeed}
        title="Playback speed"
        style={{
          ...iconBtn,
          padding: "0 11px",
          fontFamily: RUN.mono,
          fontSize: 13,
          fontWeight: 600,
          color: blue.text,
        }}
      >
        {player.speed}×
      </button>

      {player.audioError && player.seg?.kind === "audio" ? (
        <button
          type="button"
          onClick={player.retry}
          style={{
            ...iconBtn,
            padding: "0 12px",
            background: blue.play,
            border: "none",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          Play
        </button>
      ) : null}

      {/* Mute */}
      <button
        type="button"
        onClick={player.toggleMute}
        title={player.muted ? "Unmute" : "Mute"}
        style={{ ...iconBtn, width: 34 }}
      >
        {player.muted ? (
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        )}
      </button>
    </div>
  );
}

/** Post-grade free replay (practice review, no exam rules anymore) — rendered
 *  below the review so the exam player stays compact. */
export function ReplayList({ segments }: { segments: Segment[] }) {
  return (
    <div
      style={{
        marginTop: 16,
        background: "#fff",
        border: `1px solid ${RUN.bCard}`,
        borderRadius: 16,
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      <span
        style={{
          fontFamily: RUN.sans,
          fontSize: 11.5,
          fontWeight: 700,
          color: RUN.t6,
          letterSpacing: ".09em",
          textTransform: "uppercase",
        }}
      >
        Listen again
      </span>
      {segments
        .filter((s): s is AudioSeg => s.kind === "audio")
        .map((s) => (
          <div key={s.path} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: RUN.sans,
                fontSize: 12.5,
                fontWeight: 600,
                color: RUN.t2,
                width: 210,
                flex: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.label}
            </span>
            <audio src={s.url} controls preload="none" style={{ flex: 1, height: 34 }} />
          </div>
        ))}
    </div>
  );
}
