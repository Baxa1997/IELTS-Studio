import { fromList, gapFill, mcq, tfng, type CuratedPassage } from "./shared";

const CALC_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];

export const DENTAL_CALCULUS: CuratedPassage = {
  key: "dental-calculus",
  title: "What the Dentist Throws Away",
  topic: "the archaeological archive preserved in hardened dental plaque",
  difficulty: 7,
  body: `A) Plaque is a film of bacteria that forms continuously on teeth. Left undisturbed, it takes up minerals from saliva and hardens into calculus — the deposit a hygienist scrapes off — and once hardened it stops being a living film and becomes a sealed mineral layer. Anything that was in the mouth while it formed is trapped in it: bacteria, food particles, plant fibres, pollen, smoke residue, and fragments of protein and DNA.

B) For most of the history of archaeology this material was an obstacle. It obscured the tooth surface, which is what osteologists wanted to examine for wear and disease, and standard practice was to clean it off and throw it away. It has been estimated that the majority of the dental calculus excavated in the twentieth century was discarded, from skeletons that were then reburied or stored without it.

C) What changed the assessment was the realisation of how much it holds and how well. Calculus is the only part of the body that fossilises during life, and its mineral matrix protects the contents from the degradation that destroys organic material in soil. It yields more bacterial DNA per gram than almost any other archaeological material, and it does so from skeletons where bone collagen has been destroyed entirely.

D) The applications have divided into three. The first is diet. Starch granules from plants survive in calculus and can be identified to the level of the family and sometimes the species, and they have been used to show that Neanderthals ate a substantial quantity of plant material, some of it cooked, which contradicted a long-standing picture of an exclusively meat-based diet. Fibres from textiles and residues from smoking or from working materials with the teeth turn up as well, which is evidence of occupation rather than of food. A rope-maker, a weaver and a leather-worker all use their teeth as a third hand, and all three leave a different signature.

E) The second is disease. The oral microbiome recovered from calculus can be compared across populations and periods, and the comparison shows two clear transitions. The adoption of farming, with its cereal-heavy diet, is followed by a rise in the bacteria associated with tooth decay. The industrial revolution, and the arrival of cheap refined sugar and flour, is followed by a further and sharper change, after which the modern oral microbiome is markedly less diverse than any earlier one. The general pattern — a community of organisms becoming less varied and more dominated by a few species — matches what has been found for the gut, and both are suspected to be involved in conditions that have become common recently. The calculus record has the advantage of reaching back thousands of years, where the gut record does not.

F) The third is individual biography, and it produces the results that reach the public. A medieval German woman was found with lapis lazuli pigment in her calculus, in a quantity consistent with repeatedly pointing a fine brush with her lips; the pigment was among the most expensive materials in Europe at the time, and the finding is direct evidence of a woman working as a manuscript illuminator, in a period whose surviving records name almost exclusively male scribes. A single tooth established something that the documentary record had actively obscured.

G) There are cautions that the field has learned to state. Calculus forms unevenly and does not represent a diet in proportion — some foods leave a great deal of residue and others none — so its evidence is qualitative rather than quantitative. It is also vulnerable to contamination from the burial soil and from handling, which requires the same controls as any ancient DNA work — gloves and masks at the point of excavation, and comparison samples from everybody who has touched the remains. And it is finite: a skeleton has one set of teeth, the sample is destroyed by analysis, and every technique invented in the next fifty years will have to be applied to what previous researchers left behind. That last point is the real argument of the field, and it applies well beyond teeth. The material discarded because nobody could see a use for it is the material that limits what the next generation can ask.`,
  questions: [
    fromList(
      "matching_information",
      CALC_PARAGRAPHS,
      "a reason why the evidence cannot show how much of a food was eaten",
      "G",
      "Calculus forms unevenly and does not represent a diet in proportion — some foods leave a great deal of residue and others none — so its evidence is qualitative rather than quantitative.",
      "Paragraph G explains the qualitative limit.",
    ),
    fromList(
      "matching_information",
      CALC_PARAGRAPHS,
      "a finding that contradicted an accepted view of an early human diet",
      "D",
      "Starch granules from plants survive in calculus and can be identified to the level of the family and sometimes the species, and they have been used to show that Neanderthals ate a substantial quantity of plant material, some of it cooked, which contradicted a long-standing picture of an exclusively meat-based diet.",
      "Paragraph D reports the Neanderthal result.",
    ),
    fromList(
      "matching_information",
      CALC_PARAGRAPHS,
      "a description of what happens to plaque when it is not removed",
      "A",
      "Left undisturbed, it takes up minerals from saliva and hardens into calculus — the deposit a hygienist scrapes off — and once hardened it stops being a living film and becomes a sealed mineral layer.",
      "Paragraph A describes hardening.",
    ),
    fromList(
      "matching_information",
      CALC_PARAGRAPHS,
      "evidence about an individual that the written record had concealed",
      "F",
      "A single tooth established something that the documentary record had actively obscured.",
      "Paragraph F gives the illuminator case.",
    ),
    fromList(
      "matching_information",
      CALC_PARAGRAPHS,
      "an estimate of how much material was thrown away",
      "B",
      "It has been estimated that the majority of the dental calculus excavated in the twentieth century was discarded, from skeletons that were then reburied or stored without it.",
      "Paragraph B gives the estimate.",
    ),
    tfng(
      "Calculus protects its contents better than bone does.",
      "TRUE",
      "It yields more bacterial DNA per gram than almost any other archaeological material, and it does so from skeletons where bone collagen has been destroyed entirely.",
      "It works where bone collagen is destroyed.",
    ),
    tfng(
      "Tooth decay became more common after the adoption of farming.",
      "TRUE",
      "The adoption of farming, with its cereal-heavy diet, is followed by a rise in the bacteria associated with tooth decay.",
      "There is 'a rise in the bacteria associated with tooth decay'.",
    ),
    tfng(
      "The modern oral microbiome is more diverse than earlier ones.",
      "FALSE",
      "The industrial revolution, and the arrival of cheap refined sugar and flour, is followed by a further and sharper change, after which the modern oral microbiome is markedly less diverse than any earlier one.",
      "It is 'markedly less diverse'.",
    ),
    tfng(
      "A calculus sample can be analysed more than once.",
      "FALSE",
      "And it is finite: a skeleton has one set of teeth, the sample is destroyed by analysis, and every technique invented in the next fifty years will have to be applied to what previous researchers left behind.",
      "'The sample is destroyed by analysis'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Plaque hardens by absorbing minerals from ______.",
      "saliva",
      "Left undisturbed, it takes up minerals from saliva and hardens into calculus — the deposit a hygienist scrapes off — and once hardened it stops being a living film and becomes a sealed mineral layer.",
      "It takes minerals 'from saliva'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Plant ______ preserved in calculus can be identified by family.",
      "starch granules",
      "Starch granules from plants survive in calculus and can be identified to the level of the family and sometimes the species, and they have been used to show that Neanderthals ate a substantial quantity of plant material, some of it cooked, which contradicted a long-standing picture of an exclusively meat-based diet.",
      "'Starch granules from plants survive'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "The pigment found in the German woman's teeth was ______.",
      "lapis lazuli",
      "A medieval German woman was found with lapis lazuli pigment in her calculus, in a quantity consistent with repeatedly pointing a fine brush with her lips; the pigment was among the most expensive materials in Europe at the time, and the finding is direct evidence of a woman working as a manuscript illuminator, in a period whose surviving records name almost exclusively male scribes.",
      "It was 'lapis lazuli pigment'.",
    ),
    mcq(
      "Why was calculus removed and discarded for so long?",
      [
        "It hid the tooth surface researchers wanted to see",
        "It was thought to carry disease",
        "It could not be stored without decaying",
        "It was believed to form after burial",
      ],
      "It hid the tooth surface researchers wanted to see",
      "It obscured the tooth surface, which is what osteologists wanted to examine for wear and disease, and standard practice was to clean it off and throw it away.",
      "It 'obscured the tooth surface'.",
    ),
    mcq(
      "What does the passage identify as the field's real argument?",
      [
        "That discarded material limits future research",
        "That teeth should be stored separately from bone",
        "That contamination controls need tightening",
        "That written records are unreliable",
      ],
      "That discarded material limits future research",
      "The material discarded because nobody could see a use for it is the material that limits what the next generation can ask.",
      "Discarded material limits the next generation.",
    ),
  ],
};
