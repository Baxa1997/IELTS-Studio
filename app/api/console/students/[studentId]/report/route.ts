import { getSession } from "@/lib/auth";
import { buildParentReport, parentReportFilename } from "@/lib/console/parent-report";
import { loadStudentReport } from "@/lib/console/student-report";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/console/students/[studentId]/report — the parent-facing PDF (§6).
 *
 * A route handler rather than a server action because the browser has to
 * receive a FILE with a filename.
 *
 * AUTHORITY IS RLS, NOT A ROLE CHECK. `loadStudentReport` reads through the
 * user's own client throughout, so a teacher gets a document only for a student
 * `can_view_student` lets them see — the same gate as the on-screen report,
 * which is the point: a downloadable file must not be a wider door than the
 * page it hangs off. A student who is not visible returns null and 404s here,
 * indistinguishable from one who does not exist.
 *
 * Students are refused outright. A learner reading their own report is a
 * feature the product may want, but it is not this document: this one is
 * written to be handed over by a centre, with the centre's name at the top.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> },
): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "Sign in first.");
  if (session.profile.role === "student") {
    return fail(403, "Your own progress lives on your dashboard.");
  }

  const { studentId } = await params;
  const report = await loadStudentReport(studentId);
  if (!report) return fail(404, "No such student, or not one you teach.");

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, contact_email")
    .eq("id", session.profile.organization_id)
    .maybeSingle();

  const pdf = buildParentReport(report, {
    organizationName: (org?.name as string) ?? "Center",
    contact: (org?.contact_email as string | null) ?? null,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${parentReportFilename(report)}"`,
      "Content-Length": String(pdf.length),
      // A progress report is a snapshot of live marking; a cached copy handed
      // to a parent next week would be quietly wrong.
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
