import type { Metadata } from "next";

import { A, B, P, PageTitle, Sec } from "../marketing";

const EMAIL = "bahridnurullav@gmail.com";

export const metadata: Metadata = {
  title: "Contact EngProgress — Support & Feedback",
  description:
    "Get in touch with EngProgress: support, billing questions, feedback on a band score, or anything else. We read every message.",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <article>
      <PageTitle
        title="Contact us"
        lead="Questions, feedback, billing, or a band score you want to query — we read every message and usually reply within one business day."
      />

      <Sec title="Email">
        <P>
          The fastest way to reach us is email:{" "}
          <A href={`mailto:${EMAIL}`}>{EMAIL}</A>. Write in whatever language is comfortable —
          English, O&lsquo;zbekcha, or Русский.
        </P>
      </Sec>

      <Sec title="Questioning a band score?">
        <P>
          Our grader is <B>deliberately conservative</B> — when an essay sits between two bands it
          rounds down and names what the higher band requires, so your practice band never
          overstates your exam-day band. If a score still looks wrong, email us a link to the
          attempt (or the essay text and the band you received) and we will review how the grader
          reasoned. Calibration reports like this are genuinely useful to us.
        </P>
      </Sec>

      <Sec title="Billing & accounts">
        <P>
          For subscription, payment, or account-deletion requests, email from the address you
          signed up with so we can verify it&rsquo;s you. Refund and cancellation terms are in the{" "}
          <A href="/terms">Terms of Service</A>; how we handle your data is in the{" "}
          <A href="/privacy">Privacy Policy</A>.
        </P>
      </Sec>
    </article>
  );
}
