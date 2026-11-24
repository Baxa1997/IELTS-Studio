import { PLAN_ORDER, planTier, type PlanTier } from "@/lib/billing/plans";
import { CONTACT_PHONE, CONTACT_TEL_HREF, CONTACT_WHATSAPP_HREF, INSTAGRAM_URL, TELEGRAM_URL } from "@/lib/contact";

/**
 * Everything on the platform page that is a NUMBER OR AN ADDRESS, read from
 * the modules that enforce it — PLAN_TIERS is what the quota code checks and
 * Stripe charges, lib/contact.ts is the one inbox and the one phone. The copy
 * files only phrase these; none of them may type a price (the test refuses one).
 *
 * ⚠️ WHAT IS NOT HERE ON PURPOSE. The brief behind this page (2026-11-23) also
 * asked for the number of practice tests, partner centres, active learners,
 * the founding year, essays checked, an address and opening hours. The site
 * states none of them, so the page states none of them — they are listed as
 * [TO FILL] in docs/page-drafts/01-ai-ielts-platform-uzbekistan.md. Add each
 * one when the owner supplies it, never as an estimate.
 */
export interface PlatformFacts {
  /** Every plan, in the order the pricing table shows them. */
  tiers: PlanTier[];
  free: PlanTier;
  /** The plans that cost money. */
  paid: PlanTier[];
  /** The cheapest plan billed month by month — "from $X a month". */
  from: PlanTier;
  /** A paid plan covering several months in one payment, if there is one. */
  multiMonth?: PlanTier;
  phone: string;
  telHref: string;
  whatsappHref: string;
  telegram: string;
  telegramHandle: string;
  instagram: string;
  instagramHandle: string;
}

const handle = (url: string) => `@${new URL(url).pathname.replace(/^\/+|\/+$/g, "")}`;

export function platformFacts(): PlatformFacts {
  const tiers = PLAN_ORDER.map(planTier);
  const paid = tiers.filter((t) => t.price !== null && t.price > 0);
  const monthly = paid.filter((t) => t.months === 1);
  return {
    tiers,
    free: planTier("trial"),
    paid,
    from: monthly.reduce((a, b) => ((a.price ?? 0) <= (b.price ?? 0) ? a : b)),
    multiMonth: paid.find((t) => t.months > 1),
    phone: CONTACT_PHONE,
    telHref: CONTACT_TEL_HREF,
    whatsappHref: CONTACT_WHATSAPP_HREF,
    telegram: TELEGRAM_URL,
    telegramHandle: handle(TELEGRAM_URL),
    instagram: INSTAGRAM_URL,
    instagramHandle: handle(INSTAGRAM_URL),
  };
}
