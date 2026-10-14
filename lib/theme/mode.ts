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

/**
 * What a reader who has never chosen gets: LIGHT, whatever their OS is set to.
 *
 * ⚠️ NOT "system", and that is the owner's call (2026-10-14), not an oversight.
 * It used to be "system", so every visitor on a dark-mode phone or laptop met
 * the site dark on their first visit — the product's own first impression, and
 * the one its screenshots and marketing are drawn in, is light. Following the
 * device is still one tap away in Settings; it is just no longer what happens
 * by default. `ThemeScript`, the provider's fallback and its server snapshot all
 * read this one constant, so they cannot disagree about the first frame.
 */
export const DEFAULT_THEME_MODE: ThemeMode = "light";

/** The `localStorage` key. `ThemeScript` interpolates it into its source string,
 *  so the two cannot drift. */
export const THEME_STORAGE_KEY = "ep-theme";

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark" || v === "system";
}

/** What `mode` actually resolves to right now. Only meaningful in the browser:
 *  "system" depends on a media query the server cannot see. */
export function resolveTheme(mode: ThemeMode, prefersDark: boolean): "light" | "dark" {
  return mode === "system" ? (prefersDark ? "dark" : "light") : mode;
}
