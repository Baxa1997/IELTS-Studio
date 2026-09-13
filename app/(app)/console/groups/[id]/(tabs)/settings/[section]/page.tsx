import { notFound, redirect } from "next/navigation";

import { SANS, TextLink } from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroupDetail, loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

import { AssignTeacherForm } from "../../../../group-forms";
import { SchedulePanel, type ScheduleSeries } from "../../../schedule-panel";
import { TelegramPanel } from "../../../telegram-panel";
import { SectionCard, V2 } from "../../../ui";

export const dynamic = "force-dynamic";

const SECTIONS = ["schedule", "telegram", "teacher"] as const;
type Section = (typeof SECTIONS)[number];

/**
 * A focused settings page. The checklist is the overview; each action opens
 * one task at the top of its own page so a teacher never has to hunt through
 * the full settings screen or be dropped halfway down a long document.
 */
export default async function GroupSettingPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id, section: rawSection } = await params;
  if (!(SECTIONS as readonly string[]).includes(rawSection)) {
    redirect(`/console/groups/${id}/settings`);
  }
  const section = rawSection as Section;

  const group = await loadGroupDetail(id);
  if (!group) notFound();

  const isAdmin = profile.role === "center_admin";
  if (!isAdmin && group.teacherId !== profile.id) notFound();
  if (section === "teacher" && !isAdmin) notFound();

  const supabase = await createClient();
  const back = `/console/groups/${id}/settings`;

  if (section === "teacher") {
    const { teachers } = await loadGroups(profile);
    return (
      <SettingPageFrame
        back={back}
        title="Teacher"
        subtitle={`Assign the teacher responsible for ${group.name} and its homework.`}
      >
        <SectionCard
          title="Teacher"
          note="Only the assigned teacher can set homework for this group."
        >
          <AssignTeacherForm groupId={group.id} teacherId={group.teacherId} teachers={teachers} />
        </SectionCard>
      </SettingPageFrame>
    );
  }

  if (section === "telegram") {
    const { data: tgRow } = await supabase
      .from("telegram_links")
      .select("chat_title, verified_at")
      .eq("group_id", group.id)
      .maybeSingle();
    const linked =
      tgRow?.verified_at != null
        ? {
            chatTitle: (tgRow.chat_title as string | null) ?? null,
            verifiedAt: String(tgRow.verified_at),
          }
        : null;

    return (
      <SettingPageFrame
        back={back}
        title="Telegram group"
        subtitle="Connect the Telegram group where homework announcements and private sign-in links are sent."
      >
        <SectionCard
          title="Telegram group"
          note="One Telegram group belongs to this class. You can change or disconnect it at any time."
          aside={
            <span
              style={{
                padding: "5px 11px",
                borderRadius: 999,
                background: linked ? V2.greenWash : "#f4f3ee",
                color: linked ? V2.green : V2.muted,
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {linked ? "Connected" : "Not connected"}
            </span>
          }
        >
          <TelegramPanel
            key={linked?.verifiedAt ?? "not-connected"}
            groupId={group.id}
            linked={linked}
            botUsername={process.env.TELEGRAM_BOT_USERNAME ?? null}
          />
        </SectionCard>
      </SettingPageFrame>
    );
  }

  const [{ data: groupRow }, { data: slotRows }, { rooms }] = await Promise.all([
    supabase.from("groups").select("branch_id").eq("id", group.id).maybeSingle(),
    supabase
      .from("lesson_slots")
      .select("series_id, weekday, starts_at, ends_at, room_id")
      .eq("group_id", group.id),
    loadGroups(profile, { include: "all" }),
  ]);

  const seriesMap = new Map<string, ScheduleSeries>();
  for (const row of (slotRows ?? []) as Record<string, unknown>[]) {
    const key = String(row.series_id);
    const entry = seriesMap.get(key) ?? {
      seriesId: key,
      weekdays: [],
      startsAt: String(row.starts_at).slice(0, 5),
      endsAt: String(row.ends_at).slice(0, 5),
      roomId: (row.room_id as string | null) ?? null,
    };
    entry.weekdays.push(Number(row.weekday));
    seriesMap.set(key, entry);
  }
  const series = [...seriesMap.values()]
    .map((item) => ({ ...item, weekdays: [...new Set(item.weekdays)].sort() }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const weeklyLessons = series.reduce((total, item) => total + item.weekdays.length, 0);

  return (
    <SettingPageFrame
      back={back}
      title="Schedule"
      subtitle="Choose when this group meets. The schedule powers the timetable, attendance, and billing."
    >
      <SectionCard
        title="Schedule"
        note="Add one or more times for this group. Existing times can be changed without affecting attendance history."
        aside={
          weeklyLessons > 0 ? (
            <span style={{ fontFamily: SANS, fontSize: 13, color: V2.faint }}>
              {weeklyLessons} lesson{weeklyLessons === 1 ? "" : "s"} a week
            </span>
          ) : null
        }
      >
        <SchedulePanel
          groupId={group.id}
          rooms={rooms}
          branchId={(groupRow?.branch_id as string) ?? ""}
          series={series}
        />
      </SectionCard>
    </SettingPageFrame>
  );
}

function SettingPageFrame({
  back,
  title,
  subtitle,
  children,
}: {
  back: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  /* NO `PageHead` HERE ANY MORE. The tabs layout already draws the group's name
     and the tab strip directly above this, so a second page header repeated the
     class name and pushed the one panel this page exists for below the fold.
     What is left is the part that was doing real work: a way back to the
     checklist, and a title for the task. */
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 14 }}>
        <TextLink href={back}>← Class settings</TextLink>
        <h2
          style={{
            fontFamily: SANS,
            fontSize: 21,
            fontWeight: 700,
            margin: "10px 0 4px",
          }}
        >
          {title}
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: "#7b7f8a", margin: 0 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
