"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { translator, type Translate } from "@/lib/i18n";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "@/lib/i18n/locales";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translate;
}

const Ctx = createContext<LocaleCtx | null>(null);

/* ── the cookie, as an external store ──────────────────────────────────────
 *
 * Same reasoning as `theme-provider`: the locale lives outside React, so it is
 * read with `useSyncExternalStore` rather than pulled in by an effect. The hook
 * compares snapshots by identity and calls the getter on every render, so the
 * value is cached in module scope; `cached = null` invalidates it.
 */

const listeners = new Set<() => void>();
let cached: Locale | null = null;

function readCookie(): Locale {
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const raw = m ? decodeURIComponent(m[1]) : null;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

function snapshot(): Locale {
  if (cached === null) cached = readCookie();
  return cached;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Carries the locale to client components, and owns changing it.
 *
 * `initial` is what the SERVER resolved from the same cookie. Pass it from any
 * layout that already reads cookies and the first paint is in the right
 * language with no swap — that is what `getServerSnapshot` returns during
 * hydration, so the markup matches. Omit it on a STATIC route and the server
 * snapshot is English; the cookie is picked up straight after hydration and the
 * chrome settles a tick later. That tick is the price of those pages staying
 * cacheable, and it is why the authenticated layouts pass `initial` and the
 * marketing tree does not.
 */
export function LocaleProvider({
  initial,
  children,
}: {
  initial?: Locale;
  children: React.ReactNode;
}) {
  // Must be referentially stable per `initial`, or the hook re-reads endlessly.
  const serverSnapshot = useCallback(() => initial ?? DEFAULT_LOCALE, [initial]);
  const locale = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  // Keep <html lang> honest: it is what a screen reader switches voice on, and
  // what the browser picks hyphenation and spell-check from, so it has to move
  // with the text rather than staying on the "en" the root layout hard-codes.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    cached = l;
    // A plain cookie write rather than a server action: the value has to be
    // readable by the NEXT server render and it authorises nothing. SameSite=Lax
    // so it survives arriving back in the app from an emailed link.
    document.cookie =
      `${LOCALE_COOKIE}=${l}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax` +
      (location.protocol === "https:" ? "; secure" : "");
    for (const listener of listeners) listener();
  }, []);

  const value = useMemo<LocaleCtx>(
    () => ({ locale, setLocale, t: translator(locale) }),
    [locale, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * The locale and its `t`.
 *
 * Falls back to English rather than throwing when no provider is above: this is
 * chrome, and a component rendering English in a tree nobody wrapped is a much
 * smaller failure than a page that will not render at all.
 */
export function useLocale(): LocaleCtx {
  const v = useContext(Ctx);
  const fallback = useMemo<LocaleCtx>(
    () => ({ locale: DEFAULT_LOCALE, setLocale: () => {}, t: translator(DEFAULT_LOCALE) }),
    [],
  );
  return v ?? fallback;
}

/** Just the translate function, for the common case. */
export function useT(): Translate {
  return useLocale().t;
}
