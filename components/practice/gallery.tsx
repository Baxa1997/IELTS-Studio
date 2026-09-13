"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

/**
 * The practice gallery: one browsable grid, shared by every list of practice in
 * the product — a learner's own history, a teacher's library, and the practices
 * on a student's report.
 *
 * ⚠️ THREE PAGES, THREE DIFFERENT ROW SHAPES, AND THAT IS WHY THIS TAKES A
 * FLATTENED `GalleryItem` RATHER THAN ANY OF THEM. The learner's history rows
 * carry a band and a date; the teacher's library rows carry a category, groups
 * and a completion count; the student report's rows carry a weakness and a
 * link to the marked-up feedback. Teaching this component about all three would
 * make it the union of their three loaders and impossible to change one without
 * reading the others. Each page maps ITS row into the shape below, which is the
 * only thing the grid knows.
 *
 * The filtering is CLIENT-SIDE on purpose. Every one of these lists is already
 * fully loaded by the server page that renders it — they are a term's work, not
 * a feed — so searching them is a string match over an array that is already in
 * memory. Putting the query in the URL would cost a round trip and a re-render
 * of the whole page to filter something nobody else needs to see.
 */

/** The hue a card wears. Skills keep one colour wherever they appear, which is
 *  what lets somebody find their reading practice by colour rather than by
 *  reading every title. */
/**
 * Join class names.
 *
 * ⚠️ THIS EXISTS BECAUSE OF PRETTIER. These lists were template literals whose
 * two class names were separated by a SPACE INSIDE A STRING LITERAL —
 * `` `pg-chip${on ? " pg-chip--on" : ""}` `` — and `prettier --write` removes
 * it. The result compiles, renders, and is silently wrong: the two names fuse
 * into one token that matches no rule, so the element loses BOTH classes. The
 * selected chip stopped being a chip at all and rendered as bare text.
 *
 * It is the fourth time this has happened in this repo. See the identical note
 * in components/app-shell/sidebar-nav.tsx, and the guard in
 * components/app-shell/nav-groups.test.ts, which now scans every component
 * rather than only the one it was written for.
 */
function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export type Tone = "writing" | "reading" | "listening" | "speaking" | "lesson" | "neutral";

const TONE: Record<Tone, { bg: string; ink: string; line: string; label: string }> = {
  writing: { bg: "#efeafb", ink: "#5b3fa8", line: "#e2d9f6", label: "Writing" },
  reading: { bg: "#e6f1ea", ink: "#14714a", line: "#d6e8dd", label: "Reading" },
  listening: { bg: "#e3f0f6", ink: "#1d6f92", line: "#d2e6ef", label: "Listening" },
  speaking: { bg: "#fbe9ef", ink: "#a83a5b", line: "#f5dae3", label: "Speaking" },
  lesson: { bg: "#fdf0dc", ink: "#9a6310", label: "Lesson", line: "#f7e4c7" },
  neutral: { bg: "#f0efea", ink: "#5c616b", line: "#e6e4dc", label: "Practice" },
};

export interface GalleryItem {
  id: string;
  /** Where the card goes. Null for a practice with no report yet — the card
   *  still renders, because "you did this and it was not marked" is a fact the
   *  reader needs, but it does not pretend to be a door. */
  href: string | null;
  title: string;
  /** The line under the title — the reference puts the author here; we put
   *  whatever names this practice: a date, a group, a category. */
  byline?: string;
  /** The chip beside the title, where the reference shows a price. */
  badge?: string;
  /** The big figure on the card's face. A band, a score, or nothing. */
  headline: string;
  /** Small print under the headline, inside the tinted panel. */
  headnote?: string;
  tone: Tone;
  /** Which chip filters this in. Must be one of `categories` below. */
  category: string;
  /** The footer's small facts, left of the arrow. */
  stats?: string[];
  /**
   * Controls that belong to this card rather than to the page — publish,
   * archive, and so on.
   *
   * ⚠️ RENDERED OUTSIDE THE CARD'S LINK, and that is not a layout preference.
   * A <button> inside an <a> is invalid HTML; the browser un-nests it, and what
   * you get is an archive button that navigates. So a card WITH actions is not
   * a link at all — its arrow is, and the actions sit beside it.
   */
  actions?: React.ReactNode;
  /** Sort keys. `date` is an ISO string; `value` is a band or score. */
  date?: string;
  value?: number | null;
  /**
   * A SECOND axis to filter on, independent of `category`.
   *
   * The chips answer "what kind of practice is this" and are always the skill.
   * A centre's practice board also has to answer "what is overdue", which is not
   * a kind — it is a state, and a row is exactly one of both. Giving it its own
   * dimension is what stops the chip row growing into a mixed list where
   * "Reading" and "Overdue" sit side by side looking like alternatives.
   */
  status?: string;
}

export type SortKey = "recent" | "oldest" | "band" | "title";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Most recent" },
  { key: "oldest", label: "Oldest first" },
  { key: "band", label: "Highest band" },
  { key: "title", label: "A–Z" },
];

export function PracticeGallery({
  title,
  subtitle,
  items,
  categories,
  emptyTitle = "Nothing here yet",
  emptyNote,
  defaultSort = "recent",
  columns = 4,
  statusLabel = "All statuses",
  statuses,
  bleed = false,
}: {
  /** Omit when the page already draws its own header — the console pages keep
   *  their `PageHead` and their status tabs above the grid. */
  title?: string;
  subtitle?: string;
  items: GalleryItem[];
  /** The chip row, in the order it should read. "All" is prepended here. */
  categories: string[];
  emptyTitle?: string;
  emptyNote?: string;
  defaultSort?: SortKey;
  /**
   * How many cards wide at full size.
   *
   * ⚠️ IT IS A PROP BECAUSE THE MEDIA QUERIES CANNOT SEE THE COLUMN. The grid
   * steps down 4 → 3 → 2 → 1 on VIEWPORT width, which is right for a page that
   * owns its full width and wrong for this grid dropped into the narrow left
   * column of a student report: on a wide screen that column is barely 600px
   * and the media queries would still hand it four cards. The page knows how
   * much room it gave away; the stylesheet does not.
   */
  columns?: 2 | 3 | 4;
  /** What the "no status chosen" option reads as. */
  statusLabel?: string;
  /** The second filter's options. Omit and the Filter select falls back to
   *  filtering by category, which is what the pages with only one axis want. */
  statuses?: string[];
  /**
   * Run the grid edge to edge across the page instead of inside its gutter,
   * with as many columns as the width actually holds.
   *
   * For a page that owns its full width — the centre's practice board. The
   * toolbar and chips keep the gutter; only the ruled grid reaches the edges,
   * which is what makes it read as one collection spanning the page. `columns`
   * is ignored when this is on: the count follows the space, not the viewport.
   */
  bleed?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>(defaultSort);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = items.filter(
      (item) =>
        (!category || item.category === category) &&
        (!status || item.status === status) &&
        // The byline carries the group and the teacher on the board, so
        // searching it is how "Group B" and a teacher's name are found without
        // a filter of their own.
        (!needle ||
          item.title.toLowerCase().includes(needle) ||
          (item.byline ?? "").toLowerCase().includes(needle)),
    );
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "band") {
        // A practice with no band sorts LAST rather than as a zero — it was not
        // graded, which is not the same as having been graded badly.
        if (a.value == null && b.value == null) return 0;
        if (a.value == null) return 1;
        if (b.value == null) return -1;
        return b.value - a.value;
      }
      const at = a.date ?? "";
      const bt = b.date ?? "";
      return sort === "oldest" ? at.localeCompare(bt) : bt.localeCompare(at);
    });
    return sorted;
  }, [items, query, category, status, sort]);

  /* A category with nothing in it is a chip that leads to an empty grid. They
     are computed from the items rather than taken on trust, so a learner who has
     never done a listening test is not offered a Listening filter. */
  const live = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    return categories.filter((c) => present.has(c));
  }, [items, categories]);

  return (
    <div className="pg-root">
      {title ? (
        <header className="pg-head">
          <h1 className="pg-title">{title}</h1>
          {subtitle ? <p className="pg-sub">{subtitle}</p> : null}
        </header>
      ) : null}

      <div className="pg-toolbar">
        <div className="pg-search">
          <Search size={17} strokeWidth={2} aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search practice"
            aria-label="Search practice"
          />
        </div>
        <div className="pg-selects">
          <label className="pg-select">
            <span className="pg-sr">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="pg-select">
            <span className="pg-sr">Filter</span>
            {/* The second filter does whichever job the page has for it. A page
                with a state axis (the centre board's set / overdue / all-in)
                puts it here, because a state is not a kind and would read as an
                alternative to "Reading" if it were dropped into the chip row.
                Everywhere else it mirrors the chips, which is what the reference
                does with its own second dropdown. */}
            {statuses ? (
              <select value={status ?? ""} onChange={(e) => setStatus(e.target.value || null)}>
                <option value="">{statusLabel}</option>
                {statuses.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <select value={category ?? ""} onChange={(e) => setCategory(e.target.value || null)}>
                <option value="">All practice</option>
                {live.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>
      </div>

      {live.length > 1 ? (
        <div className="pg-chips" role="group" aria-label="Filter by type">
          <button
            type="button"
            className={cx("pg-chip", category === null && "pg-chip--on")}
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
          >
            All
          </button>
          <span className="pg-chip-rule" aria-hidden />
          {live.map((c) => (
            <button
              key={c}
              type="button"
              className={cx("pg-chip", category === c && "pg-chip--on")}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="pg-empty">
          <strong>{query || category ? "Nothing matches" : emptyTitle}</strong>
          <span>
            {query || category ? "Try a different search, or clear the filter." : (emptyNote ?? "")}
          </span>
        </div>
      ) : (
        <div className={cx(bleed && "pg-bleed")}>
          <div className={cx("pg-grid", bleed ? "pg-grid--fill" : `pg-grid--${columns}`)}>
            {visible.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ item }: { item: GalleryItem }) {
  const tone = TONE[item.tone];
  /* The whole card is the link ONLY when it has no controls of its own — see
     the note on `actions`. Otherwise the arrow carries the navigation. */
  const linked = item.href != null && item.actions == null;
  const face = (
    <>
      {/* The card's face. The reference shows a screenshot of the app; a past
          essay has no screenshot, so the face IS the result — the band set
          large on the skill's own colour. It is the thing somebody is scanning
          for, so it gets the space the picture had. */}
      <div className="pg-face" style={{ background: tone.bg, borderColor: tone.line }}>
        <span className="pg-face-big" style={{ color: tone.ink }}>
          {item.headline}
        </span>
        {item.headnote ? (
          <span className="pg-face-note" style={{ color: tone.ink }}>
            {item.headnote}
          </span>
        ) : null}
        <span className="pg-face-tag" style={{ color: tone.ink, borderColor: tone.line }}>
          {tone.label}
        </span>
      </div>

      <div className="pg-row">
        <h3 className="pg-name" title={item.title}>
          {item.title}
        </h3>
        {item.badge ? <span className="pg-badge">{item.badge}</span> : null}
      </div>
      {item.byline ? <p className="pg-by">{item.byline}</p> : null}

      <div className="pg-foot">
        <span className="pg-stats">{(item.stats ?? []).join("  ·  ")}</span>
        <span className="pg-tools">
          {item.actions}
          {item.href ? (
            linked ? (
              <span className="pg-go" aria-hidden>
                <ArrowRight size={17} strokeWidth={2.4} />
              </span>
            ) : (
              <Link href={item.href} className="pg-go" aria-label={`Open ${item.title}`}>
                <ArrowRight size={17} strokeWidth={2.4} />
              </Link>
            )
          ) : null}
        </span>
      </div>
    </>
  );

  /* A card with nowhere to go is a <div>, not a dead <a>. An anchor with no href
     is not focusable and reads as a link to a screen reader anyway — the honest
     shape for "this has no report yet" is not to be a link at all. */
  return linked ? (
    <Link href={item.href as string} className="pg-card">
      {face}
    </Link>
  ) : (
    <div className={cx("pg-card", !item.href && "pg-card--flat")}>{face}</div>
  );
}
