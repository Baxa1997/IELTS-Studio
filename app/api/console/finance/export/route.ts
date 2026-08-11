import { getSession } from "@/lib/auth";
import { buildPdf } from "@/lib/finance/pdf";
import { resolvePeriod } from "@/lib/finance/period";
import {
  gatherReport,
  REPORT_LABEL,
  type ReportKind,
  reportFilename,
  reportToPdf,
  reportToSheets,
} from "@/lib/finance/reports";
import { buildWorkbook } from "@/lib/finance/xlsx";
import { minorDigits } from "@/lib/finance/money";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/console/finance/export
 *
 * The download behind every "Export" button in the finance console. A route
 * handler rather than a server action because the browser has to receive a FILE
 * with a filename — and because a report of a few thousand rows is built in
 * Node and streamed once, not serialised through a React payload.
 *
 * Query: ?report=summary|ledger|expenses|payroll|debtors
 *        &format=xlsx|pdf
 *        &from=YYYY-MM-DD&to=YYYY-MM-DD  (or &month=YYYY-MM-01)
 *        plus the same account/category/group filters the ledger page uses, so
 *        what you exported is what you were looking at.
 *
 * Authority: center_admin only. RLS would already return an empty ledger to
 * anyone else, and an empty PDF is a worse answer than a refusal.
 */
export async function GET(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "Sign in first.");
  if (session.profile.role !== "center_admin") {
    return fail(403, "Only the center owner can export finance reports.");
  }

  const url = new URL(req.url);
  const kind = (url.searchParams.get("report") ?? "summary") as ReportKind;
  if (!(kind in REPORT_LABEL)) return fail(400, "Unknown report.");
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const period = resolvePeriod({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    month: url.searchParams.get("month") ?? undefined,
  });

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", session.profile.organization_id)
    .maybeSingle();

  const data = await gatherReport({
    kind,
    profile: session.profile,
    organizationName: (org?.name as string) ?? "Center",
    period,
    filters: {
      branch: url.searchParams.get("branch") ?? undefined,
      accountId: url.searchParams.get("account") ?? undefined,
      categoryId: url.searchParams.get("category") ?? undefined,
      groupId: url.searchParams.get("group") ?? undefined,
      direction: (url.searchParams.get("direction") as "in" | "out" | null) ?? undefined,
    },
  });

  const body =
    format === "pdf"
      ? buildPdf(reportToPdf(data))
      : buildWorkbook(reportToSheets(data), {
          moneyDigits: minorDigits(data.currency) === 0 ? 0 : 2,
        });

  const filename = reportFilename(data, format);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type":
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
    },
  });
}

function fail(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
