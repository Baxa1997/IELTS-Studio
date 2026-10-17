"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  MousePointerClick,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { useRef, useState } from "react";

import { ToolButton, ToolSep } from "@/app/admin/_components/editor-chrome";
import { FAINT, INK, LINE, MUTED, SANS, TONE } from "@/app/admin/_components/ui";
import { PANEL, WELL } from "@/lib/theme/tokens";

import { uploadEmailImage } from "../actions";
import { EmailButtonNode, EmailImageNode, isLinkable } from "./email-nodes";

/**
 * The message body as a rich editor: the blog editor's toolbar and feel, cut
 * down to what an email can carry. What it produces is HTML — `getHTML()` —
 * which the server cleans, stores, and styles for the inbox at send time
 * (lib/marketing/email-html.ts).
 *
 * ONLY WHAT AN EMAIL CAN SHOW: two heading levels, bold, italic, lists, a
 * quote, a divider, links, pictures and a button. No video (no mail client
 * plays one), no underline (in an email it reads as a link), no strike or code.
 * A button here for anything else would be a button whose work the server
 * throws away.
 */

export function useEmailEditor(onChange: (html: string) => void): Editor | null {
  return useEditor({
    // ⚠️ REQUIRED UNDER NEXT: rendering on the server and again on the client
    // produces a hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({
        placeholder: "Write the message. It already opens with “Hi” and the reader’s first name — start with what is new.",
      }),
      EmailImageNode,
      EmailButtonNode,
    ],
    // An editor with nothing in it still says <p></p>; that is no message.
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });
}

/** What would arrive broken, in words — checked before a test and before a send. */
export function editorProblems(editor: Editor | null): string[] {
  const out = new Set<string>();
  editor?.state.doc.descendants((node) => {
    if (node.type.name !== "emailButton") return;
    const label = String(node.attrs.label ?? "").trim();
    const href = String(node.attrs.href ?? "").trim();
    if (!label || !href) out.add("Every button needs its words and a link.");
    else if (!isLinkable(href)) out.add(`The “${label}” button’s link has to start with https:// or be a site page like /practice/reading.`);
  });
  return [...out];
}

export function EmailRichText({ editor, onError }: { editor: Editor | null; onError: (message: string) => void }) {
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL, overflow: "hidden" }}>
      <style>{EDITOR_CSS}</style>
      {editor ? <Toolbar editor={editor} onError={onError} /> : null}
      <div style={{ padding: "18px 24px 28px", minHeight: 360 }}>
        <EditorContent editor={editor} className="mail-rte" />
      </div>
    </div>
  );
}

function Toolbar({ editor, onError }: { editor: Editor; onError: (message: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
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
      editable: e.isEditable,
    }),
  });
  const c = () => editor.chain().focus();

  function link() {
    const was = String(editor.getAttributes("link").href ?? "");
    const href = window.prompt(
      "Link to — a full https:// address, or a page on the site like /practice/reading. Leave empty to remove.",
      was,
    );
    if (href === null) return;
    if (!href.trim()) c().extendMarkRange("link").unsetLink().run();
    else if (!isLinkable(href)) onError("A link has to start with https:// or be a site page like /practice/reading.");
    else c().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    const form = new FormData();
    form.set("file", f);
    const { url, error } = await uploadEmailImage({}, form);
    setBusy(false);
    if (error || !url) return onError(error ?? "Upload failed.");
    c().insertContent({ type: "emailImage", attrs: { src: url, alt: "" } }).run();
  }

  const off = !s.editable;
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, padding: "8px 10px", borderBottom: `1px solid ${LINE}`, background: WELL }}
    >
      <ToolButton label="Undo" disabled={off || !s.undo} onClick={() => c().undo().run()}><Undo2 size={16} /></ToolButton>
      <ToolButton label="Redo" disabled={off || !s.redo} onClick={() => c().redo().run()}><Redo2 size={16} /></ToolButton>
      <ToolSep />
      <ToolButton label="Bold" disabled={off} active={s.bold} onClick={() => c().toggleBold().run()}><Bold size={16} /></ToolButton>
      <ToolButton label="Italic" disabled={off} active={s.italic} onClick={() => c().toggleItalic().run()}><Italic size={16} /></ToolButton>
      <ToolSep />
      <ToolButton label="Heading" disabled={off} active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></ToolButton>
      <ToolButton label="Sub-heading" disabled={off} active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 size={17} /></ToolButton>
      <ToolSep />
      <ToolButton label="Bulleted list" disabled={off} active={s.ul} onClick={() => c().toggleBulletList().run()}><List size={16} /></ToolButton>
      <ToolButton label="Numbered list" disabled={off} active={s.ol} onClick={() => c().toggleOrderedList().run()}><ListOrdered size={16} /></ToolButton>
      <ToolButton label="Quote" disabled={off} active={s.quote} onClick={() => c().toggleBlockquote().run()}><Quote size={16} /></ToolButton>
      <ToolSep />
      <ToolButton label="Link" disabled={off} active={s.link} onClick={link}><Link2 size={16} /></ToolButton>
      <ToolButton label={busy ? "Uploading…" : "Upload a picture"} disabled={off || busy} onClick={() => file.current?.click()}><ImagePlus size={16} /></ToolButton>
      <ToolButton
        label="Button"
        disabled={off}
        onClick={() => c().insertContent({ type: "emailButton", attrs: { label: "", href: "" } }).run()}
      >
        <MousePointerClick size={16} />
      </ToolButton>
      <ToolButton label="Divider" disabled={off} onClick={() => c().setHorizontalRule().run()}><Minus size={16} /></ToolButton>
      <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 12, color: FAINT, padding: "0 6px" }}>
        {busy ? "Uploading the picture…" : "Pictures: JPEG, PNG, GIF or WebP, up to 2 MB"}
      </span>
      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        hidden
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* The message's typography — the email's own (sans throughout, the same
   sizes lib/marketing/email-html.ts writes inline), in the admin's tokens so it
   holds in both themes. */
const EDITOR_CSS = `
.mail-rte .ProseMirror{outline:none;font-family:${SANS};font-size:15.5px;line-height:1.65;color:${INK}}
.mail-rte .ProseMirror > * + *{margin-top:14px}
.mail-rte .ProseMirror p{margin:0}
.mail-rte .ProseMirror h2{font-size:21px;line-height:1.3;font-weight:700;margin:26px 0 4px}
.mail-rte .ProseMirror h3{font-size:17px;line-height:1.35;font-weight:700;margin:22px 0 2px}
.mail-rte .ProseMirror ul,.mail-rte .ProseMirror ol{padding-left:22px;margin:0}
.mail-rte .ProseMirror li p{margin:0}
.mail-rte .ProseMirror li + li{margin-top:6px}
.mail-rte .ProseMirror blockquote{margin:0;padding-left:14px;border-left:3px solid ${TONE.indigo.ink};font-style:italic}
.mail-rte .ProseMirror hr{border:none;border-top:1px solid ${LINE};margin:22px 0}
.mail-rte .ProseMirror a{color:${TONE.indigo.ink};text-decoration:underline;text-underline-offset:3px}
.mail-rte .ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:${MUTED};float:left;height:0;pointer-events:none}
.mail-rte .ProseMirror .ProseMirror-selectednode{outline:2px solid ${TONE.indigo.ink};border-radius:12px}
`;
