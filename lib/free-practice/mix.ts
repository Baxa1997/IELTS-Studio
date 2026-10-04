/**
 * What a Reading or Listening free pool is made of, in order — pure, so the
 * rule is testable.
 *
 * THE RULE (owner, 2026-09-27): "practice must be full practice, not part …
 * and some partly mixed." So every library test is in the pool WHOLE, in the
 * library's own order, and after every second one comes ONE PART of another
 * test: two in three are full tests, one in three is a part, in any stretch of
 * the list a visitor is shown.
 *
 * Two choices keep that mix from reading as repetition, and both are tested:
 *  - the part comes from the test HALF THE LIBRARY AWAY, so it does not sit in
 *    the same list as its own full test (a list is a window of twenty, and the
 *    two are three quarters of the library apart);
 *  - the part's number cycles 1, 2, 3 … so every part of the exam turns up,
 *    not only the first.
 */

/**
 * Two lists taken in turn — a, b, a, b … — and whatever is left of the longer
 * one at the end. The CEFR pool's rule: Reading and Writing papers alternate,
 * so any window of the list a visitor is shown offers both.
 */
export function alternate<T>(a: readonly T[], b: readonly T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

/** One entry of the pool: test `test` (an index into the library), whole when
 *  `part` is null, else its `part`-th part (1-based). */
export interface MixSlot {
  test: number;
  part: number | null;
}

/** The pool's order, given how many parts each test in the library has. */
export function mixSlots(partCounts: readonly number[]): MixSlot[] {
  const n = partCounts.length;
  const out: MixSlot[] = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    out.push({ test: i, part: null });
    if (i % 2 === 1) {
      const src = (i + Math.floor(n / 2)) % n;
      const parts = partCounts[src];
      if (parts > 0) out.push({ test: src, part: (k % parts) + 1 });
      k++;
    }
  }
  return out;
}
