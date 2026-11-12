/**
 * Theme mode: the user's choice, and how it reaches the page before first paint.
 *
 * ⚠️ THE CHOICE LIVES IN A SESSION COOKIE, AND IT IS SUPPOSED TO FORGET.
 * The owner's call (2026-11-12): pick dark, close the browser, come back — the
 * site is light again. Every visit starts light. So the store is a cookie with
 * no `Expires`/`Max-Age`, which the browser drops when it closes, and NOT
 * `localStorage` (which is where it lived until then, and which remembered the
 * choice forever). Not `sessionStorage` either: that is per TAB, so a learner who
 * chose dark would get a light page in every new tab they opened.
 *
 * ⚠️ THE SERVER NEVER READS THIS COOKIE, and must not start. Calling `cookies()`
 * in the root layout would make every route dynamic and take the cached
 * marketing pages and front door with it — nothing fails, they just quietly stop
 * being static. `ThemeScript` reads `document.cookie` in <head> before paint
 * instead, so the server keeps sending identical HTML to everyone.
 *
 * Known edge: a browser set to "continue where you left off" restores session
 * cookies with the tabs, so there the choice survives a restart. That is the
 * browser's choice to restore the session, not ours to override.
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

/** The cookie name. `ThemeScript` interpolates it into its source string, so the
 *  two cannot drift. Same name as the old `localStorage` key, which the script
 *  clears so a choice remembered from before the switch cannot linger there. */
export const THEME_COOKIE = "ep-theme";

/** The theme stored in a `document.cookie` string, or null when none is valid. */
export function readThemeCookie(cookie: string): ThemeMode | null {
  for (const part of cookie.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === THEME_COOKIE && isThemeMode(v)) return v;
  }
  return null;
}

/** The `document.cookie` assignment that stores `mode` until the browser closes.
 *  ⚠️ NO `Expires` / `Max-Age` — adding one makes the choice outlive the visit,
 *  which is exactly what this cookie exists not to do. */
export function themeCookie(mode: ThemeMode): string {
  return `${THEME_COOKIE}=${mode}; Path=/; SameSite=Lax`;
}

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark" || v === "system";
}

/** What `mode` actually resolves to right now. Only meaningful in the browser:
 *  "system" depends on a media query the server cannot see. */
export function resolveTheme(mode: ThemeMode, prefersDark: boolean): "light" | "dark" {
  return mode === "system" ? (prefersDark ? "dark" : "light") : mode;
}
