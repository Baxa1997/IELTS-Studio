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
import {
  PageHead,
  Panel,
  Pill,
  RowLink,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { loadCenters, type CenterRow } from "@/lib/admin/platform";
import { requireSuperAdmin } from "@/lib/auth";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const SORTS = {
  recent: { label: "Newest first", cmp: (a: CenterRow, b: CenterRow) => b.createdAt.localeCompare(a.createdAt) },
  students: { label: "Most students", cmp: (a: CenterRow, b: CenterRow) => b.students - a.students },
  practice: { label: "Most practice", cmp: (a: CenterRow, b: CenterRow) => b.practice30d - a.practice30d },
  idle: { label: "Least active", cmp: (a: CenterRow, b: CenterRow) => a.practice30d - b.practice30d },
  teachers: { label: "Most teachers", cmp: (a: CenterRow, b: CenterRow) => b.teachers - a.teachers },
  name: { label: "Name A–Z", cmp: (a: CenterRow, b: CenterRow) => a.name.localeCompare(b.name) },
} as const;

type SortKey = keyof typeof SORTS;

export default async function CentersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const query = sp.q?.trim().toLowerCase() || undefined;
  const status = sp.status && sp.status !== "all" ? sp.status : undefined;
  const sort: SortKey = (sp.sort && sp.sort in SORTS ? sp.sort : "recent") as SortKey;

  const all = await loadCenters();
  const rows = all
    .filter((c) => (status ? c.status === status : true))
    .filter((c) => (query ? c.name.toLowerCase().includes(query) : true))
    .sort(SORTS[sort].cmp);

  const active = all.filter((c) => c.status === "active");
  const totals = active.reduce(
    (acc, c) => ({
      teachers: acc.teachers + c.teachers,
      students: acc.students + c.students,
      groups: acc.groups + c.groups,
    }),
    { teachers: 0, students: 0, groups: 0 },
  );
  const dormant = active.filter((c) => c.practice30d === 0).length;

  return (
    <div>
      <PageHead
        eyebrow="Platform"
        title="Education centers"
        subtitle="Every organization, and how much of it is actually being used."
      />

      <StatRow>
        <StatTile value={active.length} label="Active centers" tone="indigo" />
        <StatTile value={totals.teachers} label="Teachers" />
        <StatTile value={totals.groups} label="Groups" />
        <StatTile value={totals.students} label="Students" />
        <StatTile value={dormant} label="Silent 30 days" />
      </StatRow>

      <Panel
        title="Centers"
        description={`${rows.length} shown${rows.length !== all.length ? ` of ${all.length}` : ""}. Practice counts the last 30 days across all four skills.`}
      >
        <FilterBar>
          <SearchField name="q" label="Search" value={sp.q} placeholder="Center name…" />
          <SelectField
            name="status"
            label="Status"
            value={sp.status}
            options={[
              { value: "all", label: "Any status" },
              { value: "pending", label: "Awaiting approval" },
              { value: "active", label: "Active" },
              { value: "rejected", label: "Rejected" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <SelectField
            name="sort"
            label="Sort"
            value={sort}
            options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))}
          />
        </FilterBar>

        <ScrollTable maxHeight={560} caption="Scroll for more.">
          <THead>
            <TH>Center</TH>
            <TH>Status</TH>
            <TH align="right">Teachers</TH>
            <TH align="right">Groups</TH>
            <TH align="right">Students</TH>
            <TH align="right">Practice 30d</TH>
            <TH align="right">Joined</TH>
            <TH />
          </THead>
          <tbody>
            {rows.map((c, i) => (
              <TR key={c.id} first={i === 0}>
                <TD>
                  {c.name}
                  {!c.billingEnforced ? (
                    <span style={{ marginLeft: 7 }}>
                      <Pill tone="indigo">unmetered</Pill>
                    </span>
                  ) : null}
                </TD>
                <TD>
                  <Pill
                    tone={c.status === "active" ? "good" : c.status === "pending" ? "warn" : "bad"}
                  >
                    {c.status}
                  </Pill>
                </TD>
                <TD align="right" numeric>{c.teachers}</TD>
                <TD align="right" numeric>{c.groups}</TD>
                <TD align="right" numeric>{c.students}</TD>
                <TD align="right" numeric muted={c.practice30d === 0}>
                  {c.practice30d}
                </TD>
                <TD align="right" numeric muted>
                  {dateFmt(c.createdAt)}
                </TD>
                <TD align="right">
                  <RowLink href={`/admin/centers/${c.id}`}>Open</RowLink>
                </TD>
              </TR>
            ))}
            {rows.length === 0 ? (
              <EmptyTableRow colSpan={8}>
                {all.length === 0
                  ? "No centers yet. They apply through the Organization tab on the sign-up page."
                  : "No centers match those filters."}
              </EmptyTableRow>
            ) : null}
          </tbody>
        </ScrollTable>
      </Panel>
    </div>
  );
}
