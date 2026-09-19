import { THEME_STORAGE_KEY } from "@/lib/theme/mode";

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
 * It is also deliberately defensive. `localStorage` throws — not returns null,
 * THROWS — in a browser set to block site data and inside some embedded
 * webviews. An exception here happens before hydration and would take the whole
 * page down, so the body is wrapped in a bare try/catch whose fallback is
 * simply "stay light".
 */
const SCRIPT = `
(function(){
  try {
    var m = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (m !== "light" && m !== "dark" && m !== "system") m = "system";
    var dark = m === "dark" ||
      (m === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var el = document.documentElement;
    el.classList.toggle("dark", dark);
    el.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
})();
`.trim();

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
