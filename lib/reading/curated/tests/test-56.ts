import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · invention history · notes box -----------------------------

const ZIP_NOTES = {
  title: "The 1913 redesign",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · agricultural economics · people and a word bank -----------

const SAFFRON_PEOPLE = ["Nasrin Tabatabai", "Josep Ferrer", "Amaia Loyola", "Tenzin Dorje"];
const SAFFRON_BANK = [
  "stigmas",
  "corms",
  "dawn",
  "adulteration",
  "altitude",
  "labour",
  "drying",
  "frost",
  "weight",
];

// ---- Passage 3 · risk and prediction · lettered paragraphs -----------------

const SNOW_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SNOW_ENDINGS = [
  "because the weak layer may lie a metre below anything a skier can see.",
  "although the forecast had correctly described the conditions that morning.",
  "which is why the scale describes likelihood rather than certainty.",
  "even though the party contained the most experienced climbers in the group.",
  "because familiar ground feels safer than it is.",
  "which the writer regards as the most useful thing the science has produced.",
  "despite the absence of any recent snowfall on the slope.",
];

export const TEST_56: CuratedTest = {
  key: "full-test-56",
  targetBand: 5,
  passages: [
    {
      key: "t56-p1-zip-fastener",
      title: "Twenty Years to Close a Gap",
      topic: "why a simple fastening took two decades to catch on",
      difficulty: 4,
      body: `The zip is now so ordinary that it is hard to see it as an invention at all, but it took roughly forty years to move from the first patent to general use, and most of that delay had nothing to do with the mechanics.

The first attempt was made in 1851 by Elias Howe, who had already invented a workable sewing machine and who patented what he called an automatic continuous clothing closure. He did nothing with it. His sewing machine was making money, the closure was not, and the patent lapsed into obscurity for four decades.

It was revived in 1893 by Whitcomb Judson, an engineer in Chicago who was interested in a narrower problem: the high boots then fashionable had twenty or more pairs of eyelets, and lacing them took several minutes twice a day. Judson's clasp locker was a row of hooks and eyes joined by a slider, and it was demonstrated at the Chicago World's Fair of that year to an audience that was interested and did not buy. The device jammed, sprang open without warning, and had to be sewn on by hand because no machine could attach it. One order came from the United States Postal Service, for mail bags, and was not repeated.

The person who made it work was Gideon Sundback, a Swedish-born engineer who joined Judson's struggling company and spent years on the problem. His insight, patented in 1913, was to abandon hooks and eyes altogether. Instead he formed each element as a small cup on one face and a matching protrusion on the other, mounted them on a cloth tape, and shaped the slider so that as it passed it pressed the protrusion of one element into the cup of the element opposite. Nothing hooked anything; the parts interlocked and were held by their shape. He increased the number of elements from four per inch to about ten, which made the closure stronger and more flexible, and he designed a machine that could make and attach the tape at speed, which mattered more commercially than the fastener itself.

Even then it did not sell to the clothing trade. The garment industry of the 1910s regarded it as a novelty: it was metal, it was noisy, it rusted at the laundry, and tailors had no idea how to fit it. The early orders came from elsewhere — money belts, tobacco pouches, and then, in quantity, from the military, which put twenty-four thousand of them into flying suits and life vests during the First World War.

Two things changed in the 1920s. A rubber boot manufacturer adopted the fastener for galoshes and, casting about for a name, coined "zipper" from the sound the thing made. The name stuck to the fastener rather than the boot, and gave the object an identity it had never had under any of its patent descriptions. Then in 1937 the French fashion houses adopted it for men's trousers, having been persuaded that it was more reliable than a row of buttons, and the trade press treated this as news. Within two years it was standard.

There is a detail in the 1913 design that explains why the object has lasted. A hook can be pulled open in the direction it was hooked; an interlocked pair of cups and protrusions cannot, because opening one element requires rotating it, and its neighbours hold it straight. That is why a closed zip resists a load pulling the two sides apart and yet opens under almost no force when the slider rotates the elements one at a time as it passes. The fastener is strong in the direction it is loaded and weak in the direction the slider works, which is exactly the property a closure needs and exactly what the hook-and-eye versions never had.

What the story illustrates is not mechanical difficulty but the amount of surrounding work an invention needs before it can be used. Sundback's fastener required a machine to manufacture it, a machine to attach it, a workforce trained to sew it in, a name the public could use, and an application prestigious enough to make it acceptable. The engineering was finished in 1913. The rest took another twenty-four years.`,
      questions: [
        tfng(
          "Elias Howe developed his fastening idea into a product.",
          "FALSE",
          "He did nothing with it.",
          "'He did nothing with it.'",
        ),
        tfng(
          "Judson was trying to solve a problem with footwear.",
          "TRUE",
          "It was revived in 1893 by Whitcomb Judson, an engineer in Chicago who was interested in a narrower problem: the high boots then fashionable had twenty or more pairs of eyelets, and lacing them took several minutes twice a day.",
          "His problem was lacing high boots.",
        ),
        tfng(
          "Judson's device was reliable but too expensive to produce.",
          "FALSE",
          "The device jammed, sprang open without warning, and had to be sewn on by hand because no machine could attach it.",
          "It 'jammed, sprang open without warning'.",
        ),
        tfng(
          "Sundback's design kept the hook-and-eye principle.",
          "FALSE",
          "His insight, patented in 1913, was to abandon hooks and eyes altogether.",
          "He abandoned hooks and eyes 'altogether'.",
        ),
        tfng(
          "The machine for making the fastener mattered more commercially than the fastener.",
          "TRUE",
          "He increased the number of elements from four per inch to about ten, which made the closure stronger and more flexible, and he designed a machine that could make and attach the tape at speed, which mattered more commercially than the fastener itself.",
          "The machine 'mattered more commercially'.",
        ),
        tfng(
          "The word for the fastener came from a company that made footwear.",
          "TRUE",
          'A rubber boot manufacturer adopted the fastener for galoshes and, casting about for a name, coined "zipper" from the sound the thing made.',
          "A rubber boot manufacturer coined it.",
        ),
        tfng(
          "Clothing manufacturers were the first large customers.",
          "FALSE",
          "The early orders came from elsewhere — money belts, tobacco pouches, and then, in quantity, from the military, which put twenty-four thousand of them into flying suits and life vests during the First World War.",
          "Early bulk orders came from the military.",
        ),
        noteLine(
          ZIP_NOTES,
          null,
          "Each element has a cup on one face and a ______ on the other",
          "protrusion",
          "Instead he formed each element as a small cup on one face and a matching protrusion on the other, mounted them on a cloth tape, and shaped the slider so that as it passed it pressed the protrusion of one element into the cup of the element opposite.",
          "Each has 'a matching protrusion on the other'.",
        ),
        noteLine(
          ZIP_NOTES,
          null,
          "The elements are mounted on a cloth ______",
          "tape",
          "Instead he formed each element as a small cup on one face and a matching protrusion on the other, mounted them on a cloth tape, and shaped the slider so that as it passed it pressed the protrusion of one element into the cup of the element opposite.",
          "They are 'mounted … on a cloth tape'.",
          { before: [{ text: "What Sundback changed:", indent: 0 }] },
        ),
        noteLine(
          ZIP_NOTES,
          null,
          "The ______ presses one element into the one opposite as it passes",
          "slider",
          "Instead he formed each element as a small cup on one face and a matching protrusion on the other, mounted them on a cloth tape, and shaped the slider so that as it passed it pressed the protrusion of one element into the cup of the element opposite.",
          "The slider 'pressed the protrusion of one element into the cup'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Judson's device was shown to the public at the Chicago ______ of 1893.",
          "World's Fair",
          "Judson's clasp locker was a row of hooks and eyes joined by a slider, and it was demonstrated at the Chicago World's Fair of that year to an audience that was interested and did not buy.",
          "It was shown at 'the Chicago World's Fair'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Sundback raised the number of elements per inch from four to about ______.",
          "ten",
          "He increased the number of elements from four per inch to about ten, which made the closure stronger and more flexible, and he designed a machine that could make and attach the tape at speed, which mattered more commercially than the fastener itself.",
          "He went 'from four per inch to about ten'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "French ______ adopted the fastener for men's trousers in 1937.",
          "fashion houses",
          "Then in 1937 the French fashion houses adopted it for men's trousers, having been persuaded that it was more reliable than a row of buttons, and the trade press treated this as news.",
          "'The French fashion houses adopted it'.",
        ),
      ],
    },
    {
      key: "t56-p2-saffron",
      title: "The Flower That Must Be Picked at Dawn",
      topic: "the economics of the world's most expensive crop",
      difficulty: 5,
      body: `Saffron is the dried stigma of a particular crocus, and it costs more by weight than any other agricultural product in ordinary trade. The reasons are entirely a matter of arithmetic. Each flower produces exactly three stigmas. A kilogram of dried saffron requires somewhere between one hundred and fifty thousand and two hundred thousand flowers, and every one of those flowers must be picked by hand, and every stigma must be separated from it by hand.

The crop is grown from corms — swollen underground stems, not true bulbs — planted in summer and flowering for two or three weeks in the autumn. Nasrin Tabatabai, an agronomist who works with growers in north-eastern Iran, where the great majority of the world's saffron is produced, describes the harvest as the most compressed operation in farming. The flowers open at first light and must be picked before the sun is high, because heat damages the stigmas and the colour they carry. A family with a hectare under cultivation is therefore working against the clock every morning for a fortnight, and the size of a holding is limited in practice by how many hands can be assembled at dawn rather than by how much land is available.

Separating the stigmas is the second bottleneck. It is done indoors, usually by the same people, sitting over trays of flowers and pinching out the three red threads from each. An experienced worker handles a few hundred flowers an hour. The threads are then dried, which develops the aroma and fixes the colour, and drying is the one stage where technique clearly separates a fine product from an ordinary one. Josep Ferrer, who buys for a Spanish spice house, says he can identify the drying method of a sample by smell alone, and that he rejects more lots for poor drying than for any other fault.

The price the crop commands invites imitation, and saffron has been adulterated for as long as it has been traded. Medieval German cities executed merchants for it. The modern versions are more chemical than theatrical: safflower or marigold petals dyed and cut to resemble threads, threads bulked with glycerine or honey to add weight, and colouring agents added to disguise a weak harvest. Amaia Loyola, an analytical chemist, notes that the standard laboratory tests measure the three compounds responsible for colour, aroma and bitterness, and that a sample can pass on all three and still be part vegetable filler, which is why serious buyers now use genetic testing on a proportion of what they purchase.

Growing conditions are demanding but not exotic. The plant wants a hot dry summer to ripen the corms and a cold winter, tolerates poor soil, and needs very little water compared with most crops — an advantage that has attracted attention in regions where irrigation is becoming scarce. Tenzin Dorje, who has advised smallholders in the Himalayan foothills, argues that the real obstacle to expansion is never the climate but the first three years, during which a grower plants, waits, and earns nothing, since a new field produces almost no harvest in its first season and reaches full yield only in its third or fourth.

That delay explains a pattern that runs through the trade. Saffron is grown overwhelmingly by smallholders, on plots of a hectare or less, in households where the labour is family labour and is therefore not costed in cash. Attempts to grow it at industrial scale have repeatedly failed on the arithmetic of wages: if every picker and every separator is paid an hourly rate, the crop stops being profitable well before it reaches a size at which machinery might help. Nobody has built a machine that can pick a crocus without bruising it, and nobody has found a way of separating three threads from a flower faster than a practised thumb and forefinger.

Mechanisation has been attempted at every stage and has stalled at the same two. Corms can be planted by machine and fields can be ploughed by machine, and neither is where the labour goes.

The result is a commodity that trades internationally at the price of a precious metal and is produced almost entirely by families working by hand in the fortnight after the first autumn rains.`,
      questions: [
        fromList(
          "matching_features",
          SAFFRON_PEOPLE,
          "The picking window each day is extremely short.",
          "Nasrin Tabatabai",
          "The flowers open at first light and must be picked before the sun is high, because heat damages the stigmas and the colour they carry.",
          "Tabatabai describes the dawn window.",
        ),
        fromList(
          "matching_features",
          SAFFRON_PEOPLE,
          "One processing stage separates good product from ordinary more than any other.",
          "Josep Ferrer",
          "Josep Ferrer, who buys for a Spanish spice house, says he can identify the drying method of a sample by smell alone, and that he rejects more lots for poor drying than for any other fault.",
          "Ferrer rejects most lots for drying faults.",
        ),
        fromList(
          "matching_features",
          SAFFRON_PEOPLE,
          "Standard chemical tests can be passed by a partly fake sample.",
          "Amaia Loyola",
          "Amaia Loyola, an analytical chemist, notes that the standard laboratory tests measure the three compounds responsible for colour, aroma and bitterness, and that a sample can pass on all three and still be part vegetable filler, which is why serious buyers now use genetic testing on a proportion of what they purchase.",
          "Loyola explains the limits of the standard tests.",
        ),
        fromList(
          "matching_features",
          SAFFRON_PEOPLE,
          "The first few unproductive years are what deters new growers.",
          "Tenzin Dorje",
          "Tenzin Dorje, who has advised smallholders in the Himalayan foothills, argues that the real obstacle to expansion is never the climate but the first three years, during which a grower plants, waits, and earns nothing, since a new field produces almost no harvest in its first season and reaches full yield only in its third or fourth.",
          "Dorje names the first three years.",
        ),
        fromList(
          "summary_completion",
          SAFFRON_BANK,
          "Each flower yields only three ______, which must be removed by hand.",
          "stigmas",
          "Each flower produces exactly three stigmas.",
          "'Each flower produces exactly three stigmas.'",
        ),
        fromList(
          "summary_completion",
          SAFFRON_BANK,
          "The crop grows from ______ planted during the summer.",
          "corms",
          "The crop is grown from corms — swollen underground stems, not true bulbs — planted in summer and flowering for two or three weeks in the autumn.",
          "It grows 'from corms … planted in summer'.",
        ),
        fromList(
          "summary_completion",
          SAFFRON_BANK,
          "Picking has to happen at ______ before the sun damages the threads.",
          "dawn",
          "A family with a hectare under cultivation is therefore working against the clock every morning for a fortnight, and the size of a holding is limited in practice by how many hands can be assembled at dawn rather than by how much land is available.",
          "Hands must be assembled 'at dawn'.",
        ),
        fromList(
          "summary_completion",
          SAFFRON_BANK,
          "The threads are finished by ______, which sets both aroma and colour.",
          "drying",
          "The threads are then dried, which develops the aroma and fixes the colour, and drying is the one stage where technique clearly separates a fine product from an ordinary one.",
          "Drying 'develops the aroma and fixes the colour'.",
        ),
        fromList(
          "summary_completion",
          SAFFRON_BANK,
          "The high price has always encouraged ______ of the product.",
          "adulteration",
          "The price the crop commands invites imitation, and saffron has been adulterated for as long as it has been traded.",
          "It 'has been adulterated for as long as it has been traded'.",
        ),
        mcq(
          "How many flowers are needed for a kilogram of saffron?",
          [
            "Between 150,000 and 200,000",
            "Between 15,000 and 20,000",
            "About a million",
            "It depends entirely on the variety",
          ],
          "Between 150,000 and 200,000",
          "A kilogram of dried saffron requires somewhere between one hundred and fifty thousand and two hundred thousand flowers, and every one of those flowers must be picked by hand, and every stigma must be separated from it by hand.",
          "The figure is 150,000 to 200,000.",
        ),
        mcq(
          "What does the passage say about the plant's water needs?",
          [
            "They are low compared with most crops",
            "They are high but concentrated in autumn",
            "They rule out cultivation in dry regions",
            "They have never been measured accurately",
          ],
          "They are low compared with most crops",
          "The plant wants a hot dry summer to ripen the corms and a cold winter, tolerates poor soil, and needs very little water compared with most crops — an advantage that has attracted attention in regions where irrigation is becoming scarce.",
          "It 'needs very little water compared with most crops'.",
        ),
        mcq(
          "Why have industrial-scale attempts failed?",
          [
            "Paid labour makes the crop unprofitable",
            "Large fields attract more disease",
            "Corms cannot be planted by machine",
            "Buyers prefer smallholder product",
          ],
          "Paid labour makes the crop unprofitable",
          "Attempts to grow it at industrial scale have repeatedly failed on the arithmetic of wages: if every picker and every separator is paid an hourly rate, the crop stops being profitable well before it reaches a size at which machinery might help.",
          "They fail 'on the arithmetic of wages'.",
        ),
        mcq(
          "What has nobody yet managed to build?",
          [
            "A machine that picks the flowers undamaged",
            "A test that detects all forms of adulteration",
            "A variety that flowers over a longer period",
            "A drying method that works in humid air",
          ],
          "A machine that picks the flowers undamaged",
          "Nobody has built a machine that can pick a crocus without bruising it, and nobody has found a way of separating three threads from a flower faster than a practised thumb and forefinger.",
          "No machine 'can pick a crocus without bruising it'.",
        ),
      ],
    },
    {
      key: "t56-p3-avalanche-forecast",
      title: "Forecasting the Slope",
      topic: "how avalanche risk is judged and why the judgement so often fails",
      difficulty: 6,
      body: `A) An avalanche needs four things at once: a slope steep enough to slide, a layer of snow that will fail, something above that layer heavy enough to load it, and a trigger. The first is fixed and mappable. The second is the difficult one, because the weak layer is buried, may have formed weeks earlier, and cannot be seen from the surface at all.

B) Weak layers form in identifiable ways. A clear, cold, still night draws heat out of the snow surface and grows large faceted crystals with almost no bond between them; if the next storm buries that layer, it becomes a sheet of ball bearings under whatever falls on top. Surface hoar — frost that forms as feathery crystals on the snow — does the same thing and is even weaker. Rain followed by freezing produces a crust that the next layer may not bond to. Wind is the other great builder of hazard, stripping snow from one aspect and packing it onto another as a dense slab that sits, stiff and cohesive, on whatever it happened to land on. Each of these can persist for weeks or months, and each is invisible once covered.

C) Forecasters therefore work indirectly. They dig pits, isolate a column of snow and load it in standard ways to see where and how it fails; they record which layers exist across a region; they watch the weather that is loading them; and they collect reports of natural releases, which are the most reliable single indicator of instability. From that they issue a regional forecast on a five-point scale, which describes not a place but a probability across a whole area, and names the problem type — a persistent weak layer, a wind slab, wet snow — along with the aspects and elevations where it is expected.

D) The forecasts are good, in the sense that they are statistically well calibrated: days rated high produce far more avalanches than days rated moderate. What they cannot do is tell an individual whether a particular slope will release under a particular skier, and the gap between a regional probability and an individual decision is where almost every fatality occurs.

E) The pattern in those fatalities is remarkably consistent, and it is not the pattern people expect. The majority of victims in recreational avalanches are experienced. They are caught on days rated moderate or considerable rather than extreme, on terrain they know, often within sight of tracks left by other parties. Days rated extreme produce few casualties for the obvious reason that almost nobody goes out on them, which is itself evidence that people respond rationally to a warning when the warning is unambiguous. The Canadian and Swiss accident databases both show that the large majority of fatal slides were triggered by the victim or by somebody in the victim's group, which means that the avalanche was, in a literal sense, chosen.

F) The explanations that have held up are about decision-making rather than snow. Groups accept more risk than individuals and accept it more readily when the group is large. Tracks on a slope are read as evidence of safety when they are evidence only that somebody else went first. Familiar terrain is discounted, because a slope skied fifty times without incident feels like a slope that does not slide, although the snowpack has no memory of the previous fifty days. And the strongest effect of all appears when a group has travelled a long way to reach a particular objective: the cost already spent makes turning back feel like a loss, which it is, and makes continuing feel like a decision when it is really the absence of one.

G) The most useful thing avalanche science has produced, in my view, is not the forecast but the checklist. Several simple rule-based methods exist — reduce the acceptable slope angle as the danger rating rises, travel one at a time on suspect terrain, always have somebody watching — and studies comparing them against expert judgement find that they perform about as well in the hands of a beginner and better than the beginner would have done unaided. That is an unusual result in any field, and it points at where the real problem lies. The snow is hard to read. The reading is not, in most accidents, what went wrong.`,
      questions: [
        fromList(
          "matching_information",
          SNOW_PARAGRAPHS,
          "a list of the conditions that must be present together",
          "A",
          "An avalanche needs four things at once: a slope steep enough to slide, a layer of snow that will fail, something above that layer heavy enough to load it, and a trigger.",
          "Paragraph A lists the four conditions.",
        ),
        fromList(
          "matching_information",
          SNOW_PARAGRAPHS,
          "a description of how forecasters gather evidence they cannot see directly",
          "C",
          "They dig pits, isolate a column of snow and load it in standard ways to see where and how it fails; they record which layers exist across a region; they watch the weather that is loading them; and they collect reports of natural releases, which are the most reliable single indicator of instability.",
          "Paragraph C describes pits, records and reports.",
        ),
        fromList(
          "matching_information",
          SNOW_PARAGRAPHS,
          "the effect of having invested effort in reaching a destination",
          "F",
          "And the strongest effect of all appears when a group has travelled a long way to reach a particular objective: the cost already spent makes turning back feel like a loss, which it is, and makes continuing feel like a decision when it is really the absence of one.",
          "Paragraph F describes the sunk-cost effect.",
        ),
        fromList(
          "matching_information",
          SNOW_PARAGRAPHS,
          "evidence that most victims set off the slide themselves",
          "E",
          "The Canadian and Swiss accident databases both show that the large majority of fatal slides were triggered by the victim or by somebody in the victim's group, which means that the avalanche was, in a literal sense, chosen.",
          "Paragraph E cites the two databases.",
        ),
        fromList(
          "matching_information",
          SNOW_PARAGRAPHS,
          "an explanation of how a weather event can create a hidden hazard",
          "B",
          "A clear, cold, still night draws heat out of the snow surface and grows large faceted crystals with almost no bond between them; if the next storm buries that layer, it becomes a sheet of ball bearings under whatever falls on top.",
          "Paragraph B explains faceting and surface hoar.",
        ),
        ynng(
          "The writer considers regional forecasts to be statistically reliable.",
          "YES",
          "The forecasts are good, in the sense that they are statistically well calibrated: days rated high produce far more avalanches than days rated moderate.",
          "They are 'statistically well calibrated'.",
        ),
        ynng(
          "The writer thinks inexperience is the main factor in avalanche deaths.",
          "NO",
          "The majority of victims in recreational avalanches are experienced.",
          "Most victims 'are experienced'.",
        ),
        ynng(
          "The writer believes existing tracks on a slope are a poor guide to safety.",
          "YES",
          "Tracks on a slope are read as evidence of safety when they are evidence only that somebody else went first.",
          "They show only 'that somebody else went first'.",
        ),
        ynng(
          "The writer thinks simple rules are inferior to expert judgement for beginners.",
          "NO",
          "Several simple rule-based methods exist — reduce the acceptable slope angle as the danger rating rises, travel one at a time on suspect terrain, always have somebody watching — and studies comparing them against expert judgement find that they perform about as well in the hands of a beginner and better than the beginner would have done unaided.",
          "They 'perform about as well' and better than unaided beginners.",
        ),
        fromList(
          "matching_sentence_endings",
          SNOW_ENDINGS,
          "The most dangerous layer is often impossible to assess from the surface,",
          "because the weak layer may lie a metre below anything a skier can see.",
          "The second is the difficult one, because the weak layer is buried, may have formed weeks earlier, and cannot be seen from the surface at all.",
          "It is buried and 'cannot be seen from the surface at all'.",
        ),
        fromList(
          "matching_sentence_endings",
          SNOW_ENDINGS,
          "A forecast cannot resolve the safety of one particular slope,",
          "which is why the scale describes likelihood rather than certainty.",
          "What they cannot do is tell an individual whether a particular slope will release under a particular skier, and the gap between a regional probability and an individual decision is where almost every fatality occurs.",
          "It gives a regional probability, not a verdict on a slope.",
        ),
        fromList(
          "matching_sentence_endings",
          SNOW_ENDINGS,
          "Accidents happen disproportionately on ground people have skied before,",
          "because familiar ground feels safer than it is.",
          "Familiar terrain is discounted, because a slope skied fifty times without incident feels like a slope that does not slide, although the snowpack has no memory of the previous fifty days.",
          "Familiarity is mistaken for safety.",
        ),
        fromList(
          "matching_sentence_endings",
          SNOW_ENDINGS,
          "Weak layers can lie waiting long after the weather that made them,",
          "despite the absence of any recent snowfall on the slope.",
          "Each of these can persist for weeks or months, and each is invisible once covered.",
          "They 'persist for weeks or months'.",
        ),
        fromList(
          "matching_sentence_endings",
          SNOW_ENDINGS,
          "Checklists outperform what they replace,",
          "which the writer regards as the most useful thing the science has produced.",
          "The most useful thing avalanche science has produced, in my view, is not the forecast but the checklist.",
          "The writer names the checklist as the most useful output.",
        ),
      ],
    },
  ],
};
