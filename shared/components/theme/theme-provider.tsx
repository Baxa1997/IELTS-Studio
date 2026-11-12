"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  DEFAULT_THEME_MODE,
  readThemeCookie,
  resolveTheme,
  THEME_COOKIE,
  themeCookie,
  type ThemeMode,
} from "@/lib/theme/mode";

interface ThemeCtx {
  /** What the user chose: light, dark, or follow the OS. */
  mode: ThemeMode;
  /** What that resolves to right now. */
  resolved: "light" | "dark";
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

/* ── the two external stores ───────────────────────────────────────────────
 *
 * ⚠️ `useSyncExternalStore` RATHER THAN `useState` + `useEffect`, and not for
 * style points. The preference lives in a session cookie and the OS theme in a
 * media query: both are state OUTSIDE React that the server cannot read, which
 * is the exact thing this hook exists for. Reading them in an effect and
 * calling `setState` works, but it renders once with the wrong value and again
 * with the right one — a cascading render the `react-hooks/set-state-in-effect`
 * rule rejects, and a visible flicker on any reader who is not on the default.
 *
 * It also makes hydration correct by construction: React renders
 * `getServerSnapshot` on the server AND during hydration, so the markup always
 * matches, then swaps to the client snapshot in a follow-up render. That is why
 * `resolved` no longer has to be nullable the way it did under `useState`.
 *
 * The snapshots are CACHED IN MODULE SCOPE because the hook compares them by
 * identity and calls the getter on every render: a getter that recomputes a
 * fresh value each time would loop forever. `cachedMode = null` is the
 * invalidation signal — the next read goes back to the browser.
 */

const listeners = new Set<() => void>();
let cachedMode: ThemeMode | null = null;

function notify() {
  for (const l of listeners) l();
}

function readMode(): ThemeMode {
  try {
    const stored = readThemeCookie(document.cookie);
    if (stored) return stored;
  } catch {
    // Cookies blocked (embedded webview, a hardened browser). `ThemeScript` hit
    // the same wall and left the page light; agree with it.
  }
  // Nothing chosen in THIS visit: the default, which is light — not the OS and
  // not last visit's choice. See lib/theme/mode.
  return DEFAULT_THEME_MODE;
}

function modeSnapshot(): ThemeMode {
  if (cachedMode === null) cachedMode = readMode();
  return cachedMode;
}

/** The server never reads the theme cookie (see lib/theme/mode). The default is also what `ThemeScript`
 *  assumes for a reader who has never chosen, so the first frame agrees with the
 *  class that script already put on <html>. */
function modeServerSnapshot(): ThemeMode {
  return DEFAULT_THEME_MODE;
}

/** Lazily opened: `BroadcastChannel` is missing in some embedded webviews. */
let channel: BroadcastChannel | null | undefined;
function themeChannel(): BroadcastChannel | null {
  if (channel === undefined) {
    channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(THEME_COOKIE);
  }
  return channel;
}

function subscribeMode(listener: () => void): () => void {
  listeners.add(listener);
  // Another TAB of the same app changing the theme. Same person, same
  // preference — it should not take a reload to catch up. ⚠️ A cookie write
  // fires no `storage` event the way `localStorage` did, so the tab that
  // changed it says so on a channel; the rest re-read the cookie.
  const ch = themeChannel();
  const onMessage = () => {
    cachedMode = null;
    listener();
  };
  ch?.addEventListener("message", onMessage);
  return () => {
    listeners.delete(listener);
    ch?.removeEventListener("message", onMessage);
  };
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemSnapshot(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/** Light: the same assumption `ThemeScript` makes before it can measure. */
function systemServerSnapshot(): boolean {
  return false;
}

function subscribeSystem(listener: () => void): () => void {
  const mq = window.matchMedia(DARK_QUERY);
  // The OS theme changes while the tab is open — on a schedule, or because
  // someone flipped it. In "system" mode the page has to follow it live.
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

/**
 * Holds the theme choice for any UI that needs to display it.
 *
 * The class on <html> is already correct by the time this mounts — `ThemeScript`
 * set it before the first paint — so this provider never causes the visible
 * theme to change on load. It catches up with what that script decided, and
 * owns changes from here on.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribeMode, modeSnapshot, modeServerSnapshot);
  const systemDark = useSyncExternalStore(subscribeSystem, systemSnapshot, systemServerSnapshot);
  const resolved = resolveTheme(mode, systemDark);

  // Keep <html> in step. This is the legitimate use of an effect — pushing
  // React's state OUT to something external (the DOM) rather than pulling
  // external state in.
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", resolved === "dark");
    el.style.colorScheme = resolved;
  }, [resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    cachedMode = m;
    try {
      document.cookie = themeCookie(m);
      themeChannel()?.postMessage(m);
    } catch {
      // Preference will not survive the navigation; this page still flips.
    }
    notify();
  }, []);

  const value = useMemo<ThemeCtx>(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside <ThemeProvider>");
  return v;
}
