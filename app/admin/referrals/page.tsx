import { Card, CardHead, Empty, PageTitle, Surface } from "@/components/admin/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { loadDecidedAccounts, loadPendingApplications, loadSettings } from "@/lib/referrals/service";

import { ReferralReviewRow } from "./review-row";

export const dynamic = "force-dynamic";

/**
 * The referral queue.
 *
 * Approval is the ONLY gate on this programme — there is no plan requirement and
 * no automatic check — so this screen is the whole defence. It leads with what
 * is waiting rather than with totals, because an application sitting unread is
 * the only state here that costs anything.
 */
export default async function AdminReferralsPage() {
  await requireSuperAdmin();
  const [pending, decided, settings] = await Promise.all([
    loadPendingApplications(),
    loadDecidedAccounts(),
    loadSettings(),
  ]);

  const active = decided.filter((a) => a.status === "active");

  return (
    <Surface>
      <PageTitle
        eyebrow="Programme"
        title="Referrals"
        subtitle={`${settings.defaultPercent}% by default · ${active.length} active · ${pending.length} waiting`}
      />

      <Card>
        <CardHead
          title={`Waiting for review (${pending.length})`}
          note="A person reads each one — there is no other check"
        />
        {pending.length === 0 ? (
          <Empty>Nothing waiting.</Empty>
        ) : (
          pending.map((a) => <ReferralReviewRow key={a.id} account={a} />)
        )}
      </Card>

      <Card>
        <CardHead
          title={`Decided (${decided.length})`}
          note="Close ends the link and leaves the ledger alone; revoke also reverses commission still on hold"
        />
        {decided.length === 0 ? (
          <Empty>No decisions yet.</Empty>
        ) : (
          decided.map((a) => <ReferralReviewRow key={a.id} account={a} />)
        )}
      </Card>
    </Surface>
  );
}
