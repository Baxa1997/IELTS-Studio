import { fromList, gapFill, mcq, tfng, ynng, type CuratedPassage } from "./shared";

const TIME_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const DEEP_TIME: CuratedPassage = {
  key: "deep-time",
  title: "Learning to Count in Millions",
  topic: "how the age of the Earth was argued about and eventually measured",
  difficulty: 8,
  body: `A) The modern figure for the age of the Earth is four and a half billion years, and it is known to within about one per cent. Getting to it took three centuries, and the obstacle was never a shortage of cleverness. It was that every method available before the twentieth century measured a rate, and a rate can only give an age if you assume it has been constant, which is exactly the thing that could not be checked.

B) The first serious attempts were arithmetic on the wrong evidence. In the seventeenth century an Irish archbishop summed the generations recorded in scripture and arrived at a creation date in 4004 BCE, a calculation that was careful, internally consistent and rested on a source that does not contain the information it was asked for. It is worth noticing that his method was not unreasonable given his premises; the error was in the premises.

C) Field observation broke the figure within a century. A Scottish farmer and physician, James Hutton, examined a place on the Berwickshire coast where near-vertical beds of rock are overlain by gently sloping ones. Reading the sequence required an enormous span of time: the lower beds had to be laid down horizontally, hardened, tilted to the vertical, eroded flat, submerged, and then buried under new sediment that itself hardened. No conceivable rate of any of those processes fits inside a few thousand years, and Hutton concluded that the Earth's history showed "no vestige of a beginning".

D) That established that the age was large without establishing what it was. Nineteenth-century attempts to put a number on it used rates: the thickness of accumulated sediment divided by the rate at which sediment accumulates; the saltiness of the ocean divided by the rate at which rivers deliver salt. Both gave figures in the order of a hundred million years, and both were wrong for the same reason. Sediment is eroded and re-deposited, so the pile is not cumulative; salt is removed from seawater by processes nobody had accounted for.

E) The most formidable objection came from physics. Lord Kelvin calculated how long a body the size of the Earth would take to cool from a molten state to its present temperature and arrived at a figure between twenty and a hundred million years, later narrowing it further. His arithmetic was correct. Geologists, who could see that their sequences needed far longer, had no answer to it, and for forty years the discipline was in the position of knowing that a rigorous calculation from a respected physicist must be wrong without being able to say why.

F) It was wrong because of something nobody knew existed. Radioactive decay, discovered in 1896, releases heat continuously within the Earth, so the planet has not simply been cooling from an initial store; it has an internal source. Kelvin's model was sound and its premise was incomplete, which is the same failure as the archbishop's, arrived at by an incomparably more rigorous route.

G) The same discovery supplied the answer. Radioactive decay proceeds at a rate that is unaffected by temperature, pressure or chemistry, which makes it the constant-rate process every earlier method had assumed and none had possessed. Measuring the proportion of a parent isotope to the daughter it decays into gives the time since the mineral formed. Early results in the 1900s already gave billions of years; the modern figure was established in the 1950s using meteorites, on the reasoning that they formed at the same time as the planet and have not been reworked since.

H) What I find instructive is the shape of the two big errors. Both the biblical chronology and Kelvin's cooling calculation were competent work built on a premise that was not visible to the person making it — that scripture recorded elapsed time, that the Earth had no internal heat source. In each case the mistake was invisible from inside the calculation and obvious from outside it, and in each case it was corrected not by better arithmetic but by the discovery of something the calculation had not known to include. That is worth remembering when a very precise figure is produced by a method nobody has yet found a reason to doubt.`,
  questions: [
    fromList(
      "matching_information",
      TIME_PARAGRAPHS,
      "a description of a rock sequence requiring an enormous span of time",
      "C",
      "Reading the sequence required an enormous span of time: the lower beds had to be laid down horizontally, hardened, tilted to the vertical, eroded flat, submerged, and then buried under new sediment that itself hardened.",
      "Paragraph C describes the Berwickshire sequence.",
    ),
    fromList(
      "matching_information",
      TIME_PARAGRAPHS,
      "the property of decay that makes it suitable for dating",
      "G",
      "Radioactive decay proceeds at a rate that is unaffected by temperature, pressure or chemistry, which makes it the constant-rate process every earlier method had assumed and none had possessed.",
      "Paragraph G names the constant rate.",
    ),
    fromList(
      "matching_information",
      TIME_PARAGRAPHS,
      "two nineteenth-century estimates that failed for similar reasons",
      "D",
      "Nineteenth-century attempts to put a number on it used rates: the thickness of accumulated sediment divided by the rate at which sediment accumulates; the saltiness of the ocean divided by the rate at which rivers deliver salt.",
      "Paragraph D gives the sediment and salt estimates.",
    ),
    fromList(
      "matching_information",
      TIME_PARAGRAPHS,
      "a comparison between two errors made centuries apart",
      "H",
      "Both the biblical chronology and Kelvin's cooling calculation were competent work built on a premise that was not visible to the person making it — that scripture recorded elapsed time, that the Earth had no internal heat source.",
      "Paragraph H compares the two errors.",
    ),
    fromList(
      "matching_information",
      TIME_PARAGRAPHS,
      "a period during which geologists could not answer a physical argument",
      "E",
      "Geologists, who could see that their sequences needed far longer, had no answer to it, and for forty years the discipline was in the position of knowing that a rigorous calculation from a respected physicist must be wrong without being able to say why.",
      "Paragraph E describes the forty years.",
    ),
    tfng(
      "The present figure for the Earth's age carries an uncertainty of about one per cent.",
      "TRUE",
      "The modern figure for the age of the Earth is four and a half billion years, and it is known to within about one per cent.",
      "It is known 'to within about one per cent'.",
    ),
    tfng(
      "Kelvin made an arithmetical mistake in his calculation.",
      "FALSE",
      "His arithmetic was correct.",
      "'His arithmetic was correct.'",
    ),
    tfng(
      "The modern figure was obtained from rocks on the Earth's surface.",
      "FALSE",
      "Early results in the 1900s already gave billions of years; the modern figure was established in the 1950s using meteorites, on the reasoning that they formed at the same time as the planet and have not been reworked since.",
      "It was established 'using meteorites'.",
    ),
    ynng(
      "The writer thinks the seventeenth-century calculation was carelessly done.",
      "NO",
      "In the seventeenth century an Irish archbishop summed the generations recorded in scripture and arrived at a creation date in 4004 BCE, a calculation that was careful, internally consistent and rested on a source that does not contain the information it was asked for.",
      "It was 'careful, internally consistent'.",
    ),
    ynng(
      "The writer believes better arithmetic would have resolved these disputes.",
      "NO",
      "In each case the mistake was invisible from inside the calculation and obvious from outside it, and in each case it was corrected not by better arithmetic but by the discovery of something the calculation had not known to include.",
      "Correction came from discovery, not arithmetic.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Hutton concluded that the Earth showed no vestige of a ______.",
      "beginning",
      'No conceivable rate of any of those processes fits inside a few thousand years, and Hutton concluded that the Earth\'s history showed "no vestige of a beginning".',
      "He saw 'no vestige of a beginning'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Radioactive ______ was discovered in 1896 and supplies heat inside the Earth.",
      "decay",
      "Radioactive decay, discovered in 1896, releases heat continuously within the Earth, so the planet has not simply been cooling from an initial store; it has an internal source.",
      "'Radioactive decay, discovered in 1896'.",
    ),
    mcq(
      "Why did the sediment estimate fail?",
      [
        "Sediment is eroded and laid down again",
        "The rate of deposition was never measured",
        "Sediment layers cannot be counted reliably",
        "Only marine sediment was considered",
      ],
      "Sediment is eroded and laid down again",
      "Sediment is eroded and re-deposited, so the pile is not cumulative; salt is removed from seawater by processes nobody had accounted for.",
      "The pile 'is not cumulative'.",
    ),
    mcq(
      "What does dating a mineral by isotopes actually measure?",
      [
        "The time since the mineral formed",
        "The temperature at which it formed",
        "The age of the surrounding rock",
        "The rate at which decay proceeds",
      ],
      "The time since the mineral formed",
      "Measuring the proportion of a parent isotope to the daughter it decays into gives the time since the mineral formed.",
      "It gives 'the time since the mineral formed'.",
    ),
  ],
};
