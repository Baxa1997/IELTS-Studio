import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · decipherment · flow chart ---------------------------------

const GRID_FLOW = {
  title: "How the grid was built",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · orbital engineering · people and a word bank --------------

const DEBRIS_PEOPLE = ["Yelena Markova", "Tobias Reinhardt", "Priya Chandran", "Owen Kealoha"];
const DEBRIS_BANK = [
  "collisions",
  "fragments",
  "drag",
  "cascade",
  "insurance",
  "tracking",
  "fuel",
  "altitude",
  "launches",
];

// ---- Passage 3 · biology of classification · lettered paragraphs -----------

const SPECIES_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SPECIES_ENDINGS = [
  "because the organisms in question do not reproduce sexually at all.",
  "although the two populations continue to exchange genes where they meet.",
  "since more than two dozen published concepts are in active use.",
  "even though no biologist doubts that the animals are different.",
  "because conservation law attaches money and protection to the category.",
  "because everything else in biology is built on top of it.",
  "despite having been proposed by the same researcher who rejected it later.",
];

export const TEST_57: CuratedTest = {
  key: "full-test-57",
  targetBand: 8,
  passages: [
    {
      key: "t57-p1-linear-b",
      title: "The Clerk's Handwriting",
      topic: "how an unknown script was read without a bilingual inscription",
      difficulty: 7,
      body: `When Arthur Evans excavated the palace at Knossos in Crete from 1900, he found thousands of clay tablets inscribed in two related scripts he named Linear A and Linear B. They had survived by accident: unbaked clay dissolves in rain, but the tablets had been fired hard when the buildings burned down. Evans published a portion of them, kept the rest to himself, and spent forty years failing to read them. He died in 1941 with the script undeciphered and with one conviction firmly attached to it, which was that the language could not possibly be Greek.

A decipherment without a bilingual text has to begin with internal evidence, and the internal evidence in Linear B was unusually rich. Alice Kober, an American classicist working through the 1940s on index cards cut from old envelopes, established the crucial structural fact. Certain words appeared in sets of three, identical except for their last one or two signs, in the way that an inflected language varies the ending of a noun according to its grammatical role. That told her, without any knowledge of the language, that the script recorded an inflected tongue, and more importantly it told her which signs shared a consonant and which shared a vowel. If one form of a word ends in sign X and another in sign Y, and the same alternation occurs across many words, then X and Y are likely to carry the same consonant with different vowels.

Kober built these relationships into a grid: a table whose rows were consonants and whose columns were vowels, with signs placed in the cells where the evidence put them, and none of the rows or columns labelled with an actual sound. She had no way of knowing which consonant any row represented. She died of cancer in 1950, aged forty-three, with the grid built and unlabelled.

Michael Ventris, an English architect who had been obsessed with the script since hearing Evans lecture as a schoolboy, extended the grid and then made the guess that broke it open. Certain words appeared only on tablets from particular sites, in the position a place name would occupy. Ventris supposed that three of them might be Cretan town names known from later Greek sources — Knossos, Amnisos, Tylissos — and slotted the sound values that assumption implied into his grid. The values propagated. Each placement determined others through the grid's structure, and the words that emerged as the grid filled were Greek: words for boy, girl, shepherd, total, and the names of gods still worshipped a thousand years later.

Ventris had been as confident as Evans that the language was not Greek, and his broadcast announcing the result in 1952 is notable for how reluctantly he concedes the point. The philologist John Chadwick joined him, supplying the knowledge of archaic Greek that Ventris lacked, and their joint publication in 1953 is generally accepted as the moment the script was read. Independent confirmation arrived almost immediately: a tablet excavated in Greece, unavailable to Ventris when he worked, listed vessels beside pictures of them, and the words he predicted for tripod and four-handled jar were exactly what the pictures showed.

What the tablets say is, by the standards of ancient discoveries, crushingly dull. They are inventories: sheep counted by district, wheels recorded as serviceable or broken, allocations of grain and oil, lists of women and children by workshop. There is no literature, no history and no correspondence, because the tablets were never meant to survive a year, let alone three thousand. They were administrative notes kept for the current accounting period, and the fire that destroyed the palaces is the only reason any of them exist.

Their value lies precisely in that dullness. The tablets show a palace economy of extraordinary reach, tracking individual animals and rationing by the day, and they push the documented history of the Greek language back some five hundred years. Linear A, the older script, remains unread, for the reason that ought to have defeated Linear B as well: it records a language nobody has identified, and the grid method can establish the structure of a script but it cannot supply a language to test against. Ventris had a candidate language to try; whoever eventually reads Linear A will have to find one first.`,
      questions: [
        tfng(
          "The tablets survived because they were deliberately baked.",
          "FALSE",
          "They had survived by accident: unbaked clay dissolves in rain, but the tablets had been fired hard when the buildings burned down.",
          "They were fired 'by accident' in the fires.",
        ),
        tfng(
          "Evans shared all of the tablets he found with other scholars.",
          "FALSE",
          "Evans published a portion of them, kept the rest to himself, and spent forty years failing to read them.",
          "He 'kept the rest to himself'.",
        ),
        tfng(
          "Kober's discovery depended on knowing what language the script recorded.",
          "FALSE",
          "That told her, without any knowledge of the language, that the script recorded an inflected tongue, and more importantly it told her which signs shared a consonant and which shared a vowel.",
          "She worked 'without any knowledge of the language'.",
        ),
        tfng(
          "Kober was able to assign sounds to the rows of her grid.",
          "FALSE",
          "She had no way of knowing which consonant any row represented.",
          "She 'had no way of knowing'.",
        ),
        tfng(
          "Ventris expected the language to turn out to be Greek.",
          "FALSE",
          "Ventris had been as confident as Evans that the language was not Greek, and his broadcast announcing the result in 1952 is notable for how reluctantly he concedes the point.",
          "He was 'as confident as Evans that the language was not Greek'.",
        ),
        tfng(
          "A tablet found in Greece supported Ventris's readings.",
          "TRUE",
          "Independent confirmation arrived almost immediately: a tablet excavated in Greece, unavailable to Ventris when he worked, listed vessels beside pictures of them, and the words he predicted for tripod and four-handled jar were exactly what the pictures showed.",
          "The pictured vessels matched his predicted words.",
        ),
        tfng(
          "The tablets contain historical narratives alongside the accounts.",
          "FALSE",
          "There is no literature, no history and no correspondence, because the tablets were never meant to survive a year, let alone three thousand.",
          "There is 'no literature, no history and no correspondence'.",
        ),
        noteLine(
          GRID_FLOW,
          null,
          "Words appearing in sets of three revealed that the language was ______",
          "inflected",
          "That told her, without any knowledge of the language, that the script recorded an inflected tongue, and more importantly it told her which signs shared a consonant and which shared a vowel.",
          "The sets showed 'an inflected tongue'.",
        ),
        noteLine(
          GRID_FLOW,
          null,
          "Signs were arranged in a table of consonants and ______",
          "vowels",
          "Kober built these relationships into a grid: a table whose rows were consonants and whose columns were vowels, with signs placed in the cells where the evidence put them, and none of the rows or columns labelled with an actual sound.",
          "Rows were consonants, columns 'vowels'.",
          { before: [{ text: "Structure first, sounds afterwards:", indent: 0 }] },
        ),
        noteLine(
          GRID_FLOW,
          null,
          "Guessing three ______ names supplied the first sound values",
          "place",
          "Certain words appeared only on tablets from particular sites, in the position a place name would occupy.",
          "The guess was that they were place names.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Kober did her analysis on ______ cut from old envelopes.",
          "index cards",
          "Alice Kober, an American classicist working through the 1940s on index cards cut from old envelopes, established the crucial structural fact.",
          "She worked 'on index cards cut from old envelopes'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Ventris worked with the philologist John ______, who supplied knowledge of archaic Greek.",
          "Chadwick",
          "The philologist John Chadwick joined him, supplying the knowledge of archaic Greek that Ventris lacked, and their joint publication in 1953 is generally accepted as the moment the script was read.",
          "John Chadwick supplied the Greek expertise.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The tablets push back the record of the Greek language by about ______ years.",
          "five hundred",
          "The tablets show a palace economy of extraordinary reach, tracking individual animals and rationing by the day, and they push the documented history of the Greek language back some five hundred years.",
          "They push it back 'some five hundred years'.",
        ),
      ],
    },
    {
      key: "t57-p2-space-debris",
      title: "The Crowded Shell",
      topic: "the accumulating wreckage in low orbit and what can be done about it",
      difficulty: 8,
      body: `There are, at the time of writing, somewhere over thirty thousand objects larger than ten centimetres being tracked in orbit around the Earth, of which fewer than a tenth are working satellites. The rest are spent upper stages, dead spacecraft, discarded hardware and fragments. Below the tracking threshold the estimates rise steeply: something over a million objects between one and ten centimetres, and hundreds of millions smaller than that. At orbital velocity, a one-centimetre fragment carries roughly the kinetic energy of a small car at motorway speed.

Two events produced a large share of the current population. In 2007 a country tested an anti-satellite weapon on one of its own defunct weather satellites, creating more than three thousand trackable fragments in an orbit high enough that many will remain there for a century. In 2009 a working communications satellite and a derelict Russian craft collided at nearly twelve kilometres per second, producing a comparable cloud. Yelena Markova, an orbital dynamicist, points out what those two events demonstrated together: the debris population is not a smooth function of how much is launched, because a single collision can add more objects in a second than a decade of ordinary operations.

The mechanism that worries the field is the cascade first described by Donald Kessler in 1978. Above a certain density of objects, collisions generate fragments faster than the environment removes them, each collision raising the probability of the next, so that the population continues growing even if every launch stopped. Tobias Reinhardt, who models these populations, is careful about what the models actually say. The cascade is not a sudden event and there is no single threshold that gets crossed on a particular Tuesday; it is a slow change in the sign of a trend, and the best current models suggest parts of low orbit are already past it, in the sense that the fragment population there would grow slowly over centuries even with no further launches.

Removal is possible but awkward. Below about six hundred kilometres the upper atmosphere provides enough drag to pull objects down within a few years, and this region substantially cleans itself. Between six hundred and one thousand kilometres — which is where most of the debris and most of the new satellite constellations are — the same process takes decades to centuries. Above that it is effectively permanent. Priya Chandran, an engineer who has worked on capture mechanisms, describes the problem of retrieving a dead satellite as harder than docking with a cooperative one by a wide margin: the target is tumbling, often at a rate that would tear off a robotic arm, it has no docking fixtures, its surfaces may be degraded, and its remaining fuel makes it a hazard to approach. Demonstration missions have captured cooperative targets successfully; capturing an uncooperative one remains unproven.

The stronger lever is prevention, and here the record is better than the rhetoric suggests. Upper stages are now routinely vented of residual propellant, which removes the most common cause of spontaneous explosions. Compliance with the twenty-five-year disposal guideline — the commitment to deorbit a satellite within that period after its mission ends — has risen from very low levels to a substantial majority of new missions, and several regulators have now shortened the period to five years.

Owen Kealoha, who has studied the governance rather than the engineering, argues that the underlying problem is one of incentives rather than technology. Orbit is a common resource with no owner. An operator that leaves a dead satellite in a useful orbit imposes a cost on everybody who uses that shell afterwards and pays none of it, and no mechanism exists to charge for that cost or to reward the operator who avoids it. His preferred solution, an orbital-use fee scaled to the collision risk an object represents, has been modelled but not adopted anywhere, and would require an international agreement of a kind that has not been reached on any comparable question.

The practical situation is therefore stable and unsatisfactory. Operators conduct hundreds of collision-avoidance manoeuvres a year on the basis of tracking data with error bars that are often wider than the distances involved. The number of satellites launched annually has increased roughly tenfold in a decade. Nothing has broken, and the trend lines are not encouraging.`,
      questions: [
        fromList(
          "matching_features",
          DEBRIS_PEOPLE,
          "A single event can add more objects than years of normal activity.",
          "Yelena Markova",
          "Yelena Markova, an orbital dynamicist, points out what those two events demonstrated together: the debris population is not a smooth function of how much is launched, because a single collision can add more objects in a second than a decade of ordinary operations.",
          "Markova makes the point about single events.",
        ),
        fromList(
          "matching_features",
          DEBRIS_PEOPLE,
          "The runaway process is gradual rather than a moment that can be dated.",
          "Tobias Reinhardt",
          "The cascade is not a sudden event and there is no single threshold that gets crossed on a particular Tuesday; it is a slow change in the sign of a trend, and the best current models suggest parts of low orbit are already past it, in the sense that the fragment population there would grow slowly over centuries even with no further launches.",
          "Reinhardt describes it as a slow change of sign.",
        ),
        fromList(
          "matching_features",
          DEBRIS_PEOPLE,
          "Capturing a dead satellite is far harder than docking with a live one.",
          "Priya Chandran",
          "Priya Chandran, an engineer who has worked on capture mechanisms, describes the problem of retrieving a dead satellite as harder than docking with a cooperative one by a wide margin: the target is tumbling, often at a rate that would tear off a robotic arm, it has no docking fixtures, its surfaces may be degraded, and its remaining fuel makes it a hazard to approach.",
          "Chandran sets out the capture difficulties.",
        ),
        fromList(
          "matching_features",
          DEBRIS_PEOPLE,
          "The core difficulty is that nobody pays for the cost they create.",
          "Owen Kealoha",
          "An operator that leaves a dead satellite in a useful orbit imposes a cost on everybody who uses that shell afterwards and pays none of it, and no mechanism exists to charge for that cost or to reward the operator who avoids it.",
          "Kealoha frames it as an incentive problem.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Most tracked objects are dead hardware and ______ rather than working craft.",
          "fragments",
          "The rest are spent upper stages, dead spacecraft, discarded hardware and fragments.",
          "The rest are hardware and fragments.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Two ______ in 2007 and 2009 generated a large share of the present population.",
          "collisions",
          "In 2009 a working communications satellite and a derelict Russian craft collided at nearly twelve kilometres per second, producing a comparable cloud.",
          "The 2009 event was a collision; the 2007 test produced a similar cloud.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Kessler described a ______ in which each impact makes the next more likely.",
          "cascade",
          "The mechanism that worries the field is the cascade first described by Donald Kessler in 1978.",
          "It is 'the cascade first described by Donald Kessler'.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Below six hundred kilometres, atmospheric ______ clears objects within a few years.",
          "drag",
          "Below about six hundred kilometres the upper atmosphere provides enough drag to pull objects down within a few years, and this region substantially cleans itself.",
          "The atmosphere 'provides enough drag'.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Manoeuvres are planned from ______ data whose errors exceed the distances involved.",
          "tracking",
          "Operators conduct hundreds of collision-avoidance manoeuvres a year on the basis of tracking data with error bars that are often wider than the distances involved.",
          "The data is 'tracking data with error bars'.",
        ),
        mcq(
          "How much energy does a one-centimetre fragment carry?",
          [
            "Comparable to a car travelling at motorway speed",
            "Comparable to a rifle bullet",
            "Enough to destroy an entire constellation",
            "Too little to damage a shielded satellite",
          ],
          "Comparable to a car travelling at motorway speed",
          "At orbital velocity, a one-centimetre fragment carries roughly the kinetic energy of a small car at motorway speed.",
          "It matches 'a small car at motorway speed'.",
        ),
        mcq(
          "What is said about the 600–1000 kilometre band?",
          [
            "It holds most debris and most new satellites",
            "It cleans itself within a few years",
            "It is empty of working spacecraft",
            "It is where removal missions have succeeded",
          ],
          "It holds most debris and most new satellites",
          "Between six hundred and one thousand kilometres — which is where most of the debris and most of the new satellite constellations are — the same process takes decades to centuries.",
          "That band holds most debris and most constellations.",
        ),
        mcq(
          "What has improved in recent years?",
          [
            "Compliance with disposal guidelines",
            "The accuracy of tracking data",
            "The success of capture missions",
            "International agreement on orbital fees",
          ],
          "Compliance with disposal guidelines",
          "Compliance with the twenty-five-year disposal guideline — the commitment to deorbit a satellite within that period after its mission ends — has risen from very low levels to a substantial majority of new missions, and several regulators have now shortened the period to five years.",
          "Compliance 'has risen from very low levels'.",
        ),
        mcq(
          "How does the passage characterise the present situation?",
          [
            "Stable but with worsening trends",
            "Already beyond any possible repair",
            "Improving faster than expected",
            "Dependent on a single new technology",
          ],
          "Stable but with worsening trends",
          "Nothing has broken, and the trend lines are not encouraging.",
          "Nothing has broken yet; the trends are bad.",
        ),
      ],
    },
    {
      key: "t57-p3-species-problem",
      title: "Where One Kind Ends",
      topic: "why biologists cannot agree on what a species is",
      difficulty: 9,
      body: `A) The species is the only rank in biological classification that is widely believed to correspond to something real in nature rather than to a convenience of filing. Genera, families and orders are acknowledged as human groupings. Species are supposed to be out there, waiting to be found. The awkward fact is that biologists have never agreed on what one is, and the disagreement is not a technicality awaiting resolution.

B) The definition most people were taught at school is the biological species concept: a species is a group of populations whose members interbreed, or can interbreed, and are reproductively isolated from other such groups. It is elegant and it fails immediately on a large part of life. Bacteria and archaea do not reproduce sexually, and exchange genes across enormous evolutionary distances; the concept has nothing to say about them, which is to say it has nothing to say about most of the living world. It cannot be applied to anything extinct, since no fossil can be tested for interbreeding. And it handles hybridisation badly, which matters because hybridisation turns out to be common: brown bears and polar bears, several species of Darwin's finches, and a substantial fraction of flowering plants all interbreed where their ranges meet, and remain distinguishable anyway.

C) The alternatives each solve part of the problem and introduce their own. The phylogenetic concept defines a species as the smallest group sharing a common ancestor and distinguishable by some character, which works for fossils and for asexual organisms but multiplies species enormously, since almost any population can be distinguished from its neighbours by something. The ecological concept defines it by the niche a population occupies, which handles bacteria well and closely related plants poorly. The genotypic cluster concept looks for gaps in the distribution of genetic variation, which is measurable and objective but requires a decision about how large a gap counts, and that decision is made by a person rather than by the data.

D) There are, by one survey, more than two dozen published species concepts in active use. They agree in the easy cases, which is why the disagreement is easy to overlook: nobody argues about whether a horse and an oak are different species. They diverge precisely where the interesting biology is, in populations that are partly separated, recently diverged, or exchanging genes at some low rate. Those are also, inconveniently, the populations most likely to be the subject of a conservation decision, because a population that has only just begun to diverge is usually one that has only just become isolated, and isolation is what makes a population vulnerable.

E) This would be an argument confined to journals were it not for conservation law. Legal protection in most countries attaches to the species, and sometimes to the subspecies or the distinct population; money, land-use restriction and criminal penalty all follow the category. Whether the red wolf is a species, a subspecies, or a hybrid of coyote and grey wolf has been argued for decades, and the answer determines whether a recovery programme is a legal obligation or a waste of public funds. The same question, with the same stakes, attends dozens of populations elsewhere.

F) One response is to abandon the rank altogether and describe populations, gene flow and divergence directly, without pretending to a category the data does not support. It is intellectually clean and practically hopeless. Every law, every database, every field guide and every conservation budget is organised by species, and no regulator is going to protect a gradient. A category that is admitted to be approximate is still the category everything else is built on.

G) My own view is that the species is best understood as a real pattern observed at low resolution. Populations do cluster; there really are gaps in the distribution of living things, and the clusters are not arbitrary. What is arbitrary is the insistence that a single criterion should draw the boundary in every group of organisms, when the processes generating the clusters differ so much between a bacterium, an oak and a bear. Biologists who work on one group develop a working definition suited to it, and this is usually described as a failure of rigour. It might be better described as an appropriate response to a world that did not evolve in order to be filed.`,
      questions: [
        fromList(
          "matching_information",
          SPECIES_PARAGRAPHS,
          "a case in which the classification determines a legal duty",
          "E",
          "Whether the red wolf is a species, a subspecies, or a hybrid of coyote and grey wolf has been argued for decades, and the answer determines whether a recovery programme is a legal obligation or a waste of public funds.",
          "Paragraph E gives the red wolf case.",
        ),
        fromList(
          "matching_information",
          SPECIES_PARAGRAPHS,
          "the reason a proposal to abandon the rank would not work in practice",
          "F",
          "Every law, every database, every field guide and every conservation budget is organised by species, and no regulator is going to protect a gradient.",
          "Paragraph F explains why abandonment fails.",
        ),
        fromList(
          "matching_information",
          SPECIES_PARAGRAPHS,
          "a contrast between the species and every other rank",
          "A",
          "The species is the only rank in biological classification that is widely believed to correspond to something real in nature rather than to a convenience of filing.",
          "Paragraph A draws that contrast.",
        ),
        fromList(
          "matching_information",
          SPECIES_PARAGRAPHS,
          "an observation that rival definitions agree about obvious cases",
          "D",
          "They agree in the easy cases, which is why the disagreement is easy to overlook: nobody argues about whether a horse and an oak are different species.",
          "Paragraph D notes the agreement in easy cases.",
        ),
        fromList(
          "matching_information",
          SPECIES_PARAGRAPHS,
          "an account of a definition that would greatly increase the number of species",
          "C",
          "The phylogenetic concept defines a species as the smallest group sharing a common ancestor and distinguishable by some character, which works for fossils and for asexual organisms but multiplies species enormously, since almost any population can be distinguished from its neighbours by something.",
          "Paragraph C describes the phylogenetic concept.",
        ),
        ynng(
          "The writer thinks the disagreement will be resolved by better data.",
          "NO",
          "The awkward fact is that biologists have never agreed on what one is, and the disagreement is not a technicality awaiting resolution.",
          "It is 'not a technicality awaiting resolution'.",
        ),
        ynng(
          "The writer believes the clusters biologists observe are genuine.",
          "YES",
          "Populations do cluster; there really are gaps in the distribution of living things, and the clusters are not arbitrary.",
          "The clusters 'are not arbitrary'.",
        ),
        ynng(
          "The writer approves of using one definition across all groups of organisms.",
          "NO",
          "What is arbitrary is the insistence that a single criterion should draw the boundary in every group of organisms, when the processes generating the clusters differ so much between a bacterium, an oak and a bear.",
          "That insistence is what the writer calls arbitrary.",
        ),
        ynng(
          "The writer regards group-specific working definitions as a lapse in standards.",
          "NO",
          "Biologists who work on one group develop a working definition suited to it, and this is usually described as a failure of rigour.",
          "The writer reports that description and rejects it.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECIES_ENDINGS,
          "The school definition cannot be applied to most living things",
          "because the organisms in question do not reproduce sexually at all.",
          "Bacteria and archaea do not reproduce sexually, and exchange genes across enormous evolutionary distances; the concept has nothing to say about them, which is to say it has nothing to say about most of the living world.",
          "Bacteria and archaea are not sexual reproducers.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECIES_ENDINGS,
          "Bears and finches are still treated as separate species",
          "although the two populations continue to exchange genes where they meet.",
          "brown bears and polar bears, several species of Darwin's finches, and a substantial fraction of flowering plants all interbreed where their ranges meet, and remain distinguishable anyway.",
          "They interbreed where their ranges meet.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECIES_ENDINGS,
          "The question is not merely academic,",
          "because conservation law attaches money and protection to the category.",
          "Legal protection in most countries attaches to the species, and sometimes to the subspecies or the distinct population; money, land-use restriction and criminal penalty all follow the category.",
          "Money and protection follow the category.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECIES_ENDINGS,
          "There is no single agreed test for the category,",
          "since more than two dozen published concepts are in active use.",
          "There are, by one survey, more than two dozen published species concepts in active use.",
          "With two dozen concepts in use, labels move.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECIES_ENDINGS,
          "The category remains approximate and indispensable,",
          "because everything else in biology is built on top of it.",
          "A category that is admitted to be approximate is still the category everything else is built on.",
          "Approximate, but everything is built on it.",
        ),
      ],
    },
  ],
};
