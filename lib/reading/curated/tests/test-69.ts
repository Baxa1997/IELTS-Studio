import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · technology history · notes box -----------------------------

const LAYOUT_NOTES = {
  title: "How the arrangement became fixed",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · public health logistics · people and a word bank -----------

const CHAIN_PEOPLE = [
  "Adaeze Nwachukwu",
  "Bram Oosterhuis",
  "Leena Kulkarni",
  "Santiago Vergara",
];
const CHAIN_BANK = [
  "adjuvant",
  "monitor",
  "freezing",
  "solar",
  "ice",
  "loggers",
  "powder",
  "glass",
  "doses",
];

// ---- Passage 3 · research policy · lettered paragraphs ----------------------

const METRIC_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const METRIC_ENDINGS = [
  "because most of a journal's citations go to a small number of its papers.",
  "although the measure was intended only to guide a library's purchasing.",
  "since rates of citation differ enormously from one discipline to another.",
  "because a count cannot tell approval and disagreement apart.",
  "which the writer regards as the real reason the practice continues.",
  "even though committee judgement has documented biases of its own.",
  "which is why review articles become unusually attractive to write.",
];

export const TEST_69: CuratedTest = {
  key: "full-test-69",
  targetBand: 7,
  passages: [
    {
      key: "t69-p1-keyboard-layout",
      title: "The Keyboard Nobody Redesigned",
      topic: "why a layout built for a mechanical problem outlived the mechanism",
      difficulty: 6,
      body: `The arrangement of letters on the keyboard in front of almost every English-speaking typist was settled in the 1870s for a machine with metal type bars, and it has survived the disappearance of that machine, the arrival of the electric typewriter, the word processor, the personal computer and the telephone. It is an unusually clear example of an arrangement that persists because it exists.

The story usually told about it is that the layout was designed to slow typists down so that the mechanism could keep up. This is not quite right, and the difference matters. The early machines had type bars arranged in a circle beneath the paper; each struck the same point, and if two bars adjacent in the circle were struck in quick succession the second could catch the first as it fell back, and the machine jammed. The problem was not typing speed as such but the collision of neighbouring bars. Separating the letters that commonly follow one another in English put their bars far apart in the circle and made a collision less likely. The aim was to make the machine work faster, not the typist slower.

Quite how deliberate the arrangement was is disputed. The layout emerged over several years of modification by Christopher Latham Sholes and his collaborators, in response to complaints from the people testing the prototypes, and it was altered again by the manufacturer before the machine went on sale. One account gives a large role to telegraph operators transcribing Morse, who found certain sequences awkward in the earlier arrangements. The surviving correspondence is thin, and reasonable historians disagree about which changes were made for which reason.

What is not disputed is what happened next. The machine that carried the layout was commercially successful; typing schools taught the layout because that was the machine their students would meet; employers bought the machine because that was what trained typists could use; and manufacturers of competing machines adopted the layout because otherwise nobody could use their product without retraining. Each of those decisions was rational for whoever made it, and together they closed the question within about twenty years.

Alternatives have been proposed continually. The best known was patented in 1936 by August Dvorak, who placed the most frequent letters on the home row and distributed the work more evenly between the hands. On paper the advantages are substantial: less finger travel, fewer awkward sequences, and a larger proportion of words typeable without leaving the home row. Dvorak and his associates conducted studies reporting large gains in speed and reductions in error.

Those studies have not held up well. The most-cited of them were run by people with a direct interest in the result, used small numbers of typists, and in several cases compared retrained enthusiasts with ordinary office staff. Later evaluations, including one carried out for the United States government, found the advantage to be small — of the order of a few per cent — and not large enough to repay the cost of retraining an existing workforce. Independent work since has broadly confirmed this: the alternative layout is somewhat better, and not better enough.

This is the interesting part of the case rather than an anticlimax. The survival of the layout is often told as a story about a bad standard trapping everybody, and the evidence suggests something less dramatic and more awkward: the standard is mediocre, the alternative is mildly superior, and the cost of coordinating a change exceeds the benefit. That is a much harder situation to criticise, because nobody is behaving irrationally at any point.

Two developments have tested the layout without displacing it. The phone keyboard removed the mechanical reason for the arrangement entirely and could have used anything; manufacturers used the familiar layout, because a user who has to learn a new one will buy a different phone. And predictive text has made the precise position of the keys less important than it was, since a substantial proportion of what appears on the screen was never typed in full at all.

The layout does have real costs, and they are not the ones usually cited. The letters typed by the left hand are more frequent than those typed by the right, which is awkward for the large majority of people who are right-handed. Several common words are typed entirely with one hand. And the arrangement is designed around English: the same physical keyboard is used with adaptations for languages whose letter frequencies are quite different, and it suits none of them especially well.

It is worth being clear about what the case does and does not show. It is not an example of the worst option winning. It is an example of a decision taken early, for reasons that stopped applying almost immediately, and never reopened, because reopening it would cost more than the improvement is worth to anybody who would have to pay for it.`,
      questions: [
        tfng(
          "The layout was intended to make typists work more slowly.",
          "FALSE",
          "The aim was to make the machine work faster, not the typist slower.",
          "The aim was a faster machine, not a slower typist.",
        ),
        tfng(
          "Two type bars next to each other could collide if struck in quick succession.",
          "TRUE",
          "The early machines had type bars arranged in a circle beneath the paper; each struck the same point, and if two bars adjacent in the circle were struck in quick succession the second could catch the first as it fell back, and the machine jammed.",
          "The second bar 'could catch the first'.",
        ),
        tfng(
          "Historians agree about the reason for each change to the arrangement.",
          "FALSE",
          "The surviving correspondence is thin, and reasonable historians disagree about which changes were made for which reason.",
          "Historians 'disagree about which changes were made for which reason'.",
        ),
        tfng(
          "Rival manufacturers copied the layout to spare their customers retraining.",
          "TRUE",
          "The machine that carried the layout was commercially successful; typing schools taught the layout because that was the machine their students would meet; employers bought the machine because that was what trained typists could use; and manufacturers of competing machines adopted the layout because otherwise nobody could use their product without retraining.",
          "Otherwise nobody 'could use their product without retraining'.",
        ),
        tfng(
          "Dvorak's own trials involved large numbers of typists.",
          "FALSE",
          "The most-cited of them were run by people with a direct interest in the result, used small numbers of typists, and in several cases compared retrained enthusiasts with ordinary office staff.",
          "They 'used small numbers of typists'.",
        ),
        tfng(
          "The left hand types more of the frequent letters than the right does.",
          "TRUE",
          "The letters typed by the left hand are more frequent than those typed by the right, which is awkward for the large majority of people who are right-handed.",
          "The left hand's letters 'are more frequent'.",
        ),
        tfng(
          "Dvorak earned a substantial income from his patent.",
          "NOT GIVEN",
          "",
          "The passage says nothing about what the patent earned.",
        ),
        noteLine(
          LAYOUT_NOTES,
          null,
          "Typing ______ taught it because that was the machine students would meet",
          "schools",
          "The machine that carried the layout was commercially successful; typing schools taught the layout because that was the machine their students would meet; employers bought the machine because that was what trained typists could use; and manufacturers of competing machines adopted the layout because otherwise nobody could use their product without retraining.",
          "Typing schools taught the layout.",
          { before: [{ text: "Each step was reasonable on its own:", indent: 0 }] },
        ),
        noteLine(
          LAYOUT_NOTES,
          null,
          "Employers bought the machine that trained ______ could already use",
          "typists",
          "The machine that carried the layout was commercially successful; typing schools taught the layout because that was the machine their students would meet; employers bought the machine because that was what trained typists could use; and manufacturers of competing machines adopted the layout because otherwise nobody could use their product without retraining.",
          "It was what 'trained typists could use'.",
        ),
        noteLine(
          LAYOUT_NOTES,
          null,
          "Together the decisions closed the question in roughly twenty ______",
          "years",
          "Each of those decisions was rational for whoever made it, and together they closed the question within about twenty years.",
          "They closed it 'within about twenty years'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Dvorak put the commonest letters on the ______.",
          "home row",
          "The best known was patented in 1936 by August Dvorak, who placed the most frequent letters on the home row and distributed the work more evenly between the hands.",
          "He placed them 'on the home row'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "An evaluation carried out for the United States ______ found only a small gain.",
          "government",
          "Later evaluations, including one carried out for the United States government, found the advantage to be small — of the order of a few per cent — and not large enough to repay the cost of retraining an existing workforce.",
          "One was done 'for the United States government'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Predictive ______ has reduced how much the key positions matter.",
          "text",
          "And predictive text has made the precise position of the keys less important than it was, since a substantial proportion of what appears on the screen was never typed in full at all.",
          "Predictive text made position 'less important'.",
        ),
      ],
    },
    {
      key: "t69-p2-vaccine-cold-chain",
      title: "Keeping the Vaccine Cold",
      topic: "the refrigerated supply line that decides whether a vaccination programme works",
      difficulty: 7,
      body: `A vaccine is a biological product, and most biological products are damaged by heat. The consequence is a logistical requirement that has shaped public health for seventy years: a vaccine must be kept within a narrow band of temperature from the moment it leaves the factory until the moment it enters an arm, across every warehouse, aircraft, lorry, clinic refrigerator and cold box on the way. That unbroken sequence is called the cold chain, and it is the part of a vaccination programme most likely to fail.

The usual requirement is between two and eight degrees Celsius. What is less widely understood is that the lower bound matters as much as the upper. Adaeze Nwachukwu, who has audited storage in district clinics, reports that freezing is the more common fault and the more damaging one: several widely used vaccines contain an aluminium adjuvant that is irreversibly altered by freezing, so the product looks unchanged, is administered normally and does not work. A refrigerator that is too cold produces no visible sign of a problem and no complaint from anybody.

Detecting a failure after the fact is therefore central, and the most successful tool is also the simplest. A vaccine vial monitor is a small square of heat-sensitive material printed on the label, which darkens progressively as it absorbs heat and is compared against a printed reference ring; when the square is as dark as the ring, the vial is discarded. Bram Oosterhuis, who worked on the introduction of the monitors, emphasises that their value is not precision but that they move the decision to the person holding the vial, requiring no instrument, no record and no literacy in any particular language.

The monitors changed practice in an unexpected direction. Because a health worker could see that a particular vial was still good, vaccines could be taken out of the refrigerator and carried for days to reach remote populations, a practice previously forbidden. The number of doses discarded fell rather than rose, because the decision was being made on the state of the individual vial rather than on a rule about how long it had been out.

Electricity is the constraint that determines everything else. A clinic with an unreliable supply cannot hold a conventional refrigerator at a stable temperature, and the traditional answer — a kerosene or gas absorption refrigerator — requires a fuel supply chain of its own and frequently runs too cold. Leena Kulkarni, who evaluates equipment for national programmes, argues that the significant advance of the past two decades is not any new coolant but the solar direct-drive refrigerator, which runs from a panel with no battery: it freezes a lining of water while the sun is up and then coasts on that ice for several days, which removes the component that used to fail first. She is blunt that batteries were the weak point in every earlier design, and that removing them mattered more than any improvement in insulation.

The last stretch is the hardest and the least documented. A vaccine may travel correctly for four thousand kilometres and then spend six hours in a cold box on the back of a motorcycle. Santiago Vergara, who has instrumented that final journey with data loggers, finds that most excursions outside the permitted range happen in the last few hours and during transfers between containers, and that they are almost never recorded, because nobody is watching at that point and the paperwork is completed afterwards from memory.

Two developments are changing the shape of the problem rather than solving it. The first is a category of vaccine needing much colder storage: some products based on messenger RNA require temperatures around minus seventy degrees, which calls for specialised freezers, dry ice and an entirely separate distribution system, and which cannot be deployed through the existing chain at all. The second is the opposite — deliberate engineering for stability. Formulating a vaccine as a dried powder, or in a sugar glass that immobilises the molecules, can produce a product tolerating weeks at ambient temperature, and a small number of such products are now licensed.

Stability is not pursued as vigorously as the logistics would justify, and the reason is financial rather than scientific. The cost of the cold chain falls on health systems, while the cost of reformulating and re-licensing a product falls on the manufacturer, and the manufacturer receives no part of the saving. A heat-stable version of an existing vaccine is an expensive project whose benefit accrues entirely to somebody else.

The cold chain is a good illustration of where the difficulty in public health usually lies. The science of making a vaccine is hard and is done once; the business of getting it into a person in a place with four hours of electricity a day is comparatively unglamorous, is done continually, and is where the programmes that fail actually fail.`,
      questions: [
        fromList(
          "matching_features",
          CHAIN_PEOPLE,
          "Excessive cold is the commoner and the more serious failure.",
          "Adaeze Nwachukwu",
          "Adaeze Nwachukwu, who has audited storage in district clinics, reports that freezing is the more common fault and the more damaging one: several widely used vaccines contain an aluminium adjuvant that is irreversibly altered by freezing, so the product looks unchanged, is administered normally and does not work.",
          "Nwachukwu identifies freezing as the worse fault.",
        ),
        fromList(
          "matching_features",
          CHAIN_PEOPLE,
          "The indicator's strength is that it puts the decision in the user's hands.",
          "Bram Oosterhuis",
          "Bram Oosterhuis, who worked on the introduction of the monitors, emphasises that their value is not precision but that they move the decision to the person holding the vial, requiring no instrument, no record and no literacy in any particular language.",
          "Oosterhuis values where the decision sits.",
        ),
        fromList(
          "matching_features",
          CHAIN_PEOPLE,
          "Removing one component from the design mattered more than better insulation.",
          "Leena Kulkarni",
          "She is blunt that batteries were the weak point in every earlier design, and that removing them mattered more than any improvement in insulation.",
          "Kulkarni points to the battery.",
        ),
        fromList(
          "matching_features",
          CHAIN_PEOPLE,
          "Most breaches happen at the very end of the journey and go unrecorded.",
          "Santiago Vergara",
          "Santiago Vergara, who has instrumented that final journey with data loggers, finds that most excursions outside the permitted range happen in the last few hours and during transfers between containers, and that they are almost never recorded, because nobody is watching at that point and the paperwork is completed afterwards from memory.",
          "Vergara measured the last stretch.",
        ),
        fromList(
          "summary_completion",
          CHAIN_BANK,
          "An aluminium ______ in several vaccines is permanently altered by cold.",
          "adjuvant",
          "Adaeze Nwachukwu, who has audited storage in district clinics, reports that freezing is the more common fault and the more damaging one: several widely used vaccines contain an aluminium adjuvant that is irreversibly altered by freezing, so the product looks unchanged, is administered normally and does not work.",
          "The adjuvant is altered irreversibly.",
        ),
        fromList(
          "summary_completion",
          CHAIN_BANK,
          "A vial ______ printed on the label darkens as it absorbs heat.",
          "monitor",
          "A vaccine vial monitor is a small square of heat-sensitive material printed on the label, which darkens progressively as it absorbs heat and is compared against a printed reference ring; when the square is as dark as the ring, the vial is discarded.",
          "The vial monitor darkens with heat.",
        ),
        fromList(
          "summary_completion",
          CHAIN_BANK,
          "A direct-drive refrigerator runs from a ______ panel and needs no battery.",
          "solar",
          "Leena Kulkarni, who evaluates equipment for national programmes, argues that the significant advance of the past two decades is not any new coolant but the solar direct-drive refrigerator, which runs from a panel with no battery: it freezes a lining of water while the sun is up and then coasts on that ice for several days, which removes the component that used to fail first.",
          "It is a solar direct-drive design.",
        ),
        fromList(
          "summary_completion",
          CHAIN_BANK,
          "It freezes a lining of water and then coasts on the ______.",
          "ice",
          "Leena Kulkarni, who evaluates equipment for national programmes, argues that the significant advance of the past two decades is not any new coolant but the solar direct-drive refrigerator, which runs from a panel with no battery: it freezes a lining of water while the sun is up and then coasts on that ice for several days, which removes the component that used to fail first.",
          "It 'coasts on that ice'.",
        ),
        fromList(
          "summary_completion",
          CHAIN_BANK,
          "The final stage of the journey was measured with data ______.",
          "loggers",
          "Santiago Vergara, who has instrumented that final journey with data loggers, finds that most excursions outside the permitted range happen in the last few hours and during transfers between containers, and that they are almost never recorded, because nobody is watching at that point and the paperwork is completed afterwards from memory.",
          "He used data loggers.",
        ),
        mcq(
          "What happens to a frozen vaccine containing an aluminium adjuvant?",
          [
            "It appears normal and does not work",
            "It changes colour visibly",
            "It becomes dangerous to administer",
            "It recovers once it is warmed",
          ],
          "It appears normal and does not work",
          "Adaeze Nwachukwu, who has audited storage in district clinics, reports that freezing is the more common fault and the more damaging one: several widely used vaccines contain an aluminium adjuvant that is irreversibly altered by freezing, so the product looks unchanged, is administered normally and does not work.",
          "It 'looks unchanged' and 'does not work'.",
        ),
        mcq(
          "What was the unexpected consequence of the vial monitors?",
          [
            "Fewer doses were thrown away",
            "Refrigerators were used less often",
            "Vaccines were stored colder than before",
            "Record-keeping became more detailed",
          ],
          "Fewer doses were thrown away",
          "The number of doses discarded fell rather than rose, because the decision was being made on the state of the individual vial rather than on a rule about how long it had been out.",
          "Discards 'fell rather than rose'.",
        ),
        mcq(
          "Why can some newer vaccines not use the existing chain?",
          [
            "They need temperatures near minus seventy",
            "They cannot be carried by air",
            "They have to be mixed at the clinic",
            "They expire within a single day",
          ],
          "They need temperatures near minus seventy",
          "The first is a category of vaccine needing much colder storage: some products based on messenger RNA require temperatures around minus seventy degrees, which calls for specialised freezers, dry ice and an entirely separate distribution system, and which cannot be deployed through the existing chain at all.",
          "They need about minus seventy degrees.",
        ),
        mcq(
          "Why is heat stability not pursued more actively?",
          [
            "The saving goes to somebody other than the payer",
            "The chemistry involved is not understood",
            "Regulators will not license dried vaccines",
            "Health systems prefer to use refrigeration",
          ],
          "The saving goes to somebody other than the payer",
          "The cost of the cold chain falls on health systems, while the cost of reformulating and re-licensing a product falls on the manufacturer, and the manufacturer receives no part of the saving.",
          "The manufacturer 'receives no part of the saving'.",
        ),
      ],
    },
    {
      key: "t69-p3-citation-metrics",
      title: "Counting What Cannot Be Counted",
      topic: "how far the measurement of research can carry the decisions built on it",
      difficulty: 8,
      body: `A) Research is now counted. A university is ranked partly on the citations its papers accumulate, an individual is described by an index derived from them, a journal carries a number calculated from the average citations of its recent articles, and hiring, promotion and funding decisions are influenced by all three. None of these measures was designed for the purpose it is now used for, and the history of each is worth knowing, because in every case a tool built to solve a small problem has been promoted to a judgement it cannot support.

B) The journal impact factor was devised in the 1960s to help librarians decide which journals to buy. It is the mean number of citations received in one year by the articles a journal published in the preceding two. As a purchasing aid it is entirely reasonable. As a measure of an individual paper it is close to meaningless, because citations within a journal are distributed extremely unevenly: in a typical journal a small minority of papers attracts most of the citations, and the median paper receives far fewer than the mean. Describing a paper by the average of the journal it appeared in is like describing a person's income by the average of their street.

C) The index most used for individuals has a different defect. It reports the largest number of papers an author has that each have at least that many citations. It was proposed as a single figure harder to distort than a raw count, and in that narrow sense it works. But it rises with career length and cannot fall, it rewards a steady accumulation of moderately cited work over a small number of important papers, and it is not comparable between fields, since citation rates in mathematics and in molecular biology differ by more than an order of magnitude.

D) The deeper problem is not technical, and correcting the arithmetic will not address it. A citation is not an endorsement. Papers are cited to be disagreed with, to be listed in a perfunctory review of the literature, to acknowledge a method being used, and to flatter a potential referee. Retracted papers continue to accumulate citations for years after retraction, frequently as though nothing had happened. A count treats all of these identically, because it is a count.

E) What follows is predictable and has been observed everywhere the measures have been applied with force. Researchers divide a piece of work into as many publishable units as it will bear. Authorship lists lengthen. Review articles, which attract citations at several times the rate of primary research, become disproportionately attractive to write. Journals negotiate over the classification of their content and encourage citation of their own back catalogue. None of this requires dishonesty. It requires only that people respond to what they are measured on, which is the most reliable finding in the whole of social science.

F) I want to be careful not to overstate the case, because the argument against measurement is often made badly. Bibliometrics does tell you something: a paper with four hundred citations has had an effect a paper with four has not, and at the level of a large aggregate the noise averages out in a way it does not for an individual. The alternative to counting is not an absence of judgement but a different judgement, made by committees drawn from the same small pool, and that judgement has its own well-documented biases in favour of established names and familiar approaches. Anybody who thinks abolishing the numbers would produce a fairer system has not read the literature on how appointments were made before there were any.

G) The position I would defend is narrow. The numbers are evidence and should be used as evidence: consulted, weighted, and set against a reading of the work itself, which in most fields means somebody actually reading a few papers. What they cannot do is function as a decision procedure, and the reason they are used as one anyway is that a decision procedure is quick, is defensible in writing, and transfers responsibility from the panel to the arithmetic. That last property is why the practice persists, and it is not a scientific reason.`,
      questions: [
        fromList(
          "matching_information",
          METRIC_PARAGRAPHS,
          "the original purpose of a measure now applied to single papers",
          "B",
          "The journal impact factor was devised in the 1960s to help librarians decide which journals to buy.",
          "Paragraph B gives the librarians' purpose.",
        ),
        fromList(
          "matching_information",
          METRIC_PARAGRAPHS,
          "a set of behaviours that measurement reliably produces",
          "E",
          "Researchers divide a piece of work into as many publishable units as it will bear.",
          "Paragraph E lists the induced behaviours.",
        ),
        fromList(
          "matching_information",
          METRIC_PARAGRAPHS,
          "an acknowledgement that expert judgement has biases of its own",
          "F",
          "The alternative to counting is not an absence of judgement but a different judgement, made by committees drawn from the same small pool, and that judgement has its own well-documented biases in favour of established names and familiar approaches.",
          "Paragraph F concedes the committee biases.",
        ),
        fromList(
          "matching_information",
          METRIC_PARAGRAPHS,
          "a reason why counting cannot separate approval from criticism",
          "D",
          "Papers are cited to be disagreed with, to be listed in a perfunctory review of the literature, to acknowledge a method being used, and to flatter a potential referee.",
          "Paragraph D lists the reasons papers are cited.",
        ),
        fromList(
          "matching_information",
          METRIC_PARAGRAPHS,
          "an explanation of why one measure can never decrease",
          "C",
          "But it rises with career length and cannot fall, it rewards a steady accumulation of moderately cited work over a small number of important papers, and it is not comparable between fields, since citation rates in mathematics and in molecular biology differ by more than an order of magnitude.",
          "Paragraph C says the index 'cannot fall'.",
        ),
        ynng(
          "The writer thinks the impact factor is a reasonable guide for a library.",
          "YES",
          "As a purchasing aid it is entirely reasonable.",
          "It is 'entirely reasonable' as a purchasing aid.",
        ),
        ynng(
          "The writer believes the behaviour the measures produce requires dishonesty.",
          "NO",
          "None of this requires dishonesty.",
          "'None of this requires dishonesty'.",
        ),
        ynng(
          "The writer accepts that citation counts carry some information.",
          "YES",
          "Bibliometrics does tell you something: a paper with four hundred citations has had an effect a paper with four has not, and at the level of a large aggregate the noise averages out in a way it does not for an individual.",
          "It 'does tell you something'.",
        ),
        ynng(
          "The writer thinks removing the numbers would make appointments fairer.",
          "NO",
          "Anybody who thinks abolishing the numbers would produce a fairer system has not read the literature on how appointments were made before there were any.",
          "Such a person 'has not read the literature'.",
        ),
        fromList(
          "matching_sentence_endings",
          METRIC_ENDINGS,
          "A journal average says little about any individual article in it,",
          "because most of a journal's citations go to a small number of its papers.",
          "As a measure of an individual paper it is close to meaningless, because citations within a journal are distributed extremely unevenly: in a typical journal a small minority of papers attracts most of the citations, and the median paper receives far fewer than the mean.",
          "A minority of papers takes most citations.",
        ),
        fromList(
          "matching_sentence_endings",
          METRIC_ENDINGS,
          "The index used for individuals cannot be compared across subjects,",
          "since rates of citation differ enormously from one discipline to another.",
          "But it rises with career length and cannot fall, it rewards a steady accumulation of moderately cited work over a small number of important papers, and it is not comparable between fields, since citation rates in mathematics and in molecular biology differ by more than an order of magnitude.",
          "Rates differ by an order of magnitude.",
        ),
        fromList(
          "matching_sentence_endings",
          METRIC_ENDINGS,
          "Withdrawn work goes on collecting citations for years,",
          "because a count cannot tell approval and disagreement apart.",
          "Retracted papers continue to accumulate citations for years after retraction, frequently as though nothing had happened.",
          "A count cannot mark a retraction.",
        ),
        fromList(
          "matching_sentence_endings",
          METRIC_ENDINGS,
          "Being measured on citations changes what researchers choose to write,",
          "which is why review articles become unusually attractive to write.",
          "Review articles, which attract citations at several times the rate of primary research, become disproportionately attractive to write.",
          "Reviews attract citations faster.",
        ),
        fromList(
          "matching_sentence_endings",
          METRIC_ENDINGS,
          "The numbers survive as a decision procedure because they shift responsibility,",
          "which the writer regards as the real reason the practice continues.",
          "That last property is why the practice persists, and it is not a scientific reason.",
          "That property 'is why the practice persists'.",
        ),
      ],
    },
  ],
};
