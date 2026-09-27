import Link from "next/link";

import type { FreeTrialCopy } from "@/lib/free-practice/copy";
import { BRAND, BRAND_FILL, BRAND_LINE, BRAND_SOFT, SLATE_BODY, SLATE_INK, WHITE } from "@/lib/theme/tokens";

/**
 * The sign-in recommendation inside the three free runners (/grade/today,
 * /read/free, /listen/free): a strip while the practice is in use, and a card
 * on the result. The words come from `freeTrialCopy` — see lib/free-practice/
 * copy.ts for why every runner shows the same ones.
 *
 * Server-safe (no hooks), so a client runner and a server page can both use it.
 * BRAND on BRAND_SOFT is the pairing the palette test holds to AA in dark mode;
 * the button is BRAND_FILL + WHITE, the pair made to carry white.
 */

/** One line at the top of a runner — present for the whole practice, quiet
 *  enough not to compete with the questions. */
export function FreeTrialStrip({ copy }: { copy: FreeTrialCopy }) {
  return (
    <div
      role="note"
      style={{
        flexShrink: 0,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px 12px",
        padding: "7px 16px",
        background: BRAND_SOFT,
        borderBottom: `1px solid ${BRAND_LINE}`,
        fontSize: 13.5,
        lineHeight: 1.45,
        color: SLATE_INK,
        textAlign: "center",
      }}
    >
      <span style={{ fontWeight: 600 }}>{copy.lead}</span>
      <Link href={copy.href} style={{ color: BRAND, fontWeight: 700, textDecoration: "none" }}>
        {copy.cta} →
      </Link>
    </div>
  );
}

/** The result's card — the moment a visitor has just seen what the marking
 *  does, so the ask is at its strongest here. */
export function FreeTrialCard({ copy }: { copy: FreeTrialCopy }) {
  return (
    <section
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        margin: "0 0 20px",
        padding: "16px 18px",
        borderRadius: 14,
        background: BRAND_SOFT,
        border: `1px solid ${BRAND_LINE}`,
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 320px" }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, color: SLATE_INK }}>{copy.title}</div>
        <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.55, color: SLATE_BODY }}>{copy.body}</div>
      </div>
      <Link
        href={copy.href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: BRAND_FILL,
          color: WHITE,
          borderRadius: 11,
          padding: "11px 18px",
          fontWeight: 700,
          fontSize: 14.5,
          textDecoration: "none",
        }}
      >
        {copy.cta} →
      </Link>
    </section>
  );
}

/**
 * A whole free-practice page when today's free practice is already used:
 * the practice stays shut and the page says why, with the recommendation to
 * sign in as the one way forward. Clicking a card still lands here — on our
 * practice page, never the dashboard (owner, 2026-09-27).
 */
export function FreeTrialGate({
  copy,
  title,
  body,
  backHref,
  backLabel,
}: {
  copy: FreeTrialCopy;
  title: string;
  body: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <section
        style={{
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          padding: "30px 26px",
          borderRadius: 18,
          background: BRAND_SOFT,
          border: `1px solid ${BRAND_LINE}`,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: SLATE_INK }}>{title}</h1>
        <p style={{ margin: "10px 0 0", fontSize: 15.5, lineHeight: 1.6, color: SLATE_BODY }}>{body}</p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 20 }}>
          <Link
            href={copy.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: BRAND_FILL,
              color: WHITE,
              borderRadius: 999,
              padding: "12px 22px",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            {copy.cta} →
          </Link>
          <Link href={backHref} style={{ color: BRAND, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
            ← {backLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
