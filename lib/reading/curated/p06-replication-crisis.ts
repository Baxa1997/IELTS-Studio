import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

function choice(
  prompt: string,
  options: string[],
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return { ...plain("multiple_choice", prompt, answer, supporting_sentence, explanation), options };
}

const ENDINGS = [
  "increases the likelihood of a false positive.",
  "is accepted for publication before its results are known.",
  "brought researchers very little prestige.",
  "may produce striking results purely by chance.",
  "always involves deliberate dishonesty.",
  "requires data to be collected from dozens of laboratories.",
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

export const REPLICATION_CRISIS: CuratedPassage = {
  key: "psychology-replication-crisis",
  title: "Psychology's Replication Reckoning",
  topic: "why so many famous experiments failed when they were repeated",
  difficulty: 8,
  body: `In 2015, a group of around 270 psychologists published the results of an unusual project. Rather than testing new ideas, they had spent several years repeating 100 experiments that had previously appeared in leading psychology journals, following the original methods as closely as possible. The outcome was sobering. While 97 of the original studies had reported statistically significant results, only around 36 of the repetitions did so, and the effects that did reappear were, on average, about half as large as first reported. The findings gave a name to a problem that many researchers had privately suspected: the replication crisis.

It would be easy to read these numbers as evidence that psychology is a pseudoscience, and some commentators did exactly that. This conclusion, in my view, is both unfair and unhelpful. A failure to replicate does not prove that an original finding was false; the second study might have been run with a different population, or might itself have been unlucky. Replication, after all, is how science corrects itself. Moreover, similar difficulties have since been documented in fields such as cancer biology and economics, which suggests that the problem lies less with any single discipline than with the way modern research in general is conducted and rewarded.

Several well-known ideas have nevertheless been badly shaken. One is "ego depletion", the theory that self-control draws on a limited store of mental energy that becomes exhausted with use. Hundreds of studies appeared to support it, yet a large coordinated attempt involving more than twenty laboratories found an effect so small that it was close to zero. Similar doubts have surrounded claims that briefly adopting a confident posture can change a person's hormone levels. That such influential results could rest on such weak foundations is, I believe, the most troubling lesson of the crisis.

How did this happen? Part of the answer lies in what researchers call questionable research practices. Faced with messy data, a scientist might test several different measures but report only the one that "worked", or stop collecting data as soon as a result became significant. Another common practice was to form a hypothesis only after seeing the data, and then to present it as if it had been predicted all along. None of these choices necessarily involves deliberate dishonesty, and each may seem reasonable at the time. Taken together, however, they greatly increase the chance of producing a false positive. The situation was made worse by small samples: a study of forty people can produce dramatic results by chance alone.

Incentives mattered too. For decades, journals were far more likely to publish surprising positive results than careful studies that found nothing, and careers were built on a steady stream of eye-catching publications. Repeating someone else's experiment brought little prestige. Meanwhile, the statistical threshold used to decide whether a result counted as significant was often treated as a line between success and failure, rather than as one piece of evidence among many. Researchers were therefore rewarded for exactly the kind of work that was least likely to be reliable, a system that seems to me to have encouraged error without anyone intending it.

The response over the past decade has been impressive. Many researchers now pre-register their studies, publicly recording their hypotheses and planned analyses before collecting any data, which makes it much harder to adjust methods after seeing the results. Some journals offer a format known as the registered report, in which a study is accepted for publication on the strength of its design, before the results are known. Large collaborations that pool data from dozens of laboratories have become common, and it is increasingly expected that data and materials will be shared openly. Statistical training has changed as well, with more attention paid to the size of an effect rather than simply whether it passes a threshold.

Not everyone welcomes these changes. Some psychologists complain that pre-registration discourages exploratory research, in which unexpected patterns are noticed and followed up, and that it adds paperwork to projects that are already slow. These concerns deserve to be taken seriously, but they are, I think, overstated: nothing prevents a researcher from exploring data, provided that the exploration is reported honestly as such. The crisis has been painful, but a field willing to check its own foundations so publicly is arguably in better health than one that never looks.`,
  questions: [
    choice(
      "What was the main finding of the 2015 project?",
      [
        "Most of the original experiments had used inappropriate methods.",
        "Far fewer of the repeated studies produced significant results than the originals.",
        "The repeated studies produced larger effects than the original ones.",
        "Around half of the original studies had been reported dishonestly.",
      ],
      "Far fewer of the repeated studies produced significant results than the originals.",
      "While 97 of the original studies had reported statistically significant results, only around 36 of the repetitions did so, and the effects that did reappear were, on average, about half as large as first reported.",
      "97 originals were significant but only about 36 repetitions. C reverses the finding (effects were half as large), and D invents dishonesty.",
    ),
    choice(
      "Why does the writer mention cancer biology and economics?",
      [
        "to show that psychology's problems are worse than those of other fields",
        "to suggest that the problem is not confined to one discipline",
        "to explain where the methods of the 2015 project came from",
        "to argue that those fields should copy psychology's reforms",
      ],
      "to suggest that the problem is not confined to one discipline",
      "Moreover, similar difficulties have since been documented in fields such as cancer biology and economics, which suggests that the problem lies less with any single discipline than with the way modern research in general is conducted and rewarded.",
      "The examples show the problem 'lies less with any single discipline' — it is not confined to psychology.",
    ),
    choice(
      "What did the large coordinated study of ego depletion find?",
      [
        "The effect was stronger in some laboratories than in others.",
        "The effect was so small that it barely existed.",
        "The effect appeared only in studies with small samples.",
        "Self-control became stronger with repeated use.",
      ],
      "The effect was so small that it barely existed.",
      "Hundreds of studies appeared to support it, yet a large coordinated attempt involving more than twenty laboratories found an effect so small that it was close to zero.",
      "An effect 'close to zero' barely exists. The passage gives no laboratory-by-laboratory comparison, so A is not supported.",
    ),
    choice(
      "What is the writer's opinion of the criticisms of pre-registration?",
      [
        "They show that exploratory research has become impossible.",
        "They are reasonable but exaggerated.",
        "They prove that the reforms have failed.",
        "They should lead journals to abandon registered reports.",
      ],
      "They are reasonable but exaggerated.",
      "These concerns deserve to be taken seriously, but they are, I think, overstated: nothing prevents a researcher from exploring data, provided that the exploration is reported honestly as such.",
      "The writer says the concerns 'deserve to be taken seriously' (reasonable) 'but they are, I think, overstated' (exaggerated).",
    ),
    ending(
      "Testing several measures but reporting only the one that worked",
      "increases the likelihood of a false positive.",
      "Taken together, however, they greatly increase the chance of producing a false positive.",
      "Such practices 'greatly increase the chance of producing a false positive'. E is a trap: the writer says they do not necessarily involve deliberate dishonesty.",
    ),
    ending(
      "A study involving only a small number of participants",
      "may produce striking results purely by chance.",
      "The situation was made worse by small samples: a study of forty people can produce dramatic results by chance alone.",
      "A study of forty people 'can produce dramatic results by chance alone'.",
    ),
    ending(
      "For many years, repeating another researcher's experiment",
      "brought researchers very little prestige.",
      "Repeating someone else's experiment brought little prestige.",
      "The passage says replication 'brought little prestige'.",
    ),
    ending(
      "In a registered report, a study",
      "is accepted for publication before its results are known.",
      "Some journals offer a format known as the registered report, in which a study is accepted for publication on the strength of its design, before the results are known.",
      "Acceptance comes 'on the strength of its design, before the results are known'. F describes large collaborations, not registered reports.",
    ),
    plain(
      "yes_no_not_given",
      "The 2015 results show that psychology should be regarded as a pseudoscience.",
      "NO",
      "This conclusion, in my view, is both unfair and unhelpful.",
      "The writer calls the pseudoscience conclusion 'unfair and unhelpful', so this contradicts their view.",
    ),
    plain(
      "yes_no_not_given",
      "A failed replication proves that the original finding was wrong.",
      "NO",
      "A failure to replicate does not prove that an original finding was false; the second study might have been run with a different population, or might itself have been unlucky.",
      "The writer states directly that a failure to replicate 'does not prove' the original was false.",
    ),
    plain(
      "yes_no_not_given",
      "The fact that influential findings rested on weak evidence is the most worrying aspect of the crisis.",
      "YES",
      "That such influential results could rest on such weak foundations is, I believe, the most troubling lesson of the crisis.",
      "'The most troubling lesson' matches 'the most worrying aspect', and 'I believe' marks it as the writer's own view.",
    ),
    plain(
      "yes_no_not_given",
      "Most psychology journals now refuse to publish studies that were not pre-registered.",
      "NOT GIVEN",
      "",
      "The writer says many researchers pre-register and some journals offer registered reports, but never says journals refuse other studies.",
    ),
    plain(
      "yes_no_not_given",
      "Psychology is in a stronger position for having examined its weaknesses so openly.",
      "YES",
      "The crisis has been painful, but a field willing to check its own foundations so publicly is arguably in better health than one that never looks.",
      "The writer argues a field that checks its foundations publicly 'is arguably in better health'.",
    ),
  ],
};
