import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · historical linguistics · notes box -------------------------

const NAME_NOTES = {
  title: "Traps in reading a place name",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · physics · people and a word bank --------------------------

const WAVE_PEOPLE = ["Ileana Costa", "Bo-ram Shin", "Aurelio Fanti", "Nadia Kestenbaum"];
const WAVE_BANK = [
  "interferometer",
  "pendulums",
  "vacuum",
  "photons",
  "coincidence",
  "spectrum",
  "seismic",
  "gold",
  "formation",
];

// ---- Passage 3 · psychology and law · lettered paragraphs ------------------

const LIE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const LIE_ENDINGS = [
  "because arousal is not the same thing as deception.",
  "although the ground truth in the field is usually a confession.",
  "which is why most of the people a screening test accuses are innocent.",
  "since a person may recognise a photograph they saw in a newspaper.",
  "because the device works just as well when it is not plugged in.",
  "which the writer thinks no improvement in the sensors can address.",
  "even though the laboratory figures reach eighty or ninety per cent.",
];

export const TEST_78: CuratedTest = {
  key: "full-test-78",
  targetBand: 8,
  passages: [
    {
      key: "t78-p1-place-names",
      title: "The History Kept in Place Names",
      topic: "what the names of places can and cannot establish about who lived there",
      difficulty: 7,
      body: `A place name is a piece of evidence that has been transmitted orally, sometimes for two thousand years, by people who mostly did not know what it meant. That combination makes it unusually valuable and unusually easy to misuse.

The value comes from persistence. A settlement can be destroyed, its population replaced and its language forgotten, and the name will often survive, because the incoming population learns it from whoever is still there and has no reason to invent a new one. Names of large rivers are the most durable of all: several in western Europe cannot be explained from any language known to have been spoken in the region, and are presumed to descend from something spoken before the arrival of the languages we can reconstruct.

The commonest use of the evidence is to map a settlement that left few objects behind. In eastern England the distribution of names ending in particular elements — one meaning a farmstead, another a village — tracks the areas of Scandinavian settlement in the ninth and tenth centuries closely enough to draw a boundary. Where the names and the written sources disagree, the disagreement is informative rather than embarrassing: names are laid down by the people who farm a place, and charters are written by the people who claim it.

The names also record what a landscape used to be. An element meaning a clearing in woodland, found in a district with no trees, indicates woodland that has gone; an element meaning a marsh indicates drainage. A group of names describing a stand of a particular species can establish that the species was present when the name was given, which occasionally settles a question about past distribution that pollen evidence leaves open. A great deal of what is known about the former extent of woodland in England comes from reasoning of this kind.

The pitfalls are substantial, and the discipline has spent a century learning them. The first is that a name's present spelling is almost worthless as evidence: names have been respelled by clerks, by map-makers and by fashion, and a name that now looks transparently like two English words may descend from something quite unrelated. The rule is that the earliest recorded forms govern the interpretation, and a name first written down in the sixteenth century is much weaker evidence than one written in the tenth.

The second pitfall is that people rename things in order to explain them. A name whose meaning has become opaque tends to be reshaped into something that makes sense, and a story is then generated to account for the new form. Places have been renamed after saints who never went there and battles that happened elsewhere, and the invented explanation is sometimes recorded early enough to look respectable.

The third is the most serious, and it concerns transfer. Settlers carry names with them, so a name in one place may have no relationship to its landscape at all and simply record where somebody came from. Whole regions of the Americas and Australia are named this way. The same process operated in Europe, which means the presence of a name of a particular linguistic origin is evidence of contact and not necessarily of settlement, and the distinction between the two has been argued over for as long as the field has existed.

There is a further limitation worth stating plainly. A name tells you what a place was called by the people who named it, and that group may have been a minority. In the eastern English case the debate about whether the names indicate a large migration or a small aristocracy imposing its language on an existing population has run for fifty years and is not settled by the names, because the names are equally consistent with both. Genetic evidence has recently been brought in and has complicated rather than resolved it.

What the field is good for, when done carefully, is a particular kind of question: not who lived here, which it cannot answer, but what language was being spoken by the people who made the everyday decisions about land. That is a narrower claim and a reliable one, and most of the errors in the popular use of place names come from expanding it into the larger question it resembles.`,
      questions: [
        tfng(
          "The people who passed these names on generally understood them.",
          "FALSE",
          "A place name is a piece of evidence that has been transmitted orally, sometimes for two thousand years, by people who mostly did not know what it meant.",
          "They 'mostly did not know what it meant'.",
        ),
        tfng(
          "Some western European river names cannot be traced to any known language.",
          "TRUE",
          "Names of large rivers are the most durable of all: several in western Europe cannot be explained from any language known to have been spoken in the region, and are presumed to descend from something spoken before the arrival of the languages we can reconstruct.",
          "Several 'cannot be explained from any language known'.",
        ),
        tfng(
          "Name evidence and written records always point the same way.",
          "FALSE",
          "Where the names and the written sources disagree, the disagreement is informative rather than embarrassing: names are laid down by the people who farm a place, and charters are written by the people who claim it.",
          "The passage allows for disagreement between them.",
        ),
        tfng(
          "A name's modern spelling is a poor guide to its origin.",
          "TRUE",
          "The first is that a name's present spelling is almost worthless as evidence: names have been respelled by clerks, by map-makers and by fashion, and a name that now looks transparently like two English words may descend from something quite unrelated.",
          "Present spelling is 'almost worthless as evidence'.",
        ),
        tfng(
          "An invented explanation for a name is always recorded late.",
          "FALSE",
          "Places have been renamed after saints who never went there and battles that happened elsewhere, and the invented explanation is sometimes recorded early enough to look respectable.",
          "It is 'sometimes recorded early'.",
        ),
        tfng(
          "Genetic evidence has made the eastern English question more complicated.",
          "TRUE",
          "Genetic evidence has recently been brought in and has complicated rather than resolved it.",
          "It 'complicated rather than resolved it'.",
        ),
        tfng(
          "Most place-name scholars now work with genetic data.",
          "NOT GIVEN",
          "",
          "Genetic evidence is mentioned once, with nothing about how widely it is used.",
        ),
        noteLine(
          NAME_NOTES,
          null,
          "The earliest recorded ______ must govern the interpretation",
          "forms",
          "The rule is that the earliest recorded forms govern the interpretation, and a name first written down in the sixteenth century is much weaker evidence than one written in the tenth.",
          "The 'earliest recorded forms' decide it.",
          { before: [{ text: "Three of them, in increasing order of danger:", indent: 0 }] },
        ),
        noteLine(
          NAME_NOTES,
          null,
          "An opaque name tends to be ______ into something that makes sense",
          "reshaped",
          "A name whose meaning has become opaque tends to be reshaped into something that makes sense, and a story is then generated to account for the new form.",
          "It is 'reshaped into something that makes sense'.",
        ),
        noteLine(
          NAME_NOTES,
          null,
          "Settlers ______ names with them, so a name may not fit its landscape",
          "carry",
          "Settlers carry names with them, so a name in one place may have no relationship to its landscape at all and simply record where somebody came from.",
          "Settlers 'carry names with them'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "An element meaning a ______ in a treeless district shows lost woodland.",
          "clearing",
          "An element meaning a clearing in woodland, found in a district with no trees, indicates woodland that has gone; an element meaning a marsh indicates drainage.",
          "A 'clearing in woodland' implies vanished trees.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A name of a given origin is evidence of ______ rather than settlement.",
          "contact",
          "The same process operated in Europe, which means the presence of a name of a particular linguistic origin is evidence of contact and not necessarily of settlement, and the distinction between the two has been argued over for as long as the field has existed.",
          "It shows 'contact and not necessarily settlement'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Names record the language of those deciding everyday matters about ______.",
          "land",
          "What the field is good for, when done carefully, is a particular kind of question: not who lived here, which it cannot answer, but what language was being spoken by the people who made the everyday decisions about land.",
          "They record the language of decisions about land.",
        ),
      ],
    },
    {
      key: "t78-p2-gravitational-waves",
      title: "Measuring a Shudder in Space",
      topic: "how a distortion smaller than a proton is detected and what it has settled",
      difficulty: 8,
      body: `A gravitational wave is a distortion in the geometry of space that travels outward from a violent event at the speed of light. Predicted in 1916, it was for most of a century regarded as an unobservable consequence of a theory — real, in the way the theory required, but too small ever to measure. The first detection came in 2015, and the amplitude involved explains the delay: the passing wave changed the length of a four-kilometre instrument by about a thousandth of the width of a proton.

What produces a detectable wave is mass accelerating asymmetrically, and in practice that means two very dense objects orbiting each other. As they spiral inwards the orbit tightens and the frequency rises, producing a characteristic rising note; when they merge, the signal stops. Ileana Costa, who models these systems, emphasises how much information the shape of that rising note carries: the rate at which the frequency increases fixes the masses, the amplitude gives the distance, and the way the signal ends distinguishes a pair of black holes from a pair of neutron stars, because the latter are torn apart before they touch.

The instrument is an interferometer, and its principle is simple enough to state in a sentence. A laser beam is split, sent down two perpendicular arms several kilometres long, reflected back and recombined; if the two arms remain exactly the same length the beams cancel, and if a wave stretches one arm relative to the other, light appears where there should be none.

Everything difficult about it lies in making the arms otherwise perfectly stable. Bo-ram Shin, who works on isolation, describes the engineering as a hierarchy of things that have to be silenced: the mirrors hang from multi-stage pendulums to decouple them from ground motion, the arms are held at a vacuum better than interplanetary space so that air currents do not shift the light, the mirror coatings are chosen to minimise the thermal jostling of their own atoms, and beyond all that the limit is the quantum uncertainty in the number of photons arriving, which is addressed by squeezing the light so that the uncertainty is pushed into a property that does not matter.

A single detector cannot establish much on its own, which is why there have never been fewer than two. Aurelio Fanti, who works on the analysis, points out that a candidate is only a candidate if it appears at two widely separated sites with the right time difference between them, because each instrument produces a continuous stream of transient disturbances from traffic, weather, storms and equipment, and no amount of study of a single record can distinguish a wave from a local event. The same time differences, when three or four detectors record an event, are what give a direction on the sky, and the precision of that direction is poor by astronomical standards.

The most productive event so far was a neutron-star merger in 2017, because it was seen in other ways as well. A gamma-ray burst arrived within two seconds, dozens of telescopes found the fading optical counterpart within hours, and the spectrum showed the signature of freshly made heavy elements. Nadia Kestenbaum, who works on the chemistry, notes that this was the observation that established where a substantial part of the gold, platinum and other heavy elements in the universe is made, a question open since the 1950s, and that it required the gravitational signal to tell the telescopes where to look within a window of hours.

The measurements have also been used to test the theory that predicted them. The arrival of the gamma rays two seconds after the gravitational signal, after both had travelled for a hundred and thirty million years, constrains any difference between the speed of gravity and the speed of light to something like one part in a thousand million million. Several alternative theories of gravity did not survive that afternoon.

What the field now needs is lower frequencies, and that means leaving the ground. An instrument on Earth is blind below a few hertz because seismic noise dominates, and the most interesting sources — the mergers of the very massive black holes at the centres of galaxies — radiate far below that. The proposed answer is three spacecraft in formation several million kilometres apart, measuring their separation by laser, which removes the ground and the atmosphere and substitutes the difficulty of holding a formation at that scale.

The field is unusual in having been in a predicted state for so long. Everything observed so far has agreed with a theory written before any of the instruments existed, which is satisfying and slightly disappointing: the discovery everybody is waiting for is the one that does not fit.`,
      questions: [
        fromList(
          "matching_features",
          WAVE_PEOPLE,
          "The shape of the signal fixes masses, distance and the kind of object.",
          "Ileana Costa",
          "Ileana Costa, who models these systems, emphasises how much information the shape of that rising note carries: the rate at which the frequency increases fixes the masses, the amplitude gives the distance, and the way the signal ends distinguishes a pair of black holes from a pair of neutron stars, because the latter are torn apart before they touch.",
          "Costa reads the rising note.",
        ),
        fromList(
          "matching_features",
          WAVE_PEOPLE,
          "Silencing each source of movement in turn is the whole problem.",
          "Bo-ram Shin",
          "Bo-ram Shin, who works on isolation, describes the engineering as a hierarchy of things that have to be silenced: the mirrors hang from multi-stage pendulums to decouple them from ground motion, the arms are held at a vacuum better than interplanetary space so that air currents do not shift the light, the mirror coatings are chosen to minimise the thermal jostling of their own atoms, and beyond all that the limit is the quantum uncertainty in the number of photons arriving, which is addressed by squeezing the light so that the uncertainty is pushed into a property that does not matter.",
          "Shin describes the hierarchy of noise.",
        ),
        fromList(
          "matching_features",
          WAVE_PEOPLE,
          "One instrument alone cannot tell a wave from a local disturbance.",
          "Aurelio Fanti",
          "Aurelio Fanti, who works on the analysis, points out that a candidate is only a candidate if it appears at two widely separated sites with the right time difference between them, because each instrument produces a continuous stream of transient disturbances from traffic, weather, storms and equipment, and no amount of study of a single record can distinguish a wave from a local event.",
          "Fanti explains why two sites are required.",
        ),
        fromList(
          "matching_features",
          WAVE_PEOPLE,
          "One event settled a question about where heavy elements are made.",
          "Nadia Kestenbaum",
          "Nadia Kestenbaum, who works on the chemistry, notes that this was the observation that established where a substantial part of the gold, platinum and other heavy elements in the universe is made, a question open since the 1950s, and that it required the gravitational signal to tell the telescopes where to look within a window of hours.",
          "Kestenbaum sets out what 2017 established.",
        ),
        fromList(
          "summary_completion",
          WAVE_BANK,
          "The detector is an ______ with two perpendicular arms.",
          "interferometer",
          "The instrument is an interferometer, and its principle is simple enough to state in a sentence.",
          "The instrument is an interferometer.",
        ),
        fromList(
          "summary_completion",
          WAVE_BANK,
          "The mirrors hang from multi-stage ______ to isolate them from the ground.",
          "pendulums",
          "Bo-ram Shin, who works on isolation, describes the engineering as a hierarchy of things that have to be silenced: the mirrors hang from multi-stage pendulums to decouple them from ground motion, the arms are held at a vacuum better than interplanetary space so that air currents do not shift the light, the mirror coatings are chosen to minimise the thermal jostling of their own atoms, and beyond all that the limit is the quantum uncertainty in the number of photons arriving, which is addressed by squeezing the light so that the uncertainty is pushed into a property that does not matter.",
          "They hang from multi-stage pendulums.",
        ),
        fromList(
          "summary_completion",
          WAVE_BANK,
          "The arms are held at a ______ better than interplanetary space.",
          "vacuum",
          "Bo-ram Shin, who works on isolation, describes the engineering as a hierarchy of things that have to be silenced: the mirrors hang from multi-stage pendulums to decouple them from ground motion, the arms are held at a vacuum better than interplanetary space so that air currents do not shift the light, the mirror coatings are chosen to minimise the thermal jostling of their own atoms, and beyond all that the limit is the quantum uncertainty in the number of photons arriving, which is addressed by squeezing the light so that the uncertainty is pushed into a property that does not matter.",
          "The arms hold a very high vacuum.",
        ),
        fromList(
          "summary_completion",
          WAVE_BANK,
          "The final limit is uncertainty in the number of ______ arriving.",
          "photons",
          "Bo-ram Shin, who works on isolation, describes the engineering as a hierarchy of things that have to be silenced: the mirrors hang from multi-stage pendulums to decouple them from ground motion, the arms are held at a vacuum better than interplanetary space so that air currents do not shift the light, the mirror coatings are chosen to minimise the thermal jostling of their own atoms, and beyond all that the limit is the quantum uncertainty in the number of photons arriving, which is addressed by squeezing the light so that the uncertainty is pushed into a property that does not matter.",
          "The photon count sets the floor.",
        ),
        fromList(
          "summary_completion",
          WAVE_BANK,
          "Below a few hertz, ______ noise blinds an instrument on the ground.",
          "seismic",
          "An instrument on Earth is blind below a few hertz because seismic noise dominates, and the most interesting sources — the mergers of the very massive black holes at the centres of galaxies — radiate far below that.",
          "Seismic noise dominates there.",
        ),
        mcq(
          "By how much did the first detected wave change the instrument?",
          [
            "About a thousandth of a proton's width",
            "About the width of an atom",
            "About a millimetre",
            "About a thousandth of a millimetre",
          ],
          "About a thousandth of a proton's width",
          "The first detection came in 2015, and the amplitude involved explains the delay: the passing wave changed the length of a four-kilometre instrument by about a thousandth of the width of a proton.",
          "It was 'about a thousandth of the width of a proton'.",
        ),
        mcq(
          "How are merging neutron stars distinguished from merging black holes?",
          [
            "By the way the signal ends",
            "By the direction it arrives from",
            "By the colour of the light emitted",
            "By the total mass alone",
          ],
          "By the way the signal ends",
          "Ileana Costa, who models these systems, emphasises how much information the shape of that rising note carries: the rate at which the frequency increases fixes the masses, the amplitude gives the distance, and the way the signal ends distinguishes a pair of black holes from a pair of neutron stars, because the latter are torn apart before they touch.",
          "The ending of the signal separates them.",
        ),
        mcq(
          "Why was the 2017 event unusually productive?",
          [
            "It was also observed with telescopes",
            "It was the closest ever recorded",
            "It lasted for several days",
            "It was seen by four instruments",
          ],
          "It was also observed with telescopes",
          "The most productive event so far was a neutron-star merger in 2017, because it was seen in other ways as well.",
          "It 'was seen in other ways as well'.",
        ),
        mcq(
          "What would an instrument in space make observable?",
          [
            "Mergers of very massive black holes",
            "Waves produced inside the Sun",
            "The exact direction of every event",
            "Waves above a few thousand hertz",
          ],
          "Mergers of very massive black holes",
          "An instrument on Earth is blind below a few hertz because seismic noise dominates, and the most interesting sources — the mergers of the very massive black holes at the centres of galaxies — radiate far below that.",
          "Those mergers radiate below a few hertz.",
        ),
      ],
    },
    {
      key: "t78-p3-lie-detection",
      title: "The Machine That Cannot Detect a Lie",
      topic: "why no instrument measuring the body can identify an intention",
      difficulty: 9,
      body: `A) The wish for a reliable way of telling whether somebody is lying is very old, and the attempts to satisfy it have a consistent shape: a physiological measure is found to differ, on average, between people who are lying and people who are not; the difference is then treated as a test that can be applied to an individual; and the gap between those two statements is where the damage is done. An average difference between two groups and a verdict about one person are not the same kind of claim, and almost nothing in the history of this subject turns on anything else.

B) The instrument called a polygraph measures breathing, pulse, blood pressure and the electrical conductance of the skin. None of these responds to deception. They respond to arousal, and the theory of the examination is that a guilty person will be more aroused by a relevant question than by a control question. That is a plausible expectation and it is sometimes correct. It also fails in two directions that cannot be corrected by better equipment: an innocent person may be more frightened of the accusation than a guilty one is of being caught, and a guilty person may not be frightened at all.

C) The published accuracy figures are worth reading carefully, because they are quoted in both directions and both readings mislead. Under laboratory conditions, where volunteers are instructed to lie about something inconsequential, examiners classify perhaps eighty to ninety per cent of cases correctly. In field conditions the figure is lower and much harder to establish, because the ground truth is usually a confession, and a confession is sometimes produced by the examination itself, which makes the test its own criterion. A test validated against outcomes it helped to cause has not been validated.

D) The consequence of even a good error rate is the part most often missed, and it is arithmetic rather than psychology. Apply a test that is ninety per cent accurate to a thousand employees of whom ten are stealing; you will identify nine of the ten and also implicate ninety-nine innocent people. The great majority of those accused by the test will not have done it. This is a property of screening any population in which the behaviour is rare, it applies to every test of every kind, and it is why the polygraph's use in employment screening is indefensible even on its own accuracy claims.

E) Newer methods have attracted similar hopes and have so far reproduced the same pattern. Brain imaging can identify, above chance, whether a subject recognises an image, and there was a period in which this was presented as a memory detector. The effects are averaged over many trials and many subjects, the experiments use recognition rather than deception, and a person who has seen a photograph in a newspaper recognises it too. Thermal imaging of the face, voice-stress analysis and automated detection of micro-expressions have each been marketed well in advance of their evidence, and voice stress in particular performs at chance in independent trials while remaining in commercial use.

F) I want to distinguish two things that are usually confused, because the strongest argument against these instruments is not that they never do anything. In an interrogation, a device the subject believes in changes the subject's behaviour, and confessions do follow. That is a real effect and it is not deception detection; it is a prop, and it works as well if the machine is unplugged. Investigators who defend the polygraph frequently describe its value in precisely those terms and then present the results as measurements.

G) What I would conclude is that the demand here is for something that cannot exist in the form requested. Lying is not a physiological state but an intention, and there is no reason to expect a single bodily signature for a category defined by what a person means rather than by what their body is doing. A nervous truthful witness and a calm practised liar will always defeat any instrument that measures nervousness, and no refinement of the sensors addresses that, because the problem is in what is being measured and not in how well. The useful research in this area has quietly moved to studying how interviews should be conducted, which produces smaller claims and better results.`,
      questions: [
        fromList(
          "matching_information",
          LIE_PARAGRAPHS,
          "what the instrument actually records",
          "B",
          "The instrument called a polygraph measures breathing, pulse, blood pressure and the electrical conductance of the skin.",
          "Paragraph B lists the four measures.",
        ),
        fromList(
          "matching_information",
          LIE_PARAGRAPHS,
          "a calculation of how many innocent people a screening test implicates",
          "D",
          "Apply a test that is ninety per cent accurate to a thousand employees of whom ten are stealing; you will identify nine of the ten and also implicate ninety-nine innocent people.",
          "Paragraph D works the arithmetic.",
        ),
        fromList(
          "matching_information",
          LIE_PARAGRAPHS,
          "why accuracy outside the laboratory cannot be established",
          "C",
          "In field conditions the figure is lower and much harder to establish, because the ground truth is usually a confession, and a confession is sometimes produced by the examination itself, which makes the test its own criterion.",
          "Paragraph C exposes the circular criterion.",
        ),
        fromList(
          "matching_information",
          LIE_PARAGRAPHS,
          "a technique that performs at chance and is still on sale",
          "E",
          "Thermal imaging of the face, voice-stress analysis and automated detection of micro-expressions have each been marketed well in advance of their evidence, and voice stress in particular performs at chance in independent trials while remaining in commercial use.",
          "Paragraph E names voice stress.",
        ),
        fromList(
          "matching_information",
          LIE_PARAGRAPHS,
          "an admission that the device has an effect of a different kind",
          "F",
          "In an interrogation, a device the subject believes in changes the subject's behaviour, and confessions do follow.",
          "Paragraph F grants the interrogation effect.",
        ),
        ynng(
          "The writer thinks better equipment could correct the polygraph's failures.",
          "NO",
          "It also fails in two directions that cannot be corrected by better equipment: an innocent person may be more frightened of the accusation than a guilty one is of being caught, and a guilty person may not be frightened at all.",
          "The failures 'cannot be corrected by better equipment'.",
        ),
        ynng(
          "The writer accepts that the device can help produce confessions.",
          "YES",
          "That is a real effect and it is not deception detection; it is a prop, and it works as well if the machine is unplugged.",
          "'That is a real effect'.",
        ),
        ynng(
          "The writer believes the laboratory accuracy figures carry over to real cases.",
          "NO",
          "A test validated against outcomes it helped to cause has not been validated.",
          "Such a test 'has not been validated'.",
        ),
        ynng(
          "The writer thinks research on how to conduct interviews is more worthwhile.",
          "YES",
          "The useful research in this area has quietly moved to studying how interviews should be conducted, which produces smaller claims and better results.",
          "That research gives 'better results'.",
        ),
        fromList(
          "matching_sentence_endings",
          LIE_ENDINGS,
          "The measurements track fear rather than dishonesty,",
          "because arousal is not the same thing as deception.",
          "They respond to arousal, and the theory of the examination is that a guilty person will be more aroused by a relevant question than by a control question.",
          "What is measured is arousal.",
        ),
        fromList(
          "matching_sentence_endings",
          LIE_ENDINGS,
          "The accuracy of the examination in real cases cannot be pinned down,",
          "although the ground truth in the field is usually a confession.",
          "In field conditions the figure is lower and much harder to establish, because the ground truth is usually a confession, and a confession is sometimes produced by the examination itself, which makes the test its own criterion.",
          "The criterion is a confession the test may have caused.",
        ),
        fromList(
          "matching_sentence_endings",
          LIE_ENDINGS,
          "Applying the test where wrongdoing is rare misfires badly,",
          "which is why most of the people a screening test accuses are innocent.",
          "The great majority of those accused by the test will not have done it.",
          "Most of the accused are innocent.",
        ),
        fromList(
          "matching_sentence_endings",
          LIE_ENDINGS,
          "Recognising an image is not the same as concealing something,",
          "since a person may recognise a photograph they saw in a newspaper.",
          "The effects are averaged over many trials and many subjects, the experiments use recognition rather than deception, and a person who has seen a photograph in a newspaper recognises it too.",
          "Recognition has innocent causes.",
        ),
        fromList(
          "matching_sentence_endings",
          LIE_ENDINGS,
          "Lying is an intention rather than a state of the body,",
          "which the writer thinks no improvement in the sensors can address.",
          "A nervous truthful witness and a calm practised liar will always defeat any instrument that measures nervousness, and no refinement of the sensors addresses that, because the problem is in what is being measured and not in how well.",
          "The fault is in what is measured.",
        ),
      ],
    },
  ],
};
