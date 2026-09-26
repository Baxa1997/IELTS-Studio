import { STAGE_META } from "@/lib/lessons/theme";
import { isOpen, type Exercise } from "@/lib/lessons/types";

/**
 * The question sheet, for paper only.
 *
 * HIDDEN ON SCREEN (`.pa-print-only`) and revealed by the print stylesheet.
 * It exists because the answer key came off this page: a teacher still needs a
 * worksheet to hand out, and the only way to guarantee the printout matches the
 * lesson students actually sit is to print the lesson's own exercises rather
 * than regenerate them somewhere else.
 *
 * No answers, ever. There is no toggle to get wrong, so "PDF worksheet" cannot
 * quietly become an answer key with a class watching.
 *
 * Blanks rather than inputs: this is paper. An `ordering` item gets numbered
 * lines, an MCQ gets lettered options, everything else gets a rule to write on.
 */
export function PrintableWorksheet({
  title,
  exercises,
}: {
  title: string;
  exercises: Exercise[];
}) {
  return (
    <div className="pa-print-only">
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{title}</h1>
      <p style={{ fontSize: 12, margin: "0 0 18px", color: "#555" }}>
        Name: ________________________________ Date: ______________
      </p>

      {STAGE_META.map((stage) => {
        const items = exercises.filter((e) => e.stage === stage.key);
        if (items.length === 0) return null;
        return (
          <div key={stage.key} style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>{stage.label}</h2>
            {items.map((exercise) => (
              <div key={exercise.id} className="pa-q" style={{ margin: "0 0 14px" }}>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <strong style={{ marginRight: 8 }}>{exercises.indexOf(exercise) + 1}.</strong>
                  {exercise.prompt}
                </div>

                {!isOpen(exercise) && exercise.options ? (
                  <div style={{ margin: "6px 0 0 24px", fontSize: 13, lineHeight: 1.7 }}>
                    {exercise.options.map((opt, i) => (
                      <div key={opt}>
                        {exercise.type === "ordering" || exercise.type === "matching"
                          ? "____  "
                          : `${String.fromCharCode(65 + i)}.  `}
                        {opt}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      margin: "8px 0 0 24px",
                      borderBottom: "1px solid #999",
                      height: isOpen(exercise) ? 54 : 18,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
