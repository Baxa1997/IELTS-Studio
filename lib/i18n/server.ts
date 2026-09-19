import { cookies } from "next/headers";

import { translator, type Translate } from "./index";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./locales";

/**
 * The locale for this request, from the cookie the picker sets.
 *
 * ⚠️ CALLING THIS OPTS THE ROUTE OUT OF STATIC RENDERING, because `cookies()`
 * does. That is free on the authenticated surfaces — `app/(app)/layout.tsx` and
 * `app/(shell)/layout.tsx` already read cookies for the session, so those trees
 * were dynamic before i18n existed — and it is NOT free on the marketing pages
 * and the front door, which are still cached and are the first thing a new
 * visitor loads. Do not reach for this in a static route: take the locale from
 * `useLocale()` in a client component there instead.
 */
export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** `t` bound to this request's locale, for server components. */
export async function getT(): Promise<Translate> {
  return translator(await getLocale());
}
