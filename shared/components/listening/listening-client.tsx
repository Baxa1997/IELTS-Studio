"use client";

import { useT } from "@/shared/components/i18n/locale-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AttachForm, PracticeModal } from "@/shared/components/console/teacher-practice";
import { BRAND, INK, SANS } from "./theme";
import type { Catalogue, LibraryItem, MineItem, RenderView, Source } from "./types";
import { BRAND_FILL, PANEL, SLATE_BODY, SLATE_LINE, SLATE_MUTED, WHITE } from "@/lib/theme/tokens";

import { callEngine } from "./api";
import { Hub, type HubTab } from "./hub";
import { Runner } from "./runner";

/**
 * Listening hub + runner, backed by the SHARED practice library: practices are
 * pre-generated on the engine (script + narrator-framed TTS audio, difficulty
 * 1–5) and open instantly for every learner. Free plan unlocks 5 practices;
 * paid plans get the whole library (enforced server-side — the engine returns
 * 429 with an upgrade message past the limit). The runner plays the audio once
 * with countdown reading pauses (pause allowed for practice, no seeking),
 * grades by id server-side, and reveals the transcript + trap mechanisms.
 */

// ---- Top-level ---------------------------------------------------------------

export function ListeningClient({
  initialLibraryId,
  isTeacher = false,
  groups = [],
}: {
  initialLibraryId?: string;
  /** Teachers get the practice bench: a generated item lands as a card with
   *  Start and Attach, instead of dropping them straight into the runner. */
  isTeacher?: boolean;
  groups?: { id: string; name: string }[];
}) {
  // Opening a library practice writes its id into the URL. Two things need
  // that: a teacher's "set this to a class" control (server-rendered from the
  // query string), and a student following an assignment link straight to the
  // practice they were set.
  const router = useRouter();
  const [tab, setTab] = useState<HubTab>("tests");
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [mine, setMine] = useState<MineItem[] | null>(null);
  const [view, setView] = useState<RenderView | null>(null);
  const [source, setSource] = useState<Source>("library");
  const [busy, setBusy] = useState<string | null>(null); // library id | "mine:<id>" | "generate"
  // A teacher's freshly generated item, held here rather than opened. `libraryId`
  // fills in once it has been promoted, which is what makes it assignable.
  const [fresh, setFresh] = useState<RenderView | null>(null);
  const [attachId, setAttachId] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    callEngine<Catalogue>("library", {})
      .then((c) => {
        if (alive) setCatalogue(c);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the library.");
      });
    callEngine<{ items: MineItem[] }>("list", {})
      .then((r) => {
        if (alive) setMine(r.items ?? []);
      })
      .catch(() => {
        if (alive) setMine([]);
      });
    return () => {
      alive = false;
    };
  }, [view]); // refresh progress after exiting a practice

  const open = useCallback(
    async (item: LibraryItem) => {
      if (item.locked) {
        setError(
          "You’ve used all 5 free practice unlocks for Listening — upgrade to Pro to open the full library.",
        );
        return;
      }
      setBusy(item.id);
      setError(null);
      try {
        setSource("library");
        setView(await callEngine<RenderView>("library/render", { library_id: item.id }));
        router.replace(`/listen?item=${item.id}`, { scroll: false });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not open this practice.");
      } finally {
        setBusy(null);
      }
    },
    [router],
  );

  // /listen?item=<library id> — how an assignment deep-links to the exact
  // practice a class was set. Runs once; after that the hub behaves normally.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!initialLibraryId || autoOpened.current) return;
    autoOpened.current = true;
    let alive = true;
    setBusy(initialLibraryId);
    setSource("library");
    callEngine<RenderView>("library/render", { library_id: initialLibraryId })
      .then((v) => {
        if (alive) setView(v);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not open this practice.");
      })
      .finally(() => {
        if (alive) setBusy(null);
      });
    return () => {
      alive = false;
    };
  }, [initialLibraryId]);

  const openMine = useCallback(async (id: string) => {
    setBusy(`mine:${id}`);
    setError(null);
    try {
      setSource("mine");
      setView(await callEngine<RenderView>("render", { item_id: id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this practice.");
    } finally {
      setBusy(null);
    }
  }, []);

  /**
   * A whole 4-part test, on demand.
   *
   * The catalogue's full tests were all seeded offline months ago — there was
   * no way to ask for a fresh one, so a learner who had sat the six at their
   * level had nothing left. Same engine call the seeding scripts make, now
   * behind the same gate as the quick practice.
   *
   * ONE GENERATION, not four. Measured at ~2.4 minutes end to end: the four
   * parts compose in parallel, so 40 questions cost barely more wall-clock
   * than the slowest single part (139s of 143s). That is why this is a button
   * you wait on rather than a job you come back to — it is the same wait the
   * quick practice already asks for.
   */
  const composeTest = useCallback(
    async (difficulty: number) => {
      setBusy("compose");
      setError(null);
      try {
        setSource("mine");
        const v = await callEngine<RenderView>("compose", { difficulty });
        if (isTeacher) setFresh(v);
        else setView(v);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Generation failed — please try again.");
      } finally {
        setBusy(null);
      }
    },
    [isTeacher],
  );

  const generate = useCallback(
    async (difficulty: number) => {
      setBusy("generate");
      setError(null);
      try {
        setSource("mine");
        // No part is sent — the engine draws a random format, like the real exam.
        const v = await callEngine<RenderView>("generate", { difficulty });
        // A learner generated this to sit it, so open it. A teacher generated it
        // to look at and set, so it becomes a card instead.
        if (isTeacher) setFresh(v);
        else setView(v);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Generation failed — please try again.");
      } finally {
        setBusy(null);
      }
    },
    [isTeacher],
  );

  /**
   * Make a generated item assignable. It lives in `listening_items` (this org),
   * but an assignment references `listening_library` — so the engine clones it
   * into the center's own library first. See docs/engine-changes-2026-08-09.md;
   * until that endpoint ships this surfaces the engine's error rather than
   * pretending the attach worked.
   */
  const promoteThenAttach = useCallback(
    async (itemId: string) => {
      if (attaching) return;
      setAttaching(true);
      setError(null);
      try {
        const { library_id } = await callEngine<{ library_id: string }>("promote", {
          item_id: itemId,
        });
        setAttachId(library_id);
      } catch (e) {
        setError(
          e instanceof Error
            ? `Couldn't prepare this for a class: ${e.message}`
            : "Couldn't prepare this for a class.",
        );
      } finally {
        setAttaching(false);
      }
    },
    [attaching],
  );

  if (view) return <Runner view={view} source={source} onExit={() => setView(null)} />;
  return (
    <>
      {fresh ? (
        <FreshPractice
          view={fresh}
          canAttach={groups.length > 0}
          attaching={attaching}
          onStart={() => {
            setSource("mine");
            setView(fresh);
          }}
          onAttach={() => void promoteThenAttach(fresh.id)}
          onDismiss={() => setFresh(null)}
        />
      ) : null}
      {attachId ? (
        <PracticeModal title="Attach to a class" onClose={() => setAttachId(null)}>
          <AttachForm
            kind="listening"
            contentId={attachId}
            groups={groups}
            onDone={() => setAttachId(null)}
          />
        </PracticeModal>
      ) : null}
      <Hub
        tab={tab}
        setTab={setTab}
        catalogue={catalogue}
        mine={mine}
        busy={busy}
        error={error}
        onOpen={open}
        onOpenMine={openMine}
        onGenerate={generate}
        onComposeTest={composeTest}
        // A library item IS a listening_library row, so it can be assigned as
        // it stands. A generated one lives in listening_items and has to be
        // cloned into the center's library first — hence the two factories.
        attachLibrary={
          isTeacher
            ? (id) => ({ onAttach: () => setAttachId(id), disabled: groups.length === 0 })
            : undefined
        }
        attachMine={
          isTeacher
            ? (id) => ({
                onAttach: () => void promoteThenAttach(id),
                disabled: groups.length === 0 || attaching,
              })
            : undefined
        }
      />
    </>
  );
}

/** The teacher's just-generated item: read it, sit it, or set it to a class. */
function FreshPractice({
  view,
  canAttach,
  attaching,
  onStart,
  onAttach,
  onDismiss,
}: {
  view: RenderView;
  canAttach: boolean;
  attaching: boolean;
  onStart: () => void;
  onAttach: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  const parts = view.kind === "test" ? "Full test · 4 parts" : `Part ${view.part ?? "?"}`;
  return (
    <div style={{ padding: "20px 24px 0", fontFamily: SANS }}>
      <div
        style={{
          background: PANEL,
          border: `1px solid ${SLATE_LINE}`,
          borderRadius: 16,
          padding: 18,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 220, flex: 1 }}>
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: ".08em",
              fontWeight: 700,
              textTransform: "uppercase",
              color: BRAND,
            }}
          >
            Just generated
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: INK, margin: "4px 0 3px" }}>
            {view.topic || "Listening practice"}
          </div>
          <div style={{ fontSize: 13, color: SLATE_BODY }}>
            {parts}
            {view.difficulty ? ` · Level ${view.difficulty}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onStart}
            style={{
              background: PANEL,
              border: `1px solid ${SLATE_LINE}`,
              borderRadius: 10,
              padding: "10px 16px",
              fontFamily: SANS,
              fontSize: 13.5,
              fontWeight: 600,
              color: INK,
              cursor: "pointer",
            }}
          >
            Start
          </button>
          <button
            type="button"
            onClick={onAttach}
            disabled={!canAttach || attaching}
            title={canAttach ? undefined : "Create a class first"}
            style={{
              background: BRAND_FILL,
              color: WHITE,
              border: 0,
              borderRadius: 10,
              padding: "10px 16px",
              fontFamily: SANS,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: !canAttach || attaching ? "not-allowed" : "pointer",
              opacity: !canAttach || attaching ? 0.55 : 1,
            }}
          >
            {attaching ? t("listen.preparing") : t("card.attach")}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: 0,
              color: SLATE_MUTED,
              cursor: "pointer",
              fontSize: 18,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
