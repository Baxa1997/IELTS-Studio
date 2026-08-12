import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Absence-alert configuration. Read here, written by `saveAlertSettings`, and
 * — deliberately — acted on by nothing yet.
 *
 * The row may not exist: a center that has never opened the panel has no row,
 * and that is not an error state. Defaults stand in, and the first save creates
 * it. That is why this returns a value rather than `null`.
 */

export const ALERT_CHANNELS = ["email", "sms", "telegram"] as const;
export type AlertChannel = (typeof ALERT_CHANNELS)[number];

export interface AlertSettings {
  enabled: boolean;
  channels: AlertChannel[];
  absencesBeforeAlert: number;
  notifyStudent: boolean;
  notifyGuardian: boolean;
  smsSender: string | null;
  quietFrom: string | null;
  quietTo: string | null;
  /** How many students could actually be reached, so the panel can be honest. */
  reach: { students: number; withEmail: number; withPhone: number; withGuardian: number };
}

export async function loadAlertSettings(): Promise<AlertSettings> {
  const supabase = await createClient();

  const [settingsRes, peopleRes] = await Promise.all([
    supabase
      .from("attendance_alert_settings")
      .select(
        "enabled, channels, absences_before_alert, notify_student, notify_guardian, sms_sender, quiet_hours_from, quiet_hours_to",
      )
      .maybeSingle(),
    // The reach check. A center can happily switch SMS on and reach nobody,
    // because students created in bulk have no phone number — better to say so
    // in the panel than to discover it the first time a parent isn't told.
    supabase.from("profiles").select("contact_email, phone, guardian_phone").eq("role", "student"),
  ]);

  const row = settingsRes.data as Record<string, unknown> | null;
  const people = (peopleRes.data ?? []) as Record<string, string | null>[];

  return {
    enabled: Boolean(row?.enabled),
    channels: Array.isArray(row?.channels) ? (row.channels as AlertChannel[]) : [],
    absencesBeforeAlert: Number(row?.absences_before_alert ?? 1),
    notifyStudent: row ? Boolean(row.notify_student) : true,
    notifyGuardian: Boolean(row?.notify_guardian),
    smsSender: (row?.sms_sender as string | null) ?? null,
    quietFrom: row?.quiet_hours_from ? String(row.quiet_hours_from).slice(0, 5) : null,
    quietTo: row?.quiet_hours_to ? String(row.quiet_hours_to).slice(0, 5) : null,
    reach: {
      students: people.length,
      withEmail: people.filter((p) => p.contact_email).length,
      withPhone: people.filter((p) => p.phone).length,
      withGuardian: people.filter((p) => p.guardian_phone).length,
    },
  };
}
