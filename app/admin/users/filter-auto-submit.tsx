"use client";

import { useEffect, useRef } from "react";

/**
 * Make the filter selects act the moment they change.
 *
 * The design's filter bar has no Apply button — you pick a role and the table
 * is already filtered. That needs one line of JavaScript, and it is written
 * this way rather than as an `onChange` on each field so the page stays a plain
 * GET form: the selects are ordinary form controls, the URL is still shareable,
 * and with JavaScript off the `<noscript>` Apply button does the same job.
 *
 * Renders nothing. It only wires the form it happens to sit inside.
 */
export function FilterAutoSubmit() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;

    const onChange = (event: Event) => {
      // Typing in the search box must NOT submit on every keystroke — that is a
      // page reload per character. Only the selects act immediately; the text
      // input submits on Enter, as a form field already does.
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "SELECT") form.requestSubmit();
    };

    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);

  return <span ref={anchor} hidden />;
}
