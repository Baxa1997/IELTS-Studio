/**
 * Theme mode: the user's choice, and how it reaches the page before first paint.
 *
 * ⚠️ THE PREFERENCE LIVES IN `localStorage`, NOT A COOKIE, AND THAT IS A
 * PERFORMANCE DECISION RATHER THAN A STYLE ONE.
 *
 * A cookie would be the obvious store — the server could then read it and
 * render `<html class="dark">` directly, with no client work at all. The cost
 * is that reading a cookie in the ROOT layout opts every route in the app out
 * of static rendering, because `cookies()` makes the whole subtree dynamic. The
 * marketing pages and the front door are the ones that are still cached, and
 * they are precisely the pages a first-time visitor lands on. Trading their
 * cacheability for a class name is a bad trade, and it would be an invisible
 * one — nothing fails, the pages just quietly stop being static.
 *
 * So the class is applied by `ThemeScript`, a tiny synchronous script in
 * <head>. It runs BEFORE the browser paints, so there is no flash of the wrong
 * theme, and the server keeps rendering identical HTML for everyone — which is
 * also why the markup can still be cached and shared.
 */

export type ThemeMode = "light" | "dark" | "system";

export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

/** The `localStorage` key. Also hard-coded inside `ThemeScript`'s source string,
 *  which cannot import it — change one and you must change the other. */
export const THEME_STORAGE_KEY = "ep-theme";

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark" || v === "system";
}

/** What `mode` actually resolves to right now. Only meaningful in the browser:
 *  "system" depends on a media query the server cannot see. */
export function resolveTheme(mode: ThemeMode, prefersDark: boolean): "light" | "dark" {
  return mode === "system" ? (prefersDark ? "dark" : "light") : mode;
}
