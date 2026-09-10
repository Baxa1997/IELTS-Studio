import { NextResponse } from "next/server";

import { expireLapsedSubscriptions } from "@/lib/billing/expiry";
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
 * SAFE ON A MISSED RUN. Quota reads consult the same `hasLapsed` predicate
 * (lib/quota.ts), so a day this does not fire is not a day of free Pro — it is
 * only a day where the row still says Pro and the email has not gone yet.
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

  const { expired, errors } = await expireLapsedSubscriptions();

  // Errors are reported, not thrown: one org that fails to downgrade must not
  // stop the rest, and a 500 would make the scheduler retry the whole pass.
  if (errors.length > 0) {
    console.error("[billing] expiry pass had failures:", errors);
  }
  return NextResponse.json({ expired, errors: errors.length });
}

function isAuthorized(req: Request, secret: string): boolean {
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}
