import type { Metadata } from "next";
import Link from "next/link";

import { B, LegalTitle, LI, P, Section, UL } from "../legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of EngProgress — accounts, subscription plans, fair use, AI band estimates, intellectual property and liability.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "bahridnurullav@gmail.com";

export default function TermsPage() {
  return (
    <article>
      <LegalTitle title="Terms of Service" updated="July 9, 2026" />

      <Section n={1} title="Acceptance of Terms">
        <P>
          These Terms of Service (the &ldquo;Terms&rdquo;) are a binding agreement between you and{" "}
          <B>EngProgress</B> (&ldquo;we&rdquo;, &ldquo;us&rdquo;), the operator of the English exam
          practice platform at <B>engprogress.com</B>. Under the Civil Code of the Republic of
          Uzbekistan these Terms constitute a public offer: by registering an account or using the
          service (including the free, no-login essay checker) you accept them in full.
        </P>
        <P>
          If you do not agree with any part of the Terms, do not use the service. Our{" "}
          <Link href="/privacy" style={{ color: "#3B43B5", fontWeight: 600 }}>Privacy Policy</Link>{" "}
          is part of this agreement.
        </P>
      </Section>

      <Section n={2} title="Description of the Service">
        <P>
          EngProgress is an online platform for practising English exams. It generates original,
          exam-format practice material with artificial intelligence and grades your work with an AI
          examiner, including:
        </P>
        <UL>
          <LI>IELTS-format Writing practice (Task 1 and Task 2) with per-criterion band estimates, feedback, fixes and model answers;</LI>
          <LI>IELTS-format Reading and Listening practice tests with automatic marking and explanations;</LI>
          <LI>CEFR and Multilevel practice tracks;</LI>
          <LI>level diagnostics, progress tracking and a personal study plan.</LI>
        </UL>
        <P>
          <B>All scores are AI estimates for practice purposes.</B> They are deliberately calibrated
          to be conservative, they are not official IELTS, CEFR or Multilevel results, and no score
          or improvement on EngProgress guarantees any result in a real examination.
        </P>
        <P>
          The service is intended for <B>personal, individual use</B>. Feature availability and
          monthly usage limits depend on your subscription plan (Section 4). We aim to keep the
          service available at all times but do not guarantee uninterrupted operation; maintenance
          windows and third-party outages may occur.
        </P>
      </Section>

      <Section n={3} title="Registration and Account">
        <UL>
          <LI>You must provide accurate registration details (name and a valid email address) and keep them up to date.</LI>
          <LI>You are responsible for keeping your credentials secure and for all activity under your account.</LI>
          <LI>One account per person. Accounts are personal and may not be shared, sold or transferred.</LI>
          <LI>You must be at least 16 years old; users under 18 need the consent of a parent or legal guardian.</LI>
        </UL>
      </Section>

      <Section n={4} title="Subscription Plans and Payment">
        <UL>
          <LI>
            <B>Free</B> — a monthly allowance of AI gradings and generated practice sets, plus the
            public essay checker.
          </LI>
          <LI><B>Standard</B> — a larger monthly allowance of gradings and practice sets, billed monthly.</LI>
          <LI><B>Pro</B> — unlimited gradings and practice sets, billed monthly.</LI>
          <LI><B>Enterprise</B> — unlimited use where one payment covers three months.</LI>
        </UL>
        <P>
          Current prices and exact limits are shown on the{" "}
          <Link href="/#pricing" style={{ color: "#3B43B5", fontWeight: 600 }}>pricing page</Link>{" "}
          and at checkout. Unlimited plans are subject to fair personal use (Section 5).
        </P>
        <UL>
          <LI>
            Card payments are processed by <B>Stripe</B> on Stripe-hosted pages; payments in Uzbek
            so&lsquo;m may be processed by local payment services where available. We never store
            full card numbers.
          </LI>
          <LI>
            Subscriptions <B>renew automatically</B> (monthly plans every month; Enterprise every
            three months) until cancelled. You can cancel at any time; cancellation takes effect at
            the end of the paid period, and you keep access until then.
          </LI>
          <LI>
            Fees are non-refundable except for duplicate charges, proven billing errors, or where a
            refund is required by applicable law.
          </LI>
          <LI>
            If a renewal payment fails, we may retry it; if payment cannot be collected, the account
            is downgraded to the Free plan. Your data is not deleted on downgrade.
          </LI>
          <LI>We may change prices with at least 14 days&rsquo; notice; changes apply from your next billing period.</LI>
        </UL>
      </Section>

      <Section n={5} title="Fair Use and Prohibited Conduct">
        <P>You must not:</P>
        <UL>
          <LI>share, resell or provide access to your account or to the service&rsquo;s AI features to third parties;</LI>
          <LI>access the service with bots, scrapers or other automated means, or circumvent rate limits, quotas or security measures;</LI>
          <LI>
            upload content you have no right to use — including official past exam papers or other
            copyrighted test materials (e.g. Cambridge practice books);
          </LI>
          <LI>submit unlawful, harmful or abusive content;</LI>
          <LI>reverse engineer, copy or create derivative services from the platform, its prompts or its grading system;</LI>
          <LI>present EngProgress scores as official examination results or certificates.</LI>
        </UL>
        <P>
          &ldquo;Unlimited&rdquo; plans cover realistic personal study by one person. We may throttle
          or suspend accounts whose usage patterns indicate automation, sharing or resale. Material
          violations may lead to termination without refund (Section 8).
        </P>
      </Section>

      <Section n={6} title="Intellectual Property and Your Content">
        <UL>
          <LI>
            The platform — its software, design, prompts, grading methodology and generated practice
            material — belongs to EngProgress. You receive a limited, non-exclusive licence to use it
            for personal, non-commercial exam preparation.
          </LI>
          <LI>
            <B>You keep ownership of the writing you submit.</B> You grant us a licence to process it
            to operate the service (grading, feedback, transcription, history) and to use{" "}
            <B>anonymised</B> excerpts, stripped of personal details, to calibrate and improve
            grading accuracy. You may object to the calibration use at any time (see the Privacy
            Policy).
          </LI>
          <LI>
            Model answers and practice materials generated for you may be used for your own study;
            they may not be republished or sold.
          </LI>
          <LI>
            IELTS® is a registered trademark of its respective owners. EngProgress is{" "}
            <B>not affiliated with or endorsed by</B> IELTS®, the British Council, IDP, or Cambridge
            Assessment English; trademarks are used only to describe the exam format the practice
            follows.
          </LI>
        </UL>
      </Section>

      <Section n={7} title="Disclaimers and Limitation of Liability">
        <P>
          The service is provided <B>&ldquo;as is&rdquo;</B>. AI-generated content and AI grading can
          contain mistakes; band estimates are informational and may differ from the score you
          receive in a real exam. We are not liable for examination outcomes, admission or
          immigration decisions, or any decision you make based on the service&rsquo;s output.
        </P>
        <P>
          To the maximum extent permitted by law, our total liability under these Terms is limited to
          the fees you paid for the service in the three months preceding the claim. We are not
          liable for indirect or consequential damages, including lost profits, lost data or
          reputational harm, or for failures of third-party services (payment providers, AI
          providers, hosting).
        </P>
      </Section>

      <Section n={8} title="Termination">
        <UL>
          <LI>You may stop using the service or delete your account at any time; active subscriptions run to the end of the paid period.</LI>
          <LI>
            We may suspend or terminate an account immediately for material breach of these Terms
            (including Section 5), where required by law, or for non-payment.
          </LI>
          <LI>
            After account deletion, personal data is removed within 30 days as described in the
            Privacy Policy. Export anything you want to keep before deleting your account.
          </LI>
        </UL>
      </Section>

      <Section n={9} title="Amendments">
        <P>
          We may update these Terms as the service evolves. For material changes we will give at
          least <B>14 days&rsquo; notice</B> by email or a prominent notice in the service; changes
          required for security or by law may take effect immediately. Continued use after the
          effective date constitutes acceptance of the updated Terms.
        </P>
      </Section>

      <Section n={10} title="Governing Law and Contact">
        <P>
          These Terms are governed by the law of the Republic of Uzbekistan. Disputes that cannot be
          resolved by negotiation are subject to the competent courts of the Republic of Uzbekistan.
        </P>
        <P>
          <B>EngProgress</B> — engprogress.com
          <br />
          Email: <B>{CONTACT_EMAIL}</B>
          <br />
          Republic of Uzbekistan
        </P>
      </Section>
    </article>
  );
}
