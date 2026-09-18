import {
  fromList,
  gapFill,
  mcq,
  noteLine,
  pickTwo,
  plain,
  tfng,
  ynng,
  type CuratedQuestion,
  type CuratedTest,
} from "../shared";

// ---- Passage 1 · history of invention · notes -------------------------------

const BICYCLE = {
  title: "Stages in the development of the bicycle",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO --------------------------

const HEADINGS = [
  "A small area holding a great deal of carbon",
  "What draining does to a bog",
  "Blocking the ditches",
  "Farming a field that stays wet",
  "Why peat makes good garden compost",
  "Watching the water from space",
  "How long the repair takes",
  "Machines that cut new drainage channels",
  "The decline of traditional fuel cutting",
  "Replanting the moss that builds peat",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const PEAT_STEM = "Which TWO methods of restoring drained peatland are described?";
const PEAT_METHODS = [
  "putting dams in drainage channels",
  "spreading fertiliser over the surface",
  "replanting the mosses that build peat",
  "removing all vegetation before rewetting",
  "covering the ground with plastic sheeting",
];

// ---- Passage 3 · research debate · word bank --------------------------------

const DUNBAR_BANK = ["brain", "layers", "cards", "primates", "range", "villages", "names", "army"];

export const TEST_37: CuratedTest = {
  key: "full-test-37",
  targetBand: 6,
  passages: [
    {
      key: "t37-p1-bicycle",
      title: "Two Wheels, Seventy Years",
      topic: "the stages by which the modern bicycle was developed",
      difficulty: 5,
      body: `The bicycle looks like an obvious idea, and it took most of a century to arrive. Its ancestor appeared in 1817, when a German nobleman, Karl Drais, built a wooden machine with two wheels in line, a padded saddle and a steering bar. It had no pedals: the rider sat on it and pushed against the ground with both feet, gliding between strides. Drais is thought to have been looking for a way to travel without a horse in a year when harvests had failed across Europe after a distant volcanic eruption and animal feed was scarce. His running machine attracted attention, was copied in London as the hobby horse, and then went out of fashion within a few years, partly because riders took to the pavements and were fined.

Pedals came almost fifty years later. In Paris in the 1860s, workshops began fitting cranks and pedals directly to the front wheel, and the machine acquired an iron frame, wooden wheels and iron tyres. It was heavy, and it transmitted every stone in the road to the rider, which is how it earned the nickname boneshaker. It was also the first bicycle to be manufactured in large numbers, and the first to be raced.

Fitting pedals to the wheel itself created a problem that the next design solved in an alarming way. One turn of the pedals moved the bicycle exactly one turn of its front wheel, so the only route to greater speed was a larger wheel. Wheels grew until they reached the limit of a rider's leg, producing the high bicycle, with a front wheel over a metre and a half across and a tiny wheel behind for balance. It was fast and, on the rutted roads of the period, dangerous: the rider sat high and almost over the axle, and a sudden stop could throw him forward over the handlebars. Riding one was a young man's pursuit, and the sport had its own vocabulary for the various ways of falling off.

The design that settled the question came in 1885, when an English manufacturer, John Kemp Starley, produced a machine with two wheels of equal size, a chain driving the rear wheel, and the rider seated low between them. Gearing was now a matter of choosing the sizes of two sprockets rather than the size of a wheel, so speed no longer depended on the length of the rider's legs. Because it was so much easier to ride and so much harder to fall off, it was called a safety bicycle, and its layout is essentially the one still in use.

One further invention made it comfortable. In 1888 a Scottish veterinary surgeon working in Belfast, John Boyd Dunlop, patented an inflatable rubber tyre, first made to spare his son a rough ride on a tricycle. Air-filled tyres absorbed the shocks that solid rubber transmitted, and within a few years they were standard on almost every machine.

What followed was a boom. In the 1890s bicycle factories multiplied across Europe and North America, prices fell as production grew, and cycling became a mass activity rather than a sport for the wealthy. For the first time, ordinary people could travel ten or twenty kilometres from home and return the same day without a horse or a railway ticket. Country doctors, postmen and factory workers all took to it.

The social consequences reached furthest among women. A bicycle allowed a young woman to leave her street unaccompanied, and it made the long skirts and tight corsets of the period impractical, which gave the campaigns for looser clothing a purpose that arguments alone had not achieved. One American campaigner for women's rights said the bicycle had done more to emancipate women than anything else in the world, and although that was an overstatement, it was not an absurd one.

The bicycle's later history is a series of returns. The motor car displaced it as transport in much of the world after 1920, and it survived as a machine for children and sport. Then came fuel crises, congestion, air quality rules and, most recently, the small electric motor, which has quietly restored the bicycle's original promise of travelling under one's own power to people who would not otherwise ride at all.`,
      questions: [
        noteLine(
          BICYCLE,
          "1817 running machine",
          "Built by Karl Drais with two wheels in line and a steering ______",
          "bar",
          "Its ancestor appeared in 1817, when a German nobleman, Karl Drais, built a wooden machine with two wheels in line, a padded saddle and a steering bar.",
          "It had 'a steering bar'.",
        ),
        noteLine(
          BICYCLE,
          "1817 running machine",
          "The rider pushed against the ______ with both feet",
          "ground",
          "It had no pedals: the rider sat on it and pushed against the ground with both feet, gliding between strides.",
          "The rider 'pushed against the ground with both feet'.",
        ),
        noteLine(
          BICYCLE,
          "1860s boneshaker",
          "______ and cranks were fixed directly to the front wheel",
          "Pedals",
          "In Paris in the 1860s, workshops began fitting cranks and pedals directly to the front wheel, and the machine acquired an iron frame, wooden wheels and iron tyres.",
          "Workshops fitted 'cranks and pedals directly to the front wheel'.",
        ),
        noteLine(
          BICYCLE,
          "1860s boneshaker",
          "Iron tyres made the ride rough, giving the machine its ______",
          "nickname",
          "It was heavy, and it transmitted every stone in the road to the rider, which is how it earned the nickname boneshaker.",
          "It 'earned the nickname boneshaker'.",
        ),
        noteLine(
          BICYCLE,
          "High bicycle",
          "Greater speed required a larger ______",
          "wheel",
          "One turn of the pedals moved the bicycle exactly one turn of its front wheel, so the only route to greater speed was a larger wheel.",
          "'The only route to greater speed was a larger wheel'.",
        ),
        noteLine(
          BICYCLE,
          "1885 safety bicycle",
          "A ______ drove the rear wheel instead of pedals on the front",
          "chain",
          "The design that settled the question came in 1885, when an English manufacturer, John Kemp Starley, produced a machine with two wheels of equal size, a chain driving the rear wheel, and the rider seated low between them.",
          "It had 'a chain driving the rear wheel'.",
        ),
        noteLine(
          BICYCLE,
          "1885 safety bicycle",
          "Gearing depended on two ______ rather than on wheel size",
          "sprockets",
          "Gearing was now a matter of choosing the sizes of two sprockets rather than the size of a wheel, so speed no longer depended on the length of the rider's legs.",
          "It was 'a matter of choosing the sizes of two sprockets'.",
        ),
        noteLine(
          BICYCLE,
          "1888",
          "Dunlop patented an inflatable rubber ______",
          "tyre",
          "In 1888 a Scottish veterinary surgeon working in Belfast, John Boyd Dunlop, patented an inflatable rubber tyre, first made to spare his son a rough ride on a tricycle.",
          "He 'patented an inflatable rubber tyre'.",
        ),
        tfng(
          "Drais built his machine at a time when feeding horses was difficult.",
          "TRUE",
          "Drais is thought to have been looking for a way to travel without a horse in a year when harvests had failed across Europe after a distant volcanic eruption and animal feed was scarce.",
          "Harvests had failed and 'animal feed was scarce'.",
        ),
        tfng(
          "The boneshaker was produced only in small numbers.",
          "FALSE",
          "It was also the first bicycle to be manufactured in large numbers, and the first to be raced.",
          "It was 'the first bicycle to be manufactured in large numbers'.",
        ),
        tfng(
          "Riders of the high bicycle risked being thrown over the handlebars.",
          "TRUE",
          "It was fast and, on the rutted roads of the period, dangerous: the rider sat high and almost over the axle, and a sudden stop could throw him forward over the handlebars.",
          "A sudden stop 'could throw him forward over the handlebars'.",
        ),
        tfng(
          "Starley's safety bicycle sold more units in its first year than the high bicycle ever had.",
          "NOT GIVEN",
          "",
          "The design is described, but no sales figures are compared.",
        ),
        tfng(
          "The writer completely accepts the claim that the bicycle emancipated women more than anything else.",
          "FALSE",
          "One American campaigner for women's rights said the bicycle had done more to emancipate women than anything else in the world, and although that was an overstatement, it was not an absurd one.",
          "The writer calls it 'an overstatement'.",
        ),
      ],
    },
    {
      key: "t37-p2-peatland",
      title: "Putting the Water Back",
      topic: "why drained peat bogs are being rewetted",
      difficulty: 6,
      body: `A) Peat is not soil in the ordinary sense. It is plant material — mostly mosses, sedges and heather — that has fallen into waterlogged ground where there is too little oxygen for it to rot away, and has piled up instead, a millimetre or so in a good year, for thousands of years. Peatlands cover only about three per cent of the world's land surface, yet they hold roughly twice as much carbon as all the world's forests combined. Almost all of it is held there by water.

B) Take the water away and the arithmetic reverses. Drainage lets air into the peat, the microbes that were held in check begin to work, and carbon that has been locked up since the last ice age is released as carbon dioxide. The surface sinks as the material rots and compacts, sometimes by a metre or more, which requires deeper drains, which admits more air. Dried peat also burns: fires in drained peatlands can smoulder underground for months, are almost impossible to extinguish and produce vast quantities of smoke. A single severe season in South-East Asia has released as much carbon dioxide as a large industrialised country emits in a year.

C) The first step in repairing a bog is to stop the water leaving it. Drainage channels cut for forestry or farming are blocked, with dams of peat, timber, plastic piling or stone, so that the water table rises back towards the surface. On sloping ground this may require hundreds of small dams; on a large site, a machine can install them at a rate of several dozen a day. The aim is not a lake but a sponge: ground so wet that a boot sinks and the peat begins to accumulate again rather than disappear.

D) Blocking ditches alone is often not enough. Where a bog has been bare for years, its surface can be too dry and too exposed for the plants that create peat to return by themselves, so restoration teams reintroduce them, spreading fragments of sphagnum moss over the surface or planting them in plugs. Sphagnum is the engineer of the system: it holds many times its own weight in water, keeps the ground acidic and low in nutrients, and so creates the conditions in which it and little else will grow.

E) A rewetted bog need not be abandoned. Wet farming, sometimes called paludiculture, grows crops that thrive in saturated ground: reeds for thatch and building panels, sphagnum for horticulture in place of dug peat, bulrushes for insulation board, and grasses that can be cut for animal bedding. Yields per hectare are lower than those of drained agricultural land, and markets for most of the products are small, so farmers who switch generally need support during the change. The alternative, in many regions, is land that sinks below the level of the surrounding rivers and eventually cannot be farmed at all.

F) Judging whether any of this is working has become much easier. Satellites now measure the height of the ground to within a centimetre or two, and a bog that has stopped subsiding — or better, that has begun to rise and fall with the seasons as it fills and drains — can be identified from orbit. Radar can estimate how wet the surface is, and mapping of vegetation shows whether sphagnum is spreading. This matters because restoration is paid for by governments and increasingly by companies buying carbon credits, and both want evidence that is not simply a report from the contractor who did the work.

G) The timescale is the part most often misunderstood. Rewetting stops most of the emissions within a year or two, and that is the great prize. Rebuilding the peat itself is another matter: a bog accumulates perhaps a millimetre a year, so a metre lost to drainage represents a thousand years of growth. Restoration is therefore best understood as stopping a wound rather than healing one. Conservationists have learned to say so plainly, because a project sold as bringing an ancient landscape back produces disappointment when the visible result, after five years of expensive work, is a wet field with moss on it. The carbon already released is gone, the ground will not return in any human lifetime, and the argument for doing the work rests almost entirely on what is kept rather than on what is recovered.`,
      questions: [
        heading(
          "A",
          "A small area holding a great deal of carbon",
          "Peatlands cover only about three per cent of the world's land surface, yet they hold roughly twice as much carbon as all the world's forests combined.",
          "Paragraph A: three per cent of land, twice the carbon of all forests.",
        ),
        heading(
          "B",
          "What draining does to a bog",
          "Drainage lets air into the peat, the microbes that were held in check begin to work, and carbon that has been locked up since the last ice age is released as carbon dioxide.",
          "Paragraph B describes the consequences of drainage.",
        ),
        heading(
          "C",
          "Blocking the ditches",
          "Drainage channels cut for forestry or farming are blocked, with dams of peat, timber, plastic piling or stone, so that the water table rises back towards the surface.",
          "Paragraph C is about damming the channels.",
        ),
        heading(
          "D",
          "Replanting the moss that builds peat",
          "Where a bog has been bare for years, its surface can be too dry and too exposed for the plants that create peat to return by themselves, so restoration teams reintroduce them, spreading fragments of sphagnum moss over the surface or planting them in plugs.",
          "Paragraph D is about reintroducing sphagnum.",
        ),
        heading(
          "E",
          "Farming a field that stays wet",
          "Wet farming, sometimes called paludiculture, grows crops that thrive in saturated ground: reeds for thatch and building panels, sphagnum for horticulture in place of dug peat, bulrushes for insulation board, and grasses that can be cut for animal bedding.",
          "Paragraph E is about paludiculture.",
        ),
        heading(
          "F",
          "Watching the water from space",
          "Satellites now measure the height of the ground to within a centimetre or two, and a bog that has stopped subsiding — or better, that has begun to rise and fall with the seasons as it fills and drains — can be identified from orbit.",
          "Paragraph F is about satellite monitoring.",
        ),
        heading(
          "G",
          "How long the repair takes",
          "Rebuilding the peat itself is another matter: a bog accumulates perhaps a millimetre a year, so a metre lost to drainage represents a thousand years of growth.",
          "Paragraph G is about timescales.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Peat forms where there is too little ______ for plant material to rot.",
          "oxygen",
          "It is plant material — mostly mosses, sedges and heather — that has fallen into waterlogged ground where there is too little oxygen for it to rot away, and has piled up instead, a millimetre or so in a good year, for thousands of years.",
          "There is 'too little oxygen for it to rot away'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "As drained peat rots, the ______ sinks, sometimes by more than a metre.",
          "surface",
          "The surface sinks as the material rots and compacts, sometimes by a metre or more, which requires deeper drains, which admits more air.",
          "'The surface sinks as the material rots'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Restorers aim to produce not a lake but a ______.",
          "sponge",
          "The aim is not a lake but a sponge: ground so wet that a boot sinks and the peat begins to accumulate again rather than disappear.",
          "'The aim is not a lake but a sponge'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Sphagnum keeps the ground acidic and low in ______.",
          "nutrients",
          "Sphagnum is the engineer of the system: it holds many times its own weight in water, keeps the ground acidic and low in nutrients, and so creates the conditions in which it and little else will grow.",
          "It keeps the ground 'acidic and low in nutrients'.",
        ),
        pickTwo(
          PEAT_STEM,
          PEAT_METHODS,
          "A or C",
          "On sloping ground this may require hundreds of small dams; on a large site, a machine can install them at a rate of several dozen a day.",
          "A is described: dams are put into the drainage channels.",
        ),
        pickTwo(
          PEAT_STEM,
          PEAT_METHODS,
          "A or C",
          "Sphagnum is the engineer of the system: it holds many times its own weight in water, keeps the ground acidic and low in nutrients, and so creates the conditions in which it and little else will grow.",
          "C is described: the peat-building moss is replanted. B, D and E are not.",
        ),
      ],
    },
    {
      key: "t37-p3-dunbar",
      title: "The Number in the Brain",
      topic: "the claim that human social groups have a natural size limit",
      difficulty: 7,
      body: `In the early 1990s a British anthropologist noticed a pattern among monkeys and apes. Species that lived in larger groups tended to have a larger neocortex — the outer layer of the brain — in proportion to the rest of it. He reasoned that keeping track of relationships is cognitively expensive: in a group of five, there are ten pairs to keep straight, and in a group of fifty there are over a thousand. If brain size set a ceiling on the number of relationships an animal could manage, then brain size should predict group size. Plotting the primate data and extending the line to the human brain gave a figure of about 150, and the idea entered general circulation as Dunbar's number.

The claim is not that a person knows only 150 people. It is that there is a limit to the number with whom one can maintain a genuine relationship — knowing who they are, how they relate to everyone else, and having enough contact to keep it current. Beyond that, the argument goes, groups need rules, hierarchies and written records to hold together, because memory and conversation alone will not do it.

Supporting evidence was assembled from an eclectic range of sources. Neolithic farming villages, estimated from the number of dwellings, often come out at around 150 people. The basic unit of the Roman army was of comparable size, as are the fighting units of many modern armies. Communities of the Hutterites, a religious group that farms communally, have traditionally split when they exceed roughly this figure, on the explicit reasoning that beyond it a community can no longer be run by consensus. Studies in which people were asked to list everyone they sent a Christmas card to produced networks of about the same size, as have studies of the number of names in a mobile phone's contact list that are actually used.

The structure around the number is in some ways more interesting than the number itself. The same research describes a series of layers: a core of around five intimate relationships, a group of about fifteen close friends, some fifty who would be invited to a large party, the 150 at the boundary of genuine friendship, and outer circles of 500 and 1,500 that correspond to acquaintances and to faces one can put a name to. Each layer is about three times the size of the one inside it, and each requires less time and contact to maintain. This scaling pattern has been found in a variety of datasets, including phone records and online networks.

The idea has attracted serious criticism, most sharply in a reanalysis published in 2021. Researchers repeated the original statistical exercise with modern methods and a larger set of primate data, and reported that the relationship between brain size and group size, while real, is far looser than the original analysis suggested. Extrapolating it to humans, they argued, produces not a precise 150 but a range so wide — from a few dozen to several hundred — as to be useless for prediction. They also questioned whether the human neocortex can be treated as simply a larger version of a monkey's for this purpose.

Defenders replied that the convergence of the other evidence is what matters: army units, villages, card lists and phone records were not derived from the brain data, and they cluster in the same region. Critics answer that this is weaker than it looks, since each of those figures has a wide spread of its own, and that a number which can be anything between 100 and 250 is not a constant of human nature but a rough observation about how big co-operating groups tend to get.

What survives the argument is worth keeping. The specific figure should be treated as an approximation with a generous margin, and any organisation that reorganises itself around exactly 150 people is misusing a statistic. The layered structure, and the underlying point that close relationships cost time and that time is finite, have held up much better. Social media has not changed this. A person may have thousands of followers, but studies of who actually interacts with whom find the same small core doing most of the communicating — the platform expands the list of names and leaves the number of relationships roughly where it was.`,
      questions: [
        mcq(
          "What pattern did the anthropologist observe among primates?",
          [
            "Larger animals lived in larger groups.",
            "Species with a relatively larger neocortex lived in larger groups.",
            "Groups grew larger where food was plentiful.",
            "Larger groups had more complicated calls.",
          ],
          "Species with a relatively larger neocortex lived in larger groups.",
          "Species that lived in larger groups tended to have a larger neocortex — the outer layer of the brain — in proportion to the rest of it.",
          "Group size tracked the relative size of the neocortex.",
        ),
        mcq(
          "What does the number 150 refer to, according to the claim?",
          [
            "everybody whose name a person can remember",
            "the number of people one can maintain real relationships with",
            "the size of the largest group a person can address",
            "the number of relatives in an extended family",
          ],
          "the number of people one can maintain real relationships with",
          "It is that there is a limit to the number with whom one can maintain a genuine relationship — knowing who they are, how they relate to everyone else, and having enough contact to keep it current.",
          "It is the limit on 'genuine' relationships.",
        ),
        mcq(
          "Why are the Hutterite communities mentioned?",
          [
            "They keep written records of their members.",
            "They divide when they grow beyond about the same figure.",
            "They have unusually large families.",
            "They were the source of the original primate data.",
          ],
          "They divide when they grow beyond about the same figure.",
          "Communities of the Hutterites, a religious group that farms communally, have traditionally split when they exceed roughly this figure, on the explicit reasoning that beyond it a community can no longer be run by consensus.",
          "They 'split when they exceed roughly this figure'.",
        ),
        mcq(
          "What did the 2021 reanalysis conclude?",
          [
            "There is no relationship between brain size and group size.",
            "The relationship is real but too loose to predict a precise figure.",
            "Human group size is larger than 150.",
            "The primate data had been recorded incorrectly.",
          ],
          "The relationship is real but too loose to predict a precise figure.",
          "Researchers repeated the original statistical exercise with modern methods and a larger set of primate data, and reported that the relationship between brain size and group size, while real, is far looser than the original analysis suggested.",
          "It is 'real' but 'far looser'.",
        ),
        mcq(
          "What does the writer say about social media?",
          [
            "It has raised the number of genuine relationships people have.",
            "It has reduced the size of people's core groups.",
            "It lengthens the list of names without changing the core.",
            "It makes the layered structure impossible to measure.",
          ],
          "It lengthens the list of names without changing the core.",
          "A person may have thousands of followers, but studies of who actually interacts with whom find the same small core doing most of the communicating — the platform expands the list of names and leaves the number of relationships roughly where it was.",
          "It 'expands the list of names' only.",
        ),
        ynng(
          "The writer thinks the evidence from villages and army units is worthless.",
          "NO",
          "Defenders replied that the convergence of the other evidence is what matters: army units, villages, card lists and phone records were not derived from the brain data, and they cluster in the same region.",
          "The writer reports it as independent evidence that clusters together, while noting its spread.",
        ),
        ynng(
          "The writer believes organisations should be designed around a group size of exactly 150.",
          "NO",
          "The specific figure should be treated as an approximation with a generous margin, and any organisation that reorganises itself around exactly 150 people is misusing a statistic.",
          "Doing so 'is misusing a statistic'.",
        ),
        ynng(
          "The writer regards the layered structure as better supported than the single number.",
          "YES",
          "The layered structure, and the underlying point that close relationships cost time and that time is finite, have held up much better.",
          "They 'have held up much better'.",
        ),
        ynng(
          "The writer accepts that time available for relationships is limited.",
          "YES",
          "The layered structure, and the underlying point that close relationships cost time and that time is finite, have held up much better.",
          "'Close relationships cost time and… time is finite'.",
        ),
        ynng(
          "The writer thinks the 2021 critics were motivated by professional rivalry.",
          "NOT GIVEN",
          "",
          "Their arguments are reported; their motives are not discussed.",
        ),
        fromList(
          "summary_completion",
          DUNBAR_BANK,
          "The original argument extended a line drawn through data on ______.",
          "primates",
          "Plotting the primate data and extending the line to the human brain gave a figure of about 150, and the idea entered general circulation as Dunbar's number.",
          "The line was plotted through 'the primate data'.",
        ),
        fromList(
          "summary_completion",
          DUNBAR_BANK,
          "Studies of Christmas ______ produced networks of a similar size.",
          "cards",
          "Studies in which people were asked to list everyone they sent a Christmas card to produced networks of about the same size, as have studies of the number of names in a mobile phone's contact list that are actually used.",
          "The Christmas card studies gave 'about the same size'.",
        ),
        fromList(
          "summary_completion",
          DUNBAR_BANK,
          "The theory describes a set of ______, each about three times the one inside it.",
          "layers",
          "Each layer is about three times the size of the one inside it, and each requires less time and contact to maintain.",
          "'Each layer is about three times the size of the one inside it'.",
        ),
        fromList(
          "summary_completion",
          DUNBAR_BANK,
          "Critics say the extrapolation gives a ______ too wide to be useful.",
          "range",
          "Extrapolating it to humans, they argued, produces not a precise 150 but a range so wide — from a few dozen to several hundred — as to be useless for prediction.",
          "It produces 'a range so wide… as to be useless'.",
        ),
      ],
    },
  ],
};
