import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · agriculture · flow-chart ----------------------------------

const CURING_STEPS = {
  title: "Curing a green vanilla pod",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · marine ecology · people and a word bank -------------------

const OTTER_PEOPLE = ["Marcus Oyelaran", "Fenna de Wit", "Grace Tiwari", "Hollis Bergman"];
const OTTER_BANK = [
  "holdfast",
  "canopy",
  "barren",
  "spore",
  "fur",
  "metabolism",
  "carbon",
  "urchins",
  "crevices",
];

// ---- Passage 3 · transport policy · lettered paragraphs --------------------

const ROAD_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ROAD_ENDINGS = [
  "because a driver does not experience the delay they impose on others.",
  "although the effects at the boundary are small and do not last.",
  "which is why journey times improve more than the traffic figures do.",
  "since many of those shoppers had never been arriving by car at all.",
  "because an electric vehicle takes up as much road space as any other.",
  "which the writer thinks should have been the argument from the beginning.",
  "even though opposition is always highest before a scheme begins.",
];

export const TEST_68: CuratedTest = {
  key: "full-test-68",
  targetBand: 6,
  passages: [
    {
      key: "t68-p1-vanilla",
      title: "The Orchid That Cannot Pollinate Itself",
      topic: "why the world's second most expensive spice is still pollinated by hand",
      difficulty: 5,
      body: `Vanilla comes from the seed pod of an orchid, and it is the second most expensive spice in the world. The reason is not that the plant is rare or that the climate it needs is unusual. It is that almost every vanilla flower grown commercially has to be pollinated by a person, by hand, on the single morning it is open.

The plant is a climbing orchid native to the forests of Mexico and Central America. Like most orchids it produces a large and complicated flower, and in its own forest it is pollinated by insects that evolved alongside it. When Europeans took the plant to other tropical regions in the early nineteenth century, it grew perfectly well. It flowered, it climbed, it looked healthy, and it produced no pods at all, because the insects had been left behind.

The flower's structure explains the difficulty. The male and female parts sit close together, but a thin flap of tissue called the rostellum lies between them and prevents the pollen from reaching the stigma on its own. In the wild an insect of the right size pushes past the flap while feeding. Without that insect, nothing happens. The plant is not sterile; it is simply unable to complete the act without help.

The solution was found in 1841 by Edmond Albius, a twelve-year-old enslaved boy on the island of Réunion in the Indian Ocean. He showed that the flap could be lifted with a thin splinter of bamboo and the pollen pressed directly onto the stigma with a thumb. The whole operation takes a few seconds once it has been learned. It is still done in exactly that way today, and no machine has replaced it.

The timing is the hard part. A vanilla flower opens for less than a day, and in most conditions it will accept pollen only in the morning. A worker walks the rows every day through a flowering season of about two months, finds the flowers that have opened that morning and pollinates each one by hand. A skilled worker can manage perhaps a thousand flowers in a day. Miss a flower and the pod is lost; the flower does not reopen.

What follows is equally slow. A pollinated flower takes eight or nine months to grow into a green pod, and the pod contains no flavour when it is picked. Green vanilla smells of almost nothing. The flavour is produced by curing, a process of several months in which the pods are briefly plunged into hot water to stop them growing, then sweated under cloth, dried in the sun by day and wrapped by night, and finally left in closed boxes to develop. The chemical that gives the spice its smell forms during this treatment and not on the plant.

The whole sequence takes close to two years from flower to saleable pod, and that is what makes the market so unstable. A grower who decides to plant more vanilla because the price is high will not sell anything for several years, by which time the price may have collapsed; a cyclone in one region can remove a large share of world supply overnight. Prices have swung by a factor of ten within a decade more than once. Because the crop is grown mostly on very small farms, that volatility falls on households with no way of absorbing it, and pods are frequently harvested early or stolen from the vines, which lowers the quality of everything on the market.

Most of what is sold as vanilla flavour has never been near the plant. The main flavour compound can be made industrially from wood pulp by-products or from petrochemicals for a tiny fraction of the cost, and the great majority of vanilla flavouring used in food is made this way. It is chemically the same compound. What it lacks is the several hundred other substances the curing process creates, which is why a cured pod tastes more complicated than the pure compound does.

There have been many attempts to remove the hand work. Some growers have tried introducing a pollinating insect, which has generally failed because the insects do not establish or do not prefer the crop. Breeding a variety that pollinates itself would solve the problem in principle, but the plant is propagated from cuttings rather than seed and is consequently almost genetically uniform, which leaves very little variation to select from. Producing the compound by fermentation, using yeast or bacteria, is now commercially possible and is the most likely eventual route, although it produces the flavouring rather than the spice.

For the moment the most valuable agricultural product per hectare in several countries depends on a technique invented by a child, performed with a splinter of bamboo, at a rate of one flower at a time.`,
      questions: [
        tfng(
          "Vanilla is the most expensive spice in the world.",
          "FALSE",
          "Vanilla comes from the seed pod of an orchid, and it is the second most expensive spice in the world.",
          "It is 'the second most expensive'.",
        ),
        tfng(
          "The plant grew well in its new regions but bore no pods.",
          "TRUE",
          "It flowered, it climbed, it looked healthy, and it produced no pods at all, because the insects had been left behind.",
          "It looked healthy and 'produced no pods at all'.",
        ),
        tfng(
          "A flap of tissue stops the pollen reaching the stigma unaided.",
          "TRUE",
          "The male and female parts sit close together, but a thin flap of tissue called the rostellum lies between them and prevents the pollen from reaching the stigma on its own.",
          "The rostellum prevents it.",
        ),
        tfng(
          "Albius's method has since been replaced by machinery.",
          "FALSE",
          "It is still done in exactly that way today, and no machine has replaced it.",
          "'No machine has replaced it'.",
        ),
        tfng(
          "Workers are paid according to how many flowers they pollinate.",
          "NOT GIVEN",
          "",
          "The passage says nothing about how the work is paid.",
        ),
        tfng(
          "A green pod has very little smell when it is harvested.",
          "TRUE",
          "Green vanilla smells of almost nothing.",
          "It 'smells of almost nothing'.",
        ),
        tfng(
          "Vanilla is grown mainly on large plantations.",
          "FALSE",
          "Because the crop is grown mostly on very small farms, that volatility falls on households with no way of absorbing it, and pods are frequently harvested early or stolen from the vines, which lowers the quality of everything on the market.",
          "It is grown 'mostly on very small farms'.",
        ),
        noteLine(
          CURING_STEPS,
          null,
          "Plunge briefly into hot ______ to stop growth",
          "water",
          "The flavour is produced by curing, a process of several months in which the pods are briefly plunged into hot water to stop them growing, then sweated under cloth, dried in the sun by day and wrapped by night, and finally left in closed boxes to develop.",
          "They are plunged into hot water.",
        ),
        noteLine(
          CURING_STEPS,
          null,
          "Sweat the pods beneath ______",
          "cloth",
          "The flavour is produced by curing, a process of several months in which the pods are briefly plunged into hot water to stop them growing, then sweated under cloth, dried in the sun by day and wrapped by night, and finally left in closed boxes to develop.",
          "They are 'sweated under cloth'.",
        ),
        noteLine(
          CURING_STEPS,
          null,
          "Leave in closed ______ to develop the smell",
          "boxes",
          "The flavour is produced by curing, a process of several months in which the pods are briefly plunged into hot water to stop them growing, then sweated under cloth, dried in the sun by day and wrapped by night, and finally left in closed boxes to develop.",
          "They are 'left in closed boxes'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The flap is lifted with a thin splinter of ______.",
          "bamboo",
          "He showed that the flap could be lifted with a thin splinter of bamboo and the pollen pressed directly onto the stigma with a thumb.",
          "A splinter of bamboo is used.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A pollinated flower needs eight or nine ______ to become a pod.",
          "months",
          "A pollinated flower takes eight or nine months to grow into a green pod, and the pod contains no flavour when it is picked.",
          "It takes 'eight or nine months'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The plant is grown from ______ rather than from seed.",
          "cuttings",
          "Breeding a variety that pollinates itself would solve the problem in principle, but the plant is propagated from cuttings rather than seed and is consequently almost genetically uniform, which leaves very little variation to select from.",
          "It is 'propagated from cuttings'.",
        ),
      ],
    },
    {
      key: "t68-p2-otters-and-kelp",
      title: "The Forest That Depends on a Predator",
      topic: "how an animal that does not eat kelp decides whether kelp forests exist",
      difficulty: 6,
      body: `A kelp forest is not a metaphor. Giant kelp grows from the sea floor to the surface at up to half a metre a day, forms a canopy that other species live beneath, and supports a community comparable in complexity to a forest on land. Along the Pacific coast of North America these forests have disappeared and returned repeatedly over the past two centuries, and the cause has usually been an animal that does not eat kelp at all.

Sea otters eat sea urchins. Urchins eat kelp, and specifically they eat the holdfast, the structure that anchors the plant to the rock, so an urchin does not merely graze a kelp plant but removes it. Where otters are present, urchins are few and hide in crevices, and the kelp grows. Where otters are absent, urchins cover the rock in dense aggregations and eat the forest down to bare stone. The resulting landscape is called an urchin barren, and it can persist for decades.

The relationship was worked out largely by comparing islands. Marcus Oyelaran, who has surveyed sites along the Aleutian chain, points out that the comparison was possible only because the fur trade had done the experiment already: otters were hunted to local extinction across most of their range by the early twentieth century, but a few small populations survived, so by the 1970s there were islands with otters and islands without, otherwise alike. The difference in the sea floor between them was not subtle.

A barren is stable for a reason that is not obvious. Fenna de Wit, who studies the transition, explains that urchins in a barren are starving and yet persist: with almost nothing to eat they shrink their gonads, reduce their metabolism and survive for years in a state in which they consume any kelp spore that settles. A barren therefore prevents its own recovery. Simply returning otters to a long-established barren does not restore the forest quickly, because the otters ignore starved urchins, which contain almost nothing worth eating.

Otters are able to control urchins because of how much they eat. Lacking the blubber that other marine mammals rely on, they keep warm with dense fur and an extremely high metabolic rate, and an adult consumes roughly a quarter of its body weight every day. Grace Tiwari, who has measured foraging in recovering populations, notes that this appetite is what makes the species effective and also what makes it vulnerable: an otter cannot fast, so anything that interrupts feeding for more than a day or so is fatal, and a population holds no reserve against a bad season.

The recovery has been uneven, and in the western Aleutians it reversed. Otter numbers there fell sharply in the 1990s, and the best-supported explanation is predation by killer whales that had turned to smaller prey. Hollis Bergman, who has modelled the energetics, argues that the numbers are consistent: a killer whale needs a great many otters to make a living, so even a few individuals switching prey can remove a population, and the effect appears at the top of the chain rather than the bottom. The argument remains contested, and alternative explanations involving disease and contaminants have their supporters.

There is a second consequence that has attracted attention for a different reason. Kelp takes up carbon as it grows, and a forest of it holds a substantial quantity in living tissue; some fraction of that sinks into deep water when the plants break up. A well-known calculation estimated that otter-driven kelp recovery across the North Pacific could represent tens of millions of tonnes of carbon. The figure has been criticised as too confident, chiefly because how much kelp carbon ends up stored rather than recycled near the surface is poorly known, and because the calculation treats the entire coastline as if it behaved like the best-studied sites.

What the system illustrates is a pattern ecologists call a trophic cascade: the abundance of a plant is set by a predator two steps above it. The pattern has been reported in wolves and vegetation, in fish and algae, and in insects and crops, and it is easy to over-apply. In the otter case the evidence is unusually good because the predator was removed and returned over a long period and the vegetation responded both times, which is closer to an experiment than field ecology usually manages.

The practical lesson is awkward for conservation. A forest was lost by hunting an animal for its fur, at a distance of two steps in the food web that nobody at the time could have traced, and it has not been recovered by protecting the kelp. It was recovered, where it has been recovered at all, by protecting the otter.`,
      questions: [
        fromList(
          "matching_features",
          OTTER_PEOPLE,
          "The comparison was only possible because hunting had created both conditions.",
          "Marcus Oyelaran",
          "Marcus Oyelaran, who has surveyed sites along the Aleutian chain, points out that the comparison was possible only because the fur trade had done the experiment already: otters were hunted to local extinction across most of their range by the early twentieth century, but a few small populations survived, so by the 1970s there were islands with otters and islands without, otherwise alike.",
          "Oyelaran explains the natural experiment.",
        ),
        fromList(
          "matching_features",
          OTTER_PEOPLE,
          "Starving grazers survive for years and prevent any regrowth.",
          "Fenna de Wit",
          "Fenna de Wit, who studies the transition, explains that urchins in a barren are starving and yet persist: with almost nothing to eat they shrink their gonads, reduce their metabolism and survive for years in a state in which they consume any kelp spore that settles.",
          "De Wit explains why a barren lasts.",
        ),
        fromList(
          "matching_features",
          OTTER_PEOPLE,
          "The trait that makes the predator effective leaves it no margin.",
          "Grace Tiwari",
          "Grace Tiwari, who has measured foraging in recovering populations, notes that this appetite is what makes the species effective and also what makes it vulnerable: an otter cannot fast, so anything that interrupts feeding for more than a day or so is fatal, and a population holds no reserve against a bad season.",
          "Tiwari links the appetite to the vulnerability.",
        ),
        fromList(
          "matching_features",
          OTTER_PEOPLE,
          "A few predators changing prey would be enough to explain the decline.",
          "Hollis Bergman",
          "Hollis Bergman, who has modelled the energetics, argues that the numbers are consistent: a killer whale needs a great many otters to make a living, so even a few individuals switching prey can remove a population, and the effect appears at the top of the chain rather than the bottom.",
          "Bergman's energetics make the numbers work.",
        ),
        fromList(
          "summary_completion",
          OTTER_BANK,
          "Giant kelp forms a ______ that shelters other species.",
          "canopy",
          "Giant kelp grows from the sea floor to the surface at up to half a metre a day, forms a canopy that other species live beneath, and supports a community comparable in complexity to a forest on land.",
          "It forms a canopy.",
        ),
        fromList(
          "summary_completion",
          OTTER_BANK,
          "Urchins destroy a plant by eating its ______.",
          "holdfast",
          "Urchins eat kelp, and specifically they eat the holdfast, the structure that anchors the plant to the rock, so an urchin does not merely graze a kelp plant but removes it.",
          "They eat the holdfast.",
        ),
        fromList(
          "summary_completion",
          OTTER_BANK,
          "Where otters hunt, the urchins stay hidden in ______.",
          "crevices",
          "Where otters are present, urchins are few and hide in crevices, and the kelp grows.",
          "They 'hide in crevices'.",
        ),
        fromList(
          "summary_completion",
          OTTER_BANK,
          "Rock grazed down to bare stone is called an urchin ______.",
          "barren",
          "The resulting landscape is called an urchin barren, and it can persist for decades.",
          "It is 'an urchin barren'.",
        ),
        fromList(
          "summary_completion",
          OTTER_BANK,
          "Starved urchins eat every kelp ______ that settles on the rock.",
          "spore",
          "Fenna de Wit, who studies the transition, explains that urchins in a barren are starving and yet persist: with almost nothing to eat they shrink their gonads, reduce their metabolism and survive for years in a state in which they consume any kelp spore that settles.",
          "They eat 'any kelp spore that settles'.",
        ),
        mcq(
          "Why does returning otters to an old barren not restore the forest quickly?",
          [
            "Starved urchins are not worth eating",
            "Otters avoid rocky coastlines",
            "Kelp spores no longer reach the site",
            "The urchins move into deeper water",
          ],
          "Starved urchins are not worth eating",
          "Simply returning otters to a long-established barren does not restore the forest quickly, because the otters ignore starved urchins, which contain almost nothing worth eating.",
          "They 'contain almost nothing worth eating'.",
        ),
        mcq(
          "How does an otter keep warm?",
          [
            "With dense fur and a very high metabolic rate",
            "With a thick layer of blubber",
            "By limiting its activity in cold water",
            "By feeding only in shallow water",
          ],
          "With dense fur and a very high metabolic rate",
          "Lacking the blubber that other marine mammals rely on, they keep warm with dense fur and an extremely high metabolic rate, and an adult consumes roughly a quarter of its body weight every day.",
          "Fur and metabolic rate replace blubber.",
        ),
        mcq(
          "Why has the carbon calculation been criticised?",
          [
            "How much kelp carbon is stored is poorly known",
            "Kelp does not take up carbon as it grows",
            "Otters played no part in the recovery",
            "The coastline has never been surveyed",
          ],
          "How much kelp carbon is stored is poorly known",
          "The figure has been criticised as too confident, chiefly because how much kelp carbon ends up stored rather than recycled near the surface is poorly known, and because the calculation treats the entire coastline as if it behaved like the best-studied sites.",
          "The stored fraction is 'poorly known'.",
        ),
        mcq(
          "What makes this an unusually strong case for a trophic cascade?",
          [
            "The predator was removed and returned over a long period",
            "The kelp was surveyed before the hunting began",
            "The work was done in experimental enclosures",
            "Only a single island was ever studied",
          ],
          "The predator was removed and returned over a long period",
          "In the otter case the evidence is unusually good because the predator was removed and returned over a long period and the vegetation responded both times, which is closer to an experiment than field ecology usually manages.",
          "The vegetation responded both times.",
        ),
      ],
    },
    {
      key: "t68-p3-congestion-charging",
      title: "Paying to Enter the City",
      topic: "what charging drivers to enter a city centre does and does not achieve",
      difficulty: 7,
      body: `A) A congestion charge is a payment for driving into a defined area at a defined time. London introduced one in 2003, Stockholm in 2006 after a trial, Singapore much earlier and in a more sophisticated form, and Milan, Gothenburg and several others since. The idea is older than any of them: an economist proposed in the 1920s that a road user should pay the cost they impose on everybody else, and almost nothing in the intervening century has improved on the analysis. New York's version, argued over for two decades, finally began operating in 2025.

B) The economics is straightforward and the politics is not. A driver entering a crowded road experiences their own delay but not the delay they add to every other vehicle, so the road is used past the point at which the total cost is worth paying. A charge set at the right level makes the driver face that cost. What makes the policy unusual among transport measures is that it does not require anybody to build anything: the capacity already exists and is being rationed by queueing rather than by price.

C) The measured effects have been consistent across cities in a way that is rare in transport research. Traffic entering a charged area falls immediately by something between a tenth and a fifth, and the fall persists. Journey times inside the zone improve by more than the traffic reduction alone would suggest, because congestion is non-linear near capacity and removing a small number of vehicles has a disproportionate effect. Air quality improves, though less than campaigners predict, since the remaining vehicles are moving more freely and the largest sources are often outside the zone altogether.

D) Public opinion follows a pattern so regular that it has become an argument in itself. Before introduction, a large majority opposes the charge; after a year or two of operation, a majority supports it. Stockholm is the clearest case, because the scheme was introduced as a trial with a referendum afterwards, and the vote that had been expected to abolish it kept it. The usual explanation is that the benefits are experienced while the costs are only anticipated, so opposition is highest when the public has least information. This is a good argument for trials and a poor argument for ignoring objections.

E) The objection that carries real weight is about who pays. A flat charge takes a much larger share of a small income than of a large one, and the people who most need to drive at a fixed hour are frequently those with the least flexible jobs and the worst public transport. The standard answer is that the revenue can be spent on buses, which is a good answer only if it actually is. Where a scheme has been introduced and the revenue absorbed into a general budget, the objection stands, and it is not answered by pointing out that on average the poorest households drive least. The distributional question is the one that decides whether a scheme survives politically, and it deserves a better answer than it usually receives.

F) I am unconvinced by two arguments frequently made on the other side. The claim that charging simply displaces traffic to the boundary is not supported by the evidence, which shows boundary effects that are real but small and short-lived. The claim that a city's shops will suffer has been tested repeatedly and has not been borne out: retail activity inside charged zones has generally tracked the wider economy, partly because a substantial proportion of shoppers were never arriving by car and were being deterred by the traffic.

G) Where I think the policy is genuinely vulnerable is that its rationale is being quietly replaced. A charge designed to price congestion is increasingly defended as a way of reducing emissions, and these are different objectives implying different designs: an emissions charge should vary with the vehicle, a congestion charge should vary with the time and the place, and a scheme attempting both usually does neither well. As vehicles electrify, the emissions argument weakens while the congestion argument does not change at all, because an electric car occupies exactly as much road as any other. Cities that justified their scheme on air quality will find the justification expiring, and will then have to make the argument they should have made at the start.`,
      questions: [
        fromList(
          "matching_information",
          ROAD_PARAGRAPHS,
          "an explanation of why the benefit exceeds the fall in traffic",
          "C",
          "Journey times inside the zone improve by more than the traffic reduction alone would suggest, because congestion is non-linear near capacity and removing a small number of vehicles has a disproportionate effect.",
          "Paragraph C explains the non-linear effect.",
        ),
        fromList(
          "matching_information",
          ROAD_PARAGRAPHS,
          "a vote that was expected to end a scheme and did not",
          "D",
          "Stockholm is the clearest case, because the scheme was introduced as a trial with a referendum afterwards, and the vote that had been expected to abolish it kept it.",
          "Paragraph D describes the Stockholm referendum.",
        ),
        fromList(
          "matching_information",
          ROAD_PARAGRAPHS,
          "the point that the policy requires no new construction",
          "B",
          "What makes the policy unusual among transport measures is that it does not require anybody to build anything: the capacity already exists and is being rationed by queueing rather than by price.",
          "Paragraph B notes that nothing is built.",
        ),
        fromList(
          "matching_information",
          ROAD_PARAGRAPHS,
          "a prediction about retailers that testing has not confirmed",
          "F",
          "The claim that a city's shops will suffer has been tested repeatedly and has not been borne out: retail activity inside charged zones has generally tracked the wider economy, partly because a substantial proportion of shoppers were never arriving by car and were being deterred by the traffic.",
          "Paragraph F reports the retail evidence.",
        ),
        fromList(
          "matching_information",
          ROAD_PARAGRAPHS,
          "an observation that two aims imply two different designs",
          "G",
          "A charge designed to price congestion is increasingly defended as a way of reducing emissions, and these are different objectives implying different designs: an emissions charge should vary with the vehicle, a congestion charge should vary with the time and the place, and a scheme attempting both usually does neither well.",
          "Paragraph G separates the two objectives.",
        ),
        ynng(
          "The writer thinks the pattern in public opinion justifies disregarding objections.",
          "NO",
          "This is a good argument for trials and a poor argument for ignoring objections.",
          "It is 'a poor argument for ignoring objections'.",
        ),
        ynng(
          "The writer accepts that the fairness objection can survive the usual reply.",
          "YES",
          "Where a scheme has been introduced and the revenue absorbed into a general budget, the objection stands, and it is not answered by pointing out that on average the poorest households drive least.",
          "In that case 'the objection stands'.",
        ),
        ynng(
          "The writer believes charging pushes a large volume of traffic to the zone's edge.",
          "NO",
          "The claim that charging simply displaces traffic to the boundary is not supported by the evidence, which shows boundary effects that are real but small and short-lived.",
          "Boundary effects are 'small and short-lived'.",
        ),
        ynng(
          "The writer expects the air-quality case for charging to weaken over time.",
          "YES",
          "As vehicles electrify, the emissions argument weakens while the congestion argument does not change at all, because an electric car occupies exactly as much road as any other.",
          "The emissions argument 'weakens'.",
        ),
        fromList(
          "matching_sentence_endings",
          ROAD_ENDINGS,
          "A crowded road is used beyond the point worth paying for,",
          "because a driver does not experience the delay they impose on others.",
          "A driver entering a crowded road experiences their own delay but not the delay they add to every other vehicle, so the road is used past the point at which the total cost is worth paying.",
          "The added delay is not felt by the driver.",
        ),
        fromList(
          "matching_sentence_endings",
          ROAD_ENDINGS,
          "Removing a modest number of vehicles has an outsized effect,",
          "which is why journey times improve more than the traffic figures do.",
          "Journey times inside the zone improve by more than the traffic reduction alone would suggest, because congestion is non-linear near capacity and removing a small number of vehicles has a disproportionate effect.",
          "Times improve more than traffic falls.",
        ),
        fromList(
          "matching_sentence_endings",
          ROAD_ENDINGS,
          "Displacement to the edge of the zone is a weak objection,",
          "although the effects at the boundary are small and do not last.",
          "The claim that charging simply displaces traffic to the boundary is not supported by the evidence, which shows boundary effects that are real but small and short-lived.",
          "The effects are real but brief.",
        ),
        fromList(
          "matching_sentence_endings",
          ROAD_ENDINGS,
          "Forecasts of damage to city-centre shops have not been borne out,",
          "since many of those shoppers had never been arriving by car at all.",
          "The claim that a city's shops will suffer has been tested repeatedly and has not been borne out: retail activity inside charged zones has generally tracked the wider economy, partly because a substantial proportion of shoppers were never arriving by car and were being deterred by the traffic.",
          "Many shoppers never came by car.",
        ),
        fromList(
          "matching_sentence_endings",
          ROAD_ENDINGS,
          "Electrification leaves the case for pricing congestion untouched,",
          "because an electric vehicle takes up as much road space as any other.",
          "As vehicles electrify, the emissions argument weakens while the congestion argument does not change at all, because an electric car occupies exactly as much road as any other.",
          "Road space is unchanged by the engine.",
        ),
      ],
    },
  ],
};
