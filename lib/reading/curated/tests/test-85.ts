import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · materials · notes box --------------------------------------

const BAMBOO_NOTES = {
  title: "Treating a culm before use",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · agricultural engineering · people and a word bank ---------

const TERRACE_PEOPLE = ["Rosario Quispe", "Bashir Tanvir", "Wen Li", "Dawit Alemu"];
const TERRACE_BANK = [
  "runoff",
  "walls",
  "labour",
  "abandoned",
  "soil",
  "gradient",
  "irrigation",
  "repair",
  "steps",
];

// ---- Passage 3 · soil science · lettered paragraphs ------------------------

const ROTATION_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ROTATION_ENDINGS = [
  "because the pest that specialises in one crop finds nothing to eat the next year.",
  "which a bag of factory nitrogen can supply more cheaply in the short run.",
  "since a break crop earns less per hectare than the crop it displaces.",
  "although the benefit only shows up in the years after it is grown.",
  "because the subsidy was paid on one crop and not on the sequence.",
  "since Roman writers were already recommending it two thousand years ago.",
  "which is why the advantage is hard to see in a single season's accounts.",
];

export const TEST_85: CuratedTest = {
  key: "full-test-85",
  targetBand: 5,
  passages: [
    {
      key: "t85-p1-bamboo",
      title: "The Grass That Behaves Like Timber",
      topic:
        "a plant that grows faster than any tree and is treated by engineers as a special case",
      difficulty: 4,
      body: `Bamboo is a grass. It has no bark, no growth rings and no branches of the kind a tree has, and it does not thicken with age: a stem emerges from the ground at very nearly its final diameter and then extends upwards. Some species add a metre in a day during the growing season, which makes bamboo the fastest-growing plant on land. A stem, properly called a culm, reaches full height in two or three months and is ready to cut in three to five years. An oak takes a century.

Along the grain, good bamboo is remarkably strong. Its tensile strength can exceed that of mild steel for the same weight, and its stiffness compares well with softwood timber. The reason is the arrangement of the fibres, which are concentrated in the outer wall of the hollow culm, exactly where a tube under bending most needs them. A structural engineer looking at a cross-section sees a design that would be expensive to manufacture deliberately and here grows by itself.

Across the grain the picture is different, and this is the source of almost every difficulty in building with bamboo. The culm splits easily, so a nail or a bolt driven through it can start a crack that runs the length of the stem. It is hollow and round, so two pieces cannot be joined by simply laying one flat against another. Traditional construction solved this with lashings, notches and pegs, and the solutions are elegant, but they depend on the skill of the person doing the work and cannot be specified in a drawing the way a bolted steel connection can.

There is also the question of what eats it. An untreated culm contains a great deal of starch, which attracts beetles and termites, and a bamboo structure in a humid climate may last only a few years. Treatment is therefore essential rather than optional. The cheapest traditional method is to stand freshly cut culms upright in running water for several weeks, which leaches out much of the starch. The modern industrial method pushes a boron solution through the vascular channels under pressure, which is faster and considerably more effective. Treated properly, bamboo lasts decades; treated carelessly, it fails early and gives the material a reputation it does not deserve.

That reputation is the main obstacle to wider use. In much of Asia and Latin America bamboo is regarded as the material of a poor household, something to be replaced with concrete blocks as soon as the money allows. Engineers have found this attitude harder to shift than any technical problem, and the successful projects have usually been ones where the bamboo is visible and obviously deliberate, in a school or a market hall, rather than hidden in a wall.

The technical route around the joining problem has been to stop using the culm whole. Engineered bamboo is made by splitting culms into strips, planing them flat, drying them and gluing them into beams and boards, in the same way that engineered timber is made from softwood. The result can be cut, drilled, bolted and specified like any other board, and it behaves predictably enough to appear in building codes. It also loses the thing that made bamboo attractive in the first place: the process needs machinery, adhesive and energy, and the finished beam costs more than the timber it replaces in most markets.

The carbon argument is where the interest now lies. A bamboo stand absorbs carbon quickly and can be cut selectively every year without replanting, because the underground system survives and sends up new culms. That is a genuinely unusual property — a harvest that does not require the plant to be killed or the ground to be disturbed — and it means a managed bamboo plantation can go on yielding indefinitely with very little input. Whether the carbon stays absorbed depends entirely on what the culm becomes. In a roof beam it is stored for as long as the building stands. In a disposable food container it is released within the year, and the fast growth that looked like an advantage becomes merely a fast cycle.

None of this makes bamboo a substitute for steel or a solution to anything on its own. What it is, in the places where it grows well, is a structural material that a village can plant, cut and treat locally, at a fraction of the cost and the carbon of the alternatives, provided the treatment is done properly and the joints are designed by somebody who understands that the material splits.`,
      questions: [
        tfng(
          "A bamboo culm grows thicker as it ages.",
          "FALSE",
          "It has no bark, no growth rings and no branches of the kind a tree has, and it does not thicken with age: a stem emerges from the ground at very nearly its final diameter and then extends upwards.",
          "It 'does not thicken with age'.",
        ),
        tfng(
          "Bamboo can be stronger than mild steel for a given weight.",
          "TRUE",
          "Its tensile strength can exceed that of mild steel for the same weight, and its stiffness compares well with softwood timber.",
          "It 'can exceed that of mild steel for the same weight'.",
        ),
        tfng(
          "The fibres are spread evenly through the wall of the culm.",
          "FALSE",
          "The reason is the arrangement of the fibres, which are concentrated in the outer wall of the hollow culm, exactly where a tube under bending most needs them.",
          "They are 'concentrated in the outer wall'.",
        ),
        tfng(
          "Traditional bamboo joints can be specified in a drawing as easily as steel ones.",
          "FALSE",
          "Traditional construction solved this with lashings, notches and pegs, and the solutions are elegant, but they depend on the skill of the person doing the work and cannot be specified in a drawing the way a bolted steel connection can.",
          "They 'cannot be specified in a drawing'.",
        ),
        tfng(
          "Untreated bamboo is attractive to insects because of its starch.",
          "TRUE",
          "An untreated culm contains a great deal of starch, which attracts beetles and termites, and a bamboo structure in a humid climate may last only a few years.",
          "The starch attracts beetles and termites.",
        ),
        tfng(
          "Engineered bamboo is usually cheaper than the timber it replaces.",
          "FALSE",
          "It also loses the thing that made bamboo attractive in the first place: the process needs machinery, adhesive and energy, and the finished beam costs more than the timber it replaces in most markets.",
          "It 'costs more than the timber it replaces'.",
        ),
        tfng(
          "Bamboo flooring is the largest export market for the material.",
          "NOT GIVEN",
          "",
          "The passage discusses engineered bamboo but says nothing about export markets.",
        ),
        noteLine(
          BAMBOO_NOTES,
          "Traditional",
          "Stand cut culms upright in running ______ for weeks",
          "water",
          "The cheapest traditional method is to stand freshly cut culms upright in running water for several weeks, which leaches out much of the starch.",
          "They stand in running water.",
        ),
        noteLine(
          BAMBOO_NOTES,
          "Traditional",
          "Effect: most of the ______ is leached out",
          "starch",
          "The cheapest traditional method is to stand freshly cut culms upright in running water for several weeks, which leaches out much of the starch.",
          "The water 'leaches out much of the starch'.",
        ),
        noteLine(
          BAMBOO_NOTES,
          "Industrial",
          "Force a ______ solution through the channels under pressure",
          "boron",
          "The modern industrial method pushes a boron solution through the vascular channels under pressure, which is faster and considerably more effective.",
          "A boron solution is used.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A culm is ready to cut after three to five ______.",
          "years",
          "A stem, properly called a culm, reaches full height in two or three months and is ready to cut in three to five years.",
          "It is ready in three to five years.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Driving a nail through a culm can start a ______.",
          "crack",
          "The culm splits easily, so a nail or a bolt driven through it can start a crack that runs the length of the stem.",
          "A nail can start a crack.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "New culms appear without replanting because the ______ system survives.",
          "underground",
          "A bamboo stand absorbs carbon quickly and can be cut selectively every year without replanting, because the underground system survives and sends up new culms.",
          "The underground system survives.",
        ),
      ],
    },
    {
      key: "t85-p2-terraces",
      title: "Steps Cut Into a Hillside",
      topic: "an ancient way of farming steep land, and why so much of it now lies unused",
      difficulty: 5,
      body: `A hillside under rain loses soil. Water running downhill picks up particles, gathers speed, cuts channels, and carries the most fertile layer to the valley floor and eventually to the sea. On a slope of any steepness the loss can exceed the rate at which new soil forms by a factor of hundreds, which means that farming a hillside without intervention is a process with a fixed end.

A terrace interrupts the water. Cutting a slope into a series of level or gently sloping steps, each held by a wall or a bank, means that rain falling on the terrace has nowhere to run: it stands and soaks in. The soil stays where it is, the water enters the ground instead of leaving the hillside, and land that could not otherwise be cultivated at all becomes productive. The technique was independently invented in the Andes, in China, in the Mediterranean, in Yemen and in the Philippines, which is the signature of a solution that follows fairly directly from the problem.

Rosario Quispe, an agronomist who works on Andean terraces, emphasises what the walls do besides holding soil. Stone absorbs heat during the day and releases it at night, which raises the minimum temperature on the terrace by a degree or two and extends the growing season at high altitude. She argues that the pre-Columbian terraces were as much a climate technology as an erosion control, and that this is why they were built at altitudes where nothing would otherwise ripen.

The cost is labour, and it is enormous. Bashir Tanvir, who has studied hill agriculture in northern Pakistan, puts the construction of a single hectare of stone-walled terrace at several hundred person-days, and adds that this is the smaller figure. The larger one is maintenance: a wall that loses a few stones in a storm must be repaired within the season, or the breach concentrates the next storm's water and the terrace above it goes too. His central point is that terraces do not decay gracefully. They hold completely or they fail in sequence, and a system neglected for five years may be beyond economic repair.

This is why abandonment is the dominant story of the last half-century. Wen Li, who maps terraces from satellite imagery, estimates that a large share of the world's terraced area is no longer farmed, and that the proportion is highest exactly where terraces are most celebrated as heritage. Young people leave for cities; the remaining households cannot maintain the walls; the walls fail; and the hillside sheds in a decade the soil that took centuries to accumulate behind them. She notes the uncomfortable consequence that an abandoned terrace can erode faster than a hillside that was never terraced, because the failure releases stored soil all at once.

Attempts to rebuild have had mixed results, and the failures are instructive. Dawit Alemu, who has evaluated terracing programmes in the Ethiopian highlands, found that schemes which paid people to build terraces produced structures that were abandoned as soon as the payments stopped, while schemes that built the same structures with farmers who had a secure claim on the land were still standing a decade later. He treats land tenure, not engineering, as the variable that decides the outcome, and regards the engineering as the easy part.

There is also a design question that the heritage framing tends to obscure. Not all terraces are level. A bench terrace with a level surface maximises infiltration and is right in a dry climate. In a wet climate, level terraces waterlog and the crop drowns, so the surface is given a slight outward slope and the excess is led away through a channel. Copying a design from one climate into another has repeatedly produced failures blamed on the technique rather than on the copying.

The current interest in terraces comes from two directions that do not always agree. One is food production on steep land in places where flat land has run out. The other is water: a terraced catchment releases rain slowly, which reduces flooding downstream and recharges groundwater, and those benefits accrue to people who do not farm the hillside and have never paid anything towards its walls. Several countries are experimenting with paying upstream farmers for exactly that service, on the reasoning that the cheapest flood defence for a city may be a maintained wall thirty kilometres away.`,
      questions: [
        fromList(
          "matching_features",
          TERRACE_PEOPLE,
          "The walls extend the growing season as well as holding the soil.",
          "Rosario Quispe",
          "She argues that the pre-Columbian terraces were as much a climate technology as an erosion control, and that this is why they were built at altitudes where nothing would otherwise ripen.",
          "Quispe treats them as a climate technology.",
        ),
        fromList(
          "matching_features",
          TERRACE_PEOPLE,
          "A neglected system fails suddenly rather than gradually.",
          "Bashir Tanvir",
          "They hold completely or they fail in sequence, and a system neglected for five years may be beyond economic repair.",
          "Tanvir says they fail in sequence.",
        ),
        fromList(
          "matching_features",
          TERRACE_PEOPLE,
          "A collapsed terrace can lose soil faster than untouched ground.",
          "Wen Li",
          "She notes the uncomfortable consequence that an abandoned terrace can erode faster than a hillside that was never terraced, because the failure releases stored soil all at once.",
          "Li draws out that consequence.",
        ),
        fromList(
          "matching_features",
          TERRACE_PEOPLE,
          "Who owns the land matters more than how the structure is built.",
          "Dawit Alemu",
          "He treats land tenure, not engineering, as the variable that decides the outcome, and regards the engineering as the easy part.",
          "Alemu puts tenure ahead of engineering.",
        ),
        fromList(
          "summary_completion",
          TERRACE_BANK,
          "Terracing cuts a slope into level ______ so that rain cannot run off.",
          "steps",
          "Cutting a slope into a series of level or gently sloping steps, each held by a wall or a bank, means that rain falling on the terrace has nowhere to run: it stands and soaks in.",
          "The slope becomes a series of steps.",
        ),
        fromList(
          "summary_completion",
          TERRACE_BANK,
          "Each step is held by a bank or by stone ______.",
          "walls",
          "Rosario Quispe, an agronomist who works on Andean terraces, emphasises what the walls do besides holding soil.",
          "The walls hold the soil.",
        ),
        fromList(
          "summary_completion",
          TERRACE_BANK,
          "Building a hectare demands several hundred person-days of ______.",
          "labour",
          "The cost is labour, and it is enormous.",
          "The cost is labour.",
        ),
        fromList(
          "summary_completion",
          TERRACE_BANK,
          "Much of the world's terraced area has now been ______.",
          "abandoned",
          "This is why abandonment is the dominant story of the last half-century.",
          "Abandonment is the dominant story.",
        ),
        fromList(
          "summary_completion",
          TERRACE_BANK,
          "In a wet climate the surface is given an outward ______.",
          "gradient",
          "In a wet climate, level terraces waterlog and the crop drowns, so the surface is given a slight outward slope and the excess is led away through a channel.",
          "The surface is sloped outwards.",
        ),
        mcq(
          "What does the writer say about the independent invention of terracing?",
          [
            "It suggests the solution follows directly from the problem",
            "It shows the technique spread along trade routes",
            "It proves the Andes were the earliest site",
            "It explains why designs are identical everywhere",
          ],
          "It suggests the solution follows directly from the problem",
          "The technique was independently invented in the Andes, in China, in the Mediterranean, in Yemen and in the Philippines, which is the signature of a solution that follows fairly directly from the problem.",
          "It is 'the signature of a solution that follows fairly directly'.",
        ),
        mcq(
          "Why must a damaged wall be repaired quickly?",
          [
            "The breach concentrates the next storm's water",
            "Stones are stolen for other buildings",
            "The crop cannot be harvested around it",
            "Insurance requires repair within the season",
          ],
          "The breach concentrates the next storm's water",
          "The larger one is maintenance: a wall that loses a few stones in a storm must be repaired within the season, or the breach concentrates the next storm's water and the terrace above it goes too.",
          "The breach concentrates the water.",
        ),
        mcq(
          "What distinguished the successful Ethiopian schemes?",
          [
            "Farmers had a secure claim on the land",
            "Payments continued for a decade",
            "The terraces were built with machinery",
            "Only level terraces were built",
          ],
          "Farmers had a secure claim on the land",
          "Dawit Alemu, who has evaluated terracing programmes in the Ethiopian highlands, found that schemes which paid people to build terraces produced structures that were abandoned as soon as the payments stopped, while schemes that built the same structures with farmers who had a secure claim on the land were still standing a decade later.",
          "A secure claim on the land distinguished them.",
        ),
        mcq(
          "Why might a city pay farmers on a distant hillside?",
          [
            "A terraced catchment releases rain slowly",
            "The farmers supply the city's food",
            "The walls provide stone for construction",
            "The hillside stores the city's drinking water",
          ],
          "A terraced catchment releases rain slowly",
          "The other is water: a terraced catchment releases rain slowly, which reduces flooding downstream and recharges groundwater, and those benefits accrue to people who do not farm the hillside and have never paid anything towards its walls.",
          "Slow release reduces downstream flooding.",
        ),
      ],
    },
    {
      key: "t85-p3-crop-rotation",
      title: "The Year the Field Rests",
      topic: "an old practice that chemistry made unnecessary and is now making necessary again",
      difficulty: 6,
      body: `A) Growing the same crop in the same field year after year is called continuous cropping, and it is a bad idea for reasons that were understood long before anyone could explain them. Yields fall. Weeds adapted to the crop's own growing season multiply. Soil-borne diseases that specialise in one host build up in the ground until they are impossible to dislodge. Roman writers on agriculture recommended alternating crops and leaving land fallow, and medieval European farming was organised around a three-field system in which a third of the land grew nothing each year.

B) The reason the alternation works has several parts. Different crops root at different depths and draw on different layers of the soil. A pest or pathogen specialised to one crop starves when that crop is absent, so a year's gap can reduce its population by an order of magnitude. Deep-rooted crops break compacted layers that shallow ones cannot, and the channels their roots leave behind are used by the next crop's roots and by water draining after rain. And legumes — peas, beans, clover, lentils — host bacteria in their roots that convert nitrogen from the air into a form plants can use, leaving the soil richer in the nutrient that most often limits growth.

C) That last effect was the great agricultural discovery of the eighteenth century, made empirically and without any idea of the mechanism. The introduction of clover and turnips into an English four-course rotation, with wheat and barley, raised yields substantially and allowed more animals to be kept over winter, which produced more manure, which raised yields further. The rotation was a self-reinforcing system, and the fact that nobody knew what the clover was doing did not reduce its effectiveness.

D) Industrial nitrogen fixation, developed just before the First World War, broke the system apart. If nitrogen can be bought by the sack, there is no agronomic need to grow a legume to supply it, and every hectare that grows clover is a hectare not growing a crop that can be sold. The economics pointed one way, strongly, and farming in the developed world followed: rotations shortened, legumes largely disappeared from arable land, and in some districts the same crop, or an alternation of only two, has been grown for sixty years with fertiliser and pesticide making up the difference.

E) The bill for this has arrived in instalments. Herbicide-resistant weeds are the most immediate: a weed that germinates in the same month every year, and meets the same chemical every year, is under intense selection, and resistance has now been recorded in hundreds of weed populations worldwide. Rotating crops is the most effective non-chemical answer, because it changes the timing of cultivation and denies the weed the predictable season it has adapted to. A weed that has been selected for years to germinate in autumn gains nothing from that adaptation in a field sown in spring, and the seed it sets is smaller and later. The same logic applies to soil pathogens, for which there is often no chemical answer at all.

F) Reintroducing rotation is straightforward agronomically and awkward financially. A break crop — a legume, or an oilseed, or a cereal grown out of its usual slot — almost always earns less per hectare in the year it is grown than the crop it displaces. Its benefit appears in the following years, as a higher yield, a lower fertiliser bill and a weed population that has not been selected for resistance. The accounts of a single season cannot show any of that, because every item in the list belongs to a later season than the one in which the cost is paid. A farmer comparing this year's margin against this year's alternative sees only the cost, and a farmer who rents land on a short tenancy has no reason to look further ahead than the tenancy.

G) Policy has generally made the problem worse before making it better. For decades, support payments were calculated per hectare of particular crops, which rewarded growing those crops as often as possible and penalised any year spent on something else. Several countries have since begun paying for the rotation rather than the crop, or for the presence of a legume in the sequence, which is a more sensible design and an administratively messier one, because a sequence can only be verified over several years. The underlying difficulty is that the practice being encouraged is a decision about time, and almost every instrument available to an agriculture ministry is a decision about a single year.`,
      questions: [
        fromList(
          "matching_information",
          ROTATION_PARAGRAPHS,
          "a self-reinforcing cycle involving animals and manure",
          "C",
          "The rotation was a self-reinforcing system, and the fact that nobody knew what the clover was doing did not reduce its effectiveness.",
          "Paragraph C describes the self-reinforcing rotation.",
        ),
        fromList(
          "matching_information",
          ROTATION_PARAGRAPHS,
          "the reason a farmer on a short tenancy has no incentive to rotate",
          "F",
          "A farmer comparing this year's margin against this year's alternative sees only the cost, and a farmer who rents land on a short tenancy has no reason to look further ahead than the tenancy.",
          "Paragraph F explains the tenancy problem.",
        ),
        fromList(
          "matching_information",
          ROTATION_PARAGRAPHS,
          "a description of how legumes acquire nitrogen",
          "B",
          "And legumes — peas, beans, clover, lentils — host bacteria in their roots that convert nitrogen from the air into a form plants can use, leaving the soil richer in the nutrient that most often limits growth.",
          "Paragraph B describes the root bacteria.",
        ),
        fromList(
          "matching_information",
          ROTATION_PARAGRAPHS,
          "why a subsidy design can be sound in principle and hard to administer",
          "G",
          "Several countries have since begun paying for the rotation rather than the crop, or for the presence of a legume in the sequence, which is a more sensible design and an administratively messier one, because a sequence can only be verified over several years.",
          "Paragraph G sets out the verification difficulty.",
        ),
        fromList(
          "matching_information",
          ROTATION_PARAGRAPHS,
          "an old system in which part of the land grew nothing",
          "A",
          "Roman writers on agriculture recommended alternating crops and leaving land fallow, and medieval European farming was organised around a three-field system in which a third of the land grew nothing each year.",
          "Paragraph A describes the three-field system.",
        ),
        ynng(
          "The writer thinks the eighteenth-century rotation worked despite its users not understanding why.",
          "YES",
          "That last effect was the great agricultural discovery of the eighteenth century, made empirically and without any idea of the mechanism.",
          "It was found empirically, with no mechanism known.",
        ),
        ynng(
          "The writer believes farmers who abandoned rotation were behaving irrationally.",
          "NO",
          "The economics pointed one way, strongly, and farming in the developed world followed: rotations shortened, legumes largely disappeared from arable land, and in some districts the same crop, or an alternation of only two, has been grown for sixty years with fertiliser and pesticide making up the difference.",
          "The writer says the economics pointed that way.",
        ),
        ynng(
          "The writer regards chemistry as capable of solving the soil-pathogen problem.",
          "NO",
          "The same logic applies to soil pathogens, for which there is often no chemical answer at all.",
          "There is 'often no chemical answer at all'.",
        ),
        ynng(
          "The writer thinks the real obstacle is that policy instruments work year by year.",
          "YES",
          "The underlying difficulty is that the practice being encouraged is a decision about time, and almost every instrument available to an agriculture ministry is a decision about a single year.",
          "The instruments are annual and the practice is not.",
        ),
        fromList(
          "matching_sentence_endings",
          ROTATION_ENDINGS,
          "A year without the host crop cuts a pest population sharply,",
          "because the pest that specialises in one crop finds nothing to eat the next year.",
          "A pest or pathogen specialised to one crop starves when that crop is absent, so a year's gap can reduce its population by an order of magnitude.",
          "The specialist starves in the gap year.",
        ),
        fromList(
          "matching_sentence_endings",
          ROTATION_ENDINGS,
          "The practice is far older than the science behind it,",
          "since Roman writers were already recommending it two thousand years ago.",
          "Roman writers on agriculture recommended alternating crops and leaving land fallow, and medieval European farming was organised around a three-field system in which a third of the land grew nothing each year.",
          "Roman writers already recommended it.",
        ),
        fromList(
          "matching_sentence_endings",
          ROTATION_ENDINGS,
          "Growing a legume stopped being agronomically necessary,",
          "which a bag of factory nitrogen can supply more cheaply in the short run.",
          "If nitrogen can be bought by the sack, there is no agronomic need to grow a legume to supply it, and every hectare that grows clover is a hectare not growing a crop that can be sold.",
          "Nitrogen can be bought by the sack.",
        ),
        fromList(
          "matching_sentence_endings",
          ROTATION_ENDINGS,
          "A break crop is a poor bargain in the year it is sown,",
          "since a break crop earns less per hectare than the crop it displaces.",
          "A break crop — a legume, or an oilseed, or a cereal grown out of its usual slot — almost always earns less per hectare in the year it is grown than the crop it displaces.",
          "It earns less than what it displaces.",
        ),
        fromList(
          "matching_sentence_endings",
          ROTATION_ENDINGS,
          "Farmers were once paid to repeat the same crop,",
          "because the subsidy was paid on one crop and not on the sequence.",
          "For decades, support payments were calculated per hectare of particular crops, which rewarded growing those crops as often as possible and penalised any year spent on something else.",
          "Payments were per hectare of particular crops.",
        ),
      ],
    },
  ],
};
