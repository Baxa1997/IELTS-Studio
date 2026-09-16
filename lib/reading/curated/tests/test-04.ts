import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · notes box ----------------------------------------------------

const USES = {
  title: "How sea creatures use light",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · lettered paragraphs and people -------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PEOPLE = ["Helen Marsh", "Samuel Adeyemi", "Ingrid Haugen", "Rosa Delgado"];

// ---- Passage 3 · word bank ----------------------------------------------------

const BANK = [
  "later",
  "earlier",
  "rats",
  "stones",
  "moist",
  "dry",
  "disease",
  "famine",
  "smaller",
  "larger",
];

export const TEST_04: CuratedTest = {
  key: "full-test-04",
  targetBand: 7,
  passages: [
    {
      key: "t04-p1-bioluminescence",
      title: "Living Light",
      topic: "how and why living things produce light",
      difficulty: 6,
      body: `On a dark night in certain coastal bays, a swimmer's every movement can leave a trail of blue-green light in the water. The glow is produced by vast numbers of microscopic organisms called dinoflagellates, which flash when they are disturbed. This ability of living things to produce light, known as bioluminescence, is found in a remarkable variety of creatures, from fireflies and fungi to jellyfish, squid and deep-sea fish. People have described the phenomenon for thousands of years; ancient writers noted glowing wood in forests and a shining sea at night.

Bioluminescence is not the same as the glow of objects that absorb light and release it later. Instead, it is the result of a chemical reaction that takes place inside the organism. In most cases, a light-producing molecule, known as a luciferin, reacts with oxygen with the help of an enzyme called luciferase. The reaction releases energy in the form of light, while producing very little heat, which is why bioluminescence is sometimes described as cold light. Different groups of organisms use different luciferins, suggesting that the ability has evolved independently many times — scientists estimate at least 40 times, and possibly far more.

On land, bioluminescence is relatively rare, and the best-known examples are fireflies. In the sea, however, it is extremely common. One study of animals living between the surface and a depth of about 4,000 metres off the coast of California found that roughly three-quarters of them were able to produce light. In the deep ocean, where sunlight never reaches, light made by living things is often the only light there is.

Fireflies provide one of the clearest examples of light used for communication. Each species has its own pattern of flashes, and males fly through the air signalling while females respond from the ground. In some parts of South-East Asia and North America, thousands of fireflies flash at the same moment, creating waves of light that attract many tourists. On the forest floor, certain fungi also glow faintly at night, possibly to attract insects that help to spread their spores.

Marine animals use their light for many different purposes. Some use it to find food: the anglerfish, for example, dangles a glowing lure in front of its mouth to attract smaller fish. Some deep-sea fish can even produce red light, which most other animals in the deep cannot see, allowing them to find prey without being noticed. Others use light as a defence. Certain species of shrimp release a cloud of glowing liquid when attacked, confusing the predator while they escape. Light can also help animals to find partners, since some species produce flashes in particular patterns that are recognised only by members of their own kind.

One of the most sophisticated uses is a form of camouflage known as counter-illumination. In the dim waters of the middle ocean, a predator looking upwards sees the shapes of other animals as dark shadows against the faint light from above. To avoid being seen, many fish and squid produce light on their undersides that matches the brightness of the water above them, making their outline almost invisible. Some can even adjust the intensity of this light as conditions change. The light is usually produced by special organs, and in some species by bacteria that live inside the animal.

Bioluminescence has also proved valuable to scientists. In the 1960s, researchers studying a glowing jellyfish discovered a protein that shines green under blue light. This green fluorescent protein can be attached to other molecules in living cells, allowing researchers to watch processes such as the growth of nerve cells or the spread of cancer. Its discovery and development were recognised with the Nobel Prize in Chemistry in 2008. The researchers who carried out this work showed that the protein could also be modified to produce other colours.

Researchers continue to find new applications. Some are testing bacteria that glow in the presence of pollutants, which could be used to detect contamination in water. Others have experimented with glowing plants, although suggestions that they might one day replace street lighting remain far from reality, since the light they produce is extremely faint. In some coastal areas, boat tours now take visitors out at night specifically to see glowing water. Meanwhile, marine biologists warn that artificial light from ships and coastal cities could interfere with the signals that many sea creatures depend on, a problem that is only beginning to be studied.`,
      questions: [
        noteLine(
          USES,
          "Finding food",
          "anglerfish: a glowing ______ attracts smaller fish",
          "lure",
          "Some use it to find food: the anglerfish, for example, dangles a glowing lure in front of its mouth to attract smaller fish.",
          "The anglerfish 'dangles a glowing lure in front of its mouth'.",
        ),
        noteLine(
          USES,
          "Finding food",
          "some deep-sea fish: ______ light lets them find prey unseen",
          "red",
          "Some deep-sea fish can even produce red light, which most other animals in the deep cannot see, allowing them to find prey without being noticed.",
          "They produce 'red light, which most other animals in the deep cannot see'.",
        ),
        noteLine(
          USES,
          "Defence",
          "some shrimp: release a ______ of glowing liquid when attacked",
          "cloud",
          "Certain species of shrimp release a cloud of glowing liquid when attacked, confusing the predator while they escape.",
          "The shrimp 'release a cloud of glowing liquid'.",
        ),
        noteLine(
          USES,
          "Finding a partner",
          "flashes in particular ______ recognised by the same species",
          "patterns",
          "Light can also help animals to find partners, since some species produce flashes in particular patterns that are recognised only by members of their own kind.",
          "The flashes come 'in particular patterns' that only their own species recognises.",
        ),
        noteLine(
          USES,
          "Camouflage",
          "fish and squid produce light on their ______",
          "undersides",
          "To avoid being seen, many fish and squid produce light on their undersides that matches the brightness of the water above them, making their outline almost invisible.",
          "The light is produced 'on their undersides' to match the water above.",
          {
            indent: 1,
            before: [{ text: "predators below see other animals as dark shadows", indent: 0 }],
          },
        ),
        noteLine(
          USES,
          "Camouflage",
          "some species can change the ______ of this light",
          "intensity",
          "Some can even adjust the intensity of this light as conditions change.",
          "They 'adjust the intensity of this light'.",
          { indent: 1 },
        ),
        noteLine(
          USES,
          "Camouflage",
          "in some species the light comes from ______ living inside them",
          "bacteria",
          "The light is usually produced by special organs, and in some species by bacteria that live inside the animal.",
          "In some species the light is made 'by bacteria that live inside the animal'.",
          { indent: 1 },
        ),
        tfng(
          "Bioluminescence produces a large amount of heat.",
          "FALSE",
          "The reaction releases energy in the form of light, while producing very little heat, which is why bioluminescence is sometimes described as cold light.",
          "It produces 'very little heat' — hence the name 'cold light'.",
        ),
        tfng(
          "All bioluminescent organisms use the same light-producing molecule.",
          "FALSE",
          "Different groups of organisms use different luciferins, suggesting that the ability has evolved independently many times — scientists estimate at least 40 times, and possibly far more.",
          "'Different groups of organisms use different luciferins'.",
        ),
        tfng(
          "Bioluminescence is found more often in the sea than on land.",
          "TRUE",
          "In the sea, however, it is extremely common.",
          "It is 'relatively rare' on land but 'extremely common' in the sea.",
        ),
        tfng(
          "In some places, fireflies that flash at the same time attract tourists.",
          "TRUE",
          "In some parts of South-East Asia and North America, thousands of fireflies flash at the same moment, creating waves of light that attract many tourists.",
          "The synchronised displays 'attract many tourists'.",
        ),
        tfng(
          "Most boat tours to see glowing water take place in summer.",
          "NOT GIVEN",
          "",
          "Night-time boat tours are mentioned, but not the time of year they run.",
        ),
        tfng(
          "Fungi that glow are found only in tropical forests.",
          "NOT GIVEN",
          "",
          "The passage says certain fungi glow on the forest floor but gives no information about where these forests are.",
        ),
      ],
    },
    {
      key: "t04-p2-four-day-week",
      title: "Four Days, Full Pay",
      topic: "what the four-day working week trials have shown",
      difficulty: 7,
      body: `A) For most of the twentieth century, the five-day working week was taken for granted in many industrialised countries. It was itself the product of long campaigns: in the nineteenth century, factory workers commonly worked six days a week for ten hours or more a day. Now some employers and politicians are asking whether the next step should be a four-day week, in which staff work fewer hours for the same pay. Supporters argue that advances in technology should allow people to produce as much as before in less time. Once regarded as unrealistic, the idea has been tested in trials involving thousands of employees on several continents.

B) The best-known of these took place in the United Kingdom in 2022, when 61 organisations, employing around 2,900 people, agreed to reduce working time for six months without cutting salaries. The trial was organised by a non-profit campaign group working with researchers from several universities. The companies ranged from small marketing firms to a fish and chip shop. Most adopted a model in which employees aimed to keep their productivity at the same level while working around 80 per cent of their previous hours, although the exact arrangements varied. Revenue at the participating companies stayed broadly the same over the trial period, and rose slightly on average. At the end of the trial, 56 of the 61 companies chose to continue with a shorter week, and 18 said the change would be permanent.

C) The results for employees were striking. Many reported lower levels of stress and burnout and better sleep, and said they found it easier to balance work with family responsibilities. Some also said they had more time for exercise, hobbies and caring for relatives. Researchers measured these effects using surveys completed before, during and after the trial. Sociologist Dr Helen Marsh, who helped to analyse the results, notes that the extra day off was often used for household tasks that would otherwise have filled the weekend, leaving people more genuinely rested. The number of employees leaving their jobs also fell significantly compared with the same period in the previous year.

D) For employers, the central question is productivity. Business economist Samuel Adeyemi argues that many offices contain a considerable amount of wasted time, from unnecessary meetings to constant interruptions by email. When staff know they have only four days, he says, they become far more disciplined about how that time is spent. Several companies in the trial reduced the length of meetings, introduced periods of the day in which staff could work without interruption, and made greater use of technology to automate routine tasks. Adeyemi adds that companies which simply cut hours without changing how they work are unlikely to see the same benefits.

E) Critics, however, question how far such results can be generalised. The companies that took part volunteered to do so, and were therefore likely to be those most enthusiastic about the idea and best suited to it. Labour economist Professor Ingrid Haugen points out that most participants worked in offices, where output is difficult to measure precisely. "It is much harder to see how a hospital, a school or a factory could reduce hours without hiring more staff," she says, "because in those settings the work cannot simply be done faster." She also notes that six months is a short period, and that the initial enthusiasm of staff may fade over time.

F) Supporters respond that the four-day week does not have to look the same everywhere. In some trials, employees worked staggered schedules, so that a service remained open five days a week even though each person worked only four. In one such trial, a company rotated its staff so that customers could still contact someone on every working day. Public sector experiments have also been carried out, including one involving a local council in England, although these have proved politically controversial. Management consultant Rosa Delgado believes that the most successful organisations treated the change as an opportunity to redesign how work is organised, rather than simply compressing five days of work into four.

G) Whether the idea will spread widely remains uncertain. Some countries have introduced laws giving employees the right to request a compressed or shorter week, and several large companies have announced their own schemes. Others argue that economic pressures, such as rising costs and labour shortages, make shorter hours harder to afford. Some employees also worry that a shorter week could mean more intense and stressful working days. Marsh suggests that the trials have at least changed the terms of the debate: the question is no longer whether a shorter week can work, but where and for whom. For now, the four-day week remains the exception rather than the rule.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the number of companies that decided to keep a shorter week",
          "B",
          "At the end of the trial, 56 of the 61 companies chose to continue with a shorter week, and 18 said the change would be permanent.",
          "Paragraph B: 56 of the 61 companies continued with a shorter week.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "examples of changes companies made to cut wasted time",
          "D",
          "Several companies in the trial reduced the length of meetings, introduced periods of the day in which staff could work without interruption, and made greater use of technology to automate routine tasks.",
          "Paragraph D lists shorter meetings, uninterrupted working time and automation.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reason why the companies in the trial may not have been typical",
          "E",
          "The companies that took part volunteered to do so, and were therefore likely to be those most enthusiastic about the idea and best suited to it.",
          "Paragraph E: volunteers were likely to be 'most enthusiastic' and 'best suited' — not typical.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to new laws in some countries",
          "G",
          "Some countries have introduced laws giving employees the right to request a compressed or shorter week, and several large companies have announced their own schemes.",
          "Paragraph G mentions laws giving 'the right to request a compressed or shorter week'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Employees in the trial reported less stress and ______.",
          "burnout",
          "Many reported lower levels of stress and burnout and better sleep, and said they found it easier to balance work with family responsibilities.",
          "They reported 'lower levels of stress and burnout'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "These effects were measured with ______ completed before, during and after the trial.",
          "surveys",
          "Researchers measured these effects using surveys completed before, during and after the trial.",
          "The effects were measured 'using surveys'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The extra day off was often spent on household ______.",
          "tasks",
          "Sociologist Dr Helen Marsh, who helped to analyse the results, notes that the extra day off was often used for household tasks that would otherwise have filled the weekend, leaving people more genuinely rested.",
          "It was 'often used for household tasks'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Fewer employees left their ______ than in the previous year.",
          "jobs",
          "The number of employees leaving their jobs also fell significantly compared with the same period in the previous year.",
          "'The number of employees leaving their jobs also fell significantly'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Staff use their time more carefully when they have fewer days in which to work.",
          "Samuel Adeyemi",
          "When staff know they have only four days, he says, they become far more disciplined about how that time is spent.",
          "Adeyemi says staff become 'far more disciplined about how that time is spent'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "In some types of work, tasks cannot be completed more quickly.",
          "Ingrid Haugen",
          '"It is much harder to see how a hospital, a school or a factory could reduce hours without hiring more staff," she says, "because in those settings the work cannot simply be done faster."',
          "Haugen: in hospitals, schools and factories 'the work cannot simply be done faster'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "A shorter week works best when organisations rethink the way work is done.",
          "Rosa Delgado",
          "Management consultant Rosa Delgado believes that the most successful organisations treated the change as an opportunity to redesign how work is organised, rather than simply compressing five days of work into four.",
          "Delgado says successful organisations used it 'to redesign how work is organised'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "The debate is no longer about whether a shorter week is possible at all.",
          "Helen Marsh",
          "Marsh suggests that the trials have at least changed the terms of the debate: the question is no longer whether a shorter week can work, but where and for whom.",
          "Marsh: the question is now 'where and for whom', not whether it can work.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Workers' early enthusiasm for the change might not last.",
          "Ingrid Haugen",
          "She also notes that six months is a short period, and that the initial enthusiasm of staff may fade over time.",
          "'She' is Haugen: 'the initial enthusiasm of staff may fade over time'.",
        ),
      ],
    },
    {
      key: "t04-p3-rapa-nui",
      title: "The Collapse That Never Was?",
      topic: "new evidence about the history of Rapa Nui",
      difficulty: 8,
      body: `Few places have been used more often as a warning about the future than Rapa Nui, the remote Pacific island also known as Easter Island. The story is familiar from textbooks and popular books. Polynesian settlers arrived on a green, forested island, grew in number and competed to build ever larger stone statues, known as moai. To transport and raise these monuments, and to clear land for farming, they cut down all the island's trees. Without forests, the soil eroded, crops failed and the population, which may once have numbered 15,000 or more, collapsed into warfare and famine long before European ships arrived in 1722. The lesson seemed clear: a society that destroys its environment destroys itself.

In recent decades, however, this account has been challenged on almost every point. Radiocarbon dating now suggests that people first settled the island around the year 1200, several centuries later than was once believed, leaving far less time for a long rise and fall. Studies of pollen and charcoal confirm that the island's palm forests did disappear, but they point to a more complicated cause. Seeds of the island's palm trees found by archaeologists often show marks made by the teeth of rats, which arrived with the first settlers and had no natural predators. The rats reproduced rapidly and may soon have numbered in the millions. Some researchers argue that these rats, by eating seeds, prevented the forest from regenerating.

Crucially, the loss of the forest does not appear to have led to disaster. Archaeologists have found that the islanders adapted, developing a technique in which they placed stones on their fields. These rock gardens kept the soil moist, protected young plants from the wind and released nutrients as the stones slowly weathered. In 2024, a team of researchers used satellite images and machine learning to map these gardens across the island. They concluded that they covered a far smaller area than earlier estimates had assumed, and that the island could have supported a population of only around 3,000 people — close to the number Europeans recorded when they arrived.

If this is correct, there was never a population of 15,000 to collapse. Instead, the evidence suggests a small society that lived within its limits for several centuries. Other findings support this view. An analysis of ancient DNA published the same year, based on the remains of fifteen people who lived on the island between the seventeenth and nineteenth centuries, found no sign of a sharp fall in population before European contact; the population appears to have grown steadily until the 1860s. The construction of statues also seems to have continued, rather than stopping suddenly as the traditional story required.

What, then, went wrong? The answer, according to many researchers, lies not in the islanders' treatment of their environment but in what happened after 1722. European and American ships brought diseases to which the islanders had no immunity. In the 1860s, slave traders from Peru captured around 1,500 people, many of whom died in captivity; the few who returned brought smallpox with them. Missionaries and a sheep-farming company later took control of much of the land, restricting where the remaining islanders could live. By the 1870s, only about a hundred islanders remained. The collapse was real, but it came from outside.

The debate is not entirely settled. Some scholars maintain that deforestation must have caused hardship and conflict, even if it did not destroy the society, and they point out that estimates of past populations always involve considerable uncertainty. They also note that the rock gardens themselves may have been developed in response to earlier environmental problems. I find the newer evidence persuasive, but the lesson I draw from it is not that environmental damage does not matter. The disappearance of the palm forest was a genuine loss, and it is a reminder that human activity, including the accidental introduction of other species, can transform an ecosystem.

What the revised history offers is a more respectful account of the islanders themselves. For decades they were presented as reckless people who brought ruin upon themselves, a story that conveniently overlooked the far greater harm caused by outsiders. Their descendants, who today make up a significant part of the island's population, have long objected to the older version of their history. The evidence instead reveals a community that faced a difficult environment with considerable ingenuity. If Rapa Nui still has a lesson for the modern world, it may be about resilience rather than self-destruction.`,
      questions: [
        mcq(
          "According to the traditional story, what happened on Rapa Nui before 1722?",
          [
            "The islanders stopped building statues because of pressure from outsiders.",
            "The population fell sharply because of environmental damage.",
            "The first settlers arrived to find an island without trees.",
            "The statues were built by people from other islands.",
          ],
          "The population fell sharply because of environmental damage.",
          "Without forests, the soil eroded, crops failed and the population, which may once have numbered 15,000 or more, collapsed into warfare and famine long before European ships arrived in 1722.",
          "In the old account, deforestation led to erosion, failed crops and a collapse 'long before European ships arrived in 1722'.",
        ),
        mcq(
          "What is suggested about the rats that arrived with the first settlers?",
          [
            "They were brought to the island deliberately as food.",
            "They may have stopped the palm forest from growing back.",
            "They were hunted by the islanders until they died out.",
            "They arrived several centuries after the first settlers.",
          ],
          "They may have stopped the palm forest from growing back.",
          "Some researchers argue that these rats, by eating seeds, prevented the forest from regenerating.",
          "By eating seeds, the rats 'prevented the forest from regenerating'. D contradicts 'arrived with the first settlers'.",
        ),
        mcq(
          "What did the researchers who studied satellite images in 2024 conclude?",
          [
            "The rock gardens covered a larger area than previously thought.",
            "The island could have supported only about 3,000 people.",
            "Machine learning could not identify the gardens reliably.",
            "Most of the gardens were created after European contact.",
          ],
          "The island could have supported only about 3,000 people.",
          "They concluded that they covered a far smaller area than earlier estimates had assumed, and that the island could have supported a population of only around 3,000 people — close to the number Europeans recorded when they arrived.",
          "They concluded the island 'could have supported a population of only around 3,000 people'. A is the opposite of their finding.",
        ),
        mcq(
          "What does the writer say about the older version of the island's history in the final paragraph?",
          [
            "It gave an unfair picture of the islanders.",
            "It was first told by the islanders' descendants.",
            "It is once again accepted by most historians.",
            "It correctly identified the causes of the collapse.",
          ],
          "It gave an unfair picture of the islanders.",
          "For decades they were presented as reckless people who brought ruin upon themselves, a story that conveniently overlooked the far greater harm caused by outsiders.",
          "The old story showed the islanders as 'reckless' and 'overlooked the far greater harm caused by outsiders'. B is wrong: the descendants objected to it.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Radiocarbon dating shows that the island was settled ______ than scientists once believed.",
          "later",
          "Radiocarbon dating now suggests that people first settled the island around the year 1200, several centuries later than was once believed, leaving far less time for a long rise and fall.",
          "Settlement came 'several centuries later than was once believed'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "The seeds of palm trees show damage caused by ______.",
          "rats",
          "Seeds of the island's palm trees found by archaeologists often show marks made by the teeth of rats, which arrived with the first settlers and had no natural predators.",
          "The seeds show 'marks made by the teeth of rats'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "The islanders adapted by placing ______ on their fields.",
          "stones",
          "Archaeologists have found that the islanders adapted, developing a technique in which they placed stones on their fields.",
          "They 'placed stones on their fields'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "This technique helped to keep the soil ______.",
          "moist",
          "These rock gardens kept the soil moist, protected young plants from the wind and released nutrients as the stones slowly weathered.",
          "The rock gardens 'kept the soil moist'. 'Dry' is the opposite.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Mapping showed that the gardens covered a ______ area than had been assumed.",
          "smaller",
          "They concluded that they covered a far smaller area than earlier estimates had assumed, and that the island could have supported a population of only around 3,000 people — close to the number Europeans recorded when they arrived.",
          "They 'covered a far smaller area than earlier estimates had assumed'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "The later fall in population was caused largely by ______ brought by outsiders.",
          "disease",
          "European and American ships brought diseases to which the islanders had no immunity.",
          "Ships 'brought diseases to which the islanders had no immunity'. 'Famine' belongs to the old story.",
        ),
        ynng(
          "The evidence that the island's palm forests disappeared is unreliable.",
          "NO",
          "Studies of pollen and charcoal confirm that the island's palm forests did disappear, but they point to a more complicated cause.",
          "The writer says the studies 'confirm' the forests disappeared; only the cause is disputed.",
        ),
        ynng(
          "The newer evidence about Rapa Nui's past is convincing.",
          "YES",
          "I find the newer evidence persuasive, but the lesson I draw from it is not that environmental damage does not matter.",
          "'I find the newer evidence persuasive' states the writer's view directly.",
        ),
        ynng(
          "The loss of the palm forest was of little importance.",
          "NO",
          "The disappearance of the palm forest was a genuine loss, and it is a reminder that human activity, including the accidental introduction of other species, can transform an ecosystem.",
          "The writer calls it 'a genuine loss', contradicting the statement.",
        ),
        ynng(
          "Most visitors to Rapa Nui today are aware of the revised history.",
          "NOT GIVEN",
          "",
          "Visitors are never mentioned, so the writer's view is unknown.",
        ),
      ],
    },
  ],
};
