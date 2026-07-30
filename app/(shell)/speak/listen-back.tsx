"use client";

/**
 * ListenBack — the mock report's synced recording player.
 *
 * The candidate track is the full-session mic recording, so transcript turn
 * timestamps (t_ms, measured from exam start) map straight onto audio time
 * (±~2s of mic-start offset — fine for "jump to this answer"). Click a turn to
 * hear yourself give it; the list follows the playhead while audio plays.
 */

import { useEffect, useRef, useState } from "react";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const MUTED = "#56556A";
const LINE = "#E8E6F0";
const INDIGO = "#4338CA";
const INK = "#141221";
const GOOD = "#1A7A48";   // the "stronger version" rail, matching the report

export interface LBTurn {
  role: "examiner" | "candidate";
  part: number;
  text: string;
  t_ms?: number;
}

function mmss(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export interface LBUpgrade {
  you_said: string;
  stronger: string;
  note: string;
}

/** Match the grader's verbatim quotes onto the turns they came from.
 *
 *  The grader is told to quote candidate speech VERBATIM, so a substring test
 *  is the honest join — no fuzzy matching, because attaching a rewrite to a
 *  sentence the learner did not say is worse than showing nothing. Comparison
 *  is on letters and digits only, since the transcript and the quote can differ
 *  in punctuation and casing alone. */
function upgradesByTurn(turns: LBTurn[], upgrades: LBUpgrade[]): Map<number, LBUpgrade> {
  const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const out = new Map<number, LBUpgrade>();
  const taken = new Set<number>();
  for (const u of upgrades) {
    const needle = flat(u.you_said ?? "");
    if (needle.length < 8) continue;   // too short to attribute safely
    const i = turns.findIndex(
      (t, idx) => t.role === "candidate" && !taken.has(idx) && flat(t.text).includes(needle),
    );
    if (i >= 0) {
      out.set(i, u);
      taken.add(i);
    }
  }
  return out;
}

export function ListenBack({
  audioUrl,
  turns,
  partS,
  upgrades = [],
}: {
  audioUrl: string;
  turns: LBTurn[];
  partS?: Record<string, number> | null;
  /** The grader's rewrites, shown under the turn each one quotes. */
  upgrades?: LBUpgrade[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState(0);
  const [dur, setDur] = useState(0);
  const [playing, setPlaying] = useState(false);

  const timed = turns.filter((t) => typeof t.t_ms === "number");
  // Keyed on `timed`, NOT `turns` — the list below renders the filtered array,
  // and any untimed turn (older sessions predate t_ms) would shift every index
  // after it, hanging each rewrite under somebody else's sentence.
  const better = upgradesByTurn(timed, upgrades);
  // active turn = the last one whose timestamp is behind the playhead
  let active = -1;
  timed.forEach((t, i) => {
    if ((t.t_ms ?? 0) / 1000 <= now + 0.5) active = i;
  });

  useEffect(() => {
    if (!playing || active < 0 || !listRef.current) return;
    const el = listRef.current.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active, playing]);

  const seekTo = (ms: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, ms / 1000);
    void a.play();
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const parts = partS ?? {};
  const partLine = (["1", "2", "3"] as const)
    .filter((p) => Number(parts[p]) > 0)
    .map((p) => `Part ${p} ${mmss(Number(parts[p]))}`)
    .join(" · ");

  return (
    <section
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        padding: "16px 18px",
        marginBottom: 14,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", color: INDIGO }}>
          LISTEN BACK
        </div>
        {partLine ? <div style={{ fontSize: 12.5, color: MUTED }}>{partLine}</div> : null}
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDur(e.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {/* player row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "none",
            background: INDIGO,
            color: "#fff",
            fontSize: 15,
            cursor: "pointer",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(dur, 1)}
          step={0.5}
          value={Math.min(now, dur)}
          onChange={(e) => {
            const a = audioRef.current;
            if (a) a.currentTime = Number(e.target.value);
          }}
          aria-label="Seek"
          style={{ flex: 1, accentColor: INDIGO }}
        />
        <div style={{ fontSize: 12.5, color: MUTED, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {mmss(now)} / {mmss(dur)}
        </div>
      </div>

      {/* synced transcript */}
      <div
        ref={listRef}
        style={{
          marginTop: 14,
          maxHeight: 340,
          overflowY: "auto",
          border: `1px solid ${LINE}`,
          borderRadius: 12,
          padding: "6px 0",
        }}
      >
        {timed.map((t, i) => {
          const isActive = i === active && playing;
          const previousPart = timed[i - 1]?.part;
          const chip =
            t.part !== previousPart ? (
              <div
                key={`p${t.part}`}
                style={{
                  margin: "8px 12px 4px",
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: ".1em",
                  color: INDIGO,
                }}
              >
                PART {t.part}
              </div>
              ) : null;
          return (
            <div key={i}>
              {chip}
              <button
                type="button"
                onClick={() => seekTo(t.t_ms ?? 0)}
                title="Play from here"
                style={{
                  display: "flex",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  cursor: "pointer",
                  padding: "7px 12px",
                  background: isActive ? "#EEF2FF" : "transparent",
                  borderLeft: `3px solid ${isActive ? INDIGO : "transparent"}`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.role === "examiner" ? MUTED : INDIGO,
                    flexShrink: 0,
                    width: 62,
                    paddingTop: 1.5,
                  }}
                >
                  {mmss((t.t_ms ?? 0) / 1000)} {t.role === "examiner" ? "EX" : "YOU"}
                </span>
                <span style={{ fontSize: 13.5, lineHeight: 1.55, color: t.role === "examiner" ? MUTED : INK }}>
                  {t.text.trim()}
                </span>
              </button>
              {/* The stronger way to say it, right under what was actually
                  said. Hearing yourself and reading the upgrade in the same
                  place is the whole point of listening back — sending the
                  learner to a separate list to find it loses the pairing. */}
              {better.has(i) ? (
                <div style={{ margin: "0 12px 10px 74px", borderLeft: `2px solid ${GOOD}`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".07em", color: GOOD, textTransform: "uppercase" }}>
                    Stronger
                  </div>
                  <div style={{ marginTop: 3, fontSize: 13.5, lineHeight: 1.55, color: INK, fontWeight: 500 }}>
                    {better.get(i)!.stronger}
                  </div>
                  {better.get(i)!.note ? (
                    <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.5, color: MUTED }}>
                      {better.get(i)!.note}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p style={{ margin: "8px 2px 0", fontSize: 12, color: MUTED }}>
        Tap any line to hear that moment. Times are from your microphone track, so they can be a
        second or two off.
      </p>
    </section>
  );
}
