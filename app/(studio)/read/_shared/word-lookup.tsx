"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";

import { EMERALD, INDIGO, INK, MUTED, SANS } from "./tokens";

/**
 * In-practice word lookup. The learner selects a word/short phrase inside the
 * reading passage; a small popup offers its translation in any language (the
 * sentence it sits in disambiguates the sense) and an "Add to vocabulary" action.
 * Both translating and saving go through the server (never client → model); this
 * component only drives the UI and remembers the chosen language.
 *
 * It owns no passage markup — give it `getContainer` (the scroll element holding
 * the text) so it only reacts to selections INSIDE the passage, and `contextText`
 * (the full passage body) so it can pull out the surrounding sentence.
 */

const LANG_KEY = "ielts_vocab_lang";
const COMMON_LANGUAGES = [
  "Uzbek", "Russian", "Arabic", "Turkish", "Persian", "Hindi", "Urdu", "Spanish",
  "French", "German", "Chinese", "Japanese", "Korean", "Portuguese", "Indonesian",
  "Vietnamese", "Thai", "Italian", "Ukrainian", "Kazakh",
];

interface Selection {
  word: string;
  sentence: string;
  /** Viewport-anchored position of the selected text. */
  x: number;
  /** Bottom + top of the selection rect, for placing the card below or above it. */
  yBottom: number;
  yTop: number;
}

interface LookupResult {
  translation: string;
  part_of_speech: string;
  definition: string;
  example: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function WordLookup({
  getContainer,
  contextText,
  source = "reading",
}: {
  getContainer: () => HTMLElement | null;
  contextText: string;
  source?: "reading" | "writing";
}) {
  const [sel, setSel] = useState<Selection | null>(null);
  const [language, setLanguage] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const cardRef = useRef<HTMLDivElement | null>(null);
  // Monotonic id for the in-flight lookup: when you tap words quickly, an earlier
  // request can resolve AFTER a later one — bumping this on every new selection /
  // close lets us ignore any reply that isn't for the latest request.
  const reqIdRef = useRef(0);

  // Restore the last-used language so repeat lookups are one-tap.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved) setLanguage(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const close = useCallback(() => {
    reqIdRef.current++; // discard any reply still in flight
    setSel(null);
    setResult(null);
    setError(null);
    setSave("idle");
    setLoading(false);
  }, []);

  // Capture a short selection made inside the passage.
  useEffect(() => {
    function onUp(e: MouseEvent) {
      if (cardRef.current && e.target instanceof Node && cardRef.current.contains(e.target)) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
      const text = selection.toString().trim().replace(/\s+/g, " ");
      if (!text) return;
      // Only single words / short phrases — not whole sentences.
      if (text.length > 60 || text.split(" ").length > 5) return;
      const container = getContainer();
      if (!container || !selection.anchorNode || !container.contains(selection.anchorNode)) return;

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      reqIdRef.current++; // invalidate any lookup still running for the previous word
      setSel({
        word: text,
        sentence: sentenceAround(contextText, text),
        x: rect.left + rect.width / 2,
        yBottom: rect.bottom,
        yTop: rect.top,
      });
      setResult(null);
      setError(null);
      setSave("idle");
    }
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [getContainer, contextText]);

  // Close on Escape, or on a click/tap outside the card. A mousedown that starts a
  // NEW selection in the passage also lands here and closes — the following mouseup
  // re-opens the card on the new word, so this never fights word-to-word lookups.
  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: MouseEvent) => {
      if (cardRef.current && e.target instanceof Node && cardRef.current.contains(e.target)) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [sel, close]);

  const translate = useCallback(
    async (word: string, sentence: string, lang: string) => {
      const chosen = lang.trim();
      if (!chosen) {
        setError("Choose a language first.");
        return;
      }
      try {
        window.localStorage.setItem(LANG_KEY, chosen);
      } catch {
        /* ignore */
      }
      const myId = ++reqIdRef.current;
      setLoading(true);
      setError(null);
      setResult(null);
      setSave("idle");
      try {
        const res = await fetch("/api/vocabulary/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word, context: sentence, language: chosen }),
        });
        const body = (await res.json().catch(() => ({}))) as Partial<LookupResult> & { message?: string };
        if (myId !== reqIdRef.current) return; // a newer lookup (or a close) superseded this reply
        if (res.ok && body.translation) {
          setResult({
            translation: body.translation,
            part_of_speech: body.part_of_speech ?? "",
            definition: body.definition ?? "",
            example: body.example ?? "",
          });
        } else {
          setError(body.message ?? "Couldn't translate that — try again.");
        }
      } catch {
        if (myId === reqIdRef.current) setError("Network error — try again.");
      } finally {
        if (myId === reqIdRef.current) setLoading(false);
      }
    },
    [],
  );

  // When a new word is selected and we already know the language, look it up at once.
  useEffect(() => {
    if (sel && language.trim()) void translate(sel.word, sel.sentence, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const addToList = useCallback(async () => {
    if (!sel || !result) return;
    setSave("saving");
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: sel.word,
          language,
          translation: result.translation,
          definition: result.definition,
          example: result.example,
          context: sel.sentence,
          source,
        }),
      });
      setSave(res.ok ? "saved" : "error");
    } catch {
      setSave("error");
    }
  }, [sel, result, language, source]);

  if (!sel) return null;

  // Position: a ~300px card, kept inside the viewport, below the selection when
  // there's room and above it otherwise.
  const W = 300;
  const left = Math.max(12, Math.min(sel.x - W / 2, window.innerWidth - W - 12));
  const below = sel.yBottom + 320 < window.innerHeight;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label={`Look up “${sel.word}”`}
      style={{
        position: "fixed",
        left,
        top: below ? sel.yBottom + 10 : undefined,
        bottom: below ? undefined : window.innerHeight - sel.yTop + 10,
        width: W,
        zIndex: 50,
        background: "#fff",
        border: "1px solid #E7E4D6",
        borderRadius: 14,
        boxShadow: "0 24px 60px -22px rgba(26,33,56,.55)",
        fontFamily: SANS,
        color: INK,
        animation: "lp-fadeup .14s ease both",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, padding: "12px 14px 8px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2, wordBreak: "break-word" }}>{sel.word}</div>
          {result?.part_of_speech ? (
            <div style={{ fontSize: 11.5, color: MUTED, fontStyle: "italic", marginTop: 2 }}>{result.part_of_speech}</div>
          ) : null}
        </div>
        <button type="button" onClick={close} aria-label="Close" style={{ flex: "none", background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      {/* Language picker — any language; remembers the last choice. */}
      <div style={{ display: "flex", gap: 6, padding: "0 14px 10px" }}>
        <input
          list="vocab-langs"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void translate(sel.word, sel.sentence, language); }}
          placeholder="Language…"
          aria-label="Translate to language"
          style={{ flex: 1, minWidth: 0, padding: "7px 10px", border: "1px solid #DAD8C9", borderRadius: 9, fontFamily: SANS, fontSize: 13, color: INK, background: "#fff" }}
        />
        <datalist id="vocab-langs">
          {COMMON_LANGUAGES.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={() => void translate(sel.word, sel.sentence, language)}
          disabled={loading || !language.trim()}
          style={{ flex: "none", padding: "7px 12px", borderRadius: 9, border: "none", background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 13, cursor: loading || !language.trim() ? "default" : "pointer", opacity: loading || !language.trim() ? 0.55 : 1 }}
        >
          {loading ? <Loader2 size={14} style={{ animation: "lp-spin .7s linear infinite" }} /> : "Translate"}
        </button>
      </div>

      {/* Result */}
      <div style={{ padding: "0 14px 12px" }}>
        {error ? (
          <p style={{ fontSize: 12.5, color: "#c2410c", margin: 0 }}>{error}</p>
        ) : loading && !result ? (
          <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>Translating…</p>
        ) : result ? (
          <div style={{ borderTop: "1px solid #F0EEE3", paddingTop: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: INDIGO, lineHeight: 1.25, wordBreak: "break-word" }}>{result.translation}</div>
            {result.definition ? <p style={{ fontSize: 13, color: "#3A3650", margin: "6px 0 0", lineHeight: 1.5 }}>{result.definition}</p> : null}
            {result.example ? <p style={{ fontSize: 12.5, color: MUTED, fontStyle: "italic", margin: "6px 0 0", lineHeight: 1.5 }}>“{result.example}”</p> : null}

            <button
              type="button"
              onClick={() => void addToList()}
              disabled={save === "saving" || save === "saved"}
              style={{
                marginTop: 11,
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "9px 12px",
                borderRadius: 10,
                border: `1.5px solid ${save === "saved" ? EMERALD : "#E1DFF7"}`,
                background: save === "saved" ? "#EBF7F0" : "#F4F3FC",
                color: save === "saved" ? EMERALD : INDIGO,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13.5,
                cursor: save === "saving" || save === "saved" ? "default" : "pointer",
              }}
            >
              {save === "saved" ? (
                <><Check size={15} /> Added to vocabulary</>
              ) : save === "saving" ? (
                "Adding…"
              ) : save === "error" ? (
                "Couldn't save — retry"
              ) : (
                <><Plus size={15} /> Add to vocabulary</>
              )}
            </button>
          </div>
        ) : (
          <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>Pick a language to see the translation.</p>
        )}
      </div>
    </div>
  );
}

/** Pull the sentence containing `word` out of `text` (best-effort, for sense
 *  disambiguation + storing context). Falls back to a window around the word. */
function sentenceAround(text: string, word: string): string {
  if (!text) return "";
  const idx = text.toLowerCase().indexOf(word.toLowerCase());
  if (idx === -1) return "";
  let start = idx;
  while (start > 0 && !".!?\n".includes(text[start - 1])) start--;
  let end = idx + word.length;
  while (end < text.length && !".!?\n".includes(text[end])) end++;
  return text.slice(start, end + 1).trim().slice(0, 400);
}
