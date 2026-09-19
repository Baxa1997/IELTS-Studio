"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

import { planTier } from "@/lib/billing/plans";
import { BRAND, BRAND_FILL, BRAND_LINE, SLATE_BODY, SLATE_INK, WHITE } from "@/lib/theme/tokens";

const SANS = "var(--font-hanken), system-ui, sans-serif";

/** True when an API/engine error message is the monthly quota running out (the
 *  engine 429 says "quota is used up"; the grade route's client copy says
 *  "monthly grading limit"). Everything else is an ordinary failure. */
export function isQuotaMessage(message: string): boolean {
  return /quota|monthly (grading|practice) limit|free (gradings|practice)/i.test(message);
}

/** Start a Pro checkout (Stripe via /api/billing/checkout — the API layer owns
 *  billing). On success the browser leaves for Stripe; errors surface as copy. */
export function useProCheckout() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "pro", provider: "stripe" }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && body.url) {
        window.location.href = body.url; // off to Stripe Checkout
        return;
      }
      setError(
        body.error === "stripe_unavailable"
          ? "Card payments aren't enabled yet — please check back soon."
          : "Couldn't start the checkout — please try again.",
      );
    } catch {
      setError("Network error — please try again.");
    }
    setBusy(false);
  }

  return { busy, error, start };
}

/** Compact "Upgrade to Pro" pill — for tight spots like the dark AI banner. */
export function UpgradeProButton({ onDark = false }: { onDark?: boolean }) {
  const { busy, error, start } = useProCheckout();
  const pro = planTier("pro");
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 14px",
          borderRadius: 10,
          border: onDark ? "1px solid rgba(255,255,255,.35)" : "none",
          background: onDark ? "rgba(255,255,255,.14)" : BRAND,
          color: WHITE,
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 700,
          cursor: busy ? "default" : "pointer",
        }}
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={14} /> Opening checkout…
          </>
        ) : (
          <>
            Upgrade to Pro — ${pro.price}/mo <ArrowRight size={14} />
          </>
        )}
      </button>
      {error ? (
        <span style={{ fontFamily: SANS, fontSize: 12, color: onDark ? "#fecaca" : "#B4231F" }}>
          {error}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Error slot for the practice hubs/studios. Ordinary errors render as the usual
 * red alert; quota errors render as an upgrade card with a live "Upgrade to Pro"
 * checkout button.
 */
export function UpgradeNotice({ message }: { message: string }) {
  const { busy, error: checkoutError, start } = useProCheckout();

  if (!isQuotaMessage(message)) {
    return (
      <p
        role="alert"
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: "#B4231F",
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 10,
          padding: "10px 12px",
          margin: "14px 0 0",
        }}
      >
        {message}
      </p>
    );
  }

  const pro = planTier("pro");

  return (
    <div
      role="alert"
      style={{
        fontFamily: SANS,
        margin: "16px 0 0",
        background: "linear-gradient(120deg,#FDF4F7,#FDF4F7)",
        border: `1px solid ${BRAND_LINE}`,
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 240, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14.5,
            fontWeight: 700,
            color: SLATE_INK,
          }}
        >
          <Sparkles size={16} style={{ color: BRAND }} /> Free practice used up
        </div>
        <p style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.5, color: SLATE_BODY }}>
          {message} Pro gives you unlimited gradings and practice sets every month.
        </p>
        {checkoutError ? (
          <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#B4231F" }}>{checkoutError}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 18px",
          borderRadius: 11,
          border: "none",
          background: BRAND_FILL,
          color: WHITE,
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 700,
          cursor: busy ? "default" : "pointer",
          boxShadow: "0 10px 22px -10px rgba(125,1,50,.6)",
        }}
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={15} /> Opening checkout…
          </>
        ) : (
          <>
            Upgrade to Pro — ${pro.price}/mo <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
}
