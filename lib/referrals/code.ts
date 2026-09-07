/**
 * Referral codes.
 *
 * A code is three things at once: a URL component, something typed into a form,
 * and something read off a screenshot of somebody's phone. The alphabet below is
 * chosen for the third one — no `0`/`o`, no `1`/`l`/`i`, so a code cannot be
 * transcribed into a different valid code. That failure mode is silent and
 * expensive: the money goes to whoever owns the code that was actually typed.
 *
 * Lowercase throughout, matching the `lower(code)` unique index and the
 * `^[a-z0-9][a-z0-9_-]{2,31}$` check in 20260907120000_referrals.sql.
 */

/** No 0/O, no 1/I/L. 31 symbols. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Length 8 over this alphabet is ~39 bits — collision is checked at mint anyway. */
const LENGTH = 8;

/**
 * A fresh code. Uses `crypto.getRandomValues` rather than `Math.random`: a code
 * is a bearer credential — anyone holding it earns from it — and a predictable
 * one can be guessed and then squatted before its owner shares it.
 *
 * Rejection sampling, not modulo: 256 % 31 ≠ 0, so a plain `% 31` would make the
 * first few letters of the alphabet measurably likelier.
 */
export function generateCode(): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  while (out.length < LENGTH) {
    const bytes = new Uint8Array(LENGTH);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b >= limit) continue; // would bias the distribution — draw again
      out += ALPHABET[b % ALPHABET.length];
      if (out.length === LENGTH) break;
    }
  }
  return out;
}

/** How a code arrives from a URL, a form or a paste, on its way to a lookup. */
export function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Is this shaped like a code we could have issued?
 *
 * Checked before it reaches the database so a junk `?ref=` — a scanner, a
 * truncated paste, someone's `<script>` — becomes a miss rather than a query.
 * Mirrors the CHECK constraint exactly; if one moves, the other has to.
 */
export function isCodeShape(raw: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,31}$/.test(normalizeCode(raw));
}
