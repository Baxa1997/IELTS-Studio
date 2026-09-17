import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · natural history · notes + True/False/Not Given --------------

const EEL = {
  title: "Solving the mystery of the European eel",
  layout: "notes" as const,
  wordLimit: "NO MORE THAN TWO WORDS",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs and people -----------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CROP_PEOPLE = ["Elena Marsh", "Daniel Mensah", "Sophie Laurent", "Pablo Herrera"];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const CROWD_BANK = [
  "misconception",
  "reproduces",
  "expected",
  "minority",
  "records",
  "independence",
  "cancels",
  "majority",
  "salaries",
  "confidence",
];

export const TEST_28: CuratedTest = {
  key: "full-test-28",
  targetBand: 8,
  passages: [
    {
      key: "t28-p1-eels",
      title: "The Long Mystery of the Eel",
      topic: "how scientists discovered where European eels breed",
      difficulty: 7,
      body: `For more than two thousand years, the European eel posed one of the most persistent puzzles in natural history. Eels were common in rivers, lakes and ponds across Europe, and they were an important source of food. Yet nobody had ever seen them breed, and no one had found eel eggs or eels carrying eggs. The Greek philosopher Aristotle, who studied animals closely, concluded that eels did not reproduce in the usual way at all, but arose spontaneously from mud. Later writers proposed that they grew from horse hairs that had fallen into water, or from pieces of skin rubbed off older eels.

Part of the difficulty was that the eel's life cycle is extraordinarily complex. Eels pass through several stages that look so different from one another that for a long time they were thought to be separate species. In the late nineteenth century, scientists realised that a small, transparent, leaf-shaped creature found in the Mediterranean, previously classified as a different kind of fish, was in fact a young eel. Researchers also discovered that the young eels arriving at European coasts, known as glass eels because of their transparent bodies, gradually develop pigment and become the yellow eels found in rivers.

Even the young Sigmund Freud, later famous as the founder of psychoanalysis, joined the search. In 1876, as a student, he spent weeks in the port of Trieste dissecting hundreds of eels in an attempt to find their male reproductive organs. He was unsuccessful, and his findings were inconclusive. It later became clear that eels develop mature reproductive organs only when they begin their final journey to the sea, so the eels caught in rivers and coastal waters were not yet ready to breed.

The most important step towards solving the mystery was taken by the Danish biologist Johannes Schmidt. Beginning in 1904, Schmidt spent almost two decades sailing across the Atlantic, collecting eel larvae with fine nets. He reasoned that the smaller the larvae he caught, the closer he must be to the place where they had hatched. Over the years, he found smaller and smaller larvae further and further west, until he identified the Sargasso Sea, a region of the western Atlantic near Bermuda, as the area where the smallest larvae lived. In 1922, he announced his conclusion that European eels travel thousands of kilometres to breed there.

Schmidt's conclusion was widely accepted, but it rested on indirect evidence. No one had actually observed adult eels in the Sargasso Sea, let alone seen them spawn. Tracking eels across the ocean proved extremely difficult, because the fish swim at great depths and the tracking devices available were too large for them to carry over long distances. In 2022, however, a team of researchers reported that they had followed tagged eels released from the Azores, a group of islands in the middle of the Atlantic, all the way to the southern part of the Sargasso Sea, providing the first direct evidence that adult eels complete the journey.

The tracking data also revealed that the eels follow a remarkable daily pattern. During the day they dive to depths of up to about a thousand metres, while at night they rise to shallower waters. This behaviour may help them to avoid predators and to control their body temperature, which may in turn affect the timing of their development. Despite this progress, nobody has yet seen European eels spawning in the wild, and many details of their journey remain unknown.

The mystery has taken on new urgency, because the European eel is now critically endangered. The number of young eels reaching European rivers has fallen by more than 90 per cent since the 1980s. Scientists believe that several factors are responsible, including dams and other barriers that prevent eels from moving up and down rivers, pollution, disease, changes in ocean currents and overfishing. Because eels have never been bred in captivity on a large scale, eel farms depend on catching young wild eels and raising them.

This dependence has led to a serious problem of illegal trade. Young eels are extremely valuable, especially in parts of Asia where eel is a popular food, and criminal groups smuggle huge numbers out of Europe, often packed in suitcases. The European Union has banned the export of European eels since 2010, and police have made numerous arrests. Conservationists argue that protecting the eel will require not only stopping the trade but also removing barriers from rivers and improving water quality, so that the fish can complete a life cycle that humans took more than two thousand years to understand.`,
      questions: [
        noteLine(
          EEL,
          "Early ideas",
          "Aristotle thought eels came from ______",
          "mud",
          "The Greek philosopher Aristotle, who studied animals closely, concluded that eels did not reproduce in the usual way at all, but arose spontaneously from mud.",
          "Aristotle said eels 'arose spontaneously from mud'.",
        ),
        noteLine(
          EEL,
          "Early ideas",
          "later writers said eels grew from ______ that fell into water",
          "horse hairs",
          "Later writers proposed that they grew from horse hairs that had fallen into water, or from pieces of skin rubbed off older eels.",
          "They 'grew from horse hairs that had fallen into water'.",
        ),
        noteLine(
          EEL,
          "The life cycle",
          "young eels arriving at the coast are called ______",
          "glass eels",
          "Researchers also discovered that the young eels arriving at European coasts, known as glass eels because of their transparent bodies, gradually develop pigment and become the yellow eels found in rivers.",
          "They are 'known as glass eels'.",
        ),
        noteLine(
          EEL,
          "The life cycle",
          "they gradually develop ______ and become yellow eels",
          "pigment",
          "Researchers also discovered that the young eels arriving at European coasts, known as glass eels because of their transparent bodies, gradually develop pigment and become the yellow eels found in rivers.",
          "Glass eels 'gradually develop pigment'.",
        ),
        noteLine(
          EEL,
          "Schmidt's research",
          "larvae collected with fine ______",
          "nets",
          "Beginning in 1904, Schmidt spent almost two decades sailing across the Atlantic, collecting eel larvae with fine nets.",
          "Schmidt collected larvae 'with fine nets'.",
        ),
        noteLine(
          EEL,
          "Schmidt's research",
          "the smallest larvae were found in the ______",
          "Sargasso Sea",
          "Over the years, he found smaller and smaller larvae further and further west, until he identified the Sargasso Sea, a region of the western Atlantic near Bermuda, as the area where the smallest larvae lived.",
          "The smallest larvae lived in 'the Sargasso Sea'.",
        ),
        noteLine(
          EEL,
          "Recent findings",
          "2022: tagged eels released from the ______ were followed",
          "Azores",
          "In 2022, however, a team of researchers reported that they had followed tagged eels released from the Azores, a group of islands in the middle of the Atlantic, all the way to the southern part of the Sargasso Sea, providing the first direct evidence that adult eels complete the journey.",
          "The eels were 'released from the Azores'.",
        ),
        tfng(
          "Eels were rarely eaten in Europe in the past.",
          "FALSE",
          "Eels were common in rivers, lakes and ponds across Europe, and they were an important source of food.",
          "Eels were 'an important source of food'.",
        ),
        tfng(
          "Freud succeeded in finding the male reproductive organs of eels.",
          "FALSE",
          "He was unsuccessful, and his findings were inconclusive.",
          "Freud 'was unsuccessful'.",
        ),
        tfng(
          "Schmidt's voyages were paid for by the Danish government.",
          "NOT GIVEN",
          "",
          "Schmidt's voyages are described, but not who paid for them.",
        ),
        tfng(
          "Eels swim at greater depths during the day than at night.",
          "TRUE",
          "During the day they dive to depths of up to about a thousand metres, while at night they rise to shallower waters.",
          "By day they dive deep; 'at night they rise to shallower waters'.",
        ),
        tfng(
          "Most smuggled eels are taken to Japan.",
          "NOT GIVEN",
          "",
          "Asia is mentioned in general, but no particular country is named as the main destination.",
        ),
        tfng(
          "The European Union stopped the export of European eels in 2010.",
          "TRUE",
          "The European Union has banned the export of European eels since 2010, and police have made numerous arrests.",
          "Exports have been banned 'since 2010'.",
        ),
      ],
    },
    {
      key: "t28-p2-gene-edited-crops",
      title: "Editing the Genes of Our Food",
      topic: "the rise of gene-edited crops and the debate over how to regulate them",
      difficulty: 8,
      body: `A) For thousands of years, farmers have changed the plants they grow by selecting and breeding those with useful characteristics, such as larger seeds or resistance to disease. In the twentieth century, breeders began to speed up this process, for example by exposing seeds to radiation or chemicals to create random changes in their DNA and then selecting the plants with desirable traits. Many crops grown today were developed in this way. More recently, a technology known as gene editing has offered a far more precise approach, allowing scientists to make small, targeted changes to a plant's own genes. Because the changes are so precise, researchers can alter a single characteristic without affecting the rest of the plant.

B) The most widely used gene-editing tool, known as CRISPR, was developed in 2012, and two of the scientists behind it were awarded the Nobel Prize in Chemistry in 2020. It works like a pair of molecular scissors that can be directed to cut DNA at a precise location, where the plant's natural repair process then introduces a change. Plant geneticist Dr Elena Marsh explains that, in many cases, the result cannot be distinguished from a change that could have occurred naturally. "We are not adding genes from other species," she says. "We are making the kind of change that nature or traditional breeding could produce, only much faster."

C) This distinction lies at the heart of a debate about regulation. Genetically modified, or GM, crops, which usually contain genes from other species, have been subject to strict rules in many countries, particularly in the European Union, where very few have been approved for growing. Supporters of gene editing argue that crops with only small edits should be treated like conventionally bred plants, and several countries have agreed. England passed a law in 2023 that allows such "precision-bred" plants to be developed and sold under simpler rules, and countries including Argentina, Japan and the United States have adopted similar approaches. In these countries, companies can often bring an edited crop to market far more quickly and cheaply than a GM crop.

D) Several gene-edited foods have already reached consumers. In 2021, a tomato developed in Japan to contain higher levels of a substance that is claimed to help lower blood pressure went on sale, after being introduced through home gardeners who were given free seedlings. In the Philippines, regulators have approved a banana that does not turn brown as quickly after it is cut or bruised, a change that its developers hope will reduce food waste. Other projects are developing crops that can resist diseases or tolerate drought, heat and salty soil.

E) Supporters argue that gene editing could help agriculture adapt to climate change. Crop scientist Professor Daniel Mensah points out that traditional breeding can take ten years or more to produce a new variety, whereas gene editing can shorten the process considerably. "With the climate changing as quickly as it is, speed matters," he says. Because gene editing is relatively cheap, some researchers also hope that it will allow universities and small companies in developing countries to create varieties suited to local needs. Some scientists are also using the technology to restore useful traits that were lost when wild plants were first domesticated.

F) Critics remain concerned. Some environmental groups argue that gene editing can cause unintended changes elsewhere in a plant's DNA, and that its long-term effects on the wider environment have not been fully studied. Food policy researcher Dr Sophie Laurent believes that consumers have a right to know how their food has been produced. "Whatever the science says, people should be able to choose," she says, arguing that edited foods should be clearly labelled. Others worry that patents on gene-editing technology could increase the power of a few large companies over the food system.

G) The European Union has been debating new rules that would treat many gene-edited plants more like conventional ones, but the proposals have proved controversial, particularly on the questions of labelling and patents. Agricultural economist Dr Pablo Herrera expects the argument to continue for some time. "Regulation always follows technology," he says, "but with food it follows especially slowly, because people care so deeply about what they eat." Whatever the outcome, gene editing is likely to play a growing role in the way the world's food is produced. For shoppers, the most visible change may simply be new kinds of fruit and vegetables on supermarket shelves.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an older method that caused random changes to DNA",
          "A",
          "In the twentieth century, breeders began to speed up this process, for example by exposing seeds to radiation or chemicals to create random changes in their DNA and then selecting the plants with desirable traits.",
          "Paragraph A: radiation or chemicals created 'random changes in their DNA'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an award given to people who developed a technology",
          "B",
          "The most widely used gene-editing tool, known as CRISPR, was developed in 2012, and two of the scientists behind it were awarded the Nobel Prize in Chemistry in 2020.",
          "Paragraph B mentions the 2020 Nobel Prize.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a law passed in one part of the United Kingdom",
          "C",
          'England passed a law in 2023 that allows such "precision-bred" plants to be developed and sold under simpler rules, and countries including Argentina, Japan and the United States have adopted similar approaches.',
          "Paragraph C: 'England passed a law in 2023'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a product intended to reduce the amount of food thrown away",
          "D",
          "In the Philippines, regulators have approved a banana that does not turn brown as quickly after it is cut or bruised, a change that its developers hope will reduce food waste.",
          "Paragraph D: the banana is meant to 'reduce food waste'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "CRISPR works like a pair of molecular ______.",
          "scissors",
          "It works like a pair of molecular scissors that can be directed to cut DNA at a precise location, where the plant's natural repair process then introduces a change.",
          "It works 'like a pair of molecular scissors'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Very few GM crops have been approved for growing in the ______.",
          "European Union",
          "Genetically modified, or GM, crops, which usually contain genes from other species, have been subject to strict rules in many countries, particularly in the European Union, where very few have been approved for growing.",
          "In 'the European Union ... very few have been approved for growing'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The Japanese tomato was first introduced through home ______.",
          "gardeners",
          "In 2021, a tomato developed in Japan to contain higher levels of a substance that is claimed to help lower blood pressure went on sale, after being introduced through home gardeners who were given free seedlings.",
          "It was 'introduced through home gardeners'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some new crops are designed to tolerate drought, heat and ______.",
          "salty soil",
          "Other projects are developing crops that can resist diseases or tolerate drought, heat and salty soil.",
          "They 'tolerate drought, heat and salty soil'.",
        ),
        fromList(
          "matching_features",
          CROP_PEOPLE,
          "Gene editing does not involve adding genes from other species.",
          "Elena Marsh",
          '"We are not adding genes from other species," she says.',
          "Marsh: 'We are not adding genes from other species.'",
        ),
        fromList(
          "matching_features",
          CROP_PEOPLE,
          "The speed of gene editing is especially valuable because of climate change.",
          "Daniel Mensah",
          '"With the climate changing as quickly as it is, speed matters," he says.',
          "Mensah: 'With the climate changing as quickly as it is, speed matters.'",
        ),
        fromList(
          "matching_features",
          CROP_PEOPLE,
          "Shoppers should be free to decide whether to buy edited foods.",
          "Sophie Laurent",
          '"Whatever the science says, people should be able to choose," she says, arguing that edited foods should be clearly labelled.',
          "Laurent: 'people should be able to choose'.",
        ),
        fromList(
          "matching_features",
          CROP_PEOPLE,
          "Rules on food are particularly slow to catch up with new technology.",
          "Pablo Herrera",
          '"Regulation always follows technology," he says, "but with food it follows especially slowly, because people care so deeply about what they eat."',
          "Herrera: with food, regulation 'follows especially slowly'.",
        ),
        fromList(
          "matching_features",
          CROP_PEOPLE,
          "Edited plants often contain changes that could have happened naturally.",
          "Elena Marsh",
          "Plant geneticist Dr Elena Marsh explains that, in many cases, the result cannot be distinguished from a change that could have occurred naturally.",
          "Marsh: the result often 'cannot be distinguished from a change that could have occurred naturally'.",
        ),
      ],
    },
    {
      key: "t28-p3-crowd-wisdom",
      title: "When Are Crowds Wise?",
      topic: "the conditions under which groups make better judgements than individuals",
      difficulty: 9,
      body: `In 1906, the British scientist Francis Galton visited a livestock fair in Plymouth, in the south-west of England, where visitors were paying to guess the weight of an ox once it had been slaughtered and prepared. Galton, who had little faith in the judgement of ordinary people, collected the tickets afterwards, expecting to demonstrate how poor the guesses were. Instead, he found that the middle value of the roughly 800 estimates was within one per cent of the true weight, closer than most individual guesses, including those of the experts in the crowd. He published his findings the following year under the title "Vox Populi", the voice of the people.

A century later, the idea that groups can be smarter than their individual members was popularised by a best-selling book, and it has since influenced everything from the design of prediction markets to online review systems. The underlying principle is statistical: when many people make independent estimates, their individual errors, some too high and some too low, tend to cancel each other out, so that the average is closer to the truth than most of the individual answers. The more varied the group and the more independent its judgements, the stronger this effect is likely to be.

I find the principle compelling, but it is often presented without the conditions on which it depends. The wisdom of crowds is not a general property of groups; it emerges only when certain requirements are met. The most important of these is independence. If the members of a group influence one another before giving their answers, their errors are no longer random but linked, and averaging them no longer cancels them out. A crowd in which everyone follows the same mistaken leader is not wise but merely large.

Experimental evidence supports this concern. In a well-known study published in 2011, researchers in Switzerland asked groups of participants to answer factual questions about their country, such as the number of murders recorded in a particular year. Some groups answered independently, while others were shown information about the answers given by other participants before revising their own. Social influence reduced the variety of answers without making the average more accurate. Worse, it increased participants' confidence, so that groups became more certain while not becoming more correct.

A second condition concerns the nature of the question. Crowds tend to perform well when estimating quantities about which many people have some relevant knowledge, however partial, and when errors are likely to be spread evenly. They perform poorly when most people share the same misconception, because averaging a widespread error simply reproduces it. Asking a crowd to estimate the population of a little-known city, for instance, may produce a systematically biased answer if most people base their guesses on the same misleading clue.

Some researchers have proposed ways of improving collective judgements under such conditions. One method asks people not only for their own answer but also for their prediction of how others will answer; answers that turn out to be more common than people expected are then given extra weight, on the grounds that they may reflect knowledge held by a well-informed minority. Another approach, used in some forecasting competitions, involves identifying individuals with consistently good records and giving their judgements greater influence. These techniques have produced impressive results in experiments, although they are more complex to apply than a simple average.

There are good reasons, then, to be cautious about claims that "the crowd" knows best. Online platforms that display rankings of popularity, for example, may undermine the very independence on which collective wisdom depends, since people who can see what others have chosen tend to follow them. In one experiment involving an online music site, the popularity of songs depended heavily on whether participants could see what others had downloaded, and the same songs achieved very different levels of success in different groups.

None of this means that collective judgement should be dismissed. Used carefully, it remains one of the most powerful tools we have for making decisions under uncertainty, and it often outperforms the judgement of individual experts. The lesson of the research is rather that crowds are wise only when they are organised in the right way. Designing institutions, from juries to online platforms, that preserve independence and diversity is, in my view, far more important than simply asking more people for their opinions.`,
      questions: [
        mcq(
          "What did Galton expect to find when he examined the tickets?",
          [
            "that the experts would make the best guesses",
            "that ordinary people would guess badly",
            "that the ox had been weighed incorrectly",
            "that most visitors had refused to guess",
          ],
          "that ordinary people would guess badly",
          "Galton, who had little faith in the judgement of ordinary people, collected the tickets afterwards, expecting to demonstrate how poor the guesses were.",
          "He expected 'to demonstrate how poor the guesses were'.",
        ),
        mcq(
          "According to the passage, why can the average of many estimates be accurate?",
          [
            "Most of the people making estimates are experts.",
            "Errors in different directions tend to cancel each other out.",
            "People copy the best answer they can see.",
            "Large groups spend more time on each question.",
          ],
          "Errors in different directions tend to cancel each other out.",
          "The underlying principle is statistical: when many people make independent estimates, their individual errors, some too high and some too low, tend to cancel each other out, so that the average is closer to the truth than most of the individual answers.",
          "Errors 'some too high and some too low, tend to cancel each other out'.",
        ),
        mcq(
          "What is the writer's criticism of the way the principle is often presented?",
          [
            "It is based on faulty statistics.",
            "The conditions it depends on are often left out.",
            "It is too complicated for most people to understand.",
            "It exaggerates the value of experts.",
          ],
          "The conditions it depends on are often left out.",
          "I find the principle compelling, but it is often presented without the conditions on which it depends.",
          "It is 'presented without the conditions on which it depends'.",
        ),
        mcq(
          "What did the 2011 study find about social influence?",
          [
            "It made the average answer more accurate.",
            "It made people more confident without making them more accurate.",
            "It made the answers more varied.",
            "It had no effect on people's confidence.",
          ],
          "It made people more confident without making them more accurate.",
          "Worse, it increased participants' confidence, so that groups became more certain while not becoming more correct.",
          "Groups 'became more certain while not becoming more correct'.",
        ),
        fromList(
          "summary_completion",
          CROWD_BANK,
          "Crowds do badly when most of their members share the same ______.",
          "misconception",
          "They perform poorly when most people share the same misconception, because averaging a widespread error simply reproduces it.",
          "They perform poorly 'when most people share the same misconception'.",
        ),
        fromList(
          "summary_completion",
          CROWD_BANK,
          "In such cases, averaging a common error simply ______ it.",
          "reproduces",
          "They perform poorly when most people share the same misconception, because averaging a widespread error simply reproduces it.",
          "Averaging a widespread error 'simply reproduces it'. It does not cancel it.",
        ),
        fromList(
          "summary_completion",
          CROWD_BANK,
          "One method gives extra weight to answers that are more common than people ______.",
          "expected",
          "One method asks people not only for their own answer but also for their prediction of how others will answer; answers that turn out to be more common than people expected are then given extra weight, on the grounds that they may reflect knowledge held by a well-informed minority.",
          "Answers 'more common than people expected' get extra weight.",
        ),
        fromList(
          "summary_completion",
          CROWD_BANK,
          "These answers may show knowledge held by a well-informed ______.",
          "minority",
          "One method asks people not only for their own answer but also for their prediction of how others will answer; answers that turn out to be more common than people expected are then given extra weight, on the grounds that they may reflect knowledge held by a well-informed minority.",
          "They may reflect 'knowledge held by a well-informed minority'.",
        ),
        fromList(
          "summary_completion",
          CROWD_BANK,
          "Another approach gives more influence to people with consistently good ______.",
          "records",
          "Another approach, used in some forecasting competitions, involves identifying individuals with consistently good records and giving their judgements greater influence.",
          "It favours 'individuals with consistently good records'.",
        ),
        fromList(
          "summary_completion",
          CROWD_BANK,
          "Rankings of popularity may damage the ______ on which collective wisdom depends.",
          "independence",
          "Online platforms that display rankings of popularity, for example, may undermine the very independence on which collective wisdom depends, since people who can see what others have chosen tend to follow them.",
          "They 'may undermine the very independence on which collective wisdom depends'.",
        ),
        ynng(
          "Groups always make better judgements than their individual members.",
          "NO",
          "The wisdom of crowds is not a general property of groups; it emerges only when certain requirements are met.",
          "It 'emerges only when certain requirements are met'.",
        ),
        ynng(
          "A group that follows a mistaken leader should not be described as wise.",
          "YES",
          "A crowd in which everyone follows the same mistaken leader is not wise but merely large.",
          "Such a crowd 'is not wise but merely large'.",
        ),
        ynng(
          "Juries reach better decisions than individual judges.",
          "NOT GIVEN",
          "",
          "Juries are mentioned only as an example of an institution; they are not compared with judges.",
        ),
        ynng(
          "Protecting independence and diversity matters more than consulting more people.",
          "YES",
          "Designing institutions, from juries to online platforms, that preserve independence and diversity is, in my view, far more important than simply asking more people for their opinions.",
          "It is 'far more important than simply asking more people for their opinions'.",
        ),
      ],
    },
  ],
};
