import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · fisheries · notes box --------------------------------------

const RESERVE_NOTES = {
  title: "What a full closure produces",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · aquaculture · people and a word bank ----------------------

const FARM_PEOPLE = ["Ingrid Sandvik", "Mateusz Zielinski", "Carla Mendoza", "Jonah Kirui"];
const FARM_BANK = [
  "lice",
  "escapes",
  "feed",
  "fjords",
  "wild",
  "density",
  "seabed",
  "vaccines",
  "closed",
];

// ---- Passage 3 · public health surveillance · lettered paragraphs ----------

const SEWAGE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SEWAGE_ENDINGS = [
  "because everybody contributes to the sample whether or not they seek treatment.",
  "which is why the signal arrives days before the hospital admissions do.",
  "since a catchment with one sampling point cannot say which street is affected.",
  "although the same anonymity disappears once the catchment is small enough.",
  "because rainfall dilutes the sample and industrial discharge distorts it.",
  "even though the method was developed to look for something else entirely.",
  "which makes it the only measurement that does not depend on who gets tested.",
];

export const TEST_103: CuratedTest = {
  key: "full-test-103",
  targetBand: 6,
  passages: [
    {
      key: "t103-p1-marine-reserves",
      title: "The Patch of Sea Left Alone",
      topic: "closing an area to fishing, and the argument about whether it helps the fishery",
      difficulty: 5,
      body: `A marine protected area is a part of the sea in which some activity is restricted. The phrase covers an enormous range, from a zone where trawling is banned in one season to a fully protected reserve in which nothing may be taken at any time, and that range is the source of most of the confusion in the subject. Headline figures for how much of the ocean is protected are dominated by areas with very weak restrictions, and the areas where anything measurable happens are the strictly protected ones, which are a small fraction of the total.

Where protection is complete, the effects are consistent across hundreds of studies. Inside a fully protected reserve, the biomass of fish rises substantially — commonly by a factor of several over a decade or two — the average size of individuals rises, and the number of species present rises. Large predatory fish, which are the first to be removed by fishing and the slowest to recover, show the largest changes. The pattern holds in tropical and temperate waters and on very different kinds of seabed, which is unusual for an ecological result and makes the finding one of the more secure in marine science. What varies is the speed: a fast-growing reef fish recovers in a few years, and a slow-growing deep-water species may take half a century.

The argument is about what happens outside. A reserve removes fishing ground, which is an immediate loss to the fleet, and the case for it as a fisheries measure rests on two mechanisms that return the favour. The first is spillover: adult fish move across the boundary, and catches immediately outside a reserve are often higher than they were before the closure. The second is larval export: a fish's reproductive output rises steeply with its size, so a reserve full of large old individuals produces a disproportionate number of eggs, which drift out and settle over a wide area.

Both mechanisms are real and neither is guaranteed. Spillover has been measured repeatedly and is usually confined to a band a few kilometres wide, so a reserve far from the fishing grounds contributes little. Larval export depends on currents, on where the larvae are competent to settle, and on the species' behaviour, and it is very difficult to demonstrate directly, since it requires showing that a fish caught in one place came from an egg spawned in another. Genetic parentage studies have now done this in a handful of cases, which is what moved the mechanism from a plausible idea to an established one.

Design determines almost everything. A reserve must be large enough to contain the home range of the species it is meant to protect, which means a reserve adequate for a reef fish that moves a hundred metres may be useless for a shark that moves a hundred kilometres. It must be placed on habitat that matters rather than on the ground nobody was fishing anyway, which is where political convenience pushes it. And it must last: recovery takes a decade or more, and a protected area that is reopened after five years has delivered a fraction of its potential.

Enforcement is the unglamorous variable that predicts outcomes better than any other. A reserve whose boundaries are respected produces the results described above. A reserve that exists on a chart and is fished anyway produces nothing at all, and there are many of them — the term of art is a paper park. Satellite vessel tracking has improved this considerably where fleets are industrial and licensed, and has done much less for small-scale fishing, which is where most of the pressure is in many countries. The reserves that work best in such places are usually the ones a local community proposed, drew and polices itself.

The honest conclusion is that a reserve is an excellent tool for conserving what is inside it and a partial tool for managing a fishery. It does not substitute for limiting the total catch, and where it has been presented as an alternative to catch limits rather than a complement to them, it has usually disappointed everybody: conservationists because the fishery outside kept declining, and fishers because they lost the ground and the promised improvement did not arrive.`,
      questions: [
        tfng(
          "The term marine protected area covers very different levels of restriction.",
          "TRUE",
          "The phrase covers an enormous range, from a zone where trawling is banned in one season to a fully protected reserve in which nothing may be taken at any time, and that range is the source of most of the confusion in the subject.",
          "The range runs from seasonal bans to full closure.",
        ),
        tfng(
          "Most of the area counted as protected is strictly protected.",
          "FALSE",
          "Headline figures for how much of the ocean is protected are dominated by areas with very weak restrictions, and the areas where anything measurable happens are the strictly protected ones, which are a small fraction of the total.",
          "Strict protection is 'a small fraction'.",
        ),
        tfng(
          "Large predatory fish recover faster than other species.",
          "FALSE",
          "Large predatory fish, which are the first to be removed by fishing and the slowest to recover, show the largest changes.",
          "They are 'the slowest to recover'.",
        ),
        tfng(
          "Spillover has been measured on many occasions.",
          "TRUE",
          "Spillover has been measured repeatedly and is usually confined to a band a few kilometres wide, so a reserve far from the fishing grounds contributes little.",
          "It 'has been measured repeatedly'.",
        ),
        tfng(
          "Larval export has been demonstrated directly in some cases.",
          "TRUE",
          "Genetic parentage studies have now done this in a handful of cases, which is what moved the mechanism from a plausible idea to an established one.",
          "Parentage studies have shown it.",
        ),
        tfng(
          "A reserve of any size will protect a wide-ranging species.",
          "FALSE",
          "A reserve must be large enough to contain the home range of the species it is meant to protect, which means a reserve adequate for a reef fish that moves a hundred metres may be useless for a shark that moves a hundred kilometres.",
          "It may be 'useless' for a wide-ranging species.",
        ),
        tfng(
          "The Mediterranean has more paper parks than the Pacific.",
          "NOT GIVEN",
          "",
          "The passage describes paper parks but compares no regions.",
        ),
        noteLine(
          RESERVE_NOTES,
          null,
          "The ______ of fish inside rises several times over a decade or two",
          "biomass",
          "Inside a fully protected reserve, the biomass of fish rises substantially — commonly by a factor of several over a decade or two — the average size of individuals rises, and the number of species present rises.",
          "Biomass rises several-fold.",
          { before: [{ text: "Measured effects inside the boundary:", indent: 0 }] },
        ),
        noteLine(
          RESERVE_NOTES,
          null,
          "The average ______ of an individual fish increases",
          "size",
          "Inside a fully protected reserve, the biomass of fish rises substantially — commonly by a factor of several over a decade or two — the average size of individuals rises, and the number of species present rises.",
          "Average size increases.",
        ),
        noteLine(
          RESERVE_NOTES,
          null,
          "The number of ______ present increases",
          "species",
          "Inside a fully protected reserve, the biomass of fish rises substantially — commonly by a factor of several over a decade or two — the average size of individuals rises, and the number of species present rises.",
          "Species number rises.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Adult fish crossing the boundary is called ______.",
          "spillover",
          "The first is spillover: adult fish move across the boundary, and catches immediately outside a reserve are often higher than they were before the closure.",
          "That movement is spillover.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A reserve that is fished in spite of its status is called a ______.",
          "paper park",
          "A reserve that exists on a chart and is fished anyway produces nothing at all, and there are many of them — the term of art is a paper park.",
          "The term is a paper park.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A reserve is no substitute for limiting the total ______.",
          "catch",
          "It does not substitute for limiting the total catch, and where it has been presented as an alternative to catch limits rather than a complement to them, it has usually disappointed everybody: conservationists because the fishery outside kept declining, and fishers because they lost the ground and the promised improvement did not arrive.",
          "It does not replace catch limits.",
        ),
      ],
    },
    {
      key: "t103-p2-salmon-farming",
      title: "Farming Fish in the Fjords",
      topic: "the fastest-growing food production system in the world, and its unresolved problems",
      difficulty: 6,
      body: `More than half the fish eaten by people is now farmed rather than caught. The growth has been extraordinarily rapid — from a few per cent of supply in 1970 to the majority today — and it is the reason global fish consumption has risen while wild catches have been flat for thirty years. Salmon is the best-studied case, because it is farmed intensively in a small number of countries, in open net pens suspended in coastal water, at a scale that makes every problem measurable.

Ingrid Sandvik, who works on aquaculture policy, begins with the efficiency, because it is the reason the industry exists. A farmed salmon converts feed to flesh at a ratio close to one to one, against roughly two for a chicken, four for a pig and considerably more for beef, because a fish is cold-blooded and weightless in water and spends nothing on maintaining a temperature or holding itself up. She regards this as the strongest argument in the sector's favour and notes that it is almost never the argument the sector makes, which prefers to talk about health and provenance.

The feed is where the environmental accounting begins. Mateusz Zielinski, who has analysed supply chains, points out that salmon are carnivorous and were originally fed on fishmeal and fish oil made from wild-caught small pelagic fish, so an industry presented as an alternative to fishing was consuming wild fish to produce farmed ones. The ratio has improved greatly — plant proteins and oils now make up most of the diet — and he is careful about what that improvement means, since replacing fish oil with vegetable oil reduces the omega-3 content of the product, which was the nutritional claim the market was built on, and the shortfall is now partly made up with algal oils that are expensive.

The problem that has proved hardest is a parasite. Carla Mendoza, a fish health specialist, explains that sea lice occur naturally on wild salmon at low densities and multiply enormously in a pen holding a hundred thousand fish, and that the resulting cloud of larvae drifts onto wild smolts migrating past the farm. She is direct that this is the industry's most serious ecological charge and the best evidenced, that chemical treatments have selected for resistance within a decade of each new compound, and that the mechanical and biological alternatives now used — warm water baths, freshwater baths, cleaner fish kept in the pens to eat the lice — all work partially and raise welfare questions of their own.

Escapes are the other transfer across the net. Jonah Kirui, who studies population genetics, notes that farmed salmon have been selected for rapid growth over many generations and are genetically distinct from any wild population, and that escapees which breed with wild fish produce offspring with lower survival in a river. He emphasises that the damage is cumulative and hard to reverse: a single large escape may be absorbed, and repeated introgression over decades changes the genetic character of a river's population permanently. Norway's monitoring programme has found farmed genetic material in a substantial proportion of the rivers it surveys.

The proposed technical answer to several of these problems at once is containment. A closed system — a tank on land, or an impermeable bag in the sea — prevents escapes, stops lice larvae entering or leaving, and allows waste to be collected instead of settling on the seabed beneath the pens. It also costs far more to build and requires energy to pump and oxygenate water that an open pen gets free from the current. Several land-based farms are operating and the economics remain unproven at the scale the industry would need.

The general position is that aquaculture is not going to stop growing, because the wild catch cannot rise and the demand is. The question is not whether to farm fish but which problems are inherent to the method and which are consequences of the particular way one high-value carnivorous species is farmed in a few countries. Most of the difficulties described here belong to the second category, and the parts of the industry that farm herbivorous fish and shellfish have very few of them.`,
      questions: [
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "The industry's best argument is one it rarely uses.",
          "Ingrid Sandvik",
          "She regards this as the strongest argument in the sector's favour and notes that it is almost never the argument the sector makes, which prefers to talk about health and provenance.",
          "Sandvik contrasts the two arguments.",
        ),
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "An improvement in one measure worsened another.",
          "Mateusz Zielinski",
          "The ratio has improved greatly — plant proteins and oils now make up most of the diet — and he is careful about what that improvement means, since replacing fish oil with vegetable oil reduces the omega-3 content of the product, which was the nutritional claim the market was built on, and the shortfall is now partly made up with algal oils that are expensive.",
          "Zielinski names the trade-off.",
        ),
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "Successive chemical treatments have each been defeated by resistance.",
          "Carla Mendoza",
          "She is direct that this is the industry's most serious ecological charge and the best evidenced, that chemical treatments have selected for resistance within a decade of each new compound, and that the mechanical and biological alternatives now used — warm water baths, freshwater baths, cleaner fish kept in the pens to eat the lice — all work partially and raise welfare questions of their own.",
          "Mendoza describes the resistance cycle.",
        ),
        fromList(
          "matching_features",
          FARM_PEOPLE,
          "The harm accumulates over decades and cannot be undone.",
          "Jonah Kirui",
          "He emphasises that the damage is cumulative and hard to reverse: a single large escape may be absorbed, and repeated introgression over decades changes the genetic character of a river's population permanently.",
          "Kirui stresses the cumulative damage.",
        ),
        fromList(
          "summary_completion",
          FARM_BANK,
          "Salmon are reared in open net pens in coastal ______.",
          "fjords",
          "Salmon is the best-studied case, because it is farmed intensively in a small number of countries, in open net pens suspended in coastal water, at a scale that makes every problem measurable.",
          "They are farmed in coastal water.",
        ),
        fromList(
          "summary_completion",
          FARM_BANK,
          "The ______ was originally made from wild-caught small fish.",
          "feed",
          "Mateusz Zielinski, who has analysed supply chains, points out that salmon are carnivorous and were originally fed on fishmeal and fish oil made from wild-caught small pelagic fish, so an industry presented as an alternative to fishing was consuming wild fish to produce farmed ones.",
          "The feed came from wild fish.",
        ),
        fromList(
          "summary_completion",
          FARM_BANK,
          "Sea ______ multiply in a pen and drift onto passing wild fish.",
          "lice",
          "Carla Mendoza, a fish health specialist, explains that sea lice occur naturally on wild salmon at low densities and multiply enormously in a pen holding a hundred thousand fish, and that the resulting cloud of larvae drifts onto wild smolts migrating past the farm.",
          "Sea lice multiply and drift.",
        ),
        fromList(
          "summary_completion",
          FARM_BANK,
          "______ interbreed with river populations and weaken them.",
          "escapes",
          "Escapes are the other transfer across the net.",
          "Escapes are the other transfer.",
        ),
        fromList(
          "summary_completion",
          FARM_BANK,
          "A ______ system would prevent both transfers at a much higher cost.",
          "closed",
          "A closed system — a tank on land, or an impermeable bag in the sea — prevents escapes, stops lice larvae entering or leaving, and allows waste to be collected instead of settling on the seabed beneath the pens.",
          "A closed system prevents both.",
        ),
        mcq(
          "Why is a fish an efficient converter of feed?",
          [
            "It is cold-blooded and supported by water",
            "It eats continuously throughout the day",
            "It is harvested at a younger age",
            "It requires no protein in its diet",
          ],
          "It is cold-blooded and supported by water",
          "A farmed salmon converts feed to flesh at a ratio close to one to one, against roughly two for a chicken, four for a pig and considerably more for beef, because a fish is cold-blooded and weightless in water and spends nothing on maintaining a temperature or holding itself up.",
          "It spends nothing on heat or support.",
        ),
        mcq(
          "What has Norway's monitoring programme found?",
          [
            "Farmed genetic material in many rivers surveyed",
            "A decline in sea lice on wild fish",
            "No evidence of interbreeding",
            "Higher survival among hybrid offspring",
          ],
          "Farmed genetic material in many rivers surveyed",
          "Norway's monitoring programme has found farmed genetic material in a substantial proportion of the rivers it surveys.",
          "Farmed genes appear in many rivers.",
        ),
        mcq(
          "What is the drawback of a closed system?",
          [
            "It costs more and needs energy for water movement",
            "It cannot prevent escapes",
            "It requires more feed per fish",
            "It concentrates lice inside the tank",
          ],
          "It costs more and needs energy for water movement",
          "It also costs far more to build and requires energy to pump and oxygenate water that an open pen gets free from the current.",
          "Cost and pumping energy.",
        ),
        mcq(
          "What does the writer conclude about the problems described?",
          [
            "Most belong to how one species is farmed",
            "All are inherent to farming fish",
            "They apply equally to shellfish farming",
            "They will end when wild catches recover",
          ],
          "Most belong to how one species is farmed",
          "Most of the difficulties described here belong to the second category, and the parts of the industry that farm herbivorous fish and shellfish have very few of them.",
          "They belong to the second category.",
        ),
      ],
    },
    {
      key: "t103-p3-wastewater-surveillance",
      title: "What the Sewers Reveal",
      topic: "a measurement of a whole population that nobody has to volunteer for",
      difficulty: 7,
      body: `A) Everything a population excretes arrives at a treatment works, mixed together, a few hours after it leaves the body. A sample taken at the inlet is therefore a composite specimen from everybody connected to that sewer, and if the thing being looked for survives the journey it can be measured. The technique now called wastewater-based epidemiology exploits exactly this, and its defining property is that participation is not voluntary and not selective: the sample includes the people who never see a doctor, never take a test, and would not answer a survey.

B) The method was developed for drugs. Researchers in the early 2000s measured metabolites of cocaine in an Italian river and estimated consumption in the catchment, and the approach was extended to amphetamines, opioids and alcohol. It produced numbers that disagreed with self-report surveys in an informative direction, and it has since been used by European agencies to compare cities and to track the arrival of new compounds. The essential requirement is a stable relationship between what a person takes and what appears in the sewer, which is established in a laboratory and is the weak link in every estimate.

C) The pandemic moved the technique from a research curiosity to routine infrastructure. The virus is shed in faeces, including by people with no symptoms, and its genetic material is detectable in raw sewage at very low concentrations, well below the level at which any individual case could be identified. Programmes were established in dozens of countries within months, and the finding that mattered operationally was the timing: the signal in wastewater rose several days before cases were reported and before hospital admissions rose, because it does not wait for anybody to feel ill, decide to test, or obtain a result.

D) The independence from testing behaviour is the property that has kept the programmes running. Case counts are a measure of infection multiplied by how many people sought a test, and the second term changes constantly with policy, cost, holidays and public attention. When free testing was withdrawn in many countries, case data became uninterpretable and wastewater data did not change at all, because the sewer does not know whether testing is free. For comparing one week with the next, this is worth a great deal.

E) The limitations are equally clear. A measurement gives a catchment, not a street: a works serving four hundred thousand people produces one number, and sampling further up the network improves resolution at the cost of many more samples. Rainfall dilutes the flow, industrial discharge interferes with the chemistry, and the relationship between the concentration measured and the number of people infected is uncertain enough that the absolute number is not reliable even where the trend is. Almost every programme reports direction rather than magnitude, and is right to.

F) The uses have expanded well beyond the original two. Antimicrobial resistance genes can be tracked in sewage, which gives a picture of resistance in a community rather than in the hospital samples that dominate the literature. Polio surveillance has used sewage for decades and detected virus circulating in cities with no reported cases. Programmes now monitor influenza, measles, and a widening list of pathogens from the same samples, which is cheap once the sample is being collected anyway: the expensive parts are the visit, the transport and the extraction, and a single extract can be tested for a dozen things.

G) The ethical question arrives as the resolution improves. A measurement at a treatment works is genuinely anonymous, since no individual is identifiable in a sample from four hundred thousand people. A measurement from the sewer of a single building is not: a university hall of residence, a prison, or a workplace produces a number attributable to a small and identifiable group, and several institutions have done exactly this. The technique's defenders point out that the same is true of any aggregate measure, and that the answer is a rule about the minimum population a sample may represent, enforced by whoever licenses the laboratory rather than left to the institution paying for the test. That rule does not exist in most jurisdictions, and the equipment is cheap and getting cheaper.`,
      questions: [
        fromList(
          "matching_information",
          SEWAGE_PARAGRAPHS,
          "an application that predates the recent expansion by decades",
          "F",
          "Polio surveillance has used sewage for decades and detected virus circulating in cities with no reported cases.",
          "Paragraph F cites polio surveillance.",
        ),
        fromList(
          "matching_information",
          SEWAGE_PARAGRAPHS,
          "why case counts became uninterpretable and this measure did not",
          "D",
          "When free testing was withdrawn in many countries, case data became uninterpretable and wastewater data did not change at all, because the sewer does not know whether testing is free.",
          "Paragraph D explains the divergence.",
        ),
        fromList(
          "matching_information",
          SEWAGE_PARAGRAPHS,
          "the assumption on which every consumption estimate depends",
          "B",
          "The essential requirement is a stable relationship between what a person takes and what appears in the sewer, which is established in a laboratory and is the weak link in every estimate.",
          "Paragraph B names the weak link.",
        ),
        fromList(
          "matching_information",
          SEWAGE_PARAGRAPHS,
          "a reason absolute numbers are not reported",
          "E",
          "Rainfall dilutes the flow, industrial discharge interferes with the chemistry, and the relationship between the concentration measured and the number of people infected is uncertain enough that the absolute number is not reliable even where the trend is.",
          "Paragraph E explains why only trends are given.",
        ),
        fromList(
          "matching_information",
          SEWAGE_PARAGRAPHS,
          "the feature that distinguishes this from every voluntary measure",
          "A",
          "The technique now called wastewater-based epidemiology exploits exactly this, and its defining property is that participation is not voluntary and not selective: the sample includes the people who never see a doctor, never take a test, and would not answer a survey.",
          "Paragraph A names involuntary participation.",
        ),
        ynng(
          "The writer thinks programmes are right to publish direction rather than exact figures.",
          "YES",
          "Almost every programme reports direction rather than magnitude, and is right to.",
          "The writer says they are right to.",
        ),
        ynng(
          "The writer regards a measurement at a large treatment works as a privacy risk.",
          "NO",
          "A measurement at a treatment works is genuinely anonymous, since no individual is identifiable in a sample from four hundred thousand people.",
          "It is 'genuinely anonymous'.",
        ),
        ynng(
          "The writer believes the necessary safeguards are already in place.",
          "NO",
          "That rule does not exist in most jurisdictions, and the equipment is cheap and getting cheaper.",
          "The rule 'does not exist in most jurisdictions'.",
        ),
        ynng(
          "The writer accepts that self-reported drug surveys were less accurate than the sewer.",
          "YES",
          "It produced numbers that disagreed with self-report surveys in an informative direction, and it has since been used by European agencies to compare cities and to track the arrival of new compounds.",
          "The disagreement was 'informative'.",
        ),
        fromList(
          "matching_sentence_endings",
          SEWAGE_ENDINGS,
          "The sample is not a self-selected group,",
          "because everybody contributes to the sample whether or not they seek treatment.",
          "The technique now called wastewater-based epidemiology exploits exactly this, and its defining property is that participation is not voluntary and not selective: the sample includes the people who never see a doctor, never take a test, and would not answer a survey.",
          "Participation is not voluntary.",
        ),
        fromList(
          "matching_sentence_endings",
          SEWAGE_ENDINGS,
          "An outbreak is visible before the wards fill,",
          "which is why the signal arrives days before the hospital admissions do.",
          "Programmes were established in dozens of countries within months, and the finding that mattered operationally was the timing: the signal in wastewater rose several days before cases were reported and before hospital admissions rose, because it does not wait for anybody to feel ill, decide to test, or obtain a result.",
          "The signal precedes the admissions.",
        ),
        fromList(
          "matching_sentence_endings",
          SEWAGE_ENDINGS,
          "The measure survived the end of free testing,",
          "which makes it the only measurement that does not depend on who gets tested.",
          "Case counts are a measure of infection multiplied by how many people sought a test, and the second term changes constantly with policy, cost, holidays and public attention.",
          "It is independent of testing behaviour.",
        ),
        fromList(
          "matching_sentence_endings",
          SEWAGE_ENDINGS,
          "The result cannot be localised within a city,",
          "since a catchment with one sampling point cannot say which street is affected.",
          "A measurement gives a catchment, not a street: a works serving four hundred thousand people produces one number, and sampling further up the network improves resolution at the cost of many more samples.",
          "One point gives one number for the catchment.",
        ),
        fromList(
          "matching_sentence_endings",
          SEWAGE_ENDINGS,
          "Sampling a single building raises a question the works does not,",
          "although the same anonymity disappears once the catchment is small enough.",
          "A measurement from the sewer of a single building is not: a university hall of residence, a prison, or a workplace produces a number attributable to a small and identifiable group, and several institutions have done exactly this.",
          "A small catchment identifies a group.",
        ),
      ],
    },
  ],
};
