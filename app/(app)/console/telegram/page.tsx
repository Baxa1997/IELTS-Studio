import { LINE, PageHead, SOFT } from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

import { TelegramPanel } from "../groups/[id]/telegram-panel";

export const dynamic = "force-dynamic";

/**
 * Every class's Telegram channel, in one place.
 *
 * WHY A PAGE OF ITS OWN. Connecting a channel lived inside one group at a time,
 * which is the wrong shape for the question anybody actually has. Nobody
 * wonders "is 9B connected?" — they wonder "why did nothing get announced?",
 * and answering that meant opening every group in turn and remembering what
 * each one said. A centre with twelve classes could not find out how many were
 * connected without twelve page loads.
 *
 * Unconnected classes sort FIRST, because this page exists to be acted on
 * rather than admired: the ones needing work should not be below the fold under
 * the ones that are fine.
 */
export default async function TelegramPage() {
  const { profile } = await requireOrgUser();
  const { groups } = await loadGroups(profile);

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("telegram_links")
    .select("group_id, chat_title, verified_at");

  // A half-finished handshake is NOT connected. `notifyAssignmentTelegram`
  // requires verified_at, so anything less announces nothing — and showing it
  // as linked here would send someone away satisfied with a class that will
  // still be told nothing.
  const linked = new Map<string, { chatTitle: string | null }>();
  for (const row of links ?? []) {
    if (!row.verified_at) continue;
    linked.set(row.group_id as string, { chatTitle: (row.chat_title as string | null) ?? null });
  }

  const rows = [...groups].sort((a, b) => {
    const aOn = linked.has(a.id) ? 1 : 0;
    const bOn = linked.has(b.id) ? 1 : 0;
    return aOn - bOn || a.name.localeCompare(b.name);
  });
  const connected = rows.filter((g) => linked.has(g.id)).length;

  return (
    <div>
      <PageHead
        back={{ href: "/console", label: "Dashboard" }}
        title="Telegram channels"
        subtitle={
          groups.length === 0
            ? "No classes yet."
            : `${connected} of ${groups.length} class${groups.length === 1 ? "" : "es"} connected. A class without a channel still gets its homework — it just is not announced.`
        }
      />

      <div style={{ display: "grid", gap: 14, maxWidth: 760, marginTop: 18 }}>
        {rows.map((g) => (
          <section
            key={g.id}
            style={{
              background: "#fff",
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
