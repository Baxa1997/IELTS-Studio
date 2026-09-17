import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of a luxury · notes + True/False/Not Given ----------

const PURPLE = {
  title: "Tyrian purple",
  layout: "notes" as const,
  wordLimit: "NO MORE THAN TWO WORDS",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs and people -----------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ENERGY_PEOPLE = ["Sofia Lindberg", "Miguel Serrano", "Rachel Adebayo", "Omar Nasser"];

// ---- Passage 3 · writer's views · word bank ----------------------------------

const INSECT_BANK = [
  "habitat",
  "plants",
  "light",
  "nutrients",
  "results",
  "monitoring",
  "rain",
  "profits",
  "headlines",
  "temperatures",
];

export const TEST_20: CuratedTest = {
  key: "full-test-20",
  targetBand: 7,
  passages: [
    {
      key: "t20-p1-tyrian-purple",
      title: "The Colour of Emperors",
      topic: "how an ancient dye made from sea snails became a symbol of power",
      difficulty: 6,
      body: `For more than two thousand years, one colour was associated above all others with power and wealth. Tyrian purple, a deep reddish-purple dye, was worn by kings, emperors and high officials across the ancient Mediterranean world, and in some periods ordinary people were forbidden by law to wear it. Its value came not only from its beauty and its resistance to fading but also from the extraordinary effort required to make it. The dye was obtained from sea snails, and thousands of them were needed to colour a single garment.

The dye takes its name from Tyre, a city on the coast of what is now Lebanon, which was one of the main centres of production. It is most closely associated with the Phoenicians, a trading people whose ships carried goods across the Mediterranean. The Phoenicians were not, however, the first to make purple dye: archaeologists have found evidence that it was produced on the island of Crete several centuries earlier. Some historians believe that the name "Phoenicia" itself may come from a Greek word for the colour, although this remains uncertain.

The dye comes from a gland inside several species of sea snail, known as murex snails. In the living snail, the gland produces a clear or pale liquid, which the animal uses to defend itself and to paralyse its prey. When the liquid is exposed to air and sunlight, a series of chemical reactions turns it first yellow, then green and finally purple. Ancient dyers learned to control this process with great skill, producing a range of shades from red to deep violet.

Producing the dye was a smelly and labour-intensive business. The snails were caught in traps containing bait, and their shells were broken open, or the glands removed, while they were still alive. The glands were then left to soak in salt water for several days before being heated slowly in large containers, often made of lead or tin, for about ten days. The smell of rotting snails was so strong that dye works were usually located outside towns, and ancient writers complained about the odour. Enormous heaps of broken shells, some of them several metres high, have been found at ancient production sites.

The quantities involved were staggering. Modern experiments suggest that around 10,000 snails may be needed to produce a single gram of pure dye, enough to colour only the edge of a garment. As a result, purple cloth was extremely expensive. According to an official list of prices issued by the Roman government in 301 CE, a pound of the finest purple silk cost more than a pound of gold. The colour's rarity made it an ideal symbol of status, and Roman emperors eventually claimed the right to wear the finest purple for themselves alone.

In the Byzantine Empire, which continued in the eastern Mediterranean after the fall of Rome in the west, purple remained closely associated with the ruling family. Children born to a reigning emperor were described as "born in the purple", a phrase that referred to a special room in the imperial palace whose walls were lined with purple stone. The production of the finest dye was controlled by the state. After the city of Constantinople was captured in 1453, however, the ancient industry came to an end, and the knowledge of how to make the finest purple was lost.

For centuries afterwards, purple remained a rare and expensive colour. This changed in 1856, when an 18-year-old English chemistry student, William Perkin, was trying to make a medicine to treat malaria. One of his experiments produced a dark substance which, when dissolved, gave a brilliant purple colour. Perkin realised its commercial potential, left his studies and opened a factory to produce the dye, which became known as mauve. It was the first artificial dye to be produced on a large scale, and it soon became fashionable across Europe. Within a few decades, chemists had created artificial dyes in almost every colour, and purple was no longer a luxury.

Interest in the ancient dye has not disappeared. Archaeologists continue to study production sites, and chemists have analysed traces of purple on ancient textiles to learn how the dye was made. A few modern craftspeople have even attempted to recreate the process using traditional methods, sometimes spending years perfecting a single shade. Their experiments confirm what the ancient sources suggest: that the colour of emperors was among the most difficult substances ever produced by human hands.`,
      questions: [
        noteLine(
          PURPLE,
          "Origins",
          "named after the city of ______",
          "Tyre",
          "The dye takes its name from Tyre, a city on the coast of what is now Lebanon, which was one of the main centres of production.",
          "The dye 'takes its name from Tyre'.",
        ),
        noteLine(
          PURPLE,
          "Origins",
          "closely linked with the Phoenicians, a ______ people",
          "trading",
          "It is most closely associated with the Phoenicians, a trading people whose ships carried goods across the Mediterranean.",
          "The Phoenicians were 'a trading people'.",
        ),
        noteLine(
          PURPLE,
          "Making the dye",
          "comes from a ______ inside murex snails",
          "gland",
          "The dye comes from a gland inside several species of sea snail, known as murex snails.",
          "The dye 'comes from a gland inside several species of sea snail'.",
        ),
        noteLine(
          PURPLE,
          "Making the dye",
          "liquid turns purple when exposed to air and ______",
          "sunlight",
          "When the liquid is exposed to air and sunlight, a series of chemical reactions turns it first yellow, then green and finally purple.",
          "Exposure 'to air and sunlight' changes the colour.",
        ),
        noteLine(
          PURPLE,
          "Making the dye",
          "glands left to soak in ______ for several days",
          "salt water",
          "The glands were then left to soak in salt water for several days before being heated slowly in large containers, often made of lead or tin, for about ten days.",
          "The glands were 'left to soak in salt water for several days'.",
        ),
        noteLine(
          PURPLE,
          "Making the dye",
          "dye works built outside towns because of the ______",
          "smell",
          "The smell of rotting snails was so strong that dye works were usually located outside towns, and ancient writers complained about the odour.",
          "'The smell of rotting snails was so strong' that dye works were outside towns.",
        ),
        noteLine(
          PURPLE,
          "Later history",
          "1856: Perkin's new dye became known as ______",
          "mauve",
          "Perkin realised its commercial potential, left his studies and opened a factory to produce the dye, which became known as mauve.",
          "The dye 'became known as mauve'.",
        ),
        tfng(
          "At certain times, ordinary people were not legally allowed to wear purple.",
          "TRUE",
          "Tyrian purple, a deep reddish-purple dye, was worn by kings, emperors and high officials across the ancient Mediterranean world, and in some periods ordinary people were forbidden by law to wear it.",
          "'In some periods ordinary people were forbidden by law to wear it.'",
        ),
        tfng(
          "The Phoenicians were the first people to produce purple dye.",
          "FALSE",
          "The Phoenicians were not, however, the first to make purple dye: archaeologists have found evidence that it was produced on the island of Crete several centuries earlier.",
          "It was made on Crete 'several centuries earlier'.",
        ),
        tfng(
          "Murex snails use the liquid from their gland for protection.",
          "TRUE",
          "In the living snail, the gland produces a clear or pale liquid, which the animal uses to defend itself and to paralyse its prey.",
          "The snail 'uses [it] to defend itself'.",
        ),
        tfng(
          "One gram of the dye was enough to colour a complete garment.",
          "FALSE",
          "Modern experiments suggest that around 10,000 snails may be needed to produce a single gram of pure dye, enough to colour only the edge of a garment.",
          "A gram was 'enough to colour only the edge of a garment'.",
        ),
        tfng(
          "The Byzantine state sold purple cloth to foreign rulers.",
          "NOT GIVEN",
          "",
          "The state controlled production, but nothing is said about selling cloth abroad.",
        ),
        tfng(
          "Perkin became very rich as a result of his discovery.",
          "NOT GIVEN",
          "",
          "Perkin opened a factory and mauve became fashionable, but his personal wealth is not mentioned.",
        ),
      ],
    },
    {
      key: "t20-p2-data-centres",
      title: "The Hidden Cost of the Cloud",
      topic: "the rising energy and water demands of data centres",
      difficulty: 7,
      body: `A) Every time someone streams a film, sends an email or asks a chatbot a question, the request is processed in a data centre: a building, sometimes as large as several football pitches, filled with rows of computer servers. These facilities are the physical foundation of what is often called "the cloud", a term that makes digital services sound weightless. In reality, data centres consume enormous amounts of electricity, and the rapid growth of artificial intelligence is causing that demand to rise faster than at any time in the industry's history. The companies that run them rarely publish detailed figures, which makes the true scale of their impact difficult to judge.

B) According to the International Energy Agency, data centres used around 415 terawatt-hours of electricity in 2024, about one and a half per cent of global electricity consumption. The agency expects this figure to more than double by 2030, reaching slightly more than the amount of electricity used by the whole of Japan today, with AI as the most important driver. Training a large AI model requires thousands of specialised chips running for weeks or months, and answering users' questions also consumes significant energy. Energy analyst Dr Sofia Lindberg notes that the global averages hide large local differences. "Globally the share is modest," she says, "but in some regions data centres are already reshaping the entire electricity system."

C) Ireland is a striking example. The country has attracted many large technology companies, and in 2023 data centres accounted for around a fifth of all the electricity used in the country, more than all the homes in its towns and cities combined. Concerns about pressure on the national grid led the grid operator to restrict new connections in the Dublin area. In the United States, electricity companies in some states have reported that demand from data centres is growing so fast that new power stations will be needed, raising fears that ordinary customers could face higher bills.

D) Water is another concern. Many data centres use water to cool their equipment, because servers produce large amounts of heat. A single large facility can consume millions of litres a day during hot weather, and some have been built in dry regions where water is already scarce. Environmental engineer Professor Miguel Serrano argues that companies should be required to report their water use in detail. "At the moment, communities often have no idea how much water a new data centre will take until it is already operating," he says. Some newer facilities use closed systems that recycle the same water, although these often require more electricity.

E) The industry has responded in several ways. Technology companies have become some of the world's largest buyers of renewable energy, signing long-term contracts for wind and solar power. Some have also turned to nuclear power, which produces electricity continuously without carbon emissions: in 2024, one major company agreed a deal that would allow a closed nuclear reactor in Pennsylvania to restart and supply its data centres. Industry consultant Rachel Adebayo points out that the efficiency of computing has improved enormously. "The amount of work a data centre can do for each unit of energy has risen dramatically over the past two decades," she says.

F) Another approach is to make use of the heat that data centres produce, which would otherwise be wasted. In several Nordic countries, heat from data centres is fed into district heating networks, which pipe hot water to homes and offices. In Finland, a large project is expected to supply heat to a significant share of the homes in the region around Helsinki. Serrano believes that such schemes should become standard. "Heat is not a waste product," he says. "It is a resource we have been throwing away."

G) Some researchers question whether all of the growth in demand is necessary. Computer scientist Dr Omar Nasser suggests that smaller AI models, designed for specific tasks, can often perform as well as larger ones while using a fraction of the energy. "Bigger is not always better," he says. "We should be asking whether each new system is worth the resources it consumes." Others point out that AI may also help to reduce energy use elsewhere, for example by managing electricity grids more efficiently. How these effects balance out will be one of the key questions of the coming decade. The answer will affect electricity bills, climate targets and the future of computing itself.`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a comparison between data centres and homes in terms of electricity use",
          "C",
          "The country has attracted many large technology companies, and in 2023 data centres accounted for around a fifth of all the electricity used in the country, more than all the homes in its towns and cities combined.",
          "Paragraph C: Irish data centres used more electricity than all urban homes combined.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to an agreement involving nuclear power",
          "E",
          "Some have also turned to nuclear power, which produces electricity continuously without carbon emissions: in 2024, one major company agreed a deal that would allow a closed nuclear reactor in Pennsylvania to restart and supply its data centres.",
          "Paragraph E describes the deal to restart a reactor in Pennsylvania.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a forecast of how much electricity data centres will need in future",
          "B",
          "The agency expects this figure to more than double by 2030, reaching slightly more than the amount of electricity used by the whole of Japan today, with AI as the most important driver.",
          "Paragraph B: demand is expected 'to more than double by 2030'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "an example of heat from computers being used to warm buildings",
          "F",
          "In several Nordic countries, heat from data centres is fed into district heating networks, which pipe hot water to homes and offices.",
          "Paragraph F describes district heating from data centre heat.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Training a large AI model needs thousands of specialised ______.",
          "chips",
          "Training a large AI model requires thousands of specialised chips running for weeks or months, and answering users' questions also consumes significant energy.",
          "Training 'requires thousands of specialised chips'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Worries about the grid led to limits on new ______ in the Dublin area.",
          "connections",
          "Concerns about pressure on the national grid led the grid operator to restrict new connections in the Dublin area.",
          "The operator decided 'to restrict new connections in the Dublin area'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Many data centres use water to ______ their equipment.",
          "cool",
          "Many data centres use water to cool their equipment, because servers produce large amounts of heat.",
          "Water is used 'to cool their equipment'.",
        ),
        gapFill(
          "summary_completion",
          "ONE WORD ONLY",
          "Some data centres have been built in ______ regions where water is already scarce.",
          "dry",
          "A single large facility can consume millions of litres a day during hot weather, and some have been built in dry regions where water is already scarce.",
          "Some were 'built in dry regions where water is already scarce'.",
        ),
        fromList(
          "matching_features",
          ENERGY_PEOPLE,
          "Worldwide figures hide important differences between places.",
          "Sofia Lindberg",
          "Energy analyst Dr Sofia Lindberg notes that the global averages hide large local differences.",
          "Lindberg: 'the global averages hide large local differences'.",
        ),
        fromList(
          "matching_features",
          ENERGY_PEOPLE,
          "Local people are often not told how much water a data centre will use.",
          "Miguel Serrano",
          '"At the moment, communities often have no idea how much water a new data centre will take until it is already operating," he says.',
          "Serrano: communities 'often have no idea how much water a new data centre will take'.",
        ),
        fromList(
          "matching_features",
          ENERGY_PEOPLE,
          "Computing now uses energy far more efficiently than in the past.",
          "Rachel Adebayo",
          '"The amount of work a data centre can do for each unit of energy has risen dramatically over the past two decades," she says.',
          "Adebayo: work per unit of energy 'has risen dramatically'.",
        ),
        fromList(
          "matching_features",
          ENERGY_PEOPLE,
          "The heat that data centres produce should be regarded as valuable.",
          "Miguel Serrano",
          '"It is a resource we have been throwing away."',
          "Serrano: heat 'is a resource we have been throwing away'.",
        ),
        fromList(
          "matching_features",
          ENERGY_PEOPLE,
          "Smaller AI systems can sometimes do the same work using much less energy.",
          "Omar Nasser",
          "Computer scientist Dr Omar Nasser suggests that smaller AI models, designed for specific tasks, can often perform as well as larger ones while using a fraction of the energy.",
          "Nasser: smaller models perform as well 'while using a fraction of the energy'.",
        ),
      ],
    },
    {
      key: "t20-p3-insect-decline",
      title: "Are the Insects Disappearing?",
      topic: "what the evidence really shows about the decline of insects",
      difficulty: 8,
      body: `In 2017, a study by a group of amateur and professional insect specialists in Germany caused alarm around the world. Using traps set up in the same way at dozens of nature reserves over a period of 27 years, the researchers found that the total weight of flying insects caught had fallen by more than three-quarters. The decline had occurred in protected areas, where insects might have been expected to be safe. News reports soon spoke of an "insect apocalypse", and the idea that insects were vanishing across the planet became widely accepted. Insect decline is real and serious, in my view, but the story is more complicated, and in some respects more interesting, than those headlines suggested.

Part of the concern arose from the fact that reliable long-term data on insects are scarce. Insects are extraordinarily numerous and diverse; about a million species have been described, and many more remain unknown. Few groups have been monitored systematically over long periods, and most of the monitoring that exists comes from Europe and North America. The German study was valuable precisely because it was one of the few to measure insect numbers consistently over decades. Many people also pointed to their own experience: drivers who remembered windscreens covered in dead insects after summer journeys noticed that this rarely happened any more.

In 2019, a review of published studies went further, claiming that more than 40 per cent of insect species were declining and that insects could disappear within a century. The claim was widely reported, but it was also strongly criticised by other scientists. The review had searched the scientific literature using the word "decline", which meant that studies showing stable or increasing populations were less likely to be included. Critics also objected that results from a limited number of regions had been used to draw conclusions about the whole world. I share these concerns; exaggerated claims, however well intended, risk damaging public trust in science.

A more comprehensive analysis, published in 2020, combined data from 166 long-term surveys at nearly 1,700 sites around the world. It found that land-dwelling insects were declining on average by about 9 per cent per decade, a rate that is serious but considerably slower than some reports had implied. Surprisingly, insects that spend part of their lives in fresh water, such as mayflies and dragonflies, were increasing, probably as a result of efforts to clean up polluted rivers and lakes. The analysis also found large differences between regions, with some of the steepest declines in parts of North America and Europe.

Even this study attracted criticism. Some researchers argued that it combined data of very different quality, and that increases in some places might simply reflect the recovery of habitats that had previously been badly damaged. Nonetheless, its central message has been broadly supported by later work: insect numbers are falling in many places, but not everywhere, and not always at the dramatic rates once suggested.

The causes of decline are reasonably well understood, even if their relative importance varies from place to place. The loss of natural habitat to farming and building is generally considered the most important factor. The widespread use of pesticides, including a group of chemicals that attack the nervous systems of insects, also plays a significant role, as does the use of fertilisers, which can change the plants on which insects depend. Climate change, artificial light at night and species introduced from other regions add further pressure.

The consequences of insect decline could be severe. Insects pollinate a large proportion of the world's crops and wild plants, break down dead material and return nutrients to the soil, and provide food for birds, bats, fish and many other animals. A significant fall in their numbers would affect entire ecosystems, and the effects on food production could be substantial. It is for this reason that I believe the precise rate of decline, though scientifically important, matters less for policy than its direction: the evidence is strong enough to justify action now.

Fortunately, many of the measures that would help insects are well known and relatively simple. Protecting and restoring habitats, reducing the use of pesticides, leaving areas of land uncultivated and planting a greater variety of flowering plants can all make a difference. The recovery of freshwater insects shows that environmental improvements can produce measurable results. What is needed, above all, is better monitoring, so that future debates can be based on solid evidence rather than on dramatic headlines or memories of dirty windscreens.`,
      questions: [
        mcq(
          "What was surprising about the findings of the German study?",
          [
            "The traps had been changed during the study.",
            "The decline had taken place in protected areas.",
            "The study lasted only a few years.",
            "The number of species had increased.",
          ],
          "The decline had taken place in protected areas.",
          "The decline had occurred in protected areas, where insects might have been expected to be safe.",
          "The decline happened 'in protected areas, where insects might have been expected to be safe'.",
        ),
        mcq(
          "Why was the German study considered especially valuable?",
          [
            "It covered every region of the world.",
            "It measured insects in the same way over many years.",
            "It discovered many new species.",
            "It was carried out only by professional scientists.",
          ],
          "It measured insects in the same way over many years.",
          "The German study was valuable precisely because it was one of the few to measure insect numbers consistently over decades.",
          "It was 'one of the few to measure insect numbers consistently over decades'. D is wrong — amateurs took part.",
        ),
        mcq(
          "What was one criticism of the 2019 review?",
          [
            "It used data from too many regions.",
            "Its search method favoured studies that reported declines.",
            "It ignored the German study.",
            "It received very little attention.",
          ],
          "Its search method favoured studies that reported declines.",
          'The review had searched the scientific literature using the word "decline", which meant that studies showing stable or increasing populations were less likely to be included.',
          "Searching for 'decline' made other studies 'less likely to be included'.",
        ),
        mcq(
          "According to the 2020 analysis, what was happening to insects that live partly in fresh water?",
          [
            "They were declining faster than land insects.",
            "Their numbers were increasing.",
            "They had never been studied before.",
            "They were moving into new regions.",
          ],
          "Their numbers were increasing.",
          "Surprisingly, insects that spend part of their lives in fresh water, such as mayflies and dragonflies, were increasing, probably as a result of efforts to clean up polluted rivers and lakes.",
          "Freshwater insects 'were increasing'.",
        ),
        fromList(
          "summary_completion",
          INSECT_BANK,
          "The most important cause of insect decline is generally thought to be the loss of ______.",
          "habitat",
          "The loss of natural habitat to farming and building is generally considered the most important factor.",
          "'The loss of natural habitat' is 'the most important factor'.",
        ),
        fromList(
          "summary_completion",
          INSECT_BANK,
          "Fertilisers can alter the ______ that insects rely on.",
          "plants",
          "The widespread use of pesticides, including a group of chemicals that attack the nervous systems of insects, also plays a significant role, as does the use of fertilisers, which can change the plants on which insects depend.",
          "Fertilisers 'can change the plants on which insects depend'.",
        ),
        fromList(
          "summary_completion",
          INSECT_BANK,
          "Additional pressures include climate change and artificial ______ at night.",
          "light",
          "Climate change, artificial light at night and species introduced from other regions add further pressure.",
          "'Artificial light at night' adds pressure.",
        ),
        fromList(
          "summary_completion",
          INSECT_BANK,
          "Insects help to return ______ to the soil.",
          "nutrients",
          "Insects pollinate a large proportion of the world's crops and wild plants, break down dead material and return nutrients to the soil, and provide food for birds, bats, fish and many other animals.",
          "Insects 'return nutrients to the soil'.",
        ),
        fromList(
          "summary_completion",
          INSECT_BANK,
          "The recovery of freshwater insects shows that improving the environment can bring measurable ______.",
          "results",
          "The recovery of freshwater insects shows that environmental improvements can produce measurable results.",
          "Improvements 'can produce measurable results'.",
        ),
        fromList(
          "summary_completion",
          INSECT_BANK,
          "Better ______ is needed so that debates can rest on solid evidence.",
          "monitoring",
          "What is needed, above all, is better monitoring, so that future debates can be based on solid evidence rather than on dramatic headlines or memories of dirty windscreens.",
          "'What is needed, above all, is better monitoring'. Headlines are what debates should not rely on.",
        ),
        ynng(
          "Insect decline is a genuine and serious problem.",
          "YES",
          "Insect decline is real and serious, in my view, but the story is more complicated, and in some respects more interesting, than those headlines suggested.",
          "The writer says 'insect decline is real and serious'.",
        ),
        ynng(
          "Exaggerated claims are acceptable if they make the public more aware of insect decline.",
          "NO",
          "I share these concerns; exaggerated claims, however well intended, risk damaging public trust in science.",
          "Exaggerated claims 'risk damaging public trust in science'.",
        ),
        ynng(
          "Action to protect insects should wait until the exact rate of decline is known.",
          "NO",
          "It is for this reason that I believe the precise rate of decline, though scientifically important, matters less for policy than its direction: the evidence is strong enough to justify action now.",
          "The evidence 'is strong enough to justify action now'.",
        ),
        ynng(
          "Farmers have used fewer pesticides in recent years.",
          "NOT GIVEN",
          "",
          "The writer recommends reducing pesticides but does not say whether their use has fallen.",
        ),
      ],
    },
  ],
};
