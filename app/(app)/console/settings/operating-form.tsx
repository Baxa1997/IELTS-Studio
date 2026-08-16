"use client";

import { useActionState } from "react";

import { useActionFeedback } from "@/components/console/toast";
import { type CenterSettings } from "@/lib/console/center-settings";
import { orderedWeekdays } from "@/lib/console/timetable-days";

import { saveCenterSettings, type ActionState } from "../center-actions";

/**
 * How this center runs.
 *
 * The timezone is not a preference — it decides what "today" means on every
 * page. The console used to take the server's UTC day, so a Tashkent center saw
 * yesterday's register until 05:00 and a 19:30 lesson read as unfinished at
 * 20:00. That is why this field exists at all, and why the note under it says
 * what it changes rather than what it is.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";

/** The zones this is actually sold into, plus a UTC escape hatch. Typing an
 *  IANA name by hand is a support ticket; a list of five is a decision. */
const ZONES = [
  ["Asia/Tashkent", "Tashkent — UTC+5"],
  ["Asia/Almaty", "Almaty — UTC+5"],
  ["Asia/Dubai", "Dubai — UTC+4"],
  ["Europe/Istanbul", "Istanbul — UTC+3"],
  ["Europe/London", "London — UTC+0/+1"],
  ["UTC", "UTC"],
] as const;

const field: React.CSSProperties = {
  border: "1px solid #DDD9D0",
  borderRadius: 8,
  padding: "8px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
  width: "100%",
};

const label: React.CSSProperties = {
  display: "block",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 600,
  color: INK,
  marginBottom: 5,
};

const note: React.CSSProperties = {
  margin: "5px 0 0",
  fontFamily: "inherit",
  fontSize: 11.5,
  color: FAINT,
  lineHeight: 1.5,
};

export function OperatingForm({ settings }: { settings: CenterSettings }) {
  const [state, action, pending] = useActionState(saveCenterSettings, {} as ActionState);
  useActionFeedback(state, { keepOpen: true });

  return (
    <form action={action} style={{ padding: "0 18px 18px", display: "grid", gap: 16 }}>
      <div>
        <label htmlFor="cs-tz" style={label}>
          Where the center is
        </label>
        <select id="cs-tz" name="timezone" defaultValue={settings.timezone} style={field}>
          {/* A center on a zone that isn't listed keeps it rather than being
              silently moved to Tashkent by opening this page. */}
          {!ZONES.some(([z]) => z === settings.timezone) ? (
            <option value={settings.timezone}>{settings.timezone}</option>
          ) : null}
          {ZONES.map(([zone, name]) => (
            <option key={zone} value={zone}>
              {name}
            </option>
          ))}
        </select>
        <p style={note}>
          Decides what &ldquo;today&rdquo; means everywhere: which lessons are on, which registers
          are due, and when one has finished.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label htmlFor="cs-week" style={label}>
            The week starts on
          </label>
          <select
            id="cs-week"
            name="week_starts_on"
            defaultValue={String(settings.weekStartsOn)}
            style={field}
          >
            {orderedWeekdays().map((d) => (
              <option key={d.index} value={d.index}>
                {d.long}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cs-len" style={label}>
            A lesson is usually
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id="cs-len"
              name="default_lesson_minutes"
              type="number"
              min={15}
              max={480}
              step={5}
              defaultValue={settings.defaultLessonMinutes}
              style={{ ...field, width: 90 }}
            />
            <span style={{ fontSize: 12.5, color: MUTED }}>minutes</span>
          </div>
        </div>
      </div>

      <div>
        <span style={label}>Days you teach</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {orderedWeekdays().map((d) => (
            <label
              key={d.index}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #DDD9D0",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12.5,
                color: INK,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="working_days"
                value={d.index}
                defaultChecked={settings.workingDays.includes(d.index)}
              />
              {d.short}
            </label>
          ))}
        </div>
        <p style={note}>
          A day off is not a fault: the timetable greys it, and nothing chases a register for it.
        </p>
      </div>

      <div>
        <label htmlFor="cs-override" style={label}>
          Who may correct an AI band
        </label>
        <select
          id="cs-override"
          name="override_policy"
          defaultValue={settings.overridePolicy}
          style={field}
        >
          <option value="teacher">The teacher who owns the group</option>
          <option value="admin_only">Center admins only</option>
          <option value="nobody">Nobody — the AI band stands</option>
        </select>
        <p style={note}>
          Stored now, enforced when marking arrives. An override will always keep the AI&rsquo;s
          original band beside the corrected one, and name who changed it.
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="cn-btn cn-btn--green"
          style={{
            background: "#16794C",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: "9px 16px",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
