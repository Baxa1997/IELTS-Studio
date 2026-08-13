import { redirect } from "next/navigation";

import {
  Card,
  CardHead,
  CardNote,
  Empty,
  FAINT,
  INK,
  PageHead,
  SANS,
  SOFT,
  Split,
  Stack,
  Tag,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadSubjects } from "@/lib/console/subjects";
import { createClient } from "@/lib/supabase/server";

import { CenterProfileForm } from "./profile-form";
import { SubjectsManager } from "./subjects-manager";

export const dynamic = "force-dynamic";

const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? `${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} today`
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/**
 * Settings & roles: who can see what, and how the center appears.
 *
 * The roles list is a description of the permission model that actually exists
 * — center_admin, administrator, teacher, student — not a configurable ACL. Making it look
 * editable would promise something RLS does not implement, and the three roles
 * are baked into policies across a dozen tables.
 */
export default async function SettingsPage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");
  if (profile.role !== "center_admin") redirect("/console");

  const supabase = await createClient();
  const subjects = await loadSubjects();
  const [orgRes, peopleRes, groupsRes, invitesRes, announceRes, certRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, status, plan, contact_email")
      .eq("id", profile.organization_id)
      .maybeSingle(),
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

  const org = orgRes.data as {
    name: string | null;
    status: string | null;
    plan: string | null;
    contact_email: string | null;
  } | null;
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
      can: "Runs the center day to day: classes, students, teachers on classes, the timetable, attendance, reports and taking tuition at the counter. Never payroll, the ledger, invoices, branches, billing or these settings.",
    },
    {
      name: "Teacher",
      count: roleCount("teacher"),
      can: "Only the groups they own — create classes, add students, set practice, mark attendance and read their own students' results. No billing, no other teacher's classes.",
    },
    {
      name: "Student",
      count: roleCount("student"),
      can: "Their own practice and feedback across all four skills, plus any homework set for their class. Cannot see a classmate's work, or the roster.",
    },
  ];

  /**
   * A real activity feed built from what the database actually records. There is
   * no audit table — this is the union of the things that carry a timestamp, so
   * it can't show a rename or a permission change, only creations.
   */
  const activity = [
    ...people
      .filter((p) => p.role !== "student")
      .map((p) => ({
        at: p.created_at,
        what: `${p.role === "center_admin" ? "Center admin" : "Teacher"} ${p.full_name ?? "account"} joined`,
      })),
    ...((groupsRes.data ?? []) as { name: string; created_at: string }[]).map((g) => ({
      at: g.created_at,
      what: `Created the class ${g.name}`,
    })),
    ...((invitesRes.data ?? []) as { email: string; role: string; created_at: string }[]).map(
      (i) => ({
        at: i.created_at,
        what: `Invited ${i.email} as ${i.role}`,
      }),
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
    <div>
      <PageHead
        eyebrow="Admin"
        title="Settings & roles"
        subtitle="Who can see what, and how your center appears to students."
      />

      <Split ratio=".8fr 1.2fr">
        <Card style={{ alignSelf: "start" }}>
          <CardHead title="Center profile" />
          <CenterProfileForm
            name={org?.name ?? ""}
            status={org?.status ?? "unknown"}
            plan={org?.plan ?? "—"}
            contactEmail={org?.contact_email ?? null}
          />
        </Card>

        <Stack>
          <Card flush>
            <CardHead
              title="Roles"
              divided
              note="fixed by the permission model, not configurable"
            />
            {ROLES.map((r) => (
              <div key={r.name} style={{ padding: "14px 18px", borderBottom: "1px solid #F5F4F0" }}>
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
                These are enforced in the database, not in the interface — every table carries a
                policy that names them. A finer-grained role would be a schema change, not a
                setting.
              </CardNote>
            </div>
          </Card>

          <Card>
            <CardHead
              title="Subjects"
              note="what this center teaches — a class carries one, a teacher can take several"
            />
            <SubjectsManager subjects={subjects} />
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
                  borderBottom: "1px solid #F5F4F0",
                  fontFamily: SANS,
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: FAINT, width: 90, flex: "0 0 90px" }}>{when(a.at)}</span>
                <span style={{ flex: 1, minWidth: 0, color: INK }}>{a.what}</span>
              </div>
            ))}
            {activity.length === 0 ? <Empty>Nothing recorded yet.</Empty> : null}
          </Card>
        </Stack>
      </Split>
    </div>
  );
}
