"use client";

import { useEffect, useId, useRef, useState } from "react";

import { useSession } from "../_hooks/use-signed-in";

/**
 * Yandex Advertising Network on the public site — manual banners in fixed
 * slots, and autoplacement on the blog. `../_lib/ads.ts` has the config and
 * where ads may and may not go.
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
export function YandexAd({ blockId, style }: { blockId: string | null; style?: React.CSSProperties }) {
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
  // `style` is the host page's frame (its column width and spacing) — the
  // container itself carries no layout of its own.
  return <div id={renderTo} style={{ marginTop: 36, ...style }} />;
}

/** Gap between the content and the rail, and between the rail and the edge. */
const RAIL_GAP = 24;
/** The narrowest Yandex skyscraper (160×600); below it there is no rail. */
const RAIL_MIN = 160;
/** The classic sidebar width (300×600); wider margins do not widen the ad. */
const RAIL_MAX = 300;
/** Clears the sticky island header (`section[id]` in globals.css uses 96). */
const RAIL_TOP = 112;

/** The viewport width at which a rail of RAIL_MIN fits beside `content`. */
export function railMinViewport(content: number): number {
  return content + 2 * (RAIL_GAP + RAIL_MIN + RAIL_GAP);
}

function useMinWidth(px: number): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const on = () => setOk(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [px]);
  return ok;
}

/**
 * A banner in the empty margin to the right of the content, in view from the
 * first screen and following the reader down (owner, 2026-11-19: "so at the
 * initial visit it shows an ad").
 *
 * Mounted inside the content's own box, which must be `position: relative`
 * and centred on the viewport: the rail spans that box's height, so its sticky
 * banner stops where the content ends instead of riding over the related
 * stories and the footer.
 *
 * ⚠️ NOT MOUNTED, NOT MERELY HIDDEN, ON A NARROW SCREEN. A rail behind
 * `display: none` still asks Yandex for an ad and is "shown" to nobody — a
 * wasted request at best, an invisible impression Yandex can penalise at
 * worst. `matchMedia` decides whether it exists at all.
 *
 * ⚠️ ITS OWN BLOCK ID — see YANDEX_AD_SLOTS.sidebar: the page already renders
 * the bottom banner, and one block id may render once per page.
 */
export function YandexRail({ blockId, content }: { blockId: string | null; content: number }) {
  const wide = useMinWidth(railMinViewport(content));
  if (!blockId || !wide) return null;
  return (
    <aside
      aria-label="Advertisement"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `calc(50% + ${content / 2 + RAIL_GAP}px)`,
        width: `clamp(${RAIL_MIN}px, calc((100vw - ${content}px) / 2 - ${2 * RAIL_GAP}px), ${RAIL_MAX}px)`,
      }}
    >
      <div style={{ position: "sticky", top: RAIL_TOP }}>
        <YandexAd blockId={blockId} style={{ marginTop: 0 }} />
      </div>
    </aside>
  );
}
