import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · land reclamation · notes box -------------------------------

const POLDER_NOTES = {
  title: "Making a polder",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · ancient engineering · people and a word bank --------------

const AQUEDUCT_PEOPLE = ["Livia Tornetti", "Hasan Qureshi", "Eleni Drakos", "Martin Fabre"];
const AQUEDUCT_BANK = [
  "gradient",
  "siphon",
  "arches",
  "settling",
  "lead",
  "fountains",
  "survey",
  "limescale",
  "tunnels",
];

// ---- Passage 3 · water supply · lettered paragraphs ------------------------

const LEAK_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const LEAK_ENDINGS = [
  "because water escaping under pressure makes a noise the pipe carries for hundreds of metres.",
  "which is why the cheapest saving is often to lower the pressure at night.",
  "since a leak that surfaces is reported by the public and repaired quickly.",
  "although the utility that loses the water is not the party that pays for the energy.",
  "because a pipe replaced today will not need attention for eighty years.",
  "even though a quarter of the water put into some systems never reaches a customer.",
  "which makes the economically correct level of leakage greater than zero.",
];

export const TEST_95: CuratedTest = {
  key: "full-test-95",
  targetBand: 5,
  passages: [
    {
      key: "t95-p1-polders",
      title: "Making Land Out of Water",
      topic: "how a country built about a fifth of itself",
      difficulty: 4,
      body: `Roughly a quarter of the Netherlands lies below sea level, and about half of it would flood regularly without deliberate defence. A large part of the country is not natural land at all. It is polder: ground that was once lake, marsh or seabed, enclosed by a dyke, emptied of water, and kept dry by pumping ever since.

The sequence is always the same. First a dyke is built around the area to be drained, which is the expensive part and has to be done from boats and barges in open water. Then a ring canal is dug outside the dyke to carry away the water that will be removed and to intercept groundwater flowing towards the site. Then the enclosed water is pumped out. Then, and this is the part that continues indefinitely, the new land is drained by a network of ditches feeding pumps that lift the water up into the ring canal, because the land inside a polder is lower than the water outside it and rain falling on it has nowhere to go by gravity.

The pumping was done for centuries by windmills, and the practical limit of one mill was a lift of about a metre and a half. Deeper polders were drained by arranging mills in a staircase, each lifting the water part of the way, which required precise coordination and a great many mills. The Beemster, drained in the early seventeenth century, used dozens, arranged in sequences whose failure at any point stopped the whole chain. Steam pumping in the nineteenth century removed the limit, and the draining of the Haarlemmermeer, a lake of some eighteen thousand hectares, was completed in 1852 with three steam engines.

Once drained, the land does something inconvenient. Peat soils, which much of the low Netherlands consists of, shrink as they dry and oxidise as they are exposed to air, so the surface sinks. A polder drained to a metre below sea level in 1650 may now be three metres below it, and the subsidence continues as long as the land is drained. Lowering the water table to keep the fields workable accelerates the sinking, which requires the water table to be lowered again. It is a process with no stable end point, and it is the reason the country's drainage burden grows rather than shrinks. Some of the deepest polders are now further below sea level than the engineers who drained them ever intended, and the pumps have been enlarged repeatedly to match.

The largest works were twentieth-century. The Zuiderzee, a shallow inland sea, was closed off by a thirty-kilometre barrier dam completed in 1932, converting it from salt water to a freshwater lake and removing a long stretch of vulnerable coast from the sea's reach at a stroke. Large polders were then created inside it, adding a new province, with new towns laid out on ground that had been under water within the lifetime of the people who moved into them. After a catastrophic flood in 1953 killed more than eighteen hundred people, a second programme closed most of the south-western estuaries with dams and movable barriers.

The thinking has since changed, and the change is instructive. The engineering response to a flood risk is a higher dyke, and a higher dyke means that when it fails the water arrives faster and deeper. Dutch policy from the 1990s onwards has deliberately moved in the other direction, under a programme whose name translates as Room for the River: deepening floodplains, moving dykes back from the water, and designating areas that will be allowed to flood in an extreme event in order to protect others. Several polders reclaimed at great expense have been given back to the water as controlled flood storage, which is a difficult thing for any country to do and a particularly difficult thing for this one.

The final plan for a further large polder in the Zuiderzee, drawn up decades ago, has not been built and now probably never will be. The land is not needed for agriculture, the lake is valued as a habitat and a water reserve, and the cost of maintaining a new polder forever is calculated differently than it was in 1930. A country that spent four centuries converting water into land has begun, carefully and in places, to do the reverse.`,
      questions: [
        tfng(
          "Some parts of the Netherlands are entirely artificial ground.",
          "TRUE",
          "It is polder: ground that was once lake, marsh or seabed, enclosed by a dyke, emptied of water, and kept dry by pumping ever since.",
          "Polder is made ground.",
        ),
        tfng(
          "Rain falling on a polder drains away by gravity.",
          "FALSE",
          "Then, and this is the part that continues indefinitely, the new land is drained by a network of ditches feeding pumps that lift the water up into the ring canal, because the land inside a polder is lower than the water outside it and rain falling on it has nowhere to go by gravity.",
          "It 'has nowhere to go by gravity'.",
        ),
        tfng(
          "A single windmill could lift water about a metre and a half.",
          "TRUE",
          "The pumping was done for centuries by windmills, and the practical limit of one mill was a lift of about a metre and a half.",
          "The limit was about a metre and a half.",
        ),
        tfng(
          "Draining peat land stops it from sinking further.",
          "FALSE",
          "Peat soils, which much of the low Netherlands consists of, shrink as they dry and oxidise as they are exposed to air, so the surface sinks.",
          "Draining causes the sinking.",
        ),
        tfng(
          "The Zuiderzee barrier turned salt water into fresh.",
          "TRUE",
          "The Zuiderzee, a shallow inland sea, was closed off by a thirty-kilometre barrier dam completed in 1932, converting it from salt water to a freshwater lake and removing a long stretch of vulnerable coast from the sea's reach at a stroke.",
          "It became a freshwater lake.",
        ),
        tfng(
          "Current policy relies mainly on building dykes higher.",
          "FALSE",
          "Dutch policy from the 1990s onwards has deliberately moved in the other direction, under a programme whose name translates as Room for the River: deepening floodplains, moving dykes back from the water, and designating areas that will be allowed to flood in an extreme event in order to protect others.",
          "Policy moved 'in the other direction'.",
        ),
        tfng(
          "Belgium adopted the same flood policy after 1953.",
          "NOT GIVEN",
          "",
          "The passage discusses Dutch policy only.",
        ),
        noteLine(
          POLDER_NOTES,
          "Step 1",
          "Build a ______ around the area, working from boats",
          "dyke",
          "First a dyke is built around the area to be drained, which is the expensive part and has to be done from boats and barges in open water.",
          "The dyke comes first.",
        ),
        noteLine(
          POLDER_NOTES,
          "Step 2",
          "Dig a ring ______ outside it to take the water away",
          "canal",
          "Then a ring canal is dug outside the dyke to carry away the water that will be removed and to intercept groundwater flowing towards the site.",
          "A ring canal is dug.",
        ),
        noteLine(
          POLDER_NOTES,
          "Step 3 — forever",
          "______ lift rain and seepage up into the ring canal",
          "Pumps",
          "Then, and this is the part that continues indefinitely, the new land is drained by a network of ditches feeding pumps that lift the water up into the ring canal, because the land inside a polder is lower than the water outside it and rain falling on it has nowhere to go by gravity.",
          "Pumps do the lifting.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Deep polders were drained by arranging mills in a ______.",
          "staircase",
          "Deeper polders were drained by arranging mills in a staircase, each lifting the water part of the way, which required precise coordination and a great many mills.",
          "They were arranged in a staircase.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The Haarlemmermeer was drained with three ______ engines.",
          "steam",
          "Steam pumping in the nineteenth century removed the limit, and the draining of the Haarlemmermeer, a lake of some eighteen thousand hectares, was completed in 1852 with three steam engines.",
          "Three steam engines did it.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Some reclaimed polders are now used as controlled flood ______.",
          "storage",
          "Several polders reclaimed at great expense have been given back to the water as controlled flood storage, which is a difficult thing for any country to do and a particularly difficult thing for this one.",
          "They are flood storage now.",
        ),
      ],
    },
    {
      key: "t95-p2-aqueducts",
      title: "Water Carried by Gravity Alone",
      topic: "the engineering achievement that is usually admired for the wrong part",
      difficulty: 5,
      body: `The Roman aqueduct that most people picture is a row of tall arches crossing a valley. Those arches are the part that survives, being the part built of dressed stone in the open air, and they are the least representative part of any aqueduct. A typical Roman aqueduct ran mostly underground, in a covered channel following the contour of the land, and the bridge was what you built when the contour ran out.

Livia Tornetti, an archaeologist of Roman water supply, considers the underground majority the real achievement. Of the roughly four hundred kilometres supplying the city of Rome, a small fraction was carried on arches; the rest was cut through rock or laid in trench, at a gradient that had to be held within a narrow range for many kilometres at a time. Too steep and the water runs fast enough to scour the channel; too shallow and it stops and silts up. She points out that the difficulty is not the building but the surveying, and that the tolerance required is a few centimetres per kilometre over terrain the surveyor could not see across.

The instruments were simple. A chorobates was a wooden bench several metres long with a water channel cut into its top, used as a level; a groma provided right angles; and sighting poles allowed a line to be extended over a hill. Hasan Qureshi, who has reconstructed and tested these tools, reports that in field trials they are accurate to within about the required tolerance, but only with repeated measurement and correction, and that the labour of the survey may have exceeded that of some of the digging. He argues that the aqueducts are best understood as the product of an institution capable of sustaining a measurement programme for years, rather than of any individual cleverness.

There was one piece of genuinely counter-intuitive engineering. Where a valley was too deep to bridge, the water was taken down one side, across the bottom in sealed pipes under pressure, and up the other side to a level slightly lower than where it started — an inverted siphon. Eleni Drakos, who studies pressurised ancient systems, emphasises how demanding this was: the pipes, usually lead, had to withstand many atmospheres of pressure, and the greatest known example, at Pergamon, worked under a head of nearly two hundred metres. She notes that siphons were used sparingly, not because the Romans doubted the principle but because the lead was expensive and a burst was very difficult to find and repair.

The water arrived continuously and was not turned off. There were no taps on the distribution system; the flow ran day and night into public fountains, baths and a few private houses, and the overflow washed through the sewers. Martin Fabre, a historian of sanitation, regards this as the feature with the largest consequences and the one modern readers find hardest to accept: the system was designed around constant flow because a constant flow keeps a channel clean and a stored volume does not, and the price of that design was that a Roman city used an enormous quantity of water per head, much of it for no purpose beyond keeping the pipes and drains moving.

Lead has attracted more attention than it deserves. Roman writers were aware that lead was unhealthy and Vitruvius recommends earthenware pipes on those grounds. The water of central Italy is hard, and a lead pipe carrying hard water rapidly acquires an internal coating of limescale which separates the metal from the water. Measurements of Roman skeletal lead are elevated but the largest exposures appear to have come from cooking vessels and from a grape syrup boiled in lead pans, rather than from the pipes.

The aqueducts also required maintenance forever, which is the ordinary fate of infrastructure and the reason so many failed. A channel needed clearing of limescale, the covering slabs needed replacing, and the whole length needed inspecting by a permanent staff. When the administration that paid for the staff stopped functioning, the aqueducts stopped working, in most cases without being damaged at all. Rome's population fell from perhaps a million to a few tens of thousands, and the reason was not that the water supply was destroyed. It was that nobody was clearing the channels.`,
      questions: [
        fromList(
          "matching_features",
          AQUEDUCT_PEOPLE,
          "The surveying rather than the construction was the hard part.",
          "Livia Tornetti",
          "She points out that the difficulty is not the building but the surveying, and that the tolerance required is a few centimetres per kilometre over terrain the surveyor could not see across.",
          "Tornetti names the surveying.",
        ),
        fromList(
          "matching_features",
          AQUEDUCT_PEOPLE,
          "The works reflect a sustained institution rather than individual genius.",
          "Hasan Qureshi",
          "He argues that the aqueducts are best understood as the product of an institution capable of sustaining a measurement programme for years, rather than of any individual cleverness.",
          "Qureshi credits the institution.",
        ),
        fromList(
          "matching_features",
          AQUEDUCT_PEOPLE,
          "One technique was avoided because of cost and repair difficulty.",
          "Eleni Drakos",
          "She notes that siphons were used sparingly, not because the Romans doubted the principle but because the lead was expensive and a burst was very difficult to find and repair.",
          "Drakos explains the sparing use.",
        ),
        fromList(
          "matching_features",
          AQUEDUCT_PEOPLE,
          "The continuous flow was deliberate and had a large hidden cost.",
          "Martin Fabre",
          "Martin Fabre, a historian of sanitation, regards this as the feature with the largest consequences and the one modern readers find hardest to accept: the system was designed around constant flow because a constant flow keeps a channel clean and a stored volume does not, and the price of that design was that a Roman city used an enormous quantity of water per head, much of it for no purpose beyond keeping the pipes and drains moving.",
          "Fabre explains the constant flow.",
        ),
        fromList(
          "summary_completion",
          AQUEDUCT_BANK,
          "The channel had to hold a very precise ______ over long distances.",
          "gradient",
          "Of the roughly four hundred kilometres supplying the city of Rome, a small fraction was carried on arches; the rest was cut through rock or laid in trench, at a gradient that had to be held within a narrow range for many kilometres at a time.",
          "The gradient had to be held narrowly.",
        ),
        fromList(
          "summary_completion",
          AQUEDUCT_BANK,
          "Most of the length ran underground in trench or ______.",
          "tunnels",
          "A typical Roman aqueduct ran mostly underground, in a covered channel following the contour of the land, and the bridge was what you built when the contour ran out.",
          "The route was mostly underground.",
        ),
        fromList(
          "summary_completion",
          AQUEDUCT_BANK,
          "The work required a repeated ______ rather than a single measurement.",
          "survey",
          "Hasan Qureshi, who has reconstructed and tested these tools, reports that in field trials they are accurate to within about the required tolerance, but only with repeated measurement and correction, and that the labour of the survey may have exceeded that of some of the digging.",
          "The survey had to be repeated.",
        ),
        fromList(
          "summary_completion",
          AQUEDUCT_BANK,
          "A deep valley was crossed with an inverted ______ under pressure.",
          "siphon",
          "Where a valley was too deep to bridge, the water was taken down one side, across the bottom in sealed pipes under pressure, and up the other side to a level slightly lower than where it started — an inverted siphon.",
          "The crossing is an inverted siphon.",
        ),
        fromList(
          "summary_completion",
          AQUEDUCT_BANK,
          "A coating of ______ separated a lead pipe from the water inside it.",
          "limescale",
          "The water of central Italy is hard, and a lead pipe carrying hard water rapidly acquires an internal coating of limescale which separates the metal from the water.",
          "Limescale formed a barrier.",
        ),
        mcq(
          "Why does the writer call the arches unrepresentative?",
          [
            "Most of an aqueduct ran underground",
            "They were built later than the channels",
            "They carried only overflow water",
            "They were made of a different material",
          ],
          "Most of an aqueduct ran underground",
          "A typical Roman aqueduct ran mostly underground, in a covered channel following the contour of the land, and the bridge was what you built when the contour ran out.",
          "Most of it was underground.",
        ),
        mcq(
          "What happens if the gradient is too steep?",
          [
            "The water scours the channel",
            "The water silts up and stops",
            "The channel overflows at bends",
            "The limescale forms faster",
          ],
          "The water scours the channel",
          "Too steep and the water runs fast enough to scour the channel; too shallow and it stops and silts up.",
          "Too steep scours the channel.",
        ),
        mcq(
          "Where does the writer say most Roman lead exposure came from?",
          [
            "Cooking vessels and a syrup boiled in lead",
            "The distribution pipes",
            "The siphon crossings",
            "Lead in the aqueduct channels",
          ],
          "Cooking vessels and a syrup boiled in lead",
          "Measurements of Roman skeletal lead are elevated but the largest exposures appear to have come from cooking vessels and from a grape syrup boiled in lead pans, rather than from the pipes.",
          "Vessels and syrup, not pipes.",
        ),
        mcq(
          "Why did the aqueducts to Rome stop working?",
          [
            "The staff who maintained them were no longer paid",
            "The channels were deliberately destroyed",
            "The springs that fed them dried up",
            "The siphons burst and could not be found",
          ],
          "The staff who maintained them were no longer paid",
          "When the administration that paid for the staff stopped functioning, the aqueducts stopped working, in most cases without being damaged at all.",
          "The administration stopped paying.",
        ),
      ],
    },
    {
      key: "t95-p3-leak-detection",
      title: "Listening for the Leak",
      topic: "why a water company accepts losing some of what it pumps",
      difficulty: 6,
      body: `A) A water distribution network is a large volume of pipe under pressure, mostly buried, mostly old, and mostly undocumented in detail. Water escapes from it continuously. The proportion that never reaches a customer is called non-revenue water, and in well-run systems it is around a tenth of what is put in; in poorly maintained ones it exceeds a third, and in a few large cities it approaches half. The global figure is commonly estimated at something over a fifth.

B) Most of that water leaves through holes too small to notice. A large burst is obvious: it floods a street, the public reports it, and it is repaired within hours. The water lost that way is a small share of the total, because the event is short. The bulk of the loss is from thousands of small leaks at joints and fittings, each losing a trickle, each invisible from the surface, and each continuing for years because nobody knows it is there. The economics of leakage is therefore mostly about finding things, not fixing them.

C) The oldest and still the most widely used detection method is listening. Water escaping from a pressurised pipe generates noise at a characteristic frequency, and the pipe carries that noise for a considerable distance. A technician with a ground microphone or an acoustic stick walks the line at night, when other noise is low, and localises the leak by comparing the sound at successive points. The method works well on metal pipes, which transmit sound efficiently, and much less well on plastic ones, which damp it — an awkward fact, since plastic is what new networks are made of.

D) The modern approach is to divide the network into district metered areas, each of a few thousand properties, with a meter on every inlet. Overnight flow into such an area, when almost nobody is using water, is a direct measure of how much is leaking, and a rise in that minimum flow indicates a new leak somewhere inside a defined and manageable area. This does not find the leak; it tells a crew which few streets to walk, which is the expensive step. Permanent acoustic sensors, left in place and reporting continuously, and satellite techniques that look for the spectral signature of treated water in soil, are both used to narrow the search further.

E) Pressure is the other lever, and it is often the cheapest one. The rate at which water escapes from a hole depends on the pressure driving it, so reducing pressure reduces loss from every existing leak at once, immediately, with no excavation. It also reduces the rate at which new leaks form, since pressure surges are what break old joints. Most networks are pressurised for the worst case — peak demand, the highest building, the furthest point — and run at that pressure all night when none of those conditions applies. Pressure management at night is consistently among the highest-return interventions available.

F) None of this points towards eliminating leakage, and the industry is explicit that it should not. Finding and repairing the last few small leaks in a network costs more than the water saved is worth, so there is a level below which further effort loses money, conventionally called the economic level of leakage. The concept is sound and it is also where the argument lives, because the calculation depends on how the water is valued. Priced at the cost of treating and pumping it, the economic level is fairly high. Priced to include the carbon of the energy used, the value of the water left in a river, and the cost of building the next reservoir, it is considerably lower, and several regulators have required companies to recalculate on that basis.

G) The underlying problem is that the asset is invisible and long-lived. A pipe laid in 1890 is still in service in many cities, its exact position is often unknown, and replacing it costs a great deal and prevents failures that would have happened decades hence. Every incentive available to a regulator operates on a five-year review period, and every consequence of underinvestment appears after it. That mismatch, rather than any deficiency in the detection technology, is the reason a quarter of the water in some systems is still running into the ground.`,
      questions: [
        fromList(
          "matching_information",
          LEAK_PARAGRAPHS,
          "why the most visible losses are not the largest",
          "B",
          "The water lost that way is a small share of the total, because the event is short.",
          "Paragraph B explains that bursts are brief.",
        ),
        fromList(
          "matching_information",
          LEAK_PARAGRAPHS,
          "a detection method that works badly on modern materials",
          "C",
          "The method works well on metal pipes, which transmit sound efficiently, and much less well on plastic ones, which damp it — an awkward fact, since plastic is what new networks are made of.",
          "Paragraph C names the plastic problem.",
        ),
        fromList(
          "matching_information",
          LEAK_PARAGRAPHS,
          "a measurement that reveals the existence but not the location of a leak",
          "D",
          "This does not find the leak; it tells a crew which few streets to walk, which is the expensive step.",
          "Paragraph D distinguishes detection from location.",
        ),
        fromList(
          "matching_information",
          LEAK_PARAGRAPHS,
          "how the way water is valued changes the target",
          "F",
          "Priced at the cost of treating and pumping it, the economic level is fairly high.",
          "Paragraph F shows the valuation shifting the target.",
        ),
        fromList(
          "matching_information",
          LEAK_PARAGRAPHS,
          "figures for how much water never reaches a customer",
          "A",
          "The proportion that never reaches a customer is called non-revenue water, and in well-run systems it is around a tenth of what is put in; in poorly maintained ones it exceeds a third, and in a few large cities it approaches half.",
          "Paragraph A gives the proportions.",
        ),
        ynng(
          "The writer thinks the industry should aim to eliminate leakage entirely.",
          "NO",
          "None of this points towards eliminating leakage, and the industry is explicit that it should not.",
          "The writer says it should not.",
        ),
        ynng(
          "The writer regards the economic level of leakage as a sound idea in principle.",
          "YES",
          "The concept is sound and it is also where the argument lives, because the calculation depends on how the water is valued.",
          "'The concept is sound'.",
        ),
        ynng(
          "The writer believes detection technology is the main obstacle to reducing losses.",
          "NO",
          "That mismatch, rather than any deficiency in the detection technology, is the reason a quarter of the water in some systems is still running into the ground.",
          "The mismatch, not the technology, is the reason.",
        ),
        ynng(
          "The writer thinks regulatory review periods are too short for the asset involved.",
          "YES",
          "Every incentive available to a regulator operates on a five-year review period, and every consequence of underinvestment appears after it.",
          "The consequences fall outside the period.",
        ),
        fromList(
          "matching_sentence_endings",
          LEAK_ENDINGS,
          "A technician can locate a leak by ear,",
          "because water escaping under pressure makes a noise the pipe carries for hundreds of metres.",
          "Water escaping from a pressurised pipe generates noise at a characteristic frequency, and the pipe carries that noise for a considerable distance.",
          "The pipe carries the noise.",
        ),
        fromList(
          "matching_sentence_endings",
          LEAK_ENDINGS,
          "A burst main is not the main source of loss,",
          "since a leak that surfaces is reported by the public and repaired quickly.",
          "A large burst is obvious: it floods a street, the public reports it, and it is repaired within hours.",
          "A visible burst is repaired within hours.",
        ),
        fromList(
          "matching_sentence_endings",
          LEAK_ENDINGS,
          "Every existing leak can be slowed without any digging,",
          "which is why the cheapest saving is often to lower the pressure at night.",
          "The rate at which water escapes from a hole depends on the pressure driving it, so reducing pressure reduces loss from every existing leak at once, immediately, with no excavation.",
          "Lower pressure slows every leak at once.",
        ),
        fromList(
          "matching_sentence_endings",
          LEAK_ENDINGS,
          "Chasing the smallest leaks stops paying for itself,",
          "which makes the economically correct level of leakage greater than zero.",
          "Finding and repairing the last few small leaks in a network costs more than the water saved is worth, so there is a level below which further effort loses money, conventionally called the economic level of leakage.",
          "Below a level the effort loses money.",
        ),
        fromList(
          "matching_sentence_endings",
          LEAK_ENDINGS,
          "Replacement is hard to justify within a review period,",
          "because a pipe replaced today will not need attention for eighty years.",
          "A pipe laid in 1890 is still in service in many cities, its exact position is often unknown, and replacing it costs a great deal and prevents failures that would have happened decades hence.",
          "The benefit arrives decades later.",
        ),
      ],
    },
  ],
};
