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
  searchParams: Promise<{ q?: string; role?: string; kind?: string; sort?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const query = sp.q?.trim() || undefined;
  const role = sp.role && sp.role !== "all" ? sp.role : undefined;
  const kind = sp.kind && sp.kind !== "all" ? sp.kind : undefined;
  const sort: SortKey = (sp.sort && sp.sort in SORTS ? sp.sort : "recent") as SortKey;

  const all = await loadUsers(query);
  const rows = all
    .filter((u) => (role ? u.role === role : true))
    .filter((u) => (kind ? u.orgKind === kind : true))
    .sort(SORTS[sort].cmp);

  const inCenters = all.filter((u) => u.orgKind === "center").length;
  const active = all.filter((u) => u.practiceCount > 0).length;

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

      <Panel
        title={query ? `Matching “${query}”` : "All users"}
        description={`${rows.length} shown${rows.length !== all.length ? ` of ${all.length}` : ""}.`}
      >
        <FilterBar>
          <SearchField name="q" label="Search" value={query} placeholder="Name or login…" />
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
            <TH>Login</TH>
            <TH align="right">Practice</TH>
            <TH align="right">Joined</TH>
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
                <TD muted>{u.username ?? "—"}</TD>
                <TD align="right" numeric muted={u.practiceCount === 0}>
                  {u.practiceCount}
                </TD>
                <TD align="right" muted numeric>
                  {dateFmt(u.createdAt)}
                </TD>
              </TR>
            ))}
            {rows.length === 0 ? (
              <EmptyTableRow colSpan={6}>
                Nobody matches those filters.
              </EmptyTableRow>
            ) : null}
          </tbody>
        </ScrollTable>
      </Panel>
    </div>
  );
}
