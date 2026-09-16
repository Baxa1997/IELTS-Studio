import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · lettered paragraphs ----------------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const BENEFITS_STEM =
  "Which TWO of the following are mentioned as possible benefits of studying urban evolution?";
const BENEFITS = [
  "helping to design cities that suit more kinds of wildlife",
  "reducing the cost of building new roads",
  "understanding changes that could affect the spread of disease",
  "increasing the number of birds in city parks",
  "making street lighting more efficient",
];

// ---- Passage 3 · sentence endings -------------------------------------------

const ENDINGS = [
  "keep water at an acceptable level.",
  "work best when landowners receive advice and money.",
  "slow the flow of water downstream.",
  "were descended from animals that had escaped from enclosures.",
  "can always be removed from private land.",
  "have lived in Britain without interruption for thousands of years.",
];

export const TEST_02: CuratedTest = {
  key: "full-test-02",
  targetBand: 6,
  passages: [
    {
      key: "t02-p1-barcode",
      title: "The Stripes That Changed Shopping",
      topic: "the invention and spread of the barcode",
      difficulty: 5,
      body: `Every day, billions of products are scanned at checkouts around the world, and each scan takes less than a second. The simple pattern of black and white stripes that makes this possible is so familiar that few shoppers give it a moment's thought. In many countries it is now almost impossible to buy a packaged product that does not carry one. Yet the barcode took more than twenty years to move from an inventor's idea to a supermarket counter, and its arrival transformed not only shopping but the way goods are produced, stored and transported.

The story began in 1948, when a graduate student named Bernard Silver overheard the head of a food company asking a university dean for help. The businessman wanted a way to record product information automatically at the checkout. Silver mentioned the problem to his friend Norman Joseph Woodland, a former engineering student, who became fascinated by it. Woodland later described how the key idea came to him while he was sitting on a beach. Remembering the dots and dashes of Morse code, which he had learned as a Boy Scout, he pushed his fingers into the sand and drew them towards him, creating a series of thin and thick lines.

Woodland and Silver designed a circular version of the code, which looked like a target, so that it could be read from any direction. They received a patent for their invention in 1952. However, the technology needed to read the code reliably did not yet exist. Their early reading machine used a powerful light bulb and was roughly the size of a desk; it also generated so much heat that it was impractical to use in a shop. Woodland went on to work for a large computer company, where he continued to think about how the code might be used. Unable to find a buyer who could turn the idea into a working system, the two men eventually sold their patent for a modest sum.

Two developments changed the situation in the 1960s and early 1970s. The first was the laser, which produced a narrow, intense beam of light that could read printed lines quickly. The second was the growth of cheap computing power, which allowed the information from a scan to be matched instantly with a product's price. Meanwhile, American supermarkets were under pressure. Their profit margins were small, labour costs were rising, and staff spent many hours putting price labels on individual items.

In 1973, a committee representing food manufacturers and retailers chose a standard design for the whole industry. The rectangular pattern, known as the Universal Product Code, was developed largely by George Laurer, an engineer working for IBM. Unlike the circular design, it could be printed accurately on packaging without the ink spreading and blurring the lines. Each code was made up of twelve digits, identifying both the manufacturer and the specific product. Numbers printed beneath the stripes allowed a cashier to type in the code by hand if the scanner failed.

The first product sold using the new system was a packet of chewing gum, scanned at a supermarket in the state of Ohio on 26 June 1974. Adoption was slow at first. Scanners were expensive, and shops were reluctant to install them until enough products carried codes, while manufacturers had little reason to print codes until enough shops could read them. Some consumers also worried that without price labels on each item, it would be harder to notice if they were being overcharged. By the early 1980s, however, the benefits had become clear, and the system spread rapidly.

The barcode's influence soon extended far beyond the checkout. Because every sale was recorded automatically, retailers could see exactly which products were selling in each store and reorder stock before it ran out. This data gave large retail chains a new advantage in negotiations with the companies that supplied them. Barcodes also came to be used to track parcels, luggage at airports and patients' records in hospitals. Today, newer two-dimensional codes, which appear as square patterns, can store far more information and are read by the cameras in mobile phones, but the familiar stripes remain on almost every product in the shops.`,
      questions: [
        tfng(
          "Bernard Silver learned about the checkout problem from a conversation he was not part of.",
          "TRUE",
          "The story began in 1948, when a graduate student named Bernard Silver overheard the head of a food company asking a university dean for help.",
          "To 'overhear' is to hear a conversation you are not taking part in.",
        ),
        tfng(
          "Woodland learned Morse code while he was studying engineering.",
          "FALSE",
          "Remembering the dots and dashes of Morse code, which he had learned as a Boy Scout, he pushed his fingers into the sand and drew them towards him, creating a series of thin and thick lines.",
          "He learned it 'as a Boy Scout'. Engineering is mentioned earlier, which is exactly what makes the statement tempting.",
        ),
        tfng(
          "The circular code was designed so that it could be scanned from any angle.",
          "TRUE",
          "Woodland and Silver designed a circular version of the code, which looked like a target, so that it could be read from any direction.",
          "'Read from any direction' is paraphrased as 'scanned from any angle'.",
        ),
        tfng(
          "Woodland and Silver made a large profit by selling their patent.",
          "FALSE",
          "Unable to find a buyer who could turn the idea into a working system, the two men eventually sold their patent for a modest sum.",
          "They sold it 'for a modest sum', not for a large profit.",
        ),
        tfng(
          "George Laurer had helped to develop the circular version of the barcode.",
          "NOT GIVEN",
          "",
          "Laurer is linked only to the rectangular Universal Product Code; his earlier work is not mentioned.",
        ),
        tfng(
          "The chewing gum was chosen for the first scan because its packet was easy to read.",
          "NOT GIVEN",
          "",
          "The passage says what was scanned, when and where, but not why that product was chosen.",
        ),
        tfng(
          "Some shoppers feared that removing price labels would make overcharging harder to spot.",
          "TRUE",
          "Some consumers also worried that without price labels on each item, it would be harder to notice if they were being overcharged.",
          "Consumers worried it would be 'harder to notice if they were being overcharged'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Woodland's key idea came to him while he was sitting on a ______.",
          "beach",
          "Woodland later described how the key idea came to him while he was sitting on a beach.",
          "The idea came to him 'while he was sitting on a beach'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The early reading machine produced too much ______ to be used in a shop.",
          "heat",
          "Their early reading machine used a powerful light bulb and was roughly the size of a desk; it also generated so much heat that it was impractical to use in a shop.",
          "It 'generated so much heat that it was impractical to use in a shop'. Its size was a problem too, but size doesn't fit the gap.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The ______ made it possible to read printed lines quickly.",
          "laser",
          "The first was the laser, which produced a narrow, intense beam of light that could read printed lines quickly.",
          "The laser's beam 'could read printed lines quickly'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Supermarket staff spent many hours putting ______ on individual items.",
          "price labels",
          "Their profit margins were small, labour costs were rising, and staff spent many hours putting price labels on individual items.",
          "Staff spent hours 'putting price labels on individual items'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Unlike the circular design, the rectangular code could be printed accurately on ______.",
          "packaging",
          "Unlike the circular design, it could be printed accurately on packaging without the ink spreading and blurring the lines.",
          "It 'could be printed accurately on packaging' without the ink blurring.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Newer square codes can be read by the ______ in mobile phones.",
          "cameras",
          "Today, newer two-dimensional codes, which appear as square patterns, can store far more information and are read by the cameras in mobile phones, but the familiar stripes remain on almost every product in the shops.",
          "The square codes 'are read by the cameras in mobile phones'.",
        ),
      ],
    },
    {
      key: "t02-p2-urban-evolution",
      title: "Evolution on the City Streets",
      topic: "how plants and animals are adapting to life in cities",
      difficulty: 6,
      body: `A) Cities are among the most rapidly changing environments on Earth. In the space of a few decades, fields and forests can be replaced by roads, buildings and artificial lighting. For a long time, biologists assumed that evolution was far too slow to be observed in such settings, and that urban wildlife simply consisted of the species that happened to tolerate human activity. Over the past twenty years, however, a growing body of research has shown that many plants and animals are adapting to city life, sometimes in the space of just a few generations. Some researchers now describe cities as enormous, unplanned experiments in evolution.

B) One of the largest studies of urban evolution focused on white clover, a small plant that grows in lawns and parks around the world. Some clover plants produce a chemical called hydrogen cyanide, which protects their leaves from being eaten but makes the plants less able to survive in freezing conditions. In 2022, researchers published the results of a project in which scientists collected samples from 160 cities in 26 countries. They found that clover growing in city centres was less likely to produce the chemical than clover growing in the surrounding countryside, suggesting that urban conditions had repeatedly favoured the same change. The pattern appeared in cities with very different climates, although it was stronger in some places than in others.

C) Animals are changing too. In Puerto Rico, lizards living in towns have been found to have longer legs and larger, stickier toe pads than lizards living in forests. Scientists believe these features help them to run across smooth surfaces such as walls and windows, which offer far less grip than tree bark. To test whether the differences were inherited rather than simply the result of each lizard's upbringing, researchers raised the offspring of urban and forest lizards under identical conditions. The young lizards still showed the differences, indicating that the changes were genetic.

D) Artificial light at night creates a particular challenge for insects. Many moths are strongly attracted to lamps, where they may be exhausted or eaten, and are less likely to reproduce. In one experiment, researchers collected moths from areas with very different levels of light pollution and raised their young in a laboratory. Moths whose ancestors came from brightly lit cities were significantly less attracted to light than those from dark rural areas. The researchers believe that moths strongly drawn to lamps were gradually removed from city populations over many generations. For the moths, avoiding streetlights appears to improve the chances of survival, although it may also mean they visit fewer flowers.

E) Birds offer some of the clearest examples of changes in behaviour. City birds in several species sing at a higher pitch than their rural relatives, which may help their songs to be heard above the low rumble of traffic. Some urban birds have also become less afraid of people and bolder in exploring new objects, allowing them to take advantage of unfamiliar sources of food such as rubbish bins and bird feeders. In several European cities, blackbirds have been observed to breed earlier in the year than those in nearby forests. Not all such differences are genetic, however; some may be learned by individual birds during their lifetimes.

F) Urban evolution is not simply a scientific curiosity. Understanding how species respond to cities could help planners to design urban areas that support a wider range of wildlife, for example by creating corridors of green space that allow animals to move between parks. It may also have implications for human health, since changes in insects such as mosquitoes could affect the spread of disease. Some scientists have also suggested that urban populations could offer early clues about how species will cope with a warming climate, since cities are often several degrees hotter than the surrounding countryside. At the same time, researchers warn that the ability of some species to adapt does not mean that cities are harmless to nature.

G) Indeed, the species that manage to adapt represent only a small proportion of those that once lived in the areas now covered by cities. Many others have simply disappeared from urban environments altogether, particularly those that depend on large areas of undisturbed habitat. As the proportion of the world's population living in cities continues to rise, scientists argue that studying urban evolution will become ever more important, both for protecting biodiversity and for understanding how quickly life can respond to a changing planet.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to animals whose bodies suit climbing on artificial surfaces",
          "C",
          "Scientists believe these features help them to run across smooth surfaces such as walls and windows, which offer far less grip than tree bark.",
          "Paragraph C links the lizards' legs and toe pads to running across walls and windows.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why a change in voice might be useful in a city",
          "E",
          "City birds in several species sing at a higher pitch than their rural relatives, which may help their songs to be heard above the low rumble of traffic.",
          "Paragraph E: a higher pitch may help songs be heard 'above the low rumble of traffic'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the number of countries in which samples were collected for a study",
          "B",
          "In 2022, researchers published the results of a project in which scientists collected samples from 160 cities in 26 countries.",
          "Paragraph B gives '160 cities in 26 countries'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a warning that the success of some species should not be misunderstood",
          "F",
          "At the same time, researchers warn that the ability of some species to adapt does not mean that cities are harmless to nature.",
          "Paragraph F warns that adaptation 'does not mean that cities are harmless to nature'. G develops the idea, but the warning itself is in F.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a statement that many species are no longer found in urban areas",
          "G",
          "Many others have simply disappeared from urban environments altogether, particularly those that depend on large areas of undisturbed habitat.",
          "Paragraph G: many species 'have simply disappeared from urban environments altogether'.",
        ),
        pickTwo(
          BENEFITS_STEM,
          BENEFITS,
          "A or C",
          "Understanding how species respond to cities could help planners to design urban areas that support a wider range of wildlife, for example by creating corridors of green space that allow animals to move between parks.",
          "A is correct: planners could 'design urban areas that support a wider range of wildlife'. B, D and E are not mentioned as benefits.",
        ),
        pickTwo(
          BENEFITS_STEM,
          BENEFITS,
          "A or C",
          "It may also have implications for human health, since changes in insects such as mosquitoes could affect the spread of disease.",
          "C is correct: changes in mosquitoes 'could affect the spread of disease'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Some white clover plants make a chemical that stops their leaves from being ______.",
          "eaten",
          "Some clover plants produce a chemical called hydrogen cyanide, which protects their leaves from being eaten but makes the plants less able to survive in freezing conditions.",
          "The chemical 'protects their leaves from being eaten'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "However, these plants are less able to survive ______ conditions.",
          "freezing",
          "Some clover plants produce a chemical called hydrogen cyanide, which protects their leaves from being eaten but makes the plants less able to survive in freezing conditions.",
          "The same sentence gives the cost: they are 'less able to survive in freezing conditions'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Moths from brightly lit cities turned out to be less attracted to ______ than rural moths.",
          "light",
          "Moths whose ancestors came from brightly lit cities were significantly less attracted to light than those from dark rural areas.",
          "City moths were 'significantly less attracted to light'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Avoiding streetlights may mean that moths visit fewer ______.",
          "flowers",
          "For the moths, avoiding streetlights appears to improve the chances of survival, although it may also mean they visit fewer flowers.",
          "The possible cost is that 'they visit fewer flowers'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Bolder city birds are able to feed from sources such as rubbish ______.",
          "bins",
          "Some urban birds have also become less afraid of people and bolder in exploring new objects, allowing them to take advantage of unfamiliar sources of food such as rubbish bins and bird feeders.",
          "Food sources include 'rubbish bins and bird feeders'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Cities are often several degrees ______ than the countryside around them.",
          "hotter",
          "Some scientists have also suggested that urban populations could offer early clues about how species will cope with a warming climate, since cities are often several degrees hotter than the surrounding countryside.",
          "Cities 'are often several degrees hotter than the surrounding countryside'.",
        ),
      ],
    },
    {
      key: "t02-p3-beavers",
      title: "Should the Beaver Come Home?",
      topic: "the debate over returning beavers to the countryside",
      difficulty: 7,
      body: `For centuries, the Eurasian beaver was hunted across much of Europe for its fur, its meat and a substance from its glands that was used in perfume and medicine. In Britain, the animal had disappeared entirely by the sixteenth century. Today it is returning. Beavers have been legally protected in Scotland since 2019, and in 2025 the government in England agreed to allow licensed releases of beavers into the wild for the first time in hundreds of years. Small populations had in fact been living wild for some years before then, some descended from animals that had escaped from enclosures. The decision was celebrated by conservationists but greeted with anxiety by many farmers, and the debate it has provoked says a great deal about how we think about nature.

The case for the beaver rests largely on its remarkable ability to reshape landscapes. By building dams across streams, beavers create ponds and wetlands that store water. During heavy rain, these structures slow the flow of water downstream, and several studies have found that they can reduce peak flows during floods. In dry periods, the stored water is released gradually, helping to keep streams flowing. The wetlands also trap sediment and pollutants, improving water quality, and they provide habitat for insects, amphibians, birds and fish. Scientists who studied one river in the south-west of England over several years reported that water leaving a beaver site after storms was noticeably cleaner than the water entering it.

Supporters therefore describe the beaver as a free engineer, capable of carrying out restoration work that would otherwise cost large sums of public money. In my view, this argument is persuasive, but it is sometimes presented in a way that exaggerates what beavers can achieve. A dam on a small upland stream may help a village downstream, but beavers cannot prevent flooding caused by major rivers, and their benefits vary greatly from one location to another. Their dams can also be washed away by the very floods they are expected to reduce. Presenting them as a simple solution to flooding risks disappointing the very people whose support reintroduction needs.

The concerns of farmers deserve to be taken seriously. Beavers can flood fields, block drainage ditches and damage crops, and they fell trees that landowners may value. Where rivers run through flat, intensively farmed land, even a small dam can cause significant problems. Some farmers also fear that once beavers are established, they will lose control over their own land, since the animals are protected. There are practical worries, too, about the cost of repairing damage and about who should pay for it.

These fears are understandable, but experience elsewhere suggests that most conflicts can be managed. In parts of Europe where beavers have been living alongside farming communities for decades, a range of techniques has been developed. Pipes can be installed through dams to keep water at an acceptable level, trees can be protected with wire fencing, and in extreme cases animals can be moved to another area. Crucially, schemes of this kind work best when landowners are given advice and financial support rather than being left to deal with problems alone. I would argue that any reintroduction programme which fails to provide such support is unlikely to succeed.

There is also a broader question about what kind of countryside we want. Critics sometimes argue that the landscapes of Britain have been shaped by people for thousands of years, and that returning a lost species is an attempt to recreate a past that can never exist again. This objection seems to me to misunderstand the purpose of reintroduction. The aim is not to turn back the clock, but to restore natural processes that make the landscape more resilient, particularly as climate change brings more frequent droughts and floods. Nor are beavers an exotic introduction; they are a native species that disappeared because of human activity.

The return of the beaver is, in the end, a test of whether we can share the land with animals that change it. Unlike species that live quietly in nature reserves, beavers do not respect property boundaries. If the reintroduction is handled well, with honest communication about both benefits and costs, it could become a model for the recovery of other species. If it is handled badly, it could harden opposition to rewilding for a generation. The next few years will show which of these outcomes is more likely.`,
      questions: [
        mcq(
          "What did the government in England decide in 2025?",
          [
            "to give farmers the right to remove beavers from their land",
            "to allow beavers to be released into the wild under licence",
            "to protect beavers in the same way as Scotland had in 2025",
            "to stop the hunting of beavers for their fur",
          ],
          "to allow beavers to be released into the wild under licence",
          "Beavers have been legally protected in Scotland since 2019, and in 2025 the government in England agreed to allow licensed releases of beavers into the wild for the first time in hundreds of years.",
          "England 'agreed to allow licensed releases'. C mixes up the dates: Scotland's protection dates from 2019.",
        ),
        mcq(
          "How do beaver dams help during dry periods?",
          [
            "by releasing stored water slowly",
            "by preventing insects from breeding",
            "by reducing the number of trees along streams",
            "by lowering the temperature of the water",
          ],
          "by releasing stored water slowly",
          "In dry periods, the stored water is released gradually, helping to keep streams flowing.",
          "The stored water 'is released gradually', keeping streams flowing.",
        ),
        mcq(
          "What criticism does the writer make of the argument that beavers are 'free engineers'?",
          [
            "It ignores the findings of scientific studies.",
            "It overstates what beavers are able to achieve.",
            "It pays too much attention to the concerns of farmers.",
            "It is mainly used by people who oppose reintroduction.",
          ],
          "It overstates what beavers are able to achieve.",
          "In my view, this argument is persuasive, but it is sometimes presented in a way that exaggerates what beavers can achieve.",
          "The writer finds it persuasive but says it 'exaggerates what beavers can achieve'.",
        ),
        mcq(
          "What point does the writer make in the final paragraph?",
          [
            "Beavers should be kept inside nature reserves.",
            "How the reintroduction is managed could affect attitudes to rewilding in general.",
            "Most people are already comfortable with animals that change the land.",
            "The reintroduction has already failed in some areas.",
          ],
          "How the reintroduction is managed could affect attitudes to rewilding in general.",
          "If it is handled badly, it could harden opposition to rewilding for a generation.",
          "Handled well it could be a model; handled badly it 'could harden opposition to rewilding for a generation'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "During heavy rain, beaver dams",
          "slow the flow of water downstream.",
          "During heavy rain, these structures slow the flow of water downstream, and several studies have found that they can reduce peak flows during floods.",
          "The dams 'slow the flow of water downstream' during heavy rain.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Pipes installed through a dam can",
          "keep water at an acceptable level.",
          "Pipes can be installed through dams to keep water at an acceptable level, trees can be protected with wire fencing, and in extreme cases animals can be moved to another area.",
          "Pipes are installed 'to keep water at an acceptable level'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Schemes for managing conflicts with beavers",
          "work best when landowners receive advice and money.",
          "Crucially, schemes of this kind work best when landowners are given advice and financial support rather than being left to deal with problems alone.",
          "'Advice and financial support' is paraphrased as 'advice and money'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Some of the beavers living wild before 2025",
          "were descended from animals that had escaped from enclosures.",
          "Small populations had in fact been living wild for some years before then, some descended from animals that had escaped from enclosures.",
          "Some were 'descended from animals that had escaped from enclosures'. The last ending is a trap: beavers had disappeared from Britain by the sixteenth century.",
        ),
        ynng(
          "Beavers can carry out useful environmental work that would otherwise be expensive.",
          "YES",
          "In my view, this argument is persuasive, but it is sometimes presented in a way that exaggerates what beavers can achieve.",
          "The writer calls the 'free engineer' argument — restoration work that would otherwise cost public money — 'persuasive'.",
        ),
        ynng(
          "Beavers are able to prevent flooding caused by major rivers.",
          "NO",
          "A dam on a small upland stream may help a village downstream, but beavers cannot prevent flooding caused by major rivers, and their benefits vary greatly from one location to another.",
          "The writer states that 'beavers cannot prevent flooding caused by major rivers'.",
        ),
        ynng(
          "Farmers' worries about beavers can safely be ignored.",
          "NO",
          "The concerns of farmers deserve to be taken seriously.",
          "The writer says farmers' concerns 'deserve to be taken seriously'.",
        ),
        ynng(
          "A reintroduction scheme that does not support landowners is likely to fail.",
          "YES",
          "I would argue that any reintroduction programme which fails to provide such support is unlikely to succeed.",
          "'Unlikely to succeed' means 'likely to fail', and 'I would argue' marks the writer's view.",
        ),
        ynng(
          "Some critics have misunderstood what reintroducing beavers is meant to achieve.",
          "YES",
          "This objection seems to me to misunderstand the purpose of reintroduction.",
          "The writer says the critics' objection seems 'to misunderstand the purpose of reintroduction'.",
        ),
        ynng(
          "Beavers will be released in Wales within the next few years.",
          "NOT GIVEN",
          "",
          "Wales is never mentioned, so the writer's view on it cannot be known.",
        ),
      ],
    },
  ],
};
