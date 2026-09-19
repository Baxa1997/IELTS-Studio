"use client";

import { usePathname, useRouter } from "next/navigation";
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
  LOCALES,
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

/** Routes that exist in all three languages. Mirrors `LOCALISED` in
 *  `app/sitemap.ts` — grow the two together, or the picker offers a URL the
 *  sitemap does not claim (or worse, one that 404s). */
const LOCALISED_ROUTES = new Set(["/"]);

/**
 * Every locale that lives under a path prefix — i.e. all of them but the
 * default, which owns the bare URL.
 *
 * ⚠️ DERIVED, NEVER SPELLED OUT. This was once the literal `/^\/(uz|ru)/`, back
 * when English was the default and those two were the prefixed pair. Moving the
 * default to Uzbek made that expression silently wrong rather than broken: it no
 * longer stripped `/en`, so choosing Russian from the English landing page
 * produced a path the picker did not recognise as localised and the switch did
 * nothing at all. Deriving the list from `DEFAULT_LOCALE` is what keeps a future
 * flip a one-line change.
 */
const PREFIXED = LOCALES.filter((l) => l !== DEFAULT_LOCALE);
const PREFIX_RE = new RegExp(`^/(${PREFIXED.join("|")})(?=/|$)`);

/** The same path in another language, or the path unchanged when that page has
 *  no localised sibling yet. */
function localisedPath(pathname: string, next: Locale): string {
  const stripped = pathname.replace(PREFIX_RE, "") || "/";
  if (!LOCALISED_ROUTES.has(stripped)) return pathname;
  if (next === DEFAULT_LOCALE) return stripped;
  return stripped === "/" ? `/${next}` : `/${next}${stripped}`;
}

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
 * snapshot is the default locale; the cookie is picked up after hydration and the
 * chrome settles a tick later. That tick is the price of those pages staying
 * cacheable, and it is why the authenticated layouts pass `initial` and the
 * marketing tree does not.
 *
 * `pin` is for a route whose language is in its URL. There the cookie is not
 * just unnecessary, it is WRONG: `/en` is the English page for everybody who
 * opens it, whatever they last chose. Without this the body (rendered from the
 * route's own locale) and the chrome (subscribed to the cookie) disagree the
 * moment the two differ — which stopped being a corner case when the default
 * moved to Uzbek, because everyone who had ever chosen English or Russian now
 * has a cookie that contradicts `/`. Changing language still works: the picker
 * writes the cookie AND navigates, and the new route pins the new locale.
 */
export function LocaleProvider({
  initial,
  pin,
  children,
}: {
  initial?: Locale;
  pin?: Locale;
  children: React.ReactNode;
}) {
  // Must be referentially stable per `initial`, or the hook re-reads endlessly.
  const serverSnapshot = useCallback(() => pin ?? initial ?? DEFAULT_LOCALE, [pin, initial]);
  const fromCookie = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  // Hooks run unconditionally; the pin wins afterwards.
  const locale = pin ?? fromCookie;
  const router = useRouter();
  const pathname = usePathname();

  // Keep <html lang> honest: it is what a screen reader switches voice on, and
  // what the browser picks hyphenation and spell-check from, so it has to move
  // with the text rather than staying on the "en" the root layout hard-codes.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      cached = l;
      // A plain cookie write rather than a server action: the value has to be
      // readable by the NEXT server render and it authorises nothing. SameSite=Lax
      // so it survives arriving back in the app from an emailed link.
      document.cookie =
        `${LOCALE_COOKIE}=${l}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax` +
        (location.protocol === "https:" ? "; secure" : "");
      for (const listener of listeners) listener();

      /* ⚠️ THE NOTIFY ABOVE ONLY REACHES CLIENT COMPONENTS, AND MOST OF THIS UI
         IS NOT ONE. Every string a server component rendered was chosen from
         the cookie at request time, so writing a new cookie changes nothing
         they have already sent — the picker moved its tick, the chrome that
         subscribes re-rendered, and the page around it stayed in the old
         language until a hard reload. `router.refresh()` re-runs the current
         route's server components with the new cookie and patches them in,
         keeping client state and scroll position. It is what makes the control
         a language switch rather than a preference that takes effect later. */
      /* ⚠️ ON A LOCALISED ROUTE THE URL IS THE SOURCE OF TRUTH, SO IT HAS TO
         MOVE. `/en` renders English because of the path, not the cookie —
         refreshing it in place would re-render the same English page and the
         picker would look broken. So: if the current path carries a locale
         prefix (or the page we are on has localised siblings), navigate to the
         chosen language's URL; everywhere else the cookie is the only signal
         and a refresh is the right move. Keeping the language in the URL is
         also what makes it linkable and shareable. */
      const target = localisedPath(pathname, l);
      if (target !== pathname) router.push(target);
      else router.refresh();
    },
    [router, pathname],
  );

  const value = useMemo<LocaleCtx>(
    () => ({ locale, setLocale, t: translator(locale) }),
    [locale, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * The locale and its `t`.
 *
 * Falls back to the default locale rather than throwing when no provider is
 * above: this is chrome, and a component rendering Uzbek in a tree nobody
 * wrapped is a much smaller failure than a page that will not render at all.
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
