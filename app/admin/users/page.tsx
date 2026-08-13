import {
  EmptyTableRow,
  FilterBar,
  ScrollTable,
  SearchField,
  SelectField,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/table";
import { PageHead, Panel, Pill, StatRow, StatTile } from "@/components/console/page-ui";
import { loadUsers, type PlatformUser } from "@/lib/admin/platform";
import { requireSuperAdmin } from "@/lib/auth";
import { PLAN_ORDER, PLAN_TIERS } from "@/lib/billing/plans";

import { PlanControls } from "./plan-controls";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const SORTS = {
  recent: { label: "Newest first", cmp: (a: PlatformUser, b: PlatformUser) => b.createdAt.localeCompare(a.createdAt) },
  oldest: { label: "Oldest first", cmp: (a: PlatformUser, b: PlatformUser) => a.createdAt.localeCompare(b.createdAt) },
  practice: { label: "Most practice", cmp: (a: PlatformUser, b: PlatformUser) => b.practiceCount - a.practiceCount },
  idle: { label: "No practice first", cmp: (a: PlatformUser, b: PlatformUser) => a.practiceCount - b.practiceCount },
  name: { label: "Name A–Z", cmp: (a: PlatformUser, b: PlatformUser) => a.name.localeCompare(b.name) },
} as const;

type SortKey = keyof typeof SORTS;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; kind?: string; sort?: string; plan?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const query = sp.q?.trim() || undefined;
  const role = sp.role && sp.role !== "all" ? sp.role : undefined;
  const kind = sp.kind && sp.kind !== "all" ? sp.kind : undefined;
  const sort: SortKey = (sp.sort && sp.sort in SORTS ? sp.sort : "recent") as SortKey;

  const plan = sp.plan && sp.plan !== "all" ? sp.plan : undefined;

  const all = await loadUsers(query);
  const rows = all
    .filter((u) => (role ? u.role === role : true))
    .filter((u) => (kind ? u.orgKind === kind : true))
    .filter((u) => (plan ? u.orgPlan === plan : true))
    .sort(SORTS[sort].cmp);

  const inCenters = all.filter((u) => u.orgKind === "center").length;
  const active = all.filter((u) => u.practiceCount > 0).length;
  // Paying accounts by tier. Counted over PEOPLE, not organizations, because
  // that is the question being asked — "how many Pro users" — and a center on
  // Pro is a room full of them.
  const byPlan = (p: string) => all.filter((u) => u.orgPlan === p).length;

  return (
    <div>
      <PageHead
        eyebrow="Platform"
        title="Users"
        subtitle="Everyone on the platform, with how much work each of them owns."
      />

      <StatRow>
        <StatTile value={all.length} label="Users" tone="indigo" />
        <StatTile value={all.length - inCenters} label="Individual" />
        <StatTile value={inCenters} label="In a center" />
        <StatTile value={all.length - active} label="Never practised" />
      </StatRow>

      {/* By tier. Each tile filters the table, so "who are my 12 Pro users" is
          one click rather than a question you have to go and answer elsewhere. */}
      <StatRow>
        {PLAN_ORDER.map((p) => (
          <StatTile
            key={p}
            value={byPlan(p)}
            label={PLAN_TIERS[p].name}
            tone={plan === p ? "indigo" : "ink"}
            href={`/admin/users?plan=${plan === p ? "all" : p}`}
            active={plan === p}
          />
        ))}
      </StatRow>

      <Panel
        title={query ? `Matching “${query}”` : "All users"}
        description={`${rows.length} shown${rows.length !== all.length ? ` of ${all.length}` : ""}.`}
      >
        <FilterBar>
          <SearchField name="q" label="Search" value={query} placeholder="Name, email or login…" />
          <SelectField
            name="role"
            label="Role"
            value={sp.role}
            options={[
              { value: "all", label: "Any role" },
              { value: "student", label: "Students" },
              { value: "teacher", label: "Teachers" },
              { value: "center_admin", label: "Center admins" },
            ]}
          />
          <SelectField
            name="kind"
            label="Account"
            value={sp.kind}
            options={[
              { value: "all", label: "Anywhere" },
              { value: "personal", label: "Individual" },
              { value: "center", label: "In a center" },
            ]}
          />
          {/* Also a field, not only the tiles above: the bar is a form, so a
              plan chosen by tile has to round-trip when you then type a name. */}
          <SelectField
            name="plan"
            label="Plan"
            value={sp.plan}
            options={[
              { value: "all", label: "Any plan" },
              ...PLAN_ORDER.map((p) => ({ value: p, label: PLAN_TIERS[p].name })),
            ]}
          />
          <SelectField
            name="sort"
            label="Sort"
            value={sort}
            options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))}
          />
        </FilterBar>

        <ScrollTable
          maxHeight={560}
          caption="Scroll for more. The list is capped at the 500 most recent accounts."
        >
          <THead>
            <TH>Name</TH>
            <TH>Role</TH>
            <TH>Workspace</TH>
            <TH>Email</TH>
            <TH>Login</TH>
            <TH>Plan</TH>
            <TH align="right">Practice</TH>
            <TH align="right">Joined</TH>
            <TH align="right">Controls</TH>
          </THead>
          <tbody>
            {rows.map((u, i) => (
              <TR key={u.id} first={i === 0}>
                <TD>{u.name}</TD>
                <TD>
                  <Pill tone={u.role === "center_admin" ? "indigo" : "neutral"}>
                    {u.role.replace("_", " ")}
                  </Pill>
                </TD>
                <TD muted>{u.orgKind === "center" ? u.orgName : "individual"}</TD>
                {/* An undeliverable address is shown, not hidden — but it says so,
                    because a support reply to it disappears silently. */}
                <TD muted={u.emailUndeliverable}>
                  {u.email ?? "—"}
                  {u.emailUndeliverable ? (
                    <span title="Synthetic sign-in address — cannot receive mail">
                      {" "}
                      (no inbox)
                    </span>
                  ) : null}
                </TD>
                <TD muted>{u.username ?? "—"}</TD>
                <TD>
                  <Pill tone={u.orgPlan === "trial" ? "neutral" : "indigo"}>
                    {PLAN_TIERS[u.orgPlan].name}
                  </Pill>
                </TD>
                <TD align="right" numeric muted={u.practiceCount === 0}>
                  {u.practiceCount}
                </TD>
                <TD align="right" muted numeric>
                  {dateFmt(u.createdAt)}
                </TD>
                <TD align="right">
                  <PlanControls
                    profileId={u.id}
                    name={u.name}
                    plan={u.orgPlan}
                    orgKind={u.orgKind}
                    orgName={u.orgName}
                    gradingLimit={u.gradingLimit}
                    generationLimit={u.generationLimit}
                    orgMemberCount={u.orgMemberCount}
                  />
                </TD>
              </TR>
            ))}
            {rows.length === 0 ? (
              <EmptyTableRow colSpan={9}>
                Nobody matches those filters.
              </EmptyTableRow>
            ) : null}
          </tbody>
        </ScrollTable>
      </Panel>
    </div>
  );
}
