import { NextResponse } from "next/server";

import type { RawProposal } from "@/lib/console/assistant";

import { generate } from "@/lib/ai";
import { requireOrgUser } from "@/lib/auth";
import { describeActions, loadCentreSnapshot, vetProposals } from "@/lib/console/assistant";
import { appendExchange } from "@/lib/console/assistant-thread";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION = 1200;

/**
 * POST /api/console/assistant
 *
 * The staff console's assistant. It answers from a snapshot of the caller's own
 * centre and may propose one action from a fixed list — which it cannot run.
 *
 * THE PROPOSAL IS NOT A COMMAND. Everything the model returns is filtered here
 * against the allow-list AND the caller's role before it reaches the screen, so
 * a model that invents an action id, or offers a teacher something only an
 * owner may do, produces nothing rather than a button that half-works. Running
 * it is a separate request behind a Confirm, which re-checks all of this again.
 */
export async function POST(req: Request): Promise<Response> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return fail(403, "forbidden");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "bad_request");
  }

  const question = String(body.question ?? "").trim().slice(0, MAX_QUESTION);
  if (!question) return fail(422, "empty", "Ask something first.");

  const history = Array.isArray(body.history)
    ? (body.history as { role?: unknown; content?: unknown }[])
        .slice(-6)
        .map(
          (m) =>
            `${m.role === "assistant" ? "You" : "Them"}: ${String(m.content ?? "").slice(0, 600)}`,
        )
        .join("\n")
    : "";

  const snapshot = await loadCentreSnapshot(profile);

  // Only the actions this person could actually run are described to the model.
  // Offering a teacher an owner's action and refusing it afterwards teaches
  // them the assistant is unreliable.
  const actionText = describeActions(profile.role);

  try {
    const { content } = await generate({
      kind: "console_assistant",
      spec: { question, snapshot: snapshot.text, history, actions: actionText },
      meta: { organizationId: profile.organization_id, userId: profile.id },
    });

    const parsed = parse(content);
    const proposals = vetProposals(parsed.proposals, {
      role: profile.role,
      groups: new Set(snapshot.groupIds.keys()),
      students: snapshot.studentNames,
    });

    // After the reply exists, never before: a thread showing a question with
    // no answer reads as though the assistant ignored somebody.
    await appendExchange(profile, question, parsed.reply, proposals);

    return NextResponse.json({ reply: parsed.reply, proposals }, { status: 200 });
  } catch (err) {
    console.error("[console-assistant]", err);
    return fail(502, "assistant_failed", "The assistant is busy — try again in a moment.");
  }
}

/** The model is asked for JSON and usually obliges. When it does not, its prose
 *  is still a perfectly good answer — so a parse failure degrades to "reply
 *  only" rather than to an error the person cannot act on. */
function parse(content: string): { reply: string; proposals: RawProposal[] } {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const obj = JSON.parse(content.slice(start, end + 1)) as {
        reply?: unknown;
        proposals?: unknown;
      };
      const reply = String(obj.reply ?? "").trim();
      const proposals = Array.isArray(obj.proposals)
        ? (obj.proposals as Record<string, unknown>[]).map((p) => ({
            action: String(p.action ?? ""),
            args: (p.args ?? {}) as Record<string, unknown>,
            why: String(p.why ?? ""),
          }))
        : [];
      if (reply) return { reply, proposals };
    } catch {
      /* falls through to the prose below */
    }
  }
  return { reply: content.trim(), proposals: [] };
}

function fail(status: number, code: string, message?: string): Response {
  return NextResponse.json({ error: code, message }, { status });
}
