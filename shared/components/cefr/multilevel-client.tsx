"use client";

import { useState } from "react";

import { callEngine } from "./api";
import { Hub } from "./hub";
import { ReadingRunner } from "./reading-runner";
import type {
  ReadingItem,
  ReadingMode,
  ReadingPaper,
  ReadingReq,
  Tab,
  WritingPaper,
  WritingReq,
} from "./types";
import { WritingRunner } from "./writing-runner";

/**
 * Multilevel (DTM) runner. Generation + grading live on the AI engine; the browser
 * calls them directly (with the user's Supabase token) so the ~30–60s generation
 * runs off Vercel's serverless cap. Generate returns an answer-STRIPPED render view
 * + an item id; we collect answers and grade by id (answers never leave the server
 * until grading). One client, two papers: Reading (5 parts / 35 Q, deterministic
 * grade) and Writing (3 tasks, LLM rubric).
 */

// ---- Top-level -------------------------------------------------------------

type View =
  | { kind: "reading"; paper: ReadingPaper; req: ReadingReq; mode: ReadingMode }
  | { kind: "writing"; paper: WritingPaper; req: WritingReq };

export function MultilevelClient() {
  const [tab, setTab] = useState<Tab>("reading");
  const [view, setView] = useState<View | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // the card key currently generating
  const [error, setError] = useState<string | null>(null);

  async function startReading(req: ReadingReq, key: string, mode: ReadingMode) {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      const paper = await callEngine<ReadingPaper>("reading/generate", req);
      setView({ kind: "reading", paper, req, mode });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(null);
    }
  }

  async function startWriting(req: WritingReq, key: string) {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      const paper = await callEngine<WritingPaper>("writing/generate", req);
      setView({ kind: "writing", paper, req });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(null);
    }
  }

  // Re-open a previously generated paper (no regeneration) via the render endpoint.
  async function openReadingItem(item: ReadingItem) {
    if (busy) return;
    setBusy(`item-${item.id}`);
    setError(null);
    try {
      const paper = await callEngine<ReadingPaper>("reading/render", { item_id: item.id });
      const req: ReadingReq =
        item.scope === "part" && item.parts[0]
          ? { scope: "part", part: item.parts[0] }
          : { scope: "full" };
      setView({ kind: "reading", paper, req, mode: req.scope === "part" ? "part" : "full" });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t reopen this paper.");
    } finally {
      setBusy(null);
    }
  }

  if (view?.kind === "reading") {
    return (
      <ReadingRunner
        key={view.paper.id}
        paper={view.paper}
        mode={view.mode}
        regenBusy={!!busy}
        onNew={() => void startReading(view.req, "new", view.mode)}
        onExit={() => setView(null)}
      />
    );
  }
  if (view?.kind === "writing") {
    return (
      <WritingRunner
        key={view.paper.id}
        paper={view.paper}
        regenBusy={!!busy}
        onNew={() => void startWriting(view.req, "new")}
        onExit={() => setView(null)}
      />
    );
  }

  return (
    <Hub
      tab={tab}
      onTab={setTab}
      busy={busy}
      error={error}
      onReading={(req, key, mode) => void startReading(req, key, mode)}
      onWriting={(req, key) => void startWriting(req, key)}
      onOpenItem={(item) => void openReadingItem(item)}
    />
  );
}
