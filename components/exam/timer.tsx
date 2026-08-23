"use client";

/**
 * The exam countdown — one of them.
 *
 * Six were in circulation: `Timer` in the writing studio and in
 * `read/_shared/question-inputs.tsx`, `ReadingTimer` in the CEFR client,
 * `ExamClock` in the listening client, and two `fmtClock` helpers. Same idea
 * every time, and the same defect every time:
 *
 *   they counted with `setInterval(…, 1000)` and decremented a number.
 *
 * That is not a clock, it is a hope. Browsers throttle timers in a background
 * tab — commonly to once a second at best, often far slower, and on mobile they
 * can stop entirely while the tab is hidden. A student who switched tabs mid-test
 * came back with time they had not earned, and every one of the six drifted a
 * little even in the foreground because a 1000 ms interval is not a 1000 ms tick.
 *
 * This one stores a DEADLINE and derives the remaining time from the wall clock
 * on every tick, so throttling changes how often the display refreshes and
 * nothing else. Time runs out when it runs out.
 *
 * `onExpire` fires exactly once. It is held in a ref rather than listed as an
 * effect dependency because callers overwhelmingly pass an inline arrow, and
 * depending on it would restart the countdown on every parent render — which is
 * the other way a timer silently gives away free minutes.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { MUTED, RED, SANS } from "@/lib/theme/tokens";

/** `m:ss`, or `h:mm:ss` past an hour. Never negative. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return h > 0
    ? `${h}:${mm}:${String(sec).padStart(2, "0")}`
    : `${mm}:${String(sec).padStart(2, "0")}`;
}

/** Seconds left against a fixed deadline, floored at zero. Exported for tests
 *  and for callers that want the number without the chrome. */
export function secondsLeft(deadline: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function Timer({
  seconds,
  onExpire,
  /** Seconds remaining at which the display turns urgent. */
  warnAt = 120,
  /** Render-prop escape hatch: gets the formatted text and the raw seconds, so a
   *  caller can draw its own chrome without re-implementing the countdown. */
  children,
  label = "Time remaining",
  style,
}: {
  seconds: number;
  onExpire?: () => void;
  warnAt?: number;
  children?: (text: string, left: number) => ReactNode;
  label?: string;
  style?: CSSProperties;
}) {
  // The deadline is fixed at mount from the initial duration, and held in state
  // rather than a ref so it is never read or written during a render. A later
  // change to `seconds` does NOT restart the clock — an exam whose length changes
  // underneath the candidate is a bug, not a feature.
  const [deadline] = useState(() => Date.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);

  const fired = useRef(false);

  // Kept current in an effect, not assigned during render. The point is that the
  // countdown effect below depends on nothing, so a parent re-render with a fresh
  // inline `onExpire` cannot restart the interval and slide the deadline forward.
  const expire = useRef(onExpire);
  useEffect(() => {
    expire.current = onExpire;
  });

  useEffect(() => {
    function tick() {
      const remaining = secondsLeft(deadline);
      setLeft(remaining);
      if (remaining === 0 && !fired.current) {
        fired.current = true;
        expire.current?.();
      }
    }
    // A 250 ms cadence keeps the seconds digit honest without the display
    // stuttering; the value shown is derived from the clock either way, so this
    // is a refresh rate, not a time source.
    const id = setInterval(tick, 250);
    // Recompute the moment the tab comes back, rather than waiting for the next
    // tick — this is where a throttled interval would otherwise show stale time.
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadline]);

  const text = formatClock(left);
  if (children) return <>{children(text, left)}</>;

  const urgent = left <= warnAt;
  return (
    <span
      role="timer"
      aria-label={label}
      // Announce only at the end. A live region that speaks every second is
      // unusable; the one moment a screen-reader user must hear is "time is up".
      aria-live={left === 0 ? "assertive" : "off"}
      style={{
        fontFamily: SANS,
        fontWeight: 650,
        fontVariantNumeric: "tabular-nums",
        color: urgent ? RED : MUTED,
        ...style,
      }}
    >
      {text}
    </span>
  );
}
