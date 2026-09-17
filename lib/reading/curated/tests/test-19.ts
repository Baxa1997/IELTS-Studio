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

// ---- Passage 1 · economic history · notes + True/False/Not Given -------------

const BOXES = {
  title: "The container revolution",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO ---------------------------

const HEADINGS = [
  "A library preserved by disaster",
  "Early attempts that caused damage",
  "Reading without opening",
  "Why the writing stayed invisible",
  "A worldwide contest and its rapid results",
  "What the texts have revealed so far",
  "Work that still lies ahead",
  "The destruction of Pompeii",
  "A dispute over who owns the scrolls",
  "A cheaper way to scan ancient objects",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const CHALLENGE_STEM = "Which TWO statements about the Vesuvius Challenge are made in the passage?";
const CHALLENGE = [
  "The scan data was made available online.",
  "It was organised by a university in Italy.",
  "The first word was identified by a student.",
  "The winners read every scroll in the collection.",
  "It ended after only one month.",
];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const PRACTICE_BANK = [
  "feedback",
  "improvement",
  "edge",
  "weaknesses",
  "centre",
  "strengths",
  "payment",
  "enjoyment",
];

export const TEST_19: CuratedTest = {
  key: "full-test-19",
  targetBand: 7,
  passages: [
    {
      key: "t19-p1-shipping-container",
      title: "How a Steel Box Shrank the World",
      topic: "how the shipping container transformed world trade",
      difficulty: 6,
      body: `Almost everything we buy, from smartphones to bananas, has spent part of its journey inside a steel box. Shipping containers, the standard-sized metal boxes seen stacked on ships, trains and lorries around the world, carry the great majority of manufactured goods traded between countries. Yet the container is a surprisingly recent invention, and its success depended less on clever engineering than on persistence, agreement on common standards and a willingness to challenge the way ports had operated for centuries.

Before the 1950s, cargo was loaded onto ships in much the same way as it had been in ancient times. Goods arrived at the port in sacks, barrels, crates and bundles of every shape and size, and teams of dockworkers carried or lifted them into the ship's hold one by one. The process was slow, expensive and dangerous, and a ship might spend as long in port being loaded and unloaded as it spent at sea. Theft from cargo was also common. By some estimates, loading and unloading accounted for around half of the total cost of transporting goods by sea.

The man most closely associated with changing this was Malcom McLean, an American who owned a large trucking company. According to a story he often told, the idea came to him in 1937 while he waited for hours at a port in New Jersey, watching his cargo being loaded piece by piece onto a ship. Why, he wondered, could the whole trailer not simply be lifted on board? Nearly two decades later, he put the idea into practice. In 1956, having bought a shipping company, he converted an old oil tanker, the Ideal X, to carry 58 metal containers on its deck.

The Ideal X sailed from Newark to Houston in April 1956, and the results were striking. McLean calculated that loading cargo in this way cost only a small fraction of the cost of loading loose goods. Within a few years, his company was operating ships designed specifically for containers, and other shipping lines began to follow. McLean also understood that containers were most valuable when the whole transport system was organised around them, from ships and cranes to the lorries that carried them inland.

At first, however, there was a serious problem: different companies used containers of different sizes, and their equipment could not handle each other's boxes. In the 1960s, after lengthy negotiations, international standards were agreed for the size of containers and for the fittings at their corners, which allow them to be locked together and lifted by any crane. The most common sizes are twenty and forty feet long, and a ship's capacity is still measured in "twenty-foot equivalent units". As a result, a container could travel from a factory in one country to a warehouse in another without its contents ever being touched.

The Vietnam War helped to demonstrate the value of the system. The United States military was struggling to supply its forces through crowded, poorly equipped ports, and in the late 1960s McLean's company won contracts to carry military supplies in containers. The success of these operations impressed military planners and brought the container to international attention. McLean also realised that his ships, which would otherwise have returned empty across the Pacific, could stop in Japan to collect goods for the American market, which helped to increase trade between Asia and the United States.

The effects on ports, and on those who worked in them, were dramatic. Container ships needed deep water, large areas of flat land for storing boxes and huge cranes, so many traditional city-centre docks, in places such as London and New York, declined, and new container ports were built elsewhere. The number of dockworkers fell sharply, and in several countries there were long and bitter strikes as unions fought to protect jobs. At the same time, the cost of shipping fell so much that it became economical to manufacture goods far from the places where they would be sold.

Today, the largest container ships can carry more than 24,000 twenty-foot units, and most of the world's busiest ports are in Asia, particularly in China. The container has been described as one of the most important forces behind globalisation. Its importance became especially visible in 2021, when a giant container ship became stuck in the Suez Canal for six days, blocking one of the world's busiest trade routes and delaying hundreds of other vessels. The incident reminded the world how much it depends on a simple steel box.`,
      questions: [
        noteLine(
          BOXES,
          "Before containers",
          "goods were loaded one by one by teams of ______",
          "dockworkers",
          "Goods arrived at the port in sacks, barrels, crates and bundles of every shape and size, and teams of dockworkers carried or lifted them into the ship's hold one by one.",
          "'Teams of dockworkers carried or lifted them' one by one.",
        ),
        noteLine(
          BOXES,
          "Before containers",
          "______ from cargo was a common problem",
          "theft",
          "Theft from cargo was also common.",
          "'Theft from cargo was also common.'",
        ),
        noteLine(
          BOXES,
          "Before containers",
          "loading and unloading made up about ______ of the cost of sea transport",
          "half",
          "By some estimates, loading and unloading accounted for around half of the total cost of transporting goods by sea.",
          "They 'accounted for around half of the total cost'.",
        ),
        noteLine(
          BOXES,
          "McLean's idea",
          "McLean owned a large ______ company",
          "trucking",
          "The man most closely associated with changing this was Malcom McLean, an American who owned a large trucking company.",
          "McLean 'owned a large trucking company'.",
        ),
        noteLine(
          BOXES,
          "McLean's idea",
          "1956: an old oil tanker converted to carry 58 metal ______",
          "containers",
          "In 1956, having bought a shipping company, he converted an old oil tanker, the Ideal X, to carry 58 metal containers on its deck.",
          "The Ideal X carried '58 metal containers'.",
        ),
        noteLine(
          BOXES,
          "Common standards",
          "standard fittings at the ______ let containers be locked together",
          "corners",
          "In the 1960s, after lengthy negotiations, international standards were agreed for the size of containers and for the fittings at their corners, which allow them to be locked together and lifted by any crane.",
          "The 'fittings at their corners' allow locking and lifting.",
        ),
        noteLine(
          BOXES,
          "Common standards",
          "ship capacity measured in twenty-foot equivalent ______",
          "units",
          'The most common sizes are twenty and forty feet long, and a ship\'s capacity is still measured in "twenty-foot equivalent units".',
          "Capacity is measured in 'twenty-foot equivalent units'.",
        ),
        noteLine(
          BOXES,
          "Effects",
          "many traditional city-centre ______ declined",
          "docks",
          "Container ships needed deep water, large areas of flat land for storing boxes and huge cranes, so many traditional city-centre docks, in places such as London and New York, declined, and new container ports were built elsewhere.",
          "'Many traditional city-centre docks ... declined'.",
        ),
        tfng(
          "Before containers, ships could spend as long in port as they did at sea.",
          "TRUE",
          "The process was slow, expensive and dangerous, and a ship might spend as long in port being loaded and unloaded as it spent at sea.",
          "A ship 'might spend as long in port ... as it spent at sea'.",
        ),
        tfng(
          "McLean first thought of the container idea while working as a sailor.",
          "FALSE",
          "According to a story he often told, the idea came to him in 1937 while he waited for hours at a port in New Jersey, watching his cargo being loaded piece by piece onto a ship.",
          "The idea came while he 'waited for hours at a port', as the owner of a trucking company.",
        ),
        tfng(
          "McLean's ships picked up goods in Japan on their way back to the United States.",
          "TRUE",
          "McLean also realised that his ships, which would otherwise have returned empty across the Pacific, could stop in Japan to collect goods for the American market, which helped to increase trade between Asia and the United States.",
          "His ships could 'stop in Japan to collect goods for the American market'.",
        ),
        tfng(
          "Dockworkers' unions accepted the container system without any resistance.",
          "FALSE",
          "The number of dockworkers fell sharply, and in several countries there were long and bitter strikes as unions fought to protect jobs.",
          "There were 'long and bitter strikes as unions fought to protect jobs'.",
        ),
        tfng(
          "The ship that blocked the Suez Canal in 2021 was the largest container ship in the world.",
          "NOT GIVEN",
          "",
          "The ship is called 'giant', but it is not compared with the largest ships of more than 24,000 units.",
        ),
      ],
    },
    {
      key: "t19-p2-herculaneum-scrolls",
      title: "Reading the Burnt Scrolls of Herculaneum",
      topic: "how scanning and machine learning are revealing ancient texts",
      difficulty: 7,
      body: `A) When Mount Vesuvius erupted in 79 CE, it buried the Roman towns of Pompeii and Herculaneum. At Herculaneum, a luxurious seaside villa, probably owned by a wealthy relative of Julius Caesar by marriage, was engulfed by a flow of superheated gas and volcanic material. Among its contents was a library of papyrus scrolls, the only complete library known to have survived from the ancient Greek and Roman world. Papyrus, made from the stems of a water plant, was the main writing material of the time. The heat turned the scrolls into lumps of carbon, but, strangely, it also preserved them: buried under many metres of volcanic rock, they survived for nearly 1,700 years.

B) The scrolls were discovered by workers digging tunnels in the 1750s. At first, the workers thought they were pieces of charcoal, and some were reportedly thrown away or burned. Once their true nature was recognised, scholars made many attempts to open them. Some were cut in half, others were treated with chemicals, and a machine invented by an Italian priest slowly unrolled a few of them over periods of months or even years. These efforts recovered parts of several texts, mostly works of philosophy, but many scrolls were damaged or destroyed in the process.

C) By the late twentieth century, it seemed that the remaining unopened scrolls might never be read, since any attempt to unroll them risked turning them to dust. The solution, when it came, was to read the scrolls without opening them at all. In the early 2000s, the American computer scientist Brent Seales began to develop a technique known as "virtual unwrapping". The idea was to scan a scroll using X-ray imaging, similar to that used in hospitals, and then use software to identify each layer of papyrus and flatten it out digitally on a screen. In principle, the text could then be read as if the scroll had been opened.

D) The method was first proven on a different object: a burnt scroll found at the site of an ancient synagogue in Israel, which was successfully read in 2015. The Herculaneum scrolls posed a much harder problem, however. The ink used by the ancient writers was made from carbon, the same material as the burnt papyrus, so it barely showed up in X-ray scans. For years, researchers could see the layers of the scrolls clearly but not the writing on them. Some scholars began to fear that the problem could never be solved.

E) In 2023, two technology investors, working with Seales, launched an international competition called the Vesuvius Challenge, offering prizes worth more than a million dollars in total to anyone who could read the scrolls. They published the scan data online and invited people around the world to develop machine-learning software to detect the ink. The approach worked with remarkable speed. In October 2023, a 21-year-old student identified the first word ever read from inside an unopened scroll: the Greek word for "purple". A few months later, a team of three young researchers won the main prize for revealing more than 2,000 letters from a single scroll. Many of the successful participants had no training in ancient languages or archaeology.

F) The text revealed by the winning team appears to be the work of Philodemus, a philosopher who lived in the first century BCE and who is believed to have been connected with the villa. It discusses pleasure, and whether things that are scarce give more enjoyment than those that are plentiful. In 2025, researchers also succeeded, for the first time, in reading the title of another scroll without opening it. Scholars have described these results as the beginning of a new era, since many of the works in the library have not survived anywhere else.

G) Significant challenges remain. Scanning a scroll requires access to a particle accelerator, a large and expensive machine that produces extremely powerful X-rays, and each scroll must be transported with great care. Only a small fraction of the text in the scanned scrolls has so far been read, and hundreds of scrolls in the collection have not yet been scanned. Some archaeologists also believe that more scrolls may still lie buried in parts of the villa that have never been excavated. If so, the techniques developed for the Vesuvius Challenge could one day allow whole lost works of ancient literature to be recovered. For scholars of the ancient world, few prospects could be more exciting.`,
      questions: [
        heading(
          "A",
          "A library preserved by disaster",
          "The heat turned the scrolls into lumps of carbon, but, strangely, it also preserved them: buried under many metres of volcanic rock, they survived for nearly 1,700 years.",
          "Paragraph A explains how the eruption both burnt and preserved the library.",
        ),
        heading(
          "B",
          "Early attempts that caused damage",
          "These efforts recovered parts of several texts, mostly works of philosophy, but many scrolls were damaged or destroyed in the process.",
          "Paragraph B describes cutting, chemicals and unrolling that destroyed many scrolls.",
        ),
        heading(
          "C",
          "Reading without opening",
          "The solution, when it came, was to read the scrolls without opening them at all.",
          "Paragraph C introduces virtual unwrapping.",
        ),
        heading(
          "D",
          "Why the writing stayed invisible",
          "The ink used by the ancient writers was made from carbon, the same material as the burnt papyrus, so it barely showed up in X-ray scans.",
          "Paragraph D explains why carbon ink could not be seen in scans.",
        ),
        heading(
          "E",
          "A worldwide contest and its rapid results",
          "The approach worked with remarkable speed.",
          "Paragraph E describes the Vesuvius Challenge and its quick successes.",
        ),
        heading(
          "F",
          "What the texts have revealed so far",
          "It discusses pleasure, and whether things that are scarce give more enjoyment than those that are plentiful.",
          "Paragraph F describes the content of the text that was read.",
        ),
        heading(
          "G",
          "Work that still lies ahead",
          "Significant challenges remain.",
          "Paragraph G lists what remains to be scanned, read and excavated.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "At first, the workers mistook the scrolls for pieces of ______.",
          "charcoal",
          "At first, the workers thought they were pieces of charcoal, and some were reportedly thrown away or burned.",
          "They 'thought they were pieces of charcoal'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "A machine invented by an Italian ______ slowly unrolled a few scrolls.",
          "priest",
          "Some were cut in half, others were treated with chemicals, and a machine invented by an Italian priest slowly unrolled a few of them over periods of months or even years.",
          "The machine was 'invented by an Italian priest'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The ancient ink was made from ______, like the burnt papyrus itself.",
          "carbon",
          "The ink used by the ancient writers was made from carbon, the same material as the burnt papyrus, so it barely showed up in X-ray scans.",
          "The ink 'was made from carbon, the same material as the burnt papyrus'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Scanning a scroll requires a particle ______.",
          "accelerator",
          "Scanning a scroll requires access to a particle accelerator, a large and expensive machine that produces extremely powerful X-rays, and each scroll must be transported with great care.",
          "It 'requires access to a particle accelerator'.",
        ),
        pickTwo(
          CHALLENGE_STEM,
          CHALLENGE,
          "A or C",
          "They published the scan data online and invited people around the world to develop machine-learning software to detect the ink.",
          "A is correct: 'they published the scan data online'. B is wrong — it was launched by two technology investors.",
        ),
        pickTwo(
          CHALLENGE_STEM,
          CHALLENGE,
          "A or C",
          'In October 2023, a 21-year-old student identified the first word ever read from inside an unopened scroll: the Greek word for "purple".',
          "C is correct: 'a 21-year-old student identified the first word'. D is wrong — only 'a small fraction' has been read.",
        ),
      ],
    },
    {
      key: "t19-p3-expertise",
      title: "What Makes an Expert?",
      topic: "what research really shows about practice and expert performance",
      difficulty: 8,
      body: `Few ideas from psychology have travelled as far beyond the laboratory as the claim that it takes 10,000 hours of practice to become an expert. Popularised by a best-selling book in 2008, the "10,000-hour rule" has been cited by coaches, business leaders and parents as proof that talent is largely a myth and that almost anyone can reach the top of their field with enough effort. It is an attractive message, and it contains an important truth. But the research on which it is based says something rather more complicated, and in my view the popular version has done as much to mislead as to inspire.

The rule has its origins in a study published in 1993 by the psychologist K. Anders Ericsson and his colleagues. They examined violin students at a music academy in Berlin, whom their teachers had divided into groups according to their ability. By asking the students to estimate how much they had practised at different ages, the researchers found that the best violinists had accumulated, on average, around 10,000 hours of solitary practice by the age of twenty, considerably more than the less accomplished groups. Ericsson argued that the crucial factor was not simply the quantity of practice but its quality: what he called "deliberate practice", activity specifically designed to improve performance, usually guided by a teacher and involving immediate feedback.

Ericsson himself later objected to the way his findings had been summarised. The figure of 10,000 hours, he pointed out, was an average rather than a threshold; some of the best violinists had practised considerably less, and in other fields the amount required to reach an elite level varied widely. Nor had the study shown that everyone who practised for 10,000 hours would become an expert. The rule, in other words, was a simplification that its original author did not endorse.

A more fundamental challenge came from research examining how much of the difference between people practice can actually explain. In 2014, a team of psychologists combined the results of dozens of studies in a single analysis. They found that deliberate practice accounted for about a quarter of the differences in performance in games such as chess, around a fifth in music and slightly less in sport, but only a small percentage in education and less than one per cent in professional occupations. Practice clearly mattered, the researchers concluded, but it left most of the variation unexplained.

What else might be involved? Candidates include the age at which a person starts, their working memory and other mental abilities, personality traits such as persistence, and genetic factors that influence physical characteristics. Studies of twins have suggested that the tendency to practise is itself partly inherited, which complicates any simple division between "nature" and "nurture". The environment matters too: access to good teachers, supportive families and opportunities to compete all shape how far a person can progress.

Supporters of the practice-based view have responded by questioning how practice was measured in some of these studies. Estimates of hours spent practising many years earlier are likely to be inaccurate, and not all practice is deliberate practice. I find these objections reasonable, but they cut both ways: if practice cannot be measured precisely, then claims about its overwhelming importance cannot be tested precisely either.

None of this should be taken to mean that effort is unimportant or that ability is fixed at birth. The evidence overwhelmingly shows that nobody reaches a high level of skill in a complex field without extensive practice, and that the kind of practice matters a great deal. Repeating what one can already do comfortably produces little improvement; progress comes from working at the edge of one's ability, identifying weaknesses and correcting them. For teachers and learners, this is perhaps the most useful lesson the research offers.

What should be abandoned is the notion that a single number can tell anyone how far they will go. The danger of the 10,000-hour rule is not that it encourages hard work, which is admirable, but that it may lead people to blame themselves, or others, for failing to achieve results that practice alone could never have guaranteed. A more honest message is less memorable but more useful: practice is necessary, the right kind of practice is essential, and what it can achieve differs from one person to another.`,
      questions: [
        mcq(
          "What is the writer's opinion of the popular 10,000-hour rule?",
          [
            "It has no basis in research at all.",
            "It has misled people as much as it has encouraged them.",
            "It should be taught in every school.",
            "It accurately reflects the original research.",
          ],
          "It has misled people as much as it has encouraged them.",
          "But the research on which it is based says something rather more complicated, and in my view the popular version has done as much to mislead as to inspire.",
          "The popular version 'has done as much to mislead as to inspire'.",
        ),
        mcq(
          "What did the 1993 study of violin students find?",
          [
            "Every student who practised for 10,000 hours became an expert.",
            "The best violinists had done more practice on their own than the others.",
            "Teachers were unable to judge their students' ability.",
            "Practising in groups was more effective than practising alone.",
          ],
          "The best violinists had done more practice on their own than the others.",
          "By asking the students to estimate how much they had practised at different ages, the researchers found that the best violinists had accumulated, on average, around 10,000 hours of solitary practice by the age of twenty, considerably more than the less accomplished groups.",
          "The best had 'around 10,000 hours of solitary practice', 'considerably more than the less accomplished groups'.",
        ),
        mcq(
          "How did Ericsson respond to the 10,000-hour rule?",
          [
            "He did not support it.",
            "He helped to make it popular.",
            "He changed his research to match it.",
            "He refused to comment on it.",
          ],
          "He did not support it.",
          "The rule, in other words, was a simplification that its original author did not endorse.",
          "It was 'a simplification that its original author did not endorse'.",
        ),
        mcq(
          "According to the 2014 analysis, in which area did practice explain the least?",
          ["games such as chess", "music", "education", "professional occupations"],
          "professional occupations",
          "They found that deliberate practice accounted for about a quarter of the differences in performance in games such as chess, around a fifth in music and slightly less in sport, but only a small percentage in education and less than one per cent in professional occupations.",
          "Practice explained 'less than one per cent in professional occupations', less than in education.",
        ),
        mcq(
          "Why does the writer mention studies of twins?",
          [
            "to prove that talent is entirely inherited",
            "to show that the line between inherited and learned ability is not clear",
            "to criticise the methods of the 2014 analysis",
            "to suggest that twins practise more than other people",
          ],
          "to show that the line between inherited and learned ability is not clear",
          'Studies of twins have suggested that the tendency to practise is itself partly inherited, which complicates any simple division between "nature" and "nurture".',
          "The twin studies 'complicate any simple division between nature and nurture'.",
        ),
        ynng(
          "The idea that effort matters contains some truth.",
          "YES",
          "It is an attractive message, and it contains an important truth.",
          "The writer says the message 'contains an important truth'.",
        ),
        ynng(
          "Objections to the way practice was measured are unreasonable.",
          "NO",
          "I find these objections reasonable, but they cut both ways: if practice cannot be measured precisely, then claims about its overwhelming importance cannot be tested precisely either.",
          "The writer finds 'these objections reasonable'.",
        ),
        ynng(
          "A person's ability is fixed from birth.",
          "NO",
          "None of this should be taken to mean that effort is unimportant or that ability is fixed at birth.",
          "The writer rejects the idea 'that ability is fixed at birth'.",
        ),
        ynng(
          "Chess players usually practise for more hours than musicians.",
          "NOT GIVEN",
          "",
          "The writer compares how much practice explains in each field, not how many hours people practise.",
        ),
        ynng(
          "The 10,000-hour rule may cause people to blame themselves unfairly.",
          "YES",
          "The danger of the 10,000-hour rule is not that it encourages hard work, which is admirable, but that it may lead people to blame themselves, or others, for failing to achieve results that practice alone could never have guaranteed.",
          "The rule 'may lead people to blame themselves' for results practice could not guarantee.",
        ),
        fromList(
          "summary_completion",
          PRACTICE_BANK,
          "Deliberate practice usually involves a teacher and immediate ______.",
          "feedback",
          'Ericsson argued that the crucial factor was not simply the quantity of practice but its quality: what he called "deliberate practice", activity specifically designed to improve performance, usually guided by a teacher and involving immediate feedback.',
          "Deliberate practice involves 'immediate feedback'.",
        ),
        fromList(
          "summary_completion",
          PRACTICE_BANK,
          "Repeating what one can already do easily brings little ______.",
          "improvement",
          "Repeating what one can already do comfortably produces little improvement; progress comes from working at the edge of one's ability, identifying weaknesses and correcting them.",
          "It 'produces little improvement'.",
        ),
        fromList(
          "summary_completion",
          PRACTICE_BANK,
          "Progress comes from working at the ______ of one's ability.",
          "edge",
          "Repeating what one can already do comfortably produces little improvement; progress comes from working at the edge of one's ability, identifying weaknesses and correcting them.",
          "Progress comes 'from working at the edge of one's ability'.",
        ),
        fromList(
          "summary_completion",
          PRACTICE_BANK,
          "Learners should find their ______ and correct them.",
          "weaknesses",
          "Repeating what one can already do comfortably produces little improvement; progress comes from working at the edge of one's ability, identifying weaknesses and correcting them.",
          "Progress involves 'identifying weaknesses and correcting them'.",
        ),
      ],
    },
  ],
};
