import { gapFill, mcq, noteLine, tfng, type CuratedPassage } from "./shared";

const ASH_NOTES = {
  title: "Why ash damages an engine",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

export const ASH_CLOUD: CuratedPassage = {
  key: "ash-cloud",
  title: "The Week the Planes Stopped",
  topic: "how a modest eruption closed the airspace of a continent",
  difficulty: 5,
  body: `The eruption that began beneath an Icelandic glacier in April 2010 was not, by volcanic standards, a large one. It produced a fraction of the material that a major eruption produces, and in a different place it would have been a local event. Three things made it a continental one: the volcano lay under ice, so that meltwater flashing to steam shattered the lava into very fine particles; the plume reached the altitude at which aircraft cruise; and the winds for the following week blew steadily towards the busiest airspace in the world.

The reason ash matters to an aircraft was established by two incidents in the 1980s. In both, a large passenger aircraft flew at night into a cloud that neither the crew nor the radar could see, and in both all four engines stopped. The crews restarted them during a long glide and landed safely, and the investigations explained what had happened. Volcanic ash is not soot; it is pulverised rock, mostly glass, and it melts at a temperature below the operating temperature of a modern jet engine's combustion chamber. Particles drawn in melt, stick to the turbine blades and to the nozzle guide vanes behind the combustor, and build a glassy coating that narrows the passages the hot gas must flow through. The engine chokes. Cooling as the engine spools down cracks the deposit off, which is why a stopped engine can often be restarted, and why a crew may be led to believe the problem has passed.

Ash also abrades. It sandblasts windscreens to opacity, erodes the leading edges of blades, and blocks the small pressure sensors on which the flight instruments depend. Weather radar does not detect it, because radar returns depend on droplet size and ash particles are too small and too dry.

The response in 2010 followed a rule that had been written after the 1980s incidents and never seriously tested: no flight into any airspace where ash was forecast to be present. The forecast came from a dispersion model run by a volcanic ash advisory centre, fed by satellite imagery and meteorological data, and the model drew a region within which the concentration was expected to exceed zero. That threshold is the crucial detail. Zero tolerance is a defensible rule when eruptions are brief and distant. Applied to a plume drifting across Europe for a week, it closed the airspace of more than twenty countries, cancelled something over a hundred thousand flights, and stranded roughly ten million passengers.

The closure was widely criticised at the time, often unfairly, since the authorities were applying the rule they had. What the episode exposed was that nobody knew what concentration of ash was actually dangerous. The engine manufacturers had never certified their products against a stated ash tolerance, because no such standard existed, and in its absence the only defensible advice was to avoid ash altogether.

That is what changed afterwards. Manufacturers were asked to state a concentration their engines could tolerate, and within weeks a threshold was agreed, with an intermediate band in which flight was permitted subject to inspection and a higher band that remained closed. Test flights were conducted through known concentrations. Research aircraft measured the plume directly, which revealed that the models, run without measurements to correct them, had substantially overstated the extent of the dangerous region.

Iceland itself illustrates how local the disruption was not. The country's own airports stayed open for most of the period, because the wind was carrying the plume away from them, while airports two thousand kilometres downwind were shut. Airspace closure in a dispersing plume is not a matter of proximity to the volcano at all; it is a matter of where the wind has been for the last three days, which is why the maps issued during that week looked so arbitrary to the passengers reading them.

The wider lesson has been drawn in several other industries since. A safety rule expressed as a prohibition on any exposure requires no measurement and no judgement, which makes it easy to write and easy to defend, and it works until the hazard becomes widespread enough that the prohibition costs more than the risk. At that point somebody has to produce the number that nobody thought to establish while the question was hypothetical, and it will be produced in a hurry, under commercial pressure, during the emergency itself.`,
  questions: [
    tfng(
      "The 2010 eruption was unusually large.",
      "FALSE",
      "The eruption that began beneath an Icelandic glacier in April 2010 was not, by volcanic standards, a large one.",
      "It 'was not, by volcanic standards, a large one'.",
    ),
    tfng(
      "Ice above the volcano contributed to the fineness of the particles.",
      "TRUE",
      "Three things made it a continental one: the volcano lay under ice, so that meltwater flashing to steam shattered the lava into very fine particles; the plume reached the altitude at which aircraft cruise; and the winds for the following week blew steadily towards the busiest airspace in the world.",
      "Meltwater 'shattered the lava into very fine particles'.",
    ),
    tfng(
      "The aircraft involved in the 1980s incidents were lost.",
      "FALSE",
      "The crews restarted them during a long glide and landed safely, and the investigations explained what had happened.",
      "Both 'landed safely'.",
    ),
    tfng(
      "Weather radar can be used to avoid ash clouds.",
      "FALSE",
      "Weather radar does not detect it, because radar returns depend on droplet size and ash particles are too small and too dry.",
      "Radar 'does not detect it'.",
    ),
    tfng(
      "The rule applied in 2010 had been tested in a previous long eruption.",
      "FALSE",
      "The response in 2010 followed a rule that had been written after the 1980s incidents and never seriously tested: no flight into any airspace where ash was forecast to be present.",
      "It had 'never seriously tested'.",
    ),
    tfng(
      "Engine manufacturers had previously stated a safe ash concentration.",
      "FALSE",
      "The engine manufacturers had never certified their products against a stated ash tolerance, because no such standard existed, and in its absence the only defensible advice was to avoid ash altogether.",
      "They 'had never certified' against one.",
    ),
    tfng(
      "Direct measurement showed the models had exaggerated the dangerous area.",
      "TRUE",
      "Research aircraft measured the plume directly, which revealed that the models, run without measurements to correct them, had substantially overstated the extent of the dangerous region.",
      "The models 'had substantially overstated' it.",
    ),
    noteLine(
      ASH_NOTES,
      null,
      "Ash is pulverised rock, mostly ______",
      "glass",
      "Volcanic ash is not soot; it is pulverised rock, mostly glass, and it melts at a temperature below the operating temperature of a modern jet engine's combustion chamber.",
      "It is 'pulverised rock, mostly glass'.",
    ),
    noteLine(
      ASH_NOTES,
      null,
      "Particles drawn in ______ and stick to the turbine blades",
      "melt",
      "Particles drawn in melt, stick to the turbine blades and to the nozzle guide vanes behind the combustor, and build a glassy coating that narrows the passages the hot gas must flow through.",
      "Particles 'melt, stick to the turbine blades'.",
      { before: [{ text: "The sequence inside a running engine:", indent: 0 }] },
    ),
    noteLine(
      ASH_NOTES,
      null,
      "The deposit narrows the passages and the engine ______",
      "chokes",
      "The engine chokes.",
      "'The engine chokes.'",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Ash blasts ______ until they can no longer be seen through.",
      "windscreens",
      "It sandblasts windscreens to opacity, erodes the leading edges of blades, and blocks the small pressure sensors on which the flight instruments depend.",
      "It 'sandblasts windscreens to opacity'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Roughly ten million ______ were stranded by the closure.",
      "passengers",
      "Applied to a plume drifting across Europe for a week, it closed the airspace of more than twenty countries, cancelled something over a hundred thousand flights, and stranded roughly ten million passengers.",
      "It 'stranded roughly ten million passengers'.",
    ),
    mcq(
      "What does the passage identify as the general lesson?",
      [
        "A zero-exposure rule fails once the hazard becomes widespread",
        "Dispersion models should replace direct measurement",
        "Engine design should be changed to tolerate ash",
        "Airspace closures should be decided by airlines",
      ],
      "A zero-exposure rule fails once the hazard becomes widespread",
      "A safety rule expressed as a prohibition on any exposure requires no measurement and no judgement, which makes it easy to write and easy to defend, and it works until the hazard becomes widespread enough that the prohibition costs more than the risk.",
      "Such a rule works until the hazard spreads.",
    ),
  ],
};
