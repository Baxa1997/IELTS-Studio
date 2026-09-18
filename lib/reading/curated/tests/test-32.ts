import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, word bank, choose TWO -----

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const WASTE_BANK = [
  "quality",
  "safety",
  "temperature",
  "households",
  "shops",
  "colour",
  "smell",
  "packaging",
  "farms",
  "freezing",
];
const LABEL_STEM = "Which TWO changes to date labels are described in the passage?";
const LABEL_CHANGES = [
  "Some supermarkets have removed 'best before' dates from fresh fruit and vegetables.",
  "Governments have banned the use of 'use by' dates on meat.",
  "Several countries have reduced the number of different label wordings in use.",
  "Labels must now be printed in larger type on every package.",
  "Shops have been told to stop displaying prices near dates.",
];

// ---- Passage 3 · research debate · sentence endings -------------------------

const HABIT_ENDINGS = [
  "because the old response is still stored in the brain.",
  "when the same action is repeated in the same situation.",
  "because the cues that supported the old behaviour are missing.",
  "only if the person is rewarded with money.",
  "after exactly twenty-one days of practice.",
  "because attention is needed for actions that are not yet automatic.",
];

export const TEST_32: CuratedTest = {
  key: "full-test-32",
  targetBand: 5,
  passages: [
    {
      key: "t32-p1-pencil",
      title: "The Stick That Writes",
      topic: "the discovery of graphite at Borrowdale and the invention of the pencil",
      difficulty: 4,
      body: `Sometime in the middle of the sixteenth century, a storm is said to have blown down a tree in Borrowdale, a valley in the north-west of England, exposing a black substance among its roots. Local shepherds found that the material left a dark line on almost any surface, and they began cutting it into strips to mark their sheep. They had stumbled upon the purest deposit of graphite ever found, and one of the few in the world solid enough to be cut and used directly.

Nobody at the time knew what the substance was. It looked like a soft metal, and because it made marks like the lead styluses used by Roman scribes, it was assumed to be a form of lead. It was given the name plumbago, meaning "lead ore", and the mistake has lasted to this day: the core of a pencil is still commonly called its lead, although it contains no lead whatsoever. Graphite is a form of pure carbon, in which the atoms lie in flat sheets that slide easily over one another. That is precisely why it writes: the sheets come away in layers and stick to the paper.

The Borrowdale deposit was immensely valuable. Its graphite was also used to line the moulds in which cannonballs were cast, which made it a material of military interest, and the mine was placed under armed guard. Water was allowed to flood the workings for much of the year, and the mine was opened only for a few weeks at a time. Even so, smuggling was common, and in 1752 Parliament passed an Act making the theft of graphite from the mine a crime punishable by hard labour or transportation to the colonies.

The first pencils were little more than sticks of graphite wrapped in string. Wooden holders came later: a groove was cut into a piece of wood, the graphite was laid inside, and a second piece was glued on top. Cedar became the preferred timber, because it could be sharpened cleanly without splintering. The word pencil itself is older than the object, coming from a Latin word meaning a little brush, which is what a medieval pencil was.

The modern pencil was born out of a war. During the conflicts of the 1790s, France was cut off from English graphite, and the French government asked an engineer named Nicolas-Jacques Conté to find a substitute. In 1795 he patented a process in which powdered graphite of ordinary quality was mixed with clay, shaped into rods and baked in a kiln. The result was not only a way of using poorer graphite; it was an improvement. By varying the proportion of clay, a manufacturer could make the core harder or softer at will. Almost every pencil made since has used Conté's method, and the letters and numbers stamped on a pencil today — HB, 2B, 4H — describe the recipe he made possible.

One further invention completed the object. In 1858 an American named Hymen Lipman was granted a patent for a pencil with a piece of rubber fixed into the end of the wood. He sold the patent for a large sum, but the courts later cancelled it on the grounds that joining two known objects was not a true invention. The idea, however, survived, and the pencil with an eraser on top became standard in the United States, though it is less common in Europe.

Borrowdale's graphite ran out in the nineteenth century, and the mine closed. By then the town of Keswick nearby had become a centre of pencil making, and it still houses a museum devoted to the trade. Its displays run from tiny stubs of the kind once sold to schoolchildren to novelty pencils several metres long, along with the saws, grooving machines and glues that turned a mineral into a writing instrument. The industry itself moved on to places where cheap timber and processed graphite were available, and today most pencils are made in Asia. It is estimated that a single pencil can draw a line many kilometres long, and that billions are still produced every year, which is a remarkable career for a substance that was first used to mark sheep.`,
      questions: [
        tfng(
          "The graphite at Borrowdale was first used for writing on paper.",
          "FALSE",
          "Local shepherds found that the material left a dark line on almost any surface, and they began cutting it into strips to mark their sheep.",
          "Its first use was to 'mark their sheep'.",
        ),
        tfng(
          "The Borrowdale deposit was unusual because its graphite could be used without processing.",
          "TRUE",
          "They had stumbled upon the purest deposit of graphite ever found, and one of the few in the world solid enough to be cut and used directly.",
          "It was 'solid enough to be cut and used directly'.",
        ),
        tfng(
          "Pencil cores have contained small amounts of lead since the sixteenth century.",
          "FALSE",
          'It was given the name plumbago, meaning "lead ore", and the mistake has lasted to this day: the core of a pencil is still commonly called its lead, although it contains no lead whatsoever.',
          "The core 'contains no lead whatsoever'.",
        ),
        tfng(
          "Graphite from Borrowdale had a military use.",
          "TRUE",
          "Its graphite was also used to line the moulds in which cannonballs were cast, which made it a material of military interest, and the mine was placed under armed guard.",
          "It lined cannonball moulds, 'a material of military interest'.",
        ),
        tfng(
          "The mine at Borrowdale operated continuously throughout the year.",
          "FALSE",
          "Water was allowed to flood the workings for much of the year, and the mine was opened only for a few weeks at a time.",
          "It opened 'only for a few weeks at a time'.",
        ),
        tfng(
          "More graphite was stolen from Borrowdale after 1752 than before.",
          "NOT GIVEN",
          "",
          "The 1752 Act is described, but no comparison of theft rates is given.",
        ),
        tfng(
          "Conté's method allowed manufacturers to control how hard a pencil core was.",
          "TRUE",
          "By varying the proportion of clay, a manufacturer could make the core harder or softer at will.",
          "Varying the clay made the core 'harder or softer at will'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Graphite marks paper because its atoms lie in flat ______ that slide apart.",
          "sheets",
          "Graphite is a form of pure carbon, in which the atoms lie in flat sheets that slide easily over one another.",
          "The atoms 'lie in flat sheets'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Thieves caught stealing graphite could be sentenced to hard labour or ______.",
          "transportation",
          "Even so, smuggling was common, and in 1752 Parliament passed an Act making the theft of graphite from the mine a crime punishable by hard labour or transportation to the colonies.",
          "The punishment was 'hard labour or transportation to the colonies'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "______ was chosen for pencil cases because it sharpens without splintering.",
          "Cedar",
          "Cedar became the preferred timber, because it could be sharpened cleanly without splintering.",
          "'Cedar became the preferred timber'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The word pencil comes from a Latin word for a little ______.",
          "brush",
          "The word pencil itself is older than the object, coming from a Latin word meaning a little brush, which is what a medieval pencil was.",
          "It meant 'a little brush'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Conté mixed powdered graphite with ______ before baking it.",
          "clay",
          "In 1795 he patented a process in which powdered graphite of ordinary quality was mixed with clay, shaped into rods and baked in a kiln.",
          "The graphite 'was mixed with clay'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Lipman's patent was cancelled by the ______.",
          "courts",
          "He sold the patent for a large sum, but the courts later cancelled it on the grounds that joining two known objects was not a true invention.",
          "'The courts later cancelled it'.",
        ),
      ],
    },
    {
      key: "t32-p2-food-dates",
      title: "What the Date on the Packet Means",
      topic: "confusing date labels and the effort to cut household food waste",
      difficulty: 5,
      body: `A) About a third of the food produced in the world is never eaten. In poorer countries most of the loss happens before food reaches the shops, in fields, stores and transport. In wealthier countries the pattern is reversed: the largest single source of waste is the home, where food is bought, forgotten and eventually thrown away. Surveys in Europe and North America consistently find that households discard between a fifth and a quarter of the food they buy, and that a large part of what is discarded was still perfectly good to eat.

B) One reason is a small piece of printing that almost nobody reads carefully. Most packaged food carries a date, but the dates do not all mean the same thing. A "use by" date is about safety: it appears on foods such as fresh meat, fish and ready meals, which can become dangerous once they have been kept too long. A "best before" date is about quality only. Biscuits, rice, tinned goods and many fresh fruits and vegetables carry it, and they remain safe long after the date has passed, although they may have lost some of their crispness or flavour.

C) Research suggests that many shoppers treat the two as one. In studies where people were asked what a "best before" date meant, a substantial proportion answered that food became unsafe after it. Older shoppers are generally more confident about judging food for themselves; younger ones, who have grown up with printed dates on everything, are more likely to rely on the label. A third phrase, "sell by", was never intended for customers at all: it is a message to the shop about how long to keep an item on display, yet it appears on packaging that customers read.

D) Some supermarkets have begun to act on this. Several large chains in Britain and elsewhere have removed "best before" dates from fresh fruit and vegetables entirely, on the grounds that customers can see and smell whether a tomato is fit to eat. Others have replaced dates on milk with advice to check by smelling it. A number of countries have also reduced the number of different wordings allowed, so that shoppers meet two clear phrases rather than five vague ones. Early evidence from these changes is encouraging, though it is hard to separate their effect from that of rising food prices, which give shoppers a reason of their own to waste less.

E) Labels are not the only problem. Storage matters too. Many home refrigerators run warmer than they should, which shortens the life of everything inside them, and studies have found that lowering the temperature by a couple of degrees can add days to the life of milk and salad. Freezing, which stops the clock almost completely, is used far less than it could be; many shoppers believe wrongly that food must be frozen on the day it is bought. Large packs and offers that encourage buying more than is needed also play their part. Shoppers are poor judges of how much they will actually cook, and the items thrown away most often — salad, bread, berries, fresh herbs — are precisely the ones bought with the best intentions on the way home from work.

F) Not every solution has worked. Campaigns that simply tell people to waste less food have had limited effect, because almost nobody wastes food on purpose; the waste is the result of ordinary distraction and of buying for the week one plans rather than the week one has. Approaches that change the situation rather than the message have done better: smaller packs, clearer storage advice, apps that let shops sell surplus meals cheaply at the end of the day, and community fridges where unopened food can be left for neighbours.

G) Governments have set themselves a target of halving food waste by 2030, and almost none are on course to meet it. Progress is difficult to judge, because measuring what is thrown away in millions of kitchens is expensive and unpleasant work; the most reliable studies still involve researchers sorting through bins by hand. What is clear is that the waste is not a minor domestic failing. Food that is grown, watered, harvested, chilled, packed and driven across a continent before being thrown away carries all of those costs with it, which is why a date printed on a packet has turned out to matter so much.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison of where food is lost in richer and poorer countries",
          "A",
          "In poorer countries most of the loss happens before food reaches the shops, in fields, stores and transport.",
          "Paragraph A compares losses before the shops with losses at home.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of a phrase that was written for shops rather than shoppers",
          "C",
          'A third phrase, "sell by", was never intended for customers at all: it is a message to the shop about how long to keep an item on display, yet it appears on packaging that customers read.',
          "Paragraph C explains 'sell by'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to equipment in the home being set incorrectly",
          "E",
          "Many home refrigerators run warmer than they should, which shortens the life of everything inside them, and studies have found that lowering the temperature by a couple of degrees can add days to the life of milk and salad.",
          "Paragraph E: fridges 'run warmer than they should'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "examples of measures that change circumstances instead of giving advice",
          "F",
          "Approaches that change the situation rather than the message have done better: smaller packs, clearer storage advice, apps that let shops sell surplus meals cheaply at the end of the day, and community fridges where unopened food can be left for neighbours.",
          "Paragraph F lists the situational measures.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of how difficult it is to measure progress",
          "G",
          "Progress is difficult to judge, because measuring what is thrown away in millions of kitchens is expensive and unpleasant work; the most reliable studies still involve researchers sorting through bins by hand.",
          "Paragraph G: measuring waste means 'sorting through bins by hand'.",
        ),
        pickTwo(
          LABEL_STEM,
          LABEL_CHANGES,
          "A or C",
          'Several large chains in Britain and elsewhere have removed "best before" dates from fresh fruit and vegetables entirely, on the grounds that customers can see and smell whether a tomato is fit to eat.',
          "A is correct: chains have removed 'best before' from fresh produce.",
        ),
        pickTwo(
          LABEL_STEM,
          LABEL_CHANGES,
          "A or C",
          "A number of countries have also reduced the number of different wordings allowed, so that shoppers meet two clear phrases rather than five vague ones.",
          "C is correct: countries 'reduced the number of different wordings'. B, D and E are not mentioned.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "In wealthier countries, most food is wasted in ______.",
          "households",
          "In wealthier countries the pattern is reversed: the largest single source of waste is the home, where food is bought, forgotten and eventually thrown away.",
          "The home is 'the largest single source of waste'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "A 'use by' date is a warning about ______.",
          "safety",
          'A "use by" date is about safety: it appears on foods such as fresh meat, fish and ready meals, which can become dangerous once they have been kept too long.',
          "'Use by' is 'about safety'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "A 'best before' date refers only to ______.",
          "quality",
          'A "best before" date is about quality only.',
          "'Best before' is 'about quality only'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "The phrase 'sell by' was meant for ______.",
          "shops",
          'A third phrase, "sell by", was never intended for customers at all: it is a message to the shop about how long to keep an item on display, yet it appears on packaging that customers read.',
          "It is 'a message to the shop'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "Milk lasts longer if the fridge ______ is lowered.",
          "temperature",
          "Many home refrigerators run warmer than they should, which shortens the life of everything inside them, and studies have found that lowering the temperature by a couple of degrees can add days to the life of milk and salad.",
          "'Lowering the temperature by a couple of degrees can add days'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "______ almost stops food spoiling, but is used less than it could be.",
          "Freezing",
          "Freezing, which stops the clock almost completely, is used far less than it could be; many shoppers believe wrongly that food must be frozen on the day it is bought.",
          "'Freezing, which stops the clock almost completely, is used far less than it could be'.",
        ),
      ],
    },
    {
      key: "t32-p3-habits",
      title: "The Machinery of Habit",
      topic: "what psychology has learned about how habits are formed and broken",
      difficulty: 6,
      body: `A habit is not the same as a decision. When somebody decides to take the stairs, they weigh the effort against the benefit and choose. When somebody habitually takes the stairs, no weighing takes place: the sight of the staircase is enough, and the action follows before any argument about it can begin. Psychologists define a habit as a behaviour that has become linked to a situation so firmly that the situation alone sets it off, and that definition explains most of what is known about how habits are made and unmade.

The learning happens through repetition in a stable context. Each time an action is performed in the same setting and produces a satisfactory result, the link between the setting and the action grows a little stronger. At first the behaviour depends on intention; gradually it comes to depend on the cue. Brain imaging shows the shift clearly: activity moves away from the regions involved in deliberate planning and towards deeper structures associated with routine, which is one reason habitual actions demand so little attention.

How long this takes has been badly misreported. A figure of twenty-one days circulates widely, and it comes from a plastic surgeon's observation in the 1960s that his patients took about three weeks to get used to their changed appearance — not a study of habit formation at all. When researchers finally measured it, asking volunteers to adopt a new daily routine and to report each day whether it felt automatic, the average was around sixty-six days, and the range ran from under three weeks to well over eight months. The variation depended on the person and on the complexity of the behaviour: drinking a glass of water after breakfast became automatic quickly, while doing fifty sit-ups did not.

The practical lessons follow from the definition. Because a habit is triggered by a situation, the most reliable way to build one is to attach it to a situation that already exists. Volunteers who write down exactly when and where they will act — a plan of the form "after I do X, I will do Y" — are considerably more likely to carry out an intention than those who simply resolve to do better, and the effect is largest for behaviours people already want to perform but keep forgetting. Making the cue obvious and the action easy works better than making promises.

Breaking a habit is harder than building one, for a reason that is now reasonably well understood. The old link is not erased when a new behaviour is learned; it is overlaid. Under stress, tiredness or distraction, the earlier response can return, which is why people who have not smoked for years may find the urge returning in a setting they associate with smoking. This is also why moving house, changing jobs or going on holiday are unusually good moments to change: the cues that supported the old behaviour are absent, and for a short period nothing is automatic.

None of this makes habit a substitute for motivation. A habit will not form around something a person does not want to do, and the studies that report high success rates generally involve willing volunteers pursuing goals they chose. But motivation is unreliable in a way that habit is not. Motivation is highest at the moment a resolution is made and declines afterwards, while a habit, once established, requires almost nothing to maintain. The sensible strategy is therefore to use motivation while it lasts to set up the conditions in which a habit can form, rather than to rely on it indefinitely.

Some caution is needed about how far the findings reach. Much of the research involves simple, self-reported behaviours measured over a few months in small samples, and the large, stubborn habits that people most want to change — around food, alcohol, work and sleep — are tangled up with mood, income, housing and the behaviour of everyone else in the household. The idea that anyone can be rebuilt by attaching the right routines to the right cues oversells a real but modest effect. What the science does support is quieter and more useful: that the environment does much of the work people imagine is done by willpower, and that redesigning the environment is usually the more effective place to begin.`,
      questions: [
        mcq(
          "How does the writer distinguish a habit from a decision?",
          [
            "A habit produces better results than a decision.",
            "A habit is set off by a situation rather than by weighing up options.",
            "A decision is always slower to carry out than a habit.",
            "A habit is formed only when somebody is being watched.",
          ],
          "A habit is set off by a situation rather than by weighing up options.",
          "Psychologists define a habit as a behaviour that has become linked to a situation so firmly that the situation alone sets it off, and that definition explains most of what is known about how habits are made and unmade.",
          "In a habit 'the situation alone sets it off'.",
        ),
        mcq(
          "What does brain imaging show as a behaviour becomes habitual?",
          [
            "Activity spreads evenly across the whole brain.",
            "Activity moves from planning regions to deeper structures.",
            "Activity in the brain steadily increases.",
            "Activity stops in the regions linked with reward.",
          ],
          "Activity moves from planning regions to deeper structures.",
          "Brain imaging shows the shift clearly: activity moves away from the regions involved in deliberate planning and towards deeper structures associated with routine, which is one reason habitual actions demand so little attention.",
          "Activity 'moves away from the regions involved in deliberate planning'.",
        ),
        mcq(
          "What does the writer say about the figure of twenty-one days?",
          [
            "It came from a study of people forming new habits.",
            "It applies only to simple physical routines.",
            "It originated in an observation that was not about habits.",
            "It was an average produced by recent research.",
          ],
          "It originated in an observation that was not about habits.",
          "A figure of twenty-one days circulates widely, and it comes from a plastic surgeon's observation in the 1960s that his patients took about three weeks to get used to their changed appearance — not a study of habit formation at all.",
          "It was 'not a study of habit formation at all'.",
        ),
        mcq(
          "Which behaviour does the writer give as one that became automatic quickly?",
          [
            "doing fifty sit-ups",
            "drinking water after breakfast",
            "taking the stairs at work",
            "writing a daily plan",
          ],
          "drinking water after breakfast",
          "The variation depended on the person and on the complexity of the behaviour: drinking a glass of water after breakfast became automatic quickly, while doing fifty sit-ups did not.",
          "Drinking water 'became automatic quickly'.",
        ),
        fromList(
          "matching_sentence_endings",
          HABIT_ENDINGS,
          "A link between a situation and an action grows stronger",
          "when the same action is repeated in the same situation.",
          "Each time an action is performed in the same setting and produces a satisfactory result, the link between the setting and the action grows a little stronger.",
          "The link strengthens with repetition 'in the same setting'.",
        ),
        fromList(
          "matching_sentence_endings",
          HABIT_ENDINGS,
          "Habitual actions need very little attention",
          "because attention is needed for actions that are not yet automatic.",
          "Brain imaging shows the shift clearly: activity moves away from the regions involved in deliberate planning and towards deeper structures associated with routine, which is one reason habitual actions demand so little attention.",
          "Deliberate planning is what demands attention; routine does not.",
        ),
        fromList(
          "matching_sentence_endings",
          HABIT_ENDINGS,
          "An old habit can return under stress",
          "because the old response is still stored in the brain.",
          "The old link is not erased when a new behaviour is learned; it is overlaid.",
          "The old link 'is not erased… it is overlaid'.",
        ),
        fromList(
          "matching_sentence_endings",
          HABIT_ENDINGS,
          "Moving house is a good moment to change a behaviour",
          "because the cues that supported the old behaviour are missing.",
          "This is also why moving house, changing jobs or going on holiday are unusually good moments to change: the cues that supported the old behaviour are absent, and for a short period nothing is automatic.",
          "Moving removes the cues, so 'for a short period nothing is automatic'.",
        ),
        ynng(
          "The writer accepts that the twenty-one-day figure is a reasonable estimate.",
          "NO",
          "When researchers finally measured it, asking volunteers to adopt a new daily routine and to report each day whether it felt automatic, the average was around sixty-six days, and the range ran from under three weeks to well over eight months.",
          "The measured average was far longer and highly variable.",
        ),
        ynng(
          "The writer thinks written plans naming a time and place are worth using.",
          "YES",
          'Volunteers who write down exactly when and where they will act — a plan of the form "after I do X, I will do Y" — are considerably more likely to carry out an intention than those who simply resolve to do better, and the effect is largest for behaviours people already want to perform but keep forgetting.',
          "Such plans make people 'considerably more likely to carry out an intention'.",
        ),
        ynng(
          "The writer believes habit can replace motivation entirely.",
          "NO",
          "A habit will not form around something a person does not want to do, and the studies that report high success rates generally involve willing volunteers pursuing goals they chose.",
          "Habit 'will not form around something a person does not want to do'.",
        ),
        ynng(
          "The writer considers claims that anyone can be remade by routines to be overstated.",
          "YES",
          "The idea that anyone can be rebuilt by attaching the right routines to the right cues oversells a real but modest effect.",
          "It 'oversells a real but modest effect'.",
        ),
        ynng(
          "The writer regards changing the environment as a better starting point than willpower.",
          "YES",
          "What the science does support is quieter and more useful: that the environment does much of the work people imagine is done by willpower, and that redesigning the environment is usually the more effective place to begin.",
          "Redesigning the environment is 'the more effective place to begin'.",
        ),
        ynng(
          "The writer states that habit research has been funded mainly by health organisations.",
          "NOT GIVEN",
          "",
          "Nothing is said about who funds the research.",
        ),
      ],
    },
  ],
};
