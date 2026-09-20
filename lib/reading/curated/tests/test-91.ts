import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of medicine · notes box ----------------------------

const WARD_NOTES = {
  title: "The comparison that made the case",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · patient safety · people and a word bank -------------------

const CHECKLIST_PEOPLE = ["Anneke Visser", "Rowan Hendricks", "Leila Farouk", "Gustav Ekström"];
const CHECKLIST_BANK = [
  "pause",
  "names",
  "memory",
  "hierarchy",
  "ticking",
  "allergies",
  "site",
  "count",
  "briefing",
];

// ---- Passage 3 · laboratory biology · lettered paragraphs ------------------

const ORGANOID_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ORGANOID_ENDINGS = [
  "because a structure with no blood supply cannot grow beyond a millimetre or so.",
  "which is why the tissue answers questions about mechanism rather than about dose.",
  "since a drug that fails in a mouse may still have worked in a person.",
  "although the cells organise themselves without being told where to go.",
  "because an immune system is the one component the dish does not contain.",
  "even though the same cells came from a patient rather than a cell line.",
  "which makes the regulatory question harder than the biological one.",
];

export const TEST_91: CuratedTest = {
  key: "full-test-91",
  targetBand: 8,
  passages: [
    {
      key: "t91-p1-handwashing",
      title: "Washing Between Patients",
      topic:
        "a correct conclusion, a hostile profession, and what the episode is usually taken to prove",
      difficulty: 7,
      body: `In the 1840s the maternity service of the Vienna General Hospital was divided into two clinics, and women arriving in labour were admitted to them on alternate days. The first clinic was staffed by medical students; the second by trainee midwives. The mortality from puerperal fever in the first clinic ran at around ten per cent and in some months considerably higher. In the second it was around four. The difference was common knowledge in the city, and women are recorded as pleading to be admitted on midwife days, some preferring to give birth in the street.

Ignaz Semmelweis, an assistant in the first clinic, treated the disparity as a problem with a cause. He worked through the candidate explanations and eliminated them one by one. Overcrowding was ruled out because the second clinic was more crowded. Climate was ruled out because both clinics shared it. The differences in position during delivery, in diet and in ventilation were all examined and none survived the comparison. What remained was the students, and what the students did that the midwives did not was perform autopsies in the morning and then examine women in labour without washing.

The confirming event was a death. A colleague cut his finger during an autopsy and died of an illness whose progression, at post-mortem, was indistinguishable from puerperal fever. Semmelweis concluded that some material from the dead was being carried on the hands into the women, and in 1847 he required students to wash in a solution of chlorinated lime, which he chose because it removed the smell of the dissecting room and he reasoned that what removed the smell might remove the substance. Mortality in the first clinic fell to the level of the second within months, and in one month to zero.

The reception was hostile, and the reasons are worth separating. Part was intellectual: he had no theory of what the material was, germ theory being two decades away, and a claim of causation without a mechanism is genuinely weaker than one with it. Part was institutional: the doctrine of the day held that disease arose from an imbalance in the individual patient, so a single external cause of one disease did not fit the framework. And part was simple offence. Semmelweis's claim was that doctors were killing their patients with their own hands, which is what it was, and he put it in those terms in letters to obstetricians across Europe, accusing named individuals of murder.

His own conduct made matters worse and is usually reported either as tragedy or as a warning against tactlessness. Both readings miss something. He published his results late and badly organised, in a long and repetitive book that appeared thirteen years after the intervention. He did not publish the statistics in the form his opponents could check most easily. He was dismissed from his post, moved to Budapest, where he achieved the same results again, and was eventually committed to an asylum, where he died of an infected wound at the age of forty-seven.

The episode entered medical folklore as a story about a genius rejected by a stupid profession, and it is regularly deployed in arguments for whatever the speaker believes is being unjustly ignored. That use of it does not survive the details. Semmelweis's evidence was strong but his case was presented in a way that made it hard to evaluate; the mechanism he lacked was the thing his colleagues most reasonably wanted; and the practice he recommended was adopted, slowly, in the decades after his death, as antisepsis arrived from other directions and supplied the missing explanation.

What the case does establish is narrower and more useful. A difference in outcome between two groups treated differently is evidence about the treatment, whether or not anybody can say why. Semmelweis had, in effect, a natural experiment with alternating admission, which is closer to a randomised trial than anything else in medicine at the time, and the strength of that design is why he was right. The lesson is not that dissenters should be believed. It is that a comparison can be decisive without a theory, and that the demand for a mechanism, though reasonable, is not a reason to keep doing the thing the comparison condemns.`,
      questions: [
        tfng(
          "Women were assigned to the two clinics according to their preference.",
          "FALSE",
          "The first clinic was staffed by medical students; the second by trainee midwives.",
          "Admission alternated by day, not by preference.",
        ),
        tfng(
          "Overcrowding was eliminated because the safer clinic was more crowded.",
          "TRUE",
          "Overcrowding was ruled out because the second clinic was more crowded.",
          "The second clinic was more crowded.",
        ),
        tfng(
          "Semmelweis chose chlorinated lime because of an established theory of infection.",
          "FALSE",
          "Semmelweis concluded that some material from the dead was being carried on the hands into the women, and in 1847 he required students to wash in a solution of chlorinated lime, which he chose because it removed the smell of the dissecting room and he reasoned that what removed the smell might remove the substance.",
          "He chose it because it removed the smell.",
        ),
        tfng(
          "He published his findings promptly after the intervention.",
          "FALSE",
          "He published his results late and badly organised, in a long and repetitive book that appeared thirteen years after the intervention.",
          "The book came thirteen years later.",
        ),
        tfng(
          "He reproduced his results after leaving Vienna.",
          "TRUE",
          "He was dismissed from his post, moved to Budapest, where he achieved the same results again, and was eventually committed to an asylum, where he died of an infected wound at the age of forty-seven.",
          "He 'achieved the same results again'.",
        ),
        tfng(
          "The writer thinks the demand for a mechanism was unreasonable.",
          "FALSE",
          "Part was intellectual: he had no theory of what the material was, germ theory being two decades away, and a claim of causation without a mechanism is genuinely weaker than one with it.",
          "The writer calls the weaker claim genuine.",
        ),
        tfng(
          "Semmelweis's book sold well in Germany.",
          "NOT GIVEN",
          "",
          "The passage describes the book but says nothing about its sales.",
        ),
        noteLine(
          WARD_NOTES,
          null,
          "First clinic staffed by medical ______ — mortality around ten per cent",
          "students",
          "The first clinic was staffed by medical students; the second by trainee midwives.",
          "Students staffed the first clinic.",
          { before: [{ text: "Two clinics, alternate admission days:", indent: 0 }] },
        ),
        noteLine(
          WARD_NOTES,
          null,
          "Second clinic, staffed by trainee midwives: around ______ per cent",
          "four",
          "In the second it was around four.",
          "The second clinic's rate was around four.",
        ),
        noteLine(
          WARD_NOTES,
          null,
          "Only the students performed ______ that morning",
          "autopsies",
          "What remained was the students, and what the students did that the midwives did not was perform autopsies in the morning and then examine women in labour without washing.",
          "Only the students did autopsies.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A colleague died after cutting his ______ during an autopsy.",
          "finger",
          "A colleague cut his finger during an autopsy and died of an illness whose progression, at post-mortem, was indistinguishable from puerperal fever.",
          "He cut his finger.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The alternating admission amounted to a natural ______.",
          "experiment",
          "Semmelweis had, in effect, a natural experiment with alternating admission, which is closer to a randomised trial than anything else in medicine at the time, and the strength of that design is why he was right.",
          "It was a natural experiment.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The writer concludes that a ______ can be decisive without a theory.",
          "comparison",
          "It is that a comparison can be decisive without a theory, and that the demand for a mechanism, though reasonable, is not a reason to keep doing the thing the comparison condemns.",
          "A comparison can be decisive alone.",
        ),
      ],
    },
    {
      key: "t91-p2-surgical-checklist",
      title: "The List on the Clipboard",
      topic: "borrowing a cockpit procedure for the operating theatre, and why it half worked",
      difficulty: 8,
      body: `A surgical safety checklist is a page of about twenty items read aloud at three moments: before anaesthesia, before the first incision, and before the patient leaves the room. The items are unremarkable. Confirm the patient's identity and the site of the operation. State any known allergy. Confirm that antibiotics have been given in the last hour. Have everybody in the room say their name and role. Count the instruments and swabs before closing. Nothing on the list is new information to anybody present, and that is the point that takes longest to accept: the list exists to make a team say out loud what it already knows.

The idea came from aviation, where written checklists have been standard since the 1930s, introduced after a bomber crash caused by a crew omitting a single step they knew perfectly well. Anneke Visser, a human-factors researcher, cautions that the transfer between the two settings is less clean than the borrowing implies. A cockpit has two people, a fixed sequence, and a machine that will not fly if a step is missed; an operating theatre has a dozen people from four professions, a procedure that changes as it proceeds, and no equivalent forcing function. She regards the checklist's success as evidence that the transfer worked anyway, and its unevenness as evidence that the differences matter.

The evidence for the effect was striking. A study published in 2009, covering eight hospitals in eight countries, reported that deaths after major surgery fell by nearly half and complications by a third after the checklist was introduced. The result was widely publicised and widely adopted; within a few years the checklist was mandatory in much of the world's surgery. An intervention that cost nothing, required no equipment and halved a mortality rate was, quite reasonably, treated as the most attractive finding in surgery for a generation.

Then came the replications, and they were mixed. Rowan Hendricks, an epidemiologist, has reviewed them and points out the pattern: where the checklist was introduced as part of a programme with training, observation and feedback, the effect appeared; where it was mandated and left to the ward, the effect was small or absent. The largest negative study, covering every hospital in a Canadian province, found no improvement at all following a compulsory rollout, and it was large enough that its null result could not be dismissed as a failure of statistical power. He argues that the sensible reading is not that the checklist does not work but that a checklist is not a treatment, and that studies comparing hospitals with and without the paper are measuring the wrong thing.

What the successful implementations appear to share is a change in who may speak. Leila Farouk, an anaesthetist, considers the naming step — each person in the room saying their name and role out loud — to be the active ingredient, because in most theatres a junior nurse does not address a senior surgeon spontaneously, and a person who has spoken once in a room finds it measurably easier to speak again. On this account the checklist works by flattening a hierarchy for ninety seconds, and its clinical content is partly a pretext.

That interpretation has a corollary that the enthusiasts dislike. Gustav Ekström, a surgeon who has observed hundreds of checklist performances, reports that the commonest failure mode is the ritual: the list is read at speed by one person while others continue working, boxes are ticked for steps that were not performed, and the pause never happens. He notes that this version takes ninety seconds and produces nothing, that it is difficult to detect from records because the paperwork is complete, and that a hospital with perfect checklist compliance figures may be doing none of it.

The general lesson has been absorbed slowly. A checklist does not replace expertise and is not meant to; it protects against the omission of a routine step under load, which is a failure mode of experts specifically, and it does so only if the team actually stops. The distinction between a procedure and the paper describing a procedure is easy to state and apparently very hard to hold on to in a busy institution, which is why the same intervention shows up in the literature as one of the most effective in modern surgery and as a null result, depending on who put it in.`,
      questions: [
        fromList(
          "matching_features",
          CHECKLIST_PEOPLE,
          "The two settings differ in ways that explain the uneven results.",
          "Anneke Visser",
          "She regards the checklist's success as evidence that the transfer worked anyway, and its unevenness as evidence that the differences matter.",
          "Visser reads the unevenness from the differences.",
        ),
        fromList(
          "matching_features",
          CHECKLIST_PEOPLE,
          "Comparing hospitals with and without the form measures the wrong thing.",
          "Rowan Hendricks",
          "He argues that the sensible reading is not that the checklist does not work but that a checklist is not a treatment, and that studies comparing hospitals with and without the paper are measuring the wrong thing.",
          "Hendricks names the measurement error.",
        ),
        fromList(
          "matching_features",
          CHECKLIST_PEOPLE,
          "Saying one's name aloud is what makes the difference.",
          "Leila Farouk",
          "Leila Farouk, an anaesthetist, considers the naming step — each person in the room saying their name and role out loud — to be the active ingredient, because in most theatres a junior nurse does not address a senior surgeon spontaneously, and a person who has spoken once in a room finds it measurably easier to speak again.",
          "Farouk calls naming the active ingredient.",
        ),
        fromList(
          "matching_features",
          CHECKLIST_PEOPLE,
          "Perfect compliance records can conceal a procedure never performed.",
          "Gustav Ekström",
          "He notes that this version takes ninety seconds and produces nothing, that it is difficult to detect from records because the paperwork is complete, and that a hospital with perfect checklist compliance figures may be doing none of it.",
          "Ekström describes the complete paperwork.",
        ),
        fromList(
          "summary_completion",
          CHECKLIST_BANK,
          "The list is read aloud at three moments and requires the team to ______.",
          "pause",
          "A checklist does not replace expertise and is not meant to; it protects against the omission of a routine step under load, which is a failure mode of experts specifically, and it does so only if the team actually stops.",
          "It works only if the team stops.",
        ),
        fromList(
          "summary_completion",
          CHECKLIST_BANK,
          "Everyone present states their ______ and role.",
          "names",
          "Have everybody in the room say their name and role.",
          "Names and roles are stated.",
        ),
        fromList(
          "summary_completion",
          CHECKLIST_BANK,
          "Any known ______ must be declared before anaesthesia.",
          "allergies",
          "State any known allergy.",
          "Allergies are declared.",
        ),
        fromList(
          "summary_completion",
          CHECKLIST_BANK,
          "The list appears to work by briefly flattening the theatre's ______.",
          "hierarchy",
          "On this account the checklist works by flattening a hierarchy for ninety seconds, and its clinical content is partly a pretext.",
          "It flattens a hierarchy.",
        ),
        fromList(
          "summary_completion",
          CHECKLIST_BANK,
          "The commonest failure is ______ boxes for steps nobody carried out.",
          "ticking",
          "Gustav Ekström, a surgeon who has observed hundreds of checklist performances, reports that the commonest failure mode is the ritual: the list is read at speed by one person while others continue working, boxes are ticked for steps that were not performed, and the pause never happens.",
          "Boxes are ticked regardless.",
        ),
        mcq(
          "What prompted the adoption of checklists in aviation?",
          [
            "A crash caused by an omitted step",
            "A regulation introduced in the 1930s",
            "The complexity of new instruments",
            "A shortage of trained crews",
          ],
          "A crash caused by an omitted step",
          "The idea came from aviation, where written checklists have been standard since the 1930s, introduced after a bomber crash caused by a crew omitting a single step they knew perfectly well.",
          "A single omitted step caused the crash.",
        ),
        mcq(
          "What distinguished studies that found an effect?",
          [
            "The checklist came with training and feedback",
            "The hospitals were in wealthier countries",
            "Compliance was recorded electronically",
            "Only major surgery was included",
          ],
          "The checklist came with training and feedback",
          "Rowan Hendricks, an epidemiologist, has reviewed them and points out the pattern: where the checklist was introduced as part of a programme with training, observation and feedback, the effect appeared; where it was mandated and left to the ward, the effect was small or absent.",
          "Training and feedback made the difference.",
        ),
        mcq(
          "Whose errors is a checklist designed to catch?",
          [
            "Those of experts working under load",
            "Those of inexperienced staff",
            "Those caused by faulty equipment",
            "Those arising from poor records",
          ],
          "Those of experts working under load",
          "A checklist does not replace expertise and is not meant to; it protects against the omission of a routine step under load, which is a failure mode of experts specifically, and it does so only if the team actually stops.",
          "It targets a failure mode of experts.",
        ),
        mcq(
          "Why does the same intervention appear as both a success and a null result?",
          [
            "It depends on how it was implemented",
            "The outcome measures differ between countries",
            "The original study was later retracted",
            "Surgeons report results selectively",
          ],
          "It depends on how it was implemented",
          "The distinction between a procedure and the paper describing a procedure is easy to state and apparently very hard to hold on to in a busy institution, which is why the same intervention shows up in the literature as one of the most effective in modern surgery and as a null result, depending on who put it in.",
          "It depends on who put it in.",
        ),
      ],
    },
    {
      key: "t91-p3-organoids",
      title: "Growing Tissue Instead of Testing on Animals",
      topic: "small self-organising structures that answer some questions and not others",
      difficulty: 9,
      body: `A) An organoid is a three-dimensional piece of tissue grown in a dish from stem cells, which arranges itself into something resembling a simplified organ. Given the right chemical signals and a supporting gel, intestinal stem cells form a hollow structure with the crypts and villi of a real gut; brain-derived cells form layered structures containing several cortical cell types in roughly the right relationship; kidney cells form filtering units. Nobody instructs the cells where to go. The arrangement is the cells' own, which is the single most surprising fact about the technique and the reason it works at all.

B) The motivation was a failure rate. A drug that has passed animal testing still has a high probability of failing in human trials, and the commonest reasons are that it does not work in people or that it is toxic to them in a way the animal did not predict. Mouse and human tissue differ in the details of metabolism, immune response and receptor distribution, and the differences are not systematic enough to correct for. A human tissue model, made from human cells and in some cases from a specific patient's cells, addresses that gap directly.

C) The applications where the method has already changed practice are narrow and real. Cystic fibrosis is caused by mutations in a single gene, and the effect of a candidate drug on the affected channel can be measured in an intestinal organoid grown from a patient's own cells. Because the mutation is rare in some of its forms, a clinical trial for a given variant may be impossible for want of patients; a test in that patient's own tissue is available instead, and several health systems now fund treatment on the strength of such a test. That is individualised medicine in a sense the phrase usually fails to earn.

D) The limitations are structural rather than incidental. An organoid has no blood vessels, so nutrients reach it only by diffusion, which caps its size at roughly a millimetre and means the interior of a larger one dies. It has no immune cells unless they are deliberately added, so any disease process involving inflammation is missing its principal actor. It has no connection to other organs, so a compound that is harmless until the liver converts it into something harmful will appear harmless. And it has no nerves, no blood pressure and no behaviour, which rules out whole categories of question.

E) There is also a reproducibility problem that the field discusses candidly. Because the cells organise themselves, no two organoids are identical, and the variation between batches grown by the same laboratory from the same cells is substantial. This is tolerable for questions about mechanism, where a qualitative difference between treated and untreated tissue is the finding. It is a serious obstacle for questions about dose, where a number is required and the number must be stable. Efforts to standardise — engineered scaffolds, defined media, automated imaging — have reduced the variation without eliminating it, and some of the variation may be intrinsic to a process that is genuinely self-directed.

F) The regulatory position is the slowest-moving part. Safety testing requirements for new drugs are written into law in most jurisdictions and in several of them specify animal studies. A sponsor who believes an organoid panel is more informative than a rodent study must still do the rodent study, because the law requires it, and the panel becomes an addition to the cost rather than a replacement for it. Several regulators have begun to accept non-animal data for specific purposes, and legislation in a few places now directs agencies to reduce animal requirements where validated alternatives exist. Validation, in this context, means demonstrating that the new method predicts human outcomes at least as well as the old one, which is difficult partly because the old one predicts them poorly and nobody wishes to say so in a statute.

G) The honest summary is that organoids are not a replacement for animal testing and were oversold as one. They are a new kind of experimental material that is better than any previous cell culture at questions of human tissue mechanism, worse than an animal at questions involving whole-body physiology, and unique in allowing a specific person's tissue to be tested before that person is treated. Each of those three statements is an important result. Only the third is what the field is usually reported as promising.`,
      questions: [
        fromList(
          "matching_information",
          ORGANOID_PARAGRAPHS,
          "a treatment funded on the basis of a test in one patient's tissue",
          "C",
          "Because the mutation is rare in some of its forms, a clinical trial for a given variant may be impossible for want of patients; a test in that patient's own tissue is available instead, and several health systems now fund treatment on the strength of such a test.",
          "Paragraph C describes the funded individual test.",
        ),
        fromList(
          "matching_information",
          ORGANOID_PARAGRAPHS,
          "the difficulty of proving a new method better than a poor old one",
          "F",
          "Validation, in this context, means demonstrating that the new method predicts human outcomes at least as well as the old one, which is difficult partly because the old one predicts them poorly and nobody wishes to say so in a statute.",
          "Paragraph F sets out the validation paradox.",
        ),
        fromList(
          "matching_information",
          ORGANOID_PARAGRAPHS,
          "variation between samples grown from identical starting material",
          "E",
          "Because the cells organise themselves, no two organoids are identical, and the variation between batches grown by the same laboratory from the same cells is substantial.",
          "Paragraph E describes the batch variation.",
        ),
        fromList(
          "matching_information",
          ORGANOID_PARAGRAPHS,
          "why animal results fail to predict human ones reliably",
          "B",
          "Mouse and human tissue differ in the details of metabolism, immune response and receptor distribution, and the differences are not systematic enough to correct for.",
          "Paragraph B explains the unsystematic differences.",
        ),
        fromList(
          "matching_information",
          ORGANOID_PARAGRAPHS,
          "the observation that the cells arrange themselves unprompted",
          "A",
          "The arrangement is the cells' own, which is the single most surprising fact about the technique and the reason it works at all.",
          "Paragraph A notes the self-arrangement.",
        ),
        ynng(
          "The writer thinks organoids were presented as more than they are.",
          "YES",
          "The honest summary is that organoids are not a replacement for animal testing and were oversold as one.",
          "They 'were oversold as one'.",
        ),
        ynng(
          "The writer believes batch variation can be engineered away completely.",
          "NO",
          "Efforts to standardise — engineered scaffolds, defined media, automated imaging — have reduced the variation without eliminating it, and some of the variation may be intrinsic to a process that is genuinely self-directed.",
          "It has been reduced, not eliminated.",
        ),
        ynng(
          "The writer regards current animal-testing law as an obstacle to better testing.",
          "YES",
          "A sponsor who believes an organoid panel is more informative than a rodent study must still do the rodent study, because the law requires it, and the panel becomes an addition to the cost rather than a replacement for it.",
          "The law compels the less informative study.",
        ),
        ynng(
          "The writer thinks the cystic fibrosis application deserves the name individualised medicine.",
          "YES",
          "That is individualised medicine in a sense the phrase usually fails to earn.",
          "It earns the phrase.",
        ),
        fromList(
          "matching_sentence_endings",
          ORGANOID_ENDINGS,
          "The tissue cannot be grown beyond a small size,",
          "because a structure with no blood supply cannot grow beyond a millimetre or so.",
          "An organoid has no blood vessels, so nutrients reach it only by diffusion, which caps its size at roughly a millimetre and means the interior of a larger one dies.",
          "Diffusion sets the size limit.",
        ),
        fromList(
          "matching_sentence_endings",
          ORGANOID_ENDINGS,
          "Inflammatory disease cannot be modelled in the dish,",
          "because an immune system is the one component the dish does not contain.",
          "It has no immune cells unless they are deliberately added, so any disease process involving inflammation is missing its principal actor.",
          "The principal actor is absent.",
        ),
        fromList(
          "matching_sentence_endings",
          ORGANOID_ENDINGS,
          "The variation between samples is tolerable for some purposes,",
          "which is why the tissue answers questions about mechanism rather than about dose.",
          "This is tolerable for questions about mechanism, where a qualitative difference between treated and untreated tissue is the finding.",
          "Mechanism tolerates variation; dose does not.",
        ),
        fromList(
          "matching_sentence_endings",
          ORGANOID_ENDINGS,
          "A rodent study is performed even when it is thought less informative,",
          "which makes the regulatory question harder than the biological one.",
          "Safety testing requirements for new drugs are written into law in most jurisdictions and in several of them specify animal studies.",
          "The requirement is written into law.",
        ),
        fromList(
          "matching_sentence_endings",
          ORGANOID_ENDINGS,
          "A gut organoid develops crypts and villi,",
          "although the cells organise themselves without being told where to go.",
          "Given the right chemical signals and a supporting gel, intestinal stem cells form a hollow structure with the crypts and villi of a real gut; brain-derived cells form layered structures containing several cortical cell types in roughly the right relationship; kidney cells form filtering units.",
          "The structure forms without instruction.",
        ),
      ],
    },
  ],
};
