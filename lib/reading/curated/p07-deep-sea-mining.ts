import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

const PEOPLE = ["Sofia Castell", "Leila Haddad", "Owen Rees", "Kwame Asante"];

function person(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("matching_features", prompt, answer, supporting_sentence, explanation),
    options: PEOPLE,
  };
}

const WORD_BANK = [
  "sediment",
  "oxygen",
  "visible",
  "hidden",
  "paused",
  "expanded",
  "weaken",
  "replace",
];

function bank(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("summary_completion", prompt, answer, supporting_sentence, explanation),
    options: WORD_BANK,
  };
}

export const DEEP_SEA_MINING: CuratedPassage = {
  key: "deep-sea-mining-debate",
  title: "The Race to the Seabed",
  topic: "mining the deep ocean for battery metals",
  difficulty: 8,
  body: `Some four thousand metres beneath the surface of the Pacific Ocean, between Hawaii and Mexico, lies a vast plain of fine sediment scattered with dark, potato-sized lumps. These polymetallic nodules, which form over millions of years as metals slowly build up around a small fragment such as a shark's tooth, contain high concentrations of manganese, nickel, cobalt and copper. For decades they were little more than a geological curiosity. Now they sit at the centre of one of the most heated environmental debates of the decade.

The reason is the global shift away from fossil fuels. Electric vehicles, wind turbines and large batteries all require metals in far greater quantities than conventional technologies, and supplies from land-based mines are under strain. Supporters of deep-sea mining argue that the nodules offer an unusually concentrated source of several critical metals in a single deposit, and that collecting them from the seabed would avoid some of the damage caused by mining on land, where forests are cleared and communities are often displaced. Sofia Castell, a mining engineer who has worked on the design of collection vehicles, maintains that the nodules can be gathered with far less waste rock than a typical land mine produces.

Scientists who study the deep ocean are far less enthusiastic. Dr Leila Haddad, a deep-sea ecologist, points out that the nodules are not simply lying on an empty floor: they provide the only hard surface for animals such as sponges and corals, many of which grow nowhere else. Because the nodules grow by only a few millimetres every million years, any habitat removed would, in human terms, be lost for ever. She also notes that the great majority of species collected during recent surveys of the region had never before been described by science. It is difficult, to say the least, to protect an ecosystem that has barely been catalogued.

The concerns extend beyond the mining sites themselves. Collection vehicles would stir up clouds of sediment that could drift for many kilometres, settling on and smothering organisms far from the area being mined. The long-term effects of such disturbance are uncertain, but there are warning signs. In 1989, researchers ploughed a section of seabed off the coast of Peru to simulate mining; when they returned more than twenty-five years later, the tracks were still clearly visible and the animal communities had not recovered. In 2024, a team of researchers reported evidence that nodules might produce small amounts of oxygen on the seafloor, which, if confirmed, would mean they play a role in deep-sea ecosystems that no one had suspected. The claim remains disputed, but Professor Owen Rees, a geochemist who was not involved in the study, argues that such surprises show why any environmental assessment carried out before mining should last many years rather than months.

Responsibility for regulating mining in international waters lies with the International Seabed Authority, a body established under a United Nations treaty. It has granted numerous licences to explore the seabed, but it has yet to agree the rules under which commercial extraction could begin. A growing number of countries have called for a pause until the science is better understood, while others argue that clear regulations are preferable to uncertainty. In recent years, frustration with the slow pace of negotiations has led at least one company to seek permission from a national government instead, a move that critics fear could undermine the international system.

The economic arguments cut both ways. Dr Kwame Asante, who studies mineral markets, warns that the case for mining the seabed may weaken over time, because battery manufacturers are increasingly turning to chemistries that use little or no cobalt or nickel. He also points out that prices for some battery metals fell sharply in the mid-2020s as new supplies from land-based mines came onto the market, and that improved recycling could further reduce demand for newly mined metals. On the other hand, the dominance of a small number of countries in processing critical minerals gives governments elsewhere a strong strategic reason to look for new sources.

In my view, the burden of proof should rest with those who wish to mine. It is not enough to show that seabed mining might cause less visible harm than some operations on land; the two kinds of damage are not easily compared, and one does not justify the other. A pause is not the same as a permanent ban, and there is no convincing reason to rush. Once an ecosystem that took millions of years to form has been destroyed, no amount of later regret will bring it back. The metals will remain on the seabed; the knowledge needed to decide wisely whether to take them does not yet exist.`,
  questions: [
    person(
      "Collecting nodules would create less waste material than mining on land.",
      "Sofia Castell",
      "Sofia Castell, a mining engineer who has worked on the design of collection vehicles, maintains that the nodules can be gathered with far less waste rock than a typical land mine produces.",
      "Castell says nodules can be gathered 'with far less waste rock than a typical land mine produces'.",
    ),
    person(
      "Certain animals depend on the nodules for somewhere to live.",
      "Leila Haddad",
      "Dr Leila Haddad, a deep-sea ecologist, points out that the nodules are not simply lying on an empty floor: they provide the only hard surface for animals such as sponges and corals, many of which grow nowhere else.",
      "Haddad says the nodules are 'the only hard surface' for sponges and corals.",
    ),
    person(
      "Unexpected discoveries show that studies of environmental impact need a long time.",
      "Owen Rees",
      "The claim remains disputed, but Professor Owen Rees, a geochemist who was not involved in the study, argues that such surprises show why any environmental assessment carried out before mining should last many years rather than months.",
      "Rees argues assessments 'should last many years rather than months'. Note he did not make the oxygen discovery himself.",
    ),
    person(
      "New types of battery could reduce the need for some of the metals in the nodules.",
      "Kwame Asante",
      "Dr Kwame Asante, who studies mineral markets, warns that the case for mining the seabed may weaken over time, because battery manufacturers are increasingly turning to chemistries that use little or no cobalt or nickel.",
      "Asante points to battery 'chemistries that use little or no cobalt or nickel'.",
    ),
    person(
      "Most of the species found during recent surveys had not been identified before.",
      "Leila Haddad",
      "She also notes that the great majority of species collected during recent surveys of the region had never before been described by science.",
      "'She' refers back to Haddad, who notes most species 'had never before been described by science'. Letters can be used more than once.",
    ),
    plain(
      "yes_no_not_given",
      "It is hard to protect an ecosystem that has not been properly studied.",
      "YES",
      "It is difficult, to say the least, to protect an ecosystem that has barely been catalogued.",
      "The writer comments that protecting a 'barely catalogued' ecosystem is 'difficult, to say the least'.",
    ),
    plain(
      "yes_no_not_given",
      "The International Seabed Authority has agreed the rules for commercial mining.",
      "NO",
      "It has granted numerous licences to explore the seabed, but it has yet to agree the rules under which commercial extraction could begin.",
      "The authority has granted exploration licences but 'has yet to agree the rules' for extraction. Don't confuse exploring with mining.",
    ),
    plain(
      "yes_no_not_given",
      "If seabed mining caused less visible harm than mining on land, that would justify it.",
      "NO",
      "It is not enough to show that seabed mining might cause less visible harm than some operations on land; the two kinds of damage are not easily compared, and one does not justify the other.",
      "The writer rejects this argument directly: 'one does not justify the other'.",
    ),
    plain(
      "yes_no_not_given",
      "Companies mining the seabed would earn higher profits than land-based mining firms.",
      "NOT GIVEN",
      "",
      "Metal prices and demand are discussed, but the writer never compares the profits of the two kinds of company.",
    ),
    plain(
      "yes_no_not_given",
      "Those who want to mine the seabed should have to show that it is acceptable.",
      "YES",
      "In my view, the burden of proof should rest with those who wish to mine.",
      "'The burden of proof should rest with those who wish to mine' means they must make the case.",
    ),
    bank(
      "Mining machines would stir up ______ that could settle on animals far from the site.",
      "sediment",
      "Collection vehicles would stir up clouds of sediment that could drift for many kilometres, settling on and smothering organisms far from the area being mined.",
      "The vehicles 'stir up clouds of sediment'. 'Oxygen' belongs to the separate 2024 study.",
    ),
    bank(
      "When researchers returned to a test site after more than 25 years, the tracks were still ______.",
      "visible",
      "In 1989, researchers ploughed a section of seabed off the coast of Peru to simulate mining; when they returned more than twenty-five years later, the tracks were still clearly visible and the animal communities had not recovered.",
      "The tracks were 'still clearly visible'. 'Hidden' is the opposite.",
    ),
    bank(
      "Many countries would like mining to be ______ until more is known.",
      "paused",
      "A growing number of countries have called for a pause until the science is better understood, while others argue that clear regulations are preferable to uncertainty.",
      "They 'called for a pause until the science is better understood'.",
    ),
    bank(
      "Critics fear that seeking permission from a single government could ______ the international system.",
      "weaken",
      "In recent years, frustration with the slow pace of negotiations has led at least one company to seek permission from a national government instead, a move that critics fear could undermine the international system.",
      "'Undermine' is paraphrased as 'weaken'. 'Replace' goes too far.",
    ),
  ],
};
