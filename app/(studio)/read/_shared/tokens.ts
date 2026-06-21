import type { CSSProperties } from "react";

/** Option A brand tokens + shared button styles for the reading experience.
 *  Imported by both the single-passage runner and the full-test runner. */
export const SANS = "var(--font-hanken), system-ui, sans-serif";
export const SERIF = "var(--font-newsreader), Georgia, serif";
export const INDIGO = "#4F46E5";
export const INDIGO_DARK = "#4338CA";
export const INK = "#1E1B2E";
export const MUTED = "#5A5670";
export const EMERALD = "#2f8f5b";
export const RED = "#c2410c";
export const AMBER = "#F59E0B";

export const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #E7E4D6",
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

export function primaryBtn(disabled = false): CSSProperties {
  return {
    ...btnBase,
    background: INDIGO,
    color: "#fff",
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "default" : "pointer",
    boxShadow: "0 12px 24px -12px rgba(79,70,229,.7)",
  };
}
