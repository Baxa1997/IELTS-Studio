"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  guessRoles,
  readSpreadsheet,
  SpreadsheetError,
  toRosterLines,
} from "@/lib/spreadsheet-read";

import { runProposal, type RunState } from "./actions";
import { newThread } from "./thread-actions";

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
  /** The roster that was attached when this turn was sent. Kept ON THE TURN so
   *  a proposal answering it still has the right file after another is
   *  attached — the alternative is a card that silently imports the newest
   *  spreadsheet instead of the one it was talking about. */
  roster?: string[];
}

interface Attachment {
  name: string;
  lines: string[];
  skipped: number;
}

/**
 * The centre assistant's conversation.
 *
 * IT ASKS, IT DOES NOT ACT. A reply may carry one proposal, which renders as a
 * card naming exactly what will happen and a button. Until that button is
 * pressed nothing has changed, and pressing it runs a server action that
 * re-checks the whole thing from the session up — see `runProposal`.
 */
export function AssistantChat({
  suggestions,
  centreName,
  initialTurns,
}: {
  suggestions: string[];
  centreName: string;
  /** The stored thread, rendered by the server on first paint. Seeded into
   *  state rather than read from an effect, so there is no flash of an empty
   *  conversation and no hydration mismatch to paper over. */
  initialTurns: Turn[];
}) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attached, setAttached] = useState<Attachment | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setError(null);
    setDraft("");
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    // ONLY THE COUNT TRAVELS. The model is told a roster is attached and how
    // big it is; the names and phone numbers go straight from this browser to
    // the server action when the button is pressed, and are never sent to a
    // language model at all.
    const carried = attached;
    const sent = carried
      ? `${text}\n\n(A roster file "${carried.name}" is attached, with ${carried.lines.length} student${carried.lines.length === 1 ? "" : "s"} in it.)`
      : text;
    setTurns((prev) => [
      ...prev,
      { role: "user", content: text, roster: carried?.lines },
    ]);
    setBusy(true);
    try {
      const res = await fetch("/api/console/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: sent, history }),
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
        {
          role: "assistant",
          content: data.reply ?? "",
          proposals: data.proposals ?? [],
          roster: carried?.lines,
        },
      ]);
    } catch {
      setError("Couldn't reach the assistant. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function attach(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    try {
      const grid = await readSpreadsheet(file);
      if (grid.length === 0) {
        setError("That file has no rows in it.");
        return;
      }
      // The same reader, guesser and mapper the roster importer uses — so a
      // sheet that works there works here, and one that does not fails the
      // same way with the same words.
      const { roles, hasHeader } = guessRoles(grid);
      const { lines, skipped } = toRosterLines(grid, roles, hasHeader);
      if (lines.length === 0) {
        setError("I couldn't find a name column in that file. Use the roster importer on the class page, which lets you map the columns by hand.");
        return;
      }
      setAttached({ name: file.name, lines, skipped });
    } catch (err) {
      setError(
        err instanceof SpreadsheetError
          ? err.message
          : "I couldn't read that file. .xlsx and .csv both work.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function reset() {
    setTurns([]);
    setError(null);
    setAttached(null);
    // The old thread is kept; this just starts a new one. Fired without
    // blocking the clear — the screen should empty on the click, not after a
    // round trip.
    void newThread();
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
            onClick={() => void reset()}
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
          {attached ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 9,
                padding: "9px 13px",
                borderRadius: 12,
                border: `1px solid ${FIELD}`,
                background: "#fff",
                fontSize: 13,
                color: BODY,
              }}
            >
              <span style={{ fontWeight: 600, color: INK }}>{attached.name}</span>
              <span style={{ color: FAINT }}>
                {attached.lines.length} student{attached.lines.length === 1 ? "" : "s"}
                {attached.skipped > 0 ? ` · ${attached.skipped} row(s) skipped` : ""}
              </span>
              <button
                type="button"
                onClick={() => setAttached(null)}
                aria-label="Remove the attached roster"
                style={{
                  marginLeft: "auto",
                  border: 0,
                  background: "none",
                  color: FAINT,
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(draft);
            }}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,text/csv"
              onChange={(e) => void attach(e.target.files?.[0])}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Attach a roster (.xlsx or .csv)"
              aria-label="Attach a roster"
              style={{
                flex: "none",
                width: 46,
                borderRadius: 999,
                border: `1px solid ${FIELD}`,
                background: "#fff",
                color: BODY,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              +
            </button>
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
        <ProposalCard
          key={p.action + JSON.stringify(p.args)}
          proposal={p}
          roster={turn.roster}
        />
      ))}
    </div>
  );
}

/** What it would do, and the button that does it. Never runs on render. */
function ProposalCard({ proposal, roster }: { proposal: Proposal; roster?: string[] }) {
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
      {/* The roster goes browser → server action, never past the model. */}
      {roster ? <input type="hidden" name="roster" value={roster.join("\n")} /> : null}
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
          {roster ? (
            <span>
              <b style={{ color: BODY, fontWeight: 600 }}>students:</b> {roster.length}
            </span>
          ) : null}
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
