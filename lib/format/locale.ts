/**
 * The ONE locale every rendered date, time and number is formatted in.
 *
 * ⚠️ THIS EXISTS BECAUSE "NO LOCALE" IS A HYDRATION BUG, NOT A DEFAULT.
 *
 * `toLocaleString()` / `toLocaleDateString()` with no locale — and equally with
 * `[]` or `undefined` in the locale slot — means "use the runtime's default",
 * and the runtime is a different thing in the two places a client component
 * renders. Node resolves it from the server's environment; the browser resolves
 * it from the reader's own settings. A learner in Tashkent with a Russian
 * browser was served `1,100` and rendered `1 100`, so React found different text
 * in the same node and threw the whole landing page's hydration away.
 *
 * The failure is INVISIBLE to anyone developing in an en-* locale: it lives in
 * the reader's settings rather than in the code, so it cannot be reproduced by
 * reading the call site harder. Eleven of these had accumulated before one was
 * noticed.
 *
 * en-GB because it is what this codebase had already chosen every time somebody
 * wrote the locale out (six call sites did), because day-month-year and a 24h
 * clock are what the centres reading these screens expect, and because it groups
 * thousands with a comma exactly as en-US does — so pinning it moved no number
 * that was already on screen.
 *
 * NOT the reader's locale. A deliberate, uniform format is the point: dates have
 * to be comparable between a teacher's screen and the payroll export, and the
 * product's own copy is English.
 */
export const UI_LOCALE = "en-GB";
