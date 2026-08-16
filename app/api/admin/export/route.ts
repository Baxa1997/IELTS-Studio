import { loadCenters, loadUsers } from "@/lib/admin/platform";
import { requireSuperAdmin } from "@/lib/auth";
import { PLAN_TIERS } from "@/lib/billing/plans";
import { buildWorkbook, type Sheet } from "@/lib/finance/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export?kind=centers|users
 *
 * The download behind the design's export buttons. It reuses the finance
 * console's workbook writer rather than emitting CSV: a centre owner opening
 * this in Excel gets typed columns and sensible widths, and there is no second
 * spreadsheet format in the codebase to keep working.
 *
 * super_admin only, and the guard is the first thing that runs — this is a
 * cross-tenant dump of every organization and every account on the platform,
 * which is exactly the response that must never be reachable by anyone else.
 */
export async function GET(request: Request) {
  await requireSuperAdmin();

  const kind = new URL(request.url).searchParams.get("kind") ?? "centers";
  const stamp = new Date().toISOString().slice(0, 10);

  let sheets: Sheet[];
  let filename: string;

  if (kind === "users") {
    const users = await loadUsers();
    sheets = [
      {
        name: "Users",
        notes: [`Every account on the platform · exported ${stamp}`],
        columns: [
          { header: "Name", width: 26 },
          { header: "Email", width: 32 },
          { header: "Login", width: 16 },
          { header: "Role", width: 14 },
          { header: "Workspace", width: 24 },
          { header: "Plan", width: 12 },
          { header: "Practice", width: 10, type: "number" },
          { header: "Joined", width: 14 },
        ],
        rows: users.map((u) => [
          u.name,
          // The synthetic address is not an inbox, and a column of them in a
          // spreadsheet is exactly how someone ends up mail-merging to nowhere.
          u.emailUndeliverable ? `${u.email} (no inbox)` : (u.email ?? ""),
          u.username ?? "",
          u.role,
          u.orgKind === "center" ? u.orgName : "Individual",
          PLAN_TIERS[u.orgPlan].name,
          u.practiceCount,
          u.createdAt.slice(0, 10),
        ]),
      },
    ];
    filename = `engprogress-users-${stamp}.xlsx`;
  } else {
    const centers = await loadCenters();
    sheets = [
      {
        name: "Centers",
        notes: [`Every organization · practice counts the last 30 days · exported ${stamp}`],
        columns: [
          { header: "Center", width: 28 },
          { header: "Status", width: 12 },
          { header: "Plan", width: 12 },
          { header: "Contact", width: 30 },
          { header: "Teachers", width: 10, type: "number" },
          { header: "Groups", width: 10, type: "number" },
          { header: "Students", width: 10, type: "number" },
          { header: "Practice 30d", width: 13, type: "number" },
          { header: "Metered", width: 10 },
          { header: "Joined", width: 14 },
          { header: "Approved", width: 14 },
        ],
        rows: centers.map((c) => [
          c.name,
          c.status,
          c.plan,
          c.contactEmail ?? "",
          c.teachers,
          c.groups,
          c.students,
          c.practice30d,
          c.billingEnforced ? "yes" : "no",
          c.createdAt.slice(0, 10),
          c.approvedAt?.slice(0, 10) ?? "",
        ]),
      },
    ];
    filename = `engprogress-centers-${stamp}.xlsx`;
  }

  const book = buildWorkbook(sheets);
  return new Response(new Uint8Array(book), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
