import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · agricultural history · notes box ---------------------------

const GUANO_NOTES = {
  title: "Why the deposit was worth so much",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · soil science · people and a word bank ---------------------

const SOIL_PEOPLE = ["Estelle Rondeau", "Jomo Kimathi", "Sigrid Halvorsen", "Rafael Duarte"];
const SOIL_BANK = [
  "crumbs",
  "pores",
  "residue",
  "earthworm",
  "drill",
  "herbicide",
  "profile",
  "cover",
  "slot",
];

// ---- Passage 3 · humanitarian policy · lettered paragraphs -----------------

const AID_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const AID_ENDINGS = [
  "although expenditure on alcohol and tobacco falls in several studies.",
  "because the transfer then flows partly to traders instead of to recipients.",
  "which is why the market has to be assessed before the method is chosen.",
  "since almost all of the shipping, warehousing and trucking disappears.",
  "because nobody outside the household knows which child is ill this week.",
  "which the writer thinks the two categories deserve separate budgets for.",
  "even though the objection continues to be raised more often than any other.",
];

export const TEST_77: CuratedTest = {
  key: "full-test-77",
  targetBand: 6,
  passages: [
    {
      key: "t77-p1-guano-trade",
      title: "The Islands That Were Sold by the Shipload",
      topic: "how a seabird deposit became one of the century's most valuable commodities",
      difficulty: 5,
      body: `On a group of small rocky islands off the coast of Peru, where it almost never rains, seabirds nested in enormous numbers for thousands of years. Their droppings accumulated instead of washing away, and by the nineteenth century the deposit on some islands was more than fifty metres deep. It was the most concentrated agricultural fertiliser then known, and for about forty years it was among the most valuable commodities in the world.

The value lay in nitrogen. A crop removes nitrogen from the soil, and a field cropped repeatedly without replacement produces less each year. Farmers had always known this and had dealt with it by leaving land fallow, by planting clover and beans, and by spreading animal manure, all of which work slowly and none of which can be increased quickly. Guano was different: it was dry, light for what it contained, and about thirty times richer in nitrogen than farmyard manure.

The local population had used it for centuries, and the Inca state had regulated access to the islands and protected the birds during the breeding season, with severe penalties for disturbing them. What changed in the 1840s was that European agricultural chemists analysed samples and published the results, and the British and American markets discovered that a ship's cargo of the material would transform the yield of an exhausted field.

The trade that followed was enormous and short. Something over twelve million tonnes were removed from the Peruvian islands in about forty years. The revenue dominated the finances of the Peruvian state, which borrowed heavily against future sales in London, and it drew in a labour force under conditions among the worst recorded in the century: thousands of Chinese workers were brought under contracts they could not read, housed on the islands, and set to cutting the deposit by hand in an atmosphere of ammonia dust. Mortality was very high, and several official investigations described the arrangement as slavery in substance.

The deposit was effectively finished by the 1880s. A resource that had taken thousands of years to accumulate was removed in four decades, and the state that had borrowed against it defaulted. The birds remained, and the deposit does still form, but at a rate of a few centimetres a year, which supports a small managed harvest and nothing resembling the original trade.

Demand did not disappear, and the next thirty years were spent looking for a replacement. Nitrate deposits in the Atacama desert served for a time and were themselves the cause of a war between three countries over who owned them. The problem was finally solved in a laboratory rather than a desert: a process developed in Germany before the First World War combines nitrogen from the air with hydrogen under great heat and pressure to make ammonia, and it removed the constraint permanently. Something like half the nitrogen in the protein of a person alive today has passed through that process.

The consequences of solving it are mixed in a way that makes the guano story worth telling. Synthetic nitrogen allowed the world's population to grow to a size the older methods could not have fed, which is not a small achievement. It also made nitrogen cheap enough to apply carelessly, and the surplus that runs off fields is now the main cause of the oxygen-depleted zones appearing each summer at the mouths of large rivers.

There is a pattern in the episode that has repeated with other materials. A substance accumulates slowly in one place, is discovered to be valuable, is removed at a rate hundreds of times faster than it forms, supports a boom in the region that holds it, leaves that region poorer than before when it runs out, and is eventually replaced by something manufactured. Nitrate, whale oil and several mineral deposits followed the same course.

What the islands illustrate most usefully is how recent the ability to grow food in quantity actually is. For almost all of human history the nitrogen available to crops was whatever could be gathered nearby, and yields were held within narrow limits by that fact. Two generations spent searching the world for bird droppings is all that separates that condition from the present one.`,
      questions: [
        tfng(
          "The deposit built up because the islands get almost no rain.",
          "TRUE",
          "On a group of small rocky islands off the coast of Peru, where it almost never rains, seabirds nested in enormous numbers for thousands of years.",
          "On the islands 'it almost never rains'.",
        ),
        tfng(
          "The material held about thirty times the nitrogen of farm manure.",
          "TRUE",
          "Guano was different: it was dry, light for what it contained, and about thirty times richer in nitrogen than farmyard manure.",
          "It was 'about thirty times richer in nitrogen'.",
        ),
        tfng(
          "Nobody in the region knew the value of the deposit before the 1840s.",
          "FALSE",
          "The local population had used it for centuries, and the Inca state had regulated access to the islands and protected the birds during the breeding season, with severe penalties for disturbing them.",
          "It had been used 'for centuries'.",
        ),
        tfng(
          "The deposit no longer forms on the islands.",
          "FALSE",
          "The birds remained, and the deposit does still form, but at a rate of a few centimetres a year, which supports a small managed harvest and nothing resembling the original trade.",
          "It 'does still form', only slowly.",
        ),
        tfng(
          "Nitrate deposits in the Atacama were fought over by three countries.",
          "TRUE",
          "Nitrate deposits in the Atacama desert served for a time and were themselves the cause of a war between three countries over who owned them.",
          "They caused 'a war between three countries'.",
        ),
        tfng(
          "Manufactured nitrogen has brought no harmful effects.",
          "FALSE",
          "It also made nitrogen cheap enough to apply carelessly, and the surplus that runs off fields is now the main cause of the oxygen-depleted zones appearing each summer at the mouths of large rivers.",
          "The run-off causes oxygen-depleted zones.",
        ),
        tfng(
          "Peru still earns a significant income from the islands.",
          "NOT GIVEN",
          "",
          "A small harvest is mentioned but nothing is said about present income.",
        ),
        noteLine(
          GUANO_NOTES,
          null,
          "A field cropped year after year loses its ______",
          "nitrogen",
          "A crop removes nitrogen from the soil, and a field cropped repeatedly without replacement produces less each year.",
          "A crop 'removes nitrogen from the soil'.",
          { before: [{ text: "The problem it solved was an old one:", indent: 0 }] },
        ),
        noteLine(
          GUANO_NOTES,
          null,
          "The older remedies included leaving land ______",
          "fallow",
          "Farmers had always known this and had dealt with it by leaving land fallow, by planting clover and beans, and by spreading animal manure, all of which work slowly and none of which can be increased quickly.",
          "One remedy was 'leaving land fallow'.",
        ),
        noteLine(
          GUANO_NOTES,
          null,
          "The deposit was dry and ______ for what it contained",
          "light",
          "Guano was different: it was dry, light for what it contained, and about thirty times richer in nitrogen than farmyard manure.",
          "It was 'dry, light for what it contained'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The Inca state protected the birds during the ______ season.",
          "breeding",
          "The local population had used it for centuries, and the Inca state had regulated access to the islands and protected the birds during the breeding season, with severe penalties for disturbing them.",
          "They were protected 'during the breeding season'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Workers cut the deposit in an atmosphere of ______ dust.",
          "ammonia",
          "The revenue dominated the finances of the Peruvian state, which borrowed heavily against future sales in London, and it drew in a labour force under conditions among the worst recorded in the century: thousands of Chinese workers were brought under contracts they could not read, housed on the islands, and set to cutting the deposit by hand in an atmosphere of ammonia dust.",
          "They worked in 'ammonia dust'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The German process combines nitrogen from the air with ______.",
          "hydrogen",
          "The problem was finally solved in a laboratory rather than a desert: a process developed in Germany before the First World War combines nitrogen from the air with hydrogen under great heat and pressure to make ammonia, and it removed the constraint permanently.",
          "It combines nitrogen 'with hydrogen'.",
        ),
      ],
    },
    {
      key: "t77-p2-no-till-farming",
      title: "The Field That Is Never Turned Over",
      topic: "what stopping ploughing does to soil, yields and the carbon accounts",
      difficulty: 6,
      body: `A plough turns the top layer of a field over, burying weeds and the residue of the last crop and leaving a clean surface to plant into. It has been the defining implement of agriculture for several thousand years, and the case against it is now strong enough that a substantial share of the world's cropland is no longer ploughed at all.

The objection is that the operation destroys the structure it depends on. Soil is not a substance but an arrangement: mineral particles held together in crumbs by fungal threads, roots and the sticky products of microbial life, with pores between them that carry air and water. Estelle Rondeau, who studies soil physics, describes tillage as breaking that arrangement into dust every year, which has three consequences — the crumbs no longer hold together in rain, so the surface seals and water runs off instead of soaking in; the exposed organic matter oxidises and is lost as carbon dioxide; and the loosened surface is available to be carried away by wind and water.

Erosion is the measurable result. On sloping ploughed land the rate of soil loss frequently exceeds the rate of soil formation by a factor of ten or more, and since soil forms at something like a centimetre a century, a field can lose in one generation what took several to make. The loss is invisible from one year to the next, which is a large part of why it was tolerated for so long.

The alternative is to plant directly into the residue of the previous crop, cutting a narrow slot for the seed and leaving everything else undisturbed. Jomo Kimathi, who works with farmers making the change, is blunt that the transition is harder than the advocacy suggests: yields typically fall for the first three to five seasons while the soil rebuilds its structure and its earthworm population, weeds that were previously buried must now be controlled some other way, and the specialist drill required costs more than a plough. Farmers who abandon the method usually do so in year two.

What makes the method work over time is the residue itself. A layer of last year's stalks on the surface shades the soil, reduces evaporation, moderates temperature and feeds the organisms that rebuild the crumb structure. Sigrid Halvorsen, who has measured water movement in these systems, reports that an undisturbed soil under residue absorbs rainfall several times faster than a ploughed one, which matters most in exactly the heavy downpours that cause the worst erosion, and that the difference goes on increasing for years after the change.

The carbon claim is the one that has attracted attention and the one needing most care. Not ploughing was widely promoted as a way of storing carbon in soil, and the early measurements supported it. Rafael Duarte, who has reviewed the evidence, points out that most of those measurements sampled only the top layer: carbon does accumulate near the surface under no-till, but when the whole profile to a metre is sampled the difference between tilled and untilled fields is much smaller and in some studies absent. He is careful to say that this does not undo the case for the practice — the erosion and water benefits are not in dispute — but that the carbon accounting was done badly and has been used to sell offsets.

Weed control is the unresolved difficulty, and it is the reason the practice has spread unevenly. Without the plough, the usual substitute is herbicide, which ties a soil conservation method to a chemical input and to the resistance problems that follow from relying on one. The alternative is a cover crop grown between cash crops and then killed by rolling or by frost, which suppresses weeds, adds organic matter and costs a season's work with no direct return. Systems that manage without either do exist, and they require considerably more attention than a farm at current labour prices can usually give.

The pattern of uptake reflects all of this. No-till is dominant in parts of South America and on the North American plains, where the soils are erodible, the farms are large and the drills are affordable; it is much less common in Europe, and rare where fields are small or where a farmer cannot carry three poor years. That distribution is about the cost of the transition rather than about the merits, which is a common shape for an agricultural innovation and is usually misread as scepticism.`,
      questions: [
        fromList(
          "matching_features",
          SOIL_PEOPLE,
          "Ploughing destroys the very structure the crop depends on.",
          "Estelle Rondeau",
          "Estelle Rondeau, who studies soil physics, describes tillage as breaking that arrangement into dust every year, which has three consequences — the crumbs no longer hold together in rain, so the surface seals and water runs off instead of soaking in; the exposed organic matter oxidises and is lost as carbon dioxide; and the loosened surface is available to be carried away by wind and water.",
          "Rondeau sets out the three consequences.",
        ),
        fromList(
          "matching_features",
          SOIL_PEOPLE,
          "The change is harder than its advocates admit and most give up early.",
          "Jomo Kimathi",
          "Jomo Kimathi, who works with farmers making the change, is blunt that the transition is harder than the advocacy suggests: yields typically fall for the first three to five seasons while the soil rebuilds its structure and its earthworm population, weeds that were previously buried must now be controlled some other way, and the specialist drill required costs more than a plough.",
          "Kimathi describes the transition.",
        ),
        fromList(
          "matching_features",
          SOIL_PEOPLE,
          "Undisturbed ground takes in heavy rain several times faster.",
          "Sigrid Halvorsen",
          "Sigrid Halvorsen, who has measured water movement in these systems, reports that an undisturbed soil under residue absorbs rainfall several times faster than a ploughed one, which matters most in exactly the heavy downpours that cause the worst erosion, and that the difference goes on increasing for years after the change.",
          "Halvorsen measured the infiltration.",
        ),
        fromList(
          "matching_features",
          SOIL_PEOPLE,
          "The carbon measurements were taken from too shallow a layer.",
          "Rafael Duarte",
          "Rafael Duarte, who has reviewed the evidence, points out that most of those measurements sampled only the top layer: carbon does accumulate near the surface under no-till, but when the whole profile to a metre is sampled the difference between tilled and untilled fields is much smaller and in some studies absent.",
          "Duarte re-examined the sampling depth.",
        ),
        fromList(
          "summary_completion",
          SOIL_BANK,
          "Mineral particles are bound into ______ by fungal threads and roots.",
          "crumbs",
          "Soil is not a substance but an arrangement: mineral particles held together in crumbs by fungal threads, roots and the sticky products of microbial life, with pores between them that carry air and water.",
          "They are 'held together in crumbs'.",
        ),
        fromList(
          "summary_completion",
          SOIL_BANK,
          "The ______ between them carry air and water through the soil.",
          "pores",
          "Soil is not a substance but an arrangement: mineral particles held together in crumbs by fungal threads, roots and the sticky products of microbial life, with pores between them that carry air and water.",
          "The pores 'carry air and water'.",
        ),
        fromList(
          "summary_completion",
          SOIL_BANK,
          "Seed goes into a narrow ______ cut through the old crop.",
          "slot",
          "The alternative is to plant directly into the residue of the previous crop, cutting a narrow slot for the seed and leaving everything else undisturbed.",
          "A narrow slot is cut for the seed.",
        ),
        fromList(
          "summary_completion",
          SOIL_BANK,
          "Yields fall while the soil rebuilds its ______ population.",
          "earthworm",
          "Jomo Kimathi, who works with farmers making the change, is blunt that the transition is harder than the advocacy suggests: yields typically fall for the first three to five seasons while the soil rebuilds its structure and its earthworm population, weeds that were previously buried must now be controlled some other way, and the specialist drill required costs more than a plough.",
          "The earthworm population has to recover.",
        ),
        fromList(
          "summary_completion",
          SOIL_BANK,
          "Sampling the whole ______ to a metre shows a far smaller gain.",
          "profile",
          "Rafael Duarte, who has reviewed the evidence, points out that most of those measurements sampled only the top layer: carbon does accumulate near the surface under no-till, but when the whole profile to a metre is sampled the difference between tilled and untilled fields is much smaller and in some studies absent.",
          "The whole profile tells a different story.",
        ),
        mcq(
          "How quickly does soil form?",
          [
            "About a centimetre a century",
            "About a centimetre a year",
            "About a metre a century",
            "Faster than it is eroded",
          ],
          "About a centimetre a century",
          "On sloping ploughed land the rate of soil loss frequently exceeds the rate of soil formation by a factor of ten or more, and since soil forms at something like a centimetre a century, a field can lose in one generation what took several to make.",
          "It forms at 'a centimetre a century'.",
        ),
        mcq(
          "When do farmers who give up the method usually do so?",
          [
            "In the second year",
            "Before they begin at all",
            "After about a decade",
            "Only if yields never recover",
          ],
          "In the second year",
          "Farmers who abandon the method usually do so in year two.",
          "They usually stop 'in year two'.",
        ),
        mcq(
          "What does the layer of crop residue do?",
          [
            "It shades the soil and slows evaporation",
            "It kills weed seedlings outright",
            "It raises the soil temperature",
            "It removes the need for a drill",
          ],
          "It shades the soil and slows evaporation",
          "A layer of last year's stalks on the surface shades the soil, reduces evaporation, moderates temperature and feeds the organisms that rebuild the crumb structure.",
          "It 'shades the soil, reduces evaporation'.",
        ),
        mcq(
          "Why has the practice spread unevenly?",
          [
            "The cost of the transition differs between farms",
            "Scientists dispute whether it works",
            "It only succeeds on small fields",
            "Herbicides are banned in some countries",
          ],
          "The cost of the transition differs between farms",
          "That distribution is about the cost of the transition rather than about the merits, which is a common shape for an agricultural innovation and is usually misread as scepticism.",
          "It is 'about the cost of the transition'.",
        ),
      ],
    },
    {
      key: "t77-p3-cash-versus-goods",
      title: "Money Instead of Blankets",
      topic: "why relief agencies moved from handing out goods to handing out cash",
      difficulty: 7,
      body: `A) For most of the history of humanitarian relief, help arrived as things: sacks of grain, blankets, cooking sets, plastic sheeting, tinned fish. The alternative — handing people money and letting them buy what they want — was considered naive for decades, and is now the default recommendation of most of the agencies that once resisted it. The change happened quickly and on the basis of evidence, which is unusual enough in this field to be worth examining closely. Most reversals of humanitarian doctrine have followed a scandal or a change of leadership rather than a body of findings.

B) The objections to cash were specific and testable, which is what allowed them to be settled. It was said that recipients would spend the money badly, on alcohol or tobacco; that handing out money in a place short of goods would simply raise prices; that men would take the money from women; and that cash was more easily stolen than a warehouse of grain. Each of these has now been tested many times over, in different countries and in different kinds of emergency. The theft objection turned out to be the weakest of the four, since a consignment of grain in a warehouse is a great deal easier to divert than a payment recorded against a registered name.

C) The spending objection has not survived. Across a large number of studies in different countries, cash transfers to poor households are spent overwhelmingly on food, school costs, medical treatment, tools and debt repayment, and expenditure on alcohol and tobacco does not rise; in several studies it falls. This is the most consistently replicated finding in the whole literature, and it is also the objection that continues to be raised most often, usually by people who have read none of it.

D) The price objection is real and the answer is conditional. If money is injected into a market that cannot supply more goods, prices do rise and the transfer partly flows to traders rather than to recipients. Whether that happens depends on whether roads are open, whether traders can restock, and how isolated the market is. This is a question about a particular place at a particular time, and the practical response has been to assess the market first — which is now standard — and to use goods where the assessment says a market cannot respond.

E) The cost argument is the one that decided the matter administratively. Delivering food aid involves purchase, shipping, port handling, warehousing, trucking and distribution, and the proportion of a donor's money that reaches the recipient as value is low; comparisons in the same emergencies have found cash delivering appreciably more value per unit spent, chiefly because most of the logistics disappear. A transfer to a mobile phone costs very little to make once the registration has been done.

F) I think the strongest argument for cash is one the evaluations cannot measure. A family receiving a fixed parcel is being told what it needs by somebody who does not know; a family receiving money decides for itself, and the decisions turn out to be good ones. The relevant knowledge — which child is sick, which debt is urgent, whether a roof or a school fee matters more this month — is held entirely by the household and cannot be transmitted to an agency at any realistic cost. That is an argument about information, not about dignity, though the dignity argument also seems to me correct. An agency buying on a household's behalf is not merely being paternalistic; it is being paternalistic with worse information than the household already has.

G) Where I would resist the current enthusiasm is in the direction of treating cash as a universal answer. There are things a household cannot buy individually however much money it has: a vaccination programme, a water supply, a functioning clinic, the clearing of a road. Cash works for goods that exist in a market and fails for everything that has to be provided collectively, and the recent tendency to describe it as the default response risks quietly defunding the second category. The honest formulation is that cash should be the default for private consumption and is irrelevant to public provision, and that the two have different budgets for a reason.`,
      questions: [
        fromList(
          "matching_information",
          AID_PARAGRAPHS,
          "the objections that were originally raised against handing over money",
          "B",
          "It was said that recipients would spend the money badly, on alcohol or tobacco; that handing out money in a place short of goods would simply raise prices; that men would take the money from women; and that cash was more easily stolen than a warehouse of grain.",
          "Paragraph B lists the four objections.",
        ),
        fromList(
          "matching_information",
          AID_PARAGRAPHS,
          "what recipients are actually found to spend the money on",
          "C",
          "Across a large number of studies in different countries, cash transfers to poor households are spent overwhelmingly on food, school costs, medical treatment, tools and debt repayment, and expenditure on alcohol and tobacco does not rise; in several studies it falls.",
          "Paragraph C gives the spending pattern.",
        ),
        fromList(
          "matching_information",
          AID_PARAGRAPHS,
          "the steps that make delivering goods expensive",
          "E",
          "Delivering food aid involves purchase, shipping, port handling, warehousing, trucking and distribution, and the proportion of a donor's money that reaches the recipient as value is low; comparisons in the same emergencies have found cash delivering appreciably more value per unit spent, chiefly because most of the logistics disappear.",
          "Paragraph E lists the logistics.",
        ),
        fromList(
          "matching_information",
          AID_PARAGRAPHS,
          "an argument about where the necessary knowledge is held",
          "F",
          "The relevant knowledge — which child is sick, which debt is urgent, whether a roof or a school fee matters more this month — is held entirely by the household and cannot be transmitted to an agency at any realistic cost.",
          "Paragraph F locates the knowledge in the household.",
        ),
        fromList(
          "matching_information",
          AID_PARAGRAPHS,
          "things that no household can purchase for itself",
          "G",
          "There are things a household cannot buy individually however much money it has: a vaccination programme, a water supply, a functioning clinic, the clearing of a road.",
          "Paragraph G names the collective goods.",
        ),
        ynng(
          "The writer believes recipients spend cash transfers unwisely.",
          "NO",
          "The spending objection has not survived.",
          "That objection 'has not survived'.",
        ),
        ynng(
          "The writer accepts that transfers can raise prices in some markets.",
          "YES",
          "If money is injected into a market that cannot supply more goods, prices do rise and the transfer partly flows to traders rather than to recipients.",
          "In such a market 'prices do rise'.",
        ),
        ynng(
          "The writer thinks the argument from dignity is mistaken.",
          "NO",
          "That is an argument about information, not about dignity, though the dignity argument also seems to me correct.",
          "The dignity argument 'also seems to me correct'.",
        ),
        ynng(
          "The writer thinks cash should not be treated as a universal answer.",
          "YES",
          "Cash works for goods that exist in a market and fails for everything that has to be provided collectively, and the recent tendency to describe it as the default response risks quietly defunding the second category.",
          "It 'fails for everything that has to be provided collectively'.",
        ),
        fromList(
          "matching_sentence_endings",
          AID_ENDINGS,
          "Money given to poor households goes on food, schooling and medicine,",
          "although expenditure on alcohol and tobacco falls in several studies.",
          "Across a large number of studies in different countries, cash transfers to poor households are spent overwhelmingly on food, school costs, medical treatment, tools and debt repayment, and expenditure on alcohol and tobacco does not rise; in several studies it falls.",
          "Spending on alcohol does not rise and often falls.",
        ),
        fromList(
          "matching_sentence_endings",
          AID_ENDINGS,
          "An injection of money raises prices where supply cannot grow,",
          "because the transfer then flows partly to traders instead of to recipients.",
          "If money is injected into a market that cannot supply more goods, prices do rise and the transfer partly flows to traders rather than to recipients.",
          "The traders capture part of it.",
        ),
        fromList(
          "matching_sentence_endings",
          AID_ENDINGS,
          "Which method to use is a question about a particular place,",
          "which is why the market has to be assessed before the method is chosen.",
          "This is a question about a particular place at a particular time, and the practical response has been to assess the market first — which is now standard — and to use goods where the assessment says a market cannot respond.",
          "The assessment comes first.",
        ),
        fromList(
          "matching_sentence_endings",
          AID_ENDINGS,
          "Cash delivers more value for each unit a donor spends,",
          "since almost all of the shipping, warehousing and trucking disappears.",
          "Delivering food aid involves purchase, shipping, port handling, warehousing, trucking and distribution, and the proportion of a donor's money that reaches the recipient as value is low; comparisons in the same emergencies have found cash delivering appreciably more value per unit spent, chiefly because most of the logistics disappear.",
          "Most of the logistics disappear.",
        ),
        fromList(
          "matching_sentence_endings",
          AID_ENDINGS,
          "A household chooses better than an agency is able to,",
          "because nobody outside the household knows which child is ill this week.",
          "The relevant knowledge — which child is sick, which debt is urgent, whether a roof or a school fee matters more this month — is held entirely by the household and cannot be transmitted to an agency at any realistic cost.",
          "The knowledge sits inside the household.",
        ),
      ],
    },
  ],
};
