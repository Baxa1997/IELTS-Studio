"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";

import { BODY, BRAND, BRAND_TINT, DISPLAY, INK, LINE, MUTED, PANEL, RADIUS, SANS, WELL, solidButton } from "@/app/_landing/_lib/design";
import { useT } from "@/shared/components/i18n/locale-provider";

/**
 * Shown once the free gradings are spent — the server's per-IP ceiling, which
 * the counter on the page mirrors. The way on is an account; the button says so
 * in the owner's words for every free practice ("Sign in to get more free
 * practices", `free.moreCta`), so the checker and the daily practice make the
 * same offer.
 */
export function SignupWall({ onClose }: { onClose: () => void }) {
  const t = useT();

  // Close on Escape; lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gr-wall-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "var(--tk-scrim)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        fontFamily: SANS,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: RADIUS.card,
          boxShadow: "0 40px 80px -30px rgba(0,0,0,.45)",
          padding: "32px 28px 26px",
          textAlign: "center",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("grade.close")}
          className="gr-pill"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: RADIUS.pill,
            border: `1px solid ${LINE}`,
            background: WELL,
            color: MUTED,
            cursor: "pointer",
          }}
        >
          <X size={16} strokeWidth={2.2} aria-hidden />
        </button>
        <div
          aria-hidden
          style={{
            width: 52,
            height: 52,
            margin: "0 auto",
            borderRadius: 16,
            background: BRAND_TINT,
            color: BRAND,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={24} strokeWidth={2} />
        </div>
        <h3
          id="gr-wall-title"
          style={{ margin: "16px 0 0", fontFamily: DISPLAY, fontWeight: 600, fontSize: 23, letterSpacing: "-0.02em", color: INK }}
        >
          {t("grade.wallTitle")}
        </h3>
        <p style={{ margin: "10px auto 0", fontSize: 15, lineHeight: 1.6, color: BODY, maxWidth: 350 }}>{t("grade.wallBody")}</p>
        <Link
          href="/sign-in"
          className="lp-solid"
          style={{ ...solidButton("md"), display: "block", marginTop: 22, textDecoration: "none" }}
        >
          {t("free.moreCta")}
        </Link>
      </div>
    </div>
  );
}
