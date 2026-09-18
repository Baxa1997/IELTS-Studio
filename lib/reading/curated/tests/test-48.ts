import {
  fromList,
  gapFill,
  mcq,
  noteLine,
  pickTwo,
  plain,
  tfng,
  ynng,
  type CuratedQuestion,
  type CuratedTest,
} from "../shared";

// ---- Passage 1 · engineering history · notes --------------------------------

const CANAL = {
  title: "Stages in the history of the Grand Canal",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · 2026 trend · headings, choose TWO --------------------------

const HEADINGS = [
  "The chemistry of a dissolving gas",
  "Why shells become harder to build",
  "A hatchery that saw it first",
  "Where the sea is already acidic",
  "Results that did not survive checking",
  "Local measures and their limits",
  "Only one thing fixes it",
  "How coral reefs feed themselves",
  "Measuring the temperature of the ocean",
  "Fish that swim faster in warm water",
];

function heading(paragraph: string, answer: string, support: string, why: string): CuratedQuestion {
  return {
    ...plain("matching_headings", `Paragraph ${paragraph}`, answer, support, why),
    options: HEADINGS,
  };
}

const ACID_STEM = "Which TWO local responses to acidification are described?";
const ACID_RESPONSES = [
  "treating the water taken into shellfish hatcheries",
  "adding lime to the open ocean on a large scale",
  "protecting seagrass and kelp beds near shellfish beds",
  "moving all oyster farming into closed tanks on land",
  "banning fishing in areas where the water is most acidic",
];

// ---- Passage 3 · research debate · word bank --------------------------------

const ZOO_BANK = [
  "breeding",
  "oryx",
  "surveys",
  "fraction",
  "licence",
  "field",
  "welfare",
  "visitors",
];

export const TEST_48: CuratedTest = {
  key: "full-test-48",
  targetBand: 8,
  passages: [
    {
      key: "t48-p1-grand-canal",
      title: "The Longest Ditch",
      topic: "the building and purpose of China's Grand Canal",
      difficulty: 7,
      body: `The Grand Canal runs for some eighteen hundred kilometres between Hangzhou in the south and Beijing in the north, which makes it by a wide margin the longest artificial waterway ever built. It is also among the oldest still in use: barges carry sand, coal and building materials along its southern reaches today, and parts of the route have been in continuous operation for fourteen centuries. It was not built for trade, and it was not built in one piece.

Its purpose was tax. For most of imperial history the wealth of China lay in the rice-growing provinces of the south, and the political centre lay in the north, where the capital sat close to the frontier and the armies that defended it. Grain collected as tax had to move from one to the other. Moving it by sea meant losses to storms and piracy; moving it overland meant carts, roads and an enormous number of animals eating the cargo as they walked. A waterway could carry a barge-load for a fraction of the cost, and the state's ability to feed its capital and its soldiers depended on it.

The earliest sections were dug in the fifth century BCE, to link rivers in the central plains for military transport. What turned a set of local canals into a system was the Sui dynasty, which between 605 and 609 CE put an estimated several million labourers to work widening old channels and cutting new ones, under conscription that fell hardest on families already close to subsistence. The human cost was severe enough to feature in the traditional explanation for the dynasty's rapid collapse, although later historians have pointed out that the same works underwrote the prosperity of the dynasties that followed.

The engineering problem was water. A canal crossing a watershed must be fed at its summit and must let boats climb and descend, and for centuries this was managed with flash locks: a single gate that was opened to release a rush of water, on which boats were swept downstream or hauled up by winch. It was wasteful and dangerous, and heavily laden boats were regularly wrecked. In 984 a transport official named Qiao Weiyue built a pair of gates with a chamber between them, allowing the water level inside to be raised and lowered while boats waited safely — the pound lock, which appeared in Europe some four hundred years later.

The canal was rebuilt again under the Yuan dynasty in the thirteenth century, when the capital moved to the site of modern Beijing and a more direct northern route was cut, removing a long detour to the west. Maintaining it was a permanent struggle: the Yellow River, which the canal had to cross, carries an extraordinary load of silt, changes its bed catastrophically every few centuries and deposited enough material to block the channel repeatedly. Dredging, embankments and feeder reservoirs occupied a bureaucracy of thousands.

The canal shaped the country around it as much as it served it. Towns grew at the points where cargo had to be transferred, officials and inspectors formed a bureaucracy of their own, and the granaries at the northern end became a measure of the state's health: when the grain fleets were late, prices in the capital rose and governments grew nervous. A waterway built to move rice ended by moving people, ideas, styles of cooking and, on several occasions, armies.

Decline came in the nineteenth century. The Yellow River shifted its course northwards in 1855, cutting the canal and leaving long sections dry. Rebellion, then coastal steamships, then railways removed the reasons to repair it, and the grain tax itself was abolished. The northern half silted up and in places disappeared under fields.

The southern half never stopped working. Between the Yangtze and Hangzhou it remains one of the busiest inland waterways in the world, carrying hundreds of millions of tonnes a year in barge trains that are cheaper per tonne than any lorry. Since the 2010s, part of the eastern route has been enlarged again for a different purpose: pumping water northwards from the Yangtze to the dry plains around Beijing, reversing the direction in which the canal has moved value for most of its existence. It was listed as a World Heritage Site in 2014, on the grounds that it is not a monument but a functioning piece of infrastructure that happens to be very old.`,
      questions: [
        noteLine(
          CANAL,
          "Purpose",
          "Built to move grain collected as ______ from south to north",
          "tax",
          "Its purpose was tax.",
          "'Its purpose was tax.'",
        ),
        noteLine(
          CANAL,
          "Purpose",
          "Carrying grain by ______ risked storms and piracy",
          "sea",
          "Moving it by sea meant losses to storms and piracy; moving it overland meant carts, roads and an enormous number of animals eating the cargo as they walked.",
          "By sea there were 'losses to storms and piracy'.",
        ),
        noteLine(
          CANAL,
          "Building",
          "The first sections were dug in the ______ century BCE",
          "fifth",
          "The earliest sections were dug in the fifth century BCE, to link rivers in the central plains for military transport.",
          "They were dug 'in the fifth century BCE'.",
        ),
        noteLine(
          CANAL,
          "Building",
          "The Sui dynasty used millions of labourers under ______",
          "conscription",
          "What turned a set of local canals into a system was the Sui dynasty, which between 605 and 609 CE put an estimated several million labourers to work widening old channels and cutting new ones, under conscription that fell hardest on families already close to subsistence.",
          "The work was done 'under conscription'.",
        ),
        noteLine(
          CANAL,
          "Engineering",
          "Early ______ locks released a rush of water to carry boats through",
          "flash",
          "A canal crossing a watershed must be fed at its summit and must let boats climb and descend, and for centuries this was managed with flash locks: a single gate that was opened to release a rush of water, on which boats were swept downstream or hauled up by winch.",
          "They were 'flash locks'.",
        ),
        noteLine(
          CANAL,
          "Engineering",
          "In 984 a pair of gates with a ______ between them was built",
          "chamber",
          "In 984 a transport official named Qiao Weiyue built a pair of gates with a chamber between them, allowing the water level inside to be raised and lowered while boats waited safely — the pound lock, which appeared in Europe some four hundred years later.",
          "'A pair of gates with a chamber between them'.",
        ),
        noteLine(
          CANAL,
          "Later history",
          "The ______ River blocked the channel with silt and changed course",
          "Yellow",
          "Maintaining it was a permanent struggle: the Yellow River, which the canal had to cross, carries an extraordinary load of silt, changes its bed catastrophically every few centuries and deposited enough material to block the channel repeatedly.",
          "The Yellow River silted the channel.",
        ),
        noteLine(
          CANAL,
          "Later history",
          "Part of the eastern route now pumps ______ towards Beijing",
          "water",
          "Since the 2010s, part of the eastern route has been enlarged again for a different purpose: pumping water northwards from the Yangtze to the dry plains around Beijing, reversing the direction in which the canal has moved value for most of its existence.",
          "It is 'pumping water northwards'.",
        ),
        tfng(
          "The Grand Canal was originally built to carry merchants' goods.",
          "FALSE",
          "It was not built for trade, and it was not built in one piece.",
          "'It was not built for trade'.",
        ),
        tfng(
          "Historians now agree that the Sui canal works were entirely harmful.",
          "FALSE",
          "The human cost was severe enough to feature in the traditional explanation for the dynasty's rapid collapse, although later historians have pointed out that the same works underwrote the prosperity of the dynasties that followed.",
          "Later historians credit the works with underwriting later prosperity.",
        ),
        tfng(
          "The pound lock was in use in China long before it appeared in Europe.",
          "TRUE",
          "In 984 a transport official named Qiao Weiyue built a pair of gates with a chamber between them, allowing the water level inside to be raised and lowered while boats waited safely — the pound lock, which appeared in Europe some four hundred years later.",
          "Europe had it 'some four hundred years later'.",
        ),
        tfng(
          "The whole canal fell out of use in the nineteenth century.",
          "FALSE",
          "The southern half never stopped working.",
          "'The southern half never stopped working.'",
        ),
        tfng(
          "More cargo moves on the canal today than during the imperial period.",
          "NOT GIVEN",
          "",
          "Modern tonnage is given, but no comparison with the past is made.",
        ),
      ],
    },
    {
      key: "t48-p2-ocean-acidification",
      title: "The Other Carbon Problem",
      topic: "how absorbed carbon dioxide is changing sea water",
      difficulty: 8,
      body: `A) Roughly a quarter of the carbon dioxide released by burning fossil fuels has not stayed in the atmosphere. It has dissolved into the sea, where it reacts with water to form a weak acid, releasing hydrogen ions. The average acidity of surface sea water has risen by about thirty per cent since the industrial revolution — a change of some 0.1 on the pH scale, which sounds negligible and is not, because the scale is logarithmic. This is a straightforward piece of chemistry, measurable in any laboratory, and it is the part of the problem about which there is no scientific argument at all. A network of moored instruments and drifting floats now measures the carbon chemistry of the surface ocean continuously, and the longest records, maintained since the 1980s, show carbon dioxide rising in the air and in the water together, with pH falling in step.

B) The consequence that matters most is indirect. The additional hydrogen ions react with carbonate ions in the water, converting them into bicarbonate and reducing the supply available to animals that build shells and skeletons from calcium carbonate. Corals, oysters, mussels, sea urchins, certain plankton and the small swimming snails that feed much of the polar food web all depend on that supply. As it falls, building a shell costs more energy, and in water that is sufficiently undersaturated, existing shells begin to dissolve.

C) The first economic damage arrived before most people had heard of the problem. In the late 2000s, oyster hatcheries on the north-west coast of the United States began losing entire batches of larvae. The cause turned out to be the water they were pumping in: seasonal winds bring deep water to the surface along that coast, and deep water is naturally richer in dissolved carbon dioxide, so the seasonal upwelling now arrived already acidified beyond what the larvae could tolerate. The industry survived by monitoring the intake water continuously and treating it when conditions were poor.

D) That coast illustrates a general point. The change is not uniform: upwelling regions, coastal waters receiving run-off, and the cold polar seas, where carbon dioxide dissolves more readily, are all further along than the global average. Some of these places are also the most productive fisheries in the world. Conversely, tropical open ocean is changing more slowly. Long-term stations in the North Atlantic and near Hawaii have tracked the chemistry continuously for four decades, and the regional differences they reveal matter more for fisheries than the global average figure that is usually quoted.

E) The research has not been free of embarrassment. A prominent series of studies reported that raised carbon dioxide caused dramatic behavioural changes in coral reef fish — that they lost their avoidance of predator odour, became disoriented and swam towards danger. The findings were widely publicised. A large replication effort published in 2020, using bigger samples and automated tracking, found effects close to zero, and subsequent scrutiny of the original data raised serious questions. The underlying chemistry was never in doubt; what collapsed was one striking biological claim built on top of it, and the episode is now cited as often for what it says about publication incentives as for anything about fish.

F) Local action is possible and limited. Hatcheries can buffer their intake water, and some now do so routinely. Beds of seagrass and kelp take up carbon dioxide as they photosynthesise and can raise the pH of the water around them during the day, which has led to trials in which shellfish beds are placed near restored vegetation; the effect is real, local and reverses at night. Reducing other pressures — nutrient run-off, sewage, overfishing — leaves populations better able to withstand a chemical change they cannot avoid.

G) None of that addresses the cause. Unlike most marine problems, acidification cannot be managed by protecting an area, because the water moves and the gas is everywhere. It ends when emissions end, and the surface ocean will then take decades to equilibrate while the deep ocean takes centuries. Proposals to add alkaline minerals to sea water at scale exist and are being studied, but the quantities required are industrial in the extreme and the side effects are poorly understood. For the foreseeable future, the only instrument that works on the chemistry itself is the one that also works on the climate.`,
      questions: [
        heading(
          "A",
          "The chemistry of a dissolving gas",
          "It has dissolved into the sea, where it reacts with water to form a weak acid, releasing hydrogen ions.",
          "Paragraph A: the basic chemistry.",
        ),
        heading(
          "B",
          "Why shells become harder to build",
          "The additional hydrogen ions react with carbonate ions in the water, converting them into bicarbonate and reducing the supply available to animals that build shells and skeletons from calcium carbonate.",
          "Paragraph B: the carbonate supply falls.",
        ),
        heading(
          "C",
          "A hatchery that saw it first",
          "In the late 2000s, oyster hatcheries on the north-west coast of the United States began losing entire batches of larvae.",
          "Paragraph C: the oyster hatcheries.",
        ),
        heading(
          "D",
          "Where the sea is already acidic",
          "The change is not uniform: upwelling regions, coastal waters receiving run-off, and the cold polar seas, where carbon dioxide dissolves more readily, are all further along than the global average.",
          "Paragraph D: the regions furthest along.",
        ),
        heading(
          "E",
          "Results that did not survive checking",
          "A large replication effort published in 2020, using bigger samples and automated tracking, found effects close to zero, and subsequent scrutiny of the original data raised serious questions.",
          "Paragraph E: the failed replication.",
        ),
        heading(
          "F",
          "Local measures and their limits",
          "Beds of seagrass and kelp take up carbon dioxide as they photosynthesise and can raise the pH of the water around them during the day, which has led to trials in which shellfish beds are placed near restored vegetation; the effect is real, local and reverses at night.",
          "Paragraph F: local measures that help only locally.",
        ),
        heading(
          "G",
          "Only one thing fixes it",
          "It ends when emissions end, and the surface ocean will then take decades to equilibrate while the deep ocean takes centuries.",
          "Paragraph G: only ending emissions works.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Dissolved carbon dioxide forms a weak acid, releasing ______ ions.",
          "hydrogen",
          "It has dissolved into the sea, where it reacts with water to form a weak acid, releasing hydrogen ions.",
          "It releases 'hydrogen ions'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Shell-building animals depend on the supply of ______ ions.",
          "carbonate",
          "The additional hydrogen ions react with carbonate ions in the water, converting them into bicarbonate and reducing the supply available to animals that build shells and skeletons from calcium carbonate.",
          "The supply of 'carbonate ions' is reduced.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "Along the north-west American coast, seasonal ______ brings acidified deep water up.",
          "upwelling",
          "The cause turned out to be the water they were pumping in: seasonal winds bring deep water to the surface along that coast, and deep water is naturally richer in dissolved carbon dioxide, so the seasonal upwelling now arrived already acidified beyond what the larvae could tolerate.",
          "'The seasonal upwelling now arrived already acidified'.",
        ),
        gapFill(
          "summary_completion",
          "NO MORE THAN TWO WORDS",
          "The pH increase produced by seagrass reverses at ______.",
          "night",
          "Beds of seagrass and kelp take up carbon dioxide as they photosynthesise and can raise the pH of the water around them during the day, which has led to trials in which shellfish beds are placed near restored vegetation; the effect is real, local and reverses at night.",
          "The effect 'reverses at night'.",
        ),
        pickTwo(
          ACID_STEM,
          ACID_RESPONSES,
          "A or C",
          "The industry survived by monitoring the intake water continuously and treating it when conditions were poor.",
          "A is described: hatcheries treat their intake water.",
        ),
        pickTwo(
          ACID_STEM,
          ACID_RESPONSES,
          "A or C",
          "Beds of seagrass and kelp take up carbon dioxide as they photosynthesise and can raise the pH of the water around them during the day, which has led to trials in which shellfish beds are placed near restored vegetation; the effect is real, local and reverses at night.",
          "C is described: shellfish beds placed near restored vegetation. B, D and E are not.",
        ),
      ],
    },
    {
      key: "t48-p3-zoos",
      title: "The Case for the Cage",
      topic: "whether modern zoos earn their place through conservation",
      difficulty: 9,
      body: `The defence a modern zoo offers for its existence rests on four claims: that it breeds endangered animals and returns them to the wild, that it funds conservation in the places those animals come from, that it conducts research that could not be done in the field, and that it turns visitors into people who care about wildlife. Each claim is true of some zoos some of the time. What the evidence will not support is the implication that these things describe the sector as a whole.

The breeding argument has the strongest individual examples and the weakest general case. A short list of species — a wild horse extinct in its native range, a large American vulture reduced to twenty-two individuals, a desert antelope shot out of existence in the wild, a small Brazilian monkey — were rescued by captive breeding and returned to habitats from which they had disappeared, and several of those populations are now self-sustaining. Nobody disputes that this is an achievement. But fewer than one in ten of the species held in the world's licensed zoos is classified as threatened, and reintroduction programmes involve a smaller number still. The great majority of animals in zoos are there because visitors will pay to see them.

The funding argument is stronger than critics usually allow and weaker than zoos imply. Collectively, the world's zoos and aquariums contribute several hundred million dollars a year to field conservation, which places them among the larger private funders of the work. Set against their total income, however, the proportion is small — the median institution spends a low single-digit percentage of its budget on projects outside its own walls, and a few large institutions account for most of the total. A visitor who assumes that the price of a ticket is substantially supporting work in the field is, for most zoos, mistaken.

Research is a similar case. Zoos have produced work on reproduction, nutrition, disease and behaviour that has direct application in the field, and the reproductive techniques that made several rescues possible were developed on captive animals. Much of what is published, though, concerns the management of captive animals themselves, which is useful chiefly to other zoos.

The education claim is the one most often asserted and least well evidenced. Surveys conducted as visitors leave reliably show increased interest in conservation, and those surveys are exactly what one would expect from people who have just chosen to spend a day looking at animals and are being asked about it by staff. The better studies, which follow visitors afterwards and use comparison groups, find small effects on knowledge and smaller ones on behaviour. There is no good evidence that a zoo visit produces the change in conduct — in donations, consumption or voting — on which the claim depends.

Against these benefits stands the cost to the animals themselves. Welfare science has advanced considerably, and the best modern enclosures are unrecognisable compared with those of fifty years ago. But some species do badly in captivity almost regardless of effort: elephants in cool climates suffer foot and joint disease and have reproductive problems and shortened lives; large cetaceans have fared so poorly that keeping them is now illegal in several countries; and wide-ranging carnivores show the repetitive behaviours associated with chronic frustration. A number of institutions have ended their elephant programmes, which is an unusual admission for an industry to make.

There is also an argument that is rarely made openly, because it sounds unserious beside the others: that people enjoy zoos, that a child seeing a large animal for the first time is having a real experience, and that a society is entitled to spend money on things it enjoys. Stated plainly it is a weak justification for confining a wide-ranging carnivore, and a reasonable one for keeping a collection of reptiles. The reason it is rarely stated is that it would invite exactly that kind of species-by-species scrutiny.

The honest conclusion is that zoos are not one thing. A small number function as conservation organisations that happen to have a public gate; a larger number are entertainment businesses that fund some conservation; and the difference between them is not visible from the entrance. Sector-wide claims serve the second group by borrowing the achievements of the first. If the argument for keeping wild animals in enclosures rests on conservation, then the reasonable response is to require the evidence at the level of the institution — how many threatened species, how much money in the field, which reintroductions, what welfare outcomes — and to let the answers decide, rather than accepting the claim as a description of an entire industry.`,
      questions: [
        mcq(
          "How does the writer describe the four claims zoos make?",
          [
            "All four are false.",
            "Each is true of some zoos but not of the sector as a whole.",
            "They apply only to aquariums.",
            "They were true in the past but no longer are.",
          ],
          "Each is true of some zoos but not of the sector as a whole.",
          "Each claim is true of some zoos some of the time. What the evidence will not support is the implication that these things describe the sector as a whole.",
          "True of some zoos, not of the sector.",
        ),
        mcq(
          "What point does the writer make about breeding programmes?",
          [
            "They have never returned a species to the wild.",
            "They succeed with a few species while most zoo animals are not threatened.",
            "They are the most expensive activity a zoo undertakes.",
            "They work only for large mammals.",
          ],
          "They succeed with a few species while most zoo animals are not threatened.",
          "But fewer than one in ten of the species held in the world's licensed zoos is classified as threatened, and reintroduction programmes involve a smaller number still.",
          "Fewer than one in ten species held are threatened.",
        ),
        mcq(
          "What does the writer say about zoos' contribution to field conservation?",
          [
            "It is negligible in absolute terms.",
            "It is large in total but a small share of most zoos' budgets.",
            "It has fallen steadily for a decade.",
            "It comes mainly from government grants.",
          ],
          "It is large in total but a small share of most zoos' budgets.",
          "Set against their total income, however, the proportion is small — the median institution spends a low single-digit percentage of its budget on projects outside its own walls, and a few large institutions account for most of the total.",
          "Large in total; a low single-digit share for the median institution.",
        ),
        mcq(
          "Why is the writer sceptical about exit surveys?",
          [
            "They are conducted by independent researchers.",
            "They ask people who have just chosen to visit and are answering staff.",
            "They use samples that are too large.",
            "They measure behaviour rather than attitudes.",
          ],
          "They ask people who have just chosen to visit and are answering staff.",
          "Surveys conducted as visitors leave reliably show increased interest in conservation, and those surveys are exactly what one would expect from people who have just chosen to spend a day looking at animals and are being asked about it by staff.",
          "The respondents are self-selected and are answering staff.",
        ),
        mcq(
          "What does the writer propose at the end?",
          [
            "that all zoos should be closed",
            "that claims should be tested institution by institution",
            "that zoos should stop keeping elephants",
            "that governments should fund conservation instead",
          ],
          "that claims should be tested institution by institution",
          "If the argument for keeping wild animals in enclosures rests on conservation, then the reasonable response is to require the evidence at the level of the institution — how many threatened species, how much money in the field, which reintroductions, what welfare outcomes — and to let the answers decide, rather than accepting the claim as a description of an entire industry.",
          "Evidence should be required 'at the level of the institution'.",
        ),
        ynng(
          "The writer accepts that captive breeding has saved some species.",
          "YES",
          "Nobody disputes that this is an achievement.",
          "'Nobody disputes that this is an achievement.'",
        ),
        ynng(
          "The writer believes visitors generally understand where their ticket money goes.",
          "NO",
          "A visitor who assumes that the price of a ticket is substantially supporting work in the field is, for most zoos, mistaken.",
          "Such a visitor is 'mistaken'.",
        ),
        ynng(
          "The writer thinks welfare standards have improved over recent decades.",
          "YES",
          "Welfare science has advanced considerably, and the best modern enclosures are unrecognisable compared with those of fifty years ago.",
          "Welfare science 'has advanced considerably'.",
        ),
        ynng(
          "The writer considers that all species can be kept well given enough effort.",
          "NO",
          "But some species do badly in captivity almost regardless of effort: elephants in cool climates suffer foot and joint disease and have reproductive problems and shortened lives; large cetaceans have fared so poorly that keeping them is now illegal in several countries; and wide-ranging carnivores show the repetitive behaviours associated with chronic frustration.",
          "Some do badly 'almost regardless of effort'.",
        ),
        ynng(
          "The writer reports that visitor numbers at zoos are declining.",
          "NOT GIVEN",
          "",
          "Nothing is said about trends in attendance.",
        ),
        fromList(
          "summary_completion",
          ZOO_BANK,
          "Captive ______ rescued a wild horse, a vulture, an antelope and a monkey.",
          "breeding",
          "A short list of species — a wild horse extinct in its native range, a large American vulture reduced to twenty-two individuals, a desert antelope shot out of existence in the wild, a small Brazilian monkey — were rescued by captive breeding and returned to habitats from which they had disappeared, and several of those populations are now self-sustaining.",
          "They 'were rescued by captive breeding'.",
        ),
        fromList(
          "summary_completion",
          ZOO_BANK,
          "Only a small ______ of the species held are classified as threatened.",
          "fraction",
          "But fewer than one in ten of the species held in the world's licensed zoos is classified as threatened, and reintroduction programmes involve a smaller number still.",
          "Fewer than one in ten — a small fraction.",
        ),
        fromList(
          "summary_completion",
          ZOO_BANK,
          "Exit ______ show increased interest but are easy to explain away.",
          "surveys",
          "Surveys conducted as visitors leave reliably show increased interest in conservation, and those surveys are exactly what one would expect from people who have just chosen to spend a day looking at animals and are being asked about it by staff.",
          "The exit surveys are self-selected.",
        ),
        fromList(
          "summary_completion",
          ZOO_BANK,
          "Evidence should include how much money reaches the ______.",
          "field",
          "If the argument for keeping wild animals in enclosures rests on conservation, then the reasonable response is to require the evidence at the level of the institution — how many threatened species, how much money in the field, which reintroductions, what welfare outcomes — and to let the answers decide, rather than accepting the claim as a description of an entire industry.",
          "The list includes 'how much money in the field'.",
        ),
      ],
    },
  ],
};
