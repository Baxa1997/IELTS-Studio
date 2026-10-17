import { BODY, CTA_FILL, DISPLAY, INK, LINE, PANEL, SANS, WHITE } from "@/app/_landing/_lib/design";
import type { MessageKey, Translate } from "@/lib/i18n";

const STEPS: { title: MessageKey; body: MessageKey }[] = [
  { title: "free.how1Title", body: "free.how1Body" },
  { title: "free.how2Title", body: "free.how2Body" },
  { title: "free.how3Title", body: "free.how3Body" },
];

/** The free practice in three steps, under the list — an ordered list, since
 *  the order is the point. */
export function HowItWorks({ t }: { t: Translate }) {
  return (
    <section aria-labelledby="how-it-works" style={{ marginTop: "clamp(48px,7vw,80px)" }}>
      <h2
        id="how-it-works"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: "clamp(21px,2.3vw,26px)",
          letterSpacing: "-0.02em",
          color: INK,
          margin: 0,
        }}
      >
        {t("free.howTitle")}
      </h2>
      <ol
        style={{
          listStyle: "none",
          padding: 0,
          margin: "22px 0 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(250px,100%),1fr))",
          gap: 16,
        }}
      >
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            style={{
              border: `1px solid ${LINE}`,
              borderRadius: 16,
              padding: "18px 20px",
              background: PANEL,
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 30,
                height: 30,
                borderRadius: 999,
                background: CTA_FILL,
                color: WHITE,
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {i + 1}
            </span>
            <h3
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 18,
                color: INK,
                margin: "12px 0 0",
              }}
            >
              {t(step.title)}
            </h3>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 15,
                lineHeight: 1.6,
                color: BODY,
                margin: "6px 0 0",
              }}
            >
              {t(step.body)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
