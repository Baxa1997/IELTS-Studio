import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · lettered paragraphs, choose TWO ------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ALERTS_STEM =
  "Which TWO of the following are mentioned as ways of avoiding false or unnecessary alerts?";
const ALERT_OPTIONS = [
  "using data only from phones that have been still for some time",
  "sending alerts only during the daytime",
  "adapting warnings to each person's location",
  "asking users to confirm that they have felt shaking",
  "combining phone data with weather forecasts",
];

// ---- Passage 3 · sentence endings ---------------------------------------------

const ENDINGS = [
  "is an objective description of how few contacts a person has.",
  "may find it harder to keep up relationships.",
  "connect patients with activities in their area.",
  "can be useful because it encourages people to seek company.",
  "has been proven to be the main cause of early death.",
  "is always experienced by people who live alone.",
];

export const TEST_05: CuratedTest = {
  key: "full-test-05",
  targetBand: 7,
  passages: [
    {
      key: "t05-p1-viking-sunstones",
      title: "Finding the Hidden Sun",
      topic: "how Viking sailors may have navigated with crystals",
      difficulty: 6,
      body: `Between the eighth and eleventh centuries, Norse seafarers from Scandinavia crossed thousands of kilometres of open ocean. They sailed to the British Isles and the Faroe Islands, settled Iceland and Greenland, and around the year 1000 reached the coast of North America. Their ships were light and strong, and could be either sailed or rowed. What makes these voyages remarkable is that they were made without magnetic compasses, which did not come into use in Europe until the late twelfth century.

Historians believe the Vikings relied on a combination of skills. Sailors observed the position of the sun during the day and the stars at night, and they knew how the colour of the sea, the behaviour of birds and the presence of whales could indicate that land was near. Some accounts describe sailors releasing ravens from their ships and following the birds towards land. Experienced navigators also used landmarks such as mountains and glaciers, which were visible from far out at sea. Much of this knowledge was passed on by word of mouth and has left few written records.

The North Atlantic presented particular challenges, however. For long periods in summer, the sky in northern latitudes is covered in cloud or fog, hiding the sun, and during the weeks around midsummer the sun never sets fully, so the stars cannot be seen. Even the sun's shadow, which can be used to judge direction, disappears under heavy cloud. A navigator who lost his bearings in such conditions could easily miss his destination entirely. How, then, could a ship be kept on course? One intriguing answer comes from the Icelandic sagas, medieval stories about the Norse world. Several of them mention a mysterious object called a sólarsteinn, or sunstone, which could be used to locate the sun even when it was hidden.

For centuries, most scholars regarded the sunstone as legendary. In 1967, however, a Danish archaeologist suggested that it might have been a real crystal. Certain minerals, including a transparent form of calcite found in Iceland, have a property called birefringence: light passing through them is split into two beams. Because sunlight becomes polarised as it passes through the atmosphere, the brightness of these two beams changes depending on the direction of the sun. By rotating the crystal until the two images appeared equally bright, a navigator could, in theory, work out where the sun was, even behind thick cloud. The idea attracted little attention at first, since it was not clear how the effect could be demonstrated.

This theory later received support from both laboratory experiments and a remarkable discovery. In 2011, researchers tested a piece of Icelandic calcite and found that they could locate the sun to within a few degrees under overcast skies. Two years later, a team announced that a calcite crystal had been found among the remains of an English warship that sank in 1592 near the island of Alderney. Because the crystal lay close to other navigation instruments, and because iron objects on board would have disturbed a magnetic compass, the researchers argued that it may have been kept as a back-up for finding direction. The crystal had become cloudy after centuries under water, but tests showed that a clear crystal of the same kind could have worked.

Not everyone is convinced. The crystal from the shipwreck dates from centuries after the Viking age, and no sunstone has ever been found at a Viking site. Critics also point out that the sagas are literary works written long after the events they describe, and that references to sunstones might be symbolic rather than practical. Some experiments have suggested that using a crystal accurately requires considerable skill and patience, which would have been difficult on a moving ship in rough seas. Others argue that experienced sailors may simply have estimated the sun's position from the brightness of the clouds.

Supporters respond that crystals are easily lost or broken, so the absence of archaeological evidence is not surprising. Computer simulations published in 2018 suggested that a Viking ship using a sunstone every few hours could have kept its course well enough to reach Greenland in most weather conditions. In these simulations, the success rate depended heavily on how often the navigator checked the crystal. The debate may never be fully resolved, but the idea that Norse sailors used a crystal to see the invisible sun continues to fascinate scientists and historians alike.`,
      questions: [
        tfng(
          "Viking sailors reached North America before the magnetic compass was used in Europe.",
          "TRUE",
          "What makes these voyages remarkable is that they were made without magnetic compasses, which did not come into use in Europe until the late twelfth century.",
          "They reached North America around 1000, but compasses were not used in Europe 'until the late twelfth century'.",
        ),
        tfng(
          "Most Viking knowledge of navigation was recorded in detailed written guides.",
          "FALSE",
          "Much of this knowledge was passed on by word of mouth and has left few written records.",
          "It 'was passed on by word of mouth and has left few written records'.",
        ),
        tfng(
          "Around midsummer in the far north, the stars cannot be seen at night.",
          "TRUE",
          "For long periods in summer, the sky in northern latitudes is covered in cloud or fog, hiding the sun, and during the weeks around midsummer the sun never sets fully, so the stars cannot be seen.",
          "The sun 'never sets fully, so the stars cannot be seen'.",
        ),
        tfng(
          "The Danish archaeologist who proposed the sunstone theory tested it on a sea voyage.",
          "NOT GIVEN",
          "",
          "The passage says what he suggested in 1967, not whether he ever tested it at sea.",
        ),
        tfng(
          "The crystal found near Alderney was still clear when it was discovered.",
          "FALSE",
          "The crystal had become cloudy after centuries under water, but tests showed that a clear crystal of the same kind could have worked.",
          "It 'had become cloudy after centuries under water'.",
        ),
        tfng(
          "Several sunstones have been discovered at Viking sites.",
          "FALSE",
          "The crystal from the shipwreck dates from centuries after the Viking age, and no sunstone has ever been found at a Viking site.",
          "'No sunstone has ever been found at a Viking site.'",
        ),
        tfng(
          "The 2018 simulations were carried out by the team that tested Icelandic calcite in 2011.",
          "NOT GIVEN",
          "",
          "Both pieces of research are mentioned, but the passage never says who carried them out.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Sailors could tell that land was near from the colour of the sea, the behaviour of birds and the presence of ______.",
          "whales",
          "Sailors observed the position of the sun during the day and the stars at night, and they knew how the colour of the sea, the behaviour of birds and the presence of whales could indicate that land was near.",
          "The signs included 'the presence of whales'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some sailors released ______ and followed them towards land.",
          "ravens",
          "Some accounts describe sailors releasing ravens from their ships and following the birds towards land.",
          "They released 'ravens from their ships'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Light passing through certain crystals is split into two ______.",
          "beams",
          "Certain minerals, including a transparent form of calcite found in Iceland, have a property called birefringence: light passing through them is split into two beams.",
          "Light 'is split into two beams'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A navigator turned the crystal until the two images appeared equally ______.",
          "bright",
          "By rotating the crystal until the two images appeared equally bright, a navigator could, in theory, work out where the sun was, even behind thick cloud.",
          "The crystal was rotated 'until the two images appeared equally bright'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "On the warship, ______ objects would have disturbed a magnetic compass.",
          "iron",
          "Because the crystal lay close to other navigation instruments, and because iron objects on board would have disturbed a magnetic compass, the researchers argued that it may have been kept as a back-up for finding direction.",
          "'Iron objects on board would have disturbed a magnetic compass'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Supporters say crystals are easily lost or ______, so few would survive.",
          "broken",
          "Supporters respond that crystals are easily lost or broken, so the absence of archaeological evidence is not surprising.",
          "Crystals 'are easily lost or broken'.",
        ),
      ],
    },
    {
      key: "t05-p2-phone-earthquake-alerts",
      title: "Warnings from a Million Phones",
      topic: "how smartphones are being used to warn people of earthquakes",
      difficulty: 7,
      body: `A) Earthquakes are among the most destructive natural hazards, and unlike storms they cannot be forecast days in advance. Scientists can estimate the probability that a large earthquake will strike a region over a period of decades, but not when it will happen. What is possible, however, is to give a warning a few seconds after an earthquake begins, before the most damaging shaking reaches places further away. Such earthquake early warning systems have been operating in Japan and Mexico for many years, and they depend on a simple fact: electronic signals travel far faster than seismic waves. In Mexico City, sirens have sounded before shaking arrived from earthquakes hundreds of kilometres away.

B) When an earthquake occurs, it releases two main types of wave. The first, known as primary or P waves, travel fastest but usually cause little damage. They are followed by slower secondary or S waves and surface waves, which produce the strong shaking that brings down buildings. Scientists often compare this to seeing lightning before hearing thunder. By detecting the P waves with sensors near the source, a warning system can calculate the size and location of the earthquake and send an alert to more distant areas before the S waves arrive. The warning time ranges from a few seconds to perhaps a minute, depending on how far a person is from the source.

C) A few seconds may not sound like much, but it can make a significant difference. It is enough time for people to drop to the ground and take cover under a table, for surgeons to stop delicate operations, and for trains to begin braking. Studies suggest that many injuries during earthquakes are caused by falling objects, so even a brief warning can help people move away from windows and shelves. Factories can automatically shut down dangerous machinery, and lifts can stop at the nearest floor and open their doors. In Japan, high-speed trains have been fitted with systems that cut power automatically when a warning is received.

D) Traditional warning systems rely on networks of expensive scientific instruments, and many earthquake-prone countries cannot afford to build them. In recent years, a very different approach has emerged. Almost every smartphone contains an accelerometer, a small sensor that detects movement and is normally used to rotate the screen. When thousands of phones in the same area detect the characteristic shaking of P waves at almost the same moment, a central computer can conclude that an earthquake is under way and send alerts to phones further away. Because so many people carry phones, such a network can cover areas where there are no scientific instruments at all.

E) In 2020, a major technology company began building such a system into the operating software used by most of the world's smartphones. According to a study published by the company's researchers in 2025, the system detected thousands of earthquakes in dozens of countries over its first three years and sent alerts to millions of people, many of whom lived in regions with no other warning system. For earthquakes above a certain size, the researchers reported, the system's estimates of magnitude improved significantly as the software was refined.

F) The approach has limitations. Phones are not designed as scientific instruments, and their readings can be disturbed by everyday movements, such as a phone being dropped or carried in a moving vehicle. To avoid false alarms, the system only uses data from phones that have been still for a period of time, typically while they are charging. Accuracy has also been a concern: in 2023, the system underestimated the strength of a very large earthquake in Turkey, so that many people who needed the most urgent warning did not receive one. Some users also complained of receiving alerts after the shaking had already reached them. Seismologist Dr Leyla Aksoy emphasises that phone-based systems should add to, rather than replace, networks of dedicated sensors.

G) Public trust is perhaps the greatest challenge. If alerts arrive too late, too often or for earthquakes that turn out to be minor, people may begin to ignore them. Education is therefore essential: people need to know what to do in the few seconds available, and to understand that the absence of an alert does not guarantee safety. Researchers are now testing ways of tailoring warnings to each person's location, so that those far from the source are not alarmed unnecessarily. Surveys after alerts have been sent suggest that many recipients found them useful, although some said they did not know how to respond. Used well, the phones in people's pockets could become one of the largest scientific instruments ever built.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of the main types of wave produced by an earthquake",
          "B",
          "When an earthquake occurs, it releases two main types of wave.",
          "Paragraph B explains P waves, S waves and surface waves.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "examples of machines responding to a warning without human action",
          "C",
          "Factories can automatically shut down dangerous machinery, and lifts can stop at the nearest floor and open their doors.",
          "Paragraph C: machinery shuts down 'automatically', lifts stop, and trains cut power.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of the sensor used by the phone-based system",
          "D",
          "Almost every smartphone contains an accelerometer, a small sensor that detects movement and is normally used to rotate the screen.",
          "Paragraph D describes the accelerometer.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of the phone-based system failing to warn people properly",
          "F",
          "Accuracy has also been a concern: in 2023, the system underestimated the strength of a very large earthquake in Turkey, so that many people who needed the most urgent warning did not receive one.",
          "Paragraph F: in Turkey many people 'did not receive' the urgent warning they needed.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a suggestion that receiving too many alerts could make people pay less attention",
          "G",
          "If alerts arrive too late, too often or for earthquakes that turn out to be minor, people may begin to ignore them.",
          "Paragraph G: alerts that come 'too often' may be ignored.",
        ),
        pickTwo(
          ALERTS_STEM,
          ALERT_OPTIONS,
          "A or C",
          "To avoid false alarms, the system only uses data from phones that have been still for a period of time, typically while they are charging.",
          "A is correct: only phones 'that have been still for a period of time' are used. D and E are never mentioned.",
        ),
        pickTwo(
          ALERTS_STEM,
          ALERT_OPTIONS,
          "A or C",
          "Researchers are now testing ways of tailoring warnings to each person's location, so that those far from the source are not alarmed unnecessarily.",
          "C is correct: warnings tailored 'to each person's location' avoid alarming people unnecessarily. B is not mentioned.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Warning systems work because electronic signals travel much faster than ______ waves.",
          "seismic",
          "Such earthquake early warning systems have been operating in Japan and Mexico for many years, and they depend on a simple fact: electronic signals travel far faster than seismic waves.",
          "Signals 'travel far faster than seismic waves'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The shaking that damages buildings comes from S waves and ______ waves.",
          "surface",
          "They are followed by slower secondary or S waves and surface waves, which produce the strong shaking that brings down buildings.",
          "'S waves and surface waves' produce the strong shaking.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Even a few seconds allow surgeons to stop delicate ______.",
          "operations",
          "It is enough time for people to drop to the ground and take cover under a table, for surgeons to stop delicate operations, and for trains to begin braking.",
          "Surgeons can 'stop delicate operations'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Many earthquake injuries are caused by ______ objects.",
          "falling",
          "Studies suggest that many injuries during earthquakes are caused by falling objects, so even a brief warning can help people move away from windows and shelves.",
          "Injuries are 'caused by falling objects'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "The phone system usually uses data from phones while they are ______.",
          "charging",
          "To avoid false alarms, the system only uses data from phones that have been still for a period of time, typically while they are charging.",
          "Phones are used 'typically while they are charging'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "People must understand that not receiving an alert does not guarantee their ______.",
          "safety",
          "Education is therefore essential: people need to know what to do in the few seconds available, and to understand that the absence of an alert does not guarantee safety.",
          "'The absence of an alert does not guarantee safety'.",
        ),
      ],
    },
    {
      key: "t05-p3-loneliness",
      title: "Is Loneliness a Public Health Problem?",
      topic: "whether loneliness should be treated as a health issue",
      difficulty: 8,
      body: `In 2023, the most senior public health official in the United States issued a formal warning describing loneliness as an epidemic. The same year, the World Health Organization launched an international commission to address social isolation, and several governments had already appointed ministers with responsibility for the issue. To some observers, this attention seemed overdue. To others, it seemed strange that a feeling as ordinary as loneliness should be treated in the same way as smoking or obesity. In my view, the concern is justified, but the language used to express it deserves closer examination.

It is important first to distinguish between two ideas that are often confused. Social isolation is an objective condition: it describes how few contacts a person has. Loneliness, by contrast, is subjective; it is the painful sense that one's relationships are fewer or less satisfying than one would like. A person can live alone and rarely see others without feeling lonely, while another may feel deeply lonely despite being surrounded by family and colleagues. Researchers usually measure loneliness by asking people how often they feel left out or lack companionship. Much of the research lumps the two ideas together, and this can make the findings difficult to interpret.

The evidence that both can harm health is nonetheless substantial. Large studies following thousands of people over many years have found that those who are socially isolated or lonely have a higher risk of heart disease, stroke, depression and dementia, and are more likely to die early. Loneliness has also been linked to weaker immune responses, although this evidence is less consistent. One widely quoted analysis suggested that the effect on mortality was comparable to that of smoking fifteen cigarettes a day. That comparison has been criticised as misleading, since the studies it drew on measured different things in different ways, but even cautious researchers accept that the association is real.

What remains uncertain is how much of this association reflects cause and effect. It is plausible that loneliness damages health, perhaps by increasing stress or discouraging healthy habits. But the relationship may also run in the opposite direction: people who are ill or disabled may find it harder to maintain relationships. Personality may play a part as well, since some people are more likely both to feel lonely and to report poor health. Both explanations are probably true to some extent, and separating them is extremely difficult. This uncertainty does not mean that loneliness should be ignored, but it should make us modest about the benefits that any single intervention can deliver.

Governments have responded in various ways. In the United Kingdom, doctors can refer patients to social prescribing schemes, in which link workers connect them with local activities such as walking groups, choirs or volunteering. Japan created a ministerial post focused on loneliness in 2021, partly in response to concerns raised during the pandemic. Some local authorities have also introduced programmes that pair older residents with volunteers who visit or telephone them regularly. Evaluations of social prescribing have produced encouraging stories, yet many studies have been small and lacked a comparison group, so the size of the benefit remains unclear. I would argue that such schemes are worth expanding, but only if they are properly evaluated.

My main reservation concerns the word "epidemic". It suggests that loneliness is spreading rapidly, like an infectious disease, yet the evidence for a dramatic rise is mixed. Some surveys show increases among young adults, but others suggest that levels among older people have remained broadly stable for decades. Changes in how questions are worded between surveys make comparisons over time particularly difficult. Describing loneliness as an epidemic may attract attention and funding, but it also risks turning a normal human experience into a medical condition. Everyone feels lonely at times, and brief loneliness can serve a useful purpose by motivating people to seek company.

The challenge, then, is to address chronic loneliness without treating every lonely moment as a problem to be fixed. That will require action far beyond the health service: the design of housing and public spaces, the availability of affordable transport and the survival of community organisations all shape how easily people can connect. Technology may help some people to stay in touch, but it cannot replace the informal meeting places that many communities have lost. Loneliness may be experienced privately, but many of its causes are public, and so, therefore, are many of its solutions.`,
      questions: [
        mcq(
          "What is the writer's view of the recent attention given to loneliness?",
          [
            "It is unnecessary, because loneliness is an ordinary feeling.",
            "It is justified, but the way the issue is described should be questioned.",
            "It came too late to make any real difference.",
            "It has been led mainly by the World Health Organization.",
          ],
          "It is justified, but the way the issue is described should be questioned.",
          "In my view, the concern is justified, but the language used to express it deserves closer examination.",
          "The concern 'is justified', but the language 'deserves closer examination'. A describes other observers' view, not the writer's.",
        ),
        mcq(
          "What problem with much of the research does the writer identify?",
          [
            "It has focused mainly on older people.",
            "It often fails to separate loneliness from social isolation.",
            "It has shown that loneliness directly causes dementia.",
            "It has been ignored by governments.",
          ],
          "It often fails to separate loneliness from social isolation.",
          "Much of the research lumps the two ideas together, and this can make the findings difficult to interpret.",
          "Research 'lumps the two ideas together' — loneliness and social isolation.",
        ),
        mcq(
          "Why has the comparison between loneliness and smoking been criticised?",
          [
            "It exaggerated the health risks of smoking.",
            "The studies behind it measured different things in different ways.",
            "It was based on a single small study.",
            "It left out the effects of depression.",
          ],
          "The studies behind it measured different things in different ways.",
          "That comparison has been criticised as misleading, since the studies it drew on measured different things in different ways, but even cautious researchers accept that the association is real.",
          "The studies 'measured different things in different ways'.",
        ),
        mcq(
          "What does the writer conclude in the final paragraph?",
          [
            "Loneliness is mainly a private matter for individuals.",
            "The health service can solve the problem of loneliness on its own.",
            "Many of the causes of loneliness require action by society.",
            "Technology will soon replace traditional meeting places.",
          ],
          "Many of the causes of loneliness require action by society.",
          "Loneliness may be experienced privately, but many of its causes are public, and so, therefore, are many of its solutions.",
          "Its causes 'are public, and so, therefore, are many of its solutions'. B contradicts 'action far beyond the health service'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Social isolation",
          "is an objective description of how few contacts a person has.",
          "Social isolation is an objective condition: it describes how few contacts a person has.",
          "Isolation 'is an objective condition' describing 'how few contacts a person has'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "People who are ill or disabled",
          "may find it harder to keep up relationships.",
          "But the relationship may also run in the opposite direction: people who are ill or disabled may find it harder to maintain relationships.",
          "'Maintain relationships' is paraphrased as 'keep up relationships'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "In social prescribing schemes, link workers",
          "connect patients with activities in their area.",
          "In the United Kingdom, doctors can refer patients to social prescribing schemes, in which link workers connect them with local activities such as walking groups, choirs or volunteering.",
          "Link workers 'connect them with local activities'.",
        ),
        fromList(
          "matching_sentence_endings",
          ENDINGS,
          "Brief loneliness",
          "can be useful because it encourages people to seek company.",
          "Everyone feels lonely at times, and brief loneliness can serve a useful purpose by motivating people to seek company.",
          "It 'can serve a useful purpose by motivating people to seek company'. The ending about living alone contradicts the passage.",
        ),
        ynng(
          "It is possible to feel lonely while spending a lot of time with other people.",
          "YES",
          "A person can live alone and rarely see others without feeling lonely, while another may feel deeply lonely despite being surrounded by family and colleagues.",
          "Someone 'may feel deeply lonely despite being surrounded by family and colleagues'.",
        ),
        ynng(
          "There is little evidence that loneliness is connected with poor health.",
          "NO",
          "The evidence that both can harm health is nonetheless substantial.",
          "The writer calls the evidence 'substantial'.",
        ),
        ynng(
          "Uncertainty about cause and effect means that loneliness can safely be ignored.",
          "NO",
          "This uncertainty does not mean that loneliness should be ignored, but it should make us modest about the benefits that any single intervention can deliver.",
          "The writer says the uncertainty 'does not mean that loneliness should be ignored'.",
        ),
        ynng(
          "Social prescribing schemes should be expanded whether or not they are evaluated.",
          "NO",
          "I would argue that such schemes are worth expanding, but only if they are properly evaluated.",
          "The writer supports expansion 'only if they are properly evaluated'.",
        ),
        ynng(
          "Calling loneliness an epidemic risks treating a normal experience as an illness.",
          "YES",
          "Describing loneliness as an epidemic may attract attention and funding, but it also risks turning a normal human experience into a medical condition.",
          "It 'risks turning a normal human experience into a medical condition'.",
        ),
        ynng(
          "Young adults use social media more than any other age group.",
          "NOT GIVEN",
          "",
          "Surveys of young adults are mentioned, but social media is not discussed at all.",
        ),
      ],
    },
  ],
};
