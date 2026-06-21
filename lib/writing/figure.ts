/**
 * The "figure" that an Academic Writing Task 1 prompt asks the candidate to
 * describe — a chart/graph/table rendered from structured data.
 *
 * Kept free of server-only and React imports so the same contract is shared by:
 *   - generation (the model emits this shape; we zod-validate it),
 *   - storage (writing_prompts.figure jsonb),
 *   - the studio renderer (components/writing/figure.tsx), and
 *   - the grader (figureToText → the examiner sees the exact numbers, so Task
 *     Achievement is judged on whether the student reported the data accurately).
 *
 * v1 scope: data charts only — bar, grouped bar, line, pie, table. Maps and
 * process diagrams need a different (non-data) renderer and are deferred.
 */

import { z } from "zod";

export const FIGURE_KINDS = ["bar", "grouped_bar", "line", "pie", "table"] as const;
export type FigureKind = (typeof FIGURE_KINDS)[number];

// ---- Schema ----------------------------------------------------------------

const labelSchema = z.string().trim().min(1).max(48);
const titleSchema = z.string().trim().min(1).max(240);
const unitSchema = z.string().trim().max(16).optional();

const seriesSchema = z.object({
  name: labelSchema,
  values: z.array(z.number()).min(2).max(12),
});

/** Bar / grouped-bar / line all share an x-axis of categories + 1..n series. */
const axisFigureSchema = z
  .object({
    kind: z.enum(["bar", "grouped_bar", "line"]),
    title: titleSchema,
    x_label: z.string().trim().max(60).optional(),
    y_label: z.string().trim().max(60).optional(),
    unit: unitSchema,
    categories: z.array(labelSchema).min(2).max(12),
    series: z.array(seriesSchema).min(1).max(5),
  })
  .refine((f) => f.series.every((s) => s.values.length === f.categories.length), {
    message: "each series must have exactly one value per category",
  });

const pieFigureSchema = z.object({
  kind: z.literal("pie"),
  title: titleSchema,
  unit: unitSchema,
  slices: z
    .array(z.object({ label: labelSchema, value: z.number().nonnegative() }))
    .min(2)
    .max(8),
});

const tableFigureSchema = z
  .object({
    kind: z.literal("table"),
    title: titleSchema,
    unit: unitSchema,
    columns: z.array(labelSchema).min(2).max(6),
    rows: z.array(z.array(z.union([z.string().trim().max(48), z.number()])).min(2).max(6)).min(1).max(12),
  })
  .refine((f) => f.rows.every((r) => r.length === f.columns.length), {
    message: "each row must have exactly one cell per column",
  });

export const figureSchema = z.union([axisFigureSchema, pieFigureSchema, tableFigureSchema]);
export type Figure = z.infer<typeof figureSchema>;
export type AxisFigure = z.infer<typeof axisFigureSchema>;
export type PieFigure = z.infer<typeof pieFigureSchema>;
export type TableFigure = z.infer<typeof tableFigureSchema>;

/** Parse an unknown value (a stored jsonb column, a model reply) into a Figure,
 *  or null if it isn't a valid figure. Never throws — callers degrade to "no
 *  chart" rather than crashing the studio. */
export function parseFigure(value: unknown): Figure | null {
  if (value == null) return null;
  const parsed = figureSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// ---- Grader view -----------------------------------------------------------

/**
 * Flatten a figure into a compact, unambiguous text table for the grader. This is
 * the ground truth the examiner checks the student's description against — the
 * core of Task 1 Task Achievement (did they report the key features and make
 * accurate comparisons?).
 */
export function figureToText(figure: Figure): string {
  const u = "unit" in figure && figure.unit ? figure.unit : "";
  const withUnit = (n: number | string) => (u && typeof n === "number" ? `${n}${u}` : String(n));

  if (figure.kind === "pie") {
    const lines = figure.slices.map((s) => `  - ${s.label}: ${withUnit(s.value)}`);
    return [`Pie chart — ${figure.title}`, ...lines].join("\n");
  }

  if (figure.kind === "table") {
    const header = figure.columns.join(" | ");
    const body = figure.rows.map((r) => r.map((c) => withUnit(c)).join(" | "));
    return [`Table — ${figure.title}${u ? ` (values in ${u})` : ""}`, `  ${header}`, ...body.map((b) => `  ${b}`)].join("\n");
  }

  // bar / grouped_bar / line
  const kindLabel =
    figure.kind === "line" ? "Line graph" : figure.kind === "grouped_bar" ? "Grouped bar chart" : "Bar chart";
  const axis = [figure.x_label ? `x: ${figure.x_label}` : "", figure.y_label ? `y: ${figure.y_label}` : ""]
    .filter(Boolean)
    .join("; ");
  const header = ["series \\ category", ...figure.categories].join(" | ");
  const rows = figure.series.map((s) => [s.name, ...s.values.map((v) => withUnit(v))].join(" | "));
  return [
    `${kindLabel} — ${figure.title}${u ? ` (values in ${u})` : ""}${axis ? ` [${axis}]` : ""}`,
    `  ${header}`,
    ...rows.map((r) => `  ${r}`),
  ].join("\n");
}
