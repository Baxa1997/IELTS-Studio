import { LINE, SOFT } from "@/components/console/crm-ui";
import type { Profile } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

import { TelegramPanel } from "../../groups/[id]/telegram-panel";
import { PANEL } from "@/lib/theme/tokens";

/**
 * Every class's Telegram group, in one place.
 *
 * Connecting Telegram used to live inside one group at a time, which is the
 * wrong shape for the question anybody actually has. Nobody wonders "is 9B
 * connected?" — they wonder "why did nothing get announced?", and answering
 * that meant opening every group in turn.
 *
 * Unconnected classes sort FIRST: this list exists to be acted on, so the ones
 * needing work must not sit below the fold under the ones that are fine.
 *
 * A teacher sees only their own groups — `loadGroups` scopes by role.
 */
export async function TelegramSection({ profile }: { profile: Profile }) {
  const { groups } = await loadGroups(profile);

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("telegram_links")
    .select("group_id, chat_title, verified_at");

  // A half-finished handshake is NOT connected. `notifyAssignmentTelegram`
  // requires verified_at, so anything less announces nothing — showing it as
  // linked would send somebody away satisfied with a class that hears nothing.
  const linked = new Map<string, { chatTitle: string | null; verifiedAt: string }>();
  for (const row of links ?? []) {
    if (!row.verified_at) continue;
    linked.set(row.group_id as string, {
      chatTitle: (row.chat_title as string | null) ?? null,
      verifiedAt: String(row.verified_at),
    });
  }

  const rows = [...groups].sort((a, b) => {
    const aOn = linked.has(a.id) ? 1 : 0;
    const bOn = linked.has(b.id) ? 1 : 0;
    return aOn - bOn || a.name.localeCompare(b.name);
  });
  const connected = rows.filter((g) => linked.has(g.id)).length;

  return (
    <div>
      <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.5, color: SOFT }}>
        {groups.length === 0
          ? "No classes yet."
          : `${connected} of ${groups.length} class${groups.length === 1 ? "" : "es"} connected. A class without a Telegram group still gets its homework — it just is not announced.`}
      </p>

      <div style={{ display: "grid", gap: 14, maxWidth: 760 }}>
        {rows.map((g) => (
          <section
            key={g.id}
            style={{
              background: PANEL,
              border: `1px solid ${LINE}`,
              borderRadius: 14,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650, color: "#15171C" }}>
                {g.name}
              </h3>
              <span style={{ fontSize: 13, color: SOFT }}>
                {g.memberCount} student{g.memberCount === 1 ? "" : "s"}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: linked.has(g.id) ? "#E4F0E9" : "#FBEEE0",
                  color: linked.has(g.id) ? "#2F6B4F" : "#8A5A20",
                }}
              >
                {linked.has(g.id) ? "Connected" : "Not connected"}
              </span>
            </div>

            <TelegramPanel
              key={linked.get(g.id)?.verifiedAt ?? "not-connected"}
              groupId={g.id}
              linked={linked.get(g.id) ?? null}
              botUsername={process.env.TELEGRAM_BOT_USERNAME ?? null}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
