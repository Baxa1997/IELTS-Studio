import { fromList, gapFill, noteLine, pickTwo, tfng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of invention · flow-chart --------------------------

const HOPPING = {
  title: "How the 1941 system was meant to work",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · people, word bank, choose TWO -----------------

const REACTOR_PEOPLE = ["Sonia Vargas", "Henrik Dahl", "Priya Sundaram", "Ben Okonjo"];
const REACTOR_BANK = [
  "factory",
  "licensing",
  "fuel",
  "cooling",
  "orders",
  "gravity",
  "waste",
  "site",
  "steam",
  "grid",
];
const REACTOR_STEM =
  "Which TWO features are said to distinguish small modular reactors from large ones?";
const REACTOR_FEATURES = [
  "most of the construction happens in a factory",
  "they produce no radioactive waste",
  "they can shut down safely without pumps or operators",
  "they use a fuel that cannot be used in large reactors",
  "they need no regulatory licence",
];

// ---- Passage 3 · research debate · lettered paragraphs, people --------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const AGEING_PEOPLE = ["Nora Feldman", "Ivan Petrov", "Grace Lam", "Samuel Achebe"];

export const TEST_50: CuratedTest = {
  key: "full-test-50",
  targetBand: 8,
  passages: [
    {
      key: "t50-p1-frequency-hopping",
      title: "The Patent and the Piano Roll",
      topic: "how a film star and a composer patented a way of hiding a radio signal",
      difficulty: 7,
      body: `In 1942 the United States Patent Office granted a patent for a "secret communication system" to two applicants: a composer of avant-garde music and one of the most photographed film actresses in the world. The invention described a method of preventing a radio signal from being jammed, and the principle behind it is now used, in developed form, in most of the wireless devices in daily use.

The actress had been born Hedwig Kiesler in Vienna in 1914. Her first marriage, at nineteen, was to a wealthy manufacturer of munitions whose business entertained the engineers and officers of two governments; she sat through their dinners, listening to discussions of weapons systems that included the difficulty of controlling a torpedo by radio. She left the marriage and the country in 1937, reached London, negotiated a Hollywood contract on the voyage across the Atlantic, and arrived as Hedy Lamarr. Within three years she was among the best-known faces in American cinema, and her studio had no interest whatever in what she did with her evenings, which was tinker with inventions at a drawing board she kept at home.

The problem she turned to in 1940 was a real one. A torpedo steered by radio could be guided precisely, but the enemy had only to find the frequency the operator was using and broadcast noise on it to jam the signal, or worse, to take control. Keeping the frequency secret was impossible; a receiver could scan for it in seconds.

The solution she proposed with George Antheil, a composer she met at a dinner party, was to stop using one frequency. If the transmitter changed frequency many times a second, in a sequence known in advance to the receiver and to nobody else, then a listener could catch only fragments of the message, and a jammer would have to block every frequency at once to be sure of blocking the right one. The difficulty was keeping the two ends in step. Antheil had experience of exactly this problem from an unlikely direction: he had composed a piece for sixteen player pianos that had to be synchronised by identical perforated paper rolls. The patent specified rolls of that kind, with eighty-eight possible frequencies — the number of keys on a piano.

The Navy rejected it. The documented objection was that the mechanism was too bulky to fit inside a torpedo, a reasonable judgement in 1942 about a design involving paper rolls; the persistent story that an official dismissed it because it came from an actress is not supported by the archives, although Lamarr was told that she could contribute more by selling war bonds, which she did, to considerable effect.

The patent expired in 1959 without being used. By then electronics had replaced the paper roll, and versions of the idea — now called frequency hopping, one branch of a family of techniques known as spread spectrum — appeared in military communication systems from the 1960s. Whether the engineers who developed them had read the patent is disputed; it was in the public record, and similar ideas had been proposed independently before and since.

What is not disputed is the principle's later career. Spread-spectrum methods, in which a signal is distributed across many frequencies rather than concentrated on one, are fundamental to the systems that allow large numbers of devices to share a crowded band of radio without drowning each other out. Wireless networking, satellite navigation and short-range links between everyday devices all depend on relatives of the idea.

Antheil's own career took a different turn. He had been a scandalous figure in 1920s Paris, whose mechanical music provoked riots, and he spent his later years writing film scores, a syndicated advice column on relationships and a book about glandular criminology, which has aged less well than the patent.

Recognition arrived very late. Lamarr received an award from a technology foundation in 1997, three years before her death, and was admitted to the national inventors' hall of fame in 2014. The story is now told so often as an illustration of overlooked genius that it risks obscuring the ordinary point it demonstrates: that the useful idea came from someone who had sat through arms-industry dinners and someone who had synchronised sixteen pianos, and that neither of them was working in the field the problem belonged to.`,
      questions: [
        tfng(
          "The 1942 patent was granted to two people from outside the communications industry.",
          "TRUE",
          'In 1942 the United States Patent Office granted a patent for a "secret communication system" to two applicants: a composer of avant-garde music and one of the most photographed film actresses in the world.',
          "The applicants were a composer and an actress.",
        ),
        tfng(
          "Lamarr learned about weapons systems through her first husband's business.",
          "TRUE",
          "Her first marriage, at nineteen, was to a wealthy manufacturer of munitions whose business entertained the engineers and officers of two governments; she sat through their dinners, listening to discussions of weapons systems that included the difficulty of controlling a torpedo by radio.",
          "She listened at his business dinners.",
        ),
        tfng(
          "Her film studio supported her work as an inventor.",
          "FALSE",
          "Within three years she was among the best-known faces in American cinema, and her studio had no interest whatever in what she did with her evenings, which was tinker with inventions at a drawing board she kept at home.",
          "The studio 'had no interest whatever'.",
        ),
        tfng(
          "A radio-guided torpedo could be disabled by broadcasting noise on its frequency.",
          "TRUE",
          "A torpedo steered by radio could be guided precisely, but the enemy had only to find the frequency the operator was using and broadcast noise on it to jam the signal, or worse, to take control.",
          "The enemy could 'broadcast noise on it to jam the signal'.",
        ),
        tfng(
          "Antheil's musical work had involved synchronising several instruments.",
          "TRUE",
          "Antheil had experience of exactly this problem from an unlikely direction: he had composed a piece for sixteen player pianos that had to be synchronised by identical perforated paper rolls.",
          "He synchronised 'sixteen player pianos'.",
        ),
        tfng(
          "Records confirm that the Navy rejected the patent because of Lamarr's profession.",
          "FALSE",
          "The documented objection was that the mechanism was too bulky to fit inside a torpedo, a reasonable judgement in 1942 about a design involving paper rolls; the persistent story that an official dismissed it because it came from an actress is not supported by the archives, although Lamarr was told that she could contribute more by selling war bonds, which she did, to considerable effect.",
          "That story 'is not supported by the archives'.",
        ),
        tfng(
          "It is certain that later engineers based their systems on the 1942 patent.",
          "FALSE",
          "Whether the engineers who developed them had read the patent is disputed; it was in the public record, and similar ideas had been proposed independently before and since.",
          "The question 'is disputed'.",
        ),
        noteLine(
          HOPPING,
          null,
          "The transmitter changes ______ many times each second",
          "frequency",
          "If the transmitter changed frequency many times a second, in a sequence known in advance to the receiver and to nobody else, then a listener could catch only fragments of the message, and a jammer would have to block every frequency at once to be sure of blocking the right one.",
          "It 'changed frequency many times a second'.",
        ),
        noteLine(
          HOPPING,
          null,
          "Identical paper ______ keep transmitter and receiver in step",
          "rolls",
          "The patent specified rolls of that kind, with eighty-eight possible frequencies — the number of keys on a piano.",
          "The patent specified paper rolls to synchronise them.",
          { before: [{ text: "Both ends follow the same secret sequence", indent: 0 }] },
        ),
        noteLine(
          HOPPING,
          null,
          "Anyone listening on one channel hears only ______ of the message",
          "fragments",
          "If the transmitter changed frequency many times a second, in a sequence known in advance to the receiver and to nobody else, then a listener could catch only fragments of the message, and a jammer would have to block every frequency at once to be sure of blocking the right one.",
          "A listener 'could catch only fragments'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Lamarr negotiated a Hollywood contract while crossing the ______.",
          "Atlantic",
          "She left the marriage and the country in 1937, reached London, negotiated a Hollywood contract on the voyage across the Atlantic, and arrived as Hedy Lamarr.",
          "She negotiated it 'on the voyage across the Atlantic'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The patent allowed for eighty-eight frequencies, matching the keys of a ______.",
          "piano",
          "The patent specified rolls of that kind, with eighty-eight possible frequencies — the number of keys on a piano.",
          "It matched 'the number of keys on a piano'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The Navy objected that the mechanism was too ______ for a torpedo.",
          "bulky",
          "The documented objection was that the mechanism was too bulky to fit inside a torpedo, a reasonable judgement in 1942 about a design involving paper rolls; the persistent story that an official dismissed it because it came from an actress is not supported by the archives, although Lamarr was told that she could contribute more by selling war bonds, which she did, to considerable effect.",
          "It was 'too bulky to fit inside a torpedo'.",
        ),
      ],
    },
    {
      key: "t50-p2-small-reactors",
      title: "Reactors Off the Production Line",
      topic: "the case for building nuclear power stations in factories",
      difficulty: 8,
      body: `A conventional nuclear power station is one of the largest objects human beings construct. It is assembled on site over a decade or more, from components made specially for it, by a workforce that is rarely assembled twice; almost every recent Western project has finished years late and billions over budget. The proposal behind small modular reactors is to attack that problem not with better engineering but with a different business model: build reactors small enough to be made in a factory, produce them in series, and ship them to sites as finished modules.

The engineering follows from the size. A reactor generating perhaps a tenth of the output of a conventional one can be arranged so that cooling continues by natural circulation if power is lost, because the distances involved are short and heat rises. Several designs are intended to shut down and cool themselves indefinitely with no pumps, no operator action and no external electricity. Nuclear engineer Dr Sonia Vargas regards this as the technically significant change. "You are not adding safety systems," she says. "You are removing the events that need them, which is a different kind of argument and a much stronger one."

The commercial argument is that repetition is what makes things cheap. Aircraft, ships and turbines all became affordable through series production, and each unit built teaches the manufacturer something. A factory producing thirty identical reactors a year would amortise its tooling, keep a skilled workforce together and improve steadily. Energy economist Henrik Dahl points out that this argument contains its own condition. "Series production requires a series," he says. "Every projection I have read assumes an order book that does not exist, and the first ten units carry the costs of a first-of-a-kind plant no matter how small they are."

That condition has already claimed a prominent casualty. A well-advanced American project, with a design approved by the regulator and a consortium of municipal utilities lined up as customers, was cancelled in 2023 after its projected price per unit of electricity rose steeply and enough subscribers withdrew to make the remainder unaffordable. Supporters argue that this is what a first attempt looks like; critics note that it is also what a technology looks like when its economics do not work.

Regulation is the other bottleneck, and it is a genuine dilemma rather than mere obstruction. Safety regimes were designed around large reactors with their particular risks, and each new design must be assessed from first principles — a process taking years and costing a great deal, which must be repeated in every country where a unit is to be sold. Harmonising approvals across borders would transform the economics and is exactly the sort of thing regulators are most reluctant to do. Policy researcher Dr Priya Sundaram describes the current position as a coordination failure. "Thirty designs are each being reviewed thirty times," she says. "The engineering is not the slow part."

Fuel is a less-discussed complication. Several designs require uranium enriched further than the material used in existing power reactors, and the commercial supply of that fuel is currently limited to a small number of producers, one of which is subject to sanctions in several markets. New enrichment capacity is being built, but it takes years, and a reactor without fuel is an expensive building.

The waste question is contested in an unusually specific way. A study published in 2022 calculated that some small designs would produce more radioactive waste per unit of electricity than conventional reactors, because of neutron leakage from a smaller core and the larger surface-to-volume ratio of the structure. Vendors disputed the assumptions, and the answer clearly depends on the design in question. Waste specialist Dr Ben Okonjo argues that the framing is unhelpful either way. "Volume is the wrong measure," he says. "What matters is heat and half-life, and on those the difference between designs is larger than the difference between sizes."

What has changed the mood is demand. Utilities facing rapid growth in electricity consumption — much of it from data centres — are looking for firm, low-carbon supply that can be sited near the load, and several technology companies have signed agreements to buy power from reactors that do not yet exist. Whether those contracts will survive contact with construction schedules is the question the next decade will answer.`,
      questions: [
        fromList(
          "matching_features",
          REACTOR_PEOPLE,
          "The real advance is eliminating the situations that require intervention.",
          "Sonia Vargas",
          '"You are not adding safety systems," she says. "You are removing the events that need them, which is a different kind of argument and a much stronger one."',
          "Vargas: removing the events rather than adding systems.",
        ),
        fromList(
          "matching_features",
          REACTOR_PEOPLE,
          "The cost projections depend on orders that have not been placed.",
          "Henrik Dahl",
          '"Every projection I have read assumes an order book that does not exist, and the first ten units carry the costs of a first-of-a-kind plant no matter how small they are."',
          "Dahl: 'an order book that does not exist'.",
        ),
        fromList(
          "matching_features",
          REACTOR_PEOPLE,
          "Duplicated approvals across countries are the main source of delay.",
          "Priya Sundaram",
          '"Thirty designs are each being reviewed thirty times," she says. "The engineering is not the slow part."',
          "Sundaram on duplicated reviews.",
        ),
        fromList(
          "matching_features",
          REACTOR_PEOPLE,
          "Comparing quantities of waste is the wrong way to judge the question.",
          "Ben Okonjo",
          '"Volume is the wrong measure," he says. "What matters is heat and half-life, and on those the difference between designs is larger than the difference between sizes."',
          "Okonjo: volume is the wrong measure.",
        ),
        fromList(
          "matching_features",
          REACTOR_PEOPLE,
          "Making many identical units is what would bring the price down.",
          "Henrik Dahl",
          '"Series production requires a series," he says.',
          "Dahl's point rests on series production being the source of savings.",
        ),
        fromList(
          "summary_completion",
          REACTOR_BANK,
          "The proposal is to build reactors in a ______ and ship them as modules.",
          "factory",
          "The proposal behind small modular reactors is to attack that problem not with better engineering but with a different business model: build reactors small enough to be made in a factory, produce them in series, and ship them to sites as finished modules.",
          "They would be 'made in a factory'.",
        ),
        fromList(
          "summary_completion",
          REACTOR_BANK,
          "Because the distances are short, ______ can continue by natural circulation.",
          "cooling",
          "A reactor generating perhaps a tenth of the output of a conventional one can be arranged so that cooling continues by natural circulation if power is lost, because the distances involved are short and heat rises.",
          "'Cooling continues by natural circulation'.",
        ),
        fromList(
          "summary_completion",
          REACTOR_BANK,
          "Savings depend on a steady flow of ______ that has not yet appeared.",
          "orders",
          '"Series production requires a series," he says. "Every projection I have read assumes an order book that does not exist, and the first ten units carry the costs of a first-of-a-kind plant no matter how small they are."',
          "The order book 'does not exist'.",
        ),
        fromList(
          "summary_completion",
          REACTOR_BANK,
          "Each design must go through ______ separately in every country.",
          "licensing",
          "Safety regimes were designed around large reactors with their particular risks, and each new design must be assessed from first principles — a process taking years and costing a great deal, which must be repeated in every country where a unit is to be sold.",
          "The assessment 'must be repeated in every country'.",
        ),
        fromList(
          "summary_completion",
          REACTOR_BANK,
          "Some designs need ______ enriched beyond the usual level.",
          "fuel",
          "Several designs require uranium enriched further than the material used in existing power reactors, and the commercial supply of that fuel is currently limited to a small number of producers, one of which is subject to sanctions in several markets.",
          "They 'require uranium enriched further'.",
        ),
        fromList(
          "summary_completion",
          REACTOR_BANK,
          "One study argued that some designs produce more ______ per unit of electricity.",
          "waste",
          "A study published in 2022 calculated that some small designs would produce more radioactive waste per unit of electricity than conventional reactors, because of neutron leakage from a smaller core and the larger surface-to-volume ratio of the structure.",
          "'More radioactive waste per unit of electricity'.",
        ),
        pickTwo(
          REACTOR_STEM,
          REACTOR_FEATURES,
          "A or C",
          "The proposal behind small modular reactors is to attack that problem not with better engineering but with a different business model: build reactors small enough to be made in a factory, produce them in series, and ship them to sites as finished modules.",
          "A is given: they are made in a factory and shipped.",
        ),
        pickTwo(
          REACTOR_STEM,
          REACTOR_FEATURES,
          "A or C",
          "Several designs are intended to shut down and cool themselves indefinitely with no pumps, no operator action and no external electricity.",
          "C is given: shutdown without pumps or operators. B, D and E are contradicted.",
        ),
      ],
    },
    {
      key: "t50-p3-biology-of-ageing",
      title: "The Problem of Getting Old",
      topic: "what research into the biology of ageing has and has not shown",
      difficulty: 9,
      body: `A) Ageing is the largest risk factor for the diseases that kill most people in wealthy countries — heart disease, stroke, cancer, dementia — by a margin that dwarfs smoking, diet and every other factor that receives more attention. A sixty-year-old is roughly a thousand times more likely to die in the next year than a ten-year-old, and the increase is exponential rather than linear. The observation that motivates the field is simple: if the underlying process could be slowed even slightly, the effect on those diseases collectively would exceed anything achievable by curing any one of them.

B) For most of the twentieth century, ageing was understood as accumulated damage, and the question was which damage mattered. The modern framework identifies a set of interconnected processes — instability in the genome, the shortening of the protective sequences at the ends of chromosomes, changes to the chemical marks that control which genes are active, the accumulation of cells that have stopped dividing but refuse to die, declining function in the structures that supply cells with energy, and several others. Biogerontologist Dr Nora Feldman cautions that the list is a description rather than an explanation. "We have a catalogue of things that go wrong together," she says. "Which of them are causes, which are consequences and which are simply passengers is the open question."

C) The most striking results concern the cells that have stopped dividing. These senescent cells accumulate with age and secrete a mixture of inflammatory signals that damages the tissue around them. In mice, drugs that selectively kill such cells — senolytics — improve heart function, physical performance and the condition of several organs, and in some experiments extend remaining lifespan by a modest amount. The results have been reproduced in several laboratories and constitute the strongest evidence that ageing can be manipulated rather than merely described.

D) Two interventions have longer histories. Restricting the calories an animal eats, without malnutrition, extends life in organisms from yeast to mice and has been studied for ninety years; its effect in primates is real but smaller and depends heavily on what the comparison animals eat. A drug developed as an immune suppressant, which acts on a nutrient-sensing pathway also implicated in the response to caloric restriction, extends the lifespan of mice even when given late in life, and is the most reliably life-extending compound known in mammals. Neither finding has produced a treatment, because both interventions have consequences — hunger in the first case, suppressed immunity in the second — that make them unattractive for healthy people.

E) Measurement has improved faster than treatment. Patterns of chemical marks on DNA can now be used to estimate a person's age from a tissue sample with considerable accuracy, and the discrepancy between that estimate and their actual age predicts mortality and disease risk to some degree. These epigenetic clocks are the field's most useful new tool and its most over-interpreted result. Molecular biologist Dr Grace Lam is blunt about what they show. "A clock that predicts outcomes is not the same as a clock that governs them," she says. "Slowing the clock may do nothing at all if the clock is reading the damage rather than causing it."

F) The regulatory position is peculiar. Ageing is not classified as a disease, so a trial cannot be registered with the slowing of ageing as its endpoint, which means that compounds are tested against specific conditions instead. A long-proposed trial of a common diabetes drug, designed to test whether it delays the onset of several age-related diseases at once, has spent years seeking funding partly for this reason. Clinician and trialist Professor Samuel Achebe considers the obstacle to be practical rather than philosophical. "Nobody needs a new definition of disease," he says. "They need an endpoint a regulator will accept and a sponsor willing to run a trial lasting six years."

G) Between the laboratory and the public there is a commercial layer that the evidence does not support. Supplements based on animal studies, clinics offering infusions and injections, and tests marketed as measuring biological age are sold widely, generally on the strength of findings in mice or of associations in humans. The serious version of the field is careful about the distinction between lifespan and healthspan — between living longer and living well for longer — and is interested principally in the second. Feldman notes that the two rarely come apart in the animal experiments, which is encouraging, and adds that the honest summary of the field's position is narrower than most reporting implies. "We can slow ageing in a mouse," she says. "We cannot yet do it in a person, and we would not know how to measure it if we could."`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison of ageing with other risk factors for disease",
          "A",
          "Ageing is the largest risk factor for the diseases that kill most people in wealthy countries — heart disease, stroke, cancer, dementia — by a margin that dwarfs smoking, diet and every other factor that receives more attention.",
          "Paragraph A: it 'dwarfs smoking, diet and every other factor'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of results that have been repeated in several laboratories",
          "C",
          "The results have been reproduced in several laboratories and constitute the strongest evidence that ageing can be manipulated rather than merely described.",
          "Paragraph C: senolytics reproduced in several laboratories.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "two approaches whose side effects prevent their use in healthy people",
          "D",
          "Neither finding has produced a treatment, because both interventions have consequences — hunger in the first case, suppressed immunity in the second — that make them unattractive for healthy people.",
          "Paragraph D: hunger and suppressed immunity.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why trials cannot name ageing as their target",
          "F",
          "Ageing is not classified as a disease, so a trial cannot be registered with the slowing of ageing as its endpoint, which means that compounds are tested against specific conditions instead.",
          "Paragraph F: ageing is not classified as a disease.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to products sold on the basis of animal studies",
          "G",
          "Supplements based on animal studies, clinics offering infusions and injections, and tests marketed as measuring biological age are sold widely, generally on the strength of findings in mice or of associations in humans.",
          "Paragraph G: the commercial layer.",
        ),
        fromList(
          "matching_features",
          AGEING_PEOPLE,
          "The list of processes describes the problem without solving it.",
          "Nora Feldman",
          '"We have a catalogue of things that go wrong together," she says. "Which of them are causes, which are consequences and which are simply passengers is the open question."',
          "Feldman: a catalogue, not an explanation.",
        ),
        fromList(
          "matching_features",
          AGEING_PEOPLE,
          "A measure that predicts an outcome may not control it.",
          "Grace Lam",
          '"A clock that predicts outcomes is not the same as a clock that governs them," she says.',
          "Lam on prediction versus governance.",
        ),
        fromList(
          "matching_features",
          AGEING_PEOPLE,
          "What is missing is an acceptable endpoint and a willing sponsor.",
          "Samuel Achebe",
          '"They need an endpoint a regulator will accept and a sponsor willing to run a trial lasting six years."',
          "Achebe on endpoints and sponsors.",
        ),
        fromList(
          "matching_features",
          AGEING_PEOPLE,
          "Success in animals has not yet been repeated in humans.",
          "Nora Feldman",
          '"We can slow ageing in a mouse," she says. "We cannot yet do it in a person, and we would not know how to measure it if we could."',
          "Feldman: mouse yes, person no.",
        ),
        fromList(
          "matching_features",
          AGEING_PEOPLE,
          "Altering a marker might achieve nothing if it merely records damage.",
          "Grace Lam",
          '"Slowing the clock may do nothing at all if the clock is reading the damage rather than causing it."',
          "Lam: the clock may be reading the damage.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The rise in the risk of death with age is ______ rather than linear.",
          "exponential",
          "A sixty-year-old is roughly a thousand times more likely to die in the next year than a ten-year-old, and the increase is exponential rather than linear.",
          "It is 'exponential rather than linear'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Drugs that kill senescent cells are called ______.",
          "senolytics",
          "In mice, drugs that selectively kill such cells — senolytics — improve heart function, physical performance and the condition of several organs, and in some experiments extend remaining lifespan by a modest amount.",
          "They are 'senolytics'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Estimating age from tissue relies on chemical marks on ______.",
          "DNA",
          "Patterns of chemical marks on DNA can now be used to estimate a person's age from a tissue sample with considerable accuracy, and the discrepancy between that estimate and their actual age predicts mortality and disease risk to some degree.",
          "The marks are 'on DNA'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Serious researchers are mainly interested in ______ rather than length of life.",
          "healthspan",
          "The serious version of the field is careful about the distinction between lifespan and healthspan — between living longer and living well for longer — and is interested principally in the second.",
          "They are interested 'principally in the second' — healthspan.",
        ),
      ],
    },
  ],
};
