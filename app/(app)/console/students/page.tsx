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

/** The stat cards double as filters — a number you can click is a number you can
 *  check. Each one is just a predicate over the same roster. */
const CARD_FILTERS = {
  practised: (s: StudentRow) => s.practiceCount > 0,
  never: (s: StudentRow) => s.practiceCount === 0,
  nogroup: (s: StudentRow) => s.groups.length === 0,
} as const;

type CardFilter = keyof typeof CARD_FILTERS;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; sort?: string; filter?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const query = sp.q?.trim().toLowerCase() || undefined;
  const groupFilter = sp.group && sp.group !== "all" ? sp.group : undefined;
  const sort: SortKey = (sp.sort && sp.sort in SORTS ? sp.sort : "practice") as SortKey;
  const card: CardFilter | undefined =
    sp.filter && sp.filter in CARD_FILTERS ? (sp.filter as CardFilter) : undefined;

  // Clicking the active card again clears it, so the strip is a toggle.
  const cardHref = (key: CardFilter) => (card === key ? "/console/students" : `?filter=${key}`);

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
    .filter((s) => (card ? CARD_FILTERS[card](s) : true))
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
        <StatTile
          value={all.length}
          label="Students"
          tone="indigo"
          href="/console/students"
          active={!card}
        />
        <StatTile
          value={all.length - neverPractised}
          label="Have practised"
          href={cardHref("practised")}
          active={card === "practised"}
        />
        <StatTile
          value={neverPractised}
          label="Never practised"
          href={cardHref("never")}
          active={card === "never"}
        />
        {profile.role === "center_admin" ? (
          <StatTile
            value={ungrouped}
            label="In no group"
            href={cardHref("nogroup")}
            active={card === "nogroup"}
          />
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
          {/* Applying a search must not silently drop the card filter above. */}
          {card ? <input type="hidden" name="filter" value={card} /> : null}
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
                  {/* Roster route, not the group one: a student in no group has
                      a report too, and this row is the only way to reach it. */}
                  <RowLink href={`/console/students/${s.id}`}>Report</RowLink>
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
