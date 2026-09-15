import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

const FLOW_TITLE = "How a tardigrade survives drying out";

function stage(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
  before: { text: string; indent: number }[] = [],
): CuratedQuestion {
  return {
    ...plain("note_completion", prompt, answer, supporting_sentence, explanation),
    word_limit: "ONE WORD ONLY",
    note_meta: { title: FLOW_TITLE, indent: 0, before, layout: "flowchart" },
  };
}

function choice(
  prompt: string,
  options: string[],
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return { ...plain("multiple_choice", prompt, answer, supporting_sentence, explanation), options };
}

export const TARDIGRADES: CuratedPassage = {
  key: "tardigrades-survival",
  title: "The Toughest Animal on Earth",
  topic: "how tardigrades survive the extremes that kill other animals",
  difficulty: 7,
  body: `Tardigrades are among the most remarkable animals that most people have never heard of. Barely half a millimetre long, with eight stubby legs ending in tiny claws, they were first described in 1773 by a German pastor who, watching their slow and clumsy movements under a microscope, called them "little water bears". More than 1,300 species have since been identified, living everywhere from ocean sediments to the leaf litter of tropical forests. The most familiar kinds, however, live in the thin films of water that cling to moss and lichen, habitats that can dry out completely within hours. It is their response to this constant threat that has made them famous among biologists.

When their surroundings dry, many tardigrades enter a state called anhydrobiosis, meaning "life without water". The process begins as the moss around them loses its moisture. The animal then loses almost all of its water, sometimes retaining as little as three per cent of its normal content. As it dries, it pulls in its legs and head and contracts into a compact, barrel-shaped form known as a tun. In this condition its metabolism slows to a level so low that it can barely be detected. When water returns, the tun absorbs it, and the animal can resume walking and feeding within a few hours.

For decades, researchers assumed that tardigrades protected their cells in the same way as brine shrimp and some other organisms: by producing large quantities of a sugar called trehalose, which turns into a glass-like solid as cells dry. But when scientists measured trehalose levels in tardigrades, many species turned out to contain little or none. The answer, it emerged, lay in families of proteins found nowhere else in nature. As the animal dries, these tardigrade-specific proteins form a gel inside its cells that holds delicate molecules in place and prevents them from falling apart. In laboratory experiments in which the genes for these proteins were switched off, the animals were far less able to survive drying.

Drying is not the only extreme that tardigrades can tolerate. In the tun state, some species have survived temperatures close to absolute zero and exposure to a near-vacuum. One species produces a protein named Dsup, short for "damage suppressor", which binds to its DNA and appears to shield it from radiation. In 2016, a team of Japanese researchers inserted the gene for this protein into human cells grown in the laboratory. When exposed to X-rays, those cells suffered around forty per cent less damage to their DNA than ordinary cells.

Just how long a tardigrade can remain dormant is harder to establish. Claims that animals have revived from museum moss samples a century old are now widely doubted, since the original observations could not be repeated. More reliable evidence comes from a moss sample collected in Antarctica in 1983 and kept frozen for more than thirty years. When researchers thawed it, two tardigrades revived, and one went on to lay eggs that hatched successfully.

These abilities have given tardigrades an almost legendary reputation, and they are often described in popular articles as indestructible. Biologists warn that this is an exaggeration. Active tardigrades, full of water and feeding normally, are no tougher than many other tiny invertebrates, and even dried animals are killed by long exposure to high temperatures. Moreover, survival rates vary greatly between species, and much of the most striking research has been carried out on only a handful of them. It would be more accurate to say that tardigrades are exceptionally good at waiting for better conditions.

What excites many researchers is less the animals themselves than what their molecules might make possible. Vaccines and many other medicines must be kept cold all the way from the factory to the patient, which is expensive and difficult in hot regions with unreliable electricity supplies. Experiments have shown that tardigrade proteins can help to stabilise certain sensitive medicines in a dry state, so that they might one day be stored without refrigeration. Others hope that studying Dsup could lead to ways of protecting astronauts from radiation on long space missions, or of shielding healthy cells during cancer treatment. Such applications remain at an early stage, but they illustrate how an animal smaller than a grain of sand may help to solve distinctly human problems.`,
  questions: [
    stage(
      "The animal loses almost all of its ______",
      "water",
      "The animal then loses almost all of its water, sometimes retaining as little as three per cent of its normal content.",
      "The first change is that the animal 'loses almost all of its water'.",
      [{ text: "The moss or soil around the animal begins to dry", indent: 0 }],
    ),
    stage(
      "It draws in its legs and head, becoming a barrel-shaped ______",
      "tun",
      "As it dries, it pulls in its legs and head and contracts into a compact, barrel-shaped form known as a tun.",
      "The compact, barrel-shaped form is called a 'tun'.",
    ),
    stage(
      "Special proteins form a ______ that holds molecules in place",
      "gel",
      "As the animal dries, these tardigrade-specific proteins form a gel inside its cells that holds delicate molecules in place and prevents them from falling apart.",
      "The proteins form a 'gel'. The 'glass-like solid' belongs to trehalose, which many tardigrades barely use — a trap.",
    ),
    stage(
      "Its ______ slows almost to the point where it cannot be detected",
      "metabolism",
      "In this condition its metabolism slows to a level so low that it can barely be detected.",
      "Its 'metabolism slows to a level so low that it can barely be detected'.",
    ),
    stage(
      "Once water returns, it can walk and feed again within a few ______",
      "hours",
      "When water returns, the tun absorbs it, and the animal can resume walking and feeding within a few hours.",
      "Recovery takes place 'within a few hours'.",
    ),
    plain(
      "true_false_not_given",
      "Most species of tardigrade live in the sea.",
      "NOT GIVEN",
      "",
      "The passage says tardigrades live everywhere 'from ocean sediments' to forests, but never says how many species live in each habitat.",
    ),
    plain(
      "true_false_not_given",
      "All tardigrades depend mainly on trehalose to survive drying.",
      "FALSE",
      "But when scientists measured trehalose levels in tardigrades, many species turned out to contain little or none.",
      "Researchers once assumed this, but many species contain 'little or none' of the sugar.",
    ),
    plain(
      "true_false_not_given",
      "Human cells given the gene for Dsup suffered less DNA damage from X-rays than ordinary cells.",
      "TRUE",
      "When exposed to X-rays, those cells suffered around forty per cent less damage to their DNA than ordinary cells.",
      "The cells with the gene had 'around forty per cent less damage'. Less damage is not the same as no damage, which would make a different statement false.",
    ),
    plain(
      "true_false_not_given",
      "Reports of tardigrades reviving after a hundred years have been confirmed by repeated observations.",
      "FALSE",
      "Claims that animals have revived from museum moss samples a century old are now widely doubted, since the original observations could not be repeated.",
      "The century-old claims are 'widely doubted' precisely because the observations 'could not be repeated'.",
    ),
    plain(
      "true_false_not_given",
      "Some of the best-known research on tardigrades has been based on only a few species.",
      "TRUE",
      "Moreover, survival rates vary greatly between species, and much of the most striking research has been carried out on only a handful of them.",
      "'Only a handful of them' matches 'only a few species'.",
    ),
    choice(
      "What is the writer's view of the description of tardigrades as 'indestructible'?",
      [
        "It is fully supported by laboratory evidence.",
        "It overstates what the animals are able to survive.",
        "It was first used by the scientists who discovered them.",
        "It is true of active animals but not of dried ones.",
      ],
      "It overstates what the animals are able to survive.",
      "Biologists warn that this is an exaggeration.",
      "The writer calls the description 'an exaggeration': active tardigrades are no tougher than other tiny animals, and even dried ones can be killed.",
    ),
    choice(
      "Why might tardigrade proteins be useful in the storage of medicines?",
      [
        "They could remove the need to keep some medicines cold.",
        "They could make medicines work more quickly in the body.",
        "They could reduce the cost of manufacturing vaccines.",
        "They could allow medicines to be taken without water.",
      ],
      "They could remove the need to keep some medicines cold.",
      "Experiments have shown that tardigrade proteins can help to stabilise certain sensitive medicines in a dry state, so that they might one day be stored without refrigeration.",
      "Medicines might be 'stored without refrigeration'. C is a trap: the passage mentions the cost of keeping medicines cold, not of making them.",
    ),
    choice(
      "What does the writer suggest about the practical uses of tardigrade research?",
      [
        "They have already changed the way cancer is treated.",
        "They are unlikely ever to be achieved.",
        "They are still at an early stage of development.",
        "They are of interest mainly to space agencies.",
      ],
      "They are still at an early stage of development.",
      "Such applications remain at an early stage, but they illustrate how an animal smaller than a grain of sand may help to solve distinctly human problems.",
      "The applications 'remain at an early stage'. Cancer treatment and space missions are only hopes, so A and D go too far.",
    ),
  ],
};
