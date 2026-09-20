import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · timekeeping policy · notes box ------------------------------

const CLOCK_NOTES = {
  title: "The argument as originally made",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · official statistics · people and a word bank --------------

const CENSUS_PEOPLE = ["Marisol Ferrer", "Abdi Warsame", "Elin Norberg", "Rajat Sood"];
const CENSUS_BANK = [
  "undercount",
  "register",
  "seats",
  "households",
  "trust",
  "sampling",
  "decennial",
  "enumerators",
  "estimates",
];

// ---- Passage 3 · accounting history · lettered paragraphs ------------------

const LEDGER_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const LEDGER_ENDINGS = [
  "because every transaction is written twice and the two records must agree.",
  "which is why the method spread with the printed textbook rather than the merchants.",
  "since a firm's owners could at last be told apart from the firm itself.",
  "although the system detects only errors of a particular kind.",
  "because a clerk copying a figure wrongly leaves the columns unequal.",
  "even though the underlying rules have not changed in five centuries.",
  "which made a partnership possible between people who never met.",
];

export const TEST_88: CuratedTest = {
  key: "full-test-88",
  targetBand: 5,
  passages: [
    {
      key: "t88-p1-daylight-saving",
      title: "Moving the Clock for the Summer",
      topic: "a measure introduced for one reason that no longer applies",
      difficulty: 4,
      body: `Twice a year, about a quarter of the world's population changes its clocks. The reasoning behind the practice, when it was adopted, was straightforward. In summer the sun rises very early, at an hour when almost nobody is awake to use the light, and sets while people are still active and burning lamp oil or gas or electricity. Shifting the clock forward by an hour moves an hour of daylight from the beginning of the day, where it is wasted, to the end, where it is used. The saving was expected to be in fuel for lighting.

The idea is usually credited to William Willett, a London builder who published a pamphlet in 1907 proposing that the clocks be advanced in four steps of twenty minutes in the spring and put back the same way in the autumn. He campaigned for it until his death without success. An earlier version had been proposed in New Zealand by the entomologist George Hudson, whose motive was more candid: he wanted more daylight after work for collecting insects.

What actually brought the measure in was war. Germany adopted summer time in April 1916 to save coal, Britain followed within weeks, and most of the combatant nations did the same within a year. It was abandoned by several countries afterwards, reintroduced during the Second World War, abandoned again, and then reintroduced for good in much of Europe and North America during the oil crisis of the 1970s. Each adoption was driven by an energy emergency, and each was presented as a temporary measure.

The energy argument, however, has not survived examination. Lighting is now a small fraction of household electricity use, and the loads that dominate are heating and cooling, which respond to the shifted hour in the opposite direction: a warmer late afternoon at home increases air conditioning in hot climates, and a darker early morning increases heating in cold ones. Careful studies, including one that exploited a change in the law that applied to only part of one American state, have found effects close to zero and occasionally negative. The measure was adopted to save energy and does not measurably save energy.

Other arguments have taken its place. Evening daylight is associated with fewer road casualties, because the evening peak is busier and more dangerous than the morning one, and moving light into it appears to help. Retailers favour it, consistently and openly, because people shop and go out more in the light. Outdoor sport and leisure benefit. Against this stands an accumulating body of work on the transition itself: the spring change is followed by a measurable rise in heart attacks, road accidents and workplace injuries for a few days, and the effect on adolescents, who are already short of sleep, is a recurring theme in the sleep literature.

That literature has produced a distinction the public debate usually misses. Most sleep researchers who oppose the biannual change oppose it in favour of permanent standard time, not permanent summer time, on the grounds that the body clock is set by morning light and that permanent summer time means permanently dark winter mornings. Much of the popular support for abolition, however, assumes the opposite: that the summer arrangement would be kept all year. The two camps agree that the changing should stop and disagree about which setting to keep, which is why abolition keeps being announced and not enacted.

The European Union voted in 2019 to end the changes and left the choice of which time to keep to each member state, which stalled the whole thing, because a patchwork of decisions would leave neighbouring countries an hour apart in winter and not in summer. Several Americans states have passed laws for permanent summer time that cannot take effect without federal permission. Russia tried permanent summer time for three years and abandoned it after complaints about dark mornings, then settled on permanent standard time.

A century after the first adoption, the position is unusual: almost nobody defends the original justification, almost everybody finds the changes annoying, the research community has a clear preference, the public has a different one, and the arrangement continues because coordinating a change across borders is harder than leaving it alone.`,
      questions: [
        tfng(
          "The original purpose of the change was to reduce lighting costs.",
          "TRUE",
          "The saving was expected to be in fuel for lighting.",
          "The expected saving was in lighting fuel.",
        ),
        tfng(
          "Willett saw his proposal adopted in his lifetime.",
          "FALSE",
          "He campaigned for it until his death without success.",
          "He campaigned 'until his death without success'.",
        ),
        tfng(
          "Hudson's motive was to have more daylight for a hobby.",
          "TRUE",
          "An earlier version had been proposed in New Zealand by the entomologist George Hudson, whose motive was more candid: he wanted more daylight after work for collecting insects.",
          "He wanted light for collecting insects.",
        ),
        tfng(
          "Every introduction of the measure followed an energy emergency.",
          "TRUE",
          "Each adoption was driven by an energy emergency, and each was presented as a temporary measure.",
          "Each adoption followed an energy emergency.",
        ),
        tfng(
          "Modern studies confirm a substantial energy saving.",
          "FALSE",
          "Careful studies, including one that exploited a change in the law that applied to only part of one American state, have found effects close to zero and occasionally negative.",
          "Effects are 'close to zero and occasionally negative'.",
        ),
        tfng(
          "Most sleep researchers who want the changes stopped prefer permanent summer time.",
          "FALSE",
          "Most sleep researchers who oppose the biannual change oppose it in favour of permanent standard time, not permanent summer time, on the grounds that the body clock is set by morning light and that permanent summer time means permanently dark winter mornings.",
          "They prefer permanent standard time.",
        ),
        tfng(
          "Japan has debated adopting summer time in recent years.",
          "NOT GIVEN",
          "",
          "The passage discusses Europe, the United States and Russia but not Japan.",
        ),
        noteLine(
          CLOCK_NOTES,
          null,
          "Early summer daylight arrives before anyone is ______",
          "awake",
          "In summer the sun rises very early, at an hour when almost nobody is awake to use the light, and sets while people are still active and burning lamp oil or gas or electricity.",
          "Nobody is awake to use it.",
          { before: [{ text: "The original chain of reasoning:", indent: 0 }] },
        ),
        noteLine(
          CLOCK_NOTES,
          null,
          "Advancing the clock moves an hour of ______ to the evening",
          "daylight",
          "Shifting the clock forward by an hour moves an hour of daylight from the beginning of the day, where it is wasted, to the end, where it is used.",
          "An hour of daylight is moved.",
        ),
        noteLine(
          CLOCK_NOTES,
          null,
          "Germany adopted it in 1916 to save ______",
          "coal",
          "Germany adopted summer time in April 1916 to save coal, Britain followed within weeks, and most of the combatant nations did the same within a year.",
          "Germany adopted it to save coal.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Household electricity is now dominated by heating and ______.",
          "cooling",
          "Lighting is now a small fraction of household electricity use, and the loads that dominate are heating and cooling, which respond to the shifted hour in the opposite direction: a warmer late afternoon at home increases air conditioning in hot climates, and a darker early morning increases heating in cold ones.",
          "Heating and cooling dominate.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The evening peak is busier and more ______ than the morning one.",
          "dangerous",
          "Evening daylight is associated with fewer road casualties, because the evening peak is busier and more dangerous than the morning one, and moving light into it appears to help.",
          "It is busier and more dangerous.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Abolition stalls because a ______ of national decisions would split neighbours.",
          "patchwork",
          "The European Union voted in 2019 to end the changes and left the choice of which time to keep to each member state, which stalled the whole thing, because a patchwork of decisions would leave neighbouring countries an hour apart in winter and not in summer.",
          "A patchwork of decisions would result.",
        ),
      ],
    },
    {
      key: "t88-p2-census",
      title: "Counting Everybody Once",
      topic:
        "the most expensive statistical operation any government performs, and the argument about replacing it",
      difficulty: 5,
      body: `A census attempts something no survey does: to count every person in a territory on a single day, rather than to estimate the total from a sample. The ambition is very old — administrative counts survive from Babylon, Egypt and Han China — and the modern form dates from the eighteenth and nineteenth centuries, when states began to want the information for its own sake rather than for taxation or conscription alone.

The reason the exercise is not merely statistical is that numbers drive money and power. Parliamentary or congressional seats are allocated by population. Grants to local authorities are calculated per head, or per head in a particular age group. School places, hospital capacity, transport funding and the boundaries of electoral districts all follow the count. In a large country the sums that move on the strength of a single percentage point run into billions, and they move for ten years, because the next count is ten years away. Marisol Ferrer, who advises on statistical governance, observes that this is precisely what makes a census politically dangerous: an operation that decides where money goes is not treated by the people affected as a neutral measurement, and never has been.

The technical difficulty is not counting the easily counted. Settled households in ordinary housing respond at high rates, and they respond without being visited, which is why the cost of counting them is small. The difficulty is everybody else: people with no fixed address, recent migrants, students with two residences, people in institutions, households that distrust officials, and the very mobile. Abdi Warsame, a demographer, points out that the undercount is never spread evenly, and that this is what makes it damaging rather than merely regrettable: a two per cent national shortfall concentrated in a few districts moves resources away from exactly the populations that most need them, while a two per cent shortfall spread evenly would matter to almost nobody.

The classical response is enumerators — people who visit addresses that have not responded. It works and it is very expensive; the field operation is the largest single cost of most censuses and the part that has grown fastest, because the hardest households take many visits. Online response has cut the cost of the easy majority without touching the difficult minority, which means the average cost per response has fallen while the marginal cost of the last one per cent has risen.

There is an alternative. Several northern European countries no longer run a traditional census at all. Instead they maintain a continuously updated population register, in which every resident has a record that is amended when they move, are born, die or migrate, and they derive population statistics from it. Elin Norberg, who works with the Nordic system, describes the advantages as decisive where the register exists: the statistics are annual rather than decennial, far cheaper, and more accurate for most purposes. She is equally clear that the approach cannot simply be adopted elsewhere, because it presupposes a population accustomed to registering its address with the state and a state trusted enough that people do so honestly.

That last condition is the heart of the argument. Rajat Sood, who has studied census operations in several countries, regards public trust as the binding constraint rather than technology or money. He notes that response rates fall measurably when a census is perceived as connected to immigration enforcement or policing, that such a perception is easily created and very hard to undo, and that a single contested question added to a form can damage the count for a decade.

The methodological compromise now common is to combine sources: use administrative records where they exist, a shorter questionnaire for everyone, a long questionnaire for a sample, and statistical adjustment for the estimated undercount. This produces better numbers than any single method and has a political cost, because adjusted figures can be challenged as estimates rather than counts, and any district that loses a seat has an obvious argument ready.

The deeper question is what the count is for. A census designed to allocate seats needs a single authoritative number on a single date. A census designed to plan services needs current information and can tolerate uncertainty. These requirements pull in opposite directions, and much of the apparently technical dispute about methods is really a disagreement about which purpose comes first.`,
      questions: [
        fromList(
          "matching_features",
          CENSUS_PEOPLE,
          "An exercise that allocates resources will never be seen as neutral.",
          "Marisol Ferrer",
          "Marisol Ferrer, who advises on statistical governance, observes that this is precisely what makes a census politically dangerous: an operation that decides where money goes is not treated by the people affected as a neutral measurement, and never has been.",
          "Ferrer explains the political danger.",
        ),
        fromList(
          "matching_features",
          CENSUS_PEOPLE,
          "The harm comes from the uneven distribution of the error.",
          "Abdi Warsame",
          "Abdi Warsame, a demographer, points out that the undercount is never spread evenly, and that this is what makes it damaging rather than merely regrettable: a two per cent national shortfall concentrated in a few districts moves resources away from exactly the populations that most need them, while a two per cent shortfall spread evenly would matter to almost nobody.",
          "Warsame stresses the uneven shortfall.",
        ),
        fromList(
          "matching_features",
          CENSUS_PEOPLE,
          "A superior method depends on conditions that cannot be exported.",
          "Elin Norberg",
          "She is equally clear that the approach cannot simply be adopted elsewhere, because it presupposes a population accustomed to registering its address with the state and a state trusted enough that people do so honestly.",
          "Norberg names the preconditions.",
        ),
        fromList(
          "matching_features",
          CENSUS_PEOPLE,
          "One disputed question can spoil a count for years.",
          "Rajat Sood",
          "He notes that response rates fall measurably when a census is perceived as connected to immigration enforcement or policing, that such a perception is easily created and very hard to undo, and that a single contested question added to a form can damage the count for a decade.",
          "Sood describes the decade-long damage.",
        ),
        fromList(
          "summary_completion",
          CENSUS_BANK,
          "A census counts people instead of relying on ______.",
          "sampling",
          "A census attempts something no survey does: to count every person in a territory on a single day, rather than to estimate the total from a sample.",
          "It counts rather than samples.",
        ),
        fromList(
          "summary_completion",
          CENSUS_BANK,
          "Parliamentary ______ are allocated according to the result.",
          "seats",
          "Parliamentary or congressional seats are allocated by population.",
          "Seats follow population.",
        ),
        fromList(
          "summary_completion",
          CENSUS_BANK,
          "The most costly part is sending ______ to non-responding addresses.",
          "enumerators",
          "The classical response is enumerators — people who visit addresses that have not responded.",
          "Enumerators visit the non-responders.",
        ),
        fromList(
          "summary_completion",
          CENSUS_BANK,
          "Some countries instead keep a continuously updated ______.",
          "register",
          "Instead they maintain a continuously updated population register, in which every resident has a record that is amended when they move, are born, die or migrate, and they derive population statistics from it.",
          "They keep a population register.",
        ),
        fromList(
          "summary_completion",
          CENSUS_BANK,
          "Whether a register works depends on public ______ in the state.",
          "trust",
          "Rajat Sood, who has studied census operations in several countries, regards public trust as the binding constraint rather than technology or money.",
          "Trust is the binding constraint.",
        ),
        mcq(
          "What has online response done to census costs?",
          [
            "Cut the average cost while raising the marginal cost",
            "Reduced both average and marginal costs",
            "Removed the need for enumerators",
            "Raised total costs in every country",
          ],
          "Cut the average cost while raising the marginal cost",
          "Online response has cut the cost of the easy majority without touching the difficult minority, which means the average cost per response has fallen while the marginal cost of the last one per cent has risen.",
          "Average down, marginal up.",
        ),
        mcq(
          "What advantage does the register approach give?",
          [
            "Annual rather than ten-yearly statistics",
            "A count taken on a single day",
            "Fewer questions for each household",
            "Independence from administrative records",
          ],
          "Annual rather than ten-yearly statistics",
          "Elin Norberg, who works with the Nordic system, describes the advantages as decisive where the register exists: the statistics are annual rather than decennial, far cheaper, and more accurate for most purposes.",
          "They are annual rather than decennial.",
        ),
        mcq(
          "What is the political cost of the combined method?",
          [
            "Adjusted figures can be challenged as estimates",
            "It requires a longer form for everyone",
            "It cannot produce district-level numbers",
            "It delays the result by several years",
          ],
          "Adjusted figures can be challenged as estimates",
          "This produces better numbers than any single method and has a political cost, because adjusted figures can be challenged as estimates rather than counts, and any district that loses a seat has an obvious argument ready.",
          "They can be challenged as estimates.",
        ),
        mcq(
          "What does the writer say the technical dispute is really about?",
          [
            "Which purpose the count should serve first",
            "Which statistical adjustment is correct",
            "Whether registers are accurate",
            "How often enumerators should call",
          ],
          "Which purpose the count should serve first",
          "These requirements pull in opposite directions, and much of the apparently technical dispute about methods is really a disagreement about which purpose comes first.",
          "It is about which purpose comes first.",
        ),
      ],
    },
    {
      key: "t88-p3-double-entry",
      title: "The Two Columns That Had to Agree",
      topic: "a bookkeeping convention that made the modern firm possible",
      difficulty: 6,
      body: `A) Before double-entry bookkeeping, a merchant's records were a list. Money came in, money went out, goods arrived, debts were owed, and each event was written down once, in the order it happened. Such a record can tell its owner what happened, and it can be read back to settle an argument about a particular delivery or a particular debt. It cannot tell him whether he has made a profit, because it has no way of separating the money he has taken out of the business from the money the business has earned, and it cannot be checked, because a list contains nothing to compare against.

B) The method that solved this appeared among Italian merchants, and by the fourteenth century it was in use in Genoa, Venice and Florence. Every transaction is entered twice, as a debit in one account and a credit in another, in equal amounts. A sale on credit is recorded both as a reduction in goods and as an increase in what a customer owes. A payment of wages is both a fall in cash and a cost of the period. Nothing is entered on its own. Because each entry appears twice with opposite signs, the total of all debits must equal the total of all credits, and if it does not, something has been recorded wrongly.

C) That self-checking property is the immediate practical benefit and it is limited in a way worth stating. Equal totals prove that no entry has been made on one side only, and that no figure has been copied into one column and not the other. They prove nothing about whether the transaction happened, whether it was valued correctly, or whether two compensating errors have been made. A set of books can balance perfectly and be entirely fictitious, and the history of accounting fraud is largely the history of people who understood this before their auditors did.

D) The larger consequence is conceptual. Double entry requires the business to be treated as an entity distinct from its owner, with its own accounts, because a withdrawal by the owner has to be recorded as a transaction between two parties. Once that distinction exists, capital can be contributed by several people, each with a recorded claim; profit can be calculated for a period rather than for a voyage; and a manager who is not an owner can be held to account against figures. None of these is possible with a list.

E) The method reached a wider public through a textbook. Luca Pacioli, a mathematician and a friend of Leonardo da Vinci, included a description of Venetian bookkeeping practice in a mathematical compendium printed in 1494. He did not invent the system and said so; what he did was write it down clearly at the moment printing made copying cheap. The book was translated and imitated across Europe, and the practice spread along the trade in textbooks rather than along the trade in goods, which is a pattern worth noticing in the history of techniques.

F) Adoption was nevertheless slow and uneven, and the reasons were not ignorance. The system requires literacy, numeracy, a stock of paper and, above all, discipline: it fails completely if entries are made carelessly or late. A small trader with a good memory gained little from it and paid a real cost in time. It became indispensable only as firms grew large enough that no one person could hold the whole business in mind, and as capital began to be raised from people who were not present to watch. Those two conditions arrived together, and where they did not arrive the older methods persisted for centuries without anybody being obviously wrong to keep them.

G) Its modern position is odd. The rules taught to a first-year student today are recognisably those Pacioli described, and the software that most businesses use has made the mechanics invisible: nobody posts a journal entry by hand, and the trial balance that was the daily proof of correctness is computed continuously and looked at by no one. What has survived is not the procedure but the structure of thought — the idea that every economic event has two aspects, that a business is an entity with its own accounts, and that a statement of position must be capable of being reconciled. Those ideas were a genuine intellectual achievement, and they are now so thoroughly assumed that they are difficult to see as inventions at all.`,
      questions: [
        fromList(
          "matching_information",
          LEDGER_PARAGRAPHS,
          "the reason a small trader gained little from the system",
          "F",
          "A small trader with a good memory gained little from it and paid a real cost in time.",
          "Paragraph F explains the small trader's position.",
        ),
        fromList(
          "matching_information",
          LEDGER_PARAGRAPHS,
          "what balanced books cannot demonstrate",
          "C",
          "They prove nothing about whether the transaction happened, whether it was valued correctly, or whether two compensating errors have been made.",
          "Paragraph C lists what balance does not prove.",
        ),
        fromList(
          "matching_information",
          LEDGER_PARAGRAPHS,
          "an author who denied originating the method he described",
          "E",
          "He did not invent the system and said so; what he did was write it down clearly at the moment printing made copying cheap.",
          "Paragraph E notes Pacioli's disclaimer.",
        ),
        fromList(
          "matching_information",
          LEDGER_PARAGRAPHS,
          "why a simple list cannot reveal a profit",
          "A",
          "It cannot tell him whether he has made a profit, because it has no way of separating the money he has taken out of the business from the money the business has earned, and it cannot be checked, because a list contains nothing to compare against.",
          "Paragraph A explains the list's limitation.",
        ),
        fromList(
          "matching_information",
          LEDGER_PARAGRAPHS,
          "how the method separates a business from the person who owns it",
          "D",
          "Double entry requires the business to be treated as an entity distinct from its owner, with its own accounts, because a withdrawal by the owner has to be recorded as a transaction between two parties.",
          "Paragraph D draws the entity distinction.",
        ),
        ynng(
          "The writer thinks a balanced set of books is good evidence of honesty.",
          "NO",
          "A set of books can balance perfectly and be entirely fictitious, and the history of accounting fraud is largely the history of people who understood this before their auditors did.",
          "Balanced books can be 'entirely fictitious'.",
        ),
        ynng(
          "The writer believes slow adoption was caused by merchants failing to understand the method.",
          "NO",
          "Adoption was nevertheless slow and uneven, and the reasons were not ignorance.",
          "'The reasons were not ignorance.'",
        ),
        ynng(
          "The writer regards the conceptual effect of the method as more important than its arithmetic.",
          "YES",
          "The larger consequence is conceptual.",
          "The writer calls the conceptual effect the larger one.",
        ),
        ynng(
          "The writer thinks the system's ideas are now hard to recognise as inventions.",
          "YES",
          "Those ideas were a genuine intellectual achievement, and they are now so thoroughly assumed that they are difficult to see as inventions at all.",
          "They are 'difficult to see as inventions at all'.",
        ),
        fromList(
          "matching_sentence_endings",
          LEDGER_ENDINGS,
          "The books provide a check on themselves,",
          "because every transaction is written twice and the two records must agree.",
          "Because each entry appears twice with opposite signs, the total of all debits must equal the total of all credits, and if it does not, something has been recorded wrongly.",
          "Debits and credits must match.",
        ),
        fromList(
          "matching_sentence_endings",
          LEDGER_ENDINGS,
          "The check catches a miscopied figure,",
          "although the system detects only errors of a particular kind.",
          "Equal totals prove that no entry has been made on one side only, and that no figure has been copied into one column and not the other.",
          "It catches one-sided entries only.",
        ),
        fromList(
          "matching_sentence_endings",
          LEDGER_ENDINGS,
          "Capital could be raised from several contributors,",
          "since a firm's owners could at last be told apart from the firm itself.",
          "Once that distinction exists, capital can be contributed by several people, each with a recorded claim; profit can be calculated for a period rather than for a voyage; and a manager who is not an owner can be held to account against figures.",
          "The distinction allows several recorded claims.",
        ),
        fromList(
          "matching_sentence_endings",
          LEDGER_ENDINGS,
          "The practice travelled across Europe in the 1500s,",
          "which is why the method spread with the printed textbook rather than the merchants.",
          "The book was translated and imitated across Europe, and the practice spread along the trade in textbooks rather than along the trade in goods, which is a pattern worth noticing in the history of techniques.",
          "It spread with the textbook trade.",
        ),
        fromList(
          "matching_sentence_endings",
          LEDGER_ENDINGS,
          "Students today learn what a Venetian clerk learned,",
          "even though the underlying rules have not changed in five centuries.",
          "The rules taught to a first-year student today are recognisably those Pacioli described, and the software that most businesses use has made the mechanics invisible: nobody posts a journal entry by hand, and the trial balance that was the daily proof of correctness is computed continuously and looked at by no one.",
          "The taught rules are recognisably the same.",
        ),
      ],
    },
  ],
};
