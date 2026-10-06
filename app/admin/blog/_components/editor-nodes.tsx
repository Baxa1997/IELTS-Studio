"use client";

import {
  mergeAttributes,
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ImageOff, Lightbulb, ListOrdered, PlaySquare, Plus, Trash2, X } from "lucide-react";

import { FAINT, INK, LINE, MUTED, SANS, TONE } from "@/app/admin/_components/ui";
import { youtubeThumb } from "@/lib/blog/video";
import { PANEL, WELL } from "@/lib/theme/tokens";

/**
 * The four blocks a paragraph-and-heading editor has no word for: a tip box, a
 * labelled example, a picture and a video. Each is a TipTap node whose
 * attributes are exactly the fields of its block in lib/blog/types.ts, so
 * `_lib/doc.ts` maps them one to one.
 *
 * The picture, video and example are ATOMS — the cursor steps over them, and
 * their fields are edited in the small inputs drawn inside them. Only the tip
 * holds running text, because a tip is a paragraph with a heading.
 *
 * ⚠️ INPUTS INSIDE A NODE VIEW must stop key events reaching the editor, or
 * Backspace in an empty caption deletes the whole picture.
 */

const stop = { onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation() };

const frame: React.CSSProperties = {
  margin: "18px 0",
  border: `1px solid ${LINE}`,
  borderRadius: 12,
  background: WELL,
  padding: 12,
  fontFamily: SANS,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: SANS,
  fontSize: 13,
  color: INK,
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 8,
  padding: "7px 9px",
};

function Head({ icon, label, onRemove }: { icon: React.ReactNode; label: string; onRemove: () => void }) {
  return (
    <div contentEditable={false} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <span style={{ color: MUTED, display: "inline-flex" }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: FAINT }}>
        {label}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label.toLowerCase()}`}
        style={{ marginLeft: "auto", border: 0, background: "transparent", color: MUTED, cursor: "pointer", display: "inline-flex" }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

/* ── tip ────────────────────────────────────────────────────────────────── */

function TipView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper style={{ ...frame, background: TONE.indigo.tint, borderColor: TONE.indigo.border }}>
      <Head icon={<Lightbulb size={15} />} label="Tip" onRemove={deleteNode} />
      <input
        {...stop}
        contentEditable={false}
        value={String(node.attrs.title ?? "")}
        onChange={(e) => updateAttributes({ title: e.target.value })}
        placeholder="Title — “Exam tip”"
        style={{ ...input, fontWeight: 600, marginBottom: 8 }}
      />
      <NodeViewContent as="div" style={{ fontSize: 15, lineHeight: 1.6, color: INK, outline: "none" }} />
    </NodeViewWrapper>
  );
}

export const TipNode = Node.create({
  name: "tip",
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes: () => ({ title: { default: "Exam tip" } }),
  parseHTML: () => [{ tag: "aside[data-tip]" }],
  renderHTML: ({ HTMLAttributes }) => ["aside", mergeAttributes(HTMLAttributes, { "data-tip": "" }), 0],
  addNodeView: () => ReactNodeViewRenderer(TipView),
});

/* ── example ────────────────────────────────────────────────────────────── */

type Row = { label: string; text: string };

function ExampleView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const rows: Row[] = Array.isArray(node.attrs.rows) ? (node.attrs.rows as Row[]) : [];
  const setRow = (i: number, patch: Partial<Row>) =>
    updateAttributes({ rows: rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  return (
    <NodeViewWrapper style={frame} contentEditable={false}>
      <Head icon={<ListOrdered size={15} />} label="Example" onRemove={deleteNode} />
      <input
        {...stop}
        value={String(node.attrs.title ?? "")}
        onChange={(e) => updateAttributes({ title: e.target.value })}
        placeholder="Title (optional) — “One situation, two emails”"
        style={{ ...input, fontWeight: 600, marginBottom: 8 }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr 28px", gap: 6 }}>
            <input {...stop} value={r.label} onChange={(e) => setRow(i, { label: e.target.value })} placeholder="Label" style={input} />
            <input {...stop} value={r.text} onChange={(e) => setRow(i, { text: e.target.value })} placeholder="Text" style={input} />
            <button
              type="button"
              aria-label="Remove line"
              onClick={() => updateAttributes({ rows: rows.filter((_, k) => k !== i) })}
              style={{ border: 0, background: "transparent", color: MUTED, cursor: "pointer" }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => updateAttributes({ rows: [...rows, { label: "", text: "" }] })}
        style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 12.5, color: INK, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}
      >
        <Plus size={14} /> Add line
      </button>
    </NodeViewWrapper>
  );
}

export const ExampleNode = Node.create({
  name: "example",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ title: { default: "" }, rows: { default: [{ label: "", text: "" }] } }),
  parseHTML: () => [{ tag: "figure[data-example]" }],
  renderHTML: ({ HTMLAttributes }) => ["figure", mergeAttributes(HTMLAttributes, { "data-example": "" })],
  addNodeView: () => ReactNodeViewRenderer(ExampleView),
});

/* ── picture ────────────────────────────────────────────────────────────── */

function ImageView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const alt = String(node.attrs.alt ?? "");
  return (
    <NodeViewWrapper style={{ ...frame, outline: selected ? `2px solid ${TONE.indigo.ink}` : "none" }} contentEditable={false}>
      <Head icon={<ImageOff size={15} />} label="Picture" onRemove={deleteNode} />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- an editor preview of an upload, any size
        <img src={src} alt={alt} style={{ display: "block", maxWidth: "100%", maxHeight: 360, borderRadius: 8, margin: "0 auto 8px" }} />
      ) : null}
      <input
        {...stop}
        value={alt}
        onChange={(e) => updateAttributes({ alt: e.target.value })}
        placeholder="Alt text — what the picture shows (required)"
        style={{ ...input, marginBottom: 6, borderColor: alt.trim() ? LINE : TONE.amber.border }}
      />
      <input
        {...stop}
        value={String(node.attrs.caption ?? "")}
        // A double quote ends a caption in the text format (lib/blog/source).
        onChange={(e) => updateAttributes({ caption: e.target.value.replace(/"/g, "”") })}
        placeholder="Caption (optional)"
        style={input}
      />
    </NodeViewWrapper>
  );
}

export const ImageNode = Node.create({
  name: "blogImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: "" }, alt: { default: "" }, caption: { default: "" } }),
  parseHTML: () => [
    {
      tag: "img[src]",
      getAttrs: (el) => ({ src: (el as HTMLElement).getAttribute("src") ?? "", alt: (el as HTMLElement).getAttribute("alt") ?? "" }),
    },
  ],
  renderHTML: ({ HTMLAttributes }) => ["img", mergeAttributes(HTMLAttributes)],
  addNodeView: () => ReactNodeViewRenderer(ImageView),
});

/* ── video ──────────────────────────────────────────────────────────────── */

function VideoView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const id = String(node.attrs.id ?? "");
  return (
    <NodeViewWrapper style={{ ...frame, outline: selected ? `2px solid ${TONE.indigo.ink}` : "none" }} contentEditable={false}>
      <Head icon={<PlaySquare size={15} />} label="YouTube video" onRemove={deleteNode} />
      {/* The still, not the player: an iframe inside an editor steals focus and
          clicks. The article page embeds the real thing. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail */}
      <img src={youtubeThumb(id)} alt="" style={{ display: "block", width: "100%", maxWidth: 480, borderRadius: 8, margin: "0 auto 8px" }} />
      <input
        {...stop}
        value={String(node.attrs.title ?? "")}
        onChange={(e) => updateAttributes({ title: e.target.value })}
        placeholder="Title (optional) — shown under the video and read by screen readers"
        style={input}
      />
    </NodeViewWrapper>
  );
}

export const VideoNode = Node.create({
  name: "blogVideo",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ id: { default: "" }, title: { default: "" } }),
  parseHTML: () => [{ tag: "div[data-video]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-video": "" })],
  addNodeView: () => ReactNodeViewRenderer(VideoView),
});
