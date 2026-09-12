"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TASK2_CATEGORIES,
  TASK2_CATEGORY_LABELS,
  TOPIC_FAMILIES,
} from "@/lib/prompts/constants";

import { useActionFeedback } from "@/components/console/toast";
import { createAssignment, type GroupFormState } from "../actions";
import { V2 } from "./ui";

const FIELD =
  "border-input h-10 w-full min-w-0 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

const initial: GroupFormState = {};
type Kind = "writing" | "reading" | "library";

/** A focused two-step flow: choose the material, then set delivery details. */
export function AssignPanel({
  groupId,
  libraryTests,
  library = [],
  hasPlacement = false,
  onDone,
}: {
  groupId: string;
  libraryTests: { id: string; label: string }[];
  library?: { id: string; title: string; skill: string; level: string | null }[];
  hasPlacement?: boolean;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createAssignment, initial);
  useActionFeedback(state, { onSuccess: onDone });
  const [step, setStep] = useState<1 | 2>(1);
  const [kind, setKind] = useState<Kind>(library.length > 0 ? "library" : "writing");
  const [libraryId, setLibraryId] = useState(library[0]?.id ?? "");
  const [category, setCategory] = useState<(typeof TASK2_CATEGORIES)[number]>("opinion");
  const [topicFamily, setTopicFamily] = useState<string>(TOPIC_FAMILIES[0]);
  const [libraryTestId, setLibraryTestId] = useState(libraryTests[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [placement, setPlacement] = useState(false);

  const selectedLibrary = library.find((item) => item.id === libraryId);
  const librarySkill = selectedLibrary?.skill;
  const canPlace =
    kind === "writing" ||
    kind === "reading" ||
    (kind === "library" && (librarySkill === "writing" || librarySkill === "reading"));
  const selectedTitle =
    kind === "library"
      ? selectedLibrary?.title ?? "Saved practice"
      : kind === "writing"
        ? `Writing Task 2 · ${TASK2_CATEGORY_LABELS[category]}`
        : libraryTests.find((test) => test.id === libraryTestId)?.label ?? "Reading test";

  function chooseKind(next: Kind) {
    setKind(next);
    if (next !== "library") setPlacement(false);
  }

  return (
    <form action={formAction} style={{ display: "grid", gap: 20 }}>
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="kind" value={kind} />
      {kind === "library" ? <input type="hidden" name="library_id" value={libraryId} /> : null}
      {kind === "writing" ? (
        <>
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="topic_family" value={topicFamily} />
        </>
      ) : null}
      {kind === "reading" ? <input type="hidden" name="library_test_id" value={libraryTestId} /> : null}

      <div aria-label="Assignment steps" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Step step={1} active={step === 1} done={step === 2} label="Choose practice" />
        <Step step={2} active={step === 2} done={false} label="Set details" />
      </div>

      {step === 1 ? (
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <h3 style={heading}>What should this class practise?</h3>
            <p style={description}>Choose saved material for an instant assignment, or create a new practice.</p>
          </div>

          <div role="radiogroup" aria-label="Practice type" style={{ display: "grid", gap: 10 }}>
            {library.length > 0 ? (
              <ChoiceCard
                selected={kind === "library"}
                title="Use saved practice"
                description="Assign an existing paper. No generation time or quota used."
                meta={`${library.length} saved item${library.length === 1 ? "" : "s"}`}
                onClick={() => chooseKind("library")}
              />
            ) : null}
            <ChoiceCard
              selected={kind === "writing"}
              title="Create a writing task"
              description="Generate a fresh IELTS Task 2 prompt for this class."
              meta="Uses generation allowance"
              onClick={() => chooseKind("writing")}
            />
            <ChoiceCard
              selected={kind === "reading"}
              title="Assign a reading test"
              description="Give everyone the same full reading test."
              meta={libraryTests.length > 0 ? `${libraryTests.length} test${libraryTests.length === 1 ? "" : "s"} available` : "No tests available"}
              disabled={libraryTests.length === 0}
              onClick={() => chooseKind("reading")}
            />
          </div>

          {kind === "library" ? (
            <FieldGroup label="Saved practice" htmlFor="assign-library">
              <select id="assign-library" className={FIELD} required value={libraryId} onChange={(event) => setLibraryId(event.target.value)}>
                {library.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}{item.level ? ` · ${item.level}` : ""}</option>
                ))}
              </select>
            </FieldGroup>
          ) : null}

          {kind === "writing" ? (
            <div style={twoColumns}>
              <FieldGroup label="Question type" htmlFor="assign-category">
                <select id="assign-category" className={FIELD} value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
                  {TASK2_CATEGORIES.map((item) => <option key={item} value={item}>{TASK2_CATEGORY_LABELS[item]}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Topic family" htmlFor="assign-topic">
                <input id="assign-topic" className={FIELD} list="assign-topics" value={topicFamily} onChange={(event) => setTopicFamily(event.target.value)} required />
                <datalist id="assign-topics">
                  {TOPIC_FAMILIES.map((topic) => <option key={topic} value={topic} />)}
                </datalist>
              </FieldGroup>
            </div>
          ) : null}

          {kind === "reading" ? (
            <FieldGroup label="Reading test" htmlFor="assign-test">
              <select id="assign-test" className={FIELD} required value={libraryTestId} onChange={(event) => setLibraryTestId(event.target.value)}>
                {libraryTests.map((test) => <option key={test.id} value={test.id}>{test.label}</option>)}
              </select>
            </FieldGroup>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <h3 style={heading}>How should this assignment run?</h3>
            <p style={description}>Add a deadline or a short instruction, then review before sending.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: `1px solid ${V2.field}`, borderRadius: 12, background: V2.wash }}>
            <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, background: V2.indigoTint, color: V2.indigo, fontWeight: 700 }}>
              {kind === "writing" ? "W" : kind === "reading" ? "R" : "✓"}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: V2.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTitle}</div>
              <div style={{ fontSize: 12.5, color: V2.faint, marginTop: 2 }}>Identical content for everyone in this group</div>
            </div>
            <button type="button" onClick={() => setStep(1)} style={changeButton}>Change</button>
          </div>

          <div style={twoColumns}>
            <FieldGroup label="Due date" htmlFor="assign-due" hint="Optional">
              <Input id="assign-due" name="due_at" type="date" className="h-10" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </FieldGroup>
            <div />
          </div>

          {canPlace ? (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "13px 14px", border: `1px solid ${V2.field}`, borderRadius: 12, cursor: "pointer" }}>
              <input type="checkbox" name="is_placement" checked={placement} onChange={(event) => setPlacement(event.target.checked)} style={{ marginTop: 3 }} />
              <span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: V2.ink }}>Use as placement test</span>
                <span style={{ display: "block", marginTop: 3, fontSize: 12.5, lineHeight: 1.45, color: V2.faint }}>
                  {hasPlacement ? "This group already has a baseline. A second placement will not replace it." : "This becomes the starting point for each student’s progress report."}
                </span>
              </span>
            </label>
          ) : null}

          <FieldGroup label="Instructions" htmlFor="assign-instructions" hint="Optional">
            <Input id="assign-instructions" name="instructions" className="h-10" placeholder="Focus on paragraphing this week." value={instructions} onChange={(event) => setInstructions(event.target.value)} />
          </FieldGroup>

          <div style={{ padding: "12px 14px", borderRadius: 12, background: V2.indigoWash, color: V2.indigoInk, fontSize: 12.5, lineHeight: 1.5 }}>
            Students will receive the same assignment. {kind === "writing" ? "A new prompt will be generated when you assign it." : "The saved content will be assigned immediately."}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 16, borderTop: `1px solid ${V2.rule}` }}>
        <span style={{ color: V2.faint, fontSize: 12.5 }}>Step {step} of 2</span>
        <div style={{ display: "flex", gap: 8 }}>
          {step === 2 ? <button type="button" onClick={() => setStep(1)} style={secondaryButton}>Back</button> : null}
          {step === 1 ? (
            <Button type="button" onClick={() => setStep(2)} disabled={kind === "reading" && libraryTests.length === 0}>Continue</Button>
          ) : (
            <Button type="submit" disabled={pending}>{pending ? "Assigning…" : "Assign to group"}</Button>
          )}
        </div>
      </div>

      {state.error ? <p className="text-destructive text-sm" role="alert">{state.error}</p> : null}
      {state.notice ? <p className="text-muted-foreground text-sm" role="status">{state.notice}</p> : null}
    </form>
  );
}

function Step({ step, active, done, label }: { step: number; active: boolean; done: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 10, background: active || done ? V2.indigoWash : V2.wash, color: active || done ? V2.indigoInk : V2.faint, fontSize: 12.5, fontWeight: 600 }}>
      <span style={{ width: 21, height: 21, display: "grid", placeItems: "center", borderRadius: "50%", background: active || done ? V2.indigo : "#e5e3dc", color: active || done ? "#fff" : V2.faint, fontSize: 11 }}>{done ? "✓" : step}</span>
      {label}
    </div>
  );
}

function ChoiceCard({ selected, title, description, meta, disabled = false, onClick }: { selected: boolean; title: string; description: string; meta: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={onClick} style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", alignItems: "center", gap: 11, width: "100%", padding: "13px 14px", textAlign: "left", border: `1px solid ${selected ? "#b9b4f0" : V2.field}`, borderRadius: 12, background: selected ? V2.indigoWash : "#fff", color: V2.ink, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1 }}>
      <span style={{ width: 18, height: 18, display: "grid", placeItems: "center", borderRadius: "50%", border: `2px solid ${selected ? V2.indigo : V2.field}` }}>
        {selected ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: V2.indigo }} /> : null}
      </span>
      <span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{title}</span>
        <span style={{ display: "block", marginTop: 3, fontSize: 12.5, lineHeight: 1.4, color: V2.faint }}>{description}</span>
      </span>
      <span style={{ fontSize: 11.5, color: selected ? V2.indigoInk : V2.faint, whiteSpace: "nowrap" }}>{meta}</span>
    </button>
  );
}

function FieldGroup({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor={htmlFor} style={{ display: "flex", alignItems: "baseline", gap: 7, fontSize: 12.5, fontWeight: 600, color: V2.ink }}>
        {label}
        {hint ? <span style={{ fontSize: 11.5, fontWeight: 400, color: V2.faint }}>{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

const heading: React.CSSProperties = { margin: 0, fontFamily: "var(--font-serif4), Georgia, serif", fontSize: 21, lineHeight: 1.2, color: V2.ink };
const description: React.CSSProperties = { margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: V2.faint };
const twoColumns: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 };
const changeButton: React.CSSProperties = { marginLeft: "auto", flex: "none", border: 0, background: "transparent", color: V2.indigo, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const secondaryButton: React.CSSProperties = { height: 36, padding: "0 15px", borderRadius: 8, border: `1px solid ${V2.field}`, background: "#fff", color: V2.ink, fontSize: 13, fontWeight: 600, cursor: "pointer" };
