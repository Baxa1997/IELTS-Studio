import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { SKILL_LABELS } from "@/lib/estimates/compute";
import type { HistoryEvent, Recommendation, WeakCriterion, WeakReadingType } from "@/lib/dashboard/compute";
import { loadDashboard } from "@/lib/dashboard/load";
import { countTasksThisWeek, loadStudyPlan } from "@/lib/plan/service";
import { daysUntil, type StudyPlan } from "@/lib/plan/types";

import { BandCard } from "./band-card";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A1C33";
const MUTED = "#565a72";
const EMERALD = "#2f8f5b";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  // New learners set up their plan first — the (app) layout renders the onboarding
  // takeover, so this page renders nothing until a plan exists.
  const plan = await loadStudyPlan(profile.id);
  if (!plan) return null;

  const [{ estimates, weakestCriterion, weakestReadingType, streakDays, history, recommendation }, tasksThisWeek] =
    await Promise.all([loadDashboard(profile.id), countTasksThisWeek(profile.id)]);

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      {/* welcome + streak */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(23px,2.4vw,29px)", lineHeight: 1.1, letterSpacing: "-.015em", margin: 0, color: INK }}>{greeting(profile.full_name)}</h1>
          <p style={{ fontFamily: SANS, fontSize: 15, color: "#6b6e84", margin: "5px 0 0" }}>Here&apos;s where you stand and what to do next.</p>
        </div>
        <StreakBadge days={streakDays} />
      </div>

      {/* study plan strip */}
      <PlanStrip plan={plan} tasksThisWeek={tasksThisWeek} />

      {/* next task */}
      <NextTask rec={recommendation} />

      {/* skill band cards */}
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <BandCard estimate={estimates.bySkill.reading} />
        <BandCard estimate={estimates.bySkill.writing} />
      </div>

      {/* weakest areas */}
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <WritingWeak weak={weakestCriterion} />
        <ReadingWeak weak={weakestReadingType} />
      </div>

      {/* recent results */}
      <RecentResults history={history} />
    </div>
  );
}

// ---- pieces ----------------------------------------------------------------

const ARROW = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

function greeting(name: string | null): string {
  return name ? `Welcome back, ${name.split(" ")[0]}` : "Welcome back";
}

function StreakBadge({ days }: { days: number }) {
  if (days <= 0) {
    return <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED, border: "1px solid #E1DFD0", borderRadius: 999, padding: "8px 14px", whiteSpace: "nowrap" }}>Practice today to start a streak</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFF3E0", border: "1px solid #F6E0B8", color: "#B9791A", fontFamily: SANS, fontWeight: 700, fontSize: 14, padding: "9px 15px", borderRadius: 999, whiteSpace: "nowrap" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#E8893A" stroke="none">
        <path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 0-2-.5-3 2 1.5 3.5 4 3.5 7a8 8 0 1 1-16 0c0-3.5 2-6 4-8 .5 2 2 2.5 2 2.5S9 6 12 2Z" />
      </svg>
      {days}-day streak
    </span>
  );
}

/** Two context chips for the recommendation, by where it points. */
function chipsFor(href: string): [string, string] {
  if (href.startsWith("/diagnostic")) return ["~60 min total", "Reading + Writing"];
  if (href.startsWith("/write")) return ["Task 2 · ~40 min", "Per-criterion grade"];
  return ["Timed passage", "Instant marking"];
}

function PlanStrip({ plan, tasksThisWeek }: { plan: StudyPlan; tasksThisWeek: number }) {
  const days = daysUntil(plan.examDate);
  const hasFuture = plan.examDate != null && days != null && days >= 0;
  const goalMet = tasksThisWeek >= plan.weeklyGoal;
  const pct = Math.min(100, Math.round((tasksThisWeek / plan.weeklyGoal) * 100));

  return (
    <Link
      href="/plan"
      className="lp-row"
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, marginTop: 16, background: "#fff", border: "1px solid #E7E4D6", borderRadius: 14, padding: "14px 18px", textDecoration: "none" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>
        </span>
        <div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK }}>
            {hasFuture ? `${days} ${days === 1 ? "day" : "days"} to your test` : "Your study plan"}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>Target band {plan.targetBand.toFixed(1)}</div>
        </div>
      </div>

      <div style={{ flex: "1 1 200px", minWidth: 160 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>This week</span>
          <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: goalMet ? EMERALD : INK, fontVariantNumeric: "tabular-nums" }}>{tasksThisWeek}/{plan.weeklyGoal} tasks</span>
        </div>
        <div style={{ height: 6, background: "#EFEEE2", borderRadius: 999, overflow: "hidden", marginTop: 6 }} aria-hidden>
          <div style={{ width: `${pct}%`, height: "100%", background: goalMet ? EMERALD : INDIGO, borderRadius: 999 }} />
        </div>
      </div>

      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: INDIGO, flex: "none" }}>View plan {ARROW}</span>
    </Link>
  );
}

function NextTask({ rec }: { rec: Recommendation }) {
  const [chipA, chipB] = chipsFor(rec.href);
  return (
    <div style={{ position: "relative", overflow: "hidden", marginTop: 16, background: "linear-gradient(120deg,#EEF0FB 0%,#F4F1FC 100%)", border: "1px solid #DADBF4", borderRadius: 16, padding: "22px 26px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
      <div aria-hidden style={{ position: "absolute", top: -60, right: 120, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,67,181,.1),transparent 65%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 700, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: INDIGO }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: INDIGO, animation: "lp-dotpulse 1.4s ease-in-out infinite" }} />
          Next task · AI recommended
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(19px,2.1vw,22px)", color: INK, marginTop: 8 }}>{rec.title}</div>
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.5, color: MUTED, margin: "6px 0 0", maxWidth: 520 }}>{rec.reason}</p>
        <Link href={rec.href} style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 16, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, padding: "11px 20px", borderRadius: 10, textDecoration: "none", boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)" }}>
          {rec.cta} {ARROW}
        </Link>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, flex: "none" }}>
        {[chipA, chipB].map((c, i) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: SANS, fontWeight: 500, fontSize: 13.5, color: MUTED, background: "#fff", border: "1px solid #DADBF4", borderRadius: 10, padding: "10px 13px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          </div>
        ))}
      </div>
    </div>
  );
}

const CRITERION_TIP: Record<string, string> = {
  TR: "answer every part of the prompt and state a clear position — that alone lifts Task Response fastest.",
  CC: "give each idea its own paragraph and connect sentences with referencing, not just linking words.",
  LR: "swap repeated, vague words for precise topic vocabulary and natural collocations.",
  GRA: "add a few accurate complex sentences and proof-read for article and subject–verb agreement.",
};

function WritingWeak({ weak }: { weak: WeakCriterion | null }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E4D6", borderLeft: "3px solid #C28A1A", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#B9791A" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
        Weakest in Writing
      </div>
      {weak ? (
        <>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 18, color: INK, marginTop: 10 }}>{weak.label}</div>
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: "#8a897c", marginTop: 4 }}>
            avg band {weak.meanBand.toFixed(1)}
            {weak.blockerCount > 0 ? ` · capping ${weak.blockerCount} ${weak.blockerCount === 1 ? "essay" : "essays"}` : ""}
          </div>
          <div style={{ marginTop: 12, background: "#FAF9F1", border: "1px solid #ECEADC", borderRadius: 10, padding: "10px 12px", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: MUTED }}>
            <b style={{ color: INK }}>AI tip:</b> {CRITERION_TIP[weak.key] ?? "target this criterion with one focused essay and resubmit to see it move."}
          </div>
          <Link href="/write" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14, padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}>
            Practice {weak.label} {ARROW}
          </Link>
        </>
      ) : (
        <div style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.5, color: "#8a897c", marginTop: 12 }}>Submit a Task 2 essay and the AI will pinpoint your weakest criterion — and the one fix that lifts it.</div>
      )}
    </div>
  );
}

function ReadingWeak({ weak }: { weak: WeakReadingType | null }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E4D6", borderLeft: "3px solid #D8D6C7", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#9a998c" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        </svg>
        Weakest in Reading
      </div>
      {weak ? (
        <>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 18, color: INK, marginTop: 10 }}>{weak.label}</div>
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: "#8a897c", marginTop: 4 }}>{Math.round(weak.accuracy * 100)}% correct · {weak.correct}/{weak.attempted}</div>
          <Link href="/read" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14, padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}>
            Practice {weak.label} {ARROW}
          </Link>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, marginTop: 12, paddingBottom: 4 }}>
          <div style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.5, color: "#8a897c", maxWidth: 300 }}>Do a reading set and the AI will pinpoint your weakest question type — and why each trap caught you.</div>
          <Link href="/read" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #DAD8C9", color: INK, fontFamily: SANS, fontWeight: 600, fontSize: 14, padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}>
            Start a reading set {ARROW}
          </Link>
        </div>
      )}
    </div>
  );
}

function RecentResults({ history }: { history: HistoryEvent[] }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: INK, margin: 0 }}>Recent results</h2>
        <Link href="/activities" style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: INDIGO, textDecoration: "none" }}>View all activities</Link>
      </div>
      {history.length === 0 ? (
        <p style={{ fontFamily: SANS, fontSize: 14.5, color: "#8a897c", margin: "12px 0 0" }}>No results yet — your graded work will show up here.</p>
      ) : (
        <div style={{ marginTop: 12, background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, overflow: "hidden" }}>
          {history.map((h, i) => (
            <div key={`${h.skill}-${h.date}-${i}`} className="lp-row" style={{ display: "grid", gridTemplateColumns: "90px 1fr auto", alignItems: "center", gap: 16, padding: "13px 18px", borderTop: i === 0 ? "none" : "1px solid #F0EEE3" }}>
              <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: "#8a897c" }}>{fmtDate(h.date)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontWeight: 600, fontSize: 15, color: INK }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {h.skill === "reading" ? <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /> : <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>}
                  </svg>
                </span>
                {SKILL_LABELS[h.skill]}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <DeltaBadge value={h.deltaVsPrev} />
                <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, color: INK, fontVariantNumeric: "tabular-nums" }}>{h.band.toFixed(1)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaBadge({ value }: { value: number | null }) {
  const badge: React.CSSProperties = { fontFamily: SANS, fontWeight: 600, fontSize: 12, padding: "3px 9px", borderRadius: 6 };
  if (value == null) {
    return <span style={{ ...badge, color: "#8a897c", background: "#F1F0E6" }}>baseline</span>;
  }
  if (value > 0) {
    return <span style={{ ...badge, color: EMERALD, background: "#E5F2EB" }}>▲ {value.toFixed(1)}</span>;
  }
  if (value < 0) {
    return <span style={{ ...badge, color: "#c0392b", background: "#FBEAE7" }}>▼ {Math.abs(value).toFixed(1)}</span>;
  }
  return null;
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(iso));
}
