import { describe, expect, it } from "vitest";

import type { Block } from "@/lib/blog";
import { seededPosts } from "@/test/blog-seed";

import { blocksToDoc, docToBlocks } from "./doc";

/**
 * The rich editor's document must hand back exactly the blocks it was given —
 * otherwise opening an old article and pressing Update rewrites it.
 */
describe("the editor's document", () => {
  it.each(seededPosts().map((p) => [p.slug, p.body] as const))("round-trips %s untouched", (_slug, body) => {
    expect(docToBlocks(blocksToDoc(body))).toEqual(body);
  });

  it("round-trips every block type, including the new ones", () => {
    const body: Block[] = [
      { type: "h2", text: "A section" },
      { type: "h3", text: "A sub-section" },
      { type: "p", text: "Plain, **bold**, *italic* and a [link](/blog) — and 5 * 4 stays literal." },
      { type: "list", items: ["one", "two"], ordered: true },
      { type: "quote", text: "Said.", cite: "Someone" },
      { type: "tip", title: "Exam tip", text: "Do **this**." },
      { type: "example", title: "Pair", rows: [{ label: "Weak", text: "x" }] },
      { type: "image", src: "/blog/a.jpg", alt: "A chart", caption: "Figure 1" },
      { type: "video", id: "dQw4w9WgXcQ", title: "Watch" },
    ];
    expect(docToBlocks(blocksToDoc(body))).toEqual(body);
  });

  it("keeps spaces outside the markers, where the parser needs them", () => {
    /* Selecting "word " and pressing Italic marks the space; `*word *` would
       print its asterisks on the page. */
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a " },
            { type: "text", text: "word ", marks: [{ type: "italic" }] },
            { type: "text", text: "here" },
          ],
        },
      ],
    };
    expect(docToBlocks(doc)).toEqual([{ type: "p", text: "a *word* here" }]);
  });

  it("drops empty paragraphs, and keeps the words of anything it cannot render", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph" },
        { type: "codeBlock", content: [{ type: "paragraph", content: [{ type: "text", text: "kept" }] }] },
      ],
    };
    expect(docToBlocks(doc)).toEqual([{ type: "p", text: "kept" }]);
  });
});
