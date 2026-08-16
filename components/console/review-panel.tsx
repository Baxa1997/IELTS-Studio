"use client";

import { useActionState, useState } from "react";

import { reviewAttempt, type ReviewState } from "@/app/(app)/console/marking-actions";
import { WRITING_CRITERIA, type AttemptKind } from "@/lib/console/attempts";

/**
 * The footer of an attempt report: what the AI said, what the centre says, and
 * who decided.
 *
 * WHY BOTH NUMBERS STAY ON SCREEN. The temptation is to show one band — the
 * "right" one — and keep the AI's answer in the database. That is exactly the
 * thing a centre cannot defend: a parent who is told 6.5 and later sees 6.0 on
 * a screenshot has caught the school changing a mark. Showing both, with a
 * sentence explaining the move, is not an admission of a weak grader; it is the
 * only version of this that survives contact with a parent.
 *
 * The reason is required for the same reason. A correction with no sentence is
 * indistinguishable from a mistake.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#E4E2DC";
const INDIGO = "#4340CB";
const GREEN = "#16794C";
const AMBER = "#8A5A12";

const BANDS = Array.from({ length: 19 }, (_, i) => i / 2); // 0.0 … 9.0

export interface ReviewPanelProps {
  kind: AttemptKind;
  refId: string;
  /** What the model said. Null when this attempt never got a band. */
  aiBand: number | null;
  /** Per-criterion AI bands, writing only. */
  aiCriteria?: Record<string, number | null>;
  /** The existing verdict, if a human has already given one. */
  review: {
    aiBand: number | null;
    finalBand: number;
    criteria: Record<string, { band: number; was: number | null }> | null;
    reason: string;
    reviewerName: string | null;
    reviewedAt: string;
  } | null;
  /** False when the centre's policy says this person may not correct a band. */
  canReview: boolean;
  /** Why not, when they can't — so the panel explains instead of vanishing. */
  lockedNote?: string;
}

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 12,
  marginTop: 18,
  overflow: "hidden",
};

const field: React.CSSProperties = {
  border: `1px solid #DDD9D0`,
  borderRadius: 8,
  padding: "8px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

export function ReviewPanel({
  kind,
  refId,
  aiBand,
  aiCriteria,
  review,
  canReview,
  lockedNote,
}: ReviewPanelProps) {
  const [state, action, pending] = useActionState(reviewAttempt, {} as ReviewState);
  const [open, setOpen] = useState(false);
  const [band, setBand] = useState<number>(review?.finalBand ?? aiBand ?? 6);

  const moved = review != null && review.aiBand != null && review.aiBand !== review.finalBand;

  return (
    <section style={card} aria-label="Marking">
      {/* ── the stamp, always visible, student included ─────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          padding: "14px 18px",
          background: review ? "#F7FAF8" : "#FBFAF7",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 11.5, color: FAINT }}>AI band</span>
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: moved ? MUTED : INK,
              textDecoration: moved ? "line-through" : "none",
            }}
          >
            {aiBand?.toFixed(1) ?? "—"}
          </span>
        </span>

        {review ? (
          <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: FAINT }}>Final band</span>
            <span style={{ fontSize: 21, fontWeight: 700, color: GREEN, letterSpacing: "-.02em" }}>
              {review.finalBand.toFixed(1)}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 12.5, color: AMBER, fontWeight: 600 }}>
            Not yet reviewed by a teacher
          </span>
        )}

        <span style={{ marginLeft: "auto", fontSize: 11.5, color: FAINT, textAlign: "right" }}>
          {review
            ? `Marked by AI · reviewed by ${review.reviewerName ?? "a teacher"} · ${new Date(
                review.reviewedAt,
              ).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
            : "Marked by AI"}
        </span>
      </div>

      {review ? (
        <p
          style={{
            margin: 0,
            padding: "12px 18px",
            fontSize: 13,
            color: INK,
            lineHeight: 1.6,
            borderBottom: canReview ? `1px solid ${LINE}` : 0,
          }}
        >
          <span style={{ color: FAINT }}>Teacher&rsquo;s note: </span>
          {review.reason}
        </p>
      ) : null}

      {!canReview ? (
        lockedNote ? (
          <p style={{ margin: 0, padding: "12px 18px", fontSize: 12.5, color: FAINT }}>
            {lockedNote}
          </p>
        ) : null
      ) : !open ? (
        <div style={{ padding: "12px 18px" }}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              background: review ? "transparent" : INDIGO,
              color: review ? INDIGO : "#fff",
              border: review ? `1px solid ${LINE}` : 0,
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {review ? "Change this verdict" : "Review this mark"}
          </button>
          {!review ? (
            <span style={{ marginLeft: 10, fontSize: 12, color: FAINT }}>
              Agreeing still counts — it puts your centre&rsquo;s name on the band.
            </span>
          ) : null}
        </div>
      ) : (
        <form action={action} style={{ padding: "14px 18px", display: "grid", gap: 14 }}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="ref_id" value={refId} />

          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
            <label>
              <span
                style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 5, color: INK }}
              >
                Final band
              </span>
              <select
                name="final_band"
                value={band}
                onChange={(e) => setBand(Number(e.target.value))}
                style={{ ...field, width: 100 }}
              >
                {BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
            {aiBand != null ? (
              <span style={{ fontSize: 12.5, color: band === aiBand ? GREEN : AMBER, paddingBottom: 9 }}>
                {band === aiBand
                  ? "Agreeing with the AI."
                  : `${band > aiBand ? "Raising" : "Lowering"} it by ${Math.abs(band - aiBand).toFixed(1)}.`}
              </span>
            ) : null}
          </div>

          {/* Per-criterion, writing only. The other three skills do not store a
              criterion breakdown, and inventing one here would put numbers on a
              report that nothing else in the product can explain. */}
          {kind === "writing" && aiCriteria ? (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 7 }}>
                Per criterion{" "}
                <span style={{ fontWeight: 400, color: FAINT }}>— leave any you agree with</span>
              </legend>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}
              >
                {WRITING_CRITERIA.map((c) => {
                  const was = aiCriteria[c.key] ?? null;
                  const current = review?.criteria?.[c.key]?.band ?? was ?? undefined;
                  return (
                    <label key={c.key} style={{ fontSize: 12, color: MUTED }}>
                      <span style={{ display: "block", marginBottom: 4 }}>
                        {c.label}
                        {was != null ? (
                          <span style={{ color: FAINT }}> · AI {was.toFixed(1)}</span>
                        ) : null}
                      </span>
                      <select
                        name={`criterion_${c.key}`}
                        defaultValue={current ?? ""}
                        style={{ ...field, width: "100%" }}
                      >
                        <option value="">—</option>
                        {BANDS.map((b) => (
                          <option key={b} value={b}>
                            {b.toFixed(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <label>
            <span
              style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 5, color: INK }}
            >
              Why{" "}
              <span style={{ fontWeight: 400, color: FAINT }}>
                — one line, and the student reads it
              </span>
            </span>
            <input
              name="reason"
              required
              minLength={3}
              maxLength={1000}
              defaultValue={review?.reason ?? ""}
              placeholder="Task Response is stronger than the model credited — both parts are addressed."
              style={{ ...field, width: "100%" }}
            />
          </label>

          {state.error ? (
            <p style={{ margin: 0, fontSize: 12.5, color: "#A63A30" }} role="alert">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p style={{ margin: 0, fontSize: 12.5, color: GREEN }}>{state.ok}</p>
          ) : null}

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="submit"
              disabled={pending}
              style={{
                background: GREEN,
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: "9px 16px",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: pending ? "wait" : "pointer",
              }}
            >
              {pending ? "Saving…" : aiBand != null && band === aiBand ? "Confirm this band" : "Record my band"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: 0,
                fontFamily: "inherit",
                fontSize: 12.5,
                color: MUTED,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
