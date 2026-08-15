import "server-only";

/**
 * "How long ago?", in one place.
 *
 * Three admin screens were each doing their own `Date.now()` arithmetic inline,
 * which is both duplicated and — in a component body — something the purity
 * lint rule rightly objects to. A Server Component renders once per request, so
 * reading the clock is safe here in a way it never is in a client render; that
 * reasoning belongs in a module that says so, not scattered through JSX.
 *
 * All of these read the clock, so they are only ever correct at the moment the
 * page is rendered. Every admin page is `force-dynamic`, so that is every time.
 */

const MINUTE = 60_000;
const DAY = 86_400_000;

/** Whole days between then and now. Negative dates clamp to 0. */
export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY));
}

/** Whole minutes between then and now. */
export function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / MINUTE));
}

/** "just now" / "12 min ago" / "3 hours ago" / "2 days ago" / "14 Aug". */
export function ago(iso: string): string {
  const mins = minutesSince(iso);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** The same idea in the register a moderation list wants: "today", "yesterday". */
export function calendarAgo(iso: string): string {
  const days = daysSince(iso);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Is this timestamp inside the last N days? */
export function within(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() < days * DAY;
}
