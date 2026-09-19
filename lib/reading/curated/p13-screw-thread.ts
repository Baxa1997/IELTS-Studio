import { fromList, gapFill, mcq, tfng, type CuratedPassage } from "./shared";

const THREAD_BANK = [
  "angle",
  "pitch",
  "gauges",
  "interchangeable",
  "lathe",
  "tolerance",
  "inspection",
  "standard",
  "rust",
];

export const SCREW_THREAD: CuratedPassage = {
  key: "screw-thread",
  title: "The Most Boring Invention That Mattered",
  topic: "how agreeing on the shape of a screw made mass production possible",
  difficulty: 6,
  body: `Until the middle of the nineteenth century, a screw and the hole it fitted were a matched pair. Each was cut by hand or on a lathe set up for that job, and neither would fit anything else. A machine that needed a replacement bolt did not get a bolt from a box; it got a fitter, who made one to suit the hole in front of him. Repair was therefore a craft operation, and every machine was, in a small but decisive sense, unique.

The reason was not that anybody preferred it. Cutting a thread requires the cutting tool to advance along the work at an exact rate as the work turns, and before the screw-cutting lathe the rate was set by hand, by eye and by the skill of the operator. A lathe of that kind was built by Henry Maudslay around 1800, with a lead screw geared to the spindle so that the tool advanced a fixed distance per revolution, and it made a repeatable thread possible for the first time. What it did not do was make anybody's thread the same as anybody else's.

Joseph Whitworth, who had worked for Maudslay, took the next step in 1841 by proposing that everybody should use the same one. He had collected threads from workshops across the country and found a chaos: every firm had its own practice, and often several. His proposal specified the thread angle at fifty-five degrees, rounded the crest and the root rather than leaving them sharp, and fixed the pitch — the distance between successive turns — for each diameter of bolt.

The choices were reasoned. The rounded crest and root were the most important detail, because a sharp internal corner concentrates stress and is where a bolt fails; rounding them made a stronger fastener out of the same material. The fixed pitch for each diameter meant that a half-inch bolt was one thing rather than a family of possibilities.

Adoption was not immediate, and it was not driven by argument. The railways settled it. A locomotive that broke down two hundred miles from the works needed parts that could be carried in a van, and a railway company that insisted on Whitworth's thread in everything it bought made every supplier to that company adopt it. Within twenty years the British engineering industry had effectively standardised, and the specification was being taught as though it had always existed.

The deeper significance is what it made possible rather than what it fixed. A standard thread is a precondition for interchangeable parts, and interchangeable parts are the precondition for assembly by semi-skilled labour rather than by fitters. If any bolt from the bin fits any hole, the person putting the machine together does not need to know how to cut a thread, and the machine can be built by people who could not have made it.

Standardisation also required something else, which is often left out of the account: a way of checking. Whitworth produced measuring instruments capable of detecting a difference of a ten-thousandth of an inch, and the gauges derived from them are what allowed a specification to be enforced rather than merely published. A standard nobody can verify is an aspiration.

The sequel is less tidy. The United States adopted a different thread with a sixty-degree angle, France and Germany developed their own, and the metric system eventually produced a third family. Efforts to unify them ran for a century, and the eventual agreement in 1948 covered the English-speaking countries and left the metric thread alongside it. The result is that a modern workshop keeps two sets of everything, and that a bolt which looks right may not be, since the angle differs by five degrees and the pitch by a fraction of a millimetre — close enough to start and to strip out under load.

That is the durable lesson of the episode. The cost of a standard is paid once, by whoever adopts it; the cost of two standards is paid repeatedly, by everybody, for as long as both survive. Whitworth solved the problem for a country at exactly the moment when the industries concerned were about to become international, which is why the solution was both complete and too small.`,
  questions: [
    tfng(
      "Before standardisation, a replacement bolt was usually made on the spot.",
      "TRUE",
      "A machine that needed a replacement bolt did not get a bolt from a box; it got a fitter, who made one to suit the hole in front of him.",
      "A fitter 'made one to suit the hole'.",
    ),
    tfng(
      "Maudslay's lathe produced threads that matched those of other workshops.",
      "FALSE",
      "What it did not do was make anybody's thread the same as anybody else's.",
      "It did not make threads match between workshops.",
    ),
    tfng(
      "Whitworth surveyed existing practice before making his proposal.",
      "TRUE",
      "He had collected threads from workshops across the country and found a chaos: every firm had its own practice, and often several.",
      "He 'had collected threads from workshops across the country'.",
    ),
    tfng(
      "Rounding the crest and root of the thread weakened the bolt.",
      "FALSE",
      "The rounded crest and root were the most important detail, because a sharp internal corner concentrates stress and is where a bolt fails; rounding them made a stronger fastener out of the same material.",
      "Rounding 'made a stronger fastener'.",
    ),
    tfng(
      "The standard was adopted mainly because engineers were persuaded by argument.",
      "FALSE",
      "Adoption was not immediate, and it was not driven by argument.",
      "It 'was not driven by argument'.",
    ),
    tfng(
      "Interchangeable parts allow machines to be assembled by less skilled workers.",
      "TRUE",
      "If any bolt from the bin fits any hole, the person putting the machine together does not need to know how to cut a thread, and the machine can be built by people who could not have made it.",
      "The assembler need not know how to cut a thread.",
    ),
    tfng(
      "The 1948 agreement brought the metric thread into a single system.",
      "FALSE",
      "Efforts to unify them ran for a century, and the eventual agreement in 1948 covered the English-speaking countries and left the metric thread alongside it.",
      "It 'left the metric thread alongside it'.",
    ),
    fromList(
      "summary_completion",
      THREAD_BANK,
      "Whitworth fixed the thread ______ at fifty-five degrees.",
      "angle",
      "His proposal specified the thread angle at fifty-five degrees, rounded the crest and the root rather than leaving them sharp, and fixed the pitch — the distance between successive turns — for each diameter of bolt.",
      "The angle was set at fifty-five degrees.",
    ),
    fromList(
      "summary_completion",
      THREAD_BANK,
      "He also fixed the ______ for every diameter of bolt.",
      "pitch",
      "His proposal specified the thread angle at fifty-five degrees, rounded the crest and the root rather than leaving them sharp, and fixed the pitch — the distance between successive turns — for each diameter of bolt.",
      "The pitch was fixed per diameter.",
    ),
    fromList(
      "summary_completion",
      THREAD_BANK,
      "The standard made ______ parts possible for the first time.",
      "interchangeable",
      "A standard thread is a precondition for interchangeable parts, and interchangeable parts are the precondition for assembly by semi-skilled labour rather than by fitters.",
      "It is 'a precondition for interchangeable parts'.",
    ),
    fromList(
      "summary_completion",
      THREAD_BANK,
      "Precise ______ were needed so that the specification could be enforced.",
      "gauges",
      "Whitworth produced measuring instruments capable of detecting a difference of a ten-thousandth of an inch, and the gauges derived from them are what allowed a specification to be enforced rather than merely published.",
      "The gauges allowed enforcement.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Maudslay's lathe used a ______ geared to the spindle.",
      "lead screw",
      "A lathe of that kind was built by Henry Maudslay around 1800, with a lead screw geared to the spindle so that the tool advanced a fixed distance per revolution, and it made a repeatable thread possible for the first time.",
      "It had 'a lead screw geared to the spindle'.",
    ),
    mcq(
      "Which industry drove adoption of the standard?",
      ["The railways", "Shipbuilding", "Textile manufacturing", "Arms manufacturing"],
      "The railways",
      "The railways settled it.",
      "'The railways settled it.'",
    ),
    mcq(
      "What does the passage say about the cost of having two standards?",
      [
        "It is paid repeatedly by everybody",
        "It falls mainly on the smaller country",
        "It disappears once both are documented",
        "It is lower than the cost of unifying them",
      ],
      "It is paid repeatedly by everybody",
      "The cost of a standard is paid once, by whoever adopts it; the cost of two standards is paid repeatedly, by everybody, for as long as both survive.",
      "Two standards cost 'repeatedly, by everybody'.",
    ),
  ],
};
