import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · archives and materials · flow-chart ------------------------

const DECAY_STEPS = {
  title: "Stages of nitrate decay",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · glaciology · people and a word bank -----------------------

const LAKE_PEOPLE = ["Thora Jonsdottir", "Malik Osei", "Vera Lindholm", "Chen Ruogu"];
const LAKE_BANK = [
  "insulator",
  "pressure",
  "friction",
  "radar",
  "kerosene",
  "minerals",
  "protocols",
  "drainage",
  "sediment",
];

// ---- Passage 3 · law and evidence · lettered paragraphs --------------------

const FORENSIC_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const FORENSIC_ENDINGS = [
  "because skin distorts and the impression alters within hours.",
  "although the chemistry of the measurement itself was never in doubt.",
  "which is why a later judge is deciding whether to depart from practice.",
  "since the field whose acceptance is asked for consists of the practitioners.",
  "because the language of certainty claims more than any comparison supports.",
  "which the writer regards as the same fault repeated one level higher.",
  "even though the tested error rate proved low rather than absent.",
];

export const TEST_74: CuratedTest = {
  key: "full-test-74",
  targetBand: 8,
  passages: [
    {
      key: "t74-p1-film-preservation",
      title: "The Film That Destroys Itself",
      topic: "why most early cinema no longer exists and what keeping the rest requires",
      difficulty: 7,
      body: `For the first half of the twentieth century, cinema was printed on cellulose nitrate. It is an excellent material for the purpose — clear, strong, and with an image quality later plastics did not match — and it has two defects. It burns fiercely, supplying its own oxygen, so that a nitrate fire cannot be smothered and continues under water. And it decays, slowly and unstoppably, into a substance that no longer holds an image.

The decay proceeds in recognised stages. The film first develops a faint smell of nitric acid and the image begins to fade at the edges; the base then becomes sticky and the layers adhere to one another; the material softens into an amber mass; and finally it reduces to a brown powder. The process is autocatalytic — the products of decomposition accelerate further decomposition — so a reel deteriorating in a sealed can deteriorates faster than one in open air, and a single decaying reel will damage the reels stored next to it.

The result is that an unusually large proportion of the medium's first fifty years no longer exists. Estimates for the silent period, necessarily approximate, put the loss at around three-quarters of everything made, and for some national industries the figure is higher. The losses were not distributed at random. A film that had made money was reprinted, circulated and eventually preserved because a copy happened to survive somewhere; a film that failed was scrapped, frequently for the silver in its emulsion, which had a resale value.

Nitrate was replaced from the early 1950s by cellulose acetate, marketed as safety film because it does not burn in the same way. The substitution was a genuine improvement in fire risk and a partial one in longevity, because acetate has a decay process of its own. The acetate molecule releases acetic acid as it breaks down, which smells of vinegar and gives the condition its name, and the released acid catalyses the reaction, exactly as with nitrate. Acetate decay is slower and less dramatic and is by now a larger archival problem in absolute terms, because there is far more acetate in the world.

Storage is the only intervention that works, and what it involves is not complicated. Both materials decay more slowly when cold and dry, and the relationship is strong enough that the difference between a warm store and a cold one is measured in centuries rather than years. A vault at around minus five degrees and thirty per cent relative humidity will hold film for a very long time. The difficulty is that such a vault costs money continuously, and an archive's funding is periodic.

Copying is the other response, and it is where the profession has made its most instructive mistake. From the 1970s many archives copied nitrate onto acetate and destroyed the originals, on the reasonable-sounding grounds that the original was hazardous and the copy was safe. Two things were wrong with this. The copy was not as good — a photochemical duplicate loses detail and contrast, and much of the copying was done quickly and badly — and the acetate on which the copies were made has now begun to decay itself. A number of films now survive only as poor copies of originals that were in better condition when they were thrown away.

Digital copying has not resolved this and has changed the shape of the problem. A scan at sufficient resolution captures more than a photochemical copy does, and can be duplicated without further loss, which is a real advance. But a digital file requires active maintenance: the storage medium has a life of years rather than decades, the format may cease to be readable, and the whole collection must be periodically migrated to new equipment by somebody paid to do it. Film in a cold vault requires nothing but the cold. The comparison is often presented as new against old; it is more accurately a choice between a material that decays predictably and a system that fails abruptly if anybody stops paying attention.

There is also the question of what a preserved film is. A projected nitrate print looks different from a digital scan of the same negative — the silver content gives a particular density to the blacks that reproduction does not capture — and a small number of archives maintain the ability to project nitrate for that reason, under fire regulations requiring a separate booth and an operator trained for it.

What the history illustrates is a general problem with preserving anything whose value is not yet established. The films that were lost were not lost through carelessness in most cases; they were disposed of deliberately, by people who had no reason to think a commercial failure of 1919 would interest anybody, and who were not wrong about the economics of their own moment. The decisions look negligent only from a position that could not then have been occupied.`,
      questions: [
        tfng(
          "A nitrate fire can be extinguished with water.",
          "FALSE",
          "It burns fiercely, supplying its own oxygen, so that a nitrate fire cannot be smothered and continues under water.",
          "It 'continues under water'.",
        ),
        tfng(
          "Film in a sealed can decays faster than film in the open.",
          "TRUE",
          "The process is autocatalytic — the products of decomposition accelerate further decomposition — so a reel deteriorating in a sealed can deteriorates faster than one in open air, and a single decaying reel will damage the reels stored next to it.",
          "A sealed reel 'deteriorates faster'.",
        ),
        tfng(
          "Commercially unsuccessful films were often destroyed for their silver.",
          "TRUE",
          "A film that had made money was reprinted, circulated and eventually preserved because a copy happened to survive somewhere; a film that failed was scrapped, frequently for the silver in its emulsion, which had a resale value.",
          "Failures were 'scrapped, frequently for the silver'.",
        ),
        tfng(
          "Acetate film does not decay.",
          "FALSE",
          "The substitution was a genuine improvement in fire risk and a partial one in longevity, because acetate has a decay process of its own.",
          "Acetate 'has a decay process of its own'.",
        ),
        tfng(
          "Acetate is now the larger archival problem in sheer quantity.",
          "TRUE",
          "Acetate decay is slower and less dramatic and is by now a larger archival problem in absolute terms, because there is far more acetate in the world.",
          "It is 'a larger archival problem in absolute terms'.",
        ),
        tfng(
          "A digital file can be left unattended as safely as film in a cold vault.",
          "FALSE",
          "But a digital file requires active maintenance: the storage medium has a life of years rather than decades, the format may cease to be readable, and the whole collection must be periodically migrated to new equipment by somebody paid to do it.",
          "It 'requires active maintenance'.",
        ),
        tfng(
          "Most national archives have now built cold vaults.",
          "NOT GIVEN",
          "",
          "The passage describes what a vault does but not how many exist.",
        ),
        noteLine(
          DECAY_STEPS,
          null,
          "A smell of nitric acid appears and the image begins to ______",
          "fade",
          "The film first develops a faint smell of nitric acid and the image begins to fade at the edges; the base then becomes sticky and the layers adhere to one another; the material softens into an amber mass; and finally it reduces to a brown powder.",
          "The image 'begins to fade at the edges'.",
        ),
        noteLine(
          DECAY_STEPS,
          null,
          "The base turns ______ and the layers adhere to one another",
          "sticky",
          "The film first develops a faint smell of nitric acid and the image begins to fade at the edges; the base then becomes sticky and the layers adhere to one another; the material softens into an amber mass; and finally it reduces to a brown powder.",
          "The base 'becomes sticky'.",
        ),
        noteLine(
          DECAY_STEPS,
          null,
          "The material softens and finally reduces to a brown ______",
          "powder",
          "The film first develops a faint smell of nitric acid and the image begins to fade at the edges; the base then becomes sticky and the layers adhere to one another; the material softens into an amber mass; and finally it reduces to a brown powder.",
          "It ends as 'a brown powder'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Acetate decay is named after a smell of ______.",
          "vinegar",
          "The acetate molecule releases acetic acid as it breaks down, which smells of vinegar and gives the condition its name, and the released acid catalyses the reaction, exactly as with nitrate.",
          "It 'smells of vinegar'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "From the early 1950s nitrate gave way to cellulose ______.",
          "acetate",
          "Nitrate was replaced from the early 1950s by cellulose acetate, marketed as safety film because it does not burn in the same way.",
          "It was replaced by cellulose acetate.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some films survive only as poor ______ of destroyed originals.",
          "copies",
          "A number of films now survive only as poor copies of originals that were in better condition when they were thrown away.",
          "They survive as 'poor copies'.",
        ),
      ],
    },
    {
      key: "t74-p2-subglacial-lakes",
      title: "The Lakes Under the Ice",
      topic: "the liquid water beneath the Antarctic ice sheet and the trouble with reaching it",
      difficulty: 8,
      body: `There is liquid water beneath the Antarctic ice sheet, in quantities that were not suspected until the 1970s and are still being mapped. Something approaching seven hundred lakes have been identified, ranging from ponds a few hundred metres across to one the size of a substantial inland sea, and they are connected by a drainage network that moves water between them.

Why the water is liquid is the first thing to explain, since the surface above it is among the coldest places on the planet. Three effects combine. Ice is an excellent insulator, so the heat flowing out of the Earth's interior — a small quantity, but continuous — accumulates at the base instead of escaping. The pressure of three or four kilometres of ice lowers the melting point substantially. And the ice sheet moves, and friction at the bed generates heat of its own. The base of a thick ice sheet is therefore not the coldest part of it but very nearly the warmest.

The lakes were found by inference before they were found directly. Thora Jonsdottir, who works on ice-penetrating radar, explains that a lake announces itself in a radar profile as an unusually bright and flat reflection, because a water surface returns the signal far more strongly than rock does and is level in a way a rock bed is not. She is careful to note how much interpretation this involves: a bright flat reflector is consistent with water and also with certain kinds of saturated sediment, and the distinction matters for what one expects to find.

The largest of them lies under about four kilometres of ice and has been sealed from the atmosphere for something on the order of fifteen million years. Malik Osei, who models the circulation within such bodies, points out that the water is not static: the ice ceiling is not level, so melting occurs at one end and freezing at the other, which drives a slow overturning and means the lake exchanges water with the ice above it. The top of the lake is being continuously converted into the bottom of the ice sheet, which is why the deepest ice cores contain frozen lake water rather than compressed snow.

Reaching the water without contaminating it is the central technical problem, and the record of attempts is mixed. A Russian project drilled into that lake in 2012 using a borehole filled with kerosene and antifreeze to keep it open, a method that had been criticised for years; when the drill reached the water it rose into the hole and froze, and the sample recovered was of refrozen water mixed with drilling fluid. A British attempt at a smaller lake, designed around clean hot-water drilling, failed for engineering reasons before reaching the water at all. An American project at a shallower lake succeeded in 2013 with filtered and ultraviolet-treated hot water and recovered uncontaminated samples.

What those samples contained was the point of the exercise. Vera Lindholm, who has analysed subglacial microbiology, reports that the water holds a functioning microbial community at low density, deriving energy not from sunlight but from chemical reactions involving minerals in the underlying rock, and that the assemblage is dominated by organisms unlike those of the surface environment. She is explicit that the interesting question is not whether life is present — that was expected — but what the energy budget will support, since the available chemical energy is very small and the community's turnover appears to be extremely slow.

The comparison with other worlds is why much of the funding exists. Chen Ruogu, who works on planetary analogues, argues that the value of these lakes is procedural rather than biological: they are the only place where the techniques for entering a sealed body of water without contaminating it can be developed and, more importantly, where the standards for demonstrating that a detected organism did not come from the drill can be worked out. A false positive on one of the icy moons would be unrecoverable, and the protocols have to be established somewhere cheaper.

The lakes also matter for a reason unconnected with biology. The drainage network beneath the ice sheet lubricates its motion, and the rate at which the ice flows towards the sea depends on how much water is at the bed and where it goes. Satellite measurements have recorded the surface of the ice sheet rising and falling by several metres over months as lakes fill and empty, and a large discharge can measurably accelerate the ice above it. Models of how fast Antarctica will contribute to sea level therefore depend on plumbing that is mapped only in outline.

What is known is a small fraction of what is there. The radar coverage is thin in places, only three lakes have been sampled, and the drainage connections are largely inferred from surface movement rather than observed. It is an unusual position for a subject: the object of study is well established, extensively modelled, and has been directly examined three times.`,
      questions: [
        fromList(
          "matching_features",
          LAKE_PEOPLE,
          "A bright flat reflection is consistent with more than one material.",
          "Thora Jonsdottir",
          "She is careful to note how much interpretation this involves: a bright flat reflector is consistent with water and also with certain kinds of saturated sediment, and the distinction matters for what one expects to find.",
          "Jonsdottir warns about the ambiguity.",
        ),
        fromList(
          "matching_features",
          LAKE_PEOPLE,
          "An uneven ceiling drives an exchange between lake and ice.",
          "Malik Osei",
          "Malik Osei, who models the circulation within such bodies, points out that the water is not static: the ice ceiling is not level, so melting occurs at one end and freezing at the other, which drives a slow overturning and means the lake exchanges water with the ice above it.",
          "Osei describes the overturning.",
        ),
        fromList(
          "matching_features",
          LAKE_PEOPLE,
          "The question is what the energy will support, not whether life is there.",
          "Vera Lindholm",
          "She is explicit that the interesting question is not whether life is present — that was expected — but what the energy budget will support, since the available chemical energy is very small and the community's turnover appears to be extremely slow.",
          "Lindholm reframes the question.",
        ),
        fromList(
          "matching_features",
          LAKE_PEOPLE,
          "The lakes are valuable mainly for the methods they let us develop.",
          "Chen Ruogu",
          "Chen Ruogu, who works on planetary analogues, argues that the value of these lakes is procedural rather than biological: they are the only place where the techniques for entering a sealed body of water without contaminating it can be developed and, more importantly, where the standards for demonstrating that a detected organism did not come from the drill can be worked out.",
          "Chen calls the value procedural.",
        ),
        fromList(
          "summary_completion",
          LAKE_BANK,
          "Ice acts as an ______, holding in the Earth's internal heat.",
          "insulator",
          "Ice is an excellent insulator, so the heat flowing out of the Earth's interior — a small quantity, but continuous — accumulates at the base instead of escaping.",
          "Ice is 'an excellent insulator'.",
        ),
        fromList(
          "summary_completion",
          LAKE_BANK,
          "The ______ of kilometres of ice lowers the melting point.",
          "pressure",
          "The pressure of three or four kilometres of ice lowers the melting point substantially.",
          "Pressure lowers the melting point.",
        ),
        fromList(
          "summary_completion",
          LAKE_BANK,
          "Movement of the sheet adds heat through ______ at its base.",
          "friction",
          "And the ice sheet moves, and friction at the bed generates heat of its own.",
          "Friction at the bed generates heat.",
        ),
        fromList(
          "summary_completion",
          LAKE_BANK,
          "The lakes were first located with ice-penetrating ______.",
          "radar",
          "Thora Jonsdottir, who works on ice-penetrating radar, explains that a lake announces itself in a radar profile as an unusually bright and flat reflection, because a water surface returns the signal far more strongly than rock does and is level in a way a rock bed is not.",
          "Radar showed the bright flat reflections.",
        ),
        fromList(
          "summary_completion",
          LAKE_BANK,
          "One borehole was held open with ______ and antifreeze.",
          "kerosene",
          "A Russian project drilled into that lake in 2012 using a borehole filled with kerosene and antifreeze to keep it open, a method that had been criticised for years; when the drill reached the water it rose into the hole and froze, and the sample recovered was of refrozen water mixed with drilling fluid.",
          "The hole held 'kerosene and antifreeze'.",
        ),
        mcq(
          "What do the deepest ice cores above the largest lake contain?",
          [
            "Frozen lake water",
            "Compressed ancient snow",
            "Layers of volcanic ash",
            "Rock from the lake floor",
          ],
          "Frozen lake water",
          "The top of the lake is being continuously converted into the bottom of the ice sheet, which is why the deepest ice cores contain frozen lake water rather than compressed snow.",
          "They hold 'frozen lake water rather than compressed snow'.",
        ),
        mcq(
          "What did the 2012 attempt recover?",
          [
            "Refrozen water mixed with drilling fluid",
            "Uncontaminated water from the lake",
            "Sediment from the lake floor",
            "Nothing at all",
          ],
          "Refrozen water mixed with drilling fluid",
          "A Russian project drilled into that lake in 2012 using a borehole filled with kerosene and antifreeze to keep it open, a method that had been criticised for years; when the drill reached the water it rose into the hole and froze, and the sample recovered was of refrozen water mixed with drilling fluid.",
          "The sample was refrozen water and fluid.",
        ),
        mcq(
          "How does the microbial community obtain its energy?",
          [
            "From chemical reactions with minerals in the rock",
            "From sunlight passing through the ice",
            "From organic matter in the drilling fluid",
            "From heat generated by friction",
          ],
          "From chemical reactions with minerals in the rock",
          "Vera Lindholm, who has analysed subglacial microbiology, reports that the water holds a functioning microbial community at low density, deriving energy not from sunlight but from chemical reactions involving minerals in the underlying rock, and that the assemblage is dominated by organisms unlike those of the surface environment.",
          "Energy comes from reactions with minerals.",
        ),
        mcq(
          "Why do the lakes matter for projections of sea level?",
          [
            "Water at the bed changes how fast the ice flows",
            "The lakes will drain into the ocean directly",
            "Filling lakes raise the ice surface permanently",
            "They hold most of Antarctica's fresh water",
          ],
          "Water at the bed changes how fast the ice flows",
          "The drainage network beneath the ice sheet lubricates its motion, and the rate at which the ice flows towards the sea depends on how much water is at the bed and where it goes.",
          "The flow rate depends on the water at the bed.",
        ),
      ],
    },
    {
      key: "t74-p3-forensic-methods",
      title: "The Evidence That Was Never Tested",
      topic: "why some forensic techniques acquired authority without being validated",
      difficulty: 9,
      body: `A) A courtroom treats forensic science as a category, and it is not one. Under the same heading sit techniques with the standing of a physical measurement and techniques that were never tested before they were used to convict people, and the second group is larger than the public supposes. The distinction is not between good and bad practitioners. It is between methods that were validated and methods that acquired authority by being accepted. Nothing about a white coat or a long career distinguishes the two, which is part of why juries cannot be expected to.

B) The clearest example is bite-mark comparison. The technique assumes that human dentition is unique and that a bite leaves a reproducible impression in skin, and both assumptions turn out to be unsupported. Skin is elastic, swells, and distorts; the impression changes within hours; and controlled studies in which examiners were given known bites produced disagreement among examiners about whether a mark was even a bite. Reviews of exonerations have found convictions in which bite-mark testimony was central and later analysis identified a different person. The technique has been repudiated by several of the bodies that once taught it and has still been admitted in court since, because a repudiation by a professional body is not a ruling.

C) Other techniques failed less completely and in a more instructive way. Comparative bullet-lead analysis measured trace elements in lead and inferred that two fragments came from the same batch; the chemistry was sound and the inference about batch size was not, and the laboratory that had provided the testimony for decades withdrew it. Microscopic hair comparison could establish that two hairs were consistent, which is true of a great many hairs, and was regularly reported in language implying identification. Arson investigation rested on a body of lore about burn patterns that was contradicted when somebody finally burned test structures under controlled conditions.

D) What these have in common is a specific structural fault, and naming it is more useful than listing the cases. In each, an examiner reached a conclusion about a pattern by unaided judgement, without a measured error rate, without a stated likelihood, and usually while knowing which suspect the police favoured. None of those conditions is compatible with a reliable measurement, and all of them were normal. The problem was not that examiners were dishonest — the overwhelming majority were not — but that the method had no mechanism for discovering that it was wrong.

E) Fingerprint comparison deserves separate treatment, because it is frequently invoked as a counterexample and is a more complicated case than either side allows. Fingerprints are almost certainly unique. What is uncertain is the reliability of comparing a partial, smudged mark with a reference print, and when that was finally tested, the false positive rate in one large study was low but not zero, which is a finding of a different kind from the claim of certainty examiners had testified to for a century. The technique is useful and was oversold, and both halves of that sentence are necessary.

F) I part company with the more sweeping critics at this point. It is sometimes argued that pattern comparison should be inadmissible altogether, and I think that is wrong: a method with a measured and disclosed error rate is evidence, and juries handle probabilistic evidence better than they are given credit for. What should be inadmissible is the language of certainty — a match, a unique identification, a conclusion to the exclusion of all others — because that language makes a claim no comparison method has ever been able to support.

G) The difficulty in correcting any of this is institutional rather than scientific, and it is why the problem persists after being thoroughly described. A court's test for admitting evidence asks in part whether a technique is generally accepted in its field, which for a technique whose field consists of its own practitioners is close to circular. Precedent compounds it: once a method has been admitted, a later judge is deciding whether to depart from settled practice rather than whether the method works. And the people best placed to identify the weaknesses are employed by the laboratories whose output would be devalued. Nothing in that arrangement is designed to detect an error, which is the same fault the individual techniques had, one level up.`,
      questions: [
        fromList(
          "matching_information",
          FORENSIC_PARAGRAPHS,
          "a technique whose chemistry was sound but whose inference was not",
          "C",
          "Comparative bullet-lead analysis measured trace elements in lead and inferred that two fragments came from the same batch; the chemistry was sound and the inference about batch size was not, and the laboratory that had provided the testimony for decades withdrew it.",
          "Paragraph C separates the chemistry from the inference.",
        ),
        fromList(
          "matching_information",
          FORENSIC_PARAGRAPHS,
          "the naming of a fault shared by several methods",
          "D",
          "In each, an examiner reached a conclusion about a pattern by unaided judgement, without a measured error rate, without a stated likelihood, and usually while knowing which suspect the police favoured.",
          "Paragraph D states the common fault.",
        ),
        fromList(
          "matching_information",
          FORENSIC_PARAGRAPHS,
          "a study in which examiners disagreed about what they were looking at",
          "B",
          "Skin is elastic, swells, and distorts; the impression changes within hours; and controlled studies in which examiners were given known bites produced disagreement among examiners about whether a mark was even a bite.",
          "Paragraph B reports the disagreement.",
        ),
        fromList(
          "matching_information",
          FORENSIC_PARAGRAPHS,
          "why a legal test for admitting evidence is close to circular",
          "G",
          "A court's test for admitting evidence asks in part whether a technique is generally accepted in its field, which for a technique whose field consists of its own practitioners is close to circular.",
          "Paragraph G identifies the circularity.",
        ),
        fromList(
          "matching_information",
          FORENSIC_PARAGRAPHS,
          "a measured rate that proved low without being zero",
          "E",
          "What is uncertain is the reliability of comparing a partial, smudged mark with a reference print, and when that was finally tested, the false positive rate in one large study was low but not zero, which is a finding of a different kind from the claim of certainty examiners had testified to for a century.",
          "Paragraph E gives the tested rate.",
        ),
        ynng(
          "The writer thinks most forensic examiners acted dishonestly.",
          "NO",
          "The problem was not that examiners were dishonest — the overwhelming majority were not — but that the method had no mechanism for discovering that it was wrong.",
          "'The overwhelming majority were not'.",
        ),
        ynng(
          "The writer accepts that fingerprint comparison has genuine value.",
          "YES",
          "The technique is useful and was oversold, and both halves of that sentence are necessary.",
          "The technique 'is useful'.",
        ),
        ynng(
          "The writer believes pattern comparison should be barred from court entirely.",
          "NO",
          "It is sometimes argued that pattern comparison should be inadmissible altogether, and I think that is wrong: a method with a measured and disclosed error rate is evidence, and juries handle probabilistic evidence better than they are given credit for.",
          "The writer thinks that argument 'is wrong'.",
        ),
        ynng(
          "The writer regards the obstacle to reform as institutional rather than scientific.",
          "YES",
          "The difficulty in correcting any of this is institutional rather than scientific, and it is why the problem persists after being thoroughly described.",
          "It is 'institutional rather than scientific'.",
        ),
        fromList(
          "matching_sentence_endings",
          FORENSIC_ENDINGS,
          "Marks left by teeth cannot be compared reliably,",
          "because skin distorts and the impression alters within hours.",
          "Skin is elastic, swells, and distorts; the impression changes within hours; and controlled studies in which examiners were given known bites produced disagreement among examiners about whether a mark was even a bite.",
          "Skin distorts and the mark changes.",
        ),
        fromList(
          "matching_sentence_endings",
          FORENSIC_ENDINGS,
          "Bullet-lead testimony was withdrawn by the laboratory that supplied it,",
          "although the chemistry of the measurement itself was never in doubt.",
          "Comparative bullet-lead analysis measured trace elements in lead and inferred that two fragments came from the same batch; the chemistry was sound and the inference about batch size was not, and the laboratory that had provided the testimony for decades withdrew it.",
          "The chemistry was sound; the inference was not.",
        ),
        fromList(
          "matching_sentence_endings",
          FORENSIC_ENDINGS,
          "What ought to be excluded is a form of words rather than a method,",
          "because the language of certainty claims more than any comparison supports.",
          "What should be inadmissible is the language of certainty — a match, a unique identification, a conclusion to the exclusion of all others — because that language makes a claim no comparison method has ever been able to support.",
          "The language overclaims.",
        ),
        fromList(
          "matching_sentence_endings",
          FORENSIC_ENDINGS,
          "The general-acceptance test cannot screen out a weak technique,",
          "since the field whose acceptance is asked for consists of the practitioners.",
          "A court's test for admitting evidence asks in part whether a technique is generally accepted in its field, which for a technique whose field consists of its own practitioners is close to circular.",
          "The field is the practitioners themselves.",
        ),
        fromList(
          "matching_sentence_endings",
          FORENSIC_ENDINGS,
          "Those best able to find the flaws are employed by the laboratories,",
          "which the writer regards as the same fault repeated one level higher.",
          "Nothing in that arrangement is designed to detect an error, which is the same fault the individual techniques had, one level up.",
          "The institution repeats the method's fault.",
        ),
      ],
    },
  ],
};
