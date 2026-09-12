import { NextResponse } from "next/server";

import { getSession, roleHome, safeNextPath } from "@/lib/auth";
import { applyPendingPlan } from "@/lib/plan/apply-pending";
import { claimReferral } from "@/lib/referrals/attribution";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (Google) callback. Supabase redirects here with a `code`; we exchange it
 * for a session (sets cookies), then land the learner INSIDE the app. For brand-new
 * OAuth users the handle_new_user trigger has already provisioned a personal org +
 * student profile by the time we get here.
 *
 * If the pre-auth onboarding wizard stashed a plan before sign-up, we persist it
 * now (so the chosen target/level/exam date are saved and show on the dashboard).
 * We always route to the user's role home (students → /dashboard) — never the
 * public marketing root `/`, which doesn't redirect signed-in visitors and so
 * looked like "sign-in didn't go anywhere". A validated `?next` still wins.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Persist any onboarding answers stashed before sign-up (target/level/exam date).
      await applyPendingPlan();
      // And credit whoever sent them, if a `?ref=` brought them here. After the
      // trigger has provisioned the org, because that org is what gets
      // attributed; never before a session exists.
      await claimReferral();
      const session = await getSession();
      // An Auth identity without a profile means provisioning failed or an old
      // account was partially deleted. Avoid a dashboard/sign-in redirect loop.
      const dest = next ?? (session ? roleHome(session.role) : "/recover-account");
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=oauth`);
}
