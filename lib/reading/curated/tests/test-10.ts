import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · notes box --------------------------------------------------------

const OCTOPUS = { title: "The octopus", layout: "notes" as const, wordLimit: "ONE WORD ONLY" };

// ---- Passage 2 · lettered paragraphs and people -----------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CARE_PEOPLE = ["Yuki Tanabe", "Daniel Frost", "Clara Mendes", "Robert Kamau"];

// ---- Passage 3 · word bank --------------------------------------------------------

const BANK = [
  "hair",
  "skin",
  "trampling",
  "planting",
  "colder",
  "warmer",
  "diversity",
  "surrogate",
  "learned",
  "inherited",
];

export const TEST_10: CuratedTest = {
  key: "full-test-10",
  targetBand: 8,
  passages: [
    {
      key: "t10-p1-octopus-minds",
      title: "The Mind of the Octopus",
      topic: "why octopuses are so intelligent",
      difficulty: 7,
      body: `Of all the animals without a backbone, none has impressed scientists more than the octopus. These soft-bodied creatures, related to snails and clams, have shown abilities that were once thought to belong only to mammals and birds. In laboratories and aquariums, octopuses have been observed opening jars to reach food, finding their way through mazes and recognising individual people. Aquarium staff have also reported octopuses squirting water at people they seem to dislike. Some have even escaped from their tanks at night, crossed the floor to raid neighbouring tanks and returned before morning. Such stories have made octopuses popular subjects for documentaries and books.

The octopus nervous system is unusual. An octopus has around 500 million neurons, a number comparable to that of a dog, but only about a third of them are in its central brain. The remaining two-thirds are located in its eight arms, each of which can taste and touch the objects it encounters and can carry out complex movements with little direction from the brain. The suckers on each arm contain many sensory cells, allowing the animal to explore crevices that it cannot see. Each arm can also move independently, which allows the animal to perform several tasks at once. Researchers have found that an arm that has been separated from the body can still grasp objects for some time, suggesting that much of its behaviour is controlled locally.

Octopuses are also masters of disguise. Their skin contains thousands of cells called chromatophores, each holding a sac of coloured pigment that can be expanded or contracted within a fraction of a second. By controlling these cells, an octopus can change colour to match its surroundings. Some species can also alter the texture of their skin, raising small bumps to imitate rocks or seaweed. Some species can even make themselves look like other animals, such as venomous sea snakes or poisonous fish. The colour changes can also be used to communicate, for example when an octopus is threatened. Remarkably, octopuses appear to be colour-blind, and how they manage to match colours so accurately remains a subject of research.

Their intelligence is all the more surprising because octopuses live such short lives. Most species survive for only one or two years, and many die soon after breeding. Females typically guard their eggs without eating until they hatch, and then die. In many species, males also die within weeks of mating. Octopuses also receive no care from their parents and must learn everything for themselves. Scientists have long wondered why an animal with so little time would develop such a powerful brain.

One explanation concerns their evolutionary history. The ancestors of octopuses were protected by shells, but over millions of years they lost them, gaining flexibility at the cost of becoming vulnerable to predators. Without a shell, an octopus must rely on its wits to find food and avoid being eaten, and some researchers believe this pressure drove the evolution of problem-solving abilities. Another suggestion is that hunting for many different kinds of prey in complex environments such as coral reefs rewarded animals that could learn quickly. Octopuses have been observed using tools, such as carrying coconut shells to use as portable shelters. Such abilities are rare among invertebrates.

Studies of octopus behaviour have also raised questions about their capacity to feel pain and distress. In one experiment, octopuses avoided a chamber in which they had received an unpleasant injection and preferred a chamber where they had been given a painkiller. Octopuses have also been seen tending injured parts of their bodies, a behaviour associated with pain in other animals. Such evidence contributed to a decision in the United Kingdom in 2022 to recognise octopuses, together with squid, cuttlefish, crabs and lobsters, as sentient beings under animal welfare law. The decision followed a government-commissioned review of more than 300 scientific studies.

These findings have practical consequences. Plans to farm octopuses on a large scale for food have been strongly criticised by scientists and animal welfare groups, who argue that intelligent, solitary animals would suffer in crowded tanks. Critics also point out that octopuses are carnivores, so farming them would require large amounts of fish as feed. Supporters of farming argue that it could reduce pressure on wild populations. Some countries and regions have introduced or proposed bans on octopus farming. For researchers, meanwhile, the octopus offers a unique opportunity to study how intelligence can evolve along a completely different path from our own.`,
      questions: [
        noteLine(
          OCTOPUS,
          "Nervous system",
          "two-thirds of its neurons are in the ______",
          "arms",
          "The remaining two-thirds are located in its eight arms, each of which can taste and touch the objects it encounters and can carry out complex movements with little direction from the brain.",
          "Two-thirds of the neurons 'are located in its eight arms'.",
        ),
        noteLine(
          OCTOPUS,
          "Nervous system",
          "sensory cells in the ______ help it explore crevices",
          "suckers",
          "The suckers on each arm contain many sensory cells, allowing the animal to explore crevices that it cannot see.",
          "'The suckers on each arm contain many sensory cells'.",
        ),
        noteLine(
          OCTOPUS,
          "Nervous system",
          "a separated arm can still ______ objects for a time",
          "grasp",
          "Researchers have found that an arm that has been separated from the body can still grasp objects for some time, suggesting that much of its behaviour is controlled locally.",
          "A separated arm 'can still grasp objects for some time'.",
        ),
        noteLine(
          OCTOPUS,
          "Camouflage",
          "chromatophores each hold a sac of coloured ______",
          "pigment",
          "Their skin contains thousands of cells called chromatophores, each holding a sac of coloured pigment that can be expanded or contracted within a fraction of a second.",
          "Each chromatophore holds 'a sac of coloured pigment'.",
        ),
        noteLine(
          OCTOPUS,
          "Camouflage",
          "some species can change the ______ of their skin",
          "texture",
          "Some species can also alter the texture of their skin, raising small bumps to imitate rocks or seaweed.",
          "They 'alter the texture of their skin'.",
        ),
        noteLine(
          OCTOPUS,
          "Life cycle",
          "most species live for only one or two ______",
          "years",
          "Most species survive for only one or two years, and many die soon after breeding.",
          "Most 'survive for only one or two years'.",
        ),
        noteLine(
          OCTOPUS,
          "Life cycle",
          "females guard their eggs without ______ until they hatch",
          "eating",
          "Females typically guard their eggs without eating until they hatch, and then die.",
          "Females guard the eggs 'without eating'.",
        ),
        tfng(
          "Octopuses are related to snails.",
          "TRUE",
          "These soft-bodied creatures, related to snails and clams, have shown abilities that were once thought to belong only to mammals and birds.",
          "Octopuses are 'related to snails and clams'.",
        ),
        tfng(
          "Octopuses are able to see colours clearly.",
          "FALSE",
          "Remarkably, octopuses appear to be colour-blind, and how they manage to match colours so accurately remains a subject of research.",
          "They 'appear to be colour-blind'.",
        ),
        tfng(
          "Young octopuses learn skills by watching their parents.",
          "FALSE",
          "Octopuses also receive no care from their parents and must learn everything for themselves.",
          "They 'receive no care from their parents'.",
        ),
        tfng(
          "The ancestors of octopuses had shells.",
          "TRUE",
          "The ancestors of octopuses were protected by shells, but over millions of years they lost them, gaining flexibility at the cost of becoming vulnerable to predators.",
          "Their ancestors 'were protected by shells'.",
        ),
        tfng(
          "The review of more than 300 studies was carried out by a university in London.",
          "NOT GIVEN",
          "",
          "The review was 'government-commissioned', but who carried it out is not stated.",
        ),
        tfng(
          "Octopuses kept in aquariums live longer than those in the wild.",
          "NOT GIVEN",
          "",
          "Lifespans are given in general, with no comparison between captive and wild octopuses.",
        ),
      ],
    },
    {
      key: "t10-p2-care-robots",
      title: "Caring Machines",
      topic: "the use of robots in the care of older people",
      difficulty: 8,
      body: `A) Across much of the developed world, populations are ageing rapidly. In Japan, nearly three in ten people are now aged 65 or over, and similar trends are under way in much of Europe and East Asia. As the number of older people requiring care rises, the number of working-age people available to provide it is falling. In some countries, care homes already struggle to fill vacancies, and many care workers leave the profession within a few years. The shortage is expected to become more severe over the coming decades. Governments and care providers are therefore looking to technology for help, and robots designed to assist older people are moving from research laboratories into care homes and private households.

B) Care robots take many forms. Some are designed to perform physical tasks, such as helping staff lift residents out of bed or supporting people as they walk. Others monitor residents, detecting falls or unusual patterns of movement at night and alerting staff. Some robots can also remind people to take their medication or connect them to family members by video. A further group, often called social robots, are intended to provide companionship and mental stimulation. The best known of these is a furry robot shaped like a baby seal, which responds to touch and sound and has been used in care homes in many countries since the early 2000s.

C) Supporters point to encouraging results. Gerontologist Dr Yuki Tanabe, who has studied the use of robots in Japanese care homes, reports that the seal robot can reduce anxiety and agitation among some residents with dementia, and can encourage them to talk to staff and to each other. "For some residents, it provides comfort that is difficult to offer in any other way," she says. Some residents appear to treat the robot as a pet, stroking it and speaking to it. Monitoring systems, meanwhile, allow staff to check on residents without entering their rooms during the night, which some residents say helps them to sleep.

D) Yet the evidence is more mixed than enthusiasts sometimes suggest. Many studies have been small and short, and some have been funded by manufacturers. Health economist Professor Daniel Frost points out that robots are expensive to buy and maintain, and that the time staff spend setting them up, charging them and dealing with faults can reduce the savings they are supposed to deliver. He also notes that a robot which breaks down can cause considerable distress to a resident who has become attached to it. In a large Japanese government programme to introduce care robots, many devices were reportedly used only briefly before being abandoned.

E) There are also deeper ethical concerns. Philosopher Dr Clara Mendes argues that offering robots as companions to lonely older people risks treating loneliness as a technical problem rather than a social one. "A machine that imitates affection may make it easier for families and societies to withdraw from caring relationships," she warns. Others worry about privacy, since monitoring devices collect detailed information about residents' daily lives, and about whether people with advanced dementia can meaningfully consent to their use. Some residents may also be unable to tell whether they are interacting with a machine or a living creature.

F) Care workers themselves hold a range of views. In surveys, many say they would welcome help with physically demanding tasks such as lifting, which can cause back injuries. Fewer are enthusiastic about robots that interact socially with residents. Some also worry that robots may be introduced mainly to reduce staff numbers rather than to improve care. Care home manager Robert Kamau says that his staff initially feared that the machines were intended to replace them, but came to accept devices that reduced their workload. "The key was involving staff from the beginning," he explains, "so that the technology supported what they already did well."

G) Most researchers now believe that robots will play a supporting rather than a central role in care. The most promising uses appear to be those that free human carers from routine or physically exhausting work, allowing them more time for personal contact with residents. Several countries are now developing guidelines on the use of robots in care settings. Such guidelines typically emphasise consent, privacy and the need for human oversight. Tanabe believes that the question is not whether robots will be used in care, but how they can be introduced in ways that respect the dignity of the people being cared for. That, she argues, requires listening to older people themselves, whose views have too often been ignored.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to robots that can tell staff when someone has fallen",
          "B",
          "Others monitor residents, detecting falls or unusual patterns of movement at night and alerting staff.",
          "Paragraph B: monitoring robots detect falls and alert staff.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a mention of research paid for by the companies that make robots",
          "D",
          "Many studies have been small and short, and some have been funded by manufacturers.",
          "Paragraph D: some studies 'have been funded by manufacturers'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a concern about whether some residents are able to agree to the use of robots",
          "E",
          "Others worry about privacy, since monitoring devices collect detailed information about residents' daily lives, and about whether people with advanced dementia can meaningfully consent to their use.",
          "Paragraph E questions whether people with advanced dementia 'can meaningfully consent'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reason why care workers might welcome help with lifting",
          "F",
          "In surveys, many say they would welcome help with physically demanding tasks such as lifting, which can cause back injuries.",
          "Paragraph F: lifting 'can cause back injuries'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD AND/OR A NUMBER",
          "In Japan, nearly three in ten people are now aged ______ or over.",
          "65",
          "In Japan, nearly three in ten people are now aged 65 or over, and similar trends are under way in much of Europe and East Asia.",
          "Nearly three in ten are 'aged 65 or over'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD AND/OR A NUMBER",
          "Some robots remind people to take their ______.",
          "medication",
          "Some robots can also remind people to take their medication or connect them to family members by video.",
          "They 'remind people to take their medication'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD AND/OR A NUMBER",
          "Some residents appear to treat the seal robot as a ______.",
          "pet",
          "Some residents appear to treat the robot as a pet, stroking it and speaking to it.",
          "They 'treat the robot as a pet'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD AND/OR A NUMBER",
          "Several countries are writing ______ on the use of robots in care.",
          "guidelines",
          "Several countries are now developing guidelines on the use of robots in care settings.",
          "Countries 'are now developing guidelines'.",
        ),
        fromList(
          "matching_features",
          CARE_PEOPLE,
          "The cost of running robots can reduce the savings they are meant to bring.",
          "Daniel Frost",
          "Health economist Professor Daniel Frost points out that robots are expensive to buy and maintain, and that the time staff spend setting them up, charging them and dealing with faults can reduce the savings they are supposed to deliver.",
          "Frost: staff time 'can reduce the savings they are supposed to deliver'.",
        ),
        fromList(
          "matching_features",
          CARE_PEOPLE,
          "Robot companions could make it easier for people to stop caring for others.",
          "Clara Mendes",
          '"A machine that imitates affection may make it easier for families and societies to withdraw from caring relationships," she warns.',
          "Mendes warns it may help people 'withdraw from caring relationships'.",
        ),
        fromList(
          "matching_features",
          CARE_PEOPLE,
          "Staff should be involved in introducing new technology from the start.",
          "Robert Kamau",
          '"The key was involving staff from the beginning," he explains, "so that the technology supported what they already did well."',
          "Kamau: 'The key was involving staff from the beginning'.",
        ),
        fromList(
          "matching_features",
          CARE_PEOPLE,
          "A robot can comfort some residents in a way that is hard to achieve otherwise.",
          "Yuki Tanabe",
          '"For some residents, it provides comfort that is difficult to offer in any other way," she says.',
          "Tanabe: comfort 'that is difficult to offer in any other way'.",
        ),
        fromList(
          "matching_features",
          CARE_PEOPLE,
          "The views of older people should be given more attention.",
          "Yuki Tanabe",
          "That, she argues, requires listening to older people themselves, whose views have too often been ignored.",
          "Tanabe again: older people's views 'have too often been ignored'.",
        ),
      ],
    },
    {
      key: "t10-p3-de-extinction",
      title: "Bringing Back the Lost",
      topic: "the debate over reviving extinct species",
      difficulty: 8,
      body: `In April 2025, a biotechnology company announced that it had produced three wolf pups with some of the characteristics of the dire wolf, a large predator that became extinct more than 10,000 years ago. The company described the animals as the world's first successful example of de-extinction, and photographs of the white-furred pups spread rapidly across social media. Many scientists disagreed with the description. The pups, they pointed out, were grey wolves whose genes had been edited in around twenty places, whereas the dire wolf differed from living wolves in many thousands of ways. The episode illustrated both the growing power of genetic technology and the confusion surrounding what it can actually achieve.

The idea of bringing extinct species back to life has fascinated the public for decades, and several projects are now under way. The same company, which has attracted hundreds of millions of dollars from investors, has announced plans to create an elephant adapted to cold climates, with features of the woolly mammoth, such as thick hair and a layer of fat. Other groups are working on the passenger pigeon, once the most numerous bird in North America, and on the northern white rhinoceros, of which only two females survive. Some projects rely on DNA recovered from museum specimens and from remains preserved in frozen ground. In most cases, the aim is not to recreate an exact copy of the lost species, which is scientifically impossible, but to produce a living animal with some of its key characteristics.

Supporters argue that de-extinction could benefit the environment. The woolly mammoth, they suggest, once helped to maintain the grasslands of the Arctic by trampling snow and knocking down trees, which kept the ground colder in winter. Reintroducing similar animals might therefore slow the thawing of frozen soil, which releases greenhouse gases as it warms. They also argue that the techniques developed for de-extinction could help to save endangered species, for example by restoring genetic diversity to small populations. Some even see de-extinction as a way of correcting past mistakes, since many species disappeared because of human activity. They add that the public excitement generated by such projects can attract new support for conservation.

I find the second argument considerably more persuasive than the first. Genetic tools that can rescue struggling populations are already proving their value. A species of North American ferret, once reduced to a handful of individuals, has been given greater genetic variety through cloning from cells stored decades ago. Similar methods are being tested on other species whose numbers have fallen to dangerously low levels. By contrast, the claim that engineered elephants could protect the Arctic depends on releasing large numbers of animals into a vast region, a prospect that is decades away at best and may never be practical.

There are also serious ethical questions. Elephants are intelligent, social animals, and producing engineered calves would require surrogate mothers and repeated pregnancies. Elephant pregnancies last around twenty-two months, which would make any breeding programme extremely slow. Some scientists have suggested using artificial wombs instead, although such technology does not yet exist for large mammals. It is far from clear that animals created in this way could live healthy lives, or where they would live once they were born. Moreover, a species is more than its genes: much of an animal's behaviour is learned from others of its kind, and a mammoth-like elephant would have no mammoths to learn from.

Perhaps the strongest objection concerns priorities. Conservation budgets are limited, and money spent on reviving lost species is money not spent on protecting the many species that are still alive but threatened. Some ecologists also fear that the promise of de-extinction could weaken public concern about extinction itself, by suggesting that the loss of a species need not be permanent. Others worry that releasing engineered animals could have unpredictable effects on existing ecosystems. Supporters respond that most de-extinction research is paid for by private investors who would not otherwise fund conservation, but this does not remove the risk of creating a misleading impression.

None of this means that the research should stop. Much of the science involved, from reading ancient DNA to editing genes precisely, is valuable in its own right. What is needed is greater honesty about what de-extinction can and cannot achieve. Scientists, companies and journalists all share responsibility for how such work is described. Describing edited wolves as resurrected dire wolves may attract investment and headlines, but it misleads the public and undermines trust in science at a time when that trust is badly needed.`,
      questions: [
        mcq(
          "Why did many scientists disagree with the company's announcement in 2025?",
          [
            "The pups were not related to wolves at all.",
            "The pups' genes had been changed in only a small number of places.",
            "The dire wolf had never really existed.",
            "The company had not produced any living animals.",
          ],
          "The pups' genes had been changed in only a small number of places.",
          "The pups, they pointed out, were grey wolves whose genes had been edited in around twenty places, whereas the dire wolf differed from living wolves in many thousands of ways.",
          "The pups were edited 'in around twenty places', while dire wolves differed 'in many thousands of ways'.",
        ),
        mcq(
          "What is the aim of most de-extinction projects?",
          [
            "to create an exact copy of an extinct species",
            "to produce animals with some features of a lost species",
            "to increase the number of elephants in Asia",
            "to preserve DNA in museum collections",
          ],
          "to produce animals with some features of a lost species",
          "In most cases, the aim is not to recreate an exact copy of the lost species, which is scientifically impossible, but to produce a living animal with some of its key characteristics.",
          "The aim is 'a living animal with some of its key characteristics'. A is described as 'scientifically impossible'.",
        ),
        mcq(
          "Why does the writer mention a North American ferret?",
          [
            "to show that genetic tools can already help endangered species",
            "to give an example of an animal that has become extinct",
            "to criticise the use of cloning in conservation",
            "to explain how mammoths were studied",
          ],
          "to show that genetic tools can already help endangered species",
          "Genetic tools that can rescue struggling populations are already proving their value.",
          "The ferret illustrates genetic tools 'already proving their value'.",
        ),
        mcq(
          "What does the writer call for in the final paragraph?",
          [
            "an end to all de-extinction research",
            "a ban on private investment in genetic research",
            "more honesty about what de-extinction can achieve",
            "less media coverage of genetic technology",
          ],
          "more honesty about what de-extinction can achieve",
          "What is needed is greater honesty about what de-extinction can and cannot achieve.",
          "The writer wants 'greater honesty'. A is contradicted: the research should not stop.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "A cold-adapted elephant would have mammoth features such as thick ______.",
          "hair",
          "The same company, which has attracted hundreds of millions of dollars from investors, has announced plans to create an elephant adapted to cold climates, with features of the woolly mammoth, such as thick hair and a layer of fat.",
          "The features include 'thick hair and a layer of fat'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Mammoths may have kept Arctic grasslands open by ______ snow.",
          "trampling",
          "The woolly mammoth, they suggest, once helped to maintain the grasslands of the Arctic by trampling snow and knocking down trees, which kept the ground colder in winter.",
          "They maintained grasslands 'by trampling snow'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "As a result, the ground stayed ______ in winter.",
          "colder",
          "The woolly mammoth, they suggest, once helped to maintain the grasslands of the Arctic by trampling snow and knocking down trees, which kept the ground colder in winter.",
          "This 'kept the ground colder in winter'. 'Warmer' is the opposite.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "The same techniques could help endangered species by restoring genetic ______.",
          "diversity",
          "They also argue that the techniques developed for de-extinction could help to save endangered species, for example by restoring genetic diversity to small populations.",
          "They could restore 'genetic diversity to small populations'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Producing engineered elephant calves would require ______ mothers.",
          "surrogate",
          "Elephants are intelligent, social animals, and producing engineered calves would require surrogate mothers and repeated pregnancies.",
          "It 'would require surrogate mothers'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Much of an animal's behaviour is ______ from others of its kind.",
          "learned",
          "Moreover, a species is more than its genes: much of an animal's behaviour is learned from others of its kind, and a mammoth-like elephant would have no mammoths to learn from.",
          "Behaviour 'is learned from others of its kind'. 'Inherited' is the trap: the point is that genes are not enough.",
        ),
        ynng(
          "De-extinction's benefits for endangered species are more convincing than its claimed benefits for the Arctic.",
          "YES",
          "I find the second argument considerably more persuasive than the first.",
          "The second argument (endangered species) is 'considerably more persuasive' than the first (the Arctic).",
        ),
        ynng(
          "Engineered elephants could soon be released in large numbers in the Arctic.",
          "NO",
          "By contrast, the claim that engineered elephants could protect the Arctic depends on releasing large numbers of animals into a vast region, a prospect that is decades away at best and may never be practical.",
          "This is 'decades away at best and may never be practical'.",
        ),
        ynng(
          "Private funding of de-extinction research removes the risk of misleading the public.",
          "NO",
          "Supporters respond that most de-extinction research is paid for by private investors who would not otherwise fund conservation, but this does not remove the risk of creating a misleading impression.",
          "Private funding 'does not remove the risk of creating a misleading impression'.",
        ),
        ynng(
          "The northern white rhinoceros project will succeed within ten years.",
          "NOT GIVEN",
          "",
          "The project is mentioned, but the writer gives no view on whether or when it will succeed.",
        ),
      ],
    },
  ],
};
