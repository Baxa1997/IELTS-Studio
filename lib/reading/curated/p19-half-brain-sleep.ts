import { fromList, gapFill, mcq, tfng, type CuratedPassage } from "./shared";

const SLEEP_BANK = [
  "hemisphere",
  "predators",
  "eye",
  "migration",
  "dolphins",
  "waves",
  "flock",
  "temperature",
  "edge",
];

export const HALF_BRAIN_SLEEP: CuratedPassage = {
  key: "half-brain-sleep",
  title: "Sleeping with One Eye Open",
  topic: "animals that rest half their brain at a time",
  difficulty: 7,
  body: `Sleep is dangerous. An animal asleep is not watching for predators, not feeding and not defending territory, and the fact that every animal examined does it anyway is one of the strongest arguments that it serves some function too important to skip. What varies enormously is how the requirement is met.

The most striking solution is to sleep with half the brain. Recordings of electrical activity in dolphins show the characteristic slow waves of deep sleep in one hemisphere while the other shows the pattern of full wakefulness, with the two swapping every hour or two. The eye connected to the sleeping hemisphere is closed; the eye connected to the waking one stays open. The animal continues to swim, to surface and to breathe throughout.

The breathing is the point. A dolphin's breathing is not automatic in the way a human's is; it must be initiated, and an animal that became fully unconscious in water would drown. Half-brain sleep solves that problem, and it also allows a mother and calf to remain together during the weeks after birth when neither sleeps in the ordinary sense at all.

Several seals do something more flexible. In water they sleep unihemispherically, like dolphins; hauled out on land, where drowning is not a risk, the same animals sleep with both hemispheres at once, in the ordinary mammalian way. The mode is selected according to circumstance rather than fixed by the species.

Birds have the same capability and use it differently. A duck at the edge of a row of sleeping ducks will sleep with the outward-facing eye open and the corresponding hemisphere awake, while a duck in the middle of the row sleeps with both. Experimenters who moved birds from the middle to the end found them switching within minutes, and the open eye was reliably the one facing away from the group. That is a direct demonstration that the animal is deploying the capacity in response to perceived risk rather than following a fixed pattern.

The most extreme case is the frigatebird, which stays aloft for weeks over open ocean. Recordings from birds in flight show that they sleep in the air, in short bouts totalling less than an hour a day, sometimes with one hemisphere and sometimes with both, and that they continue to circle in rising air while doing it. The same birds sleep for more than twelve hours a day when they return to land, which suggests the aerial sleep is a severe curtailment rather than a demonstration that they need less.

None of this appears to be free. Comparative work indicates that the sleeping hemisphere in unihemispheric sleep shows the same recovery processes as in whole-brain sleep, but only for that hemisphere, so the animal must sleep for longer overall to service both. Some of the deeper stages of sleep associated with memory consolidation in other mammals are either reduced or absent, and dolphins show little or none of the stage in which mammals dream.

The distribution of the trait across the animal kingdom is itself informative. It is found in cetaceans, in several seals, in many birds, and in some reptiles, and these groups are not closely related to one another; the capacity has arisen more than once, in lineages facing quite different problems — drowning, predation, and the impossibility of landing. A solution that keeps being reinvented is usually a solution to a problem that keeps recurring.

Humans do something faintly related, which is the part of the research most people have experienced without knowing. On the first night in an unfamiliar place, one hemisphere sleeps less deeply than the other and responds more strongly to sounds, which explains a poor night's sleep in a hotel that cannot be blamed on the mattress. The asymmetry is partial and small compared with a dolphin's, and it disappears by the second night. It suggests the capacity for asymmetric sleep is an old feature of the vertebrate brain that most mammals retain in vestigial form.

The question the field has not answered is what sleep is doing that makes all this necessary. The candidate functions — clearing metabolic waste, consolidating memory, restoring synaptic balance — are plausible and supported to varying degrees, and none of them explains why an animal that could not afford to be unconscious evolved an elaborate mechanism for being half unconscious instead of simply doing without.`,
  questions: [
    tfng(
      "Every animal that has been studied sleeps in some form.",
      "TRUE",
      "An animal asleep is not watching for predators, not feeding and not defending territory, and the fact that every animal examined does it anyway is one of the strongest arguments that it serves some function too important to skip.",
      "'Every animal examined does it anyway'.",
    ),
    tfng(
      "In a sleeping dolphin both eyes are closed.",
      "FALSE",
      "The eye connected to the sleeping hemisphere is closed; the eye connected to the waking one stays open.",
      "One eye 'stays open'.",
    ),
    tfng(
      "A dolphin breathes automatically when unconscious.",
      "FALSE",
      "A dolphin's breathing is not automatic in the way a human's is; it must be initiated, and an animal that became fully unconscious in water would drown.",
      "Breathing 'must be initiated'.",
    ),
    tfng(
      "Seals always sleep with one hemisphere at a time.",
      "FALSE",
      "In water they sleep unihemispherically, like dolphins; hauled out on land, where drowning is not a risk, the same animals sleep with both hemispheres at once, in the ordinary mammalian way.",
      "On land they sleep with both.",
    ),
    tfng(
      "Ducks moved to the end of a row changed how they slept.",
      "TRUE",
      "Experimenters who moved birds from the middle to the end found them switching within minutes, and the open eye was reliably the one facing away from the group.",
      "They switched 'within minutes'.",
    ),
    tfng(
      "Frigatebirds sleep as much in the air as they do on land.",
      "FALSE",
      "The same birds sleep for more than twelve hours a day when they return to land, which suggests the aerial sleep is a severe curtailment rather than a demonstration that they need less.",
      "On land they sleep far more.",
    ),
    tfng(
      "Half-brain sleep allows an animal to spend less total time asleep.",
      "FALSE",
      "Comparative work indicates that the sleeping hemisphere in unihemispheric sleep shows the same recovery processes as in whole-brain sleep, but only for that hemisphere, so the animal must sleep for longer overall to service both.",
      "The animal 'must sleep for longer overall'.",
    ),
    fromList(
      "summary_completion",
      SLEEP_BANK,
      "In dolphins one ______ shows slow waves while the other stays awake.",
      "hemisphere",
      "Recordings of electrical activity in dolphins show the characteristic slow waves of deep sleep in one hemisphere while the other shows the pattern of full wakefulness, with the two swapping every hour or two.",
      "One hemisphere sleeps at a time.",
    ),
    fromList(
      "summary_completion",
      SLEEP_BANK,
      "The ______ served by the sleeping side is the one that closes.",
      "eye",
      "The eye connected to the sleeping hemisphere is closed; the eye connected to the waking one stays open.",
      "The eye of the sleeping hemisphere closes.",
    ),
    fromList(
      "summary_completion",
      SLEEP_BANK,
      "A duck at the ______ of a row keeps its outward eye open.",
      "edge",
      "A duck at the edge of a row of sleeping ducks will sleep with the outward-facing eye open and the corresponding hemisphere awake, while a duck in the middle of the row sleeps with both.",
      "The duck 'at the edge of a row' does this.",
    ),
    fromList(
      "summary_completion",
      SLEEP_BANK,
      "The behaviour is adjusted according to the risk from ______.",
      "predators",
      "That is a direct demonstration that the animal is deploying the capacity in response to perceived risk rather than following a fixed pattern.",
      "It responds to perceived risk.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Frigatebirds sleep in short bouts totalling under an ______ a day in flight.",
      "hour",
      "Recordings from birds in flight show that they sleep in the air, in short bouts totalling less than an hour a day, sometimes with one hemisphere and sometimes with both, and that they continue to circle in rising air while doing it.",
      "Less than an hour a day in the air.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Dolphins show little of the stage in which mammals ______.",
      "dream",
      "Some of the deeper stages of sleep associated with memory consolidation in other mammals are either reduced or absent, and dolphins show little or none of the stage in which mammals dream.",
      "They show little of the dreaming stage.",
    ),
    mcq(
      "What happens to humans on a first night in a new place?",
      [
        "One hemisphere sleeps less deeply than the other",
        "Both hemispheres sleep more deeply than usual",
        "Sleep is delayed but otherwise normal",
        "The effect persists for several nights",
      ],
      "One hemisphere sleeps less deeply than the other",
      "On the first night in an unfamiliar place, one hemisphere sleeps less deeply than the other and responds more strongly to sounds, which explains a poor night's sleep in a hotel that cannot be blamed on the mattress.",
      "One hemisphere 'sleeps less deeply'.",
    ),
  ],
};
