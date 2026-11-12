import { DEFAULT_THEME_MODE, THEME_COOKIE } from "@/lib/theme/mode";

/**
 * The no-flash script. Renders as a synchronous <script> in <head>, so it runs
 * after the DOM element exists and BEFORE the first paint.
 *
 * ⚠️ IT MUST STAY SYNCHRONOUS AND INLINE. Move it to an external file, add
 * `defer`, or push it into a `useEffect` and you reintroduce the flash: the
 * browser paints the light palette, then React swaps the class, and a dark-mode
 * user gets a white strobe on every cold navigation. That flash is the entire
 * reason this ugly little string exists.
 *
 * It is also deliberately defensive. Storage APIs throw — not return null,
 * THROW — in a browser set to block site data and inside some embedded
 * webviews. An exception here happens before hydration and would take the whole
 * page down, so the body is wrapped in a bare try/catch whose fallback is
 * simply "stay light".
 *
 * The choice is read from a SESSION cookie (see lib/theme/mode), so it lasts
 * until the browser closes and every new visit starts on `DEFAULT_THEME_MODE` —
 * light, NOT the OS setting. The OS is consulted only when "system" has been
 * chosen in this visit. The old `localStorage` entry is removed, so a choice
 * remembered from before the switch cannot come back.
 */
const SCRIPT = `
(function(){
  try {
    var m = null, parts = document.cookie.split(";");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].trim().split("=");
      if (kv[0] === ${JSON.stringify(THEME_COOKIE)}) m = kv[1];
    }
    if (m !== "light" && m !== "dark" && m !== "system") m = ${JSON.stringify(DEFAULT_THEME_MODE)};
    var dark = m === "dark" ||
      (m === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var el = document.documentElement;
    el.classList.toggle("dark", dark);
    el.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
  try { localStorage.removeItem(${JSON.stringify(THEME_COOKIE)}); } catch (e) {}
})();
`.trim();

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
