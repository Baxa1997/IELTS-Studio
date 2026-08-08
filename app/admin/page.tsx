import {
  EmptyRow,
  FAINT,
  List,
  PageHead,
  Panel,
  Pill,
  Row,
  RowLink,
  RowText,
  SANS,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { loadCenters, loadPlatformStats } from "@/lib/admin/platform";
import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

import { OrgReviewRow } from "./org-review-row";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminPage() {
  await requireSuperAdmin();
  const [stats, centers] = await Promise.all([loadPlatformStats(), loadCenters()]);
  const pending = centers.filter((c) => c.status === "pending");

  // Conduct findings — abuse or refusal aimed at the examiner, as reported by
  // the grader (speaking/service.py `_conduct`). Surfaced HERE and nowhere near
  // the learner's account: nothing about it changes their band, their quota or
  // their access. It exists so the owner can tell one bad afternoon from a
  // pattern, which is the only question this data can honestly answer.
  const admin = createAdminClient();
  const { data: flagged } = await admin
    .from("speaking_sessions")
    .select("id, organization_id, started_at, result")
    .eq("mode", "full")
    .not("result->conduct", "is", null)
    .order("started_at", { ascending: false })
    .limit(25);

  const { data: orgNames } = await admin.from("organizations").select("id, name");
  const orgName = new Map((orgNames ?? []).map((o) => [o.id, o.name]));

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
      when: dateFmt(s.started_at),
      kind: s.result?.conduct?.kind ?? "",
      quote: s.result?.conduct?.quote ?? "",
    }))
    .filter((c) => c.quote);

  const p = stats.practice30d;

  return (
    <div>
      <PageHead
        eyebrow="Platform"
        title="Everything, across every tenant"
        subtitle="Approve centers, and watch the platform as a whole."
      />

      <StatRow>
        <StatTile value={stats.learners} label="Learners" tone="indigo" />
        <StatTile value={stats.centers} label="Centers" />
        <StatTile value={stats.teachers} label="Teachers" />
        <StatTile value={stats.newUsers7d} label="New this week" />
        <StatTile value={p.total} label="Practices (30d)" />
      </StatRow>

      {pending.length > 0 ? (
        <Panel
          tone="flag"
          title={`${pending.length} center${pending.length === 1 ? "" : "s"} waiting for approval`}
          description="Approving activates the workspace and emails the applicant."
        >
          <List>
            {pending.map((c) => (
              <OrgReviewRow
                key={c.id}
                orgId={c.id}
                name={c.name}
                email={c.contactEmail}
                applied={dateFmt(c.createdAt)}
              />
            ))}
          </List>
        </Panel>
      ) : null}

      <Panel
        title="Practice in the last 30 days"
        description="Every graded attempt on the platform, by skill."
      >
        <StatRow>
          <StatTile value={p.writing} label="Writing" />
          <StatTile value={p.reading} label="Reading" />
          <StatTile value={p.listening} label="Listening" />
          <StatTile value={p.speaking} label="Speaking" />
        </StatRow>
      </Panel>

      <Panel
        title="Centers"
        description={
          centers.length > 0
            ? `${centers.length} organization${centers.length === 1 ? "" : "s"}`
            : undefined
        }
        actions={centers.length > 0 ? <RowLink href="/admin/centers">See all</RowLink> : undefined}
      >
        <List>
          {centers.slice(0, 6).map((c, i) => (
            <Row key={c.id} first={i === 0}>
              <RowText
                title={
                  <>
                    {c.name}{" "}
                    <Pill
                      tone={
                        c.status === "active" ? "good" : c.status === "pending" ? "warn" : "bad"
                      }
                    >
                      {c.status}
                    </Pill>
                  </>
                }
                meta={`${c.teachers} teacher${c.teachers === 1 ? "" : "s"} · ${c.groups} group${c.groups === 1 ? "" : "s"} · ${c.students} student${c.students === 1 ? "" : "s"}`}
              />
              <RowLink href={`/admin/centers/${c.id}`}>Open</RowLink>
            </Row>
          ))}
          {centers.length === 0 ? (
            <EmptyRow>
              No centers yet. They arrive through the Organization tab on the sign-up page.
            </EmptyRow>
          ) : null}
        </List>
      </Panel>

      <Panel
        title="Individual learners"
        description="Self-serve accounts, each in their own personal workspace."
      >
        <StatRow>
          <StatTile value={stats.personalWorkspaces} label="Personal workspaces" />
          <StatTile value={stats.centerAdmins} label="Center admins" />
        </StatRow>
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
