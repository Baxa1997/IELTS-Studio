import { NextResponse } from "next/server";

import { sendAutoMessage } from "@/lib/console/auto-message-service";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/jobs/auto-messages — the scheduled half of §12.
 *
 * Four of the six automatic messages hang off an event and send themselves at
 * the moment it happens. `gone_quiet` is different: its trigger is the ABSENCE
 * of an event ("seven days with no attempt"), and nothing that does not happen
 * can call a function. So it needs somebody to ask, on a schedule.
 *
 * NEEDS A SCHEDULE TO BE USEFUL. There is no cron configured in this repo yet —
 * the grading queue drainer has the same shape and the same requirement. Point
 * a Vercel Cron, a Supabase cron job, or any external pinger at this URL once a
 * day with the CRON_SECRET; until something calls it, the toggle is on and the
 * nudge never fires. It is stated here rather than left to be discovered.
 *
 * ONCE PER STUDENT PER DAY, guaranteed by `auto_message_sends` rather than by
 * this function running exactly once. A retried cron, an overlapping
 * invocation, or an owner curling it twice all resolve to one message, because
 * the subject key is the date and the unique index refuses the second claim.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = serverEnv.cronSecret;
  if (!secret) return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  if (!isAuthorized(req, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();

  // Only centres. A personal org is one learner practising alone, and nudging
  // yourself about your own silence is not a feature.
  const { data: orgs } = await admin
    .from("organizations")
    .select("id")
    .eq("kind", "center")
    .eq("status", "active");

  let chased = 0;
  let nudged = 0;
  let considered = 0;

  for (const org of orgs ?? []) {
    const orgId = org.id as string;

    const { data: students } = await admin
      .from("profiles")
      .select("id, full_name, member_status, created_at")
      .eq("organization_id", orgId)
      .eq("role", "student");

    const active = ((students ?? []) as {
      id: string;
      full_name: string | null;
      member_status: string | null;
      created_at: string;
    }[])
      // Paused and left students are not "quiet" — somebody already knows why,
      // and nudging a student who has left is the message a centre least wants
      // to send.
      .filter((s) => (s.member_status ?? "active") === "active")
      // A student who joined four days ago has not gone quiet; they have not
      // started. Their first week is the teacher's job, not a robot's.
      .filter((s) => s.created_at <= sevenDaysAgo);

    if (active.length === 0) continue;
    considered += active.length;

    const ids = active.map((s) => s.id);
    const [essays, reading, listening, speaking] = await Promise.all([
      admin.from("essays").select("student_id").in("student_id", ids).gte("created_at", sevenDaysAgo),
      admin
        .from("reading_attempts")
        .select("student_id")
        .in("student_id", ids)
        .gte("created_at", sevenDaysAgo),
      admin
        .from("listening_attempts")
        .select("student_id")
        .in("student_id", ids)
        .gte("created_at", sevenDaysAgo),
      admin
        .from("speaking_sessions")
        .select("student_id")
        .in("student_id", ids)
        .gte("started_at", sevenDaysAgo),
    ]);

    // ALL FOUR SKILLS COUNT. A student who has been doing speaking mocks all
    // week has not gone quiet, and telling them they have is how a nudge
    // becomes noise the whole cohort learns to ignore.
    const recent = new Set<string>();
    for (const res of [essays, reading, listening, speaking]) {
      for (const row of res.data ?? []) recent.add(row.student_id as string);
    }

    for (const student of active) {
      if (recent.has(student.id)) continue;
      nudged += await sendAutoMessage({
        organizationId: orgId,
        key: "gone_quiet",
        recipientIds: [student.id],
        values: { student: student.full_name ?? "there" },
        href: "/dashboard",
        subjectKey: today,
      });
    }
    /* ── the other scheduled one: an invoice that has come due ──────────────
       `invoice_due` sat in the catalogue for weeks labelled "not connected
       yet", because invoicing raises no event when a date arrives — nothing
       happens on the 5th; the 5th simply IS. Like `gone_quiet`, it is the
       absence of an event, so somebody has to ask.

       DUE TODAY AND STILL OWED. Not overdue-and-mounting: this is one nudge on
       the day, and `auto_message_sends` keys it to the invoice so a retried or
       overlapping cron cannot send it twice. Chasing every day would be a
       different feature and a worse one. */
    const { data: due } = await admin
      .from("student_invoices")
      .select("id, student_id, amount_minor, discount_minor")
      .eq("organization_id", orgId)
      .eq("due_on", today)
      .eq("voided", false);

    const dueRows = (due ?? []) as {
      id: string;
      student_id: string;
      amount_minor: number;
      discount_minor: number;
    }[];
    if (dueRows.length > 0) {
      const { data: settled } = await admin
        .from("v_invoice_settlement")
        .select("invoice_id, paid_minor")
        .in(
          "invoice_id",
          dueRows.map((r) => r.id),
        );
      const paid = new Map(
        ((settled ?? []) as { invoice_id: string; paid_minor: number }[]).map((r) => [
          r.invoice_id,
          Number(r.paid_minor ?? 0),
        ]),
      );
      const names = new Map(
        ((students ?? []) as { id: string; full_name: string | null }[]).map((s2) => [
          s2.id,
          s2.full_name ?? "",
        ]),
      );

      for (const inv of dueRows) {
        const owed =
          Number(inv.amount_minor ?? 0) -
          Number(inv.discount_minor ?? 0) -
          (paid.get(inv.id) ?? 0);
        // Paid already, or settled in advance: say nothing. The worst message a
        // centre can send is one chasing money it has been given.
        if (owed <= 0) continue;
        chased += await sendAutoMessage({
          organizationId: orgId,
          key: "invoice_due",
          recipientIds: [inv.student_id],
          values: { student: names.get(inv.student_id) || "there" },
          subjectKey: `invoice:${inv.id}`,
        });
      }
    }

  }

  return NextResponse.json({ ok: true, considered, nudged, chased, date: today });
}

function isAuthorized(req: Request, secret: string): boolean {
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}
