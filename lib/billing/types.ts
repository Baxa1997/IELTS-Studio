import type { OrgPlan } from "./plans";

/**
 * Provider-agnostic billing contracts. Each provider (Stripe / Payme / Click)
 * maps its own checkout + webhook protocol onto these, and the rest of the app
 * only ever sees a PlanChange. Same principle as the AI layer: swap providers
 * without touching feature code.
 */

export type BillingProviderId = "stripe" | "payme" | "click";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface CheckoutRequest {
  organizationId: string;
  plan: OrgPlan;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface CheckoutResult {
  /** Where to send the admin to pay. */
  url: string;
  /** Provider session/order reference (also stored on the subscription). */
  reference: string;
}

/** The normalized result of a billing webhook — the only thing the app acts on. */
export interface PlanChange {
  organizationId: string;
  plan: OrgPlan;
  status: SubscriptionStatus;
  provider: BillingProviderId;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  /** ISO; when the paid period ends. */
  currentPeriodEnd?: string | null;
}
