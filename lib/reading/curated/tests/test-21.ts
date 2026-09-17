import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, choose TWO ---------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const COST_STEM = "Which TWO points about the cost of wildlife crossings are made in the passage?";
const COSTS = [
  "Some people doubt whether the expense is justified.",
  "Crossings cost less to build than fences.",
  "Over time, the cost of collisions can exceed the cost of a crossing.",
  "Governments pay the full cost of every crossing.",
  "Building costs have fallen sharply in recent years.",
];

// ---- Passage 3 · writer's views · sentence endings ---------------------------

const ENDINGS = [
  "are often inconsistent when the questionnaire is repeated.",
  "tends to help almost all learners.",
  "have strong evidence behind them.",
  "may lead them to avoid certain activities.",
  "are always based on brain scans.",
  "was first suggested in the 1990s.",
  "should be tested on every student.",
];

export const TEST_21: CuratedTest = {
  key: "full-test-21",
  targetBand: 7,
  passages: [
    {
      key: "t21-p1-antikythera",
      title: "The Oldest Computer in the World",
      topic: "how scientists uncovered the secrets of an ancient Greek machine",
      difficulty: 6,
      body: `In 1900, a group of sponge divers sheltering from a storm near the small Greek island of Antikythera discovered the wreck of an ancient ship on the sea floor, about 45 metres below the surface. Over the following months, divers recovered bronze and marble statues, glassware, jewellery and coins from the wreck, which is now thought to have sunk in the first century BCE. Among the objects brought to the surface was a shapeless lump of corroded bronze and wood, about the size of a shoebox. At first it attracted little attention. It would later be recognised as one of the most extraordinary objects ever found from the ancient world.

In 1902, while examining the finds at the National Archaeological Museum in Athens, an archaeologist noticed that the lump had split apart, revealing a gearwheel inside. Several scholars suggested that the object might be some kind of astronomical instrument, but others doubted that the ancient Greeks could have built anything so complex. Many believed that it must be a later object that had somehow ended up at the wreck site. For decades, the mechanism remained a puzzle.

The first major breakthrough came from the British historian of science Derek de Solla Price, who studied the fragments from the 1950s onwards. Using X-ray images, he identified many of the gears and argued that the device was a mechanical calculator that modelled the movements of the Sun and Moon. His conclusions, published in 1974, were remarkable, but many details remained uncertain, because much of the mechanism was hidden inside the corroded fragments.

In 2005, an international team used advanced imaging technology to examine the 82 surviving fragments in far greater detail. A powerful X-ray scanner revealed the internal gears in three dimensions, while special photography made it possible to read thousands of tiny letters inscribed on the surfaces, many of which had been invisible for two thousand years. The inscriptions turned out to be a kind of user's guide, explaining what the device displayed and how its dials should be read.

The research showed that the mechanism was a sophisticated device for predicting astronomical events. By turning a handle on its side, the user could move a set of pointers to show the positions of the Sun and Moon in the sky, as well as the phase of the Moon. The mechanism could also predict eclipses of the Sun and Moon many years in advance. One of its dials even tracked the four-year cycle of the ancient Olympic Games and other athletic competitions. At least thirty interlocking bronze gears survive, some with teeth only about a millimetre and a half long.

One of the most ingenious features is the way the mechanism reproduces the changing speed of the Moon. Because the Moon's orbit is not a perfect circle, the Moon appears to move faster across the sky at some times than at others. The mechanism's designers modelled this using two gears mounted slightly off-centre, one of which drives the other through a pin moving in a slot. This arrangement produces the necessary variation in speed, demonstrating a remarkable understanding of both astronomy and engineering.

In 2021, researchers at University College London published a new reconstruction showing how the front of the device may have displayed the movements of all five planets known in ancient times. Many of the parts that would have been needed have not survived, so the reconstruction relies partly on the inscriptions and on calculations of how the gears must have worked. The team hopes to build a working copy using methods that would have been available to ancient craftsmen, in order to show that such a device could genuinely have been made at the time.

Nothing of comparable complexity is known from the ancient world, and similar geared devices do not appear in the historical record for more than a thousand years afterwards. Who built the mechanism, and why, remain uncertain. Some scholars link it to the Greek island of Rhodes, which was a centre of astronomy, while others suggest a connection with the city of Corinth or its colonies. Whatever its origins, the mechanism has transformed modern ideas about the technological abilities of the ancient Greeks. It is often described as the world's oldest known analogue computer.`,
      questions: [
        tfng(
          "The divers who found the wreck had been searching for ancient treasure.",
          "FALSE",
          "In 1900, a group of sponge divers sheltering from a storm near the small Greek island of Antikythera discovered the wreck of an ancient ship on the sea floor, about 45 metres below the surface.",
          "They were sponge divers 'sheltering from a storm', not treasure hunters.",
        ),
        tfng(
          "The mechanism attracted a great deal of interest as soon as it was found.",
          "FALSE",
          "At first it attracted little attention.",
          "'At first it attracted little attention.'",
        ),
        tfng(
          "Some scholars thought the mechanism had been made later than the date of the shipwreck.",
          "TRUE",
          "Many believed that it must be a later object that had somehow ended up at the wreck site.",
          "Many believed it was 'a later object' that ended up at the site.",
        ),
        tfng(
          "The inscriptions explained how to read the mechanism's displays.",
          "TRUE",
          "The inscriptions turned out to be a kind of user's guide, explaining what the device displayed and how its dials should be read.",
          "They explained 'how its dials should be read'.",
        ),
        tfng(
          "The mechanism was originally kept in a temple.",
          "NOT GIVEN",
          "",
          "Where the mechanism was kept before the ship sank is never mentioned.",
        ),
        tfng(
          "The UCL team has already built a working copy of the mechanism.",
          "FALSE",
          "The team hopes to build a working copy using methods that would have been available to ancient craftsmen, in order to show that such a device could genuinely have been made at the time.",
          "The team only 'hopes to build a working copy'.",
        ),
        tfng(
          "Rhodes had more astronomers than any other Greek city.",
          "NOT GIVEN",
          "",
          "Rhodes is called 'a centre of astronomy', but it is not compared with other cities.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The wreck lay about 45 metres below the ______.",
          "surface",
          "In 1900, a group of sponge divers sheltering from a storm near the small Greek island of Antikythera discovered the wreck of an ancient ship on the sea floor, about 45 metres below the surface.",
          "It was 'about 45 metres below the surface'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The lump of bronze and wood was roughly as big as a ______.",
          "shoebox",
          "Among the objects brought to the surface was a shapeless lump of corroded bronze and wood, about the size of a shoebox.",
          "It was 'about the size of a shoebox'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Price argued that the device was a mechanical ______.",
          "calculator",
          "Using X-ray images, he identified many of the gears and argued that the device was a mechanical calculator that modelled the movements of the Sun and Moon.",
          "Price called it 'a mechanical calculator'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "One dial followed the four-year cycle of the ancient ______ and other competitions.",
          "Olympic Games",
          "One of its dials even tracked the four-year cycle of the ancient Olympic Games and other athletic competitions.",
          "A dial 'tracked the four-year cycle of the ancient Olympic Games'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The Moon's speed changes because its orbit is not a perfect ______.",
          "circle",
          "Because the Moon's orbit is not a perfect circle, the Moon appears to move faster across the sky at some times than at others.",
          "The orbit 'is not a perfect circle'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some scholars connect the mechanism with the island of ______.",
          "Rhodes",
          "Some scholars link it to the Greek island of Rhodes, which was a centre of astronomy, while others suggest a connection with the city of Corinth or its colonies.",
          "Some 'link it to the Greek island of Rhodes'.",
        ),
      ],
    },
    {
      key: "t21-p2-wildlife-crossings",
      title: "Bridges Built for Animals",
      topic: "how wildlife crossings help animals get safely across roads",
      difficulty: 7,
      body: `A) Roads are among the most damaging structures humans have built for wildlife. Every year, vast numbers of animals are killed by vehicles; in the United States alone, collisions between vehicles and large animals such as deer are estimated to cause around 200 human deaths and billions of dollars of damage. Beyond these direct deaths, busy roads divide habitats into isolated fragments, preventing animals from reaching food, water and mates. Over time, populations trapped in small areas can be weakened by inbreeding, and they become more likely to disappear altogether. Smaller animals, such as frogs and salamanders, are especially at risk, because they move slowly and are hard for drivers to see.

B) One solution is to give animals their own way across. Wildlife crossings, which include bridges covered with soil and plants, as well as tunnels and culverts beneath roads, have been built in many countries since the mid-twentieth century. The Netherlands has been particularly active: the country has built more than 600 crossings, including one of the longest in the world, which stretches for about 800 metres over a railway, a road and a sports ground. France and Germany were also among the first countries to experiment with such structures. Many smaller Dutch tunnels were built for badgers, whose numbers had fallen sharply during the twentieth century.

C) Some of the most thoroughly studied crossings are in Banff National Park in Canada, where the busy Trans-Canada Highway passes through the Rocky Mountains. Since the 1990s, more than 40 crossings have been built there, together with fences that guide animals towards them. Cameras have recorded well over 100,000 crossings by animals ranging from deer and elk to bears, wolves and cougars. Collisions between vehicles and large animals on the fenced sections of the highway have fallen by more than 80 per cent.

D) Research at Banff has also revealed that different species prefer different types of crossing. Grizzly bears, wolves and elk tend to use wide, open bridges, while black bears and cougars are more willing to use narrower tunnels. Some animals also need time to learn to use a new structure: at Banff, it took several years before some large predators crossed regularly. Researchers concluded that a network of different crossing types, rather than a single design, gives the best results. Planting native vegetation on the bridges also helps, because animals are more likely to use a crossing that looks like their natural habitat.

E) The largest crossing of its kind is now being completed in southern California. The Wallis Annenberg Wildlife Crossing spans ten lanes of a highway near Los Angeles, one of the busiest roads in the United States. It was inspired partly by the story of a mountain lion known as P-22, which became famous after crossing two major highways to reach a park in the middle of the city, where he lived for about ten years. The local mountain lion population has become so isolated by roads that scientists have warned it could disappear within decades. The crossing was originally due to open earlier, but it was delayed by two springs of record rainfall and is now scheduled to open in December 2026.

F) Crossings are expensive, however. A large wildlife bridge can cost tens of millions of dollars, and the Californian project is expected to cost around 90 million dollars, much of it paid for by private donations. Critics sometimes question whether such sums are justified for the benefit of animals. Supporters respond that the costs of collisions, including human injuries, vehicle damage and emergency services, can exceed the cost of building a crossing within a few decades, particularly on busy roads in areas with many large animals.

G) Wildlife crossings are increasingly seen as part of a broader approach to conservation known as connectivity, which aims to link protected areas so that animals can move freely between them. This is expected to become more important as climate change forces many species to move in search of suitable conditions. In 2021, the United States set aside 350 million dollars for wildlife crossings as part of a major law on roads and other infrastructure, the first national programme of its kind in the country. Other countries are developing similar schemes, and engineers are experimenting with cheaper designs that could make crossings far more common. For many conservationists, these projects show that roads and wildlife do not have to be enemies.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the danger that isolated animal populations will die out",
          "A",
          "Over time, populations trapped in small areas can be weakened by inbreeding, and they become more likely to disappear altogether.",
          "Paragraph A: trapped populations 'become more likely to disappear altogether'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a crossing that passes over several different structures",
          "B",
          "The Netherlands has been particularly active: the country has built more than 600 crossings, including one of the longest in the world, which stretches for about 800 metres over a railway, a road and a sports ground.",
          "Paragraph B: one crossing runs 'over a railway, a road and a sports ground'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "evidence that crossings reduce accidents",
          "C",
          "Collisions between vehicles and large animals on the fenced sections of the highway have fallen by more than 80 per cent.",
          "Paragraph C: collisions 'have fallen by more than 80 per cent'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a difference between the kinds of crossing that particular species use",
          "D",
          "Grizzly bears, wolves and elk tend to use wide, open bridges, while black bears and cougars are more willing to use narrower tunnels.",
          "Paragraph D compares species that use bridges with those that use tunnels.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the story of an individual animal that helped to inspire a project",
          "E",
          "It was inspired partly by the story of a mountain lion known as P-22, which became famous after crossing two major highways to reach a park in the middle of the city, where he lived for about ten years.",
          "Paragraph E: the crossing was 'inspired partly by the story of a mountain lion known as P-22'.",
        ),
        pickTwo(
          COST_STEM,
          COSTS,
          "A or C",
          "Critics sometimes question whether such sums are justified for the benefit of animals.",
          "A is correct: critics 'question whether such sums are justified'. D is wrong — much of the Californian cost comes from private donations.",
        ),
        pickTwo(
          COST_STEM,
          COSTS,
          "A or C",
          "Supporters respond that the costs of collisions, including human injuries, vehicle damage and emergency services, can exceed the cost of building a crossing within a few decades, particularly on busy roads in areas with many large animals.",
          "C is correct: collision costs 'can exceed the cost of building a crossing within a few decades'. B and E are not stated.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Busy roads break habitats up into isolated ______.",
          "fragments",
          "Beyond these direct deaths, busy roads divide habitats into isolated fragments, preventing animals from reaching food, water and mates.",
          "Roads 'divide habitats into isolated fragments'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "As well as bridges, crossings include tunnels and ______ under roads.",
          "culverts",
          "Wildlife crossings, which include bridges covered with soil and plants, as well as tunnels and culverts beneath roads, have been built in many countries since the mid-twentieth century.",
          "Crossings include 'tunnels and culverts beneath roads'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "At Banff, ______ lead animals towards the crossings.",
          "fences",
          "Since the 1990s, more than 40 crossings have been built there, together with fences that guide animals towards them.",
          "'Fences that guide animals towards them' were built too.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some large predators needed several ______ before they crossed regularly.",
          "years",
          "Some animals also need time to learn to use a new structure: at Banff, it took several years before some large predators crossed regularly.",
          "'It took several years before some large predators crossed regularly.'",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Much of the cost of the Californian crossing is being met by ______.",
          "private donations",
          "A large wildlife bridge can cost tens of millions of dollars, and the Californian project is expected to cost around 90 million dollars, much of it paid for by private donations.",
          "Much of it is 'paid for by private donations'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Linking protected areas so that animals can move between them is known as ______.",
          "connectivity",
          "Wildlife crossings are increasingly seen as part of a broader approach to conservation known as connectivity, which aims to link protected areas so that animals can move freely between them.",
          "The approach is 'known as connectivity'.",
        ),
      ],
    },
    {
      key: "t21-p3-learning-styles",
      title: "The Learning Styles Myth",
      topic: "why the popular idea of learning styles lacks scientific support",
      difficulty: 8,
      body: `Ask a group of teachers whether students learn better when lessons match their preferred "learning style", and most will say yes. The idea that individuals are "visual", "auditory" or "kinaesthetic" learners, who learn best through pictures, sound or physical activity respectively, is among the most widely held beliefs in education. Surveys in several countries have found that more than 90 per cent of teachers accept it, and it has shaped training courses, classroom materials and even school inspections. Yet the evidence that teaching to learning styles improves learning is remarkably weak. In my view, it is time for the idea to be abandoned.

The appeal of the theory is easy to understand. People clearly differ in their interests and abilities, and most of us have a sense that we prefer some ways of receiving information to others. The notion that education should respect these differences is attractive, both to teachers who want to help every pupil and to learners who struggle. Dozens of learning style models have been proposed since the 1970s, many of them accompanied by questionnaires that claim to identify an individual's style.

The problem is that when researchers have tested the central claim of these models, the "meshing hypothesis", which holds that learners perform better when teaching matches their style, they have repeatedly failed to find support for it. In a typical experiment, participants are first classified according to their preferred style and then taught using materials presented in different ways. If the theory were correct, visual learners should perform best with visual materials and auditory learners with spoken ones. Study after study has found no such pattern.

Even the claim that people have stable learning styles is questionable. When the same individuals complete learning style questionnaires on different occasions, their results are often inconsistent. Moreover, a person's stated preference does not necessarily reflect how they actually learn. In one study of university students, researchers found that most did not use study methods matching their supposed learning style, and those who did achieved no better results than those who did not. Preferences, it seems, are just that: preferences, not reliable guides to effective learning.

What, then, does research suggest actually helps? One consistent finding is that the best way to present information depends far more on the content than on the learner. Geography is best learned with maps, music with sound and practical skills with hands-on practice, whatever a learner's supposed style. Another is that combining words with relevant images tends to help almost everyone, a finding confirmed in many experiments on learning with multimedia. Strategies such as testing oneself rather than simply rereading notes, and spacing study sessions over time, also have strong evidence behind them.

Defenders of learning styles sometimes argue that, even if the theory is not strictly correct, it does little harm and encourages teachers to vary their methods. I have some sympathy with the second point: variety in teaching is often valuable. But I cannot accept that the theory is harmless. Labelling a child as a particular type of learner may lead them to avoid activities they believe do not suit them, limiting their development. The time and money spent on assessing styles and preparing matching materials could also be used more productively.

The persistence of the myth raises a wider question about how educational ideas spread. Many teachers encounter learning styles during their training, often presented as established fact, and the concept is reinforced by commercial products and by its intuitive appeal. Researchers have described learning styles as one of a number of "neuromyths", popular beliefs about the brain that lack scientific support. Others include the idea that people use only ten per cent of their brains, and the claim that some people are "left-brained" while others are "right-brained".

None of this means that differences between learners are unimportant. Students vary in their prior knowledge, their motivation and their specific needs, and good teaching takes account of these. The lesson of the learning styles debate is not that teachers should ignore individual differences, but that they should rely on those differences that research has shown to matter. Replacing a popular myth with practice based on evidence is not easy, but it is what students deserve.`,
      questions: [
        mcq(
          "What does the writer say about how many teachers believe in learning styles?",
          [
            "The number is falling rapidly.",
            "The great majority of teachers accept the idea.",
            "Only teachers in training accept it.",
            "It is more popular with parents than with teachers.",
          ],
          "The great majority of teachers accept the idea.",
          "Surveys in several countries have found that more than 90 per cent of teachers accept it, and it has shaped training courses, classroom materials and even school inspections.",
          "'More than 90 per cent of teachers accept it'.",
        ),
        mcq(
          "What is the 'meshing hypothesis'?",
          [
            "the idea that learners do better when teaching matches their style",
            "the idea that all learners share the same style",
            "a method for identifying a person's learning style",
            "the claim that learning styles change with age",
          ],
          "the idea that learners do better when teaching matches their style",
          'The problem is that when researchers have tested the central claim of these models, the "meshing hypothesis", which holds that learners perform better when teaching matches their style, they have repeatedly failed to find support for it.',
          "It 'holds that learners perform better when teaching matches their style'.",
        ),
        mcq(
          "What did the study of university students find?",
          [
            "Most students studied according to their learning style.",
            "Students whose methods matched their style did no better than others.",
            "Visual learners achieved the best results overall.",
            "Students' preferences never changed.",
          ],
          "Students whose methods matched their style did no better than others.",
          "In one study of university students, researchers found that most did not use study methods matching their supposed learning style, and those who did achieved no better results than those who did not.",
          "Those who matched their style 'achieved no better results'. A is the opposite of the finding.",
        ),
        mcq(
          "According to the passage, what mainly decides the best way to present information?",
          [
            "the learner's preferred style",
            "the content that is being taught",
            "the age of the learner",
            "the experience of the teacher",
          ],
          "the content that is being taught",
          "One consistent finding is that the best way to present information depends far more on the content than on the learner.",
          "It 'depends far more on the content than on the learner'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "People's results on learning style questionnaires",
          "are often inconsistent when the questionnaire is repeated.",
          "When the same individuals complete learning style questionnaires on different occasions, their results are often inconsistent.",
          "Results on different occasions 'are often inconsistent'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Combining words with relevant images",
          "tends to help almost all learners.",
          "Another is that combining words with relevant images tends to help almost everyone, a finding confirmed in many experiments on learning with multimedia.",
          "It 'tends to help almost everyone'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Testing yourself and spreading out study sessions",
          "have strong evidence behind them.",
          "Strategies such as testing oneself rather than simply rereading notes, and spacing study sessions over time, also have strong evidence behind them.",
          "These strategies 'have strong evidence behind them'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Labelling children as a particular kind of learner",
          "may lead them to avoid certain activities.",
          "Labelling a child as a particular type of learner may lead them to avoid activities they believe do not suit them, limiting their development.",
          "It 'may lead them to avoid activities they believe do not suit them'.",
        ),
        ynng(
          "Teachers should stop using the idea of learning styles.",
          "YES",
          "In my view, it is time for the idea to be abandoned.",
          "The writer says 'it is time for the idea to be abandoned'.",
        ),
        ynng(
          "It is easy to see why the idea of learning styles became popular.",
          "YES",
          "The appeal of the theory is easy to understand.",
          "'The appeal of the theory is easy to understand.'",
        ),
        ynng(
          "Using a variety of teaching methods can be worthwhile.",
          "YES",
          "I have some sympathy with the second point: variety in teaching is often valuable.",
          "'Variety in teaching is often valuable.'",
        ),
        ynng(
          "Teaching according to learning styles does no harm.",
          "NO",
          "But I cannot accept that the theory is harmless.",
          "The writer 'cannot accept that the theory is harmless'.",
        ),
        ynng(
          "Learning styles are more popular in primary schools than in universities.",
          "NOT GIVEN",
          "",
          "The writer never compares primary schools and universities.",
        ),
        ynng(
          "Teachers should ignore the differences between their students.",
          "NO",
          "The lesson of the learning styles debate is not that teachers should ignore individual differences, but that they should rely on those differences that research has shown to matter.",
          "The lesson is 'not that teachers should ignore individual differences'.",
        ),
      ],
    },
  ],
};
