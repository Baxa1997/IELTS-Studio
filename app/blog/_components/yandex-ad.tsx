"use client";

import { useEffect, useId, useRef } from "react";

import { useSession } from "@/app/_landing/_hooks/use-signed-in";

/**
 * Yandex Advertising Network on the blog — autoplacement for the whole blog,
 * plus a manual unit for a fixed slot. `app/blog/_lib/ads.ts` has the config
 * and why ads live nowhere else.
 *
 * Signed-out readers only: whoever has an account is a learner we already
 * have — very likely a paying one — and an ad on their screen is us charging
 * them twice. Both wait for the session check (`null`) rather than reading
 * "unknown" as signed out, so a signed-in reader never loads Yandex at all.
 */

const CONTEXT = "https://yandex.ru/ads/system/context.js";
const AP_LOADER = "https://yandex.ru/ads/system/ap-loader.js";

type YaWindow = Window & {
  yaContextCb?: Array<() => void>;
  Ya?: { Context: { AdvManager: { render(opts: { blockId: string; renderTo: string }): void } } };
};

function ensureScript(src: string, data?: Record<string, string>) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  for (const [k, v] of Object.entries(data ?? {})) s.dataset[k] = v;
  document.head.appendChild(s);
}

const onBlog = () => /^\/blog(\/|$)/.test(window.location.pathname);

/**
 * Yandex's autoplacement snippet, mounted once in the blog layout.
 *
 * ⚠️ LEAVING THE BLOG RELOADS THE PAGE. Once `ap-loader.js` runs it stays in
 * the tab and keeps placing ads in whatever the page becomes — and this is an
 * App Router site, so "Start practising" or signing in from the article's
 * dialog is a CLIENT navigation into the landing page or the learner's
 * dashboard, still carrying the script. A script cannot be unloaded; a full
 * load of the destination is the only way to arrive without it. Same when the
 * reader signs in without leaving: the reload drops the ads they no longer get.
 *
 * The pathname check is not decoration: React's dev StrictMode unmounts and
 * remounts every effect once, and without it that would reload the article in
 * a loop.
 */
export function YandexAutoAds({ pageId }: { pageId: string | null }) {
  const signedIn = useSession();
  const loaded = useRef(false);

  useEffect(() => {
    if (!pageId) return;
    if (signedIn === true && loaded.current) {
      window.location.reload();
      return;
    }
    if (signedIn !== false || loaded.current) return;
    loaded.current = true;
    ensureScript(CONTEXT);
    ensureScript(AP_LOADER, { pageId });
  }, [pageId, signedIn]);

  useEffect(
    () => () => {
      if (!loaded.current) return;
      // The router commits the new URL before the old layout unmounts — the
      // timeout covers the cases where it lands a tick later.
      setTimeout(() => {
        if (!onBlog()) window.location.reload();
      }, 0);
    },
    [],
  );

  return null;
}

/**
 * One manual unit, rendered where it sits.
 *
 * ⚠️ RENDERED FROM AN EFFECT, NOT FROM AN INLINE SNIPPET. Yandex's documented
 * snippet renders once, on the full page load that ran it; moving from one
 * article to the next is a client navigation, and the second article would get
 * an empty box. Each mount queues its own `render` on `yaContextCb` — which
 * Yandex drains whenever its loader arrives, before or after us — into a
 * container id unique to the mount.
 */
export function YandexAd({ blockId }: { blockId: string | null }) {
  const signedIn = useSession();
  // useId yields ":r1:", which is not a safe id for Yandex's lookup.
  const renderTo = `yandex_rtb_${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const done = useRef(false);

  const show = blockId !== null && signedIn === false;

  useEffect(() => {
    if (!show || !blockId || done.current) return;
    done.current = true;
    const w = window as YaWindow;
    w.yaContextCb = w.yaContextCb || [];
    w.yaContextCb.push(() => {
      // The reader may have navigated away before the loader arrived.
      if (!document.getElementById(renderTo)) return;
      w.Ya?.Context.AdvManager.render({ blockId, renderTo });
    });
    ensureScript(CONTEXT);
  }, [show, blockId, renderTo]);

  if (!show) return null;
  // No reserved height: an unfilled unit (common at first, and everywhere an
  // ad blocker runs) would leave a blank hole in the article.
  return <div id={renderTo} style={{ marginTop: 36 }} />;
}
