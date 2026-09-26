import type { BlogPost } from "../types";

export const whyEnglishSpellingIsStrange: BlogPost = {
  slug: "why-english-spelling-is-strange",
  category: "english",
  title: "Why English spelling is so strange — and why it is not your fault",
  standfirst:
    "Knight, island, debt, colonel. English spelling looks random because much of it records how the language sounded centuries ago. The history makes it easier to learn.",
  published: "2026-09-26",
  author: "EngProgress team",
  cover: { kicker: "knight" },
  body: [
    {
      type: "p",
      text: "If you have ever wondered why *knight* has a *k* nobody says, or why *colonel* sounds like *kernel*, you are asking a good question. The short answer: English spelling mostly stopped changing a few hundred years ago, and the pronunciation did not.",
    },
    { type: "h2", text: "The letters used to be pronounced" },
    {
      type: "p",
      text: "In medieval English the *k* in *knight* and *knee* was pronounced, and the *gh* was a sound like the one at the end of the Scottish *loch*. Those sounds disappeared from speech, but by then the spellings were written down, copied and printed — and they stayed.",
    },
    { type: "h2", text: "The vowels moved" },
    {
      type: "p",
      text: "Between roughly 1400 and 1700, the long vowels of English shifted in a change linguists call the **Great Vowel Shift**. Before it, *bite* sounded close to modern *beet*, and *name* had a vowel close to the one in *father*. Printing arrived in England in the 1470s, in the middle of that change, and helped to fix spellings that recorded the older sounds. That is a large part of why English vowels are spelt so differently from the way they are said.",
    },
    { type: "h2", text: "Some letters were added on purpose" },
    {
      type: "p",
      text: "In the 1500s and 1600s, scholars who admired Latin added letters to show where words came from. *Dette* became *debt* to echo Latin *debitum*; *doute* became *doubt* after *dubitare*. The *b* was never pronounced. *Island* gained its *s* by association with *isle*, even though the two words have different origins.",
    },
    {
      type: "p",
      text: "*Colonel* is stranger still. English borrowed the word in two forms, one closer to French *coronel* and one to Italian *colonnello*. The spelling settled on one, the pronunciation on the other.",
    },
    { type: "h2", text: "Then the dictionaries arrived" },
    {
      type: "p",
      text: "Samuel Johnson's *Dictionary of the English Language* (1755) did much to settle British spelling. In the United States, Noah Webster's dictionary of 1828 promoted simpler forms — *color*, *center*, *program* — which is why British and American spelling still differ today.",
    },
    {
      type: "tip",
      title: "Spelling in the IELTS exam",
      text: "In Listening and Reading, a misspelt answer is marked wrong, so spelling is worth practising. British and American spellings are both accepted — just be consistent. In Writing, spelling errors count under Lexical Resource.",
    },
    { type: "h2", text: "Use the history to remember" },
    {
      type: "p",
      text: "Silent letters are often loud in a related word. Learn words in families and the spelling starts to make sense:",
    },
    {
      type: "example",
      rows: [
        { label: "sign", text: "signature, signal — you can hear the *g*" },
        { label: "muscle", text: "muscular — you can hear the *c*" },
        { label: "bomb", text: "bombard — you can hear the *b*" },
        { label: "column", text: "columnist — you can hear the *n*" },
      ],
    },
    {
      type: "p",
      text: "English spelling is not random. It is history that nobody tidied up — and once you can see the history, it is much easier to remember.",
    },
  ],
  cta: {
    title: "Build vocabulary as you practise",
    text: "Save new words from any reading passage and review them later in your own vocabulary list.",
    href: "/ielts-reading-practice",
    label: "IELTS Reading practice",
  },
};
