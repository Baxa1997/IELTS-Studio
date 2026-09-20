import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · soil science · notes box -----------------------------------

const SALT_NOTES = {
  title: "How irrigated land turns white",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · biological control · people and a word bank ---------------

const CONTROL_PEOPLE = ["Judith Ngata", "Alfredo Bianchi", "Kirsten Vogel", "Samuel Adeyemi"];
const CONTROL_BANK = [
  "generalist",
  "quarantine",
  "specificity",
  "predator",
  "native",
  "starvation",
  "release",
  "screening",
  "records",
];

// ---- Passage 3 · pest management · lettered paragraphs ---------------------

const STERILE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const STERILE_ENDINGS = [
  "because a female that mates with a sterilised male lays eggs that never hatch.",
  "which is why the method works best when the pest population is already low.",
  "since the released insects must outnumber the wild males many times over.",
  "because one sterile mating among ten dilutes rather than prevents.",
  "because the programme has to continue for as long as reinvasion is possible.",
  "since nothing is ever applied to the crop itself.",
  "which makes an island or a peninsula the ideal place to attempt it.",
];

export const TEST_102: CuratedTest = {
  key: "full-test-102",
  targetBand: 4,
  passages: [
    {
      key: "t102-p1-salinisation",
      title: "The Fields That Turned White",
      topic: "how watering a crop can make the ground unable to grow anything",
      difficulty: 4,
      body: `All water contains dissolved salts. Rain contains very few, river water contains some, and groundwater usually contains a good deal more, because it has been in contact with rock. When water is applied to a field and the crop uses it or the sun evaporates it, the water leaves and the salt stays. Irrigating land therefore adds salt to it continuously, and the only question is whether the salt is being carried away as fast as it arrives.

In a well-drained field it is. Some of the applied water passes down below the root zone, taking dissolved salt with it into the groundwater and eventually to a river or the sea. This is called leaching, and an irrigation scheme that does not allow for it is storing up a problem. The extra water required is not large — usually between ten and twenty per cent above what the crop needs — and it is the first thing sacrificed when water is short.

The failure mode is a rising water table. Irrigation adds far more water to a landscape than rainfall did, and if the ground below does not drain freely, the water table rises year by year. When it comes within a metre or two of the surface, capillary action begins to draw water upward between the soil particles, where it evaporates and leaves its salt at the surface. The visible result is a white crust, and the invisible result comes first: salt in the root zone at concentrations that prevent a plant from taking up water at all.

The effect on plants is not poisoning but thirst. Water moves into a root because the concentration of dissolved material inside the root is higher than outside it. Raise the concentration outside and the gradient weakens; raise it further and the flow reverses, and a plant standing in wet soil wilts and dies. Crops differ in tolerance — barley and date palms manage in conditions that kill beans and citrus — but every crop has a limit, and above it the land grows nothing that anybody wants.

The history is long and the pattern repeats. Salinisation is the most widely accepted explanation for the decline in wheat cultivation in southern Mesopotamia in the third millennium BC, where records show a shift to barley, which is more tolerant, followed by falling yields of that too. The Indus valley, parts of Peru, and the Aral Sea basin all show the same sequence, and so do large areas of the modern Punjab, the Murray-Darling basin in Australia and the San Joaquin valley in California. Something in the region of a fifth of the world's irrigated land is now affected to some degree, and irrigated land produces a disproportionate share of the world's food.

The remedies are known and expensive. Drainage is the fundamental one: install pipes or open ditches below the root zone to intercept the water and carry it away, which lowers the water table and allows leaching to work again. Applying extra water deliberately to wash the salt down works where drainage exists and makes matters worse where it does not. Switching to more tolerant crops buys time and accepts a lower value harvest, which is what the Mesopotamian farmers did and it delayed rather than prevented the outcome.

Drainage creates a problem of its own that is rarely faced honestly. The water removed from the field is saltier than the water that went in, and it has to go somewhere. Discharged into a river, it salinises the water for everyone downstream and passes the problem along. Held in an evaporation basin, it concentrates further and the basin becomes a hazard: one such scheme in California poisoned a wildlife refuge with selenium concentrated from the drainage water. Piped to the sea, it is the correct answer and is only available near a coast.

The uncomfortable summary is that irrigation in a closed basin is a process with an end. It can be managed, slowed, and made to last for centuries with sufficient drainage and discipline, and it cannot be made permanent by any means now known, because the salt has to leave the basin and in a closed basin there is nowhere for it to go.`,
      questions: [
        tfng(
          "Rainwater contains more dissolved salt than groundwater.",
          "FALSE",
          "Rain contains very few, river water contains some, and groundwater usually contains a good deal more, because it has been in contact with rock.",
          "Groundwater contains far more.",
        ),
        tfng(
          "Leaching requires more water than the crop itself needs.",
          "TRUE",
          "The extra water required is not large — usually between ten and twenty per cent above what the crop needs — and it is the first thing sacrificed when water is short.",
          "It needs ten to twenty per cent extra.",
        ),
        tfng(
          "The white crust appears before salt reaches the root zone.",
          "FALSE",
          "The visible result is a white crust, and the invisible result comes first: salt in the root zone at concentrations that prevent a plant from taking up water at all.",
          "The root-zone salt 'comes first'.",
        ),
        tfng(
          "Salt kills plants by poisoning their tissues.",
          "FALSE",
          "The effect on plants is not poisoning but thirst.",
          "It is 'not poisoning but thirst'.",
        ),
        tfng(
          "Barley tolerates salt better than beans do.",
          "TRUE",
          "Crops differ in tolerance — barley and date palms manage in conditions that kill beans and citrus — but every crop has a limit, and above it the land grows nothing that anybody wants.",
          "Barley manages where beans die.",
        ),
        tfng(
          "Adding extra water to wash salt away helps even without drainage.",
          "FALSE",
          "Applying extra water deliberately to wash the salt down works where drainage exists and makes matters worse where it does not.",
          "Without drainage it 'makes matters worse'.",
        ),
        tfng(
          "Egypt's Nile valley has been affected more severely than the Punjab.",
          "NOT GIVEN",
          "",
          "The passage lists several affected regions but makes no such comparison.",
        ),
        noteLine(
          SALT_NOTES,
          "Stage 1",
          "Irrigation adds more water than ______ ever did",
          "rainfall",
          "Irrigation adds far more water to a landscape than rainfall did, and if the ground below does not drain freely, the water table rises year by year.",
          "It exceeds what rainfall added.",
        ),
        noteLine(
          SALT_NOTES,
          "Stage 2",
          "The water table rises each ______ if the ground drains poorly",
          "year",
          "Irrigation adds far more water to a landscape than rainfall did, and if the ground below does not drain freely, the water table rises year by year.",
          "It rises year by year.",
        ),
        noteLine(
          SALT_NOTES,
          "Stage 3",
          "______ action draws water up, and it evaporates",
          "Capillary",
          "When it comes within a metre or two of the surface, capillary action begins to draw water upward between the soil particles, where it evaporates and leaves its salt at the surface.",
          "Capillary action lifts the water.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Mesopotamian records show a shift from wheat to ______.",
          "barley",
          "Salinisation is the most widely accepted explanation for the decline in wheat cultivation in southern Mesopotamia in the third millennium BC, where records show a shift to barley, which is more tolerant, followed by falling yields of that too.",
          "They shifted to barley.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Drainage water discharged into a river passes the problem ______.",
          "along",
          "Discharged into a river, it salinises the water for everyone downstream and passes the problem along.",
          "It 'passes the problem along'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "One Californian evaporation basin poisoned a refuge with ______.",
          "selenium",
          "Held in an evaporation basin, it concentrates further and the basin becomes a hazard: one such scheme in California poisoned a wildlife refuge with selenium concentrated from the drainage water.",
          "The contaminant was selenium.",
        ),
      ],
    },
    {
      key: "t102-p2-biological-control",
      title: "The Beetle That Was Meant to Be Eaten",
      topic:
        "importing one animal to deal with another, and the century it took to do it carefully",
      difficulty: 4,
      body: `Biological control is the practice of introducing a natural enemy to suppress a pest. It has produced some of the most complete successes in agriculture and some of the most notorious environmental accidents, and the difference between the two turns on a single question that took a long time to be asked properly. The question is not whether the introduced animal will eat the pest. It is what else the animal will eat when the pest becomes scarce.

The first great success set the pattern and the expectations. In the 1880s the Californian citrus industry was being destroyed by a scale insect, and an entomologist sent to Australia, where the insect came from, returned with a ladybird beetle that fed on it. Within two years the pest was under control across the state, and it has remained so ever since at essentially no cost. Judith Ngata, a historian of applied entomology, notes that this single case created an expectation of cheap permanent solutions that shaped the field for fifty years and encouraged a great many introductions made on much weaker evidence.

The failures came from the same logic applied to the wrong kind of animal. Alfredo Bianchi, an ecologist, explains the crucial distinction. An enemy that feeds on one species and cannot survive without it will track that species' numbers and nothing else; an enemy that eats many things will eat whatever is convenient, which after a while is unlikely to be the pest. He is blunt that most of the well-known disasters involved deliberately introducing a generalist, and that the ecological reasoning to predict the outcome was available at the time and was not applied.

The case everyone cites is a toad brought to Australia in 1935 to control beetles in sugar cane. It ate very few of them, being unable to climb the canes where the beetles lived, and it spread across the continent eating almost anything else, poisoning the native predators that tried to eat it. Kirsten Vogel, who studies invasion history, points out a detail that is usually left out: the toad had already been introduced to several other countries with poor results, and those results were documented and available before the Australian release. She treats the episode as a failure of literature searching rather than of science.

The response has been a regime of testing. Samuel Adeyemi, who assesses applications to release control agents, describes the modern process: a candidate is held in quarantine, offered every related native species in turn to see whether it will feed on them, tested for its ability to complete its life cycle on each, and screened for its own parasites, before any release is considered. He notes that this takes years, costs a great deal, rejects the majority of candidates, and has produced a record with very few accidents since it was adopted, and that the cost falls on the applicant while the benefit of the caution falls on everybody.

Modern successes are correspondingly quiet, and they are numerous. A wasp a few millimetres long that parasitises a mealybug saved the cassava crop of much of Africa in the 1980s, in a programme that cost a fraction of the value of one season's harvest and is almost unknown outside the field. A weevil that eats only water hyacinth has cleared waterways on three continents, in each case after the plant had defeated mechanical clearance and herbicide. These are specialists, they were tested, and they work, and none of them is famous, because a pest that has quietly stopped being a problem generates no coverage at all.

Two problems remain unsolved. The first is that specificity can change: a host-specific insect may adapt to a related plant over decades, and a release cannot be recalled. The second is that climate change moves the ground under every assessment, since an agent screened against the native species of a region is being screened against the species present now. Neither is a reason to abandon the method, which remains the only permanent form of pest control there is. Both are reasons why the paperwork takes years, and both are arguments for doing the assessment again periodically rather than treating a past approval as permanent.`,
      questions: [
        fromList(
          "matching_features",
          CONTROL_PEOPLE,
          "One early triumph raised expectations that shaped decades of practice.",
          "Judith Ngata",
          "Judith Ngata, a historian of applied entomology, notes that this single case created an expectation of cheap permanent solutions that shaped the field for fifty years and encouraged a great many introductions made on much weaker evidence.",
          "Ngata describes the expectation it created.",
        ),
        fromList(
          "matching_features",
          CONTROL_PEOPLE,
          "The disasters involved animals that eat many things.",
          "Alfredo Bianchi",
          "He is blunt that most of the well-known disasters involved deliberately introducing a generalist, and that the ecological reasoning to predict the outcome was available at the time and was not applied.",
          "Bianchi blames generalist introductions.",
        ),
        fromList(
          "matching_features",
          CONTROL_PEOPLE,
          "The relevant evidence had already been published before the release.",
          "Kirsten Vogel",
          "She treats the episode as a failure of literature searching rather than of science.",
          "Vogel calls it a literature failure.",
        ),
        fromList(
          "matching_features",
          CONTROL_PEOPLE,
          "The applicant bears the cost of a caution that benefits everyone.",
          "Samuel Adeyemi",
          "He notes that this takes years, costs a great deal, rejects the majority of candidates, and has produced a record with very few accidents since it was adopted, and that the cost falls on the applicant while the benefit of the caution falls on everybody.",
          "Adeyemi notes the split of cost and benefit.",
        ),
        fromList(
          "summary_completion",
          CONTROL_BANK,
          "A ______ enemy eats whatever is convenient rather than the pest.",
          "generalist",
          "An enemy that feeds on one species and cannot survive without it will track that species' numbers and nothing else; an enemy that eats many things will eat whatever is convenient, which after a while is unlikely to be the pest.",
          "The generalist eats what is convenient.",
        ),
        fromList(
          "summary_completion",
          CONTROL_BANK,
          "A candidate is now held in ______ before anything is decided.",
          "quarantine",
          "Samuel Adeyemi, who assesses applications to release control agents, describes the modern process: a candidate is held in quarantine, offered every related native species in turn to see whether it will feed on them, tested for its ability to complete its life cycle on each, and screened for its own parasites, before any release is considered.",
          "It is held in quarantine.",
        ),
        fromList(
          "summary_completion",
          CONTROL_BANK,
          "It is offered every related ______ species in turn.",
          "native",
          "Samuel Adeyemi, who assesses applications to release control agents, describes the modern process: a candidate is held in quarantine, offered every related native species in turn to see whether it will feed on them, tested for its ability to complete its life cycle on each, and screened for its own parasites, before any release is considered.",
          "Related native species are offered.",
        ),
        fromList(
          "summary_completion",
          CONTROL_BANK,
          "A ______ cannot be recalled once it has been made.",
          "release",
          "The first is that specificity can change: a host-specific insect may adapt to a related plant over decades, and a release cannot be recalled.",
          "A release cannot be recalled.",
        ),
        fromList(
          "summary_completion",
          CONTROL_BANK,
          "An agent's ______ may weaken over decades as it adapts.",
          "specificity",
          "The first is that specificity can change: a host-specific insect may adapt to a related plant over decades, and a release cannot be recalled.",
          "Specificity can change.",
        ),
        mcq(
          "Why did the ladybird programme succeed?",
          [
            "The beetle fed on the pest that was destroying the crop",
            "The pest had no other food available",
            "Californian citrus was resistant to the pest",
            "The beetle was bred in quarantine first",
          ],
          "The beetle fed on the pest that was destroying the crop",
          "In the 1880s the Californian citrus industry was being destroyed by a scale insect, and an entomologist sent to Australia, where the insect came from, returned with a ladybird beetle that fed on it.",
          "The beetle fed on the scale insect.",
        ),
        mcq(
          "Why did the toad fail to control the beetles?",
          [
            "It could not climb to where they lived",
            "It preferred native insects",
            "The beetles were already in decline",
            "It did not survive the climate",
          ],
          "It could not climb to where they lived",
          "It ate very few of them, being unable to climb the canes where the beetles lived, and it spread across the continent eating almost anything else, poisoning the native predators that tried to eat it.",
          "It could not climb the canes.",
        ),
        mcq(
          "What does the writer say about the cassava programme?",
          [
            "It cost far less than one season's harvest was worth",
            "It required repeated releases each year",
            "It is the best-known case in the field",
            "It used a generalist predator",
          ],
          "It cost far less than one season's harvest was worth",
          "A wasp a few millimetres long that parasitises a mealybug saved the cassava crop of much of Africa in the 1980s, in a programme that cost a fraction of the value of one season's harvest and is almost unknown outside the field.",
          "It cost a fraction of one harvest.",
        ),
        mcq(
          "Why does climate change complicate the assessment?",
          [
            "Screening is against the species present now",
            "Agents cannot survive warmer conditions",
            "Quarantine facilities cannot be cooled",
            "Pests become resistant more quickly",
          ],
          "Screening is against the species present now",
          "The second is that climate change moves the ground under every assessment, since an agent screened against the native species of a region is being screened against the species present now.",
          "The screening reflects only the present species.",
        ),
      ],
    },
    {
      key: "t102-p3-sterile-insects",
      title: "Releasing Insects That Cannot Breed",
      topic: "a control method that works by flooding a population with failure",
      difficulty: 5,
      body: `A) Most methods of controlling an insect pest work by killing it, and all of them share a difficulty: the survivors breed, and the survivors are disproportionately the individuals least affected by whatever was used. The sterile insect technique works differently. Large numbers of the pest are reared in a factory, sterilised, and released to compete for mates with the wild population. A wild female that mates with a sterile male lays eggs that do not hatch. The method does not kill anything. It wastes the reproductive effort of the population until the population ends, which is a slower mechanism than poison and a far more thorough one.

B) The idea was worked out in the 1930s and 1950s and first applied at scale against the screwworm, a fly whose larvae feed on the living flesh of cattle and which cost North American ranching enormous sums. Flies were reared in a factory in Mexico at a rate of hundreds of millions a week, sterilised with gamma radiation, and dropped from aircraft in a moving front. The pest was eliminated from the United States, then Mexico, then Central America, and is now held at a barrier in Panama by continuous release. It is the largest successful eradication of an animal pest ever achieved, and the cattle industry of two continents has been calculating the annual saving ever since.

C) The mathematics explain both the strength and the requirements. If sterile males outnumber wild males nine to one, nine out of ten matings produce nothing, and the next generation is a tenth of what it would have been. Repeat this and the wild population collapses towards zero, and — crucially — as it collapses the ratio improves, because the number released stays constant while the number of wild competitors falls. The method therefore accelerates as it succeeds, which is the reverse of a pesticide, whose effect weakens as resistance spreads.

D) The same arithmetic sets the conditions. A very large population needs an impossibly large factory to achieve the ratio, so the technique is nearly always used after something else has reduced the pest, or in a season when numbers are naturally low. The released insects must be healthy enough to compete, which is a real constraint because rearing and irradiation both damage them, and a sterile male that cannot find or court a female is worthless. And reinvasion must be prevented, which is why islands, peninsulas and valleys are the classic sites, and why the Panama barrier has to be maintained indefinitely.

E) The method also depends on the biology of mating in the target species. It works where a female mates once, or a few times, so that a single unproductive mating wastes most of her output. It works poorly where a female mates many times with many males, since one sterile mating among ten dilutes rather than prevents. It also requires that only one sex is released where possible: releasing sterile females of a biting or egg-laying pest means releasing the very insects that do the damage, so programmes against mosquitoes have had to develop methods of separating males from females at scale, which for a long time was the limiting technical problem.

F) The advantages over spraying are substantial and worth stating plainly. No chemical is applied to the crop, so there is no residue and no harm to other insects. Nothing in the method can select for resistance, because a sterile mating cannot be survived and inherited. The agent finds the pest rather than the other way round, so it reaches insects in places a spray cannot. And it is species-specific by construction, since the released insects are the pest itself.

G) The costs are the factory and the permanence. Rearing hundreds of millions of insects a week is an industrial operation with an industrial budget, and the release cannot stop while reinvasion remains possible, so a programme that has achieved eradication converts into a programme that maintains a barrier forever. That is an uncomfortable thing to put in a budget: a line item that pays for the absence of something, that will be questioned by every future finance minister, and whose success is the reason nobody remembers why it exists.`,
      questions: [
        fromList(
          "matching_information",
          STERILE_PARAGRAPHS,
          "why the technique gets more effective as it works",
          "C",
          "Repeat this and the wild population collapses towards zero, and — crucially — as it collapses the ratio improves, because the number released stays constant while the number of wild competitors falls.",
          "Paragraph C explains the improving ratio.",
        ),
        fromList(
          "matching_information",
          STERILE_PARAGRAPHS,
          "a technical problem specific to biting pests",
          "E",
          "It also requires that only one sex is released where possible: releasing sterile females of a biting or egg-laying pest means releasing the very insects that do the damage, so programmes against mosquitoes have had to develop methods of separating males from females at scale, which for a long time was the limiting technical problem.",
          "Paragraph E describes the sex separation problem.",
        ),
        fromList(
          "matching_information",
          STERILE_PARAGRAPHS,
          "a budget commitment that continues after success",
          "G",
          "Rearing hundreds of millions of insects a week is an industrial operation with an industrial budget, and the release cannot stop while reinvasion remains possible, so a programme that has achieved eradication converts into a programme that maintains a barrier forever.",
          "Paragraph G describes the permanent commitment.",
        ),
        fromList(
          "matching_information",
          STERILE_PARAGRAPHS,
          "an eradication achieved across several countries",
          "B",
          "The pest was eliminated from the United States, then Mexico, then Central America, and is now held at a barrier in Panama by continuous release.",
          "Paragraph B lists the countries cleared.",
        ),
        fromList(
          "matching_information",
          STERILE_PARAGRAPHS,
          "why survivors are the problem with conventional control",
          "A",
          "Most methods of controlling an insect pest work by killing it, and all of them share a difficulty: the survivors breed, and the survivors are disproportionately the individuals least affected by whatever was used.",
          "Paragraph A explains the survivor problem.",
        ),
        ynng(
          "The writer thinks the method's advantages over spraying are significant.",
          "YES",
          "The advantages over spraying are substantial and worth stating plainly.",
          "They are 'substantial and worth stating plainly'.",
        ),
        ynng(
          "The writer believes resistance to the method could develop over time.",
          "NO",
          "Nothing in the method can select for resistance, because a sterile mating cannot be survived and inherited.",
          "Nothing can select for resistance.",
        ),
        ynng(
          "The writer regards the permanent funding requirement as politically awkward.",
          "YES",
          "That is an uncomfortable thing to put in a budget: a line item that pays for the absence of something, that will be questioned by every future finance minister, and whose success is the reason nobody remembers why it exists.",
          "It is 'an uncomfortable thing to put in a budget'.",
        ),
        ynng(
          "The writer thinks the technique suits a pest at its peak abundance.",
          "NO",
          "A very large population needs an impossibly large factory to achieve the ratio, so the technique is nearly always used after something else has reduced the pest, or in a season when numbers are naturally low.",
          "It is used when numbers are low.",
        ),
        fromList(
          "matching_sentence_endings",
          STERILE_ENDINGS,
          "The population declines without anything being killed,",
          "because a female that mates with a sterilised male lays eggs that never hatch.",
          "A wild female that mates with a sterile male lays eggs that do not hatch.",
          "The eggs do not hatch.",
        ),
        fromList(
          "matching_sentence_endings",
          STERILE_ENDINGS,
          "An enormous factory is required at the start,",
          "since the released insects must outnumber the wild males many times over.",
          "If sterile males outnumber wild males nine to one, nine out of ten matings produce nothing, and the next generation is a tenth of what it would have been.",
          "The ratio has to be heavily in favour of the release.",
        ),
        fromList(
          "matching_sentence_endings",
          STERILE_ENDINGS,
          "Something else usually has to reduce the pest first,",
          "which is why the method works best when the pest population is already low.",
          "A very large population needs an impossibly large factory to achieve the ratio, so the technique is nearly always used after something else has reduced the pest, or in a season when numbers are naturally low.",
          "A low starting population is needed.",
        ),
        fromList(
          "matching_sentence_endings",
          STERILE_ENDINGS,
          "The method suits a species whose female mates once,",
          "because one sterile mating among ten dilutes rather than prevents.",
          "It works poorly where a female mates many times with many males, since one sterile mating among ten dilutes rather than prevents.",
          "Repeated mating dilutes the sterile one.",
        ),
        fromList(
          "matching_sentence_endings",
          STERILE_ENDINGS,
          "There is no residue and no harm to other insects,",
          "since nothing is ever applied to the crop itself.",
          "No chemical is applied to the crop, so there is no residue and no harm to other insects.",
          "No chemical touches the crop.",
        ),
      ],
    },
  ],
};
