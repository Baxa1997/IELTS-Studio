import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · waste policy · notes box -----------------------------------

const DEPOSIT_NOTES = {
  title: "The journey of one bottle",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · behavioural policy · people and a word bank ---------------

const BAG_PEOPLE = ["Fiona Kelleher", "Mateo Salgado", "Ngozi Eze", "Henrik Dahl"];
const BAG_BANK = [
  "charge",
  "reusable",
  "thicker",
  "salience",
  "litter",
  "ban",
  "habit",
  "revenue",
  "bins",
];

// ---- Passage 3 · traffic engineering · lettered paragraphs -----------------

const ROUNDABOUT_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const ROUNDABOUT_ENDINGS = [
  "because a vehicle joining a circle never crosses the path of oncoming traffic.",
  "which is why the severe collisions largely disappear and the minor ones do not.",
  "since the junction keeps working when the power supply fails.",
  "although a driver on foot or on a bicycle gains far less from the change.",
  "until the entry rule was reversed to give priority to the circulating traffic.",
  "even though the design was invented in the country that adopted it last.",
  "which makes the land it occupies the usual reason for refusing one.",
];

export const TEST_92: CuratedTest = {
  key: "full-test-92",
  targetBand: 4,
  passages: [
    {
      key: "t92-p1-bottle-deposit",
      title: "Paying a Deposit on the Bottle",
      topic: "an old arrangement that was abandoned and is being reinstated",
      difficulty: 4,
      body: `For most of the twentieth century a bottle of milk or beer was not sold outright. The customer paid a small extra sum, returned the empty container to the shop, and got the money back. The bottle was collected, washed and refilled, perhaps twenty or thirty times, and the deposit existed to make sure it came back. Nobody thought of this as recycling. It was simply how the trade worked, because glass was expensive relative to the drink inside it and a manufacturer wanted its containers returned.

The system collapsed in the second half of the century, in almost every country at once, and the reason was that the arithmetic reversed. Cheap thin glass, then cans, then plastic bottles made a new container cost less than collecting, transporting and washing an old one. Once that was true, the deposit became a nuisance to everybody and a saving to nobody, and the industry moved to single-use packaging with considerable enthusiasm. The consequence was a large increase in the number of containers sold and a similar increase in the number lying by the roadside. Within about twenty years the returnable bottle had gone from being the normal way to sell a drink to being a curiosity found in a few regional dairies.

Deposit return schemes have since been reintroduced in more than forty countries and regions, and the modern version is different in one important respect. The bottle is no longer refilled. It is collected, sorted by material, and recycled, which means the deposit is now a mechanism for getting a clean single-material stream rather than a mechanism for getting the physical object back. That is a less elegant arrangement than the one it replaced, and it works, because the thing that makes recycling difficult is contamination and mixing, and a bottle handed back by the person who bought it is neither dirty nor mixed with anything.

The results are consistent enough to be dull. Countries with a deposit of a meaningful size collect between eighty and ninety-five per cent of the containers covered. Countries relying on kerbside collection alone typically manage between thirty and sixty per cent, and the material they collect is worth less because it arrives mixed with everything else in the bin. The deposit does not persuade people to care about waste; it attaches a small sum of money to an object, and the object stops being litter. That is a mechanical result rather than a moral one, and it is why the figures are so similar from one country to the next.

The reverse vending machine is what makes the modern scheme practical. A customer feeds containers into a machine in a supermarket entrance; it reads the barcode, checks the container against a national database, crushes it, and issues a voucher. The machines are expensive, they occupy retail floor space, and the retailers who host them are not the parties who benefit, which is the commonest point of friction when a scheme is designed. Most legislation resolves it by requiring producers to fund the system, on the principle that whoever puts a container onto the market should pay for taking it off again.

Two objections recur. The first is that a deposit is regressive, since the sum is the same for everyone and is only refunded to those who make the trip. The evidence is that the poorest households have the highest return rates, precisely because the money matters more to them, and in several countries collecting unreturned containers from bins and streets is a real if marginal source of income. The second objection is that a deposit scheme cannibalises kerbside recycling, removing the most valuable material from the bin and leaving local authorities with a costlier residue. This is true, and it is an argument about who pays rather than about whether the material gets recycled.

The unresolved question is scope. Almost every scheme covers drinks containers and almost none covers anything else, because drinks containers are uniform, numerous, easy to identify and disposed of away from home. Extending the same logic to food packaging runs into the fact that it is enormously varied and mostly thrown away in a kitchen, where a bin is already available and the walk to a machine is not worth a few pence. The deposit works on precisely the objects it was invented for, which is a limit rather than a failure.`,
      questions: [
        tfng(
          "The original purpose of a deposit was to recycle the material.",
          "FALSE",
          "It was simply how the trade worked, because glass was expensive relative to the drink inside it and a manufacturer wanted its containers returned.",
          "The purpose was to get the container back.",
        ),
        tfng(
          "The old system ended because new containers became cheaper than reuse.",
          "TRUE",
          "Cheap thin glass, then cans, then plastic bottles made a new container cost less than collecting, transporting and washing an old one.",
          "A new container cost less than reuse.",
        ),
        tfng(
          "Modern schemes refill the returned bottles.",
          "FALSE",
          "The bottle is no longer refilled.",
          "'The bottle is no longer refilled.'",
        ),
        tfng(
          "Deposit schemes collect a higher share of containers than kerbside collection.",
          "TRUE",
          "Countries with a deposit of a meaningful size collect between eighty and ninety-five per cent of the containers covered.",
          "Deposit rates far exceed kerbside rates.",
        ),
        tfng(
          "Retailers hosting the machines are the main beneficiaries.",
          "FALSE",
          "The machines are expensive, they occupy retail floor space, and the retailers who host them are not the parties who benefit, which is the commonest point of friction when a scheme is designed.",
          "They 'are not the parties who benefit'.",
        ),
        tfng(
          "Poorer households return fewer containers than richer ones.",
          "FALSE",
          "The evidence is that the poorest households have the highest return rates, precisely because the money matters more to them, and in several countries collecting unreturned containers from bins and streets is a real if marginal source of income.",
          "The poorest have the highest return rates.",
        ),
        tfng(
          "Germany's scheme covers wine bottles as well as beer.",
          "NOT GIVEN",
          "",
          "The passage discusses scope in general but names no country's list.",
        ),
        noteLine(
          DEPOSIT_NOTES,
          "At purchase",
          "Customer pays a small ______ on top of the price",
          "deposit",
          "The bottle was collected, washed and refilled, perhaps twenty or thirty times, and the deposit existed to make sure it came back.",
          "The deposit secures the return.",
        ),
        noteLine(
          DEPOSIT_NOTES,
          "On return",
          "Machine reads the ______ and checks a national database",
          "barcode",
          "A customer feeds containers into a machine in a supermarket entrance; it reads the barcode, checks the container against a national database, crushes it, and issues a voucher.",
          "It reads the barcode.",
        ),
        noteLine(
          DEPOSIT_NOTES,
          "On return",
          "Container is crushed and a ______ is issued",
          "voucher",
          "A customer feeds containers into a machine in a supermarket entrance; it reads the barcode, checks the container against a national database, crushes it, and issues a voucher.",
          "The machine issues a voucher.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Recycling is made difficult by ______ and mixing.",
          "contamination",
          "That is a less elegant arrangement than the one it replaced, and it works, because the thing that makes recycling difficult is contamination and mixing, and a bottle handed back by the person who bought it is neither dirty nor mixed with anything.",
          "Contamination and mixing are the problem.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Legislation usually requires ______ to fund the scheme.",
          "producers",
          "Most legislation resolves it by requiring producers to fund the system, on the principle that whoever puts a container onto the market should pay for taking it off again.",
          "Producers fund the system.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Food packaging is mostly discarded in a ______, where a bin is already at hand.",
          "kitchen",
          "Extending the same logic to food packaging runs into the fact that it is enormously varied and mostly thrown away in a kitchen, where a bin is already available and the walk to a machine is not worth a few pence.",
          "It is thrown away in a kitchen.",
        ),
      ],
    },
    {
      key: "t92-p2-bag-charge",
      title: "The Charge That Changed a Habit",
      topic: "the smallest price in public policy, and why it worked better than expected",
      difficulty: 4,
      body: `In 2002 Ireland introduced a charge of fifteen cents on plastic shopping bags at the till. Use fell by more than nine-tenths within weeks. The measure has since been copied in dozens of countries, and it is the most quoted example in the whole of behavioural policy, for a reason that is worth examining rather than repeating: the effect is far larger than the price can explain.

Fiona Kelleher, who worked on the Irish scheme, is clear that nobody expected the size of the response. Fifteen cents is a trivial amount, smaller than the rounding error on a weekly shop, and standard economic reasoning predicts a correspondingly trivial change in behaviour. What happened instead was that the bag stopped being invisible. A shopper who had never considered whether to take a bag was now asked a question at the till, in public, with a queue behind them, and the answer most people gave was no. Within a fortnight the bags had gone from the default to the exception, and the shopper who wanted one had to say so. She describes the charge as having worked by making the decision conscious rather than by making the bag expensive.

Mateo Salgado, an economist, has tried to separate the two mechanisms. Comparing jurisdictions with different charge levels, he finds that the size of the charge explains remarkably little of the variation in use, while whether the charge is announced aloud at the till, and whether the shopper must ask for a bag rather than being handed one, explain a great deal. His conclusion is that the price is doing the work of a prompt, and that a scheme designed on that understanding would look different from one designed to change relative costs.

The awkward findings concern what replaced the bags. Ngozi Eze, who studies waste streams, points out that a thin single-use bag had secondary uses in most households — lining a bin, carrying wet clothes, wrapping something — and that those uses did not disappear when the bags did. Sales of purpose-made bin liners rose in several countries after a bag charge, by enough to offset part of the plastic saved, and the liners are thicker. She also notes that where charges applied only to the thinnest bags, retailers switched to slightly thicker ones that fell outside the rule and were given away, which used more plastic per bag and defeated the measure entirely until the rules were rewritten.

The reusable alternative has its own arithmetic. A cotton tote bag takes far more energy and water to manufacture than a thin plastic one, and the number of uses required before it is environmentally preferable runs, in some analyses, into the thousands. Henrik Dahl, who conducts such assessments, argues that this comparison is regularly misused by both sides: it is true and it is not an argument for single-use plastic, because the reusable bag's problem is that people own too many of them rather than that reuse is a bad idea. He is emphatic that the correct conclusion is to use whatever bag one already owns until it disintegrates, and that no life-cycle study has ever supported buying a new bag of any material.

What the episode really demonstrates is the value of an intervention placed at the moment of a decision. There is no information campaign about plastic that has achieved anything close to a ninety per cent behavioural change, and the campaigns were not wrong about the facts. The charge worked because it arrived at the till rather than in a leaflet, and because refusing a bag was easy and immediate. A leaflet asks somebody to remember a decision at a moment that has not yet arrived; the till asks for it at the moment itself.

It is also, by any measure of tonnage, a small policy. Shopping bags are a fraction of one per cent of plastic production, and the litter they cause is visible rather than large. The most defensible case for the charge is not the plastic saved but the demonstration: it showed governments that a small, well-placed, non-prohibitive measure could shift a mass habit in a month, which is a general finding about policy design and has been applied since to matters considerably more consequential than a bag.`,
      questions: [
        fromList(
          "matching_features",
          BAG_PEOPLE,
          "The charge worked by making an unconsidered decision conscious.",
          "Fiona Kelleher",
          "She describes the charge as having worked by making the decision conscious rather than by making the bag expensive.",
          "Kelleher contrasts conscious with expensive.",
        ),
        fromList(
          "matching_features",
          BAG_PEOPLE,
          "How the charge is presented matters more than its level.",
          "Mateo Salgado",
          "Comparing jurisdictions with different charge levels, he finds that the size of the charge explains remarkably little of the variation in use, while whether the charge is announced aloud at the till, and whether the shopper must ask for a bag rather than being handed one, explain a great deal.",
          "Salgado compares level against presentation.",
        ),
        fromList(
          "matching_features",
          BAG_PEOPLE,
          "Retailers switched to bags that the rule did not cover.",
          "Ngozi Eze",
          "She also notes that where charges applied only to the thinnest bags, retailers switched to slightly thicker ones that fell outside the rule and were given away, which used more plastic per bag and defeated the measure entirely until the rules were rewritten.",
          "Eze describes the thicker substitute.",
        ),
        fromList(
          "matching_features",
          BAG_PEOPLE,
          "The right conclusion is to keep using the bag one already has.",
          "Henrik Dahl",
          "He is emphatic that the correct conclusion is to use whatever bag one already owns until it disintegrates, and that no life-cycle study has ever supported buying a new bag of any material.",
          "Dahl's conclusion is to use what you own.",
        ),
        fromList(
          "summary_completion",
          BAG_BANK,
          "Ireland introduced a fifteen-cent ______ at the till in 2002.",
          "charge",
          "In 2002 Ireland introduced a charge of fifteen cents on plastic shopping bags at the till.",
          "A charge was introduced.",
        ),
        fromList(
          "summary_completion",
          BAG_BANK,
          "The bag's secondary use as a bin liner shifted demand to ______ plastic.",
          "thicker",
          "Sales of purpose-made bin liners rose in several countries after a bag charge, by enough to offset part of the plastic saved, and the liners are thicker.",
          "The liners are thicker.",
        ),
        fromList(
          "summary_completion",
          BAG_BANK,
          "A cotton ______ bag must be used many times to justify itself.",
          "reusable",
          "A cotton tote bag takes far more energy and water to manufacture than a thin plastic one, and the number of uses required before it is environmentally preferable runs, in some analyses, into the thousands.",
          "The reusable bag needs many uses.",
        ),
        fromList(
          "summary_completion",
          BAG_BANK,
          "The bags cause ______ that is visible rather than large in quantity.",
          "litter",
          "Shopping bags are a fraction of one per cent of plastic production, and the litter they cause is visible rather than large.",
          "The litter is visible rather than large.",
        ),
        fromList(
          "summary_completion",
          BAG_BANK,
          "The measure shifted a mass ______ within a month.",
          "habit",
          "It showed governments that a small, well-placed, non-prohibitive measure could shift a mass habit in a month, which is a general finding about policy design and has been applied since to matters considerably more consequential than a bag.",
          "A mass habit shifted in a month.",
        ),
        mcq(
          "Why does the writer call the Irish result worth examining?",
          [
            "The effect was larger than the price could explain",
            "It was the first such charge anywhere",
            "The charge was unusually high",
            "Use fell only after several years",
          ],
          "The effect was larger than the price could explain",
          "The measure has since been copied in dozens of countries, and it is the most quoted example in the whole of behavioural policy, for a reason that is worth examining rather than repeating: the effect is far larger than the price can explain.",
          "The effect exceeds what the price explains.",
        ),
        mcq(
          "What does Salgado's comparison suggest the charge is doing?",
          [
            "Acting as a prompt rather than a cost",
            "Raising revenue for waste collection",
            "Changing the relative price of alternatives",
            "Deterring only the poorest shoppers",
          ],
          "Acting as a prompt rather than a cost",
          "His conclusion is that the price is doing the work of a prompt, and that a scheme designed on that understanding would look different from one designed to change relative costs.",
          "It does 'the work of a prompt'.",
        ),
        mcq(
          "What does the writer say about information campaigns?",
          [
            "None has produced a comparable behaviour change",
            "They were mistaken about the facts",
            "They preceded the charge in Ireland",
            "They worked better in wealthier countries",
          ],
          "None has produced a comparable behaviour change",
          "There is no information campaign about plastic that has achieved anything close to a ninety per cent behavioural change, and the campaigns were not wrong about the facts.",
          "No campaign came close.",
        ),
        mcq(
          "What does the writer consider the strongest case for the charge?",
          [
            "What it demonstrated about policy design",
            "The tonnage of plastic saved",
            "The revenue it raised",
            "The reduction in bin liner sales",
          ],
          "What it demonstrated about policy design",
          "The most defensible case for the charge is not the plastic saved but the demonstration: it showed governments that a small, well-placed, non-prohibitive measure could shift a mass habit in a month, which is a general finding about policy design and has been applied since to matters considerably more consequential than a bag.",
          "The demonstration is the strongest case.",
        ),
      ],
    },
    {
      key: "t92-p3-roundabouts",
      title: "The Junction Without Signals",
      topic: "a layout that removes the collisions that kill and keeps the ones that annoy",
      difficulty: 5,
      body: `A) A crossroads controlled by traffic lights permits a particular kind of collision. Two vehicles travelling at speed meet at an angle approaching ninety degrees, or one turning across the path of another meets it head-on. In both cases the impact is to the side of at least one vehicle, where the structure is thinnest and the occupant is closest to it, and the combined closing speed can be the sum of the two. These are the collisions that fill trauma wards, and the light that prevents them relies entirely on drivers obeying it. A signal that is ignored, or that fails, leaves the junction exactly as dangerous as it was before the signal was installed.

B) A roundabout removes the geometry. Every vehicle enters the circle travelling in the same direction, so a collision between two of them is a glancing impact at a low relative speed rather than a perpendicular one at a high speed. The entry is also, necessarily, a curve, which slows traffic without requiring anyone to be told to slow down. Studies across many countries find that converting a signalled junction to a roundabout reduces serious injuries and deaths by something in the region of three-quarters, while leaving the total number of collisions roughly unchanged or slightly higher. The minor scrapes remain. The fatal geometry has gone.

C) The modern form dates from a British rule change in 1966, which required traffic entering a circle to give way to traffic already on it. Before that, entering traffic had priority, and the results were poor: a busy circle filled up and locked, because vehicles could keep entering a circle that had nowhere to discharge. The reversal is the whole invention. It is a rule, not a structure, and it converted an existing and rather unsuccessful layout into the most reliably beneficial change available in junction design.

D) Adoption has been very uneven and the pattern is instructive. France, Britain and much of northern Europe built them in quantity. The United States built almost none until the 1990s and has been building them steadily since, encountering considerable public resistance in each new place, generally on the grounds that drivers will not understand them. Measured afterwards, the same communities report satisfaction rates well above what they predicted, which is a finding about the difficulty of imagining an unfamiliar arrangement rather than about roundabouts.

E) There are genuine costs. A roundabout occupies more land than a crossroads, and in a built-up area the land may not exist or may cost more than any safety benefit is valued at. Very high flows on one arm can be handled better by signals, which can allocate time deliberately, whereas a roundabout allocates it by whoever arrives. Large roundabouts with several lanes reintroduce complexity and lose part of the advantage, which is why the trend has been towards smaller ones, and towards a variant with signals on the approaches for the busiest hours only. A design that is safest when it is small is an awkward one to offer an authority whose problem is volume.

F) The unresolved problem is people not in cars. A driver approaching a roundabout is looking right, at the circulating traffic, and a pedestrian or cyclist crossing the entry is to the left and behind the direction of attention. Cyclist injury rates at roundabouts are, in several studies, worse than at the signalled junctions they replaced, and the designs that fix this — a separate cycle track set back from the entry, with its own priority — cost more land again and are common only in a few countries. A layout that is much safer for the people inside vehicles and not safer for the people outside them is a real result and not a comfortable one.

G) The general point the case illustrates is about where safety comes from. The roundabout does not make drivers more careful, warn them, or punish them. It removes the possibility of the dangerous manoeuvre by making the road a shape in which that manoeuvre does not arise, and it keeps working during a power cut, in fog, and when a driver is not paying attention. Engineers call this passive safety, and it is consistently more effective than anything that depends on behaviour, which is why the most useful question about a dangerous junction is rarely how to make people drive better.`,
      questions: [
        fromList(
          "matching_information",
          ROUNDABOUT_PARAGRAPHS,
          "a rule reversal that made an existing layout work",
          "C",
          "The modern form dates from a British rule change in 1966, which required traffic entering a circle to give way to traffic already on it.",
          "Paragraph C describes the 1966 rule change.",
        ),
        fromList(
          "matching_information",
          ROUNDABOUT_PARAGRAPHS,
          "communities being more satisfied than they had predicted",
          "D",
          "Measured afterwards, the same communities report satisfaction rates well above what they predicted, which is a finding about the difficulty of imagining an unfamiliar arrangement rather than about roundabouts.",
          "Paragraph D reports the satisfaction gap.",
        ),
        fromList(
          "matching_information",
          ROUNDABOUT_PARAGRAPHS,
          "a case where the traffic signal handles the flow better",
          "E",
          "Very high flows on one arm can be handled better by signals, which can allocate time deliberately, whereas a roundabout allocates it by whoever arrives.",
          "Paragraph E concedes the high-flow case.",
        ),
        fromList(
          "matching_information",
          ROUNDABOUT_PARAGRAPHS,
          "why a driver's attention is directed away from a crossing cyclist",
          "F",
          "A driver approaching a roundabout is looking right, at the circulating traffic, and a pedestrian or cyclist crossing the entry is to the left and behind the direction of attention.",
          "Paragraph F explains the direction of attention.",
        ),
        fromList(
          "matching_information",
          ROUNDABOUT_PARAGRAPHS,
          "an explanation of why side impacts are so damaging",
          "A",
          "In both cases the impact is to the side of at least one vehicle, where the structure is thinnest and the occupant is closest to it, and the combined closing speed can be the sum of the two.",
          "Paragraph A explains the side impact.",
        ),
        ynng(
          "The writer thinks the number of collisions falls when a junction is converted.",
          "NO",
          "Studies across many countries find that converting a signalled junction to a roundabout reduces serious injuries and deaths by something in the region of three-quarters, while leaving the total number of collisions roughly unchanged or slightly higher.",
          "The total is unchanged or slightly higher.",
        ),
        ynng(
          "The writer regards public opposition to new roundabouts as well founded.",
          "NO",
          "Measured afterwards, the same communities report satisfaction rates well above what they predicted, which is a finding about the difficulty of imagining an unfamiliar arrangement rather than about roundabouts.",
          "The opposition is not borne out afterwards.",
        ),
        ynng(
          "The writer accepts that roundabouts have not solved the problem for cyclists.",
          "YES",
          "A layout that is much safer for the people inside vehicles and not safer for the people outside them is a real result and not a comfortable one.",
          "The writer states it plainly.",
        ),
        ynng(
          "The writer believes measures that depend on driver behaviour work as well as ones that do not.",
          "NO",
          "Engineers call this passive safety, and it is consistently more effective than anything that depends on behaviour, which is why the most useful question about a dangerous junction is rarely how to make people drive better.",
          "Passive safety is 'consistently more effective'.",
        ),
        fromList(
          "matching_sentence_endings",
          ROUNDABOUT_ENDINGS,
          "The dangerous kind of impact cannot occur,",
          "because a vehicle joining a circle never crosses the path of oncoming traffic.",
          "Every vehicle enters the circle travelling in the same direction, so a collision between two of them is a glancing impact at a low relative speed rather than a perpendicular one at a high speed.",
          "All traffic travels the same way.",
        ),
        fromList(
          "matching_sentence_endings",
          ROUNDABOUT_ENDINGS,
          "Injury figures improve while collision counts do not,",
          "which is why the severe collisions largely disappear and the minor ones do not.",
          "The minor scrapes remain. The fatal geometry has gone.",
          "The minor collisions remain.",
        ),
        fromList(
          "matching_sentence_endings",
          ROUNDABOUT_ENDINGS,
          "Early circles used to lock solid at busy times,",
          "until the entry rule was reversed to give priority to the circulating traffic.",
          "Before that, entering traffic had priority, and the results were poor: a busy circle filled up and locked, because vehicles could keep entering a circle that had nowhere to discharge.",
          "The fix was to reverse the priority.",
        ),
        fromList(
          "matching_sentence_endings",
          ROUNDABOUT_ENDINGS,
          "An urban junction is often left as it is,",
          "which makes the land it occupies the usual reason for refusing one.",
          "A roundabout occupies more land than a crossroads, and in a built-up area the land may not exist or may cost more than any safety benefit is valued at.",
          "Land is the binding objection.",
        ),
        fromList(
          "matching_sentence_endings",
          ROUNDABOUT_ENDINGS,
          "The safety gain is not shared equally,",
          "although a driver on foot or on a bicycle gains far less from the change.",
          "Cyclist injury rates at roundabouts are, in several studies, worse than at the signalled junctions they replaced, and the designs that fix this — a separate cycle track set back from the entry, with its own priority — cost more land again and are common only in a few countries.",
          "Cyclists may be worse off.",
        ),
      ],
    },
  ],
};
