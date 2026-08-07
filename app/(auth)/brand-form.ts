/**
 * Shared visual tokens for the auth screens (Option A brand).
 *
 * The sign-in panel and the organization registration modal have to look like
 * one surface, so the values live here rather than being copied per file —
 * duplicated tokens are how two forms quietly drift apart.
 */

export const SANS = "var(--font-hanken), system-ui, sans-serif";
export const SERIF = "var(--font-newsreader), Georgia, serif";
export const INDIGO = "#3B43B5";
export const INK = "#1A1C33";
export const MUTED = "#6b6e84";
export const LINE = "#DAD8C9";
export const HAIRLINE = "#E6E3D4";

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 13,
  color: "#3a3d52",
  marginBottom: 7,
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: `1px solid ${LINE}`,
  borderRadius: 11,
  fontFamily: SANS,
  fontWeight: 500,
  fontSize: 15,
  color: INK,
  background: "#fff",
};

/** Filled indigo call-to-action. */
export function primaryButtonStyle(pending: boolean): React.CSSProperties {
  return {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: INDIGO,
    color: "#fff",
    border: "none",
    borderRadius: 11,
    padding: "13px 16px",
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 16,
    cursor: pending ? "default" : "pointer",
    boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)",
    opacity: pending ? 0.75 : 1,
  };
}

/** Outlined companion to the primary button (same height, quieter weight). */
export function secondaryButtonStyle(pending = false): React.CSSProperties {
  return {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#fff",
    color: INK,
    border: `1px solid ${LINE}`,
    borderRadius: 11,
    padding: "13px 16px",
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 16,
    cursor: pending ? "default" : "pointer",
    opacity: pending ? 0.75 : 1,
  };
}

/** Inline form error — warm amber, matching the sign-in panel. */
export const errorStyle: React.CSSProperties = {
  fontFamily: SANS,
  fontWeight: 500,
  fontSize: 13.5,
  color: "#c2410c",
  background: "#FEF2E8",
  border: "1px solid #F6D7BE",
  borderRadius: 10,
  padding: "10px 12px",
  margin: 0,
};

/** Inline success/notice — calm indigo tint. */
export const noticeStyle: React.CSSProperties = {
  fontFamily: SANS,
  fontWeight: 500,
  fontSize: 13.5,
  lineHeight: 1.55,
  color: "#2D3286",
  background: "#EFEEFC",
  border: "1px solid #D9D7F5",
  borderRadius: 10,
  padding: "11px 13px",
  margin: 0,
};
