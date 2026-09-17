import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of medicine · flow-chart ----------------------------

const SCALE_UP = {
  title: "How penicillin production was increased",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO ------------------

const WHALE_PEOPLE = ["Hannah Clarke", "Tomás Ribeiro", "Anjali Menon", "Samuel Okafor"];
const WHALE_BANK = [
  "clicks",
  "families",
  "accents",
  "speed",
  "patterns",
  "microphones",
  "cameras",
  "songs",
  "colours",
  "depths",
];
const THREATS_STEM =
  "Which TWO threats to sperm whales in the Caribbean are mentioned in the passage?";
const THREATS = [
  "being hit by ships",
  "a shortage of squid",
  "becoming caught in fishing nets",
  "pollution from plastic",
  "rising sea temperatures",
];

// ---- Passage 3 · subject-heavy · lettered paragraphs and people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const FOSSIL_PEOPLE = ["Lena Hoffmann", "Arjun Rao", "Mei Chen", "Marcus Webb"];

export const TEST_14: CuratedTest = {
  key: "full-test-14",
  targetBand: 6,
  passages: [
    {
      key: "t14-p1-penicillin",
      title: "The Mould That Went to War",
      topic: "how penicillin was turned from a discovery into a medicine",
      difficulty: 5,
      body: `In September 1928, the Scottish scientist Alexander Fleming returned to his laboratory at St Mary's Hospital in London after a summer holiday. Among the glass dishes he had left on his bench were several in which he had been growing bacteria. On one of them, he noticed something unusual. A blue-green mould had started to grow, and around it the bacteria had disappeared. Fleming realised that the mould was producing a substance that killed bacteria, and he named it penicillin, after the mould, Penicillium. He later said that he had certainly not planned to change medicine when he started work that morning.

Fleming published his findings in 1929, but for about ten years little progress was made. Penicillin was extremely difficult to produce in large quantities, and the substance was unstable, losing its power quickly. Fleming himself was not a chemist, and he eventually turned his attention to other research. For several years, penicillin was used mainly in laboratories, to separate one type of bacteria from another. Most doctors at the time were unaware of the discovery, and those who knew about it doubted that it could ever be used to treat patients.

The situation changed at the University of Oxford at the end of the 1930s. A team led by the Australian scientist Howard Florey and the German-born chemist Ernst Chain began to investigate natural substances that could kill bacteria. They found a way to purify penicillin, and in 1940 they showed that it could protect mice from deadly infections. The team had very little money, and one of its members, Norman Heatley, designed much of the equipment himself, using everyday objects such as bathtubs, milk churns and even bedpans to grow the mould.

In 1941, the team treated its first human patient, a police officer who had developed a serious infection after scratching his face on a rose bush. His condition improved remarkably after he was given penicillin. However, the team did not have enough of the drug to continue the treatment, even though they recovered some of it from the patient's urine so that it could be used again. The patient died a few weeks later. The case showed both the power of penicillin and the urgent need to produce much more of it.

With Britain at war and its factories busy, Florey travelled to the United States in the summer of 1941 to look for help. He was directed to a government laboratory in Peoria, Illinois, which specialised in fermentation, the process of growing micro-organisms in large containers. The laboratory had years of experience in growing micro-organisms on an industrial scale. Scientists there made two important discoveries. First, they found that the mould produced far more penicillin when it was fed with corn steep liquor, a waste product from the process of making starch from maize. Second, they began searching for types of Penicillium that naturally produced more of the drug.

The search involved collecting mould from soil, food and other sources around the world. The most productive type, however, was eventually found much closer to home: on a mouldy melon bought at a market in Peoria in 1943. A laboratory assistant, Mary Hunt, who regularly brought in mouldy fruit for testing, became known as "Mouldy Mary". After further improvement in the laboratory, the mould from the melon produced many times more penicillin than Fleming's original type.

Producing penicillin on a large scale also required new methods. At first, the mould was grown on the surface of liquid in shallow bottles, which took up a great deal of space and needed many workers. Engineers then developed a method known as deep-tank fermentation, in which the mould grew throughout huge tanks of liquid that were constantly stirred and supplied with air. American drug companies, encouraged by the government, built large factories using this process. Production rose rapidly, and by the time Allied forces landed in Normandy in June 1944, more than two million doses had been prepared for the invasion.

After the war, penicillin became widely available to the public, and it transformed medicine. Infections that had often been fatal, such as pneumonia and blood poisoning, could now be cured. In 1945, Fleming, Florey and Chain shared the Nobel Prize in Medicine. In his Nobel lecture, Fleming warned that bacteria could become resistant to penicillin if it was used carelessly. His warning proved accurate: today, antibiotic resistance is recognised as one of the most serious threats to global health. Scientists continue to search for new antibiotics, but few new types have been discovered in recent decades.`,
      questions: [
        tfng(
          "Fleming noticed the effect of the mould before he left for his summer holiday.",
          "FALSE",
          "In September 1928, the Scottish scientist Alexander Fleming returned to his laboratory at St Mary's Hospital in London after a summer holiday.",
          "He noticed the mould when he 'returned to his laboratory' after the holiday.",
        ),
        tfng(
          "Most doctors in the 1930s knew about Fleming's discovery.",
          "FALSE",
          "Most doctors at the time were unaware of the discovery, and those who knew about it doubted that it could ever be used to treat patients.",
          "Most doctors 'were unaware of the discovery'.",
        ),
        tfng(
          "Norman Heatley made some of the Oxford team's equipment from household objects.",
          "TRUE",
          "The team had very little money, and one of its members, Norman Heatley, designed much of the equipment himself, using everyday objects such as bathtubs, milk churns and even bedpans to grow the mould.",
          "Heatley used 'everyday objects such as bathtubs, milk churns and even bedpans'.",
        ),
        tfng(
          "The first patient treated by the Oxford team made a full recovery.",
          "FALSE",
          "The patient died a few weeks later.",
          "He improved at first, but 'the patient died a few weeks later'.",
        ),
        tfng(
          "Florey visited several American universities before he went to Peoria.",
          "NOT GIVEN",
          "",
          "The passage says Florey was directed to Peoria, but not where else he went first.",
        ),
        tfng(
          "Mary Hunt received a reward for finding the productive mould.",
          "NOT GIVEN",
          "",
          "Mary Hunt earned a nickname, but the passage does not mention any reward.",
        ),
        tfng(
          "Fleming warned that using penicillin carelessly could make bacteria resistant to it.",
          "TRUE",
          "In his Nobel lecture, Fleming warned that bacteria could become resistant to penicillin if it was used carelessly.",
          "Fleming 'warned that bacteria could become resistant to penicillin if it was used carelessly'.",
        ),
        noteLine(
          SCALE_UP,
          null,
          "Scientists in Peoria feed the mould with corn steep ______",
          "liquor",
          "First, they found that the mould produced far more penicillin when it was fed with corn steep liquor, a waste product from the process of making starch from maize.",
          "The mould made more penicillin 'when it was fed with corn steep liquor'.",
          { before: [{ text: "Florey asks for help in the United States", indent: 0 }] },
        ),
        noteLine(
          SCALE_UP,
          null,
          "The most productive type is found on a ______ from a local market",
          "melon",
          "The most productive type, however, was eventually found much closer to home: on a mouldy melon bought at a market in Peoria in 1943.",
          "It was found 'on a mouldy melon bought at a market in Peoria'.",
          { before: [{ text: "Researchers collect mould from around the world", indent: 0 }] },
        ),
        noteLine(
          SCALE_UP,
          null,
          "The mould is grown throughout huge stirred ______",
          "tanks",
          "Engineers then developed a method known as deep-tank fermentation, in which the mould grew throughout huge tanks of liquid that were constantly stirred and supplied with air.",
          "In deep-tank fermentation the mould grew 'throughout huge tanks of liquid'.",
          {
            before: [
              { text: "Shallow bottles are replaced because they need too much space", indent: 0 },
            ],
          },
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In 1940, the Oxford team showed that penicillin could protect ______ from deadly infections.",
          "mice",
          "They found a way to purify penicillin, and in 1940 they showed that it could protect mice from deadly infections.",
          "Penicillin could 'protect mice from deadly infections'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The first patient's infection began when he scratched his face on a ______.",
          "rose bush",
          "In 1941, the team treated its first human patient, a police officer who had developed a serious infection after scratching his face on a rose bush.",
          "He scratched 'his face on a rose bush'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "After the war, penicillin could cure pneumonia and ______.",
          "blood poisoning",
          "Infections that had often been fatal, such as pneumonia and blood poisoning, could now be cured.",
          "It cured infections 'such as pneumonia and blood poisoning'.",
        ),
      ],
    },
    {
      key: "t14-p2-whale-codas",
      title: "Decoding the Clicks of Whales",
      topic: "the scientific effort to understand how sperm whales communicate",
      difficulty: 6,
      body: `Sperm whales are the largest toothed predators on Earth. Males can grow to more than sixteen metres in length, the animals regularly dive deeper than a thousand metres in search of squid, and they have the biggest brains of any creature that has ever been studied. They are also highly social. Females and their young live in close family groups, and they communicate using short sequences of clicks known as codas. For decades, scientists have wondered whether these codas might form something like a language. A project launched in 2020 is now attempting to find out.

The project, known as CETI, brings together marine biologists, linguists, engineers and experts in artificial intelligence. Its work is based mainly around the Caribbean island of Dominica, where a population of sperm whales has been studied closely for almost twenty years. Marine biologist Dr Hannah Clarke, who has worked with these whales for much of that time, explains that the researchers already know many of the animals as individuals. "We know their families, their friends and even their habits," she says. "That makes it possible to connect what they say with what they are doing."

Codas typically last less than two seconds. Earlier research had identified around twenty different types, which vary in the number of clicks and the spacing between them. Some codas appear to be shared by all members of a particular clan, a larger group of families, and they may help whales to recognise one another. Different clans in the Caribbean can be identified by their codas in much the same way that human communities can be identified by their accents. Young whales seem to learn the codas of their own clan as they grow up.

In 2024, the team published a study that changed the way scientists think about codas. By analysing thousands of recordings, they found that codas are more complex than had been believed. Whales can vary the overall speed of a coda, and they sometimes add an extra click at the end. They also adjust the rhythm smoothly during exchanges with other whales, rather like people changing the pace of their speech in conversation. When these features are combined, the number of possible codas is far greater than the twenty or so types that had been identified before. The researchers described the system as a kind of "phonetic alphabet".

Computer scientist Dr Anjali Menon, who works on the project's artificial intelligence systems, stresses that this does not mean the whales have a language like ours. "What we have found is a system with the building blocks that could support complex communication," she says. "Whether the whales use it that way is still an open question." Machine learning programs are being used to search the recordings for patterns that humans might miss, such as sequences that regularly appear before particular behaviours, like diving or feeding together.

Collecting enough data is one of the greatest challenges. Sperm whales spend much of their time deep underwater, where they are difficult to follow. The project uses underwater microphones fixed to the sea floor, as well as recording devices attached to the whales' skin with suction cups, which fall off after a few hours. Drones are also used to film the animals when they come to the surface to breathe. Engineer Tomás Ribeiro points out that modern language models are trained on billions of words, whereas even a large collection of whale recordings is tiny by comparison. "We may need many years of recordings before we can say anything with confidence," he says.

The research has also raised ethical questions. Some scientists have asked what the researchers would do if they were able to understand the whales, and whether humans should try to communicate with them at all. Marine policy expert Dr Samuel Okafor argues that the work could strengthen legal protection for whales. "If we can show that these animals have rich social lives and complex communication, it becomes much harder to ignore the harm that shipping noise and fishing nets cause them," he says. Collisions with ships remain one of the biggest threats to sperm whales in the Caribbean. Many whales are also injured or killed after becoming caught in fishing gear. In 2023, Dominica created a protected area for the whales off its western coast.

Others are more cautious about what the project can achieve. Clarke warns against expecting a translation of whale speech in the near future. "Whales live in an environment very different from ours, and their experiences may not match our words at all," she says. Even so, she believes the project has already changed how people think about animal communication. Whatever the whales are saying, it is clear that they have far more to say than anyone once imagined.`,
      questions: [
        fromList(
          "matching_features",
          WHALE_PEOPLE,
          "The whales' system of sounds may not be a language in the human sense.",
          "Anjali Menon",
          "Computer scientist Dr Anjali Menon, who works on the project's artificial intelligence systems, stresses that this does not mean the whales have a language like ours.",
          "Menon stresses that this 'does not mean the whales have a language like ours'.",
        ),
        fromList(
          "matching_features",
          WHALE_PEOPLE,
          "Research on whale communication could help to protect whales.",
          "Samuel Okafor",
          "Marine policy expert Dr Samuel Okafor argues that the work could strengthen legal protection for whales.",
          "Okafor argues the work 'could strengthen legal protection for whales'.",
        ),
        fromList(
          "matching_features",
          WHALE_PEOPLE,
          "Knowing whales as individuals helps researchers to link sounds with behaviour.",
          "Hannah Clarke",
          '"That makes it possible to connect what they say with what they are doing."',
          "Clarke says knowing the whales 'makes it possible to connect what they say with what they are doing'.",
        ),
        fromList(
          "matching_features",
          WHALE_PEOPLE,
          "It is unrealistic to expect whale communication to be translated soon.",
          "Hannah Clarke",
          "Clarke warns against expecting a translation of whale speech in the near future.",
          "Clarke 'warns against expecting a translation of whale speech in the near future'.",
        ),
        fromList(
          "matching_features",
          WHALE_PEOPLE,
          "The amount of whale data is very small compared with the data used to train AI language systems.",
          "Tomás Ribeiro",
          "Engineer Tomás Ribeiro points out that modern language models are trained on billions of words, whereas even a large collection of whale recordings is tiny by comparison.",
          "Ribeiro says whale recordings are 'tiny by comparison' with the billions of words used for language models.",
        ),
        fromList(
          "summary_completion",
          WHALE_BANK,
          "Codas are made up of ______ and usually last less than two seconds.",
          "clicks",
          "Females and their young live in close family groups, and they communicate using short sequences of clicks known as codas.",
          "Codas are 'short sequences of clicks'.",
        ),
        fromList(
          "summary_completion",
          WHALE_BANK,
          "A clan is a larger group made up of several ______.",
          "families",
          "Some codas appear to be shared by all members of a particular clan, a larger group of families, and they may help whales to recognise one another.",
          "A clan is 'a larger group of families'.",
        ),
        fromList(
          "summary_completion",
          WHALE_BANK,
          "Clans can be told apart by their codas, just as human communities can be told apart by their ______.",
          "accents",
          "Different clans in the Caribbean can be identified by their codas in much the same way that human communities can be identified by their accents.",
          "Human communities 'can be identified by their accents'.",
        ),
        fromList(
          "summary_completion",
          WHALE_BANK,
          "Whales are able to change the overall ______ of a coda.",
          "speed",
          "Whales can vary the overall speed of a coda, and they sometimes add an extra click at the end.",
          "Whales 'can vary the overall speed of a coda'.",
        ),
        fromList(
          "summary_completion",
          WHALE_BANK,
          "Computer programs search the recordings for ______ that people might not notice.",
          "patterns",
          "Machine learning programs are being used to search the recordings for patterns that humans might miss, such as sequences that regularly appear before particular behaviours, like diving or feeding together.",
          "Programs search 'for patterns that humans might miss'.",
        ),
        fromList(
          "summary_completion",
          WHALE_BANK,
          "To collect data, the project uses underwater ______ fixed to the sea floor.",
          "microphones",
          "The project uses underwater microphones fixed to the sea floor, as well as recording devices attached to the whales' skin with suction cups, which fall off after a few hours.",
          "The project uses 'underwater microphones fixed to the sea floor'. Drones, not cameras on the sea floor, film the whales.",
        ),
        pickTwo(
          THREATS_STEM,
          THREATS,
          "A or C",
          "Collisions with ships remain one of the biggest threats to sperm whales in the Caribbean.",
          "A is correct: 'collisions with ships' are one of the biggest threats. B is wrong — squid are mentioned only as the whales' food.",
        ),
        pickTwo(
          THREATS_STEM,
          THREATS,
          "A or C",
          "Many whales are also injured or killed after becoming caught in fishing gear.",
          "C is correct: whales are harmed 'after becoming caught in fishing gear'. D and E are not mentioned.",
        ),
      ],
    },
    {
      key: "t14-p3-denisovans",
      title: "The Mysterious Denisovans",
      topic: "what scientists have learned about an extinct group of ancient humans",
      difficulty: 7,
      body: `A) In 2008, archaeologists working in Denisova Cave, in the Altai Mountains of southern Siberia, found a tiny piece of finger bone. It belonged to a young girl who had died tens of thousands of years earlier, and at first it seemed unremarkable. But when geneticists extracted DNA from the bone and published their results in 2010, they revealed something extraordinary: the girl was neither a modern human nor a Neanderthal, but a member of a previously unknown group of ancient humans. The group was named the Denisovans, after the cave in which the bone had been found.

B) The discovery was unusual because it was made almost entirely through genetics. For most of the history of research into human evolution, new species have been identified from their skeletons. The Denisovans, by contrast, were known for years only from their genes and from a handful of teeth and bone fragments. "We had the complete genetic code of a population without knowing what its members looked like," says palaeoanthropologist Dr Lena Hoffmann. "It was like having someone's fingerprints but no photograph."

C) The genetic evidence soon produced further surprises. Comparisons with modern populations showed that people living today in Papua New Guinea, as well as Aboriginal Australians, have inherited a significant proportion of their DNA, perhaps four to six per cent, from Denisovans. Smaller amounts are found in populations across East and South Asia. This means that the ancestors of these people must have met and had children with Denisovans, even though the only confirmed Denisovan remains had been found thousands of kilometres away in Siberia. Geneticist Professor Arjun Rao believes that Denisovans must once have been spread across a vast area of Asia. "The genes tell us they were everywhere," he says, "even if their bones are not."

D) One of the most striking examples of this inheritance concerns a gene that helps people cope with life at high altitude. Many Tibetans carry a version of this gene that allows their bodies to function well in air with low levels of oxygen, and this version appears to have come from Denisovans. The finding suggested that Denisovans may once have lived on the Tibetan Plateau. In 2019, this idea was supported when researchers identified a jawbone found in a cave on the plateau, more than 3,000 metres above sea level, as Denisovan. Archaeologist Dr Mei Chen, who has worked on the plateau, describes their ability to survive there as remarkable. "Even today, these are among the harshest environments that humans inhabit," she says.

E) The jawbone was identified from ancient proteins preserved in one of its teeth, since no DNA survived. Proteins have become an important tool in the search for Denisovans, because they can survive far longer than DNA, especially in warm climates. In 2025, researchers reported that a jawbone brought up from the seabed near Taiwan also belonged to a Denisovan, extending the group's known range far to the south-east. In the same year, a nearly complete skull found in north-eastern China decades earlier, which had been given the nickname "Dragon Man", was linked to the Denisovans using proteins and genetic material recovered from the skull and from hardened deposits on its teeth. For the first time, scientists could see what a Denisovan face may have looked like: broad and heavy, with large brow ridges and very large teeth.

F) Not everyone accepts all of these conclusions. Palaeontologist Dr Marcus Webb points out that the Chinese skull had earlier been described as a separate species, and he argues that the scientific names given to ancient human groups have become confusing. "We should be careful not to force every fossil from Asia into a single category," he says. Others note that the genetic evidence suggests the existence of several distinct Denisovan populations, some of which may have been almost as different from one another as they were from Neanderthals. Hoffmann agrees that the picture is complicated, but she believes the new evidence has greatly strengthened the case for a single, widespread group with local variations.

G) The Denisovans also raise wider questions about the human past. Rao notes that for much of the last few hundred thousand years, several kinds of humans shared the planet and, at least occasionally, had children together. "The idea of a single line leading neatly to modern humans no longer fits the evidence," he says. Much remains unknown, including when the Denisovans disappeared and why. Webb believes that many of the answers lie in South-East Asia, where numerous caves remain unexplored. "The next chapter of this story is almost certainly buried in the tropics," he says, "and proteins will help us to read it."`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison between genetic information and a means of identifying a person",
          "B",
          '"It was like having someone\'s fingerprints but no photograph."',
          "Paragraph B compares the Denisovan genome to 'fingerprints but no photograph'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an estimate of how much Denisovan DNA some people have today",
          "C",
          "Comparisons with modern populations showed that people living today in Papua New Guinea, as well as Aboriginal Australians, have inherited a significant proportion of their DNA, perhaps four to six per cent, from Denisovans.",
          "Paragraph C gives 'perhaps four to six per cent'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the altitude of a place where Denisovan remains were found",
          "D",
          "In 2019, this idea was supported when researchers identified a jawbone found in a cave on the plateau, more than 3,000 metres above sea level, as Denisovan.",
          "Paragraph D: the cave is 'more than 3,000 metres above sea level'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of what a Denisovan may have looked like",
          "E",
          "For the first time, scientists could see what a Denisovan face may have looked like: broad and heavy, with large brow ridges and very large teeth.",
          "Paragraph E describes a face 'broad and heavy, with large brow ridges'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a prediction about where future discoveries may be made",
          "G",
          "Webb believes that many of the answers lie in South-East Asia, where numerous caves remain unexplored.",
          "Paragraph G: Webb expects answers from unexplored caves in South-East Asia.",
        ),
        fromList(
          "matching_features",
          FOSSIL_PEOPLE,
          "Denisovans must once have lived across a very wide area.",
          "Arjun Rao",
          "Geneticist Professor Arjun Rao believes that Denisovans must once have been spread across a vast area of Asia.",
          "Rao believes they were 'spread across a vast area of Asia'.",
        ),
        fromList(
          "matching_features",
          FOSSIL_PEOPLE,
          "Some high places where Denisovans lived are still very hard places for people to live.",
          "Mei Chen",
          '"Even today, these are among the harshest environments that humans inhabit," she says.',
          "Chen calls them 'among the harshest environments that humans inhabit'.",
        ),
        fromList(
          "matching_features",
          FOSSIL_PEOPLE,
          "Scientists should not be too quick to place all Asian fossils in one group.",
          "Marcus Webb",
          '"We should be careful not to force every fossil from Asia into a single category," he says.',
          "Webb warns against forcing 'every fossil from Asia into a single category'.",
        ),
        fromList(
          "matching_features",
          FOSSIL_PEOPLE,
          "Recent findings support the idea of one widespread group with regional differences.",
          "Lena Hoffmann",
          "Hoffmann agrees that the picture is complicated, but she believes the new evidence has greatly strengthened the case for a single, widespread group with local variations.",
          "Hoffmann supports 'a single, widespread group with local variations'.",
        ),
        fromList(
          "matching_features",
          FOSSIL_PEOPLE,
          "Human evolution did not follow a simple, single path.",
          "Arjun Rao",
          '"The idea of a single line leading neatly to modern humans no longer fits the evidence," he says.',
          "Rao says 'a single line leading neatly to modern humans no longer fits the evidence'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The first Denisovan remain to be found was a small piece of ______.",
          "finger bone",
          "In 2008, archaeologists working in Denisova Cave, in the Altai Mountains of southern Siberia, found a tiny piece of finger bone.",
          "The find was 'a tiny piece of finger bone'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "A gene variant carried by many ______ helps them live where there is little oxygen.",
          "Tibetans",
          "Many Tibetans carry a version of this gene that allows their bodies to function well in air with low levels of oxygen, and this version appears to have come from Denisovans.",
          "'Many Tibetans carry a version of this gene'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Proteins last much longer than DNA, particularly in ______.",
          "warm climates",
          "Proteins have become an important tool in the search for Denisovans, because they can survive far longer than DNA, especially in warm climates.",
          "Proteins survive longer 'especially in warm climates'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The skull from north-eastern China had been nicknamed ______.",
          "Dragon Man",
          'In the same year, a nearly complete skull found in north-eastern China decades earlier, which had been given the nickname "Dragon Man", was linked to the Denisovans using proteins and genetic material recovered from the skull and from hardened deposits on its teeth.',
          "The skull 'had been given the nickname \"Dragon Man\"'.",
        ),
      ],
    },
  ],
};
