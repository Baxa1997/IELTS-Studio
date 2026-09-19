import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · marine archaeology · notes box ----------------------------

const WRECK_NOTES = {
  title: "The cargo, by origin",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · materials biology · people and a word bank ----------------

const ENZYME_PEOPLE = ["Ayaka Mori", "Tomasz Wysocki", "Ingrid Halvorsen", "Femi Adeyemi"];
const ENZYME_BANK = [
  "crystalline",
  "monomers",
  "compost",
  "temperature",
  "sorting",
  "landfill",
  "granules",
  "mixture",
  "cost",
];

// ---- Passage 3 · measurement in social science · lettered paragraphs -------

const HAPPY_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const HAPPY_ENDINGS = [
  "because the scale has no fixed units and no zero anybody can point to.",
  "although the two measures disagree about which countries are doing well.",
  "which is why a single question can still be worth asking every year.",
  "even though nobody can verify that two people mean the same by a seven.",
  "because governments will optimise whatever number they are judged on.",
  "which the writer regards as the strongest argument for using several measures.",
  "despite the survey having been translated into more than forty languages.",
];

export const TEST_63: CuratedTest = {
  key: "full-test-63",
  targetBand: 8,
  passages: [
    {
      key: "t63-p1-bronze-wreck",
      title: "The Ship That Carried Everything",
      topic: "what a single sunken cargo revealed about Bronze Age trade",
      difficulty: 7,
      body: `In 1982 a Turkish sponge diver working off a promontory on the southern coast of Anatolia described to an archaeologist what he had seen on the sea bed: objects he called metal biscuits with ears. The description was recognised immediately. Copper of the Late Bronze Age was cast into slabs with four projecting handles, a shape known from wall paintings and from a handful of surviving examples, and nobody had ever found a ship carrying them. The wreck that followed took eleven years to excavate, in more than twenty-two thousand dives, at a depth that allowed each diver about twenty minutes on the bottom twice a day.

The ship had sunk in the late fourteenth century BCE. Its hull was built of cedar, joined by the mortise-and-tenon method that remained standard in the Mediterranean for another two thousand years, and enough survived beneath the cargo to establish its construction. What made the site extraordinary was not the vessel but what it was carrying.

There were ten tonnes of copper, in about three hundred and fifty of the four-handled slabs, and a tonne of tin, which is close to the ten-to-one ratio required to make bronze. The tin is the more remarkable half: there is almost no tin in the Mediterranean basin, and isotopic work has pointed to sources far to the east, in central Asia. A single ship was therefore carrying the raw material for something like three hundred thousand bronze weapons or tools, assembled from opposite ends of the known world.

The ship also carried the means of doing business. Among the finds were tools for working metal and wood, which suggests that repairs and perhaps small-scale manufacture were carried out on the voyage itself. A quantity of raw material is a cargo; a cargo plus the instruments for valuing it and the tools for working it is closer to a travelling enterprise, and that distinction turns out to matter for how the whole site is read.

The rest of the cargo was equally miscellaneous and equally far-travelled. Canaanite jars held terebinth resin, used as incense, and others held glass beads, olives and orpiment. There were a hundred and seventy-five ingots of raw glass, coloured cobalt blue, turquoise and lavender, which are the earliest intact glass ingots known. There was African ebony, elephant ivory and a dozen hippopotamus teeth, ostrich eggshells, tortoise carapaces, murex opercula used in perfume, Cypriot pottery, Baltic amber, a scarab bearing the name of Nefertiti, and a gold chalice. There was also a wooden writing tablet with ivory hinges, the earliest known, whose recessed leaves would have held wax.

The interpretive problem is that the ship's nationality cannot be established, and archaeologists have argued about it for four decades. The personal possessions aboard point in several directions at once: Mycenaean drinking cups and seals that suggest two Greek passengers of some status, Canaanite weights and oil lamps, Egyptian and Assyrian objects. The weights are the most informative single category, since the sets aboard follow more than one regional standard, which is what a merchant trading between systems would need to carry.

What the wreck settled was a long-running argument about the character of Bronze Age exchange. One view held that long-distance movement of goods was essentially diplomatic — gifts between rulers, recorded in the correspondence found at Amarna, rather than commerce in any recognisable sense. The Uluburun cargo is difficult to read that way. The quantities are industrial, the goods are raw materials rather than finished presentation pieces, and the mixture of weight standards suggests transactions conducted across several currencies of account. Both kinds of exchange evidently existed, and the ship shows that the second was operating at a scale nobody had been able to demonstrate.

It is worth stating what a single wreck cannot show. One ship establishes that a voyage of that kind happened once; it cannot establish how often, or whether this cargo was typical or exceptional. The excavators have been careful on this point and their readers frequently have not. What is certain is that in about 1320 BCE a vessel some fifteen metres long went down carrying material from at least eleven cultures, and that whoever loaded it was operating in a network that ran from the Baltic to central Asia and down into sub-Saharan Africa, three thousand years before anybody drew a map of it.`,
      questions: [
        tfng(
          "The sponge diver recognised the significance of what he had found.",
          "FALSE",
          "In 1982 a Turkish sponge diver working off a promontory on the southern coast of Anatolia described to an archaeologist what he had seen on the sea bed: objects he called metal biscuits with ears.",
          "He described the shape; the archaeologist recognised it.",
        ),
        tfng(
          "Ships carrying four-handled copper slabs had been found before.",
          "FALSE",
          "Copper of the Late Bronze Age was cast into slabs with four projecting handles, a shape known from wall paintings and from a handful of surviving examples, and nobody had ever found a ship carrying them.",
          "'Nobody had ever found a ship carrying them'.",
        ),
        tfng(
          "Divers were limited in how long they could spend on the wreck each day.",
          "TRUE",
          "The wreck that followed took eleven years to excavate, in more than twenty-two thousand dives, at a depth that allowed each diver about twenty minutes on the bottom twice a day.",
          "About twenty minutes, twice a day.",
        ),
        tfng(
          "The proportions of copper and tin were close to those needed for bronze.",
          "TRUE",
          "There were ten tonnes of copper, in about three hundred and fifty of the four-handled slabs, and a tonne of tin, which is close to the ten-to-one ratio required to make bronze.",
          "Ten tonnes to one is the bronze ratio.",
        ),
        tfng(
          "Tin was readily available around the Mediterranean at the time.",
          "FALSE",
          "The tin is the more remarkable half: there is almost no tin in the Mediterranean basin, and isotopic work has pointed to sources far to the east, in central Asia.",
          "There is 'almost no tin in the Mediterranean basin'.",
        ),
        tfng(
          "The nationality of the ship has been determined from the objects aboard.",
          "FALSE",
          "The interpretive problem is that the ship's nationality cannot be established, and archaeologists have argued about it for four decades.",
          "It 'cannot be established'.",
        ),
        tfng(
          "The excavators have overstated what one wreck can prove.",
          "FALSE",
          "The excavators have been careful on this point and their readers frequently have not.",
          "The excavators 'have been careful'.",
        ),
        noteLine(
          WRECK_NOTES,
          null,
          "Raw ______ came in a hundred and seventy-five coloured ingots",
          "glass",
          "There were a hundred and seventy-five ingots of raw glass, coloured cobalt blue, turquoise and lavender, which are the earliest intact glass ingots known.",
          "They were 'ingots of raw glass'.",
        ),
        noteLine(
          WRECK_NOTES,
          null,
          "______ and elephant ivory had come from Africa",
          "ebony",
          "There was African ebony, elephant ivory and a dozen hippopotamus teeth, ostrich eggshells, tortoise carapaces, murex opercula used in perfume, Cypriot pottery, Baltic amber, a scarab bearing the name of Nefertiti, and a gold chalice.",
          "'African ebony, elephant ivory' are listed together.",
          { before: [{ text: "Goods from at least eleven cultures:", indent: 0 }] },
        ),
        noteLine(
          WRECK_NOTES,
          null,
          "______ had travelled from the Baltic",
          "amber",
          "There was African ebony, elephant ivory and a dozen hippopotamus teeth, ostrich eggshells, tortoise carapaces, murex opercula used in perfume, Cypriot pottery, Baltic amber, a scarab bearing the name of Nefertiti, and a gold chalice.",
          "The list includes 'Baltic amber'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The hull was built of ______ and survived beneath the cargo.",
          "cedar",
          "Its hull was built of cedar, joined by the mortise-and-tenon method that remained standard in the Mediterranean for another two thousand years, and enough survived beneath the cargo to establish its construction.",
          "The hull was 'built of cedar'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The earliest known writing tablet aboard had hinges made of ______.",
          "ivory",
          "There was also a wooden writing tablet with ivory hinges, the earliest known, whose recessed leaves would have held wax.",
          "It had 'ivory hinges'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Several regional standards were represented among the ______ found on board.",
          "weights",
          "The weights are the most informative single category, since the sets aboard follow more than one regional standard, which is what a merchant trading between systems would need to carry.",
          "The weights follow more than one standard.",
        ),
      ],
    },
    {
      key: "t63-p2-plastic-enzymes",
      title: "Teaching an Enzyme to Eat a Bottle",
      topic: "the prospects for breaking plastic down into its chemical parts",
      difficulty: 8,
      body: `Most plastic recycling is not recycling in the chemical sense. A bottle collected today is washed, shredded, melted and extruded into new material, and the polymer chains are shortened a little each time, so the product is generally of lower quality than the input. Two or three cycles and the material is only fit for fibre or for fill. The ambition behind enzymatic recycling is different: to break the polymer back into the small molecules it was built from, which can then be repolymerised into material indistinguishable from new, indefinitely.

The chemistry of PET — the plastic of drinks bottles and polyester textiles — is unusually favourable to this. Its chains are held together by ester bonds, which certain enzymes cut routinely in nature. Ayaka Mori, a biochemist, explains that the difficulty was never finding an enzyme that could cut the bond but finding one that could reach it. In the crystalline regions of a PET bottle, where the chains are packed tightly and regularly, the bonds are physically inaccessible to a protein the size of an enzyme, which can only work on the disordered regions at the surface.

Two developments changed what was possible. In 2016 a bacterium was isolated from sediment outside a Japanese bottle recycling plant that could use PET as a carbon source, producing two enzymes to do it. The organism was slow and of little practical use, but it demonstrated that biology had found a route, and the structure of its enzymes gave protein engineers somewhere to start.

The second was engineering rather than discovery. Tomasz Wysocki, who works on enzyme design, describes the approach: take a related enzyme from a thermophilic organism — one adapted to high temperatures — and modify its active site so that it accommodates PET. The temperature matters more than anything else in the process. Above about seventy degrees PET becomes rubbery, the crystalline regions loosen, and the chains become reachable. An enzyme that is stable at that temperature can therefore work on the whole material rather than on its surface. Engineered variants now depolymerise the great majority of a batch of PET within about ten hours.

Ingrid Halvorsen, who has looked at the process economics, is the most cautious of those working on it. The enzyme is recovered and reused, the reaction runs at moderate temperature and pressure compared with chemical depolymerisation, and the output monomers are pure enough to make food-grade material. What is not favourable is the comparison with the alternative: virgin PET is made from oil in enormous, highly optimised plants, and its price is the number any recycled route has to beat. Halvorsen's view is that the technology is sound and that its adoption is a question of the price of oil, the cost of waste disposal, and whatever obligations regulators place on producers — none of which are properties of the enzyme.

There is a problem upstream that the process does not solve. Femi Adeyemi, who works on collection systems in West Africa, points out that enzymatic recycling requires a clean, sorted, single-polymer feedstock, and that the global difficulty has never been what to do with clean sorted PET, which already has a market. It is the mixed, contaminated, multi-layer packaging that nobody can separate: a crisp packet of plastic laminated to aluminium, a pouch of three polymers co-extruded, a bottle with a label and a cap of two other materials. Adeyemi's argument is that a technology which works only on the easy fraction may improve the figures without touching the problem.

Work on the harder polymers is at a much earlier stage. Polyethylene and polypropylene, which together account for about half of all plastic produced, have backbones of carbon-carbon bonds with nothing for an enzyme to grip, and no natural enzyme is known that degrades them at any useful rate. Several groups are working on oxidative routes that would introduce a point of attack, and none has produced anything approaching a process.

The realistic position is therefore narrower than the coverage suggests. One polymer, out of many, can now be returned to its building blocks by a biological process at a rate that is industrially interesting, provided it arrives clean. Two plants operating at demonstration scale have been built. Whether the route becomes ordinary depends on economics and regulation rather than on any remaining question in the science.`,
      questions: [
        fromList(
          "matching_features",
          ENZYME_PEOPLE,
          "The obstacle was reaching the bond rather than cutting it.",
          "Ayaka Mori",
          "Ayaka Mori, a biochemist, explains that the difficulty was never finding an enzyme that could cut the bond but finding one that could reach it.",
          "Mori identifies access as the difficulty.",
        ),
        fromList(
          "matching_features",
          ENZYME_PEOPLE,
          "Heat-tolerant enzymes can work on the whole material, not just its surface.",
          "Tomasz Wysocki",
          "An enzyme that is stable at that temperature can therefore work on the whole material rather than on its surface.",
          "Wysocki explains the thermophilic route.",
        ),
        fromList(
          "matching_features",
          ENZYME_PEOPLE,
          "Adoption depends on factors that have nothing to do with the technology.",
          "Ingrid Halvorsen",
          "Halvorsen's view is that the technology is sound and that its adoption is a question of the price of oil, the cost of waste disposal, and whatever obligations regulators place on producers — none of which are properties of the enzyme.",
          "Halvorsen lists the external factors.",
        ),
        fromList(
          "matching_features",
          ENZYME_PEOPLE,
          "A method that handles only the simplest waste may not help much.",
          "Femi Adeyemi",
          "Adeyemi's argument is that a technology which works only on the easy fraction may improve the figures without touching the problem.",
          "Adeyemi makes the easy-fraction argument.",
        ),
        fromList(
          "summary_completion",
          ENZYME_BANK,
          "Enzymes cannot reach the bonds in the ______ regions of the plastic.",
          "crystalline",
          "In the crystalline regions of a PET bottle, where the chains are packed tightly and regularly, the bonds are physically inaccessible to a protein the size of an enzyme, which can only work on the disordered regions at the surface.",
          "The crystalline regions are inaccessible.",
        ),
        fromList(
          "summary_completion",
          ENZYME_BANK,
          "Raising the ______ loosens those regions and opens the chains up.",
          "temperature",
          "Above about seventy degrees PET becomes rubbery, the crystalline regions loosen, and the chains become reachable.",
          "Above seventy degrees the regions loosen.",
        ),
        fromList(
          "summary_completion",
          ENZYME_BANK,
          "The process yields ______ pure enough for food-grade material.",
          "monomers",
          "The enzyme is recovered and reused, the reaction runs at moderate temperature and pressure compared with chemical depolymerisation, and the output monomers are pure enough to make food-grade material.",
          "The 'output monomers are pure enough'.",
        ),
        fromList(
          "summary_completion",
          ENZYME_BANK,
          "The method needs clean feedstock, so the ______ problem remains.",
          "sorting",
          "Femi Adeyemi, who works on collection systems in West Africa, points out that enzymatic recycling requires a clean, sorted, single-polymer feedstock, and that the global difficulty has never been what to do with clean sorted PET, which already has a market.",
          "It requires 'a clean, sorted, single-polymer feedstock'.",
        ),
        fromList(
          "summary_completion",
          ENZYME_BANK,
          "Packaging made from a ______ of polymers cannot yet be handled.",
          "mixture",
          "It is the mixed, contaminated, multi-layer packaging that nobody can separate: a crisp packet of plastic laminated to aluminium, a pouch of three polymers co-extruded, a bottle with a label and a cap of two other materials.",
          "Mixed multi-layer packaging cannot be separated.",
        ),
        mcq(
          "What happens to plastic in conventional recycling?",
          [
            "The polymer chains get shorter each time",
            "The material is returned to its building blocks",
            "Contaminants are chemically removed",
            "Quality is maintained through many cycles",
          ],
          "The polymer chains get shorter each time",
          "A bottle collected today is washed, shredded, melted and extruded into new material, and the polymer chains are shortened a little each time, so the product is generally of lower quality than the input.",
          "The chains are 'shortened a little each time'.",
        ),
        mcq(
          "What was significant about the bacterium isolated in 2016?",
          [
            "It showed that biology had found a route",
            "It degraded PET faster than any engineered enzyme",
            "It could digest several polymers at once",
            "It worked at very high temperatures",
          ],
          "It showed that biology had found a route",
          "The organism was slow and of little practical use, but it demonstrated that biology had found a route, and the structure of its enzymes gave protein engineers somewhere to start.",
          "It 'demonstrated that biology had found a route'.",
        ),
        mcq(
          "Why are polyethylene and polypropylene so much harder?",
          [
            "Their backbones give an enzyme nothing to grip",
            "They are always contaminated in practice",
            "They melt before an enzyme can act",
            "They are produced in smaller quantities",
          ],
          "Their backbones give an enzyme nothing to grip",
          "Polyethylene and polypropylene, which together account for about half of all plastic produced, have backbones of carbon-carbon bonds with nothing for an enzyme to grip, and no natural enzyme is known that degrades them at any useful rate.",
          "There is 'nothing for an enzyme to grip'.",
        ),
        mcq(
          "How does the passage summarise the current position?",
          [
            "One polymer can be handled, if it arrives clean",
            "The science is unresolved in several respects",
            "Industrial adoption is already widespread",
            "The approach has been abandoned commercially",
          ],
          "One polymer can be handled, if it arrives clean",
          "One polymer, out of many, can now be returned to its building blocks by a biological process at a rate that is industrially interesting, provided it arrives clean.",
          "One polymer, 'provided it arrives clean'.",
        ),
      ],
    },
    {
      key: "t63-p3-measuring-happiness",
      title: "The Number on the Scale of Ten",
      topic: "whether wellbeing can be measured well enough to govern by",
      difficulty: 9,
      body: `A) The standard instrument for measuring national wellbeing is a single question. Respondents are asked to imagine a ladder with steps numbered from zero at the bottom to ten at the top, told that the top represents the best possible life for them and the bottom the worst, and asked which step they are standing on. The answers are averaged by country and published annually, and they are reported, discussed and occasionally acted on as though they were a physical quantity. Several governments now collect the same measure themselves, and a few have written it into the formal objectives of their treasuries, which raises the stakes of every methodological question that follows.

B) The case for taking them seriously is stronger than the obvious objections suggest. The answers are stable for the same person over time, they move in the expected direction after events that would be expected to move them — bereavement, unemployment, chronic pain — and they correlate with things measured quite independently, including how much a person smiles in recorded interactions, how their friends rate their mood, and physiological measures of stress. Something real is being captured.

C) The problems begin with comparison. A seven from one respondent and a seven from another are treated as the same quantity, and there is no way to check whether they are. The scale has no units and no anchor: nobody can say what one step represents, or verify that two people asked the same question have the same conception of a best possible life. Between countries, where the question has been translated and the cultural norms about expressing satisfaction differ, the problem compounds.

D) There is a related difficulty about what the question measures. Asking somebody to evaluate their life as a whole invites reflection and comparison — with their expectations, with their neighbours, with their own earlier life — and produces a different answer from asking how they actually felt yesterday. Countries rank differently on the two measures. Some populations report evaluating their lives highly while reporting a good deal of daily unhappiness, and the reverse also occurs. Neither ranking is wrong; they are answers to different questions, and which one a government should care about is a matter of values rather than of measurement. Reporting a single wellbeing figure conceals a choice about which of these is meant.

E) The policy case for measuring it at all is nonetheless serious, and it rests on a comparison. National income is also a constructed measure resting on arbitrary conventions, also insensitive to distribution, also indifferent to whether the activity it counts is beneficial; and it has been used to steer policy for eighty years. A measure does not have to be perfect to be an improvement on an incumbent that is worse. The argument that wellbeing figures are too crude to govern by is rarely made by people who apply the same standard to the figures already governing.

F) The strongest objection is not technical. Any measure that determines how a government is judged will be optimised, and the ways of raising a reported wellbeing number without improving anyone's life are neither hypothetical nor difficult — adjust when and how the question is asked, adjust who is sampled, invest in the things people report on rather than the things that affect them. This happens to every performance indicator eventually, and the more weight the number carries, the faster it happens.

G) What I take from this is not that wellbeing should be left unmeasured but that it should never be measured by one number. Evaluation and daily experience should be reported separately, because they answer different questions. Distribution should be reported alongside the average, because a country where most people are content and a tenth are wretched should not resemble a country of uniform mild satisfaction. And the measures should sit beside income, health and the other things we already count, rather than replacing them. A single figure invites the treatment a single figure always gets, and the honest defence of this research is that it produces several figures that disagree with each other in informative ways. That is a considerably less quotable position than the one usually attributed to the field, and it is the one the evidence actually supports.`,
      questions: [
        fromList(
          "matching_information",
          HAPPY_PARAGRAPHS,
          "a description of exactly how the standard question is put",
          "A",
          "Respondents are asked to imagine a ladder with steps numbered from zero at the bottom to ten at the top, told that the top represents the best possible life for them and the bottom the worst, and asked which step they are standing on.",
          "Paragraph A describes the ladder question.",
        ),
        fromList(
          "matching_information",
          HAPPY_PARAGRAPHS,
          "independent evidence that the answers capture something real",
          "B",
          "The answers are stable for the same person over time, they move in the expected direction after events that would be expected to move them — bereavement, unemployment, chronic pain — and they correlate with things measured quite independently, including how much a person smiles in recorded interactions, how their friends rate their mood, and physiological measures of stress.",
          "Paragraph B gives the external correlates.",
        ),
        fromList(
          "matching_information",
          HAPPY_PARAGRAPHS,
          "a comparison with a measure that is already used to guide policy",
          "E",
          "National income is also a constructed measure resting on arbitrary conventions, also insensitive to distribution, also indifferent to whether the activity it counts is beneficial; and it has been used to steer policy for eighty years.",
          "Paragraph E compares it with national income.",
        ),
        fromList(
          "matching_information",
          HAPPY_PARAGRAPHS,
          "ways in which a reported figure could be raised without benefit to anyone",
          "F",
          "Any measure that determines how a government is judged will be optimised, and the ways of raising a reported wellbeing number without improving anyone's life are neither hypothetical nor difficult — adjust when and how the question is asked, adjust who is sampled, invest in the things people report on rather than the things that affect them.",
          "Paragraph F lists the gaming routes.",
        ),
        fromList(
          "matching_information",
          HAPPY_PARAGRAPHS,
          "an explanation of why two similar questions produce different rankings",
          "D",
          "Asking somebody to evaluate their life as a whole invites reflection and comparison — with their expectations, with their neighbours, with their own earlier life — and produces a different answer from asking how they actually felt yesterday.",
          "Paragraph D contrasts evaluation with experience.",
        ),
        ynng(
          "The writer thinks the answers to the ladder question are meaningless.",
          "NO",
          "Something real is being captured.",
          "'Something real is being captured.'",
        ),
        ynng(
          "The writer believes national income is a better-founded measure.",
          "NO",
          "National income is also a constructed measure resting on arbitrary conventions, also insensitive to distribution, also indifferent to whether the activity it counts is beneficial; and it has been used to steer policy for eighty years.",
          "It shares the same weaknesses.",
        ),
        ynng(
          "The writer regards the risk of a measure being gamed as the most serious objection.",
          "YES",
          "The strongest objection is not technical.",
          "The strongest objection is the gaming one.",
        ),
        ynng(
          "The writer wants wellbeing measurement abandoned.",
          "NO",
          "What I take from this is not that wellbeing should be left unmeasured but that it should never be measured by one number.",
          "Not abandoned — not reduced to one number.",
        ),
        fromList(
          "matching_sentence_endings",
          HAPPY_ENDINGS,
          "Two respondents' sevens cannot be compared with confidence,",
          "because the scale has no fixed units and no zero anybody can point to.",
          "The scale has no units and no anchor: nobody can say what one step represents, or verify that two people asked the same question have the same conception of a best possible life.",
          "The scale has 'no units and no anchor'.",
        ),
        fromList(
          "matching_sentence_endings",
          HAPPY_ENDINGS,
          "Cross-country comparison is harder still,",
          "despite the survey having been translated into more than forty languages.",
          "Between countries, where the question has been translated and the cultural norms about expressing satisfaction differ, the problem compounds.",
          "Translation and cultural norms compound it.",
        ),
        fromList(
          "matching_sentence_endings",
          HAPPY_ENDINGS,
          "Evaluating a life and describing yesterday are different questions,",
          "although the two measures disagree about which countries are doing well.",
          "Countries rank differently on the two measures.",
          "The two measures rank countries differently.",
        ),
        fromList(
          "matching_sentence_endings",
          HAPPY_ENDINGS,
          "Any headline indicator will eventually be managed rather than met,",
          "because governments will optimise whatever number they are judged on.",
          "This happens to every performance indicator eventually, and the more weight the number carries, the faster it happens.",
          "It happens to every indicator eventually.",
        ),
        fromList(
          "matching_sentence_endings",
          HAPPY_ENDINGS,
          "Several figures that disagree are more informative than one,",
          "which the writer regards as the strongest argument for using several measures.",
          "A single figure invites the treatment a single figure always gets, and the honest defence of this research is that it produces several figures that disagree with each other in informative ways.",
          "Disagreement between figures is the defence.",
        ),
      ],
    },
  ],
};
