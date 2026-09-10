import "server-only";

import { normalizeCode } from "./code";
import type { CommissionStatus, ReferralAccount } from "./types";

/**
 * The plumbing under both referral services.
 *
 * Everything here is shared by the learner's side and the reviewer's side, and
 * none of it decides anything. It lives apart so `service.ts` (what a referrer
 * may see) and `admin.ts` (what a reviewer may see) can be read as two separate
 * answers to two separate questions — which is the whole reason they were
 * split. A shared helper sitting inside either one would pull the other in.
 */

/** A commission as the three aggregate readers below select it. */
export interface CommissionQueryRow {
  id?: string;
  amount_minor: number | string;
  currency: string;
  status: CommissionStatus;
  percent_applied?: number | string;
  payable_after: string | null;
  created_at?: string;
  organization_id?: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toAccount(row: any): ReferralAccount {
  const person = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    code: row.code ? normalizeCode(row.code) : null,
    status: row.status,
    percent: row.percent == null ? null : Number(row.percent),
    pitch: row.pitch ?? null,
    audienceUrl: row.audience_url ?? null,
    appliedAt: row.applied_at,
    reviewedAt: row.reviewed_at ?? null,
    reviewNote: row.review_note ?? null,
    applicantName: person?.full_name ?? null,
    applicantEmail: person?.contact_email ?? null,
  };
}

/**
 * Every row, not the first thousand.
 *
 * THE BUG THIS EXISTS FOR: PostgREST caps a select that carries no range, and
 * this project's cap is 1000 (verified against `ai_usage` — 2335 rows, an
 * unbounded select returns 1000). Every balance on every referral screen was
 * computed by fetching the rows and adding them up, so past a thousand
 * commissions the arithmetic silently stopped at the cap. Nothing errors and
 * nothing looks wrong: the referrer is simply shown less money than they are
 * owed, and the platform is shown a smaller liability than it has.
 *
 * It is the shape of bug that only appears once the programme succeeds, and by
 * then the wrong number has been on the page for months.
 *
 * Pages explicitly rather than trusting the default. A SQL aggregate would be
 * better still, but that is a migration, and this is correct today.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const SIZE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += SIZE) {
    const { data, error } = await page(from, from + SIZE - 1);
    if (error || !data) break;
    out.push(...data);
    if (data.length < SIZE) break;
  }
  return out;
}
