import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · music history · notes box ----------------------------------

const PITCH_NOTES = {
  title: "Why the pitch drifted upwards",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · measurement · people and a word bank ----------------------

const CLOCK_PEOPLE = ["Marta Kowalczyk", "Yusuf Demirel", "Aiko Tanabe", "Ronan Gallagher"];
const CLOCK_BANK = [
  "pendulum",
  "caesium",
  "lasers",
  "vacuum",
  "optical",
  "gravity",
  "satellites",
  "second",
  "link",
];

// ---- Passage 3 · urban policy · lettered paragraphs ------------------------

const STREET_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const STREET_ENDINGS = [
  "because the amount of road space available shapes how much is demanded.",
  "although traders' own estimates are often twice the measured figure.",
  "which is why the shops afterwards are often not the shops from before.",
  "since a street on a through route loses the trade the traffic brought it.",
  "because fifty years of network building lies behind the examples cited.",
  "which the writer thinks has to be asked about each street separately.",
  "even though an empty paved corridor is what opponents photograph.",
];

export const TEST_73: CuratedTest = {
  key: "full-test-73",
  targetBand: 5,
  passages: [
    {
      key: "t73-p1-standard-pitch",
      title: "The Note Everyone Had to Share",
      topic: "how musicians came to agree on a single reference note",
      difficulty: 4,
      body: `An orchestra tuning before a concert is settling on a shared reference, and the note it settles on is the A above middle C. Today that note is almost everywhere defined as 440 vibrations a second. Getting to a single agreed figure took about four hundred years, and the history is far more disorderly than the present tidiness suggests.

Before the nineteenth century there was no standard at all, and there was no way of measuring one. A pitch was set by whatever instrument could not easily be adjusted, which in most churches meant the organ, and every organ was different. Surviving instruments and tuning forks suggest that the A used in Europe ranged over more than a whole tone, from about 390 vibrations a second to about 470. A singer travelling between two cities could find the same written music a noticeable distance higher or lower. There was nothing careless about this; there was simply no authority to appeal to, and no vocabulary in which a disagreement could even be stated.

Two things changed the situation. The first was the ability to count vibrations, which became practical in the early nineteenth century; before that, pitch could be compared but not stated as a number. The second was the growth of touring — orchestras, opera companies and soloists moving between countries — which turned local variation from a curiosity into a practical obstacle.

The nineteenth century then produced a drift upwards, and the reason was musical rather than technical. A higher pitch makes string instruments sound brighter and more brilliant, because the strings are under greater tension, and an orchestra that tuned slightly higher than the one down the road sounded slightly more exciting. Since nobody wanted to sound duller, the pitch crept up. Singers objected throughout, because their instrument cannot be retuned and a rising pitch makes the upper end of a written part harder or impossible.

The first serious attempt at a standard came from the French government, which in 1859 established a legal pitch of 435 vibrations a second for the A, in response to complaints from singers. A tuning fork embodying it was deposited in Paris. The standard was widely adopted and widely ignored, and the upward drift resumed.

The figure now used was agreed at an international conference in 1939 and confirmed after the war. It is a compromise and has no acoustic significance: 440 is not a special number, it does not have a simple relationship to anything else, and it was chosen because it was close to what most orchestras were already doing. The agreement mattered more than the value. What a standard does is remove a question, and any defensible number would have removed it equally well.

Even now it is not universal. Several major European orchestras tune deliberately higher, at 443 or 445, for the same reason their predecessors did. Some ensembles that play older music tune much lower, often at 415, which is roughly a semitone below the modern standard and closer to what is thought to have been used in parts of Europe in the eighteenth century. An instrument built for a lower pitch is under less tension and sounds different, so the choice is not only a historical one. A violin strung for 415 and one strung for 445 are, in a real sense, two different instruments.

There are practical consequences that reach beyond orchestras. A wind instrument is built for a particular pitch and cannot be adjusted very far: a flute made for 440 cannot comfortably play at 445, so an orchestra that raises its pitch obliges its wind players to buy instruments. Old organs cannot be retuned at all without rebuilding. And a written note is now assumed to correspond to a particular frequency in electronic instruments and tuning applications, which quietly makes the standard much harder to depart from than it was when it lived in a fork in a drawer.

The story is often told as one of arbitrary convention, and that is half right. The particular number is arbitrary. The need for a number is not: as soon as musicians travel and instruments are manufactured in one place for use in another, a shared reference stops being a convenience and becomes a condition of playing together at all.`,
      questions: [
        tfng(
          "Pitch could not be expressed as a number before the nineteenth century.",
          "TRUE",
          "The first was the ability to count vibrations, which became practical in the early nineteenth century; before that, pitch could be compared but not stated as a number.",
          "Before then it could not be 'stated as a number'.",
        ),
        tfng(
          "The A used across Europe varied by less than a semitone.",
          "FALSE",
          "Surviving instruments and tuning forks suggest that the A used in Europe ranged over more than a whole tone, from about 390 vibrations a second to about 470.",
          "It ranged 'over more than a whole tone'.",
        ),
        tfng(
          "Tuning higher makes stringed instruments sound brighter.",
          "TRUE",
          "A higher pitch makes string instruments sound brighter and more brilliant, because the strings are under greater tension, and an orchestra that tuned slightly higher than the one down the road sounded slightly more exciting.",
          "Higher pitch sounds 'brighter and more brilliant'.",
        ),
        tfng(
          "Singers were in favour of the rise in pitch.",
          "FALSE",
          "Singers objected throughout, because their instrument cannot be retuned and a rising pitch makes the upper end of a written part harder or impossible.",
          "Singers 'objected throughout'.",
        ),
        tfng(
          "The French standard of 1859 was observed everywhere it was adopted.",
          "FALSE",
          "The standard was widely adopted and widely ignored, and the upward drift resumed.",
          "It was 'widely adopted and widely ignored'.",
        ),
        tfng(
          "The figure agreed in 1939 was close to existing practice.",
          "TRUE",
          "It is a compromise and has no acoustic significance: 440 is not a special number, it does not have a simple relationship to anything else, and it was chosen because it was close to what most orchestras were already doing.",
          "It matched 'what most orchestras were already doing'.",
        ),
        tfng(
          "Most listeners can hear the difference between 440 and 443.",
          "NOT GIVEN",
          "",
          "The passage never discusses what a listener can detect.",
        ),
        noteLine(
          PITCH_NOTES,
          null,
          "Tuning higher puts the strings under greater ______",
          "tension",
          "A higher pitch makes string instruments sound brighter and more brilliant, because the strings are under greater tension, and an orchestra that tuned slightly higher than the one down the road sounded slightly more exciting.",
          "The strings come 'under greater tension'.",
          { before: [{ text: "The cause was musical, not technical:", indent: 0 }] },
        ),
        noteLine(
          PITCH_NOTES,
          null,
          "An orchestra tuning higher than its rivals sounded more ______",
          "exciting",
          "A higher pitch makes string instruments sound brighter and more brilliant, because the strings are under greater tension, and an orchestra that tuned slightly higher than the one down the road sounded slightly more exciting.",
          "It sounded 'slightly more exciting'.",
        ),
        noteLine(
          PITCH_NOTES,
          null,
          "Nobody wished to sound ______, so the pitch rose",
          "duller",
          "Since nobody wanted to sound duller, the pitch crept up.",
          "'Nobody wanted to sound duller'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A tuning ______ carrying the French standard was kept in Paris.",
          "fork",
          "A tuning fork embodying it was deposited in Paris.",
          "A tuning fork was deposited there.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Groups performing older music often tune about a ______ lower.",
          "semitone",
          "Some ensembles that play older music tune much lower, often at 415, which is roughly a semitone below the modern standard and closer to what is thought to have been used in parts of Europe in the eighteenth century.",
          "That is 'roughly a semitone below'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Raising an orchestra's pitch forces its ______ players to buy instruments.",
          "wind",
          "A wind instrument is built for a particular pitch and cannot be adjusted very far: a flute made for 440 cannot comfortably play at 445, so an orchestra that raises its pitch obliges its wind players to buy instruments.",
          "It 'obliges its wind players' to buy new ones.",
        ),
      ],
    },
    {
      key: "t73-p2-atomic-clocks",
      title: "The Clock That Counts an Atom",
      topic: "how time came to be measured by something that cannot be manufactured differently",
      difficulty: 5,
      body: `Every clock works the same way. Something repeats at a rate that does not change, and the repetitions are counted. A pendulum swings, a quartz crystal vibrates, and the accuracy of the clock is the accuracy of the assumption that the rate is steady. The difficulty with every mechanical and electronic oscillator is that the rate is not quite steady: it varies with temperature, with pressure, with age and with how the device was made, so two supposedly identical clocks drift apart.

An atomic clock removes that problem by using something that cannot be manufactured differently. An atom of caesium absorbs microwave radiation at one precise frequency, and that frequency is a property of the atom rather than of the apparatus. Every caesium atom in the universe behaves identically. Marta Kowalczyk, who works on frequency standards, emphasises that this is the whole point: a well-built atomic clock does not need calibrating against a better one, because the reference is the atom and the apparatus only has to interrogate it honestly.

The mechanism is less exotic than the name suggests. A microwave source is tuned to roughly the right frequency and directed at a population of caesium atoms; the proportion that change state is measured; and that measurement is used to correct the source. The clock is a feedback loop in which a mediocre oscillator is continuously steered by an atom. The second has been defined since 1967 as a fixed number of cycles of this radiation — a little over nine billion — which means the definition is no longer an astronomical one.

What limits the accuracy is mostly how long the atoms can be observed. Yusuf Demirel, who builds the apparatus, explains that the uncertainty falls as the interaction time rises, which is why the best designs slow the atoms down instead of speeding anything up: a cloud of caesium is cooled with lasers to a fraction of a degree above absolute zero and then tossed gently upwards, so that it rises, falls back and is interrogated for about a second on the way. He is clear that almost all the engineering difficulty lies in the cooling and the vacuum rather than in the timing electronics.

The next generation has moved from microwaves to visible light. An optical clock uses an atomic transition at a much higher frequency, which divides time into finer intervals and therefore allows a smaller uncertainty. Aiko Tanabe, who compares such clocks, points out that the best of them would not have gained or lost a second over the age of the universe, and adds the qualification usually left out: that figure describes how steadily the clock ticks, not whether it agrees with anything else, and two of them in different laboratories still have to be compared over a link that is itself a source of error.

That precision has turned clocks into instruments for measuring other things. A clock runs slower where gravity is stronger, which is a prediction of general relativity and is now an everyday engineering fact: an optical clock raised by a few centimetres ticks measurably faster. Ronan Gallagher, who works on applications in surveying, argues that this makes a clock into an altimeter of an unusual kind — comparing two clocks gives the difference in gravitational potential between them, which is the quantity surveyors actually want and normally obtain by far more laborious means.

The uses that affect ordinary life are less glamorous and almost invisible. Satellite navigation is a timing system rather than a positioning system: a receiver works out where it is by comparing the arrival times of signals from several satellites, each carrying an atomic clock, and an error of a millionth of a second corresponds to about three hundred metres on the ground. Electricity grids, financial exchanges and mobile networks all require distributed equipment to agree on the time to a precision no mechanical clock could supply.

There is a coming change in the definition of the second, and it is not only a matter of accuracy. Optical clocks are now far better than the caesium standard that defines the unit, which is an awkward position: the definition has become the least accurate part of the measurement. Redefining it requires choosing which atom, and the choice is partly technical and partly political, since a laboratory whose clock becomes the standard acquires a position it will hold for decades.

The practical lesson of the whole field is that measuring time well turns out to be a way of measuring almost everything else. Distance, position, gravity and the shape of the Earth are now determined by counting oscillations, and the chain of reasoning that connects a cooled atom to a map is one of the longer ones in applied physics.`,
      questions: [
        fromList(
          "matching_features",
          CLOCK_PEOPLE,
          "The reference is the atom, so the instrument needs no calibration.",
          "Marta Kowalczyk",
          "Marta Kowalczyk, who works on frequency standards, emphasises that this is the whole point: a well-built atomic clock does not need calibrating against a better one, because the reference is the atom and the apparatus only has to interrogate it honestly.",
          "Kowalczyk explains why no calibration is needed.",
        ),
        fromList(
          "matching_features",
          CLOCK_PEOPLE,
          "The hard engineering lies in cooling and vacuum, not in the electronics.",
          "Yusuf Demirel",
          "He is clear that almost all the engineering difficulty lies in the cooling and the vacuum rather than in the timing electronics.",
          "Demirel locates the difficulty.",
        ),
        fromList(
          "matching_features",
          CLOCK_PEOPLE,
          "A figure for steadiness says nothing about agreement between clocks.",
          "Aiko Tanabe",
          "Aiko Tanabe, who compares such clocks, points out that the best of them would not have gained or lost a second over the age of the universe, and adds the qualification usually left out: that figure describes how steadily the clock ticks, not whether it agrees with anything else, and two of them in different laboratories still have to be compared over a link that is itself a source of error.",
          "Tanabe adds the missing qualification.",
        ),
        fromList(
          "matching_features",
          CLOCK_PEOPLE,
          "Comparing two clocks yields exactly the quantity surveyors want.",
          "Ronan Gallagher",
          "Ronan Gallagher, who works on applications in surveying, argues that this makes a clock into an altimeter of an unusual kind — comparing two clocks gives the difference in gravitational potential between them, which is the quantity surveyors actually want and normally obtain by far more laborious means.",
          "Gallagher turns the clock into an altimeter.",
        ),
        fromList(
          "summary_completion",
          CLOCK_BANK,
          "In an ordinary clock a ______ or a crystal supplies the repetition.",
          "pendulum",
          "A pendulum swings, a quartz crystal vibrates, and the accuracy of the clock is the accuracy of the assumption that the rate is steady.",
          "A pendulum or a crystal repeats.",
        ),
        fromList(
          "summary_completion",
          CLOCK_BANK,
          "An atom of ______ absorbs microwaves at one exact frequency.",
          "caesium",
          "An atom of caesium absorbs microwave radiation at one precise frequency, and that frequency is a property of the atom rather than of the apparatus.",
          "Caesium absorbs at one frequency.",
        ),
        fromList(
          "summary_completion",
          CLOCK_BANK,
          "The atoms are cooled with ______ before being tossed upwards.",
          "lasers",
          "Yusuf Demirel, who builds the apparatus, explains that the uncertainty falls as the interaction time rises, which is why the best designs slow the atoms down instead of speeding anything up: a cloud of caesium is cooled with lasers to a fraction of a degree above absolute zero and then tossed gently upwards, so that it rises, falls back and is interrogated for about a second on the way.",
          "They are 'cooled with lasers'.",
        ),
        fromList(
          "summary_completion",
          CLOCK_BANK,
          "An ______ clock uses a transition at a much higher frequency.",
          "optical",
          "An optical clock uses an atomic transition at a much higher frequency, which divides time into finer intervals and therefore allows a smaller uncertainty.",
          "That is the optical clock.",
        ),
        fromList(
          "summary_completion",
          CLOCK_BANK,
          "Two clocks must be compared over a ______ that adds error of its own.",
          "link",
          "Aiko Tanabe, who compares such clocks, points out that the best of them would not have gained or lost a second over the age of the universe, and adds the qualification usually left out: that figure describes how steadily the clock ticks, not whether it agrees with anything else, and two of them in different laboratories still have to be compared over a link that is itself a source of error.",
          "The link is 'itself a source of error'.",
        ),
        mcq(
          "How is an atomic clock arranged?",
          [
            "An ordinary oscillator is steered by an atom",
            "An atom is driven by a quartz crystal",
            "Two atoms are compared with each other",
            "A pendulum is corrected by microwaves",
          ],
          "An ordinary oscillator is steered by an atom",
          "The clock is a feedback loop in which a mediocre oscillator is continuously steered by an atom.",
          "A 'mediocre oscillator' is steered by the atom.",
        ),
        mcq(
          "Why are the atoms slowed down rather than speeded up?",
          [
            "Uncertainty falls as the interaction time rises",
            "Cold atoms absorb more radiation",
            "Fast atoms damage the apparatus",
            "It reduces the power the clock needs",
          ],
          "Uncertainty falls as the interaction time rises",
          "Yusuf Demirel, who builds the apparatus, explains that the uncertainty falls as the interaction time rises, which is why the best designs slow the atoms down instead of speeding anything up: a cloud of caesium is cooled with lasers to a fraction of a degree above absolute zero and then tossed gently upwards, so that it rises, falls back and is interrogated for about a second on the way.",
          "Longer observation means less uncertainty.",
        ),
        mcq(
          "How does satellite navigation establish a position?",
          [
            "By comparing the arrival times of signals",
            "By measuring the strength of each signal",
            "By triangulating from ground stations",
            "By counting the satellites in view",
          ],
          "By comparing the arrival times of signals",
          "Satellite navigation is a timing system rather than a positioning system: a receiver works out where it is by comparing the arrival times of signals from several satellites, each carrying an atomic clock, and an error of a millionth of a second corresponds to about three hundred metres on the ground.",
          "It compares arrival times.",
        ),
        mcq(
          "Why is the present definition of the second awkward?",
          [
            "The defining standard is less accurate than the best clocks",
            "No laboratory can now build a caesium clock",
            "Optical clocks disagree with one another",
            "The astronomical definition is still in force",
          ],
          "The defining standard is less accurate than the best clocks",
          "Optical clocks are now far better than the caesium standard that defines the unit, which is an awkward position: the definition has become the least accurate part of the measurement.",
          "The definition is now the weakest link.",
        ),
      ],
    },
    {
      key: "t73-p3-pedestrianisation",
      title: "Streets Without Cars",
      topic: "when removing traffic from a street improves it and when it empties it",
      difficulty: 6,
      body: `A) Removing cars from a street is among the few urban interventions that can be tried, measured and reversed within a year, and it has been tried in a few thousand places. The results are not uniform, and the variation is the interesting part: the same physical change succeeds in one street and empties another, and the reasons are now reasonably well understood even though they are routinely ignored when a scheme is proposed. The failures are as well documented as the successes, and documented in the same places.

B) The strongest evidence concerns what happens to the traffic that used to be there. The intuitive model is that the same number of vehicles must go somewhere else, and this turns out to be wrong in a way that is well documented. A review of some sixty road closures and capacity reductions found that a substantial proportion of the traffic disappeared rather than relocating: on average around a fifth of the vehicles were not found on any surrounding route afterwards. People did not make the trip, made it at another time, combined it with another errand, or travelled differently. The demand for road space responds to how much of it there is, in both directions.

C) The commercial effects decide whether a scheme survives, because the objection always comes from the shops. Retailers consistently and substantially overestimate how many of their customers arrive by car — surveys comparing traders' estimates with actual counts find the estimate is often double the reality — and therefore predict a loss that does not occur. Measured outcomes in pedestrianised shopping streets are generally positive: footfall rises, and so does spending per square metre. The distributional detail is less comfortable: rents rise with footfall, and the shops present two years after a scheme are frequently not the shops that were there before it.

D) Failures are informative and share a small number of features. A street that is pedestrianised but not connected to anywhere people are walking to becomes a void. A street where the traffic was the reason for the footfall — passing trade on a through route — loses it. And a scheme that removes vehicles without providing anything else, no seating, no shade, no reason to remain, produces an empty paved corridor, which is the outcome most often photographed by opponents of the next proposal.

E) The objection that deserves more respect than it receives concerns access rather than trade. Deliveries, refuse collection, taxis, and above all people who cannot walk far are affected by a change presented as making a street more accessible. Schemes that work have specific answers: timed delivery windows, a permit system, drop-off points within a short distance. Schemes that fail offer a general assurance that it will be fine. The difference between those two sentences is most of the difference between the schemes. The disability objection in particular is frequently dismissed as a proxy for motorists' complaints, which is both unfair and tactically foolish, since it is the objection most likely to defeat a scheme in court.

F) I am sceptical of the argument from the continental example, which is the one most often made. Copenhagen and the Dutch cities are cited as proof that the transformation is available anywhere, and the implication — that a British or American city need only decide — omits the fifty years of incremental network building, land use regulation and parking policy that produced those results. A single pedestrianised street in a city organised around driving is not a small version of Copenhagen; it is an isolated intervention in a system working against it.

G) What the evidence supports is narrower than either side claims. Removing cars from a street reliably improves that street when the street is already somewhere people want to be, when what replaces the traffic is designed rather than merely absent, and when access for the people who need it is arranged explicitly. Where those conditions are absent it produces an empty space and a decade of local opposition to anything resembling it. The cost of a badly chosen scheme is therefore not confined to the street it was built in. The question is never whether pedestrianisation works. It is whether this street, in this network, with these arrangements, is one of the cases where it does.`,
      questions: [
        fromList(
          "matching_information",
          STREET_PARAGRAPHS,
          "a finding that some traffic does not reappear anywhere else",
          "B",
          "A review of some sixty road closures and capacity reductions found that a substantial proportion of the traffic disappeared rather than relocating: on average around a fifth of the vehicles were not found on any surrounding route afterwards.",
          "Paragraph B reports the vanished fifth.",
        ),
        fromList(
          "matching_information",
          STREET_PARAGRAPHS,
          "evidence that traders misjudge how their customers arrive",
          "C",
          "Retailers consistently and substantially overestimate how many of their customers arrive by car — surveys comparing traders' estimates with actual counts find the estimate is often double the reality — and therefore predict a loss that does not occur.",
          "Paragraph C compares estimates with counts.",
        ),
        fromList(
          "matching_information",
          STREET_PARAGRAPHS,
          "the features that unsuccessful schemes have in common",
          "D",
          "A street that is pedestrianised but not connected to anywhere people are walking to becomes a void.",
          "Paragraph D lists the shared failures.",
        ),
        fromList(
          "matching_information",
          STREET_PARAGRAPHS,
          "an objection the writer says is unfairly brushed aside",
          "E",
          "The disability objection in particular is frequently dismissed as a proxy for motorists' complaints, which is both unfair and tactically foolish, since it is the objection most likely to defeat a scheme in court.",
          "Paragraph E defends the access objection.",
        ),
        fromList(
          "matching_information",
          STREET_PARAGRAPHS,
          "what is left out when other countries are offered as proof",
          "F",
          "Copenhagen and the Dutch cities are cited as proof that the transformation is available anywhere, and the implication — that a British or American city need only decide — omits the fifty years of incremental network building, land use regulation and parking policy that produced those results.",
          "Paragraph F supplies the missing fifty years.",
        ),
        ynng(
          "The writer believes displaced traffic always reappears on nearby roads.",
          "NO",
          "The intuitive model is that the same number of vehicles must go somewhere else, and this turns out to be wrong in a way that is well documented.",
          "That model 'turns out to be wrong'.",
        ),
        ynng(
          "The writer accepts that pedestrianisation usually raises retail takings.",
          "YES",
          "Measured outcomes in pedestrianised shopping streets are generally positive: footfall rises, and so does spending per square metre.",
          "Spending per square metre rises.",
        ),
        ynng(
          "The writer thinks disabled people's concerns are a cover for motorists.",
          "NO",
          "The disability objection in particular is frequently dismissed as a proxy for motorists' complaints, which is both unfair and tactically foolish, since it is the objection most likely to defeat a scheme in court.",
          "That dismissal is 'both unfair and tactically foolish'.",
        ),
        ynng(
          "The writer thinks the outcome depends on conditions specific to each street.",
          "YES",
          "It is whether this street, in this network, with these arrangements, is one of the cases where it does.",
          "The question is about this street and network.",
        ),
        fromList(
          "matching_sentence_endings",
          STREET_ENDINGS,
          "A share of the vehicles is never found on another route,",
          "because the amount of road space available shapes how much is demanded.",
          "The demand for road space responds to how much of it there is, in both directions.",
          "Demand follows supply both ways.",
        ),
        fromList(
          "matching_sentence_endings",
          STREET_ENDINGS,
          "Shopkeepers forecast a loss of custom that does not arrive,",
          "although traders' own estimates are often twice the measured figure.",
          "Retailers consistently and substantially overestimate how many of their customers arrive by car — surveys comparing traders' estimates with actual counts find the estimate is often double the reality — and therefore predict a loss that does not occur.",
          "Their estimate is often double.",
        ),
        fromList(
          "matching_sentence_endings",
          STREET_ENDINGS,
          "Rising footfall changes which businesses can afford the street,",
          "which is why the shops afterwards are often not the shops from before.",
          "The distributional detail is less comfortable: rents rise with footfall, and the shops present two years after a scheme are frequently not the shops that were there before it.",
          "Rents rise and the tenants change.",
        ),
        fromList(
          "matching_sentence_endings",
          STREET_ENDINGS,
          "Some streets depend on the passing traffic for their custom,",
          "since a street on a through route loses the trade the traffic brought it.",
          "A street where the traffic was the reason for the footfall — passing trade on a through route — loses it.",
          "The traffic was the footfall.",
        ),
        fromList(
          "matching_sentence_endings",
          STREET_ENDINGS,
          "The continental comparison proves less than it appears to,",
          "because fifty years of network building lies behind the examples cited.",
          "Copenhagen and the Dutch cities are cited as proof that the transformation is available anywhere, and the implication — that a British or American city need only decide — omits the fifty years of incremental network building, land use regulation and parking policy that produced those results.",
          "Those cities had fifty years of groundwork.",
        ),
      ],
    },
  ],
};
