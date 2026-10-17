import type { PartView } from "./types";

/** Every question number a part view carries (gaps, clusters, MCQs, matching). */
export function partQuestionNums(p: PartView): number[] {
  // v2: every group states its own question numbers.
  if (p.groups) return p.groups.flatMap((g) => g.questions).sort((a, b) => a - b);
  const templates = p.form
    ? p.form.rows.map((r) => r.template)
    : p.table
      ? p.table.rows.flat()
      : p.flow_chart
        ? p.flow_chart.steps
        : (p.notes?.sections ?? []).flatMap((s) => s.lines.map((l) => l.template));
  const nums = templates.flatMap((t) => [...t.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])));
  for (const c of p.clusters ?? []) nums.push(...c.questions);
  for (const m of p.mcqs ?? []) nums.push(m.q);
  for (const it of p.matching?.items ?? []) nums.push(it.q);
  return nums.sort((a, b) => a - b);
}
