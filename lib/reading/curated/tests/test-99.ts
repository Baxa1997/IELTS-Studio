import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · urban transport · notes box --------------------------------

const BUS_NOTES = {
  title: "What makes it behave like a railway",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · urban economics · people and a word bank ------------------

const PARKING_PEOPLE = ["Deborah Maslowski", "Ike Oyelaran", "Silvia Ranieri", "Aaron Whitlock"];
const PARKING_BANK = [
  "minimums",
  "cruising",
  "kerb",
  "bundled",
  "occupancy",
  "rent",
  "permits",
  "revenue",
  "density",
];

// ---- Passage 3 · railway policy · lettered paragraphs ----------------------

const HSR_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const HSR_ENDINGS = [
  "because every extra stop costs every through passenger several minutes.",
  "which is why the line works best between two cities of comparable size.",
  "since the aircraft it replaces was emitting most on take-off and landing.",
  "although the construction itself releases carbon that takes decades to repay.",
  "because a town bypassed by the route may end up worse connected than before.",
  "even though the same money would buy a great deal of ordinary track.",
  "which makes the political case for a station stronger than the engineering case.",
];

export const TEST_99: CuratedTest = {
  key: "full-test-99",
  targetBand: 6,
  passages: [
    {
      key: "t99-p1-bus-rapid-transit",
      title: "The Bus That Runs Like a Train",
      topic: "a system assembled from ordinary buses and unusual discipline",
      difficulty: 5,
      body: `A city that wants a metro faces a bill of perhaps a hundred million dollars per kilometre and a construction period measured in decades. A city that wants more buses can have them next year for almost nothing and will find them stuck in the same traffic as everything else. Bus rapid transit is an attempt to occupy the ground between these, and where it has been done properly it gets a substantial fraction of a metro's capacity for a small fraction of the cost.

The system was worked out in Curitiba, in Brazil, from the 1970s onwards, under a mayor who was an architect by training and did not have the money for a railway. The insight was that most of what makes a metro fast is not the rails. It is that the vehicle has its own right of way, that passengers pay before boarding, that they board across a level platform through wide doors, and that the vehicle has priority wherever it meets other traffic. Each of those can be arranged for a bus, on a road, with paint, a kerb, a raised platform and a set of traffic signals that know the vehicle is coming.

The elements matter individually and they matter more together, which is the point most often missed. A dedicated lane without off-board fare collection produces a bus that arrives quickly and then waits two minutes at each stop while people pay the driver. Level boarding without a dedicated lane produces a bus that loads in fifteen seconds and then sits in a queue of cars. Systems that implemented some of the elements and not others have generally been disappointing, and their disappointment is then attributed to the concept.

Bogotá built the best-known large example in 2000, carrying passenger volumes comparable to a heavy metro line on a road corridor, with stations in the central reservation, articulated vehicles, express services running past local stops, and a separate network of feeder buses bringing passengers in from the neighbourhoods. Capacity of thirty to forty thousand passengers an hour in one direction has been demonstrated, which is in the range of a metro and was achieved for something like a twentieth of the capital cost.

The mode has a reputation problem that is largely about status. A bus is understood as the transport of people who have no alternative, and a rail line is understood as an investment in a district, which shows up in property values and in political enthusiasm. Several cities have built a bus system, watched it work, and then found it politically impossible to extend, while a rail proposal for the same corridor attracted support. The evidence on land value uplift is genuinely mixed: it exists for high-quality bus systems and is consistently smaller than for rail, and whether that reflects the transport or the perception is not separable.

The failure modes are well catalogued. A system whose dedicated lanes are removed at the difficult junctions loses its advantage precisely where it was needed. One built with narrow stations and a single lane cannot run express services and is capacity-limited by its slowest vehicle. One run by the incumbent bus operators without restructuring the routes produces the same congestion with new infrastructure, because a dozen companies running overlapping services will fill a dedicated lane exactly as they filled the road. And a corridor where enforcement is weak loses the lane to private cars within a year, which is a policing question rather than an engineering one.

What the record establishes is that the concept works and is unusually demanding of institutions. The capital cost is low and the operational discipline required is high: the lane must be kept clear, the fares collected off the vehicle, the schedules held, the doors aligned with the platforms. A city that can sustain that can have most of a metro for a small share of the price. A city that cannot will end up with a painted lane and a set of shelters, and will conclude, wrongly, that the idea does not work. That conclusion has been drawn in enough places to have damaged the reputation of a technique whose failures are almost all failures of execution.`,
      questions: [
        tfng(
          "The system was developed in a city that could not afford a railway.",
          "TRUE",
          "The system was worked out in Curitiba, in Brazil, from the 1970s onwards, under a mayor who was an architect by training and did not have the money for a railway.",
          "The mayor 'did not have the money for a railway'.",
        ),
        tfng(
          "The writer says the rails are what make a metro fast.",
          "FALSE",
          "The insight was that most of what makes a metro fast is not the rails.",
          "It is 'not the rails'.",
        ),
        tfng(
          "Implementing only some of the elements produces most of the benefit.",
          "FALSE",
          "Systems that implemented some of the elements and not others have generally been disappointing, and their disappointment is then attributed to the concept.",
          "Partial systems 'have generally been disappointing'.",
        ),
        tfng(
          "Bogotá's system has carried volumes in the range of a metro line.",
          "TRUE",
          "Capacity of thirty to forty thousand passengers an hour in one direction has been demonstrated, which is in the range of a metro and was achieved for something like a twentieth of the capital cost.",
          "It is 'in the range of a metro'.",
        ),
        tfng(
          "Land values rise as much around good bus systems as around rail.",
          "FALSE",
          "The evidence on land value uplift is genuinely mixed: it exists for high-quality bus systems and is consistently smaller than for rail, and whether that reflects the transport or the perception is not separable.",
          "It is 'consistently smaller than for rail'.",
        ),
        tfng(
          "Losing the dedicated lane to cars is mainly an enforcement issue.",
          "TRUE",
          "And a corridor where enforcement is weak loses the lane to private cars within a year, which is a policing question rather than an engineering one.",
          "It is 'a policing question'.",
        ),
        tfng(
          "Curitiba's system is still the largest in Brazil.",
          "NOT GIVEN",
          "",
          "The passage describes Curitiba's origins but makes no comparison of size.",
        ),
        noteLine(
          BUS_NOTES,
          null,
          "The vehicle has its own ______ of way",
          "right",
          "It is that the vehicle has its own right of way, that passengers pay before boarding, that they board across a level platform through wide doors, and that the vehicle has priority wherever it meets other traffic.",
          "It has its own right of way.",
          { before: [{ text: "Four borrowed features:", indent: 0 }] },
        ),
        noteLine(
          BUS_NOTES,
          null,
          "Passengers pay before ______",
          "boarding",
          "It is that the vehicle has its own right of way, that passengers pay before boarding, that they board across a level platform through wide doors, and that the vehicle has priority wherever it meets other traffic.",
          "Payment happens before boarding.",
        ),
        noteLine(
          BUS_NOTES,
          null,
          "The bus has ______ wherever it meets other traffic",
          "priority",
          "It is that the vehicle has its own right of way, that passengers pay before boarding, that they board across a level platform through wide doors, and that the vehicle has priority wherever it meets other traffic.",
          "It has priority at every conflict.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Bogotá put its stations in the central ______ of the road.",
          "reservation",
          "Bogotá built the best-known large example in 2000, carrying passenger volumes comparable to a heavy metro line on a road corridor, with stations in the central reservation, articulated vehicles, express services running past local stops, and a separate network of feeder buses.",
          "Stations sit in the central reservation.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A system with narrow stations cannot run ______ services.",
          "express",
          "One built with narrow stations and a single lane cannot run express services and is capacity-limited by its slowest vehicle.",
          "Express services become impossible.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The concept is unusually demanding of ______.",
          "institutions",
          "What the record establishes is that the concept works and is unusually demanding of institutions.",
          "It demands institutions.",
        ),
      ],
    },
    {
      key: "t99-p2-parking",
      title: "The Price of a Parking Space",
      topic: "the largest single land use in many cities, given away free",
      difficulty: 6,
      body: `A car spends the overwhelming majority of its existence stationary, and it must be stationary somewhere. In a typical city there are several parking spaces for every car, because each vehicle needs one at home, one at work, and a share of the spaces at every shop, hospital and stadium it might visit. Counted up, parking occupies more urban land than housing in some cities, and in the central districts of a few North American ones the share of the surface given to stationary vehicles exceeds a third. Almost all of it is provided at no charge to the user.

Deborah Maslowski, an urban economist, insists that free parking is not free but bundled. The cost of building a space — excavation, structure, land — is real, and it is recovered in the price of the goods sold in the shop, the rent of the flat, or the salary of the employee. She points out that this means people who do not own a car pay for the parking of people who do, invisibly, in the price of everything they buy, and that the invisibility is the reason the arrangement is so rarely questioned.

The mechanism that produced all this parking is regulatory. For most of the twentieth century planning codes required a minimum number of spaces per dwelling, per restaurant seat, per square metre of shop. Ike Oyelaran, a planner, has traced where those numbers came from and reports that they were mostly copied from one manual to another, derived originally from surveys of demand at suburban sites where parking was free and no alternative existed. He describes them as a circular measurement: the requirement was calibrated on the behaviour of places built to the requirement, and the figure was then applied to dense districts with rail stations where it made no sense at all.

Removing the minimums has been the most significant change in the field. Dozens of cities have abolished them entirely in the last fifteen years, and the observed effect is not that developers build no parking but that they build less of it, and something else with the space. Silvia Ranieri, who has studied the outcomes, notes that projects which become viable when the parking requirement is lifted are disproportionately small infill buildings on awkward sites, because the requirement was what made them impossible: a small plot cannot accommodate the ramp.

Pricing the kerb is the other half. Aaron Whitlock, who advises cities on parking systems, explains the objective as an occupancy target rather than a revenue target: set the price on each block so that roughly one space in seven or eight is free, which means a driver can always find a space within a short distance and stops circling. Circling, or cruising for parking, is a substantial share of traffic in busy districts — surveys in some commercial streets have attributed a third of all vehicle movement to it — and it is produced specifically by a kerb price set below the market. He is careful about the politics: the revenue is real and is best returned visibly to the district that generated it, in pavements, lighting or cleaning, because a charge that is seen as extraction will not survive an election.

The distributional argument cuts both ways and both sides overstate their half. A parking charge is a cost falling on drivers, who in many cities include people on modest incomes with no transport alternative. Requiring parking, on the other hand, raises the cost of housing for everyone including those without cars, and the amounts involved are large: a structured space can add a substantial sum to the cost of a flat. Which effect dominates depends on the city, and the honest position is that parking policy is a transfer in either direction and should be argued about as one.

What is not in dispute is the scale of the thing. A policy instrument that determines the cost of housing, the density a city can reach, the amount of traffic on its streets and the viability of its public transport was, for most of a century, set by numbers nobody had derived and few had examined. That is a remarkable fact about planning practice and it is not, as far as anyone has established, unique to parking.`,
      questions: [
        fromList(
          "matching_features",
          PARKING_PEOPLE,
          "The cost of a free space is recovered in other prices.",
          "Deborah Maslowski",
          "The cost of building a space — excavation, structure, land — is real, and it is recovered in the price of the goods sold in the shop, the rent of the flat, or the salary of the employee.",
          "Maslowski traces the hidden recovery.",
        ),
        fromList(
          "matching_features",
          PARKING_PEOPLE,
          "The requirements were calibrated on places built to the requirements.",
          "Ike Oyelaran",
          "He describes them as a circular measurement: the requirement was calibrated on the behaviour of places built to the requirement, and the figure was then applied to dense districts with rail stations where it made no sense at all.",
          "Oyelaran calls it circular.",
        ),
        fromList(
          "matching_features",
          PARKING_PEOPLE,
          "Abolition mainly enables building on small difficult plots.",
          "Silvia Ranieri",
          "Silvia Ranieri, who has studied the outcomes, notes that projects which become viable when the parking requirement is lifted are disproportionately small infill buildings on awkward sites, because the requirement was what made them impossible: a small plot cannot accommodate the ramp.",
          "Ranieri describes the infill effect.",
        ),
        fromList(
          "matching_features",
          PARKING_PEOPLE,
          "Money raised should be spent visibly in the same district.",
          "Aaron Whitlock",
          "He is careful about the politics: the revenue is real and is best returned visibly to the district that generated it, in pavements, lighting or cleaning, because a charge that is seen as extraction will not survive an election.",
          "Whitlock ties revenue to local spending.",
        ),
        fromList(
          "summary_completion",
          PARKING_BANK,
          "Free parking is better described as ______ into other prices.",
          "bundled",
          "Deborah Maslowski, an urban economist, insists that free parking is not free but bundled.",
          "It is bundled, not free.",
        ),
        fromList(
          "summary_completion",
          PARKING_BANK,
          "Planning codes once imposed parking ______ on every kind of building.",
          "minimums",
          "For most of the twentieth century planning codes required a minimum number of spaces per dwelling, per restaurant seat, per square metre of shop.",
          "Minimum numbers were required.",
        ),
        fromList(
          "summary_completion",
          PARKING_BANK,
          "A kerb price should be set to hit an ______ target.",
          "occupancy",
          "Aaron Whitlock, who advises cities on parking systems, explains the objective as an occupancy target rather than a revenue target: set the price on each block so that roughly one space in seven or eight is free, which means a driver can always find a space within a short distance and stops circling.",
          "The target is occupancy.",
        ),
        fromList(
          "summary_completion",
          PARKING_BANK,
          "An underpriced kerb generates traffic that is ______ for a space.",
          "cruising",
          "Circling, or cruising for parking, is a substantial share of traffic in busy districts — surveys in some commercial streets have attributed a third of all vehicle movement to it — and it is produced specifically by a kerb price set below the market.",
          "The traffic is cruising for parking.",
        ),
        fromList(
          "summary_completion",
          PARKING_BANK,
          "A required space raises the ______ of housing for people without cars.",
          "rent",
          "Requiring parking, on the other hand, raises the cost of housing for everyone including those without cars, and the amounts involved are large: a structured space can add a substantial sum to the cost of a flat.",
          "It raises housing costs for everyone.",
        ),
        mcq(
          "Why are there several spaces per car?",
          [
            "A car needs one at each place it might stop",
            "Cars are parked in pairs for access",
            "Most spaces are permanently unused",
            "Cities overbuilt during the 1990s",
          ],
          "A car needs one at each place it might stop",
          "In a typical city there are several parking spaces for every car, because each vehicle needs one at home, one at work, and a share of the spaces at every shop, hospital and stadium it might visit.",
          "One is needed at each destination.",
        ),
        mcq(
          "What happens when minimum requirements are abolished?",
          [
            "Developers build less parking and use the space otherwise",
            "Developers stop providing parking altogether",
            "Parking provision stays exactly the same",
            "Existing car parks are demolished",
          ],
          "Developers build less parking and use the space otherwise",
          "Dozens of cities have abolished them entirely in the last fifteen years, and the observed effect is not that developers build no parking but that they build less of it, and something else with the space.",
          "Less parking, and something else built.",
        ),
        mcq(
          "What proportion of traffic has been attributed to cruising in some streets?",
          ["About a third", "About a tenth", "About half", "About one in seven"],
          "About a third",
          "Circling, or cruising for parking, is a substantial share of traffic in busy districts — surveys in some commercial streets have attributed a third of all vehicle movement to it — and it is produced specifically by a kerb price set below the market.",
          "A third of vehicle movement.",
        ),
        mcq(
          "What is the writer's position on the distributional argument?",
          [
            "Parking policy transfers money in either direction",
            "Charges always fall hardest on the poorest",
            "Requirements are the fairer instrument",
            "The effects are too small to matter",
          ],
          "Parking policy transfers money in either direction",
          "Which effect dominates depends on the city, and the honest position is that parking policy is a transfer in either direction and should be argued about as one.",
          "It is a transfer either way.",
        ),
      ],
    },
    {
      key: "t99-p3-high-speed-rail",
      title: "Choosing Between Speed and Stops",
      topic: "a technology whose economics depend almost entirely on geography",
      difficulty: 7,
      body: `A) A high-speed railway is not a faster version of an ordinary one. Above about two hundred and fifty kilometres an hour the engineering diverges: curves must be very gentle, gradients shallow, the track laid on a slab rather than on ballast, the whole route fenced and free of level crossings, and the signalling moved into the cab because a driver cannot read a lineside signal at that speed. The consequence is that a high-speed line is a new alignment through the landscape rather than an upgrade of an existing one, and its cost is dominated by earthworks, tunnels and bridges.

B) The economics turn on a single question: how many people want to travel between the two ends. A high-speed line has enormous capacity and enormous fixed costs, and nothing in between. It is therefore suited to connecting two large cities two to four hundred kilometres apart — close enough that the train beats the aeroplane door to door, far enough that it beats the car — and poorly suited to almost everything else. Tokyo to Osaka, Paris to Lyon, Madrid to Barcelona and the Beijing corridors all fit that description. Lines built between smaller cities, or over distances where flying wins, have generally required permanent subsidy.

C) The intermediate stations are where the argument becomes political. Every stop costs every through passenger the time to decelerate, dwell and accelerate again, which on a high-speed line is several minutes. A route with many stops is slower and serves more places; a route with few is faster and serves fewer. Since the towns along a route are represented by people who vote on the project, the pressure is always towards more stations than the timetable can bear, and several countries have built lines whose journey times are substantially worse than the design allowed for exactly this reason.

D) The effect on the places served is not uniformly positive, which surprises people. A city connected to a much larger one may find that the larger one absorbs activity rather than sharing it: a professional service firm can now serve the smaller city from the bigger one without maintaining an office there, and a resident can commute rather than relocate. Whether a station raises or lowers local economic activity appears to depend on what the city already had, and the studies find gains for places with an existing specialism and losses for places hoping the station itself would supply one.

E) A town bypassed by the route can end up worse off than before. The conventional service on the old line is often reduced when the new line opens, because the operator's revenue moves to the fast route, and a town that had four slow trains an hour may find it has two. This is a predictable consequence and it is regularly presented as a surprise. It is also the strongest argument the opponents of a scheme have, and it is usually answered with promises about the old line that are not funded.

F) The carbon case is real and slower than advertised. A high-speed train running on low-carbon electricity emits a small fraction of what the equivalent flight emits per passenger, and the largest share of an aircraft's fuel burn on a short route is spent taking off and climbing, so a route that abolishes short flights saves a great deal. Against that, building the line releases a very large quantity of carbon in concrete and steel and in the earthworks themselves, and the payback period for that construction emission is typically estimated in decades. A line with strong traffic pays it back; a line with weak traffic does not pay it back at all.

G) The comparison that most rarely gets made is with the alternative use of the money. A high-speed line costs enough to electrify and resignal a very large amount of existing track, add capacity to several commuter networks, or build tram systems in a handful of cities. Those options serve many more journeys and no minister has ever opened one to a national audience. That asymmetry between what is beneficial and what is visible is not an argument against high-speed rail, which is genuinely the right answer for the corridors it suits. It is an argument for asking, every time, whether this corridor is one of them.`,
      questions: [
        fromList(
          "matching_information",
          HSR_PARAGRAPHS,
          "why a smaller city may lose activity to a larger one",
          "D",
          "A city connected to a much larger one may find that the larger one absorbs activity rather than sharing it: a professional service firm can now serve the smaller city from the bigger one without maintaining an office there, and a resident can commute rather than relocate.",
          "Paragraph D describes the absorption effect.",
        ),
        fromList(
          "matching_information",
          HSR_PARAGRAPHS,
          "a promise made to objectors that is usually unfunded",
          "E",
          "It is also the strongest argument the opponents of a scheme have, and it is usually answered with promises about the old line that are not funded.",
          "Paragraph E notes the unfunded promise.",
        ),
        fromList(
          "matching_information",
          HSR_PARAGRAPHS,
          "the engineering changes required above a certain speed",
          "A",
          "Above about two hundred and fifty kilometres an hour the engineering diverges: curves must be very gentle, gradients shallow, the track laid on a slab rather than on ballast, the whole route fenced and free of level crossings, and the signalling moved into the cab because a driver cannot read a lineside signal at that speed.",
          "Paragraph A lists the engineering changes.",
        ),
        fromList(
          "matching_information",
          HSR_PARAGRAPHS,
          "what the same budget could buy instead",
          "G",
          "A high-speed line costs enough to electrify and resignal a very large amount of existing track, add capacity to several commuter networks, or build tram systems in a handful of cities.",
          "Paragraph G lists the alternatives.",
        ),
        fromList(
          "matching_information",
          HSR_PARAGRAPHS,
          "the distance range in which the mode is competitive",
          "B",
          "It is therefore suited to connecting two large cities two to four hundred kilometres apart — close enough that the train beats the aeroplane door to door, far enough that it beats the car — and poorly suited to almost everything else.",
          "Paragraph B gives the distance range.",
        ),
        ynng(
          "The writer thinks high-speed rail is the wrong choice in principle.",
          "NO",
          "That asymmetry between what is beneficial and what is visible is not an argument against high-speed rail, which is genuinely the right answer for the corridors it suits.",
          "It is 'the right answer for the corridors it suits'.",
        ),
        ynng(
          "The writer regards the reduction of service on old lines as foreseeable.",
          "YES",
          "This is a predictable consequence and it is regularly presented as a surprise.",
          "It is 'a predictable consequence'.",
        ),
        ynng(
          "The writer accepts that construction emissions take a long time to repay.",
          "YES",
          "Against that, building the line releases a very large quantity of carbon in concrete and steel and in the earthworks themselves, and the payback period for that construction emission is typically estimated in decades.",
          "The payback is measured in decades.",
        ),
        ynng(
          "The writer believes adding stations generally improves a line's performance.",
          "NO",
          "Since the towns along a route are represented by people who vote on the project, the pressure is always towards more stations than the timetable can bear, and several countries have built lines whose journey times are substantially worse than the design allowed for exactly this reason.",
          "Extra stations worsened journey times.",
        ),
        fromList(
          "matching_sentence_endings",
          HSR_ENDINGS,
          "Timetables are damaged by adding stops,",
          "because every extra stop costs every through passenger several minutes.",
          "Every stop costs every through passenger the time to decelerate, dwell and accelerate again, which on a high-speed line is several minutes.",
          "Each stop costs several minutes.",
        ),
        fromList(
          "matching_sentence_endings",
          HSR_ENDINGS,
          "Towns along a route press for their own station,",
          "which makes the political case for a station stronger than the engineering case.",
          "Since the towns along a route are represented by people who vote on the project, the pressure is always towards more stations than the timetable can bear, and several countries have built lines whose journey times are substantially worse than the design allowed for exactly this reason.",
          "The pressure is electoral, not technical.",
        ),
        fromList(
          "matching_sentence_endings",
          HSR_ENDINGS,
          "An unserved town may lose the service it had,",
          "because a town bypassed by the route may end up worse connected than before.",
          "The conventional service on the old line is often reduced when the new line opens, because the operator's revenue moves to the fast route, and a town that had four slow trains an hour may find it has two.",
          "The old line's service is cut.",
        ),
        fromList(
          "matching_sentence_endings",
          HSR_ENDINGS,
          "Replacing a short flight saves a great deal of fuel,",
          "since the aircraft it replaces was emitting most on take-off and landing.",
          "A high-speed train running on low-carbon electricity emits a small fraction of what the equivalent flight emits per passenger, and the largest share of an aircraft's fuel burn on a short route is spent taking off and climbing, so a route that abolishes short flights saves a great deal.",
          "Take-off and climb dominate the fuel burn.",
        ),
        fromList(
          "matching_sentence_endings",
          HSR_ENDINGS,
          "The alternatives are rarely compared,",
          "even though the same money would buy a great deal of ordinary track.",
          "Those options serve many more journeys and no minister has ever opened one to a national audience.",
          "The alternatives serve more journeys and less visibly.",
        ),
      ],
    },
  ],
};
