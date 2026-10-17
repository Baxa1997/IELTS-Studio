"use client";

import {
  mergeAttributes,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ImageOff, MousePointerClick, Trash2 } from "lucide-react";

import { FAINT, INK, LINE, MUTED, SANS, TONE } from "@/app/admin/_components/ui";
import { BRAND_FILL, PANEL, WELL, WHITE } from "@/lib/theme/tokens";

/**
 * The two blocks an email has that a paragraph editor has no word for: a
 * picture and a button. Both are ATOMS — the cursor steps over them, and their
 * fields are edited in the small inputs drawn inside them.
 *
 * ⚠️ THEIR HTML IS A CONTRACT with lib/marketing/email-html.ts, which reads it
 * back: a picture is `<img src alt>`, a button is
 * `<p data-button><a href>label</a></p>`. Change one side and change the other,
 * or the button arrives in the inbox as a bare underlined link.
 *
 * ⚠️ INPUTS INSIDE A NODE VIEW must stop key events reaching the editor, or
 * Backspace in an empty field deletes the whole block.
 */

const stop = { onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation() };

/** What a button or link may point at: a web address, a mail address, or a
 *  path on our own site (made absolute when the email is built). */
export function isLinkable(href: string): boolean {
  const h = href.trim();
  return /^https?:\/\/\S+$/i.test(h) || /^mailto:\S+$/i.test(h) || /^\/(?!\/)\S*$/.test(h);
}

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

/* ── picture ────────────────────────────────────────────────────────────── */

function ImageView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const alt = String(node.attrs.alt ?? "");
  return (
    <NodeViewWrapper style={{ ...frame, outline: selected ? `2px solid ${TONE.indigo.ink}` : "none" }} contentEditable={false}>
      <Head icon={<ImageOff size={15} />} label="Picture" onRemove={deleteNode} />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- an editor preview of an upload, any size
        <img src={src} alt={alt} style={{ display: "block", maxWidth: "100%", maxHeight: 320, borderRadius: 8, margin: "0 auto 8px" }} />
      ) : null}
      <input
        {...stop}
        value={alt}
        onChange={(e) => updateAttributes({ alt: e.target.value })}
        placeholder="Alt text — what the picture shows, read when a mail app blocks pictures"
        style={{ ...input, borderColor: alt.trim() ? LINE : TONE.amber.border }}
      />
    </NodeViewWrapper>
  );
}

export const EmailImageNode = Node.create({
  name: "emailImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: "" }, alt: { default: "" } }),
  parseHTML: () => [
    {
      tag: "img[src]",
      getAttrs: (el) => ({ src: (el as HTMLElement).getAttribute("src") ?? "", alt: (el as HTMLElement).getAttribute("alt") ?? "" }),
    },
  ],
  renderHTML: ({ HTMLAttributes }) => ["img", mergeAttributes(HTMLAttributes)],
  addNodeView: () => ReactNodeViewRenderer(ImageView),
});

/* ── button ─────────────────────────────────────────────────────────────── */

function ButtonView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const label = String(node.attrs.label ?? "");
  const href = String(node.attrs.href ?? "");
  return (
    <NodeViewWrapper style={{ ...frame, outline: selected ? `2px solid ${TONE.indigo.ink}` : "none" }} contentEditable={false}>
      <Head icon={<MousePointerClick size={15} />} label="Button" onRemove={deleteNode} />
      {/* How it will look in the inbox: the brand fill carrying white. */}
      <span
        style={{
          display: "inline-block",
          margin: "0 0 10px",
          padding: "11px 20px",
          borderRadius: 10,
          background: BRAND_FILL,
          color: WHITE,
          fontSize: 14.5,
          fontWeight: 600,
        }}
      >
        {label.trim() || "Button label"}
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.5fr)", gap: 6 }}>
        <input
          {...stop}
          value={label}
          onChange={(e) => updateAttributes({ label: e.target.value })}
          placeholder="Words — “Try today’s test”"
          style={{ ...input, borderColor: label.trim() ? LINE : TONE.amber.border }}
        />
        <input
          {...stop}
          value={href}
          onChange={(e) => updateAttributes({ href: e.target.value })}
          placeholder="https://… or a site page like /practice/reading"
          style={{ ...input, borderColor: isLinkable(href) ? LINE : TONE.amber.border }}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const EmailButtonNode = Node.create({
  name: "emailButton",
  group: "block",
  atom: true,
  draggable: true,
  // Not rendered as attributes: they become the link and its words below.
  addAttributes: () => ({ label: { default: "", rendered: false }, href: { default: "", rendered: false } }),
  parseHTML: () => [
    {
      tag: "p[data-button]",
      // Ahead of the paragraph rule, which would otherwise claim the <p>.
      priority: 100,
      getAttrs: (el) => ({
        href: (el as HTMLElement).querySelector("a")?.getAttribute("href") ?? "",
        label: (el as HTMLElement).textContent ?? "",
      }),
    },
  ],
  renderHTML: ({ node }) => ["p", { "data-button": "" }, ["a", { href: String(node.attrs.href ?? "") }, String(node.attrs.label ?? "")]],
  addNodeView: () => ReactNodeViewRenderer(ButtonView),
});
