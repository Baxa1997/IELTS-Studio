/**
 * Whether a handed-in lesson's WRITTEN answers go to a model for marking.
 *
 * Two kinds of learner reach /api/lessons/[id]/submit, and the answer differs:
 *
 *  - A CENTRE's student, on homework their teacher set: always. That was the
 *    original scope, and a centre runs unmetered on purpose.
 *  - A SOLO learner, on a lesson they made at /learn (owner, 2026-11-14: "yes,
 *    AI marked if practice is done"): on their FIRST hand-in of that lesson.
 *
 * ⚠️ WHY ONLY THE FIRST, FOR A SOLO LEARNER. A lesson can be redone as often as
 * they like, and each marking is a model call that no quota counts — the
 * grading allowance counts essay gradings, not these. Unbounded, a free
 * account could spend model money by resubmitting one lesson all day. The
 * first hand-in ties marking to the BUILD, and builds are metered (one practice
 * set each, by the engine). A repeat attempt shows the criteria and a model
 * answer to check against, as the public share page does.
 *
 * Read off the ORG's kind, never the role: "student" is both kinds of learner.
 * Pure, so the rule is pinned by a test.
 */
export function modelMarksOpenAnswers(input: { orgKind: string; priorAttempts: number }): boolean {
  if (input.orgKind !== "personal") return true;
  return input.priorAttempts === 0;
}
