import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";

import { AcceptInviteForm } from "./accept-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let invite: { email: string; orgName: string } | null = null;
  if (token) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("invites")
      .select("email, organization_id, accepted_at, expires_at")
      .eq("token", token)
      .single();
    if (data && !data.accepted_at && new Date(data.expires_at) > new Date()) {
      const { data: org } = await admin
        .from("organizations")
        .select("name")
        .eq("id", data.organization_id)
        .single();
      invite = { email: data.email, orgName: org?.name ?? "your center" };
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-6 py-16">
      <Card>
        {invite && token ? (
          <>
            <CardHeader>
              <CardTitle>Join {invite.orgName}</CardTitle>
              <CardDescription>Set a password to activate your student account.</CardDescription>
            </CardHeader>
            <CardContent>
              <AcceptInviteForm token={token} email={invite.email} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Invite not valid</CardTitle>
              <CardDescription>
                This invite link is invalid, already used, or expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Ask your education center to send you a new invite.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
