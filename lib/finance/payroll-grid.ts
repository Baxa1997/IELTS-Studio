/**
 * The shape of a several-months payroll grid: teachers down, months across.
 *
 * Pure model, no database. Split from the loader beside it so the sheet builder
 * can render one without dragging a `server-only` module into its import graph
 * — and so the arithmetic can be exercised against made-up numbers in a test
 * rather than only against a real center's month.
 */

export type PaymentState = "paid" | "advance" | "unpaid" | "none";

export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  paid: "Paid",
  advance: "Advance",
  unpaid: "Not paid",
  none: "—",
};

export interface TeacherMonthCell {
  netMinor: number;
  paidMinor: number;
  state: PaymentState;
}

export interface PayrollMonthColumn {
  month: string;
  label: string;
  /** False when no run has been saved and the figures were computed just now. */
  saved: boolean;
  status: "draft" | "approved" | "paid" | "provisional";
  netMinor: number;
  paidMinor: number;
  /** Owed and untouched. */
  unpaidMinor: number;
  /** Part-paid: what is still outstanding on a teacher who has had something. */
  advanceOutstandingMinor: number;
}

export interface PayrollMonthsRow {
  teacherId: string;
  teacherName: string;
  /** Students across their classes in the most recent month shown. */
  students: number;
  cells: Map<string, TeacherMonthCell>;
  totalNetMinor: number;
  totalPaidMinor: number;
}

export interface PayrollMonthsData {
  columns: PayrollMonthColumn[];
  rows: PayrollMonthsRow[];
  totalNetMinor: number;
  totalPaidMinor: number;
  totalOutstandingMinor: number;
}

export function stateOf(netMinor: number, paidMinor: number): PaymentState {
  if (netMinor <= 0) return "none";
  if (paidMinor <= 0) return "unpaid";
  if (paidMinor >= netMinor) return "paid";
  return "advance";
}
