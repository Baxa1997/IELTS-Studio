"use client";

import { useActionState, useState } from "react";

import { sendAnnouncement, type ActionState } from "../center-actions";

const INDIGO = "#4340CB";
const INK = "#16162E";
const MUTED = "#6E6C87";

const label: React.CSSProperties = { fontSize: 12, color: MUTED, display: "block", marginBottom: 6 };
const field: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E4E2DC",
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
}: {
  counts: { everyone: number; students: number; teachers: number };
  groups: { id: string; name: string; students: number }[];
}) {
  const [state, formAction, pending] = useActionState(sendAnnouncement, {} as ActionState);
  const [audience, setAudience] = useState<Audience>("everyone");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");

  const options: { value: Audience; label: string }[] = [
    { value: "everyone", label: "Everyone" },
    { value: "students", label: "All students" },
    { value: "teachers", label: "All teachers" },
    ...(groups.length > 0 ? [{ value: "group" as Audience, label: "One class" }] : []),
  ];

  const reach =
    audience === "group"
      ? (groups.find((g) => g.id === groupId)?.students ?? 0)
      : counts[audience];

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

      {state.error ? (
        <p style={{ fontSize: 12.5, color: "#A63A30", margin: "12px 0 0" }}>{state.error}</p>
      ) : null}
      {state.ok ? (
        <p style={{ fontSize: 12.5, color: "#16794C", margin: "12px 0 0" }}>{state.ok}</p>
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
        Reaches {reach} {reach === 1 ? "person" : "people"}. Delivered in the app — a center student
        may have no email address that can receive mail, so the bell is the only channel that
        reaches everybody.
      </div>
    </form>
  );
}
