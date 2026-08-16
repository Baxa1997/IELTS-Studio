import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * The center's operational settings.
 *
 * A center that has never opened the settings page has NO ROW, and that is not
 * an error — it means every default below. This returns a value rather than
 * null so no caller has to decide what a missing timezone means, because there
 * is only one right answer and it should be written down once.
 */

export interface CenterSettings {
  timezone: string;
  weekStartsOn: number;
  workingDays: number[];
  defaultLessonMinutes: number;
  overridePolicy: "teacher" | "admin_only" | "nobody";
}

export const CENTER_DEFAULTS: CenterSettings = {
  // The market this is sold in. A center elsewhere changes it once; a center
  // here never has to think about it.
  timezone: "Asia/Tashkent",
  weekStartsOn: 1,
  workingDays: [1, 2, 3, 4, 5, 6],
  defaultLessonMinutes: 90,
  overridePolicy: "teacher",
};

export async function loadCenterSettings(): Promise<CenterSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("center_settings")
    .select("timezone, week_starts_on, working_days, default_lesson_minutes, override_policy")
    .maybeSingle();

  // An unapplied migration and an unconfigured center look identical from here
  // — both give no row — and the difference matters when a clock is wrong.
  if (error) console.error("[loadCenterSettings] failed:", error.message);
  if (!data) return CENTER_DEFAULTS;

  return {
    timezone: (data.timezone as string) || CENTER_DEFAULTS.timezone,
    weekStartsOn: (data.week_starts_on as number) ?? CENTER_DEFAULTS.weekStartsOn,
    workingDays: Array.isArray(data.working_days)
      ? (data.working_days as number[])
      : CENTER_DEFAULTS.workingDays,
    defaultLessonMinutes:
      (data.default_lesson_minutes as number) ?? CENTER_DEFAULTS.defaultLessonMinutes,
    overridePolicy:
      (data.override_policy as CenterSettings["overridePolicy"]) ?? CENTER_DEFAULTS.overridePolicy,
  };
}
