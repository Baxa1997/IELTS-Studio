"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { setAccountPlan, type ReviewState } from "../actions";
import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";

/**
 * Per-account plan and allowance controls for the platform owner.
 *
 * A popover rather than inline fields, because there are four controls per row
 * and 500 rows: inline would turn the table into a form nobody can read. It
 * opens over the row it belongs to and closes on save.
 *
 * The warning is the point of this component. Plans live on the organization,
 * so editing anyone inside a center moves the whole center — that is a fact of
 * the schema, not a bug, and the only honest thing to do is say so before the
 * click rather than after it.
 */

const INK = "#1A2138";
const MUTED = "#5A6076";
const LINE = "#ECEAF2";
const INDIGO = "#3B43B5";
const AMBER_BG = "#FBF3E2";
const AMBER_LINE = "#E4CE9B";
const AMBER_INK = "#7A5410";

const field: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${LINE}`,
  borderRadius: 7,
  padding: "6px 8px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

export function PlanControls({
  profileId,
  name,
  plan,
  orgKind,
  orgName,
  gradingLimit,
  generationLimit,
  orgMemberCount,
}: {
  profileId: string;
  name: string;
  plan: OrgPlan;
  orgKind: "personal" | "center";
  orgName: string;
  gradingLimit: number | null;
  generationLimit: number | null;
  orgMemberCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(setAccountPlan, {} as ReviewState);

  // Close once the write lands — the row re-renders from the server with the new
  // plan, so leaving the popover open would show stale inputs over fresh data.
  //
  // Adjusted during render rather than in an effect, the same way the console
  // chrome closes its panels on navigation: an effect here would set state after
  // paint and cost a second pass with the popover still open over new data.
  const [seenNotice, setSeenNotice] = useState<string | undefined>(undefined);
  if (state.notice && state.notice !== seenNotice) {
    setSeenNotice(state.notice);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const shared = orgMemberCount > 1;

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          border: `1px solid ${LINE}`,
          background: "#fff",
          borderRadius: 7,
          padding: "4px 10px",
          fontFamily: "inherit",
          fontSize: 12,
          color: INDIGO,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        aria-expanded={open}
      >
        Manage
      </button>

      {/*
        A PORTAL to <body>, and a centred dialog rather than a popover anchored
        to the row.

        The row lives inside ScrollTable, which sets maxHeight + overflow:auto —
        and an ancestor with overflow clips its absolutely-positioned
        descendants no matter what z-index they carry. The panel was not
        underneath anything; it was cut off by the scroll box. Raising z-index
        cannot fix that, so the panel has to leave the box entirely.

        Centred rather than positioned near the button because a fixed popover
        anchored to a row inside a scrolling table has to be re-measured on
        every scroll and window resize, and drifts away from its row the moment
        one is missed. There is nothing to drift from here.
      */}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Plan and limits for ${name}`}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(16,18,40,.34)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(320px, 100%)",
                  maxHeight: "calc(100vh - 40px)",
                  overflowY: "auto",
                  background: "#fff",
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  boxShadow: "0 24px 60px rgba(20,25,50,.28)",
                  padding: 18,
                  textAlign: "left",
                }}
              >
            <div style={{ fontSize: 13.5, fontWeight: 650, color: INK, marginBottom: 2 }}>
              {name}
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>
              {orgKind === "center" ? orgName : "Individual account"}
            </div>

            {shared ? (
              <p
                style={{
                  background: AMBER_BG,
                  border: `1px solid ${AMBER_LINE}`,
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: AMBER_INK,
                  margin: "0 0 10px",
                }}
              >
                This changes the plan for <strong>{orgName}</strong> and all {orgMemberCount}{" "}
                members, not just this person.
              </p>
            ) : null}

            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <input type="hidden" name="profile_id" value={profileId} />
              <input type="hidden" name="member_count" value={orgMemberCount} />

              <label style={{ fontSize: 11.5, color: MUTED }}>
                Plan
                <select name="plan" defaultValue={plan} style={{ ...field, marginTop: 3 }}>
                  {PLAN_ORDER.map((p) => (
                    <option key={p} value={p}>
                      {PLAN_TIERS[p].name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: 11.5, color: MUTED }}>
                Gradings a month
                <input
                  name="grading_limit"
                  inputMode="numeric"
                  defaultValue={gradingLimit ?? ""}
                  placeholder={placeholderFor(plan, "grade")}
                  style={{ ...field, marginTop: 3 }}
                />
              </label>

              <label style={{ fontSize: 11.5, color: MUTED }}>
                Practices a month
                <input
                  name="generation_limit"
                  inputMode="numeric"
                  defaultValue={generationLimit ?? ""}
                  placeholder={placeholderFor(plan, "generate")}
                  style={{ ...field, marginTop: 3 }}
                />
              </label>

              <p style={{ fontSize: 11, color: MUTED, margin: 0, lineHeight: 1.4 }}>
                Leave a limit blank to use the plan&apos;s own allowance. 0 blocks it entirely.
              </p>

              {state.error ? (
                <p style={{ fontSize: 12, color: "#B3261E", margin: 0 }} role="alert">
                  {state.error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                style={{
                  marginTop: 2,
                  border: 0,
                  borderRadius: 8,
                  background: INDIGO,
                  color: "#fff",
                  padding: "8px 12px",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: pending ? "default" : "pointer",
                  opacity: pending ? 0.7 : 1,
                }}
              >
                {pending ? "Saving…" : shared ? `Apply to all ${orgMemberCount}` : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  background: "#fff",
                  color: MUTED,
                  padding: "8px 12px",
                  fontFamily: "inherit",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

/** What the box would do if left blank — the plan's own allowance. */
function placeholderFor(plan: OrgPlan, kind: "grade" | "generate"): string {
  const tier = PLAN_TIERS[plan];
  const value = kind === "grade" ? tier.gradeLimit : tier.generateLimit;
  return value == null ? "unlimited" : String(value);
}
