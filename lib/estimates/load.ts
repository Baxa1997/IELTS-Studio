import "server-only";

import { createClient } from "@/lib/supabase/server";

import { DEFAULT_TARGET_BAND, SKILLS, type Skill, type SkillEstimateView } from "./compute";

export interface StudentEstimates {
  bySkill: Record<Skill, SkillEstimateView>;
  readingMeasured: boolean;
  writingMeasured: boolean;
  /** The entry diagnostic is "done" once BOTH skills have a real measurement. */
  diagnosticComplete: boolean;
}

/**
 * Load a student's per-skill estimates for the tracker. Read through the RLS
 * client (a student sees only their own rows). Skills with no row yet come back
 * unmeasured with the default target, so the UI always has both skills to show.
 */
export async function loadStudentEstimates(studentId: string): Promise<StudentEstimates> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skill_estimates")
    .select("skill, current_band, baseline_band, target_band, sample_count")
    .eq("student_id", studentId);

  const rows = new Map((data ?? []).map((r) => [r.skill as Skill, r]));

  const bySkill = Object.fromEntries(
    SKILLS.map((skill): [Skill, SkillEstimateView] => {
      const row = rows.get(skill);
      return [
        skill,
        {
          skill,
          currentBand: row?.current_band != null ? Number(row.current_band) : null,
          baselineBand: row?.baseline_band != null ? Number(row.baseline_band) : null,
          targetBand: row?.target_band != null ? Number(row.target_band) : DEFAULT_TARGET_BAND,
          sampleCount: row?.sample_count ?? 0,
        },
      ];
    }),
  ) as Record<Skill, SkillEstimateView>;

  const readingMeasured = bySkill.reading.currentBand != null;
  const writingMeasured = bySkill.writing.currentBand != null;

  return {
    bySkill,
    readingMeasured,
    writingMeasured,
    diagnosticComplete: readingMeasured && writingMeasured,
  };
}
