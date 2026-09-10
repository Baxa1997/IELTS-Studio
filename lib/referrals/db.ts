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

/**
 * The real address for a set of profiles.
 *
 * TWO PLACES HOLD AN ADDRESS AND THE OBVIOUS ONE IS USUALLY EMPTY.
 * `profiles.contact_email` is written for a CENTRE, where the auth address is a
 * synthetic one at students.engprogress.com (CLAUDE.md). A B2C learner who
 * signed up with their own Gmail has it on `auth.users` and NULL on the profile
 * — the common case for this programme, and the one every referral query got
 * wrong. `notify.ts` was fixed for it; the admin queue was not, so a reviewer
 * saw "no contact email" against every applicant who had one, and the detail
 * page's checks reported that approval mail had nowhere to go while it was
 * being delivered.
 *
 * `auth.users` is not exposed through PostgREST, so there is no join to make
 * here — the Admin API is the only route, and it answers one id at a time.
 * Batched in parallel and only for profiles that actually need it.
 */
export async function resolveEmails(
  admin: { auth: { admin: { getUserById: (id: string) => PromiseLike<{ data: { user: { email?: string | null } | null } | null }> } } },
  profileIds: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  const ids = [...new Set(profileIds.filter(Boolean))];
  if (ids.length === 0) return found;

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const { data } = await admin.auth.admin.getUserById(id);
        return [id, data?.user?.email?.trim() ?? ""] as const;
      } catch {
        return [id, ""] as const;
      }
    }),
  );
  for (const [id, email] of results) {
    // The synthetic address a teacher-created student gets is not a way to
    // reach anybody, so it is treated as absent rather than shown as contact.
    if (email && email.includes("@") && !email.endsWith("students.engprogress.com")) {
      found.set(id, email);
    }
  }
  return found;
}
