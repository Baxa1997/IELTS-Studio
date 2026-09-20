import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · medicine · notes box ---------------------------------------

const VENOM_NOTES = {
  title: "How a vial is produced",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · commercial history · people and a word bank ---------------

const LLOYDS_PEOPLE = ["Margery Pinfold", "Anselm Kraus", "Thandiwe Mabaso", "Victor Aliyev"];
const LLOYDS_BANK = [
  "coffee",
  "shipping",
  "syndicate",
  "premium",
  "slip",
  "bell",
  "names",
  "reinsurance",
  "gossip",
];

// ---- Passage 3 · biomedical supply · lettered paragraphs -------------------

const CRAB_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const CRAB_ENDINGS = [
  "because the animal's blood clots on contact with a bacterial contaminant.",
  "which is why the test replaced a method that took three days and a rabbit.",
  "since a bled animal returned to the sea may spawn less for a season.",
  "although a synthetic replacement has existed for more than a decade.",
  "because the birds that depend on the eggs arrive at a fixed time.",
  "even though nobody has counted the population with any precision.",
  "which makes the regulator, not the chemistry, the obstacle to change.",
];

export const TEST_90: CuratedTest = {
  key: "full-test-90",
  targetBand: 5,
  passages: [
    {
      key: "t90-p1-antivenom",
      title: "Milking the Snake",
      topic: "a treatment made almost exactly as it was made a century ago",
      difficulty: 4,
      body: `Snakebite kills something like a hundred thousand people a year and leaves perhaps three times that number with a permanent disability, usually an amputation or a crippled limb. Almost all of those people are agricultural workers in the tropics, and almost all of them are poor. They are bitten in fields, at a distance from any clinic, by animals they were not looking for and in most cases did not see. The World Health Organization classifies snakebite as a neglected tropical disease, a category that describes the level of research funding rather than the number of deaths.

There is an effective treatment, and it is older than antibiotics. Antivenom was developed in the 1890s and the method has barely changed. Venom is collected from live snakes — the process is called milking, and consists of pressing the animal's fangs over the rim of a covered jar so that the glands empty into it. The venom is dried, and small, carefully increasing doses are injected into a large animal, usually a horse, over several months. The horse's immune system produces antibodies against the venom proteins. Blood is then taken from the horse, the plasma separated, the antibody fraction purified, and the result freeze-dried into vials.

Every step of this is slow, biological and difficult to scale. The snakes must be kept alive and healthy, and each species must be milked separately. The horses must be kept for years and monitored. Nothing about the process can be hurried, and the whole chain from a snake to a vial takes the better part of a year. The purification determines how many side effects the product causes, and cheap products cause a great many: an antivenom containing whole animal serum rather than purified antibody fragments can provoke a severe allergic reaction in a substantial minority of patients, which in a rural clinic without adrenaline is itself dangerous.

The deeper problem is that venom is not one substance. It differs between species, and it differs within a species between regions and between adults and juveniles. An antivenom raised against the venom of one population of one snake may be almost useless against the same snake five hundred kilometres away. This is why products are described as monovalent, effective against one species, or polyvalent, raised against a mixture and effective against several in a defined region. A polyvalent antivenom made for one continent does not work on another, which patients and sometimes clinicians have discovered at the worst possible moment.

The market has failed in an unusually clear way. In the 1980s a widely used African polyvalent product was discontinued because it was unprofitable, and the gap was filled by products of little or no proven efficacy, sold with confident labelling in countries whose regulators could not test them. Deaths rose. A fully effective product for sub-Saharan Africa costs more per course than most patients earn in a month, is needed in places with no cold chain, and expires. Manufacturers have withdrawn repeatedly, and the reason is not indifference: the people who need the product cannot pay for it and the states that should buy it often do not.

Research has concentrated on removing the horse. Monoclonal antibodies against specific venom toxins can be manufactured consistently in a laboratory, without animals, and stored more robustly. Small-molecule drugs that inhibit the enzymes in venom offer something even more valuable — a treatment that could be carried by a health worker or even swallowed, rather than infused in a hospital, which matters enormously when the journey to a clinic takes six hours. One such inhibitor, originally developed for another purpose, has shown real promise against the venoms of several vipers.

None of this has reached the field at scale, and the constraint is not the science. The trials required are expensive; the market cannot pay for them; and the organisations that fund neglected diseases have many claims on their money. Meanwhile the most effective interventions available are unglamorous ones: keeping the correct antivenom in stock in the clinics nearest to farmland, training staff to use it, and providing motorcycles to get patients there. A study in one country found that the time from bite to treatment predicted survival better than which product was administered, which is a finding about roads rather than about medicine.`,
      questions: [
        tfng(
          "Snakebite is classified as neglected because of the funding it receives.",
          "TRUE",
          "The World Health Organization classifies snakebite as a neglected tropical disease, a category that describes the level of research funding rather than the number of deaths.",
          "The category describes funding, not deaths.",
        ),
        tfng(
          "The method of making antivenom has changed greatly since the 1890s.",
          "FALSE",
          "Antivenom was developed in the 1890s and the method has barely changed.",
          "The method 'has barely changed'.",
        ),
        tfng(
          "All the snakes of a region can be milked together.",
          "FALSE",
          "The snakes must be kept alive and healthy, and each species must be milked separately.",
          "Each species is milked separately.",
        ),
        tfng(
          "Poorly purified antivenom can cause serious allergic reactions.",
          "TRUE",
          "An antivenom containing whole animal serum rather than purified antibody fragments can provoke a severe allergic reaction in a substantial minority of patients, which in a rural clinic without adrenaline is itself dangerous.",
          "It can provoke severe reactions.",
        ),
        tfng(
          "A snake's venom is the same throughout its range.",
          "FALSE",
          "It differs between species, and it differs within a species between regions and between adults and juveniles.",
          "It differs between regions.",
        ),
        tfng(
          "The withdrawal of an African product was followed by more deaths.",
          "TRUE",
          "Deaths rose.",
          "The passage states that deaths rose.",
        ),
        tfng(
          "Most snakebite victims are bitten while asleep indoors.",
          "NOT GIVEN",
          "",
          "The passage says they are agricultural workers but not where bites occur.",
        ),
        noteLine(
          VENOM_NOTES,
          "Stage 1",
          "Venom is collected by ______ the live snake",
          "milking",
          "Venom is collected from live snakes — the process is called milking, and consists of pressing the animal's fangs over the rim of a covered jar so that the glands empty into it.",
          "The collection is called milking.",
        ),
        noteLine(
          VENOM_NOTES,
          "Stage 2",
          "Rising doses are injected into a ______ over several months",
          "horse",
          "The venom is dried, and small, carefully increasing doses are injected into a large animal, usually a horse, over several months.",
          "A horse receives the rising doses.",
        ),
        noteLine(
          VENOM_NOTES,
          "Stage 3",
          "Blood is taken and the ______ separated before purifying",
          "plasma",
          "Blood is then taken from the horse, the plasma separated, the antibody fraction purified, and the result freeze-dried into vials.",
          "The plasma is separated first.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A product raised against several species in one region is called ______.",
          "polyvalent",
          "This is why products are described as monovalent, effective against one species, or polyvalent, raised against a mixture and effective against several in a defined region.",
          "Such a product is polyvalent.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A small-molecule drug could be carried by a health worker or even ______.",
          "swallowed",
          "Small-molecule drugs that inhibit the enzymes in venom offer something even more valuable — a treatment that could be carried by a health worker or even swallowed, rather than infused in a hospital, which matters enormously when the journey to a clinic takes six hours.",
          "It could be swallowed instead.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Survival was predicted better by the ______ from bite to treatment than by the product used.",
          "time",
          "A study in one country found that the time from bite to treatment predicted survival better than which product was administered, which is a finding about roads rather than about medicine.",
          "Time to treatment predicted survival.",
        ),
      ],
    },
    {
      key: "t90-p2-lloyds-coffee-house",
      title: "The Coffee House That Became an Exchange",
      topic: "how marine insurance grew out of a room where shipping news was traded",
      difficulty: 5,
      body: `In the 1680s a man named Edward Lloyd kept a coffee house near the Thames in London. Coffee houses of the period were not merely places to drink; each had a clientele and a speciality, and a merchant chose his house the way a modern professional chooses a conference. Lloyd's speciality was shipping. Captains, owners, brokers and men with money to risk went there because that was where the news was, and Lloyd, who was a businessman rather than a bystander, began to collect and publish it: which ships had sailed, which had arrived, which were overdue, what the weather had been in the Channel.

Margery Pinfold, a historian of commerce, argues that the information service is the whole explanation of what followed, and that it is usually told the wrong way round. Insurance did not create the news-gathering; the news-gathering created a place where insurance could be written, because a man deciding whether to accept a risk on a voyage to Jamaica needed exactly the facts Lloyd was compiling. She treats the coffee house as an early example of a business whose real asset was a list.

The insurance itself worked, and still works, by subscription. A broker acting for a shipowner wrote the details of the voyage on a piece of paper and carried it round the room. An individual with capital who was willing to take part of the risk wrote his name under the description, with the proportion he would accept, and the premium he wanted. When enough people had written under it to cover the whole value, the risk was placed. Anselm Kraus, who writes on the institutional history of finance, points out that the word underwriter is literally a description of this act, and that the arrangement distributes a risk too large for any one person without requiring a company to exist at all.

The people who signed were called Names, and their liability was unlimited: each stood behind his share with his entire personal fortune. Thandiwe Mabaso, an insurance economist, regards this as the arrangement's great strength and its eventual undoing. Unlimited liability made the promise extremely credible, which is why shipowners across the world preferred London. It also meant that a sufficiently large and unexpected series of claims could ruin individuals who had never seen the risks they were carrying, and that is precisely what happened in the late 1980s and early 1990s, when asbestos and pollution claims from decades earlier arrived at once and thousands of Names lost everything. The market survived by bringing in corporate capital with limited liability, which now provides most of it.

The institution has kept a remarkable number of its habits. Business is still written on a document called a slip. Underwriters still sit in a physical room, and brokers still walk between them, which in an age of electronic placement is defended on the grounds that a genuinely unusual risk needs a conversation. A bell taken from a wrecked frigate hangs in the room and was traditionally rung for news of a loss, which Victor Aliyev, who has studied trading floors, describes as an information ritual rather than a ceremonial one: the point was that everyone in the market learned a material fact at the same instant, and a bell does that better than a notice.

What the market sells has widened far beyond ships. Aircraft, satellites, oil platforms, film productions, sporting events, the fingers of musicians and the reputations of companies have all been covered there, and the specialism is not any particular industry but risks that are large, unusual, or without enough precedent for a statistical table. Ordinary motor insurance is a mass business run on data; a first-of-its-kind chemical plant is not, and someone has to price it by judgement. That judgement is the product, and it is the one thing in the whole arrangement that has never been automated.

The reinsurance layer above all of this is where the systemic question lives. Insurers insure each other, and the chains can be long and hard to trace, so that a single very large loss propagates through parties who did not know they were connected. Regulators have spent thirty years trying to make those chains visible, and the honest position is that the picture is better than it was and still incomplete. It is the same problem Edward Lloyd was solving when he started writing down which ships had come in, scaled up by three centuries and considerably harder.`,
      questions: [
        fromList(
          "matching_features",
          LLOYDS_PEOPLE,
          "The business's real asset was the information it compiled.",
          "Margery Pinfold",
          "She treats the coffee house as an early example of a business whose real asset was a list.",
          "Pinfold identifies the list as the asset.",
        ),
        fromList(
          "matching_features",
          LLOYDS_PEOPLE,
          "The method spread a large risk without needing a company.",
          "Anselm Kraus",
          "Anselm Kraus, who writes on the institutional history of finance, points out that the word underwriter is literally a description of this act, and that the arrangement distributes a risk too large for any one person without requiring a company to exist at all.",
          "Kraus notes no company was required.",
        ),
        fromList(
          "matching_features",
          LLOYDS_PEOPLE,
          "The feature that made the promise credible also destroyed people.",
          "Thandiwe Mabaso",
          "Thandiwe Mabaso, an insurance economist, regards this as the arrangement's great strength and its eventual undoing.",
          "Mabaso calls it strength and undoing.",
        ),
        fromList(
          "matching_features",
          LLOYDS_PEOPLE,
          "A traditional practice served to spread a fact simultaneously.",
          "Victor Aliyev",
          "A bell taken from a wrecked frigate hangs in the room and was traditionally rung for news of a loss, which Victor Aliyev, who has studied trading floors, describes as an information ritual rather than a ceremonial one: the point was that everyone in the market learned a material fact at the same instant, and a bell does that better than a notice.",
          "Aliyev calls the bell an information ritual.",
        ),
        fromList(
          "summary_completion",
          LLOYDS_BANK,
          "The market began in a ______ house near the Thames.",
          "coffee",
          "In the 1680s a man named Edward Lloyd kept a coffee house near the Thames in London.",
          "It began in a coffee house.",
        ),
        fromList(
          "summary_completion",
          LLOYDS_BANK,
          "Its speciality was ______, and the news that went with it.",
          "shipping",
          "Lloyd's speciality was shipping.",
          "The speciality was shipping.",
        ),
        fromList(
          "summary_completion",
          LLOYDS_BANK,
          "A broker still carries the risk round the room on a ______.",
          "slip",
          "Business is still written on a document called a slip.",
          "The document is called a slip.",
        ),
        fromList(
          "summary_completion",
          LLOYDS_BANK,
          "Individual backers were called ______ and were liable without limit.",
          "names",
          "The people who signed were called Names, and their liability was unlimited: each stood behind his share with his entire personal fortune.",
          "They were called Names.",
        ),
        fromList(
          "summary_completion",
          LLOYDS_BANK,
          "Above the insurers sits a layer of ______ whose chains are hard to trace.",
          "reinsurance",
          "The reinsurance layer above all of this is where the systemic question lives.",
          "The layer above is reinsurance.",
        ),
        mcq(
          "Why did shipowners around the world prefer the London market?",
          [
            "Unlimited liability made the promise credible",
            "Premiums there were the lowest available",
            "British ships were considered safer",
            "Claims were settled without documents",
          ],
          "Unlimited liability made the promise credible",
          "Unlimited liability made the promise extremely credible, which is why shipowners across the world preferred London.",
          "Credibility came from unlimited liability.",
        ),
        mcq(
          "What ended the era of individual capital dominating the market?",
          [
            "Old asbestos and pollution claims arriving together",
            "A single very large shipping loss",
            "A change in British company law",
            "The move to electronic placement",
          ],
          "Old asbestos and pollution claims arriving together",
          "It also meant that a sufficiently large and unexpected series of claims could ruin individuals who had never seen the risks they were carrying, and that is precisely what happened in the late 1980s and early 1990s, when asbestos and pollution claims from decades earlier arrived at once and thousands of Names lost everything.",
          "Those claims arrived at once.",
        ),
        mcq(
          "How is the physical trading room defended today?",
          [
            "Unusual risks require a conversation",
            "Electronic systems are unreliable",
            "Regulators require face-to-face placement",
            "Brokers cannot carry documents securely",
          ],
          "Unusual risks require a conversation",
          "Underwriters still sit in a physical room, and brokers still walk between them, which in an age of electronic placement is defended on the grounds that a genuinely unusual risk needs a conversation.",
          "An unusual risk 'needs a conversation'.",
        ),
        mcq(
          "What kind of risk is the market's speciality?",
          [
            "Risks with too little precedent for a statistical table",
            "Risks in the shipping industry only",
            "Risks that can be priced from large datasets",
            "Risks small enough for one insurer",
          ],
          "Risks with too little precedent for a statistical table",
          "Aircraft, satellites, oil platforms, film productions, sporting events, the fingers of musicians and the reputations of companies have all been covered there, and the specialism is not any particular industry but risks that are large, unusual, or without enough precedent for a statistical table.",
          "The speciality is risks without precedent.",
        ),
      ],
    },
    {
      key: "t90-p3-horseshoe-crabs",
      title: "The Blue Blood in Every Batch",
      topic: "an animal older than the dinosaurs on which the safety of injected medicine depends",
      difficulty: 6,
      body: `A) Every injectable drug, every vaccine and every implanted device must be shown to be free of bacterial endotoxin, a fragment of bacterial cell wall that survives sterilisation and causes fever, shock and sometimes death when it enters the bloodstream. Killing the bacteria is not enough; the fragments remain active. The test that detects them, used on billions of doses a year, depends on the blood of an animal that has existed in roughly its present form for hundreds of millions of years.

B) The horseshoe crab is not a crab, and the name is one of the more misleading in zoology. It is closer to spiders and scorpions, it has survived several mass extinctions, and its blood is blue because it carries oxygen with copper rather than iron. More usefully, its immune system has no antibodies. Instead its blood contains cells that, on meeting a bacterial contaminant, release a cascade of proteins that clot the fluid around the intruder and immobilise it. In an animal with an open circulatory system and no way to mount a specific response, an instant physical trap is the available defence.

C) In the 1960s it was shown that an extract of these cells clots in the presence of minute quantities of endotoxin, and the reaction was turned into a test: mix the extract with a sample, and a clot means contamination. The resulting reagent is extraordinarily sensitive, detecting concentrations in the region of one part in a trillion, and it gives an answer in under an hour. It replaced a method in which a sample was injected into a rabbit and the animal's temperature was monitored for three days, which was slower, less sensitive, and required far more animals.

D) The extract is obtained by catching the crabs, bleeding them, and returning them to the sea. Up to about a third of the blood volume is taken from each animal. The industry's figure for mortality is low, in the region of a few per cent, and independent studies have reported higher figures and, more importantly, effects on the survivors: bled females appear to spawn less in the following season, and bled animals move more slowly for some weeks. Hundreds of thousands of animals are bled annually, and a further large number are taken as bait by fishermen, which is a separate and less regulated pressure on the same population. The two uses are counted by different authorities, and nobody publishes a single figure for how many animals are removed from the water in a year.

E) The ecological stake is not only the crab. The eggs the animals lay on the Atlantic beaches in spring are the food that allows several migratory shorebird species to complete their journeys, and the birds arrive on a schedule set by day length, not by the crabs' abundance. A bird that reaches a beach with too few eggs cannot wait or go elsewhere. One species has declined severely and the decline has been linked, though not with the certainty anyone would like, to the availability of eggs on the crucial stretches of coast.

F) A synthetic alternative exists. Recombinant factor C is the key clotting protein produced in a laboratory without any animal, and it has been available since the early 2000s. Published comparisons find it performs as well as the natural extract. It has nevertheless been adopted slowly, and the reason is regulatory rather than technical: for years the standard reference works listed the crab-derived test as the compendial method, and a manufacturer wishing to use the synthetic one had to validate it product by product, which costs money and invites questions from inspectors in every country a drug is sold in. The pharmacopoeias have begun to change this, and the change is recent enough that most of the doses given last year were still certified with the animal-derived reagent.

G) The case is a clean illustration of something that recurs whenever biology enters a supply chain. The technical problem was solved a decade before the practice changed, because the obstacle was never the chemistry. It was the cost of demonstrating equivalence within a regulatory system built, quite reasonably, to be slow to accept substitutions in anything injected into human beings. Meanwhile an animal that survived the end of the Palaeozoic is caught, drained of a third of its blood, and released, several hundred thousand times a year, to certify medicines that could now be certified without it.`,
      questions: [
        fromList(
          "matching_information",
          CRAB_PARAGRAPHS,
          "the reason a laboratory-made substitute has spread slowly",
          "F",
          "It has nevertheless been adopted slowly, and the reason is regulatory rather than technical: for years the standard reference works listed the crab-derived test as the compendial method, and a manufacturer wishing to use the synthetic one had to validate it product by product, which costs money and invites questions from inspectors in every country a drug is sold in.",
          "Paragraph F gives the regulatory reason.",
        ),
        fromList(
          "matching_information",
          CRAB_PARAGRAPHS,
          "effects on animals that survive being bled",
          "D",
          "The industry's figure for mortality is low, in the region of a few per cent, and independent studies have reported higher figures and, more importantly, effects on the survivors: bled females appear to spawn less in the following season, and bled animals move more slowly for some weeks.",
          "Paragraph D reports the effects on survivors.",
        ),
        fromList(
          "matching_information",
          CRAB_PARAGRAPHS,
          "why an immune system without antibodies needs a different defence",
          "B",
          "In an animal with an open circulatory system and no way to mount a specific response, an instant physical trap is the available defence.",
          "Paragraph B explains the trap defence.",
        ),
        fromList(
          "matching_information",
          CRAB_PARAGRAPHS,
          "a bird species whose decline has been linked to egg supply",
          "E",
          "One species has declined severely and the decline has been linked, though not with the certainty anyone would like, to the availability of eggs on the crucial stretches of coast.",
          "Paragraph E describes the bird decline.",
        ),
        fromList(
          "matching_information",
          CRAB_PARAGRAPHS,
          "why sterilising a product does not make it safe to inject",
          "A",
          "Killing the bacteria is not enough; the fragments remain active.",
          "Paragraph A explains that fragments survive.",
        ),
        ynng(
          "The writer accepts the industry's mortality figure as settled.",
          "NO",
          "The industry's figure for mortality is low, in the region of a few per cent, and independent studies have reported higher figures and, more importantly, effects on the survivors: bled females appear to spawn less in the following season, and bled animals move more slowly for some weeks.",
          "Independent studies report higher figures.",
        ),
        ynng(
          "The writer thinks the link between egg supply and the bird's decline is firmly established.",
          "NO",
          "One species has declined severely and the decline has been linked, though not with the certainty anyone would like, to the availability of eggs on the crucial stretches of coast.",
          "Not with the certainty anyone would like.",
        ),
        ynng(
          "The writer regards the caution of drug regulators as reasonable in itself.",
          "YES",
          "It was the cost of demonstrating equivalence within a regulatory system built, quite reasonably, to be slow to accept substitutions in anything injected into human beings.",
          "The caution is 'quite reasonably' built in.",
        ),
        ynng(
          "The writer believes the bleeding of crabs is still technically necessary.",
          "NO",
          "Meanwhile an animal that survived the end of the Palaeozoic is caught, drained of a third of its blood, and released, several hundred thousand times a year, to certify medicines that could now be certified without it.",
          "They 'could now be certified without it'.",
        ),
        fromList(
          "matching_sentence_endings",
          CRAB_ENDINGS,
          "The extract detects contamination almost instantly,",
          "because the animal's blood clots on contact with a bacterial contaminant.",
          "Instead its blood contains cells that, on meeting a bacterial contaminant, release a cascade of proteins that clot the fluid around the intruder and immobilise it.",
          "The clotting is the detection.",
        ),
        fromList(
          "matching_sentence_endings",
          CRAB_ENDINGS,
          "The test was adopted quickly in the 1970s,",
          "which is why the test replaced a method that took three days and a rabbit.",
          "It replaced a method in which a sample was injected into a rabbit and the animal's temperature was monitored for three days, which was slower, less sensitive, and required far more animals.",
          "The older method used a rabbit over three days.",
        ),
        fromList(
          "matching_sentence_endings",
          CRAB_ENDINGS,
          "Returning an animal alive is not the end of the harm,",
          "since a bled animal returned to the sea may spawn less for a season.",
          "Up to about a third of the blood volume is taken from each animal.",
          "Spawning falls in the season after bleeding.",
        ),
        fromList(
          "matching_sentence_endings",
          CRAB_ENDINGS,
          "A shortage of eggs cannot be waited out,",
          "because the birds that depend on the eggs arrive at a fixed time.",
          "The eggs the animals lay on the Atlantic beaches in spring are the food that allows several migratory shorebird species to complete their journeys, and the birds arrive on a schedule set by day length, not by the crabs' abundance.",
          "The arrival is set by day length.",
        ),
        fromList(
          "matching_sentence_endings",
          CRAB_ENDINGS,
          "The animals are still bled in large numbers,",
          "although a synthetic replacement has existed for more than a decade.",
          "Recombinant factor C is the key clotting protein produced in a laboratory without any animal, and it has been available since the early 2000s.",
          "The synthetic protein has long been available.",
        ),
      ],
    },
  ],
};
