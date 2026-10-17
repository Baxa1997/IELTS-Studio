"use client";

import { useEffect, useMemo, useState } from "react";

import { EditorBanner, EditorSection } from "@/app/admin/_components/editor-chrome";
import { FAINT, INK, LINE, MUTED, SANS, SERIF } from "@/app/admin/_components/ui";
import type { Recipient, Segment } from "@/lib/marketing/audience";
import type { BroadcastLink } from "@/lib/marketing/render";
import { PANEL } from "@/lib/theme/tokens";

import { composeBroadcast, drainBroadcast, sendTestEmail } from "../actions";
import { AudiencePanel } from "./audience-panel";
import { bare } from "./composer-styles";
import { editorProblems, EmailRichText, useEmailEditor } from "./email-editor";
import { LinksSection } from "./links-section";
import { SendBar, SendProgress, TestButton, type Progress } from "./send-status";

/**
 * Writing and sending one broadcast.
 *
 * LAID OUT LIKE THE BLOG EDITOR (owner's call, 2026-10-17): the actions pinned
 * to the top, the message on the left — the subject as its title, the rich
 * body, the files that ride along — and who it goes to on the right. The body
 * is the editor's HTML; the server cleans it, stores it, and styles it for the
 * inbox (lib/marketing/email-html.ts). "Send test to me" mails exactly that to
 * the signed-in admin and to nobody else.
 *
 * ⚠️ THE SEND IS A LOOP THE BROWSER DRIVES, and that is not a shortcut. ~180
 * SMTP round trips do not fit in one serverless invocation, so the server
 * queues every recipient first and this calls `drainBroadcast` until nothing is
 * queued. Two consequences worth knowing before "simplifying" it: closing the
 * tab STOPS the send (the queue survives — reopening the page and pressing
 * Resume finishes it), and the progress below is real rather than a spinner,
 * because each round returns what it actually sent.
 *
 * The recipient list carries IDS ONLY. Addresses are re-resolved server-side in
 * `createBroadcast` — if this form could name an address, the action behind it
 * would be an open relay wearing our domain.
 *
 * ⚠️ BUILT FROM THE ADMIN KIT (`ui.tsx`, `editor-chrome.tsx`), NOT FROM BARE
 * DIVS. The first version was a plain checkbox list with underlined text links,
 * and it read as a different product from every other /admin screen. Anything
 * here that is NOT from the kit — the checkbox column, the subject field — is a
 * shape the console did not have yet.
 *
 * THE PARTS ARE IN THEIR OWN FILES (2026-10-17): the bar and the progress in
 * `send-status.tsx`, the attachments in `links-section.tsx`, the recipients in
 * `audience-panel.tsx`. What stays here is everything a send depends on — the
 * message, the selection, and the loop that drains the queue.
 */

export function Composer({
  learners,
  staff,
  everyone,
  uploadsEnabled,
  testAddress,
}: {
  learners: Recipient[];
  staff: Recipient[];
  everyone: Recipient[];
  uploadsEnabled: boolean;
  /** Where "Send test to me" goes: the signed-in admin's own address. */
  testAddress: string | null;
}) {
  const [segment, setSegment] = useState<Segment>("learners");
  const pool = segment === "learners" ? learners : segment === "staff" ? staff : everyone;

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [links, setLinks] = useState<BroadcastLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const editor = useEmailEditor(setHtml);

  /* Selection is held as "everyone reachable in this segment, minus the ones
     turned off" — see AudiencePanel for why the exclusions are what is stored. */
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const selected = useMemo(
    () => pool.filter((r) => r.reachable && !excluded.has(r.profileId)),
    [pool, excluded],
  );

  const busy = progress?.running === true;
  const written = html !== "";
  const canSend = subject.trim().length >= 3 && written && selected.length > 0;

  // Frozen while it sends: the queued copy is what goes out, not the editor's.
  useEffect(() => {
    editor?.setEditable(!busy);
  }, [editor, busy]);

  /* A written message that has not gone yet — or a send in progress, which a
     closed tab pauses — is worth one "are you sure" before the page goes. */
  const atRisk = busy || ((subject.trim() !== "" || written) && !progress?.done);
  useEffect(() => {
    if (!atRisk) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [atRisk]);

  function fail(message: string) {
    setNotice(null);
    setError(message);
  }

  /** The message as the server takes it — the same three fields for a test and a send. */
  function messageForm(): FormData | null {
    const problems = editorProblems(editor);
    if (problems.length) {
      fail(problems.join(" "));
      return null;
    }
    const form = new FormData();
    form.set("subject", subject);
    form.set("body", html);
    form.set("links", JSON.stringify(links));
    return form;
  }

  async function sendTest() {
    setError(null);
    setNotice(null);
    const form = messageForm();
    if (!form) return;
    setTesting(true);
    const result = await sendTestEmail({}, form);
    setTesting(false);
    if (result.error) fail(result.error);
    else setNotice(`${result.notice ?? "Test sent."} Check it on your phone too — most learners will read it there.`);
  }

  async function send() {
    setError(null);
    setNotice(null);
    setConfirming(false);

    const form = messageForm();
    if (!form) return;
    form.set("profile_ids", selected.map((r) => r.profileId).join(","));

    const queued = await composeBroadcast({}, form);
    if (queued.error || !queued.broadcastId) {
      fail(queued.error ?? "Couldn't queue that.");
      return;
    }
    setBroadcastId(queued.broadcastId);
    await drain(queued.broadcastId, { sent: 0, failed: 0, remaining: queued.queued ?? 0 });
  }

  async function drain(id: string, from: { sent: number; failed: number; remaining: number }) {
    let sent = from.sent;
    let failed = from.failed;
    setProgress({ ...from, running: true, done: false });

    // Bounded rather than `while (true)`: a server that kept returning "not
    // done" without progress would otherwise loop forever in the browser.
    for (let round = 0; round < 500; round++) {
      const step = await drainBroadcast(id);
      if (step.error) {
        fail(step.error);
        setProgress({ sent, failed, remaining: 0, running: false, done: false });
        return;
      }
      sent += step.sent;
      failed += step.failed;
      setProgress({ sent, failed, remaining: step.remaining, running: !step.done, done: step.done });
      if (step.done) {
        setNotice(
          failed > 0
            ? `Finished — ${sent} delivered, ${failed} failed. The history below has the reasons.`
            : `Finished — ${sent} delivered.`,
        );
        setBroadcastId(null);
        return;
      }
    }
    fail("Stopped after too many rounds — reopen the page and resume.");
    setProgress({ sent, failed, remaining: 0, running: false, done: false });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: SANS }}>
      <SendBar
        subject={subject}
        progress={progress}
        recipients={selected.length}
        testAddress={testAddress}
        testing={testing}
        canTest={!(testing || busy || !written)}
        canSend={canSend}
        confirming={confirming}
        onTest={sendTest}
        onConfirm={() => setConfirming(true)}
        onCancel={() => setConfirming(false)}
        onSend={send}
        onResume={
          broadcastId
            ? () =>
                drain(broadcastId, {
                  sent: progress?.sent ?? 0,
                  failed: progress?.failed ?? 0,
                  remaining: progress?.remaining ?? 0,
                })
            : null
        }
      />

      {error ? <EditorBanner tone="red">{error}</EditorBanner> : null}
      {notice ? <EditorBanner tone="green">{notice}</EditorBanner> : null}
      {progress ? <SendProgress progress={progress} /> : null}

      {/* `sa-split` stacks the columns below a laptop width (globals.css). */}
      <div className="sa-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 16, alignItems: "start" }}>
        {/* ── left: the message ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL, padding: "18px 24px" }}>
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value.replace(/\n/g, " "))}
              placeholder="Subject"
              rows={1}
              aria-label="Subject"
              disabled={busy}
              style={{ ...bare, fontFamily: SERIF, fontSize: 28, lineHeight: 1.25, fontWeight: 600 }}
            />
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5, color: FAINT }}>
              The line an inbox shows. The message opens with “Hi” and the reader’s first name, and
              ends with a one-click unsubscribe — both are added for you.
            </p>
          </div>

          <EmailRichText editor={editor} onError={fail} />

          <LinksSection
            links={links}
            onLinks={setLinks}
            busy={busy}
            uploadsEnabled={uploadsEnabled}
            onError={(message) => (message === null ? setError(null) : fail(message))}
          />
        </div>

        {/* ── right: who it goes to, and a look before it does ──────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <AudiencePanel
            segment={segment}
            onSegment={(s) => {
              setSegment(s);
              setExcluded(new Set());
            }}
            pool={pool}
            excluded={excluded}
            onExcluded={setExcluded}
            selectedCount={selected.length}
            busy={busy}
          />

          <EditorSection
            title="Before you send"
            note="The test is the real email — same design, same links — with [Test] in the subject. Nothing is queued or recorded."
          >
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
              It goes to <strong style={{ color: INK }}>{testAddress ?? "your account’s address"}</strong> and to nobody else.
            </div>
            <TestButton testing={testing} disabled={testing || busy || !written} onClick={sendTest} wide />
          </EditorSection>
        </div>
      </div>
    </div>
  );
}
