import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv, isSupabaseConfigured } from "@/lib/env";

// Pages reachable without a session. Everything else requires authentication.
// `/auth` covers the OAuth callback, which must run before a session exists.
// `/grade` is the public, no-login essay grader (the marketing funnel); `/` lets
// the root page route anonymous visitors there instead of a login wall.
// `/start` is the pre-auth onboarding wizard (account creation is its last step).
const PUBLIC_PATHS = ["/", "/start", "/sign-in", "/sign-up", "/accept-invite", "/auth", "/grade"];

function isPublicPath(pathname: string): boolean {
  // APIs authenticate themselves; redirecting them to /sign-in would be wrong.
  if (pathname.startsWith("/api")) return true;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated trying to reach a protected page -> sign-in.
  if (!user && !isPublicPath(pathname)) {
    return redirectKeepingCookies(request, supabaseResponse, "/sign-in");
  }

  // Authenticated landing on an auth page -> home (root routes by role).
  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return redirectKeepingCookies(request, supabaseResponse, "/");
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
