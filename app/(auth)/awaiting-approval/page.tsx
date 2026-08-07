import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession, roleHome } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { SignOutButton } from "../sign-out-button";

const COPY: Record<string, { title: string; body: (email: string) => string }> = {
  pending: {
    title: "Application under review",
    body: (email) =>
      `Thanks for applying! Our team reviews every organization before it goes live. ` +
      `You'll receive a confirmation email at ${email} as soon as your organization is approved — usually within one business day.`,
  },
  rejected: {
    title: "Application not approved",
    body: () =>
      "Unfortunately your organization application wasn't approved this time. " +
      "If you believe this is a mistake, reach out via our contact page and we'll take another look.",
  },
  suspended: {
    title: "Organization suspended",
    body: () =>
      "This organization is currently suspended. Please contact support to restore access.",
  },
};

/** Holding page for members of a not-yet-active org (pending/rejected center,
 *  or a suspended workspace). requireOrgUser bounces them here from every
 *  in-app route; active users who land here get bounced straight back home. */
export default async function AwaitingApprovalPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role === "super_admin" || !session.profile) redirect(roleHome(session.role));
  if (session.profile.org.status === "active") redirect(roleHome(session.role));

  // org_select RLS lets a member read their own org row.
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, contact_email")
    .eq("id", session.profile.organization_id)
    .single();

  const email = org?.contact_email ?? session.user.email ?? "your email";
  const copy = COPY[session.profile.org.status] ?? COPY.pending;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{org?.name ?? "Your organization"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{copy.body(email)}</p>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  );
}
