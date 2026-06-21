import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface OrgRow {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

export default async function AdminPage() {
  // Platform-wide view: read across all tenants with the service-role client
  // (super_admins intentionally have no org, so RLS would otherwise hide rows).
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, plan, created_at")
    .order("created_at", { ascending: false });

  const { data: profiles } = await admin.from("profiles").select("organization_id, role");

  const memberCount = new Map<string, number>();
  for (const p of (profiles ?? []) as { organization_id: string }[]) {
    memberCount.set(p.organization_id, (memberCount.get(p.organization_id) ?? 0) + 1);
  }

  const orgList = (orgs ?? []) as OrgRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform console</h1>
        <p className="text-muted-foreground">Every center and individual learner workspace.</p>
      </div>

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
                <span className="truncate">{o.name}</span>
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
    </div>
  );
}
