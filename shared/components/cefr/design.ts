

export const SANS = "var(--font-hanken), system-ui, sans-serif";
export const SERIF = "var(--font-newsreader), Georgia, serif";

// ---- "Reading B" design tokens (Claude Design project) ---------------------
export const JAKARTA = "'Plus Jakarta Sans', var(--font-hanken), system-ui, sans-serif";
export const PLEX = "'IBM Plex Serif', var(--font-newsreader), Georgia, serif";
/* ⚠️ TOKENS, AND THE DESIGN'S NAVY IS NOW TWO OF THEM. #0f172a was both the
   header's GROUND (under white type) and a heading INK, and those move in
   opposite directions in dark mode — so the ground is `D_HEAD`, dark in both
   themes, and `D_DARK` is an ink that goes light. Reusing one for the other is
   how this screen went navy-on-black. Light values are the old hex exactly
   (`--ex-cf-*` in globals.css). */
export const D_HEAD = "var(--ex-cf-head)"; // header ground
export const D_DARK = "var(--ex-cf-ink)"; // heading ink
export const D_ABORDER = "var(--ex-cf-gap)"; // gap underline
export const D_PAGE = "var(--ex-cf-page)"; // canvas
export const D_SLATE = "var(--ex-cf-slate)";
export const D_SLATE2 = "var(--ex-cf-slate2)";
export const D_SLATE3 = "var(--ex-cf-slate3)";
export const D_INK = "var(--ex-cf-body)"; // body text
