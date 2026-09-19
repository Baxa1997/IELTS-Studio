import Link from "next/link";

import { getT } from "@/lib/i18n/server";

import { LEARNER_SECTIONS, type LearnerSectionKey } from "../learner-sections";
import { BRAND, PANEL, SLATE_BODY as MUTED, SLATE_INK as INK } from "@/lib/theme/tokens";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";

/**
 * The learner's settings: sections on the left, the open one on the right.
 *
 * It shares its layout with the console's settings (`.cn-settings-hub` in
 * globals.css) and swaps only the colours, through the `--settings-*` custom
 * properties — burgundy here, indigo in the console.
 */
export async function LearnerSettingsFrame({
  active,
  children,
}: {
  active: LearnerSectionKey;
  children: React.ReactNode;
}) {
  const t = await getT();
  const current = LEARNER_SECTIONS.find((s) => s.key === active);

  return (
    <div
      style={
        {
          fontFamily: SANS,
          color: INK,
          "--settings-accent": BRAND,
          "--settings-tint": "#F8E8EE",
          "--settings-note": "#9B1044",
          "--settings-ink": INK,
        } as React.CSSProperties
      }
    >
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "clamp(26px,3vw,34px)",
          lineHeight: 1.08,
          letterSpacing: "-.015em",
          margin: 0,
        }}
      >
        {t("nav.settings")}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: MUTED, margin: "8px 0 22px" }}>
        Your account, your study goal and your plan.
      </p>

      <div className="cn-settings-hub">
        <nav className="cn-settings-nav" aria-label="Settings sections">
          {LEARNER_SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={`/settings/${s.key}`}
              className="cn-settings-link"
              aria-current={s.key === active ? "page" : undefined}
            >
              <span className="cn-settings-link-label">{t(s.labelKey)}</span>
              <span className="cn-settings-link-note">{t(s.noteKey)}</span>
            </Link>
          ))}
        </nav>

        <section aria-labelledby="settings-section-title" style={{ minWidth: 0 }}>
          <h2 id="settings-section-title" className="cn-settings-title">
            {current ? t(current.labelKey) : null}
          </h2>
          {children}
        </section>
      </div>
    </div>
  );
}

/** A white card with a heading — the learner app's panel. */
export function Panel({
  title,
  note,
  tone = "default",
  children,
}: {
  title: string;
  note?: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${tone === "danger" ? "#F1C9C2" : "#E6E8EC"}`,
        borderRadius: 16,
        padding: "22px 24px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: tone === "danger" ? "#A13A2C" : INK,
        }}
      >
        {title}
      </h3>
      {note ? (
        <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: MUTED }}>{note}</p>
      ) : null}
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}
