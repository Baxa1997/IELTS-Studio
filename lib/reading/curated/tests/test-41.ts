import {
  fromList,
  gapFill,
  mcq,
  noteLine,
  pickTwo,
  plain,
  tfng,
  ynng,
  type CuratedQuestion,
  type CuratedTest,
} from "../shared";

// ---- Passage 1 · archaeology · notes ----------------------------------------

const TOMB = {
  title: "The search for and opening of the tomb",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO --------------------------

const HEADINGS = [
  "A treatment that was set aside",
  "Hunting for the right virus",
  "Why one patient at a time is not a trial",
  "How a phage kills a bacterium",
  "Growing bacteria in the laboratory",
  "Where phages were first collected",
  "Rules written for medicines, not for living things",
  "Why antibiotics were first discovered",
  "Mixtures, and what they cost",
  "Bacteria that resist everything",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const PHAGE_STEM = "Which TWO difficulties of using phages as medicines are described?";
const PHAGE_DIFFICULTIES = [
  "a phage usually attacks only a narrow range of bacteria",
  "phages cannot be stored for more than a few hours",
  "bacteria can become resistant to a phage",
  "phages are destroyed by ordinary refrigeration",
  "phages cannot be grown outside the human body",
];

// ---- Passage 3 · research debate · word bank --------------------------------

const MEMORY_BANK = [
  "confidence",
  "reconstruction",
  "lineup",
  "suggestion",
  "delay",
  "video",
  "sequence",
  "instructions",
];

export const TEST_41: CuratedTest = {
  key: "full-test-41",
  targetBand: 7,
  passages: [
    {
      key: "t41-p1-tutankhamun",
      title: "The Step in the Sand",
      topic: "the discovery of Tutankhamun's tomb and what followed it",
      difficulty: 6,
      body: `By 1922 the Valley of the Kings was thought to be finished. Sixty-one tombs had been recorded, most of them robbed in antiquity, and the leading authorities held that nothing of importance remained. One man disagreed. Howard Carter, an English excavator who had begun his career copying tomb paintings as a teenager, was convinced that a minor king of the Eighteenth Dynasty, whose name appeared on a few scattered objects but whose burial had never been located, was still somewhere beneath the valley floor.

Carter's work was paid for by Lord Carnarvon, an English aristocrat who had come to Egypt for his health and stayed for the archaeology. Their partnership had lasted more than a decade and produced very little. In the summer of 1922 Carnarvon told Carter that the money would stop; Carter offered to fund a final season himself, and Carnarvon agreed to pay for one more.

Carter returned to a triangle of ground he had left untouched because workmen's huts stood on it. The huts were cleared, and on 4 November 1922 a water boy scraping in the sand uncovered a cut step. Twelve steps were exposed, leading down to a blocked doorway stamped with the seals of the royal cemetery. Carter refilled the stairway, posted guards and sent a telegram to England: he had made a wonderful discovery in the valley, and was waiting for Carnarvon to arrive.

Three weeks later, with Carnarvon beside him, Carter made a small hole in the sealed door at the end of a rubble-filled passage and held a candle to it. Asked whether he could see anything, he replied that he could see wonderful things. Behind the door was an antechamber packed to the ceiling: dismantled chariots, gilded couches in the shape of animals, chests of clothing, walking sticks, board games, jars of oils. Beyond it, guarded by two life-sized statues, was the sealed burial chamber.

The tomb was not, as is often said, untouched. It had been entered at least twice within a few years of the funeral, and objects had been taken; the priests of the cemetery had then resealed it, repacking what was left in some disorder. Its survival was an accident of geology. Debris from the cutting of a later tomb had buried the entrance, and the huts of the workmen who dug that tomb had been built on top of the debris, hiding the stairway for three thousand years.

Clearing it took ten years. Carter insisted that every object be photographed in place, numbered, drawn and conserved before it was moved, a standard far ahead of most excavation of the period, and the work was slowed further by the fragility of what he found: textiles that crumbled at a touch, wood that had shrunk away from its gilding, and a mummy that had been so soaked in resin that it was stuck fast in its coffin and was eventually cut apart to be removed.

Carter assembled an unusual team for the period, including a chemist, a photographer and a conservator borrowed from other expeditions, and the photographic record they produced — several thousand glass plates — remains the primary source for objects that have deteriorated since. The tomb itself is modest by royal standards, four small rooms in all, which is part of the reason its contents were packed so tightly and why clearing it was so slow.

The discovery made the king a household name and produced a wave of Egyptian fashion in furniture, jewellery and cinema. It also produced the story of a curse, sustained by journalists after Carnarvon died of an infected mosquito bite a few months after the opening. Studies of those present at the opening have found no unusual pattern of early death, but the story has proved more durable than the correction.

More consequentially, the find came at a moment when Egypt was asserting its independence, and the government used the occasion to change the rules. Under the previous system, excavators expected to keep a share of what they found. In the case of the tomb, the authorities determined that everything belonged to Egypt, and that principle became the basis of later antiquities law. Nothing from the burial left the country, and the whole assemblage is now displayed together in a museum built for it beside the pyramids at Giza.`,
      questions: [
        noteLine(
          TOMB,
          "Before the discovery",
          "Experts believed the valley held ______ of importance left to find",
          "nothing",
          "Sixty-one tombs had been recorded, most of them robbed in antiquity, and the leading authorities held that nothing of importance remained.",
          "Authorities held that 'nothing of importance remained'.",
        ),
        noteLine(
          TOMB,
          "Before the discovery",
          "Carnarvon agreed to pay for one final ______",
          "season",
          "In the summer of 1922 Carnarvon told Carter that the money would stop; Carter offered to fund a final season himself, and Carnarvon agreed to pay for one more.",
          "Carnarvon 'agreed to pay for one more' season.",
        ),
        noteLine(
          TOMB,
          "November 1922",
          "The ground had been left untouched because workmen's ______ stood on it",
          "huts",
          "Carter returned to a triangle of ground he had left untouched because workmen's huts stood on it.",
          "'Workmen's huts stood on it'.",
        ),
        noteLine(
          TOMB,
          "November 1922",
          "A water boy uncovered a cut ______ in the sand",
          "step",
          "The huts were cleared, and on 4 November 1922 a water boy scraping in the sand uncovered a cut step.",
          "He 'uncovered a cut step'.",
        ),
        noteLine(
          TOMB,
          "November 1922",
          "The blocked doorway carried the ______ of the royal cemetery",
          "seals",
          "Twelve steps were exposed, leading down to a blocked doorway stamped with the seals of the royal cemetery.",
          "It was 'stamped with the seals of the royal cemetery'.",
        ),
        noteLine(
          TOMB,
          "The antechamber",
          "It contained dismantled ______, gilded couches and chests of clothing",
          "chariots",
          "Behind the door was an antechamber packed to the ceiling: dismantled chariots, gilded couches in the shape of animals, chests of clothing, walking sticks, board games, jars of oils.",
          "It held 'dismantled chariots'.",
        ),
        noteLine(
          TOMB,
          "The antechamber",
          "Two life-sized ______ stood before the burial chamber",
          "statues",
          "Beyond it, guarded by two life-sized statues, was the sealed burial chamber.",
          "It was 'guarded by two life-sized statues'.",
        ),
        noteLine(
          TOMB,
          "Afterwards",
          "Carter had every object photographed, numbered, drawn and ______ before removal",
          "conserved",
          "Carter insisted that every object be photographed in place, numbered, drawn and conserved before it was moved, a standard far ahead of most excavation of the period, and the work was slowed further by the fragility of what he found: textiles that crumbled at a touch, wood that had shrunk away from its gilding, and a mummy that had been so soaked in resin that it was stuck fast in its coffin and was eventually cut apart to be removed.",
          "Objects were 'photographed in place, numbered, drawn and conserved'.",
        ),
        tfng(
          "Carter had worked in Egypt since he was young.",
          "TRUE",
          "Howard Carter, an English excavator who had begun his career copying tomb paintings as a teenager, was convinced that a minor king of the Eighteenth Dynasty, whose name appeared on a few scattered objects but whose burial had never been located, was still somewhere beneath the valley floor.",
          "He 'had begun his career… as a teenager'.",
        ),
        tfng(
          "The tomb had never been entered before Carter reached it.",
          "FALSE",
          "It had been entered at least twice within a few years of the funeral, and objects had been taken; the priests of the cemetery had then resealed it, repacking what was left in some disorder.",
          "It 'had been entered at least twice'.",
        ),
        tfng(
          "The tomb survived because of debris left by later building work.",
          "TRUE",
          "Debris from the cutting of a later tomb had buried the entrance, and the huts of the workmen who dug that tomb had been built on top of the debris, hiding the stairway for three thousand years.",
          "Debris 'had buried the entrance'.",
        ),
        tfng(
          "Research has confirmed that those present at the opening died unusually early.",
          "FALSE",
          "Studies of those present at the opening have found no unusual pattern of early death, but the story has proved more durable than the correction.",
          "Studies 'found no unusual pattern of early death'.",
        ),
        tfng(
          "Carnarvon's family received a share of the objects from the tomb.",
          "FALSE",
          "In the case of the tomb, the authorities determined that everything belonged to Egypt, and that principle became the basis of later antiquities law.",
          "'Everything belonged to Egypt'.",
        ),
      ],
    },
    {
      key: "t41-p2-phage-therapy",
      title: "Viruses That Eat Bacteria",
      topic: "the return of phage therapy as antibiotics lose their power",
      difficulty: 7,
      body: `A) For every bacterium on Earth there are thought to be several viruses that infect it and nothing else. These bacteriophages — the name means bacteria-eaters — are the most numerous biological entities known, present in sea water, soil, sewage and the human gut in quantities that defeat imagination. A phage attaches to the surface of a bacterium, injects its genetic material, hijacks the cell's machinery to make copies of itself, and bursts the cell open to release them. It cannot infect a human cell, because it is built to dock with a bacterial one.

B) The medical possibilities were obvious a century ago. Phages were used to treat dysentery and cholera in the 1920s and 1930s, sold commercially in several countries, and studied intensively in Georgia and elsewhere in the Soviet Union. Then came penicillin. Antibiotics were simpler to make, easier to store and effective against a wide range of organisms at once, and outside the Soviet sphere phage therapy was largely abandoned by the 1950s — not because it had failed, but because something more convenient had arrived.

C) It is being reconsidered because the convenient thing is wearing out. Bacteria resistant to most or all available antibiotics now cause well over a million deaths a year, and the pipeline of new antibiotics has been thin for decades, since a drug that must be used sparingly and briefly is a poor commercial prospect. Infections that were routine are becoming difficult, and surgery, chemotherapy and intensive care all depend on being able to control bacteria reliably. Estimates of the toll vary with the method used to produce them, but they point the same way: in every region where the figures are collected, the share of infections that fail to respond to first-line treatment is rising, and the patients affected are increasingly ordinary ones rather than the severely ill.

D) The property that makes phages interesting is the same one that makes them awkward. Each phage attacks a narrow range of bacteria, sometimes only certain strains of a single species, which means it can be used without destroying the patient's own microbial community — and also that the right phage must be found for each infection. Laboratories maintain libraries of thousands of isolates and test a patient's bacteria against them; where nothing matches, phages can be hunted in sewage, where they are abundant. This takes days that a critically ill patient may not have.

E) Bacteria fight back, as they do against anything. They alter the surface molecules a phage attaches to, cut up injected genetic material, or shelter inside films of slime. Physicians answer by using cocktails of several phages at once, so that resistance to one does not confer escape from all, and by pairing phages with antibiotics, since the changes a bacterium makes to evade a phage often make it vulnerable to a drug again. This double bind is one of the most promising findings in the field.

F) Regulation is the practical obstacle. Medicines are licensed on the basis that each batch is identical and that the product does not change; a phage is a living thing that mutates, and a personalised cocktail assembled for one patient is a different product from the one assembled for the next. Most treatment so far has therefore happened case by case under special provisions for patients who have run out of options, and while the published reports include some remarkable recoveries, a collection of individual successes is not evidence in the sense regulators require, because the failures are not recorded in the same way.

G) Properly controlled trials are now under way, and their design has had to be unusual: some randomise patients to a phage preparation or a placebo alongside standard treatment, others compare a fixed cocktail across many patients with the same organism, accepting that a fixed product will suit fewer people in order to produce an interpretable result. Early results have been mixed, and one large trial in diabetic foot infection failed to show benefit. The field's own view is that this is what a serious evaluation looks like after seventy years of anecdote, and that a treatment which works only for the patients whose bacteria it matches will need a regulatory system built for that fact rather than around it.`,
      questions: [
        heading(
          "A",
          "How a phage kills a bacterium",
          "A phage attaches to the surface of a bacterium, injects its genetic material, hijacks the cell's machinery to make copies of itself, and bursts the cell open to release them.",
          "Paragraph A describes the mechanism.",
        ),
        heading(
          "B",
          "A treatment that was set aside",
          "Antibiotics were simpler to make, easier to store and effective against a wide range of organisms at once, and outside the Soviet sphere phage therapy was largely abandoned by the 1950s — not because it had failed, but because something more convenient had arrived.",
          "Paragraph B: phage therapy 'was largely abandoned'.",
        ),
        heading(
          "C",
          "Bacteria that resist everything",
          "Bacteria resistant to most or all available antibiotics now cause well over a million deaths a year, and the pipeline of new antibiotics has been thin for decades, since a drug that must be used sparingly and briefly is a poor commercial prospect.",
          "Paragraph C is about resistant bacteria.",
        ),
        heading(
          "D",
          "Hunting for the right virus",
          "Laboratories maintain libraries of thousands of isolates and test a patient's bacteria against them; where nothing matches, phages can be hunted in sewage, where they are abundant.",
          "Paragraph D is about finding a matching phage.",
        ),
        heading(
          "E",
          "Mixtures, and what they cost",
          "Physicians answer by using cocktails of several phages at once, so that resistance to one does not confer escape from all, and by pairing phages with antibiotics, since the changes a bacterium makes to evade a phage often make it vulnerable to a drug again.",
          "Paragraph E is about cocktails and combinations.",
        ),
        heading(
          "F",
          "Rules written for medicines, not for living things",
          "Medicines are licensed on the basis that each batch is identical and that the product does not change; a phage is a living thing that mutates, and a personalised cocktail assembled for one patient is a different product from the one assembled for the next.",
          "Paragraph F is about the regulatory mismatch.",
        ),
        heading(
          "G",
          "Why one patient at a time is not a trial",
          "Properly controlled trials are now under way, and their design has had to be unusual: some randomise patients to a phage preparation or a placebo alongside standard treatment, others compare a fixed cocktail across many patients with the same organism, accepting that a fixed product will suit fewer people in order to produce an interpretable result.",
          "Paragraph G: controlled trials replace the case-by-case approach.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "A phage cannot infect a ______ cell, because it docks only with bacteria.",
          "human",
          "It cannot infect a human cell, because it is built to dock with a bacterial one.",
          "'It cannot infect a human cell'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Where no stored phage matches, new ones can be sought in ______.",
          "sewage",
          "Laboratories maintain libraries of thousands of isolates and test a patient's bacteria against them; where nothing matches, phages can be hunted in sewage, where they are abundant.",
          "They 'can be hunted in sewage'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Bacteria may hide from phages inside films of ______.",
          "slime",
          "They alter the surface molecules a phage attaches to, cut up injected genetic material, or shelter inside films of slime.",
          "They 'shelter inside films of slime'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Escaping a phage often leaves a bacterium vulnerable to a ______ again.",
          "drug",
          "Physicians answer by using cocktails of several phages at once, so that resistance to one does not confer escape from all, and by pairing phages with antibiotics, since the changes a bacterium makes to evade a phage often make it vulnerable to a drug again.",
          "The changes 'make it vulnerable to a drug again'.",
        ),
        pickTwo(
          PHAGE_STEM,
          PHAGE_DIFFICULTIES,
          "A or C",
          "Each phage attacks a narrow range of bacteria, sometimes only certain strains of a single species, which means it can be used without destroying the patient's own microbial community — and also that the right phage must be found for each infection.",
          "A is described: each phage 'attacks a narrow range of bacteria'.",
        ),
        pickTwo(
          PHAGE_STEM,
          PHAGE_DIFFICULTIES,
          "A or C",
          "They alter the surface molecules a phage attaches to, cut up injected genetic material, or shelter inside films of slime.",
          "C is described: bacteria develop resistance to phages. B, D and E are not mentioned.",
        ),
      ],
    },
    {
      key: "t41-p3-eyewitness",
      title: "The Witness Who Was Sure",
      topic: "what research has shown about the reliability of eyewitness memory",
      difficulty: 8,
      body: `A jury asked to convict on the word of a confident eyewitness is being asked to trust a system that does not work the way almost everybody assumes. Memory is not a recording that can be played back; it is a reconstruction, assembled each time from fragments, expectations and whatever has been learned since. That is an efficient design for ordinary life and a dangerous one for criminal justice, and the consequences have been documented in painful detail. Of the convictions overturned by later DNA testing in the United States, the great majority involved a witness who had identified the wrong person, usually with complete sincerity.

The laboratory work behind this understanding began in the 1970s, when researchers showed volunteers films of traffic accidents and then asked them questions with slightly different wording. Those asked how fast the cars were going when they smashed into each other estimated higher speeds than those asked about cars that hit each other, and a week later were more likely to report having seen broken glass, of which there had been none. The suggestion had not overwritten the memory so much as been folded into it, and the witnesses could not tell which parts were which.

The same process operates through every stage of an investigation. A witness who is shown a photograph before attending an identification parade may afterwards recognise the person from the photograph rather than from the crime. A witness who overhears another witness's description may adopt its details. A witness who is told, after choosing, that they picked the suspect becomes dramatically more confident, and also reports having had a better view and a clearer memory than they described before the feedback. Confidence, in other words, is not an independent measure of accuracy; it is itself affected by what happens after the event.

That last finding matters because juries rely on confidence more than on anything else. Studies in which mock jurors watch testimony consistently find that a witness's certainty is the strongest predictor of whether they are believed, and that jurors discount the factors that genuinely predict accuracy — the lighting, the distance, the presence of a weapon, whether the witness and the suspect are of the same ethnic group, how much time passed before the identification.

The research has produced a set of procedures that demonstrably reduce error, and they are neither expensive nor complicated. The officer conducting an identification should not know which member of the line-up is the suspect, so that no unconscious signal can be given. The witness should be told that the person may or may not be present. The other members of the line-up should match the witness's original description rather than resemble the suspect. And the witness's confidence should be recorded in their own words immediately, before any feedback, because a confident identification made straight away, under good conditions and with no prompting, is in fact reasonably reliable — much more so than the same identification delivered in court eighteen months later.

None of these measures makes a memory more accurate. What they do is prevent it from being contaminated between the event and the identification, which is a narrower goal and an achievable one. The same studies find that warning a jury in general terms about the fallibility of witnesses changes very little unless the warning names the particular conditions that applied in the case before them.

That qualification is important, and is often lost when this research is summarised. The message is not that eyewitnesses are worthless. It is that an identification is a piece of evidence whose value depends almost entirely on how it was obtained, in the same way that a fingerprint's value depends on how it was lifted. Treated carefully, memory evidence is informative. Treated carelessly, it manufactures confident witnesses who are wrong, and it does so without anybody lying.

Courts have been slow to absorb this. Several jurisdictions now require juries to be warned about the limits of identification evidence, and some have adopted the recommended procedures as standard. Others continue to allow a witness to point across a courtroom at the defendant, an act of theatre that is as unreliable as it is persuasive, since by that point the witness has seen the defendant in that seat, in that role, on every previous day of the trial.`,
      questions: [
        mcq(
          "How does the writer describe the way memory works?",
          [
            "as a recording that fades over time",
            "as a reconstruction assembled from fragments and later learning",
            "as an accurate record that can be damaged by stress",
            "as a series of images stored in order",
          ],
          "as a reconstruction assembled from fragments and later learning",
          "Memory is not a recording that can be played back; it is a reconstruction, assembled each time from fragments, expectations and whatever has been learned since.",
          "It is 'a reconstruction, assembled each time from fragments'.",
        ),
        mcq(
          "What did the 1970s film experiments demonstrate?",
          [
            "that witnesses forget events within a week",
            "that the wording of a question can change what is later recalled",
            "that films are a poor substitute for real events",
            "that witnesses invent details deliberately",
          ],
          "that the wording of a question can change what is later recalled",
          "Those asked how fast the cars were going when they smashed into each other estimated higher speeds than those asked about cars that hit each other, and a week later were more likely to report having seen broken glass, of which there had been none.",
          "Different wording changed both estimates and later reports.",
        ),
        mcq(
          "What happens when a witness is told they picked the suspect?",
          [
            "They usually change their choice.",
            "Their confidence and their account of the conditions both improve.",
            "They become less willing to testify.",
            "Their memory of the event returns in more detail.",
          ],
          "Their confidence and their account of the conditions both improve.",
          "A witness who is told, after choosing, that they picked the suspect becomes dramatically more confident, and also reports having had a better view and a clearer memory than they described before the feedback.",
          "Confidence rises and so does the reported quality of the view.",
        ),
        mcq(
          "What do studies of mock jurors show?",
          [
            "Jurors weigh lighting and distance heavily.",
            "Jurors are unconvinced by confident witnesses.",
            "Confidence is the strongest influence on whether a witness is believed.",
            "Jurors prefer written statements to live testimony.",
          ],
          "Confidence is the strongest influence on whether a witness is believed.",
          "Studies in which mock jurors watch testimony consistently find that a witness's certainty is the strongest predictor of whether they are believed, and that jurors discount the factors that genuinely predict accuracy — the lighting, the distance, the presence of a weapon, whether the witness and the suspect are of the same ethnic group, how much time passed before the identification.",
          "Certainty is 'the strongest predictor of whether they are believed'.",
        ),
        mcq(
          "Why does the writer object to identification in the courtroom?",
          [
            "because the witness has repeatedly seen the defendant in that setting",
            "because the defendant may have changed in appearance",
            "because juries cannot see the witness clearly",
            "because the procedure takes too long",
          ],
          "because the witness has repeatedly seen the defendant in that setting",
          "Others continue to allow a witness to point across a courtroom at the defendant, an act of theatre that is as unreliable as it is persuasive, since by that point the witness has seen the defendant in that seat, in that role, on every previous day of the trial.",
          "The witness has seen the defendant 'in that seat, in that role' repeatedly.",
        ),
        ynng(
          "The writer believes eyewitness evidence should never be used in court.",
          "NO",
          "The message is not that eyewitnesses are worthless.",
          "'The message is not that eyewitnesses are worthless.'",
        ),
        ynng(
          "The writer accepts that a prompt identification under good conditions can be trusted.",
          "YES",
          "And the witness's confidence should be recorded in their own words immediately, before any feedback, because a confident identification made straight away, under good conditions and with no prompting, is in fact reasonably reliable — much more so than the same identification delivered in court eighteen months later.",
          "Such an identification is 'reasonably reliable'.",
        ),
        ynng(
          "The writer thinks the recommended procedures are too costly for most police forces.",
          "NO",
          "The research has produced a set of procedures that demonstrably reduce error, and they are neither expensive nor complicated.",
          "They are 'neither expensive nor complicated'.",
        ),
        ynng(
          "The writer regards witnesses who identify the wrong person as usually dishonest.",
          "NO",
          "Of the convictions overturned by later DNA testing in the United States, the great majority involved a witness who had identified the wrong person, usually with complete sincerity.",
          "They were wrong 'with complete sincerity'.",
        ),
        ynng(
          "The writer is satisfied with the pace at which courts have adopted the findings.",
          "NO",
          "Courts have been slow to absorb this.",
          "'Courts have been slow to absorb this.'",
        ),
        fromList(
          "summary_completion",
          MEMORY_BANK,
          "Memory is better described as a ______ than as a recording.",
          "reconstruction",
          "Memory is not a recording that can be played back; it is a reconstruction, assembled each time from fragments, expectations and whatever has been learned since.",
          "'It is a reconstruction'.",
        ),
        fromList(
          "summary_completion",
          MEMORY_BANK,
          "A witness's ______ rises after they are told they chose the suspect.",
          "confidence",
          "A witness who is told, after choosing, that they picked the suspect becomes dramatically more confident, and also reports having had a better view and a clearer memory than they described before the feedback.",
          "They become 'dramatically more confident'.",
        ),
        fromList(
          "summary_completion",
          MEMORY_BANK,
          "The other members of a ______ should match the original description.",
          "lineup",
          "The other members of the line-up should match the witness's original description rather than resemble the suspect.",
          "The other members of the line-up must fit the description.",
        ),
        fromList(
          "summary_completion",
          MEMORY_BANK,
          "The witness should be given ______ making clear that the person may not be present.",
          "instructions",
          "The witness should be told that the person may or may not be present.",
          "Those are the instructions given before viewing.",
        ),
      ],
    },
  ],
};
