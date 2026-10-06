import type { Block, BlogPost } from "./types";
import { youtubeId } from "./video";

/**
 * The text the /admin/blog editor shows for a post's body, FAQ and summary —
 * and the way back to the blocks the page renders.
 *
 * A TEXT AREA, NOT A BLOCK EDITOR. The body is six block types, each of which
 * has an obvious plain-text spelling, and a writer can draft one in any text
 * editor and paste it in. The format is Markdown where Markdown has an answer
 * and a fenced `:::` block where it does not (tips and examples):
 *
 *     A paragraph is plain text. Blank line between blocks.
 *
 *     ## A section heading
 *
 *     - a bullet          1. a numbered item
 *
 *     > A quotation.
 *     > — Who said it
 *
 *     :::tip Exam tip
 *     The tip's text.
 *     :::
 *
 *     :::example Optional title
 *     Label: text
 *     :::
 *
 *     ### A sub-heading
 *
 *     ![Alt text](/blog/photo.jpg "Optional caption")
 *
 *     ::youtube dQw4w9WgXcQ Optional title
 *
 * Inline markup is the renderer's own (`**bold**`, `*italic*`, `[label](/path)`)
 * and passes through untouched.
 *
 * ⚠️ IT MUST ROUND-TRIP. Opening a post and saving it unchanged must store the
 * same blocks, or every save of an old article quietly rewrites it.
 * `blog.test.ts` round-trips every seeded post through here.
 */

export function blocksToSource(blocks: readonly Block[]): string {
  return blocks.map(blockToSource).join("\n\n");
}

function blockToSource(b: Block): string {
  switch (b.type) {
    case "p":
      return b.text;
    case "h2":
      return `## ${b.text}`;
    case "list":
      return b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : "-"} ${it}`).join("\n");
    case "quote":
      return [`> ${b.text}`, ...(b.cite ? [`> — ${b.cite}`] : [])].join("\n");
    case "tip":
      return [`:::tip ${b.title}`, b.text, ":::"].join("\n");
    case "example":
      return [`:::example${b.title ? ` ${b.title}` : ""}`, ...b.rows.map((r) => `${r.label}: ${r.text}`), ":::"].join(
        "\n",
      );
    case "h3":
      return `### ${b.text}`;
    case "image":
      return `![${b.alt}](${b.src}${b.caption ? ` "${b.caption}"` : ""})`;
    case "video":
      return `::youtube ${b.id}${b.title ? ` ${b.title}` : ""}`;
  }
}

/* One-line blocks. A caption may not contain a double quote — it ends the
   caption — which the editor's caption field strips. */
const IMAGE = /^!\[([^\]]*)\]\((\S+)(?:\s+"([^"]*)")?\)$/;
const VIDEO = /^::youtube\s+(\S+)(?:\s+(.*))?$/;

const BULLET = /^-\s+(.*)$/;
const NUMBERED = /^\d+\.\s+(.*)$/;
const CITE = /^(?:—|--)\s*(.*)$/;

/** The blocks a body's text describes. Never throws: a line it cannot place is
 *  a paragraph, which the page renders and the writer can see. */
export function sourceToBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // A fenced tip or example runs to its closing `:::` (or the end).
    const fence = /^:::(tip|example)\b\s*(.*)$/.exec(line);
    if (fence) {
      const inner: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") inner.push(lines[i++].trim());
      i++; // the closing fence
      const title = fence[2].trim();
      const body = inner.filter(Boolean);
      if (fence[1] === "tip") {
        out.push({ type: "tip", title, text: body.join(" ") });
      } else {
        const rows = body.map((l) => {
          const at = l.indexOf(": ");
          return at > 0 ? { label: l.slice(0, at).trim(), text: l.slice(at + 2).trim() } : { label: "", text: l };
        });
        out.push({ type: "example", ...(title ? { title } : {}), rows });
      }
      continue;
    }

    const image = IMAGE.exec(line);
    if (image) {
      out.push({ type: "image", src: image[2], alt: image[1].trim(), ...(image[3]?.trim() ? { caption: image[3].trim() } : {}) });
      i++;
      continue;
    }
    const video = VIDEO.exec(line);
    if (video) {
      out.push({ type: "video", id: youtubeId(video[1]) ?? video[1], ...(video[2]?.trim() ? { title: video[2].trim() } : {}) });
      i++;
      continue;
    }

    // Everything else is a run of non-blank lines, up to the next one-line block.
    const run: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^:::(tip|example)\b/.test(lines[i].trim()) &&
      !(run.length && (IMAGE.test(lines[i].trim()) || VIDEO.test(lines[i].trim())))
    ) {
      run.push(lines[i++].trim());
    }

    if (run[0].startsWith("### ")) {
      out.push({ type: "h3", text: run[0].slice(4).trim() });
      if (run.length > 1) out.push({ type: "p", text: run.slice(1).join(" ") });
      continue;
    }

    if (run[0].startsWith("## ")) {
      out.push({ type: "h2", text: run[0].slice(3).trim() });
      // Text straight under a heading, with no blank line, is its paragraph.
      if (run.length > 1) out.push({ type: "p", text: run.slice(1).join(" ") });
      continue;
    }

    if (run[0].startsWith(">")) {
      const quoted = run.map((l) => l.replace(/^>\s?/, ""));
      const last = CITE.exec(quoted[quoted.length - 1]);
      const text = (last ? quoted.slice(0, -1) : quoted).join(" ").trim();
      out.push({ type: "quote", text, ...(last && last[1] ? { cite: last[1].trim() } : {}) });
      continue;
    }

    const ordered = NUMBERED.test(run[0]);
    if (ordered || BULLET.test(run[0])) {
      const marker = ordered ? NUMBERED : BULLET;
      const items: string[] = [];
      for (const l of run) {
        const m = marker.exec(l);
        // A line without the marker continues the item above it.
        if (m) items.push(m[1].trim());
        else items[items.length - 1] = `${items[items.length - 1]} ${l}`;
      }
      out.push({ type: "list", items, ...(ordered ? { ordered: true } : {}) });
      continue;
    }

    out.push({ type: "p", text: run.join(" ") });
  }
  return out;
}

/** "In short": one point per line. */
export const summaryToSource = (points: readonly string[]): string => points.join("\n");
export const sourceToSummary = (src: string): string[] =>
  src
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * The questions, as
 *
 *     Q: What is it?
 *     A: The answer, which may run
 *     over several lines.
 *
 * with a blank line between pairs.
 */
export function faqToSource(faq: NonNullable<BlogPost["faq"]>): string {
  return faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
}

export function sourceToFaq(src: string): NonNullable<BlogPost["faq"]> {
  const out: { q: string; a: string }[] = [];
  let into: "q" | "a" | null = null;
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const q = /^Q:\s*(.*)$/i.exec(line);
    const a = /^A:\s*(.*)$/i.exec(line);
    if (q) {
      out.push({ q: q[1].trim(), a: "" });
      into = "q";
    } else if (a && out.length) {
      out[out.length - 1].a = a[1].trim();
      into = "a";
    } else if (into && out.length) {
      const last = out[out.length - 1];
      last[into] = `${last[into]} ${line}`.trim();
    }
  }
  return out;
}
