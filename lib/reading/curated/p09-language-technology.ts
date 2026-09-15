import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

function gap(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("summary_completion", prompt, answer, supporting_sentence, explanation),
    word_limit: "ONE WORD ONLY",
  };
}

const ENDINGS = [
  "should decide how their language data is used.",
  "people use it in everyday life.",
  "replaces the need for teachers entirely.",
  "makes learning easier and more appealing.",
  "is recorded by professional linguists.",
];

function ending(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("matching_sentence_endings", prompt, answer, supporting_sentence, explanation),
    options: ENDINGS,
  };
}

export const LANGUAGE_TECHNOLOGY: CuratedPassage = {
  key: "ai-endangered-languages",
  title: "Machines That Help Languages Survive",
  topic: "using AI and speech technology to revive endangered languages",
  difficulty: 6,
  body: `Of the roughly 7,000 languages spoken in the world today, linguists estimate that around 40 per cent are endangered, meaning that fewer and fewer children are learning them. Many have only a handful of elderly speakers. When the last of these speakers dies, a language disappears, and with it goes a unique way of describing the world: words for local plants and animals, systems for counting and naming family relationships, and stories passed down over many generations. A language that has never been written down can vanish almost without trace.

The causes of language loss are usually social rather than linguistic. Families move to cities in search of work, schools teach in a national language, and parents who were once punished for speaking their own language may decide not to pass it on to their children. Over time, the dominant language becomes associated with success, while the minority language comes to be seen as old-fashioned. Television, and later the internet, accelerated this process, because almost all of their content was produced in a small number of global languages. Once a generation of children grows up without the language, the decline becomes very hard to reverse, because there are no longer young parents to pass it on.

It may therefore seem surprising that digital technology is now being used to help endangered languages survive. For years, the obstacle was data. The speech recognition and translation systems used by millions of people every day learn from enormous quantities of recorded speech and written text, and most endangered languages have very little of either. Some have no standard writing system at all. Commercial companies, meanwhile, had little financial reason to build tools for languages with only a few thousand speakers. As a result, the voice assistants and automatic translators that work well in English or Spanish have been of no use to speakers of most small languages.

Recent advances have changed the picture in two ways. First, new AI models can learn from far smaller amounts of data than older systems, especially when they have already been trained on many other languages. Second, communities themselves have begun collecting recordings. In New Zealand, a broadcaster serving Māori communities organised a competition in 2018 in which speakers recorded themselves reading sentences aloud. Within ten days, more than 300 hours of speech had been collected, enough to begin building a speech recognition tool for the Māori language. Researchers in several other countries have since taken similar approaches, often training their systems first on widely spoken languages before adapting them to a smaller one.

Importantly, the organisers insisted that the recordings remain under the control of the community rather than being handed to large technology companies. This principle, often called data sovereignty, has become central to many language projects. Communities argue that their language is part of their cultural heritage and that they, not outside businesses, should decide how it is used and who profits from it. Some groups have refused offers to buy their data for this reason, even when the money would have been useful.

The tools being developed are varied. Apps allow learners to hear words pronounced by native speakers and to practise short conversations. Some projects also film elders telling traditional stories, so that learners can see gestures and facial expressions as well as hear the words. Automatic transcription can turn hours of old recordings, made by linguists decades ago and stored in archives, into searchable text, a task that would take a human expert months. For languages without a written tradition, some projects are helping communities to develop keyboards and spelling conventions so that the language can be used in text messages and on social media, where young people spend much of their time. Others are experimenting with chatbots that can hold simple conversations, giving learners the chance to practise at any time of day.

Linguists caution, however, that technology cannot save a language on its own. A language survives only if people use it in daily life, above all in the home, and no app can replace a grandparent speaking to a grandchild. The most successful revival efforts, such as immersion schools in which children are taught entirely in an endangered language, rely on human commitment far more than on software. Technology is best seen as a tool that can make learning easier and more attractive, especially for young people who might otherwise regard their heritage language as irrelevant to modern life. Used in that way, the same technology that once helped to push small languages aside may now help to bring some of them back.`,
  questions: [
    plain(
      "true_false_not_given",
      "About four in ten of the world's languages are endangered.",
      "TRUE",
      "Of the roughly 7,000 languages spoken in the world today, linguists estimate that around 40 per cent are endangered, meaning that fewer and fewer children are learning them.",
      "'Around 40 per cent' is the same as 'about four in ten'.",
    ),
    plain(
      "true_false_not_given",
      "Languages usually die out because of features of the languages themselves.",
      "FALSE",
      "The causes of language loss are usually social rather than linguistic.",
      "The causes are 'social rather than linguistic', which contradicts the statement.",
    ),
    plain(
      "true_false_not_given",
      "Technology companies had strong financial reasons to build tools for small languages.",
      "FALSE",
      "Commercial companies, meanwhile, had little financial reason to build tools for languages with only a few thousand speakers.",
      "Companies had 'little financial reason', the opposite of 'strong' reasons.",
    ),
    plain(
      "true_false_not_given",
      "Newer AI models need less data to learn a language than older systems did.",
      "TRUE",
      "First, new AI models can learn from far smaller amounts of data than older systems, especially when they have already been trained on many other languages.",
      "They 'can learn from far smaller amounts of data than older systems'.",
    ),
    plain(
      "true_false_not_given",
      "People who took part in the 2018 recording competition in New Zealand were paid for their recordings.",
      "NOT GIVEN",
      "",
      "The competition and the hours of speech collected are described, but nothing is said about payment or prizes.",
    ),
    plain(
      "true_false_not_given",
      "Immersion schools depend more on software than on people's commitment.",
      "FALSE",
      "The most successful revival efforts, such as immersion schools in which children are taught entirely in an endangered language, rely on human commitment far more than on software.",
      "They 'rely on human commitment far more than on software' — the statement reverses this.",
    ),
    gap(
      "Communities see their language as part of their cultural ______.",
      "heritage",
      "Communities argue that their language is part of their cultural heritage and that they, not outside businesses, should decide how it is used and who profits from it.",
      "Their language is 'part of their cultural heritage'.",
    ),
    gap(
      "Old recordings kept in ______ can be turned into searchable text automatically.",
      "archives",
      "Automatic transcription can turn hours of old recordings, made by linguists decades ago and stored in archives, into searchable text, a task that would take a human expert months.",
      "The recordings were 'stored in archives'.",
    ),
    gap(
      "For unwritten languages, some projects help communities create ______ and spelling rules.",
      "keyboards",
      "For languages without a written tradition, some projects are helping communities to develop keyboards and spelling conventions so that the language can be used in text messages and on social media, where young people spend much of their time.",
      "Projects develop 'keyboards and spelling conventions'; 'spelling rules' paraphrases the second item, so the gap is 'keyboards'.",
    ),
    gap(
      "Other projects are testing ______ that let learners practise conversation at any time.",
      "chatbots",
      "Others are experimenting with chatbots that can hold simple conversations, giving learners the chance to practise at any time of day.",
      "'Experimenting with chatbots' is paraphrased as 'testing'.",
    ),
    ending(
      "According to the principle of data sovereignty, communities",
      "should decide how their language data is used.",
      "Communities argue that their language is part of their cultural heritage and that they, not outside businesses, should decide how it is used and who profits from it.",
      "Communities, 'not outside businesses, should decide how it is used'.",
    ),
    ending(
      "A language will only survive if",
      "people use it in everyday life.",
      "A language survives only if people use it in daily life, above all in the home, and no app can replace a grandparent speaking to a grandchild.",
      "'Daily life' matches 'everyday life'. C is a trap: the passage says the opposite about technology replacing people.",
    ),
    ending(
      "Technology is most valuable when it",
      "makes learning easier and more appealing.",
      "Technology is best seen as a tool that can make learning easier and more attractive, especially for young people who might otherwise regard their heritage language as irrelevant to modern life.",
      "'More attractive' is paraphrased as 'more appealing'.",
    ),
  ],
};
