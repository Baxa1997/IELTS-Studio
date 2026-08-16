"use client";

import { useActionState, useState } from "react";

import {
  AUTO_MESSAGES,
  PLACEHOLDERS,
  templateOf,
  validateTemplate,
  type AutoMessageKey,
  type AutoMessageSetting,
  type AutoMessageSpec,
} from "@/lib/console/auto-messages";

import { saveAutoMessage, type ActionState } from "../center-actions";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#16162E";
const FAINT = "#6E6C87";
const GREEN = "#166C4C";
const RED = "#C24539";
const RULE = "#E7E5DF";

/**
 * §12's Automatic tab: six messages, each on/off with editable wording.
 *
 * DELIBERATELY NOT AN AUTOMATION BUILDER. No conditions, no schedule editor, no
 * branching — §12 says "that's the whole feature", and the reason to hold that
 * line is that every automation builder in the world started as six toggles.
 * What a centre needs is to decide whether the message goes and what it says.
 *
 * Each message is its own form, so saving one cannot disturb another and a
 * validation error on one row leaves the other five alone.
 */
export function AutomaticMessages({
  settings,
  canEdit,
}: {
  settings: Record<string, AutoMessageSetting>;
  canEdit: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0, lineHeight: 1.6 }}>
        These send on their own. Manual announcements are rare; these are what students actually
        react to, so the wording is worth getting right.
        {canEdit ? null : " Only the centre owner can change them."}
      </p>

      {AUTO_MESSAGES.map((spec) => (
        <MessageRow key={spec.key} spec={spec} setting={settings[spec.key] ?? null} canEdit={canEdit} />
      ))}
    </div>
  );
}

function MessageRow({
  spec,
  setting,
  canEdit,
}: {
  spec: AutoMessageSpec;
  setting: AutoMessageSetting | null;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveAutoMessage, {});
  const [enabled, setEnabled] = useState(setting ? setting.enabled : spec.onByDefault);
  const [template, setTemplate] = useState(setting?.template ?? "");

  // Validated as it is typed, against THIS message's facts. The same check runs
  // again on the server — this one exists so the owner sees the problem before
  // pressing save, not so the server can trust the client.
  const problems = template.trim() ? validateTemplate(template, spec) : [];
  const effective = templateOf(spec, { ...(setting ?? blank(spec.key)), template: template || null });

  return (
    <form
      action={action}
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 12,
        padding: 14,
        background: "#FFF",
        opacity: enabled ? 1 : 0.72,
      }}
    >
      <input type="hidden" name="key" value={spec.key} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: canEdit ? "pointer" : "default" }}>
          <input
            type="checkbox"
            name="enabled"
            checked={enabled}
            disabled={!canEdit}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#3B43B5" }}
          />
        </label>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: INK }}>
            {spec.label}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: FAINT, marginTop: 2 }}>
            {spec.trigger} → {spec.audience}
          </div>
          {spec.notWiredYet ? (
            <div
              style={{
                fontFamily: SANS,
                fontSize: 11.5,
                color: RED,
                marginTop: 6,
                fontWeight: 500,
              }}
            >
              {spec.notWiredYet}
            </div>
          ) : null}
        </div>
      </div>

      <textarea
        name="template"
        value={template}
        disabled={!canEdit}
        onChange={(e) => setTemplate(e.target.value)}
        placeholder={spec.defaultTemplate}
        rows={2}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "8px 10px",
          border: `1px solid ${problems.length > 0 ? RED : RULE}`,
          borderRadius: 8,
          fontFamily: SANS,
          fontSize: 13,
          color: INK,
          resize: "vertical",
          background: canEdit ? "#FFF" : "#FAFAF8",
        }}
      />

      <div style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT, marginTop: 6 }}>
        {/* Only the placeholders THIS event can fill. Offering {band} on an
            attendance message is offering a hole in a sentence. */}
        Available here: {spec.supports.map((p) => `{${p}}`).join(" ")}
        {PLACEHOLDERS.length > spec.supports.length ? (
          <span style={{ opacity: 0.7 }}>
            {" "}
            · not{" "}
            {PLACEHOLDERS.filter((p) => !spec.supports.includes(p))
              .map((p) => `{${p}}`)
              .join(" ")}
          </span>
        ) : null}
      </div>

      {problems.length > 0 ? (
        <div style={{ fontFamily: SANS, fontSize: 12, color: RED, marginTop: 6 }}>
          {problems[0].message}
        </div>
      ) : (
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: FAINT,
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px solid #F2F0EB`,
            fontStyle: "italic",
          }}
        >
          {/* The preview is the feature. A template is abstract; the sentence a
              student will read is the thing being decided. */}
          “{effective}”
        </div>
      )}

      {canEdit ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <button
            type="submit"
            disabled={pending || problems.length > 0}
            style={{
              border: `1px solid ${RULE}`,
              background: "#FFF",
              color: INK,
              borderRadius: 8,
              padding: "6px 13px",
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: pending || problems.length > 0 ? "default" : "pointer",
              opacity: pending || problems.length > 0 ? 0.5 : 1,
            }}
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {template.trim() ? (
            <button
              type="button"
              onClick={() => setTemplate("")}
              style={{
                border: "none",
                background: "none",
                color: FAINT,
                fontFamily: SANS,
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Use the default wording
            </button>
          ) : null}
          {state.ok ? (
            <span style={{ fontFamily: SANS, fontSize: 12, color: GREEN }}>{state.ok}</span>
          ) : null}
          {state.error ? (
            <span style={{ fontFamily: SANS, fontSize: 12, color: RED }}>{state.error}</span>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

const blank = (key: AutoMessageKey): AutoMessageSetting => ({
  key,
  enabled: false,
  template: null,
  updatedAt: null,
});
