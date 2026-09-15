import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

const NOTES_TITLE = "Why a modern repeat of the Carrington Event would be serious";

function note(
  section: string,
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
  layout: { indent?: number; before?: { text: string; indent: number }[] } = {},
): CuratedQuestion {
  return {
    type: "note_completion",
    prompt,
    options: null,
    answer,
    supporting_sentence,
    explanation,
    word_limit: "ONE WORD ONLY",
    section,
    note_meta: {
      title: NOTES_TITLE,
      indent: layout.indent ?? 0,
      before: layout.before ?? [],
      layout: "notes",
    },
  };
}

export const CARRINGTON_EVENT: CuratedPassage = {
  key: "carrington-event-1859",
  title: "The Night the Sky Caught Fire",
  topic: "the solar storm of 1859 and space weather today",
  difficulty: 6,
  body: `Shortly before noon on 1 September 1859, the English astronomer Richard Carrington was working in his private observatory south of London, sketching a group of dark sunspots projected onto a screen. Suddenly, two patches of intensely bright white light appeared among the spots. Carrington hurried to find a witness, but by the time he returned the light had almost faded; the entire display had lasted about five minutes. Another amateur observer, Richard Hodgson, had seen the same brilliant flash from his home a few kilometres away. Neither man could explain what he had witnessed, yet within a day the effects of that brief flash would be felt across much of the planet.

What the two men had seen was a solar flare, a sudden release of energy from the tangled magnetic fields above a sunspot group. Scientists now believe it was accompanied by a coronal mass ejection, a vast cloud of electrically charged gas thrown out into space. Most such clouds take three or four days to cross the 150 million kilometres between the Sun and the Earth. This one arrived in around seventeen and a half hours, probably because an earlier eruption had cleared a path through the solar wind ahead of it.

When the cloud struck the Earth's magnetic field in the early hours of 2 September, the result was one of the most intense geomagnetic storms in recorded history. Auroras, normally confined to the polar regions, were seen as far south as the Caribbean. In the Rocky Mountains, gold miners reportedly woke and began preparing breakfast, convinced that morning had arrived. Newspapers described people in north-eastern American cities reading printed pages by the glow of the night sky, while others feared that a great city was burning somewhere over the horizon.

The storm's impact on technology was just as striking. In 1859 the electric telegraph was the most advanced communication network in existence, and it suffered badly. Across Europe and North America, telegraph systems failed or behaved erratically. Some operators received electric shocks from their equipment, and in a few offices sparks from the apparatus set fire to the paper used to record messages. Stranger still, on a line between Boston and Portland, operators disconnected their batteries altogether and continued to send messages for around two hours, using only the current that the storm itself was generating in the wires.

For more than a century, the Carrington Event was treated largely as a historical curiosity. Today, however, it is studied with growing concern, because modern society depends on technologies that are far more vulnerable than the telegraph ever was. A storm of similar strength could induce powerful currents in long-distance power lines, overheating the large transformers that regulate electricity supply. Unlike smaller components, these transformers are built to order and can take many months to replace. Satellites would face their own dangers: charged particles can damage onboard electronics, and the heating of the upper atmosphere increases drag, pulling spacecraft in low orbits towards the Earth. Navigation signals used by aircraft, ships and delivery services could also become unreliable for days.

Such fears are not purely theoretical. In July 2012, a coronal mass ejection of comparable size crossed the Earth's orbit. The planet had passed through that point about nine days earlier, so the cloud missed it entirely. More recently, a series of strong eruptions in May 2024 produced auroras visible far from the poles and caused some disruption to satellite-based navigation, although that storm was considerably weaker than Carrington's.

The Sun's activity rises and falls in a cycle of roughly eleven years, and the most recent cycle reached its peak around 2024 and 2025, making large eruptions more frequent. Because nothing can prevent them, the emphasis is on warning and preparation. Spacecraft stationed between the Earth and the Sun can detect an approaching cloud and give between fifteen minutes and an hour of notice of its magnetic strength. With that warning, grid operators can reduce the load on vulnerable equipment and satellite controllers can switch sensitive instruments into a protective mode. Some countries now include severe space weather in their national risk registers alongside floods and pandemics. A repeat of 1859 is widely regarded as a question of when rather than if, but the difference between a spectacular night sky and a costly disaster may depend on how seriously that warning is taken.`,
  questions: [
    plain(
      "true_false_not_given",
      "The flash of light that Carrington observed lasted for roughly five minutes.",
      "TRUE",
      "Carrington hurried to find a witness, but by the time he returned the light had almost faded; the entire display had lasted about five minutes.",
      "'About five minutes' matches 'roughly five minutes'. The trap is that Carrington missed most of it while looking for a witness — the display itself still lasted that long.",
    ),
    plain(
      "true_false_not_given",
      "Carrington was the only person to see the flash on 1 September 1859.",
      "FALSE",
      "Another amateur observer, Richard Hodgson, had seen the same brilliant flash from his home a few kilometres away.",
      "Hodgson saw the same flash independently, so 'the only person' is contradicted.",
    ),
    plain(
      "true_false_not_given",
      "The cloud released in 1859 travelled more slowly than most coronal mass ejections.",
      "FALSE",
      "This one arrived in around seventeen and a half hours, probably because an earlier eruption had cleared a path through the solar wind ahead of it.",
      "Most clouds take three or four days; this one took under a day, so it was much faster, not slower.",
    ),
    plain(
      "true_false_not_given",
      "Some people in 1859 mistook the light of the aurora for a large fire.",
      "TRUE",
      "Newspapers described people in north-eastern American cities reading printed pages by the glow of the night sky, while others feared that a great city was burning somewhere over the horizon.",
      "Fearing that 'a great city was burning' means they took the glow for firelight. The miners who thought it was morning are a different misreading — don't let them distract you.",
    ),
    plain(
      "true_false_not_given",
      "Telegraph companies paid compensation to operators who were injured by electric shocks.",
      "NOT GIVEN",
      "",
      "The passage says some operators received shocks, but nothing about compensation — a classic Not Given built on a real detail.",
    ),
    plain(
      "true_false_not_given",
      "Scientists have found a way to stop coronal mass ejections from reaching the Earth.",
      "FALSE",
      "Because nothing can prevent them, the emphasis is on warning and preparation.",
      "'Nothing can prevent them' directly contradicts the statement; the passage is about warning, not stopping.",
    ),
    note(
      "Power grids",
      "currents in long-distance power lines could overheat large ______",
      "transformers",
      "A storm of similar strength could induce powerful currents in long-distance power lines, overheating the large transformers that regulate electricity supply.",
      "The currents overheat 'the large transformers that regulate electricity supply'.",
    ),
    note(
      "Power grids",
      "replacements are built to order and can take many ______",
      "months",
      "Unlike smaller components, these transformers are built to order and can take many months to replace.",
      "Replacement 'can take many months' — the long delay is what makes the damage serious.",
    ),
    note(
      "Satellites",
      "charged particles can damage onboard ______",
      "electronics",
      "Satellites would face their own dangers: charged particles can damage onboard electronics, and the heating of the upper atmosphere increases drag, pulling spacecraft in low orbits towards the Earth.",
      "The first of the two satellite dangers: particles damage 'onboard electronics'.",
      {
        indent: 1,
        before: [{ text: "a severe storm threatens satellites in two ways", indent: 0 }],
      },
    ),
    note(
      "Satellites",
      "a heated upper atmosphere increases ______ on spacecraft in low orbits",
      "drag",
      "Satellites would face their own dangers: charged particles can damage onboard electronics, and the heating of the upper atmosphere increases drag, pulling spacecraft in low orbits towards the Earth.",
      "The second danger: atmospheric heating 'increases drag', pulling low satellites down.",
      { indent: 1 },
    ),
    note(
      "Warning and preparation",
      "spacecraft stationed between the Earth and the ______ detect approaching clouds",
      "Sun",
      "Spacecraft stationed between the Earth and the Sun can detect an approaching cloud and give between fifteen minutes and an hour of notice of its magnetic strength.",
      "The monitoring spacecraft sit 'between the Earth and the Sun'.",
    ),
    note(
      "Warning and preparation",
      "grid operators can then reduce the ______ on vulnerable equipment",
      "load",
      "With that warning, grid operators can reduce the load on vulnerable equipment and satellite controllers can switch sensitive instruments into a protective mode.",
      "Operators 'reduce the load on vulnerable equipment'.",
    ),
    note(
      "Warning and preparation",
      "severe space weather appears in some national risk registers next to floods and ______",
      "pandemics",
      "Some countries now include severe space weather in their national risk registers alongside floods and pandemics.",
      "'Alongside floods and pandemics' — 'next to' paraphrases 'alongside'.",
    ),
  ],
};
