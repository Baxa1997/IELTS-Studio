import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · everyday chemistry · notes box ----------------------------

const SOAP_NOTES = {
  title: "How a soap molecule works",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · puzzle history · people and a word bank -------------------

const PUZZLE_PEOPLE = ["Harriet Nsubuga", "Gordon Pike", "Simone Duval", "Arjun Raval"];
const PUZZLE_BANK = [
  "grid",
  "anagram",
  "definition",
  "symmetry",
  "setter",
  "wordplay",
  "clue",
  "newspaper",
  "convention",
];

// ---- Passage 3 · language and perception · lettered paragraphs -------------

const COLOUR_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const COLOUR_ENDINGS = [
  "because every language studied names black and white before anything else.",
  "although the speakers can distinguish the shades perfectly well without a word.",
  "which is why reaction times differ even when accuracy does not.",
  "even though the eye of every population tested is built the same way.",
  "because the boundary drawn between two colours is a matter of convention.",
  "which the writer thinks is the most defensible version of the claim.",
  "despite the original study having been retracted by its authors.",
];

export const TEST_62: CuratedTest = {
  key: "full-test-62",
  targetBand: 5,
  passages: [
    {
      key: "t62-p1-soap",
      title: "The Molecule with Two Ends",
      topic: "why washing with soap works and washing with water does not",
      difficulty: 4,
      body: `Water alone is a poor cleaner of anything greasy, for a reason that is visible whenever oil is poured into a glass of water. The two do not mix. Water molecules are strongly attracted to each other and are electrically lopsided, with a slight positive charge at one end and a slight negative charge at the other; oils are not, and the water molecules hold together in preference to surrounding the oil. Rinsing a greasy plate under a tap removes very little grease, however hot the water and however long the rinsing.

Soap works because its molecules have two ends that behave in opposite ways. One end is a chain of carbon and hydrogen which, like an oil, is repelled by water. The other end carries a charge and is attracted to water strongly. A molecule of this kind cannot be comfortable anywhere, and its response to being dropped into water containing grease is to arrange itself so that both ends get what they want: the water-hating tails bury themselves in the grease, and the water-loving heads face outwards into the water.

What forms is a tiny sphere called a micelle, with a droplet of oil inside and a charged shell outside. The shell is what matters. As far as the surrounding water is concerned, the droplet is no longer oil; it is an object with a water-friendly surface, and it can be carried away down the drain. Dirt that was held on the skin or the fabric by a film of grease goes with it.

Soap has a second property that matters almost as much. Water has a strong surface tension, which is why it beads on a waxed surface and why it struggles to penetrate a woven fabric. Soap molecules crowd into the surface of the water and disrupt that arrangement, lowering the tension so that the water spreads and soaks in rather than sitting on top. This is why soapy water wets a cloth in a way that plain water does not, and it is the reason the same class of chemical is used to make paint spread, to wet a field crop with pesticide, and to keep the lungs of a newborn from collapsing.

Making soap has been the same reaction for at least four thousand years. A fat or oil is boiled with a strong alkali — traditionally wood ash leached in water, later caustic soda — and the reaction splits the fat and produces the two-ended molecules together with glycerol. Babylonian tablets record the proportions. Roman and medieval producers used animal fat and ash; Mediterranean producers used olive oil, which gives a milder and paler soap, and Aleppo and Marseille built long-lasting reputations on it.

Hard water complicates all of this and is the reason detergents exist. Where water carries dissolved calcium and magnesium, traditional soap reacts with those metals and forms an insoluble curd — the scum on a bath, the grey deposit in a kettle — which wastes the soap and leaves a deposit on whatever is being washed. Synthetic detergents, developed in quantity from the 1940s, keep the two-ended structure but use a head that does not react with those metals, which is why they lather in hard water and why almost all laundry products are now detergents rather than soaps.

The effect of soap on health was established long before the chemistry was understood. In 1847 a physician working in a Vienna maternity hospital noticed that the ward staffed by doctors had a death rate from infection several times higher than the ward staffed by midwives, and that the difference was that the doctors came to the ward directly from performing autopsies. He required them to wash their hands in a chlorine solution before examining patients, and deaths in the ward fell dramatically. His colleagues rejected the conclusion, largely because he could not explain why it worked, and the practice lapsed for decades until germ theory supplied the explanation.

A detail of the chemistry became widely known during the pandemic of 2020. Many viruses, including the coronaviruses and the influenza viruses, are wrapped in a membrane made largely of fatty material. Soap does to that membrane exactly what it does to grease: the tails push into it, it comes apart, and the virus is destroyed rather than merely rinsed away. This is why twenty seconds of soap is more effective against such viruses than a much longer rinse with water, and why the oldest cleaning technology in continuous use turned out to be the one recommended first.`,
      questions: [
        tfng(
          "Hot water on its own removes most grease from a plate.",
          "FALSE",
          "Rinsing a greasy plate under a tap removes very little grease, however hot the water and however long the rinsing.",
          "It 'removes very little grease'.",
        ),
        tfng(
          "Both ends of a soap molecule behave the same way towards water.",
          "FALSE",
          "Soap works because its molecules have two ends that behave in opposite ways.",
          "The two ends 'behave in opposite ways'.",
        ),
        tfng(
          "In a micelle the oil is on the outside of the sphere.",
          "FALSE",
          "What forms is a tiny sphere called a micelle, with a droplet of oil inside and a charged shell outside.",
          "The oil is 'inside'.",
        ),
        tfng(
          "Soap makes water penetrate fabric more easily.",
          "TRUE",
          "This is why soapy water wets a cloth in a way that plain water does not, and it is the reason the same class of chemical is used to make paint spread, to wet a field crop with pesticide, and to keep the lungs of a newborn from collapsing.",
          "Soapy water 'wets a cloth in a way that plain water does not'.",
        ),
        tfng(
          "The chemical reaction used to make soap has changed fundamentally over time.",
          "FALSE",
          "Making soap has been the same reaction for at least four thousand years.",
          "It has been 'the same reaction'.",
        ),
        tfng(
          "The Vienna physician's colleagues accepted his findings at once.",
          "FALSE",
          "His colleagues rejected the conclusion, largely because he could not explain why it worked, and the practice lapsed for decades until germ theory supplied the explanation.",
          "They 'rejected the conclusion'.",
        ),
        tfng(
          "Soap destroys certain viruses rather than simply washing them off.",
          "TRUE",
          "Soap does to that membrane exactly what it does to grease: the tails push into it, it comes apart, and the virus is destroyed rather than merely rinsed away.",
          "The virus 'is destroyed rather than merely rinsed away'.",
        ),
        noteLine(
          SOAP_NOTES,
          null,
          "One end is a ______ of carbon and hydrogen that water repels",
          "chain",
          "One end is a chain of carbon and hydrogen which, like an oil, is repelled by water.",
          "It is 'a chain of carbon and hydrogen'.",
        ),
        noteLine(
          SOAP_NOTES,
          null,
          "The other end carries a ______ and is pulled towards water",
          "charge",
          "The other end carries a charge and is attracted to water strongly.",
          "It 'carries a charge'.",
          { before: [{ text: "Two ends, two behaviours:", indent: 0 }] },
        ),
        noteLine(
          SOAP_NOTES,
          null,
          "Around a drop of oil the molecules form a ______",
          "micelle",
          "What forms is a tiny sphere called a micelle, with a droplet of oil inside and a charged shell outside.",
          "They form 'a tiny sphere called a micelle'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Soap lowers the ______ tension of water so that it spreads.",
          "surface",
          "Water has a strong surface tension, which is why it beads on a waxed surface and why it struggles to penetrate a woven fabric.",
          "It is the water's 'surface tension'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Boiling fat with an alkali produces soap together with ______.",
          "glycerol",
          "A fat or oil is boiled with a strong alkali — traditionally wood ash leached in water, later caustic soda — and the reaction splits the fat and produces the two-ended molecules together with glycerol.",
          "The reaction also produces glycerol.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The Vienna doctors were required to wash in a ______ solution.",
          "chlorine",
          "He required them to wash their hands in a chlorine solution before examining patients, and deaths in the ward fell dramatically.",
          "They washed 'in a chlorine solution'.",
        ),
      ],
    },
    {
      key: "t62-p2-crossword",
      title: "The Puzzle in the Newspaper",
      topic: "how a filler for a Sunday page became two distinct traditions",
      difficulty: 5,
      body: `The first crossword was printed in a New York newspaper in December 1913, in a supplement whose editor needed something to fill a page. It was diamond-shaped, had no black squares, and the clues were plain definitions. It was popular enough to be repeated weekly, other papers copied it, and by the early 1920s the puzzle had become a craze substantial enough to attract disapproval: librarians complained about dictionaries being monopolised, and at least one newspaper denounced it as a waste of the public's time that was spreading through the population like an epidemic and produced nothing whatever in return.

Harriet Nsubuga, who has written on the puzzle's early history, notes that the form settled into its modern shape remarkably quickly and then stopped changing. The grid became rectangular and acquired black squares. It acquired rotational symmetry — turn the grid a hundred and eighty degrees and the pattern of black squares is unchanged — which serves no purpose for the solver at all and has been observed almost universally for a century, an unusually pure case of a convention surviving because it is a convention.

The two traditions separated in the 1920s and have hardly spoken since. The American puzzle, which developed first, is built on definitions: a clue gives a synonym, a fact or a fill-in-the-blank, and the difficulty lies in the vocabulary, the obliqueness of the definition and the interlocking of the grid, which in the American style is dense, with almost every letter belonging to two words. The British or cryptic puzzle went the other way. Its grids are sparse, with many letters belonging to one word only, and its clues are small puzzles in themselves.

The structure of a cryptic clue is the thing outsiders find hardest to believe. Gordon Pike, a setter for a national paper, describes the rule that governs the form: every clue contains a straight definition of the answer, at one end or the other, and a second route to the same answer by some form of wordplay, and nothing else. A solver who knows this is not guessing but working, and the two halves check each other — arrive at an answer by the wordplay and the definition confirms it. The apparent surface meaning of the clue, the sentence it seems to be, is deliberate misdirection and carries no information at all.

Simone Duval, who has studied solvers rather than puzzles, finds that the difference in what the two demand is larger than it looks. American puzzles reward stored knowledge: names, brands, rivers, the vocabulary of previous puzzles. Cryptics reward a procedure that can be taught in an afternoon and takes years to become fluent in, and they reward it fairly evenly across ages, since the necessary knowledge is mostly the ordinary vocabulary of the language. Duval notes that the cryptic solver's characteristic experience — long blank incomprehension followed by sudden certainty — is unusual among puzzle types and is what her interviewees describe as addictive.

Arjun Raval, who writes software that generates and solves puzzles, points out an asymmetry that has become visible only recently. A program can fill a grid better than a person, which is a search problem over a word list, and a program can now solve American puzzles at the level of a strong human competitor. Cryptic clues have proved much harder on both sides. Writing one requires a judgement about whether the surface reading is convincing and the misdirection fair, which is an aesthetic matter rather than a rule; solving one requires recognising which of a dozen wordplay devices is in operation, in a sentence deliberately built to suggest something else entirely.

Newspapers have shed most of their features and kept the crossword, which now appears in print and on applications with timers, streaks and leaderboards attached. What has not changed is the object itself. A solver from 1925 handed today's grid would recognise it immediately and would need no explanation of what to do, and the setter's problem — fill a symmetrical grid with interlocking words and write a fair clue for each — is exactly the problem it was a hundred years ago. Very little else that was printed on a newspaper page in 1925 could be handed to a reader today without a footnote.`,
      questions: [
        fromList(
          "matching_features",
          PUZZLE_PEOPLE,
          "One feature of the grid serves no purpose for the person solving it.",
          "Harriet Nsubuga",
          "It acquired rotational symmetry — turn the grid a hundred and eighty degrees and the pattern of black squares is unchanged — which serves no purpose for the solver at all and has been observed almost universally for a century, an unusually pure case of a convention surviving because it is a convention.",
          "Nsubuga notes the pointless symmetry.",
        ),
        fromList(
          "matching_features",
          PUZZLE_PEOPLE,
          "Each cryptic clue contains both a definition and a second route to the answer.",
          "Gordon Pike",
          "Gordon Pike, a setter for a national paper, describes the rule that governs the form: every clue contains a straight definition of the answer, at one end or the other, and a second route to the same answer by some form of wordplay, and nothing else.",
          "Pike states the two-part rule.",
        ),
        fromList(
          "matching_features",
          PUZZLE_PEOPLE,
          "The two kinds of puzzle draw on different abilities.",
          "Simone Duval",
          "Simone Duval, who has studied solvers rather than puzzles, finds that the difference in what the two demand is larger than it looks.",
          "Duval compares what each demands.",
        ),
        fromList(
          "matching_features",
          PUZZLE_PEOPLE,
          "Software handles one tradition far better than the other.",
          "Arjun Raval",
          "A program can fill a grid better than a person, which is a search problem over a word list, and a program can now solve American puzzles at the level of a strong human competitor.",
          "Raval describes the software asymmetry.",
        ),
        fromList(
          "summary_completion",
          PUZZLE_BANK,
          "The first puzzle was printed to fill a page in a ______.",
          "newspaper",
          "The first crossword was printed in a New York newspaper in December 1913, in a supplement whose editor needed something to fill a page.",
          "It appeared in a New York newspaper.",
        ),
        fromList(
          "summary_completion",
          PUZZLE_BANK,
          "The ______ soon became rectangular and gained black squares.",
          "grid",
          "The grid became rectangular and acquired black squares.",
          "'The grid became rectangular'.",
        ),
        fromList(
          "summary_completion",
          PUZZLE_BANK,
          "Rotational ______ has been observed almost everywhere ever since.",
          "symmetry",
          "It acquired rotational symmetry — turn the grid a hundred and eighty degrees and the pattern of black squares is unchanged — which serves no purpose for the solver at all and has been observed almost universally for a century, an unusually pure case of a convention surviving because it is a convention.",
          "Rotational symmetry is near-universal.",
        ),
        fromList(
          "summary_completion",
          PUZZLE_BANK,
          "In a cryptic clue the plain ______ sits at one end or the other.",
          "definition",
          "Gordon Pike, a setter for a national paper, describes the rule that governs the form: every clue contains a straight definition of the answer, at one end or the other, and a second route to the same answer by some form of wordplay, and nothing else.",
          "The definition is 'at one end or the other'.",
        ),
        fromList(
          "summary_completion",
          PUZZLE_BANK,
          "The rest of the clue reaches the same answer through ______.",
          "wordplay",
          "A solver who knows this is not guessing but working, and the two halves check each other — arrive at an answer by the wordplay and the definition confirms it.",
          "The second route is the wordplay.",
        ),
        mcq(
          "What did the first crossword look like?",
          [
            "Diamond-shaped with no black squares",
            "Rectangular with rotational symmetry",
            "A dense grid with cryptic clues",
            "A list of clues with no grid at all",
          ],
          "Diamond-shaped with no black squares",
          "It was diamond-shaped, had no black squares, and the clues were plain definitions.",
          "It was 'diamond-shaped, had no black squares'.",
        ),
        mcq(
          "What distinguishes American grids from British ones?",
          [
            "Almost every letter belongs to two words",
            "They contain no black squares",
            "They are always larger",
            "They avoid rotational symmetry",
          ],
          "Almost every letter belongs to two words",
          "The American puzzle, which developed first, is built on definitions: a clue gives a synonym, a fact or a fill-in-the-blank, and the difficulty lies in the vocabulary, the obliqueness of the definition and the interlocking of the grid, which in the American style is dense, with almost every letter belonging to two words.",
          "The grid is dense, letters serving two words.",
        ),
        mcq(
          "What does the surface meaning of a cryptic clue provide?",
          [
            "Nothing — it is deliberate misdirection",
            "A hint about the length of the answer",
            "The definition half of the clue",
            "The wordplay device being used",
          ],
          "Nothing — it is deliberate misdirection",
          "The apparent surface meaning of the clue, the sentence it seems to be, is deliberate misdirection and carries no information at all.",
          "It 'carries no information at all'.",
        ),
        mcq(
          "What does the passage say about newspapers today?",
          [
            "They have kept the crossword while dropping other features",
            "They have replaced crosswords with newer puzzle types",
            "They print only American-style puzzles",
            "They no longer employ human setters",
          ],
          "They have kept the crossword while dropping other features",
          "Newspapers have shed most of their features and kept the crossword, which now appears in print and on applications with timers, streaks and leaderboards attached.",
          "They 'have shed most of their features and kept the crossword'.",
        ),
      ],
    },
    {
      key: "t62-p3-colour-words",
      title: "Naming What the Eye Sees",
      topic: "whether the words a language has for colours change what its speakers notice",
      difficulty: 6,
      body: `A) Languages divide the spectrum differently, and they do it in ways that look arbitrary until they are compared. Russian has no single word covering the range English calls blue: it has two basic terms, one for lighter and one for darker shades, treated as distinct colours rather than as shades of one. Many languages have a single term covering both green and blue. Some have five basic colour terms, some eleven, and a few, according to the surveys, have two. The count depends on what is admitted as basic, which is itself a contested question: a term qualifies only if it is short, widely known, not a sub-shade of another term and not restricted to particular objects, and every one of those conditions has been argued over.

B) The two-term case is the one that produced the first real pattern. A large comparative study in the late 1960s found that where a language has only two basic colour terms, they always divide roughly into dark-cool and light-warm; where it has three, the third is always red; where four, the fourth is green or yellow; and so on through a sequence that turned out to be remarkably consistent across unrelated languages. That result was taken as strong evidence against the idea that colour vocabulary is arbitrary, and in favour of the view that it is constrained by the structure of human vision, which every population shares.

C) The opposite claim, that vocabulary shapes perception, has a longer history and a worse reputation, largely because of how it was overstated in the mid-twentieth century. The strong version — that speakers cannot perceive distinctions their language does not name — is false and was never seriously defended by anybody who looked at the evidence. Anybody who has ever matched paint in a shop has done it without knowing the name of a single shade on the card. People distinguish colours they have no word for, readily and accurately.

D) The interesting evidence concerns speed rather than ability. Russian speakers asked to pick which of two squares matches a third do so faster when the two squares fall on opposite sides of their light-blue/dark-blue boundary than when both fall on the same side, an advantage English speakers do not show. The effect is small, it is measured in milliseconds, and it disappears when the participant is simultaneously doing a verbal task that occupies the language system — which suggests that language is being recruited to help with the comparison rather than altering what is seen.

E) A second line of evidence comes from the left and right halves of the visual field. The categorical advantage appears more strongly for colours shown to the right visual field, which is processed by the left hemisphere, where language is predominantly located. That asymmetry is difficult to explain on any account in which language plays no part, and it is also difficult to reconcile with any account in which perception itself has been restructured, since the same person shows the effect on one side and not the other.

F) A separate and more recent finding concerns which colours get named at all. Across many languages, warm colours are named more consistently and with less disagreement between speakers than cool ones, and an analysis of photographs suggests why: the objects people talk about tend to be warm-coloured against cool backgrounds. Colour vocabulary, on this account, is shaped less by the eye or by the culture than by what is worth distinguishing in the environment.

G) The position that seems to me defensible is narrow and rather undramatic. Language does not change what the eye delivers, and it does not create or destroy the ability to tell two shades apart. What it does is provide a label that is available when a task requires holding a colour in mind, comparing it, or reporting it — and that assistance shows up as a small, measurable advantage at a category boundary the language happens to draw. Everything stronger than that has either failed to replicate or has been argued for on the basis of anecdotes about snow. It is a modest conclusion for a question that has attracted a century of immodest claims, and its modesty is the reason it has survived the experiments.`,
      questions: [
        fromList(
          "matching_information",
          COLOUR_PARAGRAPHS,
          "the order in which languages are said to add colour terms",
          "B",
          "A large comparative study in the late 1960s found that where a language has only two basic colour terms, they always divide roughly into dark-cool and light-warm; where it has three, the third is always red; where four, the fourth is green or yellow; and so on through a sequence that turned out to be remarkably consistent across unrelated languages.",
          "Paragraph B gives the sequence.",
        ),
        fromList(
          "matching_information",
          COLOUR_PARAGRAPHS,
          "evidence involving which side of the visual field a colour appears in",
          "E",
          "The categorical advantage appears more strongly for colours shown to the right visual field, which is processed by the left hemisphere, where language is predominantly located.",
          "Paragraph E covers the visual-field asymmetry.",
        ),
        fromList(
          "matching_information",
          COLOUR_PARAGRAPHS,
          "an explanation based on what objects tend to look like",
          "F",
          "Across many languages, warm colours are named more consistently and with less disagreement between speakers than cool ones, and an analysis of photographs suggests why: the objects people talk about tend to be warm-coloured against cool backgrounds.",
          "Paragraph F gives the object-based account.",
        ),
        fromList(
          "matching_information",
          COLOUR_PARAGRAPHS,
          "examples of languages dividing the spectrum in different places",
          "A",
          "Russian has no single word covering the range English calls blue: it has two basic terms, one for lighter and one for darker shades, treated as distinct colours rather than as shades of one.",
          "Paragraph A gives the Russian and green-blue examples.",
        ),
        fromList(
          "matching_information",
          COLOUR_PARAGRAPHS,
          "a statement of the writer's own position",
          "G",
          "The position that seems to me defensible is narrow and rather undramatic.",
          "Paragraph G states the writer's position.",
        ),
        ynng(
          "The writer accepts that speakers cannot see distinctions their language lacks.",
          "NO",
          "The strong version — that speakers cannot perceive distinctions their language does not name — is false and was never seriously defended by anybody who looked at the evidence.",
          "That version 'is false'.",
        ),
        ynng(
          "The writer regards the millisecond differences as genuine findings.",
          "YES",
          "Russian speakers asked to pick which of two squares matches a third do so faster when the two squares fall on opposite sides of their light-blue/dark-blue boundary than when both fall on the same side, an advantage English speakers do not show.",
          "The advantage is reported as a real result.",
        ),
        ynng(
          "The writer thinks the visual-field result shows perception itself is restructured.",
          "NO",
          "That asymmetry is difficult to explain on any account in which language plays no part, and it is also difficult to reconcile with any account in which perception itself has been restructured, since the same person shows the effect on one side and not the other.",
          "It is 'difficult to reconcile' with restructured perception.",
        ),
        ynng(
          "The writer considers the surviving version of the claim to be modest.",
          "YES",
          "The position that seems to me defensible is narrow and rather undramatic.",
          "It is 'narrow and rather undramatic'.",
        ),
        fromList(
          "matching_sentence_endings",
          COLOUR_ENDINGS,
          "The naming sequence looks biological rather than cultural,",
          "because every language studied names black and white before anything else.",
          "A large comparative study in the late 1960s found that where a language has only two basic colour terms, they always divide roughly into dark-cool and light-warm; where it has three, the third is always red; where four, the fourth is green or yellow; and so on through a sequence that turned out to be remarkably consistent across unrelated languages.",
          "The two-term stage is always dark-cool and light-warm.",
        ),
        fromList(
          "matching_sentence_endings",
          COLOUR_ENDINGS,
          "Missing vocabulary does not prevent discrimination,",
          "although the speakers can distinguish the shades perfectly well without a word.",
          "People distinguish colours they have no word for, readily and accurately.",
          "They do so 'readily and accurately'.",
        ),
        fromList(
          "matching_sentence_endings",
          COLOUR_ENDINGS,
          "The measured effect is one of speed,",
          "which is why reaction times differ even when accuracy does not.",
          "The effect is small, it is measured in milliseconds, and it disappears when the participant is simultaneously doing a verbal task that occupies the language system — which suggests that language is being recruited to help with the comparison rather than altering what is seen.",
          "It shows up in milliseconds, not in accuracy.",
        ),
        fromList(
          "matching_sentence_endings",
          COLOUR_ENDINGS,
          "The differences between languages are not differences in the eye,",
          "even though the eye of every population tested is built the same way.",
          "That result was taken as strong evidence against the idea that colour vocabulary is arbitrary, and in favour of the view that it is constrained by the structure of human vision, which every population shares.",
          "Human vision is shared by every population.",
        ),
        fromList(
          "matching_sentence_endings",
          COLOUR_ENDINGS,
          "A label helps when a colour must be held in mind,",
          "which the writer thinks is the most defensible version of the claim.",
          "What it does is provide a label that is available when a task requires holding a colour in mind, comparing it, or reporting it — and that assistance shows up as a small, measurable advantage at a category boundary the language happens to draw.",
          "That is the narrow claim the writer defends.",
        ),
      ],
    },
  ],
};
