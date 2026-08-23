import type { Metadata } from "next";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../marketing";

export const metadata: Metadata = {
  title: "IELTS Listening Practice — Full 4-Part Tests with Original Audio",
  description:
    "Full 4-part IELTS Listening tests with original multi-voice audio, every real question type, band scores, transcripts and per-answer explanations. Six difficulty levels, plus 10-minute quick practices.",
  alternates: { canonical: "/ielts-listening-practice" },
  robots: { index: true, follow: true },
};

export default function IeltsListeningPracticePage() {
  return (
    <article>
      <PageTitle
        title="IELTS Listening practice with audio made for the test"
        lead="Most free listening practice is a podcast with questions bolted on. The real exam is four parts with a specific shape — a transactional conversation, a monologue, a group discussion, an academic lecture — and voices that overlap, correct themselves and change their minds. That is what we generate."
      />

      <Sec title="Full tests in the real structure">
        <P>
          Every test runs the authentic four parts, with <B>original multi-voice studio audio</B> —
          different speakers, different accents, natural pace, and the self-corrections that trip
          candidates up (&ldquo;it&rsquo;s on Wednesday — sorry, Thursday&rdquo;). Questions are grouped
          the way Cambridge groups them, with the per-group word limit shown, because writing three words
          where two are allowed is a mark lost for a reason that has nothing to do with listening.
        </P>
        <UL>
          <LI>Form, note, table, summary and sentence completion</LI>
          <LI>Map and plan labelling, and diagram labelling</LI>
          <LI>Matching, flow-chart completion, and classification</LI>
          <LI>Multiple choice, and choose-two multiple choice</LI>
        </UL>
        <P>
          <B>Six difficulty levels</B>, so you can practise at a level that is genuinely hard for you
          rather than one that flatters you — and short <B>single-part quick practices</B> for when you
          have ten minutes rather than forty.
        </P>
      </Sec>

      <Sec title="What you get after you submit">
        <P>
          A band score, then the useful part: the <B>full transcript</B> with each answer located in it,
          so you can see the exact moment the information went past you — and an explanation for each one
          you missed. Most listening errors are not &ldquo;I could not hear it&rdquo;. They are: the
          speaker said a synonym, the answer was corrected a second later, or you were still writing the
          previous answer. Seeing which of those it was is what changes your score.
        </P>
      </Sec>

      <Sec title="Fresh audio, never a recycled track">
        <P>
          Because the audio is <B>generated</B> rather than drawn from a fixed library of recordings, you
          cannot run out and you cannot accidentally sit a test you have already memorised. Practice
          books have a hard limit; this does not.
        </P>
        <P>
          All content is original. We never host or reproduce official past papers or copyrighted
          practice books.
        </P>
      </Sec>

      <Sec title="The other three skills">
        <P>
          Listening sits alongside <A href="/ielts-writing-practice">Writing</A>,{" "}
          <A href="/ielts-reading-practice">Reading</A> and{" "}
          <A href="/ielts-speaking-practice">Speaking</A> in one account, with one view of your current
          band against your target — see <A href="/ielts-practice">all four together</A>.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Is it a full 4-part IELTS Listening test?",
            a: "Yes — the authentic four-part structure with original multi-voice audio, graded to a band score. There are also short single-part quick practices when you do not have time for a full test.",
          },
          {
            q: "Which listening question types are included?",
            a: "Form, note, table, summary and sentence completion, map, plan and diagram labelling, matching, flow-chart completion, classification, multiple choice and choose-two multiple choice — grouped the way the real exam groups them, with the word limit shown per group.",
          },
          {
            q: "Do I get a transcript?",
            a: "Yes. After you submit you get the full transcript with each answer located in it, plus an explanation of what caught you out on the ones you missed — a synonym, a self-correction, or simply still writing the previous answer.",
          },
          {
            q: "Is the audio real recordings or synthetic?",
            a: "It is generated multi-voice audio, produced in the style and pace of the real exam with multiple speakers and accents. That is what makes it unlimited — you cannot exhaust it or memorise it the way you exhaust a practice book's CD.",
          },
          {
            q: "Can I choose the difficulty?",
            a: "Yes — there are six difficulty levels, so you can practise where it is genuinely challenging rather than at a level that flatters your score.",
          },
        ]}
      />

      <Cta
        title="Sit a full listening test free"
        sub="Four parts, original audio, a band score, and the transcript showing exactly what you missed."
      />
      <Related current="/ielts-listening-practice" />
    </article>
  );
}
