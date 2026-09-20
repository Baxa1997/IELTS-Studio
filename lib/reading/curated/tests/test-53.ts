import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · industrial chemistry · notes box --------------------------

const MATCH_NOTES = {
  title: "How the safety match was divided",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · palaeoclimate · people and a word bank --------------------

const ICE_PEOPLE = ["Ingrid Sørensen", "Daniel Mwangi", "Claudia Bertoli", "Sam Whitlock"];
const ICE_BANK = [
  "bubbles",
  "dust",
  "layers",
  "pressure",
  "ash",
  "salt",
  "drill",
  "meltwater",
  "isotopes",
];

// ---- Passage 3 · medical research debate · lettered paragraphs -------------

const PLACEBO_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PLACEBO_ENDINGS = [
  "even though the patients had been told exactly what they were taking.",
  "because the condition is one that can be measured only by asking the patient.",
  "although the effect disappeared once the trial was unblinded.",
  "which is why the ritual surrounding a treatment may matter as much as its content.",
  "because no ethics committee would now approve the original design.",
  "which they had been told, in writing, contained nothing active.",
  "and the enthusiasm has run ahead of the mechanistic evidence.",
];

export const TEST_53: CuratedTest = {
  key: "full-test-53",
  targetBand: 7,
  passages: [
    {
      key: "t53-p1-safety-match",
      title: "Striking Only on the Box",
      topic: "the chemistry and the working conditions behind the modern match",
      difficulty: 6,
      body: `The first friction match was sold in England in 1827 by a chemist who had discovered, apparently by accident, that a mixture of potassium chlorate and antimony sulphide scraped across a rough surface would burst into flame. He called them Congreves, sold them in tins of fifty with a folded strip of sandpaper, and did not patent the idea. Within a decade the friction match was being made across Europe, and the formula had changed. The addition of white phosphorus made a match that lit more easily, burned more reliably and could be struck on almost anything — a wall, a boot, a table — which was precisely what customers wanted.

White phosphorus is also a poison of a particularly unpleasant kind. Workers who breathed its vapour for months developed pain and swelling in the jaw, and then a progressive destruction of the bone which surgeons of the period could treat only by removing the jaw entirely. The condition was named phosphorus necrosis and known in the trade by a blunter phrase. It was almost entirely an industrial disease, concentrated in the dipping rooms where match heads were coated, and it fell overwhelmingly on young women, who made up most of the workforce.

The chemistry of an alternative had been known since 1844, when a Swedish chemist demonstrated that red phosphorus, a different and far less toxic form of the same element, could be used instead — but not in the match head. Red phosphorus does not ignite from friction alone in the way white phosphorus does. The solution was to separate the reaction across two surfaces. The head of the match carries an oxidising agent, potassium chlorate, together with sulphur and a binder. The striking strip on the side of the box carries the red phosphorus, mixed with powdered glass to provide the friction. Drawing the head across the strip converts a trace of red phosphorus to white by the heat of friction, that trace ignites, and the flame is passed to the chlorate in the head.

The result was a match that was safe to make and that could not be lit by dragging it across a bedroom wall. It was also more expensive, slightly harder to strike, and useless without its own box. Consumers preferred the old kind, and manufacturers, competing on price, had every reason to keep making them. The safety match was invented in 1844 and commercially available from the 1850s, yet white phosphorus matches remained the dominant product in Britain for another fifty years.

What ended them was neither chemistry nor consumer choice. In 1888 the women and girls employed at a large London match factory walked out, initially over the dismissal of a colleague, and the strike drew attention to the wages, the fines and above all the disease. The strike was settled within a fortnight and the disease was not, but the public argument had begun. Campaigners bought shares in order to speak at company meetings; doctors published case series; a rival manufacturer that had already converted to the safe formula advertised the fact. Britain finally prohibited white phosphorus in matches in 1908, following an international convention signed at Berne two years earlier, which several countries adopted in the same period.

The Berne convention is now cited as an early example of an international agreement on an occupational health question, and it worked in an unusual way. Because the trade in matches was international, a country that banned white phosphorus alone would simply have imported cheaper matches made elsewhere, and its own manufacturers said so loudly. Agreeing the ban across the main producing countries at once removed that objection, and it was the mechanism, rather than the strength of any national campaign, that made prohibition possible.

There is a detail in the timing that is worth holding on to. The safe formula existed for more than sixty years before it was made compulsory, and during those sixty years the disease it prevented was described in medical journals, debated in Parliament and known to every manufacturer in the trade. Nothing new had to be discovered. What had to change was the calculation each firm made about the price of its product against the health of the people who made it, and that calculation changed only when the law changed it.

The match itself has since become a minor object. Cigarette lighters, gas ignition and electric stoves have taken most of its work, and world production has fallen steadily since the middle of the twentieth century. But the box in a kitchen drawer is still built on the 1844 division, and the reason the head will not light on the wall is the reason the people who made it kept their jaws.`,
      questions: [
        tfng(
          "The inventor of the friction match protected his invention with a patent.",
          "FALSE",
          "He called them Congreves, sold them in tins of fifty with a folded strip of sandpaper, and did not patent the idea.",
          "He 'did not patent the idea'.",
        ),
        tfng(
          "White phosphorus matches were popular because they could be struck anywhere.",
          "TRUE",
          "The addition of white phosphorus made a match that lit more easily, burned more reliably and could be struck on almost anything — a wall, a boot, a table — which was precisely what customers wanted.",
          "That was 'precisely what customers wanted'.",
        ),
        tfng(
          "Phosphorus necrosis affected men and women in roughly equal numbers.",
          "FALSE",
          "It was almost entirely an industrial disease, concentrated in the dipping rooms where match heads were coated, and it fell overwhelmingly on young women, who made up most of the workforce.",
          "It fell 'overwhelmingly on young women'.",
        ),
        tfng(
          "Red phosphorus can be ignited by friction as easily as white phosphorus.",
          "FALSE",
          "Red phosphorus does not ignite from friction alone in the way white phosphorus does.",
          "It 'does not ignite from friction alone'.",
        ),
        tfng(
          "The safety match was more difficult to sell than the older kind.",
          "TRUE",
          "It was also more expensive, slightly harder to strike, and useless without its own box.",
          "It was dearer, harder to strike and needed its box.",
        ),
        tfng(
          "The 1888 strike was called specifically to demand a ban on white phosphorus.",
          "FALSE",
          "In 1888 the women and girls employed at a large London match factory walked out, initially over the dismissal of a colleague, and the strike drew attention to the wages, the fines and above all the disease.",
          "It began 'over the dismissal of a colleague'.",
        ),
        tfng(
          "Match production has continued to grow since the middle of the twentieth century.",
          "FALSE",
          "Cigarette lighters, gas ignition and electric stoves have taken most of its work, and world production has fallen steadily since the middle of the twentieth century.",
          "Production 'has fallen steadily'.",
        ),
        noteLine(
          MATCH_NOTES,
          null,
          "The head holds potassium chlorate, a binder and ______",
          "sulphur",
          "The head of the match carries an oxidising agent, potassium chlorate, together with sulphur and a binder.",
          "The head carries 'sulphur and a binder' with the chlorate.",
        ),
        noteLine(
          MATCH_NOTES,
          null,
          "The strip on the box holds red phosphorus mixed with powdered ______",
          "glass",
          "The striking strip on the side of the box carries the red phosphorus, mixed with powdered glass to provide the friction.",
          "It is 'mixed with powdered glass'.",
          { before: [{ text: "The reaction is split across two surfaces:", indent: 0 }] },
        ),
        noteLine(
          MATCH_NOTES,
          null,
          "Striking converts a little red phosphorus to white using the heat of ______",
          "friction",
          "Drawing the head across the strip converts a trace of red phosphorus to white by the heat of friction, that trace ignites, and the flame is passed to the chlorate in the head.",
          "The conversion happens 'by the heat of friction'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Workers exposed to the vapour suffered destruction of the ______.",
          "jaw",
          "Workers who breathed its vapour for months developed pain and swelling in the jaw, and then a progressive destruction of the bone which surgeons of the period could treat only by removing the jaw entirely.",
          "The disease destroyed the bone of the jaw.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Britain banned white phosphorus in matches in ______.",
          "1908",
          "Britain finally prohibited white phosphorus in matches in 1908, following an international convention signed at Berne two years earlier, which several countries adopted in the same period.",
          "The prohibition came in 1908.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "An agreement covering all the main producing countries removed the manufacturers' ______.",
          "objection",
          "Agreeing the ban across the main producing countries at once removed that objection, and it was the mechanism, rather than the strength of any national campaign, that made prohibition possible.",
          "The joint ban 'removed that objection'.",
        ),
      ],
    },
    {
      key: "t53-p2-ice-cores",
      title: "Reading the Ice",
      topic: "what a cylinder of Antarctic ice records about the ancient atmosphere",
      difficulty: 7,
      body: `Snow that falls on the high plateau of East Antarctica does not melt. It is buried by the snow of the following year, compressed by the weight above it, and over a few decades the spaces between the grains close up, trapping the air that was in them. The result is a continuous archive in which each depth corresponds to a date and each trapped bubble is a sample of the atmosphere at that date. A core drilled from the top of the sheet to the bedrock, three kilometres below, can reach back most of a million years.

Extracting it is a slow industrial operation. A hollow drill cuts a cylinder about ten centimetres across and three metres long, which is hauled to the surface, logged, cut and shipped frozen. Ingrid Sørensen, a glaciologist who has run drilling seasons on three cores, says the difficulty is not the depth but the fragility of the record. Below about a kilometre the ice is under enormous pressure, and a core brought quickly to the surface can shatter as the trapped gas expands, a problem solved only by letting the sections rest for a year before they are cut.

Dating the ice is the first task. Near the surface the annual layers can be counted, like tree rings, because summer and winter snow differ in the size of their crystals and in the dust they carry. Deeper down the layers thin under compression until they are too fine to distinguish, and dating then depends on matching features between cores and on modelling how ice flows. Daniel Mwangi, who works on these age scales, emphasises that every result from a deep core carries an uncertainty in its date that grows with depth, and that comparisons between records from different continents live or die on how well those uncertainties are handled.

What the bubbles have shown is the most cited result in the field. Air trapped in Antarctic ice records the concentration of carbon dioxide and methane in the atmosphere at the time of trapping, and through eight complete glacial cycles the two gases rise and fall with temperature in a relationship that is close and consistent. Carbon dioxide moved between about 180 parts per million in the coldest periods and about 280 in the warmest, and never, in the whole of that record, exceeded 300. The present concentration is well above 400.

Claudia Bertoli, an atmospheric chemist, is careful about how that comparison is drawn. The ice shows what the range was, she says, and shows that the current level is outside it; what it cannot show on its own is how fast the system responds, because the gas in a bubble is always younger than the ice around it by a period that depends on how quickly the snow compacted at that site. On the coldest, driest parts of the plateau, where snowfall is slight, that offset can be several thousand years.

The layers carry a second archive alongside the gas. Volcanic eruptions leave a thin band of sulphate that can be matched between cores and, where the eruption is known from historical records, provides a fixed date. Dust blown from dry continents records how arid the world was. Sea salt records the extent of sea ice. The relative abundance of oxygen isotopes in the water molecules of the ice itself records the temperature at which the snow originally formed, which is what allows the temperature curve to be drawn at all.

Sam Whitlock, who has argued for a decade for a core reaching back one and a half million years, points out what the existing records cannot settle. Around a million years ago the rhythm of the ice ages changed, from a cycle of roughly forty thousand years to one of roughly a hundred thousand, and nobody knows why. The gas record does not extend far enough back to say whether carbon dioxide changed at the same time. A site with old ice near the surface has now been identified, and drilling is under way.

The archive has a limit that is easy to forget. It exists only where ice has been accumulating undisturbed for a very long time, which means two ice sheets and a handful of high mountain glaciers. Everything the bubbles say about the ancient atmosphere is said from those few places, and the confidence placed in it rests on how consistently the separate cores agree.`,
      questions: [
        fromList(
          "matching_features",
          ICE_PEOPLE,
          "Cores must be allowed to rest before they can be cut up.",
          "Ingrid Sørensen",
          "Below about a kilometre the ice is under enormous pressure, and a core brought quickly to the surface can shatter as the trapped gas expands, a problem solved only by letting the sections rest for a year before they are cut.",
          "Sørensen describes the year of resting.",
        ),
        fromList(
          "matching_features",
          ICE_PEOPLE,
          "Comparing records from different places depends on handling dating errors well.",
          "Daniel Mwangi",
          "Daniel Mwangi, who works on these age scales, emphasises that every result from a deep core carries an uncertainty in its date that grows with depth, and that comparisons between records from different continents live or die on how well those uncertainties are handled.",
          "Mwangi makes the point about uncertainties.",
        ),
        fromList(
          "matching_features",
          ICE_PEOPLE,
          "Trapped air is always younger than the ice surrounding it.",
          "Claudia Bertoli",
          "The ice shows what the range was, she says, and shows that the current level is outside it; what it cannot show on its own is how fast the system responds, because the gas in a bubble is always younger than the ice around it by a period that depends on how quickly the snow compacted at that site.",
          "Bertoli explains the age offset.",
        ),
        fromList(
          "matching_features",
          ICE_PEOPLE,
          "A much older core is needed to answer a question about the ice ages.",
          "Sam Whitlock",
          "Sam Whitlock, who has argued for a decade for a core reaching back one and a half million years, points out what the existing records cannot settle.",
          "Whitlock wants a 1.5-million-year core.",
        ),
        fromList(
          "summary_completion",
          ICE_BANK,
          "Air becomes sealed into ______ as the spaces between the snow grains close.",
          "bubbles",
          "It is buried by the snow of the following year, compressed by the weight above it, and over a few decades the spaces between the grains close up, trapping the air that was in them.",
          "The closing spaces trap air as bubbles.",
        ),
        fromList(
          "summary_completion",
          ICE_BANK,
          "Near the top of a core the annual ______ can be counted individually.",
          "layers",
          "Near the surface the annual layers can be counted, like tree rings, because summer and winter snow differ in the size of their crystals and in the dust they carry.",
          "'The annual layers can be counted'.",
        ),
        fromList(
          "summary_completion",
          ICE_BANK,
          "Bands of sulphate from eruptions, and ______ blown from dry land, both leave a signal.",
          "dust",
          "Dust blown from dry continents records how arid the world was.",
          "Dust from dry continents is one of the signals.",
        ),
        fromList(
          "summary_completion",
          ICE_BANK,
          "The temperature at which the snow formed is read from oxygen ______.",
          "isotopes",
          "The relative abundance of oxygen isotopes in the water molecules of the ice itself records the temperature at which the snow originally formed, which is what allows the temperature curve to be drawn at all.",
          "Oxygen isotopes record the formation temperature.",
        ),
        fromList(
          "summary_completion",
          ICE_BANK,
          "Deep ice is difficult to recover intact because of the ______ it has been under.",
          "pressure",
          "Below about a kilometre the ice is under enormous pressure, and a core brought quickly to the surface can shatter as the trapped gas expands, a problem solved only by letting the sections rest for a year before they are cut.",
          "The ice is 'under enormous pressure'.",
        ),
        mcq(
          "How far back can a core drilled to bedrock reach?",
          [
            "Most of a million years",
            "About one and a half million years",
            "Roughly a hundred thousand years",
            "As far as the age of the continent",
          ],
          "Most of a million years",
          "A core drilled from the top of the sheet to the bedrock, three kilometres below, can reach back most of a million years.",
          "It reaches 'most of a million years'.",
        ),
        mcq(
          "What does the passage say about carbon dioxide in the ice record?",
          [
            "It never rose above 300 parts per million",
            "It varied independently of temperature",
            "It was measured only in the most recent cycle",
            "It fell steadily through the last eight cycles",
          ],
          "It never rose above 300 parts per million",
          "Carbon dioxide moved between about 180 parts per million in the coldest periods and about 280 in the warmest, and never, in the whole of that record, exceeded 300.",
          "It 'never … exceeded 300'.",
        ),
        mcq(
          "What changed about a million years ago?",
          [
            "The length of the cycle between ice ages",
            "The concentration of methane in the atmosphere",
            "The rate at which snow accumulated in Antarctica",
            "The extent of sea ice around the continent",
          ],
          "The length of the cycle between ice ages",
          "Around a million years ago the rhythm of the ice ages changed, from a cycle of roughly forty thousand years to one of roughly a hundred thousand, and nobody knows why.",
          "The cycle went from 40,000 to 100,000 years.",
        ),
        mcq(
          "What limitation does the passage identify at the end?",
          [
            "The archive exists in very few places",
            "Older cores are too fragile to analyse",
            "Only two gases can be measured reliably",
            "Drilling damages the ice sheet itself",
          ],
          "The archive exists in very few places",
          "It exists only where ice has been accumulating undisturbed for a very long time, which means two ice sheets and a handful of high mountain glaciers.",
          "Only two ice sheets and a few glaciers qualify.",
        ),
      ],
    },
    {
      key: "t53-p3-open-placebo",
      title: "The Placebo That Tells the Truth",
      topic: "whether a dummy treatment has to be a deception to work",
      difficulty: 8,
      body: `A) The placebo effect is usually explained as a consequence of belief. A patient who thinks they are receiving an active treatment improves partly because of that expectation, which is why the double-blind trial exists: neither patient nor clinician knows who has the drug, and the difference between the groups is taken to be what the drug itself does. On that account the effect depends entirely on the patient being misled, and it therefore has no legitimate place in ordinary practice, where deceiving patients is not permitted.

B) A series of trials over the past fifteen years has made that account difficult to maintain. In the best known of them, patients with irritable bowel syndrome were randomly assigned either to no treatment or to a course of pills they were told, explicitly and in writing, were inert. The bottles were labelled "placebo". The researchers explained that placebos often produce measurable improvement through automatic processes, that the patients should not expect any drug effect, and that they should take the pills twice daily regardless. The open-label placebo group reported significantly greater relief than the group given nothing, and the finding has since been replicated in chronic back pain, cancer-related fatigue and allergic rhinitis.

C) There are good reasons to be cautious about what this shows. Every condition in that list is one whose severity is established by asking the patient how they feel, and a patient who has been enrolled in a study of a promising idea, seen regularly by sympathetic staff and given a task to perform twice a day has several reasons to report improvement that have nothing to do with the pills. The trials also compare an active procedure against doing nothing at all, which is a weak comparison: any ritual, offered with attention, would be expected to beat an empty control.

D) The stronger version of the argument therefore rests on mechanism rather than on the trials alone. Placebo responses have been shown to involve identifiable physiological pathways — the release of endogenous opioids in some forms of pain relief, dopamine activity in Parkinson's disease — and those responses can be blocked by drugs that block the pathway. A response that can be chemically abolished is not simply a reporting artefact. Whether those same pathways are engaged when the patient knows the pill is inert is the question the field has not yet answered, and until it does, the open-label results remain suggestive rather than established.

E) The practical interest is obvious. If a substantial part of the benefit of some treatments can be obtained honestly, from an inert pill given with a clear explanation, then a number of conditions currently managed with drugs that carry real risks could in principle be managed with something that carries none. Trials in which an open-label placebo has been used to reduce the dose of an opioid, rather than to replace it, have produced encouraging results, and that hybrid use may prove more important than the pure form.

F) There is a deeper implication for how treatment is understood. If the ritual surrounding a treatment — the consultation, the examination, the act of taking something at a fixed time each day — does part of the work, then those elements are not the packaging around the medicine but a component of it, and the long decline in the time a clinician spends with a patient has a cost that does not appear in any drug trial. That argument is old, and has usually been made by people with a professional interest in making it. The open-label results give it an evidential basis it previously lacked.

G) My own view is that the field is at the stage where it is easy to overclaim. The effects measured are real but modest, they are concentrated in symptoms that are reported rather than measured, and the enthusiasm surrounding them has run some distance ahead of the mechanistic evidence. That is not a reason to dismiss the work; it is a reason to want the next round of trials to compare open-label placebo against an active control rather than against nothing, and to include at least one outcome that does not depend on the patient's own account.`,
      questions: [
        fromList(
          "matching_information",
          PLACEBO_PARAGRAPHS,
          "a description of what patients were told before taking the pills",
          "B",
          "The researchers explained that placebos often produce measurable improvement through automatic processes, that the patients should not expect any drug effect, and that they should take the pills twice daily regardless.",
          "Paragraph B reports the explanation given.",
        ),
        fromList(
          "matching_information",
          PLACEBO_PARAGRAPHS,
          "evidence that placebo responses have a chemical basis",
          "D",
          "Placebo responses have been shown to involve identifiable physiological pathways — the release of endogenous opioids in some forms of pain relief, dopamine activity in Parkinson's disease — and those responses can be blocked by drugs that block the pathway.",
          "Paragraph D describes the blockable pathways.",
        ),
        fromList(
          "matching_information",
          PLACEBO_PARAGRAPHS,
          "the writer's recommendation for how future studies should be designed",
          "G",
          "That is not a reason to dismiss the work; it is a reason to want the next round of trials to compare open-label placebo against an active control rather than against nothing, and to include at least one outcome that does not depend on the patient's own account.",
          "Paragraph G sets out the design the writer wants.",
        ),
        fromList(
          "matching_information",
          PLACEBO_PARAGRAPHS,
          "a reason why the effect was traditionally thought unusable in practice",
          "A",
          "On that account the effect depends entirely on the patient being misled, and it therefore has no legitimate place in ordinary practice, where deceiving patients is not permitted.",
          "Paragraph A explains the deception objection.",
        ),
        fromList(
          "matching_information",
          PLACEBO_PARAGRAPHS,
          "a possible use that combines a placebo with an existing drug",
          "E",
          "Trials in which an open-label placebo has been used to reduce the dose of an opioid, rather than to replace it, have produced encouraging results, and that hybrid use may prove more important than the pure form.",
          "Paragraph E describes the hybrid use.",
        ),
        ynng(
          "The writer accepts that the open-label trials used a demanding comparison group.",
          "NO",
          "The trials also compare an active procedure against doing nothing at all, which is a weak comparison: any ritual, offered with attention, would be expected to beat an empty control.",
          "The writer calls it 'a weak comparison'.",
        ),
        ynng(
          "The writer thinks placebo responses can be dismissed as inaccurate reporting.",
          "NO",
          "A response that can be chemically abolished is not simply a reporting artefact.",
          "A blockable response 'is not simply a reporting artefact'.",
        ),
        ynng(
          "The writer believes the argument about consultation time now has better support.",
          "YES",
          "The open-label results give it an evidential basis it previously lacked.",
          "They give the old argument 'an evidential basis it previously lacked'.",
        ),
        ynng(
          "The writer considers current enthusiasm for the field to be justified by the evidence.",
          "NO",
          "The effects measured are real but modest, they are concentrated in symptoms that are reported rather than measured, and the enthusiasm surrounding them has run some distance ahead of the mechanistic evidence.",
          "Enthusiasm 'has run some distance ahead of the mechanistic evidence'.",
        ),
        fromList(
          "matching_sentence_endings",
          PLACEBO_ENDINGS,
          "The bowel syndrome trial produced a measurable benefit",
          "even though the patients had been told exactly what they were taking.",
          "The open-label placebo group reported significantly greater relief than the group given nothing, and the finding has since been replicated in chronic back pain, cancer-related fatigue and allergic rhinitis.",
          "Patients knew the pills were inert and still improved.",
        ),
        fromList(
          "matching_sentence_endings",
          PLACEBO_ENDINGS,
          "The choice of conditions studied weakens the conclusion,",
          "because the condition is one that can be measured only by asking the patient.",
          "Every condition in that list is one whose severity is established by asking the patient how they feel, and a patient who has been enrolled in a study of a promising idea, seen regularly by sympathetic staff and given a task to perform twice a day has several reasons to report improvement that have nothing to do with the pills.",
          "Severity is 'established by asking the patient how they feel'.",
        ),
        fromList(
          "matching_sentence_endings",
          PLACEBO_ENDINGS,
          "Parts of a treatment once dismissed as incidental may be active,",
          "which is why the ritual surrounding a treatment may matter as much as its content.",
          "If the ritual surrounding a treatment — the consultation, the examination, the act of taking something at a fixed time each day — does part of the work, then those elements are not the packaging around the medicine but a component of it, and the long decline in the time a clinician spends with a patient has a cost that does not appear in any drug trial.",
          "The ritual is 'a component of it', not packaging.",
        ),
        fromList(
          "matching_sentence_endings",
          PLACEBO_ENDINGS,
          "One trial assigned patients either to nothing or to pills,",
          "which they had been told, in writing, contained nothing active.",
          "In the best known of them, patients with irritable bowel syndrome were randomly assigned either to no treatment or to a course of pills they were told, explicitly and in writing, were inert.",
          "Neither arm received an active drug.",
        ),
        fromList(
          "matching_sentence_endings",
          PLACEBO_ENDINGS,
          "The measured effects are real but limited,",
          "and the enthusiasm has run ahead of the mechanistic evidence.",
          "The effects measured are real but modest, they are concentrated in symptoms that are reported rather than measured, and the enthusiasm surrounding them has run some distance ahead of the mechanistic evidence.",
          "Enthusiasm has outrun the mechanistic evidence.",
        ),
      ],
    },
  ],
};
