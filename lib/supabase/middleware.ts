import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv, isSupabaseConfigured } from "@/lib/env";

// Pages reachable without a session. Everything else requires authentication.
// `/auth` covers the OAuth callback, which must run before a session exists.
// `/grade` is the public, no-login essay grader (the marketing funnel); `/` lets
// the root page route anonymous visitors there instead of a login wall.
// `/start` is the pre-auth onboarding wizard (account creation is its last step).
const PUBLIC_PATHS = [
  "/",
  "/start",
  "/sign-in",
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

  if (!isSupabaseConfigured()) {
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

  const { pathname } = request.nextUrl;

  // Unauthenticated trying to reach a protected page -> sign-in.
  if (!signedIn && !isPublicPath(pathname)) {
    return redirectKeepingCookies(request, supabaseResponse, "/sign-in");
  }

  // Authenticated landing on an auth page -> straight into the app. We send to
  // /dashboard (the student home) rather than the marketing root `/`, which does
  // NOT forward signed-in visitors and so reads as "sign-in went nowhere".
  // super_admins are bounced on to /admin by the dashboard guard.
  if (signedIn && pathname === "/sign-in") {
    return redirectKeepingCookies(request, supabaseResponse, "/dashboard");
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
