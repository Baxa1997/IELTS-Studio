"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { FAINT, INK, LINE, MUTED, SANS, SERIF, TONE } from "@/components/admin/ui";
import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";

import { loadAccountUsage, setAccountPlan, setAccountSuspended, type ReviewState } from "../actions";

/**
 * Plan and limits for one account, as the design draws it.
 *
 * A CENTRED DIALOG, not a popover pinned to the row. The design makes this
 * choice and it is the right one for a table of five hundred: a popover on row
 * 400 opens below the fold, and the thing being edited is a person, not a cell.
 *
 * The plan is four buttons rather than a select because there are exactly four
 * and they are the whole decision — a select hides three of them behind a click
 * and gives no room to show which is current.
 *
 * THE WARNING IS STILL THE POINT. Plans live on the organization, so editing
 * anyone inside a centre moves the whole centre. That is a fact of the schema,
 * not a bug, and the only honest thing is to say so before the click. The
 * member count goes back to the server with the form, which refuses the write
 * if the roll changed since this rendered.
 */

const field: React.CSSProperties = {
  width: "100%",
  border: `1px solid #E4E2DC`,
  borderRadius: 8,
  padding: "10px 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

export interface ManageTarget {
  profileId: string;
  name: string;
  email: string | null;
  initials: string;
  plan: OrgPlan;
  orgKind: "personal" | "center";
  orgName: string;
  gradingLimit: number | null;
  generationLimit: number | null;
  orgMemberCount: number;
  suspended: boolean;
}

export function ManageModal({
  target,
  onClose,
}: {
  target: ManageTarget | null;
  onClose: () => void;
}) {
  const [planState, planAction, planPending] = useActionState(setAccountPlan, {} as ReviewState);
  const [susState, susAction, susPending] = useActionState(
    setAccountSuspended,
    {} as ReviewState,
  );
  const [plan, setPlan] = useState<OrgPlan>(target?.plan ?? "trial");
  const [usage, setUsage] = useState<Awaited<ReturnType<typeof loadAccountUsage>>>(null);

  // Follow the row that was opened: the same modal serves every row, so the
  // picker has to reset when a different person is chosen.
  const [seenId, setSeenId] = useState<string | null>(null);
  if (target && target.profileId !== seenId) {
    setSeenId(target.profileId);
    setPlan(target.plan);
    setUsage(null);
  }

  // Close once a write lands — the table re-renders from the server, and
  // leaving this open would show stale inputs over fresh data.
  const notice = planState.notice ?? susState.notice;
  const [seenNotice, setSeenNotice] = useState<string | undefined>(undefined);
  if (notice && notice !== seenNotice) {
    setSeenNotice(notice);
    onClose();
  }

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  // One lookup per open, and it is allowed to lose the race: `live` guards
  // against a slow answer for a row the owner has already clicked past.
  const id = target?.profileId;
  useEffect(() => {
    if (!id) return;
    let live = true;
    void loadAccountUsage(id).then((u) => {
      if (live) setUsage(u);
    });
    return () => {
      live = false;
    };
  }, [id]);

  if (!target || typeof document === "undefined") return null;
  const shared = target.orgMemberCount > 1;
  const error = planState.error ?? susState.error;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Plan and limits for ${target.name}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: SANS,
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(14,13,38,.5)" }}
        aria-hidden
      />
      <div
        style={{
          position: "relative",
          width: "min(460px, 100%)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 30px 70px rgba(14,13,38,.34)",
        }}
      >
        {/* ── who ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 22px",
            borderBottom: `1px solid #F0EEE9`,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#DEDDF6",
              color: "#3B38B0",
              fontSize: 13,
              fontWeight: 600,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {target.initials}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, color: INK }}>
              {target.name}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "#7C7A93",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {target.orgKind === "center" ? target.orgName : "Individual account"}
              {target.email ? ` · ${target.email}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              background: "#F4F3EF",
              border: `1px solid #E4E2DC`,
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              color: MUTED,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form action={planAction} style={{ padding: "20px 22px" }}>
          <input type="hidden" name="profile_id" value={target.profileId} />
          <input type="hidden" name="member_count" value={target.orgMemberCount} />
          <input type="hidden" name="plan" value={plan} />

          {shared ? (
            <div
              style={{
                background: TONE.amber.tint,
                border: `1px solid ${TONE.amber.border}`,
                borderRadius: 10,
                padding: "11px 13px",
                fontSize: 12.5,
                color: "#8A5B12",
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              This changes the plan for <strong>{target.orgName}</strong> and all{" "}
              {target.orgMemberCount} members, not just this person.
            </div>
          ) : null}

          <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 7 }}>
            Plan
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 7,
              marginBottom: 18,
            }}
          >
            {PLAN_ORDER.map((p) => {
              const on = p === plan;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  aria-pressed={on}
                  style={{
                    borderRadius: 9,
                    padding: "9px 4px",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: `1px solid ${on ? TONE.indigo.ink : "#E4E2DC"}`,
                    background: on ? TONE.indigo.tint : "#fff",
                    color: on ? TONE.indigo.ink : INK,
                  }}
                >
                  {PLAN_TIERS[p].name}
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label
                htmlFor="grading_limit"
                style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}
              >
                Gradings a month
              </label>
              <input
                id="grading_limit"
                name="grading_limit"
                inputMode="numeric"
                defaultValue={target.gradingLimit ?? ""}
                placeholder={String(PLAN_TIERS[plan].gradeLimit ?? "unlimited")}
                style={field}
              />
            </div>
            <div>
              <label
                htmlFor="generation_limit"
                style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 6 }}
              >
                Practices a month
              </label>
              <input
                id="generation_limit"
                name="generation_limit"
                inputMode="numeric"
                defaultValue={target.generationLimit ?? ""}
                placeholder={String(PLAN_TIERS[plan].generateLimit ?? "unlimited")}
                style={field}
              />
            </div>
          </div>

          <div
            style={{
              background: "#F7F6F2",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 12.5,
              color: MUTED,
              lineHeight: 1.5,
            }}
          >
            Leave a limit blank to use the plan&apos;s own allowance.{" "}
            <strong style={{ color: INK }}>0 blocks it entirely.</strong>{" "}
            {/* What they have actually spent this month — the number that makes
                a limit decision an informed one rather than a guess. Fetched
                when the dialog opens, so the table costs nothing for it. */}
            {usage
              ? `Used ${usage.gradeUsed} of ${usage.gradeLimit ?? "unlimited"} gradings and ${usage.practiceUsed} of ${usage.practiceLimit ?? "unlimited"} practices this month.`
              : "Checking this month’s usage…"}
          </div>

          {error ? (
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: TONE.red.ink }} role="alert">
              {error}
            </p>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid #F0EEE9`,
            }}
          >
            {/* Its own form, submitted separately — suspending is not a variant
                of saving a plan, and nesting forms is invalid HTML besides. */}
            <button
              type="submit"
              form={`suspend-${target.profileId}`}
              disabled={susPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                border: `1px solid ${target.suspended ? TONE.green.border : TONE.red.border}`,
                background: "#fff",
                borderRadius: 9,
                padding: "10px 13px",
                fontFamily: "inherit",
                fontSize: 12.5,
                cursor: susPending ? "default" : "pointer",
                color: target.suspended ? TONE.green.ink : TONE.red.ink,
                whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="12" r="9" />
                <path d="M10 8v8M14 8v8" />
              </svg>
              {susPending ? "…" : target.suspended ? "Restore" : "Suspend"}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                marginLeft: "auto",
                background: "#F4F3EF",
                border: `1px solid #E4E2DC`,
                borderRadius: 9,
                padding: "10px 16px",
                fontFamily: "inherit",
                fontSize: 13,
                cursor: "pointer",
                color: INK,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={planPending}
              style={{
                background: TONE.indigo.ink,
                color: "#fff",
                border: 0,
                borderRadius: 9,
                padding: "10px 20px",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: planPending ? "default" : "pointer",
              }}
            >
              {planPending ? "Saving…" : shared ? `Apply to all ${target.orgMemberCount}` : "Save"}
            </button>
          </div>
        </form>

        {/* Outside the plan form, referenced by `form=` above. */}
        <form id={`suspend-${target.profileId}`} action={susAction}>
          <input type="hidden" name="profile_id" value={target.profileId} />
          <input type="hidden" name="member_count" value={target.orgMemberCount} />
          <input type="hidden" name="suspend" value={target.suspended ? "0" : "1"} />
          <input type="hidden" name="label" value={target.name} />
        </form>

        {shared ? (
          <p
            style={{
              margin: 0,
              padding: "0 22px 18px",
              fontSize: 11.5,
              color: FAINT,
              lineHeight: 1.5,
            }}
          >
            Suspending locks out every member of {target.orgName}. Nothing is deleted — restoring
            lets them all sign in again.
          </p>
        ) : null}

        <div style={{ height: 1, background: LINE, opacity: 0 }} />
      </div>
    </div>,
    document.body,
  );
}
