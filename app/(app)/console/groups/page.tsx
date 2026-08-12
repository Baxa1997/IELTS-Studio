import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AMBER,
  Avatar,
  Bar,
  BODY,
  Card,
  cardStyle,
  Chip,
  FAINT,
  fieldStyle,
  GREEN,
  INK,
  PageHead,
  SANS,
  SERIF,
  SOFT,
  Tag,
  type Tone,
} from "@/components/console/crm-ui";
import { PanelButton } from "@/components/console/console-chrome";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { loadCenterReport } from "@/lib/console/reports";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** The chips above the grid. Each is a predicate over the same list, so the
 *  count on the chip and the cards below it can never disagree. */
const FILTERS = {
  all: { label: "All", test: () => true },
  running: {
    label: "Active",
    test: (g: Card_) => g.teacherName != null && g.assignments > 0,
  },
  // nopractice: { label: "No practice set", test: (g: Card_) => g.assignments === 0 },
  noteacher: { label: "No teacher", test: (g: Card_) => g.teacherName == null },
} as const;

type FilterKey = keyof typeof FILTERS;

/** Mean of a list, or null when there is nothing to average. */
const mean = (xs: number[]) =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;

interface Card_ {
  id: string;
  name: string;
  teacherName: string | null;
  students: number;
  assignments: number;
  completionPct: number | null;
  averageBand: number | null;
  attendancePct: number | null;
}

/** Groups list. Center admins manage every group and the teaching staff;
 *  teachers see only the groups assigned to them. */
export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const isAdmin = profile.role === "center_admin";
  const sp = await searchParams;
  const filter: FilterKey = (sp.filter && sp.filter in FILTERS ? sp.filter : "all") as FilterKey;

  const supabase = await createClient();
  const [{ groups }, report, membersRes, ratesRes] = await Promise.all([
    loadGroups(profile),
    loadCenterReport({ role: profile.role, profileId: profile.id }),
    supabase.from("group_members").select("group_id, student_id"),
    supabase.from("v_student_attendance").select("student_id, rate_pct"),
  ]);

  // Attendance per class = the mean rate of its members. RLS has already
  // narrowed both queries to what this person may read.
  const rateOf = new Map(
    ((ratesRes.data ?? []) as { student_id: string; rate_pct: number | null }[]).map((r) => [
      r.student_id,
      r.rate_pct,
    ]),
  );
  const ratesByGroup = new Map<string, number[]>();
  for (const m of (membersRes.data ?? []) as { group_id: string; student_id: string }[]) {
    const rate = rateOf.get(m.student_id);
    if (rate == null) continue;
    ratesByGroup.set(m.group_id, [...(ratesByGroup.get(m.group_id) ?? []), rate]);
  }

  // `loadGroups` owns the roster count; the report owns the graded figures.
  // Joined by id so a group with no graded work still shows up, with dashes.
  const stats = new Map(report.groups.map((g) => [g.id, g]));
  const cards: Card_[] = groups.map((g) => {
    const r = stats.get(g.id);
    return {
      id: g.id,
      name: g.name,
      teacherName: g.teacherName,
      students: g.memberCount,
      assignments: r?.assignments ?? 0,
      completionPct: r?.completionPct ?? null,
      averageBand: r?.averageBand ?? null,
      attendancePct: mean(ratesByGroup.get(g.id) ?? []),
    };
  });

  const query = sp.q?.trim().toLowerCase() || undefined;
  const shown = cards
    .filter(FILTERS[filter].test)
    .filter((c) =>
      query
        ? c.name.toLowerCase().includes(query) ||
          (c.teacherName ?? "").toLowerCase().includes(query)
        : true,
    );

  return (
    <div>
      <PageHead
        eyebrow="Classes"
        title="Groups"
        // subtitle={
        //   isAdmin
        //     ? `${groups.length} class${groups.length === 1 ? "" : "es"} · a group is where practice is set and bands are compared.`
        //     : "The classes assigned to you — set practice here and read the results."
        // }
        actions={<PanelButton panel="group">+ New group</PanelButton>}
      />

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
          // background: "#fff",
          // padding: 6,
          // borderRadius: 6,
        }}
      >
        {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
          <Chip
            key={k}
            href={k === "all" ? "/console/groups" : `/console/groups?filter=${k}`}
            active={filter === k}
          >
            {FILTERS[k].label}
            <span style={{ opacity: 0.7, marginLeft: 6 }}>
              {cards.filter(FILTERS[k].test).length}
            </span>
          </Chip>
        ))}
        <form method="GET" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Filter by name or teacher…"
            aria-label="Filter groups"
            style={{ ...fieldStyle, width: 260, background: "#fff" }}
          />
        </form>
      </div>

      {shown.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {shown.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      ) : (
        <Card>
          <p style={{ fontFamily: SANS, fontSize: 13.5, color: SOFT, margin: 0 }}>
            {cards.length === 0
              ? isAdmin
                ? "No groups yet — use + New group above to create the first one."
                : "No groups assigned to you yet."
              : "No class matches that filter."}
          </p>
        </Card>
      )}
    </div>
  );
}

/** One class as a card: who runs it, how full it is, and how it's doing. */
function GroupCard({ group: g }: { group: Card_ }) {
  const status: { label: string; tone: Tone } =
    g.teacherName == null
      ? { label: "No teacher", tone: "red" }
      : g.assignments === 0
        ? { label: "No practice", tone: "amber" }
        : { label: "Active", tone: "green" };

  return (
    <Link
      href={`/console/groups/${g.id}`}
      className="cn-tile"
      style={{ ...cardStyle, padding: 16, textDecoration: "none", display: "block" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 17,
              fontWeight: 700,
              color: INK,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {g.name}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: SOFT, marginTop: 3 }}>
            {g.assignments} practice{g.assignments === 1 ? "" : "s"} set
          </div>
        </div>
        <Tag tone={status.tone}>{status.label}</Tag>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 12px" }}>
        {g.teacherName ? (
          <>
            <Avatar name={g.teacherName} size={24} />
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: BODY }}>{g.teacherName}</span>
          </>
        ) : (
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT }}>
            Nobody assigned yet
          </span>
        )}
      </div>

      {/* The design shows enrolled-against-capacity here. There is no capacity
          column, so the bar carries completion — the figure a class is actually
          judged on — and the roster count stays a plain number. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: SANS,
          fontSize: 11.5,
          color: SOFT,
          marginBottom: 6,
        }}
      >
        <span>
          {g.students} student{g.students === 1 ? "" : "s"}
        </span>
        <span>{g.completionPct == null ? "not started" : `${g.completionPct}% completed`}</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        <Bar
          pct={g.completionPct ?? 0}
          fill={
            (g.completionPct ?? 0) >= 60 ? GREEN : (g.completionPct ?? 0) >= 30 ? AMBER : "#D9D6CE"
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          borderTop: "1px solid #F0EEE9",
          paddingTop: 12,
        }}
      >
        <Stat label="Avg band" value={g.averageBand?.toFixed(1) ?? "—"} />
        <Stat label="Completion" value={g.completionPct == null ? "—" : `${g.completionPct}%`} />
        <Stat label="Attendance" value={g.attendancePct == null ? "—" : `${g.attendancePct}%`} />
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: FAINT }}>{label}</div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 15,
          fontWeight: 600,
          color: INK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
