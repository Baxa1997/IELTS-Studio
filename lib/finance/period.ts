/**
 * Periods. Finance asks "what happened between two dates" on every screen, and
 * payroll asks it about a calendar month specifically, so both live here rather
 * than being re-derived (differently) on each page.
 *
 * Everything is a plain `YYYY-MM-DD` string in the center's own local calendar.
 * Dates in this module are DATES, not timestamps: a payment made at 23:50 on
 * the 31st belongs to that month regardless of what UTC thought at the time.
 */

export interface Period {
  from: string;
  to: string;
  label: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const isDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Today, in the browser-free way a server component has to ask. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonths(monthStart: string, months: number): string {
  const d = new Date(`${monthStart}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** The 1st of the month a date falls in — the canonical `period_month`. */
export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function monthEnd(monthStartDate: string): string {
  return addDays(addMonths(monthStart(monthStartDate), 1), -1);
}

export function monthLabel(monthStartDate: string): string {
  const [y, m] = monthStartDate.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function monthPeriod(monthStartDate: string): Period {
  const start = monthStart(monthStartDate);
  return { from: start, to: monthEnd(start), label: monthLabel(start) };
}

/** The last `n` months, newest first — the payroll period picker. */
export function recentMonths(n: number, from = today()): string[] {
  const start = monthStart(from);
  return Array.from({ length: n }, (_, i) => addMonths(start, -i));
}

export function prettyDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]?.slice(0, 3)} ${y}`;
}

/**
 * The ledger's date window, read from the query string.
 *
 * Defaults to the current month rather than "everything": a center's first
 * question is always about now, and an unbounded ledger is the slowest query on
 * the page.
 */
export function resolvePeriod(params: { from?: string; to?: string; month?: string }): Period {
  if (isDate(params.month)) return monthPeriod(params.month);
  if (isDate(params.from) && isDate(params.to)) {
    const [from, to] =
      params.from <= params.to ? [params.from, params.to] : [params.to, params.from];
    return { from, to, label: `${prettyDate(from)} – ${prettyDate(to)}` };
  }
  return monthPeriod(today());
}
