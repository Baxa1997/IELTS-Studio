import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · archaeology · notes ----------------------------------------

const SCROLLS = {
  title: "The discovery and study of the scrolls",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs, people -------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SKY_PEOPLE = ["Irene Castillo", "Hugo Lindberg", "Mariam Saleh", "Owen Bradshaw"];

// ---- Passage 3 · research debate · word bank --------------------------------

const BIRD_BANK = [
  "stars",
  "compass",
  "magnetic",
  "smell",
  "sun",
  "eye",
  "map",
  "clock",
  "beak",
  "cage",
];

export const TEST_43: CuratedTest = {
  key: "full-test-43",
  targetBand: 7,
  passages: [
    {
      key: "t43-p1-dead-sea-scrolls",
      title: "The Jars in the Cliff",
      topic: "the finding and piecing together of the Dead Sea Scrolls",
      difficulty: 6,
      body: `The story that is always told begins with a goat. In the winter of 1946 or the spring of 1947 — the date was never fixed, because nobody thought at the time that it mattered — a young Bedouin shepherd threw a stone into a cave in the cliffs above the north-western shore of the Dead Sea, hoping to drive out a stray animal, and heard pottery break. Inside were tall jars, and inside some of the jars were rolls of leather covered in writing.

The first seven scrolls travelled a strange route. They were carried to Bethlehem and sold to two dealers, one of whom passed four of them to the head of a Syrian monastery in Jerusalem; the others reached a professor at the Hebrew University. In 1949 the monastery's four were taken to the United States and, after failing to find a buyer for some time, were advertised in a newspaper under the heading of miscellaneous items for sale. They were bought on behalf of the state of Israel by the son of the professor who had acquired the other three, so that all seven ended in the same collection.

By then archaeologists had reached the cliffs, and a search began that lasted a decade. Eleven caves around the site of Qumran eventually produced material: a few nearly complete scrolls and a very large quantity of fragments, some no bigger than a fingernail, which had been torn by people, gnawed by animals and crumbled by time. Bedouin searchers and archaeological teams worked the same ground in competition, and for years fragments arrived on the market in small lots, the sellers understanding that pieces were priced individually.

Altogether the caves have yielded remains of roughly nine hundred separate manuscripts, copied between about the third century BCE and the first century CE. Rather less than a quarter are copies of books of the Hebrew Bible, and they are a thousand years older than the oldest complete copies previously known. The rest are commentaries, psalms and hymns not in the Bible, calendars, legal texts and rules for a community — including a long document setting out how members should live, share property and admit newcomers.

Who wrote and kept them is not settled. The dominant view has long been that the ruins at Qumran housed a strict religious community, often identified with a group described by ancient writers as the Essenes, and that the scrolls were their library, hidden in the caves as Roman forces approached. Others have argued that the site was a farm, a pottery works or a fortified house, and that the scrolls were brought from libraries in Jerusalem for safekeeping. Sceptics point out that the ruins contain no scrolls and the caves contain no buildings, and that linking them requires an assumption.

The scholarly history is almost as contentious as the archaeological one. The team appointed in the 1950s to publish the fragments worked slowly and in private, and for thirty years access was restricted to a small circle. Frustration grew until, in 1991, a library in California announced that it would open its set of photographs to anybody who wished to see them, and a computer-generated reconstruction of one text was published elsewhere. Within months the monopoly had collapsed, a new editorial team was appointed, and publication of the full corpus was completed in the following decade.

Technology has since changed what can be read. Multispectral and infrared imaging recovers writing from fragments that look black and blank to the eye. DNA taken from the animal skins has been used to work out which pieces come from the same hide, and therefore probably from the same scroll, and to show that some parchment came from animals raised far from the Dead Sea. Handwriting analysis assisted by machine learning has suggested that at least one long scroll was copied by two scribes trained so similarly that the change of hand had gone unnoticed for seventy years.

The fragments remain difficult, and the market for them has produced its own problem: several institutions that bought supposedly new pieces in recent decades have found, on testing, that they were modern forgeries written on ancient blank leather. The genuine material, kept in controlled conditions and photographed in detail, is now available to anyone with an internet connection — an outcome that would have astonished both the shepherd and the scholars who spent thirty years keeping it to themselves.`,
      questions: [
        noteLine(
          SCROLLS,
          "The find",
          "A shepherd threw a ______ into a cave and heard pottery break",
          "stone",
          "In the winter of 1946 or the spring of 1947 — the date was never fixed, because nobody thought at the time that it mattered — a young Bedouin shepherd threw a stone into a cave in the cliffs above the north-western shore of the Dead Sea, hoping to drive out a stray animal, and heard pottery break.",
          "He 'threw a stone into a cave'.",
        ),
        noteLine(
          SCROLLS,
          "The find",
          "The scrolls were rolls of ______ covered in writing",
          "leather",
          "Inside were tall jars, and inside some of the jars were rolls of leather covered in writing.",
          "They were 'rolls of leather covered in writing'.",
        ),
        noteLine(
          SCROLLS,
          "The find",
          "Four of the first seven were later advertised in a ______",
          "newspaper",
          "In 1949 the monastery's four were taken to the United States and, after failing to find a buyer for some time, were advertised in a newspaper under the heading of miscellaneous items for sale.",
          "They 'were advertised in a newspaper'.",
        ),
        noteLine(
          SCROLLS,
          "The caves",
          "______ caves around Qumran produced written material",
          "Eleven",
          "Eleven caves around the site of Qumran eventually produced material: a few nearly complete scrolls and a very large quantity of fragments, some no bigger than a fingernail, which had been torn by people, gnawed by animals and crumbled by time.",
          "'Eleven caves… eventually produced material'.",
        ),
        noteLine(
          SCROLLS,
          "The caves",
          "Remains of about nine hundred separate ______ have been identified",
          "manuscripts",
          "Altogether the caves have yielded remains of roughly nine hundred separate manuscripts, copied between about the third century BCE and the first century CE.",
          "'Roughly nine hundred separate manuscripts'.",
        ),
        noteLine(
          SCROLLS,
          "Reading them today",
          "Infrared imaging recovers writing from fragments that appear ______",
          "blank",
          "Multispectral and infrared imaging recovers writing from fragments that look black and blank to the eye.",
          "They 'look black and blank to the eye'.",
        ),
        noteLine(
          SCROLLS,
          "Reading them today",
          "______ from the skins shows which fragments come from one animal",
          "DNA",
          "DNA taken from the animal skins has been used to work out which pieces come from the same hide, and therefore probably from the same scroll, and to show that some parchment came from animals raised far from the Dead Sea.",
          "DNA shows 'which pieces come from the same hide'.",
        ),
        tfng(
          "The exact date of the first discovery was recorded at the time.",
          "FALSE",
          "In the winter of 1946 or the spring of 1947 — the date was never fixed, because nobody thought at the time that it mattered — a young Bedouin shepherd threw a stone into a cave in the cliffs above the north-western shore of the Dead Sea, hoping to drive out a stray animal, and heard pottery break.",
          "'The date was never fixed'.",
        ),
        tfng(
          "All seven of the first scrolls eventually came into one collection.",
          "TRUE",
          "They were bought on behalf of the state of Israel by the son of the professor who had acquired the other three, so that all seven ended in the same collection.",
          "'All seven ended in the same collection'.",
        ),
        tfng(
          "Most of the manuscripts found are copies of biblical books.",
          "FALSE",
          "Rather less than a quarter are copies of books of the Hebrew Bible, and they are a thousand years older than the oldest complete copies previously known.",
          "'Rather less than a quarter'.",
        ),
        tfng(
          "Scholars agree that the people living at Qumran wrote and owned the scrolls.",
          "FALSE",
          "Who wrote and kept them is not settled.",
          "The question 'is not settled'.",
        ),
        tfng(
          "Access to the fragments was opened up after a library released its photographs.",
          "TRUE",
          "Frustration grew until, in 1991, a library in California announced that it would open its set of photographs to anybody who wished to see them, and a computer-generated reconstruction of one text was published elsewhere.",
          "The library opened its photographs and the monopoly collapsed.",
        ),
        tfng(
          "Every fragment sold to institutions in recent decades has proved to be genuine.",
          "FALSE",
          "The fragments remain difficult, and the market for them has produced its own problem: several institutions that bought supposedly new pieces in recent decades have found, on testing, that they were modern forgeries written on ancient blank leather.",
          "Several proved to be 'modern forgeries'.",
        ),
      ],
    },
    {
      key: "t43-p2-light-pollution",
      title: "The Sky That Never Gets Dark",
      topic: "artificial light, satellites and the loss of the night sky",
      difficulty: 7,
      body: `A) Roughly a third of the world's population can no longer see the Milky Way from where they live, and in the most heavily lit regions of Europe and North America the proportion is far higher. The cause is not the light that reaches the ground, which is the point of street lighting, but the light that goes upward or sideways, scatters off dust and water droplets in the air and turns the whole sky into a dim glowing dome. Measurements from citizen-science projects, in which volunteers report the faintest stars they can see, suggest that this glow has been brightening by several per cent a year in many places — faster than satellite instruments had indicated.

B) The gap between those two measurements is itself instructive. Satellites that map night-time light have historically been blind to blue wavelengths, and the switch from orange sodium street lamps to white light-emitting diodes has shifted a great deal of emission into exactly that part of the spectrum. Blue light also scatters more in the atmosphere, so an installation that looks similar from orbit can produce a considerably brighter sky. Astronomer Dr Irene Castillo, who works on sky quality measurements, says the change caught the field out. "We had a monitoring system built for the lamps of the twentieth century," she says, "and the lamps changed underneath it."

C) Efficiency has not helped as much as expected. Light-emitting diodes use a fraction of the power of the lamps they replaced, and the saving was supposed to reduce both cost and emissions. What has happened in many places instead is that authorities have installed more lights, brighter lights, or lights in places that were previously dark, spending the same money and producing more illumination. The pattern is familiar to economists studying other efficient technologies, and it means that the environmental case for the new lamps depends entirely on how they are deployed.

D) The ecological costs are better documented than they were. Migrating birds are drawn towards lit structures and collide with them, in numbers estimated in the hundreds of millions each year in North America alone; turning building lights off during migration seasons measurably reduces the deaths. Insects circle lamps until they are exhausted or eaten, and studies of insect populations find lower numbers near lit roads. Trees near street lamps come into leaf earlier. Ecologist Dr Mariam Saleh points out that darkness is a habitat like any other. "We would not flood a wetland and call it neutral," she says. "We flood the night and expect nothing to change."

E) Human effects are harder to pin down but taken increasingly seriously. Light in the blue part of the spectrum, in the evening, suppresses the hormone that signals the onset of night and delays sleep; that much is established in laboratories. Whether the levels found in an ordinary bedroom, behind curtains, are sufficient to affect health is much less clear, and studies that compare the health of people living in brighter and darker neighbourhoods struggle to separate light from noise, traffic and income.

F) Meanwhile a second source has appeared above the atmosphere. Constellations of communications satellites, now numbering in the thousands, reflect sunlight and cross the sky as moving points, and long exposures from observatories are increasingly marked by their trails. Operators have cooperated to an extent, darkening surfaces and adjusting orientations, and the brightest designs have been improved. Radio astronomy faces a harder version of the same problem, because the transmissions are in the sky rather than merely reflected from it. Observatory director Professor Hugo Lindberg describes the situation as manageable but narrowing. "Software can remove a trail from an image," he says. "It cannot remove a trail from an image that was never dark enough to take."

G) What makes the ground-level problem unusual among environmental issues is how quickly it can be reversed. Light pollution leaves nothing behind: a lamp that is shielded so that it throws light downward, dimmed after midnight, and chosen in a warmer colour stops contributing to the glow the same night it is changed. Several regions now write these requirements into their lighting standards, and a growing number of protected dark-sky areas have demonstrated that a town can be well lit and still see stars. Lighting engineer Owen Bradshaw argues that the profession has been solving the wrong problem. "Nobody wants light in the sky," he says. "They want to see the pavement, and we have been giving them both because it was cheaper not to think about it."`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why satellite data underestimated the change",
          "B",
          "Satellites that map night-time light have historically been blind to blue wavelengths, and the switch from orange sodium street lamps to white light-emitting diodes has shifted a great deal of emission into exactly that part of the spectrum.",
          "Paragraph B: satellites were 'blind to blue wavelengths'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the observation that savings were spent on more lighting",
          "C",
          "What has happened in many places instead is that authorities have installed more lights, brighter lights, or lights in places that were previously dark, spending the same money and producing more illumination.",
          "Paragraph C: the saving became more light.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "evidence that a simple measure reduces harm to wildlife",
          "D",
          "Migrating birds are drawn towards lit structures and collide with them, in numbers estimated in the hundreds of millions each year in North America alone; turning building lights off during migration seasons measurably reduces the deaths.",
          "Paragraph D: switching lights off reduces collisions.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a point about how quickly the problem can be undone",
          "G",
          "Light pollution leaves nothing behind: a lamp that is shielded so that it throws light downward, dimmed after midnight, and chosen in a warmer colour stops contributing to the glow the same night it is changed.",
          "Paragraph G: it stops 'the same night it is changed'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Sky glow is produced by light that travels upward or sideways and ______ off dust and droplets.",
          "scatters",
          "The cause is not the light that reaches the ground, which is the point of street lighting, but the light that goes upward or sideways, scatters off dust and water droplets in the air and turns the whole sky into a dim glowing dome.",
          "It 'scatters off dust and water droplets'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Volunteers report the faintest ______ they can see.",
          "stars",
          "Measurements from citizen-science projects, in which volunteers report the faintest stars they can see, suggest that this glow has been brightening by several per cent a year in many places — faster than satellite instruments had indicated.",
          "They 'report the faintest stars they can see'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Trees growing near street lamps come into ______ earlier.",
          "leaf",
          "Trees near street lamps come into leaf earlier.",
          "They 'come into leaf earlier'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Evening blue light delays sleep by suppressing a ______.",
          "hormone",
          "Light in the blue part of the spectrum, in the evening, suppresses the hormone that signals the onset of night and delays sleep; that much is established in laboratories.",
          "It 'suppresses the hormone that signals the onset of night'.",
        ),
        fromList(
          "matching_features",
          SKY_PEOPLE,
          "The measuring system was designed for an older kind of lamp.",
          "Irene Castillo",
          '"We had a monitoring system built for the lamps of the twentieth century," she says, "and the lamps changed underneath it."',
          "Castillo on the outdated monitoring.",
        ),
        fromList(
          "matching_features",
          SKY_PEOPLE,
          "Darkness should be treated as a habitat.",
          "Mariam Saleh",
          '"We would not flood a wetland and call it neutral," she says. "We flood the night and expect nothing to change."',
          "Saleh's comparison with flooding a wetland.",
        ),
        fromList(
          "matching_features",
          SKY_PEOPLE,
          "Processing cannot rescue an observation that was never dark enough.",
          "Hugo Lindberg",
          '"Software can remove a trail from an image," he says. "It cannot remove a trail from an image that was never dark enough to take."',
          "Lindberg on the limits of software.",
        ),
        fromList(
          "matching_features",
          SKY_PEOPLE,
          "Lighting has delivered something nobody asked for.",
          "Owen Bradshaw",
          '"Nobody wants light in the sky," he says. "They want to see the pavement, and we have been giving them both because it was cheaper not to think about it."',
          "Bradshaw: nobody wants light in the sky.",
        ),
        fromList(
          "matching_features",
          SKY_PEOPLE,
          "Blue emission both escapes older instruments and brightens the sky more.",
          "Irene Castillo",
          "Blue light also scatters more in the atmosphere, so an installation that looks similar from orbit can produce a considerably brighter sky.",
          "Castillo's field was caught out by exactly this shift into blue.",
        ),
      ],
    },
    {
      key: "t43-p3-bird-navigation",
      title: "How the Warbler Knows",
      topic: "the senses migrating birds use to find their way",
      difficulty: 8,
      body: `A garden warbler weighing less than a bar of soap leaves northern Europe in autumn, flies to sub-Saharan Africa, and returns in spring to the hedge it left. A young bird makes the first journey without a guide. Explaining how it does so has occupied researchers for seventy years, and the answer that has emerged is not a single mechanism but a set of them, used together and checked against each other.

The classical experiments were done in circular cages. A caged migratory bird, in the season when it would normally travel, hops persistently towards the direction it wants to go, and this restless behaviour can be recorded — originally on paper lining the cage, scratched by the bird's feet. Placed under a planetarium sky, hand-raised birds orient by the pattern of stars, and if the artificial sky is rotated they change direction accordingly. What they appear to learn, as nestlings, is not particular constellations but the point around which the sky turns, which marks true north regardless of the season.

The sun provides a second reference, and using it requires a clock. A bird taking a bearing from the sun must know the time of day, since the sun moves across the sky; experiments that shift a bird's internal clock by keeping it under artificial light on a delayed cycle produce birds that fly off at a predictable angle to the correct course. Polarised light from the sky near sunset appears to be used to calibrate the whole system at the start of each night's flight.

The third reference is the Earth's magnetic field, and it is the strangest. Birds can detect both the direction of the field and its inclination — the angle at which the field lines dip into the ground, which varies with latitude. Two mechanisms have been proposed. One involves crystals of magnetite, a magnetic mineral, found in tissue in the upper beak. The other, which has attracted more evidence recently, is chemical: a protein in the retina called a cryptochrome, when struck by light, forms a pair of molecules whose electron spins are sensitive to the magnetic field, altering the chemical reaction in a way the bird may perceive as a visual pattern. Support for this comes from the finding that magnetic orientation in several species fails in complete darkness and is disrupted by weak radio-frequency fields of the kind that would interfere with such a reaction.

A compass, however, only tells a traveller which way is north. To correct a course after being blown off route, an animal needs to know where it is — a map as well as a compass. Here the evidence is thinner and more contested. Adult birds displaced hundreds of kilometres sideways can compensate and reach their destination; young birds on their first migration usually cannot, and continue on their original heading, which suggests the map is learned rather than inherited. What the map is made of remains open: candidates include gradients in the magnetic field, infrasound from distant coasts and mountains, and, in some species, smell. Experiments in which the olfactory nerve is blocked disrupt homing in pigeons, a result that has been replicated many times and is still argued about, because it is hard to rule out the possibility that the treatment simply makes the bird unwell.

The picture that has emerged is of redundancy. A bird carries several systems that can each supply a direction, and it appears to recalibrate one against another: the magnetic compass against the rotating sky, the sun against the internal clock, and all of them against the polarised light at dusk. When one source is unavailable — an overcast sky, a magnetic anomaly — the others carry the flight. This is what makes the mechanism so difficult to study, because removing any single input often changes performance very little.

It also explains a growing worry. Light at night disrupts orientation near cities; radio noise at certain frequencies interferes with the chemical compass in laboratory conditions; and the magnetic field itself drifts, slowly, in ways that a learned map may not track. None of these is likely to stop migration, which has survived far larger changes. But a system built on several senses working together can be degraded quietly, one input at a time, and it is not obvious that anybody is measuring the right things to notice.`,
      questions: [
        mcq(
          "What do the circular cage experiments record?",
          [
            "the number of hours a bird sleeps",
            "the direction a caged bird tries to travel in",
            "the distance a bird can fly without rest",
            "the weight a bird loses during migration",
          ],
          "the direction a caged bird tries to travel in",
          "A caged migratory bird, in the season when it would normally travel, hops persistently towards the direction it wants to go, and this restless behaviour can be recorded — originally on paper lining the cage, scratched by the bird's feet.",
          "The cage records where the bird hops — 'the direction it wants to go'.",
        ),
        mcq(
          "What do young birds appear to learn from the night sky?",
          [
            "the names of particular constellations",
            "the point about which the sky appears to rotate",
            "the brightness of individual stars",
            "the position of the moon each month",
          ],
          "the point about which the sky appears to rotate",
          "What they appear to learn, as nestlings, is not particular constellations but the point around which the sky turns, which marks true north regardless of the season.",
          "They learn 'the point around which the sky turns'.",
        ),
        mcq(
          "Why does using the sun as a reference require an internal clock?",
          [
            "because the sun is not visible at night",
            "because the sun's position changes through the day",
            "because birds fly only at particular hours",
            "because sunlight varies in brightness",
          ],
          "because the sun's position changes through the day",
          "A bird taking a bearing from the sun must know the time of day, since the sun moves across the sky; experiments that shift a bird's internal clock by keeping it under artificial light on a delayed cycle produce birds that fly off at a predictable angle to the correct course.",
          "'The sun moves across the sky', so the time must be known.",
        ),
        mcq(
          "What evidence supports the chemical explanation of the magnetic sense?",
          [
            "Magnetite has been found in the beak.",
            "Orientation fails in darkness and is disturbed by radio-frequency fields.",
            "Birds can be trained to respond to magnets.",
            "Young birds compensate for displacement.",
          ],
          "Orientation fails in darkness and is disturbed by radio-frequency fields.",
          "Support for this comes from the finding that magnetic orientation in several species fails in complete darkness and is disrupted by weak radio-frequency fields of the kind that would interfere with such a reaction.",
          "It fails in darkness and under radio-frequency fields.",
        ),
        fromList(
          "summary_completion",
          BIRD_BANK,
          "Hand-raised birds orient by the pattern of ______ in a planetarium.",
          "stars",
          "Placed under a planetarium sky, hand-raised birds orient by the pattern of stars, and if the artificial sky is rotated they change direction accordingly.",
          "They orient 'by the pattern of stars'.",
        ),
        fromList(
          "summary_completion",
          BIRD_BANK,
          "Shifting a bird's internal ______ makes it set off at the wrong angle.",
          "clock",
          "A bird taking a bearing from the sun must know the time of day, since the sun moves across the sky; experiments that shift a bird's internal clock by keeping it under artificial light on a delayed cycle produce birds that fly off at a predictable angle to the correct course.",
          "Shifting 'a bird's internal clock' changes the course.",
        ),
        fromList(
          "summary_completion",
          BIRD_BANK,
          "One proposed magnetic sense uses crystals in the upper ______.",
          "beak",
          "One involves crystals of magnetite, a magnetic mineral, found in tissue in the upper beak.",
          "The crystals are 'in the upper beak'.",
        ),
        fromList(
          "summary_completion",
          BIRD_BANK,
          "The chemical explanation involves a protein in the ______.",
          "eye",
          "The other, which has attracted more evidence recently, is chemical: a protein in the retina called a cryptochrome, when struck by light, forms a pair of molecules whose electron spins are sensitive to the magnetic field, altering the chemical reaction in a way the bird may perceive as a visual pattern.",
          "The protein sits 'in the retina' — in the eye.",
        ),
        fromList(
          "summary_completion",
          BIRD_BANK,
          "A compass alone is not enough; a bird also needs a ______ to correct its position.",
          "map",
          "To correct a course after being blown off route, an animal needs to know where it is — a map as well as a compass.",
          "It needs 'a map as well as a compass'.",
        ),
        fromList(
          "summary_completion",
          BIRD_BANK,
          "Blocking the sense of ______ disrupts homing in pigeons.",
          "smell",
          "Experiments in which the olfactory nerve is blocked disrupt homing in pigeons, a result that has been replicated many times and is still argued about, because it is hard to rule out the possibility that the treatment simply makes the bird unwell.",
          "Blocking the olfactory nerve — the sense of smell — disrupts homing.",
        ),
        ynng(
          "The writer thinks a single mechanism will eventually explain bird navigation.",
          "NO",
          "Explaining how it does so has occupied researchers for seventy years, and the answer that has emerged is not a single mechanism but a set of them, used together and checked against each other.",
          "The answer is 'not a single mechanism but a set of them'.",
        ),
        ynng(
          "The writer accepts that the evidence for a magnetic map is weaker than for a compass.",
          "YES",
          "Here the evidence is thinner and more contested.",
          "On the map question, 'the evidence is thinner and more contested'.",
        ),
        ynng(
          "The writer believes the redundancy of the system makes it easy to study.",
          "NO",
          "This is what makes the mechanism so difficult to study, because removing any single input often changes performance very little.",
          "Redundancy is what 'makes the mechanism so difficult to study'.",
        ),
        ynng(
          "The writer holds that male and female birds navigate by different means.",
          "NOT GIVEN",
          "",
          "The passage never distinguishes between the sexes.",
        ),
      ],
    },
  ],
};
