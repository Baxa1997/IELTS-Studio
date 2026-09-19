import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getT } from "@/lib/i18n/server";
import { FAINT, INK, SANS } from "@/lib/theme/tokens";

/**
 * Theme and interface language.
 *
 * The two live together because they are the same kind of setting — how the
 * product presents itself, as opposed to who you are or what you are paying —
 * and because a learner hunting for one will look wherever they found the
 * other.
 *
 * ⚠️ THE THEME CONTROL IS HERE **AS WELL AS** THE FLOATING BUTTON, and that is
 * not a duplicate. The button in the bottom-right corner flips light↔dark,
 * which is the thing people actually do; it cannot express "System", because a
 * one-button control cannot say which of three states it is in. This is where
 * "follow my device" is chosen. Language has no floating control at all — it is
 * a set-once preference, so it lives only here (and in the marketing header,
 * for visitors who have no settings page yet).
 *
 * Both controls are client components with no form and no action: the theme is
 * a `localStorage` write and the locale a cookie write, both applied
 * immediately. There is nothing to submit, so there is no Save button and no
 * success message — the page is already showing the result.
 */
export async function AppearanceSection() {
  const t = await getT();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30, fontFamily: SANS }}>
      <Field label={t("theme.label")} note={t("theme.note")}>
        <ThemeToggle />
      </Field>
      <Field label={t("language.label")} note={t("language.note")}>
        <LanguageToggle />
      </Field>
    </div>
  );
}

function Field({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{label}</div>
      {children}
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: FAINT }}>{note}</p>
    </div>
  );
}
