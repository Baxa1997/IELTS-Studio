import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · food microbiology · notes box -----------------------------

const YEAST_NOTES = {
  title: "What brewing selected for",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · marine restoration · people and a word bank ---------------

const REEF_PEOPLE = ["Teuila Faleolo", "Gerard Poole", "Mariana Okoye", "Sung-min Park"];
const REEF_BANK = [
  "fragments",
  "bleaching",
  "algae",
  "nursery",
  "larvae",
  "shade",
  "sound",
  "sediment",
  "genotypes",
];

// ---- Passage 3 · reading research · lettered paragraphs --------------------

const AUDIO_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const AUDIO_ENDINGS = [
  "because a listener cannot go back over a sentence without losing their place.",
  "although the difference disappears once the material is straightforward.",
  "which is why the comparison depends so heavily on what is being read.",
  "even though the words reaching the brain are identical in both cases.",
  "because the medium is chosen by people who were going to be busy anyway.",
  "which the writer thinks is the question worth asking instead.",
  "despite the strong opinions the subject continues to attract.",
];

export const TEST_64: CuratedTest = {
  key: "full-test-64",
  targetBand: 6,
  passages: [
    {
      key: "t64-p1-brewing-yeast",
      title: "The Organism Nobody Knew They Were Breeding",
      topic: "how centuries of brewing changed a microbe without anyone seeing it",
      difficulty: 5,
      body: `For most of the history of brewing, nobody knew what was doing the work. Beer was made by putting malted grain, water and hops together in a vessel that had been used for beer before, and something in the vessel, or in the air, or in the wooden paddle, turned the sugary liquid into alcohol. Brewers understood perfectly well that the process depended on adding a portion of the froth from a previous batch, and they guarded that froth carefully. They simply had no idea it was alive.

The organism responsible was identified in the middle of the nineteenth century, and its role was established definitively in the 1860s by work showing that boiled liquid, kept from contact with the air, did not ferment at all. Within a few decades brewers were growing single strains in pure culture, and one Danish brewery gave away its isolate freely, which is why a substantial share of the world's lager is made by descendants of a single cell selected in 1883.

What has become clear much more recently is how thoroughly the organism was changed by the centuries before anyone could see it. Genome studies of hundreds of industrial and wild strains show that brewing yeasts form distinct groups, separated from their wild relatives by exactly the kind of changes domestication produces in a plant or an animal.

The changes follow the selection pressures of a brewery. Domesticated strains tolerate far higher concentrations of alcohol than wild ones, because a strain that dies at five per cent is not carried forward into the next batch. They ferment maltose, the principal sugar released from malted barley, very efficiently, and many have extra copies of the genes for taking it up. They have lost the ability to produce a compound that tastes strongly of cloves and smoke, which is desirable in one or two traditional styles and unwanted in almost everything else; the loss is a broken gene, exactly the kind of degradation that happens when selection stops protecting a function and then actively removes it.

Most striking of all, many industrial strains have lost the capacity to reproduce sexually in any effective way. In the wild, yeast reproduces asexually when conditions are good and sexually when they are poor, which generates variation. In a brewery conditions are always good, sexual reproduction is never called for, and the machinery has decayed. Several major brewing strains are effectively sterile and have been propagated purely by division for centuries, which is to say that a brewery's yeast is less like a population and more like a very long-lived individual.

None of this was planned, and that is the point worth holding on to. No brewer set out to raise the alcohol tolerance of a microbe, and no brewer could have observed the result if they had. What they did was keep the froth that had worked and discard the froth that had not, several thousand times, and the organism was reshaped by that choice as thoroughly as a wheat plant was reshaped by keeping the seed from the best heads.

The most unusual chapter concerns lager. Lager yeast is not a strain of the ale species at all but a hybrid between it and a cold-tolerant wild species, and the hybridisation appears to have happened in Bavaria in the fifteenth or sixteenth century, at a time when brewing in summer was banned and fermentation therefore took place in cold cellars. The wild parent was unknown until 2011, when it was found in beech forests in Patagonia, and the question of how a South American yeast reached a Bavarian cellar has not been settled. The leading suggestion involves timber or cargo on returning ships, which would place the origin of the world's most-consumed beer style in an accident of early transatlantic trade.

There is a practical consequence for anyone brewing now. Because the strains are propagated clonally, they accumulate mutations, and a strain repitched too many times drifts away from its original behaviour — producing different flavours, flocculating differently, attenuating less. Commercial breweries therefore limit the number of generations they will reuse and return periodically to a frozen master stock. The froth that brewers guarded for centuries turns out to have been a living culture that ages, and the traditional practice of jealously maintaining it was closer to animal husbandry than anybody involved could have known.`,
      questions: [
        tfng(
          "Brewers knew that something living was causing fermentation.",
          "FALSE",
          "They simply had no idea it was alive.",
          "'They simply had no idea it was alive.'",
        ),
        tfng(
          "Much of the world's lager descends from one isolated cell.",
          "TRUE",
          "Within a few decades brewers were growing single strains in pure culture, and one Danish brewery gave away its isolate freely, which is why a substantial share of the world's lager is made by descendants of a single cell selected in 1883.",
          "It descends from 'a single cell selected in 1883'.",
        ),
        tfng(
          "Brewing strains are genetically indistinguishable from wild yeasts.",
          "FALSE",
          "Genome studies of hundreds of industrial and wild strains show that brewing yeasts form distinct groups, separated from their wild relatives by exactly the kind of changes domestication produces in a plant or an animal.",
          "They 'form distinct groups' from wild relatives.",
        ),
        tfng(
          "Wild yeasts survive higher alcohol concentrations than brewing strains.",
          "FALSE",
          "Domesticated strains tolerate far higher concentrations of alcohol than wild ones, because a strain that dies at five per cent is not carried forward into the next batch.",
          "Domesticated strains tolerate more, not less.",
        ),
        tfng(
          "A flavour compound was deliberately bred out of most brewing strains.",
          "FALSE",
          "None of this was planned, and that is the point worth holding on to.",
          "The passage insists that 'none of this was planned'.",
        ),
        tfng(
          "The wild parent of lager yeast was identified in Europe.",
          "FALSE",
          "The wild parent was unknown until 2011, when it was found in beech forests in Patagonia, and the question of how a South American yeast reached a Bavarian cellar has not been settled.",
          "It was found in Patagonia.",
        ),
        tfng(
          "Reusing a strain many times changes how the beer turns out.",
          "TRUE",
          "Because the strains are propagated clonally, they accumulate mutations, and a strain repitched too many times drifts away from its original behaviour — producing different flavours, flocculating differently, attenuating less.",
          "It 'drifts away from its original behaviour'.",
        ),
        noteLine(
          YEAST_NOTES,
          null,
          "A higher tolerance of ______ than wild strains possess",
          "alcohol",
          "Domesticated strains tolerate far higher concentrations of alcohol than wild ones, because a strain that dies at five per cent is not carried forward into the next batch.",
          "They tolerate higher concentrations of alcohol.",
        ),
        noteLine(
          YEAST_NOTES,
          null,
          "Efficient fermentation of ______, the main sugar in malted barley",
          "maltose",
          "They ferment maltose, the principal sugar released from malted barley, very efficiently, and many have extra copies of the genes for taking it up.",
          "They ferment maltose efficiently.",
          { before: [{ text: "Centuries of repitching selected for:", indent: 0 }] },
        ),
        noteLine(
          YEAST_NOTES,
          null,
          "Loss of the machinery for ______ reproduction",
          "sexual",
          "Most striking of all, many industrial strains have lost the capacity to reproduce sexually in any effective way.",
          "They lost effective sexual reproduction.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Brewers relied on adding a portion of the ______ from an earlier batch.",
          "froth",
          "Brewers understood perfectly well that the process depended on adding a portion of the froth from a previous batch, and they guarded that froth carefully.",
          "They added 'a portion of the froth'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Lager yeast is a ______ between two different species.",
          "hybrid",
          "Lager yeast is not a strain of the ale species at all but a hybrid between it and a cold-tolerant wild species, and the hybridisation appears to have happened in Bavaria in the fifteenth or sixteenth century, at a time when brewing in summer was banned and fermentation therefore took place in cold cellars.",
          "It is 'a hybrid between it and a cold-tolerant wild species'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Breweries periodically return to a ______ master stock.",
          "frozen",
          "Commercial breweries therefore limit the number of generations they will reuse and return periodically to a frozen master stock.",
          "They return to 'a frozen master stock'.",
        ),
      ],
    },
    {
      key: "t64-p2-coral-restoration",
      title: "Gardening a Reef",
      topic: "what replanting coral can and cannot achieve",
      difficulty: 6,
      body: `A coral is an animal that builds a limestone skeleton and lives in partnership with single-celled algae inside its tissues. The algae photosynthesise and pass most of what they produce to the coral; the coral provides shelter and raw materials. When the water is too warm for too long the partnership fails, the coral expels the algae, and what is left is white — the skeleton showing through transparent tissue. A bleached coral is not dead, and if conditions return to normal quickly enough it can take up algae again, but if they do not it starves.

Mass bleaching events were unknown before the 1980s and have since occurred repeatedly across every tropical reef region, with the intervals between them shortening. Reefs need roughly a decade to recover their structure after a severe event, and events now arrive more frequently than that in many places.

Restoration has grown from a handful of projects into an industry, and most of it works the same way. Teuila Faleolo, who runs a programme in the western Pacific, describes the standard method: fragments of healthy coral are collected, grown on frames or ropes in an underwater nursery until they reach a useful size, and then cemented onto degraded reef. Corals grow readily from fragments, which is how they propagate naturally after storms, so the technique is biologically straightforward. Survival after transplanting is typically between sixty and ninety per cent in the first years.

The arithmetic is where the difficulty begins. Gerard Poole, a reef ecologist who has been publicly sceptical, points out that the largest restoration projects operate at a scale of hectares while reef loss is measured in thousands of square kilometres, and that the cost per hectare of anything involving divers places a hard ceiling on how much can ever be done. His more serious objection concerns what restoration is for. Replanting a reef that will bleach again in four years produces a reef that bleaches in four years, and if the planting substitutes for reducing the warming that caused the loss, it is worse than useless because it supplies a reassuring photograph.

Practitioners mostly agree with the framing and disagree about the conclusion. Faleolo's position is that restoration buys time and keeps the reef's structure — which is what fish, and the people who fish them, actually depend on — while other things are attempted, and that a technique which is useless at global scale may be decisive for a particular village's fishery.

Two developments have made the field more interesting than simple replanting. Mariana Okoye works on selecting and breeding for heat tolerance: corals from naturally hot lagoons, or individuals that survived a bleaching event that killed their neighbours, carry tolerance that can be propagated, and crossing them produces offspring that withstand higher temperatures than either parent. The approach raises the obvious question of what else is lost when a reef is rebuilt from the few genotypes that happened to be tolerant, and Okoye is explicit that diversity has to be managed deliberately rather than assumed.

Sung-min Park works on recruitment rather than transplanting. Coral larvae, drifting in the plankton, choose where to settle, and they use chemical and acoustic cues to do it — a healthy reef is noisy with the sounds of fish and shrimp, and a degraded one is quiet. Park's group has shown that playing recorded reef sound through underwater speakers over a damaged area substantially increases the number of larvae that settle there. Whether the effect persists long enough to matter is not yet established, and Park is careful to describe the work as promising rather than proven.

A third strand, less discussed, concerns what is planted where. Reefs are not uniform, and a structure built from fast-growing branching corals looks impressive within two years and is flattened by the first cyclone; slower massive corals take a decade to establish and survive it. Programmes judged on photographs tend towards the first, and programmes judged on what the reef looks like in twenty years tend towards the second.

The honest summary is that restoration is a local intervention being asked to answer a global problem. It works, in the narrow sense that transplanted corals survive and grow. It cannot operate at the scale of the loss, its results are erased by the next severe event, and every practitioner interviewed on the subject says the same thing in almost the same words: the only intervention that determines whether reefs exist in fifty years is the temperature of the water.`,
      questions: [
        fromList(
          "matching_features",
          REEF_PEOPLE,
          "The standard technique relies on coral's ability to grow from pieces.",
          "Teuila Faleolo",
          "Teuila Faleolo, who runs a programme in the western Pacific, describes the standard method: fragments of healthy coral are collected, grown on frames or ropes in an underwater nursery until they reach a useful size, and then cemented onto degraded reef.",
          "Faleolo describes the fragment method.",
        ),
        fromList(
          "matching_features",
          REEF_PEOPLE,
          "Replanting may be harmful if it substitutes for addressing the cause.",
          "Gerard Poole",
          "Replanting a reef that will bleach again in four years produces a reef that bleaches in four years, and if the planting substitutes for reducing the warming that caused the loss, it is worse than useless because it supplies a reassuring photograph.",
          "Poole makes the substitution objection.",
        ),
        fromList(
          "matching_features",
          REEF_PEOPLE,
          "Rebuilding from tolerant individuals raises a question about diversity.",
          "Mariana Okoye",
          "The approach raises the obvious question of what else is lost when a reef is rebuilt from the few genotypes that happened to be tolerant, and Okoye is explicit that diversity has to be managed deliberately rather than assumed.",
          "Okoye raises the diversity question.",
        ),
        fromList(
          "matching_features",
          REEF_PEOPLE,
          "Young corals can be attracted to a site by what they hear.",
          "Sung-min Park",
          "Park's group has shown that playing recorded reef sound through underwater speakers over a damaged area substantially increases the number of larvae that settle there.",
          "Park uses recorded reef sound.",
        ),
        fromList(
          "summary_completion",
          REEF_BANK,
          "Heat stress causes ______, in which the coral expels its algae.",
          "bleaching",
          "When the water is too warm for too long the partnership fails, the coral expels the algae, and what is left is white — the skeleton showing through transparent tissue.",
          "That process is bleaching.",
        ),
        fromList(
          "summary_completion",
          REEF_BANK,
          "Restoration begins by collecting ______ of healthy coral.",
          "fragments",
          "Teuila Faleolo, who runs a programme in the western Pacific, describes the standard method: fragments of healthy coral are collected, grown on frames or ropes in an underwater nursery until they reach a useful size, and then cemented onto degraded reef.",
          "It begins with collected fragments.",
        ),
        fromList(
          "summary_completion",
          REEF_BANK,
          "These are grown in an underwater ______ before being attached to the reef.",
          "nursery",
          "Teuila Faleolo, who runs a programme in the western Pacific, describes the standard method: fragments of healthy coral are collected, grown on frames or ropes in an underwater nursery until they reach a useful size, and then cemented onto degraded reef.",
          "They are grown 'in an underwater nursery'.",
        ),
        fromList(
          "summary_completion",
          REEF_BANK,
          "Breeding work uses tolerant ______ taken from naturally hot water.",
          "genotypes",
          "The approach raises the obvious question of what else is lost when a reef is rebuilt from the few genotypes that happened to be tolerant, and Okoye is explicit that diversity has to be managed deliberately rather than assumed.",
          "It uses the tolerant genotypes.",
        ),
        fromList(
          "summary_completion",
          REEF_BANK,
          "Drifting ______ settle in greater numbers where reef noise is played.",
          "larvae",
          "Park's group has shown that playing recorded reef sound through underwater speakers over a damaged area substantially increases the number of larvae that settle there.",
          "More larvae settle where sound is played.",
        ),
        mcq(
          "What does a bleached coral indicate?",
          [
            "It has expelled its algae but is not yet dead",
            "It has died and lost its tissue",
            "It has been damaged by a storm",
            "It is growing faster than usual",
          ],
          "It has expelled its algae but is not yet dead",
          "A bleached coral is not dead, and if conditions return to normal quickly enough it can take up algae again, but if they do not it starves.",
          "It 'is not dead' but has lost its algae.",
        ),
        mcq(
          "What is the problem with the frequency of bleaching events?",
          [
            "They now come faster than reefs can recover",
            "They have become harder to predict",
            "They affect only the shallowest reefs",
            "They last longer than they used to",
          ],
          "They now come faster than reefs can recover",
          "Reefs need roughly a decade to recover their structure after a severe event, and events now arrive more frequently than that in many places.",
          "Recovery needs a decade; events come sooner.",
        ),
        mcq(
          "What limits how much restoration can be done?",
          [
            "The cost of any method that requires divers",
            "The supply of healthy coral fragments",
            "The survival rate of transplanted coral",
            "The availability of suitable reef sites",
          ],
          "The cost of any method that requires divers",
          "Gerard Poole, a reef ecologist who has been publicly sceptical, points out that the largest restoration projects operate at a scale of hectares while reef loss is measured in thousands of square kilometres, and that the cost per hectare of anything involving divers places a hard ceiling on how much can ever be done.",
          "Diver cost sets 'a hard ceiling'.",
        ),
        mcq(
          "What do practitioners agree determines the future of reefs?",
          [
            "The temperature of the water",
            "The scale of restoration funding",
            "The success of heat-tolerant breeding",
            "The protection of reefs from fishing",
          ],
          "The temperature of the water",
          "It cannot operate at the scale of the loss, its results are erased by the next severe event, and every practitioner interviewed on the subject says the same thing in almost the same words: the only intervention that determines whether reefs exist in fifty years is the temperature of the water.",
          "They all name the water temperature.",
        ),
      ],
    },
    {
      key: "t64-p3-listening-reading",
      title: "Does Listening Count as Reading?",
      topic: "whether a book absorbed through the ear is understood as well",
      difficulty: 7,
      body: `A) The question is asked defensively, usually by somebody who has listened to a book and wants to know whether they are allowed to say they read it. Underneath the anxiety is a real empirical question, and the research on it is more interesting than either the defenders or the sceptics tend to report.

B) Start with what is not in dispute. Speech is older than writing by a very long way, and the human capacity to understand spoken language develops without instruction. Reading is a cultural technology that must be taught, laboriously, and that repurposes brain regions evolved for other things — a fact that shows up whenever an adult learns to read late, and in the particular difficulties of dyslexia, which have no counterpart in listening. Once decoding is fluent, however, the two routes converge: the systems that build meaning out of words — vocabulary, grammar, inference, the construction of a mental model of what is being described — are the same whether the words arrived through the eye or the ear. This convergence is well established, and it is the reason the comparison is close at all.

C) The experiments that compare comprehension directly find, in most conditions, no meaningful difference. Adults given a narrative text to read or the same text to listen to answer comprehension questions about equally well, and studies that follow the same participants across both formats find high correlation. For straightforward material, the format appears not to matter, and this covers a very large share of what people actually read for pleasure.

D) The differences appear when the material gets harder. With dense expository text — an argument with several stages, a passage with unfamiliar technical vocabulary, anything requiring the reader to hold one claim in mind while evaluating another — reading tends to produce better comprehension, and the gap widens with difficulty. The explanation offered is about control rather than modality. A reader sets the pace, stops, goes back, rereads the previous sentence, and does so continuously and mostly unconsciously; eye-tracking shows that regressions of this kind are a normal part of reading and increase sharply with difficulty. A listener can pause and rewind, but the operation is clumsy enough that in practice it is done rarely, and the audio continues at the narrator's pace whether or not the sentence landed.

E) A second difference concerns attention. Listening is usually done while doing something else — driving, walking, cleaning — which is a large part of its appeal, and dividing attention reduces comprehension of anything demanding. The comparison in a laboratory, where participants sit still and listen, is therefore not the comparison that matters to most listeners, and the honest version of the question is not whether listening is as good as reading but whether listening while doing something else is as good as reading while doing nothing else. Framed that way the answer is obvious and much less interesting.

F) Narration adds something that has no counterpart on the page. A skilled reader of an audiobook disambiguates: intonation marks which clause is subordinate, irony is audible, and a character's voice is distinguished from the narrator's without any tag. For drama, for poetry, and for anything where the sound of the prose is part of the point, the audio version is arguably the fuller text rather than a reduced one. There is also evidence that difficult accents and unfamiliar names, which slow a reader down on the page, are easier absorbed when spoken — anybody who has struggled through a Russian novel in print and then heard the patronymics said aloud will recognise the effect.

G) The conclusion I would draw is that the interesting variable is not the medium but the match between the medium and the material. A novel followed in sequence, a memoir, a history told as narrative — these survive the ear intact and sometimes gain from it. A technical argument, a text the reader needs to annotate, anything that will be returned to rather than passed through — these lose something real. Anybody who has listened to a book and then bought the paper copy to find a passage again has already discovered the distinction, and it is a more useful one than the question of whether listening counts.`,
      questions: [
        fromList(
          "matching_information",
          AUDIO_PARAGRAPHS,
          "an explanation of why the two routes converge once reading is fluent",
          "B",
          "Once decoding is fluent, however, the two routes converge: the systems that build meaning out of words — vocabulary, grammar, inference, the construction of a mental model of what is being described — are the same whether the words arrived through the eye or the ear.",
          "Paragraph B explains the convergence.",
        ),
        fromList(
          "matching_information",
          AUDIO_PARAGRAPHS,
          "a reference to eye movements observed during reading",
          "D",
          "A reader sets the pace, stops, goes back, rereads the previous sentence, and does so continuously and mostly unconsciously; eye-tracking shows that regressions of this kind are a normal part of reading and increase sharply with difficulty.",
          "Paragraph D cites eye-tracking.",
        ),
        fromList(
          "matching_information",
          AUDIO_PARAGRAPHS,
          "a claim that one format can convey more than the printed page",
          "F",
          "For drama, for poetry, and for anything where the sound of the prose is part of the point, the audio version is arguably the fuller text rather than a reduced one.",
          "Paragraph F argues audio can be fuller.",
        ),
        fromList(
          "matching_information",
          AUDIO_PARAGRAPHS,
          "an argument that the laboratory comparison is the wrong one",
          "E",
          "The comparison in a laboratory, where participants sit still and listen, is therefore not the comparison that matters to most listeners, and the honest version of the question is not whether listening is as good as reading but whether listening while doing something else is as good as reading while doing nothing else.",
          "Paragraph E reframes the comparison.",
        ),
        fromList(
          "matching_information",
          AUDIO_PARAGRAPHS,
          "an observation about why the question tends to be asked at all",
          "A",
          "The question is asked defensively, usually by somebody who has listened to a book and wants to know whether they are allowed to say they read it.",
          "Paragraph A describes the defensive framing.",
        ),
        ynng(
          "The writer thinks reading and listening are equivalent for all material.",
          "NO",
          "With dense expository text — an argument with several stages, a passage with unfamiliar technical vocabulary, anything requiring the reader to hold one claim in mind while evaluating another — reading tends to produce better comprehension, and the gap widens with difficulty.",
          "Reading is better for dense material.",
        ),
        ynng(
          "The writer accepts that narration can add information the page lacks.",
          "YES",
          "A skilled reader of an audiobook disambiguates: intonation marks which clause is subordinate, irony is audible, and a character's voice is distinguished from the narrator's without any tag.",
          "Narration disambiguates in ways print cannot.",
        ),
        ynng(
          "The writer believes the usual form of the question is the useful one.",
          "NO",
          "Anybody who has listened to a book and then bought the paper copy to find a passage again has already discovered the distinction, and it is a more useful one than the question of whether listening counts.",
          "The match question is 'a more useful one'.",
        ),
        ynng(
          "The writer regards the ability to reread as the main advantage of print.",
          "YES",
          "The explanation offered is about control rather than modality.",
          "Control over pace and rereading is the explanation.",
        ),
        fromList(
          "matching_sentence_endings",
          AUDIO_ENDINGS,
          "Comprehension of difficult text is better on the page",
          "because a listener cannot go back over a sentence without losing their place.",
          "A listener can pause and rewind, but the operation is clumsy enough that in practice it is done rarely, and the audio continues at the narrator's pace whether or not the sentence landed.",
          "Rewinding is clumsy and rarely done.",
        ),
        fromList(
          "matching_sentence_endings",
          AUDIO_ENDINGS,
          "For simple narrative the formats perform alike,",
          "although the difference disappears once the material is straightforward.",
          "Adults given a narrative text to read or the same text to listen to answer comprehension questions about equally well, and studies that follow the same participants across both formats find high correlation.",
          "On straightforward material the two are equal.",
        ),
        fromList(
          "matching_sentence_endings",
          AUDIO_ENDINGS,
          "The meaning-making systems are shared,",
          "even though the words reaching the brain are identical in both cases.",
          "Once decoding is fluent, however, the two routes converge: the systems that build meaning out of words — vocabulary, grammar, inference, the construction of a mental model of what is being described — are the same whether the words arrived through the eye or the ear.",
          "The same systems handle both routes.",
        ),
        fromList(
          "matching_sentence_endings",
          AUDIO_ENDINGS,
          "Listening is typically combined with another activity,",
          "because the medium is chosen by people who were going to be busy anyway.",
          "Listening is usually done while doing something else — driving, walking, cleaning — which is a large part of its appeal, and dividing attention reduces comprehension of anything demanding.",
          "It is chosen precisely because it fits other activity.",
        ),
        fromList(
          "matching_sentence_endings",
          AUDIO_ENDINGS,
          "What matters is how the material and the medium suit each other,",
          "which the writer thinks is the question worth asking instead.",
          "The conclusion I would draw is that the interesting variable is not the medium but the match between the medium and the material.",
          "The match is 'the interesting variable'.",
        ),
      ],
    },
  ],
};
