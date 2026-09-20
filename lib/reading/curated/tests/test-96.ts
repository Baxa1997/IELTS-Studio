import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · palaeoecology · notes box ----------------------------------

const POLLEN_NOTES = {
  title: "Reading one core",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · submerged archaeology · people and a word bank ------------

const DOGGER_PEOPLE = ["Ruth Ellingham", "Pieter van Loon", "Ayaan Farah", "Gerd Lindemann"];
const DOGGER_BANK = [
  "trawlers",
  "seismic",
  "peat",
  "channels",
  "sediment",
  "tsunami",
  "coring",
  "harpoon",
  "meltwater",
];

// ---- Passage 3 · preservation chemistry · lettered paragraphs --------------

const BOG_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const BOG_ENDINGS = [
  "because the acid that preserves the skin dissolves the bone inside it.",
  "which is why almost every body was found by someone digging for fuel.",
  "since the moss releases a compound that binds to protein and halts decay.",
  "although the same conditions destroy the evidence an archaeologist wants most.",
  "because a body placed in water in winter cools before bacteria can multiply.",
  "even though the date of the death may be two thousand years before the discovery.",
  "which makes the manner of death easier to establish than the reason for it.",
];

export const TEST_96: CuratedTest = {
  key: "full-test-96",
  targetBand: 8,
  passages: [
    {
      key: "t96-p1-pollen-analysis",
      title: "Counting Pollen in the Mud",
      topic: "reconstructing vanished landscapes from grains a hundredth of a millimetre across",
      difficulty: 7,
      body: `A flowering plant releases pollen in quantities that are difficult to comprehend. A single pine tree may produce many billions of grains in a season, most of which land on ground, water or ice and are never involved in reproduction at all. The grain's outer wall is made of sporopollenin, one of the most chemically resistant organic materials known: it resists acid, alkali, heat and bacterial attack, and in an oxygen-free environment it survives essentially unchanged for hundreds of thousands of years. A grain that falls into a lake or a bog is therefore not merely preserved but preserved with its surface sculpture intact, and that sculpture is distinctive enough to identify the plant, usually to genus and sometimes to species.

The consequence is a record. Sediment accumulates in a lake year by year, and each layer contains a sample of whatever was flowering in the surrounding landscape at the time. Extract a vertical core, count the grains at successive depths, and the result is a sequence of vegetation assemblages running back as far as the sediment does. The technique was established in the early twentieth century by the Swedish geologist Lennart von Post, and it remains the principal means by which we know what the vegetation of the northern hemisphere did after the last glaciation.

The procedure is laborious and mostly unchanged. A core is extracted, described and sampled at intervals. Each sample is treated with a sequence of reagents — acid to remove carbonates, alkali to remove humic material, hydrofluoric acid to remove silica — chosen because sporopollenin survives all of them and almost nothing else does. What remains is mounted on a slide, and an analyst counts several hundred grains under a microscope, assigning each to a taxon. The count is the data. There is no instrument that does this, and attempts to automate it with image recognition have made progress without yet displacing the human counter.

The interpretation is where the difficulties lie, and practitioners are careful about them. Plants do not produce pollen in proportion to their abundance: pine and birch release enormous quantities carried far on the wind, while lime and many insect-pollinated species release little and drop it close to home. A raw count therefore over-represents the wind-pollinated and under-represents everything else, and a correction factor has to be applied for each taxon, derived from modern studies. Grass pollen cannot be distinguished between wild species and cereals with any reliability, which matters enormously when the question is when farming arrived. And a lake receives pollen from a catchment whose size depends on the lake's own size, so a large lake gives a regional picture and a small hollow a local one.

Given those cautions, what the method has established is substantial. The sequence of northern European vegetation since the ice — tundra, then birch and pine, then hazel, oak and lime, then a decline in lime coinciding with the spread of agriculture — is known in detail and dated by radiocarbon. Human land use is visible as a signature rather than an inference: a fall in tree pollen, a rise in grasses and in the weeds of disturbed ground, charcoal in the same layer, and then in many places a recovery of woodland as a settlement is abandoned. The record of the medieval agricultural expansion and of the retreat following the fourteenth-century plague is legible in pollen diagrams from several countries.

The method has also supplied one of the clearest independent checks on climate reconstruction. Because the climatic tolerances of modern plants are known, an assemblage can be converted into an estimate of summer temperature and precipitation, and those estimates can be compared with the isotope records from ice cores and the widths of tree rings. Where the three agree, which is often, the confidence in all of them rises; where they disagree, the disagreement is itself informative, and several of the more interesting problems in the field concern exactly those mismatches.

It remains a technique whose output depends on a person looking down a microscope and making several hundred judgements per sample, and on a chain of assumptions each of which has been argued about for a century. That is not a weakness peculiar to it. It is what a proxy record is, and the pollen record is unusual mainly in how thoroughly its own limitations have been catalogued by the people who use it.`,
      questions: [
        tfng(
          "Most pollen grains a tree produces play no part in reproduction.",
          "TRUE",
          "A single pine tree may produce many billions of grains in a season, most of which land on ground, water or ice and are never involved in reproduction at all.",
          "Most are never involved in reproduction.",
        ),
        tfng(
          "Sporopollenin is destroyed by strong acid.",
          "FALSE",
          "The grain's outer wall is made of sporopollenin, one of the most chemically resistant organic materials known: it resists acid, alkali, heat and bacterial attack, and in an oxygen-free environment it survives essentially unchanged for hundreds of thousands of years.",
          "It resists acid.",
        ),
        tfng(
          "The reagents used are chosen to destroy everything except pollen.",
          "TRUE",
          "Each sample is treated with a sequence of reagents — acid to remove carbonates, alkali to remove humic material, hydrofluoric acid to remove silica — chosen because sporopollenin survives all of them and almost nothing else does.",
          "Almost nothing else survives them.",
        ),
        tfng(
          "Automated counting has replaced the human analyst.",
          "FALSE",
          "There is no instrument that does this, and attempts to automate it with image recognition have made progress without yet displacing the human counter.",
          "It has not displaced the human counter.",
        ),
        tfng(
          "Cereal pollen can be reliably told apart from wild grasses.",
          "FALSE",
          "Grass pollen cannot be distinguished between wild species and cereals with any reliability, which matters enormously when the question is when farming arrived.",
          "It cannot be distinguished reliably.",
        ),
        tfng(
          "The size of the lake affects how wide an area the record represents.",
          "TRUE",
          "And a lake receives pollen from a catchment whose size depends on the lake's own size, so a large lake gives a regional picture and a small hollow a local one.",
          "Lake size sets the catchment.",
        ),
        tfng(
          "Von Post's first cores were taken from Danish bogs.",
          "NOT GIVEN",
          "",
          "The passage credits von Post but says nothing about where he worked.",
        ),
        noteLine(
          POLLEN_NOTES,
          "Field",
          "A vertical ______ is extracted from lake sediment",
          "core",
          "Extract a vertical core, count the grains at successive depths, and the result is a sequence of vegetation assemblages running back as far as the sediment does.",
          "A core is extracted.",
        ),
        noteLine(
          POLLEN_NOTES,
          "Laboratory",
          "Reagents remove carbonates, humic material and ______",
          "silica",
          "Each sample is treated with a sequence of reagents — acid to remove carbonates, alkali to remove humic material, hydrofluoric acid to remove silica — chosen because sporopollenin survives all of them and almost nothing else does.",
          "Hydrofluoric acid removes silica.",
        ),
        noteLine(
          POLLEN_NOTES,
          "Microscope",
          "Several hundred grains are assigned to a ______",
          "taxon",
          "What remains is mounted on a slide, and an analyst counts several hundred grains under a microscope, assigning each to a taxon.",
          "Each grain is assigned to a taxon.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The grain's surface ______ identifies the plant that produced it.",
          "sculpture",
          "A grain that falls into a lake or a bog is therefore not merely preserved but preserved with its surface sculpture intact, and that sculpture is distinctive enough to identify the plant, usually to genus and sometimes to species.",
          "The sculpture identifies the plant.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Human clearance appears as falling tree pollen and ______ in the same layer.",
          "charcoal",
          "Human land use is visible as a signature rather than an inference: a fall in tree pollen, a rise in grasses and in the weeds of disturbed ground, charcoal in the same layer, and then in many places a recovery of woodland as a settlement is abandoned.",
          "Charcoal appears in the same layer.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "An assemblage can be converted into an estimate of summer ______.",
          "temperature",
          "Because the climatic tolerances of modern plants are known, an assemblage can be converted into an estimate of summer temperature and precipitation, and those estimates can be compared with the isotope records from ice cores and the widths of tree rings.",
          "Summer temperature can be estimated.",
        ),
      ],
    },
    {
      key: "t96-p2-doggerland",
      title: "The Land Beneath the North Sea",
      topic: "an inhabited country that is now a fishing ground",
      difficulty: 8,
      body: `At the end of the last glaciation, sea level stood roughly a hundred and twenty metres lower than it does today, because the water was locked up in ice sheets. The southern North Sea was not sea. It was a plain of rivers, lakes, marsh and woodland connecting Britain to the European mainland, and it was inhabited. Archaeologists call it Doggerland, after the sandbank that is the shallowest surviving part of it. At its greatest extent it was larger than several modern European countries, and it was not a land bridge in the sense the phrase implies: it was somewhere to live rather than somewhere to cross.

The evidence arrived, for a long time, entirely by accident. Ruth Ellingham, who has catalogued the material, notes that the first securely identified artefact was a barbed antler point dredged up by a trawler in 1931, and that for the following sixty years the record consisted almost wholly of objects brought to the surface in nets: animal bone, worked flint, fragments of peat. She stresses the consequence for interpretation — the finds have no context, no stratigraphy and in most cases no reliable position, because a skipper reports where the net came up rather than where it was on the bottom.

What transformed the subject was data collected for another purpose entirely. Pieter van Loon, a geophysicist, explains that the oil and gas industry has surveyed the North Sea floor with seismic reflection for half a century, producing three-dimensional images of the sediment beneath it in order to find structures that might hold hydrocarbons. The same images show river channels, lake basins, estuaries and coastlines, buried under later marine sediment and invisible from the surface. Mapping them has produced something close to a topographic map of a drowned country, assembled from surveys nobody commissioned for archaeology.

The inhabitants have been harder to reach than the landscape. Ayaan Farah, who works on submerged prehistoric sites, points out that a seismic survey resolves features tens of metres across and a campsite is a few metres across, so the geophysics can identify where people would have lived — a confluence, a lake margin, a coastal inlet — and cannot find a site. The method is therefore to predict, then core: take a sediment sample at a chosen point and look for the traces, which are usually not artefacts but pollen, insect remains, and the chemical signatures of occupation. Several such campaigns have recovered organic material and a small number of stone tools from sealed contexts, which is an enormous advance on the trawler record and remains a handful of points in an area the size of a country.

The end of Doggerland was gradual and then abrupt. Rising sea level flooded it over several thousand years, turning a plain into a wetland, then into islands, then into shallow sea. The rate was fast enough to be noticed within a lifetime in places, which means the people living there were not losing an abstraction but watching a coastline move inland. Gerd Lindemann, a specialist in the sedimentary record, describes the final event: around eight thousand years ago a vast submarine landslide off the Norwegian coast, known as the Storegga Slide, generated a tsunami whose deposits are found in Scotland, Norway and the Shetlands, and which would have swept across whatever remained of the low-lying plain. He is careful to say that the tsunami did not destroy Doggerland, which was already mostly submerged, and that its significance is as a dated horizon appearing in cores across a wide area, which is exactly what a submerged landscape most needs.

The general interest of the case is not that a lost land existed. It is that the entire inhabited coastal zone of the last glacial period is now under water, everywhere in the world, because people have always lived on coasts and the coasts have moved. The archaeology of the period is therefore systematically biased towards inland sites, not because inland occupation was more important but because it is the part that is still dry. How large the distortion is nobody knows, and the honest position is that it may be very large. Doggerland is not an exceptional case. It is the one piece of the missing evidence that happens to lie under a sea with an oil industry in it, and therefore the one piece for which somebody else has already paid for the survey.`,
      questions: [
        fromList(
          "matching_features",
          DOGGER_PEOPLE,
          "The early finds cannot be placed accurately on the sea floor.",
          "Ruth Ellingham",
          "She stresses the consequence for interpretation — the finds have no context, no stratigraphy and in most cases no reliable position, because a skipper reports where the net came up rather than where it was on the bottom.",
          "Ellingham explains the missing positions.",
        ),
        fromList(
          "matching_features",
          DOGGER_PEOPLE,
          "Surveys made for industry have mapped a vanished landscape.",
          "Pieter van Loon",
          "Pieter van Loon, a geophysicist, explains that the oil and gas industry has surveyed the North Sea floor with seismic reflection for half a century, producing three-dimensional images of the sediment beneath it in order to find structures that might hold hydrocarbons.",
          "Van Loon describes the industry surveys.",
        ),
        fromList(
          "matching_features",
          DOGGER_PEOPLE,
          "The resolution of the survey is far coarser than a settlement.",
          "Ayaan Farah",
          "Ayaan Farah, who works on submerged prehistoric sites, points out that a seismic survey resolves features tens of metres across and a campsite is a few metres across, so the geophysics can identify where people would have lived — a confluence, a lake margin, a coastal inlet — and cannot find a site.",
          "Farah contrasts the two scales.",
        ),
        fromList(
          "matching_features",
          DOGGER_PEOPLE,
          "A catastrophic event is chiefly valuable as a dating marker.",
          "Gerd Lindemann",
          "He is careful to say that the tsunami did not destroy Doggerland, which was already mostly submerged, and that its significance is as a dated horizon appearing in cores across a wide area, which is exactly what a submerged landscape most needs.",
          "Lindemann values it as a horizon.",
        ),
        fromList(
          "summary_completion",
          DOGGER_BANK,
          "The first finds were brought up in the nets of ______.",
          "trawlers",
          "Ruth Ellingham, who has catalogued the material, notes that the first securely identified artefact was a barbed antler point dredged up by a trawler in 1931, and that for the following sixty years the record consisted almost wholly of objects brought to the surface in nets: animal bone, worked flint, fragments of peat.",
          "Trawler nets produced them.",
        ),
        fromList(
          "summary_completion",
          DOGGER_BANK,
          "The landscape was mapped from ______ images of the sediment below.",
          "seismic",
          "The same images show river channels, lake basins, estuaries and coastlines, buried under later marine sediment and invisible from the surface.",
          "Seismic reflection produced the images.",
        ),
        fromList(
          "summary_completion",
          DOGGER_BANK,
          "Buried river ______ are visible in those images.",
          "channels",
          "Mapping them has produced something close to a topographic map of a drowned country, assembled from surveys nobody commissioned for archaeology.",
          "River channels show in the data.",
        ),
        fromList(
          "summary_completion",
          DOGGER_BANK,
          "Finding a settlement requires predicting a location and then ______.",
          "coring",
          "The method is therefore to predict, then core: take a sediment sample at a chosen point and look for the traces, which are usually not artefacts but pollen, insect remains, and the chemical signatures of occupation.",
          "The method is to predict then core.",
        ),
        fromList(
          "summary_completion",
          DOGGER_BANK,
          "A submarine landslide produced a ______ whose deposits are widely found.",
          "tsunami",
          "Gerd Lindemann, a specialist in the sedimentary record, describes the final event: around eight thousand years ago a vast submarine landslide off the Norwegian coast, known as the Storegga Slide, generated a tsunami whose deposits are found in Scotland, Norway and the Shetlands, and which would have swept across whatever remained of the low-lying plain.",
          "The slide generated a tsunami.",
        ),
        mcq(
          "Why was the southern North Sea dry land at the end of the glaciation?",
          [
            "Much of the world's water was held in ice sheets",
            "The sea floor had been raised by tectonic movement",
            "Rivers had filled the basin with sediment",
            "The Channel had not yet opened",
          ],
          "Much of the world's water was held in ice sheets",
          "At the end of the last glaciation, sea level stood roughly a hundred and twenty metres lower than it does today, because the water was locked up in ice sheets.",
          "The water was locked in ice.",
        ),
        mcq(
          "What do the sealed-context samples usually contain?",
          [
            "Pollen, insect remains and chemical signatures",
            "Stone tools in large numbers",
            "Human burials",
            "Structural timber",
          ],
          "Pollen, insect remains and chemical signatures",
          "Several such campaigns have recovered organic material and a small number of stone tools from sealed contexts, which is an enormous advance on the trawler record and remains a handful of points in an area the size of a country.",
          "Mostly organic traces, not artefacts.",
        ),
        mcq(
          "What does the writer say the tsunami did not do?",
          [
            "Destroy a land that was already mostly under water",
            "Leave deposits outside Norway",
            "Occur eight thousand years ago",
            "Affect the Shetlands",
          ],
          "Destroy a land that was already mostly under water",
          "He is careful to say that the tsunami did not destroy Doggerland, which was already mostly submerged, and that its significance is as a dated horizon appearing in cores across a wide area, which is exactly what a submerged landscape most needs.",
          "It did not destroy an already-submerged land.",
        ),
        mcq(
          "What is the writer's central point about the period's archaeology?",
          [
            "The coastal evidence is missing everywhere, not only here",
            "Inland sites were more important than coastal ones",
            "The record is complete enough for confident conclusions",
            "Only the North Sea has lost its coastal sites",
          ],
          "The coastal evidence is missing everywhere, not only here",
          "It is that the entire inhabited coastal zone of the last glacial period is now under water, everywhere in the world, because people have always lived on coasts and the coasts have moved.",
          "The whole coastal zone is submerged.",
        ),
      ],
    },
    {
      key: "t96-p3-bog-bodies",
      title: "The Bodies Kept by the Bog",
      topic: "a chemistry that preserves a face and destroys a skeleton",
      difficulty: 9,
      body: `A) Several hundred human bodies have been recovered from the peat bogs of northern Europe, some of them so well preserved that the stubble on a chin, the lines of a palm and the contents of a stomach are all visible two thousand years after death. The condition is not partial. Faces are recognisable as individuals. This combination — extraordinary preservation of soft tissue over immense spans of time — occurs almost nowhere else, and it is produced by a specific and unusual set of chemical circumstances.

B) A raised bog is an environment of a kind that is hostile to almost all life. It is fed only by rainwater, so it contains very few dissolved minerals; the dominant plant, sphagnum moss, actively acidifies its surroundings; and the water below the surface is stagnant and contains no oxygen. Bacteria that decompose flesh require oxygen or nutrients or a tolerable pH, and in a raised bog none of these is available. Decomposition therefore stops rather than slows, which is the first condition.

C) The second is chemical. Sphagnum releases a polysaccharide that binds to proteins and to the calcium that bacteria need, and it produces a compound that reacts with skin collagen in a process closely analogous to the tanning of leather. A body in a bog is not merely undecayed; it is actively tanned, which is why the skin is brown and leathery and has the toughness of hide. The same chemistry darkens hair to red regardless of its original colour, a detail that misled early observers into supposing an entire population of redheads.

D) What the process destroys is the skeleton. Bone is mostly calcium phosphate, which dissolves in acid, and in a sufficiently acidic bog the bones disappear entirely while the skin survives. The result can be a complete, flexible human envelope with almost nothing rigid inside it, which collapses under its own weight when lifted. This is exactly the reverse of every other archaeological context, where bone survives and tissue does not, and it inverts what can be learned: age at death, stature and disease are usually read from the skeleton, and in a bog body they are often unavailable.

E) The bodies also arrive with an interpretive problem attached. A high proportion of them show signs of violence — a cut throat, a broken skull, a cord still around the neck, and in several cases more injuries than would be needed to cause death. Many were placed in the bog deliberately, held down with stakes or hurdles. The standard interpretation is ritual killing, supported by contemporary written references to sacrifice in northern Europe and by the recurring placement of bodies at boundaries between territories. It is a plausible reading and it rests on a sample that is not random: a body thrown into a bog is preserved and a body buried or cremated is not, so a practice that involved bogs is over-represented by the whole of its own visibility.

F) Almost every body was found by accident, and the accident was fuel. Peat was cut by hand for burning for centuries, and a cutter's spade is how the great majority of these discoveries were made, which means the find was usually damaged before anyone realised what it was, and the surrounding deposit — the part that would date and contextualise it — was destroyed in the cutting. Mechanised peat extraction destroys more thoroughly and notices less. The bodies recovered since the 1950s, excavated deliberately by archaeologists once a discovery was reported, are a small minority of the total and account for most of what is reliably known.

G) The conservation problem is severe and has no good solution. A body that has been stable for two thousand years in cold, acidic, oxygen-free water begins to decay within hours of being exposed to air, and the tanned tissue shrinks and cracks as it dries. Several of the most famous finds were treated by methods now regarded as damaging, and some were lost altogether in the nineteenth century, having been left to dry in a museum. The current approach uses freeze-drying and impregnation with polyethylene glycol, which works and permanently alters the material. There is an unavoidable exchange here that applies to any waterlogged organic find: the thing can be left where it is and remain intact and unstudied, or it can be lifted and studied and thereby changed. It cannot be both.`,
      questions: [
        fromList(
          "matching_information",
          BOG_PARAGRAPHS,
          "a sampling bias created by the method of disposal",
          "E",
          "It is a plausible reading and it rests on a sample that is not random: a body thrown into a bog is preserved and a body buried or cremated is not, so a practice that involved bogs is over-represented by the whole of its own visibility.",
          "Paragraph E sets out the bias.",
        ),
        fromList(
          "matching_information",
          BOG_PARAGRAPHS,
          "the reason an intact body may have no rigid structure",
          "D",
          "Bone is mostly calcium phosphate, which dissolves in acid, and in a sufficiently acidic bog the bones disappear entirely while the skin survives.",
          "Paragraph D explains the dissolved bone.",
        ),
        fromList(
          "matching_information",
          BOG_PARAGRAPHS,
          "a detail that led early observers to a false conclusion",
          "C",
          "The same chemistry darkens hair to red regardless of its original colour, a detail that misled early observers into supposing an entire population of redheads.",
          "Paragraph C gives the hair colour error.",
        ),
        fromList(
          "matching_information",
          BOG_PARAGRAPHS,
          "why the context of most discoveries was lost",
          "F",
          "Peat was cut by hand for burning for centuries, and a cutter's spade is how the great majority of these discoveries were made, which means the find was usually damaged before anyone realised what it was, and the surrounding deposit — the part that would date and contextualise it — was destroyed in the cutting.",
          "Paragraph F explains the lost context.",
        ),
        fromList(
          "matching_information",
          BOG_PARAGRAPHS,
          "three separate conditions that stop bacteria working",
          "B",
          "It is fed only by rainwater, so it contains very few dissolved minerals; the dominant plant, sphagnum moss, actively acidifies its surroundings; and the water below the surface is stagnant and contains no oxygen.",
          "Paragraph B lists the three conditions.",
        ),
        ynng(
          "The writer thinks the ritual killing interpretation is unreasonable.",
          "NO",
          "It is a plausible reading and it rests on a sample that is not random: a body thrown into a bog is preserved and a body buried or cremated is not, so a practice that involved bogs is over-represented by the whole of its own visibility.",
          "It is called 'a plausible reading'.",
        ),
        ynng(
          "The writer regards the bog as inverting what an archaeologist can normally learn.",
          "YES",
          "This is exactly the reverse of every other archaeological context, where bone survives and tissue does not, and it inverts what can be learned: age at death, stature and disease are usually read from the skeleton, and in a bog body they are often unavailable.",
          "It 'inverts what can be learned'.",
        ),
        ynng(
          "The writer believes modern conservation methods leave the body unaltered.",
          "NO",
          "The current approach uses freeze-drying and impregnation with polyethylene glycol, which works and permanently alters the material.",
          "It 'permanently alters the material'.",
        ),
        ynng(
          "The writer accepts that studying such a find necessarily changes it.",
          "YES",
          "There is an unavoidable exchange here that applies to any waterlogged organic find: the thing can be left where it is and remain intact and unstudied, or it can be lifted and studied and thereby changed.",
          "The exchange is 'unavoidable'.",
        ),
        fromList(
          "matching_sentence_endings",
          BOG_ENDINGS,
          "The skin becomes brown and tough,",
          "since the moss releases a compound that binds to protein and halts decay.",
          "Sphagnum releases a polysaccharide that binds to proteins and to the calcium that bacteria need, and it produces a compound that reacts with skin collagen in a process closely analogous to the tanning of leather.",
          "The moss both binds protein and tans skin.",
        ),
        fromList(
          "matching_sentence_endings",
          BOG_ENDINGS,
          "A recovered body may collapse when it is lifted,",
          "because the acid that preserves the skin dissolves the bone inside it.",
          "The result can be a complete, flexible human envelope with almost nothing rigid inside it, which collapses under its own weight when lifted.",
          "Nothing rigid remains inside.",
        ),
        fromList(
          "matching_sentence_endings",
          BOG_ENDINGS,
          "The injuries are easier to read than the motive,",
          "which makes the manner of death easier to establish than the reason for it.",
          "A high proportion of them show signs of violence — a cut throat, a broken skull, a cord still around the neck, and in several cases more injuries than would be needed to cause death.",
          "The wounds are visible; the purpose is inferred.",
        ),
        fromList(
          "matching_sentence_endings",
          BOG_ENDINGS,
          "The discoveries were not made by archaeologists,",
          "which is why almost every body was found by someone digging for fuel.",
          "Almost every body was found by accident, and the accident was fuel.",
          "Peat cutters made the finds.",
        ),
        fromList(
          "matching_sentence_endings",
          BOG_ENDINGS,
          "A body begins to deteriorate as soon as it is raised,",
          "although the same conditions destroy the evidence an archaeologist wants most.",
          "A body that has been stable for two thousand years in cold, acidic, oxygen-free water begins to decay within hours of being exposed to air, and the tanned tissue shrinks and cracks as it dries.",
          "Stability ends on contact with air.",
        ),
      ],
    },
  ],
};
