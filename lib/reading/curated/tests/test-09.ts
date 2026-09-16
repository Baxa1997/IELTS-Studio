import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · flow-chart -------------------------------------------------------

const LAYING = {
  title: "How the 1858 cable was laid",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · people, word bank, choose TWO ------------------------------------

const HYDROGEN_PEOPLE = ["Mira Kowalczyk", "Lars Eriksson", "Aisha Bello", "Hugh Parnell"];
const HYDROGEN_BANK = [
  "grey",
  "green",
  "blue",
  "electrolysis",
  "efficiency",
  "oxygen",
  "ammonia",
  "brittle",
  "pressure",
];
const SETBACKS_STEM =
  "Which TWO of the following are given as reasons why hydrogen has been used less than expected in some areas?";
const SETBACKS = [
  "Refuelling stations closed because too few vehicles used them.",
  "Hydrogen is more dangerous to handle than petrol.",
  "Trials of heating homes were cancelled after local opposition.",
  "There is not enough water to produce it.",
  "Hydrogen cannot be stored for long periods.",
];

// ---- Passage 3 · lettered paragraphs and people -----------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const DIG_PEOPLE = ["Klaus Schmidt", "Leyla Demir", "Marcus Reinholt", "Paul Kerrigan"];

export const TEST_09: CuratedTest = {
  key: "full-test-09",
  targetBand: 8,
  passages: [
    {
      key: "t09-p1-atlantic-cable",
      title: "A Wire Across the Ocean",
      topic: "the first telegraph cable across the Atlantic",
      difficulty: 7,
      body: `In the mid-nineteenth century, a message sent from London to New York took around ten days to arrive, carried by steamship across the Atlantic. News of important events, such as changes in prices or the outcome of battles, therefore reached the other side of the ocean long after it had happened. On land, however, the electric telegraph was already transforming communication, allowing messages to travel almost instantly along wires. The challenge was to connect the two continents by laying a cable across the ocean floor, a distance of more than 3,000 kilometres through waters that in places were several kilometres deep. Many engineers considered the idea impossible.

The project was driven largely by an American businessman, Cyrus Field, who had made a fortune in the paper trade. Field had no technical training, but he was a persuasive organiser who raised money from investors in both Britain and the United States. He crossed the Atlantic many times to promote the scheme and to keep investors interested. In 1856 he helped to found the Atlantic Telegraph Company, which set out to lay the cable within a year. The British and American governments each provided a warship to carry the cable, since no single ship at the time was large enough to hold all of it.

Making the cable was itself a major undertaking. At its centre were seven strands of copper wire, which carried the electric signal. These were covered with layers of gutta-percha, a natural rubber-like material from trees in South-East Asia that had proved to be an excellent insulator under water. The insulated core was then wrapped in tarred hemp and surrounded by a protective layer of iron wires. The complete cable weighed around 2,500 tonnes. Manufacturing it took several months and involved factories in two different cities.

The first attempts ended in failure. In 1857, the cable snapped after several hundred kilometres had been laid, and it was lost on the seabed. Deep water made the work especially dangerous, since the cable could snap under its own weight if it was released too quickly. A second expedition in 1858 tried a new method: the two ships met in the middle of the ocean, joined the two halves of the cable together and then sailed in opposite directions towards Ireland and Newfoundland. The cable broke several times before a further attempt finally succeeded in August 1858.

The celebrations were enormous. That month, Queen Victoria sent a message of congratulation to the American President, James Buchanan. Her message of just under a hundred words took around sixteen hours to transmit, because the signals arriving at the other end were so weak that operators struggled to detect them. In New York, fireworks set part of City Hall on fire. Church bells were rung in several American cities, and souvenirs made from spare pieces of cable were sold to the public. Yet within a few weeks, the signals became weaker still, and in September the cable stopped working altogether. Public confidence in the project collapsed, and some newspapers even suggested that the whole thing had been a hoax.

The failure was partly the result of a scientific disagreement. The company's chief electrician, Wildman Whitehouse, believed that stronger signals required higher voltages, and he applied increasingly powerful currents to the cable. The physicist William Thomson, who later became Lord Kelvin, argued that this approach was mistaken and that sensitive instruments able to detect very weak currents were the answer. Thomson had developed such an instrument, the mirror galvanometer, in which a tiny mirror attached to a magnet reflected a beam of light that moved in response to small currents. It is widely believed that Whitehouse's high voltages damaged the cable's insulation.

It took eight more years, and the American Civil War, before a lasting connection was made. In 1866, the Great Eastern, then the largest ship in the world, laid a new cable that had been designed using Thomson's scientific advice. The ship was large enough to carry the entire cable at once. The crew even managed to recover and complete a cable that had been lost the previous year. From then on, messages crossed the Atlantic in minutes rather than days, changing trade, journalism and diplomacy for ever. Field himself was celebrated as a hero on both sides of the Atlantic. Within a few decades, a network of undersea cables connected most parts of the world.`,
      questions: [
        tfng(
          "Before the cable was laid, a message from London to New York took around ten days.",
          "TRUE",
          "In the mid-nineteenth century, a message sent from London to New York took around ten days to arrive, carried by steamship across the Atlantic.",
          "Messages 'took around ten days to arrive' by steamship.",
        ),
        tfng(
          "Cyrus Field had trained as an engineer.",
          "FALSE",
          "Field had no technical training, but he was a persuasive organiser who raised money from investors in both Britain and the United States.",
          "Field 'had no technical training'.",
        ),
        tfng(
          "Two ships were needed because no single ship could carry the whole cable.",
          "TRUE",
          "The British and American governments each provided a warship to carry the cable, since no single ship at the time was large enough to hold all of it.",
          "No ship 'was large enough to hold all of it'.",
        ),
        tfng(
          "The cable lost in 1857 was later raised from the seabed.",
          "NOT GIVEN",
          "",
          "The 1857 cable 'was lost on the seabed'; a different cable, lost in 1865, was recovered. Nothing is said about recovering the 1857 one.",
        ),
        tfng(
          "Queen Victoria's message took less than an hour to send.",
          "FALSE",
          "Her message of just under a hundred words took around sixteen hours to transmit, because the signals arriving at the other end were so weak that operators struggled to detect them.",
          "It took 'around sixteen hours to transmit'.",
        ),
        tfng(
          "Whitehouse and Thomson agreed about how to strengthen the signals.",
          "FALSE",
          "The physicist William Thomson, who later became Lord Kelvin, argued that this approach was mistaken and that sensitive instruments able to detect very weak currents were the answer.",
          "Thomson thought Whitehouse's approach 'was mistaken'.",
        ),
        tfng(
          "The 1866 cable cost less to make than the 1858 cable.",
          "NOT GIVEN",
          "",
          "The passage does not compare the costs of the two cables.",
        ),
        noteLine(
          LAYING,
          null,
          "The two ships met in the ______ of the ocean",
          "middle",
          "A second expedition in 1858 tried a new method: the two ships met in the middle of the ocean, joined the two halves of the cable together and then sailed in opposite directions towards Ireland and Newfoundland.",
          "The ships 'met in the middle of the ocean'.",
          { before: [{ text: "Each ship carried part of the cable", indent: 0 }] },
        ),
        noteLine(
          LAYING,
          null,
          "The two ______ of the cable were joined",
          "halves",
          "A second expedition in 1858 tried a new method: the two ships met in the middle of the ocean, joined the two halves of the cable together and then sailed in opposite directions towards Ireland and Newfoundland.",
          "They 'joined the two halves of the cable together'.",
        ),
        noteLine(
          LAYING,
          null,
          "The ships sailed in ______ directions towards Ireland and Newfoundland",
          "opposite",
          "A second expedition in 1858 tried a new method: the two ships met in the middle of the ocean, joined the two halves of the cable together and then sailed in opposite directions towards Ireland and Newfoundland.",
          "They 'sailed in opposite directions'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The copper strands were insulated with layers of ______, a material from trees.",
          "gutta-percha",
          "These were covered with layers of gutta-percha, a natural rubber-like material from trees in South-East Asia that had proved to be an excellent insulator under water.",
          "The insulator was 'gutta-percha', a material from trees.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The outer protective layer of the cable was made of ______.",
          "iron wires",
          "The insulated core was then wrapped in tarred hemp and surrounded by a protective layer of iron wires.",
          "The protective layer was 'of iron wires'. Tarred hemp was an inner wrapping.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In Thomson's instrument, a tiny mirror reflected a ______ of light.",
          "beam",
          "Thomson had developed such an instrument, the mirror galvanometer, in which a tiny mirror attached to a magnet reflected a beam of light that moved in response to small currents.",
          "The mirror 'reflected a beam of light'.",
        ),
      ],
    },
    {
      key: "t09-p2-green-hydrogen",
      title: "The Hydrogen Question",
      topic: "where green hydrogen can and cannot help cut emissions",
      difficulty: 8,
      body: `Hydrogen is the most abundant element in the universe, and when it is used as a fuel, the only direct product is water. For decades, these properties have made it the subject of ambitious predictions about a future in which cars, homes and factories would all run on hydrogen. The idea of a hydrogen economy was popular in the 1970s and again around the year 2000. Most of those predictions did not come true. Yet interest has returned strongly in recent years, as governments search for ways to cut emissions from industries that are difficult to power with electricity alone.

The difficulty is that almost no pure hydrogen exists naturally on Earth in a convenient form, so it must be produced. Today, most of the hydrogen used worldwide is made from natural gas or coal, in processes that release large amounts of carbon dioxide. This is sometimes called grey hydrogen. It can also be produced from natural gas if the carbon dioxide is captured and stored underground, which is often called blue hydrogen. So-called green hydrogen, by contrast, is produced by using electricity from renewable sources to split water into hydrogen and oxygen, a process known as electrolysis. Green hydrogen currently accounts for only a tiny fraction of global production, largely because it is considerably more expensive.

Energy analyst Dr Mira Kowalczyk argues that the main obstacle is not the technology itself but its efficiency. Every time energy is converted from one form to another, some is lost. Producing hydrogen by electrolysis, compressing or cooling it for storage and then converting it back into electricity or motion wastes a large share of the original energy. "If you can use electricity directly, you almost always should," she says. "Hydrogen makes sense only where direct electrification is impractical."

Such cases do exist. Steelmaking, for example, traditionally depends on coal, not only as a source of heat but as a chemical ingredient that removes oxygen from iron ore. Hydrogen can perform the same chemical role, releasing water instead of carbon dioxide. Engineer Lars Eriksson, who has worked on a pilot plant producing steel with hydrogen, believes the technology is technically proven but warns that scaling it up will require enormous quantities of cheap renewable electricity. The same applies to the production of fertilisers, which already uses large amounts of hydrogen made from natural gas.

Transport is more contested. Hydrogen fuel-cell cars have been available for years, but sales remain very small, and many refuelling stations have closed because too few vehicles used them. Transport economist Dr Aisha Bello points out that battery-electric cars have improved and fallen in price so quickly that hydrogen cars now face an almost impossible task. For heavy trucks, long-distance shipping and aviation, however, the picture is less clear, since batteries heavy enough to power them over long distances could take up much of their carrying capacity. Some shipping companies are therefore exploring fuels made from hydrogen, such as ammonia.

Heating homes with hydrogen has proved especially controversial. Some gas companies have promoted the idea of converting existing gas networks, arguing that this would avoid the disruption of installing new heating systems. Several trials, however, have been cancelled or scaled back after opposition from residents and doubts about costs. Building scientist Professor Hugh Parnell concludes that heat pumps, which use electricity directly, are likely to be far cheaper for most households. "Using hydrogen to heat homes is like using a racing car to deliver the post," he says.

Storage and transport present further challenges. Hydrogen is the lightest element, which means it takes up a great deal of space unless it is compressed to very high pressures or cooled to extremely low temperatures. It can also make some metals brittle, so existing pipelines may need to be modified. On the other hand, hydrogen can be stored for long periods, which could make it useful for balancing electricity systems that depend on wind and solar power. Kowalczyk sees this as one of its most promising roles.

The debate over hydrogen is therefore less about whether it has a future than about where that future lies. Governments have announced large subsidies, and many new projects are being planned, although a number have been delayed or abandoned as costs have risen. The challenge for policymakers is to direct limited supplies of clean hydrogen towards the uses where it offers the greatest benefit, rather than spreading it thinly across every sector that has shown an interest. Bello believes that governments should publish clear priorities so that companies know which uses are likely to receive support.`,
      questions: [
        fromList(
          "matching_features",
          HYDROGEN_PEOPLE,
          "Hydrogen should be used only where electricity cannot easily be used directly.",
          "Mira Kowalczyk",
          '"Hydrogen makes sense only where direct electrification is impractical."',
          "Kowalczyk: hydrogen 'makes sense only where direct electrification is impractical'.",
        ),
        fromList(
          "matching_features",
          HYDROGEN_PEOPLE,
          "A proven way of making a material with hydrogen will need vast amounts of cheap clean power.",
          "Lars Eriksson",
          "Engineer Lars Eriksson, who has worked on a pilot plant producing steel with hydrogen, believes the technology is technically proven but warns that scaling it up will require enormous quantities of cheap renewable electricity.",
          "Eriksson says hydrogen steelmaking is proven but needs 'enormous quantities of cheap renewable electricity'.",
        ),
        fromList(
          "matching_features",
          HYDROGEN_PEOPLE,
          "Hydrogen cars are unlikely to compete successfully with battery cars.",
          "Aisha Bello",
          "Transport economist Dr Aisha Bello points out that battery-electric cars have improved and fallen in price so quickly that hydrogen cars now face an almost impossible task.",
          "Bello: hydrogen cars 'now face an almost impossible task'.",
        ),
        fromList(
          "matching_features",
          HYDROGEN_PEOPLE,
          "Another heating technology is likely to cost most households far less.",
          "Hugh Parnell",
          "Building scientist Professor Hugh Parnell concludes that heat pumps, which use electricity directly, are likely to be far cheaper for most households.",
          "Parnell: heat pumps 'are likely to be far cheaper for most households'.",
        ),
        fromList(
          "matching_features",
          HYDROGEN_PEOPLE,
          "Governments should make clear which uses of hydrogen they will support.",
          "Aisha Bello",
          "Bello believes that governments should publish clear priorities so that companies know which uses are likely to receive support.",
          "Bello wants governments to 'publish clear priorities'.",
        ),
        fromList(
          "summary_completion",
          HYDROGEN_BANK,
          "Most hydrogen today is made from fossil fuels and is known as ______ hydrogen.",
          "grey",
          "This is sometimes called grey hydrogen.",
          "Hydrogen from natural gas or coal 'is sometimes called grey hydrogen'. Blue hydrogen captures the carbon, so it doesn't fit.",
        ),
        fromList(
          "summary_completion",
          HYDROGEN_BANK,
          "Hydrogen made with renewable electricity is produced through ______.",
          "electrolysis",
          "So-called green hydrogen, by contrast, is produced by using electricity from renewable sources to split water into hydrogen and oxygen, a process known as electrolysis.",
          "Splitting water with electricity is 'known as electrolysis'.",
        ),
        fromList(
          "summary_completion",
          HYDROGEN_BANK,
          "According to one analyst, the main problem with hydrogen is its ______.",
          "efficiency",
          "Energy analyst Dr Mira Kowalczyk argues that the main obstacle is not the technology itself but its efficiency.",
          "The main obstacle is 'not the technology itself but its efficiency'.",
        ),
        fromList(
          "summary_completion",
          HYDROGEN_BANK,
          "In steelmaking, the chemical job of removing ______ from iron ore can be done by hydrogen.",
          "oxygen",
          "Steelmaking, for example, traditionally depends on coal, not only as a source of heat but as a chemical ingredient that removes oxygen from iron ore.",
          "Coal 'removes oxygen from iron ore', and hydrogen 'can perform the same chemical role'.",
        ),
        fromList(
          "summary_completion",
          HYDROGEN_BANK,
          "Some shipping companies are looking at hydrogen-based fuels such as ______.",
          "ammonia",
          "Some shipping companies are therefore exploring fuels made from hydrogen, such as ammonia.",
          "They are exploring fuels 'such as ammonia'.",
        ),
        fromList(
          "summary_completion",
          HYDROGEN_BANK,
          "Hydrogen can make some metals ______, so pipelines may need changing.",
          "brittle",
          "It can also make some metals brittle, so existing pipelines may need to be modified.",
          "Hydrogen 'can also make some metals brittle'.",
        ),
        pickTwo(
          SETBACKS_STEM,
          SETBACKS,
          "A or C",
          "Hydrogen fuel-cell cars have been available for years, but sales remain very small, and many refuelling stations have closed because too few vehicles used them.",
          "A is correct: stations 'closed because too few vehicles used them'. B and D are never mentioned.",
        ),
        pickTwo(
          SETBACKS_STEM,
          SETBACKS,
          "A or C",
          "Several trials, however, have been cancelled or scaled back after opposition from residents and doubts about costs.",
          "C is correct: heating trials were cancelled 'after opposition from residents'. E is contradicted — hydrogen 'can be stored for long periods'.",
        ),
      ],
    },
    {
      key: "t09-p3-gobekli-tepe",
      title: "Temples Before Farms?",
      topic: "what Göbekli Tepe reveals about the origins of civilisation",
      difficulty: 8,
      body: `A) On a hill in south-eastern Turkey, archaeologists have uncovered one of the most surprising sites of the ancient world. Göbekli Tepe, which covers an area of around nine hectares, consists of large circular and oval enclosures surrounded by massive T-shaped stone pillars, some more than five metres tall and weighing several tonnes. Many of the pillars are carved with images of animals, including foxes, snakes, wild boar and birds of prey. Some pillars also carry carvings of arms and hands, suggesting that they may represent human or supernatural figures. What makes the site extraordinary is its age: its oldest structures were built around 11,500 years ago, thousands of years before the invention of writing, the wheel or metal tools.

B) The site had been noted by researchers in the 1960s, but its significance was not recognised at the time, and some of the stones were mistaken for medieval gravestones. Systematic excavations began in 1995 under the German archaeologist Klaus Schmidt, who worked there until his death in 2014. His team excavated several of the enclosures and documented their pillars in detail. Schmidt quickly concluded that the enclosures were not houses. Because he found no evidence of ordinary domestic life, he argued that Göbekli Tepe was a ceremonial centre, visited by groups of hunter-gatherers who came together for rituals and feasts.

C) This interpretation challenged a long-standing view of how civilisation began. It had generally been assumed that people first settled down to farm, and that the surplus food farming produced then allowed them to build monuments and develop complex religions. Schmidt suggested the reverse: the need to gather large numbers of people at a sacred site might have encouraged the development of farming, in order to feed them. "First came the temple, then the city," he famously remarked. The theory attracted wide attention beyond archaeology, appearing in newspapers and television documentaries around the world. Some scholars welcomed the idea, while others doubted that hunter-gatherers could have built such structures.

D) More recent research has complicated this picture. Excavations since Schmidt's death have uncovered evidence of rainwater collection systems, tools for grinding grain and structures that may have been dwellings. Analysis of animal bones also shows that large quantities of wild gazelle and other game were eaten at the site. Archaeologist Dr Leyla Demir, who has worked at similar sites in the region, believes that people lived at Göbekli Tepe, at least for part of the year. "The idea of a temple standing alone in an empty landscape no longer fits the evidence," she says. In her view, the site was a settlement in which ritual played an important part, rather than a purely religious centre.

E) Other discoveries in the region support the view that Göbekli Tepe was not unique. Several nearby sites contain similar T-shaped pillars and carvings, and some are now being excavated. Researchers have also used ground-penetrating radar to identify buried structures that have not yet been excavated. Archaeologist Professor Marcus Reinholt suggests that the whole region may have been home to a network of communities sharing a common set of beliefs and symbols. He cautions, however, that only a small proportion of Göbekli Tepe itself has been excavated, and that conclusions drawn from such a limited sample may prove premature.

F) The question of how the pillars were made and moved has also attracted attention. They were carved from the limestone bedrock nearby using stone tools, and a quarry containing an unfinished pillar has been found close to the site. Experiments have shown that stone tools of the kind found at the site can shape limestone surprisingly efficiently. Engineer Dr Paul Kerrigan estimates that moving a pillar of this size would have required the cooperation of dozens of people, which in turn implies a high level of social organisation. Such cooperation, he argues, is precisely what makes the site so important for understanding early human societies.

G) The enclosures were eventually covered with rubble and soil, which helped to preserve them, although how and why this happened is still debated. Since 2018 it has been listed as a World Heritage Site, and a protective roof now covers the main excavation area. Visitor numbers have grown rapidly since the site became famous, creating new challenges for its protection. Demir believes that the greatest lesson of the site is that people without farming or writing were capable of far more sophisticated achievements than was once assumed. Whether the site was a temple, a village or both, it has already forced archaeologists to rethink the early history of human civilisation.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to stones that were once wrongly identified",
          "B",
          "The site had been noted by researchers in the 1960s, but its significance was not recognised at the time, and some of the stones were mistaken for medieval gravestones.",
          "Paragraph B: some stones 'were mistaken for medieval gravestones'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "evidence that the pillars were produced close to where they stand",
          "F",
          "They were carved from the limestone bedrock nearby using stone tools, and a quarry containing an unfinished pillar has been found close to the site.",
          "Paragraph F: the pillars came from 'the limestone bedrock nearby', and a quarry was found close to the site.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of how the site came to be buried",
          "G",
          "The enclosures were eventually covered with rubble and soil, which helped to preserve them, although how and why this happened is still debated.",
          "Paragraph G: the enclosures 'were eventually covered with rubble and soil'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an account of the traditional view of how civilisation developed",
          "C",
          "It had generally been assumed that people first settled down to farm, and that the surplus food farming produced then allowed them to build monuments and develop complex religions.",
          "Paragraph C sets out the assumed order: farming first, then monuments and religion.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the use of technology to detect structures below the ground",
          "E",
          "Researchers have also used ground-penetrating radar to identify buried structures that have not yet been excavated.",
          "Paragraph E mentions 'ground-penetrating radar'.",
        ),
        fromList(
          "matching_features",
          DIG_PEOPLE,
          "Religious gatherings may have encouraged people to begin farming.",
          "Klaus Schmidt",
          "Schmidt suggested the reverse: the need to gather large numbers of people at a sacred site might have encouraged the development of farming, in order to feed them.",
          "Schmidt suggested that gatherings 'might have encouraged the development of farming'.",
        ),
        fromList(
          "matching_features",
          DIG_PEOPLE,
          "The site was probably somewhere people lived as well as worshipped.",
          "Leyla Demir",
          "In her view, the site was a settlement in which ritual played an important part, rather than a purely religious centre.",
          "Demir: 'a settlement in which ritual played an important part'.",
        ),
        fromList(
          "matching_features",
          DIG_PEOPLE,
          "It may be too early to draw firm conclusions from the parts excavated so far.",
          "Marcus Reinholt",
          "He cautions, however, that only a small proportion of Göbekli Tepe itself has been excavated, and that conclusions drawn from such a limited sample may prove premature.",
          "Reinholt: conclusions from 'such a limited sample may prove premature'.",
        ),
        fromList(
          "matching_features",
          DIG_PEOPLE,
          "Moving the pillars required large numbers of people to work together.",
          "Paul Kerrigan",
          "Engineer Dr Paul Kerrigan estimates that moving a pillar of this size would have required the cooperation of dozens of people, which in turn implies a high level of social organisation.",
          "Kerrigan: it 'would have required the cooperation of dozens of people'.",
        ),
        fromList(
          "matching_features",
          DIG_PEOPLE,
          "People without farming achieved more than was once thought possible.",
          "Leyla Demir",
          "Demir believes that the greatest lesson of the site is that people without farming or writing were capable of far more sophisticated achievements than was once assumed.",
          "Demir again: such people were capable of 'far more sophisticated achievements than was once assumed'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The enclosures are surrounded by massive ______ stone pillars.",
          "T-shaped",
          "Göbekli Tepe, which covers an area of around nine hectares, consists of large circular and oval enclosures surrounded by massive T-shaped stone pillars, some more than five metres tall and weighing several tonnes.",
          "The pillars are 'massive T-shaped stone pillars'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Recent excavations found systems for collecting ______.",
          "rainwater",
          "Excavations since Schmidt's death have uncovered evidence of rainwater collection systems, tools for grinding grain and structures that may have been dwellings.",
          "They found 'rainwater collection systems'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Animal bones show that large quantities of wild ______ were eaten there.",
          "gazelle",
          "Analysis of animal bones also shows that large quantities of wild gazelle and other game were eaten at the site.",
          "'Large quantities of wild gazelle and other game were eaten'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Today a protective ______ covers the main area of excavation.",
          "roof",
          "Since 2018 it has been listed as a World Heritage Site, and a protective roof now covers the main excavation area.",
          "'A protective roof now covers the main excavation area'.",
        ),
      ],
    },
  ],
};
