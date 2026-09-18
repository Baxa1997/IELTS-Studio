import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of computing · flow-chart --------------------------

const ENGINE = {
  title: "How the Analytical Engine was meant to work",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO -----------------

const CRYPTO_PEOPLE = ["Hana Kowalski", "Dmitri Sokolov", "Adaeze Nwosu", "Tobias Frank"];
const CRYPTO_BANK = [
  "factoring",
  "qubits",
  "errors",
  "keys",
  "harvest",
  "standards",
  "devices",
  "records",
  "speed",
  "noise",
];
const CRYPTO_STEM = "Which TWO reasons are given for starting the change of encryption now?";
const CRYPTO_REASONS = [
  "encrypted data collected today could be decrypted years later",
  "existing encryption has already been broken by a quantum computer",
  "replacing encryption across large systems takes many years",
  "quantum computers are cheaper than conventional ones",
  "current encryption stops working after a fixed period",
];

// ---- Passage 3 · research debate · lettered paragraphs, people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const MUSIC_PEOPLE = ["Ruth Okafor", "Pablo Serrano", "Hilde Janssen", "Martin Reece"];

export const TEST_42: CuratedTest = {
  key: "full-test-42",
  targetBand: 7,
  passages: [
    {
      key: "t42-p1-lovelace",
      title: "The Notes at the Back",
      topic: "Ada Lovelace and the first description of a general-purpose machine",
      difficulty: 6,
      body: `Augusta Ada Byron was born in London in 1815 and never knew her father, the poet Lord Byron, who left the country a few weeks later and died when she was eight. Her mother, who had a serious interest in mathematics, arranged an education designed to hold in check what she feared her daughter might have inherited: the girl was taught arithmetic, geometry and music, and discouraged from poetry. The plan did not work as intended. Ada retained an imaginative streak that she later applied to machinery, describing her own approach as poetical science.

She was fortunate in her teachers. Among them were Mary Somerville, one of the most respected scientific writers of the century, and Augustus De Morgan, a professor of mathematics who taught her logic by correspondence and told her mother that her capacity for abstract reasoning was unusual. It was Somerville who introduced her, at seventeen, to Charles Babbage.

Babbage had designed a machine called the Difference Engine, intended to calculate and print mathematical tables without human error, and had built a working section of it that he demonstrated to visitors. Most guests admired the brass and moved on. Ada, by her own account, understood what she was looking at. By the time they met again she had begun to follow his next and far more ambitious project.

The Analytical Engine was a general-purpose calculating machine, and it existed only on paper. Its design separated the part that performed operations, which Babbage called the mill, from the part that held numbers, which he called the store — a distinction now described as the processor and the memory. Instructions and data were to be supplied on punched cards, an idea taken directly from the looms that wove patterned silk, and the machine could be directed to repeat a sequence of operations or to take a different path depending on a result it had already produced.

Babbage published almost nothing about it, partly because he kept redesigning it and partly because he was a poor advocate for his own work, quarrelling with the government departments that had already spent a great deal of public money on the earlier machine. In 1840 he described the machine at a seminar in Turin, and a young Italian engineer, Luigi Menabrea, wrote an account of the lecture in French. In 1842 Lovelace translated that account into English, and Babbage suggested that she add some remarks of her own. The notes she supplied, labelled A to G, ran to roughly three times the length of the paper they accompanied.

They contain two things of lasting importance. The first is in the final note, which sets out, step by step, how the engine could be made to calculate a sequence of numbers named after the mathematician Jacob Bernoulli, including the arrangement of the cards and the way a group of operations would be repeated with changing values. It is generally described as the first published program written for a machine, and it was worked out for a machine that did not exist and could not be tested.

The second is a claim about what such a machine was for. Lovelace argued that because the cards could represent anything that could be expressed in symbols, the engine was not limited to numbers: if the relations between pitches could be written down in that form, she wrote, the machine might compose elaborate pieces of music. In the same notes she added a caution that has been quoted ever since — that the engine had no pretensions to originate anything, and could only do what it was ordered to do.

She died in 1852, at the age of thirty-six. The Analytical Engine was never built, Babbage's later years were consumed by disputes over funding, and the notes were largely forgotten until the middle of the twentieth century, when the builders of the first electronic computers found in them a description of what they were doing. How much of the work was hers and how much Babbage's has been argued over by historians, some of whom point out that Babbage had written similar ideas in private notebooks years earlier. What is not disputed is that the published explanation of what a programmable machine could be, in language that anyone could follow, appeared under her initials and not under his.`,
      questions: [
        tfng(
          "Ada's mother encouraged her to study poetry as well as mathematics.",
          "FALSE",
          "Her mother, who had a serious interest in mathematics, arranged an education designed to hold in check what she feared her daughter might have inherited: the girl was taught arithmetic, geometry and music, and discouraged from poetry.",
          "She was 'discouraged from poetry'.",
        ),
        tfng(
          "De Morgan considered Ada's ability at abstract reasoning to be exceptional.",
          "TRUE",
          "Among them were Mary Somerville, one of the most respected scientific writers of the century, and Augustus De Morgan, a professor of mathematics who taught her logic by correspondence and told her mother that her capacity for abstract reasoning was unusual.",
          "He said her capacity 'was unusual'.",
        ),
        tfng(
          "Babbage completed the whole of the Difference Engine.",
          "FALSE",
          "Babbage had designed a machine called the Difference Engine, intended to calculate and print mathematical tables without human error, and had built a working section of it that he demonstrated to visitors.",
          "He built only 'a working section of it'.",
        ),
        tfng(
          "The Analytical Engine was built during Babbage's lifetime.",
          "FALSE",
          "She died in 1852, at the age of thirty-six. The Analytical Engine was never built, Babbage's later years were consumed by disputes over funding, and the notes were largely forgotten until the middle of the twentieth century, when the builders of the first electronic computers found in them a description of what they were doing.",
          "'The Analytical Engine was never built'.",
        ),
        tfng(
          "The idea of using punched cards came from the textile industry.",
          "TRUE",
          "Instructions and data were to be supplied on punched cards, an idea taken directly from the looms that wove patterned silk, and the machine could be directed to repeat a sequence of operations or to take a different path depending on a result it had already produced.",
          "The idea came 'from the looms that wove patterned silk'.",
        ),
        tfng(
          "Lovelace's notes were shorter than the paper she had translated.",
          "FALSE",
          "The notes she supplied, labelled A to G, ran to roughly three times the length of the paper they accompanied.",
          "They were 'roughly three times the length'.",
        ),
        tfng(
          "Historians agree about how the work should be divided between Lovelace and Babbage.",
          "FALSE",
          "How much of the work was hers and how much Babbage's has been argued over by historians, some of whom point out that Babbage had written similar ideas in private notebooks years earlier.",
          "It 'has been argued over by historians'.",
        ),
        noteLine(
          ENGINE,
          null,
          "Instructions and data arrive on punched ______",
          "cards",
          "Instructions and data were to be supplied on punched cards, an idea taken directly from the looms that wove patterned silk, and the machine could be directed to repeat a sequence of operations or to take a different path depending on a result it had already produced.",
          "They 'were to be supplied on punched cards'.",
        ),
        noteLine(
          ENGINE,
          null,
          "Numbers are held in the ______",
          "store",
          "Its design separated the part that performed operations, which Babbage called the mill, from the part that held numbers, which he called the store — a distinction now described as the processor and the memory.",
          "The part 'that held numbers… he called the store'.",
        ),
        noteLine(
          ENGINE,
          null,
          "Operations are carried out in the ______",
          "mill",
          "Its design separated the part that performed operations, which Babbage called the mill, from the part that held numbers, which he called the store — a distinction now described as the processor and the memory.",
          "The part 'that performed operations… Babbage called the mill'.",
          { before: [{ text: "A result may send the machine down a different path", indent: 0 }] },
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Lovelace described her own way of thinking as ______.",
          "poetical science",
          "Ada retained an imaginative streak that she later applied to machinery, describing her own approach as poetical science.",
          "She described it as 'poetical science'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The final note explains how to calculate a sequence of numbers named after ______.",
          "Bernoulli",
          "The first is in the final note, which sets out, step by step, how the engine could be made to calculate a sequence of numbers named after the mathematician Jacob Bernoulli, including the arrangement of the cards and the way a group of operations would be repeated with changing values.",
          "The numbers are 'named after the mathematician Jacob Bernoulli'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "She suggested that the engine might be able to compose ______.",
          "music",
          "Lovelace argued that because the cards could represent anything that could be expressed in symbols, the engine was not limited to numbers: if the relations between pitches could be written down in that form, she wrote, the machine might compose elaborate pieces of music.",
          "It 'might compose elaborate pieces of music'.",
        ),
      ],
    },
    {
      key: "t42-p2-quantum-encryption",
      title: "Changing the Locks",
      topic: "preparing encryption for the arrival of quantum computers",
      difficulty: 7,
      body: `Almost every private message sent over the internet is protected by a piece of mathematics that is easy in one direction and hard in the other. Multiplying two large prime numbers takes an instant; recovering those primes from the product would take a conventional computer longer than the age of the universe. Related problems underpin the certificates that prove a website is what it claims to be, the updates that reach a phone, and the signatures on banking messages. The whole arrangement rests on the assumption that certain calculations are impractical.

A quantum computer changes that assumption for exactly these problems. An algorithm published in 1994 showed that a sufficiently large and reliable quantum machine could factor large numbers and solve the related problems efficiently, which would break the public-key systems now in use. The important words are large and reliable. Today's machines have hundreds or a few thousand quantum bits, and those bits are fragile: they lose their state in fractions of a second and produce errors at rates far above what a long calculation can tolerate. Correcting those errors requires many physical bits to represent one reliable one, and current estimates of what would be needed to break a standard key run to millions of physical bits. Quantum physicist Dr Hana Kowalski regards the gap as real but shrinking. "Every serious estimate of the machine required has come down, not up," she says. "That is the part people should watch."

Predictions of when such a machine might exist vary from about a decade to never, and the honest answer is that nobody knows. What has changed is that the uncertainty is no longer a reason to wait. Two arguments explain why. The first is that encrypted traffic can be stored: an adversary who copies today's protected data can keep it until a machine exists that opens it, so any secret that must stay secret for twenty years is already exposed. Security researcher Dmitri Sokolov considers this the decisive point. "You are not protecting today's data from tomorrow's computer," he says. "You are protecting it from a filing cabinet that already exists."

The second is that changing encryption is extraordinarily slow. Cryptographic algorithms are embedded in payment terminals, medical devices, industrial controllers, vehicles and satellites, many of which will not be replaced for fifteen years and some of which cannot be updated at all. Previous transitions between encryption standards, involving far simpler changes, took a decade or more. Systems engineer Dr Adaeze Nwosu, who has managed such a migration for a national payments network, says the mathematics is the easy part. "Nobody has a complete inventory of where their own keys are," she says. "The first two years of any migration are spent finding out what you are running."

The replacement algorithms already exist. After an international competition lasting eight years, a set of post-quantum standards was published in 2024, built on mathematical problems — involving lattices and error-correcting codes — for which no efficient quantum method is known. They are not exotic: they run on ordinary hardware, with keys and signatures that are larger than today's but manageable. Browsers and messaging services have already begun to deploy them alongside the existing algorithms, so that traffic is protected if either scheme survives.

Two cautions are worth recording. The first is that no efficient quantum method is known is not the same as none exists; the new schemes rest on problems that have been studied for decades but not for as long as factoring, and at least one candidate in the competition was broken during the process by an ordinary computer. The second concerns the alternative sometimes proposed, in which keys are distributed using quantum physics itself over dedicated optical links. Cryptographer Professor Tobias Frank is sceptical of its practical role. "It solves one problem beautifully and leaves every other one untouched," he says. "You still have to authenticate the endpoints, and you cannot run a fibre to a phone in someone's pocket."

Symmetric encryption, used once a connection has been established, is in better shape: quantum computing weakens it, but doubling the key length restores the margin, and that change is easy. The difficult work is in the public-key layer, in the certificates and signatures that hold the internet's system of trust together, and that work has now begun in earnest — quietly, expensively, and years before anybody can say whether the machine it guards against will be built.`,
      questions: [
        fromList(
          "matching_features",
          CRYPTO_PEOPLE,
          "Estimates of the machine needed keep falling.",
          "Hana Kowalski",
          '"Every serious estimate of the machine required has come down, not up," she says. "That is the part people should watch."',
          "Kowalski: estimates 'come down, not up'.",
        ),
        fromList(
          "matching_features",
          CRYPTO_PEOPLE,
          "Today's data is already at risk from storage rather than from computers.",
          "Dmitri Sokolov",
          '"You are not protecting today\'s data from tomorrow\'s computer," he says. "You are protecting it from a filing cabinet that already exists."',
          "Sokolov: 'a filing cabinet that already exists'.",
        ),
        fromList(
          "matching_features",
          CRYPTO_PEOPLE,
          "Organisations do not know where their own encryption is used.",
          "Adaeze Nwosu",
          '"Nobody has a complete inventory of where their own keys are," she says.',
          "Nwosu: no complete inventory.",
        ),
        fromList(
          "matching_features",
          CRYPTO_PEOPLE,
          "One proposed alternative addresses only part of the problem.",
          "Tobias Frank",
          '"It solves one problem beautifully and leaves every other one untouched," he says.',
          "Frank on quantum key distribution.",
        ),
        fromList(
          "matching_features",
          CRYPTO_PEOPLE,
          "The beginning of a migration is spent on discovery rather than on mathematics.",
          "Adaeze Nwosu",
          '"The first two years of any migration are spent finding out what you are running."',
          "Nwosu: the first two years are discovery.",
        ),
        fromList(
          "summary_completion",
          CRYPTO_BANK,
          "Public-key encryption relies on the difficulty of ______ large numbers.",
          "factoring",
          "Multiplying two large prime numbers takes an instant; recovering those primes from the product would take a conventional computer longer than the age of the universe.",
          "Recovering the primes is factoring the product.",
        ),
        fromList(
          "summary_completion",
          CRYPTO_BANK,
          "Today's machines have only hundreds or a few thousand ______.",
          "qubits",
          "Today's machines have hundreds or a few thousand quantum bits, and those bits are fragile: they lose their state in fractions of a second and produce errors at rates far above what a long calculation can tolerate.",
          "They have 'hundreds or a few thousand quantum bits'.",
        ),
        fromList(
          "summary_completion",
          CRYPTO_BANK,
          "Many physical bits are needed to correct the ______ a calculation produces.",
          "errors",
          "Correcting those errors requires many physical bits to represent one reliable one, and current estimates of what would be needed to break a standard key run to millions of physical bits.",
          "'Correcting those errors requires many physical bits'.",
        ),
        fromList(
          "summary_completion",
          CRYPTO_BANK,
          "An adversary may ______ encrypted traffic now and open it later.",
          "harvest",
          "The first is that encrypted traffic can be stored: an adversary who copies today's protected data can keep it until a machine exists that opens it, so any secret that must stay secret for twenty years is already exposed.",
          "Copying and keeping the traffic is harvesting it.",
        ),
        fromList(
          "summary_completion",
          CRYPTO_BANK,
          "Algorithms are embedded in ______ that may not be replaced for fifteen years.",
          "devices",
          "Cryptographic algorithms are embedded in payment terminals, medical devices, industrial controllers, vehicles and satellites, many of which will not be replaced for fifteen years and some of which cannot be updated at all.",
          "They are embedded in equipment that 'will not be replaced for fifteen years'.",
        ),
        fromList(
          "summary_completion",
          CRYPTO_BANK,
          "New post-quantum ______ were published in 2024.",
          "standards",
          "After an international competition lasting eight years, a set of post-quantum standards was published in 2024, built on mathematical problems — involving lattices and error-correcting codes — for which no efficient quantum method is known.",
          "'A set of post-quantum standards was published in 2024'.",
        ),
        pickTwo(
          CRYPTO_STEM,
          CRYPTO_REASONS,
          "A or C",
          "The first is that encrypted traffic can be stored: an adversary who copies today's protected data can keep it until a machine exists that opens it, so any secret that must stay secret for twenty years is already exposed.",
          "A is given: stored traffic can be opened later.",
        ),
        pickTwo(
          CRYPTO_STEM,
          CRYPTO_REASONS,
          "A or C",
          "Previous transitions between encryption standards, involving far simpler changes, took a decade or more.",
          "C is given: migrations take many years. B, D and E are false or unmentioned.",
        ),
      ],
    },
    {
      key: "t42-p3-music-training",
      title: "Does Music Make Us Clever?",
      topic: "the evidence on whether musical training improves other abilities",
      difficulty: 8,
      body: `A) In 1993 a short paper reported that college students who listened to ten minutes of a Mozart sonata performed slightly better on a spatial reasoning task than students who had sat in silence. The effect lasted about a quarter of an hour and applied to one narrow task. Within two years it had become the Mozart effect: recordings were marketed to expectant mothers, one American state distributed classical CDs to new parents, and the original authors spent much of the following decade explaining what their paper had not said. Psychologist Dr Ruth Okafor, who has traced the episode, regards it as a case study in how research travels. "A fifteen-minute change in one task became a claim about children's brains," she says. "Nobody needed to lie for that to happen."

B) The Mozart effect itself has largely dissolved. Later work found similar small boosts from listening to a story, or to any music the listener enjoyed, which points to arousal and mood rather than to anything musical: people do marginally better at tasks when they are alert and in a good humour. That is a real finding, and a modest one.

C) The more serious question concerns learning to play rather than listening. Here the correlations are strong and consistent. Children who take music lessons do better at school on average, score higher on tests of reasoning and memory, and are more likely to go on to higher education. The difficulty is that music lessons are not randomly distributed. They are bought by families with money, time and an interest in education, and those same families provide a great deal else. Educational researcher Professor Pablo Serrano puts it plainly. "Show me a child with six years of piano lessons," he says, "and I will show you a household that also owns books."

D) A small number of randomised studies have tried to cut through this by assigning children to music lessons or to another activity. The best known, published in 2004, gave six-year-olds a year of keyboard or singing lessons and found a gain of a few points on a general intelligence test compared with children given drama lessons or nothing. The result was widely reported, and it is worth being clear about its size: a few points, on one test, after a year of tuition, in a study of a few dozen children.

E) When many such studies are pooled, the picture changes again. Two large reviews, applying the same standards used to evaluate other educational claims, concluded that the apparent benefits of music training for general cognitive ability shrink towards nothing as study quality rises, and that the studies showing the largest effects tend to be the smallest and the least well controlled. Cognitive scientist Dr Hilde Janssen, who worked on one of these reviews, says the pattern is familiar. "Near transfer is real and boring," she says. "Far transfer is exciting and mostly absent."

F) What music training does reliably improve is music, and the things immediately adjacent to it. Trained musicians hear small differences in pitch and timing that others miss, read notation fluently, coordinate fine movements of both hands, and remember musical material far better than untrained listeners. Several studies find advantages in distinguishing speech in noisy rooms, which is plausibly connected to the same auditory skills. These are not trivial abilities, and they are exactly what practice would be expected to produce.

G) The uncomfortable part is what this means for the case made to governments. Music in schools has been defended for thirty years with the argument that it raises attainment in mathematics and language, because that is the argument funding bodies respond to. If the evidence for that claim is weak, the defence built on it is weak too. Music teacher and researcher Martin Reece argues that the profession made a bad bargain. "We agreed to be judged on someone else's outcomes," he says. "A subject that has to justify itself by improving test scores in another subject has already lost the argument it should have been making." The alternative case — that learning an instrument gives a child access to something worth having, that ensembles teach cooperation of a kind little else in school does, and that a country whose children cannot make music is poorer for it — has the advantage of being what the evidence actually supports.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of what produced the small listening effect",
          "B",
          "Later work found similar small boosts from listening to a story, or to any music the listener enjoyed, which points to arousal and mood rather than to anything musical: people do marginally better at tasks when they are alert and in a good humour.",
          "Paragraph B: arousal and mood.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the observation that families who buy lessons differ in other ways",
          "C",
          "They are bought by families with money, time and an interest in education, and those same families provide a great deal else.",
          "Paragraph C: the families 'provide a great deal else'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "details of a controlled study and its actual size",
          "D",
          "The result was widely reported, and it is worth being clear about its size: a few points, on one test, after a year of tuition, in a study of a few dozen children.",
          "Paragraph D gives the 2004 study and its scale.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a finding that weaker studies report larger benefits",
          "E",
          "Two large reviews, applying the same standards used to evaluate other educational claims, concluded that the apparent benefits of music training for general cognitive ability shrink towards nothing as study quality rises, and that the studies showing the largest effects tend to be the smallest and the least well controlled.",
          "Paragraph E: the largest effects come from the weakest studies.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a list of abilities that training does improve",
          "F",
          "Trained musicians hear small differences in pitch and timing that others miss, read notation fluently, coordinate fine movements of both hands, and remember musical material far better than untrained listeners.",
          "Paragraph F lists the genuine gains.",
        ),
        fromList(
          "matching_features",
          MUSIC_PEOPLE,
          "A narrow laboratory result grew into a claim nobody had made.",
          "Ruth Okafor",
          '"A fifteen-minute change in one task became a claim about children\'s brains," she says. "Nobody needed to lie for that to happen."',
          "Okafor on how the finding travelled.",
        ),
        fromList(
          "matching_features",
          MUSIC_PEOPLE,
          "Children who have lessons come from homes that differ in many ways.",
          "Pablo Serrano",
          '"Show me a child with six years of piano lessons," he says, "and I will show you a household that also owns books."',
          "Serrano on the household behind the lessons.",
        ),
        fromList(
          "matching_features",
          MUSIC_PEOPLE,
          "Benefits close to the skill practised are genuine; distant ones are not.",
          "Hilde Janssen",
          '"Near transfer is real and boring," she says. "Far transfer is exciting and mostly absent."',
          "Janssen on near and far transfer.",
        ),
        fromList(
          "matching_features",
          MUSIC_PEOPLE,
          "Defending a subject by its effect on other subjects was a mistake.",
          "Martin Reece",
          '"We agreed to be judged on someone else\'s outcomes," he says. "A subject that has to justify itself by improving test scores in another subject has already lost the argument it should have been making."',
          "Reece calls it a bad bargain.",
        ),
        fromList(
          "matching_features",
          MUSIC_PEOPLE,
          "The exaggeration happened without anyone being dishonest.",
          "Ruth Okafor",
          '"Nobody needed to lie for that to happen."',
          "Okafor: no lie was required.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The 1993 study measured performance on a ______ reasoning task.",
          "spatial",
          "In 1993 a short paper reported that college students who listened to ten minutes of a Mozart sonata performed slightly better on a spatial reasoning task than students who had sat in silence.",
          "It was 'a spatial reasoning task'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The listening effect lasted about a ______ of an hour.",
          "quarter",
          "The effect lasted about a quarter of an hour and applied to one narrow task.",
          "It 'lasted about a quarter of an hour'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In the 2004 study, the comparison children were given ______ lessons or nothing.",
          "drama",
          "The best known, published in 2004, gave six-year-olds a year of keyboard or singing lessons and found a gain of a few points on a general intelligence test compared with children given drama lessons or nothing.",
          "They were 'given drama lessons or nothing'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Musicians are better at picking out ______ in noisy rooms.",
          "speech",
          "Several studies find advantages in distinguishing speech in noisy rooms, which is plausibly connected to the same auditory skills.",
          "They are better at 'distinguishing speech in noisy rooms'.",
        ),
      ],
    },
  ],
};
