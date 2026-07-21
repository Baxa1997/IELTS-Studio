import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle, ArrowRight, BookOpen, CalendarClock, Flame, Headphones,
  Mic, PenLine, Sparkles, TrendingDown, TrendingUp,
} from "lucide-react";

import { requireOrgUser } from "@/lib/auth";
import { SKILL_LABELS, SKILLS, type Skill } from "@/lib/estimates/compute";
import type { HistoryEvent, Recommendation, WeakCriterion, WeakReadingType } from "@/lib/dashboard/compute";
import { loadDashboard } from "@/lib/dashboard/load";
import { countTasksThisWeek, loadStudyPlan } from "@/lib/plan/service";
import { daysUntil, type StudyPlan } from "@/lib/plan/types";

import { BandCard } from "./band-card";
import { DashboardCoach } from "./dashboard-coach";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";
const SURF = "#F6F6FA";
const TINT = "#F4F4FE";
const EMERALD = "#2f8f5b";
const AMBER = "#B9791A";

const card: React.CSSProperties = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 };

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ billing?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  // Stripe Checkout bounces back here (?billing=success|cancel from /api/billing/checkout).
  const billing = (await searchParams)?.billing;

  const plan = await loadStudyPlan(profile.id);
  if (!plan) return null;

  const [{ estimates, weakestCriterion, weakestReadingType, streakDays, history, recommendation }, tasksThisWeek] =
    await Promise.all([loadDashboard(profile.id, profile.organization_id), countTasksThisWeek(profile.id)]);

  const days = daysUntil(plan.examDate);

  const bandText = (b: number | null) => (b != null ? `Band ${b.toFixed(1)}` : "not measured yet");
  const coachContext = [
    `Target band: ${plan.targetBand.toFixed(1)}`,
    ...SKILLS.map((s) => `${SKILL_LABELS[s]}: ${bandText(estimates.bySkill[s].currentBand)}`),
    weakestCriterion ? `Weakest writing area: ${weakestCriterion.label}` : "",
    weakestReadingType ? `Weakest reading question type: ${weakestReadingType.label}` : "",
    `Weekly goal: ${tasksThisWeek}/${plan.weeklyGoal} tasks done this week`,
    days != null && days >= 0 ? `Test is ${days} day${days === 1 ? "" : "s"} away` : "No exam date set",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      <style>{DASH_CSS}</style>

      {billing === "success" ? (
        <p style={{ margin: "0 0 14px", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: "#147A4F", background: "#E9F5EE", border: "1px solid #CDE9D8", borderRadius: 10, padding: "10px 14px" }}>
          Payment received — your Pro plan is activating now. Enjoy the extra practice!
        </p>
      ) : billing === "cancel" ? (
        <p style={{ margin: "0 0 14px", fontFamily: SANS, fontSize: 13.5, color: "#8A5B12", background: "#FDF6E7", border: "1px solid #F0E1BE", borderRadius: 10, padding: "10px 14px" }}>
          Checkout cancelled — you&apos;re still on the free plan.
        </p>
      ) : null}

      <Header name={profile.full_name} plan={plan} days={days} />

      <div className="dash-grid" style={{ marginTop: 18 }}>
        {/* main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <NextTask rec={recommendation} />
          <div className="dash-2">
            {SKILLS.map((s) => (
              <BandCard key={s} estimate={estimates.bySkill[s]} />
            ))}
          </div>
          <RecentResults history={history} />
        </div>

        {/* right rail: just the two things worth glancing at */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WeekCard streakDays={streakDays} done={tasksThisWeek} goal={plan.weeklyGoal} />
          <FocusCard writing={weakestCriterion} reading={weakestReadingType} />
        </aside>
      </div>

      <DashboardCoach context={coachContext} firstName={firstNameOf(profile.full_name)} />
    </div>
  );
}

// ---- header ----------------------------------------------------------------

function Header({ name, plan, days }: { name: string | null; plan: StudyPlan; days: number | null }) {
  const hasDate = plan.examDate != null && days != null && days >= 0;
  return (
    <div>
      <Eyebrow>Your dashboard</Eyebrow>
      <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(24px,2.6vw,32px)", lineHeight: 1.08, letterSpacing: "-.015em", margin: "6px 0 0", color: INK }}>{greeting(name)}</h1>
      <p style={{ fontFamily: SANS, fontSize: 15, color: MUTED, margin: "6px 0 0" }}>
        Target Band {plan.targetBand.toFixed(1)} ·{" "}
        {hasDate ? (
          `${days} ${days === 1 ? "day" : "days"} to your test`
        ) : (
          <Link href="/plan" style={{ color: INDIGO, fontWeight: 600, textDecoration: "none" }}>set your exam date</Link>
        )}
      </p>
    </div>
  );
}

// ---- next task (the single hero) --------------------------------------------

function NextTask({ rec }: { rec: Recommendation }) {
  const [chipA, chipB] = chipsFor(rec.href);
  return (
    <div className="dash-next" style={{ position: "relative", overflow: "hidden", background: "linear-gradient(120deg,#23264D 0%,#3B43B5 62%,#5158C8 100%)", borderRadius: 18, padding: "24px 26px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
      <div aria-hidden style={{ position: "absolute", top: -90, right: -40, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.14),transparent 62%)" }} />
      <div style={{ position: "relative", minWidth: 0, flex: "1 1 380px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: ".11em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>
          <Sparkles size={13} strokeWidth={2.4} /> Next task · picked for you
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(20px,2.3vw,25px)", lineHeight: 1.15, letterSpacing: "-.01em", color: "#fff", marginTop: 9 }}>{rec.title}</div>
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55, color: "rgba(255,255,255,.84)", margin: "7px 0 0", maxWidth: 540 }}>{rec.reason}</p>
        <Link href={rec.href} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", color: INK, fontFamily: SANS, fontWeight: 700, fontSize: 14.5, padding: "12px 22px", borderRadius: 11, textDecoration: "none", boxShadow: "0 14px 30px -14px rgba(0,0,0,.55)", marginTop: 18 }}>
          {rec.cta} <ArrowRight size={16} />
        </Link>
      </div>
      <div className="dash-next-chips" style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, flex: "none" }}>
        {[{ Icon: CalendarClock, t: chipA }, { Icon: TrendingUp, t: chipB }].map(({ Icon, t }) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: SANS, fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,.88)", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 10, padding: "9px 13px" }}>
            <Icon size={15} color="#fff" strokeWidth={2} /> {t}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- right-rail widgets ----------------------------------------------------

/** Streak + weekly goal in ONE card — the week at a glance, no duplicate chips. */
function WeekCard({ streakDays, done, goal }: { streakDays: number; done: number; goal: number }) {
  const dots = weekDots(streakDays);
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const met = done >= goal;
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>This week</Eyebrow>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: AMBER }} title={`${streakDays}-day streak`}>
          <Flame size={17} fill="#FBE3C0" strokeWidth={2} />
          <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: INK, fontVariantNumeric: "tabular-nums" }}>{streakDays}</span>
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 13 }}>
        {dots.map((d) => (
          <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ width: "100%", maxWidth: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: d.filled ? INDIGO : SURF, border: `1.5px solid ${d.today ? INDIGO : d.filled ? INDIGO : LINE}` }}>
              <Flame size={14} color={d.filled ? "#fff" : "#C7C9D4"} strokeWidth={2.2} />
            </span>
            <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: ".02em", color: d.today ? INDIGO : FAINT }}>{d.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
        <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: MUTED }}>Weekly goal</span>
        <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: met ? EMERALD : INK, fontVariantNumeric: "tabular-nums" }}>{done} / {goal} tasks</span>
      </div>
      <div style={{ height: 7, background: "#E7E7F2", borderRadius: 999, overflow: "hidden", marginTop: 8 }} aria-hidden>
        <div style={{ width: `${pct}%`, height: "100%", background: met ? EMERALD : INDIGO, borderRadius: 999 }} />
      </div>
      <p style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, margin: "10px 0 0" }}>
        {met ? "Goal reached — nice work." : streakDays > 0 ? `${goal - done} more to go — keep the streak alive.` : `${goal - done} more to go — practice today to start a streak.`}
      </p>
      <Link href="/plan" style={{ ...miniLink, marginTop: 10 }}>Adjust plan <ArrowRight size={14} /></Link>
    </div>
  );
}

function FocusCard({ writing, reading }: { writing: WeakCriterion | null; reading: WeakReadingType | null }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <AlertTriangle size={14} color={AMBER} strokeWidth={2.2} />
        <Eyebrow>Focus areas</Eyebrow>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
        <FocusRow Icon={PenLine} skill="Writing" value={writing ? writing.label : "Not measured yet"} sub={writing ? `avg band ${writing.meanBand.toFixed(1)}` : "Grade an essay to find it"} href="/write" />
        <div style={{ height: 1, background: LINE, margin: "12px 0" }} />
        <FocusRow Icon={BookOpen} skill="Reading" value={reading ? reading.label : "Not measured yet"} sub={reading ? `${Math.round(reading.accuracy * 100)}% correct · ${reading.correct}/${reading.attempted}` : "Do a set to find it"} href="/read" />
      </div>
    </div>
  );
}

function FocusRow({ Icon, skill, value, sub, href }: { Icon: typeof PenLine; skill: string; value: string; sub: string; href: string }) {
  return (
    <Link href={href} className="dash-focus" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", borderRadius: 10, margin: "0 -6px", padding: "4px 6px" }}>
      <span style={{ flex: "none", width: 34, height: 34, borderRadius: 9, background: TINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} color={INDIGO} strokeWidth={2} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: FAINT }}>{skill}</span>
        <span style={{ display: "block", fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK, marginTop: 1 }}>{value}</span>
        <span style={{ display: "block", fontFamily: SANS, fontSize: 12.5, color: MUTED }}>{sub}</span>
      </span>
      <ArrowRight size={16} color={FAINT} />
    </Link>
  );
}

// ---- recent results --------------------------------------------------------

function RecentResults({ history }: { history: HistoryEvent[] }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: INK, margin: 0 }}>Recent results</h2>
        <Link href="/activities" style={{ ...miniLink }}>All activities <ArrowRight size={14} /></Link>
      </div>
      {history.length === 0 ? (
        <div style={{ ...card, fontFamily: SANS, fontSize: 14.5, color: MUTED }}>No results yet — your graded work will show up here.</div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {history.map((h, i) => (
            <div key={`${h.skill}-${h.date}-${i}`} style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", alignItems: "center", gap: 14, padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
              <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13.5, color: FAINT }}>{fmtDate(h.date)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontWeight: 600, fontSize: 15, color: INK }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: TINT, color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <SkillGlyph skill={h.skill} />
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

function SkillGlyph({ skill }: { skill: Skill }) {
  const size = 15;
  if (skill === "reading") return <BookOpen size={size} strokeWidth={2} />;
  if (skill === "writing") return <PenLine size={size} strokeWidth={2} />;
  if (skill === "listening") return <Headphones size={size} strokeWidth={2} />;
  return <Mic size={size} strokeWidth={2} />;
}

function DeltaBadge({ value }: { value: number | null }) {
  const badge: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontWeight: 600, fontSize: 12, padding: "3px 9px", borderRadius: 999 };
  if (value == null) return <span style={{ ...badge, color: FAINT, background: SURF }}>baseline</span>;
  if (value > 0) return <span style={{ ...badge, color: EMERALD, background: "#E5F2EB" }}><TrendingUp size={12} /> {value.toFixed(1)}</span>;
  if (value < 0) return <span style={{ ...badge, color: "#c0392b", background: "#FBEAE7" }}><TrendingDown size={12} /> {Math.abs(value).toFixed(1)}</span>;
  return null;
}

// ---- helpers ---------------------------------------------------------------

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT }}>{children}</div>;
}

const miniLink: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, fontFamily: SANS, fontWeight: 600, fontSize: 13.5, color: INDIGO, textDecoration: "none" };

function greeting(name: string | null): string {
  return name ? `Welcome back, ${name.split(" ")[0]}` : "Welcome back";
}
function firstNameOf(name: string | null): string | null {
  return name ? name.split(" ")[0] : null;
}
function chipsFor(href: string): [string, string] {
  if (href.startsWith("/diagnostic")) return ["~60 min total", "Reading + Writing"];
  if (href.startsWith("/write")) return ["Task 2 · ~40 min", "Per-criterion grade"];
  if (href.startsWith("/listen")) return ["Timed section", "Instant marking"];
  if (href.startsWith("/speak")) return ["3-part mock", "Examiner + band"];
  return ["Timed passage", "Instant marking"];
}
function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(iso));
}

/** A Mon–Sun week with today marked and the trailing `streakDays` filled. */
function weekDots(streakDays: number): { label: string; today: boolean; filled: boolean }[] {
  const labels = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const jsDay = new Date().getDay(); // 0=Sun..6=Sat
  const todayIdx = (jsDay + 6) % 7; // 0=Mon..6=Sun
  return labels.map((label, i) => ({ label, today: i === todayIdx, filled: i <= todayIdx && todayIdx - i < streakDays }));
}

const DASH_CSS = `
.dash-grid { display: grid; grid-template-columns: minmax(0,1.7fr) minmax(0,1fr); gap: 16px; align-items: start; }
.dash-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dash-focus:hover { background: #F6F6FA; }
@media (max-width: 1040px) { .dash-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) {
  .dash-2 { grid-template-columns: 1fr; }
  /* Tighten the "Next task" hero and let its info chips span full width so they
     don't squeeze the recommendation copy on a phone. */
  .dash-next { padding: 18px 16px !important; gap: 16px !important; }
  .dash-next-chips { width: 100%; }
}
`;
