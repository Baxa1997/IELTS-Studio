"use client";

import { useState } from "react";

/**
 * The calculators' inputs.
 *
 * A STEPPER FOR BANDS, A FIELD AND A SLIDER FOR MARKS. A band moves in half
 * steps over seventeen values, which two big buttons do faster than a keyboard
 * on a phone; a mark out of 75 is quicker typed than tapped, and the slider
 * under it is there for the thumb.
 */

export function Stepper({
  value,
  values,
  onChange,
  label,
  minusLabel,
  plusLabel,
}: {
  value: number;
  values: readonly number[];
  onChange: (v: number) => void;
  label: string;
  minusLabel: string;
  plusLabel: string;
}) {
  const i = values.indexOf(value);
  return (
    <div className="tl-step" role="group" aria-label={label}>
      <button type="button" aria-label={minusLabel} disabled={i <= 0} onClick={() => onChange(values[i - 1])}>
        −
      </button>
      {/* Not a live region: the result card is, and four steppers announcing
          as well would read every change out twice. */}
      <output>{value.toFixed(1)}</output>
      <button type="button" aria-label={plusLabel} disabled={i >= values.length - 1} onClick={() => onChange(values[i + 1])}>
        +
      </button>
    </div>
  );
}

/**
 * A number with its slider.
 *
 * ⚠️ THE TEXT IS ITS OWN STATE. Bound straight to the number, clearing the
 * field to type "62" snapped it back to the old value on the first keystroke
 * (an empty string is not a number), and "20." became "20" before the 5 could
 * follow it. So the text is re-read from the value only when the value moved
 * to a number the text does not already say — a "use this score" button — and
 * is tidied on blur.
 */
export function NumberField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    // Adjusting state while rendering, React's pattern for following a prop.
    setSeen(value);
    if (Number(text.replace(",", ".")) !== value) setText(String(value));
  }

  const accept = (raw: string) => {
    setText(raw);
    const n = Number(raw.replace(",", "."));
    if (raw.trim() !== "" && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n / step) * step)));
  };

  return (
    <div>
      <div className="tl-field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          className="tl-num"
          // Text with a decimal keypad, not type="number": a number input
          // reports "" for a half-typed "20." in some browsers, and the field
          // would fight its own text state.
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(e) => accept(e.target.value)}
          onBlur={() => setText(String(value))}
        />
      </div>
      <input
        className="tl-range"
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ marginTop: 6 }}
      />
    </div>
  );
}

/**
 * One of a few options, drawn as a segmented control.
 *
 * A RADIO GROUP, NOT TABS. It looks like tabs, but it changes which table the
 * one field below is read against; there are no panels for `role="tab"` to
 * control, and a screen reader announcing "tab 2 of 3" promises some.
 */
export function Choice<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="tl-tabs" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          className="tl-tab"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
