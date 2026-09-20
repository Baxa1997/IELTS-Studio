import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · transport history · notes box ------------------------------

const GAUGE_NOTES = {
  title: "Why the narrow width won",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · design standards · people and a word bank -----------------

const PAPER_PEOPLE = ["Lena Brandt", "Hugo Sartori", "Priya Raghavan", "Kenji Morikawa"];
const PAPER_BANK = [
  "halving",
  "ratio",
  "enlarge",
  "square",
  "legal",
  "weight",
  "printers",
  "margins",
  "inches",
];

// ---- Passage 3 · telecommunications policy · lettered paragraphs -----------

const SPECTRUM_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SPECTRUM_ENDINGS = [
  "because two transmitters on one frequency destroy each other's signal.",
  "which meant the earliest allocations were made almost at random.",
  "since a band already occupied is worth more to clear than an empty one.",
  "although nobody can say in advance what the winner will do with it.",
  "because the physics of a frequency decides what it is good for.",
  "even though the equipment to use those frequencies did not yet exist.",
  "which is why an unlicensed band produced more than any auction did.",
];

export const TEST_84: CuratedTest = {
  key: "full-test-84",
  targetBand: 6,
  passages: [
    {
      key: "t84-p1-railway-gauge",
      title: "The Width Between the Rails",
      topic: "how an arbitrary measurement became one of the most expensive decisions ever made",
      difficulty: 5,
      body: `The distance between the inner faces of the two rails on most of the world's railways is 1,435 millimetres, or four feet eight and a half inches. It is a strange number, and there is no engineering reason for it. It is roughly the width of the wagonways that carried coal out of the mines of north-east England, which was roughly the width convenient for a horse walking between shafts, and George Stephenson used it on the first public railways because it was the width he already knew. About sixty per cent of the world's track is built to it today.

It was not obvious at the time that a single width mattered. Early railways were short, local and unconnected, built to carry a particular cargo from a particular place to a particular port. Isambard Kingdom Brunel, designing the Great Western Railway in the 1830s, chose a gauge of just over seven feet on deliberate technical grounds: a wider vehicle is more stable, can carry more, and can be run faster with less wear. He was right about all of it. The Great Western was the smoothest and fastest railway in the world for a generation.

He lost anyway, and the reason had nothing to do with engineering. As the network grew, the places where two companies' tracks met became the whole problem. At a break of gauge, every passenger had to change trains and every item of freight had to be unloaded from one wagon and loaded into another. The delay and the cost of transhipment were enormous, and they fell on the traffic rather than on the company that had chosen the odd width. A British parliamentary commission examined the question in 1845, found the broad gauge technically superior, and recommended the narrow one anyway, because far more miles of it had already been laid. The Great Western converted its last broad-gauge line in 1892, in a single weekend, with four thousand men.

That sequence — a better standard losing to an entrenched one — has been used ever since as the textbook illustration of what economists call network effects. The value of a piece of track depends not on its own quality but on what it connects to, so the width already laid has an advantage that grows with every mile added to it. A competing standard has to be not slightly better but overwhelmingly better, and even then it usually has to start in a territory where the incumbent is absent.

Which is what happened wherever railways arrived late. Russia built to a wider gauge, and the difference persists at its borders today; Spain and Portugal did the same. Ireland, Argentina and India chose other widths again. India ended up with four gauges in use simultaneously, the legacy of different companies and different periods, and has spent decades and a very large sum converting almost all of them to one, a project it calls unigauge. Australia managed to give three neighbouring colonies three different gauges, so that until 1962 a journey from Sydney to Melbourne involved changing trains at the state line at two in the morning.

The narrow gauges were not all mistakes. A metre-gauge or two-foot line can follow tighter curves, needs less earthwork, and costs perhaps half as much to build through mountains. Where the traffic was light and the terrain difficult, that was the right choice, and many such lines paid for themselves in a way a standard-gauge line never would have. The error, where there was one, was in assuming a light railway would stay light. Lines built cheaply to carry tea or sugar found themselves, fifty years later, carrying everything, at which point the saving became the constraint.

The modern echo is visible in high-speed rail. A high-speed line is built to standard gauge in most countries even where the existing network is not, because the trains must be able to run onto ordinary track at the ends of the route. Spain, having built its old network broad, built its high-speed lines standard and then had to invent trains that change gauge while moving, at low speed, through a trackside device. That such a machine exists and works is a considerable achievement. That it was necessary is the consequence of a decision made in the 1840s about how far apart to put two pieces of iron.`,
      questions: [
        tfng(
          "The standard gauge was chosen for sound engineering reasons.",
          "FALSE",
          "It is a strange number, and there is no engineering reason for it.",
          "'There is no engineering reason for it.'",
        ),
        tfng(
          "Brunel's wider gauge performed better than the standard one.",
          "TRUE",
          "He was right about all of it.",
          "The writer says he was right about all of it.",
        ),
        tfng(
          "The 1845 commission recommended the gauge it judged technically worse.",
          "TRUE",
          "A British parliamentary commission examined the question in 1845, found the broad gauge technically superior, and recommended the narrow one anyway, because far more miles of it had already been laid.",
          "It recommended the narrow gauge regardless.",
        ),
        tfng(
          "The costs of a break of gauge fell mainly on the company with the unusual width.",
          "FALSE",
          "The delay and the cost of transhipment were enormous, and they fell on the traffic rather than on the company that had chosen the odd width.",
          "They fell on the traffic, not the company.",
        ),
        tfng(
          "India has used more than one gauge at the same time.",
          "TRUE",
          "India ended up with four gauges in use simultaneously, the legacy of different companies and different periods, and has spent decades and a very large sum converting almost all of them to one, a project it calls unigauge.",
          "Four were in use simultaneously.",
        ),
        tfng(
          "Every narrow-gauge line was a mistake.",
          "FALSE",
          "The narrow gauges were not all mistakes.",
          "'The narrow gauges were not all mistakes.'",
        ),
        tfng(
          "China chose standard gauge for its first railways.",
          "NOT GIVEN",
          "",
          "The passage lists several countries' choices but does not mention China.",
        ),
        noteLine(
          GAUGE_NOTES,
          null,
          "At a break of gauge, freight had to undergo ______",
          "transhipment",
          "The delay and the cost of transhipment were enormous, and they fell on the traffic rather than on the company that had chosen the odd width.",
          "Freight had to be transhipped.",
          { before: [{ text: "The mechanism that decided it:", indent: 0 }] },
        ),
        noteLine(
          GAUGE_NOTES,
          null,
          "More ______ of the narrow width had already been laid",
          "miles",
          "A British parliamentary commission examined the question in 1845, found the broad gauge technically superior, and recommended the narrow one anyway, because far more miles of it had already been laid.",
          "Far more miles were already laid.",
        ),
        noteLine(
          GAUGE_NOTES,
          null,
          "Economists call the resulting advantage a ______ effect",
          "network",
          "That sequence — a better standard losing to an entrenched one — has been used ever since as the textbook illustration of what economists call network effects.",
          "They are called network effects.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "A narrow line can follow tighter ______ than a wide one.",
          "curves",
          "A metre-gauge or two-foot line can follow tighter curves, needs less earthwork, and costs perhaps half as much to build through mountains.",
          "It can follow tighter curves.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The mistake was assuming a light railway would remain ______.",
          "light",
          "The error, where there was one, was in assuming a light railway would stay light.",
          "The assumption was that it would stay light.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Spanish trains alter their gauge while ______ through a trackside device.",
          "moving",
          "Spain, having built its old network broad, built its high-speed lines standard and then had to invent trains that change gauge while moving, at low speed, through a trackside device.",
          "They change gauge while moving.",
        ),
      ],
    },
    {
      key: "t84-p2-paper-sizes",
      title: "The Sheet That Halves Into Itself",
      topic:
        "a standard designed around a single mathematical property, and the country that ignored it",
      difficulty: 6,
      body: `Fold a sheet of A4 paper in half across its longer side and the result is a smaller rectangle of exactly the same proportions. Fold it again and the same is true. This property is not a coincidence and it is not an approximation: it is the whole design. A rectangle keeps its shape under halving if and only if its longer side is the square root of two times its shorter side, about 1.414, and every sheet in the A series has precisely that ratio. A0 is defined as the sheet with that ratio whose area is one square metre. A1 is A0 halved, A4 is A0 halved four times, and the arithmetic runs all the way down.

Lena Brandt, a design historian, traces the idea to a letter written by the German physicist Georg Lichtenberg in 1786, in which he works out the ratio and remarks on how convenient it would be. Nothing came of it for well over a century. The standard was actually issued in Germany in 1922, by a committee looking for ways to reduce waste in printing, and spread through Europe over the following decades. She notes that it is one of very few standards adopted because the underlying mathematics was elegant rather than because an industry demanded it, and that the elegance turned out to be genuinely useful rather than merely satisfying.

The usefulness is mostly in reproduction. Because every size in the series shares one ratio, an image laid out for one size fits any other with no cropping and no blank strip, at a scale factor that is always a power of the square root of two. Reducing A3 to A4 is a single setting, marked on every photocopier in the countries that use the system. Hugo Sartori, who worked for years in commercial printing, describes the practical gain as the elimination of a class of mistake rather than a saving of time: with a coherent series nobody has to decide what to do with the leftover margin, because there is never any leftover.

The paper trade gained a second convenience almost by accident. Since A0 is one square metre, and the sizes halve, the weight of any sheet follows immediately from the paper's grammage. A sheet of A4 in eighty-gram paper weighs five grams, because A4 is one-sixteenth of a square metre. Priya Raghavan, who works on postal logistics, points out that this is why postage in much of the world can be estimated by counting sheets, and that the convenience is invisible until one works in a country where it does not hold.

That country, principally, is the United States, where Letter size measures eight and a half by eleven inches, a ratio of about 1.294, which does not survive halving. Canada, Mexico, and parts of South America follow it. The origin of the American dimensions is not well documented, which Kenji Morikawa, a standards researcher, considers the most interesting thing about them: the most-used paper size in the largest economy on earth has no agreed explanation, only competing stories about the size of a vat, a mould or a nineteenth-century government order. He regards it as a useful corrective to the idea that widely used standards must have been chosen for a reason.

Attempts to converge have failed, and the reason is not stubbornness but filing cabinets. Changing a paper size means changing every drawer, folder, binder, envelope, printer tray, form and archive in the country, all at once, because a mixed system is worse than either pure one. The cost is enormous, it falls immediately, and the benefit is small and spread over decades. Most software now solves the problem by scaling a document at the moment of printing, which papers over the difference well enough that the incentive to fix it properly has gone.

A final oddity deserves mention. The B series, which sits between the A sizes, and the C series, used for envelopes, exist to complete the system: a C4 envelope holds an A4 sheet unfolded, a C5 holds it folded once. Almost nobody outside the stationery trade knows this, and the design is doing its work invisibly every time a letter fits its envelope without being forced. Good standards are like that. They are noticed only where they are absent.`,
      questions: [
        fromList(
          "matching_features",
          PAPER_PEOPLE,
          "The standard was adopted for the beauty of its mathematics.",
          "Lena Brandt",
          "She notes that it is one of very few standards adopted because the underlying mathematics was elegant rather than because an industry demanded it, and that the elegance turned out to be genuinely useful rather than merely satisfying.",
          "Brandt makes the point about elegance.",
        ),
        fromList(
          "matching_features",
          PAPER_PEOPLE,
          "The real gain is that a whole type of error disappears.",
          "Hugo Sartori",
          "Hugo Sartori, who worked for years in commercial printing, describes the practical gain as the elimination of a class of mistake rather than a saving of time: with a coherent series nobody has to decide what to do with the leftover margin, because there is never any leftover.",
          "Sartori describes an eliminated class of mistake.",
        ),
        fromList(
          "matching_features",
          PAPER_PEOPLE,
          "The advantage becomes obvious only where the system is missing.",
          "Priya Raghavan",
          "Priya Raghavan, who works on postal logistics, points out that this is why postage in much of the world can be estimated by counting sheets, and that the convenience is invisible until one works in a country where it does not hold.",
          "Raghavan notes it is invisible until absent.",
        ),
        fromList(
          "matching_features",
          PAPER_PEOPLE,
          "A very widely used standard has no documented reason behind it.",
          "Kenji Morikawa",
          "The origin of the American dimensions is not well documented, which Kenji Morikawa, a standards researcher, considers the most interesting thing about them: the most-used paper size in the largest economy on earth has no agreed explanation, only competing stories about the size of a vat, a mould or a nineteenth-century government order.",
          "Morikawa notes the missing explanation.",
        ),
        fromList(
          "summary_completion",
          PAPER_BANK,
          "A sheet keeps its shape under ______ only at one proportion.",
          "halving",
          "A rectangle keeps its shape under halving if and only if its longer side is the square root of two times its shorter side, about 1.414, and every sheet in the A series has precisely that ratio.",
          "Only one proportion survives halving.",
        ),
        fromList(
          "summary_completion",
          PAPER_BANK,
          "That proportion is the square root of two, and every A sheet shares the ______.",
          "ratio",
          "Because every size in the series shares one ratio, an image laid out for one size fits any other with no cropping and no blank strip, at a scale factor that is always a power of the square root of two.",
          "Every size shares one ratio.",
        ),
        fromList(
          "summary_completion",
          PAPER_BANK,
          "A0 has an area of one ______ metre.",
          "square",
          "A0 is defined as the sheet with that ratio whose area is one square metre.",
          "Its area is one square metre.",
        ),
        fromList(
          "summary_completion",
          PAPER_BANK,
          "A sheet's ______ therefore follows from the paper's grammage.",
          "weight",
          "Since A0 is one square metre, and the sizes halve, the weight of any sheet follows immediately from the paper's grammage.",
          "Weight follows from grammage.",
        ),
        fromList(
          "summary_completion",
          PAPER_BANK,
          "American Letter size is measured in ______ and does not halve cleanly.",
          "inches",
          "That country, principally, is the United States, where Letter size measures eight and a half by eleven inches, a ratio of about 1.294, which does not survive halving.",
          "It is given in inches.",
        ),
        mcq(
          "When was the A series actually issued as a standard?",
          ["In 1922 in Germany", "In 1786 in Germany", "In 1922 in France", "In 1786 in Britain"],
          "In 1922 in Germany",
          "The standard was actually issued in Germany in 1922, by a committee looking for ways to reduce waste in printing, and spread through Europe over the following decades.",
          "It was issued in Germany in 1922.",
        ),
        mcq(
          "Why does the writer say convergence has failed?",
          [
            "The physical cost of changing everything at once",
            "National pride in an existing size",
            "Disagreement about the correct ratio",
            "A shortage of suitable paper machines",
          ],
          "The physical cost of changing everything at once",
          "Changing a paper size means changing every drawer, folder, binder, envelope, printer tray, form and archive in the country, all at once, because a mixed system is worse than either pure one.",
          "Everything would have to change at once.",
        ),
        mcq(
          "What effect has printing software had on the problem?",
          [
            "It has removed the pressure to solve it",
            "It has made the difference more visible",
            "It has forced printers to adopt one series",
            "It has made scaling impossible",
          ],
          "It has removed the pressure to solve it",
          "Most software now solves the problem by scaling a document at the moment of printing, which papers over the difference well enough that the incentive to fix it properly has gone.",
          "The incentive to fix it 'has gone'.",
        ),
        mcq(
          "What is the purpose of the C series?",
          [
            "Envelopes sized to hold A sheets",
            "Sizes between the A and B series",
            "Card rather than paper",
            "Sheets for large technical drawings",
          ],
          "Envelopes sized to hold A sheets",
          "The B series, which sits between the A sizes, and the C series, used for envelopes, exist to complete the system: a C4 envelope holds an A4 sheet unfolded, a C5 holds it folded once.",
          "C sizes are the envelopes.",
        ),
      ],
    },
    {
      key: "t84-p3-radio-spectrum",
      title: "Dividing Up the Airwaves",
      topic: "an invisible resource that cannot be stored, moved or manufactured",
      difficulty: 7,
      body: `A) Radio spectrum is a peculiar kind of property. It cannot be manufactured, stored or moved; it is not used up by being used; and its usefulness depends entirely on nobody else using the same part of it in the same place at the same time. Two transmitters on one frequency in one area do not share the band: they wreck it, and neither signal can be recovered. Every system of spectrum management that has ever existed is an answer to that single physical fact.

B) The first answer was first come, first served. In the two decades after 1900, anybody with a transmitter used whatever frequency their equipment produced, and the result in busy ports was audible chaos, with amateur operators, naval stations and commercial traffic interfering with each other and occasionally with distress calls. National licensing followed, and then international allocation, in which a treaty conference divides the spectrum into bands reserved for broadcasting, aviation, maritime use, satellites, and so on. These allocations were made when the equipment to exploit the higher frequencies barely existed, which is why the tidy lower bands went to the services that were powerful in the 1920s and 1930s and remain with them.

C) How a licence within a band should be handed out is a separate question, and for most of the twentieth century the answer was a hearing. An applicant explained to a regulator why it deserved the frequency, and the regulator decided. The system was slow, opaque, and impossible to conduct without political influence, but it had one defensible feature: the regulator could ask what the public would get. What it could not do was find out what the licence was worth, since nobody was asked to pay anything approaching its value.

D) From 1994 onwards, most countries switched to auctions. The theory is straightforward: the bidder willing to pay most is the one expecting to make best use of the band, so an auction allocates efficiently and collects the value for the public at the same time. In practice auctions have raised extraordinary sums — the European third-generation mobile auctions of 2000 took well over a hundred billion euros in total — and the design of the auction turned out to matter enormously. Badly designed sales have been won by bidders who then could not afford to build anything, and the regulator has had no good options when that happens.

E) The hardest problem is not allocation but reallocation. Spectrum that was assigned to analogue television in 1950 is, by the physics, extremely valuable for mobile data, because signals at those frequencies travel far and penetrate buildings. Recovering it means switching off a service that millions of households depend on and that has no obligation to move. The digital television transitions of the 2000s were, in essence, enormous and expensive clearing operations, financed partly by the later sale of the cleared band. A band already occupied is thus worth more to clear than an empty band is to sell, which is not an intuition most people bring to the subject.

F) A quite different model has coexisted with all of this. Certain bands were set aside as unlicensed: anybody may transmit in them at low power under technical rules, with no licence and no protection from interference. These were, originally, the junk bands, the ones nobody wanted, partly because microwave ovens emit in one of them. What emerged in them was Wi-Fi, Bluetooth, cordless telephones, garage door openers and a large fraction of the world's short-range wireless traffic. By any measure of value created, the unlicensed bands have outperformed the auctioned ones, which is an uncomfortable result for a purely market-based view of the resource.

G) The lesson usually drawn is that neither model is correct in general. Exclusive licences suit services that need guaranteed quality over long distances and can pay for it; commons suit dense, local, low-power uses where the cost of coordination would exceed the cost of occasional interference. The current direction of policy is towards sharing arrangements that sit between the two, in which a band has a primary user and a database grants temporary access to others when and where the primary is not transmitting. Whether that can be made to work at scale is genuinely unsettled, and it is the question the next twenty years of the subject will be about.`,
      questions: [
        fromList(
          "matching_information",
          SPECTRUM_PARAGRAPHS,
          "an example of bands that were originally considered worthless",
          "F",
          "These were, originally, the junk bands, the ones nobody wanted, partly because microwave ovens emit in one of them.",
          "Paragraph F calls them the junk bands.",
        ),
        fromList(
          "matching_information",
          SPECTRUM_PARAGRAPHS,
          "the total raised by one generation of mobile licence sales",
          "D",
          "In practice auctions have raised extraordinary sums — the European third-generation mobile auctions of 2000 took well over a hundred billion euros in total — and the design of the auction turned out to matter enormously.",
          "Paragraph D gives the European total.",
        ),
        fromList(
          "matching_information",
          SPECTRUM_PARAGRAPHS,
          "a defence of the older method of awarding licences",
          "C",
          "The system was slow, opaque, and impossible to conduct without political influence, but it had one defensible feature: the regulator could ask what the public would get.",
          "Paragraph C names its one defensible feature.",
        ),
        fromList(
          "matching_information",
          SPECTRUM_PARAGRAPHS,
          "why the most convenient frequencies belong to long-established services",
          "B",
          "These allocations were made when the equipment to exploit the higher frequencies barely existed, which is why the tidy lower bands went to the services that were powerful in the 1920s and 1930s and remain with them.",
          "Paragraph B explains the historical allocation.",
        ),
        fromList(
          "matching_information",
          SPECTRUM_PARAGRAPHS,
          "the physical property that makes the resource unlike other assets",
          "A",
          "It cannot be manufactured, stored or moved; it is not used up by being used; and its usefulness depends entirely on nobody else using the same part of it in the same place at the same time.",
          "Paragraph A sets out what makes it peculiar.",
        ),
        ynng(
          "The writer thinks auction design is a minor technical detail.",
          "NO",
          "Badly designed sales have been won by bidders who then could not afford to build anything, and the regulator has had no good options when that happens.",
          "Bad design has produced serious failures.",
        ),
        ynng(
          "The writer accepts that clearing an occupied band can be worth more than selling an empty one.",
          "YES",
          "A band already occupied is thus worth more to clear than an empty band is to sell, which is not an intuition most people bring to the subject.",
          "The writer states it directly.",
        ),
        ynng(
          "The writer regards the success of the unlicensed bands as easy to reconcile with a market view of spectrum.",
          "NO",
          "By any measure of value created, the unlicensed bands have outperformed the auctioned ones, which is an uncomfortable result for a purely market-based view of the resource.",
          "It is 'an uncomfortable result'.",
        ),
        ynng(
          "The writer believes shared-access arrangements have been shown to work at scale.",
          "NO",
          "Whether that can be made to work at scale is genuinely unsettled, and it is the question the next twenty years of the subject will be about.",
          "It is 'genuinely unsettled'.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECTRUM_ENDINGS,
          "A frequency cannot simply be shared between users,",
          "because two transmitters on one frequency destroy each other's signal.",
          "Two transmitters on one frequency in one area do not share the band: they wreck it, and neither signal can be recovered.",
          "Neither signal can be recovered.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECTRUM_ENDINGS,
          "The international bands were divided up early,",
          "even though the equipment to use those frequencies did not yet exist.",
          "These allocations were made when the equipment to exploit the higher frequencies barely existed, which is why the tidy lower bands went to the services that were powerful in the 1920s and 1930s and remain with them.",
          "The equipment barely existed at the time.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECTRUM_ENDINGS,
          "An auction hands the band to the highest bidder,",
          "although nobody can say in advance what the winner will do with it.",
          "The theory is straightforward: the bidder willing to pay most is the one expecting to make best use of the band, so an auction allocates efficiently and collects the value for the public at the same time.",
          "The expectation of best use is only an expectation.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECTRUM_ENDINGS,
          "Television frequencies were expensive to recover,",
          "since a band already occupied is worth more to clear than an empty one.",
          "The digital television transitions of the 2000s were, in essence, enormous and expensive clearing operations, financed partly by the later sale of the cleared band.",
          "The clearing itself was the costly part.",
        ),
        fromList(
          "matching_sentence_endings",
          SPECTRUM_ENDINGS,
          "The bands nobody bid for became the most productive,",
          "which is why an unlicensed band produced more than any auction did.",
          "What emerged in them was Wi-Fi, Bluetooth, cordless telephones, garage door openers and a large fraction of the world's short-range wireless traffic.",
          "Those bands produced Wi-Fi and the rest.",
        ),
      ],
    },
  ],
};
