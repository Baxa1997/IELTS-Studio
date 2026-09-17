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

// ---- Passage 1 · history of science · notes + True/False/Not Given -----------

const SURVEY = {
  title: "The Great Trigonometrical Survey",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO ---------------------------

const HEADINGS = [
  "Why the most successful battery raises concerns",
  "A plentiful alternative",
  "An old idea that was set aside",
  "From the laboratory to the market",
  "Safer and better in the cold",
  "The problem of weight",
  "A shared future for two technologies",
  "Recycling old lithium batteries",
  "A breakthrough in charging speed",
  "Government bans on lithium mining",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const USES_STEM = "Which TWO uses are sodium-ion batteries described as especially suitable for?";
const USES = [
  "storing energy from wind and solar power",
  "powering smartphones",
  "powering small city cars",
  "long-range electric vehicles",
  "passenger aircraft",
];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const WILL_BANK = [
  "veto",
  "coercion",
  "dishonestly",
  "mixed",
  "delay",
  "emotion",
  "generously",
  "identical",
];

export const TEST_23: CuratedTest = {
  key: "full-test-23",
  targetBand: 7,
  passages: [
    {
      key: "t23-p1-great-survey",
      title: "Measuring a Subcontinent",
      topic: "the survey that mapped India and measured the world's highest mountain",
      difficulty: 6,
      body: `In the early nineteenth century, a small team of surveyors began one of the most ambitious scientific projects of the age: measuring the Indian subcontinent with extraordinary precision. The Great Trigonometrical Survey, as it came to be known, would take more than sixty years to complete. It produced the first accurate maps of much of South Asia, added to scientific understanding of the shape of the Earth and, most famously, established the height of the world's tallest mountain.

The survey began in 1802 under the direction of William Lambton, an infantry officer with a passion for mathematics and astronomy. The British East India Company, which then controlled large parts of India, wanted better maps for administrative and military purposes, and Lambton persuaded it to support a survey based on the scientific method of triangulation. The work started near Madras, now Chennai, on the south-east coast of India.

Triangulation relies on a simple principle of geometry. If the length of one side of a triangle and the angles at each end of it are known, the lengths of the other two sides can be calculated. Surveyors therefore began by measuring a single straight line, called a baseline, with great care. They then measured the angles from each end of the baseline to a distant point, such as a hilltop, creating a triangle. One of the newly calculated sides then became the base for the next triangle, and in this way a chain of triangles could be extended across the country.

The first baseline, about 12 kilometres long, took weeks to measure. The surveyors used chains of steel links laid out in wooden boxes, which they supported on stands and moved forward step by step. Because metal expands in heat and contracts in cold, thermometers were placed alongside the chains so that corrections could be made. Measuring angles required an enormous instrument called a theodolite, which weighed about half a tonne and needed a team of men to carry it. On one occasion, while it was being lifted to the top of a temple, it was badly damaged when a rope broke, and Lambton spent six weeks repairing it himself.

The work was slow, difficult and often dangerous. Surveyors had to cross dense forests, deserts and swamps, and many suffered from malaria and other diseases. Where the land was flat, they had to build tall towers so that they could see from one station to the next, and in hazy weather they worked at night, using bright lamps as targets. Lambton continued working until the end of his life, and he died in 1823 while still in the field, far from any city.

Lambton's successor was George Everest, a demanding and often difficult man who insisted on the highest standards of accuracy. Everest introduced new instruments and methods, including improved equipment for measuring baselines, and he directed the measurement of the Great Arc, a line of triangles stretching more than 2,400 kilometres from the southern tip of India towards the Himalayas. By comparing measurements along the arc with observations of the stars, scientists could calculate how much the Earth bulges at the equator.

The survey's most famous result came after Everest had retired. In the late 1840s, surveyors measured the angles to a number of peaks in the Himalayas from stations more than 150 kilometres away. The calculations were carried out by a team of mathematicians, among them Radhanath Sikdar, a gifted Indian mathematician who had joined the survey as a young man. According to a well-known account, his calculations showed in 1852 that a mountain known to the surveyors simply as Peak XV was higher than any other known peak. After further checking, its height was announced in 1856 as 29,002 feet, or about 8,840 metres.

The surveyors did not know what local people called the mountain, and in 1865 it was named Mount Everest in honour of the former Surveyor General, despite his own objection that local people would find the name difficult to say. Modern measurements, using satellites and other advanced techniques, put the mountain's height at 8,849 metres, remarkably close to the original figure. The Great Trigonometrical Survey is now regarded as one of the great scientific achievements of its time, although historians also point out that it was carried out largely to serve the interests of a colonial power.`,
      questions: [
        noteLine(
          SURVEY,
          "Beginnings",
          "1802: started by Lambton, an ______ officer",
          "infantry",
          "The survey began in 1802 under the direction of William Lambton, an infantry officer with a passion for mathematics and astronomy.",
          "Lambton was 'an infantry officer'.",
        ),
        noteLine(
          SURVEY,
          "Beginnings",
          "work began near ______ on the south-east coast",
          "Madras/Chennai",
          "The work started near Madras, now Chennai, on the south-east coast of India.",
          "The work 'started near Madras, now Chennai'.",
        ),
        noteLine(
          SURVEY,
          "Method",
          "first, a straight line called a ______ was measured",
          "baseline",
          "Surveyors therefore began by measuring a single straight line, called a baseline, with great care.",
          "The first line measured was 'called a baseline'.",
        ),
        noteLine(
          SURVEY,
          "Method",
          "steel chains were laid out in wooden ______",
          "boxes",
          "The surveyors used chains of steel links laid out in wooden boxes, which they supported on stands and moved forward step by step.",
          "The chains were 'laid out in wooden boxes'.",
        ),
        noteLine(
          SURVEY,
          "Method",
          "______ placed beside the chains to correct for heat and cold",
          "thermometers",
          "Because metal expands in heat and contracts in cold, thermometers were placed alongside the chains so that corrections could be made.",
          "'Thermometers were placed alongside the chains'.",
        ),
        noteLine(
          SURVEY,
          "Method",
          "angles measured with a ______ weighing about half a tonne",
          "theodolite",
          "Measuring angles required an enormous instrument called a theodolite, which weighed about half a tonne and needed a team of men to carry it.",
          "Angles needed 'an enormous instrument called a theodolite'.",
        ),
        noteLine(
          SURVEY,
          "Difficulties",
          "tall towers built where the land was ______",
          "flat",
          "Where the land was flat, they had to build tall towers so that they could see from one station to the next, and in hazy weather they worked at night, using bright lamps as targets.",
          "Towers were needed 'where the land was flat'.",
        ),
        noteLine(
          SURVEY,
          "Difficulties",
          "in hazy weather, bright ______ used as targets at night",
          "lamps",
          "Where the land was flat, they had to build tall towers so that they could see from one station to the next, and in hazy weather they worked at night, using bright lamps as targets.",
          "They used 'bright lamps as targets'.",
        ),
        tfng(
          "The East India Company wanted maps partly for military reasons.",
          "TRUE",
          "The British East India Company, which then controlled large parts of India, wanted better maps for administrative and military purposes, and Lambton persuaded it to support a survey based on the scientific method of triangulation.",
          "It wanted maps 'for administrative and military purposes'.",
        ),
        tfng(
          "The first baseline was measured in a single day.",
          "FALSE",
          "The first baseline, about 12 kilometres long, took weeks to measure.",
          "It 'took weeks to measure'.",
        ),
        tfng(
          "Lambton paid a specialist to repair the damaged theodolite.",
          "FALSE",
          "On one occasion, while it was being lifted to the top of a temple, it was badly damaged when a rope broke, and Lambton spent six weeks repairing it himself.",
          "Lambton 'spent six weeks repairing it himself'.",
        ),
        tfng(
          "George Everest was well liked by the surveyors who worked for him.",
          "NOT GIVEN",
          "",
          "Everest is called demanding and difficult, but his popularity with his staff is not discussed.",
        ),
        tfng(
          "Everest was pleased that the mountain was named after him.",
          "FALSE",
          "The surveyors did not know what local people called the mountain, and in 1865 it was named Mount Everest in honour of the former Surveyor General, despite his own objection that local people would find the name difficult to say.",
          "It was named 'despite his own objection'.",
        ),
      ],
    },
    {
      key: "t23-p2-sodium-batteries",
      title: "Batteries Made from Salt",
      topic: "the rise of sodium-ion batteries as an alternative to lithium",
      difficulty: 7,
      body: `A) Lithium-ion batteries power almost every modern portable device, from mobile phones to laptops, and they have made the rapid growth of electric vehicles possible. Their success has been remarkable: since the early 1990s, their cost has fallen by more than 90 per cent. But the growing demand for batteries has also raised concerns. Lithium, together with other metals used in many batteries, such as cobalt and nickel, must be mined, often in a small number of countries, and problems with supply can cause prices to rise sharply. Between 2021 and 2022, for example, the price of lithium increased several times over before falling again. Such swings make it difficult for manufacturers to plan, and they can slow the adoption of electric vehicles. Mining also raises environmental concerns, since extracting lithium can use large quantities of water in dry regions.

B) These concerns have revived interest in an alternative: batteries based on sodium, one of the elements in ordinary table salt. Sodium is chemically similar to lithium, which means that a sodium-ion battery can work in much the same way, with charged particles moving between two electrodes as the battery is charged and used. The crucial difference is that sodium is about a thousand times more abundant than lithium in the Earth's crust, and it can be obtained cheaply from seawater and salt deposits almost anywhere in the world. Many sodium-ion designs can also use aluminium instead of copper in one part of the battery, which reduces costs further.

C) The idea itself is not new. Researchers investigated sodium-ion batteries in the 1970s and 1980s, at the same time as lithium-ion technology was being developed. However, lithium-ion batteries could store more energy for their weight, and they quickly attracted most of the commercial investment. For decades, research on sodium-ion batteries continued on a much smaller scale, and few people expected the technology ever to compete with its more successful rival. Scientists also struggled to find materials that could hold the larger sodium atoms without breaking down after repeated charging.

D) In recent years, that situation has changed. In 2021, one of the world's largest battery manufacturers, a Chinese company, announced its first sodium-ion battery, and several companies have since begun mass production. Small electric cars and electric scooters powered by sodium-ion batteries have gone on sale in China, and large sodium-ion systems have been installed to store electricity for the power grid. Analysts expect production to grow rapidly over the coming decade, as factories are built and costs fall. Some forecasts suggest that sodium-ion batteries could eventually take a significant share of the market for storing electricity.

E) Sodium-ion batteries have several practical advantages. They generally perform better than lithium-ion batteries in very cold weather, keeping more of their capacity at temperatures well below freezing. They are also considered less likely to catch fire, and they can be transported safely with no charge at all, which reduces risks during shipping. Because they do not need cobalt or nickel, they avoid some of the environmental and ethical problems associated with mining those metals. Some manufacturers also claim that their sodium-ion batteries can be charged unusually quickly, although such claims have yet to be widely tested.

F) However, the technology also has important limitations. Sodium atoms are larger and heavier than lithium atoms, so sodium-ion batteries store less energy for a given weight. This means that an electric car with a sodium-ion battery would be heavier, or would travel a shorter distance on a single charge, than a similar car with a lithium-ion battery. For this reason, sodium-ion batteries are unlikely to replace lithium-ion batteries in products where weight matters most, such as smartphones and long-range vehicles. Researchers are working to narrow this gap, but most experts believe that it will never disappear completely.

G) Experts therefore expect the two technologies to exist side by side. Sodium-ion batteries seem best suited to uses where cost and safety matter more than weight, such as storing energy from wind and solar power. They are also a good match for small city cars, which rarely need to travel long distances. Some manufacturers are even developing vehicles that combine both types of battery in a single pack. Whether sodium-ion batteries become truly widespread will depend partly on the price of lithium: when lithium is cheap, the case for switching is weaker. Nonetheless, many analysts believe that having a second, widely available option will make the move to clean energy more secure.`,
      questions: [
        heading(
          "A",
          "Why the most successful battery raises concerns",
          "But the growing demand for batteries has also raised concerns.",
          "Paragraph A describes the success of lithium-ion batteries and the supply worries.",
        ),
        heading(
          "B",
          "A plentiful alternative",
          "The crucial difference is that sodium is about a thousand times more abundant than lithium in the Earth's crust, and it can be obtained cheaply from seawater and salt deposits almost anywhere in the world.",
          "Paragraph B stresses how abundant and cheap sodium is.",
        ),
        heading(
          "C",
          "An old idea that was set aside",
          "For decades, research on sodium-ion batteries continued on a much smaller scale, and few people expected the technology ever to compete with its more successful rival.",
          "Paragraph C explains that sodium-ion research began early but was overshadowed.",
        ),
        heading(
          "D",
          "From the laboratory to the market",
          "In 2021, one of the world's largest battery manufacturers, a Chinese company, announced its first sodium-ion battery, and several companies have since begun mass production.",
          "Paragraph D describes mass production and products on sale.",
        ),
        heading(
          "E",
          "Safer and better in the cold",
          "They generally perform better than lithium-ion batteries in very cold weather, keeping more of their capacity at temperatures well below freezing.",
          "Paragraph E lists cold-weather performance and lower fire risk.",
        ),
        heading(
          "F",
          "The problem of weight",
          "Sodium atoms are larger and heavier than lithium atoms, so sodium-ion batteries store less energy for a given weight.",
          "Paragraph F explains that sodium-ion batteries store less energy for their weight.",
        ),
        heading(
          "G",
          "A shared future for two technologies",
          "Experts therefore expect the two technologies to exist side by side.",
          "Paragraph G predicts the two technologies will be used side by side.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Many batteries use lithium together with cobalt and ______, which must all be mined.",
          "nickel",
          "Lithium, together with other metals used in many batteries, such as cobalt and nickel, must be mined, often in a small number of countries, and problems with supply can cause prices to rise sharply.",
          "The metals include 'cobalt and nickel'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Sodium is one of the elements in ordinary table ______.",
          "salt",
          "These concerns have revived interest in an alternative: batteries based on sodium, one of the elements in ordinary table salt.",
          "Sodium is 'one of the elements in ordinary table salt'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Sodium-ion batteries keep more of their capacity at temperatures well below ______.",
          "freezing",
          "They generally perform better than lithium-ion batteries in very cold weather, keeping more of their capacity at temperatures well below freezing.",
          "They keep capacity 'at temperatures well below freezing'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "They can be transported safely with no ______ at all.",
          "charge",
          "They are also considered less likely to catch fire, and they can be transported safely with no charge at all, which reduces risks during shipping.",
          "They 'can be transported safely with no charge at all'.",
        ),
        pickTwo(
          USES_STEM,
          USES,
          "A or C",
          "Sodium-ion batteries seem best suited to uses where cost and safety matter more than weight, such as storing energy from wind and solar power.",
          "A is correct: they suit 'storing energy from wind and solar power'. B is wrong — they are unlikely to replace lithium in smartphones.",
        ),
        pickTwo(
          USES_STEM,
          USES,
          "A or C",
          "They are also a good match for small city cars, which rarely need to travel long distances.",
          "C is correct: they are 'a good match for small city cars'. D is wrong — long-range vehicles need lighter batteries.",
        ),
      ],
    },
    {
      key: "t23-p3-free-will",
      title: "Do We Really Have Free Will?",
      topic: "what brain research can and cannot tell us about free will",
      difficulty: 8,
      body: `Few questions are as old, or as difficult, as whether human beings have free will. Philosophers have debated for more than two thousand years whether our choices are genuinely our own or whether they are determined by causes beyond our control. In recent decades, the debate has moved into the laboratory, as neuroscientists have attempted to study the processes in the brain that lead to decisions. Some have claimed that their findings show free will to be an illusion. In my view, the experiments are fascinating, but they do not justify such a dramatic conclusion.

The most famous research in this area was carried out in the early 1980s by the American neuroscientist Benjamin Libet. Participants were asked to flex their wrist whenever they felt like doing so, while watching a special clock. They reported the moment at which they first became aware of the intention to move, and electrodes recorded the electrical activity in their brains. Libet found that a gradual build-up of activity, known as the readiness potential, began several hundred milliseconds before participants reported being aware of their decision.

Many commentators interpreted these results as showing that the brain "decides" before we are conscious of deciding, so that our sense of making a free choice comes too late to be its cause. Later studies using brain scanning appeared to strengthen this view. In one experiment published in 2008, researchers found that patterns of brain activity could predict which of two buttons a participant would press up to several seconds before the participant reported making the choice, although the predictions were only slightly better than chance.

There are, however, serious problems with this interpretation. The first concerns the method used to measure the moment of awareness. Participants had to report when they first felt the urge to move by remembering the position of a moving dot on a clock, a judgement that is known to be unreliable. The second concerns the nature of the decision. Choosing when to flex one's wrist, or which of two identical buttons to press, involves no reasons and no consequences. Such trivial acts may tell us very little about the deliberate decisions that matter in human life, such as whether to accept a job or keep a promise.

The most important challenge came from a study published in 2012, which offered a different explanation of the readiness potential itself. The authors proposed that the brain's activity naturally rises and falls in a random way, and that a movement is triggered when this background activity happens to cross a certain level. On this view, the gradual build-up that Libet recorded does not represent a decision at all; it appears only because researchers average together the activity that happened to come before many movements. If this interpretation is correct, the famous experiments do not show that the brain makes decisions before we are aware of them.

Libet himself did not conclude that free will was an illusion. He suggested that, even if the urge to act began unconsciously, people might still be able to veto it, stopping an action at the last moment. Some later experiments have supported the idea that people can cancel movements after the readiness potential has begun, up to a certain point. I find this suggestion interesting, although I am not convinced that free will should be reduced to a simple ability to say no.

Much depends on what we mean by free will. If it means a choice that is not caused by anything at all, then science may indeed struggle to find it, since brain activity, like all physical processes, has causes. But many philosophers argue that this is the wrong definition. For them, a choice is free if it results from a person's own reasoning, values and desires, without coercion, even if those processes can be described in terms of brain activity. I find this account persuasive: discovering the brain processes that underlie a decision does not make the decision any less the person's own.

The debate has practical consequences. Some studies have suggested that people who are persuaded that free will does not exist become more likely to behave dishonestly, although attempts to repeat these findings have produced mixed results. Legal systems, too, rest on the assumption that people can generally be held responsible for their actions. I believe that neuroscience can enrich our understanding of decision-making, but it has not overturned the idea that we are responsible agents, and claims that it has done so should be treated with caution.`,
      questions: [
        mcq(
          "What is the writer's view of the claim that free will is an illusion?",
          [
            "It is supported by most of the evidence.",
            "The experiments do not justify such a strong conclusion.",
            "It was first made by philosophers.",
            "It has already been accepted by the courts.",
          ],
          "The experiments do not justify such a strong conclusion.",
          "In my view, the experiments are fascinating, but they do not justify such a dramatic conclusion.",
          "The experiments 'do not justify such a dramatic conclusion'.",
        ),
        mcq(
          "What were participants in Libet's experiments asked to do?",
          [
            "press a button when a light appeared",
            "move their wrist at a moment of their own choosing",
            "choose between two difficult options",
            "stop a movement as soon as they heard a sound",
          ],
          "move their wrist at a moment of their own choosing",
          "Participants were asked to flex their wrist whenever they felt like doing so, while watching a special clock.",
          "They flexed their wrist 'whenever they felt like doing so'.",
        ),
        mcq(
          "What does the writer say about the 2008 brain-scanning study?",
          [
            "Its predictions were always correct.",
            "Its predictions were only a little better than guessing.",
            "It contradicted Libet's results.",
            "It used the same clock as Libet.",
          ],
          "Its predictions were only a little better than guessing.",
          "In one experiment published in 2008, researchers found that patterns of brain activity could predict which of two buttons a participant would press up to several seconds before the participant reported making the choice, although the predictions were only slightly better than chance.",
          "The predictions 'were only slightly better than chance'.",
        ),
        mcq(
          "What is the writer's criticism of the decisions studied in these experiments?",
          [
            "They take too long to make.",
            "They are too unimportant to tell us much about significant choices.",
            "They are too difficult for most participants.",
            "They have too many consequences to measure.",
          ],
          "They are too unimportant to tell us much about significant choices.",
          "Such trivial acts may tell us very little about the deliberate decisions that matter in human life, such as whether to accept a job or keep a promise.",
          "'Such trivial acts may tell us very little' about important decisions.",
        ),
        mcq(
          "According to the 2012 study, what is the readiness potential?",
          [
            "the exact moment at which a decision is made",
            "a pattern that appears when random brain activity is averaged",
            "a sign that a person is about to cancel a movement",
            "the brain's reaction to watching the clock",
          ],
          "a pattern that appears when random brain activity is averaged",
          "On this view, the gradual build-up that Libet recorded does not represent a decision at all; it appears only because researchers average together the activity that happened to come before many movements.",
          "The build-up 'appears only because researchers average together the activity'.",
        ),
        ynng(
          "The way Libet measured the moment of awareness was reliable.",
          "NO",
          "Participants had to report when they first felt the urge to move by remembering the position of a moving dot on a clock, a judgement that is known to be unreliable.",
          "The judgement 'is known to be unreliable'.",
        ),
        ynng(
          "Libet's experiment has been repeated more often than any other study in neuroscience.",
          "NOT GIVEN",
          "",
          "The writer mentions later studies but never says how often Libet's experiment was repeated.",
        ),
        ynng(
          "Free will is simply the ability to stop an action.",
          "NO",
          "I find this suggestion interesting, although I am not convinced that free will should be reduced to a simple ability to say no.",
          "The writer is 'not convinced that free will should be reduced to a simple ability to say no'.",
        ),
        ynng(
          "A decision can still belong to a person even if brain processes lie behind it.",
          "YES",
          "I find this account persuasive: discovering the brain processes that underlie a decision does not make the decision any less the person's own.",
          "It 'does not make the decision any less the person's own'.",
        ),
        ynng(
          "Claims that neuroscience has disproved human responsibility should be treated carefully.",
          "YES",
          "I believe that neuroscience can enrich our understanding of decision-making, but it has not overturned the idea that we are responsible agents, and claims that it has done so should be treated with caution.",
          "Such claims 'should be treated with caution'.",
        ),
        fromList(
          "summary_completion",
          WILL_BANK,
          "Libet thought people might still be able to ______ an urge that began unconsciously.",
          "veto",
          "He suggested that, even if the urge to act began unconsciously, people might still be able to veto it, stopping an action at the last moment.",
          "People 'might still be able to veto it'.",
        ),
        fromList(
          "summary_completion",
          WILL_BANK,
          "For many philosophers, a choice is free if it is made without ______.",
          "coercion",
          "For them, a choice is free if it results from a person's own reasoning, values and desires, without coercion, even if those processes can be described in terms of brain activity.",
          "A free choice is made 'without coercion'.",
        ),
        fromList(
          "summary_completion",
          WILL_BANK,
          "People told that free will does not exist may be more likely to act ______.",
          "dishonestly",
          "Some studies have suggested that people who are persuaded that free will does not exist become more likely to behave dishonestly, although attempts to repeat these findings have produced mixed results.",
          "They 'become more likely to behave dishonestly'.",
        ),
        fromList(
          "summary_completion",
          WILL_BANK,
          "Attempts to repeat these studies have produced ______ results.",
          "mixed",
          "Some studies have suggested that people who are persuaded that free will does not exist become more likely to behave dishonestly, although attempts to repeat these findings have produced mixed results.",
          "Repeat attempts 'have produced mixed results'.",
        ),
      ],
    },
  ],
};
