"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import { translate, translator, type Translate } from "@/lib/i18n";
import { SANS } from "@/lib/theme/tokens";
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
  /** True while a switch is in flight. NOTHING has changed language yet when
   *  this is true — the whole point is that the change lands in one go — so it
   *  is what the full-page loader is driven from. */
  pending: boolean;
  /** Warm the URLs the picker can send you to. Called when the menu OPENS, so
   *  the navigation that follows a click is usually already downloaded. */
  prefetchLocales: () => void;
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
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  /**
   * The language a switch is currently travelling towards, or null.
   *
   * ⚠️ IT IS DELIBERATELY NOT APPLIED WHILE IT IS IN FLIGHT. An earlier version
   * did apply it immediately, on the reasoning that instant feedback beats
   * none — and it was worse to use, not better: the header, the buttons and the
   * nav flipped at once and then the page under them sat in the old language
   * until the server answered. Two visible changes for one click, the second
   * one late, and the half-translated page in between is what the eye lands on.
   *
   * So the change is held until BOTH halves are ready and lands as one. What
   * covers the gap is `LanguageSwitchOverlay` below — a loader over the whole
   * page, which is honest about what is happening and has nothing half-done in
   * it. The cookie is written immediately either way, because the server render
   * this kicks off has to read the new value.
   */
  const [switchingTo, setSwitchingTo] = useState<Locale | null>(null);

  // The URL beats the cookie; nothing beats either until it has fully arrived.
  const locale = pin ?? fromCookie;

  /**
   * The other half of the switch: publish the new locale once the server's half
   * has arrived.
   *
   * This runs when the transition stops pending, which is React telling us the
   * new server render has committed. Writing the store here rather than in the
   * click is what makes the page change in ONE step — and it is an external
   * store being synchronised with React's state, which is what an effect is
   * for. There is no `setState` in it, so no extra render pass either: the
   * re-render comes from the store notification itself.
   */
  useEffect(() => {
    // `cached` is the guard as well as the target: once it holds the chosen
    // language this has nothing left to do, so there is no flag to clear and no
    // `setState` here to cost a second render.
    if (pending || switchingTo === null || cached === switchingTo) return;
    cached = switchingTo;
    for (const listener of listeners) listener();
  }, [pending, switchingTo]);

  // Keep <html lang> honest: it is what a screen reader switches voice on, and
  // what the browser picks hyphenation and spell-check from, so it has to move
  // with the text rather than staying on the "en" the root layout hard-codes.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      if (l === locale) return;

      // A plain cookie write rather than a server action: the value has to be
      // readable by the NEXT server render and it authorises nothing. SameSite=Lax
      // so it survives arriving back in the app from an emailed link.
      document.cookie =
        `${LOCALE_COOKIE}=${l}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax` +
        (location.protocol === "https:" ? "; secure" : "");

      /* ⚠️ THE MODULE CACHE IS NOT TOUCHED YET, AND THAT IS THE WHOLE TRICK.
         `cached` is what every client component reads through
         `useSyncExternalStore`, and a store update is URGENT by definition —
         React will not let a transition defer it. Writing it here would flip
         the chrome this frame and leave the server-rendered half behind, which
         is exactly the two-step we are removing. It is written when the
         transition finishes instead, so both halves change together. */
      setSwitchingTo(l);

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
      /* IN A TRANSITION, so the click is never what waits. `router.refresh()`
         re-runs every server component on the route — on an app page that means
         the Supabase round trips behind it, which are not fast from here — and
         a push to another language's landing page is a full document's worth of
         work. Outside a transition React treats both as urgent and the tab sits
         there unresponsive until they finish; inside one the interface stays
         live and `pending` says what is happening. */
      const target = localisedPath(pathname, l);
      startTransition(() => {
        if (target !== pathname) router.push(target);
        else router.refresh();
      });
    },
    [router, pathname, locale],
  );

  /** Warm every language's URL for the page we are on. Cheap when the target is
   *  the current path (Next dedupes), and it is what turns the click that
   *  follows into a cache hit instead of a cold render. */
  const prefetchLocales = useCallback(() => {
    for (const l of LOCALES) {
      const target = localisedPath(pathname, l);
      if (target !== pathname) router.prefetch(target);
    }
  }, [router, pathname]);

  const value = useMemo<LocaleCtx>(
    () => ({ locale, setLocale, t: translator(locale), pending, prefetchLocales }),
    [locale, setLocale, pending, prefetchLocales],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {pending ? <LanguageSwitchOverlay locale={switchingTo ?? locale} /> : null}
    </Ctx.Provider>
  );
}

/**
 * A loader over the whole page while the language changes.
 *
 * ⚠️ IT COVERS EVERYTHING ON PURPOSE. The alternative — letting the interface
 * change in pieces as they become ready — was tried and is worse: the chrome
 * flips instantly, the page under it stays in the old language for as long as
 * the server takes, and what the reader looks at in between is a page in two
 * languages. One loader and one change is both faster to understand and
 * easier to trust, even though it is not one millisecond faster to finish.
 *
 * It is rendered by the PROVIDER, so every surface that has one gets it without
 * a single page having to remember. `--tk-scrim` is the same veil the app's
 * modals dim behind, so it is already right in both themes.
 *
 * The label is in the language being switched TO. It is the first thing that
 * language says, and by the time anyone reads it that is the language the page
 * is about to be in.
 */
function LanguageSwitchOverlay({ locale }: { locale: Locale }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: "fixed",
        inset: 0,
        /* Above the shell's mobile scrim and every dialog in the app: a switch
           started from a menu inside a modal still has to cover the modal. */
        zIndex: 9999,
        background: "var(--tk-scrim)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        /* It swallows clicks while it is up, which is the point: a second click
           on the picker underneath would queue a second navigation. */
        cursor: "wait",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 30,
          height: 30,
          border: "3px solid rgba(255,255,255,0.35)",
          borderTopColor: "#fff",
          borderRadius: "50%",
          animation: "lp-spin .7s linear infinite",
        }}
      />
      <span
        style={{
          fontFamily: SANS,
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: "0.01em",
          /* White on the scrim, which is dark in both themes — the same reason
             the footer needs no dark variant. */
          color: "#fff",
        }}
      >
        {translate(locale, "language.switching")}
      </span>
    </div>
  );
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
    () => ({
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: translator(DEFAULT_LOCALE),
      pending: false,
      prefetchLocales: () => {},
    }),
    [],
  );
  return v ?? fallback;
}

/** Just the translate function, for the common case. */
export function useT(): Translate {
  return useLocale().t;
}
