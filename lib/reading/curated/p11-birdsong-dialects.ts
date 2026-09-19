import { fromList, gapFill, mcq, tfng, type CuratedPassage } from "./shared";

const SONG_ENDINGS = [
  "because a male that sings the local version is more likely to be answered.",
  "although the birds involved are members of the same species.",
  "which is why a bird raised in isolation never produces a normal song.",
  "even though the two populations are separated by only a few kilometres.",
  "because the young bird must hear an adult during a limited period.",
  "despite having been recorded in the same valley thirty years earlier.",
  "which suggests the change spreads in the way a fashion does.",
];

export const BIRDSONG_DIALECTS: CuratedPassage = {
  key: "birdsong-dialects",
  title: "The Accent of a Sparrow",
  topic: "why the same species sings differently in neighbouring valleys",
  difficulty: 6,
  body: `Most birds make sounds without being taught. A chicken hatched in an incubator, never having heard another chicken, produces the full range of calls its species uses, and the same is true of gulls, ducks and pigeons. Calls of this kind are innate, in the same way that a dog's bark is innate, and they are not the subject of this article.

A minority of birds do something else. In three groups — the songbirds, the parrots and the hummingbirds — the young bird must hear an adult of its species singing and must then practise, comparing what it produces against what it remembers, before it can sing correctly. These three groups are not each other's closest relatives, which means vocal learning evolved independently at least three times in birds, as it did, separately again, in humans and in a handful of marine mammals and bats.

The consequence of learning is variation. A trait that is copied rather than inherited accumulates small changes, and those changes are passed on to whoever copies next. The result is dialect: populations of the same species, sometimes separated by only a few kilometres of unsuitable habitat, singing recognisably different versions of the same song. A trained ear can place a white-crowned sparrow from one side of a Californian bay on one side rather than the other, and recordings from the same location decades apart show the local song drifting steadily in the meantime.

The learning has a schedule. In most studied species there is a sensitive period early in life, often within the first months, during which song is memorised; a bird that hears nothing appropriate in that window will never sing normally, and one that hears the wrong species may learn it. Experiments with birds raised in isolation produce a characteristically abnormal song — the rough structure of the species is there, because some of the template is innate, but the detail is wrong, and other birds treat such singers as strangers.

What dialects are for has been argued about since they were first described. One long-standing suggestion is that they allow a female to identify a male who was raised locally, and therefore one whose genes are suited to local conditions. Experiments testing this have produced mixed results: in several species females do respond more strongly to the local dialect, in others they do not, and in a few the preference runs the other way, possibly because a foreign singer offers unrelated genes.

An alternative explanation makes dialects a by-product rather than a function. Copying is imperfect; imperfect copying over generations produces divergence between isolated groups; the birds are not signalling anything by their accent, and the pattern requires no more explanation than the fact that nobody is checking. On this account dialects are to birdsong what regional accents are to human speech — real, informative to a listener, and not designed for anything.

The clearest evidence for something more than drift comes from how new songs spread. Recordings across Canada over two decades documented a novel ending to the white-throated sparrow's song appearing in the west and moving east across the continent, replacing the traditional version in population after population until it was essentially universal. That is not gradual divergence. Something about the new version made birds adopt it in preference to the one they had grown up among, and it travelled at a speed that matches the movement of birds between wintering grounds.

There is one more result that bears on the question and is easy to state. Where two dialects meet, at the boundary between populations, males are frequently bilingual: they sing both versions, and they use the one that matches whichever neighbour they are addressing. That is difficult to reconcile with dialect as a passive by-product of copying error, and much easier to understand as a signal a bird can choose to send. It is also, incidentally, exactly what human speakers do at the boundary between two ways of speaking.

Dialects also raise a practical question for conservation. Where a population has become small and fragmented, the song repertoire shrinks with it, and translocated birds may sing a version the residents do not respond to. Several reintroduction programmes have used recordings of the historical local song to teach released birds, on the reasoning that an animal nobody answers is an animal that does not breed.`,
  questions: [
    tfng(
      "All birds must hear an adult before they can produce their species' sounds.",
      "FALSE",
      "A chicken hatched in an incubator, never having heard another chicken, produces the full range of calls its species uses, and the same is true of gulls, ducks and pigeons.",
      "A chicken raised in isolation calls normally.",
    ),
    tfng(
      "Vocal learning evolved several times independently among birds.",
      "TRUE",
      "These three groups are not each other's closest relatives, which means vocal learning evolved independently at least three times in birds, as it did, separately again, in humans and in a handful of marine mammals and bats.",
      "It evolved 'independently at least three times'.",
    ),
    tfng(
      "Local songs stay the same over long periods.",
      "FALSE",
      "A trained ear can place a white-crowned sparrow from one side of a Californian bay on one side rather than the other, and recordings from the same location decades apart show the local song drifting steadily in the meantime.",
      "The song 'drifting steadily' over decades.",
    ),
    tfng(
      "A bird raised in isolation produces no song at all.",
      "FALSE",
      "Experiments with birds raised in isolation produce a characteristically abnormal song — the rough structure of the species is there, because some of the template is innate, but the detail is wrong, and other birds treat such singers as strangers.",
      "It produces an abnormal song, not silence.",
    ),
    tfng(
      "Females in every species tested prefer the local dialect.",
      "FALSE",
      "Experiments testing this have produced mixed results: in several species females do respond more strongly to the local dialect, in others they do not, and in a few the preference runs the other way, possibly because a foreign singer offers unrelated genes.",
      "The results are mixed.",
    ),
    tfng(
      "The new sparrow ending spread from east to west across Canada.",
      "FALSE",
      "Recordings across Canada over two decades documented a novel ending to the white-throated sparrow's song appearing in the west and moving east across the continent, replacing the traditional version in population after population until it was essentially universal.",
      "It moved west to east.",
    ),
    tfng(
      "Recordings have been used to teach songs to birds being released.",
      "TRUE",
      "Several reintroduction programmes have used recordings of the historical local song to teach released birds, on the reasoning that an animal nobody answers is an animal that does not breed.",
      "Programmes 'have used recordings … to teach released birds'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Birds that learn their songs belong to the songbirds, the ______ and the hummingbirds.",
      "parrots",
      "In three groups — the songbirds, the parrots and the hummingbirds — the young bird must hear an adult of its species singing and must then practise, comparing what it produces against what it remembers, before it can sing correctly.",
      "The three groups include the parrots.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Song must be memorised during an early ______ period.",
      "sensitive",
      "In most studied species there is a sensitive period early in life, often within the first months, during which song is memorised; a bird that hears nothing appropriate in that window will never sing normally, and one that hears the wrong species may learn it.",
      "There is 'a sensitive period early in life'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Birds that sing abnormally are treated by others as ______.",
      "strangers",
      "Experiments with birds raised in isolation produce a characteristically abnormal song — the rough structure of the species is there, because some of the template is innate, but the detail is wrong, and other birds treat such singers as strangers.",
      "Others 'treat such singers as strangers'.",
    ),
    mcq(
      "What does the passage say produces dialects on the by-product account?",
      [
        "Imperfect copying over many generations",
        "Deliberate signalling of local origin",
        "Differences in habitat between valleys",
        "Selection by females for local males",
      ],
      "Imperfect copying over many generations",
      "Copying is imperfect; imperfect copying over generations produces divergence between isolated groups; the birds are not signalling anything by their accent, and the pattern requires no more explanation than the fact that nobody is checking.",
      "Imperfect copying alone explains divergence.",
    ),
    fromList(
      "matching_sentence_endings",
      SONG_ENDINGS,
      "Two neighbouring populations may sing quite differently",
      "even though the two populations are separated by only a few kilometres.",
      "The result is dialect: populations of the same species, sometimes separated by only a few kilometres of unsuitable habitat, singing recognisably different versions of the same song.",
      "A few kilometres can separate two dialects.",
    ),
    fromList(
      "matching_sentence_endings",
      SONG_ENDINGS,
      "Timing matters as much as exposure,",
      "because the young bird must hear an adult during a limited period.",
      "In most studied species there is a sensitive period early in life, often within the first months, during which song is memorised; a bird that hears nothing appropriate in that window will never sing normally, and one that hears the wrong species may learn it.",
      "The window is limited and early.",
    ),
    fromList(
      "matching_sentence_endings",
      SONG_ENDINGS,
      "The Canadian song swept across the continent,",
      "which suggests the change spreads in the way a fashion does.",
      "Something about the new version made birds adopt it in preference to the one they had grown up among, and it travelled at a speed that matches the movement of birds between wintering grounds.",
      "Birds preferred the novel version to their own.",
    ),
  ],
};
