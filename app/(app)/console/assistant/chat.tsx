"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { runProposal, type RunState } from "./actions";

const INK = "#16203a";
const BODY = "#545c70";
const FAINT = "#6f7788";
const LINE = "#e6e4da";
const FIELD = "#e2e0d6";
const INDIGO = "#4f46e5";

export interface Proposal {
  action: string;
  verb: string;
  why: string;
  args: { group: string };
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  proposals?: Proposal[];
}

/**
 * The centre assistant's conversation.
 *
 * IT ASKS, IT DOES NOT ACT. A reply may carry one proposal, which renders as a
 * card naming exactly what will happen and a button. Until that button is
 * pressed nothing has changed, and pressing it runs a server action that
 * re-checks the whole thing from the session up — see `runProposal`.
 */
export function AssistantChat({ suggestions }: { suggestions: string[] }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setError(null);
    setDraft("");
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { role: "user", content: text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/console/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, history }),
      });
      const data = (await res.json()) as {
        reply?: string;
        proposals?: Proposal[];
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "That didn't work. Try again.");
        return;
      }
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? "", proposals: data.proposals ?? [] },
      ]);
    } catch {
      setError("Couldn't reach the assistant. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: "#fff",
          border: `1px solid ${LINE}`,
          borderRadius: 18,
          padding: turns.length === 0 ? 0 : "20px 22px",
          minHeight: 260,
        }}
      >
        {turns.length === 0 ? (
          <div style={{ padding: "34px 22px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: INK }}>
              Ask about your centre.
            </p>
            <p style={{ margin: "0 0 18px", fontSize: 13.5, color: FAINT, lineHeight: 1.6 }}>
              It reads your classes, rosters and marking queue — only what your account can
              already see. It never changes anything without showing you the button first.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void ask(s)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 999,
                    border: `1px solid ${FIELD}`,
                    background: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    color: BODY,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {turns.map((t, i) => (
              <Bubble key={i} turn={t} />
            ))}
            {busy ? (
              <div style={{ fontSize: 13.5, color: FAINT }}>Reading your centre…</div>
            ) : null}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {error ? <p style={{ margin: 0, fontSize: 13, color: "#a13a2c" }}>{error}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(draft);
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Which classes can't collect their logins yet?"
          aria-label="Ask the assistant"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "12px 16px",
            borderRadius: 999,
            border: `1px solid ${FIELD}`,
            background: "#fff",
            fontSize: 14,
            color: INK,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={busy || draft.trim().length === 0}
          style={{
            padding: "12px 22px",
            borderRadius: 999,
            border: 0,
            background: INDIGO,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            opacity: busy || draft.trim().length === 0 ? 0.5 : 1,
          }}
        >
          Ask
        </button>
      </form>
    </div>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  if (turn.role === "user") {
    return (
      <div style={{ alignSelf: "flex-end", maxWidth: "82%" }}>
        <div
          style={{
            background: "#eeecff",
            color: INK,
            borderRadius: "16px 16px 4px 16px",
            padding: "11px 15px",
            fontSize: 14.5,
            lineHeight: 1.55,
          }}
        >
          {turn.content}
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: "88%" }}>
      <div style={{ fontSize: 14.5, lineHeight: 1.65, color: BODY, whiteSpace: "pre-wrap" }}>
        {turn.content}
      </div>
      {(turn.proposals ?? []).map((p) => (
        <ProposalCard key={p.action + p.args.group} proposal={p} />
      ))}
    </div>
  );
}

/** What it would do, and the button that does it. Never runs on render. */
function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [state, action, pending] = useActionState(runProposal, {} as RunState);

  return (
    <form
      action={action}
      style={{
        marginTop: 12,
        border: `1px solid ${FIELD}`,
        borderRadius: 14,
        background: "#faf9f5",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <input type="hidden" name="action" value={proposal.action} />
      <input type="hidden" name="group" value={proposal.args.group} />
      <div style={{ minWidth: 0, flex: "1 1 220px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{proposal.verb}</div>
        <div style={{ fontSize: 13, color: FAINT, lineHeight: 1.5 }}>
          {proposal.why || `${proposal.verb} — ${proposal.args.group}`}
        </div>
      </div>
      {state.ok ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1f6b45" }}>{state.ok}</span>
      ) : (
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "9px 16px",
            borderRadius: 999,
            border: 0,
            background: "#1b2340",
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Working…" : proposal.verb}
        </button>
      )}
      {state.error ? (
        <span style={{ fontSize: 13, color: "#a13a2c", flexBasis: "100%" }}>{state.error}</span>
      ) : null}
    </form>
  );
}
