import {
  Card,
  CardHead,
  CardNote,
  INDIGO,
  INK,
  SANS,
  SOFT,
  Stack,
} from "@/app/(app)/console/_components/crm-ui";
import { PasswordForm } from "@/shared/components/account/password-form";
import { hasPasswordLogin } from "@/lib/account/password";
import type { Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { staffLinkStatus } from "@/lib/telegram/staff";

import { TelegramStaffPanel } from "@/app/(app)/console/_components/telegram-staff-panel";

/**
 * My account: who you are signed in as, your password, and your own Telegram.
 *
 * Every member of staff gets this section, whatever the center lets them run —
 * it is about the person, not the center.
 */
export async function AccountSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    telegram,
  ] = await Promise.all([supabase.auth.getUser(), staffLinkStatus(profile)]);

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

  return (
    <Stack>
      <Card>
        <CardHead title="Signed in as" />
        <dl style={{ margin: 0, display: "grid", gap: 10 }}>
          <Row label="Name" value={profile.full_name ?? "—"} />
          {/* The login, not the auth address: a center account's auth email is
              synthetic (login@students…) and cannot receive anything, so showing
              it would hand somebody an address that does not exist. */}
          {profile.username ? <Row label="Login" value={`@${profile.username}`} /> : null}
          <Row label="Email" value={profile.contact_email ?? "No email on this account"} />
        </dl>
        {profile.role !== "center_admin" ? (
          <CardNote>Ask your center admin to change your name or email.</CardNote>
        ) : null}
      </Card>

      <Card>
        <CardHead title="Password" note="you'll need your current one" />
        <PasswordForm hasPassword={hasPasswordLogin(user)} accent={INDIGO} />
      </Card>

      <Card>
        <CardHead title="Your Telegram" note="the assistant, on your phone" />
        {botUsername ? (
          <TelegramStaffPanel connected={telegram.connected} botUsername={botUsername} />
        ) : (
          <CardNote>Telegram isn&apos;t set up on this platform yet.</CardNote>
        )}
      </Card>
    </Stack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, fontFamily: SANS, fontSize: 13.5 }}>
      <dt style={{ width: 70, flex: "none", color: SOFT }}>{label}</dt>
      <dd style={{ margin: 0, minWidth: 0, color: INK, overflowWrap: "anywhere" }}>{value}</dd>
    </div>
  );
}
