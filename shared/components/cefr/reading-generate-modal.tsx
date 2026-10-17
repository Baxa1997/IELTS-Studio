"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, FileText, Layers, X } from "lucide-react";
import {
  BRAND,
  BRAND_SOFT,
  PANEL,
  SLATE_BODY as MUTED,
  SLATE_INK as INK,
  SLATE_MUTED,
  SLATE_MUTED as FAINT,
} from "@/lib/theme/tokens";

import { READING_PARTS } from "./catalogue";
import { SANS, SERIF } from "./design";

// ---- Reading generate picker (Full CEFR reading / Single part) -------------

type ModalStep = "choose" | "passage";

/** Opened from the single "AI Generate Reading" CTA. Two choices only: the full
 *  5-part DTM paper, or a single-part practice — the latter drills into a second
 *  step to pick which of the 5 parts (same list as the standalone grid below it). */
export function ReadingGenerateModal({
  onClose,
  onFull,
  onPart,
}: {
  onClose: () => void;
  onFull: () => void;
  onPart: (part: number) => void;
}) {
  const [step, setStep] = useState<ModalStep>("choose");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rd-gen-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "var(--ex-scrim)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: PANEL,
          borderRadius: 20,
          padding: "26px 26px 22px",
          boxShadow: "0 40px 90px -40px rgba(20,20,48,.6), 0 0 0 1px var(--ex-ring)",
          fontFamily: SANS,
          color: INK,
        }}
      >
        {step === "choose" ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <h2
                  id="rd-gen-title"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: 22,
                    margin: 0,
                    color: INK,
                  }}
                >
                  AI Generate Reading
                </h2>
                <p style={{ fontSize: 14, color: MUTED, margin: "6px 0 0" }}>
                  Choose how you want to practise.
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" style={modalCloseBtn}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <ModalOption
                Icon={Layers}
                title="Full CEFR reading"
                desc="All 5 parts, 35 questions — the complete DTM paper, timed like the real exam."
                meta="60 min · 35 Qs"
                onClick={onFull}
              />
              <ModalOption
                Icon={FileText}
                title="Single part practice"
                desc="Pick one part on its own — a shorter, focused session with a 20-minute limit."
                meta="1 part · 20 min"
                onClick={() => setStep("passage")}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <button type="button" onClick={() => setStep("choose")} style={modalBackBtn}>
                  <ArrowLeft size={13} /> Back
                </button>
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: 22,
                    margin: "10px 0 0",
                    color: INK,
                  }}
                >
                  Choose a part
                </h2>
                <p style={{ fontSize: 14, color: MUTED, margin: "6px 0 0" }}>
                  Each part is a self-contained passage — pick one to practise.
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" style={modalCloseBtn}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
              {READING_PARTS.map((p) => (
                <ModalOption
                  key={p.part}
                  Icon={p.Icon}
                  title={`Part ${p.part} · ${p.title}`}
                  desc={p.desc}
                  meta={`${p.level} · ${p.count} questions`}
                  onClick={() => onPart(p.part)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModalOption({
  Icon,
  title,
  desc,
  meta,
  onClick,
}: {
  Icon: typeof BookOpen;
  title: string;
  desc: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lp-hover"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: "left",
        width: "100%",
        background: PANEL,
        border: "1px solid var(--pc-border)",
        borderRadius: 14,
        padding: 14,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: BRAND_SOFT,
          color: BRAND,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={19} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{ display: "block", fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK }}
        >
          {title}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: SANS,
            fontSize: 13,
            color: SLATE_MUTED,
            marginTop: 2,
            lineHeight: 1.45,
          }}
        >
          {desc}
        </span>
      </span>
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: FAINT, whiteSpace: "nowrap" }}>{meta}</span>
        <ArrowRight size={15} strokeWidth={2.2} color={BRAND} />
      </span>
    </button>
  );
}

const modalCloseBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 9,
  border: "1px solid var(--pc-border)",
  background: PANEL,
  color: MUTED,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};
const modalBackBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  background: "transparent",
  color: BRAND,
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
};
