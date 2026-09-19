import type { CSSProperties } from "react";
import { PANEL, WHITE, withAlpha } from "@/lib/theme/tokens";

/** Brand tokens + shared button styles for the reading experience. Imported by
 *  both the single-passage runner and the full-test runner.
 *
 *  The accent is the product burgundy — see `lib/theme/tokens.ts` for the ramp
 *  and why the learner app and the staff console are now two different brands. */
export const SANS = "var(--font-hanken), system-ui, sans-serif";
export const SERIF = "var(--font-newsreader), Georgia, serif";
export const BRAND = "#7D0132";
export const BRAND_DARK = "#5C0125";
export const INK = "#121317";
export const MUTED = "#4A505C";
export const EMERALD = "#2f8f5b";
export const RED = "#c2410c";
export const AMBER = "#F59E0B";

export const cardStyle: CSSProperties = {
  background: PANEL,
  border: "1px solid #E6E8EC",
  borderRadius: 14,
};

export const btnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderRadius: 11,
  padding: "11px 18px",
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 15,
  border: "none",
  textDecoration: "none",
};

export function primaryBtn(disabled = false, accent?: string): CSSProperties {
  return {
    ...btnBase,
    background: accent ?? BRAND,
    color: WHITE,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "default" : "pointer",
    boxShadow: accent
      ? `0 12px 24px -12px ${withAlpha(accent, 70)}`
      : "0 12px 24px -12px rgba(125,1,50,.55)",
  };
}
