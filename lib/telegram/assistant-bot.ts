import "server-only";

import { generate } from "@/lib/ai";
import type { Profile } from "@/lib/auth";
import {
  describeActions,
  describeDocuments,
  loadCentreSnapshot,
  vetDocuments,
  vetProposals,
} from "@/lib/console/assistant";
import { appendExchange } from "@/lib/console/assistant-thread";
import { serverEnv } from "@/lib/env";
import { escapeHtml, sendMessage } from "@/lib/telegram/send";

/**
 * The console assistant, answering from a phone.
 *
 * ONE BRAIN, TWO SURFACES. This deliberately reuses the same snapshot, the same
 * prompt, the same allow-list and the same `vetProposals` as the web chat —
 * because two assistants with two rule sets is two things to keep in step, and
 * the one nobody looks at is the one that drifts. The only thing that differs
 * is how a proposal is drawn: a card in a browser, an inline keyboard here.
 *
 * NOTHING IS TRUSTED FROM THE CHAT. The profile arrives already re-read from
 * the database by `staffForChat` — role, organisation and org status included —
 * and every proposal is re-checked again when the button is pressed.
 */
export async function answerOnTelegram(profile: Profile, chatId: number, question: string) {
  const snapshot = await loadCentreSnapshot(profile);

  const { content } = await generate({
    kind: "console_assistant",
    spec: {
      question,
      snapshot: snapshot.text,
      history: "",
      actions: describeActions(profile.role),
      documents: describeDocuments(profile.role),
    },
    meta: { organizationId: profile.organization_id, userId: profile.id },
  });

  const parsed = parse(content);
  const vetCtx = {
    role: profile.role,
    groups: new Set(snapshot.groupIds.keys()),
    students: snapshot.studentNames,
  };
  const proposals = vetProposals(parsed.proposals, vetCtx);
  const documents = vetDocuments(parsed.documents, {
    ...vetCtx,
    studentIds: snapshot.studentIds,
  });

  await appendExchange(profile, question, parsed.reply, proposals);

  /* ⭐ WHY TELEGRAM READS BUT DOES NOT WRITE.
   *
   * Running an action needs `runProposal`, and `runProposal`'s protection is
   * the RLS client: a teacher resolving a class name sees only classes they
   * own, because Postgres says so. There is no session behind a webhook, so
   * doing it here would mean service-role plus a hand-written copy of that
   * scoping — a second authorisation path, weaker than the real one, kept in
   * step by memory alone. That is exactly the drift that shipped this morning,
   * when five actions were stricter here than the product itself.
   *
   * So a proposal becomes a LINK. The phone is where you ask and decide; the
   * console is where the write happens, under the rules that already exist.
   * It costs one tap and buys one enforcement boundary instead of two.
   */
  const assistantUrl = `${serverEnv.outboundSiteUrl}/console/assistant`;
  const lines = [escapeHtml(parsed.reply)];

  if (proposals.length > 0) {
    const p = proposals[0];
    lines.push(
      "",
      `<b>${escapeHtml(p.verb)}</b> — ${escapeHtml(Object.values(p.args).join(" · "))}`,
      `<a href="${assistantUrl}">Confirm it in the console →</a>`,
    );
  }

  // A document is a link for the same reason: the export routes authenticate a
  // browser session, and re-fetching them with service-role to re-send the
  // bytes would be building that second weak path for files instead of writes.
  for (const d of documents) {
    lines.push(
      "",
      `<a href="${serverEnv.outboundSiteUrl}${d.href}">⬇️ ${escapeHtml(d.verb)} — ${escapeHtml(d.label)}</a>`,
    );
  }

  await sendMessage(chatId, lines.join("\n"));
}

function parse(content: string): {
  reply: string;
  proposals: { action: string; args: Record<string, unknown>; why: string }[];
  documents: { doc: string; args: Record<string, unknown> }[];
} {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const obj = JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>;
      const reply = String(obj.reply ?? "").trim();
      if (reply) {
        return {
          reply,
          proposals: Array.isArray(obj.proposals)
            ? (obj.proposals as Record<string, unknown>[]).map((p) => ({
                action: String(p.action ?? ""),
                args: (p.args ?? {}) as Record<string, unknown>,
                why: String(p.why ?? ""),
              }))
            : [],
          documents: Array.isArray(obj.documents)
            ? (obj.documents as Record<string, unknown>[]).map((d) => ({
                doc: String(d.doc ?? ""),
                args: (d.args ?? {}) as Record<string, unknown>,
              }))
            : [],
        };
      }
    } catch {
      /* prose is still a good answer */
    }
  }
  return { reply: content.trim(), proposals: [], documents: [] };
}
