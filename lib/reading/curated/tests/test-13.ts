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

// ---- Passage 1 · food history · notes + True/False/Not Given -----------------

const TOMATO = {
  title: "The history of the tomato",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO ---------------------------

const HEADINGS = [
  "Why hard surfaces make flooding worse",
  "A national plan with ambitious targets",
  "Different ways of holding water",
  "Advantages beyond flood control",
  "A disaster that revealed the limits",
  "An idea that is spreading abroad",
  "A growing danger for the world's cities",
  "The high cost of building new dams",
  "Farmers who opposed the programme",
  "Why rainfall is becoming easier to predict",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const CRITICS_STEM = "Which TWO criticisms of sponge city projects are mentioned in the passage?";
const CRITICS = [
  "Some of the money was spent on projects that were mainly for show.",
  "The projects have made summer temperatures in cities higher.",
  "Sponge features cannot deal with extremely heavy rain by themselves.",
  "Residents were not allowed to use the new parks.",
  "Other countries have copied the idea too quickly.",
];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const LAUGHTER_BANK = [
  "grooming",
  "several",
  "pain",
  "language",
  "chemicals",
  "two",
  "food",
  "sleep",
  "memory",
];

export const TEST_13: CuratedTest = {
  key: "full-test-13",
  targetBand: 5,
  passages: [
    {
      key: "t13-p1-tomato",
      title: "From Suspicion to Sauce",
      topic: "how the tomato went from feared plant to favourite food",
      difficulty: 4,
      body: `The tomato is one of the most popular foods in the world. It is used in salads, soups and sauces, and it is an essential part of dishes such as pizza and many kinds of pasta. Every year, farmers around the world grow more than 180 million tonnes of tomatoes, and in many countries it is the vegetable that people buy most often, even though scientists classify it as a fruit. It may therefore be surprising to learn that, for about two hundred years, many Europeans refused to eat tomatoes at all.

The tomato comes from western South America, where small wild tomatoes still grow today. These wild plants produce fruit about the size of a pea. It was probably in Mexico, however, that people first grew tomatoes as a crop, and over many generations they developed larger fruit. The Aztecs, who lived in central Mexico, used tomatoes in their cooking, often mixed with chilli peppers. The English word "tomato" comes from "tomatl", a word in the Aztec language. Tomatoes were only one of many plants that the people of the region developed over thousands of years, along with maize, beans and squash.

Spanish explorers brought the tomato to Europe in the sixteenth century, together with other new foods such as potatoes and maize. One of the first descriptions of the plant in Europe was written in 1544 by an Italian doctor, who described it as a kind of aubergine. Italians later called the fruit "pomodoro", which means "golden apple". This name suggests that the first tomatoes to reach Italy were yellow rather than red. Red varieties became common only later.

For many years, however, most people in Europe grew tomatoes only as decorative plants in their gardens. One reason was that the tomato belongs to the same plant family as deadly nightshade, a poisonous plant, and its leaves have a strong and unpleasant smell. In 1597, an English writer called John Gerard published a popular book about plants in which he described the tomato as unpleasant and of little value as food. His book was read for many years, and his opinion may have discouraged people in Britain from eating tomatoes.

A well-known story claims that rich Europeans became ill after eating tomatoes from plates made of pewter, a metal that contains lead. According to this story, the acid in the tomatoes caused lead to escape from the plates, and people blamed the fruit for the poisoning. Historians point out that there is little evidence for this explanation. Even so, the story shows how strongly people once believed that tomatoes were dangerous. Stories of this kind were repeated for generations, and some are still told today.

In southern Europe, attitudes changed earlier. By the seventeenth century, cooks in Spain and Italy were using tomatoes in their dishes, and the first known Italian recipe for tomato sauce was published in 1692. The fruit became especially popular in the city of Naples, where, in the nineteenth century, tomatoes were added to flat bread to make an early form of pizza. In northern Europe and North America, the tomato was accepted more slowly, and it was not widely eaten there until the nineteenth century.

Once people started eating tomatoes, new ways of keeping them followed. In the United States, tomatoes were among the first foods to be sold in cans, which allowed people to enjoy them all year round. In 1876, a company started by Henry Heinz began selling tomato ketchup, a thick sauce that soon became one of the best-known foods in the country. Plant breeders also worked to develop new varieties with larger fruit that stayed fresh for longer. Some of these varieties were developed with machines in mind, so that the fruit could be picked mechanically without being damaged.

Today, the tomato is so common that it is hard to imagine many national dishes without it. Yet some cooks and farmers are concerned that modern tomatoes, which are often picked before they are ripe so that they can travel long distances, have less flavour than older varieties. As a result, many people now grow traditional "heirloom" tomatoes in their gardens. These come in a surprising range of colours, from yellow and orange to purple and almost black. They are a reminder of the long and unusual history of a fruit that people were once afraid to eat.`,
      questions: [
        noteLine(
          TOMATO,
          "Origins",
          "wild tomatoes in western South America have fruit the size of a ______",
          "pea",
          "These wild plants produce fruit about the size of a pea.",
          "Wild plants have fruit 'about the size of a pea'.",
        ),
        noteLine(
          TOMATO,
          "Origins",
          "probably first grown as a crop in ______",
          "Mexico",
          "It was probably in Mexico, however, that people first grew tomatoes as a crop, and over many generations they developed larger fruit.",
          "People probably first grew tomatoes as a crop 'in Mexico'.",
        ),
        noteLine(
          TOMATO,
          "Origins",
          "English name comes from a word in the ______ language",
          "Aztec",
          'The English word "tomato" comes from "tomatl", a word in the Aztec language.',
          "'Tomatl' is 'a word in the Aztec language'.",
        ),
        noteLine(
          TOMATO,
          "Arrival in Europe",
          "1544: an Italian doctor described it as a kind of ______",
          "aubergine",
          "One of the first descriptions of the plant in Europe was written in 1544 by an Italian doctor, who described it as a kind of aubergine.",
          "The doctor 'described it as a kind of aubergine'.",
          {
            before: [{ text: "brought from the Americas by Spanish explorers", indent: 0 }],
          },
        ),
        noteLine(
          TOMATO,
          "Arrival in Europe",
          "Italian name suggests the first tomatoes were ______ in colour",
          "yellow",
          "This name suggests that the first tomatoes to reach Italy were yellow rather than red.",
          "The name 'golden apple' suggests they 'were yellow rather than red'.",
        ),
        noteLine(
          TOMATO,
          "Arrival in Europe",
          "at first grown mainly as ______ plants",
          "decorative",
          "For many years, however, most people in Europe grew tomatoes only as decorative plants in their gardens.",
          "People grew them 'only as decorative plants'.",
        ),
        noteLine(
          TOMATO,
          "Acceptance",
          "1692: first known Italian recipe for tomato ______",
          "sauce",
          "By the seventeenth century, cooks in Spain and Italy were using tomatoes in their dishes, and the first known Italian recipe for tomato sauce was published in 1692.",
          "The 1692 recipe was 'for tomato sauce'.",
        ),
        noteLine(
          TOMATO,
          "Acceptance",
          "1876: Heinz company began selling tomato ______",
          "ketchup",
          "In 1876, a company started by Henry Heinz began selling tomato ketchup, a thick sauce that soon became one of the best-known foods in the country.",
          "Heinz 'began selling tomato ketchup' in 1876.",
        ),
        tfng(
          "The tomato is related to a poisonous plant.",
          "TRUE",
          "One reason was that the tomato belongs to the same plant family as deadly nightshade, a poisonous plant, and its leaves have a strong and unpleasant smell.",
          "It is in 'the same plant family as deadly nightshade, a poisonous plant'.",
        ),
        tfng(
          "John Gerard's book was read by only a small number of people.",
          "FALSE",
          "In 1597, an English writer called John Gerard published a popular book about plants in which he described the tomato as unpleasant and of little value as food.",
          "The book was 'popular' and 'read for many years'.",
        ),
        tfng(
          "Historians have found strong evidence that pewter plates made tomato eaters ill.",
          "FALSE",
          "Historians point out that there is little evidence for this explanation.",
          "Historians say 'there is little evidence for this explanation'.",
        ),
        tfng(
          "Tomato sauce was eaten in Spain before it was eaten in Italy.",
          "NOT GIVEN",
          "",
          "Spain and Italy are both said to have used tomatoes by the seventeenth century, but the passage does not say which country ate tomato sauce first.",
        ),
        tfng(
          "Heirloom tomatoes cost more to buy than modern varieties.",
          "NOT GIVEN",
          "",
          "Heirloom tomatoes are described by colour and flavour, but their price is never mentioned.",
        ),
      ],
    },
    {
      key: "t13-p2-sponge-cities",
      title: "Cities That Soak Up the Rain",
      topic: "how sponge cities are designed to prevent floods",
      difficulty: 5,
      body: `A) Across the world, cities are facing a growing threat from floods. As the climate warms, the air can hold more moisture, and in many regions rain now falls in shorter and heavier bursts. At the same time, cities are growing rapidly, and more than half of the world's population now lives in urban areas. When heavy rain falls on a crowded city, the results can be serious: roads turn into rivers, underground stations fill with water, and homes and businesses are damaged. Every year, urban floods cause billions of dollars of losses, and governments, insurance companies and residents are all looking for better ways to reduce the damage.

B) Part of the problem lies in the way that cities have traditionally been built. In the countryside, much of the rain that falls is absorbed by soil and plants. In cities, however, rain falls on concrete and asphalt, which do not let water pass through. Instead, the water runs quickly into drains and pipes, many of which were designed decades ago for much lighter rainfall. When the drains cannot carry the water away fast enough, it builds up on the surface and floods the streets. Covering land with buildings and roads also means that less water reaches the underground stores that feed wells and rivers during dry periods.

C) In 2015, China launched an ambitious programme to change this approach. Rather than simply building bigger pipes, the government encouraged cities to behave more like sponges, soaking up rainwater, storing it and releasing it slowly. Thirty cities were chosen to test the idea, and the government set a target that, by 2030, eighty per cent of urban areas should absorb and reuse at least seventy per cent of their rainwater. Large sums of money were made available for the work, and the name "sponge city" soon became familiar to planners in other countries.

D) A sponge city uses many different features to hold water. Green roofs, covered with soil and plants, soak up rain before it reaches the ground. Pavements and car parks can be built from materials that allow water to pass through into the soil below. Rain gardens, which are shallow areas planted with grasses and bushes, collect water from nearby roofs and roads. On a larger scale, wetlands and lakes can store huge amounts of water, and some parks are designed to flood safely during storms and to dry out afterwards. Some of these features can be added to existing streets, while others are included when new districts are planned.

E) Supporters point out that these features bring benefits beyond reducing floods. Plants and open water help to cool the air, which matters in cities that suffer from extreme heat in summer. Wetlands provide homes for birds, fish and insects, and new parks give residents more space for walking and exercise. Some studies suggest that green spaces can also improve people's mental health. Rainwater that is stored can be reused for watering gardens or cleaning streets, which reduces the demand for drinking water. For these reasons, many planners see sponge cities as a way to make urban life healthier as well as safer.

F) However, the approach has limits. In July 2021, the city of Zhengzhou in central China experienced extraordinary rainfall. In just one hour, more than 200 millimetres of rain fell, almost a third of the city's normal rainfall for a whole year. Streets and underground railway lines were flooded, and hundreds of people died across the region. Zhengzhou had spent large amounts on sponge city projects, and some critics argued that part of this money had gone into projects designed mainly to look impressive. Experts also pointed out that sponge features cannot cope with such extreme rainfall on their own. They must be combined with traditional drainage and with systems that warn people of danger.

G) Despite these problems, similar ideas are spreading to other parts of the world. After a severe cloudburst in 2011 flooded streets and basements, Copenhagen in Denmark created a plan that includes hundreds of projects to store and guide rainwater. In Rotterdam in the Netherlands, some public squares are designed to fill with water during heavy rain and to be used for sports when they are dry. Berlin, New York and many other cities are developing their own versions. As climate change brings heavier rain, the question for many cities is no longer whether to adapt, but how quickly they can do so.`,
      questions: [
        heading(
          "A",
          "A growing danger for the world's cities",
          "Across the world, cities are facing a growing threat from floods.",
          "Paragraph A describes the rising flood threat to cities worldwide.",
        ),
        heading(
          "B",
          "Why hard surfaces make flooding worse",
          "In cities, however, rain falls on concrete and asphalt, which do not let water pass through.",
          "Paragraph B explains that concrete and asphalt stop rain soaking in, so drains overflow.",
        ),
        heading(
          "C",
          "A national plan with ambitious targets",
          "Thirty cities were chosen to test the idea, and the government set a target that, by 2030, eighty per cent of urban areas should absorb and reuse at least seventy per cent of their rainwater.",
          "Paragraph C describes China's national programme and its 2030 target.",
        ),
        heading(
          "D",
          "Different ways of holding water",
          "A sponge city uses many different features to hold water.",
          "Paragraph D lists green roofs, permeable pavements, rain gardens, wetlands and parks.",
        ),
        heading(
          "E",
          "Advantages beyond flood control",
          "Supporters point out that these features bring benefits beyond reducing floods.",
          "Paragraph E lists cooling, wildlife, parks and reused water.",
        ),
        heading(
          "F",
          "A disaster that revealed the limits",
          "However, the approach has limits.",
          "Paragraph F uses the 2021 Zhengzhou flood to show what sponge features cannot do.",
        ),
        heading(
          "G",
          "An idea that is spreading abroad",
          "Despite these problems, similar ideas are spreading to other parts of the world.",
          "Paragraph G describes Copenhagen, Rotterdam, Berlin and New York.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "In cities, rain falls on concrete and ______ instead of soaking into the ground.",
          "asphalt",
          "In cities, however, rain falls on concrete and asphalt, which do not let water pass through.",
          "Rain falls 'on concrete and asphalt'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Some parks are designed to ______ safely during storms.",
          "flood",
          "On a larger scale, wetlands and lakes can store huge amounts of water, and some parks are designed to flood safely during storms and to dry out afterwards.",
          "Some parks 'are designed to flood safely during storms'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Plants and open water help to ______ the air in hot weather.",
          "cool",
          "Plants and open water help to cool the air, which matters in cities that suffer from extreme heat in summer.",
          "They 'help to cool the air'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Copenhagen made its plan after a severe ______ in 2011.",
          "cloudburst",
          "After a severe cloudburst in 2011 flooded streets and basements, Copenhagen in Denmark created a plan that includes hundreds of projects to store and guide rainwater.",
          "The plan followed 'a severe cloudburst in 2011'.",
        ),
        pickTwo(
          CRITICS_STEM,
          CRITICS,
          "A or C",
          "Zhengzhou had spent large amounts on sponge city projects, and some critics argued that part of this money had gone into projects designed mainly to look impressive.",
          "A is correct: some money went into 'projects designed mainly to look impressive'. B is wrong — the passage says plants and water cool the air.",
        ),
        pickTwo(
          CRITICS_STEM,
          CRITICS,
          "A or C",
          "Experts also pointed out that sponge features cannot cope with such extreme rainfall on their own.",
          "C is correct: sponge features 'cannot cope with such extreme rainfall on their own'. D and E are not mentioned.",
        ),
      ],
    },
    {
      key: "t13-p3-laughter",
      title: "The Serious Science of Laughter",
      topic: "what scientists have learned about why people laugh",
      difficulty: 6,
      body: `Laughter is so familiar that we rarely stop to think about it. We laugh at jokes, at funny films and at our own mistakes, and we usually assume that laughter is simply a response to humour. Yet scientists who have studied laughter in detail have reached a surprising conclusion: most laughter has little to do with jokes at all. In my view, this finding changes how we should understand one of the most human of all behaviours.

Much of this research was carried out by the American psychologist Robert Provine, who spent years listening to people laughing in everyday places such as shopping centres and university buildings. He and his students recorded more than 1,200 examples of laughter and noted what had been said just before each one. They found that only a small proportion of laughter, around ten to twenty per cent, followed anything resembling a joke. Most laughter followed ordinary remarks, such as "I'll see you later" or "Are you sure?", which nobody would describe as funny. Many of the people recorded were probably not even aware that they had laughed.

Provine also found that people laugh far more when they are with others than when they are alone. According to his research, we are about thirty times more likely to laugh in company than on our own. Surprisingly, speakers tend to laugh more than the people listening to them. Laughter also rarely interrupts the flow of speech. Instead, it usually occurs at the end of a phrase or sentence, in much the same way as punctuation in writing. Provine concluded that laughter is above all a social signal, a way of showing friendliness and building relationships, rather than simply a reaction to comedy.

This view is supported by research on animals. Laughter is not unique to humans: chimpanzees, gorillas and other apes produce a breathy panting sound during play, particularly when they are being tickled or chased. Some scientists believe that human laughter developed from this kind of play sound. More surprisingly, the neuroscientist Jaak Panksepp discovered that rats make high-pitched sounds when they are tickled, sounds that are too high for humans to hear without special equipment. The rats appeared to enjoy the experience, and they would follow the researcher's hand in search of more.

If laughter is mainly social, what purpose does it serve? One suggestion is that it helps groups to bond. Among our primate relatives, social relationships are maintained largely through grooming, but grooming can only involve two individuals at a time. Laughter, some researchers argue, allows humans to bond with several people at once. Laughing together has also been shown to increase people's tolerance of pain, possibly because it causes the release of natural chemicals called endorphins, which also produce a feeling of wellbeing. Laughing with a group of friends may therefore do more than simply lift our mood.

Laughter is also contagious. Hearing others laugh makes us more likely to laugh ourselves, which is why television comedies once added recorded laughter to their programmes. Brain scans suggest that the sound of laughter activates areas of the brain that prepare the face to smile. I find this one of the most fascinating discoveries in the field, because it shows how closely our brains are designed to share emotions with other people. It may also explain why a whole room can sometimes be unable to stop laughing, long after anyone remembers what started it.

None of this means that humour is unimportant. Jokes and comedy clearly give people great pleasure, and the ability to make others laugh is highly valued in many cultures. But I believe that focusing only on humour has led researchers to overlook the more basic role of laughter. It seems likely that laughter existed long before language, and therefore long before anyone could tell a joke. Babies, after all, begin to laugh months before they can speak.

There are practical lessons here too. Some organisations run "laughter yoga" classes, in which people laugh on purpose without any jokes, on the basis that laughter itself is good for health. The evidence for such claims is still limited, and I would be cautious about exaggerated promises. However, it seems reasonable to conclude that spending time laughing with friends is one of the simplest ways to strengthen the relationships that matter most to us. That may be the most serious lesson of all from the science of laughter.`,
      questions: [
        mcq(
          "What is the writer's main point in the first paragraph?",
          [
            "People laugh less often than they used to.",
            "Most laughter is not a response to humour.",
            "Scientists ignored laughter until recently.",
            "Jokes are the most common cause of laughter.",
          ],
          "Most laughter is not a response to humour.",
          "Yet scientists who have studied laughter in detail have reached a surprising conclusion: most laughter has little to do with jokes at all.",
          "Scientists concluded that 'most laughter has little to do with jokes at all'.",
        ),
        mcq(
          "What did Provine and his students record in their study?",
          [
            "how long each laugh lasted",
            "what people said just before they laughed",
            "how loudly people laughed in different places",
            "which jokes people found the funniest",
          ],
          "what people said just before they laughed",
          "He and his students recorded more than 1,200 examples of laughter and noted what had been said just before each one.",
          "They 'noted what had been said just before each one'.",
        ),
        mcq(
          "According to Provine, when does laughter usually occur in conversation?",
          [
            "in the middle of a sentence",
            "at the end of a phrase or sentence",
            "only when the listener finds something funny",
            "before the speaker begins to talk",
          ],
          "at the end of a phrase or sentence",
          "Instead, it usually occurs at the end of a phrase or sentence, in much the same way as punctuation in writing.",
          "Laughter 'usually occurs at the end of a phrase or sentence', like punctuation.",
        ),
        mcq(
          "What did Jaak Panksepp discover about rats?",
          [
            "They can recognise human laughter.",
            "They make sounds when they are tickled.",
            "They avoid people who tickle them.",
            "They laugh in the same way as chimpanzees.",
          ],
          "They make sounds when they are tickled.",
          "More surprisingly, the neuroscientist Jaak Panksepp discovered that rats make high-pitched sounds when they are tickled, sounds that are too high for humans to hear without special equipment.",
          "Rats 'make high-pitched sounds when they are tickled'. C is wrong: they followed the hand for more.",
        ),
        mcq(
          "Why did some television comedies add recorded laughter?",
          [
            "to hide mistakes made by the actors",
            "because audiences were not allowed into studios",
            "because hearing laughter makes people more likely to laugh",
            "to make the programmes last longer",
          ],
          "because hearing laughter makes people more likely to laugh",
          "Hearing others laugh makes us more likely to laugh ourselves, which is why television comedies once added recorded laughter to their programmes.",
          "Laughter is contagious, 'which is why television comedies once added recorded laughter'.",
        ),
        ynng(
          "Research on laughter should change the way we think about it.",
          "YES",
          "In my view, this finding changes how we should understand one of the most human of all behaviours.",
          "The writer says the finding 'changes how we should understand' laughter.",
        ),
        ynng(
          "Humans are the only animals that laugh.",
          "NO",
          "Laughter is not unique to humans: chimpanzees, gorillas and other apes produce a breathy panting sound during play, particularly when they are being tickled or chased.",
          "The writer states that 'laughter is not unique to humans'.",
        ),
        ynng(
          "The link between hearing laughter and preparing to smile is a fascinating discovery.",
          "YES",
          "I find this one of the most fascinating discoveries in the field, because it shows how closely our brains are designed to share emotions with other people.",
          "The writer calls it 'one of the most fascinating discoveries in the field'.",
        ),
        ynng(
          "Humour is of little importance to people.",
          "NO",
          "None of this means that humour is unimportant.",
          "The writer says 'none of this means that humour is unimportant'.",
        ),
        ynng(
          "Laughter yoga classes are becoming more popular every year.",
          "NOT GIVEN",
          "",
          "The writer describes laughter yoga and doubts its health claims, but says nothing about its popularity.",
        ),
        fromList(
          "summary_completion",
          LAUGHTER_BANK,
          "Among apes, relationships are kept up mainly through ______.",
          "grooming",
          "Among our primate relatives, social relationships are maintained largely through grooming, but grooming can only involve two individuals at a time.",
          "Primate relationships are 'maintained largely through grooming'.",
        ),
        fromList(
          "summary_completion",
          LAUGHTER_BANK,
          "Laughter may allow humans to bond with ______ people at the same time.",
          "several",
          "Laughter, some researchers argue, allows humans to bond with several people at once.",
          "Laughter lets humans 'bond with several people at once'. 'Two' is the limit for grooming.",
        ),
        fromList(
          "summary_completion",
          LAUGHTER_BANK,
          "Laughing together can make people better able to bear ______.",
          "pain",
          "Laughing together has also been shown to increase people's tolerance of pain, possibly because it causes the release of natural chemicals called endorphins, which also produce a feeling of wellbeing.",
          "It increases 'tolerance of pain'.",
        ),
        fromList(
          "summary_completion",
          LAUGHTER_BANK,
          "Laughter probably existed long before humans had ______.",
          "language",
          "It seems likely that laughter existed long before language, and therefore long before anyone could tell a joke.",
          "Laughter 'existed long before language'.",
        ),
      ],
    },
  ],
};
