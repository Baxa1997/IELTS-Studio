"use client";

import { useState } from "react";

import { NumberField, Stepper, Choice } from "../../_components/controls";
import { fill, plain, type IeltsCopy } from "../../_lib/copy";
import {
  IELTS_SKILLS,
  SKILL_BANDS,
  averageBand,
  ieltsToCefr,
  nextHalfBand,
  overallBand,
  rawToBand,
  roundingRule,
  type IeltsSkill,
  type RawTable,
} from "../../_lib/scores";
import { levelBackground } from "../../_lib/tool-css";

/** A plausible starting point rather than zeros: the first thing a visitor
 *  sees is a worked result, which explains the tool faster than any label. */
const START: Record<IeltsSkill, number> = { listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6.0 };

const RAW_TABLES: RawTable[] = ["listening", "academicReading", "generalReading"];

export function IeltsCalculator({ copy }: { copy: Pick<IeltsCopy, "overall" | "raw"> }) {
  const { overall: o, raw: r } = copy;
  const [bands, setBands] = useState(START);
  const [table, setTable] = useState<RawTable>("listening");
  const [correct, setCorrect] = useState(30);
  const [used, setUsed] = useState(false);

  const list = IELTS_SKILLS.map((s) => bands[s]);
  const average = averageBand(list);
  const band = overallBand(list);
  const cefr = ieltsToCefr(band);
  const next = nextHalfBand(bands);
  const rule = roundingRule(average);
  const rounding = rule === "exact" ? o.exact : fill(o[rule], { avg: plain(average), band: band.toFixed(1) });

  const rawBand = rawToBand(table, correct);
  const target: IeltsSkill = table === "listening" ? "listening" : "reading";

  const set = (skill: IeltsSkill, v: number) => setBands((b) => ({ ...b, [skill]: v }));

  return (
    <>
      <div className="tl-calc">
        <div className="tl-card">
          {IELTS_SKILLS.map((skill) => (
            <div key={skill} className="tl-row">
              <div className="tl-skill">{o.skills[skill]}</div>
              <Stepper
                value={bands[skill]}
                values={SKILL_BANDS}
                onChange={(v) => set(skill, v)}
                label={o.skills[skill]}
                minusLabel={fill(o.minus, { skill: o.skills[skill] })}
                plusLabel={fill(o.plus, { skill: o.skills[skill] })}
              />
            </div>
          ))}
        </div>

        <div className="tl-sticky">
          {/* The one live region: the steppers announce nothing themselves, so
              a change is read out once, as its result. */}
          <div className="tl-result" style={{ backgroundImage: levelBackground(cefr ?? "below") }} aria-live="polite">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="tl-pill">{o.resultLabel}</span>
              <span className="tl-pill">{cefr ? fill(o.cefr, { level: cefr }) : o.belowB1}</span>
            </div>
            {/* Keyed on the band, so the number re-enters each time it changes. */}
            <div key={band} className="tl-big tl-pop" style={{ marginTop: 14 }}>
              {band.toFixed(1)}
            </div>
            <div className="tl-lead">{o.descriptions[Math.floor(band)]}</div>
            <p className="tl-soft">
              {fill(o.average, { avg: plain(average) })}. {rounding}
            </p>
            <p className="tl-tip">
              {next
                ? fill(o.next, { raise: next.raise.toFixed(1), skill: o.skills[next.skill], next: next.overall.toFixed(1) })
                : o.top}
            </p>
          </div>
        </div>
      </div>

      <div className="tl-card" style={{ marginTop: 22 }}>
        <h3 className="tl-h3">{r.title}</h3>
        <p className="tl-hint">{r.hint}</p>
        <Choice
          value={table}
          label={r.title}
          options={RAW_TABLES.map((id) => ({ id, label: r.tabs[id] }))}
          onChange={(t) => {
            setTable(t);
            setUsed(false);
          }}
        />
        <div className="tl-calc" style={{ marginTop: 20, alignItems: "center" }}>
          <NumberField
            id="raw-correct"
            label={r.correct}
            value={correct}
            min={0}
            max={40}
            step={1}
            onChange={(v) => {
              setCorrect(v);
              setUsed(false);
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <div aria-live="polite">
              <div className="tl-kicker">{fill(r.outOf, { n: correct })}</div>
              <div key={`${table}-${rawBand}`} className="tl-answer tl-pop">
                {rawBand === null ? r.below : fill(r.band, { band: rawBand.toFixed(1) })}
              </div>
            </div>
            {rawBand !== null ? (
              <button
                type="button"
                className="tl-use"
                onClick={() => {
                  set(target, rawBand);
                  setUsed(true);
                }}
              >
                {used ? `✓ ${r.used}` : fill(r.use, { skill: o.skills[target] })}
              </button>
            ) : null}
          </div>
        </div>
        <p className="tl-note">{r.note}</p>
      </div>
    </>
  );
}
