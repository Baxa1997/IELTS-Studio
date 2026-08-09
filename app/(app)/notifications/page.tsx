import Link from "next/link";

import {
  EmptyRow,
  FAINT,
  INK,
  LINE,
  List,
  MUTED,
  PageHead,
  Panel,
  SANS,
  TINT,
} from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadInbox } from "@/lib/notifications/load";

import { markRead } from "./actions";

export const dynamic = "force-dynamic";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Everything the app has told this person, newest first. */
export default async function NotificationsPage() {
  await requireOrgUser();
  const inbox = await loadInbox(60);

  return (
    <div>
      <PageHead
        eyebrow="Notifications"
        title="What's happened"
        subtitle={
          inbox.unread > 0
            ? `${inbox.unread} unread`
            : "Homework, marked work, and anything that needs you."
        }
      />

      <Panel
        title="All notifications"
        actions={
          inbox.unread > 0 ? (
            <form action={markRead}>
              <button
                type="submit"
                style={{
                  border: `1px solid ${LINE}`,
                  background: "#fff",
                  color: MUTED,
                  borderRadius: 9,
                  padding: "6px 12px",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            </form>
          ) : null
        }
      >
        <List>
          {inbox.items.map((n, i) => (
            <li
              key={n.id}
              style={{
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                padding: "12px 10px",
                margin: "0 -10px",
                background: n.read ? "transparent" : TINT,
                borderRadius: n.read ? 0 : 10,
                fontFamily: SANS,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 14.5,
                      fontWeight: n.read ? 500 : 700,
                      color: INK,
                    }}
                  >
                    {n.title}
                  </span>
                  {n.body ? (
                    <span style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 3 }}>
                      {n.body}
                    </span>
                  ) : null}
                  <span style={{ display: "block", fontSize: 12, color: FAINT, marginTop: 4 }}>
                    {dateFmt(n.createdAt)}
                  </span>
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#3B43B5",
                        textDecoration: "none",
                      }}
                    >
                      Open →
                    </Link>
                  ) : null}
                  {!n.read ? (
                    <form action={markRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        type="submit"
                        style={{
                          border: "none",
                          background: "none",
                          color: FAINT,
                          fontFamily: SANS,
                          fontSize: 12.5,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Mark read
                      </button>
                    </form>
                  ) : null}
                </span>
              </div>
            </li>
          ))}
          {inbox.items.length === 0 ? (
            <EmptyRow>
              Nothing yet. When a teacher sets homework or an essay comes back, it lands here.
            </EmptyRow>
          ) : null}
        </List>
      </Panel>
    </div>
  );
}
