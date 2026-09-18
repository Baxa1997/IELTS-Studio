import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of invention · flow-chart --------------------------

const TRIAL = {
  title: "How a sea clock was tested",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO -----------------

const HEAT_PEOPLE = ["Ruth Palmer", "Yusuf Demir", "Elena Novak", "Colin Shaw"];
const HEAT_BANK = [
  "moves",
  "refrigerant",
  "compressor",
  "insulation",
  "radiators",
  "burns",
  "noise",
  "electricity",
  "outdoors",
  "winter",
];
const HEAT_STEM = "Which TWO claims about heat pumps does the passage reject?";
const HEAT_CLAIMS = [
  "They stop working in freezing weather.",
  "They cost more to install than a gas boiler.",
  "They cannot be used in older houses under any circumstances.",
  "They require electricity to run.",
  "They are quieter than they were ten years ago.",
];

// ---- Passage 3 · research debate · lettered paragraphs, people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ATTENTION_PEOPLE = ["Marta Gil", "Peter Iwu", "Sanne de Vries", "Tomasz Bauer"];

export const TEST_34: CuratedTest = {
  key: "full-test-34",
  targetBand: 6,
  passages: [
    {
      key: "t34-p1-longitude",
      title: "The Clock That Found Longitude",
      topic: "John Harrison's sea clocks and the problem of finding longitude",
      difficulty: 5,
      body: `A ship's latitude — its position north or south — has never been especially hard to find. The height of the sun at midday, or of the pole star at night, gives it directly, and sailors have used the method for centuries. Longitude, the position east or west, is a different matter, because the Earth turns. There is no fixed mark in the sky to measure against, and a navigator who does not know how far east or west a ship has travelled is, for practical purposes, lost.

The principle of a solution had been understood since the sixteenth century. Because the Earth rotates once in twenty-four hours, every hour of difference between local time and the time at a known place corresponds to fifteen degrees of longitude. A navigator who could establish local noon by observing the sun, and who knew at that instant what time it was at home, could work out the distance travelled east or west by simple arithmetic. The difficulty was the second half: keeping accurate home time on a wooden ship that rolled, pitched, heated, froze and soaked everything aboard. No pendulum clock could survive such treatment, and pendulum clocks were the only accurate clocks that existed.

The cost of not knowing was heavy. In 1707 a British fleet returning from the Mediterranean struck the rocks of the Isles of Scilly at night, and four ships and around two thousand men were lost. The disaster was blamed, rightly or not, on a failure of navigation, and public alarm led Parliament in 1714 to pass an Act offering a prize of twenty thousand pounds — an enormous sum — for a practical method of determining longitude at sea. A body of astronomers and naval officers, known as the Board of Longitude, was appointed to judge the entries.

Most of the Board expected the answer to come from astronomy. The favoured approach was the method of lunar distances, which used the moon's movement against the background stars as a natural clock. It worked, but it demanded clear skies, a skilled observer and about four hours of calculation for a single fix. The rival approach, a mechanical timekeeper, was widely thought impossible.

John Harrison was a carpenter's son from Lincolnshire who had taught himself clockmaking and built his early clocks almost entirely out of wood. Between 1730 and 1760 he produced a series of marine timekeepers of astonishing ingenuity, solving one problem after another: springs that pushed against each other so that the motion of the ship cancelled out, bearings that needed no oil, and metals paired so that the expansion of one corrected the contraction of the other as the temperature changed. His first machine was tested on a voyage to Lisbon in 1736. It was large, heavy and impressive, and he then spent nearly twenty years building two more before abandoning the design altogether.

His fourth attempt looked nothing like the others. Instead of a cabinet-sized machine, it was a watch about thirteen centimetres across, and it was the one that worked. On a voyage to Jamaica in 1761 it lost only a few seconds over eighty-one days at sea, a performance far inside the accuracy the prize required. The Board was unconvinced, suspecting luck, and ordered a second trial to Barbados. The watch performed even better.

What followed was a long argument rather than a celebration. The Board demanded that Harrison explain the mechanism to other makers, hand over his machines and see copies produced by somebody else, and it released the money in instalments. Harrison, by then in his seventies, appealed directly to the king, and in 1773 an Act of Parliament granted him most of the remaining sum. He died three years later.

The verdict of the sea was less grudging. A copy of the watch, made by another craftsman, sailed with Captain Cook on his second voyage around the world, and Cook praised it as a faithful guide through all the vicissitudes of climates. Within a generation, chronometers were standard equipment on naval and merchant ships alike, and the lunar method faded away, kept only as a check. The instrument that made the difference was not a great scientific theory but a machine, built by a man the Board had regarded as an outsider.`,
      questions: [
        tfng(
          "Finding latitude at sea required instruments that were invented in the eighteenth century.",
          "FALSE",
          "The height of the sun at midday, or of the pole star at night, gives it directly, and sailors have used the method for centuries.",
          "Sailors had used those observations 'for centuries'.",
        ),
        tfng(
          "One hour of time difference is equal to fifteen degrees of longitude.",
          "TRUE",
          "Because the Earth rotates once in twenty-four hours, every hour of difference between local time and the time at a known place corresponds to fifteen degrees of longitude.",
          "Each hour 'corresponds to fifteen degrees of longitude'.",
        ),
        tfng(
          "Pendulum clocks of the period kept good time aboard ship.",
          "FALSE",
          "No pendulum clock could survive such treatment, and pendulum clocks were the only accurate clocks that existed.",
          "'No pendulum clock could survive such treatment'.",
        ),
        tfng(
          "The 1707 disaster off the Isles of Scilly was certainly caused by a navigational error.",
          "FALSE",
          "The disaster was blamed, rightly or not, on a failure of navigation, and public alarm led Parliament in 1714 to pass an Act offering a prize of twenty thousand pounds — an enormous sum — for a practical method of determining longitude at sea.",
          "It was blamed on navigation 'rightly or not' — the writer does not confirm it.",
        ),
        tfng(
          "The lunar distance method required lengthy calculations.",
          "TRUE",
          "It worked, but it demanded clear skies, a skilled observer and about four hours of calculation for a single fix.",
          "It needed 'about four hours of calculation for a single fix'.",
        ),
        tfng(
          "Harrison built his first clocks mainly from wood.",
          "TRUE",
          "John Harrison was a carpenter's son from Lincolnshire who had taught himself clockmaking and built his early clocks almost entirely out of wood.",
          "His early clocks were 'almost entirely out of wood'.",
        ),
        tfng(
          "Harrison's fourth timekeeper was larger than his earlier machines.",
          "FALSE",
          "Instead of a cabinet-sized machine, it was a watch about thirteen centimetres across, and it was the one that worked.",
          "It was a watch 'about thirteen centimetres across', not cabinet-sized.",
        ),
        noteLine(
          TRIAL,
          null,
          "The timekeeper is set to the ______ at the home port before sailing",
          "time",
          "A navigator who could establish local noon by observing the sun, and who knew at that instant what time it was at home, could work out the distance travelled east or west by simple arithmetic.",
          "The navigator must know 'what time it was at home'.",
          { before: [{ text: "A trial voyage is arranged by the Board", indent: 0 }] },
        ),
        noteLine(
          TRIAL,
          null,
          "At sea, the navigator finds local ______ by observing the sun",
          "noon",
          "A navigator who could establish local noon by observing the sun, and who knew at that instant what time it was at home, could work out the distance travelled east or west by simple arithmetic.",
          "The navigator would 'establish local noon by observing the sun'.",
        ),
        noteLine(
          TRIAL,
          null,
          "The difference between the two times gives the ship's ______",
          "longitude",
          "Because the Earth rotates once in twenty-four hours, every hour of difference between local time and the time at a known place corresponds to fifteen degrees of longitude.",
          "The time difference converts directly into longitude.",
          { before: [{ text: "The clock's error is checked on arrival", indent: 0 }] },
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Harrison paired metals so that the expansion of one corrected the ______ of the other.",
          "contraction",
          "Between 1730 and 1760 he produced a series of marine timekeepers of astonishing ingenuity, solving one problem after another: springs that pushed against each other so that the motion of the ship cancelled out, bearings that needed no oil, and metals paired so that the expansion of one corrected the contraction of the other as the temperature changed.",
          "Expansion corrected 'the contraction of the other'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "On the voyage to Jamaica the watch lost only a few ______ in eighty-one days.",
          "seconds",
          "On a voyage to Jamaica in 1761 it lost only a few seconds over eighty-one days at sea, a performance far inside the accuracy the prize required.",
          "It 'lost only a few seconds'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Harrison finally received most of the money after appealing to the ______.",
          "king",
          "Harrison, by then in his seventies, appealed directly to the king, and in 1773 an Act of Parliament granted him most of the remaining sum.",
          "He 'appealed directly to the king'.",
        ),
      ],
    },
    {
      key: "t34-p2-heat-pumps",
      title: "Heat That Is Moved, Not Made",
      topic: "how heat pumps work and why their adoption has been uneven",
      difficulty: 6,
      body: `A gas boiler makes heat by burning something. A heat pump does not make heat at all; it moves heat that already exists from outside a building to inside it. That single difference explains both the technology's remarkable efficiency and the confusion that surrounds it.

The machinery is the same as a refrigerator's, run in the opposite direction. A liquid called a refrigerant is allowed to expand and evaporate in a coil outdoors, and because evaporation absorbs heat, the coil becomes colder than the outside air and heat flows into it. The gas is then squeezed by a compressor, which raises its pressure and with it its temperature, and the hot gas passes through a second coil indoors, where it gives up its heat to the house and condenses back into a liquid. The cycle repeats. Energy is needed to run the compressor, but it is used to shift heat rather than to create it, which is why a good installation delivers three or four units of heat for every unit of electricity it consumes. No boiler can exceed one.

The most persistent objection is that the system must fail when it is cold, since there is no heat to collect. This misunderstands what cold means. Even at minus fifteen degrees Celsius the air contains a great deal of heat by the standards of physics, and a refrigerant boiling at minus thirty will absorb it happily. Efficiency does fall as the temperature drops, and the machine works harder on the coldest nights, but units sold today are rated to operate well below freezing, and heat pumps are most common not in mild countries but in Norway, Sweden and Finland, where a majority of homes have one. Engineer Ruth Palmer has spent a decade installing them in northern Britain. "The cold is not the problem," she says. "The problem is a house that leaks heat as fast as you put it in."

That points to the real difficulty. A heat pump produces water at a lower temperature than a boiler does — perhaps forty-five degrees rather than seventy — so the heat has to be delivered over a larger surface for longer. In practice this means bigger radiators or underfloor pipes, and a house that holds its heat. Retrofitting an older building therefore involves more than swapping a box: insulation, pipework and sometimes the whole layout of the system have to be considered together. Building surveyor Yusuf Demir argues that this is where most bad experiences come from. "Almost every unhappy customer I meet was sold a unit, not a system," he says. "The machine is rarely at fault."

Cost is the second barrier, and it has two parts. Installation is expensive, typically several times the price of replacing a boiler, which is why most countries that want the technology adopted offer grants. Running costs depend on something governments control more directly than they admit: the ratio between the price of electricity and the price of gas. In several countries electricity carries environmental levies that gas does not, so the cleaner option is the dearer one to run. Energy economist Dr Elena Novak describes this as the decisive number. "Households respond to the bill, not to the physics," she says. "Where the ratio is below three, heat pumps sell themselves; where it is above four, subsidies are pushing water uphill."

There are genuine drawbacks. The outdoor unit contains a fan and a compressor, and although modern machines are much quieter than early ones, they are not silent, and planning rules in dense neighbourhoods reflect this. Refrigerants themselves have been a concern, since some are powerful greenhouse gases if they leak, and the industry is moving towards alternatives with a far smaller effect. And a national switch to electric heating raises demand on the coldest, darkest evenings of the year, exactly when wind and solar output may be low. Grid engineer Colin Shaw regards this as a manageable but serious planning question. "You cannot electrify heating and ignore what happens at six o'clock on a February evening," he says.

Even so, the direction of travel is clear. Sales have overtaken those of gas boilers in a growing number of European markets, manufacturers are scaling up, and installers — the genuine bottleneck in most countries — are slowly being trained. The technology itself is over a century old and no longer in doubt. What remains in doubt is whether the surrounding arrangements, from electricity pricing to the quality of the average installation, will be sorted out quickly enough to matter.`,
      questions: [
        fromList(
          "matching_features",
          HEAT_PEOPLE,
          "Poor results usually come from treating the appliance in isolation.",
          "Yusuf Demir",
          '"Almost every unhappy customer I meet was sold a unit, not a system," he says.',
          "Demir: customers were 'sold a unit, not a system'.",
        ),
        fromList(
          "matching_features",
          HEAT_PEOPLE,
          "Low temperatures outside are not the main obstacle.",
          "Ruth Palmer",
          '"The cold is not the problem," she says. "The problem is a house that leaks heat as fast as you put it in."',
          "Palmer: 'The cold is not the problem.'",
        ),
        fromList(
          "matching_features",
          HEAT_PEOPLE,
          "The relative price of two fuels decides whether households switch.",
          "Elena Novak",
          '"Households respond to the bill, not to the physics," she says.',
          "Novak: households 'respond to the bill, not to the physics'.",
        ),
        fromList(
          "matching_features",
          HEAT_PEOPLE,
          "Peak demand on cold evenings has to be planned for.",
          "Colin Shaw",
          '"You cannot electrify heating and ignore what happens at six o\'clock on a February evening," he says.',
          "Shaw on the February evening peak.",
        ),
        fromList(
          "matching_features",
          HEAT_PEOPLE,
          "Subsidies cannot overcome an unfavourable price ratio.",
          "Elena Novak",
          '"Where the ratio is below three, heat pumps sell themselves; where it is above four, subsidies are pushing water uphill."',
          "Novak: above four, 'subsidies are pushing water uphill'.",
        ),
        fromList(
          "summary_completion",
          HEAT_BANK,
          "A heat pump ______ heat from outside a building instead of creating it.",
          "moves",
          "A heat pump does not make heat at all; it moves heat that already exists from outside a building to inside it.",
          "It 'moves heat that already exists'.",
        ),
        fromList(
          "summary_completion",
          HEAT_BANK,
          "A liquid called a ______ evaporates in the outdoor coil.",
          "refrigerant",
          "A liquid called a refrigerant is allowed to expand and evaporate in a coil outdoors, and because evaporation absorbs heat, the coil becomes colder than the outside air and heat flows into it.",
          "The liquid is 'a refrigerant'.",
        ),
        fromList(
          "summary_completion",
          HEAT_BANK,
          "The gas is squeezed by a ______, which raises its temperature.",
          "compressor",
          "The gas is then squeezed by a compressor, which raises its pressure and with it its temperature, and the hot gas passes through a second coil indoors, where it gives up its heat to the house and condenses back into a liquid.",
          "It is 'squeezed by a compressor'.",
        ),
        fromList(
          "summary_completion",
          HEAT_BANK,
          "Because the water is cooler, a house may need larger ______.",
          "radiators",
          "In practice this means bigger radiators or underfloor pipes, and a house that holds its heat.",
          "It means 'bigger radiators or underfloor pipes'.",
        ),
        fromList(
          "summary_completion",
          HEAT_BANK,
          "Older buildings often need better ______ before a heat pump will perform well.",
          "insulation",
          "Retrofitting an older building therefore involves more than swapping a box: insulation, pipework and sometimes the whole layout of the system have to be considered together.",
          "'Insulation, pipework and… the whole layout' must be considered.",
        ),
        fromList(
          "summary_completion",
          HEAT_BANK,
          "The outdoor unit produces some ______, so planning rules apply in dense areas.",
          "noise",
          "The outdoor unit contains a fan and a compressor, and although modern machines are much quieter than early ones, they are not silent, and planning rules in dense neighbourhoods reflect this.",
          "They 'are not silent', and planning rules reflect it.",
        ),
        pickTwo(
          HEAT_STEM,
          HEAT_CLAIMS,
          "A or C",
          "Even at minus fifteen degrees Celsius the air contains a great deal of heat by the standards of physics, and a refrigerant boiling at minus thirty will absorb it happily.",
          "A is rejected: the machines work well below freezing.",
        ),
        pickTwo(
          HEAT_STEM,
          HEAT_CLAIMS,
          "A or C",
          "Retrofitting an older building therefore involves more than swapping a box: insulation, pipework and sometimes the whole layout of the system have to be considered together.",
          "C is rejected: older houses need more work, not that they are impossible. B, D and E are accepted by the passage.",
        ),
      ],
    },
    {
      key: "t34-p3-multitasking",
      title: "The Cost of Switching",
      topic: "what research shows about attention and doing several things at once",
      difficulty: 7,
      body: `A) Almost nobody multitasks, in the sense of performing two demanding tasks at the same instant. What people do instead is switch, often several times a minute, and each switch has a price. Laboratory studies going back to the 1990s measure this directly: volunteers asked to alternate between two simple tasks — sorting shapes, then solving sums — are consistently slower and less accurate than volunteers doing the same number of items in blocks. The delay is small, a fraction of a second, but it accumulates, and it grows as the tasks become more complicated or more similar to each other.

B) The reason appears to be that the rules for a task have to be loaded and unloaded. Switching from writing a report to answering an email means putting aside one set of goals, vocabulary and standards and picking up another, and the brain does not do this instantly. Psychologist Dr Marta Gil describes the effect with an image drawn from kitchens. "It is not that you cannot cook two dishes," she says. "It is that every time you put one down, you have to find your place in the recipe again."

C) Something else lingers besides the delay. Work on what has been called attention residue finds that part of the mind stays with the previous task, particularly when it was left unfinished, and that the next task is performed less well as a result. This is why being interrupted for thirty seconds can cost far more than thirty seconds, and why people who check their messages between paragraphs often feel that a morning has dissolved without producing anything.

D) A small number of people appear to be genuinely better at this than the rest. In a study that asked hundreds of volunteers to drive in a simulator while performing a memory and arithmetic task, the great majority were much worse at both than when doing either alone, but around one in forty showed almost no loss on either. These rare individuals, sometimes called supertaskers, have been the subject of a good deal of excited coverage, and rather less of the sober observation that a group of that size is easy to produce by chance and difficult to confirm. Neuroscientist Professor Peter Iwu urges caution about the finding. "Anything that appears in two and a half per cent of a sample needs replicating before it is given a name," he says.

E) The question that interests employers is whether heavy multitaskers are damaged by the habit. An influential study in 2009 divided students by how much media they used simultaneously and found that the heaviest multitaskers performed worse at ignoring irrelevant information, which was widely reported as evidence that the habit itself impairs attention. Attempts to repeat the work have given mixed results, and the direction of cause remains unresolved: people who find it hard to filter distractions may simply be the ones who end up with six windows open. Cognitive scientist Dr Sanne de Vries, who has reviewed this literature, is blunt about what it can support. "There is a correlation," she says. "Everything beyond that is currently story-telling."

F) The effects of merely having a phone nearby have been studied too, with headline findings that a phone on the desk reduces available attention even when it is face down and switched off. Some replications have found the effect, others have not, and the size reported has shrunk as the samples have grown. What is not in dispute is that notifications interrupt, that interruptions are frequent — office studies typically record one every few minutes — and that returning fully to an interrupted task takes considerably longer than people estimate.

G) The practical advice that follows is unglamorous and reasonably well supported: group similar work together, silence notifications rather than relying on self-control, and protect a block of time long enough for the loading costs to be worth paying. Organisational researcher Dr Tomasz Bauer points out that most of this is a matter of design rather than character. "We tell individuals to concentrate," he says, "and then we seat them in rooms built for interruption." The laboratory findings are modest and sometimes fragile; the everyday conclusion they point towards is neither.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an everyday comparison used to explain a mental cost",
          "B",
          '"It is not that you cannot cook two dishes," she says. "It is that every time you put one down, you have to find your place in the recipe again."',
          "Paragraph B uses the cooking image.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to part of the mind remaining on an earlier task",
          "C",
          "Work on what has been called attention residue finds that part of the mind stays with the previous task, particularly when it was left unfinished, and that the next task is performed less well as a result.",
          "Paragraph C: attention residue.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a warning that a rare result may not survive repetition",
          "D",
          '"Anything that appears in two and a half per cent of a sample needs replicating before it is given a name," he says.',
          "Paragraph D: Iwu's warning about supertaskers.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the observation that a reported effect has weakened as studies grew larger",
          "F",
          "Some replications have found the effect, others have not, and the size reported has shrunk as the samples have grown.",
          "Paragraph F: the effect 'has shrunk as the samples have grown'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "advice that treats concentration as a question of arrangements rather than willpower",
          "G",
          '"We tell individuals to concentrate," he says, "and then we seat them in rooms built for interruption."',
          "Paragraph G: Bauer on design rather than character.",
        ),
        fromList(
          "matching_features",
          ATTENTION_PEOPLE,
          "Resuming a task means finding your place in it again.",
          "Marta Gil",
          '"It is that every time you put one down, you have to find your place in the recipe again."',
          "Gil's recipe image.",
        ),
        fromList(
          "matching_features",
          ATTENTION_PEOPLE,
          "An unusual finding should be confirmed before it is named.",
          "Peter Iwu",
          '"Anything that appears in two and a half per cent of a sample needs replicating before it is given a name," he says.',
          "Iwu: replicate before naming.",
        ),
        fromList(
          "matching_features",
          ATTENTION_PEOPLE,
          "The evidence supports an association and nothing stronger.",
          "Sanne de Vries",
          '"There is a correlation," she says. "Everything beyond that is currently story-telling."',
          "De Vries: 'There is a correlation.'",
        ),
        fromList(
          "matching_features",
          ATTENTION_PEOPLE,
          "Workplaces ask for focus in settings designed to prevent it.",
          "Tomasz Bauer",
          '"We tell individuals to concentrate," he says, "and then we seat them in rooms built for interruption."',
          "Bauer on rooms 'built for interruption'.",
        ),
        fromList(
          "matching_features",
          ATTENTION_PEOPLE,
          "Doing two things is possible; the interruption is what costs.",
          "Marta Gil",
          '"It is not that you cannot cook two dishes," she says.',
          "Gil: the problem is not the two dishes but the putting down.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Switching costs grow when tasks are more complicated or more ______ to each other.",
          "similar",
          "The delay is small, a fraction of a second, but it accumulates, and it grows as the tasks become more complicated or more similar to each other.",
          "Costs grow as tasks become 'more similar to each other'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Attention residue is strongest when the earlier task was left ______.",
          "unfinished",
          "Work on what has been called attention residue finds that part of the mind stays with the previous task, particularly when it was left unfinished, and that the next task is performed less well as a result.",
          "'Particularly when it was left unfinished'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In the simulator study, about one in ______ showed almost no loss.",
          "forty",
          "In a study that asked hundreds of volunteers to drive in a simulator while performing a memory and arithmetic task, the great majority were much worse at both than when doing either alone, but around one in forty showed almost no loss on either.",
          "'Around one in forty showed almost no loss'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Office studies record an interruption every few ______.",
          "minutes",
          "What is not in dispute is that notifications interrupt, that interruptions are frequent — office studies typically record one every few minutes — and that returning fully to an interrupted task takes considerably longer than people estimate.",
          "Offices record one 'every few minutes'.",
        ),
      ],
    },
  ],
};
