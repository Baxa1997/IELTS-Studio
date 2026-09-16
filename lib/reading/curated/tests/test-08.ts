import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · lettered paragraphs, choose TWO --------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CONCERNS_STEM =
  "Which TWO concerns about using artificial intelligence in archaeology are mentioned in the passage?";
const CONCERNS = [
  "Its results depend on the quality of the images it is given.",
  "It is too expensive for most universities to use.",
  "Publishing the locations of newly found sites could attract looters.",
  "It will remove the need for archaeologists to work in the field.",
  "It cannot be used in remote or dangerous areas.",
];

// ---- Passage 3 · sentence endings -----------------------------------------------

const ENDINGS = [
  "reduce the painful sense of isolation.",
  "can be used to promote an idealised version of the past.",
  "may increase their dissatisfaction.",
  "is one of the most powerful triggers of nostalgia.",
  "was first identified by advertisers.",
  "always improves a person's mood.",
];

export const TEST_08: CuratedTest = {
  key: "full-test-08",
  targetBand: 7,
  passages: [
    {
      key: "t08-p1-starling-murmurations",
      title: "Patterns in the Evening Sky",
      topic: "how flocks of starlings move together",
      difficulty: 6,
      body: `On winter evenings in parts of Europe, huge flocks of starlings gather above reed beds and woodland before settling down for the night. For half an hour or more, tens of thousands of birds swirl through the sky in a single shape that stretches, folds and ripples like smoke. These displays, known as murmurations, have attracted crowds of spectators for generations, and some of the largest have been estimated to contain more than a million birds. Many people travel considerable distances to watch them, and some nature reserves provide special viewing areas. Yet for a long time, nobody could explain how so many animals managed to move together without colliding.

Starlings are small, dark birds whose feathers shine with green and purple in the sunlight. They are highly sociable and feed in groups on open fields during the day. In autumn and winter, their numbers in some countries are boosted by birds arriving from colder regions further east. As the light begins to fade, flocks from a wide area travel to a shared roosting site, and it is above these sites that the murmurations take place. In the evening, the birds call noisily to one another as they gather.

Early observers offered some unusual explanations. In the early twentieth century, one ornithologist suggested that the birds might communicate by a form of thought transfer, since their movements seemed too fast to be the result of ordinary signals. Modern research has shown that no such explanation is needed. Using several cameras placed on the roof of a building in Rome, a team of physicists in 2008 recorded flocks from different angles and reconstructed the three-dimensional position of each bird. The work required powerful computers, since the position of every bird had to be matched across images taken at the same moment.

Their analysis produced a surprising result. Rather than responding to all the birds within a certain distance, each starling appeared to pay attention to a fixed number of its closest neighbours, about six or seven, regardless of how tightly the flock was packed. This finding surprised many biologists, who had expected distance to be the key factor. The researchers argued that this rule allows a flock to stay together even when its density changes, since a bird does not lose contact with its neighbours when they move further away. In a flock of thousands, no bird needs to see more than a tiny part of the whole group. A small change in direction by a few birds can therefore pass rapidly across the entire flock.

Later studies found that information travels through a murmuration with remarkable speed and very little loss. When one part of the flock turns, the change spreads to birds on the far side in a fraction of a second, so that the flock behaves almost like a single organism. Physicists compare this to certain materials in which a disturbance at one point is quickly felt everywhere. Such systems can respond very quickly to change, which may explain why murmurations appear so fluid. Researchers have used similar methods to study the movements of fish shoals and insect swarms.

Why starlings form murmurations at all is still debated. The most widely accepted explanation is protection from predators. Birds of prey such as peregrine falcons and sparrowhawks often hunt near roosting sites, and a large, constantly moving flock makes it difficult for them to focus on a single target. A study in 2017 found that murmurations were larger and lasted longer when predators were present. The study relied on thousands of reports made by members of the public. Other researchers suggest that the displays may also help birds to exchange information about good feeding areas, or simply to attract more birds to the roost, since a larger group offers greater warmth and safety during cold nights.

Despite their spectacular displays, starlings are in decline in many countries. In the United Kingdom, their numbers have fallen by more than half since the 1970s, probably because changes in farming have reduced the insects and other small creatures in soil on which they feed. The loss of grassland and the use of chemicals that kill soil insects may both have played a part. Some people also report that murmurations have become smaller in areas where they were once enormous. Conservationists hope that the popularity of murmurations will encourage people to value a bird that was once so common that it was taken for granted.`,
      questions: [
        tfng(
          "Some murmurations may include more than a million starlings.",
          "TRUE",
          "These displays, known as murmurations, have attracted crowds of spectators for generations, and some of the largest have been estimated to contain more than a million birds.",
          "Some 'have been estimated to contain more than a million birds'.",
        ),
        tfng(
          "Starlings usually feed alone during the day.",
          "FALSE",
          "They are highly sociable and feed in groups on open fields during the day.",
          "They 'feed in groups', not alone.",
        ),
        tfng(
          "One early ornithologist thought starlings might communicate through thought transfer.",
          "TRUE",
          "In the early twentieth century, one ornithologist suggested that the birds might communicate by a form of thought transfer, since their movements seemed too fast to be the result of ordinary signals.",
          "An ornithologist 'suggested that the birds might communicate by a form of thought transfer'.",
        ),
        tfng(
          "The cameras used in the 2008 study were placed on the ground beneath the flocks.",
          "FALSE",
          "Using several cameras placed on the roof of a building in Rome, a team of physicists in 2008 recorded flocks from different angles and reconstructed the three-dimensional position of each bird.",
          "The cameras were 'placed on the roof of a building'.",
        ),
        tfng(
          "The physicists who studied flocks in Rome had previously studied fish shoals.",
          "NOT GIVEN",
          "",
          "Fish shoals are mentioned as later uses of similar methods, but not as earlier work by the same team.",
        ),
        tfng(
          "Murmurations were found to be larger when predators were nearby.",
          "TRUE",
          "A study in 2017 found that murmurations were larger and lasted longer when predators were present.",
          "They were 'larger and lasted longer when predators were present'.",
        ),
        tfng(
          "Peregrine falcons catch more starlings in winter than in summer.",
          "NOT GIVEN",
          "",
          "Falcons are said to hunt near roosts, but their success at different times of year is not discussed.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In autumn and winter, extra starlings arrive from ______ further east.",
          "colder regions",
          "In autumn and winter, their numbers in some countries are boosted by birds arriving from colder regions further east.",
          "Birds arrive 'from colder regions further east'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Murmurations take place above a shared ______.",
          "roosting site",
          "As the light begins to fade, flocks from a wide area travel to a shared roosting site, and it is above these sites that the murmurations take place.",
          "Flocks travel 'to a shared roosting site'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Each starling seems to pay attention to a fixed number of its closest ______.",
          "neighbours",
          "Rather than responding to all the birds within a certain distance, each starling appeared to pay attention to a fixed number of its closest neighbours, about six or seven, regardless of how tightly the flock was packed.",
          "Each bird watches 'a fixed number of its closest neighbours'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A turn by one part of the flock reaches the far side in a ______ of a second.",
          "fraction",
          "When one part of the flock turns, the change spreads to birds on the far side in a fraction of a second, so that the flock behaves almost like a single organism.",
          "The change spreads 'in a fraction of a second'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A large moving flock makes it hard for predators to focus on a single ______.",
          "target",
          "Birds of prey such as peregrine falcons and sparrowhawks often hunt near roosting sites, and a large, constantly moving flock makes it difficult for them to focus on a single target.",
          "Predators find it hard 'to focus on a single target'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Changes in farming have reduced the ______ and other small creatures that starlings eat.",
          "insects",
          "In the United Kingdom, their numbers have fallen by more than half since the 1970s, probably because changes in farming have reduced the insects and other small creatures in soil on which they feed.",
          "Farming has 'reduced the insects and other small creatures in soil'.",
        ),
      ],
    },
    {
      key: "t08-p2-nazca-ai",
      title: "Finding the Lines in the Desert",
      topic: "how artificial intelligence helped find new Nazca figures",
      difficulty: 7,
      body: `A) On a dry plateau in southern Peru, the ground is covered with enormous drawings that can be fully appreciated only from the air. Known as the Nazca Lines, they include straight lines stretching for kilometres, geometric shapes and more than a hundred images of animals, plants and human-like figures, some of which are more than a hundred metres long. They were made roughly 2,000 years ago by removing the dark, iron-rich stones that cover the surface to reveal the lighter ground beneath. Because the region receives almost no rain and has little wind at ground level, many of the markings have survived remarkably well. The site was declared a World Heritage Site in 1994.

B) The lines first attracted wide attention in the 1920s and 1930s, when aircraft began flying over the area. Since then, researchers have debated their purpose. Some have suggested that the lines marked astronomical events, while others believe they were associated with water, which was scarce and precious in the desert. One German-born researcher spent much of her life studying and measuring the lines, and campaigned to protect them. Many archaeologists now think that at least some of the figures were intended to be seen by people walking along paths beside them, perhaps during ceremonies, rather than from above.

C) For decades, new figures were found only occasionally, usually by chance. Earlier surveys had relied largely on aerial photographs examined by eye. Searching the vast desert on foot is slow, and many of the images are faint, having been damaged by erosion, vehicles or later human activity. Some figures are so faint that they can hardly be seen even by people standing next to them. In 2024, however, a team led by Japanese archaeologists announced that it had discovered more than 300 new figures in just six months, almost doubling the number of figurative drawings previously known. The breakthrough came from combining fieldwork with artificial intelligence.

D) The researchers trained a computer model on images of known figures, teaching it to recognise the patterns they create in high-resolution aerial photographs. Training the model was difficult, because the number of known figures was relatively small. The model then scanned photographs of the entire area and suggested locations where undiscovered figures might be. Many of its suggestions were false, and every candidate had to be checked by archaeologists, first on screen and then on the ground. Even so, the team reported that the approach allowed them to search a far larger area far more quickly than traditional methods would have permitted.

E) The newly identified figures differ in important ways from the famous ones. Most are much smaller, averaging only around nine metres across, and many are drawn along paths rather than in open ground. Some show domesticated animals, human figures or scenes that appear to involve people and animals together. The team also found that the smaller figures were concentrated near paths that people may have used regularly. Based on these differences, the researchers suggested that the small figures near paths were probably intended to be seen by individuals or small groups, while the larger line-type drawings were used for community activities.

F) The discoveries have practical importance as well as scientific interest. The Nazca region faces growing pressure from farming, mining and tourism, and some figures have been damaged by vehicles driving across the desert. Knowing exactly where the drawings are makes it easier for the authorities to protect them. A detailed map of the figures also helps planners decide where new roads or buildings can safely be placed. In one widely reported case, a lorry driver entered a protected area and left deep tracks across several of the lines, leading to calls for stronger enforcement.

G) Archaeologists elsewhere are now applying similar techniques to other landscapes, from ancient field systems to buried settlements visible only as faint marks in satellite images. Supporters argue that artificial intelligence could transform the discovery of archaeological sites, especially in remote or dangerous areas. Others caution that the technology depends on the quality of the images it is given and on the expertise of the people who check its results. Some also worry that publishing the precise location of newly found sites could attract looters. The Nazca project, they point out, succeeded because the computer and the archaeologists worked together.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of how the drawings were originally made",
          "A",
          "They were made roughly 2,000 years ago by removing the dark, iron-rich stones that cover the surface to reveal the lighter ground beneath.",
          "Paragraph A: dark stones were removed 'to reveal the lighter ground beneath'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a statement that the computer model made many wrong suggestions",
          "D",
          "Many of its suggestions were false, and every candidate had to be checked by archaeologists, first on screen and then on the ground.",
          "Paragraph D: 'Many of its suggestions were false'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of damage caused by one individual",
          "F",
          "In one widely reported case, a lorry driver entered a protected area and left deep tracks across several of the lines, leading to calls for stronger enforcement.",
          "Paragraph F describes the lorry driver who damaged several lines.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison of the sizes of different kinds of figure",
          "E",
          "Most are much smaller, averaging only around nine metres across, and many are drawn along paths rather than in open ground.",
          "Paragraph E: the new figures are 'much smaller', about nine metres across.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to someone who spent many years studying the lines",
          "B",
          "One German-born researcher spent much of her life studying and measuring the lines, and campaigned to protect them.",
          "Paragraph B: a researcher 'spent much of her life studying and measuring the lines'.",
        ),
        pickTwo(
          CONCERNS_STEM,
          CONCERNS,
          "A or C",
          "Others caution that the technology depends on the quality of the images it is given and on the expertise of the people who check its results.",
          "A is correct: the technology 'depends on the quality of the images it is given'. E contradicts the claim that AI could help 'especially in remote or dangerous areas'.",
        ),
        pickTwo(
          CONCERNS_STEM,
          CONCERNS,
          "A or C",
          "Some also worry that publishing the precise location of newly found sites could attract looters.",
          "C is correct: publishing locations 'could attract looters'. D contradicts the need for archaeologists to check every result.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The drawings have survived because the area has almost no rain and little ______ at ground level.",
          "wind",
          "Because the region receives almost no rain and has little wind at ground level, many of the markings have survived remarkably well.",
          "The region has 'little wind at ground level'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The lines became widely known once ______ began flying over the region.",
          "aircraft",
          "The lines first attracted wide attention in the 1920s and 1930s, when aircraft began flying over the area.",
          "Attention came 'when aircraft began flying over the area'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Some researchers connect the lines with ______, which was rare in the desert.",
          "water",
          "Some have suggested that the lines marked astronomical events, while others believe they were associated with water, which was scarce and precious in the desert.",
          "Some link them with 'water, which was scarce and precious'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Many figures are faint because of erosion, vehicles or later human ______.",
          "activity",
          "Searching the vast desert on foot is slow, and many of the images are faint, having been damaged by erosion, vehicles or later human activity.",
          "Damage came from 'erosion, vehicles or later human activity'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The computer model was trained on images of ______ figures.",
          "known",
          "The researchers trained a computer model on images of known figures, teaching it to recognise the patterns they create in high-resolution aerial photographs.",
          "It was trained 'on images of known figures'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Some of the newly found figures show ______ animals.",
          "domesticated",
          "Some show domesticated animals, human figures or scenes that appear to involve people and animals together.",
          "Some 'show domesticated animals'.",
        ),
      ],
    },
    {
      key: "t08-p3-nostalgia",
      title: "The Surprising Value of Nostalgia",
      topic: "how psychologists came to see nostalgia as useful",
      difficulty: 8,
      body: `In 1688, a Swiss medical student named Johannes Hofer invented a new word to describe a condition he had observed among soldiers serving far from home. Combining the Greek words for "return home" and "pain", he called it nostalgia. Sufferers were said to experience sadness, sleeplessness and loss of appetite, and some doctors believed the condition could be fatal. The most common treatment was simply to send patients home. For the next two centuries, nostalgia was treated as a disease, and later as a psychological disorder associated with depression. Only in recent decades has this view been seriously challenged, and in my view the challenge is largely justified.

Research carried out since the late 1990s suggests that nostalgia is not only common but, in most cases, beneficial. In surveys conducted in many different countries, the great majority of people report feeling nostalgic at least once a week. When asked to describe a nostalgic memory, participants typically recall events involving close relationships, such as family celebrations or time spent with friends. The memories people describe most often involve themselves as the central figure, surrounded by people who matter to them. Although such memories often contain an element of sadness, since the past cannot be recovered, the overall feeling they produce is usually positive.

Experiments have identified several ways in which nostalgia may help people. In one common method, participants are asked to recall either a nostalgic event or an ordinary one, and their feelings are then measured. Those who recall nostalgic memories tend to report greater feelings of social connection, higher self-esteem and a stronger sense that their lives have meaning. Some studies have found that people who feel lonely are particularly likely to turn to nostalgic memories, which appear to reduce the painful sense of isolation. In some experiments, nostalgic participants were also more willing to help strangers or to make plans for the future. The effects are usually modest in size, but they have been found across many different groups of people. Nostalgia, researchers suggest, acts as a psychological resource that people draw on when they need it.

One intriguing line of research concerns the link between nostalgia and physical comfort. In several experiments, participants reported feeling more nostalgic on cold days, or when they were placed in cold rooms. In turn, recalling nostalgic memories appeared to make people feel physically warmer and to increase their tolerance of cold. These findings are striking, but I would treat them with some caution. Studies of this kind often involve small numbers of participants, and some similar effects in psychology have proved difficult to reproduce. Music is one of the most powerful triggers of nostalgia, and certain smells can have a similar effect.

Nostalgia also has a commercial dimension. Advertisers have long used images and music from past decades to create positive associations with their products, and film studios regularly release new versions of stories that audiences remember from childhood. Some companies now describe this approach openly as nostalgia marketing. There is evidence that nostalgic advertising can make people more willing to spend money, perhaps because feelings of social connection reduce the importance people place on possessions. Businesses are entitled to use such techniques, but consumers would do well to recognise when their emotions are being deliberately targeted.

Not all forms of nostalgia are harmless. Researchers distinguish between personal nostalgia, which concerns one's own experiences, and collective nostalgia for the supposed golden age of a nation or group. The second can be exploited for political purposes, presenting an idealised version of the past in which problems are forgotten and differences are ignored. Historians often point out that the periods people look back on with longing were rarely as peaceful or prosperous as they are remembered. Here, I believe, lies the real danger: not that people enjoy remembering their own past, but that a selective picture of history is used to argue against change.

Nor is nostalgia always helpful for individuals. For people who are already deeply unhappy with their present circumstances, dwelling on a happier past may increase their dissatisfaction rather than relieve it. Psychologists have also found that people differ considerably in how often they feel nostalgic, and that these differences are fairly stable over time. The benefits appear to depend on how nostalgia is used: as a source of strength for facing the present and the future, rather than as a place to escape to. Understood in this way, the feeling that Hofer considered a disease may be better seen as one of the mind's more useful tools.`,
      questions: [
        mcq(
          "What does the writer think about the traditional view of nostalgia as a disease?",
          [
            "It was never accepted by doctors.",
            "It has rightly been questioned in recent years.",
            "It is still widely held by psychologists.",
            "It was first put forward by soldiers themselves.",
          ],
          "It has rightly been questioned in recent years.",
          "Only in recent decades has this view been seriously challenged, and in my view the challenge is largely justified.",
          "The challenge to the disease view 'is largely justified'.",
        ),
        mcq(
          "What do people usually remember when asked to describe a nostalgic memory?",
          [
            "events involving people who are close to them",
            "successes at school or work",
            "places they visited on their own",
            "difficult experiences they have overcome",
          ],
          "events involving people who are close to them",
          "When asked to describe a nostalgic memory, participants typically recall events involving close relationships, such as family celebrations or time spent with friends.",
          "They recall 'events involving close relationships'.",
        ),
        mcq(
          "What is the writer's attitude to the research linking nostalgia and cold?",
          [
            "It proves that nostalgia keeps people warm.",
            "It should be treated with some caution.",
            "It was carried out with very large groups.",
            "It is more reliable than most psychological research.",
          ],
          "It should be treated with some caution.",
          "These findings are striking, but I would treat them with some caution.",
          "The writer would 'treat them with some caution', partly because the studies are often small.",
        ),
        mcq(
          "According to the passage, why might nostalgic advertising increase spending?",
          [
            "Nostalgia makes people forget the price of products.",
            "Feeling connected to others may make possessions seem less important.",
            "Older products are cheaper to advertise.",
            "People want to buy the items they owned as children.",
          ],
          "Feeling connected to others may make possessions seem less important.",
          "There is evidence that nostalgic advertising can make people more willing to spend money, perhaps because feelings of social connection reduce the importance people place on possessions.",
          "Social connection may 'reduce the importance people place on possessions'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "For lonely people, nostalgic memories seem to",
          "reduce the painful sense of isolation.",
          "Some studies have found that people who feel lonely are particularly likely to turn to nostalgic memories, which appear to reduce the painful sense of isolation.",
          "The memories 'appear to reduce the painful sense of isolation'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Collective nostalgia",
          "can be used to promote an idealised version of the past.",
          "The second can be exploited for political purposes, presenting an idealised version of the past in which problems are forgotten and differences are ignored.",
          "Collective nostalgia can be exploited by 'presenting an idealised version of the past'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "For people who are already very unhappy, thinking about a happier past",
          "may increase their dissatisfaction.",
          "For people who are already deeply unhappy with their present circumstances, dwelling on a happier past may increase their dissatisfaction rather than relieve it.",
          "It 'may increase their dissatisfaction rather than relieve it'. F is contradicted here.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Music",
          "is one of the most powerful triggers of nostalgia.",
          "Music is one of the most powerful triggers of nostalgia, and certain smells can have a similar effect.",
          "'Music is one of the most powerful triggers of nostalgia'. Advertisers use music, but they did not identify nostalgia (E).",
        ),
        ynng(
          "The overall effect of nostalgia is usually positive.",
          "YES",
          "Although such memories often contain an element of sadness, since the past cannot be recovered, the overall feeling they produce is usually positive.",
          "Despite some sadness, 'the overall feeling they produce is usually positive'.",
        ),
        ynng(
          "Businesses should be prevented from using nostalgia in their advertising.",
          "NO",
          "Businesses are entitled to use such techniques, but consumers would do well to recognise when their emotions are being deliberately targeted.",
          "The writer says businesses 'are entitled to use such techniques'.",
        ),
        ynng(
          "Consumers should be aware of attempts to manipulate their feelings.",
          "YES",
          "Businesses are entitled to use such techniques, but consumers would do well to recognise when their emotions are being deliberately targeted.",
          "Consumers 'would do well to recognise when their emotions are being deliberately targeted'.",
        ),
        ynng(
          "The greatest danger of nostalgia is that people enjoy their own memories.",
          "NO",
          "Here, I believe, lies the real danger: not that people enjoy remembering their own past, but that a selective picture of history is used to argue against change.",
          "The writer says the danger is 'not that people enjoy remembering their own past'.",
        ),
        ynng(
          "Nostalgia is most useful when it gives people strength to face the future.",
          "YES",
          "The benefits appear to depend on how nostalgia is used: as a source of strength for facing the present and the future, rather than as a place to escape to.",
          "The benefits depend on using nostalgia 'as a source of strength for facing the present and the future'.",
        ),
        ynng(
          "Older people feel nostalgic more often than younger people.",
          "NOT GIVEN",
          "",
          "The writer says people differ in how often they feel nostalgic, but does not link this to age.",
        ),
      ],
    },
  ],
};
