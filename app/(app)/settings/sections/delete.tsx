import { hasPasswordLogin } from "@/lib/account/password";
import { needsStripeCancellation } from "@/lib/account/deletion-rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { DeleteForm } from "./delete-form";
import { Panel } from "./frame";

/** Delete the account, with everything it holds. */
export async function DeleteAccountSection({ organizationId }: { organizationId: string }) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const [
    {
      data: { user },
    },
    { data: sub },
  ] = await Promise.all([
    supabase.auth.getUser(),
    admin
      .from("subscriptions")
      .select("provider, status, external_subscription_id, external_customer_id")
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  const cancelsCard = needsStripeCancellation(sub as Parameters<typeof needsStripeCancellation>[0]);

  return (
    <Panel
      title="Delete your account"
      tone="danger"
      note="This can't be undone. Everything goes at once and cannot be recovered."
    >
      <ul
        style={{
          margin: "0 0 18px",
          paddingLeft: 18,
          fontSize: 14,
          lineHeight: 1.7,
          color: "#4A505C",
        }}
      >
        <li>Your essays, reading, listening and speaking practice, and all their feedback</li>
        <li>Your study plan, band estimates and vocabulary</li>
        <li>Your speaking recordings</li>
        {cancelsCard ? (
          <li>
            <strong>Your card subscription is cancelled immediately</strong>, with no refund for the
            rest of this period
          </li>
        ) : null}
      </ul>
      <DeleteForm hasPassword={hasPasswordLogin(user)} />
    </Panel>
  );
}
