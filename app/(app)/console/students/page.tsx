import { redirect } from "next/navigation";

import {
  AMBER,
  Card,
  CardHead,
  Empty,
  FAINT,
  fieldStyle,
  GREEN,
  Kpi,
  KpiRow,
  PageHead,
  PersonCell,
  RED,
  SANS,
  Table,
  Tag,
  TD,
  THead,
  Toolbar,
  TRow,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadStudents, type StudentRow } from "@/lib/console/people";

export const dynamic = "force-dynamic";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const SORTS = {
  practice: { label: "Most practice", cmp: (a: StudentRow, b: StudentRow) => b.practiceCount - a.practiceCount },
  idle: { label: "Least practice", cmp: (a: StudentRow, b: StudentRow) => a.practiceCount - b.practiceCount },
  recent: {
    label: "Recently active",
    cmp: (a: StudentRow, b: StudentRow) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""),
  },
  weakest: {
    label: "Furthest from target",
    // Unmeasured students sort last: there is no gap to rank them by.
    cmp: (a: StudentRow, b: StudentRow) => gap(a) - gap(b),
  },
  name: { label: "Name A–Z", cmp: (a: StudentRow, b: StudentRow) => a.name.localeCompare(b.name) },
} as const;

type SortKey = keyof typeof SORTS;

/** Distance from the weakest measured skill to target — most negative first. */
function gap(s: StudentRow): number {
  if (!s.weakest || s.targetBand == null) return Number.POSITIVE_INFINITY;
  return s.weakest.band - s.targetBand;
}

/** The stat cards double as filters — a number you can click is a number you can
 *  check. Each one is just a predicate over the same roster. */
const CARD_FILTERS = {
  practised: (s: StudentRow) => s.practiceCount > 0,
  never: (s: StudentRow) => s.practiceCount === 0,
  nogroup: (s: StudentRow) => s.groups.length === 0,
} as const;

type CardFilter = keyof typeof CARD_FILTERS;

const COLS = "2.2fr 1.5fr 1.2fr .7fr .8fr .8fr 1fr .6fr";

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
  const atTarget = all.filter(
    (s) => s.weakest != null && s.targetBand != null && s.weakest.band >= s.targetBand,
  ).length;

  return (
    <div>
      <PageHead
        eyebrow="People"
        title="Students"
        subtitle={
          profile.role === "center_admin"
            ? `${all.length} enrolled across ${groupOptions.length} class${groupOptions.length === 1 ? "" : "es"}.`
            : "The students in the groups you run."
        }
      />

      <KpiRow>
        <Kpi
          label="Students"
          value={all.length}
          sub="click a card to filter the list"
          href="/console/students"
          active={!card}
        />
        <Kpi
          label="Have practised"
          value={all.length - neverPractised}
          href={cardHref("practised")}
          active={card === "practised"}
        />
        <Kpi
          label="Never practised"
          value={neverPractised}
          deltaTone="bad"
          href={cardHref("never")}
          active={card === "never"}
        />
        {profile.role === "center_admin" ? (
          <Kpi
            label="In no group"
            value={ungrouped}
            href={cardHref("nogroup")}
            active={card === "nogroup"}
          />
        ) : null}
        <Kpi label="At or above target" value={atTarget} sub="on their weakest skill" />
      </KpiRow>

      <Card flush>
        <CardHead
          title="Roster"
          divided
          note="band shown is the LOWEST measured skill — the one capping them. Nothing is averaged across skills."
        />

        <Toolbar>
          {/* One GET form drives every control, so a search can't silently drop
              the card filter above it. */}
          <form
            method="GET"
            style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}
          >
            {card ? <input type="hidden" name="filter" value={card} /> : null}
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search name or login…"
              aria-label="Search students"
              style={{ ...fieldStyle, flex: 1, minWidth: 180, maxWidth: 260 }}
            />
            <select name="group" defaultValue={sp.group ?? "all"} aria-label="Group" style={fieldStyle}>
              <option value="all">All groups</option>
              {groupOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
              <option value="none">In no group</option>
            </select>
            <select name="sort" defaultValue={sort} aria-label="Sort" style={fieldStyle}>
              {Object.entries(SORTS).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="cn-btn cn-btn--ghost"
              style={{ ...fieldStyle, background: "#fff", cursor: "pointer", fontWeight: 500 }}
            >
              Apply
            </button>
          </form>
          <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>
            {rows.length} shown{rows.length !== all.length ? ` of ${all.length}` : ""}
          </span>
        </Toolbar>

        <Table cols={COLS} minWidth={860}>
          <THead
            cols={COLS}
            labels={["Student", "Group", "Weakest skill", "Target", "Practice", "Att.", "Last active", ""]}
          />
          {rows.map((s) => {
            const short = s.weakest ? s.weakest.skill : null;
            const behind =
              s.weakest && s.targetBand != null ? s.weakest.band - s.targetBand : null;
            return (
              // Roster route, not the group one: a student in no group has a
              // report too, and this row is the only way to reach it.
              <TRow key={s.id} cols={COLS} href={`/console/students/${s.id}`}>
                <PersonCell name={s.name} meta={s.username ?? "no login"} />
                <TD tone="body">
                  {s.groups.length > 0 ? (
                    s.groups.map((g) => g.name).join(", ")
                  ) : (
                    <Tag tone="amber">no group</Tag>
                  )}
                </TD>
                <TD>
                  {s.weakest ? (
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          behind == null || behind >= 0 ? GREEN : behind >= -1 ? AMBER : RED,
                      }}
                    >
                      {s.weakest.band.toFixed(1)}{" "}
                      <span style={{ fontWeight: 400, color: FAINT, textTransform: "capitalize" }}>
                        {short}
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: FAINT }}>not measured</span>
                  )}
                </TD>
                <TD tone="soft">{s.targetBand?.toFixed(1) ?? "—"}</TD>
                <TD tone={s.practiceCount === 0 ? "faint" : "body"}>{s.practiceCount}</TD>
                <TD
                  tone={s.attendancePct == null ? "faint" : "body"}
                  weight={s.attendancePct != null && s.attendancePct < 75 ? 600 : undefined}
                >
                  {s.attendancePct == null ? "—" : `${s.attendancePct}%`}
                </TD>
                <TD tone="soft">{s.lastActive ? dateFmt(s.lastActive) : "never"}</TD>
                {/* The whole row is the link, so this is a marker, not an
                    anchor — an <a> inside an <a> is invalid HTML. */}
                <TD align="right" tone="faint">
                  ›
                </TD>
              </TRow>
            );
          })}
          {rows.length === 0 ? (
            <Empty>
              {all.length === 0
                ? "No students yet. Open a group and add one."
                : "Nobody matches those filters."}
            </Empty>
          ) : null}
        </Table>
      </Card>
    </div>
  );
}
