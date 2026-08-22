"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  guessRoles,
  readSpreadsheet,
  SpreadsheetError,
  toRosterLines,
} from "@/lib/spreadsheet-read";

import { runProposal, type RunState } from "./actions";
import { TelegramStaffPanel } from "./telegram-panel";
import { newThread } from "./thread-actions";

const INK = "#16203a";
const BODY = "#2a3350";
const MUTED = "#545c70";
const FAINT = "#6f7788";
const DIM = "#8b91a0";
const LINE = "#dfdfe8";
const RULE = "#eeeef4";
const FIELD = "#e2e2ea";
const WASH = "#f6f6fa";
const TINT = "#fafaff";
const INDIGO = "#4f46e5";
const INDIGO_INK = "#3730a3";
const SERIF = "var(--font-serif4), Georgia, serif";

export interface ProposalField {
  name: string;
  label: string;
  kind: string;
  value: string;
  choices?: readonly string[];
  required: boolean;
}

export interface Proposal {
  action: string;
  verb: string;
  why: string;
  args: Record<string, string>;
  fields: ProposalField[];
}

export interface DocumentOffer {
  doc: string;
  verb: string;
  label: string;
  href: string;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  proposals?: Proposal[];
  documents?: DocumentOffer[];
  roster?: string[];
}

interface Attachment {
  name: string;
  lines: string[];
  skipped: number;
}

export interface ThreadSummary {
  id: string;
  title: string;
  when: string;
  tag: "Proposal" | "Report";
}

interface Capability {
  id: string;
  label: string;
  glyph: string;
  tint: string;
  prompt: string;
}

const TINTS: Record<string, { bg: string; fg: string }> = {
  indigo: { bg: "#eeecff", fg: "#3730a3" },
  blue: { bg: "#e7f1fb", fg: "#215d8f" },
  green: { bg: "#eaf5ee", fg: "#1f6b45" },
  amber: { bg: "#fdf1e3", fg: "#9a5b16" },
  pink: { bg: "#fdeef3", fg: "#8f2f56" },
  slate: { bg: "#eceaf4", fg: "#413a63" },
};

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 16,
};

const railHead: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: DIM,
};

/**
 * The assistant's command centre.
 *
 * THREE THINGS SHARE THE SCREEN because they answer three different questions:
 * what can it do (the launcher), what did I ask before (the history), and what
 * is happening now (the thread). The single-column version had the first two
 * nowhere — you had to already know what to type, and the moment you left, the
 * conversation was gone.
 */
export function AssistantChat({
  suggestions,
  centreName,
  initialTurns,
  threads,
  activeThread,
  capabilities,
  telegramConnected,
  botUsername,
}: {
  suggestions: string[];
  centreName: string;
  initialTurns: Turn[];
  threads: ThreadSummary[];
  activeThread: string | null;
  capabilities: Capability[];
  telegramConnected: boolean;
  botUsername: string | null;
}) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attached, setAttached] = useState<Attachment | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    setTurns((prev) => [...prev, { role: "user", content: text, roster: carried?.lines }]);
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
        documents?: DocumentOffer[];
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
          documents: data.documents ?? [],
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
        setError(
          "I couldn't find a name column in that file. Use the roster importer on the class page, which lets you map the columns by hand.",
        );
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

  function prefill(text: string) {
    setDraft(text);
    inputRef.current?.focus();
  }

  async function reset() {
    setTurns([]);
    setError(null);
    setAttached(null);
    void newThread();
  }

  const open = turns.some((t) => (t.proposals ?? []).length > 0);
  const title = turns.find((t) => t.role === "user")?.content ?? "New conversation";

  return (
    <div className="cn-assistant-page">
      {/* ── who is talking, and to what ─────────────────────────────────── */}
      <header style={{ ...card, flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>
        <span
          style={{
            width: 34,
            height: 34,
            flex: "none",
            borderRadius: 11,
            background: "#1b2340",
            color: "#fff",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Spark size={18} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, lineHeight: 1.15, color: INK }}>
            Assistant
          </div>
          <div
            style={{
              fontSize: 12,
              color: DIM,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {centreName} · sees exactly what your account sees, and nothing more
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Honest, and the only badge here: the snapshot is rebuilt on every
              question, so what it answers from is whatever is true right now. */}
          <span
            className="cn-hide-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 13px",
              background: WASH,
              border: `1px solid #e6e6ee`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: BODY,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#1f8a4c" }} />
            Live data
          </span>
          <button
            type="button"
            onClick={() => void reset()}
            className="cn-pill"
            style={{
              padding: "9px 15px",
              borderRadius: 10,
              background: "#fff",
              border: `1px solid ${LINE}`,
              fontSize: 13,
              fontWeight: 700,
              color: BODY,
              cursor: "pointer",
            }}
          >
            New chat
          </button>
        </div>
      </header>

      <div className="cn-assistant-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* ── what it can do, and what you asked before ─────────────────── */}
        <aside
          className="cn-hide-md"
          style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ ...card, flex: "none", padding: 14 }}>
            <div style={{ ...railHead, paddingBottom: 10 }}>Do something</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {capabilities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => prefill(c.prompt)}
                  className="cn-cap"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 10px",
                    borderRadius: 10,
                    border: "1px solid #eceaf4",
                    background: TINT,
                    fontSize: 13,
                    fontWeight: 600,
                    color: BODY,
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      flex: "none",
                      borderRadius: 7,
                      background: (TINTS[c.tint] ?? TINTS.indigo).bg,
                      color: (TINTS[c.tint] ?? TINTS.indigo).fg,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {c.glyph}
                  </span>
                  <span
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {botUsername ? (
            <div style={{ ...card, flex: "none", padding: 14 }}>
              <div style={{ ...railHead, paddingBottom: 10 }}>On your phone</div>
              <TelegramStaffPanel connected={telegramConnected} botUsername={botUsername} />
            </div>
          ) : null}

          <div
            style={{
              ...card,
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateRows: "auto minmax(0, 1fr)",
            }}
          >
            <div style={{ padding: "14px 14px 10px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={railHead}>History</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#b0b4c0" }}>
                {threads.length === 0
                  ? "nothing yet"
                  : `${threads.length} chat${threads.length === 1 ? "" : "s"}`}
              </span>
            </div>
            <div style={{ overflow: "auto", padding: "0 10px 12px" }}>
              {threads.length === 0 ? (
                <p style={{ margin: "4px 4px", fontSize: 12.5, color: DIM, lineHeight: 1.55 }}>
                  Conversations you have here are kept, and only you can read them.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {threads.map((t) => {
                    const live = t.id === activeThread;
                    return (
                      <Link
                        key={t.id}
                        href={`/console/assistant?thread=${t.id}`}
                        className="cn-thread"
                        style={{
                          display: "block",
                          padding: "9px 10px",
                          borderRadius: 10,
                          border: `1px solid ${live ? "#ddd9fb" : "#eceaf4"}`,
                          background: live ? "#f4f3ff" : TINT,
                          textDecoration: "none",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: INK,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.title}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: DIM,
                            marginTop: 3,
                          }}
                        >
                          <span
                            style={{
                              padding: "2px 7px",
                              borderRadius: 999,
                              fontWeight: 700,
                              background: t.tag === "Proposal" ? "#eeecff" : WASH,
                              color: t.tag === "Proposal" ? INDIGO_INK : FAINT,
                            }}
                          >
                            {t.tag}
                          </span>
                          <span>{when(t.when)}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── the conversation ──────────────────────────────────────────── */}
        <div style={{ minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              ...card,
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateRows: "auto minmax(0, 1fr)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "13px 20px",
                borderBottom: `1px solid ${RULE}`,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: INK,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </span>
              {open ? (
                <span
                  style={{
                    flex: "none",
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: WASH,
                    border: "1px solid #e6e6ee",
                    fontSize: 11,
                    fontWeight: 700,
                    color: FAINT,
                  }}
                >
                  1 proposal open
                </span>
              ) : null}
              <span className="cn-hide-sm" style={{ marginLeft: "auto", fontSize: 12, color: DIM }}>
                It proposes · you confirm
              </span>
            </div>

            <div style={{ overflow: "auto", padding: "20px 20px 12px", background: "#fbfbfd" }}>
              <div
                style={{
                  maxWidth: 820,
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {turns.length === 0 ? (
                  <div style={{ paddingTop: 10 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600, color: INK }}>
                      Ask about your centre — or tell it what to change.
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: FAINT,
                        lineHeight: 1.65,
                        maxWidth: 560,
                      }}
                    >
                      It reads your classes, rosters and marking queue. It can create classes, add
                      students, import a spreadsheet and assign practice — always by drafting it
                      first and handing you the button.
                    </p>
                  </div>
                ) : (
                  turns.map((t, i) => <Bubble key={i} turn={t} onAsk={prefill} />)
                )}
                {busy ? <div style={{ fontSize: 14, color: DIM }}>Reading your centre…</div> : null}
                <div ref={endRef} />
              </div>
            </div>
          </div>

          {/* ── the composer ───────────────────────────────────────────── */}
          <div style={{ ...card, flex: "none", padding: "12px 14px" }}>
            {error ? (
              <p style={{ margin: "0 0 9px", fontSize: 13, color: "#a13a2c" }}>{error}</p>
            ) : null}
            {attached ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  padding: "9px 13px",
                  borderRadius: 10,
                  border: `1px solid ${FIELD}`,
                  background: TINT,
                  fontSize: 13,
                  color: MUTED,
                }}
              >
                <span style={{ fontWeight: 600, color: INK }}>{attached.name}</span>
                <span style={{ color: DIM }}>
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
                    color: DIM,
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ) : null}
            {turns.length === 0 ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void ask(s)}
                    className="cn-cap"
                    style={{
                      padding: "7px 12px",
                      borderRadius: 999,
                      background: TINT,
                      border: "1px solid #eceaf4",
                      fontSize: 12,
                      fontWeight: 600,
                      color: MUTED,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask(draft);
              }}
              style={{ display: "flex", alignItems: "center", gap: 9 }}
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
                className="cn-cap"
                style={{
                  width: 38,
                  height: 38,
                  flex: "none",
                  borderRadius: 10,
                  border: `1px solid ${LINE}`,
                  background: TINT,
                  color: FAINT,
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                +
              </button>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask anything, or tell it what to change…"
                aria-label="Ask the assistant"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: `1px solid ${FIELD}`,
                  background: "#fbfbfd",
                  fontSize: 15,
                  color: INK,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                style={{
                  flex: "none",
                  padding: "11px 22px",
                  borderRadius: 10,
                  background: INDIGO,
                  border: 0,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy || draft.trim().length === 0 ? 0.5 : 1,
                }}
              >
                Ask
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  );
}

function when(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function Bubble({ turn, onAsk }: { turn: Turn; onAsk: (text: string) => void }) {
  if (turn.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: "76%",
            padding: "12px 16px",
            borderRadius: "14px 14px 4px 14px",
            background: "#eeecff",
            border: "1px solid #ddd9fb",
            fontSize: 15,
            lineHeight: 1.5,
            color: INK,
          }}
        >
          {turn.content}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 11 }}>
      <span
        style={{
          width: 28,
          height: 28,
          flex: "none",
          borderRadius: 9,
          background: "#1b2340",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          marginTop: 2,
        }}
      >
        <Spark size={14} />
      </span>
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: BODY, whiteSpace: "pre-wrap" }}>
          {turn.content}
        </div>
        {(turn.documents ?? []).map((d) => (
          <DocumentCard key={d.doc + d.href} offer={d} />
        ))}
        {(turn.proposals ?? []).map((p) => (
          <ProposalCard
            key={p.action + JSON.stringify(p.args)}
            proposal={p}
            roster={turn.roster}
            onAsk={onAsk}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A file it can hand you.
 *
 * NO CONFIRM STEP, and that is deliberate. A proposal needs one because it
 * changes something; a report only reads, so a second press would be friction
 * dressed up as safety. The route behind the link authenticates on its own —
 * finance refuses anyone but the owner, and a student report is gated by
 * `can_view_student` — so the link is not the permission.
 *
 * A real navigation rather than fetch-and-blob: the browser gets a filename
 * and its own download UI, which is what somebody asking for a spreadsheet
 * expects to happen.
 */
function DocumentCard({ offer }: { offer: DocumentOffer }) {
  return (
    <a
      href={offer.href}
      className="cn-cap"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: `1px solid ${FIELD}`,
        borderRadius: 14,
        background: "#fff",
        padding: "13px 15px",
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          flex: "none",
          borderRadius: 10,
          background: "#eaf5ee",
          color: "#1f6b45",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 4v11" />
          <path d="m7.5 11 4.5 4.5 4.5-4.5" />
          <path d="M5 19h14" />
        </svg>
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: INK }}>
          {offer.verb}
        </span>
        <span style={{ display: "block", fontSize: 13, color: DIM }}>{offer.label}</span>
      </span>
    </a>
  );
}

/**
 * A draft you can correct, and the button that commits it.
 *
 * EDITABLE ON PURPOSE. The model is inferring a class name, a date or a
 * spelling from one sentence, and correcting a field in place is far quicker
 * than arguing with it in prose. Nothing typed here is trusted: `runProposal`
 * re-derives the caller, re-checks the action against their role, and
 * re-resolves every class and student by name through RLS — so an edited field
 * is exactly as safe as the model's own guess, which is to say it is checked
 * either way.
 */
function ProposalCard({
  proposal,
  roster,
  onAsk,
}: {
  proposal: Proposal;
  roster?: string[];
  onAsk: (text: string) => void;
}) {
  const [state, action, pending] = useActionState(runProposal, {} as RunState);
  const [discarded, setDiscarded] = useState(false);

  if (discarded) {
    return (
      <p style={{ margin: 0, fontSize: 13.5, color: DIM }}>
        Discarded — nothing was saved. Tell me what to change and I&apos;ll draft it again.
      </p>
    );
  }

  if (state.ok) {
    return (
      <div
        style={{
          border: "1px solid #d8eede",
          borderRadius: 14,
          background: "#f4fbf6",
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ color: "#1f8a4c", display: "block" }}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m8.5 12.5 2.5 2.5 4.5-5" />
            </svg>
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>Done</span>
        </div>
        <div style={{ fontSize: 13.5, color: "#5c7a67", marginTop: 5 }}>{state.ok}</div>
        <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
          {NEXT_STEPS[proposal.action]?.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onAsk(n)}
              style={{
                padding: "7px 13px",
                borderRadius: 999,
                background: "#fff",
                border: "1px solid #d8eede",
                fontSize: 12,
                fontWeight: 700,
                color: BODY,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form
      action={action}
      style={{ border: "1px solid #ddd9fb", borderRadius: 14, overflow: "hidden", background: "#fff" }}
    >
      <input type="hidden" name="action" value={proposal.action} />
      {roster ? <input type="hidden" name="roster" value={roster.join("\n")} /> : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "11px 14px",
          background: "#f4f3ff",
          borderBottom: "1px solid #e6e3fb",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 999,
            background: INDIGO,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          Needs confirming
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{proposal.verb}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6f6a9e" }}>Nothing saved yet</span>
      </div>

      <div
        style={{
          padding: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
          gap: "12px 14px",
        }}
      >
        {proposal.fields.map((f) => (
          <label key={f.name} style={{ display: "grid", gap: 5, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: DIM }}>
              {f.label}
              {f.required ? "" : " (optional)"}
            </span>
            {f.choices ? (
              <select
                name={f.name}
                defaultValue={f.value}
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${FIELD}`,
                  background: "#fbfbfd",
                  fontSize: 14,
                  color: INK,
                  outline: "none",
                  minWidth: 0,
                }}
              >
                {f.choices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={f.name}
                defaultValue={f.value}
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${FIELD}`,
                  background: "#fbfbfd",
                  fontSize: 14,
                  color: INK,
                  outline: "none",
                  minWidth: 0,
                }}
              />
            )}
          </label>
        ))}
      </div>

      <div
        style={{
          padding: "12px 14px",
          background: "#fbfbfd",
          borderTop: `1px solid ${RULE}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, color: DIM, minWidth: 0 }}>
          {proposal.why}
          {roster ? ` · ${roster.length} students from the attached file` : ""}
        </span>
        {state.error ? (
          <span style={{ fontSize: 12.5, color: "#a13a2c", flexBasis: "100%" }}>{state.error}</span>
        ) : null}
        <button
          type="button"
          onClick={() => setDiscarded(true)}
          style={{
            marginLeft: "auto",
            flex: "none",
            padding: "9px 14px",
            borderRadius: 10,
            background: "#fff",
            border: `1px solid ${LINE}`,
            fontSize: 13,
            fontWeight: 600,
            color: FAINT,
            cursor: "pointer",
          }}
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={pending}
          style={{
            flex: "none",
            padding: "9px 17px",
            borderRadius: 10,
            background: INDIGO,
            border: 0,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Working…" : proposal.verb}
        </button>
      </div>
    </form>
  );
}

/** What a person usually wants next. Prefilled into the box rather than run —
 *  the next thing is still a decision. */
const NEXT_STEPS: Record<string, string[]> = {
  create_group: ["Add students to it", "Link a Telegram channel to it", "Assign a placement test"],
  add_students_bulk: ["Invite the class to Telegram", "Assign them practice"],
  add_student: ["Invite the class to Telegram"],
  invite_class_telegram: ["Who still can't sign in?"],
  assign_practice: ["Who hasn't handed it in?"],
};
