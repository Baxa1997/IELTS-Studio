"use client";

import { useActionState, useState } from "react";
import { FiAlertTriangle, FiMail, FiMessageSquare, FiSend } from "react-icons/fi";

import { useActionFeedback } from "@/components/console/toast";
import { type AlertChannel, type AlertSettings } from "@/lib/console/alerts";

import { type ActionState, saveAlertSettings } from "../center-actions";

/**
 * Who gets told when a student misses a lesson.
 *
 * NOTHING SENDS YET, AND THE PANEL SAYS SO. Writing the rules down first is the
 * point: the argument a center has is about who is told and after how many
 * absences, not about which SMS gateway. Settling that costs an afternoon;
 * un-settling it after a provider is wired in costs a rewrite.
 *
 * The reach line is the part that earns this screen its keep. A center will
 * happily tick SMS and reach nobody, because students created in bulk have no
 * phone number — so the panel counts, out loud, how many students each channel
 * could actually reach before it is switched on.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#EAE8E1";
const INDIGO = "#4340CB";
const AMBER = "#9A6B00";

const CHANNELS: { key: AlertChannel; label: string; icon: React.ReactNode; note: string }[] = [
  {
    key: "email",
    label: "Email",
    icon: <FiMail size={15} color="#0F6CBD" />,
    note: "Free, already configured",
  },
  {
    key: "sms",
    label: "SMS",
    icon: <FiMessageSquare size={15} color="#1D6F42" />,
    note: "Costs per message, needs a gateway",
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: <FiSend size={15} color="#229ED9" />,
    note: "Free, needs the class channel linked",
  },
];

export function AlertSettingsForm({ settings }: { settings: AlertSettings }) {
  const [state, formAction, pending] = useActionState(saveAlertSettings, {} as ActionState);
  useActionFeedback(state);

  const [enabled, setEnabled] = useState(settings.enabled);
  const [channels, setChannels] = useState<AlertChannel[]>(settings.channels);

  const toggleChannel = (key: AlertChannel) =>
    setChannels((list) => (list.includes(key) ? list.filter((c) => c !== key) : [...list, key]));

  const { reach } = settings;
  const reachOf = (key: AlertChannel) =>
    key === "email" ? reach.withEmail : key === "sms" ? reach.withPhone : null;

  return (
    <form action={formAction} style={{ display: "grid", gap: 16 }}>
      <label style={row}>
        <input
          type="checkbox"
          name="enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>
          <span style={label}>Tell someone when a student is absent</span>
          <span style={hint}>Off keeps these rules saved without acting on them.</span>
        </span>
      </label>

      <fieldset style={fieldset} disabled={!enabled}>
        <legend style={legend}>Channels</legend>
        <div style={{ display: "grid", gap: 6 }}>
          {CHANNELS.map((c) => {
            const on = channels.includes(c.key);
            const canReach = reachOf(c.key);
            return (
              <label
                key={c.key}
                style={{
                  ...row,
                  border: `1px solid ${on ? INDIGO : LINE}`,
                  borderRadius: 9,
                  padding: "9px 11px",
                  background: on ? "#F7F7FC" : "#fff",
                  opacity: enabled ? 1 : 0.55,
                }}
              >
                <input
                  type="checkbox"
                  name="channels"
                  value={c.key}
                  checked={on}
                  onChange={() => toggleChannel(c.key)}
                />
                <span aria-hidden style={{ display: "inline-flex" }}>
                  {c.icon}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={label}>{c.label}</span>
                  <span style={hint}>{c.note}</span>
                </span>
                {canReach != null ? (
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: canReach === 0 ? AMBER : MUTED,
                      whiteSpace: "nowrap",
                    }}
                  >
                    reaches {canReach}/{reach.students}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>

        {channels.includes("sms") && reach.withPhone === 0 ? (
          <p style={warn}>
            <FiAlertTriangle size={13} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              No student has a phone number on file, so SMS would reach nobody. Add numbers on the
              student, or tick &ldquo;their guardian&rdquo; below and collect those instead.
            </span>
          </p>
        ) : null}

        {channels.includes("sms") ? (
          <label style={{ display: "grid", gap: 4, marginTop: 10 }}>
            <span style={label}>SMS sender name</span>
            <input
              name="sms_sender"
              defaultValue={settings.smsSender ?? ""}
              maxLength={11}
              placeholder="ENGPROGRESS"
              style={field}
            />
            <span style={hint}>
              Up to 11 characters. Uzbek operators drop messages from an unregistered sender, so
              this has to match what you registered with them.
            </span>
          </label>
        ) : null}
      </fieldset>

      <fieldset style={fieldset} disabled={!enabled}>
        <legend style={legend}>Who hears about it</legend>
        <label style={row}>
          <input type="checkbox" name="notify_student" defaultChecked={settings.notifyStudent} />
          <span style={label}>The student</span>
        </label>
        <label style={row}>
          <input type="checkbox" name="notify_guardian" defaultChecked={settings.notifyGuardian} />
          <span>
            <span style={label}>Their parent or guardian</span>
            <span style={hint}>
              {reach.withGuardian} of {reach.students} students have a guardian number on file.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset style={fieldset} disabled={!enabled}>
        <legend style={legend}>When</legend>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={label}>Alert after</span>
          <select
            name="absences_before_alert"
            defaultValue={String(settings.absencesBeforeAlert)}
            style={field}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "every absence" : `${n} absences in a row`}
              </option>
            ))}
          </select>
          <span style={hint}>
            Telling a parent about one missed lesson can do more harm than saying nothing — most
            centers wait for a pattern.
          </span>
        </label>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 10 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={label}>Quiet from</span>
            <input
              type="time"
              name="quiet_hours_from"
              defaultValue={settings.quietFrom ?? "21:00"}
              style={field}
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={label}>Quiet until</span>
            <input
              type="time"
              name="quiet_hours_to"
              defaultValue={settings.quietTo ?? "08:00"}
              style={field}
            />
          </label>
        </div>
        <span style={hint}>Anything falling in this window waits for the morning.</span>
      </fieldset>

      <p style={{ ...hint, borderTop: `1px solid ${LINE}`, paddingTop: 12, margin: 0 }}>
        <strong style={{ color: INK, fontWeight: 600 }}>Nothing sends yet.</strong> These rules are
        stored and will be read by the sender when it is built — saving them now means the argument
        about who gets told is settled before a gateway is chosen.
      </p>

      <button
        type="submit"
        disabled={pending}
        style={{
          height: 36,
          borderRadius: 9,
          border: "none",
          background: INDIGO,
          color: "#fff",
          fontSize: 13.5,
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? "Saving…" : "Save alert rules"}
      </button>
    </form>
  );
}

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
  cursor: "pointer",
};

const fieldset: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 10,
  padding: "12px 13px",
  margin: 0,
  display: "grid",
  gap: 8,
};

const legend: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: FAINT,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  padding: "0 5px",
};

const label: React.CSSProperties = { display: "block", fontSize: 13, color: INK };
const hint: React.CSSProperties = {
  display: "block",
  fontSize: 11.5,
  color: FAINT,
  lineHeight: 1.5,
  marginTop: 2,
};

const field: React.CSSProperties = {
  height: 34,
  borderRadius: 8,
  border: `1px solid ${LINE}`,
  background: "#fff",
  padding: "0 10px",
  fontSize: 13.5,
  fontFamily: "inherit",
  color: INK,
  outline: "none",
  width: "100%",
};

const warn: React.CSSProperties = {
  display: "flex",
  gap: 7,
  margin: "8px 0 0",
  padding: "8px 10px",
  borderRadius: 8,
  background: "#FDF6E7",
  border: "1px solid #EFD9A8",
  fontSize: 11.5,
  color: AMBER,
  lineHeight: 1.5,
};
