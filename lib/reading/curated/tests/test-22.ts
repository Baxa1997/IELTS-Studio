import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · engineering history · flow-chart ----------------------------

const HOT_MIX = {
  title: "How hot-mixed Roman concrete repairs itself",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO ------------------

const SEAGRASS_PEOPLE = ["Isla Morrison", "Ahmed Karim", "Hannah Price", "Tomasz Nowak"];
const SEAGRASS_BANK = [
  "dugongs",
  "erosion",
  "algae",
  "anchors",
  "disease",
  "scallop",
  "whales",
  "flooding",
  "nets",
  "salmon",
];
const RESTORE_STEM = "Which TWO difficulties in restoring seagrass are mentioned in the passage?";
const RESTORE = [
  "Seeds are hard to collect in large numbers.",
  "Volunteers are unwilling to take part.",
  "Each site must be studied carefully before planting.",
  "Seeds can only be planted in winter.",
  "Seagrass spreads too quickly to control.",
];

// ---- Passage 3 · subject-heavy · lettered paragraphs and people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PLANT_PEOPLE = ["Rachel Adler", "Daniel Kogan", "Paolo Ferri", "Ingrid Solberg"];

export const TEST_22: CuratedTest = {
  key: "full-test-22",
  targetBand: 7,
  passages: [
    {
      key: "t22-p1-roman-concrete",
      title: "Why Roman Concrete Lasts",
      topic: "the secrets behind the long life of Roman concrete",
      difficulty: 6,
      body: `In the centre of Rome stands the Pantheon, a temple completed in about 125 CE. Its great dome, more than 43 metres across, is still the largest concrete dome in the world without steel reinforcement, and nearly two thousand years after it was built, the building remains in use. Many other Roman structures, from harbour walls to aqueducts, have also survived for centuries, while some modern concrete buildings begin to crumble within decades. For a long time, scientists have tried to understand why Roman concrete has proved so durable.

Roman concrete was made from a mixture of lime, water, pieces of rock and a volcanic ash known as pozzolana, named after the town of Pozzuoli near Naples, where it was found in large quantities. The ash reacted with the lime to form a strong material that could set even under water, a property that made it ideal for building harbours. The Roman engineer Vitruvius, writing in the first century BCE, described how the materials should be mixed, and the Roman author Pliny the Elder later wrote with amazement about harbour structures that became stronger the longer they stood in the sea.

Research in the twenty-first century has helped to explain Pliny's observation. In 2017, a team of geologists studying samples from ancient Roman harbour walls found that seawater slowly passing through the concrete had dissolved some of the volcanic material. This allowed new minerals to grow within the concrete, filling gaps and strengthening the structure over time. Modern concrete, by contrast, is designed to be chemically stable once it has set, and seawater gradually damages it.

A further discovery was made in 2023 by researchers at a university in the United States. Scientists had long noticed that Roman concrete contained small white lumps of lime, a few millimetres across. These had usually been dismissed as evidence of poor mixing. The new study, however, suggested that they were the result of a deliberate technique known as hot mixing, in which the builders added lime in a highly reactive form known as quicklime. When quicklime is mixed with water, it produces intense heat, and the high temperatures appear to have created the lumps and to have made the concrete set more quickly.

The researchers then tested whether the lumps could help the concrete to repair itself. They made samples of concrete using both the Roman method and a modern method, deliberately cracked them, and then allowed water to run through the cracks. Within about two weeks, the cracks in the hot-mixed concrete had closed completely, and water could no longer flow through. The samples made without lime lumps did not heal. The explanation is that water entering a crack dissolves some of the lime, which then reacts with carbon dioxide to form calcium carbonate, a hard mineral that fills the gap.

These findings have attracted interest from the modern construction industry, which faces two major problems. Concrete is the most widely used building material in the world, and the production of cement, its key ingredient, is responsible for roughly eight per cent of global carbon dioxide emissions. In addition, many concrete structures built in the twentieth century, such as bridges and motorways, are now deteriorating and require expensive repairs. Concrete that could repair its own cracks would last longer and need to be replaced less often, reducing both costs and emissions.

Some researchers are already trying to develop modern versions of Roman concrete. Several companies have produced concrete that includes lime lumps, while others are experimenting with different approaches, such as adding bacteria that produce limestone when they come into contact with water. However, Roman concrete also had weaknesses. It was generally much less strong than modern concrete when first made, and it did not contain steel reinforcement, which allows modern buildings to be much taller and thinner.

The Romans themselves probably did not fully understand the chemistry of the material they used. Their knowledge was based on experience passed down through generations of builders, who learned by trial and error which mixtures lasted longest. Yet by studying their work with modern scientific tools, researchers hope to learn lessons that could make the buildings of the future both longer lasting and less damaging to the planet. The ancient builders, it seems, still have something to teach us.`,
      questions: [
        tfng(
          "The Pantheon's dome is the largest concrete dome that has no steel reinforcement.",
          "TRUE",
          "Its great dome, more than 43 metres across, is still the largest concrete dome in the world without steel reinforcement, and nearly two thousand years after it was built, the building remains in use.",
          "It is 'the largest concrete dome in the world without steel reinforcement'.",
        ),
        tfng(
          "Vitruvius lived later than Pliny the Elder.",
          "FALSE",
          "The Roman engineer Vitruvius, writing in the first century BCE, described how the materials should be mixed, and the Roman author Pliny the Elder later wrote with amazement about harbour structures that became stronger the longer they stood in the sea.",
          "Pliny wrote 'later' than Vitruvius.",
        ),
        tfng(
          "Modern concrete is designed to keep changing chemically after it has set.",
          "FALSE",
          "Modern concrete, by contrast, is designed to be chemically stable once it has set, and seawater gradually damages it.",
          "It is 'designed to be chemically stable once it has set'.",
        ),
        tfng(
          "The white lumps in Roman concrete were once seen as a sign of careless mixing.",
          "TRUE",
          "These had usually been dismissed as evidence of poor mixing.",
          "They were 'dismissed as evidence of poor mixing'.",
        ),
        tfng(
          "The 2023 study was paid for by a construction company.",
          "NOT GIVEN",
          "",
          "The study was carried out at a US university; its funding is not mentioned.",
        ),
        tfng(
          "Concrete containing bacteria costs less than concrete containing lime lumps.",
          "NOT GIVEN",
          "",
          "Both approaches are mentioned, but their costs are not compared.",
        ),
        tfng(
          "When first made, Roman concrete was stronger than modern concrete.",
          "FALSE",
          "It was generally much less strong than modern concrete when first made, and it did not contain steel reinforcement, which allows modern buildings to be much taller and thinner.",
          "Roman concrete was 'much less strong than modern concrete when first made'.",
        ),
        noteLine(
          HOT_MIX,
          null,
          "Builders add lime in a highly reactive form called ______",
          "quicklime",
          "The new study, however, suggested that they were the result of a deliberate technique known as hot mixing, in which the builders added lime in a highly reactive form known as quicklime.",
          "The lime was added as 'quicklime'.",
        ),
        noteLine(
          HOT_MIX,
          null,
          "Mixing with water produces intense ______, which creates lumps of lime",
          "heat",
          "When quicklime is mixed with water, it produces intense heat, and the high temperatures appear to have created the lumps and to have made the concrete set more quickly.",
          "Quicklime and water produce 'intense heat'.",
        ),
        noteLine(
          HOT_MIX,
          null,
          "The dissolved lime forms calcium ______, which fills the crack",
          "carbonate",
          "The explanation is that water entering a crack dissolves some of the lime, which then reacts with carbon dioxide to form calcium carbonate, a hard mineral that fills the gap.",
          "The lime reacts 'to form calcium carbonate, a hard mineral that fills the gap'.",
          {
            before: [
              { text: "Later, water enters a crack and dissolves some of the lime", indent: 0 },
            ],
          },
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Roman concrete could set even ______, which made it suitable for harbours.",
          "under water",
          "The ash reacted with the lime to form a strong material that could set even under water, a property that made it ideal for building harbours.",
          "It 'could set even under water'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In the experiment, cracks in the hot-mixed concrete closed within about ______.",
          "two weeks",
          "Within about two weeks, the cracks in the hot-mixed concrete had closed completely, and water could no longer flow through.",
          "The cracks closed 'within about two weeks'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Making cement produces about eight per cent of the world's ______ emissions.",
          "carbon dioxide",
          "Concrete is the most widely used building material in the world, and the production of cement, its key ingredient, is responsible for roughly eight per cent of global carbon dioxide emissions.",
          "Cement causes 'roughly eight per cent of global carbon dioxide emissions'.",
        ),
      ],
    },
    {
      key: "t22-p2-seagrass",
      title: "Meadows Under the Sea",
      topic: "why seagrass meadows matter and how they are being restored",
      difficulty: 7,
      body: `Beneath the shallow coastal waters of every continent except Antarctica lie underwater meadows of seagrass. Unlike seaweeds, which are algae, seagrasses are true flowering plants, descended from land plants that returned to the sea many millions of years ago. They have roots, leaves and even flowers, and some species are pollinated underwater. Seagrass meadows cover only a tiny fraction of the ocean floor, yet they are among the most valuable ecosystems on Earth. They are also among the most threatened.

One reason for their importance is their ability to store carbon. Seagrasses absorb carbon dioxide as they grow, and much of the carbon ends up buried in the mud beneath the meadows, where the lack of oxygen means it can remain for thousands of years. Although they cover less than 0.2 per cent of the sea floor, seagrass meadows are estimated to account for around a tenth of the carbon buried in ocean sediments each year. Marine ecologist Dr Isla Morrison points out that, area for area, seagrass can capture carbon considerably faster than many forests on land. "People think of rainforests when they think about carbon," she says, "but some of the most effective stores are underwater and almost invisible."

Seagrass meadows also support an extraordinary variety of life. They provide shelter and feeding grounds for fish, crabs, shellfish and sea horses, and they are grazed by turtles and dugongs. Many commercially important fish species spend part of their lives in seagrass, and one study estimated that seagrass supports a fifth of the world's largest fisheries. The plants also protect coastlines, because their leaves slow the movement of water and their roots hold the sediment in place, reducing erosion during storms.

Despite their value, seagrass meadows have been disappearing rapidly. One widely cited study found that the global area of seagrass was shrinking by several per cent a year in the decades before 2010, and in the United Kingdom as much as nine-tenths may have been lost over the past century. The main cause is poor water quality, often the result of fertilisers and sewage washing off the land, which encourage the growth of algae that block sunlight. Coastal development, damage from boat anchors and rising sea temperatures add to the pressure. Conservation biologist Professor Ahmed Karim says that the loss has gone largely unnoticed. "When a forest is cut down, everyone can see it," he says. "When a seagrass meadow dies, it simply vanishes beneath the waves."

A historical example shows what can happen. In the 1930s, a disease wiped out most of the seagrass along the Atlantic coasts of North America and Europe. In the coastal bays of Virginia, in the eastern United States, the loss was followed by a hurricane in 1933 that destroyed the remaining meadows, and the local scallop fishery collapsed. For decades, the seagrass did not return. Then, in 1999, scientists began scattering seeds collected from surviving meadows elsewhere into the bays. Over the following twenty years, the seeded areas grew into meadows covering more than 3,500 hectares, one of the most successful seagrass restoration projects in the world. Fish, shellfish and birds returned, and the meadows are now storing significant amounts of carbon.

Inspired by such successes, restoration projects have been launched in many countries. In the United Kingdom, volunteers have planted millions of seeds, often in small bags filled with sand that are dropped from boats. Restoration ecologist Dr Hannah Price notes, however, that restoring seagrass is far more difficult than planting trees. "Most attempts fail because the conditions that killed the original meadow have not changed," she says. "Unless you improve the water quality first, the seeds have little chance." Seeds are also difficult to collect in large quantities. In addition, each site requires careful study before planting can begin.

Some organisations hope that the carbon stored by seagrass could be sold as carbon credits, providing money for restoration. Karim is cautious about this idea. He points out that measuring exactly how much carbon a meadow stores is difficult, and that the carbon can be released again if a meadow is damaged. Others worry that companies might use such credits as an excuse to avoid reducing their own emissions. Nonetheless, Morrison believes that putting a value on seagrass could help to protect it. "At the moment, these meadows are treated as if they are worth nothing," she says.

Scientists are also exploring new techniques, including the use of drones and satellite images to map meadows, and machines that can plant seeds more efficiently. Remote sensing specialist Dr Tomasz Nowak says that satellites can now detect meadows in clear, shallow water, but that deeper meadows remain difficult to map from space. For now, experts agree that the most effective step is simply to stop further losses by improving water quality and protecting existing meadows. Restoring what has been lost is possible, but, as the Virginia project showed, it takes decades.`,
      questions: [
        fromList(
          "matching_features",
          SEAGRASS_PEOPLE,
          "Some of the most effective stores of carbon are hard to see.",
          "Isla Morrison",
          '"People think of rainforests when they think about carbon," she says, "but some of the most effective stores are underwater and almost invisible."',
          "Morrison: the most effective stores 'are underwater and almost invisible'.",
        ),
        fromList(
          "matching_features",
          SEAGRASS_PEOPLE,
          "The loss of seagrass has attracted little public attention.",
          "Ahmed Karim",
          "Conservation biologist Professor Ahmed Karim says that the loss has gone largely unnoticed.",
          "Karim says 'the loss has gone largely unnoticed'.",
        ),
        fromList(
          "matching_features",
          SEAGRASS_PEOPLE,
          "Restoration is unlikely to succeed unless the water is made cleaner first.",
          "Hannah Price",
          '"Unless you improve the water quality first, the seeds have little chance."',
          "Price: 'Unless you improve the water quality first, the seeds have little chance.'",
        ),
        fromList(
          "matching_features",
          SEAGRASS_PEOPLE,
          "It is difficult to calculate how much carbon a meadow holds.",
          "Ahmed Karim",
          "He points out that measuring exactly how much carbon a meadow stores is difficult, and that the carbon can be released again if a meadow is damaged.",
          "Karim says 'measuring exactly how much carbon a meadow stores is difficult'.",
        ),
        fromList(
          "matching_features",
          SEAGRASS_PEOPLE,
          "Meadows in deeper water are still hard to find using satellites.",
          "Tomasz Nowak",
          "Remote sensing specialist Dr Tomasz Nowak says that satellites can now detect meadows in clear, shallow water, but that deeper meadows remain difficult to map from space.",
          "Nowak: 'deeper meadows remain difficult to map from space'.",
        ),
        fromList(
          "summary_completion",
          SEAGRASS_BANK,
          "Seagrass meadows are grazed by turtles and ______.",
          "dugongs",
          "They provide shelter and feeding grounds for fish, crabs, shellfish and sea horses, and they are grazed by turtles and dugongs.",
          "They are 'grazed by turtles and dugongs'.",
        ),
        fromList(
          "summary_completion",
          SEAGRASS_BANK,
          "By holding the sediment in place, seagrass roots reduce ______ during storms.",
          "erosion",
          "The plants also protect coastlines, because their leaves slow the movement of water and their roots hold the sediment in place, reducing erosion during storms.",
          "The roots help by 'reducing erosion during storms'.",
        ),
        fromList(
          "summary_completion",
          SEAGRASS_BANK,
          "Fertilisers and sewage encourage the growth of ______ that block sunlight.",
          "algae",
          "The main cause is poor water quality, often the result of fertilisers and sewage washing off the land, which encourage the growth of algae that block sunlight.",
          "They 'encourage the growth of algae that block sunlight'.",
        ),
        fromList(
          "summary_completion",
          SEAGRASS_BANK,
          "Meadows are also damaged by boat ______.",
          "anchors",
          "Coastal development, damage from boat anchors and rising sea temperatures add to the pressure.",
          "There is 'damage from boat anchors'. Nets are not mentioned.",
        ),
        fromList(
          "summary_completion",
          SEAGRASS_BANK,
          "In the 1930s, a ______ destroyed most of the seagrass on both sides of the Atlantic.",
          "disease",
          "In the 1930s, a disease wiped out most of the seagrass along the Atlantic coasts of North America and Europe.",
          "'A disease wiped out most of the seagrass'.",
        ),
        fromList(
          "summary_completion",
          SEAGRASS_BANK,
          "In Virginia, the loss of the meadows caused the local ______ fishery to collapse.",
          "scallop",
          "In the coastal bays of Virginia, in the eastern United States, the loss was followed by a hurricane in 1933 that destroyed the remaining meadows, and the local scallop fishery collapsed.",
          "'The local scallop fishery collapsed.'",
        ),
        pickTwo(
          RESTORE_STEM,
          RESTORE,
          "A or C",
          "Seeds are also difficult to collect in large quantities.",
          "A is correct: seeds 'are also difficult to collect in large quantities'. B is wrong — volunteers have planted millions of seeds.",
        ),
        pickTwo(
          RESTORE_STEM,
          RESTORE,
          "A or C",
          "In addition, each site requires careful study before planting can begin.",
          "C is correct: 'each site requires careful study before planting can begin'. D and E are not mentioned.",
        ),
      ],
    },
    {
      key: "t22-p3-plant-sounds",
      title: "Can Plants Make Sounds?",
      topic: "research into the sounds that plants produce and may respond to",
      difficulty: 8,
      body: `A) Plants are often thought of as silent, passive organisms, rooted in place and unable to respond to the world in any way that resembles animal behaviour. Yet over the past few decades, research has revealed that plants are far more active than they appear. They can detect light, gravity, touch and chemicals in the air, and some can even distinguish between different kinds of insects feeding on their leaves. Recently, a more surprising question has attracted scientific attention: can plants make sounds, and can they hear?

B) The most striking evidence that plants produce sounds came from a study published in 2023 by researchers in Israel. The team placed tomato and tobacco plants inside soundproof boxes and recorded them with sensitive microphones. They found that plants that were short of water, or whose stems had been cut, gave off short clicking sounds at frequencies too high for humans to hear. Stressed plants produced many more clicks than healthy ones: a tomato plant that had not been watered might click dozens of times an hour, while a healthy plant rarely clicked at all. Plant scientist Dr Rachel Adler, who was not involved in the study, describes the findings as a genuine surprise. "Nobody expected the sounds to be so regular or so easy to detect," she says.

C) The researchers also used machine learning to analyse the recordings. A computer program trained on the sounds was able to tell whether a plant was dry or had been cut, and even to distinguish between tomato and tobacco plants, from the clicks alone. The team suggested that the sounds are probably produced when air bubbles form and burst inside the tubes that carry water through the plant, a process that occurs when a plant is short of water. If so, the clicks may not be a form of communication at all, but simply a physical side effect of stress. Biophysicist Professor Daniel Kogan agrees that this is the most likely explanation. "A sound can carry information without anyone intending to send a message," he says.

D) Even so, the sounds could be useful to other organisms. Many insects, including moths that lay eggs on plants, can hear high-frequency sounds, and so can some bats and mice. It is possible, the researchers suggested, that a moth might avoid laying its eggs on a plant that is clicking because it is short of water, since such a plant would be a poor source of food for the young. Entomologist Dr Paolo Ferri thinks this is plausible. "Insects are extremely sensitive to high sounds, and they have every reason to pay attention to the condition of plants," he says. At present, however, the idea has not been tested. Farmers, too, might one day benefit: microphones placed in fields or greenhouses could reveal which plants need watering.

E) The question of whether plants can hear is even more controversial. In one widely reported experiment, the Australian biologist Monica Gagliano found that the roots of pea plants grew towards the sound of water flowing through a pipe, even when no moisture could reach them. In other studies, plants exposed to the vibrations caused by caterpillars chewing leaves produced more of the chemicals they use to defend themselves. Some researchers have interpreted such results as evidence that plants can respond to sound in ways that help them to survive.

F) Not everyone accepts these interpretations. Botanist Dr Ingrid Solberg argues that many of the experiments have involved small numbers of plants and have not always been repeated by independent teams. She also warns against describing plants as "listening" or "intelligent", terms that suggest human-like abilities. "Plants respond to their environment in remarkable ways," she says, "but we should be careful not to turn every response into a mind." Supporters reply that such caution can itself become a kind of prejudice, preventing scientists from taking unexpected findings seriously.

G) Whatever the outcome of this debate, the research has opened up a new field of study, sometimes called plant bioacoustics. Scientists are now investigating whether other species produce sounds, how far the sounds travel in natural environments, and whether any organisms respond to them. Adler believes that the most important lesson concerns the way research is done. "For years we did not hear plants because we were not listening at the right frequencies," she says. "It makes you wonder what else we are missing." Kogan, however, warns that the excitement surrounding the topic should not run ahead of the evidence.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of recordings made in a quiet, closed space",
          "B",
          "The team placed tomato and tobacco plants inside soundproof boxes and recorded them with sensitive microphones.",
          "Paragraph B: the plants were recorded 'inside soundproof boxes'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a possible physical cause of the sounds",
          "C",
          "The team suggested that the sounds are probably produced when air bubbles form and burst inside the tubes that carry water through the plant, a process that occurs when a plant is short of water.",
          "Paragraph C: bursting air bubbles may cause the clicks.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a way in which plant sounds could help farmers",
          "D",
          "Farmers, too, might one day benefit: microphones placed in fields or greenhouses could reveal which plants need watering.",
          "Paragraph D: microphones 'could reveal which plants need watering'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an experiment in which roots appeared to respond to a sound",
          "E",
          "In one widely reported experiment, the Australian biologist Monica Gagliano found that the roots of pea plants grew towards the sound of water flowing through a pipe, even when no moisture could reach them.",
          "Paragraph E: pea roots 'grew towards the sound of water'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a criticism of the number of plants used in some experiments",
          "F",
          "Botanist Dr Ingrid Solberg argues that many of the experiments have involved small numbers of plants and have not always been repeated by independent teams.",
          "Paragraph F: experiments 'involved small numbers of plants'.",
        ),
        fromList(
          "matching_features",
          PLANT_PEOPLE,
          "It was unexpected that the sounds were so regular.",
          "Rachel Adler",
          '"Nobody expected the sounds to be so regular or so easy to detect," she says.',
          "Adler: 'Nobody expected the sounds to be so regular'.",
        ),
        fromList(
          "matching_features",
          PLANT_PEOPLE,
          "A sound may contain information even if it is not meant as a signal.",
          "Daniel Kogan",
          '"A sound can carry information without anyone intending to send a message," he says.',
          "Kogan: a sound can carry information 'without anyone intending to send a message'.",
        ),
        fromList(
          "matching_features",
          PLANT_PEOPLE,
          "Insects probably have good reasons to notice sounds that reveal a plant's condition.",
          "Paolo Ferri",
          '"Insects are extremely sensitive to high sounds, and they have every reason to pay attention to the condition of plants," he says.',
          "Ferri: insects 'have every reason to pay attention to the condition of plants'.",
        ),
        fromList(
          "matching_features",
          PLANT_PEOPLE,
          "Scientists should not describe plants as if they had human-like abilities.",
          "Ingrid Solberg",
          'She also warns against describing plants as "listening" or "intelligent", terms that suggest human-like abilities.',
          "Solberg warns against terms 'that suggest human-like abilities'.",
        ),
        fromList(
          "matching_features",
          PLANT_PEOPLE,
          "Plant sounds went unnoticed because researchers were not listening at suitable frequencies.",
          "Rachel Adler",
          '"For years we did not hear plants because we were not listening at the right frequencies," she says.',
          "Adler: 'we were not listening at the right frequencies'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The researchers in Israel recorded tomato and ______ plants.",
          "tobacco",
          "The team placed tomato and tobacco plants inside soundproof boxes and recorded them with sensitive microphones.",
          "They recorded 'tomato and tobacco plants'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The clicks may be caused when ______ form and burst inside the plant.",
          "air bubbles",
          "The team suggested that the sounds are probably produced when air bubbles form and burst inside the tubes that carry water through the plant, a process that occurs when a plant is short of water.",
          "The sounds may come from 'air bubbles' forming and bursting.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some ______ that lay their eggs on plants can hear high-frequency sounds.",
          "moths",
          "Many insects, including moths that lay eggs on plants, can hear high-frequency sounds, and so can some bats and mice.",
          "'Moths that lay eggs on plants' can hear such sounds.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The new area of research is sometimes known as plant ______.",
          "bioacoustics",
          "Whatever the outcome of this debate, the research has opened up a new field of study, sometimes called plant bioacoustics.",
          "The field is 'sometimes called plant bioacoustics'.",
        ),
      ],
    },
  ],
};
