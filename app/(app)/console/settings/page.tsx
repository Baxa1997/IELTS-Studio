import { redirect } from "next/navigation";

/**
 * Settings opens on "My account" — the one section every member of staff has.
 * The sections themselves live at /console/settings/<section>.
 */
export default function SettingsPage() {
  redirect("/console/settings/account");
}
