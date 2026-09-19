import { PasswordForm } from "@/components/account/password-form";
import { hasPasswordLogin } from "@/lib/account/password";
import { createClient } from "@/lib/supabase/server";

import { Panel } from "./frame";
import { ProfileForm } from "./profile-form";
import { BRAND } from "@/lib/theme/tokens";


/** Name, phone and the sign-in email; then the password. */
export async function LearnerAccountSection({ profileId }: { profileId: string }) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: row },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("full_name, phone").eq("id", profileId).maybeSingle(),
  ]);
  const hasPassword = hasPasswordLogin(user);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel title="Profile" note="Your name appears on your dashboard and your reports.">
        <ProfileForm
          fullName={(row?.full_name as string | null) ?? ""}
          phone={(row?.phone as string | null) ?? ""}
          email={user?.email ?? null}
        />
      </Panel>

      <Panel
        title={hasPassword ? "Password" : "Set a password"}
        note={hasPassword ? "You'll need your current password to choose a new one." : undefined}
      >
        <PasswordForm hasPassword={hasPassword} accent={BRAND} />
      </Panel>
    </div>
  );
}
