import "server-only";

import { loadDashboard } from "@/lib/dashboard/load";
import type { Skill } from "@/lib/estimates/compute";

/**
 * A compact "who is this learner" line for the in-TASK coaches (writing/reading).
 * It lets the coach pitch the sophistication of its help to the learner's level and
 * weakest area — but it is context ONLY: the coaches are still told never to quote a
 * band number back at the student (the examiner owns scoring). Returns "" on any
 * failure so the coach simply runs without it.
 */
export async function buildCoachLearnerContext(studentId: string, skill: Skill): Promise<string> {
  try {
    const { estimates, weakestCriterion, weakestReadingType } = await loadDashboard(studentId);
    const s = estimates.bySkill[skill];
    const parts: string[] = [`Target band: ${s.targetBand.toFixed(1)}`];
    parts.push(
      s.currentBand != null
        ? `current ${skill} level ≈ Band ${s.currentBand.toFixed(1)} (conservative estimate)`
        : `${skill} level not measured yet`,
    );
    if (skill === "writing" && weakestCriterion) {
      parts.push(`weakest writing area so far: ${weakestCriterion.label}`);
    }
    if (skill === "reading" && weakestReadingType) {
      parts.push(
        `weakest question type: ${weakestReadingType.label} (${Math.round(weakestReadingType.accuracy * 100)}% correct)`,
      );
    }
    return parts.join("; ");
  } catch {
    return "";
  }
}
