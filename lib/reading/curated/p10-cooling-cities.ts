import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

const NOTES_TITLE = "Ways to cool a city";

function note(
  section: string,
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("note_completion", prompt, answer, supporting_sentence, explanation),
    word_limit: "ONE WORD ONLY",
    section,
    note_meta: { title: NOTES_TITLE, indent: 0, before: [], layout: "notes" },
  };
}

function choice(
  prompt: string,
  options: string[],
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return { ...plain("multiple_choice", prompt, answer, supporting_sentence, explanation), options };
}

export const COOLING_CITIES: CuratedPassage = {
  key: "cooling-overheated-cities",
  title: "Cooling the Overheated City",
  topic: "how cities are adapting to hotter summers",
  difficulty: 5,
  body: `On a hot summer afternoon, the centre of a large city can be several degrees warmer than the countryside just a few kilometres away. Scientists call this the urban heat island effect. It happens because roads, pavements and buildings absorb the sun's energy during the day and release it slowly at night, while cars, air conditioners and factories add even more heat. Cities also have fewer trees and plants, which normally help to cool the air. As heatwaves become more frequent and more intense, city governments around the world are looking for ways to keep their residents cool.

The problem is not simply one of comfort. Extreme heat is dangerous, especially for older people, young children and those with health problems, and it can be particularly harmful at night, when the body needs to recover. People who live in crowded neighbourhoods with little shade and poorly insulated homes are often the most affected. In some countries, heatwaves now cause more deaths than any other kind of extreme weather. High temperatures also put pressure on electricity supplies, as more people switch on air conditioning, and they can damage roads and railway lines.

One of the simplest solutions is to plant more trees. A mature tree cools its surroundings in two ways: its leaves provide shade, and it releases water vapour through its leaves, which cools the air around it. Studies suggest that streets lined with trees can be noticeably cooler than similar streets without them. The Colombian city of Medellín, for example, created a network of "green corridors" along roads and waterways, planting thousands of trees and plants. Local officials reported that temperatures in some of these areas fell by around two degrees. Trees take many years to grow, however, and they need space and regular watering, which can be difficult in dense city centres.

Changing the colour of surfaces is another approach. Dark materials, such as black roofs and ordinary asphalt, absorb large amounts of heat, while light-coloured surfaces reflect much of the sun's energy back into the sky. Some cities now encourage or require "cool roofs", which are painted white or covered with reflective materials. In Los Angeles, workers have tested a special grey coating on some residential streets to reduce the amount of heat the road surface absorbs. Such measures are relatively cheap and quick to introduce, but they are not perfect: reflective surfaces can create glare, and heat reflected from the ground may make pedestrians feel warmer.

Water can also play a part. Fountains, ponds and streams cool the air as water evaporates, and many cities are uncovering rivers that were buried beneath roads in the past. Some cities also install misting systems in public squares, which spray a fine cloud of water droplets into the air. In Paris, schools have been turning concrete playgrounds into "oasis" schoolyards, replacing hard surfaces with plants, trees and areas where rainwater can soak into the ground. The idea is that these playgrounds can be opened to local residents as cool places to rest during heatwaves.

Building design matters too. In hot countries, traditional houses were often built with thick walls, small windows and shaded courtyards that kept rooms cool without electricity. Architects today are rediscovering some of these ideas. Shutters, awnings and balconies can block direct sunlight, while green roofs, covered with soil and plants, help to keep the rooms below them cooler. Planners are also thinking about how buildings are arranged, since narrow streets between tall buildings can trap hot air, while carefully placed open spaces allow cooling breezes to pass through.

Experts agree that no single measure is enough. The most effective plans combine trees, reflective materials, water and better building design, and they focus first on the neighbourhoods where people are most at risk. Many cities are creating maps that show which streets become hottest, so that help can be sent where it is needed most. Some have also appointed "chief heat officers", whose job is to coordinate the response to extreme heat across different government departments. With summers expected to grow hotter in many parts of the world, the question for city leaders is no longer whether to act, but how quickly they can do so.`,
  questions: [
    note(
      "Trees",
      "leaves provide ______",
      "shade",
      "A mature tree cools its surroundings in two ways: its leaves provide shade, and it releases water vapour through its leaves, which cools the air around it.",
      "The first way a tree cools the air: 'its leaves provide shade'.",
    ),
    note(
      "Trees",
      "release water ______, which cools the surrounding air",
      "vapour",
      "A mature tree cools its surroundings in two ways: its leaves provide shade, and it releases water vapour through its leaves, which cools the air around it.",
      "The second way: it 'releases water vapour'. Copy the word exactly as the passage spells it.",
    ),
    note(
      "Trees",
      "drawbacks: slow to grow; need space and regular ______",
      "watering",
      "Trees take many years to grow, however, and they need space and regular watering, which can be difficult in dense city centres.",
      "Trees 'need space and regular watering'.",
    ),
    note(
      "Surfaces",
      "light-coloured surfaces ______ much of the sun's energy",
      "reflect",
      "Dark materials, such as black roofs and ordinary asphalt, absorb large amounts of heat, while light-coloured surfaces reflect much of the sun's energy back into the sky.",
      "Light surfaces 'reflect' energy; dark ones 'absorb' it — don't swap them.",
    ),
    note(
      "Surfaces",
      "a disadvantage: reflective surfaces can cause ______",
      "glare",
      "Such measures are relatively cheap and quick to introduce, but they are not perfect: reflective surfaces can create glare, and heat reflected from the ground may make pedestrians feel warmer.",
      "Reflective surfaces 'can create glare'.",
    ),
    note(
      "Water",
      "fountains and ponds cool the air as the water ______",
      "evaporates",
      "Fountains, ponds and streams cool the air as water evaporates, and many cities are uncovering rivers that were buried beneath roads in the past.",
      "They cool the air 'as water evaporates'.",
    ),
    choice(
      "Why are city centres warmer than the countryside around them?",
      [
        "Cities receive more hours of sunshine.",
        "City surfaces absorb heat and release it slowly.",
        "Cities are usually built in low valleys.",
        "The countryside receives more rain.",
      ],
      "City surfaces absorb heat and release it slowly.",
      "It happens because roads, pavements and buildings absorb the sun's energy during the day and release it slowly at night, while cars, air conditioners and factories add even more heat.",
      "Roads and buildings 'absorb the sun's energy' and 'release it slowly at night'. Sunshine, valleys and rain are not mentioned.",
    ),
    choice(
      "According to the passage, why can heat be especially harmful at night?",
      [
        "Air conditioners are usually turned off.",
        "The body needs to recover at that time.",
        "People are more likely to be outdoors.",
        "Electricity supplies often fail at night.",
      ],
      "The body needs to recover at that time.",
      "Extreme heat is dangerous, especially for older people, young children and those with health problems, and it can be particularly harmful at night, when the body needs to recover.",
      "Night heat is harmful because that is 'when the body needs to recover'.",
    ),
    choice(
      "What is one purpose of the oasis schoolyards in Paris?",
      [
        "to give children more space for team sports",
        "to reduce the cost of maintaining schools",
        "to provide cool places for local people during heatwaves",
        "to collect rainwater for drinking",
      ],
      "to provide cool places for local people during heatwaves",
      "The idea is that these playgrounds can be opened to local residents as cool places to rest during heatwaves.",
      "The playgrounds can be opened 'as cool places to rest during heatwaves'. Rainwater soaks into the ground; it is not collected for drinking.",
    ),
    choice(
      "What do experts believe is the best way to cool a city?",
      [
        "Planting trees is the only method that really works.",
        "Several different measures should be combined.",
        "Reflective roofs should be made compulsory everywhere.",
        "Cities should wait until summers become hotter.",
      ],
      "Several different measures should be combined.",
      "The most effective plans combine trees, reflective materials, water and better building design, and they focus first on the neighbourhoods where people are most at risk.",
      "Experts agree 'no single measure is enough' and the best plans 'combine' several.",
    ),
    plain(
      "true_false_not_given",
      "Temperatures in some parts of Medellín's green corridors fell by about two degrees.",
      "TRUE",
      "Local officials reported that temperatures in some of these areas fell by around two degrees.",
      "'Around two degrees' matches 'about two degrees'.",
    ),
    plain(
      "true_false_not_given",
      "The grey coating tested in Los Angeles was applied to major motorways.",
      "FALSE",
      "In Los Angeles, workers have tested a special grey coating on some residential streets to reduce the amount of heat the road surface absorbs.",
      "The coating was tested on 'residential streets', not motorways.",
    ),
    plain(
      "true_false_not_given",
      "Traditional houses in hot countries depended on electric fans to stay cool.",
      "FALSE",
      "In hot countries, traditional houses were often built with thick walls, small windows and shaded courtyards that kept rooms cool without electricity.",
      "These houses stayed cool 'without electricity', so they could not depend on electric fans.",
    ),
    plain(
      "true_false_not_given",
      "Most chief heat officers have a background in medicine.",
      "NOT GIVEN",
      "",
      "The passage explains what chief heat officers do, but not what training or background they have.",
    ),
  ],
};
