import Link from "next/link";

import { PageHead } from "@/components/console/crm-ui";

import { sectionsFor, type SettingsSectionKey } from "../section-list";

/**
 * Settings, as one page: the list of sections on the left, the open one on the
 * right. Below 900px the list becomes a row of tabs above the section (see
 * `.cn-settings-hub` in globals.css).
 *
 * Each section is its own URL (`/console/settings/<key>`) rather than a tab
 * switched in the browser, so a section can be linked to — the share modal
 * sends people straight to Telegram — and only the open one loads its data.
 */
export function SettingsFrame({
  role,
  active,
  children,
}: {
  role: string;
  active: SettingsSectionKey;
  children: React.ReactNode;
}) {
  const sections = sectionsFor(role);
  const current = sections.find((s) => s.key === active);

  return (
    <div>
      <PageHead
        title="Settings"
        subtitle={
          role === "center_admin"
            ? "Your account, your center, and everything it is connected to."
            : "Your account and your classes' Telegram groups."
        }
      />

      <div className="cn-settings-hub">
        <nav className="cn-settings-nav" aria-label="Settings sections">
          {sections.map((s) => (
            <Link
              key={s.key}
              href={`/console/settings/${s.key}`}
              className="cn-settings-link"
              aria-current={s.key === active ? "page" : undefined}
            >
              <span className="cn-settings-link-label">{s.label}</span>
              <span className="cn-settings-link-note">{s.note}</span>
            </Link>
          ))}
        </nav>

        <section aria-labelledby="settings-section-title" style={{ minWidth: 0 }}>
          <h2 id="settings-section-title" className="cn-settings-title">
            {current?.label}
          </h2>
          {children}
        </section>
      </div>
    </div>
  );
}
