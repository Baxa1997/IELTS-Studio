"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  FileInput,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Rows3,
  Undo2,
  Clapperboard,
} from "lucide-react";
import { useRef, useState } from "react";

import { FAINT, INK, LINE, MUTED, SANS, SERIF, TONE } from "@/app/admin/_components/ui";
import type { Block } from "@/lib/blog";
import { sourceToBlocks } from "@/lib/blog/source";
import { youtubeId } from "@/lib/blog/video";
import { PANEL, WELL } from "@/lib/theme/tokens";

import { blocksToDoc, docToBlocks } from "../_lib/doc";
import { uploadImage } from "../_lib/upload";
import { ExampleNode, ImageNode, TipNode, VideoNode } from "./editor-nodes";

/**
 * The article body as a rich editor: what you see is the article, and what is
 * stored is the `Block[]` JSON of lib/blog/types.ts — `_lib/doc.ts` converts
 * on every change.
 *
 * ONLY WHAT THE PAGE CAN RENDER. StarterKit's strike, underline, code, code
 * blocks and rules are switched off, and headings stop at H3, because a post
 * stores none of them: a button for one would be a button whose work vanishes
 * on save. Underline in particular reads as a link on the web.
 */

export function useBlogEditor(initial: Block[], onChange: (blocks: Block[]) => void): Editor | null {
  return useEditor({
    // ⚠️ REQUIRED UNDER NEXT: rendering on the server and again on the client
    // produces a hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Start writing — or press “Import text” to paste a drafted article." }),
      TipNode,
      ExampleNode,
      ImageNode,
      VideoNode,
    ],
    content: blocksToDoc(initial),
    onUpdate: ({ editor }) => onChange(docToBlocks(editor.getJSON())),
  });
}

/** Insert a picture at the cursor — the toolbar's upload and the Media tab both use it. */
export function insertImage(editor: Editor, src: string) {
  editor.chain().focus().insertContent({ type: "blogImage", attrs: { src, alt: "", caption: "" } }).run();
}

export function RichText({ editor, onError }: { editor: Editor | null; onError: (message: string) => void }) {
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL, overflow: "hidden" }}>
      <style>{EDITOR_CSS}</style>
      {editor ? <Toolbar editor={editor} onError={onError} /> : null}
      <div style={{ padding: "18px 24px 28px", minHeight: 420 }}>
        <EditorContent editor={editor} className="blog-rte" />
      </div>
    </div>
  );
}

function Toolbar({ editor, onError }: { editor: Editor; onError: (message: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  // Re-render on selection changes so the active states follow the cursor.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      ul: e.isActive("bulletList"),
      ol: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      undo: e.can().undo(),
      redo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  function link() {
    const was = String(editor.getAttributes("link").href ?? "");
    const href = window.prompt("Link to — a page on the site like /ielts-reading-practice, or a full https:// address. Leave empty to remove.", was);
    if (href === null) return;
    if (!href.trim()) c().extendMarkRange("link").unsetLink().run();
    else c().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  function video() {
    const url = window.prompt("YouTube link");
    if (!url) return;
    const id = youtubeId(url);
    if (!id) return onError("That is not a YouTube link the page can embed.");
    c().insertContent({ type: "blogVideo", attrs: { id, title: "" } }).run();
  }

  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    const { image, error } = await uploadImage(f);
    setBusy(false);
    if (error || !image) return onError(error ?? "Upload failed.");
    insertImage(editor, image.url);
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="Formatting"
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, padding: "8px 10px", borderBottom: `1px solid ${LINE}`, background: WELL }}
      >
        <Btn label="Undo" disabled={!s.undo} onClick={() => c().undo().run()}><Undo2 size={16} /></Btn>
        <Btn label="Redo" disabled={!s.redo} onClick={() => c().redo().run()}><Redo2 size={16} /></Btn>
        <Sep />
        <Btn label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}><Bold size={16} /></Btn>
        <Btn label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}><Italic size={16} /></Btn>
        <Sep />
        <Btn label="Heading" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></Btn>
        <Btn label="Sub-heading" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 size={17} /></Btn>
        <Sep />
        <Btn label="Bulleted list" active={s.ul} onClick={() => c().toggleBulletList().run()}><List size={16} /></Btn>
        <Btn label="Numbered list" active={s.ol} onClick={() => c().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
        <Btn label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}><Quote size={16} /></Btn>
        <Sep />
        <Btn label="Link" active={s.link} onClick={link}><Link2 size={16} /></Btn>
        <Btn label={busy ? "Uploading…" : "Upload a picture"} disabled={busy} onClick={() => file.current?.click()}><ImagePlus size={16} /></Btn>
        <Btn label="YouTube video" onClick={video}><Clapperboard size={16} /></Btn>
        <Sep />
        <Btn label="Tip box" onClick={() => c().insertContent({ type: "tip", attrs: { title: "Exam tip" }, content: [{ type: "text", text: "Write the tip here." }] }).run()}>
          <Lightbulb size={16} />
        </Btn>
        <Btn label="Example" onClick={() => c().insertContent({ type: "example", attrs: { title: "", rows: [{ label: "", text: "" }] } }).run()}>
          <Rows3 size={16} />
        </Btn>
        <button
          type="button"
          onClick={() => setImporting((v) => !v)}
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: TONE.indigo.ink, background: "transparent", border: 0, cursor: "pointer", padding: "6px 8px" }}
        >
          <FileInput size={15} /> Import text
        </button>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {importing ? <ImportPanel editor={editor} onDone={() => setImporting(false)} /> : null}
    </>
  );
}

/**
 * Paste an article drafted elsewhere in the text format of lib/blog/source.ts
 * (Markdown, plus `:::tip` / `:::example`) and it becomes rich content — the
 * drafts in docs/blog-drafts/ go in this way, body section only.
 */
function ImportPanel({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const [text, setText] = useState("");
  const blocks = text.trim() ? sourceToBlocks(text) : [];
  function apply(mode: "replace" | "append") {
    const doc = blocksToDoc(blocks);
    if (mode === "replace") editor.commands.setContent(doc, { emitUpdate: true });
    else editor.chain().focus("end").insertContent(doc.content ?? []).run();
    onDone();
  }
  return (
    <div style={{ padding: 12, borderBottom: `1px solid ${LINE}`, background: WELL }}>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, marginBottom: 6 }}>
        Paste Markdown: <code>## Heading</code>, <code>### Sub-heading</code>, <code>- bullet</code>, <code>&gt; quote</code>,{" "}
        <code>:::tip Title</code> … <code>:::</code>, <code>![alt](/blog/x.jpg)</code>, <code>**bold**</code>, <code>[label](/path)</code>.
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        style={{ width: "100%", boxSizing: "border-box", fontFamily: "var(--font-mono-data), ui-monospace, monospace", fontSize: 13, color: INK, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 8, padding: 10 }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>{blocks.length} blocks</span>
        <button type="button" disabled={!blocks.length} onClick={() => apply("append")} style={small}>Add to the end</button>
        <button type="button" disabled={!blocks.length} onClick={() => apply("replace")} style={small}>Replace the article</button>
        <button type="button" onClick={onDone} style={{ ...small, marginLeft: "auto" }}>Cancel</button>
      </div>
    </div>
  );
}

const small: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 12.5,
  fontWeight: 500,
  color: INK,
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 8,
  padding: "6px 11px",
  cursor: "pointer",
};

function Btn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the selection: a mousedown on a button would otherwise blur the editor first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        border: 0,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        color: active ? TONE.indigo.ink : INK,
        background: active ? TONE.indigo.tint : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden style={{ width: 1, height: 20, background: LINE, margin: "0 4px" }} />;
}

/* The document's typography — close to the article page, in the admin's tokens
   so it holds in both themes. */
const EDITOR_CSS = `
.blog-rte .ProseMirror{outline:none;font-family:${SANS};font-size:16.5px;line-height:1.7;color:${INK}}
.blog-rte .ProseMirror > * + *{margin-top:14px}
.blog-rte .ProseMirror p{margin:0}
.blog-rte .ProseMirror h2{font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:600;margin:30px 0 6px}
.blog-rte .ProseMirror h3{font-family:${SERIF};font-size:19px;line-height:1.3;font-weight:600;margin:22px 0 4px}
.blog-rte .ProseMirror ul,.blog-rte .ProseMirror ol{padding-left:22px;margin:0}
.blog-rte .ProseMirror li p{margin:0}
.blog-rte .ProseMirror blockquote{margin:0;padding-left:16px;border-left:3px solid ${TONE.indigo.ink};font-family:${SERIF};font-size:19px}
.blog-rte .ProseMirror a{color:${TONE.indigo.ink};text-decoration:underline;text-underline-offset:3px}
.blog-rte .ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:${FAINT};float:left;height:0;pointer-events:none}
.blog-rte .ProseMirror .ProseMirror-selectednode{outline:2px solid ${TONE.indigo.ink};border-radius:12px}
`;
