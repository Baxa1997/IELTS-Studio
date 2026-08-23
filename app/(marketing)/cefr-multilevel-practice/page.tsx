import type { Metadata } from "next";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../marketing";

export const metadata: Metadata = {
  title: "CEFR / Multilevel Practice (Uzbekistan DTM) — Reading & Writing",
  description:
    "Practise the Uzbekistan Multilevel (DTM) exam: Reading with all 5 parts and 35 questions, and Writing with all 3 tasks, generated fresh and marked to a CEFR level from A1 to C2.",
  alternates: { canonical: "/cefr-multilevel-practice" },
  robots: { index: true, follow: true },
};

export default function CefrMultilevelPracticePage() {
  return (
    <article>
      <PageTitle
        title="CEFR / Multilevel practice for the DTM exam"
        lead="The Uzbekistan Multilevel exam is not IELTS, and practising IELTS papers for it wastes your time — the Reading paper has five parts and thirty-five questions in formats IELTS never uses. EngProgress generates real Multilevel papers on demand and marks them to a CEFR level."
      />

      <Sec title="What is live today">
        <P>
          <B>Reading — the full paper.</B> All <B>five parts and thirty-five questions</B>, in the exam&rsquo;s
          own structure and question formats, generated fresh every time you sit one. You get the same
          per-answer treatment as our IELTS reading: every wrong answer comes back with the sentence in
          the passage that proves the right one, and an explanation of why the distractor caught you.
        </P>
        <P>
          <B>Writing — all three tasks.</B> The complete Multilevel writing paper, marked against CEFR
          descriptors rather than IELTS band descriptors, because they are not the same instrument and
          a 6.5 is not a B2. You get per-criterion feedback with evidence quoted from your own writing,
          the thing capping your level, and the fix.
        </P>
        <P>
          <B>Listening and Speaking are not built yet.</B> We would rather tell you that plainly than
          have you sign up and find out. They are on the roadmap; the format research is done. If you
          need Listening and Speaking practice in the meantime, our{" "}
          <A href="/ielts-listening-practice">IELTS Listening</A> and{" "}
          <A href="/ielts-speaking-practice">IELTS Speaking</A> modules will still build the underlying
          skill, even though the paper format differs.
        </P>
      </Sec>

      <Sec title="Why a Multilevel-specific track exists at all">
        <UL>
          <LI>
            <B>The formats genuinely differ.</B> Multilevel Reading is five parts and thirty-five
            questions; IELTS Academic Reading is three passages and forty. Drilling the wrong shape
            trains you for the wrong exam.
          </LI>
          <LI>
            <B>The scale differs.</B> Multilevel reports a CEFR level — A1 through C2, with B1, B2 and C1
            being what most candidates are chasing — not a 0–9 band. Converting between them by rule of
            thumb is how people end up surprised.
          </LI>
          <LI>
            <B>The stakes are local and real.</B> For a great many candidates in Uzbekistan this
            certificate is what unlocks a university place or a salary supplement, and there is almost no
            honest practice material for it. Most of what exists is photocopied and recycled.
          </LI>
        </UL>
      </Sec>

      <Sec title="Fresh papers, never a recycled PDF">
        <P>
          Every Multilevel paper is <B>generated new</B> in the authentic exam format. That matters more
          here than it does for IELTS, because the pool of circulating Multilevel practice material is
          small enough that serious candidates exhaust it and end up re-sitting papers they have already
          memorised — which measures recall, not English. You cannot memorise a paper that did not exist
          until you opened it.
        </P>
        <P>
          All content is original. We never host or reproduce official DTM papers or copyrighted practice
          books.
        </P>
      </Sec>

      <Sec title="For teachers and centres">
        <P>
          If you prepare Multilevel candidates for a living, the same account runs your classes: create
          groups, add students, assign practice, and read a per-student report of everything they have
          sat. See <A href="/for-education-centers">EngProgress for education centres</A>.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Is the Multilevel exam the same as IELTS?",
            a: "No. The Uzbekistan Multilevel (DTM) exam reports a CEFR level from A1 to C2 rather than an IELTS band from 0 to 9, and the papers are structured differently — Multilevel Reading has five parts and thirty-five questions, where IELTS Academic Reading has three passages and forty. Practising IELTS papers will build your English but will not prepare you for the format.",
          },
          {
            q: "Which Multilevel papers can I practise on EngProgress?",
            a: "Reading (all five parts, thirty-five questions) and Writing (all three tasks) are live and generated on demand. Listening and Speaking are not built yet.",
          },
          {
            q: "What CEFR levels does it cover?",
            a: "Practice is generated across the range, with B1, B2 and C1 being the levels most Multilevel candidates are working toward. Your work is marked against CEFR descriptors, so you get a level rather than an IELTS band.",
          },
          {
            q: "Is the practice content real DTM exam material?",
            a: "No, and that is deliberate. Every paper is original and AI-generated in the authentic exam format. We never host or copy official DTM papers or copyrighted practice books, which also means you can never accidentally sit a paper you have already memorised.",
          },
          {
            q: "Can I practise IELTS on the same account?",
            a: "Yes. One account covers both tracks — IELTS Writing, Reading, Listening and Speaking, plus CEFR / Multilevel — and your practice history sits together in one place.",
          },
        ]}
      />

      <Cta
        title="Sit a full Multilevel Reading paper free"
        sub="Five parts, thirty-five questions, generated fresh — with an explanation for every answer you miss."
      />
      <Related current="/cefr-multilevel-practice" />
    </article>
  );
}
