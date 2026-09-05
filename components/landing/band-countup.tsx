"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The hero's live Band-9 number. It climbs through the real IELTS half-bands
 * (4.0 → 4.5 → … → 9) and then "booms" — a success pop with a ring pulse and a
 * burst of burgundy + gold particles — before resting on the 9 and replaying.
 *
 * IT STARTS AT 4.0, NOT 6.5. The owner's point: beginning the climb halfway up
 * told a beginner this platform was not for them. The whole journey is the
 * promise, so the number now starts where a real beginner starts.
 *
 * Recoloured from indigo to the marketing burgundy (#7d0132) when the landing
 * page moved onto the EngProgress design canvas. The BEHAVIOUR is untouched: the
 * owner asked to keep this element and change only its colour, so the ascent,
 * the timing, the particle geometry and the reduced-motion behaviour are all
 * exactly as they were.
 *
 * Client component: the count + burst need timers. It SSRs a static "9" so there
 * is no hydration mismatch and no-JS visitors still see the band. Reduced-motion
 * pins it to a static 9 with no animation.
 */

// A real IELTS ascent: half-band steps from a beginner's 4.0 all the way to a 9.
const STEPS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

// 12 burst particles on a ring, alternating burgundy + gold. Positions are
// computed deterministically (no Math.random) so server and client markup match.
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const dist = 84 + (i % 3) * 18; // 84 / 102 / 120, repeating
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist),
    gold: i % 2 === 0,
    size: i % 3 === 0 ? 9 : 6,
  };
});

export function BandCountUp() {
  const [val, setVal] = useState<number>(9);
  const [boom, setBoom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced-motion: leave it on the static 9 (the initial state).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    // 11 steps now rather than 7, so each is quicker and the whole climb still
    // takes ~1.4s — the same rhythm the card had at 6.0 → 9.
    const STEP_MS = 130;
    const top = STEP_MS * STEPS.length; // moment the climb reaches 9

    function cycle() {
      setBoom(false);
      setVal(STEPS[0]); // snap back to the bottom
      STEPS.forEach((v, i) => at(STEP_MS * (i + 1), () => setVal(v)));
      at(top, () => setBoom(true)); // 🎉 success
      at(top + 1000, () => setBoom(false));
      at(top + 4400, cycle); // rest on the 9, then replay — lively, not frantic
    }

    // Start once the card is on screen (it's above the fold, so usually at once).
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      at(400, cycle);
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          at(400, cycle);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const label = val >= 9 ? "9" : val.toFixed(1);

  return (
    <div ref={ref} role="img" aria-label="Overall band 9" className={`bcu-wrap${boom ? " bcu-boom" : ""}`}>
      <style>{BCU_CSS}</style>
      <span aria-hidden className="bcu-burst">
        <span className="bcu-ring" />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="bcu-particle"
            style={
              {
                "--x": `${p.x}px`,
                "--y": `${p.y}px`,
                width: p.size,
                height: p.size,
                background: p.gold ? "#E6B84A" : "#A32B57",
              } as React.CSSProperties
            }
          />
        ))}
      </span>
      <span aria-hidden className="bcu-num">
        {label}
      </span>
    </div>
  );
}

const BCU_CSS = `
.bcu-wrap{position:relative;display:flex;align-items:center;justify-content:center;width:100%}
.bcu-num{
  position:relative;z-index:2;
  font-family:var(--font-sora),system-ui,sans-serif;font-weight:700;
  font-size:clamp(112px,13vw,148px);line-height:.95;letter-spacing:-.05em;
  color:#121317;font-variant-numeric:tabular-nums;
  animation:bcu-idle 3.6s ease-in-out infinite;
}
.bcu-boom .bcu-num{animation:bcu-pop .72s cubic-bezier(.2,.9,.2,1.2)}
@keyframes bcu-idle{0%,100%{text-shadow:0 0 0 rgba(125,1,50,0)}50%{text-shadow:0 0 40px rgba(125,1,50,.20)}}
@keyframes bcu-pop{
  0%{transform:scale(1);text-shadow:0 0 30px rgba(125,1,50,.28);color:#121317}
  34%{transform:scale(1.17);text-shadow:0 0 64px rgba(125,1,50,.50);color:#7d0132}
  100%{transform:scale(1);text-shadow:0 0 36px rgba(125,1,50,.22);color:#121317}
}
.bcu-burst{position:absolute;left:50%;top:50%;width:0;height:0;z-index:1;pointer-events:none}
.bcu-ring{
  position:absolute;left:50%;top:50%;width:120px;height:120px;margin:-60px 0 0 -60px;
  border-radius:50%;border:3px solid rgba(125,1,50,.45);opacity:0;transform:scale(.4)
}
.bcu-boom .bcu-ring{animation:bcu-ring .78s ease-out}
@keyframes bcu-ring{0%{opacity:.7;transform:scale(.4);border-width:3px}100%{opacity:0;transform:scale(2);border-width:.5px}}
.bcu-particle{position:absolute;left:50%;top:50%;border-radius:50%;opacity:0;transform:translate(-50%,-50%)}
.bcu-boom .bcu-particle{animation:bcu-burst .74s ease-out forwards}
@keyframes bcu-burst{
  0%{opacity:1;transform:translate(-50%,-50%) translate(0,0) scale(.3)}
  70%{opacity:1}
  100%{opacity:0;transform:translate(-50%,-50%) translate(var(--x),var(--y)) scale(1)}
}
@media (prefers-reduced-motion:reduce){
  .bcu-num{animation:none}
  .bcu-ring,.bcu-particle{display:none}
}
`;
