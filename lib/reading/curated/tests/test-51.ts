import { fromList, gapFill, mcq, noteLine, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · postal history · notes box --------------------------------

const OLD_SYSTEM = {
  title: "The charging system before 1840",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · water technology · people, word bank, choose TWO ----------

const FOG_PEOPLE = ["Elena Ruiz-Marín", "Tomás Belmar", "Aziza Bennani", "Kenji Harada"];
const FOG_BANK = [
  "wind",
  "altitude",
  "mesh",
  "gravity",
  "salt",
  "maintenance",
  "roofs",
  "pipeline",
  "sunlight",
];
const FOG_STEM = "Which TWO conditions does the passage say a fog-collection site must have?";
const FOG_OPTIONS = [
  "fog that arrives on most days of the year",
  "a steady wind that carries the fog through the net",
  "an annual rainfall below 50 millimetres",
  "a population of fewer than 500 people",
  "an existing pipeline to the nearest town",
];

// ---- Passage 3 · behavioural ecology debate · lettered paragraphs ----------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const STRIPE_ENDINGS = [
  "because the pattern matches where biting flies are most common.",
  "although the animals it was tested on were not zebras.",
  "even though no difference in body temperature was found.",
  "because zebras can recognise each other by scent instead.",
  "which suggests the flies simply fail to slow down in time.",
  "despite the fact that lions hunt mainly in poor light.",
  "which the earliest writers on the question had already assumed.",
];

export const TEST_51: CuratedTest = {
  key: "full-test-51",
  targetBand: 6,
  passages: [
    {
      key: "t51-p1-penny-post",
      title: "The Cheapest Letter in the World",
      topic: "how a flat prepaid postage rate changed who could write to whom",
      difficulty: 5,
      body: `For most of the nineteenth century's first four decades, the cost of sending a letter in Britain was paid not by the sender but by the person who received it, and it was calculated in a way that few people could predict in advance. The charge depended on the distance the letter had travelled and on the number of sheets of paper it contained; an envelope counted as a sheet, which is why letters were folded and sealed rather than enclosed. A single sheet carried three hundred miles could cost more than a farm labourer earned in a day.

The system produced the behaviour any such system produces. Recipients who could not pay simply refused the letter at the door, and the Post Office had then carried it for nothing. Those who could not afford to correspond at all developed ways of sending news without paying: a pattern of marks on the outside of the cover, read and understood by a relative who then declined delivery, passed a message for free. Members of Parliament held the privilege of franking, which allowed them to send letters without charge, and the privilege was lent to friends, traded and abused on a scale that embarrassed the service.

Rowland Hill was a schoolmaster with an interest in administration rather than a postal official, and the pamphlet he published in 1837 made an argument that was arithmetic rather than sentiment. He had examined the accounts and concluded that the actual cost of carrying a letter from London to Edinburgh — the coach, the horses, the sorting — amounted to a small fraction of a penny. Almost the entire expense of the service lay in working out what each letter should cost and then collecting that sum at the door. Abolish the calculation and the collection, he argued, and the service could charge a single low price everywhere and still pay for itself, because the volume of letters would rise enormously.

His proposal had two parts, and the second is the one the world remembers. The first was the uniform rate: one penny for a letter of up to half an ounce, carried anywhere in the United Kingdom, regardless of distance. The second was prepayment, and prepayment required proof that payment had been made. Hill suggested a small piece of paper, printed and gummed on the back, which the sender would buy and stick to the letter. The Post Office issued the first of them in May 1840, printed in black with the profile of the young queen.

Opposition within the service was severe. The Postmaster General described the plan as wild and extraordinary, and senior officials predicted that revenue would collapse and the mail coaches would be overwhelmed. Both predictions were partly right. Revenue did fall, and it took more than twenty years for postal income to return to the level of 1839. The volume of letters, however, behaved exactly as Hill had said it would. In 1839 the service carried about seventy-six million letters; in the first full year of the penny rate it carried one hundred and sixty-nine million, and by 1850 the figure had passed three hundred and forty million.

What that growth meant socially is harder to measure but easy to illustrate. Correspondence stopped being an occasional expense and became a habit. Businesses could write to customers they had never met. Families separated by migration to the industrial towns could keep in contact on a clerk's wages. The printed circular and the mail-order catalogue both followed, and with them the expectation that a message could reach anyone, anywhere in the country, for a price that did not depend on where they lived.

The idea travelled faster than the objections had. Switzerland and Brazil issued adhesive stamps in 1843 and the United States in 1847, and by the 1870s the principle of a uniform prepaid rate had been extended across borders by treaty. The stamp itself became the standard proof of prepayment everywhere, and Britain, as the first country to issue one, retains the privilege of being the only one whose stamps carry no country name.

It would be wrong, though, to credit the reform with everything that followed it. Two other changes were working in the same direction at the same time. The railway network, which barely existed in 1830, carried the mail by the 1840s at speeds no coach could approach, and the spread of elementary schooling steadily increased the number of people who could write a letter worth sending. Historians who have tried to separate these effects generally conclude that the penny post accelerated a rise in correspondence that literacy and the railways had already begun. Hill's contribution was not to invent the demand but to remove the obstacle that had been suppressing it, and to prove, against the settled opinion of the people who ran the service, that a lower price could produce a larger business.`,
      questions: [
        tfng(
          "Before 1840 the person receiving a letter usually paid for it.",
          "TRUE",
          "For most of the nineteenth century's first four decades, the cost of sending a letter in Britain was paid not by the sender but by the person who received it, and it was calculated in a way that few people could predict in advance.",
          "The cost was 'paid not by the sender but by the person who received it'.",
        ),
        tfng(
          "Using an envelope increased the price of a letter.",
          "TRUE",
          "The charge depended on the distance the letter had travelled and on the number of sheets of paper it contained; an envelope counted as a sheet, which is why letters were folded and sealed rather than enclosed.",
          "'An envelope counted as a sheet', and sheets were charged for.",
        ),
        tfng(
          "The Post Office was paid for letters that were refused at the door.",
          "FALSE",
          "Recipients who could not pay simply refused the letter at the door, and the Post Office had then carried it for nothing.",
          "It 'had then carried it for nothing'.",
        ),
        tfng(
          "Rowland Hill was employed by the Post Office when he wrote his pamphlet.",
          "FALSE",
          "Rowland Hill was a schoolmaster with an interest in administration rather than a postal official, and the pamphlet he published in 1837 made an argument that was arithmetic rather than sentiment.",
          "He was 'a schoolmaster … rather than a postal official'.",
        ),
        tfng(
          "Hill found that carrying a letter was the largest cost the service faced.",
          "FALSE",
          "Almost the entire expense of the service lay in working out what each letter should cost and then collecting that sum at the door.",
          "The expense lay in calculation and collection, not carriage.",
        ),
        tfng(
          "Senior postal officials expected Hill's plan to reduce revenue.",
          "TRUE",
          "The Postmaster General described the plan as wild and extraordinary, and senior officials predicted that revenue would collapse and the mail coaches would be overwhelmed.",
          "They 'predicted that revenue would collapse'.",
        ),
        tfng(
          "Hill said in advance how many years the loss of revenue would last.",
          "NOT GIVEN",
          "",
          "The passage reports how long recovery took, but never says Hill predicted it.",
        ),
        noteLine(
          OLD_SYSTEM,
          null,
          "The price was set by the ______ the letter had been carried",
          "distance",
          "The charge depended on the distance the letter had travelled and on the number of sheets of paper it contained; an envelope counted as a sheet, which is why letters were folded and sealed rather than enclosed.",
          "The charge 'depended on the distance the letter had travelled'.",
        ),
        noteLine(
          OLD_SYSTEM,
          null,
          "The price also depended on how many ______ of paper were used",
          "sheets",
          "The charge depended on the distance the letter had travelled and on the number of sheets of paper it contained; an envelope counted as a sheet, which is why letters were folded and sealed rather than enclosed.",
          "It depended on 'the number of sheets of paper it contained'.",
          { before: [{ text: "Two things decided what a letter cost:", indent: 0 }] },
        ),
        noteLine(
          OLD_SYSTEM,
          null,
          "Payment was collected from the recipient at the ______",
          "door",
          "Recipients who could not pay simply refused the letter at the door, and the Post Office had then carried it for nothing.",
          "Collection happened 'at the door'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The first stamps were printed in ______ and carried the queen's profile.",
          "black",
          "The Post Office issued the first of them in May 1840, printed in black with the profile of the young queen.",
          "They were 'printed in black'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "British stamps are still the only ones that show no ______.",
          "country name",
          "The stamp itself became the standard proof of prepayment everywhere, and Britain, as the first country to issue one, retains the privilege of being the only one whose stamps carry no country name.",
          "Britain's stamps 'carry no country name'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The number of possible letter-writers grew as ______ spread.",
          "elementary schooling",
          "The railway network, which barely existed in 1830, carried the mail by the 1840s at speeds no coach could approach, and the spread of elementary schooling steadily increased the number of people who could write a letter worth sending.",
          "'The spread of elementary schooling' increased the number who could write.",
        ),
      ],
    },
    {
      key: "t51-p2-fog-harvesting",
      title: "Water Out of Fog",
      topic: "collecting drinking water from coastal fog in dry regions",
      difficulty: 6,
      body: `On the coastal hills of northern Chile it almost never rains, and yet for much of the year the slopes above four hundred metres are wrapped for hours each morning in a dense grey cloud that the people who live there call the camanchaca. It is not rain, and it will not fall as rain; the droplets suspended in it are so small that they can drift for days without ever growing heavy enough to descend. Collecting them is a matter of giving them something to stick to.

The device that does this is uncomplicated. A rectangle of fine plastic mesh, typically forty square metres, is stretched between two posts facing the prevailing wind. Fog is pushed through the weave; a proportion of the droplets strike a fibre, merge with others already there, and run down the mesh into a gutter at the bottom, from which a pipe carries the water to a tank. Nothing is pumped and nothing is powered. A well-sited collector of that size can yield between two hundred and six hundred litres on a good day, and almost nothing on a bad one.

Elena Ruiz-Marín, a hydrologist who has measured collectors along the Chilean coast for two decades, is firm about what determines the difference. The variable that matters most, she argues, is not the density of the fog but the wind that drives it, because a droplet can only be caught if it is carried into the mesh rather than floating past it. Her measurements show sites a few hundred metres apart yielding very different volumes for the same fog, according to how the local topography channels the air.

The best-known project remains the one at Chungungo, a fishing village of about three hundred people that had been supplied by tanker lorry. From 1992 a system of around ninety large collectors on the ridge above the village delivered an average of fifteen thousand litres a day, enough for domestic use and for the gardens the villagers planted once water was no longer rationed. Within a decade, however, the system had fallen into disuse. The usual explanation offered is technical failure, but Tomás Belmar, an engineer who surveyed the site afterwards, rejects it. The meshes had torn and the gutters had blocked, he accepts, but the reason nobody repaired them was that responsibility had never been assigned: the project had been built by outsiders, handed over without a maintenance budget, and abandoned as soon as a road and a pipeline made the village's water somebody else's problem.

That lesson has shaped the projects that followed. On Mount Boutmezguida in south-western Morocco, where a system now supplies several hundred people in a cluster of villages, Aziza Bennani directs an operation in which local technicians are trained and paid to inspect the nets, and households contribute to a fund for replacement mesh. Bennani argues that the engineering was never the hard part of fog harvesting; the hard part is designing an arrangement in which somebody whose own water depends on the nets is the person responsible for climbing the hill to check them.

Materials research has meanwhile improved what the nets themselves can do. The standard mesh, a polypropylene shade cloth borrowed from agriculture, collects perhaps two per cent of the water passing through it. Much of the loss comes from droplets that bounce off the fibres, or that cling to the weave and clog it so that later fog is deflected around a saturated panel. Kenji Harada, a materials scientist, has tested three-dimensional meshes whose fibres are coated so that water spreads along them and drains quickly, keeping the openings clear; in wind-tunnel trials these have collected several times as much as the standard cloth from the same volume of fog. Whether the advantage survives a decade of ultraviolet light and salt on a Chilean ridge is not yet known.

Enthusiasts sometimes present the technique as a general answer to water scarcity, and it is not. It requires a site where fog is frequent, reliable and driven by wind, which in practice means particular coastal hills and mountain slopes; over most of the world's dry land there is nothing to collect. Where those conditions do exist, though, the appeal is considerable. A collector costs a few hundred dollars, needs no fuel and no electricity, can be repaired by the people who use it, and produces water at the point where it is wanted rather than at the end of a pipeline somebody else controls.`,
      questions: [
        fromList(
          "matching_features",
          FOG_PEOPLE,
          "Wind matters more than the thickness of the fog itself.",
          "Elena Ruiz-Marín",
          "The variable that matters most, she argues, is not the density of the fog but the wind that drives it, because a droplet can only be caught if it is carried into the mesh rather than floating past it.",
          "Ruiz-Marín names wind, not density, as the decisive variable.",
        ),
        fromList(
          "matching_features",
          FOG_PEOPLE,
          "A well-known system failed for reasons that were not technical.",
          "Tomás Belmar",
          "The meshes had torn and the gutters had blocked, he accepts, but the reason nobody repaired them was that responsibility had never been assigned: the project had been built by outsiders, handed over without a maintenance budget, and abandoned as soon as a road and a pipeline made the village's water somebody else's problem.",
          "Belmar attributes the failure to unassigned responsibility.",
        ),
        fromList(
          "matching_features",
          FOG_PEOPLE,
          "The difficult part of the technique is organisational rather than engineering.",
          "Aziza Bennani",
          "Bennani argues that the engineering was never the hard part of fog harvesting; the hard part is designing an arrangement in which somebody whose own water depends on the nets is the person responsible for climbing the hill to check them.",
          "She says 'the engineering was never the hard part'.",
        ),
        fromList(
          "matching_features",
          FOG_PEOPLE,
          "A redesigned surface allows water to drain away faster.",
          "Kenji Harada",
          "Kenji Harada, a materials scientist, has tested three-dimensional meshes whose fibres are coated so that water spreads along them and drains quickly, keeping the openings clear; in wind-tunnel trials these have collected several times as much as the standard cloth from the same volume of fog.",
          "Harada's coated fibres 'drain quickly, keeping the openings clear'.",
        ),
        fromList(
          "summary_completion",
          FOG_BANK,
          "A fog collector is a rectangle of ______ held between two posts, and it uses no power of any kind.",
          "mesh",
          "A rectangle of fine plastic mesh, typically forty square metres, is stretched between two posts facing the prevailing wind.",
          "The rectangle is 'fine plastic mesh'.",
        ),
        fromList(
          "summary_completion",
          FOG_BANK,
          "Water that has gathered on the fibres runs down under ______ into a gutter.",
          "gravity",
          "Fog is pushed through the weave; a proportion of the droplets strike a fibre, merge with others already there, and run down the mesh into a gutter at the bottom, from which a pipe carries the water to a tank.",
          "Nothing is pumped, so the water simply runs down.",
        ),
        fromList(
          "summary_completion",
          FOG_BANK,
          "At Chungungo the collectors were left unrepaired partly because no budget for ______ had been provided.",
          "maintenance",
          "The meshes had torn and the gutters had blocked, he accepts, but the reason nobody repaired them was that responsibility had never been assigned: the project had been built by outsiders, handed over without a maintenance budget, and abandoned as soon as a road and a pipeline made the village's water somebody else's problem.",
          "It was 'handed over without a maintenance budget'.",
        ),
        fromList(
          "summary_completion",
          FOG_BANK,
          "The village's interest in the nets fell away once a road and a ______ arrived.",
          "pipeline",
          "The meshes had torn and the gutters had blocked, he accepts, but the reason nobody repaired them was that responsibility had never been assigned: the project had been built by outsiders, handed over without a maintenance budget, and abandoned as soon as a road and a pipeline made the village's water somebody else's problem.",
          "'A road and a pipeline' made the water somebody else's problem.",
        ),
        mcq(
          "What does the passage say about the droplets in the camanchaca?",
          [
            "They are too small to fall as rain on their own",
            "They contain salt carried up from the sea",
            "They form only above four hundred metres",
            "They evaporate before they reach the ground",
          ],
          "They are too small to fall as rain on their own",
          "It is not rain, and it will not fall as rain; the droplets suspended in it are so small that they can drift for days without ever growing heavy enough to descend.",
          "They never grow 'heavy enough to descend'.",
        ),
        mcq(
          "What is said about the yield of a single forty-square-metre collector?",
          [
            "It varies enormously from one day to the next",
            "It is steady once the site has been chosen well",
            "It rises through the year to a summer peak",
            "It has been measured only in wind tunnels",
          ],
          "It varies enormously from one day to the next",
          "A well-sited collector of that size can yield between two hundred and six hundred litres on a good day, and almost nothing on a bad one.",
          "From hundreds of litres to 'almost nothing on a bad one'.",
        ),
        mcq(
          "What limits the standard agricultural mesh?",
          [
            "Water clings to it and blocks the openings",
            "It tears within a single season of use",
            "It cannot be made wider than forty square metres",
            "It must be cleaned with fresh water each week",
          ],
          "Water clings to it and blocks the openings",
          "Much of the loss comes from droplets that bounce off the fibres, or that cling to the weave and clog it so that later fog is deflected around a saturated panel.",
          "Droplets 'cling to the weave and clog it'.",
        ),
        pickTwo(
          FOG_STEM,
          FOG_OPTIONS,
          "A or B",
          "It requires a site where fog is frequent, reliable and driven by wind, which in practice means particular coastal hills and mountain slopes; over most of the world's dry land there is nothing to collect.",
          "Fog must be 'frequent, reliable' — that is, present on most days.",
        ),
        pickTwo(
          FOG_STEM,
          FOG_OPTIONS,
          "A or B",
          "A rectangle of fine plastic mesh, typically forty square metres, is stretched between two posts facing the prevailing wind.",
          "The net faces 'the prevailing wind', which must drive the fog through it.",
        ),
      ],
    },
    {
      key: "t51-p3-zebra-stripes",
      title: "Stripes and the Fly",
      topic: "the long argument over what zebra stripes are for",
      difficulty: 7,
      body: `A) Few questions in natural history have been asked for so long with so little agreement as the question of why zebras are striped. Darwin and Wallace disagreed about it in print in the 1870s, and the four explanations they and their contemporaries proposed — concealment, confusion of predators, social signalling and relief from heat — were still the four under active investigation a century and a half later. What changed recently was not the list of hypotheses but the arrival of methods capable of eliminating some of them.

B) The concealment argument holds that vertical stripes break up the outline of a large animal in tall grass, particularly at dusk. It has an obvious difficulty, which is that zebras are conspicuous to human observers at considerable distances, and a less obvious one, which is that human vision is the wrong instrument for the test. When researchers modelled the scene as a lion or a spotted hyena would see it — both have poorer acuity than we do, and neither distinguishes the colours we rely on — the stripes ceased to be resolvable at the ranges over which those predators typically detect prey. Beyond about fifty metres in daylight, and much less at night, a zebra to a lion is a grey shape. The pattern therefore cannot be doing concealment work at the distances that matter, and it is not doing it at close range either, where the animal is plainly visible.

C) The confusion argument is more resilient and harder to test. A herd in motion, on this account, presents a moving field of stripes in which a pursuing predator cannot fix on one individual or judge its speed accurately. Laboratory work with human volunteers chasing striped targets on a screen has produced results consistent with the idea, and so has work with tsetse flies approaching striped surfaces. The difficulty is that the effect has never been demonstrated in a lion pursuing a zebra, and lions hunt zebras with considerable success, often at night and often by ambush, in conditions where a dazzle effect would have little opportunity to operate.

D) Social recognition was for many years the least examined of the four. Zebras do differ individually in their stripe patterns, as reliably as people differ in fingerprints, and a foal learns its mother's pattern within days. But the same is true of the plain-coated horses and asses to which zebras are closely related, which recognise each other perfectly well without any pattern at all, and which use scent and vocalisation to do it. Individual recognition may well be a use to which the stripes are put; it does not explain why they evolved.

E) The thermoregulation argument proposes that black and white surfaces heat at different rates, generating small convection currents that cool the animal's skin. It is a tidy physical idea and it has been repeatedly tested. Measurements of the skin temperature of striped and unstriped animals in the same conditions have found no consistent difference, and a comparative analysis across equid species found no association between striping and the temperature of the habitats they occupy. The hypothesis is not quite dead, but it has no positive evidence behind it.

F) The explanation that now has the strongest support is the least romantic. Across the equid family, the extent of striping correlates closely with the distribution of biting flies — tabanids and tsetse — and not with the presence of large predators, the density of woodland or the mean temperature. Africa's striped species live where those flies are abundant for most of the year; the plain-coated ones do not. That correlation was suggestive rather than conclusive until experimental work followed. When domestic horses were dressed in striped coats and left in a field beside horses in plain coats, the flies approached both in equal numbers but landed on the striped animals far less often. High-speed video showed why: the flies failed to decelerate on their final approach and either collided with the animal or veered away at the last moment, as though the pattern disrupted the visual cues by which an insect judges the distance remaining to a landing surface.

G) I find the fly explanation convincing, and I think the reason it took so long to be taken seriously is worth noticing. It attributes a conspicuous feature of a large, famous mammal to the behaviour of an insect, which is not the kind of answer the question seemed to deserve. It is also, in the African context, a serious one: tabanid bites transmit trypanosomiasis and other diseases through a wound in the skin, and an animal that is bitten less often is an animal that lives longer. The remaining puzzle is not whether the mechanism works but why, if it works so well, it has evolved in so few of the mammals that share the same fields with the same flies.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reason why the writer thinks this explanation was overlooked",
          "G",
          "I find the fly explanation convincing, and I think the reason it took so long to be taken seriously is worth noticing.",
          "Paragraph G gives the writer's view on why it was dismissed.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison with animals that lack the pattern but manage without it",
          "D",
          "But the same is true of the plain-coated horses and asses to which zebras are closely related, which recognise each other perfectly well without any pattern at all, and which use scent and vocalisation to do it.",
          "Paragraph D compares zebras with plain-coated relatives.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to an argument between two nineteenth-century naturalists",
          "A",
          "Darwin and Wallace disagreed about it in print in the 1870s, and the four explanations they and their contemporaries proposed — concealment, confusion of predators, social signalling and relief from heat — were still the four under active investigation a century and a half later.",
          "Paragraph A names Darwin and Wallace.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an account of why human eyesight is unsuitable for testing one idea",
          "B",
          "It has an obvious difficulty, which is that zebras are conspicuous to human observers at considerable distances, and a less obvious one, which is that human vision is the wrong instrument for the test.",
          "Paragraph B explains that 'human vision is the wrong instrument'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of filming that revealed how insects behave as they arrive",
          "F",
          "High-speed video showed why: the flies failed to decelerate on their final approach and either collided with the animal or veered away at the last moment, as though the pattern disrupted the visual cues by which an insect judges the distance remaining to a landing surface.",
          "Paragraph F describes the high-speed video.",
        ),
        ynng(
          "The writer believes the concealment hypothesis has been effectively ruled out.",
          "YES",
          "The pattern therefore cannot be doing concealment work at the distances that matter, and it is not doing it at close range either, where the animal is plainly visible.",
          "The writer says it 'cannot be doing concealment work'.",
        ),
        ynng(
          "The writer thinks the confusion hypothesis has been tested in the wild.",
          "NO",
          "The difficulty is that the effect has never been demonstrated in a lion pursuing a zebra, and lions hunt zebras with considerable success, often at night and often by ambush, in conditions where a dazzle effect would have little opportunity to operate.",
          "The effect 'has never been demonstrated in a lion pursuing a zebra'.",
        ),
        ynng(
          "The writer accepts that individual recognition explains how striping first arose.",
          "NO",
          "Individual recognition may well be a use to which the stripes are put; it does not explain why they evolved.",
          "It 'does not explain why they evolved'.",
        ),
        ynng(
          "The writer considers the fly explanation to be trivial in its consequences.",
          "NO",
          "It is also, in the African context, a serious one: tabanid bites transmit trypanosomiasis and other diseases through a wound in the skin, and an animal that is bitten less often is an animal that lives longer.",
          "The writer calls the consequence 'a serious one'.",
        ),
        fromList(
          "matching_sentence_endings",
          STRIPE_ENDINGS,
          "The distribution of striped equid species supports the fly hypothesis",
          "because the pattern matches where biting flies are most common.",
          "Across the equid family, the extent of striping correlates closely with the distribution of biting flies — tabanids and tsetse — and not with the presence of large predators, the density of woodland or the mean temperature.",
          "Striping tracks the flies rather than predators or heat.",
        ),
        fromList(
          "matching_sentence_endings",
          STRIPE_ENDINGS,
          "The coat experiment produced a clear result",
          "although the animals it was tested on were not zebras.",
          "When domestic horses were dressed in striped coats and left in a field beside horses in plain coats, the flies approached both in equal numbers but landed on the striped animals far less often.",
          "The subjects were 'domestic horses', not zebras.",
        ),
        fromList(
          "matching_sentence_endings",
          STRIPE_ENDINGS,
          "The cooling hypothesis remains on the list",
          "even though no difference in body temperature was found.",
          "Measurements of the skin temperature of striped and unstriped animals in the same conditions have found no consistent difference, and a comparative analysis across equid species found no association between striping and the temperature of the habitats they occupy.",
          "No consistent temperature difference was measured.",
        ),
        fromList(
          "matching_sentence_endings",
          STRIPE_ENDINGS,
          "The video evidence points to a failure of judgement in the insect",
          "which suggests the flies simply fail to slow down in time.",
          "High-speed video showed why: the flies failed to decelerate on their final approach and either collided with the animal or veered away at the last moment, as though the pattern disrupted the visual cues by which an insect judges the distance remaining to a landing surface.",
          "They 'failed to decelerate on their final approach'.",
        ),
        fromList(
          "matching_sentence_endings",
          STRIPE_ENDINGS,
          "The dazzle hypothesis is hard to reconcile with hunting behaviour",
          "despite the fact that lions hunt mainly in poor light.",
          "The difficulty is that the effect has never been demonstrated in a lion pursuing a zebra, and lions hunt zebras with considerable success, often at night and often by ambush, in conditions where a dazzle effect would have little opportunity to operate.",
          "Lions hunt 'often at night and often by ambush'.",
        ),
      ],
    },
  ],
};
