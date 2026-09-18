import { fromList, gapFill, mcq, pickTwo, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 2 · 2026 trend · lettered paragraphs, word bank, choose TWO ----

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const DEBRIS_BANK = [
  "collisions",
  "fragments",
  "speed",
  "magnet",
  "harpoon",
  "fuel",
  "cascade",
  "insurance",
  "owner",
  "atmosphere",
];
const DEBRIS_STEM = "Which TWO methods of removing debris have actually been flown in orbit?";
const DEBRIS_METHODS = [
  "a satellite that captured a target using a magnet",
  "a spacecraft that fired a net at a test object",
  "a ground-based laser that pushed debris into a lower orbit",
  "a robotic arm that welded two satellites together",
  "a balloon inflated around a dead satellite to slow it down",
];

// ---- Passage 3 · research debate · sentence endings ------------------------

const TIME_ENDINGS = [
  "because the brain records fewer new details of a familiar routine.",
  "when an experience is unfamiliar and full of new information.",
  "because children have faster heartbeats than adults.",
  "when people are asked to estimate a period while it is still running.",
  "because the body contains a single clock in the brainstem.",
  "when a person is completely absorbed in a task.",
];

export const TEST_36: CuratedTest = {
  key: "full-test-36",
  targetBand: 6,
  passages: [
    {
      key: "t36-p1-braille",
      title: "Reading with the Fingers",
      topic: "how Louis Braille devised a writing system for blind readers",
      difficulty: 5,
      body: `Louis Braille was three years old when he injured his eye with an awl in his father's leather workshop in a village east of Paris. The wound became infected, the infection spread to the other eye, and by the age of five he was completely blind. He was an intelligent child, and the local priest and schoolmaster arranged for him to attend the village school, where he learned by listening. At ten he won a place at the Royal Institute for Blind Youth in Paris, one of the first schools of its kind in the world.

Reading at the Institute was a slow business. Its founder had developed a method in which ordinary letters were pressed into thick paper from behind, so that pupils could trace the raised shapes with their fingers. The books were enormous and extremely heavy, each one taking months to produce, and the library contained only fourteen of them. Worse, the system allowed pupils to read but gave them no way to write: a blind student could follow a line of embossed letters, but could not form them.

The idea that changed this came from outside the school. In 1821 a retired army officer named Charles Barbier visited the Institute to demonstrate a code he had devised, in which sounds were represented by patterns of raised dots arranged in a grid twelve dots high. Barbier had intended it for passing orders between soldiers at night without a lamp. The pupils found it easier to feel than embossed letters, because a fingertip could detect a dot instantly, but the cells were too tall to be read without moving the finger up and down, and the system recorded sounds rather than spelling, so it could not represent punctuation, numbers or the spelling of a word.

Braille, then twelve years old, set about improving it. He reduced the cell to six dots, arranged in two columns of three, small enough to sit under a single fingertip. Six dots, each either raised or flat, give sixty-three possible patterns besides the empty cell — enough for the alphabet, accented letters, punctuation and a set of contractions. He also devised a way of writing it: a metal guide with rows of rectangular windows, in which the writer pressed dots into the back of the paper with a pointed stylus, working from right to left so that the dots would read from left to right when the sheet was turned over. He published the system in 1829, when he was twenty, and revised it a few years later.

Adoption was slow and grudging. Braille became a teacher at the Institute and his pupils used his code among themselves, but the school's directors were unenthusiastic, partly because sighted teachers could not read it at a glance. One director had the existing books burned and the system forbidden, and the pupils went on using it in secret. It was formally accepted at the Institute in 1854, two years after Braille's death from tuberculosis at the age of forty-three.

Once accepted, it spread quickly, and its structure turned out to be well suited to languages far beyond French. Because the six-dot cell is a general container rather than a set of letter shapes, versions exist for scripts as different as Arabic, Chinese, Hindi and Greek, as well as for mathematics, chemistry and music. A separate international conference in 1878 agreed to standardise the assignment of letters, ending a period in which competing dot systems were in use in different countries.

The code has survived every technology that was expected to replace it. Recorded books, screen readers and synthetic speech are all valuable, and all of them are listening rather than reading: research on blind children consistently finds that those who learn braille spell better, punctuate better and are more likely to be employed than those who rely on audio alone. Refreshable displays, in which small pins rise and fall under a row of cells to show text from a computer, have brought the system to electronic documents.

Two hundred years after a boy at a Paris school shortened a soldiers' code by half, the same six dots are pressed into medicine packets, lift buttons and banknotes. It remains one of the few inventions that a twelve-year-old has given to the world and that the world has kept.`,
      questions: [
        tfng(
          "Braille lost the sight of both eyes as a result of one accident.",
          "TRUE",
          "The wound became infected, the infection spread to the other eye, and by the age of five he was completely blind.",
          "The infection 'spread to the other eye'.",
        ),
        tfng(
          "The Royal Institute's library contained only a small number of books.",
          "TRUE",
          "The books were enormous and extremely heavy, each one taking months to produce, and the library contained only fourteen of them.",
          "It 'contained only fourteen of them'.",
        ),
        tfng(
          "The embossed-letter system allowed pupils to write as well as read.",
          "FALSE",
          "Worse, the system allowed pupils to read but gave them no way to write: a blind student could follow a line of embossed letters, but could not form them.",
          "It 'gave them no way to write'.",
        ),
        tfng(
          "Barbier designed his code for use by blind readers.",
          "FALSE",
          "Barbier had intended it for passing orders between soldiers at night without a lamp.",
          "It was intended for soldiers at night.",
        ),
        tfng(
          "Braille's cell can represent more than sixty different patterns.",
          "TRUE",
          "Six dots, each either raised or flat, give sixty-three possible patterns besides the empty cell — enough for the alphabet, accented letters, punctuation and a set of contractions.",
          "There are 'sixty-three possible patterns'.",
        ),
        tfng(
          "Braille's system was officially adopted by the Institute during his lifetime.",
          "FALSE",
          "It was formally accepted at the Institute in 1854, two years after Braille's death from tuberculosis at the age of forty-three.",
          "Acceptance came 'two years after Braille's death'.",
        ),
        tfng(
          "More blind children learn braille today than fifty years ago.",
          "NOT GIVEN",
          "",
          "The passage discusses braille's value, but gives no figures over time.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Braille was blinded by an accident with an ______ in his father's workshop.",
          "awl",
          "Louis Braille was three years old when he injured his eye with an awl in his father's leather workshop in a village east of Paris.",
          "He injured his eye 'with an awl'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In the older method, ordinary letters were pressed into thick ______ from behind.",
          "paper",
          "Its founder had developed a method in which ordinary letters were pressed into thick paper from behind, so that pupils could trace the raised shapes with their fingers.",
          "Letters were pressed into 'thick paper from behind'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Barbier's cells were too ______ to be read without moving the finger.",
          "tall",
          "The pupils found it easier to feel than embossed letters, because a fingertip could detect a dot instantly, but the cells were too tall to be read without moving the finger up and down, and the system recorded sounds rather than spelling, so it could not represent punctuation, numbers or the spelling of a word.",
          "The cells were 'too tall'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Braille wrote his dots using a pointed ______ and a metal guide.",
          "stylus",
          "He also devised a way of writing it: a metal guide with rows of rectangular windows, in which the writer pressed dots into the back of the paper with a pointed stylus, working from right to left so that the dots would read from left to right when the sheet was turned over.",
          "He pressed dots 'with a pointed stylus'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "One director of the Institute had the books ______ and the code forbidden.",
          "burned",
          "One director had the existing books burned and the system forbidden, and the pupils went on using it in secret.",
          "He 'had the existing books burned'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "On a refreshable display, small ______ rise and fall to form the cells.",
          "pins",
          "Refreshable displays, in which small pins rise and fall under a row of cells to show text from a computer, have brought the system to electronic documents.",
          "'Small pins rise and fall'.",
        ),
      ],
    },
    {
      key: "t36-p2-space-debris",
      title: "The Crowded Orbit",
      topic: "the growing problem of debris in orbit around the Earth",
      difficulty: 6,
      body: `A) There are, by the most careful estimates, some forty thousand objects larger than a coffee cup circling the Earth, of which only a small minority are working satellites. The rest is wreckage: spent rocket stages, dead spacecraft, dropped tools, flakes of paint and the shattered remains of things that have already hit each other. Below ten centimetres, where radar can no longer track individual pieces reliably, the count runs into the millions. None of it would matter if it were not moving so fast.

B) In low orbit, objects travel at around eight kilometres a second, and two of them meeting head-on close at twice that. At such speeds the ordinary intuitions of impact break down: a fleck of paint can crater a window, a bolt can pass through a pressurised module, and a collision between two intact satellites releases thousands of new fragments, each one a projectile in its own right. Energy, not size, is what makes the problem, and there is a great deal of energy in a small object moving at fifteen kilometres a second.

C) The danger was described long before it became visible. In 1978 a scientist at the American space agency argued that above a certain density of objects, collisions would begin to generate debris faster than it could fall away, producing a slow cascade in which each smash made the next one more likely. Two events since have made the warning concrete: a country's destruction of one of its own weather satellites in a weapons test in 2007, which created thousands of trackable pieces in a heavily used orbit, and the accidental collision of an American and a Russian satellite in 2009. Between them, those two events produced a significant share of everything now being tracked.

D) Traffic has increased enormously since. Reusable rockets have cut the cost of launch, and constellations of small communications satellites, numbering in the thousands, now occupy the lower orbits. One constellation alone now holds more working spacecraft than the whole world operated a decade ago, and several rival systems are being assembled. Tracking stations issue thousands of warnings each week about objects expected to pass close to one another, the great majority of which turn out to be harmless. Operators of these constellations perform automated avoidance manoeuvres regularly, and the International Space Station has repeatedly moved to dodge fragments. Each manoeuvre spends fuel, and fuel determines how long a satellite can work.

E) Preventing new debris is easier than clearing old, and most of the effort goes there. Modern designs vent unused propellant and discharge batteries at the end of a mission, so that nothing is left to explode; operators are increasingly required to bring a satellite down within five years of the end of its working life, rather than the twenty-five once considered acceptable. Satellites in low orbit can be dropped into the atmosphere to burn up; those much higher are pushed into a graveyard orbit instead, since bringing them down would cost more fuel than the mission could carry.

F) Removing what is already there has moved from proposal to demonstration. One European mission tested a net and a harpoon on a target it had carried up itself, capturing the target successfully in both cases. A separate British-led experiment used a magnetic capture system to release and then recapture a small test satellite in orbit, showing that a docking mechanism could grip an object that was tumbling slowly. Concepts involving ground-based lasers, sails and tethers have been studied, but nothing of that kind has yet been flown against real debris.

G) The obstacles that remain are as much legal as technical. Under existing treaties a spacecraft belongs to the state that launched it for as long as it exists, so an old rocket stage cannot simply be collected by somebody else; permission is required, and permission has proved difficult to obtain. There is no agreed procedure for deciding which objects are the most dangerous, no mechanism for sharing the cost, and no penalty for an operator who leaves a satellite in place. Insurers have begun to price the risk, which may in the end do more than any treaty. The physics, meanwhile, is patient: objects at eight hundred kilometres will still be there in a century, whatever is decided on the ground.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of why the size of a fragment matters less than its speed",
          "B",
          "Energy, not size, is what makes the problem, and there is a great deal of energy in a small object moving at fifteen kilometres a second.",
          "Paragraph B: 'Energy, not size, is what makes the problem'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a prediction made decades before the problem became obvious",
          "C",
          "In 1978 a scientist at the American space agency argued that above a certain density of objects, collisions would begin to generate debris faster than it could fall away, producing a slow cascade in which each smash made the next one more likely.",
          "Paragraph C: the 1978 warning.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to rules that have been made stricter",
          "E",
          "Modern designs vent unused propellant and discharge batteries at the end of a mission, so that nothing is left to explode; operators are increasingly required to bring a satellite down within five years of the end of its working life, rather than the twenty-five once considered acceptable.",
          "Paragraph E: five years instead of twenty-five.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of experiments that captured a target in orbit",
          "F",
          "One European mission tested a net and a harpoon on a target it had carried up itself, capturing the target successfully in both cases.",
          "Paragraph F: the net and harpoon tests.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the point that ownership of old spacecraft prevents their removal",
          "G",
          "Under existing treaties a spacecraft belongs to the state that launched it for as long as it exists, so an old rocket stage cannot simply be collected by somebody else; permission is required, and permission has proved difficult to obtain.",
          "Paragraph G: it 'belongs to the state that launched it'.",
        ),
        pickTwo(
          DEBRIS_STEM,
          DEBRIS_METHODS,
          "A or B",
          "A separate British-led experiment used a magnetic capture system to release and then recapture a small test satellite in orbit, showing that a docking mechanism could grip an object that was tumbling slowly.",
          "A was flown: a magnetic capture system recaptured a test satellite.",
        ),
        pickTwo(
          DEBRIS_STEM,
          DEBRIS_METHODS,
          "A or B",
          "One European mission tested a net and a harpoon on a target it had carried up itself, capturing the target successfully in both cases.",
          "B was flown: a net was fired at a target. C, D and E have not been flown.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Most tracked objects in orbit are wreckage, including ______ from earlier smashes.",
          "fragments",
          "The rest is wreckage: spent rocket stages, dead spacecraft, dropped tools, flakes of paint and the shattered remains of things that have already hit each other.",
          "The wreckage includes 'the shattered remains of things that have already hit each other'.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "The danger comes from the enormous ______ at which objects travel.",
          "speed",
          "In low orbit, objects travel at around eight kilometres a second, and two of them meeting head-on close at twice that.",
          "Objects travel 'at around eight kilometres a second'.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "The 1978 warning described a ______ in which each smash makes the next more likely.",
          "cascade",
          "In 1978 a scientist at the American space agency argued that above a certain density of objects, collisions would begin to generate debris faster than it could fall away, producing a slow cascade in which each smash made the next one more likely.",
          "It produces 'a slow cascade'.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Every avoidance manoeuvre spends ______, which limits a satellite's working life.",
          "fuel",
          "Each manoeuvre spends fuel, and fuel determines how long a satellite can work.",
          "'Each manoeuvre spends fuel'.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Satellites in low orbit can be dropped into the ______ to burn up.",
          "atmosphere",
          "Satellites in low orbit can be dropped into the atmosphere to burn up; those much higher are pushed into a graveyard orbit instead, since bringing them down would cost more fuel than the mission could carry.",
          "They are 'dropped into the atmosphere to burn up'.",
        ),
        fromList(
          "summary_completion",
          DEBRIS_BANK,
          "Pricing by ______ may achieve more than any treaty.",
          "insurance",
          "Insurers have begun to price the risk, which may in the end do more than any treaty.",
          "Insurers pricing the risk 'may in the end do more than any treaty'.",
        ),
      ],
    },
    {
      key: "t36-p3-time-perception",
      title: "Where Does the Time Go?",
      topic: "psychological research into how people judge the passing of time",
      difficulty: 7,
      body: `Everybody knows that time is unreliable. An afternoon in a waiting room outlasts a week of holiday; a year in childhood is an age and a year in middle life is gone before it is noticed. What is less widely known is that the study of these effects is one of the more orderly corners of psychology, with a small set of findings that hold up well and a much larger set of popular explanations that do not.

The first thing researchers had to separate was two different questions. Asking how long something is lasting, while it is still going on, produces one set of answers; asking how long something lasted, after it has finished, produces another, and the two can point in opposite directions. The same afternoon can crawl while it is happening and vanish in memory, which is why holidays feel short at the time and long afterwards, and why a dull commute feels endless and then leaves nothing behind at all.

Judgements made in the moment depend mainly on attention. When a person watches a clock, waits for a kettle or sits through a delay with nothing to occupy them, the passage of time itself becomes the object of attention, and the interval feels long. When the same person is absorbed in a task that occupies them fully, the interval is not being monitored and feels short — the state that athletes and musicians describe as losing track of time. The effect is reliable enough to be produced in a laboratory: give volunteers a demanding task and they will underestimate how long they have been at it, and give them nothing and they will overestimate.

Judgements made afterwards depend on something else entirely: how much the period left behind. Memory is not a recording; it is a set of stored changes, and a stretch of time that contained many new and distinct events leaves more of them. A week of travel in an unfamiliar country, full of first occasions, is dense with material and seems in retrospect to have lasted a long while. A week of identical working days leaves almost nothing distinguishable, and shrinks accordingly. This is the most convincing explanation of why the years seem to accelerate with age. It is not that the brain's clock slows down; it is that adults build lives of routine, in which one month resembles another, while children meet almost everything for the first time.

Two other explanations circulate widely and survive poorly. The first is the proportional theory: that a year feels shorter at fifty because it is a smaller fraction of a life already lived. It is an appealing piece of arithmetic, but it predicts a smooth decline that the data do not show, and it cannot explain why a novel month at fifty still feels long. The second is the idea of a single biological clock that runs faster or slower with body temperature, heart rate or age. Body state does have measurable effects on short judgements of seconds, but no evidence supports a master clock governing the sense of months and years.

The clinical evidence points the same way. People with certain kinds of brain injury misjudge intervals in specific ways, but no single region has been identified as the seat of time perception; the ability appears to be distributed, drawing on attention, memory and the systems that track rhythm and movement. Drugs that speed up or slow down the nervous system distort the judging of seconds, and leave the judging of weeks untouched, which is what a two-system account predicts.

There is a practical lesson buried in this, and it is not the one usually drawn. If the length of a remembered period depends on the number of distinct events it contains, then the common complaint that the years are disappearing is a description of a way of living rather than an effect of ageing. The remedy indicated by the research is not to fill time with more activity — a busy routine is still a routine — but to make some of it unfamiliar: new places, new skills, occasions unlike the last one. The evidence for this is modest, and drawn mostly from laboratory intervals rather than from years. But the underlying finding is solid, and it has the pleasing property of being testable by anybody willing to spend a week somewhere they have never been.`,
      questions: [
        mcq(
          "What distinction does the writer make about judgements of time?",
          [
            "between judgements made by children and by adults",
            "between judging a period as it happens and judging it afterwards",
            "between judging seconds and judging minutes",
            "between accurate and inaccurate judgements",
          ],
          "between judging a period as it happens and judging it afterwards",
          "Asking how long something is lasting, while it is still going on, produces one set of answers; asking how long something lasted, after it has finished, produces another, and the two can point in opposite directions.",
          "The two questions 'can point in opposite directions'.",
        ),
        mcq(
          "According to the passage, an interval feels long in the moment when",
          [
            "the person is absorbed in a demanding task.",
            "the person is paying attention to time itself.",
            "the person is in an unfamiliar place.",
            "the person is tired.",
          ],
          "the person is paying attention to time itself.",
          "When a person watches a clock, waits for a kettle or sits through a delay with nothing to occupy them, the passage of time itself becomes the object of attention, and the interval feels long.",
          "Time becomes 'the object of attention' and the interval 'feels long'.",
        ),
        mcq(
          "What is the writer's objection to the proportional theory of ageing time?",
          [
            "It has never been tested.",
            "It applies only to people over fifty.",
            "It predicts a steady decline that the evidence does not show.",
            "It confuses memory with attention.",
          ],
          "It predicts a steady decline that the evidence does not show.",
          "It is an appealing piece of arithmetic, but it predicts a smooth decline that the data do not show, and it cannot explain why a novel month at fifty still feels long.",
          "It 'predicts a smooth decline that the data do not show'.",
        ),
        mcq(
          "What does the evidence from drugs and brain injury suggest?",
          [
            "that a single region of the brain keeps time",
            "that judging seconds and judging months depend on different systems",
            "that time perception cannot be studied scientifically",
            "that body temperature governs the sense of years",
          ],
          "that judging seconds and judging months depend on different systems",
          "Drugs that speed up or slow down the nervous system distort the judging of seconds, and leave the judging of weeks untouched, which is what a two-system account predicts.",
          "Seconds are affected and weeks are not — 'what a two-system account predicts'.",
        ),
        fromList(
          "matching_sentence_endings",
          TIME_ENDINGS,
          "An interval feels short while it is happening",
          "when a person is completely absorbed in a task.",
          "When the same person is absorbed in a task that occupies them fully, the interval is not being monitored and feels short — the state that athletes and musicians describe as losing track of time.",
          "Absorption means the interval 'is not being monitored and feels short'.",
        ),
        fromList(
          "matching_sentence_endings",
          TIME_ENDINGS,
          "A period seems long in retrospect",
          "when an experience is unfamiliar and full of new information.",
          "A week of travel in an unfamiliar country, full of first occasions, is dense with material and seems in retrospect to have lasted a long while.",
          "Unfamiliar weeks are 'dense with material'.",
        ),
        fromList(
          "matching_sentence_endings",
          TIME_ENDINGS,
          "The years appear to speed up with age",
          "because the brain records fewer new details of a familiar routine.",
          "It is not that the brain's clock slows down; it is that adults build lives of routine, in which one month resembles another, while children meet almost everything for the first time.",
          "Routine leaves little that is distinguishable to remember.",
        ),
        fromList(
          "matching_sentence_endings",
          TIME_ENDINGS,
          "Attention governs the judgement",
          "when people are asked to estimate a period while it is still running.",
          "Judgements made in the moment depend mainly on attention.",
          "In-the-moment judgements 'depend mainly on attention'.",
        ),
        ynng(
          "The writer thinks the study of time perception is more confused than most areas of psychology.",
          "NO",
          "What is less widely known is that the study of these effects is one of the more orderly corners of psychology, with a small set of findings that hold up well and a much larger set of popular explanations that do not.",
          "It is 'one of the more orderly corners of psychology'.",
        ),
        ynng(
          "The writer accepts that the brain contains a master clock for months and years.",
          "NO",
          "Body state does have measurable effects on short judgements of seconds, but no evidence supports a master clock governing the sense of months and years.",
          "'No evidence supports a master clock'.",
        ),
        ynng(
          "The writer regards the memory explanation as the best account of why time speeds up with age.",
          "YES",
          "This is the most convincing explanation of why the years seem to accelerate with age.",
          "It is 'the most convincing explanation'.",
        ),
        ynng(
          "The writer believes that filling one's time with more activity will make years feel longer.",
          "NO",
          "The remedy indicated by the research is not to fill time with more activity — a busy routine is still a routine — but to make some of it unfamiliar: new places, new skills, occasions unlike the last one.",
          "'A busy routine is still a routine'.",
        ),
        ynng(
          "The writer admits that the practical advice rests on limited evidence.",
          "YES",
          "The evidence for this is modest, and drawn mostly from laboratory intervals rather than from years.",
          "'The evidence for this is modest'.",
        ),
        ynng(
          "The writer says that people who travel frequently live longer than those who do not.",
          "NOT GIVEN",
          "",
          "The passage is about how long time feels, not about lifespan.",
        ),
      ],
    },
  ],
};
