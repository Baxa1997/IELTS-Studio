import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · financial technology · notes box ---------------------------

const MONEY_NOTES = {
  title: "Sending money by handset",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · migration economics · people and a word bank --------------

const REMIT_PEOPLE = ["Yolanda Cruz", "Emeka Nwosu", "Sanjana Iyer", "Pablo Ferreiro"];
const REMIT_BANK = [
  "corridors",
  "fees",
  "countercyclical",
  "informal",
  "diaspora",
  "exchange",
  "receipts",
  "compliance",
  "schooling",
];

// ---- Passage 3 · development practice · lettered paragraphs ----------------

const PUMP_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PUMP_ENDINGS = [
  "because the money was released for building and not for keeping things working.",
  "which is why a photograph of a new installation proves almost nothing.",
  "since a spare part made in another country may take a year to arrive.",
  "although the village had never been asked whether it wanted that design.",
  "because a handpump has fewer components than the alternatives to it.",
  "even though the survey counted the pump as functioning on the day it called.",
  "which makes a repair fund collected locally the best predictor of survival.",
];

export const TEST_98: CuratedTest = {
  key: "full-test-98",
  targetBand: 5,
  passages: [
    {
      key: "t98-p1-mobile-money",
      title: "Banking Through a Text Message",
      topic: "a payment system built on handsets that could not do anything else",
      difficulty: 4,
      body: `In 2007 a Kenyan mobile operator launched a service that let a customer deposit cash with a shopkeeper, send it to another phone number as a text message, and have the recipient withdraw it as cash from a different shopkeeper. There was no bank account involved, no card and no internet. The handsets of the time could send text messages and nothing else, and that was the whole technical requirement.

Within four years a majority of Kenyan adults were using it, which is a rate of adoption faster than that of any banking product in the country's history and faster than most consumer technologies anywhere. Today the value moved through such systems in Kenya each year is comparable to a substantial fraction of the country's economic output, and similar services operate across East and West Africa and in South Asia. The pattern of adoption is the interesting part, because it was not predicted by the people who built the service, who expected it to be used chiefly for repaying small loans.

What it was actually used for was sending money home. A very large number of households in the region depend on a family member who has moved to a city for work, and before the service existed the money came back by bus driver, by a travelling relative, or by an envelope entrusted to somebody going in the right direction. All of these were slow, expensive and risky, and a significant proportion of transfers were lost or stolen. The new service moved the same money in seconds for a small fee, and the demand that appeared was demand that had always been there and had been served badly.

The mechanism is simple and depends entirely on the agents. A shopkeeper registered as an agent holds a float of cash and a float of electronic value, and converts between them for customers in both directions. The operator's task is to keep tens of thousands of such agents liquid enough to meet demand, which is a logistical problem rather than a financial one: an agent in a market town on a day when everyone is withdrawing runs out of cash, and an agent near a factory on payday runs out of electronic value.

Two conditions made Kenya unusually suitable, and both matter for anybody trying to copy it. The first was regulatory: the central bank allowed a telecommunications company to hold customer funds and run a payment system without becoming a bank, on the condition that the money was held in a separate trust account. Regulators elsewhere refused exactly that, on the reasonable ground that taking deposits is banking, and the services in those countries grew much more slowly. The second was market structure: one operator held a dominant share of subscribers, so its service reached a critical mass of users immediately. In markets divided between several operators who would not connect to each other, no service reached that point.

The measured effects have been studied more carefully than most development interventions. The strongest findings concern risk rather than income: households with access to the service are better able to absorb a shock such as an illness or a crop failure, because a request for help can be answered the same day by relatives in several places. Studies have also found increases in savings and, in some analyses, in the proportion of women controlling household money, since a transfer can be sent to a specific person rather than to a household.

The system has also created problems that took time to appear. Fraud moved to the new channel quickly, usually by deception rather than by technical attack. Digital lenders built on the payment rails have extended very short-term credit at very high effective interest rates to people with no other access to borrowing, and several countries have had to legislate. And a country in which one private company operates the payment system used by most of the population has an infrastructural dependency that did not exist before, which is a question about competition policy rather than about technology. An outage that would once have been an inconvenience for subscribers is now a stoppage of a large share of the national economy for as long as it lasts.`,
      questions: [
        tfng(
          "The original service required a bank account.",
          "FALSE",
          "There was no bank account involved, no card and no internet.",
          "No bank account was involved.",
        ),
        tfng(
          "The designers correctly anticipated how the service would be used.",
          "FALSE",
          "The pattern of adoption is the interesting part, because it was not predicted by the people who built the service, who expected it to be used chiefly for repaying small loans.",
          "They expected loan repayment.",
        ),
        tfng(
          "Money previously travelled home through informal carriers.",
          "TRUE",
          "A very large number of households in the region depend on a family member who has moved to a city for work, and before the service existed the money came back by bus driver, by a travelling relative, or by an envelope entrusted to somebody going in the right direction.",
          "Bus drivers and relatives carried it.",
        ),
        tfng(
          "Keeping agents supplied is primarily a logistical problem.",
          "TRUE",
          "The operator's task is to keep tens of thousands of such agents liquid enough to meet demand, which is a logistical problem rather than a financial one: an agent in a market town on a day when everyone is withdrawing runs out of cash, and an agent near a factory on payday runs out of electronic value.",
          "It is 'a logistical problem rather than a financial one'.",
        ),
        tfng(
          "Regulators in other countries took the same view as Kenya's central bank.",
          "FALSE",
          "Regulators elsewhere refused exactly that, on the reasonable ground that taking deposits is banking, and the services in those countries grew much more slowly.",
          "They 'refused exactly that'.",
        ),
        tfng(
          "The clearest measured benefit is a rise in household income.",
          "FALSE",
          "The strongest findings concern risk rather than income: households with access to the service are better able to absorb a shock such as an illness or a crop failure, because a request for help can be answered the same day by relatives in several places.",
          "The findings concern risk, not income.",
        ),
        tfng(
          "The service is now more widely used in Tanzania than in Kenya.",
          "NOT GIVEN",
          "",
          "The passage says similar services operate in the region but makes no comparison.",
        ),
        noteLine(
          MONEY_NOTES,
          "Deposit",
          "Customer gives ______ to a registered shopkeeper",
          "cash",
          "In 2007 a Kenyan mobile operator launched a service that let a customer deposit cash with a shopkeeper, send it to another phone number as a text message, and have the recipient withdraw it as cash from a different shopkeeper.",
          "Cash is handed to the shopkeeper.",
        ),
        noteLine(
          MONEY_NOTES,
          "Transfer",
          "Value is sent to another number as a ______ message",
          "text",
          "The handsets of the time could send text messages and nothing else, and that was the whole technical requirement.",
          "It travels as a text message.",
        ),
        noteLine(
          MONEY_NOTES,
          "Withdrawal",
          "A different ______ converts the value back into cash",
          "agent",
          "A shopkeeper registered as an agent holds a float of cash and a float of electronic value, and converts between them for customers in both directions.",
          "An agent converts it back.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN THREE WORDS",
          "Customer money had to be held in a separate ______.",
          "trust account",
          "The first was regulatory: the central bank allowed a telecommunications company to hold customer funds and run a payment system without becoming a bank, on the condition that the money was held in a separate trust account.",
          "It was held in a separate trust account.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN THREE WORDS",
          "One operator's dominance gave the service an immediate ______.",
          "critical mass",
          "The second was market structure: one operator held a dominant share of subscribers, so its service reached a critical mass of users immediately.",
          "It reached critical mass at once.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN THREE WORDS",
          "Fraud on the new channel worked mostly by ______ rather than technical attack.",
          "deception",
          "Fraud moved to the new channel quickly, usually by deception rather than by technical attack.",
          "It worked by deception.",
        ),
      ],
    },
    {
      key: "t98-p2-remittances",
      title: "The Money Sent Home",
      topic: "the largest financial flow into poor countries, and the cost of moving it",
      difficulty: 5,
      body: `The money that migrants send to their families exceeds, in total, all the official development assistance given by all donor governments combined, and in most years it exceeds foreign direct investment into low and middle income countries as well. The figure is in the hundreds of billions of dollars annually. It is also, unlike either of the other flows, made up of very large numbers of small private transfers between individuals, which makes it behave quite differently. Nobody decides the total, no agreement sets it, and no negotiation can redirect it, because it is the sum of several hundred million separate decisions about a family.

Yolanda Cruz, an economist of migration, emphasises the behaviour that matters most. Remittances are countercyclical with respect to the receiving country: when a recession, a drought or a hurricane hits the home country, transfers rise, because the people sending them respond directly to news of need. Investment does the opposite and aid moves slowly and through institutions. She argues that this makes remittances the most effective form of insurance available to many households, and that it is a property nobody designed and no policy could easily replicate.

What is spent matters as much as what arrives. Emeka Nwosu, who studies household budgets in receiving communities, reports that the money goes predominantly on consumption — food, housing, medical bills and school fees — and that this has been criticised for decades as unproductive by people who should know better. School fees are an investment with one of the highest measured returns in development economics, and a household that stops having to choose between a child's education and a parent's medicine is not consuming frivolously. He notes that studies consistently find higher school enrolment and lower child labour in households receiving transfers.

The cost of sending is the policy scandal of the subject. Sanjana Iyer, who has tracked transfer prices, points out that the global average cost of sending a small sum across a border remains around six per cent of the amount, against an internationally agreed target of three, and that the price varies enormously between corridors: the same sum may cost two per cent to send along a busy, competitive route and over fifteen per cent along a thin one with a single provider, typically between two poor countries. She calculates that the difference between the actual average and the target represents a sum comparable to the aid budgets of several large donors.

The reasons for the cost are not mainly greed. Pablo Ferreiro, who has worked in the industry, explains that the fixed cost of complying with anti-money-laundering and sanctions rules falls on every transfer regardless of size, which makes small transfers structurally expensive, and that the response of many international banks has been to stop serving small money transfer operators altogether rather than manage the risk. That withdrawal has closed corridors, particularly to countries under sanctions or considered high risk, and pushed transfers into informal channels that are cheaper and entirely unmonitored — the opposite of what the rules intend. He describes the outcome as regulation defeating its own purpose through a cost structure nobody examined.

Technology has helped less than expected, and the reason is worth stating precisely. Digital transfers are genuinely cheaper where both ends are digital, and the last mile in cash remains the expensive part: someone must physically hand over money in a village, and that someone must be paid. Mobile money has shortened the domestic leg considerably in the countries that have it, and the international leg is still handled by institutions with correspondent banking relationships and compliance departments.

There is one further complication that receiving governments understand well and rarely say. A country receiving a very large share of its national income in remittances has an economy partly detached from its own labour market. The money arrives whether or not domestic jobs exist; it raises the exchange rate, which makes exports less competitive; and it reduces the political pressure that unemployment would otherwise create. Several countries in this position have deliberately encouraged emigration as an economic strategy, training nurses, seafarers and construction workers for export, which is rational for the national accounts and an unusual thing for a state to plan for.`,
      questions: [
        fromList(
          "matching_features",
          REMIT_PEOPLE,
          "The flow rises exactly when the receiving country is in trouble.",
          "Yolanda Cruz",
          "Remittances are countercyclical with respect to the receiving country: when a recession, a drought or a hurricane hits the home country, transfers rise, because the people sending them respond directly to news of need.",
          "Cruz describes the countercyclical pattern.",
        ),
        fromList(
          "matching_features",
          REMIT_PEOPLE,
          "Criticism of how the money is spent is misplaced.",
          "Emeka Nwosu",
          "Emeka Nwosu, who studies household budgets in receiving communities, reports that the money goes predominantly on consumption — food, housing, medical bills and school fees — and that this has been criticised for decades as unproductive by people who should know better.",
          "Nwosu rejects the criticism.",
        ),
        fromList(
          "matching_features",
          REMIT_PEOPLE,
          "The gap between actual and target charges is very large in total.",
          "Sanjana Iyer",
          "She calculates that the difference between the actual average and the target represents a sum comparable to the aid budgets of several large donors.",
          "Iyer quantifies the excess cost.",
        ),
        fromList(
          "matching_features",
          REMIT_PEOPLE,
          "Rules intended to increase oversight have reduced it.",
          "Pablo Ferreiro",
          "He describes the outcome as regulation defeating its own purpose through a cost structure nobody examined.",
          "Ferreiro describes regulation defeating itself.",
        ),
        fromList(
          "summary_completion",
          REMIT_BANK,
          "Transfers behave in a ______ way with respect to the home economy.",
          "countercyclical",
          "Remittances are countercyclical with respect to the receiving country: when a recession, a drought or a hurricane hits the home country, transfers rise, because the people sending them respond directly to news of need.",
          "They are countercyclical.",
        ),
        fromList(
          "summary_completion",
          REMIT_BANK,
          "Receiving households show higher ______ and less child labour.",
          "schooling",
          "He notes that studies consistently find higher school enrolment and lower child labour in households receiving transfers.",
          "Enrolment rises.",
        ),
        fromList(
          "summary_completion",
          REMIT_BANK,
          "The cost of sending varies enormously between ______.",
          "corridors",
          "Sanjana Iyer, who has tracked transfer prices, points out that the global average cost of sending a small sum across a border remains around six per cent of the amount, against an internationally agreed target of three, and that the price varies enormously between corridors: the same sum may cost two per cent to send along a busy, competitive route and over fifteen per cent along a thin one with a single provider, typically between two poor countries.",
          "The variation is between corridors.",
        ),
        fromList(
          "summary_completion",
          REMIT_BANK,
          "The fixed cost of ______ falls on every transfer whatever its size.",
          "compliance",
          "Pablo Ferreiro, who has worked in the industry, explains that the fixed cost of complying with anti-money-laundering and sanctions rules falls on every transfer regardless of size, which makes small transfers structurally expensive, and that the response of many international banks has been to stop serving small money transfer operators altogether rather than manage the risk.",
          "Compliance cost is fixed per transfer.",
        ),
        fromList(
          "summary_completion",
          REMIT_BANK,
          "Closed routes push money into ______ channels nobody monitors.",
          "informal",
          "That withdrawal has closed corridors, particularly to countries under sanctions or considered high risk, and pushed transfers into informal channels that are cheaper and entirely unmonitored — the opposite of what the rules intend.",
          "Transfers move to informal channels.",
        ),
        mcq(
          "How does the total flow compare with other sources of finance?",
          [
            "It exceeds all official development assistance combined",
            "It is roughly equal to aid from the largest donor",
            "It is smaller than foreign direct investment in most years",
            "It exceeds the combined output of receiving countries",
          ],
          "It exceeds all official development assistance combined",
          "The money that migrants send to their families exceeds, in total, all the official development assistance given by all donor governments combined, and in most years it exceeds foreign direct investment into low and middle income countries as well.",
          "It exceeds all aid combined.",
        ),
        mcq(
          "Why does the writer defend spending on school fees?",
          [
            "Education has one of the highest measured returns",
            "Fees are the largest single item of spending",
            "It is the only permitted use of the money",
            "It replaces borrowing at high interest",
          ],
          "Education has one of the highest measured returns",
          "School fees are an investment with one of the highest measured returns in development economics, and a household that stops having to choose between a child's education and a parent's medicine is not consuming frivolously.",
          "The return on schooling is high.",
        ),
        mcq(
          "Which part of a transfer remains expensive?",
          [
            "The final handover of cash",
            "The domestic mobile leg",
            "The currency conversion",
            "The sender's registration",
          ],
          "The final handover of cash",
          "Digital transfers are genuinely cheaper where both ends are digital, and the last mile in cash remains the expensive part: someone must physically hand over money in a village, and that someone must be paid.",
          "The last mile in cash is the cost.",
        ),
        mcq(
          "What effect on exports does a large inflow have?",
          [
            "It makes them less competitive by raising the exchange rate",
            "It makes them cheaper by lowering wages",
            "It has no measurable effect",
            "It increases them by funding investment",
          ],
          "It makes them less competitive by raising the exchange rate",
          "The money arrives whether or not domestic jobs exist; it raises the exchange rate, which makes exports less competitive; and it reduces the political pressure that unemployment would otherwise create.",
          "A higher exchange rate hurts exports.",
        ),
      ],
    },
    {
      key: "t98-p3-broken-pumps",
      title: "The Pump That Nobody Repaired",
      topic: "why a third of the handpumps installed in rural Africa are not working",
      difficulty: 6,
      body: `A) A handpump over a borehole is one of the most durable pieces of development technology there is. It has no engine, needs no fuel, and can deliver clean water to a village of a few hundred people for decades. It is also, across sub-Saharan Africa, broken about a third of the time. Surveys conducted over three decades have found non-functionality rates between a quarter and a half, with remarkable consistency across countries, agencies and pump designs. The hardware works. Something else does not, and the something else has been identified repeatedly, in report after report, for as long as the surveys have been made.

B) The explanation most often given first is technical, and it is largely wrong. The pumps are simple, the common failures are predictable — a worn seal, a broken rod, a cracked cylinder — and the parts are not complicated to make. Where the technical explanation does hold is in supply: a pump designed abroad and installed by a project may need a component that no trader within two hundred kilometres stocks, and a village that knows exactly what is wrong may wait a year for a part. Standardising on a small number of designs with locally manufactured parts is the one hardware intervention that reliably helps.

C) The financial explanation goes deeper. Almost all of these pumps were installed with capital from a donor or a government programme, and almost none came with money for repair. A budget line for construction is attractive to fund: it is visible, it can be counted, it can be photographed, and it is finished. A budget line for maintenance is none of those things. The result is a system that can install pumps indefinitely and cannot fix them, and the aggregate effect is a landscape littered with the visible products of successful projects.

D) The institutional response, from the 1980s onwards, was community management: a village committee is formed, trained, and made responsible for collecting a small regular payment and arranging repairs. It is a reasonable model and its record is poor. Committees dissolve, treasurers leave, money collected for a repair that has not yet been needed is spent on something that has, and a village asked to pay monthly for a pump that is working will generally stop paying. The pattern is well documented and it is not a failure of character; it is what happens when a group is asked to save collectively against an event that has no date.

E) What does predict survival is having somebody whose job it is. Where a district has a mechanic who is paid to visit a set of pumps on a schedule, funded by a per-household charge collected across all of them rather than by each village separately, functionality rates rise sharply and stay up. This is not a new insight — it is how a water utility works — and the difficulty is that it requires an institution with a revenue stream, which is exactly what rural water supply in most of these countries does not have.

F) The measurement problem has made all of this worse than it needed to be. A survey that asks whether a pump is working records the answer on the day of the visit, and a pump that is broken for three months a year counts as functional for nine visits out of twelve. Studies using sensors on pump handles, which record actual use continuously, have found substantially more downtime than household surveys report, and have also found that a broken pump is often not reported to anybody for weeks because nobody knows who to tell. Better data has consistently made the picture look worse, which is the usual direction.

G) The general lesson has been drawn many times and is still being relearned. Capital expenditure is easy to fund, easy to attribute and easy to celebrate, and it creates an obligation to spend money every year thereafter that nobody has agreed to meet. The installation is not the intervention. The intervention is the arrangement that keeps the thing working, and that arrangement is institutional, unglamorous, permanent, and much harder to raise money for than a pump. It also has no photograph attached to it, which is not a trivial observation about how development finance is actually raised.`,
      questions: [
        fromList(
          "matching_information",
          PUMP_PARAGRAPHS,
          "why surveys have overstated how well pumps work",
          "F",
          "A survey that asks whether a pump is working records the answer on the day of the visit, and a pump that is broken for three months a year counts as functional for nine visits out of twelve.",
          "Paragraph F explains the survey artefact.",
        ),
        fromList(
          "matching_information",
          PUMP_PARAGRAPHS,
          "the arrangement that most improves the chances of a repair",
          "E",
          "Where a district has a mechanic who is paid to visit a set of pumps on a schedule, funded by a per-household charge collected across all of them rather than by each village separately, functionality rates rise sharply and stay up.",
          "Paragraph E names the paid mechanic.",
        ),
        fromList(
          "matching_information",
          PUMP_PARAGRAPHS,
          "why one kind of budget is easier to raise than another",
          "C",
          "A budget line for construction is attractive to fund: it is visible, it can be counted, it can be photographed, and it is finished.",
          "Paragraph C contrasts the two budget lines.",
        ),
        fromList(
          "matching_information",
          PUMP_PARAGRAPHS,
          "the one hardware measure that genuinely helps",
          "B",
          "Standardising on a small number of designs with locally manufactured parts is the one hardware intervention that reliably helps.",
          "Paragraph B names standardisation.",
        ),
        fromList(
          "matching_information",
          PUMP_PARAGRAPHS,
          "figures showing the same failure rate across many countries",
          "A",
          "Surveys conducted over three decades have found non-functionality rates between a quarter and a half, with remarkable consistency across countries, agencies and pump designs.",
          "Paragraph A gives the consistent rates.",
        ),
        ynng(
          "The writer thinks the failure is mainly a technical one.",
          "NO",
          "The explanation most often given first is technical, and it is largely wrong.",
          "It is 'largely wrong'.",
        ),
        ynng(
          "The writer blames village committees for lacking commitment.",
          "NO",
          "The pattern is well documented and it is not a failure of character; it is what happens when a group is asked to save collectively against an event that has no date.",
          "It is 'not a failure of character'.",
        ),
        ynng(
          "The writer regards the paid-mechanic model as a novel discovery.",
          "NO",
          "This is not a new insight — it is how a water utility works — and the difficulty is that it requires an institution with a revenue stream, which is exactly what rural water supply in most of these countries does not have.",
          "It is 'not a new insight'.",
        ),
        ynng(
          "The writer thinks better measurement has made the situation look less encouraging.",
          "YES",
          "Better data has consistently made the picture look worse, which is the usual direction.",
          "Better data made it look worse.",
        ),
        fromList(
          "matching_sentence_endings",
          PUMP_ENDINGS,
          "A village may know the fault and still wait a year,",
          "since a spare part made in another country may take a year to arrive.",
          "Where the technical explanation does hold is in supply: a pump designed abroad and installed by a project may need a component that no trader within two hundred kilometres stocks, and a village that knows exactly what is wrong may wait a year for a part.",
          "No local trader stocks the part.",
        ),
        fromList(
          "matching_sentence_endings",
          PUMP_ENDINGS,
          "Pumps can be installed faster than they can be fixed,",
          "because the money was released for building and not for keeping things working.",
          "Almost all of these pumps were installed with capital from a donor or a government programme, and almost none came with money for repair.",
          "The capital came without repair money.",
        ),
        fromList(
          "matching_sentence_endings",
          PUMP_ENDINGS,
          "A village stops contributing while the pump is sound,",
          "which makes a repair fund collected locally the best predictor of survival.",
          "Committees dissolve, treasurers leave, money collected for a repair that has not yet been needed is spent on something that has, and a village asked to pay monthly for a pump that is working will generally stop paying.",
          "Local saving against an undated event fails.",
        ),
        fromList(
          "matching_sentence_endings",
          PUMP_ENDINGS,
          "A pump may be broken for months and still be counted as working,",
          "even though the survey counted the pump as functioning on the day it called.",
          "Studies using sensors on pump handles, which record actual use continuously, have found substantially more downtime than household surveys report, and have also found that a broken pump is often not reported to anybody for weeks because nobody knows who to tell.",
          "The survey records only that day.",
        ),
        fromList(
          "matching_sentence_endings",
          PUMP_ENDINGS,
          "An opening ceremony is not the achievement it appears to be,",
          "which is why a photograph of a new installation proves almost nothing.",
          "The installation is not the intervention.",
          "The installation is not the intervention.",
        ),
      ],
    },
  ],
};
