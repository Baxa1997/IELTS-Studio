import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of medicine · notes box ----------------------------

const PUMP_NOTES = {
  title: "The cases that did not fit",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · fisheries enforcement · people and a word bank ------------

const VESSEL_PEOPLE = ["Mireille Kabongo", "Sten Lindqvist", "Farida Nasser", "Diego Aranda"];
const VESSEL_BANK = [
  "transponder",
  "zigzag",
  "gaps",
  "lamps",
  "radar",
  "transhipment",
  "port",
  "flag",
  "insurance",
];

// ---- Passage 3 · learning research · lettered paragraphs -------------------

const MEMORY_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const MEMORY_ENDINGS = [
  "although the same total amount of study time is spent either way.",
  "because trying and failing to recall something feels like getting nowhere.",
  "which is why an item answered wrongly is shown again sooner.",
  "since the labels survive the cutting and the technique does not.",
  "because a returning topic looks like a failure to make progress.",
  "which the writer thinks a school could act on without spending anything.",
  "even though the mechanism behind the effect is still argued about.",
];

export const TEST_81: CuratedTest = {
  key: "full-test-81",
  targetBand: 6,
  passages: [
    {
      key: "t81-p1-broad-street-pump",
      title: "The Map That Found the Pump",
      topic: "how an outbreak was traced to a water supply before anyone could see a germ",
      difficulty: 5,
      body: `In the late summer of 1854 a severe outbreak of cholera began in a small district of London. Over about ten days several hundred people in a few streets died. The outbreak is now the most famous in the history of medicine, not because of its size but because of what one physician did with the information about where the dead had lived.

The accepted explanation for cholera at the time was that it travelled through bad air. The theory was reasonable on the evidence available: the disease was worst in crowded, filthy, foul-smelling districts, and it was hard to see what else those districts had in common. It also had a practical consequence, which was that efforts to control the disease concentrated on removing smells.

John Snow had argued for several years that cholera was carried in water, and had published the argument without persuading many people. The disease attacked the gut rather than the lungs, which was difficult to explain if it was inhaled; and it could pass through a household without affecting the person who nursed the sick, which was difficult to explain if it was in the air of the room. What he lacked was a demonstration.

The outbreak gave him one. He obtained the addresses of the dead from the registrar's records and marked each death on a map of the district as a small bar. The marks clustered tightly around a public water pump in Broad Street, and thinned with distance from it in every direction. Most households in the area had no water supply of their own and carried water from a public pump, and the pump nearest to a house was usually the one used.

The pattern was strong but not by itself conclusive, because a cluster of deaths around a point is also what bad air from a single source would produce. What made the argument work was the exceptions, and Snow went to find them. A workhouse in the middle of the affected area, with more than five hundred inmates, had almost no cases; it had its own well. A brewery nearby had none; the workers drank beer and it also had a well. A woman who had died in Hampstead, several miles away and quite outside the outbreak, turned out to have had water carried to her from Broad Street because she preferred the taste, and her niece, who visited and drank it, died too.

Each of those cases is inconsistent with air and consistent with water. That is the structure of the argument, and it is why the map is remembered: the cluster suggested the explanation and the exceptions tested it.

Snow persuaded the local parish authority to remove the pump handle, which it did. The outbreak was already declining by then, for reasons that had nothing to do with the pump, and he was careful in his own account not to claim that the removal had ended it. The handle was replaced a few months later, once the emergency had passed and the official inquiry had rejected his explanation.

He did not live to see the argument accepted. The water theory was resisted for another decade at least, and the formal acceptance came only after the organism responsible was identified under a microscope in the 1880s. The reason for the resistance was not stupidity: Snow had no mechanism to offer, no visible agent, and a theory that required respectable people to believe their drinking water was contaminated with sewage.

The most interesting detail was established after his death. The pump had been sunk within a few feet of an old cesspit, and the brick lining of the pit had decayed. An infant in the house above had been ill with cholera before the outbreak began, and the water used to wash her clothing had been emptied into the pit. The source of the epidemic was almost certainly one child.

What the episode is usually held up to demonstrate is the power of plotting data on a map, which is fair enough. What it demonstrates better is something less quotable: that a pattern cannot distinguish between two explanations that both predict it, and that the work of choosing between them is done by the cases that do not fit.`,
      questions: [
        tfng(
          "There was no evidence at all for the bad-air explanation.",
          "FALSE",
          "The theory was reasonable on the evidence available: the disease was worst in crowded, filthy, foul-smelling districts, and it was hard to see what else those districts had in common.",
          "The theory 'was reasonable on the evidence available'.",
        ),
        tfng(
          "Snow had published his water argument before this outbreak.",
          "TRUE",
          "John Snow had argued for several years that cholera was carried in water, and had published the argument without persuading many people.",
          "He had already 'published the argument'.",
        ),
        tfng(
          "The workhouse inside the affected district had many cases.",
          "FALSE",
          "A workhouse in the middle of the affected area, with more than five hundred inmates, had almost no cases; it had its own well.",
          "It 'had almost no cases'.",
        ),
        tfng(
          "Snow avoided claiming that removing the handle had ended the outbreak.",
          "TRUE",
          "The outbreak was already declining by then, for reasons that had nothing to do with the pump, and he was careful in his own account not to claim that the removal had ended it.",
          "He was careful 'not to claim that the removal had ended it'.",
        ),
        tfng(
          "The official inquiry accepted Snow's explanation.",
          "FALSE",
          "The handle was replaced a few months later, once the emergency had passed and the official inquiry had rejected his explanation.",
          "The inquiry 'rejected his explanation'.",
        ),
        tfng(
          "The water theory was formally accepted only after the organism was seen.",
          "TRUE",
          "The water theory was resisted for another decade at least, and the formal acceptance came only after the organism responsible was identified under a microscope in the 1880s.",
          "Acceptance followed the microscope work.",
        ),
        tfng(
          "Snow was paid by the parish for his investigation.",
          "NOT GIVEN",
          "",
          "The passage says he persuaded the parish but nothing about payment.",
        ),
        noteLine(
          PUMP_NOTES,
          null,
          "A ______ with over five hundred inmates had almost no cases",
          "workhouse",
          "A workhouse in the middle of the affected area, with more than five hundred inmates, had almost no cases; it had its own well.",
          "The workhouse had its own well.",
          { before: [{ text: "Each exception told against the air:", indent: 0 }] },
        ),
        noteLine(
          PUMP_NOTES,
          null,
          "A nearby ______ had none, and its workers drank beer",
          "brewery",
          "A brewery nearby had none; the workers drank beer and it also had a well.",
          "The brewery had no cases.",
        ),
        noteLine(
          PUMP_NOTES,
          null,
          "A woman in ______ died after having the water carried to her",
          "Hampstead",
          "A woman who had died in Hampstead, several miles away and quite outside the outbreak, turned out to have had water carried to her from Broad Street because she preferred the taste, and her niece, who visited and drank it, died too.",
          "She lived in Hampstead, far outside the district.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Each death was marked on the map as a small ______.",
          "bar",
          "He obtained the addresses of the dead from the registrar's records and marked each death on a map of the district as a small bar.",
          "Each death was marked 'as a small bar'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The pump had been sunk a few feet from an old ______.",
          "cesspit",
          "The pump had been sunk within a few feet of an old cesspit, and the brick lining of the pit had decayed.",
          "It was 'within a few feet of an old cesspit'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Choosing between explanations is done by the cases that do not ______.",
          "fit",
          "What it demonstrates better is something less quotable: that a pattern cannot distinguish between two explanations that both predict it, and that the work of choosing between them is done by the cases that do not fit.",
          "The work is done by 'the cases that do not fit'.",
        ),
      ],
    },
    {
      key: "t81-p2-tracking-fishing-vessels",
      title: "Watching the Fleet from Orbit",
      topic: "how satellite tracking made illegal fishing visible and what it still cannot do",
      difficulty: 6,
      body: `Roughly a fifth of the fish caught in the world is taken illegally, and until recently almost nothing could be done about it, because nobody knew where the vessels were. The ocean is very large, patrol boats are few, and a ship that does not want to be found has historically had no difficulty.

Three developments have changed that. The first is a system that was never intended for the purpose. Since 2002 large vessels have been required to carry a transponder that broadcasts their identity, position, course and speed to prevent collisions. The signal is unencrypted and can be received from orbit, and there are now satellites doing nothing else. Mireille Kabongo, who works on vessel tracking, points out that this produces a record of where almost every large ship in the world has been, at minute-by-minute resolution, available to anybody — which was not a consequence anybody considered when the requirement was written.

Fishing is identifiable from the track alone. A cargo ship crosses the ocean in a straight line at constant speed; a trawler moves slowly in a zigzag, a longliner steams out and returns along the same path, a purse seiner circles. Software trained on known vessels classifies the activity from the shape of the track with reasonable accuracy, which means a map of global fishing effort can be produced without anybody reporting anything.

The obvious countermeasure is to switch the transponder off, and this is where the second development matters. Sten Lindqvist, who analyses these gaps, explains that a vessel going dark is now itself a signal: the position, duration and location of the gap are recorded, and a gap that begins at the edge of a protected area and ends on the other side of it is strong evidence of something. He is careful about the limits — transponders fail, coverage is patchy in some regions, and a gap is not proof — but notes that the pattern of gaps across a whole fleet is much harder to explain innocently than any single one.

Other instruments fill in what the transponders miss. Satellites that detect light at night can see the lamps a squid vessel uses to attract its catch, and those lamps are bright enough to appear from orbit. Radar satellites detect a metal hull regardless of weather, darkness or whether anything is being broadcast. Farida Nasser, who combines these sources, describes the working method as looking for disagreement: a radar return with no transponder signal in the same place is a vessel that does not wish to be identified, and that comparison, rather than any single sensor, is what generates a list worth acting on.

The activity all this has made visible is transhipment. A fishing vessel that never enters a port cannot be inspected, and a refrigerated cargo ship that meets it at sea and takes its catch allows the fish to enter the market with no record of where it was caught. The tracks make these meetings obvious — two vessels stationary alongside each other in open water for several hours — and the number of them turns out to be very large. Legal transhipment exists and is licensed; the point is that it was previously indistinguishable from the other kind.

Enforcement remains the weak part of the chain. Diego Aranda, who has worked with fisheries authorities, is blunt that detection has outrun the capacity to act: an agency may know exactly which vessel fished where and still have no patrol boat within a thousand kilometres, no jurisdiction over a foreign flag on the high seas, and no court that will hear the case. What has worked better is using the data at the port and at the market — refusing to land a catch, refusing to supply fuel, refusing to insure a vessel on a published list — because those are decisions somebody in a specific country can be made to take.

The change in who holds the information is arguably the largest effect. The tracks are public, which means a journalist, a supermarket's compliance officer or a small coastal state with no navy can all establish where a vessel has been, and a considerable amount of enforcement now happens through publication and commercial pressure rather than through arrest. That is a weaker instrument than a patrol boat, and it can be applied from anywhere, which in this particular ocean turns out to matter more.`,
      questions: [
        fromList(
          "matching_features",
          VESSEL_PEOPLE,
          "A rule written for safety produced a public record nobody intended.",
          "Mireille Kabongo",
          "Mireille Kabongo, who works on vessel tracking, points out that this produces a record of where almost every large ship in the world has been, at minute-by-minute resolution, available to anybody — which was not a consequence anybody considered when the requirement was written.",
          "Kabongo notes the unintended record.",
        ),
        fromList(
          "matching_features",
          VESSEL_PEOPLE,
          "Switching the equipment off has itself become informative.",
          "Sten Lindqvist",
          "Sten Lindqvist, who analyses these gaps, explains that a vessel going dark is now itself a signal: the position, duration and location of the gap are recorded, and a gap that begins at the edge of a protected area and ends on the other side of it is strong evidence of something.",
          "Lindqvist reads the silences.",
        ),
        fromList(
          "matching_features",
          VESSEL_PEOPLE,
          "The method is to look for disagreement between two sources.",
          "Farida Nasser",
          "Farida Nasser, who combines these sources, describes the working method as looking for disagreement: a radar return with no transponder signal in the same place is a vessel that does not wish to be identified, and that comparison, rather than any single sensor, is what generates a list worth acting on.",
          "Nasser compares the sensors against each other.",
        ),
        fromList(
          "matching_features",
          VESSEL_PEOPLE,
          "Detection has run ahead of any ability to act on it.",
          "Diego Aranda",
          "Diego Aranda, who has worked with fisheries authorities, is blunt that detection has outrun the capacity to act: an agency may know exactly which vessel fished where and still have no patrol boat within a thousand kilometres, no jurisdiction over a foreign flag on the high seas, and no court that will hear the case.",
          "Aranda describes the enforcement gap.",
        ),
        fromList(
          "summary_completion",
          VESSEL_BANK,
          "Large vessels must carry a ______ broadcasting their position.",
          "transponder",
          "Since 2002 large vessels have been required to carry a transponder that broadcasts their identity, position, course and speed to prevent collisions.",
          "The transponder broadcasts the position.",
        ),
        fromList(
          "summary_completion",
          VESSEL_BANK,
          "A trawler is recognisable because it moves in a ______.",
          "zigzag",
          "A cargo ship crosses the ocean in a straight line at constant speed; a trawler moves slowly in a zigzag, a longliner steams out and returns along the same path, a purse seiner circles.",
          "A trawler 'moves slowly in a zigzag'.",
        ),
        fromList(
          "summary_completion",
          VESSEL_BANK,
          "Night-light satellites can see the ______ that attract squid.",
          "lamps",
          "Satellites that detect light at night can see the lamps a squid vessel uses to attract its catch, and those lamps are bright enough to appear from orbit.",
          "The lamps show from orbit.",
        ),
        fromList(
          "summary_completion",
          VESSEL_BANK,
          "______ satellites find a hull in any weather or darkness.",
          "radar",
          "Radar satellites detect a metal hull regardless of weather, darkness or whether anything is being broadcast.",
          "Radar works regardless of conditions.",
        ),
        fromList(
          "summary_completion",
          VESSEL_BANK,
          "Passing a catch between ships at sea is called ______.",
          "transhipment",
          "The activity all this has made visible is transhipment.",
          "That activity is transhipment.",
        ),
        mcq(
          "What was the transponder requirement originally introduced for?",
          [
            "Preventing collisions between ships",
            "Monitoring fishing activity",
            "Recording the value of cargo",
            "Reporting the weather at sea",
          ],
          "Preventing collisions between ships",
          "Since 2002 large vessels have been required to carry a transponder that broadcasts their identity, position, course and speed to prevent collisions.",
          "It was required 'to prevent collisions'.",
        ),
        mcq(
          "What makes a break in transmission suspicious?",
          [
            "Where it starts and where it ends",
            "Its duration on its own",
            "The age of the vessel",
            "The weather at the time",
          ],
          "Where it starts and where it ends",
          "Sten Lindqvist, who analyses these gaps, explains that a vessel going dark is now itself a signal: the position, duration and location of the gap are recorded, and a gap that begins at the edge of a protected area and ends on the other side of it is strong evidence of something.",
          "A gap crossing a protected area is telling.",
        ),
        mcq(
          "Why does transhipment matter?",
          [
            "Fish reaches the market with no record of origin",
            "It spoils the refrigerated cargo",
            "It happens only inside protected areas",
            "It is against the law everywhere",
          ],
          "Fish reaches the market with no record of origin",
          "A fishing vessel that never enters a port cannot be inspected, and a refrigerated cargo ship that meets it at sea and takes its catch allows the fish to enter the market with no record of where it was caught.",
          "There is 'no record of where it was caught'.",
        ),
        mcq(
          "Which responses have proved the most effective?",
          [
            "Refusing services at the port and in the market",
            "Sending patrol boats to intercept",
            "Prosecuting foreign crews at sea",
            "Requiring encrypted transponders",
          ],
          "Refusing services at the port and in the market",
          "What has worked better is using the data at the port and at the market — refusing to land a catch, refusing to supply fuel, refusing to insure a vessel on a published list — because those are decisions somebody in a specific country can be made to take.",
          "Refusals at the port and market work better.",
        ),
      ],
    },
    {
      key: "t81-p3-spacing-and-retrieval",
      title: "The Two Things Known About Remembering",
      topic: "why two settled findings about memory have changed so little in practice",
      difficulty: 7,
      body: `A) Two findings about memory are as well established as anything in psychology, and both are ignored by almost every student and most schools. The first is that information reviewed at increasing intervals is retained far longer than the same information reviewed in one sitting. The second is that the act of retrieving something from memory strengthens it more than re-reading does. They have been replicated for over a century, they are not in dispute, and the practices they imply remain the habit of a small minority of the people who would benefit from them.

B) The interval effect was described in the 1880s and has been measured in every decade since. The same total study time, distributed across several days rather than concentrated in one, produces substantially better retention at every delay that has been tested, and the advantage grows as the delay grows. There is no serious counter-evidence. The mechanism is argued about — whether the second encounter is harder and therefore more effortful, or whether it adds a second context to the trace — but the effect itself is a fact about how memory works and not a claim about study technique.

C) The retrieval effect is the more surprising of the two. Given the same time, a group that reads a passage twice performs worse on a later test than a group that reads it once and then tries to recall it. The effect is large, and it has an awkward companion finding: subjects in the re-reading condition consistently predict that they will do better, and the difference between prediction and performance does not diminish when they are told about it. People cannot feel retrieval working, and it feels like failure while it is happening, because it involves not being able to remember something.

D) The obvious application is a schedule that tests rather than reviews, and software has existed for decades that computes one: an item answered correctly is shown again after a longer gap, an item answered wrongly comes back sooner. The interval is adjusted for each item, so time goes where the failures are. For a body of material consisting of many separable facts — vocabulary, anatomy, the elements, case law citations — the method works about as well as the research predicts, and in the fields where memorising a large corpus is unavoidable it has become standard practice without any institutional encouragement at all.

E) Where I part company with the enthusiasts is on what happens outside that case. A great deal of what is worth learning is not a set of separable facts, and the method requires material to be cut into items with a definite answer. Cutting an argument, a proof, a piece of technique or a historical interpretation into such items destroys most of what makes it worth knowing, and the people who try report that they end up memorising the labels for things they cannot do. That is not an objection to the research. It is an objection to the assumption that anything worth learning can be put on a card.

F) The institutional failure is nonetheless real and is worth naming precisely. A school timetable is built around covering a topic once, in a block, and moving on, which is the arrangement the evidence most directly contradicts. Distributing the same content across a term costs nothing and requires only a rearrangement, and the reason it does not happen is that a teacher's progress is measured in topics completed and a returning topic looks like a failure to advance. The obstacle is an accounting convention, not a pedagogical belief.

G) What I would conclude is that the two findings are worth acting on and that the current way of promoting them is counterproductive. They are presented as a productivity technique, complete with software, streaks and daily counts, which attracts the people who were going to study anyway and repels everybody else. The underlying claim is much plainer: you will forget most of what you learn today unless you try to recall it a few times over the following weeks, and trying to recall it is the part that works. That sentence is free, needs no application, and is what a school could act on next term.`,
      questions: [
        fromList(
          "matching_information",
          MEMORY_PARAGRAPHS,
          "a finding that people misjudge which method is serving them better",
          "C",
          "The effect is large, and it has an awkward companion finding: subjects in the re-reading condition consistently predict that they will do better, and the difference between prediction and performance does not diminish when they are told about it.",
          "Paragraph C reports the misjudgement.",
        ),
        fromList(
          "matching_information",
          MEMORY_PARAGRAPHS,
          "how a scheduling program decides when to show an item again",
          "D",
          "The obvious application is a schedule that tests rather than reviews, and software has existed for decades that computes one: an item answered correctly is shown again after a longer gap, an item answered wrongly comes back sooner.",
          "Paragraph D describes the schedule.",
        ),
        fromList(
          "matching_information",
          MEMORY_PARAGRAPHS,
          "the reason schools do not redistribute their content",
          "F",
          "Distributing the same content across a term costs nothing and requires only a rearrangement, and the reason it does not happen is that a teacher's progress is measured in topics completed and a returning topic looks like a failure to advance.",
          "Paragraph F names the accounting obstacle.",
        ),
        fromList(
          "matching_information",
          MEMORY_PARAGRAPHS,
          "a dispute about the mechanism behind one of the effects",
          "B",
          "The mechanism is argued about — whether the second encounter is harder and therefore more effortful, or whether it adds a second context to the trace — but the effect itself is a fact about how memory works and not a claim about study technique.",
          "Paragraph B sets out the two accounts.",
        ),
        fromList(
          "matching_information",
          MEMORY_PARAGRAPHS,
          "what happens when complex material is cut into items",
          "E",
          "Cutting an argument, a proof, a piece of technique or a historical interpretation into such items destroys most of what makes it worth knowing, and the people who try report that they end up memorising the labels for things they cannot do.",
          "Paragraph E describes what the cutting destroys.",
        ),
        ynng(
          "The writer thinks the interval effect is still scientifically disputed.",
          "NO",
          "There is no serious counter-evidence.",
          "'There is no serious counter-evidence'.",
        ),
        ynng(
          "The writer accepts that the method suits vocabulary and similar material.",
          "YES",
          "For a body of material consisting of many separable facts — vocabulary, anatomy, the elements, case law citations — the method works about as well as the research predicts, and in the fields where memorising a large corpus is unavoidable it has become standard practice without any institutional encouragement at all.",
          "It 'works about as well as the research predicts'.",
        ),
        ynng(
          "The writer believes schools resist redistribution because they doubt the evidence.",
          "NO",
          "The obstacle is an accounting convention, not a pedagogical belief.",
          "It is 'not a pedagogical belief'.",
        ),
        ynng(
          "The writer thinks presenting the findings as a productivity system is unhelpful.",
          "YES",
          "They are presented as a productivity technique, complete with software, streaks and daily counts, which attracts the people who were going to study anyway and repels everybody else.",
          "It 'repels everybody else'.",
        ),
        fromList(
          "matching_sentence_endings",
          MEMORY_ENDINGS,
          "Spreading revision over several days beats concentrating it,",
          "although the same total amount of study time is spent either way.",
          "The same total study time, distributed across several days rather than concentrated in one, produces substantially better retention at every delay that has been tested, and the advantage grows as the delay grows.",
          "The total time is the same.",
        ),
        fromList(
          "matching_sentence_endings",
          MEMORY_ENDINGS,
          "Students expect re-reading to serve them better than testing does,",
          "because trying and failing to recall something feels like getting nowhere.",
          "People cannot feel retrieval working, and it feels like failure while it is happening, because it involves not being able to remember something.",
          "Retrieval feels like failure.",
        ),
        fromList(
          "matching_sentence_endings",
          MEMORY_ENDINGS,
          "A program directs the effort towards whatever is being failed,",
          "which is why an item answered wrongly is shown again sooner.",
          "The interval is adjusted for each item, so time goes where the failures are.",
          "Time goes where the failures are.",
        ),
        fromList(
          "matching_sentence_endings",
          MEMORY_ENDINGS,
          "Complex material does not survive being cut into items,",
          "since the labels survive the cutting and the technique does not.",
          "Cutting an argument, a proof, a piece of technique or a historical interpretation into such items destroys most of what makes it worth knowing, and the people who try report that they end up memorising the labels for things they cannot do.",
          "The labels remain and the ability does not.",
        ),
        fromList(
          "matching_sentence_endings",
          MEMORY_ENDINGS,
          "Timetables are not rearranged for a reason unrelated to learning,",
          "because a returning topic looks like a failure to make progress.",
          "Distributing the same content across a term costs nothing and requires only a rearrangement, and the reason it does not happen is that a teacher's progress is measured in topics completed and a returning topic looks like a failure to advance.",
          "Progress is counted in topics completed.",
        ),
      ],
    },
  ],
};
