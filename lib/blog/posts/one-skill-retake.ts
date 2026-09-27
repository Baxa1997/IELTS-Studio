import type { BlogPost } from "../types";

/*
 * ⚠️ EXAM RULES CHANGE BY MARKET AND OVER TIME. Everything stated as fact here is
 * the stable core of IELTS's own description of the option; anything local —
 * price, availability, which centres run it — is deliberately left to the
 * official page, and the post tells the reader to check it. Keep it that way
 * when editing: a wrong exam rule on a public page costs more trust than any
 * tip earns.
 */
export const oneSkillRetake: BlogPost = {
  slug: "one-skill-retake",
  category: "ielts",
  title: "One Skill Retake: when resitting a single IELTS skill makes sense",
  standfirst:
    "Missed your target in just one skill? You may not need to sit the whole test again. What One Skill Retake is, and how to decide whether to use it.",
  published: "2026-09-26",
  author: "EngProgress team",
  cover: { kicker: "1 skill" },
  summary: [
    "IELTS One Skill Retake lets a candidate resit one of the four skills instead of the whole test, at test centres that offer it.",
    "The retake is taken on computer, within a limited window after the original test, and can be used once for each original test.",
    "Not every university, employer or visa authority accepts One Skill Retake results, so acceptance should be checked before booking.",
    "A retake is most worthwhile when only one skill is below target and the reason for the low score is known.",
  ],
  faq: [
    {
      q: "What is IELTS One Skill Retake?",
      a: "It is an option to retake one of the four IELTS skills, Listening, Reading, Writing or Speaking, instead of sitting the whole test again. It is available at test centres that offer it.",
    },
    {
      q: "Is IELTS One Skill Retake accepted by universities?",
      a: "Not by all of them. Check with the university, employer or visa authority you are applying to before you book, as well as the current rules on the official IELTS website.",
    },
    {
      q: "When is it worth using One Skill Retake?",
      a: "When only one skill is below your target and you know what held it back. If several skills are low, or you do not know why, a retake tends to produce the same score again.",
    },
  ],
  body: [
    {
      type: "p",
      text: "It is one of the most frustrating results in IELTS: three skills at or above your target, and one half a band short. For years the only answer was to sit all four again. **One Skill Retake** changes that at test centres that offer it.",
    },
    { type: "h2", text: "What it is" },
    {
      type: "list",
      items: [
        "You retake **one** of the four skills — Listening, Reading, Writing or Speaking — instead of the whole test.",
        "The retake has to be booked within a limited window after your original test (IELTS gives this as 60 days).",
        "It is taken on computer, and you can use it once for each original test.",
        "You receive a new result for that skill alongside your original scores, and you choose which results to send.",
      ],
    },
    {
      type: "tip",
      title: "Check two things before you book",
      text: "First, whether your test centre offers One Skill Retake, and at what price. Second, whether the university, employer or visa authority you are applying to **accepts** it — not every organisation does. The official IELTS website and the organisation's admissions page are the places to confirm both.",
    },
    { type: "h2", text: "When it makes sense" },
    {
      type: "p",
      text: "A retake is worth it when the gap is **small and specific**. If Writing came back at 6.0 and you need 6.5, and you can name what held it back — an unclear position, underdeveloped paragraphs, the same grammar errors repeating — a focused month on that one skill is a better use of time than re-preparing for four.",
    },
    {
      type: "p",
      text: "It makes less sense when more than one skill is below target, or when you do not yet know *why* the score was low. Resitting without a diagnosis tends to produce the same band again.",
    },
    { type: "h2", text: "Use the window well" },
    {
      type: "list",
      ordered: true,
      items: [
        "Find out what capped the score. For Writing and Speaking, that means the criterion — Task Response, Coherence, vocabulary, grammar — not just the overall band.",
        "Practise that criterion on fresh material, not on tasks you have already seen.",
        "Sit at least one full timed section before the retake, under exam conditions.",
      ],
    },
    {
      type: "p",
      text: "The skill-by-skill view matters more with this option than without it. The better you know which part of which skill is holding you back, the more a single retake can do.",
    },
  ],
  cta: {
    title: "Find the one thing holding your band back",
    text: "EngProgress tracks your band per skill and, in Writing, per criterion — so you can see what to fix before you book.",
    href: "/ielts-practice",
    label: "IELTS practice, all four skills",
  },
};
