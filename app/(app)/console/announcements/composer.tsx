"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FiSend } from "react-icons/fi";

import { sendAnnouncement, type ActionState } from "../center-actions";
import { useActionFeedback } from "@/components/console/toast";

const INDIGO = "#4340CB";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#777581";

const label: React.CSSProperties = {
  fontSize: 12,
  color: MUTED,
  display: "block",
  marginBottom: 6,
};
const field: React.CSSProperties = {
  width: "100%",
  border: "1px solid #CFCABC",
  borderRadius: 8,
  padding: "9px 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

type Audience = "everyone" | "students" | "teachers" | "group";

/**
 * Compose an announcement. The audience chips resolve to real people at send
 * time, and the count under the button is computed from the same roster the
 * action will use — so what it promises to reach is what it reaches.
 */
export function AnnouncementComposer({
  canAnnounceCenterWide,
  counts,
  groups,
  channels,
}: {
  /** False for a teacher: their audience is always one of their own classes. */
  canAnnounceCenterWide: boolean;
  counts: { everyone: number; students: number; teachers: number };
  groups: { id: string; name: string; students: number; hasChannel: boolean }[];
  /** Groups with a verified channel, named. Empty hides the whole section. */
  channels: { groupId: string; groupName: string; chatTitle: string }[];
}) {
  const [state, formAction, pending] = useActionState(sendAnnouncement, {} as ActionState);
  // Keeps the composer open — you often send two in a row — and the banner at
  // the top of the page carries the confirmation.
  useActionFeedback(state, { keepOpen: true });
  const [audience, setAudience] = useState<Audience>(canAnnounceCenterWide ? "everyone" : "group");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [toTelegram, setToTelegram] = useState(false);
  // Which channels this post goes to. Named and ticked, never implied: the
  // first version posted to "every linked channel" whenever the audience was
  // not one group, so there was no way to write to two groups out of five —
  // and no way to see where a post had gone until it had gone there.
  const [picked, setPicked] = useState<string[]>(() => channels.map((c) => c.groupId));

  // A teacher gets no center-wide chips at all rather than disabled ones: an
  // option you can see but never use is a question you answer every time.
  const options: { value: Audience; label: string }[] = canAnnounceCenterWide
    ? [
        { value: "everyone", label: "Everyone" },
        { value: "students", label: "All students" },
        { value: "teachers", label: "All teachers" },
        ...(groups.length > 0 ? [{ value: "group" as Audience, label: "One group" }] : []),
      ]
    : [{ value: "group", label: "One group" }];

  const chosen = groups.find((g) => g.id === groupId);
  const reach = audience === "group" ? (chosen?.students ?? 0) : counts[audience];

  // Writing to ONE group pins the channel to that group — posting a
  // group-specific message into another group's channel is never what was
  // meant. Any wider audience picks its own destinations.
  const locked = audience === "group";
  const targets = locked
    ? channels.filter((c) => c.groupId === groupId)
    : channels.filter((c) => picked.includes(c.groupId));

  const toggleChannel = (id: string) =>
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <input type="hidden" name="audience" value={audience} />
      {audience === "group" ? <input type="hidden" name="group_id" value={groupId} /> : null}

      <span style={label}>Audience</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {options.map((o) => {
          const on = audience === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => setAudience(o.value)}
              style={{
                borderRadius: 20,
                padding: "6px 12px",
                fontFamily: "inherit",
                fontSize: 12.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
                border: `1px solid ${on ? "#14133A" : "#C5C4BE"}`,
                background: on ? "#14133A" : "#fff",
                color: on ? "#fff" : "#4C4A63",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {audience === "group" ? (
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="ann-group" style={label}>
            Which group
          </label>
          <select
            id="ann-group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            style={field}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.students})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ann-subject" style={label}>
          Subject
        </label>
        <input
          id="ann-subject"
          name="subject"
          required
          maxLength={140}
          placeholder="Mock exam week — 18–22 August"
          style={field}
        />
      </div>

      <div>
        <label htmlFor="ann-body" style={label}>
          Message
        </label>
        <textarea
          id="ann-body"
          name="body"
          rows={6}
          required
          placeholder="Write to your center…"
          style={{ ...field, resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      {/* A second delivery, not a replacement: the bell reaches every account,
          Telegram reaches whoever joined the channel — usually the parents,
          who have no account here at all. */}
      {/* NO CHANNELS IS A STATE, NOT AN ABSENCE. Hiding this section when
          nothing is connected is what made a real send look broken: the sender
          wrote a post, saw no Telegram option, and reasonably assumed it had
          gone to the channel anyway. Say it out loud and link to the fix. */}
      {channels.length === 0 ? (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "flex-start",
            gap: 9,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px dashed #D6D3CA",
            background: "#FAFAF7",
          }}
        >
          <FiSend size={15} color="#777581" aria-hidden style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            <span style={{ display: "block", fontSize: 13, color: MUTED }}>
              No Telegram channel connected
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 2 }}>
              This post reaches the app only. Connect a group channel from{" "}
              <Link href="/console/groups" style={{ color: INDIGO }}>
                its group page
              </Link>{" "}
              → Settings → Telegram to reach parents too.
            </span>
          </span>
        </div>
      ) : null}

      {channels.length > 0 ? (
        <div
          style={{
            marginTop: 14,
            borderRadius: 10,
            border: `1px solid ${toTelegram ? "#B7E0F5" : "#C5C4BE"}`,
            background: toTelegram ? "#F7FCFF" : "#fff",
            overflow: "hidden",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              padding: "10px 12px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="telegram"
              checked={toTelegram}
              onChange={(e) => setToTelegram(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <FiSend size={15} color="#229ED9" aria-hidden style={{ marginTop: 1, flexShrink: 0 }} />
            <span>
              <span style={{ display: "block", fontSize: 13, color: INK }}>
                Post it to Telegram as well
              </span>
              <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 2 }}>
                {channels.length} channel{channels.length === 1 ? "" : "s"} connected — the parents
                are usually there.
              </span>
            </span>
          </label>

          {toTelegram ? (
            <div style={{ borderTop: "1px solid #DDEEF8", padding: "9px 12px 11px" }}>
              <span style={{ ...label, marginBottom: 7 }}>
                {locked ? "Goes to this group's channel" : "Choose the channels"}
              </span>

              {channels.map((c) => {
                const on = locked ? c.groupId === groupId : picked.includes(c.groupId);
                return (
                  <label
                    key={c.groupId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 0",
                      cursor: locked ? "default" : "pointer",
                      opacity: locked && !on ? 0.4 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      name="telegram_groups"
                      value={c.groupId}
                      checked={on}
                      disabled={locked}
                      onChange={() => toggleChannel(c.groupId)}
                    />
                    <span style={{ fontSize: 12.5, color: INK }}>{c.groupName}</span>
                    <span style={{ fontSize: 11.5, color: FAINT }}>→ {c.chatTitle}</span>
                  </label>
                );
              })}

              {/* A locked pick is not submitted by a disabled checkbox, so the
                  group's own channel is sent as a hidden field instead. */}
              {locked && chosen?.hasChannel ? (
                <input type="hidden" name="telegram_groups" value={groupId} />
              ) : null}

              {targets.length === 0 ? (
                <p style={{ fontSize: 11.5, color: "#A63A30", margin: "7px 0 0" }}>
                  {locked
                    ? "This group has no channel connected — connect one on the group page."
                    : "Pick at least one channel, or untick Telegram."}
                </p>
              ) : (
                <p style={{ fontSize: 11.5, color: FAINT, margin: "7px 0 0", lineHeight: 1.5 }}>
                  Posting to {targets.map((t) => t.chatTitle).join(", ")}.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="submit"
          disabled={pending || reach === 0 || (toTelegram && targets.length === 0)}
          className="cn-btn cn-btn--primary"
          style={{
            flex: 1,
            background: INDIGO,
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: 10,
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            opacity: pending || reach === 0 ? 0.6 : 1,
          }}
        >
          {pending ? "Sending…" : "Send now"}
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: "#777581", marginTop: 10, lineHeight: 1.55 }}>
        Reaches {reach} {reach === 1 ? "person" : "people"} in the app. A center student may have no
        address that can receive mail, so the bell is the one channel that reaches everybody.
      </div>
    </form>
  );
}
