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
): Promise<{ threadId: string | null; turns: StoredTurn[] }> {
  try {
    const supabase = await createClient();
    const { data: thread } = await supabase
      .from("assistant_threads")
      .select("id")
      .eq("profile_id", profile.id)
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
