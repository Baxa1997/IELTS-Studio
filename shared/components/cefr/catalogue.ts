import {
  AlignLeft,
  FileText,
  Layers,
  ListChecks,
  ListOrdered,
  PenLine,
  SquarePen,
} from "lucide-react";

export const READING_PARTS = [
  {
    part: 1,
    title: "Sentence gap-fill",
    desc: "Type the missing words to complete a short text.",
    level: "B1",
    count: 6,
    Icon: AlignLeft,
  },
  {
    part: 2,
    title: "Text matching",
    desc: "Match eight statements to ten short notices.",
    level: "B1–B2",
    count: 8,
    Icon: Layers,
  },
  {
    part: 3,
    title: "Heading matching",
    desc: "Choose the best heading for each paragraph.",
    level: "B2",
    count: 6,
    Icon: ListOrdered,
  },
  {
    part: 4,
    title: "Multiple choice + T/F/NI",
    desc: "An academic passage with MCQ and True / False / Not Given.",
    level: "B2–C1",
    count: 9,
    Icon: ListChecks,
  },
  {
    part: 5,
    title: "Summary + multiple choice",
    desc: "Fill the summary gaps, then answer multiple choice.",
    level: "C1",
    count: 6,
    Icon: FileText,
  },
];

export const WRITING_TASKS_META = [
  {
    task: "1.1",
    title: "Informal message",
    desc: "A short note to a friend.",
    level: "B1",
    Icon: SquarePen,
  },
  {
    task: "1.2",
    title: "Formal letter",
    desc: "A letter to a manager or an official.",
    level: "B2",
    Icon: PenLine,
  },
  {
    task: "2",
    title: "Forum opinion post",
    desc: "An argued response to an online discussion.",
    level: "C1",
    Icon: FileText,
  },
];
