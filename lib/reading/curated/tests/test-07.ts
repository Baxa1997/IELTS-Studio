import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · notes box ------------------------------------------------------

const VINYL = {
  title: "Vinyl records today",
  layout: "notes" as const,
  wordLimit: "NO MORE THAN TWO WORDS",
};

// ---- Passage 2 · lettered paragraphs and people ---------------------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const PEOPLE = ["Ingrid Solberg", "Paolo Ferri", "Arjun Mehta", "Lucía Romero"];

// ---- Passage 3 · word bank ------------------------------------------------------

const BANK = [
  "heat",
  "salt",
  "denser",
  "lighter",
  "abruptly",
  "gradually",
  "southwards",
  "northwards",
  "fishing",
  "colder",
];

export const TEST_07: CuratedTest = {
  key: "full-test-07",
  targetBand: 7,
  passages: [
    {
      key: "t07-p1-vinyl-revival",
      title: "The Return of the Record",
      topic: "why vinyl records have become popular again",
      difficulty: 6,
      body: `For much of the twentieth century, the vinyl record was the main way in which people bought and listened to music. A thin plastic disc with a spiral groove cut into each side, it was played on a turntable, where a needle followed the groove and converted its tiny variations into sound. Records were fragile, easily scratched and inconvenient to carry, and many people were glad to replace them. From the 1980s onwards, the record was pushed aside first by the compact disc and later by digital downloads and streaming. By the early 2000s, many observers assumed that records would soon survive only in second-hand shops and the collections of a few enthusiasts.

Instead, something unexpected happened. Sales of new records began to rise again in the late 2000s and continued to grow for well over a decade. In the United States, vinyl records overtook compact discs in the number of units sold in 2022, for the first time since the 1980s. Record shops that had closed were replaced by new independent stores, and major supermarkets and bookshops began selling records alongside books and clothing. Many shops now hold special events on an annual day devoted to independent record stores. Even so, vinyl still accounts for only a small share of the money earned from recorded music, most of which now comes from streaming.

Several explanations have been offered for the revival. One is that records offer something that streaming cannot: a physical object. A record comes in a large cardboard sleeve, often with artwork, photographs and printed lyrics, and many buyers value it as a collectable item as much as a way of listening to music. Some artists release special editions on coloured vinyl, which can sell out within hours. Surveys have even found that a significant proportion of people who buy records do not own a turntable, suggesting that some purchases are made to support favourite artists or simply to display.

Another explanation concerns the experience of listening. Playing a record requires a degree of effort: the listener must take it out of its sleeve, place it on the turntable and turn it over after about twenty minutes. Many enthusiasts say that this encourages them to listen to an album from beginning to end, rather than skipping between songs. Some also claim that records sound warmer than digital files, although scientific tests have produced mixed results, and differences often depend more on how a recording was produced than on the format itself. Records also have practical limits: a single side can hold only a limited amount of music before the sound quality begins to suffer.

Producing records, however, is not straightforward. The process begins when a recording is cut into a lacquer-coated disc. This disc is then coated with metal to create a series of moulds, the last of which, called a stamper, is used to press the grooves into heated plastic. Because very few new pressing machines were built during the decades of decline, the industry relied for many years on old equipment, some of it dating from the 1970s. When demand rose, factories struggled to keep up, and some musicians had to wait many months for their records to be made. In recent years, several companies have begun manufacturing new presses for the first time in decades.

The revival has also raised environmental concerns. Most records are made from a plastic called PVC, which is produced from fossil fuels and is difficult to recycle. A single record weighs between around 120 and 200 grams, and millions are sold every year. Some manufacturers are now experimenting with alternative materials, including recycled plastic and plant-based compounds, while others have switched to renewable energy in their factories. Researchers point out that the environmental cost of streaming is not zero either, since it depends on large data centres that consume considerable amounts of electricity.

It is unclear how long the revival will last. Prices of new records have risen sharply, and some analysts believe that sales growth has begun to slow. Second-hand records, meanwhile, remain popular with buyers looking for lower prices. Yet the popularity of records among young people, many of whom were born long after compact discs replaced them, suggests that their appeal is not simply nostalgia. For a generation that has grown up with unlimited music on demand, owning a small collection of objects that must be chosen, handled and cared for may be precisely the point.`,
      questions: [
        noteLine(
          VINYL,
          "Reasons for the revival",
          "many buyers see records as ______ items",
          "collectable",
          "A record comes in a large cardboard sleeve, often with artwork, photographs and printed lyrics, and many buyers value it as a collectable item as much as a way of listening to music.",
          "Buyers value a record 'as a collectable item as much as a way of listening'.",
        ),
        noteLine(
          VINYL,
          "Reasons for the revival",
          "many people who buy records do not have a ______",
          "turntable",
          "Surveys have even found that a significant proportion of people who buy records do not own a turntable, suggesting that some purchases are made to support favourite artists or simply to display.",
          "Many buyers 'do not own a turntable'.",
        ),
        noteLine(
          VINYL,
          "Reasons for the revival",
          "a record must be turned over after about twenty ______",
          "minutes",
          "Playing a record requires a degree of effort: the listener must take it out of its sleeve, place it on the turntable and turn it over after about twenty minutes.",
          "It must be turned over 'after about twenty minutes'.",
        ),
        noteLine(
          VINYL,
          "Production",
          "recording first cut into a ______ disc",
          "lacquer-coated",
          "The process begins when a recording is cut into a lacquer-coated disc.",
          "The recording is cut 'into a lacquer-coated disc'.",
        ),
        noteLine(
          VINYL,
          "Production",
          "the final mould, a ______, presses grooves into heated plastic",
          "stamper",
          "This disc is then coated with metal to create a series of moulds, the last of which, called a stamper, is used to press the grooves into heated plastic.",
          "The last mould is 'called a stamper'.",
        ),
        noteLine(
          VINYL,
          "Production",
          "industry depended on old ______, some from the 1970s",
          "equipment",
          "Because very few new pressing machines were built during the decades of decline, the industry relied for many years on old equipment, some of it dating from the 1970s.",
          "It 'relied for many years on old equipment'.",
        ),
        noteLine(
          VINYL,
          "Environmental concerns",
          "most records made from PVC, which comes from ______",
          "fossil fuels",
          "Most records are made from a plastic called PVC, which is produced from fossil fuels and is difficult to recycle.",
          "PVC 'is produced from fossil fuels'.",
        ),
        tfng(
          "Vinyl records now earn more money than streaming.",
          "FALSE",
          "Even so, vinyl still accounts for only a small share of the money earned from recorded music, most of which now comes from streaming.",
          "Vinyl earns 'only a small share'; most money 'now comes from streaming'.",
        ),
        tfng(
          "In 2022, more vinyl records than compact discs were sold in the United States.",
          "TRUE",
          "In the United States, vinyl records overtook compact discs in the number of units sold in 2022, for the first time since the 1980s.",
          "Vinyl 'overtook compact discs in the number of units sold in 2022'.",
        ),
        tfng(
          "Scientific tests have proved that records sound better than digital files.",
          "FALSE",
          "Some also claim that records sound warmer than digital files, although scientific tests have produced mixed results, and differences often depend more on how a recording was produced than on the format itself.",
          "Tests 'have produced mixed results', so nothing has been proved.",
        ),
        tfng(
          "Some musicians had to wait a long time for their records to be manufactured.",
          "TRUE",
          "When demand rose, factories struggled to keep up, and some musicians had to wait many months for their records to be made.",
          "Some 'had to wait many months for their records to be made'.",
        ),
        tfng(
          "Records made from plant-based compounds are cheaper to produce than PVC records.",
          "NOT GIVEN",
          "",
          "Plant-based compounds are mentioned as an experiment, but their cost is not.",
        ),
        tfng(
          "Most young people who buy records use turntables they have inherited from their parents.",
          "NOT GIVEN",
          "",
          "Young buyers are mentioned, but not where their turntables come from.",
        ),
      ],
    },
    {
      key: "t07-p2-glaciers",
      title: "Glaciers in Retreat",
      topic: "why shrinking glaciers matter for people around the world",
      difficulty: 7,
      body: `A) Glaciers have shaped some of the world's most dramatic landscapes, carving valleys, depositing fertile soils and feeding rivers that support hundreds of millions of people. They are also important to local economies, attracting tourists and providing water for hydroelectric power. Today they are shrinking almost everywhere. According to international monitoring programmes, the world's glaciers have lost a substantial proportion of their ice since the middle of the twentieth century, and the rate of loss has accelerated in recent decades. Scientists estimate that many smaller glaciers in regions such as the Alps could largely disappear by the end of this century. The United Nations declared 2025 the International Year of Glaciers' Preservation, reflecting growing concern about what their decline means for water supplies, natural hazards and sea levels.

B) A glacier grows or shrinks depending on the balance between the snow that falls on it each year and the ice that melts or breaks away. When winters bring less snow or summers become warmer, the glacier loses more ice than it gains, and its front retreats up the valley. Glaciers also grow darker as dust and soot settle on them, which causes them to absorb more heat. Scientists measure these changes by placing stakes in the ice, using satellite images and flying aircraft equipped with radar. Glaciologist Dr Ingrid Solberg explains that glaciers respond slowly to changes in climate, which means that many are still adjusting to warming that has already taken place. "Even if temperatures stopped rising tomorrow," she says, "many small glaciers would continue to disappear."

C) The effects are especially visible in the European Alps. In 2022 and 2023, Swiss glaciers lost around a tenth of their remaining volume in just two years, following unusually hot summers and winters with little snow. Some small glaciers have already vanished completely, and scientists have held ceremonies marking their loss. Visitors to some Alpine sites now walk considerably further to reach the edge of the ice than visitors did a generation ago. Climber and mountain guide Paolo Ferri describes routes that he first climbed on ice decades ago as now consisting largely of loose rock, which has made them more dangerous and, in some cases, impossible to use.

D) Melting glaciers can also create hazards. As ice retreats, meltwater may collect in lakes held back by unstable walls of loose rock and sediment. If such a barrier fails, the water can be released suddenly, sending floods down valleys where people live. Such floods can destroy roads, bridges and farmland within minutes. Hazard specialist Dr Arjun Mehta notes that the number and size of these lakes have grown significantly in mountain ranges such as the Himalayas and the Andes. Monitoring them with satellites and installing warning systems, he argues, is far cheaper than dealing with the consequences of a disaster.

E) For many communities, the most serious long-term concern is water. In parts of Asia and South America, glaciers act as natural reservoirs, storing water in winter and releasing it gradually during warm, dry months, when rivers would otherwise run low. In the short term, faster melting can actually increase the amount of water flowing downstream, a period sometimes described as peak water. Once a glacier becomes too small, however, the flow declines, leaving farmers and cities without a supply they have depended on for generations. Mountain communities that rely on meltwater for irrigation are particularly vulnerable, since they have few alternative sources.

F) Glaciers also contribute to rising sea levels, although their role is often confused with that of the great ice sheets of Greenland and Antarctica. Mountain glaciers contain far less ice than the ice sheets, but because many of them are melting rapidly, they have been responsible for a significant share of the sea-level rise observed in recent decades. Ocean scientist Dr Lucía Romero points out that even a few centimetres of additional rise can make storm floods considerably more damaging for coastal cities. She adds that the melting of glaciers in one region can affect coastlines on the other side of the world.

G) Efforts to slow the loss of individual glaciers have been tried on a small scale. At some ski resorts and tourist sites, glaciers are covered with reflective sheets during the summer to reduce melting. Such measures can protect small areas, but they are expensive and impractical on a larger scale. In some mountain regions, communities have experimented with building artificial ice structures in winter that store water until spring. Solberg stresses that the only lasting solution is to reduce greenhouse gas emissions, and that preparing communities to adapt to glacier loss must begin now.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a mention of ceremonies held when glaciers disappear",
          "C",
          "Some small glaciers have already vanished completely, and scientists have held ceremonies marking their loss.",
          "Paragraph C: scientists 'have held ceremonies marking their loss'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an explanation of how lakes formed by melting ice can become dangerous",
          "D",
          "If such a barrier fails, the water can be released suddenly, sending floods down valleys where people live.",
          "Paragraph D explains how an unstable barrier can fail and release floods.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to a temporary increase in the water supplied by glaciers",
          "E",
          "In the short term, faster melting can actually increase the amount of water flowing downstream, a period sometimes described as peak water.",
          "Paragraph E describes 'peak water', a short-term increase.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "methods scientists use to measure changes in glaciers",
          "B",
          "Scientists measure these changes by placing stakes in the ice, using satellite images and flying aircraft equipped with radar.",
          "Paragraph B lists stakes, satellite images and radar.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Glaciers absorb more heat when dust and ______ settle on their surface.",
          "soot",
          "Glaciers also grow darker as dust and soot settle on them, which causes them to absorb more heat.",
          "'Dust and soot settle on them', making them darker.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "In summer, some glaciers are covered with ______ sheets to reduce melting.",
          "reflective",
          "At some ski resorts and tourist sites, glaciers are covered with reflective sheets during the summer to reduce melting.",
          "They are covered 'with reflective sheets'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Such measures can only protect small areas and are also ______.",
          "expensive",
          "Such measures can protect small areas, but they are expensive and impractical on a larger scale.",
          "They 'are expensive and impractical on a larger scale'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Some mountain communities build artificial ______ structures in winter to store water.",
          "ice",
          "In some mountain regions, communities have experimented with building artificial ice structures in winter that store water until spring.",
          "They build 'artificial ice structures in winter'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Many glaciers will go on shrinking even if the climate stops warming.",
          "Ingrid Solberg",
          '"Even if temperatures stopped rising tomorrow," she says, "many small glaciers would continue to disappear."',
          "Solberg: small glaciers 'would continue to disappear' even if warming stopped.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "The loss of ice has made some climbing routes unsafe.",
          "Paolo Ferri",
          "Climber and mountain guide Paolo Ferri describes routes that he first climbed on ice decades ago as now consisting largely of loose rock, which has made them more dangerous and, in some cases, impossible to use.",
          "Ferri's old ice routes are now loose rock and 'more dangerous'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Preventing disasters costs less than dealing with their effects.",
          "Arjun Mehta",
          "Monitoring them with satellites and installing warning systems, he argues, is far cheaper than dealing with the consequences of a disaster.",
          "Mehta: monitoring 'is far cheaper than dealing with the consequences'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "A small rise in sea level can make coastal flooding much more serious.",
          "Lucía Romero",
          "Ocean scientist Dr Lucía Romero points out that even a few centimetres of additional rise can make storm floods considerably more damaging for coastal cities.",
          "Romero: 'even a few centimetres' makes storm floods 'considerably more damaging'.",
        ),
        fromList(
          "matching_features",
          PEOPLE,
          "Communities must start preparing now for the loss of glaciers.",
          "Ingrid Solberg",
          "Solberg stresses that the only lasting solution is to reduce greenhouse gas emissions, and that preparing communities to adapt to glacier loss must begin now.",
          "Solberg again: preparing communities 'must begin now'.",
        ),
      ],
    },
    {
      key: "t07-p3-atlantic-circulation",
      title: "Is the Atlantic's Great Current Weakening?",
      topic: "the debate over the future of the Atlantic Ocean circulation",
      difficulty: 8,
      body: `Western Europe enjoys a remarkably mild climate for its latitude. London lies further north than Calgary in Canada, yet its winters are far less severe, and ports in northern Norway remain free of ice throughout the year. Part of the explanation lies in a vast system of ocean currents known as the Atlantic Meridional Overturning Circulation, or AMOC. Warm, salty water flows northwards near the surface of the Atlantic, releasing heat into the atmosphere as it travels. In the far North Atlantic, the water cools, becomes denser and sinks, before flowing back southwards at great depth. The circulation acts like a conveyor belt, carrying enormous quantities of heat around the planet.

For several decades, scientists have been concerned that climate change could weaken this system. As the Greenland ice sheet melts and rainfall increases at high latitudes, large amounts of fresh water enter the North Atlantic. Fresh water is less dense than salt water, so it is less likely to sink, which could slow the overturning process. Evidence from ancient climates adds to the concern. Sediments from the ocean floor suggest that the circulation has switched between strong and weak states in the past, sometimes abruptly, with dramatic effects on temperatures around the North Atlantic. One such event, around 12,900 years ago, is associated with a sudden return to near-glacial conditions in parts of the Northern Hemisphere.

Whether the AMOC is already weakening is surprisingly difficult to establish. Continuous direct measurements began only in 2004, when scientists installed a line of instruments across the Atlantic at around 26 degrees north. The instruments measure temperature, salinity and the speed of currents at different depths. They have recorded considerable variation from year to year, but the period is too short to distinguish a long-term trend from natural fluctuations. Researchers have therefore turned to indirect evidence, such as patterns of sea surface temperature. One striking feature is a region south of Greenland that has cooled over the past century, while most of the world has warmed, and some scientists interpret this cold patch as a sign that less heat is being delivered northwards.

In 2023, a study attracted worldwide attention by suggesting, on the basis of temperature records, that the circulation could collapse at some point between 2025 and 2095. Other researchers were quick to question the conclusion, pointing out that it relied on indirect measurements and on a simplified model of how the system behaves. Most climate models suggest that the AMOC will weaken substantially during this century but will not collapse completely. In my view, the disagreement should not be read as a sign that the risk is exaggerated. The fact that a collapse is considered unlikely does not mean that it can be safely ignored, given how severe its consequences would be.

Those consequences would not be confined to Europe. Models suggest that a collapse would cause winters in north-western Europe to become much colder, even as the rest of the world continued to warm. Agriculture in parts of Europe could also be affected, since colder conditions and reduced rainfall would shorten growing seasons. Rainfall patterns in the tropics could shift southwards, affecting monsoons on which billions of people depend for agriculture. Sea levels along the east coast of North America could rise more rapidly, because the circulation currently helps to pull water away from that coastline. The effects on marine ecosystems, including important fishing grounds, could also be severe.

Given the uncertainty, some commentators argue that it is irresponsible to discuss the possibility of collapse at all, since it may cause unnecessary alarm. I disagree. Public discussion of low-probability, high-impact risks is a normal part of preparing for them, whether the risk is a pandemic, a financial crisis or a failure of critical infrastructure. What matters is that such risks are communicated honestly, with the uncertainty clearly explained, rather than presented either as certainties or as fantasies. Scientists themselves have a responsibility to avoid overstating their findings, but so do those who dismiss them.

The most important response is the same whatever the true state of the circulation: reducing greenhouse gas emissions lowers the risk. At the same time, expanding the network of instruments that monitor the ocean would allow scientists to detect changes earlier and with greater confidence. Some of these instruments are fixed to the sea floor, while others drift with the currents and rise to the surface to transmit their data. Several research programmes are working towards this goal, and the data they collect over the coming decades will be essential in resolving a question that current evidence cannot yet answer.`,
      questions: [
        mcq(
          "What does the writer say about the climate of western Europe?",
          [
            "It is milder than its latitude would suggest.",
            "It depends entirely on winds from the Atlantic.",
            "It has become colder over the past century.",
            "It is similar to the climate of Calgary.",
          ],
          "It is milder than its latitude would suggest.",
          "Western Europe enjoys a remarkably mild climate for its latitude.",
          "It is 'remarkably mild' for its latitude. D is a trap: London is compared with Calgary to show that its winters are far less severe.",
        ),
        mcq(
          "Why could melting ice in Greenland weaken the circulation?",
          [
            "It makes the surface of the ocean warmer.",
            "The fresh water it adds is less likely to sink.",
            "It increases the amount of salt in the North Atlantic.",
            "It blocks the flow of warm water northwards.",
          ],
          "The fresh water it adds is less likely to sink.",
          "Fresh water is less dense than salt water, so it is less likely to sink, which could slow the overturning process.",
          "Fresh water 'is less likely to sink', slowing the overturning. C is the opposite: fresh water reduces saltiness.",
        ),
        mcq(
          "Why is it difficult to tell whether the circulation is already weakening?",
          [
            "The instruments across the Atlantic often fail.",
            "Direct measurements have been made for only a short period.",
            "Scientists disagree about where the instruments should be placed.",
            "Sea surface temperatures have remained unchanged.",
          ],
          "Direct measurements have been made for only a short period.",
          "They have recorded considerable variation from year to year, but the period is too short to distinguish a long-term trend from natural fluctuations.",
          "Measurements began only in 2004, and 'the period is too short to distinguish a long-term trend'.",
        ),
        mcq(
          "What criticism was made of the 2023 study?",
          [
            "It ignored the available temperature records.",
            "It relied on indirect measurements and a simplified model.",
            "It predicted that the circulation would grow stronger.",
            "It was based on data from a single year.",
          ],
          "It relied on indirect measurements and a simplified model.",
          "Other researchers were quick to question the conclusion, pointing out that it relied on indirect measurements and on a simplified model of how the system behaves.",
          "Critics said it 'relied on indirect measurements and on a simplified model'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "As warm surface water moves north, it releases ______ into the atmosphere.",
          "heat",
          "Warm, salty water flows northwards near the surface of the Atlantic, releasing heat into the atmosphere as it travels.",
          "The water is 'releasing heat into the atmosphere'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "In the far North Atlantic, the water cools, becomes ______ and sinks.",
          "denser",
          "In the far North Atlantic, the water cools, becomes denser and sinks, before flowing back southwards at great depth.",
          "It 'becomes denser and sinks'. 'Lighter' is the opposite.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Ocean sediments show that in the past the circulation sometimes changed ______.",
          "abruptly",
          "Sediments from the ocean floor suggest that the circulation has switched between strong and weak states in the past, sometimes abruptly, with dramatic effects on temperatures around the North Atlantic.",
          "It switched states 'sometimes abruptly'. 'Gradually' is the opposite.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "A collapse could make winters in north-western Europe much ______.",
          "colder",
          "Models suggest that a collapse would cause winters in north-western Europe to become much colder, even as the rest of the world continued to warm.",
          "Winters would 'become much colder'.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Rainfall patterns in the tropics could move ______.",
          "southwards",
          "Rainfall patterns in the tropics could shift southwards, affecting monsoons on which billions of people depend for agriculture.",
          "Rainfall 'could shift southwards'. 'Northwards' describes the surface current, not the rainfall.",
        ),
        fromList(
          "summary_completion",
          BANK,
          "Important ______ grounds could also suffer serious effects.",
          "fishing",
          "The effects on marine ecosystems, including important fishing grounds, could also be severe.",
          "The effects on 'important fishing grounds' could be severe.",
        ),
        ynng(
          "The disagreement among scientists shows that the risk of collapse has been exaggerated.",
          "NO",
          "In my view, the disagreement should not be read as a sign that the risk is exaggerated.",
          "The writer says the disagreement 'should not be read as a sign that the risk is exaggerated'.",
        ),
        ynng(
          "An unlikely event with very serious consequences still deserves attention.",
          "YES",
          "The fact that a collapse is considered unlikely does not mean that it can be safely ignored, given how severe its consequences would be.",
          "An unlikely collapse cannot 'be safely ignored, given how severe its consequences would be'.",
        ),
        ynng(
          "It is irresponsible to discuss the possibility that the circulation might collapse.",
          "NO",
          "Public discussion of low-probability, high-impact risks is a normal part of preparing for them, whether the risk is a pandemic, a financial crisis or a failure of critical infrastructure.",
          "The writer disagrees with this view, calling such discussion 'a normal part of preparing' for risks.",
        ),
        ynng(
          "Governments in Europe have already begun preparing for a collapse of the circulation.",
          "NOT GIVEN",
          "",
          "Government preparations are never mentioned.",
        ),
      ],
    },
  ],
};
