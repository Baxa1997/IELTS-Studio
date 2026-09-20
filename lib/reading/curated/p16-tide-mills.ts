import { gapFill, mcq, noteLine, tfng, type CuratedPassage } from "./shared";

const MILL_FLOW = {
  title: "One working cycle",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

export const TIDE_MILLS: CuratedPassage = {
  key: "tide-mills",
  title: "The Mill That Worked to the Moon",
  topic: "a power source that was reliable, predictable and inconvenient",
  difficulty: 5,
  body: `A watermill on a river is at the mercy of the weather. A dry summer stops it, a flood damages it, and a hard frost stops it too. A windmill is worse: the wind may not blow for a week, and when it blows hard the miller must reef the sails or lose them. Against both of these, the tide has one overwhelming advantage. It is absolutely reliable, and it can be predicted, years in advance, to the minute.

The tide mill exploits this. A dam with a gate is built across the mouth of a creek or a tidal inlet, enclosing a pond. As the tide rises, water pushes the gate open and fills the pond; at high water the gate swings shut under its own weight and the pressure of the falling tide outside, trapping a body of water above the level of the sea. Once the sea outside has dropped far enough to give a useful head, a sluice is opened and the trapped water runs out through a wheel. The mill works until the pond is empty or the incoming tide rises to meet the outflow, which gives something like five hours of power, twice a day.

The inconvenience is in that last sentence. High water moves later by about fifty minutes each day, so the working hours of a tide mill march steadily around the clock, and a miller's day is set by the moon rather than by the sun. A tide miller worked at three in the morning when the tide required it, and slept in the afternoon.

The technology is old. A tide mill has been excavated in Northern Ireland dated to the seventh century, and others of similar age are known from the coasts of Ireland and Britain; the Domesday survey of 1086 records one on the south coast of England. They were built in quantity around the Atlantic coasts of Europe, and later in colonial North America, wherever a sheltered inlet with a reasonable tidal range happened to lie near a settlement needing flour.

The engineering constraints are precise. A range of at least a metre and a half is needed to produce useful power, which rules out most of the Mediterranean. An inlet that is too open silts up or is destroyed by storms, and one that is too enclosed does not fill fast enough. The pond must be large, because the volume it holds determines how long the mill can run, and a large pond means a long dam, which is the expensive part. Most surviving examples are therefore in places where a narrow neck opens into a broad natural basin, doing most of the work for free.

The waterwheel itself had to be designed for conditions no river mill faces. The head of water is small and falls continuously as the pond empties, so the wheel must run efficiently across a wide range of flow and be able to work partly submerged as the outside water rises. Undershot wheels were usual for this reason, and some later mills used horizontal wheels of a kind rare elsewhere in Europe.

Tide mills ground flour, sawed timber and pumped water, and several hundred operated in Europe into the nineteenth century. What ended them was not a technical failure. The steam engine could be built anywhere, needed no particular site, ran at a constant speed and worked to a timetable a human being could keep, and it displaced every power source that depended on a place.

One further detail separates a tide mill from every other kind. The pond it fills is not a reservoir that can be topped up when convenient; it is filled entirely by the sea, free of charge, twice a day, whether or not there is anything to grind.

The idea has an afterlife. Modern tidal barrages work on the same principle — impound on the flood, release through turbines on the ebb — and face a version of the same problem, in that a barrage generates on the tide's schedule rather than on the grid's. They also raise an objection the medieval builders never had to answer, since a dam across an estuary destroys the intertidal mudflats behind it, and those flats are among the most productive feeding grounds for birds anywhere. The largest proposals have foundered on that objection rather than on any question of engineering or cost.`,
  questions: [
    tfng(
      "A windmill can be stopped by too much wind as well as too little.",
      "TRUE",
      "A windmill is worse: the wind may not blow for a week, and when it blows hard the miller must reef the sails or lose them.",
      "In strong wind the miller must reef the sails.",
    ),
    tfng(
      "The gate of a tide mill is closed by the miller at high water.",
      "FALSE",
      "As the tide rises, water pushes the gate open and fills the pond; at high water the gate swings shut under its own weight and the pressure of the falling tide outside, trapping a body of water above the level of the sea.",
      "It 'swings shut under its own weight'.",
    ),
    tfng(
      "A tide mill can run for roughly five hours at a time.",
      "TRUE",
      "The mill works until the pond is empty or the incoming tide rises to meet the outflow, which gives something like five hours of power, twice a day.",
      "It gives 'something like five hours of power'.",
    ),
    tfng(
      "The working hours of a tide mill are the same each day.",
      "FALSE",
      "High water moves later by about fifty minutes each day, so the working hours of a tide mill march steadily around the clock, and a miller's day is set by the moon rather than by the sun.",
      "They 'march steadily around the clock'.",
    ),
    tfng(
      "The earliest tide mill known is the one recorded in the Domesday survey.",
      "FALSE",
      "A tide mill has been excavated in Northern Ireland dated to the seventh century, and others of similar age are known from the coasts of Ireland and Britain; the Domesday survey of 1086 records one on the south coast of England.",
      "An excavated mill predates Domesday by some four hundred years.",
    ),
    tfng(
      "A larger pond allows the mill to run for longer.",
      "TRUE",
      "The pond must be large, because the volume it holds determines how long the mill can run, and a large pond means a long dam, which is the expensive part.",
      "Volume 'determines how long the mill can run'.",
    ),
    tfng(
      "Tide mills were abandoned because the machinery proved unreliable.",
      "FALSE",
      "What ended them was not a technical failure.",
      "'What ended them was not a technical failure.'",
    ),
    noteLine(
      MILL_FLOW,
      null,
      "The rising tide pushes the ______ open and fills the pond",
      "gate",
      "As the tide rises, water pushes the gate open and fills the pond; at high water the gate swings shut under its own weight and the pressure of the falling tide outside, trapping a body of water above the level of the sea.",
      "Water 'pushes the gate open'.",
    ),
    noteLine(
      MILL_FLOW,
      null,
      "The sea drops until there is enough ______ to work with",
      "head",
      "Once the sea outside has dropped far enough to give a useful head, a sluice is opened and the trapped water runs out through a wheel.",
      "It must give 'a useful head'.",
      { before: [{ text: "Twice a day, on the moon's timetable:", indent: 0 }] },
    ),
    noteLine(
      MILL_FLOW,
      null,
      "A ______ is opened and the pond empties through the wheel",
      "sluice",
      "Once the sea outside has dropped far enough to give a useful head, a sluice is opened and the trapped water runs out through a wheel.",
      "'A sluice is opened'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Too open an ______ will silt up or be wrecked by storms.",
      "inlet",
      "An inlet that is too open silts up or is destroyed by storms, and one that is too enclosed does not fill fast enough.",
      "An inlet 'that is too open silts up'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "______ wheels were usual because the head of water is small.",
      "Undershot",
      "Undershot wheels were usual for this reason, and some later mills used horizontal wheels of a kind rare elsewhere in Europe.",
      "'Undershot wheels were usual'.",
    ),
    mcq(
      "What displaced the tide mill?",
      [
        "The steam engine, which could be built anywhere",
        "Larger river mills further inland",
        "The silting up of suitable inlets",
        "Legal restrictions on damming estuaries",
      ],
      "The steam engine, which could be built anywhere",
      "The steam engine could be built anywhere, needed no particular site, ran at a constant speed and worked to a timetable a human being could keep, and it displaced every power source that depended on a place.",
      "Steam 'could be built anywhere'.",
    ),
    mcq(
      "What has stopped the largest tidal barrage proposals?",
      [
        "The loss of feeding grounds for birds",
        "The cost of building the turbines",
        "Doubts about the engineering",
        "Opposition from shipping companies",
      ],
      "The loss of feeding grounds for birds",
      "The largest proposals have foundered on that objection rather than on any question of engineering or cost.",
      "They foundered on the mudflats objection.",
    ),
  ],
};
