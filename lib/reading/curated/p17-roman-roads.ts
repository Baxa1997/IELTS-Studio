import { fromList, gapFill, mcq, tfng, type CuratedPassage } from "./shared";

const ROAD_ENDINGS = [
  "because a straight line is the cheapest route to survey and to maintain.",
  "although the surface visible today is rarely the original one.",
  "which is why the route ignores the gradient a modern engineer would avoid.",
  "even though the army that built it moved at walking pace.",
  "because the line was set before anybody walked the ground between the marks.",
  "despite the expense of cutting through the ridge rather than going round it.",
  "which suggests the surveyors were working from high points they could see.",
];

export const ROMAN_ROADS: CuratedPassage = {
  key: "roman-roads",
  title: "Drawing a Line Across a Province",
  topic: "how Roman surveyors laid out roads that ignored the landscape",
  difficulty: 6,
  body: `The most striking feature of a Roman road is its indifference to terrain. A modern road follows a contour, winds along a valley and climbs by the gentlest available gradient, because the vehicles using it are sensitive to slope and because earth-moving is expensive. A Roman road frequently does the opposite: it takes a ridge head-on, holds a bearing for thirty kilometres, and changes direction at a high point rather than where the ground suggests.

The explanation is partly about vehicles and mostly about method. Roman traffic was predominantly on foot, and a pedestrian or a pack animal is far less troubled by a steep short climb than a wheeled vehicle is. But the deeper reason is that the road was laid out before it was built, by a survey conducted from points that could see one another, and that method produces straight lines almost automatically.

The surveyor's principal instrument was the groma: a vertical staff carrying a horizontal cross of four arms, with a plumb line hanging from each end. Sighting along two opposite plumb lines gives a straight line, and the perpendicular pair gives a right angle to it. It is a simple device and a precise one, provided it is set up truly vertical and the wind is not blowing, and the surveying corps of a legion carried them as standard equipment.

Laying out a long route began from high ground. A line of sight was established between prominent points — hilltops, and where none existed, the smoke of fires lit for the purpose — and marks were set along it. Where the intervening ground could not be seen from either end, a technique of successive approximation was used: two intermediate poles were set roughly on the line, each surveyor then moved his pole until it lay on the line between the other pole and the far mark, and the process was repeated until both poles stopped needing adjustment. The method converges, and it requires no instrument at all beyond a straight eye.

Only after the line existed did anybody consider the ground it crossed. Where the line met a marsh, the road was carried across on a raft of timber and brushwood; where it met a river, a ford was engineered or a bridge built; where it met a ridge, a cutting was made. Deviations were allowed but were treated as departures from a plan, and the road returned to its bearing afterwards, which is why a Roman road in difficult country consists of straight segments with angles between them rather than of curves.

The construction was as standardised as the survey. A trench was dug down to firm ground and filled in layers: large stones at the bottom, then smaller material, then a compacted surface of gravel or of fitted paving on the most important routes. The whole was cambered so that water ran off, and ditches on either side carried it away. The layers are what account for the survival of these roads, and the drainage is what accounts for it more: the enemy of a road is standing water, and a Roman road was built to shed it.

It is worth being clear about who the roads were for. They were built by the army, primarily for the army, and their first purpose was to move soldiers and supplies at a predictable rate. Commerce followed and quickly became the larger traffic, but the network's shape reflects military requirements — the line from a port to a frontier, the connection between two garrisons — rather than the pattern of trade that later used it.

The scale is worth stating. The network at its greatest extent ran to something over eighty thousand kilometres of surfaced road, laid out across three continents by surveyors using a cross of sticks and a plumb line, with no instrument for measuring an angle and no means of determining a position other than what they could see.

Much of that network is still in use, which is the detail that surprises people. Modern roads across Europe frequently sit directly on Roman alignments, having been resurfaced continuously for two thousand years, and the reason is not reverence. A route that connects the same two places by the shortest practicable line is the route anybody would choose again, and the engineering beneath it had already been paid for. What survives is less often the Roman surface than the Roman decision about where the road should go.`,
  questions: [
    tfng(
      "Roman roads generally avoided steep gradients.",
      "FALSE",
      "A Roman road frequently does the opposite: it takes a ridge head-on, holds a bearing for thirty kilometres, and changes direction at a high point rather than where the ground suggests.",
      "It 'takes a ridge head-on'.",
    ),
    tfng(
      "Pack animals cope better with short steep climbs than wheeled vehicles do.",
      "TRUE",
      "Roman traffic was predominantly on foot, and a pedestrian or a pack animal is far less troubled by a steep short climb than a wheeled vehicle is.",
      "They are 'far less troubled by a steep short climb'.",
    ),
    tfng(
      "The groma required calm conditions to give an accurate reading.",
      "TRUE",
      "It is a simple device and a precise one, provided it is set up truly vertical and the wind is not blowing, and the surveying corps of a legion carried them as standard equipment.",
      "It needs the wind not to be blowing.",
    ),
    tfng(
      "Fires were sometimes used to mark points that had no natural landmark.",
      "TRUE",
      "A line of sight was established between prominent points — hilltops, and where none existed, the smoke of fires lit for the purpose — and marks were set along it.",
      "Smoke from fires served as marks.",
    ),
    tfng(
      "The route was adjusted to the ground before the line was set.",
      "FALSE",
      "Only after the line existed did anybody consider the ground it crossed.",
      "The line came first.",
    ),
    tfng(
      "Drainage mattered more than the layers for the roads' survival.",
      "TRUE",
      "The layers are what account for the survival of these roads, and the drainage is what accounts for it more: the enemy of a road is standing water, and a Roman road was built to shed it.",
      "Drainage 'accounts for it more'.",
    ),
    tfng(
      "The network was laid out to serve trade routes.",
      "FALSE",
      "Commerce followed and quickly became the larger traffic, but the network's shape reflects military requirements — the line from a port to a frontier, the connection between two garrisons — rather than the pattern of trade that later used it.",
      "Its shape 'reflects military requirements'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "The surveyor's main instrument was the ______.",
      "groma",
      "The surveyor's principal instrument was the groma: a vertical staff carrying a horizontal cross of four arms, with a plumb line hanging from each end.",
      "It was 'the groma'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Each arm of the instrument carried a ______ hanging from its end.",
      "plumb line",
      "The surveyor's principal instrument was the groma: a vertical staff carrying a horizontal cross of four arms, with a plumb line hanging from each end.",
      "There was 'a plumb line hanging from each end'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "The road surface was ______ so that rain ran off it.",
      "cambered",
      "The whole was cambered so that water ran off, and ditches on either side carried it away.",
      "It 'was cambered so that water ran off'.",
    ),
    mcq(
      "How were intermediate points placed when the ends could not see each other?",
      [
        "By moving two poles alternately until both lay on the line",
        "By measuring the distance with a chain",
        "By following the highest ground available",
        "By lighting a fire at every intermediate point",
      ],
      "By moving two poles alternately until both lay on the line",
      "Where the intervening ground could not be seen from either end, a technique of successive approximation was used: two intermediate poles were set roughly on the line, each surveyor then moved his pole until it lay on the line between the other pole and the far mark, and the process was repeated until both poles stopped needing adjustment.",
      "Two poles were adjusted alternately until stable.",
    ),
    fromList(
      "matching_sentence_endings",
      ROAD_ENDINGS,
      "Roman roads run straight for great distances",
      "because the line was set before anybody walked the ground between the marks.",
      "Only after the line existed did anybody consider the ground it crossed.",
      "The ground was considered only after the line existed.",
    ),
    fromList(
      "matching_sentence_endings",
      ROAD_ENDINGS,
      "Direction changes occur at summits rather than in valleys,",
      "which suggests the surveyors were working from high points they could see.",
      "Laying out a long route began from high ground.",
      "The survey began from high ground.",
    ),
    fromList(
      "matching_sentence_endings",
      ROAD_ENDINGS,
      "Modern roads still follow many of these alignments,",
      "although the surface visible today is rarely the original one.",
      "What survives is less often the Roman surface than the Roman decision about where the road should go.",
      "The decision survives more often than the surface.",
    ),
  ],
};
