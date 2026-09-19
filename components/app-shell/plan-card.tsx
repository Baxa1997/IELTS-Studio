"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Crown, Layers, type LucideIcon, Mic, SquarePen } from "lucide-react";

import { Modal } from "@/components/ui/interactive";
import type { Quota, UsageSummary } from "@/lib/quota";
import { SANS, WHITE } from "@/lib/theme/tokens";

/**
 * The learner's PLAN, pinned to the foot of the sidebar rail — as a BUTTON.
 *
 * It was a card: plan name, three quota meters and an outlined upgrade button,
 * about 180px of a 250px rail. The owner asked for the Base44 reference instead
 * (2026-09-17): one compact row, "Upgrade your plan" over a short line with the
 * crown on the right, that opens a dialog holding the detail — what is left of
 * each allowance, and the upgrade button. Nothing the card showed was dropped;
 * it moved behind the click.
 *
 * ⚠️ THE "RUNNING OUT" SIGNAL STAYS IN THE RAIL. The card's meters were the
 * only thing telling a learner they were about to hit a wall, and hiding that
 * behind a click hides it exactly when it matters. So once an allowance is
 * spent, the button's second line says which one, in red.
 *
 * In the collapsed 72px rail it is just the crown in a bordered tile (owner's
 * design), and the same click opens the same dialog.
 */

/** The rail's single hue — the Base44 reference's orange — on the crown only. */
const ACCENT = "#d2571f";
const INK = "#16150f";
/** The rail's usual secondary grey (#8b8883) is 3.5:1 on white — too faint for
 *  a 12px line somebody is meant to read. This is 5.3:1. Mirrored in
 *  globals.css for the dialog's settings link. */
const SUB = "#6f6b64";
const LINE = "#e7e4dc";
const RED = "#b3261e";

type AllowanceKey = "grade" | "generate" | "speaking";

interface Allowance {
  key: AllowanceKey;
  label: string;
  /** What spends it — the counting rules live in lib/quota.ts and the engine's
   *  quota.py; this is the plain-English version of them. */
  covers: string;
  icon: LucideIcon;
}

const ALLOWANCES: readonly Allowance[] = [
  {
    key: "grade",
    label: "Gradings",
    covers: "Writing essays marked by the AI examiner",
    icon: SquarePen,
  },
  {
    key: "generate",
    label: "Practice sets",
    covers: "Each new Writing, Reading, Listening, Speaking or CEFR practice",
    icon: Layers,
  },
  {
    // Counted apart because a live 3-part exam is real audio minutes, not a
    // text call. A free plan gets exactly one.
    key: "speaking",
    label: "Speaking mocks",
    covers: "Full 3-part live Speaking tests with the AI examiner",
    icon: Mic,
  },
];

/** Used up this month. A limit of 0 is "not in this plan", not "spent". */
function isSpent(quota: Quota): boolean {
  return quota.limit != null && quota.limit > 0 && (quota.remaining ?? 0) <= 0;
}

/** The first allowance this month has used up, in the dialog's order. */
function spentAllowance(usage: UsageSummary): Allowance | null {
  return ALLOWANCES.find((a) => isSpent(usage[a.key])) ?? null;
}

/** Spelled as a char code on purpose: a literal one is invisible in the source,
 *  where `.replace(" ", " ")` reads as a line that does nothing. */
const NO_BREAK_SPACE = String.fromCharCode(0xa0);

const oneLine: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function PlanCard({ usage: fromLayout }: { usage: UsageSummary }) {
  /* Where the dialog is drawn, and whether it is open at all. Captured on the
     click rather than read from a ref during render. */
  const [host, setHost] = useState<HTMLElement | null>(null);
  const open = host !== null;
  const button = useRef<HTMLButtonElement>(null);

  /* The numbers the dialog fetched for itself. A layout does not re-render on a
     client-side navigation, so the copy it handed down can be a practice or a
     mock behind by the time anyone asks "what is left". If the layout DOES
     render again, its numbers are the newer ones and the fetched copy goes. */
  const [latest, setLatest] = useState<UsageSummary | null>(null);
  const [basis, setBasis] = useState(fromLayout);
  if (basis !== fromLayout) {
    setBasis(fromLayout);
    setLatest(null);
  }
  const usage = latest ?? fromLayout;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/usage", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { usage?: UsageSummary | null } | null) => {
        if (!cancelled && body?.usage) setLatest(body.usage);
      })
      .catch(() => {
        // The layout's numbers are already on screen; a failed refresh keeps them.
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const close = useCallback(() => {
    setHost(null);
    // Back to the control that opened it, not the top of the page.
    button.current?.focus();
  }, []);

  const upgradable = usage.plan !== "enterprise";
  const spent = spentAllowance(usage);

  const title = upgradable ? "Upgrade your plan" : `${usage.planName} plan`;

  return (
    <>
      <button
        ref={button}
        type="button"
        className="lp-plan-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        // The collapsed rail's hover tooltip: at 72px the crown is all that shows.
        data-label={title}
        /* ⚠️ INTO `.lp-root`, NOT <body>. The app's typefaces are CSS variables
           declared on that wrapper by the layout, so a dialog drawn under <body>
           loses them and falls back to the system font. It has to leave the rail
           all the same: on a phone the rail is a transformed drawer, and a
           transform makes `position: fixed` inside it stick to the drawer
           instead of the screen. */
        onClick={(e) => setHost(e.currentTarget.closest<HTMLElement>(".lp-root") ?? document.body)}
        /* LAYOUT INLINE, like every other row in this rail. globals.css holds the
           hover fill (an inline background would beat it) and the 72px crown
           tile, whose rules carry `!important` because they override these. */
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          minWidth: 0,
          padding: "10px 12px",
          border: `1px solid ${LINE}`,
          borderRadius: 12,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        {/* `lp-sb-label` is the rail's own text-collapse class: at 72px this
            column tweens to zero width with every other label, leaving the crown
            alone in its tile — the owner's collapsed design (2026-09-17). */}
        <span
          className="lp-sb-label"
          style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}
        >
          <span
            style={{
              ...oneLine,
              fontFamily: SANS,
              fontSize: 13.5,
              fontWeight: 600,
              lineHeight: 1.25,
              color: INK,
            }}
          >
            {title}
          </span>
          <span
            style={{
              ...oneLine,
              fontFamily: SANS,
              fontSize: 12,
              lineHeight: 1.3,
              color: spent ? RED : SUB,
              fontWeight: spent ? 600 : 400,
            }}
          >
            {spent
              ? `No ${spent.label.toLowerCase()} left`
              : upgradable
                ? `${usage.planName} · see what's left`
                : "See what's left this month"}
          </span>
        </span>
        <Crown size={17} strokeWidth={1.9} color={ACCENT} aria-hidden style={{ flex: "none" }} />
      </button>

      {host
        ? createPortal(<PlanDialog usage={usage} upgradable={upgradable} onClose={close} />, host)
        : null}
    </>
  );
}

function PlanDialog({
  usage,
  upgradable,
  onClose,
}: {
  usage: UsageSummary;
  upgradable: boolean;
  onClose: () => void;
}) {
  // UTC, because the window rolls over at midnight UTC (lib/quota.ts); a local
  // date would read "30 September" to anyone west of Greenwich. The space is a
  // non-breaking one so the note never strands "1" at the end of a line.
  const resets = new Date(usage.grade.resetAt)
    .toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })
    .replace(" ", NO_BREAK_SPACE);

  return (
    <Modal
      title={`${usage.planName} plan`}
      note={`What's left this month. Counts reset on ${resets}.`}
      onClose={onClose}
      width={440}
      footer={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Link
            href="/settings/billing"
            onClick={onClose}
            className="lp-plan-link"
            style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: SUB }}
          >
            Billing &amp; plan settings
          </Link>
          {upgradable ? (
            <Link
              href="/pricing"
              onClick={onClose}
              className="lp-plan-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 40,
                padding: "0 16px",
                borderRadius: 10,
                // The logo tile's #B8421E: white on it is 5.47:1, where the rail's
                // lighter orange only reaches 4.1:1. Its hover is a `filter` in
                // globals.css, which an inline background does not block.
                background: "#b8421e",
                color: WHITE,
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Crown size={16} strokeWidth={2} aria-hidden />
              Upgrade your plan
            </Link>
          ) : null}
        </div>
      }
    >
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          border: `1px solid ${LINE}`,
          borderRadius: 14,
          fontFamily: SANS,
        }}
      >
        {ALLOWANCES.map((allowance, i) => (
          <AllowanceRow
            key={allowance.key}
            allowance={allowance}
            quota={usage[allowance.key]}
            first={i === 0}
          />
        ))}
      </ul>
    </Modal>
  );
}

function AllowanceRow({
  allowance: { label, covers, icon: Icon },
  quota,
  first,
}: {
  allowance: Allowance;
  quota: Quota;
  first: boolean;
}) {
  const limit = quota.limit;
  const left = quota.remaining ?? 0;
  const spent = isSpent(quota);
  const metered = limit != null && limit > 0;
  const status =
    limit == null
      ? "Unlimited"
      : limit === 0
        ? "Not in your plan"
        : spent
          ? "None left"
          : `${left} of ${limit} left`;

  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "13px 14px",
        borderTop: first ? "none" : `1px solid ${LINE}`,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 34,
          height: 34,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          background: "#f7f5ee",
          border: "1px solid #ece9e1",
          color: "#3f3d39",
        }}
      >
        <Icon size={17} strokeWidth={1.9} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{label}</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: spent ? RED : INK,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {status}
          </span>
        </div>
        <div style={{ marginTop: 2, fontSize: 12.5, lineHeight: 1.4, color: SUB }}>{covers}</div>
        {metered ? (
          // What is LEFT, so the bar drains as the month goes — the same
          // reading the rail card had. The status line above carries the
          // number for a screen reader; the bar is decoration.
          <div
            aria-hidden
            style={{
              height: 5,
              marginTop: 9,
              borderRadius: 999,
              background: spent ? "#f5dedb" : "#eceae2",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.round((left / limit) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: "#4a463d",
              }}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}
