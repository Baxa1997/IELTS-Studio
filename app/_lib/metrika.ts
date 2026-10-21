/**
 * Yandex Metrica: what it may see, decided in one plain module the root
 * layout's tracker, the two staff layouts and the tests all share.
 *
 * ⚠️ THE STOCK SNIPPET SENDS `location.href`, AND HERE THAT LEAKS CREDENTIALS.
 * A shared lesson's URL IS its key (/p/<token>); invite, unsubscribe and
 * password-reset links carry tokens in the query or the hash. Sent as a page
 * view, each would sit in a third party's reports, readable by anyone with
 * access to the counter. So the counter starts with `defer: true` (Yandex's own
 * SPA setup: no automatic page view) and every hit goes through `hitUrl`.
 */

/** The counter. Public by design — it is in every page's source. */
export const METRIKA_ID = 113673828;

export const METRIKA_TAG = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;

/**
 * Only the real site counts. Local dev and Vercel preview deployments
 * (*.vercel.app) would otherwise fill the reports with our own clicks.
 * A hostname rather than an env var: Vercel only exposes VERCEL_ENV to the
 * browser when a project setting is on, and a tracker that silently never
 * runs is the failure nobody notices.
 */
export function isProductionHost(hostname: string): boolean {
  return hostname === "www.engprogress.com" || hostname === "engprogress.com";
}

/**
 * Paths whose URL carries a secret. Never sent — and if a visit STARTS on one,
 * the counter is not even loaded, so nothing on that page reaches Yandex.
 */
const SECRET_PATHS = ["/p", "/auth", "/accept-invite", "/reset-password", "/recover-account", "/unsubscribe"];

export function isSecretPath(pathname: string): boolean {
  return SECRET_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Screens that show OTHER PEOPLE'S data — students' names and phones, payments,
 * payroll. Session Replay masks typed input by default, but it records the
 * text a page DISPLAYS unless an element carries `ym-hide-content`.
 */
const STAFF_PATHS = ["/console", "/admin"];

export function isStaffPath(pathname: string): boolean {
  return STAFF_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Yandex's class for "blur this element in Session Replay". */
export const HIDE_IN_REPLAY = "ym-hide-content";

/** Query parameters worth keeping: campaign tags and the referral code. */
const KEPT_PARAMS = /^(utm_[a-z]+|ref)$/;

/**
 * The URL a page view reports: origin and path, plus campaign tags. No hash
 * (Supabase puts tokens there) and no other query parameter (invites and
 * unsubscribes put them there).
 */
export function hitUrl(origin: string, pathname: string, search: string): string {
  const kept = [...new URLSearchParams(search)].filter(([k]) => KEPT_PARAMS.test(k));
  const query = kept.length ? `?${new URLSearchParams(kept).toString()}` : "";
  return `${origin}${pathname}${query}`;
}

/**
 * The first page view's referrer, made as safe as a hit URL.
 *
 * ⚠️ A SAME-SITE REFERRER IS THE FULL URL, TOKEN INCLUDED. Accepting an invite
 * redirects into the app, and the browser hands the next page
 * `/accept-invite?token=…` as its referrer. Our own URLs go through `hitUrl`
 * (a secret page reduced to the bare origin); another site's referrer is
 * already cut to its origin by the browser's default referrer policy.
 */
export function safeReferrer(referrer: string, origin: string): string {
  let ref: URL;
  try {
    ref = new URL(referrer);
  } catch {
    return "";
  }
  if (ref.origin !== origin) return referrer;
  return isSecretPath(ref.pathname) ? origin : hitUrl(origin, ref.pathname, ref.search);
}
