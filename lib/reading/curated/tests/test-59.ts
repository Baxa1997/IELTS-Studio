import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · instrument history · notes box ----------------------------

const SCALE_NOTES = {
  title: "Fixing the two ends of a scale",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · crop pathology · people and a word bank -------------------

const RUST_PEOPLE = ["Beatriz Olmos", "Kwame Asante", "Sylvie Rochon", "Hiroshi Nakata"];
const RUST_BANK = [
  "spores",
  "shade",
  "clones",
  "altitude",
  "humidity",
  "pruning",
  "resistance",
  "leaves",
  "price",
];

// ---- Passage 3 · research methods debate · lettered paragraphs -------------

const TRIAL_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const TRIAL_ENDINGS = [
  "because the result holds for the population that was actually enrolled.",
  "although the same programme failed when it was expanded nationally.",
  "which is why the method suits some questions far better than others.",
  "even though the intervention itself was identical in both places.",
  "because nobody can be randomly assigned to a currency or a constitution.",
  "which the writer regards as the method's real contribution.",
  "despite having been designed by the researchers who evaluated it.",
];

export const TEST_59: CuratedTest = {
  key: "full-test-59",
  targetBand: 7,
  passages: [
    {
      key: "t59-p1-thermometer",
      title: "Agreeing on a Degree",
      topic: "how a common scale of temperature was settled on",
      difficulty: 6,
      body: `An instrument that shows whether something is getting hotter is easy to build and was built repeatedly from the late sixteenth century onwards. Galileo and his contemporaries made air thermoscopes: a bulb of air above a column of water, which rose and fell as the air expanded and contracted. They were sensitive, they were entertaining, and they were useless for comparison, because each one gave its own readings and because they responded to changes in atmospheric pressure as much as to changes in heat.

Two problems had to be solved before temperature could be measured rather than merely noticed. The instrument had to be sealed, so that the atmosphere could not push on the liquid, and the scale had to be anchored to something that happened at the same temperature everywhere.

Sealed liquid thermometers appeared in Florence in the 1650s, and the second problem then occupied the best part of a century. A scale needs fixed points, and the candidates proposed included the temperature of melting butter, the temperature of a cellar in Paris, the temperature of blood, and the temperature of the deepest winter in a particular year. Each of them is either unreproducible or not actually constant.

Daniel Fahrenheit, a German instrument maker working in Amsterdam, made the decisive practical advances in the 1710s. He was the first to use mercury successfully, which expands more uniformly than alcohol and can be used across a much wider range, and he developed a method of purifying it and of making tubes of consistent bore. He also achieved a consistency nobody had managed before: two thermometers made by Fahrenheit agreed with each other. His scale used a freezing mixture of ice, water and salt for its zero, a point which can be reproduced but not very precisely, and human body temperature near the upper end. Both choices have been criticised ever since, and neither prevented the instruments from being excellent.

Anders Celsius proposed the scale that displaced it in 1742, using two points that are genuinely reproducible: the freezing and boiling points of water at standard atmospheric pressure. He divided the interval into a hundred parts, and — a detail that surprises people — he put zero at boiling and a hundred at freezing. The scale was inverted after his death, probably by the botanist Carl Linnaeus, who wanted a thermometer for greenhouses in which the numbers rose as the air warmed.

The two scales then coexisted for two centuries, which is a fact about habit rather than about physics. Fahrenheit's instruments were the good ones when the English-speaking world bought its first thermometers, and the scale travelled with the hardware. Celsius spread through scientific use and through the countries that adopted the metric system, and the division has survived every attempt to tidy it up. A scale is a convention, and conventions are set by who was selling instruments in a particular decade.

The fixed-point approach has a limitation that became apparent as measurements grew more precise. Both of Celsius's points depend on pressure, and the boiling point in particular moves noticeably with altitude and with the weather. More fundamentally, a scale defined by two arbitrary points has no physical meaning between them or beyond them: it says where water changes state, not what temperature is.

That was supplied in the 1840s by the observation that a gas at constant pressure contracts by a fixed proportion of its volume for each degree it cools, which implies a temperature at which the volume would reach zero. That point — absolute zero, about two hundred and seventy-three degrees below the freezing point of water — is not a convention but a limit, and a scale that starts there measures something real. The kelvin, the unit of the absolute scale, is the same size as a Celsius degree, which is why converting between them requires only addition.

The last change was administrative and recent. Until 2019 the kelvin was defined by a fixed point of its own, the triple point of water, which is the single combination of temperature and pressure at which ice, water and vapour coexist. Since then it has been defined by fixing the numerical value of a constant of nature, which means that the definition no longer depends on any substance at all, or on anybody having a sample of pure water of the correct isotopic composition. In four centuries the reference for temperature moved from a cellar in Paris to a physical constant, and the thing being measured did not change at all.`,
      questions: [
        tfng(
          "Early air thermoscopes gave readings that could be compared between instruments.",
          "FALSE",
          "They were sensitive, they were entertaining, and they were useless for comparison, because each one gave its own readings and because they responded to changes in atmospheric pressure as much as to changes in heat.",
          "They were 'useless for comparison'.",
        ),
        tfng(
          "Sealing the instrument removed the influence of the atmosphere.",
          "TRUE",
          "The instrument had to be sealed, so that the atmosphere could not push on the liquid, and the scale had to be anchored to something that happened at the same temperature everywhere.",
          "Sealing stopped the atmosphere pushing on the liquid.",
        ),
        tfng(
          "Fahrenheit was the first to make thermometers that agreed with one another.",
          "TRUE",
          "He also achieved a consistency nobody had managed before: two thermometers made by Fahrenheit agreed with each other.",
          "Two of his instruments 'agreed with each other'.",
        ),
        tfng(
          "Fahrenheit's choice of fixed points has been widely praised.",
          "FALSE",
          "Both choices have been criticised ever since, and neither prevented the instruments from being excellent.",
          "They 'have been criticised ever since'.",
        ),
        tfng(
          "Celsius originally placed zero at the freezing point of water.",
          "FALSE",
          "He divided the interval into a hundred parts, and — a detail that surprises people — he put zero at boiling and a hundred at freezing.",
          "He 'put zero at boiling'.",
        ),
        tfng(
          "The boiling point of water varies with height above sea level.",
          "TRUE",
          "Both of Celsius's points depend on pressure, and the boiling point in particular moves noticeably with altitude and with the weather.",
          "It 'moves noticeably with altitude'.",
        ),
        tfng(
          "A kelvin and a Celsius degree are the same size.",
          "TRUE",
          "The kelvin, the unit of the absolute scale, is the same size as a Celsius degree, which is why converting between them requires only addition.",
          "They are 'the same size'.",
        ),
        noteLine(
          SCALE_NOTES,
          null,
          "Fahrenheit set his zero using a mixture of ice, water and ______",
          "salt",
          "His scale used a freezing mixture of ice, water and salt for its zero, a point which can be reproduced but not very precisely, and human body temperature near the upper end.",
          "The mixture was 'ice, water and salt'.",
        ),
        noteLine(
          SCALE_NOTES,
          null,
          "Celsius used the freezing and ______ points of water instead",
          "boiling",
          "Anders Celsius proposed the scale that displaced it in 1742, using two points that are genuinely reproducible: the freezing and boiling points of water at standard atmospheric pressure.",
          "He used 'the freezing and boiling points of water'.",
          { before: [{ text: "Each scale needed two anchors:", indent: 0 }] },
        ),
        noteLine(
          SCALE_NOTES,
          null,
          "The absolute scale begins instead at a physical ______",
          "limit",
          "That point — absolute zero, about two hundred and seventy-three degrees below the freezing point of water — is not a convention but a limit, and a scale that starts there measures something real.",
          "Absolute zero 'is not a convention but a limit'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Fahrenheit was the first to use ______ successfully in a thermometer.",
          "mercury",
          "He was the first to use mercury successfully, which expands more uniformly than alcohol and can be used across a much wider range, and he developed a method of purifying it and of making tubes of consistent bore.",
          "He was first to use mercury successfully.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The Celsius scale was probably reversed by the botanist Carl ______.",
          "Linnaeus",
          "The scale was inverted after his death, probably by the botanist Carl Linnaeus, who wanted a thermometer for greenhouses in which the numbers rose as the air warmed.",
          "It was inverted 'probably by the botanist Carl Linnaeus'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Before 2019 the kelvin was defined using the ______ point of water.",
          "triple",
          "Until 2019 the kelvin was defined by a fixed point of its own, the triple point of water, which is the single combination of temperature and pressure at which ice, water and vapour coexist.",
          "It used 'the triple point of water'.",
        ),
      ],
    },
    {
      key: "t59-p2-coffee-rust",
      title: "A Crop with Almost No Variety",
      topic: "why a fungus can threaten a whole continent's coffee",
      difficulty: 7,
      body: `Coffee leaf rust is a fungus that grows on the underside of coffee leaves, producing orange patches of spores and causing the leaves to fall. A tree that loses its leaves cannot photosynthesise, so it produces little or no fruit that season, and a tree that is defoliated repeatedly dies. The disease was recorded in Ceylon in 1869, destroyed the island's coffee industry within twenty years, and is the reason Sri Lanka is now a tea producer.

It reached Brazil in 1970 and the rest of Latin America over the following decade. The epidemic that began in Central America in 2012 affected more than half the region's planted area, cut harvests by up to forty per cent in some countries, and removed an estimated three hundred and fifty thousand jobs.

The vulnerability is genetic and it is old. Beatriz Olmos, a plant pathologist, points out that almost all the arabica grown worldwide descends from a very small number of plants taken out of Ethiopia and Yemen in the seventeenth and eighteenth centuries, and that arabica is additionally self-pollinating, which further narrows the variation. The cultivated crop therefore contains a tiny fraction of the diversity present in the wild populations of the Ethiopian highlands, and a pathogen that defeats one plant's defences has a good chance of defeating all of them. Olmos describes the world's coffee as something close to a single organism grown in fifty countries.

Two things changed in the 2012 epidemic that had not been true of earlier ones. Kwame Asante, who studies the epidemiology, notes that rust had historically been limited by altitude: the spores germinate only within a particular range of temperature and humidity, and the higher, cooler farms were largely safe. Warming has moved that boundary several hundred metres up the slope, and farms that had never needed to manage the disease found themselves inside its range with no equipment, no experience and no budget for fungicide. The second change was economic. The epidemic followed a collapse in the coffee price, which meant that the year in which growers most needed to spend on fertiliser, pruning and fungicide was the year in which they had least money to spend.

Sylvie Rochon, an agronomist who works with cooperatives, is insistent that the disease is manageable with ordinary agronomy and that describing it as unstoppable does harm. Well-nourished trees resist infection substantially better than starved ones. Pruning to open the canopy reduces the humidity the spores need. Removing infected material reduces the inoculum for next season. None of this is exotic, and all of it costs money and labour at the point in the cycle when a smallholder has neither.

Resistant varieties are the obvious structural answer and they carry a cost that growers weigh carefully. Most of the resistance available derives from a single spontaneous hybrid between arabica and the robusta species, found in Timor in the 1920s, which has been bred into a series of cultivars now grown widely. The resistance has repeatedly been overcome, because a fungus reproducing across millions of hectares generates the necessary mutations eventually. And the varieties carrying it have historically produced a cup that specialty buyers rate lower, which matters when the premium for quality is what keeps a small farm viable.

Hiroshi Nakata, who works on the crop's genetic base, argues that the long-term answer must come from the wild populations in Ethiopia and from the other coffee species, of which more than a hundred are known and two are commercially grown. Several wild species show resistance, and at least one produces a drinkable cup with almost no caffeine. The obstacles are that breeding a tree crop is a decades-long undertaking, that the wild populations are themselves threatened by forest clearance and by a warming climate, and that the countries holding the diversity have understandable views about who should benefit from it.

The immediate future is therefore neither catastrophe nor resolution. The rust is now endemic across the Americas, the altitude at which it stops is rising, and the people bearing the risk are the twelve million or so smallholders who produce most of the world's coffee on plots of a few hectares and who have almost no capacity to absorb a bad year.`,
      questions: [
        fromList(
          "matching_features",
          RUST_PEOPLE,
          "The world's cultivated coffee is genetically close to a single plant.",
          "Beatriz Olmos",
          "Olmos describes the world's coffee as something close to a single organism grown in fifty countries.",
          "Olmos makes the single-organism comparison.",
        ),
        fromList(
          "matching_features",
          RUST_PEOPLE,
          "Higher farms that were once safe have come within the disease's range.",
          "Kwame Asante",
          "Warming has moved that boundary several hundred metres up the slope, and farms that had never needed to manage the disease found themselves inside its range with no equipment, no experience and no budget for fungicide.",
          "Asante describes the boundary moving uphill.",
        ),
        fromList(
          "matching_features",
          RUST_PEOPLE,
          "Calling the disease unstoppable is itself damaging.",
          "Sylvie Rochon",
          "Sylvie Rochon, an agronomist who works with cooperatives, is insistent that the disease is manageable with ordinary agronomy and that describing it as unstoppable does harm.",
          "Rochon says that description 'does harm'.",
        ),
        fromList(
          "matching_features",
          RUST_PEOPLE,
          "The lasting solution lies in wild populations and other species.",
          "Hiroshi Nakata",
          "Hiroshi Nakata, who works on the crop's genetic base, argues that the long-term answer must come from the wild populations in Ethiopia and from the other coffee species, of which more than a hundred are known and two are commercially grown.",
          "Nakata points to wild populations and other species.",
        ),
        fromList(
          "summary_completion",
          RUST_BANK,
          "The fungus produces orange patches of ______ under the leaf.",
          "spores",
          "Coffee leaf rust is a fungus that grows on the underside of coffee leaves, producing orange patches of spores and causing the leaves to fall.",
          "It produces 'orange patches of spores'.",
        ),
        fromList(
          "summary_completion",
          RUST_BANK,
          "An infected tree drops its ______ and cannot then produce fruit.",
          "leaves",
          "A tree that loses its leaves cannot photosynthesise, so it produces little or no fruit that season, and a tree that is defoliated repeatedly dies.",
          "It loses its leaves and stops fruiting.",
        ),
        fromList(
          "summary_completion",
          RUST_BANK,
          "The spores need particular temperature and ______ to germinate.",
          "humidity",
          "Kwame Asante, who studies the epidemiology, notes that rust had historically been limited by altitude: the spores germinate only within a particular range of temperature and humidity, and the higher, cooler farms were largely safe.",
          "They need a range of 'temperature and humidity'.",
        ),
        fromList(
          "summary_completion",
          RUST_BANK,
          "Opening the canopy by ______ makes conditions less suitable for the fungus.",
          "pruning",
          "Pruning to open the canopy reduces the humidity the spores need.",
          "'Pruning to open the canopy' reduces humidity.",
        ),
        fromList(
          "summary_completion",
          RUST_BANK,
          "Bred-in ______ has been defeated by the fungus more than once.",
          "resistance",
          "The resistance has repeatedly been overcome, because a fungus reproducing across millions of hectares generates the necessary mutations eventually.",
          "It 'has repeatedly been overcome'.",
        ),
        mcq(
          "What happened to coffee growing in Ceylon?",
          [
            "It was replaced by tea after the disease arrived",
            "It recovered after twenty years of losses",
            "It moved to higher ground on the island",
            "It was saved by imported resistant varieties",
          ],
          "It was replaced by tea after the disease arrived",
          "The disease was recorded in Ceylon in 1869, destroyed the island's coffee industry within twenty years, and is the reason Sri Lanka is now a tea producer.",
          "Sri Lanka became a tea producer instead.",
        ),
        mcq(
          "Why did the 2012 epidemic hit growers particularly hard financially?",
          [
            "It followed a fall in the price of coffee",
            "Fungicide had become unavailable",
            "Labour costs had risen sharply",
            "Insurance had been withdrawn from the region",
          ],
          "It followed a fall in the price of coffee",
          "The epidemic followed a collapse in the coffee price, which meant that the year in which growers most needed to spend on fertiliser, pruning and fungicide was the year in which they had least money to spend.",
          "It followed 'a collapse in the coffee price'.",
        ),
        mcq(
          "Where does most existing resistance come from?",
          [
            "A single hybrid found in Timor",
            "Wild Ethiopian populations",
            "A species grown only for decaffeinated coffee",
            "Repeated crossing of arabica varieties",
          ],
          "A single hybrid found in Timor",
          "Most of the resistance available derives from a single spontaneous hybrid between arabica and the robusta species, found in Timor in the 1920s, which has been bred into a series of cultivars now grown widely.",
          "It derives from the Timor hybrid.",
        ),
        mcq(
          "What obstacle does Nakata identify besides the time breeding takes?",
          [
            "The wild populations are themselves under threat",
            "Other species cannot be grown commercially",
            "Resistance genes cannot be transferred",
            "Buyers will not accept new varieties",
          ],
          "The wild populations are themselves under threat",
          "The obstacles are that breeding a tree crop is a decades-long undertaking, that the wild populations are themselves threatened by forest clearance and by a warming climate, and that the countries holding the diversity have understandable views about who should benefit from it.",
          "They are 'threatened by forest clearance and by a warming climate'.",
        ),
      ],
    },
    {
      key: "t59-p3-randomised-trials",
      title: "What a Trial Can and Cannot Settle",
      topic: "the reach and the limits of randomised evaluation in economics",
      difficulty: 8,
      body: `A) The randomised controlled trial arrived in development economics in the late 1990s and changed what the field argued about. Before it, a claim that a programme worked rested on comparisons between places that had adopted it and places that had not, and those places differed in a hundred ways besides the programme. Randomly assigning the intervention removes that problem at a stroke: if the two groups were formed by a lottery, then on average they differ only in the thing being tested, and a difference in outcome can be attributed to it.

B) The results have been substantial and frequently surprising. Charging even a very small price for a preventive health product — a bed net, a water treatment — was found to reduce uptake dramatically without improving the rate at which those who paid actually used it, which overturned a widely held view. Deworming children was found to raise school attendance at a cost per additional day far below that of any conventional education intervention. Microcredit, which had been promoted for two decades as transformative, was found in six trials across four continents to produce modest changes in business investment and essentially no measurable effect on income, health or schooling.

C) That last finding is the method working exactly as intended: an enormous, confident, well-funded consensus was tested and did not survive. It is also the source of the first serious objection, which is that the trials measured what could be measured over the horizon a trial can afford, and that the case for microcredit had never really been about three-year income effects. That objection is sometimes fair and sometimes a retreat; the difficulty is that it is stated the same way in both cases, and usually only after the result is known.

D) The technical objection is about generalisation, and it is the one practitioners find hardest. A trial establishes what happened in the places and among the people it enrolled. Whether the same intervention produces the same result elsewhere depends on whether the mechanism that made it work is present elsewhere, and a trial by itself says nothing about the mechanism. A teacher-incentive scheme that raised test scores in one Indian state failed when run in another, for reasons that were traced afterwards to differences in how head teachers were monitored — a factor nobody had thought to record, because the trial had not been designed to identify why the scheme worked.

E) A second limit is one of scope. Randomisation requires that somebody could plausibly assign the treatment, which confines the method to interventions operating at the level of an individual, a household, a school or a village. The largest questions in development are not of that kind. Nobody can randomly assign an exchange-rate regime, a land reform, an industrial policy or a constitution, and the questions of why some countries grew rich while others did not remain exactly where they were before the method arrived.

F) There is also a quieter effect on what gets studied. A method that answers small questions well tends, over time, to shift a field's attention towards small questions, not because anyone decided that they matter more but because they are the ones that produce publishable answers. A generation of development research has concentrated on what can be evaluated in eighteen months on a modest budget, and the choice of subject has been made, in part, by the instrument. Every method does this to the field that adopts it, and the effect is easiest to see from outside and hardest to correct from within.

G) None of this is an argument against the method, and I want to be clear about that, because the criticisms are often deployed by people who would prefer their favourite programme not to be tested at all. The trial has settled questions that argument had failed to settle for decades, and a field that can say "we tried it and it did not work" is in far better condition than one that cannot. The honest position is that it is one instrument among several, that its results travel only as far as the mechanism behind them, and that the discipline required to say what a particular result does not show is exactly the discipline the method itself taught everybody.`,
      questions: [
        fromList(
          "matching_information",
          TRIAL_PARAGRAPHS,
          "an explanation of what randomisation removes from a comparison",
          "A",
          "Randomly assigning the intervention removes that problem at a stroke: if the two groups were formed by a lottery, then on average they differ only in the thing being tested, and a difference in outcome can be attributed to it.",
          "Paragraph A explains what randomisation does.",
        ),
        fromList(
          "matching_information",
          TRIAL_PARAGRAPHS,
          "a case in which the same scheme gave different results in two places",
          "D",
          "A teacher-incentive scheme that raised test scores in one Indian state failed when run in another, for reasons that were traced afterwards to differences in how head teachers were monitored — a factor nobody had thought to record, because the trial had not been designed to identify why the scheme worked.",
          "Paragraph D gives the teacher-incentive case.",
        ),
        fromList(
          "matching_information",
          TRIAL_PARAGRAPHS,
          "a concern about which subjects researchers choose to study",
          "F",
          "A method that answers small questions well tends, over time, to shift a field's attention towards small questions, not because anyone decided that they matter more but because they are the ones that produce publishable answers.",
          "Paragraph F raises the agenda-shaping concern.",
        ),
        fromList(
          "matching_information",
          TRIAL_PARAGRAPHS,
          "a warning about who tends to repeat these criticisms",
          "G",
          "None of this is an argument against the method, and I want to be clear about that, because the criticisms are often deployed by people who would prefer their favourite programme not to be tested at all.",
          "Paragraph G warns about the critics' motives.",
        ),
        fromList(
          "matching_information",
          TRIAL_PARAGRAPHS,
          "a finding that contradicted a long-standing assumption about lending",
          "B",
          "Microcredit, which had been promoted for two decades as transformative, was found in six trials across four continents to produce modest changes in business investment and essentially no measurable effect on income, health or schooling.",
          "Paragraph B reports the microcredit trials.",
        ),
        ynng(
          "The writer thinks the microcredit result shows the method working properly.",
          "YES",
          "That last finding is the method working exactly as intended: an enormous, confident, well-funded consensus was tested and did not survive.",
          "It is 'the method working exactly as intended'.",
        ),
        ynng(
          "The writer believes a trial can explain why an intervention worked.",
          "NO",
          "Whether the same intervention produces the same result elsewhere depends on whether the mechanism that made it work is present elsewhere, and a trial by itself says nothing about the mechanism.",
          "A trial 'says nothing about the mechanism'.",
        ),
        ynng(
          "The writer thinks the method has advanced the biggest questions in development.",
          "NO",
          "Nobody can randomly assign an exchange-rate regime, a land reform, an industrial policy or a constitution, and the questions of why some countries grew rich while others did not remain exactly where they were before the method arrived.",
          "Those questions 'remain exactly where they were'.",
        ),
        ynng(
          "The writer considers a field better off for being able to report failures.",
          "YES",
          'The trial has settled questions that argument had failed to settle for decades, and a field that can say "we tried it and it did not work" is in far better condition than one that cannot.',
          "Such a field is 'in far better condition'.",
        ),
        fromList(
          "matching_sentence_endings",
          TRIAL_ENDINGS,
          "A trial's conclusion is secure within its own sample,",
          "because the result holds for the population that was actually enrolled.",
          "A trial establishes what happened in the places and among the people it enrolled.",
          "It establishes what happened among those enrolled.",
        ),
        fromList(
          "matching_sentence_endings",
          TRIAL_ENDINGS,
          "The teacher-incentive scheme did not transfer,",
          "even though the intervention itself was identical in both places.",
          "A teacher-incentive scheme that raised test scores in one Indian state failed when run in another, for reasons that were traced afterwards to differences in how head teachers were monitored — a factor nobody had thought to record, because the trial had not been designed to identify why the scheme worked.",
          "The same scheme failed in the second state.",
        ),
        fromList(
          "matching_sentence_endings",
          TRIAL_ENDINGS,
          "The largest development questions stay out of reach,",
          "because nobody can be randomly assigned to a currency or a constitution.",
          "Nobody can randomly assign an exchange-rate regime, a land reform, an industrial policy or a constitution, and the questions of why some countries grew rich while others did not remain exactly where they were before the method arrived.",
          "Such things cannot be randomly assigned.",
        ),
        fromList(
          "matching_sentence_endings",
          TRIAL_ENDINGS,
          "Randomisation fits some problems and not others,",
          "which is why the method suits some questions far better than others.",
          "Randomisation requires that somebody could plausibly assign the treatment, which confines the method to interventions operating at the level of an individual, a household, a school or a village.",
          "It is confined to assignable interventions.",
        ),
        fromList(
          "matching_sentence_endings",
          TRIAL_ENDINGS,
          "The discipline of stating what a result does not prove is valuable,",
          "which the writer regards as the method's real contribution.",
          "The honest position is that it is one instrument among several, that its results travel only as far as the mechanism behind them, and that the discipline required to say what a particular result does not show is exactly the discipline the method itself taught everybody.",
          "That discipline is what the method taught.",
        ),
      ],
    },
  ],
};
