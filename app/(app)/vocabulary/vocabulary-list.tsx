"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface VocabItem {
  id: string;
  word: string;
  language: string;
  translation: string;
  definition: string | null;
  example: string | null;
  context_sentence: string | null;
  source: string;
  created_at: string;
}

/**
 * The saved-words list. Client-side because it filters by language/search and
 * deletes inline (DELETE /api/vocabulary/[id]) without a full reload. The words
 * themselves are added WHILE practicing (selecting a word in a passage), so this
 * page is read + curate only.
 */
export function VocabularyList({ initial }: { initial: VocabItem[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const languages = useMemo(() => [...new Set(items.map((i) => i.language))].sort(), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (lang !== "all" && i.language !== lang) return false;
      if (!q) return true;
      return (
        i.word.toLowerCase().includes(q) ||
        i.translation.toLowerCase().includes(q) ||
        (i.definition ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, lang]);

  async function remove(id: string) {
    setBusy(id);
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== id)); // optimistic
    try {
      const res = await fetch(`/api/vocabulary/${id}`, { method: "DELETE" });
      if (!res.ok) setItems(prev); // restore on failure
    } catch {
      setItems(prev);
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
        No saved words yet. While you practice <span className="text-foreground font-medium">Reading</span>, select any
        word in the passage to see its translation and tap{" "}
        <span className="text-foreground font-medium">Add to vocabulary</span> — they collect here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words…"
          className="border-input focus-visible:ring-ring h-9 w-full max-w-xs rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-2"
        />
        {languages.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={lang === "all"} onClick={() => setLang("all")}>
              All
            </Chip>
            {languages.map((l) => (
              <Chip key={l} active={lang === l} onClick={() => setLang(l)}>
                {l}
              </Chip>
            ))}
          </div>
        ) : null}
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {visible.length} word{visible.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* List */}
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((item) => (
          <article key={item.id} className="bg-card group relative rounded-xl border p-4">
            <button
              type="button"
              onClick={() => void remove(item.id)}
              disabled={busy === item.id}
              aria-label={`Remove ${item.word}`}
              className="text-muted-foreground hover:text-destructive absolute top-3 right-3 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>

            <div className="flex items-baseline gap-2 pr-6">
              <h3 className="font-semibold break-words">{item.word}</h3>
              <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-[11px] font-medium">
                {item.language}
              </span>
            </div>
            <p className="text-primary mt-1 text-lg font-semibold break-words">{item.translation || "—"}</p>
            {item.definition ? <p className="text-foreground/80 mt-1 text-sm">{item.definition}</p> : null}
            {item.example ? (
              <p className="text-muted-foreground mt-1.5 text-xs italic">“{item.example}”</p>
            ) : null}
            <p className="text-muted-foreground mt-2 text-[11px]">
              {item.source === "writing" ? "From writing" : "From reading"} · {fmtDate(item.created_at)}
            </p>
          </article>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">No words match this filter.</p>
      ) : null}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}
