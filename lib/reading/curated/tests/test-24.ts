import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of technology · notes + True/False/Not Given --------

const TIME = {
  title: "The spread of standard time",
  layout: "notes" as const,
  wordLimit: "NO MORE THAN TWO WORDS",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs and people -----------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const OCEAN_PEOPLE = ["Elena Ruiz", "Oliver Grant", "Kenji Matsuda", "Farah Qureshi"];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const PLACEBO_BANK = [
  "conditioning",
  "ritual",
  "chemicals",
  "addition",
  "effective",
  "listening",
  "replacement",
  "memory",
  "expensive",
  "writing",
];

export const TEST_24: CuratedTest = {
  key: "full-test-24",
  targetBand: 7,
  passages: [
    {
      key: "t24-p1-railway-time",
      title: "When Every Town Had Its Own Time",
      topic: "how the railways led the world to adopt standard time",
      difficulty: 6,
      body: `Today, we take it for granted that clocks across an entire country show the same time. Yet for most of human history, time was a local matter. Each town set its clocks by the position of the Sun, so that noon was the moment when the Sun reached its highest point in the sky. Because the Earth rotates from west to east, noon arrives earlier in places further east than in places further west. In Britain, for example, noon in Bristol came about ten minutes later than noon in London.

For centuries, these differences caused few problems. Most people rarely travelled far, and journeys by horse or coach were so slow that a few minutes' difference in local time hardly mattered. The arrival of the railways in the 1830s and 1840s changed this. For the first time, people could travel between distant towns in a matter of hours, and timetables had to be precise. With each town keeping its own time, confusion was inevitable. Passengers missed trains, and, more seriously, the risk of collisions increased when different stations worked to different clocks. Printed timetables had to list the local time at every station, which made them long and confusing.

In 1840, the Great Western Railway in Britain became the first railway company to adopt a single standard time across its entire network. It chose London time, which was based on observations made at the Royal Observatory in Greenwich. Other railway companies soon followed, and by the late 1840s most British railways were operating on what became known as "railway time". From the early 1850s, time signals were sent from Greenwich along the new telegraph lines, allowing stations and towns to set their clocks accurately.

Many towns resisted the change. Some people regarded railway time as unwelcome interference by a powerful industry, and some local authorities were slow to abandon their own time. For a period, a number of public clocks displayed two times: some were fitted with two minute hands, one showing local time and the other showing London time. It was not until 1880 that a law made Greenwich Mean Time the legal standard throughout Great Britain.

The problem was even greater in the United States, a vast country that spans several time zones. By the early 1880s, American railway companies were using dozens of different local times, and some large stations displayed several clocks showing the times used by different companies. On 18 November 1883, the railways introduced a system of standard time zones across the country. As clocks in many places were adjusted at midday, some towns experienced noon twice, and the date became known as "the day of two noons". The national government did not make these time zones law until 1918. Until then, the system depended entirely on agreement between private companies.

Meanwhile, scientists and engineers were calling for a worldwide system. One of the most influential was Sandford Fleming, a Scottish-born engineer working in Canada, who is said to have become interested in the problem after missing a train in Ireland because of a mistake in a printed timetable. Fleming proposed dividing the world into twenty-four time zones, each one hour apart. His ideas helped to inspire an international conference held in Washington in 1884.

The conference, attended by representatives of twenty-five countries, agreed that the line of longitude passing through Greenwich would serve as the prime meridian, the starting point from which longitude would be measured east and west. Greenwich was chosen largely because most of the world's shipping already used sea charts based on it. France, however, did not support the decision, and it continued to use the meridian passing through Paris for timekeeping until 1911.

Standard time is now so familiar that its origins are often forgotten. Yet the system we rely on today grew out of the practical needs of the railway age, and it has continued to change. Many countries adjust their clocks in summer, and some have chosen time zones that do not match their geographical position, for political or economic reasons. China, for example, uses a single time zone across the whole country, even though it is wide enough to cover five. Time, it seems, is as much a matter of human agreement as of the movement of the Sun. The next time you change your clocks, it may be worth remembering the railway engineers who made such agreement necessary.`,
      questions: [
        noteLine(
          TIME,
          "Local time",
          "noon was when the ______ was at its highest point",
          "Sun",
          "Each town set its clocks by the position of the Sun, so that noon was the moment when the Sun reached its highest point in the sky.",
          "Noon was 'the moment when the Sun reached its highest point'.",
        ),
        noteLine(
          TIME,
          "Local time",
          "noon in Bristol about ten minutes later than in ______",
          "London",
          "In Britain, for example, noon in Bristol came about ten minutes later than noon in London.",
          "Bristol's noon 'came about ten minutes later than noon in London'.",
        ),
        noteLine(
          TIME,
          "Britain",
          "from the early 1850s, time signals sent along ______ lines",
          "telegraph",
          "From the early 1850s, time signals were sent from Greenwich along the new telegraph lines, allowing stations and towns to set their clocks accurately.",
          "Signals went 'along the new telegraph lines'.",
        ),
        noteLine(
          TIME,
          "Britain",
          "some public clocks were given two ______",
          "minute hands",
          "For a period, a number of public clocks displayed two times: some were fitted with two minute hands, one showing local time and the other showing London time.",
          "Some clocks 'were fitted with two minute hands'.",
        ),
        noteLine(
          TIME,
          "Britain",
          "1880: Greenwich Mean Time became the ______ standard",
          "legal",
          "It was not until 1880 that a law made Greenwich Mean Time the legal standard throughout Great Britain.",
          "A law made it 'the legal standard'.",
        ),
        noteLine(
          TIME,
          "The United States and the world",
          "18 November 1883: 'the day of two ______'",
          "noons",
          'As clocks in many places were adjusted at midday, some towns experienced noon twice, and the date became known as "the day of two noons".',
          "The date became known as 'the day of two noons'.",
        ),
        noteLine(
          TIME,
          "The United States and the world",
          "1884: international conference held in ______",
          "Washington",
          "His ideas helped to inspire an international conference held in Washington in 1884.",
          "The conference was 'held in Washington in 1884'.",
        ),
        tfng(
          "Journeys by coach were fast enough for small differences in local time to cause problems.",
          "FALSE",
          "Most people rarely travelled far, and journeys by horse or coach were so slow that a few minutes' difference in local time hardly mattered.",
          "Coach journeys were 'so slow' that the difference 'hardly mattered'.",
        ),
        tfng(
          "Differences in local time made railway accidents more likely.",
          "TRUE",
          "Passengers missed trains, and, more seriously, the risk of collisions increased when different stations worked to different clocks.",
          "'The risk of collisions increased'.",
        ),
        tfng(
          "Some people saw railway time as interference by a powerful industry.",
          "TRUE",
          "Some people regarded railway time as unwelcome interference by a powerful industry, and some local authorities were slow to abandon their own time.",
          "Some regarded it 'as unwelcome interference by a powerful industry'.",
        ),
        tfng(
          "In the early 1880s, American railways used only a small number of different times.",
          "FALSE",
          "By the early 1880s, American railway companies were using dozens of different local times, and some large stations displayed several clocks showing the times used by different companies.",
          "They used 'dozens of different local times'.",
        ),
        tfng(
          "Fleming received an award for his proposal on time zones.",
          "NOT GIVEN",
          "",
          "Fleming's proposal and influence are described, but no award is mentioned.",
        ),
        tfng(
          "Most of the representatives at the 1884 conference were scientists.",
          "NOT GIVEN",
          "",
          "The passage gives the number of countries represented, not the representatives' professions.",
        ),
      ],
    },
    {
      key: "t24-p2-ocean-census",
      title: "The Race to Name the Ocean's Species",
      topic: "the global effort to discover and describe new marine species",
      difficulty: 7,
      body: `A) Scientists have described around 240,000 species of marine life, from microscopic plankton to the blue whale. Yet this is thought to be only a small fraction of what lives in the sea. Estimates vary widely, but many researchers believe that as many as nine out of ten marine species have yet to be discovered. Most of the undiscovered species are small, and many live in the deep ocean, which remains one of the least explored environments on Earth. "We have better maps of the surface of Mars than of much of our own sea floor," says marine biologist Dr Elena Ruiz. Exploring the deep sea is expensive, and only a tiny proportion of it has ever been seen by humans or cameras.

B) Discovering and naming new species has traditionally been a slow process. After a specimen is collected, a specialist known as a taxonomist must study it in detail, compare it with related species and publish a formal description. On average, more than a decade has passed between the collection of a specimen and its formal description. At the current rate, some scientists have calculated that it could take centuries to describe all the species in the ocean, and many may become extinct before they are ever known to science. Specimens from past expeditions are also waiting to be studied: museums around the world hold large collections that no specialist has yet had time to examine.

C) In 2023, a major international programme called Ocean Census was launched with the aim of greatly speeding up this process. Led by a Japanese foundation and a British ocean research organisation, the programme brings together research institutions, museums and scientists from around the world. Its goal is to discover 100,000 new marine species within ten years. Programme director Dr Oliver Grant explains that the project is a race against time. "Climate change, pollution and deep-sea mining could wipe out species before we even know they exist," he says. The programme also aims to make information about new species freely available to researchers and governments.

D) The programme has already produced striking results. Between April 2025 and March 2026, its network of scientists documented 1,121 species believed to be new to science, which the project says increased the normal global rate of discovery by more than half. The discoveries were made during expeditions to some of the most remote and least explored ocean regions, from the waters around isolated islands to mountains rising from the deep sea floor. They included sponges, corals, crabs, worms and fish. Some were found in places that scientists had never visited before.

E) One of the most widely reported finds was a new species of chimaera, or "ghost shark", collected off the coast of Queensland, Australia, at depths of more than 800 metres. Chimaeras are distant relatives of sharks and rays whose ancestors separated from those groups around 400 million years ago, long before the dinosaurs appeared. The ghost shark was one of more than a hundred new species reported from a single Australian expedition to a marine park in the Coral Sea. Taxonomist Dr Kenji Matsuda says that such discoveries capture the public imagination. "A strange deep-sea animal can make people care about places they will never see," he says.

F) New technologies are helping to speed up the work. Researchers now routinely use DNA analysis to distinguish between species that look alike, and high-quality imaging allows specialists in other countries to examine specimens without handling them. Ocean Census has also created networks that connect taxonomists with collections held in museums around the world. However, Ruiz warns that technology cannot replace expertise. "A DNA sequence can tell you that something is different," she says, "but you still need a trained eye to understand what it is."

G) The shortage of taxonomists remains one of the greatest obstacles. Many experts are approaching retirement, and funding for taxonomy has declined in many countries. Marine policy researcher Dr Farah Qureshi believes that this has serious consequences. "You cannot protect what you have not named," she says. "Without taxonomists, conservation is working in the dark." The Ocean Census programme is therefore also investing in training, particularly for young scientists from countries whose waters are rich in wildlife but which have few specialists of their own. Supporters hope that this will leave a lasting legacy long after the programme itself has ended.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison between knowledge of the ocean and knowledge of another planet",
          "A",
          '"We have better maps of the surface of Mars than of much of our own sea floor," says marine biologist Dr Elena Ruiz.',
          "Paragraph A compares maps of Mars with maps of the sea floor.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the average time between collecting a specimen and describing it",
          "B",
          "On average, more than a decade has passed between the collection of a specimen and its formal description.",
          "Paragraph B: 'more than a decade' on average.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a measure of how much faster species were described in one year",
          "D",
          "Between April 2025 and March 2026, its network of scientists documented 1,121 species believed to be new to science, which the project says increased the normal global rate of discovery by more than half.",
          "Paragraph D: the rate rose 'by more than half'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "how long ago one group of animals separated from its relatives",
          "E",
          "Chimaeras are distant relatives of sharks and rays whose ancestors separated from those groups around 400 million years ago, long before the dinosaurs appeared.",
          "Paragraph E: chimaeras separated 'around 400 million years ago'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Each new specimen must be studied by a specialist called a ______.",
          "taxonomist",
          "After a specimen is collected, a specialist known as a taxonomist must study it in detail, compare it with related species and publish a formal description.",
          "'A specialist known as a taxonomist must study it'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Ocean Census aims to find 100,000 new species within ten ______.",
          "years",
          "Its goal is to discover 100,000 new marine species within ten years.",
          "The goal is 100,000 species 'within ten years'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The new species included sponges, corals, crabs, ______ and fish.",
          "worms",
          "They included sponges, corals, crabs, worms and fish.",
          "They 'included sponges, corals, crabs, worms and fish'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Researchers use ______ analysis to tell similar-looking species apart.",
          "DNA",
          "Researchers now routinely use DNA analysis to distinguish between species that look alike, and high-quality imaging allows specialists in other countries to examine specimens without handling them.",
          "They 'use DNA analysis to distinguish between species that look alike'.",
        ),
        fromList(
          "matching_features",
          OCEAN_PEOPLE,
          "Much of the sea floor is less well mapped than another planet.",
          "Elena Ruiz",
          '"We have better maps of the surface of Mars than of much of our own sea floor," says marine biologist Dr Elena Ruiz.',
          "Ruiz: 'We have better maps of the surface of Mars'.",
        ),
        fromList(
          "matching_features",
          OCEAN_PEOPLE,
          "Species may be lost before scientists know about them.",
          "Oliver Grant",
          '"Climate change, pollution and deep-sea mining could wipe out species before we even know they exist," he says.',
          "Grant: species could be wiped out 'before we even know they exist'.",
        ),
        fromList(
          "matching_features",
          OCEAN_PEOPLE,
          "Unusual animals can make people care about distant environments.",
          "Kenji Matsuda",
          '"A strange deep-sea animal can make people care about places they will never see," he says.',
          "Matsuda: such animals 'make people care about places they will never see'.",
        ),
        fromList(
          "matching_features",
          OCEAN_PEOPLE,
          "Experts are still needed to make sense of genetic results.",
          "Elena Ruiz",
          '"A DNA sequence can tell you that something is different," she says, "but you still need a trained eye to understand what it is."',
          "Ruiz: 'you still need a trained eye to understand what it is'.",
        ),
        fromList(
          "matching_features",
          OCEAN_PEOPLE,
          "Species must be named before they can be protected.",
          "Farah Qureshi",
          '"You cannot protect what you have not named," she says.',
          "Qureshi: 'You cannot protect what you have not named.'",
        ),
      ],
    },
    {
      key: "t24-p3-open-placebos",
      title: "Placebos Without Deception",
      topic: "research into placebos that work even when patients know about them",
      difficulty: 8,
      body: `For centuries, doctors have known that patients sometimes improve after receiving treatments that contain no active ingredient. This phenomenon, known as the placebo effect, has long been regarded as something of an embarrassment in medicine. In clinical trials, placebos are used to separate the genuine effects of a drug from improvements caused by patients' expectations, and a new treatment is considered effective only if it performs better than a placebo. The effect itself, however, has often been treated as a nuisance rather than a subject worth studying in its own right. In my view, this attitude has begun to change for good reason.

One obstacle to using placebos deliberately has always been deception. It was widely assumed that a placebo could only work if the patient believed they were receiving a real medicine. Since deceiving patients is generally considered unethical, this seemed to rule out any honest use of placebos in ordinary medical practice. Some surveys, it should be noted, have found that a considerable number of doctors nevertheless prescribe treatments they know are unlikely to have a direct effect, such as vitamins, in the hope of producing a placebo response.

In 2010, a team led by a researcher at Harvard Medical School challenged the assumption that deception was necessary. They recruited 80 patients with irritable bowel syndrome, a common condition that causes stomach pain and digestive problems. Half of the patients received no treatment, while the other half were given pills and told clearly that they were placebos containing no medication. The patients were also told that such pills had been shown in research to produce improvements through the connection between mind and body. After three weeks, those taking the openly described placebos reported significantly greater improvement in their symptoms than those who received nothing.

Since then, similar studies have been carried out for conditions including long-term back pain, depression, allergies and the tiredness experienced by people who have recovered from cancer. Many have reported benefits, particularly for symptoms that patients report themselves, such as pain and fatigue. A review of these studies published in 2021 concluded that open-label placebos, as they are known, appear to have a moderate effect overall. Researchers have also found that the way in which the placebo is presented matters: patients who are given a convincing explanation of how placebos might work tend to respond better than those who are not.

How can a treatment work when the patient knows it contains nothing? Researchers have offered several explanations. One is conditioning: through a lifetime of taking medicines, the body may have learned to respond to the act of taking a pill. Another is that the ritual of treatment, including the attention of a caring professional, reduces anxiety and changes how people experience their symptoms. Brain imaging studies of conventional placebos have shown that they can trigger the release of the body's own pain-relieving chemicals, and it is possible that open-label placebos work in a similar way.

I find these results intriguing, but they should be interpreted with care. Most open-label studies have been small, and it is impossible to hide from participants which group they are in, since those who receive no pill know that they are receiving nothing. This means that some of the reported improvement may reflect disappointment in the comparison group rather than a genuine benefit in the treatment group. Moreover, the benefits appear mainly in symptoms that patients report themselves; there is little evidence that placebos can shrink tumours or cure infections.

Some critics worry that promoting placebos could encourage people to abandon effective treatments. This concern deserves to be taken seriously, but I do not think it is a reason to ignore the research. Open-label placebos are best seen not as a replacement for proven medicine but as a possible addition to it, particularly for conditions such as chronic pain, for which existing treatments are often only partly effective and may have unpleasant side effects.

Perhaps the most valuable lesson of this research concerns the relationship between patients and those who treat them. If expectations, reassurance and the ritual of care can influence how people feel, then the time a doctor spends listening and explaining is not a luxury but part of the treatment itself. Health systems under pressure to shorten appointments would do well to remember this.`,
      questions: [
        mcq(
          "How has the placebo effect often been regarded in medicine?",
          [
            "as the most important part of any treatment",
            "as a problem rather than something worth studying",
            "as a completely new discovery",
            "as a dishonest practice that should be banned",
          ],
          "as a problem rather than something worth studying",
          "The effect itself, however, has often been treated as a nuisance rather than a subject worth studying in its own right.",
          "It was 'treated as a nuisance rather than a subject worth studying'.",
        ),
        mcq(
          "What was the main purpose of the 2010 study?",
          [
            "to develop a new drug for digestive problems",
            "to find out whether placebos can work without deception",
            "to compare sugar pills with vitamins",
            "to measure how often doctors prescribe placebos",
          ],
          "to find out whether placebos can work without deception",
          "In 2010, a team led by a researcher at Harvard Medical School challenged the assumption that deception was necessary.",
          "The team 'challenged the assumption that deception was necessary'.",
        ),
        mcq(
          "What did the 2021 review conclude?",
          [
            "Open-label placebos have no effect at all.",
            "Open-label placebos seem to have a moderate effect.",
            "Open-label placebos work better than real medicines.",
            "Open-label placebos help only with allergies.",
          ],
          "Open-label placebos seem to have a moderate effect.",
          "A review of these studies published in 2021 concluded that open-label placebos, as they are known, appear to have a moderate effect overall.",
          "They 'appear to have a moderate effect overall'.",
        ),
        mcq(
          "Why does the writer point out that participants know which group they are in?",
          [
            "to show that the patients had been deceived",
            "to suggest that some of the reported benefits may not be genuine",
            "to argue that the studies lasted too long",
            "to prove that placebos can cure infections",
          ],
          "to suggest that some of the reported benefits may not be genuine",
          "This means that some of the reported improvement may reflect disappointment in the comparison group rather than a genuine benefit in the treatment group.",
          "Some improvement 'may reflect disappointment in the comparison group rather than a genuine benefit'.",
        ),
        fromList(
          "summary_completion",
          PLACEBO_BANK,
          "According to one explanation, known as ______, the body may have learned to react to taking a pill.",
          "conditioning",
          "One is conditioning: through a lifetime of taking medicines, the body may have learned to respond to the act of taking a pill.",
          "The explanation is 'conditioning'.",
        ),
        fromList(
          "summary_completion",
          PLACEBO_BANK,
          "The ______ of treatment may reduce patients' anxiety.",
          "ritual",
          "Another is that the ritual of treatment, including the attention of a caring professional, reduces anxiety and changes how people experience their symptoms.",
          "'The ritual of treatment ... reduces anxiety'.",
        ),
        fromList(
          "summary_completion",
          PLACEBO_BANK,
          "Conventional placebos can release the body's own pain-relieving ______.",
          "chemicals",
          "Brain imaging studies of conventional placebos have shown that they can trigger the release of the body's own pain-relieving chemicals, and it is possible that open-label placebos work in a similar way.",
          "They trigger 'the release of the body's own pain-relieving chemicals'.",
        ),
        fromList(
          "summary_completion",
          PLACEBO_BANK,
          "Open-label placebos should be seen as a possible ______ to proven medicine.",
          "addition",
          "Open-label placebos are best seen not as a replacement for proven medicine but as a possible addition to it, particularly for conditions such as chronic pain, for which existing treatments are often only partly effective and may have unpleasant side effects.",
          "They are 'a possible addition to it', not a replacement.",
        ),
        fromList(
          "summary_completion",
          PLACEBO_BANK,
          "Existing treatments for chronic pain are often only partly ______.",
          "effective",
          "Open-label placebos are best seen not as a replacement for proven medicine but as a possible addition to it, particularly for conditions such as chronic pain, for which existing treatments are often only partly effective and may have unpleasant side effects.",
          "Existing treatments 'are often only partly effective'.",
        ),
        fromList(
          "summary_completion",
          PLACEBO_BANK,
          "The time a doctor spends ______ and explaining is part of the treatment.",
          "listening",
          "If expectations, reassurance and the ritual of care can influence how people feel, then the time a doctor spends listening and explaining is not a luxury but part of the treatment itself.",
          "'The time a doctor spends listening and explaining' is part of treatment.",
        ),
        ynng(
          "There are good reasons for the change in attitudes towards the placebo effect.",
          "YES",
          "In my view, this attitude has begun to change for good reason.",
          "The attitude 'has begun to change for good reason'.",
        ),
        ynng(
          "Doctors who prescribe vitamins as placebos should be punished.",
          "NOT GIVEN",
          "",
          "The writer reports that some doctors do this but gives no view on punishment.",
        ),
        ynng(
          "Placebos have been shown to cure infections.",
          "NO",
          "Moreover, the benefits appear mainly in symptoms that patients report themselves; there is little evidence that placebos can shrink tumours or cure infections.",
          "There is 'little evidence that placebos can ... cure infections'.",
        ),
        ynng(
          "The worry that patients might give up effective treatments should be ignored.",
          "NO",
          "This concern deserves to be taken seriously, but I do not think it is a reason to ignore the research.",
          "The concern 'deserves to be taken seriously'.",
        ),
      ],
    },
  ],
};
