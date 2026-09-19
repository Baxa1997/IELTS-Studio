import { gapFill, mcq, noteLine, tfng, type CuratedPassage } from "./shared";

const BELL_NOTES = {
  title: "Where the school day came from",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

export const SCHOOL_BELL: CuratedPassage = {
  key: "school-bell",
  title: "Why the Lesson Ends When It Does",
  topic: "the origins of the school timetable and the arguments about changing it",
  difficulty: 4,
  body: `A school day divided into periods of forty or fifty minutes, marked by a bell, taught by a subject specialist to a class of about thirty pupils of the same age, is so familiar that it seems like a description of what a school is. It is in fact a description of one particular arrangement, adopted in a particular period for particular reasons, and almost every part of it was decided by something other than how children learn.

The age-graded class came first. Before the nineteenth century, a village school commonly held every child in one room with one teacher, who worked with small groups in turn while the rest did set tasks. Sorting children by age into separate classes, each moving up together each year, was imported into English-speaking countries from Prussia in the middle of the century, and it spread because it made a large school manageable rather than because anybody had shown it produced better results.

The bell and the fixed period followed from a different requirement. A secondary school teaching several subjects with specialist teachers must move pupils between rooms, and if every class changes at a different moment the corridors are never empty and no teacher knows when the next group will arrive. A common signal solves that, and its length was set by what the timetable had to accommodate rather than by any finding about attention. Forty to fifty minutes divides a morning conveniently and leaves time for the movement between.

The shape of the year has even less to do with education. The long summer break is often explained by the need for children to help with the harvest, which is largely a myth: rural schools historically closed in spring and autumn, when planting and harvesting actually happen, and stayed open through the summer. The modern summer holiday was standardised in the late nineteenth century for urban reasons — heat in unventilated buildings, the risk of disease, and the wish of middle-class families to leave the city — and rural schools were brought into line afterwards.

The start time is the part with the clearest evidence against it. Adolescent sleep timing shifts later at puberty, by a biological mechanism rather than a preference, and typical secondary start times require teenagers to be awake and learning during hours when their physiology is still in the night. Trials of later starts have repeatedly found improvements in attendance, in reported sleep, and in attainment, along with a sharp fall in road accidents among students who drive. The finding is about as consistent as findings in education research get.

The reason schools have not generally moved is that the school day is embedded in everything around it. Transport is shared with the morning commute, buses run two or three routes in sequence, parents' working hours assume the drop-off, after-school sport uses daylight, and younger siblings are at primary schools on a different timetable. A change in start time is not a decision a school makes; it is a decision a city makes.

It is worth noticing which parts of the arrangement have changed and which have not. Corporal punishment, single-sex classes, the recitation of tables and the slate have all gone. The period, the bell, the age-graded class and the September start have survived every reform of the past century, and they have survived because they are the parts that hold the building together rather than the parts anybody defends on educational grounds.

Alternatives exist and have been tried. Some schools run blocks of ninety minutes, on the argument that a subject needing practical work cannot get started in forty; some run a four-day week; a few abandon the bell and let teachers end lessons themselves. The evidence on block scheduling is mixed and depends heavily on whether teachers change how they teach when given the longer period, which is exactly what one would expect — a longer block used for the same activities is simply a longer version of the same lesson.

What the history suggests is not that the standard timetable is wrong but that it is an answer to logistical questions that have been mistaken for an answer to educational ones. It was designed to move a large number of children through a building efficiently, and it does that extremely well. Whether it is also the best arrangement for learning is a separate question, and it is one that the arrangement's own success has made unusually hard to ask.`,
  questions: [
    tfng(
      "The familiar school timetable was designed around how children learn.",
      "FALSE",
      "It is in fact a description of one particular arrangement, adopted in a particular period for particular reasons, and almost every part of it was decided by something other than how children learn.",
      "It was decided by 'something other than how children learn'.",
    ),
    tfng(
      "Village schools once taught children of all ages together.",
      "TRUE",
      "Before the nineteenth century, a village school commonly held every child in one room with one teacher, who worked with small groups in turn while the rest did set tasks.",
      "All children were in 'one room with one teacher'.",
    ),
    tfng(
      "Age-graded classes were adopted because they were shown to work better.",
      "FALSE",
      "Sorting children by age into separate classes, each moving up together each year, was imported into English-speaking countries from Prussia in the middle of the century, and it spread because it made a large school manageable rather than because anybody had shown it produced better results.",
      "It spread because it 'made a large school manageable'.",
    ),
    tfng(
      "The length of a lesson was chosen on the basis of research into attention.",
      "FALSE",
      "A common signal solves that, and its length was set by what the timetable had to accommodate rather than by any finding about attention.",
      "It was set by the timetable's needs.",
    ),
    tfng(
      "Rural schools historically closed during the summer.",
      "FALSE",
      "The long summer break is often explained by the need for children to help with the harvest, which is largely a myth: rural schools historically closed in spring and autumn, when planting and harvesting actually happen, and stayed open through the summer.",
      "They 'stayed open through the summer'.",
    ),
    tfng(
      "Later start times have been linked to fewer road accidents.",
      "TRUE",
      "Trials of later starts have repeatedly found improvements in attendance, in reported sleep, and in attainment, along with a sharp fall in road accidents among students who drive.",
      "There is 'a sharp fall in road accidents'.",
    ),
    tfng(
      "Longer lesson blocks improve results regardless of how they are used.",
      "FALSE",
      "The evidence on block scheduling is mixed and depends heavily on whether teachers change how they teach when given the longer period, which is exactly what one would expect — a longer block used for the same activities is simply a longer version of the same lesson.",
      "It 'depends heavily on whether teachers change how they teach'.",
    ),
    noteLine(
      BELL_NOTES,
      null,
      "Classes sorted by ______ were brought in from Prussia",
      "age",
      "Sorting children by age into separate classes, each moving up together each year, was imported into English-speaking countries from Prussia in the middle of the century, and it spread because it made a large school manageable rather than because anybody had shown it produced better results.",
      "Children were sorted 'by age'.",
    ),
    noteLine(
      BELL_NOTES,
      null,
      "A common ______ was needed so that classes changed together",
      "signal",
      "A common signal solves that, and its length was set by what the timetable had to accommodate rather than by any finding about attention.",
      "'A common signal solves that'.",
      { before: [{ text: "Three decisions, none of them educational:", indent: 0 }] },
    ),
    noteLine(
      BELL_NOTES,
      null,
      "The summer break was standardised for urban reasons such as ______",
      "heat",
      "The modern summer holiday was standardised in the late nineteenth century for urban reasons — heat in unventilated buildings, the risk of disease, and the wish of middle-class families to leave the city — and rural schools were brought into line afterwards.",
      "The reasons include 'heat in unventilated buildings'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Teenagers' sleep timing shifts later at ______.",
      "puberty",
      "Adolescent sleep timing shifts later at puberty, by a biological mechanism rather than a preference, and typical secondary start times require teenagers to be awake and learning during hours when their physiology is still in the night.",
      "It 'shifts later at puberty'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Some schools now run blocks of ______ minutes instead.",
      "ninety",
      "Some schools run blocks of ninety minutes, on the argument that a subject needing practical work cannot get started in forty; some run a four-day week; a few abandon the bell and let teachers end lessons themselves.",
      "They run 'blocks of ninety minutes'.",
    ),
    mcq(
      "Why is changing the start time difficult?",
      [
        "It depends on arrangements across a whole city",
        "Teachers are contracted to fixed hours",
        "Pupils prefer the current timetable",
        "The evidence for later starts is weak",
      ],
      "It depends on arrangements across a whole city",
      "A change in start time is not a decision a school makes; it is a decision a city makes.",
      "'It is a decision a city makes.'",
    ),
    mcq(
      "What is the passage's overall conclusion about the timetable?",
      [
        "It answers logistical questions rather than educational ones",
        "It should be replaced with block scheduling",
        "It has no defensible justification at all",
        "It was designed for rural rather than urban schools",
      ],
      "It answers logistical questions rather than educational ones",
      "What the history suggests is not that the standard timetable is wrong but that it is an answer to logistical questions that have been mistaken for an answer to educational ones.",
      "It answers logistical questions.",
    ),
  ],
};
