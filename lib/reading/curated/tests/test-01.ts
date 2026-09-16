import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history · notes + True/False/Not Given ----------------------

const SEWERS = {
  title: "Bazalgette's new drainage system",
  layout: "notes" as const,
  wordLimit: "NO MORE THAN TWO WORDS",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs ---------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PEOPLE = ["Clara Weiss", "Luca Bianchi", "Pieter de Vries", "Nadia Rahman"];

// ---- Passage 3 · subject-heavy argument -------------------------------------

const BANK = [
  "sugars",
  "water",
  "soil",
  "insects",
  "seedlings",
  "citations",
  "limited",
  "reliable",
  "negative",
  "fungi",
];

export const TEST_01: CuratedTest = {
  key: "full-test-01",
  targetBand: 6,
  passages: [
    {
      key: "t01-p1-great-stink",
      title: "The Summer London Could Not Breathe",
      topic: "the Great Stink of 1858 and the building of London's sewers",
      difficulty: 5,
      body: `In the hot summer of 1858, the River Thames in central London produced a smell so powerful that newspapers named the episode the Great Stink. For centuries the river had served as both the city's main source of drinking water and its most convenient drain. As the population of London rose from around one million in 1800 to more than two and a half million by the 1850s, the amount of waste entering the Thames grew enormously. That summer, weeks of unusually high temperatures lowered the water level and warmed the sewage lying along the exposed riverbanks. People crossing the bridges covered their faces with handkerchiefs, and passengers on river boats complained of feeling sick.

Ironically, improvements in people's homes had made the problem worse. Waste had traditionally been collected in cesspits beneath houses, which were emptied by hand, and the contents were sold to farmers as fertiliser. As the flushing toilet became more popular, however, the volume of water flowing into these pits increased, and many of them overflowed. In the late 1840s, new regulations required houses to connect their drains to the city's sewers. Since those sewers had originally been built to carry rainwater, they emptied straight into the Thames.

The state of the river was not only unpleasant but deadly. London suffered serious outbreaks of cholera in 1832, 1849 and 1854, which killed tens of thousands of people. At the time, most doctors believed that the disease was spread by foul air, an idea known as the miasma theory. In 1854, the physician John Snow traced a cluster of cases in the Soho district to a single public water pump and persuaded local officials to remove its handle. Although the outbreak soon ended, his argument that cholera was carried by contaminated water was not widely accepted during his lifetime.

What finally forced action was the location of Parliament itself. The newly rebuilt Houses of Parliament stood directly beside the river, and in June 1858 the smell became so bad that the curtains were soaked in chemicals in an attempt to block it. There was even discussion of moving parliamentary business away from London. Within a few weeks, politicians who had delayed for years passed a law giving the Metropolitan Board of Works the power and the money to build a new drainage system.

The man responsible for designing it was the Board's chief engineer, Joseph Bazalgette. His solution was to build large intercepting sewers running parallel to the river on both banks. These would collect waste from the existing smaller sewers before it could reach the Thames and carry it eastwards, using gravity and a series of pumping stations, to outfalls far downstream of the city. There it was released into the river on the outgoing tide, so that it would be carried out to sea. Work began in 1859 and employed thousands of labourers. In total, the scheme included more than 130 kilometres of main sewers and around 1,800 kilometres of smaller street sewers.

Bazalgette was notable for his foresight. When calculating the size of the pipes, he estimated the amount of waste the population would produce and then doubled the diameter, arguing that the work would only be done once. He also insisted on using Portland cement, which was more expensive than ordinary mortar but became stronger when wet, and he had every batch tested before use. Part of the system was built inside new embankments along the river, which also created space for roads and an underground railway. By 1875 the network was largely complete. When a final cholera outbreak struck east London in 1866, it was concentrated in an area that had not yet been connected, which helped to persuade many doubters that Snow had been right.

Bazalgette's sewers are still in use today, but they were never designed for a city of nine million people. During heavy rain, the old system overflows and releases untreated sewage into the Thames many times a year. To address this, engineers have built a new 25-kilometre tunnel beneath the river, completed in the mid-2020s, which stores the overflow until it can be treated. More than 150 years after the Great Stink, London is still living with the consequences of the decisions made that summer.`,
      questions: [
        noteLine(
          SEWERS,
          "The design",
          "intercepting sewers built ______ to the river on both banks",
          "parallel",
          "His solution was to build large intercepting sewers running parallel to the river on both banks.",
          "The main sewers ran 'parallel to the river on both banks'.",
          {
            indent: 1,
            before: [{ text: "aim: collect waste before it reached the Thames", indent: 0 }],
          },
        ),
        noteLine(
          SEWERS,
          "The design",
          "waste carried east using gravity and ______",
          "pumping stations",
          "These would collect waste from the existing smaller sewers before it could reach the Thames and carry it eastwards, using gravity and a series of pumping stations, to outfalls far downstream of the city.",
          "Waste moved 'using gravity and a series of pumping stations'.",
          { indent: 1 },
        ),
        noteLine(
          SEWERS,
          "The design",
          "waste released into the river on the outgoing ______",
          "tide",
          "There it was released into the river on the outgoing tide, so that it would be carried out to sea.",
          "It was released 'on the outgoing tide' so the sea would carry it away.",
          { indent: 1 },
        ),
        noteLine(
          SEWERS,
          "Construction",
          "the ______ of the pipes was doubled to allow for growth",
          "diameter",
          "When calculating the size of the pipes, he estimated the amount of waste the population would produce and then doubled the diameter, arguing that the work would only be done once.",
          "Bazalgette 'doubled the diameter' of his estimate.",
        ),
        noteLine(
          SEWERS,
          "Construction",
          "Portland cement chosen because it became stronger when ______",
          "wet",
          "He also insisted on using Portland cement, which was more expensive than ordinary mortar but became stronger when wet, and he had every batch tested before use.",
          "The cement 'became stronger when wet'. Its higher cost is a detail, not the reason it was chosen.",
        ),
        noteLine(
          SEWERS,
          "Construction",
          "new ______ along the river also made room for roads and a railway",
          "embankments",
          "Part of the system was built inside new embankments along the river, which also created space for roads and an underground railway.",
          "The 'new embankments' created space for roads and an underground railway.",
        ),
        noteLine(
          SEWERS,
          "Today",
          "the old system overflows during heavy ______",
          "rain",
          "During heavy rain, the old system overflows and releases untreated sewage into the Thames many times a year.",
          "It overflows 'during heavy rain'.",
        ),
        tfng(
          "Before the 1850s, Londoners took their drinking water from the Thames.",
          "TRUE",
          "For centuries the river had served as both the city's main source of drinking water and its most convenient drain.",
          "The river had been the city's 'main source of drinking water' for centuries.",
        ),
        tfng(
          "The spread of flushing toilets reduced the amount of water entering cesspits.",
          "FALSE",
          "As the flushing toilet became more popular, however, the volume of water flowing into these pits increased, and many of them overflowed.",
          "The volume of water 'increased', so the statement is the opposite of the passage.",
        ),
        tfng(
          "Most doctors in the 1850s accepted John Snow's view of how cholera spread.",
          "FALSE",
          "Although the outbreak soon ended, his argument that cholera was carried by contaminated water was not widely accepted during his lifetime.",
          "His argument 'was not widely accepted during his lifetime'; most doctors still believed in foul air.",
        ),
        tfng(
          "The curtains in the Houses of Parliament were treated with chemicals because of the smell.",
          "TRUE",
          "The newly rebuilt Houses of Parliament stood directly beside the river, and in June 1858 the smell became so bad that the curtains were soaked in chemicals in an attempt to block it.",
          "The curtains 'were soaked in chemicals in an attempt to block' the smell.",
        ),
        tfng(
          "Bazalgette had designed sewers for several other cities before his work in London.",
          "NOT GIVEN",
          "",
          "The passage describes his London scheme only; nothing is said about earlier work elsewhere.",
        ),
        tfng(
          "The tunnel completed in the mid-2020s was paid for mainly by the national government.",
          "NOT GIVEN",
          "",
          "The tunnel's length and purpose are given, but not who paid for it.",
        ),
      ],
    },
    {
      key: "t01-p2-night-trains",
      title: "The Return of the Night Train",
      topic: "why sleeper trains are coming back to Europe",
      difficulty: 6,
      body: `A) For much of the twentieth century, overnight trains were a normal way to travel across Europe. Passengers boarded in the evening, slept in a small cabin or a reclining seat, and woke up in another country. In the 1980s, it was possible to travel overnight from Paris to Rome or from Amsterdam to Copenhagen without ever boarding a plane. By the early 2000s, however, many of these services were disappearing. Rail historian Clara Weiss notes that night trains were always associated with romance and adventure, but that they rarely made a profit, which made them an easy target when national rail companies needed to save money.

B) The economics of sleeper services are difficult. A carriage fitted with beds carries far fewer passengers than one fitted with seats, and it needs staff throughout the night. Transport economist Luca Bianchi points out that a daytime train can complete several journeys in a single day, whereas a sleeper carriage makes only one trip in every twenty-four hours and spends the rest of the time standing idle. Operators must also pay a fee to use the tracks in each country they cross, and the old carriages used on many routes were expensive to repair. Because passengers expect privacy and comfort, sleeper tickets must be priced far higher than seats, which puts many travellers off.

C) At the same time, competition increased sharply. Budget airlines offered cheap flights between major cities, while new high-speed lines allowed daytime trains to cover long distances in a few hours. As passenger numbers fell, one route after another was cancelled. The trend began to reverse in 2016, when Austria's national rail company decided to take over several routes that other operators had abandoned and relaunched them under a single brand. Since then, a number of smaller companies have entered the market, including a cooperative that began running trains between Brussels and Berlin in 2023. Its co-founder, Pieter de Vries, says the industry had seriously underestimated demand: tickets for the first departures sold out within hours.

D) Much of this renewed interest is driven by concern about climate change. For journeys of a few hundred kilometres, flying produces considerably more greenhouse gas emissions per passenger than travelling by train, and some travellers now avoid short flights for this reason. In several countries, a movement encouraging people to feel uncomfortable about flying has gained attention, particularly among younger travellers. Environmental researcher Nadia Rahman argues that night trains are particularly attractive because a single journey can replace both a flight and a night in a hotel. However, she emphasises that the size of the benefit depends on how the electricity that powers the train is produced.

E) For many passengers, the appeal is also practical. Travelling overnight means that no working day is lost, and trains arrive in city centres rather than at airports far outside them. Some travellers also value the experience itself, describing the journey as part of the holiday rather than time to be endured. Yet the reality does not always match expectations. Common complaints include long delays, last-minute cancellations, uncomfortable old carriages and a lack of showers. Booking can also be frustrating, since tickets for journeys that cross several countries are not always available through a single website.

F) Operators are responding with new equipment. The Austrian company has introduced a new generation of carriages, some of which include compact single cabins designed for people travelling alone, offering privacy at a lower price than a full sleeping compartment. Several companies are also ordering carriages with larger windows and more space for luggage and bicycles. Other difficulties are harder to solve. Railway systems across Europe still use different signalling equipment and electrical standards, so a train crossing several borders may need special locomotives or a change of crew along the way.

G) Whether the revival will last remains uncertain. The European Union has declared its support for long-distance cross-border rail, but some newly launched routes have already been reduced or suspended because of rising costs. Supporters argue that governments should coordinate timetables and share the cost of new carriages across borders. Weiss believes that history offers a clear lesson: night trains have survived only where governments have treated them as a public service rather than expecting them to make money. If that view is shared, travellers may once again fall asleep in one country and wake up in another.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison between how often sleeper carriages and daytime trains are used",
          "B",
          "Transport economist Luca Bianchi points out that a daytime train can complete several journeys in a single day, whereas a sleeper carriage makes only one trip in every twenty-four hours and spends the rest of the time standing idle.",
          "Paragraph B contrasts several daytime journeys with one sleeper trip every twenty-four hours.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of accommodation designed for passengers without companions",
          "F",
          "The Austrian company has introduced a new generation of carriages, some of which include compact single cabins designed for people travelling alone, offering privacy at a lower price than a full sleeping compartment.",
          "Paragraph F describes 'compact single cabins designed for people travelling alone'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a list of problems that passengers frequently report",
          "E",
          "Common complaints include long delays, last-minute cancellations, uncomfortable old carriages and a lack of showers.",
          "Paragraph E lists 'common complaints'. Paragraph F mentions difficulties too, but they are operators' problems, not passengers' complaints.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "examples of forms of transport that competed with night trains",
          "C",
          "Budget airlines offered cheap flights between major cities, while new high-speed lines allowed daytime trains to cover long distances in a few hours.",
          "Paragraph C names budget airlines and high-speed daytime trains as the competition.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Night trains regained popularity partly because of concern about ______ change.",
          "climate",
          "Much of this renewed interest is driven by concern about climate change.",
          "The renewed interest 'is driven by concern about climate change'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "On shorter journeys, flying produces far more greenhouse gas ______ per passenger than rail.",
          "emissions",
          "For journeys of a few hundred kilometres, flying produces considerably more greenhouse gas emissions per passenger than travelling by train, and some travellers now avoid short flights for this reason.",
          "Flying produces more 'greenhouse gas emissions per passenger'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "People who travel overnight do not lose a working ______.",
          "day",
          "Travelling overnight means that no working day is lost, and trains arrive in city centres rather than at airports far outside them.",
          "'No working day is lost' is paraphrased as not losing a working day.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Tickets for journeys through several countries cannot always be bought on one ______.",
          "website",
          "Booking can also be frustrating, since tickets for journeys that cross several countries are not always available through a single website.",
          "Tickets are 'not always available through a single website'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Interest in night trains turned out to be far greater than the industry had expected.",
          "Pieter de Vries",
          "Its co-founder, Pieter de Vries, says the industry had seriously underestimated demand: tickets for the first departures sold out within hours.",
          "De Vries says demand was 'seriously underestimated' — tickets sold out within hours.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Night trains have rarely made money, despite their romantic image.",
          "Clara Weiss",
          "Rail historian Clara Weiss notes that night trains were always associated with romance and adventure, but that they rarely made a profit, which made them an easy target when national rail companies needed to save money.",
          "Weiss links night trains with romance but says they 'rarely made a profit'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "The environmental advantage of a train journey depends on where its power comes from.",
          "Nadia Rahman",
          "However, she emphasises that the size of the benefit depends on how the electricity that powers the train is produced.",
          "'She' is Nadia Rahman: the benefit depends on how the train's electricity is produced.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "A sleeper carriage is out of use for most of each day.",
          "Luca Bianchi",
          "Transport economist Luca Bianchi points out that a daytime train can complete several journeys in a single day, whereas a sleeper carriage makes only one trip in every twenty-four hours and spends the rest of the time standing idle.",
          "Bianchi says a sleeper carriage makes one trip a day and 'spends the rest of the time standing idle'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Night trains continue to run only when governments support them as a public service.",
          "Clara Weiss",
          "Weiss believes that history offers a clear lesson: night trains have survived only where governments have treated them as a public service rather than expecting them to make money.",
          "Weiss again: trains survived 'only where governments have treated them as a public service'. A person can be the answer more than once.",
        ),
      ],
    },
    {
      key: "t01-p3-wood-wide-web",
      title: "Is There Really a Wood Wide Web?",
      topic: "the scientific debate over underground networks between trees",
      difficulty: 7,
      body: `Few scientific ideas have captured the public imagination as quickly as the claim that trees talk to one another. According to this picture, the trees in a forest are linked by an underground network of fungi through which they share food, send warning signals and even care for their young. The oldest and largest trees, sometimes described as "mother trees", are said to feed seedlings growing in their shade. The idea has inspired best-selling books, documentaries and even a major Hollywood film, and the phrase "wood wide web", first used on the cover of a scientific journal in 1997, has entered everyday language.

Part of this picture rests on solid science. The roots of most land plants form partnerships with fungi known as mycorrhizal fungi. The fungi grow into or around the roots and spread fine threads through the soil, reaching water and minerals that the plant could not otherwise obtain. In return, the plant supplies the fungi with sugars produced by photosynthesis. Some estimates suggest that the fungal threads in a single teaspoon of forest soil would stretch for many metres if laid end to end. These partnerships are ancient and extremely widespread, and their importance to forest health is not seriously disputed.

The more dramatic claims concern what happens when a single fungus connects the roots of several trees at once, forming what researchers call a common mycorrhizal network. In the 1997 study that popularised the idea, scientists exposed young birch and fir trees growing in a Canadian forest to air containing carbon in a form that could be traced. When they later found that traced carbon in neighbouring trees, they concluded that it had passed from one species to another through the fungal network. Later studies appeared to show that seedlings connected to larger trees survived better than those that were not. Other researchers reported that trees attacked by insects appeared to send chemical signals through these networks, prompting their neighbours to increase their defences.

In 2023, however, a team of researchers published a careful review of the field studies on which these claims rest, and their conclusions were sobering. They found that common mycorrhizal networks had been convincingly mapped in only a small number of forest types. In many experiments, carbon could have moved between trees through the soil rather than through fungal threads, and the amounts involved were often too small to make a meaningful difference to the receiving tree. The evidence that seedlings benefit from being connected was mixed, with roughly as many studies finding negative or neutral effects as positive ones. Perhaps most strikingly, the review found that weaker studies were frequently cited as if they had provided strong support. The authors did not claim that networks never exist or never matter, only that the evidence was far thinner than the public had been led to believe.

None of this suggests that the researchers who developed these ideas acted dishonestly. Science advances by proposing bold hypotheses and then testing them, and early findings are often refined or overturned. The difficulty, in my view, lies in how quickly tentative results were turned into confident stories for a general audience. Metaphors such as "mother trees" and a forest "internet" are memorable precisely because they make trees seem more like people. Yet they also encourage readers to imagine that forests possess intentions and relationships that no experiment has demonstrated.

This matters for more than academic reasons. In some regions, forestry guidelines have already been influenced by the belief that large trees nourish the young ones around them. Retaining old trees during logging is often sensible, since they provide habitat for wildlife and store large amounts of carbon, but decisions of this kind should rest on evidence that is secure. When popular claims are later shown to have been exaggerated, the damage to public trust in science can be considerable, and it may extend to findings that are well established. Forest managers deserve guidance that reflects what is actually known.

It would be a mistake, though, to conclude that the underground life of forests is uninteresting. The partnerships between plants and fungi are among the most important relationships on Earth, and far more remains to be discovered about how they work. Researchers now have better tools for tracing the movement of nutrients and for identifying which fungi connect which roots, and the next generation of studies should be able to test the network hypothesis properly. The real story may prove less sentimental than the one that became famous, but it is likely to be no less remarkable.`,
      questions: [
        mcq(
          "What does the writer say about the phrase 'wood wide web'?",
          [
            "It was invented by the makers of a film.",
            "It first appeared on the cover of a scientific journal.",
            "It is rarely used outside scientific research.",
            "It was rejected by the researchers who studied networks.",
          ],
          "It first appeared on the cover of a scientific journal.",
          'The idea has inspired best-selling books, documentaries and even a major Hollywood film, and the phrase "wood wide web", first used on the cover of a scientific journal in 1997, has entered everyday language.',
          "The phrase was 'first used on the cover of a scientific journal in 1997'. A is a trap: the film came later and was inspired by the idea.",
        ),
        mcq(
          "According to the passage, what did the 1997 study conclude?",
          [
            "Carbon had moved between trees of different species.",
            "Birch trees grew faster than fir trees.",
            "Fungi took carbon from trees without giving anything back.",
            "Seedlings survived better when they were isolated.",
          ],
          "Carbon had moved between trees of different species.",
          "When they later found that traced carbon in neighbouring trees, they concluded that it had passed from one species to another through the fungal network.",
          "The researchers concluded that carbon 'had passed from one species to another'. D reverses a later finding.",
        ),
        mcq(
          "What did the 2023 review find about the carbon passing between trees?",
          [
            "It had been measured accurately in most forest types.",
            "It always travelled through fungal threads.",
            "It was often too small to benefit the tree that received it.",
            "It was greater in young forests than in old ones.",
          ],
          "It was often too small to benefit the tree that received it.",
          "In many experiments, carbon could have moved between trees through the soil rather than through fungal threads, and the amounts involved were often too small to make a meaningful difference to the receiving tree.",
          "The amounts 'were often too small to make a meaningful difference to the receiving tree'. B is contradicted: it may have moved through the soil.",
        ),
        mcq(
          "Why does the writer mention forestry guidelines?",
          [
            "to show that popular claims can affect practical decisions",
            "to argue that old trees should be removed during logging",
            "to explain how the 2023 review was carried out",
            "to suggest that forest managers ignore scientific research",
          ],
          "to show that popular claims can affect practical decisions",
          "In some regions, forestry guidelines have already been influenced by the belief that large trees nourish the young ones around them.",
          "Guidelines 'have already been influenced' by the popular belief, which is why the writer says the issue matters beyond academia.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Mycorrhizal fungi help plants to obtain water and minerals, and receive ______ in return.",
          "sugars",
          "In return, the plant supplies the fungi with sugars produced by photosynthesis.",
          "The plant supplies 'sugars produced by photosynthesis'. 'Water' is what the fungi help the plant obtain, not what they receive.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Some researchers reported that trees under attack from ______ appeared to warn nearby trees.",
          "insects",
          "Other researchers reported that trees attacked by insects appeared to send chemical signals through these networks, prompting their neighbours to increase their defences.",
          "Trees 'attacked by insects' appeared to send signals.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "The 2023 review noted that carbon might have passed through the ______ rather than through the fungi.",
          "soil",
          "In many experiments, carbon could have moved between trees through the soil rather than through fungal threads, and the amounts involved were often too small to make a meaningful difference to the receiving tree.",
          "Carbon 'could have moved between trees through the soil'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "The evidence that ______ gain from being connected to larger trees was mixed.",
          "seedlings",
          "The evidence that seedlings benefit from being connected was mixed, with roughly as many studies finding negative or neutral effects as positive ones.",
          "'Seedlings benefit' is paraphrased as 'seedlings gain'. 'Negative' is a distractor taken from the same sentence.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Weak studies had often received ______ that treated them as strong evidence.",
          "citations",
          "Perhaps most strikingly, the review found that weaker studies were frequently cited as if they had provided strong support.",
          "Being 'frequently cited' means receiving citations.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Overall, the authors found the evidence for such networks more ______ than the public had been told.",
          "limited",
          "The authors did not claim that networks never exist or never matter, only that the evidence was far thinner than the public had been led to believe.",
          "'Far thinner' is paraphrased as 'more limited'. 'Reliable' is the opposite of what the review found.",
        ),
        ynng(
          "The researchers who first described tree networks deliberately misled the public.",
          "NO",
          "None of this suggests that the researchers who developed these ideas acted dishonestly.",
          "The writer states that nothing 'suggests that the researchers ... acted dishonestly'.",
        ),
        ynng(
          "Early findings about forest networks were presented to the public too confidently.",
          "YES",
          "The difficulty, in my view, lies in how quickly tentative results were turned into confident stories for a general audience.",
          "'In my view' marks the writer's opinion: tentative results became 'confident stories' too quickly.",
        ),
        ynng(
          "There can be good reasons to keep old trees during logging apart from any effect on seedlings.",
          "YES",
          "Retaining old trees during logging is often sensible, since they provide habitat for wildlife and store large amounts of carbon, but decisions of this kind should rest on evidence that is secure.",
          "The writer gives habitat and carbon storage as reasons for keeping old trees.",
        ),
        ynng(
          "Research into plant and fungus partnerships receives too little funding.",
          "NOT GIVEN",
          "",
          "The writer says much remains to be discovered, but says nothing about funding.",
        ),
      ],
    },
  ],
};
