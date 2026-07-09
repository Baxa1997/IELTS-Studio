"use client";

import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  countWords,
  MAX_WORDS,
  MIN_WORDS,
  PUBLIC_PROMPTS,
} from "@/lib/public-grader/prompts";
import type { PublicTeaser } from "@/lib/public-grader/teaser";
import { bandColor } from "@/lib/ui/band";

type Status = "idle" | "grading" | "done" | "error";

// ---- Brand tokens (same palette as the internal essay-feedback page) ---------
const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const RED = "#C5503C";
const AMBER = "#B5852A";
const EMERALD = "#1F9D5E";
const LINE = "#E7E3D5";
const SOFT = "#FBFAF4";
const SOFT_LINE = "#EFECE0";

const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

// Free anonymous gradings before the sign-up wall. Mirrors the server's per-IP cap
// (PUBLIC_GRADER_PER_IP, default 3) so the UI blocks at the same point the API does.
const FREE_LIMIT = 3;
const USED_KEY = "eng_public_grade_used";

export function PublicGrader() {
  const [question, setQuestion] = useState(""); // the user's own question, or a filled sample
  const [essay, setEssay] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [reading, setReading] = useState(false); // photo/PDF → text in flight
  const [error, setError] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<PublicTeaser | null>(null);
  const [view, setView] = useState<"input" | "result">("input");
  const [used, setUsed] = useState(0); // successful free gradings so far
  const [showWall, setShowWall] = useState(false); // sign-up modal
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Restore the free-grading count so a refresh doesn't reset the limit.
  useEffect(() => {
    try {
      const n = Number(localStorage.getItem(USED_KEY) || "0");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate of the free-grading count from localStorage (unavailable during SSR)
      if (Number.isFinite(n) && n > 0) setUsed(n);
    } catch {
      /* localStorage unavailable — fall back to in-session counting */
    }
  }, []);

  // When the result appears, bring it to the top of the viewport (no scrolling to
  // find it) since the input card is now hidden.
  useEffect(() => {
    if (view === "result") rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  const atLimit = used >= FREE_LIMIT;
  const words = useMemo(() => countWords(essay), [essay]);
  const tooShort = words > 0 && words < MIN_WORDS;
  const tooLong = words > MAX_WORDS;
  const canGrade = status !== "grading" && !reading && words >= MIN_WORDS && !tooLong;

  const bumpUsed = useCallback(() => {
    setUsed((u) => {
      const next = u + 1;
      try {
        localStorage.setItem(USED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  async function grade() {
    if (atLimit) {
      setShowWall(true);
      return;
    }
    setStatus("grading");
    setError(null);
    setTeaser(null);
    try {
      const res = await fetch("/api/public/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No question sent → the grader marks the writing on its own merits.
        body: JSON.stringify({ customPrompt: question.trim() || undefined, essay }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        teaser?: PublicTeaser;
        error?: string;
      };
      if (res.ok && body.teaser) {
        setTeaser(body.teaser);
        setStatus("done");
        bumpUsed();
        setView("result");
        return;
      }
      setStatus("error");
      // Server also enforces the cap — a rate-limit means we're out of free grades.
      if (body.error === "rate_limited") {
        setUsed(FREE_LIMIT);
        setShowWall(true);
      } else {
        setError(messageFor(res.status, body.error));
      }
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  // Return to a blank input for another attempt — unless the free limit is spent,
  // in which case the sign-up wall opens instead.
  function gradeAnother() {
    if (atLimit) {
      setShowWall(true);
      return;
    }
    setTeaser(null);
    setEssay("");
    setError(null);
    setStatus("idle");
    setView("input");
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function transcribe(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      setError("File is too large — keep it under 8 MB.");
      return;
    }
    setReading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/public/transcribe", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (res.ok && body.text) {
        setEssay(body.text);
      } else {
        setError(transcribeMessageFor(body.error));
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = ""; // allow re-picking the same file
    }
  }

  const gradesLeft = Math.max(0, FREE_LIMIT - used);

  return (
    <div ref={rootRef} style={{ fontFamily: SANS, scrollMarginTop: 76 }}>
      {view === "result" && teaser ? (
        <Result teaser={teaser} onAgain={gradeAnother} atLimit={atLimit} gradesLeft={gradesLeft} />
      ) : (
      <>
      {/* ---- The one solid input card ---- */}
      <section style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 18, boxShadow: "0 20px 44px -32px rgba(26,33,56,.35)" }}>
        {/* question — optional: your own, a sample, or none */}
        <div style={{ padding: "16px 22px 14px", borderBottom: `1px solid ${SOFT_LINE}`, borderRadius: "18px 18px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".06em", color: "#9A9EAE", textTransform: "uppercase" }}>
              Question
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#B0AEA0", background: SOFT, border: `1px solid ${SOFT_LINE}`, padding: "1px 8px", borderRadius: 999 }}>
              optional
            </span>
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder="Paste the Task 2 question you wrote about — or leave this blank to grade your writing on its own."
            aria-label="The question you wrote about (optional)"
            className="focus:outline-none focus:ring-2 focus:ring-[#3B43B5]/20 focus:border-[#3B43B5]"
            style={{ display: "block", width: "100%", resize: "vertical", borderRadius: 10, border: "1px solid #E7E3D5", background: SOFT, padding: "10px 13px", fontFamily: SERIF, fontSize: 15, lineHeight: 1.55, color: "#262B3D" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, marginTop: 10 }}>
            <span style={{ fontSize: 12.5, color: "#9A9EAE", marginRight: 2 }}>Need one? Try a sample:</span>
            {PUBLIC_PROMPTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setQuestion(p.prompt)}
                style={{ height: 28, padding: "0 12px", borderRadius: 999, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: "1px solid #E2DED0", background: "#fff", color: "#41496A" }}
              >
                {p.title}
              </button>
            ))}
            {question ? (
              <button
                type="button"
                onClick={() => setQuestion("")}
                style={{ height: 28, padding: "0 10px", borderRadius: 999, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: "#9A9EAE" }}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* essay input — the main surface */}
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          rows={15}
          placeholder="Paste or write your essay here — or upload a photo / PDF below…"
          aria-label="Your essay"
          className="focus:outline-none"
          style={{ display: "block", width: "100%", resize: "vertical", minHeight: 300, border: "none", background: "#fff", padding: "20px 22px", fontFamily: SERIF, fontSize: 17, lineHeight: 1.9, color: "#262B3D" }}
        />

        {/* sticky action bar — always visible while you work */}
        <div style={{ position: "sticky", bottom: 0, zIndex: 5, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 16px", borderTop: `1px solid ${SOFT_LINE}`, background: "rgba(251,250,244,.94)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", borderRadius: "0 0 18px 18px" }}>
          <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void transcribe(f); }} />
          <button
            type="button"
            disabled={reading || status === "grading"}
            onClick={() => fileRef.current?.click()}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 15px", borderRadius: 10, border: "1px solid #E2DED0", background: "#fff", color: "#41496A", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: reading ? "default" : "pointer", opacity: reading ? 0.6 : 1 }}
          >
            {reading ? (
              <>
                <span className="animate-spin" style={{ width: 14, height: 14, borderRadius: "50%", border: "2.5px solid #E4E1F4", borderTopColor: INDIGO, display: "inline-block" }} aria-hidden />
                Reading your file…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#41496A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload photo or PDF
              </>
            )}
          </button>
          <span style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: tooLong ? RED : tooShort ? AMBER : "#9A9EAE" }}>
            {words} {words === 1 ? "word" : "words"}
            {tooShort ? ` · ${MIN_WORDS}+ to grade` : tooLong ? ` · max ${MAX_WORDS}` : ""}
          </span>
          <button
            type="button"
            disabled={!canGrade}
            onClick={grade}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              height: 46,
              padding: "0 30px",
              border: "none",
              borderRadius: 11,
              background: INDIGO,
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 15.5,
              fontWeight: 700,
              cursor: canGrade ? "pointer" : "default",
              opacity: canGrade ? 1 : 0.45,
              boxShadow: canGrade ? "0 6px 16px -6px rgba(59,67,181,.7)" : "none",
            }}
          >
            {status === "grading" ? (
              <>
                <span className="animate-spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.35)", borderTopColor: "#fff", display: "inline-block" }} aria-hidden />
                Grading…
              </>
            ) : (
              "Grade my essay"
            )}
          </button>
        </div>
      </section>

      {error ? (
        <p style={{ margin: "12px 2px 0", fontSize: 13.5, fontWeight: 600, color: RED }} role="alert">
          {error}
        </p>
      ) : null}

      <p style={{ margin: "12px 2px 0", fontSize: 12.5, color: "#9A9EAE" }}>
        {gradesLeft > 0
          ? `${gradesLeft} of ${FREE_LIMIT} free gradings left — no account needed.`
          : "You've used your free gradings — create a free account for more."}
      </p>
      </>
      )}

      {showWall ? <SignupWall onClose={() => setShowWall(false)} /> : null}
    </div>
  );
}

// ---- Sign-up wall — appears once the 3 free gradings are spent ---------------

function SignupWall({ onClose }: { onClose: () => void }) {
  // Close on Escape; lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign up for more gradings"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(26,33,56,.55)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", fontFamily: SANS }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 440, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 18, boxShadow: "0 40px 80px -30px rgba(26,33,56,.5)", padding: "30px 28px 26px", textAlign: "center" }}
      >
        <button type="button" onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 9, border: "none", background: SOFT, color: "#8A8FA0", cursor: "pointer", fontSize: 17, lineHeight: 1 }}>×</button>
        <div style={{ width: 52, height: 52, margin: "0 auto", borderRadius: 14, background: "#ECEBFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg>
        </div>
        <h3 style={{ margin: "16px 0 0", fontFamily: SERIF, fontSize: 25, fontWeight: 600, letterSpacing: "-.01em", color: INK }}>
          You&rsquo;ve used your 3 free gradings
        </h3>
        <p style={{ margin: "10px auto 0", fontSize: 14.5, lineHeight: 1.6, color: MUTED, maxWidth: 340 }}>
          Create a free account to keep grading — plus sentence-level fixes on your essay, a Band 9
          model answer, and the revision loop to rewrite and re-grade.
        </p>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 48, borderRadius: 12, background: INDIGO, color: "#fff", fontSize: 15.5, fontWeight: 700, textDecoration: "none", boxShadow: "0 6px 16px -6px rgba(59,67,181,.7)" }}>
            Create a free account
          </Link>
          <Link href="/sign-in" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12, background: "#fff", border: "1px solid #DAD8F2", color: INDIGO, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---- Result — the SAME layout as the internal writing grading (essay-feedback) --

function Result({
  teaser,
  onAgain,
  atLimit,
  gradesLeft,
}: {
  teaser: PublicTeaser;
  onAgain: () => void;
  atLimit: boolean;
  gradesLeft: number;
}) {
  const bc = bandColor(teaser.overallBand);
  const showLift = teaser.bandWithFixes > teaser.overallBand;
  const lift = showLift ? teaser.bandWithFixes - teaser.overallBand : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ---- Top bar: back to a fresh attempt (or the wall) ---- */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={onAgain}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px", borderRadius: 11, border: "1px solid #E2DED0", background: "#fff", color: "#41496A", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#41496A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8M3 4v4h4" /></svg>
          Grade another essay
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: atLimit ? RED : "#9A9EAE" }}>
          {atLimit ? "No free gradings left" : `${gradesLeft} free grading${gradesLeft === 1 ? "" : "s"} left`}
        </span>
      </div>

      {/* ---- Score summary strip (mirrors the internal EssayFeedback header) ---- */}
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 62, fontWeight: 800, lineHeight: 0.82, color: bc.fg, fontVariantNumeric: "tabular-nums", letterSpacing: "-.03em" }}>
            {teaser.overallBand.toFixed(1)}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", color: "#8A8FA0", textTransform: "uppercase", lineHeight: 1.1 }}>
              Overall<br />band
            </span>
            <span style={{ alignSelf: "flex-start", fontSize: 11.5, fontWeight: 700, color: bc.fg, background: bc.bg, padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
              {bc.label}
            </span>
          </div>
        </div>
        {showLift ? (
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#E9F5EE", border: "1px solid #CDE9D8", borderRadius: 11 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            <span style={{ fontSize: 13.5, color: "#2C7A52", fontWeight: 600 }}>
              Up to <strong style={{ fontWeight: 800, color: "#1A7A48" }}>{teaser.bandWithFixes.toFixed(1)}</strong> with the fixes
            </span>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" style={{ flex: 1, minWidth: 240 }}>
          {teaser.criteria.map((c) => {
            const isBlocker = teaser.blocker.criterion === c.key;
            const color = isBlocker ? RED : c.band >= 6 ? "#2C3247" : AMBER;
            const tag = isBlocker ? "Fix this first" : c.band >= 7 ? "Strong" : c.band >= 6 ? "Solid" : "Needs work";
            const tagColor = isBlocker ? RED : c.band >= 6 ? "#9A8F77" : AMBER;
            return (
              <div key={c.key} style={{ background: isBlocker ? "#FCEEEA" : SOFT, border: `1px solid ${isBlocker ? "#F3CFC6" : SOFT_LINE}`, borderRadius: 12, padding: "10px 12px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{critShort(c.key)}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.band.toFixed(1)}</span>
                </div>
                <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: isBlocker ? "#F3DAD3" : "#EEEAE0", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((Math.min(9, c.band) / 9) * 100)}%`, height: "100%", borderRadius: 3, background: color }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: tagColor }}>{tag}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- "Fix this first" blocker card (mirrors the internal BandsView) ---- */}
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "18px 18px 16px" }}>
        <div style={{ background: "#FCEEEA", border: "1px solid #F3CFC6", borderRadius: 13, padding: "15px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: RED }}>FIX THIS FIRST</span>
            {lift ? (
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#1A7A48", background: "#E9F5EE", border: "1px solid #CDE9D8", padding: "2px 8px", borderRadius: 999 }}>+{lift.toFixed(1)} band</span>
            ) : null}
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#3A3F58" }}>
            <strong style={{ color: INK }}>{critLabel(teaser.blocker.criterion)}</strong> — {teaser.blocker.why}
          </p>
        </div>

        {/* ---- Per-criterion cards: evidence · what caps it · fix ---- */}
        {teaser.criteria.map((c) => {
          const isBlocker = teaser.blocker.criterion === c.key;
          const badge = isBlocker
            ? { label: "Capping", text: RED, bg: "#FCEEEA" }
            : c.band >= 6
              ? { label: c.band >= 7 ? "Strong" : "Solid", text: "#2C7A52", bg: "#E9F5EE" }
              : { label: "Developing", text: AMBER, bg: "#F6EAD0" };
          return (
            <div key={c.key} style={{ background: "#fff", border: `1px solid ${isBlocker ? "#F3CFC6" : "#EAE6D8"}`, borderRadius: 13, padding: "15px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11, gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>{c.label}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, flex: "none" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: badge.text, background: badge.bg, padding: "2px 8px", borderRadius: 999 }}>{badge.label}</span>
                  <span style={{ fontSize: 19, fontWeight: 800, color: isBlocker ? RED : "#2C3247", fontVariantNumeric: "tabular-nums" }}>{c.band.toFixed(1)}</span>
                </span>
              </div>
              {c.evidence ? (
                <div style={{ marginBottom: 10 }}>
                  <span style={labelCap}>In your essay</span>
                  <p style={detailP}>{c.evidence}</p>
                </div>
              ) : null}
              {c.whatCapsIt ? (
                <div style={{ marginBottom: 10 }}>
                  <span style={labelCap}>What&rsquo;s capping it</span>
                  <p style={detailP}>{c.whatCapsIt}</p>
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 10, padding: "11px 12px", background: SOFT, border: `1px solid ${SOFT_LINE}`, borderRadius: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }} aria-hidden><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "#2C3247" }}><strong style={{ color: INDIGO }}>Fix:</strong> {c.fix}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Conversion — the deeper coaching loop stays behind sign-up ---- */}
      <div style={{ background: "#ECEBFB", border: "1px solid #E1DFF7", borderRadius: 16, padding: "18px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, justifyContent: "space-between" }}>
        <div style={{ minWidth: 240, flex: "1 1 320px" }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: INK }}>Go deeper — free account</p>
          <p style={{ margin: "5px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#41496A" }}>
            Sentence-level fixes marked up on your essay, a Band 9 model answer for this exact task,
            and the revision loop — rewrite and re-grade the same essay until it&apos;s ready.
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 22px", borderRadius: 11, background: INDIGO, color: "#fff", fontSize: 14.5, fontWeight: 700, textDecoration: "none", boxShadow: "0 6px 16px -6px rgba(59,67,181,.7)" }}>
            Create a free account
          </Link>
          <Link href="/sign-in" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 22px", borderRadius: 11, background: "#fff", border: "1px solid #DAD8F2", color: INDIGO, fontSize: 14.5, fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: "#A7ABBA" }}>{teaser.disclaimer}</p>
    </div>
  );
}

// Short label for the compact strip tiles; full label used on the detail cards.
function critShort(key: string): string {
  return { TR: "Task Response", CC: "Coherence", LR: "Lexical Resource", GRA: "Grammar" }[key] ?? key;
}
function critLabel(key: string): string {
  return { TR: "Task Response", CC: "Coherence & Cohesion", LR: "Lexical Resource", GRA: "Grammar Range & Accuracy" }[key] ?? key;
}

const labelCap: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", color: "#9A9EAE", textTransform: "uppercase" };
const detailP: React.CSSProperties = { margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#41496A" };

function messageFor(httpStatus: number, code: string | undefined): string {
  switch (code) {
    case "rate_limited":
      return "You've used your free previews for now. Create a free account to keep going.";
    case "busy":
      return "The free grader is busy right now — try again in a few minutes, or sign up.";
    case "too_short":
      return `Add a bit more — at least ${MIN_WORDS} words to grade.`;
    case "too_long":
      return `That's over ${MAX_WORDS} words. Sign up to grade full-length essays.`;
    case "prompt_too_long":
      return "That question is too long — shorten it, or leave it blank.";
    case "grade_failed":
      return "Grading failed this time — please try again in a moment.";
    default:
      return httpStatus === 429
        ? "Too many requests — please wait a bit."
        : "Something went wrong — please try again.";
  }
}

function transcribeMessageFor(code: string | undefined): string {
  switch (code) {
    case "rate_limited":
      return "You've used your free previews for now. Create a free account to keep going.";
    case "busy":
      return "The free checker is busy right now — try again in a few minutes, or sign up.";
    case "unsupported_type":
      return "Upload a PNG, JPG, or WEBP image, or a PDF.";
    case "too_large":
      return "File is too large — keep it under 8 MB.";
    case "empty_file":
      return "That file is empty.";
    case "no_text":
      return "Couldn't find readable writing in that file — try a clearer photo.";
    default:
      return "Couldn't read that file — please try a clearer photo or PDF.";
  }
}
