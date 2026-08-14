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
export function LessonSections({ sections }: { sections: LessonSection[] }) {
  return (
    <div className="lp-lesson">
      {sections.map((section) => (
        <section key={section.id} style={{ marginBottom: 34 }}>
          <h2
            style={{
              fontFamily: "var(--font-serif4), Georgia, serif",
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: "-.01em",
              color: "#15171C",
              margin: "0 0 12px",
            }}
          >
            {section.heading}
          </h2>
          <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(section.html) }} />
        </section>
      ))}
    </div>
  );
}
