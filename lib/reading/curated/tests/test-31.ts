import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · history of a food · notes -----------------------------------

const CACAO = {
  title: "Cacao before and after Europe",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · lettered paragraphs, people --------------------

const PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const DIAMOND_PEOPLE = ["Ingrid Solberg", "Tomás Herrera", "Aisha Raman", "Daniel Mbeki"];

// ---- Passage 3 · research debate · word bank ---------------------------------

const DREAM_BANK = [
  "practice",
  "rubbish",
  "emotional",
  "forget",
  "random",
  "faces",
  "waking",
  "sleep",
  "muscles",
  "memory",
];

export const TEST_31: CuratedTest = {
  key: "full-test-31",
  targetBand: 5,
  passages: [
    {
      key: "t31-p1-cacao",
      title: "The Drink of the Gods",
      topic: "how cacao travelled from Central America to the rest of the world",
      difficulty: 4,
      body: `For most of its history, chocolate was not a food but a drink, and it was not sweet. It comes from the cacao tree, which grows in the warm, wet forests of Central and South America. The tree produces large pods directly on its trunk and branches, and each pod contains around forty seeds surrounded by a soft white pulp. The seeds, usually called beans, taste extremely bitter when they are raw, and a great deal of work is needed to turn them into anything pleasant.

That work was first done thousands of years ago. Chemical traces of cacao have been found on pottery from Central America dating back more than three thousand years, and some researchers have identified even older traces in Ecuador. The people of the region learned to remove the beans from the pods, leave them to ferment in the pulp, dry them in the sun and then roast them. The roasted beans were ground into a paste and mixed with water, chilli, maize flour and other flavourings.

The Maya prized the foam that formed on top of the drink. To create it, they poured the liquid from one vessel into another held some distance below, a technique that is still used in parts of Mexico today. Painted pots show rulers drinking cacao at feasts, and the drink appears in religious ceremonies, weddings and funerals. It was not an everyday refreshment for everyone; the finest preparations belonged to the powerful.

Among the Aztecs, who came later, cacao beans served as currency as well as food. Markets used them as small change: according to one Spanish account, a rabbit could be bought for about thirty beans. Because the beans had a value that everyone recognised, dishonest traders sometimes filled empty shells with earth and passed them off as the real thing. Cacao was carried into the Aztec capital as tribute from the warmer lowlands, since the tree could not grow on the high central plateau.

When Spanish soldiers reached the Aztec court in 1519, they were served the drink in golden cups. Their first reactions were not enthusiastic. One Spanish observer wrote that it was a drink more suited to pigs than to people. Within a few decades, however, cacao had crossed the Atlantic, and in Spain it was reinvented. Sugar was added, along with cinnamon and other spices, and the mixture was served hot rather than cold. In this new form it became fashionable at court.

From Spain the drink spread across Europe. Chocolate houses opened in London in the seventeenth century, where wealthy customers met to talk, gamble and read the newspapers. Heavy taxes kept the price high, and chocolate remained a luxury for the rich. Producing it was slow and messy work, because the ground beans contained a large amount of natural fat, which floated to the top of the cup and had to be stirred back in.

The solution arrived in 1828, when the Dutch chemist Coenraad van Houten patented a press that separated most of the fat, known as cocoa butter, from the roasted beans. What remained could be ground into a fine powder that mixed easily with liquid. His press made cocoa cheaper and more pleasant to drink, and it also left manufacturers with a supply of cocoa butter. In 1847, a British firm discovered that adding this butter back to a mixture of cocoa powder and sugar produced a paste that could be poured into moulds and eaten. The chocolate bar had been invented. Milk chocolate followed in Switzerland in the 1870s, once a method had been found for combining chocolate with milk without spoiling it.

Today the tree still grows only near the equator, but most of it grows far from its home. West Africa produces the majority of the world's cacao, and the great part of the crop is raised on small family farms. Growers face uncertain prices, ageing trees and diseases that can destroy a harvest, and in recent years poor weather has pushed the cost of beans to record levels. A modern bar of chocolate — sweet, solid and pale with milk — would be unrecognisable to the Maya, who would probably have regarded it as a waste of a sacred plant.`,
      questions: [
        noteLine(
          CACAO,
          "In the Americas",
          "The cacao tree grows in the warm, wet ______ of Central and South America",
          "forests",
          "It comes from the cacao tree, which grows in the warm, wet forests of Central and South America.",
          "The tree grows 'in the warm, wet forests'.",
        ),
        noteLine(
          CACAO,
          "In the Americas",
          "Inside the pod the beans are surrounded by white ______",
          "pulp",
          "The tree produces large pods directly on its trunk and branches, and each pod contains around forty seeds surrounded by a soft white pulp.",
          "The seeds are 'surrounded by a soft white pulp'.",
        ),
        noteLine(
          CACAO,
          "In the Americas",
          "Raw beans taste extremely ______",
          "bitter",
          "The seeds, usually called beans, taste extremely bitter when they are raw, and a great deal of work is needed to turn them into anything pleasant.",
          "They 'taste extremely bitter when they are raw'.",
        ),
        noteLine(
          CACAO,
          "In the Americas",
          "The Maya poured the drink from one vessel to another to make ______",
          "foam",
          "The Maya prized the foam that formed on top of the drink.",
          "The pouring technique created the foam the Maya prized.",
        ),
        noteLine(
          CACAO,
          "In the Americas",
          "The Aztecs used the beans as ______ in their markets",
          "currency",
          "Among the Aztecs, who came later, cacao beans served as currency as well as food.",
          "The beans 'served as currency as well as food'.",
        ),
        noteLine(
          CACAO,
          "In Europe",
          "In Spain, ______ and spices were added and the drink was served hot",
          "Sugar",
          "Sugar was added, along with cinnamon and other spices, and the mixture was served hot rather than cold.",
          "'Sugar was added, along with cinnamon and other spices'.",
        ),
        noteLine(
          CACAO,
          "In Europe",
          "Van Houten's press removed most of the ______ from the roasted beans",
          "fat",
          "The solution arrived in 1828, when the Dutch chemist Coenraad van Houten patented a press that separated most of the fat, known as cocoa butter, from the roasted beans.",
          "The press 'separated most of the fat'.",
        ),
        tfng(
          "Cacao pods grow on the trunk of the tree as well as on its branches.",
          "TRUE",
          "The tree produces large pods directly on its trunk and branches, and each pod contains around forty seeds surrounded by a soft white pulp.",
          "The pods grow 'directly on its trunk and branches'.",
        ),
        tfng(
          "The Maya kept their finest cacao drinks for ordinary daily meals.",
          "FALSE",
          "It was not an everyday refreshment for everyone; the finest preparations belonged to the powerful.",
          "The finest preparations 'belonged to the powerful'.",
        ),
        tfng(
          "Some traders in Aztec markets tried to cheat buyers with fake beans.",
          "TRUE",
          "Because the beans had a value that everyone recognised, dishonest traders sometimes filled empty shells with earth and passed them off as the real thing.",
          "Dishonest traders 'filled empty shells with earth'.",
        ),
        tfng(
          "The cacao tree was grown successfully on the high plateau around the Aztec capital.",
          "FALSE",
          "Cacao was carried into the Aztec capital as tribute from the warmer lowlands, since the tree could not grow on the high central plateau.",
          "The tree 'could not grow on the high central plateau'.",
        ),
        tfng(
          "The Spanish soldiers who first tasted the drink enjoyed it immediately.",
          "FALSE",
          "One Spanish observer wrote that it was a drink more suited to pigs than to people.",
          "The drink was described as 'more suited to pigs than to people'.",
        ),
        tfng(
          "London's chocolate houses served more customers than its coffee houses.",
          "NOT GIVEN",
          "",
          "Chocolate houses are described, but never compared with coffee houses.",
        ),
      ],
    },
    {
      key: "t31-p2-lab-grown-diamonds",
      title: "Diamonds Made in a Week",
      topic: "how diamonds grown in factories are changing the jewellery trade",
      difficulty: 5,
      body: `A) A diamond is simply carbon whose atoms are locked into a particularly rigid arrangement. Natural diamonds formed deep inside the Earth, under enormous pressure and heat, over periods that are usually measured in hundreds of millions of years, and were carried towards the surface by violent volcanic eruptions. For most of the twentieth century, that long and unlikely history was central to the way diamonds were sold. Today a stone with exactly the same structure, and exactly the same hardness and sparkle, can be produced in a factory in about a week.

B) Two methods are used. In the first, a small piece of natural or synthetic diamond is placed in a press with carbon and squeezed at pressures similar to those found far below the surface while being heated to around 1,500 degrees Celsius. In the second, a thin slice of diamond is placed in a chamber filled with a carbon-rich gas, which is broken apart by microwaves so that carbon atoms settle on the slice layer by layer. Both methods produce crystals that only specialised instruments can distinguish from mined stones. Materials scientist Dr Ingrid Solberg points out that the difference is one of history, not of substance. "Chemically, there is nothing to tell apart," she says. "The only real difference is where the carbon spent the last billion years."

C) The technology is not new. Industrial synthetic diamonds have been made since the 1950s for use in drill bits, saw blades and polishing powders, where appearance does not matter. What changed was quality. By the 2010s, manufacturers could produce large, clear, colourless crystals suitable for jewellery, and the cost of producing them began to fall quickly. Prices for gem-quality laboratory stones have since dropped by more than eighty per cent, while the price of mined stones has fallen much less.

D) That gap has divided the industry. Some jewellers have embraced the new stones, arguing that customers can now buy a larger, brighter gem for the same money. Others worry about the effect on the value of the stones their customers already own. Gemmologist Dr Tomás Herrera spends his working life examining crystals under a microscope, and he is untroubled by the arrival of the new material. "A grown diamond is a diamond," he says. "What matters is that the buyer is told which one they are holding." Testing machines can identify grown stones reliably, and reputable sellers now describe them clearly.

E) The environmental argument is less straightforward than either side claims. Mining moves enormous quantities of rock, disturbs land and can damage rivers, and some mines are dug in remote places that then need roads, housing and power. Growing diamonds avoids all this, but it uses a great deal of electricity, and a factory running on coal-fired power may produce more greenhouse gases per carat than a well-managed mine. Environmental analyst Dr Daniel Mbeki has compared several studies and found that the figures vary wildly. "It depends almost entirely on the electricity," he says. "A factory on hydroelectric power is a very different thing from one on a coal grid."

F) There is also a human question. Diamond mining supports hundreds of thousands of jobs, and in a few countries it provides a significant share of government income, which pays for schools and clinics. Economist Professor Aisha Raman argues that this is the part of the debate that is most often ignored in wealthy countries. "If demand moves to factories," she says, "the jobs do not move with it. They simply disappear, and usually in places with few alternatives." She notes that some producing countries have invested mining income carefully, while others have little to show for decades of extraction.

G) What the trade cannot yet predict is how buyers will feel in twenty years. Some analysts believe grown stones will become ordinary and cheap, like cultured pearls, leaving mined diamonds as rare collectors' items. Others think the opposite: that once a stone can be made to order, the whole idea of a diamond as a store of value will quietly fade, taking the mined stone's premium with it. Raman suspects the answer will be decided by advertising as much as by geology. Solberg, for her part, finds the question beside the point. "It is an extraordinary material," she says. "We should be delighted that we can now make it."`,
      questions: [
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a description of two ways of producing diamonds in a factory",
          "B",
          "In the first, a small piece of natural or synthetic diamond is placed in a press with carbon and squeezed at pressures similar to those found far below the surface while being heated to around 1,500 degrees Celsius.",
          "Paragraph B describes the press method and the gas chamber method.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "a reference to the earliest uses of manufactured diamonds",
          "C",
          "Industrial synthetic diamonds have been made since the 1950s for use in drill bits, saw blades and polishing powders, where appearance does not matter.",
          "Paragraph C: industrial stones 'since the 1950s'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "the point that a factory's emissions depend on its power supply",
          "E",
          '"It depends almost entirely on the electricity," he says.',
          "Paragraph E: the answer 'depends almost entirely on the electricity'.",
        ),
        fromList(
          "matching_information",
          PARAGRAPHS,
          "two opposing predictions about the future value of mined stones",
          "G",
          "Some analysts believe grown stones will become ordinary and cheap, like cultured pearls, leaving mined diamonds as rare collectors' items.",
          "Paragraph G sets out both predictions.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Natural diamonds were brought towards the surface by violent ______.",
          "volcanic eruptions",
          "Natural diamonds formed deep inside the Earth, under enormous pressure and heat, over periods that are usually measured in hundreds of millions of years, and were carried towards the surface by violent volcanic eruptions.",
          "They were carried up by 'violent volcanic eruptions'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In the second method, the carbon-rich gas is broken apart by ______.",
          "microwaves",
          "In the second, a thin slice of diamond is placed in a chamber filled with a carbon-rich gas, which is broken apart by microwaves so that carbon atoms settle on the slice layer by layer.",
          "The gas is 'broken apart by microwaves'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The price of gem-quality grown stones has fallen by over ______ per cent.",
          "eighty",
          "Prices for gem-quality laboratory stones have since dropped by more than eighty per cent, while the price of mined stones has fallen much less.",
          "Prices dropped 'by more than eighty per cent'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "In a few countries, mining provides a large share of ______.",
          "government income",
          "Diamond mining supports hundreds of thousands of jobs, and in a few countries it provides a significant share of government income, which pays for schools and clinics.",
          "It provides 'a significant share of government income'.",
        ),
        fromList(
          "matching_features",
          DIAMOND_PEOPLE,
          "The two kinds of stone differ only in their history.",
          "Ingrid Solberg",
          '"Chemically, there is nothing to tell apart," she says.',
          "Solberg: 'Chemically, there is nothing to tell apart.'",
        ),
        fromList(
          "matching_features",
          DIAMOND_PEOPLE,
          "Buyers must be told which type of stone they are being sold.",
          "Tomás Herrera",
          '"What matters is that the buyer is told which one they are holding."',
          "Herrera: 'the buyer is told which one they are holding'.",
        ),
        fromList(
          "matching_features",
          DIAMOND_PEOPLE,
          "Published environmental comparisons disagree with one another.",
          "Daniel Mbeki",
          "Environmental analyst Dr Daniel Mbeki has compared several studies and found that the figures vary wildly.",
          "Mbeki found that 'the figures vary wildly'.",
        ),
        fromList(
          "matching_features",
          DIAMOND_PEOPLE,
          "Work lost in mining regions is unlikely to be replaced.",
          "Aisha Raman",
          '"They simply disappear, and usually in places with few alternatives."',
          "Raman: the jobs 'simply disappear'.",
        ),
        fromList(
          "matching_features",
          DIAMOND_PEOPLE,
          "The ability to manufacture the material is something to celebrate.",
          "Ingrid Solberg",
          '"It is an extraordinary material," she says. "We should be delighted that we can now make it."',
          "Solberg: 'We should be delighted that we can now make it.'",
        ),
      ],
    },
    {
      key: "t31-p3-dreams",
      title: "Why We Dream",
      topic: "competing scientific explanations for dreaming",
      difficulty: 6,
      body: `Everyone dreams, whether or not they remember it. Sleepers woken from the stage of sleep known as REM — rapid eye movement — report a dream on most occasions, and people woken from other stages report one surprisingly often as well. Yet despite a century of research, there is no agreement about what dreams are for, or whether they are for anything at all. The subject remains one of the most argued-over corners of the study of the mind.

The oldest modern theory is also the least respected today. Sigmund Freud proposed that dreams were disguised expressions of wishes that the waking mind refused to admit, and that their strange images could be decoded to reveal them. The theory was enormously influential, but it made few predictions that could be tested, and the evidence gathered since has not supported it. Almost no sleep researcher now works within Freud's framework, although his central claim — that dreams mean something — is still shared by many of them.

A very different account appeared in 1977, when two Harvard researchers argued that dreams begin as electrical noise. During REM sleep, signals rise from the brainstem into the regions that handle vision, movement and emotion, and the sleeping brain, which is built to find patterns, assembles these random signals into a story. On this view the plot of a dream is created after the fact, as an explanation of activity that had no meaning to begin with. The idea was deliberately provocative, and it changed the field: from then on, anyone claiming that dreams had a function had to show why the explanation could not simply be noise.

Several such claims are now taken seriously. One is that dreaming helps to process difficult experiences. Emotional events are more likely than neutral ones to appear in dreams, usually in altered form, and studies of people recovering from painful events have found that those who dream about them in certain ways adjust better afterwards. A related idea holds that dreams strip the emotion out of a memory while keeping its content, so that the event can eventually be recalled without distress. The evidence here is suggestive rather than conclusive, since it is difficult to separate cause from effect.

A second claim concerns rehearsal. Dreams contain a strikingly high number of threatening situations — being chased, falling, losing something important — and one researcher has argued that this is no accident, and that dreaming evolved as a way of practising responses to danger in safety. Supporters point out that children's dreams are full of animals, which would have been a genuine threat for most of human history. Critics reply that the dangers people dream about are often of the wrong sort, and that dreaming of falling teaches nobody anything useful.

A third, and currently the most active, line of research links dreams to memory. During sleep the brain replays patterns of activity recorded during the day, apparently strengthening some connections and weakening others. Volunteers who learn a task and then sleep perform better than those who stay awake, and those who report dreaming about the task improve the most. This does not prove that the dream itself does the work; the dream may simply be a side effect, visible from the inside, of a process that would happen anyway.

The disagreement matters more than it may appear. If dreams are meaningless noise, then the whole tradition of interpreting them is a waste of effort. If they help to regulate emotion, then disturbed dreaming may be worth treating in its own right rather than as a symptom, and there are now therapies that ask patients to rehearse new endings for recurring nightmares, with some success. These treatments work whichever theory turns out to be correct, which is an uncomfortable fact for those who want dreams to settle the argument.

Progress has been slow for a simple reason: a dream cannot be observed. Researchers must rely on what people remember and are willing to report, both of which are unreliable. Brain scanning shows which regions are active, but not what the sleeper is experiencing, and recent attempts to reconstruct dream images from scans remain crude. Until that changes, the field will continue to argue, and the arguments will continue to be about the same handful of facts.

What can be said with confidence is modest. Dreaming is universal among humans; it occurs in every culture that has been asked about it; it happens in other mammals as far as anyone can tell; and it is bound up with memory and emotion in ways that are clearly not accidental. Whether it is a function or a by-product of sleep may turn out to be the wrong question, since biology is full of processes that serve a purpose and produce side effects at the same time.`,
      questions: [
        mcq(
          "What does the writer say about Freud's theory of dreams?",
          [
            "It has been confirmed by later research.",
            "It is hard to test, but one of its assumptions is widely shared.",
            "It is still the main framework used by sleep researchers.",
            "It was ignored when it was first published.",
          ],
          "It is hard to test, but one of its assumptions is widely shared.",
          "The theory was enormously influential, but it made few predictions that could be tested, and the evidence gathered since has not supported it.",
          "Untestable and unsupported, yet his claim that dreams mean something is 'still shared by many of them'.",
        ),
        mcq(
          "According to the 1977 theory, the story in a dream is",
          [
            "created by the brain to explain meaningless signals.",
            "a record of the previous day's events.",
            "produced only during non-REM sleep.",
            "the result of signals sent from the eyes.",
          ],
          "created by the brain to explain meaningless signals.",
          "On this view the plot of a dream is created after the fact, as an explanation of activity that had no meaning to begin with.",
          "The plot is 'created after the fact, as an explanation of activity that had no meaning'.",
        ),
        mcq(
          "What is the main criticism of the idea that dreams rehearse responses to danger?",
          [
            "Children rarely dream about animals.",
            "Threatening situations are rare in dreams.",
            "The dangers dreamt about are often not useful ones to practise.",
            "The theory cannot explain dreams about falling asleep.",
          ],
          "The dangers dreamt about are often not useful ones to practise.",
          "Critics reply that the dangers people dream about are often of the wrong sort, and that dreaming of falling teaches nobody anything useful.",
          "Critics: the dangers are 'often of the wrong sort'.",
        ),
        mcq(
          "Why is it difficult to prove that dreaming itself helps memory?",
          [
            "Volunteers cannot be woken during REM sleep.",
            "Sleep does not in fact improve performance on learned tasks.",
            "The dream may be a by-product of a process that happens anyway.",
            "Nobody remembers dreams about learning.",
          ],
          "The dream may be a by-product of a process that happens anyway.",
          "This does not prove that the dream itself does the work; the dream may simply be a side effect, visible from the inside, of a process that would happen anyway.",
          "The dream 'may simply be a side effect'.",
        ),
        fromList(
          "summary_completion",
          DREAM_BANK,
          "In the 1977 theory, dreams begin as ______ signals rising from the brainstem.",
          "random",
          "During REM sleep, signals rise from the brainstem into the regions that handle vision, movement and emotion, and the sleeping brain, which is built to find patterns, assembles these random signals into a story.",
          "The brain assembles 'these random signals into a story'.",
        ),
        fromList(
          "summary_completion",
          DREAM_BANK,
          "______ events appear in dreams more often than neutral ones.",
          "Emotional",
          "Emotional events are more likely than neutral ones to appear in dreams, usually in altered form, and studies of people recovering from painful events have found that those who dream about them in certain ways adjust better afterwards.",
          "'Emotional events are more likely than neutral ones to appear'.",
        ),
        fromList(
          "summary_completion",
          DREAM_BANK,
          "One idea is that dreaming lets people ______ responses to danger in safety.",
          "practice",
          "Dreams contain a strikingly high number of threatening situations — being chased, falling, losing something important — and one researcher has argued that this is no accident, and that dreaming evolved as a way of practising responses to danger in safety.",
          "Dreaming as 'a way of practising responses to danger in safety'.",
        ),
        fromList(
          "summary_completion",
          DREAM_BANK,
          "During sleep the brain replays activity from the day, which is linked to ______.",
          "memory",
          "A third, and currently the most active, line of research links dreams to memory.",
          "The third line of research 'links dreams to memory'.",
        ),
        fromList(
          "summary_completion",
          DREAM_BANK,
          "Volunteers who ______ after learning a task do better than those who stay awake.",
          "sleep",
          "Volunteers who learn a task and then sleep perform better than those who stay awake, and those who report dreaming about the task improve the most.",
          "Those who 'learn a task and then sleep perform better'.",
        ),
        fromList(
          "summary_completion",
          DREAM_BANK,
          "Research is slow because reports depend on what sleepers remember after ______.",
          "waking",
          "Researchers must rely on what people remember and are willing to report, both of which are unreliable.",
          "Everything depends on what the sleeper remembers and reports once awake.",
        ),
        ynng(
          "The writer believes Freud's method of decoding dreams should be revived.",
          "NO",
          "The theory was enormously influential, but it made few predictions that could be tested, and the evidence gathered since has not supported it.",
          "The writer calls it untestable and unsupported.",
        ),
        ynng(
          "The writer accepts that the 1977 theory raised the standard of argument in the field.",
          "YES",
          "The idea was deliberately provocative, and it changed the field: from then on, anyone claiming that dreams had a function had to show why the explanation could not simply be noise.",
          "It 'changed the field' by forcing others to rule out noise.",
        ),
        ynng(
          "The writer thinks nightmare therapies are effective only if one theory of dreaming is correct.",
          "NO",
          "These treatments work whichever theory turns out to be correct, which is an uncomfortable fact for those who want dreams to settle the argument.",
          "They 'work whichever theory turns out to be correct'.",
        ),
        ynng(
          "The writer expects dream research to be settled within the next ten years.",
          "NOT GIVEN",
          "",
          "The writer says progress is slow, but gives no timetable.",
        ),
      ],
    },
  ],
};
