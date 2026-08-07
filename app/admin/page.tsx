import {
  EmptyRow,
  FAINT,
  List,
  PageHead,
  Panel,
  Pill,
  Row,
  RowText,
  SANS,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
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

  const conduct = (
    (flagged ?? []) as {
      id: string;
      organization_id: string;
      started_at: string;
      result: { conduct?: { kind?: string; quote?: string } | null } | null;
    }[]
  )
    .map((s) => ({
      id: s.id,
      org: orgName.get(s.organization_id) ?? s.organization_id,
      when: new Date(s.started_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
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
  const centers = orgList.filter((o) => o.kind === "center");

  const applied = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHead
        eyebrow="Platform"
        title="Every center and learner workspace"
        subtitle="Approve organizations, and keep an eye on the whole platform."
      />

      <StatRow>
        <StatTile value={pendingCenters.length} label="Awaiting approval" tone="indigo" />
        <StatTile value={centers.length} label="Centers" />
        <StatTile value={orgList.length} label="Workspaces" />
        <StatTile value={profiles?.length ?? 0} label="Users" />
      </StatRow>

      {pendingCenters.length > 0 ? (
        <Panel
          tone="flag"
          title="Center applications"
          description="Organizations waiting for approval. Approving sends the confirmation email."
        >
          <List>
            {pendingCenters.map((o) => (
              <OrgReviewRow
                key={o.id}
                orgId={o.id}
                name={o.name}
                email={o.contact_email}
                applied={applied(o.created_at)}
              />
            ))}
          </List>
        </Panel>
      ) : null}

      <Panel title="All organizations" description={`${orgList.length} workspaces`}>
        <List>
          {orgList.map((o, i) => (
            <Row key={o.id} first={i === 0}>
              <RowText
                title={
                  <>
                    {o.name}
                    {o.kind === "center" ? (
                      <span style={{ marginLeft: 8 }}>
                        <Pill
                          tone={
                            o.status === "active"
                              ? "good"
                              : o.status === "pending"
                                ? "warn"
                                : "bad"
                          }
                        >
                          center · {o.status}
                        </Pill>
                      </span>
                    ) : null}
                  </>
                }
                meta={`${o.plan} · ${memberCount.get(o.id) ?? 0} member${(memberCount.get(o.id) ?? 0) === 1 ? "" : "s"}`}
              />
            </Row>
          ))}
          {orgList.length === 0 ? <EmptyRow>No organizations yet.</EmptyRow> : null}
        </List>
      </Panel>

      <Panel
        title="Examiner conduct"
        description="Mocks where the candidate abused or refused the examiner. Reported only — no band, quota or account is affected by anything here."
      >
        <List>
          {conduct.map((c, i) => (
            <Row key={c.id} first={i === 0}>
              <RowText title={`“${c.quote}”`} meta={`${c.org} · ${c.when}`} />
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: FAINT,
                  flex: "none",
                  textTransform: "capitalize",
                }}
              >
                {c.kind}
              </span>
            </Row>
          ))}
          {conduct.length === 0 ? <EmptyRow>Nothing flagged.</EmptyRow> : null}
        </List>
      </Panel>
    </div>
  );
}
