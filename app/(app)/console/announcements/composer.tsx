"use client";

import { useActionState, useState } from "react";
import { FiSend } from "react-icons/fi";

import { sendAnnouncement, type ActionState } from "../center-actions";
import { useActionFeedback } from "@/components/console/toast";

const INDIGO = "#4340CB";
const INK = "#16162E";
const MUTED = "#6E6C87";

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
  counts,
  groups,
  channelCount,
}: {
  counts: { everyone: number; students: number; teachers: number };
  groups: { id: string; name: string; students: number; hasChannel: boolean }[];
  /** Verified Telegram channels across the center. 0 hides the toggle. */
  channelCount: number;
}) {
  const [state, formAction, pending] = useActionState(sendAnnouncement, {} as ActionState);
  // Keeps the composer open — you often send two in a row — and the banner at
  // the top of the page carries the confirmation.
  useActionFeedback(state, { keepOpen: true });
  const [audience, setAudience] = useState<Audience>("everyone");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [toTelegram, setToTelegram] = useState(false);

  const options: { value: Audience; label: string }[] = [
    { value: "everyone", label: "Everyone" },
    { value: "students", label: "All students" },
    { value: "teachers", label: "All teachers" },
    ...(groups.length > 0 ? [{ value: "group" as Audience, label: "One class" }] : []),
  ];

  const chosen = groups.find((g) => g.id === groupId);
  const reach = audience === "group" ? (chosen?.students ?? 0) : counts[audience];

  // How many channels this send would actually post to, so the toggle promises
  // only what it can deliver: one class means one channel, everything else
  // means every linked class.
  const channelsHit = audience === "group" ? (chosen?.hasChannel ? 1 : 0) : channelCount;

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
                border: `1px solid ${on ? "#14133A" : "#E4E2DC"}`,
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
            Which class
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
      {channelCount > 0 ? (
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 9,
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 9,
            border: `1px solid ${toTelegram && channelsHit > 0 ? "#B7E0F5" : "#E4E2DC"}`,
            background: toTelegram && channelsHit > 0 ? "#F2FAFE" : "#fff",
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
            <span style={{ display: "block", fontSize: 11.5, color: "#93919F", marginTop: 2 }}>
              {channelsHit === 0
                ? "This class has no channel connected — see the Telegram tab."
                : `Goes to ${channelsHit} connected channel${channelsHit === 1 ? "" : "s"}, where the parents are.`}
            </span>
          </span>
        </label>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="submit"
          disabled={pending || reach === 0}
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
      <div style={{ fontSize: 11.5, color: "#93919F", marginTop: 10, lineHeight: 1.55 }}>
        Reaches {reach} {reach === 1 ? "person" : "people"} in the app. A center student may have no
        address that can receive mail, so the bell is the one channel that reaches everybody.
      </div>
    </form>
  );
}
