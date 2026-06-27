"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals `text` progressively — a "live writing" feel for chat replies that
 * otherwise pop in fully formed. When `animate` is false (e.g. replaying history)
 * the whole string shows at once. A reply of any length finishes in ≲ 3.5s
 * (longer replies reveal in bigger chunks), and `onReveal` fires each tick so the
 * parent can keep the transcript scrolled to the bottom while it types.
 */
export function Typewriter({
  text,
  animate,
  onReveal,
  onDone,
  caretColor,
}: {
  text: string;
  animate: boolean;
  onReveal?: () => void;
  /** Fires once the reveal finishes. The parent uses this to flip the message's
   *  `animate` flag off, so re-mounting the chat (reopen/re-enter) replays it
   *  instantly instead of re-typing every old reply at once. */
  onDone?: () => void;
  caretColor?: string;
}) {
  const [shown, setShown] = useState(() => (animate ? "" : text));
  // Keep the latest callbacks in refs (synced in an effect, not during render) so the
  // running interval always calls the current ones without restarting the animation.
  const onRevealRef = useRef(onReveal);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onRevealRef.current = onReveal;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (!animate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show the full text at once when not animating
      setShown(text);
      return;
    }
    const chunk = Math.max(1, Math.ceil(text.length / 220)); // longer reply → faster reveal
    let i = 0;
    setShown("");
    const id = window.setInterval(() => {
      i = Math.min(text.length, i + chunk);
      setShown(text.slice(0, i)); // in a timer callback (not the effect body) — allowed
      onRevealRef.current?.();
      if (i >= text.length) {
        window.clearInterval(id);
        onDoneRef.current?.();
      }
    }, 16);
    return () => window.clearInterval(id);
  }, [text, animate]);

  const writing = animate && shown.length < text.length;
  return (
    <>
      {shown}
      {writing ? (
        <span aria-hidden style={{ color: caretColor ?? "currentColor", opacity: 0.6 }}>
          ▍
        </span>
      ) : null}
    </>
  );
}
