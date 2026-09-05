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
 *
 * IT ALSO OWNS ARRIVING AT A HASH, because the reveal animation is exactly what
 * breaks it. "Platform" and "Pricing" in the site header point at /#platform and
 * /#pricing, which exist only on this page, so every other page in the site
 * links in here with a hash — and it did not work:
 *
 *   1. The App Router does not scroll to a hash on a cross-route navigation. It
 *      lands you at the top of the home page, so from /privacy or /terms the
 *      header's "Platform" link looked simply broken.
 *   2. Even scrolled, every `.reveal` above the target is still collapsed and
 *      translated at that moment, so the target's measured offset is wrong. The
 *      browser jumps to a stale position and then the content shifts under it as
 *      each section reveals.
 *
 * So when there IS a hash, the animation is skipped entirely: everything reveals
 * at once to settle the layout, and only then do we scroll. A reader arriving at
 * a specific section wants the section, not the choreography.
 *
 * (The third part of the fix is CSS: `section[id]` carries a scroll-margin-top
 * in globals.css, because the header is sticky and 74px tall and would otherwise
 * sit on top of whatever you jumped to.)
 */
export function ScrollReveal() {
  useEffect(() => {
    const all = () =>
      Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)"));
    const revealAll = () => all().forEach((el) => el.classList.add("is-visible"));

    /** Settle the layout, then put the hash target under the header. Returns
     *  false when there is no hash, or nothing on the page matches it. */
    const goToHash = (): boolean => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!id) return false;
      const target = document.getElementById(id);
      if (!target) return false;
      revealAll();
      // Two frames: one for the class change to apply, one for layout to settle
      // at its final height before we measure where the target actually is.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => target.scrollIntoView({ block: "start" })),
      );
      return true;
    };

    if (goToHash()) {
      // Everything is already visible; a same-page hash link still needs handling.
      const onHash = () => goToHash();
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }

    const els = all();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      revealAll();
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

    // A hash arriving later (a same-page "Platform" click) gets the same
    // treatment: stop animating, settle, scroll.
    const onHash = () => {
      io.disconnect();
      goToHash();
    };
    window.addEventListener("hashchange", onHash);

    return () => {
      io.disconnect();
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  return null;
}
