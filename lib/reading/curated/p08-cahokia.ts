import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

const HEADINGS = [
  "The mystery of the city's decline",
  "A calendar built from timber",
  "The written records of Cahokia's rulers",
  "Monuments made of earth",
  "Food supplies and long-distance exchange",
  "The sudden rise of a planned city",
  "Why maize farming failed completely",
  "A people who moved rather than vanished",
];

function heading(
  paragraph: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain(
      "matching_headings",
      `Paragraph ${paragraph}`,
      answer,
      supporting_sentence,
      explanation,
    ),
    options: HEADINGS,
  };
}

function sentence(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("sentence_completion", prompt, answer, supporting_sentence, explanation),
    word_limit: "NO MORE THAN TWO WORDS",
  };
}

function choice(
  prompt: string,
  options: string[],
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return { ...plain("multiple_choice", prompt, answer, supporting_sentence, explanation), options };
}

export const CAHOKIA: CuratedPassage = {
  key: "cahokia-city-that-emptied",
  title: "Cahokia: The City That Emptied",
  topic: "the rise and abandonment of North America's largest ancient city",
  difficulty: 7,
  body: `A) Around the year 1050, something remarkable happened on the floodplain of the Mississippi River, close to the site of the modern city of St Louis. Within a few decades, a scattered collection of farming villages was transformed into a planned urban centre, larger than any other settlement north of Mexico at the time. At its height in the twelfth century, the city now known as Cahokia may have housed between 10,000 and 20,000 people, and perhaps many more if the surrounding communities are included. Its inhabitants left no written records, and even its original name has been lost; the name Cahokia comes from a group of Native Americans who lived in the area centuries later. Everything known about the city has been pieced together by archaeologists.

B) The most striking evidence of Cahokia's ambition is its earthworks. More than a hundred mounds were built across the site, many of them flat-topped platforms that supported temples, meeting houses or the homes of important families. The largest, now called Monks Mound, covers an area at its base comparable to that of the Great Pyramid of Giza and rises about thirty metres high. It was made entirely of soil, carried by hand in baskets, and archaeologists estimate that construction required millions of basketloads over several centuries. In front of it lay a vast open plaza, carefully levelled and filled, where large public ceremonies and games are thought to have taken place.

C) Cahokians also studied the sky. On the western side of the city, archaeologists discovered the remains of several large circles of wooden posts, which they nicknamed "Woodhenge". When posts were placed back in their original holes, researchers found that, viewed from a central point, the sun rose behind particular posts on the days of the solstices and equinoxes. This suggests that the circles served as a calendar, allowing leaders to time planting, harvests and religious festivals. Such knowledge would have been a source of considerable authority in a society that depended on the success of its crops.

D) Feeding such a population required an extensive agricultural system. Maize had become the most important crop, grown alongside squash, sunflowers and several native seed plants, and it was supplemented by fish, deer and waterbirds from the surrounding wetlands. Large pits filled with the remains of feasts suggest that food was sometimes consumed on a huge scale during public gatherings. Cahokia also sat at the centre of a trading network that reached across much of the continent. Excavations have uncovered copper from the Great Lakes region, shells from the Gulf of Mexico and stone tools made from materials found hundreds of kilometres away. Whether these goods arrived through direct trade, gifts between leaders or pilgrims visiting a religious centre remains a matter of debate.

E) Yet by around 1350 Cahokia was largely abandoned, and why its people left is one of the great puzzles of North American archaeology. One long-standing theory held that the inhabitants cut down so many trees for fuel and building that the surrounding hillsides eroded, causing severe flooding in the valley below. However, a study published in 2021 examined soil layers beneath one of the mounds and found no evidence of the kind of flood deposits this theory predicts. Other researchers point to changes in climate, including a series of droughts that would have damaged the maize harvest. Still others emphasise social and political pressures, such as conflict between groups or declining trust in the city's rulers, pointing to the tall wooden wall that was built around the central part of the city in its later years.

F) Most archaeologists now believe that no single cause was responsible, and that a combination of environmental stress and political difficulty made life in the city less attractive over several generations. They also stress that the story is not one of sudden collapse and disappearance. Cahokia's people did not vanish; they moved away, forming smaller communities elsewhere, and their descendants are among the Native American nations of today. Since 1982 the site has been a UNESCO World Heritage Site, and many descendant communities are now involved in deciding how its history should be researched and presented. Visitors can still climb the steps to the top of Monks Mound, from where the outlines of other mounds can be seen across the plain.`,
  questions: [
    heading(
      "A",
      "The sudden rise of a planned city",
      "Within a few decades, a scattered collection of farming villages was transformed into a planned urban centre, larger than any other settlement north of Mexico at the time.",
      "Paragraph A describes villages 'transformed into a planned urban centre' within a few decades. Heading iii is a trap: the paragraph says there were NO written records.",
    ),
    heading(
      "B",
      "Monuments made of earth",
      "The most striking evidence of Cahokia's ambition is its earthworks.",
      "Paragraph B is about the mounds, which were 'made entirely of soil'.",
    ),
    heading(
      "C",
      "A calendar built from timber",
      "This suggests that the circles served as a calendar, allowing leaders to time planting, harvests and religious festivals.",
      "The circles of wooden posts 'served as a calendar'.",
    ),
    heading(
      "D",
      "Food supplies and long-distance exchange",
      "Cahokia also sat at the centre of a trading network that reached across much of the continent.",
      "Paragraph D covers both farming and the continent-wide trading network. The maize heading is wrong: maize thrived here.",
    ),
    heading(
      "E",
      "The mystery of the city's decline",
      "Yet by around 1350 Cahokia was largely abandoned, and why its people left is one of the great puzzles of North American archaeology.",
      "Paragraph E sets out the competing explanations for the abandonment — 'one of the great puzzles'.",
    ),
    heading(
      "F",
      "A people who moved rather than vanished",
      "Cahokia's people did not vanish; they moved away, forming smaller communities elsewhere, and their descendants are among the Native American nations of today.",
      "The key point of Paragraph F is that the people 'did not vanish; they moved away'.",
    ),
    sentence(
      "The name Cahokia comes from a group of Native Americans who lived in the area ______ later.",
      "centuries",
      "Its inhabitants left no written records, and even its original name has been lost; the name Cahokia comes from a group of Native Americans who lived in the area centuries later.",
      "The later group lived there 'centuries later'.",
    ),
    sentence(
      "The soil used to build Monks Mound was carried by hand in ______.",
      "baskets",
      "It was made entirely of soil, carried by hand in baskets, and archaeologists estimate that construction required millions of basketloads over several centuries.",
      "The soil was 'carried by hand in baskets'. 'Basketloads' is the quantity, not the container.",
    ),
    sentence(
      "Copper found at the site came from the ______ region.",
      "Great Lakes",
      "Excavations have uncovered copper from the Great Lakes region, shells from the Gulf of Mexico and stone tools made from materials found hundreds of kilometres away.",
      "The copper came 'from the Great Lakes region'; the shells came from the Gulf of Mexico.",
    ),
    sentence(
      "In the city's later years, a tall wooden ______ was built around its centre.",
      "wall",
      "Still others emphasise social and political pressures, such as conflict between groups or declining trust in the city's rulers, pointing to the tall wooden wall that was built around the central part of the city in its later years.",
      "A 'tall wooden wall' surrounded the central part of the city.",
    ),
    choice(
      "What did researchers conclude about the circles of posts known as Woodhenge?",
      [
        "They were used to mark important dates in the year.",
        "They were mainly used for public games.",
        "They were built before the city began to grow.",
        "They recorded the positions of the planets.",
      ],
      "They were used to mark important dates in the year.",
      "This suggests that the circles served as a calendar, allowing leaders to time planting, harvests and religious festivals.",
      "The sunrise alignments suggest a calendar used to time planting, harvests and festivals. The games took place in the plaza described in Paragraph B.",
    ),
    choice(
      "What did the study published in 2021 find?",
      [
        "New evidence from the mounds supported the flooding theory.",
        "Soil samples could not be used to test the flooding theory.",
        "The evidence of flooding that the theory predicts was not found.",
        "Flooding had taken place only after the droughts.",
      ],
      "The evidence of flooding that the theory predicts was not found.",
      "However, a study published in 2021 examined soil layers beneath one of the mounds and found no evidence of the kind of flood deposits this theory predicts.",
      "The study 'found no evidence of the kind of flood deposits this theory predicts'. The droughts are a separate explanation.",
    ),
    choice(
      "What is the main point made in the final paragraph?",
      [
        "Cahokia's population was destroyed by a single disaster.",
        "The city declined over a long period and its people survived elsewhere.",
        "Archaeologists no longer carry out research at the site.",
        "The site has been closed to visitors to protect it.",
      ],
      "The city declined over a long period and its people survived elsewhere.",
      "Most archaeologists now believe that no single cause was responsible, and that a combination of environmental stress and political difficulty made life in the city less attractive over several generations.",
      "The decline happened 'over several generations', and the people moved away rather than disappearing. A contradicts 'no single cause'; D contradicts visitors climbing the mound.",
    ),
  ],
};
