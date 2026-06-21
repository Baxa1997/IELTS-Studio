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
  caretColor,
}: {
  text: string;
  animate: boolean;
  onReveal?: () => void;
  caretColor?: string;
}) {
  const [shown, setShown] = useState(() => (animate ? "" : text));
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    if (!animate) {
      setShown(text);
      return;
    }
    const chunk = Math.max(1, Math.ceil(text.length / 220)); // longer reply → faster reveal
    let i = 0;
    setShown("");
    const id = window.setInterval(() => {
      i = Math.min(text.length, i + chunk);
      setShown(text.slice(0, i));
      onRevealRef.current?.();
      if (i >= text.length) window.clearInterval(id);
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
