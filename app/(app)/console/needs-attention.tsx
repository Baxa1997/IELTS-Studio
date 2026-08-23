"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FAINT, INK, MUTED } from "@/lib/theme/tokens";
import { SANS, TINT, type Tone } from "@/components/console/crm-ui";
import { useActionFeedback } from "@/components/console/toast";
import { type Alert, type Severity } from "@/lib/console/alert-catalogue";

import { dismissAlert, restoreAlert, type ActionState } from "./center-actions";

/**
 * Needs attention — the strongest thing on this page, and the one panel a
 * centre owner reads every morning.
 *
 * SEVERITY IS A COLOUR, NOT A LABEL. Nobody reads the word "high"; they read
 * red. The tone carries it, which leaves the row's words free to say what is
 * actually wrong and how old it is.
 */

const TONE_OF: Record<Severity, Tone> = { high: "red", medium: "amber", low: "indigo" };

/** `4 days` / `6 hours`. An age nobody can feel is an age nobody acts on. */
function aged(hours: number): string | null {
  if (hours < 2) return null;
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function NeedsAttention({
  alerts,
  dismissed,
  canDismiss,
  hiddenCount,
}: {
  alerts: Alert[];
  dismissed: { key: string; until: string }[];
  canDismiss: boolean;
  /** Fired but trimmed by the six-row cap. */
  hiddenCount: number;
}) {
  const [dState, dAction] = useActionState(dismissAlert, {} as ActionState);
  const [rState, rAction] = useActionState(restoreAlert, {} as ActionState);
  useActionFeedback(dState, { keepOpen: true });
  useActionFeedback(rState, { keepOpen: true });

  return (
    <>
      {alerts.map((a) => {
        const tint = TINT[TONE_OF[a.severity]];
        const age = aged(a.ageHours);
        return (
          <div
            key={a.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderBottom: "1px solid #DEDEDA",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 30,
                height: 30,
                flex: "0 0 30px",
                borderRadius: 8,
                background: tint.bg,
                color: tint.fg,
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {a.icon}
            </span>

            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: INK,
                }}
              >
                {a.title}
                {age ? (
                  <span style={{ fontWeight: 400, color: FAINT }}> · oldest {age}</span>
                ) : null}
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: SANS,
                  fontSize: 12,
                  color: MUTED,
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.detail}
              </span>
            </span>

            {/* Dismissal is the owner's alone — a teacher silencing "3 registers
                not marked" is the person the alert is about. */}
            {canDismiss ? (
              <form action={dAction}>
                <input type="hidden" name="alert_key" value={a.key} />
                <button
                  type="submit"
                  title="Put this down for 7 days — it comes back if it is still true"
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: "4px 6px",
                    fontFamily: SANS,
                    fontSize: 11.5,
                    color: FAINT,
                    cursor: "pointer",
                  }}
                >
                  dismiss
                </button>
              </form>
            ) : null}

            <Link
              href={a.href}
              className="cn-chip"
              style={{
                flex: "none",
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 600,
                color: "#4340CB",
                textDecoration: "none",
                border: "1px solid #C5C4BE",
                borderRadius: 8,
                padding: "6px 11px",
                background: "#fff",
                whiteSpace: "nowrap",
              }}
            >
              {a.cta}
            </Link>
          </div>
        );
      })}

      {alerts.length === 0 ? (
        <div style={{ padding: 18, fontFamily: SANS, fontSize: 13, color: FAINT }}>
          Nothing needs you right now — every group has practice set, every register is marked, and
          everyone has practised in the last two weeks.
        </div>
      ) : null}

      {/* What the six-row cap is hiding, and what has been silenced. Both said
          out loud: a panel that quietly drops things is a panel you cannot
          trust to be the whole picture. */}
      {hiddenCount > 0 || dismissed.length > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            padding: "10px 18px",
            fontFamily: SANS,
            fontSize: 11.5,
            color: FAINT,
          }}
        >
          {hiddenCount > 0 ? <span>{hiddenCount} more not shown.</span> : null}
          {dismissed.map((d) => (
            <form key={d.key} action={rAction} style={{ display: "inline" }}>
              <input type="hidden" name="alert_key" value={d.key} />
              <button
                type="submit"
                disabled={!canDismiss}
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  fontFamily: SANS,
                  fontSize: 11.5,
                  color: FAINT,
                  cursor: canDismiss ? "pointer" : "default",
                  textDecoration: canDismiss ? "underline" : "none",
                  textUnderlineOffset: 3,
                }}
              >
                {d.key.replaceAll("_", " ")} silenced until{" "}
                {new Date(d.until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {canDismiss ? " — restore" : ""}
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </>
  );
}
