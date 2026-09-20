import { gapFill, mcq, tfng, ynng, type CuratedPassage } from "./shared";

export const OVERBOOKING: CuratedPassage = {
  key: "overbooking",
  title: "Selling the Seat Twice",
  topic: "the economics of deliberately taking more bookings than there are places",
  difficulty: 7,
  body: `An airline that sells exactly as many tickets as it has seats will fly with empty seats on almost every departure. Some passengers miss connections, some are delayed, some change plans, and on a typical flight between five and fifteen per cent of those holding a ticket do not present themselves. A seat that flies empty earns nothing and cannot be sold later, which makes it one of the most perishable products in commerce.

The response is to sell more tickets than there are seats, in the expectation that enough people will fail to arrive. The practice is legal, disclosed in the contract nobody reads, and universal among airlines that sell refundable or changeable fares. It is also, when it goes wrong, the most publicly hated thing the industry does.

The forecasting behind it is more careful than the outcome suggests. Airlines hold years of history on each route, each departure time, each day of the week and each fare class, and the no-show rate is predictable to within a percentage point or two on a well-established route. A business route on a Tuesday morning with a high proportion of flexible tickets may show fifteen per cent no-shows; a leisure route on a Saturday in August, sold months ahead on non-refundable fares, may show almost none, and is therefore barely overbooked at all.

What the model has to weigh is an asymmetry. An empty seat costs the airline the fare it would have earned. A passenger denied boarding costs compensation, a rebooking, sometimes a hotel, and an amount of reputational damage that is real but very hard to price. Regulators have deliberately raised the first of those costs: in the European Union and in the United States, denied boarding against a passenger's will triggers compensation set by law, on a scale that rises with the length of the flight and can exceed the fare several times over.

That has produced the auction, which is the part of the system most passengers see. Before the compulsory stage, airlines ask for volunteers: a passenger who gives up a seat receives a voucher or cash and a seat on a later flight. The offer is raised until enough people accept. From the airline's point of view this is cheaper than the statutory compensation and produces a passenger who chose rather than one who was selected, and from the passenger's point of view it converts an inconvenience into a payment they agreed to.

Where the auction fails, the airline chooses, and the criteria it uses are where the reputational damage concentrates. The usual order removes passengers who paid least, checked in last and hold no loyalty status — which is defensible commercially and reads, when reported, as the airline removing the least valuable people. A widely publicised incident in 2017, in which a passenger already seated was removed by force, produced immediate policy changes across the industry: several carriers raised their voluntary compensation limits sharply and undertook not to remove a passenger who had already boarded.

There is an argument that the practice benefits passengers, and it deserves a fair hearing. Overbooking raises the number of seats actually flown, which lowers the average cost per passenger carried, and competition transfers some of that saving into fares. Airlines that have abandoned the practice have generally been small carriers with non-refundable fares and consequently low no-show rates, so the comparison is not clean; one major carrier that did abandon it reinstated it within two years. The benefit is real and diffuse, spread across every ticket sold, and the cost is concentrated on a small number of people who experience it as unfairness. That distribution is the whole of the controversy.

It is also worth noticing what the practice depends on. Overbooking works because no-shows are numerous and predictable, and both halves of that are consequences of how tickets are sold. A market in which every ticket was non-refundable, non-transferable and cheap would produce very few no-shows and would need almost no overbooking, which is roughly what the low-cost carriers discovered.

The same reasoning has spread well beyond aviation. Hotels overbook, car hire companies overbook, and some hospital systems overbook appointment slots against expected non-attendance. In each case the calculation is identical — a perishable slot, a predictable rate of non-arrival, an asymmetry between the cost of an empty slot and the cost of turning somebody away — and in each case the practice is invisible until the day the forecast is wrong.`,
  questions: [
    tfng(
      "A seat that flies empty can be sold after the flight has departed.",
      "FALSE",
      "A seat that flies empty earns nothing and cannot be sold later, which makes it one of the most perishable products in commerce.",
      "It 'cannot be sold later'.",
    ),
    tfng(
      "Overbooking is concealed from passengers in the ticket contract.",
      "FALSE",
      "The practice is legal, disclosed in the contract nobody reads, and universal among airlines that sell refundable or changeable fares.",
      "It is 'disclosed in the contract nobody reads'.",
    ),
    tfng(
      "No-show rates are similar across all types of flight.",
      "FALSE",
      "A business route on a Tuesday morning with a high proportion of flexible tickets may show fifteen per cent no-shows; a leisure route on a Saturday in August, sold months ahead on non-refundable fares, may show almost none, and is therefore barely overbooked at all.",
      "Rates vary from fifteen per cent to almost none.",
    ),
    tfng(
      "Compensation for denied boarding is fixed by law in some regions.",
      "TRUE",
      "Regulators have deliberately raised the first of those costs: in the European Union and in the United States, denied boarding against a passenger's will triggers compensation set by law, on a scale that rises with the length of the flight and can exceed the fare several times over.",
      "It is 'compensation set by law'.",
    ),
    tfng(
      "Volunteering is more expensive for an airline than compulsory removal.",
      "FALSE",
      "From the airline's point of view this is cheaper than the statutory compensation and produces a passenger who chose rather than one who was selected, and from the passenger's point of view it converts an inconvenience into a payment they agreed to.",
      "It is 'cheaper than the statutory compensation'.",
    ),
    tfng(
      "The 2017 incident led airlines to change their policies.",
      "TRUE",
      "A widely publicised incident in 2017, in which a passenger already seated was removed by force, produced immediate policy changes across the industry: several carriers raised their voluntary compensation limits sharply and undertook not to remove a passenger who had already boarded.",
      "It 'produced immediate policy changes'.",
    ),
    tfng(
      "A large airline that stopped overbooking has kept to that decision.",
      "FALSE",
      "Airlines that have abandoned the practice have generally been small carriers with non-refundable fares and consequently low no-show rates, so the comparison is not clean; one major carrier that did abandon it reinstated it within two years.",
      "It 'reinstated it within two years'.",
    ),
    ynng(
      "The writer thinks the forecasting involved is careless.",
      "NO",
      "The forecasting behind it is more careful than the outcome suggests.",
      "It is 'more careful than the outcome suggests'.",
    ),
    ynng(
      "The writer accepts that overbooking can reduce the fares passengers pay.",
      "YES",
      "Overbooking raises the number of seats actually flown, which lowers the average cost per passenger carried, and competition transfers some of that saving into fares.",
      "Competition transfers 'some of that saving into fares'.",
    ),
    ynng(
      "The writer regards the way the costs fall as the heart of the dispute.",
      "YES",
      "The benefit is real and diffuse, spread across every ticket sold, and the cost is concentrated on a small number of people who experience it as unfairness. That distribution is the whole of the controversy.",
      "'That distribution is the whole of the controversy.'",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "On a typical flight, five to fifteen per cent of ticket holders fail to ______ themselves.",
      "present",
      "Some passengers miss connections, some are delayed, some change plans, and on a typical flight between five and fifteen per cent of those holding a ticket do not present themselves.",
      "They 'do not present themselves'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Airlines first ask for ______ before removing anyone against their will.",
      "volunteers",
      "Before the compulsory stage, airlines ask for volunteers: a passenger who gives up a seat receives a voucher or cash and a seat on a later flight.",
      "They 'ask for volunteers'.",
    ),
    mcq(
      "Who is usually selected when there are not enough volunteers?",
      [
        "Those who paid least and checked in last",
        "Those travelling without luggage",
        "Those booked on the next available flight",
        "Those who booked most recently",
      ],
      "Those who paid least and checked in last",
      "The usual order removes passengers who paid least, checked in last and hold no loyalty status — which is defensible commercially and reads, when reported, as the airline removing the least valuable people.",
      "It removes those who 'paid least, checked in last'.",
    ),
    mcq(
      "What do the other industries mentioned have in common with airlines?",
      [
        "A perishable slot and a predictable non-arrival rate",
        "A legal obligation to compensate customers",
        "A history of public incidents",
        "An auction held before each appointment",
      ],
      "A perishable slot and a predictable non-arrival rate",
      "In each case the calculation is identical — a perishable slot, a predictable rate of non-arrival, an asymmetry between the cost of an empty slot and the cost of turning somebody away — and in each case the practice is invisible until the day the forecast is wrong.",
      "The same three elements recur.",
    ),
  ],
};
