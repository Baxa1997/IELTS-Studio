import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of food preservation · notes box -------------------

const CAN_NOTES = {
  title: "Opening a tin, by period",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · public health · people and a word bank --------------------

const SALT_PEOPLE = ["Hélène Dubois", "Ravi Menon", "Gizem Aydın", "Charles Mwale"];
const SALT_BANK = [
  "iodine",
  "thyroid",
  "goitre",
  "evaporates",
  "packaging",
  "taste",
  "monopoly",
  "seaweed",
  "bakers",
];

// ---- Passage 3 · industrial history · lettered paragraphs ------------------

const ALUMINIUM_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ALUMINIUM_ENDINGS = [
  "because the metal is bound so tightly to the oxygen in its ore.",
  "which is why the industry settled beside waterfalls and dams.",
  "although the same ore was available on every inhabited continent.",
  "since remelting an old can needs a small fraction of the original energy.",
  "because a light vehicle spends less fuel carrying itself around.",
  "even though the price had already fallen by more than ninety per cent.",
  "which made the metal a gift fit for an emperor rather than a saucepan.",
];

export const TEST_83: CuratedTest = {
  key: "full-test-83",
  targetBand: 5,
  passages: [
    {
      key: "t83-p1-tin-can",
      title: "The Can That Came Before the Opener",
      topic: "a container that was in use for half a century before anyone made a tool to open it",
      difficulty: 4,
      body: `In 1810 a London merchant named Peter Durand was granted a patent for preserving food in vessels of glass, pottery or tin. The idea behind it was not his. A French confectioner, Nicolas Appert, had already shown that food sealed in a glass jar and then heated would keep for months, and had won a prize from his government for the discovery. Neither man knew why the method worked. Appert believed that the heat drove out air, and that air was what spoiled food. The role of microorganisms would not be established for another fifty years. The technique was correct and the explanation was wrong, which is a common enough arrangement in the history of technology.

Durand's contribution was the choice of container. Glass breaks, especially on a ship, and the whole point of preserved food in the early nineteenth century was to feed sailors and soldiers. His patent described a can made of iron coated with a thin layer of tin to stop it rusting. Such a can could be dropped, stacked and carried across the world. Within two years a factory in Bermondsey was supplying the Royal Navy, and by the 1820s canned meat was standard issue on long voyages and on polar expeditions.

These early cans were formidable objects. They were cut and bent by hand from sheet iron nearly as thick as a coin, and the seams were sealed with lead solder. A skilled worker could make perhaps sixty in a day. Each one weighed almost as much empty as the food it held. They were also, famously, extremely difficult to open. The instruction printed on one brand read: "Cut round the top near the outer edge with a chisel and hammer." Sailors used bayonets. Explorers used rocks. The can opener, in anything like the modern form, did not appear until the 1850s, and the familiar rotating-wheel design came in 1870, sixty years after the can itself.

The delay looks absurd until one considers who was using the cans. The early market was almost entirely institutional: navies, armies and expeditions, all of them equipped with strong men and heavy tools, and none of them buying a single can for a domestic kitchen. Nobody designs a convenience for a customer who does not exist. When cans did reach ordinary households, in the second half of the century, it was because the price had fallen, and the price fell because of machinery. Thinner steel replaced thick iron. Presses stamped out ends by the thousand. By 1900 a plant could turn out cans faster than any market could absorb them.

There was one serious problem, and it took a long time to identify. The solder used on the seams contained lead, and lead leached into the food. On a voyage of a few months this mattered little. On expeditions that ate canned food for years it may have mattered a great deal. The lead content of remains from a nineteenth-century Arctic expedition that ended in disaster has been measured and found to be very high, and lead poisoning has been suggested, cautiously, as one contributing cause among several. Modern cans are welded and lined, and lead solder was banned outright.

The can's second life came from a different direction. A tin can is a container that keeps food safe without refrigeration, and for most of the twentieth century that was its whole virtue. As refrigeration and freezing spread, the can looked old-fashioned, and canned food acquired a reputation for being what people ate when they could not afford anything better. What has revived it is the energy accounting. A can needs no power at all once it is filled and sealed, whereas a freezer needs power continuously for as long as the food is kept. Measured over a year, the can is the more frugal container, and by a wide margin.

It is also, in the ordinary sense, recycled. Steel and aluminium cans are separated magnetically or by conductivity at the sorting plant, which is far easier than sorting plastics, and the metal can be melted and rolled again with no loss of quality. The rate at which cans are actually recovered varies enormously between countries, from around a fifth to more than nine-tenths, and the difference is almost entirely a matter of collection systems rather than of the material. The container invented to feed a navy has turned out to be one of the few kinds of packaging that can genuinely go round again.`,
      questions: [
        tfng(
          "Durand was the first person to preserve food by heating it in a sealed container.",
          "FALSE",
          "A French confectioner, Nicolas Appert, had already shown that food sealed in a glass jar and then heated would keep for months, and had won a prize from his government for the discovery.",
          "Appert had shown it already.",
        ),
        tfng(
          "The reason the heating method worked was understood at the time.",
          "FALSE",
          "Neither man knew why the method worked.",
          "'Neither man knew why the method worked.'",
        ),
        tfng(
          "Durand's patent specified iron coated with tin.",
          "TRUE",
          "His patent described a can made of iron coated with a thin layer of tin to stop it rusting.",
          "Iron coated with tin is specified.",
        ),
        tfng(
          "Early cans weighed little compared with their contents.",
          "FALSE",
          "Each one weighed almost as much empty as the food it held.",
          "Empty, it weighed almost as much as the food.",
        ),
        tfng(
          "The rotating-wheel opener appeared decades after the can.",
          "TRUE",
          "The can opener, in anything like the modern form, did not appear until the 1850s, and the familiar rotating-wheel design came in 1870, sixty years after the can itself.",
          "It came 'sixty years after the can itself'.",
        ),
        tfng(
          "Lead poisoning has been established as the sole cause of the Arctic disaster.",
          "FALSE",
          "The lead content of remains from a nineteenth-century Arctic expedition that ended in disaster has been measured and found to be very high, and lead poisoning has been suggested, cautiously, as one contributing cause among several.",
          "It is 'one contributing cause among several'.",
        ),
        tfng(
          "Appert's prize was worth twelve thousand francs.",
          "NOT GIVEN",
          "",
          "The passage mentions a prize but gives no amount.",
        ),
        noteLine(
          CAN_NOTES,
          null,
          "1810s–40s: cut round the top with a ______ and hammer",
          "chisel",
          'The instruction printed on one brand read: "Cut round the top near the outer edge with a chisel and hammer."',
          "The printed instruction names a chisel.",
          { before: [{ text: "How the top was removed:", indent: 0 }] },
        ),
        noteLine(
          CAN_NOTES,
          null,
          "At sea: sailors used a ______",
          "bayonet",
          "Sailors used bayonets.",
          "Sailors used bayonets.",
        ),
        noteLine(
          CAN_NOTES,
          null,
          "On expeditions: explorers used a ______",
          "rock",
          "Explorers used rocks.",
          "Explorers used rocks.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Cans reached ordinary homes once the price fell because of ______.",
          "machinery",
          "When cans did reach ordinary households, in the second half of the century, it was because the price had fallen, and the price fell because of machinery.",
          "The price fell 'because of machinery'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Cans became fashionable again because of the ______ accounting.",
          "energy",
          "What has revived it is the energy accounting.",
          "The energy accounting revived the can.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "How many cans are recovered depends mainly on ______ systems.",
          "collection",
          "The rate at which cans are actually recovered varies enormously between countries, from around a fifth to more than nine-tenths, and the difference is almost entirely a matter of collection systems rather than of the material.",
          "It is 'a matter of collection systems'.",
        ),
      ],
    },
    {
      key: "t83-p2-iodised-salt",
      title: "The Salt That Prevented a Disease",
      topic: "adding a trace of one element to a household staple, and the arguments it caused",
      difficulty: 5,
      body: `The human body needs iodine in quantities so small that a teaspoon spread over a lifetime would be ample. Without it the thyroid gland cannot make the hormones that regulate growth and metabolism. The gland enlarges as it tries, producing the swelling of the neck called goitre, and in a child whose mother was deficient during pregnancy the consequence is permanent damage to the developing brain. Iodine deficiency was, for most of history, the commonest preventable cause of intellectual disability in the world.

The distribution of the problem is geological rather than economic. Iodine is abundant in seawater and in the soils of coastal plains, and it is scarce in mountains and in land that was scraped by glaciers or is regularly flooded, because the element is washed out and carried to the sea. Switzerland, the American Great Lakes, the Himalayas, the Andes and much of central Africa were all severely affected, and the wealth of the country made very little difference.

Hélène Dubois, a historian of nutrition, points out that the remedy was known long before it was adopted. Physicians in the 1820s had identified iodine as the missing factor and had proposed adding it to salt, and the proposal was ignored for almost a century. Her explanation is not scientific conservatism but the absence of any institution with an interest in acting: the disease was chronic rather than epidemic, it fell on rural districts, and nobody's trade was disrupted by it.

The first programmes ran in Switzerland and in Michigan in the 1920s, and the choice of salt as the carrier was deliberate. Almost everybody eats salt; they eat roughly the same small amount of it whatever their income; it is produced in a few large plants rather than in millions of kitchens; and the addition costs a few cents per person per year. Ravi Menon, an economist who studies such programmes, describes salt iodisation as the cheapest health intervention ever devised in terms of the harm avoided, and notes that the cost is so low that arguing about who should pay it wastes more money than the programme does.

The technical obstacles are real but small. Iodine added as iodide evaporates from damp salt stored in the heat, so the more stable iodate is used instead, and the salt must be kept in sealed packaging rather than open sacks. Gizem Aydın, a food chemist, has measured losses along the supply chain in hot climates and found that salt leaving a plant with the correct concentration can arrive in a village kitchen with almost none, purely through storage in the wrong container. She regards the packaging as the part of the programme most often skimped and the part most worth spending on.

Opposition has come from two directions. The first is the salt industry in countries where production is fragmented among thousands of small producers who cannot easily be equipped or inspected; in such places iodisation has advanced only where the government has effectively created a monopoly on wholesale distribution. The second is a suspicion, recurrent and hard to argue with, that something has been added to food without permission. Charles Mwale, who has run public information campaigns, argues that the way to answer it is not statistics but the visible fact of the disease, and that the campaigns which worked were those run in districts where people could still remember neighbours with swollen necks. In districts where the disease had already been eliminated, he found the argument much harder to make, which he calls the standard curse of prevention.

Roughly three-quarters of the world's households now use iodised salt, up from about a fifth in 1990, and the drop in deficiency over that period is one of the largest public health gains of the era. It is also fragile in a way that surprises people. The programme has to be maintained forever: a plant that stops adding iodate produces salt indistinguishable from the iodised kind, and deficiency returns within a few years in a population that has forgotten what it looks like. Several countries have had exactly that experience after a change of government or a disruption to supply.

There is one modern complication. Advice to reduce salt intake, which is sound for other reasons, reduces iodine intake along with it in any country where salt is the only carrier. The countries that have thought about this have responded by raising the concentration rather than by defending salt, which is the right answer and an awkward one to explain in a leaflet.`,
      questions: [
        fromList(
          "matching_features",
          SALT_PEOPLE,
          "The remedy was available for a century before anyone acted on it.",
          "Hélène Dubois",
          "Physicians in the 1820s had identified iodine as the missing factor and had proposed adding it to salt, and the proposal was ignored for almost a century.",
          "Dubois dates the proposal to the 1820s.",
        ),
        fromList(
          "matching_features",
          SALT_PEOPLE,
          "Debating who pays costs more than the measure itself.",
          "Ravi Menon",
          "Ravi Menon, an economist who studies such programmes, describes salt iodisation as the cheapest health intervention ever devised in terms of the harm avoided, and notes that the cost is so low that arguing about who should pay it wastes more money than the programme does.",
          "Menon makes the point about arguing over the cost.",
        ),
        fromList(
          "matching_features",
          SALT_PEOPLE,
          "How the salt is stored decides whether the addition survives.",
          "Gizem Aydın",
          "She regards the packaging as the part of the programme most often skimped and the part most worth spending on.",
          "Aydın points to the packaging.",
        ),
        fromList(
          "matching_features",
          SALT_PEOPLE,
          "Persuasion is easiest where the disease is still remembered.",
          "Charles Mwale",
          "In districts where the disease had already been eliminated, he found the argument much harder to make, which he calls the standard curse of prevention.",
          "Mwale names the curse of prevention.",
        ),
        fromList(
          "summary_completion",
          SALT_BANK,
          "Without enough ______ the body cannot make certain hormones.",
          "iodine",
          "The human body needs iodine in quantities so small that a teaspoon spread over a lifetime would be ample.",
          "Iodine is the missing element.",
        ),
        fromList(
          "summary_completion",
          SALT_BANK,
          "The ______ gland swells as it tries to compensate.",
          "thyroid",
          "Without it the thyroid gland cannot make the hormones that regulate growth and metabolism.",
          "The thyroid is the gland concerned.",
        ),
        fromList(
          "summary_completion",
          SALT_BANK,
          "The resulting swelling of the neck is called ______.",
          "goitre",
          "The gland enlarges as it tries, producing the swelling of the neck called goitre, and in a child whose mother was deficient during pregnancy the consequence is permanent damage to the developing brain.",
          "The swelling is goitre.",
        ),
        fromList(
          "summary_completion",
          SALT_BANK,
          "Iodide ______ from damp salt, so iodate is used instead.",
          "evaporates",
          "Iodine added as iodide evaporates from damp salt stored in the heat, so the more stable iodate is used instead, and the salt must be kept in sealed packaging rather than open sacks.",
          "Iodide evaporates from damp salt.",
        ),
        fromList(
          "summary_completion",
          SALT_BANK,
          "Where producers are many and small, a wholesale ______ has been needed.",
          "monopoly",
          "The first is the salt industry in countries where production is fragmented among thousands of small producers who cannot easily be equipped or inspected; in such places iodisation has advanced only where the government has effectively created a monopoly on wholesale distribution.",
          "A wholesale monopoly was created.",
        ),
        mcq(
          "Why does the writer say the problem is geological rather than economic?",
          [
            "Iodine is washed out of mountain and flooded soils",
            "Poor countries cannot afford to add iodine",
            "Coastal populations eat more fish",
            "Mining releases iodine into the soil",
          ],
          "Iodine is washed out of mountain and flooded soils",
          "Iodine is abundant in seawater and in the soils of coastal plains, and it is scarce in mountains and in land that was scraped by glaciers or is regularly flooded, because the element is washed out and carried to the sea.",
          "The element is washed out and carried to the sea.",
        ),
        mcq(
          "Why was salt chosen as the carrier?",
          [
            "Intake is similar regardless of income",
            "It is the cheapest food available",
            "It is eaten mainly in affected regions",
            "It can be stored indefinitely",
          ],
          "Intake is similar regardless of income",
          "Almost everybody eats salt; they eat roughly the same small amount of it whatever their income; it is produced in a few large plants rather than in millions of kitchens; and the addition costs a few cents per person per year.",
          "Intake is the same 'whatever their income'.",
        ),
        mcq(
          "Why is the programme described as fragile?",
          [
            "Untreated salt looks identical to treated salt",
            "Iodate decays within a few years",
            "Households stop buying salt as incomes rise",
            "The plants are difficult to inspect",
          ],
          "Untreated salt looks identical to treated salt",
          "The programme has to be maintained forever: a plant that stops adding iodate produces salt indistinguishable from the iodised kind, and deficiency returns within a few years in a population that has forgotten what it looks like.",
          "The two kinds are indistinguishable.",
        ),
        mcq(
          "How have countries responded to advice to eat less salt?",
          [
            "By increasing the concentration added",
            "By defending salt consumption",
            "By adding iodine to bread instead",
            "By issuing supplements to children",
          ],
          "By increasing the concentration added",
          "The countries that have thought about this have responded by raising the concentration rather than by defending salt, which is the right answer and an awkward one to explain in a leaflet.",
          "They raised the concentration.",
        ),
      ],
    },
    {
      key: "t83-p3-aluminium",
      title: "The Metal That Was Once Precious",
      topic:
        "how the third most common element in the crust came to be cheaper than the can it makes",
      difficulty: 6,
      body: `A) Aluminium is the most abundant metal in the earth's crust and the third most abundant element in it, after oxygen and silicon. It is also, in the ordinary sense, the least noble: it reacts so readily that it is never found as a metal in nature. Every atom of it is locked into an oxide or a silicate, held there by one of the strongest chemical bonds that industry has to break. That combination — everywhere, and almost impossible to release — produced one of the strangest price histories of any material.

B) The metal was isolated in small quantities in the 1820s and remained a curiosity for fifty years. It was lighter than glass, it did not tarnish, and it cost more than gold. Napoleon III is said to have served his most honoured guests from aluminium plate while the rest of the table made do with silver. A cap of aluminium was placed on the Washington Monument in 1884 because the metal was thought a fitting extravagance for the summit of a national memorial; it weighed less than three kilograms and cost what a skilled worker earned in a year.

C) Two men solved the problem independently in 1886, at the age of twenty-two: Charles Hall in Ohio and Paul Héroult in France. Both dissolved aluminium oxide in molten cryolite and passed a large electric current through the bath, which strips the oxygen away and leaves liquid metal at the bottom of the cell. The process bearing both their names is still, with refinements, the only method used at scale anywhere in the world, more than a century and a quarter later. Very few industrial processes have gone so long without being replaced.

D) What the process consumes is electricity, in quantities that dominate everything else about the industry. Producing a tonne of primary aluminium takes something like thirteen to fifteen thousand kilowatt-hours, which is roughly what an average European household uses in four years. The consequence is that aluminium smelters are not built near the ore, which is cheap to ship, but near the cheapest available power. The map of the world's smelters is therefore a map of hydroelectric dams, of Icelandic geothermal fields, and of coal in places where coal is cheap. An industry whose product is valued for making things light is one of the most energy-intensive there is.

E) Recycling changes the arithmetic completely, because remelting existing metal requires only about five per cent of the energy needed to win it from ore. This is an unusually large saving; for most materials the figure is a third or a half. It is also unusually easy to capture, since aluminium does not degrade on remelting and a used can can become a new can indefinitely. About three-quarters of all the aluminium ever produced is estimated to be still in use, which is a remarkable figure for any industrial material and reflects both the recycling rate and the long life of the metal in buildings and vehicles.

F) The environmental case is therefore genuinely double-edged, and the arguments on each side tend to quote only one half of it. A car body made of aluminium costs a great deal of energy to make and saves fuel every kilometre it is driven; whether the exchange is worthwhile depends on how far the car is driven and on how the electricity for the smelter was generated. The same calculation for a drinks can, which travels a few hundred metres in a shopping bag and is then thrown away, comes out very differently, and it is the recycling rate that rescues it. Neither answer can be read off the material.

G) There is also a residue that the industry discusses less. Refining bauxite into alumina before smelting leaves a caustic red mud, roughly one to two tonnes of it for every tonne of alumina, which is stored behind dams because no large use has been found for it. Several of those dams have failed. The metal in a window frame is inert, durable and recyclable; the process that produced it left behind a lake of alkaline waste in a country the buyer of the window will never visit. Both facts are true about the same object, which is the ordinary condition of industrial materials and not a special feature of this one.`,
      questions: [
        fromList(
          "matching_information",
          ALUMINIUM_PARAGRAPHS,
          "an estimate of how much of the metal ever made is still in service",
          "E",
          "About three-quarters of all the aluminium ever produced is estimated to be still in use, which is a remarkable figure for any industrial material and reflects both the recycling rate and the long life of the metal in buildings and vehicles.",
          "Paragraph E gives the three-quarters figure.",
        ),
        fromList(
          "matching_information",
          ALUMINIUM_PARAGRAPHS,
          "a waste product stored behind structures that have sometimes failed",
          "G",
          "Refining bauxite into alumina before smelting leaves a caustic red mud, roughly one to two tonnes of it for every tonne of alumina, which is stored behind dams because no large use has been found for it.",
          "Paragraph G describes the red mud dams.",
        ),
        fromList(
          "matching_information",
          ALUMINIUM_PARAGRAPHS,
          "two inventors arriving at the same answer in the same year",
          "C",
          "Two men solved the problem independently in 1886, at the age of twenty-two: Charles Hall in Ohio and Paul Héroult in France.",
          "Paragraph C names both inventors and the year.",
        ),
        fromList(
          "matching_information",
          ALUMINIUM_PARAGRAPHS,
          "a comparison between a household's yearly consumption and the metal's",
          "D",
          "Producing a tonne of primary aluminium takes something like thirteen to fifteen thousand kilowatt-hours, which is roughly what an average European household uses in four years.",
          "Paragraph D makes the household comparison.",
        ),
        fromList(
          "matching_information",
          ALUMINIUM_PARAGRAPHS,
          "an object placed on a monument as a deliberate extravagance",
          "B",
          "A cap of aluminium was placed on the Washington Monument in 1884 because the metal was thought a fitting extravagance for the summit of a national memorial; it weighed less than three kilograms and cost what a skilled worker earned in a year.",
          "Paragraph B describes the monument cap.",
        ),
        ynng(
          "The writer accepts that the process has gone unusually long without replacement.",
          "YES",
          "The process bearing both their names is still, with refinements, the only method used at scale anywhere in the world, more than a century and a quarter later.",
          "It remains the only method at scale.",
        ),
        ynng(
          "The writer accepts that the energy saving from recycling aluminium is unusually large.",
          "YES",
          "This is an unusually large saving; for most materials the figure is a third or a half.",
          "It is 'an unusually large saving'.",
        ),
        ynng(
          "The writer believes the environmental verdict on aluminium follows from the material itself.",
          "NO",
          "Neither answer can be read off the material.",
          "'Neither answer can be read off the material.'",
        ),
        ynng(
          "The writer regards the coexistence of a clean product and a dirty process as peculiar to this metal.",
          "NO",
          "Both facts are true about the same object, which is the ordinary condition of industrial materials and not a special feature of this one.",
          "It is 'the ordinary condition of industrial materials'.",
        ),
        fromList(
          "matching_sentence_endings",
          ALUMINIUM_ENDINGS,
          "The metal is never found in its pure state,",
          "because the metal is bound so tightly to the oxygen in its ore.",
          "Every atom of it is locked into an oxide or a silicate, held there by one of the strongest chemical bonds that industry has to break.",
          "The bond holding it is among the strongest.",
        ),
        fromList(
          "matching_sentence_endings",
          ALUMINIUM_ENDINGS,
          "For fifty years it was reserved for honoured guests,",
          "which made the metal a gift fit for an emperor rather than a saucepan.",
          "It was lighter than glass, it did not tarnish, and it cost more than gold.",
          "It cost more than gold.",
        ),
        fromList(
          "matching_sentence_endings",
          ALUMINIUM_ENDINGS,
          "Smelters are not placed near their raw material,",
          "which is why the industry settled beside waterfalls and dams.",
          "The consequence is that aluminium smelters are not built near the ore, which is cheap to ship, but near the cheapest available power.",
          "They follow the power, not the ore.",
        ),
        fromList(
          "matching_sentence_endings",
          ALUMINIUM_ENDINGS,
          "Collecting the metal back is worth more effort than for other materials,",
          "since remelting an old can needs a small fraction of the original energy.",
          "Recycling changes the arithmetic completely, because remelting existing metal requires only about five per cent of the energy needed to win it from ore.",
          "Remelting takes about five per cent of the energy.",
        ),
        fromList(
          "matching_sentence_endings",
          ALUMINIUM_ENDINGS,
          "A heavy vehicle body may be worth replacing with a light one,",
          "because a light vehicle spends less fuel carrying itself around.",
          "A car body made of aluminium costs a great deal of energy to make and saves fuel every kilometre it is driven; whether the exchange is worthwhile depends on how far the car is driven and on how the electricity for the smelter was generated.",
          "The light body saves fuel per kilometre.",
        ),
      ],
    },
  ],
};
