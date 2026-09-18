import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of invention · flow-chart --------------------------

const PROCESS = {
  title: "Making a daguerreotype",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO -----------------

const SOLAR_PEOPLE = ["Ines Barros", "Jonas Ritter", "Amara Diallo", "Viktor Halasz"];
const SOLAR_BANK = [
  "shadow",
  "microwaves",
  "launch",
  "mass",
  "robots",
  "beam",
  "receiver",
  "orbit",
  "clouds",
  "spectrum",
];
const SOLAR_STEM = "Which TWO advantages of collecting solar power in orbit are given?";
const SOLAR_ADVANTAGES = [
  "sunlight there is not interrupted by night or weather",
  "the equipment needs no maintenance of any kind",
  "the sunlight collected there is more intense than at ground level",
  "the panels can be made without rare materials",
  "the system is cheaper to build than a power station",
];

// ---- Passage 3 · research debate · lettered paragraphs, people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const LANGUAGE_PEOPLE = ["Teresa Molnar", "Aditya Rao", "Sofie Berg", "Malik Toure"];

export const TEST_46: CuratedTest = {
  key: "full-test-46",
  targetBand: 8,
  passages: [
    {
      key: "t46-p1-first-photographs",
      title: "Fixing the Image",
      topic: "the invention of photography and the rivalry behind it",
      difficulty: 7,
      body: `The camera existed for centuries before photography. A dark room or box with a small hole in one wall throws an inverted image of whatever is outside onto the opposite surface, an effect described by scholars in China and the Arab world long before European artists began tracing such images as an aid to drawing. The whole problem of photography was not making the picture appear; it was making it stay.

Chemistry supplied the first half of the answer in the eighteenth century, when it was established that certain silver compounds darken on exposure to light. Early experimenters produced silhouettes of leaves and paintings on paper soaked in silver nitrate, and then watched them turn uniformly black, because nothing stopped the reaction continuing once the image had formed. What was needed was a way to remove the unexposed compound and leave the rest.

The first surviving photograph made from nature was produced in about 1826 by Nicéphore Niépce, a French inventor working near Chalon-sur-Saône. He coated a pewter plate with a form of bitumen that hardens where light falls on it, put the plate in a camera pointed at the view from an upper window, and left it there for many hours. Washing the plate with oil of lavender removed the bitumen that had stayed soft, leaving a faint image of roofs and a courtyard. It is barely legible and it took most of a day to make, but it did not fade.

Niépce went into partnership with Louis Daguerre, a Parisian painter of theatrical scenery, and died a few years later without seeing the process improved. Daguerre continued alone and, by 1837, had arrived at something quite different: a silvered copper plate, treated with iodine vapour to make it sensitive, exposed for minutes rather than hours, developed over heated mercury and then fixed in a salt solution. The result was a sharp, delicate image on a mirrored surface, unique and unreproducible. The French government bought the rights in 1839 and gave the process to the world, with the exception of England, where Daguerre had taken out a patent.

He was not alone. In England, William Henry Fox Talbot had been working on paper coated with silver salts, and on hearing of Daguerre's announcement he hurried to publish his own results. His images were less sharp, but his process had a decisive advantage: it produced a negative, in which light and dark were reversed, and from a negative any number of positive prints could be made. Photography as an industry descends from Talbot's approach, not from Daguerre's, although the daguerreotype dominated the first decade because it was so much more detailed.

The missing element in both processes was a reliable way of stopping the action of light. The solution came from the astronomer John Herschel, who found that a compound then known as hyposulphite of soda dissolved the unexposed silver salts and left the image permanent. He communicated it to both rivals, coined the words photography, negative and positive, and took out no patent on any of it.

The daguerreotype's greatest limitation was the one nobody could design away: each plate was the only copy that would ever exist. A sitter who wanted a portrait for two relatives had to sit twice. Talbot's paper negatives were fragile and grainy, but they could be printed again and again, and once collodion on glass combined the sharpness of one process with the reproducibility of the other, in the early 1850s, both original methods were abandoned within a few years.

The consequences arrived faster than anyone anticipated. Within two years of the 1839 announcements, portrait studios were opening in European and American cities, and the exposure time had fallen from minutes to seconds as lenses improved and chemists found more sensitive preparations. For the first time, ordinary families could own an accurate likeness of a relative. Within twenty years photographers were recording war, poverty and archaeological sites, and painters were being told, prematurely, that their trade was finished.

What the early history shows most clearly is how rarely an invention has a single inventor. The optical principle was ancient, the chemistry belonged to several people, the fixing agent came from a third party who gave it away, and the two processes announced in the same year descended from entirely different ideas about what a photograph was for.`,
      questions: [
        tfng(
          "The principle of the camera was understood before photography was invented.",
          "TRUE",
          "A dark room or box with a small hole in one wall throws an inverted image of whatever is outside onto the opposite surface, an effect described by scholars in China and the Arab world long before European artists began tracing such images as an aid to drawing.",
          "It was described 'long before' photography.",
        ),
        tfng(
          "Early silver-nitrate images eventually darkened completely.",
          "TRUE",
          "Early experimenters produced silhouettes of leaves and paintings on paper soaked in silver nitrate, and then watched them turn uniformly black, because nothing stopped the reaction continuing once the image had formed.",
          "They 'turn uniformly black'.",
        ),
        tfng(
          "Niépce's photograph required an exposure of several hours.",
          "TRUE",
          "He coated a pewter plate with a form of bitumen that hardens where light falls on it, put the plate in a camera pointed at the view from an upper window, and left it there for many hours.",
          "He 'left it there for many hours'.",
        ),
        tfng(
          "Niépce lived to see Daguerre's improved process.",
          "FALSE",
          "Niépce went into partnership with Louis Daguerre, a Parisian painter of theatrical scenery, and died a few years later without seeing the process improved.",
          "He died 'without seeing the process improved'.",
        ),
        tfng(
          "The French government made Daguerre's process freely available everywhere.",
          "FALSE",
          "The French government bought the rights in 1839 and gave the process to the world, with the exception of England, where Daguerre had taken out a patent.",
          "England 'was the exception'.",
        ),
        tfng(
          "Talbot's images were sharper than daguerreotypes.",
          "FALSE",
          "His images were less sharp, but his process had a decisive advantage: it produced a negative, in which light and dark were reversed, and from a negative any number of positive prints could be made.",
          "They 'were less sharp'.",
        ),
        tfng(
          "Herschel profited financially from his discovery of a fixing agent.",
          "FALSE",
          "He communicated it to both rivals, coined the words photography, negative and positive, and took out no patent on any of it.",
          "He 'took out no patent on any of it'.",
        ),
        noteLine(
          PROCESS,
          null,
          "A silvered copper plate is made sensitive with ______ vapour",
          "iodine",
          "Daguerre continued alone and, by 1837, had arrived at something quite different: a silvered copper plate, treated with iodine vapour to make it sensitive, exposed for minutes rather than hours, developed over heated mercury and then fixed in a salt solution.",
          "It is 'treated with iodine vapour'.",
        ),
        noteLine(
          PROCESS,
          null,
          "After exposure the plate is developed over heated ______",
          "mercury",
          "Daguerre continued alone and, by 1837, had arrived at something quite different: a silvered copper plate, treated with iodine vapour to make it sensitive, exposed for minutes rather than hours, developed over heated mercury and then fixed in a salt solution.",
          "It is 'developed over heated mercury'.",
          { before: [{ text: "The plate is exposed in the camera for minutes", indent: 0 }] },
        ),
        noteLine(
          PROCESS,
          null,
          "The image is then fixed in a ______ solution",
          "salt",
          "Daguerre continued alone and, by 1837, had arrived at something quite different: a silvered copper plate, treated with iodine vapour to make it sensitive, exposed for minutes rather than hours, developed over heated mercury and then fixed in a salt solution.",
          "It is 'fixed in a salt solution'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Niépce coated his plate with a form of ______ that hardens in light.",
          "bitumen",
          "He coated a pewter plate with a form of bitumen that hardens where light falls on it, put the plate in a camera pointed at the view from an upper window, and left it there for many hours.",
          "He used 'a form of bitumen'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Talbot's process produced a ______, from which many prints could be made.",
          "negative",
          "His images were less sharp, but his process had a decisive advantage: it produced a negative, in which light and dark were reversed, and from a negative any number of positive prints could be made.",
          "It 'produced a negative'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Within two years, portrait ______ were opening in many cities.",
          "studios",
          "Within two years of the 1839 announcements, portrait studios were opening in European and American cities, and the exposure time had fallen from minutes to seconds as lenses improved and chemists found more sensitive preparations.",
          "'Portrait studios were opening'.",
        ),
      ],
    },
    {
      key: "t46-p2-space-solar",
      title: "Power from Above the Weather",
      topic: "the case for and against collecting solar energy in orbit",
      difficulty: 8,
      body: `A solar panel in orbit is in a better place than a solar panel on a roof. It is never rained on, never shaded by a cloud and, in the right orbit, never in darkness, so it produces power continuously rather than for a few hours of a variable day. Sunlight above the atmosphere is also more intense, and carries wavelengths that never reach the ground. A given panel in space collects several times the annual energy of the same panel in a temperate country. The engineering question is not whether the energy is there; it is whether it can be got down.

The proposed method is to convert the electricity into microwaves, transmit them to a receiving antenna on the ground, and convert them back. Microwaves at the frequencies considered pass through cloud and rain with little loss, which is the property that makes the scheme possible at all. The beam would be spread over a wide area — a receiving station might be a kilometre or more across, built as an open mesh with farmland beneath it — precisely so that its intensity stays low. Physicist Dr Ines Barros spends much of her time correcting the assumption that such a beam would be dangerous. "You could stand in it," she says. "The design intensity is comparable to standing near a mobile phone mast, and it has to be, because a tight beam would need an impossibly large antenna in orbit."

The obstacle has always been mass. Anything sent to orbit must be lifted there, and a station generating a useful amount of power would weigh thousands of tonnes. For decades this settled the argument: at the launch prices of the twentieth century, the electricity would have cost more than any customer could pay. Reusable rockets have changed the figure by an order of magnitude, and further reductions are promised. Space systems engineer Jonas Ritter argues that the economics still do not work at present prices. "Every study that closes the business case assumes a launch cost we have not reached," he says. "The physics has been fine for fifty years. It is a transport problem."

Assembly is the second difficulty. A structure of that size cannot be launched complete; it must be carried up in pieces and put together in orbit, which means either astronauts working for years or robots capable of building reliably without supervision. Several demonstration missions have tested robotic assembly of smaller structures, and the results have been encouraging rather than conclusive.

There has been genuine progress on the harder science. A small experiment flown in 2023 transmitted power wirelessly between parts of a satellite and directed a detectable beam towards a receiver on Earth — a tiny amount of energy, but the first demonstration of the principle from orbit. Ground tests have sent kilowatts over kilometres at useful efficiency. Engineering researcher Dr Amara Diallo regards these as important for a reason that is often missed. "The point is not the watts," she says. "It is that the pointing worked, because a beam that drifts is the thing everybody is afraid of."

Several governments have funded studies, and estimates of cost differ wildly, which usually indicates that the assumptions rather than the arithmetic are doing the work. Critics note that terrestrial solar and storage have become dramatically cheaper during the same decades in which orbital solar has remained a study, and that the comparison a new scheme must beat keeps improving. Energy analyst Professor Viktor Halasz puts the strategic case for continuing anyway. "Everything we have on the ground stops at night or when the wind drops," he says. "A source that does not is worth a great deal even if it is expensive, and nobody knows how expensive it will be until somebody builds one."

The remaining objections are practical rather than exotic. A station of that size would be a large object in a crowded orbit, requiring collision avoidance for decades. The receiving stations occupy substantial land, although they can share it with agriculture. And a system that concentrates a nation's power supply in a handful of structures in space raises questions about security that are usually answered with the observation that a power station on the ground is not hard to attack either.`,
      questions: [
        fromList(
          "matching_features",
          SOLAR_PEOPLE,
          "The transmitted beam would not be hazardous to people beneath it.",
          "Ines Barros",
          '"You could stand in it," she says. "The design intensity is comparable to standing near a mobile phone mast, and it has to be, because a tight beam would need an impossibly large antenna in orbit."',
          "Barros: 'You could stand in it.'",
        ),
        fromList(
          "matching_features",
          SOLAR_PEOPLE,
          "The scheme depends on launch costs that have not yet been achieved.",
          "Jonas Ritter",
          '"Every study that closes the business case assumes a launch cost we have not reached," he says.',
          "Ritter on the assumed launch cost.",
        ),
        fromList(
          "matching_features",
          SOLAR_PEOPLE,
          "The significance of the recent test lay in its accuracy rather than its output.",
          "Amara Diallo",
          '"The point is not the watts," she says. "It is that the pointing worked, because a beam that drifts is the thing everybody is afraid of."',
          "Diallo: 'the pointing worked'.",
        ),
        fromList(
          "matching_features",
          SOLAR_PEOPLE,
          "A continuous source is valuable even at a high price.",
          "Viktor Halasz",
          '"Everything we have on the ground stops at night or when the wind drops," he says. "A source that does not is worth a great deal even if it is expensive, and nobody knows how expensive it will be until somebody builds one."',
          "Halasz on the value of a source that never stops.",
        ),
        fromList(
          "matching_features",
          SOLAR_PEOPLE,
          "The difficulty is one of transport rather than of science.",
          "Jonas Ritter",
          '"The physics has been fine for fifty years. It is a transport problem."',
          "Ritter: 'It is a transport problem.'",
        ),
        fromList(
          "summary_completion",
          SOLAR_BANK,
          "A panel in the right ______ is never in darkness.",
          "orbit",
          "It is never rained on, never shaded by a cloud and, in the right orbit, never in darkness, so it produces power continuously rather than for a few hours of a variable day.",
          "'In the right orbit, never in darkness'.",
        ),
        fromList(
          "summary_completion",
          SOLAR_BANK,
          "Electricity would be converted into ______ for transmission.",
          "microwaves",
          "The proposed method is to convert the electricity into microwaves, transmit them to a receiving antenna on the ground, and convert them back.",
          "It is converted 'into microwaves'.",
        ),
        fromList(
          "summary_completion",
          SOLAR_BANK,
          "The ground ______ might be more than a kilometre across.",
          "receiver",
          "The beam would be spread over a wide area — a receiving station might be a kilometre or more across, built as an open mesh with farmland beneath it — precisely so that its intensity stays low.",
          "'A receiving station might be a kilometre or more across'.",
        ),
        fromList(
          "summary_completion",
          SOLAR_BANK,
          "The central obstacle has always been the ______ that must be lifted.",
          "mass",
          "The obstacle has always been mass.",
          "'The obstacle has always been mass.'",
        ),
        fromList(
          "summary_completion",
          SOLAR_BANK,
          "Falling ______ costs have changed the arithmetic by an order of magnitude.",
          "launch",
          "Reusable rockets have changed the figure by an order of magnitude, and further reductions are promised.",
          "Reusable rockets cut the launch cost.",
        ),
        fromList(
          "summary_completion",
          SOLAR_BANK,
          "Assembly in orbit would require astronauts or ______.",
          "robots",
          "A structure of that size cannot be launched complete; it must be carried up in pieces and put together in orbit, which means either astronauts working for years or robots capable of building reliably without supervision.",
          "'Either astronauts working for years or robots'.",
        ),
        pickTwo(
          SOLAR_STEM,
          SOLAR_ADVANTAGES,
          "A or C",
          "It is never rained on, never shaded by a cloud and, in the right orbit, never in darkness, so it produces power continuously rather than for a few hours of a variable day.",
          "A is given: no night, no weather.",
        ),
        pickTwo(
          SOLAR_STEM,
          SOLAR_ADVANTAGES,
          "A or C",
          "Sunlight above the atmosphere is also more intense, and carries wavelengths that never reach the ground.",
          "C is given: sunlight above the atmosphere 'is also more intense'. B, D and E are contradicted or unmentioned.",
        ),
      ],
    },
    {
      key: "t46-p3-origins-of-language",
      title: "The Problem with No Fossils",
      topic: "competing theories about how human language began",
      difficulty: 9,
      body: `A) In 1866 the Linguistic Society of Paris banned papers on the origin of language. The subject had produced so much unfalsifiable speculation — theories deriving speech from imitation of animal cries, from cries of pain, from work songs — that the society concluded nothing useful could be said. The ban was not lifted so much as quietly ignored, and the field returned in the late twentieth century with better tools: genetics, comparative primate cognition, archaeology and the study of sign languages. The fundamental difficulty, however, has not changed. Speech leaves no fossils.

B) What can be dated are proxies, and each is contested. The vocal tract of an extinct human relative can be partly reconstructed from the skull and the position of the hyoid bone, but the anatomy that permits speech is not the same as the neural control that produces it, and parrots manage complex vocal imitation with an entirely different apparatus. Genetics offers candidate genes, one of which, when mutated, produces severe difficulties with speech and grammar in the family where it was identified; it is present in an archaic form in Neanderthals. Linguist Professor Teresa Molnar warns against reading too much into any single line. "Every proxy we have is necessary for language and sufficient for nothing," she says.

C) Archaeology supplies a different kind of argument. Structured behaviour that is hard to imagine without communication — shell beads worn as ornament, pigments processed in stages, tools whose manufacture requires a sequence of steps taught rather than copied, ocean crossings that required planning — appears in Africa well before one hundred thousand years ago and becomes common afterwards. Whether such behaviour requires full syntactic language, or merely a rich system of shared signals, is exactly the question at issue.

D) The theoretical arguments divide roughly into two camps. One holds that language appeared relatively suddenly, through a change in the brain that allowed elements to be combined hierarchically, with communication as a later use of a capacity that arose for thought. On this account language is a system of unlimited combination bolted onto an older signalling ability. Archaeologist Dr Aditya Rao regards the sudden account as the weaker of the two. "A single mutation producing grammar is an appealing story," he says, "and it has the characteristic weakness of appealing stories, which is that nothing would look different if it were false."

E) The other camp treats language as the outcome of a long process of gradual elaboration, driven by the demands of social life among animals that co-operate, deceive, teach and negotiate. On this view the precursors are visible in living primates: alarm calls with distinct referents, gestures used flexibly and with attention to whether the audience is looking, and rudimentary turn-taking. Comparative psychologist Dr Sofie Berg studies gestural communication in apes and finds the continuity persuasive. "We keep discovering that things we thought were uniquely human are present in some form," she says. "Not language, but the parts language would need."

F) A related debate concerns the channel. Several researchers argue that language began in gesture rather than in voice, pointing to the ease with which apes learn manual signs compared with vocal ones, the involvement of the same brain regions in speech and in sign, and the fact that deaf children denied a language will invent a structured sign system among themselves. Critics reply that a gestural origin has the awkward property of requiring an unexplained switch to speech, and that the two probably developed together, with voice taking over as hands became busy carrying and making.

G) What has changed most is the standard of evidence people are willing to accept. Nobody expects a decisive answer; the question is which accounts can be constrained, and by what. Computational models now test whether a signalling system with particular properties can become structured through repeated learning by successive generations, and laboratory experiments in which people invent communication systems under constraints produce structure remarkably quickly. Linguist Dr Malik Toure sees this as the field's real advance. "We have moved from telling stories about the past to running experiments about the mechanism," he says. "That does not tell us what happened. It tells us what could have happened, which is the most the evidence will ever allow."`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a decision taken because a subject had generated too much speculation",
          "A",
          "The subject had produced so much unfalsifiable speculation — theories deriving speech from imitation of animal cries, from cries of pain, from work songs — that the society concluded nothing useful could be said.",
          "Paragraph A: the 1866 ban.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the point that anatomy alone does not establish a capacity",
          "B",
          "The vocal tract of an extinct human relative can be partly reconstructed from the skull and the position of the hyoid bone, but the anatomy that permits speech is not the same as the neural control that produces it, and parrots manage complex vocal imitation with an entirely different apparatus.",
          "Paragraph B: anatomy is not neural control.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a list of ancient behaviours that suggest communication",
          "C",
          "Structured behaviour that is hard to imagine without communication — shell beads worn as ornament, pigments processed in stages, tools whose manufacture requires a sequence of steps taught rather than copied, ocean crossings that required planning — appears in Africa well before one hundred thousand years ago and becomes common afterwards.",
          "Paragraph C lists the archaeological signs.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an objection based on what deaf children do without instruction",
          "F",
          "Several researchers argue that language began in gesture rather than in voice, pointing to the ease with which apes learn manual signs compared with vocal ones, the involvement of the same brain regions in speech and in sign, and the fact that deaf children denied a language will invent a structured sign system among themselves.",
          "Paragraph F: deaf children invent sign systems.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of experiments in which people create new systems of communication",
          "G",
          "Computational models now test whether a signalling system with particular properties can become structured through repeated learning by successive generations, and laboratory experiments in which people invent communication systems under constraints produce structure remarkably quickly.",
          "Paragraph G: the laboratory experiments.",
        ),
        fromList(
          "matching_features",
          LANGUAGE_PEOPLE,
          "No single piece of evidence can establish that language was present.",
          "Teresa Molnar",
          '"Every proxy we have is necessary for language and sufficient for nothing," she says.',
          "Molnar: necessary but not sufficient.",
        ),
        fromList(
          "matching_features",
          LANGUAGE_PEOPLE,
          "An explanation that nothing could contradict is a weak one.",
          "Aditya Rao",
          '"A single mutation producing grammar is an appealing story," he says, "and it has the characteristic weakness of appealing stories, which is that nothing would look different if it were false."',
          "Rao on unfalsifiable stories.",
        ),
        fromList(
          "matching_features",
          LANGUAGE_PEOPLE,
          "Components of language keep turning up in other species.",
          "Sofie Berg",
          '"We keep discovering that things we thought were uniquely human are present in some form," she says. "Not language, but the parts language would need."',
          "Berg: 'the parts language would need'.",
        ),
        fromList(
          "matching_features",
          LANGUAGE_PEOPLE,
          "The field has shifted from narrative to experiment.",
          "Malik Toure",
          '"We have moved from telling stories about the past to running experiments about the mechanism," he says.',
          "Toure on the shift to experiment.",
        ),
        fromList(
          "matching_features",
          LANGUAGE_PEOPLE,
          "Evidence can show what was possible, not what occurred.",
          "Malik Toure",
          '"That does not tell us what happened. It tells us what could have happened, which is the most the evidence will ever allow."',
          "Toure: what could have happened.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The central difficulty is that speech leaves no ______.",
          "fossils",
          "Speech leaves no fossils.",
          "'Speech leaves no fossils.'",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "A gene associated with speech difficulties is found in an archaic form in ______.",
          "Neanderthals",
          "Genetics offers candidate genes, one of which, when mutated, produces severe difficulties with speech and grammar in the family where it was identified; it is present in an archaic form in Neanderthals.",
          "It is 'present in an archaic form in Neanderthals'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "On the sudden account, combination was bolted onto an older ______ ability.",
          "signalling",
          "On this account language is a system of unlimited combination bolted onto an older signalling ability.",
          "It was bolted onto 'an older signalling ability'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Critics of the gestural theory say it requires an unexplained ______ to speech.",
          "switch",
          "Critics reply that a gestural origin has the awkward property of requiring an unexplained switch to speech, and that the two probably developed together, with voice taking over as hands became busy carrying and making.",
          "It requires 'an unexplained switch to speech'.",
        ),
      ],
    },
  ],
};
