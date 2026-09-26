/**
 * The inline markup a post's text may carry: `**bold**`, `*italic*` and
 * `[label](href)`. Flat — a link cannot contain bold, bold cannot contain a
 * link. That is enough for editorial prose, and a parser this small is one
 * whose every branch a test can reach.
 *
 * An unmatched marker stays literal text rather than swallowing the rest of the
 * paragraph: `5 * 4` renders as written.
 */

export type Span =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "em"; text: string }
  | { kind: "link"; text: string; href: string };

/* Bold is tried before italic at each position, so `**x**` is never read as an
   empty italic followed by stray asterisks. */
const TOKEN = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(src: string): Span[] {
  const out: Span[] = [];
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", text: src.slice(last, at) });
    if (m[1] !== undefined) out.push({ kind: "strong", text: m[1] });
    else if (m[2] !== undefined) out.push({ kind: "em", text: m[2] });
    else out.push({ kind: "link", text: m[3], href: m[4] });
    last = at + m[0].length;
  }
  if (last < src.length) out.push({ kind: "text", text: src.slice(last) });
  return out;
}

/** The words a reader sees, markers removed — for reading time and word count. */
export function plainText(src: string): string {
  return parseInline(src)
    .map((s) => s.text)
    .join("");
}
