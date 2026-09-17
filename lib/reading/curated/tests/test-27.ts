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

// ---- Passage 1 · history · notes + True/False/Not Given ----------------------

const LIBRARY = {
  title: "The Library Cave at Dunhuang",
  layout: "notes" as const,
  wordLimit: "NO MORE THAN TWO WORDS",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO ---------------------------

const HEADINGS = [
  "A material that breaks up but does not disappear",
  "Evidence from inside the human body",
  "A finding that caused alarm",
  "Reasons to treat the results with care",
  "An unclear picture of the risks to health",
  "What individuals and society can do",
  "Slow progress on international rules",
  "A cheap replacement for plastic",
  "Why recycling has solved the problem",
  "The invention of the first plastic",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const EXPOSURE_STEM =
  "Which TWO ways of reducing personal exposure to plastic particles are mentioned in the passage?";
const EXPOSURE = [
  "not heating food in plastic containers",
  "avoiding all seafood",
  "filtering tap water",
  "wearing a mask indoors",
  "drinking only bottled water",
];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const SUNLIGHT_BANK = [
  "kilometres",
  "seawater",
  "monsoons",
  "ozone",
  "metres",
  "freshwater",
  "forests",
  "clouds",
];

export const TEST_27: CuratedTest = {
  key: "full-test-27",
  targetBand: 8,
  passages: [
    {
      key: "t27-p1-dunhuang",
      title: "The Library Hidden in a Cave",
      topic: "the discovery and scattering of an ancient library on the Silk Road",
      difficulty: 7,
      body: `On the edge of the Gobi Desert, near the oasis town of Dunhuang in north-western China, hundreds of caves have been carved into a cliff face. Known as the Mogao Caves, they were created by Buddhist monks and their supporters over a period of about a thousand years, from the fourth to the fourteenth century. Dunhuang stood at a junction of the Silk Road, the network of trade routes connecting China with Central Asia, India and the Mediterranean, and the caves became a centre of religious life, art and learning. Around 490 of them contain wall paintings and sculptures, and the paintings together cover an area of some 45,000 square metres.

In 1900, a Taoist monk named Wang Yuanlu, who had appointed himself guardian of the caves and was working to restore them, made an extraordinary discovery. While clearing sand from one of the caves, he found a hidden doorway behind a wall painting. Behind it was a small chamber packed from floor to ceiling with manuscripts, paintings on silk and paper, textiles and other objects. The chamber, now known as the Library Cave, had apparently been sealed early in the eleventh century, and its contents had lain undisturbed for about nine hundred years, preserved by the dry desert air.

The cave held an estimated 50,000 documents, written in more than a dozen languages, including Chinese, Tibetan, Sanskrit, Uyghur and Hebrew. Most were Buddhist texts, but the collection also included historical records, contracts, letters, medical texts, poems and even practice exercises written by students. Why the chamber was sealed remains uncertain. Some scholars believe that the monks hid the materials to protect them from an approaching invasion, while others suggest that the cave was simply used to store old or damaged texts that could not be thrown away because they were considered sacred.

Wang reported his discovery to local officials, but the authorities showed little interest, and he was instructed to keep the chamber closed. News of the find nevertheless spread. In 1907, the Hungarian-born British explorer Aurel Stein arrived at Dunhuang. After winning Wang's trust, partly by expressing his admiration for a famous Chinese Buddhist traveller, Stein persuaded the monk to part with thousands of manuscripts and paintings in return for a donation towards the restoration of the caves. The following year, the French scholar Paul Pelliot, who could read Chinese, selected thousands more of the most valuable items. Expeditions from Japan, Russia and the United States followed.

As a result, the Library Cave's contents are now scattered across museums and libraries in more than a dozen countries, with the largest collections in London, Paris, Beijing and St Petersburg. The removal of the documents remains a sensitive issue. In China, the foreign explorers are often seen as having taken advantage of a period of national weakness, while defenders of the expeditions argue that the materials might otherwise have been lost or destroyed during the political turmoil of the following decades.

Among the treasures taken by Stein was a printed copy of the Diamond Sutra, a Buddhist text, which is now held by the British Library in London. The scroll, more than five metres long, bears a date equivalent to the year 868 CE, making it the earliest complete printed book that carries a date. It was produced using carved wooden blocks, a technique that was in use in China centuries before printing with movable metal type was developed in Europe.

For many decades, scholars who wished to study the Dunhuang materials had to travel between institutions in different countries, and some documents that had been separated could not be read together. In 1994, the British Library and other institutions launched the International Dunhuang Project, which aims to photograph and catalogue the scattered collections and make them freely available online. Hundreds of thousands of images have since been published, allowing researchers anywhere in the world to examine the documents.

The caves themselves face new challenges. Growing numbers of tourists bring moisture and carbon dioxide into the caves, which can damage the ancient paintings, while wind-blown sand wears away the cliff face. To protect the site, the authorities limit visitor numbers, require tickets to be booked in advance and have created a digital visitor centre where people can view high-quality reproductions of the caves. Researchers have also produced detailed digital records of many caves, so that their appearance can be preserved even if the originals deteriorate.`,
      questions: [
        noteLine(
          LIBRARY,
          "The site",
          "caves made by Buddhist ______ and their supporters",
          "monks",
          "Known as the Mogao Caves, they were created by Buddhist monks and their supporters over a period of about a thousand years, from the fourth to the fourteenth century.",
          "They 'were created by Buddhist monks and their supporters'.",
        ),
        noteLine(
          LIBRARY,
          "The site",
          "Dunhuang stood at a junction of the ______",
          "Silk Road",
          "Dunhuang stood at a junction of the Silk Road, the network of trade routes connecting China with Central Asia, India and the Mediterranean, and the caves became a centre of religious life, art and learning.",
          "Dunhuang 'stood at a junction of the Silk Road'.",
        ),
        noteLine(
          LIBRARY,
          "The discovery",
          "1900: Wang found a hidden ______ behind a wall painting",
          "doorway",
          "While clearing sand from one of the caves, he found a hidden doorway behind a wall painting.",
          "He found 'a hidden doorway behind a wall painting'.",
        ),
        noteLine(
          LIBRARY,
          "The discovery",
          "the chamber had been sealed early in the ______ century",
          "eleventh",
          "The chamber, now known as the Library Cave, had apparently been sealed early in the eleventh century, and its contents had lain undisturbed for about nine hundred years, preserved by the dry desert air.",
          "It was 'sealed early in the eleventh century'.",
        ),
        noteLine(
          LIBRARY,
          "The discovery",
          "contents included contracts, letters, poems and ______ written by students",
          "practice exercises",
          "Most were Buddhist texts, but the collection also included historical records, contracts, letters, medical texts, poems and even practice exercises written by students.",
          "The cave held 'practice exercises written by students'.",
        ),
        noteLine(
          LIBRARY,
          "What happened next",
          "officials told Wang to keep the chamber ______",
          "closed",
          "Wang reported his discovery to local officials, but the authorities showed little interest, and he was instructed to keep the chamber closed.",
          "He 'was instructed to keep the chamber closed'.",
        ),
        noteLine(
          LIBRARY,
          "What happened next",
          "1907: Stein made a ______ towards restoring the caves",
          "donation",
          "After winning Wang's trust, partly by expressing his admiration for a famous Chinese Buddhist traveller, Stein persuaded the monk to part with thousands of manuscripts and paintings in return for a donation towards the restoration of the caves.",
          "Stein gave 'a donation towards the restoration of the caves'.",
        ),
        noteLine(
          LIBRARY,
          "What happened next",
          "the Diamond Sutra was printed using carved wooden ______",
          "blocks",
          "It was produced using carved wooden blocks, a technique that was in use in China centuries before printing with movable metal type was developed in Europe.",
          "It was 'produced using carved wooden blocks'.",
        ),
        tfng(
          "All the documents in the Library Cave were written in Chinese.",
          "FALSE",
          "The cave held an estimated 50,000 documents, written in more than a dozen languages, including Chinese, Tibetan, Sanskrit, Uyghur and Hebrew.",
          "The documents were written 'in more than a dozen languages'.",
        ),
        tfng(
          "Historians agree about why the Library Cave was sealed.",
          "FALSE",
          "Why the chamber was sealed remains uncertain.",
          "The reason 'remains uncertain', and two different views are given.",
        ),
        tfng(
          "Paul Pelliot was able to read Chinese.",
          "TRUE",
          "The following year, the French scholar Paul Pelliot, who could read Chinese, selected thousands more of the most valuable items.",
          "Pelliot is described as someone 'who could read Chinese'.",
        ),
        tfng(
          "Pelliot paid Wang more than Stein had paid him.",
          "NOT GIVEN",
          "",
          "Stein's donation is mentioned, but no payment by Pelliot is described.",
        ),
        tfng(
          "The number of people allowed to visit the caves is limited.",
          "TRUE",
          "To protect the site, the authorities limit visitor numbers, require tickets to be booked in advance and have created a digital visitor centre where people can view high-quality reproductions of the caves.",
          "'The authorities limit visitor numbers'.",
        ),
      ],
    },
    {
      key: "t27-p2-microplastics",
      title: "The Plastic Inside Us",
      topic: "what scientists know about microplastics in the human body",
      difficulty: 8,
      body: `A) Since the mass production of plastic began in the 1950s, the world has manufactured billions of tonnes of it, and global production now exceeds 400 million tonnes a year. Much of this plastic does not disappear when it is thrown away. Instead, exposed to sunlight, heat and physical wear, it gradually breaks into ever smaller pieces. Particles smaller than five millimetres are known as microplastics, while the tiniest, invisible even under ordinary microscopes, are called nanoplastics. These particles have now been found almost everywhere scientists have looked, from the deepest ocean trenches to the snow near the summit of Mount Everest. Because plastic can last for centuries, the amount in the environment is expected to grow for many decades, even if production is reduced.

B) Increasingly, they are also being found inside the human body. Over the past few years, researchers have reported microplastics in human blood, lungs, placentas and breast milk. A study published in 2024, using a new imaging technique, estimated that a typical litre of bottled water contains roughly 240,000 tiny plastic fragments, most of them nanoplastics that earlier methods had been unable to detect. People are also thought to swallow and breathe in particles from food, household dust and the air, with synthetic clothing and car tyres among the major sources. Estimates of how much plastic a person takes in each week vary enormously from one study to another.

C) One of the most striking findings came in 2025, when researchers analysed brain tissue from people who had died. They reported that the brain samples contained higher concentrations of microplastics than samples from the liver or kidneys, and that samples from 2024 contained more plastic than those collected eight years earlier. Brain samples from people who had been diagnosed with dementia appeared to contain even greater amounts. The findings attracted enormous media attention, with some reports suggesting that plastic might be contributing to brain disease. Some headlines claimed that a human brain might contain as much plastic as a plastic spoon, although such comparisons were widely criticised.

D) Many scientists urged caution, however. Measuring tiny plastic particles in human tissue is extremely difficult, and contamination is a constant risk, since plastic is present in laboratory equipment, clothing and the air itself. Some of the methods used in recent studies have been criticised because other substances in the body, such as certain fats, can produce signals similar to those of plastic, which may lead to overestimates. The researchers behind the brain study themselves stressed that their findings showed a link, not proof that plastics cause dementia; changes in the brain caused by the disease might, for example, make it easier for particles to build up.

E) What effects microplastics have on human health remains largely unknown. Laboratory studies have shown that high concentrations can cause inflammation and damage to cells, but these experiments often use amounts and types of particles that differ from those people are actually exposed to. One study published in 2024 found that patients with plastic particles in the fatty deposits of their neck arteries were more likely to suffer a heart attack or stroke, or to die, over the following three years than patients without them. The authors noted, however, that their study could not show that the plastic was the cause. Large studies following people over many years will be needed before firm conclusions can be drawn.

F) Reducing exposure is not straightforward, but some simple steps may help. Studies suggest that heating food in plastic containers releases large numbers of particles. Filtering tap water may also reduce the amount that people consume. But because microplastics are so widespread, individual choices can only achieve so much. Many researchers argue that the most effective approach is to reduce the amount of plastic produced and released into the environment in the first place, for example by improving waste management and designing products that shed fewer particles.

G) Governments have begun to act, although progress has been uneven. Several countries have banned tiny plastic beads in cosmetics, and the European Union has restricted the deliberate addition of microplastics to many products. Since 2022, countries have been negotiating a global treaty to end plastic pollution, but the talks have repeatedly stalled because of disagreements over whether the treaty should limit how much plastic is produced. Until stronger action is taken, scientists expect the amount of plastic in the environment, and in our bodies, to keep rising.`,
      questions: [
        heading(
          "A",
          "A material that breaks up but does not disappear",
          "Instead, exposed to sunlight, heat and physical wear, it gradually breaks into ever smaller pieces.",
          "Paragraph A explains that plastic breaks into smaller and smaller pieces rather than disappearing.",
        ),
        heading(
          "B",
          "Evidence from inside the human body",
          "Increasingly, they are also being found inside the human body.",
          "Paragraph B lists plastic found in blood, lungs, placentas and breast milk.",
        ),
        heading(
          "C",
          "A finding that caused alarm",
          "The findings attracted enormous media attention, with some reports suggesting that plastic might be contributing to brain disease.",
          "Paragraph C describes the brain study and the attention it received.",
        ),
        heading(
          "D",
          "Reasons to treat the results with care",
          "Many scientists urged caution, however.",
          "Paragraph D explains contamination, measurement problems and the difference between a link and a cause.",
        ),
        heading(
          "E",
          "An unclear picture of the risks to health",
          "What effects microplastics have on human health remains largely unknown.",
          "Paragraph E says the health effects remain largely unknown.",
        ),
        heading(
          "F",
          "What individuals and society can do",
          "Many researchers argue that the most effective approach is to reduce the amount of plastic produced and released into the environment in the first place, for example by improving waste management and designing products that shed fewer particles.",
          "Paragraph F moves from personal steps to reducing plastic at source.",
        ),
        heading(
          "G",
          "Slow progress on international rules",
          "Since 2022, countries have been negotiating a global treaty to end plastic pollution, but the talks have repeatedly stalled because of disagreements over whether the treaty should limit how much plastic is produced.",
          "Paragraph G describes the stalled treaty talks.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Plastic breaks into smaller pieces when it is exposed to sunlight, heat and physical ______.",
          "wear",
          "Instead, exposed to sunlight, heat and physical wear, it gradually breaks into ever smaller pieces.",
          "It breaks up when 'exposed to sunlight, heat and physical wear'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Plastic particles have been found in snow near the summit of Mount ______.",
          "Everest",
          "These particles have now been found almost everywhere scientists have looked, from the deepest ocean trenches to the snow near the summit of Mount Everest.",
          "They were found 'near the summit of Mount Everest'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Major sources of particles include synthetic clothing and car ______.",
          "tyres",
          "People are also thought to swallow and breathe in particles from food, household dust and the air, with synthetic clothing and car tyres among the major sources.",
          "Sources include 'synthetic clothing and car tyres'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Certain ______ in the body can give signals that look like those of plastic.",
          "fats",
          "Some of the methods used in recent studies have been criticised because other substances in the body, such as certain fats, can produce signals similar to those of plastic, which may lead to overestimates.",
          "'Certain fats' can produce similar signals.",
        ),
        pickTwo(
          EXPOSURE_STEM,
          EXPOSURE,
          "A or C",
          "Studies suggest that heating food in plastic containers releases large numbers of particles.",
          "A is correct: heating food in plastic 'releases large numbers of particles'. E is wrong — bottled water contains many fragments.",
        ),
        pickTwo(
          EXPOSURE_STEM,
          EXPOSURE,
          "A or C",
          "Filtering tap water may also reduce the amount that people consume.",
          "C is correct: filtering tap water 'may also reduce the amount'. B and D are not mentioned.",
        ),
      ],
    },
    {
      key: "t27-p3-solar-geoengineering",
      title: "Should We Dim the Sun?",
      topic: "the debate over cooling the planet by reflecting sunlight",
      difficulty: 9,
      body: `In June 1991, Mount Pinatubo in the Philippines erupted, sending around 15 million tonnes of sulphur dioxide high into the stratosphere. There, the gas formed a thin layer of tiny particles that reflected a small fraction of incoming sunlight back into space, and over the following year average global temperatures fell by roughly half a degree Celsius. The eruption has since become a reference point for a proposal that was once confined to the margins of climate science but is now debated seriously: deliberately reflecting sunlight to cool the planet. I believe the idea deserves careful research, but the case for actually using it is far weaker than its advocates suggest.

The best-known version of this approach, known as stratospheric aerosol injection, would involve aircraft releasing particles, probably sulphur compounds, at altitudes of around twenty kilometres. Computer models suggest that such a programme could reduce global temperatures relatively quickly and at a cost far lower than that of cutting emissions, perhaps a few billion dollars a year. Other proposals include brightening low clouds over the oceans by spraying fine droplets of seawater into them, which would cause the clouds to reflect more sunlight.

Supporters argue that the world may need such a tool. Emissions are falling too slowly to prevent dangerous warming, and even if they stopped tomorrow, temperatures would remain high for centuries, because carbon dioxide persists in the atmosphere. Solar geoengineering, they suggest, could reduce the worst effects of warming, such as extreme heat, while emissions are cut and carbon is removed from the air. Some researchers compare it to a painkiller: it would not cure the underlying disease, but it might relieve dangerous symptoms.

The difficulty is that this painkiller comes with serious risks. Reflecting sunlight does nothing to reduce the carbon dioxide that is making the oceans more acidic. Models suggest that it could alter rainfall patterns, potentially weakening the monsoons on which billions of people depend, although the extent of these effects is uncertain. Sulphur particles could also delay the recovery of the ozone layer. Perhaps most worrying is the problem known as termination shock: if a programme were started and then suddenly stopped, perhaps because of war or political upheaval, the warming it had concealed would return within a few years, far faster than societies and ecosystems could adapt.

There is also a political problem. Because the technology would be relatively cheap, a single country, or even a wealthy individual, might be able to deploy it without international agreement, affecting the climate of the entire planet. Who would decide how much cooling should take place, and how would countries that suffered harmful side effects be compensated? No international body currently has the authority to govern such decisions. In my view, these questions are not details to be settled later; they are central to whether the technology could ever be used responsibly.

Critics also warn of a "moral hazard": the risk that the mere possibility of a technological fix will weaken the determination to cut emissions. Fossil fuel interests, they argue, could use the promise of geoengineering to justify delay. Supporters reply that there is little evidence that research reduces public support for cutting emissions. I think this concern should be taken seriously, but it is not in itself a reason to avoid research; ignorance is a poor basis for decisions that may one day be forced upon us.

Outdoor research has proved highly controversial. In 2024, a Harvard project that had planned to test equipment for releasing particles high in the atmosphere was cancelled after years of opposition, including objections from Indigenous groups in Sweden, where an early test flight had been proposed. Around the same time, a small experiment in California that sprayed salt particles from the deck of a retired aircraft carrier was halted by local officials. Meanwhile, a British government research agency announced funding for a programme that includes small, carefully controlled outdoor experiments, arguing that decisions about the technology should be based on evidence rather than speculation.

I believe this balance is broadly right. Research, conducted openly and subject to strict oversight, can help to establish whether solar geoengineering could reduce harm and what its risks would be. But research is not the same as deployment, and the conditions for responsible use, including effective international governance and a clear plan for ending any programme safely, are nowhere near being met. Above all, no form of sunlight reflection can substitute for the one measure that addresses the cause of the problem: reducing the emissions that are warming the planet.`,
      questions: [
        mcq(
          "Why does the writer mention the eruption of Mount Pinatubo?",
          [
            "to describe the dangers of volcanic eruptions",
            "to show that particles reflecting sunlight can lower temperatures",
            "to explain how sulphur dioxide is produced",
            "to criticise the work of climate scientists",
          ],
          "to show that particles reflecting sunlight can lower temperatures",
          "There, the gas formed a thin layer of tiny particles that reflected a small fraction of incoming sunlight back into space, and over the following year average global temperatures fell by roughly half a degree Celsius.",
          "The particles reflected sunlight and temperatures 'fell by roughly half a degree'.",
        ),
        mcq(
          "What is the writer's overall position, as stated in the first paragraph?",
          [
            "The idea should be rejected completely.",
            "Research is justified, but the case for using the technology is weak.",
            "The technology should be used as soon as possible.",
            "Only volcanoes can cool the planet effectively.",
          ],
          "Research is justified, but the case for using the technology is weak.",
          "I believe the idea deserves careful research, but the case for actually using it is far weaker than its advocates suggest.",
          "It 'deserves careful research', but the case for using it 'is far weaker'.",
        ),
        mcq(
          "According to supporters, why might solar geoengineering be needed?",
          [
            "It would remove carbon dioxide from the air.",
            "Emissions are not being reduced quickly enough.",
            "It is cheaper than building sea walls.",
            "Volcanic eruptions happen too rarely.",
          ],
          "Emissions are not being reduced quickly enough.",
          "Emissions are falling too slowly to prevent dangerous warming, and even if they stopped tomorrow, temperatures would remain high for centuries, because carbon dioxide persists in the atmosphere.",
          "'Emissions are falling too slowly to prevent dangerous warming.' A is wrong — it does not remove carbon dioxide.",
        ),
        mcq(
          "What is 'termination shock'?",
          [
            "the sudden cooling caused by a volcanic eruption",
            "a rapid return of warming if a programme were stopped suddenly",
            "the political conflict caused by starting a programme",
            "damage to aircraft that release particles",
          ],
          "a rapid return of warming if a programme were stopped suddenly",
          "Perhaps most worrying is the problem known as termination shock: if a programme were started and then suddenly stopped, perhaps because of war or political upheaval, the warming it had concealed would return within a few years, far faster than societies and ecosystems could adapt.",
          "If a programme stopped suddenly, 'the warming it had concealed would return within a few years'.",
        ),
        mcq(
          "Why was the Harvard project cancelled?",
          [
            "It ran out of money.",
            "It faced years of opposition.",
            "Its equipment failed during testing.",
            "The British government objected to it.",
          ],
          "It faced years of opposition.",
          "In 2024, a Harvard project that had planned to test equipment for releasing particles high in the atmosphere was cancelled after years of opposition, including objections from Indigenous groups in Sweden, where an early test flight had been proposed.",
          "It 'was cancelled after years of opposition'.",
        ),
        ynng(
          "Brightening clouds would be more effective than releasing particles high in the atmosphere.",
          "NOT GIVEN",
          "",
          "Both methods are described, but the writer never compares how effective they are.",
        ),
        ynng(
          "Questions about who controls the technology can be dealt with once it is ready.",
          "NO",
          "In my view, these questions are not details to be settled later; they are central to whether the technology could ever be used responsibly.",
          "These questions are 'not details to be settled later'.",
        ),
        ynng(
          "The risk of moral hazard is a sufficient reason to stop all research.",
          "NO",
          "I think this concern should be taken seriously, but it is not in itself a reason to avoid research; ignorance is a poor basis for decisions that may one day be forced upon us.",
          "The concern 'is not in itself a reason to avoid research'.",
        ),
        ynng(
          "The approach of the British research programme is broadly sensible.",
          "YES",
          "I believe this balance is broadly right.",
          "The writer believes 'this balance is broadly right'.",
        ),
        ynng(
          "Cutting emissions is the only measure that deals with the cause of warming.",
          "YES",
          "Above all, no form of sunlight reflection can substitute for the one measure that addresses the cause of the problem: reducing the emissions that are warming the planet.",
          "Reducing emissions is 'the one measure that addresses the cause of the problem'.",
        ),
        fromList(
          "summary_completion",
          SUNLIGHT_BANK,
          "Aircraft would release particles at a height of around twenty ______.",
          "kilometres",
          "The best-known version of this approach, known as stratospheric aerosol injection, would involve aircraft releasing particles, probably sulphur compounds, at altitudes of around twenty kilometres.",
          "Particles would be released 'at altitudes of around twenty kilometres'.",
        ),
        fromList(
          "summary_completion",
          SUNLIGHT_BANK,
          "Low clouds could be made brighter by spraying fine droplets of ______ into them.",
          "seawater",
          "Other proposals include brightening low clouds over the oceans by spraying fine droplets of seawater into them, which would cause the clouds to reflect more sunlight.",
          "The droplets would be 'fine droplets of seawater'.",
        ),
        fromList(
          "summary_completion",
          SUNLIGHT_BANK,
          "Changes in rainfall could weaken the ______ that billions of people rely on.",
          "monsoons",
          "Models suggest that it could alter rainfall patterns, potentially weakening the monsoons on which billions of people depend, although the extent of these effects is uncertain.",
          "It could weaken 'the monsoons on which billions of people depend'.",
        ),
        fromList(
          "summary_completion",
          SUNLIGHT_BANK,
          "Sulphur particles might slow the recovery of the ______ layer.",
          "ozone",
          "Sulphur particles could also delay the recovery of the ozone layer.",
          "They 'could also delay the recovery of the ozone layer'.",
        ),
      ],
    },
  ],
};
