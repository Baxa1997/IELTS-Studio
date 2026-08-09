import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface InboxItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
  read: boolean;
}

export interface Inbox {
  unread: number;
  items: InboxItem[];
}

/**
 * The signed-in person's own notifications. RLS returns nobody else's, so there
 * is no recipient filter here to get wrong.
 */
export async function loadInbox(limit = 12): Promise<Inbox> {
  const supabase = await createClient();

  const [{ data: items }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, href, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  return {
    unread: count ?? 0,
    items: ((items ?? []) as {
      id: string;
      type: string;
      title: string;
      body: string | null;
      href: string | null;
      read_at: string | null;
      created_at: string;
    }[]).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      href: n.href,
      createdAt: n.created_at,
      read: n.read_at != null,
    })),
  };
}
