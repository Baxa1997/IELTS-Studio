import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · metalworking · flow chart ---------------------------------

const CAST_FLOW = {
  title: "Casting by the lost-wax method",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · dating methods · people and a word bank -------------------

const RING_PEOPLE = ["Marta Lindqvist", "Peter Achterberg", "Yusuf Demir", "Claire Beaumont"];
const RING_BANK = [
  "rings",
  "drought",
  "crossdating",
  "core",
  "isotopes",
  "bark",
  "frost",
  "chronology",
  "sapwood",
];

// ---- Passage 3 · education research · lettered paragraphs ------------------

const HOMEWORK_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const HOMEWORK_ENDINGS = [
  "because the effect is close to zero for the youngest children.",
  "although the association may run in the opposite direction entirely.",
  "which is why the quantity set matters less than what is set.",
  "even though the families who need it most are the least able to supply it.",
  "because the studies measure the subjects that are easiest to test.",
  "which the writer regards as the question schools should actually be asking.",
  "despite the confident advice offered by almost every education authority.",
];

export const TEST_61: CuratedTest = {
  key: "full-test-61",
  targetBand: 7,
  passages: [
    {
      key: "t61-p1-lost-wax",
      title: "The Model That Is Destroyed",
      topic: "a casting method that has been in continuous use for six thousand years",
      difficulty: 6,
      body: `The oldest known metal object made by the lost-wax process is a small copper amulet from what is now Pakistan, about six thousand years old. The method it was made by is still in use, in essentially unchanged form, for objects as different as a bronze portrait head, a dental crown and a turbine blade for a jet engine. Very few manufacturing techniques have survived that long, and the reason this one has is that it solves a problem no simpler method solves: it reproduces undercuts, hollows and fine surface detail that a mould opened in two halves cannot release.

The sequence is straightforward to describe. A model is made in wax, in exactly the form the finished object is to take, complete with every detail the maker wants to appear in metal. Rods of wax are attached to it to form channels — one set to let the molten metal in, another to let air escape — and the whole assembly is coated in a fine liquid ceramic or a fine clay slurry, applied thinly at first so that it picks up the surface precisely, then built up in coarser layers until the coating is thick enough to hold its shape.

The assembly is then heated. The wax melts and runs out through the channels, which is the step the method is named for, and the heat continues until the mould is fired hard and every trace of wax has burned away. What remains is a hollow ceramic shell whose interior is an exact negative of the model. Molten metal is poured in, allowed to cool, and the shell is broken off. The channels are cut away, the surface is finished, and the object is complete.

Two things follow from this that shape everything about the method. The first is that the model is consumed: it cannot be recovered, and each casting requires a new one, which is why the process suits unique objects and why reproducing a series requires a separate rubber mould from which wax copies are pressed. The second is that the mould must be destroyed to release the casting, which rules out reusing it and adds the shell to the cost of every piece.

Large bronzes are cast hollow, which saves metal and weight and reduces the risk of cracking as the metal cools. The classical and Renaissance method builds a rough core of clay, coats it with a layer of wax of the intended wall thickness, works the detail into that wax, and then invests the whole. When the wax melts out, the gap it leaves is the shell of metal to be filled. The core has to be held in place after the wax has gone, which is done with metal pins driven through from the outer mould into the core; their ends remain in the casting and can often be seen in a bronze if you know where to look.

The industrial version, known as investment casting, is the same process with tolerances. A jet engine turbine blade is cast this way because it must be produced as a single crystal, with internal cooling passages of a complexity that no machining could produce, and because a joint anywhere in it would be a point of failure. The ceramic used is different, the wax is a formulated blend rather than beeswax, and the pouring happens under vacuum — but the sequence is the one the amulet was made by.

What has changed most recently is where the wax comes from. Patterns are now routinely printed rather than carved, either directly in a castable resin or by printing a mould into which wax is injected, which removes the skill of the model maker from the process and has substantially lowered the cost of a one-off casting. Foundries that have adopted it describe the change as the largest in the trade for centuries, and it leaves the rest of the method exactly as it was: a model made to be destroyed, a mould made to be broken, and a metal object that could not have been made any other way. The oldest step in the sequence is still the one that gives the method its name, and it is still the step at which the maker loses the thing they spent the longest making.`,
      questions: [
        tfng(
          "The lost-wax method has changed very little in six thousand years.",
          "TRUE",
          "The method it was made by is still in use, in essentially unchanged form, for objects as different as a bronze portrait head, a dental crown and a turbine blade for a jet engine.",
          "It is 'in essentially unchanged form'.",
        ),
        tfng(
          "A two-part mould can reproduce undercuts as well as this method can.",
          "FALSE",
          "Very few manufacturing techniques have survived that long, and the reason this one has is that it solves a problem no simpler method solves: it reproduces undercuts, hollows and fine surface detail that a mould opened in two halves cannot release.",
          "A two-part mould 'cannot release' them.",
        ),
        tfng(
          "The first coating applied to the model is deliberately thin.",
          "TRUE",
          "Rods of wax are attached to it to form channels — one set to let the molten metal in, another to let air escape — and the whole assembly is coated in a fine liquid ceramic or a fine clay slurry, applied thinly at first so that it picks up the surface precisely, then built up in coarser layers until the coating is thick enough to hold its shape.",
          "It is 'applied thinly at first'.",
        ),
        tfng(
          "The mould can be used again for a second casting.",
          "FALSE",
          "The second is that the mould must be destroyed to release the casting, which rules out reusing it and adds the shell to the cost of every piece.",
          "Destroying it 'rules out reusing it'.",
        ),
        tfng(
          "Hollow casting reduces the chance of the metal cracking.",
          "TRUE",
          "Large bronzes are cast hollow, which saves metal and weight and reduces the risk of cracking as the metal cools.",
          "It 'reduces the risk of cracking'.",
        ),
        tfng(
          "The pins holding the core are removed before the bronze is finished.",
          "FALSE",
          "The core has to be held in place after the wax has gone, which is done with metal pins driven through from the outer mould into the core; their ends remain in the casting and can often be seen in a bronze if you know where to look.",
          "'Their ends remain in the casting'.",
        ),
        tfng(
          "Turbine blades are cast this way mainly to reduce their cost.",
          "FALSE",
          "A jet engine turbine blade is cast this way because it must be produced as a single crystal, with internal cooling passages of a complexity that no machining could produce, and because a joint anywhere in it would be a point of failure.",
          "The reasons given are crystal structure and joints.",
        ),
        noteLine(
          CAST_FLOW,
          null,
          "A ______ model is made in the exact form of the finished object",
          "wax",
          "A model is made in wax, in exactly the form the finished object is to take, complete with every detail the maker wants to appear in metal.",
          "'A model is made in wax'.",
        ),
        noteLine(
          CAST_FLOW,
          null,
          "It is coated in ceramic and heated until every trace of wax has ______ away",
          "burned",
          "The wax melts and runs out through the channels, which is the step the method is named for, and the heat continues until the mould is fired hard and every trace of wax has burned away.",
          "Every trace 'has burned away'.",
          { before: [{ text: "The model does not survive:", indent: 0 }] },
        ),
        noteLine(
          CAST_FLOW,
          null,
          "Metal is poured in and the ______ is then broken off",
          "shell",
          "Molten metal is poured in, allowed to cool, and the shell is broken off.",
          "'The shell is broken off'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The oldest known example of the method is a copper ______.",
          "amulet",
          "The oldest known metal object made by the lost-wax process is a small copper amulet from what is now Pakistan, about six thousand years old.",
          "It is 'a small copper amulet'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The industrial form of the process is called ______ casting.",
          "investment",
          "The industrial version, known as investment casting, is the same process with tolerances.",
          "It is 'known as investment casting'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Patterns are now commonly ______ instead of being carved by hand.",
          "printed",
          "Patterns are now routinely printed rather than carved, either directly in a castable resin or by printing a mould into which wax is injected, which removes the skill of the model maker from the process and has substantially lowered the cost of a one-off casting.",
          "They are 'routinely printed rather than carved'.",
        ),
      ],
    },
    {
      key: "t61-p2-tree-rings",
      title: "Counting Backwards Through Wood",
      topic: "how a ring in a tree fixes a date to the year",
      difficulty: 7,
      body: `A tree growing in a temperate climate adds one ring of wood each year, a pale band formed in the fast growth of spring and a dark one as growth slows in late summer. Counting the rings gives the age of the tree, which has been understood since antiquity. The useful part came later, with the recognition that the width of each ring records the conditions of that particular year, and that trees growing in the same region respond to the same conditions in the same way.

That second observation is what makes dating possible. A run of rings — wide, wide, very narrow, wide, narrow, narrow — forms a pattern that is effectively a signature for a stretch of years, and the same signature appears in every sensitive tree in the region. Marta Lindqvist, a dendrochronologist, describes the core technique of crossdating as pattern matching rather than counting: a sequence from a timber of unknown age is slid along a sequence of known date until the patterns align, and the alignment, if it is convincing across a long enough run, fixes every ring in the unknown sample to a calendar year.

Chronologies are built backwards in overlapping steps. Living trees give the present and the last few centuries. Beams in old buildings, whose outer rings overlap the inner rings of the living trees, extend the sequence further; older timbers overlap those; and logs preserved in bogs, lake beds and gravel can carry the chain back several thousand years. The European oak chronology now runs continuously for more than ten thousand years, and the bristlecone pine chronology in the American southwest is comparable.

The technique is only as good as the sensitivity of the trees. Peter Achterberg, who works on timbers from northern Europe, is direct about this: a tree growing where water is never limiting produces rings of almost uniform width and is useless for dating, while a tree at the edge of what its species can tolerate — too dry, too cold, too high — produces the variable sequence the method needs. Crossdating works best on trees that have had a difficult life.

Two applications have carried the method beyond archaeology. The first is climate: ring widths, and the chemistry of the wood, record temperature, rainfall and drought year by year for as long as the chronology runs, at an annual resolution no other proxy can match over that period. Yusuf Demir, who reconstructs past drought from ring series, notes that the great droughts of the medieval period in the American southwest were identified this way and that their severity was outside the range of anything measured instrumentally.

The second is calibration. Radiocarbon dating assumes a known concentration of carbon-14 in the atmosphere at the time an organism died, and that concentration has varied. Because a tree ring can be dated exactly by counting and measured for radiocarbon independently, the two can be compared, and the result is the calibration curve that converts a raw radiocarbon measurement into a calendar date. Claire Beaumont, who works on the curve, points out that this relationship is the reason radiocarbon dating produces calendar years at all, and that every improvement to the curve retrospectively adjusts every radiocarbon date ever published.

Sampling need not kill the tree. A hollow borer a few millimetres across is driven into the trunk and withdrawn with a pencil-thin core containing the whole sequence of rings from bark to centre; the hole is small enough that a healthy tree seals it without difficulty. That is why chronologies can be built from living trees in protected woodland, and why a cathedral roof can be dated without removing a beam.

The method has limits that are worth stating plainly. It needs regional chronologies, which exist for some parts of the world and not others. Tropical trees frequently produce no annual rings, because there is no seasonal pause in growth. A timber that has been trimmed of its outer wood can be dated only to the last surviving ring, which gives the earliest possible felling date and not the actual one, and the distinction has decided more than one archaeological argument. And a single sample proves nothing: a match is only persuasive when the same date emerges from several timbers, independently, against a well-replicated chronology.`,
      questions: [
        fromList(
          "matching_features",
          RING_PEOPLE,
          "The central technique is matching patterns rather than counting rings.",
          "Marta Lindqvist",
          "Marta Lindqvist, a dendrochronologist, describes the core technique of crossdating as pattern matching rather than counting: a sequence from a timber of unknown age is slid along a sequence of known date until the patterns align, and the alignment, if it is convincing across a long enough run, fixes every ring in the unknown sample to a calendar year.",
          "Lindqvist describes crossdating as pattern matching.",
        ),
        fromList(
          "matching_features",
          RING_PEOPLE,
          "Trees in comfortable conditions cannot be used for dating.",
          "Peter Achterberg",
          "Peter Achterberg, who works on timbers from northern Europe, is direct about this: a tree growing where water is never limiting produces rings of almost uniform width and is useless for dating, while a tree at the edge of what its species can tolerate — too dry, too cold, too high — produces the variable sequence the method needs.",
          "Achterberg says uniform rings are useless.",
        ),
        fromList(
          "matching_features",
          RING_PEOPLE,
          "Past droughts were more severe than any since measurement began.",
          "Yusuf Demir",
          "Yusuf Demir, who reconstructs past drought from ring series, notes that the great droughts of the medieval period in the American southwest were identified this way and that their severity was outside the range of anything measured instrumentally.",
          "Demir reports droughts beyond the instrumental range.",
        ),
        fromList(
          "matching_features",
          RING_PEOPLE,
          "Revising one curve changes every date produced by another method.",
          "Claire Beaumont",
          "Claire Beaumont, who works on the curve, points out that this relationship is the reason radiocarbon dating produces calendar years at all, and that every improvement to the curve retrospectively adjusts every radiocarbon date ever published.",
          "Beaumont notes the retrospective adjustment.",
        ),
        fromList(
          "summary_completion",
          RING_BANK,
          "Each year a temperate tree adds one of its ______.",
          "rings",
          "A tree growing in a temperate climate adds one ring of wood each year, a pale band formed in the fast growth of spring and a dark one as growth slows in late summer.",
          "It adds 'one ring of wood each year'.",
        ),
        fromList(
          "summary_completion",
          RING_BANK,
          "Matching one sequence against another of known date is called ______.",
          "crossdating",
          "Marta Lindqvist, a dendrochronologist, describes the core technique of crossdating as pattern matching rather than counting: a sequence from a timber of unknown age is slid along a sequence of known date until the patterns align, and the alignment, if it is convincing across a long enough run, fixes every ring in the unknown sample to a calendar year.",
          "The technique is 'crossdating'.",
        ),
        fromList(
          "summary_completion",
          RING_BANK,
          "Overlapping samples build a continuous ______ reaching back millennia.",
          "chronology",
          "The European oak chronology now runs continuously for more than ten thousand years, and the bristlecone pine chronology in the American southwest is comparable.",
          "The chronology runs continuously for millennia.",
        ),
        fromList(
          "summary_completion",
          RING_BANK,
          "Ring series have been used to reconstruct past ______ year by year.",
          "drought",
          "Yusuf Demir, who reconstructs past drought from ring series, notes that the great droughts of the medieval period in the American southwest were identified this way and that their severity was outside the range of anything measured instrumentally.",
          "Demir reconstructs 'past drought from ring series'.",
        ),
        fromList(
          "summary_completion",
          RING_BANK,
          "Where the outer wood is missing, only a date for the last surviving ring can be given, since the ______ has been trimmed away.",
          "sapwood",
          "A timber that has been trimmed of its outer wood can be dated only to the last surviving ring, which gives the earliest possible felling date and not the actual one, and the distinction has decided more than one archaeological argument.",
          "The outer wood has been trimmed off.",
        ),
        mcq(
          "What determines the width of a particular ring?",
          [
            "The conditions during that year",
            "The age of the tree at the time",
            "The species of the tree",
            "The depth of the soil",
          ],
          "The conditions during that year",
          "The useful part came later, with the recognition that the width of each ring records the conditions of that particular year, and that trees growing in the same region respond to the same conditions in the same way.",
          "Width 'records the conditions of that particular year'.",
        ),
        mcq(
          "How are long chronologies constructed?",
          [
            "By overlapping successively older timbers",
            "By finding single trees of great age",
            "By combining trees from several continents",
            "By estimating the gaps between samples",
          ],
          "By overlapping successively older timbers",
          "Beams in old buildings, whose outer rings overlap the inner rings of the living trees, extend the sequence further; older timbers overlap those; and logs preserved in bogs, lake beds and gravel can carry the chain back several thousand years.",
          "Each set of timbers overlaps the last.",
        ),
        mcq(
          "Why can tropical trees often not be dated this way?",
          [
            "Growth does not pause seasonally",
            "Their wood decays too quickly",
            "Their rings are too narrow to measure",
            "No chronologies have been attempted",
          ],
          "Growth does not pause seasonally",
          "Tropical trees frequently produce no annual rings, because there is no seasonal pause in growth.",
          "There is 'no seasonal pause in growth'.",
        ),
        mcq(
          "What does the passage say about a single matched sample?",
          [
            "It is not persuasive on its own",
            "It is sufficient if the match is close",
            "It must come from a living tree",
            "It cannot be checked by other methods",
          ],
          "It is not persuasive on its own",
          "And a single sample proves nothing: a match is only persuasive when the same date emerges from several timbers, independently, against a well-replicated chronology.",
          "'A single sample proves nothing'.",
        ),
      ],
    },
    {
      key: "t61-p3-homework-debate",
      title: "The Argument About Homework",
      topic: "what the evidence on homework does and does not support",
      difficulty: 8,
      body: `A) Few subjects in education produce so much confident advice on so thin a base of evidence as homework. Ministries issue guidance, schools set policies, parents form strong views, and the research those positions are supposedly founded on is, when examined, narrower and weaker than any of them imply.

B) The single most cited finding is the age gradient, and it is reasonably robust. Across many studies, the association between homework and achievement is close to zero for primary-aged children, modest in the early secondary years, and larger for older secondary students. The usual explanation is that independent study requires self-regulation that younger children have not yet developed, and that the tasks set to younger children — reading practice aside — tend to be the least valuable kind. Reading with a parent is the exception that almost every review agrees on, and it is not obvious that it should be filed under homework at all.

C) The difficulty is that almost all of this evidence is correlational. Schools cannot randomly assign homework to some pupils and withhold it from others for a year, and the few experiments that exist are short and small. No ethics committee and very few parents would tolerate the alternative, which means the strongest design available to the question is one nobody can run. What is usually being measured is that students who do more homework score higher, which is an association open to an obvious alternative reading: students who are already doing well are more likely to complete the work set, and students who are struggling are more likely to abandon it. The arrow may point backwards.

D) The second finding that survives scrutiny concerns quantity. The relationship between time spent and benefit is not linear; it rises, flattens and then declines, with the turning point in most analyses somewhere between one and two hours a night for older secondary students. Beyond that, additional homework is associated with worse outcomes, and with the effects on sleep, exercise and family time that one would expect. The turning point also moves with the subject and with the student, which is a further reason to be sceptical of any single number written into a policy.

E) What almost never gets measured is the part that probably matters most, which is what the homework consists of. Twenty minutes of retrieval practice on material learned a fortnight ago is not the same intervention as twenty minutes of copying out definitions, and there is good reason from cognitive psychology to expect the first to be far more effective. But studies overwhelmingly record time spent rather than task type, because time is easy to ask about and task type is not, and so the literature is largely silent on the variable that the theory says should dominate.

F) There is a distributional question that the average effect conceals entirely. Homework is done at home, and homes differ: in quiet space, in reliable internet, in books, in whether an adult is available and confident enough to help, in whether the child is expected to mind younger siblings or work an evening job. A policy of setting substantial homework transfers part of the educational process into an environment the school does not control and cannot equalise, and the children who lose most are the ones the school is most trying to help. This is not an argument against homework, but it is an argument that the school owes those children either the conditions to do it or an alternative place to do it in.

G) My own reading of the evidence is that the argument about how much is largely a distraction from the argument about what and where. A school that sets thirty minutes of well-designed retrieval practice, provides a supervised room for anybody who needs one, and checks that the work is actually reviewed is doing something defensible. A school that sets two hours of unspecified work because a policy requires it is transferring labour to households, in unequal quantities, on the basis of evidence that does not support the practice. Both schools can accurately report that they set homework, which tells you how little that fact conveys. It is the only education policy I can think of whose implementation is measured entirely by whether it happened, and never by what it consisted of.`,
      questions: [
        fromList(
          "matching_information",
          HOMEWORK_PARAGRAPHS,
          "a description of how the benefit changes as time spent increases",
          "D",
          "The relationship between time spent and benefit is not linear; it rises, flattens and then declines, with the turning point in most analyses somewhere between one and two hours a night for older secondary students.",
          "Paragraph D describes the curve.",
        ),
        fromList(
          "matching_information",
          HOMEWORK_PARAGRAPHS,
          "an explanation of why the causal direction is uncertain",
          "C",
          "What is usually being measured is that students who do more homework score higher, which is an association open to an obvious alternative reading: students who are already doing well are more likely to complete the work set, and students who are struggling are more likely to abandon it.",
          "Paragraph C raises the reverse direction.",
        ),
        fromList(
          "matching_information",
          HOMEWORK_PARAGRAPHS,
          "a list of ways in which homes are unequal",
          "F",
          "Homework is done at home, and homes differ: in quiet space, in reliable internet, in books, in whether an adult is available and confident enough to help, in whether the child is expected to mind younger siblings or work an evening job.",
          "Paragraph F lists the inequalities.",
        ),
        fromList(
          "matching_information",
          HOMEWORK_PARAGRAPHS,
          "a contrast between two schools that both claim to set homework",
          "G",
          "Both schools can accurately report that they set homework, which tells you how little that fact conveys.",
          "Paragraph G draws the contrast.",
        ),
        fromList(
          "matching_information",
          HOMEWORK_PARAGRAPHS,
          "the reason research records one variable instead of a more important one",
          "E",
          "But studies overwhelmingly record time spent rather than task type, because time is easy to ask about and task type is not, and so the literature is largely silent on the variable that the theory says should dominate.",
          "Paragraph E explains the measurement choice.",
        ),
        ynng(
          "The writer thinks official guidance on homework rests on strong evidence.",
          "NO",
          "Ministries issue guidance, schools set policies, parents form strong views, and the research those positions are supposedly founded on is, when examined, narrower and weaker than any of them imply.",
          "The research is 'narrower and weaker than any of them imply'.",
        ),
        ynng(
          "The writer accepts the age gradient as a dependable finding.",
          "YES",
          "The single most cited finding is the age gradient, and it is reasonably robust.",
          "It is 'reasonably robust'.",
        ),
        ynng(
          "The writer believes inequality is a reason to abolish homework.",
          "NO",
          "This is not an argument against homework, but it is an argument that the school owes those children either the conditions to do it or an alternative place to do it in.",
          "It is 'not an argument against homework'.",
        ),
        ynng(
          "The writer thinks the debate about quantity is the most important one.",
          "NO",
          "My own reading of the evidence is that the argument about how much is largely a distraction from the argument about what and where.",
          "It is 'largely a distraction'.",
        ),
        fromList(
          "matching_sentence_endings",
          HOMEWORK_ENDINGS,
          "Setting homework to young children is hard to justify",
          "because the effect is close to zero for the youngest children.",
          "Across many studies, the association between homework and achievement is close to zero for primary-aged children, modest in the early secondary years, and larger for older secondary students.",
          "The association is near zero for primary pupils.",
        ),
        fromList(
          "matching_sentence_endings",
          HOMEWORK_ENDINGS,
          "The correlation between homework and achievement proves little,",
          "although the association may run in the opposite direction entirely.",
          "The arrow may point backwards.",
          "'The arrow may point backwards.'",
        ),
        fromList(
          "matching_sentence_endings",
          HOMEWORK_ENDINGS,
          "The design of the task is probably decisive,",
          "which is why the quantity set matters less than what is set.",
          "Twenty minutes of retrieval practice on material learned a fortnight ago is not the same intervention as twenty minutes of copying out definitions, and there is good reason from cognitive psychology to expect the first to be far more effective.",
          "Equal time, very different value.",
        ),
        fromList(
          "matching_sentence_endings",
          HOMEWORK_ENDINGS,
          "Work sent home depends on conditions at home,",
          "even though the families who need it most are the least able to supply it.",
          "A policy of setting substantial homework transfers part of the educational process into an environment the school does not control and cannot equalise, and the children who lose most are the ones the school is most trying to help.",
          "Those who lose most are those the school most wants to help.",
        ),
        fromList(
          "matching_sentence_endings",
          HOMEWORK_ENDINGS,
          "The better question is what is set and where it is done,",
          "which the writer regards as the question schools should actually be asking.",
          "A school that sets thirty minutes of well-designed retrieval practice, provides a supervised room for anybody who needs one, and checks that the work is actually reviewed is doing something defensible.",
          "What and where is the defensible question.",
        ),
      ],
    },
  ],
};
