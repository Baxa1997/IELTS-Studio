import type { BlogPost } from "../types";

/*
 * ⚠️ PRODUCT CLAIMS ON A PUBLIC PAGE. Everything here must be live in
 * production, and nothing may claim a measured grading accuracy — the anchors
 * are still "expert-verification pending", and `lib/seo-claims.test.ts` scans
 * this folder for exactly that. Describe what the grader DOES, not how close it
 * is to an examiner.
 */
export const whatsNewAtEngProgress: BlogPost = {
  slug: "whats-new-at-engprogress",
  category: "engprogress",
  title: "All four IELTS skills, CEFR Multilevel and three languages: what's new at EngProgress",
  standfirst:
    "Speaking and Listening have joined Writing and Reading, Multilevel candidates have a track of their own, and the site now speaks Uzbek, English and Russian.",
  published: "2026-09-26",
  author: "EngProgress team",
  cover: { kicker: "What's new" },
  body: [
    {
      type: "p",
      text: "EngProgress started with the two skills candidates find hardest to judge for themselves: Writing and Reading. Here is what the platform covers today.",
    },
    { type: "h2", text: "All four IELTS skills" },
    {
      type: "list",
      items: [
        "**Writing** — Task 1 and Task 2, graded criterion by criterion with the evidence quoted from your own essay, plus a revision loop: rewrite the same essay and see what changed.",
        "**Reading** — original passages with every real question type, and an explanation for each answer, including why the wrong option looked right.",
        "**Listening** — full four-part tests with original multi-voice audio, transcripts and per-answer explanations.",
        "**Speaking** — Part 2 cue-card practice, a full three-part mock with an AI examiner, and a speaking tutor that reacts and corrects while you talk.",
      ],
    },
    { type: "h2", text: "A track for the Multilevel exam" },
    {
      type: "p",
      text: "Candidates preparing for Uzbekistan's CEFR Multilevel (DTM) exam have their own practice, in that exam's format: **Reading** in five parts with 35 questions, and **Writing** with its three tasks, generated at your level. Multilevel Listening and Speaking are not available yet.",
    },
    { type: "h2", text: "Uzbek, English and Russian" },
    {
      type: "p",
      text: "The whole interface is available in Uzbek — now the default — as well as in English and Russian. The exam content itself stays in English, because the exam does. There is a dark mode too, for evening study.",
    },
    { type: "h2", text: "A grader that would rather be strict" },
    {
      type: "p",
      text: "Our grader works from the official public band descriptors and compares your writing with annotated sample essays at each band. When a script sits between two bands, it gives the lower one and tells you exactly what is missing for the higher. A band that is too generous in practice becomes a disappointment on exam day, and we would rather you heard *more work needed* from us first.",
    },
    { type: "h2", text: "For education centres" },
    {
      type: "p",
      text: "Centres run their teachers, groups and student accounts on EngProgress: teachers set homework, every student in a group gets identical content, and the teacher sees a report for each assignment and each student across all four skills. See the [guide for centres](/how-to-use/education-centers).",
    },
    { type: "h2", text: "And this blog" },
    {
      type: "p",
      text: "Exam strategy, the stories behind English words, and news from us — written in English, so reading it counts as practice.",
    },
  ],
  cta: {
    title: "Try it free",
    text: "Paste an essay into the free checker — no account needed — or create a free account to practise all four skills.",
    href: "/grade",
    label: "Free IELTS writing checker",
  },
};
