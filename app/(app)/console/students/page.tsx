import { redirect } from "next/navigation";

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
import { requireOrgUser } from "@/lib/auth";
import { loadStudents, type StudentRow } from "@/lib/console/people";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const SORTS = {
  practice: { label: "Most practice", cmp: (a: StudentRow, b: StudentRow) => b.practiceCount - a.practiceCount },
  idle: { label: "Least practice", cmp: (a: StudentRow, b: StudentRow) => a.practiceCount - b.practiceCount },
  recent: {
    label: "Recently active",
    cmp: (a: StudentRow, b: StudentRow) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""),
  },
  name: { label: "Name A–Z", cmp: (a: StudentRow, b: StudentRow) => a.name.localeCompare(b.name) },
} as const;

type SortKey = keyof typeof SORTS;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; sort?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const query = sp.q?.trim().toLowerCase() || undefined;
  const groupFilter = sp.group && sp.group !== "all" ? sp.group : undefined;
  const sort: SortKey = (sp.sort && sp.sort in SORTS ? sp.sort : "practice") as SortKey;

  const all = await loadStudents({ role: profile.role, profileId: profile.id });

  // Every group represented in the visible roster, for the filter.
  const groupOptions = [
    ...new Map(all.flatMap((s) => s.groups).map((g) => [g.id, g])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const rows = all
    .filter((s) =>
      query
        ? s.name.toLowerCase().includes(query) || (s.username ?? "").toLowerCase().includes(query)
        : true,
    )
    .filter((s) =>
      groupFilter === "none"
        ? s.groups.length === 0
        : groupFilter
          ? s.groups.some((g) => g.id === groupFilter)
          : true,
    )
    .sort(SORTS[sort].cmp);

  const neverPractised = all.filter((s) => s.practiceCount === 0).length;
  const ungrouped = all.filter((s) => s.groups.length === 0).length;

  return (
    <div>
      <PageHead
        eyebrow="Center"
        title="Students"
        subtitle={
          profile.role === "center_admin"
            ? "Everyone learning at your center, across all classes."
            : "The students in the groups you run."
        }
      />

      <StatRow>
        <StatTile value={all.length} label="Students" tone="indigo" />
        <StatTile value={all.length - neverPractised} label="Have practised" />
        <StatTile value={neverPractised} label="Never practised" />
        {profile.role === "center_admin" ? (
          <StatTile value={ungrouped} label="In no group" />
        ) : null}
      </StatRow>

      <Panel
        title="Roster"
        description={
          <>
            {rows.length} shown{rows.length !== all.length ? ` of ${all.length}` : ""}. Students are
            added inside a group — open a group to create one.
          </>
        }
      >
        <FilterBar>
          <SearchField name="q" label="Search" value={sp.q} placeholder="Name or login…" />
          <SelectField
            name="group"
            label="Group"
            value={sp.group}
            options={[
              { value: "all", label: "All groups" },
              ...groupOptions.map((g) => ({ value: g.id, label: g.name })),
              { value: "none", label: "In no group" },
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
            <TH>Name</TH>
            <TH>Login</TH>
            <TH>Group</TH>
            <TH align="right">Practice</TH>
            <TH align="right">Last active</TH>
            <TH />
          </THead>
          <tbody>
            {rows.map((s, i) => (
              <TR key={s.id} first={i === 0}>
                <TD>{s.name}</TD>
                <TD muted>{s.username ?? "—"}</TD>
                <TD muted>
                  {s.groups.length > 0 ? (
                    s.groups.map((g) => g.name).join(", ")
                  ) : (
                    <Pill tone="warn">no group</Pill>
                  )}
                </TD>
                <TD align="right" numeric muted={s.practiceCount === 0}>
                  {s.practiceCount}
                </TD>
                <TD align="right" numeric muted>
                  {s.lastActive ? dateFmt(s.lastActive) : "never"}
                </TD>
                <TD align="right">
                  {s.groups[0] ? (
                    <RowLink href={`/console/groups/${s.groups[0].id}/students/${s.id}`}>
                      Report
                    </RowLink>
                  ) : null}
                </TD>
              </TR>
            ))}
            {rows.length === 0 ? (
              <EmptyTableRow colSpan={6}>
                {all.length === 0
                  ? "No students yet. Open a group and add one."
                  : "Nobody matches those filters."}
              </EmptyTableRow>
            ) : null}
          </tbody>
        </ScrollTable>
      </Panel>
    </div>
  );
}
