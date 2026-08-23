import type { Metadata } from "next";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../marketing";

export const metadata: Metadata = {
  title: "IELTS Speaking Practice — Full 3-Part Mock with an AI Examiner",
  description:
    "Practise IELTS Speaking out loud: a full three-part mock with an AI examiner, Part-2 cue-card drills, and a tutor that reacts and teaches while you talk. Scored on the four official criteria.",
  alternates: { canonical: "/ielts-speaking-practice" },
  robots: { index: true, follow: true },
};

export default function IeltsSpeakingPracticePage() {
  return (
    <article>
      <PageTitle
        title="IELTS Speaking practice you actually speak to"
        lead="Most IELTS apps hand you a list of questions and a recording button. EngProgress runs the real thing: a three-part mock with an AI examiner that listens, follows up, and pushes you the way a human examiner does — then tells you what your speaking is missing."
      />

      <Sec title="Three ways to practise, depending on how much time you have">
        <P>
          <B>The full three-part mock.</B> The whole exam, in order and in real time. Part 1 is the
          interview — identity, home, work or study, and two familiar topics. Part 2 is the long turn:
          you get the cue card, your <B>one minute of preparation</B>, and then you talk for up to two
          minutes while the examiner stays quiet, exactly as on the day. Part 3 is the discussion, where
          the questions abstract away from your own life and the examiner probes your reasoning. You are
          scored on the four official criteria — Fluency &amp; Coherence, Lexical Resource, Grammatical
          Range &amp; Accuracy, and Pronunciation.
        </P>
        <P>
          <B>Part-2 practice.</B> The cue card is where most candidates lose the band, because two
          uninterrupted minutes is far longer than it sounds. Push to talk, get a fresh card, and drill
          the long turn on its own without sitting a whole exam.
        </P>
        <P>
          <B>The speaking tutor.</B> Not a test — a lesson. You talk, and it reacts to what you actually
          said, corrects you in the moment, and teaches the phrase you were reaching for. It will switch
          to Uzbek to explain something and then bring you back into English, which is the part a
          question list can never do. There is a free-talk mode too, when you just want the practice
          rather than the syllabus.
        </P>
      </Sec>

      <Sec title="Why speaking to an AI is worth your time">
        <UL>
          <LI>
            <B>It is available at 6am.</B> The reason most candidates under-practise speaking is
            logistical, not motivational: finding a partner at your level who will sit a full mock with
            you is hard, and finding one who will do it four times a week is impossible.
          </LI>
          <LI>
            <B>It does not get bored or go easy on you.</B> A friend running your mock will accept a
            short answer and move on. The examiner follows up.
          </LI>
          <LI>
            <B>Nobody is watching.</B> The single biggest thing holding back speaking bands is
            embarrassment, and it disappears when the room is empty.
          </LI>
        </UL>
      </Sec>

      <Sec title="How we talk about speaking scores">
        <P>
          We will be straight with you about this, because it matters. Our Writing grader is calibrated
          against expert-judged essays and tuned to sit slightly below a human examiner. Our Speaking
          grader is <B>deliberately conservative but not yet independently calibrated</B> — it is built
          on the official public band descriptors and marks strictly, and we are not going to claim more
          for it than that until it has been measured against expert-marked speaking tests.
        </P>
        <P>
          So treat the speaking band as a strict, directional signal and treat the feedback as the real
          product: what capped you, on which criterion, with the fix. Practising the long turn four times
          a week is what moves your band. For a number you can lean on today, use{" "}
          <A href="/ielts-writing-practice">Writing</A>, where the calibration work is done.
        </P>
      </Sec>

      <Sec title="Practise the other three skills too">
        <P>
          Speaking sits alongside <A href="/ielts-writing-practice">Writing</A>,{" "}
          <A href="/ielts-reading-practice">Reading</A> and{" "}
          <A href="/ielts-listening-practice">Listening</A> in one account, with a single view of your
          current band against your target — see <A href="/ielts-practice">all four skills</A>.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Can I really do a full IELTS speaking test with an AI?",
            a: "Yes — all three parts, in order, in real time. Part 1 interview, Part 2 cue card with the one-minute preparation and the two-minute long turn, and the Part 3 discussion. The examiner listens to your answers and asks follow-up questions based on what you said, rather than reading from a fixed script.",
          },
          {
            q: "Do I need a microphone or any special equipment?",
            a: "Just a browser and a microphone — the one built into your laptop or phone is fine. There is nothing to install. A quiet room and headphones will give you a cleaner recording, but neither is required.",
          },
          {
            q: "How accurate is the AI speaking band?",
            a: "It is built on the official public band descriptors and marks strictly and conservatively, but unlike our writing grader it has not yet been calibrated against expert-marked speaking tests. Treat it as a strict directional signal rather than a precise prediction, and treat the per-criterion feedback as the thing to act on.",
          },
          {
            q: "What is the difference between the mock and the tutor?",
            a: "The mock is an exam: it stays in role, does not help you, and gives you a band at the end. The tutor is a lesson: it interrupts, corrects you in the moment, teaches the vocabulary you were reaching for, and will explain in Uzbek before switching you back to English.",
          },
          {
            q: "How many speaking mocks do I get?",
            a: "The free plan includes one full mock per month, since a live examiner session is by far the most expensive thing on the platform to run. Paid plans include more; see the pricing section on our home page.",
          },
        ]}
      />

      <Cta
        title="Sit a full speaking mock tonight"
        sub="Three parts, an AI examiner that follows up, and per-criterion feedback the moment you finish."
      />
      <Related current="/ielts-speaking-practice" />
    </article>
  );
}
