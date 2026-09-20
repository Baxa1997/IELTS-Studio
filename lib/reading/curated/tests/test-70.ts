import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · insect life cycles · notes box -----------------------------

const CICADA_NOTES = {
  title: "Why the numbers are so large",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · social history · people and a word bank -------------------

const LIBRARY_PEOPLE = [
  "Wilhelmina Frayne",
  "Osei Mensah",
  "Clara Battistini",
  "Douglas Merrick",
];
const LIBRARY_BANK = [
  "subscription",
  "rates",
  "stacks",
  "browse",
  "loans",
  "newspapers",
  "buildings",
  "staff",
  "computer",
];

// ---- Passage 3 · workplace design · lettered paragraphs --------------------

const OFFICE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const OFFICE_ENDINGS = [
  "because roughly twice as many people fit into the same floor area.",
  "although the measured fall in face-to-face conversation was very large.",
  "which is why people retreat into channels they are able to control.",
  "since a sentence nearby is processed whether or not it is wanted.",
  "because junior staff learn a great deal from overhearing competent work.",
  "which the writer thinks gets the logic exactly the wrong way round.",
  "even though the original designers had reached the opposite conclusion.",
];

export const TEST_70: CuratedTest = {
  key: "full-test-70",
  targetBand: 5,
  passages: [
    {
      key: "t70-p1-periodical-cicadas",
      title: "The Insects That Count the Years",
      topic: "an insect that spends seventeen years underground and four weeks above it",
      difficulty: 4,
      body: `In parts of the eastern United States, once every thirteen or seventeen years, the ground produces insects in numbers that are hard to believe. A million cicadas may emerge from under a single hectare of woodland. They climb the nearest tree, shed their skins, and the males begin to call. For about four weeks the noise is loud enough to make conversation difficult. Then they mate, lay eggs and die, and the woods are silent for another thirteen or seventeen years.

These are the periodical cicadas, and there is nothing quite like them. Most cicadas around the world appear every year, in ordinary numbers. The periodical species do something different: every individual in a population emerges in the same year, and the gap between one emergence and the next is always thirteen years or always seventeen.

The young insects spend that time underground. They hatch from eggs laid in the twigs of trees, drop to the ground, dig down and attach themselves to a root. There they feed on the thin sap the root carries, which is a poor diet and explains why growing up takes so long. They pass through five stages of development, moving deeper and then shallower, and they do not see daylight again until the year of the emergence.

How they count the years is not fully understood. The most likely explanation is that the insects sense the annual cycle of the tree above them: the flow of sap changes each spring as the tree comes into leaf, and a cicada attached to a root could in principle count those changes. Support for this comes from an experiment in which trees were made to flower twice in one year; the cicadas feeding on them emerged a year early. Something in the plant, rather than a clock in the insect, appears to do the counting.

The final signal is temperature. Once the right year has arrived, the insects wait in the soil until it reaches about eighteen degrees Celsius at the depth where they are living, which in practice means late spring. This is why an emergence in a warm southern location happens weeks before one further north.

The obvious question is why the numbers are so enormous, and the answer generally accepted is that the strategy is a defence. A cicada is slow, soft and entirely harmless. It cannot fight, hide or run. What it can do is arrive at the same moment as millions of others. Birds, squirrels, snakes and raccoons eat as many as they can, become full and stop; the great majority of the insects are simply not eaten, because there is far more food than there are mouths. Biologists call this predator satiation, and it only works if the arrival is sudden and overwhelming.

The long gap is thought to serve the same purpose from a different direction. Any predator that specialised in cicadas would starve in the sixteen years between meals, so no predator can specialise in them. A shorter cycle would allow a specialist to survive; a very long one makes it impossible.

Thirteen and seventeen are both prime numbers, and this is unlikely to be chance. A prime cycle shares fewer common factors with the shorter cycles of possible predators. An insect emerging every twelve years would meet a predator with a two, three, four or six-year cycle regularly; one emerging every seventeen years meets a two-year predator only once in thirty-four. The argument is elegant and is not proved, because the predators it depends on may never have existed, and it remains one of the most-discussed ideas in the subject.

Each species is divided into broods, which are populations sharing an emergence year. There are around fifteen of them, each covering a particular region, and they are numbered. A brood may extend across several states, and the boundaries between them are mostly sharp, since an insect emerging in the wrong year finds no mates. Occasionally small numbers appear four years early, which is the sort of accident from which a new brood could form.

Whether the insects damage anything is a common worry and is largely misplaced. The adults do not eat leaves. The harm they do is mechanical: a female cuts slits in young twigs to lay her eggs, which can break the branches of a small or newly planted tree. A mature tree is unaffected, and orchards are usually protected by netting rather than by insecticide, since spraying cannot reduce numbers of that size.

What the emergence delivers to the forest is a very large quantity of nitrogen. Millions of dead insects decay on the ground within a few weeks. Measurements taken after emergences show increased tree growth in the following years, and a matching rise in the numbers of the animals that eat the insects, which falls again once the food has gone.`,
      questions: [
        tfng(
          "Most cicada species appear in the same very large numbers.",
          "FALSE",
          "Most cicadas around the world appear every year, in ordinary numbers.",
          "Most appear yearly 'in ordinary numbers'.",
        ),
        tfng(
          "The young insects feed on sap taken from tree roots.",
          "TRUE",
          "There they feed on the thin sap the root carries, which is a poor diet and explains why growing up takes so long.",
          "They feed on 'the thin sap the root carries'.",
        ),
        tfng(
          "Scientists have fully explained how the insects keep count of the years.",
          "FALSE",
          "How they count the years is not fully understood.",
          "It is 'not fully understood'.",
        ),
        tfng(
          "Insects feeding on trees made to flower twice came out a year early.",
          "TRUE",
          "Support for this comes from an experiment in which trees were made to flower twice in one year; the cicadas feeding on them emerged a year early.",
          "They 'emerged a year early'.",
        ),
        tfng(
          "An emergence happens earlier in the south than in the north.",
          "TRUE",
          "This is why an emergence in a warm southern location happens weeks before one further north.",
          "The southern one comes 'weeks before'.",
        ),
        tfng(
          "The prime-number explanation has been proved.",
          "FALSE",
          "The argument is elegant and is not proved, because the predators it depends on may never have existed, and it remains one of the most-discussed ideas in the subject.",
          "The argument 'is not proved'.",
        ),
        tfng(
          "The insects are eaten by people in some regions.",
          "NOT GIVEN",
          "",
          "The passage lists animal predators only and never mentions people eating them.",
        ),
        noteLine(
          CICADA_NOTES,
          null,
          "Predators eat as many as they can, become ______ and stop",
          "full",
          "Birds, squirrels, snakes and raccoons eat as many as they can, become full and stop; the great majority of the insects are simply not eaten, because there is far more food than there are mouths.",
          "They 'become full and stop'.",
          { before: [{ text: "The numbers themselves are the defence:", indent: 0 }] },
        ),
        noteLine(
          CICADA_NOTES,
          null,
          "Biologists call this predator ______",
          "satiation",
          "Biologists call this predator satiation, and it only works if the arrival is sudden and overwhelming.",
          "The term is 'predator satiation'.",
        ),
        noteLine(
          CICADA_NOTES,
          null,
          "The long gap means no predator can ______ in them",
          "specialise",
          "Any predator that specialised in cicadas would starve in the sixteen years between meals, so no predator can specialise in them.",
          "'No predator can specialise in them'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A population that shares one emergence year is called a ______.",
          "brood",
          "Each species is divided into broods, which are populations sharing an emergence year.",
          "Such a population is a brood.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The insects wait until the soil reaches about eighteen ______.",
          "degrees Celsius",
          "Once the right year has arrived, the insects wait in the soil until it reaches about eighteen degrees Celsius at the depth where they are living, which in practice means late spring.",
          "They wait for 'about eighteen degrees Celsius'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A female lays her eggs in slits cut into young ______.",
          "twigs",
          "The harm they do is mechanical: a female cuts slits in young twigs to lay her eggs, which can break the branches of a small or newly planted tree.",
          "She cuts slits 'in young twigs'.",
        ),
      ],
    },
    {
      key: "t70-p2-public-library",
      title: "A Room Where the Books Were Free",
      topic: "how the free public library was argued into existence and what it does now",
      difficulty: 5,
      body: `A free public library is such an ordinary institution that the argument required to create it is easy to forget. For most of the history of the book, reading was something paid for. Books were expensive, and a person who wanted to read without buying had three options: a subscription library, which charged an annual fee; a commercial circulating library, which rented books by the volume; or the collection of an institution that would not admit them.

Wilhelmina Frayne, who has written on the reading habits of the nineteenth century, stresses that the demand existed long before the supply. Working people organised their own reading, pooling money to buy shared volumes, founding mutual improvement societies and paying a penny a week into small collections kept in a back room. The idea that a library had to be given to the public from above is a later invention; what the public lacked was money, not interest.

The legislation came slowly and against resistance. A British act of 1850 allowed local authorities to fund a library from the rates, and did so with heavy conditions: a two-thirds majority of ratepayers had to agree, no money could be spent on books, and the charge was capped. Several towns voted the proposal down repeatedly. Osei Mensah, who has studied the parliamentary debates, points out that the objections were rarely about cost. They were about what would be read, and by whom: opponents argued openly that giving working men access to newspapers would make them discontented, and that a reading room would simply become a warm place for idlers.

The model that eventually spread came from the United States, and it came with a condition attached. Andrew Carnegie funded the construction of some two and a half thousand library buildings, on the rule that he would pay for the building and the town must commit permanently to paying for the books and the staff. Clara Battistini, who has examined how those rooms were used, argues that the condition mattered more than the money, because it converted a one-off gift into a permanent line in a municipal budget and made the library a public service rather than a charity.

What the buildings were used for was not always what had been intended. Many were designed on the assumption that a librarian would fetch books from closed stacks, and were rebuilt within a generation to allow open shelves, because readers overwhelmingly preferred to browse. Reading rooms filled with people consulting newspapers for work, and in some towns the newspaper room was busier than the lending department.

The institution has been declared obsolete at intervals ever since, and the pattern of those predictions is instructive. Radio was expected to end it, then paperbacks, then television, then the internet. Douglas Merrick, who has tracked library use over four decades, notes that visits have risen and fallen with funding far more closely than with any technology, and that the closures usually attributed to the internet followed reductions in opening hours by several years.

What a library is for has nonetheless changed, and the change is uncomfortable for an institution that likes to describe itself in terms of books. Lending has fallen in most countries. Use of the building has not fallen nearly as much, because people come to use a computer, to apply for something online, to attend a session for small children, to sit somewhere warm and quiet, or to ask a member of staff for help with a form. A significant part of the modern library's work is assisting people with government services that are now available only on a screen.

That shift creates a difficulty in measurement. A library's value has traditionally been counted in loans, and loans are exactly the activity that has declined, so a service can be doing more than it ever did and reporting a fall. Several countries have tried to build wider measures, counting visits, event attendance and computer sessions, and the results are hard to compare between one authority and another.

The oldest argument for the library remains the strongest, and it has almost nothing to do with technology. A public library is one of the few remaining places a person may enter, stay for hours, use the facilities and leave, without buying anything or explaining themselves. Almost every other indoor space in a town now requires a purchase or an appointment. Whatever happens to the printed book, that property is not supplied by anything else.`,
      questions: [
        fromList(
          "matching_features",
          LIBRARY_PEOPLE,
          "The appetite for reading was there long before any public provision.",
          "Wilhelmina Frayne",
          "Wilhelmina Frayne, who has written on the reading habits of the nineteenth century, stresses that the demand existed long before the supply.",
          "Frayne puts demand before supply.",
        ),
        fromList(
          "matching_features",
          LIBRARY_PEOPLE,
          "The objections raised in Parliament were about readers, not expense.",
          "Osei Mensah",
          "Osei Mensah, who has studied the parliamentary debates, points out that the objections were rarely about cost.",
          "Mensah found the objections were not about cost.",
        ),
        fromList(
          "matching_features",
          LIBRARY_PEOPLE,
          "Attaching a permanent obligation mattered more than the gift itself.",
          "Clara Battistini",
          "Clara Battistini, who has examined how those rooms were used, argues that the condition mattered more than the money, because it converted a one-off gift into a permanent line in a municipal budget and made the library a public service rather than a charity.",
          "Battistini values the condition over the money.",
        ),
        fromList(
          "matching_features",
          LIBRARY_PEOPLE,
          "Use has followed funding more closely than it has followed technology.",
          "Douglas Merrick",
          "Douglas Merrick, who has tracked library use over four decades, notes that visits have risen and fallen with funding far more closely than with any technology, and that the closures usually attributed to the internet followed reductions in opening hours by several years.",
          "Merrick ties use to funding.",
        ),
        fromList(
          "summary_completion",
          LIBRARY_BANK,
          "Before public provision, a ______ library charged a yearly fee.",
          "subscription",
          "Books were expensive, and a person who wanted to read without buying had three options: a subscription library, which charged an annual fee; a commercial circulating library, which rented books by the volume; or the collection of an institution that would not admit them.",
          "A subscription library charged annually.",
        ),
        fromList(
          "summary_completion",
          LIBRARY_BANK,
          "The 1850 act let authorities pay for a library out of the ______.",
          "rates",
          "A British act of 1850 allowed local authorities to fund a library from the rates, and did so with heavy conditions: a two-thirds majority of ratepayers had to agree, no money could be spent on books, and the charge was capped.",
          "Funding came 'from the rates'.",
        ),
        fromList(
          "summary_completion",
          LIBRARY_BANK,
          "Carnegie paid for the ______ and the town for everything inside.",
          "buildings",
          "Andrew Carnegie funded the construction of some two and a half thousand library buildings, on the rule that he would pay for the building and the town must commit permanently to paying for the books and the staff.",
          "He funded the buildings only.",
        ),
        fromList(
          "summary_completion",
          LIBRARY_BANK,
          "Closed ______ were opened up because readers wanted to choose.",
          "stacks",
          "Many were designed on the assumption that a librarian would fetch books from closed stacks, and were rebuilt within a generation to allow open shelves, because readers overwhelmingly preferred to browse.",
          "The closed stacks were rebuilt as open shelves.",
        ),
        fromList(
          "summary_completion",
          LIBRARY_BANK,
          "Value has been counted in ______, which is the activity that fell.",
          "loans",
          "A library's value has traditionally been counted in loans, and loans are exactly the activity that has declined, so a service can be doing more than it ever did and reporting a fall.",
          "Loans are what has declined.",
        ),
        mcq(
          "What did opponents of the 1850 act argue?",
          [
            "Access to newspapers would make workers discontented",
            "The buildings would cost too much to heat",
            "Books would be stolen from open shelves",
            "Libraries would take pupils away from schools",
          ],
          "Access to newspapers would make workers discontented",
          "They were about what would be read, and by whom: opponents argued openly that giving working men access to newspapers would make them discontented, and that a reading room would simply become a warm place for idlers.",
          "Newspapers would 'make them discontented'.",
        ),
        mcq(
          "Why were many of the buildings altered within a generation?",
          [
            "Readers preferred to choose books themselves",
            "The reading rooms had been built too small",
            "They had been put up in the wrong places",
            "Staff numbers had to be reduced",
          ],
          "Readers preferred to choose books themselves",
          "Many were designed on the assumption that a librarian would fetch books from closed stacks, and were rebuilt within a generation to allow open shelves, because readers overwhelmingly preferred to browse.",
          "Readers 'preferred to browse'.",
        ),
        mcq(
          "What does Merrick's work suggest about closures?",
          [
            "They came after cuts to opening hours",
            "They were caused by the internet",
            "They happened mainly in large cities",
            "They were reversed within a few years",
          ],
          "They came after cuts to opening hours",
          "Douglas Merrick, who has tracked library use over four decades, notes that visits have risen and fallen with funding far more closely than with any technology, and that the closures usually attributed to the internet followed reductions in opening hours by several years.",
          "Closures followed the cuts in hours.",
        ),
        mcq(
          "Which property of a library does the writer say nothing else supplies?",
          [
            "It can be used at length with no purchase",
            "It holds books that cannot be bought",
            "It is the only quiet place in a town",
            "It provides government services free",
          ],
          "It can be used at length with no purchase",
          "A public library is one of the few remaining places a person may enter, stay for hours, use the facilities and leave, without buying anything or explaining themselves.",
          "One may stay for hours 'without buying anything'.",
        ),
      ],
    },
    {
      key: "t70-p3-open-plan-offices",
      title: "The Wall That Was Taken Down",
      topic: "whether the open office delivers the collaboration it is chosen for",
      difficulty: 6,
      body: `A) The open-plan office arrived twice, for opposite reasons, and both are worth recording because the second is usually presented as though the first had not happened. The earliest large open floors, in the first decades of the twentieth century, were about supervision: rows of desks in a single room allowed one manager to see everybody at once. The second arrival, from the 1960s onwards, was justified in the opposite terms — as a way of dissolving hierarchy and encouraging people to talk to one another. The layout was the same. Only the explanation changed. Neither justification was tested against measurement before the floors were built, and only the second has since been tested at all.

B) The designers who developed the idea in the 1950s intended something considerably more careful than what was built from it. Their plan involved irregular groupings, plants, screens, low ceilings and a strict limit on the number of people in a space, arranged according to who actually needed to speak to whom. What spread was the cheap version: a large rectangular floor with identical desks in rows, which delivered the cost saving without any of the design. Roughly twice as many people fit in a given area, and the partition walls, individual lighting and separate heating of a cellular office all disappear.

C) The claim made for the open floor is that it increases communication between colleagues, and this has been tested more carefully than most management propositions. One study fitted employees with badges recording who spoke to whom and for how long, before and after a move from cellular offices to an open floor in the same organisation. Face-to-face interaction fell by about seventy per cent. Email and instant messaging between the same people rose substantially. The finding has been replicated, and the most plausible interpretation is that people who cannot control whether they are overheard withdraw into channels they can control.

D) The complaint employees themselves make is almost always about noise, and specifically about speech. Steady mechanical noise is tolerated reasonably well; a conversation is not, because language is processed involuntarily and a nearby sentence cannot be ignored in the way a fan can. Measured effects on tasks requiring short-term memory are consistent and moderate in size. This is the finding the design literature is least willing to discuss, because it cannot be fixed by anything except a wall.

E) There is a fair case on the other side that critics tend to skip. A cellular office is not automatically better: it isolates junior staff who learn a great deal by overhearing competent people work, it makes informal help harder to ask for, and it allocates the best space by rank. Some kinds of work genuinely benefit from proximity, and teams that have to coordinate continuously do report that a shared space helps them. The honest position is that different work needs different rooms, which is exactly the conclusion the original designers reached and the cheap version made impossible. Proximity is not a single good of which more is always better; it helps some tasks and ruins others.

F) What I find least defensible is the way the evidence is used. Open-plan layouts are chosen because they cost less per employee, which is a perfectly respectable reason, and are then justified by a claim about collaboration the measurements do not support. If the reason is money, the reason should be stated, because an organisation that says one thing and does another about something its staff experience for eight hours a day should not be surprised when its other announcements are discounted.

G) The remote-working argument has changed the question rather than settled it, and not in the direction most commentary assumes. If people come to an office two days a week for the things that are hard to do remotely — talking to each other, meeting new colleagues, being taught — then the office needs more enclosed space for concentrated work, not less, because the concentrated work now happens at home and the office has to accommodate what does not. The floor plan, in other words, is being chosen for the work that no longer happens there. Several organisations have responded by reducing floor space and removing the remaining private rooms, which manages to get the logic precisely the wrong way round.`,
      questions: [
        fromList(
          "matching_information",
          OFFICE_PARAGRAPHS,
          "a study that recorded who spoke to whom using worn devices",
          "C",
          "One study fitted employees with badges recording who spoke to whom and for how long, before and after a move from cellular offices to an open floor in the same organisation.",
          "Paragraph C describes the badge study.",
        ),
        fromList(
          "matching_information",
          OFFICE_PARAGRAPHS,
          "why a nearby conversation is harder to ignore than machinery",
          "D",
          "Steady mechanical noise is tolerated reasonably well; a conversation is not, because language is processed involuntarily and a nearby sentence cannot be ignored in the way a fan can.",
          "Paragraph D contrasts speech with a fan.",
        ),
        fromList(
          "matching_information",
          OFFICE_PARAGRAPHS,
          "the gap between what was designed and what was built",
          "B",
          "What spread was the cheap version: a large rectangular floor with identical desks in rows, which delivered the cost saving without any of the design.",
          "Paragraph B describes the cheap version.",
        ),
        fromList(
          "matching_information",
          OFFICE_PARAGRAPHS,
          "an argument that a private office has drawbacks of its own",
          "E",
          "A cellular office is not automatically better: it isolates junior staff who learn a great deal by overhearing competent people work, it makes informal help harder to ask for, and it allocates the best space by rank.",
          "Paragraph E lists the cellular office's faults.",
        ),
        fromList(
          "matching_information",
          OFFICE_PARAGRAPHS,
          "a criticism of the reason organisations give for their choice",
          "F",
          "If the reason is money, the reason should be stated, because an organisation that says one thing and does another about something its staff experience for eight hours a day should not be surprised when its other announcements are discounted.",
          "Paragraph F asks for the real reason.",
        ),
        ynng(
          "The writer accepts that cost is a legitimate reason for choosing the layout.",
          "YES",
          "Open-plan layouts are chosen because they cost less per employee, which is a perfectly respectable reason, and are then justified by a claim about collaboration the measurements do not support.",
          "Cost is 'a perfectly respectable reason'.",
        ),
        ynng(
          "The writer believes the measurements support the collaboration claim.",
          "NO",
          "Face-to-face interaction fell by about seventy per cent.",
          "Interaction fell rather than rose.",
        ),
        ynng(
          "The writer thinks the noise problem can be solved by better design.",
          "NO",
          "This is the finding the design literature is least willing to discuss, because it cannot be fixed by anything except a wall.",
          "Only a wall fixes it.",
        ),
        ynng(
          "The writer thinks part-time attendance increases the need for enclosed space.",
          "YES",
          "If people come to an office two days a week for the things that are hard to do remotely — talking to each other, meeting new colleagues, being taught — then the office needs more enclosed space for concentrated work, not less, because the concentrated work now happens at home and the office has to accommodate what does not.",
          "It needs 'more enclosed space, not less'.",
        ),
        fromList(
          "matching_sentence_endings",
          OFFICE_ENDINGS,
          "The cheap version of the layout spread for a financial reason,",
          "because roughly twice as many people fit into the same floor area.",
          "Roughly twice as many people fit in a given area, and the partition walls, individual lighting and separate heating of a cellular office all disappear.",
          "Twice as many people fit.",
        ),
        fromList(
          "matching_sentence_endings",
          OFFICE_ENDINGS,
          "Staff who can be overheard write to each other rather than speak,",
          "which is why people retreat into channels they are able to control.",
          "The finding has been replicated, and the most plausible interpretation is that people who cannot control whether they are overheard withdraw into channels they can control.",
          "They move to channels they control.",
        ),
        fromList(
          "matching_sentence_endings",
          OFFICE_ENDINGS,
          "Speech disrupts concentration more than machinery does,",
          "since a sentence nearby is processed whether or not it is wanted.",
          "Steady mechanical noise is tolerated reasonably well; a conversation is not, because language is processed involuntarily and a nearby sentence cannot be ignored in the way a fan can.",
          "Language is processed involuntarily.",
        ),
        fromList(
          "matching_sentence_endings",
          OFFICE_ENDINGS,
          "A private office is not automatically the better arrangement,",
          "because junior staff learn a great deal from overhearing competent work.",
          "A cellular office is not automatically better: it isolates junior staff who learn a great deal by overhearing competent people work, it makes informal help harder to ask for, and it allocates the best space by rank.",
          "It isolates the people who learn by listening.",
        ),
        fromList(
          "matching_sentence_endings",
          OFFICE_ENDINGS,
          "Removing the last private rooms from a hybrid office is a mistake,",
          "which the writer thinks gets the logic exactly the wrong way round.",
          "Several organisations have responded by reducing floor space and removing the remaining private rooms, which manages to get the logic precisely the wrong way round.",
          "That reverses the logic.",
        ),
      ],
    },
  ],
};
