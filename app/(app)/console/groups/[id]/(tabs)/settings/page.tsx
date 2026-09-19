import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { loadGroupDetail } from "@/lib/console/groups";
import { ENROLLED } from "@/lib/console/status";
import { phoneKey } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

import { CloseGroupButton, DeleteGroupButton } from "../../../group-forms";
import { SANS } from "@/components/console/crm-ui";
import { V2, card as v2card, serifHead } from "../../ui";
import { PANEL } from "@/lib/theme/tokens";

export const dynamic = "force-dynamic";

/**
 * Class settings: the setup checklist, and the group's lifecycle.
 *
 * The checklist is the only thing on this screen that still reads several
 * tables — the timetable, the Telegram link and every member's phone — but they
 * are three narrow queries and they are the subject of the page rather than
 * background for it. Each item links to its own focused page under
 * `settings/{section}`, so nothing here loads the panel it points at.
 */
export default async function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const group = await loadGroupDetail(id);
  if (!group) notFound();

  const isAdmin = profile.role === "center_admin";
  if (!isAdmin && group.teacherId !== profile.id) notFound();

  const roster = group.members.filter((m) => ENROLLED.includes(m.status));
  const memberIds = roster.map((m) => m.id);
  const supabase = await createClient();

  const [slotsRes, tgRes, phoneRes] = await Promise.all([
    supabase.from("lesson_slots").select("series_id, weekday").eq("group_id", group.id),
    supabase
      .from("telegram_links")
      .select("chat_title, verified_at")
      .eq("group_id", group.id)
      .maybeSingle(),
    memberIds.length > 0
      ? supabase.from("profiles").select("id, phone").in("id", memberIds)
      : Promise.resolve({ data: [] as { id: string; phone: string | null }[] }),
  ]);

  // A group can hold SEVERAL independent bookings — the same group at 08:00 and
  // again at 15:30 is two series. Counting distinct weekday rows per series is
  // what makes "3 lessons a week" true for both shapes.
  const slots = (slotsRes.data ?? []) as { series_id: string; weekday: number }[];
  const bySeries = new Map<string, Set<number>>();
  for (const row of slots) {
    const key = String(row.series_id);
    const set = bySeries.get(key) ?? new Set<number>();
    set.add(Number(row.weekday));
    bySeries.set(key, set);
  }
  const seriesCount = bySeries.size;
  const weeklyLessons = [...bySeries.values()].reduce((n, days) => n + days.size, 0);

  const telegramLinked =
    tgRes.data?.verified_at != null
      ? {
          chatTitle: (tgRes.data.chat_title as string | null) ?? null,
          verifiedAt: String(tgRes.data.verified_at),
        }
      : null;

  // THE CLASS INVITE MATCHES A STUDENT BY PHONE. A roster with blanks in it is
  // the single reason that flow fails, and a teacher should learn it before
  // sending thirty students a message that cannot work for some of them —
  // not afterwards, from the ones who complain. Counted with `phoneKey`, the
  // same function the bot matches on, so this cannot claim a number is usable
  // when the matcher would reject it.
  const withPhone = ((phoneRes.data ?? []) as { id: string; phone: string | null }[]).filter(
    (r) => phoneKey(r.phone) != null,
  ).length;

  const canInviteClass = telegramLinked != null && roster.length > 0 && withPhone >= roster.length;
  const setupItems: SetupChecklistItem[] = [
    ...(isAdmin
      ? [
          {
            title: "Teacher assigned",
            description: "Choose who is responsible for this group and its homework.",
            status: group.teacherId ? "Assigned" : "Needs setup",
            action: group.teacherId ? "Change" : "Assign teacher",
            href: `/console/groups/${id}/settings/teacher`,
            done: group.teacherId != null,
          },
        ]
      : []),
    {
      title: "Schedule added",
      description: "Set the days and times this group meets.",
      status:
        seriesCount > 0
          ? `${weeklyLessons} lesson${weeklyLessons === 1 ? "" : "s"} a week`
          : "Needs setup",
      action: seriesCount > 0 ? "Change schedule" : "Add schedule",
      href: `/console/groups/${id}/settings/schedule`,
      done: seriesCount > 0,
    },
    {
      title: "Telegram group connected",
      description: "Send homework announcements and private sign-in links to the class group.",
      status: telegramLinked ? "Connected" : "Needs setup",
      action: telegramLinked ? "Manage group" : "Connect group",
      href: `/console/groups/${id}/settings/telegram`,
      done: telegramLinked != null,
    },
    {
      title: "Students ready",
      description:
        roster.length === 0
          ? "Add the roster before inviting students to sign in."
          : "Every student needs a phone number so Telegram can match their login.",
      status: canInviteClass
        ? `${roster.length} student${roster.length === 1 ? "" : "s"} ready`
        : roster.length > 0
          ? `${withPhone}/${roster.length} phones ready`
          : "Needs setup",
      action: canInviteClass
        ? "Manage students"
        : roster.length > 0
          ? "Complete access"
          : "Add students",
      // The roster is the index route now, not `?tab=students`.
      href: `/console/groups/${id}`,
      done: canInviteClass,
    },
  ];

  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 18 }}>
      <SetupChecklist items={setupItems} />
      {isAdmin ? (
        <section
          style={{
            ...v2card,
            background: "#fdfbf8",
            borderColor: "#e9d9d3",
            padding: "18px 22px",
            display: "grid",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: V2.ink }}>
              Group lifecycle
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: "#8b7f7a", marginTop: 2 }}>
              Close a finished class to keep its history. Delete only a group created by mistake.
            </div>
          </div>
          <CloseGroupButton groupId={group.id} status={group.status} />
          <DeleteGroupButton groupId={group.id} />
        </section>
      ) : null}
    </div>
  );
}

type SetupChecklistItem = {
  title: string;
  description: string;
  status: string;
  action: string;
  href: string;
  done: boolean;
};

function SetupChecklist({ items }: { items: SetupChecklistItem[] }) {
  const completed = items.filter((item) => item.done).length;
  const complete = completed === items.length;

  return (
    <section style={{ ...v2card, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          padding: "20px 22px 17px",
          borderBottom: `1px solid ${V2.rule}`,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 240, flex: "1 1 380px" }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: V2.indigo,
            }}
          >
            Class setup
          </div>
          <h2 style={{ ...serifHead, fontSize: 24, marginTop: 5 }}>
            {complete ? "Class setup is complete" : "Finish setting up this class"}
          </h2>
          <p style={{ margin: "5px 0 0", fontFamily: SANS, fontSize: 13, color: V2.muted }}>
            {complete
              ? "Everything is ready. You can change any setup item whenever the class changes."
              : "Complete these steps so the class can receive homework and sign in."}
          </p>
        </div>
        <div style={{ minWidth: 190, flex: "0 0 210px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              fontFamily: SANS,
              fontSize: 12.5,
              color: V2.muted,
            }}
          >
            <span>Setup progress</span>
            <strong style={{ color: V2.ink }}>
              {completed}/{items.length}
            </strong>
          </div>
          <div
            style={{
              height: 8,
              marginTop: 8,
              borderRadius: 999,
              background: V2.indigoTint,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(completed / items.length) * 100}%`,
                borderRadius: 999,
                background: V2.indigo,
              }}
            />
          </div>
        </div>
      </div>

      <div>
        {items.map((item) => (
          <div
            key={item.title}
            className="cn-setup-row"
            style={{
              display: "grid",
              gridTemplateColumns: "44px minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 14,
              padding: "15px 22px",
              borderBottom: `1px solid ${V2.rule}`,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                display: "grid",
                placeItems: "center",
                background: item.done ? V2.greenWash : "#f4f3ee",
                color: item.done ? V2.green : V2.muted,
                fontFamily: SANS,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {item.done ? "✓" : "○"}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 9,
                  flexWrap: "wrap",
                  fontFamily: SANS,
                }}
              >
                <strong style={{ color: V2.ink, fontSize: 15 }}>{item.title}</strong>
                <span
                  style={{
                    color: item.done ? V2.green : V2.amber,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {item.status}
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontFamily: SANS, fontSize: 12.5, color: V2.faint }}>
                {item.description}
              </p>
            </div>
            <Link
              href={item.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                border: `1px solid ${item.done ? V2.field : V2.ink}`,
                borderRadius: 9,
                background: PANEL,
                padding: "9px 13px",
                color: item.done ? V2.ink : V2.ink,
                fontFamily: SANS,
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {item.action} <span aria-hidden>→</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/** One group: its roster, practice, progress and settings. RLS decides
 *  visibility — a teacher who doesn't own this group can't read its
 *  membership, so it 404s. */
