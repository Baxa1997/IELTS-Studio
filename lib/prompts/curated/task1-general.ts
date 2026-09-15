/**
 * General Training Writing Task 1 letters for the curated practice set (see
 * ../starter-set). The starter set had none, so the General Training tab opened
 * empty for every learner.
 *
 * Built on the SHAPE of the real exam (CLAUDE.md §IP): a one- or two-sentence
 * situation, "Write a letter to …. In your letter" with exactly three bullet
 * points, and the salutation cue. As in the exam, the register is never named —
 * the reader implies it (a company or official ⇒ formal; a manager, landlord,
 * neighbour or tutor ⇒ semi-formal; a friend ⇒ informal), which is exactly what
 * the grader judges tone against.
 *
 * Ten of each register, spread across the real purposes: complaining,
 * requesting, applying, apologising, inviting, thanking, advising, explaining.
 */

import type { LetterRegister, StarterPrompt } from "./shared";

const SALUTATION: Record<LetterRegister, string> = {
  formal: "Dear Sir or Madam,",
  semi_formal: "Dear ............,",
  informal: "Dear ............,",
};

function letter(
  register: LetterRegister,
  topic_family: string,
  difficulty: number,
  situation: string,
  reader: string,
  bullets: [string, string, string],
): StarterPrompt {
  return {
    task_type: "task1_general",
    category: null,
    topic_family,
    difficulty,
    register,
    prompt_text: [
      situation,
      "",
      `Write a letter to ${reader}. In your letter`,
      ...bullets.map((b) => `• ${b}`),
      "",
      "Begin your letter as follows:",
      SALUTATION[register],
    ].join("\n"),
  };
}

// ---- Formal: a company, an organisation or an official ----------------------

const FORMAL: StarterPrompt[] = [
  letter(
    "formal",
    "shopping",
    5,
    "You recently bought a kitchen appliance from an online shop, but it stopped working after only two weeks.",
    "the shop's customer services manager",
    [
      "give details of what you bought and when",
      "describe the problem with the appliance",
      "say what you would like the shop to do",
    ],
  ),
  letter(
    "formal",
    "travel",
    6,
    "Last week you travelled by train and left a bag containing some important items on board.",
    "the railway company",
    [
      "give details of your journey",
      "describe the bag and what was inside it",
      "explain why it is important that you get the items back",
    ],
  ),
  letter(
    "formal",
    "community",
    7,
    "A park near your home has become run-down, and far fewer local people use it than in the past.",
    "your local council",
    [
      "describe the current condition of the park",
      "explain how this affects people who live nearby",
      "suggest what improvements the council could make",
    ],
  ),
  letter(
    "formal",
    "work",
    6,
    "You have seen an advertisement for a part-time job as a guide at a local history museum.",
    "the manager of the museum",
    [
      "explain why you are interested in the job",
      "describe the skills and experience that make you suitable",
      "say when you would be available to work",
    ],
  ),
  letter(
    "formal",
    "services",
    8,
    "You have received an electricity bill that is much higher than usual, and you believe the company has made a mistake.",
    "the electricity company",
    [
      "explain why you think the bill is wrong",
      "describe what happened when you tried to sort out the problem by phone",
      "say what action you now expect the company to take",
    ],
  ),
  letter(
    "formal",
    "education",
    6,
    "You would like to join an evening photography course at a college in your city.",
    "the college",
    [
      "explain why you want to take the course",
      "describe your experience of photography so far",
      "ask for information about the timetable and the fees",
    ],
  ),
  letter(
    "formal",
    "travel",
    8,
    "A tour you had booked and paid for in advance was cancelled on the morning it was due to start, with very little explanation.",
    "the tour company",
    [
      "give details of the tour you booked",
      "explain the problems the cancellation caused you",
      "say what you expect the company to do to put things right",
    ],
  ),
  letter(
    "formal",
    "housing",
    5,
    "The heating in the flat you rent has stopped working, and it has still not been repaired.",
    "the agency that manages the flat",
    [
      "describe the problem with the heating",
      "explain how it is affecting you",
      "say what you would like the agency to do",
    ],
  ),
  letter(
    "formal",
    "community",
    6,
    "Many children in your area have to cross a busy road on their way to school, and there have been several near accidents.",
    "the road safety department of your city council",
    [
      "describe where the road is and why it is dangerous",
      "give an example of something that happened recently",
      "suggest what could be done to make the road safer",
    ],
  ),
  letter(
    "formal",
    "media",
    7,
    "A local newspaper recently published an article claiming that young people in your town show no interest in helping their community.",
    "the editor of the newspaper",
    [
      "say why you disagree with the article",
      "give examples of young people who help the community",
      "suggest how the newspaper could cover this subject in future",
    ],
  ),
];

// ---- Semi-formal: someone you know in a work, study or local role -----------

const SEMI_FORMAL: StarterPrompt[] = [
  letter(
    "semi_formal",
    "housing",
    5,
    "Your neighbour's dog barks for long periods every day while they are out at work.",
    "your neighbour",
    [
      "describe the problem",
      "explain how it is affecting you",
      "suggest what could be done about it",
    ],
  ),
  letter(
    "semi_formal",
    "work",
    6,
    "You need to take two weeks off work next month to deal with an important personal matter.",
    "your manager",
    [
      "explain why you need the time off",
      "say how your work could be covered while you are away",
      "offer a way to make up for the time",
    ],
  ),
  letter(
    "semi_formal",
    "work",
    7,
    "You have an idea that would make your workplace more environmentally friendly.",
    "the head of your department",
    [
      "describe your idea",
      "explain how it would benefit the company",
      "say how you could help to put it into practice",
    ],
  ),
  letter(
    "semi_formal",
    "education",
    6,
    "You are taking a course, and you will not be able to hand in an important assignment by the deadline.",
    "your course tutor",
    [
      "explain why the assignment will be late",
      "say how much of the work you have already completed",
      "ask for a new deadline",
    ],
  ),
  letter(
    "semi_formal",
    "community",
    5,
    "You are organising a clean-up day for the street where you live.",
    "your neighbours",
    [
      "explain why you are organising the event",
      "give details of when it will take place and what will happen",
      "ask them to help in some way",
    ],
  ),
  letter(
    "semi_formal",
    "housing",
    7,
    "You rent a flat and would like to keep a pet, but your rental agreement says you need your landlord's permission.",
    "your landlord",
    [
      "describe the pet you would like to keep",
      "explain why you would like to have it",
      "say how you would make sure the flat is not damaged",
    ],
  ),
  letter(
    "semi_formal",
    "work",
    8,
    "A colleague from another branch of your company visited your office last week, but because of a mistake you made, you were not there to meet them.",
    "your colleague",
    [
      "apologise and explain what went wrong",
      "say what you had planned to discuss with them",
      "suggest another way for you to meet",
    ],
  ),
  letter(
    "semi_formal",
    "leisure",
    6,
    "You are a member of a sports club, and you feel that the club's timetable does not suit many of its members.",
    "the club secretary",
    [
      "explain what the problem with the timetable is",
      "describe how it affects members like you",
      "suggest changes that could be made",
    ],
  ),
  letter(
    "semi_formal",
    "education",
    8,
    "You are applying for a place on a postgraduate course and need a reference from a manager you used to work for.",
    "your former manager",
    [
      "remind them of the work you did together",
      "explain why you are applying for the course",
      "say what you would like the reference to mention",
    ],
  ),
  letter(
    "semi_formal",
    "family",
    7,
    "Your child has recently seemed unhappy about going to school, and you think there may be a problem with another pupil in the class.",
    "your child's teacher",
    [
      "describe the changes you have noticed in your child",
      "explain what you think may be causing the problem",
      "suggest a meeting to discuss it",
    ],
  ),
];

// ---- Informal: a friend ----------------------------------------------------

const INFORMAL: StarterPrompt[] = [
  letter(
    "informal",
    "travel",
    5,
    "You have recently moved to a new town, and you would like a friend to come and stay with you.",
    "your friend",
    [
      "describe your new town",
      "suggest a good time for them to visit",
      "say what you could do together during their stay",
    ],
  ),
  letter(
    "informal",
    "leisure",
    6,
    "A friend looked after your home and your plants while you were away on holiday.",
    "your friend",
    [
      "thank them for their help",
      "tell them about something that happened on your holiday",
      "suggest how you could return the favour",
    ],
  ),
  letter(
    "informal",
    "family",
    7,
    "You were unable to go to a close friend's graduation party last weekend, even though you had promised to be there.",
    "your friend",
    [
      "apologise for missing the party",
      "explain what happened",
      "suggest a way to celebrate together soon",
    ],
  ),
  letter(
    "informal",
    "education",
    5,
    "A friend is coming to study in your city for a year and has asked you for some advice.",
    "your friend",
    [
      "recommend an area of the city to live in",
      "give advice about getting around the city",
      "tell them about some things to do in their free time",
    ],
  ),
  letter(
    "informal",
    "leisure",
    6,
    "You borrowed a camera from a friend for a trip, and it was damaged while you were using it.",
    "your friend",
    [
      "explain how the camera was damaged",
      "say how you feel about what happened",
      "tell them what you are going to do about it",
    ],
  ),
  letter(
    "informal",
    "work",
    8,
    "A friend has offered you a job in the new business they are starting, but you have decided to turn the offer down.",
    "your friend",
    [
      "thank them for the offer",
      "explain why you have decided not to accept it",
      "suggest another way you could support their business",
    ],
  ),
  letter(
    "informal",
    "work",
    7,
    "You have just been offered a job in another country and have decided to accept it.",
    "an old friend",
    [
      "tell them about the job",
      "explain why you decided to accept it",
      "describe how you feel about moving abroad",
    ],
  ),
  letter(
    "informal",
    "travel",
    6,
    "You and some friends are planning a weekend trip together, and you have offered to organise it.",
    "one of the friends in the group",
    [
      "suggest a place to go and say why you have chosen it",
      "describe the travel arrangements",
      "ask them to help with one part of the planning",
    ],
  ),
  letter(
    "informal",
    "business",
    5,
    "A friend has just opened a small café in the town where they live.",
    "your friend",
    [
      "congratulate them",
      "say what you think will help the café to succeed",
      "tell them when you are planning to visit",
    ],
  ),
  letter(
    "informal",
    "education",
    8,
    "A friend has written to tell you that they are thinking of leaving university to start work, and they have asked for your opinion.",
    "your friend",
    [
      "say how you feel about their plan",
      "describe the advantages and disadvantages of leaving now",
      "advise them on what to do next",
    ],
  ),
];

export const CURATED_TASK1_GENERAL: StarterPrompt[] = [...FORMAL, ...SEMI_FORMAL, ...INFORMAL];
