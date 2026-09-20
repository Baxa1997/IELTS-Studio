import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · food preservation and trade · flow-chart -------------------

const CURE_STEPS = {
  title: "Curing cod without refrigeration",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · animal senses · people and a word bank --------------------

const ELECTRIC_PEOPLE = ["Bianca Moreau", "Tewodros Alemu", "Hanna Virtanen", "Deshawn Ellery"];
const ELECTRIC_BANK = [
  "conductivity",
  "canals",
  "gill",
  "tail",
  "frequency",
  "turbid",
  "platypus",
  "cables",
  "muscle",
];

// ---- Passage 3 · development economics · lettered paragraphs ---------------

const CREDIT_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CREDIT_ENDINGS = [
  "because joint liability moves both assessment and enforcement to the group.",
  "although a borrower may find the money from a source other than the business.",
  "which is why business activity rose while profits did not.",
  "since a village of forty households cannot support fifteen shops.",
  "because the average conceals gains for some and losses for others.",
  "which the writer regards as the movement's most expensive mistake.",
  "even though the repayment figures above ninety-five per cent were genuine.",
];

export const TEST_75: CuratedTest = {
  key: "full-test-75",
  targetBand: 7,
  passages: [
    {
      key: "t75-p1-salt-cod",
      title: "The Fish That Kept Without Ice",
      topic: "how a method of preservation turned a northern fishery into a world trade",
      difficulty: 6,
      body: `Before refrigeration, the problem with fish was not catching it but keeping it. A fish begins to spoil within hours, and for most of history the only markets for fresh fish were within a day's travel of the water. What changed that, and what made a cold northern fishery into one of the largest trades in the world, was salt.

Salting works by removing water rather than by killing anything directly. Salt applied to flesh draws moisture out by osmosis, and the bacteria and moulds that cause decay cannot function below a certain water content. A properly cured and dried cod loses about four-fifths of its weight, keeps for years without refrigeration, and can be carried anywhere.

Cod was the ideal fish for this, for reasons of anatomy. It is very lean: the fat is concentrated in the liver rather than distributed through the flesh, and fat is what turns rancid. An oily fish such as herring cannot be preserved the same way and has to be pickled in brine in a barrel instead. Cod could be split, salted, dried in the open air and stacked like timber.

The technique was old, and two versions developed for two climates. In Norway the fish was hung on wooden racks in cold dry air and dried without salt at all, which produces a board-hard product keeping almost indefinitely. Where the air was damper — Newfoundland, Nova Scotia, much of the Atlantic coast — salt was essential, and the quantity required meant the fishery depended on salt imported from southern Europe, which is why a cod trade and a salt trade grew up together.

The consequences reached a long way from the fishing grounds. Salt cod was cheap, kept without care and provided a great deal of protein, which made it the standard provision on long voyages and the standard food for people who could not afford meat. It became a fixed part of the cooking of Portugal, Spain, southern Italy, West Africa and the Caribbean, none of which is anywhere near where the fish lives. In Catholic Europe the requirement to abstain from meat on a large number of days each year created a guaranteed annual market, which is part of why the trade was worth what it was.

The unpleasant part of the history is the arrangement by which much of it was financed. The lowest grade of cured fish, damaged or badly cured, was shipped to the sugar colonies of the Caribbean as food for enslaved people; the vessels returned with sugar, molasses and rum. The cod fishery was an ordinary commercial business whose economics were partly determined by that market, and the connection is usually left out of accounts presenting the trade as a story about seamanship.

The fishery itself was for four centuries assumed to be inexhaustible, and the assumption was not unreasonable on the evidence then available: the catches were enormous, they did not decline, and the fish were taken by hook from small boats in a way that removed a tiny fraction of the population. What changed the arithmetic was the arrival, from the 1950s, of vessels that could find fish with sonar, catch them with a trawl that swept the sea floor, and freeze them on board, so that the constraint of distance from port disappeared.

The collapse that followed is among the best-documented in fisheries. The stock off Newfoundland fell to a small percentage of its former size, and in 1992 Canada closed the fishery entirely, ending the employment of tens of thousands of people in a single announcement. The stock has not recovered in the decades since, and the usual explanation is that the ecosystem reorganised: with the large predator removed, populations of crab, shrimp and small fish expanded, and those small fish eat cod eggs and young, so the state without cod sustains itself.

Salt cod is now a delicacy in several of the countries that adopted it out of necessity, which is a common fate for a cheap food. Much of what is sold is taken from the Barents Sea, one of the few stocks still managed at a level most scientists accept, and the price reflects scarcity rather than the cost of curing.

What the whole history shows is how much of world food depends on preservation rather than production. The cod was always there. What made it a global commodity was a method of stopping it from rotting, and the collapse came when a different technology removed the constraint that had kept the catch within what the population could replace.`,
      questions: [
        tfng(
          "Salting preserves fish by killing the organisms that cause decay.",
          "FALSE",
          "Salting works by removing water rather than by killing anything directly.",
          "It works 'by removing water'.",
        ),
        tfng(
          "A cured and dried cod loses most of its original weight.",
          "TRUE",
          "A properly cured and dried cod loses about four-fifths of its weight, keeps for years without refrigeration, and can be carried anywhere.",
          "It loses 'about four-fifths of its weight'.",
        ),
        tfng(
          "The fat of a cod is spread through its flesh.",
          "FALSE",
          "It is very lean: the fat is concentrated in the liver rather than distributed through the flesh, and fat is what turns rancid.",
          "The fat sits 'in the liver'.",
        ),
        tfng(
          "In Norway the fish was dried without using salt.",
          "TRUE",
          "In Norway the fish was hung on wooden racks in cold dry air and dried without salt at all, which produces a board-hard product keeping almost indefinitely.",
          "It was 'dried without salt at all'.",
        ),
        tfng(
          "Religious observance in Europe created a dependable market for the fish.",
          "TRUE",
          "In Catholic Europe the requirement to abstain from meat on a large number of days each year created a guaranteed annual market, which is part of why the trade was worth what it was.",
          "It 'created a guaranteed annual market'.",
        ),
        tfng(
          "The Newfoundland stock has returned since the fishery was closed.",
          "FALSE",
          "The stock has not recovered in the decades since, and the usual explanation is that the ecosystem reorganised: with the large predator removed, populations of crab, shrimp and small fish expanded, and those small fish eat cod eggs and young, so the state without cod sustains itself.",
          "It 'has not recovered'.",
        ),
        tfng(
          "Most salt cod is now eaten in the countries that catch it.",
          "NOT GIVEN",
          "",
          "The passage says where it is sold from, not where it is consumed.",
        ),
        noteLine(
          CURE_STEPS,
          null,
          "Salt draws the moisture out of the flesh by ______",
          "osmosis",
          "Salt applied to flesh draws moisture out by osmosis, and the bacteria and moulds that cause decay cannot function below a certain water content.",
          "Moisture is drawn out 'by osmosis'.",
        ),
        noteLine(
          CURE_STEPS,
          null,
          "Decay organisms stop working below a certain ______ content",
          "water",
          "Salt applied to flesh draws moisture out by osmosis, and the bacteria and moulds that cause decay cannot function below a certain water content.",
          "They fail below 'a certain water content'.",
        ),
        noteLine(
          CURE_STEPS,
          null,
          "The split fish is dried in the air and stacked like ______",
          "timber",
          "Cod could be split, salted, dried in the open air and stacked like timber.",
          "It was 'stacked like timber'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "An oily fish such as herring has to be pickled in ______.",
          "brine",
          "An oily fish such as herring cannot be preserved the same way and has to be pickled in brine in a barrel instead.",
          "It is 'pickled in brine'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Curing in damp climates relied on salt brought from southern ______.",
          "Europe",
          "Where the air was damper — Newfoundland, Nova Scotia, much of the Atlantic coast — salt was essential, and the quantity required meant the fishery depended on salt imported from southern Europe, which is why a cod trade and a salt trade grew up together.",
          "The salt came from southern Europe.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "From the 1950s vessels found the fish using ______.",
          "sonar",
          "What changed the arithmetic was the arrival, from the 1950s, of vessels that could find fish with sonar, catch them with a trawl that swept the sea floor, and freeze them on board, so that the constraint of distance from port disappeared.",
          "They could 'find fish with sonar'.",
        ),
      ],
    },
    {
      key: "t75-p2-electroreception",
      title: "The Sense That Only Works in Water",
      topic: "how some animals perceive the electric fields that living bodies produce",
      difficulty: 7,
      body: `Every muscle contraction and every nerve impulse produces a small electric field in the surrounding water, and a substantial number of aquatic animals can detect it. Electroreception is not a curiosity confined to a few species; it is present in sharks and rays, in lampreys, in several groups of bony fish, in some amphibians, and — in a form that evolved separately — in the platypus and the echidna. It is among the more common senses in water and essentially absent on land, for a reason that explains most of the rest of the subject.

The reason is conductivity. Salt water conducts electricity well, so a weak field spreads through it and can be detected at a distance; air does not conduct, so the same field goes nowhere. Bianca Moreau, who studies the physics of the sense, makes the point that this single fact determines where the sense is found, how far it reaches and why freshwater species need a different arrangement from marine ones: fresh water conducts far less well than sea water, and a fish in a river has to generate its own field rather than rely on detecting somebody else's.

That division separates the two kinds of electroreception. Passive electroreception, found in sharks and rays, amounts to listening: an array of jelly-filled canals in the head, ending in sensory cells, registers fields produced by other animals. A shark can detect a field of a few billionths of a volt per centimetre, which is enough to find a flatfish buried in sand and motionless, because a buried fish still breathes and the gill movements produce a field. Tewodros Alemu, who has tested the sense experimentally, notes that a shark will attack a pair of electrodes producing the right field in preference to a piece of actual food nearby, which is the cleanest demonstration that the sense is doing the work rather than merely assisting.

Active electroreception is a different arrangement and rarer. Certain freshwater fish generate a continuous weak field from a modified muscle organ in the tail and detect distortions in it caused by nearby objects, because a rock, a plant and another fish all conduct differently from water. The result is a sense of the immediate surroundings that works in complete darkness and in water too muddy for vision, and the fish possessing it are largely nocturnal inhabitants of turbid rivers.

The signal carries more than terrain. Hanna Virtanen, who works on communication in these species, has shown that the discharge frequency identifies the species, the sex and the individual, and that two fish whose frequencies are close will shift them apart within seconds of meeting — an avoidance behaviour that keeps each one's own signal legible. She emphasises that the same organ is doing perception and communication simultaneously, which is an arrangement with no real parallel among the senses of land animals.

There is a cost, and it is the reason the sense has not spread further. Generating a field continuously is metabolically expensive, and the discharge is detectable by anything with a passive sense, which means an actively electric fish advertises itself to every catfish in the river. Deshawn Ellery, who has compared species with and without the organ, argues that the distribution is best explained as a trade-off rather than as a simple advantage: active electroreception appears in exactly those habitats where vision fails badly enough to make the cost worth paying, and nowhere else.

The platypus case is worth separating out because it is an independent invention. The animal hunts with its eyes, ears and nostrils closed, and its bill carries both electroreceptors and mechanoreceptors. The current interpretation is that it uses the difference in arrival time between an electrical signal, which travels almost instantaneously, and the pressure wave from the same movement, which travels more slowly, to estimate distance — the same principle as counting the seconds between lightning and thunder.

Applications have been proposed and mostly not delivered. Electrical deterrents intended to keep sharks away from swimmers work in some conditions and not others, and the published trials are inconsistent enough that no strong claim survives. There is more promise in the reverse: because the sense is exquisitely sensitive to weak fields, electric cables and offshore installations produce fields falling within the range these animals use, and there is now reasonable evidence that some species alter their behaviour near a cable.

What makes the sense theoretically interesting is that it has no subjective analogue we can borrow. A person can imagine echolocation as a kind of hearing. Nothing in ordinary experience corresponds to perceiving the conductivity of the objects around you, and the honest position is that we know what the animal can discriminate without knowing much at all about what it is like to be it.`,
      questions: [
        fromList(
          "matching_features",
          ELECTRIC_PEOPLE,
          "One property of water settles where the sense occurs and how far it reaches.",
          "Bianca Moreau",
          "Bianca Moreau, who studies the physics of the sense, makes the point that this single fact determines where the sense is found, how far it reaches and why freshwater species need a different arrangement from marine ones: fresh water conducts far less well than sea water, and a fish in a river has to generate its own field rather than rely on detecting somebody else's.",
          "Moreau draws everything from conductivity.",
        ),
        fromList(
          "matching_features",
          ELECTRIC_PEOPLE,
          "An animal prefers an artificial field to real food beside it.",
          "Tewodros Alemu",
          "Tewodros Alemu, who has tested the sense experimentally, notes that a shark will attack a pair of electrodes producing the right field in preference to a piece of actual food nearby, which is the cleanest demonstration that the sense is doing the work rather than merely assisting.",
          "Alemu's electrodes beat the food.",
        ),
        fromList(
          "matching_features",
          ELECTRIC_PEOPLE,
          "A single organ carries out perception and communication at once.",
          "Hanna Virtanen",
          "She emphasises that the same organ is doing perception and communication simultaneously, which is an arrangement with no real parallel among the senses of land animals.",
          "Virtanen stresses the double duty.",
        ),
        fromList(
          "matching_features",
          ELECTRIC_PEOPLE,
          "Where the sense occurs is best read as a trade-off, not an advantage.",
          "Deshawn Ellery",
          "Deshawn Ellery, who has compared species with and without the organ, argues that the distribution is best explained as a trade-off rather than as a simple advantage: active electroreception appears in exactly those habitats where vision fails badly enough to make the cost worth paying, and nowhere else.",
          "Ellery frames it as a trade-off.",
        ),
        fromList(
          "summary_completion",
          ELECTRIC_BANK,
          "The sense depends on the ______ of the surrounding medium.",
          "conductivity",
          "The reason is conductivity.",
          "Everything follows from conductivity.",
        ),
        fromList(
          "summary_completion",
          ELECTRIC_BANK,
          "Sharks detect fields through jelly-filled ______ in the head.",
          "canals",
          "Passive electroreception, found in sharks and rays, amounts to listening: an array of jelly-filled canals in the head, ending in sensory cells, registers fields produced by other animals.",
          "The canals hold the sensory cells.",
        ),
        fromList(
          "summary_completion",
          ELECTRIC_BANK,
          "A buried fish is found because its ______ movements make a field.",
          "gill",
          "A shark can detect a field of a few billionths of a volt per centimetre, which is enough to find a flatfish buried in sand and motionless, because a buried fish still breathes and the gill movements produce a field.",
          "The gill movements betray it.",
        ),
        fromList(
          "summary_completion",
          ELECTRIC_BANK,
          "An active species generates its field from an organ in the ______.",
          "tail",
          "Certain freshwater fish generate a continuous weak field from a modified muscle organ in the tail and detect distortions in it caused by nearby objects, because a rock, a plant and another fish all conduct differently from water.",
          "The organ sits in the tail.",
        ),
        fromList(
          "summary_completion",
          ELECTRIC_BANK,
          "Discharge ______ identifies species, sex and individual.",
          "frequency",
          "Hanna Virtanen, who works on communication in these species, has shown that the discharge frequency identifies the species, the sex and the individual, and that two fish whose frequencies are close will shift them apart within seconds of meeting — an avoidance behaviour that keeps each one's own signal legible.",
          "The frequency carries the identity.",
        ),
        mcq(
          "Why is the sense almost absent on land?",
          [
            "Air does not conduct electricity",
            "Land animals have better vision",
            "Fields are too strong in air",
            "The organs cannot survive dry conditions",
          ],
          "Air does not conduct electricity",
          "Salt water conducts electricity well, so a weak field spreads through it and can be detected at a distance; air does not conduct, so the same field goes nowhere.",
          "In air 'the same field goes nowhere'.",
        ),
        mcq(
          "Why must freshwater species produce their own field?",
          [
            "Fresh water conducts much less well",
            "River fish have no sensory canals",
            "Other animals' fields are too strong",
            "Fresh water is always too muddy",
          ],
          "Fresh water conducts much less well",
          "Bianca Moreau, who studies the physics of the sense, makes the point that this single fact determines where the sense is found, how far it reaches and why freshwater species need a different arrangement from marine ones: fresh water conducts far less well than sea water, and a fish in a river has to generate its own field rather than rely on detecting somebody else's.",
          "Fresh water 'conducts far less well'.",
        ),
        mcq(
          "How is the platypus thought to judge distance?",
          [
            "From the delay between electrical and pressure signals",
            "By comparing the two sides of its bill",
            "From the strength of the electrical signal alone",
            "From the temperature of the water",
          ],
          "From the delay between electrical and pressure signals",
          "The current interpretation is that it uses the difference in arrival time between an electrical signal, which travels almost instantaneously, and the pressure wave from the same movement, which travels more slowly, to estimate distance — the same principle as counting the seconds between lightning and thunder.",
          "It uses the difference in arrival time.",
        ),
        mcq(
          "What is the state of the evidence on electrical shark deterrents?",
          [
            "The published trials are inconsistent",
            "They work reliably in all conditions",
            "They have never been tested at all",
            "They attract sharks rather than repel them",
          ],
          "The published trials are inconsistent",
          "Electrical deterrents intended to keep sharks away from swimmers work in some conditions and not others, and the published trials are inconsistent enough that no strong claim survives.",
          "The trials are 'inconsistent enough that no strong claim survives'.",
        ),
      ],
    },
    {
      key: "t75-p3-microfinance",
      title: "The Loan That Was Meant to End Poverty",
      topic: "what thirty years of evaluation established about very small loans",
      difficulty: 8,
      body: `A) Small loans to poor borrowers, mostly women, mostly without collateral, mostly repaid: microfinance arrived with a claim that was unusually strong and unusually testable. It would let people with no access to banks invest in a small enterprise, and the returns would lift them out of poverty. Within thirty years it had reached something like two hundred million borrowers, acquired a Nobel Peace Prize, and been evaluated more rigorously than almost any other development intervention. The evaluations are the problem. Very few development ideas have been given so fair a hearing, and very few have come out of one so much smaller than they went in.

B) The mechanism was genuinely clever and deserves to be stated properly before it is criticised. A borrower without assets cannot offer security, and the cost of assessing a very small loan exceeds the interest it earns, so conventional banks do not lend. Group lending solves both at once: five or six borrowers are jointly liable, which transfers the assessment to people who know each other's circumstances and the enforcement to the same group. Repayment rates above ninety-five per cent followed, and they were real.

C) High repayment was then read as evidence of high returns, and this is where the reasoning went wrong. A loan is repaid if the borrower can find the money from anywhere: from the enterprise, from wages, from another lender, from selling something, or from relatives under pressure from the group. The repayment rate measures the strength of the collection mechanism, which the design deliberately made very strong, and says nothing about whether the investment produced anything. Two decades of advocacy treated the one as a proxy for the other, and the substitution was rarely stated plainly enough to be challenged.

D) When the randomised evaluations arrived, from the mid-2000s, they were consistent and disappointing. Across studies on several continents, access to microcredit produced no detectable average effect on household consumption, on health, on schooling, or on measures of women's decision-making within the household. Business activity did increase — more people ran a small enterprise, and existing enterprises bought more stock — without that translating into higher profits or incomes on average. The effects were not negative. They were approximately zero on the outcomes the movement had promised.

E) The interpretation matters more than the result, and this is where I think both sides behave badly. The critics concluded that microfinance does not work, which the evidence does not support: a zero average is consistent with substantial benefit to some borrowers and harm to others, and the studies that looked for this found exactly that pattern, with established business owners gaining and marginal borrowers taking on debt that left them worse off. The defenders retreated to the claim that the loans help people manage cash flow and smooth consumption, which is probably true, is supported by the evidence on savings and insurance products, and is a far weaker claim than the one the movement was built on.

F) There is a harder objection the debate has largely avoided. The theory requires that a poor household's binding constraint is capital, and for most of them it is not. What limits a small trader is usually demand: a village with forty households cannot support fifteen shops, and lending to the fifteenth does not create a customer. Where the constraint is a market rather than a loan, credit redistributes a fixed amount of trade between borrowers and leaves each of them with interest to pay. This is consistent with the finding of increased business activity and unchanged profit, which is otherwise a strange result.

G) My own conclusion is that the movement's real failure was rhetorical, and that it has been costly. Presenting small loans as an escape from poverty set a standard the product could not meet, and when the evaluations arrived the reaction discredited a genuinely useful financial service along with the exaggerated claim made for it. Poor households need somewhere safe to keep money, a way to pay bills at a distance, and insurance against a bad harvest considerably more than they need a loan at forty per cent. Those services are less photogenic and the case for them is much better, which is an awkward combination for anything that has to be funded by donors. Building them has been slowed by twenty years spent arguing about whether the loan worked.`,
      questions: [
        fromList(
          "matching_information",
          CREDIT_PARAGRAPHS,
          "why ordinary banks will not make loans of this size",
          "B",
          "A borrower without assets cannot offer security, and the cost of assessing a very small loan exceeds the interest it earns, so conventional banks do not lend.",
          "Paragraph B gives the banks' reasoning.",
        ),
        fromList(
          "matching_information",
          CREDIT_PARAGRAPHS,
          "the outcomes on which no average effect was detected",
          "D",
          "Across studies on several continents, access to microcredit produced no detectable average effect on household consumption, on health, on schooling, or on measures of women's decision-making within the household.",
          "Paragraph D lists the null results.",
        ),
        fromList(
          "matching_information",
          CREDIT_PARAGRAPHS,
          "an argument that customers rather than capital are the limit",
          "F",
          "What limits a small trader is usually demand: a village with forty households cannot support fifteen shops, and lending to the fifteenth does not create a customer.",
          "Paragraph F puts demand first.",
        ),
        fromList(
          "matching_information",
          CREDIT_PARAGRAPHS,
          "why a high repayment rate proves less than it appears to",
          "C",
          "The repayment rate measures the strength of the collection mechanism, which the design deliberately made very strong, and says nothing about whether the investment produced anything.",
          "Paragraph C separates collection from return.",
        ),
        fromList(
          "matching_information",
          CREDIT_PARAGRAPHS,
          "an account of which borrowers gained and which lost",
          "E",
          "The critics concluded that microfinance does not work, which the evidence does not support: a zero average is consistent with substantial benefit to some borrowers and harm to others, and the studies that looked for this found exactly that pattern, with established business owners gaining and marginal borrowers taking on debt that left them worse off.",
          "Paragraph E splits the borrowers in two.",
        ),
        ynng(
          "The writer thinks the group lending design was ingenious.",
          "YES",
          "The mechanism was genuinely clever and deserves to be stated properly before it is criticised.",
          "It was 'genuinely clever'.",
        ),
        ynng(
          "The writer accepts the critics' conclusion that microfinance does not work.",
          "NO",
          "The critics concluded that microfinance does not work, which the evidence does not support: a zero average is consistent with substantial benefit to some borrowers and harm to others, and the studies that looked for this found exactly that pattern, with established business owners gaining and marginal borrowers taking on debt that left them worse off.",
          "That conclusion is not supported by the evidence.",
        ),
        ynng(
          "The writer thinks savings and insurance matter more to poor households than credit.",
          "YES",
          "Poor households need somewhere safe to keep money, a way to pay bills at a distance, and insurance against a bad harvest considerably more than they need a loan at forty per cent.",
          "They need those 'considerably more'.",
        ),
        ynng(
          "The writer thinks the exaggerated claims did no lasting damage.",
          "NO",
          "Presenting small loans as an escape from poverty set a standard the product could not meet, and when the evaluations arrived the reaction discredited a genuinely useful financial service along with the exaggerated claim made for it.",
          "The reaction 'discredited a genuinely useful financial service'.",
        ),
        fromList(
          "matching_sentence_endings",
          CREDIT_ENDINGS,
          "Group lending made very small loans commercially possible,",
          "because joint liability moves both assessment and enforcement to the group.",
          "Group lending solves both at once: five or six borrowers are jointly liable, which transfers the assessment to people who know each other's circumstances and the enforcement to the same group.",
          "Both jobs move to the borrowers.",
        ),
        fromList(
          "matching_sentence_endings",
          CREDIT_ENDINGS,
          "Repayment is a poor measure of whether a loan did any good,",
          "although a borrower may find the money from a source other than the business.",
          "A loan is repaid if the borrower can find the money from anywhere: from the enterprise, from wages, from another lender, from selling something, or from relatives under pressure from the group.",
          "The money can come from anywhere.",
        ),
        fromList(
          "matching_sentence_endings",
          CREDIT_ENDINGS,
          "A zero average is not the same as no effect on anybody,",
          "because the average conceals gains for some and losses for others.",
          "The effects were not negative. They were approximately zero on the outcomes the movement had promised.",
          "An average of zero hides both directions.",
        ),
        fromList(
          "matching_sentence_endings",
          CREDIT_ENDINGS,
          "Credit cannot help where the constraint is the size of the market,",
          "since a village of forty households cannot support fifteen shops.",
          "Where the constraint is a market rather than a loan, credit redistributes a fixed amount of trade between borrowers and leaves each of them with interest to pay.",
          "Trade is redistributed, not created.",
        ),
        fromList(
          "matching_sentence_endings",
          CREDIT_ENDINGS,
          "Overstating what a small loan can do damaged a useful service,",
          "which the writer regards as the movement's most expensive mistake.",
          "Building them has been slowed by twenty years spent arguing about whether the loan worked.",
          "Twenty years were spent on the wrong argument.",
        ),
      ],
    },
  ],
};
