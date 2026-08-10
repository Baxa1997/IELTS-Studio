/**
 * Money, in one place.
 *
 * Every amount in the finance module is an integer number of MINOR UNITS in the
 * center's currency, and the number of minor digits is a property of the
 * currency, not a constant: UZS has none in practice (nobody prices a course in
 * tiyin), USD has two. So for an Uzbek center `amount_minor` simply is soms,
 * and for a dollar center it is cents — both exact, neither a float.
 *
 * The rule this file exists to enforce: parse once at the edge, do all
 * arithmetic in integers, format once at the surface. No `parseFloat` on a
 * price anywhere else in the codebase.
 */

const MINOR_DIGITS: Record<string, number> = {
  UZS: 0,
  KZT: 0,
  JPY: 0,
  KRW: 0,
  RUB: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
};

export const DEFAULT_CURRENCY = "UZS";

export function minorDigits(currency: string): number {
  return MINOR_DIGITS[currency.toUpperCase()] ?? 2;
}

/**
 * Read a human-typed amount into minor units.
 *
 * Accepts what people actually type into a cash-desk form: `550000`,
 * `550 000`, `550,000`, `550 000,50`, `1 200.75`. Returns null on anything it
 * can't read, so the caller can say "that isn't an amount" rather than banking
 * a NaN.
 */
export function parseMoney(input: string, currency = DEFAULT_CURRENCY): number | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  // Strip spaces (including the narrow no-break space phones insert) and any
  // currency letters someone pasted along with the number.
  let s = raw.replace(/[\s  ]/g, "").replace(/[^\d.,-]/g, "");
  if (!s) return null;

  const negative = s.startsWith("-");
  if (negative) s = s.slice(1);

  // Decide which separator is the decimal point: the LAST one, and only if it
  // is followed by 1–2 digits. "550,000" is half a million, "550,50" is 550.50.
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  const cut = Math.max(lastDot, lastComma);
  let whole = s;
  let frac = "";
  if (cut !== -1) {
    const tail = s.slice(cut + 1);
    if (/^\d{1,2}$/.test(tail)) {
      whole = s.slice(0, cut);
      frac = tail;
    }
  }
  whole = whole.replace(/[.,]/g, "");
  if (whole === "" && frac === "") return null;
  if (!/^\d*$/.test(whole)) return null;

  const digits = minorDigits(currency);
  const wholeUnits = whole === "" ? 0 : Number(whole);
  if (!Number.isSafeInteger(wholeUnits)) return null;

  const scale = 10 ** digits;
  const fracUnits = digits === 0 ? 0 : Math.round(Number(`0.${frac || "0"}`) * scale);
  const total = wholeUnits * scale + fracUnits;
  if (!Number.isSafeInteger(total)) return null;
  return negative ? -total : total;
}

/** Minor units back to the number a human sees in an input field. */
export function toMajor(minor: number, currency = DEFAULT_CURRENCY): number {
  const scale = 10 ** minorDigits(currency);
  return minor / scale;
}

export function fromMajor(major: number, currency = DEFAULT_CURRENCY): number {
  return Math.round(major * 10 ** minorDigits(currency));
}

/**
 * Group digits the way the region reads them — `11 042 000`, space-grouped, not
 * comma-grouped — and append the currency only when asked. Tables repeat the
 * currency on every row for no reason; totals and KPIs earn it.
 *
 * The separator is a NO-BREAK space (U+00A0) so an amount never wraps across
 * two lines mid-number, which a plain space in a narrow table cell will do.
 */
export function formatMoney(
  minor: number | null | undefined,
  currency = DEFAULT_CURRENCY,
  opts: { withCurrency?: boolean; sign?: boolean } = {},
): string {
  const value = minor ?? 0;
  const digits = minorDigits(currency);
  const negative = value < 0;
  const abs = Math.abs(value);
  const scale = 10 ** digits;
  const whole = Math.floor(abs / scale);
  const frac = abs % scale;

  let out = whole.toLocaleString("en-US").replace(/,/g, "\u00A0");
  if (digits > 0) out += `.${String(frac).padStart(digits, "0")}`;
  if (negative) out = `−${out}`;
  else if (opts.sign) out = `+${out}`;
  if (opts.withCurrency) out += ` ${currency}`;
  return out;
}

/** `24.3M` — for KPI tiles where the exact som is noise. */
export function formatMoneyShort(minor: number, currency = DEFAULT_CURRENCY): string {
  const major = Math.abs(toMajor(minor, currency));
  const sign = minor < 0 ? "−" : "";
  if (major >= 1_000_000_000) return `${sign}${(major / 1_000_000_000).toFixed(1)}B`;
  if (major >= 1_000_000)
    return `${sign}${(major / 1_000_000).toFixed(major >= 10_000_000 ? 0 : 1)}M`;
  if (major >= 1_000) return `${sign}${Math.round(major / 1_000)}K`;
  return `${sign}${major}`;
}

/** Percentage of an amount, rounded to the nearest minor unit. */
export function percentOf(minor: number, percent: number): number {
  return Math.round((minor * percent) / 100);
}
