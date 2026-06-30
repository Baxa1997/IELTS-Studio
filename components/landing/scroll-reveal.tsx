"use client";

import { useEffect } from "react";

/**
 * Reveal-on-scroll controller for the marketing page. Elements with the `reveal`
 * class start faded/translated (via globals.css) and animate in once they enter
 * the viewport. Renders nothing — it just wires an IntersectionObserver.
 *
 * Falls back to revealing everything immediately when the observer is unavailable
 * or the visitor prefers reduced motion. (A <noscript> style on the page reveals
 * the content when JS is off, so nothing is permanently hidden.)
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
