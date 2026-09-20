import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · dye chemistry and trade · flow-chart -----------------------

const VAT_STEPS = {
  title: "Dyeing cloth in an indigo vat",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · particle physics · people and a word bank -----------------

const NEUTRINO_PEOPLE = ["Reiko Matsuda", "Pavel Zdeněk", "Amara Sissoko", "Erik Lindgren"];
const NEUTRINO_BANK = [
  "coincidence",
  "rock",
  "isotopes",
  "ice",
  "oscillation",
  "mass",
  "flux",
  "sensors",
  "shipwrecks",
];

// ---- Passage 3 · education policy · lettered paragraphs --------------------

const CLASS_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CLASS_ENDINGS = [
  "because schools place the children who are struggling in the smaller groups.",
  "although the least experienced of the new teachers went to the poorest schools.",
  "which is why the comparison is not between schools that chose their own size.",
  "because nothing in a smaller room tells a teacher what to do differently.",
  "since the same money spent on teaching quality appears to achieve more.",
  "which the writer thinks has to be decided locally on every occasion.",
  "even though the measured effects are small and imprecise rather than absent.",
];

export const TEST_71: CuratedTest = {
  key: "full-test-71",
  targetBand: 8,
  passages: [
    {
      key: "t71-p1-indigo",
      title: "The Blue That Bankrupted a Crop",
      topic: "how a dye that shaped colonial agriculture was displaced by a laboratory",
      difficulty: 7,
      body: `Blue is the hardest colour to obtain from the natural world. Plants and minerals yield reds, yellows, browns and blacks readily; a fast blue that will bind to cloth and survive washing and sunlight is chemically awkward, and for most of history there was essentially one source of it. Indigo is present as a colourless precursor in the leaves of several unrelated plants, and extracting it involves a process that reads like alchemy and was worked out empirically thousands of years before anybody understood why it worked.

The chemistry is genuinely strange. Indigo itself is insoluble in water, which is the property that makes it a good dye and also makes it impossible to apply. The solution, arrived at independently in India, West Africa, Japan and Central America, is to reduce it in an alkaline vat without oxygen, which converts it into a soluble yellow-green form. Cloth dipped in that liquid emerges pale and the compound oxidises in the air, returning to its insoluble state and now trapped inside the fibre. A dyer therefore judges a vat by smell and by the colour of the froth, and the practical knowledge required is considerable.

Because the plant grows in warm climates and the demand was in cold ones, indigo became one of the commodities around which colonial economies were arranged. European cloth had been dyed with woad, a related plant yielding the same compound in much lower concentration, and the woad growers of France and Germany lobbied successfully for decades to have the imported dye banned, at one point on pain of death. The prohibition failed for the ordinary reason: the imported product was better and cheaper per unit of colour. By the eighteenth century indigo was a plantation crop, grown with forced or coerced labour in the Caribbean, in South Carolina and above all in Bengal, where the terms imposed on cultivators produced a revolt in 1859 that is still studied.

The industry was destroyed by a laboratory. Adolf von Baeyer determined the structure of the molecule in 1883, after seventeen years of work, and the problem then became commercial rather than scientific: a synthetic route existed, but none of the early ones was cheap enough to compete with a crop. Two German chemical companies spent, between them, something in the region of an entire share capital on the problem over two decades. The route that succeeded depended on a chance observation in 1897, when a mercury thermometer broke into a reaction vessel and the mercury catalysed a step that had previously been the bottleneck.

The collapse that followed was exceptionally fast. Synthetic indigo reached the market in 1897; within fifteen years natural indigo had lost almost the entire market, and the acreage in Bengal fell by more than ninety per cent. This is often presented as a triumph of science over agriculture, and it was, but the distributional facts deserve stating: the benefit went to two chemical companies and to consumers of cheap dyed cloth, and the cost fell on cultivators who had been compelled into the crop in the first place and had no alternative use for the land or the skill.

What the episode established was a template. The synthesis of a natural product on an industrial scale, undercutting the agriculture it replaced, happened next with alizarin for madder red, with camphor, with vanilla flavouring, with rubber during a wartime shortage, and with quinine. In each case the pattern is the same: a plant whose value lies in a single molecule is vulnerable in a way a plant valued for many is not.

The trade did not vanish entirely, and the reason is instructive. A small natural indigo industry survived and has grown again, supported by two things chemistry cannot supply. The first is that natural extract contains a mixture of related compounds alongside the main molecule, which produces a slightly different and less uniform colour that some textile traditions require. The second is simply provenance: a market exists for cloth dyed with a plant, and it will pay a premium that has nothing to do with the physical properties of the result.

There is also an environmental reversal few would have predicted. Synthetic indigo is manufactured from petrochemical feedstocks, and the reduction step in dyeing has conventionally used sodium dithionite, which produces sulphate and sulphite effluent in very large quantities, the denim industry being the principal consumer. Considerable effort now goes into avoiding exactly that step — by electrochemical reduction, by bacterial fermentation producing the dye in its soluble form directly, or by enzymatic routes. Some of the proposed replacements amount to an industrialised version of the fermentation vat the process began with.

The history is a useful corrective to two opposite stories. It is not a case of a natural product being better, because the synthetic molecule is identical and was made more cheaply. Nor is it a clean case of progress, because the losses were real and fell on people who had not chosen the crop. What it shows is that a commodity resting on one molecule has a shelf life, and that the shelf life is set in a laboratory somewhere else.`,
      questions: [
        tfng(
          "Blue is among the easiest colours to obtain from natural sources.",
          "FALSE",
          "Blue is the hardest colour to obtain from the natural world.",
          "It is 'the hardest colour to obtain'.",
        ),
        tfng(
          "Indigo dissolves readily in water.",
          "FALSE",
          "Indigo itself is insoluble in water, which is the property that makes it a good dye and also makes it impossible to apply.",
          "It is 'insoluble in water'.",
        ),
        tfng(
          "The method of making the dye usable was found independently in several regions.",
          "TRUE",
          "The solution, arrived at independently in India, West Africa, Japan and Central America, is to reduce it in an alkaline vat without oxygen, which converts it into a soluble yellow-green form.",
          "It was 'arrived at independently' in four regions.",
        ),
        tfng(
          "Woad yields the same compound as indigo but in smaller amounts.",
          "TRUE",
          "European cloth had been dyed with woad, a related plant yielding the same compound in much lower concentration, and the woad growers of France and Germany lobbied successfully for decades to have the imported dye banned, at one point on pain of death.",
          "Woad yields it 'in much lower concentration'.",
        ),
        tfng(
          "Baeyer's work produced a route cheap enough to compete immediately.",
          "FALSE",
          "Adolf von Baeyer determined the structure of the molecule in 1883, after seventeen years of work, and the problem then became commercial rather than scientific: a synthetic route existed, but none of the early ones was cheap enough to compete with a crop.",
          "None of the early routes was cheap enough.",
        ),
        tfng(
          "A broken thermometer led to the catalyst that made synthesis viable.",
          "TRUE",
          "The route that succeeded depended on a chance observation in 1897, when a mercury thermometer broke into a reaction vessel and the mercury catalysed a step that had previously been the bottleneck.",
          "The spilled mercury catalysed the step.",
        ),
        tfng(
          "Baeyer received a prize for determining the structure of the molecule.",
          "NOT GIVEN",
          "",
          "The passage records the work but says nothing about any award.",
        ),
        noteLine(
          VAT_STEPS,
          null,
          "Reduce the pigment in an alkaline ______ with no oxygen",
          "vat",
          "The solution, arrived at independently in India, West Africa, Japan and Central America, is to reduce it in an alkaline vat without oxygen, which converts it into a soluble yellow-green form.",
          "It is reduced 'in an alkaline vat without oxygen'.",
        ),
        noteLine(
          VAT_STEPS,
          null,
          "Dip the cloth; the compound then ______ in the air",
          "oxidises",
          "Cloth dipped in that liquid emerges pale and the compound oxidises in the air, returning to its insoluble state and now trapped inside the fibre.",
          "The compound 'oxidises in the air'.",
        ),
        noteLine(
          VAT_STEPS,
          null,
          "The insoluble pigment is left trapped inside the ______",
          "fibre",
          "Cloth dipped in that liquid emerges pale and the compound oxidises in the air, returning to its insoluble state and now trapped inside the fibre.",
          "It is 'trapped inside the fibre'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The terms imposed on growers in ______ produced a revolt in 1859.",
          "Bengal",
          "By the eighteenth century indigo was a plantation crop, grown with forced or coerced labour in the Caribbean, in South Carolina and above all in Bengal, where the terms imposed on cultivators produced a revolt in 1859 that is still studied.",
          "The revolt was in Bengal.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The reduction step has conventionally used sodium ______.",
          "dithionite",
          "Synthetic indigo is manufactured from petrochemical feedstocks, and the reduction step in dyeing has conventionally used sodium dithionite, which produces sulphate and sulphite effluent in very large quantities, the denim industry being the principal consumer.",
          "It has used 'sodium dithionite'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The largest consumer of the dye is the ______ industry.",
          "denim",
          "Synthetic indigo is manufactured from petrochemical feedstocks, and the reduction step in dyeing has conventionally used sodium dithionite, which produces sulphate and sulphite effluent in very large quantities, the denim industry being the principal consumer.",
          "Denim is 'the principal consumer'.",
        ),
      ],
    },
    {
      key: "t71-p2-neutrino-detection",
      title: "Catching the Particle That Barely Arrives",
      topic: "the size and emptiness required to detect a particle that passes through matter",
      difficulty: 8,
      body: `A neutrino is the least sociable particle known. It has almost no mass, no electric charge, and interacts only through the weakest of the forces, which means it passes through matter as though the matter were not there. Something like sixty billion of them from the Sun cross every square centimetre of a person's body each second, and in a human lifetime perhaps one will interact with them. Detecting them at all requires accepting that almost every one will be missed, and building an apparatus large enough that the tiny fraction which do interact amounts to a countable number.

The particle was invented before it was found. In the 1930s beta decay appeared to violate the conservation of energy: the electron emitted carried a variable amount, and some of the energy was simply unaccounted for. Wolfgang Pauli proposed an undetectable neutral particle carrying the remainder, and described the suggestion in a letter as a desperate remedy. Reiko Matsuda, who has written on the period, notes that Pauli's proposal was treated for over two decades as a bookkeeping device rather than as a claim about a real object, and that this was a reasonable attitude given that nobody could think of an experiment.

The first detection, in 1956, used a nuclear reactor as a source and a tank of liquid instrumented to register two flashes of light separated by a few microseconds — the signature of one specific reaction and of nothing else. The design principle established there has governed the field since: you cannot see the particle, so you look for a coincidence of events that nothing else would produce.

Everything about the practice follows from the need to exclude other things. A detector must be shielded from cosmic rays, which is why they are built under a kilometre or more of rock, in mines, road tunnels and under mountains. Pavel Zdeněk, who works on background suppression, explains that depth solves only the easier half of the problem: the remaining difficulty is radioactivity in the apparatus itself, since ordinary steel, glass, concrete and even the wire in a cable contain trace isotopes producing exactly the signals being looked for. Materials for such experiments are selected by assay, sometimes with lead recovered from Roman shipwrecks, whose radioactivity has had two thousand years to decay.

The largest detectors abandon manufactured targets altogether and use whatever is available in quantity. One instrument occupies a cubic kilometre of Antarctic ice, instrumented with strings of light sensors lowered into holes melted with hot water; another uses a volume of the Mediterranean; another is a tank of fifty thousand tonnes of purified water. Amara Sissoko, who has worked on ice-based detection, points out that the medium determines the science: ice is transparent enough to register flashes but cannot be sampled or replaced, so every calibration has to be done against the natural background, and a mistake in the assumed optical properties of the ice propagates into every result.

What the instruments have delivered has repeatedly been unexpected. The clearest case is the solar neutrino problem: for thirty years experiments detected roughly a third of the neutrinos the Sun's known output required, and the discrepancy was widely assumed to indicate a flaw in the models of the solar interior. It did not. The neutrinos were changing type in flight, which is only possible if they have mass, which the standard theory had assumed they did not. Erik Lindgren, who models the oscillation, describes the resolution as the rare case of a persistent anomaly turning out to be a genuine discovery rather than a measurement error, and observes that the experiments which were not looking for it were the ones that settled it.

The instruments have also become telescopes. Because neutrinos are not deflected by magnetic fields and are not absorbed by dust, they arrive from directions light cannot, and a detection can be traced back towards a source. A high-energy event recorded in Antarctica in 2017 was matched, within minutes and by an automated alert, to a flaring galaxy four billion light years away, which was the first time an astronomical object had been identified from a single neutrino.

There is a nearer application that is politically awkward. A working nuclear reactor emits a characteristic flux of antineutrinos depending on what it is burning, and this cannot be shielded, faked or switched off. In principle a detector outside a site could determine whether a reactor is operating and roughly what its fuel composition is, which would be an unusually robust verification tool. The engineering is not yet there: a detector of the necessary sensitivity is still large and expensive, and the distance over which it works is short.

The particle remains chiefly interesting for what its detection required. Nothing about a neutrino can be measured without a piece of infrastructure the size of a mountain's interior, and the history of the subject is largely the history of persuading somebody to build one.`,
      questions: [
        fromList(
          "matching_features",
          NEUTRINO_PEOPLE,
          "The proposal was long treated as bookkeeping rather than a real object.",
          "Reiko Matsuda",
          "Reiko Matsuda, who has written on the period, notes that Pauli's proposal was treated for over two decades as a bookkeeping device rather than as a claim about a real object, and that this was a reasonable attitude given that nobody could think of an experiment.",
          "Matsuda describes the long scepticism.",
        ),
        fromList(
          "matching_features",
          NEUTRINO_PEOPLE,
          "Contamination in the apparatus is harder to deal with than cosmic rays.",
          "Pavel Zdeněk",
          "Pavel Zdeněk, who works on background suppression, explains that depth solves only the easier half of the problem: the remaining difficulty is radioactivity in the apparatus itself, since ordinary steel, glass, concrete and even the wire in a cable contain trace isotopes producing exactly the signals being looked for.",
          "Zdeněk names the apparatus as the harder half.",
        ),
        fromList(
          "matching_features",
          NEUTRINO_PEOPLE,
          "A medium that cannot be replaced constrains how calibration is done.",
          "Amara Sissoko",
          "Amara Sissoko, who has worked on ice-based detection, points out that the medium determines the science: ice is transparent enough to register flashes but cannot be sampled or replaced, so every calibration has to be done against the natural background, and a mistake in the assumed optical properties of the ice propagates into every result.",
          "Sissoko explains the constraint of ice.",
        ),
        fromList(
          "matching_features",
          NEUTRINO_PEOPLE,
          "A long-standing discrepancy turned out to be a discovery, not an error.",
          "Erik Lindgren",
          "Erik Lindgren, who models the oscillation, describes the resolution as the rare case of a persistent anomaly turning out to be a genuine discovery rather than a measurement error, and observes that the experiments which were not looking for it were the ones that settled it.",
          "Lindgren calls it a genuine discovery.",
        ),
        fromList(
          "summary_completion",
          NEUTRINO_BANK,
          "A detector looks for a ______ of events nothing else would produce.",
          "coincidence",
          "The design principle established there has governed the field since: you cannot see the particle, so you look for a coincidence of events that nothing else would produce.",
          "It looks for a coincidence.",
        ),
        fromList(
          "summary_completion",
          NEUTRINO_BANK,
          "Detectors sit beneath a kilometre or more of ______.",
          "rock",
          "A detector must be shielded from cosmic rays, which is why they are built under a kilometre or more of rock, in mines, road tunnels and under mountains.",
          "They sit under rock.",
        ),
        fromList(
          "summary_completion",
          NEUTRINO_BANK,
          "Ordinary construction materials contain trace ______.",
          "isotopes",
          "Pavel Zdeněk, who works on background suppression, explains that depth solves only the easier half of the problem: the remaining difficulty is radioactivity in the apparatus itself, since ordinary steel, glass, concrete and even the wire in a cable contain trace isotopes producing exactly the signals being looked for.",
          "They 'contain trace isotopes'.",
        ),
        fromList(
          "summary_completion",
          NEUTRINO_BANK,
          "Lead recovered from Roman ______ is used because it is quieter.",
          "shipwrecks",
          "Materials for such experiments are selected by assay, sometimes with lead recovered from Roman shipwrecks, whose radioactivity has had two thousand years to decay.",
          "The lead comes from Roman shipwrecks.",
        ),
        fromList(
          "summary_completion",
          NEUTRINO_BANK,
          "Changing type in flight is possible only if the particle has ______.",
          "mass",
          "The neutrinos were changing type in flight, which is only possible if they have mass, which the standard theory had assumed they did not.",
          "Oscillation requires mass.",
        ),
        mcq(
          "What problem did Pauli's proposal address?",
          [
            "Energy appeared to be missing in beta decay",
            "Electrons were found to carry no charge",
            "The Sun was emitting more light than expected",
            "Radioactivity could not be measured at all",
          ],
          "Energy appeared to be missing in beta decay",
          "In the 1930s beta decay appeared to violate the conservation of energy: the electron emitted carried a variable amount, and some of the energy was simply unaccounted for.",
          "Some energy 'was simply unaccounted for'.",
        ),
        mcq(
          "How were the sensors placed in the Antarctic instrument?",
          [
            "In holes melted with hot water",
            "In shafts cut by machine",
            "On the surface of the ice sheet",
            "Inside a tank of purified water",
          ],
          "In holes melted with hot water",
          "One instrument occupies a cubic kilometre of Antarctic ice, instrumented with strings of light sensors lowered into holes melted with hot water; another uses a volume of the Mediterranean; another is a tank of fifty thousand tonnes of purified water.",
          "They were lowered into melted holes.",
        ),
        mcq(
          "Why was the 2017 event significant?",
          [
            "An astronomical object was identified from one neutrino",
            "It was the first detection made in ice",
            "It proved that neutrinos have mass",
            "It originated inside the Sun",
          ],
          "An astronomical object was identified from one neutrino",
          "A high-energy event recorded in Antarctica in 2017 was matched, within minutes and by an automated alert, to a flaring galaxy four billion light years away, which was the first time an astronomical object had been identified from a single neutrino.",
          "It was the first such identification.",
        ),
        mcq(
          "Why would reactor monitoring by this method be hard to defeat?",
          [
            "The emission cannot be shielded or faked",
            "Reactors emit no other radiation",
            "A detector can be placed at any distance",
            "The signal grows stronger with distance",
          ],
          "The emission cannot be shielded or faked",
          "A working nuclear reactor emits a characteristic flux of antineutrinos depending on what it is burning, and this cannot be shielded, faked or switched off.",
          "It 'cannot be shielded, faked or switched off'.",
        ),
      ],
    },
    {
      key: "t71-p3-class-size",
      title: "How Much the Size of a Class Decides",
      topic: "what the evidence on class-size reduction supports and what it does not",
      difficulty: 9,
      body: `A) Few questions in education have been asked more often or answered less usefully than whether smaller classes produce better learning. It is intuitively obvious that they must, it is the change teachers ask for most consistently, and it is among the most expensive things a system can buy, since staffing dominates every education budget. The literature is large, it is contradictory, and the contradiction is not mainly a matter of bad studies.

B) The most-cited evidence comes from an experiment in Tennessee in the 1980s, in which children in their first years of school were assigned at random to classes of about fifteen or about twenty-three, along with their teachers. Random assignment is what makes it valuable: the comparison is not between schools that chose small classes and schools that did not. The children in the smaller classes performed measurably better, by something in the region of a fifth of a standard deviation, and follow-up work reported that some of the advantage was still detectable years later in the rate at which they sat college entrance examinations.

C) Observational studies of the same question point in every direction, and the reason is instructive rather than embarrassing. Class size is not assigned at random in the world: schools put struggling children in smaller groups, wealthy districts fund smaller classes, and a popular school is a large one. A naive comparison therefore finds either that small classes are associated with poor results, because that is where the difficulties were placed, or with good ones, because that is where the money is. The better observational work exploits rules creating arbitrary differences — a regulation capping a class at thirty produces two classes of sixteen when the thirty-third child enrols — and those studies find effects that are positive, small, and often not distinguishable from zero.

D) The reduction actually attempted at scale went badly, and it is the most important case in the literature. California legislated a cap in the mid-1990s and reduced class sizes across the state within two years. To staff the new classes the system hired about twenty-five thousand additional teachers, which it did by lowering the proportion who were fully certified, and the least experienced of them were distributed disproportionately to the schools serving the poorest children, because those schools were the ones with vacancies. The measured effect on attainment was approximately nothing, and the gap between richer and poorer districts widened. Nothing in that outcome contradicts the Tennessee result. It shows that a class-size policy is also a teacher-recruitment policy, and that the second can cancel the first.

E) There is a further point the debate mostly avoids, and I think it is the decisive one. A smaller class permits different teaching; it does not produce it. The evidence from classroom observation is that most teachers, given fewer children, continue teaching much as they did before, which is not a criticism of them: the practice was formed under the old constraint and nothing in the reduction tells them what to change. Where reductions have worked, they have been accompanied by explicit retraining in what the smaller group makes possible, and where they have not, they have not.

F) I am unpersuaded by the two positions that dominate public argument. The claim that class size does not matter is false, and rests on reading a set of small and imprecise effects as a zero. The claim that reducing class size is the obvious priority is also wrong, because it compares the policy with nothing instead of with what the same money would otherwise buy, and the honest comparison is unflattering: the same expenditure directed at the quality of teaching appears to produce larger gains in every study that has set the two side by side.

G) What I would conclude is narrower and less satisfying than either camp wants. Class size matters most where it is smallest, youngest and most disadvantaged — the Tennessee conditions — and the effect attenuates rapidly outside them. A reduction from thirty to twenty-eight is not a small version of a reduction from twenty-three to fifteen; it is very probably nothing at all, purchased at great expense. The policy question is not whether smaller is better but whether this particular reduction, for these children, with these teachers, is the best available use of the money, and that question has to be answered locally each time, which is exactly why it keeps being replaced with the general one.`,
      questions: [
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "an example of a rule that creates an arbitrary difference in class size",
          "C",
          "The better observational work exploits rules creating arbitrary differences — a regulation capping a class at thirty produces two classes of sixteen when the thirty-third child enrols — and those studies find effects that are positive, small, and often not distinguishable from zero.",
          "Paragraph C gives the enrolment-cap example.",
        ),
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "an account of how a large reduction was staffed",
          "D",
          "To staff the new classes the system hired about twenty-five thousand additional teachers, which it did by lowering the proportion who were fully certified, and the least experienced of them were distributed disproportionately to the schools serving the poorest children, because those schools were the ones with vacancies.",
          "Paragraph D describes the hiring.",
        ),
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "why random assignment gave one study its weight",
          "B",
          "Random assignment is what makes it valuable: the comparison is not between schools that chose small classes and schools that did not.",
          "Paragraph B explains the randomisation.",
        ),
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "an observation that practice does not change without retraining",
          "E",
          "The evidence from classroom observation is that most teachers, given fewer children, continue teaching much as they did before, which is not a criticism of them: the practice was formed under the old constraint and nothing in the reduction tells them what to change.",
          "Paragraph E reports unchanged practice.",
        ),
        fromList(
          "matching_information",
          CLASS_PARAGRAPHS,
          "a rejection of both of the usual public positions",
          "F",
          "I am unpersuaded by the two positions that dominate public argument.",
          "Paragraph F dismisses both camps.",
        ),
        ynng(
          "The writer believes class size has no effect on attainment.",
          "NO",
          "The claim that class size does not matter is false, and rests on reading a set of small and imprecise effects as a zero.",
          "That claim 'is false'.",
        ),
        ynng(
          "The writer thinks the Californian outcome contradicts the Tennessee finding.",
          "NO",
          "Nothing in that outcome contradicts the Tennessee result.",
          "'Nothing in that outcome contradicts' it.",
        ),
        ynng(
          "The writer accepts that a smaller class makes different teaching possible.",
          "YES",
          "A smaller class permits different teaching; it does not produce it.",
          "It 'permits different teaching'.",
        ),
        ynng(
          "The writer thinks the question has to be settled case by case.",
          "YES",
          "The policy question is not whether smaller is better but whether this particular reduction, for these children, with these teachers, is the best available use of the money, and that question has to be answered locally each time, which is exactly why it keeps being replaced with the general one.",
          "It must be 'answered locally each time'.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "Comparisons between existing classes point in every direction,",
          "because schools place the children who are struggling in the smaller groups.",
          "Class size is not assigned at random in the world: schools put struggling children in smaller groups, wealthy districts fund smaller classes, and a popular school is a large one.",
          "The groups were never assigned at random.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "Assigning children and teachers at random gave one study its weight,",
          "which is why the comparison is not between schools that chose their own size.",
          "Random assignment is what makes it valuable: the comparison is not between schools that chose small classes and schools that did not.",
          "The schools did not choose.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "The Californian reduction produced no measurable gain,",
          "although the least experienced of the new teachers went to the poorest schools.",
          "The measured effect on attainment was approximately nothing, and the gap between richer and poorer districts widened.",
          "The gap widened as well.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "A reduction on its own does not change how a class is taught,",
          "because nothing in a smaller room tells a teacher what to do differently.",
          "A smaller class permits different teaching; it does not produce it.",
          "Permission is not production.",
        ),
        fromList(
          "matching_sentence_endings",
          CLASS_ENDINGS,
          "Treating reduction as the priority compares it with the wrong alternative,",
          "since the same money spent on teaching quality appears to achieve more.",
          "The claim that reducing class size is the obvious priority is also wrong, because it compares the policy with nothing instead of with what the same money would otherwise buy, and the honest comparison is unflattering: the same expenditure directed at the quality of teaching appears to produce larger gains in every study that has set the two side by side.",
          "The same money buys more elsewhere.",
        ),
      ],
    },
  ],
};
