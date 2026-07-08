import { requireOrgUser } from "@/lib/auth";
import { getUsageSummary } from "@/lib/quota";

import { PricingTiers } from "./pricing-tiers";

export const dynamic = "force-dynamic";

/**
 * Student-facing plans page: every tier with live prices from
 * lib/billing/plans.ts (single source of truth), the caller's current plan
 * highlighted, and Stripe checkout on the paid tiers. The sidebar PlanCard's
 * Upgrade button lands here.
 */
export default async function PricingPage() {
  const { profile } = await requireOrgUser();
  const usage = await getUsageSummary(profile.organization_id);
  return <PricingTiers currentPlan={usage.plan} usage={usage} />;
}
