import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of invention · flow-chart --------------------------

const APPERT = {
  title: "Appert's preserving method",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO -----------------

const WATER_PEOPLE = ["Nadia Haddad", "Erik Lindqvist", "Priya Raghunathan", "Miguel Torres"];
const WATER_BANK = [
  "membranes",
  "pressure",
  "brine",
  "energy",
  "larvae",
  "seabed",
  "rainfall",
  "distillation",
  "pipes",
  "storage",
];
const WATER_STEM = "Which TWO ways of reducing the harm caused by desalination are described?";
const WATER_WAYS = [
  "drawing sea water in through sand beneath the seabed",
  "returning the brine to the sea already mixed with other flows",
  "heating the brine until only dry salt remains",
  "building plants at least fifty kilometres inland",
  "limiting each plant to one month of operation a year",
];

// ---- Passage 3 · research debate · lettered paragraphs, people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ALLERGY_PEOPLE = ["Ana Ferreira", "Johan Meyer", "Lena Brandt", "Samir Qureshi"];

export const TEST_38: CuratedTest = {
  key: "full-test-38",
  targetBand: 6,
  passages: [
    {
      key: "t38-p1-canning",
      title: "The Man Who Sealed the Jar",
      topic: "how Nicolas Appert invented a way of preserving food",
      difficulty: 5,
      body: `An army, as Napoleon's officers knew, is held together by its stomach. At the end of the eighteenth century a French army in the field ate what it could carry, buy or take, and what it carried spoiled. Meat was salted, vegetables dried, and scurvy and dysentery killed more soldiers than any enemy. In 1795 the French government offered a prize of twelve thousand francs to anyone who could find a reliable way of preserving food for the army and the navy.

The prize was eventually won by a confectioner. Nicolas Appert had worked as a cook, a brewer and a maker of preserves and sweets, and he understood from his trade that fruit boiled with sugar and sealed would keep. Over some fourteen years he tested a method on everything he could obtain: vegetables, fish, meat, milk and whole partridges. Food was packed into wide-mouthed glass jars, the jars were closed with corks driven in tightly and secured with wire, the seal was covered with wax, and the whole jar was then lowered into a bath of boiling water and heated for a period that depended on what was inside.

It worked, and Appert could not explain why. The germ theory of disease was half a century away. The common belief was that spoilage was caused by contact with air, and Appert reasoned that his method removed the air and kept it out, which was partly right for the wrong reasons. In fact the heating destroyed the micro-organisms already in the food, and the seal prevented new ones from arriving. When Louis Pasteur established this in the 1860s, he was explaining a technique that had by then been in industrial use for fifty years.

Appert was awarded the prize in 1810, on condition that he publish his method rather than patent it. His book, which set out the procedure for more than fifty foods, appeared the same year and was quickly translated. He used the money to expand what was, in effect, the world's first food-preserving factory, at Massy, south of Paris. His business was not a lasting success: his factory was destroyed during the invasion of France in 1814, and he died poor in 1841.

Within months of his book's publication the idea had crossed the Channel and changed material. An English merchant, Peter Durand, took out a patent in 1810 covering preservation in vessels of glass, pottery or tin, and sold it on to two engineers who opened a canning works in London. Tin-plated iron was lighter than glass, did not break on a cart or a ship, and could be made in any shape. Its one disadvantage was that early cans were built like small boilers, of iron thick enough to need a hammer and chisel to open. The label on one such can advised the user to cut round the top with a chisel, and the can opener as a household tool did not appear for another forty-five years.

The navy took to canned food immediately, and so did polar expeditions, which needed food that would last for years in a ship's hold. Cans travelled with the British expeditions that searched for a northern sea route through the Canadian Arctic, and when one of those expeditions vanished in the 1840s, the tins left at its camps became evidence. It was later suggested that lead solder used to seal them had poisoned the crews, although more recent work has questioned how much difference the lead actually made, and other explanations, including simple starvation and disease, are at least as convincing.

Canning also changed how food was sold. Because a sealed can could carry a printed label, its contents were identified by a maker's name rather than weighed out of a sack by a shopkeeper, and tinned goods were among the first foods that customers bought by brand. Canning spread with the century. Mechanised can-making cut the cost, tomato, condensed milk and corned beef factories opened on three continents, and by the 1870s a can was an ordinary household object. The technique has changed less than might be expected: modern retorts heat sealed containers under pressure, and the timings are calculated rather than guessed, but the principle is the one a confectioner arrived at by trial and error in a workshop outside Paris.`,
      questions: [
        tfng(
          "The French prize was offered before Appert began his experiments.",
          "NOT GIVEN",
          "",
          "The prize was offered in 1795 and Appert worked for fourteen years, but the passage does not say which came first.",
        ),
        tfng(
          "Appert tested his method on a wide variety of foods.",
          "TRUE",
          "Over some fourteen years he tested a method on everything he could obtain: vegetables, fish, meat, milk and whole partridges.",
          "He tested 'everything he could obtain'.",
        ),
        tfng(
          "Appert correctly understood the reason his method preserved food.",
          "FALSE",
          "It worked, and Appert could not explain why.",
          "He 'could not explain why'.",
        ),
        tfng(
          "Appert was required to publish his method in order to receive the prize.",
          "TRUE",
          "Appert was awarded the prize in 1810, on condition that he publish his method rather than patent it.",
          "The award came 'on condition that he publish his method'.",
        ),
        tfng(
          "Appert became wealthy from his preserving factory.",
          "FALSE",
          "His business was not a lasting success: his factory was destroyed during the invasion of France in 1814, and he died poor in 1841.",
          "'He died poor in 1841'.",
        ),
        tfng(
          "Early tin cans could be opened easily by hand.",
          "FALSE",
          "Its one disadvantage was that early cans were built like small boilers, of iron thick enough to need a hammer and chisel to open.",
          "They needed 'a hammer and chisel to open'.",
        ),
        tfng(
          "The writer is convinced that lead from cans caused the deaths of the lost Arctic expedition.",
          "FALSE",
          "It was later suggested that lead solder used to seal them had poisoned the crews, although more recent work has questioned how much difference the lead actually made, and other explanations, including simple starvation and disease, are at least as convincing.",
          "Other explanations are 'at least as convincing'.",
        ),
        noteLine(
          APPERT,
          null,
          "Food is packed into wide-mouthed glass ______",
          "jars",
          "Food was packed into wide-mouthed glass jars, the jars were closed with corks driven in tightly and secured with wire, the seal was covered with wax, and the whole jar was then lowered into a bath of boiling water and heated for a period that depended on what was inside.",
          "It was packed 'into wide-mouthed glass jars'.",
        ),
        noteLine(
          APPERT,
          null,
          "______ are driven in and held with wire, then covered with wax",
          "Corks",
          "Food was packed into wide-mouthed glass jars, the jars were closed with corks driven in tightly and secured with wire, the seal was covered with wax, and the whole jar was then lowered into a bath of boiling water and heated for a period that depended on what was inside.",
          "The jars 'were closed with corks driven in tightly and secured with wire'.",
        ),
        noteLine(
          APPERT,
          null,
          "The sealed jar is heated in a bath of ______ water",
          "boiling",
          "Food was packed into wide-mouthed glass jars, the jars were closed with corks driven in tightly and secured with wire, the seal was covered with wax, and the whole jar was then lowered into a bath of boiling water and heated for a period that depended on what was inside.",
          "It was 'lowered into a bath of boiling water'.",
          { before: [{ text: "The heating time depends on the contents", indent: 0 }] },
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Before Pasteur, spoilage was widely blamed on contact with ______.",
          "air",
          "The common belief was that spoilage was caused by contact with air, and Appert reasoned that his method removed the air and kept it out, which was partly right for the wrong reasons.",
          "Spoilage was blamed on 'contact with air'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Durand's 1810 patent covered vessels of glass, pottery or ______.",
          "tin",
          "An English merchant, Peter Durand, took out a patent in 1810 covering preservation in vessels of glass, pottery or tin, and sold it on to two engineers who opened a canning works in London.",
          "The patent covered 'glass, pottery or tin'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Modern retorts heat sealed containers under ______.",
          "pressure",
          "The technique has changed less than might be expected: modern retorts heat sealed containers under pressure, and the timings are calculated rather than guessed, but the principle is the one a confectioner arrived at by trial and error in a workshop outside Paris.",
          "They 'heat sealed containers under pressure'.",
        ),
      ],
    },
    {
      key: "t38-p2-desalination",
      title: "Drinking the Sea",
      topic: "the costs and benefits of taking the salt out of sea water",
      difficulty: 6,
      body: `Taking the salt out of sea water is an old ambition and a recent industry. Sailors boiled sea water and caught the steam for centuries, and the first large plants, built in the Gulf states in the 1960s, worked on the same principle: heat the water, collect what evaporates, leave the salt behind. Distillation is simple and tolerant of dirty water, and where fuel is cheap and waste heat from power stations is available it still makes sense. It is also hungry, and almost everything built in the last twenty years works another way.

That way is reverse osmosis. Sea water is forced at high pressure against membranes with pores so fine that water molecules pass and dissolved salts largely do not. The idea is old, but the membranes are not: successive generations have become more permeable and more resistant to fouling, and the energy needed to produce a cubic metre of fresh water has fallen from around ten kilowatt hours to three or less in the best plants. Devices that recover the pressure from the rejected stream and apply it to incoming water account for much of that improvement. Process engineer Dr Nadia Haddad has worked on plants in three countries and regards the change as decisive. "We are within sight of the physical minimum," she says. "The remaining savings will be small, and they will come from pumps and pipework rather than from chemistry."

Energy is still the main cost, which means desalinated water is expensive water, and that its price depends on the local cost of electricity. This has shaped where the technology is used. Israel now draws a large share of its household supply from a handful of plants on the Mediterranean coast; Singapore treats desalination as one of several sources alongside imported, recycled and collected water; Spain built extensively after the droughts of the 2000s; several Californian schemes have been rejected on cost and environmental grounds. Water economist Dr Erik Lindqvist argues that the technology's role is usually misunderstood. "It is a very good insurance policy and a very poor substitute for not wasting water," he says. "A city that loses a third of its supply through leaking pipes should fix the pipes first."

The environmental objections concentrate on two points. The first is what comes out: for every litre of drinking water, roughly a litre of brine is produced, carrying about twice the salt of sea water along with the chemicals used to clean the membranes. Discharged carelessly through a single pipe, it sinks, spreads along the bottom and can smother the animals living on the seabed. Marine ecologist Dr Priya Raghunathan has surveyed discharge sites around the Arabian Gulf and describes the damage as real but manageable. "It is a plume problem, not a poison problem," she says. "Mixed with the cooling water from a power station, or released through a diffuser across a wide area, it disperses to background levels within a few hundred metres."

The second objection concerns what goes in. An open intake pipe draws in whatever is floating past, including fish eggs and the larvae of countless species, which are killed on the screens or inside the plant. The remedy is to take water from beneath the seabed, letting the sand act as a filter, which protects the larvae and delivers cleaner water to the membranes, reducing the chemicals needed later. It costs more to build and is not possible on every coast.

Then there is carbon. A plant running on fossil-fuelled electricity converts one scarce resource into another, and critics have long pointed out the absurdity of burning gas to replace water lost to a drought made worse by burning gas. Newer plants are being built with dedicated solar or wind supply, and some are designed to run harder when renewable output is high and to idle when it is not, using large reservoirs of finished water as the storage that the electricity grid lacks. Environmental analyst Dr Miguel Torres regards this as the most promising development in the field. "Desalination is a flexible load," he says. "That makes it a friend of a renewable grid rather than an enemy."

At the small end, the same membranes now appear in units the size of a shipping container, powered by solar panels and serving a village or a refugee camp. They are not cheap, but they are cheaper than tankers, and they work where no pipeline exists. Between those units and the vast coastal plants lies a technology that has quietly become ordinary, and that most of the world still hopes not to need.`,
      questions: [
        fromList(
          "matching_features",
          WATER_PEOPLE,
          "Future efficiency gains will be modest and mechanical.",
          "Nadia Haddad",
          '"The remaining savings will be small, and they will come from pumps and pipework rather than from chemistry."',
          "Haddad: savings will come 'from pumps and pipework'.",
        ),
        fromList(
          "matching_features",
          WATER_PEOPLE,
          "Repairing existing supply systems should come first.",
          "Erik Lindqvist",
          '"A city that loses a third of its supply through leaking pipes should fix the pipes first."',
          "Lindqvist: 'fix the pipes first'.",
        ),
        fromList(
          "matching_features",
          WATER_PEOPLE,
          "The discharge is damaging where it settles, not toxic in itself.",
          "Priya Raghunathan",
          '"It is a plume problem, not a poison problem," she says.',
          "Raghunathan: 'a plume problem, not a poison problem'.",
        ),
        fromList(
          "matching_features",
          WATER_PEOPLE,
          "Plants that can vary their output suit a grid built on renewables.",
          "Miguel Torres",
          '"Desalination is a flexible load," he says. "That makes it a friend of a renewable grid rather than an enemy."',
          "Torres: 'a flexible load'.",
        ),
        fromList(
          "matching_features",
          WATER_PEOPLE,
          "Desalination is better regarded as insurance than as a solution.",
          "Erik Lindqvist",
          '"It is a very good insurance policy and a very poor substitute for not wasting water," he says.',
          "Lindqvist: 'a very good insurance policy'.",
        ),
        fromList(
          "summary_completion",
          WATER_BANK,
          "The oldest plants worked by ______, heating water and collecting the steam.",
          "distillation",
          "Distillation is simple and tolerant of dirty water, and where fuel is cheap and waste heat from power stations is available it still makes sense.",
          "The old method is distillation.",
        ),
        fromList(
          "summary_completion",
          WATER_BANK,
          "Reverse osmosis forces sea water against fine ______.",
          "membranes",
          "Sea water is forced at high pressure against membranes with pores so fine that water molecules pass and dissolved salts largely do not.",
          "It is forced 'against membranes'.",
        ),
        fromList(
          "summary_completion",
          WATER_BANK,
          "Recovering ______ from the rejected stream cut the power needed.",
          "pressure",
          "Devices that recover the pressure from the rejected stream and apply it to incoming water account for much of that improvement.",
          "Devices 'recover the pressure from the rejected stream'.",
        ),
        fromList(
          "summary_completion",
          WATER_BANK,
          "The main cost of the process is ______.",
          "energy",
          "Energy is still the main cost, which means desalinated water is expensive water, and that its price depends on the local cost of electricity.",
          "'Energy is still the main cost'.",
        ),
        fromList(
          "summary_completion",
          WATER_BANK,
          "The ______ left behind carries about twice the salt of sea water.",
          "brine",
          "The first is what comes out: for every litre of drinking water, roughly a litre of brine is produced, carrying about twice the salt of sea water along with the chemicals used to clean the membranes.",
          "The brine carries 'about twice the salt of sea water'.",
        ),
        fromList(
          "summary_completion",
          WATER_BANK,
          "Open intakes kill fish eggs and ______ on their screens.",
          "larvae",
          "An open intake pipe draws in whatever is floating past, including fish eggs and the larvae of countless species, which are killed on the screens or inside the plant.",
          "Eggs and 'larvae' are killed on the screens.",
        ),
        pickTwo(
          WATER_STEM,
          WATER_WAYS,
          "A or B",
          "The remedy is to take water from beneath the seabed, letting the sand act as a filter, which protects the larvae and delivers cleaner water to the membranes, reducing the chemicals needed later.",
          "A is described: water is drawn from beneath the seabed.",
        ),
        pickTwo(
          WATER_STEM,
          WATER_WAYS,
          "A or B",
          '"Mixed with the cooling water from a power station, or released through a diffuser across a wide area, it disperses to background levels within a few hundred metres."',
          "B is described: brine mixed with other flows disperses. C, D and E are not mentioned.",
        ),
      ],
    },
    {
      key: "t38-p3-hygiene-hypothesis",
      title: "Too Clean for Our Own Good?",
      topic: "the changing explanation for the rise in allergies",
      difficulty: 7,
      body: `A) In 1989 a British epidemiologist published a short paper with an unexpected finding. Children from large families, and particularly those with several older siblings, were less likely to develop hay fever than children from small ones. He suggested that infections passed around by brothers and sisters in early childhood might somehow protect against allergic disease, and that rising standards of household cleanliness might explain why such diseases were becoming more common. The press named it the hygiene hypothesis, and the name has caused trouble ever since.

B) The trouble is that the explanation turned out to be wrong in its details even as the underlying observation held up. Catching more colds does not protect a child against allergies; some childhood infections make asthma worse. What the evidence has come to support is something different: that the developing immune system expects to meet a particular set of organisms — the harmless bacteria of soil, animals and untreated water, and the parasites that lived in nearly every human gut until recently — and that growing up without them leaves it poorly calibrated. Immunologist Professor Johan Meyer prefers the alternative name the field now uses. "It was never about dirt," he says. "It is about old friends we have stopped meeting."

C) The strongest human evidence comes from farms. Children raised on traditional dairy farms, in contact with cattle and unprocessed milk, have markedly lower rates of asthma and hay fever than children in the same regions who are not. A widely reported comparison of two North American farming communities made the point sharply: two groups with similar ancestry and similar diets differed enormously in asthma rates, and the community whose children spent their days in and around barns had a small fraction of the asthma seen in the community that farmed with modern industrial methods. Dust from the barns, when given to laboratory mice, protected them against an allergic response.

D) A parallel line of work concerns the community of microbes in the gut. Infants delivered by caesarean section, or given antibiotics in their first months, or fed formula rather than breast milk, acquire a measurably different set of gut bacteria, and each of these factors has been associated with a modestly raised risk of allergic disease later. Microbiologist Dr Ana Ferreira cautions that association is doing a lot of work in that sentence. "Every one of those things happens to families who differ in a dozen other ways," she says. "We are very good at finding these patterns and very bad at proving what causes what."

E) The practical misreading of all this has been a problem in itself. A theory that began as an observation about family size has been used to argue that homes should be dirtier, that handwashing is unnecessary or that childhood vaccination is somehow unnatural, none of which follows. Hygiene in kitchens, hospitals and drinking water prevents diseases that killed enormous numbers of children within living memory, and no serious researcher proposes reversing it. Public health physician Dr Lena Brandt puts the distinction plainly. "Clean water and clean hands are not the problem," she says. "A childhood spent entirely indoors, on antibiotics, might be."

F) Attempts to turn the idea into treatment have mostly disappointed. Trials in which patients with inflammatory bowel disease or allergies were deliberately infected with harmless parasitic worms produced striking results in small early studies and little in larger controlled ones. Work on farm dust has identified specific bacterial components that dampen allergic responses in animals, and these are being developed as possible sprays or supplements, but nothing has reached routine use. The most successful intervention to come out of this general area is simpler and concerns timing rather than microbes: introducing peanut early, rather than avoiding it, sharply reduces the chance of peanut allergy in high-risk infants, a result that overturned previous advice.

G) Where the field has arrived is less dramatic than the headlines of thirty years ago and more useful. Allergic disease is not caused by cleanliness; it arises from a set of changes in how children live — fewer animals, fewer siblings, more antibiotics, more time indoors, different food — that together alter the education of the immune system. Allergy specialist Dr Samir Qureshi points out that the rise has also begun to level off in several wealthy countries while continuing in cities elsewhere, which fits an explanation based on how people live rather than on one about germs alone. The next stage, he suggests, will be identifying which exposures matter and at what age, so that something can be recommended that is more specific than the advice to get a dog.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the original finding about brothers and sisters",
          "A",
          "Children from large families, and particularly those with several older siblings, were less likely to develop hay fever than children from small ones.",
          "Paragraph A: the 1989 sibling finding.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison between two farming communities",
          "C",
          "A widely reported comparison of two North American farming communities made the point sharply: two groups with similar ancestry and similar diets differed enormously in asthma rates, and the community whose children spent their days in and around barns had a small fraction of the asthma seen in the community that farmed with modern industrial methods.",
          "Paragraph C: the two communities.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a warning that the theory has been used to justify harmful conclusions",
          "E",
          "A theory that began as an observation about family size has been used to argue that homes should be dirtier, that handwashing is unnecessary or that childhood vaccination is somehow unnatural, none of which follows.",
          "Paragraph E lists the misuses.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of advice being reversed by a trial",
          "F",
          "The most successful intervention to come out of this general area is simpler and concerns timing rather than microbes: introducing peanut early, rather than avoiding it, sharply reduces the chance of peanut allergy in high-risk infants, a result that overturned previous advice.",
          "Paragraph F: early peanut introduction 'overturned previous advice'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to rates that have stopped rising in some countries",
          "G",
          "Allergy specialist Dr Samir Qureshi points out that the rise has also begun to level off in several wealthy countries while continuing in cities elsewhere, which fits an explanation based on how people live rather than on one about germs alone.",
          "Paragraph G: the rise 'has begun to level off'.",
        ),
        fromList(
          "matching_features",
          ALLERGY_PEOPLE,
          "The popular name for the idea was misleading from the start.",
          "Johan Meyer",
          '"It was never about dirt," he says. "It is about old friends we have stopped meeting."',
          "Meyer: 'It was never about dirt.'",
        ),
        fromList(
          "matching_features",
          ALLERGY_PEOPLE,
          "Families differing in one factor usually differ in many.",
          "Ana Ferreira",
          '"Every one of those things happens to families who differ in a dozen other ways," she says.',
          "Ferreira on confounded comparisons.",
        ),
        fromList(
          "matching_features",
          ALLERGY_PEOPLE,
          "Basic hygiene measures are not what has driven allergy upwards.",
          "Lena Brandt",
          '"Clean water and clean hands are not the problem," she says. "A childhood spent entirely indoors, on antibiotics, might be."',
          "Brandt: 'Clean water and clean hands are not the problem.'",
        ),
        fromList(
          "matching_features",
          ALLERGY_PEOPLE,
          "Future advice will have to name particular exposures and ages.",
          "Samir Qureshi",
          "The next stage, he suggests, will be identifying which exposures matter and at what age, so that something can be recommended that is more specific than the advice to get a dog.",
          "Qureshi on identifying 'which exposures matter and at what age'.",
        ),
        fromList(
          "matching_features",
          ALLERGY_PEOPLE,
          "Researchers find patterns more easily than they establish causes.",
          "Ana Ferreira",
          '"We are very good at finding these patterns and very bad at proving what causes what."',
          "Ferreira: good at patterns, bad at causes.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The 1989 paper concerned children's risk of developing ______.",
          "hay fever",
          "Children from large families, and particularly those with several older siblings, were less likely to develop hay fever than children from small ones.",
          "It was about the risk of 'hay fever'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The immune system expects to meet harmless bacteria of soil, animals and untreated ______.",
          "water",
          "What the evidence has come to support is something different: that the developing immune system expects to meet a particular set of organisms — the harmless bacteria of soil, animals and untreated water, and the parasites that lived in nearly every human gut until recently — and that growing up without them leaves it poorly calibrated.",
          "The list ends with 'untreated water'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Barn ______ protected laboratory mice against an allergic response.",
          "dust",
          "Dust from the barns, when given to laboratory mice, protected them against an allergic response.",
          "'Dust from the barns… protected them'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Trials that deliberately infected patients with parasitic ______ produced little in larger studies.",
          "worms",
          "Trials in which patients with inflammatory bowel disease or allergies were deliberately infected with harmless parasitic worms produced striking results in small early studies and little in larger controlled ones.",
          "The trials used 'harmless parasitic worms'.",
        ),
      ],
    },
  ],
};
