import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, word bank, choose TWO ----

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SEAWEED_BANK = [
  "fertiliser",
  "alginate",
  "moisture",
  "sachets",
  "compost",
  "labels",
  "harvest",
  "coatings",
  "kelp",
  "shelf",
];
const SEAWEED_STEM = "Which TWO advantages of seaweed over land crops are given?";
const SEAWEED_ADVANTAGES = [
  "it does not require fresh water",
  "it can be harvested by machine in any weather",
  "it needs no fertiliser",
  "it produces a material stronger than conventional plastic",
  "it can be grown in any ocean at any depth",
];

// ---- Passage 3 · research debate · sentence endings ------------------------

const SLEEP_ENDINGS = [
  "because the same patterns of activity are replayed during deep sleep.",
  "when a smell or sound present during learning is repeated in sleep.",
  "because the brain is unable to form any memories while asleep.",
  "when connections strengthened during the day are scaled back overnight.",
  "because people who sleep more are generally more intelligent.",
  "when volunteers are kept awake before they learn rather than after.",
];

export const TEST_49: CuratedTest = {
  key: "full-test-49",
  targetBand: 8,
  passages: [
    {
      key: "t49-p1-scurvy",
      title: "Twelve Sailors, Six Treatments",
      topic: "James Lind's experiment and the long delay before it was used",
      difficulty: 7,
      body: `Between the sixteenth and the nineteenth centuries, scurvy killed more sailors than storms, shipwreck and enemy action combined. On long voyages the symptoms appeared after about six weeks without fresh food: exhaustion, bleeding gums, teeth that loosened and fell out, skin that bruised at a touch, and — the detail that most impressed surgeons — old wounds that had healed years earlier reopening as though freshly made. Crews that set out healthy could lose half their number on a single passage, and one British squadron sent round the world in 1740 returned with fewer than two hundred of the nearly two thousand men who had sailed.

Explanations were plentiful and mostly wrong. The disease was attributed to damp air, to idleness, to salt meat, to a blockage of the spleen, to homesickness. Many of these had a grain of plausibility, since scurvy did appear on damp ships crewed by bored men eating preserved food, and the true cause — the absence of a compound that the human body, unlike almost every other mammal, cannot manufacture for itself — could not be identified with the chemistry of the time. Sailors themselves often knew that citrus fruit helped, as did several earlier physicians, but such knowledge circulated as one remedy among dozens of useless ones, with nothing to distinguish it.

In 1747, a Scottish naval surgeon named James Lind carried out the experiment that is usually described as the first controlled clinical trial. Aboard a ship in the Channel he selected twelve sailors already suffering from scurvy, put them in the same quarters, fed them an identical diet, and divided them into six pairs. Each pair received a different treatment: cider; drops of a strong acid; vinegar; sea water; a paste of garlic, mustard and other ingredients; and two oranges and a lemon a day. Within six days the citrus pair had improved so far that one was fit for duty and the other was nursing the rest. Nobody else recovered.

What Lind did next is the part usually omitted. He published his findings in 1753, but in a book of more than four hundred pages, in which the trial occupies a few paragraphs and is surrounded by discussion of every competing theory, most of which he did not reject. He was not certain that citrus alone was decisive, and he recommended preparing juice as a concentrate by boiling it — a process that destroys the very compound responsible, and which produced a remedy that often failed. The Navy did not act.

Four decades passed. The delay had causes beyond stubbornness: fresh fruit was expensive and perished, the supply chain for a fleet at sea was formidable, and Lind's own recommendations were equivocal. Change came in 1795, largely through the efforts of another physician, Gilbert Blane, who had the advantage of a seat on the naval medical board and the habit of collecting statistics. Lemon juice was issued to the fleet, and scurvy effectively disappeared from the Royal Navy within two years — at a moment, during a long war, when the difference in available manpower was strategically significant.

The story does not end tidily. Later in the nineteenth century the Navy switched its supply from Mediterranean lemons to limes from its own Caribbean colonies, which are markedly poorer in the active compound, and the juice was often pumped through copper piping, which destroyed more of it. Confidence in citrus fell, the disease reappeared on polar expeditions, and theories about tainted tinned meat gained ground. The compound itself was not isolated and identified until the 1930s, when it was named after the disease it prevents.

Lind himself had a respectable later career, running a naval hospital and writing on the health of seamen in the tropics, and he is commemorated in the names of wards and research institutes. He is not, however, the figure the story usually makes him: a lone genius ignored by fools. He was a careful surgeon who ran one good experiment among a great deal of ordinary eighteenth-century medicine, and who did not himself see clearly what he had shown.

The episode is taught in medical schools for its method and ought to be taught for its aftermath. Lind ran a clean experiment, obtained an unambiguous result, published it, and watched it fail to change anything for a generation, partly because he presented it as one finding among many and partly because the institution that needed it had no mechanism for acting on evidence. The trial is the famous part. The forty years are the instructive part.`,
      questions: [
        tfng(
          "Scurvy caused more deaths among sailors than combat and shipwreck together.",
          "TRUE",
          "Between the sixteenth and the nineteenth centuries, scurvy killed more sailors than storms, shipwreck and enemy action combined.",
          "It killed more 'than storms, shipwreck and enemy action combined'.",
        ),
        tfng(
          "Symptoms typically appeared within a week of leaving port.",
          "FALSE",
          "On long voyages the symptoms appeared after about six weeks without fresh food: exhaustion, bleeding gums, teeth that loosened and fell out, skin that bruised at a touch, and — the detail that most impressed surgeons — old wounds that had healed years earlier reopening as though freshly made.",
          "They appeared 'after about six weeks'.",
        ),
        tfng(
          "Humans can produce the missing compound themselves.",
          "FALSE",
          "Many of these had a grain of plausibility, since scurvy did appear on damp ships crewed by bored men eating preserved food, and the true cause — the absence of a compound that the human body, unlike almost every other mammal, cannot manufacture for itself — could not be identified with the chemistry of the time.",
          "The body 'cannot manufacture [it] for itself'.",
        ),
        tfng(
          "Nobody before Lind had suspected that citrus fruit was beneficial.",
          "FALSE",
          "Sailors themselves often knew that citrus fruit helped, as did several earlier physicians, but such knowledge circulated as one remedy among dozens of useless ones, with nothing to distinguish it.",
          "Sailors and earlier physicians already knew.",
        ),
        tfng(
          "All twelve sailors in Lind's trial ate the same food apart from their treatment.",
          "TRUE",
          "Aboard a ship in the Channel he selected twelve sailors already suffering from scurvy, put them in the same quarters, fed them an identical diet, and divided them into six pairs.",
          "He 'fed them an identical diet'.",
        ),
        tfng(
          "Lind concluded firmly that citrus fruit was the only effective remedy.",
          "FALSE",
          "He was not certain that citrus alone was decisive, and he recommended preparing juice as a concentrate by boiling it — a process that destroys the very compound responsible, and which produced a remedy that often failed.",
          "'He was not certain that citrus alone was decisive'.",
        ),
        tfng(
          "Blane's reforms reduced scurvy in the Royal Navy within a few years.",
          "TRUE",
          "Lemon juice was issued to the fleet, and scurvy effectively disappeared from the Royal Navy within two years — at a moment, during a long war, when the difference in available manpower was strategically significant.",
          "It 'effectively disappeared… within two years'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Surgeons were struck by old ______ reopening after years.",
          "wounds",
          "On long voyages the symptoms appeared after about six weeks without fresh food: exhaustion, bleeding gums, teeth that loosened and fell out, skin that bruised at a touch, and — the detail that most impressed surgeons — old wounds that had healed years earlier reopening as though freshly made.",
          "'Old wounds… reopening as though freshly made'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In Lind's trial, the sailors were divided into six ______.",
          "pairs",
          "Aboard a ship in the Channel he selected twelve sailors already suffering from scurvy, put them in the same quarters, fed them an identical diet, and divided them into six pairs.",
          "He 'divided them into six pairs'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The successful pair were given two oranges and a ______ each day.",
          "lemon",
          "Each pair received a different treatment: cider; drops of a strong acid; vinegar; sea water; a paste of garlic, mustard and other ingredients; and two oranges and a lemon a day.",
          "They received 'two oranges and a lemon a day'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Lind advised turning juice into a ______ by boiling it.",
          "concentrate",
          "He was not certain that citrus alone was decisive, and he recommended preparing juice as a concentrate by boiling it — a process that destroys the very compound responsible, and which produced a remedy that often failed.",
          "He recommended 'preparing juice as a concentrate by boiling it'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The Navy later replaced lemons with ______ from its Caribbean colonies.",
          "limes",
          "Later in the nineteenth century the Navy switched its supply from Mediterranean lemons to limes from its own Caribbean colonies, which are markedly poorer in the active compound, and the juice was often pumped through copper piping, which destroyed more of it.",
          "It switched 'to limes from its own Caribbean colonies'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Juice was also damaged by being pumped through ______ piping.",
          "copper",
          "Later in the nineteenth century the Navy switched its supply from Mediterranean lemons to limes from its own Caribbean colonies, which are markedly poorer in the active compound, and the juice was often pumped through copper piping, which destroyed more of it.",
          "It was pumped 'through copper piping'.",
        ),
      ],
    },
    {
      key: "t49-p2-seaweed-packaging",
      title: "Packaging That Grew in the Sea",
      topic: "using seaweed to replace some single-use plastics",
      difficulty: 8,
      body: `A) Seaweed is an unusually convenient crop. It needs no land and no fresh water, taking everything it requires from the sea around it. No fertiliser is applied to it either, and it grows extremely fast, with some species adding half a metre in a week. It is farmed already on a scale most people are unaware of, principally in China, Indonesia, South Korea and the Philippines, where tens of millions of wet tonnes are harvested each year for food and for thickening agents used in the food industry. That existing industry is what makes the packaging proposition credible: the supply chain is not hypothetical.

B) The material of interest is a family of long-chain sugars found in the cell walls of brown and red seaweeds, of which alginate is the best known. Extracted and dried, these form films, sheets and gels. A sheet can be made flexible or brittle, transparent or opaque, edible or merely compostable, depending on what is mixed in. None of this is new chemistry — alginates have been used in food and medicine for a century — and the innovation is in processing it into packaging that holds up in a supply chain.

C) The products that work best are the ones that do not have to last. Sachets holding a single serving of sauce, films that dissolve in hot water, coatings sprayed onto fruit to slow its drying, and pouches for drinks at events where the container is used for ten minutes and then discarded: in each case a material that breaks down in weeks is an advantage rather than a defect. Several of these are in commercial use, and the drinks pouches in particular have been used at large sporting events, where the alternative is tens of thousands of plastic bottles collected by hand.

D) The limitation is moisture. Films made from sugars are hydrophilic — they attract water — which is exactly why they compost so readily and exactly why they struggle to protect anything that must stay dry for months. A crisp packet must keep out water vapour and oxygen for the best part of a year; a seaweed film, unassisted, cannot. The usual solution is a thin synthetic coating or a layer of another material, which restores the barrier and destroys the compostability, returning the product to the same category as the packaging it was meant to replace.

E) Cost is the second obstacle and is changing slowly. Conventional plastics are made in enormous, highly optimised facilities from a feedstock that is a by-product of fuel refining, and they are astonishingly cheap. Seaweed materials are made in small plants from a crop that must be harvested, washed, extracted and dried, and they cost several times as much per unit. The gap narrows where regulation prices in disposal — taxes on single-use plastic, bans on particular items, charges levied on producers for the waste their packaging creates — which is why the companies in this field pay close attention to legislation rather than to chemistry.

F) Labelling has become its own problem. Words such as biodegradable, compostable and plant-based are used loosely and mean different things: a material may break down only in an industrial composter held at high temperature, only in a home compost heap, only in soil, or only in sea water, and these are not interchangeable. Consumers routinely put compostable packaging into recycling streams, where it contaminates them, or into the sea on the assumption that it will vanish. Standards exist, but the symbols are small and the categories are unintuitive, and a shopper deciding between two packets in a supermarket aisle has neither the time nor the information to tell them apart.

G) The realistic assessment is that seaweed will not replace plastic and does not need to in order to be worth developing. Something like a third of plastic production goes into packaging, and a significant share of that is in short-life items where a material that composts in weeks is genuinely better suited than one that persists for centuries. Capturing that share would be a substantial achievement. Claims beyond it — that the material will end ocean plastic, or that farming it at the necessary scale carries no ecological consequences of its own — are the sort of claims that have preceded disappointment in every previous generation of replacement materials.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to an industry that already exists at scale",
          "A",
          "That existing industry is what makes the packaging proposition credible: the supply chain is not hypothetical.",
          "Paragraph A: the supply chain 'is not hypothetical'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "examples of products designed to have a short life",
          "C",
          "Sachets holding a single serving of sauce, films that dissolve in hot water, coatings sprayed onto fruit to slow its drying, and pouches for drinks at events where the container is used for ten minutes and then discarded: in each case a material that breaks down in weeks is an advantage rather than a defect.",
          "Paragraph C lists the short-life products.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why a solution to one problem creates another",
          "D",
          "The usual solution is a thin synthetic coating or a layer of another material, which restores the barrier and destroys the compostability, returning the product to the same category as the packaging it was meant to replace.",
          "Paragraph D: the coating fixes the barrier and ruins the composting.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the observation that companies watch lawmakers rather than laboratories",
          "E",
          "The gap narrows where regulation prices in disposal — taxes on single-use plastic, bans on particular items, charges levied on producers for the waste their packaging creates — which is why the companies in this field pay close attention to legislation rather than to chemistry.",
          "Paragraph E: they watch legislation.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a warning about claims that go beyond what the material can do",
          "G",
          "Claims beyond it — that the material will end ocean plastic, or that farming it at the necessary scale carries no ecological consequences of its own — are the sort of claims that have preceded disappointment in every previous generation of replacement materials.",
          "Paragraph G warns about overclaiming.",
        ),
        pickTwo(
          SEAWEED_STEM,
          SEAWEED_ADVANTAGES,
          "A or C",
          "It needs no land and no fresh water, taking everything it requires from the sea around it.",
          "A is given: it needs no fresh water.",
        ),
        pickTwo(
          SEAWEED_STEM,
          SEAWEED_ADVANTAGES,
          "A or C",
          "No fertiliser is applied to it either, and it grows extremely fast, with some species adding half a metre in a week.",
          "C is given: 'No fertiliser is applied to it either.' B, D and E are not claimed.",
        ),
        fromList(
          "summary_completion",
          SEAWEED_BANK,
          "Seaweed grows without land, without fresh water and without ______.",
          "fertiliser",
          "No fertiliser is applied to it either, and it grows extremely fast, with some species adding half a metre in a week.",
          "'No fertiliser is applied to it either.'",
        ),
        fromList(
          "summary_completion",
          SEAWEED_BANK,
          "The best-known of the useful sugars is ______.",
          "alginate",
          "The material of interest is a family of long-chain sugars found in the cell walls of brown and red seaweeds, of which alginate is the best known.",
          "'Alginate is the best known'.",
        ),
        fromList(
          "summary_completion",
          SEAWEED_BANK,
          "Single-serving ______ are among the products already sold.",
          "sachets",
          "Sachets holding a single serving of sauce, films that dissolve in hot water, coatings sprayed onto fruit to slow its drying, and pouches for drinks at events where the container is used for ten minutes and then discarded: in each case a material that breaks down in weeks is an advantage rather than a defect.",
          "The list begins with sachets.",
        ),
        fromList(
          "summary_completion",
          SEAWEED_BANK,
          "Sprayed ______ can slow the drying of fruit.",
          "coatings",
          "Sachets holding a single serving of sauce, films that dissolve in hot water, coatings sprayed onto fruit to slow its drying, and pouches for drinks at events where the container is used for ten minutes and then discarded: in each case a material that breaks down in weeks is an advantage rather than a defect.",
          "'Coatings sprayed onto fruit to slow its drying'.",
        ),
        fromList(
          "summary_completion",
          SEAWEED_BANK,
          "The films attract water, so they cannot keep out ______ for long.",
          "moisture",
          "Films made from sugars are hydrophilic — they attract water — which is exactly why they compost so readily and exactly why they struggle to protect anything that must stay dry for months.",
          "They 'struggle to protect anything that must stay dry'.",
        ),
        fromList(
          "summary_completion",
          SEAWEED_BANK,
          "Confusing ______ lead shoppers to dispose of the material wrongly.",
          "labels",
          "Words such as biodegradable, compostable and plant-based are used loosely and mean different things: a material may break down only in an industrial composter held at high temperature, only in a home compost heap, only in soil, or only in sea water, and these are not interchangeable.",
          "The loose labelling misleads shoppers.",
        ),
      ],
    },
    {
      key: "t49-p3-sleep-memory",
      title: "What the Sleeping Brain Is Doing",
      topic: "the role of sleep in fixing and reorganising memories",
      difficulty: 9,
      body: `The idea that sleep does something for memory is old, and for most of its history it rested on a simple observation: material learned before a night's sleep is remembered better than material learned before an equivalent period awake. That result, first reported in the 1920s, was for decades explained passively. Sleep protects a fragile new memory by preventing new experiences from interfering with it. Nothing more was required.

The modern account is not passive. Recordings from the brains of rats running a maze show that the cells encoding positions along the route fire in a particular sequence, and that the same sequence is replayed, compressed into a fraction of the time, during subsequent slow-wave sleep. Similar patterns have since been found in human brain activity. On this view the sleeping brain is rehearsing, transferring information from the structures that record an experience quickly to the cortical networks that hold it in the long term.

The most persuasive human experiments involve interference with that process. If a smell is present while volunteers learn the positions of objects on a screen, and the same smell is delivered while they are in deep sleep, their recall the next morning is measurably better than that of volunteers given the smell at the wrong time or not at all. The same works with sounds paired to particular items: cue a subset during sleep and those items are remembered better, at the apparent expense of the ones not cued. This technique — presenting learning cues to a sleeping brain — demonstrates that the timing of the reactivation causes the improvement, rather than merely accompanying it.

Different stages appear to do different work. Slow-wave sleep, concentrated in the first half of the night, is associated with memory for facts and events. The rapid-eye-movement stage, which dominates later, is associated with emotional memory and with the integration of new material into existing knowledge — with noticing, for example, that a set of examples follows a rule. Volunteers who sleep between learning a set of items and being tested on them are more likely to extract the underlying pattern, not merely to recall the items.

A second theory runs alongside the first and may be complementary. Learning strengthens connections between neurons, and strengthening cannot continue indefinitely without saturating the system and consuming more energy than the brain can supply. On this account, sleep — and slow-wave sleep in particular — scales connections back proportionally, weakening all of them while preserving their relative strengths, so that the strongest survive the night and the weakest are pruned. This would improve the signal relative to the noise, and it would explain why sleep improves memory for what mattered rather than for everything.

The everyday implications are less dramatic than the popular versions. Sleeping after study helps, and the effect is meaningful but modest. Sleeping badly before learning is worse than sleeping badly afterwards, because the structures that encode new information work poorly when tired, which is an argument against staying up to prepare for an examination that goes beyond the obvious one. Napping produces some of the same benefit, and short naps containing slow-wave sleep have measurable effects on retention.

What does not work is learning during sleep, in the sense that the term is usually sold. Playing a recording of vocabulary to a sleeping person does not teach them the vocabulary; attempts to demonstrate this have consistently failed since the 1950s, when electroencephalography made it possible to confirm that subjects were genuinely asleep rather than drowsily listening. What can be formed during sleep are simple associations — between a smell and a sound, for instance — and existing memories can be strengthened by cueing. Neither amounts to acquiring new knowledge, and the difference is worth keeping clear, because the false version has been marketed continuously for seventy years.

The research has also been used to argue for later school start times, on the grounds that adolescents' internal clocks shift and that early starts cut into precisely the late-night sleep richest in the rapid-eye-movement stage. Where districts have made the change, most studies report modest improvements in attendance and grades, along with substantial logistical complaints. It is a rare case of a laboratory finding about sleep reaching a policy decision, and it has been argued about in exactly the terms the evidence deserves: a real but moderate effect, weighed against the cost of rearranging a bus timetable.`,
      questions: [
        mcq(
          "How was the effect of sleep on memory explained for most of the twentieth century?",
          [
            "as an active process of rehearsal",
            "as protection from interference by new experiences",
            "as a consequence of dreaming",
            "as an effect of rest on the muscles",
          ],
          "as protection from interference by new experiences",
          "Sleep protects a fragile new memory by preventing new experiences from interfering with it.",
          "The old account was passive protection from interference.",
        ),
        mcq(
          "What do recordings from rats running a maze show?",
          [
            "that rats sleep more after learning",
            "that position-encoding cells replay their sequence during sleep",
            "that memory is stored in the cortex immediately",
            "that rats dream about food",
          ],
          "that position-encoding cells replay their sequence during sleep",
          "Recordings from the brains of rats running a maze show that the cells encoding positions along the route fire in a particular sequence, and that the same sequence is replayed, compressed into a fraction of the time, during subsequent slow-wave sleep.",
          "The sequence 'is replayed… during subsequent slow-wave sleep'.",
        ),
        mcq(
          "Why are the smell and sound experiments important?",
          [
            "They show that reactivation during sleep causes the improvement.",
            "They show that smells are remembered better than sounds.",
            "They prove that people can learn new words while asleep.",
            "They demonstrate that dreaming is necessary for memory.",
          ],
          "They show that reactivation during sleep causes the improvement.",
          "This technique — presenting learning cues to a sleeping brain — demonstrates that the timing of the reactivation causes the improvement, rather than merely accompanying it.",
          "The timing 'causes the improvement'.",
        ),
        mcq(
          "What does the second theory propose that sleep does to connections between neurons?",
          [
            "It strengthens all of them equally.",
            "It removes the strongest to save energy.",
            "It scales them back while preserving their relative strengths.",
            "It leaves them unchanged until the next period of learning.",
          ],
          "It scales them back while preserving their relative strengths.",
          "On this account, sleep — and slow-wave sleep in particular — scales connections back proportionally, weakening all of them while preserving their relative strengths, so that the strongest survive the night and the weakest are pruned.",
          "It 'scales connections back proportionally'.",
        ),
        fromList(
          "matching_sentence_endings",
          SLEEP_ENDINGS,
          "A route learned during the day may be strengthened overnight",
          "because the same patterns of activity are replayed during deep sleep.",
          "Recordings from the brains of rats running a maze show that the cells encoding positions along the route fire in a particular sequence, and that the same sequence is replayed, compressed into a fraction of the time, during subsequent slow-wave sleep.",
          "The sequence is replayed during slow-wave sleep.",
        ),
        fromList(
          "matching_sentence_endings",
          SLEEP_ENDINGS,
          "Particular items can be remembered better than others",
          "when a smell or sound present during learning is repeated in sleep.",
          "The same works with sounds paired to particular items: cue a subset during sleep and those items are remembered better, at the apparent expense of the ones not cued.",
          "Cued items are remembered better.",
        ),
        fromList(
          "matching_sentence_endings",
          SLEEP_ENDINGS,
          "The useful signal may stand out more clearly",
          "when connections strengthened during the day are scaled back overnight.",
          "This would improve the signal relative to the noise, and it would explain why sleep improves memory for what mattered rather than for everything.",
          "Scaling back improves 'the signal relative to the noise'.",
        ),
        fromList(
          "matching_sentence_endings",
          SLEEP_ENDINGS,
          "Learning is impaired more severely",
          "when volunteers are kept awake before they learn rather than after.",
          "Sleeping badly before learning is worse than sleeping badly afterwards, because the structures that encode new information work poorly when tired, which is an argument against staying up to prepare for an examination that goes beyond the obvious one.",
          "Poor sleep before learning 'is worse than sleeping badly afterwards'.",
        ),
        ynng(
          "The writer accepts that the sleeping brain actively reprocesses what was learned.",
          "YES",
          "On this view the sleeping brain is rehearsing, transferring information from the structures that record an experience quickly to the cortical networks that hold it in the long term.",
          "The brain 'is rehearsing'.",
        ),
        ynng(
          "The writer regards the two theories of sleep and memory as incompatible.",
          "NO",
          "A second theory runs alongside the first and may be complementary.",
          "The second 'may be complementary'.",
        ),
        ynng(
          "The writer thinks the practical benefits of sleeping after study are large.",
          "NO",
          "Sleeping after study helps, and the effect is meaningful but modest.",
          "The effect is 'meaningful but modest'.",
        ),
        ynng(
          "The writer believes vocabulary can be acquired by listening to recordings while asleep.",
          "NO",
          "Playing a recording of vocabulary to a sleeping person does not teach them the vocabulary; attempts to demonstrate this have consistently failed since the 1950s, when electroencephalography made it possible to confirm that subjects were genuinely asleep rather than drowsily listening.",
          "It 'does not teach them the vocabulary'.",
        ),
        ynng(
          "The writer considers the debate over school start times to have been conducted reasonably.",
          "YES",
          "It is a rare case of a laboratory finding about sleep reaching a policy decision, and it has been argued about in exactly the terms the evidence deserves: a real but moderate effect, weighed against the cost of rearranging a bus timetable.",
          "It was argued 'in exactly the terms the evidence deserves'.",
        ),
        ynng(
          "The writer states that adults need more sleep than adolescents.",
          "NOT GIVEN",
          "",
          "The passage discusses adolescents' clocks but never compares how much sleep the two groups need.",
        ),
      ],
    },
  ],
};
