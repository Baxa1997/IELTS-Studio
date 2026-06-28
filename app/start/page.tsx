import { redirect } from "next/navigation";

import { getSession, roleHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Retired pre-auth onboarding entry. Onboarding now happens AFTER authentication
 * (the post-auth takeover gates every plan-less student), so this route just
 * forwards: signed-in users to their role home, everyone else to sign-in. Keeping
 * the route alive means old links / bookmarks to /start still land somewhere sane.
 * The wizard component itself lives on, reused by the post-auth OnboardingTakeover.
 */
export default async function StartPage() {
  const session = await getSession();
  redirect(session ? roleHome(session.role) : "/sign-in");
}
