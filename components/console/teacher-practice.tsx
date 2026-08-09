"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { assignPractice, type PracticeFormState } from "@/app/(app)/console/practices/actions";

/**
 * A teacher's practice bench, on top of the learner's own library.
 *
 * Three things a teacher needs that a student does not:
 *
 *  1. **Say the level explicitly.** A student's tasks are pitched from their own
 *     measured band; a teacher has a whole class and no single band to pitch at,
 *     so nothing sensible can be inferred. The setup modal asks.
 *  2. **Not be thrown into the runner.** Generating used to navigate straight to
 *     /write/[id], which is right for a learner about to write and wrong for a
 *     teacher lining up homework. Results land here as cards instead.
 *  3. **Start or attach, per card.** Start opens the same runner the student
 *     will sit. Attach sets it as homework — and publishes it on the way, since
 *     `assignPractice` approves a still-pending prompt as part of assigning.
 *
 * Lives on the learner hub pages, which run the Option A brand, so it is styled
 * to those tokens rather than the console's.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";
const TINT = "#F4F4FE";

export interface PracticeCard {
  id: string;
  /** Headline shown on the card — the prompt/passage text. */
  text: string;
  taskLabel: string;
  difficulty: number | null;
  category: string | null;
}

const field: React.CSSProperties = {
  width: "100%",
  border: `1px solid #CFCABC`,
  borderRadius: 9,
  padding: "10px 11px",
  fontFamily: SANS,
  fontSize: 13.5,
  color: INK,
  background: "#fff",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: SANS,
  fontSize: 12.5,
  color: MUTED,
  marginBottom: 5,
};

/** Bands a task can be pitched at — MIN_DIFFICULTY..MAX_DIFFICULTY. */
const LEVELS = [4, 5, 6, 7, 8, 9];

export function TeacherPractice({
  kind,
  taskTypes,
  categories,
  groups,
  defaultDifficulty,
}: {
  kind: "writing" | "reading";
  /** Which task to generate (Task 2, Task 1 academic, …). */
  taskTypes: { value: string; label: string }[];
  /** Task-2 categories; empty for kinds that have none. */
  categories: { value: string; label: string }[];
  groups: { id: string; name: string }[];
  defaultDifficulty: number;
}) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [attachFor, setAttachFor] = useState<PracticeCard | null>(null);
  const [cards, setCards] = useState<PracticeCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [taskType, setTaskType] = useState(taskTypes[0]?.value ?? "task2");
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [category, setCategory] = useState("");
  const [preference, setPreference] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSetupOpen(false);
      setAttachFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/prompts/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          difficulty,
          fresh: true,
          ...(category ? { category } : {}),
          // The composer takes this as the topic to write about, so a teacher's
          // note is a real instruction, not a label we drop on the floor.
          ...(preference.trim().length >= 2 ? { topicFamily: preference.trim().slice(0, 50) } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        prompt?: {
          id: string;
          prompt_text: string;
          task_type: string;
          category: string | null;
          difficulty: number | null;
        };
        message?: string;
      };
      if (!res.ok || !body.prompt?.id) {
        setError(body.message ?? "Couldn't generate that. Please try again.");
        return;
      }
      const label = taskTypes.find((t) => t.value === body.prompt!.task_type)?.label ?? "Practice";
      // Newest first, so a teacher generating a few in a row reads them top-down.
      setCards((prev) => [
        {
          id: body.prompt!.id,
          text: body.prompt!.prompt_text,
          taskLabel: label,
          difficulty: body.prompt!.difficulty ?? difficulty,
          category: body.prompt!.category,
        },
        ...prev,
      ]);
      setSetupOpen(false);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ fontFamily: SANS, marginBottom: 22 }}>
      {/* ── bench header ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          background: TINT,
          border: `1px solid ${LINE}`,
          borderRadius: 16,
          padding: "16px 18px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: ".08em",
              fontWeight: 700,
              textTransform: "uppercase",
              color: INDIGO,
            }}
          >
            Teacher
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: INK, margin: "4px 0 3px" }}>
            Make practice for a class
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, margin: 0, lineHeight: 1.5 }}>
            Pick the level you&apos;re teaching to, then start it yourself or attach it as
            homework. Attaching publishes it in the same step.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          style={{
            background: INDIGO,
            color: "#fff",
            border: 0,
            borderRadius: 11,
            padding: "10px 16px",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            flex: "none",
          }}
        >
          + New practice
        </button>
      </div>

      {error && !setupOpen ? (
        <p style={{ fontSize: 13, color: "#b91c1c", margin: "10px 2px 0" }}>{error}</p>
      ) : null}

      {/* ── generated cards ──────────────────────────────────────────────── */}
      {cards.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 14,
            marginTop: 14,
          }}
        >
          {cards.map((c) => (
            <article
              key={c.id}
              style={{
                background: "#fff",
                border: `1px solid ${LINE}`,
                borderRadius: 16,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Pill>{c.taskLabel}</Pill>
                {c.difficulty != null ? <Pill>Band {c.difficulty}</Pill> : null}
                {c.category ? <Pill>{c.category.replace(/_/g, " ")}</Pill> : null}
              </div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: INK,
                  margin: 0,
                  flex: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 6,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {c.text}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  href={kind === "writing" ? `/write/${c.id}` : `/read/test/${c.id}`}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    background: "#fff",
                    border: `1px solid ${LINE}`,
                    borderRadius: 10,
                    padding: "9px 12px",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: INK,
                    textDecoration: "none",
                  }}
                >
                  Start
                </Link>
                <button
                  type="button"
                  onClick={() => setAttachFor(c)}
                  disabled={groups.length === 0}
                  title={groups.length === 0 ? "Create a class first" : undefined}
                  style={{
                    flex: 1,
                    background: INDIGO,
                    color: "#fff",
                    border: 0,
                    borderRadius: 10,
                    padding: "9px 12px",
                    fontFamily: SANS,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: groups.length === 0 ? "not-allowed" : "pointer",
                    opacity: groups.length === 0 ? 0.5 : 1,
                  }}
                >
                  Attach
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {/* ── modal 1: level + preference ──────────────────────────────────── */}
      {setupOpen ? (
        <PracticeModal title="New practice" onClose={() => setSetupOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {taskTypes.length > 1 ? (
              <div>
                <label htmlFor="tp-task" style={labelStyle}>
                  Task
                </label>
                <select
                  id="tp-task"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  style={field}
                >
                  {taskTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label htmlFor="tp-level" style={labelStyle}>
                Level of the class
              </label>
              <select
                id="tp-level"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                style={field}
              >
                {LEVELS.map((b) => (
                  <option key={b} value={b}>
                    Band {b}
                    {b === defaultDifficulty ? " — default" : ""}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: FAINT, margin: "6px 0 0", lineHeight: 1.5 }}>
                How demanding the wording and ideas are. A student practising alone gets this
                pitched from their own measured band — a class has no single band, so you say.
              </p>
            </div>

            {categories.length > 0 && taskType === "task2" ? (
              <div>
                <label htmlFor="tp-category" style={labelStyle}>
                  Question type <span style={{ color: FAINT }}>(optional)</span>
                </label>
                <select
                  id="tp-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={field}
                >
                  <option value="">Any — surprise me</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label htmlFor="tp-pref" style={labelStyle}>
                Topic preference <span style={{ color: FAINT }}>(optional)</span>
              </label>
              <input
                id="tp-pref"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                maxLength={50}
                placeholder="e.g. urban transport, remote work, tourism"
                style={field}
              />
              <p style={{ fontSize: 12, color: FAINT, margin: "6px 0 0", lineHeight: 1.5 }}>
                What you want it to be about. Leave it blank and a topic is picked for you.
              </p>
            </div>

            {error ? <p style={{ fontSize: 13, color: "#b91c1c", margin: 0 }}>{error}</p> : null}

            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <button
                type="button"
                onClick={() => void generate()}
                disabled={busy}
                style={{
                  flex: 1,
                  background: INDIGO,
                  color: "#fff",
                  border: 0,
                  borderRadius: 10,
                  padding: 11,
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: busy ? "wait" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "Generating…" : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => setSetupOpen(false)}
                style={{
                  background: "#fff",
                  border: `1px solid ${LINE}`,
                  borderRadius: 10,
                  padding: "11px 16px",
                  fontFamily: SANS,
                  fontSize: 14,
                  color: INK,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </PracticeModal>
      ) : null}

      {/* ── modal 2: attach to classes ───────────────────────────────────── */}
      {attachFor ? (
        <PracticeModal title="Attach to a class" onClose={() => setAttachFor(null)}>
          <AttachForm
            kind={kind}
            contentId={attachFor.id}
            groups={groups}
            onDone={() => setAttachFor(null)}
          />
        </PracticeModal>
      ) : null}
    </section>
  );
}

/** Class picker + optional deadline, posting the same action the runner uses. */
export function AttachForm({
  kind,
  contentId,
  groups,
  onDone,
}: {
  kind: "writing" | "reading" | "listening";
  /** The row the assignment will point at — a prompt, a reading test, or a
   *  promoted listening library item. */
  contentId: string;
  groups: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(assignPractice, {} as PracticeFormState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="content_id" value={contentId} />

      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>
        Everyone in the class gets this exact practice, so their bands compare. It is published
        as part of attaching.
      </p>

      <div>
        <span style={labelStyle}>Classes</span>
        <div
          style={{
            display: "grid",
            gap: 2,
            maxHeight: 190,
            overflowY: "auto",
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            padding: 6,
          }}
        >
          {groups.map((g) => (
            <label
              key={g.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontSize: 13.5,
                color: INK,
                padding: "7px 8px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" name="group_ids" value={g.id} />
              {g.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="tp-due" style={labelStyle}>
          Due <span style={{ color: FAINT }}>(optional)</span>
        </label>
        <input id="tp-due" type="date" name="due_at" style={field} />
      </div>

      <div>
        <label htmlFor="tp-instructions" style={labelStyle}>
          A note for the class <span style={{ color: FAINT }}>(optional)</span>
        </label>
        <textarea
          id="tp-instructions"
          name="instructions"
          rows={3}
          placeholder="Read the question twice before you plan."
          style={{ ...field, resize: "vertical", lineHeight: 1.55 }}
        />
      </div>

      {state.error ? (
        <p style={{ fontSize: 13, color: "#b91c1c", margin: 0 }}>{state.error}</p>
      ) : null}
      {state.notice ? (
        <p style={{ fontSize: 13, color: "#15803d", margin: 0 }}>{state.notice}</p>
      ) : null}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            flex: 1,
            background: INDIGO,
            color: "#fff",
            border: 0,
            borderRadius: 10,
            padding: 11,
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Attaching…" : "Attach"}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={{
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            padding: "11px 16px",
            fontFamily: SANS,
            fontSize: 14,
            color: INK,
            cursor: "pointer",
          }}
        >
          {state.notice ? "Done" : "Cancel"}
        </button>
      </div>
    </form>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: INDIGO,
        background: TINT,
        borderRadius: 999,
        padding: "3px 9px",
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function PracticeModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(20,19,58,.4)", border: 0 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "relative",
          width: 460,
          maxWidth: "100%",
          maxHeight: "90dvh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 18,
          padding: "22px 24px",
          boxShadow: "0 30px 60px rgba(20,19,58,.28)",
          fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: INK, margin: 0 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              background: "#F6F5FB",
              border: `1px solid ${LINE}`,
              borderRadius: 9,
              width: 30,
              height: 30,
              flex: "none",
              cursor: "pointer",
              fontSize: 15,
              color: MUTED,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
