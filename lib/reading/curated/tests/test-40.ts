import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, word bank, choose TWO ----

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const WASTE_BANK = [
  "gold",
  "ore",
  "acid",
  "cables",
  "collection",
  "design",
  "batteries",
  "smelting",
  "glue",
  "data",
];
const REPAIR_STEM = "Which TWO design changes would make electronic devices easier to recycle?";
const REPAIR_CHANGES = [
  "using screws in place of adhesive to hold parts together",
  "making every device from a single moulded piece",
  "fitting batteries that can be replaced rather than sealed in",
  "increasing the number of different alloys in each product",
  "sealing batteries permanently inside the casing",
];

// ---- Passage 3 · research debate · sentence endings ------------------------

const LANGUAGE_ENDINGS = [
  "because the two languages are both active and must be managed.",
  "when the studies compared children of different social backgrounds.",
  "because bilingual children are taught grammar more formally.",
  "when small studies with positive results were more likely to be published.",
  "because the brain stores each language in a separate hemisphere.",
  "when the total across both languages is counted.",
];

export const TEST_40: CuratedTest = {
  key: "full-test-40",
  targetBand: 7,
  passages: [
    {
      key: "t40-p1-panama",
      title: "The Cut Between Two Oceans",
      topic: "the building of the Panama Canal and the obstacles it overcame",
      difficulty: 6,
      body: `The idea of cutting through the isthmus of Panama is nearly as old as European knowledge of it. A Spanish survey proposed a canal in the sixteenth century; nothing came of it for three hundred years. The first serious attempt began in 1881, led by the French engineer Ferdinand de Lesseps, whose reputation rested on the Suez Canal, completed a decade earlier. Suez had been cut through flat desert at sea level, and de Lesseps intended to do the same in Panama.

Panama was not a desert. It was a mountainous, rain-soaked country whose rivers rose several metres in a night, and whose soil slid back into any trench dug through it. The Chagres river crossed the proposed route and flooded without warning. Worst of all were the diseases: yellow fever and malaria killed workers faster than they could be replaced, and the French effort is thought to have cost more than twenty thousand lives over eight years. In 1889 the company collapsed, ruining hundreds of thousands of small investors in France and producing a political scandal that ran for years.

When the United States took over the route in 1904, it did three things differently. The first was medical. Doctors had recently established that yellow fever was carried by a mosquito, a finding that most of the French effort had predated. An American army physician, William Gorgas, was given the authority and the money to act on it: swamps were drained, standing water was covered with oil, buildings were screened and fumigated, and grass was cut back along the line of the works. Yellow fever disappeared from the isthmus within two years, and malaria, harder to eliminate, fell sharply. Contemporary observers regarded the sanitary campaign, rather than the digging, as the decisive achievement.

The second change was strategic. After a year of argument, the Americans abandoned the sea-level plan and built a canal with locks. Ships would be lifted some twenty-six metres to an artificial lake, cross the isthmus at that height and be lowered again on the far side. This required damming the Chagres, the river that had defeated the French, to create what was then the largest artificial lake in the world, and it turned the river from the project's chief enemy into its water supply.

The third change was industrial. The excavation through the continental divide, known as the Culebra Cut, was attacked with steam shovels and a railway system whose tracks were moved daily as the face advanced. Even so, landslides repeatedly filled the cut; in some years, more material slid in than was carried out. The work employed tens of thousands of labourers, most of them recruited from the Caribbean islands, who did the heaviest and most dangerous tasks and were paid on a lower scale than American employees.

The scale of the work is easier to grasp in totals than in descriptions. Something like two hundred million cubic metres of earth and rock were removed, most of it by machines that had not existed when the French began, and the spoil was used to build causeways, breakwaters and the foundations of new towns.

The canal opened in August 1914, a few weeks after the outbreak of war in Europe, and the event passed with little of the ceremony that had been planned. It halved the sailing distance between the east and west coasts of the United States and removed the passage around Cape Horn from the routine calculations of shipping. The dimensions of its locks set a limit on the size of vessels — a class of ship was named after the canal — that shaped naval architecture for most of the twentieth century.

Control of the canal remained with the United States until treaties signed in 1977 transferred it to Panama at the end of 1999. A second set of larger locks opened in 2016, built with basins that catch and reuse part of the water from each transit. Water is now the canal's central problem: every ship that passes releases a great deal of fresh water into the sea, and a severe drought in recent years forced the authority to reduce the number of daily crossings and to auction the remaining slots at extraordinary prices. A canal built to defeat a river now depends on the rain that feeds it.`,
      questions: [
        tfng(
          "De Lesseps planned to build the Panama canal using the same approach as at Suez.",
          "TRUE",
          "Suez had been cut through flat desert at sea level, and de Lesseps intended to do the same in Panama.",
          "He 'intended to do the same in Panama'.",
        ),
        tfng(
          "The French project was abandoned mainly because of a shortage of machinery.",
          "FALSE",
          "Worst of all were the diseases: yellow fever and malaria killed workers faster than they could be replaced, and the French effort is thought to have cost more than twenty thousand lives over eight years.",
          "Disease, not machinery, is given as the worst problem.",
        ),
        tfng(
          "The cause of yellow fever was known before the French began work.",
          "FALSE",
          "Doctors had recently established that yellow fever was carried by a mosquito, a finding that most of the French effort had predated.",
          "The finding 'most of the French effort had predated'.",
        ),
        tfng(
          "Malaria was eliminated from the isthmus more quickly than yellow fever.",
          "FALSE",
          "Yellow fever disappeared from the isthmus within two years, and malaria, harder to eliminate, fell sharply.",
          "Malaria was 'harder to eliminate'.",
        ),
        tfng(
          "The Americans built the canal at sea level as the French had intended.",
          "FALSE",
          "After a year of argument, the Americans abandoned the sea-level plan and built a canal with locks.",
          "They 'abandoned the sea-level plan'.",
        ),
        tfng(
          "Landslides sometimes put more material into the Culebra Cut than was removed.",
          "TRUE",
          "Even so, landslides repeatedly filled the cut; in some years, more material slid in than was carried out.",
          "'More material slid in than was carried out'.",
        ),
        tfng(
          "Caribbean labourers were paid the same rates as American employees.",
          "FALSE",
          "The work employed tens of thousands of labourers, most of them recruited from the Caribbean islands, who did the heaviest and most dangerous tasks and were paid on a lower scale than American employees.",
          "They 'were paid on a lower scale'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The ______ river crossed the route and flooded without warning.",
          "Chagres",
          "The Chagres river crossed the proposed route and flooded without warning.",
          "'The Chagres river crossed the proposed route'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Gorgas had standing water covered with ______.",
          "oil",
          "An American army physician, William Gorgas, was given the authority and the money to act on it: swamps were drained, standing water was covered with oil, buildings were screened and fumigated, and grass was cut back along the line of the works.",
          "'Standing water was covered with oil'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Ships are raised about twenty-six metres to an artificial ______.",
          "lake",
          "Ships would be lifted some twenty-six metres to an artificial lake, cross the isthmus at that height and be lowered again on the far side.",
          "They are lifted 'to an artificial lake'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In the Culebra Cut, ______ tracks were moved each day as work advanced.",
          "railway",
          "The excavation through the continental divide, known as the Culebra Cut, was attacked with steam shovels and a railway system whose tracks were moved daily as the face advanced.",
          "A 'railway system whose tracks were moved daily'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Control of the canal passed to Panama at the end of ______.",
          "1999",
          "Control of the canal remained with the United States until treaties signed in 1977 transferred it to Panama at the end of 1999.",
          "Transfer came 'at the end of 1999'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The locks opened in 2016 have basins that catch and reuse some of the ______.",
          "water",
          "A second set of larger locks opened in 2016, built with basins that catch and reuse part of the water from each transit.",
          "The basins 'catch and reuse part of the water'.",
        ),
      ],
    },
    {
      key: "t40-p2-e-waste",
      title: "Mining the Cupboard",
      topic: "recovering metals from discarded electronics",
      difficulty: 7,
      body: `A) The world throws away more than sixty million tonnes of electrical and electronic equipment every year, and the figure is rising several times faster than the rate at which any of it is collected. Barely a fifth is documented as formally recycled. The rest is stored in drawers, buried, burned, or shipped abroad and taken apart by hand. What is discarded is not rubbish in the ordinary sense: it contains copper, aluminium, tin, cobalt, palladium, silver and gold, along with rare earth elements used in magnets and screens, and the concentrations are remarkable. A tonne of discarded circuit boards may hold several hundred times as much gold as a tonne of rock from a working mine.

B) That comparison is the basis of what is often called urban mining: the idea that the cheapest and least damaging source of several critical metals is the stock of equipment already above ground. The arithmetic is attractive, and it is also incomplete. Ore arrives at a smelter in vast, uniform quantities; discarded electronics arrive in small, varied batches, each device built differently, and the cost of gathering, sorting and dismantling them is the reason so little is recovered. The metal is not the problem. The logistics are.

C) Where formal recycling does happen, two methods dominate. In the first, shredded material is fed into a smelter, which recovers copper and precious metals efficiently but destroys plastics and loses aluminium and rare earths in the slag. In the second, the material is dissolved in acid and the metals are recovered in sequence from the solution; this can extract a wider range of elements and works at a smaller scale, but it produces liquid waste that must itself be treated. Plants increasingly combine the two, and a growing number specialise in the black powder left when lithium batteries are shredded, from which cobalt, nickel and lithium can be recovered.

D) The informal sector is larger than the formal one and far more dangerous. In several countries, dismantling is done in yards and alleys by people who burn the plastic insulation off cables to get at the copper, heat circuit boards over open fires to loosen the chips, and leach gold with acid in buckets. The metals recovered this way re-enter the world market indistinguishable from any other. The cost is borne by the workers and their neighbours: the smoke carries dioxins and heavy metals, and studies around such sites have found lead and other contaminants in soil, dust, food and children's blood at levels far above any guideline.

E) Design decides much of what is possible later. A device glued shut, with a battery embedded in the case and a screen bonded to the frame, can be recycled only by shredding, which mixes everything together. The same device assembled with screws, with a battery that lifts out and components labelled with the alloys they contain, can be taken apart in minutes and its parts separated cleanly. Regulations in several regions now require replaceable batteries and the publication of disassembly instructions, and manufacturers have begun to publish scores for repairability, which measure much the same thing.

F) Collection is the step that most often fails. Householders keep old phones because they contain personal information, because they might be needed, or because there is nowhere obvious to take them; estimates of the number of unused phones sitting in homes run into the billions. Schemes that work tend to share three features: the return is free, it is physically easy — a box in a supermarket, a prepaid envelope, collection with the delivery of the replacement — and the data question is answered plainly, with certified erasure or visible destruction of the storage.

G) Behind all of this sits a change in how the material is regarded. Several governments now classify a list of metals as strategically critical, and recovering them domestically has become a matter of supply security as much as of environmental policy, particularly where mining and refining are concentrated in a small number of countries. That shift has brought money and attention to a problem that had none for thirty years. It has not yet changed the basic fact that recycling an old device costs more effort than throwing it away, which is the thing that any serious policy has to address.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison between discarded electronics and rock from a mine",
          "A",
          "A tonne of discarded circuit boards may hold several hundred times as much gold as a tonne of rock from a working mine.",
          "Paragraph A makes the comparison.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the point that handling costs, not metal content, limit recovery",
          "B",
          "The metal is not the problem. The logistics are.",
          "Paragraph B: 'The logistics are.'",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of two industrial processes and what each loses",
          "C",
          "In the first, shredded material is fed into a smelter, which recovers copper and precious metals efficiently but destroys plastics and loses aluminium and rare earths in the slag.",
          "Paragraph C: smelting and acid leaching.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "evidence of contamination affecting people living nearby",
          "D",
          "The cost is borne by the workers and their neighbours: the smoke carries dioxins and heavy metals, and studies around such sites have found lead and other contaminants in soil, dust, food and children's blood at levels far above any guideline.",
          "Paragraph D: contaminants in soil, dust, food and blood.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the features shared by successful return schemes",
          "F",
          "Schemes that work tend to share three features: the return is free, it is physically easy — a box in a supermarket, a prepaid envelope, collection with the delivery of the replacement — and the data question is answered plainly, with certified erasure or visible destruction of the storage.",
          "Paragraph F lists the three features.",
        ),
        pickTwo(
          REPAIR_STEM,
          REPAIR_CHANGES,
          "A or C",
          "The same device assembled with screws, with a battery that lifts out and components labelled with the alloys they contain, can be taken apart in minutes and its parts separated cleanly.",
          "A is described: screws rather than glue.",
        ),
        pickTwo(
          REPAIR_STEM,
          REPAIR_CHANGES,
          "A or C",
          "Regulations in several regions now require replaceable batteries and the publication of disassembly instructions, and manufacturers have begun to publish scores for repairability, which measure much the same thing.",
          "C is described: regulations 'require replaceable batteries'. B, D and E would all make recycling harder.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "Circuit boards can contain far more ______ than mined rock.",
          "gold",
          "A tonne of discarded circuit boards may hold several hundred times as much gold as a tonne of rock from a working mine.",
          "Several hundred times as much gold.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "Unlike ______, discarded devices arrive in small and varied batches.",
          "ore",
          "Ore arrives at a smelter in vast, uniform quantities; discarded electronics arrive in small, varied batches, each device built differently, and the cost of gathering, sorting and dismantling them is the reason so little is recovered.",
          "'Ore arrives… in vast, uniform quantities'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "The second industrial method dissolves the material in ______.",
          "acid",
          "In the second, the material is dissolved in acid and the metals are recovered in sequence from the solution; this can extract a wider range of elements and works at a smaller scale, but it produces liquid waste that must itself be treated.",
          "It 'is dissolved in acid'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "Informal workers burn the insulation off ______ to reach the copper.",
          "cables",
          "In several countries, dismantling is done in yards and alleys by people who burn the plastic insulation off cables to get at the copper, heat circuit boards over open fires to loosen the chips, and leach gold with acid in buckets.",
          "They 'burn the plastic insulation off cables'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "A device held together with ______ can only be shredded.",
          "glue",
          "A device glued shut, with a battery embedded in the case and a screen bonded to the frame, can be recycled only by shredding, which mixes everything together.",
          "'A device glued shut… can be recycled only by shredding'.",
        ),
        fromList(
          "summary_completion",
          WASTE_BANK,
          "Householders keep old phones partly because of the ______ stored on them.",
          "data",
          "Householders keep old phones because they contain personal information, because they might be needed, or because there is nowhere obvious to take them; estimates of the number of unused phones sitting in homes run into the billions.",
          "They 'contain personal information'.",
        ),
      ],
    },
    {
      key: "t40-p3-bilingualism",
      title: "Two Languages, One Mind",
      topic: "the rise and fall of claims about the bilingual brain",
      difficulty: 8,
      body: `For the first half of the twentieth century, the scientific consensus was that growing up with two languages harmed a child. Studies from the 1920s onwards reported that bilingual children scored lower on intelligence tests and lagged in school, and the conclusion was used to argue against immigrant languages being spoken at home. The studies were worthless. They compared poor immigrant children, tested in a language they were still learning, with middle-class monolingual children tested in their own; almost none controlled for income, schooling or the language of the test itself.

The correction came in 1962, when two researchers in Montreal matched their groups carefully for age, sex and social class and found the opposite result: their bilingual children did better on several measures, particularly those involving flexibility of thought. The paper changed the field, and over the following decades a large literature accumulated around a specific claim — that managing two languages trains the general machinery of mental control, because a bilingual speaker must constantly select one language and suppress the other, and that this practice produces advantages in unrelated tasks requiring attention and the inhibition of habitual responses.

The theory was plausible and the early evidence looked strong. Bilingual participants, from children to older adults, were reported to perform better on tasks in which a distracting element has to be ignored. Related work found that bilingual older adults presenting at memory clinics had been diagnosed with dementia several years later than monolingual patients, a finding that attracted enormous attention.

Then the picture changed. As studies grew larger, the advantage grew smaller, and several well-powered attempts found nothing at all. A review of conference abstracts made the reason uncomfortably clear: studies reporting a bilingual advantage were far more likely to be published than studies reporting none, which means the published literature was never a fair sample of the research conducted. Meta-analyses that attempted to correct for this reduced the effect towards zero. The dementia findings have held up better in some datasets than others, and are complicated by the fact that bilingual patients in those clinics were often immigrants, who differ from other patients in education, occupation and how late they seek help.

Some effects are not in dispute, because they are consequences of how vocabulary is learned rather than claims about general intelligence. A bilingual person typically knows somewhat fewer words in each language than a monolingual speaker of that language, since their experience is divided between two; counted across both languages, the total is larger. They are slower, by fractions of a second, at retrieving a word, and more prone to the state of having a word on the tip of the tongue. These findings are small, robust and of no practical importance to anybody. They are worth stating only because they are sometimes produced, by people on both sides, as though they were evidence about intelligence; they are evidence about how recently a particular word was last used.

What the argument has obscured is that the case for bilingualism never depended on any of it. Languages give access to families, communities, literatures and work. A child who cannot speak their grandparents' language is cut off from them, and a country whose schools treat home languages as an obstacle loses a resource it later pays to rebuild. None of that requires a measurable advantage on a laboratory task of attention, and staking the argument on such an advantage was always risky, because the advantage might not exist — as, on present evidence, it largely does not.

The episode has become a standard example in discussions of how psychology went wrong and how it is being repaired. The original claim was reasonable, the early evidence was real but selectively reported, the effect shrank under scrutiny, and the correction came from within the field, using larger samples, pre-registered predictions and analyses that account for what is missing from the published record. That is the system working, slowly and in public, on a question that many people had an emotional stake in. The children of bilingual households, meanwhile, have gone on speaking two languages, unaffected by the argument about what it was doing to them. Something over half the world's population does the same, which is worth remembering whenever bilingualism is described as a special condition requiring an explanation at all.`,
      questions: [
        mcq(
          "What was wrong with the studies conducted from the 1920s?",
          [
            "They tested too few children.",
            "They compared groups that differed in income, schooling and test language.",
            "They were conducted only in Montreal.",
            "They relied on teachers' reports rather than tests.",
          ],
          "They compared groups that differed in income, schooling and test language.",
          "They compared poor immigrant children, tested in a language they were still learning, with middle-class monolingual children tested in their own; almost none controlled for income, schooling or the language of the test itself.",
          "The groups differed in every relevant way.",
        ),
        mcq(
          "What specific claim did the literature after 1962 develop?",
          [
            "that bilingual children learn to read earlier",
            "that managing two languages trains general mental control",
            "that bilingualism increases vocabulary in each language",
            "that two languages are stored in different hemispheres",
          ],
          "that managing two languages trains general mental control",
          "The paper changed the field, and over the following decades a large literature accumulated around a specific claim — that managing two languages trains the general machinery of mental control, because a bilingual speaker must constantly select one language and suppress the other, and that this practice produces advantages in unrelated tasks requiring attention and the inhibition of habitual responses.",
          "The claim concerned 'the general machinery of mental control'.",
        ),
        mcq(
          "What did the review of conference abstracts reveal?",
          [
            "Most bilingual research is never presented at conferences.",
            "Studies finding an advantage were more likely to be published.",
            "Conference results are usually wrong.",
            "Researchers had misunderstood the statistics.",
          ],
          "Studies finding an advantage were more likely to be published.",
          "A review of conference abstracts made the reason uncomfortably clear: studies reporting a bilingual advantage were far more likely to be published than studies reporting none, which means the published literature was never a fair sample of the research conducted.",
          "Positive studies 'were far more likely to be published'.",
        ),
        mcq(
          "Why does the writer call the dementia findings complicated?",
          [
            "The patients were too old to be tested reliably.",
            "Bilingual patients in those clinics differed in other ways from monolingual ones.",
            "Dementia cannot be diagnosed in two languages.",
            "The studies were never published.",
          ],
          "Bilingual patients in those clinics differed in other ways from monolingual ones.",
          "The dementia findings have held up better in some datasets than others, and are complicated by the fact that bilingual patients in those clinics were often immigrants, who differ from other patients in education, occupation and how late they seek help.",
          "They 'differ from other patients in education, occupation and how late they seek help'.",
        ),
        fromList(
          "matching_sentence_endings",
          LANGUAGE_ENDINGS,
          "Early twentieth-century studies found bilingual children performed worse",
          "when the studies compared children of different social backgrounds.",
          "They compared poor immigrant children, tested in a language they were still learning, with middle-class monolingual children tested in their own; almost none controlled for income, schooling or the language of the test itself.",
          "The comparison groups differed in social background.",
        ),
        fromList(
          "matching_sentence_endings",
          LANGUAGE_ENDINGS,
          "Researchers expected a general mental advantage",
          "because the two languages are both active and must be managed.",
          "The paper changed the field, and over the following decades a large literature accumulated around a specific claim — that managing two languages trains the general machinery of mental control, because a bilingual speaker must constantly select one language and suppress the other, and that this practice produces advantages in unrelated tasks requiring attention and the inhibition of habitual responses.",
          "A speaker 'must constantly select one language and suppress the other'.",
        ),
        fromList(
          "matching_sentence_endings",
          LANGUAGE_ENDINGS,
          "The published literature overstated the effect",
          "when small studies with positive results were more likely to be published.",
          "A review of conference abstracts made the reason uncomfortably clear: studies reporting a bilingual advantage were far more likely to be published than studies reporting none, which means the published literature was never a fair sample of the research conducted.",
          "Publication favoured positive results.",
        ),
        fromList(
          "matching_sentence_endings",
          LANGUAGE_ENDINGS,
          "A bilingual speaker's vocabulary is larger",
          "when the total across both languages is counted.",
          "A bilingual person typically knows somewhat fewer words in each language than a monolingual speaker of that language, since their experience is divided between two; counted across both languages, the total is larger.",
          "'Counted across both languages, the total is larger'.",
        ),
        ynng(
          "The writer regards the studies from the 1920s as scientifically sound.",
          "NO",
          "The studies were worthless.",
          "'The studies were worthless.'",
        ),
        ynng(
          "The writer accepts that the 1962 study was better designed than its predecessors.",
          "YES",
          "The correction came in 1962, when two researchers in Montreal matched their groups carefully for age, sex and social class and found the opposite result: their bilingual children did better on several measures, particularly those involving flexibility of thought.",
          "Its groups were 'matched carefully'.",
        ),
        ynng(
          "The writer thinks the evidence for a general bilingual advantage is now strong.",
          "NO",
          "As studies grew larger, the advantage grew smaller, and several well-powered attempts found nothing at all.",
          "Larger studies found 'nothing at all'.",
        ),
        ynng(
          "The writer believes the differences in word retrieval matter in everyday life.",
          "NO",
          "These findings are small, robust and of no practical importance to anybody.",
          "They are 'of no practical importance to anybody'.",
        ),
        ynng(
          "The writer holds that the case for bilingualism rests on reasons other than test performance.",
          "YES",
          "Languages give access to families, communities, literatures and work.",
          "The case rests on access to families, communities and work.",
        ),
        ynng(
          "The writer sees the history of this research as a sign that the field corrects itself.",
          "YES",
          "That is the system working, slowly and in public, on a question that many people had an emotional stake in.",
          "'That is the system working'.",
        ),
      ],
    },
  ],
};
