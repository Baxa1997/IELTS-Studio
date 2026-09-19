/** The learner settings forms' shared field, label, button and message styles. */

import {
  BRAND,
  GREEN,
  PANEL,
  RED_DEEP,
  SLATE_INK as INK,
  WARM_LINE_SOFT,
  WHITE,
} from "@/lib/theme/tokens";


export const labelStyle: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: INK };

export const fieldStyle: React.CSSProperties = {
  height: 44,
  padding: "0 12px",
  border: `1px solid ${WARM_LINE_SOFT}`,
  borderRadius: 11,
  background: PANEL,
  font: "inherit",
  fontSize: 15,
  color: INK,
};

export function buttonStyle(
  pending: boolean,
  tone: "brand" | "danger" = "brand",
): React.CSSProperties {
  return {
    height: 44,
    padding: "0 20px",
    border: "none",
    borderRadius: 11,
    background: tone === "danger" ? "#A13A2C" : BRAND,
    color: WHITE,
    font: "inherit",
    fontSize: 14.5,
    fontWeight: 700,
    cursor: pending ? "default" : "pointer",
    opacity: pending ? 0.6 : 1,
  };
}

export function Message({ state }: { state: { error?: string; ok?: string } }) {
  if (state.error) {
    return (
      <p role="alert" style={{ ...box, color: RED_DEEP, background: "#FBEFEC" }}>
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" style={{ ...box, color: GREEN, background: "#E8F3EC" }}>
        {state.ok}
      </p>
    );
  }
  return null;
}

const box: React.CSSProperties = {
  margin: 0,
  padding: "9px 12px",
  borderRadius: 10,
  fontSize: 13.5,
  lineHeight: 1.5,
};
