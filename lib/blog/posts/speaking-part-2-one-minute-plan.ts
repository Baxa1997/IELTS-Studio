import type { BlogPost } from "../types";

export const speakingPart2OneMinutePlan: BlogPost = {
  slug: "speaking-part-2-one-minute-plan",
  category: "ielts",
  title: "The one-minute plan: how to keep talking for two minutes in Speaking Part 2",
  standfirst:
    "You get a cue card, a pencil and sixty seconds. What you write in that minute decides whether you run out of things to say.",
  published: "2026-09-26",
  author: "EngProgress team",
  cover: { kicker: "Part 2" },
  body: [
    {
      type: "p",
      text: "In Part 2 of the Speaking test the examiner gives you a card with a topic and a few prompts. You have one minute to prepare, with paper and a pencil for notes. Then you speak for up to two minutes — the examiner will stop you — and may ask one or two short questions afterwards.",
    },
    {
      type: "p",
      text: "Most candidates do not struggle in Part 2 because their English is weak. They struggle because they finish in forty seconds and sit in silence, or because they spend the minute writing full sentences and then read them out.",
    },
    { type: "h2", text: "Do not write sentences. Write a map." },
    {
      type: "p",
      text: "Sixty seconds is enough for about a dozen words. Use them for **keywords you can talk around**, not for a script. One line per prompt works well, plus one extra line nobody asked for.",
    },
    {
      type: "example",
      title: "Describe a place you visited that you would like to go back to",
      rows: [
        { label: "Where", text: "Samarkand — Registan, early morning" },
        { label: "When, who", text: "school trip, a teacher who knew the history" },
        { label: "What", text: "tilework, bread market, got lost from the group" },
        { label: "Why return", text: "saw it in a rush — want the evening light" },
        { label: "Extra", text: "grandfather's story about the square" },
      ],
    },
    {
      type: "p",
      text: "The extra line matters most. When you reach the end of the prompts with forty seconds left, it is what you talk about next — a story, a comparison, a feeling.",
    },
    { type: "h2", text: "Four moves that buy you time naturally" },
    {
      type: "list",
      items: [
        "**Set the scene** before you answer: when it was, who you were with, what the weather was like. It is relevant, and it is easy to say.",
        "**Give an example** for every general statement. *The food was good* is four words. What you ate, and where, is thirty.",
        "**Compare** then and now, or this place and another one.",
        "**Say how you felt, and why.** Feelings are where the less common vocabulary lives.",
      ],
    },
    {
      type: "tip",
      title: "Practise with a timer — out loud",
      text: "Planning in your head is a different skill. Set one minute to plan and two to speak, record yourself, and listen back for long pauses and repeated words.",
    },
    { type: "h2", text: "What the examiner is listening for" },
    {
      type: "p",
      text: "Part 2 is assessed on the same four criteria as the rest of the test: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. The long turn is your best chance to show **fluency** — speaking at length without obvious effort — and **coherence**, which simply means being easy to follow. Signposts help: *The main reason was…*, *What surprised me was…*, *Looking back…*",
    },
    {
      type: "p",
      text: "And do not memorise an answer. Rehearsed speech is easy to recognise, and a prepared story rarely fits the card you are actually given.",
    },
  ],
  cta: {
    title: "Try a Part 2 card now",
    text: "Practise Part 2 with a cue card and a timer, or sit the full three-part speaking mock with an AI examiner.",
    href: "/ielts-speaking-practice",
    label: "IELTS Speaking practice",
  },
};
