import type { Metadata } from "next";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../marketing";

export const metadata: Metadata = {
  title: "IELTS Practice Online — Writing, Reading, Listening & Speaking",
  description:
    "Unlimited IELTS practice with strict AI band feedback across all four skills — Cambridge-style Writing tasks, Reading passages, full 4-part Listening tests and a three-part Speaking mock. Start free — no card needed.",
  alternates: { canonical: "/ielts-practice" },
  robots: { index: true, follow: true },
};

export default function IeltsPracticePage() {
  return (
    <article>
      <PageTitle
        title="IELTS practice that tells you your real band"
        lead="Most IELTS apps hand out generous scores to keep you happy. EngProgress — an AI platform covering all four IELTS skills, plus CEFR / Multilevel — does the opposite: calibrated, examiner-strict feedback, so the band you see in practice is the band you can expect on exam day."
      />

      <Sec title="Practice all four skills in one place">
        <P>
          <B>Writing.</B> Task 1 and Task 2 prompts generated fresh for every session, a distraction-free
          writing studio with a timer and autosave, and a deep evaluation of every criterion an examiner
          scores — Task Response, Coherence &amp; Cohesion, Lexical Resource, and Grammatical Range &amp;
          Accuracy. For each criterion you get the evidence from your own essay, the exact thing capping
          your band, and the fix. Then the part most tools skip: resubmit the <B>same essay</B> after
          revising and watch the band move — coaching across drafts, not score-and-forget.
        </P>
        <P>
          <B>Reading.</B> Original academic passages in the authentic exam layout with every real question
          type: matching headings, matching features, True/False/Not Given, Yes/No/Not Given, note and
          sentence completion, pick-two multiple choice and more. After you submit, each wrong answer comes
          with an explanation of <B>why the trap worked on you</B> — and analytics show which question
          types cost you the most marks.
        </P>
        <P>
          <B>Listening.</B> Full 4-part tests with multi-voice studio audio in the real exam structure —
          form, note, table and sentence completion, map labelling, matching, flow-charts, choose-two and
          multiple choice — graded to a band score with transcripts and trap explanations after you finish.
          Six difficulty levels, plus short single-part quick practices when you have ten minutes, not
          forty.
        </P>
        <P>
          <B>Speaking.</B> A full three-part mock with an AI examiner — the interview, the cue-card
          long turn with its preparation minute, and the discussion — scored on the four official
          criteria. Plus Part-2 cue-card drills on their own, and a{" "}
          <A href="/ielts-speaking-practice">tutor that reacts and teaches while you talk</A>.
        </P>
      </Sec>

      <Sec title="Why our band feedback is different">
        <UL>
          <LI>
            <B>Grounded in the official public band descriptors</B> — the same criteria examiners use, not
            the model&rsquo;s gut feeling.
          </LI>
          <LI>
            <B>Calibrated against expert-judged essays</B> and deliberately conservative: when your essay
            sits between two bands, we round down and tell you exactly what is missing for the higher one.
          </LI>
          <LI>
            <B>Evidence before numbers.</B> Every criterion score cites lines from your own writing, so you
            can see what the grade is based on — and argue with it by fixing the essay.
          </LI>
        </UL>
        <P>
          An inflated 7.0 feels good for a week and costs you on results day. An honest 6.5 with a named
          gap is something you can act on. That is what accurate should mean: the closest practice band to
          what a real examiner would give you on the day — try it on the free{" "}
          <A href="/grade">IELTS writing checker</A>, no account needed.
        </P>
      </Sec>

      <Sec title="Fresh tests, forever">
        <P>
          Practice books run out, and the second time through a test you are testing your memory, not your
          English. Every EngProgress practice is <B>generated new</B> in the authentic exam format — you
          will never see a recycled PDF or an answer you already know. If you specifically want the
          Cambridge-book experience, see our{" "}
          <A href="/cambridge-ielts-practice">Cambridge-style IELTS practice tests</A>.
        </P>
      </Sec>

      <Sec title="Beyond IELTS: CEFR and Multilevel">
        <P>
          Preparing for the <B>Uzbekistan Multilevel (DTM)</B> exam rather than IELTS? It is a different
          paper — five reading parts and thirty-five questions, marked to a CEFR level rather than a
          0&ndash;9 band — so we built it separately instead of pretending IELTS practice covers it.
          Reading and Writing are live; see{" "}
          <A href="/cefr-multilevel-practice">CEFR / Multilevel practice</A>.
        </P>
      </Sec>

      <Sec title="For teachers and education centres">
        <P>
          If you teach IELTS for a living, the same platform runs your centre: invite teachers, create
          groups, add students, assign practice as homework that the whole group sits identically, and
          read a per-student report across all four skills — plus attendance, timetabling, invoicing and
          payroll. See <A href="/for-education-centers">EngProgress for education centres</A>.
        </P>
      </Sec>

      <Sec title="Start free">
        <P>
          The free plan includes 5 AI-graded practices every month — no card required. Paid plans start at
          $5.99/month; see <A href="/#pricing">pricing</A>. Comparing tools? Read how EngProgress stacks up
          against <A href="/vs/engnovate">Engnovate</A> and <A href="/vs/ielts-gg">ielts.gg</A>.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Is EngProgress free?",
            a: "Yes — the free plan gives you 5 AI-graded practices per month (writing evaluations, reading or listening practice sets) with no card required. Paid plans start at $5.99/month for 25 practices and $14.99/month for unlimited.",
          },
          {
            q: "How accurate is the AI band score?",
            a: "The grader is calibrated against expert-judged essays and tuned to be slightly conservative — when in doubt it rounds down and names what is missing for the higher band. The goal is that your practice band matches or slightly understates your exam-day band, never overstates it.",
          },
          {
            q: "Which IELTS skills can I practice?",
            a: "All four. Writing (Task 1 and Task 2 with per-criterion feedback and a revision loop), Reading (all real question types with trap explanations), Listening (full 4-part tests with multi-voice audio and band scores), and Speaking (a full three-part live mock with an AI examiner, Part-2 practice, and an AI tutor). There is also a separate CEFR / Multilevel track for the Uzbekistan DTM exam, where Reading and Writing are live.",
          },
          {
            q: "Is the practice material real IELTS content?",
            a: "No — and that is deliberate. All content is original and AI-generated in the authentic exam format. We never host or copy official tests or copyrighted practice books, which also means you can never accidentally 'practice' a test you have already memorised.",
          },
          {
            q: "Is EngProgress affiliated with IELTS?",
            a: "No. EngProgress is an independent practice platform and is not affiliated with or endorsed by IELTS, the British Council, IDP, or Cambridge Assessment English.",
          },
        ]}
      />

      <Cta
        title="Find out your real band today"
        sub="Sign up free, submit one essay or take one test, and get examiner-strict feedback in minutes."
      />
      <Related current="/ielts-practice" />
    </article>
  );
}
