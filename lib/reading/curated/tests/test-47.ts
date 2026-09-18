import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · archaeology · notes ----------------------------------------

const SITE = {
  title: "The Norse site in Newfoundland",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs, people -------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const DRONE_PEOPLE = ["Esther Mwangi", "Paul Lefebvre", "Naledi Dube", "Tom Ashcroft"];

// ---- Passage 3 · research debate · word bank --------------------------------

const IQ_BANK = [
  "abstract",
  "decade",
  "nutrition",
  "norms",
  "schooling",
  "reversal",
  "brothers",
  "vocabulary",
  "average",
  "cutoff",
];

export const TEST_47: CuratedTest = {
  key: "full-test-47",
  targetBand: 8,
  passages: [
    {
      key: "t47-p1-lanse-aux-meadows",
      title: "Eight Buildings in a Meadow",
      topic: "the Norse settlement found on the coast of Newfoundland",
      difficulty: 7,
      body: `The medieval Icelandic sagas describe voyages westward from Greenland to a country the Norse called Vinland, where the settlers built houses, cut timber, fought the people already living there and went home. For centuries the accounts were treated as literature rather than evidence. Historians accepted that the Norse had reached Greenland, which is not in dispute, but the further claim attracted a long series of forgeries and enthusiastic misreadings — runic stones in American fields, maps of doubtful provenance — which made professional archaeologists reluctant to look at all.

The site that settled the question was found in 1960, at the northern tip of Newfoundland, by a Norwegian couple: Helge Ingstad, an explorer and writer, and Anne Stine Ingstad, an archaeologist. They had sailed along the coast asking local people about old ruins, and at a fishing village a resident named George Decker led them to a group of low, grassy ridges near a shallow bay that everyone in the area had known about for generations and taken for an old native or European camp.

Excavation over the following eight years uncovered the outlines of eight buildings, timber-framed with walls and roofs of turf, laid out in a pattern familiar from Norse sites in Iceland and Greenland. There were three dwellings, each with a central hearth, and smaller structures used as workshops. One contained a forge with a stone anvil and slag from the working of bog iron, which is the earliest known ironworking in the Americas. Hundreds of iron nails and rivets, the fastenings of ships, were found nearby, along with evidence that boats had been repaired there.

Two small objects settled the identification beyond argument. A soapstone spindle whorl, used in spinning thread, and a bone needle hone are both domestic items of Norse type; the whorl in particular indicates the presence of women, and therefore of a settlement rather than a raiding party. A bronze cloak pin of Norse design was also recovered. Nothing in the assemblage belongs to the Indigenous cultures of the region, whose own sites in the area are of different periods.

The site also contained something that had not grown anywhere near it. Butternuts, the fruit of a walnut relative, were found in the Norse layers, and the tree does not grow in Newfoundland; its northern limit lies well to the south-west, in the region around the Gulf of St Lawrence. Whoever brought them had travelled considerably further than the settlement itself, which fits the sagas' description of a land where grapes grew and supports the idea that the site was a base for exploring southwards rather than a destination.

Radiocarbon dating placed the occupation around the year 1000, with the usual uncertainty of several decades. In 2021 a team obtained a far sharper date using an event recorded in trees worldwide: a burst of cosmic radiation in the year 993 left a distinctive signature in the wood grown that season. Finding the signature in three pieces of worked wood from the site, and counting the rings outward to the bark, showed that the trees had been cut in the year 1021 — the first precise date for Europeans in the Americas, five centuries before Columbus.

Where exactly Vinland lay is a separate question, and the site does not answer it. The sagas describe a country of wild grapes and self-sown wheat, neither of which grows at this latitude, so the name probably belonged to the region the butternuts came from rather than to the camp itself. The buildings look less like a colony than like a base: somewhere to overwinter, repair boats and store timber before sailing home.

The settlement did not last. The buildings show no sign of long occupation, there are no burials and no middens of the size a permanent community leaves, and the sagas describe a withdrawal after conflict with the people the Norse called skraelings. A few years, or a few seasons repeated over a decade, would account for everything found. What defeated the enterprise was probably not the climate but the arithmetic: a colony several weeks' sail from Greenland, itself a marginal settlement, facing an established population that outnumbered it.

The site was declared a World Heritage Site in 1978. Its buildings are reconstructions; the originals survive as shallow depressions in the turf, which is what the Ingstads were shown by a man who had lived beside them all his life.`,
      questions: [
        noteLine(
          SITE,
          "Finding the site",
          "Found in 1960 by a Norwegian explorer and his wife, an ______",
          "archaeologist",
          "The site that settled the question was found in 1960, at the northern tip of Newfoundland, by a Norwegian couple: Helge Ingstad, an explorer and writer, and Anne Stine Ingstad, an archaeologist.",
          "Anne Stine Ingstad was 'an archaeologist'.",
        ),
        noteLine(
          SITE,
          "Finding the site",
          "A local ______ led them to the grassy ridges",
          "resident",
          "They had sailed along the coast asking local people about old ruins, and at a fishing village a resident named George Decker led them to a group of low, grassy ridges near a shallow bay that everyone in the area had known about for generations and taken for an old native or European camp.",
          "'A resident named George Decker led them'.",
        ),
        noteLine(
          SITE,
          "What was found",
          "Eight buildings with walls and roofs made of ______",
          "turf",
          "Excavation over the following eight years uncovered the outlines of eight buildings, timber-framed with walls and roofs of turf, laid out in a pattern familiar from Norse sites in Iceland and Greenland.",
          "They were 'timber-framed with walls and roofs of turf'.",
        ),
        noteLine(
          SITE,
          "What was found",
          "A workshop held a ______ with a stone anvil and iron slag",
          "forge",
          "One contained a forge with a stone anvil and slag from the working of bog iron, which is the earliest known ironworking in the Americas.",
          "It 'contained a forge with a stone anvil'.",
        ),
        noteLine(
          SITE,
          "What was found",
          "A spindle ______ indicates that women were present",
          "whorl",
          "A soapstone spindle whorl, used in spinning thread, and a bone needle hone are both domestic items of Norse type; the whorl in particular indicates the presence of women, and therefore of a settlement rather than a raiding party.",
          "'The whorl in particular indicates the presence of women'.",
        ),
        noteLine(
          SITE,
          "Dating",
          "______ found at the site grow only much further south-west",
          "Butternuts",
          "Butternuts, the fruit of a walnut relative, were found in the Norse layers, and the tree does not grow in Newfoundland; its northern limit lies well to the south-west, in the region around the Gulf of St Lawrence.",
          "The butternut 'does not grow in Newfoundland'.",
        ),
        noteLine(
          SITE,
          "Dating",
          "A burst of cosmic radiation in 993 left a signature in that year's ______",
          "wood",
          "In 2021 a team obtained a far sharper date using an event recorded in trees worldwide: a burst of cosmic radiation in the year 993 left a distinctive signature in the wood grown that season.",
          "The signature is 'in the wood grown that season'.",
        ),
        tfng(
          "Claims about Norse voyages to America had previously been damaged by forgeries.",
          "TRUE",
          "Historians accepted that the Norse had reached Greenland, which is not in dispute, but the further claim attracted a long series of forgeries and enthusiastic misreadings — runic stones in American fields, maps of doubtful provenance — which made professional archaeologists reluctant to look at all.",
          "Forgeries made archaeologists 'reluctant to look at all'.",
        ),
        tfng(
          "Local people were unaware of the ridges before 1960.",
          "FALSE",
          "They had sailed along the coast asking local people about old ruins, and at a fishing village a resident named George Decker led them to a group of low, grassy ridges near a shallow bay that everyone in the area had known about for generations and taken for an old native or European camp.",
          "Everyone 'had known about [them] for generations'.",
        ),
        tfng(
          "Objects belonging to Indigenous cultures were found mixed with the Norse material.",
          "FALSE",
          "Nothing in the assemblage belongs to the Indigenous cultures of the region, whose own sites in the area are of different periods.",
          "'Nothing in the assemblage belongs to the Indigenous cultures'.",
        ),
        tfng(
          "The 2021 study produced a date accurate to a single year.",
          "TRUE",
          "Finding the signature in three pieces of worked wood from the site, and counting the rings outward to the bark, showed that the trees had been cut in the year 1021 — the first precise date for Europeans in the Americas, five centuries before Columbus.",
          "The trees 'had been cut in the year 1021'.",
        ),
        tfng(
          "The settlement was occupied for at least a century.",
          "FALSE",
          "A few years, or a few seasons repeated over a decade, would account for everything found.",
          "A few years would 'account for everything found'.",
        ),
        tfng(
          "The writer believes the climate was the main reason the settlement failed.",
          "FALSE",
          "What defeated the enterprise was probably not the climate but the arithmetic: a colony several weeks' sail from Greenland, itself a marginal settlement, facing an established population that outnumbered it.",
          "It was 'probably not the climate but the arithmetic'.",
        ),
      ],
    },
    {
      key: "t47-p2-medical-drones",
      title: "Blood by Air",
      topic: "delivering medical supplies by drone in hard-to-reach places",
      difficulty: 8,
      body: `A) A hospital in a rural district may need four units of a particular blood type within the hour, and may be four hours from the warehouse that holds them by a road that floods for part of the year. The conventional answers are to stock blood locally, which wastes it, since blood expires; or to move it by motorcycle, which is slow and unreliable; or to do without, which is what usually happens. Since 2016, a third answer has been operating at national scale in Rwanda and later in Ghana, Nigeria and several other countries: small fixed-wing aircraft, launched by catapult from a handful of distribution centres, that fly to a hospital, drop a padded box by parachute and return without landing.

B) The design decisions follow from the problem. Fixed wings rather than rotors, because the distances are long and lift is expensive; no landing at the destination, because a landing site would have to be prepared, cleared and staffed; a parachute drop onto a marked patch of ground the size of a few parking spaces; and a catapult launch and hooked recovery at the base, which removes the need for a runway. A delivery that took four hours takes about fifteen minutes, and the aircraft flies in most weather.

C) The most important consequence is not speed but inventory. If a hospital can obtain any blood product within half an hour, it does not need to keep a stock of every type, and the stock can sit in one refrigerated centre instead of forty. Waste from expiry falls sharply, and hospitals can order rare types they would never have held. Health systems researcher Dr Esther Mwangi, who has evaluated the Rwandan programme, says this is the part that is usually missed. "People report the flight time because it is dramatic," she says. "The saving is in the warehouse."

D) Evidence of benefit has taken longer to assemble than the publicity suggested. Published evaluations report reductions in wastage and in the time to transfusion, and in one study a fall in deaths from haemorrhage after childbirth at hospitals served by the network — a result that is plausible and also difficult to attribute, since other things changed in the same period. Public health physician Dr Naledi Dube argues that the comparison usually offered is the wrong one. "The question is not whether a drone beats a motorbike," she says. "It is whether the money spent on the network would have saved more lives spent on something else, and almost nobody has run that comparison honestly."

E) Cost is genuinely contested. Operators quote a price per delivery in the range of ordinary courier services, and note that the system replaces a fleet of vehicles, drivers and fuel. Critics point out that the published figures usually exclude the cost of the distribution centres, the regulatory work, and the years of subsidised operation that preceded them. Logistics economist Paul Lefebvre has modelled several networks and finds the result depends almost entirely on volume. "At fifty flights a day it is competitive," he says. "At five it is an expensive way of moving a small box."

F) Regulation was the slowest part and is now the exportable achievement. Flying beyond the operator's line of sight, over populated areas, in shared airspace, required rules that did not exist. The countries that moved first did so because their aviation authorities were willing to write them, and because the alternative was so plainly inadequate; wealthier countries with busier skies and more cautious regulators took years longer to permit the same operations. Aviation lawyer Tom Ashcroft observes that the usual direction of technology transfer has been reversed. "The regulatory template for routine long-range drone flight was written in East Africa," he says, "and Europe is still catching up with it."

G) What the systems do not do is worth stating plainly. They carry a few kilograms, so they move blood, vaccines, antivenom and diagnostic samples, not oxygen cylinders or equipment. They require a distribution centre with reliable power and trained staff. They do not address the reasons a hospital lacks a surgeon, a functioning theatre or electricity, and a delivery that arrives in fifteen minutes at a clinic with no one to use it saves nobody. The people who run the networks say this themselves, more often than their admirers do.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why the aircraft do not land at their destination",
          "B",
          "Fixed wings rather than rotors, because the distances are long and lift is expensive; no landing at the destination, because a landing site would have to be prepared, cleared and staffed; a parachute drop onto a marked patch of ground the size of a few parking spaces; and a catapult launch and hooked recovery at the base, which removes the need for a runway.",
          "Paragraph B: a landing site would need preparing and staffing.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the point that the main gain is in how stock is held",
          "C",
          "If a hospital can obtain any blood product within half an hour, it does not need to keep a stock of every type, and the stock can sit in one refrigerated centre instead of forty.",
          "Paragraph C: centralised inventory.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a claim that the number of flights determines whether the system pays",
          "E",
          '"At fifty flights a day it is competitive," he says. "At five it is an expensive way of moving a small box."',
          "Paragraph E: volume decides.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an observation that expertise has moved in an unusual direction",
          "F",
          '"The regulatory template for routine long-range drone flight was written in East Africa," he says, "and Europe is still catching up with it."',
          "Paragraph F: the template came from East Africa.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Blood kept locally is often wasted because it ______.",
          "expires",
          "The conventional answers are to stock blood locally, which wastes it, since blood expires; or to move it by motorcycle, which is slow and unreliable; or to do without, which is what usually happens.",
          "Stocking locally wastes it 'since blood expires'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The aircraft are launched by ______ from the distribution centre.",
          "catapult",
          "Since 2016, a third answer has been operating at national scale in Rwanda and later in Ghana, Nigeria and several other countries: small fixed-wing aircraft, launched by catapult from a handful of distribution centres, that fly to a hospital, drop a padded box by parachute and return without landing.",
          "They are 'launched by catapult'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Deliveries arrive by ______ onto a marked patch of ground.",
          "parachute",
          "Since 2016, a third answer has been operating at national scale in Rwanda and later in Ghana, Nigeria and several other countries: small fixed-wing aircraft, launched by catapult from a handful of distribution centres, that fly to a hospital, drop a padded box by parachute and return without landing.",
          "The box is dropped 'by parachute'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "A journey of four hours is reduced to about ______ minutes.",
          "fifteen",
          "A delivery that took four hours takes about fifteen minutes, and the aircraft flies in most weather.",
          "It 'takes about fifteen minutes'.",
        ),
        fromList(
          "matching_features",
          DRONE_PEOPLE,
          "The real benefit is less visible than the flight itself.",
          "Esther Mwangi",
          '"People report the flight time because it is dramatic," she says. "The saving is in the warehouse."',
          "Mwangi: 'The saving is in the warehouse.'",
        ),
        fromList(
          "matching_features",
          DRONE_PEOPLE,
          "The right comparison is with other uses of the same money.",
          "Naledi Dube",
          '"It is whether the money spent on the network would have saved more lives spent on something else, and almost nobody has run that comparison honestly."',
          "Dube on the alternative uses of the money.",
        ),
        fromList(
          "matching_features",
          DRONE_PEOPLE,
          "Whether the economics work depends on how busy the network is.",
          "Paul Lefebvre",
          '"At fifty flights a day it is competitive," he says. "At five it is an expensive way of moving a small box."',
          "Lefebvre on volume.",
        ),
        fromList(
          "matching_features",
          DRONE_PEOPLE,
          "Rules for these flights were written first in poorer countries.",
          "Tom Ashcroft",
          '"The regulatory template for routine long-range drone flight was written in East Africa," he says, "and Europe is still catching up with it."',
          "Ashcroft on where the rules came from.",
        ),
        fromList(
          "matching_features",
          DRONE_PEOPLE,
          "Measuring the drone against the vehicle it replaces is the wrong test.",
          "Naledi Dube",
          '"The question is not whether a drone beats a motorbike," she says.',
          "Dube: the motorbike comparison is not the question.",
        ),
      ],
    },
    {
      key: "t47-p3-flynn-effect",
      title: "The Rising Scores",
      topic: "why average intelligence-test scores climbed for most of a century",
      difficulty: 9,
      body: `Intelligence tests are built to produce an average score of one hundred. They achieve this by comparing each person's answers with those of a large sample, and adjusting the scale so that the sample's mean sits at one hundred. This is ordinary practice, and it conceals something remarkable: to keep the average at one hundred, the tests have had to be made harder, decade after decade, for most of the twentieth century.

The pattern was documented systematically in the 1980s by a political scientist who collected test data from dozens of countries, and it now carries his name. Scores rose by roughly three points per decade wherever records existed — in Europe, North America, Japan, Brazil, Kenya — over periods as long as a century in some datasets. The size of the change is easy to underestimate. A person of average ability today would score well above average against the standards of 1930; measured against today's standards, the average person of 1930 would appear to be performing at a level that would now prompt concern.

Nobody believes the change reflects a rise in innate capacity: a century is far too short for that, and the relevant populations did not change genetically in the required way. Nor are the gains uniform across the tests. They are largest on the subtests that involve abstract pattern-finding — completing sequences of shapes, sorting items by rule, reasoning about hypothetical situations — and much smaller, sometimes absent, on arithmetic and vocabulary, which look more like the contents of a classroom.

That distribution is what most explanations have to account for. Better nutrition and health in childhood plausibly raise performance across the board and are supported by parallel gains in height; schooling has expanded enormously, and years of education predict test performance strongly; family sizes fell, which means more adult attention per child. The explanation offered by the researcher who identified the effect points at the pattern rather than the resources: modern life, he argued, trains people to think in categories and hypotheticals, because work, schooling and entertainment increasingly demand it. Asked what dogs and rabbits have in common, a person schooled in abstraction says both are animals; a person whose life has trained them differently says one is used to hunt the other. The first answer is the one the test rewards.

The strongest evidence for an environmental explanation of some kind comes from the reversal. In several northern European countries, where military conscription produced complete test records for young men over decades, scores stopped rising in the 1990s and began to fall. Because those records include brothers, researchers were able to compare young men from the same families born a few years apart, and found the decline within families as well as between them — which rules out explanations based on changes in who was having children, and points to something in the shared environment of each successive cohort.

What the effect does not settle is what the tests measure. Two readings are possible, and both have serious defenders. On one, the rise shows that test scores are a poor proxy for a fixed underlying ability, since a quantity that moves this fast with the environment cannot be the stable trait the tests were designed to capture. On the other, the tests measure something real that has genuinely improved: people today are better at exactly the kind of abstract reasoning the modern world requires, and there is no reason to call that improvement illusory.

There is also a question about what happens next, and the honest answer is that nobody knows. The rise has slowed or stopped in most wealthy countries while continuing in several others where schooling and nutrition are still improving quickly, which is what an environmental account would predict. Whether the northern European decline spreads, and what is causing it, remains unsettled.

The practical consequences are not abstract at all. Test scores are used to decide eligibility for special education, for disability support, for military entry, and in some jurisdictions in capital cases where a threshold score determines whether a defendant may be executed. If the scale drifts by three points a decade, a fixed numerical threshold means something different every year, and a test that has not been restandardised for twenty years will classify people quite differently from one that has. Courts have had to consider this explicitly, which is an unusual afterlife for a statistical curiosity noticed in the reference tables of test manuals.`,
      questions: [
        mcq(
          "How do test publishers keep the average score at one hundred?",
          [
            "by testing only representative samples",
            "by adjusting the scale against a large sample",
            "by removing questions that most people answer correctly",
            "by using the same questions in every country",
          ],
          "by adjusting the scale against a large sample",
          "They achieve this by comparing each person's answers with those of a large sample, and adjusting the scale so that the sample's mean sits at one hundred.",
          "The scale is adjusted so the sample mean is one hundred.",
        ),
        mcq(
          "On which parts of the tests were the gains largest?",
          [
            "arithmetic",
            "vocabulary",
            "abstract pattern-finding",
            "general knowledge",
          ],
          "abstract pattern-finding",
          "They are largest on the subtests that involve abstract pattern-finding — completing sequences of shapes, sorting items by rule, reasoning about hypothetical situations — and much smaller, sometimes absent, on arithmetic and vocabulary, which look more like the contents of a classroom.",
          "The gains are 'largest on the subtests that involve abstract pattern-finding'.",
        ),
        mcq(
          "Why is the comparison of brothers important?",
          [
            "It shows the decline occurs within families, not just between them.",
            "It proves that the effect is genetic.",
            "It shows that older brothers score higher.",
            "It allowed researchers to test women as well.",
          ],
          "It shows the decline occurs within families, not just between them.",
          "Because those records include brothers, researchers were able to compare young men from the same families born a few years apart, and found the decline within families as well as between them — which rules out explanations based on changes in who was having children, and points to something in the shared environment of each successive cohort.",
          "The decline appears 'within families as well as between them'.",
        ),
        mcq(
          "What practical problem does the effect create?",
          [
            "Tests take longer to administer than before.",
            "A fixed score threshold changes meaning as the scale drifts.",
            "Test publishers cannot recruit large samples.",
            "Scores can no longer be compared between countries.",
          ],
          "A fixed score threshold changes meaning as the scale drifts.",
          "If the scale drifts by three points a decade, a fixed numerical threshold means something different every year, and a test that has not been restandardised for twenty years will classify people quite differently from one that has.",
          "A fixed threshold 'means something different every year'.",
        ),
        fromList(
          "summary_completion",
          IQ_BANK,
          "Scores rose by about three points per ______ wherever records exist.",
          "decade",
          "Scores rose by roughly three points per decade wherever records existed — in Europe, North America, Japan, Brazil, Kenya — over periods as long as a century in some datasets.",
          "'Roughly three points per decade'.",
        ),
        fromList(
          "summary_completion",
          IQ_BANK,
          "Gains were smallest on arithmetic and ______.",
          "vocabulary",
          "They are largest on the subtests that involve abstract pattern-finding — completing sequences of shapes, sorting items by rule, reasoning about hypothetical situations — and much smaller, sometimes absent, on arithmetic and vocabulary, which look more like the contents of a classroom.",
          "They were smaller 'on arithmetic and vocabulary'.",
        ),
        fromList(
          "summary_completion",
          IQ_BANK,
          "Improvements in ______ are supported by parallel increases in height.",
          "nutrition",
          "Better nutrition and health in childhood plausibly raise performance across the board and are supported by parallel gains in height; schooling has expanded enormously, and years of education predict test performance strongly; family sizes fell, which means more adult attention per child.",
          "Nutrition is supported by 'parallel gains in height'.",
        ),
        fromList(
          "summary_completion",
          IQ_BANK,
          "One explanation is that modern life trains people to think in ______ terms.",
          "abstract",
          "The explanation offered by the researcher who identified the effect points at the pattern rather than the resources: modern life, he argued, trains people to think in categories and hypotheticals, because work, schooling and entertainment increasingly demand it.",
          "Modern life 'trains people to think in categories and hypotheticals'.",
        ),
        fromList(
          "summary_completion",
          IQ_BANK,
          "A ______ of the trend has been recorded in northern Europe since the 1990s.",
          "reversal",
          "In several northern European countries, where military conscription produced complete test records for young men over decades, scores stopped rising in the 1990s and began to fall.",
          "Scores 'stopped rising in the 1990s and began to fall'.",
        ),
        fromList(
          "summary_completion",
          IQ_BANK,
          "Conscription data allowed comparisons between ______ born a few years apart.",
          "brothers",
          "Because those records include brothers, researchers were able to compare young men from the same families born a few years apart, and found the decline within families as well as between them — which rules out explanations based on changes in who was having children, and points to something in the shared environment of each successive cohort.",
          "The records 'include brothers'.",
        ),
        ynng(
          "The writer accepts that the rise in scores reflects a change in inherited ability.",
          "NO",
          "Nobody believes the change reflects a rise in innate capacity: a century is far too short for that, and the relevant populations did not change genetically in the required way.",
          "'Nobody believes the change reflects a rise in innate capacity'.",
        ),
        ynng(
          "The writer regards the within-family evidence as pointing to environmental causes.",
          "YES",
          "Because those records include brothers, researchers were able to compare young men from the same families born a few years apart, and found the decline within families as well as between them — which rules out explanations based on changes in who was having children, and points to something in the shared environment of each successive cohort.",
          "It 'points to something in the shared environment'.",
        ),
        ynng(
          "The writer thinks only one interpretation of what the tests measure is defensible.",
          "NO",
          "Two readings are possible, and both have serious defenders.",
          "'Both have serious defenders.'",
        ),
        ynng(
          "The writer believes the effect has consequences beyond academic debate.",
          "YES",
          "The practical consequences are not abstract at all.",
          "'The practical consequences are not abstract at all.'",
        ),
      ],
    },
  ],
};
