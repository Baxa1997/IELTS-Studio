import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · archaeology · notes ----------------------------------------

const STONE = {
  title: "The stone and its decipherment",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs, people -------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SAND_PEOPLE = ["Farida Osman", "Lars Petersen", "Vinh Nguyen", "Grace Achieng"];

// ---- Passage 3 · research debate · word bank --------------------------------

const STUDY_BANK = [
  "curve",
  "gaps",
  "fluency",
  "retrieval",
  "cramming",
  "syllabus",
  "sleep",
  "exam",
  "notes",
  "textbooks",
];

export const TEST_39: CuratedTest = {
  key: "full-test-39",
  targetBand: 7,
  passages: [
    {
      key: "t39-p1-rosetta",
      title: "Three Scripts, One Decree",
      topic: "how the Rosetta Stone made it possible to read hieroglyphs",
      difficulty: 6,
      body: `In July 1799, French soldiers strengthening the defences of a fort near the town of Rashid, on the western edge of the Nile delta, pulled a slab of dark stone out of a wall they were demolishing. An officer with some education noticed that it carried inscriptions in three different scripts and understood at once that it might matter. The stone had been broken up and reused as building material at some point in its history, and most of what was written on it was already missing, but what remained was enough.

The text was a decree issued by a council of priests at Memphis in 196 BCE, confirming the royal cult of the young king Ptolemy V and listing the benefits he had conferred on the temples. Copies of the decree were set up in temples throughout Egypt, and other examples have since been found. What made this one important was not its content, which is unremarkable, but the fact that the same words were given three times: in hieroglyphs, the formal script of monuments and religion; in demotic, the cursive script used for everyday documents; and in Greek, the language of the ruling dynasty.

The slab itself is a piece of hard, dark rock, and the part that survives stands a little over a metre high. The break runs across the top, so most of the hieroglyphic version — the section at the head of the stone — is missing, and the Greek at the foot is the only one of the three that is nearly complete. It is an irony of the object that the script scholars least needed is the one they were given in full.

At the time, no one could read the first two. Knowledge of hieroglyphs had died out in the fourth century CE, and for fourteen hundred years scholars had assumed that the signs were symbols standing for ideas rather than sounds — an assumption reinforced by a late Greek text that interpreted them mystically. Greek, by contrast, was familiar to every classical scholar in Europe. A bilingual inscription of this kind was exactly what was needed, and copies of the text were distributed widely.

The stone itself changed hands almost immediately. When British forces defeated the French in Egypt in 1801, the terms of surrender required the antiquities collected by the French expedition to be handed over, and the stone reached London the following year. It has been in the British Museum ever since, and is the most visited object in it. Egypt has repeatedly requested its return, and the museum has repeatedly declined.

Decipherment took another twenty years and two men who never worked comfortably together. The English physician Thomas Young established that the oval rings called cartouches enclosed royal names, that the demotic and hieroglyphic scripts were related, and that some signs were phonetic, at least for foreign names. He assumed, however, that the phonetic use was a special case, and his progress stopped there.

The breakthrough belongs to Jean-François Champollion, a French scholar who had studied Coptic, the language of Egyptian Christians, which is descended from ancient Egyptian and written in Greek letters. In 1822 he compared the cartouches of foreign rulers with those on other monuments and realised that signs were being used phonetically in native Egyptian names too — and, crucially, that the sounds they spelled made sense as Coptic words. The system was neither purely symbolic nor purely alphabetic: some signs stood for sounds, some for whole words, and some silently indicated the category a word belonged to. He announced his results in a letter read to an academy in Paris, and spent the remaining decade of his life building a grammar and a dictionary.

What the decipherment opened was not one text but a civilisation. Three thousand years of inscriptions, letters, accounts, medical recipes, poems and legal disputes became readable, and Egyptology changed from the study of objects to the study of a literate society that had left an extraordinary quantity of writing behind. The stone itself is a modest thing, worn and incomplete, propped in a glass case in a crowded gallery, and by the standards of Egyptian monuments it is neither large nor beautiful. Its importance lies entirely in the accident that a bureaucratic decree was published in three scripts, one of which nobody had ever forgotten how to read.`,
      questions: [
        noteLine(
          STONE,
          "Discovery",
          "Found in 1799 by French soldiers strengthening a ______ near Rashid",
          "fort",
          "In July 1799, French soldiers strengthening the defences of a fort near the town of Rashid, on the western edge of the Nile delta, pulled a slab of dark stone out of a wall they were demolishing.",
          "They were strengthening 'the defences of a fort'.",
        ),
        noteLine(
          STONE,
          "Discovery",
          "The stone had earlier been reused as building ______",
          "material",
          "The stone had been broken up and reused as building material at some point in its history, and most of what was written on it was already missing, but what remained was enough.",
          "It was 'reused as building material'.",
        ),
        noteLine(
          STONE,
          "The text",
          "A decree issued by a council of ______ at Memphis in 196 BCE",
          "priests",
          "The text was a decree issued by a council of priests at Memphis in 196 BCE, confirming the royal cult of the young king Ptolemy V and listing the benefits he had conferred on the temples.",
          "It was issued 'by a council of priests'.",
        ),
        noteLine(
          STONE,
          "The text",
          "Written in hieroglyphs, ______ and Greek",
          "demotic",
          "What made this one important was not its content, which is unremarkable, but the fact that the same words were given three times: in hieroglyphs, the formal script of monuments and religion; in demotic, the cursive script used for everyday documents; and in Greek, the language of the ruling dynasty.",
          "The three scripts are hieroglyphic, demotic and Greek.",
        ),
        noteLine(
          STONE,
          "Decipherment",
          "Young showed that ______ enclosed royal names",
          "cartouches",
          "The English physician Thomas Young established that the oval rings called cartouches enclosed royal names, that the demotic and hieroglyphic scripts were related, and that some signs were phonetic, at least for foreign names.",
          "'Cartouches enclosed royal names'.",
        ),
        noteLine(
          STONE,
          "Decipherment",
          "Champollion's knowledge of ______ showed that the sounds made words",
          "Coptic",
          "The breakthrough belongs to Jean-François Champollion, a French scholar who had studied Coptic, the language of Egyptian Christians, which is descended from ancient Egyptian and written in Greek letters.",
          "Champollion 'had studied Coptic'.",
        ),
        noteLine(
          STONE,
          "Decipherment",
          "Some signs stand for sounds, some for words, and some mark a word's ______",
          "category",
          "The system was neither purely symbolic nor purely alphabetic: some signs stood for sounds, some for whole words, and some silently indicated the category a word belonged to.",
          "Some signs 'indicated the category a word belonged to'.",
        ),
        tfng(
          "An officer present at the discovery realised at once that the stone might be important.",
          "TRUE",
          "An officer with some education noticed that it carried inscriptions in three different scripts and understood at once that it might matter.",
          "An officer 'understood at once that it might matter'.",
        ),
        tfng(
          "The Rosetta Stone is the only surviving copy of the decree.",
          "FALSE",
          "Copies of the decree were set up in temples throughout Egypt, and other examples have since been found.",
          "'Other examples have since been found'.",
        ),
        tfng(
          "Before 1822, most scholars believed hieroglyphs represented ideas rather than sounds.",
          "TRUE",
          "Knowledge of hieroglyphs had died out in the fourth century CE, and for fourteen hundred years scholars had assumed that the signs were symbols standing for ideas rather than sounds — an assumption reinforced by a late Greek text that interpreted them mystically.",
          "Scholars 'assumed that the signs were symbols standing for ideas'.",
        ),
        tfng(
          "The stone was given to Britain as a gift by the Egyptian authorities.",
          "FALSE",
          "When British forces defeated the French in Egypt in 1801, the terms of surrender required the antiquities collected by the French expedition to be handed over, and the stone reached London the following year.",
          "It was handed over under 'the terms of surrender'.",
        ),
        tfng(
          "Young and Champollion collaborated closely on the decipherment.",
          "FALSE",
          "Decipherment took another twenty years and two men who never worked comfortably together.",
          "They 'never worked comfortably together'.",
        ),
        tfng(
          "The British Museum has agreed to return the stone to Egypt in the future.",
          "FALSE",
          "Egypt has repeatedly requested its return, and the museum has repeatedly declined.",
          "The museum 'has repeatedly declined'.",
        ),
      ],
    },
    {
      key: "t39-p2-sand",
      title: "The Shortage Nobody Expected",
      topic: "why the world is running short of usable sand",
      difficulty: 7,
      body: `A) After water, sand is the most heavily used material on Earth. Some fifty billion tonnes of it are dug out every year, most of it to make concrete, and the rest for glass, roads, silicon chips and the reclamation of land from the sea. Because it is cheap, heavy and everywhere, it has never been treated as a resource worth counting, and until recently almost no country kept proper records of how much was extracted or from where. The result is a shortage that arrived before anybody was measuring.

B) It is not a shortage of sand in general. The Sahara holds more sand than the construction industry could use in centuries, and it is useless for building. Wind-blown desert grains are rounded and polished, and cement will not grip them; concrete needs the sharp, angular particles produced by water, which come from riverbeds, floodplains, lakes and the sea floor. Those deposits are finite, they are concentrated in exactly the places people live, and they are being removed far faster than rivers can replace them. Geologist Dr Farida Osman puts the point simply. "We are mining a material that takes a mountain range and several million years to make," she says, "and we are doing it with a budget that assumes it is free."

C) Rivers pay the price first. Dredging lowers a riverbed, which steepens the flow, which erodes the banks and undercuts whatever is built on them; bridges have collapsed in several countries after the sediment around their foundations was taken away. A lowered bed also drops the water table on either side, drying wells and letting salt water travel further inland. Hydrologist Dr Vinh Nguyen has studied one of the world's great deltas, where extraction, upstream dams and rising seas act together. "The delta is starving," he says. "Less sediment arrives each year than is dug out, and a delta that is not being fed goes under."

D) Where demand is concentrated, the trade has turned criminal. Sand is bulky and low-value, so it is rarely worth transporting far, which means the pressure falls on whatever river happens to be near a growing city. In parts of South and South-East Asia, illegal extraction is run by organised groups who pay off inspectors, intimidate villagers and occasionally kill journalists and officials who interfere. Because the material is indistinguishable once it reaches a building site, prosecutions are rare.

E) Some governments have responded by banning exports, which has mostly moved the problem. When one country stopped selling sand to a neighbour that was enlarging its territory with it, the buyer simply bought from somewhere else, and the mining moved to a coast with weaker enforcement. Environmental lawyer Grace Achieng argues that export bans are the wrong instrument. "A ban tells you nothing about how much was taken or from where," she says. "What is needed is a licence, a measurement and a published figure, which is far less satisfying to announce."

F) There are substitutes, and they are further advanced than the public debate suggests. Crushed rock, known in the trade as manufactured sand, already supplies a substantial share of demand in several countries, and modern crushers can produce grains of the right shape. Concrete and demolition rubble can be washed, sorted and used again, which also solves a waste problem; some European cities now recycle the majority of their construction waste. Mine tailings and the ash left from burning coal can replace part of the cement or the aggregate. Materials engineer Dr Lars Petersen points out that the obstacle is rarely technical. "Recycled aggregate has to compete with a material that is dug out of a river at night and costs nothing," he says. "Fix that price and the engineering takes care of itself."

G) What has changed most recently is visibility. Satellite imagery now allows extraction sites to be identified and measured from orbit, and researchers have begun producing the first credible global estimates of how much sand is moving and where the damage is concentrated. International bodies have called for sand to be managed as a strategic resource, with monitoring, licensing and restrictions on river mining. None of that will reduce demand, which is driven by construction in fast-growing cities and shows no sign of falling. But it makes the argument a factual one, which is a necessary first step for a material that has been treated for a century as though it simply appeared.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why one enormous source of sand cannot be used",
          "B",
          "Wind-blown desert grains are rounded and polished, and cement will not grip them; concrete needs the sharp, angular particles produced by water, which come from riverbeds, floodplains, lakes and the sea floor.",
          "Paragraph B: desert grains are too rounded.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to structures failing because of extraction",
          "C",
          "Dredging lowers a riverbed, which steepens the flow, which erodes the banks and undercuts whatever is built on them; bridges have collapsed in several countries after the sediment around their foundations was taken away.",
          "Paragraph C: bridges have collapsed.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the observation that a restriction simply relocated the damage",
          "E",
          "When one country stopped selling sand to a neighbour that was enlarging its territory with it, the buyer simply bought from somewhere else, and the mining moved to a coast with weaker enforcement.",
          "Paragraph E: the mining moved elsewhere.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "examples of waste materials being used in place of new sand",
          "F",
          "Concrete and demolition rubble can be washed, sorted and used again, which also solves a waste problem; some European cities now recycle the majority of their construction waste.",
          "Paragraph F: rubble, tailings and ash.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "About fifty billion ______ of sand are extracted each year.",
          "tonnes",
          "Some fifty billion tonnes of it are dug out every year, most of it to make concrete, and the rest for glass, roads, silicon chips and the reclamation of land from the sea.",
          "'Some fifty billion tonnes of it are dug out every year'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Concrete requires ______ particles of the kind produced by water.",
          "angular",
          "Wind-blown desert grains are rounded and polished, and cement will not grip them; concrete needs the sharp, angular particles produced by water, which come from riverbeds, floodplains, lakes and the sea floor.",
          "Concrete needs 'sharp, angular particles'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "A lowered riverbed drops the ______ on either side of the river.",
          "water table",
          "A lowered bed also drops the water table on either side, drying wells and letting salt water travel further inland.",
          "It 'drops the water table on either side'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Crushed rock is known in the trade as ______ sand.",
          "manufactured",
          "Crushed rock, known in the trade as manufactured sand, already supplies a substantial share of demand in several countries, and modern crushers can produce grains of the right shape.",
          "It is 'known in the trade as manufactured sand'.",
        ),
        fromList(
          "matching_features",
          SAND_PEOPLE,
          "A material that took millions of years to form is priced as though it were free.",
          "Farida Osman",
          '"We are mining a material that takes a mountain range and several million years to make," she says, "and we are doing it with a budget that assumes it is free."',
          "Osman on the budget that 'assumes it is free'.",
        ),
        fromList(
          "matching_features",
          SAND_PEOPLE,
          "A major river delta is receiving less sediment than is taken from it.",
          "Vinh Nguyen",
          '"The delta is starving," he says. "Less sediment arrives each year than is dug out, and a delta that is not being fed goes under."',
          "Nguyen: 'The delta is starving.'",
        ),
        fromList(
          "matching_features",
          SAND_PEOPLE,
          "Measurement and licensing would achieve more than prohibition.",
          "Grace Achieng",
          '"What is needed is a licence, a measurement and a published figure, which is far less satisfying to announce."',
          "Achieng prefers licences and published figures.",
        ),
        fromList(
          "matching_features",
          SAND_PEOPLE,
          "Alternatives fail on price rather than on performance.",
          "Lars Petersen",
          '"Recycled aggregate has to compete with a material that is dug out of a river at night and costs nothing," he says. "Fix that price and the engineering takes care of itself."',
          "Petersen: 'Fix that price and the engineering takes care of itself.'",
        ),
        fromList(
          "matching_features",
          SAND_PEOPLE,
          "A prohibition reveals nothing about the quantities being removed.",
          "Grace Achieng",
          '"A ban tells you nothing about how much was taken or from where," she says.',
          "Achieng: 'A ban tells you nothing about how much was taken or from where.'",
        ),
      ],
    },
    {
      key: "t39-p3-spacing-effect",
      title: "The Best-Known Finding Nobody Uses",
      topic: "why spreading study out works better than concentrating it",
      difficulty: 8,
      body: `In the 1880s a German psychologist, working alone and using himself as his only subject, memorised thousands of nonsense syllables and recorded how quickly he forgot them. The resulting forgetting curve is one of the oldest quantitative findings in psychology, and buried in the same work is another that has proved even more durable: he learned material far more efficiently when his repetitions were spread over several days than when he repeated them one after another in a single sitting.

The spacing effect has been reproduced ever since, across ages, subjects, species and methods. It holds for vocabulary, mathematics, surgical technique, the names of faces and the classification of birds. It holds for material learned in a laboratory and for material learned in a classroom, in studies lasting an hour and in studies following students for years. Few results in the behavioural sciences have been tested so often or survived so completely.

The mechanism is still argued over, but the main accounts agree on the essential point: that some forgetting is useful. When a piece of information is retrieved just as it is beginning to slip away, the act of retrieval strengthens it considerably; when it is retrieved a second later, while it is still in mind, almost nothing is added. Cramming produces an impressive performance in the hour after studying and very little a week later, because each repetition arrives while the material is still available and therefore does no work.

This is bound up with a second finding of comparable strength. Testing yourself on material is a far more effective way of learning it than reading it again, even though rereading feels more productive. The two effects compound: retrieving at spaced intervals beats rereading in a block by a margin that in some classroom studies approaches a full grade. The practical recipe that follows is unfashionably simple — study a topic, leave it, come back and try to recall it without looking, repeat at widening intervals — and it costs nothing but planning.

Why, then, do students cram, and why do schools arrange their teaching in blocks? The answer appears to be that the experience of learning is an unreliable guide to learning. Rereading a chapter produces a comfortable sense of familiarity, and familiarity is easily mistaken for knowledge; struggling to recall something produces discomfort, and discomfort is easily mistaken for failure. When students are asked to predict how well they will perform, they consistently favour the methods that feel smooth over those that work, and they continue to do so after being shown their own results.

Institutions add their own obstacles. A syllabus is organised into units that are taught once and assessed at the end; a textbook devotes a chapter to a topic and then moves on; teachers are judged on progress through material rather than on retention of it. Spacing requires deliberately returning to material that has been officially covered, which looks like falling behind. Where it has been built into a curriculum — in some medical schools, in language teaching software, in a handful of school mathematics schemes — the results have been good, but each of those cases required rebuilding the schedule rather than adding a study tip.

There are limits worth stating. The optimal gap depends on how long the material has to last: for a test next week, a day or two between sessions; for knowledge that must survive a year, weeks. Expanding intervals are widely recommended, though the evidence that they beat evenly spaced ones is thinner than the recommendation suggests. Spacing does not replace understanding; a student who does not follow an explanation will not be helped by meeting it again at intervals. And most of the classroom research measures recall of specific content rather than the ability to use it in new situations, which is the outcome most teachers care about and the hardest to test.

None of that undermines the central claim. In a field that has spent a decade discovering that many of its famous results do not replicate, the spacing effect stands out as one that does, repeatedly and by large margins. That it remains largely unused in the institutions built for learning is a fact about how schools and universities are organised, and about how badly people judge their own learning, rather than a fact about the evidence.`,
      questions: [
        mcq(
          "What did the nineteenth-century experiments show, besides the forgetting curve?",
          [
            "that nonsense syllables are easier to learn than words",
            "that repetitions spread over days were more efficient than repetitions in one sitting",
            "that learning is fastest in the morning",
            "that a single subject cannot produce reliable data",
          ],
          "that repetitions spread over days were more efficient than repetitions in one sitting",
          "The resulting forgetting curve is one of the oldest quantitative findings in psychology, and buried in the same work is another that has proved even more durable: he learned material far more efficiently when his repetitions were spread over several days than when he repeated them one after another in a single sitting.",
          "Spread repetitions were 'far more efficient'.",
        ),
        mcq(
          "Why does cramming produce poor long-term results?",
          [
            "Students who cram are less motivated.",
            "The material is too difficult to absorb quickly.",
            "Each repetition arrives while the material is still in mind.",
            "Sleep is needed between repetitions.",
          ],
          "Each repetition arrives while the material is still in mind.",
          "Cramming produces an impressive performance in the hour after studying and very little a week later, because each repetition arrives while the material is still available and therefore does no work.",
          "Each repetition 'arrives while the material is still available and therefore does no work'.",
        ),
        mcq(
          "What does the writer say about students' judgements of their own learning?",
          [
            "They improve once students see their test results.",
            "They favour methods that feel easier, even after contrary evidence.",
            "They are accurate for mathematics but not for languages.",
            "They depend mainly on the teacher's feedback.",
          ],
          "They favour methods that feel easier, even after contrary evidence.",
          "When students are asked to predict how well they will perform, they consistently favour the methods that feel smooth over those that work, and they continue to do so after being shown their own results.",
          "They continue 'after being shown their own results'.",
        ),
        mcq(
          "Which limitation of the research does the writer point out?",
          [
            "It has never been tested outside laboratories.",
            "It applies only to young children.",
            "It measures recall of content more than the ability to apply it.",
            "It has not been replicated since the 1880s.",
          ],
          "It measures recall of content more than the ability to apply it.",
          "And most of the classroom research measures recall of specific content rather than the ability to use it in new situations, which is the outcome most teachers care about and the hardest to test.",
          "It measures recall 'rather than the ability to use it in new situations'.",
        ),
        fromList(
          "summary_completion",
          STUDY_BANK,
          "The 1880s work produced the famous forgetting ______.",
          "curve",
          "The resulting forgetting curve is one of the oldest quantitative findings in psychology, and buried in the same work is another that has proved even more durable: he learned material far more efficiently when his repetitions were spread over several days than when he repeated them one after another in a single sitting.",
          "'The resulting forgetting curve'.",
        ),
        fromList(
          "summary_completion",
          STUDY_BANK,
          "Learning improves when ______ are left between study sessions.",
          "gaps",
          "When a piece of information is retrieved just as it is beginning to slip away, the act of retrieval strengthens it considerably; when it is retrieved a second later, while it is still in mind, almost nothing is added.",
          "The gap is what allows the material to begin slipping away.",
        ),
        fromList(
          "summary_completion",
          STUDY_BANK,
          "______ practice — trying to recall without looking — beats rereading.",
          "Retrieval",
          "Testing yourself on material is a far more effective way of learning it than reading it again, even though rereading feels more productive.",
          "Self-testing is retrieval practice.",
        ),
        fromList(
          "summary_completion",
          STUDY_BANK,
          "Rereading creates a comfortable ______ that is mistaken for knowledge.",
          "fluency",
          "Rereading a chapter produces a comfortable sense of familiarity, and familiarity is easily mistaken for knowledge; struggling to recall something produces discomfort, and discomfort is easily mistaken for failure.",
          "The smooth feeling of rereading — its fluency — is mistaken for knowledge.",
        ),
        fromList(
          "summary_completion",
          STUDY_BANK,
          "A ______ organised into units discourages returning to old material.",
          "syllabus",
          "A syllabus is organised into units that are taught once and assessed at the end; a textbook devotes a chapter to a topic and then moves on; teachers are judged on progress through material rather than on retention of it.",
          "'A syllabus is organised into units that are taught once'.",
        ),
        fromList(
          "summary_completion",
          STUDY_BANK,
          "Students prefer ______ because the results feel good immediately afterwards.",
          "cramming",
          "Cramming produces an impressive performance in the hour after studying and very little a week later, because each repetition arrives while the material is still available and therefore does no work.",
          "Cramming gives 'an impressive performance in the hour after studying'.",
        ),
        ynng(
          "The writer considers the spacing effect to be unusually well established.",
          "YES",
          "Few results in the behavioural sciences have been tested so often or survived so completely.",
          "'Few results… have been tested so often or survived so completely'.",
        ),
        ynng(
          "The writer accepts that expanding intervals are clearly better than equal ones.",
          "NO",
          "Expanding intervals are widely recommended, though the evidence that they beat evenly spaced ones is thinner than the recommendation suggests.",
          "The evidence 'is thinner than the recommendation suggests'.",
        ),
        ynng(
          "The writer believes spacing can compensate for a failure to understand material.",
          "NO",
          "Spacing does not replace understanding; a student who does not follow an explanation will not be helped by meeting it again at intervals.",
          "'Spacing does not replace understanding'.",
        ),
        ynng(
          "The writer thinks teacher training is the main obstacle to using spacing in schools.",
          "NOT GIVEN",
          "",
          "Curriculum structure and students' judgement are discussed; teacher training is not.",
        ),
      ],
    },
  ],
};
