import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · food production · notes box --------------------------------

const LARVA_NOTES = {
  title: "Why the larva is efficient",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · trade certification · people and a word bank --------------

const LABEL_PEOPLE = ["Rosalind Achebe", "Tomás Iglesias", "Mei-Ling Chow", "Robert Kagwe"];
const LABEL_BANK = [
  "minimum",
  "audit",
  "cooperative",
  "premium",
  "oversupply",
  "shelf",
  "fees",
  "quality",
  "smallholders",
];

// ---- Passage 3 · plant pathology · lettered paragraphs ---------------------

const RUST_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const RUST_ENDINGS = [
  "because the spores travel on the wind and cross an ocean in a season.",
  "which is why a resistant variety stops being resistant within a decade or two.",
  "since the mountain slopes that grow the best coffee are now warm enough for the fungus.",
  "although a farmer who replants waits four years for the first crop.",
  "because the disease attacks the leaf and not the fruit that is sold.",
  "even though the same plantation may have been productive for a century.",
  "which makes the shade trees a defence and a liability at the same time.",
];

export const TEST_97: CuratedTest = {
  key: "full-test-97",
  targetBand: 4,
  passages: [
    {
      key: "t97-p1-insect-protein",
      title: "Protein from the Larva",
      topic: "an animal that converts waste into food with unusual efficiency",
      difficulty: 4,
      body: `The black soldier fly is an unremarkable insect with one remarkable property. Its larva will eat almost any organic material — food waste, spent grain from a brewery, manure, the residue from pressing oil seeds — and convert a large fraction of it into its own body, which is about forty per cent protein and thirty per cent fat by dry weight. The adult fly does not eat at all, does not bite and does not enter houses, which makes the species unusually convenient to farm.

The efficiency figures are the reason anyone is interested. A larva converts feed to body mass several times more efficiently than a chicken and roughly ten times more efficiently than a cow, and it does so on material that none of those animals could eat. It needs very little water. It occupies almost no space, because larvae can be grown in stacked trays rather than in a field. And it completes a generation in about a month, which means a producer can respond to demand in weeks rather than years.

The process is straightforward. Adults are kept in a netted cage with light and warmth, where they mate and lay eggs in slots cut into cardboard or wood. The eggs are collected and hatched, and the young larvae are put into trays of feed. They eat for about two weeks, increasing their weight several thousand times, and are then harvested just before they would stop feeding and crawl away to pupate. This last stage is exploited rather than prevented: mature larvae naturally climb out of wet feed, so a tray with a ramp collects them without anyone having to sort them.

A rearing hall is therefore not a farm in any recognisable sense. It is a warm building of shelving, with a cage of flies at one end, trays of feed moving through the middle, and a drying and milling line at the other, run by a handful of people and monitored mostly for temperature and humidity.

Two products come out. The larvae themselves are dried and milled into a meal used in animal feed, principally for fish, poultry and pets. What is left of the feed, together with the larval droppings, is a residue called frass, which is a usable fertiliser and is sold as one. Nothing about this is new in principle; it is composting with an animal in the middle, and the animal captures part of the material as protein instead of allowing all of it to become heat and carbon dioxide.

The market has so far been almost entirely in feed rather than in food. The reason is partly regulatory and partly simple. In most jurisdictions an insect intended for human consumption must be authorised as a novel food, a process that takes years and costs money, whereas approval as a feed ingredient has been quicker. And the economics are clearer: the meal competes with fishmeal, which is expensive, made from wild-caught fish, and therefore both costly and awkward, so a substitute has a ready market that does not depend on persuading anybody to eat an insect.

Two obstacles are real. The first is the feed itself: the attraction of the method is that it upgrades waste, but in most countries the waste streams that would be ideal — catering waste, in particular — are the ones the law forbids feeding to animals, for reasons connected to disease outbreaks in the past. Many operations therefore run on clean agricultural by-products, which have alternative uses and a price, and the economics are consequently much tighter than the publicity suggests. The second is energy: the larvae need warmth, and in a cold climate heating a rearing hall can consume more energy than the protein is worth.

What the industry has established is that the biology works and scales. Facilities processing tens of thousands of tonnes of feedstock a year are operating in several countries. What it has not established is that the costs come out right without a subsidy or a waste-disposal fee attached to the incoming material. The honest description of the sector at present is a working technology looking for the regulatory permission to use the cheap input it was designed for. Several countries have begun to relax those rules for specific waste streams, cautiously and with testing requirements attached, and the sector's prospects depend on that process more than on any further improvement to the insect.`,
      questions: [
        tfng(
          "The adult black soldier fly feeds on organic waste.",
          "FALSE",
          "The adult fly does not eat at all, does not bite and does not enter houses, which makes the species unusually convenient to farm.",
          "The adult 'does not eat at all'.",
        ),
        tfng(
          "The larvae convert feed more efficiently than cattle do.",
          "TRUE",
          "A larva converts feed to body mass several times more efficiently than a chicken and roughly ten times more efficiently than a cow, and it does so on material that none of those animals could eat.",
          "Roughly ten times a cow's efficiency.",
        ),
        tfng(
          "Larvae have to be separated from the feed by hand.",
          "FALSE",
          "This last stage is exploited rather than prevented: mature larvae naturally climb out of wet feed, so a tray with a ramp collects them without anyone having to sort them.",
          "They climb out by themselves.",
        ),
        tfng(
          "The residue left behind is treated as waste.",
          "FALSE",
          "What is left of the feed, together with the larval droppings, is a residue called frass, which is a usable fertiliser and is sold as one.",
          "Frass is sold as a fertiliser.",
        ),
        tfng(
          "Approval for animal feed has been faster than approval for human food.",
          "TRUE",
          "In most jurisdictions an insect intended for human consumption must be authorised as a novel food, a process that takes years and costs money, whereas approval as a feed ingredient has been quicker.",
          "Feed approval 'has been quicker'.",
        ),
        tfng(
          "Catering waste is the feedstock most operations actually use.",
          "FALSE",
          "Many operations therefore run on clean agricultural by-products, which have alternative uses and a price, and the economics are consequently much tighter than the publicity suggests.",
          "They run on clean by-products instead.",
        ),
        tfng(
          "Insect meal is cheaper than fishmeal at present.",
          "NOT GIVEN",
          "",
          "The passage says fishmeal is expensive but gives no comparison of prices.",
        ),
        noteLine(
          LARVA_NOTES,
          null,
          "Needs very little ______",
          "water",
          "It needs very little water.",
          "Water use is very low.",
          { before: [{ text: "Advantages over conventional livestock:", indent: 0 }] },
        ),
        noteLine(
          LARVA_NOTES,
          null,
          "Grown in stacked ______ rather than in a field",
          "trays",
          "It occupies almost no space, because larvae can be grown in stacked trays rather than in a field.",
          "They are grown in stacked trays.",
        ),
        noteLine(
          LARVA_NOTES,
          null,
          "A generation takes about a ______",
          "month",
          "And it completes a generation in about a month, which means a producer can respond to demand in weeks rather than years.",
          "A generation is about a month.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Eggs are laid in slots cut into ______ or wood.",
          "cardboard",
          "Adults are kept in a netted cage with light and warmth, where they mate and lay eggs in slots cut into cardboard or wood.",
          "Slots are cut in cardboard or wood.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Dried larvae are milled into a ______ used in animal feed.",
          "meal",
          "The larvae themselves are dried and milled into a meal used in animal feed, principally for fish, poultry and pets.",
          "They become a meal.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In a cold country the cost of ______ a rearing hall may exceed the value of the protein.",
          "heating",
          "The second is energy: the larvae need warmth, and in a cold climate heating a rearing hall can consume more energy than the protein is worth.",
          "Heating may cost more than the protein is worth.",
        ),
      ],
    },
    {
      key: "t97-p2-fair-trade",
      title: "The Label That Promises a Price",
      topic: "a certification scheme, and the arguments about what it actually delivers",
      difficulty: 4,
      body: `A certification label on a packet of coffee or cocoa is a claim about how the contents were bought. The best-known schemes work in a similar way: a minimum price is guaranteed to the producer regardless of what the market does, an additional sum called a premium is paid on top, the producer organisation must be democratically run, and an inspector visits to verify all of it. Consumers pay more at the shelf, and the difference is supposed to reach the farm. Whether it does, how much of it does, and which farms it reaches are three separate questions, and the research of the last twenty years has produced fairly clear answers to all three.

Rosalind Achebe, a development economist, begins by insisting on what the schemes were designed for, because it is often misdescribed. They were not designed to raise incomes in general. They were designed to remove the volatility of commodity prices from the farmer, on the reasoning that a smallholder cannot plan or invest when the price of the crop may halve between seasons. She argues that judged against that aim the record is reasonably good, and that judged against poverty reduction in general it looks much weaker, because it was never the instrument for it.

The minimum price works, in a narrow sense, and it works only sometimes. Tomás Iglesias, who studies commodity markets, points out that the guaranteed floor is irrelevant whenever the market price is above it, which for coffee has been true in several extended periods. In those years certification delivers only the premium, which is a small sum per kilogram. His conclusion is that the scheme is insurance rather than income, valuable precisely when things go badly and invisible the rest of the time, and that people who evaluate it in a good year draw the wrong conclusion.

The premium is not paid to individuals. It goes to the producer organisation, which decides collectively how to spend it, and in practice it has funded schools, clinics, roads, processing equipment and warehouses. Mei-Ling Chow, who has audited such organisations, is direct about the mixed record: the collective decision is genuinely made by the members in many cooperatives and is captured by a small group in others, and the auditing regime is better at verifying that money was spent than at verifying that the membership chose how. She regards governance rather than price as the part of the system most in need of attention.

The most serious criticism concerns who gets in. Certification requires an organised cooperative, record-keeping, and the payment of fees for inspection, which are a barrier to exactly the poorest and least organised farmers. Robert Kagwe, who works with growers' associations, notes that the farms which end up certified tend to be the better-resourced ones within any given region, and that the scheme therefore selects for relative advantage even as it aims at disadvantage. He does not conclude that it should be abandoned; he concludes that it should not be described as reaching the poorest, because it does not.

There is also a structural problem nobody has solved. Certified producers generally sell only part of their crop under the label, because demand for certified coffee is smaller than the certified supply. A cooperative may be certified for its whole harvest and find buyers for a third of it at the guaranteed price, selling the rest at the ordinary market price. The published figures for how much certified coffee exists therefore overstate how much is actually sold as such, and a farmer's realised benefit is a fraction of the headline. The imbalance is not a failure of the scheme's design; it is the consequence of certifying a crop on the basis of how it was grown and then having to find a buyer who will pay for that.

The fair assessment is that these schemes are a modest, verifiable transfer with a genuine stabilising effect for the households they reach, oversold by their advocates and dismissed too readily by their critics. The alternative usually proposed — higher and more stable prices achieved through producer country policy rather than consumer country labels — is probably more powerful and has proved much harder to arrange.`,
      questions: [
        fromList(
          "matching_features",
          LABEL_PEOPLE,
          "The schemes are judged against an aim they never had.",
          "Rosalind Achebe",
          "She argues that judged against that aim the record is reasonably good, and that judged against poverty reduction in general it looks much weaker, because it was never the instrument for it.",
          "Achebe separates the two aims.",
        ),
        fromList(
          "matching_features",
          LABEL_PEOPLE,
          "The guarantee is insurance rather than extra income.",
          "Tomás Iglesias",
          "His conclusion is that the scheme is insurance rather than income, valuable precisely when things go badly and invisible the rest of the time, and that people who evaluate it in a good year draw the wrong conclusion.",
          "Iglesias calls it insurance.",
        ),
        fromList(
          "matching_features",
          LABEL_PEOPLE,
          "Inspection checks spending better than it checks who decided.",
          "Mei-Ling Chow",
          "Mei-Ling Chow, who has audited such organisations, is direct about the mixed record: the collective decision is genuinely made by the members in many cooperatives and is captured by a small group in others, and the auditing regime is better at verifying that money was spent than at verifying that the membership chose how.",
          "Chow contrasts spending with deciding.",
        ),
        fromList(
          "matching_features",
          LABEL_PEOPLE,
          "The scheme tends to select the better-off farms in a region.",
          "Robert Kagwe",
          "Robert Kagwe, who works with growers' associations, notes that the farms which end up certified tend to be the better-resourced ones within any given region, and that the scheme therefore selects for relative advantage even as it aims at disadvantage.",
          "Kagwe describes the selection.",
        ),
        fromList(
          "summary_completion",
          LABEL_BANK,
          "A ______ price is guaranteed whatever the market does.",
          "minimum",
          "The best-known schemes work in a similar way: a minimum price is guaranteed to the producer regardless of what the market does, an additional sum called a premium is paid on top, the producer organisation must be democratically run, and an inspector visits to verify all of it.",
          "A minimum is guaranteed.",
        ),
        fromList(
          "summary_completion",
          LABEL_BANK,
          "An extra sum called a ______ is paid to the producer organisation.",
          "premium",
          "The premium is not paid to individuals.",
          "The premium goes to the organisation.",
        ),
        fromList(
          "summary_completion",
          LABEL_BANK,
          "Certification requires an organised ______ and record-keeping.",
          "cooperative",
          "Certification requires an organised cooperative, record-keeping, and the payment of fees for inspection, which are a barrier to exactly the poorest and least organised farmers.",
          "An organised cooperative is required.",
        ),
        fromList(
          "summary_completion",
          LABEL_BANK,
          "Inspection ______ are themselves a barrier to the poorest.",
          "fees",
          "Robert Kagwe, who works with growers' associations, notes that the farms which end up certified tend to be the better-resourced ones within any given region, and that the scheme therefore selects for relative advantage even as it aims at disadvantage.",
          "The fees are part of the barrier.",
        ),
        fromList(
          "summary_completion",
          LABEL_BANK,
          "There is an ______ of certified crop relative to demand for it.",
          "oversupply",
          "Certified producers generally sell only part of their crop under the label, because demand for certified coffee is smaller than the certified supply.",
          "Supply exceeds demand.",
        ),
        mcq(
          "When is the guaranteed floor of no practical use?",
          [
            "When the market price is above it",
            "When the premium has already been paid",
            "When the cooperative is small",
            "When the crop fails",
          ],
          "When the market price is above it",
          "Tomás Iglesias, who studies commodity markets, points out that the guaranteed floor is irrelevant whenever the market price is above it, which for coffee has been true in several extended periods.",
          "It is irrelevant above the floor.",
        ),
        mcq(
          "What has the premium typically been spent on?",
          [
            "Schools, clinics and processing equipment",
            "Direct payments to individual members",
            "Inspection and certification fees",
            "Purchasing additional land",
          ],
          "Schools, clinics and processing equipment",
          "It goes to the producer organisation, which decides collectively how to spend it, and in practice it has funded schools, clinics, roads, processing equipment and warehouses.",
          "It funded shared facilities.",
        ),
        mcq(
          "What does Kagwe conclude from the selection problem?",
          [
            "The scheme should not be described as reaching the poorest",
            "The scheme should be discontinued",
            "Fees should be raised to fund inspection",
            "Cooperatives should be made larger",
          ],
          "The scheme should not be described as reaching the poorest",
          "He does not conclude that it should be abandoned; he concludes that it should not be described as reaching the poorest, because it does not.",
          "He objects to the description, not the scheme.",
        ),
        mcq(
          "What does the writer say about the usual alternative proposal?",
          [
            "It is probably stronger and harder to organise",
            "It has been tried and failed",
            "It duplicates what labels already do",
            "It would raise consumer prices further",
          ],
          "It is probably stronger and harder to organise",
          "The alternative usually proposed — higher and more stable prices achieved through producer country policy rather than consumer country labels — is probably more powerful and has proved much harder to arrange.",
          "More powerful, harder to arrange.",
        ),
      ],
    },
    {
      key: "t97-p3-coffee-rust",
      title: "The Rust That Follows the Coffee",
      topic: "a fungus that has reorganised an industry three times",
      difficulty: 5,
      body: `A) Coffee leaf rust is a fungus that grows inside the leaves of the coffee plant and produces orange spores on their undersides. It does not touch the berries. The damage is indirect and severe: an infected leaf falls, a plant that loses most of its leaves cannot photosynthesise enough to ripen a crop, and a badly infected tree produces little for several years afterwards even if the infection is controlled. A farmer watching the disease is watching the next harvest and the one after it disappear. The orange dust on the underside of a leaf is, in that sense, a forecast rather than an injury.

B) The fungus was identified in East Africa in the nineteenth century and its most consequential early appearance was in Ceylon, where it destroyed the island's coffee industry in the 1870s and 1880s. The planters responded by replacing coffee with tea, which is why Sri Lanka is a tea country today. That substitution is the largest single agricultural consequence of any plant disease outside the potato blight, and it is usually reported as a commercial decision rather than a pathological one.

C) It reached the Americas late. The continent was free of the disease until 1970, when it appeared in Brazil, probably carried across the Atlantic in the air. Within a decade it was in every coffee-growing country in the hemisphere. The spores are extremely light, produced in enormous numbers, and carried by wind over very long distances, which makes quarantine essentially futile once the fungus is established anywhere in a region. Nothing about the American epidemic could have been prevented by inspection at a port, and the border measures that were in place at the time were not negligent so much as irrelevant.

D) The standard defences are all partial. Fungicides work and cost money, need repeated application in a wet season, and are beyond the reach of a smallholder in a bad year, which is exactly the year they are needed. Pruning and wider spacing reduce humidity in the canopy and therefore infection, at the cost of yield per hectare. Resistant varieties exist and are the most promising line, and they have a recurring weakness: the fungus exists as many genetically distinct races, and a variety bred for resistance to the races present when it was developed generally loses that resistance within ten to twenty years as new races spread. Breeding is therefore a permanent programme rather than a solved problem.

E) The most serious recent development is climatic. The fungus is limited at the upper end by cold, and the best arabica coffee is grown at altitude precisely because the climate there is cool. As mean temperatures have risen, the altitude at which the fungus can establish has risen with them, and plantations that were historically too high to be affected are now within its range. The epidemic that struck Central America from 2012, which cut regional production sharply and pushed a large number of farm labourers out of work, occurred in exactly this way and at altitudes where growers had no experience of the disease and no routine defence against it.

F) Replanting is the durable answer and it is a brutal one financially. A coffee tree takes three to four years from planting to first significant harvest, so a farmer who grubs out a diseased plantation and replants with a resistant variety has no income from that land for several years, and no bank is enthusiastic about lending against it. Many smallholders instead nurse diseased trees, getting a poor crop indefinitely, which is individually rational and keeps a reservoir of the fungus in the landscape.

G) The broad pattern is worth stating because it is not peculiar to coffee. A perennial crop grown as a genetically narrow monoculture over a large area, in a climate that is shifting, faces a pathogen that reproduces in vast numbers and travels on the wind. Every element of that description increases the pathogen's advantage, and most of them are consequences of how the crop is grown rather than facts about the fungus. The disease has reorganised the industry twice already, in Ceylon and in the Americas, and the third reorganisation, driven by altitude, is in progress now.`,
      questions: [
        fromList(
          "matching_information",
          RUST_PARAGRAPHS,
          "a country that changed its principal crop because of the disease",
          "B",
          "The planters responded by replacing coffee with tea, which is why Sri Lanka is a tea country today.",
          "Paragraph B describes the switch to tea.",
        ),
        fromList(
          "matching_information",
          RUST_PARAGRAPHS,
          "why inspection at a port cannot keep the fungus out",
          "C",
          "The spores are extremely light, produced in enormous numbers, and carried by wind over very long distances, which makes quarantine essentially futile once the fungus is established anywhere in a region.",
          "Paragraph C explains why quarantine fails.",
        ),
        fromList(
          "matching_information",
          RUST_PARAGRAPHS,
          "the financial reason farmers keep diseased trees",
          "F",
          "Many smallholders instead nurse diseased trees, getting a poor crop indefinitely, which is individually rational and keeps a reservoir of the fungus in the landscape.",
          "Paragraph F explains nursing the trees.",
        ),
        fromList(
          "matching_information",
          RUST_PARAGRAPHS,
          "an outbreak at altitudes with no history of the disease",
          "E",
          "The epidemic that struck Central America from 2012, which cut regional production sharply and pushed a large number of farm labourers out of work, occurred in exactly this way and at altitudes where growers had no experience of the disease and no routine defence against it.",
          "Paragraph E describes the high-altitude epidemic.",
        ),
        fromList(
          "matching_information",
          RUST_PARAGRAPHS,
          "how the damage reaches a crop it never touches",
          "A",
          "The damage is indirect and severe: an infected leaf falls, a plant that loses most of its leaves cannot photosynthesise enough to ripen a crop, and a badly infected tree produces little for several years afterwards even if the infection is controlled.",
          "Paragraph A traces the indirect damage.",
        ),
        ynng(
          "The writer thinks the Ceylon switch to tea is usually explained correctly.",
          "NO",
          "That substitution is the largest single agricultural consequence of any plant disease outside the potato blight, and it is usually reported as a commercial decision rather than a pathological one.",
          "It is misreported as commercial.",
        ),
        ynng(
          "The writer regards fungicides as a solution available to the poorest farmers.",
          "NO",
          "Fungicides work and cost money, need repeated application in a wet season, and are beyond the reach of a smallholder in a bad year, which is exactly the year they are needed.",
          "They are 'beyond the reach of a smallholder'.",
        ),
        ynng(
          "The writer believes breeding for resistance must be a continuing effort.",
          "YES",
          "Breeding is therefore a permanent programme rather than a solved problem.",
          "It is 'a permanent programme'.",
        ),
        ynng(
          "The writer thinks the fungus's advantages mostly arise from how coffee is cultivated.",
          "YES",
          "Every element of that description increases the pathogen's advantage, and most of them are consequences of how the crop is grown rather than facts about the fungus.",
          "Most follow from how it is grown.",
        ),
        fromList(
          "matching_sentence_endings",
          RUST_ENDINGS,
          "The berries are undamaged and the harvest still fails,",
          "because the disease attacks the leaf and not the fruit that is sold.",
          "It does not touch the berries.",
          "The leaf is attacked, not the fruit.",
        ),
        fromList(
          "matching_sentence_endings",
          RUST_ENDINGS,
          "Keeping the fungus out of a continent proved impossible,",
          "because the spores travel on the wind and cross an ocean in a season.",
          "The continent was free of the disease until 1970, when it appeared in Brazil, probably carried across the Atlantic in the air.",
          "It arrived across the Atlantic in the air.",
        ),
        fromList(
          "matching_sentence_endings",
          RUST_ENDINGS,
          "Breeding has to be repeated indefinitely,",
          "which is why a resistant variety stops being resistant within a decade or two.",
          "Resistant varieties exist and are the most promising line, and they have a recurring weakness: the fungus exists as many genetically distinct races, and a variety bred for resistance to the races present when it was developed generally loses that resistance within ten to twenty years as new races spread.",
          "New races defeat the variety.",
        ),
        fromList(
          "matching_sentence_endings",
          RUST_ENDINGS,
          "High plantations have lost their natural protection,",
          "since the mountain slopes that grow the best coffee are now warm enough for the fungus.",
          "As mean temperatures have risen, the altitude at which the fungus can establish has risen with them, and plantations that were historically too high to be affected are now within its range.",
          "The fungus has moved up the slope.",
        ),
        fromList(
          "matching_sentence_endings",
          RUST_ENDINGS,
          "Clearing and replanting is rarely chosen,",
          "although a farmer who replants waits four years for the first crop.",
          "A coffee tree takes three to four years from planting to first significant harvest, so a farmer who grubs out a diseased plantation and replants with a resistant variety has no income from that land for several years, and no bank is enthusiastic about lending against it.",
          "The wait for a crop is several years.",
        ),
      ],
    },
  ],
};
