import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, word bank, choose TWO ----

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const RIVER_BANK = [
  "sediment",
  "salmon",
  "silt",
  "repair",
  "beaches",
  "weeks",
  "licences",
  "reservoir",
  "insurance",
  "gravel",
];
const DAM_STEM = "Which TWO arguments against removing a dam are described in the passage?";
const DAM_ARGUMENTS = [
  "people who live beside the reservoir do not want to lose it",
  "removal always costs more than repairing the structure",
  "the sediment released can smother habitat downstream",
  "rivers cannot recover once a dam has been in place for decades",
  "fish are unable to travel upstream without a concrete channel",
];

// ---- Passage 3 · research debate · sentence endings ------------------------

const GUT_ENDINGS = [
  "because the animals were raised without any microbes at all.",
  "when the bacteria of one strain of mouse were transferred to another.",
  "because people with depression often eat and exercise differently.",
  "when the same species was found in every healthy volunteer.",
  "because the nerve carries signals from the gut to the brain.",
  "when trials were small and their results were selectively reported.",
];

export const TEST_44: CuratedTest = {
  key: "full-test-44",
  targetBand: 7,
  passages: [
    {
      key: "t44-p1-nutmeg",
      title: "The Islands That Grew the Spice",
      topic: "how a single group of islands supplied the world with nutmeg",
      difficulty: 6,
      body: `For most of recorded history, every nutmeg in the world came from one small group of volcanic islands in the eastern part of what is now Indonesia. The Banda Islands cover a few dozen square kilometres in total, and until the nineteenth century they were the only place where the nutmeg tree grew in any quantity. The tree produces a fruit containing a seed — the nutmeg — wrapped in a red web that is dried separately and sold as mace, so a single harvest yielded two spices, both of which reached Europe at extraordinary prices.

The Bandanese traded them long before Europeans arrived, exchanging spices for rice, cloth and metal with merchants from Java, China and the Arab world. From there the cargo passed through many hands. By the time nutmeg reached a market in Venice or Antwerp, it had crossed several oceans and been resold a dozen times, and its origin was a commercial secret that European buyers had no way of checking. Medieval physicians prescribed it against plague, which did nothing, and cooks used it in everything, which did more.

The Portuguese reached the islands in 1512 and traded there without controlling them. The Dutch East India Company, arriving at the end of the century, had a different intention. Its officers understood that the value of the spice depended entirely on its scarcity, and that scarcity could be manufactured if one company held every tree. The Bandanese, who were accustomed to selling to whoever offered the best terms, signed agreements they regarded as commercial and the company regarded as binding, and refused to be held to exclusivity.

What followed in 1621 was among the most brutal episodes of the early colonial period. A Dutch expedition took the islands by force, and the Bandanese population — some fifteen thousand people — was destroyed within months by killing, starvation and deportation; a few hundred survived in the hills or escaped to neighbouring islands. The company divided the groves into plantations, handed them to its own colonists and imported enslaved labour, some of it Bandanese, to do the work. The monopoly this created lasted for the better part of two centuries.

Holding it required constant effort. Company patrols destroyed nutmeg trees growing outside the controlled islands, and the seeds exported were dipped in lime with the intention of preventing them from germinating elsewhere. Smuggling was punished savagely. One island in the group, Run, was held by the English, and the dispute over it was settled in 1667 by a treaty in which the English gave up their claim in exchange for another small colony on the other side of the world — a settlement on Manhattan island, which had been taken from the Dutch a few years before. The exchange is often described as a bad bargain for the Dutch, which is easy to say afterwards and was not obvious at the time.

The monopoly ended, as such things usually do, through theft and biology. In the 1770s a French administrator smuggled seedlings out of the region and established them in Mauritius, from which they spread to other tropical colonies. The British, who occupied the Banda Islands during the wars that followed, moved trees to Ceylon, Penang and the Caribbean island of Grenada. Nutmeg grew perfectly well in all of them. Within a few decades the price had fallen to a level at which no monopoly was worth maintaining, and the spice became an ordinary grocery.

The spice itself turned out to be less remarkable than its reputation. Nutmeg contains a compound that is mildly intoxicating in large doses and unpleasantly poisonous in larger ones, which accounts for a persistent folklore about it, and it has no medical value worth the name. What it has is a flavour that suits milk, potatoes, pastry and mulled wine, and a history out of all proportion to that modest role.

Grenada now produces a substantial share of the world's supply, and puts a nutmeg on its flag. The Banda Islands are quiet places, visited mainly by divers, where the groves still stand among the ruins of the plantation houses. The tree itself was never the point. What made it worth an empire was a monopoly on something that could not, at the time, be grown anywhere else — and the whole structure collapsed the moment that stopped being true.`,
      questions: [
        tfng(
          "The Banda Islands were the only significant source of nutmeg until the nineteenth century.",
          "TRUE",
          "The Banda Islands cover a few dozen square kilometres in total, and until the nineteenth century they were the only place where the nutmeg tree grew in any quantity.",
          "They were 'the only place where the nutmeg tree grew in any quantity'.",
        ),
        tfng(
          "Mace and nutmeg come from different trees.",
          "FALSE",
          "The tree produces a fruit containing a seed — the nutmeg — wrapped in a red web that is dried separately and sold as mace, so a single harvest yielded two spices, both of which reached Europe at extraordinary prices.",
          "Both come from one fruit on the same tree.",
        ),
        tfng(
          "European buyers knew exactly where nutmeg was grown.",
          "FALSE",
          "By the time nutmeg reached a market in Venice or Antwerp, it had crossed several oceans and been resold a dozen times, and its origin was a commercial secret that European buyers had no way of checking.",
          "Its origin 'was a commercial secret'.",
        ),
        tfng(
          "The Portuguese established political control over the Banda Islands.",
          "FALSE",
          "The Portuguese reached the islands in 1512 and traded there without controlling them.",
          "They traded 'without controlling them'.",
        ),
        tfng(
          "The Bandanese understood their agreements with the Dutch company differently from the company itself.",
          "TRUE",
          "The Bandanese, who were accustomed to selling to whoever offered the best terms, signed agreements they regarded as commercial and the company regarded as binding, and refused to be held to exclusivity.",
          "The two sides regarded the agreements differently.",
        ),
        tfng(
          "Nutmeg trees planted outside the islands failed to thrive.",
          "FALSE",
          "Nutmeg grew perfectly well in all of them.",
          "It 'grew perfectly well' elsewhere.",
        ),
        tfng(
          "Grenada exports more nutmeg today than Indonesia does.",
          "NOT GIVEN",
          "",
          "Grenada's share is described as substantial, but no comparison is made.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The red web around the seed is dried and sold as ______.",
          "mace",
          "The tree produces a fruit containing a seed — the nutmeg — wrapped in a red web that is dried separately and sold as mace, so a single harvest yielded two spices, both of which reached Europe at extraordinary prices.",
          "It is 'sold as mace'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Medieval physicians prescribed nutmeg against ______.",
          "plague",
          "Medieval physicians prescribed it against plague, which did nothing, and cooks used it in everything, which did more.",
          "They 'prescribed it against plague'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The company understood that the spice's value depended on its ______.",
          "scarcity",
          "Its officers understood that the value of the spice depended entirely on its scarcity, and that scarcity could be manufactured if one company held every tree.",
          "It 'depended entirely on its scarcity'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Exported seeds were dipped in ______ to stop them growing.",
          "lime",
          "Company patrols destroyed nutmeg trees growing outside the controlled islands, and the seeds exported were dipped in lime with the intention of preventing them from germinating elsewhere.",
          "They 'were dipped in lime'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In 1667 the English gave up the island of ______ by treaty.",
          "Run",
          "One island in the group, Run, was held by the English, and the dispute over it was settled in 1667 by a treaty in which the English gave up their claim in exchange for another small colony on the other side of the world — a settlement on Manhattan island, which had been taken from the Dutch a few years before.",
          "The island was Run.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In the 1770s seedlings were smuggled to ______.",
          "Mauritius",
          "In the 1770s a French administrator smuggled seedlings out of the region and established them in Mauritius, from which they spread to other tropical colonies.",
          "They were established 'in Mauritius'.",
        ),
      ],
    },
    {
      key: "t44-p2-dam-removal",
      title: "Letting the River Go",
      topic: "the movement to take down obsolete dams",
      difficulty: 7,
      body: `A) The United States contains something like ninety thousand dams of significant size, and a large proportion of them are old. Many were built to power mills that closed a century ago, to supply towns that now draw water from elsewhere, or to hold back sediment for reasons nobody has recorded. They silt up, their spillways decay, and the cost of bringing an ageing structure up to modern safety standards frequently exceeds the cost of taking it out. Roughly two thousand have been removed, most of them in the last thirty years, and the rate is rising.

B) The case for removal is rarely about nature alone. A dam owner facing an order to repair a structure that produces no revenue does the arithmetic and often finds that demolition is cheaper, and that it ends the liability permanently. Insurers have become less willing to cover old dams. Where a structure does still generate electricity, the calculation changes, but many of the dams under discussion produce trivial amounts of power by modern standards, and the cost of the fish passes now required can exceed the value of what they generate.

C) What happens afterwards has surprised even the people who campaigned for it. On a river in the north-west of the United States, two large dams were taken down over three years, opening more than a hundred kilometres of river that salmon had not reached since before the First World War. Fish appeared above the former dam sites within months, not the decades that had been predicted, and the beaches at the river mouth, starved of material for a century, began to rebuild as the sediment held behind the dams washed down.

D) That sediment is the central technical problem. A reservoir that has stood for eighty years may hold millions of cubic metres of accumulated silt, and releasing it all at once can smother the gravel beds downstream that fish spawn in, block irrigation intakes and kill insects and shellfish. Engineers manage it in one of three ways: taking the dam down in stages over several seasons so the river carries the load away gradually; dredging the worst of it out first, which is expensive; or, where the material is contaminated by old industry, removing and disposing of it as waste, which is more expensive still. The choice determines most of the cost of a project.

E) The largest scheme so far concerned four dams on a river running through the border country of the western United States, taken out under an agreement involving tribal nations, power companies, farmers and two state governments after twenty years of negotiation. Salmon were recorded above the former dam sites within weeks of the river reopening. The negotiation, rather than the demolition, was the hard part: the dams supplied a small amount of electricity, the reservoirs supported a community of lakeside residents, and the fish were central to the culture and treaty rights of the peoples living along the river.

F) Objections are not all sentimental. People who bought houses beside a reservoir did so for the view and the boating, and a river valley returning to mud and willow scrub for several seasons is not what they were promised. Recreation businesses lose custom. There are cases where a dam holds back water that a town depends on in summer, and cases where the reservoir has become habitat for species that would themselves be displaced. Restoration is not the undoing of a change; it is another change, with its own winners and losers. Schemes that acknowledge this early, and that budget for the losses as well as the demolition, run into far less opposition than those that present the work as a simple return to nature.

G) Europe has moved in the same direction more recently and with a different emphasis, focused on the tens of thousands of small weirs, sluices and culverts that block migration on rivers where nobody now remembers what they were for. A regional target to reopen twenty-five thousand kilometres of free-flowing river by 2030 has produced a steady programme of small removals, each of which is cheap, quick and individually invisible. The ecological return from taking out a two-metre weir that nobody uses is, per euro spent, better than almost anything else available, which is an unglamorous fact that has done more for river restoration than any single famous project.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the financial reasoning of an owner facing repair costs",
          "B",
          "A dam owner facing an order to repair a structure that produces no revenue does the arithmetic and often finds that demolition is cheaper, and that it ends the liability permanently.",
          "Paragraph B: demolition is cheaper and ends the liability.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a recovery that happened faster than predicted",
          "C",
          "Fish appeared above the former dam sites within months, not the decades that had been predicted, and the beaches at the river mouth, starved of material for a century, began to rebuild as the sediment held behind the dams washed down.",
          "Paragraph C: months rather than decades.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "three approaches to a single engineering difficulty",
          "D",
          "Engineers manage it in one of three ways: taking the dam down in stages over several seasons so the river carries the load away gradually; dredging the worst of it out first, which is expensive; or, where the material is contaminated by old industry, removing and disposing of it as waste, which is more expensive still.",
          "Paragraph D lists the three sediment strategies.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the point that agreement took far longer than the work itself",
          "E",
          "The negotiation, rather than the demolition, was the hard part: the dams supplied a small amount of electricity, the reservoirs supported a community of lakeside residents, and the fish were central to the culture and treaty rights of the peoples living along the river.",
          "Paragraph E: 'The negotiation… was the hard part.'",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an argument that small projects give the best value",
          "G",
          "The ecological return from taking out a two-metre weir that nobody uses is, per euro spent, better than almost anything else available, which is an unglamorous fact that has done more for river restoration than any single famous project.",
          "Paragraph G: small weirs give the best return per euro.",
        ),
        pickTwo(
          DAM_STEM,
          DAM_ARGUMENTS,
          "A or C",
          "People who bought houses beside a reservoir did so for the view and the boating, and a river valley returning to mud and willow scrub for several seasons is not what they were promised.",
          "A is described: lakeside residents lose what they bought.",
        ),
        pickTwo(
          DAM_STEM,
          DAM_ARGUMENTS,
          "A or C",
          "A reservoir that has stood for eighty years may hold millions of cubic metres of accumulated silt, and releasing it all at once can smother the gravel beds downstream that fish spawn in, block irrigation intakes and kill insects and shellfish.",
          "C is described: released silt can smother spawning gravel. B, D and E contradict the passage.",
        ),
        fromList(
          "summary_completion",
          RIVER_BANK,
          "Many old dams silt up and eventually need expensive ______.",
          "repair",
          "They silt up, their spillways decay, and the cost of bringing an ageing structure up to modern safety standards frequently exceeds the cost of taking it out.",
          "The cost of bringing them up to standard — of repair — exceeds removal.",
        ),
        fromList(
          "summary_completion",
          RIVER_BANK,
          "______ companies have grown reluctant to cover ageing structures.",
          "Insurance",
          "Insurers have become less willing to cover old dams.",
          "'Insurers have become less willing to cover old dams.'",
        ),
        fromList(
          "summary_completion",
          RIVER_BANK,
          "After the north-western removals, ______ returned above the dam sites within months.",
          "salmon",
          "On a river in the north-west of the United States, two large dams were taken down over three years, opening more than a hundred kilometres of river that salmon had not reached since before the First World War.",
          "It was salmon that had been shut out, and fish appeared within months.",
        ),
        fromList(
          "summary_completion",
          RIVER_BANK,
          "Coastal ______ began to rebuild once the trapped material washed down.",
          "beaches",
          "Fish appeared above the former dam sites within months, not the decades that had been predicted, and the beaches at the river mouth, starved of material for a century, began to rebuild as the sediment held behind the dams washed down.",
          "'The beaches at the river mouth… began to rebuild'.",
        ),
        fromList(
          "summary_completion",
          RIVER_BANK,
          "Released ______ can block irrigation intakes and kill shellfish.",
          "silt",
          "A reservoir that has stood for eighty years may hold millions of cubic metres of accumulated silt, and releasing it all at once can smother the gravel beds downstream that fish spawn in, block irrigation intakes and kill insects and shellfish.",
          "The accumulated silt does the damage.",
        ),
        fromList(
          "summary_completion",
          RIVER_BANK,
          "At the largest scheme, fish were recorded above the sites within ______.",
          "weeks",
          "Salmon were recorded above the former dam sites within weeks of the river reopening.",
          "They were recorded 'within weeks'.",
        ),
      ],
    },
    {
      key: "t44-p3-gut-brain",
      title: "The Bacteria in the Argument",
      topic: "how far gut microbes influence mood and behaviour",
      difficulty: 8,
      body: `The human gut contains a community of bacteria, fungi and viruses numbering in the tens of trillions, and over the past twenty years it has been implicated in almost everything: obesity, allergy, autoimmunity, sleep, ageing and, most eye-catchingly, mood. The proposition that the bacteria in a person's intestine influence how that person feels has produced a large scientific literature, an enormous commercial one, and a gap between the two that is worth examining carefully.

The biological pathways are real and reasonably well mapped. The gut and the brain are connected directly by the vagus nerve, which carries far more signals upward than down. Gut bacteria produce and consume compounds that circulate in the blood, including short-chain fatty acids from fibre fermentation and precursors of neurotransmitters. They also shape the immune system, and immune signalling molecules act on the brain. There is no mystery about whether the gut can communicate with the brain; it plainly does.

The striking experimental results come from mice. Animals raised in sterile conditions, with no microbes at all, develop abnormal stress responses and altered social behaviour, both of which can be partly corrected by giving them a normal microbial community early in life. More dramatically, transferring the gut bacteria of a bold strain of mouse into a timid one shifts the recipient's behaviour towards boldness, and the reverse also holds. Similar transfers using bacteria from humans with depression have been reported to produce depression-like behaviour in rodents, which is a sentence that requires some care: what is measured is how long an animal struggles in a tank of water, not its state of mind.

Human evidence is where the difficulty starts. Studies comparing the gut communities of people with and without depression find consistent differences — certain bacterial groups are less abundant in people who are depressed, a result that has held up across several large population studies. What such studies cannot establish is direction. Depression changes what people eat, how much they move, how well they sleep and what medication they take, and every one of those reshapes the gut community. A difference in bacteria may be a consequence of the illness rather than a cause.

Trials of probiotics intended to improve mood — sometimes marketed as psychobiotics — have produced small positive effects in meta-analyses, but the individual studies are mostly small, short and conducted by teams with an interest in the outcome, and the pattern of results is the one that usually precedes an effect shrinking towards nothing as larger trials appear. Faecal transplantation, which reliably works for one specific intestinal infection, has been tried for other conditions with mixed results and carries real risks; at least one death has been attributed to transferring a resistant organism.

There is also a measurement problem that is easy to overlook. Most studies identify bacteria by sequencing genetic material in a stool sample, which describes the community at the end of the gut on the day the sample was taken, and which may bear little relation to what is happening further up, where most of the interaction with the body occurs. Two samples from the same person in the same week can differ noticeably.

The commercial sector has not waited. Supplements, testing kits and diets promising to optimise the microbiome are sold on the strength of the mouse studies and the human correlations, generally without mentioning either the small effect sizes or the fact that the composition of a healthy gut varies so widely between individuals that there is no agreed standard to compare a test result against.

None of this means the field is empty. It means it is early, and that the honest summary is uncomfortable for everybody: a mechanism that certainly exists, animal evidence that is strong but of uncertain relevance, human evidence that is consistent but correlational, and interventions that are plausible but unproven. The people best served by that summary are patients, who are currently being offered products on the basis of the first two and told nothing about the last two. Diet affects the gut community substantially and is worth attending to on grounds that have nothing to do with bacteria. Whether adjusting those bacteria deliberately will one day treat a mood disorder is an open question, and treating it as settled helps nobody except the people selling the answer.`,
      questions: [
        mcq(
          "What does the writer say about the gut-brain connection?",
          [
            "It has not been demonstrated.",
            "It exists through several well-mapped pathways.",
            "It works only in one direction.",
            "It depends on a single nerve.",
          ],
          "It exists through several well-mapped pathways.",
          "The biological pathways are real and reasonably well mapped.",
          "The pathways are 'real and reasonably well mapped'.",
        ),
        mcq(
          "Why does the writer add a caution about the rodent transfer studies?",
          [
            "The transfers rarely succeed.",
            "What is measured is behaviour in a test, not a mental state.",
            "The mice were not genetically similar.",
            "The results have never been repeated.",
          ],
          "What is measured is behaviour in a test, not a mental state.",
          "Similar transfers using bacteria from humans with depression have been reported to produce depression-like behaviour in rodents, which is a sentence that requires some care: what is measured is how long an animal struggles in a tank of water, not its state of mind.",
          "The measure is 'how long an animal struggles in a tank of water'.",
        ),
        mcq(
          "What limits the human studies comparing gut communities?",
          [
            "They involve too few people.",
            "They cannot show whether the difference is cause or consequence.",
            "They rely on self-reported symptoms.",
            "They have produced inconsistent findings.",
          ],
          "They cannot show whether the difference is cause or consequence.",
          "What such studies cannot establish is direction.",
          "They 'cannot establish… direction'.",
        ),
        mcq(
          "What is the writer's view of microbiome products now on sale?",
          [
            "They are effective but expensive.",
            "They are sold without acknowledging how weak the evidence is.",
            "They should be available only on prescription.",
            "They work for some conditions but not for mood.",
          ],
          "They are sold without acknowledging how weak the evidence is.",
          "Supplements, testing kits and diets promising to optimise the microbiome are sold on the strength of the mouse studies and the human correlations, generally without mentioning either the small effect sizes or the fact that the composition of a healthy gut varies so widely between individuals that there is no agreed standard to compare a test result against.",
          "They are sold 'without mentioning… the small effect sizes'.",
        ),
        fromList(
          "matching_sentence_endings",
          GUT_ENDINGS,
          "Sterile-raised mice show abnormal stress responses",
          "because the animals were raised without any microbes at all.",
          "Animals raised in sterile conditions, with no microbes at all, develop abnormal stress responses and altered social behaviour, both of which can be partly corrected by giving them a normal microbial community early in life.",
          "They were raised 'with no microbes at all'.",
        ),
        fromList(
          "matching_sentence_endings",
          GUT_ENDINGS,
          "Boldness and timidity were exchanged between animals",
          "when the bacteria of one strain of mouse were transferred to another.",
          "More dramatically, transferring the gut bacteria of a bold strain of mouse into a timid one shifts the recipient's behaviour towards boldness, and the reverse also holds.",
          "The transfer moved the behaviour with the bacteria.",
        ),
        fromList(
          "matching_sentence_endings",
          GUT_ENDINGS,
          "Differences in gut bacteria may be a result of illness",
          "because people with depression often eat and exercise differently.",
          "Depression changes what people eat, how much they move, how well they sleep and what medication they take, and every one of those reshapes the gut community.",
          "Diet, movement, sleep and medication all reshape the community.",
        ),
        fromList(
          "matching_sentence_endings",
          GUT_ENDINGS,
          "Probiotic trials may be reporting an effect that will disappear",
          "when trials were small and their results were selectively reported.",
          "Trials of probiotics intended to improve mood — sometimes marketed as psychobiotics — have produced small positive effects in meta-analyses, but the individual studies are mostly small, short and conducted by teams with an interest in the outcome, and the pattern of results is the one that usually precedes an effect shrinking towards nothing as larger trials appear.",
          "Small studies with interested authors precede shrinking effects.",
        ),
        ynng(
          "The writer doubts that gut bacteria can communicate with the brain at all.",
          "NO",
          "There is no mystery about whether the gut can communicate with the brain; it plainly does.",
          "'It plainly does.'",
        ),
        ynng(
          "The writer regards the mouse evidence as strong within its own terms.",
          "YES",
          "It means it is early, and that the honest summary is uncomfortable for everybody: a mechanism that certainly exists, animal evidence that is strong but of uncertain relevance, human evidence that is consistent but correlational, and interventions that are plausible but unproven.",
          "'Animal evidence that is strong but of uncertain relevance'.",
        ),
        ynng(
          "The writer thinks faecal transplantation is safe for treating mood disorders.",
          "NO",
          "Faecal transplantation, which reliably works for one specific intestinal infection, has been tried for other conditions with mixed results and carries real risks; at least one death has been attributed to transferring a resistant organism.",
          "It 'carries real risks'.",
        ),
        ynng(
          "The writer believes testing kits can identify an ideal gut community.",
          "NO",
          "Supplements, testing kits and diets promising to optimise the microbiome are sold on the strength of the mouse studies and the human correlations, generally without mentioning either the small effect sizes or the fact that the composition of a healthy gut varies so widely between individuals that there is no agreed standard to compare a test result against.",
          "'There is no agreed standard to compare a test result against'.",
        ),
        ynng(
          "The writer considers diet worth attending to for reasons beyond the microbiome.",
          "YES",
          "Diet affects the gut community substantially and is worth attending to on grounds that have nothing to do with bacteria.",
          "It is 'worth attending to on grounds that have nothing to do with bacteria'.",
        ),
        ynng(
          "The writer predicts that microbiome treatments for depression will be approved within five years.",
          "NOT GIVEN",
          "",
          "The writer calls it an open question and gives no timetable.",
        ),
      ],
    },
  ],
};
