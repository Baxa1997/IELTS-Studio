import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of invention · flow-chart ---------------------------

const LENS = {
  title: "How a Fresnel lighthouse lens works",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO ------------------

const VACCINE_PEOPLE = ["Clara Weston", "Marcus Bell", "Hannah Kimura", "Samuel Adeyemi"];
const VACCINE_BANK = [
  "eggs",
  "months",
  "instructions",
  "recognise",
  "headache",
  "combined",
  "weeks",
  "cells",
  "ignore",
  "fever",
];
const APPROVAL_STEM =
  "Which TWO facts about the approval of the mRNA flu vaccine are given in the passage?";
const APPROVAL = [
  "It covers adults aged 50 to 64.",
  "It was approved for use in children.",
  "The vaccine is expected to be available for the 2026 to 2027 flu season.",
  "It will replace all existing flu vaccines.",
  "It was approved in Europe first.",
];

// ---- Passage 3 · subject-heavy · lettered paragraphs and people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const AMAZON_PEOPLE = ["Beatriz Almeida", "Henrik Sørensen", "Noah Fischer", "Lucía Fernández"];

export const TEST_30: CuratedTest = {
  key: "full-test-30",
  targetBand: 8,
  passages: [
    {
      key: "t30-p1-fresnel-lens",
      title: "Light Across the Waves",
      topic: "how Augustin Fresnel's lens transformed lighthouses",
      difficulty: 7,
      body: `For most of history, lighthouses were surprisingly ineffective. Early lighthouses used open fires, and later ones burned candles or oil lamps, but much of the light they produced was wasted, spreading upwards into the sky or downwards towards the ground rather than out across the sea. By the late eighteenth century, some lighthouses used curved metal mirrors behind their lamps to direct the light towards the horizon. These reflectors helped, but they absorbed a considerable part of the light, and they quickly became dull as smoke and salt built up on their surfaces.

The solution came from Augustin-Jean Fresnel, a French engineer with a deep interest in the nature of light. In the early nineteenth century, scientists were divided over whether light consisted of tiny particles or travelled as waves. Fresnel carried out careful experiments and developed a mathematical theory that strongly supported the wave explanation. In 1819, he won a prize from the French Academy of Sciences for his work, even though some of the judges had at first been doubtful about his ideas.

In the same year, Fresnel was appointed to a French government commission responsible for lighthouses, and he turned his scientific knowledge to a practical problem. A conventional glass lens powerful enough to gather and direct the light from a lighthouse lamp would have to be extremely thick and heavy. It would also absorb much of the light passing through it, and it would be likely to crack as it heated and cooled. Fresnel realised that only the curved surface of a lens actually changes the direction of light, and that the glass inside does nothing useful. He therefore designed a lens made of a series of rings of glass, one inside another, each with a carefully calculated curve, which together acted like a single large lens but used far less material.

Fresnel also added rings of glass prisms above and below the central lens. These prisms caught light that would otherwise have escaped upwards or downwards and redirected it towards the horizon. The result was a beehive-shaped structure of glass that surrounded the lamp and gathered almost all of its light into a narrow, powerful beam. The first lighthouse to use one of Fresnel's lenses was the Cordouan lighthouse, at the mouth of the Gironde estuary in south-western France, in 1823. Its light could be seen from more than 30 kilometres away.

So that sailors could identify particular lighthouses, the lenses were often designed to rotate, so that the beam swept across the sea and appeared as a series of flashes. Each lighthouse could be given its own pattern of flashes, known as its character, which was recorded on sea charts. Because the lenses were extremely heavy, some weighing several tonnes, engineers later mounted them on a bath of mercury, which allowed them to turn smoothly with very little effort. The rotation was driven by clockwork machinery that had to be wound up regularly by the lighthouse keepers.

Fresnel lenses were produced in several standard sizes, known as orders. The largest, the first-order lens, stood more than three metres tall and was used for major coastal lighthouses, while smaller orders were used in harbours and on rivers. Manufacturing the lenses required great precision, and for decades the finest were made in France. Fresnel himself did not live to see his invention widely adopted; he died of tuberculosis in 1827, at the age of 39.

The new lenses spread slowly at first, partly because of their cost. In the United States, the authorities initially preferred cheaper reflector systems, and it was not until the 1850s, after an official investigation criticised the poor quality of American lighthouses, that Fresnel lenses were adopted on a large scale. Within a few years, almost every American lighthouse had been fitted with one. The improvement in visibility is thought to have saved countless ships and lives.

Today, many lighthouses are automated and use modern electric lights, and some historic Fresnel lenses have been moved to museums. However, the principle Fresnel developed is used more widely than ever before. Flat, lightweight Fresnel lenses are found in car headlights, projectors, solar energy collectors and some types of virtual reality headsets. Nearly two centuries after the first one was installed at Cordouan, Fresnel's design continues to shape the way we use light.`,
      questions: [
        tfng(
          "Much of the light from early lighthouses was lost upwards or downwards.",
          "TRUE",
          "Early lighthouses used open fires, and later ones burned candles or oil lamps, but much of the light they produced was wasted, spreading upwards into the sky or downwards towards the ground rather than out across the sea.",
          "The light was wasted, 'spreading upwards into the sky or downwards towards the ground'.",
        ),
        tfng(
          "Metal reflectors stayed clean and bright for long periods.",
          "FALSE",
          "These reflectors helped, but they absorbed a considerable part of the light, and they quickly became dull as smoke and salt built up on their surfaces.",
          "They 'quickly became dull'.",
        ),
        tfng(
          "All the judges accepted Fresnel's ideas from the start.",
          "FALSE",
          "In 1819, he won a prize from the French Academy of Sciences for his work, even though some of the judges had at first been doubtful about his ideas.",
          "'Some of the judges had at first been doubtful'.",
        ),
        tfng(
          "Fresnel received a large salary from the lighthouse commission.",
          "NOT GIVEN",
          "",
          "His appointment is mentioned, but not his pay.",
        ),
        tfng(
          "Sailors could recognise individual lighthouses by their patterns of flashes.",
          "TRUE",
          "Each lighthouse could be given its own pattern of flashes, known as its character, which was recorded on sea charts.",
          "Each lighthouse 'could be given its own pattern of flashes'.",
        ),
        tfng(
          "Fresnel lived to see his lenses used in most lighthouses.",
          "FALSE",
          "Fresnel himself did not live to see his invention widely adopted; he died of tuberculosis in 1827, at the age of 39.",
          "He 'did not live to see his invention widely adopted'.",
        ),
        tfng(
          "The first American lighthouse to use a Fresnel lens was in Boston.",
          "NOT GIVEN",
          "",
          "No particular American lighthouse is named.",
        ),
        noteLine(
          LENS,
          null,
          "Rings of glass ______ above and below the lens catch escaping light",
          "prisms",
          "Fresnel also added rings of glass prisms above and below the central lens.",
          "'Rings of glass prisms' were added above and below.",
          { before: [{ text: "The lamp sends light out in every direction", indent: 0 }] },
        ),
        noteLine(
          LENS,
          null,
          "This light is sent towards the ______",
          "horizon",
          "These prisms caught light that would otherwise have escaped upwards or downwards and redirected it towards the horizon.",
          "The prisms 'redirected it towards the horizon'.",
        ),
        noteLine(
          LENS,
          null,
          "Sailors see the moving beam as a series of ______",
          "flashes",
          "So that sailors could identify particular lighthouses, the lenses were often designed to rotate, so that the beam swept across the sea and appeared as a series of flashes.",
          "The beam 'appeared as a series of flashes'.",
          {
            before: [{ text: "The lens turns, so the beam sweeps across the sea", indent: 0 }],
          },
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A thick glass lens would be likely to ______ as it heated and cooled.",
          "crack",
          "It would also absorb much of the light passing through it, and it would be likely to crack as it heated and cooled.",
          "It 'would be likely to crack as it heated and cooled'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Heavy lenses were later mounted on a bath of ______.",
          "mercury",
          "Because the lenses were extremely heavy, some weighing several tonnes, engineers later mounted them on a bath of mercury, which allowed them to turn smoothly with very little effort.",
          "They were mounted 'on a bath of mercury'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Fresnel died of ______ at the age of 39.",
          "tuberculosis",
          "Fresnel himself did not live to see his invention widely adopted; he died of tuberculosis in 1827, at the age of 39.",
          "He 'died of tuberculosis in 1827'.",
        ),
      ],
    },
    {
      key: "t30-p2-mrna-flu-vaccine",
      title: "A Faster Flu Vaccine",
      topic: "the first flu vaccine made with mRNA technology",
      difficulty: 8,
      body: `Every year, seasonal influenza makes hundreds of millions of people ill around the world and causes hundreds of thousands of deaths. Vaccination is the most effective form of protection, but flu vaccines have long had a significant weakness: they are often only partly effective, and in some years they offer much less protection than in others. In August 2026, regulators in the United States approved a new type of flu vaccine that its developers hope will begin to change this. It is the first flu vaccine to use messenger RNA, or mRNA, the technology behind some of the most widely used vaccines against COVID-19.

The problem with traditional flu vaccines lies partly in the way they are made. Flu viruses change constantly, so the vaccine must be updated every year to match the strains expected to circulate. Health experts choose these strains months in advance, based on information gathered around the world. Most flu vaccines are then produced by growing the virus in chicken eggs, a process that takes around six months. If the virus changes during this period, or if it alters as it adapts to growing in eggs, the vaccine may be poorly matched to the virus that actually spreads. Virologist Dr Samuel Adeyemi explains that such mismatches are one of the main reasons why protection varies so much from one year to the next.

mRNA vaccines work differently. Instead of containing parts of a weakened or inactivated virus, they contain genetic instructions that tell the body's own cells to produce a harmless protein found on the surface of the virus. The immune system learns to recognise this protein and is then ready to fight the real virus. Because the instructions can be written and manufactured quickly once the genetic code of a strain is known, the developers say that an mRNA flu vaccine can be produced in a matter of weeks rather than months. Immunologist Dr Clara Weston says that this speed could allow vaccines to be based on more recent information. "The later you can choose the strains, the better your chances of matching what actually arrives," she says.

In a large clinical trial involving tens of thousands of adults aged 50 and over, the new vaccine was found to be up to about 27 per cent more effective at preventing flu than standard vaccines. The results were published in a leading medical journal in May 2026. The approval covers adults aged 50 to 64, while its use in people aged 65 and over was allowed under a faster procedure that requires further evidence to be provided later. The vaccine is expected to be available for the 2026 to 2027 flu season. Public health researcher Dr Marcus Bell describes the result as encouraging but not revolutionary. "A gain of that size is valuable, especially for older people," he says, "but it does not solve the basic challenge of a virus that keeps changing."

As with any new vaccine, the trial also recorded side effects. These were mostly mild and short-lived, such as a sore arm, tiredness and headache, although some were reported more often than with standard vaccines. Vaccine safety specialist Professor Hannah Kimura notes that monitoring will continue now that the vaccine is in wider use. "Rare effects can only be detected once millions of people have been vaccinated," she says. "That is why we keep watching after approval."

The approval came at a difficult time for mRNA vaccines. Although they were credited with saving many lives during the COVID-19 pandemic, they have also attracted public suspicion and political controversy in some countries, and government funding for some mRNA research has been reduced. The path to approval was not smooth either: at one stage, regulators declined to review the application, before that decision was reversed. Kimura believes that clear communication will be essential. "Trust has to be earned with every new product," she says.

Researchers hope that the technology will eventually lead to even better vaccines. Because mRNA vaccines can carry instructions for several proteins at once, they could be combined with vaccines against other infections of the lungs and airways, such as COVID-19, allowing people to be protected against several diseases with a single injection. Some scientists are also working towards a "universal" flu vaccine that would protect against many strains at once, including new strains that could cause a pandemic. Weston warns, however, that such a vaccine remains a distant goal. "Flu has defeated many confident predictions," she says.

For now, health authorities continue to recommend yearly flu vaccination with whichever vaccine is available, particularly for older people, pregnant women and those with long-term health conditions. The arrival of mRNA flu vaccines adds a new option rather than replacing existing ones. Whether it marks the beginning of a new era in flu prevention will depend on how the vaccine performs outside clinical trials, how quickly the technology can be improved and whether the public is willing to accept it.`,
      questions: [
        fromList(
          "matching_features",
          VACCINE_PEOPLE,
          "Poor matching explains much of the variation in how well flu vaccines work.",
          "Samuel Adeyemi",
          "Virologist Dr Samuel Adeyemi explains that such mismatches are one of the main reasons why protection varies so much from one year to the next.",
          "Adeyemi: mismatches are 'one of the main reasons why protection varies'.",
        ),
        fromList(
          "matching_features",
          VACCINE_PEOPLE,
          "Selecting strains later makes a good match more likely.",
          "Clara Weston",
          '"The later you can choose the strains, the better your chances of matching what actually arrives," she says.',
          "Weston: 'The later you can choose the strains, the better your chances'.",
        ),
        fromList(
          "matching_features",
          VACCINE_PEOPLE,
          "The improvement is useful but does not solve the underlying problem.",
          "Marcus Bell",
          '"A gain of that size is valuable, especially for older people," he says, "but it does not solve the basic challenge of a virus that keeps changing."',
          "Bell: the gain 'does not solve the basic challenge'.",
        ),
        fromList(
          "matching_features",
          VACCINE_PEOPLE,
          "Uncommon side effects appear only after very large numbers of people are vaccinated.",
          "Hannah Kimura",
          '"Rare effects can only be detected once millions of people have been vaccinated," she says.',
          "Kimura: 'Rare effects can only be detected once millions of people have been vaccinated.'",
        ),
        fromList(
          "matching_features",
          VACCINE_PEOPLE,
          "A vaccine that protects against all flu strains is still far off.",
          "Clara Weston",
          "Weston warns, however, that such a vaccine remains a distant goal.",
          "Weston: a universal vaccine 'remains a distant goal'.",
        ),
        fromList(
          "summary_completion",
          VACCINE_BANK,
          "Most flu vaccines are made by growing the virus in chicken ______.",
          "eggs",
          "Most flu vaccines are then produced by growing the virus in chicken eggs, a process that takes around six months.",
          "The virus is grown 'in chicken eggs'.",
        ),
        fromList(
          "summary_completion",
          VACCINE_BANK,
          "This traditional process takes about six ______.",
          "months",
          "Most flu vaccines are then produced by growing the virus in chicken eggs, a process that takes around six months.",
          "It 'takes around six months'. mRNA vaccines take weeks.",
        ),
        fromList(
          "summary_completion",
          VACCINE_BANK,
          "mRNA vaccines contain genetic ______ for making a harmless protein.",
          "instructions",
          "Instead of containing parts of a weakened or inactivated virus, they contain genetic instructions that tell the body's own cells to produce a harmless protein found on the surface of the virus.",
          "They 'contain genetic instructions'.",
        ),
        fromList(
          "summary_completion",
          VACCINE_BANK,
          "The immune system learns to ______ this protein.",
          "recognise",
          "The immune system learns to recognise this protein and is then ready to fight the real virus.",
          "It 'learns to recognise this protein'.",
        ),
        fromList(
          "summary_completion",
          VACCINE_BANK,
          "Side effects included a sore arm, tiredness and ______.",
          "headache",
          "These were mostly mild and short-lived, such as a sore arm, tiredness and headache, although some were reported more often than with standard vaccines.",
          "They included 'a sore arm, tiredness and headache'.",
        ),
        fromList(
          "summary_completion",
          VACCINE_BANK,
          "In future, mRNA flu vaccines could be ______ with vaccines against other infections.",
          "combined",
          "Because mRNA vaccines can carry instructions for several proteins at once, they could be combined with vaccines against other infections of the lungs and airways, such as COVID-19, allowing people to be protected against several diseases with a single injection.",
          "They 'could be combined with vaccines against other infections'.",
        ),
        pickTwo(
          APPROVAL_STEM,
          APPROVAL,
          "A or C",
          "The approval covers adults aged 50 to 64, while its use in people aged 65 and over was allowed under a faster procedure that requires further evidence to be provided later.",
          "A is correct: 'the approval covers adults aged 50 to 64'. B and E are not mentioned.",
        ),
        pickTwo(
          APPROVAL_STEM,
          APPROVAL,
          "A or C",
          "The vaccine is expected to be available for the 2026 to 2027 flu season.",
          "C is correct. D is wrong — it 'adds a new option rather than replacing existing ones'.",
        ),
      ],
    },
    {
      key: "t30-p3-amazon-cities",
      title: "Was the Amazon a Garden?",
      topic: "new evidence that ancient peoples shaped the Amazon rainforest",
      difficulty: 9,
      body: `A) For much of the twentieth century, the Amazon rainforest was widely regarded as a largely untouched wilderness, a place where nature had developed with little human interference. According to an influential view, the region's poor soils and harsh conditions had prevented the development of large, settled societies. The people who lived there, it was argued, were necessarily few in number and lived in small, mobile groups. One prominent American archaeologist famously described the Amazon as a "counterfeit paradise", whose apparent richness concealed an environment that could not support complex civilisations.

B) This picture has been dramatically revised over the past few decades. One of the first challenges came from the soil itself. In many parts of the Amazon, researchers have found patches of dark, highly fertile earth, known in Portuguese as terra preta, or "black earth". These soils contain charcoal, fragments of pottery and the remains of food and other waste, and they appear to have been created deliberately, or as a by-product of human settlement, over centuries. Remarkably, they remain fertile today, and farmers in the region still value them highly. Soil scientist Dr Beatriz Almeida describes them as a gift from the past. "These soils show that people were not just surviving in the forest," she says. "They were improving it."

C) Further evidence has come from the study of the forest itself. Ecologists have found that certain tree species that were useful to people, such as the Brazil nut and various fruit-bearing palms, are far more common near ancient settlements than would be expected by chance. This suggests that past inhabitants may have planted, protected or encouraged these species over many generations, shaping the make-up of the forest in ways that are still visible. Ecologist Professor Henrik Sørensen, however, warns that it is difficult to separate human influence from natural processes. "A tree may grow near a village because people planted it, or because people chose to live where it already grew," he says.

D) The most dramatic discoveries have been made using lidar, a technology that fires laser pulses from aircraft or drones and measures how long they take to return. Because some pulses pass through gaps in the leaves and reach the ground, lidar can reveal features hidden beneath dense vegetation. In 2022, researchers using lidar in the Bolivian Amazon described a network of large settlements belonging to a society that flourished between around 500 and 1400 CE, complete with platforms, earthen pyramids, reservoirs and raised causeways linking the sites. Two years later, another team reported an extensive network of settlements in the Upano Valley of Ecuador, occupied as early as around 2,500 years ago, which included thousands of earthen platforms, farmed fields and straight roads running for kilometres. Remote sensing specialist Dr Noah Fischer says the technology has transformed archaeology in forested regions. "Features that would take years to find on foot can now be mapped in days," he says.

E) Archaeologist Dr Lucía Fernández, who has worked in the region for two decades, says that these findings have changed the field completely. "We are no longer asking whether large societies existed in the Amazon, but how they were organised and how they managed their environment," she says. The settlements appear to have been designed to cope with the region's seasonal floods and to support dense populations without destroying the forest entirely. Some researchers describe this pattern as a kind of garden city, in which towns and farmland were spread across the landscape and mixed with managed forest.

F) Not all researchers accept the most ambitious interpretations. Sørensen points out that lidar surveys have so far covered only a small fraction of the Amazon, and that the areas studied may not be typical of the region as a whole. Large parts of the rainforest may indeed have been only lightly affected by people. Others note that estimates of the size of past populations remain highly uncertain. Almeida agrees that caution is needed, but she argues that the old image of an empty wilderness can no longer be defended.

G) The debate has implications beyond archaeology. If Amazonian peoples managed the forest for thousands of years without destroying it, their methods may offer lessons for sustainable land use today. Many of the region's present-day Indigenous communities continue to manage forests in ways that combine farming with conservation, and studies suggest that Indigenous territories often lose fewer trees than surrounding areas. Fernández believes that recognising this history matters. "Seeing the Amazon as a place shaped by people," she says, "helps us to see its Indigenous inhabitants as experts rather than as obstacles."`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a well-known description of the Amazon as deceptive",
          "A",
          'One prominent American archaeologist famously described the Amazon as a "counterfeit paradise", whose apparent richness concealed an environment that could not support complex civilisations.',
          "Paragraph A: the Amazon as a 'counterfeit paradise'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "soil that is still productive today",
          "B",
          "Remarkably, they remain fertile today, and farmers in the region still value them highly.",
          "Paragraph B: the soils 'remain fertile today'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the difficulty of deciding whether people or nature caused a pattern",
          "C",
          "Ecologist Professor Henrik Sørensen, however, warns that it is difficult to separate human influence from natural processes.",
          "Paragraph C: it is 'difficult to separate human influence from natural processes'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of how a technology can detect features below trees",
          "D",
          "Because some pulses pass through gaps in the leaves and reach the ground, lidar can reveal features hidden beneath dense vegetation.",
          "Paragraph D explains how lidar pulses reach the ground.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "evidence that Indigenous land loses fewer trees than other areas",
          "G",
          "Many of the region's present-day Indigenous communities continue to manage forests in ways that combine farming with conservation, and studies suggest that Indigenous territories often lose fewer trees than surrounding areas.",
          "Paragraph G: Indigenous territories 'often lose fewer trees'.",
        ),
        fromList(
          "matching_features",
          AMAZON_PEOPLE,
          "The evidence shows that ancient peoples did more than simply survive in the forest.",
          "Beatriz Almeida",
          '"These soils show that people were not just surviving in the forest," she says.',
          "Almeida: the soils show people 'were not just surviving in the forest'.",
        ),
        fromList(
          "matching_features",
          AMAZON_PEOPLE,
          "A tree growing near a settlement is not proof that people planted it.",
          "Henrik Sørensen",
          '"A tree may grow near a village because people planted it, or because people chose to live where it already grew," he says.',
          "Sørensen gives two possible explanations for a tree near a village.",
        ),
        fromList(
          "matching_features",
          AMAZON_PEOPLE,
          "Surveys that once took years can now be completed in days.",
          "Noah Fischer",
          '"Features that would take years to find on foot can now be mapped in days," he says.',
          "Fischer: features 'can now be mapped in days'.",
        ),
        fromList(
          "matching_features",
          AMAZON_PEOPLE,
          "Researchers now study how Amazonian societies were organised rather than whether they existed.",
          "Lucía Fernández",
          '"We are no longer asking whether large societies existed in the Amazon, but how they were organised and how they managed their environment," she says.',
          "Fernández: 'We are no longer asking whether large societies existed'.",
        ),
        fromList(
          "matching_features",
          AMAZON_PEOPLE,
          "The places surveyed so far may not be typical of the whole region.",
          "Henrik Sørensen",
          "Sørensen points out that lidar surveys have so far covered only a small fraction of the Amazon, and that the areas studied may not be typical of the region as a whole.",
          "Sørensen: the areas studied 'may not be typical of the region as a whole'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The Portuguese term terra preta means ______.",
          "black earth",
          'In many parts of the Amazon, researchers have found patches of dark, highly fertile earth, known in Portuguese as terra preta, or "black earth".',
          "Terra preta means 'black earth'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Terra preta contains charcoal, food remains and fragments of ______.",
          "pottery",
          "These soils contain charcoal, fragments of pottery and the remains of food and other waste, and they appear to have been created deliberately, or as a by-product of human settlement, over centuries.",
          "The soils contain 'fragments of pottery'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The Bolivian sites were linked by raised ______.",
          "causeways",
          "In 2022, researchers using lidar in the Bolivian Amazon described a network of large settlements belonging to a society that flourished between around 500 and 1400 CE, complete with platforms, earthen pyramids, reservoirs and raised causeways linking the sites.",
          "'Raised causeways' linked the sites.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The settlements were designed to cope with the region's seasonal ______.",
          "floods",
          "The settlements appear to have been designed to cope with the region's seasonal floods and to support dense populations without destroying the forest entirely.",
          "They were designed 'to cope with the region's seasonal floods'.",
        ),
      ],
    },
  ],
};
