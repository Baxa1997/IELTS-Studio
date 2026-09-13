import { redirect } from "next/navigation";

/**
 * Billing & plan moved into Settings. This route stays because payment
 * providers and old bookmarks may still return here.
 */
export default function BillingPage() {
  redirect("/console/settings/billing");
}
