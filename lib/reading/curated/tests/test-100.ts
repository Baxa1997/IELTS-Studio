import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · aviation fuel · notes box ----------------------------------

const FUEL_NOTES = {
  title: "Why a substitute has to be a copy",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · atmospheric science · people and a word bank --------------

const CONTRAIL_PEOPLE = ["Johanna Reuter", "Callum Beattie", "Noor Bashir", "Teodor Vasile"];
const CONTRAIL_BANK = [
  "soot",
  "ice",
  "humid",
  "night",
  "altitude",
  "warming",
  "forecast",
  "reroute",
  "cover",
];

// ---- Passage 3 · international law · lettered paragraphs -------------------

const ANTARCTIC_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ANTARCTIC_ENDINGS = [
  "because the treaty set every territorial claim aside without settling any of them.",
  "which is why a decision requires every consultative party to agree.",
  "since a country must run a research programme to earn a vote.",
  "although the ban on mining has no expiry date and is often said to have one.",
  "because the krill fishery is regulated by a separate body with a different membership.",
  "even though the continent has no permanent population to represent.",
  "which makes inspection by any party the only enforcement the system has.",
];

export const TEST_100: CuratedTest = {
  key: "full-test-100",
  targetBand: 5,
  passages: [
    {
      key: "t100-p1-aviation-fuel",
      title: "Fuel Made from Used Oil",
      topic: "the one part of transport that cannot simply be plugged in",
      difficulty: 4,
      body: `Most of transport can be electrified. A car, a bus, a train and a short-sea ferry can all carry a battery of the required size, and the technology to do it exists. An airliner cannot. The reason is the energy stored in a kilogram: aviation kerosene holds roughly fifty times as much usable energy per kilogram as the best current battery, and an aircraft must carry its fuel with it and lift it. A battery-powered airliner on a long route would spend almost all its capacity carrying its own energy supply, and the arithmetic is not close. The gap is not the sort that a better battery closes by a few per cent; it is a gap of more than an order of magnitude, and no chemistry now known would close it.

That leaves fuel, and the fuel has to be a near copy of the one already in use. An existing aircraft engine, an existing fuel system and an existing airport are all designed around the properties of kerosene: its freezing point, its energy density, its behaviour as a lubricant in the fuel pump, its viscosity at forty degrees below zero. A replacement that requires a new engine is not a replacement for the eighteen thousand aircraft already flying, and those aircraft will be in service for another twenty to thirty years. The industry therefore wants what it calls a drop-in fuel: chemically similar enough to be blended with the conventional product and burned in an unmodified engine.

Several routes produce such a fuel. The one in commercial use is hydroprocessed fats and oils: used cooking oil, animal fat from meat processing, and residues from vegetable oil refining are treated with hydrogen at high temperature and pressure, which removes the oxygen and rearranges the molecules into hydrocarbons in the kerosene range. The product is genuinely indistinguishable in use. It is also limited, because the world does not produce very much used cooking oil compared with the amount of jet fuel it burns — the entire global supply of waste fats would cover only a small percentage of aviation demand.

The second route uses alcohols, chiefly ethanol, converted into jet-range hydrocarbons through a sequence of chemical steps. The feedstock can be agricultural residue rather than food crops, which avoids the objection that has dogged biofuel for two decades, and the process is more complex and more expensive. The third route, and the only one without a feedstock limit, is synthesis from carbon dioxide and hydrogen using renewable electricity. It works, it has been demonstrated at pilot scale, and it currently costs several times the price of conventional fuel because it requires an enormous amount of electricity.

The honest position on cost is that all of these are more expensive, and the gap is between roughly double and roughly eight times, depending on route. Fuel is about a quarter of an airline's operating cost, so a doubling of the fuel price is a large but survivable change in ticket prices, and an eight-fold increase is not. Policy has therefore concentrated on blending mandates — requiring a rising percentage of alternative fuel in the mix — which spreads the cost thinly and guarantees a market that would not otherwise exist.

There is a counting problem that deserves attention. A fuel made from used cooking oil is only low-carbon if the oil was genuinely waste. Where a mandate creates demand, the price of used oil rises, and there are documented cases of fresh palm oil being sold as used, and of oil being imported across the world to qualify. The certification schemes that are supposed to prevent this are auditing a claim about the past of a liquid, which is a genuinely hard thing to verify.

Hydrogen and battery aircraft are not absent from the picture; they are absent from the long routes. A regional aircraft carrying fifty people three hundred kilometres is a plausible battery application within a decade, and hydrogen may serve short and medium routes if the airport infrastructure is built. But the long flights generate the great majority of aviation's emissions, and for those there is no proposal on the table other than a liquid fuel that behaves like kerosene and costs more. That is an unsatisfying conclusion and it is the one the engineering supports.`,
      questions: [
        tfng(
          "Batteries hold far less usable energy per kilogram than kerosene.",
          "TRUE",
          "The reason is the energy stored in a kilogram: aviation kerosene holds roughly fifty times as much usable energy per kilogram as the best current battery, and an aircraft must carry its fuel with it and lift it.",
          "Roughly fifty times as much per kilogram.",
        ),
        tfng(
          "A replacement fuel could require a redesigned engine without difficulty.",
          "FALSE",
          "A replacement that requires a new engine is not a replacement for the eighteen thousand aircraft already flying, and those aircraft will be in service for another twenty to thirty years.",
          "It would not serve the existing fleet.",
        ),
        tfng(
          "Fuel made from waste fats performs differently from conventional kerosene.",
          "FALSE",
          "The product is genuinely indistinguishable in use.",
          "It is 'genuinely indistinguishable in use'.",
        ),
        tfng(
          "Waste fats could supply most of the world's jet fuel demand.",
          "FALSE",
          "It is also limited, because the world does not produce very much used cooking oil compared with the amount of jet fuel it burns — the entire global supply of waste fats would cover only a small percentage of aviation demand.",
          "It would cover only a small percentage.",
        ),
        tfng(
          "The alcohol route can use agricultural residue rather than food crops.",
          "TRUE",
          "The feedstock can be agricultural residue rather than food crops, which avoids the objection that has dogged biofuel for two decades, and the process is more complex and more expensive.",
          "Residue can be the feedstock.",
        ),
        tfng(
          "Synthesis from carbon dioxide has an upper limit on feedstock.",
          "FALSE",
          "The third route, and the only one without a feedstock limit, is synthesis from carbon dioxide and hydrogen using renewable electricity.",
          "It is 'the only one without a feedstock limit'.",
        ),
        tfng(
          "The European Union's blending mandate begins at two per cent.",
          "NOT GIVEN",
          "",
          "The passage discusses mandates in general but gives no percentage.",
        ),
        noteLine(
          FUEL_NOTES,
          null,
          "Engines are designed around kerosene's ______ point",
          "freezing",
          "An existing aircraft engine, an existing fuel system and an existing airport are all designed around the properties of kerosene: its freezing point, its energy density, its behaviour as a lubricant in the fuel pump, its viscosity at forty degrees below zero.",
          "The freezing point is one of the properties.",
          { before: [{ text: "Constraints on any substitute:", indent: 0 }] },
        ),
        noteLine(
          FUEL_NOTES,
          null,
          "The fuel also acts as a ______ in the pump",
          "lubricant",
          "An existing aircraft engine, an existing fuel system and an existing airport are all designed around the properties of kerosene: its freezing point, its energy density, its behaviour as a lubricant in the fuel pump, its viscosity at forty degrees below zero.",
          "It lubricates the fuel pump.",
        ),
        noteLine(
          FUEL_NOTES,
          null,
          "A substitute must burn in an ______ engine",
          "unmodified",
          "The industry therefore wants what it calls a drop-in fuel: chemically similar enough to be blended with the conventional product and burned in an unmodified engine.",
          "It must burn in an unmodified engine.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Waste fats are treated with ______ at high temperature and pressure.",
          "hydrogen",
          "The one in commercial use is hydroprocessed fats and oils: used cooking oil, animal fat from meat processing, and residues from vegetable oil refining are treated with hydrogen at high temperature and pressure, which removes the oxygen and rearranges the molecules into hydrocarbons in the kerosene range.",
          "Hydrogen does the treating.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Fuel is about a ______ of an airline's operating cost.",
          "quarter",
          "Fuel is about a quarter of an airline's operating cost, so a doubling of the fuel price is a large but survivable change in ticket prices, and an eight-fold increase is not.",
          "It is about a quarter.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Certifiers must verify a claim about the ______ of a liquid.",
          "past",
          "The certification schemes that are supposed to prevent this are auditing a claim about the past of a liquid, which is a genuinely hard thing to verify.",
          "The claim concerns the liquid's past.",
        ),
      ],
    },
    {
      key: "t100-p2-contrails",
      title: "The Lines the Aircraft Leave",
      topic: "an effect on the climate that has nothing to do with fuel burned",
      difficulty: 5,
      body: `An aircraft engine emits water vapour, and at the temperatures found at cruising altitude that vapour freezes almost immediately onto particles in the exhaust, forming a line of ice crystals. Most such lines evaporate within minutes, because the air at that altitude is usually far too dry to sustain them. Some do not: where the surrounding air is already close to saturated with respect to ice, the trail draws in more moisture, spreads, and can persist for hours, eventually becoming indistinguishable from natural cirrus cloud. A single aircraft can leave a band of cloud tens of kilometres wide, and a busy corridor on the right morning can produce an overcast where the sky would otherwise have been clear.

Johanna Reuter, an atmospheric physicist, explains why this matters for the climate rather than merely for the appearance of the sky. A thin high cloud is nearly transparent to incoming sunlight and fairly opaque to outgoing infrared radiation, so it warms the surface beneath it. She emphasises the magnitude, which is what surprises people: the best current estimates put the warming from persistent contrail cirrus at roughly the same size as the warming from all the carbon dioxide aviation has ever emitted, and possibly larger.

The two effects are entirely different in character, and Callum Beattie, who models the comparison, argues that treating them as a single number is the main source of confusion in the public discussion. Carbon dioxide accumulates and its effect lasts for centuries; a contrail warms for a day. If flying stopped tomorrow, the contrail effect would end the next day and the carbon dioxide effect would persist for hundreds of years. He describes them as a stock and a flow, and notes that a policy that reduced contrails at the cost of burning slightly more fuel might be beneficial or harmful depending entirely on the ratio, and that the ratio is calculable.

The distribution is very uneven, and this is the encouraging part. Noor Bashir, who has analysed flight data against atmospheric conditions, reports that a small minority of flights produce the great majority of the persistent contrails, because persistence requires the aircraft to be passing through a region that is already ice-supersaturated, and such regions are patchy. In several studies around two per cent of flights account for roughly eighty per cent of the effect. She adds a second asymmetry: a contrail formed during the day both reflects sunlight and traps heat, which partly cancel, while one formed at night only traps heat, so night flights matter disproportionately.

That combination suggests an intervention. If the damaging flights are few and identifiable, a small change of altitude — a few thousand feet, up or down, out of the humid layer — would prevent the contrail forming at all. Teodor Vasile, who has worked on trials of this with air traffic controllers, reports that the manoeuvre is operationally straightforward and that the difficulty is the forecast: humidity at altitude is the least well measured quantity in the atmosphere, radiosonde data are sparse, and a model that says a region is supersaturated is right rather less often than one would like. He regards improving humidity forecasting as the binding constraint, and notes that the aircraft themselves could supply much of the missing data if they were equipped to report it.

The fuel penalty of a diversion is small but not nothing: flying lower burns more fuel, and if the forecast is wrong the flight has burned the extra fuel for no benefit. Early trials with commercial airlines have reported net benefits on the cases where the forecast was reliable, and the honest summary is that the approach is promising and not yet proven at scale. It is also, unusually for a climate measure in aviation, cheap: the cost is a small quantity of fuel and some work by controllers, not a new aircraft.

There is one further complication with an unexpected source. Cleaner fuel produces fewer soot particles, and fewer particles mean fewer, larger ice crystals, which fall out of the sky faster. Low-sulphur and synthetic fuels therefore reduce contrail formation as a side effect of reducing local air pollution, which is a rare case of two environmental objectives pointing the same way, and it was discovered rather than designed.`,
      questions: [
        fromList(
          "matching_features",
          CONTRAIL_PEOPLE,
          "The warming from these clouds may exceed that from the industry's carbon dioxide.",
          "Johanna Reuter",
          "She emphasises the magnitude, which is what surprises people: the best current estimates put the warming from persistent contrail cirrus at roughly the same size as the warming from all the carbon dioxide aviation has ever emitted, and possibly larger.",
          "Reuter gives the magnitude.",
        ),
        fromList(
          "matching_features",
          CONTRAIL_PEOPLE,
          "Combining the two effects into one figure causes confusion.",
          "Callum Beattie",
          "The two effects are entirely different in character, and Callum Beattie, who models the comparison, argues that treating them as a single number is the main source of confusion in the public discussion.",
          "Beattie objects to the single number.",
        ),
        fromList(
          "matching_features",
          CONTRAIL_PEOPLE,
          "A very small share of flights causes most of the problem.",
          "Noor Bashir",
          "Noor Bashir, who has analysed flight data against atmospheric conditions, reports that a small minority of flights produce the great majority of the persistent contrails, because persistence requires the aircraft to be passing through a region that is already ice-supersaturated, and such regions are patchy.",
          "Bashir reports the concentration.",
        ),
        fromList(
          "matching_features",
          CONTRAIL_PEOPLE,
          "The obstacle is predicting the conditions, not making the manoeuvre.",
          "Teodor Vasile",
          "He regards improving humidity forecasting as the binding constraint, and notes that the aircraft themselves could supply much of the missing data if they were equipped to report it.",
          "Vasile names forecasting as the constraint.",
        ),
        fromList(
          "summary_completion",
          CONTRAIL_BANK,
          "Water vapour freezes onto exhaust particles as ______ crystals.",
          "ice",
          "An aircraft engine emits water vapour, and at the temperatures found at cruising altitude that vapour freezes almost immediately onto particles in the exhaust, forming a line of ice crystals.",
          "The crystals are ice.",
        ),
        fromList(
          "summary_completion",
          CONTRAIL_BANK,
          "A trail persists only where the surrounding air is already ______.",
          "humid",
          "Some do not: where the surrounding air is already close to saturated with respect to ice, the trail draws in more moisture, spreads, and can persist for hours, eventually becoming indistinguishable from natural cirrus cloud.",
          "The air must be near saturation.",
        ),
        fromList(
          "summary_completion",
          CONTRAIL_BANK,
          "A trail formed at ______ traps heat without reflecting any sunlight.",
          "night",
          "She adds a second asymmetry: a contrail formed during the day both reflects sunlight and traps heat, which partly cancel, while one formed at night only traps heat, so night flights matter disproportionately.",
          "At night there is no reflection.",
        ),
        fromList(
          "summary_completion",
          CONTRAIL_BANK,
          "A change of ______ of a few thousand feet can prevent formation.",
          "altitude",
          "If the damaging flights are few and identifiable, a small change of altitude — a few thousand feet, up or down, out of the humid layer — would prevent the contrail forming at all.",
          "Altitude is the lever.",
        ),
        fromList(
          "summary_completion",
          CONTRAIL_BANK,
          "Cleaner fuel produces less ______ and therefore fewer crystals.",
          "soot",
          "Cleaner fuel produces fewer soot particles, and fewer particles mean fewer, larger ice crystals, which fall out of the sky faster.",
          "Less soot means fewer crystals.",
        ),
        mcq(
          "Why does a thin high cloud warm the surface?",
          [
            "It lets sunlight through and holds infrared in",
            "It reflects sunlight back to the ground",
            "It absorbs sunlight and re-emits it downwards",
            "It prevents convection below it",
          ],
          "It lets sunlight through and holds infrared in",
          "A thin high cloud is nearly transparent to incoming sunlight and fairly opaque to outgoing infrared radiation, so it warms the surface beneath it.",
          "Transparent to sunlight, opaque to infrared.",
        ),
        mcq(
          "What would happen to each effect if flying stopped?",
          [
            "Contrails would end at once and carbon dioxide would persist",
            "Both would end within a year",
            "Both would persist for centuries",
            "Contrails would persist and carbon dioxide would clear",
          ],
          "Contrails would end at once and carbon dioxide would persist",
          "If flying stopped tomorrow, the contrail effect would end the next day and the carbon dioxide effect would persist for hundreds of years.",
          "One ends the next day, the other lasts centuries.",
        ),
        mcq(
          "What is the risk of diverting a flight on a wrong forecast?",
          [
            "Extra fuel is burned for no benefit",
            "The aircraft creates a larger contrail",
            "Air traffic control loses separation",
            "The engines run outside their design range",
          ],
          "Extra fuel is burned for no benefit",
          "The fuel penalty of a diversion is small but not nothing: flying lower burns more fuel, and if the forecast is wrong the flight has burned the extra fuel for no benefit.",
          "The extra fuel achieves nothing.",
        ),
        mcq(
          "Why does the writer call the fuel finding unusual?",
          [
            "Two environmental aims point the same way",
            "It was predicted long in advance",
            "It reduces carbon dioxide as well",
            "It applies only to synthetic fuel",
          ],
          "Two environmental aims point the same way",
          "Low-sulphur and synthetic fuels therefore reduce contrail formation as a side effect of reducing local air pollution, which is a rare case of two environmental objectives pointing the same way, and it was discovered rather than designed.",
          "Two objectives align, which is rare.",
        ),
      ],
    },
    {
      key: "t100-p3-antarctic-treaty",
      title: "The Continent Nobody Owns",
      topic: "an agreement that solved a territorial dispute by refusing to answer it",
      difficulty: 6,
      body: `A) Seven countries claim territory in Antarctica. Several of the claims overlap, two of the claimants do not recognise each other's, one large sector is claimed by nobody, and two of the most active states on the continent have never made a claim while reserving the right to do so. In 1959 this was an active dispute with military potential, and the agreement that resolved it did so by a device of some elegance: it neither accepted nor rejected any claim, and it prohibited any activity that would strengthen or weaken one. The claims are still there. They have simply been placed in suspension for sixty-five years.

B) The Antarctic Treaty itself is short. It reserves the continent for peaceful purposes, prohibits military bases and weapons testing, bans nuclear explosions and radioactive waste disposal, guarantees freedom of scientific investigation, and requires the exchange of research plans and results. Its most unusual provision is inspection: any party may send observers to inspect any station, installation or ship anywhere in the treaty area, at any time, with no notice and no right of refusal. There is no international inspectorate; the parties inspect each other, and they do.

C) Membership has two tiers, and the distinction is the mechanism that keeps the system functioning. Any state may accede to the treaty, and more than fifty have. Only those conducting substantial scientific research there become consultative parties with a vote, which means the right to decide is tied to the willingness to fund a presence. It is a deliberate barrier and it has been criticised as one, since it excludes states that cannot afford a research programme; it also means that the countries making decisions are the ones with an operational stake in the outcome.

D) Decisions require consensus among the consultative parties, of which there are now twenty-nine. This is the system's greatest strength and its principal weakness. Nothing can be imposed on an unwilling party, which is why the arrangement has survived without enforcement machinery; equally, any single party can prevent any measure, and has. The record shows both: agreements of real ambition adopted unanimously, and necessary measures blocked for years by one state's objection.

E) The most significant later addition is the 1991 Protocol on Environmental Protection, which designates the continent a natural reserve devoted to peace and science and prohibits all mineral resource activity other than scientific research. The prohibition is often described as expiring in 2048, and this is wrong in a way worth correcting: the ban has no end date. What 2048 brings is the first year in which any consultative party may request a conference to review the protocol, and any change would still require agreement by a large majority including all the current consultative parties. The distinction between a ban that lapses and a ban that becomes reviewable is not a technicality.

F) Fishing sits outside the main structure and is where the pressure is greatest. Living marine resources are governed by a separate convention with its own commission and a membership that is not identical, and it works by consensus too. The krill fishery is the case that matters: krill is the base of the food web for whales, seals, penguins and fish, the catch has been rising, and proposals for large marine protected areas have been blocked repeatedly by a small number of fishing states. A system built to manage science has proved much less effective at managing an industry.

G) The treaty is nonetheless the most successful piece of international environmental law there is, and it is worth being clear about why, because the reasons are not transferable. There is no indigenous population whose rights must be settled, no resident electorate, no established industry with assets to defend, and no proven economically recoverable mineral deposit. The parties agreed to set aside their claims over a place where none of them had anything immediate to lose. None of those conditions holds in the Arctic, which has residents, governments, fisheries and oil, and which has no comparable agreement. That is not a criticism of the achievement. It is an explanation of it, and it suggests why the same approach has never worked anywhere that people actually live.`,
      questions: [
        fromList(
          "matching_information",
          ANTARCTIC_PARAGRAPHS,
          "a widely repeated misunderstanding about a date",
          "E",
          "The prohibition is often described as expiring in 2048, and this is wrong in a way worth correcting: the ban has no end date.",
          "Paragraph E corrects the 2048 claim.",
        ),
        fromList(
          "matching_information",
          ANTARCTIC_PARAGRAPHS,
          "a provision allowing unannounced visits to any facility",
          "B",
          "Its most unusual provision is inspection: any party may send observers to inspect any station, installation or ship anywhere in the treaty area, at any time, with no notice and no right of refusal.",
          "Paragraph B describes the inspection right.",
        ),
        fromList(
          "matching_information",
          ANTARCTIC_PARAGRAPHS,
          "the reason the arrangement needs no enforcement machinery",
          "D",
          "Nothing can be imposed on an unwilling party, which is why the arrangement has survived without enforcement machinery; equally, any single party can prevent any measure, and has.",
          "Paragraph D links consensus to the absence of enforcement.",
        ),
        fromList(
          "matching_information",
          ANTARCTIC_PARAGRAPHS,
          "a resource whose management sits outside the main agreement",
          "F",
          "Living marine resources are governed by a separate convention with its own commission and a membership that is not identical, and it works by consensus too.",
          "Paragraph F describes the separate fisheries regime.",
        ),
        fromList(
          "matching_information",
          ANTARCTIC_PARAGRAPHS,
          "the device by which a dispute was left unresolved on purpose",
          "A",
          "In 1959 this was an active dispute with military potential, and the agreement that resolved it did so by a device of some elegance: it neither accepted nor rejected any claim, and it prohibited any activity that would strengthen or weaken one.",
          "Paragraph A explains the suspension of claims.",
        ),
        ynng(
          "The writer thinks the two-tier membership is entirely indefensible.",
          "NO",
          "It is a deliberate barrier and it has been criticised as one, since it excludes states that cannot afford a research programme; it also means that the countries making decisions are the ones with an operational stake in the outcome.",
          "The writer gives it a defence as well.",
        ),
        ynng(
          "The writer regards consensus decision-making as both a strength and a flaw.",
          "YES",
          "This is the system's greatest strength and its principal weakness.",
          "The writer says it is both.",
        ),
        ynng(
          "The writer believes the system has handled fishing as well as it has handled science.",
          "NO",
          "A system built to manage science has proved much less effective at managing an industry.",
          "It is 'much less effective' at the industry.",
        ),
        ynng(
          "The writer thinks the treaty's success could be reproduced in inhabited regions.",
          "NO",
          "It is an explanation of it, and it suggests why the same approach has never worked anywhere that people actually live.",
          "It has 'never worked anywhere that people actually live'.",
        ),
        fromList(
          "matching_sentence_endings",
          ANTARCTIC_ENDINGS,
          "Overlapping claims have caused no conflict since 1959,",
          "because the treaty set every territorial claim aside without settling any of them.",
          "The claims are still there. They have simply been placed in suspension for sixty-five years.",
          "The claims were suspended, not settled.",
        ),
        fromList(
          "matching_sentence_endings",
          ANTARCTIC_ENDINGS,
          "There is no international body policing the continent,",
          "which makes inspection by any party the only enforcement the system has.",
          "There is no international inspectorate; the parties inspect each other, and they do.",
          "The parties inspect each other.",
        ),
        fromList(
          "matching_sentence_endings",
          ANTARCTIC_ENDINGS,
          "Not every signatory has a say in decisions,",
          "since a country must run a research programme to earn a vote.",
          "Only those conducting substantial scientific research there become consultative parties with a vote, which means the right to decide is tied to the willingness to fund a presence.",
          "A vote requires a research presence.",
        ),
        fromList(
          "matching_sentence_endings",
          ANTARCTIC_ENDINGS,
          "A single objection can stop any measure,",
          "which is why a decision requires every consultative party to agree.",
          "Decisions require consensus among the consultative parties, of which there are now twenty-nine.",
          "Consensus is required.",
        ),
        fromList(
          "matching_sentence_endings",
          ANTARCTIC_ENDINGS,
          "Protection of the krill has repeatedly failed,",
          "because the krill fishery is regulated by a separate body with a different membership.",
          "The krill fishery is the case that matters: krill is the base of the food web for whales, seals, penguins and fish, the catch has been rising, and proposals for large marine protected areas have been blocked repeatedly by a small number of fishing states.",
          "A separate body with fishing states governs it.",
        ),
      ],
    },
  ],
};
