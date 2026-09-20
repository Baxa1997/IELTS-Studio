import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · textile history · notes box --------------------------------

const SILK_NOTES = {
  title: "From egg to thread",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · botany and empire · people and a word bank ----------------

const RUBBER_PEOPLE = ["Estela Carvalho", "Duncan Ross", "Amara Sesay", "Nils Bergqvist"];
const RUBBER_BANK = [
  "latex",
  "seeds",
  "plantations",
  "vulcanise",
  "blight",
  "tapping",
  "collapse",
  "synthetic",
  "tyres",
];

// ---- Passage 3 · industrial chemistry · lettered paragraphs ----------------

const PAPER_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PAPER_ENDINGS = [
  "because the supply of old cloth could not grow with the demand for print.",
  "which is why the newspapers of that century are now the hardest to preserve.",
  "since the fibres are shorter and the sheet is correspondingly weaker.",
  "although the same process made a newspaper affordable for the first time.",
  "because the acid left in the sheet goes on attacking it for a century.",
  "even though the rags themselves had been collected and traded for centuries.",
  "which made the forest, rather than the ragman, the limit on how much could be printed.",
];

export const TEST_93: CuratedTest = {
  key: "full-test-93",
  targetBand: 5,
  passages: [
    {
      key: "t93-p1-silk",
      title: "The Worm That Was a State Secret",
      topic: "a production process kept secret for two thousand years",
      difficulty: 4,
      body: `Silk is a single continuous filament produced by a caterpillar to build its cocoon. The domesticated silk moth has been bred for so long that it can no longer fly, cannot feed itself as an adult, and does not exist in the wild. The whole species is an artefact of an industry, which is unusual even among domesticated animals. A sheep released into the hills will live; a silk moth released anywhere will starve within days, having no functioning mouth and no ability to escape a bird.

The process has hardly changed. The eggs are kept cool until they are wanted, then warmed to hatch. The caterpillars are fed on mulberry leaves, chopped fine at first and coarser as they grow, and they eat almost continuously for about a month, increasing their weight some ten thousand times. They are extremely sensitive to disturbance: a loud noise, a strong smell, or a change in temperature will stop them feeding, and a room of them is kept quiet in a way that surprises visitors. When they are ready they are given a frame of twigs or a paper cone, and each spins a cocoon of a single thread, up to nine hundred metres long, cemented together with a gum called sericin.

At this point the industry does the thing that most people find difficult. The cocoons are heated, in steam or hot air, which kills the pupa inside. This is necessary because a moth emerging from a cocoon breaks the filament into short pieces and the continuous thread is lost. The cocoons are then soaked to soften the gum, and the filaments from several cocoons are unwound together and twisted into a usable yarn, which is called reeling. Roughly two thousand cocoons are needed for a kilogram of raw silk.

Chinese production is documented from at least the third millennium BC, and for most of that period the process was a state secret whose disclosure was punishable by death. The secret held remarkably well. Rome imported silk in quantity and did not know what it was made from; Pliny believed it was combed from the leaves of trees. The knowledge leaked eventually, first to Korea and Japan, then to India and Persia, and reached the Byzantine Empire in the sixth century, by an account involving monks who carried eggs out of China in a hollow cane. The story may be embroidered and the timing is not: silk was being woven in Byzantine workshops within a generation of the date given.

What broke the Chinese monopoly permanently was not the smuggling but a disease. In the 1850s a microbial infection swept through European silkworm stocks, and the industry of France and Italy, which by then was substantial, collapsed. Louis Pasteur was asked to investigate, spent five years on it, and produced a method for identifying and destroying infected eggs that saved the industry. The work also gave him direct evidence for the germ theory of disease, which he was developing at the time, and the silkworm is therefore a minor character in the history of medicine as well as of textiles.

The reason silk remains expensive is that almost none of this can be mechanised. The feeding, the sorting of cocoons, and the tending of larvae are all done by hand, and the labour is the cost. Attempts to replace the mulberry leaf with artificial feed have worked in laboratories and not economically. Attempts to produce the filament protein by fermentation, using bacteria or yeast engineered to make silk proteins, have succeeded in making the material and have not yet succeeded in making the thread: the animal spins its filament through a narrow duct under precise control, and the mechanical properties that make silk valuable come from that spinning rather than from the protein alone.

There is a variant worth mentioning. Some producers allow the moth to emerge and use the broken filaments, spinning them into a yarn in the way cotton or wool is spun. The result is less lustrous, less strong and more textured, and it is sold at a premium to buyers who object to the killing. It is a reminder that the standard process is a choice rather than a necessity, made for the sake of a continuous thread. Everything distinctive about silk as a fabric — the lustre, the strength, the way it takes dye — follows from that unbroken filament, and the price of it is paid inside the cocoon.`,
      questions: [
        tfng(
          "The domesticated silk moth can survive without human care.",
          "FALSE",
          "The domesticated silk moth has been bred for so long that it can no longer fly, cannot feed itself as an adult, and does not exist in the wild.",
          "It cannot feed itself and is not found wild.",
        ),
        tfng(
          "Silkworms are disturbed by noise and smells.",
          "TRUE",
          "They are extremely sensitive to disturbance: a loud noise, a strong smell, or a change in temperature will stop them feeding, and a room of them is kept quiet in a way that surprises visitors.",
          "Noise and smell stop them feeding.",
        ),
        tfng(
          "The pupa is killed so that the thread stays in one piece.",
          "TRUE",
          "This is necessary because a moth emerging from a cocoon breaks the filament into short pieces and the continuous thread is lost.",
          "An emerging moth breaks the filament.",
        ),
        tfng(
          "Rome understood how silk was produced.",
          "FALSE",
          "Rome imported silk in quantity and did not know what it was made from; Pliny believed it was combed from the leaves of trees.",
          "Rome 'did not know what it was made from'.",
        ),
        tfng(
          "The European industry was ruined by competition from China.",
          "FALSE",
          "In the 1850s a microbial infection swept through European silkworm stocks, and the industry of France and Italy, which by then was substantial, collapsed.",
          "An infection, not competition, caused it.",
        ),
        tfng(
          "Silk proteins have been made outside the animal.",
          "TRUE",
          "Attempts to produce the filament protein by fermentation, using bacteria or yeast engineered to make silk proteins, have succeeded in making the material and have not yet succeeded in making the thread: the animal spins its filament through a narrow duct under precise control, and the mechanical properties that make silk valuable come from that spinning rather than from the protein alone.",
          "The material has been made; the thread has not.",
        ),
        tfng(
          "China remains the largest producer of raw silk today.",
          "NOT GIVEN",
          "",
          "The passage describes Chinese history but gives no modern production ranking.",
        ),
        noteLine(
          SILK_NOTES,
          "Rearing",
          "Larvae are fed on ______ leaves for about a month",
          "mulberry",
          "The caterpillars are fed on mulberry leaves, chopped fine at first and coarser as they grow, and they eat almost continuously for about a month, increasing their weight some ten thousand times.",
          "They are fed mulberry leaves.",
        ),
        noteLine(
          SILK_NOTES,
          "Spinning",
          "Each larva spins a cocoon held together by a gum called ______",
          "sericin",
          "When they are ready they are given a frame of twigs or a paper cone, and each spins a cocoon of a single thread, up to nine hundred metres long, cemented together with a gum called sericin.",
          "The gum is sericin.",
        ),
        noteLine(
          SILK_NOTES,
          "Processing",
          "Filaments from several cocoons are twisted together, a step called ______",
          "reeling",
          "The cocoons are then soaked to soften the gum, and the filaments from several cocoons are unwound together and twisted into a usable yarn, which is called reeling.",
          "The step is called reeling.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN THREE WORDS",
          "About ______ cocoons yield one kilogram of raw silk.",
          "two thousand",
          "Roughly two thousand cocoons are needed for a kilogram of raw silk.",
          "Two thousand cocoons per kilogram.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN THREE WORDS",
          "Pasteur's silkworm work supported his developing ______.",
          "germ theory",
          "The work also gave him direct evidence for the germ theory of disease, which he was developing at the time, and the silkworm is therefore a minor character in the history of medicine as well as of textiles.",
          "It supported the germ theory.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN THREE WORDS",
          "Silk stays costly because the work is done by ______.",
          "hand",
          "The feeding, the sorting of cocoons, and the tending of larvae are all done by hand, and the labour is the cost.",
          "The work is done by hand.",
        ),
      ],
    },
    {
      key: "t93-p2-rubber",
      title: "The Tree That Moved Continents",
      topic: "how a crop was taken from one hemisphere to another, and what happened to both",
      difficulty: 5,
      body: `Natural rubber is the dried sap of a tree native to the Amazon basin. The material was known to indigenous peoples of South and Central America for centuries before Europeans encountered it, and was used for waterproofing, for balls and for containers. Its usefulness to industry was limited by a property that is hard to overstate: untreated rubber is sticky in heat and brittle in cold, so an object made of it is ruined by a summer or a winter.

Estela Carvalho, a historian of the Amazon, emphasises how completely the early trade depended on extraction from wild trees. The species does not grow in stands; individual trees are scattered through the forest at a few per hectare, so collecting the sap meant walking a circuit of trees each day and cutting each one, a process called tapping. That geography shaped the labour system. Workers were dispersed, supervised by debt rather than by presence, and held in conditions that several contemporary investigations described as slavery in all but name. She argues that the dispersal of the trees, rather than any feature of the material, explains why the industry took the form it did.

The commercial explosion came after 1839, when Charles Goodyear found that heating rubber with sulphur produced a material that stayed elastic across the range of ordinary temperatures. The process, later named vulcanisation, turned a curiosity into an industrial commodity, and the invention of the pneumatic tyre half a century later turned a commodity into a strategic necessity. For about thirty years the Amazon had a near monopoly, and the city of Manaus, a thousand miles up the river, acquired an opera house.

The monopoly ended with a consignment of seeds. Duncan Ross, who studies the movement of economic plants, describes the 1876 removal of seventy thousand rubber seeds from Brazil to Kew Gardens by Henry Wickham as the single most consequential act of plant transfer in the nineteenth century, and is careful about how it is usually told. Brazil did not prohibit the export of seeds at the time, so the common description of the act as smuggling is anachronistic; what made it decisive was not secrecy but the botanical work that followed, since only a few thousand seeds germinated and the resulting trees had to be established in Ceylon and Malaya before anything could be planted at scale.

What made the transplanted crop competitive was arrangement rather than biology. Amara Sesay, an agricultural economist, points out that the Asian trees were planted in rows, close together, on estates, so one worker could tap several hundred trees a day instead of walking a forest circuit for a few dozen. The yield per worker was several times higher, and it was higher for reasons of geometry. Within twenty years Asian plantations supplied most of the world's rubber and the Amazon trade had collapsed, taking Manaus with it.

There is a further reason the plantations could exist in Asia and not in Amazonia, and it is a disease. Nils Bergqvist, a plant pathologist, explains that South American leaf blight, a fungus native to the rubber tree's home range, destroys trees planted close together, which is precisely why rubber cannot be grown on plantations in its own continent. The seeds taken to Asia carried none of it. A very large attempt by the Ford Motor Company to establish Amazonian plantations in the 1930s failed for exactly this reason after enormous expenditure. He notes the uncomfortable corollary: the Asian industry exists in a state of permanent quarantine, and an introduction of the fungus into Southeast Asia would be a catastrophe for which there is no remedy.

Synthetic rubber, developed at scale during the Second World War when supply from Asia was cut off, now accounts for more than half of world consumption. It has not replaced the natural material, because natural rubber has a combination of resilience and heat tolerance that the synthetics do not match, and the application where this matters most is the tyre of a heavy aircraft or truck. So a crop taken from one continent to another in a box of seeds remains, a century and a half later, something the world cannot do without and grows almost entirely in the place it is not native to. Three countries in Southeast Asia now supply most of it, on land that was forest within living memory.`,
      questions: [
        fromList(
          "matching_features",
          RUBBER_PEOPLE,
          "The scattered distribution of the trees shaped the labour system.",
          "Estela Carvalho",
          "She argues that the dispersal of the trees, rather than any feature of the material, explains why the industry took the form it did.",
          "Carvalho attributes the system to dispersal.",
        ),
        fromList(
          "matching_features",
          RUBBER_PEOPLE,
          "Calling the seed removal a theft misdescribes the law of the time.",
          "Duncan Ross",
          "Brazil did not prohibit the export of seeds at the time, so the common description of the act as smuggling is anachronistic; what made it decisive was not secrecy but the botanical work that followed, since only a few thousand seeds germinated and the resulting trees had to be established in Ceylon and Malaya before anything could be planted at scale.",
          "Ross calls the smuggling description anachronistic.",
        ),
        fromList(
          "matching_features",
          RUBBER_PEOPLE,
          "The advantage of the new estates was one of geometry.",
          "Amara Sesay",
          "The yield per worker was several times higher, and it was higher for reasons of geometry.",
          "Sesay puts it down to geometry.",
        ),
        fromList(
          "matching_features",
          RUBBER_PEOPLE,
          "The Asian industry survives only because a fungus has not arrived.",
          "Nils Bergqvist",
          "He notes the uncomfortable corollary: the Asian industry exists in a state of permanent quarantine, and an introduction of the fungus into Southeast Asia would be a catastrophe for which there is no remedy.",
          "Bergqvist names the permanent quarantine.",
        ),
        fromList(
          "summary_completion",
          RUBBER_BANK,
          "Rubber is the dried ______ of an Amazonian tree.",
          "latex",
          "Natural rubber is the dried sap of a tree native to the Amazon basin.",
          "It is the tree's dried sap.",
        ),
        fromList(
          "summary_completion",
          RUBBER_BANK,
          "Collecting it means cutting each tree in turn, a process called ______.",
          "tapping",
          "The species does not grow in stands; individual trees are scattered through the forest at a few per hectare, so collecting the sap meant walking a circuit of trees each day and cutting each one, a process called tapping.",
          "The process is tapping.",
        ),
        fromList(
          "summary_completion",
          RUBBER_BANK,
          "Heating the material with sulphur is used to ______ it.",
          "vulcanise",
          "The process, later named vulcanisation, turned a curiosity into an industrial commodity, and the invention of the pneumatic tyre half a century later turned a commodity into a strategic necessity.",
          "The process is vulcanisation.",
        ),
        fromList(
          "summary_completion",
          RUBBER_BANK,
          "Seventy thousand ______ were taken to Kew in 1876.",
          "seeds",
          "Duncan Ross, who studies the movement of economic plants, describes the 1876 removal of seventy thousand rubber seeds from Brazil to Kew Gardens by Henry Wickham as the single most consequential act of plant transfer in the nineteenth century, and is careful about how it is usually told.",
          "Seventy thousand seeds were removed.",
        ),
        fromList(
          "summary_completion",
          RUBBER_BANK,
          "A leaf ______ prevents close planting in the tree's native range.",
          "blight",
          "Nils Bergqvist, a plant pathologist, explains that South American leaf blight, a fungus native to the rubber tree's home range, destroys trees planted close together, which is precisely why rubber cannot be grown on plantations in its own continent.",
          "The blight destroys close-planted trees.",
        ),
        mcq(
          "What limited the industrial use of untreated rubber?",
          [
            "It was sticky when hot and brittle when cold",
            "It could not be coloured",
            "It dissolved in water",
            "It was too heavy for machinery",
          ],
          "It was sticky when hot and brittle when cold",
          "Its usefulness to industry was limited by a property that is hard to overstate: untreated rubber is sticky in heat and brittle in cold, so an object made of it is ruined by a summer or a winter.",
          "Heat and cold both ruined it.",
        ),
        mcq(
          "According to Ross, what made the seed transfer decisive?",
          [
            "The botanical work done after the seeds arrived",
            "The secrecy of the removal",
            "The number of seeds that germinated",
            "A Brazilian ban on exports",
          ],
          "The botanical work done after the seeds arrived",
          "What made it decisive was not secrecy but the botanical work that followed, since only a few thousand seeds germinated and the resulting trees had to be established in Ceylon and Malaya before anything could be planted at scale.",
          "The later botanical work was decisive.",
        ),
        mcq(
          "Why did the Ford plantations in the Amazon fail?",
          [
            "The native fungus attacked closely planted trees",
            "The soil was exhausted within a decade",
            "Labour could not be recruited",
            "Synthetic rubber undercut the price",
          ],
          "The native fungus attacked closely planted trees",
          "A very large attempt by the Ford Motor Company to establish Amazonian plantations in the 1930s failed for exactly this reason after enormous expenditure.",
          "The blight defeated close planting.",
        ),
        mcq(
          "Why has synthetic rubber not replaced the natural material?",
          [
            "It lacks the same resilience and heat tolerance",
            "It is more expensive to manufacture",
            "It cannot be vulcanised",
            "Supply of the raw chemicals is limited",
          ],
          "It lacks the same resilience and heat tolerance",
          "It has not replaced the natural material, because natural rubber has a combination of resilience and heat tolerance that the synthetics do not match, and the application where this matters most is the tyre of a heavy aircraft or truck.",
          "The synthetics do not match that combination.",
        ),
      ],
    },
    {
      key: "t93-p3-paper-from-rags",
      title: "When Paper Was Made from Rags",
      topic: "a shortage of old clothes, and the century of self-destroying books it produced",
      difficulty: 6,
      body: `A) For roughly seven hundred years after paper reached Europe, it was made from cloth. Linen and cotton rags were collected, sorted, rotted, beaten to a pulp in water, and formed into sheets on a wire mould. The resulting paper was strong, chemically stable and, as it turns out, close to permanent: a book printed in 1500 is generally in better physical condition today than one printed in 1900, and conservators handle the older volume with less anxiety than the newer one. Nothing about this was intentional. It is a property the material happened to have.

B) The constraint on the industry was supply. Rags came from worn-out clothing, and the quantity of worn-out clothing in a country is set by its population and cannot be increased by wanting more of it. As printing expanded, the shortage became acute. Governments legislated: several European states prohibited the export of rags, and one forbade burying the dead in linen so that the cloth would reach the mills. Rag collectors became an established trade with their own routes and prices. None of it was sufficient, and by the early nineteenth century the price of paper was a serious constraint on what could be printed.

C) The solution was wood, and it arrived in two forms. Mechanical pulp, produced from the 1840s by grinding logs against a stone, gave a very cheap paper with short, damaged fibres. Chemical pulp, developed over the following decades, dissolved away the lignin that binds wood fibres together and produced longer fibres and stronger paper. Both substituted an effectively unlimited raw material for a fixed one, and the effect on price was immediate: newspapers became something a working household could buy daily, and the mass-circulation press of the later nineteenth century is a direct consequence of the change.

D) The accompanying disaster was not recognised for a century. To make wood-pulp paper hold ink without spreading, manufacturers sized it with an alum compound, which leaves the sheet acidic. Acid attacks cellulose. A book printed on such paper is slowly digesting itself from the moment it leaves the press, and the process accelerates in warmth. The result is the condition librarians call brittle paper: a page that cannot be turned without breaking, in books that are not old. The nineteenth and early twentieth centuries are the worst-affected period, which means the printed record of the era of mass literacy is the part of it most at risk.

E) The scale took time to establish. Surveys conducted by major libraries in the late twentieth century found that a substantial minority of their holdings from the relevant period were already too brittle to use, and that a much larger proportion would become so within decades. There is no way to reverse the damage. Deacidification, which neutralises the remaining acid by treating the paper with an alkaline compound, arrests the process without restoring strength, and it is slow and expensive per volume. The practical response has been to accept the loss of the objects and copy the content, first to microfilm and later by scanning, which preserves the text and not the book.

F) Paper manufacture has since been corrected. From the 1980s the industry moved to alkaline sizing, partly because it is cheaper and produces a brighter sheet, and permanent paper standards now exist and are specified for archival printing. A book printed today on paper meeting those standards should last several centuries. The correction came after the damage, as it usually does, and it came for commercial reasons with preservation as a beneficiary rather than a cause.

G) The episode is a useful example of a durability failure that nobody chose. No one decided to print the nineteenth century on paper that would not last; the property was invisible for decades, it was a side effect of solving a genuine and pressing shortage, and by the time it was understood the affected material ran to hundreds of millions of volumes. The comparison with digital storage is made frequently and is not quite right, since a digital file's problem is format and hardware rather than chemistry. The transferable lesson is narrower: a material substitution made under economic pressure can carry a property that takes a century to show itself, and the people who made it will not be there to see it.`,
      questions: [
        fromList(
          "matching_information",
          PAPER_PARAGRAPHS,
          "laws passed to keep cloth inside a country",
          "B",
          "Governments legislated: several European states prohibited the export of rags, and one forbade burying the dead in linen so that the cloth would reach the mills.",
          "Paragraph B lists the legislation.",
        ),
        fromList(
          "matching_information",
          PAPER_PARAGRAPHS,
          "the chemical reason a book destroys itself",
          "D",
          "To make wood-pulp paper hold ink without spreading, manufacturers sized it with an alum compound, which leaves the sheet acidic.",
          "Paragraph D gives the chemistry.",
        ),
        fromList(
          "matching_information",
          PAPER_PARAGRAPHS,
          "a treatment that halts decay without repairing it",
          "E",
          "Deacidification, which neutralises the remaining acid by treating the paper with an alkaline compound, arrests the process without restoring strength, and it is slow and expensive per volume.",
          "Paragraph E describes deacidification.",
        ),
        fromList(
          "matching_information",
          PAPER_PARAGRAPHS,
          "a change adopted for reasons other than preservation",
          "F",
          "The correction came after the damage, as it usually does, and it came for commercial reasons with preservation as a beneficiary rather than a cause.",
          "Paragraph F notes the commercial motive.",
        ),
        fromList(
          "matching_information",
          PAPER_PARAGRAPHS,
          "a durable property that was never designed in",
          "A",
          "Nothing about this was intentional. It is a property the material happened to have.",
          "Paragraph A says the durability was accidental.",
        ),
        ynng(
          "The writer thinks the move to wood pulp was an avoidable mistake.",
          "NO",
          "No one decided to print the nineteenth century on paper that would not last; the property was invisible for decades, it was a side effect of solving a genuine and pressing shortage, and by the time it was understood the affected material ran to hundreds of millions of volumes.",
          "It solved a genuine shortage and the flaw was invisible.",
        ),
        ynng(
          "The writer accepts that copying the content means losing the object.",
          "YES",
          "The practical response has been to accept the loss of the objects and copy the content, first to microfilm and later by scanning, which preserves the text and not the book.",
          "It 'preserves the text and not the book'.",
        ),
        ynng(
          "The writer regards the comparison with digital preservation as exact.",
          "NO",
          "The comparison with digital storage is made frequently and is not quite right, since a digital file's problem is format and hardware rather than chemistry.",
          "It is 'not quite right'.",
        ),
        ynng(
          "The writer believes modern archival paper should last for centuries.",
          "YES",
          "A book printed today on paper meeting those standards should last several centuries.",
          "The writer says several centuries.",
        ),
        fromList(
          "matching_sentence_endings",
          PAPER_ENDINGS,
          "The rag-based industry could not expand,",
          "because the supply of old cloth could not grow with the demand for print.",
          "Rags came from worn-out clothing, and the quantity of worn-out clothing in a country is set by its population and cannot be increased by wanting more of it.",
          "The supply was fixed by population.",
        ),
        fromList(
          "matching_sentence_endings",
          PAPER_ENDINGS,
          "Wood replaced cloth as the raw material,",
          "which made the forest, rather than the ragman, the limit on how much could be printed.",
          "Both substituted an effectively unlimited raw material for a fixed one, and the effect on price was immediate: newspapers became something a working household could buy daily, and the mass-circulation press of the later nineteenth century is a direct consequence of the change.",
          "An unlimited material replaced a fixed one.",
        ),
        fromList(
          "matching_sentence_endings",
          PAPER_ENDINGS,
          "Mechanically ground pulp gives a poor sheet,",
          "since the fibres are shorter and the sheet is correspondingly weaker.",
          "Mechanical pulp, produced from the 1840s by grinding logs against a stone, gave a very cheap paper with short, damaged fibres.",
          "The fibres are short and damaged.",
        ),
        fromList(
          "matching_sentence_endings",
          PAPER_ENDINGS,
          "A book from 1890 may be unusable already,",
          "because the acid left in the sheet goes on attacking it for a century.",
          "A book printed on such paper is slowly digesting itself from the moment it leaves the press, and the process accelerates in warmth.",
          "The acid keeps working from the press onwards.",
        ),
        fromList(
          "matching_sentence_endings",
          PAPER_ENDINGS,
          "The era of mass literacy is the worst preserved,",
          "which is why the newspapers of that century are now the hardest to preserve.",
          "The nineteenth and early twentieth centuries are the worst-affected period, which means the printed record of the era of mass literacy is the part of it most at risk.",
          "That period is the worst affected.",
        ),
      ],
    },
  ],
};
