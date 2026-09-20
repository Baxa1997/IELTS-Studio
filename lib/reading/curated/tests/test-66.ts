import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · industrial history · notes box -----------------------------

const PALLET_NOTES = {
  title: "Why the pallet spread",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · insect agriculture · people and a word bank ----------------

const ANT_PEOPLE = [
  "Ana Beatriz Salles",
  "Duncan Meiring",
  "Priya Raghunathan",
  "Oskar Lindqvist",
];
const ANT_BANK = [
  "fungus",
  "leaves",
  "queen",
  "antibiotic",
  "bacteria",
  "waste",
  "spores",
  "trails",
  "soil",
];

// ---- Passage 3 · cultural policy · lettered paragraphs ----------------------

const MUSEUM_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const MUSEUM_ENDINGS = [
  "because the extra visits came from people who were already going.",
  "although the collections concerned are the ones people queue to enter.",
  "which is why the policy's supporters prefer not to mention the finding.",
  "since a proportion of the money is spent on the act of collecting it.",
  "because the money comes from a budget that also funds museums elsewhere.",
  "which the writer regards as the question the debate has managed to avoid.",
  "even though attendance figures are used to justify public funding.",
];

export const TEST_66: CuratedTest = {
  key: "full-test-66",
  targetBand: 5,
  passages: [
    {
      key: "t66-p1-the-pallet",
      title: "The Platform Nobody Orders",
      topic: "how a cheap wooden platform reorganised the movement of goods",
      difficulty: 4,
      body: `Almost every manufactured object a person buys has spent part of its journey sitting on a wooden platform about a metre square. The platform is called a pallet, and it is one of the least noticed pieces of equipment in the world economy. It has no moving parts, it is usually made of cheap softwood, and it costs very little. Yet without it the modern warehouse could not work at all.

Before the pallet, goods were loaded by hand. A ship's cargo arrived in barrels, sacks and wooden crates of different shapes, and a team of dockers moved each one separately. A single ship could take a week to unload. The work was slow, it was dangerous, and it required a large number of men standing on a quay waiting for a ship to arrive.

The forklift truck, which appeared in the years around the First World War, could lift a heavy load, but it needed something to lift it by. A crate sitting flat on the floor gives the forks nothing to slide under. The answer was to build a platform with a gap beneath it. The forks slide into the gap, the platform rises, and everything stacked on top of it rises together. One driver could then move in a few seconds what a team of men had taken many minutes to shift.

The truck and the platform therefore developed together, and neither is much use without the other. This is a common pattern in the history of technology, and it explains why the pallet took some time to spread. A factory that bought forklift trucks also had to rebuild its doorways, strengthen its floors and train its drivers. The saving was obvious, but the cost came first.

The Second World War settled the question. Armies had to move enormous quantities of supplies through ports that had not been designed for them, and the pallet allowed a ship to be emptied in a day rather than a week. American military depots adopted it as standard, and the men who ran those depots went back to civilian work afterwards with a firm opinion about how a warehouse should be organised.

A problem appeared as soon as the pallet became normal. A loaded pallet leaves one company and arrives at another, and it then has to come back. Sending empty platforms across a country costs money and earns nothing. Some firms simply threw them away, which was wasteful. Others insisted that the driver wait while the goods were unloaded, which wasted the driver's time.

The solution was to stop treating the pallet as property. Under a pooling system, a company does not own the pallets it uses; it hands over as many empty ones as it receives full ones, and a central operator repairs and redistributes them. What matters is the number, not the individual object. Pooling only works if every pallet is the same size, which is why the industry eventually agreed on a small number of standard measurements.

Agreement was not easily reached. Europe settled on a platform measuring 1200 by 800 millimetres, while North America uses one of 48 by 40 inches, and the two are close enough to be confusing but not close enough to be interchangeable. A container packed efficiently with one size wastes space when packed with the other. Several attempts to create a single world standard have failed, because in each country the shelving, lorries and doorways were already built around the local measurement, and replacing all of it would cost more than the inefficiency does.

Wood remains the usual material, for reasons that have little to do with strength. Plastic pallets last longer and are easier to clean, but they cost several times as much and are worth stealing. A wooden pallet can be repaired with a hammer by an untrained person, and when it is beyond repair it can be chipped for fuel or garden mulch. Its cheapness is the whole point: it is designed to be treated carelessly.

There is one hidden cost that took decades to notice. Wooden pallets carry insects. A pallet made from a tree in one country and shipped to another can deliver beetles that have no natural enemies where they arrive, and several serious forest pests are believed to have travelled this way. An international rule now requires wood used in packaging to be heat-treated or fumigated before it crosses a border, and treated pallets carry a stamped mark showing it has been done.

The pallet is a good example of a small object whose importance is invisible because it is not the thing anybody is buying. Nobody orders a pallet; it arrives underneath something else. But the size of a lorry, the height of a warehouse shelf, the width of a container door and the shape of a cardboard box are all decided by it, and a change to the platform would force a change to all of them.`,
      questions: [
        tfng(
          "Pallets are normally built from expensive hardwood.",
          "FALSE",
          "It has no moving parts, it is usually made of cheap softwood, and it costs very little.",
          "It is made of 'cheap softwood'.",
        ),
        tfng(
          "Unloading a ship by hand could take as long as a week.",
          "TRUE",
          "A single ship could take a week to unload.",
          "A ship 'could take a week to unload'.",
        ),
        tfng(
          "A forklift truck was of little use without something built for it to lift.",
          "TRUE",
          "The forklift truck, which appeared in the years around the First World War, could lift a heavy load, but it needed something to lift it by.",
          "It 'needed something to lift it by'.",
        ),
        tfng(
          "Most dockers lost their jobs once pallets came into use.",
          "NOT GIVEN",
          "",
          "The passage never says what happened to the dockers' employment.",
        ),
        tfng(
          "In a pooling system each company owns the pallets it sends out.",
          "FALSE",
          "Under a pooling system, a company does not own the pallets it uses; it hands over as many empty ones as it receives full ones, and a central operator repairs and redistributes them.",
          "A company 'does not own the pallets it uses'.",
        ),
        tfng(
          "The European and North American standard sizes can be used in place of each other.",
          "FALSE",
          "Europe settled on a platform measuring 1200 by 800 millimetres, while North America uses one of 48 by 40 inches, and the two are close enough to be confusing but not close enough to be interchangeable.",
          "They are 'not close enough to be interchangeable'.",
        ),
        tfng(
          "A damaged wooden pallet can be mended by somebody with no training.",
          "TRUE",
          "A wooden pallet can be repaired with a hammer by an untrained person, and when it is beyond repair it can be chipped for fuel or garden mulch.",
          "It can be repaired 'by an untrained person'.",
        ),
        noteLine(
          PALLET_NOTES,
          null,
          "Military ______ in the United States made it standard equipment",
          "depots",
          "American military depots adopted it as standard, and the men who ran those depots went back to civilian work afterwards with a firm opinion about how a warehouse should be organised.",
          "It was 'American military depots' that adopted it.",
          { before: [{ text: "Three conditions had to be met first:", indent: 0 }] },
        ),
        noteLine(
          PALLET_NOTES,
          null,
          "Pooling requires every platform to share one ______",
          "size",
          "Pooling only works if every pallet is the same size, which is why the industry eventually agreed on a small number of standard measurements.",
          "Every pallet has to be 'the same size'.",
        ),
        noteLine(
          PALLET_NOTES,
          null,
          "Packaging wood must be heat-treated or ______ before export",
          "fumigated",
          "An international rule now requires wood used in packaging to be heat-treated or fumigated before it crosses a border, and treated pallets carry a stamped mark showing it has been done.",
          "It must be 'heat-treated or fumigated'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The forks of a truck slide into a ______ underneath the platform.",
          "gap",
          "The answer was to build a platform with a gap beneath it.",
          "The platform has 'a gap beneath it'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Wooden pallets can transport ______ from one country to another.",
          "insects",
          "Wooden pallets carry insects.",
          "Wooden pallets 'carry insects'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A treated pallet carries a stamped ______ as proof of treatment.",
          "mark",
          "An international rule now requires wood used in packaging to be heat-treated or fumigated before it crosses a border, and treated pallets carry a stamped mark showing it has been done.",
          "They 'carry a stamped mark'.",
        ),
      ],
    },
    {
      key: "t66-p2-leaf-cutter-ants",
      title: "The Ants That Grow Their Own Food",
      topic: "an insect society that lives on a crop it cultivates underground",
      difficulty: 5,
      body: `A colony of leaf-cutter ants can strip a young tree of its leaves in a night, and for a long time this was the whole of what was known about them: they were a pest, and they ate leaves. Neither half of that description is correct. The ants do not eat the leaves at all. They carry them underground and feed them to a fungus, and it is the fungus they live on.

The arrangement is genuinely agricultural. A mature nest may contain several million ants and a set of underground chambers holding the crop, which the ants tend continuously. Large workers cut fragments of leaf and carry them home along cleared trails. Inside, middle-sized workers chew the fragments into a paste, press them into the surface of the garden and plant pieces of fungus on top. Smaller workers weed, removing anything growing there that should not be.

Ana Beatriz Salles, who has studied the division of labour in these nests, points out that the size of a worker predicts almost exactly what it does. The largest ants cut and carry, the middle sizes process the leaves, and the smallest never leave the garden. A worker cannot change job, because it cannot change size: an ant reaches its adult dimensions and stays there. The colony therefore decides its own workforce by deciding what sizes of larvae to raise, months before the work needs doing.

The fungus the ants cultivate is found nowhere else. It no longer produces the spores by which a fungus normally reproduces and spreads, and it depends entirely on being carried from one nest to the next. When a young queen leaves to found a colony she takes a pellet of the crop with her in a pocket in her mouth. Duncan Meiring, who works on the genetics of the relationship, describes the fungus as a crop in the strict sense — a domesticated organism that could not now survive without the species that farms it, and that has lost the ability to live independently over some millions of years of cultivation.

Any farm that grows a single crop in a warm, damp place is vulnerable, and these gardens are attacked by a mould that specialises in them. Priya Raghunathan has shown that the ants control it with chemistry rather than by weeding alone. The ants carry bacteria in special pits in their skin, and those bacteria produce an antibiotic that suppresses the mould without harming the crop. The arrangement has been in place far longer than human medicine has existed, and the mould has not become resistant to it, which is the fact that interests her most.

Refuse is the other problem a farm has to solve. Spent leaf material and dead fungus are toxic to the colony, and a large nest produces a great deal of both. The material is carried to a chamber set apart from the gardens, or in some species to a heap outside the nest altogether. Oskar Lindqvist, who has measured the flow of material through nests, notes that the ants who work in the waste chamber do not return to the gardens, and that they are the oldest workers in the colony. Handling refuse is the last job an ant does.

The scale of the operation is easy to underestimate. A single nest may move several tonnes of soil during its construction and clear a network of trails extending a hundred metres from the entrance. Leaf-cutters are the dominant plant-eaters across much of South and Central America, consuming more vegetation than any mammal in the same forest, and because they concentrate that vegetation in one place they alter the ground beneath them. The earth around an old nest is measurably richer, and the trees growing over it grow faster.

To a farmer the ants are simply a problem. A colony can take a large share of a citrus orchard or a young plantation, and the usual response is poisoned bait carried into the nest by the ants themselves. The difficulty is that the bait has to be attractive enough to be collected and slow enough to reach the gardens before the ants that collected it die, and small workers reject anything that smells wrong.

What makes the system interesting beyond the insects is how many separate problems it solves at once. A crop has been domesticated, labour has been divided by body size, a disease is controlled by a cultivated third organism, and refuse is handled by a workforce kept away from the food. None of it was designed. Each part is the result of many millions of years in which nests that did those things slightly better left more nests behind.`,
      questions: [
        fromList(
          "matching_features",
          ANT_PEOPLE,
          "What a worker does is fixed by how large it grew.",
          "Ana Beatriz Salles",
          "Ana Beatriz Salles, who has studied the division of labour in these nests, points out that the size of a worker predicts almost exactly what it does.",
          "Salles links size to job.",
        ),
        fromList(
          "matching_features",
          ANT_PEOPLE,
          "The cultivated organism could no longer survive on its own.",
          "Duncan Meiring",
          "Duncan Meiring, who works on the genetics of the relationship, describes the fungus as a crop in the strict sense — a domesticated organism that could not now survive without the species that farms it, and that has lost the ability to live independently over some millions of years of cultivation.",
          "Meiring calls it a domesticated crop.",
        ),
        fromList(
          "matching_features",
          ANT_PEOPLE,
          "A disease of the crop is held back by a substance the ants carry.",
          "Priya Raghunathan",
          "Priya Raghunathan has shown that the ants control it with chemistry rather than by weeding alone.",
          "Raghunathan found the chemical control.",
        ),
        fromList(
          "matching_features",
          ANT_PEOPLE,
          "The ants who deal with refuse are those nearest the end of their lives.",
          "Oskar Lindqvist",
          "Oskar Lindqvist, who has measured the flow of material through nests, notes that the ants who work in the waste chamber do not return to the gardens, and that they are the oldest workers in the colony.",
          "Lindqvist found they are the oldest.",
        ),
        fromList(
          "summary_completion",
          ANT_BANK,
          "The ants cut ______ but do not eat them.",
          "leaves",
          "The ants do not eat the leaves at all.",
          "They 'do not eat the leaves at all'.",
        ),
        fromList(
          "summary_completion",
          ANT_BANK,
          "The cut material is fed to a ______ kept in underground chambers.",
          "fungus",
          "They carry them underground and feed them to a fungus, and it is the fungus they live on.",
          "The leaves feed a fungus.",
        ),
        fromList(
          "summary_completion",
          ANT_BANK,
          "The crop no longer makes the ______ that would let it spread by itself.",
          "spores",
          "It no longer produces the spores by which a fungus normally reproduces and spreads, and it depends entirely on being carried from one nest to the next.",
          "It no longer produces spores.",
        ),
        fromList(
          "summary_completion",
          ANT_BANK,
          "A founding ______ carries a piece of it in her mouth.",
          "queen",
          "When a young queen leaves to found a colony she takes a pellet of the crop with her in a pocket in her mouth.",
          "A young queen carries the pellet.",
        ),
        fromList(
          "summary_completion",
          ANT_BANK,
          "Pits in the ants' skin hold ______ that make a protective chemical.",
          "bacteria",
          "The ants carry bacteria in special pits in their skin, and those bacteria produce an antibiotic that suppresses the mould without harming the crop.",
          "The pits hold bacteria.",
        ),
        mcq(
          "What is true of the smallest workers?",
          [
            "They never leave the fungus garden",
            "They cut fragments from leaves",
            "They chew the leaves into a paste",
            "They carry refuse out of the nest",
          ],
          "They never leave the fungus garden",
          "The largest ants cut and carry, the middle sizes process the leaves, and the smallest never leave the garden.",
          "The smallest 'never leave the garden'.",
        ),
        mcq(
          "Which fact about the antibiotic most interests Raghunathan?",
          [
            "The mould has not become resistant to it",
            "It is produced by the crop itself",
            "It harms the fungus at high doses",
            "It was first identified in human medicine",
          ],
          "The mould has not become resistant to it",
          "The arrangement has been in place far longer than human medicine has existed, and the mould has not become resistant to it, which is the fact that interests her most.",
          "That is 'the fact that interests her most'.",
        ),
        mcq(
          "What effect does an old nest have on the ground around it?",
          [
            "It is richer and supports faster growth",
            "It becomes too acid for most trees",
            "It is compacted by the trails",
            "It loses most of its nutrients",
          ],
          "It is richer and supports faster growth",
          "The earth around an old nest is measurably richer, and the trees growing over it grow faster.",
          "The earth is richer and trees grow faster.",
        ),
        mcq(
          "Why is poisoned bait hard to design?",
          [
            "It must be attractive and also act slowly",
            "Only the largest ants will carry it",
            "It cannot be made to smell of leaves",
            "It has to be placed inside the gardens",
          ],
          "It must be attractive and also act slowly",
          "The difficulty is that the bait has to be attractive enough to be collected and slow enough to reach the gardens before the ants that collected it die, and small workers reject anything that smells wrong.",
          "It must be attractive enough and slow enough.",
        ),
      ],
    },
    {
      key: "t66-p3-museum-charges",
      title: "Should a Museum Charge at the Door?",
      topic: "whether free entry to national collections does what is claimed for it",
      difficulty: 6,
      body: `A) In some countries the national museums are free to enter and in most they are not. Britain removed charges from its national collections in 2001 and has kept them off since; France, Italy and the United States mostly charge, with various concessions. The arrangement in each case is a historical accident defended afterwards as a principle, and the arguments made for and against are rarely the arguments that decided the matter. Because the policy is almost always inherited rather than chosen, the question of whether it works has to be settled from evidence rather than from first principles.

B) The case for free entry is usually made in terms of who comes through the door. A charge is a barrier, and barriers fall hardest on people with least money, so removing the charge should widen the audience. The evidence for the first half of that claim is strong: visitor numbers at the British national museums roughly doubled in the decade after charges were removed. The evidence for the second half is much weaker. Surveys taken before and after found that the additional visitors came overwhelmingly from the same social groups that had been visiting already, and that they came more often rather than in greater variety.

C) That finding is uncomfortable for both sides and is usually quoted by only one. Opponents of free entry treat it as proof that the policy failed, which does not follow: a person visiting four times a year instead of once is getting more out of a public collection, and there is nothing wrong with that. Supporters tend not to mention it at all, which is worse, because a policy defended on grounds it does not achieve is vulnerable the moment somebody checks. The result deserves to be stated plainly by whoever cites it and then argued about honestly, which is not what has happened to it.

D) The financial argument is more complicated than either camp admits. A museum that charges collects money at the door but spends a significant proportion of it on collecting: staff, barriers, card systems and the administration of concessions. A museum that does not charge loses the revenue but gains three things — a larger stream of donations at the exit, higher spending in the shop and café, and in some countries the ability to claim public funding on the basis of attendance. Whether free entry costs an institution money depends on how good it is at the second list, and the institutions that are good at it are the large ones in capital cities.

E) This is where I think the honest objection lies, and it is not about visitors at all. Free entry is expensive, and it is funded from a national budget that also pays for regional museums, which are much more likely to be the only collection within reach of somebody who does not live in a city. A policy that is free at the door of the largest institutions and closes branches elsewhere has redistributed money towards people who already had the most access. That is a real cost, and it is paid quietly by places with no national profile to defend.

F) There is also a question about what a price signals. A charge tells a visitor that the thing has a value, and a certain amount of evidence from other public services suggests that free provision is sometimes read as worthless provision. I am not persuaded by this in the museum case. The collections that are free are precisely the ones people queue in the rain to enter, and the objection seems to be an argument about theory that the observable behaviour does not support.

G) My own position is that the question is asked at the wrong level. Whether a particular museum charges matters far less than whether the total public money spent on collections is enough and is distributed towards the places that need it, and the free-entry debate has absorbed an enormous amount of attention that would have been better spent on that. If a national museum has to choose between charging five pounds and closing its education department, the education department should survive. A collection that nobody can afford to catalogue, conserve or explain to a school party is not made more public by being free to walk into. Making a principle of the door is a way of avoiding the harder question of the budget.`,
      questions: [
        fromList(
          "matching_information",
          MUSEUM_PARAGRAPHS,
          "a reason why admission income is worth less than it appears",
          "D",
          "A museum that charges collects money at the door but spends a significant proportion of it on collecting: staff, barriers, card systems and the administration of concessions.",
          "Paragraph D lists the cost of collecting.",
        ),
        fromList(
          "matching_information",
          MUSEUM_PARAGRAPHS,
          "an argument the writer states and then declines to accept",
          "F",
          "I am not persuaded by this in the museum case.",
          "Paragraph F rejects the price-signal argument.",
        ),
        fromList(
          "matching_information",
          MUSEUM_PARAGRAPHS,
          "figures showing a large rise in the number of visits",
          "B",
          "The evidence for the first half of that claim is strong: visitor numbers at the British national museums roughly doubled in the decade after charges were removed.",
          "Paragraph B gives the doubling of numbers.",
        ),
        fromList(
          "matching_information",
          MUSEUM_PARAGRAPHS,
          "a claim that the policy helps those with the most access already",
          "E",
          "A policy that is free at the door of the largest institutions and closes branches elsewhere has redistributed money towards people who already had the most access.",
          "Paragraph E makes the redistribution charge.",
        ),
        fromList(
          "matching_information",
          MUSEUM_PARAGRAPHS,
          "an accusation that both sides handle one result dishonestly",
          "C",
          "That finding is uncomfortable for both sides and is usually quoted by only one.",
          "Paragraph C accuses both camps.",
        ),
        ynng(
          "The writer believes free entry widened the social range of visitors.",
          "NO",
          "Surveys taken before and after found that the additional visitors came overwhelmingly from the same social groups that had been visiting already, and that they came more often rather than in greater variety.",
          "The extra visitors were from the same groups.",
        ),
        ynng(
          "The writer thinks more frequent visits by the existing audience are worth having.",
          "YES",
          "Opponents of free entry treat it as proof that the policy failed, which does not follow: a person visiting four times a year instead of once is getting more out of a public collection, and there is nothing wrong with that.",
          "'There is nothing wrong with that'.",
        ),
        ynng(
          "The writer accepts that charging makes visitors value a collection more.",
          "NO",
          "I am not persuaded by this in the museum case.",
          "The writer is 'not persuaded by this'.",
        ),
        ynng(
          "The writer regards the free-entry debate as a distraction from funding levels.",
          "YES",
          "Whether a particular museum charges matters far less than whether the total public money spent on collections is enough and is distributed towards the places that need it, and the free-entry debate has absorbed an enormous amount of attention that would have been better spent on that.",
          "The attention 'would have been better spent' elsewhere.",
        ),
        fromList(
          "matching_sentence_endings",
          MUSEUM_ENDINGS,
          "Removing charges multiplied the audience rather than broadening it,",
          "because the extra visits came from people who were already going.",
          "Surveys taken before and after found that the additional visitors came overwhelmingly from the same social groups that had been visiting already, and that they came more often rather than in greater variety.",
          "The extra visits were repeat visits.",
        ),
        fromList(
          "matching_sentence_endings",
          MUSEUM_ENDINGS,
          "Income taken at the door is worth less than the headline figure,",
          "since a proportion of the money is spent on the act of collecting it.",
          "A museum that charges collects money at the door but spends a significant proportion of it on collecting: staff, barriers, card systems and the administration of concessions.",
          "Collecting the money costs money.",
        ),
        fromList(
          "matching_sentence_endings",
          MUSEUM_ENDINGS,
          "Free entry at the largest museums has a cost paid elsewhere,",
          "because the money comes from a budget that also funds museums elsewhere.",
          "Free entry is expensive, and it is funded from a national budget that also pays for regional museums, which are much more likely to be the only collection within reach of somebody who does not live in a city.",
          "One budget pays for both.",
        ),
        fromList(
          "matching_sentence_endings",
          MUSEUM_ENDINGS,
          "The claim that a price signals value is unconvincing here,",
          "although the collections concerned are the ones people queue to enter.",
          "The collections that are free are precisely the ones people queue in the rain to enter, and the objection seems to be an argument about theory that the observable behaviour does not support.",
          "People queue for the free ones.",
        ),
        fromList(
          "matching_sentence_endings",
          MUSEUM_ENDINGS,
          "The size and distribution of the budget matter more than the door,",
          "which the writer regards as the question the debate has managed to avoid.",
          "Making a principle of the door is a way of avoiding the harder question of the budget.",
          "The door question avoids the budget question.",
        ),
      ],
    },
  ],
};
