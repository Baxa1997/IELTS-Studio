import { fromList, gapFill, mcq, tfng, type CuratedPassage } from "./shared";

const TAR_BANK = [
  "bark",
  "oxygen",
  "adhesive",
  "teeth",
  "genome",
  "birch",
  "bacteria",
  "handle",
  "temperature",
];

export const BIRCH_TAR: CuratedPassage = {
  key: "birch-tar",
  title: "The Oldest Chewing Gum",
  topic: "what a lump of prehistoric tar preserves besides tooth marks",
  difficulty: 6,
  body: `Among the least glamorous objects recovered from Stone Age sites in northern Europe are small blackish lumps, usually a few centimetres across, carrying the unmistakable impressions of human teeth. They are pieces of birch bark tar, and they have been chewed. Some are five thousand years old and some are considerably older, and for most of the history of archaeology they were catalogued and shelved without much comment.

Birch tar is made by heating birch bark in the absence of oxygen. The bark contains a group of compounds that, on heating, break down into a sticky black residue; if air is allowed in, the bark simply burns and nothing useful is produced. The resulting tar is the earliest manufactured adhesive known, and it was the standard way of fixing a stone point to a wooden shaft for tens of thousands of years across Europe and western Asia.

Making it is considerably harder than it sounds, and the difficulty has been the subject of an unexpectedly lively experimental literature. The temperature must be held in a fairly narrow band, low enough that the bark does not combust and high enough that the reaction proceeds, and air must be excluded throughout. Early reconstructions assumed a ceramic vessel and therefore concluded that tar production postdated pottery. Later experiments showed that a roll of bark buried under a fire, or a bark container in a shallow pit, produces usable quantities with no ceramic at all — which matters, because tar has been found at sites occupied by Neanderthals long before pottery existed anywhere.

Why people chewed it is reasonably clear. Tar sets hard when cold and must be warmed and softened before it can be used, and chewing is an efficient way of doing both while leaving the hands free. Some of the chewed pieces show tooth marks in the pattern of a piece being worked rather than merely held. Other suggestions — that it was used to clean the teeth, to relieve toothache, or simply for pleasure — are plausible, unprovable, and not mutually exclusive.

What changed the status of these objects was the realisation that a chewed lump is a sealed container of saliva. In 2019 a team extracted a complete human genome from a piece of tar found in Denmark and dated to about 5,700 years ago, a site from which no human bone at all has been recovered. The individual was female, had dark skin, dark hair and blue eyes, and was more closely related to hunter-gatherer populations from mainland Europe than to the farming populations moving into the region at the time.

The same sample carried more than her own DNA. Food residues showed hazelnut and duck, eaten shortly before. Her oral microbiome was recoverable in detail, including the bacterium that causes gum disease and a virus that causes glandular fever, which makes the lump one of the oldest direct records of human infection.

That combination is what gives these objects their present value. A tooth or a bone yields the genome of a person; a chewed lump yields the genome, the meal and the microbial community, from a single discarded piece of material that nobody thought worth recording for a century. It also comes with a precise moment attached, since the material was in somebody's mouth for a matter of minutes.

There is a methodological caution that the field has learned the expensive way. Ancient material of this kind is extraordinarily vulnerable to contamination by modern DNA, most of it from the people who excavated, washed, handled and catalogued the object. Several early results from ancient material were later shown to be the archaeologists. Current practice requires gloves and masks in the field, sampling of everybody who handled the object for comparison, and analysis of the characteristic chemical damage that distinguishes genuinely ancient DNA from recent.

The wider consequence is a change in what counts as a find. Material that used to be discarded or shelved — dental plaque, sediment from a cave floor, the residue inside a cooking pot, a chewed lump of tar — now carries information that bone does not, and the limiting factor in many excavations is no longer what was recovered but how it was handled by people who had no idea what it would one day be asked.`,
  questions: [
    tfng(
      "The lumps were regarded as significant finds when they were first recovered.",
      "FALSE",
      "Some are five thousand years old and some are considerably older, and for most of the history of archaeology they were catalogued and shelved without much comment.",
      "They were shelved 'without much comment'.",
    ),
    tfng(
      "Birch tar will form only if air is kept away from the bark.",
      "TRUE",
      "The bark contains a group of compounds that, on heating, break down into a sticky black residue; if air is allowed in, the bark simply burns and nothing useful is produced.",
      "With air, 'nothing useful is produced'.",
    ),
    tfng(
      "Tar production required pottery to have been invented first.",
      "FALSE",
      "Later experiments showed that a roll of bark buried under a fire, or a bark container in a shallow pit, produces usable quantities with no ceramic at all — which matters, because tar has been found at sites occupied by Neanderthals long before pottery existed anywhere.",
      "It works 'with no ceramic at all'.",
    ),
    tfng(
      "Chewing the tar served a practical purpose.",
      "TRUE",
      "Tar sets hard when cold and must be warmed and softened before it can be used, and chewing is an efficient way of doing both while leaving the hands free.",
      "Chewing warms and softens it.",
    ),
    tfng(
      "Human bone was found at the Danish site alongside the tar.",
      "FALSE",
      "In 2019 a team extracted a complete human genome from a piece of tar found in Denmark and dated to about 5,700 years ago, a site from which no human bone at all has been recovered.",
      "'No human bone at all has been recovered'.",
    ),
    tfng(
      "The individual identified belonged to the incoming farming population.",
      "FALSE",
      "The individual was female, had dark skin, dark hair and blue eyes, and was more closely related to hunter-gatherer populations from mainland Europe than to the farming populations moving into the region at the time.",
      "She was closer to hunter-gatherers.",
    ),
    tfng(
      "Some early results from ancient material turned out to be contamination.",
      "TRUE",
      "Several early results from ancient material were later shown to be the archaeologists.",
      "They 'were later shown to be the archaeologists'.",
    ),
    fromList(
      "summary_completion",
      TAR_BANK,
      "Tar is produced by heating ______ bark with air excluded.",
      "birch",
      "Birch tar is made by heating birch bark in the absence of oxygen.",
      "It is made from birch bark.",
    ),
    fromList(
      "summary_completion",
      TAR_BANK,
      "The absence of ______ is what stops the bark from simply burning.",
      "oxygen",
      "Birch tar is made by heating birch bark in the absence of oxygen.",
      "Oxygen must be absent.",
    ),
    fromList(
      "summary_completion",
      TAR_BANK,
      "It is the earliest manufactured ______ that archaeology has identified.",
      "adhesive",
      "The resulting tar is the earliest manufactured adhesive known, and it was the standard way of fixing a stone point to a wooden shaft for tens of thousands of years across Europe and western Asia.",
      "It is 'the earliest manufactured adhesive known'.",
    ),
    fromList(
      "summary_completion",
      TAR_BANK,
      "A chewed lump can preserve a complete human ______.",
      "genome",
      "In 2019 a team extracted a complete human genome from a piece of tar found in Denmark and dated to about 5,700 years ago, a site from which no human bone at all has been recovered.",
      "A complete genome was extracted.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Residues showed that she had recently eaten duck and ______.",
      "hazelnut",
      "Food residues showed hazelnut and duck, eaten shortly before.",
      "The residues were 'hazelnut and duck'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Fieldwork now requires ______ and masks to keep modern DNA out.",
      "gloves",
      "Current practice requires gloves and masks in the field, sampling of everybody who handled the object for comparison, and analysis of the characteristic chemical damage that distinguishes genuinely ancient DNA from recent.",
      "Practice requires 'sampling of everybody who handled the object'.",
    ),
    mcq(
      "What does the passage identify as the limiting factor in many excavations now?",
      [
        "How earlier finds were handled",
        "The quantity of bone recovered",
        "The cost of genetic analysis",
        "The age of the material available",
      ],
      "How earlier finds were handled",
      "Material that used to be discarded or shelved — dental plaque, sediment from a cave floor, the residue inside a cooking pot, a chewed lump of tar — now carries information that bone does not, and the limiting factor in many excavations is no longer what was recovered but how it was handled by people who had no idea what it would one day be asked.",
      "The limit is 'how it was handled'.",
    ),
  ],
};
