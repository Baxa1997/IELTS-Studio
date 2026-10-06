"use client";

import { ArrowLeft, Eye, ImagePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { FAINT, INK, LINE, MUTED, Pill, SANS, SERIF, TONE } from "@/app/admin/_components/ui";
import { BLOG_SKILLS, headingId, SKILL_TOPIC, type Block, type PostStatus } from "@/lib/blog";
import { formToPost, postToForm, type PostForm } from "@/lib/blog/form";
import { plainText } from "@/lib/blog/inline";
import { INDIGO_FILL, ON_INDIGO, PANEL, WELL } from "@/lib/theme/tokens";

import { deletePost, savePost, type SaveIntent } from "../actions";
import { uploadImage } from "../_lib/upload";
import { RichText, useBlogEditor } from "./rich-text";
import { SidePanel } from "./side-panel";

/**
 * The blog's editor: cover, contents and publish settings on the left; the
 * article itself — title, standfirst, rich body, "In short", questions and the
 * closing panel — in the middle; Media and SEO on the right.
 *
 * THE BODY IS JSON. The rich editor produces the `Block[]` the database stores
 * (`_lib/doc.ts`), and the whole form goes to the server as typed. The server
 * rebuilds every block from strings (lib/blog/sanitize.ts), checks the post,
 * and either saves it or returns the list of what is wrong.
 *
 * CONTROLLED, AND SUBMITTED BY HAND rather than through `<form action>`: React
 * resets an uncontrolled form after its action runs, which would empty the
 * editor every time a save was refused for a typo.
 */

export interface CategoryOption {
  value: string;
  label: string;
}

/** `Plan Task 2 in five minutes` → `plan-task-2-in-five-minutes`. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export function PostEditor({
  id,
  status,
  initial,
  categories,
  blogUrl,
}: {
  id: string | null;
  status: PostStatus;
  initial: PostForm;
  categories: CategoryOption[];
  /** The live blog's address, for the search preview. */
  blogUrl: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PostForm>(initial);
  const [saved, setSaved] = useState<PostForm>(initial);
  const [current, setCurrent] = useState<PostStatus>(status);
  // A new post's slug follows its title until somebody types a slug of their own.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [problems, setProblems] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof PostForm>(key: K, value: PostForm[K]) =>
    setForm((f) => ({ ...f, [key]: value, ...(key === "title" && !slugTouched ? { slug: slugify(String(value)) } : {}) }));

  const editor = useBlogEditor(initial.body, (body: Block[]) => setForm((f) => ({ ...f, body })));
  const post = useMemo(() => formToPost(form), [form]);
  /* Dirty against the NORMALISED post, so the editor's harmless re-shaping
     (a trailing empty paragraph, a merged text run) never reads as a change. */
  const dirty = useMemo(() => JSON.stringify(post) !== JSON.stringify(formToPost(saved)), [post, saved]);
  const published = current === "published";

  const fail = (message: string) => {
    setNotice(null);
    setProblems([message]);
  };

  function run(intent: SaveIntent) {
    setProblems([]);
    setNotice(null);
    start(async () => {
      const res = await savePost(id, form, intent);
      if (!res.ok) {
        setProblems(res.problems ?? ["Could not save."]);
        return;
      }
      // Hold what was stored — the server normalised it (slug lower-cased,
      // keywords de-duplicated) — but leave the editor's own document alone,
      // so the cursor does not jump on every save.
      const stored = postToForm(formToPost(form));
      setForm((f) => ({ ...stored, body: f.body }));
      setSaved(stored);
      setCurrent(res.status ?? current);
      setNotice(
        intent === "publish" ? "Published — it is live on /blog." : intent === "unpublish" ? "Unpublished — it is a draft again." : "Saved.",
      );
      if (!id && res.id) router.replace(`/admin/blog/${res.id}`);
      else router.refresh();
    });
  }

  function remove() {
    if (!id) return;
    if (!window.confirm(`Delete "${form.title || form.slug}"? This cannot be undone.`)) return;
    start(async () => {
      const res = await deletePost(id);
      if (!res.ok) setProblems(res.problems ?? ["Could not delete."]);
      else router.replace("/admin/blog");
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: SANS }}>
      {/* Status and actions, pinned to the top so publishing is never a long
          way from the text being published. */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 3,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
        }}
      >
        <Link href="/admin/blog" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED, textDecoration: "none" }}>
          <ArrowLeft size={15} /> All posts
        </Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: INK, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {form.title || "Untitled post"}
        </span>
        <Pill tone={published ? "green" : "amber"}>{published ? "Published" : "Draft"}</Pill>
        {dirty ? <span style={{ fontSize: 12.5, color: MUTED }}>Unsaved changes</span> : null}
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {id ? (
            <a href={`/blog/preview/${id}`} target="_blank" rel="noreferrer" style={secondaryBtn}>
              <Eye size={15} /> Preview{dirty ? " (last save)" : ""}
            </a>
          ) : null}
          {id && published ? (
            <a href={`/blog/${saved.slug}`} target="_blank" rel="noreferrer" style={secondaryBtn}>
              View live
            </a>
          ) : null}
          {published ? (
            <>
              <button type="button" disabled={pending} onClick={() => run("unpublish")} style={secondaryBtn}>
                Unpublish
              </button>
              <button type="button" disabled={pending || !dirty} onClick={() => run("save")} style={primaryBtn(pending || !dirty)}>
                {pending ? "Saving…" : "Update"}
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={pending} onClick={() => run("save")} style={secondaryBtn}>
                {pending ? "Saving…" : "Save draft"}
              </button>
              <button type="button" disabled={pending} onClick={() => run("publish")} style={primaryBtn(pending)}>
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      {problems.length ? (
        <Banner tone="red">
          <strong>Not saved — fix these first:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Banner>
      ) : null}
      {notice ? <Banner tone="green">{notice}</Banner> : null}

      {/* `sa-split` stacks the three columns below a laptop width (globals.css). */}
      <div className="sa-split" style={{ display: "grid", gridTemplateColumns: "260px minmax(0, 1fr) 310px", gap: 16, alignItems: "start" }}>
        {/* ── left: cover, contents, settings ───────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Section title="Cover image">
            <Cover form={form} set={set} onError={fail} />
          </Section>

          <Section title="Table of contents">
            <Contents body={form.body} onJump={(i) => editor?.view.dom.querySelectorAll("h2, h3")[i]?.scrollIntoView({ behavior: "smooth", block: "center" })} />
          </Section>

          <Section title="Publish settings">
            <Field label="URL slug" note={published ? "Live address — changing it breaks links people have shared." : `/blog/${form.slug || "…"}`}>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
                style={field}
              />
            </Field>
            <Field label="Publish date">
              <input type="date" value={form.published} onChange={(e) => set("published", e.target.value)} style={field} />
            </Field>
            <Field label="Updated on (optional)">
              <input type="date" value={form.updated} onChange={(e) => set("updated", e.target.value)} style={field} />
            </Field>
            <Field label="Author">
              <input value={form.author} onChange={(e) => set("author", e.target.value)} style={field} />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} style={field}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Practice area" note="Links the post from that skill's pages and its free practice.">
              <select value={form.skill} onChange={(e) => set("skill", e.target.value)} style={field}>
                <option value="">None</option>
                {BLOG_SKILLS.map((s) => (
                  <option key={s} value={s}>
                    {SKILL_TOPIC[s]}
                  </option>
                ))}
              </select>
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: INK }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Lead story on the blog
            </label>
            {id ? (
              <button type="button" disabled={pending} onClick={remove} style={{ ...secondaryBtn, color: TONE.red.ink, justifyContent: "center", marginTop: 6 }}>
                <Trash2 size={15} /> Delete post
              </button>
            ) : null}
          </Section>
        </div>

        {/* ── middle: the article ───────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL, padding: "18px 24px" }}>
            <textarea
              value={form.title}
              onChange={(e) => set("title", e.target.value.replace(/\n/g, " "))}
              placeholder="Post title"
              rows={2}
              aria-label="Title"
              lang="en"
              style={{ ...bare, fontFamily: SERIF, fontSize: 30, lineHeight: 1.2, fontWeight: 600 }}
            />
            <textarea
              value={form.standfirst}
              onChange={(e) => set("standfirst", e.target.value.replace(/\n/g, " "))}
              placeholder="Standfirst — the bold opening line. It is also the search description and the card summary."
              rows={2}
              aria-label="Standfirst"
              lang="en"
              style={{ ...bare, fontSize: 16.5, lineHeight: 1.55, fontWeight: 500, color: MUTED, marginTop: 8 }}
            />
            <div style={{ fontSize: 11.5, color: form.standfirst.length > 200 ? TONE.red.ink : FAINT, textAlign: "right" }}>
              {form.standfirst.length}/200
            </div>
          </div>

          <RichText editor={editor} onError={fail} />

          <Section title="In short" note="Two to five points, one per line. Each a whole sentence that makes sense alone — answer engines quote them one at a time, so never start with “This”, “It” or “Also”.">
            <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={5} style={field} lang="en" />
          </Section>

          <Section title="Questions readers ask (optional)" note="Q: and A: lines, a blank line between pairs. Plain-text answers, two or three sentences each.">
            <textarea value={form.faq} onChange={(e) => set("faq", e.target.value)} rows={8} style={field} lang="en" />
          </Section>

          <Section title="Closing panel (optional)" note="Where to practise what the article taught.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <Field label="Panel title">
                <input value={form.ctaTitle} onChange={(e) => set("ctaTitle", e.target.value)} style={field} />
              </Field>
              <Field label="Link — like /ielts-reading-practice">
                <input value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} style={field} />
              </Field>
              <Field label="Button label">
                <input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} style={field} />
              </Field>
            </div>
            <Field label="Panel text">
              <textarea value={form.ctaText} onChange={(e) => set("ctaText", e.target.value)} rows={2} style={field} />
            </Field>
          </Section>
        </div>

        {/* ── right: media and SEO ──────────────────────────────────────── */}
        <SidePanel
          editor={editor}
          post={post}
          blogUrl={blogUrl}
          keywords={form.keywords}
          onKeywords={(k) => set("keywords", k)}
          onCover={(src) => set("imageSrc", src)}
          onError={fail}
        />
      </div>
    </div>
  );
}

function Cover({
  form,
  set,
  onError,
}: {
  form: PostForm;
  set: <K extends keyof PostForm>(key: K, value: PostForm[K]) => void;
  onError: (m: string) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    const { image, error } = await uploadImage(f);
    setBusy(false);
    if (error || !image) onError(error ?? "Upload failed.");
    else set("imageSrc", image.url);
  }
  return (
    <>
      <button
        type="button"
        onClick={() => file.current?.click()}
        style={{
          display: "grid",
          placeItems: "center",
          width: "100%",
          aspectRatio: "16 / 10",
          padding: 0,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
          background: WELL,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {form.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- an editor preview of the cover
          <img src={form.imageSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ display: "grid", placeItems: "center", gap: 6, color: MUTED, fontSize: 12.5 }}>
            <ImagePlus size={22} />
            {busy ? "Uploading…" : "Upload a cover photo"}
            <span style={{ fontSize: 11.5, color: FAINT }}>Optional — without one, the cover word is set large instead</span>
          </span>
        )}
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
      {form.imageSrc ? (
        <>
          <Field label="Photo alt text">
            <input value={form.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} style={field} placeholder="What the photo shows" />
          </Field>
          <Field label="Credit (optional)">
            <input value={form.imageCredit} onChange={(e) => set("imageCredit", e.target.value)} style={field} />
          </Field>
          <button type="button" onClick={() => set("imageSrc", "")} style={{ ...secondaryBtn, justifyContent: "center" }}>
            Remove photo
          </button>
        </>
      ) : null}
      <Field label="Cover word" note="A word or two set large on the cover — “Task 2”, “T / F / NG”.">
        <input value={form.coverKicker} onChange={(e) => set("coverKicker", e.target.value)} style={field} />
      </Field>
    </>
  );
}

/** The h2/h3 outline, live from the editor; a click scrolls to the heading. */
function Contents({ body, onJump }: { body: Block[]; onJump: (index: number) => void }) {
  const heads = body.flatMap((b) => (b.type === "h2" || b.type === "h3" ? [{ level: b.type, text: plainText(b.text) }] : []));
  if (!heads.length) return <p style={{ margin: 0, fontSize: 12.5, color: FAINT }}>Headings you add appear here.</p>;
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
      {heads.map((h, i) => (
        <li key={`${i}-${headingId(h.text)}`}>
          <button
            type="button"
            onClick={() => onJump(i)}
            className="sa-menu-item"
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              border: 0,
              borderRadius: 7,
              background: "transparent",
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: h.level === "h2" ? 13 : 12.5,
              color: h.level === "h2" ? INK : MUTED,
              padding: `5px 8px 5px ${h.level === "h2" ? 8 : 22}px`,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {h.text}
          </button>
        </li>
      ))}
    </ol>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section style={{ border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: SANS, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700, color: FAINT }}>
          {title}
        </h2>
        {note ? <p style={{ margin: "5px 0 0", fontSize: 11.5, color: FAINT, lineHeight: 1.45 }}>{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: MUTED, marginBottom: 5 }}>{label}</span>
      {children}
      {note ? <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 4, lineHeight: 1.45 }}>{note}</span> : null}
    </label>
  );
}

function Banner({ tone, children }: { tone: "red" | "green"; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <div
      role={tone === "red" ? "alert" : "status"}
      style={{
        fontFamily: SANS,
        fontSize: 13.5,
        lineHeight: 1.5,
        color: t.ink,
        background: t.tint,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: "11px 13px",
      }}
    >
      {children}
    </div>
  );
}

const bare: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  border: 0,
  outline: "none",
  resize: "none",
  padding: 0,
  background: "transparent",
  color: INK,
  fontFamily: SANS,
};

const field: React.CSSProperties = {
  width: "100%",
  fontFamily: SANS,
  fontSize: 13.5,
  color: INK,
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "8px 10px",
  boxSizing: "border-box",
  resize: "vertical",
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: 13.5,
    fontWeight: 600,
    padding: "8px 18px",
    borderRadius: 10,
    border: `1px solid ${INDIGO_FILL}`,
    background: INDIGO_FILL,
    color: ON_INDIGO,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
  };
}

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  padding: "8px 14px",
  borderRadius: 10,
  border: `1px solid ${LINE}`,
  background: PANEL,
  color: INK,
  cursor: "pointer",
  textDecoration: "none",
};
