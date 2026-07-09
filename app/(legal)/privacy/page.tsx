import type { Metadata } from "next";

import { B, LegalTitle, LI, P, Section, UL } from "../legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How EngProgress collects, uses, stores and protects your data — accounts, submitted writing, AI grading, payments and your rights.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "bahridnurullav@gmail.com";

export default function PrivacyPage() {
  return (
    <article>
      <LegalTitle title="Privacy Policy" updated="July 9, 2026" />

      <Section n={1} title="General Provisions">
        <P>
          This Privacy Policy explains how <B>EngProgress</B> (&ldquo;EngProgress&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) collects, uses, stores and protects personal data when you use the
          EngProgress platform at <B>engprogress.com</B> — an online service for practising English
          exams (IELTS-format Writing, Reading and Listening, CEFR and Multilevel tracks) with
          AI-generated practice material and AI feedback.
        </P>
        <P>
          The service is operated from the Republic of Uzbekistan and processes personal data in
          accordance with the legislation of the Republic of Uzbekistan on personal data. If you use
          the service from another country, you consent to your data being processed as described in
          this Policy.
        </P>
        <P>
          By registering an account or using the service (including the free, no-login essay
          checker), you accept this Policy.
        </P>
      </Section>

      <Section n={2} title="Data We Collect">
        <UL>
          <LI>
            <B>Account data</B> — your name, email address, phone number (if provided) and a securely
            hashed password. If you sign in with Google, we receive your name, email address and
            profile picture from your Google account.
          </LI>
          <LI>
            <B>Learning content</B> — the essays, letters and answers you submit for practice and
            grading, including photos or PDF files of handwritten work you upload for transcription.
          </LI>
          <LI>
            <B>Results and progress</B> — AI band estimates, per-criterion feedback, revision
            history, diagnostic results, study-plan settings and practice statistics.
          </LI>
          <LI>
            <B>Payment data</B> — your subscription plan, transaction references and billing status.
            Card payments are processed by our payment providers (see Section 5);{" "}
            <B>full card numbers never reach our servers</B>.
          </LI>
          <LI>
            <B>Technical data</B> — IP address, browser and device information, and service logs used
            for security, debugging and abuse prevention.
          </LI>
          <LI>
            <B>Free checker (no login)</B> — if you use the public essay checker without an account,
            we process the text or file you submit to produce the grade and store a salted,
            irreversible hash of your IP address for rate limiting. We do not link this to any
            identity.
          </LI>
        </UL>
      </Section>

      <Section n={3} title="How We Use Your Data">
        <UL>
          <LI>To create and manage your account and personal workspace.</LI>
          <LI>
            To deliver the service: generate practice material at your level, grade your writing and
            answers, transcribe uploaded photos/PDFs, provide feedback and model answers, and track
            your progress towards your target score.
          </LI>
          <LI>To process subscription payments and manage plan limits.</LI>
          <LI>To respond to support requests.</LI>
          <LI>To prevent fraud, abuse and unauthorised access (rate limits, quotas, security logs).</LI>
          <LI>
            To improve grading accuracy: we may use <B>anonymised</B> excerpts of submitted writing,
            stripped of personal details, to calibrate the AI examiner against expert marking. You may
            object to this use at any time by contacting us.
          </LI>
        </UL>
        <P>
          We do <B>not</B> sell personal data, and we do not use your data for third-party
          advertising.
        </P>
      </Section>

      <Section n={4} title="AI Processing">
        <P>
          Grading, feedback, transcription and practice generation are performed by artificial
          intelligence models. Your submitted text (and uploaded files, when you use the upload
          feature) is transmitted from our servers to our AI infrastructure providers — currently
          Google Cloud (Gemini models) and Anthropic (Claude models) — solely to produce the result
          returned to you. All AI calls run server-side through our own service with usage logging;
          we do not permit these providers to use your content for advertising.
        </P>
        <P>
          Band scores produced by the service are <B>automated estimates for practice purposes</B>.
          They are not official IELTS results and are intentionally calibrated conservatively.
        </P>
      </Section>

      <Section n={5} title="Payment Processing">
        <P>
          Card payments are processed by <B>Stripe</B>, a PCI DSS–certified payment provider, on
          Stripe-hosted payment pages. Where available, payments in Uzbek so&lsquo;m are processed by
          local payment services (such as Payme or Click). We receive confirmation of payment and a
          transaction reference; we never receive or store your full card number, CVC or card PIN.
        </P>
      </Section>

      <Section n={6} title="Data Storage and Protection">
        <UL>
          <LI>Data is encrypted in transit (TLS) and at rest by our infrastructure providers.</LI>
          <LI>
            Every account&rsquo;s data is isolated at the database level (row-level security) — one
            user can never read another user&rsquo;s essays, results or profile.
          </LI>
          <LI>Access to production data is restricted to what is strictly necessary to operate the service.</LI>
          <LI>
            Your data is stored on cloud infrastructure located in the European Union and the United
            States (see Section 7 for providers).
          </LI>
          <LI>
            Data is kept while your account is active. If you delete your account, personal data is
            deleted within <B>30 days</B>; anonymised, aggregated statistics may be retained.
          </LI>
        </UL>
      </Section>

      <Section n={7} title="Disclosure to Third Parties">
        <P>We share data only with the service providers needed to run EngProgress:</P>
        <UL>
          <LI><B>Supabase</B> — database, authentication and file storage.</LI>
          <LI><B>Vercel</B> — application hosting and privacy-friendly, aggregated analytics.</LI>
          <LI><B>Google Cloud</B> and <B>Anthropic</B> — AI processing (Section 4).</LI>
          <LI><B>Stripe</B> and local payment services — payment processing (Section 5).</LI>
        </UL>
        <P>
          Each provider processes data under its own contractual data-protection obligations. We may
          also disclose data where required by the law of the Republic of Uzbekistan or a lawful
          request of a competent authority.
        </P>
      </Section>

      <Section n={8} title="Cookies and Analytics">
        <P>
          We use <B>essential cookies</B> to keep you signed in and to protect your session. Our
          analytics are aggregated and privacy-friendly; we do not use cross-site advertising
          trackers.
        </P>
      </Section>

      <Section n={9} title="Children">
        <P>
          The service is intended for users aged <B>16 and older</B>. Users under 18 should use the
          service with the consent of a parent or legal guardian. We do not knowingly collect data
          from children under 16; if you believe a child has provided us data, contact us and we will
          delete it.
        </P>
      </Section>

      <Section n={10} title="Your Rights">
        <P>You may at any time:</P>
        <UL>
          <LI>request access to the personal data we hold about you;</LI>
          <LI>correct inaccurate data (name, email and phone can be edited in your account);</LI>
          <LI>request deletion of your account and personal data;</LI>
          <LI>request an export of your submitted writing and results;</LI>
          <LI>withdraw consent to the anonymised calibration use described in Section 3;</LI>
          <LI>cancel your subscription (takes effect at the end of the paid period).</LI>
        </UL>
        <P>
          Send requests to <B>{CONTACT_EMAIL}</B>. We respond within <B>15 business days</B>.
        </P>
      </Section>

      <Section n={11} title="Changes to This Policy">
        <P>
          We may update this Policy as the service evolves. The current version is always published
          at engprogress.com/privacy with its &ldquo;Last updated&rdquo; date. For material changes we
          will notify you by email or a prominent notice in the service.
        </P>
      </Section>

      <Section n={12} title="Contact">
        <P>
          <B>EngProgress</B> — engprogress.com
          <br />
          Email: <B>{CONTACT_EMAIL}</B>
          <br />
          Republic of Uzbekistan
        </P>
        <P>
          EngProgress is not affiliated with or endorsed by IELTS®, the British Council, IDP, or
          Cambridge Assessment English.
        </P>
      </Section>
    </article>
  );
}
