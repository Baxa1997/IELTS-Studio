import { redirect } from "next/navigation";

import { Card, Empty, PageHead } from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadAutoMessageSettings } from "@/lib/console/auto-message-service";
import { AUTO_MESSAGES, type AutoMessageSetting } from "@/lib/console/auto-messages";
import { loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

import { AnnouncementComposer } from "./composer";
import { AutomaticMessages } from "./automatic";
import { SentPanel, type SentRow, type TelegramClass } from "./sent-panel";
import { AnnouncementTabs } from "./tabs";

export const dynamic = "force-dynamic";

/**
 * Announcements: write on the left, see what you sent on the right.
 *
 * THE PAGE DOES NOT SCROLL, AND THAT IS THE POINT. Composing is a two-pane job
 * — write the message, glance at who it reached last time — and a page that
 * scrolls means the composer slides off screen while you read the history, so
 * you lose your place in your own message. The two columns are pinned to the
 * viewport and each scrolls INSIDE itself, so the compose box is always where
 * you left it.
 *
 * The KPI row that used to sit above them is gone. Four boxes counting students
 * and teachers told you nothing you could act on while writing to them, and
 * they were what pushed the composer below the fold in the first place; the two
 * numbers worth having (how many this reaches, how many read the last one) now
 * sit on the controls they belong to.
 */
export default async function AnnouncementsPage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  // A teacher is the only person who can set a group's homework and the one who
  // connects its Telegram channel, so shutting them out of telling the group
  // about it made no sense. They get the page scoped to their own groups;
  // center-wide audiences stay the owner's (see migration 20260812130000).
  const isAdmin = profile.role === "center_admin";

  const supabase = await createClient();
  const [sentRes, peopleRes, { groups }, linksRes] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, subject, body, audience, recipients, sent_at")
      .order("sent_at", { ascending: false })
      .limit(50),
    // Only the owner needs the center-wide headcounts; a teacher's audience is
    // always one of their own classes.
    isAdmin
      ? supabase.from("profiles").select("id, role")
      : Promise.resolve({ data: [] as { id: string; role: string }[] }),
    loadGroups(profile),
    supabase.from("telegram_links").select("group_id, chat_title, verified_at"),
  ]);

  // §12's automatic set. Loaded for everyone who can see the page — a teacher
  // reads which messages their students receive without being able to change
  // them, because "did they get told?" is a question a teacher has to answer.
  const autoSettings = await loadAutoMessageSettings();
  const autoRecord: Record<string, AutoMessageSetting> = Object.fromEntries(autoSettings);
  const autoOn = AUTO_MESSAGES.filter((spec) => {
    const setting = autoSettings.get(spec.key);
    return (setting ? setting.enabled : spec.onByDefault) && !spec.notWiredYet;
  }).length;

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

  const rows: SentRow[] = sent.map((a) => ({
    id: a.id,
    subject: a.subject,
    body: a.body,
    audience: a.audience,
    recipients: a.recipients,
    sentAt: a.sent_at,
    readPct: readShare.get(a.subject) ?? null,
  }));

  // Only a VERIFIED link is a channel. A half-finished handshake has no chat to
  // post to, and showing it as connected is how a center believes it announced
  // something it did not.
  const linked = new Map(
    ((linksRes.data ?? []) as Record<string, unknown>[])
      .filter((l) => l.verified_at != null)
      .map((l) => [l.group_id as string, (l.chat_title as string | null) ?? "Channel"]),
  );
  const telegramClasses: TelegramClass[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    students: g.memberCount,
    channel: linked.get(g.id) ?? null,
  }));

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        // The console shell's own chrome: a ~54px top bar plus the page's
        // 26px/60px padding. Pinning to the viewport is what stops the page
        // scrolling; each column below handles its own overflow.
        height: "calc(100dvh - 150px)",
        minHeight: 480,
      }}
    >
      <PageHead
        eyebrow="Communication"
        title="Announcements"
        subtitle={
          isAdmin
            ? "Reaches every account in the app; post it to a group Telegram channel too, where the parents are."
            : "Write to one of your groups. It reaches them in the app, and in the group Telegram channel if one is connected."
        }
      />

      <AnnouncementTabs
        automaticCount={autoOn}
        automatic={<AutomaticMessages settings={autoRecord} canEdit={isAdmin} />}
        broadcast={
      <div
        className="cn-split"
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "minmax(320px, .85fr) 1.15fr",
          gap: 16,
        }}
      >
        <Card style={{ overflowY: "auto", minHeight: 0 }}>
          <AnnouncementComposer
            canAnnounceCenterWide={isAdmin}
            counts={counts}
            groups={groups.map((g) => ({
              id: g.id,
              name: g.name,
              students: g.memberCount,
              hasChannel: linked.has(g.id),
            }))}
            // Only groups with a VERIFIED channel — the composer lists these
            // by name so the sender picks the destinations rather than
            // trusting "all of them".
            channels={telegramClasses
              .filter((c) => c.channel)
              .map((c) => ({ groupId: c.id, groupName: c.name, chatTitle: c.channel! }))}
          />
        </Card>

        {groups.length === 0 && rows.length === 0 ? (
          <Card style={{ minHeight: 0 }}>
            <Empty>Nothing sent yet. Whatever you write appears here with its read share.</Empty>
          </Card>
        ) : (
          <SentPanel rows={rows} classes={telegramClasses} botUsername={botUsername} />
        )}
      </div>
        }
      />
    </div>
  );
}
