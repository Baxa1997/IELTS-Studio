import { getSession } from "@/lib/auth";
import { loadFinanceSettings } from "@/lib/finance/load";
import { buildPdf } from "@/lib/finance/pdf";
import { loadPayrollMonths } from "@/lib/finance/payroll-months";
import { payrollMonthsSheets } from "@/lib/finance/payroll-sheet";
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
  const supabaseForOrg = await createClient();
  const { data: orgRow } = await supabaseForOrg
    .from("organizations")
    .select("name")
    .eq("id", session.profile.organization_id)
    .maybeSingle();
  const organizationName = (orgRow?.name as string) ?? "Center";

  // The multi-month payroll grid is its own shape — a column per month rather
  // than a period — so it is served before the single-period machinery below
  // rather than bent into it.
  const monthsParam = url.searchParams.get("months");
  if (monthsParam) {
    const months = monthsParam
      .split(",")
      .map((m) => m.trim())
      .filter((m) => /^\d{4}-\d{2}(-\d{2})?$/.test(m))
      .map((m) => (m.length === 7 ? `${m}-01` : m));
    if (months.length === 0) return fail(400, "No valid months given.");

    const settings = await loadFinanceSettings();
    const data = await loadPayrollMonths(months);
    const sheets = payrollMonthsSheets(data, {
      organizationName,
      currency: settings.currency,
      generatedAt: new Date().toISOString().slice(0, 10),
    });
    const book = buildWorkbook(sheets, {
      moneyDigits: minorDigits(settings.currency) === 0 ? 0 : 2,
    });
    const span =
      data.columns.length > 0
        ? `${data.columns[0].month.slice(0, 7)}_${data.columns[data.columns.length - 1].month.slice(0, 7)}`
        : "empty";
    return file(book, `teacher-pay-${span}.xlsx`, "xlsx");
  }

  const kind = (url.searchParams.get("report") ?? "summary") as ReportKind;
  if (!(kind in REPORT_LABEL)) return fail(400, "Unknown report.");
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const period = resolvePeriod({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    month: url.searchParams.get("month") ?? undefined,
  });

  const data = await gatherReport({
    kind,
    profile: session.profile,
    organizationName,
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

  return file(body, reportFilename(data, format), format);
}

function file(body: Buffer, filename: string, format: "pdf" | "xlsx"): Response {
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
