import type { BlogPost } from "../types";

export const trueFalseNotGiven: BlogPost = {
  slug: "true-false-not-given",
  category: "ielts",
  title: "True, False or Not Given? The question the passage never answers",
  standfirst:
    "Most marks lost on this question type come from one habit: answering from what you know instead of from what the text says. Here is how to break it.",
  published: "2026-09-26",
  author: "EngProgress team",
  cover: { kicker: "T / F / NG" },
  featured: true,
  body: [
    {
      type: "p",
      text: "Of all the question types in IELTS Reading, True / False / Not Given has a reputation for being unfair. It is not unfair. It is precise, and the precision is the point. The question is never *is this statement true?* It is this: does **this passage** confirm it, contradict it, or say nothing about it?",
    },
    { type: "h2", text: "The three answers, defined properly" },
    {
      type: "list",
      items: [
        "**True** — the passage states the same idea, usually in different words.",
        "**False** — the passage states the opposite, or something that cannot be true at the same time.",
        "**Not Given** — the passage does not tell you either way. The topic may be there; this particular claim is not.",
      ],
    },
    {
      type: "p",
      text: "That last line is where the marks go. A statement on the right topic, using words you can find in the text, can still be Not Given — because the passage never makes *that* claim.",
    },
    { type: "h2", text: "Three traps that catch good readers" },
    {
      type: "p",
      text: "**1. The topic is there, the claim is not.** Suppose the passage says: *The bridge was completed in 1932 and remains the city's busiest crossing.* The statement *The bridge was expensive to build* is Not Given. Cost is a perfectly reasonable thing for a text about a bridge to discuss. This one does not.",
    },
    {
      type: "p",
      text: "**2. One small word changes the answer.** Words like *some*, *most*, *usually*, *may* and *only* carry the meaning. If the passage says *some researchers believe the diet works* and the statement says *researchers agree the diet works*, the answer is False: *some believe* and *agree* cannot both be true.",
    },
    {
      type: "p",
      text: "**3. Your own knowledge fills the gap.** You know that water boils at 100°C at sea level. If the passage never says so, a statement claiming it is Not Given — even though it is true. The test is about the text, not about the world.",
    },
    {
      type: "tip",
      title: "A quick test for Not Given",
      text: "Ask yourself: could the writer add one sentence that makes this statement True, and a different one that makes it False, without contradicting anything already written? If both are possible, the answer is Not Given.",
    },
    { type: "h2", text: "A routine that works under time pressure" },
    {
      type: "list",
      ordered: true,
      items: [
        "Read the statement and underline the part that could be wrong: a number, a qualifier, a comparison, a cause.",
        "Find the part of the passage about that topic. The statements follow the order of the text, so your previous answer tells you roughly where to look.",
        "Compare only the underlined part. Ignore the rest of the sentence.",
        "Agreement means True. A clear clash means False. Silence on that exact point means Not Given.",
      ],
    },
    {
      type: "p",
      text: "One more rule: do not spend three minutes on a single statement. If you have read the relevant paragraph twice and still cannot find the claim, that silence is usually your answer.",
    },
    { type: "h2", text: "Yes / No / Not Given is the same skill" },
    {
      type: "p",
      text: "When the questions are about the **writer's views** rather than facts, the labels change to Yes, No and Not Given. The logic does not change: does the writer agree with the statement, disagree with it, or not say?",
    },
  ],
  cta: {
    title: "Practise with an explanation for every answer",
    text: "EngProgress Reading marks each answer and shows the sentence that proves it — and why the wrong option looked right.",
    href: "/ielts-reading-practice",
    label: "IELTS Reading practice",
  },
};
