import type { BlogPost } from "../types";

export const planTask2InFiveMinutes: BlogPost = {
  slug: "plan-task-2-in-five-minutes",
  category: "ielts",
  title: "How to plan an IELTS Task 2 essay in five minutes",
  standfirst:
    "Five minutes of planning feels like time you cannot spare. It is the best-spent five minutes of the Writing test — here is what to do with them.",
  published: "2026-09-26",
  author: "EngProgress team",
  cover: { kicker: "Task 2" },
  body: [
    {
      type: "p",
      text: "Task 2 counts for twice as much as Task 1, so it deserves about forty of your sixty minutes, and at least 250 words. Spend the first five of those minutes planning. Candidates who start writing immediately usually change their mind halfway through — and an essay that changes its mind is the one thing Task Response does not forgive.",
    },
    { type: "h2", text: "Minute 1: find every question inside the question" },
    {
      type: "p",
      text: "Read the prompt twice and name its type. *To what extent do you agree?* wants a position. *Discuss both views and give your own opinion* wants both sides **and** your view. *Advantages and disadvantages*, *causes and solutions*, and prompts that ask two direct questions each want every part answered.",
    },
    {
      type: "p",
      text: "Underline each part. An essay that answers half of a two-part question is capped on Task Response, however good its English.",
    },
    { type: "h2", text: "Minute 2: decide what you think, and say it early" },
    {
      type: "p",
      text: "The public band descriptors ask, at Band 7, for a clear position *throughout* the response. That means your view appears in the introduction, stays the same in every body paragraph, and returns in the conclusion. You do not need to believe it. You need to hold it for 250 words.",
    },
    { type: "h2", text: "Minutes 3 and 4: two ideas, each with an example" },
    {
      type: "p",
      text: "One main idea per body paragraph, developed rather than listed: the claim, why it is true, an example, and a line tying it back to the question. Two well-developed ideas beat four mentioned ones.",
    },
    {
      type: "example",
      title: "Some people think museums should be free to enter. To what extent do you agree?",
      rows: [
        { label: "Position", text: "Agree, with one exception" },
        { label: "Paragraph 1", text: "Free entry widens access — students, families; example: school visits" },
        { label: "Paragraph 2", text: "Money can come from elsewhere — donations, shops, charging for special exhibitions" },
        { label: "Exception", text: "Small private museums may not survive without tickets" },
      ],
    },
    { type: "h2", text: "Minute 5: check the plan against the prompt" },
    {
      type: "p",
      text: "Read the question one more time and tick each underlined part against your plan. This is the moment to catch the missing half of a two-part question — not in minute 38.",
    },
    {
      type: "tip",
      title: "Leave the template at home",
      text: "An opening like *This is a controversial issue that has sparked heated debate* could sit on top of any essay, which is exactly why it says nothing about yours. Memorised sentences add no ideas, and a response built mostly from them is marked down on Task Response.",
    },
  ],
  cta: {
    title: "See where your essay stands",
    text: "Paste a Task 2 essay into the free checker and get a band for each criterion, with the evidence behind it and what holds it back.",
    href: "/grade",
    label: "Free IELTS writing checker",
  },
};
