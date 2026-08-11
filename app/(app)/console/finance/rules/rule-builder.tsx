"use client";

import { useActionState, useMemo, useState } from "react";

import {
  Field,
  fieldStyle,
  FormMessage,
  SubmitButton,
  useDrawerClose,
} from "@/components/console/finance-ui";
import { formatMoney, fromMajor, parseMoney, toMajor } from "@/lib/finance/money";
import {
  computeTeacherPay,
  describeComponent,
  type SalaryComponent,
  type SalaryComponentKind,
  type SalaryRule,
} from "@/lib/finance/salary";

import { type ActionState, saveSalaryRule } from "../actions";

/**
 * The rule builder.
 *
 * This is the screen the whole finance module exists to make possible: a center
 * describing its own pay arrangement without anyone editing code. Each part of
 * the arrangement is a component; components stack; the sentence under the
 * editor is the rule read back in English, and the panel beside it runs the
 * real engine over numbers you type, so the owner sees what a teacher with 15
 * students and 12 lessons would actually be paid BEFORE it is anybody's salary.
 *
 * The simulator is not a mock. It imports the same `computeTeacherPay` the
 * payroll run uses, so a preview that says 4 960 000 is a promise the run will
 * keep.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const INDIGO = "#4340CB";
const GREEN = "#16794C";

const KIND_LABEL: Record<SalaryComponentKind, string> = {
  fixed: "Base salary",
  per_student: "Per student",
  group_rate: "The class's own rate",
  revenue_share: "Share of tuition",
  per_lesson: "Per lesson taught",
  per_student_lesson: "Per student per lesson",
  tiered_per_student: "Per student, tiered",
  tiered_revenue_share: "Share of tuition, tiered",
  attendance_bonus: "Attendance bonus",
};

const KIND_HINT: Record<SalaryComponentKind, string> = {
  fixed: "A flat monthly amount, paid once however many classes they teach.",
  per_student: "An amount per head, counted per class.",
  group_rate:
    "Whatever teacher rate is set on each class, prorated by the lessons each student was enrolled for. The default \u2014 you only need a rule for something else.",
  revenue_share: "A percentage of what each of their classes collected.",
  per_lesson: "An amount for every register marked.",
  per_student_lesson: "An amount per student who actually attended, per lesson.",
  tiered_per_student: "A per-head rate that steps up as the teacher grows.",
  tiered_revenue_share: "A percentage that steps up as the teacher grows.",
  attendance_bonus: "A bonus when attendance holds above a threshold.",
};

function blank(kind: SalaryComponentKind): SalaryComponent {
  switch (kind) {
    case "fixed":
      return { kind, amountMinor: 0 };
    case "per_student":
      return { kind, amountMinor: 0, count: "enrolled" };
    case "group_rate":
      return { kind };
    case "revenue_share":
      return { kind, percent: 40, of: "collected" };
    case "per_lesson":
      return { kind, amountMinor: 0 };
    case "per_student_lesson":
      return { kind, amountMinor: 0 };
    case "tiered_per_student":
      return {
        kind,
        count: "enrolled",
        mode: "whole",
        across: "teacher",
        tiers: [
          { from: 0, amountMinor: 0 },
          { from: 20, amountMinor: 0 },
        ],
      };
    case "tiered_revenue_share":
      return {
        kind,
        of: "collected",
        by: "students",
        mode: "whole",
        across: "teacher",
        tiers: [
          { from: 0, percent: 35 },
          { from: 20, percent: 45 },
        ],
      };
    case "attendance_bonus":
      return { kind, minRatePct: 85, amountMinor: 0 };
  }
}

export interface RuleDraft {
  id?: string;
  name: string;
  scope: "org" | "group" | "teacher";
  groupId: string | null;
  teacherId: string | null;
  components: SalaryComponent[];
  floorMinor: number | null;
  capMinor: number | null;
}

export function RuleBuilder({
  rule,
  groups,
  teachers,
  currency,
}: {
  rule?: RuleDraft;
  groups: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  currency: string;
}) {
  const closeDrawer = useDrawerClose();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await saveSalaryRule(prev, formData);
      if (next.ok) closeDrawer();
      return next;
    },
    {} as ActionState,
  );

  const [scope, setScope] = useState<RuleDraft["scope"]>(rule?.scope ?? "org");
  const [components, setComponents] = useState<SalaryComponent[]>(
    rule?.components?.length ? rule.components : [blank("revenue_share")],
  );
  const [floor, setFloor] = useState(
    rule?.floorMinor == null ? "" : String(toMajor(rule.floorMinor, currency)),
  );
  const [cap, setCap] = useState(
    rule?.capMinor == null ? "" : String(toMajor(rule.capMinor, currency)),
  );

  // Simulator inputs — one class, described in the units a center thinks in.
  const [simStudents, setSimStudents] = useState(15);
  const [simFee, setSimFee] = useState(500_000);
  const [simCollectedPct, setSimCollectedPct] = useState(90);
  const [simLessons, setSimLessons] = useState(12);
  const [simAttendancePct, setSimAttendancePct] = useState(85);
  // Only read by the class-rate component, which takes its number from the
  // class rather than from the rule.
  const [simRate, setSimRate] = useState("200000");

  const money = (m: number) => formatMoney(m, currency);

  const update = (index: number, patch: Partial<SalaryComponent>) =>
    setComponents((list) =>
      list.map((c, i) => (i === index ? ({ ...c, ...patch } as SalaryComponent) : c)),
    );

  const preview = useMemo(() => {
    const invoiced = simStudents * fromMajor(simFee, currency);
    const collected = Math.round((invoiced * simCollectedPct) / 100);
    const studentsPaid = Math.round((simStudents * simCollectedPct) / 100);
    const marks = simStudents * simLessons;
    const attended = Math.round((marks * simAttendancePct) / 100);

    const simulated: SalaryRule = {
      id: "preview",
      name: "Preview",
      scope: "org",
      groupId: null,
      teacherId: null,
      components,
      floorMinor: parseMoney(floor, currency),
      capMinor: parseMoney(cap, currency),
    };

    return computeTeacherPay(
      {
        teacherId: "preview-teacher",
        teacherName: "Preview",
        groups: [
          {
            groupId: "preview-group",
            groupName: "Example class",
            studentsEnrolled: simStudents,
            studentsPaid,
            studentsAttended: Math.min(simStudents, Math.ceil(attended / Math.max(1, simLessons))),
            collectedMinor: collected,
            invoicedMinor: invoiced,
            lessonsHeld: simLessons,
            studentLessons: attended,
            attendanceMarks: marks,
            // The simulator has no real class behind it, so the class-rate
            // component previews against a full month of every simulated head.
            teacherRateMinor: simRate === "" ? null : parseMoney(simRate, currency),
            lessonsPlanned: simLessons,
            studentsProrated: simStudents,
            classRatePayMinor: simStudents * (parseMoney(simRate, currency) ?? 0),
          },
        ],
      },
      [simulated],
    );
  }, [
    components,
    floor,
    cap,
    currency,
    simStudents,
    simFee,
    simCollectedPct,
    simLessons,
    simAttendancePct,
    simRate,
  ]);

  const sentence = components
    .map((c) => describeComponent(c, money))
    .filter(Boolean)
    .join(" + ");

  return (
    <form action={formAction}>
      {rule?.id ? <input type="hidden" name="id" value={rule.id} /> : null}
      <input type="hidden" name="components" value={JSON.stringify(components)} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Rule name" hint="appears on every payslip it produces">
          <input
            name="name"
            required
            defaultValue={rule?.name}
            placeholder="House rule — 40% of collected tuition"
            style={fieldStyle}
          />
        </Field>

        <Field label="Applies to">
          <select
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as RuleDraft["scope"])}
            style={fieldStyle}
          >
            <option value="org">Everyone — the center&apos;s house rule</option>
            <option value="group">One class — whoever teaches it</option>
            <option value="teacher">One teacher</option>
          </select>
        </Field>

        {scope === "group" ? (
          <Field label="Class">
            <select name="group_id" defaultValue={rule?.groupId ?? ""} required style={fieldStyle}>
              <option value="">Pick a class…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {scope === "teacher" ? (
          <>
            <Field label="Teacher">
              <select
                name="teacher_id"
                defaultValue={rule?.teacherId ?? ""}
                required
                style={fieldStyle}
              >
                <option value="">Pick a teacher…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Only for one class" hint="optional — leave blank for all their classes">
              <select name="group_id" defaultValue={rule?.groupId ?? ""} style={fieldStyle}>
                <option value="">All their classes</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : null}
      </div>

      {/* ── the parts ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".07em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#8B8999",
            marginBottom: 10,
          }}
        >
          What the pay is made of
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {components.map((component, index) => (
            <ComponentEditor
              key={index}
              component={component}
              currency={currency}
              onChange={(patch) => update(index, patch)}
              onRemove={() => setComponents((list) => list.filter((_, i) => i !== index))}
            />
          ))}
        </div>

        <div
          style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}
        >
          <select
            aria-label="Add a part"
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              setComponents((list) => [...list, blank(e.target.value as SalaryComponentKind)]);
              e.currentTarget.value = "";
            }}
            style={{ ...fieldStyle, width: "auto", background: "#FAFAF8" }}
          >
            <option value="">+ Add a part…</option>
            {(Object.keys(KIND_LABEL) as SalaryComponentKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── guarantees ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        <Field label={`Guaranteed minimum (${currency})`} hint="optional">
          <input
            name="floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            inputMode="numeric"
            placeholder="none"
            style={fieldStyle}
          />
        </Field>
        <Field label={`Ceiling (${currency})`} hint="optional">
          <input
            name="cap"
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            inputMode="numeric"
            placeholder="none"
            style={fieldStyle}
          />
        </Field>
      </div>

      {/* ── read back ─────────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 18,
          padding: "12px 14px",
          background: "#F7F7FC",
          border: `1px solid #E1E0F4`,
          borderRadius: 10,
          fontSize: 12.5,
          lineHeight: 1.6,
          color: INK,
        }}
      >
        <strong style={{ color: INDIGO }}>This rule pays:</strong> {sentence || "nothing yet."}
        {floor || cap ? (
          <>
            {" "}
            {floor ? `Never below ${money(parseMoney(floor, currency) ?? 0)}.` : ""}
            {cap ? ` Never above ${money(parseMoney(cap, currency) ?? 0)}.` : ""}
          </>
        ) : null}
      </div>

      {/* ── simulator ─────────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid #E7E5DF",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "11px 14px",
            background: "#FAFAF8",
            borderBottom: "1px solid #F0EEE9",
            fontSize: 12.5,
            color: MUTED,
          }}
        >
          Try it on one class — the real engine, not an estimate.
        </div>

        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <SimField label="Students" value={simStudents} onChange={setSimStudents} />
            <SimField
              label={`Monthly fee (${currency})`}
              value={simFee}
              onChange={setSimFee}
              step={50_000}
            />
            <SimField
              label="Collected %"
              value={simCollectedPct}
              onChange={setSimCollectedPct}
              max={100}
            />
            <SimField label="Lessons held" value={simLessons} onChange={setSimLessons} />
            <SimField
              label={`Class teacher rate (${currency})`}
              value={Number(simRate) || 0}
              onChange={(v) => setSimRate(String(v))}
            />
            <SimField
              label="Attendance %"
              value={simAttendancePct}
              onChange={setSimAttendancePct}
              max={100}
            />
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid #F0EEE9",
            }}
          >
            {preview.lines.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12.5, color: FAINT }}>
                Add a part above to see what it pays.
              </p>
            ) : (
              <>
                {preview.lines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      fontSize: 12.5,
                      color: MUTED,
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ minWidth: 0 }}>{line.label}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums", color: INK }}>
                      {money(line.amountMinor)}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid #F0EEE9",
                    fontSize: 14,
                    fontWeight: 700,
                    color: INK,
                  }}
                >
                  <span>Teacher takes home</span>
                  <span style={{ color: GREEN, fontVariantNumeric: "tabular-nums" }}>
                    {money(preview.grossMinor)}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: FAINT, marginTop: 6, lineHeight: 1.5 }}>
                  On {money(fromMajor(simFee, currency) * simStudents)} invoiced, of which{" "}
                  {money(
                    Math.round((fromMajor(simFee, currency) * simStudents * simCollectedPct) / 100),
                  )}{" "}
                  collected — that is{" "}
                  {Math.round(
                    (100 * preview.grossMinor) /
                      Math.max(
                        1,
                        Math.round(
                          (fromMajor(simFee, currency) * simStudents * simCollectedPct) / 100,
                        ),
                      ),
                  )}
                  % of the class&apos;s takings.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <SubmitButton pending={pending}>{rule?.id ? "Save rule" : "Create rule"}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/* ── one component's editor ───────────────────────────────────────────────── */

function ComponentEditor({
  component,
  currency,
  onChange,
  onRemove,
}: {
  component: SalaryComponent;
  currency: string;
  onChange: (patch: Partial<SalaryComponent>) => void;
  onRemove: () => void;
}) {
  const amountField = (value: number, key: string) => (
    <input
      inputMode="numeric"
      value={value === 0 ? "" : String(toMajor(value, currency))}
      onChange={(e) => onChange({ [key]: parseMoney(e.target.value, currency) ?? 0 } as never)}
      placeholder="0"
      style={{ ...fieldStyle, padding: "7px 9px" }}
    />
  );

  return (
    <div
      style={{
        border: "1px solid #E7E5DF",
        borderRadius: 11,
        padding: "12px 13px",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 9 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>
          {KIND_LABEL[component.kind]}
        </span>
        <button
          type="button"
          onClick={onRemove}
          style={{
            marginLeft: "auto",
            background: "none",
            border: 0,
            color: FAINT,
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Remove
        </button>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 11.5, color: FAINT, lineHeight: 1.45 }}>
        {KIND_HINT[component.kind]}
      </p>

      {component.kind === "fixed" ? (
        <Row label={`Amount (${currency})`}>
          {amountField(component.amountMinor, "amountMinor")}
        </Row>
      ) : null}

      {component.kind === "per_student" ? (
        <>
          <Row label={`Per student (${currency})`}>
            {amountField(component.amountMinor, "amountMinor")}
          </Row>
          <Row label="Counting">
            <select
              value={component.count}
              onChange={(e) => onChange({ count: e.target.value } as never)}
              style={{ ...fieldStyle, padding: "7px 9px" }}
            >
              <option value="enrolled">everyone enrolled</option>
              <option value="paid">only those who paid</option>
              <option value="attended">only those who attended</option>
            </select>
          </Row>
        </>
      ) : null}

      {component.kind === "revenue_share" ? (
        <>
          <Row label="Percent">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={component.percent}
              onChange={(e) => onChange({ percent: Number(e.target.value) } as never)}
              style={{ ...fieldStyle, padding: "7px 9px" }}
            />
          </Row>
          <Row label="Of">
            <select
              value={component.of}
              onChange={(e) => onChange({ of: e.target.value } as never)}
              style={{ ...fieldStyle, padding: "7px 9px" }}
            >
              <option value="collected">tuition actually collected</option>
              <option value="invoiced">tuition invoiced, paid or not</option>
            </select>
          </Row>
        </>
      ) : null}

      {component.kind === "per_lesson" || component.kind === "per_student_lesson" ? (
        <Row label={`Rate (${currency})`}>{amountField(component.amountMinor, "amountMinor")}</Row>
      ) : null}

      {component.kind === "attendance_bonus" ? (
        <>
          <Row label={`Bonus (${currency})`}>
            {amountField(component.amountMinor, "amountMinor")}
          </Row>
          <Row label="Paid when attendance is at least">
            <input
              type="number"
              min={0}
              max={100}
              value={component.minRatePct}
              onChange={(e) => onChange({ minRatePct: Number(e.target.value) } as never)}
              style={{ ...fieldStyle, padding: "7px 9px" }}
            />
          </Row>
        </>
      ) : null}

      {component.kind === "tiered_per_student" || component.kind === "tiered_revenue_share" ? (
        <>
          <Row label="Thresholds counted">
            <select
              value={component.across}
              onChange={(e) => onChange({ across: e.target.value } as never)}
              style={{ ...fieldStyle, padding: "7px 9px" }}
            >
              <option value="teacher">across all their classes</option>
              <option value="group">within each class</option>
            </select>
          </Row>
          {component.kind === "tiered_revenue_share" ? (
            <Row label="Stepped by">
              <select
                value={component.by}
                onChange={(e) => onChange({ by: e.target.value } as never)}
                style={{ ...fieldStyle, padding: "7px 9px" }}
              >
                <option value="students">number of students</option>
                <option value="revenue">amount collected</option>
              </select>
            </Row>
          ) : null}

          <div style={{ marginTop: 8 }}>
            {component.tiers.map((tier, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 24px",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <input
                  type="number"
                  min={0}
                  value={
                    component.kind === "tiered_revenue_share" && component.by === "revenue"
                      ? toMajor(tier.from, currency)
                      : tier.from
                  }
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const from =
                      component.kind === "tiered_revenue_share" && component.by === "revenue"
                        ? fromMajor(raw, currency)
                        : raw;
                    onChange({
                      tiers: component.tiers.map((t, j) => (j === i ? { ...t, from } : t)),
                    } as never);
                  }}
                  placeholder="from"
                  style={{ ...fieldStyle, padding: "7px 9px" }}
                />
                {component.kind === "tiered_per_student" ? (
                  <input
                    inputMode="numeric"
                    value={
                      (tier as { amountMinor: number }).amountMinor === 0
                        ? ""
                        : String(toMajor((tier as { amountMinor: number }).amountMinor, currency))
                    }
                    onChange={(e) =>
                      onChange({
                        tiers: component.tiers.map((t, j) =>
                          j === i
                            ? { ...t, amountMinor: parseMoney(e.target.value, currency) ?? 0 }
                            : t,
                        ),
                      } as never)
                    }
                    placeholder={`per student (${currency})`}
                    style={{ ...fieldStyle, padding: "7px 9px" }}
                  />
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={(tier as { percent: number }).percent}
                    onChange={(e) =>
                      onChange({
                        tiers: component.tiers.map((t, j) =>
                          j === i ? { ...t, percent: Number(e.target.value) } : t,
                        ),
                      } as never)
                    }
                    placeholder="%"
                    style={{ ...fieldStyle, padding: "7px 9px" }}
                  />
                )}
                <button
                  type="button"
                  onClick={() =>
                    onChange({ tiers: component.tiers.filter((_, j) => j !== i) } as never)
                  }
                  disabled={component.tiers.length <= 1}
                  aria-label="Remove band"
                  style={{
                    background: "none",
                    border: 0,
                    color: FAINT,
                    cursor: component.tiers.length <= 1 ? "default" : "pointer",
                    fontSize: 15,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({
                  tiers: [
                    ...component.tiers,
                    component.kind === "tiered_per_student"
                      ? { from: 0, amountMinor: 0 }
                      : { from: 0, percent: 0 },
                  ],
                } as never)
              }
              style={{
                background: "none",
                border: 0,
                color: INDIGO,
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
              }}
            >
              + Add a band
            </button>
          </div>

          <Row label="Crossing a band">
            <select
              value={component.mode}
              onChange={(e) => onChange({ mode: e.target.value } as never)}
              style={{ ...fieldStyle, padding: "7px 9px" }}
            >
              <option value="whole">re-rates everything</option>
              <option value="marginal">applies to the excess only</option>
            </select>
          </Row>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.1fr",
        gap: 10,
        alignItems: "center",
        marginBottom: 7,
      }}
    >
      <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
      {children}
    </div>
  );
}

function SimField({
  label,
  value,
  onChange,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  step?: number;
}) {
  return (
    <label style={{ fontSize: 11.5, color: MUTED }}>
      {label}
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        style={{ ...fieldStyle, padding: "6px 9px", marginTop: 4 }}
      />
    </label>
  );
}
