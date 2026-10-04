import { BODY, DISPLAY, INK, LINE, SANS } from "@/app/_landing/_lib/design";

/**
 * "Questions about the free practice" — the visible half of the page's
 * FAQPage data, rendered from the same list (../_lib/faq) so what a reader sees
 * and what an answer engine reads cannot drift apart. Laid out like the blog's
 * "Questions readers ask", so the two read as one site.
 */
export function PracticeFaq({ faq, title }: { faq: { q: string; a: string }[]; title: string }) {
  return (
    <section aria-labelledby="questions" style={{ maxWidth: 760, marginTop: "clamp(40px,6vw,64px)" }}>
      <h2
        id="questions"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: "-0.02em",
          color: INK,
          margin: "0 0 8px",
        }}
      >
        {title}
      </h2>
      {faq.map((f) => (
        <div key={f.q} style={{ padding: "16px 0", borderTop: `1px solid ${LINE}` }}>
          <h3
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 18,
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              color: INK,
              margin: 0,
            }}
          >
            {f.q}
          </h3>
          <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.65, color: BODY, margin: "8px 0 0" }}>{f.a}</p>
        </div>
      ))}
    </section>
  );
}
