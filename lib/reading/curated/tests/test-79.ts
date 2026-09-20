import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · publishing history · notes box -----------------------------

const PAPERBACK_NOTES = {
  title: "How the sixpenny book was made to pay",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · animal biology · people and a word bank -------------------

const SKIN_PEOPLE = ["Imogen Traore", "Nikolai Bauer", "Saoirse Mbeki", "Haruto Nakagawa"];
const SKIN_BANK = [
  "chromatophores",
  "muscles",
  "iridophores",
  "white",
  "pupil",
  "edge",
  "repertoire",
  "waves",
  "structure",
];

// ---- Passage 3 · aviation policy · lettered paragraphs ---------------------

const NIGHT_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const NIGHT_ENDINGS = [
  "although the people affected report that they no longer notice the aircraft.",
  "because a parcel collected in the evening has to travel while nobody is awake.",
  "which is why regulations written in terms of average level miss the point.",
  "since traffic can simply move to a less regulated airport nearby.",
  "because the payment is made once while the noise carries on.",
  "which the writer thinks is the only kind of restriction likely to survive.",
  "even though the measured effects on health are modest in size.",
];

export const TEST_79: CuratedTest = {
  key: "full-test-79",
  targetBand: 5,
  passages: [
    {
      key: "t79-p1-the-paperback",
      title: "The Book That Fitted in a Pocket",
      topic: "how a cheap paper-covered edition changed who owned books",
      difficulty: 4,
      body: `In the summer of 1935 a British publisher put ten novels on sale in paper covers for sixpence each, the price of a packet of cigarettes. The books were not new titles and the format was not new either. What was new was the combination, and it changed who owned books. Within a decade the question of whether an ordinary household contained any books at all had stopped being an interesting one to ask.

Before that, a new book in Britain was a hardback costing seven or eight shillings — roughly a day's wages for many people. Books were bought by libraries and by the well off; everybody else borrowed from a subscription library or from a friend. There were cheap editions already, but they were badly made, printed on poor paper, and usually reprints of old titles out of copyright, so a cheap book signalled that the contents were not worth much either.

Allen Lane's idea was to keep the quality of the text and remove everything else. The books were reprints of titles that had already sold in hardback, so no risk was taken on an unknown author. They were printed in large numbers, which brought the cost per copy down. The covers were paper, the design was the same for every title apart from the colour, and there were no illustrations. Orange meant fiction, green a crime story, blue a biography, so a reader could see from across a shop what kind of book they were holding.

The economics only worked at volume. At sixpence the margin on a copy was tiny, and the venture needed to sell tens of thousands of each title to make anything at all. The established booksellers were not interested: they made their living from expensive books and saw no reason to fill a shelf with cheap ones. The order that made the difference came from a chain of stores that sold clothes and household goods and had never sold books, and which took sixty-three thousand copies. That order is usually described as the moment the format became viable.

What followed was faster than anybody expected. Within a year the company had sold a million copies. Within ten it was publishing original titles rather than reprints, and had added a series of non-fiction books written specially for it, which put current scientific and political argument into the hands of a general readership for the first time.

The war increased the demand rather than reducing it. Paper was rationed and the allocation was based on what a publisher had used before the war, which favoured the established houses, but a paperback uses very little paper per copy and fits in a uniform pocket. Editions were produced for the armed forces in enormous numbers. A generation of readers acquired the habit in circumstances where there was a great deal of waiting and nothing else to do.

The consequences for what was published are harder to summarise. A format that depends on large print runs favours books that many people will buy, and publishers became more attentive to what sold. It is fair to say that this changed which books were commissioned. It is also fair to say that the same format put serious novels, translated literature and the history of ideas into ordinary houses, at a price that made a mistake affordable, which is the condition under which people read outside their habits. A reader who has risked sixpence on an unfamiliar author will risk it again.

The physical object has changed very little since. A modern paperback has a laminated cover, a slightly better paper and a spine that is glued rather than sewn, which is a small loss of durability for a large saving. It costs, relative to a week's wages, a fraction of what the sixpenny edition did.

The format's own competitor arrived in the 2010s, and the pattern has been surprising. Electronic books took a share of the market and then stopped growing, settling at something under a quarter of sales in most countries, and the paperback did not disappear. The usual explanation is that a cheap paperback is already good enough at being cheap and portable, which were the two problems the electronic version was supposed to solve.`,
      questions: [
        tfng(
          "The paper-covered format was invented in 1935.",
          "FALSE",
          "The books were not new titles and the format was not new either.",
          "'The format was not new either'.",
        ),
        tfng(
          "A new hardback could cost around a day's wages.",
          "TRUE",
          "Before that, a new book in Britain was a hardback costing seven or eight shillings — roughly a day's wages for many people.",
          "It was 'roughly a day's wages'.",
        ),
        tfng(
          "Existing booksellers welcomed the new series.",
          "FALSE",
          "The established booksellers were not interested: they made their living from expensive books and saw no reason to fill a shelf with cheap ones.",
          "They 'were not interested'.",
        ),
        tfng(
          "The colour of a cover showed what kind of book it was.",
          "TRUE",
          "Orange meant fiction, green a crime story, blue a biography, so a reader could see from across a shop what kind of book they were holding.",
          "Each colour stood for a category.",
        ),
        tfng(
          "Paper rationing in wartime reduced demand for these books.",
          "FALSE",
          "The war increased the demand rather than reducing it.",
          "The war 'increased the demand'.",
        ),
        tfng(
          "Sales of electronic books stopped rising after reaching a share of the market.",
          "TRUE",
          "Electronic books took a share of the market and then stopped growing, settling at something under a quarter of sales in most countries, and the paperback did not disappear.",
          "They 'stopped growing'.",
        ),
        tfng(
          "Lane had worked as a bookseller before starting the series.",
          "NOT GIVEN",
          "",
          "The passage describes his idea but nothing about his earlier work.",
        ),
        noteLine(
          PAPERBACK_NOTES,
          null,
          "Reprint titles that had already sold in ______",
          "hardback",
          "The books were reprints of titles that had already sold in hardback, so no risk was taken on an unknown author.",
          "They had 'already sold in hardback'.",
          { before: [{ text: "Every part of the design removed a cost:", indent: 0 }] },
        ),
        noteLine(
          PAPERBACK_NOTES,
          null,
          "Print in large numbers to lower the cost per ______",
          "copy",
          "They were printed in large numbers, which brought the cost per copy down.",
          "It 'brought the cost per copy down'.",
        ),
        noteLine(
          PAPERBACK_NOTES,
          null,
          "Use one design for every title apart from the ______",
          "colour",
          "The covers were paper, the design was the same for every title apart from the colour, and there were no illustrations.",
          "Only the colour varied.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Each book cost the same as a packet of ______.",
          "cigarettes",
          "In the summer of 1935 a British publisher put ten novels on sale in paper covers for sixpence each, the price of a packet of cigarettes.",
          "It was 'the price of a packet of cigarettes'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The order that made the venture viable came from a ______ of stores.",
          "chain",
          "The order that made the difference came from a chain of stores that sold clothes and household goods and had never sold books, and which took sixty-three thousand copies.",
          "It came from 'a chain of stores'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A modern paperback has a spine that is ______ rather than sewn.",
          "glued",
          "A modern paperback has a laminated cover, a slightly better paper and a spine that is glued rather than sewn, which is a small loss of durability for a large saving.",
          "The spine is 'glued rather than sewn'.",
        ),
      ],
    },
    {
      key: "t79-p2-cuttlefish-skin",
      title: "The Animal That Matches What It Cannot See",
      topic: "how a colour-blind animal reproduces the pattern of its background",
      difficulty: 5,
      body: `A cuttlefish can change the appearance of its skin in about a fifth of a second, matching a patterned background well enough that a diver swims past it. It can produce a checkerboard, a stripe, a mottle or a uniform pale grey, and it can do all of this while being, as far as anybody can establish, colour-blind.

The skin contains three layers that work in different ways. The top layer holds chromatophores, small sacs of pigment each surrounded by muscles: when the muscles pull, the sac flattens into a disc and the colour shows; when they relax, it shrinks to a point and disappears. The pigments are limited to yellows, reds and browns. Beneath them sit iridophores, which are stacks of thin plates that reflect particular wavelengths by interference, in the way a soap film does, and which supply the blues, greens and metallic sheens the pigments cannot. The bottom layer is white and reflects everything, providing the background.

Imogen Traore, who works on the mechanics, emphasises that the speed comes entirely from the first layer being muscular. Colour change in a fish or a reptile is chemical and takes minutes to hours; a chromatophore is wired directly to the brain, which means the animal can change its pattern as fast as it can move a limb, and means the pattern is under the same kind of voluntary control.

The puzzle is how the animal decides what pattern to produce. Nikolai Bauer, who has tested the visual system, reports that cuttlefish possess a single visual pigment, which in any other animal would mean an inability to distinguish colours, and that behavioural tests confirm they cannot be trained to tell colours apart. Yet they match coloured backgrounds. Two explanations are current: that the animal reads brightness and contrast only, and produces a pattern that happens to work because natural backgrounds correlate colour with brightness; and that the unusual shape of the pupil spreads wavelengths out slightly, so that colour could in principle be recovered by comparing how sharply different parts of the image are focused. Bauer is clear that the second remains a hypothesis with suggestive support rather than a finding.

What the animal is matching is also not what a person would guess. Saoirse Mbeki, who has photographed cuttlefish against controlled backgrounds, points out that the skin does not reproduce the background in detail; it selects from a small repertoire of perhaps a dozen basic patterns and adjusts their scale and contrast. The effect works because a predator is not comparing the animal with the background point by point but looking for an edge, and a pattern that breaks up an outline defeats that without needing to be a copy.

The same system carries messages, and this is where it becomes more than camouflage. A male courting a female while a rival watches can display a courtship pattern on the side facing the female and a female-like pattern on the side facing the rival, at the same moment. Haruto Nakagawa, who has documented this behaviour, notes that it requires the two halves of the display to be controlled independently, which tells us something about the animal's nervous system that would be difficult to establish any other way, and that the deception is aimed at one specific individual rather than broadcast.

There is one signal nobody has explained. Cuttlefish and their relatives produce a travelling band of dark colour that moves across the body in waves, sometimes for minutes, most often while approaching prey such as a crab. The obvious interpretation is that it distracts or confuses, and there is some evidence that a crab stops responding appropriately while it is happening. There is also evidence that the display appears when no prey is present at all, which no current account covers.

The practical interest in the system is in the materials. A display that generates colour by structure rather than by pigment does not fade, needs no backlight and produces no heat, and several groups have built surfaces that change appearance on the same principle. What none of them has matched is the resolution or the speed, and the reason offered is usually that the biological version has an actuator and a nerve for every element, which is an arrangement that is easy to grow and very hard to build.`,
      questions: [
        fromList(
          "matching_features",
          SKIN_PEOPLE,
          "The speed of the change comes from muscle rather than chemistry.",
          "Imogen Traore",
          "Imogen Traore, who works on the mechanics, emphasises that the speed comes entirely from the first layer being muscular.",
          "Traore attributes the speed to muscle.",
        ),
        fromList(
          "matching_features",
          SKIN_PEOPLE,
          "Behavioural tests confirm the animal cannot be taught to tell colours apart.",
          "Nikolai Bauer",
          "Nikolai Bauer, who has tested the visual system, reports that cuttlefish possess a single visual pigment, which in any other animal would mean an inability to distinguish colours, and that behavioural tests confirm they cannot be trained to tell colours apart.",
          "Bauer reports the behavioural tests.",
        ),
        fromList(
          "matching_features",
          SKIN_PEOPLE,
          "The skin chooses from a small set of patterns instead of copying.",
          "Saoirse Mbeki",
          "Saoirse Mbeki, who has photographed cuttlefish against controlled backgrounds, points out that the skin does not reproduce the background in detail; it selects from a small repertoire of perhaps a dozen basic patterns and adjusts their scale and contrast.",
          "Mbeki found a small repertoire.",
        ),
        fromList(
          "matching_features",
          SKIN_PEOPLE,
          "The two sides of a display are controlled independently of each other.",
          "Haruto Nakagawa",
          "Haruto Nakagawa, who has documented this behaviour, notes that it requires the two halves of the display to be controlled independently, which tells us something about the animal's nervous system that would be difficult to establish any other way, and that the deception is aimed at one specific individual rather than broadcast.",
          "Nakagawa documented the split display.",
        ),
        fromList(
          "summary_completion",
          SKIN_BANK,
          "The top layer holds ______, pigment sacs ringed with muscle.",
          "chromatophores",
          "The top layer holds chromatophores, small sacs of pigment each surrounded by muscles: when the muscles pull, the sac flattens into a disc and the colour shows; when they relax, it shrinks to a point and disappears.",
          "The chromatophores hold the pigment.",
        ),
        fromList(
          "summary_completion",
          SKIN_BANK,
          "Beneath them, ______ make blues and greens by interference.",
          "iridophores",
          "Beneath them sit iridophores, which are stacks of thin plates that reflect particular wavelengths by interference, in the way a soap film does, and which supply the blues, greens and metallic sheens the pigments cannot.",
          "The iridophores supply those colours.",
        ),
        fromList(
          "summary_completion",
          SKIN_BANK,
          "The bottom layer is ______ and provides the background.",
          "white",
          "The bottom layer is white and reflects everything, providing the background.",
          "It is white and reflects everything.",
        ),
        fromList(
          "summary_completion",
          SKIN_BANK,
          "The shape of the ______ may spread the wavelengths slightly.",
          "pupil",
          "Two explanations are current: that the animal reads brightness and contrast only, and produces a pattern that happens to work because natural backgrounds correlate colour with brightness; and that the unusual shape of the pupil spreads wavelengths out slightly, so that colour could in principle be recovered by comparing how sharply different parts of the image are focused.",
          "The pupil's shape is one hypothesis.",
        ),
        fromList(
          "summary_completion",
          SKIN_BANK,
          "A predator is looking for an ______ rather than an exact match.",
          "edge",
          "The effect works because a predator is not comparing the animal with the background point by point but looking for an edge, and a pattern that breaks up an outline defeats that without needing to be a copy.",
          "The predator is 'looking for an edge'.",
        ),
        mcq(
          "What colours can the pigment sacs produce?",
          [
            "Yellows, reds and browns",
            "Blues and greens",
            "Only black and white",
            "Every colour the animal can see",
          ],
          "Yellows, reds and browns",
          "The pigments are limited to yellows, reds and browns.",
          "They are 'limited to yellows, reds and browns'.",
        ),
        mcq(
          "How long does colour change take in a fish or a reptile?",
          [
            "Minutes to hours",
            "About a fifth of a second",
            "Several days",
            "They cannot change colour",
          ],
          "Minutes to hours",
          "Colour change in a fish or a reptile is chemical and takes minutes to hours; a chromatophore is wired directly to the brain, which means the animal can change its pattern as fast as it can move a limb, and means the pattern is under the same kind of voluntary control.",
          "It 'takes minutes to hours'.",
        ),
        mcq(
          "What is unexplained about the travelling bands of colour?",
          [
            "They also appear when there is no prey",
            "They only occur after dark",
            "They make the animal more visible",
            "They cannot be photographed",
          ],
          "They also appear when there is no prey",
          "There is also evidence that the display appears when no prey is present at all, which no current account covers.",
          "It appears with 'no prey present at all'.",
        ),
        mcq(
          "Why have engineered surfaces not matched the skin?",
          [
            "Each element has its own actuator and nerve",
            "The materials fade too quickly",
            "They produce too much heat",
            "Colour cannot be made by structure",
          ],
          "Each element has its own actuator and nerve",
          "What none of them has matched is the resolution or the speed, and the reason offered is usually that the biological version has an actuator and a nerve for every element, which is an arrangement that is easy to grow and very hard to build.",
          "Every element has its own actuator and nerve.",
        ),
      ],
    },
    {
      key: "t79-p3-night-flights",
      title: "The Hours When Nothing Should Fly",
      topic: "how restrictions on flying at night are argued for and how they should be set",
      difficulty: 6,
      body: `A) Most large European airports restrict flights at night, and the restrictions are among the most litigated pieces of transport regulation anywhere. The reason is that the interests involved are unusually sharply opposed: the value of a night slot to an airline or a freight operator is very high, the cost to the people under the approach path is real and difficult to price, and the two groups do not overlap at all. Nothing about the dispute is resolvable by finding a fact that both sides accept, because both sides already accept most of them.

B) The health evidence is stronger than it was twenty years ago and is now the basis of the case. Aircraft noise at night is associated with awakenings, with fragmented sleep that the sleeper does not remember, and with measurable increases in blood pressure; long-term studies of populations near large airports report elevated cardiovascular risk that survives adjustment for income, smoking and air pollution. The effect sizes are modest and consistent, which is the pattern one expects from a genuine but small hazard spread across a very large number of people.

C) Two findings complicate the argument, and both are worth stating because both cut against intuition. The first is that people do not adapt: residents exposed for decades show the same physiological responses as recent arrivals, even when they report not noticing the aircraft. The second is that the number of loud events matters more than the average noise level, which is awkward, because average level is what regulations have historically been written in terms of and what a quieter fleet improves.

D) The economic case for night operations is not negligible and is usually presented badly by the industry. Express freight genuinely requires night flying: a parcel collected in the evening and delivered the next morning has to move while nobody is awake, and the network of a courier company is built around a hub that sorts between midnight and four. Passenger night flights are a weaker case — most are long-haul arrivals scheduled for the convenience of the departure airport's morning, and a substantial proportion could be shifted an hour or two at a cost that is commercial rather than structural.

E) What a ban actually does is less obvious than either side pretends. Airports with strict curfews have seen traffic move to less regulated airports nearby, which can increase the total number of people affected while reducing the number at the regulated site. Curfews also concentrate departures into the hour after they lift and the hour before they begin, producing a noise peak at exactly the time when sleep is easiest to interrupt. Neither effect is an argument against restriction; both are arguments for designing it across a region rather than one airport at a time. A curfew written by a single authority is a curfew written for a system it does not control.

F) I find the compensation approach less attractive than it looks. It is often proposed that operators should simply pay the affected residents, which is economically tidy and has been tried in several forms: insulation grants, purchase of the worst-affected houses, direct payments. Insulation works and is worth doing. The rest founders on a practical point, which is that the payment is made once and the noise continues, and on a distributional one, which is that the households near an airport approach are on average poorer than the passengers, so a scheme that lets money settle the question transfers a burden downwards.

G) My own view is that the honest framing is a limit rather than a ban, set on the number of loud events and tightened on a published schedule, with the schedule long enough for fleet replacement to do most of the work. That is less satisfying than a prohibition and considerably more likely to hold, because a rule that makes a hub unviable is a rule that gets overturned in a court or a cabinet within a decade, and the residents then have neither the ban nor the limit they could have had. The choice is not between quiet and noise. It is between a restriction that survives a change of government and one that does not.`,
      questions: [
        fromList(
          "matching_information",
          NIGHT_PARAGRAPHS,
          "a finding that long exposure does not reduce the physical response",
          "C",
          "The first is that people do not adapt: residents exposed for decades show the same physiological responses as recent arrivals, even when they report not noticing the aircraft.",
          "Paragraph C reports the absence of adaptation.",
        ),
        fromList(
          "matching_information",
          NIGHT_PARAGRAPHS,
          "why one kind of flying genuinely has to happen at night",
          "D",
          "Express freight genuinely requires night flying: a parcel collected in the evening and delivered the next morning has to move while nobody is awake, and the network of a courier company is built around a hub that sorts between midnight and four.",
          "Paragraph D makes the freight case.",
        ),
        fromList(
          "matching_information",
          NIGHT_PARAGRAPHS,
          "an unintended effect of a curfew on when aircraft depart",
          "E",
          "Curfews also concentrate departures into the hour after they lift and the hour before they begin, producing a noise peak at exactly the time when sleep is easiest to interrupt.",
          "Paragraph E describes the peak at the edges.",
        ),
        fromList(
          "matching_information",
          NIGHT_PARAGRAPHS,
          "a reason why paying residents is unsatisfactory",
          "F",
          "The rest founders on a practical point, which is that the payment is made once and the noise continues, and on a distributional one, which is that the households near an airport approach are on average poorer than the passengers, so a scheme that lets money settle the question transfers a burden downwards.",
          "Paragraph F gives two objections to payment.",
        ),
        fromList(
          "matching_information",
          NIGHT_PARAGRAPHS,
          "what the long-term health studies report after adjustment",
          "B",
          "Aircraft noise at night is associated with awakenings, with fragmented sleep that the sleeper does not remember, and with measurable increases in blood pressure; long-term studies of populations near large airports report elevated cardiovascular risk that survives adjustment for income, smoking and air pollution.",
          "Paragraph B reports the adjusted risk.",
        ),
        ynng(
          "The writer thinks residents grow used to aircraft noise over time.",
          "NO",
          "The first is that people do not adapt: residents exposed for decades show the same physiological responses as recent arrivals, even when they report not noticing the aircraft.",
          "'People do not adapt'.",
        ),
        ynng(
          "The writer accepts that overnight freight operations require night flying.",
          "YES",
          "Express freight genuinely requires night flying: a parcel collected in the evening and delivered the next morning has to move while nobody is awake, and the network of a courier company is built around a hub that sorts between midnight and four.",
          "It 'genuinely requires night flying'.",
        ),
        ynng(
          "The writer regards insulation grants as worth providing.",
          "YES",
          "Insulation works and is worth doing.",
          "Insulation 'is worth doing'.",
        ),
        ynng(
          "The writer believes an outright ban is the most durable policy.",
          "NO",
          "That is less satisfying than a prohibition and considerably more likely to hold, because a rule that makes a hub unviable is a rule that gets overturned in a court or a cabinet within a decade, and the residents then have neither the ban nor the limit they could have had.",
          "A limit is 'more likely to hold'.",
        ),
        fromList(
          "matching_sentence_endings",
          NIGHT_ENDINGS,
          "Years of exposure do not blunt the physical response,",
          "although the people affected report that they no longer notice the aircraft.",
          "The first is that people do not adapt: residents exposed for decades show the same physiological responses as recent arrivals, even when they report not noticing the aircraft.",
          "They stop noticing but still respond.",
        ),
        fromList(
          "matching_sentence_endings",
          NIGHT_ENDINGS,
          "An overnight courier network cannot be moved into the day,",
          "because a parcel collected in the evening has to travel while nobody is awake.",
          "Express freight genuinely requires night flying: a parcel collected in the evening and delivered the next morning has to move while nobody is awake, and the network of a courier company is built around a hub that sorts between midnight and four.",
          "The parcel has to move overnight.",
        ),
        fromList(
          "matching_sentence_endings",
          NIGHT_ENDINGS,
          "Counting loud events matters more than averaging the noise,",
          "which is why regulations written in terms of average level miss the point.",
          "The second is that the number of loud events matters more than the average noise level, which is awkward, because average level is what regulations have historically been written in terms of and what a quieter fleet improves.",
          "The rules measure the wrong quantity.",
        ),
        fromList(
          "matching_sentence_endings",
          NIGHT_ENDINGS,
          "A curfew at one airport may increase the total number affected,",
          "since traffic can simply move to a less regulated airport nearby.",
          "Airports with strict curfews have seen traffic move to less regulated airports nearby, which can increase the total number of people affected while reducing the number at the regulated site.",
          "The traffic moves rather than stopping.",
        ),
        fromList(
          "matching_sentence_endings",
          NIGHT_ENDINGS,
          "A tightening limit is preferable to an outright prohibition,",
          "which the writer thinks is the only kind of restriction likely to survive.",
          "My own view is that the honest framing is a limit rather than a ban, set on the number of loud events and tightened on a published schedule, with the schedule long enough for fleet replacement to do most of the work.",
          "A scheduled limit is the durable form.",
        ),
      ],
    },
  ],
};
