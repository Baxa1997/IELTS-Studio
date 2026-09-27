import type { BlogPost } from "../types";

/*
 * ⚠️ WHERE EVERY FACT HERE COMES FROM — check the source before editing one.
 *
 *  - Reading and Writing structure: `CEFR_MULTILEVEL_GENERATION_SPEC.md` (repo
 *    root), derived from the official Multilevel prep books and a real DTM mock
 *    paper. Part types, question ranges, word counts and CEFR levels are as
 *    stated there.
 *  - Listening's six parts and 35 questions, and the score-to-level table:
 *    the engine's `docs/cefr-listening-spec.md`, from public descriptions of
 *    the exam. The thresholds are the softest fact in the post, so the post
 *    says so and sends the reader to the official testing centre.
 *
 * FORMAT ONLY. The structure of a public exam is fact; its papers are not ours.
 * Every example below is original — never paste a book or DTM item in here.
 */
export const multilevelExamExplained: BlogPost = {
  slug: "multilevel-exam-explained",
  category: "multilevel",
  title: "The Multilevel exam explained: every part of the Reading and Writing papers",
  standfirst:
    "Uzbekistan's CEFR Multilevel exam is not IELTS. Here is how its Reading and Writing papers are built, part by part, and what each task asks of you.",
  published: "2026-09-27",
  author: "EngProgress team",
  cover: { kicker: "B1–C1" },
  skill: "cefr",
  summary: [
    "The CEFR Multilevel exam is Uzbekistan's national English exam, run by the State Testing Centre (DTM), and it places candidates between B1 and C1 in a single sitting.",
    "The Multilevel Reading paper has five parts and 35 questions, rising in difficulty from B1 in Part 1 to C1 in Part 5.",
    "The Multilevel Writing paper has three tasks: an informal email of about 50 words, a formal email of 120 to 150 words about the same situation, and a forum post of 180 to 200 words.",
    "The Multilevel exam reports a CEFR level rather than an IELTS band, and its papers use different formats from IELTS.",
  ],
  body: [
    {
      type: "p",
      text: "The Multilevel exam is Uzbekistan's national English exam, run by the State Testing Centre (DTM). Instead of a band from 0 to 9, it places you on the CEFR scale — B1, B2 or C1 — in a single sitting. It has four papers: Listening, Reading, Writing and Speaking. This guide walks through Reading and Writing part by part, because those are the two papers where knowing the format saves the most marks.",
    },
    { type: "h2", text: "Reading: five parts, 35 questions" },
    {
      type: "p",
      text: "The Reading paper takes 60 minutes. The parts get harder as you go: Part 1 is written at B1, and Part 5 at C1. Every correct answer is worth one mark.",
    },
    { type: "h2", text: "Reading Part 1: gap fill (questions 1–6)" },
    {
      type: "p",
      text: "A short B1 text of roughly 150 to 200 words, with six gaps. Each gap takes **exactly one word** — and the rule that makes this part different from any IELTS task is that **the missing word appears somewhere else in the same text**. You are not inventing the answer; you are finding it.",
    },
    {
      type: "tip",
      title: "Check the grammar around the gap",
      text: "Once you have found a likely word, make sure it fits exactly: singular or plural, the right tense, the right preposition after it. The text around each gap allows only one word.",
    },
    { type: "h2", text: "Reading Part 2: adverts and notices (questions 7–14)" },
    {
      type: "p",
      text: "Eight short texts — adverts or notices, all on one theme, such as language courses or sports clubs — and ten statements labelled A to J. You match each text to the statement that describes it. Each statement is used once only, and **two statements are extra**: they match nothing, and they are there to catch you.",
    },
    { type: "h2", text: "Reading Part 3: headings (questions 15–20)" },
    {
      type: "p",
      text: "One text in six paragraphs, and a list of headings with more headings than paragraphs — practice books typically give eight. Choose a heading for each paragraph. No heading can be used twice, and some are never used at all.",
    },
    { type: "h2", text: "Reading Part 4: a longer text (questions 21–29)" },
    {
      type: "p",
      text: "One longer text — a story, a biography or a feature article — with nine questions in two blocks. Questions 21 to 24 are multiple choice with options A to D. Questions 25 to 29 are statements you mark **True**, **False** or **No Information**.",
    },
    {
      type: "p",
      text: "No Information works exactly like Not Given in IELTS: the text neither confirms nor contradicts the statement. The traps are the same too — see [True, False or Not Given? The question the passage never answers](/blog/true-false-not-given).",
    },
    { type: "h2", text: "Reading Part 5: an academic text (questions 30–35)" },
    {
      type: "p",
      text: "The hardest part: an academic C1 text of around 500 to 650 words. Questions 30 to 33 are a summary with four gaps, each taking **no more than one word and/or a number**, in the same order as the information in the text. Questions 34 and 35 are multiple choice, A to D.",
    },
    { type: "h2", text: "Writing: three tasks in two sections" },
    {
      type: "p",
      text: "The Writing paper takes about an hour. Section 1 gives you **one situation** and asks you to write about it twice: once informally to a friend, and once formally to someone in charge. Section 2 is a separate opinion task.",
    },
    { type: "h2", text: "Writing Task 1.1: an informal email (about 50 words, B1)" },
    {
      type: "p",
      text: "A short email to a friend about the situation — typically how you feel about it and what you think should happen. Friendly, direct and short: about 50 words is not much, so every sentence has to do a job.",
    },
    { type: "h2", text: "Writing Task 1.2: a formal email (120–150 words, B2)" },
    {
      type: "p",
      text: "The same situation, written to a manager or an organisation: what the problem is, how it affects you, and what you would like them to do. The content overlaps with Task 1.1. What changes is **register** — the vocabulary, the grammar and the tone.",
    },
    {
      type: "example",
      title: "One situation, two emails: your sports club has suddenly raised its membership fee",
      rows: [
        { label: "Task 1.1", text: "Hi Aziz! Have you seen the new prices at the club? I was really annoyed…" },
        { label: "Task 1.2", text: "Dear Sir or Madam, I am writing to express my concern about the recent increase in membership fees…" },
      ],
    },
    { type: "h2", text: "Writing Task 2: a forum post (180–200 words, C1)" },
    {
      type: "p",
      text: "You are taking part in an online discussion and must answer its question — for example, whether schools should replace exams with coursework — giving reasons and examples. This is the C1 task: a clear opinion, developed over 180 to 200 words, in a style suitable for a public forum.",
    },
    {
      type: "tip",
      title: "Register is part of the task",
      text: "An informal email to a friend written like a letter of complaint, or a formal email full of slang, has not done what the task asked — however accurate the English. Decide who you are writing to before you write the first word.",
    },
    { type: "h2", text: "Multilevel and IELTS: the differences that matter" },
    {
      type: "list",
      items: [
        "**The result.** Multilevel gives a CEFR level; IELTS gives a band from 0 to 9. The two are different scales, and converting one into the other by rule of thumb is unreliable.",
        "**Reading.** Multilevel has five parts and 35 questions, including gap fills where the answer is in the text; IELTS Academic Reading has three passages and 40 questions.",
        "**Writing.** Multilevel has three tasks, two of them emails in different registers; IELTS has two tasks, and neither is an informal email in Academic.",
        "**One shared skill.** No Information in Multilevel and Not Given in IELTS test the same thing: reading only what the text actually says.",
      ],
    },
    { type: "h2", text: "How the exam is scored" },
    {
      type: "p",
      text: "Public descriptions of the exam give a score out of 75 for the whole exam, mapped to levels like this: **65–75 is C1**, **51–64 is B2**, **38–50 is B1**, and a score below 38 is below B1. Thresholds can be revised, so confirm the current ones with the State Testing Centre before you plan around a number.",
    },
    {
      type: "p",
      text: "Listening, the fourth paper we have not covered here, also has 35 questions, in six parts. The format of every paper rewards the same preparation: practise each part in its real shape until the instructions feel familiar, so your attention on exam day goes to the English, not to the rules.",
    },
  ],
  faq: [
    {
      q: "How many parts does the Multilevel Reading paper have?",
      a: "Five parts with 35 questions in total, taken in 60 minutes. The parts rise in difficulty from B1 in Part 1 to C1 in Part 5, and each correct answer is worth one mark.",
    },
    {
      q: "What are the writing tasks in the Multilevel exam?",
      a: "There are three tasks in two sections. Task 1.1 is an informal email to a friend of about 50 words, Task 1.2 is a formal email of 120 to 150 words about the same situation, and Task 2 is a forum post of 180 to 200 words giving an opinion.",
    },
    {
      q: "Is the Multilevel exam the same as IELTS?",
      a: "No. The Multilevel exam reports a CEFR level rather than an IELTS band, and its papers are built differently: Multilevel Reading has five parts and 35 questions, while IELTS Academic Reading has three passages and 40 questions.",
    },
    {
      q: "What score do you need for C1 in the Multilevel exam?",
      a: "Public descriptions of the exam put C1 at 65 to 75 out of 75, B2 at 51 to 64 and B1 at 38 to 50. Confirm the current thresholds with the State Testing Centre, as they can be revised.",
    },
  ],
  cta: {
    title: "Sit a full Multilevel Reading paper",
    text: "All five parts and 35 questions, generated fresh in the exam's own format, with an explanation for every answer you miss — and all three Writing tasks, marked to a CEFR level.",
    href: "/cefr-multilevel-practice",
    label: "CEFR / Multilevel practice",
  },
};
