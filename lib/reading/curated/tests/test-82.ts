import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · entomology · notes box -------------------------------------

const BEE_NOTES = {
  title: "What a solitary bee needs",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · public health · people and a word bank --------------------

const NET_PEOPLE = ["Aisha Balewa", "Tomas Ferreira", "Nadia Haddad", "Peter Osei"];
const NET_BANK = [
  "insecticide",
  "holes",
  "sleeping",
  "washing",
  "free",
  "shops",
  "resistance",
  "fishing",
  "shape",
];

// ---- Passage 3 · island conservation · lettered paragraphs ------------------

const RAT_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const RAT_ENDINGS = [
  "because a single surviving pregnant female undoes the whole operation.",
  "although the birds themselves were never the target of the poison.",
  "since the island can be reached only by boat in calm weather.",
  "which is why the work is done in the season when food is scarcest.",
  "because a bird that has never nested there has no reason to try.",
  "even though nobody had asked whether the rats were the only problem.",
  "which makes the cost per island fall as the method is repeated.",
];

export const TEST_82: CuratedTest = {
  key: "full-test-82",
  targetBand: 4,
  passages: [
    {
      key: "t82-p1-solitary-bees",
      title: "The Bees That Live Alone",
      topic: "why most of the world's bees have no hive, no honey and no queen",
      difficulty: 4,
      body: `Almost everybody who is asked to picture a bee pictures the same insect: a honeybee, living in a hive of many thousands, ruled by a queen, making honey that people collect. That insect is real, and it is important, but it is not typical. Of the twenty thousand or so species of bee that have been described, fewer than one in twenty live in a colony of any kind. The great majority are solitary. A solitary female builds her own nest, provisions it by herself, lays her eggs in it, seals it and dies, usually before her young emerge. There is no queen, no worker, no division of labour and no honey.

The word "solitary" is slightly misleading, because these bees are often found in groups. Hundreds of females of the same species may dig their nests in the same sunny bank, a few centimetres apart, in what looks from a distance like a colony. It is not one. Each burrow belongs to one female, who defends it against her neighbours and shares nothing with them. The grouping happens because suitable ground is scarce, not because the insects cooperate.

The nest itself is simple. Some species dig a tunnel in bare earth. Others use a hollow plant stem, a beetle hole in dead wood, an old snail shell, or a crack in a wall. The female makes a series of chambers along the tunnel, one behind another. Into each chamber she packs a ball of pollen mixed with nectar, lays a single egg on it, and closes the chamber with a wall of mud, chewed leaf, resin or fine hairs, depending on the species. The larva hatches, eats the food it has been left, and develops without ever meeting its mother.

This arrangement has a consequence that matters a great deal to farmers. A honeybee collects pollen to feed a colony, and carries it home packed tightly and wetted with nectar into baskets on its legs. Pollen carried that way is not easily lost, which is efficient for the bee and unhelpful for the plant. Many solitary bees carry pollen dry, on stiff hairs on the underside of the abdomen, and they lose it constantly as they move. A mason bee visiting an apple flower is therefore a better pollinator of that flower than a honeybee is, flower for flower, and studies in orchards repeatedly find that a few hundred mason bees do the work of tens of thousands of honeybees.

Solitary bees are also, in one narrow sense, easier to keep. They cannot be kept in the way a hive is kept, because there is nothing to manage, but they can be attracted. A block of wood drilled with holes of the right diameter, placed in a dry spot facing the morning sun, will be occupied by mason or leafcutter bees in most of the temperate world within a season or two. Commercial orchards in several countries now put out such blocks by the thousand. The practice has spread to gardens as well, where the same blocks are sold as "bee hotels".

Here the enthusiasm has run ahead of the evidence. A badly made hotel does harm. Holes that are too short force the female to lay only male eggs, which need less food, so the structure produces a generation with almost no females in it. Holes that cannot be cleaned accumulate parasitic wasps and a fungal disease that spreads between chambers. Plastic and glass tubes trap moisture and the larvae drown or rot. A hotel with hundreds of holes in one place concentrates bees at a density no natural bank would ever reach, and concentrates their diseases with them.

The advice from the researchers who study these insects is therefore unglamorous. A small hotel is better than a large one. Holes should be at least fifteen centimetres deep and made of wood or paper rather than plastic. The tubes should be replaceable, and replaced every year or two. Most importantly, the hotel is useless without food. A solitary bee flies a few hundred metres at most, and if there is nothing flowering within that radius for the whole of her short adult life, the nest will fail whatever it is made of.

That last point is the one most often missed. Providing nest sites is easy, visible and satisfying, and it is not what most solitary bees are short of. What they are short of is flowers in continuous succession from early spring to late summer, and bare undisturbed ground for the majority of species that dig rather than borrow. Neither is photogenic. A lawn left unmown for a season does more for the bees of a garden than any amount of drilled wood, and it is a good deal cheaper.`,
      questions: [
        tfng(
          "Most described bee species live in colonies.",
          "FALSE",
          "Of the twenty thousand or so species of bee that have been described, fewer than one in twenty live in a colony of any kind.",
          "Fewer than one in twenty live in a colony.",
        ),
        tfng(
          "A solitary female usually dies before her offspring appear.",
          "TRUE",
          "A solitary female builds her own nest, provisions it by herself, lays her eggs in it, seals it and dies, usually before her young emerge.",
          "She dies 'usually before her young emerge'.",
        ),
        tfng(
          "Solitary bees nesting close together share the work of feeding their young.",
          "FALSE",
          "Each burrow belongs to one female, who defends it against her neighbours and shares nothing with them.",
          "She 'shares nothing with them'.",
        ),
        tfng(
          "Honeybees carry pollen in a way that loses very little of it.",
          "TRUE",
          "Pollen carried that way is not easily lost, which is efficient for the bee and unhelpful for the plant.",
          "Pollen carried that way is 'not easily lost'.",
        ),
        tfng(
          "Mason bees can be managed in hives in the way honeybees are.",
          "FALSE",
          "They cannot be kept in the way a hive is kept, because there is nothing to manage, but they can be attracted.",
          "They 'cannot be kept in the way a hive is kept'.",
        ),
        tfng(
          "Short nest holes result in very few female offspring.",
          "TRUE",
          "Holes that are too short force the female to lay only male eggs, which need less food, so the structure produces a generation with almost no females in it.",
          "The result has 'almost no females in it'.",
        ),
        tfng(
          "Mason bees were first drilled into wooden blocks in Japan.",
          "NOT GIVEN",
          "",
          "The passage describes the blocks but says nothing about where the practice began.",
        ),
        noteLine(
          BEE_NOTES,
          null,
          "Holes should be at least fifteen centimetres ______",
          "deep",
          "Holes should be at least fifteen centimetres deep and made of wood or paper rather than plastic.",
          "The depth given is fifteen centimetres.",
          { before: [{ text: "Advice from researchers:", indent: 0 }] },
        ),
        noteLine(
          BEE_NOTES,
          null,
          "Tubes must be ______ rather than permanent",
          "replaceable",
          "The tubes should be replaceable, and replaced every year or two.",
          "They should be replaceable.",
        ),
        noteLine(
          BEE_NOTES,
          null,
          "A ______ should be left unmown for a season",
          "lawn",
          "A lawn left unmown for a season does more for the bees of a garden than any amount of drilled wood, and it is a good deal cheaper.",
          "An unmown lawn helps most.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Bees group their nests together because suitable ______ is scarce.",
          "ground",
          "The grouping happens because suitable ground is scarce, not because the insects cooperate.",
          "Suitable ground is scarce.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Many solitary bees carry pollen dry on hairs under the ______.",
          "abdomen",
          "Many solitary bees carry pollen dry, on stiff hairs on the underside of the abdomen, and they lose it constantly as they move.",
          "The hairs are under the abdomen.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A solitary bee forages at most a few hundred ______ from her nest.",
          "metres",
          "A solitary bee flies a few hundred metres at most, and if there is nothing flowering within that radius for the whole of her short adult life, the nest will fail whatever it is made of.",
          "Her range is a few hundred metres.",
        ),
      ],
    },
    {
      key: "t82-p2-bed-nets",
      title: "The Net Over the Bed",
      topic: "a cheap piece of cloth, and the difficulty of getting it used",
      difficulty: 4,
      body: `The mosquito that carries malaria in most of Africa bites at night, indoors, and usually between midnight and dawn. That single fact about its habits is the reason a rectangle of cloth has probably saved more lives in the last twenty-five years than any other malaria measure. A net hung over a sleeping place puts a physical barrier between the insect and the person for exactly the hours the insect hunts.

A plain net alone is of limited use. It tears, it is tucked in badly, and a mosquito will find the gap. The advance that mattered was treating the fabric with an insecticide, so that a mosquito landing on it is killed rather than merely delayed. A treated net protects the person under it and also kills part of the mosquito population of the house, which protects the neighbours too. In a village where most beds are covered, people sleeping without a net are bitten less than they would be in a village with no nets at all. This shared benefit is the main argument for distributing nets to everyone rather than selling them to those who ask.

Early treated nets had to be dipped in insecticide again every six to twelve months, and in practice almost nobody did it. The solution was to build the insecticide into the fibre itself, so that it migrates slowly to the surface as the outer layer is washed away. A modern long-lasting net is supposed to survive twenty washes and three years of use. Field studies find that the chemical does indeed last about that long; the net, unfortunately, often does not, because holes appear faster than the insecticide runs out.

Aisha Balewa, who has spent years measuring what happens to nets after they are handed over, describes the gap between the trial and the household as the whole problem. In a trial, nets are new, correctly hung and used every night under observation. In a house, a net is hung from nails in a mud wall, pushed aside by children, singed by a lamp, and by the second year has several holes in it. She is blunt that the durability figures printed on the packaging describe laboratory washing machines and not the reality of the households the nets go to.

Tomas Ferreira, an economist, has studied how nets should be given out. The question was once genuinely contested: charging a small amount was thought to ensure that only those who wanted a net would take one, and that those who paid would value it. The experiments went the other way. Charging even a token sum cut the number of nets taken up sharply, and did nothing measurable to improve how carefully they were used. He now regards free mass distribution, repeated every three years, as settled policy rather than an open question.

Nadia Haddad works on the insects rather than the people, and her concern is resistance. The same class of insecticide was used on almost every net for two decades. Mosquito populations across much of Africa now carry genes that let them survive contact with it, and in some districts a net's chemical no longer kills anything. The physical barrier still works, which is why nets remain worth distributing, but the extra community-wide effect is weakening. Newer nets combine two chemicals with different modes of action, which restores much of the effect and costs more.

Peter Osei, who manages distribution campaigns, points at a use of nets that irritates donors and interests him. Nets are sometimes cut up and used to fence a vegetable plot, screen a window, or make a fishing net. Surveys that set out to measure this misuse consistently find it to be rare — a few per cent of nets, usually old ones — but the anecdote travels further than the survey. He argues that a household which has enough nets and uses an old one for a fence is not the failure the story implies.

What has actually been achieved is substantial and unfinished. Malaria deaths fell by roughly half between 2000 and 2015, and the majority of that fall is attributed to nets. Since then the decline has flattened. Resistance is part of the reason; so is the fact that the easiest gains come first, and the households still unreached are the hardest to reach. The net is a cheap and effective tool that has run into the limits of being only a tool, and the next advance will have to be something else.`,
      questions: [
        fromList(
          "matching_features",
          NET_PEOPLE,
          "The published durability figures do not describe real households.",
          "Aisha Balewa",
          "She is blunt that the durability figures printed on the packaging describe laboratory washing machines and not the reality of the households the nets go to.",
          "Balewa contrasts the packaging with the household.",
        ),
        fromList(
          "matching_features",
          NET_PEOPLE,
          "Asking for payment reduced how many nets people took.",
          "Tomas Ferreira",
          "Charging even a token sum cut the number of nets taken up sharply, and did nothing measurable to improve how carefully they were used.",
          "Ferreira reports the effect of charging.",
        ),
        fromList(
          "matching_features",
          NET_PEOPLE,
          "The chemical part of the net's effect is fading.",
          "Nadia Haddad",
          "Nadia Haddad works on the insects rather than the people, and her concern is resistance.",
          "Haddad works on the insects, and on resistance.",
        ),
        fromList(
          "matching_features",
          NET_PEOPLE,
          "A widely repeated criticism is rarer than it sounds.",
          "Peter Osei",
          "Surveys that set out to measure this misuse consistently find it to be rare — a few per cent of nets, usually old ones — but the anecdote travels further than the survey.",
          "Osei sets the surveys against the anecdote.",
        ),
        fromList(
          "summary_completion",
          NET_BANK,
          "The mosquito bites indoors while people are ______.",
          "sleeping",
          "A net hung over a sleeping place puts a physical barrier between the insect and the person for exactly the hours the insect hunts.",
          "The net covers the sleeping place.",
        ),
        fromList(
          "summary_completion",
          NET_BANK,
          "Treating the cloth with ______ kills the insect that lands on it.",
          "insecticide",
          "The advance that mattered was treating the fabric with an insecticide, so that a mosquito landing on it is killed rather than merely delayed.",
          "The insecticide kills rather than delays.",
        ),
        fromList(
          "summary_completion",
          NET_BANK,
          "A net's chemical outlasts the fabric because ______ appear quickly.",
          "holes",
          "Field studies find that the chemical does indeed last about that long; the net, unfortunately, often does not, because holes appear faster than the insecticide runs out.",
          "Holes appear faster than the chemical runs out.",
        ),
        fromList(
          "summary_completion",
          NET_BANK,
          "Nets are now handed out ______ rather than sold.",
          "free",
          "He now regards free mass distribution, repeated every three years, as settled policy rather than an open question.",
          "Free distribution is now policy.",
        ),
        fromList(
          "summary_completion",
          NET_BANK,
          "Mosquitoes in many districts now show ______ to the usual chemical.",
          "resistance",
          "Mosquito populations across much of Africa now carry genes that let them survive contact with it, and in some districts a net's chemical no longer kills anything.",
          "They survive contact with the usual chemical.",
        ),
        mcq(
          "Why does a village benefit even where some people sleep without a net?",
          [
            "Treated nets reduce the local mosquito population",
            "Untreated nets are given to the remaining households",
            "Mosquitoes avoid villages where nets are common",
            "The nets are hung over doorways as well",
          ],
          "Treated nets reduce the local mosquito population",
          "A treated net protects the person under it and also kills part of the mosquito population of the house, which protects the neighbours too.",
          "The net kills part of the local population.",
        ),
        mcq(
          "Why did nets stop needing to be dipped again?",
          [
            "The insecticide was built into the fibre",
            "The insecticide was made stronger",
            "Households were given dipping kits",
            "The nets were replaced every year",
          ],
          "The insecticide was built into the fibre",
          "The solution was to build the insecticide into the fibre itself, so that it migrates slowly to the surface as the outer layer is washed away.",
          "It was built into the fibre.",
        ),
        mcq(
          "What do newer nets do about resistance?",
          [
            "They combine two different chemicals",
            "They use a thicker fabric",
            "They are washed before distribution",
            "They are distributed only in resistant districts",
          ],
          "They combine two different chemicals",
          "Newer nets combine two chemicals with different modes of action, which restores much of the effect and costs more.",
          "Two modes of action are combined.",
        ),
        mcq(
          "What does the writer say about progress since 2015?",
          [
            "The rate of improvement has slowed",
            "Deaths have begun rising again",
            "Nets have been withdrawn in some countries",
            "The fall has continued at the same rate",
          ],
          "The rate of improvement has slowed",
          "Since then the decline has flattened.",
          "The decline 'has flattened'.",
        ),
      ],
    },
    {
      key: "t82-p3-island-rats",
      title: "Clearing an Island of Its Rats",
      topic: "an unsentimental conservation method, and what it has to get exactly right",
      difficulty: 5,
      body: `A) Rats reached most of the world's islands in the holds of ships, and on islands they are catastrophic. Seabirds that evolved without any ground predator nest in burrows or on open ground and defend nothing. A rat population that arrives on such an island eats eggs, chicks and sometimes adults, and within a few decades a colony of hundreds of thousands can be reduced to a remnant or to nothing. Something between a third and a half of all recorded bird extinctions are attributed to introduced predators on islands, and rats are the most widespread of them.

B) The response, developed largely in New Zealand from the 1960s onwards, is eradication: not control, not reduction, but the removal of every individual. The distinction is absolute and it drives everything about how the work is done. A control programme that kills ninety-five per cent of the rats on an island has achieved nothing durable, because the survivors breed back to the previous number within a year or two. An eradication that kills every rat but one pregnant female has also achieved nothing. There is no partial credit.

C) In practice this means poison, distributed as bait, usually from a helicopter flying a precise grid so that no square of the island is missed. The bait contains an anticoagulant, and the operation is timed for the season when natural food is scarcest, so that every rat on the island is hungry enough to take it. Islands are chosen when they are small enough to be covered completely and far enough from other land that rats cannot swim or raft back. The cost per hectare is high and falls steeply with experience, which is why the technique spread first through one country and then outward.

D) The obvious objection is the poison itself. Anticoagulant bait kills things other than rats. Land crabs eat it without harm but carry it; gulls and birds of prey that scavenge poisoned carcasses can die; on some islands native species have had to be caught and held in captivity for the duration of the operation and released afterwards. Practitioners do not deny any of this. Their argument is arithmetic: a few hundred individuals of a common species die once, and a colony of a hundred thousand seabirds recovers permanently. Stated that way it is persuasive, and it is also exactly the kind of argument that should be checked rather than assumed.

E) When it is checked, the results are mostly good and occasionally embarrassing. Seabird numbers on cleared islands rise, sometimes dramatically and sometimes only after decades, because a species that has not bred on an island within living memory has no reason to prospect there. Vegetation changes as well, in a way nobody predicted at first: the returning seabirds bring nutrients from the sea and deposit them on land, and the plant community shifts towards species that can use them. The island that emerges is not the island that was there before the rats; it is a new arrangement that happens to include the birds.

F) The embarrassments have come from islands where rats were not the only introduced animal. Removing rats from an island that also has cats can make matters worse for a while, because the cats, deprived of rats, turn to the birds. Removing rabbits can release a plant that the rabbits had been suppressing. On one subantarctic island the removal of cats led to an explosion of rabbits and mice and a collapse of the vegetation that took a second, far more expensive operation to reverse. The lesson drawn was that an island's introduced species have to be treated as one system and removed in the right order, or preferably together.

G) The method has now been used on more than eight hundred islands, and the success rate is above eighty per cent. Failures are almost always explained the same way: an island slightly too large to cover completely, a boat that reintroduced rats afterwards, or bait taken by something else before the rats found it. The frontier is size. Islands of a few thousand hectares are now routine; islands of tens of thousands are being attempted; the very large ones, and the inhabited ones, remain out of reach, because covering a whole island with poison requires the agreement of everybody living on it and that is a different sort of problem entirely.`,
      questions: [
        fromList(
          "matching_information",
          RAT_PARAGRAPHS,
          "the reason a nearly complete kill is worth nothing",
          "B",
          "A control programme that kills ninety-five per cent of the rats on an island has achieved nothing durable, because the survivors breed back to the previous number within a year or two.",
          "Paragraph B explains why partial removal fails.",
        ),
        fromList(
          "matching_information",
          RAT_PARAGRAPHS,
          "an unexpected change to the plants of a cleared island",
          "E",
          "Vegetation changes as well, in a way nobody predicted at first: the returning seabirds bring nutrients from the sea and deposit them on land, and the plant community shifts towards species that can use them.",
          "Paragraph E describes the vegetation shift.",
        ),
        fromList(
          "matching_information",
          RAT_PARAGRAPHS,
          "a case where removing one animal made the situation worse",
          "F",
          "On one subantarctic island the removal of cats led to an explosion of rabbits and mice and a collapse of the vegetation that took a second, far more expensive operation to reverse.",
          "Paragraph F gives the subantarctic case.",
        ),
        fromList(
          "matching_information",
          RAT_PARAGRAPHS,
          "how the bait is spread so that no ground is missed",
          "C",
          "In practice this means poison, distributed as bait, usually from a helicopter flying a precise grid so that no square of the island is missed.",
          "Paragraph C describes the helicopter grid.",
        ),
        fromList(
          "matching_information",
          RAT_PARAGRAPHS,
          "an estimate of how much extinction introduced predators account for",
          "A",
          "Something between a third and a half of all recorded bird extinctions are attributed to introduced predators on islands, and rats are the most widespread of them.",
          "Paragraph A gives the share of extinctions.",
        ),
        ynng(
          "The writer thinks the harm done by the bait to other animals is exaggerated by critics.",
          "NO",
          "Practitioners do not deny any of this.",
          "The writer reports the harm as real and undenied.",
        ),
        ynng(
          "The writer believes the arithmetic argument for eradication should be tested rather than taken on trust.",
          "YES",
          "Stated that way it is persuasive, and it is also exactly the kind of argument that should be checked rather than assumed.",
          "It 'should be checked rather than assumed'.",
        ),
        ynng(
          "The writer regards a cleared island as a restoration of its original state.",
          "NO",
          "The island that emerges is not the island that was there before the rats; it is a new arrangement that happens to include the birds.",
          "It is 'a new arrangement'.",
        ),
        ynng(
          "The writer thinks the main obstacle on large inhabited islands is a technical one.",
          "NO",
          "The very large ones, and the inhabited ones, remain out of reach, because covering a whole island with poison requires the agreement of everybody living on it and that is a different sort of problem entirely.",
          "The obstacle is consent, 'a different sort of problem'.",
        ),
        fromList(
          "matching_sentence_endings",
          RAT_ENDINGS,
          "The operation has to remove every animal,",
          "because a single surviving pregnant female undoes the whole operation.",
          "An eradication that kills every rat but one pregnant female has also achieved nothing.",
          "One pregnant survivor is enough to fail.",
        ),
        fromList(
          "matching_sentence_endings",
          RAT_ENDINGS,
          "Bait is taken reliably only by a hungry animal,",
          "which is why the work is done in the season when food is scarcest.",
          "The bait contains an anticoagulant, and the operation is timed for the season when natural food is scarcest, so that every rat on the island is hungry enough to take it.",
          "The season is chosen so that every rat is hungry.",
        ),
        fromList(
          "matching_sentence_endings",
          RAT_ENDINGS,
          "Scavengers may be poisoned as well,",
          "although the birds themselves were never the target of the poison.",
          "Land crabs eat it without harm but carry it; gulls and birds of prey that scavenge poisoned carcasses can die; on some islands native species have had to be caught and held in captivity for the duration of the operation and released afterwards.",
          "Non-target birds die from scavenging.",
        ),
        fromList(
          "matching_sentence_endings",
          RAT_ENDINGS,
          "Numbers sometimes take decades to climb back,",
          "because a bird that has never nested there has no reason to try.",
          "Seabird numbers on cleared islands rise, sometimes dramatically and sometimes only after decades, because a species that has not bred on an island within living memory has no reason to prospect there.",
          "A species with no memory of the island does not prospect there.",
        ),
        fromList(
          "matching_sentence_endings",
          RAT_ENDINGS,
          "Cats were once taken off an island on their own,",
          "even though nobody had asked whether the rats were the only problem.",
          "Removing rats from an island that also has cats can make matters worse for a while, because the cats, deprived of rats, turn to the birds.",
          "The other introduced animals were not considered together.",
        ),
      ],
    },
  ],
};
