import "server-only";

import type { Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import type { VettedProposal } from "./assistant";

export interface StoredTurn {
  role: "user" | "assistant";
  content: string;
  proposals?: VettedProposal[];
}

/** Enough to keep the thread useful without loading a term of chat into a page
 *  render. The model is only ever shown the last few turns anyway. */
const WINDOW = 60;

/**
 * The person's current conversation.
 *
 * EVERY FUNCTION HERE FAILS SOFT. The migration that creates these tables ships
 * with the code but is applied by hand, so between deploy and migration the
 * tables do not exist — and an assistant that 500s because it cannot save is
 * strictly worse than one that forgets. A missing table costs the history and
 * nothing else; the chat still answers, still proposes, still acts.
 */
export async function loadThread(
  profile: Profile,
  /** A specific thread from the history rail. Falls back to the newest — and
   *  falls back SILENTLY for an id that is not theirs, because RLS returns no
   *  row for somebody else's thread and a 404 would confirm it exists. */
  wanted?: string,
): Promise<{ threadId: string | null; turns: StoredTurn[] }> {
  try {
    const supabase = await createClient();
    let query = supabase.from("assistant_threads").select("id").eq("profile_id", profile.id);
    if (wanted) query = query.eq("id", wanted);
    const { data: thread } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!thread) return { threadId: null, turns: [] };

    const { data: rows } = await supabase
      .from("assistant_messages")
      .select("role, content, proposals")
      .eq("thread_id", thread.id as string)
      .order("created_at", { ascending: true })
      .limit(WINDOW);

    return {
      threadId: thread.id as string,
      turns: ((rows ?? []) as { role: string; content: string; proposals: unknown }[]).map((r) => ({
        role: r.role === "assistant" ? "assistant" : "user",
        content: r.content,
        proposals: (r.proposals as VettedProposal[] | null) ?? undefined,
      })),
    };
  } catch {
    return { threadId: null, turns: [] };
  }
}

/**
 * Append one exchange, opening a thread if there isn't one.
 *
 * Called from the API route after the reply is known, so a model call that
 * fails leaves nothing behind — a thread showing a question with no answer
 * reads as though the assistant ignored somebody.
 */
export async function appendExchange(
  profile: Profile,
  question: string,
  reply: string,
  proposals: VettedProposal[],
): Promise<void> {
  try {
    const supabase = await createClient();
    let threadId: string | null = null;

    const { data: existing } = await supabase
      .from("assistant_threads")
      .select("id")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    threadId = (existing?.id as string | undefined) ?? null;

    if (!threadId) {
      const { data: made } = await supabase
        .from("assistant_threads")
        .insert({ organization_id: profile.organization_id, profile_id: profile.id })
        .select("id")
        .single();
      threadId = (made?.id as string | undefined) ?? null;
    }
    if (!threadId) return;

    await supabase.from("assistant_messages").insert([
      {
        thread_id: threadId,
        organization_id: profile.organization_id,
        profile_id: profile.id,
        role: "user",
        content: question.slice(0, 4000),
      },
      {
        thread_id: threadId,
        organization_id: profile.organization_id,
        profile_id: profile.id,
        role: "assistant",
        content: reply.slice(0, 8000),
        proposals: proposals.length > 0 ? proposals : null,
      },
    ]);
  } catch {
    /* history is a convenience; never let it cost somebody their answer */
  }
}

/** Start a fresh thread. The old one is kept — "New chat" means "put that
 *  aside", not "destroy the record of what I asked". */
export async function startNewThread(profile: Profile): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("assistant_threads")
      .insert({ organization_id: profile.organization_id, profile_id: profile.id })
      .select("id");
  } catch {
    /* nothing to start; the chat simply keeps the thread it had */
  }
}

export interface ThreadSummary {
  id: string;
  /** The first thing they asked, which is what the conversation is about. */
  title: string;
  when: string;
  /** Whether this thread ended with something waiting to be pressed. */
  tag: "Proposal" | "Report";
}

/**
 * The history rail.
 *
 * Titled by the FIRST question, not the last: a thread is remembered as the
 * thing you went in to do, and the last message is usually the assistant's
 * answer rather than anything you would recognise.
 */
export async function listThreads(profile: Profile, limit = 20): Promise<ThreadSummary[]> {
  try {
    const supabase = await createClient();
    const { data: threads } = await supabase
      .from("assistant_threads")
      .select("id, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    const ids = (threads ?? []).map((t) => t.id as string);
    if (ids.length === 0) return [];

    const { data: rows } = await supabase
      .from("assistant_messages")
      .select("thread_id, role, content, proposals, created_at")
      .in("thread_id", ids)
      .order("created_at", { ascending: true });

    const first = new Map<string, string>();
    const open = new Set<string>();
    for (const m of (rows ?? []) as {
      thread_id: string;
      role: string;
      content: string;
      proposals: unknown;
    }[]) {
      if (m.role === "user" && !first.has(m.thread_id)) {
        first.set(m.thread_id, m.content);
      }
      if (m.role === "assistant") {
        // Last one wins: a thread is "open" only if the MOST RECENT answer
        // still has a button nobody has dealt with.
        if (Array.isArray(m.proposals) && m.proposals.length > 0) open.add(m.thread_id);
        else open.delete(m.thread_id);
      }
    }

    return (threads ?? [])
      .map((t) => {
        const id = t.id as string;
        const title = first.get(id);
        return {
          id,
          title: title ? title.split("\n")[0].slice(0, 70) : "Empty chat",
          when: t.created_at as string,
          tag: (open.has(id) ? "Proposal" : "Report") as "Proposal" | "Report",
          started: t.created_at as string,
          empty: !title,
        };
      })
      // An empty thread is one somebody opened with New chat and never used.
      // It is not history; it is the page they are looking at.
      .filter((t) => !t.empty)
      .map(({ id, title, when, tag }) => ({ id, title, when, tag }));
  } catch {
    return [];
  }
}
