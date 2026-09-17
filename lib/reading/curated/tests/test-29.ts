import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, choose TWO ---------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CRITICISM_STEM =
  "Which TWO criticisms of the fifteen-minute city are mentioned in paragraph F?";
const CRITICISMS = [
  "It is difficult to apply in suburbs.",
  "It increases air pollution in city centres.",
  "It may make neighbourhoods too expensive for poorer residents.",
  "It requires too many new cycle lanes.",
  "It was invented by politicians rather than planners.",
];

// ---- Passage 3 · writer's views · sentence endings ---------------------------

const ENDINGS = [
  "are more likely to share with bats that have shared with them before.",
  "never betrays first but responds to betrayal at once.",
  "can start an endless cycle of revenge.",
  "contribute more when others can see what they do.",
  "always lose in repeated games.",
  "were first described by Darwin.",
  "help only their closest relatives.",
];

export const TEST_29: CuratedTest = {
  key: "full-test-29",
  targetBand: 8,
  passages: [
    {
      key: "t29-p1-axolotl",
      title: "The Animal That Regrows Itself",
      topic: "the axolotl's remarkable ability to regenerate and its fight for survival",
      difficulty: 7,
      body: `In the canals of Xochimilco, on the southern edge of Mexico City, lives one of the most unusual animals on Earth. The axolotl is a type of salamander, a relative of frogs and newts, but unlike most of its relatives, it never undergoes the transformation that would allow it to live on land. Instead, it remains in the water throughout its life, keeping the feathery external gills and flattened tail of a juvenile, even after it becomes able to reproduce. This condition, in which adult animals keep youthful features, is known as neoteny.

The axolotl has long held a special place in Mexican culture. Its name comes from the language of the Aztecs and is often linked to Xolotl, a god associated with fire and lightning who, according to one legend, turned himself into an axolotl to avoid being sacrificed. The animals were also once an important source of food for people living around the lakes of the Valley of Mexico. Today, axolotls appear in art and on clothing, and since 2021 one has appeared on the country's 50-peso banknote.

Scientists, however, are most interested in the axolotl for a different reason: its extraordinary ability to regenerate. If an axolotl loses a leg, it can grow a complete new one, with bones, muscles, nerves and skin in the correct arrangement, within a few weeks. It can also regrow parts of its tail, including the spinal cord, and repair damage to its heart, its eyes and even parts of its brain. Remarkably, the regrown tissues usually show no scarring, and the process can be repeated many times.

When an axolotl loses a limb, cells near the wound change their behaviour. Some of them lose their specialised characteristics and return to a more flexible state, from which they can develop into different types of tissue. These cells gather at the site of the injury to form a structure called a blastema, which then grows and develops into the new limb. Researchers have found that the cells seem to "remember" where they came from, so that a leg cut at the elbow regrows only the missing lower part, rather than an entire new leg.

Understanding how this memory works has been one of the central goals of research on regeneration. In 2025, a team of scientists reported that a chemical signal related to vitamin A plays a key role, with different levels along the limb telling cells how much needs to be rebuilt. By altering the level of this signal, the researchers were able to make cells behave as if they came from a different part of the limb. Such discoveries could eventually help scientists to understand why humans, who can regenerate only a few tissues, such as the liver, have lost this ability in most parts of the body.

The axolotl's genome, which was fully decoded in 2018, is one of the largest of any animal, roughly ten times the size of the human genome. Its size made it extremely difficult to analyse, and scientists needed new computer methods to assemble it. Having the complete sequence has allowed researchers to identify genes that are active during regeneration, some of which also exist in humans but behave differently.

Ironically, while axolotls thrive in laboratories and pet shops around the world, they are critically endangered in the wild. Surveys of the canals of Xochimilco have found a dramatic decline: estimates suggest that the number of axolotls fell from around 6,000 per square kilometre in the late 1990s to fewer than 40 in 2014. The main causes are pollution, the growth of Mexico City, which has drained much of the lake system, and the introduction of fish from other regions, such as carp and tilapia, which eat young axolotls and compete with them for food.

Conservationists are working to protect the remaining wild population. One approach involves working with local farmers who cultivate the traditional floating gardens of Xochimilco, known as chinampas. Farmers who agree to avoid chemicals and to filter the water flowing through their fields create safe areas where axolotls can survive. Some scientists argue that the axolotl's situation should serve as a warning: an animal that has taught us so much about healing could disappear from its only natural home.`,
      questions: [
        tfng(
          "Axolotls eventually leave the water to live on land.",
          "FALSE",
          "Instead, it remains in the water throughout its life, keeping the feathery external gills and flattened tail of a juvenile, even after it becomes able to reproduce.",
          "It 'remains in the water throughout its life'.",
        ),
        tfng(
          "An axolotl is shown on one of Mexico's banknotes.",
          "TRUE",
          "Today, axolotls appear in art and on clothing, and since 2021 one has appeared on the country's 50-peso banknote.",
          "One 'has appeared on the country's 50-peso banknote'.",
        ),
        tfng(
          "A regrown axolotl leg is weaker than the original one.",
          "NOT GIVEN",
          "",
          "Regrown legs are said to be complete and unscarred, but their strength is not compared with the original.",
        ),
        tfng(
          "A leg cut at the elbow grows back as an entire new leg.",
          "FALSE",
          'Researchers have found that the cells seem to "remember" where they came from, so that a leg cut at the elbow regrows only the missing lower part, rather than an entire new leg.',
          "It regrows 'only the missing lower part'.",
        ),
        tfng(
          "The axolotl genome is smaller than the human genome.",
          "FALSE",
          "The axolotl's genome, which was fully decoded in 2018, is one of the largest of any animal, roughly ten times the size of the human genome.",
          "It is 'roughly ten times the size of the human genome'.",
        ),
        tfng(
          "Tilapia were brought to Xochimilco to control insects.",
          "NOT GIVEN",
          "",
          "Tilapia are named as introduced fish, but the reason for introducing them is not given.",
        ),
        tfng(
          "Some farmers in Xochimilco help to protect axolotls.",
          "TRUE",
          "Farmers who agree to avoid chemicals and to filter the water flowing through their fields create safe areas where axolotls can survive.",
          "Such farmers 'create safe areas where axolotls can survive'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Adult axolotls keep the feathery external ______ of a young animal.",
          "gills",
          "Instead, it remains in the water throughout its life, keeping the feathery external gills and flattened tail of a juvenile, even after it becomes able to reproduce.",
          "They keep 'the feathery external gills'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The condition in which adults keep youthful features is called ______.",
          "neoteny",
          "This condition, in which adult animals keep youthful features, is known as neoteny.",
          "It 'is known as neoteny'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In one legend, the god Xolotl became an axolotl so that he would not be ______.",
          "sacrificed",
          "Its name comes from the language of the Aztecs and is often linked to Xolotl, a god associated with fire and lightning who, according to one legend, turned himself into an axolotl to avoid being sacrificed.",
          "He did so 'to avoid being sacrificed'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Tissues that grow back usually show no ______.",
          "scarring",
          "Remarkably, the regrown tissues usually show no scarring, and the process can be repeated many times.",
          "They 'usually show no scarring'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Cells gather at the injury to form a structure called a ______.",
          "blastema",
          "These cells gather at the site of the injury to form a structure called a blastema, which then grows and develops into the new limb.",
          "They form 'a structure called a blastema'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The traditional floating gardens of Xochimilco are called ______.",
          "chinampas",
          "One approach involves working with local farmers who cultivate the traditional floating gardens of Xochimilco, known as chinampas.",
          "They are 'known as chinampas'.",
        ),
      ],
    },
    {
      key: "t29-p2-fifteen-minute-city",
      title: "The Fifteen-Minute City",
      topic: "the idea of neighbourhoods where daily needs are close at hand",
      difficulty: 8,
      body: `A) Imagine being able to reach your workplace, school, doctor, shops and a park within a quarter of an hour's walk or cycle ride from home. This is the central idea of the "fifteen-minute city", a planning concept that has attracted enormous attention over the past decade. The term was popularised by Carlos Moreno, a professor at a university in Paris, who argued in 2016 that cities should be organised around the daily needs of residents rather than around the car. In his vision, each neighbourhood would provide six essential functions close to home: living, working, shopping, health care, education and leisure.

B) The idea draws on older traditions in urban planning. In the early twentieth century, planners in the United States developed the concept of the "neighbourhood unit", in which homes were grouped around a primary school and local shops within walking distance. Many historic European towns, built before the arrival of the car, already function in a similar way. What was new about Moreno's proposal was its explicit link to climate change and public health: by reducing the need to travel by car, supporters argued, compact neighbourhoods could lower emissions, reduce air pollution and encourage people to be more physically active. Local shops and services, they added, could also strengthen the sense of community.

C) The concept gained international attention in 2020, when the mayor of Paris, Anne Hidalgo, made it a central theme of her campaign for re-election. Her administration has since expanded the city's cycle lanes, turned some streets near schools into car-free areas and opened school playgrounds to the public outside school hours. Other cities, including Melbourne in Australia and Barcelona in Spain, have pursued related policies. The COVID-19 pandemic added to the idea's appeal, as lockdowns forced millions of people to spend more time in their immediate neighbourhoods and highlighted the value of local services and green spaces.

D) Barcelona's "superblocks" offer one well-known model. In these schemes, groups of nine city blocks are combined into a single unit, and traffic is largely restricted to the roads around its edges. The streets inside are converted into spaces for walking, play and planting. A study published in 2020 estimated that, if the scheme were extended across the whole city, it could prevent several hundred early deaths each year, mainly by reducing air pollution, noise and heat. However, the programme has also faced criticism from some residents on the edges of the superblocks, who complain that traffic has simply been pushed onto their streets.

E) The fifteen-minute city has also become the target of an unexpected backlash. In 2023, plans in the English city of Oxford to introduce traffic filters, which restrict car access to certain roads at particular times, became linked in online discussions with the fifteen-minute city idea. False claims spread that residents would be confined to their neighbourhoods and fined for leaving them. Thousands of people joined protests, and some local politicians received threats. Moreno himself reported receiving abusive messages. Urban planners have since argued that the controversy shows the importance of explaining proposals clearly and involving residents from the beginning. Many of those who protested said they felt that decisions about their streets had been made without them.

F) Critics have also raised more measured objections. Some argue that the model works best in dense, wealthy city centres and is difficult to apply in suburbs, where homes are spread out and jobs are concentrated elsewhere. Others warn that improving local services can make neighbourhoods more attractive and therefore more expensive, forcing out the lower-income residents who were supposed to benefit. And for many workers, particularly those in factories, hospitals or other jobs that cannot be done from home, the workplace is unlikely to be within fifteen minutes of where they live.

G) Supporters accept some of these points but argue that the concept should be seen as a direction rather than a strict rule. The exact number of minutes, they say, matters less than the principle of reducing unnecessary travel and making everyday life easier without a car. Many cities are now adapting the idea to their own circumstances, with some aiming for twenty or thirty minutes instead. Whether the concept transforms cities or remains a slogan will depend largely on whether it can deliver visible improvements for ordinary residents while winning their trust. That, in the end, may prove harder than redesigning any street.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a list of the functions a neighbourhood should provide",
          "A",
          "In his vision, each neighbourhood would provide six essential functions close to home: living, working, shopping, health care, education and leisure.",
          "Paragraph A lists 'six essential functions'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an earlier planning idea centred on a school",
          "B",
          'In the early twentieth century, planners in the United States developed the concept of the "neighbourhood unit", in which homes were grouped around a primary school and local shops within walking distance.',
          "Paragraph B: the 'neighbourhood unit' grouped homes 'around a primary school'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the opening of school facilities to other members of the public",
          "C",
          "Her administration has since expanded the city's cycle lanes, turned some streets near schools into car-free areas and opened school playgrounds to the public outside school hours.",
          "Paragraph C: Paris 'opened school playgrounds to the public'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a complaint from people living on the edge of a scheme",
          "D",
          "However, the programme has also faced criticism from some residents on the edges of the superblocks, who complain that traffic has simply been pushed onto their streets.",
          "Paragraph D: residents on the edges say traffic 'has simply been pushed onto their streets'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "untrue claims about limits on where people could go",
          "E",
          "False claims spread that residents would be confined to their neighbourhoods and fined for leaving them.",
          "Paragraph E: 'false claims' that residents would be confined.",
        ),
        pickTwo(
          CRITICISM_STEM,
          CRITICISMS,
          "A or C",
          "Some argue that the model works best in dense, wealthy city centres and is difficult to apply in suburbs, where homes are spread out and jobs are concentrated elsewhere.",
          "A is correct: it 'is difficult to apply in suburbs'. B is the opposite of the passage's claims.",
        ),
        pickTwo(
          CRITICISM_STEM,
          CRITICISMS,
          "A or C",
          "Others warn that improving local services can make neighbourhoods more attractive and therefore more expensive, forcing out the lower-income residents who were supposed to benefit.",
          "C is correct: neighbourhoods may become 'more expensive, forcing out the lower-income residents'. D and E are not mentioned.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Moreno argued that cities should be planned around residents' needs rather than around the ______.",
          "car",
          "The term was popularised by Carlos Moreno, a professor at a university in Paris, who argued in 2016 that cities should be organised around the daily needs of residents rather than around the car.",
          "Cities should be organised 'rather than around the car'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Supporters said compact neighbourhoods could lower emissions and reduce ______.",
          "air pollution",
          "What was new about Moreno's proposal was its explicit link to climate change and public health: by reducing the need to travel by car, supporters argued, compact neighbourhoods could lower emissions, reduce air pollution and encourage people to be more physically active.",
          "They could 'lower emissions, reduce air pollution'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Paris made some streets near ______ free of cars.",
          "schools",
          "Her administration has since expanded the city's cycle lanes, turned some streets near schools into car-free areas and opened school playgrounds to the public outside school hours.",
          "Streets 'near schools' became car-free.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Each superblock combines ______ city blocks into a single unit.",
          "nine",
          "In these schemes, groups of nine city blocks are combined into a single unit, and traffic is largely restricted to the roads around its edges.",
          "'Groups of nine city blocks are combined'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Oxford planned to introduce traffic ______ on certain roads.",
          "filters",
          "In 2023, plans in the English city of Oxford to introduce traffic filters, which restrict car access to certain roads at particular times, became linked in online discussions with the fifteen-minute city idea.",
          "Oxford planned 'to introduce traffic filters'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some cities are aiming for twenty or ______ minutes instead of fifteen.",
          "thirty",
          "Many cities are now adapting the idea to their own circumstances, with some aiming for twenty or thirty minutes instead.",
          "Some aim 'for twenty or thirty minutes instead'.",
        ),
      ],
    },
    {
      key: "t29-p3-cooperation",
      title: "The Puzzle of Cooperation",
      topic: "how evolution can explain cooperation between animals and people",
      difficulty: 9,
      body: `Cooperation poses a deep puzzle for evolutionary theory. Natural selection, as Charles Darwin described it, favours individuals whose characteristics help them to survive and reproduce more successfully than others. On this view, an individual that helps others at a cost to itself would seem to be at a disadvantage, and any tendency towards such behaviour should gradually disappear. Yet cooperation is everywhere in nature, from worker ants that never reproduce to vampire bats that share blood with hungry companions. Explaining how such behaviour could evolve has occupied biologists for more than a century, and in my view the answers they have found are among the most illuminating in all of science.

One part of the answer was provided in the 1960s by the British biologist W. D. Hamilton. He showed that helping relatives can be favoured by natural selection, because relatives share many of the same genes. An animal that sacrifices itself to save several of its brothers and sisters may, in effect, help copies of its own genes to survive. This idea, known as kin selection, helps to explain many examples of cooperation among close relatives, including the extraordinary societies of ants and bees.

Kin selection, however, cannot explain cooperation between individuals who are not related. In 1971, the American biologist Robert Trivers proposed that such cooperation could evolve through reciprocity: an individual helps another in the expectation that the favour will be returned in the future. For this to work, individuals must interact repeatedly, recognise one another and remember how they have been treated. The vampire bats of Central and South America provide a striking example. Bats that fail to find food for two or three nights risk starving, and those that have fed successfully often bring up blood to share with hungry companions in their roost, including unrelated ones. Research has found that bats are more likely to share with individuals that have shared with them in the past.

The most famous investigation of reciprocity was conducted not in the wild but on computers. In 1980, the political scientist Robert Axelrod invited experts from several fields to submit strategies for a game known as the prisoner's dilemma, in which two players must each decide whether to cooperate with or betray the other. Betrayal pays best in any single round, but if both players betray each other, both do worse than if both had cooperated. Axelrod ran a tournament in which the strategies played against one another many times.

The winner was also the simplest strategy submitted. Known as tit for tat, it cooperated in the first round and then simply copied whatever the other player had done in the previous round. It was never the first to betray, it punished betrayal immediately, and it forgave as soon as the other player returned to cooperation. When Axelrod held a second tournament, in which entrants knew the results of the first, tit for tat won again. Its success suggested that cooperation could emerge among self-interested individuals, provided that they expected to meet again.

Later research showed that tit for tat has weaknesses. In a world where mistakes occur, a single accidental betrayal can trigger an endless cycle of revenge between two tit-for-tat players. More forgiving strategies, which occasionally ignore a betrayal, often perform better under such conditions. This finding strikes me as particularly important, because it suggests that some tolerance of others' mistakes is not merely a moral virtue but a practical necessity for lasting cooperation.

Humans cooperate on a scale that goes far beyond anything seen in other animals, frequently helping strangers they will never meet again. One explanation is indirect reciprocity: people help those who have a good reputation, and helping others improves one's own reputation. Language allows information about reputations to spread quickly through gossip, so that people can learn how someone has behaved towards others without having seen it themselves. Experiments have shown that people contribute more to shared projects when their behaviour is visible to others, and that they are willing to pay a cost to punish those who take advantage of the group.

None of these mechanisms fully explains human cooperation on its own, and researchers continue to debate their relative importance. What is clear is that cooperation is not simply the opposite of self-interest; it can arise from it, under the right conditions. I believe this insight has practical value. Institutions that allow people to interact repeatedly, to build reputations and to recognise and respond to unfair behaviour are more likely to sustain cooperation than those that rely on goodwill alone. Understanding the conditions that make cooperation possible may be as important for designing societies as it is for understanding nature.`,
      questions: [
        mcq(
          "Why is cooperation a puzzle for evolutionary theory?",
          [
            "Most animals live alone.",
            "Helping others at a cost to oneself appears to be a disadvantage.",
            "Darwin did not believe that cooperation existed.",
            "Cooperation is found only among insects.",
          ],
          "Helping others at a cost to oneself appears to be a disadvantage.",
          "On this view, an individual that helps others at a cost to itself would seem to be at a disadvantage, and any tendency towards such behaviour should gradually disappear.",
          "Such an individual 'would seem to be at a disadvantage'.",
        ),
        mcq(
          "What does kin selection help to explain?",
          [
            "cooperation between strangers",
            "cooperation among close relatives",
            "why animals compete for food",
            "how reputations are formed",
          ],
          "cooperation among close relatives",
          "This idea, known as kin selection, helps to explain many examples of cooperation among close relatives, including the extraordinary societies of ants and bees.",
          "It explains 'cooperation among close relatives'.",
        ),
        mcq(
          "According to Trivers, what is necessary for reciprocity to work?",
          [
            "The individuals must be closely related.",
            "The individuals must interact repeatedly.",
            "The individuals must live in very large groups.",
            "The individuals must share food every day.",
          ],
          "The individuals must interact repeatedly.",
          "For this to work, individuals must interact repeatedly, recognise one another and remember how they have been treated.",
          "'Individuals must interact repeatedly'. A is wrong — reciprocity explains cooperation between unrelated individuals.",
        ),
        mcq(
          "What was notable about the winner of Axelrod's first tournament?",
          [
            "It always betrayed first.",
            "It was the simplest strategy entered.",
            "It was designed by Axelrod himself.",
            "It never punished betrayal.",
          ],
          "It was the simplest strategy entered.",
          "The winner was also the simplest strategy submitted.",
          "'The winner was also the simplest strategy submitted.'",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Vampire bats that have found food",
          "are more likely to share with bats that have shared with them before.",
          "Research has found that bats are more likely to share with individuals that have shared with them in the past.",
          "Bats share more with 'individuals that have shared with them in the past'. G is wrong — they share with unrelated bats too.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "The tit-for-tat strategy",
          "never betrays first but responds to betrayal at once.",
          "It was never the first to betray, it punished betrayal immediately, and it forgave as soon as the other player returned to cooperation.",
          "It 'was never the first to betray' and 'punished betrayal immediately'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Between two tit-for-tat players, a single accidental betrayal",
          "can start an endless cycle of revenge.",
          "In a world where mistakes occur, a single accidental betrayal can trigger an endless cycle of revenge between two tit-for-tat players.",
          "It 'can trigger an endless cycle of revenge'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "In experiments, people",
          "contribute more when others can see what they do.",
          "Experiments have shown that people contribute more to shared projects when their behaviour is visible to others, and that they are willing to pay a cost to punish those who take advantage of the group.",
          "People 'contribute more to shared projects when their behaviour is visible to others'.",
        ),
        ynng(
          "The explanations of cooperation that biologists have found are exceptionally illuminating.",
          "YES",
          "Explaining how such behaviour could evolve has occupied biologists for more than a century, and in my view the answers they have found are among the most illuminating in all of science.",
          "They are 'among the most illuminating in all of science'.",
        ),
        ynng(
          "Vampire bats share food more often than any other kind of bat.",
          "NOT GIVEN",
          "",
          "Vampire bats are not compared with other kinds of bat.",
        ),
        ynng(
          "Axelrod's tournaments were strongly criticised by biologists at the time.",
          "NOT GIVEN",
          "",
          "The writer describes the tournaments and later research, but no criticism from biologists at the time.",
        ),
        ynng(
          "Tolerating other people's mistakes is useful as well as morally good.",
          "YES",
          "This finding strikes me as particularly important, because it suggests that some tolerance of others' mistakes is not merely a moral virtue but a practical necessity for lasting cooperation.",
          "Tolerance is 'not merely a moral virtue but a practical necessity'.",
        ),
        ynng(
          "Cooperation is always the opposite of self-interest.",
          "NO",
          "What is clear is that cooperation is not simply the opposite of self-interest; it can arise from it, under the right conditions.",
          "Cooperation 'is not simply the opposite of self-interest'.",
        ),
        ynng(
          "Institutions that rely only on goodwill are the best at maintaining cooperation.",
          "NO",
          "Institutions that allow people to interact repeatedly, to build reputations and to recognise and respond to unfair behaviour are more likely to sustain cooperation than those that rely on goodwill alone.",
          "Other institutions are 'more likely to sustain cooperation than those that rely on goodwill alone'.",
        ),
      ],
    },
  ],
};
