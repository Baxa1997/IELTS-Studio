"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  HIDE_IN_REPLAY,
  hitUrl,
  isProductionHost,
  isSecretPath,
  isStaffPath,
  METRIKA_ID,
  METRIKA_TAG,
  safeReferrer,
} from "../_lib/metrika";

type Ym = ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[][]; l?: number };

declare global {
  interface Window {
    ym?: Ym;
  }
}

/**
 * Yandex Metrica, set up for an app that changes pages without reloading.
 *
 * Yandex's loader, with the `||` its copy-paste form lost restored; `defer:
 * true` per Yandex's SPA guide, so the counter sends nothing by itself and
 * every page view is a `hit` from here — with a URL scrubbed by `hitUrl`.
 * The rules for what may be seen live in app/_lib/metrika.ts.
 *
 * Renders nothing. Runs in the browser only, so the root layout stays static.
 */
export function YandexMetrika() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!isProductionHost(window.location.hostname)) return;

    /* Staff screens and secret pages: blur the whole body in Session Replay,
       portals included — a dialog renders outside a layout's wrapper. Toggled
       per route because one session can move from a learner page into the
       console, or onto a /p/ lesson, without a reload; once loaded, the
       recording cannot be stopped, only blurred. */
    document.body.classList.toggle(HIDE_IN_REPLAY, isStaffPath(pathname) || isSecretPath(pathname));

    if (isSecretPath(pathname)) return;
    if (!window.ym) load();

    const url = hitUrl(window.location.origin, pathname, window.location.search);
    const referer = previous.current ?? safeReferrer(document.referrer, window.location.origin);
    window.ym!(METRIKA_ID, "hit", url, { referer });
    previous.current = url;
  }, [pathname]);

  return null;
}

function load() {
  /* ⚠️ `arguments`, NOT a rest array, and a `function`, not an arrow: this is
     Yandex's own queue stub, and tag.js replays the queued `arguments` objects
     when it loads. Keep it byte-for-byte in spirit. */
  const ym = function () {
    // eslint-disable-next-line prefer-rest-params
    (ym.a = ym.a || []).push(arguments as unknown as unknown[]);
  } as Ym;
  ym.l = Date.now();
  window.ym = ym;

  const script = document.createElement("script");
  script.async = true;
  script.src = METRIKA_TAG;
  document.head.appendChild(script);

  ym(METRIKA_ID, "init", {
    defer: true,
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    accurateTrackBounce: true,
    trackLinks: true,
  });
}
