import Link from "next/link";
import { redirect } from "next/navigation";

import { BandCard } from "@/app/(app)/dashboard/band-card";
import { requireOrgUser } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A1C33";
const MUTED = "#565a72";
const EMERALD = "#2f8f5b";

export const dynamic = "force-dynamic";

const ARROW = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

/**
 * Entry diagnostic: one timed reading set + one Task 2 essay → an initial,
 * deliberately conservative per-skill band. Each step is "done" once that skill
 * has been measured (its first graded submission seeds the baseline). Once both
 * are done we show the band cards; the estimate then keeps re-rolling as the
 * student submits more work. Styled to match the brand dashboard.
 */
export default async function DiagnosticPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const { bySkill, readingMeasured, writingMeasured, diagnosticComplete } =
    await loadStudentEstimates(profile.id);

  const doneCount = (readingMeasured ? 1 : 0) + (writingMeasured ? 1 : 0);

  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 720, margin: "0 auto" }}>
      {/* header */}
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 700, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: INDIGO }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: INDIGO }} />
          Getting started
        </div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(25px,2.6vw,32px)", lineHeight: 1.08, letterSpacing: "-.015em", margin: "10px 0 0", color: INK }}>
          Entry diagnostic
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 15.5, lineHeight: 1.55, color: MUTED, margin: "8px 0 0", maxWidth: 560 }}>
          One timed reading set and one Task&nbsp;2 essay set your starting bands — graded the same way as the real exam, deliberately cautious at first, then sharpened as you submit more work.
        </p>

        {/* progress */}
        {!diagnosticComplete ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
            <div style={{ flex: "1 1 auto", height: 7, background: "#EFEEE2", borderRadius: 999, overflow: "hidden", maxWidth: 320 }} aria-hidden>
              <div style={{ width: `${(doneCount / 2) * 100}%`, height: "100%", background: INDIGO, borderRadius: 999, transition: "width .3s ease" }} />
            </div>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: MUTED, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              {doneCount} of 2 complete
            </span>
          </div>
        ) : null}
      </div>

      {diagnosticComplete ? (
        <section style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#E9F4EE", border: "1px solid #C6E3D2", borderRadius: 14, padding: "14px 18px" }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", color: EMERALD, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <div>
              <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: "#1f6b44", margin: 0 }}>
                Diagnostic complete — your baseline is set.
              </p>
              <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: "#3f6e54", margin: "3px 0 0" }}>
                These update automatically every time you submit graded work.
              </p>
            </div>
          </div>

          <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
            <BandCard estimate={bySkill.reading} />
            <BandCard estimate={bySkill.writing} />
          </div>

          <Link
            href="/dashboard"
            style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 18, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, padding: "11px 20px", borderRadius: 10, textDecoration: "none", boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)" }}
          >
            Go to dashboard {ARROW}
          </Link>
        </section>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
          <DiagnosticStep
            n={1}
            skill="reading"
            title="Timed reading set"
            blurb="Read an original passage and answer across the real question types."
            chips={["Timed passage", "Instant marking"]}
            done={readingMeasured}
            band={bySkill.reading.currentBand}
            href="/read"
            cta="Start reading"
          />
          <DiagnosticStep
            n={2}
            skill="writing"
            title="Task 2 essay"
            blurb="Write one timed Task 2 response; we grade it criterion by criterion."
            chips={["Task 2 · ~40 min", "Per-criterion grade"]}
            done={writingMeasured}
            band={bySkill.writing.currentBand}
            href="/write"
            cta="Start writing"
          />
        </div>
      )}

      <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 12, lineHeight: 1.5, color: "#9a998c", margin: "28px 0 0" }}>
        Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English.
      </p>
    </div>
  );
}

function DiagnosticStep({
  n,
  skill,
  title,
  blurb,
  chips,
  done,
  band,
  href,
  cta,
}: {
  n: number;
  skill: "reading" | "writing";
  title: string;
  blurb: string;
  chips: [string, string];
  done: boolean;
  band: number | null;
  href: string;
  cta: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 18,
        background: "#fff",
        border: "1px solid #E7E4D6",
        borderRadius: 16,
        padding: 20,
      }}
    >
      {/* index / skill icon */}
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: done ? "#E5F2EB" : "#EBECFA",
          color: done ? EMERALD : INDIGO,
        }}
        aria-hidden
      >
        {done ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <SkillIcon skill={skill} />
        )}
      </span>

      <div style={{ flex: "1 1 240px", minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: done ? EMERALD : "#9a998c" }}>
          Step {n} · {skill === "reading" ? "Reading" : "Writing"}
        </div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, lineHeight: 1.15, color: INK, margin: "5px 0 0" }}>{title}</h2>
        <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: MUTED, margin: "5px 0 0" }}>{blurb}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
          {chips.map((c, i) => (
            <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 500, fontSize: 12.5, color: MUTED, background: "#F7F6EE", border: "1px solid #ECEADC", borderRadius: 8, padding: "5px 10px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {i === 0 ? (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </>
                ) : (
                  <path d="M20 6 9 17l-5-5" />
                )}
              </svg>
              {c}
            </span>
          ))}
        </div>
      </div>

      <div style={{ flex: "none", marginLeft: "auto" }}>
        {done ? (
          <div style={{ textAlign: "center", minWidth: 78 }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 30, lineHeight: 1, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>
              {band != null ? band.toFixed(1) : "—"}
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#9a998c", marginTop: 4 }}>band</div>
          </div>
        ) : (
          <Link
            href={href}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, padding: "11px 18px", borderRadius: 10, textDecoration: "none", boxShadow: "0 12px 24px -14px rgba(59,67,181,.7)", whiteSpace: "nowrap" }}
          >
            {cta} {ARROW}
          </Link>
        )}
      </div>
    </div>
  );
}

function SkillIcon({ skill }: { skill: "reading" | "writing" }) {
  if (skill === "reading") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
