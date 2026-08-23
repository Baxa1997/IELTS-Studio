import type { Metadata } from "next";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../marketing";

export const metadata: Metadata = {
  title: "EngProgress for Education Centres — Run Your IELTS School on AI",
  description:
    "Teachers, groups, homework, attendance, finance and per-student four-skill reports. Assign IELTS practice to a class, and see exactly who did it and what capped their band. Unmetered for centres.",
  alternates: { canonical: "/for-education-centers" },
  robots: { index: true, follow: true },
};

export default function ForEducationCentersPage() {
  return (
    <article>
      <PageTitle
        title="Run your IELTS centre on EngProgress"
        lead="Your teachers already know what their students get wrong. What they do not have is the twenty hours a week it would take to mark every essay, every reading paper and every speaking mock — and prove it to a parent. That is the part we do."
      />

      <Sec title="What a centre gets">
        <P>
          <B>Teachers and groups.</B> A centre admin invites teachers; each teacher creates their own
          groups and adds students. You can create a student account outright — name, login and password,
          with the email optional. Give an address and the credentials are emailed to them; leave it blank
          and the teacher hands them over in class or on Telegram. That matters for the students who do
          not have an email address, which in a real classroom is more of them than software usually
          assumes.
        </P>
        <P>
          <B>Assign practice as homework.</B> Set a generated Task 2 prompt or a reading test for a whole
          group — <B>pinned, so every student sits identical content</B> and the results are actually
          comparable. Students see it on their assignments page with an unfinished-homework badge, and it
          is marked the moment they submit.
        </P>
        <P>
          <B>Reports that answer the question a parent asks.</B> Per assignment: who completed it, the
          band spread, the criterion capping the class, and the question types they most often miss. Per
          student: a four-skill picture with recurring weaknesses and a dated table of every practice
          they have done — homework or on their own time — each row opening the student&rsquo;s own full
          feedback page. The teacher sees exactly what the student saw.
        </P>
        <P>
          <B>The administrative side, too.</B> Attendance, announcements, a lesson timetable, branches
          with their own rooms and cash desks, invoices, payroll with per-teacher rates, and certificates.
          A centre is a business, not just a classroom.
        </P>
      </Sec>

      <Sec title="Why centres use an AI marker rather than hiring one">
        <UL>
          <LI>
            <B>Marking is the bottleneck, and it is the first thing to slip.</B> A teacher with sixty
            students cannot return essays inside a week, so students stop writing them. Instant marking
            means a class can write four essays a week instead of one.
          </LI>
          <LI>
            <B>It marks consistently.</B> Two teachers grade the same essay differently, and the same
            teacher grades differently at 9am and 9pm. The grader does not — same essay, same band.
          </LI>
          <LI>
            <B>It is deliberately strict.</B> Our grader rounds down and names the gap. A centre that
            hands out generous predictions gets found out on results day; one whose practice bands are
            slightly below exam-day reality builds a reputation.
          </LI>
          <LI>
            <B>It frees the teacher for the part only a human does.</B> Nobody became a teacher to circle
            comma splices at midnight.
          </LI>
        </UL>
      </Sec>

      <Sec title="Your students are ordinary learners, not locked-down accounts">
        <P>
          A centre student gets the full platform — all four IELTS skills plus CEFR / Multilevel — and can
          practise anything they like on their own time. Their teacher sees that work in the same report
          as the homework. The point is not to fence students in; it is to give the teacher a true picture
          of who is putting the hours in.
        </P>
      </Sec>

      <Sec title="Pricing for centres">
        <P>
          Centres run <B>unmetered</B>. The per-practice quotas that apply to individual accounts are
          switched off for a centre, because a teacher should never be deciding whether a student can
          afford to write one more essay. Centre pricing is agreed directly rather than sold self-serve —{" "}
          <A href="/contact">talk to us</A> and we will quote against your student numbers.
        </P>
      </Sec>

      <Sec title="How to get started">
        <P>
          Apply from the <B>Organization</B> tab on the <A href="/sign-up">sign-up page</A> with your
          centre&rsquo;s official name and email. Applications are reviewed by hand — we approve you, you
          get a confirmation email, and your admin account can start inviting teachers. If you would
          rather see it working first, <A href="/contact">get in touch</A> and we will walk you through
          it.
        </P>
        <P>
          Want to see what your students would actually get? Start with{" "}
          <A href="/ielts-practice">the four IELTS skills</A> or{" "}
          <A href="/cefr-multilevel-practice">CEFR / Multilevel</A>.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Can my teachers see everything their students do?",
            a: "A teacher sees the students in the groups they own — both the homework they were assigned and the practice they did on their own time — and can open the student's own full feedback page for any of it. A centre admin sees the whole centre. No centre can ever see another centre's data; that isolation is enforced in the database, not just in the application.",
          },
          {
            q: "Do students need email addresses?",
            a: "No. A teacher can create a student account with just a name, a login and a password — the student signs in with the login instead of an email. If you do provide an email address, the credentials are sent to the student automatically.",
          },
          {
            q: "Which skills can I assign as homework?",
            a: "Writing prompts and reading tests can be assigned to a group today, pinned so every student sits identical content. Listening and speaking assignments are not built yet — students can practise both freely, and that practice still appears in their teacher's report, but it cannot yet be set as homework.",
          },
          {
            q: "How much does it cost for a centre?",
            a: "Centres run unmetered — the per-practice quotas that apply to individual accounts are switched off — and pricing is agreed directly against your student numbers rather than sold self-serve. Get in touch through our contact page for a quote.",
          },
          {
            q: "How do we sign up?",
            a: "Apply from the Organization tab on the sign-up page using your centre's official name and email address. Applications are reviewed by hand before approval, after which your admin account can invite teachers, who then create groups and add students.",
          },
          {
            q: "Can we manage attendance, payments and timetables too?",
            a: "Yes. Alongside the teaching tools there is attendance, a lesson timetable, announcements, branches with their own rooms and cash desks, invoicing, and payroll with per-teacher rates.",
          },
        ]}
      />

      <Cta
        title="Stop marking essays at midnight"
        sub="Apply from the Organization tab, or talk to us first — we will walk you through a live centre."
      />
      <Related current="/for-education-centers" />
    </article>
  );
}
