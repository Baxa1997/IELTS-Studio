import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · technology history · flow-chart ----------------------------

const CARD_STEPS = {
  title: "How a card controls the loom",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · island evolution · people and a word bank -----------------

const ISLAND_PEOPLE = [
  "Rosa Villalobos",
  "Anton Peeters",
  "Meera Balachandran",
  "Kofi Boateng",
];
const ISLAND_BANK = [
  "dormouse",
  "predators",
  "fossils",
  "area",
  "hunting",
  "shoulder",
  "tortoise",
  "rodents",
  "shortage",
];

// ---- Passage 3 · transport safety · lettered paragraphs --------------------

const CYCLE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CYCLE_ENDINGS = [
  "because a driver who meets forty cyclists a day is not the same driver.",
  "although the infrastructure in those places was mostly built before the numbers rose.",
  "which is why fear of traffic is the reason most often given for not cycling.",
  "since a residual benefit survives even when infrastructure is controlled for.",
  "because it lets a city claim a safety strategy while spending on posters.",
  "which the writer thinks is the order the slogan manages to reverse.",
  "even though painting a line on a road is not supported by the evidence.",
];

export const TEST_76: CuratedTest = {
  key: "full-test-76",
  targetBand: 5,
  passages: [
    {
      key: "t76-p1-jacquard-loom",
      title: "The Loom That Read Cards",
      topic: "the weaving machine that first kept its instructions outside itself",
      difficulty: 4,
      body: `The machine that first stored instructions on punched cards was not a computer. It was a loom, built in Lyon in the first years of the nineteenth century, and its purpose was to weave patterned silk.

Weaving a plain cloth is a repetitive action. Threads run lengthways on the loom, and the weaver lifts some of them, passes a thread across, and lowers them again. For a plain weave the same threads are lifted every time, and the work can be done by one person. For a pattern, a different set of threads must be lifted for every single row, and in a complex design there may be thousands of rows, each of them different.

Before the machine, this was done by hand and it needed two people. A weaver worked the loom while an assistant, often a child, sat inside the frame and lifted the required threads by hand for each row, following instructions called out or read from a diagram. The work was slow, cramped and unpleasant, and a mistake in one row spoiled the cloth. A skilled pair might produce a few centimetres of patterned silk in a day.

Joseph Marie Jacquard's contribution was to replace the assistant with a device that read the pattern from a set of stiff cards. Each card corresponds to one row of the design and is punched with holes. The cards are laced together in a long chain and pass over a box of metal rods. Where there is a hole, a rod passes through and the thread attached to it is lifted; where the card is solid, the rod is blocked and the thread stays down. Pressing a pedal advances the chain to the next card, and the next row of the pattern is set.

The important properties of the arrangement are worth stating separately, because they are the properties that mattered later. The pattern is stored outside the machine, so one loom can weave any design. The cards are a physical record that can be copied, corrected and sent elsewhere. And the loom does not need to understand the pattern; it only has to tell a hole from no hole.

The machine was not welcomed. The assistants whose work it replaced were among the first to object, and there were riots in Lyon; looms were destroyed and Jacquard himself was attacked. The objection was correct as far as it went, since those jobs did disappear. What was not foreseen was that the silk trade grew enormously as patterned cloth became affordable, so the total number of people employed in weaving rose.

Within twenty years there were thousands of the looms in France, and the design spread across Europe. It has never really been replaced. A modern industrial loom weaving a pattern does the same thing with electronics instead of cards, and the arrangement of lifting selected threads row by row from stored instructions is unchanged.

The famous consequence was indirect. Charles Babbage, designing a mechanical calculating engine in the 1830s, adopted punched cards as the means of supplying it with both numbers and instructions, and said plainly where he had taken the idea from. Ada Lovelace, writing about that engine, used the loom as her main comparison: the machine, she wrote, weaves algebraic patterns as the loom weaves flowers and leaves.

From there the card passed into the counting of people. A census in the United States in 1890 was tabulated with punched cards read by electrical machines, cutting the work from years to months, and the company built to sell those machines eventually became a computer manufacturer. Punched cards remained the normal way of giving a computer a program until the 1970s, which is a run of about a hundred and seventy years for one idea.

It is easy to overstate the connection. Jacquard did not invent computing, and his machine does not calculate, decide, or repeat a section of its own instructions. It is a device that follows a fixed list, which is a much simpler thing. What it did establish was the habit of separating a machine from what the machine is told to do, and of keeping the instructions in a form a person can hold, inspect and change. That habit had to exist before anything programmable could be built.`,
      questions: [
        tfng(
          "Weaving a plain cloth needs a different set of threads for each row.",
          "FALSE",
          "For a plain weave the same threads are lifted every time, and the work can be done by one person.",
          "In a plain weave 'the same threads are lifted every time'.",
        ),
        tfng(
          "The assistant who lifted the threads was often a child.",
          "TRUE",
          "A weaver worked the loom while an assistant, often a child, sat inside the frame and lifted the required threads by hand for each row, following instructions called out or read from a diagram.",
          "The assistant was 'often a child'.",
        ),
        tfng(
          "Each card carries the instructions for a single row.",
          "TRUE",
          "Each card corresponds to one row of the design and is punched with holes.",
          "One card is 'one row of the design'.",
        ),
        tfng(
          "Total employment in weaving fell after the machine spread.",
          "FALSE",
          "What was not foreseen was that the silk trade grew enormously as patterned cloth became affordable, so the total number of people employed in weaving rose.",
          "The total 'rose'.",
        ),
        tfng(
          "Babbage did not say where the idea of using cards came from.",
          "FALSE",
          "Charles Babbage, designing a mechanical calculating engine in the 1830s, adopted punched cards as the means of supplying it with both numbers and instructions, and said plainly where he had taken the idea from.",
          "He 'said plainly' where it came from.",
        ),
        tfng(
          "The 1890 census was counted faster than it would otherwise have been.",
          "TRUE",
          "A census in the United States in 1890 was tabulated with punched cards read by electrical machines, cutting the work from years to months, and the company built to sell those machines eventually became a computer manufacturer.",
          "The work fell 'from years to months'.",
        ),
        tfng(
          "Jacquard was granted a pension by the French government.",
          "NOT GIVEN",
          "",
          "The passage says he was attacked but nothing about any payment to him.",
        ),
        noteLine(
          CARD_STEPS,
          null,
          "Laced cards pass over a box of metal ______",
          "rods",
          "The cards are laced together in a long chain and pass over a box of metal rods.",
          "They pass over 'a box of metal rods'.",
        ),
        noteLine(
          CARD_STEPS,
          null,
          "Where there is a ______, a rod goes through and lifts its thread",
          "hole",
          "Where there is a hole, a rod passes through and the thread attached to it is lifted; where the card is solid, the rod is blocked and the thread stays down.",
          "A hole lets the rod through.",
        ),
        noteLine(
          CARD_STEPS,
          null,
          "Pressing a ______ brings the next card into place",
          "pedal",
          "Pressing a pedal advances the chain to the next card, and the next row of the pattern is set.",
          "A pedal advances the chain.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The loom was built in ______ early in the nineteenth century.",
          "Lyon",
          "It was a loom, built in Lyon in the first years of the nineteenth century, and its purpose was to weave patterned silk.",
          "It was 'built in Lyon'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Opposition in the city led to ______ in which looms were destroyed.",
          "riots",
          "The assistants whose work it replaced were among the first to object, and there were riots in Lyon; looms were destroyed and Jacquard himself was attacked.",
          "There 'were riots in Lyon'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Lovelace wrote that the engine would weave algebraic ______.",
          "patterns",
          "Ada Lovelace, writing about that engine, used the loom as her main comparison: the machine, she wrote, weaves algebraic patterns as the loom weaves flowers and leaves.",
          "It 'weaves algebraic patterns'.",
        ),
      ],
    },
    {
      key: "t76-p2-island-body-size",
      title: "Why Islands Change the Size of Things",
      topic: "the tendency of large animals to shrink and small ones to grow on islands",
      difficulty: 5,
      body: `Animals that live on islands frequently change size. Large mammals tend to get smaller and small ones tend to get larger, and the effect is strong enough, and repeated on enough islands, that it is treated as a rule rather than a collection of curiosities.

The examples are striking. Several species of elephant that reached Mediterranean islands were reduced to the size of a large pony; one on Sicily stood about a metre at the shoulder. A deer on Crete was the size of a dog. In the other direction, rodents on islands are routinely two or three times the mass of their mainland relatives, and one extinct rat from a Mediterranean island was the size of a rabbit. Flightless birds of unusual size are almost entirely an island phenomenon.

Rosa Villalobos, who has assembled measurements from several hundred island populations, is careful about how strong the pattern actually is. The trend is real and statistically clear when many species are considered together, she says, but it is a tendency rather than a law: individual populations depart from it, the effect is much weaker in some groups than in others, and the measurements come disproportionately from islands where fossils happen to preserve well.

The usual explanation for shrinking is food. An island has a fixed area and therefore a fixed supply, and a large animal needs a great deal of it. Where the supply cannot be increased, the individuals that survive a shortage are the ones that need less, and over generations the average size falls. Anton Peeters, who models these populations, points out that the argument only works if the animal cannot leave, which is what makes an island different from a small patch of equally poor mainland: on a continent a hungry elephant walks somewhere else.

Growing has a different cause, and it is chiefly the absence of predators. A mouse on the mainland is small partly because being small allows it to hide, and it is under continuous pressure from owls, foxes and snakes. On an island where none of those arrived, the advantages of being small disappear and the advantages of being large — the ability to fight a rival, to survive a cold night, to carry more fat — take over. Meera Balachandran, who studies island rodents, emphasises that the change is not merely a relaxation of a constraint but an active reversal: the same trait that was penalised on the mainland is rewarded on the island, so selection pushes in the opposite direction rather than simply stopping.

Both processes can act at once on the same island, which produces the odd assemblages that make island fossil sites recognisable. A site on a Mediterranean island may contain a dwarf elephant, a dwarf deer, a giant dormouse, a giant owl that ate the dormouse, and a giant tortoise, all from the same period.

The changes happen faster than people expect. Kofi Boateng, who dates these sequences, reports that a substantial reduction in size can be measured over a few thousand years, and in some documented cases over a few hundred, which is short enough to be observed within the resolution of a good fossil sequence rather than inferred from a gap. He notes that this makes the phenomenon useful beyond its own subject, since it is one of the few places where the speed of evolutionary change in a large animal can be measured directly.

The vulnerability that comes with the change is the part with present-day consequences. A small population of large-bodied animals on a limited area has almost no capacity to absorb a shock. Island species have gone extinct at a rate far above the mainland rate, and in most documented cases the arrival of people is the event that precedes the extinction, either directly through hunting or through the rats, cats, pigs and goats that arrived with them.

The rule has also been applied where it may not belong. It is sometimes invoked to explain the small-bodied human remains found on an Indonesian island, and while island dwarfing is a genuine candidate explanation there, the case has to be argued on its own evidence rather than settled by reference to elephants. A pattern that holds across many species is not an argument about any particular one, which is a point applying more widely than to this example.`,
      questions: [
        fromList(
          "matching_features",
          ISLAND_PEOPLE,
          "The pattern is a tendency rather than a law, and the evidence is uneven.",
          "Rosa Villalobos",
          "The trend is real and statistically clear when many species are considered together, she says, but it is a tendency rather than a law: individual populations depart from it, the effect is much weaker in some groups than in others, and the measurements come disproportionately from islands where fossils happen to preserve well.",
          "Villalobos qualifies the rule.",
        ),
        fromList(
          "matching_features",
          ISLAND_PEOPLE,
          "The explanation depends on the animal being unable to leave.",
          "Anton Peeters",
          "Anton Peeters, who models these populations, points out that the argument only works if the animal cannot leave, which is what makes an island different from a small patch of equally poor mainland: on a continent a hungry elephant walks somewhere else.",
          "Peeters identifies the necessary condition.",
        ),
        fromList(
          "matching_features",
          ISLAND_PEOPLE,
          "Selection reverses direction rather than merely relaxing.",
          "Meera Balachandran",
          "Meera Balachandran, who studies island rodents, emphasises that the change is not merely a relaxation of a constraint but an active reversal: the same trait that was penalised on the mainland is rewarded on the island, so selection pushes in the opposite direction rather than simply stopping.",
          "Balachandran calls it an active reversal.",
        ),
        fromList(
          "matching_features",
          ISLAND_PEOPLE,
          "A large change in size can be dated to a few thousand years.",
          "Kofi Boateng",
          "Kofi Boateng, who dates these sequences, reports that a substantial reduction in size can be measured over a few thousand years, and in some documented cases over a few hundred, which is short enough to be observed within the resolution of a good fossil sequence rather than inferred from a gap.",
          "Boateng dates the sequences.",
        ),
        fromList(
          "summary_completion",
          ISLAND_BANK,
          "An island has a fixed ______ and therefore a fixed food supply.",
          "area",
          "An island has a fixed area and therefore a fixed supply, and a large animal needs a great deal of it.",
          "The area is fixed.",
        ),
        fromList(
          "summary_completion",
          ISLAND_BANK,
          "In a ______ the survivors are the animals that need less food.",
          "shortage",
          "Where the supply cannot be increased, the individuals that survive a shortage are the ones that need less, and over generations the average size falls.",
          "Those that survive a shortage 'need less'.",
        ),
        fromList(
          "summary_completion",
          ISLAND_BANK,
          "Small animals grow larger mainly where there are no ______.",
          "predators",
          "Growing has a different cause, and it is chiefly the absence of predators.",
          "The cause is 'the absence of predators'.",
        ),
        fromList(
          "summary_completion",
          ISLAND_BANK,
          "One site held a dwarf elephant alongside a giant ______.",
          "dormouse",
          "A site on a Mediterranean island may contain a dwarf elephant, a dwarf deer, a giant dormouse, a giant owl that ate the dormouse, and a giant tortoise, all from the same period.",
          "A giant dormouse shared the site.",
        ),
        fromList(
          "summary_completion",
          ISLAND_BANK,
          "Extinctions followed human arrival, through ______ or introduced animals.",
          "hunting",
          "Island species have gone extinct at a rate far above the mainland rate, and in most documented cases the arrival of people is the event that precedes the extinction, either directly through hunting or through the rats, cats, pigs and goats that arrived with them.",
          "It came 'directly through hunting' or through introductions.",
        ),
        mcq(
          "How large was the dwarf elephant on Sicily?",
          [
            "About a metre at the shoulder",
            "About the size of a dog",
            "About the size of a rabbit",
            "About half its mainland size",
          ],
          "About a metre at the shoulder",
          "Several species of elephant that reached Mediterranean islands were reduced to the size of a large pony; one on Sicily stood about a metre at the shoulder.",
          "It 'stood about a metre at the shoulder'.",
        ),
        mcq(
          "What makes an island different from a poor stretch of mainland?",
          [
            "The animal cannot walk somewhere else",
            "The soil produces less vegetation",
            "There are more predators present",
            "The climate is markedly colder",
          ],
          "The animal cannot walk somewhere else",
          "Anton Peeters, who models these populations, points out that the argument only works if the animal cannot leave, which is what makes an island different from a small patch of equally poor mainland: on a continent a hungry elephant walks somewhere else.",
          "On a continent the animal simply leaves.",
        ),
        mcq(
          "Why does the speed of the change matter beyond this subject?",
          [
            "It can be measured directly in a large animal",
            "It shows islands are older than supposed",
            "It proves predators cause dwarfing",
            "It explains extinctions on continents",
          ],
          "It can be measured directly in a large animal",
          "He notes that this makes the phenomenon useful beyond its own subject, since it is one of the few places where the speed of evolutionary change in a large animal can be measured directly.",
          "The rate can be measured rather than inferred.",
        ),
        mcq(
          "What does the writer say about applying the rule to human remains?",
          [
            "The case must rest on its own evidence",
            "The rule settles the question",
            "The rule cannot apply to humans",
            "No such remains have been found",
          ],
          "The case must rest on its own evidence",
          "It is sometimes invoked to explain the small-bodied human remains found on an Indonesian island, and while island dwarfing is a genuine candidate explanation there, the case has to be argued on its own evidence rather than settled by reference to elephants.",
          "It must be argued 'on its own evidence'.",
        ),
      ],
    },
    {
      key: "t76-p3-cycling-numbers",
      title: "Does Cycling Get Safer as More People Do It?",
      topic: "whether the number of cyclists or the design of the road makes cycling safe",
      difficulty: 6,
      body: `A) The claim is that cycling becomes safer as more people do it, and not merely safer per cyclist in the way that would follow automatically from a larger denominator. The strong version says the absolute number of collisions falls as cycling rises. It is one of the most widely quoted findings in transport policy, it has a real evidential basis, and it is also routinely overstated in ways that matter for what gets built. The distinction is not academic, because the two readings of the finding recommend quite different budgets.

B) The original observation is a comparison across places and times. Cities and countries with high levels of cycling have injury rates per kilometre several times lower than cities with low levels, and within a single city the injury rate has often fallen as cycling has grown. The Netherlands, Denmark and a number of German cities sit at one end; most British, American and Australian cities sit at the other, and the gap is large — a factor of three to five is a common figure. Time series within a single city point the same way: several large cities have recorded rising cycling alongside a flat or falling number of serious injuries over two decades.

C) The mechanism usually offered is behavioural. Where cyclists are numerous, drivers expect them, look for them, and have often been cyclists themselves within the past week. A driver who encounters a cyclist twice a year responds differently from one who encounters forty a day. The explanation is plausible, and there is supporting evidence from studies of driver attention, which find that drivers detect an object they expect considerably faster than one they do not. There is a second and simpler mechanism that is mentioned less often: a lane carrying a great many cyclists is a lane that cars cannot travel down quickly, and speed is the single strongest predictor of whether a collision injures anybody at all.

D) The difficulty is that almost none of the comparison is a controlled one. Places with a lot of cycling also have segregated lanes, lower urban speed limits, junction designs that slow turning traffic, liability rules that presume the driver is at fault, and cycle training in schools. Those are the things a serious cycling policy consists of, and they were mostly built before the numbers rose. Attributing the safety record to the numbers, when the numbers and the safety both follow from the infrastructure, is a straightforward confusion of a cause with a correlate.

E) The direction of the causation matters because it determines what a city should do. If safety follows from numbers, the policy is promotion: campaigns, bike-share schemes, encouragement. If numbers follow from safety, the policy is construction, and promotion without construction puts inexperienced riders onto roads that have not changed. There is a reasonable amount of evidence for the second reading — surveys of people who do not cycle name fear of traffic as the principal reason far more often than anything else — and very little for the first as a stand-alone effect. A city that does both, in that order, collects the benefit twice.

F) I want to be careful here, because the sceptical case is also overdone. Some of the effect does appear to be genuinely a numbers effect: studies that control for infrastructure still find a residual safety benefit from cyclist density, smaller than the raw comparison but not zero. And the argument is sometimes deployed dishonestly, by people who want to conclude that nothing should be done at all. That a finding has been exaggerated is not a reason to discard it.

G) What follows, I think, is that the slogan has done harm by being convenient. It allows a city to claim a safety strategy while spending on posters, and it has been quoted in support of schemes that painted a line on a road and called it a cycle lane, which the evidence on painted lanes does not support. The honest statement is longer and less quotable: cycling is safer where the roads have been rebuilt for it, rebuilding them also produces more cyclists, and the additional cyclists then contribute a further modest improvement. The order of those three clauses is the whole argument, and the slogan reverses it. None of which is an argument for discouraging anybody from cycling, which is the conclusion nobody in this debate wants.`,
      questions: [
        fromList(
          "matching_information",
          CYCLE_PARAGRAPHS,
          "a figure for the gap between high- and low-cycling places",
          "B",
          "The Netherlands, Denmark and a number of German cities sit at one end; most British, American and Australian cities sit at the other, and the gap is large — a factor of three to five is a common figure.",
          "Paragraph B gives the factor of three to five.",
        ),
        fromList(
          "matching_information",
          CYCLE_PARAGRAPHS,
          "evidence about how quickly drivers notice what they expect",
          "C",
          "The explanation is plausible, and there is supporting evidence from studies of driver attention, which find that drivers detect an object they expect considerably faster than one they do not.",
          "Paragraph C cites the attention studies.",
        ),
        fromList(
          "matching_information",
          CYCLE_PARAGRAPHS,
          "a list of the other things high-cycling places have",
          "D",
          "Places with a lot of cycling also have segregated lanes, lower urban speed limits, junction designs that slow turning traffic, liability rules that presume the driver is at fault, and cycle training in schools.",
          "Paragraph D lists the infrastructure.",
        ),
        fromList(
          "matching_information",
          CYCLE_PARAGRAPHS,
          "the reason people who do not cycle give for not cycling",
          "E",
          "There is a reasonable amount of evidence for the second reading — surveys of people who do not cycle name fear of traffic as the principal reason far more often than anything else — and very little for the first as a stand-alone effect.",
          "Paragraph E reports the surveys.",
        ),
        fromList(
          "matching_information",
          CYCLE_PARAGRAPHS,
          "a warning that the sceptical argument can be misused",
          "F",
          "And the argument is sometimes deployed dishonestly, by people who want to conclude that nothing should be done at all.",
          "Paragraph F warns about bad-faith use.",
        ),
        ynng(
          "The writer thinks the comparison between countries is a controlled one.",
          "NO",
          "The difficulty is that almost none of the comparison is a controlled one.",
          "'Almost none of the comparison is a controlled one'.",
        ),
        ynng(
          "The writer accepts that a genuine effect of cyclist numbers exists.",
          "YES",
          "Some of the effect does appear to be genuinely a numbers effect: studies that control for infrastructure still find a residual safety benefit from cyclist density, smaller than the raw comparison but not zero.",
          "A residual benefit is 'not zero'.",
        ),
        ynng(
          "The writer thinks promotion without changes to the roads is sound policy.",
          "NO",
          "If numbers follow from safety, the policy is construction, and promotion without construction puts inexperienced riders onto roads that have not changed.",
          "It puts inexperienced riders on unchanged roads.",
        ),
        ynng(
          "The writer believes the slogan has been damaging in practice.",
          "YES",
          "What follows, I think, is that the slogan has done harm by being convenient.",
          "The slogan 'has done harm'.",
        ),
        fromList(
          "matching_sentence_endings",
          CYCLE_ENDINGS,
          "Drivers in high-cycling cities are already looking for cyclists,",
          "because a driver who meets forty cyclists a day is not the same driver.",
          "A driver who encounters a cyclist twice a year responds differently from one who encounters forty a day.",
          "Frequency of encounter changes behaviour.",
        ),
        fromList(
          "matching_sentence_endings",
          CYCLE_ENDINGS,
          "The international comparison cannot separate numbers from design,",
          "although the infrastructure in those places was mostly built before the numbers rose.",
          "Those are the things a serious cycling policy consists of, and they were mostly built before the numbers rose.",
          "The building came first.",
        ),
        fromList(
          "matching_sentence_endings",
          CYCLE_ENDINGS,
          "Safety appears to come first and the numbers to follow,",
          "which is why fear of traffic is the reason most often given for not cycling.",
          "There is a reasonable amount of evidence for the second reading — surveys of people who do not cycle name fear of traffic as the principal reason far more often than anything else — and very little for the first as a stand-alone effect.",
          "Fear of traffic is the principal reason given.",
        ),
        fromList(
          "matching_sentence_endings",
          CYCLE_ENDINGS,
          "Part of the effect is nonetheless real,",
          "since a residual benefit survives even when infrastructure is controlled for.",
          "Some of the effect does appear to be genuinely a numbers effect: studies that control for infrastructure still find a residual safety benefit from cyclist density, smaller than the raw comparison but not zero.",
          "The benefit survives the controls.",
        ),
        fromList(
          "matching_sentence_endings",
          CYCLE_ENDINGS,
          "The slogan has suited cities that built nothing,",
          "because it lets a city claim a safety strategy while spending on posters.",
          "It allows a city to claim a safety strategy while spending on posters, and it has been quoted in support of schemes that painted a line on a road and called it a cycle lane, which the evidence on painted lanes does not support.",
          "A poster campaign stands in for a strategy.",
        ),
      ],
    },
  ],
};
