"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { runProposal, type RunState } from "./actions";

const INK = "#16203a";
const BODY = "#545c70";
const FAINT = "#6f7788";
const LINE = "#e6e4da";
const FIELD = "#e2e0d6";
const INDIGO = "#4f46e5";
const SERIF = "var(--font-serif4), Georgia, serif";

export interface Proposal {
  action: string;
  verb: string;
  why: string;
  /** Whatever this action takes — a class, a student, a subject line. Rendered
   *  and posted generically, so adding an action needs no change here. */
  args: Record<string, string>;
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
/* THE THREAD DOES NOT SURVIVE LEAVING THIS PAGE YET, and that is a real gap:
   the assistant's job is to answer questions about pages you then go and look
   at, so following its advice currently costs you the conversation. It wants
   storing server-side, per person, which is a table and a loader — not a
   sessionStorage mirror, which would have to be read during render to avoid
   an effect that sets state, and would then disagree with the server's first
   paint. Doing it badly here would have made the proper version harder. */

export function AssistantChat({
  suggestions,
  centreName,
}: {
  suggestions: string[];
  centreName: string;
}) {
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

  function reset() {
    setTurns([]);
    setError(null);
  }

  return (
    /* A CONVERSATION, NOT A CARD ON A PAGE. The transcript owns the canvas and
       the composer stays on the glass at the bottom, so the thing you type into
       is in the same place after forty turns as after one. `minHeight` rather
       than a fixed height: the page still scrolls normally, which is what makes
       the sticky composer behave on a phone keyboard. */
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100dvh - 56px)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 28px",
          borderBottom: `1px solid ${LINE}`,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 26,
              lineHeight: 1.15,
              color: INK,
              margin: 0,
            }}
          >
            Assistant
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: FAINT }}>
            {centreName} · it sees exactly what your account sees, and nothing more
          </p>
        </div>
        {turns.length > 0 ? (
          <button
            type="button"
            onClick={reset}
            style={{
              marginLeft: "auto",
              padding: "9px 15px",
              borderRadius: 999,
              border: `1px solid ${FIELD}`,
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              color: BODY,
              cursor: "pointer",
            }}
          >
            New chat
          </button>
        ) : null}
      </header>

      <div style={{ flex: 1, padding: "30px 28px 26px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          {turns.length === 0 ? (
            <div style={{ paddingTop: 24 }}>
              <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600, color: INK }}>
                Ask about your centre.
              </p>
              <p
                style={{
                  margin: "0 0 22px",
                  fontSize: 14,
                  color: FAINT,
                  lineHeight: 1.65,
                  maxWidth: 560,
                }}
              >
                It reads your classes, rosters and marking queue. It can also do things — assign
                practice, add a student, invite a class — but only ever by handing you a button
                first.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void ask(s)}
                    style={{
                      padding: "10px 15px",
                      borderRadius: 999,
                      border: `1px solid ${FIELD}`,
                      background: "#fff",
                      fontSize: 13.5,
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
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {turns.map((t, i) => (
                <Bubble key={i} turn={t} />
              ))}
              {busy ? (
                <div style={{ fontSize: 14, color: FAINT }}>Reading your centre…</div>
              ) : null}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          borderTop: `1px solid ${LINE}`,
          background: "rgba(244,243,239,.9)",
          backdropFilter: "blur(10px)",
          padding: "14px 28px 16px",
        }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          {error ? (
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#a13a2c" }}>{error}</p>
          ) : null}
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
                padding: "13px 18px",
                borderRadius: 999,
                border: `1px solid ${FIELD}`,
                background: "#fff",
                fontSize: 14.5,
                color: INK,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length === 0}
              style={{
                padding: "13px 24px",
                borderRadius: 999,
                border: 0,
                background: INDIGO,
                color: "#fff",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
                opacity: busy || draft.trim().length === 0 ? 0.5 : 1,
              }}
            >
              Ask
            </button>
          </form>
          <p style={{ margin: "9px 0 0", fontSize: 12, color: FAINT, textAlign: "center" }}>
            It proposes; you confirm. Nothing changes until you press a button.
          </p>
        </div>
      </div>
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
        <ProposalCard key={p.action + JSON.stringify(p.args)} proposal={p} />
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
      {Object.entries(proposal.args).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div style={{ minWidth: 0, flex: "1 1 220px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{proposal.verb}</div>
        <div style={{ fontSize: 13, color: FAINT, lineHeight: 1.5 }}>
          {proposal.why || Object.values(proposal.args).join(" · ")}
        </div>
        {/* SPELLED OUT, ALWAYS. The one-line "why" is the model's words; this
            is what will actually be sent, so a wrong class or a misheard name
            is visible before the button rather than after it. */}
        <div style={{ fontSize: 12.5, color: FAINT, marginTop: 4 }}>
          {Object.entries(proposal.args).map(([k, v]) => (
            <span key={k} style={{ marginRight: 10 }}>
              <b style={{ color: BODY, fontWeight: 600 }}>{k.replace(/_/g, " ")}:</b> {v}
            </span>
          ))}
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
