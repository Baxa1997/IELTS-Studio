import { INK, LINE, MUTED, SANS } from "@/app/admin/_components/ui";
import { INDIGO_FILL, ON_INDIGO, PANEL } from "@/lib/theme/tokens";

/**
 * The few control styles the broadcast composer's parts share — the console
 * kit (`ui.tsx`) has no buttons or fields of these shapes, and the parts must
 * not drift into four slightly different ones.
 */

export const clipStyle: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/** A field with no chrome at all — the subject line, set as a title. */
export const bare: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  border: 0,
  outline: "none",
  resize: "none",
  padding: 0,
  background: "transparent",
  color: INK,
  fontFamily: SANS,
};

export const field: React.CSSProperties = {
  width: "100%",
  fontFamily: SANS,
  fontSize: 13.5,
  color: INK,
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "8px 10px",
  boxSizing: "border-box",
};

export const primaryBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13.5,
  fontWeight: 600,
  padding: "8px 18px",
  borderRadius: 10,
  border: `1px solid ${INDIGO_FILL}`,
  background: INDIGO_FILL,
  color: ON_INDIGO,
  cursor: "pointer",
};

export const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  padding: "8px 14px",
  borderRadius: 10,
  border: `1px solid ${LINE}`,
  background: PANEL,
  color: INK,
  cursor: "pointer",
};

export const ghostBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 12.5,
  padding: "7px 11px",
  border: "none",
  borderRadius: 8,
  background: "transparent",
  color: MUTED,
  cursor: "pointer",
};
