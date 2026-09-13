import {
  Card,
  CardHead,
  CardNote,
  Empty,
  FAINT,
  INK,
  SANS,
  SOFT,
  Stack,
  Tag,
} from "@/components/console/crm-ui";
import { createClient } from "@/lib/supabase/server";

const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? `${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} today`
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const STAFF_LABEL: Record<string, string> = {
  center_admin: "Center admin",
  administrator: "Administrator",
  teacher: "Teacher",
};

/**
 * Roles and recent activity.
 *
 * The roles list describes the permission model that actually exists — center
 * admin, administrator, teacher, student — not a configurable ACL. Making it
 * look editable would promise something RLS does not implement: the roles are
 * baked into policies across dozens of tables.
 */
export async function RolesSection() {
  const supabase = await createClient();
  const [peopleRes, groupsRes, invitesRes, announceRes, certRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, created_at"),
    supabase
      .from("groups")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("v_pending_invites")
      .select("email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("announcements")
      .select("subject, sent_at")
      .order("sent_at", { ascending: false })
      .limit(10),
    supabase
      .from("certificates")
      .select("course, issued_on, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const people = (peopleRes.data ?? []) as {
    id: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }[];
  const roleCount = (role: string) => people.filter((p) => p.role === role).length;

  const ROLES = [
    {
      name: "Center admin",
      count: roleCount("center_admin"),
      can: "Everything in the center: teachers, groups, students, reports, billing, certificates and announcements. Cannot approve or upgrade the center itself.",
    },
    {
      name: "Administrator",
      count: roleCount("administrator"),
      can: "Runs the center day to day: groups, students, teachers on groups, the timetable, attendance, reports and taking tuition at the counter. Never payroll, the ledger, invoices, branches, billing or center settings.",
    },
    {
      name: "Teacher",
      count: roleCount("teacher"),
      can: "Only the groups they own — create groups, add students, set practice, mark attendance and read their own students' results. No billing, no other teacher's groups.",
    },
    {
      name: "Student",
      count: roleCount("student"),
      can: "The homework set for their group and the feedback on it. Cannot see a classmate's work, or the roster.",
    },
  ];

  /* A real activity feed built from what the database records. There is no
     audit table — this is the union of the things that carry a timestamp, so it
     shows creations, never a rename or a permission change. */
  const activity = [
    ...people
      .filter((p) => p.role !== "student")
      .map((p) => ({
        at: p.created_at,
        what: `${STAFF_LABEL[p.role] ?? "Staff"} ${p.full_name ?? "account"} joined`,
      })),
    ...((groupsRes.data ?? []) as { name: string; created_at: string }[]).map((g) => ({
      at: g.created_at,
      what: `Created the group ${g.name}`,
    })),
    ...((invitesRes.data ?? []) as { email: string; role: string; created_at: string }[]).map(
      (i) => ({ at: i.created_at, what: `Invited ${i.email} as ${i.role}` }),
    ),
    ...((announceRes.data ?? []) as { subject: string; sent_at: string }[]).map((a) => ({
      at: a.sent_at,
      what: `Sent announcement “${a.subject}”`,
    })),
    ...((certRes.data ?? []) as { course: string; created_at: string }[]).map((c) => ({
      at: c.created_at,
      what: `Issued a ${c.course} certificate`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  return (
    <Stack>
      <Card flush>
        <CardHead title="Roles" divided note="fixed by the permission model, not configurable" />
        {ROLES.map((r) => (
          <div key={r.name} style={{ padding: "14px 18px", borderBottom: "1px solid #DEDEDA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: INK }}>
                {r.name}
              </span>
              <Tag tone="neutral">{r.count}</Tag>
            </div>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 12.5,
                color: SOFT,
                marginTop: 5,
                lineHeight: 1.55,
              }}
            >
              {r.can}
            </div>
          </div>
        ))}
        <div style={{ padding: "12px 18px" }}>
          <CardNote>
            These are enforced in the database, not in the interface — every table carries a policy
            that names them. A finer-grained role would be a schema change, not a setting.
          </CardNote>
        </div>
      </Card>

      <Card flush>
        <CardHead title="Recent activity" divided note="what the center has recorded" />
        {activity.map((a, i) => (
          <div
            key={`${a.at}-${i}`}
            style={{
              display: "flex",
              gap: 12,
              padding: "11px 18px",
              borderBottom: "1px solid #DEDEDA",
              fontFamily: SANS,
              fontSize: 12.5,
            }}
          >
            <span style={{ color: FAINT, width: 90, flex: "0 0 90px" }}>{when(a.at)}</span>
            <span style={{ flex: 1, minWidth: 0, color: INK }}>{a.what}</span>
          </div>
        ))}
        {activity.length === 0 ? (
          <Empty action={{ href: "/console/groups", label: "Create a group →" }}>
            Nothing recorded yet.
          </Empty>
        ) : null}
      </Card>
    </Stack>
  );
}
