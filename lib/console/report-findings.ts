import { type CenterReport } from "./reports";

/**
 * The report, said in sentences.
 *
 * WHY THIS EXISTS. The reports page was seven analytics panels — a band
 * histogram, a monthly trend, per-skill means, a class table, capping criteria,
 * missed question types, a lapsed list — and a center owner reading it could
 * not tell you what any of it wanted them to DO. Every panel was accurate and
 * the page as a whole answered nothing.
 *
 * A finding is the answer stated first, with the number as evidence rather than
 * as the point. The charts are still there underneath for anyone who wants to
 * check the working; this is what the page opens with.
 *
 * NOTHING HERE INVENTS CONFIDENCE. A finding that rests on too little graded
 * work says so instead of quoting a mean of three essays as if it described a
 * center. That is the same rule the grader follows, applied to reporting: it is
 * better to say "not enough yet" than to be precisely wrong.
 */

export type FindingTone = "good" | "bad" | "flat";

export interface Finding {
  /** The answer, in one line. */
  headline: string;
  /** The evidence, or what would make the answer trustworthy. */
  detail: string;
  tone: FindingTone;
  /** Where to go and act on it. */
  action?: { label: string; href: string };
}

/** Below this, a mean is an anecdote rather than a measurement. */
const ENOUGH_SAMPLES = 8;

export function buildFindings(report: CenterReport): Finding[] {
  const findings: Finding[] = [];
  const { totals, groups, bandTrend, atRisk, writingCaps } = report;

  // ── 1. Is the teaching working? ─────────────────────────────────────────
  // WRITING ONLY, and it says so. This used to read the pooled trend — writing,
  // reading and speaking bands averaged together — and announce the result as
  // "average band", a figure that moves when a class switches which skill it
  // practises and means nothing when it does.
  const measured = bandTrend.Writing.filter((m) => m.band != null && m.samples > 0);
  const totalSamples = measured.reduce((n, m) => n + m.samples, 0);

  if (totalSamples < ENOUGH_SAMPLES) {
    findings.push({
      headline: "Not enough marked writing to judge progress yet",
      detail:
        totalSamples === 0
          ? "No essays have been graded in the last 90 days. Set a writing task and the picture fills in."
          : `${totalSamples} graded ${totalSamples === 1 ? "essay" : "essays"} so far — a few more and the figure starts to mean something.`,
      tone: "flat",
      action: { label: "Set practice", href: "/console/groups" },
    });
  } else {
    const latest = measured[measured.length - 1];
    const earliest = measured[0];
    const move = (latest.band ?? 0) - (earliest.band ?? 0);
    const rising = move >= 0.2;
    const falling = move <= -0.2;
    findings.push({
      headline: `Writing band is ${latest.band?.toFixed(1)}${
        rising
          ? ` — up ${move.toFixed(1)} since ${earliest.label}`
          : falling
            ? ` — down ${Math.abs(move).toFixed(1)} since ${earliest.label}`
            : " — flat over the window"
      }`,
      detail: `Across ${totalSamples} graded essays from ${new Set(groups.flatMap((g) => (g.writing.students > 0 ? [g.id] : []))).size || totals.groups} group${totals.groups === 1 ? "" : "s"}. Reading, listening and speaking each stand on their own and are never averaged into this.`,
      tone: rising ? "good" : falling ? "bad" : "flat",
    });
  }

  // ── 2. Which group needs looking at? ────────────────────────────────────
  // The weakest group by completion, not by band: a low band can mean a group
  // of beginners doing everything right, whereas homework nobody hands in is a
  // problem whatever the level.
  const withWork = groups.filter((g) => g.assignments > 0 && g.completionPct != null);
  if (withWork.length > 0) {
    const worst = withWork.reduce((lo, g) =>
      (g.completionPct ?? 100) < (lo.completionPct ?? 100) ? g : lo,
    );
    const best = withWork.reduce((hi, g) =>
      (g.completionPct ?? 0) > (hi.completionPct ?? 0) ? g : hi,
    );
    if ((worst.completionPct ?? 100) < 60) {
      findings.push({
        headline: `${worst.name} is handing in ${worst.completionPct}% of its practice`,
        detail: `${worst.students} student${worst.students === 1 ? "" : "s"}, ${worst.assignments} set${
          best.id !== worst.id ? `. ${best.name} manages ${best.completionPct}%.` : "."
        }`,
        tone: "bad",
        action: { label: `Open ${worst.name}`, href: `/console/groups/${worst.id}` },
      });
    } else {
      findings.push({
        headline: `Practice is getting done — ${best.completionPct}% in ${best.name}`,
        detail: `Every class with work set is above 60%. The lowest is ${worst.name} at ${worst.completionPct}%.`,
        tone: "good",
      });
    }
  } else if (groups.length > 0) {
    findings.push({
      headline: "No practice has been set yet",
      detail: `${groups.length} class${groups.length === 1 ? "" : "es"} exist but none has homework, so there is nothing to complete.`,
      tone: "flat",
      action: { label: "Set practice", href: "/console/groups" },
    });
  }

  // ── 3. Who has stopped? ─────────────────────────────────────────────────
  if (atRisk.length > 0) {
    const never = atRisk.filter((s) => s.lastActive == null).length;
    findings.push({
      headline: `${atRisk.length} student${atRisk.length === 1 ? " has" : "s have"} not practised in two weeks`,
      detail:
        never > 0
          ? `${never} of them ${never === 1 ? "has" : "have"} never started at all — worth checking they can sign in.`
          : "They were active before, so something changed. Listed below.",
      tone: "bad",
      action: { label: "See who", href: "#waiting" },
    });
  } else if (totals.students > 0 && totals.gradedPractices > 0) {
    // Guarded on there being graded work at all. An empty at-risk list in a
    // center that has graded nothing means "no data", not "nobody is behind",
    // and congratulating an owner on activity that never happened is exactly
    // the confident-but-wrong this module exists to avoid.
    findings.push({
      headline: "Everyone has practised in the last two weeks",
      detail: `All ${totals.students} students in a class have handed something in.`,
      tone: "good",
    });
  }

  // ── 4. What to teach next ───────────────────────────────────────────────
  // Only when one criterion clearly dominates: "TR caps 26% and CC caps 24%"
  // is not a teaching instruction, it is noise with two decimal places.
  const caps = [...writingCaps].sort((a, b) => b.value - a.value);
  const capTotal = caps.reduce((n, c) => n + c.value, 0);
  if (capTotal >= ENOUGH_SAMPLES && caps.length > 1) {
    const share = Math.round((caps[0].value / capTotal) * 100);
    const runnerUp = Math.round((caps[1].value / capTotal) * 100);
    if (share - runnerUp >= 10) {
      findings.push({
        headline: `${caps[0].label} is what holds most essays back`,
        detail: `It caps ${share}% of them, against ${runnerUp}% for ${caps[1].label}. ${caps[0].hint}`,
        tone: "flat",
      });
    }
  }

  return findings;
}
