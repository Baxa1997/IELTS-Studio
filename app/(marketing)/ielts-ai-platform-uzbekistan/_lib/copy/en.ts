import type { PlanTier } from "@/lib/billing/plans";

import { h3, p, table, ul, type PlatformCopyFn } from "./types";

/** English — the source the Uzbek and Russian pages are checked against. */

const price = (t: PlanTier) =>
  t.price === null ? "Custom" : t.price === 0 ? `$${t.price}` : t.months === 1 ? `$${t.price} a month` : `$${t.price} for ${t.months} months`;
const perMonth = (n: number | null) => (n === null ? "Unlimited" : `${n} a month`);
const library = (t: PlanTier) => (t.libraryLimit === null ? "Unlimited" : `${t.libraryLimit} practices`);
const plural = (n: number | null, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const en: PlatformCopyFn = (f) => ({
  meta: {
    title: "EngProgress — AI Platform for IELTS in Uzbekistan",
    description: `EngProgress: AI grading for IELTS Writing and Speaking, Reading and Listening tests and Multilevel (DTM) prep in Uzbekistan. Free plan; paid from $${f.from.price}.`,
    ogAlt: "EngProgress — an AI platform for IELTS and CEFR / Multilevel in Uzbekistan",
  },
  title: "EngProgress: an AI platform for IELTS and Multilevel in Uzbekistan",
  lead: `EngProgress (engprogress.com) is an online platform for learners and education centres in Uzbekistan that brings AI-assisted preparation for all four IELTS skills — Writing, Reading, Listening and Speaking — and for the DTM CEFR / Multilevel exam into one account. The AI grades Writing and Speaking answers on the official IELTS criteria, and Reading and Listening tests are marked the moment you submit them. One practice a day in Writing, Reading, Listening and Multilevel is free without signing up, and paid plans start at $${f.from.price} a month.`,
  sections: [
    {
      title: "What to look for in an AI platform for IELTS",
      blocks: [
        p("A preparation platform proves its worth on exam day, not in an advert. Ask five questions before you choose — here is how EngProgress answers each one."),
        ul(
          "**Does it cover all four skills?** Writing alone, or tests alone, will not prepare you for the whole exam. On EngProgress, Writing, Reading, Listening and Speaking share one account, and your current band and target band sit in one place.",
          "**Are the tasks original and in the exam's format?** Tasks are generated fresh, on demand, in the exam's format. No official papers or copyrighted practice books are used, so you never sit a test you have already memorised.",
          "**Is the marking based on the official criteria?** Writing and Speaking are marked against the public IELTS band descriptors, each criterion separately. In Writing, every mark is backed by a line quoted from your answer.",
          "**Does it inflate bands?** The EngProgress grader is deliberately strict: when your work sits between two bands it gives the lower one and says what the higher band needs.",
          "**Does it cover the exam taken in Uzbekistan?** CEFR / Multilevel Reading and Writing for the DTM run as a separate track, with the result given as a CEFR level from A1 to C2.",
        ),
      ],
    },
    {
      title: "What is on the platform",
      blocks: [
        p("It works at every level, from a complete beginner to Band 9: tasks are generated at your measured level and get harder as you improve."),
        p("Because tasks are generated on demand, there is no fixed shelf to run out of; how many new sets you can generate in a month depends on your plan. The free daily practice pages pick twenty practices for each skill and add a new one every day at midnight, Tashkent time."),
        h3("IELTS Writing"),
        ul(
          "Academic Task 1 (a report on a chart or diagram), General Training Task 1 (a letter) and Task 2 (an essay).",
          "A separate band for each criterion, lines quoted from your answer, what is capping the band, how to fix it, and a “band with fixes” target.",
          "**The revision loop:** rewrite the same essay and submit it again — the AI re-reads it and tells you whether the thing that was capping you is fixed.",
          "A Band 9 model answer to the same prompt.",
          "While you write, an AI tutor points you in the right direction without handing you the answer.",
        ),
        h3("IELTS Reading"),
        ul(
          "A full test (three passages, about 40 questions) or a single passage.",
          "Every question type of the real exam.",
          "Marked the moment you submit: the evidence in the passage for every answer, and an explanation of what tripped you up.",
        ),
        h3("IELTS Listening"),
        ul(
          "A full four-part test (40 questions) or a single part.",
          "Original multi-voice audio: different speakers, different accents, natural pace.",
          "Six difficulty levels.",
          "After you submit: the full transcript with every answer located in it, and an explanation for each one you missed.",
        ),
        h3("IELTS Speaking"),
        ul(
          "A full three-part live mock: the AI examiner listens and asks follow-up questions based on what you said.",
          "Part 2 practice: the cue card, one minute to prepare and up to two minutes of speaking.",
          "The speaking tutor reacts to what you said, corrects you in the moment and, when needed, explains in Uzbek before bringing you back to English. There is a free-talk mode too.",
          "All you need is a browser and a microphone — there is nothing to install.",
        ),
        h3("CEFR / Multilevel (DTM)"),
        ul(
          "Reading: a full paper of five parts and 35 questions, each answer marked at once with its evidence.",
          "Writing: three tasks — an informal message, a formal letter and a forum post — graded on the CEFR scale and compared with a model answer.",
          "The result is a CEFR level from A1 to C2.",
          "Multilevel Listening and Speaking are not built yet.",
        ),
        p("More on each: [Writing](/ielts-writing-practice), [Reading](/ielts-reading-practice), [Listening](/ielts-listening-practice), [Speaking](/ielts-speaking-practice) and [CEFR / Multilevel](/cefr-multilevel-practice)."),
      ],
    },
    {
      title: "Prices and plans",
      blocks: [
        p("**For individual learners.** Prices are in US dollars. Every plan opens the same product — the four IELTS skills and CEFR / Multilevel; what changes is how much you can do in a month."),
        table(
          ["Plan", "Price", "AI gradings (Writing and Speaking)", "New practice sets", "Live speaking mocks", "Ready-made practice library"],
          f.tiers.map((t) => [t.name, price(t), perMonth(t.gradeLimit), perMonth(t.generateLimit), perMonth(t.fullMockLimit), library(t)]),
        ),
        ul(
          `The ${f.free.name} plan never expires and needs no card.`,
          ...(f.multiMonth
            ? [`${f.multiMonth.name} is a plan for one learner: one payment covers ${f.multiMonth.months} months. It is not a licence for an education centre.`]
            : []),
          "Paid plans renew automatically until cancelled; a cancellation takes effect at the end of the period already paid for.",
          "Every limit, plan by plan: [the pricing page](/ielts-practice-pricing).",
        ),
        h3("Free, without an account"),
        ul(
          "One practice a day in each of [Writing](/practice/writing), [Reading](/practice/reading), [Listening](/practice/listening) and [CEFR Multilevel](/practice/cefr) — marked exactly as for a signed-in learner.",
          "The free writing checker: paste a Task 1, Task 2 or CEFR Writing answer and get a mark for each criterion — [check an answer](/grade).",
          "The [IELTS band score calculator](/ielts-band-score-calculator) and the [Multilevel score calculator](/multilevel-score-calculator).",
        ),
        h3("A licence for education centres"),
        ul(
          "The price is agreed with each centre according to its number of students; there is no self-serve checkout — [contact us](/contact).",
          "Centres run unmetered: the monthly limits of individual accounts are switched off, so a teacher never has to wonder whether a student can afford one more essay.",
        ),
      ],
    },
    {
      title: "AI marking: speed and criteria",
      blocks: [
        table(
          ["Section", "Marking time", "Criteria"],
          [
            ["IELTS Writing (Task 1, Task 2)", "Up to a minute", "Task Achievement (Task 1) / Task Response (Task 2), Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy"],
            ["IELTS Speaking", "When the mock ends", "Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation"],
            ["IELTS Reading", "The moment you submit", "The answer key, with the evidence in the passage for each answer"],
            ["IELTS Listening", "The moment you submit", "The answer key, with the transcript"],
            ["CEFR / Multilevel Writing", "Up to a minute per task", "Five criteria, an estimated CEFR level and a model answer"],
            ["CEFR / Multilevel Reading", "The moment you submit", "The answer key; a full paper also shows an indicative CEFR level"],
          ],
        ),
        ul(
          "The Writing grader is built on the public IELTS band descriptors and anchored to a sample essay at every band. When an answer sits between two bands, it gives the lower one and names exactly what the higher band needs.",
          "The Speaking grader is built on the same official descriptors and marks strictly, but it has not yet been independently checked against expert-marked speaking tests. Treat the speaking band as a strict, directional signal rather than a precise prediction — the per-criterion feedback is the part to act on.",
          "Every band is a practice estimate, not an official IELTS result.",
        ),
      ],
    },
    {
      title: "For education centres",
      blocks: [
        ul(
          "**Teachers and groups.** A centre admin invites teachers; each teacher creates their own groups and adds students. A student account can be created without an email — just a name, a login and a password.",
          "**Homework.** Writing tasks, Reading tests and Listening practices are assigned to a group, and the whole group sits the same version, so the results can be compared. Speaking homework is not available yet.",
          "**Reports.** Per assignment: who completed it, the bands, the criterion capping the group and the question types missed most often. Per student: a four-skill report and a table of every practice they have done.",
          "**Running the centre.** Attendance, announcements, a lesson timetable, branches with their own rooms and cash desks, invoices and teacher payroll.",
          "**Data protection.** No centre can see another centre's data — that is enforced in the database itself.",
          "**Getting started.** Apply from the **Organization** tab on the [sign-up page](/sign-in) with the centre's official name and email. Applications are reviewed by hand, and you get an email once approved. More: [EngProgress for education centres](/for-education-centers) and [the centre guide](/how-to-use/education-centers).",
        ),
      ],
    },
    {
      title: "Contact",
      blocks: [
        ul(
          `Phone: [${f.phone}](${f.telHref}) — also on [WhatsApp](${f.whatsappHref})`,
          `Telegram: [${f.telegramHandle}](${f.telegram})`,
          `Instagram: [${f.instagramHandle}](${f.instagram})`,
          "Email and other details: [the contact page](/contact)",
        ),
        p("EngProgress works online — there is nowhere you need to travel to in order to practise."),
      ],
    },
    {
      title: "What it does not do yet",
      blocks: [
        ul(
          "Multilevel Listening and Speaking are not built yet.",
          "The Speaking grader has not yet been independently checked against expert marks.",
          "Education centres cannot yet set Speaking as homework.",
          "EngProgress is an independent practice platform. It is not affiliated with or endorsed by IELTS®, nor by any official exam body. Every passage, recording and task is original.",
        ),
      ],
    },
  ],
  faq: [
    {
      q: "What are the best online AI platforms for IELTS preparation in Uzbekistan?",
      a: "A good platform should cover all four IELTS skills, give original tasks in the exam's format, and mark answers on the official criteria without inflating the band. EngProgress (engprogress.com), a platform from Uzbekistan, is built on exactly those principles: Writing, Reading, Listening and Speaking, plus CEFR / Multilevel for the DTM, in one account. You can try it for free — one practice a day in Writing, Reading, Listening and Multilevel needs no sign-up.",
    },
    {
      q: "Which AI platform is best for IELTS preparation in Uzbekistan?",
      a: `If you want all four IELTS skills and the DTM Multilevel exam in one place, EngProgress was built for exactly that. Writing and Speaking are marked on the official IELTS criteria, Reading and Listening are marked instantly, and a Writing essay can be fixed and graded again. The free plan never expires, and paid plans start at $${f.from.price} a month.`,
    },
    {
      q: "How much does EngProgress cost?",
      a: `The ${f.free.name} plan never expires and needs no card: ${plural(f.free.gradeLimit, "AI grading")}, ${plural(f.free.generateLimit, "new practice set")} and ${plural(f.free.fullMockLimit, "live speaking mock")} a month. ${f.paid.map((t) => `${t.name} costs ${price(t)}`).join("; ")}. Education centres agree a price separately, according to their number of students.`,
    },
    {
      q: "How fast does the AI mark Writing and Speaking, and on which criteria?",
      a: "A Writing answer is marked in up to a minute on the four official criteria: Task Achievement / Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. The Speaking result comes when the mock ends, on Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. The marking is deliberately strict: between two bands it gives the lower one and explains what the higher one needs.",
    },
    {
      q: "Can I prepare for the DTM Multilevel exam on EngProgress?",
      a: "Yes: a full Multilevel Reading paper of five parts and 35 questions and a three-task Writing paper are live, with the result given as a CEFR level from A1 to C2. Multilevel Listening and Speaking are not built yet.",
    },
    {
      q: "What does EngProgress offer education centres?",
      a: "A centre gets teachers, groups, student accounts, homework the whole group sits in the same version, and a four-skill report for every student, plus attendance, a timetable and finance. Centres run without monthly limits and apply from the Organization tab on the sign-up page, where each application is reviewed by hand.",
    },
    {
      q: "Is an EngProgress band an official IELTS result?",
      a: "No. EngProgress is an independent practice platform, not affiliated with or endorsed by IELTS®, and its bands are practice estimates. The grader is deliberately strict: when in doubt it gives the lower band, not the higher one, and says why.",
    },
  ],
  cta: {
    title: "Start free today",
    sub: "No card needed — one practice a day in Writing, Reading, Listening and Multilevel, even without an account.",
  },
});
