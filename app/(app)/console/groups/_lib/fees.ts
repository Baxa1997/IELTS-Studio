import "server-only";

import { parseMoney } from "@/lib/finance/money";

/**
 * A money field that is allowed to be blank.
 *
 * Blank is `null` and means "not priced", which is a real and different answer
 * from zero — a class with no fee raises no invoices, a class priced at zero
 * raises invoices for nothing. Anything unparseable comes back as `"invalid"`
 * so the caller refuses the whole form rather than quietly storing null.
 */
export function readFee(formData: FormData, field: string, currency: string): number | null | "invalid" {
  const raw = String(formData.get(field) ?? "").trim();
  if (raw === "") return null;
  const value = parseMoney(raw, currency);
  return value == null || value < 0 ? "invalid" : value;
}
