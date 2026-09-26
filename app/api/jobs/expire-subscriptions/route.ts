import { NextResponse } from "next/server";

import { expireLapsedSubscriptions } from "@/lib/billing/expiry";
import { sendQuotaWarnings } from "@/lib/billing/quota-warnings";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/jobs/expire-subscriptions — end the plans that have run out.
 *
 * NOTHING EVER EXPIRED BEFORE THIS. A subscription recorded a
 * `current_period_end` and no code anywhere read it, so an org that paid once
 * kept its plan permanently: a single $14.99 bought unlimited grading for good,
 * and the learner was never told anything either way. The trigger for this job
 * is the ABSENCE of an event — a period simply passing — and nothing that does
 * not happen can call a function, so it needs somebody to ask on a schedule.
 *
 * IDEMPOTENT, so a retried cron, an overlapping invocation, or somebody curling
 * it twice all settle to one downgrade and one email: the query only picks up
 * subscriptions that are still open with a past end date, and closing one
 * removes it from that query.
 *
 * SAFE ON A MISSED RUN. Quota reads consult the same `hasLapsed` rule
 * (lib/billing/lifecycle.ts), so a day this does not fire is not a day of free
 * Pro — only a day where the row still says Pro and the email has not gone yet.
 *
 * STRIPE IS ASKED, NOT ASSUMED. For Stripe rows this reconciles against Stripe
 * itself before changing anything (see lib/billing/expiry.ts), because Stripe
 * renews on its own and our stored date is only a copy.
 *
 * Scheduled daily at 03:00 UTC in vercel.json. Vercel Cron calls with GET and
 * sends `Authorization: Bearer $CRON_SECRET`; POST stays for a hand-run.
 */
export async function GET(req: Request): Promise<Response> {
  return POST(req);
}

export async function POST(req: Request): Promise<Response> {
  const secret = serverEnv.cronSecret;
  if (!secret) return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  if (!isAuthorized(req, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { expired, reconciled, errors } = await expireLapsedSubscriptions();

  /* THE ALLOWANCE WARNINGS RIDE THE SAME NIGHTLY RUN, after expiry on purpose:
     an org downgraded a minute ago is then measured against its NEW, smaller
     allowance, which is the one it will actually meet tomorrow. A second cron
     entry would have been the tidier file and the worse schedule — this one is
     already authorised, already daily, and already about billing. Independent
     of the expiry result: a failure there must not silence these. */
  const quota = await sendQuotaWarnings();
  errors.push(...quota.errors.map((e) => `quota ${e}`));

  // Successful orgs are idempotent, so a non-zero result should be visible to
  // Vercel and retried rather than silently marking a partial pass as healthy.
  const body = { expired, reconciled, quotaChecked: quota.checked, quotaEmailed: quota.emailed, errors: errors.length };
  if (errors.length > 0) {
    console.error("[billing] nightly pass had failures:", errors);
    return NextResponse.json(body, { status: 500 });
  }
  return NextResponse.json(body);
}

function isAuthorized(req: Request, secret: string): boolean {
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}
