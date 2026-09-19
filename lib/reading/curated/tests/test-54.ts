import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · retail history · notes box --------------------------------

const TROLLEY_NOTES = {
  title: "Goldman's first design",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · insect biology · people and a word bank -------------------

const LOCUST_PEOPLE = ["Ruth Alembe", "Viktor Csillag", "Meera Iyer", "Joachim Braun"];
const LOCUST_BANK = [
  "serotonin",
  "legs",
  "crowding",
  "colour",
  "rainfall",
  "eggs",
  "wings",
  "scent",
  "drought",
];

// ---- Passage 3 · cartography debate · lettered paragraphs ------------------

const MAP_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const MAP_ENDINGS = [
  "because a curved surface cannot be flattened without stretching something.",
  "which is exactly what a sailor crossing an ocean needs.",
  "although the distortion it introduces is in the shapes rather than the areas.",
  "even though the projection was designed for a purpose nobody uses it for now.",
  "because the countries it enlarges happen to be the wealthy ones.",
  "which the writer thinks is the wrong question to be arguing about.",
  "despite having been published more than four centuries earlier.",
];

export const TEST_54: CuratedTest = {
  key: "full-test-54",
  targetBand: 6,
  passages: [
    {
      key: "t54-p1-shopping-trolley",
      title: "The Basket on Wheels",
      topic: "how shoppers were persuaded to push a cart around a shop",
      difficulty: 5,
      body: `Sylvan Goldman owned a chain of grocery stores in Oklahoma City in the 1930s, and like every grocer of the period he had noticed something that limited his takings. Customers carried a wire basket over one arm, and when the basket became heavy they stopped shopping and went to the till. The limit on a sale was not what a customer wanted or could afford; it was what a customer could carry.

His solution, which he sketched in 1936, was to take a folding wooden chair, put wheels on the legs, raise the seat to make a frame, and set two wire baskets on it, one above the other. The frame folded flat when it was not in use, which mattered in a shop where floor space was expensive, and a line of them could be nested in a rack by the door. He had a carpenter build a working version, patented the design, and put the first of them into his stores in June 1937 with a sign explaining what they were for.

Almost nobody used them. Goldman later described watching shoppers walk past the carts to pick up the familiar baskets, and the reasons he eventually collected from them had nothing to do with convenience. Men told him that pushing a cart looked weak, as though they could not carry a basket. Women told him it was too much like pushing a pram, and that they had children at home precisely so that they would not have to push anything around a shop. Older customers said it made them look infirm. The object was useful and the objection was social, which is the hardest kind of objection for an inventor to answer.

The answer Goldman found has been copied many times since. He hired people — men and women of several ages — to walk around his shops pushing carts and filling them, and stationed a greeter at the door to offer a cart to each arriving customer and to point out that other people were using them. Within a few weeks the carts were being taken voluntarily. By 1940 there was a waiting list of seven years for the factory Goldman had set up to manufacture them.

The design changed quickly under the pressure of use. The folding frame, which had been the clever part, turned out to be unnecessary and was abandoned. A competing patent introduced the telescoping cart, in which the rear panel of each basket swings up so that one cart slides into the next, which is why a line of them can now be stored in a fraction of the space and pushed back to the shop in a single train. The child seat arrived in 1947, complete with the folding flap that generations of children have since sat behind.

The cart also changed the shop around it. A basket-carrying customer needs aisles wide enough for two people; a cart-pushing customer needs aisles wide enough for two carts, and the standard supermarket aisle width was set by that requirement rather than by any other. The height of the shelves, the length of the aisle, the position of heavy goods low down, and the size of the packages themselves all adjusted to a container that was no longer an arm but a box on wheels. Trade researchers noticed something else: the volume of a cart is a suggestion. A customer with a basket that is nearly full feels finished, while a customer with a cart that is a quarter full feels they have barely begun, and the average size of carts increased steadily for decades afterwards for exactly that reason.

Goldman's own fortune came from renting the carts rather than selling them, and he died in 1984 a wealthy man. The thing he had to invent, though, was not really the cart. Wheels, wire baskets and folding frames all existed, and a competent workshop could have assembled the object at any point in the previous fifty years. What he had to invent was a way of making a useful object socially acceptable to people who had already decided, for reasons they could not entirely explain, that it was not for them. The carpenter took an afternoon over the frame; the rest of it took Goldman three years.`,
      questions: [
        tfng(
          "The weight a customer could carry set a limit on how much they bought.",
          "TRUE",
          "The limit on a sale was not what a customer wanted or could afford; it was what a customer could carry.",
          "The limit was 'what a customer could carry'.",
        ),
        tfng(
          "Goldman's first design was based on an item of furniture.",
          "TRUE",
          "His solution, which he sketched in 1936, was to take a folding wooden chair, put wheels on the legs, raise the seat to make a frame, and set two wire baskets on it, one above the other.",
          "He began with 'a folding wooden chair'.",
        ),
        tfng(
          "Customers rejected the carts because they were difficult to push.",
          "FALSE",
          "The object was useful and the objection was social, which is the hardest kind of objection for an inventor to answer.",
          "The objection was social, not practical.",
        ),
        tfng(
          "Goldman paid people to be seen using the carts in his shops.",
          "TRUE",
          "He hired people — men and women of several ages — to walk around his shops pushing carts and filling them, and stationed a greeter at the door to offer a cart to each arriving customer and to point out that other people were using them.",
          "He 'hired people … pushing carts and filling them'.",
        ),
        tfng(
          "The folding frame remained an important feature of later carts.",
          "FALSE",
          "The folding frame, which had been the clever part, turned out to be unnecessary and was abandoned.",
          "It 'turned out to be unnecessary and was abandoned'.",
        ),
        tfng(
          "Supermarket aisle width was determined by the size of the carts.",
          "TRUE",
          "A basket-carrying customer needs aisles wide enough for two people; a cart-pushing customer needs aisles wide enough for two carts, and the standard supermarket aisle width was set by that requirement rather than by any other.",
          "Aisle width 'was set by that requirement'.",
        ),
        tfng(
          "Goldman made most of his money from selling carts to other shops.",
          "FALSE",
          "Goldman's own fortune came from renting the carts rather than selling them, and he died in 1984 a wealthy man.",
          "His fortune came 'from renting the carts rather than selling them'.",
        ),
        noteLine(
          TROLLEY_NOTES,
          null,
          "Wheels were attached to the ______ of a folding chair",
          "legs",
          "His solution, which he sketched in 1936, was to take a folding wooden chair, put wheels on the legs, raise the seat to make a frame, and set two wire baskets on it, one above the other.",
          "He put 'wheels on the legs'.",
        ),
        noteLine(
          TROLLEY_NOTES,
          null,
          "Two wire ______ were carried one above the other",
          "baskets",
          "His solution, which he sketched in 1936, was to take a folding wooden chair, put wheels on the legs, raise the seat to make a frame, and set two wire baskets on it, one above the other.",
          "It carried 'two wire baskets … one above the other'.",
          { before: [{ text: "Built from parts that already existed:", indent: 0 }] },
        ),
        noteLine(
          TROLLEY_NOTES,
          null,
          "Unused carts could be stored in a ______ near the entrance",
          "rack",
          "The frame folded flat when it was not in use, which mattered in a shop where floor space was expensive, and a line of them could be nested in a rack by the door.",
          "They were 'nested in a rack by the door'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some male customers said that pushing a cart made them look ______.",
          "weak",
          "Men told him that pushing a cart looked weak, as though they could not carry a basket.",
          "Pushing a cart 'looked weak'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A rival patent produced the ______ cart, which slides into the one behind it.",
          "telescoping",
          "A competing patent introduced the telescoping cart, in which the rear panel of each basket swings up so that one cart slides into the next, which is why a line of them can now be stored in a fraction of the space and pushed back to the shop in a single train.",
          "The rival design was 'the telescoping cart'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A seat for a ______ was added to the design in 1947.",
          "child",
          "The child seat arrived in 1947, complete with the folding flap that generations of children have since sat behind.",
          "'The child seat arrived in 1947'.",
        ),
      ],
    },
    {
      key: "t54-p2-locust-swarms",
      title: "From Loner to Swarm",
      topic: "the transformation that turns a solitary insect into a plague",
      difficulty: 6,
      body: `For most of its life the desert locust is an unremarkable green grasshopper that avoids other members of its species. It feeds alone, rests alone, and if it encounters another locust it moves away. In this state, which entomologists call the solitarious phase, the insect is so retiring that a region can hold large numbers of them without anyone noticing. Then, under particular conditions, the same animal becomes something else: bright yellow and black, physically stronger, actively attracted to other locusts, and capable of flying in formations that darken the sky and consume in a day the food that would feed tens of thousands of people.

The two forms were described as separate species for more than a century. It was not until the 1920s that a Russian entomologist working in Central Asia demonstrated that they were the same animal in different conditions, and the mechanism took another eighty years to identify.

Ruth Alembe, who has studied the transformation in the laboratory, explains that the trigger is mechanical and surprisingly specific. When locusts are forced together — typically because a period of rain has produced a flush of vegetation that then dries out, concentrating the insects on the last green patches — they touch one another repeatedly. Alembe's group established that it is stimulation of the hind legs in particular that matters. Brushing the antennae, the abdomen or the wings of a solitary locust changes nothing; brushing the outer face of a hind leg for a couple of hours begins the change.

What follows is a cascade. Within hours the insect's nervous system floods with serotonin, a chemical messenger also present in vertebrates, and the behaviour switches first: the locust stops avoiding others and begins to seek them out. Viktor Csillag, a neurobiologist, notes that this single chemical is sufficient on its own. Injecting serotonin into an isolated locust produces gregarious behaviour without any crowding at all, and blocking it prevents the change even in a crowded cage. The colour change, the thicker body and the longer wings follow over days, and the offspring of gregarious parents are born already in the gregarious form, which is why a swarm can build across generations.

The scale that follows is difficult to convey. A mature swarm may cover several hundred square kilometres and contain forty to eighty million insects per square kilometre, and it can travel a hundred and fifty kilometres in a day on the wind. The swarms that crossed East Africa and South Asia in 2019 and 2020 were the largest for decades, and affected crops in more than twenty countries.

Control, where it works, depends entirely on acting before that stage. Meera Iyer, who has advised national control services, is blunt about the arithmetic: treating a few hectares of concentrated hoppers, before they can fly, costs a fraction of what it costs to spray a moving swarm, and it works. The obstacle is not knowledge but continuity. Locust outbreaks are separated by quiet years, sometimes a decade of them, during which the surveillance teams, the aircraft and the trained staff are the easiest item in any agriculture budget to cut. When the next outbreak begins, the capacity to catch it early no longer exists.

Joachim Braun, an entomologist who works on alternatives to chemical spraying, points to a fungal pathogen that infects locusts and not other insects, and which has been used successfully in several African countries. It is slower than a chemical, taking one to two weeks to kill, which makes it unsuitable for an emergency but well suited to the early, concentrated stage where most of the value lies. Its adoption has been limited less by its performance than by the difficulty of persuading a service in a crisis to use something that does not produce visible results the same afternoon.

There is one more variable that no control programme can influence. Swarms move on the wind, and the rains that let them breed follow the same weather systems, so an outbreak that begins in one country is a regional event within weeks. Reporting, funding and spraying are national. The mismatch between the geography of the insect and the geography of the response is old, well understood, and unresolved.`,
      questions: [
        fromList(
          "matching_features",
          LOCUST_PEOPLE,
          "Only one part of the insect's body triggers the change when touched.",
          "Ruth Alembe",
          "Alembe's group established that it is stimulation of the hind legs in particular that matters.",
          "Alembe identified the hind legs specifically.",
        ),
        fromList(
          "matching_features",
          LOCUST_PEOPLE,
          "A single chemical can produce the change without any contact.",
          "Viktor Csillag",
          "Injecting serotonin into an isolated locust produces gregarious behaviour without any crowding at all, and blocking it prevents the change even in a crowded cage.",
          "Csillag notes serotonin is sufficient by itself.",
        ),
        fromList(
          "matching_features",
          LOCUST_PEOPLE,
          "Early treatment is far cheaper than acting once the insects can fly.",
          "Meera Iyer",
          "Meera Iyer, who has advised national control services, is blunt about the arithmetic: treating a few hectares of concentrated hoppers, before they can fly, costs a fraction of what it costs to spray a moving swarm, and it works.",
          "Iyer sets out the cost arithmetic.",
        ),
        fromList(
          "matching_features",
          LOCUST_PEOPLE,
          "A biological control works well but is too slow for an emergency.",
          "Joachim Braun",
          "It is slower than a chemical, taking one to two weeks to kill, which makes it unsuitable for an emergency but well suited to the early, concentrated stage where most of the value lies.",
          "Braun's fungus takes one to two weeks.",
        ),
        fromList(
          "summary_completion",
          LOCUST_BANK,
          "The change begins with ______, which forces the insects into repeated contact.",
          "crowding",
          "When locusts are forced together — typically because a period of rain has produced a flush of vegetation that then dries out, concentrating the insects on the last green patches — they touch one another repeatedly.",
          "Being 'forced together' produces the contact.",
        ),
        fromList(
          "summary_completion",
          LOCUST_BANK,
          "The contact that matters is on the hind ______.",
          "legs",
          "Brushing the antennae, the abdomen or the wings of a solitary locust changes nothing; brushing the outer face of a hind leg for a couple of hours begins the change.",
          "Only the hind leg works.",
        ),
        fromList(
          "summary_completion",
          LOCUST_BANK,
          "The nervous system then releases ______, and behaviour changes first.",
          "serotonin",
          "Within hours the insect's nervous system floods with serotonin, a chemical messenger also present in vertebrates, and the behaviour switches first: the locust stops avoiding others and begins to seek them out.",
          "The system 'floods with serotonin'.",
        ),
        fromList(
          "summary_completion",
          LOCUST_BANK,
          "Changes in ______ and in body shape take several days to appear.",
          "colour",
          "The colour change, the thicker body and the longer wings follow over days, and the offspring of gregarious parents are born already in the gregarious form, which is why a swarm can build across generations.",
          "'The colour change … follow over days'.",
        ),
        fromList(
          "summary_completion",
          LOCUST_BANK,
          "Outbreaks are made possible in the first place by a period of ______.",
          "rainfall",
          "Swarms move on the wind, and the rains that let them breed follow the same weather systems, so an outbreak that begins in one country is a regional event within weeks.",
          "Rain is what allows them to breed.",
        ),
        mcq(
          "Why were the two forms long thought to be different species?",
          [
            "They differ in colour, size and behaviour",
            "They were found on different continents",
            "They were described by rival entomologists",
            "They breed at different times of year",
          ],
          "They differ in colour, size and behaviour",
          "Then, under particular conditions, the same animal becomes something else: bright yellow and black, physically stronger, actively attracted to other locusts, and capable of flying in formations that darken the sky and consume in a day the food that would feed tens of thousands of people.",
          "The two forms look and behave entirely differently.",
        ),
        mcq(
          "What does the passage say about the offspring of gregarious locusts?",
          [
            "They are born in the gregarious form",
            "They revert to the solitary form immediately",
            "They must be crowded again to change",
            "They are smaller than their parents",
          ],
          "They are born in the gregarious form",
          "The colour change, the thicker body and the longer wings follow over days, and the offspring of gregarious parents are born already in the gregarious form, which is why a swarm can build across generations.",
          "They are 'born already in the gregarious form'.",
        ),
        mcq(
          "What does Iyer identify as the main obstacle to early control?",
          [
            "Capacity is cut during the quiet years",
            "The chemicals available are ineffective",
            "Hoppers are difficult to locate on the ground",
            "Farmers object to spraying near crops",
          ],
          "Capacity is cut during the quiet years",
          "Locust outbreaks are separated by quiet years, sometimes a decade of them, during which the surveillance teams, the aircraft and the trained staff are the easiest item in any agriculture budget to cut.",
          "Surveillance capacity is cut between outbreaks.",
        ),
        mcq(
          "What problem does the passage identify in its final paragraph?",
          [
            "Swarms cross borders while responses do not",
            "Wind patterns have become less predictable",
            "Funding arrives faster than spraying teams",
            "Reporting systems disagree about swarm size",
          ],
          "Swarms cross borders while responses do not",
          "Reporting, funding and spraying are national.",
          "The insect is regional; the response is national.",
        ),
      ],
    },
    {
      key: "t54-p3-map-projections",
      title: "The Map That Cannot Be Right",
      topic: "why every flat map of the world distorts something",
      difficulty: 7,
      body: `A) Every world map on a flat sheet is wrong, and it is wrong for a reason that has nothing to do with the skill of the cartographer. A sphere has a property mathematicians call intrinsic curvature, and a consequence of that property, proved by Gauss in 1827, is that no part of a spherical surface can be laid flat without stretching, tearing or compressing it. The question facing anyone who draws a world map is therefore not whether to distort but which distortion to accept.

B) The choices are well defined. A projection can preserve shape locally, so that a small country looks the right shape but the wrong size; it can preserve area, so that every country covers the correct proportion of the sheet but is squashed or stretched; it can preserve distance along certain lines; or it can preserve direction. It cannot preserve more than one of these everywhere, and most projections in general use compromise on all of them in order to look acceptable. The compromise is chosen, argued over and published, which is why a projection carries a name in the way that a formula does.

C) The projection everyone argues about was published by Gerardus Mercator in 1569 and designed to solve one specific problem. A sailor steering a constant compass bearing follows a curved path across the globe, and before Mercator there was no way to plot such a course as a straight line on a chart. Mercator's construction makes any line of constant bearing straight, which turns navigation into ruler work. The cost of that property is a systematic and severe exaggeration of area away from the equator: Greenland appears roughly the size of Africa, when Africa is about fourteen times larger. The exaggeration grows with latitude and becomes infinite at the poles, which is why the projection is always cut off somewhere short of them and why Antarctica, on most versions of it, is either a white band across the bottom of the sheet or simply absent.

D) The political criticism of the projection is well known. In the 1970s the German historian Arno Peters attacked it in exactly these terms — that it inflates Europe and North America while shrinking Africa, South America and South Asia — and promoted an equal-area alternative, which several international organisations adopted. Cartographers who agreed entirely with the political point were nonetheless irritated by the campaign, partly because the projection Peters promoted had been published by James Gall a century earlier and partly because its own distortion, a pronounced vertical stretching of the tropics, is severe enough that few of them considered it an improvement.

E) It is worth being precise about the charge. Mercator did not design the projection for classrooms, and for its intended use it is not distorting anything that matters; a navigator does not care about the relative areas of continents. The problem arose when a chart designed for steering ships became the default image of the world on schoolroom walls and, much later, the default for digital mapping services, which adopted a variant of it because its property of preserving local shape at every zoom level is useful when a user is looking at a street rather than a hemisphere.

F) The genuinely interesting question is what a world map is for, and there the argument for any single answer is weak. A map for comparing the land area of countries should be equal-area. A map for teaching the shape of coastlines should preserve shape. A map for showing air routes should preserve great-circle distance from a chosen point, and will be useless for every other point on the sheet. Choosing one projection to serve all of these is like choosing one lens for a camera: possible, but it guarantees that most photographs will be taken with the wrong one.

G) I think the energy spent on condemning one projection would be better spent teaching that the choice exists. A reader who knows that a flat map is a decision — that something has been sacrificed and that the cartographer chose what to sacrifice — can read any projection intelligently, including Mercator's. A reader who has simply been told that one map is honest and another is not has exchanged a misunderstanding for a different misunderstanding, and is no better equipped to look at the next map they meet.`,
      questions: [
        fromList(
          "matching_information",
          MAP_PARAGRAPHS,
          "a statement of the mathematical result that makes accurate flat maps impossible",
          "A",
          "A sphere has a property mathematicians call intrinsic curvature, and a consequence of that property, proved by Gauss in 1827, is that no part of a spherical surface can be laid flat without stretching, tearing or compressing it.",
          "Paragraph A states Gauss's result.",
        ),
        fromList(
          "matching_information",
          MAP_PARAGRAPHS,
          "the reason a mapping service chose a particular projection",
          "E",
          "The problem arose when a chart designed for steering ships became the default image of the world on schoolroom walls and, much later, the default for digital mapping services, which adopted a variant of it because its property of preserving local shape at every zoom level is useful when a user is looking at a street rather than a hemisphere.",
          "Paragraph E explains the digital adoption.",
        ),
        fromList(
          "matching_information",
          MAP_PARAGRAPHS,
          "a comparison between choosing a projection and choosing equipment",
          "F",
          "Choosing one projection to serve all of these is like choosing one lens for a camera: possible, but it guarantees that most photographs will be taken with the wrong one.",
          "Paragraph F makes the camera-lens comparison.",
        ),
        fromList(
          "matching_information",
          MAP_PARAGRAPHS,
          "an account of why specialists disliked a campaign whose politics they shared",
          "D",
          "Cartographers who agreed entirely with the political point were nonetheless irritated by the campaign, partly because the projection Peters promoted had been published by James Gall a century earlier and partly because its own distortion, a pronounced vertical stretching of the tropics, is severe enough that few of them considered it an improvement.",
          "Paragraph D describes the cartographers' irritation.",
        ),
        fromList(
          "matching_information",
          MAP_PARAGRAPHS,
          "a list of the properties a projection can hold on to",
          "B",
          "A projection can preserve shape locally, so that a small country looks the right shape but the wrong size; it can preserve area, so that every country covers the correct proportion of the sheet but is squashed or stretched; it can preserve distance along certain lines; or it can preserve direction.",
          "Paragraph B lists the preservable properties.",
        ),
        ynng(
          "The writer thinks Mercator's projection is badly designed for its original purpose.",
          "NO",
          "Mercator did not design the projection for classrooms, and for its intended use it is not distorting anything that matters; a navigator does not care about the relative areas of continents.",
          "For its intended use 'it is not distorting anything that matters'.",
        ),
        ynng(
          "The writer agrees that the equal-area alternative was a clear improvement.",
          "NO",
          "Cartographers who agreed entirely with the political point were nonetheless irritated by the campaign, partly because the projection Peters promoted had been published by James Gall a century earlier and partly because its own distortion, a pronounced vertical stretching of the tropics, is severe enough that few of them considered it an improvement.",
          "'Few of them considered it an improvement'.",
        ),
        ynng(
          "The writer believes no single projection can serve every purpose.",
          "YES",
          "A map for comparing the land area of countries should be equal-area. A map for teaching the shape of coastlines should preserve shape.",
          "Different purposes require different projections.",
        ),
        ynng(
          "The writer thinks the public argument has been directed at the right target.",
          "NO",
          "I think the energy spent on condemning one projection would be better spent teaching that the choice exists.",
          "The energy 'would be better spent' elsewhere.",
        ),
        fromList(
          "matching_sentence_endings",
          MAP_ENDINGS,
          "No flat world map can be free of error",
          "because a curved surface cannot be flattened without stretching something.",
          "A sphere has a property mathematicians call intrinsic curvature, and a consequence of that property, proved by Gauss in 1827, is that no part of a spherical surface can be laid flat without stretching, tearing or compressing it.",
          "Flattening always stretches, tears or compresses.",
        ),
        fromList(
          "matching_sentence_endings",
          MAP_ENDINGS,
          "Mercator's construction turns a constant bearing into a straight line,",
          "which is exactly what a sailor crossing an ocean needs.",
          "Mercator's construction makes any line of constant bearing straight, which turns navigation into ruler work.",
          "It 'turns navigation into ruler work'.",
        ),
        fromList(
          "matching_sentence_endings",
          MAP_ENDINGS,
          "The equal-area map promoted in the 1970s was not new,",
          "despite having been published more than four centuries earlier.",
          "Cartographers who agreed entirely with the political point were nonetheless irritated by the campaign, partly because the projection Peters promoted had been published by James Gall a century earlier and partly because its own distortion, a pronounced vertical stretching of the tropics, is severe enough that few of them considered it an improvement.",
          "It had been published by Gall a century before.",
        ),
        fromList(
          "matching_sentence_endings",
          MAP_ENDINGS,
          "Digital services still use a version of the 1569 chart,",
          "even though the projection was designed for a purpose nobody uses it for now.",
          "The problem arose when a chart designed for steering ships became the default image of the world on schoolroom walls and, much later, the default for digital mapping services, which adopted a variant of it because its property of preserving local shape at every zoom level is useful when a user is looking at a street rather than a hemisphere.",
          "It was designed for steering ships.",
        ),
        fromList(
          "matching_sentence_endings",
          MAP_ENDINGS,
          "Arguing about which single map is honest is unproductive,",
          "which the writer thinks is the wrong question to be arguing about.",
          "A reader who has simply been told that one map is honest and another is not has exchanged a misunderstanding for a different misunderstanding, and is no better equipped to look at the next map they meet.",
          "That framing swaps one misunderstanding for another.",
        ),
      ],
    },
  ],
};
