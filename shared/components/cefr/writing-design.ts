import {
  BRAND as D_ACCENT,
  BRAND_FILL as D_ACCENT_FILL,
  BRAND_SOFT as D_ATINT2,
  LINE as D_LINE,
  PANEL,
  WHITE,
  withAlpha,
} from "@/lib/theme/tokens";

import { D_DARK, D_INK, D_PAGE, D_SLATE, D_SLATE2, JAKARTA } from "./design";

export const W_ACCENT = D_ACCENT; // text, edges, bars
export const W_FILL = D_ACCENT_FILL; // anything carrying white — see `--tk-brand-fill`
export const W_SOFT2 = D_ATINT2; // faf5ff
export const W_LINE = D_LINE; // e2e8f0
export const W_SOFTLINE = "var(--ex-cf-softline)"; // faint inner divider
export const W_CANVAS = D_PAGE; // f8fafc
export const W_INK = D_DARK; // 0f172a
export const W_BODY = D_INK; // 1e293b
export const W_MUTED = D_SLATE; // 64748b
export const W_FAINT = D_SLATE2; // 94a3b8

export const WRITING_KIND: Record<string, string> = {
  "1.1": "Informal · Message",
  "1.2": "Formal · Letter",
  "2": "Forum · Opinion",
};
export const WRITING_COACH_CHIPS = ["Plan an outline", "Useful vocabulary", "Check my idea"];

// CEFR task → the IELTS tutor's task_type, so the coach tailors letter vs. essay advice.
export function tutorTypeForTask(task: string): string {
  return task === "2" ? "task2" : "task1_general";
}
export function secondsForWritingTask(task: string): number {
  return task === "2" ? 30 * 60 : 20 * 60;
}
export function wPrimaryBtn(disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    padding: "0 18px",
    border: "none",
    borderRadius: 10,
    background: W_FILL,
    color: WHITE,
    fontFamily: JAKARTA,
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
    boxShadow: disabled ? "none" : `0 10px 22px -12px ${withAlpha(W_FILL, 70)}`,
  };
}
export const wGhostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 40,
  padding: "0 16px",
  border: `1px solid ${W_LINE}`,
  borderRadius: 10,
  background: PANEL,
  color: W_MUTED,
  fontFamily: JAKARTA,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
