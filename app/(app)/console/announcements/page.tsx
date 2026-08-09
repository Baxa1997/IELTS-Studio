import { redirect } from "next/navigation";

import {
  Bar,
  Card,
  CardHead,
  Empty,
  FAINT,
  GREEN,
  Kpi,
  KpiRow,
  PageHead,
  SANS,
  SOFT,
  Split,
  Tag,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

import { AnnouncementComposer } from "./composer";

export const dynamic = "force-dynamic";

const AUDIENCE_LABEL: Record<string, string> = {
  everyone: "Everyone",
  students: "All students",
  teachers: "All teachers",
  group: "One class",
};

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/**
 * Announcements: write once, reaches the center in the app.
 *
 * "Read" is a real figure, not an open-rate guess — each announcement fans out
 * into `notifications`, and a row there carries `read_at` the moment the person
 * opens it.
 */
export default async function AnnouncementsPage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");
  if (profile.role !== "center_admin") redirect("/console");

  const supabase = await createClient();
  const [sentRes, peopleRes, { groups }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, subject, body, audience, recipients, sent_at")
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("id, role"),
    loadGroups(profile),
  ]);

  const people = peopleRes.data ?? [];
  const counts = {
    students: people.filter((p) => p.role === "student").length,
    teachers: people.filter((p) => p.role === "teacher").length,
    everyone: people.filter((p) => p.role === "student" || p.role === "teacher").length,
  };

  const sent = (sentRes.data ?? []) as {
    id: string;
    subject: string;
    body: string;
    audience: string;
    recipients: number;
    sent_at: string;
  }[];

  // How many of each announcement's notifications have actually been opened.
  // One query for the lot, keyed by title — announcements fan out with the
  // subject as the notification title.
  const readShare = new Map<string, number>();
  if (sent.length > 0) {
    const { data: notes } = await supabase
      .from("notifications")
      .select("title, read_at")
      .eq("type", "announcement")
      .in(
        "title",
        sent.map((s) => s.subject),
      );
    const tally = new Map<string, { total: number; read: number }>();
    for (const n of (notes ?? []) as { title: string; read_at: string | null }[]) {
      const t = tally.get(n.title) ?? { total: 0, read: 0 };
      t.total += 1;
      if (n.read_at) t.read += 1;
      tally.set(n.title, t);
    }
    for (const [title, t] of tally) {
      readShare.set(title, t.total > 0 ? Math.round((t.read / t.total) * 100) : 0);
    }
  }

  const totalReach = sent.reduce((n, s) => n + s.recipients, 0);

  return (
    <div>
      <PageHead
        eyebrow="Communication"
        title="Announcements"
        subtitle="Reaches students and teachers in the app, where every account can be reached."
      />

      <KpiRow>
        <Kpi label="Sent" value={sent.length} sub="last 50 shown" />
        <Kpi label="People reached" value={totalReach.toLocaleString()} sub="across all sends" />
        <Kpi label="Students" value={counts.students} sub="on the roll" />
        <Kpi label="Teachers" value={counts.teachers} sub="on staff" />
      </KpiRow>

      <Split ratio=".9fr 1.1fr">
        <Card style={{ alignSelf: "start" }}>
          <CardHead title="New announcement" />
          <AnnouncementComposer
            counts={counts}
            groups={groups.map((g) => ({ id: g.id, name: g.name, students: g.memberCount }))}
          />
        </Card>

        <Card flush>
          <CardHead title="Sent" divided note="read share is measured, not estimated" />
          {sent.map((a) => {
            const read = readShare.get(a.subject);
            return (
              <div
                key={a.id}
                className="cn-row"
                style={{ padding: "14px 18px", borderBottom: "1px solid #F5F4F0" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 500 }}>
                    {a.subject}
                  </div>
                  <Tag tone="indigo">{AUDIENCE_LABEL[a.audience] ?? a.audience}</Tag>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: SANS,
                      fontSize: 11.5,
                      color: FAINT,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dateFmt(a.sent_at)}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 12.5,
                    color: SOFT,
                    margin: "6px 0 9px",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {a.body}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Bar pct={read ?? 0} fill={GREEN} />
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 11.5,
                      color: SOFT,
                      whiteSpace: "nowrap",
                      flex: "none",
                    }}
                  >
                    {read == null ? "—" : `${read}% read`} · {a.recipients} sent
                  </span>
                </div>
              </div>
            );
          })}
          {sent.length === 0 ? (
            <Empty>Nothing sent yet. Whatever you write appears here with its read share.</Empty>
          ) : null}
        </Card>
      </Split>
    </div>
  );
}
