import { fromList, gapFill, mcq, tfng, ynng, type CuratedPassage } from "./shared";

const ORPHAN_ENDINGS = [
  "because the cost of developing a drug is much the same whoever it treats.",
  "although the incentive was designed for exactly that situation.",
  "which is why a price per patient tells you almost nothing on its own.",
  "even though the total number of people affected is very large.",
  "because a trial cannot be run at a size that produces a clear answer.",
  "which the writer regards as the strongest criticism of the scheme.",
  "despite the manufacturer having recovered its costs many times over.",
];

export const ORPHAN_DRUGS: CuratedPassage = {
  key: "orphan-drugs",
  title: "Medicines for Very Few People",
  topic: "an incentive scheme that worked and then produced its own problems",
  difficulty: 8,
  body: `The cost of bringing a drug to market is roughly the same whether the disease it treats affects ten million people or two thousand. Discovery, toxicology, manufacturing, three phases of clinical trial and a regulatory submission are all priced by the work involved rather than by the size of the eventual market. The consequence, before anybody intervened, was straightforward: conditions affecting small numbers of people attracted no commercial development at all, and a patient with such a condition had whatever had been discovered by accident.

There are about seven thousand such conditions, most of them genetic, most of them serious, and most of them appearing in childhood. Individually each is rare. Collectively they affect something in the order of one person in fifteen, which is the statistic that makes the category worth a policy rather than a charity.

The policy arrived in the United States in 1983 and in Europe in 2000, and its structure is the same in both. A drug designated as treating a rare condition — defined by a population threshold — receives fee waivers, tax credits against trial costs, scientific advice from the regulator, and, decisively, a period of market exclusivity after approval during which no similar product may be authorised for the same indication. The exclusivity is longer than the ordinary patent protection and, crucially, does not depend on the drug being patentable.

By the obvious measure it worked. In the decade before the American legislation, fewer than ten drugs for rare conditions reached the market. In the four decades since, several thousand have been designated and many hundreds approved, and entire categories of disease that had no treatment have several.

The difficulties that followed are all versions of the same thing: an incentive attached to a definition will be used by anybody who can fit the definition. Three patterns recur.

The first is slicing. A common disease can often be subdivided — by genetic marker, by stage, by the presence of another condition — until a subgroup falls below the rarity threshold, at which point a drug developed for the whole population qualifies for the incentives on the strength of the subgroup. Several of the largest-selling medicines in the world hold rare-disease designations obtained this way.

The second is repurposing an old compound. A substance long used without protection, sometimes for decades, can be formally tested in a rare condition, approved for it, granted exclusivity, and then sold at a price many multiples of what the same compound cost before. The development cost in these cases is real but modest, and the return is not.

The third is pricing. Rare-disease drugs are among the most expensive products in medicine, with annual costs per patient that can exceed several hundred thousand dollars, on the argument that the patient numbers are too small to recover costs any other way. That argument is sound in principle and unverifiable in practice, since manufacturers do not disclose what development cost, and it becomes visibly weaker for a drug that has been on the market for fifteen years.

Defenders of the scheme make a point that critics tend to skip. A patient with a condition affecting eight hundred people has no alternative source of treatment whatever; there is no generic, no competing product and no prospect of either, and the choice is not between an expensive drug and a cheap one but between an expensive drug and nothing. Several regulators have responded by keeping the incentives and attaching conditions to them — requiring evidence of continued benefit, limiting exclusivity where a drug was already widely used, and negotiating price against measured outcome rather than against the manufacturer's claim.

It is worth adding that the scheme has been copied widely — Japan, Australia, South Korea and others operate versions of it — and that the copies have generally inherited the definition-based structure along with the problems it produces. Nobody has yet designed an incentive that rewards developing a drug for a small population without also rewarding the appearance of having done so.

The underlying tension has no clean resolution. The scheme exists because a market failed, and it corrects the failure by creating a temporary monopoly, which is a mechanism that transfers money from a payer to a manufacturer in exchange for research that would not otherwise happen. Whether any particular transfer was worth it can only be judged drug by drug, and the information needed to judge it is held by the party being paid.`,
  questions: [
    tfng(
      "Development costs depend mainly on how many patients a drug will treat.",
      "FALSE",
      "The cost of bringing a drug to market is roughly the same whether the disease it treats affects ten million people or two thousand.",
      "The cost is 'roughly the same' either way.",
    ),
    tfng(
      "Most rare conditions have a genetic cause.",
      "TRUE",
      "There are about seven thousand such conditions, most of them genetic, most of them serious, and most of them appearing in childhood.",
      "'Most of them genetic'.",
    ),
    tfng(
      "Market exclusivity under the scheme requires the drug to be patentable.",
      "FALSE",
      "The exclusivity is longer than the ordinary patent protection and, crucially, does not depend on the drug being patentable.",
      "It 'does not depend on the drug being patentable'.",
    ),
    tfng(
      "Fewer than ten such drugs reached the market in the decade before 1983.",
      "TRUE",
      "In the decade before the American legislation, fewer than ten drugs for rare conditions reached the market.",
      "'Fewer than ten drugs' reached the market.",
    ),
    tfng(
      "Some widely sold medicines hold rare-disease designations.",
      "TRUE",
      "Several of the largest-selling medicines in the world hold rare-disease designations obtained this way.",
      "Several large sellers hold them.",
    ),
    tfng(
      "Manufacturers publish the development costs that justify their prices.",
      "FALSE",
      "That argument is sound in principle and unverifiable in practice, since manufacturers do not disclose what development cost, and it becomes visibly weaker for a drug that has been on the market for fifteen years.",
      "They 'do not disclose what development cost'.",
    ),
    ynng(
      "The writer thinks the scheme achieved what it was designed to achieve.",
      "YES",
      "By the obvious measure it worked.",
      "'By the obvious measure it worked.'",
    ),
    ynng(
      "The writer regards the pricing argument as impossible to check.",
      "YES",
      "That argument is sound in principle and unverifiable in practice, since manufacturers do not disclose what development cost, and it becomes visibly weaker for a drug that has been on the market for fifteen years.",
      "It is 'unverifiable in practice'.",
    ),
    ynng(
      "The writer believes critics fairly represent the position of patients.",
      "NO",
      "Defenders of the scheme make a point that critics tend to skip.",
      "Critics 'tend to skip' that point.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Rare conditions together affect roughly one person in ______.",
      "fifteen",
      "Collectively they affect something in the order of one person in fifteen, which is the statistic that makes the category worth a policy rather than a charity.",
      "'One person in fifteen'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Dividing a common disease into subgroups is described as ______.",
      "slicing",
      "The first is slicing.",
      "'The first is slicing.'",
    ),
    mcq(
      "What does the second pattern involve?",
      [
        "Testing an old compound in a rare condition",
        "Combining two approved drugs",
        "Selling a drug before it is approved",
        "Applying for designation in two regions",
      ],
      "Testing an old compound in a rare condition",
      "A substance long used without protection, sometimes for decades, can be formally tested in a rare condition, approved for it, granted exclusivity, and then sold at a price many multiples of what the same compound cost before.",
      "An old compound is tested and granted exclusivity.",
    ),
    fromList(
      "matching_sentence_endings",
      ORPHAN_ENDINGS,
      "Rare conditions attracted no commercial interest",
      "because the cost of developing a drug is much the same whoever it treats.",
      "The cost of bringing a drug to market is roughly the same whether the disease it treats affects ten million people or two thousand.",
      "The cost does not scale with the market.",
    ),
    fromList(
      "matching_sentence_endings",
      ORPHAN_ENDINGS,
      "The category as a whole deserves a policy,",
      "even though the total number of people affected is very large.",
      "Collectively they affect something in the order of one person in fifteen, which is the statistic that makes the category worth a policy rather than a charity.",
      "Collectively the numbers are large.",
    ),
    fromList(
      "matching_sentence_endings",
      ORPHAN_ENDINGS,
      "An old drug can be sold at many times its former price,",
      "despite the manufacturer having recovered its costs many times over.",
      "The development cost in these cases is real but modest, and the return is not.",
      "The cost is modest and the return is not.",
    ),
  ],
};
