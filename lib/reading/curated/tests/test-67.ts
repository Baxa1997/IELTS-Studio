import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · art history and analysis · notes box -----------------------

const COLOUR_NOTES = {
  title: "Techniques for recovering the colour",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · metrology · people and a word bank ------------------------

const MASS_PEOPLE = ["Margarethe Voss", "Ibrahim Çelik", "Nina Holloway", "Taro Igarashi"];
const MASS_BANK = [
  "prototype",
  "copies",
  "Planck",
  "coil",
  "sphere",
  "lattice",
  "gravity",
  "isotope",
  "micrograms",
];

// ---- Passage 3 · how science is checked · lettered paragraphs ---------------

const REVIEW_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const REVIEW_ENDINGS = [
  "because a referee reads an account of the work rather than the work.",
  "although the errors were placed in the manuscript for them to find.",
  "which is why fabrication is usually exposed by somebody other than a referee.",
  "since the people competent to judge a paper are working on the same problem.",
  "because the filter is only one of several mechanisms that test a claim.",
  "which the writer regards as a claim the procedure was never able to support.",
  "even though agreement between two referees is little better than chance.",
];

export const TEST_67: CuratedTest = {
  key: "full-test-67",
  targetBand: 8,
  passages: [
    {
      key: "t67-p1-painted-statues",
      title: "The Statues Were Never White",
      topic: "how classical sculpture lost its colour, and how it is being recovered",
      difficulty: 7,
      body: `The marble sculpture of the Greek and Roman world is one of the few things about antiquity whose appearance almost everybody believes they know. It is white, and its whiteness is understood to express something: restraint, clarity, a preference for form over decoration. Almost none of this is true. The sculpture was painted, often in strong and unmixed colours, and the pigment has been known about for as long as the objects have been systematically excavated.

The evidence was never hidden. Excavators in the eighteenth century recorded traces of colour on statues as they came out of the ground and complained when it faded within weeks of exposure. Ancient authors describe the painting of sculpture as an ordinary craft with its own specialists, and a Greek word existed for the person who did it. Some surviving pieces retain visible pigment even now, and the archaic figures buried in a fill on the Athenian Acropolis, sealed from light for two and a half thousand years, came up with their patterns largely intact.

What happened instead is that the evidence was recorded and then declined. The eighteenth-century scholarship that established classical art as a subject of study was committed to an account in which Greek sculpture represented a purity later art had lost, and colour did not fit it. Johann Joachim Winckelmann, whose influence on the field was greater than anybody's, argued that the whiteness of a body increased its beauty and that colour was a subordinate consideration. He had seen coloured fragments; he treated them as exceptional rather than as normal. The museums being assembled at the same time cleaned their acquisitions, sometimes aggressively, and in more than one documented case the surviving pigment was scrubbed off in order to produce the appearance the audience expected.

Recovering what the colours actually were is a technical problem rather than a matter of interpretation, and most of the techniques used are non-destructive. Raking light across a surface at a very shallow angle reveals differences in weathering, because painted areas erode at a different rate from bare stone, so a pattern can be read as relief even where no pigment remains. Ultraviolet illumination makes certain organic binders fluoresce. X-ray fluorescence identifies the metals in inorganic pigments, distinguishing the copper of Egyptian blue from the iron of a red ochre or the mercury of cinnabar. Egyptian blue is particularly useful, because it emits in the infrared when stimulated with visible light, and a camera filtered for that wavelength will show a blue the eye cannot see at all.

The reconstructions that result have not been universally welcomed, and some of the objection is reasonable. A reconstruction states more than the evidence supports: the analysis establishes which pigment lay where, but not how it was applied, how many layers there were, whether it was glazed, or how the surface behaved in the light it was made for. A flat acrylic version of a red identified as cinnabar may be the right pigment and quite the wrong object. The painted casts that have toured museums since the early 2000s look garish partly because ancient painting was bold and partly because the method of reproducing it is cruder than the original.

The more interesting consequence is what the colour tells us about what sculpture was for. A figure whose eyes, hair, lips, skin, clothing and weapons are distinguished by colour is legible at a distance in a way a white figure is not: the viewer can see immediately who is a god, who is a foreigner, which garment is which, where a wound is. A great deal of what specialists now reconstruct by iconographic argument would have been obvious to any ancient viewer, because it was written on the surface in paint. The whiteness that later readers took for restraint was in fact the removal of most of the information the object originally carried.

The afterlife of the misunderstanding is harder to write about and matters more than the art history. The idea that classical sculpture was white, and that its whiteness was a mark of excellence, was absorbed into nineteenth-century accounts that ranked peoples by their supposed proximity to that ideal, and it has been recruited repeatedly since by movements wanting an antiquity of a particular complexion. The correction is not a matter of taste. It removes a piece of evidence that was never evidence.

None of this means the field concealed anything. The material was published, the traces were catalogued, and a minority of scholars insisted on the point throughout. What the episode demonstrates is subtler and more common: that a discipline can hold a fact in its literature and still not believe it, because the fact does not fit the story the discipline is organised around, and that the correction arrives when a technique makes the fact impossible to keep marginal.`,
      questions: [
        tfng(
          "Traces of pigment on excavated sculpture were first noticed in recent decades.",
          "FALSE",
          "Excavators in the eighteenth century recorded traces of colour on statues as they came out of the ground and complained when it faded within weeks of exposure.",
          "Eighteenth-century excavators already recorded it.",
        ),
        tfng(
          "Greek had a term for the person who painted sculpture.",
          "TRUE",
          "Ancient authors describe the painting of sculpture as an ordinary craft with its own specialists, and a Greek word existed for the person who did it.",
          "'A Greek word existed for the person who did it'.",
        ),
        tfng(
          "Winckelmann did not know that coloured fragments existed.",
          "FALSE",
          "He had seen coloured fragments; he treated them as exceptional rather than as normal.",
          "He had seen them and set them aside.",
        ),
        tfng(
          "Some museums removed surviving paint from sculptures they had acquired.",
          "TRUE",
          "The museums being assembled at the same time cleaned their acquisitions, sometimes aggressively, and in more than one documented case the surviving pigment was scrubbed off in order to produce the appearance the audience expected.",
          "The pigment 'was scrubbed off'.",
        ),
        tfng(
          "Most of the analytical methods now used damage the surface examined.",
          "FALSE",
          "Recovering what the colours actually were is a technical problem rather than a matter of interpretation, and most of the techniques used are non-destructive.",
          "Most are 'non-destructive'.",
        ),
        tfng(
          "The painted reconstructions are more popular with the public than with specialists.",
          "NOT GIVEN",
          "",
          "The passage compares nothing about the two audiences' reactions.",
        ),
        tfng(
          "A minority of scholars continued to argue that the sculpture had been painted.",
          "TRUE",
          "The material was published, the traces were catalogued, and a minority of scholars insisted on the point throughout.",
          "A minority 'insisted on the point throughout'.",
        ),
        noteLine(
          COLOUR_NOTES,
          null,
          "Light at a shallow angle reveals differences in ______",
          "weathering",
          "Raking light across a surface at a very shallow angle reveals differences in weathering, because painted areas erode at a different rate from bare stone, so a pattern can be read as relief even where no pigment remains.",
          "It reveals 'differences in weathering'.",
          { before: [{ text: "Most of these leave the surface untouched:", indent: 0 }] },
        ),
        noteLine(
          COLOUR_NOTES,
          null,
          "Ultraviolet light makes certain organic ______ fluoresce",
          "binders",
          "Ultraviolet illumination makes certain organic binders fluoresce.",
          "It makes 'organic binders fluoresce'.",
        ),
        noteLine(
          COLOUR_NOTES,
          null,
          "X-ray fluorescence identifies the ______ in inorganic pigments",
          "metals",
          "X-ray fluorescence identifies the metals in inorganic pigments, distinguishing the copper of Egyptian blue from the iron of a red ochre or the mercury of cinnabar.",
          "It identifies 'the metals in inorganic pigments'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Stimulated by visible light, Egyptian blue emits in the ______.",
          "infrared",
          "Egyptian blue is particularly useful, because it emits in the infrared when stimulated with visible light, and a camera filtered for that wavelength will show a blue the eye cannot see at all.",
          "It 'emits in the infrared'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Archaic figures buried on the Athenian ______ kept their patterns.",
          "Acropolis",
          "Some surviving pieces retain visible pigment even now, and the archaic figures buried in a fill on the Athenian Acropolis, sealed from light for two and a half thousand years, came up with their patterns largely intact.",
          "They were buried on the Athenian Acropolis.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Colour made a figure readable at a ______ as a white one is not.",
          "distance",
          "A figure whose eyes, hair, lips, skin, clothing and weapons are distinguished by colour is legible at a distance in a way a white figure is not: the viewer can see immediately who is a god, who is a foreigner, which garment is which, where a wound is.",
          "It is 'legible at a distance'.",
        ),
      ],
    },
    {
      key: "t67-p2-kilogram-redefinition",
      title: "Weighing the World Without a Weight",
      topic: "how the last physical standard of measurement was replaced by a constant",
      difficulty: 8,
      body: `Until 2019 the kilogram was a cylinder. A piece of platinum-iridium alloy about the size of a plum, made in 1889 and kept in a vault outside Paris under three nested bell jars, was the kilogram by definition: not a very good copy of it, but the thing itself. Anything weighed anywhere in the world was ultimately compared with that object through a chain of calibrated copies, and if the cylinder had changed, the unit would have changed with it, because there was nothing else for it to be measured against.

It appears to have changed. The international prototype was weighed against its official copies at intervals over the following century, and the copies drifted relative to it by a few tens of micrograms — roughly the mass of a fingerprint. Which of them had changed was unanswerable in principle. Margarethe Voss, a metrologist who has written on the history of the artefact, makes the point that a definition based on a single object cannot detect its own error: the prototype was a kilogram by fiat, so by construction it could not be wrong, and any drift had to be attributed to everything else.

The other base units had already escaped this problem. The metre was redefined in 1983 in terms of the distance light travels in a fixed fraction of a second, which is a definition anybody with the right equipment can realise anywhere without reference to a bar in a vault. The second is defined by a frequency of caesium. Ibrahim Çelik, who works on the dissemination of standards to national laboratories, observes that the practical advantage of such definitions is not accuracy but independence: a laboratory in one country no longer needs the cooperation of a laboratory in another to know what its units are.

Fixing the kilogram meant choosing a constant of nature and defining the unit in terms of it. The constant chosen was the Planck constant, which relates the energy of a photon to its frequency and is expressed in units that include mass. Its numerical value was fixed by decree at the best experimentally determined figure, and the kilogram became whatever mass is consistent with that number. The logic is inverted from what an outsider expects: the constant is no longer measured, because it is now exact by definition, and mass is measured instead.

Two very different experiments had to agree before the change could be made, which was the condition the committee set. The Kibble balance measures mass electrically. A coil in a magnetic field carries a current that produces a force balancing the weight of the object, and the same coil is then moved through the field at a measured velocity to determine the field strength from the voltage induced. Nina Holloway, who has built one, describes the instrument as two experiments sharing a magnet, and notes that the difficult part is not the electrical measurement but knowing the local acceleration of gravity to a sufficient precision, which requires its own apparatus in the same room.

The second route counts atoms. A sphere of silicon enriched in a single isotope is polished until it is round to within a few tens of nanometres, its diameter is measured by interferometry, and the spacing of its crystal lattice is measured by X-ray diffraction, which together give the number of atoms it contains. Taro Igarashi, who has worked on the spheres, points out that the roundness matters less for its own sake than for the volume calculation, and that the hardest step was producing silicon pure enough in one isotope that the average atomic mass was not itself a source of uncertainty. The two methods agreed to within a few parts in a hundred million, and the redefinition followed.

Nothing changed for anybody buying vegetables. The redefinition was designed to be continuous: the new kilogram was chosen to be as close to the old cylinder as the measurements could make it, and no shop scale needed adjusting. What changed is what happens at the extremes. Before, the uncertainty of a very small mass measurement grew as it moved away from a kilogram, because everything was traced to a one-kilogram object. Now a laboratory can realise the unit at whatever scale it needs, which matters for pharmaceutical quantities measured in micrograms.

The cylinder is still in its vault. It is no longer the kilogram, but it is an unusually well-documented object whose mass is now a quantity that can be measured and can, in principle, be found to have changed. That inversion is the whole content of the reform. A standard that could not be wrong has been replaced by one that can be checked, and the object that used to define the unit has become an ordinary thing to be weighed.`,
      questions: [
        fromList(
          "matching_features",
          MASS_PEOPLE,
          "A definition resting on one object cannot reveal its own error.",
          "Margarethe Voss",
          "Margarethe Voss, a metrologist who has written on the history of the artefact, makes the point that a definition based on a single object cannot detect its own error: the prototype was a kilogram by fiat, so by construction it could not be wrong, and any drift had to be attributed to everything else.",
          "Voss identifies the circularity.",
        ),
        fromList(
          "matching_features",
          MASS_PEOPLE,
          "The real gain from defining a unit by a constant is independence.",
          "Ibrahim Çelik",
          "Ibrahim Çelik, who works on the dissemination of standards to national laboratories, observes that the practical advantage of such definitions is not accuracy but independence: a laboratory in one country no longer needs the cooperation of a laboratory in another to know what its units are.",
          "Çelik names independence as the advantage.",
        ),
        fromList(
          "matching_features",
          MASS_PEOPLE,
          "The limiting difficulty in one instrument is a measurement of gravity.",
          "Nina Holloway",
          "Nina Holloway, who has built one, describes the instrument as two experiments sharing a magnet, and notes that the difficult part is not the electrical measurement but knowing the local acceleration of gravity to a sufficient precision, which requires its own apparatus in the same room.",
          "Holloway names gravity as the hard part.",
        ),
        fromList(
          "matching_features",
          MASS_PEOPLE,
          "The hardest step in the other route was achieving isotopic purity.",
          "Taro Igarashi",
          "Taro Igarashi, who has worked on the spheres, points out that the roundness matters less for its own sake than for the volume calculation, and that the hardest step was producing silicon pure enough in one isotope that the average atomic mass was not itself a source of uncertainty.",
          "Igarashi names the purity of the silicon.",
        ),
        fromList(
          "summary_completion",
          MASS_BANK,
          "The official ______ drifted against the artefact by tens of micrograms.",
          "copies",
          "The international prototype was weighed against its official copies at intervals over the following century, and the copies drifted relative to it by a few tens of micrograms — roughly the mass of a fingerprint.",
          "The copies drifted relative to it.",
        ),
        fromList(
          "summary_completion",
          MASS_BANK,
          "The unit is now fixed by an exact value of the ______ constant.",
          "Planck",
          "The constant chosen was the Planck constant, which relates the energy of a photon to its frequency and is expressed in units that include mass.",
          "The constant chosen was Planck's.",
        ),
        fromList(
          "summary_completion",
          MASS_BANK,
          "In one instrument a current through a ______ produces a balancing force.",
          "coil",
          "A coil in a magnetic field carries a current that produces a force balancing the weight of the object, and the same coil is then moved through the field at a measured velocity to determine the field strength from the voltage induced.",
          "A coil carries the current.",
        ),
        fromList(
          "summary_completion",
          MASS_BANK,
          "The other method uses a polished silicon ______.",
          "sphere",
          "A sphere of silicon enriched in a single isotope is polished until it is round to within a few tens of nanometres, its diameter is measured by interferometry, and the spacing of its crystal lattice is measured by X-ray diffraction, which together give the number of atoms it contains.",
          "It uses a polished sphere of silicon.",
        ),
        fromList(
          "summary_completion",
          MASS_BANK,
          "X-ray diffraction measures the spacing of its crystal ______.",
          "lattice",
          "A sphere of silicon enriched in a single isotope is polished until it is round to within a few tens of nanometres, its diameter is measured by interferometry, and the spacing of its crystal lattice is measured by X-ray diffraction, which together give the number of atoms it contains.",
          "Diffraction gives the lattice spacing.",
        ),
        mcq(
          "What was the status of the platinum-iridium cylinder before 2019?",
          [
            "It was the kilogram rather than a copy of one",
            "It was one of several equally valid standards",
            "It was recalibrated against a constant each decade",
            "It served as a reference for scientific work only",
          ],
          "It was the kilogram rather than a copy of one",
          "A piece of platinum-iridium alloy about the size of a plum, made in 1889 and kept in a vault outside Paris under three nested bell jars, was the kilogram by definition: not a very good copy of it, but the thing itself.",
          "It was 'the thing itself'.",
        ),
        mcq(
          "How is the Planck constant now treated?",
          [
            "As exact by definition and no longer measured",
            "As a quantity remeasured every few years",
            "As an approximation derived from the cylinder",
            "As one of several competing candidates",
          ],
          "As exact by definition and no longer measured",
          "The logic is inverted from what an outsider expects: the constant is no longer measured, because it is now exact by definition, and mass is measured instead.",
          "It is 'now exact by definition'.",
        ),
        mcq(
          "What condition did the committee impose before redefining the unit?",
          [
            "Two unlike experiments had to agree",
            "The cylinder had to be destroyed",
            "Every national laboratory had to build a balance",
            "The cause of the drift had to be explained",
          ],
          "Two unlike experiments had to agree",
          "Two very different experiments had to agree before the change could be made, which was the condition the committee set.",
          "That agreement 'was the condition the committee set'.",
        ),
        mcq(
          "What practical difference does the new definition make?",
          [
            "Very small masses can be realised more accurately",
            "Shop scales had to be recalibrated",
            "The unit became very slightly heavier",
            "Calibration copies are no longer used at all",
          ],
          "Very small masses can be realised more accurately",
          "Now a laboratory can realise the unit at whatever scale it needs, which matters for pharmaceutical quantities measured in micrograms.",
          "The unit can be realised at any scale.",
        ),
      ],
    },
    {
      key: "t67-p3-peer-review",
      title: "What a Referee Cannot See",
      topic: "how much weight the refereeing of scientific papers can actually carry",
      difficulty: 9,
      body: `A) Peer review is the procedure by which a journal sends a submitted manuscript to two or three people working in the same area and publishes it, or does not, partly on the strength of what they say. It is treated, inside science and outside it, as the line separating a finding from an opinion — the thing that is meant when a claim is described as peer-reviewed. It is worth being precise about what the procedure actually does, because the weight placed on it is considerable and the design is not obviously equal to it.

B) The historical case for modesty is simply that the practice is recent. Journals published for two centuries without anything resembling systematic external refereeing; editors decided, sometimes with advice and often without. The most consequential papers of the early twentieth century were not refereed in the modern sense, and at least one celebrated author is known to have withdrawn a paper in indignation on discovering that it had been sent to somebody else for comment. Whatever peer review guarantees, it cannot be the thing that made the preceding two hundred years of science possible.

C) What a referee can do well is bounded by what a manuscript contains. A referee reads a description of an experiment, not the experiment. They can judge whether the method described would support the conclusion drawn, whether the statistics are appropriate to the design, whether the relevant literature has been engaged and whether the claims exceed the data. These are real and valuable checks, and papers are materially improved by them. What a referee cannot do is determine whether the experiment was performed as described, whether the sample was what it is said to have been, or whether the numbers in the table are the numbers that came out of the instrument. Detecting fabrication is not within the reach of the method, and the cases that have come to light have almost all been found by collaborators, by readers attempting to build on the work, or by institutions acting on a complaint.

D) The empirical literature on refereeing is not encouraging and is rarely cited by the practice's defenders. Studies in which deliberate errors are inserted into a manuscript before it is sent out find that referees identify a minority of them. Agreement between two referees on the same paper is, across a range of fields, only modestly better than chance. Resubmission experiments — sending an already published paper back to the journal that published it, with the authors' names changed — have produced rejection more often than recognition. None of these results shows that refereeing is useless; all of them show that it is noisy, and noise in a filter means errors of both kinds.

E) There is a further problem that the design creates rather than fails to solve. A referee is by definition a competitor: the people qualified to assess a paper are the people working on the same question, and they are anonymous to the author while the author is usually known to them. That asymmetry invites a set of behaviours — delay, demands for citation, discouragement of a result that would undercut one's own — which are impossible to distinguish from rigour in any individual case. I do not think this is common, and I am not persuaded by accounts that treat it as the main story. But a system whose incentives can only be policed by the goodwill of the people inside it should not be described as a safeguard.

F) The defences usually offered seem to me to miss what is at stake. It is said that peer review is the best available system, which may well be true and is not an answer to the question of how much weight it can carry. It is said that the alternative is chaos, which assumes that the filter is the only mechanism operating, and it is not: replication, citation, meta-analysis, retraction and the slow accumulation of failed attempts to build on a result do far more to establish whether a finding survives than any referee can.

G) My own view is that the phrase peer-reviewed should be understood as a statement about process and not about truth, and that almost every public use of it makes the opposite claim. A refereed paper has been read by two or three people who thought it worth publishing. That is a weak guarantee, it is the guarantee the procedure was designed to give, and treating it as a stronger one damages the credibility of the whole apparatus each time a refereed result later fails. The problem is not that peer review is broken. It is that it is being asked to certify something it was never able to inspect.`,
      questions: [
        fromList(
          "matching_information",
          REVIEW_PARAGRAPHS,
          "evidence that referees miss most of the faults planted for them",
          "D",
          "Studies in which deliberate errors are inserted into a manuscript before it is sent out find that referees identify a minority of them.",
          "Paragraph D reports the planted-error studies.",
        ),
        fromList(
          "matching_information",
          REVIEW_PARAGRAPHS,
          "a list of the judgements a referee is well placed to make",
          "C",
          "They can judge whether the method described would support the conclusion drawn, whether the statistics are appropriate to the design, whether the relevant literature has been engaged and whether the claims exceed the data.",
          "Paragraph C sets out what a referee can do.",
        ),
        fromList(
          "matching_information",
          REVIEW_PARAGRAPHS,
          "mechanisms other than refereeing that test whether a result survives",
          "F",
          "It is said that the alternative is chaos, which assumes that the filter is the only mechanism operating, and it is not: replication, citation, meta-analysis, retraction and the slow accumulation of failed attempts to build on a result do far more to establish whether a finding survives than any referee can.",
          "Paragraph F lists the other mechanisms.",
        ),
        fromList(
          "matching_information",
          REVIEW_PARAGRAPHS,
          "an argument drawn from the period before the practice existed",
          "B",
          "Journals published for two centuries without anything resembling systematic external refereeing; editors decided, sometimes with advice and often without.",
          "Paragraph B makes the historical argument.",
        ),
        fromList(
          "matching_information",
          REVIEW_PARAGRAPHS,
          "a conflict of interest the arrangement necessarily produces",
          "E",
          "A referee is by definition a competitor: the people qualified to assess a paper are the people working on the same question, and they are anonymous to the author while the author is usually known to them.",
          "Paragraph E identifies the built-in conflict.",
        ),
        ynng(
          "The writer believes peer review is responsible for the reliability of earlier science.",
          "NO",
          "Whatever peer review guarantees, it cannot be the thing that made the preceding two hundred years of science possible.",
          "It 'cannot be the thing' that did so.",
        ),
        ynng(
          "The writer accepts that refereeing improves the papers it examines.",
          "YES",
          "These are real and valuable checks, and papers are materially improved by them.",
          "Papers are 'materially improved by them'.",
        ),
        ynng(
          "The writer regards misconduct by referees as the central problem.",
          "NO",
          "I do not think this is common, and I am not persuaded by accounts that treat it as the main story.",
          "The writer rejects it as 'the main story'.",
        ),
        ynng(
          "The writer holds that the term peer-reviewed is generally misused in public.",
          "YES",
          "My own view is that the phrase peer-reviewed should be understood as a statement about process and not about truth, and that almost every public use of it makes the opposite claim.",
          "Public use 'makes the opposite claim'.",
        ),
        fromList(
          "matching_sentence_endings",
          REVIEW_ENDINGS,
          "A referee cannot establish that an experiment happened as described,",
          "because a referee reads an account of the work rather than the work.",
          "A referee reads a description of an experiment, not the experiment.",
          "Only the description is available.",
        ),
        fromList(
          "matching_sentence_endings",
          REVIEW_ENDINGS,
          "Invented data comes to light through other routes,",
          "which is why fabrication is usually exposed by somebody other than a referee.",
          "Detecting fabrication is not within the reach of the method, and the cases that have come to light have almost all been found by collaborators, by readers attempting to build on the work, or by institutions acting on a complaint.",
          "Collaborators and readers find it.",
        ),
        fromList(
          "matching_sentence_endings",
          REVIEW_ENDINGS,
          "Referees detect only some of the faults in a test manuscript,",
          "although the errors were placed in the manuscript for them to find.",
          "Studies in which deliberate errors are inserted into a manuscript before it is sent out find that referees identify a minority of them.",
          "The errors were inserted deliberately.",
        ),
        fromList(
          "matching_sentence_endings",
          REVIEW_ENDINGS,
          "Anonymity sits alongside a conflict that cannot be designed out,",
          "since the people competent to judge a paper are working on the same problem.",
          "A referee is by definition a competitor: the people qualified to assess a paper are the people working on the same question, and they are anonymous to the author while the author is usually known to them.",
          "The competent judges are the competitors.",
        ),
        fromList(
          "matching_sentence_endings",
          REVIEW_ENDINGS,
          "The claim that abandoning refereeing would mean chaos is too quick,",
          "because the filter is only one of several mechanisms that test a claim.",
          "It is said that the alternative is chaos, which assumes that the filter is the only mechanism operating, and it is not: replication, citation, meta-analysis, retraction and the slow accumulation of failed attempts to build on a result do far more to establish whether a finding survives than any referee can.",
          "The filter is not the only mechanism.",
        ),
      ],
    },
  ],
};
