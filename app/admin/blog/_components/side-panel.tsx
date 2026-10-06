"use client";

import type { Editor } from "@tiptap/react";
import { Check, CircleAlert, ImagePlus, RefreshCw, Search, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FAINT, INK, LINE, MUTED, SANS, TONE } from "@/app/admin/_components/ui";
import type { BlogPost } from "@/lib/blog";
import { MAX_KEYWORDS } from "@/lib/blog/validate";
import { PANEL, WELL } from "@/lib/theme/tokens";

import { seoChecks } from "../_lib/seo-checks";
import { listImages, uploadImage, type UploadedImage } from "../_lib/upload";
import { insertImage } from "./rich-text";

/**
 * The editor's right-hand panel: MEDIA (upload, and the gallery of everything
 * uploaded so far — insert into the article or make it the cover) and SEO
 * (keywords, the search-result preview, and the checklist).
 */
export function SidePanel({
  editor,
  post,
  blogUrl,
  keywords,
  onKeywords,
  onCover,
  onError,
}: {
  editor: Editor | null;
  post: BlogPost;
  blogUrl: string;
  keywords: string[];
  onKeywords: (k: string[]) => void;
  onCover: (src: string) => void;
  onError: (message: string) => void;
}) {
  const [tab, setTab] = useState<"media" | "seo">("seo");
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL, overflow: "hidden", position: "sticky", top: 76 }}>
      <div role="tablist" style={{ display: "flex", gap: 4, padding: 8, borderBottom: `1px solid ${LINE}` }}>
        <Tab active={tab === "media"} onClick={() => setTab("media")} icon={<ImagePlus size={15} />}>
          Media
        </Tab>
        <Tab active={tab === "seo"} onClick={() => setTab("seo")} icon={<Search size={15} />}>
          SEO
        </Tab>
      </div>
      <div style={{ padding: 14 }}>
        {tab === "media" ? (
          <Media editor={editor} onCover={onCover} onError={onError} />
        ) : (
          <Seo post={post} blogUrl={blogUrl} keywords={keywords} onKeywords={onKeywords} />
        )}
      </div>
    </div>
  );
}

function Tab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 600,
        padding: "7px 12px",
        borderRadius: 9,
        border: 0,
        cursor: "pointer",
        color: active ? TONE.indigo.ink : MUTED,
        background: active ? TONE.indigo.tint : "transparent",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

const heading: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: ".07em",
  textTransform: "uppercase",
  color: FAINT,
  margin: "0 0 8px",
};

/* ── media ──────────────────────────────────────────────────────────────── */

function Media({ editor, onCover, onError }: { editor: Editor | null; onCover: (src: string) => void; onError: (m: string) => void }) {
  const [images, setImages] = useState<UploadedImage[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const apply = useCallback((res: Awaited<ReturnType<typeof listImages>>) => {
    setImages(res.images);
    setProblem(res.error ?? null);
  }, []);
  const refresh = useCallback(() => listImages().then(apply), [apply]);
  useEffect(() => {
    // The gallery loads once when the tab opens; state is set in the
    // callback, after the fetch, never during the effect itself.
    let live = true;
    void listImages().then((res) => live && apply(res));
    return () => {
      live = false;
    };
  }, [apply]);

  async function upload(files: FileList | null | undefined) {
    if (!files?.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      const { image, error } = await uploadImage(f);
      if (error || !image) onError(error ?? "Upload failed.");
      else setImages((list) => [image, ...(list ?? [])]);
    }
    setBusy(false);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files);
        }}
        onClick={() => file.current?.click()}
        style={{
          display: "grid",
          placeItems: "center",
          gap: 6,
          padding: "20px 12px",
          border: `1.5px dashed ${over ? TONE.indigo.ink : LINE}`,
          borderRadius: 12,
          background: over ? TONE.indigo.tint : WELL,
          cursor: "pointer",
          textAlign: "center",
          fontFamily: SANS,
        }}
      >
        <Upload size={20} color={MUTED} />
        <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{busy ? "Uploading…" : "Upload pictures"}</span>
        <span style={{ fontSize: 11.5, color: FAINT }}>Drop files here or click · JPEG, PNG, WebP, GIF · up to 4 MB</span>
        <input
          ref={file}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", margin: "16px 0 8px" }}>
        <p style={{ ...heading, margin: 0 }}>Gallery</p>
        <button
          type="button"
          onClick={() => void refresh()}
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 12, color: TONE.indigo.ink, background: "transparent", border: 0, cursor: "pointer" }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      {problem ? <p style={{ fontFamily: SANS, fontSize: 12, color: TONE.red.ink, margin: "0 0 8px" }}>{problem}</p> : null}
      {images === null ? <p style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED }}>Loading…</p> : null}
      {images?.length === 0 && !problem ? (
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED }}>No pictures uploaded yet.</p>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {images?.map((img) => (
          <figure key={img.name} style={{ margin: 0, border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden", background: WELL }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a gallery thumbnail of an upload */}
            <img src={img.url} alt="" loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <button type="button" disabled={!editor} onClick={() => editor && insertImage(editor, img.url)} style={tileBtn}>
                Insert
              </button>
              <button type="button" onClick={() => onCover(img.url)} style={{ ...tileBtn, borderLeft: `1px solid ${LINE}` }}>
                Cover
              </button>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

const tileBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 600,
  color: INK,
  background: PANEL,
  border: 0,
  borderTop: `1px solid ${LINE}`,
  padding: "6px 0",
  cursor: "pointer",
};

/* ── seo ────────────────────────────────────────────────────────────────── */

function Seo({
  post,
  blogUrl,
  keywords,
  onKeywords,
}: {
  post: BlogPost;
  blogUrl: string;
  keywords: string[];
  onKeywords: (k: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const checks = seoChecks(post);
  const passed = checks.filter((c) => c.ok).length;

  function add(raw: string) {
    const next = raw
      .split(",")
      .map((k) => k.replace(/\s+/g, " ").trim().toLowerCase())
      .filter((k) => k && !keywords.includes(k));
    if (next.length) onKeywords([...keywords, ...next].slice(0, MAX_KEYWORDS));
    setDraft("");
  }

  return (
    <div style={{ fontFamily: SANS }}>
      <p style={heading}>Keywords</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, border: `1px solid ${LINE}`, borderRadius: 10, background: PANEL }}>
        {keywords.map((k, i) => (
          <span
            key={k}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12.5,
              padding: "3px 6px 3px 9px",
              borderRadius: 999,
              color: i === 0 ? TONE.indigo.ink : INK,
              background: i === 0 ? TONE.indigo.tint : WELL,
              border: `1px solid ${i === 0 ? TONE.indigo.border : LINE}`,
            }}
          >
            {k}
            <button
              type="button"
              aria-label={`Remove ${k}`}
              onClick={() => onKeywords(keywords.filter((x) => x !== k))}
              style={{ border: 0, background: "transparent", color: MUTED, cursor: "pointer", display: "inline-flex", padding: 0 }}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        {keywords.length < MAX_KEYWORDS ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && keywords.length) {
                onKeywords(keywords.slice(0, -1));
              }
            }}
            onBlur={() => draft.trim() && add(draft)}
            placeholder={keywords.length ? "Add another…" : "e.g. ielts writing task 2"}
            style={{ flex: "1 1 120px", minWidth: 0, border: 0, outline: "none", background: "transparent", fontFamily: SANS, fontSize: 13, color: INK, padding: "3px 2px" }}
          />
        ) : null}
      </div>
      <p style={{ fontSize: 11.5, color: FAINT, margin: "6px 0 18px", lineHeight: 1.45 }}>
        The searches this post answers. Enter or comma to add; the first is the main keyword. Up to {MAX_KEYWORDS}.
      </p>

      <p style={heading}>Search preview</p>
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, marginBottom: 18, background: PANEL }}>
        <div style={{ fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {blogUrl.replace(/^https?:\/\//, "").replace(/\//g, " › ")} › {post.slug || "…"}
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.3, color: TONE.indigo.ink, margin: "4px 0", fontWeight: 500 }}>
          {clip(post.title || "Untitled post", 65)}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: INK }}>{clip(post.standfirst || "The standfirst is the description searchers read here.", 160)}</div>
      </div>

      <p style={heading}>
        Checklist · {passed}/{checks.length}
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map((c) => (
          <li key={c.label} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 6, fontSize: 12.5, lineHeight: 1.45 }}>
            {c.ok ? <Check size={16} color={TONE.green.ink} /> : <CircleAlert size={16} color={TONE.amber.ink} />}
            <span style={{ color: INK }}>
              {c.label}
              {!c.ok && c.hint ? <span style={{ display: "block", color: MUTED }}>{c.hint}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
