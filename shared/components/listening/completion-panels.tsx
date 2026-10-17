"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { FlagButton, NumChip } from "./question-ui";
import { BAD, RUN } from "./theme";
import type { FormRow, QCtx, RenderView, TableView } from "./types";
import { BRAND as TK_BRAND, PANEL } from "@/lib/theme/tokens";

// ---- Question panels ---------------------------------------------------------

/** A template split into literal text and gap placeholders ("For {2} days" →
 *  [{text:"For "},{gap:2},{text:" days"}]). */
type TplPart = { text: string } | { gap: number };
export function templateParts(t: string): TplPart[] {
  const out: TplPart[] = [];
  const re = /\{(\d+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push({ text: t.slice(last, m.index) });
    out.push({ gap: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push({ text: t.slice(last) });
  return out;
}
export const gapNums = (t: string): number[] => [...t.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
export const rangeLabel = (nums: number[]): string =>
  nums.length ? `${Math.min(...nums)}–${Math.max(...nums)}` : "";

/** The 30×30 question-number chip — green once its answer is filled. */
function AnswerField({
  n,
  ctx,
  variant,
  grow,
}: {
  n: number;
  ctx: QCtx;
  variant: "block" | "inline";
  grow?: boolean;
}) {
  const result = ctx.results?.get(n) ?? null;
  const graded = result != null;
  const correct = graded && result.is_correct;
  const wrong = graded && !result.is_correct;
  const answered = (ctx.answers[n] ?? "").trim() !== "";
  const focused = ctx.focusedQ === n;
  const inline = variant === "inline";
  const border = correct
    ? RUN.okBorder
    : wrong
      ? RUN.badBorder
      : focused
        ? RUN.v
        : answered
          ? RUN.okBorder
          : RUN.bField;
  const bg = correct
    ? RUN.okTint
    : wrong
      ? RUN.badTint
      : focused
        ? RUN.fieldFocus
        : answered
          ? RUN.okTint
          : RUN.field;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        flex: grow ? 1 : undefined,
        minWidth: grow ? 0 : undefined,
        verticalAlign: inline ? "middle" : undefined,
      }}
    >
      {inline ? (
        <span
          style={{
            width: 25,

            fontFamily: RUN.sans,
            fontSize: 11.5,
            fontWeight: 500,
            color: answered ? RUN.ok : RUN.vHover,
            background: answered ? RUN.okBg : RUN.vBg,
            borderRadius: 6,
            padding: "1px 6px",
          }}
        >
          {n}
        </span>
      ) : null}
      <input
        className="lp-run-input"
        value={ctx.answers[n] ?? ""}
        onChange={(e) => ctx.setAnswers((a) => ({ ...a, [n]: e.target.value }))}
        onFocus={() => ctx.setFocus(n)}
        disabled={graded}
        placeholder={inline ? "answer" : "Type your answer"}
        aria-label={`Answer ${n}`}
        style={{
          flex: grow ? 1 : undefined,
          width: grow ? undefined : inline ? 150 : 150,
          minWidth: 0,
          height: inline ? 28 : 36,
          padding: inline ? "0 11px" : "0 15px",
          fontFamily: RUN.sans,
          fontSize: inline ? 15 : 15.5,
          fontWeight: 400,
          color: RUN.t1,
          background: bg,
          border: `1.5px solid ${border}`,
          borderRadius: inline ? 8 : 9,
          outline: "none",
        }}
      />
      {wrong ? (
        <span style={{ fontSize: 13.5, fontWeight: 700, color: RUN.ok, whiteSpace: "nowrap" }}>
          → {result?.correct_answer}
        </span>
      ) : null}
      {graded ? (
        correct ? (
          <Check size={16} style={{ color: RUN.ok }} />
        ) : (
          <X size={16} style={{ color: BAD }} />
        )
      ) : null}
    </span>
  );
}

export function CardHeader({
  range,
  title,
  instruction,
}: {
  range: string;
  title: string;
  instruction?: string;
}) {
  return (
    <div style={{ padding: "6px 0 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: RUN.sans,
            fontSize: 11.5,
            fontWeight: 600,
            color: RUN.report,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Questions {range}
        </div>
        <ReportButton />
      </div>
      <h2
        style={{
          fontFamily: RUN.display,
          fontSize: "clamp(20px,2.2vw,20px)",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: RUN.t1,
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {instruction ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: RUN.vSoft,
            color: TK_BRAND,
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 16px",
            borderRadius: 10,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, stroke: RUN.vDeep }}
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
          {instruction}
        </div>
      ) : null}
    </div>
  );
}

function ReportButton() {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setDone(true)}
      disabled={done}
      title="Report a problem with these questions"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        borderRadius: 8,
        border: `1px solid ${done ? RUN.okBorder : RUN.reportBorder}`,
        background: done ? RUN.okBg : RUN.reportBg,
        color: done ? RUN.ok : RUN.report,
        fontFamily: RUN.sans,
        fontSize: 12,
        fontWeight: 600,
        cursor: done ? "default" : "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {done ? (
        <>
          <Check size={12} /> Reported
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2 1 21h22L12 2z" />
            <line x1="12" y1="9" x2="12" y2="14" />
            <circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          Report
        </>
      )}
    </button>
  );
}

export function Gapped({ template, ctx }: { template: string; ctx: QCtx }) {
  return (
    <>
      {templateParts(template).map((p, i) =>
        "text" in p ? (
          <span key={i}>{p.text}</span>
        ) : (
          <span
            key={i}
            id={`q-${p.gap}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              verticalAlign: "middle",
            }}
          >
            <AnswerField n={p.gap} ctx={ctx} variant="inline" />
            <FlagButton flagged={ctx.flags.has(p.gap)} onClick={() => ctx.toggleFlag(p.gap)} />
          </span>
        ),
      )}
    </>
  );
}

function FormRowView({ r, ctx }: { r: FormRow; ctx: QCtx }) {
  const parts = templateParts(r.template);
  const gaps = parts.filter((p): p is { gap: number } => "gap" in p).map((p) => p.gap);
  const primary = gaps[0] ?? 0;
  const single = gaps.length === 1;
  const answeredPrimary = (ctx.answers[primary] ?? "").trim() !== "";
  return (
    <div
      id={`q-${primary}`}
      style={{
        display: "grid",
        gridTemplateColumns: "26px minmax(72px,150px) 1fr",
        gap: 14,
        alignItems: "center",
        minHeight: 58,
        padding: "9px 0",
        borderBottom: `1px solid ${RUN.bRow}`,
      }}
    >
      <NumChip n={primary} answered={answeredPrimary} />
      <div style={{ fontFamily: RUN.sans, fontSize: 15, fontWeight: 600, color: RUN.t1 }}>
        {r.label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {parts.map((p, i) =>
          "text" in p ? (
            p.text.trim() ? (
              <span key={i} style={{ fontSize: 14.5, color: RUN.report, whiteSpace: "nowrap" }}>
                {p.text.trim()}
              </span>
            ) : null
          ) : (
            <AnswerField key={i} n={p.gap} ctx={ctx} variant="block" grow={single} />
          ),
        )}
        <FlagButton flagged={ctx.flags.has(primary)} onClick={() => ctx.toggleFlag(primary)} />
      </div>
    </div>
  );
}

/** Small bold title used when a completion panel renders inside a multi-group
 *  part (bare mode): the group's QuestionsHeading already shows the range +
 *  instruction, so the panel must not repeat its own full CardHeader. */
function BareTitle({ title }: { title?: string }) {
  if (!title) return null;
  return (
    <div
      style={{
        fontFamily: RUN.sans,
        fontSize: 16,
        fontWeight: 700,
        color: RUN.t1,
        padding: "2px 0 10px",
      }}
    >
      {title}
    </div>
  );
}

export function FormPanel({
  form,
  ctx,
  bare,
}: {
  form: NonNullable<RenderView["form"]>;
  ctx: QCtx;
  bare?: boolean;
}) {
  const rows = useMemo(
    () =>
      form.rows.map((r, i) => {
        const prev =
          form.rows
            .slice(0, i)
            .map((x) => x.section)
            .filter(Boolean)
            .pop() ?? null;
        return { ...r, header: r.section && r.section !== prev ? r.section : null };
      }),
    [form],
  );
  const range = rangeLabel(form.rows.flatMap((r) => gapNums(r.template)));
  const hasSections = rows.some((r) => r.header);
  return (
    <>
      {bare ? (
        <BareTitle title={form.title} />
      ) : (
        <CardHeader
          range={range}
          title={form.title}
          instruction={`Write ${form.word_limit} for each answer`}
        />
      )}
      {hasSections ? (
        <div>
          {rows.map((r, i) => (
            <div key={i}>
              {r.header ? (
                <div
                  style={{
                    fontFamily: RUN.sans,
                    fontSize: 14,
                    fontWeight: 700,
                    color: RUN.t1,
                    padding: "16px 0 4px",
                  }}
                >
                  {r.header}
                </div>
              ) : null}
              <FormRowView r={r} ctx={ctx} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="lp-form2"
          style={{ gridTemplateRows: `repeat(${Math.ceil(rows.length / 2)}, auto)` }}
        >
          {rows.map((r, i) => (
            <FormRowView key={i} r={r} ctx={ctx} />
          ))}
        </div>
      )}
    </>
  );
}

export function NotesPanel({
  notes,
  ctx,
  bare,
}: {
  notes: NonNullable<RenderView["notes"]>;
  ctx: QCtx;
  bare?: boolean;
}) {
  const range = rangeLabel(
    notes.sections.flatMap((s) => s.lines).flatMap((l) => gapNums(l.template)),
  );
  return (
    <>
      {bare ? (
        <BareTitle title={notes.title} />
      ) : (
        <CardHeader
          range={range}
          title={notes.title}
          instruction={`Write ${notes.word_limit} for each answer`}
        />
      )}
      <div style={{ padding: "0 0 8px" }}>
        {notes.sections.map((s, si) => (
          <div key={si} style={{ marginBottom: 6 }}>
            <div
              style={{
                fontFamily: RUN.sans,
                fontSize: 14,
                fontWeight: 500,
                color: RUN.t1,
                padding: "18px 0 6px",
              }}
            >
              {s.heading}
            </div>
            {s.lines.map((l, li) => (
              <div
                key={li}
                style={{
                  padding: "6px 0",
                  paddingLeft: l.sub ? 34 : 14,
                  fontFamily: RUN.sans,
                  fontSize: 15,
                  lineHeight: 2,
                  color: RUN.t1,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ color: RUN.t5, flex: "none", lineHeight: 2 }}>•</span>
                <span>
                  <Gapped template={l.template} ctx={ctx} />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/** Table completion (P1/P4 table variant) — a grid whose cells carry `{n}` gaps.
 *  Same word-answer machinery as the form/notes panels, laid out in columns. */
export function TablePanel({ table, ctx, bare }: { table: TableView; ctx: QCtx; bare?: boolean }) {
  const range = rangeLabel(table.rows.flat().flatMap(gapNums));
  const cell: React.CSSProperties = {
    border: `1px solid ${RUN.bField}`,
    padding: "10px 14px",
    fontFamily: RUN.sans,
    fontSize: 15,
    color: RUN.t1,
    verticalAlign: "middle",
    textAlign: "left",
  };
  return (
    <>
      {bare ? (
        <BareTitle title={table.title} />
      ) : (
        <CardHeader
          range={range}
          title={table.title}
          instruction={`Write ${table.word_limit} for each answer`}
        />
      )}
      <div style={{ overflowX: "auto", paddingBottom: 6 }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: Math.max(420, table.columns.length * 180),
          }}
        >
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th
                  key={i}
                  style={{
                    ...cell,
                    background: RUN.vSoft,
                    color: TK_BRAND,
                    fontWeight: 700,
                    fontSize: 13.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((c, ci) => (
                  <td
                    key={ci}
                    style={{
                      ...cell,
                      fontWeight: ci === 0 ? 700 : 400,
                      background: ci === 0 ? RUN.strip : PANEL,
                      whiteSpace: ci === 0 ? "nowrap" : "normal",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 4,
                        lineHeight: 2,
                      }}
                    >
                      <Gapped template={c} ctx={ctx} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
