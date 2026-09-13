import { redirect } from "next/navigation";

import { getSession, roleHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Retired pre-auth onboarding entry, kept ONLY as a catcher for old links and
 * bookmarks. Onboarding happens after authentication now (the post-auth takeover
 * gates every plan-less student), so this forwards: signed-in users to their role
 * home, everyone else to sign-in.
 *
 * NOTHING IN THE PRODUCT LINKS HERE ANY MORE. The landing header's "Dashboard"
 * button did, on the belief that only a server route could resolve which role the
 * session carried — but `/dashboard` does that itself, so the hop was redundant.
 * It is also out of the sitemap: advertising a pure redirect at priority 0.65 was
 * telling crawlers to spend budget arriving at /sign-in.
 *
 * ⚠️ DELETING THIS FILE IS NOT THE SAME AS DELETING THE FOLDER. `start-wizard.tsx`
 * beside it is very much alive — it is the post-auth OnboardingTakeover. If this
 * route ever goes, the wizard moves; it does not go with it.
 */
export default async function StartPage() {
  const session = await getSession();
  redirect(session ? roleHome(session.role) : "/sign-in");
}
