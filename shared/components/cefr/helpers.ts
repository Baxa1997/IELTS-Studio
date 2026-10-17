

// ---- helpers ---------------------------------------------------------------

type Seg = { type: "text"; value: string } | { type: "gap"; number: number };
export function splitGaps(text: string): Seg[] {
  const out: Seg[] = [];
  const re = /\((\d+)\)\s*_+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ type: "text", value: text.slice(last, m.index) });
    out.push({ type: "gap", number: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

export function roman(n: number): string {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] ?? String(n);
}
