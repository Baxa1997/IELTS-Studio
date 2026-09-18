import {
  fromList,
  gapFill,
  mcq,
  noteLine,
  pickTwo,
  plain,
  tfng,
  ynng,
  type CuratedQuestion,
  type CuratedTest,
} from "../shared";

// ---- Passage 1 · archaeology · notes ----------------------------------------

const SITE = {
  title: "Machu Picchu: building, abandonment and rediscovery",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO --------------------------

const HEADINGS = [
  "A century of putting fires out",
  "Knowledge that was there all along",
  "Choosing the few days when it can be done",
  "Who pays if it escapes",
  "Smoke either way",
  "Does it work in the worst conditions?",
  "Fewer days, and fewer crews to use them",
  "Why forests grow back after fire",
  "Equipment for fighting fires from the air",
  "The cost of insuring a house",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const BURN_STEM = "Which TWO factors are said to be narrowing the window for controlled burning?";
const BURN_FACTORS = [
  "a longer and hotter fire season",
  "a shortage of trained crews",
  "rules banning all burning near towns",
  "the disappearance of dry fuel from forests",
  "a lack of aircraft for lighting fires",
];

// ---- Passage 3 · research debate · word bank --------------------------------

const EVOLUTION_BANK = [
  "lactase",
  "altitude",
  "fertility",
  "records",
  "mutations",
  "malaria",
  "culture",
  "survival",
];

export const TEST_45: CuratedTest = {
  key: "full-test-45",
  targetBand: 7,
  passages: [
    {
      key: "t45-p1-machu-picchu",
      title: "The Estate on the Ridge",
      topic: "what is known about Machu Picchu and how it became famous",
      difficulty: 6,
      body: `Machu Picchu stands on a narrow ridge between two peaks in the eastern Andes, about eighty kilometres from the Inca capital of Cusco and some two and a half thousand metres above sea level. It was built in the middle of the fifteenth century, during the reign of the ruler Pachacuti, who transformed the Inca state from a regional power into an empire. For most of the twentieth century it was described as a lost city, a fortress or a religious retreat. The documentary evidence points to something more domestic: a royal estate, built for an emperor and his household, and maintained by servants and farmers attached to it.

That conclusion comes from Spanish colonial archives rather than from the site itself. In the 1980s a historian found sixteenth-century legal papers in which local landowners described a property called Picchu that had belonged to Pachacuti, and the details match the location. An estate of this kind was a private possession rather than a public building: a place for the ruler to stay, to hunt, to entertain and to perform ceremonies, supported by terraces that grew maize on ground that had to be built before it could be farmed.

The construction is the part that impresses visitors, and half of it is invisible. Beneath the plazas and buildings lie layers of crushed rock, gravel and soil that drain water away from the foundations, which is why a site built on a steep slope in a region receiving two metres of rain a year has not slid into the valley. The finest walls are made of blocks shaped so precisely that they hold together without mortar, with doorways and windows narrower at the top than at the bottom — a shape that resists earthquakes. Rougher construction was used for ordinary buildings, and the difference in quality tracks the importance of the structure.

The site was abandoned within about a century of being built, probably during the disorder that followed the Spanish invasion, and the Spanish never found it. That is the origin of the word lost, and it is misleading. Families farmed the terraces for generations afterwards, and when an American academic, Hiram Bingham, climbed the ridge in 1911, he was led there by a local farmer and found the names of earlier visitors written on a wall. What Bingham did was not to discover the place but to publish it: he photographed it, cleared it, wrote about it for a wide readership and returned with funding for three expeditions.

He also misidentified it. Bingham had been searching for Vilcabamba, the refuge to which the last Inca rulers withdrew, and he argued for years that this was it. It was not; Vilcabamba lies further into the forest, and Bingham had in fact visited the correct site earlier without recognising it. The artefacts his expeditions removed — bones, pottery, metalwork — went to his university in the United States, and their return was demanded by Peru for most of the following century. An agreement signed in 2010 brought them back.

Much of what visitors are told about individual buildings is less certain than it sounds. A carved granite outcrop at the highest point of the site is commonly described as an astronomical instrument used to track the sun, and it may well have served that purpose, but the interpretation rests on the alignment of the stone rather than on any record of what it was for. Names such as the Temple of the Sun and the Royal Tomb were given by archaeologists, not by the Inca.

There is even an argument about the name. Machu Picchu means old peak in Quechua and is the name of the mountain the ridge runs from; the peak at the other end is Huayna Picchu, the young peak. Researchers examining early documents have suggested that the Inca themselves may have called the settlement by the latter name, or simply Picchu, and that the label now used worldwide was attached by outsiders to the wrong end of the ridge.

The modern problem is popularity. Well over a million people visit each year, arriving by train and bus along a single valley, and the combination of foot traffic, rainfall and steep ground makes the terraces vulnerable. Timed entry, fixed routes and daily limits have been introduced, adjusted, protested against by local businesses and adjusted again. The estate was built for a household of a few hundred, and it is now asked to accommodate that number every twenty minutes.`,
      questions: [
        noteLine(
          SITE,
          "Building",
          "Built in the fifteenth century during the reign of ______",
          "Pachacuti",
          "It was built in the middle of the fifteenth century, during the reign of the ruler Pachacuti, who transformed the Inca state from a regional power into an empire.",
          "It was built under 'the ruler Pachacuti'.",
        ),
        noteLine(
          SITE,
          "Building",
          "The evidence for this comes from Spanish colonial ______",
          "archives",
          "That conclusion comes from Spanish colonial archives rather than from the site itself.",
          "It comes 'from Spanish colonial archives'.",
        ),
        noteLine(
          SITE,
          "Building",
          "The site is best understood as a royal ______ rather than a city",
          "estate",
          "The documentary evidence points to something more domestic: a royal estate, built for an emperor and his household, and maintained by servants and farmers attached to it.",
          "It was 'a royal estate'.",
        ),
        noteLine(
          SITE,
          "Construction",
          "Hidden layers of rock and gravel ______ water away from foundations",
          "drain",
          "Beneath the plazas and buildings lie layers of crushed rock, gravel and soil that drain water away from the foundations, which is why a site built on a steep slope in a region receiving two metres of rain a year has not slid into the valley.",
          "The layers 'drain water away from the foundations'.",
        ),
        noteLine(
          SITE,
          "Construction",
          "The best walls hold together without ______",
          "mortar",
          "The finest walls are made of blocks shaped so precisely that they hold together without mortar, with doorways and windows narrower at the top than at the bottom — a shape that resists earthquakes.",
          "They 'hold together without mortar'.",
        ),
        noteLine(
          SITE,
          "Construction",
          "Openings narrower at the top resist ______",
          "earthquakes",
          "The finest walls are made of blocks shaped so precisely that they hold together without mortar, with doorways and windows narrower at the top than at the bottom — a shape that resists earthquakes.",
          "The shape 'resists earthquakes'.",
        ),
        noteLine(
          SITE,
          "1911",
          "Bingham was led up the ridge by a local ______",
          "farmer",
          "Families farmed the terraces for generations afterwards, and when an American academic, Hiram Bingham, climbed the ridge in 1911, he was led there by a local farmer and found the names of earlier visitors written on a wall.",
          "He 'was led there by a local farmer'.",
        ),
        noteLine(
          SITE,
          "1911",
          "He wrongly believed the site was ______",
          "Vilcabamba",
          "Bingham had been searching for Vilcabamba, the refuge to which the last Inca rulers withdrew, and he argued for years that this was it.",
          "He argued 'that this was it' — Vilcabamba.",
        ),
        tfng(
          "The terraces at the site were built on ground that already suited farming.",
          "FALSE",
          "An estate of this kind was a private possession rather than a public building: a place for the ruler to stay, to hunt, to entertain and to perform ceremonies, supported by terraces that grew maize on ground that had to be built before it could be farmed.",
          "The ground 'had to be built before it could be farmed'.",
        ),
        tfng(
          "All the buildings at Machu Picchu were constructed to the same standard.",
          "FALSE",
          "Rougher construction was used for ordinary buildings, and the difference in quality tracks the importance of the structure.",
          "Quality varied with 'the importance of the structure'.",
        ),
        tfng(
          "Spanish forces reached and recorded the site in the sixteenth century.",
          "FALSE",
          "The site was abandoned within about a century of being built, probably during the disorder that followed the Spanish invasion, and the Spanish never found it.",
          "'The Spanish never found it'.",
        ),
        tfng(
          "Objects taken by Bingham's expeditions have been returned to Peru.",
          "TRUE",
          "An agreement signed in 2010 brought them back.",
          "The 2010 agreement 'brought them back'.",
        ),
        tfng(
          "Visitor numbers have fallen since limits were introduced.",
          "NOT GIVEN",
          "",
          "Limits are described, but no figures on their effect are given.",
        ),
      ],
    },
    {
      key: "t45-p2-prescribed-burns",
      title: "Fighting Fire with Fire",
      topic: "the deliberate use of fire to reduce the severity of wildfires",
      difficulty: 7,
      body: `A) For most of the twentieth century, the policy of forest services across North America and Australia was to put out every fire as quickly as possible. In the United States the rule was formalised as an instruction to control any new fire by ten o'clock the following morning. It was effective, and that was the problem. Forests that had burned lightly every few years for millennia stopped burning, and the material that fire used to remove — fallen branches, dead needles, dense young growth — accumulated season after season, until a fire that started in one of them could no longer be stopped by anyone.

B) The practice being reintroduced to deal with this is not new, and the people who developed it were not foresters. Aboriginal Australians and Indigenous peoples across North America used fire deliberately for thousands of years, burning small patches in the cooler months to encourage particular plants, to make travel easier, to drive game and to ensure that no area held enough fuel to carry a catastrophic fire. That knowledge was suppressed along with much else, and is now being sought out: fire agencies in several countries run programmes in which cultural practitioners lead burns and train crews.

C) A controlled burn is a demanding piece of work. The fuel must be dry enough to carry flame but damp enough not to carry it far; the wind must be steady and in the right direction; the humidity must sit inside a narrow band; there must be crews and equipment available, and somewhere safe for the smoke to go. In many regions these conditions coincide on only a handful of days each season, and they have to coincide with the availability of the people who do the work. Missing the window means waiting a year.

D) Two pressures are closing that window further. The fire season itself is lengthening at both ends, leaving fewer cool, damp weeks in which a planned fire can be lit safely, and the days that remain are often too windy or too dry. At the same time, the crews qualified to run burns are the same crews that fight wildfires, and as the wildfire season grows longer they are unavailable for more of the year. Agencies in several countries report that they achieve a fraction of the burning they plan, and that the shortfall is mostly a matter of people and days rather than of money.

E) The liability question deters private landowners more than any other single factor. A burn that escapes and damages a neighbour's property exposes whoever lit it to claims, and in some jurisdictions to criminal charges, even though escapes are rare — the great majority of planned burns are completed without incident. Several states have responded by limiting liability to cases of negligence, by offering insurance pools for certified burners, and by creating associations in which landowners help each other and share the risk. Where these exist, the area burned by private owners has risen sharply.

F) Smoke is the objection the public raises, and it deserves a straight answer rather than a dismissal. A controlled burn does put smoke into the air, sometimes over towns, and it can affect people with asthma and heart conditions. The comparison, however, is not with clean air; it is with the smoke of the wildfire that the burn is intended to prevent, which arrives without warning, lasts for weeks, covers a far larger area and is far denser. Planned smoke can be timed, forecast, announced and directed away from settlements. Unplanned smoke cannot.

G) The most serious scientific criticism is about the limits of the method. Burning reduces the amount of fuel available, and studies consistently find that a fire entering recently treated ground burns less intensely and is easier to control — for a few years, until the fuel returns. Under the most extreme conditions, when temperatures are very high, humidity very low and winds very strong, fires have crossed treated ground with little reduction in severity. Advocates and critics draw different conclusions from this. One side argues that treatment therefore cannot be relied upon; the other that a measure which helps in most conditions and fails only in the worst is still worth doing, because most fires are not the worst.`,
      questions: [
        heading(
          "A",
          "A century of putting fires out",
          "For most of the twentieth century, the policy of forest services across North America and Australia was to put out every fire as quickly as possible.",
          "Paragraph A: the suppression policy and its consequence.",
        ),
        heading(
          "B",
          "Knowledge that was there all along",
          "Aboriginal Australians and Indigenous peoples across North America used fire deliberately for thousands of years, burning small patches in the cooler months to encourage particular plants, to make travel easier, to drive game and to ensure that no area held enough fuel to carry a catastrophic fire.",
          "Paragraph B: Indigenous fire knowledge.",
        ),
        heading(
          "C",
          "Choosing the few days when it can be done",
          "In many regions these conditions coincide on only a handful of days each season, and they have to coincide with the availability of the people who do the work.",
          "Paragraph C: the narrow window of suitable days.",
        ),
        heading(
          "D",
          "Fewer days, and fewer crews to use them",
          "At the same time, the crews qualified to run burns are the same crews that fight wildfires, and as the wildfire season grows longer they are unavailable for more of the year.",
          "Paragraph D: the shortage is of days and of qualified people.",
        ),
        heading(
          "E",
          "Who pays if it escapes",
          "A burn that escapes and damages a neighbour's property exposes whoever lit it to claims, and in some jurisdictions to criminal charges, even though escapes are rare — the great majority of planned burns are completed without incident.",
          "Paragraph E: liability for escaped burns.",
        ),
        heading(
          "F",
          "Smoke either way",
          "The comparison, however, is not with clean air; it is with the smoke of the wildfire that the burn is intended to prevent, which arrives without warning, lasts for weeks, covers a far larger area and is far denser.",
          "Paragraph F: planned smoke against wildfire smoke.",
        ),
        heading(
          "G",
          "Does it work in the worst conditions?",
          "Under the most extreme conditions, when temperatures are very high, humidity very low and winds very strong, fires have crossed treated ground with little reduction in severity.",
          "Paragraph G: the limits under extreme conditions.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "American policy required a new fire to be controlled by ______ the next morning.",
          "ten o'clock",
          "In the United States the rule was formalised as an instruction to control any new fire by ten o'clock the following morning.",
          "The rule named 'ten o'clock the following morning'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Suppression allowed fallen branches and dead ______ to build up.",
          "needles",
          "Forests that had burned lightly every few years for millennia stopped burning, and the material that fire used to remove — fallen branches, dead needles, dense young growth — accumulated season after season, until a fire that started in one of them could no longer be stopped by anyone.",
          "The list includes 'dead needles'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Indigenous burning was done in the ______ months.",
          "cooler",
          "Aboriginal Australians and Indigenous peoples across North America used fire deliberately for thousands of years, burning small patches in the cooler months to encourage particular plants, to make travel easier, to drive game and to ensure that no area held enough fuel to carry a catastrophic fire.",
          "They burned 'in the cooler months'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some states now limit a burner's liability to cases of ______.",
          "negligence",
          "Several states have responded by limiting liability to cases of negligence, by offering insurance pools for certified burners, and by creating associations in which landowners help each other and share the risk.",
          "Liability is limited 'to cases of negligence'.",
        ),
        pickTwo(
          BURN_STEM,
          BURN_FACTORS,
          "A or B",
          "The fire season itself is lengthening at both ends, leaving fewer cool, damp weeks in which a planned fire can be lit safely, and the days that remain are often too windy or too dry.",
          "A is given: the season is lengthening at both ends.",
        ),
        pickTwo(
          BURN_STEM,
          BURN_FACTORS,
          "A or B",
          "At the same time, the crews qualified to run burns are the same crews that fight wildfires, and as the wildfire season grows longer they are unavailable for more of the year.",
          "B is given: the qualified crews are busy fighting fires. C, D and E are not mentioned.",
        ),
      ],
    },
    {
      key: "t45-p3-human-evolution",
      title: "Are We Still Evolving?",
      topic: "evidence that natural selection continues to act on human populations",
      difficulty: 8,
      body: `The question is usually asked in a tone that expects the answer no. Medicine keeps people alive who would once have died; agriculture removes the pressure of hunger; comfort removes the pressure of cold. If natural selection is the differential survival of the fit, and almost everybody survives, surely selection has stopped. The reasoning contains a mistake in its first premise, and the evidence contradicts its conclusion.

The mistake is to equate selection with survival. What natural selection acts on is the number of surviving descendants, and survival to adulthood is only one of the things that affect it. Age at first birth, the number of children born, the interval between them and the survival of those children to reproduce in turn all contribute, and none of these has been abolished by medicine. In a population where almost every child survives, differences in the number of children become more important to selection, not less.

The clearest evidence that selection has operated recently comes from genetics. The ability to digest milk sugar in adulthood, which depends on keeping an enzyme active after weaning, spread through several populations within the last seven thousand years, at a speed that only strong selection can explain, and it arose independently in Europe and in East Africa. Tolerance of low oxygen at high altitude, found in Tibetan populations, is associated with a variant that appears to have entered the human line from an archaic relative and to have risen to high frequency in a few thousand years. Resistance to malaria has arisen repeatedly, sometimes at the cost of serious blood disorders in people who inherit two copies. Adaptations to starch-rich diets, to arsenic in drinking water, and to diving for long periods have all been documented in particular populations.

Those examples are from the past, but they are recent, and the same methods can be turned on the present. Studies using large medical databases, which combine genetic information with health and family records for hundreds of thousands of people, have looked for variants that are associated with having more or fewer children in living populations. Several have been found: variants associated with later first births are becoming less common in some cohorts, and there is evidence of selection against variants linked to heavy smoking, which appear to affect fertility indirectly. A long-running study of one American town found signals of selection towards slightly earlier first birth and lower cholesterol over a few generations.

The effects are small, and predictions built on them are unreliable, because the environment that determines which variants are favoured keeps changing — and human beings change it deliberately. This is the second reason the original question is confused. Culture does not switch selection off; it redirects it. Dairy farming created the pressure that favoured milk digestion. Cooking changed jaws and teeth. Cities concentrated populations and, with them, infectious disease, leaving genetic marks of resistance. Every technology that alters how people live alters what is advantageous, usually faster than the biology can follow.

There are also changes that have nothing to do with selection. Populations are far more mixed than they were, which spreads variants that were once regional. Parents are older on average, and the number of new mutations a child carries rises with the father's age. Chance plays a larger role in small populations than most people assume. Evolution is change in the frequency of variants, and much of that change is drift rather than adaptation.

Two things are worth saying about how this subject is discussed. The first is that the timescales involved make almost all speculation about the future of the species worthless: a strong selective pressure takes dozens of generations to produce a visible change, and nothing about the current environment can be assumed to persist that long. The second is that the topic has an unpleasant history. Arguments about human evolution have been used to justify eugenics, to rank populations and to dress prejudice in scientific language, and claims that any group is evolving in some particular direction should be examined with that history in mind. The evidence supports a modest and interesting conclusion: that we are an ordinary species, subject to the same processes as any other, and currently living through the fastest environmental change any species has ever engineered for itself.`,
      questions: [
        mcq(
          "What error does the writer identify in the common argument?",
          [
            "assuming that medicine has improved survival",
            "treating selection as though it were only about survival",
            "believing that evolution requires millions of years",
            "confusing natural selection with mutation",
          ],
          "treating selection as though it were only about survival",
          "The mistake is to equate selection with survival.",
          "'The mistake is to equate selection with survival.'",
        ),
        mcq(
          "Why does the writer say selection can become more powerful when child mortality falls?",
          [
            "because more children survive to be counted",
            "because differences in the number of children matter more",
            "because medicine introduces new pressures",
            "because families become smaller",
          ],
          "because differences in the number of children matter more",
          "In a population where almost every child survives, differences in the number of children become more important to selection, not less.",
          "Differences in number 'become more important to selection, not less'.",
        ),
        mcq(
          "What is notable about the ability to digest milk in adulthood?",
          [
            "It is found only in Europe.",
            "It arose separately in more than one region.",
            "It developed over a million years.",
            "It disappears in populations that stop farming.",
          ],
          "It arose separately in more than one region.",
          "The ability to digest milk sugar in adulthood, which depends on keeping an enzyme active after weaning, spread through several populations within the last seven thousand years, at a speed that only strong selection can explain, and it arose independently in Europe and in East Africa.",
          "It 'arose independently in Europe and in East Africa'.",
        ),
        mcq(
          "How have researchers looked for selection acting on living populations?",
          [
            "by measuring changes in average height",
            "by comparing modern people with ancient skeletons",
            "by linking genetic variants to the number of children people have",
            "by observing isolated communities over a century",
          ],
          "by linking genetic variants to the number of children people have",
          "Studies using large medical databases, which combine genetic information with health and family records for hundreds of thousands of people, have looked for variants that are associated with having more or fewer children in living populations.",
          "They look for variants 'associated with having more or fewer children'.",
        ),
        mcq(
          "What does the writer say about culture's relationship with selection?",
          [
            "Culture has brought selection to an end.",
            "Culture changes what is advantageous rather than removing selection.",
            "Culture affects only diet-related traits.",
            "Culture slows evolution to an imperceptible rate.",
          ],
          "Culture changes what is advantageous rather than removing selection.",
          "Culture does not switch selection off; it redirects it.",
          "'Culture does not switch selection off; it redirects it.'",
        ),
        ynng(
          "The writer accepts that most speculation about humanity's evolutionary future is unreliable.",
          "YES",
          "The first is that the timescales involved make almost all speculation about the future of the species worthless: a strong selective pressure takes dozens of generations to produce a visible change, and nothing about the current environment can be assumed to persist that long.",
          "Such speculation is called 'worthless'.",
        ),
        ynng(
          "The writer thinks all genetic change in populations is the result of adaptation.",
          "NO",
          "Evolution is change in the frequency of variants, and much of that change is drift rather than adaptation.",
          "'Much of that change is drift rather than adaptation.'",
        ),
        ynng(
          "The writer believes claims about groups evolving in particular directions deserve extra scrutiny.",
          "YES",
          "Arguments about human evolution have been used to justify eugenics, to rank populations and to dress prejudice in scientific language, and claims that any group is evolving in some particular direction should be examined with that history in mind.",
          "They 'should be examined with that history in mind'.",
        ),
        ynng(
          "The writer regards humans as exempt from the processes affecting other species.",
          "NO",
          "The evidence supports a modest and interesting conclusion: that we are an ordinary species, subject to the same processes as any other, and currently living through the fastest environmental change any species has ever engineered for itself.",
          "'We are an ordinary species, subject to the same processes as any other'.",
        ),
        ynng(
          "The writer states that human height will increase over the next few centuries.",
          "NOT GIVEN",
          "",
          "No prediction about height is made anywhere in the passage.",
        ),
        fromList(
          "summary_completion",
          EVOLUTION_BANK,
          "Selection acts on the number of descendants, not only on ______.",
          "survival",
          "What natural selection acts on is the number of surviving descendants, and survival to adulthood is only one of the things that affect it.",
          "Survival 'is only one of the things that affect it'.",
        ),
        fromList(
          "summary_completion",
          EVOLUTION_BANK,
          "Keeping the ______ enzyme active into adulthood spread within seven thousand years.",
          "lactase",
          "The ability to digest milk sugar in adulthood, which depends on keeping an enzyme active after weaning, spread through several populations within the last seven thousand years, at a speed that only strong selection can explain, and it arose independently in Europe and in East Africa.",
          "The enzyme that digests milk sugar is lactase.",
        ),
        fromList(
          "summary_completion",
          EVOLUTION_BANK,
          "Studies of living populations use medical databases and family ______.",
          "records",
          "Studies using large medical databases, which combine genetic information with health and family records for hundreds of thousands of people, have looked for variants that are associated with having more or fewer children in living populations.",
          "They combine genetic data with 'health and family records'.",
        ),
        fromList(
          "summary_completion",
          EVOLUTION_BANK,
          "The number of new ______ a child carries rises with the father's age.",
          "mutations",
          "Parents are older on average, and the number of new mutations a child carries rises with the father's age.",
          "'The number of new mutations a child carries rises with the father's age.'",
        ),
      ],
    },
  ],
};
