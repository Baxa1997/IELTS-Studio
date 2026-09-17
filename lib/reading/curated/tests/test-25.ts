import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, choose TWO ---------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const DRAWBACKS_STEM = "Which TWO disadvantages of agrivoltaics are mentioned in the passage?";
const DRAWBACKS = [
  "Crops that need a lot of light may produce smaller harvests.",
  "The panels damage the soil beneath them.",
  "Raised systems cost more to build than ordinary solar farms.",
  "Sheep often damage the panels.",
  "The panels work less efficiently when crops grow nearby.",
];

// ---- Passage 3 · writer's views · sentence endings ---------------------------

const ENDINGS = [
  "was regarded as less important than sight or hearing.",
  "is used for the smell of petrol, smoke and bat droppings.",
  "may help people to find food and avoid danger.",
  "learn vocabularies that describe smells precisely.",
  "cannot be improved by any kind of training.",
  "was first created by English scientists.",
  "is much smaller than that of most mammals.",
];

export const TEST_25: CuratedTest = {
  key: "full-test-25",
  targetBand: 7,
  passages: [
    {
      key: "t25-p1-lewis-chessmen",
      title: "The Chessmen from the Sands",
      topic: "the discovery and mystery of the medieval Lewis chessmen",
      difficulty: 6,
      body: `In 1831, on the Isle of Lewis, the largest island of the Outer Hebrides off the north-west coast of Scotland, a remarkable collection of small carved figures was discovered. The exact circumstances of the find are uncertain. According to one account, the pieces were found in a small stone chamber in a sandbank near the bay of Uig, but several different versions of the story were told at the time, and the name of the finder varies between them. What is certain is that the hoard included ninety-three objects, most of them pieces from chess sets, and that it soon became one of the most famous archaeological discoveries in Britain.

The chessmen are carved mainly from walrus ivory, with a few pieces made from whales' teeth. They include kings, queens, bishops, knights and rooks, as well as pawns, and they are thought to have been made in the late twelfth or early thirteenth century. Although they were found in Scotland, most historians believe that they were carved in Norway, probably in the city of Trondheim, which was an important centre of craftsmanship at the time. In that period, the Outer Hebrides were ruled by the kings of Norway rather than of Scotland.

The figures are famous for their expressive faces. The kings sit with swords across their knees, and the queens rest their chins in their hands, apparently in thought or worry. The bishops hold their staffs and books, or raise their hands in blessing. Among the rooks, which in these sets take the form of warriors rather than castles, are several figures that bite the tops of their shields. These are often identified as berserkers, warriors from Norse stories who were said to fight in a wild rage.

Why the pieces were buried on Lewis remains a mystery. Some historians suggest that they belonged to a merchant who was travelling from Norway to Ireland, where there was a market for such luxury goods, and who hid them for safekeeping, perhaps intending to return. Others believe that the pieces may have been made for use on the island itself, perhaps by a wealthy household. The fact that the pieces come from at least four different sets has led some researchers to suggest that they were part of a trader's stock rather than one family's possessions.

Soon after their discovery, the pieces were divided. Most were bought by the British Museum in London, which now holds eighty-two of the objects, while the remaining eleven are held by the National Museum of Scotland in Edinburgh. The division has been the subject of debate, and some people in Scotland have called for all the pieces to be displayed together in Scotland, especially on Lewis itself. In recent years, a small number of the chessmen have been lent to a museum on the island, where they attract many visitors.

In 2019, the chessmen made headlines again. A family in Edinburgh discovered that a small figure which had been kept in a drawer for decades was one of the missing pieces from the original hoard. Their grandfather, an antiques dealer, had bought it in 1964 for five pounds, without realising what it was. The piece, a warrior figure, was sold at auction for more than 700,000 pounds. Several pieces needed to complete the original sets are still missing, and experts believe that others may yet be found.

The Lewis chessmen have also found a place in popular culture. They have inspired children's television programmes and books, and copies of them appeared in one of the films based on a famous series of stories about a young wizard. Copies of the pieces are sold in museum shops around the world, and their faces have become some of the most recognisable images from medieval Europe.

Beyond their popularity, the chessmen offer valuable evidence about medieval society. Chess had reached Europe from the Islamic world only a few centuries earlier, and the pieces show how the game was adapted to European life. The Arabic game included a counsellor rather than a queen, and elephants rather than bishops. The Lewis pieces, with their bishops and queens, reflect the importance of the Church and the royal court in medieval Scandinavia. For historians, the small ivory figures offer a window into a world of trade, belief and power across the North Atlantic.`,
      questions: [
        tfng(
          "All accounts agree about who found the chessmen.",
          "FALSE",
          "According to one account, the pieces were found in a small stone chamber in a sandbank near the bay of Uig, but several different versions of the story were told at the time, and the name of the finder varies between them.",
          "'The name of the finder varies between' the accounts.",
        ),
        tfng(
          "When the chessmen were made, the Outer Hebrides were under Norwegian rule.",
          "TRUE",
          "In that period, the Outer Hebrides were ruled by the kings of Norway rather than of Scotland.",
          "They were 'ruled by the kings of Norway'.",
        ),
        tfng(
          "Written records from the period support the idea that a merchant hid the pieces.",
          "NOT GIVEN",
          "",
          "The merchant theory is a suggestion by historians; no written records are mentioned.",
        ),
        tfng(
          "All the pieces found on Lewis came from the same chess set.",
          "FALSE",
          "The fact that the pieces come from at least four different sets has led some researchers to suggest that they were part of a trader's stock rather than one family's possessions.",
          "They come 'from at least four different sets'.",
        ),
        tfng(
          "The British Museum paid more for its pieces than the National Museum of Scotland did.",
          "NOT GIVEN",
          "",
          "The number of pieces each museum holds is given, but not what either paid.",
        ),
        tfng(
          "The antiques dealer knew the piece was valuable when he bought it.",
          "FALSE",
          "Their grandfather, an antiques dealer, had bought it in 1964 for five pounds, without realising what it was.",
          "He bought it 'without realising what it was'.",
        ),
        tfng(
          "Copies of the chessmen have appeared in a film.",
          "TRUE",
          "They have inspired children's television programmes and books, and copies of them appeared in one of the films based on a famous series of stories about a young wizard.",
          "Copies 'appeared in one of the films'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Most of the chessmen are carved from ______.",
          "walrus ivory",
          "The chessmen are carved mainly from walrus ivory, with a few pieces made from whales' teeth.",
          "They are 'carved mainly from walrus ivory'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Many historians think the pieces were made in the city of ______.",
          "Trondheim",
          "Although they were found in Scotland, most historians believe that they were carved in Norway, probably in the city of Trondheim, which was an important centre of craftsmanship at the time.",
          "They were 'probably [made] in the city of Trondheim'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The queens are shown resting their ______ in their hands.",
          "chins",
          "The kings sit with swords across their knees, and the queens rest their chins in their hands, apparently in thought or worry.",
          "The queens 'rest their chins in their hands'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some of the warrior rooks are biting the tops of their ______.",
          "shields",
          "Among the rooks, which in these sets take the form of warriors rather than castles, are several figures that bite the tops of their shields.",
          "Some 'bite the tops of their shields'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In 1964, the grandfather paid ______ for the piece.",
          "five pounds",
          "Their grandfather, an antiques dealer, had bought it in 1964 for five pounds, without realising what it was.",
          "He 'bought it in 1964 for five pounds'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In the Arabic game, a ______ took the place of the queen.",
          "counsellor",
          "The Arabic game included a counsellor rather than a queen, and elephants rather than bishops.",
          "The Arabic game had 'a counsellor rather than a queen'.",
        ),
      ],
    },
    {
      key: "t25-p2-agrivoltaics",
      title: "Farming Beneath the Solar Panels",
      topic: "how farmers are growing food and solar power on the same land",
      difficulty: 7,
      body: `A) As countries race to expand renewable energy, solar farms are spreading rapidly across the countryside. Large arrays of solar panels can cover hundreds of hectares, and in some regions they have provoked opposition from farmers and local residents, who fear that valuable agricultural land is being lost. The competition between food and energy for land is likely to intensify as demand for both continues to grow. A growing number of researchers and farmers, however, believe that the two need not be in conflict. Their solution is known as agrivoltaics: using the same land both to grow crops or raise animals and to generate solar electricity. Supporters describe it as a way of harvesting the sun twice.

B) The idea was first proposed in the early 1980s by two German scientists, but it attracted little attention for decades. One of the earliest practical systems was developed in Japan in the early 2000s by an engineer who mounted narrow solar panels on raised frames above his fields, spaced so that enough light could reach the plants below. His approach, known in Japan as "solar sharing", has since spread to thousands of farms. Agrivoltaic systems have now been built in many countries, including France, Germany, Italy, the United States, China and Kenya. In some of these countries the systems are still experimental, while in others they are already being built on a commercial scale.

C) The designs vary widely. In some systems, panels are mounted several metres above the ground, high enough for tractors to pass beneath them. In others, rows of vertical panels are placed far apart, with crops grown in the wide spaces between them. Some installations use panels that tilt automatically during the day to control how much sunlight reaches the plants. The simplest form of agrivoltaics involves grazing sheep among ordinary solar panels: the animals keep the grass short, which saves the cost of cutting it, while the panels provide them with shade.

D) Surprisingly, some crops appear to benefit from growing under panels. In hot, dry regions, the shade reduces the amount of water lost from the soil and from the plants' leaves, and it can protect crops from extreme heat. Studies in Arizona, in the south-western United States, found that some vegetables, including tomatoes and peppers, produced similar or even larger harvests under panels while needing less water. The plants, in turn, can help the panels: by releasing moisture through their leaves, they cool the air around the panels, and solar panels generate electricity more efficiently when they are cooler. Farm workers have also reported that the shade makes working outdoors more comfortable in summer.

E) The results are not always positive, however. Many crops, especially those that need a lot of light, such as maize and wheat, may produce smaller harvests when shaded. In cooler, cloudier regions, the loss of light may outweigh any benefit from reduced heat. The raised structures also make farming more complicated: machinery must be adapted to work around posts and frames, and the cost of building elevated systems is considerably higher than that of conventional solar farms. Researchers are therefore trying to identify which crops and climates are best suited to the approach.

F) Governments have begun to support the approach. France passed a law in 2023 that sets conditions for agrivoltaic projects, including a requirement that farming must remain the main activity on the land and that harvests must not fall significantly. Germany and Italy have introduced financial support for systems that combine farming and solar energy. Some policymakers see agrivoltaics as a way to meet climate targets without taking land away from food production, while also giving farmers a second source of income. In some countries, however, planning rules have not yet caught up with the technology.

G) That extra income may be the most important benefit for many farmers. Payments from energy companies, or the sale of electricity, can help to protect farms against poor harvests and falling prices. Critics warn, however, that some projects described as agrivoltaic are really solar farms with only a small amount of farming, designed mainly to take advantage of subsidies. Clear rules and independent monitoring will be needed to make sure that the land continues to produce food. If these conditions can be met, agrivoltaics could help to resolve one of the most difficult questions about land use in the move to clean energy.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "concern that farmland is being lost to solar energy",
          "A",
          "Large arrays of solar panels can cover hundreds of hectares, and in some regions they have provoked opposition from farmers and local residents, who fear that valuable agricultural land is being lost.",
          "Paragraph A: people 'fear that valuable agricultural land is being lost'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an early system developed by one person in a particular country",
          "B",
          "One of the earliest practical systems was developed in Japan in the early 2000s by an engineer who mounted narrow solar panels on raised frames above his fields, spaced so that enough light could reach the plants below.",
          "Paragraph B describes the Japanese engineer's early system.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a way in which animals reduce the cost of maintaining a site",
          "C",
          "The simplest form of agrivoltaics involves grazing sheep among ordinary solar panels: the animals keep the grass short, which saves the cost of cutting it, while the panels provide them with shade.",
          "Paragraph C: sheep keep the grass short, 'which saves the cost of cutting it'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a way in which plants help solar panels to work better",
          "D",
          "The plants, in turn, can help the panels: by releasing moisture through their leaves, they cool the air around the panels, and solar panels generate electricity more efficiently when they are cooler.",
          "Paragraph D: plants cool the panels, which then work more efficiently.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a legal condition about how land must mainly be used",
          "F",
          "France passed a law in 2023 that sets conditions for agrivoltaic projects, including a requirement that farming must remain the main activity on the land and that harvests must not fall significantly.",
          "Paragraph F: 'farming must remain the main activity on the land'.",
        ),
        pickTwo(
          DRAWBACKS_STEM,
          DRAWBACKS,
          "A or C",
          "Many crops, especially those that need a lot of light, such as maize and wheat, may produce smaller harvests when shaded.",
          "A is correct: such crops 'may produce smaller harvests when shaded'. E is wrong — plants make panels more efficient.",
        ),
        pickTwo(
          DRAWBACKS_STEM,
          DRAWBACKS,
          "A or C",
          "The raised structures also make farming more complicated: machinery must be adapted to work around posts and frames, and the cost of building elevated systems is considerably higher than that of conventional solar farms.",
          "C is correct: raised systems cost 'considerably' more. B and D are not mentioned.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Agrivoltaics was first proposed by two ______ in the early 1980s.",
          "German scientists",
          "The idea was first proposed in the early 1980s by two German scientists, but it attracted little attention for decades.",
          "It was proposed 'by two German scientists'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In Japan, the approach is called ______.",
          "solar sharing",
          'His approach, known in Japan as "solar sharing", has since spread to thousands of farms.',
          "It is 'known in Japan as solar sharing'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some panels are high enough for ______ to drive underneath.",
          "tractors",
          "In some systems, panels are mounted several metres above the ground, high enough for tractors to pass beneath them.",
          "They are 'high enough for tractors to pass beneath them'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In some installations, the panels ______ automatically during the day.",
          "tilt",
          "Some installations use panels that tilt automatically during the day to control how much sunlight reaches the plants.",
          "The panels 'tilt automatically during the day'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In hot regions, shade reduces the amount of ______ lost from the soil.",
          "water",
          "In hot, dry regions, the shade reduces the amount of water lost from the soil and from the plants' leaves, and it can protect crops from extreme heat.",
          "Shade 'reduces the amount of water lost from the soil'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Critics say some projects are designed mainly to benefit from ______.",
          "subsidies",
          "Critics warn, however, that some projects described as agrivoltaic are really solar farms with only a small amount of farming, designed mainly to take advantage of subsidies.",
          "Some are 'designed mainly to take advantage of subsidies'.",
        ),
      ],
    },
    {
      key: "t25-p3-smell-language",
      title: "Why Is Smell So Hard to Describe?",
      topic: "what research on language reveals about the human sense of smell",
      difficulty: 8,
      body: `Ask an English speaker to describe the colour of a ripe tomato, and they will say "red" without hesitation. Ask them to describe the smell of coffee, cinnamon or rain on dry earth, and they are likely to struggle. Most will name the source of the smell ("it smells like coffee") or describe their reaction to it ("it's lovely"), rather than using a word for the smell itself. English, like many European languages, has a rich vocabulary for colours but very few abstract words for smells. For a long time, this was taken as evidence that humans are simply poor at smelling, but I believe that conclusion was mistaken.

The belief that humans have a weak sense of smell has a long history. In the nineteenth century, some scientists argued that as the human brain evolved, the parts devoted to reasoning grew at the expense of those devoted to smell. Smell came to be regarded as an "animal" sense, less important and less refined than sight or hearing. This view was repeated in textbooks for more than a century, even though it was based on limited evidence.

Recent research has challenged this picture. The part of the brain that processes smell is actually quite large in humans, and it contains a similar number of nerve cells to that of many other mammals. Humans can follow a scent trail across a field, and in some laboratory tests they can detect certain substances at extremely low concentrations, occasionally performing better than dogs or mice. In 2014, a much-publicised study claimed that humans could distinguish at least a trillion different smells. Although later analyses argued that this figure was based on questionable calculations, few researchers now doubt that our ability to tell smells apart is considerable.

If humans can smell well, why do we find smells so hard to name? One possibility is that the difficulty is cultural rather than biological. Evidence for this comes from research among the Jahai, a group of hunter-gatherers who live in the rainforests of the Malay Peninsula. The Jahai language has around a dozen abstract words for smells, each of which describes a quality shared by many different sources, in the same way that the English word "red" describes a quality shared by blood, tomatoes and fire engines. One word, for example, is used for the smell of petrol, smoke and bat droppings, among other things.

In a study published in 2014, researchers asked Jahai speakers and English speakers to name a series of colours and smells. The English speakers found colours easy to name and smells very difficult, often giving long and varied descriptions. The Jahai, by contrast, named smells as easily and consistently as they named colours. In a later study, researchers found that another hunter-gatherer group in the same region was also skilled at naming smells, whereas a closely related group of farmers was not.

Why should hunter-gatherers be better at naming smells? Researchers have suggested that smell plays a more important role in their daily lives, helping them to find food, avoid danger and follow cultural rules, some of which concern particular smells. In societies where smell matters less, there may be little pressure to develop a specialised vocabulary. I find this explanation convincing, although it is difficult to test directly, because language and way of life are so closely connected.

The findings suggest that the ability to talk about smells can be developed. Wine experts, perfumers and professional tasters, for example, learn vocabularies that allow them to describe smells with remarkable precision, although some studies have found that their descriptions are less consistent than they appear. Training can also improve people's ability to identify smells, and some researchers have suggested that such training could benefit people who lose their sense of smell through illness, as many did during the COVID-19 pandemic.

The study of smell language also has wider implications. It shows how dangerous it can be to draw conclusions about human nature from research carried out mainly in Western, industrialised societies. For more than a century, the difficulty English speakers have in naming smells was assumed to reflect a universal human limitation. It now appears that it may instead reflect the particular history and way of life of one group of cultures. In my view, this is a lesson that extends well beyond the study of smell.`,
      questions: [
        mcq(
          "According to the first paragraph, how do English speakers usually describe smells?",
          [
            "by using precise abstract words",
            "by naming the source of the smell or their reaction to it",
            "by comparing smells with colours",
            "by refusing to describe them at all",
          ],
          "by naming the source of the smell or their reaction to it",
          'Most will name the source of the smell ("it smells like coffee") or describe their reaction to it ("it\'s lovely"), rather than using a word for the smell itself.',
          "They 'name the source of the smell' or 'describe their reaction to it'.",
        ),
        mcq(
          "What does the writer say about the nineteenth-century view of human smell?",
          [
            "It was based on careful experiments.",
            "It was widely repeated even though the evidence was limited.",
            "It was immediately rejected by other scientists.",
            "It applied only to animals.",
          ],
          "It was widely repeated even though the evidence was limited.",
          "This view was repeated in textbooks for more than a century, even though it was based on limited evidence.",
          "It was 'repeated in textbooks for more than a century, even though it was based on limited evidence'.",
        ),
        mcq(
          "What happened to the 2014 claim that humans can distinguish a trillion smells?",
          [
            "It was confirmed by later studies.",
            "Later analyses questioned how the figure was calculated.",
            "Its authors withdrew it.",
            "It was shown to apply only to dogs.",
          ],
          "Later analyses questioned how the figure was calculated.",
          "Although later analyses argued that this figure was based on questionable calculations, few researchers now doubt that our ability to tell smells apart is considerable.",
          "Later analyses said the figure 'was based on questionable calculations'.",
        ),
        mcq(
          "What did the 2014 study of Jahai and English speakers find?",
          [
            "English speakers named smells more easily than colours.",
            "Jahai speakers named smells as easily as colours.",
            "Both groups found colours hard to name.",
            "Jahai speakers gave longer descriptions of smells.",
          ],
          "Jahai speakers named smells as easily as colours.",
          "The Jahai, by contrast, named smells as easily and consistently as they named colours.",
          "The Jahai 'named smells as easily and consistently as they named colours'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "In the nineteenth century, smell",
          "was regarded as less important than sight or hearing.",
          'Smell came to be regarded as an "animal" sense, less important and less refined than sight or hearing.',
          "Smell was seen as 'less important and less refined than sight or hearing'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "One Jahai word for a smell",
          "is used for the smell of petrol, smoke and bat droppings.",
          "One word, for example, is used for the smell of petrol, smoke and bat droppings, among other things.",
          "One word 'is used for the smell of petrol, smoke and bat droppings'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "For hunter-gatherers, a good sense of smell",
          "may help people to find food and avoid danger.",
          "Researchers have suggested that smell plays a more important role in their daily lives, helping them to find food, avoid danger and follow cultural rules, some of which concern particular smells.",
          "Smell helps them 'to find food, avoid danger and follow cultural rules'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Wine experts and perfumers",
          "learn vocabularies that describe smells precisely.",
          "Wine experts, perfumers and professional tasters, for example, learn vocabularies that allow them to describe smells with remarkable precision, although some studies have found that their descriptions are less consistent than they appear.",
          "They 'learn vocabularies that allow them to describe smells with remarkable precision'. E contradicts the passage.",
        ),
        ynng(
          "Humans have a poor sense of smell.",
          "NO",
          "For a long time, this was taken as evidence that humans are simply poor at smelling, but I believe that conclusion was mistaken.",
          "The writer believes that conclusion 'was mistaken'.",
        ),
        ynng(
          "Hunter-gatherer languages have more words for colours than English does.",
          "NOT GIVEN",
          "",
          "The Jahai are compared with English speakers on smell words, not on the number of colour words.",
        ),
        ynng(
          "The link between smell vocabulary and way of life is a convincing explanation.",
          "YES",
          "I find this explanation convincing, although it is difficult to test directly, because language and way of life are so closely connected.",
          "The writer finds 'this explanation convincing'.",
        ),
        ynng(
          "Perfumers have a better sense of smell than wine experts.",
          "NOT GIVEN",
          "",
          "Perfumers and wine experts are mentioned together but never compared.",
        ),
        ynng(
          "Research carried out mainly in Western societies can give a misleading picture of human nature.",
          "YES",
          "It shows how dangerous it can be to draw conclusions about human nature from research carried out mainly in Western, industrialised societies.",
          "It is 'dangerous' to generalise from Western research.",
        ),
        ynng(
          "The lesson of this research applies only to the study of smell.",
          "NO",
          "In my view, this is a lesson that extends well beyond the study of smell.",
          "The lesson 'extends well beyond the study of smell'.",
        ),
      ],
    },
  ],
};
