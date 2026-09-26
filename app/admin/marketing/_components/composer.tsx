"use client";

import { useMemo, useRef, useState, useTransition } from "react";

import {
  Bar,
  Card,
  CardHead,
  Empty,
  FAINT,
  Identity,
  INK,
  Kpi,
  KpiRow,
  LINE,
  MUTED,
  Pill,
  RULE,
  SANS,
  SERIF,
  TONE,
} from "@/app/admin/_components/ui";
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

import { composeBroadcast, drainBroadcast, uploadAssets } from "../actions";

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
 *
 * ⚠️ BUILT FROM app/admin/_components/ui, NOT FROM BARE DIVS. The first version was
 * a plain checkbox list with underlined text links, and it read as a different
 * product from every other /admin screen. The kit exists because the console
 * repeats about eight shapes; a ninth screen inventing its own is how the set
 * drifts. Anything here that is NOT from the kit — the checkbox column, the
 * composer fields — is a shape the console did not have yet.
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
  const optedOut = pool.filter((r) => r.optedOut).length;

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
            ? `Finished — ${sent} delivered, ${failed} failed. The history below has the reasons.`
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
  const allShown = visible.length > 0 && visible.every((r) => !r.reachable || !excluded.has(r.profileId));

  return (
    <>
      {/* ── what this send amounts to, before writing a word ── */}
      <KpiRow cols={3}>
        <Kpi
          label="Selected"
          value={selected.length}
          sub={`of ${pool.length} in this segment`}
          accent={INDIGO_CONSOLE}
        />
        <Kpi
          label="Unsubscribed"
          value={optedOut}
          sub={optedOut === 0 ? "nobody has opted out" : "excluded automatically"}
        />
        <Kpi
          label="Attached"
          value={links.length}
          sub={links.length === 1 ? "link in the message" : "links in the message"}
        />
      </KpiRow>

      {/* ── who ── */}
      <Card style={{ marginTop: 18 }}>
        <CardHead
          title="Audience"
          note="Anyone who has unsubscribed is listed and cannot be selected — the count above is what will actually be mailed."
          right={
            <div style={{ display: "flex", gap: 6 }}>
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
          }
        />

        <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "2px 0 12px" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a name or address"
            disabled={busy}
            style={{ ...field, flex: 1 }}
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
            {allShown ? "Clear these" : "Select these"}
          </button>
        </div>

        <div
          style={{
            border: `1px solid ${LINE}`,
            borderRadius: 11,
            overflow: "hidden",
            background: PANEL,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "34px 1fr auto",
              alignItems: "center",
              columnGap: 12,
              padding: "9px 14px",
              background: SUBTLE_BG,
              borderBottom: `1px solid ${RULE}`,
              fontSize: 11,
              letterSpacing: ".07em",
              fontWeight: 600,
              color: FAINT,
              textTransform: "uppercase",
            }}
          >
            <span />
            <span>Recipient</span>
            <span>{visible.length} shown</span>
          </div>

          <div style={{ maxHeight: 300, overflowY: "auto" }}>
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
                      gridTemplateColumns: "34px 1fr auto",
                      alignItems: "center",
                      columnGap: 12,
                      padding: "9px 14px",
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
      </Card>

      {/* ── what it says ── */}
      <Card style={{ marginTop: 18 }}>
        <CardHead
          title="Message"
          note="Sent as both plain text and simple HTML — a bulk email with no text part is one of the loudest spam signals there is."
        />
        <Label>Subject</Label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What is new, in a few words"
          disabled={busy}
          style={field}
        />
        <Label style={{ marginTop: 14 }}>Body</Label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the message. A blank line starts a new paragraph."
          rows={9}
          disabled={busy}
          style={{ ...field, resize: "vertical", lineHeight: 1.6 }}
        />
        <div style={{ fontFamily: SANS, fontSize: 12, color: FAINT, marginTop: 7 }}>
          Every recipient is greeted by first name, and every message carries a one-click
          unsubscribe link.
        </div>
      </Card>

      {/* ── what rides along ── */}
      <Card style={{ marginTop: 18 }}>
        <CardHead
          title="Links and files"
          note="Files are uploaded and sent as links, never as attachments — attachments on a bulk send hurt deliverability and hit size limits. 20 MB each."
        />

        {links.length === 0 ? (
          <Empty>Nothing attached yet.</Empty>
        ) : (
          <div style={{ marginBottom: 12 }}>
            {links.map((l, i) => (
              <div
                key={`${l.url}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderBottom: `1px solid ${SOFT_RULE}`,
                  fontFamily: SANS,
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

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            disabled={busy || uploading || !uploadsEnabled}
            onClick={() => fileInput.current?.click()}
            style={{ ...secondaryBtn, opacity: uploadsEnabled ? 1 : 0.5 }}
          >
            {uploading ? "Uploading…" : "Upload files"}
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>
            PDF, image, video or Office document
          </span>
        </div>
      </Card>

      {/* ── sending ── */}
      <Card style={{ marginTop: 18 }}>
        {error ? <Banner tone="red">{error}</Banner> : null}
        {notice ? <Banner tone="green">{notice}</Banner> : null}

        {progress ? (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: SANS,
                fontSize: 13,
                color: INK,
                marginBottom: 7,
              }}
            >
              <span>
                {progress.running ? "Sending…" : "Stopped."} {progress.sent} delivered
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
              <div style={{ fontFamily: SANS, fontSize: 12, color: FAINT, marginTop: 7 }}>
                Keep this tab open — closing it pauses the send, and Resume finishes it.
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
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
              <span style={{ fontFamily: SERIF, fontSize: 15.5, color: INK }}>
                Email {selected.length} {selected.length === 1 ? "person" : "people"}?
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

          {!confirming && !busy ? (
            <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>
              This cannot be undone.
            </span>
          ) : null}
        </div>
      </Card>
    </>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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
        ...style,
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
      style={{
        fontFamily: SANS,
        fontSize: 13.5,
        lineHeight: 1.5,
        color: t.ink,
        background: t.tint,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: "11px 13px",
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

const clipStyle: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

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
  fontWeight: 600,
  padding: "10px 18px",
  borderRadius: 10,
  border: `1px solid ${INDIGO_FILL}`,
  background: INDIGO_FILL,
  color: ON_INDIGO,
  cursor: "pointer",
};

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
