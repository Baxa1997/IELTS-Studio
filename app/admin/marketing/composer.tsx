"use client";

import { useMemo, useRef, useState, useTransition } from "react";

import { Card, CardHead, INK, LINE, MUTED, SANS, TONE } from "@/components/admin/ui";
import type { Recipient, Segment } from "@/lib/marketing/audience";
import type { BroadcastLink } from "@/lib/marketing/render";
import { INDIGO_FILL, ON_INDIGO, PANEL, WELL } from "@/lib/theme/tokens";

import { composeBroadcast, drainBroadcast, uploadAssets } from "./actions";

/**
 * Writing and sending one broadcast.
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
 */

type Progress = { sent: number; failed: number; remaining: number; running: boolean; done: boolean };

const SEGMENTS: { id: Segment; label: string; hint: string }[] = [
  { id: "learners", label: "Solo learners", hint: "Personal accounts — the people who choose their own practice" },
  { id: "staff", label: "Centre staff", hint: "Centre admins, administrators and teachers" },
  { id: "everyone", label: "Everyone", hint: "Every account with a working address" },
];

export function Composer({
  learners,
  staff,
  everyone,
  uploadsEnabled,
}: {
  learners: Recipient[];
  staff: Recipient[];
  everyone: Recipient[];
  uploadsEnabled: boolean;
}) {
  const [segment, setSegment] = useState<Segment>("learners");
  const pool = segment === "learners" ? learners : segment === "staff" ? staff : everyone;

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [links, setLinks] = useState<BroadcastLink[]>([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

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
  const optedOutCount = pool.filter((r) => r.optedOut).length;

  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addLink() {
    const url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError("A link has to start with http:// or https://");
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

  /** Queue, then drain until nothing is left. */
  async function send() {
    setError(null);
    setNotice(null);
    setConfirming(false);

    const form = new FormData();
    form.set("subject", subject);
    form.set("body", body);
    form.set("links", JSON.stringify(links));
    form.set("profile_ids", selected.map((r) => r.profileId).join(","));

    const queued = await composeBroadcast({}, form);
    if (queued.error || !queued.broadcastId) {
      setError(queued.error ?? "Couldn't queue that.");
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
        setError(step.error);
        setProgress({ sent, failed, remaining: 0, running: false, done: false });
        return;
      }
      sent += step.sent;
      failed += step.failed;
      setProgress({ sent, failed, remaining: step.remaining, running: !step.done, done: step.done });
      if (step.done) {
        setNotice(
          failed > 0
            ? `Finished — ${sent} delivered, ${failed} failed. Open the history below for the reasons.`
            : `Finished — ${sent} delivered.`,
        );
        setBroadcastId(null);
        return;
      }
    }
    setError("Stopped after too many rounds — reopen the page and resume.");
    setProgress({ sent, failed, remaining: 0, running: false, done: false });
  }

  const busy = progress?.running === true;
  const canSend = subject.trim().length >= 3 && body.trim().length >= 10 && selected.length > 0;

  return (
    <Card>
      <CardHead
        title="New broadcast"
        note="Written as plain text and sent as both plain text and simple HTML — a bulk email with no text part is one of the loudest spam signals there is."
      />

      {/* ── who ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "4px 0 12px" }}>
        {SEGMENTS.map((s) => {
          const on = segment === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSegment(s.id);
                setExcluded(new Set());
              }}
              disabled={busy}
              title={s.hint}
              style={{
                fontFamily: SANS,
                fontSize: 13,
                padding: "7px 13px",
                borderRadius: 999,
                cursor: busy ? "default" : "pointer",
                border: `1px solid ${on ? INDIGO_FILL : LINE}`,
                background: on ? INDIGO_FILL : PANEL,
                color: on ? ON_INDIGO : INK,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, marginBottom: 10 }}>
        <strong style={{ color: INK }}>{selected.length}</strong> selected of {pool.length}
        {optedOutCount > 0 ? ` · ${optedOutCount} unsubscribed and cannot be selected` : ""}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search a name or address"
        disabled={busy}
        style={field}
      />

      <div style={{ display: "flex", gap: 10, margin: "8px 0 10px" }}>
        <button type="button" onClick={() => setExcluded(new Set())} disabled={busy} style={linkBtn}>
          Select all
        </button>
        <button
          type="button"
          onClick={() => setExcluded(new Set(pool.map((r) => r.profileId)))}
          disabled={busy}
          style={linkBtn}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          maxHeight: 220,
          overflowY: "auto",
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          background: PANEL,
          marginBottom: 16,
        }}
      >
        {visible.length === 0 ? (
          <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, padding: 14 }}>
            Nobody matches that.
          </div>
        ) : (
          visible.map((r) => (
            <label
              key={r.profileId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderBottom: `1px solid ${LINE}`,
                fontFamily: SANS,
                fontSize: 13,
                color: r.optedOut ? MUTED : INK,
                cursor: r.optedOut || busy ? "default" : "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={r.reachable && !excluded.has(r.profileId)}
                onChange={() => toggle(r.profileId)}
                disabled={r.optedOut || busy}
              />
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.name} <span style={{ color: MUTED }}>· {r.email}</span>
              </span>
              {r.optedOut ? <span style={{ fontSize: 11.5, color: MUTED }}>unsubscribed</span> : null}
            </label>
          ))
        )}
      </div>

      {/* ── what ── */}
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        disabled={busy}
        style={field}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write the message. A blank line starts a new paragraph."
        rows={8}
        disabled={busy}
        style={{ ...field, resize: "vertical", marginTop: 10, lineHeight: 1.55 }}
      />

      {/* ── links and files ── */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: INK, marginBottom: 8 }}>
          Links and files
        </div>

        {links.length > 0 ? (
          <div style={{ marginBottom: 10 }}>
            {links.map((l, i) => (
              <div
                key={`${l.url}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 10px",
                  background: WELL,
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  marginBottom: 6,
                  fontFamily: SANS,
                  fontSize: 12.5,
                }}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", color: INK }}>
                  {l.label} <span style={{ color: MUTED }}>· {l.url}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                  disabled={busy}
                  style={linkBtn}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Label (optional)"
            disabled={busy}
            style={{ ...field, flex: "1 1 160px", minWidth: 0 }}
          />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            disabled={busy}
            style={{ ...field, flex: "2 1 240px", minWidth: 0 }}
          />
          <button type="button" onClick={addLink} disabled={busy} style={secondaryBtn}>
            Add link
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <input
            ref={fileInput}
            type="file"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            disabled={busy || uploading || !uploadsEnabled}
            style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED }}
          />
          <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginTop: 6 }}>
            {uploading
              ? "Uploading…"
              : "Files are uploaded and sent as links, never as attachments — attachments on a bulk send hurt deliverability and hit size limits. 20 MB each."}
          </div>
        </div>
      </div>

      {/* ── send ── */}
      {error ? <Banner tone="red">{error}</Banner> : null}
      {notice ? <Banner tone="green">{notice}</Banner> : null}

      {progress ? (
        <div style={{ fontFamily: SANS, fontSize: 13, color: INK, margin: "14px 0 0" }}>
          {progress.running ? "Sending… " : "Stopped. "}
          {progress.sent} delivered
          {progress.failed > 0 ? `, ${progress.failed} failed` : ""}
          {progress.remaining > 0 ? `, ${progress.remaining} to go` : ""}
          {progress.running ? (
            <span style={{ color: MUTED }}> — keep this tab open until it finishes.</span>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!canSend || busy}
            style={{ ...primaryBtn, opacity: !canSend || busy ? 0.5 : 1 }}
          >
            Send to {selected.length}
          </button>
        ) : (
          <>
            <span style={{ fontFamily: SANS, fontSize: 13, color: INK }}>
              Email {selected.length} {selected.length === 1 ? "person" : "people"}. This cannot be
              undone.
            </span>
            <button type="button" onClick={send} style={primaryBtn}>
              Yes, send
            </button>
            <button type="button" onClick={() => setConfirming(false)} style={linkBtn}>
              Cancel
            </button>
          </>
        )}

        {broadcastId && !busy ? (
          <button
            type="button"
            onClick={() => drain(broadcastId, { sent: progress?.sent ?? 0, failed: progress?.failed ?? 0, remaining: progress?.remaining ?? 0 })}
            style={secondaryBtn}
          >
            Resume
          </button>
        ) : null}
      </div>
    </Card>
  );
}

function Banner({ tone, children }: { tone: "red" | "green"; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 13,
        lineHeight: 1.5,
        color: t.ink,
        background: t.tint,
        border: `1px solid ${t.border}`,
        borderRadius: 9,
        padding: "10px 12px",
        marginTop: 14,
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
};

const primaryBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13.5,
  fontWeight: 500,
  padding: "9px 16px",
  borderRadius: 9,
  border: `1px solid ${INDIGO_FILL}`,
  background: INDIGO_FILL,
  color: ON_INDIGO,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  padding: "9px 14px",
  borderRadius: 9,
  border: `1px solid ${LINE}`,
  background: PANEL,
  color: INK,
  cursor: "pointer",
};

const linkBtn: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 12.5,
  padding: 0,
  border: "none",
  background: "none",
  color: MUTED,
  cursor: "pointer",
  textDecoration: "underline",
};
