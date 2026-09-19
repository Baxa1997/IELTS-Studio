import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · manufacturing history · flow chart ------------------------

const GLASS_FLOW = {
  title: "The float process, in order",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · river ecology · people and a word bank --------------------

const BEAVER_PEOPLE = ["Fiona Traill", "Ola Nyström", "Marek Dvořák", "Hannah Speight"];
const BEAVER_BANK = [
  "dams",
  "sediment",
  "drought",
  "ponds",
  "timber",
  "flooding",
  "channels",
  "licence",
  "fur",
];

// ---- Passage 3 · human biology debate · lettered paragraphs ----------------

const RIDGE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const RIDGE_ENDINGS = [
  "because the contact area with a smooth surface is reduced rather than increased.",
  "although the same ridges appear on animals that never grip anything.",
  "which suggests the pattern is about sensing rather than holding.",
  "even though the prints themselves are laid down before birth.",
  "because wet fingers behave quite differently from dry ones.",
  "which the writer takes as a warning against tidy single explanations.",
  "despite the confidence with which the claim is repeated in textbooks.",
];

export const TEST_55: CuratedTest = {
  key: "full-test-55",
  targetBand: 7,
  passages: [
    {
      key: "t55-p1-float-glass",
      title: "Glass Without Grinding",
      topic: "a manufacturing process that replaced a century of polishing",
      difficulty: 6,
      body: `Until the middle of the twentieth century there were two ways to make a sheet of window glass and both were unsatisfactory. Drawn glass was pulled as a ribbon from a bath of molten material and cooled as it rose; it was cheap, and it was never quite flat, so that the view through it wavered and reflections in it bent. Plate glass was cast, then ground and polished on both faces by machines working with abrasives for hours. It was optically excellent and it was expensive, because as much as a fifth of the material was removed as dust and slurry, and because the grinding plant consumed enormous quantities of power.

The problem was well understood and had defeated several attempts. What was wanted was a way of producing a ribbon with two parallel, fire-finished faces — that is, surfaces that had set smooth from the melt and had never been touched by a tool — without the cost of polishing them into parallel.

Alastair Pilkington, an engineer at a family glassmaking firm in the north of England, proposed in 1952 that molten glass could be floated on a bath of molten metal. The idea rests on two properties. The metal has to be denser than glass, so the glass floats; it has to melt at a lower temperature than glass and boil at a much higher one, so that it stays liquid across the whole working range; and it must not react with glass. Tin satisfies all three conditions, and the bath has to be held under a slightly reducing atmosphere of nitrogen and hydrogen, because molten tin exposed to air oxidises and the oxide marks the glass.

What happens on the bath is the elegant part. Molten glass poured onto liquid tin spreads out under gravity and is pulled in by its own surface tension, and those two forces reach equilibrium at a particular thickness — about seven millimetres for soda-lime glass. The upper surface is flat because gravity has flattened it; the lower surface is flat because the tin beneath it is flat. Both are fire-finished. The ribbon then travels slowly down the bath, cooling as it goes, until at around six hundred degrees it is stiff enough to be lifted out on rollers and passed into a long oven, the lehr, where it is annealed — cooled slowly and evenly so that no internal stresses are frozen into it. At the end it is cut into sheets by a machine that scores and snaps the moving ribbon.

Getting from the principle to a saleable product took seven years and a great deal of money. The first fourteen months of production yielded nothing that could be sold at all; the ribbon was marked, or varied in thickness, or picked up tin from the bath. The company continued to fund the work through that period, a decision that was later described as the largest gamble in its history. Saleable glass was produced in 1959.

The economics that followed were decisive. Float glass has the optical quality of polished plate at a cost closer to that of drawn sheet, and the process is continuous: a float line runs for years without stopping, because shutting one down and restarting it costs more than running it at a loss through a slack period. Within fifteen years the technology had been licensed to manufacturers across the world, and grinding and polishing plants closed everywhere. Essentially all flat glass is now made this way.

Two limitations are worth noting. The equilibrium thickness of about seven millimetres is thicker than most windows need, so thinner glass is made by stretching the ribbon with angled rollers as it cools, and thicker glass by restraining it — both of which are departures from the pure process and require care. And the face that lay on the tin picks up a microscopically thin layer of it, undetectable in use but visible under ultraviolet light, which is why glaziers can tell which side of a pane faced the bath, and why certain coatings behave differently on the two faces.

Pilkington was knighted, the firm collected licence fees for decades, and the process is now so completely standard that the phrase "float glass" has stopped being a description of a method and become simply the name of the material. The windows in almost every building put up since about 1970 were made by floating a ribbon of glass on a pool of metal until it went flat by itself.`,
      questions: [
        tfng(
          "Drawn glass was cheaper to produce than plate glass.",
          "TRUE",
          "Drawn glass was pulled as a ribbon from a bath of molten material and cooled as it rose; it was cheap, and it was never quite flat, so that the view through it wavered and reflections in it bent.",
          "Drawn glass 'was cheap'; plate was expensive.",
        ),
        tfng(
          "A large proportion of plate glass was lost during finishing.",
          "TRUE",
          "It was optically excellent and it was expensive, because as much as a fifth of the material was removed as dust and slurry, and because the grinding plant consumed enormous quantities of power.",
          "'As much as a fifth of the material was removed'.",
        ),
        tfng(
          "Tin was chosen partly because it does not react with glass.",
          "TRUE",
          "Tin satisfies all three conditions, and the bath has to be held under a slightly reducing atmosphere of nitrogen and hydrogen, because molten tin exposed to air oxidises and the oxide marks the glass.",
          "It meets the conditions, one of which is not reacting.",
        ),
        tfng(
          "The thickness the ribbon settles at can be chosen freely by the operator.",
          "FALSE",
          "Molten glass poured onto liquid tin spreads out under gravity and is pulled in by its own surface tension, and those two forces reach equilibrium at a particular thickness — about seven millimetres for soda-lime glass.",
          "The thickness is set by an equilibrium, not chosen.",
        ),
        tfng(
          "The process produced sellable glass within a year of starting production.",
          "FALSE",
          "The first fourteen months of production yielded nothing that could be sold at all; the ribbon was marked, or varied in thickness, or picked up tin from the bath.",
          "Fourteen months produced nothing saleable.",
        ),
        tfng(
          "Float lines are shut down during periods of weak demand.",
          "FALSE",
          "Float glass has the optical quality of polished plate at a cost closer to that of drawn sheet, and the process is continuous: a float line runs for years without stopping, because shutting one down and restarting it costs more than running it at a loss through a slack period.",
          "Restarting costs more than running at a loss.",
        ),
        tfng(
          "The tin picked up by one face of the glass affects how it performs in use.",
          "FALSE",
          "And the face that lay on the tin picks up a microscopically thin layer of it, undetectable in use but visible under ultraviolet light, which is why glaziers can tell which side of a pane faced the bath, and why certain coatings behave differently on the two faces.",
          "The layer is 'undetectable in use'.",
        ),
        noteLine(
          GLASS_FLOW,
          null,
          "Molten glass is poured onto a bath of liquid ______",
          "tin",
          "Molten glass poured onto liquid tin spreads out under gravity and is pulled in by its own surface tension, and those two forces reach equilibrium at a particular thickness — about seven millimetres for soda-lime glass.",
          "It is poured 'onto liquid tin'.",
        ),
        noteLine(
          GLASS_FLOW,
          null,
          "It spreads until ______ and surface tension balance",
          "gravity",
          "The upper surface is flat because gravity has flattened it; the lower surface is flat because the tin beneath it is flat.",
          "Gravity flattens the upper face against surface tension.",
          { before: [{ text: "Continuous, from melt to cut sheet:", indent: 0 }] },
        ),
        noteLine(
          GLASS_FLOW,
          null,
          "The cooled ribbon passes into the ______ to be annealed",
          "lehr",
          "The ribbon then travels slowly down the bath, cooling as it goes, until at around six hundred degrees it is stiff enough to be lifted out on rollers and passed into a long oven, the lehr, where it is annealed — cooled slowly and evenly so that no internal stresses are frozen into it.",
          "It passes into 'a long oven, the lehr'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The bath is kept under an atmosphere of nitrogen and ______.",
          "hydrogen",
          "Tin satisfies all three conditions, and the bath has to be held under a slightly reducing atmosphere of nitrogen and hydrogen, because molten tin exposed to air oxidises and the oxide marks the glass.",
          "The atmosphere is 'nitrogen and hydrogen'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Glass that had set smooth from the melt was described as ______.",
          "fire-finished",
          "What was wanted was a way of producing a ribbon with two parallel, fire-finished faces — that is, surfaces that had set smooth from the melt and had never been touched by a tool — without the cost of polishing them into parallel.",
          "Such faces are 'fire-finished'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Thinner sheets are produced by stretching the ribbon using angled ______.",
          "rollers",
          "The equilibrium thickness of about seven millimetres is thicker than most windows need, so thinner glass is made by stretching the ribbon with angled rollers as it cools, and thicker glass by restraining it — both of which are departures from the pure process and require care.",
          "Thinner glass is stretched 'with angled rollers'.",
        ),
      ],
    },
    {
      key: "t55-p2-beaver-return",
      title: "The Engineer Nobody Hired",
      topic: "what happens to a river when an extinct animal is put back into it",
      difficulty: 7,
      body: `The Eurasian beaver was hunted out of Britain by the sixteenth century, for its fur, its meat and a glandular secretion once valued as a medicine. It disappeared from most of continental Europe over the following two hundred years, reduced by 1900 to perhaps twelve hundred animals in eight isolated populations. Reintroductions from those remnants began in the 1920s and continued through the century, and the European population now exceeds a million. Britain, characteristically, arrived last: beavers appeared on a Scottish river in the early 2000s, from origins nobody has ever officially established, and the arguments that followed have shaped how the animal is now managed.

What makes a beaver interesting is that it does not simply live in a river but rebuilds it. A family will dam a small watercourse, often several times along its length, producing a staircase of ponds and a spread of wet ground on either side. Fiona Traill, a freshwater ecologist who has monitored a Scottish catchment since before the animals arrived, describes the change as a conversion from a channel into a system. Where there was a single fast line of water there is now standing water, slow water, seasonal pools, dead standing timber, sunlit gaps in the bankside trees and a great deal of edge, and the species counts rise accordingly — amphibians, water beetles, dragonflies, bats hunting the insects, and birds that need the dead wood.

The hydrological effects have attracted more attention than the ecological ones, because they touch money. Ola Nyström, a hydrologist, has measured water leaving beaver-modified and unmodified headwaters in the same storm. The modified catchments release their water more slowly and over a longer period, reducing the height of the peak downstream, and they hold more water through dry spells. The effect is real, he emphasises, and it is small at the scale of a large river: a beaver complex on a headwater stream will not prevent a city from flooding. Its value is in the aggregate, across many small tributaries, and as one component of a catchment strategy rather than as a substitute for one.

There is also a water quality result that surprised the field. Marek Dvořák, who samples agricultural streams, has found that ponds behind beaver dams trap large quantities of sediment washed off farmland, together with the phosphorus and nitrogen bound to it, so that water leaving the complex carries substantially less of both. The ponds fill up over years and the animals move on, at which point the trapped material becomes a rich wet meadow rather than a problem, but on the timescale that matters to a water company the interception is genuine.

None of this is free. Beavers fell trees, including trees somebody planted; they flood low-lying fields, including fields somebody farms; they dig burrows into flood banks; and their dams block culverts and drainage ditches. Hannah Speight, who negotiates between landowners and conservation bodies, argues that every serious conflict she has dealt with was solvable with a technique that already exists — a pipe run through a dam to hold the pond at an agreed level, a mesh guard around a valuable tree, an electric fence, or in the last resort a licence to remove the animals — and that what causes the damage is not the beaver but the delay. A farmer who reports a problem and hears nothing for eight months does not become more tolerant in the interval.

The legal position has caught up unevenly. Beavers in Britain are now a protected species, which means that interfering with a dam requires permission, which in turn means that the speed of the licensing system has become the central practical question in the whole debate. Countries with longer experience have generally converged on a managed population: protected, monitored, and removed or relocated where they cause damage that cannot be mitigated, with compensation available. That arrangement satisfies nobody entirely, and it appears to work.

The wider significance is that the beaver is the first reintroduction in Britain of an animal that changes the landscape rather than merely living in it. Returning a bird of prey alters what eats what. Returning a beaver alters where the water goes, and therefore whose field is wet, which is a different kind of argument and a better test of whether restoration on a serious scale is something the country is prepared to pay for.`,
      questions: [
        fromList(
          "matching_features",
          BEAVER_PEOPLE,
          "The animal converts a simple watercourse into a varied system.",
          "Fiona Traill",
          "Fiona Traill, a freshwater ecologist who has monitored a Scottish catchment since before the animals arrived, describes the change as a conversion from a channel into a system.",
          "Traill describes the channel-to-system change.",
        ),
        fromList(
          "matching_features",
          BEAVER_PEOPLE,
          "The flood benefit is genuine but should not be overstated.",
          "Ola Nyström",
          "The effect is real, he emphasises, and it is small at the scale of a large river: a beaver complex on a headwater stream will not prevent a city from flooding.",
          "Nyström calls it real but small at scale.",
        ),
        fromList(
          "matching_features",
          BEAVER_PEOPLE,
          "Material washed from farmland is captured behind the dams.",
          "Marek Dvořák",
          "Marek Dvořák, who samples agricultural streams, has found that ponds behind beaver dams trap large quantities of sediment washed off farmland, together with the phosphorus and nitrogen bound to it, so that water leaving the complex carries substantially less of both.",
          "Dvořák measured the sediment interception.",
        ),
        fromList(
          "matching_features",
          BEAVER_PEOPLE,
          "Slow responses to complaints cause more trouble than the animals do.",
          "Hannah Speight",
          "A farmer who reports a problem and hears nothing for eight months does not become more tolerant in the interval.",
          "Speight blames the delay rather than the beaver.",
        ),
        fromList(
          "summary_completion",
          BEAVER_BANK,
          "A family builds ______ along a small stream, sometimes several of them.",
          "dams",
          "A family will dam a small watercourse, often several times along its length, producing a staircase of ponds and a spread of wet ground on either side.",
          "They dam the watercourse repeatedly.",
        ),
        fromList(
          "summary_completion",
          BEAVER_BANK,
          "The result is a staircase of ______ and wet ground on both banks.",
          "ponds",
          "A family will dam a small watercourse, often several times along its length, producing a staircase of ponds and a spread of wet ground on either side.",
          "It produces 'a staircase of ponds'.",
        ),
        fromList(
          "summary_completion",
          BEAVER_BANK,
          "Water is held back, lowering the peak and easing the effects of ______.",
          "drought",
          "The modified catchments release their water more slowly and over a longer period, reducing the height of the peak downstream, and they hold more water through dry spells.",
          "They 'hold more water through dry spells'.",
        ),
        fromList(
          "summary_completion",
          BEAVER_BANK,
          "The ponds also capture ______ carried off nearby fields.",
          "sediment",
          "Marek Dvořák, who samples agricultural streams, has found that ponds behind beaver dams trap large quantities of sediment washed off farmland, together with the phosphorus and nitrogen bound to it, so that water leaving the complex carries substantially less of both.",
          "They 'trap large quantities of sediment'.",
        ),
        fromList(
          "summary_completion",
          BEAVER_BANK,
          "Removing animals now requires a ______ from the authorities.",
          "licence",
          "Hannah Speight, who negotiates between landowners and conservation bodies, argues that every serious conflict she has dealt with was solvable with a technique that already exists — a pipe run through a dam to hold the pond at an agreed level, a mesh guard around a valuable tree, an electric fence, or in the last resort a licence to remove the animals — and that what causes the damage is not the beaver but the delay.",
          "Removal requires 'a licence'.",
        ),
        mcq(
          "How low did the European population fall by 1900?",
          [
            "About twelve hundred animals",
            "About a million animals",
            "About eight thousand animals",
            "The passage does not say",
          ],
          "About twelve hundred animals",
          "It disappeared from most of continental Europe over the following two hundred years, reduced by 1900 to perhaps twelve hundred animals in eight isolated populations.",
          "It fell to 'perhaps twelve hundred animals'.",
        ),
        mcq(
          "What happens to a beaver pond once it fills with trapped material?",
          [
            "It becomes wet meadow after the animals leave",
            "It has to be dredged by the landowner",
            "It releases the stored nutrients downstream",
            "It reverts to a fast single channel",
          ],
          "It becomes wet meadow after the animals leave",
          "The ponds fill up over years and the animals move on, at which point the trapped material becomes a rich wet meadow rather than a problem, but on the timescale that matters to a water company the interception is genuine.",
          "The material 'becomes a rich wet meadow'.",
        ),
        mcq(
          "What has become the central practical question in Britain?",
          [
            "How quickly permission to act can be obtained",
            "Whether beavers should be protected at all",
            "Where the original animals came from",
            "How many beavers a catchment can hold",
          ],
          "How quickly permission to act can be obtained",
          "Beavers in Britain are now a protected species, which means that interfering with a dam requires permission, which in turn means that the speed of the licensing system has become the central practical question in the whole debate.",
          "'The speed of the licensing system' is now central.",
        ),
        mcq(
          "Why does the passage call the beaver a different kind of reintroduction?",
          [
            "It changes the landscape rather than living in it",
            "It was absent for longer than other species",
            "It arrived without official approval",
            "It has no natural predators in Britain",
          ],
          "It changes the landscape rather than living in it",
          "The wider significance is that the beaver is the first reintroduction in Britain of an animal that changes the landscape rather than merely living in it.",
          "It 'changes the landscape rather than merely living in it'.",
        ),
      ],
    },
    {
      key: "t55-p3-fingerprint-ridges",
      title: "The Ridges on Our Fingers",
      topic: "the unsettled question of what fingerprints are actually for",
      difficulty: 8,
      body: `A) Almost everyone has been told that the ridges on our fingertips are there to improve grip, in the way that the tread on a tyre is. The explanation is repeated in textbooks, in museum displays and in the introductory paragraphs of forensic papers, and it has the two qualities that keep an idea in circulation: it is intuitive, and nobody is likely to check it.

B) It was checked in 2009. A group at Manchester measured the friction between a human fingertip and a sheet of acrylic under controlled loads, expecting the ridged skin to grip better than a flat equivalent. It did not. On a smooth dry surface, friction depends on the area of real contact between skin and material, and ridges reduce that area by roughly a third compared with the same skin pressed flat. By the measure that the grip hypothesis predicts, fingerprints make us worse at holding smooth objects, not better.

C) The result is less decisive than it first appears, because smooth dry acrylic is not the surface our ancestors were holding. On rough surfaces, on wet ones, and on compliant materials like a branch or a piece of fruit, the picture changes. Ridges channel water away from the contact, in the way that tyre tread does, and wet fingertips grip better than wet flat skin. They also allow the skin to deform and interlock with irregularities in a rough surface. The most careful summary is that ridges help in some conditions, hinder in others, and that the tyre analogy is doing a great deal of unearned work.

D) The alternative explanation concerns sensation rather than mechanics. Beneath the ridges lie dense arrays of mechanoreceptors, and one type in particular, the Pacinian corpuscle, responds to vibration in a band centred around two hundred and fifty hertz. When a fingertip is drawn across a textured surface, the ridges convert that texture into vibration, and their spacing amplifies frequencies in precisely the range those receptors are tuned to. On this account the fingerprint is not a tread but an instrument: a mechanical filter that turns fine texture into a signal the nervous system is built to read. Experiments with artificial ridged sensors have reproduced the amplification, and the correspondence between ridge spacing and receptor tuning is difficult to dismiss as coincidence.

E) A third line of evidence comes from development. Ridge patterns form in the womb between about the tenth and sixteenth week, as the friction ridge skin buckles under stresses set up by differential growth of the layers beneath it. The overall pattern class — arch, loop or whorl — is influenced by genetics and by the shape of the finger pad at that moment, but the fine detail arises from the mechanics of buckling and is not specified anywhere, which is why identical twins share pattern class but not prints, and why the arrangement has proved so useful for identification. Identification, it should be said, is a use we found for the ridges, not a reason they exist.

F) The comparative evidence is where the tidy stories break down. Friction ridge skin is found in primates and, independently, in the tails of some tree-dwelling marsupials, which is consistent with both grip and touch. But it is also present on the hands of species that neither climb nor manipulate objects with any delicacy, and absent in some that do. Koalas have fingerprints almost indistinguishable from ours under a microscope, which is either an argument for convergent evolution around eucalyptus branches or a reminder of how easily a satisfying explanation can be constructed after the fact.

G) I do not think the question is settled, and I am suspicious of the confidence with which each answer in turn has been asserted. The grip explanation survived for a century without being measured. The touch explanation is better supported but explains only part of the picture, and both may be partly right, since a structure that evolved for one advantage is free to acquire others. What the episode really illustrates is how long a plausible functional story can stand in for evidence when the structure in question is familiar enough that nobody thinks to ask. Fingerprints are on the end of every hand that has ever written a textbook, and it took until the twenty-first century for anyone to put one on a friction rig and find out.`,
      questions: [
        fromList(
          "matching_information",
          RIDGE_PARAGRAPHS,
          "a description of how the pattern is formed before birth",
          "E",
          "Ridge patterns form in the womb between about the tenth and sixteenth week, as the friction ridge skin buckles under stresses set up by differential growth of the layers beneath it.",
          "Paragraph E describes prenatal buckling.",
        ),
        fromList(
          "matching_information",
          RIDGE_PARAGRAPHS,
          "an experiment whose result contradicted the expectation behind it",
          "B",
          "A group at Manchester measured the friction between a human fingertip and a sheet of acrylic under controlled loads, expecting the ridged skin to grip better than a flat equivalent.",
          "Paragraph B reports the friction measurement.",
        ),
        fromList(
          "matching_information",
          RIDGE_PARAGRAPHS,
          "an animal whose prints closely resemble a human's",
          "F",
          "Koalas have fingerprints almost indistinguishable from ours under a microscope, which is either an argument for convergent evolution around eucalyptus branches or a reminder of how easily a satisfying explanation can be constructed after the fact.",
          "Paragraph F names the koala.",
        ),
        fromList(
          "matching_information",
          RIDGE_PARAGRAPHS,
          "two reasons why an unexamined explanation stayed in circulation",
          "A",
          "The explanation is repeated in textbooks, in museum displays and in the introductory paragraphs of forensic papers, and it has the two qualities that keep an idea in circulation: it is intuitive, and nobody is likely to check it.",
          "Paragraph A gives the two qualities.",
        ),
        fromList(
          "matching_information",
          RIDGE_PARAGRAPHS,
          "a match between the spacing of the ridges and what the nerves detect",
          "D",
          "When a fingertip is drawn across a textured surface, the ridges convert that texture into vibration, and their spacing amplifies frequencies in precisely the range those receptors are tuned to.",
          "Paragraph D matches spacing to receptor tuning.",
        ),
        ynng(
          "The writer thinks the 2009 result completely disproves the grip explanation.",
          "NO",
          "The result is less decisive than it first appears, because smooth dry acrylic is not the surface our ancestors were holding.",
          "It is 'less decisive than it first appears'.",
        ),
        ynng(
          "The writer regards identification as a purpose the ridges evolved for.",
          "NO",
          "Identification, it should be said, is a use we found for the ridges, not a reason they exist.",
          "It is 'a use we found', not a reason.",
        ),
        ynng(
          "The writer accepts that the touch explanation leaves questions unanswered.",
          "YES",
          "The touch explanation is better supported but explains only part of the picture, and both may be partly right, since a structure that evolved for one advantage is free to acquire others.",
          "It 'explains only part of the picture'.",
        ),
        ynng(
          "The writer believes familiar structures are examined more carefully than unfamiliar ones.",
          "NO",
          "What the episode really illustrates is how long a plausible functional story can stand in for evidence when the structure in question is familiar enough that nobody thinks to ask.",
          "Familiarity is precisely why nobody checked.",
        ),
        fromList(
          "matching_sentence_endings",
          RIDGE_ENDINGS,
          "The friction test told against the grip hypothesis",
          "because the contact area with a smooth surface is reduced rather than increased.",
          "On a smooth dry surface, friction depends on the area of real contact between skin and material, and ridges reduce that area by roughly a third compared with the same skin pressed flat.",
          "Ridges cut the real contact area by about a third.",
        ),
        fromList(
          "matching_sentence_endings",
          RIDGE_ENDINGS,
          "That test was not the end of the matter,",
          "because wet fingers behave quite differently from dry ones.",
          "Ridges channel water away from the contact, in the way that tyre tread does, and wet fingertips grip better than wet flat skin.",
          "Wet fingertips do grip better than flat wet skin.",
        ),
        fromList(
          "matching_sentence_endings",
          RIDGE_ENDINGS,
          "The tuning of the receptors beneath the skin is suggestive,",
          "which suggests the pattern is about sensing rather than holding.",
          "On this account the fingerprint is not a tread but an instrument: a mechanical filter that turns fine texture into a signal the nervous system is built to read.",
          "The fingerprint is described as an instrument, not a tread.",
        ),
        fromList(
          "matching_sentence_endings",
          RIDGE_ENDINGS,
          "The comparative evidence resists both explanations,",
          "although the same ridges appear on animals that never grip anything.",
          "But it is also present on the hands of species that neither climb nor manipulate objects with any delicacy, and absent in some that do.",
          "It appears in species that neither climb nor manipulate.",
        ),
        fromList(
          "matching_sentence_endings",
          RIDGE_ENDINGS,
          "The whole episode is instructive,",
          "which the writer takes as a warning against tidy single explanations.",
          "The grip explanation survived for a century without being measured.",
          "A tidy story stood unmeasured for a hundred years.",
        ),
      ],
    },
  ],
};
