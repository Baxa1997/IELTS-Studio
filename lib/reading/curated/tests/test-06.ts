import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · flow-chart -----------------------------------------------------

const DECISION = {
  title: "How a swarm chooses its new home",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · people, word bank, choose TWO ----------------------------------

const SPACE_PEOPLE = ["Elena Vasquez", "Kenji Moriyama", "Samira Haddad", "Thomas Brennan"];
const SPACE_BANK = [
  "contamination",
  "carbon",
  "water",
  "proteins",
  "salts",
  "rubble",
  "metal",
  "gravel",
  "bacteria",
];
const SAMPLES_STEM =
  "Which TWO of the following statements about the Bennu sample are made in the passage?";
const SAMPLES = [
  "Most of it is being kept for scientists in the future.",
  "It has been sent to a single laboratory for study.",
  "It contained a mineral never before found in meteorites.",
  "It proved that life once existed on the asteroid.",
  "It was damaged when the capsule landed.",
];

// ---- Passage 3 · lettered paragraphs and people ---------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const MUSEUM_PEOPLE = ["Amara Nwosu", "Richard Hale", "Julia Brandt", "Tomasz Lewandowski"];

export const TEST_06: CuratedTest = {
  key: "full-test-06",
  targetBand: 7,
  passages: [
    {
      key: "t06-p1-bee-swarms",
      title: "How the Swarm Decides",
      topic: "how honey bees choose a new home",
      difficulty: 6,
      body: `In late spring, a colony of honey bees that has grown too large for its hive does something remarkable. The old queen leaves the nest together with roughly two-thirds of the workers, perhaps 10,000 bees in all, and the swarm settles temporarily on a tree branch, where it hangs in a dense cluster. The bees left behind will raise a new queen and continue in the old hive. Swarming is how honey bee colonies reproduce, since it is the only way a single colony can become two. The swarm, meanwhile, faces an urgent problem: within a few days it must find a new permanent home, and a poor choice could mean that the entire colony dies during the following winter.

For much of the twentieth century, how swarms made this decision was a mystery. The key research was carried out by biologists who spent many years observing swarms on a small, almost treeless island off the coast of the north-eastern United States. Because the island offered few natural nesting sites, the researchers could provide their own nest boxes and control exactly which options were available to the bees. They marked individual bees with small dots of paint so that they could follow their movements. Their findings were later described in a book that has become a classic of animal behaviour research.

The search is carried out by a few hundred of the oldest and most experienced workers, known as scouts. They fly out from the swarm in all directions, sometimes travelling several kilometres, looking for suitable cavities such as hollow trees. A scout that finds a promising site inspects it carefully, walking around inside and measuring its size. Bees prefer a cavity of around 40 litres, with a small entrance facing south, positioned several metres above the ground, where it is easier to defend. A site that is too small cannot hold enough stored honey for winter, while one that is too large is difficult to keep warm.

When a scout returns to the swarm, it reports its discovery by performing a waggle dance on the surface of the cluster. The dancer runs forward while vibrating its body, then circles back and repeats the movement. The angle of the run indicates the direction of the site relative to the sun, and the length of each waggle run indicates its distance. Bees in the audience follow the dancer closely, touching it with their antennae to pick up the information. Crucially, the number of times a scout repeats its dance reflects the quality of the site: a scout that has found an excellent cavity dances with great enthusiasm, while one that has found a mediocre site dances only briefly.

Other scouts that watch a dance may fly out to inspect the advertised site for themselves. If they judge it to be good, they return and dance for it too. In this way, excellent sites attract more and more supporters, while poor ones gradually lose them. Each scout also dances less with each return trip, so that even enthusiastic supporters eventually fall silent. This prevents the swarm from becoming locked into an early choice before other options have been properly compared. Scouts supporting rival sites have even been observed butting dancers for competing locations, which causes them to stop. Over a period of hours or days, support gradually concentrates on the best site.

The decision is reached when a sufficient number of scouts are dancing for the same site. At that point, the scouts begin producing a high-pitched piping sound, which signals to the rest of the swarm that it is time to prepare for flight. The bees warm their flight muscles until they reach the necessary temperature, and within an hour the whole swarm takes off. Remarkably, only the scouts know the way, so they guide the flying cloud by darting rapidly through it in the direction of the new home. The whole process, from the first departure of scouts to the final flight, usually takes between one and three days.

The researchers found that swarms usually chose the best of the available sites, even when the differences between them were small. What makes this so striking is that no individual bee compares all the options. Instead, a good decision emerges from many simple interactions. Bees make mistakes occasionally, for example when two sites of similar quality attract equal support, but such cases appear to be rare. Some scientists have suggested that human groups could learn from the bees, by encouraging independent investigation, open debate and a clear rule for when a decision has been reached, rather than allowing one powerful member to dominate the discussion.`,
      questions: [
        tfng(
          "The old queen stays in the original hive when a colony swarms.",
          "FALSE",
          "The old queen leaves the nest together with roughly two-thirds of the workers, perhaps 10,000 bees in all, and the swarm settles temporarily on a tree branch, where it hangs in a dense cluster.",
          "The old queen 'leaves the nest' with the swarm; a new queen is raised in the old hive.",
        ),
        tfng(
          "The island where the research took place had many natural nesting sites.",
          "FALSE",
          "Because the island offered few natural nesting sites, the researchers could provide their own nest boxes and control exactly which options were available to the bees.",
          "The island 'offered few natural nesting sites' — that is why it suited the research.",
        ),
        tfng(
          "The researchers marked bees so that they could track particular individuals.",
          "TRUE",
          "They marked individual bees with small dots of paint so that they could follow their movements.",
          "They used 'small dots of paint' to follow individual bees.",
        ),
        tfng(
          "Scouts that fail to find a suitable site return to the old hive.",
          "NOT GIVEN",
          "",
          "The passage describes scouts returning to the swarm with discoveries, but not what happens to scouts that find nothing.",
        ),
        tfng(
          "A scout that has found an excellent site repeats its dance more than one that has found a poor site.",
          "TRUE",
          "Crucially, the number of times a scout repeats its dance reflects the quality of the site: a scout that has found an excellent cavity dances with great enthusiasm, while one that has found a mediocre site dances only briefly.",
          "The number of repetitions 'reflects the quality of the site'.",
        ),
        tfng(
          "The researchers could predict which site a swarm would choose before it flew away.",
          "NOT GIVEN",
          "",
          "The passage says swarms usually chose the best site, but not whether researchers could predict the choice in advance.",
        ),
        tfng(
          "Swarms usually picked the best site available, even when the options were similar in quality.",
          "TRUE",
          "The researchers found that swarms usually chose the best of the available sites, even when the differences between them were small.",
          "They chose the best site 'even when the differences between them were small'.",
        ),
        noteLine(
          DECISION,
          null,
          "Returning scouts perform a ______ dance on the swarm",
          "waggle",
          "When a scout returns to the swarm, it reports its discovery by performing a waggle dance on the surface of the cluster.",
          "Scouts report by 'performing a waggle dance'.",
          { before: [{ text: "Scouts fly out and inspect possible nest sites", indent: 0 }] },
        ),
        noteLine(
          DECISION,
          null,
          "Supporters of rival sites stop competing dancers by ______ them",
          "butting",
          "Scouts supporting rival sites have even been observed butting dancers for competing locations, which causes them to stop.",
          "Rival scouts were seen 'butting dancers for competing locations'.",
          {
            before: [
              {
                text: "Other scouts check the advertised sites and dance for good ones",
                indent: 0,
              },
            ],
          },
        ),
        noteLine(
          DECISION,
          null,
          "Scouts produce a high-pitched ______ sound",
          "piping",
          "At that point, the scouts begin producing a high-pitched piping sound, which signals to the rest of the swarm that it is time to prepare for flight.",
          "Once enough scouts agree, they make 'a high-pitched piping sound'.",
          { before: [{ text: "Enough scouts dance for the same site", indent: 0 }] },
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Bees prefer a cavity with a small entrance facing ______.",
          "south",
          "Bees prefer a cavity of around 40 litres, with a small entrance facing south, positioned several metres above the ground, where it is easier to defend.",
          "The preferred entrance is small and 'facing south'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A nest site that is too large is difficult to keep ______.",
          "warm",
          "A site that is too small cannot hold enough stored honey for winter, while one that is too large is difficult to keep warm.",
          "A large cavity 'is difficult to keep warm'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Before the swarm flies, the bees warm up their ______.",
          "flight muscles",
          "The bees warm their flight muscles until they reach the necessary temperature, and within an hour the whole swarm takes off.",
          "They 'warm their flight muscles' before taking off.",
        ),
      ],
    },
    {
      key: "t06-p2-asteroid-samples",
      title: "Messages from the Early Solar System",
      topic: "what samples brought back from asteroids reveal",
      difficulty: 7,
      body: `In September 2023, a small capsule descended by parachute into the desert of Utah in the western United States. The capsule had reached speeds of more than 40,000 kilometres per hour as it entered the atmosphere. Inside was about 120 grams of rock and dust collected from Bennu, an asteroid roughly 500 metres wide that orbits the Sun not far from the Earth. The sample had been gathered three years earlier by a spacecraft that briefly touched the asteroid's surface before beginning its long journey home. Together with material brought back from another asteroid, Ryugu, by a Japanese mission in 2020, it has given scientists their first detailed look at pristine rock from the early solar system.

Why go to such lengths when thousands of meteorites fall to Earth naturally? The answer is contamination. Planetary scientist Dr Elena Vasquez explains that a meteorite is changed the moment it enters the atmosphere, when its surface melts, and it continues to change once it lands, absorbing water and being colonised by bacteria. "A meteorite that has lain in a field for fifty years is no longer the rock that left space," she says. Samples collected directly from an asteroid and sealed in a capsule avoid most of these problems, although even they must be handled in special clean rooms filled with nitrogen. Even a fingerprint on a sample could introduce organic molecules that would confuse the results.

Asteroids such as Bennu and Ryugu are thought to be fragments of larger bodies that formed about 4.5 billion years ago, when the planets themselves were taking shape. Because they are too small to have been heated and reshaped by geological processes, they preserve a record of the materials from which the Earth was built. Some asteroids are metallic, but both Bennu and Ryugu are rich in carbon, which makes them especially dark. Cosmochemist Professor Kenji Moriyama compares them to time capsules: "Studying them is like reading a letter that has been sealed since before the Earth existed."

The early results have been striking. Both asteroids contain minerals that could only have formed in the presence of liquid water, suggesting that their parent bodies once had water flowing through them. Researchers examining the Bennu sample have also identified many of the amino acids that living things use to build proteins, as well as all five of the chemical bases found in DNA and RNA. In early 2025, a team reported the discovery of salts that form when salty water evaporates, similar to deposits found in dried-up lakes on Earth. Such salts are fragile and would probably not have survived a fall to Earth as a meteorite.

These findings do not mean that life existed on the asteroids. Astrobiologist Dr Samira Haddad stresses that amino acids and similar molecules can be produced by chemical reactions without any living organisms. What they do suggest is that the basic ingredients of life were widespread in the early solar system, and could have been delivered to the young Earth by asteroids and comets. "The question is no longer whether these molecules were available," Haddad says, "but how they were assembled into something alive." She also points out that the sample was handled so carefully that contamination from Earth can almost certainly be ruled out.

The mission has also brought surprises. The team had expected Bennu to have a surface of fine gravel, but when the spacecraft touched down, its sampling arm sank into loose material that behaved almost like a fluid, suggesting that the asteroid is a loosely held collection of rubble rather than a solid rock. Engineer Thomas Brennan, who worked on the mission's navigation, recalls that the spacecraft might have sunk further into the surface if it had not fired its thrusters immediately to back away. Scientists also found that the sample contained a type of phosphate mineral that had never been seen in meteorites before.

Studying the samples will take decades. Most of the material has been set aside for future researchers, who will have access to analytical techniques that do not yet exist. This follows a lesson learned from the Apollo missions to the Moon, whose rock samples are still producing new discoveries more than fifty years later. Portions of the sample are also being distributed to laboratories around the world, including in countries that did not take part in the mission. Meanwhile, space agencies are planning further missions, including ones designed to learn how an asteroid on a collision course with Earth could be pushed off its path. Vasquez argues that such planetary defence work depends on exactly the kind of knowledge the samples provide.`,
      questions: [
        fromList(
          "matching_features",
          SPACE_PEOPLE,
          "Rocks that fall to Earth are altered by the conditions they meet after landing.",
          "Elena Vasquez",
          "Planetary scientist Dr Elena Vasquez explains that a meteorite is changed the moment it enters the atmosphere, when its surface melts, and it continues to change once it lands, absorbing water and being colonised by bacteria.",
          "Vasquez says meteorites keep changing 'once it lands, absorbing water and being colonised by bacteria'.",
        ),
        fromList(
          "matching_features",
          SPACE_PEOPLE,
          "Asteroids preserve material that is older than the Earth itself.",
          "Kenji Moriyama",
          'Cosmochemist Professor Kenji Moriyama compares them to time capsules: "Studying them is like reading a letter that has been sealed since before the Earth existed."',
          "Moriyama's letter 'sealed since before the Earth existed'.",
        ),
        fromList(
          "matching_features",
          SPACE_PEOPLE,
          "Molecules associated with life can be formed without any living things.",
          "Samira Haddad",
          "Astrobiologist Dr Samira Haddad stresses that amino acids and similar molecules can be produced by chemical reactions without any living organisms.",
          "Haddad: such molecules 'can be produced by chemical reactions without any living organisms'.",
        ),
        fromList(
          "matching_features",
          SPACE_PEOPLE,
          "The spacecraft needed to move away from the asteroid's surface without delay.",
          "Thomas Brennan",
          "Engineer Thomas Brennan, who worked on the mission's navigation, recalls that the spacecraft might have sunk further into the surface if it had not fired its thrusters immediately to back away.",
          "Brennan recalls the thrusters firing 'immediately to back away'.",
        ),
        fromList(
          "matching_features",
          SPACE_PEOPLE,
          "What the samples reveal is important for protecting the planet from asteroids.",
          "Elena Vasquez",
          "Vasquez argues that such planetary defence work depends on exactly the kind of knowledge the samples provide.",
          "Vasquez again: planetary defence 'depends on exactly the kind of knowledge the samples provide'.",
        ),
        fromList(
          "summary_completion",
          SPACE_BANK,
          "Samples collected directly from asteroids avoid most problems of ______.",
          "contamination",
          "The answer is contamination.",
          "The reason to collect samples in space rather than use meteorites is contamination.",
        ),
        fromList(
          "summary_completion",
          SPACE_BANK,
          "Unlike some asteroids, Bennu and Ryugu contain a lot of ______.",
          "carbon",
          "Some asteroids are metallic, but both Bennu and Ryugu are rich in carbon, which makes them especially dark.",
          "Both are 'rich in carbon'. 'Metal' describes other asteroids.",
        ),
        fromList(
          "summary_completion",
          SPACE_BANK,
          "Some minerals in both asteroids could only have formed in the presence of liquid ______.",
          "water",
          "Both asteroids contain minerals that could only have formed in the presence of liquid water, suggesting that their parent bodies once had water flowing through them.",
          "The minerals needed 'liquid water' to form.",
        ),
        fromList(
          "summary_completion",
          SPACE_BANK,
          "The Bennu sample contains amino acids, which living things use to make ______.",
          "proteins",
          "Researchers examining the Bennu sample have also identified many of the amino acids that living things use to build proteins, as well as all five of the chemical bases found in DNA and RNA.",
          "Amino acids are what living things 'use to build proteins'.",
        ),
        fromList(
          "summary_completion",
          SPACE_BANK,
          "Researchers also found ______ of a kind that forms when salty water evaporates.",
          "salts",
          "In early 2025, a team reported the discovery of salts that form when salty water evaporates, similar to deposits found in dried-up lakes on Earth.",
          "They found 'salts that form when salty water evaporates'.",
        ),
        fromList(
          "summary_completion",
          SPACE_BANK,
          "Bennu seems to be a loose collection of ______ rather than one solid rock.",
          "rubble",
          "The team had expected Bennu to have a surface of fine gravel, but when the spacecraft touched down, its sampling arm sank into loose material that behaved almost like a fluid, suggesting that the asteroid is a loosely held collection of rubble rather than a solid rock.",
          "It is 'a loosely held collection of rubble'. 'Gravel' is what the team expected, not what they found.",
        ),
        pickTwo(
          SAMPLES_STEM,
          SAMPLES,
          "A or C",
          "Most of the material has been set aside for future researchers, who will have access to analytical techniques that do not yet exist.",
          "A is correct: most of it 'has been set aside for future researchers'. B is wrong — portions are going to laboratories around the world.",
        ),
        pickTwo(
          SAMPLES_STEM,
          SAMPLES,
          "A or C",
          "Scientists also found that the sample contained a type of phosphate mineral that had never been seen in meteorites before.",
          "C is correct: a phosphate mineral 'never been seen in meteorites before'. D is contradicted by Haddad.",
        ),
      ],
    },
    {
      key: "t06-p3-museum-repatriation",
      title: "Who Should Keep the Past?",
      topic: "the debate over returning museum objects to their places of origin",
      difficulty: 8,
      body: `A) In the grand galleries of Europe's and North America's great museums, visitors can admire sculptures, manuscripts and ceremonial objects from every corner of the world. Many of these collections were assembled during the eighteenth and nineteenth centuries, when European powers controlled large parts of Africa, Asia and the Pacific. Some objects were bought or given as gifts, but others were taken during military campaigns or acquired in circumstances that would today be regarded as unfair. Some museums hold thousands of such objects, many of which have never been displayed. Over the past decade, calls for these objects to be returned to the places they came from have grown louder, and the debate has become one of the most contentious in the museum world.

B) Supporters of repatriation argue that the principle is simple: objects taken by force or without genuine consent should be given back. Historian Dr Amara Nwosu points out that many of these items were not merely works of art but sacred objects or symbols of political authority, and that their removal was intended to humiliate the communities who owned them. "For those communities," she says, "the objects are not relics of the past but part of a living culture." She also rejects the claim that returning objects would empty museums, noting that most requests concern a relatively small number of items.

C) Museums have traditionally responded with several arguments. One is that large international museums allow visitors from all over the world to see and compare objects from many different cultures in one place. Another is that some institutions in the countries of origin lack the resources to conserve fragile objects. Former museum director Sir Richard Hale argues that the purpose of a universal museum is to tell a shared human story, and that dispersing collections would weaken that purpose. Critics reply that the universal museum has, in practice, been located almost entirely in wealthy countries, making it far easier for their citizens to visit than for people in the places the objects came from.

D) Legal obstacles have also played a part. In some countries, national museums are prevented by law from permanently removing objects from their collections, which means that even a museum willing to return an item may be unable to do so without new legislation. Lawyer Julia Brandt notes that such laws were originally intended to protect collections from being sold off by governments during financial crises, not to prevent the return of objects acquired unjustly. Some governments have therefore passed specific laws or agreed special arrangements to allow particular returns. Changing such laws can take years, and the process is often politically sensitive.

E) In recent years, the pace of change has increased. Several museums have returned objects that were looted during colonial military expeditions, and some countries have established official procedures for considering claims. In 2022, for example, a European government transferred ownership of a large collection of sculptures to the West African country from which they had been taken in the nineteenth century, although some of the objects remained on display abroad under a loan agreement. Such arrangements, in which ownership changes but objects continue to travel, are becoming increasingly common. Some returns have been accompanied by formal apologies, while others have been presented simply as legal transfers.

F) Returning objects raises practical questions of its own. It is not always clear who the rightful owner is, particularly when the original community no longer exists in the same form, or when several groups claim the same object. Curator Dr Tomasz Lewandowski stresses that careful research into the history of each object, known as provenance research, is essential but slow and expensive. Records from the colonial period are often incomplete, and some were deliberately destroyed. "Many museums simply do not know how some objects entered their collections," he admits. Investment in such research, he argues, is the only way to make fair decisions case by case.

G) Increasingly, museums and communities are seeking forms of cooperation that go beyond the question of where objects should be kept. These include joint exhibitions, training programmes for conservators and digital projects that make high-quality images and records available to anyone with an internet connection. Some communities have also asked for objects to be lent to them for particular ceremonies, after which they are sent back to the museum. Nwosu welcomes these initiatives but warns that they must not become a substitute for returning objects where a strong case exists. The debate is unlikely to end soon, but it has already changed how many museums understand their responsibilities.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of the different ways in which objects were originally obtained",
          "A",
          "Some objects were bought or given as gifts, but others were taken during military campaigns or acquired in circumstances that would today be regarded as unfair.",
          "Paragraph A: objects were bought, given, taken in campaigns or acquired unfairly.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of the original purpose of certain laws",
          "D",
          "Lawyer Julia Brandt notes that such laws were originally intended to protect collections from being sold off by governments during financial crises, not to prevent the return of objects acquired unjustly.",
          "Paragraph D: the laws were 'originally intended to protect collections from being sold off'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of ownership changing while objects remain abroad",
          "E",
          "In 2022, for example, a European government transferred ownership of a large collection of sculptures to the West African country from which they had been taken in the nineteenth century, although some of the objects remained on display abroad under a loan agreement.",
          "Paragraph E: ownership was transferred but some objects 'remained on display abroad'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to the difficulty of deciding who owns an object",
          "F",
          "It is not always clear who the rightful owner is, particularly when the original community no longer exists in the same form, or when several groups claim the same object.",
          "Paragraph F: 'it is not always clear who the rightful owner is'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "examples of joint projects between museums and communities",
          "G",
          "These include joint exhibitions, training programmes for conservators and digital projects that make high-quality images and records available to anyone with an internet connection.",
          "Paragraph G lists joint exhibitions, training and digital projects.",
        ),
        fromList(
          "matching_features",
          MUSEUM_PEOPLE,
          "Objects can remain important to the living cultures they came from.",
          "Amara Nwosu",
          '"For those communities," she says, "the objects are not relics of the past but part of a living culture."',
          "Nwosu: the objects are 'part of a living culture'.",
        ),
        fromList(
          "matching_features",
          MUSEUM_PEOPLE,
          "Breaking up collections would undermine the purpose of large international museums.",
          "Richard Hale",
          "Former museum director Sir Richard Hale argues that the purpose of a universal museum is to tell a shared human story, and that dispersing collections would weaken that purpose.",
          "Hale: 'dispersing collections would weaken that purpose'.",
        ),
        fromList(
          "matching_features",
          MUSEUM_PEOPLE,
          "Laws that protect collections were never meant to prevent returns.",
          "Julia Brandt",
          "Lawyer Julia Brandt notes that such laws were originally intended to protect collections from being sold off by governments during financial crises, not to prevent the return of objects acquired unjustly.",
          "Brandt: the laws were 'not to prevent the return of objects acquired unjustly'.",
        ),
        fromList(
          "matching_features",
          MUSEUM_PEOPLE,
          "Museums are often unsure how they came to own certain objects.",
          "Tomasz Lewandowski",
          '"Many museums simply do not know how some objects entered their collections," he admits.',
          "Lewandowski admits museums 'do not know how some objects entered their collections'.",
        ),
        fromList(
          "matching_features",
          MUSEUM_PEOPLE,
          "Cooperation between museums and communities should not replace returning objects.",
          "Amara Nwosu",
          "Nwosu welcomes these initiatives but warns that they must not become a substitute for returning objects where a strong case exists.",
          "Nwosu warns such projects 'must not become a substitute for returning objects'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Critics say that so-called universal museums are found almost entirely in ______.",
          "wealthy countries",
          "Critics reply that the universal museum has, in practice, been located almost entirely in wealthy countries, making it far easier for their citizens to visit than for people in the places the objects came from.",
          "They are 'located almost entirely in wealthy countries'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Studying the history of each object is known as ______.",
          "provenance research",
          "Curator Dr Tomasz Lewandowski stresses that careful research into the history of each object, known as provenance research, is essential but slow and expensive.",
          "The research is 'known as provenance research'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "This research is essential, but it is also slow and ______.",
          "expensive",
          "Curator Dr Tomasz Lewandowski stresses that careful research into the history of each object, known as provenance research, is essential but slow and expensive.",
          "It is 'essential but slow and expensive'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Some returns of objects have come with formal ______.",
          "apologies",
          "Some returns have been accompanied by formal apologies, while others have been presented simply as legal transfers.",
          "Some were 'accompanied by formal apologies'.",
        ),
      ],
    },
  ],
};
