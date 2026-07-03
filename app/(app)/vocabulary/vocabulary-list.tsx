"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GraduationCap, Trash2, Volume2, X } from "lucide-react";

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

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";
const TINT = "#F4F4FE";
const TINT_BORDER = "#E0E1F4";
const EMERALD = "#2f8f5b";

const card: React.CSSProperties = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16 };

// ---- Spaced repetition (Leitner boxes, stored in localStorage) ---------------
// No server round-trip: each word carries a box 0..4; a correct answer moves it
// up one box (longer wait), a miss drops it to box 0 and it comes back in ~10min.

type Mode = "recognition" | "recall" | "mixed";
type SrsEntry = { box: number; next: number };

const SRS_KEY = "vb-srs-v1";
const DAY = 86_400_000;
const BOX_DAYS = [0, 1, 3, 7, 14];

function loadSrs(): Record<string, SrsEntry> {
  try {
    return JSON.parse(localStorage.getItem(SRS_KEY) ?? "{}") as Record<string, SrsEntry>;
  } catch {
    return {};
  }
}
function saveSrs(s: Record<string, SrsEntry>) {
  srsNow = Date.now();
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(s));
  } catch {}
  // Same-tab writes don't fire "storage", so nudge our own subscribers too.
  window.dispatchEvent(new Event(SRS_EVENT));
}

// localStorage is an external store: components read it via useSyncExternalStore
// (server snapshot = empty, so SSR and hydration agree) and re-read on any write.
// "Now" is frozen OUTSIDE render (page load + each grade) and rides along in the
// snapshot, so computing due-ness stays pure — no Date.now() during render.
const SRS_EVENT = "vb-srs-updated";
let srsNow = typeof window === "undefined" ? 0 : Date.now();
function subscribeSrs(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(SRS_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(SRS_EVENT, cb);
  };
}
function srsSnapshot(): string {
  return `${srsNow}|${localStorage.getItem(SRS_KEY) ?? "{}"}`;
}
function srsServerSnapshot(): string {
  return "0|{}";
}

/** Browser TTS pronunciation — no audio files needed for UK/US playback. */
function speak(word: string, accent: "UK" | "US") {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = accent === "UK" ? "en-GB" : "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {}
}

const MODE_META: Record<Mode, { label: string; hint: string }> = {
  recognition: { label: "Recognition", hint: "See the word — recall the meaning. Best for Reading and Listening." },
  recall: { label: "Recall", hint: "See the meaning — recall the word. Best for Writing and Speaking." },
  mixed: { label: "Mixed", hint: "Both directions, shuffled." },
};

function sourceLabel(source: string): string {
  const map: Record<string, string> = { reading: "Reading", writing: "Writing", listening: "Listening", speaking: "Speaking", manual: "Manual" };
  return map[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

/**
 * The vocabulary page body: a spaced-repetition review hero, search + source/
 * language filters, and the saved-word grid. Client-side because filtering,
 * deleting (DELETE /api/vocabulary/[id]), TTS playback, and the review session
 * all live in the browser; the words themselves are added WHILE practicing.
 */
export function VocabularyList({ initial }: { initial: VocabItem[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("recognition");
  const [reviewing, setReviewing] = useState(false);

  const languages = useMemo(() => [...new Set(items.map((i) => i.language))].sort(), [items]);
  const sources = useMemo(() => [...new Set(items.map((i) => i.source))].sort(), [items]);

  // Due words derive from the localStorage schedule (empty on the server, so the
  // badge fills in right after hydration and after every graded card).
  const srsState = useSyncExternalStore(subscribeSrs, srsSnapshot, srsServerSnapshot);
  const due = useMemo(() => {
    const sep = srsState.indexOf("|");
    const now = Number(srsState.slice(0, sep)) || 0;
    let srs: Record<string, SrsEntry>;
    try {
      srs = JSON.parse(srsState.slice(sep + 1)) as Record<string, SrsEntry>;
    } catch {
      srs = {};
    }
    return items.filter((i) => (srs[i.id]?.next ?? 0) <= now);
  }, [items, srsState]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (lang !== "all" && i.language !== lang) return false;
      if (source !== "all" && i.source !== source) return false;
      if (!q) return true;
      return (
        i.word.toLowerCase().includes(q) ||
        i.translation.toLowerCase().includes(q) ||
        (i.definition ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, lang, source]);

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

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      <style>{VOCAB_CSS}</style>

      {/* Header */}
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT }}>Word bank</div>
      <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(24px,2.6vw,32px)", lineHeight: 1.08, letterSpacing: "-.015em", margin: "6px 0 0" }}>Vocabulary</h1>
      <p style={{ fontSize: 15, color: MUTED, margin: "6px 0 0" }}>
        Words you save while practicing — reviewed with spaced repetition so they stick.
      </p>

      {items.length === 0 ? (
        <div style={{ ...card, marginTop: 20, padding: "34px 26px", textAlign: "center" }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: MUTED, margin: 0, fontFamily: SANS }}>
            No saved words yet. While you practice <strong style={{ color: INK }}>Reading</strong>, select any word in the
            passage to see its translation and tap <strong style={{ color: INK }}>Add to vocabulary</strong> — they collect here.
          </p>
        </div>
      ) : (
        <>
          {/* Spaced-repetition hero */}
          <div style={{ ...card, marginTop: 20, padding: "20px 22px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "18px 26px" }}>
            <div style={{ flex: "1 1 420px", minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ flex: "none", width: 34, height: 34, borderRadius: 10, background: TINT, color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GraduationCap size={18} strokeWidth={2} />
                </span>
                <span style={{ fontWeight: 700, fontSize: 16.5 }}>Spaced repetition</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: MUTED, margin: "9px 0 0", maxWidth: 560 }}>
                The app tracks what you know. Words you miss come back sooner; words you remember wait longer before they show again.
              </p>
              <div style={{ fontWeight: 700, fontSize: 10.5, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT, margin: "14px 0 0" }}>Review mode</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
                {(Object.keys(MODE_META) as Mode[]).map((m) => {
                  const on = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      aria-pressed={on}
                      style={{ padding: "7px 14px", borderRadius: 9, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${on ? TINT_BORDER : LINE}`, background: on ? TINT : "#fff", color: on ? INDIGO : MUTED }}
                    >
                      {MODE_META[m].label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 12.5, color: FAINT, margin: "9px 0 0" }}>{MODE_META[mode].hint}</p>
            </div>
            <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setReviewing(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 10, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, padding: "12px 20px", borderRadius: 11, border: "none", cursor: "pointer", boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)" }}
              >
                Start review
                <span style={{ background: "rgba(255,255,255,.22)", borderRadius: 999, padding: "2px 9px", fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {due.length > 0 ? due.length : items.length}
                </span>
              </button>
              <span style={{ fontSize: 12, color: FAINT, fontVariantNumeric: "tabular-nums" }}>
                {due.length > 0 ? `${due.length} due now` : "Nothing due — practice all"}
              </span>
            </div>
          </div>

          {/* Count + search + filters */}
          <p style={{ fontSize: 13, color: MUTED, margin: "20px 0 0", fontVariantNumeric: "tabular-nums" }}>
            Total cards: <strong style={{ color: INK }}>{items.length}</strong>
          </p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words…"
            style={{ width: "100%", maxWidth: 640, marginTop: 10, padding: "11px 14px", border: `1px solid ${LINE}`, borderRadius: 11, background: "#fff", fontFamily: SANS, fontSize: 14, color: INK, outline: "none" }}
          />
          {sources.length > 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
              <FilterChip active={source === "all"} onClick={() => setSource("all")}>All sources</FilterChip>
              {sources.map((s) => (
                <FilterChip key={s} active={source === s} onClick={() => setSource(s)}>{sourceLabel(s)}</FilterChip>
              ))}
            </div>
          ) : null}
          {languages.length > 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
              <FilterChip active={lang === "all"} onClick={() => setLang("all")}>All languages</FilterChip>
              {languages.map((l) => (
                <FilterChip key={l} active={lang === l} onClick={() => setLang(l)}>{l}</FilterChip>
              ))}
            </div>
          ) : null}

          {/* Word cards */}
          <div className="vb-grid" style={{ marginTop: 16 }}>
            {visible.map((item) => (
              <article key={item.id} className="vb-card" style={{ ...card, borderRadius: 14, padding: "15px 16px", position: "relative" }}>
                <button
                  type="button"
                  onClick={() => void remove(item.id)}
                  disabled={busy === item.id}
                  aria-label={`Remove ${item.word}`}
                  className="vb-del"
                  style={{ position: "absolute", top: 10, right: 10, border: "none", background: "transparent", color: FAINT, cursor: "pointer", padding: 5, borderRadius: 7, opacity: busy === item.id ? 0.4 : undefined }}
                >
                  <Trash2 size={15} />
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 26, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16.5, margin: 0, overflowWrap: "break-word", minWidth: 0 }}>{item.word}</h3>
                  <span style={{ flex: "none", fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: FAINT, background: "#F6F6FA", borderRadius: 999, padding: "2.5px 8px" }}>
                    {item.language}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <SpeakBtn accent="UK" word={item.word} />
                  <SpeakBtn accent="US" word={item.word} />
                </div>

                <p style={{ fontSize: 15, fontWeight: 600, color: INDIGO, margin: "9px 0 0", overflowWrap: "break-word" }}>{item.translation || "—"}</p>
                {item.definition ? <p className="vb-def" style={{ fontSize: 13, lineHeight: 1.5, color: MUTED, margin: "5px 0 0" }}>{item.definition}</p> : null}
                <p style={{ fontSize: 11, color: FAINT, margin: "10px 0 0" }}>
                  {sourceLabel(item.source)} · {fmtDate(item.created_at)}
                </p>
              </article>
            ))}
          </div>

          {visible.length === 0 ? (
            <p style={{ padding: "28px 0", textAlign: "center", fontSize: 14, color: FAINT }}>No words match this filter.</p>
          ) : null}
        </>
      )}

      {reviewing ? (
        <ReviewOverlay pool={due.length > 0 ? due : items} mode={mode} onClose={() => setReviewing(false)} />
      ) : null}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ padding: "6px 13px", borderRadius: 999, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? TINT_BORDER : LINE}`, background: active ? TINT : "#fff", color: active ? INDIGO : MUTED }}
    >
      {children}
    </button>
  );
}

function SpeakBtn({ accent, word }: { accent: "UK" | "US"; word: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(word, accent)}
      aria-label={`Pronounce ${word} (${accent})`}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", color: MUTED, fontFamily: SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: ".03em", cursor: "pointer" }}
    >
      {accent} <Volume2 size={12} />
    </button>
  );
}

// ---- Review session ----------------------------------------------------------

type QueueCard = { item: VocabItem; front: "word" | "meaning" };

function buildQueue(pool: VocabItem[], mode: Mode): QueueCard[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.map((item) => ({
    item,
    front: mode === "mixed" ? (Math.random() < 0.5 ? "word" : "meaning") : mode === "recognition" ? "word" : "meaning",
  }));
}

/**
 * Full-screen flashcard session. "Got it" promotes the word one Leitner box
 * (longer wait); "Again" drops it to box 0, schedules it back in ~10 minutes,
 * and requeues it once at the end of this session.
 */
function ReviewOverlay({ pool, mode, onClose }: { pool: VocabItem[]; mode: Mode; onClose: () => void }) {
  const [queue, setQueue] = useState<QueueCard[]>(() => buildQueue(pool, mode));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [good, setGood] = useState(0);
  const [again, setAgain] = useState(0);
  const [retried] = useState(() => new Set<string>());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = queue.length;
  const done = idx >= total;
  const cur = done ? null : queue[idx];

  function grade(ok: boolean) {
    if (!cur) return;
    const srs = loadSrs();
    const prev = srs[cur.item.id] ?? { box: 0, next: 0 };
    if (ok) {
      const box = Math.min(prev.box + 1, BOX_DAYS.length - 1);
      srs[cur.item.id] = { box, next: Date.now() + BOX_DAYS[box] * DAY };
      setGood((n) => n + 1);
    } else {
      srs[cur.item.id] = { box: 0, next: Date.now() + 10 * 60_000 };
      setAgain((n) => n + 1);
      if (!retried.has(cur.item.id)) {
        retried.add(cur.item.id);
        setQueue((q) => [...q, cur]); // one more look before the session ends
      }
    }
    saveSrs(srs);
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  const showWord = cur?.front === "word";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vocabulary review"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(26,33,56,.5)", backdropFilter: "blur(2px)" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 100%)", background: "#fff", borderRadius: 18, padding: "20px 22px 22px", boxShadow: "0 30px 70px -24px rgba(26,33,56,.6)", fontFamily: SANS, color: INK }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: FAINT, fontVariantNumeric: "tabular-nums" }}>
            {done ? "Session complete" : `${Math.min(idx + 1, total)} / ${total}`}
          </span>
          <button type="button" onClick={onClose} aria-label="Close review" style={{ border: "none", background: "transparent", color: FAINT, cursor: "pointer", padding: 5, borderRadius: 7 }}>
            <X size={17} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "26px 0 8px" }}>
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 26 }}>Nice work</div>
            <p style={{ fontSize: 14, color: MUTED, margin: "10px 0 0", lineHeight: 1.55 }}>
              <strong style={{ color: EMERALD }}>{good}</strong> remembered ·{" "}
              <strong style={{ color: "#c0392b" }}>{again}</strong> to see again soon
            </p>
            <button type="button" onClick={onClose} style={{ marginTop: 20, padding: "11px 24px", borderRadius: 11, border: "none", background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}>
              Done
            </button>
          </div>
        ) : cur ? (
          <>
            <div style={{ marginTop: 16, border: `1px solid ${LINE}`, borderRadius: 14, background: "#FBFBFD", padding: "30px 22px", textAlign: "center", minHeight: 168, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {showWord ? (
                <>
                  <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32, lineHeight: 1.1, overflowWrap: "anywhere" }}>{cur.item.word}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <SpeakBtn accent="UK" word={cur.item.word} />
                    <SpeakBtn accent="US" word={cur.item.word} />
                  </div>
                  {revealed ? (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 17, fontWeight: 600, color: INDIGO }}>{cur.item.translation || "—"}</div>
                      {cur.item.definition ? <p style={{ fontSize: 13.5, lineHeight: 1.55, color: MUTED, margin: "7px 0 0" }}>{cur.item.definition}</p> : null}
                      {cur.item.example ? <p style={{ fontSize: 12.5, fontStyle: "italic", color: FAINT, margin: "7px 0 0" }}>“{cur.item.example}”</p> : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 17, fontWeight: 600, color: INDIGO, overflowWrap: "anywhere" }}>{cur.item.translation || cur.item.definition || "—"}</div>
                  {cur.item.definition && cur.item.translation ? <p style={{ fontSize: 13.5, lineHeight: 1.55, color: MUTED, margin: 0 }}>{cur.item.definition}</p> : null}
                  {revealed ? (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 30, lineHeight: 1.1, overflowWrap: "anywhere" }}>{cur.item.word}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
                        <SpeakBtn accent="UK" word={cur.item.word} />
                        <SpeakBtn accent="US" word={cur.item.word} />
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {revealed ? (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => grade(false)} style={{ flex: 1, padding: "12px 10px", borderRadius: 11, border: "1.5px solid #F0C8C0", background: "#FDF3F1", color: "#c0392b", fontFamily: SANS, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Again
                </button>
                <button type="button" onClick={() => grade(true)} style={{ flex: 1, padding: "12px 10px", borderRadius: 11, border: "none", background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Got it
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setRevealed(true)} style={{ width: "100%", marginTop: 16, padding: "12px 10px", borderRadius: 11, border: `1.5px solid ${TINT_BORDER}`, background: TINT, color: INDIGO, fontFamily: SANS, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Show answer
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ---- helpers -----------------------------------------------------------------

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

const VOCAB_CSS = `
.vb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
.vb-card .vb-del { opacity: 0; transition: opacity .15s ease, color .15s ease; }
.vb-card:hover .vb-del, .vb-card .vb-del:focus-visible { opacity: 1; }
.vb-card .vb-del:hover { color: #c0392b; }
.vb-def { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`;
