import Link from "next/link";

import { loadStudyPlan } from "@/lib/plan/service";

import { Panel } from "./frame";
import { GoalForm } from "./goal-form";

/** Target band, current level and test date — the plan everything is paced to. */
export async function StudyGoalSection({ studentId }: { studentId: string }) {
  const plan = await loadStudyPlan(studentId);

  if (!plan) {
    return (
      <Panel title="No goal yet" note="Set one up and your practice is matched to your level.">
        <Link
          href="/onboarding"
          style={{ color: "#7D0132", fontWeight: 700, textDecoration: "none" }}
        >
          Set your goal →
        </Link>
      </Panel>
    );
  }

  return (
    <Panel
      title="Your goal"
      note="Changing it re-paces your study plan and the tasks it gives you each week."
    >
      <GoalForm
        initial={{
          selfReportedBand: plan.selfReportedBand ?? null,
          targetBand: plan.targetBand,
          examDate: plan.examDate ?? null,
        }}
      />
    </Panel>
  );
}
