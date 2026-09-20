import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · physics of everyday objects · notes box --------------------

const FLASK_NOTES = {
  title: "Three routes for heat, three defences",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · electrical protection · people and a word bank ------------

const ROD_PEOPLE = ["Cécile Marchand", "Owen Pritchard", "Hana Takács", "Ibrahim Saleh"];
const ROD_BANK = [
  "charge",
  "earth",
  "mesh",
  "surge",
  "steeples",
  "path",
  "point",
  "electronics",
  "insulating",
];

// ---- Passage 3 · road engineering · lettered paragraphs --------------------

const STUD_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const STUD_ENDINGS = [
  "because a passing tyre pushes the lens down and wipes it clean.",
  "which is why the invention had to wait for a wartime blackout to be noticed.",
  "since paint reflects nothing once a film of water covers it.",
  "because a snowplough will tear the fittings out of the surface.",
  "because the driver needs the line to be visible before the headlights reach it.",
  "which glass beads rolled into a painted line reproduce only in part.",
  "which makes the maintenance bill, not the invention, the real constraint.",
];

export const TEST_89: CuratedTest = {
  key: "full-test-89",
  targetBand: 6,
  passages: [
    {
      key: "t89-p1-vacuum-flask",
      title: "The Bottle That Keeps Its Own Temperature",
      topic: "a laboratory instrument that escaped into the kitchen",
      difficulty: 5,
      body: `Heat moves in three ways, and a container that is to keep its contents hot must interfere with all three. Conduction carries heat through solid material in contact with the liquid. Convection carries it away in moving air or water. Radiation carries it as infrared light, which needs no medium at all and crosses a vacuum perfectly well. Ordinary insulation — wool, feathers, foam, a knitted cover on a teapot — attacks the first two and does very little about the third.

The vacuum flask attacks all three, and it does so with a design of unusual economy. It is a bottle inside a bottle, joined only at the neck, with the air pumped out of the space between them. The vacuum stops conduction, because there is almost no material left to conduct through, and it stops convection, because there is no air to circulate. The inner surfaces are then silvered, and the silvering reflects infrared radiation back towards whichever side it came from. The narrow neck is the weak point, since glass does conduct, and it is made as thin and as long as strength allows.

The device was made in 1892 by James Dewar, a Scottish chemist working on the liquefaction of gases. He needed a vessel that would hold liquid oxygen long enough to study it, and the ordinary alternatives boiled their contents away in minutes. His flask was a laboratory instrument, and he did not patent it. He is reported to have regarded a patent on an item of scientific apparatus as improper, which is a position a number of nineteenth-century scientists took and which consistently cost them money.

A German glassblower named Reinhold Burger, who had made flasks for Dewar's laboratory, saw the commercial possibility, added a protective metal case to stop the glass breaking in a pocket, patented that, and in 1904 launched it under a brand name chosen by public competition. The name, from the Greek for heat, has been a generic word for the object ever since in several languages. The physics belonged to Dewar and the market belonged to Burger, and there is no evidence the arrangement troubled anyone at the time except Dewar.

Modern flasks differ in materials rather than in principle. Stainless steel replaced glass for the inner and outer walls in the later twentieth century, which made the flask survivable in a lunchbox at the cost of slightly worse performance: steel conducts better than glass, so heat leaks faster through the join. The vacuum is now drawn through a small port that is then sealed, and the quality of that seal decides how long the flask lasts. A flask that has stopped working has almost always lost its vacuum through a failed seal, and there is nothing to be done about it, which is why the good ones carry long guarantees and the cheap ones do not.

The same design does far more consequential work elsewhere. Liquid nitrogen, liquid helium and medical oxygen are transported in vacuum-insulated vessels that are Dewar's flask enlarged; the vessels are still called Dewars in the trade. Vaccines travel in vacuum-insulated shippers. Superconducting magnets, including those in hospital scanners, sit inside nested vacuum vessels that hold their coolant for months. The kitchen flask is the least demanding application of the idea.

Its limitations are instructive. A vacuum flask does not heat or cool anything; it only slows the approach to the temperature of the room. A litre of tea at ninety degrees will still be drinkable in eight hours and cold in two days. Performance depends heavily on how full the flask is, because empty space inside holds air that circulates and carries heat to the walls, so a half-full flask loses heat much faster than a full one. Preheating the flask with boiling water before filling it makes a measurable difference, because otherwise the first minutes are spent heating the steel. None of this is obvious from the object, and all of it follows directly from the three routes the design was built to block.

There is a final oddity worth noting. The flask works equally well in both directions, keeping cold things cold with exactly the same mechanism, and this surprises people often enough that manufacturers print it on the label. The design does not know which way heat is trying to travel. It simply makes the journey difficult.`,
      questions: [
        tfng(
          "Ordinary insulation deals poorly with radiated heat.",
          "TRUE",
          "Ordinary insulation — wool, feathers, foam, a knitted cover on a teapot — attacks the first two and does very little about the third.",
          "It 'does very little about the third'.",
        ),
        tfng(
          "The silvering inside a flask reduces conduction.",
          "FALSE",
          "The inner surfaces are then silvered, and the silvering reflects infrared radiation back towards whichever side it came from.",
          "The silvering addresses radiation, not conduction.",
        ),
        tfng(
          "Dewar built the flask for commercial sale.",
          "FALSE",
          "His flask was a laboratory instrument, and he did not patent it.",
          "It was a laboratory instrument.",
        ),
        tfng(
          "Burger's patent covered the protective outer case.",
          "TRUE",
          "A German glassblower named Reinhold Burger, who had made flasks for Dewar's laboratory, saw the commercial possibility, added a protective metal case to stop the glass breaking in a pocket, patented that, and in 1904 launched it under a brand name chosen by public competition.",
          "He patented the case he added.",
        ),
        tfng(
          "Steel flasks perform better than glass ones.",
          "FALSE",
          "Stainless steel replaced glass for the inner and outer walls in the later twentieth century, which made the flask survivable in a lunchbox at the cost of slightly worse performance: steel conducts better than glass, so heat leaks faster through the join.",
          "Performance is 'slightly worse'.",
        ),
        tfng(
          "A half-full flask loses heat more quickly than a full one.",
          "TRUE",
          "Performance depends heavily on how full the flask is, because empty space inside holds air that circulates and carries heat to the walls, so a half-full flask loses heat much faster than a full one.",
          "A half-full flask loses heat faster.",
        ),
        tfng(
          "Dewar later regretted not patenting the flask.",
          "NOT GIVEN",
          "",
          "The passage gives his view of patents but says nothing about later regret.",
        ),
        noteLine(
          FLASK_NOTES,
          null,
          "______ through solid material — blocked by removing the air",
          "Conduction",
          "Conduction carries heat through solid material in contact with the liquid.",
          "Conduction travels through solids.",
          { before: [{ text: "How each route is blocked:", indent: 0 }] },
        ),
        noteLine(
          FLASK_NOTES,
          null,
          "______ in moving air — blocked by the vacuum",
          "Convection",
          "Convection carries it away in moving air or water.",
          "Convection needs moving air or water.",
        ),
        noteLine(
          FLASK_NOTES,
          null,
          "______ as infrared light — blocked by the silvering",
          "Radiation",
          "Radiation carries it as infrared light, which needs no medium at all and crosses a vacuum perfectly well.",
          "Radiation crosses a vacuum.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The two bottles are joined only at the ______.",
          "neck",
          "It is a bottle inside a bottle, joined only at the neck, with the air pumped out of the space between them.",
          "They are joined at the neck.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A flask that no longer works has usually lost its ______.",
          "vacuum",
          "A flask that has stopped working has almost always lost its vacuum through a failed seal, and there is nothing to be done about it, which is why the good ones carry long guarantees and the cheap ones do not.",
          "It has lost its vacuum.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Large vessels for liquid gases are still called ______ in the trade.",
          "Dewars",
          "Liquid nitrogen, liquid helium and medical oxygen are transported in vacuum-insulated vessels that are Dewar's flask enlarged; the vessels are still called Dewars in the trade.",
          "They are called Dewars.",
        ),
      ],
    },
    {
      key: "t89-p2-lightning-rod",
      title: "The Rod on the Roof",
      topic: "a simple metal bar, and the long argument about what it actually does",
      difficulty: 6,
      body: `A lightning conductor is a metal rod fixed above the highest point of a building and connected by a thick conductor to a plate buried in damp ground. Its purpose is not to prevent lightning, which was Benjamin Franklin's original hope and is not achievable, but to give the current a path to earth that does not pass through the structure. If it strikes the rod, the energy runs down the metal and into the soil. If it strikes the chimney, it runs through brick and timber, converting moisture to steam explosively as it goes.

Cécile Marchand, a historian of technology, notes that the invention of the 1750s spread through Europe faster than almost any other piece of applied science of the period, and that the reason was the churches. A steeple is the tallest structure in a village and was struck regularly, and since gunpowder was often stored in church towers the consequences were spectacular. She adds the detail that in several countries the clergy initially opposed the rods as an interference with providence, and that the opposition collapsed within a generation because the buildings burning down were theirs.

The engineering is less simple than the object. Owen Pritchard, who designs protection for tall buildings, explains that the rod's function is commonly misunderstood as attraction. A rod does not reach out and pull strikes towards itself from a distance; what it does is present the most attractive termination point within a limited volume, so that a strike which was going to arrive in that area arrives at the rod. The volume protected is roughly a cone, and on anything larger than a house one rod is not enough. Tall buildings are protected by a mesh of conductors over the whole roof and down the facades, and the mesh is often hidden inside the structure.

The earth connection is where installations fail. Hana Takács, who inspects existing systems, reports that the commonest defect she finds is not a missing rod but a corroded or disconnected earth, which converts a protective system into an efficient way of bringing a very large current into a building and abandoning it there. She makes the point that a lightning protection system is one of the few safety installations whose failure is undetectable without testing, because nothing about the building looks different and the fault is discovered by a strike.

A second failure mode has become more important than the first. Ibrahim Saleh, an electrical engineer, observes that the structural protection problem was essentially solved decades ago, and that what damages buildings now is the surge. A strike anywhere near a building induces a voltage spike in every cable inside it, and modern buildings are full of electronics that fail at a small fraction of the voltage that brick and steel tolerate easily. He argues that a protection design that considers only the path to earth is answering the question of 1760, and that the expensive damage today is to equipment rather than to fabric.

The scale of the induced voltage is easy to underestimate. A cable running the length of a building acts as an aerial, and a strike a hundred metres away can put several thousand volts onto a line designed for a few hundred, for a few millionths of a second, which is long enough to destroy a chip and far too short for any switch to open.

Surge protection is therefore now a second, separate layer: devices at the point where power and data cables enter a building, and again at sensitive equipment, which clamp the voltage and divert the excess. Their weakness is that they degrade with each event they absorb, silently, and need replacement on a schedule that few building owners keep. A device that has already given its life protecting the building looks exactly like one that is still working.

Two persistent myths deserve mention. The first is that rubber tyres protect a car's occupants; they do not, and the protection comes from the metal shell conducting the current around the passengers, which is why a convertible is not safe. The second is that lightning never strikes twice in the same place, which is exactly backwards: tall isolated conductors are struck repeatedly, and some transmitter masts record dozens of strikes a year. The whole technology depends on that being true, because a system designed on the assumption of a single strike would be worthless.`,
      questions: [
        fromList(
          "matching_features",
          ROD_PEOPLE,
          "Religious objections gave way once church buildings kept burning.",
          "Cécile Marchand",
          "She adds the detail that in several countries the clergy initially opposed the rods as an interference with providence, and that the opposition collapsed within a generation because the buildings burning down were theirs.",
          "Marchand records the collapse of the objection.",
        ),
        fromList(
          "matching_features",
          ROD_PEOPLE,
          "The rod does not draw strikes towards it from far away.",
          "Owen Pritchard",
          "A rod does not reach out and pull strikes towards itself from a distance; what it does is present the most attractive termination point within a limited volume, so that a strike which was going to arrive in that area arrives at the rod.",
          "Pritchard corrects the attraction idea.",
        ),
        fromList(
          "matching_features",
          ROD_PEOPLE,
          "A fault in the system cannot be seen without a test.",
          "Hana Takács",
          "She makes the point that a lightning protection system is one of the few safety installations whose failure is undetectable without testing, because nothing about the building looks different and the fault is discovered by a strike.",
          "Takács notes the invisible failure.",
        ),
        fromList(
          "matching_features",
          ROD_PEOPLE,
          "Protecting only the structure answers an outdated question.",
          "Ibrahim Saleh",
          "He argues that a protection design that considers only the path to earth is answering the question of 1760, and that the expensive damage today is to equipment rather than to fabric.",
          "Saleh calls it the question of 1760.",
        ),
        fromList(
          "summary_completion",
          ROD_BANK,
          "The rod offers the current a ______ that avoids the structure.",
          "path",
          "Its purpose is not to prevent lightning, which was Benjamin Franklin's original hope and is not achievable, but to give the current a path to earth that does not pass through the structure.",
          "It gives the current a path.",
        ),
        fromList(
          "summary_completion",
          ROD_BANK,
          "The conductor ends at a plate buried in damp ground, the system's ______.",
          "earth",
          "A lightning conductor is a metal rod fixed above the highest point of a building and connected by a thick conductor to a plate buried in damp ground.",
          "The buried plate is the earth.",
        ),
        fromList(
          "summary_completion",
          ROD_BANK,
          "The rods spread quickly because village ______ were struck so often.",
          "steeples",
          "A steeple is the tallest structure in a village and was struck regularly, and since gunpowder was often stored in church towers the consequences were spectacular.",
          "Steeples were struck regularly.",
        ),
        fromList(
          "summary_completion",
          ROD_BANK,
          "A large building needs a ______ of conductors rather than one rod.",
          "mesh",
          "Tall buildings are protected by a mesh of conductors over the whole roof and down the facades, and the mesh is often hidden inside the structure.",
          "A mesh replaces the single rod.",
        ),
        fromList(
          "summary_completion",
          ROD_BANK,
          "A nearby strike induces a voltage ______ in every cable indoors.",
          "surge",
          "A strike anywhere near a building induces a voltage spike in every cable inside it, and modern buildings are full of electronics that fail at a small fraction of the voltage that brick and steel tolerate easily.",
          "The induced spike is the surge.",
        ),
        mcq(
          "What happens if lightning strikes a chimney rather than a rod?",
          [
            "Moisture in the material turns to steam explosively",
            "The current is absorbed harmlessly by the brick",
            "The strike is deflected to the nearest conductor",
            "The building is charged but not damaged",
          ],
          "Moisture in the material turns to steam explosively",
          "If it strikes the chimney, it runs through brick and timber, converting moisture to steam explosively as it goes.",
          "Moisture becomes steam explosively.",
        ),
        mcq(
          "What is the commonest defect found in existing installations?",
          [
            "A corroded or disconnected earth",
            "A rod that is too short",
            "Conductors of the wrong metal",
            "A missing surge protector",
          ],
          "A corroded or disconnected earth",
          "Hana Takács, who inspects existing systems, reports that the commonest defect she finds is not a missing rod but a corroded or disconnected earth, which converts a protective system into an efficient way of bringing a very large current into a building and abandoning it there.",
          "The earth is the usual fault.",
        ),
        mcq(
          "What is the weakness of surge protection devices?",
          [
            "They wear out invisibly as they absorb events",
            "They interfere with data cables",
            "They must be fitted outside the building",
            "They work only against direct strikes",
          ],
          "They wear out invisibly as they absorb events",
          "Their weakness is that they degrade with each event they absorb, silently, and need replacement on a schedule that few building owners keep.",
          "They degrade silently.",
        ),
        mcq(
          "Why does the writer say the second myth is 'exactly backwards'?",
          [
            "Tall conductors are struck again and again",
            "Lightning avoids conductors it has already struck",
            "Strikes are randomly distributed",
            "Masts are earthed and cannot be struck",
          ],
          "Tall conductors are struck again and again",
          "The second is that lightning never strikes twice in the same place, which is exactly backwards: tall isolated conductors are struck repeatedly, and some transmitter masts record dozens of strikes a year.",
          "They are struck repeatedly.",
        ),
      ],
    },
    {
      key: "t89-p3-road-studs",
      title: "The Studs That Reflect the Headlights",
      topic: "a small road fitting whose value is almost entirely in the rain",
      difficulty: 7,
      body: `A) Painted road markings work well in dry daylight and fail in exactly the conditions where they matter most. At night, a driver sees a painted line only where the headlights reach, which at speed is a short distance ahead. In rain, the paint is covered by a film of water that reflects the beam away rather than back, and the line disappears entirely. The problem was recognised as soon as cars became fast enough to be driven at night, and the solutions attempted before the 1930s — kerbs, white posts, painted stones — all addressed visibility without addressing water. Each of them could be seen in the dry and each of them disappeared in a downpour, which is the weather in which a driver most needs to know where the edge of the road is.

B) The reflective road stud was patented in 1934 by Percy Shaw, a Yorkshire road contractor. His device is a pair of glass lenses set in a rubber housing, which is itself mounted in a cast-iron base sunk into the road surface. A headlight beam entering the lens is reflected back along its own path, so the stud appears bright to the driver whose light is illuminating it and dark to anyone else. Because the lens sits above the water film, rain does not blind it. Because it returns light along the incoming path, it is visible far beyond the distance at which paint becomes legible.

C) The detail that made the design work is the one that sounds least important. The rubber housing is flexible, and a tyre passing over the stud presses the lens down into a recess partly filled with rainwater; as the lens comes back up it is wiped by the rubber. The device therefore cleans itself with the traffic that would otherwise dirty it, and in service a stud stays effective for years without attention. Shaw's competitors produced reflectors that were optically as good and stopped working within weeks because nothing cleaned them.

D) The invention was in production but not widely bought until 1939, when Britain imposed a wartime blackout and street lighting was extinguished. Studs that needed no power and were invisible from the air were suddenly the only way to mark a road at all, and the government ordered them in enormous quantity. It is a recurring pattern in the history of small inventions: a device with a modest advantage in normal conditions becomes indispensable when conditions change, and the change rather than the merit decides the timing.

E) The technology has since divided into several kinds with different economics. The original rubber-and-lens unit remains in use, and in the right conditions it is still the longest-lived of the family. Prismatic plastic reflectors are cheaper and shorter-lived. Thermoplastic markings with tiny glass beads rolled into the surface reproduce part of the retroreflective effect at a fraction of the cost and are now the standard treatment for lines, which has narrowed the role of the stud to lane edges, hazards and junctions rather than continuous marking. Solar-powered light-emitting studs exist, are considerably brighter, and cost enough that they are used mainly at specific hazards.

F) Climate decides much of this. In countries where snow is cleared mechanically, a raised fitting is torn out by the blade, so studs are either omitted, recessed below the surface where their optical performance is much worse, or accepted as an annual replacement cost. The countries with the most elaborate stud systems are those with wet winters and no ploughing, and a visitor who notices that roads are marked differently across a border is usually looking at a snow policy rather than a safety policy.

G) The honest assessment of the whole family of devices is that the invention was the easy part. A stud costs little; installing one requires closing a lane; inspecting several million of them and replacing the failed ones is a permanent operating expense that competes with resurfacing for the same budget. Resurfacing wins those arguments, because a worn surface can be photographed and a dim reflector cannot, and because nobody complains about a stud until after the collision. Authorities that have measured it find that the proportion of studs actually working on a given road falls steadily between maintenance cycles, and that the safety benefit falls with it. What determines whether a road is well marked at night in the rain is not which reflector was chosen but whether anyone is funded to go round and check them.`,
      questions: [
        fromList(
          "matching_information",
          STUD_PARAGRAPHS,
          "a self-cleaning mechanism that competitors lacked",
          "C",
          "Shaw's competitors produced reflectors that were optically as good and stopped working within weeks because nothing cleaned them.",
          "Paragraph C contrasts the cleaning mechanism with rivals.",
        ),
        fromList(
          "matching_information",
          STUD_PARAGRAPHS,
          "the effect of snow-clearing practice on what is installed",
          "F",
          "In countries where snow is cleared mechanically, a raised fitting is torn out by the blade, so studs are either omitted, recessed below the surface where their optical performance is much worse, or accepted as an annual replacement cost.",
          "Paragraph F explains the snowplough constraint.",
        ),
        fromList(
          "matching_information",
          STUD_PARAGRAPHS,
          "a cheaper treatment that has taken over continuous marking",
          "E",
          "Thermoplastic markings with tiny glass beads rolled into the surface reproduce part of the retroreflective effect at a fraction of the cost and are now the standard treatment for lines, which has narrowed the role of the stud to lane edges, hazards and junctions rather than continuous marking.",
          "Paragraph E describes the bead markings.",
        ),
        fromList(
          "matching_information",
          STUD_PARAGRAPHS,
          "why earlier attempts at the problem did not succeed",
          "A",
          "The problem was recognised as soon as cars became fast enough to be driven at night, and the solutions attempted before the 1930s — kerbs, white posts, painted stones — all addressed visibility without addressing water.",
          "Paragraph A says they ignored water.",
        ),
        fromList(
          "matching_information",
          STUD_PARAGRAPHS,
          "an external event that created the market",
          "D",
          "The invention was in production but not widely bought until 1939, when Britain imposed a wartime blackout and street lighting was extinguished.",
          "Paragraph D names the blackout.",
        ),
        ynng(
          "The writer thinks the choice of reflector type is what decides night-time visibility.",
          "NO",
          "What determines whether a road is well marked at night in the rain is not which reflector was chosen but whether anyone is funded to go round and check them.",
          "Funding for inspection decides it.",
        ),
        ynng(
          "The writer regards the flexible housing as the decisive element of the design.",
          "YES",
          "The detail that made the design work is the one that sounds least important.",
          "The writer calls it the detail that made it work.",
        ),
        ynng(
          "The writer believes the timing of the invention's success reflected its merits.",
          "NO",
          "It is a recurring pattern in the history of small inventions: a device with a modest advantage in normal conditions becomes indispensable when conditions change, and the change rather than the merit decides the timing.",
          "'The change rather than the merit decides the timing.'",
        ),
        ynng(
          "The writer accepts that a road's stud performance declines between maintenance visits.",
          "YES",
          "Authorities that have measured it find that the proportion of studs actually working on a given road falls steadily between maintenance cycles, and that the safety benefit falls with it.",
          "The working proportion falls steadily.",
        ),
        fromList(
          "matching_sentence_endings",
          STUD_ENDINGS,
          "A painted line vanishes in heavy rain,",
          "since paint reflects nothing once a film of water covers it.",
          "In rain, the paint is covered by a film of water that reflects the beam away rather than back, and the line disappears entirely.",
          "Water reflects the beam away.",
        ),
        fromList(
          "matching_sentence_endings",
          STUD_ENDINGS,
          "A lens returns the beam to its source,",
          "which glass beads rolled into a painted line reproduce only in part.",
          "Because it returns light along the incoming path, it is visible far beyond the distance at which paint becomes legible.",
          "Returning the beam is what makes it legible far ahead.",
        ),
        fromList(
          "matching_sentence_endings",
          STUD_ENDINGS,
          "The stud needs no cleaning crew,",
          "because a passing tyre pushes the lens down and wipes it clean.",
          "The rubber housing is flexible, and a tyre passing over the stud presses the lens down into a recess partly filled with rainwater; as the lens comes back up it is wiped by the rubber.",
          "The tyre operates the wiper.",
        ),
        fromList(
          "matching_sentence_endings",
          STUD_ENDINGS,
          "Nobody ordered the device for five years,",
          "which is why the invention had to wait for a wartime blackout to be noticed.",
          "Studs that needed no power and were invisible from the air were suddenly the only way to mark a road at all, and the government ordered them in enormous quantity.",
          "The blackout created the order.",
        ),
        fromList(
          "matching_sentence_endings",
          STUD_ENDINGS,
          "Raised fittings are avoided in cold countries,",
          "because a snowplough will tear the fittings out of the surface.",
          "In countries where snow is cleared mechanically, a raised fitting is torn out by the blade, so studs are either omitted, recessed below the surface where their optical performance is much worse, or accepted as an annual replacement cost.",
          "The blade tears a raised fitting out.",
        ),
      ],
    },
  ],
};
