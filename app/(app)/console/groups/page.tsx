import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AMBER,
  Avatar,
  Bar,
  BODY,
  Card,
  CardHead,
  CardNote,
  cardStyle,
  Chip,
  FAINT,
  GREEN,
  INK,
  Kpi,
  KpiRow,
  PageHead,
  SANS,
  SERIF,
  SOFT,
  Stack,
  Tag,
  type Tone,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { loadCenterReport } from "@/lib/console/reports";

import { CreateGroupForm } from "./group-forms";
import { InviteMemberPanel } from "./invite-member-panel";

export const dynamic = "force-dynamic";

/** The chips above the grid. Each is a predicate over the same list, so the
 *  count on the chip and the cards below it can never disagree. */
const FILTERS = {
  all: { label: "All", test: () => true },
  running: {
    label: "Running",
    test: (g: Card_) => g.teacherName != null && g.assignments > 0,
  },
  nopractice: { label: "No practice set", test: (g: Card_) => g.assignments === 0 },
  noteacher: { label: "No teacher", test: (g: Card_) => g.teacherName == null },
} as const;

type FilterKey = keyof typeof FILTERS;

interface Card_ {
  id: string;
  name: string;
  teacherName: string | null;
  students: number;
  assignments: number;
  completionPct: number | null;
  averageBand: number | null;
}

/** Groups list. Center admins manage every group and the teaching staff;
 *  teachers see only the groups assigned to them. */
export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const isAdmin = profile.role === "center_admin";
  const sp = await searchParams;
  const filter: FilterKey = (sp.filter && sp.filter in FILTERS ? sp.filter : "all") as FilterKey;

  const [{ groups, teachers }, report] = await Promise.all([
    loadGroups(profile),
    loadCenterReport({ role: profile.role, profileId: profile.id }),
  ]);

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
    };
  });

  const shown = cards.filter(FILTERS[filter].test);
  const banded = cards.filter((c) => c.averageBand != null);

  return (
    <div>
      <PageHead
        eyebrow="Classes"
        title="Groups"
        subtitle={
          isAdmin
            ? `${groups.length} class${groups.length === 1 ? "" : "es"} · a group is where practice is set and bands are compared.`
            : "The classes assigned to you — set practice here and read the results."
        }
      />

      <KpiRow>
        <Kpi label={isAdmin ? "Classes" : "Your classes"} value={groups.length} />
        <Kpi
          label="Students enrolled"
          value={cards.reduce((n, c) => n + c.students, 0)}
          sub="across every class"
        />
        <Kpi
          label="Practice set"
          value={cards.reduce((n, c) => n + c.assignments, 0)}
          sub={`${cards.filter((c) => c.assignments === 0).length} class(es) with none`}
        />
        <Kpi
          label="Average band"
          value={
            banded.length
              ? (banded.reduce((n, c) => n + (c.averageBand ?? 0), 0) / banded.length).toFixed(1)
              : "—"
          }
          sub={banded.length ? `${banded.length} class(es) graded` : "nothing graded yet"}
        />
      </KpiRow>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
          <Chip
            key={k}
            href={k === "all" ? "/console/groups" : `/console/groups?filter=${k}`}
            active={filter === k}
          >
            {FILTERS[k].label}
            <span style={{ opacity: 0.7, marginLeft: 6 }}>{cards.filter(FILTERS[k].test).length}</span>
          </Chip>
        ))}
      </div>

      <Stack>
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
                  ? "No groups yet — create one below."
                  : "No groups assigned to you yet."
                : "No class matches that filter."}
            </p>
          </Card>
        )}

        <Card>
          <CardHead title="Create a group" />
          <CardNote>
            {!isAdmin
              ? "Your own class — you'll be its teacher, and you add the students."
              : teachers.length === 0
                ? "No teachers yet — invite one below, then assign them here."
                : "Assign a teacher now or later."}
          </CardNote>
          <CreateGroupForm teachers={teachers} canAssignTeacher={isAdmin} />
        </Card>

        <Card>
          <CardHead title="Invite people" />
          <CardNote>
            {isAdmin
              ? "Invite a teacher, or a student straight into a group. They join your center only — no other center can see them."
              : "Invite a student into one of your groups."}
          </CardNote>
          <InviteMemberPanel groups={groups} canInviteTeachers={isAdmin} />
        </Card>
      </Stack>
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
        : { label: "Running", tone: "green" };

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
          fill={(g.completionPct ?? 0) >= 60 ? GREEN : (g.completionPct ?? 0) >= 30 ? AMBER : "#D9D6CE"}
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
        <Stat label="Practice" value={g.assignments} />
        <Stat label="Students" value={g.students} />
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
