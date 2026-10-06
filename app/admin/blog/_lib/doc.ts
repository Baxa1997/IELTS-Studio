import type { JSONContent } from "@tiptap/react";

import type { Block } from "@/lib/blog";
import { parseInline } from "@/lib/blog/inline";

/**
 * The rich editor's document ⇄ the blocks a post is stored as.
 *
 * The editor is TipTap, whose document is a tree of nodes with marks; a post is
 * the flat `Block[]` in `blog_posts.body` (lib/blog/types.ts), whose text uses
 * the small inline syntax `**bold**`, `*italic*`, `[label](href)`. These two
 * functions are the only bridge, and the editor is built so that everything it
 * can produce has a block to land in — there is no underline, no strike, no
 * code, because the page has no way to render them.
 *
 * ⚠️ IT MUST ROUND-TRIP. Opening a post and saving it untouched must store the
 * same blocks, or every save of an old article quietly rewrites it. `doc.test`
 * runs every seeded post through `docToBlocks(blocksToDoc(body))`.
 */

type Mark = NonNullable<JSONContent["marks"]>[number];

/* ── inline ─────────────────────────────────────────────────────────────── */

function inlineToContent(text: string): JSONContent[] {
  return parseInline(text)
    .filter((s) => s.text)
    .map((s): JSONContent => {
      switch (s.kind) {
        case "text":
          return { type: "text", text: s.text };
        case "strong":
          return { type: "text", text: s.text, marks: [{ type: "bold" }] };
        case "em":
          return { type: "text", text: s.text, marks: [{ type: "italic" }] };
        case "link":
          return { type: "text", text: s.text, marks: [{ type: "link", attrs: { href: s.href } }] };
      }
    });
}

/**
 * Marked text back into the inline syntax.
 *
 * ⚠️ WHITESPACE GOES OUTSIDE THE MARKERS. Selecting "word " and pressing Bold
 * marks the space too, and `*word *` is not italic to the parser (it needs a
 * non-space after the opening asterisk) — the page would print the asterisks.
 * The syntax is FLAT, so a link wins over bold and bold over italic.
 */
function contentToInline(nodes: readonly JSONContent[] | undefined): string {
  let out = "";
  for (const n of nodes ?? []) {
    if (n.type === "hardBreak") {
      out += " ";
      continue;
    }
    if (n.type !== "text" || !n.text) continue;
    const marks: Mark[] = n.marks ?? [];
    const link = marks.find((m) => m.type === "link");
    const [, lead, core, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(n.text) ?? ["", "", n.text, ""];
    if (!core) out += n.text;
    else if (link?.attrs?.href) out += `${lead}[${core}](${String(link.attrs.href)})${trail}`;
    else if (marks.some((m) => m.type === "bold")) out += `${lead}**${core}**${trail}`;
    else if (marks.some((m) => m.type === "italic")) out += `${lead}*${core}*${trail}`;
    else out += n.text;
  }
  return out.replace(/\s+/g, " ").trim();
}

const para = (text: string): JSONContent => ({ type: "paragraph", content: inlineToContent(text) });

/* ── blocks → document ──────────────────────────────────────────────────── */

export function blocksToDoc(blocks: readonly Block[]): JSONContent {
  const content = blocks.map((b): JSONContent => {
    switch (b.type) {
      case "p":
        return para(b.text);
      case "h2":
      case "h3":
        return { type: "heading", attrs: { level: b.type === "h2" ? 2 : 3 }, content: inlineToContent(b.text) };
      case "list":
        return {
          type: b.ordered ? "orderedList" : "bulletList",
          content: b.items.map((it) => ({ type: "listItem", content: [para(it)] })),
        };
      case "quote":
        return { type: "blockquote", content: [para(b.text), ...(b.cite ? [para(`— ${b.cite}`)] : [])] };
      case "tip":
        return { type: "tip", attrs: { title: b.title }, content: inlineToContent(b.text) };
      case "example":
        return { type: "example", attrs: { title: b.title ?? "", rows: b.rows.map((r) => ({ ...r })) } };
      case "image":
        return { type: "blogImage", attrs: { src: b.src, alt: b.alt, caption: b.caption ?? "" } };
      case "video":
        return { type: "blogVideo", attrs: { id: b.id, title: b.title ?? "" } };
    }
  });
  // An empty document still needs one paragraph for the cursor to sit in.
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/* ── document → blocks ──────────────────────────────────────────────────── */

/** Every paragraph's text inside a node, flattened — a list item with a nested
 *  list becomes one item per line of text, since the page has no nesting. */
function paragraphs(node: JSONContent): string[] {
  if (node.type === "paragraph" || node.type === "heading") {
    const t = contentToInline(node.content);
    return t ? [t] : [];
  }
  return (node.content ?? []).flatMap(paragraphs);
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export function docToBlocks(doc: JSONContent): Block[] {
  const out: Block[] = [];
  for (const n of doc.content ?? []) {
    switch (n.type) {
      case "paragraph": {
        const text = contentToInline(n.content);
        if (text) out.push({ type: "p", text });
        break;
      }
      case "heading": {
        const text = contentToInline(n.content);
        if (text) out.push({ type: Number(n.attrs?.level) <= 2 ? "h2" : "h3", text });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = (n.content ?? []).flatMap(paragraphs);
        if (items.length) out.push({ type: "list", items, ...(n.type === "orderedList" ? { ordered: true } : {}) });
        break;
      }
      case "blockquote": {
        const lines = paragraphs(n);
        const cite = /^(?:—|--)\s*(.*)$/.exec(lines[lines.length - 1] ?? "");
        const text = (cite ? lines.slice(0, -1) : lines).join(" ").trim();
        if (text) out.push({ type: "quote", text, ...(cite?.[1] ? { cite: cite[1].trim() } : {}) });
        break;
      }
      case "tip":
        out.push({ type: "tip", title: str(n.attrs?.title), text: contentToInline(n.content) });
        break;
      case "example": {
        const rows = (Array.isArray(n.attrs?.rows) ? (n.attrs.rows as { label?: unknown; text?: unknown }[]) : [])
          .map((r) => ({ label: str(r.label), text: str(r.text) }))
          .filter((r) => r.label || r.text);
        const title = str(n.attrs?.title);
        out.push({ type: "example", ...(title ? { title } : {}), rows });
        break;
      }
      case "blogImage": {
        const src = str(n.attrs?.src);
        const caption = str(n.attrs?.caption);
        if (src) out.push({ type: "image", src, alt: str(n.attrs?.alt), ...(caption ? { caption } : {}) });
        break;
      }
      case "blogVideo": {
        const id = str(n.attrs?.id);
        const title = str(n.attrs?.title);
        if (id) out.push({ type: "video", id, ...(title ? { title } : {}) });
        break;
      }
      default: {
        // Anything pasted that the page cannot render keeps its words as a paragraph.
        const text = paragraphs(n).join(" ");
        if (text) out.push({ type: "p", text });
      }
    }
  }
  return out;
}
