import { NextResponse } from "next/server";

import { applyPendingPlan } from "@/lib/plan/apply-pending";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (Google) callback. Supabase redirects here with a `code`; we exchange it
 * for a session (sets cookies), then send the user to `/` which routes by role.
 * For brand-new OAuth users, the handle_new_user trigger has already provisioned
 * a personal org + student profile by the time we get here.
 *
 * If the pre-auth onboarding wizard stashed a plan before sign-up, we persist it
 * now and send the new learner straight into the diagnostic instead of the
 * generic role home.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const applied = await applyPendingPlan();
      return NextResponse.redirect(`${origin}${applied ? "/diagnostic" : next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=oauth`);
}
