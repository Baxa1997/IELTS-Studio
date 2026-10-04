"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Card, CardHead, FAINT, INK, LINE, MUTED, Pill, SANS, TONE } from "@/app/admin/_components/ui";
import { BLOG_SKILLS, SKILL_TOPIC, type PostStatus } from "@/lib/blog";
import { formToPost, postToForm, type PostForm } from "@/lib/blog/form";
import { INDIGO_FILL, ON_INDIGO, PANEL } from "@/lib/theme/tokens";

import { deletePost, savePost, type SaveIntent } from "../actions";

/**
 * One post, as text fields — the whole of the blog's editor.
 *
 * The body is ONE text area in the format of lib/blog/source.ts (Markdown, plus
 * `:::tip` and `:::example`), so a post can be drafted anywhere and pasted in.
 * Nothing is parsed here: the form goes to the server as typed, the server
 * builds the post and checks it, and what comes back is either the saved post
 * or the list of what is wrong with it.
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
}: {
  id: string | null;
  status: PostStatus;
  initial: PostForm;
  categories: CategoryOption[];
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

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof PostForm>(key: K, value: PostForm[K]) =>
    setForm((f) => ({ ...f, [key]: value, ...(key === "title" && !slugTouched ? { slug: slugify(String(value)) } : {}) }));

  function run(intent: SaveIntent) {
    setProblems([]);
    setNotice(null);
    start(async () => {
      const res = await savePost(id, form, intent);
      if (!res.ok) {
        setProblems(res.problems ?? ["Could not save."]);
        return;
      }
      // Show what was stored, which the server normalised (a slug lower-cased,
      // blank lines in the body collapsed) — not what was typed.
      const stored = postToForm(formToPost(form));
      setForm(stored);
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

  const published = current === "published";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status and actions, pinned to the top of the scroll so publishing is
          never a long way from the text being published. */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
        }}
      >
        <Pill tone={published ? "green" : "amber"}>{published ? "Published" : "Draft"}</Pill>
        {dirty ? <span style={{ fontSize: 12.5, color: MUTED }}>Unsaved changes</span> : null}
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {id ? (
            <a href={`/blog/preview/${id}`} target="_blank" rel="noreferrer" style={secondaryBtn}>
              Preview{dirty ? " (last save)" : ""}
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

      <Card pad>
        <Grid>
          <Field label="Title" wide>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} style={field} lang="en" />
          </Field>
          <Field label="Slug — /blog/…" note={published ? "Live address: changing it breaks links people have shared." : undefined}>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              style={field}
            />
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
          <Field label="Published on">
            <input type="date" value={form.published} onChange={(e) => set("published", e.target.value)} style={field} />
          </Field>
          <Field label="Updated on (optional)">
            <input type="date" value={form.updated} onChange={(e) => set("updated", e.target.value)} style={field} />
          </Field>
          <Field label="Author">
            <input value={form.author} onChange={(e) => set("author", e.target.value)} style={field} />
          </Field>
          <Field label="Cover word" note="A word or two set large on the cover — “Task 2”, “T / F / NG”.">
            <input value={form.coverKicker} onChange={(e) => set("coverKicker", e.target.value)} style={field} lang="en" />
          </Field>
          <Field label="Lead story" plain>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: INK, paddingTop: 8 }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Lead the blog and the landing page with this post
            </label>
          </Field>
          <Field label={`Standfirst — ${form.standfirst.length}/200`} note="The bold opening line. Also the card summary and the search description." wide>
            <textarea value={form.standfirst} onChange={(e) => set("standfirst", e.target.value)} rows={2} style={field} lang="en" />
          </Field>
        </Grid>
      </Card>

      <Card>
        <CardHead
          title="In short"
          note="Two to five points, one per line. Each a whole sentence that makes sense alone — answer engines quote them one at a time, so never start with “This”, “It” or “Also”."
        />
        <div style={{ padding: 16 }}>
          <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={5} style={field} lang="en" />
        </div>
      </Card>

      <Card>
        <CardHead title="Article" note={<BodyHelp />} />
        <div style={{ padding: 16 }}>
          <textarea
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            rows={28}
            style={{ ...field, fontFamily: "var(--font-mono-data), ui-monospace, monospace", fontSize: 13.5, lineHeight: 1.6 }}
            lang="en"
            spellCheck
          />
        </div>
      </Card>

      <Card>
        <CardHead
          title="Questions readers ask (optional)"
          note="Q: and A: lines, a blank line between pairs. Plain text answers, two or three sentences each."
        />
        <div style={{ padding: 16 }}>
          <textarea value={form.faq} onChange={(e) => set("faq", e.target.value)} rows={8} style={field} lang="en" />
        </div>
      </Card>

      <Card pad>
        <Label>Closing panel (optional) — where to practise what the article taught</Label>
        <Grid>
          <Field label="Panel title">
            <input value={form.ctaTitle} onChange={(e) => set("ctaTitle", e.target.value)} style={field} lang="en" />
          </Field>
          <Field label="Link — a page on the site, like /ielts-reading-practice">
            <input value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} style={field} />
          </Field>
          <Field label="Panel text" wide>
            <textarea value={form.ctaText} onChange={(e) => set("ctaText", e.target.value)} rows={2} style={field} lang="en" />
          </Field>
          <Field label="Button label">
            <input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} style={field} lang="en" />
          </Field>
        </Grid>
      </Card>

      <Card pad>
        <Label>Photo (optional) — replaces the generated cover</Label>
        <Grid>
          <Field label="Image — a file in /public, like /blog/cover.jpg">
            <input value={form.imageSrc} onChange={(e) => set("imageSrc", e.target.value)} style={field} />
          </Field>
          <Field label="Alt text">
            <input value={form.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} style={field} lang="en" />
          </Field>
          <Field label="Credit">
            <input value={form.imageCredit} onChange={(e) => set("imageCredit", e.target.value)} style={field} />
          </Field>
        </Grid>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/admin/blog" style={{ fontSize: 13, color: MUTED }}>
          ← All posts
        </Link>
        {id ? (
          <button type="button" disabled={pending} onClick={remove} style={{ ...secondaryBtn, marginLeft: "auto", color: TONE.red.ink }}>
            Delete post
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BodyHelp() {
  return (
    <>
      A blank line between blocks. <code>## Heading</code> · <code>- bullet</code> · <code>1. numbered</code> ·{" "}
      <code>&gt; quote</code> with <code>&gt; — who</code> under it · <code>:::tip Title</code> … <code>:::</code> ·{" "}
      <code>:::example Title</code> with <code>Label: text</code> lines … <code>:::</code>. Inline: <code>**bold**</code>,{" "}
      <code>*italic*</code>, <code>[label](/path)</code>.
    </>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px 16px" }}>
      {children}
    </div>
  );
}

/** A labelled control. `plain` when the child carries its own <label> — a
 *  label inside a label is invalid and confuses screen readers. */
function Field({
  label,
  note,
  wide,
  plain,
  children,
}: {
  label: string;
  note?: string;
  wide?: boolean;
  plain?: boolean;
  children: React.ReactNode;
}) {
  const Tag = plain ? "div" : "label";
  return (
    <Tag style={{ display: "block", gridColumn: wide ? "1 / -1" : undefined, minWidth: 0 }}>
      <Label>{label}</Label>
      {children}
      {note ? <div style={{ fontSize: 11.5, color: FAINT, marginTop: 5, lineHeight: 1.45 }}>{note}</div> : null}
    </Tag>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: ".07em",
        textTransform: "uppercase",
        fontWeight: 600,
        color: FAINT,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
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

const field: React.CSSProperties = {
  width: "100%",
  fontFamily: SANS,
  fontSize: 14,
  color: INK,
  background: PANEL,
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "9px 11px",
  boxSizing: "border-box",
  resize: "vertical",
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: 13.5,
    fontWeight: 600,
    padding: "9px 18px",
    borderRadius: 10,
    border: `1px solid ${INDIGO_FILL}`,
    background: INDIGO_FILL,
    color: ON_INDIGO,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
  };
}

const secondaryBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  padding: "9px 15px",
  borderRadius: 10,
  border: `1px solid ${LINE}`,
  background: PANEL,
  color: INK,
  cursor: "pointer",
  textDecoration: "none",
};
