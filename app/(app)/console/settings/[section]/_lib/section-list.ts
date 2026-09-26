/**
 * The console's settings sections, and who may open each one.
 *
 * Plain data rather than something derived from the page files, because the
 * frame's list and the route's guard must agree exactly: a section in the list
 * that the route refuses is a door that shuts in your face, and a section the
 * route serves but the list hides is one nobody can find. Both read this.
 *
 * Roles are strings, not `AppRole`, so this module stays importable from a test
 * without dragging in lib/auth and the Supabase server client behind it.
 *
 * The list is a hint; each section's data is still gated where it is loaded and
 * written — the server actions check the role and RLS checks the org.
 */

const STAFF = ["center_admin", "administrator", "teacher"] as const;
const OWNER = ["center_admin"] as const;

export const SETTINGS_SECTIONS = [
  { key: "account", label: "My account", note: "Password and your own Telegram", roles: STAFF },
  // STAFF, not OWNER: the theme and the interface language are personal to
  // whoever is signed in, not the centre's settings. A teacher gets to read
  // their own console in Uzbek without the centre admin deciding it for them.
  { key: "appearance", label: "Appearance & language", note: "Theme and interface language", roles: STAFF },
  { key: "center", label: "Center", note: "Name, hours and holidays", roles: OWNER },
  { key: "telegram", label: "Telegram groups", note: "Where each class hears news", roles: STAFF },
  { key: "billing", label: "Billing & plan", note: "Your plan and this month's use", roles: OWNER },
  { key: "subjects", label: "Subjects", note: "What the center teaches", roles: OWNER },
  { key: "roles", label: "Roles & activity", note: "Who can do what", roles: OWNER },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
export type SettingsSectionKey = SettingsSection["key"];

/** The sections this role may open, in the order the list shows them. */
export function sectionsFor(role: string): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((s) => (s.roles as readonly string[]).includes(role));
}

/**
 * The section a URL names, if this role may open it; otherwise null, and the
 * route sends them to their first section. An unknown key and a forbidden one
 * are answered the same way on purpose — the URL should not reveal which
 * sections exist for somebody who cannot see them.
 */
export function resolveSection(role: string, raw: string): SettingsSectionKey | null {
  return sectionsFor(role).find((s) => s.key === raw)?.key ?? null;
}
