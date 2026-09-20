import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · linguistics · notes box ------------------------------------

const SIGN_NOTES = {
  title: "Three cohorts, three grammars",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · music cognition · people and a word bank ------------------

const PITCH_PEOPLE = ["Sofia Lindgren", "Arun Devakumar", "Marta Wójcik", "Yusuf Demirel"];
const PITCH_BANK = [
  "label",
  "critical",
  "tonal",
  "reference",
  "drift",
  "interval",
  "instrument",
  "inherited",
  "screening",
];

// ---- Passage 3 · perception · lettered paragraphs --------------------------

const SYNAESTHESIA_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SYNAESTHESIA_ENDINGS = [
  "because the pairings stay the same across a person's whole life.",
  "which is what distinguishes the condition from a vivid metaphor.",
  "since the letters that share a colour often share a shape or a position.",
  "although the advantage shows up only for the material the colours attach to.",
  "because a self-report cannot be checked against anything external.",
  "even though it had been described carefully in the nineteenth century.",
  "which suggests the wiring is ordinary and the pruning is not.",
];

export const TEST_86: CuratedTest = {
  key: "full-test-86",
  targetBand: 8,
  passages: [
    {
      key: "t86-p1-emergent-sign-language",
      title: "A Language That Made Itself",
      topic: "what happened when deaf children with no shared language were brought together",
      difficulty: 7,
      body: `Until the late 1970s, deaf children in Nicaragua were educated at home, if at all. Each one grew up in a hearing family, inventing gestures with parents and siblings to handle the business of a household. Such systems, which linguists call home sign, are genuine communication and are not languages: they have a small vocabulary, no consistent word order, and no grammatical machinery of any kind. Crucially, they are not shared. Each family's gestures are its own, and two children raised twenty kilometres apart had nothing in common.

Then a school opened in Managua, and later a vocational centre, and several hundred deaf children were brought together for the first time. The teaching was oral, an attempt to train the children to lip-read and speak Spanish, and by the school's own standards it failed almost completely. What the teachers did not notice, for several years, was what was happening in the playground and on the buses. The children, pooling their home signs, were building something none of them had been taught.

The first cohort produced what is usually described as a pidgin: a common vocabulary, agreed by use, with loose and variable ordering. It served for everyday exchange and it was not a full language. Then younger children arrived, encountered this system as the thing everyone around them used, and did something to it. Where their elders had a variable order, the younger signers fixed one. Where their elders had strung gestures together, the younger ones developed inflections on the verb to mark who did what to whom. They introduced grammatical devices for reference — a way of establishing a location in space and then pointing back to it, which does the work of a pronoun. In the space of roughly a decade, the system acquired the structural properties linguists use to define a language, and it acquired them from the children who learned it rather than from the children who created it.

This sequence is the most-studied natural experiment in the field, and its interpretation has been argued over ever since. The strongest reading is that it shows language acquisition to be a constructive rather than a receptive process: a child does not simply absorb the system around it but reorganises it, and imposes structure that the input does not contain. Judith Kegl, who first documented the case, and Ann Senghas, who has measured the differences between cohorts in detail, both found that the age at which a signer arrived mattered enormously, and that the innovations belong overwhelmingly to those who arrived young.

The cautions are as important as the finding. The children were not isolated from language in general: they lived in a society full of it, could see Spanish being spoken and written, and were surrounded by hearing people gesturing. Some Spanish influence on the emerging grammar is likely and hard to quantify. The documentation began several years after the process started, so the earliest stages are reconstructed from the memories and the current signing of the first cohort rather than observed. And the case is one case. There are a handful of others, in Israel, in Nicaragua's neighbours and in isolated villages with high rates of inherited deafness, and each differs from the others in ways that make generalisation uncomfortable.

What the case does establish, and what almost nobody disputes, is a negative claim of some force: a full language can arise in one or two generations among children who have not been exposed to one. That rules out the view that grammatical structure is simply a cultural inheritance transmitted from adults, because in this instance there were no adults who had it. It does not, on its own, settle what the children were using instead. A rich innate grammar and a powerful general capacity for finding and imposing regularities would both predict the observed result, and the case cannot distinguish between them.

There is also an ethical dimension that the scientific literature has not always foregrounded. The reason the experiment was available to science is that deaf Nicaraguan children were denied access to a sign language by a policy that regarded signing as an obstacle to speech, a policy held in many countries for most of the twentieth century and now generally abandoned. The linguistic windfall was the product of an educational failure, and the community that produced the language has since had to argue for its recognition against people who had described it as a collection of gestures.`,
      questions: [
        tfng(
          "Home sign systems used by separate families resembled one another.",
          "FALSE",
          "Each family's gestures are its own, and two children raised twenty kilometres apart had nothing in common.",
          "They 'had nothing in common'.",
        ),
        tfng(
          "The school in Managua achieved its stated aim.",
          "FALSE",
          "The teaching was oral, an attempt to train the children to lip-read and speak Spanish, and by the school's own standards it failed almost completely.",
          "It 'failed almost completely'.",
        ),
        tfng(
          "The grammatical innovations came mainly from the children who invented the first system.",
          "FALSE",
          "In the space of roughly a decade, the system acquired the structural properties linguists use to define a language, and it acquired them from the children who learned it rather than from the children who created it.",
          "They came from those who learned it.",
        ),
        tfng(
          "The age at which a signer joined the community affected their signing.",
          "TRUE",
          "Judith Kegl, who first documented the case, and Ann Senghas, who has measured the differences between cohorts in detail, both found that the age at which a signer arrived mattered enormously, and that the innovations belong overwhelmingly to those who arrived young.",
          "Arrival age 'mattered enormously'.",
        ),
        tfng(
          "The earliest stages of the language were directly observed by researchers.",
          "FALSE",
          "The documentation began several years after the process started, so the earliest stages are reconstructed from the memories and the current signing of the first cohort rather than observed.",
          "They are reconstructed rather than observed.",
        ),
        tfng(
          "The case can distinguish between an innate grammar and a general learning capacity.",
          "FALSE",
          "A rich innate grammar and a powerful general capacity for finding and imposing regularities would both predict the observed result, and the case cannot distinguish between them.",
          "It 'cannot distinguish between them'.",
        ),
        tfng(
          "The language now has official status in Nicaragua.",
          "NOT GIVEN",
          "",
          "The passage mentions an argument for recognition but not its outcome.",
        ),
        noteLine(
          SIGN_NOTES,
          null,
          "First cohort: produced a ______ with variable ordering",
          "pidgin",
          "The first cohort produced what is usually described as a pidgin: a common vocabulary, agreed by use, with loose and variable ordering.",
          "The first cohort produced a pidgin.",
          { before: [{ text: "What each group contributed:", indent: 0 }] },
        ),
        noteLine(
          SIGN_NOTES,
          null,
          "Later arrivals: fixed the ______ their elders had left loose",
          "order",
          "Where their elders had a variable order, the younger signers fixed one.",
          "The younger signers fixed the order.",
        ),
        noteLine(
          SIGN_NOTES,
          null,
          "Later arrivals: added ______ on the verb to mark who acted on whom",
          "inflections",
          "Where their elders had strung gestures together, the younger ones developed inflections on the verb to mark who did what to whom.",
          "They developed verb inflections.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A location in space could be established and pointed back to, doing the work of a ______.",
          "pronoun",
          "They introduced grammatical devices for reference — a way of establishing a location in space and then pointing back to it, which does the work of a pronoun.",
          "It does the work of a pronoun.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The case rules out the idea that grammar is purely a cultural ______.",
          "inheritance",
          "That rules out the view that grammatical structure is simply a cultural inheritance transmitted from adults, because in this instance there were no adults who had it.",
          "It rules out cultural inheritance alone.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The opportunity for science arose from an educational ______.",
          "failure",
          "The linguistic windfall was the product of an educational failure, and the community that produced the language has since had to argue for its recognition against people who had described it as a collection of gestures.",
          "It was 'the product of an educational failure'.",
        ),
      ],
    },
    {
      key: "t86-p2-absolute-pitch",
      title: "The Ear That Names a Note",
      topic: "a rare ability that appears to depend on when a child starts rather than on talent",
      difficulty: 8,
      body: `Most musicians, played a note in isolation, cannot say which note it is. They can say with great accuracy how far it lies from another note, which is the skill that playing in tune requires, but the identity of a single tone in the absence of any comparison is not available to them. A small minority can name it immediately, without reference to anything, in the way that most people can name a colour. The ability is called absolute pitch, and its distribution is the interesting thing about it.

Estimates of prevalence in Western conservatoires run at a few per cent. In East Asian conservatoires the figure is several times higher, and in some samples approaches half. That difference was for a long time attributed to genetics, and the genetic contribution is real: the trait runs in families and twin studies find substantial heritability. But Sofia Lindgren, who has compared music schools across several countries, argues that the apparent geography dissolves once age of first training is controlled for, because the schools with the high figures are the ones that start children at three or four rather than at seven or eight. She does not claim the trait is purely learned; she claims the samples were never comparable.

The age effect is the most robust finding in the area. Almost nobody who begins musical training after about the age of eight develops absolute pitch, and the probability rises steeply the earlier training begins. Attempts to train it in adults have a long and almost uniformly disappointing history: adults can be taught to identify notes with practice, but the performance is slow, effortful, decays without rehearsal, and looks nothing like the immediate recognition of a possessor. Arun Devakumar, who has run several such training studies, concludes that what adults acquire is a different skill wearing the same name, and that the failure is informative rather than merely disappointing, because it points to a window that closes.

Why a window should exist at all is contested. One account holds that pitch labelling is like phoneme learning: an infant's auditory system is being tuned to the categories its language uses, and a child learning to attach names to absolute frequencies during that period is exploiting general machinery that is later repurposed or shut down. This predicts an association with tonal languages, in which pitch carries lexical meaning, and the association has been found in several studies and failed to appear in others. Marta Wójcik, a psycholinguist, regards the tonal-language hypothesis as plausible but poorly tested, since speakers of tonal languages in the relevant samples also tend to have begun training earlier, and the two variables have rarely been separated.

The ability is not an unmixed advantage, and possessors are often the first to say so. A musician who identifies notes absolutely can be disturbed by music played at a different reference pitch — an orchestra tuned to a slightly higher standard, or a baroque ensemble tuned a semitone down — in a way that a relative listener is not. Transposing at sight, a routine requirement for an accompanist, is harder for some possessors because the names they hear conflict with the names on the page. Yusuf Demirel, a conductor, makes a stronger claim: that absolute pitch is frequently mistaken for musicianship by teachers and by parents, and that he has auditioned many players who could name every note in a chord and could not hear that the chord was out of balance.

There is also a curious late development. The internal reference appears to drift upward with age in some possessors, so that a note heard as one pitch in youth is heard as a slightly different one in later life. The drift is small, on the order of a semitone over decades, and it is enough to distress a musician who has relied on the faculty for fifty years. It suggests that whatever mechanism underlies the ability is not a fixed physical constant but a calibrated one, holding its setting for a long time and not forever.

What the research has not produced is any evidence that the ability is required for musical excellence. The list of composers reliably reported to have possessed it and the list reliably reported not to have possessed it are both distinguished. Absolute pitch is a well-defined perceptual trait with an unusually clear developmental signature, which makes it valuable to study, and it is a poor proxy for the thing music schools are actually trying to select.`,
      questions: [
        fromList(
          "matching_features",
          PITCH_PEOPLE,
          "The national differences may be an artefact of when training begins.",
          "Sofia Lindgren",
          "But Sofia Lindgren, who has compared music schools across several countries, argues that the apparent geography dissolves once age of first training is controlled for, because the schools with the high figures are the ones that start children at three or four rather than at seven or eight.",
          "Lindgren attributes the geography to starting age.",
        ),
        fromList(
          "matching_features",
          PITCH_PEOPLE,
          "What adults learn is not the same ability under the same name.",
          "Arun Devakumar",
          "Arun Devakumar, who has run several such training studies, concludes that what adults acquire is a different skill wearing the same name, and that the failure is informative rather than merely disappointing, because it points to a window that closes.",
          "Devakumar calls it a different skill.",
        ),
        fromList(
          "matching_features",
          PITCH_PEOPLE,
          "Two explanatory variables have hardly ever been separated.",
          "Marta Wójcik",
          "Marta Wójcik, a psycholinguist, regards the tonal-language hypothesis as plausible but poorly tested, since speakers of tonal languages in the relevant samples also tend to have begun training earlier, and the two variables have rarely been separated.",
          "Wójcik names the confound.",
        ),
        fromList(
          "matching_features",
          PITCH_PEOPLE,
          "The ability is mistaken by teachers for something broader.",
          "Yusuf Demirel",
          "Yusuf Demirel, a conductor, makes a stronger claim: that absolute pitch is frequently mistaken for musicianship by teachers and by parents, and that he has auditioned many players who could name every note in a chord and could not hear that the chord was out of balance.",
          "Demirel says it is mistaken for musicianship.",
        ),
        fromList(
          "summary_completion",
          PITCH_BANK,
          "A possessor can attach a ______ to a tone heard on its own.",
          "label",
          "A small minority can name it immediately, without reference to anything, in the way that most people can name a colour.",
          "They can name the tone alone.",
        ),
        fromList(
          "summary_completion",
          PITCH_BANK,
          "Most musicians instead judge the ______ between two notes.",
          "interval",
          "They can say with great accuracy how far it lies from another note, which is the skill that playing in tune requires, but the identity of a single tone in the absence of any comparison is not available to them.",
          "They judge distance between notes.",
        ),
        fromList(
          "summary_completion",
          PITCH_BANK,
          "The ability seems to depend on a ______ period in early childhood.",
          "critical",
          "Almost nobody who begins musical training after about the age of eight develops absolute pitch, and the probability rises steeply the earlier training begins.",
          "The window closes in early childhood.",
        ),
        fromList(
          "summary_completion",
          PITCH_BANK,
          "One account links it to ______ languages, in which pitch carries meaning.",
          "tonal",
          "This predicts an association with tonal languages, in which pitch carries lexical meaning, and the association has been found in several studies and failed to appear in others.",
          "The hypothesis concerns tonal languages.",
        ),
        fromList(
          "summary_completion",
          PITCH_BANK,
          "In later life the internal ______ may shift slightly upward.",
          "reference",
          "The internal reference appears to drift upward with age in some possessors, so that a note heard as one pitch in youth is heard as a slightly different one in later life.",
          "The internal reference drifts.",
        ),
        mcq(
          "What does the writer say about the genetic contribution?",
          [
            "It is real but does not explain the national differences",
            "It has been ruled out by twin studies",
            "It accounts for most of the variation between countries",
            "It has never been investigated",
          ],
          "It is real but does not explain the national differences",
          "That difference was for a long time attributed to genetics, and the genetic contribution is real: the trait runs in families and twin studies find substantial heritability.",
          "The contribution is real; the geography is explained otherwise.",
        ),
        mcq(
          "Why can absolute pitch make transposing harder?",
          [
            "The heard names conflict with the written ones",
            "Possessors read music more slowly",
            "The ability fades under pressure",
            "Transposition alters the interval structure",
          ],
          "The heard names conflict with the written ones",
          "Transposing at sight, a routine requirement for an accompanist, is harder for some possessors because the names they hear conflict with the names on the page.",
          "The names conflict.",
        ),
        mcq(
          "What does the age-related drift suggest about the mechanism?",
          [
            "It is calibrated rather than fixed",
            "It is entirely learned",
            "It depends on continued practice",
            "It is located in the outer ear",
          ],
          "It is calibrated rather than fixed",
          "It suggests that whatever mechanism underlies the ability is not a fixed physical constant but a calibrated one, holding its setting for a long time and not forever.",
          "It is 'a calibrated one'.",
        ),
        mcq(
          "What is the writer's conclusion about musical excellence?",
          [
            "The ability is not required for it",
            "The ability is a reliable predictor of it",
            "Composers without it rarely succeeded",
            "It matters only for performers",
          ],
          "The ability is not required for it",
          "What the research has not produced is any evidence that the ability is required for musical excellence.",
          "No evidence that it is required.",
        ),
      ],
    },
    {
      key: "t86-p3-synaesthesia",
      title: "When Letters Have Colours",
      topic: "a perceptual crossing that took a century to be taken seriously",
      difficulty: 9,
      body: `A) A small proportion of people experience one kind of sensory input as automatically accompanied by another. The commonest form attaches colours to letters and numbers: the letter A is red, the numeral 5 is green, and the pairing is not chosen, not remembered as a fact, and not experienced as a comparison. Other forms attach colours to sounds, tastes to words, or spatial positions to the months of the year. The condition is called synaesthesia, and its history in science is a case study in how a phenomenon that cannot be verified from outside gets treated.

B) It was described carefully in the nineteenth century, notably by Francis Galton, who collected accounts and noticed that the associations were consistent within a person and idiosyncratic between people. Then it disappeared from the literature for roughly seventy years. The reason is usually given as the rise of behaviourism, which had no method for anything reportable but not observable, and the effect was that synaesthetes were told, if they mentioned it, that they were speaking metaphorically or making it up. Many of them stopped mentioning it, which is a data-collection problem that lasted two generations.

C) What returned the subject to respectability was the construction of tests that a person merely claiming the experience would fail. The simplest is consistency over time: asked to assign a colour to each letter, a synaesthete produces nearly the same set of colours months or years later, while a control asked to invent associations does not. The more elegant is a variant of the standard interference task. A synaesthete for whom 2 is red reads a page of black digits faster than a page in which each digit is printed in a colour that conflicts with its own, and the slowing is involuntary and measurable. Neither test depends on the experience being described accurately.

D) Brain imaging has since shown differences in the expected places, with colour-processing regions activating in grapheme-colour synaesthetes when they view letters presented in black. The interpretation is less settled than the finding. One account proposes extra physical connections between adjacent cortical regions. Another proposes that the connections are present in everyone and that inhibition between regions is weaker in synaesthetes, which would make the condition a failure of suppression rather than an addition of wiring. Infants appear to show broad cross-modal responses that narrow during development, which is consistent with the second account and does not establish it.

E) The associations themselves are not arbitrary in the way early reports implied. Across large samples, certain patterns recur: A tends towards red more often than chance allows, vowels are lighter than consonants, and letters of similar shape or adjacent position in the alphabet tend to take similar colours. Frequency of the letter in the language predicts the brightness of its colour. The same holds in scripts other than the Latin alphabet, and in speakers who learned their letters in a different order, which is the observation that makes a purely anatomical story difficult. These regularities suggest that the pairings are built from ordinary statistical properties of the learned system rather than assigned at random, which complicates any account resting purely on anatomy.

F) The practical consequences are modest and frequently overstated. Synaesthetes do somewhat better on memory tasks involving the material their colours attach to, because a second code is available for the same item, and they do not show any general advantage in memory or intelligence. Popular accounts tend to present the condition as a creative gift, and although it is reported more often among artists and writers than in the general population, that comparison rests on self-selected samples and self-report, which is exactly the combination the field spent seventy years learning not to trust.

G) The most interesting implication is methodological rather than clinical. Synaesthesia is a case where a private experience was dismissed for want of a way to test it, and then admitted once someone designed a task in which the experience produces an involuntary behavioural consequence. The lesson generalises: the question to ask about an unverifiable report is not whether it can be believed but whether it predicts something the reporter cannot control. A great deal of what people say about their own minds is currently in the position synaesthesia occupied in 1930, and the reason is not that the reports are false.`,
      questions: [
        fromList(
          "matching_information",
          SYNAESTHESIA_PARAGRAPHS,
          "a task in which conflicting print colours slow a reader involuntarily",
          "C",
          "A synaesthete for whom 2 is red reads a page of black digits faster than a page in which each digit is printed in a colour that conflicts with its own, and the slowing is involuntary and measurable.",
          "Paragraph C describes the interference task.",
        ),
        fromList(
          "matching_information",
          SYNAESTHESIA_PARAGRAPHS,
          "a claim that popular accounts rest on the wrong kind of sample",
          "F",
          "Popular accounts tend to present the condition as a creative gift, and although it is reported more often among artists and writers than in the general population, that comparison rests on self-selected samples and self-report, which is exactly the combination the field spent seventy years learning not to trust.",
          "Paragraph F names the sampling problem.",
        ),
        fromList(
          "matching_information",
          SYNAESTHESIA_PARAGRAPHS,
          "the effect on the evidence of people choosing to stay silent",
          "B",
          "Many of them stopped mentioning it, which is a data-collection problem that lasted two generations.",
          "Paragraph B describes the silence and its effect.",
        ),
        fromList(
          "matching_information",
          SYNAESTHESIA_PARAGRAPHS,
          "regularities in which colours attach to which letters",
          "E",
          "Across large samples, certain patterns recur: A tends towards red more often than chance allows, vowels are lighter than consonants, and letters of similar shape or adjacent position in the alphabet tend to take similar colours.",
          "Paragraph E lists the recurring patterns.",
        ),
        fromList(
          "matching_information",
          SYNAESTHESIA_PARAGRAPHS,
          "two competing accounts of what differs in the brain",
          "D",
          "One account proposes extra physical connections between adjacent cortical regions.",
          "Paragraph D sets the two accounts against each other.",
        ),
        ynng(
          "The writer thinks behaviourism was right to exclude the phenomenon.",
          "NO",
          "The reason is usually given as the rise of behaviourism, which had no method for anything reportable but not observable, and the effect was that synaesthetes were told, if they mentioned it, that they were speaking metaphorically or making it up.",
          "The writer treats the exclusion as a loss.",
        ),
        ynng(
          "The writer believes the imaging results settle the question of mechanism.",
          "NO",
          "The interpretation is less settled than the finding.",
          "Interpretation is 'less settled than the finding'.",
        ),
        ynng(
          "The writer accepts that the colour pairings are partly shaped by properties of the alphabet.",
          "YES",
          "These regularities suggest that the pairings are built from ordinary statistical properties of the learned system rather than assigned at random, which complicates any account resting purely on anatomy.",
          "They are built from statistical properties.",
        ),
        ynng(
          "The writer thinks the main value of the case lies in what it shows about testing private reports.",
          "YES",
          "The most interesting implication is methodological rather than clinical.",
          "The implication is 'methodological rather than clinical'.",
        ),
        fromList(
          "matching_sentence_endings",
          SYNAESTHESIA_ENDINGS,
          "A claimed synaesthete can be distinguished from an inventive one,",
          "because the pairings stay the same across a person's whole life.",
          "The simplest is consistency over time: asked to assign a colour to each letter, a synaesthete produces nearly the same set of colours months or years later, while a control asked to invent associations does not.",
          "The same colours come back years later.",
        ),
        fromList(
          "matching_sentence_endings",
          SYNAESTHESIA_ENDINGS,
          "The subject was absent from science for seventy years,",
          "even though it had been described carefully in the nineteenth century.",
          "It was described carefully in the nineteenth century, notably by Francis Galton, who collected accounts and noticed that the associations were consistent within a person and idiosyncratic between people.",
          "It had been described well before the gap.",
        ),
        fromList(
          "matching_sentence_endings",
          SYNAESTHESIA_ENDINGS,
          "Cross-modal responses in infants narrow as they develop,",
          "which suggests the wiring is ordinary and the pruning is not.",
          "Infants appear to show broad cross-modal responses that narrow during development, which is consistent with the second account and does not establish it.",
          "The narrowing fits the weak-inhibition account.",
        ),
        fromList(
          "matching_sentence_endings",
          SYNAESTHESIA_ENDINGS,
          "The pairings are not assigned at random,",
          "since the letters that share a colour often share a shape or a position.",
          "Across large samples, certain patterns recur: A tends towards red more often than chance allows, vowels are lighter than consonants, and letters of similar shape or adjacent position in the alphabet tend to take similar colours.",
          "Shape and alphabetical position both predict the colour.",
        ),
        fromList(
          "matching_sentence_endings",
          SYNAESTHESIA_ENDINGS,
          "Memory performance improves in a narrow way,",
          "although the advantage shows up only for the material the colours attach to.",
          "Synaesthetes do somewhat better on memory tasks involving the material their colours attach to, because a second code is available for the same item, and they do not show any general advantage in memory or intelligence.",
          "The gain is confined to that material.",
        ),
      ],
    },
  ],
};
