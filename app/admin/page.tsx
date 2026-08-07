import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

import { OrgReviewRow } from "./org-review-row";

interface OrgRow {
  id: string;
  name: string;
  plan: string;
  kind: "personal" | "center";
  status: "pending" | "active" | "rejected" | "suspended";
  contact_email: string | null;
  created_at: string;
}

export default async function AdminPage() {
  // Platform-wide view: read across all tenants with the service-role client
  // (super_admins intentionally have no org, so RLS would otherwise hide rows).
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, plan, kind, status, contact_email, created_at")
    .order("created_at", { ascending: false });

  const { data: profiles } = await admin.from("profiles").select("organization_id, role");

  // Conduct findings — abuse or refusal aimed at the examiner, as reported by
  // the grader (speaking/service.py `_conduct`). Surfaced HERE and nowhere near
  // the learner's account: nothing about it changes their band, their quota or
  // their access. It exists so the owner can tell one bad afternoon from a
  // pattern, which is the only question this data can honestly answer.
  const { data: flagged } = await admin
    .from("speaking_sessions")
    .select("id, organization_id, started_at, result")
    .eq("mode", "full")
    .not("result->conduct", "is", null)
    .order("started_at", { ascending: false })
    .limit(25);

  const orgName = new Map<string, string>();
  for (const o of (orgs ?? []) as OrgRow[]) orgName.set(o.id, o.name);

  const conduct = ((flagged ?? []) as {
    id: string;
    organization_id: string;
    started_at: string;
    result: { conduct?: { kind?: string; quote?: string } | null } | null;
  }[])
    .map((s) => ({
      id: s.id,
      org: orgName.get(s.organization_id) ?? s.organization_id,
      when: new Date(s.started_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      }),
      kind: s.result?.conduct?.kind ?? "",
      quote: s.result?.conduct?.quote ?? "",
    }))
    .filter((c) => c.quote);

  const memberCount = new Map<string, number>();
  for (const p of (profiles ?? []) as { organization_id: string }[]) {
    memberCount.set(p.organization_id, (memberCount.get(p.organization_id) ?? 0) + 1);
  }

  const orgList = (orgs ?? []) as OrgRow[];
  const pendingCenters = orgList.filter((o) => o.kind === "center" && o.status === "pending");

  const applied = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform console</h1>
        <p className="text-muted-foreground">Every center and individual learner workspace.</p>
      </div>

      {pendingCenters.length > 0 ? (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="text-base">Center applications</CardTitle>
            <CardDescription>
              Organizations waiting for approval. Approving sends the confirmation email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {pendingCenters.map((o) => (
                <OrgReviewRow
                  key={o.id}
                  orgId={o.id}
                  name={o.name}
                  email={o.contact_email}
                  applied={applied(o.created_at)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizations</CardTitle>
            <CardDescription>Centers + personal workspaces</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{orgList.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
            <CardDescription>Across all orgs</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{profiles?.length ?? 0}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {orgList.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{o.name}</span>
                  {o.kind === "center" ? (
                    <span
                      className={
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium " +
                        (o.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : o.status === "pending"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-destructive/10 text-destructive")
                      }
                    >
                      center · {o.status}
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground flex shrink-0 items-center gap-4">
                  <span className="capitalize">{o.plan}</span>
                  <span>{memberCount.get(o.id) ?? 0} members</span>
                </span>
              </li>
            ))}
            {orgList.length === 0 ? (
              <li className="text-muted-foreground py-2">No organizations yet.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Examiner conduct</CardTitle>
          <CardDescription>
            Mocks where the candidate abused or refused the examiner. Reported only — no band,
            quota or account is affected by anything here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {conduct.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate">&ldquo;{c.quote}&rdquo;</span>
                  <span className="text-muted-foreground block text-xs">
                    {c.org} · {c.when}
                  </span>
                </span>
                <span className="text-muted-foreground shrink-0 capitalize">{c.kind}</span>
              </li>
            ))}
            {conduct.length === 0 ? (
              <li className="text-muted-foreground py-2">Nothing flagged.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
