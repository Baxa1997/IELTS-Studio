import type { Metadata } from "next";

import { BODY, BRAND, INK, LINE, PANEL } from "@/app/_landing/_lib/design";
import { PLAN_ORDER, planTier, type PlanTier } from "@/lib/billing/plans";
import { freePracticePage } from "@/lib/free-practice/links";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../_components/marketing";

/**
 * The prices, on a page a signed-out visitor and a crawler can read.
 *
 * WHY THIS IS NOT `/pricing`. That route is the signed-in checkout
 * (app/(app)/pricing, `requireOrgUser`) and robots.txt disallows it, so until
 * this page the only public statement of what the product costs was a section
 * of the landing page and a list in llms.txt — nothing an answer engine asked
 * "how much is EngProgress?" could cite as a page, and nothing a learner
 * comparing tools could be sent to. Checkout stays where it is; this explains.
 *
 * ⚠️ EVERY NUMBER IS READ FROM `PLAN_TIERS`, NONE IS TYPED — the table, the
 * prose, the FAQ answers and the Offer JSON-LD. The quota code enforces those
 * limits and Stripe charges those prices, so a figure written here by hand goes
 * on promising the old one the day the plan changes (the same rule as
 * app/_landing/_lib/free-plan.ts and llms.txt).
 */

const PATH = "/ielts-practice-pricing";

const TIERS = PLAN_ORDER.map(planTier);
const FREE = planTier("trial");
const PAID = TIERS.filter((t) => t.price !== null && t.price > 0);
/** The cheapest plan billed month by month — "from $X a month". */
const FROM = PAID.filter((t) => t.months === 1).reduce((a, b) => ((a.price ?? 0) <= (b.price ?? 0) ? a : b));

const price = (t: PlanTier) =>
  t.price === null ? "Custom" : t.price === 0 ? "Free" : `$${t.price} ${t.months === 1 ? "a month" : `per ${t.months} months`}`;
const perMonth = (n: number | null) => (n === null ? "Unlimited" : `${n} a month`);
const library = (t: PlanTier) => (t.libraryLimit === null ? "Unlimited" : `${t.libraryLimit} practices`);

const ROWS: { label: string; cell: (t: PlanTier) => string }[] = [
  { label: "Price", cell: price },
  { label: "AI gradings (Writing and Speaking feedback)", cell: (t) => perMonth(t.gradeLimit) },
  { label: "Freshly generated practice sets", cell: (t) => perMonth(t.generateLimit) },
  { label: "Live three-part speaking mocks", cell: (t) => perMonth(t.fullMockLimit) },
  { label: "Ready-made practice library", cell: library },
];

const FAQ = [
  {
    q: `Is ${SITE_NAME} free?`,
    a: `Yes, in two ways. Without an account you can do one free practice a day in Writing, Reading, Listening and CEFR Multilevel, and check an essay with the free writing checker. With a free account you get ${FREE.gradeLimit} AI gradings, ${FREE.generateLimit} generated practice sets and ${FREE.fullMockLimit} live speaking mock every month, plus ${FREE.libraryLimit} practices from the ready-made library. The free plan does not expire.`,
  },
  {
    q: `How much does ${SITE_NAME} cost?`,
    a: `${PAID.map((t) => `${t.name} is ${price(t).replace(/^\$/, "US$")}`).join("; ")}. Prices are in US dollars. The free plan costs nothing and needs no card.`,
  },
  {
    q: "What happens when I reach my monthly limit?",
    a: "Nothing is deleted. Your past work, feedback and bands stay open; you simply cannot start a new graded attempt of that kind until the limit resets at the start of the next month, or until you move to a larger plan.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Paid plans renew automatically until cancelled, and a cancellation takes effect at the end of the period you have already paid for. The full terms are in the Terms of Service.",
  },
  {
    q: "Do I need a card to start?",
    a: "No. The free daily practice needs no account at all, and a free account needs no card. You are only asked for payment when you choose a paid plan.",
  },
  {
    q: "Is there a price for schools and education centres?",
    a: "Education centres are set up separately from these plans: a centre gets teachers, groups, homework and reports for its students. Apply from the sign-up page or contact us for the terms.",
  },
  {
    q: "Are the bands official IELTS results?",
    a: `No. ${SITE_NAME} is an independent practice platform, not affiliated with or endorsed by IELTS. Bands are practice estimates, and the grader is deliberately conservative: between two bands it gives the lower one and says what the higher band needs.`,
  },
];

export const metadata: Metadata = {
  title: `${SITE_NAME} Pricing — Free Plan and Paid Plans from $${FROM.price} a Month`,
  description: `What ${SITE_NAME} costs: a free plan that does not expire, and paid plans from $${FROM.price} a month for more AI gradings, practice sets and live speaking mocks. Every limit, in one table.`,
  alternates: { canonical: PATH },
  robots: { index: true, follow: true },
};

/** The plans as Offers on the product, so "how much is it" has a structured
 *  answer whose URL is a page — the landing page's Offers point here too. */
const offersJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: `${SITE_NAME} — IELTS and CEFR practice`,
  url: absoluteUrl(PATH),
  offers: TIERS.flatMap((t) =>
    t.price === null
      ? []
      : [
          {
            "@type": "Offer",
            name: t.name,
            price: String(t.price),
            priceCurrency: "USD",
            description: `${perMonth(t.gradeLimit)} AI gradings, ${perMonth(t.generateLimit)} practice sets, ${perMonth(t.fullMockLimit)} live speaking mocks${t.months === 1 ? "" : `; one payment covers ${t.months} months`}`,
            url: absoluteUrl(PATH),
          },
        ],
  ),
};

/** One column per plan. Scrolls inside itself on a narrow screen, like
 *  `CompareTable` — which is two-product and cannot hold four plans. */
function PlanTable() {
  const cell: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: 14.5,
    lineHeight: 1.55,
    color: BODY,
    verticalAlign: "top",
    textAlign: "left",
    borderTop: `1px solid ${LINE}`,
  };
  return (
    <div style={{ overflowX: "auto", margin: "16px 0 8px", border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ ...cell, borderTop: "none", width: "28%" }} />
            {TIERS.map((t) => (
              <th key={t.id} scope="col" style={{ ...cell, borderTop: "none", fontWeight: 800, color: t.id === FROM.id ? BRAND : INK }}>
                {t.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.label}>
              <th scope="row" style={{ ...cell, fontWeight: 700, color: INK }}>
                {r.label}
              </th>
              {TIERS.map((t) => (
                <td key={t.id} style={cell}>
                  {r.cell(t)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PricingInfoPage() {
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offersJsonLd) }} />
      <PageTitle
        path={PATH}
        title={`${SITE_NAME} pricing`}
        lead={`Practise for free every day without an account, keep a free plan for as long as you like, and pay from $${FROM.price} a month only when you want more graded feedback than the free plan holds.`}
      />

      <Sec title="The plans, side by side">
        <P>
          Every plan covers the same product: IELTS Writing, Reading, Listening and Speaking, and the CEFR / Multilevel
          papers. What changes is <B>how much you can do in a month</B>.
        </P>
        <PlanTable />
        <P>
          Prices are in US dollars. Paid plans renew automatically until cancelled; {planTier("enterprise").name} is one
          payment covering {planTier("enterprise").months} months.
        </P>
      </Sec>

      <Sec title="What you can do without paying">
        <UL>
          <LI>
            <B>One free practice a day, no account.</B> <A href={freePracticePage("writing")}>Writing</A>,{" "}
            <A href={freePracticePage("reading")}>Reading</A>, <A href={freePracticePage("listening")}>Listening</A> and{" "}
            <A href={freePracticePage("cefr")}>CEFR Multilevel</A> — the same practice and the same marking a signed-in
            learner gets.
          </LI>
          <LI>
            <B>The free writing checker.</B> Paste a Task 1 or Task 2 answer into <A href="/grade">the checker</A> and get
            a band per criterion.
          </LI>
          <LI>
            <B>A free account.</B> {FREE.gradeLimit} AI gradings, {FREE.generateLimit} generated practice sets and{" "}
            {FREE.fullMockLimit} live speaking mock every month, plus {FREE.libraryLimit} practices from the ready-made
            library. It does not expire and needs no card.
          </LI>
          <LI>
            <B>The score calculators.</B> The <A href="/ielts-band-score-calculator">IELTS band score calculator</A> and
            the <A href="/multilevel-score-calculator">Multilevel score calculator</A> are free for everyone.
          </LI>
        </UL>
      </Sec>

      <Sec title="Which plan fits">
        <UL>
          <LI>
            <B>{FREE.name}</B> — you are finding out your level, or practising a little each week.
          </LI>
          {PAID.map((t) => (
            <LI key={t.id}>
              <B>
                {t.name} ({price(t)})
              </B>{" "}
              —{" "}
              {t.gradeLimit !== null
                ? `you write regularly: ${t.gradeLimit} graded attempts a month is about one every weekday.`
                : t.months === 1
                  ? "your exam is close and you want to practise every day without counting attempts."
                  : `the same unlimited practice, paid once for ${t.months} months — the lower price if you know you will prepare for a whole term.`}
            </LI>
          ))}
        </UL>
      </Sec>

      <Sec title="Schools and education centres">
        <P>
          A centre is not on these plans. It gets its own workspace — teachers, groups, homework pinned so a whole class
          sits the same task, and a report per student. See <A href="/for-education-centers">EngProgress for education
          centres</A> or <A href="/contact">contact us</A>.
        </P>
      </Sec>

      <Faq items={FAQ} />

      <Cta title="Start with the free plan" sub="No card. Your first graded essay takes about a minute to come back." />
      <Related current={PATH} />
    </article>
  );
}
