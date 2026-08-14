import { sanitizeLessonHtml } from "@/lib/lessons/sanitize";
import type { LessonSection } from "@/lib/lessons/types";

/**
 * The teaching half of a lesson.
 *
 * THE ONE PLACE model-written HTML reaches a browser, and the only place in
 * this app that calls `dangerouslySetInnerHTML` on something a model produced —
 * which is why the sanitiser runs HERE rather than at the call site. A future
 * page that renders a lesson gets the cleaning for free by using this component,
 * and cannot accidentally opt out of it.
 *
 * The engine also refuses to STORE markup outside the allow-list, so this is the
 * second of two layers. It is not redundant: a row written last month outlives
 * the validator that wrote it, and the row is what ends up in front of a
 * stranger on a shared link.
 *
 * Server component — the sanitiser pulls in a DOM implementation, and there is
 * no reason to ship that to the browser.
 */

const L1_LABEL: Record<string, string> = {
  uz: "O'zbekcha izoh",
  ru: "Пояснение по-русски",
};

export function LessonSections({
  sections,
  language = "en",
}: {
  sections: LessonSection[];
  /** Which second language the notes are in, for their summary label. */
  language?: string;
}) {
  return (
    <div className="lp-lesson">
      {sections.map((section, i) => (
        <section key={section.id} className="lp-section">
          <h2 className="lp-section-h">
            <span className="lp-section-n">{String(i + 1).padStart(2, "0")}</span>
            {section.heading}
          </h2>
          <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(section.html) }} />

          {/* Collapsed by default, and native <details> so it costs no
              JavaScript. A learner who reads English fine should see one quiet
              line, not a second copy of the section they have just read; a
              learner who is stuck is one click from help. */}
          {section.html_l1 ? (
            <details className="lp-l1">
              <summary>{L1_LABEL[language] ?? "In your language"}</summary>
              <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(section.html_l1) }} />
            </details>
          ) : null}
        </section>
      ))}
    </div>
  );
}
