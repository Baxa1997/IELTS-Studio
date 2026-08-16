/**
 * The six automatic messages (§12) — the catalogue and the template rules.
 *
 * Pure and not `server-only`: the editor is a client component, the senders are
 * server code, and the substitution rules below are the part that most needs a
 * test. §12's whole feature is "on/off plus an editable template", so the
 * interesting engineering is entirely in what happens when a template and the
 * facts don't line up.
 */

export type AutoMessageKey =
  | "practice_set"
  | "results_ready"
  | "absent_today"
  | "gone_quiet"
  | "two_absences"
  | "invoice_due";

/** The four §12 allows. Deliberately closed: see `validateTemplate`. */
export const PLACEHOLDERS = ["student", "group", "practice", "band"] as const;
export type Placeholder = (typeof PLACEHOLDERS)[number];

export interface AutoMessageSpec {
  key: AutoMessageKey;
  label: string;
  /** What makes it fire, in the words a centre owner would use. */
  trigger: string;
  /** Who receives it. */
  audience: string;
  /** Which placeholders carry a value when this message fires. */
  supports: Placeholder[];
  defaultTitle: string;
  defaultTemplate: string;
  /** True where the message already fires today and must keep firing. */
  onByDefault: boolean;
  /** Set where the message has no trigger wired to it yet. */
  notWiredYet?: string;
}

export const AUTO_MESSAGES: AutoMessageSpec[] = [
  {
    key: "practice_set",
    label: "New practice set",
    trigger: "A teacher sets practice for a group",
    audience: "Students in the group, and its Telegram channel",
    supports: ["student", "group", "practice"],
    defaultTitle: "New homework",
    defaultTemplate: "{practice} has been set for {group}. Open it from your Assignments page.",
    onByDefault: true,
  },
  {
    key: "results_ready",
    label: "Results ready",
    trigger: "A final band is saved",
    audience: "The student",
    supports: ["student", "practice", "band"],
    defaultTitle: "Your work has been marked",
    defaultTemplate: "{practice} came back at band {band}. Open it to see what capped it.",
    onByDefault: true,
  },
  {
    key: "absent_today",
    label: "Absent today",
    trigger: "A register is saved marking the student absent",
    audience: "The student, and the group's Telegram channel",
    supports: ["student", "group"],
    defaultTitle: "You were marked absent",
    defaultTemplate: "{student} was marked absent from {group} today.",
    onByDefault: false,
  },
  {
    key: "gone_quiet",
    label: "Gone quiet nudge",
    trigger: "Seven days with no attempt at anything",
    audience: "The student",
    supports: ["student"],
    defaultTitle: "It has been a week",
    defaultTemplate:
      "{student}, you have not practised for a week. Even one task today keeps you moving.",
    onByDefault: false,
  },
  {
    key: "two_absences",
    label: "Two absences",
    trigger: "Two consecutive absences in the same group",
    audience: "The group's teacher and the centre admin",
    supports: ["student", "group"],
    defaultTitle: "Two absences in a row",
    defaultTemplate: "{student} has missed the last two lessons of {group}.",
    onByDefault: false,
  },
  {
    key: "invoice_due",
    label: "Invoice due",
    trigger: "An invoice reaches its due date",
    audience: "The student",
    supports: ["student", "band"],
    defaultTitle: "Payment due",
    defaultTemplate: "{student}, a payment for this month is now due.",
    onByDefault: false,
    // §12 lists this one as "(later)". It is in the catalogue so the page shows
    // the whole set, and it is honest about not being connected: a toggle that
    // silently does nothing is worse than one labelled as not built.
    notWiredYet: "Not connected yet — invoicing does not raise this event.",
  },
];

export const AUTO_MESSAGE_BY_KEY: Record<AutoMessageKey, AutoMessageSpec> = Object.fromEntries(
  AUTO_MESSAGES.map((m) => [m.key, m]),
) as Record<AutoMessageKey, AutoMessageSpec>;

/** What a centre has chosen, merged over the code defaults. */
export interface AutoMessageSetting {
  key: AutoMessageKey;
  enabled: boolean;
  /** Null when the centre has not edited it — `templateOf` falls back. */
  template: string | null;
  updatedAt: string | null;
}

export const templateOf = (spec: AutoMessageSpec, setting?: AutoMessageSetting | null): string =>
  setting?.template?.trim() ? setting.template : spec.defaultTemplate;

/* ── template validation ──────────────────────────────────────────────────── */

export interface TemplateProblem {
  kind: "unknown" | "unsupported" | "empty";
  token?: string;
  message: string;
}

const TOKEN = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/** Every `{token}` in a template, in order, with duplicates collapsed. */
export function placeholdersIn(template: string): string[] {
  return [...new Set([...template.matchAll(TOKEN)].map((m) => m[1]))];
}

/**
 * Catch a bad template IN THE EDITOR, not in a student's notification.
 *
 * A typo like `{studnet}` has no good behaviour at send time: printing it
 * verbatim puts our internals in front of a learner, and silently deleting it
 * produces ", you have not practised" with a missing name and no clue why. The
 * only place the mistake can be fixed cheaply is where it was made, so saving a
 * template with an unknown token is refused.
 *
 * `unsupported` is the subtler one: `{band}` is a real placeholder, but nothing
 * fills it when a register is saved. A template can be perfectly spelled and
 * still be unfillable by the event it is attached to.
 */
export function validateTemplate(template: string, spec: AutoMessageSpec): TemplateProblem[] {
  const problems: TemplateProblem[] = [];
  if (!template.trim()) {
    problems.push({ kind: "empty", message: "A message needs some words." });
    return problems;
  }

  for (const token of placeholdersIn(template)) {
    if (!(PLACEHOLDERS as readonly string[]).includes(token)) {
      problems.push({
        kind: "unknown",
        token,
        message: `{${token}} is not a placeholder. Use ${PLACEHOLDERS.map((p) => `{${p}}`).join(", ")}.`,
      });
    } else if (!spec.supports.includes(token as Placeholder)) {
      problems.push({
        kind: "unsupported",
        token,
        message: `{${token}} is empty when "${spec.label}" fires, so this message would not send.`,
      });
    }
  }
  return problems;
}

/* ── rendering ────────────────────────────────────────────────────────────── */

export type PlaceholderValues = Partial<Record<Placeholder, string | null | undefined>>;

/**
 * Fill a template, or refuse.
 *
 * THE RULE: a placeholder with no value means the message does not send.
 *
 * The alternative is a sentence with a hole in it arriving on a student's
 * phone — "came back at band ." or "came back at band undefined" — over the
 * centre's name. A message that does not arrive is a missing nudge; a message
 * that arrives broken costs the centre its credibility with the person it was
 * trying to encourage, which is a far worse trade for a nudge.
 *
 * A correctly-authored template never hits this, because `validateTemplate`
 * refuses tokens the event cannot fill. This is the runtime backstop for the
 * case validation cannot see: a supported placeholder that happens to be empty
 * for THIS student — a reading practice with a score but no band, a student
 * whose name was never filled in.
 */
export function renderTemplate(
  template: string,
  values: PlaceholderValues,
): { text: string; missing: string[] } {
  const missing: string[] = [];
  const text = template.replace(TOKEN, (whole, token: string) => {
    const value = values[token as Placeholder];
    if (value == null || String(value).trim() === "") {
      missing.push(token);
      return whole;
    }
    return String(value);
  });
  return { text, missing };
}

/**
 * The one call a sender makes: what should go out, or null.
 *
 * Null covers all three reasons not to send — switched off, no template, or a
 * fact we do not have — so a caller cannot accidentally handle two of them and
 * forget the third.
 */
export function composeAutoMessage(args: {
  spec: AutoMessageSpec;
  setting?: AutoMessageSetting | null;
  values: PlaceholderValues;
}): { title: string; body: string } | null {
  const { spec, setting, values } = args;

  const enabled = setting ? setting.enabled : spec.onByDefault;
  if (!enabled) return null;
  if (spec.notWiredYet) return null;

  const { text, missing } = renderTemplate(templateOf(spec, setting), values);
  if (missing.length > 0) return null;

  return { title: spec.defaultTitle, body: text };
}
