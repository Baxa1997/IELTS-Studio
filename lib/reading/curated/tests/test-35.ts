import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · archaeology · notes ----------------------------------------

const ARMY = {
  title: "The discovery and study of the terracotta figures",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs, people -------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const FARM_PEOPLE = ["Ingrid Halvorsen", "Rajiv Menon", "Claire Dubois", "Kwame Asante"];

// ---- Passage 3 · research debate · word bank --------------------------------

const HAND_BANK = [
  "stencils",
  "language",
  "sport",
  "genes",
  "parents",
  "fencing",
  "tenth",
  "brain",
  "century",
  "surprise",
];

export const TEST_35: CuratedTest = {
  key: "full-test-35",
  targetBand: 6,
  passages: [
    {
      key: "t35-p1-terracotta",
      title: "An Army Made of Clay",
      topic: "the terracotta figures buried near the tomb of China's first emperor",
      difficulty: 5,
      body: `In March 1974, farmers digging a well in a dry field in Shaanxi province, in central China, struck fragments of hardened clay. What they had found, about a kilometre and a half from a large earth mound, was the edge of one of the greatest archaeological discoveries of the twentieth century: an army of life-sized pottery soldiers, buried for more than two thousand years to guard the tomb of the first emperor of a unified China.

Qin Shi Huang came to the throne of the state of Qin as a boy and, by 221 BCE, had conquered the rival states and declared himself emperor. His reign was short and severe. He standardised weights, measures, coinage and the written script, ordered the building of roads and defensive walls, and is said to have burned books that disagreed with his officials. Work on his tomb complex is thought to have begun almost as soon as he took power and to have continued for more than thirty years, employing, according to a historian writing a century later, some seven hundred thousand labourers.

Excavation of the site has revealed three pits containing figures, along with a fourth that was left empty. The largest pit holds the main force, standing in ranks in long corridors divided by earth walls: infantry at the front, then rows of soldiers who once held bronze weapons, and behind them chariots drawn by pottery horses. A second pit contains cavalry and archers, and a third, much smaller, appears to be a command post. Estimates of the total number of figures run to about eight thousand, and many remain in the ground.

The figures were not individually sculpted from beginning to end. Bodies were built up from coils and slabs of clay in a small number of standard types, and legs, arms, torsos and heads were made separately and assembled before firing. What makes each soldier appear unique is the finishing: ears, noses, moustaches, hairstyles and expressions were modelled by hand at the last stage, so that the faces vary while the bodies do not. Marks stamped or scratched into the clay record the names of foremen, evidence of a system in which responsibility for quality could be traced back to a particular workshop.

They were also painted. Traces show that the soldiers once wore bright reds, greens, blues and purples, applied over a layer of lacquer. The paint is the greatest problem the site presents to conservators: after two millennia in damp soil, the lacquer layer curls and flakes within minutes of being exposed to dry air, taking the colour with it. Excavators now wrap newly uncovered figures in damp cloth and spray them with preservatives as they work, and some sections of the pits have been deliberately left unopened until better methods exist.

The bronze weapons buried with the army have attracted their own scientific argument. Many blades came out of the ground bright and almost unrusted, and an early explanation held that Qin metalworkers had treated them with a chromium compound to prevent corrosion, two thousand years before such techniques were developed elsewhere. A study published in 2019 challenged this: the chromium, the authors argued, had come from the lacquer used on nearby wooden shafts and handles, and the real reason for the metal's condition was the chemistry of the local soil.

The emperor's tomb itself, under the mound, has never been opened. Ancient accounts describe a chamber containing models of palaces and rivers of flowing mercury, protected by crossbows set to fire at intruders. Surveys of the mound have found mercury in the soil at concentrations well above those of the surrounding area, which is consistent with the story, although it proves nothing about the rest of it. Chinese authorities have declined to excavate, on the grounds that the contents could not yet be preserved.

Archaeologists elsewhere have made the same choice, leaving sealed burials untouched on the reasoning that a site can be excavated only once, and that techniques improve with every decade of waiting. That decision has become a familiar one in archaeology. The site attracts millions of visitors a year, the figures that have been raised and repaired are among the most recognisable objects in the world, and the mound sits quietly beside them, holding whatever it holds.`,
      questions: [
        noteLine(
          ARMY,
          "Discovery",
          "Found in 1974 by farmers digging a ______",
          "well",
          "In March 1974, farmers digging a well in a dry field in Shaanxi province, in central China, struck fragments of hardened clay.",
          "They were 'digging a well'.",
        ),
        noteLine(
          ARMY,
          "Discovery",
          "The figures guard the tomb of the first ______ of a unified China",
          "emperor",
          "What they had found, about a kilometre and a half from a large earth mound, was the edge of one of the greatest archaeological discoveries of the twentieth century: an army of life-sized pottery soldiers, buried for more than two thousand years to guard the tomb of the first emperor of a unified China.",
          "They guard 'the tomb of the first emperor'.",
        ),
        noteLine(
          ARMY,
          "The pits",
          "Three pits hold figures and a fourth was left ______",
          "empty",
          "Excavation of the site has revealed three pits containing figures, along with a fourth that was left empty.",
          "The fourth 'was left empty'.",
        ),
        noteLine(
          ARMY,
          "The pits",
          "The third and smallest pit seems to be a ______ post",
          "command",
          "A second pit contains cavalry and archers, and a third, much smaller, appears to be a command post.",
          "The third 'appears to be a command post'.",
        ),
        noteLine(
          ARMY,
          "How they were made",
          "Heads, arms and torsos were made separately and joined before ______",
          "firing",
          "Bodies were built up from coils and slabs of clay in a small number of standard types, and legs, arms, torsos and heads were made separately and assembled before firing.",
          "They were 'assembled before firing'.",
        ),
        noteLine(
          ARMY,
          "How they were made",
          "Marks in the clay record the names of ______",
          "foremen",
          "Marks stamped or scratched into the clay record the names of foremen, evidence of a system in which responsibility for quality could be traced back to a particular workshop.",
          "The marks 'record the names of foremen'.",
        ),
        noteLine(
          ARMY,
          "Conservation",
          "Colour was applied over a layer of ______ that now flakes in dry air",
          "lacquer",
          "Traces show that the soldiers once wore bright reds, greens, blues and purples, applied over a layer of lacquer.",
          "The paint was 'applied over a layer of lacquer'.",
        ),
        tfng(
          "Qin Shi Huang introduced a single system of writing across his empire.",
          "TRUE",
          "He standardised weights, measures, coinage and the written script, ordered the building of roads and defensive walls, and is said to have burned books that disagreed with his officials.",
          "He 'standardised… the written script'.",
        ),
        tfng(
          "Every terracotta figure was modelled individually from start to finish.",
          "FALSE",
          "The figures were not individually sculpted from beginning to end.",
          "They 'were not individually sculpted from beginning to end'.",
        ),
        tfng(
          "All of the figures buried at the site have now been excavated.",
          "FALSE",
          "Estimates of the total number of figures run to about eight thousand, and many remain in the ground.",
          "'Many remain in the ground'.",
        ),
        tfng(
          "The 2019 study supported the view that Qin metalworkers deliberately treated blades against rust.",
          "FALSE",
          "A study published in 2019 challenged this: the chromium, the authors argued, had come from the lacquer used on nearby wooden shafts and handles, and the real reason for the metal's condition was the chemistry of the local soil.",
          "The study 'challenged this'.",
        ),
        tfng(
          "Mercury has been detected in the soil of the burial mound.",
          "TRUE",
          "Surveys of the mound have found mercury in the soil at concentrations well above those of the surrounding area, which is consistent with the story, although it proves nothing about the rest of it.",
          "Surveys 'have found mercury in the soil'.",
        ),
        tfng(
          "The Chinese authorities plan to open the emperor's tomb within ten years.",
          "NOT GIVEN",
          "",
          "They have declined to excavate; no timetable is mentioned.",
        ),
      ],
    },
    {
      key: "t35-p2-vertical-farming",
      title: "Farming in a Warehouse",
      topic: "what vertical farms have achieved and where they have failed",
      difficulty: 6,
      body: `A) A vertical farm is a building in which plants are grown on stacked shelves under electric light, with their roots in water or mist rather than soil. Nothing about it depends on the weather. Temperature, humidity, light and nutrients are all set by the operator, crops can be harvested every few weeks throughout the year, and because the water circulates, a farm of this kind can use a small fraction of the water a field would need for the same crop. It can also sit inside a city, a short drive from the shops it supplies. For most of the past decade this combination attracted a great deal of investment and a great many confident predictions.

B) The predictions have not aged well. Several of the best-known companies in the sector have closed, been sold cheaply or abandoned large sites part-built, and the retreat has been sharpest in exactly the places where the promises were loudest. The reason is not that the plants failed to grow. They grew extremely well. The difficulty is that a field receives sunlight at no cost, and a warehouse does not. Every photon that reaches a leaf indoors has to be paid for, and when energy prices rose, businesses whose margins depended on cheap electricity discovered how narrow those margins had been.

C) The economics therefore turn on the crop. Leafy greens, herbs and salads are light, fast-growing, mostly water, and are sold fresh at high prices; they also spoil quickly in transport, so growing them near the customer has real value. Strawberries and some soft fruit are now grown this way too. Wheat, rice, maize and potatoes are a different matter: they store and travel cheaply, they sell for very little per kilogram, and the amount of light they need to build up starch is far beyond what can be paid for indoors. Agricultural economist Dr Rajiv Menon puts the boundary plainly. "Indoor farming will never feed the world," he says. "It can supply the salad."

D) Where sunlight is free but land or water is not, the sums look different. Countries with little arable land and expensive imports — parts of the Gulf, Singapore, some island states — have supported indoor production as a matter of food security rather than of price, and results there have been steadier. Systems engineer Dr Ingrid Halvorsen, who advises growers in Norway and the Gulf, argues that this is the sensible way to read the industry. "Ask what the alternative is," she says. "Flying lettuce four thousand kilometres is also expensive, and nobody calls that a failure."

E) The energy question has answers, if not easy ones. Light-emitting diodes have become far more efficient, and growers now tune their colour and timing to the plant rather than flooding the room with white light. Farms can run their lamps at night, when electricity is cheapest and the grid has spare renewable output, and some are built beside generating plants to use waste heat. Even so, an operation that draws power from a fossil-fuelled grid may produce more emissions per lettuce than a greenhouse in a sunny country, a point critics make often and supporters rarely dispute.

F) There are quieter successes. Many commercial greenhouses now raise their seedlings indoors under lights before moving them outside, which shortens the growing season and reduces losses; nurseries producing young plants have proved more profitable than farms producing food. Plant scientist Dr Claire Dubois has studied this shift. "The technology found its market," she says. "It simply was not the market it was sold to investors as." Breeders also use the same controlled rooms to run several generations of a crop in a year instead of one.

G) What survives of the original idea is smaller and more useful than the vision that attracted the money. Indoor farms are unlikely to replace fields, and the claim that they would was always in tension with the arithmetic of photosynthesis. As a way of producing fresh leaves close to cities, of growing food where there is no soil, and of raising seedlings and research crops under controlled conditions, they work. Food policy researcher Professor Kwame Asante suggests that the sector's real problem was never technical. "It was sold as a revolution," he says, "and revolutions are judged harshly when they turn out to be an improvement."`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why some crops can never be grown profitably indoors",
          "C",
          "Wheat, rice, maize and potatoes are a different matter: they store and travel cheaply, they sell for very little per kilogram, and the amount of light they need to build up starch is far beyond what can be paid for indoors.",
          "Paragraph C explains the economics of staple crops.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to using power when it is cheapest",
          "E",
          "Farms can run their lamps at night, when electricity is cheapest and the grid has spare renewable output, and some are built beside generating plants to use waste heat.",
          "Paragraph E: lamps run 'when electricity is cheapest'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of the technology succeeding in a role it was not designed for",
          "F",
          "Many commercial greenhouses now raise their seedlings indoors under lights before moving them outside, which shortens the growing season and reduces losses; nurseries producing young plants have proved more profitable than farms producing food.",
          "Paragraph F: seedlings, not food, proved profitable.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the point that businesses failed for reasons unconnected with growing plants",
          "B",
          "The reason is not that the plants failed to grow.",
          "Paragraph B: the plants grew; the electricity was the problem.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In a vertical farm the roots sit in water or ______ rather than soil.",
          "mist",
          "A vertical farm is a building in which plants are grown on stacked shelves under electric light, with their roots in water or mist rather than soil.",
          "Roots sit 'in water or mist'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Because the water circulates, these farms use far less ______ than fields.",
          "water",
          "Temperature, humidity, light and nutrients are all set by the operator, crops can be harvested every few weeks throughout the year, and because the water circulates, a farm of this kind can use a small fraction of the water a field would need for the same crop.",
          "They use 'a small fraction of the water a field would need'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Salad crops are valuable indoors partly because they ______ quickly in transport.",
          "spoil",
          "Leafy greens, herbs and salads are light, fast-growing, mostly water, and are sold fresh at high prices; they also spoil quickly in transport, so growing them near the customer has real value.",
          "They 'spoil quickly in transport'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Growers now adjust the ______ and timing of their lamps to suit the plant.",
          "colour",
          "Light-emitting diodes have become far more efficient, and growers now tune their colour and timing to the plant rather than flooding the room with white light.",
          "They 'tune their colour and timing to the plant'.",
        ),
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "Indoor growing can supply one part of the diet, not the whole of it.",
          "Rajiv Menon",
          '"Indoor farming will never feed the world," he says. "It can supply the salad."',
          "Menon: 'It can supply the salad.'",
        ),
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "The technology should be judged against the alternative it replaces.",
          "Ingrid Halvorsen",
          '"Ask what the alternative is," she says. "Flying lettuce four thousand kilometres is also expensive, and nobody calls that a failure."',
          "Halvorsen: compare with flying lettuce in.",
        ),
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "The industry found customers, but not the ones it had promised.",
          "Claire Dubois",
          '"The technology found its market," she says. "It simply was not the market it was sold to investors as."',
          "Dubois: not the market it was sold as.",
        ),
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "The sector suffered from the scale of its own claims.",
          "Kwame Asante",
          '"It was sold as a revolution," he says, "and revolutions are judged harshly when they turn out to be an improvement."',
          "Asante on being 'sold as a revolution'.",
        ),
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "Food security, rather than cost, justifies indoor farms in some countries.",
          "Ingrid Halvorsen",
          "Countries with little arable land and expensive imports — parts of the Gulf, Singapore, some island states — have supported indoor production as a matter of food security rather than of price, and results there have been steadier.",
          "Halvorsen advises exactly these growers, and argues the comparison should be with imports.",
        ),
      ],
    },
    {
      key: "t35-p3-handedness",
      title: "The Left-Handed Minority",
      topic: "why a stable minority of people are left-handed",
      difficulty: 7,
      body: `Roughly one person in ten is left-handed. The proportion is remarkably stable: it is much the same in Europe, Africa and East Asia, it appears to have been much the same in the distant past, and it has not moved in any obvious direction despite centuries of pressure on left-handers to conform. Archaeologists reading the wear on stone tools, and the hand stencils blown onto cave walls in Europe and Indonesia, arrive at a similar figure for people living tens of thousands of years ago. Whatever produces left-handedness, it has been producing it at about the same rate for a very long time, and that stability is the fact most in need of explanation.

It is not simply inherited. The children of two left-handed parents are more likely than average to be left-handed, but most of them are not, and identical twins, who share their entire genetic sequence, differ in handedness about a quarter of the time. Large genetic studies have identified dozens of regions of the genome with small effects, several of which are involved in the scaffolding that gives cells their shape and that helps to establish left and right during early development. Together these regions explain only a modest share of the variation. The rest appears to come from events in the womb and from chance.

Handedness is bound up with the way the two halves of the brain divide their work, though less neatly than popular accounts suggest. In the great majority of right-handers, the machinery of language sits mainly in the left hemisphere. Among left-handers the same is true of most, but a substantially larger minority have language distributed differently, either shared between the hemispheres or concentrated on the right. This is an interesting difference in degree. It is not the basis for the familiar claim that left-handers are creative and right-handers logical, which is a folk theory with no serious evidence behind it, and which survives largely because it flatters everybody.

Other claims have been tested and discarded. A study in the early 1990s reported that left-handers died substantially younger, a finding that caused alarm until it was traced to the way the sample had been assembled: older generations had been pressed to write with the right hand, so the very old in the sample contained few recorded left-handers for reasons that had nothing to do with survival. Claims linking left-handedness to a long list of disorders have generally shrunk on closer inspection, though a small association with a few conditions of early brain development has held up.

The most interesting question is why the trait persists at all. If being left-handed carried no advantage, chance alone would be expected to have pushed the proportion towards zero or towards a half; instead it sits stubbornly near a tenth. The leading explanation is that the advantage of being unusual depends on being rare. In any contest where opponents face each other directly, a left-hander has practised against right-handers all their life while their opponent has rarely practised against a left-hander. The prediction is testable, and it holds: left-handers are heavily over-represented in fencing, boxing, table tennis, cricket and baseball, and hardly at all in sports such as gymnastics or swimming, where competitors do not interact. The same logic suggests that the advantage would vanish if left-handers became common, which would push the proportion back down — a balance that can hold a trait at a low, steady frequency indefinitely.

It is an elegant argument, and it is not fully proven. It rests on the assumption that direct physical contests mattered enough, over enough of human history, to shape the distribution, which is plausible but hard to demonstrate. Alternative explanations exist, including the possibility that handedness is simply a by-product of the general asymmetry of the body, with the exact proportion set by developmental noise rather than by selection at all.

What has changed, and changed fast, is not the biology but the treatment. Within living memory, children in many countries had their left hands tied behind them at school. Rates of reported left-handedness in those countries rose sharply once the practice stopped, then levelled off — the clearest possible demonstration that the earlier figures measured social pressure rather than nature. Left-handed scissors, desks and guitars are now ordinary. The minority remains a minority, and has stopped being a problem to be corrected.`,
      questions: [
        mcq(
          "What does the evidence from cave art and stone tools suggest?",
          [
            "Left-handedness was much more common in the past.",
            "The proportion of left-handers has been broadly stable for a very long time.",
            "Early humans had no consistent hand preference.",
            "Hand preference varied greatly between regions.",
          ],
          "The proportion of left-handers has been broadly stable for a very long time.",
          "Archaeologists reading the wear on stone tools, and the hand stencils blown onto cave walls in Europe and Indonesia, arrive at a similar figure for people living tens of thousands of years ago.",
          "Ancient evidence gives 'a similar figure'.",
        ),
        mcq(
          "What do studies of identical twins show about handedness?",
          [
            "Twins always share the same handedness.",
            "Genes play no part in handedness.",
            "Twins differ in handedness in about a quarter of cases.",
            "Left-handed twins are rarer than left-handed singletons.",
          ],
          "Twins differ in handedness in about a quarter of cases.",
          "The children of two left-handed parents are more likely than average to be left-handed, but most of them are not, and identical twins, who share their entire genetic sequence, differ in handedness about a quarter of the time.",
          "They 'differ in handedness about a quarter of the time'.",
        ),
        mcq(
          "Why was the 1990s finding about left-handers' life expectancy rejected?",
          [
            "The sample was drawn from a single country.",
            "Older left-handers had been trained to use their right hands.",
            "The study measured the wrong hand.",
            "The researchers used too few participants.",
          ],
          "Older left-handers had been trained to use their right hands.",
          "A study in the early 1990s reported that left-handers died substantially younger, a finding that caused alarm until it was traced to the way the sample had been assembled: older generations had been pressed to write with the right hand, so the very old in the sample contained few recorded left-handers for reasons that had nothing to do with survival.",
          "Older generations 'had been pressed to write with the right hand'.",
        ),
        mcq(
          "What prediction does the rarity explanation make about sport?",
          [
            "Left-handers will excel in sports where competitors face each other.",
            "Left-handers will be better at individual sports such as swimming.",
            "Left-handers will win more often in every sport.",
            "The advantage will grow as left-handers become more common.",
          ],
          "Left-handers will excel in sports where competitors face each other.",
          "The prediction is testable, and it holds: left-handers are heavily over-represented in fencing, boxing, table tennis, cricket and baseball, and hardly at all in sports such as gymnastics or swimming, where competitors do not interact.",
          "They are over-represented exactly where opponents interact.",
        ),
        fromList(
          "summary_completion",
          HAND_BANK,
          "About a ______ of people are left-handed, in every region studied.",
          "tenth",
          "Roughly one person in ten is left-handed.",
          "'Roughly one person in ten'.",
        ),
        fromList(
          "summary_completion",
          HAND_BANK,
          "Hand ______ on cave walls suggest a similar proportion long ago.",
          "stencils",
          "Archaeologists reading the wear on stone tools, and the hand stencils blown onto cave walls in Europe and Indonesia, arrive at a similar figure for people living tens of thousands of years ago.",
          "The 'hand stencils blown onto cave walls'.",
        ),
        fromList(
          "summary_completion",
          HAND_BANK,
          "Dozens of ______ with small effects have been identified.",
          "genes",
          "Large genetic studies have identified dozens of regions of the genome with small effects, several of which are involved in the scaffolding that gives cells their shape and that helps to establish left and right during early development.",
          "Dozens of regions of the genome, each with a small effect.",
        ),
        fromList(
          "summary_completion",
          HAND_BANK,
          "In most right-handers, ______ is handled mainly by the left hemisphere.",
          "language",
          "In the great majority of right-handers, the machinery of language sits mainly in the left hemisphere.",
          "'The machinery of language sits mainly in the left hemisphere'.",
        ),
        fromList(
          "summary_completion",
          HAND_BANK,
          "Left-handers are over-represented in ______, boxing and table tennis.",
          "fencing",
          "The prediction is testable, and it holds: left-handers are heavily over-represented in fencing, boxing, table tennis, cricket and baseball, and hardly at all in sports such as gymnastics or swimming, where competitors do not interact.",
          "The list begins with 'fencing'.",
        ),
        fromList(
          "summary_completion",
          HAND_BANK,
          "Within the last ______, children were still forced to write with the right hand.",
          "century",
          "Within living memory, children in many countries had their left hands tied behind them at school.",
          "It happened 'within living memory' — within the last century.",
        ),
        ynng(
          "The writer accepts the popular idea that left-handers are more creative.",
          "NO",
          "It is not the basis for the familiar claim that left-handers are creative and right-handers logical, which is a folk theory with no serious evidence behind it, and which survives largely because it flatters everybody.",
          "It is 'a folk theory with no serious evidence behind it'.",
        ),
        ynng(
          "The writer regards the rarity explanation as attractive but unproven.",
          "YES",
          "It is an elegant argument, and it is not fully proven.",
          "'It is an elegant argument, and it is not fully proven.'",
        ),
        ynng(
          "The writer thinks the rise in recorded left-handers shows that the old figures reflected social pressure.",
          "YES",
          "Rates of reported left-handedness in those countries rose sharply once the practice stopped, then levelled off — the clearest possible demonstration that the earlier figures measured social pressure rather than nature.",
          "'The clearest possible demonstration that the earlier figures measured social pressure'.",
        ),
        ynng(
          "The writer believes left-handedness will become more common in the next few generations.",
          "NOT GIVEN",
          "",
          "The writer discusses why the proportion is stable, but makes no prediction about its future.",
        ),
      ],
    },
  ],
};
