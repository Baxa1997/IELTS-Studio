import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · science history · flow-chart --------------------------------

const DATING = {
  title: "How radiocarbon dating works",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO ------------------

const MEAT_PEOPLE = ["Laura Hendricks", "Rafael Duarte", "Kenji Watanabe", "Amira Saleh"];
const MEAT_BANK = [
  "beer",
  "sugars",
  "methane",
  "pollution",
  "blood",
  "traditions",
  "wine",
  "salt",
  "oxygen",
  "exports",
];
const SALES_STEM =
  "Which TWO statements about the sale of cultivated meat are made in the passage?";
const SALES = [
  "It has so far been sold only in small quantities.",
  "It is now cheaper than conventional meat in Singapore.",
  "A product for pets has gone on sale in the United Kingdom.",
  "It is widely available in European supermarkets.",
  "Italy was the first country to approve it.",
];

// ---- Passage 3 · subject-heavy · lettered paragraphs and people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const RING_PEOPLE = ["Clara Lindqvist", "Tom Okonjo", "Nadia Petrova", "Sven Aaberg"];

export const TEST_18: CuratedTest = {
  key: "full-test-18",
  targetBand: 6,
  passages: [
    {
      key: "t18-p1-radiocarbon",
      title: "Counting Time in Carbon",
      topic: "how scientists measure the age of ancient organic material",
      difficulty: 5,
      body: `How do archaeologists know that a piece of charcoal from an ancient fireplace is 10,000 years old, or that a wooden tool was made 4,000 years ago? For much of the twentieth century, the answer depended on a method that transformed the study of the past: radiocarbon dating. Before its invention, dates for prehistoric objects were often little more than educated guesses, based on the style of an object or the layer of soil in which it was found. Radiocarbon dating offered, for the first time, a way to measure the age of plant and animal remains directly.

The method was developed in the late 1940s by the American chemist Willard Libby and his colleagues at the University of Chicago. Libby had worked on nuclear research during the Second World War, and he realised that a natural form of carbon could act as a kind of clock. In 1960, he was awarded the Nobel Prize in Chemistry for this work. At the time, many archaeologists were astonished by the method, and some were reluctant to accept dates that contradicted their existing ideas.

The principle behind the method is relatively simple. High in the atmosphere, energy from space, known as cosmic rays, strikes nitrogen atoms and turns a small number of them into a rare form of carbon called carbon-14. This carbon combines with oxygen to form carbon dioxide, which is taken in by plants as they grow. Animals, including humans, absorb carbon-14 by eating plants or other animals. As a result, every living thing contains a small amount of carbon-14, in roughly the same proportion as the atmosphere.

When a plant or animal dies, it stops taking in new carbon. From that moment, the carbon-14 in its body begins to decay slowly, turning back into nitrogen. The decay happens at a steady rate: after about 5,730 years, half of the carbon-14 has gone, and after another 5,730 years, half of what remained has disappeared. By measuring how much carbon-14 is left in a sample and comparing it with the amount in living things, scientists can calculate how long ago the organism died. After about 50,000 years, however, so little carbon-14 remains that it can no longer be measured reliably.

Early measurements required fairly large samples, sometimes several grams of material, which meant that valuable objects had to be partly destroyed. The original method also counted the tiny bursts of radiation given off as carbon-14 atoms decayed, a process that could take days. In the late 1970s, a new technique was developed that uses a machine called an accelerator mass spectrometer to count the carbon-14 atoms directly. This technique needs only a few milligrams of material and produces results much more quickly.

Scientists also discovered that the amount of carbon-14 in the atmosphere has not always been constant. It has varied over time because of changes in the Earth's magnetic field and in the activity of the Sun. This means that a basic radiocarbon date must be corrected, or "calibrated", to give a calendar date. Calibration relies largely on tree rings, since each ring grows in a known year and preserves the carbon of that year. By measuring carbon-14 in rings of known age, scientists have built a detailed record stretching back thousands of years.

Human activity has also affected carbon-14 levels. Since the nineteenth century, the burning of fossil fuels, which contain no carbon-14 because they are millions of years old, has reduced its proportion in the atmosphere. In contrast, nuclear weapons tests in the 1950s and early 1960s almost doubled the amount of carbon-14 in the air. This "bomb pulse" has had unexpected uses: because it can show when living tissue was formed, it has helped scientists to estimate the age of sharks and to identify fake wines and illegal ivory.

Radiocarbon dating has helped to answer many famous questions. In 1988, for example, three laboratories tested small pieces of the Shroud of Turin, a cloth that some people believed had been used to wrap the body of Jesus. All three concluded that the cloth dated from between about 1260 and 1390, although some people continue to dispute the result. More importantly, the method has allowed archaeologists around the world to build reliable timelines for the spread of farming, the growth of cities and countless other developments in human history.`,
      questions: [
        tfng(
          "Before radiocarbon dating, the ages of prehistoric objects were often guessed.",
          "TRUE",
          "Before its invention, dates for prehistoric objects were often little more than educated guesses, based on the style of an object or the layer of soil in which it was found.",
          "Dates were 'often little more than educated guesses'.",
        ),
        tfng(
          "All archaeologists accepted radiocarbon dates as soon as the method appeared.",
          "FALSE",
          "At the time, many archaeologists were astonished by the method, and some were reluctant to accept dates that contradicted their existing ideas.",
          "'Some were reluctant to accept' the new dates.",
        ),
        tfng(
          "Material more than about 50,000 years old cannot be reliably dated by this method.",
          "TRUE",
          "After about 50,000 years, however, so little carbon-14 remains that it can no longer be measured reliably.",
          "After about 50,000 years, carbon-14 'can no longer be measured reliably'.",
        ),
        tfng(
          "The accelerator technique was first developed at the University of Chicago.",
          "NOT GIVEN",
          "",
          "Chicago is where Libby worked in the 1940s; the passage does not say where the 1970s technique was developed.",
        ),
        tfng(
          "The amount of carbon-14 in the atmosphere has always stayed the same.",
          "FALSE",
          "Scientists also discovered that the amount of carbon-14 in the atmosphere has not always been constant.",
          "The amount 'has not always been constant'.",
        ),
        tfng(
          "Everyone now agrees with the 1988 results for the Shroud of Turin.",
          "FALSE",
          "All three concluded that the cloth dated from between about 1260 and 1390, although some people continue to dispute the result.",
          "'Some people continue to dispute the result'.",
        ),
        tfng(
          "Radiocarbon dating is cheaper today than it was in the past.",
          "NOT GIVEN",
          "",
          "Newer methods are said to be faster and to need less material, but cost is never mentioned.",
        ),
        noteLine(
          DATING,
          null,
          "Carbon-14 joins with oxygen to form carbon ______",
          "dioxide",
          "This carbon combines with oxygen to form carbon dioxide, which is taken in by plants as they grow.",
          "It combines with oxygen 'to form carbon dioxide'.",
          { before: [{ text: "Cosmic rays turn some nitrogen atoms into carbon-14", indent: 0 }] },
        ),
        noteLine(
          DATING,
          null,
          "After death, the carbon-14 in the body starts to ______",
          "decay",
          "From that moment, the carbon-14 in its body begins to decay slowly, turning back into nitrogen.",
          "After death, the carbon-14 'begins to decay slowly'.",
          {
            before: [
              { text: "Plants and animals take in carbon-14 while they are alive", indent: 0 },
            ],
          },
        ),
        noteLine(
          DATING,
          null,
          "The result is ______ with the help of tree rings to give a calendar date",
          "calibrated",
          'This means that a basic radiocarbon date must be corrected, or "calibrated", to give a calendar date.',
          "The date must be 'corrected, or \"calibrated\"', using tree rings.",
          { before: [{ text: "Scientists measure how much carbon-14 remains", indent: 0 }] },
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "During the Second World War, Libby had worked on ______.",
          "nuclear research",
          "Libby had worked on nuclear research during the Second World War, and he realised that a natural form of carbon could act as a kind of clock.",
          "Libby 'had worked on nuclear research'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The technique developed in the 1970s needs only a few ______ of material.",
          "milligrams",
          "This technique needs only a few milligrams of material and produces results much more quickly.",
          "It 'needs only a few milligrams of material'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The 'bomb pulse' has helped scientists to estimate the age of ______.",
          "sharks",
          'This "bomb pulse" has had unexpected uses: because it can show when living tissue was formed, it has helped scientists to estimate the age of sharks and to identify fake wines and illegal ivory.',
          "It has helped 'to estimate the age of sharks'.",
        ),
      ],
    },
    {
      key: "t18-p2-cultivated-meat",
      title: "Meat Grown Without Animals",
      topic: "the promise and problems of meat grown from animal cells",
      difficulty: 6,
      body: `In December 2020, a restaurant in Singapore served a dish that had never been sold anywhere before: chicken that had been grown from animal cells in a factory rather than taken from a slaughtered bird. Singapore had become the first country to approve the sale of what is often called cultivated meat. Since then, the United States, Israel and a small number of other countries have given approval to similar products, and dozens of companies around the world are racing to bring them to market. Supporters believe the technology could transform the way humanity feeds itself. Critics are not so sure.

The process begins with a small sample of cells taken from a living animal, usually through a painless procedure. The cells are placed in large steel tanks called bioreactors, which are similar to those used to brew beer, and are fed a nutrient-rich liquid containing sugars, amino acids and other substances they need to grow. Over several weeks, the cells multiply many times over. They can then be harvested and formed into products such as burgers, nuggets or sausages. Food scientist Dr Laura Hendricks explains that the aim is to produce meat that is the same as conventional meat at the level of its cells. "We are not making a meat substitute," she says. "We are making meat, just without the animal."

The case for cultivated meat rests largely on the environmental and ethical problems of livestock farming. Raising animals uses a large share of the world's farmland and is a significant source of greenhouse gases, particularly methane from cattle. It is also linked to the loss of forests and to water pollution. Environmental economist Professor Rafael Duarte argues that if cultivated meat could be produced using renewable energy, it could greatly reduce these impacts. "The potential savings in land alone are enormous," he says. Supporters also point out that the technology would not require billions of animals to be raised and killed each year.

However, producing meat in this way has proved far harder and more expensive than early supporters predicted. The nutrient liquid used to feed the cells is costly, and for many years it contained a substance taken from the blood of unborn calves, which undermined the claim that no animals were harmed. Most companies have since developed alternatives that do not use animal products. Increasing production is another challenge. Bioengineer Dr Kenji Watanabe points out that cells grown in very large tanks are vulnerable to contamination by bacteria, which can ruin an entire batch. "In a brewery, a failed batch is annoying," he says. "Here, it can mean weeks of work and a great deal of money lost."

Energy use is another area of debate. A study published in 2023 suggested that if the growing liquid had to be purified to the standards used in the medicine industry, cultivated meat could have a larger carbon footprint than conventional beef. Duarte accepts that this is a risk, but he argues that the study depends on assumptions that may not hold as the industry develops. "The study describes a worst case," he says, "not an inevitable outcome."

Regulation and public opinion present further obstacles. In 2023, Italy passed a law banning the production and sale of cultivated meat, saying that it wished to protect its farming traditions, and several US states, including Florida, have introduced similar bans. Some farmers' organisations argue that the products should not be allowed to be called "meat" at all. Consumer researcher Dr Amira Saleh has found that people's willingness to try cultivated meat varies widely between countries. "Many people are curious," she says, "but they also worry about whether it is natural and safe to eat."

Price remains perhaps the biggest barrier. Costs have fallen dramatically since the first laboratory-grown burger was presented in London in 2013, having cost more than 250,000 euros to produce. Even so, cultivated meat is still far more expensive than conventional meat. So far, it has been sold only in small quantities, often in expensive restaurants. In 2025, a product for pets went on sale in the United Kingdom, where cultivated meat for humans had not yet been approved. Watanabe believes that it will be many years before cultivated meat costs the same as conventional meat.

For now, most experts see cultivated meat as one of several possible ways to reduce the environmental impact of food, alongside plant-based alternatives and changes in diet. Saleh believes that the industry will need to be open about its methods if it is to win public trust. Hendricks, meanwhile, remains optimistic. "Every new food technology has faced suspicion at first," she says. "What matters is whether we can make it affordable and prove that it is safe."`,
      questions: [
        fromList(
          "matching_features",
          MEAT_PEOPLE,
          "The product is real meat rather than an imitation of it.",
          "Laura Hendricks",
          '"We are not making a meat substitute," she says.',
          "Hendricks: 'We are not making a meat substitute... We are making meat'.",
        ),
        fromList(
          "matching_features",
          MEAT_PEOPLE,
          "A negative research finding describes only the worst possible situation.",
          "Rafael Duarte",
          '"The study describes a worst case," he says, "not an inevitable outcome."',
          "Duarte: the study 'describes a worst case'.",
        ),
        fromList(
          "matching_features",
          MEAT_PEOPLE,
          "Contamination during production can be very costly.",
          "Kenji Watanabe",
          '"Here, it can mean weeks of work and a great deal of money lost."',
          "Watanabe: a failed batch 'can mean weeks of work and a great deal of money lost'.",
        ),
        fromList(
          "matching_features",
          MEAT_PEOPLE,
          "Attitudes towards the product differ from one country to another.",
          "Amira Saleh",
          "Consumer researcher Dr Amira Saleh has found that people's willingness to try cultivated meat varies widely between countries.",
          "Saleh found that willingness 'varies widely between countries'.",
        ),
        fromList(
          "matching_features",
          MEAT_PEOPLE,
          "The product will not cost the same as ordinary meat for a long time.",
          "Kenji Watanabe",
          "Watanabe believes that it will be many years before cultivated meat costs the same as conventional meat.",
          "Watanabe: 'it will be many years before cultivated meat costs the same'.",
        ),
        fromList(
          "summary_completion",
          MEAT_BANK,
          "The cells grow in steel tanks like those used to make ______.",
          "beer",
          "The cells are placed in large steel tanks called bioreactors, which are similar to those used to brew beer, and are fed a nutrient-rich liquid containing sugars, amino acids and other substances they need to grow.",
          "The tanks are 'similar to those used to brew beer'.",
        ),
        fromList(
          "summary_completion",
          MEAT_BANK,
          "The cells are fed a liquid that contains amino acids and ______.",
          "sugars",
          "The cells are placed in large steel tanks called bioreactors, which are similar to those used to brew beer, and are fed a nutrient-rich liquid containing sugars, amino acids and other substances they need to grow.",
          "The liquid contains 'sugars, amino acids and other substances'.",
        ),
        fromList(
          "summary_completion",
          MEAT_BANK,
          "Cattle produce large amounts of the greenhouse gas ______.",
          "methane",
          "Raising animals uses a large share of the world's farmland and is a significant source of greenhouse gases, particularly methane from cattle.",
          "The passage mentions 'methane from cattle'.",
        ),
        fromList(
          "summary_completion",
          MEAT_BANK,
          "Livestock farming is connected with the loss of forests and with water ______.",
          "pollution",
          "It is also linked to the loss of forests and to water pollution.",
          "It is 'linked to the loss of forests and to water pollution'.",
        ),
        fromList(
          "summary_completion",
          MEAT_BANK,
          "Early nutrient liquids used a substance from the ______ of unborn calves.",
          "blood",
          "The nutrient liquid used to feed the cells is costly, and for many years it contained a substance taken from the blood of unborn calves, which undermined the claim that no animals were harmed.",
          "The substance was 'taken from the blood of unborn calves'.",
        ),
        fromList(
          "summary_completion",
          MEAT_BANK,
          "Italy banned cultivated meat in order to protect its farming ______.",
          "traditions",
          "In 2023, Italy passed a law banning the production and sale of cultivated meat, saying that it wished to protect its farming traditions, and several US states, including Florida, have introduced similar bans.",
          "Italy wished 'to protect its farming traditions'.",
        ),
        pickTwo(
          SALES_STEM,
          SALES,
          "A or C",
          "So far, it has been sold only in small quantities, often in expensive restaurants.",
          "A is correct: it 'has been sold only in small quantities'. B is wrong — it is 'still far more expensive than conventional meat'.",
        ),
        pickTwo(
          SALES_STEM,
          SALES,
          "A or C",
          "In 2025, a product for pets went on sale in the United Kingdom, where cultivated meat for humans had not yet been approved.",
          "C is correct: 'a product for pets went on sale in the United Kingdom'. E is wrong — Singapore was first, and Italy banned it.",
        ),
      ],
    },
    {
      key: "t18-p3-tree-rings",
      title: "Secrets in the Tree Rings",
      topic: "how tree rings are used to date the past and study the Sun",
      difficulty: 7,
      body: `A) Anyone who has looked at the stump of a felled tree will have noticed the rings that spread outwards from its centre. In regions with distinct seasons, most trees add one ring each year: a band of pale wood that grows quickly in spring, followed by a darker band of denser wood formed later in the season. Counting the rings reveals a tree's age. But the rings also contain a far richer record. Their width, density and chemistry reflect the conditions in which each ring grew, and scientists have learned to read this record with remarkable precision.

B) The science of dating wood from its rings, known as dendrochronology, was developed in the early twentieth century by the American astronomer Andrew Ellicott Douglass. Douglass was originally interested in whether changes in the Sun's activity affected the Earth's climate, and he hoped that tree rings might provide a long record of past rainfall. He noticed that trees in the same region showed the same pattern of wide and narrow rings, because they experienced the same good and bad years. By matching these patterns, he was able to link the rings of living trees with those of older, dead trees, extending the record far back in time.

C) This technique, known as cross-dating, allowed Douglass to solve a famous puzzle. For years, archaeologists had been unable to determine when the great stone settlements of the American South-West had been built, because the ring sequences from their timbers could not be connected to the sequence from living trees. In 1929, Douglass found a charred beam that filled the gap, allowing dozens of sites to be dated to the exact year. "It was one of those rare moments when a whole field changed overnight," says historian of science Dr Clara Lindqvist.

D) Today, long tree-ring sequences have been built for many parts of the world, and some stretch back more than 12,000 years. They are used to date historical buildings, ships and works of art, such as paintings on wooden panels. They also provide a record of past climate. Palaeoclimatologist Professor Tom Okonjo explains that tree rings can reveal droughts, cold summers and even volcanic eruptions that took place centuries before weather records began. "A thin ring is like a note in a diary saying that it was a hard year," he says.

E) In 2012, a Japanese researcher, Fusa Miyake, made a discovery that opened up a new use for tree rings. While measuring carbon-14 in the rings of ancient Japanese cedar trees, she found a sudden, sharp increase in the ring for the year 775. The increase was far too large to be explained by normal changes in the Sun's activity, and it was soon found in trees around the world. Scientists now believe that such events, which have become known as Miyake events, were caused by extreme bursts of energy from the Sun. Several more have since been identified, including one in about 660 BCE. Solar physicist Dr Nadia Petrova believes that a similar event today could seriously damage satellites and electricity networks. "It is not something we would want to experience in the modern world," she says.

F) Because a Miyake event appears in the same year in trees everywhere, it can serve as a precise marker in time. In 2021, researchers used this to date a Viking settlement in Newfoundland, Canada. They examined pieces of wood that had been cut with metal tools, which the local people of the time did not use, and located the ring from the year 993, when another event had occurred. By counting the rings from that point to the outer edge of the wood, they showed that the trees had been cut down in 1021, the earliest precisely dated evidence of Europeans in the Americas. "Before this, we could only say that Vikings were there sometime around the year 1000," says archaeologist Dr Sven Aaberg. "Now we have a single year."

G) Tree rings are not without limitations. Some species, especially in tropical regions, do not form clear annual rings, and in very dry years a tree may fail to produce a ring at all. Lindqvist also notes that the method depends on finding well-preserved wood, which is rare in many regions. Okonjo warns that tree rings record mainly the conditions of the growing season, so they may miss important changes at other times of year. Nonetheless, as new techniques allow scientists to measure the chemistry of individual rings in ever greater detail, the record held in the trees continues to grow. "We are still learning how much the trees remember," Okonjo says.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why trees produce pale and dark bands",
          "A",
          "In regions with distinct seasons, most trees add one ring each year: a band of pale wood that grows quickly in spring, followed by a darker band of denser wood formed later in the season.",
          "Paragraph A: pale wood grows in spring and darker wood later in the season.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the original reason for an early researcher's interest in tree rings",
          "B",
          "Douglass was originally interested in whether changes in the Sun's activity affected the Earth's climate, and he hoped that tree rings might provide a long record of past rainfall.",
          "Paragraph B: Douglass 'was originally interested' in the Sun and climate.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a find that allowed ancient settlements to be dated precisely",
          "C",
          "In 1929, Douglass found a charred beam that filled the gap, allowing dozens of sites to be dated to the exact year.",
          "Paragraph C: the charred beam let sites be 'dated to the exact year'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the length of time covered by the longest tree-ring records",
          "D",
          "Today, long tree-ring sequences have been built for many parts of the world, and some stretch back more than 12,000 years.",
          "Paragraph D: some sequences 'stretch back more than 12,000 years'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the use of evidence from tools as part of a dating study",
          "F",
          "They examined pieces of wood that had been cut with metal tools, which the local people of the time did not use, and located the ring from the year 993, when another event had occurred.",
          "Paragraph F: the wood 'had been cut with metal tools'.",
        ),
        fromList(
          "matching_features",
          RING_PEOPLE,
          "One discovery suddenly transformed a whole area of study.",
          "Clara Lindqvist",
          '"It was one of those rare moments when a whole field changed overnight," says historian of science Dr Clara Lindqvist.',
          "Lindqvist: 'a whole field changed overnight'.",
        ),
        fromList(
          "matching_features",
          RING_PEOPLE,
          "A narrow ring shows that growing conditions were difficult.",
          "Tom Okonjo",
          '"A thin ring is like a note in a diary saying that it was a hard year," he says.',
          "Okonjo: a thin ring says 'it was a hard year'.",
        ),
        fromList(
          "matching_features",
          RING_PEOPLE,
          "A similar solar event would cause serious problems today.",
          "Nadia Petrova",
          "Solar physicist Dr Nadia Petrova believes that a similar event today could seriously damage satellites and electricity networks.",
          "Petrova: such an event 'could seriously damage satellites and electricity networks'.",
        ),
        fromList(
          "matching_features",
          RING_PEOPLE,
          "It is now possible to give an exact year for a historical event.",
          "Sven Aaberg",
          '"Now we have a single year."',
          "Aaberg: 'Now we have a single year.'",
        ),
        fromList(
          "matching_features",
          RING_PEOPLE,
          "Tree rings may not show changes that happen outside the growing season.",
          "Tom Okonjo",
          "Okonjo warns that tree rings record mainly the conditions of the growing season, so they may miss important changes at other times of year.",
          "Okonjo warns they 'may miss important changes at other times of year'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In 1929, Douglass found a ______ that connected two ring sequences.",
          "charred beam",
          "In 1929, Douglass found a charred beam that filled the gap, allowing dozens of sites to be dated to the exact year.",
          "He found 'a charred beam that filled the gap'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Tree rings are used to date paintings on wooden ______.",
          "panels",
          "They are used to date historical buildings, ships and works of art, such as paintings on wooden panels.",
          "They date 'paintings on wooden panels'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Miyake found the sudden increase in the rings of ancient Japanese ______.",
          "cedar trees",
          "While measuring carbon-14 in the rings of ancient Japanese cedar trees, she found a sudden, sharp increase in the ring for the year 775.",
          "She measured 'the rings of ancient Japanese cedar trees'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some tropical species do not produce clear ______.",
          "annual rings",
          "Some species, especially in tropical regions, do not form clear annual rings, and in very dry years a tree may fail to produce a ring at all.",
          "Some species 'do not form clear annual rings'.",
        ),
      ],
    },
  ],
};
