"use client";

import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { EditorBanner, EditorSection } from "@/app/admin/_components/editor-chrome";
import { Bar, Empty, FAINT, Identity, INK, LINE, MUTED, Pill, RULE, SANS, SERIF } from "@/app/admin/_components/ui";
import type { Recipient, Segment } from "@/lib/marketing/audience";
import type { BroadcastLink } from "@/lib/marketing/render";
import {
  INDIGO_CONSOLE,
  INDIGO_FILL,
  ON_INDIGO,
  PANEL,
  SOFT_RULE,
  SUBTLE_BG,
  TINT,
  TRACK,
} from "@/lib/theme/tokens";

import { composeBroadcast, drainBroadcast, sendTestEmail, uploadAssets } from "../actions";
import { editorProblems, EmailRichText, useEmailEditor } from "./email-editor";

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
 */

type Progress = { sent: number; failed: number; remaining: number; running: boolean; done: boolean };

const SEGMENTS: { id: Segment; label: string; hint: string }[] = [
  {
    id: "learners",
    label: "Solo learners",
    hint: "Personal accounts — the people who choose their own practice",
  },
  { id: "staff", label: "Centre staff", hint: "Centre admins, administrators and teachers" },
  { id: "everyone", label: "Everyone", hint: "Every account with a working address" },
];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";

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
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [uploading, startUpload] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEmailEditor(setHtml);

  /* Selection is held as "everyone reachable in this segment, minus the ones
     turned off". Storing the exclusions rather than the inclusions means
     switching segment keeps the obvious meaning — the default is always
     everybody — without having to re-tick a hundred boxes. */
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return pool;
    return pool.filter(
      (r) => r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle),
    );
  }, [pool, search]);

  const selected = useMemo(
    () => pool.filter((r) => r.reachable && !excluded.has(r.profileId)),
    [pool, excluded],
  );
  const optedOut = pool.filter((r) => r.optedOut).length;

  const busy = progress?.running === true;
  const written = html !== "";
  const canSend = subject.trim().length >= 3 && written && selected.length > 0;
  const allShown = visible.length > 0 && visible.every((r) => !r.reachable || !excluded.has(r.profileId));

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

  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function fail(message: string) {
    setNotice(null);
    setError(message);
  }

  function addLink() {
    const url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      fail("A link has to start with http:// or https://");
      return;
    }
    setLinks((prev) => [...prev, { label: linkLabel.trim() || url, url }]);
    setLinkLabel("");
    setLinkUrl("");
    setError(null);
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const form = new FormData();
    for (const file of Array.from(files)) form.append("files", file);
    setError(null);
    startUpload(async () => {
      const result = await uploadAssets({}, form);
      if (result.links?.length) setLinks((prev) => [...prev, ...result.links!]);
      if (result.error) setError(result.error);
      if (fileInput.current) fileInput.current.value = "";
    });
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
      {/* Status and actions, pinned to the top so sending is never a long way
          from the message being sent. */}
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
        <span style={{ fontSize: 14, fontWeight: 600, color: INK, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subject.trim() || "Untitled email"}
        </span>
        <Pill tone={busy ? "amber" : progress?.done ? "green" : "neutral"}>
          {busy ? "Sending" : progress?.done ? "Sent" : "Not sent"}
        </Pill>
        <span style={{ fontSize: 12.5, color: MUTED }}>
          {selected.length} {selected.length === 1 ? "recipient" : "recipients"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={sendTest}
            disabled={testing || busy || !written}
            title={testAddress ? `Sends to ${testAddress} only` : undefined}
            style={{ ...secondaryBtn, opacity: testing || busy || !written ? 0.5 : 1 }}
          >
            <Send size={15} /> {testing ? "Sending test…" : "Send test to me"}
          </button>
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!canSend || busy}
              style={{ ...primaryBtn, opacity: !canSend || busy ? 0.45 : 1 }}
            >
              Send to {selected.length}
            </button>
          ) : (
            <>
              <span style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>
                Email {selected.length} {selected.length === 1 ? "person" : "people"}? This cannot be undone.
              </span>
              <button type="button" onClick={send} style={primaryBtn}>
                Yes, send now
              </button>
              <button type="button" onClick={() => setConfirming(false)} style={ghostBtn}>
                Cancel
              </button>
            </>
          )}
          {broadcastId && !busy ? (
            <button
              type="button"
              onClick={() =>
                drain(broadcastId, {
                  sent: progress?.sent ?? 0,
                  failed: progress?.failed ?? 0,
                  remaining: progress?.remaining ?? 0,
                })
              }
              style={secondaryBtn}
            >
              Resume
            </button>
          ) : null}
        </div>
      </div>

      {error ? <EditorBanner tone="red">{error}</EditorBanner> : null}
      {notice ? <EditorBanner tone="green">{notice}</EditorBanner> : null}

      {progress ? (
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, background: PANEL, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: INK, marginBottom: 7 }}>
            <span>
              {progress.running ? "Sending…" : progress.done ? "Sent." : "Stopped."} {progress.sent} delivered
              {progress.failed > 0 ? `, ${progress.failed} failed` : ""}
            </span>
            <span style={{ color: MUTED }}>{progress.remaining} to go</span>
          </div>
          <Bar
            width={`${Math.round(
              (progress.sent / Math.max(1, progress.sent + progress.failed + progress.remaining)) * 100,
            )}%`}
            fill={INDIGO_CONSOLE}
            track={TRACK}
          />
          {progress.running ? (
            <div style={{ fontSize: 12, color: FAINT, marginTop: 7 }}>
              Keep this tab open — closing it pauses the send, and Resume finishes it.
            </div>
          ) : null}
        </div>
      ) : null}

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

          <EditorSection
            title={`Links and files${links.length ? ` · ${links.length}` : ""}`}
            note="Listed under the message. Files are uploaded and sent as links, never as attachments — attachments on a bulk send hurt deliverability and hit size limits. 20 MB each."
          >
            {links.length === 0 ? (
              <Empty>Nothing attached yet.</Empty>
            ) : (
              <div>
                {links.map((l, i) => (
                  <div
                    key={`${l.url}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 4px",
                      borderBottom: `1px solid ${SOFT_RULE}`,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: INK, fontWeight: 500, ...clipStyle }}>{l.label}</div>
                      <div style={{ fontSize: 11.5, color: FAINT, ...clipStyle }}>{l.url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                      disabled={busy}
                      style={ghostBtn}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Label (optional)"
                disabled={busy}
                style={{ ...field, flex: "1 1 150px", minWidth: 0 }}
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                disabled={busy}
                style={{ ...field, flex: "2 1 230px", minWidth: 0 }}
              />
              <button type="button" onClick={addLink} disabled={busy} style={secondaryBtn}>
                Add link
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                disabled={busy || uploading || !uploadsEnabled}
                onClick={() => fileInput.current?.click()}
                style={{ ...secondaryBtn, opacity: uploadsEnabled ? 1 : 0.5 }}
              >
                {uploading ? "Uploading…" : "Upload files"}
              </button>
              <input ref={fileInput} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
              <span style={{ fontSize: 12, color: FAINT }}>PDF, image, video or Office document</span>
            </div>
          </EditorSection>
        </div>

        {/* ── right: who it goes to, and a look before it does ──────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <EditorSection
            title="Audience"
            note="Anyone who has unsubscribed is listed but cannot be selected — the count is what will actually be mailed."
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SEGMENTS.map((s) => {
                const on = segment === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    title={s.hint}
                    disabled={busy}
                    onClick={() => {
                      setSegment(s.id);
                      setExcluded(new Set());
                    }}
                    style={{
                      fontFamily: SANS,
                      fontSize: 12.5,
                      fontWeight: on ? 600 : 500,
                      padding: "6px 12px",
                      borderRadius: 999,
                      cursor: busy ? "default" : "pointer",
                      border: `1px solid ${on ? INDIGO_FILL : LINE}`,
                      background: on ? INDIGO_FILL : PANEL,
                      color: on ? ON_INDIGO : MUTED,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: 13, color: MUTED }}>
              <strong style={{ color: INK }}>{selected.length}</strong> of {pool.length} selected
              {optedOut > 0 ? ` · ${optedOut} unsubscribed` : ""}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a name or address"
                disabled={busy}
                style={{ ...field, flex: 1, minWidth: 0 }}
              />
              <button
                type="button"
                disabled={busy || visible.length === 0}
                onClick={() =>
                  setExcluded((prev) => {
                    const next = new Set(prev);
                    for (const r of visible) {
                      if (!r.reachable) continue;
                      if (allShown) next.add(r.profileId);
                      else next.delete(r.profileId);
                    }
                    return next;
                  })
                }
                style={ghostBtn}
              >
                {allShown ? "Clear" : "Select"}
              </button>
            </div>

            <div style={{ border: `1px solid ${LINE}`, borderRadius: 11, overflow: "hidden", background: PANEL }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: SUBTLE_BG,
                  borderBottom: `1px solid ${RULE}`,
                  fontSize: 11,
                  letterSpacing: ".07em",
                  fontWeight: 600,
                  color: FAINT,
                  textTransform: "uppercase",
                }}
              >
                <span>Recipient</span>
                <span>{visible.length} shown</span>
              </div>

              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {visible.length === 0 ? (
                  <Empty>Nobody matches that.</Empty>
                ) : (
                  visible.map((r) => {
                    const on = r.reachable && !excluded.has(r.profileId);
                    return (
                      <label
                        key={r.profileId}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "22px minmax(0, 1fr) auto",
                          alignItems: "center",
                          columnGap: 10,
                          padding: "8px 12px",
                          borderBottom: `1px solid ${SOFT_RULE}`,
                          cursor: r.optedOut || busy ? "default" : "pointer",
                          opacity: r.optedOut ? 0.55 : 1,
                          background: on ? "transparent" : TINT.neutral.bg,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(r.profileId)}
                          disabled={r.optedOut || busy}
                          style={{ width: 15, height: 15, accentColor: INDIGO_CONSOLE, cursor: "inherit" }}
                        />
                        <Identity
                          glyph={initials(r.name)}
                          name={r.name}
                          meta={r.email}
                          tone={r.optedOut ? "neutral" : "indigo"}
                          round
                        />
                        {r.optedOut ? <Pill tone="neutral">unsubscribed</Pill> : null}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </EditorSection>

          <EditorSection
            title="Before you send"
            note="The test is the real email — same design, same links — with [Test] in the subject. Nothing is queued or recorded."
          >
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
              It goes to <strong style={{ color: INK }}>{testAddress ?? "your account’s address"}</strong> and to nobody else.
            </div>
            <button
              type="button"
              onClick={sendTest}
              disabled={testing || busy || !written}
              style={{ ...secondaryBtn, justifyContent: "center", opacity: testing || busy || !written ? 0.5 : 1 }}
            >
              <Send size={15} /> {testing ? "Sending test…" : "Send test to me"}
            </button>
          </EditorSection>
        </div>
      </div>
    </div>
  );
}

const clipStyle: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

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
};

const primaryBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13.5,
  fontWeight: 600,
  padding: "8px 18px",
  borderRadius: 10,
  border: `1px solid ${INDIGO_FILL}`,
  background: INDIGO_FILL,
  color: ON_INDIGO,
  cursor: "pointer",
};

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
};

const ghostBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 12.5,
  padding: "7px 11px",
  border: "none",
  borderRadius: 8,
  background: "transparent",
  color: MUTED,
  cursor: "pointer",
};
