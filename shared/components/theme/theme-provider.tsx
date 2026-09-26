"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { isThemeMode, resolveTheme, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme/mode";

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
 * style points. The preference lives in `localStorage` and the OS theme in a
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
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(raw)) return raw;
  } catch {
    // Site data blocked (private window, embedded webview, a hardened browser).
    // `ThemeScript` hit the same wall and left the page light; agree with it.
  }
  return "system";
}

function modeSnapshot(): ThemeMode {
  if (cachedMode === null) cachedMode = readMode();
  return cachedMode;
}

/** The server has no localStorage. "system" is also what `ThemeScript` assumes
 *  for a reader who has never chosen, so the first frame agrees with the class
 *  that script already put on <html>. */
function modeServerSnapshot(): ThemeMode {
  return "system";
}

function subscribeMode(listener: () => void): () => void {
  listeners.add(listener);
  // Another TAB of the same app changing the theme. Same person, same
  // preference — it should not take a reload to catch up.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY) return;
    cachedMode = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
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
      localStorage.setItem(THEME_STORAGE_KEY, m);
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
