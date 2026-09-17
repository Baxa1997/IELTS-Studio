import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · maritime history · notes + True/False/Not Given -------------

const VASA = {
  title: "The story of the Vasa",
  layout: "notes" as const,
  wordLimit: "NO MORE THAN TWO WORDS",
};

// ---- Passage 2 · animal intelligence · lettered paragraphs and people --------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CROW_PEOPLE = ["Fiona McLeod", "Daniel Ortiz", "Grace Whitfield", "Hassan Karimi"];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const LONGEVITY_BANK = [
  "fraud",
  "identity",
  "pension",
  "found",
  "destroyed",
  "regions",
  "photographs",
  "salary",
  "hidden",
  "diets",
];

export const TEST_16: CuratedTest = {
  key: "full-test-16",
  targetBand: 6,
  passages: [
    {
      key: "t16-p1-vasa",
      title: "The Ship That Sank on Its First Voyage",
      topic: "how a failed Swedish warship became a museum treasure",
      difficulty: 5,
      body: `On the afternoon of 10 August 1628, crowds gathered along the waterfront in Stockholm to watch the new royal warship Vasa set off on her first voyage. The ship was one of the most powerful ever built in Sweden. She carried 64 bronze cannons, and her decks and stern were decorated with hundreds of painted wooden sculptures of lions, heroes and gods, designed to impress both the Swedish people and the country's enemies. But the voyage lasted only a few minutes. After sailing about 1,300 metres, the ship leaned over in a light wind, water poured in through the open gunports, and the Vasa sank in the harbour. At least thirty people died.

The king, Gustavus Adolphus, was fighting a war in Poland at the time, and he demanded to know who was responsible. An official inquiry was held, but nobody was punished. The ship's designer, a Dutch shipbuilder, had died a year before the ship was completed, and the king himself had approved the ship's measurements. It later became clear that the Vasa was dangerously unstable: she was too narrow and too tall for her weight, and she did not carry enough heavy stones in her lower hull to keep her upright. A test carried out before the voyage had suggested that the ship might be unstable, but the voyage went ahead anyway.

For more than three centuries, the Vasa lay at the bottom of the harbour, about 32 metres below the surface. Some decades after the sinking, engineers recovered most of her valuable cannons using a diving bell, a remarkable achievement for the time. The ship itself, however, was gradually forgotten. The cold water of the Baltic Sea, which contains relatively little salt, helped to protect the wreck, because the shipworm, a creature that destroys wooden wrecks in saltier seas, cannot survive there.

In the 1950s, an amateur researcher named Anders Franzén began searching for the ship. He had long been interested in old wrecks and had studied historical records to work out where the Vasa might lie. In 1956, using a simple tool that took samples from the sea floor, he brought up a piece of blackened oak, and divers soon confirmed that he had found the wreck. The discovery caused great excitement in Sweden, and a plan was made to raise the ship to the surface.

Raising the Vasa took several years. Divers used powerful jets of water to dig six tunnels under the hull, through which steel cables were passed. The cables were attached to two floating platforms on the surface, which lifted the ship in stages and moved it slowly towards shallower water. In April 1961, the Vasa broke the surface for the first time in 333 years, watched by crowds of spectators and by television audiences across the country. Inside the hull, archaeologists found thousands of objects, including clothing, coins, tools and the skeletons of some of the people who had died.

Once the ship was out of the water, a new problem arose. Wood that has been under water for a long time shrinks and cracks as it dries, so the conservators had to find a way to replace the water in the timbers. They chose a chemical called polyethylene glycol, a wax-like substance that could soak into the wood. The hull was sprayed with this chemical for seventeen years, and it was then left to dry slowly for another nine years. During this period, the ship was kept in a temporary building, where visitors could watch the work in progress.

In 1990, the Vasa moved to a purpose-built museum in Stockholm, which has become one of the most visited museums in Scandinavia. About 98 per cent of the ship is original, making it the best-preserved seventeenth-century ship in the world. Visitors can walk around the hull on several levels and see the carved decorations, some of which still show traces of their original bright colours.

The work of preserving the ship continues today. In the early 2000s, conservators noticed white and yellow patches appearing on the wood. These were caused by acids forming inside the timbers, partly as a result of iron from the ship's original bolts, which had rusted away. To slow this process, the museum carefully controls the temperature and humidity of the air around the ship. Researchers are also studying how the ship can be supported in the future, since the old wood is slowly changing shape under its own weight. The ship that failed so dramatically in 1628 has become, nearly four centuries later, one of the great success stories of underwater archaeology.`,
      questions: [
        noteLine(
          VASA,
          "The sinking (1628)",
          "water came in through the open ______",
          "gunports",
          "After sailing about 1,300 metres, the ship leaned over in a light wind, water poured in through the open gunports, and the Vasa sank in the harbour.",
          "Water 'poured in through the open gunports'.",
        ),
        noteLine(
          VASA,
          "The sinking (1628)",
          "an earlier ______ had suggested that the ship might be unstable",
          "test",
          "A test carried out before the voyage had suggested that the ship might be unstable, but the voyage went ahead anyway.",
          "'A test carried out before the voyage' had shown the danger.",
        ),
        noteLine(
          VASA,
          "On the sea floor",
          "most cannons recovered with a ______",
          "diving bell",
          "Some decades after the sinking, engineers recovered most of her valuable cannons using a diving bell, a remarkable achievement for the time.",
          "The cannons were recovered 'using a diving bell'.",
        ),
        noteLine(
          VASA,
          "On the sea floor",
          "wreck protected because the ______ cannot live in the Baltic",
          "shipworm",
          "The cold water of the Baltic Sea, which contains relatively little salt, helped to protect the wreck, because the shipworm, a creature that destroys wooden wrecks in saltier seas, cannot survive there.",
          "'The shipworm... cannot survive there'.",
        ),
        noteLine(
          VASA,
          "Raising and conservation",
          "steel cables passed through six ______ dug under the hull",
          "tunnels",
          "Divers used powerful jets of water to dig six tunnels under the hull, through which steel cables were passed.",
          "Divers dug 'six tunnels under the hull' for the cables.",
        ),
        noteLine(
          VASA,
          "Raising and conservation",
          "hull sprayed with polyethylene glycol for ______",
          "seventeen years",
          "The hull was sprayed with this chemical for seventeen years, and it was then left to dry slowly for another nine years.",
          "Spraying lasted 'seventeen years'; the nine years were for drying.",
        ),
        noteLine(
          VASA,
          "Raising and conservation",
          "white and yellow patches caused by ______ forming in the timbers",
          "acids",
          "These were caused by acids forming inside the timbers, partly as a result of iron from the ship's original bolts, which had rusted away.",
          "The patches 'were caused by acids forming inside the timbers'.",
        ),
        tfng(
          "The Vasa's sculptures were partly intended to impress Sweden's enemies.",
          "TRUE",
          "She carried 64 bronze cannons, and her decks and stern were decorated with hundreds of painted wooden sculptures of lions, heroes and gods, designed to impress both the Swedish people and the country's enemies.",
          "The sculptures were 'designed to impress both the Swedish people and the country's enemies'.",
        ),
        tfng(
          "Some of the Vasa's sculptures were carved by craftsmen from other countries.",
          "NOT GIVEN",
          "",
          "The sculptures are described, but nothing is said about who carved them.",
        ),
        tfng(
          "The ship's designer was punished after the official inquiry.",
          "FALSE",
          "An official inquiry was held, but nobody was punished.",
          "'Nobody was punished'; the designer had already died.",
        ),
        tfng(
          "Anders Franzén was a professional archaeologist.",
          "FALSE",
          "In the 1950s, an amateur researcher named Anders Franzén began searching for the ship.",
          "Franzén was 'an amateur researcher'.",
        ),
        tfng(
          "People were able to watch the raising of the Vasa on television.",
          "TRUE",
          "In April 1961, the Vasa broke the surface for the first time in 333 years, watched by crowds of spectators and by television audiences across the country.",
          "It was 'watched ... by television audiences across the country'.",
        ),
        tfng(
          "The museum is planning to move the Vasa to a new building.",
          "NOT GIVEN",
          "",
          "The museum is studying how to support the ship, but no move is mentioned.",
        ),
      ],
    },
    {
      key: "t16-p2-crows",
      title: "How Clever Are Crows?",
      topic: "what experiments reveal about the intelligence of crows",
      difficulty: 6,
      body: `A) For centuries, crows have had a mixed reputation. In many cultures they have been seen as symbols of bad luck, while in others they appear in stories as clever tricksters. Farmers have long regarded them as pests. In recent decades, however, scientists have begun to take a closer look at the crow family, which also includes ravens, rooks, jays and magpies. What they have found has changed the way many researchers think about intelligence in animals. "Crows keep surprising us," says behavioural ecologist Dr Fiona McLeod. "Every time we design a harder test, some of them pass it."

B) Some of the most striking evidence comes from New Caledonian crows, which live on a group of islands in the Pacific Ocean. In the wild, these birds make hooks from twigs and shape tools from the stiff leaves of certain plants, which they use to pull insects out of holes in dead wood. In a famous experiment carried out at the University of Oxford in 2002, a captive crow named Betty bent a straight piece of wire into a hook in order to lift a small bucket of food out of a tube. Scientists were astonished, because she had never been taught to do this.

C) Birds of the crow family also appear to understand some basic physical principles. In experiments inspired by an ancient fable, in which a thirsty crow drops stones into a jug to raise the level of the water, researchers placed a floating piece of food in a narrow tube of water, just out of reach. Rooks and other members of the crow family dropped stones into the tube until the food rose high enough to be caught. They also learned to choose heavy objects rather than light ones, which float and do not raise the water. "They seem to grasp cause and effect in a way that was once thought to be uniquely human," says comparative psychologist Professor Daniel Ortiz, although he adds that the birds may simply learn quickly by trial and error.

D) Remarkably, crows can also remember individual human faces. In a study that began in Seattle in 2006, researchers wearing a particular mask caught and briefly held a small number of wild crows before releasing them unharmed. For years afterwards, crows in the area called loudly at, and flew down towards, anyone wearing the same mask, even though most of these birds had never been caught themselves. Researchers believe that the crows had learned about the dangerous face from other crows. Wildlife biologist Dr Grace Whitfield says that this ability helps crows to live successfully alongside people. "In a city, it pays to know which humans are a threat and which are harmless," she explains.

E) In 2024, a study published by researchers in Germany showed that carrion crows can count out loud. The birds were trained to respond to the numbers one to four by producing the same number of calls. The crows were not only able to do this, but they also appeared to plan the number of calls in advance, since the sound of the first call differed depending on how many calls followed. Ortiz describes the result as a significant step. "Counting aloud means turning an abstract idea into an action," he says, "and until now we had seen that mainly in young children."

F) How can birds with such small brains perform these feats? One answer is that the size of a brain matters less than the number of nerve cells it contains. Birds' brains are packed with nerve cells far more densely than the brains of mammals, so the front part of a crow's brain contains roughly as many nerve cells as the same part in some monkeys. The bird brain is also organised quite differently from the brain of a mammal, yet it seems able to support similar kinds of thinking. According to McLeod, this suggests that intelligence has developed separately in different groups of animals.

G) Not all scientists are comfortable with describing crows as "feathered apes", a nickname that has become popular. Neuroscientist Dr Hassan Karimi warns against assuming that animals think in the same way as humans simply because they solve similar problems. "We should describe what the birds do carefully, without adding human explanations too quickly," he says. Nonetheless, most researchers agree that the crow family deserves its place among the most intelligent animals on Earth. For the farmers who once saw them only as pests, that may be an uncomfortable thought.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of a bird making a tool without being taught",
          "B",
          "Scientists were astonished, because she had never been taught to do this.",
          "Paragraph B: Betty bent wire into a hook although 'she had never been taught to do this'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to an old story that inspired an experiment",
          "C",
          "In experiments inspired by an ancient fable, in which a thirsty crow drops stones into a jug to raise the level of the water, researchers placed a floating piece of food in a narrow tube of water, just out of reach.",
          "Paragraph C describes experiments 'inspired by an ancient fable'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of knowledge being passed from some birds to others",
          "D",
          "Researchers believe that the crows had learned about the dangerous face from other crows.",
          "Paragraph D: crows 'had learned about the dangerous face from other crows'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison between the brains of birds and those of monkeys",
          "F",
          "Birds' brains are packed with nerve cells far more densely than the brains of mammals, so the front part of a crow's brain contains roughly as many nerve cells as the same part in some monkeys.",
          "Paragraph F compares crow and monkey brains.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "New Caledonian crows use tools to pull ______ out of holes in dead wood.",
          "insects",
          "In the wild, these birds make hooks from twigs and shape tools from the stiff leaves of certain plants, which they use to pull insects out of holes in dead wood.",
          "They use the tools 'to pull insects out of holes in dead wood'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The birds learned to drop ______ objects into the tube rather than light ones.",
          "heavy",
          "They also learned to choose heavy objects rather than light ones, which float and do not raise the water.",
          "They chose 'heavy objects rather than light ones'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Carrion crows produced a number of ______ that matched the number they were shown.",
          "calls",
          "The birds were trained to respond to the numbers one to four by producing the same number of calls.",
          "They produced 'the same number of calls'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Nerve cells are packed more ______ in birds' brains than in mammals' brains.",
          "densely",
          "Birds' brains are packed with nerve cells far more densely than the brains of mammals, so the front part of a crow's brain contains roughly as many nerve cells as the same part in some monkeys.",
          "They are packed 'far more densely than the brains of mammals'.",
        ),
        fromList(
          "matching_features",
          CROW_PEOPLE,
          "Crows keep succeeding in tests even as the tests become more difficult.",
          "Fiona McLeod",
          '"Every time we design a harder test, some of them pass it."',
          "McLeod: 'Every time we design a harder test, some of them pass it.'",
        ),
        fromList(
          "matching_features",
          CROW_PEOPLE,
          "The birds' success may come from learning by trial and error.",
          "Daniel Ortiz",
          '"They seem to grasp cause and effect in a way that was once thought to be uniquely human," says comparative psychologist Professor Daniel Ortiz, although he adds that the birds may simply learn quickly by trial and error.',
          "Ortiz adds that the birds 'may simply learn quickly by trial and error'.",
        ),
        fromList(
          "matching_features",
          CROW_PEOPLE,
          "Being able to recognise people is useful for birds that live in towns.",
          "Grace Whitfield",
          '"In a city, it pays to know which humans are a threat and which are harmless," she explains.',
          "Whitfield: 'In a city, it pays to know which humans are a threat'.",
        ),
        fromList(
          "matching_features",
          CROW_PEOPLE,
          "Intelligence has evolved independently in different types of animal.",
          "Fiona McLeod",
          "According to McLeod, this suggests that intelligence has developed separately in different groups of animals.",
          "McLeod: intelligence 'has developed separately in different groups of animals'.",
        ),
        fromList(
          "matching_features",
          CROW_PEOPLE,
          "Scientists should not be too quick to explain animal behaviour in human terms.",
          "Hassan Karimi",
          '"We should describe what the birds do carefully, without adding human explanations too quickly," he says.',
          "Karimi warns against 'adding human explanations too quickly'.",
        ),
      ],
    },
    {
      key: "t16-p3-blue-zones",
      title: "Do Blue Zones Really Exist?",
      topic: "the debate over places where people are said to live longest",
      difficulty: 7,
      body: `Few ideas in popular health writing have been as successful as that of the "blue zones". The term refers to a small number of places around the world where people are said to live unusually long lives: the island of Okinawa in Japan, the mountains of Sardinia in Italy, the Nicoya Peninsula in Costa Rica, the Greek island of Ikaria, and a religious community in Loma Linda, California. Books, documentaries and even town health programmes have been built around the lessons these places supposedly offer. Yet in recent years, some researchers have raised doubts about whether the blue zones are quite what they seem. In my view, those doubts deserve to be taken seriously.

The idea emerged in the early 2000s, when researchers studying Sardinia identified villages with a high proportion of people aged over 100. They reportedly marked these areas on a map with blue ink, giving rise to the name. The concept was then popularised by a journalist who travelled to several similar regions and identified common features of their inhabitants' lives: plenty of natural physical activity, a diet based largely on plants, strong family and social ties, and a sense of purpose. These lessons were later packaged into books and programmes that promise to help people everywhere live longer.

Much of this advice is sensible. There is good evidence that regular exercise, a diet rich in vegetables and beans, and strong social relationships are associated with better health. My concern is not with the advice itself but with the claim that the blue zones prove its value. That claim depends on the accuracy of the ages recorded in these regions, and there are good reasons to question it.

The best-known critic, a researcher who studies ageing, has pointed out that very old ages are often recorded in places where birth records are poor. In a study that later won a humorous science prize, he found that people who reached extreme old age in several countries were more likely to come from regions with low incomes, high crime rates and short average life expectancy, which are hardly the conditions one would expect to produce long lives. He argues that this pattern is more easily explained by errors, and sometimes by fraud, in the records. For example, a person may take on the identity of an older relative, or families may continue to claim a pension after a relative has died.

Japan provides a striking illustration. In 2010, officials investigating the country's records discovered that more than 230,000 people listed as being over 100 years old could not be found. Many had died long before, some of them decades earlier, without their deaths being registered. In Okinawa, many official records were destroyed during the Second World War, which makes the ages of older residents particularly difficult to confirm. The critic has also noted that Okinawa, once famous for having the longest-lived people in Japan, has fallen far down the country's rankings in recent decades.

Defenders of the blue zones reject these criticisms. They point out that researchers in the original studies checked ages carefully, using church records, military documents and interviews with relatives, and that the Sardinian ages in particular have been confirmed by several independent teams. They also argue that a few errors would not explain the overall pattern. This is a fair point, and I do not believe the critics have shown that every blue zone is imaginary. But the debate reveals how fragile the evidence for extreme old age can be.

There is a further problem. Even if the ages in a region are accurate, it is difficult to know why its people live long lives. The blue zones differ greatly in climate, culture and diet, and the common features identified by their promoters were selected after the regions had been chosen. Genes, migration, in which healthier or less healthy people leave a region, and simple chance could all play a part. Studying a few unusual places is a weak basis for general rules about how everyone should live.

None of this means that we should dismiss the lifestyle advice associated with the blue zones. Walking regularly, eating plenty of plants and spending time with friends are unlikely to do anyone harm. What we should resist is the suggestion that a few remote communities hold the secret to a long life. The most reliable evidence about long life comes from large studies of whole populations over many years. It is less exciting than any story about a hidden village of hundred-year-olds, but it is far more trustworthy.`,
      questions: [
        mcq(
          "What is the writer's attitude to the doubts about blue zones mentioned in the first paragraph?",
          [
            "They are based on too little evidence.",
            "They should be considered seriously.",
            "They have been proved correct.",
            "They are unfair to the people who live there.",
          ],
          "They should be considered seriously.",
          "In my view, those doubts deserve to be taken seriously.",
          "The doubts 'deserve to be taken seriously'.",
        ),
        mcq(
          "How did the name 'blue zones' come about?",
          [
            "The regions are all close to the sea.",
            "Areas were marked on a map in blue ink.",
            "It was the title of a popular book.",
            "Blue is a traditional symbol of long life.",
          ],
          "Areas were marked on a map in blue ink.",
          "They reportedly marked these areas on a map with blue ink, giving rise to the name.",
          "Researchers 'marked these areas on a map with blue ink'.",
        ),
        mcq(
          "What is the writer's main concern in the third paragraph?",
          [
            "The lifestyle advice is unhealthy.",
            "The blue zones may not prove that the advice works.",
            "The advice is too expensive to follow.",
            "Modern life leaves too little time for friends.",
          ],
          "The blue zones may not prove that the advice works.",
          "My concern is not with the advice itself but with the claim that the blue zones prove its value.",
          "The concern is 'the claim that the blue zones prove its value', not the advice itself.",
        ),
        mcq(
          "What did the critic find about people who reached extreme old age?",
          [
            "They usually lived in wealthy areas.",
            "They often came from poor regions where lives were generally short.",
            "They had usually kept detailed diaries.",
            "They rarely had children of their own.",
          ],
          "They often came from poor regions where lives were generally short.",
          "In a study that later won a humorous science prize, he found that people who reached extreme old age in several countries were more likely to come from regions with low incomes, high crime rates and short average life expectancy, which are hardly the conditions one would expect to produce long lives.",
          "They came from regions 'with low incomes, high crime rates and short average life expectancy'.",
        ),
        fromList(
          "summary_completion",
          LONGEVITY_BANK,
          "The critic believes many extreme ages come from mistakes or ______ in the records.",
          "fraud",
          "He argues that this pattern is more easily explained by errors, and sometimes by fraud, in the records.",
          "The pattern is explained 'by errors, and sometimes by fraud'.",
        ),
        fromList(
          "summary_completion",
          LONGEVITY_BANK,
          "Someone may take on the ______ of an older relative.",
          "identity",
          "For example, a person may take on the identity of an older relative, or families may continue to claim a pension after a relative has died.",
          "A person 'may take on the identity of an older relative'.",
        ),
        fromList(
          "summary_completion",
          LONGEVITY_BANK,
          "Families may go on receiving a ______ after a relative has died.",
          "pension",
          "For example, a person may take on the identity of an older relative, or families may continue to claim a pension after a relative has died.",
          "Families 'may continue to claim a pension'. A salary is paid for work, not after death.",
        ),
        fromList(
          "summary_completion",
          LONGEVITY_BANK,
          "In 2010, more than 230,000 Japanese people recorded as over 100 could not be ______.",
          "found",
          "In 2010, officials investigating the country's records discovered that more than 230,000 people listed as being over 100 years old could not be found.",
          "They 'could not be found'.",
        ),
        fromList(
          "summary_completion",
          LONGEVITY_BANK,
          "Many records in Okinawa were ______ during the Second World War.",
          "destroyed",
          "In Okinawa, many official records were destroyed during the Second World War, which makes the ages of older residents particularly difficult to confirm.",
          "Records 'were destroyed during the Second World War'.",
        ),
        fromList(
          "summary_completion",
          LONGEVITY_BANK,
          "The shared features of the blue zones were identified only after the ______ had been chosen.",
          "regions",
          "The blue zones differ greatly in climate, culture and diet, and the common features identified by their promoters were selected after the regions had been chosen.",
          "The features 'were selected after the regions had been chosen'.",
        ),
        ynng(
          "Much of the lifestyle advice linked with the blue zones is reasonable.",
          "YES",
          "Much of this advice is sensible.",
          "The writer says 'much of this advice is sensible'.",
        ),
        ynng(
          "The critics have shown that none of the blue zones is real.",
          "NO",
          "This is a fair point, and I do not believe the critics have shown that every blue zone is imaginary.",
          "The writer does not believe the critics 'have shown that every blue zone is imaginary'.",
        ),
        ynng(
          "Studying a few unusual places is a good way to find rules for how everyone should live.",
          "NO",
          "Studying a few unusual places is a weak basis for general rules about how everyone should live.",
          "It is 'a weak basis for general rules'.",
        ),
        ynng(
          "People in the blue zones sleep for longer than people elsewhere.",
          "NOT GIVEN",
          "",
          "Sleep is never mentioned among the features of blue zone lives.",
        ),
      ],
    },
  ],
};
