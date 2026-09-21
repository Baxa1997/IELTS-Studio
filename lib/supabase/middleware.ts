import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv, isSupabaseConfigured } from "@/lib/env";

/** Kept in step with lib/referrals/attribution.ts — the middleware cannot import
 *  from it, because that module is `server-only` and this runs on the edge. */
const REFERRAL_COOKIE = "ep_ref";
/** Mirrors `referral_settings.cookie_days`. A setting the proxy cannot read, so
 *  changing the row does not change this — see the note in the referrals plan. */
const REFERRAL_COOKIE_DAYS = 90;

// Pages reachable without a session. Everything else requires authentication.
// `/auth` covers the OAuth callback, which must run before a session exists.
// `/grade` is the public, no-login essay grader (the marketing funnel); `/` lets
// the root page route anonymous visitors there instead of a login wall.
// `/start` is the pre-auth onboarding wizard (account creation is its last step).
const PUBLIC_PATHS = [
  "/",
  // The landing page in the two NON-DEFAULT languages. A public route MUST be
  // listed here or the middleware 307s every logged-out visitor AND every
  // crawler to /sign-in — which would make the localised pages worse than not
  // having them, since Google would index a redirect where the hreflang
  // promised a page. Uzbek is the default and lives at "/" above, so there is
  // no "/uz": that path is a 404 by design, and it is listed anyway so it
  // ANSWERS 404 instead of redirecting a crawler to the sign-in page.
  "/en",
  "/ru",
  "/uz",
  "/start",
  "/sign-in",
  "/forgot-password",
  "/reset-password",
  "/recover-account",
  "/accept-invite",
  // A shared lesson. The token in the path is the whole credential, and a
  // student opening a teacher's link has no account to be redirected to.
  "/p",
  "/auth",
  "/grade",
  // The documentation front page. A public route MUST be listed here or the
  // middleware 307s every logged-out visitor and every crawler to /sign-in —
  // which is exactly what still happens to /pricing.
  "/how-to-use",
  "/demo",
  "/contact",
  "/privacy",
  "/terms",
  "/ielts-practice",
  "/ielts-writing-practice",
  "/ielts-reading-practice",
  "/ielts-listening-practice",
  "/ielts-speaking-practice",
  "/cefr-multilevel-practice",
  "/for-education-centers",
  "/robots.txt",
  "/sitemap.xml",
];

/**
 * Public pages that were DELETED and must now 404 rather than bounce a visitor
 * to /sign-in.
 *
 * Any unknown path redirects a logged-out visitor to sign-in (see below), which
 * is fine for a typo but wrong for a URL Google has indexed: a redirect to a
 * login page reads as a soft-404 and the old URL lingers in the index. These
 * three were live, indexed marketing pages until the owner removed them, so
 * they are let through to render a real 404 and drop out cleanly.
 *
 * Safe to delete once they have disappeared from search results.
 */
const GONE_PATHS = ["/cambridge-ielts-practice", "/vs"];

function isPublicPath(pathname: string): boolean {
  // APIs authenticate themselves; redirecting them to /sign-in would be wrong.
  if (pathname.startsWith("/api")) return true;
  if (GONE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Stash a `?ref=` code for the sign-up that may follow.
 *
 * FIRST TOUCH WINS HERE TOO. If a code is already stashed it is left alone, so
 * somebody who clicks A's link and later B's still belongs to A — matching the
 * database's unique `organization_id`, which would otherwise silently disagree
 * with whatever the cookie last said.
 *
 * ⚠️ THE CLICK TIME IS PART OF THE COOKIE, AND IT IS LOAD-BEARING. A referral
 * link is a public URL, so an EXISTING customer clicks it too — and until this
 * carried a timestamp, the next trip through `/auth/callback` (which is every
 * Google sign-in, not just a sign-up) attributed their months-old account to
 * whoever's link they happened to open. That is permanent — `organization_id`
 * is the primary key on `referral_attributions` — and it pays real commission
 * on a customer the referrer never introduced. It happened in production: an
 * account created 2026-08-02 was credited to a code approved 2026-09-19,
 * 0.57 seconds after its owner signed in.
 *
 * `claimReferral()` compares this against the organization's `created_at` and
 * refuses anything that already existed when the link was clicked. A timestamp
 * rather than a freshness window on the org because a window has to be wrong in
 * one of two directions: short enough to exclude an existing customer also
 * excludes somebody who takes three days to click their confirmation email.
 */
function captureReferral(request: NextRequest, response: NextResponse): void {
  const raw = request.nextUrl.searchParams.get("ref");
  if (!raw) return;
  // Shape-checked here so junk never becomes a cookie. The real validation is
  // in lib/referrals/code.ts; this is the same expression, kept deliberately
  // inline because middleware runs on the edge and this file imports nothing
  // from the app's server modules.
  const code = raw.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(code)) return;
  if (request.cookies.get(REFERRAL_COOKIE)) return;

  // `code.clickedAtMs` — parsed by readStashedReferral() in the attribution
  // module, which is also what tolerates a legacy cookie with no dot in it.
  response.cookies.set(REFERRAL_COOKIE, `${code}.${Date.now()}`, {
    path: "/",
    maxAge: REFERRAL_COOKIE_DAYS * 24 * 60 * 60,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Refreshes the Supabase auth session on every request, keeps auth cookies in
 * sync, and enforces authentication-level route protection:
 *   - no session + private path  -> redirect to /sign-in
 *   - has session + auth page     -> redirect to / (which routes by role)
 *
 * Role-level protection (student vs. console) is done in the server components,
 * which already need the profile. Call this from the root `middleware.ts`.
 *
 * No-ops when Supabase isn't configured yet so the skeleton still runs.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // A referral link is `/?ref=CODE`, so this has to run BEFORE the public-path
  // early return below — `/` takes that branch, which is the one path every
  // referral link lands on. Stashing it costs one cookie write and no lookup:
  // the code is only resolved once there is an account to attribute, in
  // `claimReferral()`. Deliberately not httpOnly-sensitive data — it is a public
  // code from a public URL — but lax + a finite life so it cannot follow
  // somebody around forever or ride a cross-site POST.
  captureReferral(request, supabaseResponse);

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  // Public marketing and documentation pages do not need a session to render.
  // Skipping the Supabase client entirely for them removes an auth/JWKS step from
  // anonymous page loads and keeps the public homepage eligible for caching.
  // `/sign-in` remains the one public page that needs to know whether a user is
  // already signed in so it can redirect them into the app.
  if (isPublicPath(pathname) && pathname !== "/sign-in") {
    return supabaseResponse;
  }

  const supabase = createServerClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Touch the session so expired tokens get refreshed. Do not run logic between
  // creating the client and this call.
  //
  // getClaims(), not getUser(): getUser() calls the Supabase Auth server on
  // EVERY matched request — every navigation, and every <Link> prefetch — and
  // this proxy runs on all of them, so that round trip sat in front of the whole
  // app. getClaims() verifies the JWT signature locally with WebCrypto against
  // the project's cached JWKS, so once the project uses asymmetric signing keys
  // there is no network hop at all.
  //
  // It is safe BEFORE that switch too: with a symmetric secret getClaims()
  // falls back to asking the server exactly like getUser() did, and it still
  // refreshes a session whose token is about to expire. So this is a strict
  // improvement in both configurations, and needs no coordinated flip.
  //
  // Trust is unchanged: the signature is verified either way. This is emphatically
  // not getSession(), which would read unverified cookie contents.
  const { data: claimsData } = await supabase.auth.getClaims();
  // `sub` is the user id; its presence is what "signed in" means here. Role and
  // org are NOT read from the token — server components still resolve those from
  // `profiles`, and RLS remains the thing that actually guards data.
  const signedIn = Boolean(claimsData?.claims?.sub);

  // Unauthenticated trying to reach a protected page -> sign-in.
  if (!signedIn && !isPublicPath(pathname)) {
    return redirectKeepingCookies(request, supabaseResponse, "/sign-in");
  }

  return supabaseResponse;
}

/**
 * Build a redirect response while carrying over any refreshed auth cookies that
 * Supabase set on `base` — otherwise the rotated session would be lost.
 */
function redirectKeepingCookies(
  request: NextRequest,
  base: NextResponse,
  pathname: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  base.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
