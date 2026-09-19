import { fromList, gapFill, mcq, tfng, ynng, type CuratedPassage } from "./shared";

const PRICE_BANK = [
  "demand",
  "surge",
  "inventory",
  "algorithm",
  "supply",
  "history",
  "queue",
  "resale",
  "trust",
];

export const DYNAMIC_PRICING: CuratedPassage = {
  key: "dynamic-pricing",
  title: "The Price That Moves While You Look at It",
  topic: "why the same thing costs different amounts to different people at different times",
  difficulty: 7,
  body: `A fixed price marked on the goods is a recent invention and a local one. For most of commercial history the price of anything was settled between the buyer and the seller each time, and it depended on what the seller thought the buyer would pay. The marked price arrived in the nineteenth century with the department store, and it was a genuine innovation: it removed the need to haggle, allowed a shop to be staffed by clerks rather than negotiators, and made it possible to advertise.

What has happened over the past two decades is a partial return to the older arrangement, conducted by software. Airlines began it, for reasons peculiar to their business — a seat expires on departure, so any revenue is better than none, and a business traveller booking on Tuesday for Wednesday will pay several times what a tourist booking in February for August will pay. Managing that spread is not a trick but the central commercial activity of the industry.

From there it spread to anything with constrained supply and variable demand: hotels, car hire, car parks, event tickets, and then ride-hailing, where the price is recalculated continuously against the ratio of requests to available drivers. In the ride-hailing case the stated purpose is not only to ration the cars but to attract more of them, since the higher fare is partly passed to drivers and draws them towards the place where demand is.

Public reaction has been consistent and largely negative, and the pattern in it is instructive. Surveys find people broadly accept a price that varies with cost — a flight in August costing more than one in November, a hotel charging more during a festival — and object strongly to a price that varies with the seller's reading of the buyer's situation. Raising the fare during a storm is the standard example, and the objection is not that the price rose but that it rose because the customer had no alternative.

The distinction has a long history. Medieval doctrine on the just price allowed a merchant to charge more when goods were scarce and forbade charging more because the individual buyer was desperate, which is close to the line modern surveys keep finding. Several jurisdictions encode a version of it, prohibiting price rises on essentials during a declared emergency.

Economists generally defend the practice on allocation grounds. A price that rises with scarcity moves the good towards whoever values it most and calls forth additional supply, and the alternative is a queue, which allocates by who can wait rather than by who needs. The counter-argument is that willingness to pay measures ability to pay as well as need, so a market clearing by price during an emergency allocates by wealth, and calling that efficient uses a narrow definition of the word.

The version that alarms people most is personalised pricing: a different price for each customer, derived from what is known about them. The technical capacity clearly exists — a retailer can observe the device, the location, the browsing history and the past purchases of a visitor before quoting anything — and there is evidence of it being used in modest ways, such as showing different prices to users of different operating systems.

What has limited it is not law but the fear of being caught. A firm found to be quoting a higher price to a customer because it knows they can afford it faces a reaction it cannot control, and several that were found doing so abandoned the practice within days of the story appearing. The result is an equilibrium in which the capability is widespread, the use is cautious, and the disclosure is minimal.

The likely direction is more variation and more explanation. Where a mechanism is visible and its reason is stated — a stated surge multiplier, a posted off-peak fare, a discount for booking early — people tolerate very large price differences without complaint. Where the mechanism is hidden, a small difference is enough to produce an accusation of exploitation. The commercial lesson, which the airlines learned earliest, is that customers object less to a price that moves than to a price that moves for reasons nobody will explain.`,
  questions: [
    tfng(
      "Fixed marked prices have been the normal arrangement throughout history.",
      "FALSE",
      "A fixed price marked on the goods is a recent invention and a local one.",
      "It is 'a recent invention and a local one'.",
    ),
    tfng(
      "The marked price allowed shops to employ staff who did not negotiate.",
      "TRUE",
      "The marked price arrived in the nineteenth century with the department store, and it was a genuine innovation: it removed the need to haggle, allowed a shop to be staffed by clerks rather than negotiators, and made it possible to advertise.",
      "Shops could be 'staffed by clerks rather than negotiators'.",
    ),
    tfng(
      "Managing the spread between fares is a minor part of airline business.",
      "FALSE",
      "Managing that spread is not a trick but the central commercial activity of the industry.",
      "It is 'the central commercial activity'.",
    ),
    tfng(
      "Higher ride-hailing fares are intended partly to bring more drivers to an area.",
      "TRUE",
      "In the ride-hailing case the stated purpose is not only to ration the cars but to attract more of them, since the higher fare is partly passed to drivers and draws them towards the place where demand is.",
      "It aims 'to attract more of them'.",
    ),
    tfng(
      "People object to all forms of price variation equally.",
      "FALSE",
      "Surveys find people broadly accept a price that varies with cost — a flight in August costing more than one in November, a hotel charging more during a festival — and object strongly to a price that varies with the seller's reading of the buyer's situation.",
      "They accept cost-based variation.",
    ),
    tfng(
      "Some legal systems restrict price rises during emergencies.",
      "TRUE",
      "Several jurisdictions encode a version of it, prohibiting price rises on essentials during a declared emergency.",
      "Several jurisdictions prohibit them.",
    ),
    tfng(
      "Firms found using personalised pricing generally continued the practice.",
      "FALSE",
      "A firm found to be quoting a higher price to a customer because it knows they can afford it faces a reaction it cannot control, and several that were found doing so abandoned the practice within days of the story appearing.",
      "They 'abandoned the practice within days'.",
    ),
    ynng(
      "The writer thinks the modern objection resembles an older moral principle.",
      "YES",
      "Medieval doctrine on the just price allowed a merchant to charge more when goods were scarce and forbade charging more because the individual buyer was desperate, which is close to the line modern surveys keep finding.",
      "It is 'close to the line modern surveys keep finding'.",
    ),
    ynng(
      "The writer accepts that pricing by scarcity is straightforwardly efficient.",
      "NO",
      "The counter-argument is that willingness to pay measures ability to pay as well as need, so a market clearing by price during an emergency allocates by wealth, and calling that efficient uses a narrow definition of the word.",
      "That uses 'a narrow definition of the word'.",
    ),
    ynng(
      "The writer believes visible reasons make large price differences acceptable.",
      "YES",
      "Where a mechanism is visible and its reason is stated — a stated surge multiplier, a posted off-peak fare, a discount for booking early — people tolerate very large price differences without complaint.",
      "People 'tolerate very large price differences'.",
    ),
    fromList(
      "summary_completion",
      PRICE_BANK,
      "Prices now move with ______ in industries where supply is fixed.",
      "demand",
      "From there it spread to anything with constrained supply and variable demand: hotels, car hire, car parks, event tickets, and then ride-hailing, where the price is recalculated continuously against the ratio of requests to available drivers.",
      "It spread to sectors with variable demand.",
    ),
    fromList(
      "summary_completion",
      PRICE_BANK,
      "A fare multiplied during a shortage is usually called a ______ price.",
      "surge",
      "Where a mechanism is visible and its reason is stated — a stated surge multiplier, a posted off-peak fare, a discount for booking early — people tolerate very large price differences without complaint.",
      "The visible mechanism is 'a stated surge multiplier'.",
    ),
    fromList(
      "summary_completion",
      PRICE_BANK,
      "Personalised quotes can be built from a customer's browsing ______.",
      "history",
      "The technical capacity clearly exists — a retailer can observe the device, the location, the browsing history and the past purchases of a visitor before quoting anything — and there is evidence of it being used in modest ways, such as showing different prices to users of different operating systems.",
      "It can observe 'the browsing history'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "The alternative to allocating by price is a ______, which allocates by waiting.",
      "queue",
      "A price that rises with scarcity moves the good towards whoever values it most and calls forth additional supply, and the alternative is a queue, which allocates by who can wait rather than by who needs.",
      "'The alternative is a queue'.",
    ),
    mcq(
      "What does the passage say has limited personalised pricing?",
      [
        "The risk of public exposure",
        "Laws forbidding the practice",
        "The difficulty of the technology",
        "A lack of data about customers",
      ],
      "The risk of public exposure",
      "What has limited it is not law but the fear of being caught.",
      "'What has limited it is not law but the fear of being caught.'",
    ),
  ],
};
